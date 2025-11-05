
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Constants ---
const GAME_DURATION = 45; // seconds
const BUBBLE_SPAWN_RATE = 300; // ms

type GameState = 'ready' | 'playing' | 'over';

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  color: string;
}

export default function BubblePopperPage() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const gameTimerRef = useRef<NodeJS.Timeout>();
  const bubbleSpawnerRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext | null>(null);

  const bubblesRef = useRef<Bubble[]>([]);

  // --- Sound Initialization & Effects ---
  useEffect(() => {
    // Safari requires a user gesture to start AudioContext, so we create it on first interaction.
    // We'll lazy-initialize it in the pop effect.
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playPopSound = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("AudioContext not supported.", e);
        return;
      }
    }
    const p = audioContextRef.current;
    if (p.state === 'suspended') {
      p.resume();
    }
    const o = p.createOscillator();
    const g = p.createGain();
    o.connect(g);
    g.connect(p.destination);
    o.frequency.value = 500 + Math.random() * 400; // Pitch variation
    g.gain.setValueAtTime(0.1, p.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, p.currentTime + 0.2);
    o.start(p.currentTime);
    o.stop(p.currentTime + 0.25);
  }, []);

  const spawnBubble = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = 20 + Math.random() * 30; // Radius from 20 to 50
    bubblesRef.current.push({
      x: Math.random() * (canvas.width - 2 * r) + r,
      y: canvas.height + r,
      r,
      speed: 1 + Math.random() * 2, // Speed from 1 to 3
      color: `hsla(${200 + Math.random() * 60}, 100%, 70%, 0.7)`
    });
  }, []);

  // --- Game Loop ---
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i];
      b.y -= b.speed;
      
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.4, b.r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
      ctx.fill();

      if (b.y < -b.r) {
        bubblesRef.current.splice(i, 1);
      }
    }
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // --- Game State Management ---
  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameState('playing');
    bubblesRef.current = [];

    // Start spawning bubbles
    bubbleSpawnerRef.current = setInterval(spawnBubble, BUBBLE_SPAWN_RATE);
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    // Start game timer
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimerRef.current);
          clearInterval(bubbleSpawnerRef.current);
          setGameState('over');
          // Don't stop animation, just bubble spawning
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [spawnBubble, gameLoop]);

  const resetGame = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (bubbleSpawnerRef.current) clearInterval(bubbleSpawnerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameState('ready');
    bubblesRef.current = [];

    // Clear canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // --- Canvas Setup & Resize ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (bubbleSpawnerRef.current) clearInterval(bubbleSpawnerRef.current);
    };
  }, []);

  // --- Input Handling ---
  const handlePop = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const event = 'touches' in e ? e.touches[0] : e;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i];
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) {
        bubblesRef.current.splice(i, 1);
        playPopSound();
        setScore(prev => prev + 1);
        if (navigator.vibrate) navigator.vibrate(50);
        break; // Only pop one bubble per click
      }
    }
  }, [gameState, playPopSound]);
  
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-4xl font-bold font-headline">Bubble Popper</h1>
      <Card className="w-full max-w-2xl text-center overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full h-[60vh] max-h-[700px] bg-gradient-to-b from-indigo-200 to-purple-200 dark:from-indigo-900/70 dark:to-purple-900/70 overflow-hidden cursor-pointer">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-white font-bold text-2xl" style={{textShadow: '0 0 6px rgba(0,0,0,0.4)'}}>
                {gameState === 'playing' ? `Score: ${score}` : ''}
            </div>
            <canvas 
              ref={canvasRef}
              className="w-full h-full"
              onClick={handlePop}
              onTouchStart={handlePop}
            />
            {gameState !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                {gameState === 'ready' && (
                  <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}>
                    <h2 className="text-3xl font-bold text-white mb-2">Pop the Bubbles!</h2>
                    <p className="text-white mb-4">You have {GAME_DURATION} seconds.</p>
                    <Button onClick={startGame} size="lg">Start Game</Button>
                  </motion.div>
                )}
                {gameState === 'over' && (
                  <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}>
                    <h2 className="text-3xl font-bold text-white mb-2">Time&apos;s up!</h2>
                    <p className="text-xl text-white mb-4">You popped {score} bubbles!</p>
                    <Button onClick={resetGame} size="lg">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Play Again
                    </Button>
                  </motion.div>
                )}
              </div>
            )}
            {gameState === 'playing' && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-white font-medium text-lg bg-black/20 px-3 py-1 rounded-full">
                Time Left: <span className="font-bold">{timeLeft}s</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    
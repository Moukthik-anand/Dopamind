
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import * as Tone from 'tone';
import { motion } from 'framer-motion';

// --- Types ---
interface Bubble {
  id: number;
  x: number; // pixel position
  y: number; // pixel position
  radius: number;
  speedY: number;
  wobbleX: number;
  wobbleSpeed: number;
  wobbleAngle: number;
  opacity: number;
  color: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

// --- Constants ---
const GAME_DURATION = 45; // seconds
const BUBBLE_COUNT = 20;
const BUBBLE_SIZES = { min: 20, max: 60 }; // pixels
const BUBBLE_SPEEDS = { min: 2, max: 6 }; // pixels per frame

type GameState = 'ready' | 'playing' | 'over';

export default function BubblePopperPage() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  const bubblesRef = useRef<Bubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const gameTimerRef = useRef<NodeJS.Timeout>();
  const synthRef = useRef<Tone.Synth | null>(null);

  // --- Sound Initialization ---
  useEffect(() => {
    synthRef.current = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.1 },
    }).toDestination();
    return () => synthRef.current?.dispose();
  }, []);

  const playPopSound = useCallback(() => {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    synthRef.current?.triggerAttackRelease('C5', '16n');
  }, []);

  // --- Bubble & Particle Creation ---
  const createBubble = useCallback((canvas: HTMLCanvasElement): Bubble => {
    const radius = Math.random() * (BUBBLE_SIZES.max - BUBBLE_SIZES.min) + BUBBLE_SIZES.min;
    return {
      id: Math.random(),
      x: Math.random() * canvas.width,
      y: canvas.height + radius, // Start below screen
      radius,
      speedY: Math.random() * (BUBBLE_SPEEDS.max - BUBBLE_SPEEDS.min) + BUBBLE_SPEEDS.min,
      wobbleX: (Math.random() - 0.5) * 2, // -1 to 1
      wobbleSpeed: Math.random() * 0.05,
      wobbleAngle: Math.random() * Math.PI * 2,
      opacity: 0.6 + Math.random() * 0.3,
      color: `hsl(${200 + Math.random() * 60}, 80%, 70%)`,
    };
  }, []);
  
  const createParticles = (x: number, y: number) => {
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particlesRef.current.push({
            id: Math.random(),
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3 + 1,
            opacity: 1,
        });
    }
  };


  // --- Game Loop (Canvas Drawing) ---
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & draw bubbles
    bubblesRef.current.forEach((b, index) => {
      b.y -= b.speedY;
      b.wobbleAngle += b.wobbleSpeed;
      const currentWobble = Math.sin(b.wobbleAngle) * b.wobbleX * b.radius * 0.1;
      b.x += currentWobble;

      // Respawn bubble if it goes off-screen
      if (b.y < -b.radius) {
        bubblesRef.current[index] = createBubble(canvas);
      }

      ctx.save();
      ctx.globalAlpha = b.opacity;
      
      // Bubble Body
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();

      // Bubble Highlight
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.4, b.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
      ctx.fill();

      ctx.restore();
    });
    
    // Update & draw particles
    particlesRef.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.04;
        if(p.opacity <= 0) {
            particlesRef.current.splice(index, 1);
        }
        
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
        ctx.restore();
    });

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [createBubble]);

  // --- Game State Management ---
  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameState('playing');
    
    bubblesRef.current = Array.from({ length: BUBBLE_COUNT }, () => createBubble(canvas));
    particlesRef.current = [];

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimerRef.current);
          setGameState('over');
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [createBubble, gameLoop]);

  const resetGame = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameState('ready');
    
    bubblesRef.current = [];
    particlesRef.current = [];
  }, []);

  // --- Canvas & Animation Setup ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle resizing
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // --- Input Handling ---
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check from back to front to pop the top-most bubble
    let bubblePopped = false;
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i];
      const distance = Math.sqrt((x - b.x) ** 2 + (y - b.y) ** 2);
      
      if (distance < b.radius) {
        playPopSound();
        setScore(prev => prev + 1);
        if (navigator.vibrate) navigator.vibrate(50);

        createParticles(b.x, b.y);
        bubblesRef.current.splice(i, 1); // Remove popped bubble

        // Respawn a new one after a delay
        setTimeout(() => {
            if (gameState === 'playing' && bubblesRef.current.length < BUBBLE_COUNT) {
                bubblesRef.current.push(createBubble(canvas));
            }
        }, 1000);
        
        bubblePopped = true;
        break; // Only pop one bubble per click
      }
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold font-headline">Bubble Popper</h1>
      <Card className="w-full max-w-2xl text-center overflow-hidden">
        <CardHeader>
          <CardTitle>Score: {score}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[60vh] max-h-[700px] bg-gradient-to-b from-indigo-200 to-purple-200 dark:from-indigo-900/70 dark:to-purple-900/70 rounded-lg overflow-hidden cursor-pointer">
            <canvas 
              ref={canvasRef}
              className="w-full h-full"
              onClick={handleCanvasClick}
            />
            {gameState !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg z-10">
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
          </div>
          
          {gameState === 'playing' && (
            <div className="mt-4 text-lg font-medium text-muted-foreground">
              Time Left: <span className="font-bold">{timeLeft}s</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    
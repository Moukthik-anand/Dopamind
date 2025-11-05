
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Award } from 'lucide-react';
import * as Tone from 'tone';
import { motion } from 'framer-motion';

// --- Types ---
interface Bubble {
  id: number;
  x: number; // 0 to 100 (vw)
  y: number; // 0 to 100 (vh)
  size: number; // vw
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
  color: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

// --- Constants ---
const GAME_DURATION = 45; // seconds
const BUBBLE_COUNT = 20; // 15-25 range
const BUBBLE_SIZES = { min: 4, max: 10 }; // vw
const BUBBLE_SPEEDS = { min: 0.05, max: 0.15 }; // vh per frame
const POP_SOUND_URL =
  'data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABgAAABkYXRhJAEAAIAAe/7/hP+O/43/j/+//3j/Qf+x/7b/yP/A/7T/ov+q/63/uv+5/7v/uv+y/6f/oP+c/5//n/+h/6j/sP+4/8L/0f/c/9v/1P/U/9T/1//Z/97/5//t//n/+v/8//7/AQAJACoAOgBDAEwAUgBaAFwAXgBgAGIAZgBqAGwAbgBwAHIAcwB1AHcAeQB7AH4AgwCHAIwAkgCWAJsAnQCgAKsAtgC/AMgA0QDUANoA3gDkAO4A9wD/AQQBDwEZASQBKgEyATgBPgFFAU0BVQFgAWoBdAGCAY8BoAGrAbIBuAHBAcwB0QHXAeEB5wHyAfsCBgMbAyADIgMvAzcDRQNSA1kDXgNrA3UDfgOCA4wDmgOeA6cDqwOyA7sDyAPTA9kDAQQdBCYEKgQwBDcERQRNA1gDWgNcA2YDbANyA3sDgAOHA5ADlgOaA50DnwOhA6cDqQOrA60DswO4A7sDxAPTA9kDAQQcBCgEMgQ+BEoETQRbBGgEbQRzBHsEgASGBJMElwSgBKMEpQSpBKsErQSzBLYEngSjBKEEnwSbBJsEmQSaBJoElwSXBI8EjwSKBIkEigSHBIcEhgSEBIQEg/T9Kv0L+9v5U/fT8P/xT/Dv7v/sT/Kv6f/nj+Aj2kPJ07VDkO+CG2VfLq7x/q5+lH5LfgK90L2UvWP9ADzMvJ97wPsC+uH6cfl990X1K/Jb8l/w//O/8L//P+w/7L/u//A/8T/1//j/+//DwBnAEsAVABfAGUAawBvAHcAfACDAIsAkwCbAKQAqwCzA MMA0QDXAOIA7gD7AQQBGAElASwBNgFEAVMBYAFtAYIBjAGdAbEBugHJAdoB5QH0AQUCDgMaAyIDLgM9A0gDUwNdA20DeAOIA5QDnwOpA7MDvgPQA98DAAQeBCsEMgRBBE4EWQRqBHMEewSCBIsEngSnBKsEtgS/BMoE1wTYBN4E5ATuBP0FAQYDBhEGGAwhDC4MPgRNBFAESQRLBEsETgRPBFAEUQRRBFEETwROBE0ETgRNBFAEUQRTBFQFVwVdBWwFZwVzBXYFdwWGBIkCfwL5//r/+P/6//b/+f/4//7/AgUHEw8TFRgXGRsaHB0dHh4eHh4fICAgISEhIiIjJCQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1VWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==';

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
  const createBubble = (): Bubble => {
    const size = Math.random() * (BUBBLE_SIZES.max - BUBBLE_SIZES.min) + BUBBLE_SIZES.min;
    return {
      id: Math.random(),
      x: Math.random() * 100,
      y: 100 + size, // Start below screen
      size,
      speed: Math.random() * (BUBBLE_SPEEDS.max - BUBBLE_SPEEDS.min) + BUBBLE_SPEEDS.min,
      wobble: Math.random() * 2 - 1, // -1 to 1
      wobbleSpeed: Math.random() * 0.02,
      opacity: 0.6 + Math.random() * 0.3,
      color: `hsl(${200 + Math.random() * 60}, 80%, 70%)`,
    };
  };
  
  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        particlesRef.current.push({
            id: Math.random(),
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2 + 1,
            opacity: 1,
        });
    }
  };


  // --- Game Loop ---
  const gameLoop = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & draw bubbles
    bubblesRef.current.forEach((b, index) => {
      b.y -= b.speed;
      b.x += Math.sin(b.y * b.wobbleSpeed) * b.wobble * 0.1;

      if (b.y < -b.size) { // Reset bubble when it goes off-screen
        bubblesRef.current[index] = createBubble();
      }

      ctx.beginPath();
      ctx.arc(b.x * canvas.width / 100, b.y * canvas.height / 100, b.size * canvas.width / 100, 0, Math.PI * 2);
      ctx.fillStyle = `${b.color.slice(0,-1)}, ${b.opacity})`;
      ctx.fill();
      // Highlight
      ctx.beginPath();
      ctx.arc((b.x - b.size * 0.2) * canvas.width / 100, (b.y - b.size * 0.3) * canvas.height / 100, b.size * canvas.width / 100 * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
      ctx.fill();
    });
    
    // Update & draw particles
    particlesRef.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.04;
        if(p.opacity <= 0) {
            particlesRef.current.splice(index, 1);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
    });

    animationFrameRef.current = requestAnimationFrame(() => gameLoop(ctx, canvas));
  }, []);

  // --- Game State Management ---
  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    bubblesRef.current = Array.from({ length: BUBBLE_COUNT }, createBubble);
    particlesRef.current = [];
    setGameState('playing');

    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimerRef.current);
          setGameState('over');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetGame = () => {
    setGameState('ready');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    bubblesRef.current = [];
    particlesRef.current = [];
  };

  // --- Canvas & Animation Setup ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && gameState === 'playing') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Handle resizing
        const resizeCanvas = () => {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        animationFrameRef.current = requestAnimationFrame(() => gameLoop(ctx, canvas));
        
        return () => {
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          if (gameTimerRef.current) clearInterval(gameTimerRef.current);
          window.removeEventListener('resize', resizeCanvas);
        };
      }
    } else {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  }, [gameState, gameLoop]);

  // --- Input Handling ---
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check from back to front to pop the top-most bubble
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i];
      const bubbleX = b.x * canvas.clientWidth / 100;
      const bubbleY = b.y * canvas.clientHeight / 100;
      const bubbleRadius = b.size * canvas.clientWidth / 100;
      const distance = Math.sqrt((x - bubbleX) ** 2 + (y - bubbleY) ** 2);
      
      if (distance < bubbleRadius) {
        playPopSound();
        setScore(prev => prev + 1);
        if (navigator.vibrate) navigator.vibrate(50);

        createParticles(bubbleX, bubbleY, b.color);
        bubblesRef.current.splice(i, 1); // Remove popped bubble

        // Respawn a new one after a delay
        setTimeout(() => {
            if (gameState === 'playing' && bubblesRef.current.length < BUBBLE_COUNT) {
                bubblesRef.current.push(createBubble());
            }
        }, 1000);
        
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
          <div className="relative w-full h-[60vh] max-h-[700px] bg-gradient-to-b from-indigo-200 to-purple-200 dark:from-indigo-900/70 dark:to-purple-900/70 rounded-lg overflow-hidden">
            <canvas 
              ref={canvasRef}
              className="w-full h-full"
              onMouseDown={handleCanvasClick}
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

    
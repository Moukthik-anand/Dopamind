"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Tone from 'tone';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

const GAME_DURATION = 30; // seconds

export default function BubblePopperPage() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const popSound = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    // Initialize synth
    popSound.current = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 },
    }).toDestination();

    return () => {
      popSound.current?.dispose();
    };
  }, []);
  
  const playPopSound = useCallback((size: number) => {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    const freq = 440 + (50 - size) * 5;
    popSound.current?.triggerAttackRelease(freq, '8n');
  }, []);

  const createBubble = useCallback(() => {
    if (!gameAreaRef.current) return;
    const { width, height } = gameAreaRef.current.getBoundingClientRect();
    const size = Math.random() * 30 + 20; // 20px to 50px
    const newBubble: Bubble = {
      id: Date.now() + Math.random(),
      x: Math.random() * (width - size),
      y: height,
      size,
      color: `hsl(${Math.random() * 360}, 70%, 70%)`,
    };
    setBubbles(prev => [...prev, newBubble]);
  }, []);

  const startGame = () => {
    setScore(0);
    setBubbles([]);
    setTimeLeft(GAME_DURATION);
    setGameState('playing');
  };

  const resetGame = () => {
    setGameState('ready');
    setScore(0);
    setBubbles([]);
    setTimeLeft(GAME_DURATION);
  }

  useEffect(() => {
    if (gameState === 'playing') {
      bubbleIntervalRef.current = setInterval(createBubble, 500);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('over');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (bubbleIntervalRef.current) clearInterval(bubbleIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (bubbleIntervalRef.current) clearInterval(bubbleIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, createBubble]);

  const popBubble = (id: number, size: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + Math.ceil(50 / size * 10));
    playPopSound(size);
  };
  
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold font-headline">Bubble Popper</h1>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Pop 'em!</CardTitle>
          <CardDescription>Click on the bubbles to pop them before they float away.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-lg font-medium">
                <Award className="w-5 h-5 text-primary" />
                Score: {score}
            </div>
            <div className="flex items-center gap-2 text-lg font-medium">
                <Clock className="w-5 h-5 text-primary" />
                Time: {timeLeft}s
            </div>
          </div>

          <Progress value={(timeLeft / GAME_DURATION) * 100} className="mb-4" />

          <div 
            ref={gameAreaRef} 
            className="relative w-full h-[400px] bg-muted/30 rounded-lg overflow-hidden border"
          >
            <AnimatePresence>
              {bubbles.map(bubble => (
                <motion.div
                  key={bubble.id}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: -500 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: Math.random() * 3 + 4, ease: 'linear' }}
                  onAnimationComplete={() => setBubbles(prev => prev.filter(b => b.id !== bubble.id))}
                  onClick={() => popBubble(bubble.id, bubble.size)}
                  className="absolute rounded-full cursor-pointer"
                  style={{
                    left: bubble.x,
                    bottom: 0,
                    width: bubble.size,
                    height: bubble.size,
                    background: `radial-gradient(circle at 65% 15%, white 1px, ${bubble.color} 80%, transparent 100%)`,
                    filter: 'brightness(1.1)',
                  }}
                />
              ))}
            </AnimatePresence>
            
            {gameState !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
                {gameState === 'ready' && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to pop?</h2>
                    <Button onClick={startGame} size="lg">Start Game</Button>
                  </>
                )}
                {gameState === 'over' && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
                    <p className="text-xl text-white mb-4">Your final score is: {score}</p>
                    <Button onClick={resetGame} size="lg">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Play Again
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, Award } from 'lucide-react';
import * as Tone from 'tone';

interface Bubble {
  id: number;
  x: number;
  size: number;
  color: string;
}

const GAME_DURATION = 30; // seconds
const INITIAL_BUBBLE_COUNT = 7;

export default function BubblePopperPage() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const synth = useRef<Tone.Synth | null>(null);

  // Initialize sound synthesizer
  useEffect(() => {
    synth.current = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 },
    }).toDestination();
    return () => synth.current?.dispose();
  }, []);
  
  const playPopSound = useCallback(() => {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    // A soft, pleasant pop sound
    synth.current?.triggerAttackRelease('C5', '8n');
  }, []);

  const createBubble = useCallback(() => {
    if (!gameAreaRef.current) return { id: 0, x: 0, size: 0, color: ''};
    const { width } = gameAreaRef.current.getBoundingClientRect();
    const size = Math.random() * 40 + 20; // 20px to 60px
    return {
      id: Date.now() + Math.random(),
      x: Math.random() * (width - size),
      size,
      color: `hsl(${200 + Math.random() * 40}, 80%, 70%)`, // Shades of blue/purple
    };
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBubbles(Array.from({ length: INITIAL_BUBBLE_COUNT }, createBubble));
    setGameState('playing');
  }, [createBubble]);

  const resetGame = () => {
    setGameState('ready');
    setScore(0);
    setBubbles([]);
    setTimeLeft(GAME_DURATION);
  }

  // Game timer logic
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState('over');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const popBubble = (id: number) => {
    // Only pop during the 'playing' state
    if (gameState !== 'playing') return;

    playPopSound();
    setScore(prev => prev + 1);
    
    // Remove the popped bubble
    setBubbles(prev => prev.filter(b => b.id !== id));

    // Spawn a new bubble after a short delay
    setTimeout(() => {
      // Only spawn if the game is still running
      if (gameState === 'playing' && timerRef.current) {
        setBubbles(prev => [...prev, createBubble()]);
      }
    }, 1000);
  };
  
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold font-headline">Bubble Popper</h1>
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle>Pop 'em!</CardTitle>
          <CardDescription>Tap the bubbles to score points before time runs out.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center mb-4 text-2xl font-bold gap-2">
            <Award className="w-6 h-6 text-primary" />
            <span>{score}</span>
          </div>

          <div 
            ref={gameAreaRef} 
            className="relative w-full h-[500px] bg-muted/20 rounded-lg overflow-hidden border cursor-pointer"
          >
            <AnimatePresence>
              {bubbles.map(bubble => (
                <motion.div
                  key={bubble.id}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: -600 }} // Animate off-screen
                  exit={{ scale: 1.5, opacity: 0 }} // Pop animation
                  transition={{ duration: Math.random() * 5 + 8, ease: 'linear' }}
                  // Remove from state when it floats off-screen
                  onAnimationComplete={() => setBubbles(prev => prev.filter(b => b.id !== bubble.id))}
                  // Use onMouseDown for quicker response on both desktop and mobile
                  onMouseDown={() => popBubble(bubble.id)}
                  className="absolute rounded-full"
                  style={{
                    left: bubble.x,
                    bottom: -bubble.size, // Start just below the view
                    width: bubble.size,
                    height: bubble.size,
                    background: `radial-gradient(circle at 65% 15%, white 1px, ${bubble.color} 80%, transparent 100%)`,
                    filter: 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  }}
                />
              ))}
            </AnimatePresence>
            
            {gameState !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
                {gameState === 'ready' && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2">Pop the Bubbles!</h2>
                    <p className="text-white mb-4">You have {GAME_DURATION} seconds.</p>
                    <Button onClick={startGame} size="lg">Start Game</Button>
                  </>
                )}
                {gameState === 'over' && (
                  <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}>
                    <h2 className="text-3xl font-bold text-white mb-2">Time's up!</h2>
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
              Time Left: {timeLeft}s
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

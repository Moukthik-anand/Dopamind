"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { updateUserData, getUserData } from '@/lib/firebase/firestore';
import { cn } from '@/lib/utils';
import { isSameDay, isYesterday } from 'date-fns';

type Bubble = {
  id: number;
  x: number;
  size: number;
  color: string;
  speed: number;
};

const GAME_DURATION = 30; // seconds

const BubbleUI = ({ bubble, onPop }: { bubble: Bubble, onPop: (id: number, points: number) => void}) => {
    const points = Math.round(10 / (bubble.size / 20));

    return (
        <motion.div
            layout
            initial={{ y: "100%", opacity: 0, scale: 0.5 }}
            animate={{ y: `-${window.innerHeight * 0.7}px`, opacity: 1, scale: 1 }}
            exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: bubble.speed, ease: "linear" }}
            onAnimationComplete={() => onPop(bubble.id, 0)}
            onClick={() => onPop(bubble.id, points)}
            style={{
                position: 'absolute',
                left: `${bubble.x}%`,
                bottom: -bubble.size,
                width: bubble.size,
                height: bubble.size,
                borderRadius: '50%',
                backgroundColor: bubble.color,
                cursor: 'pointer',
                opacity: '0.9',
                boxShadow: `inset 0 0 10px rgba(255,255,255,0.7), 0 0 5px ${bubble.color}`,
                willChange: 'transform'
            }}
            className="flex items-center justify-center text-white font-bold text-xs"
        />
    )
}

export default function BubblePopperPage() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const synth = useRef<Tone.PolySynth | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    synth.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 },
    }).toDestination();
    
    const warmUp = async () => {
        await Tone.start();
    };
    document.body.addEventListener('click', warmUp, { once: true });
    return () => document.body.removeEventListener('click', warmUp);
  }, []);

  const popBubble = useCallback((id: number, points: number) => {
    if (gameState !== 'playing') return;
    
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + points);
    
    if (points > 0) {
      const notes = ['C5', 'E5', 'G5', 'A5'];
      const note = notes[Math.floor(Math.random() * notes.length)];
      synth.current?.triggerAttackRelease(note, '16n', Tone.now());
    }
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBubbles([]);
    setGameState('playing');
  };

  const endGame = useCallback(async () => {
      setGameState('finished');
      setFinalScore(score);
      if (user) {
          try {
              const currentData = await getUserData(user.uid);
              if (currentData) {
                  const today = new Date();
                  const lastPlayed = currentData.lastPlayedDate ? new Date(currentData.lastPlayedDate) : null;
                  
                  let newStreak = currentData.streak || 0;
                  if (!lastPlayed || !isSameDay(today, lastPlayed)) {
                    if (lastPlayed && isYesterday(lastPlayed)) {
                        newStreak += 1; // Increment streak if played yesterday
                    } else {
                        newStreak = 1; // Reset streak if a day was missed
                    }
                  }
                  
                  await updateUserData(user.uid, {
                      xp: (currentData.xp || 0) + score,
                      streak: newStreak,
                      lastPlayedDate: today.toISOString(),
                      playHistory: { gameId: 'bubble-popper', score: score, date: today.toISOString() }
                  });
              }
          } catch(e) {
              console.error("Failed to update user data", e);
          }
      }
  }, [user, score]);

  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

   useEffect(() => {
    if (timeLeft <= 0 && gameState === 'playing') {
      endGame();
    }
  }, [timeLeft, gameState, endGame]);


  useEffect(() => {
    if (gameState !== 'playing') return;
    const bubbleInterval = setInterval(() => {
      const newBubble: Bubble = {
        id: Date.now() + Math.random(),
        x: Math.random() * 90,
        size: Math.random() * 40 + 20,
        color: `hsl(${Math.random() * 360}, 80%, 75%)`,
        speed: Math.random() * 5 + 5,
      };
      setBubbles(prev => [...prev, newBubble]);
    }, 400);
    return () => clearInterval(bubbleInterval);
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold font-headline">Bubble Popper</h1>
        <Card className="w-full max-w-4xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Score: {score}</CardTitle>
                <div className={cn("text-lg font-bold", timeLeft <= 5 && "text-destructive animate-pulse")}>
                    Time: {timeLeft}s
                </div>
            </CardHeader>
            <CardContent>
                <div ref={gameAreaRef} className="relative h-[60vh] w-full overflow-hidden rounded-lg bg-background border-2 shadow-inner">
                    <AnimatePresence>
                        {bubbles.map(bubble => (
                           <BubbleUI key={bubble.id} bubble={bubble} onPop={popBubble} />
                        ))}
                    </AnimatePresence>
                    {gameState !== 'playing' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
                            {gameState === 'idle' && <>
                                <h2 className="text-2xl font-bold text-center">Pop as many bubbles as you can!</h2>
                                <Button onClick={startGame} size="lg">Start Game</Button>
                            </>}
                            {gameState === 'finished' && <>
                                <h2 className="text-4xl font-bold">Game Over!</h2>
                                <p className="text-2xl">Your score: {finalScore}</p>
                                <p className="text-lg text-muted-foreground">You earned {finalScore} XP!</p>
                                <Button onClick={startGame} size="lg">Play Again</Button>
                            </>}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

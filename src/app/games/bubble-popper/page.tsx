
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const ROUND_DURATION = 2500; // 2.5 seconds per color
const TOTAL_ROUNDS = 10;

const COLORS = [
  { name: 'Lavender', from: '#E6E6FA', to: '#D8BFD8' },
  { name: 'Sky Blue', from: '#87CEEB', to: '#ADD8E6' },
  { name: 'Mint', from: '#98FF98', to: '#BDFCC9' },
  { name: 'Peach', from: '#FFDAB9', to: '#FFC0CB' },
  { name: 'Lilac', from: '#C8A2C8', to: '#B282B2' },
  { name: 'Coral', from: '#FF7F50', to: '#FF6347' },
  { name: 'Seafoam', from: '#2E8B57', to: '#3CB371' },
  { name: 'Rose', from: '#FFC0CB', to: '#FFB6C1' },
  { name: 'Gold', from: '#FFD700', to: '#F0E68C' },
  { name: 'Periwinkle', from: '#CCCCFF', to: '#B0B0FF' },
];

// Fisher-Yates shuffle
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export default function ColorFadePage() {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
  const [round, setRound] = useState(0);
  const [xp, setXp] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | null, x: number, y: number, key: number }>({ type: null, x: 0, y: 0, key: 0 });

  const shuffledColors = useMemo(() => shuffleArray([...COLORS]), []);
  const currentColor = shuffledColors[round % shuffledColors.length];
  const targetColorIndex = useMemo(() => Math.floor(Math.random() * shuffledColors.length), [shuffledColors]);
  const targetColor = shuffledColors[targetColorIndex];

  const { user } = useUser();
  const firestore = useFirestore();
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;

    const isMatch = round % shuffledColors.length === targetColorIndex;
    const newXp = isMatch ? 50 : -20;
    setXp(prev => prev + newXp);

    setFeedback({
      type: isMatch ? 'correct' : 'incorrect',
      x: e.clientX,
      y: e.clientY,
      key: Date.now()
    });
  };

  const startGame = () => {
    setGameState('playing');
    setRound(0);
    setXp(0);
  };
  
  const endGame = useCallback(() => {
    setGameState('over');
    if (userProfileRef && xp > 0) {
        setDocumentNonBlocking(userProfileRef, { xp: increment(xp) }, { merge: true });
    }
  }, [userProfileRef, xp]);


  useEffect(() => {
    if (gameState === 'playing') {
      if (round >= TOTAL_ROUNDS) {
        endGame();
        return;
      }

      const timer = setTimeout(() => {
        setRound(prev => prev + 1);
      }, ROUND_DURATION);

      return () => clearTimeout(timer);
    }
  }, [gameState, round, endGame]);


  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold font-headline">Color Fade</h1>
      <Card className="w-full max-w-lg text-center overflow-hidden">
        <CardHeader>
          <CardTitle>Match the Color</CardTitle>
          <CardDescription>Tap the screen when the background matches the name.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[50vh] rounded-lg cursor-pointer overflow-hidden" onClick={handleTap}>
            
            <AnimatePresence>
              <motion.div
                key={round}
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  backgroundImage: `linear-gradient(45deg, ${currentColor.from}, ${currentColor.to})`,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.25, ease: 'easeInOut' }}
              />
            </AnimatePresence>

            <AnimatePresence>
              {feedback.type && (
                <motion.div
                  key={feedback.key}
                  className="absolute rounded-full"
                  initial={{ scale: 0, opacity: 1, x: feedback.x, y: feedback.y,translateX:'-50%', translateY:'-50%' }}
                  animate={{ scale: 1, opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  style={{
                    width: 100,
                    height: 100,
                    border: `3px solid ${feedback.type === 'correct' ? 'white' : 'rgba(255, 50, 50, 0.7)'}`,
                  }}
                />
              )}
            </AnimatePresence>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              {gameState === 'ready' && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/40 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-white mb-4">Ready?</h3>
                  <Button onClick={startGame} size="lg">Start Game</Button>
                </motion.div>
              )}
              {gameState === 'playing' && (
                <motion.div
                  key={`target-${targetColor.name}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <p className="text-white text-lg font-medium" style={{textShadow: '0 0 8px rgba(0,0,0,0.4)'}}>Tap when screen matches</p>
                  <h3 className="text-4xl font-bold text-white" style={{textShadow: '0 0 10px rgba(0,0,0,0.5)'}}>{targetColor.name}</h3>
                </motion.div>
              )}
              {gameState === 'over' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black/60 backdrop-blur-sm p-8 rounded-2xl text-white"
                >
                  <h3 className="text-3xl font-bold">Game Over!</h3>
                  <p className="mt-2 text-lg">You scored <span className="font-bold text-yellow-300">{xp}</span> calm XP.</p>
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <Button onClick={startGame} size="lg">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Play Again
                    </Button>
                     <Button asChild variant="secondary" size="lg">
                        <Link href="/">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Link>
                     </Button>
                  </div>
                </motion.div>
              )}
            </div>

            {gameState === 'playing' && (
                <div className="absolute top-2 left-2 bg-black/20 text-white font-bold p-2 rounded-lg text-sm">
                    XP: {xp}
                </div>
            )}
             {gameState === 'playing' && (
                <div className="absolute top-2 right-2 bg-black/20 text-white font-bold p-2 rounded-lg text-sm">
                    Round: {round + 1} / {TOTAL_ROUNDS}
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    
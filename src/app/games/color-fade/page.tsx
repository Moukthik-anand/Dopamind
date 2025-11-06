
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, XCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import * as Tone from 'tone';

const FADE_DURATION_MS = 1800; // Updated from 1400ms to 1800ms
const EVALUATION_DELAY_MS = 250;
const TOTAL_ROUNDS = 10;
const XP_PER_CORRECT = 50;
const XP_PER_INCORRECT = -20;

const TARGET_NAMES = [
  "red", "orange", "yellow", "green", "blue", "purple", "pink", "teal", "cyan", "brown", "gray", "black"
];

const NORMAL_COLORS = TARGET_NAMES.map(name => ({ name, value: name }));

const SHADE_COLORS = [
  { name: 'PeachPuff', value: '#FFDAB9' }, { name: 'PowderBlue', value: '#B0E0E6' },
  { name: 'Lavender', value: '#E6E6FA' }, { name: 'LightGreen', value: '#90EE90' },
  { name: 'LemonChiffon', value: '#FFFACD' }, { name: 'Salmon', value: '#FA8072' },
  { name: 'LightCyan', value: '#E0FFFF' }, { name: 'HotPink', value: '#FF69B4' },
  { name: 'Wheat', value: '#F5DEB3' }, { name: 'SlateGray', value: '#708090' },
];

const ALL_BACKGROUND_COLORS = [...NORMAL_COLORS, ...SHADE_COLORS];

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function ColorFadePage() {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
  const [correctMatches, setCorrectMatches] = useState(0);
  const [xp, setXp] = useState(0);
  const [moves, setMoves] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string, x: number, y: number, key: number } | null>(null);
  
  const [shuffledBgColors, setShuffledBgColors] = useState(() => shuffleArray([...ALL_BACKGROUND_COLORS]));
  const [round, setRound] = useState(0);
  
  const [targetColor, setTargetColor] = useState(NORMAL_COLORS[0]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);
  
  const synthRef = useRef<{ correct: Tone.Synth, incorrect: Tone.Synth } | null>(null);

  useEffect(() => {
    const initAudio = () => {
      if (synthRef.current) return;
      synthRef.current = {
        correct: new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination(),
        incorrect: new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 } }).toDestination()
      };
    };
    initAudio();
    return () => {
      synthRef.current?.correct.dispose();
      synthRef.current?.incorrect.dispose();
      synthRef.current = null;
    }
  }, []);

  const playSound = (isCorrect: boolean) => {
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
    if (isCorrect) {
      synthRef.current?.correct.triggerAttackRelease("C5", "8n", Tone.now());
    } else {
      synthRef.current?.incorrect.triggerAttackRelease("C3", "16n", Tone.now());
    }
  };
  
  const getNextTarget = useCallback(() => {
     let nextTargetIndex;
     do {
        nextTargetIndex = Math.floor(Math.random() * NORMAL_COLORS.length);
     } while(NORMAL_COLORS[nextTargetIndex].name === targetColor.name);
     setTargetColor(NORMAL_COLORS[nextTargetIndex]);
  }, [targetColor]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || isEvaluating) return;

    setIsEvaluating(true);
    setMoves(prev => prev + 1);

    const targetSnapshot = targetColor;
    const currentColor = shuffledBgColors[round % shuffledBgColors.length];
    const isMatch = currentColor.name === targetSnapshot.name;
    
    playSound(isMatch);
    
    let xpChange = isMatch ? XP_PER_CORRECT : XP_PER_INCORRECT;
    
    setXp(prev => Math.max(0, prev + xpChange));
    if (userProfileRef) {
        setDocumentNonBlocking(userProfileRef, { xp: increment(xpChange), score: increment(xpChange) }, { merge: true });
    }
    
    if (isMatch) {
      setCorrectMatches(prev => prev + 1);
      if (correctMatches + 1 >= TOTAL_ROUNDS) {
        endGame();
      } else {
        setTimeout(() => {
          getNextTarget();
        }, EVALUATION_DELAY_MS);
      }
    }
    
    setFeedback({
      text: `${xpChange > 0 ? '+' : ''}${xpChange} XP`,
      x: e.clientX,
      y: e.clientY,
      key: Date.now()
    });

    setTimeout(() => {
        setIsEvaluating(false);
    }, 120); // Debounce taps
  };

  const startGame = () => {
    setGameState('playing');
    setCorrectMatches(0);
    setRound(0);
    setXp(0);
    setMoves(0);
    const newShuffledBgColors = shuffleArray([...ALL_BACKGROUND_COLORS]);
    setShuffledBgColors(newShuffledBgColors);
    setTargetColor(NORMAL_COLORS[Math.floor(Math.random() * NORMAL_COLORS.length)]);
  };
  
  const endGame = useCallback(() => {
    setGameState('over');
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing') {
      if (correctMatches >= TOTAL_ROUNDS) {
        endGame();
      } else {
        timer = setTimeout(() => {
          setRound(prev => prev + 1);
        }, FADE_DURATION_MS);
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, round, correctMatches, endGame]);
  
  const currentColor = shuffledBgColors[round % shuffledBgColors.length];

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-lg text-center overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full h-[60vh] cursor-pointer overflow-hidden" onClick={handleTap} style={{ backgroundColor: gameState === 'playing' ? currentColor.value : '#E8DAEF', transition: `background-color ${FADE_DURATION_MS}ms ease-in-out` }}>
            
            <AnimatePresence>
              {feedback && (
                <motion.div
                  key={feedback.key}
                  className="absolute pointer-events-none text-white font-bold"
                  initial={{ opacity: 1, y: feedback.y, x: feedback.x, translateX:'-50%', translateY:'-50%' }}
                  animate={{ opacity: 0, y: feedback.y - 50 }}
                  transition={{ duration: 1.5 }}
                  style={{
                    color: feedback.text.startsWith('+') ? '#c7d2fe' : '#fca5a5',
                    textShadow: '0 0 5px rgba(0,0,0,0.5)',
                  }}
                >
                    {feedback.text}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              {gameState === 'ready' && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/40 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-white mb-4">Match the Color</h3>
                  <p className="text-white/90 mb-6">Tap when the background matches the name.</p>
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
                  <p className="text-white text-lg font-medium pointer-events-none" style={{textShadow: '0 0 8px rgba(0,0,0,0.4)'}}>Tap when screen is</p>
                  <h3 className="text-5xl font-bold text-white pointer-events-none" style={{textShadow: '0 0 10px rgba(0,0,0,0.6)'}}>{targetColor.name}</h3>
                   <p className="text-white/80 text-md font-medium mt-2 pointer-events-none" style={{textShadow: '0 0 8px rgba(0,0,0,0.4)'}}>Moves: {moves}</p>
                </motion.div>
              )}
              {gameState === 'over' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black/60 backdrop-blur-sm p-8 rounded-2xl text-white"
                >
                  <h3 className="text-3xl font-bold">
                    {correctMatches >= TOTAL_ROUNDS ? 'Challenge Complete!' : 'Game Ended!'}
                  </h3>
                   {correctMatches >= TOTAL_ROUNDS ? (
                    <>
                       <p className="mt-2 text-lg">You matched {TOTAL_ROUNDS} colors in {moves} moves.</p>
                       <p className="mt-2 text-lg">You earned <span className="font-bold text-yellow-300">{xp}</span> calm XP.</p>
                    </>
                   ) : (
                    <p className="mt-2 text-lg">You ended early after {moves} moves with {correctMatches} correct matches.</p>
                   )}
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <Button onClick={startGame} size="lg">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Play Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            {gameState === 'playing' && (
                <>
                    <motion.div 
                        key={`xp-${xp}`}
                        initial={{ scale: 1.3, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-2 right-2 bg-black/30 text-white font-bold p-2 rounded-lg text-sm"
                    >
                        XP: {xp}
                    </motion.div>
                    <div className="absolute top-2 left-2 bg-black/30 text-white font-bold p-2 rounded-lg text-sm">
                        Round: {correctMatches} / {TOTAL_ROUNDS}
                    </div>
                </>
            )}
          </div>
        </CardContent>
      </Card>
      {gameState === 'playing' && (
        <div className="mt-4">
            <Button onClick={() => endGame()} variant="secondary">
                <XCircle className="mr-2 h-4 w-4" />
                End Game
            </Button>
        </div>
      )}
    </div>
  );
}

    

    
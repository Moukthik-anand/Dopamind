
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, StopCircle, TimerIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { UserProfile } from '@/lib/types';


// --- Constants ---
type GameState = 'ready' | 'playing' | 'over';
const POPS_TO_WIN = 50;

interface Bubble {
  id: number;
  x: number;
  y: number;
  r: number;
  speed: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  alpha: number;
  vx: number;
  vy: number;
}

let bubbleIdCounter = 0;

export default function BubblePopperPage() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [popCount, setPopCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);

  const bubblesRef = useRef<Bubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // Timer Refs
  const timerRafIdRef = useRef<number | null>(null);
  const gameStartTimeRef = useRef<number | null>(null);

  // --- Firebase State ---
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const userProfileRef = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);

  // --- Fetch/Create User Profile ---
  useEffect(() => {
    if (userProfileRef) {
      getDoc(userProfileRef).then(async (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          if (user) {
            const newProfile: UserProfile = {
              id: user.uid,
              name: user.displayName || 'Anonymous',
              email: user.email || '',
              score: 0,
              xp: 0,
              createdAt: new Date(),
            };
            await setDoc(userProfileRef, newProfile);
            setUserProfile(newProfile);
          }
        }
      });
    } else {
      setUserProfile(null);
    }
  }, [user, userProfileRef]);


  // --- Sound Initialization & Effects ---
  const playPopSound = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      } catch (e) {
        console.error('AudioContext not supported.', e);
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
    o.type = 'triangle';
    o.frequency.setValueAtTime(800 + Math.random() * 200, p.currentTime);
    g.gain.setValueAtTime(0.3, p.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, p.currentTime + 0.1);
    o.start(p.currentTime);
    o.stop(p.currentTime + 0.1);
  }, []);

  const createParticles = useCallback((x: number, y: number) => {
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        x,
        y,
        r: Math.random() * 2 + 1,
        alpha: 1,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
      });
    }
  }, []);

  // --- Game Loop ---
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn new bubbles if needed
    if (gameState === 'playing' && bubblesRef.current.length < 25) {
      const r = 20 + Math.random() * 30;
      bubblesRef.current.push({
        id: bubbleIdCounter++,
        x: Math.random() * (canvas.width - 2 * r) + r,
        y: canvas.height + r,
        r,
        speed: 1 + Math.random() * 2,
        color: `hsla(${200 + Math.random() * 60}, 100%, 70%, 0.7)`,
      });
    }

    // Draw and update bubbles
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

    // Draw and update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.05;

      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.globalAlpha = 1;

      if (p.alpha <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);
  
  // --- Game State & Timer Management ---
  const stopTimer = useCallback(() => {
    if (timerRafIdRef.current) {
        cancelAnimationFrame(timerRafIdRef.current);
        timerRafIdRef.current = null;
    }
    gameStartTimeRef.current = null;
  }, []);

  const endGame = useCallback(() => {
    if (gameState !== 'playing') return; // Prevent multiple calls
    setGameState('over');
    stopTimer();

    if(user && userProfileRef) {
        const finalTime = (performance.now() - (gameStartTimeRef.current ?? performance.now())) / 1000;
        const scoreGained = Math.max(10, Math.round(100 - finalTime));
        setElapsedTime(finalTime);
        setDocumentNonBlocking(userProfileRef, { score: increment(scoreGained) }, { merge: true });
    }
  }, [gameState, user, userProfileRef, stopTimer]);

  useEffect(() => {
    if (gameState !== 'playing') {
      stopTimer();
      return;
    }

    const timerLoop = () => {
      if (!gameStartTimeRef.current) return;
      const elapsed = (performance.now() - gameStartTimeRef.current) / 1000;
      setElapsedTime(elapsed);
      timerRafIdRef.current = requestAnimationFrame(timerLoop);
    };
    
    if (popCount > 0) {
        if(!timerRafIdRef.current) {
            timerRafIdRef.current = requestAnimationFrame(timerLoop);
        }
    }

    return () => stopTimer();
  }, [gameState, popCount, stopTimer]);


  const startGame = useCallback(() => {
    setPopCount(0);
    setElapsedTime(0);
    setGameState('playing');
    bubblesRef.current = [];
    particlesRef.current = [];
    bubbleIdCounter = 0;
  }, []);
  
  const resetGame = useCallback(() => {
    stopTimer();
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    
    setPopCount(0);
    setElapsedTime(0);
    setGameState('ready');
    bubblesRef.current = [];
    particlesRef.current = [];

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, stopTimer]);

  // --- Canvas Setup & Resize ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      stopTimer();
    };
  }, [gameLoop, stopTimer]);

  // --- Input Handling ---
  const handlePop = useCallback(
    (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (gameState !== 'playing') return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const event = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0] : e.nativeEvent;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        const dx = x - b.x;
        const dy = y - b.y;
        if (dx * dx + dy * dy <= b.r * b.r) {
          createParticles(b.x, b.y);
          bubblesRef.current.splice(i, 1);
          playPopSound();
          
          if (popCount === 0) {
            gameStartTimeRef.current = performance.now();
          }

          const newPopCount = popCount + 1;
          setPopCount(newPopCount);

          if (newPopCount >= POPS_TO_WIN) {
            endGame();
          }

          if (navigator.vibrate) navigator.vibrate(50);
          break;
        }
      }
    },
    [gameState, playPopSound, createParticles, popCount, endGame]
  );

  const displayScore = user ? userProfile?.score ?? '...' : 0;
  const scoreGained = Math.max(10, Math.round(100 - elapsedTime));


  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-4xl font-bold font-headline">Bubble Popper</h1>
      <Card className="w-full max-w-2xl text-center overflow-hidden shadow-lg border border-black/5 dark:border-white/5">
        <CardContent className="p-0">
          <div className="relative w-full h-[60vh] max-h-[700px] overflow-hidden">
            <div className="absolute top-2 left-0 z-20 w-full px-4 flex justify-between items-center text-white">
                <div
                  className="font-bold text-lg sm:text-xl p-2 rounded-lg bg-black/20"
                  style={{ textShadow: '0 0 6px rgba(0,0,0,0.4)' }}
                >
                  Pops:{' '}
                   <motion.span
                    key={popCount}
                    initial={{ scale: 1.2, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="inline-block w-16 text-left"
                  >
                    {popCount}/{POPS_TO_WIN}
                  </motion.span>
                </div>
                <div
                  className="font-bold text-lg sm:text-xl flex items-center p-2 rounded-lg bg-black/20"
                  style={{ textShadow: '0 0 6px rgba(0,0,0,0.4)' }}
                >
                    <TimerIcon className="mr-2 h-5 w-5"/>
                    <span>{elapsedTime.toFixed(2)}s</span>
                </div>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-pointer bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300"
              onMouseDown={handlePop}
              onTouchStart={handlePop}
            />
            {gameState !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                {gameState === 'ready' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Fastest 50 Pops!
                    </h2>
                    <p className="text-white mb-4">
                      Pop 50 bubbles as quickly as you can.
                    </p>
                    <Button onClick={startGame} size="lg">
                      Start Challenge
                    </Button>
                  </motion.div>
                )}
                {gameState === 'over' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center px-4"
                  >
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Challenge Complete!
                    </h2>
                    <p className="text-xl text-white mb-2">
                      You popped 50 bubbles in <strong>{elapsedTime.toFixed(2)}</strong> seconds!
                    </p>
                    <p className="text-lg text-white mb-4">You gained {scoreGained} score. Your total score is now {displayScore}.</p>
                    <Button onClick={resetGame} size="lg">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Play Again
                    </Button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="w-full flex justify-center mt-4">
        {gameState === 'playing' && (
            <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            >
            <Button
                onClick={endGame}
                className="rounded-xl py-2 px-5 font-medium text-white bg-accent/80 hover:bg-accent"
                style={{ backgroundColor: '#b18fe0' }}
            >
                <StopCircle className="mr-2 h-5 w-5" /> End Game
            </Button>
            </motion.div>
        )}
      </div>
    </div>
  );
}

    
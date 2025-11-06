
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, StopCircle, HeartCrack, Plus, Minus } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import * as Tone from 'tone';

// --- Types and Constants ---
type GameState = 'ready' | 'playing' | 'over';

interface Orb {
  id: number;
  x: number;
  y: number;
  r: number;
  speed: number;
  color: string;
  isStress: boolean;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FloatingText {
    id: number;
    x: number;
    y: number;
    text: string;
    alpha: number;
    color: string;
}

const CALM_ORB_COLORS = ['#a5f3fc', '#c7d2fe', '#bbf7d0'];
const STRESS_ORB_COLOR = '#f87171';
const MAX_STRESS_HITS = 10;
const XP_PER_CALM = 10;
const XP_PENALTY_PER_STRESS = -50;


let orbIdCounter = 0;
let textIdCounter = 0;

export default function CatchTheCalmPage() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [xp, setXp] = useState(0);
  const [stressHits, setStressHits] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const orbsRef = useRef<Orb[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const playerRef = useRef<Player>({ x: 0, y: 0, width: 90, height: 15 });
  
  // Firebase
  const { user } = useUser();
  const firestore = useFirestore();
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);
  
  // Sound synthesizers
  const synthRef = useRef<{ calm: Tone.Synth, stress: Tone.Synth } | null>(null);

  // --- Sound Initialization ---
  useEffect(() => {
    synthRef.current = {
      calm: new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination(),
      stress: new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination()
    };
    return () => {
      synthRef.current?.calm.dispose();
      synthRef.current?.stress.dispose();
    }
  }, []);

  // --- Scroll Lock ---
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (gameState === 'playing') {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [gameState]);


  const playSound = (isStress: boolean) => {
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
    if (isStress) {
      synthRef.current?.stress.triggerAttackRelease("C2", "8n");
    } else {
      synthRef.current?.calm.triggerAttackRelease("C5", "8n");
    }
  };

  const createFloatingText = (x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      id: textIdCounter++,
      x,
      y,
      text,
      alpha: 1,
      color,
    });
  };

  // --- Game Loop ---
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn new orbs
    if (gameState === 'playing' && Math.random() < 0.06 && orbsRef.current.length < 25) {
      const isStress = Math.random() < 0.35; // 35% chance for a stress orb
      const baseSpeed = 2.5 + Math.random() * 2;
      const speed = isStress ? baseSpeed * 1.5 : baseSpeed;

      orbsRef.current.push({
        id: orbIdCounter++,
        x: Math.random() * canvas.width,
        y: -20,
        r: isStress ? 12 + Math.random() * 3 : 10,
        speed: speed,
        color: isStress ? STRESS_ORB_COLOR : CALM_ORB_COLORS[Math.floor(Math.random() * CALM_ORB_COLORS.length)],
        isStress,
      });
    }

    // Draw and update orbs
    for (let i = orbsRef.current.length - 1; i >= 0; i--) {
      const orb = orbsRef.current[i];
      orb.y += orb.speed;

      // Collision with player
      if (
        orb.y + orb.r >= playerRef.current.y &&
        orb.y - orb.r <= playerRef.current.y + playerRef.current.height &&
        orb.x > playerRef.current.x &&
        orb.x < playerRef.current.x + playerRef.current.width
      ) {
        playSound(orb.isStress);
        if (orb.isStress) {
          setXp(prev => prev + XP_PENALTY_PER_STRESS);
          setStressHits(prev => prev + 1);
          createFloatingText(orb.x, orb.y, `${XP_PENALTY_PER_STRESS} XP`, '#fca5a5');
        } else {
          setXp(prev => prev + XP_PER_CALM);
          createFloatingText(orb.x, orb.y, `+${XP_PER_CALM} XP`, '#f0fdf4');
        }
        orbsRef.current.splice(i, 1);
        continue;
      }

      // Draw orb
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fillStyle = orb.color;
      
      if (orb.isStress) {
          ctx.shadowColor = "rgba(255,100,100,0.4)";
          ctx.shadowBlur = 10;
      } else {
          ctx.shadowColor = orb.color;
          ctx.shadowBlur = 10;
      }

      ctx.fill();
      ctx.shadowBlur = 0;
      
      if (orb.y > canvas.height + orb.r) {
        orbsRef.current.splice(i, 1);
      }
    }
    
    // Draw and update floating texts
    for(let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= 1;
        ft.alpha -= 0.02;

        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = "bold 16px Poppins";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;

        if (ft.alpha <= 0) {
            floatingTextsRef.current.splice(i, 1);
        }
    }

    // Draw player basket
    ctx.fillStyle = '#e0e7ff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

    // --- Game State Management ---
    const endGame = useCallback(() => {
        if (gameState !== 'playing') return;
        setGameState('over');
        if (userProfileRef && xp > 0) {
            setDocumentNonBlocking(userProfileRef, { xp: increment(xp) }, { merge: true });
        }
    }, [gameState, userProfileRef, xp]);

  useEffect(() => {
      if(stressHits >= MAX_STRESS_HITS && gameState === 'playing') {
          endGame();
      }
  }, [stressHits, gameState, endGame]);


  const startGame = () => {
    setXp(0);
    setStressHits(0);
    orbsRef.current = [];
    floatingTextsRef.current = [];
    orbIdCounter = 0;
    textIdCounter = 0;
    setGameState('playing');
  };

  const resetGame = () => {
    setGameState('ready');
    setXp(0);
    setStressHits(0);
  };
  
  // --- Canvas and Player Setup & Event Listeners ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        playerRef.current.y = canvas.height - 40;
        playerRef.current.x = canvas.width / 2 - playerRef.current.width / 2;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const movePlayer = (x: number) => {
        const rect = canvas.getBoundingClientRect();
        let targetX = x - rect.left - playerRef.current.width / 2;
        playerRef.current.x = Math.max(0, Math.min(targetX, canvas.width - playerRef.current.width));
    };

    const handleMouseMove = (e: MouseEvent) => movePlayer(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
        if(e.touches[0]) movePlayer(e.touches[0].clientX);
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            playerRef.current.x = Math.max(0, playerRef.current.x - 35);
        } else if (e.key === 'ArrowRight') {
            playerRef.current.x = Math.min(canvas.width - playerRef.current.width, playerRef.current.x + 35);
        }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      } else {
        // Only resume if we are in the 'playing' state
        if (gameState === 'playing') {
          animationFrameRef.current = requestAnimationFrame(gameLoop);
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameLoop, gameState]);

  const gameOverMessage = stressHits >= MAX_STRESS_HITS 
    ? "You hit too many stress orbs!"
    : "Game Over!";

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-4xl font-bold font-headline">Catch the Calm</h1>
      
      <Card className="w-full max-w-2xl text-center overflow-hidden shadow-lg border border-black/5 dark:border-white/5">
        <CardContent className="p-0">
          <div className="relative w-full h-[60vh] max-h-[700px] overflow-hidden">
             <div className="absolute top-2 left-0 z-20 w-full px-4 flex justify-between items-center text-white font-bold text-lg" style={{ textShadow: '0 0 6px rgba(0,0,0,0.4)' }}>
                <span className="p-2 rounded-lg bg-black/20">Calm: {xp} XP</span>
                <span className="p-2 rounded-lg bg-black/20 flex items-center gap-2">
                    <HeartCrack className="text-red-400" /> 
                    {stressHits} / {MAX_STRESS_HITS}
                </span>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-pointer bg-gradient-to-br from-[#a78bfa] to-[#93c5fd]"
            />
            
            <AnimatePresence>
            {gameState !== 'playing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10"
              >
                {gameState === 'ready' && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2">Catch the Calm</h2>
                    <p className="text-white mb-4 text-center px-4">Collect calm orbs, avoid the red ones.<br/>Hitting {MAX_STRESS_HITS} red orbs ends the game.</p>
                    <Button onClick={startGame} size="lg">Start Game</Button>
                  </>
                )}
                {gameState === 'over' && (
                   <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center px-4"
                   >
                    <h2 className="text-3xl font-bold text-white mb-2">{gameOverMessage}</h2>
                    <p className="text-xl text-white mb-4">You gained {xp} calm XP!</p>
                    <div className="flex justify-center">
                        <Button onClick={resetGame} size="lg">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Play Again
                        </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
            </AnimatePresence>

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
              style={{ backgroundColor: '#a78bfa' }}
            >
              <StopCircle className="mr-2 h-5 w-5" /> End Game
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

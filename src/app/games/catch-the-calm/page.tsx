
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, StopCircle } from 'lucide-react';
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
  vx: number;
  r: number;
  speedY: number;
  color: string;
  isStress: boolean;
  blur: number;
}

interface FloatingText {
    id: number;
    x: number;
    y: number;
    text: string;
    alpha: number;
    color: string;
}

const CALM_ORB_COLOR = '#a5f3fc';
const STRESS_ORB_COLOR = '#f87171';
const MAX_LIVES = 3;
const XP_PER_CALM = 10;
const XP_PENALTY_PER_STRESS = -15;

const BASE_CALM_SPEED = 4.0; // 2x faster than previous versions
const STRESS_SPEED_MULTIPLIER = 3.0; // Insane speed mode

let orbIdCounter = 0;
let textIdCounter = 0;

export default function CatchTheCalmPage() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [xp, setXp] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [hitFlash, setHitFlash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const orbsRef = useRef<Orb[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const playerRef = useRef<{ x: number; y: number; width: number; height: number; }>({ x: 0, y: 0, width: 90, height: 15 });
  const lastCalmSpawn = useRef(0);
  const nextCalmSpawnInterval = useRef(900 + Math.random() * 200); // 0.9-1.1s
  const lastStressSpawn = useRef(0);
  const nextStressSpawnInterval = useRef(300 + Math.random() * 200); // 0.3-0.5s
  
  const { user } = useUser();
  const firestore = useFirestore();
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);
  
  const synthRef = useRef<{ calm: Tone.Synth, stress: Tone.Synth, gameOver: Tone.Synth } | null>(null);

  useEffect(() => {
    synthRef.current = {
      calm: new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination(),
      stress: new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination(),
      gameOver: new Tone.Synth({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.1, decay: 0.5, sustain: 0.2, release: 0.5 } }).toDestination()
    };
    return () => {
      synthRef.current?.calm.dispose();
      synthRef.current?.stress.dispose();
      synthRef.current?.gameOver.dispose();
    }
  }, []);

  const playSound = (sound: 'calm' | 'stress' | 'gameOver') => {
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
    const now = Tone.now();
    if (sound === 'calm') synthRef.current?.calm.triggerAttackRelease("C5", "8n", now);
    if (sound === 'stress') synthRef.current?.stress.triggerAttackRelease("C2", "8n", now);
    if (sound === 'gameOver') synthRef.current?.gameOver.triggerAttackRelease("C3", "2n", now);
  };

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    if (gameState === 'playing') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalStyle;
    }
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [gameState]);

  const createFloatingText = (x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({ id: textIdCounter++, x, y, text, alpha: 1, color });
  };
  
  const gameLoop = useCallback((timestamp: number) => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || gameState !== 'playing') return;
    
    // --- Orb Spawning ---
    if (timestamp - lastCalmSpawn.current > nextCalmSpawnInterval.current) {
        orbsRef.current.push({
            id: orbIdCounter++,
            x: Math.random() * canvas.width,
            y: -20,
            vx: 0,
            r: 10,
            speedY: BASE_CALM_SPEED,
            color: CALM_ORB_COLOR,
            isStress: false,
            blur: 8,
        });
        lastCalmSpawn.current = timestamp;
        nextCalmSpawnInterval.current = 900 + Math.random() * 200;
    }
    
    if (timestamp - lastStressSpawn.current > nextStressSpawnInterval.current) {
        const calmRadius = 10;
        const stressRadius = calmRadius * (0.5 + Math.random()); // 50% to 150% size
        orbsRef.current.push({
            id: orbIdCounter++,
            x: Math.random() * canvas.width,
            y: -20,
            vx: (Math.random() - 0.5) * 4, // More diagonal movement
            r: stressRadius,
            speedY: BASE_CALM_SPEED * STRESS_SPEED_MULTIPLIER,
            color: STRESS_ORB_COLOR,
            isStress: true,
            blur: 5,
        });
        lastStressSpawn.current = timestamp;
        nextStressSpawnInterval.current = 300 + Math.random() * 200;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Update & Draw Orbs ---
    for (let i = orbsRef.current.length - 1; i >= 0; i--) {
      const orb = orbsRef.current[i];
      orb.y += orb.speedY;
      orb.x += orb.vx;
      
      if(orb.x < orb.r || orb.x > canvas.width - orb.r) orb.vx *= -1;

      // Collision with player
      if (
        orb.y + orb.r >= playerRef.current.y &&
        orb.y - orb.r <= playerRef.current.y + playerRef.current.height &&
        orb.x > playerRef.current.x &&
        orb.x < playerRef.current.x + playerRef.current.width
      ) {
        if (orb.isStress) {
          playSound('stress');
          setXp(prev => prev + XP_PENALTY_PER_STRESS);
          setLives(prev => prev - 1);
          createFloatingText(orb.x, orb.y, `${XP_PENALTY_PER_STRESS} XP`, '#fca5a5');
          setHitFlash(true);
          setTimeout(() => setHitFlash(false), 200);
        } else {
          playSound('calm');
          setXp(prev => prev + XP_PER_CALM);
          createFloatingText(orb.x, orb.y, `+${XP_PER_CALM} XP`, '#f0fdf4');
        }
        orbsRef.current.splice(i, 1);
        continue;
      }

      if (orb.y > canvas.height + orb.r * 2) {
        orbsRef.current.splice(i, 1);
        continue;
      }
      
      // Draw orb
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fillStyle = orb.color;
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = orb.blur;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    
    // Draw and update floating texts
    for(let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= 1.2;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) {
            floatingTextsRef.current.splice(i, 1);
            continue;
        }
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = "bold 16px Poppins";
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // Draw player
    ctx.fillStyle = '#e0e7ff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

  }, [gameState]);

  const endGame = useCallback((manual = false) => {
    if (gameState !== 'playing') return;
    if (userProfileRef && xp > 0) {
      setDocumentNonBlocking(userProfileRef, { xp: increment(xp), score: increment(xp) }, { merge: true });
    }
    if (!manual) playSound('gameOver');
    setGameState('over');
  }, [gameState, userProfileRef, xp]);

  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      endGame();
    }
  }, [lives, gameState, endGame]);

  const startGame = () => {
    setXp(0);
    setLives(MAX_LIVES);
    orbsRef.current = [];
    floatingTextsRef.current = [];
    orbIdCounter = 0;
    textIdCounter = 0;
    lastCalmSpawn.current = 0;
    lastStressSpawn.current = 0;
    setGameState('playing');
  };
  
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

    const handlePointerMove = (e: PointerEvent) => {
        e.preventDefault();
        movePlayer(e.clientX);
    };

    canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('pointermove', handlePointerMove);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameLoop]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-4xl font-bold font-headline">Catch the Calm</h1>
      
      <Card className="w-full max-w-2xl text-center overflow-hidden shadow-lg border border-black/5 dark:border-white/5">
        <CardContent className="p-0">
          <div className="relative w-full h-[60vh] max-h-[600px] overflow-hidden">
             <div className="absolute top-2 left-0 z-20 w-full px-4 flex justify-between items-center" style={{ textShadow: '0 0 6px rgba(0,0,0,0.4)' }}>
                <span className="p-2 rounded-lg bg-primary/20 text-primary-foreground font-bold text-lg">XP: {xp}</span>
                <div className="p-2 rounded-lg bg-primary/20 text-primary-foreground font-bold text-lg flex items-center gap-2">
                    <motion.span key={lives} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.3 }}>♥️ {lives}</motion.span>
                </div>
            </div>
            
            <AnimatePresence>
                {hitFlash && <motion.div initial={{opacity:0}} animate={{opacity:0.3}} exit={{opacity:0}} transition={{duration:0.1}} className="absolute inset-0 bg-red-500 z-10 pointer-events-none" />}
            </AnimatePresence>

            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-none bg-gradient-to-br from-[#a78bfa] to-[#93c5fd]"
              style={{ touchAction: 'none' }}
            />
            
            <AnimatePresence>
            {gameState !== 'playing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10 p-4"
              >
                {gameState === 'ready' && (
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">Catch the Calm</h2>
                    <p className="text-white mb-4">Collect calm orbs. Avoid the red ones.<br/>You have {MAX_LIVES} lives.</p>
                    <Button onClick={startGame} size="lg">Start Game</Button>
                  </div>
                )}
                {gameState === 'over' && (
                   <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center text-white"
                   >
                    <h2 className="text-4xl font-bold mb-2">💔 Game Over</h2>
                    <p className="text-lg mb-6">
                        You lost all your lives!
                    </p>
                    <Button onClick={startGame} size="lg">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Play Again
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
      <div className="w-full flex justify-center mt-2">
        {gameState === 'playing' && (
          <Button onClick={() => endGame(true)}>
            <StopCircle className="mr-2 h-5 w-5" /> End Game
          </Button>
        )}
      </div>
    </div>
  );
}

    

    
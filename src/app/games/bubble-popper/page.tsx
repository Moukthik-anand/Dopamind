
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import * as Tone from "tone";

const TARGET_POP_COUNT = 70;
const XP_AWARD = 1500;

interface Bubble {
  id: number;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  color: string;
}

let bubbleIdCounter = 0;

export default function BubblePopperPage() {
  const [popCount, setPopCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const bubblesRef = useRef<Bubble[]>([]);
  
  const popSynthRef = useRef<Tone.MembraneSynth | null>(null);

  useEffect(() => {
    popSynthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" }
    }).toDestination();

    return () => {
      popSynthRef.current?.dispose();
    };
  }, []);

  const playPopSound = () => {
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
    popSynthRef.current?.triggerAttackRelease("C2", "8n");
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameStarted && !finished) {
       // Add new bubbles periodically
        if (bubblesRef.current.length < 25 && Math.random() < 0.1) {
            const r = 15 + Math.random() * 15;
            bubblesRef.current.push({
                id: bubbleIdCounter++,
                x: Math.random() * canvas.width,
                y: canvas.height + r,
                r: r,
                vx: (Math.random() - 0.5) * 1,
                vy: -1 - Math.random() * 1.5,
                color: `hsla(${200 + Math.random() * 60}, 80%, 70%, 0.7)`,
            });
        }
    }

    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const bubble = bubblesRef.current[i];
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        if (bubble.x - bubble.r > canvas.width || bubble.x + bubble.r < 0 || bubble.y + bubble.r < 0) {
            bubblesRef.current.splice(i, 1);
        } else {
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
            ctx.fillStyle = bubble.color;
            ctx.fill();
        }
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, finished]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  }, [gameLoop]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (finished || !gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const bubble = bubblesRef.current[i];
        const dist = Math.hypot(x - bubble.x, y - bubble.y);
        if (dist < bubble.r) {
            playPopSound();
            bubblesRef.current.splice(i, 1);
            setPopCount(prev => {
                const newCount = prev + 1;
                if (newCount >= TARGET_POP_COUNT) {
                    setFinished(true);
                }
                return newCount;
            });
            break;
        }
    }
  };

  const startGame = () => {
      setPopCount(0);
      setFinished(false);
      setGameStarted(true);
      bubblesRef.current = [];
      bubbleIdCounter = 0;
  }

  const resetGame = () => {
    setPopCount(0);
    setFinished(false);
    setGameStarted(false);
    bubblesRef.current = [];
  };

  const stopGame = () => {
      setFinished(true);
      setGameStarted(false);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold font-headline">Bubble Popper</h1>
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>Pop {TARGET_POP_COUNT} Bubbles</CardTitle>
          <CardDescription>Click or tap the bubbles to pop them.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={500}
              height={400}
              className="rounded-lg bg-primary/10 cursor-pointer"
              onClick={handleCanvasClick}
            />

            <div className="absolute top-2 left-2 bg-black/20 text-white font-bold p-2 rounded-lg">
                Pops: {popCount} / {TARGET_POP_COUNT}
            </div>

            {!gameStarted && !finished && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                    <Button onClick={startGame} size="lg">Start Game</Button>
                </div>
            )}

            {finished && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg">
                <h3 className="text-3xl font-bold text-white">Challenge Complete!</h3>
                <p className="text-white mt-2">You popped {TARGET_POP_COUNT} bubbles!</p>
                <p className="text-lg font-semibold text-yellow-300 mt-1">You earned {XP_AWARD} XP!</p>
                <Button onClick={resetGame} size="lg" className="mt-6">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Play Again
                </Button>
              </div>
            )}
          </div>
            {gameStarted && !finished && (
                <div className="mt-4">
                    <Button onClick={stopGame} variant="secondary">End Game</Button>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

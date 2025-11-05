"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

export default function RippleTouchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const ripplesRef = useRef<Ripple[]>([]);
  const [showHint, setShowHint] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const createRipple = useCallback((x: number, y: number) => {
    ripplesRef.current.push({
      x,
      y,
      radius: 0,
      maxRadius: 60 + Math.random() * 60, // Smaller radius for flow effect
      alpha: 1.0,
      speed: 0.02 + Math.random() * 0.01,
    });
    // Limit total ripples to prevent lag
    if (ripplesRef.current.length > 30) {
      ripplesRef.current.shift();
    }
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    // Clear canvas with a semi-transparent fill for a slight trail effect
    ctx.fillStyle = 'rgba(167, 139, 250, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = "lighter";

    for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
      const r = ripplesRef.current[i];
      
      // Animate ripple
      r.radius += r.maxRadius * r.speed;
      r.alpha = 1 - (r.radius / r.maxRadius);
      
      if (r.alpha <= 0) {
        ripplesRef.current.splice(i, 1);
        continue;
      }
      
      // Draw ripple
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.globalCompositeOperation = "source-over";

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const events = 'touches' in e.nativeEvent ? e.nativeEvent.touches : [e.nativeEvent];
    const coords = [];
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        coords.push({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        });
    }
    return coords;
  }

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCoordinates(e);
    coords.forEach(coord => createRipple(coord.x, coord.y));
  };
  
  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling on touch devices
    const coords = getCoordinates(e);
    coords.forEach(coord => createRipple(coord.x, coord.y));
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };


  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-4xl font-bold font-headline">Ripple Flow 🌊</h1>
      <Card className="w-full max-w-2xl text-center overflow-hidden shadow-lg border border-black/5 dark:border-white/5">
        <CardContent className="p-0">
          <div className="relative w-full h-[60vh] max-h-[700px] overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-pointer bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-400"
              onMouseDown={handleStart}
              onTouchStart={handleStart}
              onMouseMove={handleMove}
              onTouchMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchEnd={handleEnd}
            />
            <AnimatePresence>
                {showHint && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm pointer-events-none"
                    >
                        Tap and slide...
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

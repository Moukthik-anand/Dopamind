"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface Ripple {
  id: number;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  maxRadius: number;
}

let rippleIdCounter = 0;

export default function RippleTouchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const ripplesRef = useRef<Ripple[]>([]);
  const lastRippleTimeRef = useRef(0);

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
      id: rippleIdCounter++,
      x,
      y,
      radius: 0,
      alpha: 1.0,
      maxRadius: 80 + Math.random() * 40, // 80-120px
    });
    // Limit total ripples for performance
    if (ripplesRef.current.length > 12) {
      ripplesRef.current.shift();
    }
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Apply a faint translucent overlay for a fading trail effect
    ctx.fillStyle = "rgba(167, 139, 250, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "lighter";
    
    // Set glow effect
    ctx.shadowBlur = 25;
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";

    for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
      const r = ripplesRef.current[i];
      
      // Animate ripple
      r.radius += 1; // Slow expansion
      r.alpha -= 0.01; // Gradual fade
      
      if (r.alpha <= 0 || r.radius > r.maxRadius) {
        ripplesRef.current.splice(i, 1);
        continue;
      }
      
      // Create a soft radial gradient for each ripple
      const gradient = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${r.alpha * 0.4})`);
      gradient.addColorStop(0.6, `rgba(255, 255, 255, ${r.alpha * 0.15})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Reset canvas settings
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;

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
    lastRippleTimeRef.current = Date.now();
  };
  
  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling on touch devices
    
    const now = Date.now();
    if (now - lastRippleTimeRef.current > 120) { // Throttle ripple creation
      const coords = getCoordinates(e);
      coords.forEach(coord => createRipple(coord.x, coord.y));
      lastRippleTimeRef.current = now;
    }
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
                        Glide your finger to create flowing water waves.
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CANVAS_SIZE = 300;
const LOCAL_STORAGE_KEY = 'pixel-paint-doodle';
const COLORS = ['#000000', '#EF4444', '#3B82F6', '#22C55E', '#8B5CF6', '#F97316'];

export default function PixelPaintPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  };

  useEffect(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
  }, [currentColor]);
  
  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(event);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = getCanvasContext();
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(event);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
    saveCanvas();
  };

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event.nativeEvent) {
      return {
        offsetX: event.nativeEvent.touches[0].clientX - rect.left,
        offsetY: event.nativeEvent.touches[0].clientY - rect.top,
      };
    }
    return {
      offsetX: event.nativeEvent.offsetX,
      offsetY: event.nativeEvent.offsetY,
    };
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    localStorage.setItem(LOCAL_STORAGE_KEY, dataUrl);
  };

  const loadCanvas = () => {
    const ctx = getCanvasContext();
    const savedDrawing = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (ctx && savedDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = savedDrawing;
    }
  };

  useEffect(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    loadCanvas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearCanvas = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold font-headline">Pixel Paint</h1>
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Free Draw</CardTitle>
          <CardDescription>
            A quiet space to doodle and clear your mind.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative border-2 border-dashed rounded-lg">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="rounded-lg cursor-crosshair bg-white dark:bg-muted"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex flex-col items-center gap-4 pt-2 w-full">
            <div className="flex gap-2 justify-center flex-wrap">
                {COLORS.map(color => (
                    <button
                        key={color}
                        onClick={() => setCurrentColor(color)}
                        className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            currentColor === color ? 'border-primary scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                    />
                ))}
            </div>
             <Button onClick={clearCanvas} variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Canvas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

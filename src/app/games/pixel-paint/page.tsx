
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
import { Eraser, Palette, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const CANVAS_SIZE = 300;
const LOCAL_STORAGE_KEY_DRAWING = 'pixel-paint-doodle';
const LOCAL_STORAGE_KEY_COLOR = 'pixel-paint-color';
const DEFAULT_COLOR = '#111111';

const COLORS = [
  '#111111', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', 
  '#30B0FF', '#5856D6', '#AF52DE', '#FF2D55', '#6D7278', '#A1A1AA', 
  '#F5A8B8', '#B7E4C7', '#BFD7FF', '#FFE59D'
];

export default function PixelPaintPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [isErasing, setIsErasing] = useState(false);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  };
  
  const handleSetColor = (color: string) => {
    setIsErasing(false);
    setCurrentColor(color);
    localStorage.setItem(LOCAL_STORAGE_KEY_COLOR, color);
  };

  const handleEraser = () => {
    setIsErasing(true);
  }

  useEffect(() => {
    const savedColor = localStorage.getItem(LOCAL_STORAGE_KEY_COLOR);
    if (savedColor) {
      setCurrentColor(savedColor);
    }
  }, []);

  useEffect(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    
    if (isErasing) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 10;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
    }
  }, [currentColor, isErasing]);
  
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
    event.preventDefault(); // Prevent scrolling on touch devices

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
    localStorage.setItem(LOCAL_STORAGE_KEY_DRAWING, dataUrl);
  };

  const loadCanvas = () => {
    const ctx = getCanvasContext();
    const savedDrawing = localStorage.getItem(LOCAL_STORAGE_KEY_DRAWING);
    if (ctx && savedDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = savedDrawing;
    }
  };

  useEffect(() => {
    loadCanvas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearCanvas = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    localStorage.removeItem(LOCAL_STORAGE_KEY_DRAWING);
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
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex w-max space-x-2 p-2">
                {COLORS.map(color => (
                    <button
                        key={color}
                        onClick={() => handleSetColor(color)}
                        className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all flex-shrink-0",
                            !isErasing && currentColor === color ? 'border-primary scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                    />
                ))}
                <button
                    onClick={() => colorInputRef.current?.click()}
                    className="w-8 h-8 rounded-md border-2 border-dashed flex items-center justify-center flex-shrink-0"
                    aria-label="Open color picker"
                >
                    <Palette className="w-5 h-5 text-muted-foreground" />
                </button>
                 <button
                    onClick={handleEraser}
                    className={cn("w-8 h-8 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        isErasing ? 'border-primary bg-primary/10' : 'border-dashed'
                    )}
                    aria-label="Eraser"
                >
                    <Eraser className="w-5 h-5 text-muted-foreground" />
                </button>
                <input
                    ref={colorInputRef}
                    type="color"
                    className="w-0 h-0 opacity-0 absolute"
                    onChange={(e) => handleSetColor(e.target.value)}
                />
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
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

    
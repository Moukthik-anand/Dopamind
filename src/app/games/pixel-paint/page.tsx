
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Trash2, Paintbrush, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const CANVAS_SIZE = 300;
const LOCAL_STORAGE_KEY_DRAWING = 'pixel-paint-doodle';
const LOCAL_STORAGE_KEY_COLOR = 'pixel-paint-color';

const COLORS = [
  '#111111', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', 
  '#30B0FF', '#5856D6', '#AF52DE', '#FF2D55', '#6D7278', '#A1A1AA', 
  '#F5A8B8', '#B7E4C7', '#BFD7FF', '#FFE59D'
];

export default function PixelPaintPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [isErasing, setIsErasing] = useState(false);
  
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  useEffect(() => {
    const savedColor = localStorage.getItem(LOCAL_STORAGE_KEY_COLOR);
    if (savedColor) {
      setCurrentColor(savedColor);
    }
    
    const ctx = getCanvasContext();
    if (!ctx) return;
    loadCanvas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCanvasContext]);

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
      ctx.lineJoin = 'round';
    }
  }, [currentColor, isErasing, getCanvasContext]);
  
    const getCoordinates = useCallback((event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event) {
        if(event.touches[0]){
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top,
            };
        }
        return null;
    }
    return {
      x: (event as MouseEvent).clientX - rect.left,
      y: (event as MouseEvent).clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((x: number, y: number) => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, [getCanvasContext]);


  const draw = useCallback((x: number, y: number) => {
    if (!isDrawing) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, getCanvasContext]);

  const stopDrawing = useCallback(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
    saveCanvas();
  }, [getCanvasContext]);


  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const coords = getCoordinates(event.nativeEvent);
    if (coords) {
        startDrawing(coords.x, coords.y);
    }
  }, [getCoordinates, startDrawing]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(event.nativeEvent);
    if (coords) {
        draw(coords.x, coords.y);
    }
  }, [isDrawing, getCoordinates, draw]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    const coords = getCoordinates(event.nativeEvent);
    if (coords) {
        startDrawing(coords.x, coords.y);
    }
  }, [getCoordinates, startDrawing]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing) return;
    const coords = getCoordinates(event.nativeEvent);
    if (coords) {
        draw(coords.x, coords.y);
    }
  }, [isDrawing, getCoordinates, draw]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    stopDrawing();
  }, [stopDrawing]);


  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    localStorage.setItem(LOCAL_STORAGE_KEY_DRAWING, dataUrl);
  };
  
  const handleSetCurrentColor = (color: string) => {
    setCurrentColor(color);
    setIsErasing(false);
    localStorage.setItem(LOCAL_STORAGE_KEY_COLOR, color);
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
              className="rounded-lg cursor-crosshair bg-white dark:bg-muted touch-none select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
          <div className="flex flex-col items-center gap-4 pt-2 w-full">
            <ScrollArea className="w-full max-w-xs sm:max-w-sm whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-2 p-2">
                    <button
                        onClick={() => setIsErasing(true)}
                        className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                            isErasing ? 'border-primary scale-110' : 'border-transparent'
                        )}
                        aria-label="Eraser"
                    >
                        <Eraser className="w-5 h-5" />
                    </button>
                    {COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => handleSetCurrentColor(color)}
                            className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all",
                                !isErasing && currentColor === color ? 'border-primary scale-110' : 'border-transparent'
                            )}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                        />
                    ))}
                     <button
                        onClick={() => colorPickerRef.current?.click()}
                        className={cn(
                            "w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all",
                            !isErasing && !COLORS.includes(currentColor) ? 'border-primary scale-110' : 'border-transparent'
                        )}
                        style={{ 
                            backgroundImage: 'conic-gradient(from 90deg at 50% 50%, #ff0000, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)',
                        }}
                        aria-label="Open color picker"
                    >
                      <Paintbrush className="w-5 h-5 text-white" style={{ filter: 'drop-shadow(0 0 2px black)' }}/>
                      <input
                        ref={colorPickerRef}
                        type="color"
                        className="absolute w-0 h-0 opacity-0"
                        onChange={(e) => handleSetCurrentColor(e.target.value)}
                        value={currentColor}
                      />
                    </button>
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

    

    
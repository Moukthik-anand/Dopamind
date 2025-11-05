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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Brush, Trash2 } from 'lucide-react';

const CANVAS_SIZE = 300;
const LOCAL_STORAGE_KEY = 'pixel-paint-doodle';

export default function PixelPaintPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  };

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
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    loadCanvas();
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
              className="rounded-lg cursor-crosshair bg-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="cursor-default">
                    <Brush className="mr-2" />
                    Create your calm
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your drawing is saved automatically!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button onClick={clearCanvas} variant="destructive"
            aria-label="Clear canvas">
              <Trash2 className="mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

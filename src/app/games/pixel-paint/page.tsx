'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Brush, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { transformDoodleToPixelArt } from '@/ai/flows/transform-doodles-to-pixel-art';
import Image from 'next/image';

const CANVAS_SIZE = 300;

export default function PixelPaintPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [pixelArt, setPixelArt] = useState<string | null>(null);

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

  useEffect(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
  }, []);

  const clearCanvas = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setPixelArt(null);
  };

  const handleTransform = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsTransforming(true);
    setPixelArt(null);
    try {
      const doodleDataUri = canvas.toDataURL('image/png');
      const result = await transformDoodleToPixelArt({ doodleDataUri });
      setPixelArt(result.pixelArtDataUri);
    } catch (error) {
      console.error('Failed to transform doodle:', error);
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold font-headline">Pixel Paint</h1>
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>AI Pixel Art</CardTitle>
          <CardDescription>Draw a doodle and let AI turn it into pixel art.</CardDescription>
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
            {(isTransforming || pixelArt) && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                {isTransforming && <Loader2 className="w-12 h-12 text-primary animate-spin" />}
                {pixelArt && <Image src={pixelArt} alt="AI Generated Pixel Art" width={CANVAS_SIZE} height={CANVAS_SIZE} className="rounded-lg" />}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTransform} disabled={isTransforming}>
              <Sparkles className="mr-2" />
              {isTransforming ? 'Transforming...' : 'Transform'}
            </Button>
            <Button onClick={clearCanvas} variant="outline">
              <Trash2 className="mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

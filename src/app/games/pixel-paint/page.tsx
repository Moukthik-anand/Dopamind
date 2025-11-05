"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { transformDoodleToPixelArt } from '@/ai/flows/transform-doodles-to-pixel-art';
import { Loader2, Wand2, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function PixelPaintPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pixelArt, setPixelArt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getContext = useCallback(() => canvasRef.current?.getContext('2d'), []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (canvas && context) {
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      setPixelArt(null);
      setError(null);
    }
  }, [getContext]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // For high-DPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const context = getContext();
    if (!context) return;
    context.scale(dpr, dpr);

    context.lineCap = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = 5;
    clearCanvas();
  }, [clearCanvas, getContext]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    const context = getContext();
    if (!context) return;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    const context = getContext();
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const context = getContext();
    if (!context) return;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };
  
  const handleTransform = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsLoading(true);
    setError(null);
    
    const doodleDataUri = canvas.toDataURL('image/png');
    
    try {
      const result = await transformDoodleToPixelArt({ doodleDataUri });
      setPixelArt(result.pixelArtDataUri);
    } catch (err) {
      setError('Failed to transform doodle. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold font-headline">Pixel Paint</h1>
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Create Your Masterpiece</CardTitle>
          <CardDescription>Draw something in the box below, then click Transform to see the magic!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseLeave={finishDrawing}
                className="w-full h-auto aspect-square border rounded-lg cursor-crosshair bg-white shadow-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleTransform} disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Transform
                </Button>
                <Button onClick={clearCanvas} variant="outline" aria-label="Clear canvas">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center border rounded-lg aspect-square bg-muted/50 p-4 relative overflow-hidden">
              {isLoading && <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />}
              {error && <p className="text-destructive text-center">{error}</p>}
              {pixelArt && (
                <div className="w-full h-full relative">
                  <Image src={pixelArt} alt="Generated Pixel Art" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" />
                </div>
              )}
              {!isLoading && !pixelArt && !error && (
                <div className="text-center text-muted-foreground p-8">
                    <Wand2 className="mx-auto h-12 w-12 mb-4"/>
                    <h3 className="font-semibold text-lg">Your pixel art will appear here</h3>
                    <p className="text-sm">Draw a doodle and click the transform button to let AI work its magic.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

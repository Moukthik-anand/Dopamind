"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Pause, RefreshCw } from 'lucide-react';

const BREATH_CYCLE = 10000; // 10 seconds total: 4s in, 4s out, 2s hold
const INHALE_DURATION = 4;
const EXHALE_DURATION = 4;
const HOLD_DURATION = 2;

export default function BreatheWithMePage() {
  const [isBreathing, setIsBreathing] = useState(false);
  const [text, setText] = useState('Get Ready');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathing) {
      const runCycle = () => {
        setText('Breathe In');
        timer = setTimeout(() => {
          setText('Hold');
          timer = setTimeout(() => {
            setText('Breathe Out');
          }, HOLD_DURATION * 1000);
        }, INHALE_DURATION * 1000);
      };
      runCycle(); // Initial run
      const interval = setInterval(runCycle, BREATH_CYCLE);
      return () => clearInterval(interval);
    } else {
      setText('Get Ready');
    }
    return () => clearTimeout(timer);
  }, [isBreathing]);

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold font-headline">Breathe With Me</h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>A Moment of Calm</CardTitle>
          <CardDescription>Follow the orb and synchronize your breath.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <motion.div
              className="absolute w-full h-full bg-primary/20 rounded-full"
              animate={{
                scale: isBreathing ? [1, 1.5, 1] : 1,
              }}
              transition={{
                duration: BREATH_CYCLE / 1000,
                ease: 'easeInOut',
                repeat: isBreathing ? Infinity : 0,
              }}
            />
            <motion.div
              className="absolute w-40 h-40 bg-primary/40 rounded-full"
               animate={{
                scale: isBreathing ? [1, 1.4, 1] : 1,
              }}
              transition={{
                duration: BREATH_CYCLE / 1000,
                ease: 'easeInOut',
                repeat: isBreathing ? Infinity : 0,
                delay: 0.1
              }}
            />
            <div className="relative w-32 h-32 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">{text}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => setIsBreathing(!isBreathing)} size="lg">
              {isBreathing ? (
                <>
                  <Pause className="mr-2 h-5 w-5" /> Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" /> Start
                </>
              )}
            </Button>
            {isBreathing && (
                 <Button onClick={() => setIsBreathing(false)} variant="secondary" size="lg">
                    <RefreshCw className="mr-2 h-5 w-5" /> Reset
                </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

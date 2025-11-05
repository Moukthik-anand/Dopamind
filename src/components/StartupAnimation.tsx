
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function StartupAnimation({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('seenIntro');
    if (!hasSeenIntro) {
      setShowIntro(true);
      localStorage.setItem('seenIntro', 'true');
    } else {
      setIntroFinished(true);
    }
  }, []);

  if (!introFinished) {
    return (
      <AnimatePresence
        onExitComplete={() => setIntroFinished(true)}
      >
        {showIntro && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/30"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              onAnimationComplete={() => setTimeout(() => setShowIntro(false), 1500)}
            >
              <h1 className="text-4xl font-bold font-headline tracking-tight text-primary-foreground">Dopamind</h1>
              <p className="text-center text-primary-foreground/80">Tap. Play. Reset.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return children;
}

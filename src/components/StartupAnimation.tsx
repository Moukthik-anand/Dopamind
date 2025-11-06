
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function StartupAnimation({ children }: { children: React.ReactNode }) {
  const [isShowingIntro, setIsShowingIntro] = useState(true);

  useEffect(() => {
    // Hide the intro after a delay on every page load
    const timer = setTimeout(() => {
      setIsShowingIntro(false);
    }, 2000); // 2-second intro

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isShowingIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/30"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
              className="text-4xl font-bold font-headline tracking-tight text-primary-foreground"
            >
              Dopamind
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.5 }}
              className="text-center text-primary-foreground/80 mt-2"
            >
              Tap. Play. Reset.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      {!isShowingIntro && children}
    </>
  );
}

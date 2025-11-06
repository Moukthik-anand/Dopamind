'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

export function AppTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // On initial load, if the user is on a game page, redirect to home.
    const navigationEntries = window.performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0 && (navigationEntries[0] as PerformanceNavigationTiming).type === 'reload') {
      if (pathname.startsWith('/games/')) {
        router.replace('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Depend on pathname to re-evaluate on route change

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';

export function AppTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // This logic runs only once when the component first mounts on the client.
    if (isInitialLoad.current) {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      const navType = navigationEntries.length > 0 ? (navigationEntries[0] as PerformanceNavigationTiming).type : '';

      // We consider it a "direct load" or "refresh" if the navigation type is 'navigate' or 'reload'.
      // This ensures that loading a game URL directly in the address bar or refreshing the page triggers the redirect.
      const shouldRedirect = navType === 'reload' || navType === 'navigate';
      
      if (shouldRedirect && pathname.startsWith('/games')) {
        router.replace('/');
      }
      
      // Mark initial load as false so this block doesn't run on subsequent re-renders or navigations.
      isInitialLoad.current = false;
    }
  // The empty dependency array ensures this effect runs only once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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

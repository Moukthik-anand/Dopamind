'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

export function AppTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // This logic ensures that if a user performs a hard refresh or directly
    // loads a URL for a game, they are redirected to the home page.
    // It uses sessionStorage to prevent this redirect from happening during
    // normal client-side navigation within the app.
    const navigationEntries = window.performance.getEntriesByType('navigation');
    const isReload = navigationEntries.length > 0 && (navigationEntries[0] as PerformanceNavigationTiming).type === 'reload';
    const hasNavigated = sessionStorage.getItem('dopamind-navigated');

    if ((isReload || !hasNavigated) && pathname.startsWith('/games')) {
      router.replace('/');
    }

    // Set a flag in session storage after the first navigation check
    // to prevent redirection on subsequent client-side route changes.
    if (!hasNavigated) {
      sessionStorage.setItem('dopamind-navigated', 'true');
    }
    
  // We only want this to run once on the initial load of the component instance,
  // so we provide an empty dependency array. The pathname is included to re-evaluate
  // if the user navigates to a game page directly from the address bar.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); 

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

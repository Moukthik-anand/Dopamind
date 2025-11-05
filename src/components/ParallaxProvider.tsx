
'use client';

import { motion, useScroll, useTransform, useMotionValue, useVelocity, useSpring, useAnimationFrame } from 'framer-motion';
import { ReactNode, useRef, useEffect } from 'react';
import { wrap } from '@motionone/utils';

interface ParallaxProviderProps {
    children: ReactNode;
    baseVelocity?: number;
}

export function ParallaxProvider({ children, baseVelocity = 0.5 }: ParallaxProviderProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const x = useTransform(baseX, (v) => `${wrap(-2, 2, v)}%`);

  const directionFactor = useRef<number>(1);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseX.set(baseX.get() + moveBy);
  });
  
  return (
    <div className="relative overflow-x-hidden">
      <motion.div 
        className="absolute inset-0 z-[-1] bg-gradient-to-br from-background via-primary/10 to-accent/10 opacity-50" 
        style={{ 
            x,
            width: '104%',
            left: '-2%',
        }}
      />
      {children}
    </div>
  );
}

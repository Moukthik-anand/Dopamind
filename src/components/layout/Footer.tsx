
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function Footer() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.footer
      ref={ref}
      style={{ opacity }}
      className="w-full py-4 pb-5" // Added more bottom padding
    >
      <div className="container text-center text-xs font-normal" style={{ color: '#c0c0c0' }}>
        © 2025 Built by Moukthik Anand
      </div>
    </motion.footer>
  );
}

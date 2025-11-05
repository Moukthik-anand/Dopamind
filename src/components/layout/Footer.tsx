
'use client';

import { motion } from 'framer-motion';

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="w-full py-4"
    >
      <div className="container text-center text-sm" style={{ color: '#c9c9c9' }}>
        Built with 💜 by Moukthik Anand
      </div>
    </motion.footer>
  );
}


'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { AboutModal } from '@/components/AboutModal';

export function Footer() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"]
  });
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const opacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

  return (
    <>
      <motion.footer
        ref={ref}
        style={{ opacity }}
        className="w-full pt-4 pb-5"
      >
        <div className="container flex justify-center items-center gap-4 text-center">
            <span className="text-[13px] font-medium tracking-[0.3px] text-[#6b6b6b] dark:text-[#a8a8a8]">
              © 2025 Built by Moukthik Anand
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-[#6b6b6b] dark:text-[#a8a8a8] hover:bg-black/10 dark:hover:bg-white/10" 
              onClick={() => setIsAboutModalOpen(true)}
            >
                <Info className="h-4 w-4" />
                <span className="sr-only">About Dopamind</span>
            </Button>
        </div>
      </motion.footer>
      <AboutModal open={isAboutModalOpen} onOpenChange={setIsAboutModalOpen} />
    </>
  );
}

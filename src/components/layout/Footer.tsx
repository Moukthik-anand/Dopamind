'use client';

import { AboutModal } from '@/components/AboutModal';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { useState } from 'react';

export function Footer() {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <>
      <footer className="fixed bottom-0 left-0 w-full py-5 border-t border-border/20 bg-background/30 backdrop-blur-lg supports-[backdrop-filter]:bg-background/30 z-40">
        <div className="container flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground/80">
            <span className="text-xs font-medium">
              © 2025 Built by Moukthik Anand
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground/80 hover:bg-black/10 dark:hover:bg-white/10" 
              onClick={() => setIsAboutModalOpen(true)}
            >
                <Info className="h-4 w-4" />
                <span className="sr-only">About Dopamind</span>
            </Button>
        </div>
      </footer>
      <AboutModal open={isAboutModalOpen} onOpenChange={setIsAboutModalOpen} />
    </>
  );
}

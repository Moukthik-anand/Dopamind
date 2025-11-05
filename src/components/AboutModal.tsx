'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>About Dopamind</DialogTitle>
        </DialogHeader>
        <div className="mt-2 text-foreground/80">
          <p>
            Dopamind is a student-built stress-buster hub with micro-games
            designed to reset your mind in under three minutes. Play. Relax.
            Recharge.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

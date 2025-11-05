import type { LucideIcon } from 'lucide-react';
import { CircleDashed, Wind, Brain, Brush, Waves } from 'lucide-react';

export interface Game {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  comingSoon?: boolean;
}

export const games: Game[] = [
  {
    id: 'bubble-popper',
    title: 'Bubble Popper',
    description: 'Tap to pop bubbles. So satisfying.',
    icon: CircleDashed,
    path: '/games/bubble-popper',
  },
  {
    id: 'breathe-with-me',
    title: 'Breathe With Me',
    description: 'Follow the orb for a calming breathing exercise.',
    icon: Wind,
    path: '/games/breathe-with-me',
  },
  {
    id: 'memory-flip',
    title: 'Memory Flip',
    description: 'Test your focus by matching card pairs.',
    icon: Brain,
    path: '/games/memory-flip',
  },
  {
    id: 'pixel-paint',
    title: 'Pixel Paint',
    description: 'Doodle and watch AI transform it into pixel art.',
    icon: Brush,
    path: '/games/pixel-paint',
  },
  {
    id: 'ripple-flow',
    title: 'Ripple Flow',
    description: 'Slide to create flowing water waves.',
    icon: Waves,
    path: '/games/ripple-touch',
  },
];

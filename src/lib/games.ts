
import type { LucideIcon } from 'lucide-react';
import { CircleDashed, Wind, Brain, Brush, Waves, Droplets, Palette } from 'lucide-react';

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
    id: 'color-fade',
    title: 'Color Fade',
    description: 'Tap when the color matches. A test of timing.',
    icon: Palette,
    path: '/games/color-fade',
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
    description: 'Slide to create soothing ripples.',
    icon: Waves,
    path: '/games/ripple-touch',
  },
  {
    id: 'catch-the-calm',
    title: 'Catch the Calm',
    description: 'Move to collect calm, avoid stress.',
    icon: Droplets,
    path: '/games/catch-the-calm',
  }
];

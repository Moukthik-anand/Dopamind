import type { LucideIcon } from 'lucide-react';
import { CircleDashed, Paintbrush, Brain, Blocks, Music, MousePointerClick, Puzzle, Gamepad2 } from 'lucide-react';

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
    id: 'pixel-paint',
    title: 'Pixel Paint',
    description: 'Doodle and watch AI transform it.',
    icon: Paintbrush,
    path: '/games/pixel-paint',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Test your memory with this classic game.',
    icon: Brain,
    path: '#',
    comingSoon: true,
  },
  {
    id: 'color-sort',
    title: 'Color Sort',
    description: 'Sort the colors into the right tubes.',
    icon: Blocks,
    path: '#',
    comingSoon: true,
  },
  {
    id: 'pattern-play',
    title: 'Pattern Play',
    description: 'Repeat the sequence of lights and sounds.',
    icon: Music,
    path: '#',
    comingSoon: true,
  },
  {
    id: 'swift-swipe',
    title: 'Swift Swipe',
    description: 'Swipe in the direction of the arrows.',
    icon: MousePointerClick,
    path: '#',
    comingSoon: true,
  },
  {
    id: 'puzzle-piece',
    title: 'Puzzle Piece',
    description: 'Fit the pieces into the puzzle.',
    icon: Puzzle,
    path: '#',
    comingSoon: true,
  },
  {
    id: 'zen-stacker',
    title: 'Zen Stacker',
    description: 'Stack blocks as high as you can.',
    icon: Gamepad2,
    path: '#',
    comingSoon: true,
  },
    {
    id: 'word-flow',
    title: 'Word Flow',
    description: 'Find words in a grid of letters.',
    icon: Gamepad2,
    path: '#',
    comingSoon: true,
  },
  {
    id: 'dot-connect',
    title: 'Dot Connect',
    description: 'Connect the dots without crossing lines.',
    icon: Gamepad2,
    path: '#',
    comingSoon: true,
  },
];

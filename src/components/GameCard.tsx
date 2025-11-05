import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Game } from '@/lib/games';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const Icon = game.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.03, rotate: game.comingSoon ? 0 : -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      <Card className={cn("flex flex-col transition-all glass-card", game.comingSoon && "opacity-60")}>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-xl">{game.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription>{game.description}</CardDescription>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" disabled={game.comingSoon}>
            <Link href={game.path}>
              {game.comingSoon ? "Coming Soon" : "Play"}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

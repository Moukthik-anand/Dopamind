import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Game } from '@/lib/games';
import { cn } from '@/lib/utils';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const Icon = game.icon;

  return (
    <Card className={cn("flex flex-col transition-all hover:shadow-lg hover:scale-[1.02]", game.comingSoon && "opacity-60 hover:shadow-sm hover:scale-100")}>
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
  );
}

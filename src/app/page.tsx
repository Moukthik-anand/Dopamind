import { games } from '@/lib/games';
import { GameCard } from '@/components/GameCard';
import { DailyChallenge } from '@/components/DailyChallenge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dices } from 'lucide-react';

export default function Home() {

  const getRandomGamePath = () => {
    const randomIndex = Math.floor(Math.random() * games.length);
    return games[randomIndex].path;
  }

  return (
    <div className="container py-8 md:py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold font-headline mb-2 tracking-tight">Welcome Back!</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Ready to reset? Pick a game and start playing for a moment of calm.</p>
        <div className="mt-6">
            <Button asChild size="lg">
                <Link href={getRandomGamePath()}>
                    <Dices className="mr-2" /> Play Random Game
                </Link>
            </Button>
        </div>
      </section>

      <section className="mb-12 max-w-4xl mx-auto">
        <DailyChallenge />
      </section>

      <section>
        <h2 className="text-3xl font-bold font-headline mb-6 text-center">Microgames</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}

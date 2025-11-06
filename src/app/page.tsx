"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { games } from '@/lib/games';
import { GameCard } from '@/components/GameCard';
import { useUser } from '@/firebase';
import { AnimatePresence, motion } from 'framer-motion';
import { Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [randomGamePath, setRandomGamePath] = useState('');
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // This code runs only on the client, after hydration
    const getRandomGamePath = () => {
      const randomIndex = Math.floor(Math.random() * games.length);
      return games[randomIndex].path;
    };
    setRandomGamePath(getRandomGamePath());
  }, []); // Empty dependency array ensures this runs only once on mount

  const firstName = user?.displayName?.split(' ')[0];

  return (
    <div className="container py-8 md:py-12">
      <section className="mb-12 text-center flex flex-col items-center w-full">
        <AnimatePresence>
          {!isUserLoading && user ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="mb-4"
            >
              <h1 className="text-4xl lg:text-5xl font-bold font-headline mb-2 tracking-tight">
                Welcome back, {firstName}!
              </h1>
               <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Ready to reset? Pick a game and start playing for a moment of calm.</p>
            </motion.div>
          ) : (
             <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="mb-4"
            >
                 <h1 className="text-4xl lg:text-5xl font-bold font-headline mb-2 tracking-tight">
                    Dopamind
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Ready to reset? Pick a game and start playing for a moment of calm.</p>
             </motion.div>
          )}
        </AnimatePresence>

        <div className="my-4">
          <Button
            asChild
            className="py-3 px-6 text-base font-semibold rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-purple-300/30 to-purple-500/20 text-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-400/40"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          >
            <Link href={randomGamePath || '/'}>
              <Dices className="mr-2 h-5 w-5" />
              Play Random Game
            </Link>
          </Button>
        </div>
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

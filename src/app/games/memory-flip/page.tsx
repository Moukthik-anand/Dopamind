
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, Award, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

const icons = [
  'Cat', 'Dog', 'Fish', 'Bird', 'Rabbit', 'Turtle', 'Bug', 'Beetle'
].map(name => {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react. Check for typos.`);
    // Return a placeholder or default icon if needed
    return { name, icon: LucideIcons.HelpCircle };
  }
  return { name, icon: IconComponent as React.ComponentType<{ className: string }> };
});


const generateCards = () => {
  const cardIcons = [...icons, ...icons];
  // Shuffle cards
  for (let i = cardIcons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardIcons[i], cardIcons[j]] = [cardIcons[j], cardIcons[i]];
  }
  return cardIcons.map((item, index) => ({
    id: index,
    name: item.name,
    Icon: item.icon,
    isFlipped: false,
    isMatched: false,
  }));
};

export default function MemoryFlipPage() {
  const [cards, setCards] = useState<ReturnType<typeof generateCards>>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    // Generate and shuffle cards on the client side to avoid hydration errors
    setCards(generateCards());
  }, []);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstId, secondId] = flippedCards;
      const firstCard = cards[firstId];
      const secondCard = cards[secondId];

      if (firstCard.name === secondCard.name) {
        // Match
        setCards(prev =>
          prev.map(card =>
            card.name === firstCard.name ? { ...card, isMatched: true } : card
          )
        );
        setFlippedCards([]);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              (card.id === firstId || card.id === secondId)
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isMatched)) {
      setGameOver(true);
    }
  }, [cards]);

  const handleCardClick = (id: number) => {
    if (flippedCards.length < 2 && !cards[id].isFlipped) {
      setCards(prev =>
        prev.map(card =>
          card.id === id ? { ...card, isFlipped: true } : card
        )
      );
      setFlippedCards(prev => [...prev, id]);
    }
  };

  const resetGame = () => {
    setCards(generateCards());
    setFlippedCards([]);
    setMoves(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold font-headline">Memory Flip</h1>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Find the Pairs</CardTitle>
          <CardDescription>Click cards to flip them and find matching pairs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Award className="w-5 h-5 text-primary" />
              Moves: {moves}
            </div>
            <Button onClick={resetGame} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-4 gap-4">
              {cards.map(card => (
                <div
                  key={card.id}
                  className="w-full aspect-square"
                  onClick={() => !card.isMatched && handleCardClick(card.id)}
                >
                  <motion.div
                    className="relative w-full h-full"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Card Back */}
                    <div className="absolute w-full h-full bg-muted rounded-lg flex items-center justify-center cursor-pointer" style={{ backfaceVisibility: 'hidden' }}>
                      <Brain className="w-1/2 h-1/2 text-muted-foreground/30" />
                    </div>
                    {/* Card Front */}
                    <div
                      className={cn(
                        "absolute w-full h-full bg-card border rounded-lg flex items-center justify-center",
                        card.isMatched && "bg-primary/20 border-primary"
                      )}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <card.Icon className="w-1/2 h-1/2 text-primary" />
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {gameOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg"
                >
                  <h2 className="text-3xl font-bold text-white mb-2">You Win!</h2>
                  <p className="text-xl text-white mb-4">You found all pairs in {moves} moves.</p>
                  <Button onClick={resetGame} size="lg">
                    <RefreshCw className="mr-2 h-4 w-4" /> Play Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

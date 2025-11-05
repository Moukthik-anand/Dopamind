"use client";

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Gamepad2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { games } from '@/lib/games';

interface DailyChallengeOutput {
  challenge: string;
  suggestedGame: string;
}

export function DailyChallenge() {
  const [challenge, setChallenge] = useState<DailyChallengeOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock challenge generation
    setLoading(true);
    const mockChallenge: DailyChallengeOutput = {
      challenge: 'Pop 50 bubbles in under a minute!',
      suggestedGame: 'Bubble Popper'
    };
    setTimeout(() => {
      setChallenge(mockChallenge);
      setLoading(false);
    }, 1000);
  }, []);

  const suggestedGameDetails = useMemo(() => {
    if (!challenge?.suggestedGame) return null;
    return games.find(g => g.title.toLowerCase() === challenge.suggestedGame.toLowerCase());
  }, [challenge]);

  return (
    <Card className="glass-card shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" />
            <div>
                <CardTitle className="font-headline text-xl">Your Daily Challenge</CardTitle>
                <CardDescription>A special task, just for you.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating your personalized challenge...</span>
          </div>
        ) : challenge ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-lg font-medium">{challenge.challenge}</p>
              <div className="flex items-center gap-2 text-muted-foreground mt-2 text-sm">
                <Gamepad2 className="w-4 h-4" />
                <span>Today's Game: <strong>{challenge.suggestedGame}</strong></span>
              </div>
            </div>
            {suggestedGameDetails && !suggestedGameDetails.comingSoon && (
              <Button asChild className="shrink-0 mt-4 sm:mt-0">
                <Link href={suggestedGameDetails.path}>Play Now</Link>
              </Button>
            )}
          </div>
        ) : (
          <p>Could not load your daily challenge. Please try again later.</p>
        )}
      </CardContent>
    </Card>
  );
}

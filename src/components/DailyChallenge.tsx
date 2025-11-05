"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { generateDailyChallenge, DailyChallengeOutput } from '@/ai/flows/personalized-daily-challenge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Gamepad2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { games } from '@/lib/games';

export function DailyChallenge() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [challenge, setChallenge] = useState<DailyChallengeOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const getUserData = useCallback(async (uid: string): Promise<DocumentData | null> => {
    if (!uid || !firestore) return null;
    const userDocRef = doc(firestore, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }
    return null;
  }, [firestore]);


  useEffect(() => {
    async function fetchChallenge() {
      if (user) {
        setLoading(true);
        try {
          const userData = await getUserData(user.uid);
          const playHistoryString = userData?.playHistory?.length
            ? `User has played ${userData.playHistory.length} times. Recent games: ${userData.playHistory.slice(-5).map((p:any) => p.gameId).join(', ')}`
            : 'No play history available.';
          
          const result = await generateDailyChallenge({ userPlayHistory: playHistoryString });
          setChallenge(result);
        } catch (error) {
          console.error('Failed to generate daily challenge:', error);
          setChallenge(null);
        } finally {
          setLoading(false);
        }
      }
    }
    // Only run on initial load for a user
    if (user && !challenge) {
        fetchChallenge();
    }
  }, [user, challenge, getUserData]);

  const suggestedGameDetails = useMemo(() => {
    if (!challenge?.suggestedGame) return null;
    return games.find(g => g.title.toLowerCase() === challenge.suggestedGame.toLowerCase());
  }, [challenge]);

  if (!user) {
    return null; // Don't show for logged-out users
  }
  
  return (
    <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" />
            <div>
                <CardTitle className="font-headline text-xl">Your Daily Challenge</CardTitle>
                <CardDescription>A special task, just for you, powered by AI.</CardDescription>
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

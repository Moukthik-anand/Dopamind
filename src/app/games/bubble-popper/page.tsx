"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RefreshCw, Play, Pause } from "lucide-react";

const TARGET_POP_COUNT = 70;
const XP_AWARD = 1500;

export default function BubblePopper() {
  const [popCount, setPopCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stopGame = () => {
    setFinished(true);
  };

  const handlePop = () => {
    if (finished) return;
    if (!gameStarted) {
      setGameStarted(true);
    }
    setPopCount((prev) => {
      const next = prev + 1;
      if (next >= TARGET_POP_COUNT) {
        stopGame();
      }
      return next;
    });
  };

  const resetGame = () => {
    setPopCount(0);
    setFinished(false);
    setGameStarted(false);
  };

  const handleEndButton = () => {
      stopGame();
  }

  return (
    <div className="flex flex-col items-center gap-6">
       <h1 className="text-4xl font-bold font-headline">Bubble Popper</h1>
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle>Pop {TARGET_POP_COUNT} Bubbles</CardTitle>
            </CardHeader>
            <CardContent>
                {!finished ? (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-3xl font-bold text-primary">{popCount}</p>
                        <p className="text-muted-foreground">Bubbles Popped</p>
                        
                        <div className="flex flex-col items-center gap-3 mt-4">
                           <Button onClick={handlePop} size="lg">
                                Pop a Bubble!
                           </Button>
                           {gameStarted && (
                             <Button onClick={handleEndButton} variant="secondary" size="sm">
                                End Game
                             </Button>
                           )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <h3 className="text-2xl font-bold">Challenge Complete!</h3>
                        <p className="text-muted-foreground">You popped {TARGET_POP_COUNT} bubbles!</p>
                        <p className="text-lg font-semibold text-yellow-400">You earned {XP_AWARD} XP!</p>
                        <Button onClick={resetGame} size="lg" className="mt-4">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Play Again
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

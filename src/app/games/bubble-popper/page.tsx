"use client";
import { useState, useRef, useEffect } from "react";

const TARGET_POP_COUNT = 70;

export default function BubblePopper() {
  const [popCount, setPopCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Start the timer loop
  const startTimer = () => {
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      if (!startTimeRef.current || !running) return;
      setElapsed((now - startTimeRef.current) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  // Stop game + finalize timer
  const stopGame = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const endTime = performance.now();
    const totalTime = startTimeRef.current
      ? (endTime - startTimeRef.current) / 1000
      : elapsed;

    setElapsed(Number(totalTime.toFixed(2))); // ✅ Force final update before UI render
    setRunning(false);
    setFinished(true);

    const earnedXP = Math.max(100, Math.floor(2000 - totalTime * 15));
    setXpEarned(earnedXP);
  };

  // Handle bubble pop
  const handlePop = () => {
    if (!running && !finished) {
      setRunning(true);
      startTimer();
    }

    setPopCount((prev) => {
      const next = prev + 1;
      if (next >= TARGET_POP_COUNT) stopGame();
      return next;
    });
  };

  // Reset game state
  const resetGame = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPopCount(0);
    setElapsed(0);
    setRunning(false);
    setFinished(false);
    setXpEarned(0);
  };

  useEffect(() => {
    return () => {if (rafRef.current) cancelAnimationFrame(rafRef.current)};
  }, []);

  const progress = Math.min(100, Math.round((popCount / TARGET_POP_COUNT) * 100));

  return (
    <div className="flex flex-col items-center gap-4 text-center w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-2">Bubble Popper</h2>

      {!finished ? (
        <>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between w-full text-sm font-medium text-gray-300">
            <p>Popped: {popCount}/{TARGET_POP_COUNT}</p>
            <p>Time: {elapsed.toFixed(2)}s</p>
          </div>

          <div className="flex flex-col items-center gap-3 mt-2">
            <button
              onClick={handlePop}
              className="px-6 py-2 rounded-xl bg-purple-500 text-white font-semibold hover:scale-105 transition"
            >
              Pop Bubble
            </button>
            <button
              onClick={resetGame}
              className="px-6 py-2 rounded-xl bg-gray-600 text-white font-semibold hover:scale-105 transition"
            >
              Reset
            </button>
          </div>
        </>
      ) : (
        <div className="bg-purple-600/30 p-6 rounded-2xl mt-3">
          <h3 className="text-xl font-bold mb-2">Challenge Complete!</h3>
          <p className="text-base mb-2">
            You popped {TARGET_POP_COUNT} bubbles in {elapsed.toFixed(2)} seconds.
          </p>
          <p className="text-base font-medium text-yellow-200">XP Earned: +{xpEarned}</p>

          <button
            onClick={resetGame}
            className="mt-4 px-6 py-2 rounded-xl bg-purple-500 text-white font-semibold hover:scale-105 transition"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

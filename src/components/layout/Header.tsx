"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrainCircuit, Star, Flame, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { games } from "@/lib/games";


export function Header() {
  const [randomGamePath, setRandomGamePath] = useState('');

  useEffect(() => {
    // This code runs only on the client, after hydration
    const getRandomGamePath = () => {
      const randomIndex = Math.floor(Math.random() * games.length);
      return games[randomIndex].path;
    };
    setRandomGamePath(getRandomGamePath());
  }, []); // Empty dependency array ensures this runs only once on mount

  const user = {
    displayName: 'Demo User',
    photoURL: 'https://picsum.photos/seed/dopamind/40/40',
  }
  const userData = {
    xp: 1250,
    streak: 5,
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline sm:inline-block">
            Dopamind
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
            <Button variant="ghost" asChild>
                <Link href={randomGamePath || "/"}>
                    <Dices className="mr-2" />
                    Play Random
                </Link>
            </Button>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
              <>
                <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>{userData.xp}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>{userData.streak}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user.photoURL ?? ""}
                          alt={user.displayName ?? "User"}
                        />
                        <AvatarFallback>
                          {user.displayName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.displayName}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Sign In to save progress
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

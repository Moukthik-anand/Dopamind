"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrainCircuit, Star, Flame, Dices, LogOut, User as UserIcon } from "lucide-react";
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
import { useUser, useAuth } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';


export function Header() {
  const [randomGamePath, setRandomGamePath] = useState('');
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
  useEffect(() => {
    const getRandomGamePath = () => {
      if (games.length === 0) return "/";
      const randomIndex = Math.floor(Math.random() * games.length);
      return games[randomIndex].path;
    };
    setRandomGamePath(getRandomGamePath());
  }, []);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Google Sign-In error:", error);
      }
    }
  };

  const handleSignOut = () => {
    if (auth) {
      signOut(auth);
    }
  };
  
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
              {isUserLoading ? (
                 <div className="flex items-center gap-4">
                    <div className="h-8 w-16 bg-muted rounded-full animate-pulse" />
                    <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
                 </div>
              ) : user ? (
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
                           <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                 <Button onClick={handleGoogleSignIn}>
                    <UserIcon className="mr-2 h-4 w-4"/>
                    Login
                 </Button>
              )}
            <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

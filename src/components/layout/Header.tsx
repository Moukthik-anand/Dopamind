'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  Star,
  Flame,
  Dices,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { games } from '@/lib/games';
import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Header() {
  const [randomGamePath, setRandomGamePath] = useState('');
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    const getRandomGamePath = () => {
      if (games.length === 0) return '/';
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
        console.error('Google Sign-In error:', error);
      }
    }
  };

  const handleSignOut = () => {
    if (auth) {
      signOut(auth);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/30 backdrop-blur-lg supports-[backdrop-filter]:bg-background/30">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <BrainCircuit className="h-6 w-6 text-primary" />
           <motion.span
            className="font-bold font-headline sm:inline-block text-foreground"
            animate={{
              textShadow: ['0 0 4px rgba(255,255,255,0)', '0 0 8px rgba(217, 184, 222, 0.7)', '0 0 4px rgba(255,255,255,0)'],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatDelay: 18.4,
              ease: 'easeInOut',
            }}
          >
            Dopamind
          </motion.span>
        </Link>
        <nav className="flex-grow flex justify-center items-center gap-4 text-sm font-medium">
          <Button variant="ghost" asChild>
            <Link href={randomGamePath || '/'}>
              <Dices className="mr-2" />
              Play Random
            </Link>
          </Button>
        </nav>
        <div className="flex items-center justify-end space-x-2 md:space-x-4 flex-shrink-0">
          {isUserLoading ? (
            <div className="flex items-center gap-4">
              <div className="h-8 w-16 bg-muted rounded-full animate-pulse" />
              <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
            </div>
          ) : user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-3 py-1 text-sm font-medium">
                <Star className="h-4 w-4 text-yellow-400" />
                <span>{userProfile?.score ?? 0}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user.photoURL ?? ''}
                        alt={user.displayName ?? 'User'}
                      />
                      <AvatarFallback>
                        {user.displayName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-2 rounded-xl bg-white dark:bg-[#1e1e1e] border border-border shadow-lg" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none text-[#111] dark:text-white">
                        {user.displayName}
                      </p>
                      <p className="text-xs leading-none text-[#555] dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />
                   <DropdownMenuItem className="sm:hidden w-full justify-start rounded-md bg-gray-100/50 dark:bg-gray-800/50 font-medium text-[#222] dark:text-gray-200 p-2 cursor-default">
                    <Star className="mr-2 h-4 w-4" />
                    <span>Score: {userProfile?.score ?? 0}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="w-full justify-center rounded-md bg-gray-100 dark:bg-gray-800 font-medium text-[#222] dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:bg-gray-200 dark:focus:bg-gray-700 p-2 cursor-pointer mt-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={handleGoogleSignIn}>
              <UserIcon className="mr-2 h-4 w-4" />
              Login
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

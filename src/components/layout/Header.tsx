"use client";

import Link from "next/link";
import { BrainCircuit, Star, Flame } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
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
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useFirestore } from "@/firebase";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "../ui/skeleton";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  xp: number;
  streak: number;
  lastPlayedDate: string | null; // ISO string
  favoriteGames: string[];
  playHistory: { gameId: string; score: number; date: string }[];
}

export function Header() {
  const { user, isUserLoading: authLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const getUserData = useCallback(async (uid: string): Promise<UserData | null> => {
    if (!uid || !firestore) return null;
    const userDocRef = doc(firestore, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserData;
    }
    return null;
  },[firestore]);

  const createUserData = useCallback(async (uid: string, data: UserData): Promise<void> => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', uid);
    await setDoc(userDocRef, data);
  }, [firestore]);


  useEffect(() => {
    if (authLoading) {
      setDataLoading(true);
      return;
    }
    if (user) {
      setDataLoading(true);
      const fetchUserData = async () => {
        let dbUser = await getUserData(user.uid);
        if (!dbUser) {
           const newUserData: UserData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            xp: 0,
            streak: 0,
            lastPlayedDate: null,
            favoriteGames: [],
            playHistory: [],
          };
          await createUserData(user.uid, newUserData);
          dbUser = newUserData;
        }
        setUserData(dbUser);
        setDataLoading(false);
      };
      fetchUserData();
    } else {
        setUserData(null);
        setDataLoading(false);
    }
  }, [user, authLoading, createUserData, getUserData]);

  const isLoading = authLoading || dataLoading;

  async function signInWithGoogle() {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      throw error;
    }
  }

  async function signOut() {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
      throw error;
    }
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
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
            {isLoading ? (
                <>
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </>
            ) : user && userData ? (
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
                    <DropdownMenuItem onClick={signOut}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={signInWithGoogle}>Sign In</Button>
            )}
            <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

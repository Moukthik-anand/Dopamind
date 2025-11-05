import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

export interface UserData {
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

export async function getUserData(uid: string): Promise<UserData | null> {
  if (!uid) return null;
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserData;
  }
  return null;
}

export async function createUserData(uid: string, data: UserData): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, data);
}

export async function updateUserData(uid:string, data: Partial<Omit<UserData, 'playHistory'>> & { playHistory?: any }): Promise<void> {
    if (!uid) return;
    const userDocRef = doc(db, 'users', uid);
    
    // Use arrayUnion for playHistory to append new records instead of overwriting
    if (data.playHistory) {
      const historyUpdate = {
        ...data,
        playHistory: arrayUnion(data.playHistory)
      };
      await updateDoc(userDocRef, historyUpdate);
    } else {
      await updateDoc(userDocRef, data);
    }
}

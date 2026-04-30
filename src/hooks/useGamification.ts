import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface UserPoints {
  points: number;
  level: 'Newcomer' | 'Member' | 'Contributor' | 'Champion';
  streakDays: number;
  lastActivity: any;
}

export function useGamification() {
  const [stats, setStats] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const startListener = (uid: string) => {
      const userRef = doc(db, 'users', uid, 'points', 'stats');
      
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setStats(docSnap.data() as UserPoints);
        } else {
          // Initialize stats
          const initialStats: UserPoints = {
            points: 0,
            level: 'Newcomer',
            streakDays: 1,
            lastActivity: serverTimestamp()
          };
          setDoc(userRef, initialStats).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `users/${uid}/points/stats`);
          });
          setStats(initialStats);
        }
        setLoading(false);
      }, (err) => {
        setLoading(false);
        if (err.code !== 'permission-denied') {
          handleFirestoreError(err, OperationType.GET, `users/${uid}/points/stats`);
        }
      });
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        startListener(user.uid);
      } else {
        setStats(null);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, []);

  const addPoints = async (amount: number) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid, 'points', 'stats');
    
    try {
      const snap = await getDoc(userRef);
      const currentPoints = (snap.data()?.points || 0) + amount;
      
      let level: UserPoints['level'] = 'Newcomer';
      if (currentPoints >= 1000) level = 'Champion';
      else if (currentPoints >= 500) level = 'Contributor';
      else if (currentPoints >= 100) level = 'Member';

      await updateDoc(userRef, {
        points: increment(amount),
        level,
        lastActivity: serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating points:", err);
    }
  };

  return { stats, loading, addPoints };
}

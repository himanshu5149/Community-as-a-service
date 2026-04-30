import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Member {
  id: string;
  displayName: string;
  photoURL: string;
  points: number;
  level: number;
  groups: string[];
  role?: string;
  bio?: string;
  status?: 'online' | 'offline';
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const startListener = () => {
      const path = 'users';
      const q = query(
        collection(db, path),
        orderBy('displayName', 'asc'),
        limit(50)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        setMembers(snapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        })) as Member[]);
        setLoading(false);
      }, (err) => {
        setLoading(false);
        if (err.code !== 'permission-denied') {
          handleFirestoreError(err, OperationType.LIST, path);
        }
      });
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        startListener();
      } else {
        setMembers([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, []);

  return { members, loading };
}

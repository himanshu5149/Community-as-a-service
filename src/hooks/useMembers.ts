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
  bio?: string;
  status?: 'online' | 'offline';
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a production app, users should have a dedicated /users collection
    // We'll fetch all users who have active profiles
    const path = 'users';
    const q = query(
      collection(db, path),
      orderBy('displayName', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      })) as Member[]);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return unsubscribe;
  }, []);

  return { members, loading };
}

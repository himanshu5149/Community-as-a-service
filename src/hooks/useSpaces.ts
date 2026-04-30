import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface Space {
  id: string;
  name: string;
  description: string;
  icon: string;
  connectedGroups: string[];
  members: string[];
  lastActivity: any;
}

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    
    const startListener = () => {
      const path = 'spaces';
      const q = query(collection(db, path), orderBy('lastActivity', 'desc'));

      unsubscribe = onSnapshot(q, (snapshot) => {
        setSpaces(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Space[]);
        setLoading(false);
      }, (err) => {
         if (err.code !== 'permission-denied') {
            handleFirestoreError(err, OperationType.LIST, path);
         }
         setLoading(false);
      });
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        startListener();
      } else {
        setSpaces([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, []);

  const createSpace = async (spaceData: Omit<Space, 'id' | 'members' | 'lastActivity'>) => {
    if (!auth.currentUser) return;
    
    const path = 'spaces';
    try {
      await addDoc(collection(db, path), {
        ...spaceData,
        members: [auth.currentUser.uid],
        lastActivity: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const joinSpace = async (spaceId: string) => {
    if (!auth.currentUser) return;
    
    const spaceRef = doc(db, 'spaces', spaceId);
    await updateDoc(spaceRef, {
      members: Array.from(new Set([...spaces.find(s => s.id === spaceId)?.members || [], auth.currentUser.uid]))
    });
  };

  return { spaces, loading, createSpace, joinSpace };
}

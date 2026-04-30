import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>; // index: count
  userVotes: Record<string, number>; // userId: index
  createdAt: any;
}

export function usePolls(groupId: string) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    const startListener = () => {
      const path = `groups/${groupId}/polls`;
      const q = query(
        collection(db, path),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Poll[];
        setPolls(data);
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
        setPolls([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, [groupId]);

  const vote = async (pollId: string, optionIndex: number) => {
    if (!auth.currentUser || !groupId) return;
    
    const path = `groups/${groupId}/polls`;
    const pollRef = doc(db, path, pollId);
    
    try {
      await updateDoc(pollRef, {
        [`votes.${optionIndex}`]: increment(1),
        [`userVotes.${auth.currentUser.uid}`]: optionIndex
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  return { polls, loading, vote };
}

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface BridgeSuggestion {
  id: string;
  postId: string;
  fromGroup: string;
  suggestedGroup: string;
  reason: string;
  createdAt: any;
  status: 'pending' | 'accepted' | 'rejected';
}

export function useBridgeSuggestions(postId?: string) {
  const [suggestions, setSuggestions] = useState<BridgeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const startListener = () => {
      let q = query(collection(db, 'bridge_suggestions'), orderBy('createdAt', 'desc'));
      
      if (postId) {
        q = query(collection(db, 'bridge_suggestions'), where('postId', '==', postId), orderBy('createdAt', 'desc'));
      }

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BridgeSuggestion[];
        setSuggestions(data);
        setLoading(false);
      }, (error) => {
        if (error.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'bridge_suggestions');
        }
        setLoading(false);
      });
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        startListener();
      } else {
        setSuggestions([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, [postId]);

  const suggestBridge = async (postId: string, fromGroup: string, suggestedGroup: string, reason: string) => {
    try {
      await addDoc(collection(db, 'bridge_suggestions'), {
        postId,
        fromGroup,
        suggestedGroup,
        reason,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bridge_suggestions');
    }
  };

  return { suggestions, loading, suggestBridge };
}

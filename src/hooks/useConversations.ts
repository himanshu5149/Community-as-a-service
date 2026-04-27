import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  participantData?: Record<string, { name: string, avatar: string }>;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const startListener = (uid: string) => {
      const path = 'conversations';
      const q = query(
        collection(db, path),
        where('participants', 'array-contains', uid),
        orderBy('lastMessageAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Conversation[];
        setConversations(data);
        setLoading(false);
      }, (err) => {
        if (err.code !== 'permission-denied') {
          handleFirestoreError(err, OperationType.LIST, path);
        }
        setLoading(false);
      });
    };

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        startListener(user.uid);
      } else {
        setConversations([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, []);

  const startConversation = async (otherUserId: string, otherUserName: string, otherUserAvatar: string) => {
    if (!auth.currentUser) return;
    
    // Sort to create a stable unique ID for the pair
    const participants = [auth.currentUser.uid, otherUserId].sort();
    const convId = participants.join('_');
    
    const path = 'conversations';
    const convRef = doc(db, path, convId);
    
    try {
      const snap = await getDoc(convRef);
      
      if (!snap.exists()) {
        await setDoc(convRef, {
          participants,
          lastMessageAt: serverTimestamp(),
          participantData: {
            [auth.currentUser.uid]: {
              name: auth.currentUser.displayName || 'Anonymous',
              avatar: auth.currentUser.photoURL || ''
            },
            [otherUserId]: {
              name: otherUserName,
              avatar: otherUserAvatar
            }
          }
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    
    return convId;
  };

  return { conversations, loading, startConversation };
}

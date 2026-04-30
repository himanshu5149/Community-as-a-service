import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'general' | 'announcements' | 'introductions' | 'resources';
  createdAt: any;
  createdBy: string;
}

export function useChannels(groupId: string) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    const startListener = () => {
      const path = `groups/${groupId}/channels`;
      const q = query(
        collection(db, path),
        orderBy('createdAt', 'asc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Channel[];
        setChannels(data);
        setLoading(false);
      }, (err: any) => {
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
        setChannels([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, [groupId]);

  const createChannel = async (name: string, description: string, type: string, userId: string) => {
    const path = `groups/${groupId}/channels`;
    try {
      await addDoc(collection(db, path), {
        name,
        description,
        type,
        groupId,
        createdAt: serverTimestamp(),
        createdBy: userId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  return { channels, loading, createChannel };
}

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

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
    if (!groupId) return;

    const path = `groups/${groupId}/channels`;
    const q = query(
      collection(db, path),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Channel[];
      setChannels(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setLoading(false);
    });

    return unsubscribe;
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

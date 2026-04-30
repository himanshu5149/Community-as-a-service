import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { GroupMember } from './useGroupRoles';

export function useGroupMembers(groupId: string) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    const startListener = () => {
      const path = `groups/${groupId}/members`;
      const q = query(
        collection(db, path),
        where('groupId', '==', groupId),
        orderBy('joinedAt', 'desc')
      );
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        setMembers(data as GroupMember[]);
        setLoading(false);
      }, (err) => {
        setLoading(false);
        // Suppress permission-denied for non-members during initial load
        if (err.code !== 'permission-denied') {
          try {
            handleFirestoreError(err, OperationType.LIST, path);
          } catch (e: any) {
            setError(e);
          }
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
  }, [groupId]);

  return { members, loading, error };
}

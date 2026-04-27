import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { GroupMember } from './useGroupRoles';

export function useGroupMembers(groupId: string) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    const path = `groups/${groupId}/members`;
    const q = query(collection(db, path), orderBy('joinedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setMembers(data as GroupMember[]);
      setLoading(false);
    }, (err) => {
      setLoading(false);
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (e: any) {
        setError(e);
      }
    });

    return unsubscribe;
  }, [groupId]);

  return { members, loading, error };
}

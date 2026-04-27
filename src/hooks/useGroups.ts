import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface Group {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  icon: string;
  memberCount: number;
  category: string;
  slug: string;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const path = 'groups';
    const q = query(collection(db, path), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Group[];
      setGroups(data);
      setLoading(false);
    }, (err) => {
      setLoading(false);
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (e: any) {
        setError(e);
      }
    });

    return () => unsubscribe();
  }, []);

  const createGroup = async (name: string, description: string, category: string = 'General') => {
    const path = 'groups';
    try {
      const docRef = await addDoc(collection(db, path), {
        name,
        description,
        category,
        accentColor: '#3B82F6',
        icon: 'LayoutGrid',
        memberCount: 1,
        slug: name.toLowerCase().replace(/ /g, '-'),
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid
      });
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  return { groups, loading, error, createGroup };
}

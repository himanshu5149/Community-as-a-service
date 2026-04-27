import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: any;
  imageUrl: string;
}

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const path = 'blogPosts';
      const q = query(collection(db, path), orderBy('date', 'desc'));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BlogPost[];
        setPosts(data);
        setLoading(false);
      }, (err) => {
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.LIST, path);
        } catch (e: any) {
          setError(e);
        }
      });
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, []);

  return { posts, loading, error };
}

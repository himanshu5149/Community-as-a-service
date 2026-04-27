import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: any;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/notifications`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const markAsRead = async (notifId: string) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, `users/${auth.currentUser.uid}/notifications`, notifId), {
      isRead: true
    });
  };

  return { notifications, loading, markAsRead };
}

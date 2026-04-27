import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
    let unsubscribe = () => {};

    const startListener = (uid: string) => {
      const q = query(
        collection(db, `users/${uid}/notifications`),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Notification[]);
        setLoading(false);
      }, (err) => {
        if (err.code !== 'permission-denied') {
          handleFirestoreError(err, OperationType.GET, 'notifications');
        }
        setLoading(false);
      });
    };

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        startListener(user.uid);
      } else {
        setNotifications([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, []);

  const markAsRead = async (notifId: string) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, `users/${auth.currentUser.uid}/notifications`, notifId), {
      isRead: true
    });
  };

  return { notifications, loading, markAsRead };
}

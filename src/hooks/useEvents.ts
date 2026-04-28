import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface Event {
  id: string;
  groupId: string;
  hostId: string;
  title: string;
  description: string;
  startTime: any;
  endTime: any;
  eventType: 'online' | 'in-person';
  meetingLink?: string;
  maxAttendees?: number;
  rsvps?: string[]; // userIds
}

export function useEvents(groupId?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    
    const startListener = () => {
      const path = groupId ? `groups/${groupId}/events` : 'events_global';
      const q = query(collection(db, path), orderBy('startTime', 'asc'));

      unsubscribe = onSnapshot(q, (snapshot) => {
        setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Event[]);
        setLoading(false);
      }, (err) => {
        if (err.code !== 'permission-denied') {
          handleFirestoreError(err, OperationType.LIST, path);
        }
        setLoading(false);
      });
    };

    startListener();

    return () => {
      unsubscribe();
    };
  }, [groupId]);

  const rsvp = async (event: Event, status: 'attending' | 'not-attending') => {
    if (!auth.currentUser) return;
    
    const path = groupId 
      ? `groups/${groupId}/events`
      : 'events_global';
    
    const eventRef = doc(db, path, event.id);

    // Simple RSVP array management
    const currentRSVPS = event.rsvps || [];
    let updated;
    if (status === 'attending') {
      updated = [...new Set([...currentRSVPS, auth.currentUser.uid])];
    } else {
      updated = currentRSVPS.filter(id => id !== auth.currentUser.uid);
    }

    try {
      await setDoc(eventRef, { rsvps: updated }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'hostId'>) => {
    if (!auth.currentUser) return;
    
    const path = groupId 
      ? `groups/${groupId}/events`
      : 'events_global';
    
    const targetCollection = collection(db, path);

    try {
      await addDoc(targetCollection, {
        ...eventData,
        hostId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        rsvps: [auth.currentUser.uid]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  return { events, loading, rsvp, createEvent };
}

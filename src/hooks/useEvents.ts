import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, where } from 'firebase/firestore';
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
      const q = groupId 
        ? query(
            collection(db, path), 
            where('groupId', '==', groupId),
            orderBy('startTime', 'asc')
          )
        : query(
            collection(db, path),
            where('eventType', '>=', ''),
            orderBy('startTime', 'asc')
          );

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

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        startListener();
      } else {
        setEvents([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, [groupId]);

  const rsvp = async (event: Event, status: 'attending' | 'not-attending') => {
    if (!auth.currentUser) return;
    
    const path = groupId 
      ? `groups/${groupId}/events`
      : 'events_global';
    
    const eventRef = doc(db, path, event.id);

    try {
      if (status === 'attending') {
        await updateDoc(eventRef, { 
          rsvps: arrayUnion(auth.currentUser.uid) 
        });
      } else {
        await updateDoc(eventRef, { 
          rsvps: arrayRemove(auth.currentUser.uid) 
        });
      }
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
        groupId: groupId || 'global',
        hostId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        rsvps: [auth.currentUser.uid]
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!auth.currentUser) return;
    const path = groupId ? `groups/${groupId}/events/${eventId}` : `events_global/${eventId}`;
    try {
      await deleteDoc(doc(db, groupId ? `groups/${groupId}/events` : 'events_global', eventId));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      return false;
    }
  };

  return { events, loading, rsvp, createEvent, deleteEvent };
}

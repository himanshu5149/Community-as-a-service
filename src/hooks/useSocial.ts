import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

export interface Friendship {
  id: string;
  users: string[];
  createdAt: any;
}

export function useSocial() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubRequests = () => {};
    let unsubFriends = () => {};

    const startListeners = (userId: string) => {
      // Listen for friend requests to the user
      const qRequests = query(
        collection(db, 'friend_requests'),
        where('toId', '==', userId),
        where('status', '==', 'pending')
      );

      // Listen for friendships involving the user
      const qFriends = query(
        collection(db, 'friendships'),
        where('users', 'array-contains', userId)
      );

      unsubRequests = onSnapshot(qRequests, (snapshot) => {
        setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest)));
      }, (err) => {
        if (err.code !== 'permission-denied') {
          handleFirestoreError(err, OperationType.LIST, 'friend_requests');
        }
      });

      unsubFriends = onSnapshot(qFriends, (snapshot) => {
        const friendIds = snapshot.docs.map(doc => {
          const data = doc.data() as Friendship;
          return data.users.find(id => id !== userId);
        }).filter(Boolean) as string[];
        setFriends(friendIds);
        setLoading(false);
      }, (err) => {
        if (err.code !== 'permission-denied') {
          handleFirestoreError(err, OperationType.LIST, 'friendships');
        }
        setLoading(false);
      });
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        startListeners(user.uid);
      } else {
        setRequests([]);
        setFriends([]);
        setLoading(false);
        unsubRequests();
        unsubFriends();
      }
    });

    return () => {
      authUnsubscribe();
      unsubRequests();
      unsubFriends();
    };
  }, []);

  const sendRequest = async (toId: string) => {
    if (!auth.currentUser) return;
    const fromId = auth.currentUser.uid;
    
    // Check if request already exists
    const q = query(
      collection(db, 'friend_requests'),
      where('fromId', '==', fromId),
      where('toId', '==', toId)
    );
    const existing = await getDocs(q);
    if (!existing.empty) return;

    try {
      await addDoc(collection(db, 'friend_requests'), {
        fromId,
        toId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'friend_requests');
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      const requestDoc = doc(db, 'friend_requests', requestId);
      const snap = await getDocs(query(collection(db, 'friend_requests'), where('__name__', '==', requestId)));
      if (snap.empty) return;
      
      const data = snap.docs[0].data() as FriendRequest;
      
      // Update request status
      await updateDoc(requestDoc, { status: 'accepted' });

      // Create friendship
      await addDoc(collection(db, 'friendships'), {
        users: [data.fromId, data.toId],
        createdAt: serverTimestamp()
      });

      // Notify the person who sent the request
      await addDoc(collection(db, `users/${data.fromId}/notifications`), {
        title: 'Connection Established',
        message: 'A new neural link has been synchronized with another node.',
        type: 'social',
        link: `/profile/${data.toId}`,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'friend_requests');
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    
    try {
      const q = query(
        collection(db, 'friendships'),
        where('users', 'array-contains', userId)
      );
      const snap = await getDocs(q);
      const friendship = snap.docs.find(d => (d.data() as Friendship).users.includes(friendId));
      
      if (friendship) {
        await deleteDoc(doc(db, 'friendships', friendship.id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'friendships');
    }
  };

  return { requests, friends, loading, sendRequest, acceptRequest, removeFriend };
}

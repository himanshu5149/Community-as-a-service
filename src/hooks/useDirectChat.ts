import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, onSnapshot, query, orderBy, limit, addDoc, 
  serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, 
  startAfter, getDocs, QueryDocumentSnapshot, setDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Message } from './useChat';

export function useDirectChat(convId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

  const PAGE_SIZE = 50;

  useEffect(() => {
    // Reset pagination states on conversation change
    setHasMore(true);
    lastDocRef.current = null;
    setMessages([]);
    setLoading(true);

    if (!convId) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    const startListener = (uid: string) => {
      const path = `conversations/${convId}/messages`;
      
      const q = query(
        collection(db, path),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: 'sent'
        })).reverse() as Message[];
        
        setMessages(prev => {
          const existingIds = new Set(data.map(m => m.id));
          const oldestIncomingTime = data.length > 0 && data[0].createdAt 
            ? data[0].createdAt.toMillis() 
            : Infinity;
            
          const historical = prev.filter(m => 
            !existingIds.has(m.id) && 
            m.status !== 'pending' && 
            m.createdAt && m.createdAt.toMillis() < oldestIncomingTime
          );

          const optimistic = prev.filter(m => m.status === 'pending' && !existingIds.has(m.id));
          return [...historical, ...data, ...optimistic];
        });
        
        if (lastDocRef.current === null && snapshot.docs.length > 0) {
          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        }
        
        setLoading(false);
      }, (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, path);
      });
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        startListener(user.uid);
      } else {
        setMessages([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, [convId]);

  const sendMessage = async (text: string, type: Message['type'] = 'text', fileUrl?: string) => {
    if (!auth.currentUser || (!text && !fileUrl)) return;

    const path = `conversations/${convId}/messages`;

    // Pre-generate the Firestore doc reference to get its ID immediately for optimistic rendering
    const docRef = doc(collection(db, path));
    const msgId = docRef.id;

    const newMessage: Message = {
      id: msgId,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Anonymous',
      userAvatar: auth.currentUser.photoURL || '',
      text,
      type,
      fileUrl: fileUrl || '',
      createdAt: Timestamp.now(),
      reactions: {},
      isEdited: false,
      status: 'pending'
    };

    setMessages(prev => [...prev, newMessage]);
    
    try {
      const { id: _id, status: _status, ...dataToUpload } = newMessage;
      
      await setDoc(docRef, {
        ...dataToUpload,
        createdAt: serverTimestamp()
      });
      
      // Update conversation metadata
      await updateDoc(doc(db, 'conversations', convId), {
        lastMessage: text || '[Attachment]',
        lastMessageAt: serverTimestamp(),
        lastSenderId: auth.currentUser.uid,
        [`lastRead.${auth.currentUser.uid}`]: serverTimestamp()
      });
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'error' } : m));
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!auth.currentUser) return;
    const path = `conversations/${convId}/messages/${messageId}`;
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const userId = auth.currentUser.uid;
    const reactions = { ...(message.reactions || {}) };
    const userIds = [...(reactions[emoji] || [])];

    if (userIds.includes(userId)) {
      reactions[emoji] = userIds.filter(id => id !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...userIds, userId];
    }

    try {
      await updateDoc(doc(db, path), { reactions });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!auth.currentUser) return;

    // For local/temporary optimistic messages, just filter them from local state
    if (messageId.startsWith('temp-')) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      return;
    }

    const path = `conversations/${convId}/messages/${messageId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const loadMore = useCallback(async () => {
    if (!lastDocRef.current || !hasMore || !convId) return;

    const path = `conversations/${convId}/messages`;

    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      startAfter(lastDocRef.current),
      limit(PAGE_SIZE)
    );

    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const olderMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: 'sent'
      })).reverse() as Message[];

      setMessages(prev => [...olderMessages, ...prev]);
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
    } catch (err) {
      console.error('Error loading more messages:', err);
    }
  }, [convId, hasMore]);

  return { messages, loading, sendMessage, reactToMessage, deleteMessage, loadMore, hasMore };
}

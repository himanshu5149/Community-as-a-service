import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, onSnapshot, query, orderBy, limit, addDoc, 
  serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, 
  startAfter, getDocs, QueryDocumentSnapshot, where 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'ai';
  fileUrl?: string;
  createdAt: Timestamp;
  isAI?: boolean;
  reactions?: Record<string, string[]>; // emoji: [userIds]
  replyTo?: {
    messageId: string;
    userName: string;
    text: string;
  };
  isEdited?: boolean;
  isPinned?: boolean;
  status?: 'pending' | 'sent' | 'error';
}

export function useChat(groupId: string, channelId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

  const PAGE_SIZE = 50;

  // Real-time listener for NEW messages
  useEffect(() => {
    if (!groupId || !auth.currentUser) {
      setLoading(false);
      return;
    }

    const path = channelId 
      ? `groups/${groupId}/channels/${channelId}/messages` 
      : `groups/${groupId}/messages`;
    
    // Listen for recent messages
    const q = query(
      collection(db, path),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: 'sent'
      })).reverse() as Message[];
      
      setMessages(prev => {
        const existingIds = new Set(data.map(m => m.id));
        
        // Find messages older than the current batch to preserve history
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
      
      if (lastDocRef.current === null) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }
      
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
  }, [groupId, channelId, auth.currentUser]);

  const loadMore = useCallback(async () => {
    if (!lastDocRef.current || !hasMore || !groupId) return;

    const path = channelId 
      ? `groups/${groupId}/channels/${channelId}/messages` 
      : `groups/${groupId}/messages`;

    const q = query(
      collection(db, path),
      where('groupId', '==', groupId),
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
  }, [groupId, channelId, hasMore]);

  const sendMessage = async (
    text: string, 
    type: Message['type'] = 'text', 
    fileUrl?: string, 
    isAI: boolean = false,
    options?: { 
      aiName?: string; 
      aiAvatar?: string;
      replyTo?: Message['replyTo'];
    }
  ) => {
    if (!auth.currentUser || (!text && !fileUrl)) return;

    const tempId = `temp-${Date.now()}`;
    const path = channelId 
      ? `groups/${groupId}/channels/${channelId}/messages` 
      : `groups/${groupId}/messages`;

    const newMessage: Message = {
      id: tempId,
      userId: isAI ? 'system_ai' : auth.currentUser.uid,
      userName: isAI ? (options?.aiName || 'Mainframe') : (auth.currentUser.displayName || 'Anonymous'),
      userAvatar: isAI ? (options?.aiAvatar || '') : (auth.currentUser.photoURL || ''),
      text,
      type,
      fileUrl: fileUrl || '',
      createdAt: Timestamp.now(),
      isAI,
      reactions: {},
      replyTo: options?.replyTo || null,
      isEdited: false,
      isPinned: false,
      status: 'pending'
    };

    // Optimistic Update
    setMessages(prev => [...prev, newMessage]);
    setIsSending(true);
      
    try {
      const { id: _id, status: _status, ...dataToUpload } = newMessage;
      await addDoc(collection(db, path), {
        ...dataToUpload,
        groupId, // Scoping field for rules
        createdAt: serverTimestamp()
      });
    } catch (err) {
      // Rollback or show error on the message
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsSending(false);
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!auth.currentUser || !groupId) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const userId = auth.currentUser.uid;
    const reactions = { ...(message.reactions || {}) };
    const userIds = [...(reactions[emoji] || [])];

    if (userIds.includes(userId)) {
      reactions[emoji] = userIds.filter(id => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      reactions[emoji] = [...userIds, userId];
    }

    const path = channelId 
      ? `groups/${groupId}/channels/${channelId}/messages/${messageId}` 
      : `groups/${groupId}/messages/${messageId}`;
      
    try {
      await updateDoc(doc(db, path), {
        reactions
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!groupId) return;
    const path = channelId 
      ? `groups/${groupId}/channels/${channelId}/messages/${messageId}` 
      : `groups/${groupId}/messages/${messageId}`;
      
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const editMessage = async (messageId: string, newText: string) => {
    if (!groupId || !newText.trim()) return;
    const path = channelId 
      ? `groups/${groupId}/channels/${channelId}/messages/${messageId}` 
      : `groups/${groupId}/messages/${messageId}`;
    try {
      await updateDoc(doc(db, path), {
        text: newText,
        isEdited: true,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const togglePinMessage = async (messageId: string, isPinned: boolean) => {
    if (!groupId) return;
    const path = channelId 
      ? `groups/${groupId}/channels/${channelId}/messages/${messageId}` 
      : `groups/${groupId}/messages/${messageId}`;
    try {
      await updateDoc(doc(db, path), {
        isPinned
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  return { 
    messages, 
    loading, 
    isSending, 
    error, 
    sendMessage, 
    reactToMessage, 
    deleteMessage, 
    editMessage, 
    togglePinMessage,
    loadMore,
    hasMore
  };
}

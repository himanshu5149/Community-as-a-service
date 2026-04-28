import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
}

export function useChat(groupId: string, channelId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId || !auth.currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Support both legacy and new path for transition if needed, but the prompt says 
    // "Every group must have multiple channels". We'll assume the new path.
    const path = channelId 
      ? `groups/${groupId}/channels/${channelId}/messages` 
      : `groups/${groupId}/messages`; // Default to general if no channelId provided? No, let's force channelId for real-time channels.
    
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(data);
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

    setIsSending(true);
    const path = channelId 
      ? `groups/${groupId}/channels/${channelId}/messages` 
      : `groups/${groupId}/messages`;
      
    try {
      await addDoc(collection(db, path), {
        userId: isAI ? 'system_ai' : auth.currentUser.uid,
        userName: isAI ? (options?.aiName || 'Mainframe') : (auth.currentUser.displayName || 'Anonymous'),
        userAvatar: isAI ? (options?.aiAvatar || '') : (auth.currentUser.photoURL || ''),
        text,
        type,
        fileUrl: fileUrl || '',
        createdAt: serverTimestamp(),
        isAI,
        reactions: {},
        replyTo: options?.replyTo || null,
        isEdited: false,
        isPinned: false
      });
    } catch (err) {
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

  return { messages, loading, isSending, error, sendMessage, reactToMessage, deleteMessage, editMessage, togglePinMessage };
}

import { useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useModeration } from './useModeration';
import { Message } from './useChat';

export function useAiModerator(groupId: string, channelId?: string) {
  const { moderateMessage } = useModeration();
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!groupId) return;

    const path = channelId 
      ? `groups/${groupId}/channels/${channelId}/messages` 
      : `groups/${groupId}/messages`;

    // Listen for recent unmoderated messages
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const unmoderatedMessages = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Message))
        .filter(m => !m.moderationStatus && !m.isAI && !processedRef.current.has(m.id));

      for (const msg of unmoderatedMessages) {
        processedRef.current.add(msg.id);
        
        // Skip empty messages
        if (!msg.text) continue;

        console.log(`[Aegis] Moderating message: ${msg.id}`);
        
        try {
          const result = await moderateMessage(msg.text);
          
          const docRef = doc(db, path, msg.id);
          await updateDoc(docRef, {
            moderationStatus: result.isSafe ? 'safe' : 'flagged',
            moderationReason: result.reason,
            moderationType: result.violationType,
            moderationConfidence: result.confidence
          });

          if (!result.isSafe) {
            console.warn(`[Aegis] Flagged message ${msg.id}: ${result.reason}`);
          }
        } catch (err) {
          console.error(`[Aegis] Error moderating message ${msg.id}:`, err);
          // If we fail here, it's likely a permission error or AI failure
          // We don't want to crash the whole hook, so we just log it
          try {
            handleFirestoreError(err, OperationType.UPDATE, `${path}/${msg.id}`);
          } catch (e) {
            // Silently fail after logging JSON
          }
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [groupId, channelId]);

  return {};
}

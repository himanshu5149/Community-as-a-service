import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from '../lib/firebase';

export function useTyping(channelId: string, userId: string | undefined, userName: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!channelId) return;

    const typingRef = ref(rtdb, `typing/${channelId}`);
    
    // Listen for typing users
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setTypingUsers([]);
        return;
      }
      
      const now = Date.now();
      const users = Object.entries(data)
        .filter(([id, val]: [string, any]) => {
          // Only show users who typed in the last 3 seconds
          return id !== userId && (now - val.timestamp) < 3000;
        })
        .map(([_, val]: [string, any]) => val.userName);
      
      setTypingUsers(users);
    });

    return () => unsubscribe();
  }, [channelId, userId]);

  const setTyping = (isTyping: boolean) => {
    if (!channelId || !userId || !userName) return;
    
    const userTypingRef = ref(rtdb, `typing/${channelId}/${userId}`);
    if (isTyping) {
      set(userTypingRef, {
        userName,
        timestamp: Date.now() // RTDB client time for quick filtering, or serverTimestamp but local is easier for < 3s filter
      });
      // Clear after disconnect
      onDisconnect(userTypingRef).remove();
    } else {
      set(userTypingRef, null);
    }
  };

  return { typingUsers, setTyping };
}

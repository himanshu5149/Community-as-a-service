import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb, auth } from '../lib/firebase';

export type UserStatus = 'online' | 'away' | 'offline';

export function usePresence(userId: string | undefined) {
  const [statuses, setStatuses] = useState<Record<string, UserStatus>>({});

  useEffect(() => {
    if (!userId) return;

    // Set user's own status to online
    const userStatusRef = ref(rtdb, `status/${userId}`);
    
    set(userStatusRef, 'online');
    onDisconnect(userStatusRef).set('offline');

    // Handle background/foreground if needed, but for now simple online/offline
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        set(userStatusRef, 'online');
      } else {
        set(userStatusRef, 'away');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      set(userStatusRef, 'offline');
    };
  }, [userId]);

  useEffect(() => {
    const allStatusesRef = ref(rtdb, 'status');
    const unsubscribe = onSnapshotStatus(allStatusesRef);
    return () => unsubscribe();
  }, []);

  function onSnapshotStatus(allStatusesRef: any) {
    return onValue(allStatusesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStatuses(data);
      }
    });
  }

  return statuses;
}

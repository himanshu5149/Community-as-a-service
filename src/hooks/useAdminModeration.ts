import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  collectionGroup
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Report } from './useModeration';

export interface FlaggedMessage {
  id: string;
  groupId: string;
  channelId?: string;
  userId: string;
  userName: string;
  text: string;
  moderationStatus: 'flagged' | 'safe' | 'pending';
  moderationReason?: string;
  createdAt: any;
}

export function useAdminModeration(isAdmin: boolean) {
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let unsubReports = () => {};
    let unsubMessages = () => {};

    const startListeners = () => {
      // 1. Fetch all reports
      const reportsQuery = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      );

      unsubReports = onSnapshot(reportsQuery, (snapshot) => {
        setAllReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Report[]);
      }, (err) => {
        if (err.code !== 'permission-denied') {
          handleFirestoreError(err, OperationType.LIST, 'reports');
        }
      });

      // 2. Fetch all flagged messages across all groups/channels
      // Note: This requires a collection group index for 'messages'
      try {
        const messagesQuery = query(
          collectionGroup(db, 'messages'),
          where('moderationStatus', '==', 'flagged'),
          orderBy('createdAt', 'desc')
        );

        unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
          setFlaggedMessages(snapshot.docs.map(d => {
            // Document reference for messages is usually groups/{groupId}/channels/{channelId}/messages/{messageId}
            // or groups/{groupId}/messages/{messageId}
            const pathSegments = d.ref.path.split('/');
            const groupId = pathSegments[1];
            const channelId = pathSegments.length > 4 ? pathSegments[3] : undefined;
            
            return { 
              id: d.id, 
              groupId,
              channelId,
              ...d.data() 
            } as FlaggedMessage;
          }));
          setLoading(false);
        }, (err) => {
          console.warn("Flagged messages fetch failed (likely missing index):", err);
          setLoading(false);
        });
      } catch (e) {
        console.error("Collection group query failed:", e);
        setLoading(false);
      }
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user && isAdmin) {
        startListeners();
      } else {
        setAllReports([]);
        setFlaggedMessages([]);
        setLoading(false);
        unsubReports();
        unsubMessages();
      }
    });

    return () => {
      authUnsubscribe();
      unsubReports();
      unsubMessages();
    };
  }, [isAdmin]);

  const resolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    await updateDoc(doc(db, 'reports', reportId), { status });
  };

  const updateMessageStatus = async (msg: FlaggedMessage, status: 'safe' | 'deleted') => {
    const path = msg.channelId 
      ? `groups/${msg.groupId}/channels/${msg.channelId}/messages/${msg.id}`
      : `groups/${msg.groupId}/messages/${msg.id}`;
    
    if (status === 'deleted') {
      await deleteDoc(doc(db, path));
    } else {
      await updateDoc(doc(db, path), { moderationStatus: 'safe' });
    }
  };

  const banUser = async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), { role: 'banned' });
  };

  return { allReports, flaggedMessages, loading, resolveReport, updateMessageStatus, banUser };
}

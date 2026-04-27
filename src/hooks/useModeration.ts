import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'message' | 'member' | 'group';
  targetId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: any;
}

export function useModeration() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Only fetch for admins (this check should be in security rules too)
    const q = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Report[]);
      setLoading(false);
    }, (err) => {
      console.error("Moderation fetch failed:", err);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth.currentUser]);

  const submitReport = async (report: Omit<Report, 'id' | 'reporterId' | 'status' | 'createdAt'>) => {
    if (!auth.currentUser) return;
    
    await addDoc(collection(db, 'reports'), {
      ...report,
      reporterId: auth.currentUser.uid,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  };

  const updateReportStatus = async (reportId: string, status: Report['status']) => {
    await updateDoc(doc(db, 'reports', reportId), { status });
  };

  return { reports, loading, submitReport, updateReportStatus };
}

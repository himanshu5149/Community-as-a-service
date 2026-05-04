import { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, serverTimestamp, updateDoc, doc, orderBy, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'message' | 'member' | 'group';
  targetId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: any;
}

// ─── In-Memory Cache (saves credits, zero packages needed) ────────────────
const moderationCache = new Map<string, { result: any; time: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Known bad words for instant local blocking (no API call needed) ──────
const BAD_WORDS = ['spam', 'scam', 'hate', 'kill', 'abuse']; // add more as needed

export function useModeration() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const startListener = (uid: string) => {
      const q = query(
        collection(db, 'reports'),
        where('reporterId', '==', uid),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Report[]);
        setLoading(false);
      }, (err) => {
        if (err.code !== 'permission-denied') {
          handleFirestoreError(err, OperationType.LIST, 'reports');
        }
        setLoading(false);
      });
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        startListener(user.uid);
      } else {
        setReports([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, []);

  const submitReport = async (report: Omit<Report, 'id' | 'reporterId' | 'status' | 'createdAt'>) => {
    if (!auth.currentUser) return;
    
    try {
      await addDoc(collection(db, 'reports'), {
        ...report,
        reporterId: auth.currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reports');
    }
  };

  const updateReportStatus = async (reportId: string, status: Report['status']) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const moderateMessage = async (text: string) => {
    const trimmed = text.trim();

    // ── Rule 1: Skip very short messages (hi, ok, thanks, emojis) ──────────
    // Short messages are almost never toxic — no need to call Gemini at all
    if (trimmed.length < 15) {
      return { isSafe: true, reason: '', riskLevel: 'none', violationType: null, confidence: 1 };
    }

    // ── Rule 2: Instant local check for known bad words ────────────────────
    const lower = trimmed.toLowerCase();
    const foundBadWord = BAD_WORDS.find(w => lower.includes(w));
    if (foundBadWord) {
      return { isSafe: false, reason: 'Message contains restricted content.', riskLevel: 'high', violationType: 'Toxic Content', confidence: 1 };
    }

    // ── Rule 3: Check in-memory cache ──────────────────────────────────────
    const cached = moderationCache.get(trimmed);
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
      console.log('✅ Moderation cache hit — Gemini credit saved!');
      return cached.result;
    }

    try {
      // Use AbortController for timeout — prevents hanging requests
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/ai/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      // If API not available (404 on Vercel) — fail open silently
      if (!response.ok) {
        console.warn(`Moderation API returned ${response.status} — skipping moderation`);
        return { isSafe: true, reason: '', riskLevel: 'none', flaggedContent: null, confidence: 0 };
      }

      const result = await response.json();
      const finalResult = {
        isSafe: result.isSafe ?? true,
        reason: result.reason || '',
        riskLevel: result.riskLevel || 'none',
        flaggedContent: result.flaggedContent || null,
        confidence: 0.9
      };

      moderationCache.set(trimmed, { result: finalResult, time: Date.now() });
      return finalResult;
    } catch (error: any) {
      // AbortError = timeout, TypeError = network down — both safe to ignore
      if (error.name !== 'AbortError') {
        console.warn('Moderation unavailable — allowing message:', error.message);
      }
      return { isSafe: true, reason: '', riskLevel: 'none', flaggedContent: null, confidence: 0 };
    }
  };

  return { reports, loading, submitReport, updateReportStatus, moderateMessage };
}

import { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, serverTimestamp, updateDoc, doc, orderBy, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { ai } from '../lib/gemini';
import { Type } from "@google/genai";

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
        handleFirestoreError(err, OperationType.LIST, 'reports');
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
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Analyze the following message for community policy violations (harassment, hate speech, explicit content, spam, or high-risk behavior). 
        Message: "${trimmed}"
        
        Return a JSON object with:
        - isSafe: boolean
        - reason: string (brief explanation if not safe, otherwise empty)
        - riskLevel: "none" | "low" | "medium" | "high"
        - violationType: string | null`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSafe: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
              riskLevel: { type: Type.STRING },
              violationType: { type: Type.STRING, nullable: true }
            },
            required: ["isSafe", "reason", "riskLevel"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      const finalResult = {
        isSafe: result.isSafe ?? true,
        reason: result.reason || "",
        riskLevel: result.riskLevel || "none",
        violationType: result.violationType || null,
        confidence: 0.9
      };

      // Save to cache so same message never calls Gemini again
      moderationCache.set(trimmed, { result: finalResult, time: Date.now() });

      return finalResult;
    } catch (error) {
      console.error("AI Moderation Error:", error);
      return { isSafe: true, reason: "", riskLevel: "none", violationType: null, confidence: 0 };
    }
  };

  return { reports, loading, submitReport, updateReportStatus, moderateMessage };
}

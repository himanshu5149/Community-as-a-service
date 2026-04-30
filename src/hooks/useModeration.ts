import { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, serverTimestamp, updateDoc, doc, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
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
        console.error("Moderation fetch failed:", err);
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

  const moderateMessage = async (text: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `You are Aegis, a high-fidelity community moderation AI. Analyze the message below for violations of community safety protocols.
        
        Protocols:
        - Harassment/Bullying
        - Hate Speech
        - Explicit/Graphic Content
        - High-Risk Behavior (self-harm, threats)
        - Extreme Toxic Speech
        - Spam/Phishing
        
        Message: "${text}"
        
        Return a JSON object with:
        - isSafe: boolean
        - violationType: string | null (one of the protocols above or null)
        - confidence: number (0.0 to 1.0)
        - reason: string (1-sentence professional explanation of why it was flagged)
        - riskLevel: "none" | "low" | "medium" | "high"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSafe: { type: Type.BOOLEAN },
              violationType: { type: Type.STRING, nullable: true },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              riskLevel: { type: Type.STRING }
            },
            required: ["isSafe", "violationType", "confidence", "reason", "riskLevel"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return {
        isSafe: result.isSafe ?? true,
        violationType: result.violationType || null,
        confidence: result.confidence || 0,
        reason: result.reason || "",
        riskLevel: result.riskLevel || "none"
      };
    } catch (error) {
      console.error("AI Moderation Error:", error);
      return { isSafe: true, violationType: null, confidence: 0, reason: "", riskLevel: "none" };
    }
  };

  return { reports, loading, submitReport, updateReportStatus, moderateMessage };
}

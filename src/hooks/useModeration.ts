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
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'reports'),
      where('reporterId', '==', auth.currentUser.uid),
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

  const moderateMessage = async (text: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following message for community policy violations (harassment, hate speech, explicit content, spam, or high-risk behavior). 
        Message: "${text}"
        
        Return a JSON object with:
        - isSafe: boolean
        - reason: string (brief explanation if not safe, otherwise empty)
        - riskLevel: "none" | "low" | "medium" | "high"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSafe: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
              riskLevel: { type: Type.STRING }
            },
            required: ["isSafe", "reason", "riskLevel"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return {
        isSafe: result.isSafe ?? true,
        reason: result.reason || "",
        riskLevel: result.riskLevel || "none"
      };
    } catch (error) {
      console.error("AI Moderation Error:", error);
      // Fallback to safe if AI fails to avoid blocking user unfairly, 
      // or implement basic regex as fallback
      return { isSafe: true, reason: "", riskLevel: "none" };
    }
  };

  return { reports, loading, submitReport, updateReportStatus, moderateMessage };
}

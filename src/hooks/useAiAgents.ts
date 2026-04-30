import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  increment,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface AiAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  systemInstruction?: string;
  avatarUrl?: string;
  accentColor?: string;
  personality: string;
  expertise: string[];
  groupId: string;
  isCrossGroup: boolean;
  model: string;
  totalResponses: number;
}

export function useAiAgents(groupId?: string) {
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const startListener = () => {
      const q = groupId 
        ? query(collection(db, 'ai_agents'), where('groupId', 'in', [groupId, 'global']))
        : query(collection(db, 'ai_agents'), where('isCrossGroup', '==', true));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const agentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AiAgent[];
        setAgents(agentsData);
        setLoading(false);
      }, (error) => {
        if (error.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'ai_agents');
        }
        setLoading(false);
      });
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        startListener();
      } else {
        setAgents([]);
        setLoading(false);
        unsubscribe();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, [groupId]);

  const recordInteraction = async (agentId: string, userId: string, prompt: string, response: string, tokens: number) => {
    try {
      // 1. Log interaction
      await addDoc(collection(db, 'ai_interactions'), {
        agentId,
        userId,
        prompt,
        response,
        tokensUsed: tokens,
        createdAt: serverTimestamp()
      });

      // 2. Update agent stats
      await updateDoc(doc(db, 'ai_agents', agentId), {
        totalResponses: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'ai_interactions');
    }
  };

  const createAiAgent = async (agentData: Omit<AiAgent, 'id' | 'totalResponses'>) => {
    try {
      const docRef = await addDoc(collection(db, 'ai_agents'), {
        ...agentData,
        totalResponses: 0,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ai_agents');
    }
  };

  const deleteAiAgent = async (agentId: string) => {
    try {
      await deleteDoc(doc(db, 'ai_agents', agentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `ai_agents/${agentId}`);
    }
  };

  return { agents, loading, recordInteraction, createAiAgent, deleteAiAgent };
}

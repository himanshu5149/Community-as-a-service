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
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface AiAgent {
  id: string;
  name: string;
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
    const q = groupId 
      ? query(collection(db, 'ai_agents'), where('groupId', '==', groupId))
      : query(collection(db, 'ai_agents'), where('isCrossGroup', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AiAgent[];
      setAgents(agentsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'ai_agents');
      setLoading(false);
    });

    return () => unsubscribe();
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

  return { agents, loading, recordInteraction };
}

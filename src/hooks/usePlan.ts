import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

export type PlanId = 'free' | 'starter' | 'professional' | 'enterprise';

interface PlanState {
  plan: PlanId;
  planStatus: 'active' | 'inactive' | 'cancelled' | null;
  planActivatedAt: number | null;
  planEndsAt: string | null;
  subscriptionId: string | null;
  isActive: boolean;
  isPro: boolean;
  isStarter: boolean;
  loading: boolean;
}

const DEFAULT_STATE: PlanState = {
  plan: 'free',
  planStatus: null,
  planActivatedAt: null,
  planEndsAt: null,
  subscriptionId: null,
  isActive: false,
  isPro: false,
  isStarter: false,
  loading: true,
};

export function usePlan(): PlanState {
  const [state, setState] = useState<PlanState>(DEFAULT_STATE);

  useEffect(() => {
    // Correctly listen to auth state changes
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setState({ ...DEFAULT_STATE, loading: false });
        return;
      }

      // Listen to the user's profile doc in real time
      const profileUnsubscribe = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          if (!snap.exists()) {
            setState({ ...DEFAULT_STATE, loading: false });
            return;
          }

          const data = snap.data();
          const plan = (data?.plan || 'free') as PlanId;
          const planStatus = data?.planStatus || null;
          const isActive = planStatus === 'active';

          setState({
            plan,
            planStatus,
            planActivatedAt: data?.planActivatedAt || null,
            planEndsAt: data?.planEndsAt || null,
            subscriptionId: data?.subscriptionId || null,
            isActive,
            isPro: isActive && (plan === 'professional' || plan === 'enterprise'),
            isStarter: isActive && (plan === 'starter' || plan === 'professional' || plan === 'enterprise'),
            loading: false,
          });
        },
        (err) => {
          console.error('Plan fetch error:', err);
          setState((prev) => ({ ...prev, loading: false }));
        }
      );

      return () => profileUnsubscribe();
    });

    return () => authUnsubscribe();
  }, []);

  return state;
}

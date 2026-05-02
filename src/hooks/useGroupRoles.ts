import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export type UserRole = 'admin' | 'moderator' | 'member';

export interface GroupMember {
  userId: string;
  userName: string;
  role: UserRole;
  joinedAt: any;
  email?: string; // Adding optional email field
}

export function useGroupRoles(groupId: string) {
  const [member, setMember] = useState<GroupMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    let unsubscribeMember: (() => void) | null = null;

    const startListener = (uid: string) => {
      const path = `groups/${groupId}/members/${uid}`;
      unsubscribeMember = onSnapshot(doc(db, path), (snapshot) => {
        setMember(snapshot.exists() ? snapshot.data() as GroupMember : null);
        setLoading(false);
      }, (err) => {
        setLoading(false);
        if (err.code !== 'permission-denied') {
          try { handleFirestoreError(err, OperationType.GET, path); } catch (e: any) { setError(e); }
        }
      });
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        startListener(user.uid);
      } else {
        setMember(null);
        setLoading(false);
        if (unsubscribeMember) unsubscribeMember();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMember) unsubscribeMember();
    };
  }, [groupId]);

  const joinGroup = async (userName: string) => {
    if (!auth.currentUser || !groupId) return;
    const path = `groups/${groupId}/members/${auth.currentUser.uid}`;
    
    try {
      const { collection, getCountFromServer } = await import('firebase/firestore');
      const membersRef = collection(db, `groups/${groupId}/members`);
      const snapshot = await getCountFromServer(membersRef);
      const isFirstMember = snapshot.data().count === 0;

      await setDoc(doc(db, path), {
        userId: auth.currentUser.uid,
        userName,
        groupId,
        role: isFirstMember ? 'admin' : 'member',
        joinedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateRole = async (targetUserId: string, newRole: UserRole) => {
    if (!auth.currentUser || !groupId) return;
    
    // Safety check: local permission enforcement
    if (member?.role !== 'admin' && member?.role !== 'moderator') {
      throw new Error("Unauthorized: Only admins and moderators can change roles.");
    }

    const path = `groups/${groupId}/members/${targetUserId}`;
    try {
      await setDoc(doc(db, path), { role: newRole }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  return { 
    member, 
    loading, 
    error, 
    joinGroup, 
    updateRole,
    isAdmin: member?.role === 'admin',
    isModerator: member?.role === 'admin' || member?.role === 'moderator',
    isMember: !!member,
    permissions: {
      canDeleteMessage: member?.role === 'admin' || member?.role === 'moderator',
      canEditGroup: member?.role === 'admin',
      canCreateChannel: member?.role === 'admin',
      canManageMembers: member?.role === 'admin' || member?.role === 'moderator',
      canUseAI: !!member // Everyone who joined can use AI
    }
  };
}

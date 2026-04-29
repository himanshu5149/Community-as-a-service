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
}

export function useGroupRoles(groupId: string) {
  const [member, setMember] = useState<GroupMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) return;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setMember(null);
        setLoading(false);
        return;
      }

      const path = `groups/${groupId}/members/${user.uid}`;
      const unsubscribeMember = onSnapshot(doc(db, path), (snapshot) => {
        if (snapshot.exists()) {
          setMember(snapshot.data() as GroupMember);
        } else {
          setMember(null);
        }
        setLoading(false);
      }, (err) => {
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.GET, path);
        } catch (e: any) {
          setError(e);
        }
      });

      return () => unsubscribeMember();
    });

    return () => unsubscribeAuth();
  }, [groupId]);

  const joinGroup = async (userName: string) => {
    if (!auth.currentUser || !groupId) return;
    const path = `groups/${groupId}/members/${auth.currentUser.uid}`;
    
    // Check if any members exist
    const isFirstMember = !member && !loading; // This is a rough check, rules might be better
    
    try {
      await setDoc(doc(db, path), {
        userId: auth.currentUser.uid,
        groupId,
        userName,
        role: isFirstMember ? 'admin' : 'member',
        joinedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateRole = async (targetUserId: string, newRole: UserRole) => {
    if (!auth.currentUser || !groupId) return;
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
    isMember: !!member
  };
}

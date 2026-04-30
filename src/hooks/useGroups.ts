import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, setDoc, deleteDoc, where, limit, arrayUnion, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface Group {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  icon: string;
  memberCount: number;
  category: string;
  slug: string;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribeAll = () => {};
    let unsubscribeJoined = () => {};

    const startListeners = (userId: string) => {
      // 1. Fetch All Public Groups
      const allPath = 'groups';
      const allQ = query(
        collection(db, allPath),
        orderBy('name', 'asc'),
        limit(20)
      );
      
      unsubscribeAll = onSnapshot(allQ, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Group[];
        setGroups(data);
      });

      // 2. Fetch Joined Groups (based on membership)
      // Since Firestore rules/structure, we query the groups where the user is a member
      // Or we can query the groups collection using the groups array in the user doc
      // For real-time, fetching based on the user's groups array is easier if synchronized
      const userRef = doc(db, 'users', userId);
      unsubscribeJoined = onSnapshot(userRef, async (userSnap) => {
        if (userSnap.exists()) {
          const userGroupIds = userSnap.data().groups || [];
          if (userGroupIds.length > 0) {
            // Fetch the group docs for these IDs
            // Note: query where 'id' in array is limited to 10. 
            // For now, we'll fetch them individually or use a simple query if limited.
            const joinedQ = query(
              collection(db, 'groups'),
              where('__name__', 'in', userGroupIds.slice(0, 10))
            );
            onSnapshot(joinedQ, (snap) => {
              const joinedData = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Group[];
              setJoinedGroups(joinedData);
              setLoading(false);
            });
          } else {
            setJoinedGroups([]);
            setLoading(false);
          }
        }
      });
    };

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        startListeners(user.uid);
      } else {
        setGroups([]);
        setJoinedGroups([]);
        setLoading(false);
        unsubscribeAll();
        unsubscribeJoined();
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribeAll();
      unsubscribeJoined();
    };
  }, []);

  const createGroup = async (name: string, description: string, category: string = 'General') => {
    if (!auth.currentUser) return;
    const path = 'groups';
    try {
      const groupData = {
        name,
        description,
        category,
        accentColor: '#3B82F6',
        icon: 'LayoutGrid',
        memberCount: 1,
        slug: name.toLowerCase().replace(/ /g, '-'),
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      };
      
      const docRef = await addDoc(collection(db, path), groupData);
      
      // 1. Add the user as admin member
      await setDoc(doc(db, `groups/${docRef.id}/members/${auth.currentUser.uid}`), {
        userId: auth.currentUser.uid,
        groupId: docRef.id,
        userName: auth.currentUser.displayName || 'Anonymous Agent',
        role: 'admin',
        joinedAt: serverTimestamp()
      });

      // 2. Update user's joined groups list
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        groups: arrayUnion(docRef.id)
      }, { merge: true });

      // 3. Create default general channel
      await addDoc(collection(db, `groups/${docRef.id}/channels`), {
        name: 'general',
        description: 'Command and control frequency for this node.',
        type: 'general',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });

      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!auth.currentUser) return;
    try {
      // Add to group members
      await setDoc(doc(db, `groups/${groupId}/members/${auth.currentUser.uid}`), {
        userId: auth.currentUser.uid,
        groupId: groupId,
        userName: auth.currentUser.displayName || 'Anonymous Agent',
        role: 'member',
        joinedAt: serverTimestamp()
      });

      // Add to user groups array
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        groups: arrayUnion(groupId)
      }, { merge: true });

      // Increment member count
      const groupSnap = await getDoc(doc(db, 'groups', groupId));
      if (groupSnap.exists()) {
        await setDoc(doc(db, 'groups', groupId), {
          memberCount: (groupSnap.data().memberCount || 0) + 1
        }, { merge: true });
      }

      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${groupId}/members`);
    }
  };

  return { groups, joinedGroups, loading, error, createGroup, deleteGroup, joinGroup };
}

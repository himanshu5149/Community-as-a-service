import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin';
  onboardingCompleted?: boolean;
  plan?: 'free' | 'pro' | 'elite' | 'founder';
  subscriptionId?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const isSuperAdmin = user.email === 'royalisdevil@gmail.com';
        
        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Operator',
            photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
            role: isSuperAdmin ? 'admin' : 'user',
            onboardingCompleted: false,
            plan: 'free'
          };
          await setDoc(userDocRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            points: 0,
            level: 1,
            groups: []
          });
          setProfile(newProfile);
        } else {
          const profileData = userDoc.data() as UserProfile;
          setProfile(profileData);
          await setDoc(userDocRef, { 
            lastLogin: serverTimestamp(),
            ...(isSuperAdmin ? { role: 'admin' } : {})
          }, { merge: true });
        }

        setIsAdmin(isSuperAdmin);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

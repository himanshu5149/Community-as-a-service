import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('Access keys do not match.');
    
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Explicitly create user profile to avoid race condition with useAuth hook
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${userCredential.user.uid}`,
        role: userCredential.user.email === 'royalisdevil@gmail.com' ? 'admin' : 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        points: 0,
        level: 1,
        groups: []
      });

      navigate('/onboarding');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Registration is currently disabled. Please enable the Email/Password provider in your Firebase Console.');
      } else {
        setError(err.message || 'Node registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6 text-white pt-32">
      <div className="max-w-md w-full">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-12"
        >
          <h1 className="text-5xl font-black tracking-tighter italic mb-4">Register <span className="text-primary not-italic">Shard.</span></h1>
          <p className="text-gray-500 font-medium tracking-tight">Create your unique identity within the community OS.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card-gloss p-10 border-white/5"
        >
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Operator Alias</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Major Tom"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-primary transition-all font-bold placeholder:text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Signal ID</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tom@nexus.com"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-primary transition-all font-bold placeholder:text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-primary transition-all font-bold placeholder:text-gray-800"
                />
              </div>
            </div>

             <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Verify Key</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input 
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-primary transition-all font-bold placeholder:text-gray-800"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-white text-bg-dark py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Initialize Shard</>}
            </button>
          </form>

          <div className="mt-10 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                Already registered? <Link to="/login" className="text-primary hover:underline ml-1">Establish Link</Link>
              </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

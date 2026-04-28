import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/groups';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is disabled. Please enable it in the Firebase Console (Build > Authentication > Sign-in method).');
      } else {
        setError(err.message || 'Authentication failed. Check your signals.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google authentication is disabled. Please enable it in the Firebase Console (Build > Authentication > Sign-in method).');
      } else {
        setError(err.message || 'Authentication failed.');
      }
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
          <h1 className="text-5xl font-black tracking-tighter italic mb-4">Initialize <span className="text-primary not-italic">Session.</span></h1>
          <p className="text-gray-500 font-medium tracking-tight">Access the community intelligence mainframe.</p>
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

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Signal ID (Email)</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexus.com"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-primary transition-all font-bold placeholder:text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Access Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-primary transition-all font-bold placeholder:text-gray-800"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-primary text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5" /> Establish Link</>}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
             <button 
                onClick={handleGoogleLogin}
                className="w-full bg-white/5 border border-white/5 py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 hover:bg-white/10 transition-all uppercase tracking-widest"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
                Auth via Google Node
              </button>

              <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-600">
                New to the nexus? <Link to="/signup" className="text-primary hover:underline ml-1">Create Shard</Link>
              </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

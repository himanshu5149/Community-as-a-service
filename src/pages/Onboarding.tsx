import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Rocket, Users, Shield, ArrowRight, CheckCircle2, Layout, Globe, Lock, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../hooks/useAuth';

const steps = [
  { id: 'identity', title: 'Community Identity', icon: <Layout className="w-6 h-6" /> },
  { id: 'gateway', title: 'Gateway Settings', icon: <Shield className="w-6 h-6" /> },
  { id: 'launch', title: 'Launch', icon: <Rocket className="w-6 h-6" /> }
];

export default function Onboarding() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Tech',
    type: 'open',
    description: ''
  });
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Create the Group
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: formData.name,
        category: formData.category,
        type: formData.type,
        description: formData.description,
        ownerId: user.uid,
        memberCount: 1,
        createdAt: serverTimestamp(),
        isPublic: formData.type === 'open'
      });

      // 2. Add as Admin Member
      await setDoc(doc(db, `groups/${groupRef.id}/members`, user.uid), {
        uid: user.uid,
        displayName: user.displayName || 'Founder',
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        role: 'admin',
        joinedAt: serverTimestamp()
      });

      // 3. Create Default #general Channel
      const channelRef = await addDoc(collection(db, `groups/${groupRef.id}/channels`), {
        name: 'general',
        description: 'Default entry point for communication.',
        type: 'text',
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });

      // 4. Mark Onboarding as Completed
      await updateDoc(doc(db, 'users', user.uid), {
        onboardingCompleted: true
      });

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#534AB7', '#ffffff']
      });

      setTimeout(() => navigate('/groups'), 2000);
    } catch (error: any) {
      console.error("Onboarding failed:", error);
      setError(error.message || "Protocol initialization failed. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-transparent text-white font-sans">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 z-0" />
          {steps.map((step, idx) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                idx <= currentStep ? 'bg-primary shadow-[0_0_20px_var(--color-primary)] scale-110' : 'bg-[#1a1a1a] border border-white/5'
              }`}>
                {idx < currentStep ? <CheckCircle2 className="w-6 h-6" /> : step.icon}
              </div>
              <span className={`mt-3 text-[10px] font-black uppercase tracking-widest ${idx <= currentStep ? 'text-primary' : 'text-gray-600'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 shadow-2xl min-h-[400px] flex flex-col">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-4xl font-bold tracking-tighter mb-2 italic underline decoration-primary decoration-4 underline-offset-8">Establish Identity.</h2>
                  <p className="text-gray-400 font-medium">Naming your node is the first step in the chain.</p>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Community Name"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 outline-none focus:ring-2 ring-primary/50 transition-all font-bold text-xl"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                  <select
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 outline-none focus:ring-2 ring-primary/50 transition-all font-bold"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {['Tech', 'Fitness', 'Arts', 'Education', 'Business'].map(cat => (
                      <option key={cat} value={cat} className="bg-[#0a0a0a]">{cat}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-4xl font-bold tracking-tighter mb-2 italic">Define Gateways.</h2>
                  <p className="text-gray-400 font-medium">Who gets permission to enter your domain?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button 
                     onClick={() => setFormData({...formData, type: 'open'})}
                     className={`p-8 rounded-3xl border transition-all text-left group ${formData.type === 'open' ? 'bg-primary/20 border-primary shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                   >
                     <Globe className={`w-8 h-8 mb-4 ${formData.type === 'open' ? 'text-primary' : 'text-gray-500'}`} />
                     <div className="font-bold text-xl mb-1">Open Node</div>
                     <p className="text-xs text-gray-400 font-medium">Anyone can discover and join instantly.</p>
                   </button>
                   <button 
                     onClick={() => setFormData({...formData, type: 'invite'})}
                     className={`p-8 rounded-3xl border transition-all text-left group ${formData.type === 'invite' ? 'bg-primary/20 border-primary shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                   >
                     <Lock className={`w-8 h-8 mb-4 ${formData.type === 'invite' ? 'text-primary' : 'text-gray-500'}`} />
                     <div className="font-bold text-xl mb-1">Invite Sealed</div>
                     <p className="text-xs text-gray-400 font-medium">Restricted access protocol. Highly secure.</p>
                   </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-8"
              >
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-primary/10 animate-pulse">
                  <Rocket className="w-12 h-12 text-primary" />
                </div>
                <div>
                  <h2 className="text-5xl font-black tracking-tighter mb-4 italic uppercase">Protocols Ready.</h2>
                  <p className="text-gray-400 font-medium max-w-sm mx-auto">
                    Your infrastructure for <span className="text-white font-bold">{formData.name}</span> is prepared. Click below to launch your community into the nexus.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-auto pt-10 flex justify-between items-center">
             <button 
               onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
               className={`text-gray-500 font-bold hover:text-white transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
             >
                Back
             </button>
             <button
               onClick={handleNext}
               disabled={loading || (currentStep === 0 && !formData.name)}
               className="px-10 py-5 bg-primary rounded-2xl font-bold flex items-center gap-3 shadow-[0_15px_30px_rgba(83,74,183,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
             >
               {loading ? 'Initializing...' : (currentStep === 2 ? 'Launch' : 'Continue')}
               {!loading && <ArrowRight className="w-5 h-5" />}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

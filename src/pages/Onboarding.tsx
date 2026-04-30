import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Camera, 
  Target, 
  Zap, 
  ArrowRight, 
  ArrowLeft, 
  Globe, 
  MessageSquare, 
  Sparkles,
  Search,
  Code,
  Gamepad2,
  Book,
  Rocket
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { cn } from '../lib/utils';

const FOCUS_OPTIONS = [
  { id: 'tech', label: 'Tech & Dev', icon: Code, color: 'text-blue-500' },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, color: 'text-purple-500' },
  { id: 'education', label: 'Learning', icon: Book, color: 'text-green-500' },
  { id: 'social', label: 'Hangout', icon: Globe, color: 'text-orange-500' },
  { id: 'business', label: 'Startup', icon: Rocket, color: 'text-primary' },
  { id: 'other', label: 'Other', icon: Sparkles, color: 'text-gray-400' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Identity
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [avatar, setAvatar] = useState(`https://api.dicebear.com/7.x/bottts/svg?seed=${auth.currentUser?.uid}`);

  // Step 2: Focus
  const [focus, setFocus] = useState('');

  // Step 3: Community Creation
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const completeOnboarding = async () => {
    if (!groupName) return;
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Unauthorized");

      // 1. Update user profile
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        photoURL: avatar,
        onboardingCompleted: true
      });

      // 2. Create first group
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: groupName,
        description: groupDescription,
        category: focus,
        ownerId: user.uid,
        membersCount: 1,
        visibility: 'public',
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
      });

      // 3. Add user to group
      await updateDoc(doc(db, 'users', user.uid), {
        groups: arrayUnion(groupRef.id)
      });

      // 4. Create default channel
      await addDoc(collection(db, `groups/${groupRef.id}/channels`), {
        name: 'general',
        type: 'text',
        description: 'Global signal distribution channel.',
        createdAt: serverTimestamp(),
        groupId: groupRef.id
      });

      navigate('/');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'onboarding');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col p-6 items-center justify-center pt-24 overflow-hidden">
      {/* Progress Path */}
      <div className="fixed top-24 left-0 w-full px-10 flex gap-2 h-1 z-50">
        {[1, 2, 3].map(i => (
          <div 
            key={i} 
            className={cn(
              "flex-grow rounded-full transition-all duration-700",
              i <= step ? "bg-primary shadow-[0_0_10px_rgba(83,74,183,1)]" : "bg-white/5"
            )}
          />
        ))}
      </div>

      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">Initialization Layer 01</span>
                <h1 className="text-6xl font-black tracking-tighter italic">Identity <span className="text-primary not-italic">Sync.</span></h1>
                <p className="text-gray-500 font-medium mt-4">Calibrate your operator profile for the network.</p>
              </div>

              <div className="flex flex-col items-center gap-10">
                <div className="relative group">
                   <div className="w-40 h-40 rounded-[2.5rem] bg-white/5 border border-white/5 p-2 overflow-hidden backdrop-blur-xl group-hover:border-primary transition-all duration-500">
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-[2rem]" />
                   </div>
                   <button 
                    onClick={() => setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}`)}
                    className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                   >
                     <Zap className="w-5 h-5 text-white" />
                   </button>
                </div>

                <div className="w-full space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-4">Access Label</label>
                   <input 
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Operator Alias"
                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-6 text-xl font-bold italic outline-none focus:border-primary transition-all placeholder:text-gray-800"
                   />
                </div>

                <button 
                  onClick={handleNext}
                  disabled={!displayName}
                  className="w-full bg-white text-bg-dark py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50"
                >
                  Continue to Sector Selection <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">Initialization Layer 02</span>
                <h1 className="text-6xl font-black tracking-tighter italic">Define <span className="text-primary not-italic">Focus.</span></h1>
                <p className="text-gray-500 font-medium mt-4">Select the primary vector for your first community cluster.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {FOCUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFocus(opt.id)}
                    className={cn(
                      "card-gloss p-8 flex flex-col items-center text-center gap-6 transition-all group",
                      focus === opt.id ? "border-primary bg-primary/10" : "grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                    )}
                  >
                    <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center transition-all group-hover:scale-110", opt.color)}>
                      <opt.icon className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-6">
                <button 
                  onClick={handleBack}
                  className="w-24 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!focus}
                  className="flex-grow bg-white text-bg-dark py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50"
                >
                  Initialize Registry <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">Initialization Layer 03</span>
                <h1 className="text-6xl font-black tracking-tighter italic">Shard <span className="text-primary not-italic">Deployment.</span></h1>
                <p className="text-gray-500 font-medium mt-4">Commit your first community cluster to the global network.</p>
              </div>

              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-4">Cluster Designation</label>
                    <input 
                      type="text"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      placeholder="e.g. Neo-Tokyo Nexus"
                      className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-6 text-xl font-bold italic outline-none focus:border-primary transition-all"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-4">Operational Directive</label>
                    <textarea 
                      value={groupDescription}
                      onChange={e => setGroupDescription(e.target.value)}
                      rows={4}
                      placeholder="What is the purpose of this shard?"
                      className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-6 text-sm font-medium italic outline-none focus:border-primary transition-all no-scrollbar"
                    />
                 </div>

                 <div className="p-8 bg-primary/5 border border-primary/20 rounded-[2.5rem] flex items-start gap-6">
                    <Target className="w-8 h-8 text-primary flex-shrink-0 animate-pulse" />
                    <p className="text-xs text-primary/80 font-medium leading-relaxed italic">
                      "Deploying this cluster will establish you as the primary architect. You will have full administrative control over all internal signal protocols."
                    </p>
                 </div>

                 <div className="flex gap-6">
                    <button 
                      onClick={handleBack}
                      className="w-24 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft className="w-6 h-6 text-gray-400" />
                    </button>
                    <button 
                      onClick={completeOnboarding}
                      disabled={loading || !groupName}
                      className="flex-grow bg-primary text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(83,74,183,0.3)] disabled:opacity-50"
                    >
                      {loading ? 'Deploying Shard...' : 'Commit to Network'} <Rocket className="w-5 h-5" />
                    </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative Elements */}
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
    </div>
  );
}

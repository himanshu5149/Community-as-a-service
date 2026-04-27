import React, { useEffect, useState } from 'react';
import { useGroups, Group } from '../hooks/useGroups';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { db, auth, signInWithGoogle } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { Users, Loader2, ArrowRight, Lock, LogIn, Plus, X, LayoutGrid, Type, AlignLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Groups() {
  const { groups, loading, createGroup } = useGroups();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupCat, setNewGroupCat] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName || !newGroupDesc) return;
    setIsSubmitting(true);
    try {
      const id = await createGroup(newGroupName, newGroupDesc, newGroupCat);
      if (id) {
        setShowCreateModal(false);
        navigate(`/groups/${id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const seedGroups = async () => {
    if (!user) return;
    const sampleGroups = [
      { name: 'FitCollective', description: 'Elite fitness infrastructure for local chapters.', accentColor: '#EF4444', category: 'Fitness', memberCount: 1240, icon: 'Activity', createdAt: serverTimestamp(), createdBy: user.uid },
      { name: 'TechNexus', description: 'Real-time dev environments for community building.', accentColor: '#3B82F6', category: 'Tech', memberCount: 850, icon: 'Cpu', createdAt: serverTimestamp(), createdBy: user.uid },
      { name: 'ArtVibe', description: 'Canvas and studio sharing management.', accentColor: '#F59E0B', category: 'Arts', memberCount: 420, icon: 'Palette', createdAt: serverTimestamp(), createdBy: user.uid },
      { name: 'EduPulse', description: 'LMS and networking for education groups.', accentColor: '#10B981', category: 'Education', memberCount: 670, icon: 'GraduationCap', createdAt: serverTimestamp(), createdBy: user.uid },
    ];

    for (const group of sampleGroups) {
      try {
        const docRef = await addDoc(collection(db, 'groups'), group);
        // Auto-join as admin for seeded groups
        await setDoc(doc(db, `groups/${docRef.id}/members/${user.uid}`), {
          userId: user.uid,
          userName: user.displayName || 'Seed Agent',
          role: 'admin',
          joinedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error seeding group:", err);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="pt-24 min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-bg-dark text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 md:gap-12 mb-16 md:mb-24">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-[88px] font-bold tracking-tighter mb-8 md:mb-10 leading-[0.9]">
              Vertical <br/><span className="text-gradient italic">Networks.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-medium leading-relaxed max-w-xl">
              Browse our ecosystem of high-fidelity communities. Each node is powered by enterprise community architecture.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => user ? setShowCreateModal(true) : signInWithGoogle()}
              className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-3xl font-bold hover:bg-white/10 transition-all flex items-center gap-3 backdrop-blur-xl shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{user ? "Initialize New Node" : "Sign in to Create"}</span>
              <span className="sm:hidden">{user ? "New Node" : "Sign In"}</span>
            </button>
            {user && groups.length === 0 && !loading && (
              <button 
                onClick={seedGroups}
                className="px-8 py-5 bg-primary text-white rounded-3xl font-bold hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 shrink-0"
              >
                Sync Defaults
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Syncing with Mainframe...</p>
          </div>
        ) : (
          <>
            {groups.length === 0 ? (
              <div className="py-40 text-center flex flex-col items-center gap-8">
                 <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                   <Users className="w-10 h-10 text-gray-500" />
                 </div>
                 <h2 className="text-4xl font-bold tracking-tight text-gray-500">No active nodes found in this sector.</h2>
                 {!user && (
                    <button 
                      onClick={signInWithGoogle}
                      className="px-10 py-4 bg-primary text-white rounded-2xl font-bold transition-all"
                    >
                      Authenticate to Initialize
                    </button>
                 )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {groups.map((group, i) => (
                  <GroupCard key={group.id} group={group} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-dark/95 backdrop-blur-3xl px-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-xl w-full bg-[#121212] border border-white/10 p-10 md:p-14 rounded-[3.5rem] shadow-full"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-4xl font-bold tracking-tighter mb-4">New <span className="text-primary italic">Node.</span></h3>
                  <p className="text-gray-500 font-medium tracking-tight">Configure the parameters for your community cluster.</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-600 hover:text-white p-2">
                  <X className="w-8 h-8" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Node Alias</label>
                  <div className="relative">
                    <Type className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                    <input 
                      required
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g. Neural Startups"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-lg font-bold focus:border-primary outline-none transition-all placeholder:text-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Core Directive</label>
                  <div className="relative">
                    <AlignLeft className="absolute left-6 top-6 w-5 h-5 text-primary/40" />
                    <textarea 
                      required
                      rows={3}
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="Define the purpose of this shard..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-lg font-medium focus:border-primary outline-none transition-all placeholder:text-gray-800 resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Sector</label>
                    <select 
                      value={newGroupCat}
                      onChange={(e) => setNewGroupCat(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg font-bold focus:border-primary outline-none transition-all appearance-none text-gray-400"
                    >
                      <option>General</option>
                      <option>Tech</option>
                      <option>Fitness</option>
                      <option>Arts</option>
                      <option>Education</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                    >
                      {isSubmitting ? "Syncing..." : "Transmit"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GroupCardProps {
  group: Group;
  index: number;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, index }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, ease: "easeOut" }}
      onClick={() => navigate(`/groups/${group.id}`)}
      className="group bg-white/5 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer flex flex-col h-full backdrop-blur-sm"
    >
      <div 
        className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-8 md:mb-10 text-white shadow-2xl shadow-current/20"
        style={{ backgroundColor: group.accentColor || '#3B82F6' }}
      >
        <div className="text-2xl md:text-3xl font-bold italic">
          {group.name[0]}
        </div>
      </div>
      
      <div className="flex-grow">
        <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 block">
          {group.category}
        </span>
        <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-5 tracking-tighter group-hover:text-primary transition-colors">
          {group.name}
        </h3>
        <p className="text-gray-400 leading-relaxed mb-8 md:mb-10 text-base md:text-lg font-medium line-clamp-3">
          {group.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-8 md:pt-10 border-t border-white/5">
        <div className="flex items-center gap-3 text-white font-bold">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-black tracking-widest">{(group.memberCount || 0).toLocaleString()}</span>
        </div>
        <div className="text-primary font-black flex items-center gap-2 group-hover:gap-4 transition-all uppercase text-[10px] tracking-[0.3em]">
          Protocol <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

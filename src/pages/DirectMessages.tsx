import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useConversations } from '../hooks/useConversations';
import { auth, signInWithGoogle } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { MessageSquare, Search, ArrowRight, Lock, LogIn, Loader2, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DirectMessages() {
  const navigate = useNavigate();
  const { conversations, loading } = useConversations();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  if (!user) {
    return (
      <div className="pt-24 min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center px-10 relative">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
         <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/10 shadow-2xl backdrop-blur-xl">
              <Lock className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-none italic">Secure <br/><span className="text-primary not-italic">Channels.</span></h2>
            <p className="text-xl md:text-2xl text-gray-400 mb-14 max-w-md font-medium leading-relaxed">
              Authentication required to access private transmission frequencies.
            </p>
            <button 
              onClick={signInWithGoogle}
              className="px-12 py-6 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.3em] text-sm flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              <LogIn className="w-5 h-5" />
              Identify Signature
            </button>
          </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-32 min-h-screen bg-bg-dark text-white px-6 md:px-10 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12 md:mb-20">
          <div>
            <div className="mb-4 md:mb-6 inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Encrypted Mesh
            </div>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-[0.85] md:leading-none italic">Direct <br/><span className="text-primary not-italic">Signals.</span></h1>
          </div>
          
          <div className="relative group max-w-md w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search frequencies..."
              className="w-full bg-white/5 border border-white/5 rounded-3xl py-6 pl-16 pr-8 outline-none focus:border-primary/50 transition-all font-medium text-lg backdrop-blur-xl placeholder:text-gray-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400">Syncing Private Hub...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {conversations.length === 0 ? (
               <div className="col-span-full py-40 bg-white/5 border border-dashed border-white/10 rounded-[4rem] flex flex-col items-center justify-center text-center px-10">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/5">
                    <MessageSquare className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight text-white">No Active Signals</h3>
                  <p className="text-gray-500 font-medium max-w-xs leading-relaxed">Initialize a connection from any member profile to start a direct transmission.</p>
               </div>
            ) : (
              conversations.map((conv, i) => {
                const otherId = conv.participants.find(p => p !== user.uid);
                const otherData = conv.participantData?.[otherId || ''];
                
                return (
                  <motion.div 
                    key={conv.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    className="group card-gloss p-6 md:p-10 cursor-pointer hover:bg-white/10 transition-all border-b-4 border-b-transparent hover:border-b-primary relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-8 md:mb-10">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] border-2 border-white/10 p-1 bg-white/5 shadow-2xl relative">
                        {otherData?.avatar ? (
                          <img src={otherData.avatar} className="w-full h-full object-cover rounded-xl md:rounded-[1.8rem] opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary font-bold italic text-2xl md:text-3xl">
                             {otherData?.name?.[0] || '?'}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500 border-2 md:border-4 border-bg-dark"></div>
                      </div>
                      <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-600 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                    </div>
 
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-white group-hover:text-primary transition-colors">{otherData?.name || 'Protocol Node'}</h3>
                      <p className="text-gray-500 text-xs md:text-sm font-medium uppercase tracking-widest truncate">
                        {conv.lastMessage || 'Signal Established'}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                      <span>Live Session</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                      <span>{conv.lastMessageAt?.toDate?.().toLocaleDateString() || 'Today'}</span>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

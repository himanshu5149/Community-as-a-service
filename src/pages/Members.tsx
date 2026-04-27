import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useMembers, Member } from '../hooks/useMembers';
import { useConversations } from '../hooks/useConversations';
import { Search, Filter, MessageSquare, UserPlus, Trophy, Zap, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Members() {
  const navigate = useNavigate();
  const { members, loading } = useMembers();
  const { startConversation } = useConversations();
  const [searchTerm, setSearchTerm] = useState('');

  const handleStartDM = async (member: Member) => {
    const convId = await startConversation(member.id, member.displayName, member.photoURL);
    if (convId) {
      navigate(`/messages/${convId}`);
    }
  };

  const filteredMembers = members.filter(m => 
    m.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-24 md:pt-32 min-h-screen bg-bg-dark text-white px-6 md:px-10 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12 md:mb-20">
          <div>
            <div className="mb-4 md:mb-6 inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Human Capital Registry
            </div>
            <h1 className="text-5xl md:text-9xl font-bold tracking-tighter leading-[0.85] md:leading-[0.8] italic text-white">Cluster <br/><span className="text-primary not-italic">Directory.</span></h1>
          </div>
          
          <div className="relative group max-w-md w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search operators..."
              className="w-full bg-white/5 border border-white/5 rounded-3xl py-6 pl-16 pr-8 outline-none focus:border-primary/50 transition-all font-medium text-lg backdrop-blur-xl placeholder:text-gray-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400">Retrieving Personas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMembers.map((member, i) => (
              <motion.div 
                key={member.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="card-gloss p-8 group hover:bg-white/10 transition-all border-b-2 border-transparent hover:border-primary relative overflow-hidden"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                     <div className="w-24 h-24 rounded-[2.5rem] border-2 border-white/10 p-1 bg-white/5 relative z-10">
                        <img 
                          src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} 
                          className="w-full h-full object-cover rounded-[2.2rem]" 
                          referrerPolicy="no-referrer"
                        />
                     </div>
                     <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-[#121212] z-20"></div>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight mb-2 text-white group-hover:text-primary transition-colors">{member.displayName}</h3>
                  <div className="flex items-center gap-4 mb-6">
                     <div className="flex items-center gap-1.5">
                        <Trophy className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">LVL {member.level || 1}</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{member.points || 0} XP</span>
                     </div>
                  </div>

                  <div className="w-full flex gap-3 pt-6 border-t border-white/5">
                     <button 
                       onClick={() => handleStartDM(member)}
                       className="flex-grow bg-white/5 hover:bg-primary hover:text-white text-gray-400 p-4 rounded-2xl transition-all flex items-center justify-center gap-2 group/btn"
                     >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Signal</span>
                     </button>
                     <button className="bg-white/5 hover:bg-white/10 text-gray-400 p-4 rounded-2xl transition-all">
                        <UserPlus className="w-4 h-4" />
                     </button>
                  </div>
                </div>

                {/* Subtle Hover Decoration */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Smart Matching Section */}
        <section className="mt-24 md:mt-40">
           <div className="flex items-center gap-4 mb-10 md:mb-14">
              <div className="h-px flex-grow bg-white/5"></div>
              <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-gray-500">Smart Match Intelligence</h2>
              <div className="h-px flex-grow bg-white/5"></div>
           </div>
 
           <div className="bg-[#121212] border border-white/5 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 lg:p-20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent -skew-x-12 translate-x-20"></div>
              
              <div className="relative z-10 max-w-2xl">
                 <h3 className="text-4xl md:text-7xl font-bold tracking-tighter mb-6 md:mb-8 italic">Node <span className="text-primary not-italic">Synergy.</span></h3>
                 <p className="text-lg md:text-xl text-gray-400 font-medium mb-10 md:mb-12 leading-relaxed">Our neural matching algorithm has identified 3 operators with compatible protocol signatures in the <span className="text-white">Design & Ethics</span> cluster.</p>
                 <button className="px-8 md:px-10 py-5 md:py-6 bg-primary text-white rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.3em] text-xs md:text-sm flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-primary/20">
                    Sync Matches <ArrowRight className="w-5 h-5" />
                 </button>
              </div>

              {/* Decorative Floating Avatars */}
              <div className="absolute right-20 top-1/2 -translate-y-1/2 hidden lg:flex gap-6 items-center">
                 {[1, 2, 3].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ y: [0, -20, 0] }}
                      transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                      className="w-32 h-32 rounded-[3.5rem] border-4 border-primary/20 p-2 bg-bg-dark shadow-full"
                    >
                       <img src={`https://i.pravatar.cc/200?u=match${i}`} className="w-full h-full object-cover rounded-[3.2rem] grayscale hover:grayscale-0 transition-all cursor-pointer" referrerPolicy="no-referrer" />
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}

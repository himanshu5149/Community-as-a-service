import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpaces, Space } from '../hooks/useSpaces';
import { useGroups } from '../hooks/useGroups';
import { 
  Box, 
  Users, 
  Zap, 
  ArrowRight, 
  Plus, 
  X, 
  Layers, 
  Share2,
  Loader2,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Spaces() {
  const { spaces, loading, createSpace, joinSpace } = useSpaces();
  const { groups } = useGroups();
  const [showCreator, setShowCreator] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🚀',
    connectedGroups: [] as string[]
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSpace(formData);
    setShowCreator(false);
    setFormData({ name: '', description: '', icon: '🚀', connectedGroups: [] });
  };

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-10 pb-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 px-4 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Synergetic Workspace
            </div>
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.8] italic">Collaboration <br/><span className="text-primary not-italic">Spaces.</span></h1>
          </div>
          
          <button 
            onClick={() => setShowCreator(true)}
            className="flex items-center gap-4 bg-primary text-white px-10 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-sm hover:scale-105 transition-all shadow-2xl"
          >
            <Plus className="w-5 h-5" /> Initialize Space
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400">Forming Neural Links...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {spaces.length === 0 ? (
               <div className="col-span-full py-40 bg-white/5 border border-dashed border-white/10 rounded-[4rem] text-center">
                  <Layers className="w-12 h-12 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-2 tracking-tight">No Active Synergies</h3>
                  <p className="text-gray-400 max-w-xs mx-auto">Create a cross-group collaboration space to link separate community clusters.</p>
               </div>
            ) : (
              spaces.map((space, i) => (
                <motion.div 
                  key={space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="card-gloss p-12 group hover:bg-white/10 transition-all border-b-4 border-b-transparent hover:border-b-primary relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-10">
                     <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-4xl border border-white/5 group-hover:rotate-12 transition-transform">
                        {space.icon}
                     </div>
                     <div className="flex -space-x-4">
                        {space.connectedGroups.map(gid => {
                          const g = groups.find(x => x.id === gid);
                          return (
                            <div key={gid} className="w-12 h-12 rounded-xl border-4 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 overflow-hidden" title={g?.name}>
                               {g?.name?.[0] || 'G'}
                            </div>
                          )
                        })}
                     </div>
                  </div>

                  <h3 className="text-4xl font-bold tracking-tighter mb-4 italic">{space.name}</h3>
                  <p className="text-gray-400 font-medium mb-12 leading-relaxed max-w-md">{space.description}</p>
                  
                  <div className="flex items-center justify-between pt-10 border-t border-white/5">
                     <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-gray-400">
                           <Users className="w-4 h-4 text-primary" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{space.members?.length || 0} Operators</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                           <Zap className="w-4 h-4 text-yellow-500" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Active Link</span>
                        </div>
                     </div>
                     <button className="flex items-center gap-3 text-primary font-bold uppercase tracking-widest text-[10px] hover:translate-x-2 transition-transform">
                        Enter Workspace <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Creator Modal */}
        <AnimatePresence>
          {showCreator && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-bg-dark/95 backdrop-blur-xl"
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-[#121212] border border-white/10 p-12 rounded-[4rem] w-full max-w-2xl shadow-full overflow-y-auto max-h-[90vh] no-scrollbar"
               >
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-4xl font-bold tracking-tighter">Space <span className="text-primary italic">Initialization.</span></h3>
                     <button onClick={() => setShowCreator(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                        <X />
                     </button>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-8">
                     <div className="grid grid-cols-4 gap-6">
                        {['🚀', '🛠️', '🎨', '🧪', '📡', '🧠', '🌌', '⚡'].map(emoji => (
                           <button 
                             key={emoji}
                             type="button"
                             onClick={() => setFormData({...formData, icon: emoji})}
                             className={cn(
                               "h-20 bg-white/5 border rounded-3xl flex items-center justify-center text-3xl transition-all",
                               formData.icon === emoji ? "border-primary bg-primary/10" : "border-white/5"
                             )}
                           >
                              {emoji}
                           </button>
                        ))}
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Objective Title</label>
                        <input 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all text-xl font-bold"
                          placeholder="Space name..."
                        />
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Connected Clusters</label>
                        <div className="flex flex-wrap gap-3">
                           {groups.map(g => (
                              <button 
                                key={g.id}
                                type="button"
                                onClick={() => {
                                   const current = formData.connectedGroups;
                                   if (current.includes(g.id)) {
                                      setFormData({...formData, connectedGroups: current.filter(id => id !== g.id)});
                                   } else {
                                      setFormData({...formData, connectedGroups: [...current, g.id]});
                                   }
                                }}
                                className={cn(
                                   "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                                   formData.connectedGroups.includes(g.id) ? "bg-primary border-primary text-white" : "bg-white/5 border-white/5 text-gray-500"
                                )}
                              >
                                 {g.name}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Shared Briefing</label>
                        <textarea 
                           required
                           rows={3}
                           value={formData.description}
                           onChange={(e) => setFormData({...formData, description: e.target.value})}
                           className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-medium"
                           placeholder="Shared objective scope..."
                        />
                     </div>

                     <button 
                        type="submit"
                        className="w-full bg-primary text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/40 mt-6"
                      >
                        Authorize Workspace
                      </button>
                  </form>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

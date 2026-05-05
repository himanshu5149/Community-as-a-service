import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAiAgents } from '../hooks/useAiAgents';
import { useGroups } from '../hooks/useGroups';
import { Bot, Plus, X, Globe, Activity, Loader2, Trash2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { auth } from '../lib/firebase';

export default function AiManagement() {
  const { agents, loading, createAiAgent, deleteAiAgent } = useAiAgents();
  const { groups } = useGroups();
  const { showToast, toast, hideToast } = useToast();
  const [showCreator, setShowCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    personality: '',
    systemInstruction: '',
    expertise: '',
    groupId: '',
    isCrossGroup: false,
    model: 'gemini-1.5-flash',
    avatarUrl: '',
    accentColor: '#534AB7'
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const expertiseArray = formData.expertise.split(',').map(s => s.trim()).filter(Boolean);
    
    try {
      await createAiAgent({
        name: formData.name,
        role: formData.role || 'Assistant',
        description: formData.description,
        personality: formData.personality,
        systemInstruction: formData.systemInstruction,
        expertise: expertiseArray,
        groupId: formData.groupId || 'global',
        isCrossGroup: formData.isCrossGroup,
        model: formData.model,
        avatarUrl: formData.avatarUrl,
        accentColor: formData.accentColor,
        creatorId: auth.currentUser?.uid || ''
      } as any);
      setShowCreator(false);
      setFormData({
        name: '',
        role: '',
        description: '',
        personality: '',
        systemInstruction: '',
        expertise: '',
        groupId: '',
        isCrossGroup: false,
        model: 'gemini-1.5-flash',
        avatarUrl: '',
        accentColor: '#534AB7'
      });
      showToast("AI Agent deployed to the Nexus.");
    } catch (err) {
      showToast("Deployment failed.", 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Terminate this intelligence? This action is irreversible.")) {
      try {
        await deleteAiAgent(id);
        showToast("Intelligence decommissioned.");
      } catch (err) {
        showToast("Decommissioning failed.", 'error');
      }
    }
  };

  return (
    <div className="pt-32 min-h-screen bg-[#0a0a0a] text-white px-6 md:px-10 pb-20 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 px-4 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              Autonomous Intelligence Layer
            </div>
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.8] italic">AI <br/><span className="text-primary not-italic">Nexus.</span></h1>
          </div>
          
          <button 
            onClick={() => setShowCreator(true)}
            className="flex items-center gap-4 bg-primary text-white px-10 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-sm hover:scale-105 transition-all shadow-2xl shadow-primary/20"
          >
            <Plus className="w-5 h-5" /> Deploy Agent
          </button>
        </div>

        <div className="mb-12">
          <div className="relative group max-w-2xl">
            <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Designation, Role or Expertise Area..."
              className="w-full bg-white/5 border border-white/5 p-8 rounded-[2.5rem] outline-none focus:border-primary/50 transition-all font-bold text-xl placeholder:text-gray-700 relative z-10"
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3 z-20">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Neural Search Active</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Retrieving Neural Networks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents
              .filter(agent => {
                const searchLower = searchQuery.toLowerCase();
                return (
                  agent.name.toLowerCase().includes(searchLower) ||
                  agent.role.toLowerCase().includes(searchLower) ||
                  agent.personality.toLowerCase().includes(searchLower) ||
                  agent.expertise.some(e => e.toLowerCase().includes(searchLower))
                );
              })
              .length === 0 ? (
              <div className="col-span-full py-40 bg-white/5 border border-dashed border-white/10 rounded-[4rem] text-center">
                 <Bot className="w-16 h-16 text-gray-800 mx-auto mb-8" />
                 <h3 className="text-3xl font-bold mb-4 italic">No Matches Found</h3>
                 <p className="text-gray-500 max-w-sm mx-auto text-sm font-medium">Clear search parameters to re-synchronize with the Nexus.</p>
              </div>
            ) : (
              agents
                .filter(agent => {
                  const searchLower = searchQuery.toLowerCase();
                  return (
                    agent.name.toLowerCase().includes(searchLower) ||
                    agent.role.toLowerCase().includes(searchLower) ||
                    agent.personality.toLowerCase().includes(searchLower) ||
                    agent.expertise.some(e => e.toLowerCase().includes(searchLower))
                  );
                })
                .map((agent, i) => (
                <motion.div 
                  key={agent.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-[#121212] border border-white/5 p-8 rounded-[2.5rem] hover:bg-[#1a1a1a] transition-all hover:border-primary/30"
                >
                  <div className="flex justify-between items-start mb-8">
                    {agent.avatarUrl ? (
                      <div 
                        className="w-16 h-16 rounded-2xl bg-cover bg-center border border-white/10" 
                        style={{ backgroundImage: `url(${agent.avatarUrl})`, borderColor: agent.accentColor || '#534AB7' }} 
                      />
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all"
                        style={{ backgroundColor: `${agent.accentColor || '#534AB7'}20`, borderColor: `${agent.accentColor || '#534AB7'}40` }}
                      >
                        <Bot className="w-8 h-8" style={{ color: agent.accentColor || '#534AB7' }} />
                      </div>
                    )}
                    <button 
                      onClick={() => handleDelete(agent.id)}
                      className="p-3 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold tracking-tight mb-2 italic" style={{ color: agent.accentColor }}>{agent.name}</h3>
                    <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed">
                      {agent.personality}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {agent.expertise.slice(0, 3).map(skill => (
                      <span 
                        key={skill} 
                        className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-500 border border-white/5"
                        style={{ borderColor: `${agent.accentColor || '#534AB7'}20` }}
                      >
                        {skill}
                      </span>
                    ))}
                    {agent.expertise.length > 3 && (
                      <span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-500 border border-white/5">
                        +{agent.expertise.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-600">
                    <div className="flex items-center gap-2">
                       <Activity className="w-3 h-3" style={{ color: agent.accentColor }} />
                       {agent.totalResponses || 0} Syncs
                    </div>
                    <div className="flex items-center gap-2">
                       <Globe className="w-3 h-3" style={{ color: agent.accentColor }} />
                       {agent.isCrossGroup ? 'Global' : 'Local'}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        <AnimatePresence>
          {showCreator && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl"
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 40 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-[#121212] border border-white/10 p-12 rounded-[4rem] w-full max-w-2xl shadow-[0_0_100px_rgba(var(--primary-rgb),0.1)] overflow-y-auto max-h-[90vh] no-scrollbar"
               >
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-4xl font-bold tracking-tighter italic">Agent <span className="text-primary not-italic">Genesis.</span></h3>
                     <button onClick={() => setShowCreator(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                        <X />
                     </button>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-8">
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Designation</label>
                           <input 
                             required
                             value={formData.name}
                             onChange={(e) => setFormData({...formData, name: e.target.value})}
                             className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all text-xl font-bold"
                             placeholder="Nexus Sentinel"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Function/Role</label>
                           <input 
                             required
                             value={formData.role}
                             onChange={(e) => setFormData({...formData, role: e.target.value})}
                             className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all text-xl font-bold"
                             placeholder="Moderator"
                           />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Brief Context</label>
                        <input 
                          required
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-bold"
                          placeholder="Short summary of this agent's purpose..."
                        />
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Expertise Vectors (comma separated)</label>
                        <input 
                          required
                          value={formData.expertise}
                          onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-bold"
                          placeholder="Security, Moderation, Intelligence..."
                        />
                     </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Avatar URL</label>
                           <input 
                             value={formData.avatarUrl}
                             onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                             className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-bold"
                             placeholder="https://..."
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Accent Color</label>
                           <div className="flex gap-4 items-center">
                             <input 
                               type="color"
                               value={formData.accentColor}
                               onChange={(e) => setFormData({...formData, accentColor: e.target.value})}
                               className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl cursor-pointer p-1"
                             />
                             <input 
                               type="text"
                               value={formData.accentColor}
                               onChange={(e) => setFormData({...formData, accentColor: e.target.value})}
                               className="flex-1 bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-bold uppercase"
                               placeholder="#534AB7"
                             />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Scope</label>
                           <select 
                              value={formData.isCrossGroup ? 'true' : 'false'}
                              onChange={(e) => setFormData({...formData, isCrossGroup: e.target.value === 'true'})}
                              className="w-full bg-white/5 border border-white/5 px-6 py-5 rounded-2xl outline-none focus:border-primary transition-all font-bold text-white appearance-none"
                           >
                              <option value="false">Local Protocol</option>
                              <option value="true">Global Nexus</option>
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Assignment</label>
                           <select 
                              value={formData.groupId}
                              onChange={(e) => setFormData({...formData, groupId: e.target.value})}
                              className="w-full bg-white/5 border border-white/5 px-6 py-5 rounded-2xl outline-none focus:border-primary transition-all font-bold text-white appearance-none"
                              disabled={formData.isCrossGroup}
                           >
                              <option value="">Select Group...</option>
                              {groups.map(g => (
                                 <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                           </select>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Cognitive Directive / Personality</label>
                        <textarea 
                           required
                           rows={2}
                           value={formData.personality}
                           onChange={(e) => setFormData({...formData, personality: e.target.value})}
                           className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-medium leading-relaxed"
                           placeholder="Define the agent's personality and goals..."
                        />
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">System Protocol (Hidden Instructions)</label>
                        <textarea 
                           rows={4}
                           value={formData.systemInstruction}
                           onChange={(e) => setFormData({...formData, systemInstruction: e.target.value})}
                           className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-medium leading-relaxed font-mono text-xs"
                           placeholder="Hidden operational overrides or deep context..."
                        />
                     </div>

                     <button 
                        type="submit"
                        className="w-full bg-primary text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/40 mt-6"
                      >
                        Authorize Genesis
                      </button>
                  </form>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[200] w-full max-w-md px-6"
          >
            <div className={cn(
              "px-8 py-5 rounded-3xl backdrop-blur-2xl border flex items-center justify-between shadow-2xl",
              toast.type === 'error' ? "bg-red-500/20 border-red-500/30 text-red-100" : "bg-primary/20 border-primary/30 text-primary-100"
            )}>
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
              </div>
              <button onClick={hideToast} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

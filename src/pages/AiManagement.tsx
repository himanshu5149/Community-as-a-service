import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAiAgents, AiAgent } from '../hooks/useAiAgents';
import { useGroups } from '../hooks/useGroups';
import { Bot, Plus, X, Tag, Globe, Activity, Loader2, Trash2, Brain, Sparkles, Shield, Users, Key } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast, Toast } from '../components/Toast';

export default function AiManagement() {
  const { agents, loading, createAiAgent, deleteAiAgent } = useAiAgents();
  const { groups } = useGroups();
  const { showToast, toast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState<'agents' | 'permissions'>('agents');
  const [showCreator, setShowCreator] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    personality: '',
    expertise: '',
    groupId: '',
    isCrossGroup: false,
    model: 'gemini-3-flash-preview',
    accentColor: '#534ab7'
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const expertiseArray = formData.expertise.split(',').map(s => s.trim()).filter(Boolean);
    
    try {
      await createAiAgent({
        name: formData.name,
        role: formData.role || 'Neural Assistant',
        description: formData.description || formData.personality,
        personality: formData.personality,
        expertise: expertiseArray,
        groupId: formData.groupId || 'global',
        isCrossGroup: formData.isCrossGroup,
        model: formData.model,
        accentColor: formData.accentColor
      });
      setShowCreator(false);
      setFormData({
        name: '',
        role: '',
        description: '',
        personality: '',
        expertise: '',
        groupId: '',
        isCrossGroup: false,
        model: 'gemini-3-flash-preview',
        accentColor: '#534ab7'
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

  const roles = [
    { name: 'System Admin', level: 100, color: 'bg-red-500', permissions: ['Full System Access', 'Neural Genesis', 'Cluster Destruction'] },
    { name: 'Neural Moderator', level: 80, color: 'bg-primary', permissions: ['AI Management', 'Content Sanitation', 'Member Suspension'] },
    { name: 'Cluster Lead', level: 60, color: 'bg-blue-500', permissions: ['Space Creation', 'Group Settings', 'Agent Linking'] },
    { name: 'Verified Node', level: 20, color: 'bg-green-500', permissions: ['Message Broadcast', 'Data Transmission', 'Space Entry'] }
  ];

  return (
    <div className="pt-32 min-h-screen bg-[#0a0a0a] text-white px-6 md:px-10 pb-20 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 px-4 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              OS Core Management
            </div>
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.8] italic">System <br/><span className="text-primary not-italic">Terminal.</span></h1>
          </div>
          
          <div className="flex gap-4">
             <button 
               onClick={() => setActiveTab('agents')}
               className={cn(
                 "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                 activeTab === 'agents' ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-white/5 text-gray-500 hover:bg-white/10"
               )}
             >
                Neural Nexus
             </button>
             <button 
               onClick={() => setActiveTab('permissions')}
               className={cn(
                 "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                 activeTab === 'permissions' ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-white/5 text-gray-500 hover:bg-white/10"
               )}
             >
                Permissions Layer
             </button>
          </div>
        </div>

        {activeTab === 'agents' ? (
          <div>
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-2xl font-bold italic uppercase tracking-tighter">Active <span className="text-primary not-italic">Intelligences.</span></h3>
               <button 
                  onClick={() => setShowCreator(true)}
                  className="flex items-center gap-3 bg-white text-bg-dark px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/20"
               >
                  <Plus className="w-4 h-4" /> Initialize Agent
               </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Retrieving Neural Networks...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {agents.length === 0 ? (
                  <div className="col-span-full py-40 bg-white/5 border border-dashed border-white/10 rounded-[4rem] text-center">
                    <Bot className="w-16 h-16 text-gray-800 mx-auto mb-8" />
                    <h3 className="text-3xl font-bold mb-4 italic">Nexus Empty</h3>
                    <p className="text-gray-500 max-w-sm mx-auto text-sm font-medium">No autonomous agents are currently synchronized with the community cluster.</p>
                  </div>
                ) : (
                  agents.map((agent, i) => (
                    <motion.div 
                      key={agent.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative bg-[#121212] border border-white/5 p-10 rounded-[3rem] hover:bg-[#1a1a1a] transition-all hover:border-primary/30"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div 
                          className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-all overflow-hidden"
                          style={{ boxShadow: agent.accentColor ? `0 10px 30px ${agent.accentColor}22` : 'none' }}
                        >
                           {agent.avatarUrl ? (
                              <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                           ) : (
                              <Bot className="w-8 h-8 text-primary" style={{ color: agent.accentColor }} />
                           )}
                        </div>
                        <button 
                          onClick={() => handleDelete(agent.id)}
                          className="p-3 text-gray-700 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mb-8 font-serif">
                        <h3 className="text-2xl font-bold tracking-tight mb-2 italic">{agent.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">{agent.role}</p>
                        <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed">
                          {agent.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-8">
                        {agent.expertise.slice(0, 3).map(skill => (
                          <span key={skill} className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-500 border border-white/5">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-600">
                        <div className="flex items-center gap-2">
                           <Activity className="w-3 h-3 text-primary font-serif" />
                           {agent.totalResponses} Syncs
                        </div>
                        <div className="flex items-center gap-2">
                           <Globe className="w-3 h-3 text-primary" />
                           {agent.isCrossGroup ? 'Global' : 'Local'}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12">
             <div className="flex justify-between items-end mb-10">
                <div>
                   <h3 className="text-2xl font-bold italic uppercase tracking-tighter mb-2">Protocol <span className="text-primary not-italic">Hierarchy.</span></h3>
                   <p className="text-sm text-gray-500 font-medium max-w-lg">Define and visualize the security clearances across your entire OS infrastructure.</p>
                </div>
                <button className="flex items-center gap-3 bg-white text-bg-dark px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all">
                   <Key className="w-4 h-4" /> Define New Role
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {roles.map((role, i) => (
                  <motion.div 
                    key={role.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="card-gloss p-10 border-white/5 relative group overflow-hidden"
                  >
                     <div className={cn("absolute top-0 right-0 p-10 opacity-5 transition-transform group-hover:scale-125 group-hover:opacity-10", role.color)}>
                        <Shield className="w-40 h-40" />
                     </div>
                     <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                           <div className={cn("w-3 h-3 rounded-full animate-pulse", role.color)} />
                           <h4 className="text-2xl font-bold tracking-tight italic">{role.name}</h4>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600">CLEARANCE L-{role.level}</span>
                     </div>
                     <div className="space-y-4 relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Authorized Capabilities:</div>
                        <div className="flex flex-wrap gap-2">
                           {role.permissions.map(p => (
                             <span key={p} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold text-gray-400">
                               {p}
                             </span>
                           ))}
                        </div>
                     </div>
                     <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center relative z-10">
                        <div className="flex -space-x-2">
                           {[1, 2, 3].map(m => (
                             <div key={m} className="w-8 h-8 rounded-full bg-white/5 border border-bg-dark flex items-center justify-center text-[8px] font-bold">👤</div>
                           ))}
                           <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-bg-dark flex items-center justify-center text-[8px] font-bold">+12</div>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">Manage Nodes</button>
                     </div>
                  </motion.div>
                ))}
             </div>

             <div className="p-12 bg-primary/5 border border-primary/10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-10">
                <div>
                   <h4 className="text-3xl font-bold italic tracking-tighter mb-4">Integrity <span className="text-primary not-italic">Report.</span></h4>
                   <p className="text-gray-400 text-sm max-w-md font-medium leading-relaxed italic font-serif">System security analysis suggests 2 accounts should be elevated to Neural Moderator to balance cluster load.</p>
                </div>
                <button className="bg-primary text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">Execute Core Rebalance</button>
             </div>
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
                     <div className="grid grid-cols-2 gap-8 font-serif">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Designation</label>
                           <input 
                             required
                             value={formData.name}
                             onChange={(e) => setFormData({...formData, name: e.target.value})}
                             className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all text-xl font-bold"
                             placeholder="Node name (e.g., Nexus Sentinel)"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Role Title</label>
                           <input 
                             required
                             value={formData.role}
                             onChange={(e) => setFormData({...formData, role: e.target.value})}
                             className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all text-xl font-bold"
                             placeholder="e.g. Moderator"
                           />
                        </div>
                     </div>

                     <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Public Description</label>
                       <input 
                         required
                         value={formData.description}
                         onChange={(e) => setFormData({...formData, description: e.target.value})}
                         className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-bold"
                         placeholder="Briefly describe this agent's purpose to users..."
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
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Accent Color</label>
                        <div className="flex gap-4">
                           {['#534ab7', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'].map(color => (
                              <button 
                                key={color}
                                type="button"
                                onClick={() => setFormData({...formData, accentColor: color})}
                                className={cn(
                                   "w-12 h-12 rounded-xl transition-all border-2",
                                   formData.accentColor === color ? "border-white scale-110" : "border-transparent"
                                )}
                                style={{ backgroundColor: color }}
                              />
                           ))}
                           <input 
                              type="color" 
                              value={formData.accentColor}
                              onChange={(e) => setFormData({...formData, accentColor: e.target.value})}
                              className="w-12 h-12 bg-transparent border-none outline-none cursor-pointer p-0"
                           />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Cognitive Directive</label>
                        <textarea 
                           required
                           rows={4}
                           value={formData.personality}
                           onChange={(e) => setFormData({...formData, personality: e.target.value})}
                           className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-medium leading-relaxed font-serif"
                           placeholder="Define the agent's personality and goals..."
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
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={hideToast} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

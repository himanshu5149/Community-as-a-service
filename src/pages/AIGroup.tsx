import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAiAgents, AiAgent } from '../hooks/useAiAgents';
import { Bot, Sparkles, ArrowRight, Zap, Target, BookOpen, Share2, Plus, X, Command, Palette, Info, Terminal, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast, Toast } from '../components/Toast';

export default function AIGroup() {
  const { agents, loading, createAiAgent } = useAiAgents();
  const { toast, showToast, hideToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    systemInstruction: '',
    avatarUrl: '',
    accentColor: '#3B82F6',
    expertise: '',
  });

  const getAgentIcon = (agent: AiAgent) => {
    if (agent.avatarUrl) {
      return <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover rounded-2xl" />;
    }
    switch (agent.name) {
      case 'Aria': return <Zap className="w-8 h-8 text-yellow-400" />;
      case 'Nova': return <Target className="w-8 h-8 text-blue-400" />;
      case 'Muse': return <Sparkles className="w-8 h-8 text-purple-400" />;
      case 'Sage': return <BookOpen className="w-8 h-8 text-green-400" />;
      case 'Bridge': return <Share2 className="w-8 h-8 text-primary" />;
      default: return <Bot className="w-8 h-8 text-gray-400" />;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) {
      showToast("Identity parameters incomplete", "error");
      return;
    }

    try {
      await createAiAgent({
        name: formData.name,
        role: formData.role,
        description: formData.description,
        systemInstruction: formData.systemInstruction,
        avatarUrl: formData.avatarUrl,
        accentColor: formData.accentColor,
        personality: formData.description, // Map to legacy field
        expertise: formData.expertise.split(',').map(s => s.trim()).filter(Boolean),
        groupId: 'global', // Default to global for Nexus view
        isCrossGroup: true,
        model: 'gemini-2.0-flash',
      });
      showToast(`${formData.name} node initialized`, "success");
      setIsCreating(false);
      setFormData({
        name: '',
        role: '',
        description: '',
        systemInstruction: '',
        avatarUrl: '',
        accentColor: '#3B82F6',
        expertise: '',
      });
    } catch (err) {
      showToast("Neural seeding failed", "error");
    }
  };

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-6 md:px-10 pb-40">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8"
          >
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Central Intelligence Command</span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic mb-8">Neural <span className="text-primary not-italic">Nexus.</span></h1>
          <div className="flex items-center justify-center gap-4 mb-4">
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2"
            >
              <Plus className="w-3 h-3" /> {isCreating ? 'Cancel Creation' : 'Spawn New Node'}
            </button>
            <span className="w-1 h-1 bg-white/10 rounded-full"></span>
            <Link to="/admin" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Admin Panel</Link>
            <span className="w-1 h-1 bg-white/10 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">By Himanshu Sharma</span>
          </div>
          <p className="max-w-2xl mx-auto text-xl text-gray-400 font-medium leading-relaxed">
            Meet the autonomous intelligence nodes powering the CaaS ecosystem. Each agent operates with unique directives to serve their community groups.
          </p>
        </header>

        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-20 overflow-hidden"
            >
              <div className="card-gloss p-12 border-primary/30 max-w-4xl mx-auto relative group">
                <div className="absolute -top-4 -right-4 p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/40 transform rotate-12 group-hover:rotate-0 transition-transform">
                  <Command className="w-6 h-6" />
                </div>
                
                <h2 className="text-4xl font-black tracking-tighter italic mb-10 flex items-center gap-4">
                  Define Agent <span className="text-primary not-italic">Persona.</span>
                </h2>

                <form onSubmit={handleCreate} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <Bot className="w-3 h-3" /> Agent Name
                      </label>
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Atlas"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-primary/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <Target className="w-3 h-3" /> Core Role
                      </label>
                      <input 
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        placeholder="e.g. Systems Architect"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-primary/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Info className="w-3 h-3" /> Short Description
                    </label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="High-level purpose of this intelligence..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 h-24 focus:border-primary/50 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Terminal className="w-3 h-3" /> System Instructions
                    </label>
                    <textarea 
                      value={formData.systemInstruction}
                      onChange={(e) => setFormData({...formData, systemInstruction: e.target.value})}
                      placeholder="Define personality, constraints, and behavior..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 h-40 focus:border-primary/50 focus:outline-none transition-colors resize-none font-mono text-sm shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Avatar URL
                      </label>
                      <input 
                        type="text"
                        value={formData.avatarUrl}
                        onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                        placeholder="https://..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-primary/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <Palette className="w-3 h-3" /> Accent Color
                      </label>
                      <input 
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => setFormData({...formData, accentColor: e.target.value})}
                        className="w-full h-[58px] bg-white/5 border border-white/10 rounded-2xl px-2 py-2 focus:border-primary/50 focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Expertise (comma separated)
                      </label>
                      <input 
                        type="text"
                        value={formData.expertise}
                        onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                        placeholder="Logic, Math, Ethics..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-primary/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end gap-6">
                    <button 
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-10 py-4 bg-white/5 text-gray-400 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                    >
                      Abort
                    </button>
                    <button 
                      type="submit"
                      className="px-12 py-5 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm hover:scale-105 transition-all shadow-2xl shadow-primary/20 flex items-center gap-4"
                    >
                      <Zap className="w-5 h-5" /> Initialize Node
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={`agent-skele-${i}`} className="h-80 bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="py-40 border border-dashed border-white/10 rounded-[4rem] text-center bg-white/5 backdrop-blur-sm max-w-4xl mx-auto">
             <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-primary/20">
                <Bot className="w-12 h-12 text-primary animate-pulse" />
             </div>
             <h3 className="text-4xl font-bold mb-6 tracking-tighter italic">Neural Link <span className="text-primary not-italic">Inactive.</span></h3>
             <p className="text-gray-400 max-w-md mx-auto mb-12 text-lg font-medium leading-relaxed">
               The community intelligence nodes haven't been synchronized with this cluster yet. Administrative authorization required to seed the neural network.
             </p>
             <Link 
               to="/admin" 
               className="px-12 py-6 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.3em] text-sm hover:scale-105 transition-all shadow-2xl shadow-primary/40 inline-flex items-center gap-4"
             >
                <Zap className="w-5 h-5" /> Initialize Neural Seeding
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Link 
                  to={`/ai/${agent.id}`}
                  className="relative block h-full card-gloss p-10 hover:border-primary/50 transition-all overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-10">
                    <div 
                      className="w-16 h-16 rounded-2xl border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden bg-white/5"
                      style={{ boxShadow: agent.accentColor ? `0 0 20px ${agent.accentColor}33` : 'none' }}
                    >
                      {getAgentIcon(agent)}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       {agent.isCrossGroup && (
                         <span className="px-4 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-full">Systems Level</span>
                       )}
                       <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{agent.role || 'Agent'}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-3xl font-black tracking-tighter italic">
                      {agent.name} <span className="text-primary not-italic" style={{ color: agent.accentColor }}>Node.</span>
                    </h3>
                    <p className="text-gray-400 font-medium line-clamp-2 text-sm leading-relaxed">
                      {agent.description || agent.personality}
                    </p>
                  </div>

                  <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between">
                    <div className="flex gap-2">
                      {agent.expertise.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[8px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-1 rounded-md">{tag}</span>
                      ))}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors group-hover:translate-x-2" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
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

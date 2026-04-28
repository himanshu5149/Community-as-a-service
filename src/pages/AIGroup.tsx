import React from 'react';
import { motion } from 'motion/react';
import { useAiAgents } from '../hooks/useAiAgents';
import { Bot, Sparkles, ArrowRight, Zap, Target, BookOpen, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIGroup() {
  const { agents, loading } = useAiAgents();

  const getAgentIcon = (name: string) => {
    switch (name) {
      case 'Aria': return <Zap className="w-8 h-8 text-yellow-400" />;
      case 'Nova': return <Target className="w-8 h-8 text-blue-400" />;
      case 'Muse': return <Sparkles className="w-8 h-8 text-purple-400" />;
      case 'Sage': return <BookOpen className="w-8 h-8 text-green-400" />;
      case 'Bridge': return <Share2 className="w-8 h-8 text-primary" />;
      default: return <Bot className="w-8 h-8 text-gray-400" />;
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
          <p className="max-w-2xl mx-auto text-xl text-gray-400 font-medium leading-relaxed">
            Meet the autonomous intelligence nodes powering the CaaS ecosystem. Each agent operates with unique directives to serve their community groups.
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-80 bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />
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
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {getAgentIcon(agent.name)}
                    </div>
                    {agent.isCrossGroup && (
                      <span className="px-4 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-full">Systems Level</span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-3xl font-black tracking-tighter italic">{agent.name} <span className="text-primary not-italic">Node.</span></h3>
                    <p className="text-gray-400 font-medium line-clamp-2 text-sm leading-relaxed">
                      {agent.personality}
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
    </div>
  );
}

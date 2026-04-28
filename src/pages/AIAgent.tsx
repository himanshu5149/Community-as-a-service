import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAiAgents } from '../hooks/useAiAgents';
import { motion } from 'motion/react';
import { Bot, ArrowLeft, MessageSquare, Tag, Globe, Activity, Loader2 } from 'lucide-react';

export default function AIAgent() {
  const { agentId } = useParams();
  const { agents } = useAiAgents();
  const agent = agents.find(a => a.id === agentId);

  if (!agent) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-10 text-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-6 md:px-10 pb-40">
      <div className="max-w-5xl mx-auto">
        <Link 
          to="/ai" 
          className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-20"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Nexus
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-gloss p-10 sticky top-32"
            >
              <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-8 border border-primary/20">
                <Bot className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center space-y-2 mb-10">
                <h2 className="text-3xl font-black tracking-tighter italic">{agent.name}</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Core Protocol v4.2</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <Activity className="w-4 h-4 text-primary mx-auto mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block">Total Load</span>
                    <span className="text-sm font-bold">{agent.totalResponses}</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <Globe className="w-4 h-4 text-primary mx-auto mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block">Scope</span>
                    <span className="text-[10px] font-bold uppercase">{agent.isCrossGroup ? 'Global' : 'Local'}</span>
                  </div>
                </div>

                <Link 
                  to={agent.groupId === 'global' ? '/groups' : `/groups/${agent.groupId}`}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  Connect to Group
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-8 space-y-16">
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Node Consciousness</h3>
              </div>
              <h1 className="text-5xl font-bold tracking-tighter italic mb-8 leading-[0.9]">Autonomous Intelligence <span className="text-primary not-italic">Directive.</span></h1>
              <p className="text-2xl text-gray-400 font-medium leading-relaxed">
                {agent.personality}
              </p>
            </section>

            <section>
               <div className="flex items-center gap-4 mb-8">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Expertise Vectors</h3>
              </div>
              <div className="flex flex-wrap gap-4">
                {agent.expertise.map(skill => (
                  <div key={skill} className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-colors group">
                    <Tag className="w-4 h-4 text-gray-600 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-bold uppercase tracking-widest">{skill}</span>
                  </div>
                ))}
              </div>
            </section>

             <section>
               <div className="flex items-center gap-4 mb-8">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Node Configuration</h3>
              </div>
              <div className="card-gloss p-8 bg-white/[0.02] border-white/5 font-mono text-xs text-gray-500 space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>IDENTIFIER:</span>
                  <span className="text-primary">{agent.id}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>MODEL_RUNTIME:</span>
                  <span className="text-white">{agent.model}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>PRIORITY_DOMAIN:</span>
                  <span className="text-white uppercase">{agent.groupId}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>LATENCY_CLASS:</span>
                  <span className="text-green-500">ULTRA_LOW</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

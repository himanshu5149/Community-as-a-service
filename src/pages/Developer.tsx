import React from 'react';
import { motion } from 'motion/react';
import { 
  Code2, 
  Terminal, 
  Cpu, 
  Globe, 
  Lock, 
  Webhook, 
  ArrowRight,
  Database,
  Box,
  Key
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function DeveloperHub() {
  const sections = [
    {
      title: 'REST API',
      description: 'Programmatically manage groups, messages, and user states via high-performance endpoints.',
      icon: <Terminal className="w-6 h-6" />,
      color: 'text-primary'
    },
    {
      title: 'Webhooks',
      description: 'Subscribe to real-time events like message creation, member joins, or AI moderation triggers.',
      icon: <Webhook className="w-6 h-6" />,
      color: 'text-blue-400'
    },
    {
      title: 'UI Components',
      description: 'CaaS Design System. Reuse our gloss-cards, neural-buttons, and glass-drawers.',
      icon: <Box className="w-6 h-6" />,
      color: 'text-pink-400'
    },
    {
      title: 'AI SDK',
      description: 'Custom AI agent training. Inject your own LLM logic into community moderation flows.',
      icon: <Cpu className="w-6 h-6" />,
      color: 'text-green-400'
    }
  ];

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-10 pb-40">
      {/* Background Decorative Layer */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 px-4 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              Mainframe System Access
            </div>
            <h1 className="text-6xl md:text-[120px] font-black tracking-tighter leading-[0.8] italic uppercase">Developer <br/><span className="text-white not-italic opacity-10">Uplink.</span></h1>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-right mb-6">
              <div className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">API Status</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-sm font-bold text-green-500 uppercase tracking-widest">Protocol Stable</span>
              </div>
            </div>
            <button className="flex items-center gap-4 bg-primary text-white px-10 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-sm hover:scale-105 transition-all shadow-2xl">
              <Key className="w-5 h-5" />
              Generate API Key
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
           {sections.map((section, i) => (
             <motion.div 
               key={section.title}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="card-gloss p-10 hover:bg-white/10 transition-all group"
             >
               <div className={cn("inline-flex p-4 rounded-2xl bg-white/5 border border-white/5 mb-8 group-hover:scale-110 transition-transform", section.color)}>
                 {section.icon}
               </div>
               <h3 className="text-2xl font-bold tracking-tight mb-4 italic uppercase">{section.title}</h3>
               <p className="text-gray-400 font-medium leading-relaxed mb-8 text-sm">{section.description}</p>
               <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:gap-4 transition-all">
                 Read Docs <ArrowRight className="w-4 h-4" />
               </button>
             </motion.div>
           ))}
        </div>

        {/* API Reference Section */}
        <div className="mb-40">
           <div className="flex items-center gap-4 mb-10">
              <Code2 className="w-8 h-8 text-primary" />
              <h2 className="text-4xl font-black tracking-tighter italic uppercase underline decoration-primary underline-offset-8">API <span className="text-primary not-italic">Reference.</span></h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { method: 'GET', endpoint: '/api/v1/system/status', desc: 'Retrieve core OS health and neural load metrics.' },
                { method: 'GET', endpoint: '/api/v1/clusters/active', desc: 'Fetch list of all active infrastructure clusters.' },
                { method: 'POST', endpoint: '/api/v1/notifications/broadcast', desc: 'Broadcast a network-wide system alert.' }
              ].map((api, i) => (
                <div key={i} className="card-on-bg p-8 bg-white/2 border border-white/5 rounded-3xl hover:border-primary/20 transition-all group">
                   <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-primary text-white text-[9px] font-black rounded-lg">{api.method}</span>
                      <code className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors">{api.endpoint}</code>
                   </div>
                   <p className="text-xs text-gray-500 font-medium leading-relaxed">{api.desc}</p>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="col-span-2 card-on-bg p-12 bg-black/40 border border-white/5 rounded-[4rem] flex flex-col justify-between min-h-[500px]">
              <div>
                <h3 className="text-5xl font-black tracking-tighter italic mb-8">System <span className="text-primary not-italic">Integrity.</span></h3>
                <p className="text-xl text-gray-400 max-w-lg leading-relaxed font-medium mb-12">Every application built on the CaaS protocol inherits our neural moderation engine and zero-trust identity layer by default.</p>
                
                <div className="space-y-6">
                  {[
                    { label: 'Latency Protocol', val: 'Low-latency WebSockets (Edge)' },
                    { label: 'Edge Compute', val: 'V8 Isolate sandboxing' },
                    { label: 'Security Layer', val: 'End-to-end encrypted signals' }
                  ].map(spec => (
                    <div key={spec.label} className="flex items-center justify-between border-b border-white/5 pb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{spec.label}</span>
                      <span className="text-sm font-bold text-white uppercase tracking-widest">{spec.val}</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           <div className="card-gloss p-12 bg-primary/10 border-primary/20 flex flex-col items-center justify-center text-center">
              <Terminal className="w-20 h-20 text-primary mb-8" />
              <h3 className="text-3xl font-bold tracking-tight mb-4 italic">Console Access</h3>
              <p className="text-gray-400 font-medium mb-10 leading-relaxed">Direct interaction with the mainframe kernel for high-fidelity debugging.</p>
              <button className="w-full py-6 bg-white text-bg-dark rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-primary hover:text-white transition-all">
                Launch Debugger
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

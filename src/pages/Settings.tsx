import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon,
  Bell, 
  Lock, 
  Eye, 
  Shield, 
  Cpu, 
  User, 
  CreditCard,
  ChevronRight,
  Save,
  Sliders
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [aiSensitivity, setAiSensitivity] = useState(70);

  const sidebarItems = [
    { id: 'general', label: 'General', icon: <User className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Configuration', icon: <Cpu className="w-4 h-4" /> },
    { id: 'billing', label: 'System Billing', icon: <CreditCard className="w-4 h-4" /> }
  ];

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-10 pb-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start gap-12">
          {/* Sidebar */}
          <div className="w-full md:w-80 space-y-2">
            <div className="mb-10">
              <h1 className="text-5xl font-black tracking-tighter italic uppercase">Control <br/><span className="text-primary not-italic">Panel.</span></h1>
            </div>
            
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center justify-between p-6 rounded-3xl transition-all group",
                  activeTab === item.id 
                    ? "bg-primary text-white shadow-2xl shadow-primary/30" 
                    : "hover:bg-white/5 text-gray-500 hover:text-white"
                )}
              >
                <div className="flex items-center gap-4">
                  {item.icon}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", activeTab === item.id ? "opacity-100" : "opacity-0")} />
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white/5 border border-white/5 rounded-[4rem] p-12 backdrop-blur-2xl">
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-700" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold tracking-tighter italic mb-2 uppercase">{user?.displayName || 'User Node'}</h3>
                    <p className="text-gray-500 font-medium text-sm tracking-widest">{user?.email}</p>
                    <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">Replace Avatar</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Display Alias</label>
                      <input className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-bold" defaultValue={user?.displayName || ''} />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Communication Link</label>
                      <input className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-bold" defaultValue={user?.email || ''} />
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold tracking-tighter italic mb-2 uppercase">Neural <span className="text-primary not-italic">Moderation.</span></h3>
                    <p className="text-gray-500 text-sm font-medium">Fine-tune the behavioral boundaries of your personal AI agents.</p>
                  </div>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Sliders className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div className="space-y-8 p-10 bg-white/5 border border-white/5 rounded-[3rem]">
                   <div className="flex justify-between items-end mb-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Response Sensitivity</label>
                      <span className="text-2xl font-black text-primary italic">{aiSensitivity}%</span>
                   </div>
                   <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={aiSensitivity} 
                      onChange={(e) => setAiSensitivity(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary" 
                   />
                   <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-600">
                      <span>Lax (Passive)</span>
                      <span>Strict (Interventionist)</span>
                   </div>
                </div>

                <div className="space-y-6">
                   {[
                     { label: 'Auto-Ban Protocol', desc: 'Automatically eject high-risk toxic nodes.', enabled: true },
                     { label: 'Neural Translation', desc: 'Real-time multi-language community bridge.', enabled: false },
                     { label: 'Semantic Search', desc: 'Advanced contextual discovery engine.', enabled: true }
                   ].map(feature => (
                     <div key={feature.label} className="flex items-center justify-between p-8 bg-white/2 border border-white/5 rounded-3xl">
                        <div>
                           <h4 className="font-bold mb-1 italic uppercase tracking-tighter">{feature.label}</h4>
                           <p className="text-xs text-gray-500 font-medium">{feature.desc}</p>
                        </div>
                        <div className={cn(
                          "w-12 h-6 rounded-full relative transition-all cursor-pointer shadow-inner",
                          feature.enabled ? "bg-primary" : "bg-white/10"
                        )}>
                          <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", feature.enabled ? "left-7" : "left-1")} />
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            <div className="mt-20 pt-10 border-t border-white/5 flex justify-end">
               <button className="flex items-center gap-4 bg-white text-bg-dark px-10 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-primary hover:text-white transition-all shadow-2xl">
                  <Save className="w-4 h-4" />
                  Synchronize Settings
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

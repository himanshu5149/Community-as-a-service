import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { useSpaces } from '../hooks/useSpaces';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Zap, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  Plus, 
  Box, 
  Activity,
  Cpu,
  LayoutGrid,
  ShieldCheck,
  CreditCard,
  Clock,
  ChevronRight,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { joinedGroups } = useGroups();
  const { spaces } = useSpaces();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { label: 'Active Clusters', val: joinedGroups.length, icon: <LayoutGrid className="w-5 h-5 text-blue-400" /> },
    { label: 'Neural Spaces', val: spaces.length, icon: <Box className="w-5 h-5 text-primary" /> },
    { label: 'System Uptime', val: '99.9%', icon: <Activity className="w-5 h-5 text-green-400" /> },
    { label: 'AI Operations', val: '1,242', icon: <Cpu className="w-5 h-5 text-yellow-500" /> }
  ];

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-10 pb-40">
      <div className="max-w-7xl mx-auto">
        {/* OS Top Bar Info */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-center text-2xl overflow-hidden shadow-2xl">
                   {user?.photoURL ? <img src={user.photoURL} alt="me" /> : '👤'}
                </div>
                <div>
                   <h1 className="text-4xl font-bold tracking-tighter italic uppercase text-white/50">Welcome,</h1>
                   <h2 className="text-6xl font-black tracking-tighter italic uppercase leading-[0.8]">{user?.displayName?.split(' ')[0] || 'Operator'}.</h2>
                </div>
             </div>
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-500">
                   <Clock className="w-4 h-4" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} System Time</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                   <ShieldCheck className="w-4 h-4 text-green-500" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Secured</span>
                </div>
             </div>
          </motion.div>

          <div className="flex flex-wrap gap-4">
             <button onClick={() => navigate('/groups?create=true')} className="flex items-center gap-4 bg-primary text-white px-10 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-sm hover:scale-105 transition-all shadow-2xl">
                <Plus className="w-5 h-5" />
                Initialize Cluster
             </button>
             <button onClick={() => navigate('/marketplace')} className="flex items-center gap-4 bg-white/5 border border-white/10 text-white px-10 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-sm hover:bg-white/10 transition-all shadow-2xl backdrop-blur-xl">
                <LayoutGrid className="w-5 h-5" />
                App Market
             </button>
          </div>
        </div>

        {/* System Stats HUD */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           {stats.map((stat, i) => (
             <motion.div 
               key={stat.label}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="card-gloss p-8 flex flex-col justify-between h-44 hover:bg-white/10 transition-all cursor-pointer group"
             >
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">{stat.icon}</div>
                   <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">Metric 0{i+1}</span>
                </div>
                <div>
                   <div className="text-4xl font-black tracking-tighter italic">{stat.val}</div>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{stat.label}</div>
                </div>
             </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Active Clusters Loop */}
           <div className="lg:col-span-2 space-y-10">
              <div className="flex justify-between items-end">
                 <h3 className="text-4xl font-black tracking-tighter italic uppercase">Active <span className="text-primary not-italic">Clusters.</span></h3>
                 <button onClick={() => navigate('/groups')} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center gap-2">View All Terminal <ChevronRight className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {joinedGroups.slice(0, 4).map((group, i) => (
                   <motion.div 
                     key={group.id}
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: i * 0.1 }}
                     onClick={() => navigate(`/groups/${group.id}`)}
                     className="card-on-bg p-10 bg-white/2 hover:bg-white/5 border border-white/5 rounded-[3rem] transition-all cursor-pointer group overflow-hidden relative"
                   >
                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                         <ChevronRight className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex items-center gap-4 mb-8">
                         <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-xl shadow-lg group-hover:rotate-12 transition-transform">
                            {group.category === 'Tech' ? '💻' : group.category === 'Fitness' ? '🏋️' : '🧠'}
                         </div>
                         <div>
                            <h4 className="text-2xl font-bold tracking-tight italic">{group.name}</h4>
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">{group.category} Cluster</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="flex items-center gap-2 text-gray-500">
                            <Users className="w-4 h-4" />
                            <span className="text-[8px] font-bold uppercase tracking-widest">{group.memberCount || 0} Nodes</span>
                         </div>
                         <div className="flex items-center gap-2 text-gray-500">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Active Comms</span>
                         </div>
                      </div>
                   </motion.div>
                 ))}
                 {joinedGroups.length === 0 && (
                   <div className="col-span-full py-20 bg-white/2 border border-dashed border-white/5 rounded-[3rem] text-center">
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No active clusters found. Initialize system.</p>
                   </div>
                 )}
              </div>
           </div>

           {/* Sidebar: Notifications & AI Alerts */}
           <div className="space-y-10">
              <h3 className="text-4xl font-black tracking-tighter italic uppercase">Event <span className="text-primary not-italic">Stream.</span></h3>
              <div className="card-gloss p-10 space-y-6">
                 {[
                   { type: 'ai', msg: 'Neuromodulator flagged entry in Tech Forge.', time: '2m' },
                   { type: 'event', msg: 'Fitness Node expansion starting in 1h.', time: '12m' },
                   { type: 'billing', msg: 'Infrastructure renewal due in 7 days.', time: '1h' },
                   { type: 'system', msg: 'OS kernel updated to v2.4.2.', time: '4h' }
                 ].map((event, i) => (
                   <div key={i} className="flex gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        event.type === 'ai' ? 'bg-primary/20 text-primary' : 
                        event.type === 'billing' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'
                      )}>
                         {event.type === 'ai' ? <Zap className="w-4 h-4" /> : 
                          event.type === 'billing' ? <CreditCard className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <div>
                         <p className="text-xs font-bold leading-tight group-hover:text-primary transition-colors">{event.msg}</p>
                         <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">{event.time} ago</span>
                      </div>
                   </div>
                 ))}
                 <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Clear Stream</button>
              </div>

              {/* System Resource Card */}
              <div className="card-on-bg p-10 bg-primary/5 border border-primary/20 rounded-[3rem]">
                 <div className="flex justify-between items-center mb-10">
                    <h4 className="text-xl font-bold italic uppercase tracking-tighter">System Credits</h4>
                    <TrendingUp className="w-6 h-6 text-primary" />
                 </div>
                 <div className="mb-6">
                    <div className="text-5xl font-black tracking-tighter italic mb-2">1,240 <span className="text-sm font-bold opacity-30">CRC</span></div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="w-3/4 h-full bg-primary rounded-full"></div>
                    </div>
                 </div>
                 <button className="w-full py-4 bg-white text-bg-dark rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary hover:text-white transition-all">Recharge Core</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { useAiAgents } from '../hooks/useAiAgents';
import { 
  Zap, 
  Users, 
  Bot, 
  ArrowRight, 
  Plus, 
  LayoutGrid, 
  Activity, 
  Terminal, 
  Search,
  ChevronRight,
  Sparkles,
  Command,
  Settings,
  MessageSquare,
  Globe
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Toast, useToast } from '../components/Toast';

export default function Dashboard() {
  const { user } = useAuth();
  const { groups, joinedGroups, loading: groupsLoading } = useGroups();
  const { agents, loading: agentsLoading } = useAiAgents();
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="pt-24 min-h-screen bg-bg-dark text-white px-6 md:px-10 pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* Header section */}
        <header className="mb-12 md:mb-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Neural Link Active</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-4">
              {getTimeOfDay()}, <br/>
              <span className="text-primary italic">{user?.displayName?.split(' ')[0] || 'Operator'}.</span>
            </h1>
            <p className="text-gray-400 font-medium max-w-md">
              Welcome back to your community command center. Neural sync completed. All systems operational.
            </p>
          </motion.div>

          <div className="flex gap-4">
            <Link 
              to="/search" 
              className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-3 group"
            >
              <Search className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Search Network</span>
            </Link>
            <button 
              onClick={() => navigate('/groups?create=true')}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
            >
              <Plus className="w-4 h-4" /> Initialize Node
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Active Clusters', val: joinedGroups.length, icon: Users, color: 'text-blue-500' },
            { label: 'Neural Agents', val: agents.length, icon: Bot, color: 'text-purple-500' },
            { label: 'Network Points', val: (user as any)?.points || 0, icon: Zap, color: 'text-yellow-500' },
            { label: 'Logic Level', val: (user as any)?.level || 1, icon: Activity, color: 'text-green-500' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-gloss p-8 border-white/5 relative overflow-hidden group"
            >
              <div className={cn("absolute -top-4 -right-4 w-16 h-16 blur-2xl opacity-10 rounded-full", stat.color.replace('text-', 'bg-'))}></div>
              <stat.icon className={cn("w-5 h-5 mb-6 group-hover:scale-110 transition-transform", stat.color)} />
              <div className="text-3xl font-black tracking-tight mb-1">{stat.val}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Area: My Clusters */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight italic flex items-center gap-3">
                  Your <span className="text-primary not-italic">Infrastructure.</span>
                </h2>
                <Link to="/groups" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {joinedGroups.length === 0 ? (
                <div className="card-gloss p-20 text-center border-dashed border-white/10 opacity-60">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/5">
                    <Globe className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">No active frequency.</h3>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm font-medium leading-relaxed">
                    You haven't synchronized with any community nodes yet. Start by exploring the global network.
                  </p>
                  <Link 
                    to="/groups"
                    className="px-8 py-4 bg-white text-bg-dark rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all inline-block"
                  >
                    Explore Nodes
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {joinedGroups.map((group, i) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="group p-8 card-gloss border-white/5 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div 
                        className="absolute -top-10 -right-10 w-32 h-32 blur-[80px] opacity-20 transition-all group-hover:opacity-40"
                        style={{ backgroundColor: group.accentColor }}
                      ></div>
                      <div className="flex justify-between items-start mb-10 relative z-10">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-black italic shadow-2xl"
                          style={{ backgroundColor: group.accentColor }}
                        >
                          {group.name[0]}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{group.category}</div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{group.name}</h3>
                      <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed mb-6">
                        {group.description}
                      </p>
                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                          <Users className="w-3 h-3" />
                          <span>{group.memberCount} Members</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Neural Nexus Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight italic flex items-center gap-3">
                  Neural <span className="text-primary not-italic">Nexus.</span>
                </h2>
                <Link to="/ai" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                  Directory <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white text-left">
                {agents.slice(0, 4).map((agent, i) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => navigate('/ai')}
                    className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/5 transition-all cursor-pointer flex items-center gap-6 group"
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(83,74,183,0.2)] transition-all overflow-hidden shrink-0"
                      style={{ boxShadow: agent.accentColor ? `0 0 15px ${agent.accentColor}22` : 'none' }}
                    >
                      {agent.avatarUrl ? (
                         <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                      ) : (
                         <Bot className="w-8 h-8 text-primary" style={{ color: agent.accentColor }} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight flex items-center gap-2">
                        {agent.name}
                        {agent.isCrossGroup && <Sparkles className="w-3 h-3 text-primary" />}
                      </h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{agent.role}</p>
                      <p className="text-[11px] text-gray-400 font-medium line-clamp-1 italic">{agent.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-12">
            
            {/* Quick Command */}
            <div className="card-gloss p-10 bg-primary/5 border-primary/20 relative overflow-hidden rounded-[3rem]">
               <div className="absolute top-0 right-0 p-8 text-primary/10">
                 <Command className="w-24 h-24 rotate-12" />
               </div>
               <h3 className="text-2xl font-black tracking-tighter italic mb-6">Quick <br/><span className="text-primary not-italic">Actions.</span></h3>
               
               <div className="space-y-4 relative z-10">
                  {[
                    { label: 'Create New Cluster', icon: Plus, to: '/groups?create=true', color: 'bg-primary' },
                    { label: 'Global Intelligence', icon: Terminal, to: '/ai-nexus', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/20' },
                    { label: 'Manage Profile', icon: Settings, to: `/profile/${user?.uid}`, color: 'bg-white/5 text-gray-300' }
                  ].map((btn) => (
                    <Link
                      key={btn.label}
                      to={btn.to}
                      className={cn(
                        "w-full p-5 rounded-2xl flex items-center justify-between group transition-all",
                        btn.color.includes('bg-primary') ? "bg-primary text-white hover:scale-[1.02] shadow-xl shadow-primary/20" : btn.color + " hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <btn.icon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{btn.label}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
               </div>
            </div>

            {/* Neural Activity (Suggested Nodes) */}
            <div>
              <div className="flex items-center gap-2 mb-8 ml-2">
                 <Activity className="w-4 h-4 text-primary" />
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Neural Activity</h3>
              </div>
              <div className="space-y-6">
                 {groups.filter(g => !joinedGroups.find(jg => jg.id === g.id)).slice(0, 3).map((group, i) => (
                   <motion.div
                    key={group.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="flex items-center gap-5 group cursor-pointer"
                   >
                     <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold italic shrink-0"
                      style={{ backgroundColor: group.accentColor }}
                     >
                       {group.name[0]}
                     </div>
                     <div className="flex-grow min-w-0">
                       <h4 className="text-sm font-bold tracking-tight truncate group-hover:text-primary transition-colors">{group.name}</h4>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">{group.category}</span>
                          <div className="w-1 h-1 bg-white/5 rounded-full" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">{group.memberCount} members</span>
                       </div>
                     </div>
                     <Plus className="w-4 h-4 text-gray-700 group-hover:text-primary transition-colors" />
                   </motion.div>
                 ))}
                 <Link to="/groups" className="block text-center p-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors border border-white/5 mt-8">
                   Expand Network Search
                 </Link>
              </div>
            </div>

          </div>
        </div>
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

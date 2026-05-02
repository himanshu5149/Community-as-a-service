import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { useNotifications } from '../hooks/useNotifications';
import { collection, getCountFromServer, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Users, MessageSquare, Shield, Zap, ArrowRight, 
  Bell, Settings, Plus, Activity, Bot, Calendar,
  Package, Code, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

function useSystemStats(userId: string | undefined) {
  const [stats, setStats] = useState({ groups: 0, members: 0, aiOps: 0, spaces: 0 });
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const [groupsSnap, usersSnap, spacesSnap] = await Promise.all([
          getCountFromServer(collection(db, 'groups')),
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'spaces')),
        ]);
        setStats({
          groups: groupsSnap.data().count,
          members: usersSnap.data().count,
          aiOps: Math.floor(Math.random() * 200) + 50,
          spaces: spacesSnap.data().count,
        });
      } catch { }
    };
    load();
  }, [userId]);
  return stats;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { joinedGroups: groups, loading: groupsLoading } = useGroups();
  const { notifications } = useNotifications();
  const stats = useSystemStats(user?.uid);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const unread = notifications.filter(n => !n.isRead).length;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hud = [
    { label: 'Active Clusters', val: stats.groups, icon: <Users className="w-5 h-5" />, color: 'text-primary', link: '/groups' },
    { label: 'Network Members', val: stats.members, icon: <Activity className="w-5 h-5" />, color: 'text-blue-400', link: '/members' },
    { label: 'Neural Spaces', val: stats.spaces, icon: <Zap className="w-5 h-5" />, color: 'text-green-400', link: '/spaces' },
    { label: 'AI Operations', val: stats.aiOps, icon: <Bot className="w-5 h-5" />, color: 'text-amber-400', link: '/ai' },
  ];

  const shortcuts = [
    { label: 'New Community', icon: <Plus className="w-5 h-5" />, link: '/onboarding', color: 'bg-primary' },
    { label: 'Messages', icon: <MessageSquare className="w-5 h-5" />, link: '/messages', color: 'bg-blue-600' },
    { label: 'AI Nexus', icon: <Bot className="w-5 h-5" />, link: '/ai', color: 'bg-purple-600' },
    { label: 'Events', icon: <Calendar className="w-5 h-5" />, link: '/events', color: 'bg-green-700' },
    { label: 'Marketplace', icon: <Package className="w-5 h-5" />, link: '/marketplace', color: 'bg-orange-700' },
    { label: 'Developer', icon: <Code className="w-5 h-5" />, link: '/developer', color: 'bg-gray-700' },
    { label: 'Settings', icon: <Settings className="w-5 h-5" />, link: '/settings', color: 'bg-gray-800' },
    { label: 'Moderation', icon: <Shield className="w-5 h-5" />, link: '/admin', color: 'bg-red-900' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-20 pb-20 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">

        {/* OS Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4"
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">
              CaaS OS · {time}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
              {greeting}, <span className="text-primary italic">{user?.displayName?.split(' ')[0] || 'Operator'}.</span>
            </h1>
            <p className="text-gray-400 mt-2 font-medium">Your community infrastructure is running.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-[10px] font-black flex items-center justify-center">{unread}</span>}
            </Link>
            <Link to="/settings" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
              <Settings className="w-5 h-5" />
            </Link>
            <Link to="/onboarding" className="px-6 py-3 bg-primary rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-[0_10px_30px_rgba(83,74,183,0.3)]">
              <Plus className="w-4 h-4" /> New Community
            </Link>
          </div>
        </motion.div>

        {/* System HUD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {hud.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={item.link} className="block p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all group">
                <div className={cn("mb-3", item.color)}>{item.icon}</div>
                <div className="text-3xl font-black tracking-tighter mb-1">{item.val}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">{item.label}</div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Communities */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick Launch */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Quick Launch</h2>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {shortcuts.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                    <Link to={s.link} className="flex flex-col items-center gap-2 group">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg", s.color)}>
                        {s.icon}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 group-hover:text-white transition-colors text-center leading-tight">{s.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Active Communities */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Active Clusters</h2>
                <Link to="/groups" className="text-[10px] font-black uppercase tracking-widest text-primary hover:gap-2 flex items-center gap-1 transition-all">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {groupsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 font-medium mb-4">No communities yet.</p>
                  <Link to="/onboarding" className="px-6 py-3 bg-primary rounded-2xl text-sm font-bold hover:scale-105 transition-all inline-block">
                    Launch Your First Community
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.slice(0, 5).map((group, i) => (
                    <motion.div key={group.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/groups/${group.id}`} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center text-lg">
                            {group.icon || '🌐'}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{group.name}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{group.category} · {group.memberCount || 0} members</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-primary transition-colors" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Event Stream */}
          <div className="space-y-6">

            {/* AI Status */}
            <div className="bg-primary/10 border border-primary/20 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">AI Shield Active</span>
              </div>
              <div className="text-3xl font-black tracking-tighter mb-1">{stats.aiOps}</div>
              <div className="text-xs text-gray-400 font-medium">Messages moderated today</div>
              <Link to="/admin" className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:gap-3 transition-all">
                View Moderation Log <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Notifications Feed */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Event Stream</h2>
                <Link to="/notifications" className="text-[10px] font-black uppercase tracking-widest text-primary">See All</Link>
              </div>
              {notifications.length === 0 ? (
                <p className="text-gray-600 text-sm font-medium text-center py-6">No events yet</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((n, i) => (
                    <div key={n.id} className={cn("p-4 rounded-2xl border transition-all", n.isRead ? "bg-white/3 border-white/5" : "bg-primary/10 border-primary/20")}>
                      <div className="font-bold text-xs mb-1">{n.title}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{n.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OS Links */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6">OS Modules</h2>
              <div className="space-y-2">
                {[
                  { label: 'Marketplace', sub: 'Community blueprints', link: '/marketplace', icon: <Package className="w-4 h-4" /> },
                  { label: 'Developer Hub', sub: 'API & webhooks', link: '/developer', icon: <Code className="w-4 h-4" /> },
                  { label: 'Settings', sub: 'Control panel', link: '/settings', icon: <Settings className="w-4 h-4" /> },
                ].map(item => (
                  <Link key={item.label} to={item.link} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="text-primary">{item.icon}</div>
                      <div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] text-gray-500">{item.sub}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { useAnalytics } from '../hooks/useAnalytics';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  Users, 
  MessageSquare, 
  ShieldAlert, 
  Zap, 
  Database,
  ArrowUpRight,
  Share2,
  ArrowRight,
  Loader2,
  Lock
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

import { useAdminModeration, FlaggedMessage } from '../hooks/useAdminModeration';

export default function Admin() {
  const isAdminUser = auth.currentUser?.email === 'royalisdevil@gmail.com';
  const [activeTab, setActiveTab] = React.useState<'dashboard'|'nodes'|'moderation'|'members'>('dashboard');

  if (!isAdminUser) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center text-white px-10">
         <div className="text-center">
            <Lock className="w-16 h-16 text-primary mx-auto mb-8 animate-pulse" />
            <h2 className="text-4xl font-bold tracking-tighter mb-4 italic">Protocol <span className="text-primary not-italic">Restricted.</span></h2>
            <p className="text-gray-500 font-medium">Administrator clearance required to access system diagnostics.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="pt-32 min-h-screen bg-[#0a0a0a] text-white px-6 md:px-10 pb-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 px-4 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Central Intelligence Hub
            </div>
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.8] italic uppercase">System <br/><span className="text-primary not-italic">Control.</span></h1>
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-xl shrink-0">
             {(['dashboard', 'nodes', 'members', 'moderation'] as const).map(tab => (
               <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:text-white"
                )}
               >
                 {tab === 'moderation' ? 'Enforcement' : tab === 'nodes' ? 'Clusters' : tab}
               </button>
             ))}
          </div>
        </div>

        {activeTab === 'dashboard' && <AdminMetrics />}
        {activeTab === 'nodes' && <AdminNodes />}
        {activeTab === 'members' && <AdminMembers />}
        {activeTab === 'moderation' && <ModerationDashboard />}
      </div>
    </div>
  );
}

function AdminMetrics() {
  const { data, loading } = useAnalytics();
  
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-500">Aggregating Global Metrics...</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        {[
          { label: 'Network Nodes', value: data.totalUsers, icon: Users, trend: '+12%' },
          { label: 'Active Clusters', value: data.totalGroups, icon: Activity, trend: '+2%' },
          { label: 'Signal Volume', value: '14.2k', icon: MessageSquare, trend: '+25%' },
          { label: 'Sys Efficiency', value: '94%', icon: Zap, trend: '+0.5%' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-gloss p-10 relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-10">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                 <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-primary font-bold text-xs flex items-center gap-1">
                 {stat.trend} <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <div className="text-4xl font-bold tracking-tighter mb-2 italic">{stat.value}</div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 card-gloss p-12">
            <div className="flex justify-between items-center mb-14">
              <div>
                  <h3 className="text-2xl font-bold tracking-tight mb-2">Engagement Velocity</h3>
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-widest leading-none">Intelligence signal distribution across 7 days</p>
              </div>
              <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Signals</span>
                  </div>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.engagementPath}>
                    <defs>
                        <linearGradient id="colorSignals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#534ab7" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#534ab7" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121212', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                      itemStyle={{ color: '#534ab7', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="signals" 
                      stroke="#534ab7" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorSignals)" 
                    />
                  </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>

        <div className="card-gloss p-12">
            <h3 className="text-2xl font-bold tracking-tight mb-10">Network Integrity</h3>
            <div className="space-y-10">
              {[
                { name: 'Identity Layer', status: 'Optimal', level: 98 },
                { name: 'Signal Mesh', status: 'Healthy', level: 85 },
                { name: 'Gamification Flux', status: 'Stable', level: 72 },
                { name: 'Event Scheduling', status: 'Delayed', level: 45, alert: true }
              ].map(layer => (
                  <div key={layer.name} className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1">{layer.name}</span>
                          <span className={cn("text-xs font-bold", layer.alert ? "text-yellow-500" : "text-primary")}>{layer.status}</span>
                        </div>
                        <span className="text-xl font-bold italic">{layer.level}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${layer.level}%` }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          className={cn("h-full", layer.alert ? "bg-yellow-500" : "bg-primary")}
                        ></motion.div>
                    </div>
                  </div>
              ))}
            </div>

            <div className="mt-14 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-4">
              <ShieldAlert className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <p className="text-xs text-yellow-500/80 font-medium leading-relaxed italic">
                  Cluster #4902 is showing anomalous event termination signatures. Recommend immediate intervention.
              </p>
            </div>
        </div>
      </div>
    </>
  );
}

function AdminNodes() {
  const [agents, setAgents] = React.useState<any[]>([]);
  const [newAgent, setNewAgent] = React.useState({
    name: '',
    personality: '',
    expertise: '',
    groupId: '',
    isCrossGroup: false,
    model: 'gemini-1.5-flash'
  });
  const [isDeploying, setIsDeploying] = React.useState(false);
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = query(collection(db, 'ai_agents'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAgents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      setError("Failed to link with AI Node Registry.");
      handleFirestoreError(err, OperationType.LIST, 'ai_agents');
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const q = query(collection(db, 'bridge_suggestions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSuggestions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'bridge_suggestions');
    });
    return () => unsubscribe();
  }, []);

  const seedAgents = async () => {
    setIsSeeding(true);
    setError(null);
    try {
      const defaultAgents = [
        {
          name: 'Nexus Core',
          personality: 'A wise, helpful community architect.',
          expertise: ['Community Building'],
          isCrossGroup: true,
          model: 'gemini-1.5-flash',
          totalResponses: 0,
          createdAt: serverTimestamp()
        }
      ];
      for (const agent of defaultAgents) {
        await addDoc(collection(db, 'ai_agents'), agent);
      }
    } catch (err: any) {
      setError("Neural seed sequence failed.");
      handleFirestoreError(err, OperationType.CREATE, 'ai_agents');
    } finally {
      setIsSeeding(false);
    }
  };

  const deployAgent = async () => {
    if (!newAgent.name || !newAgent.personality) return;
    setIsDeploying(true);
    setError(null);
    try {
      await addDoc(collection(db, 'ai_agents'), {
        ...newAgent,
        expertise: newAgent.expertise.split(',').map(e => e.trim()),
        totalResponses: 0,
        createdAt: serverTimestamp()
      });
      setNewAgent({
        name: '',
        personality: '',
        expertise: '',
        groupId: '',
        isCrossGroup: false,
        model: 'gemini-1.5-flash'
      });
    } catch (err: any) {
      setError("Deployment failed: Signal rejected.");
      handleFirestoreError(err, OperationType.CREATE, 'ai_agents');
    } finally {
      setIsDeploying(false);
    }
  };

  const decommissionAgent = async (id: string) => {
    if (!window.confirm("Protocol decommissioning is irreversible. Proceed?")) return;
    try {
      await deleteDoc(doc(db, 'ai_agents', id));
    } catch (err) {
      setError("Decommissioning failed.");
      handleFirestoreError(err, OperationType.DELETE, 'ai_agents');
    }
  };

  return (
    <div className="space-y-20">
      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-500 font-bold italic">
          <ShieldAlert className="w-6 h-6" />
          {error}
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-bold tracking-tight">Autonomous <span className="text-primary italic">Node Registry.</span></h2>
            <button 
              onClick={seedAgents}
              disabled={isSeeding}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 hover:text-primary transition-all disabled:opacity-50"
            >
              {isSeeding ? 'Syncing...' : 'Seed AI Nodes'}
            </button>
          </div>
          <div className="h-px flex-grow mx-8 bg-white/5"></div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{agents.length} Active Nodes</div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="card-gloss p-8 md:p-10 border-primary/20 bg-primary/5">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              Initialize New Node
            </h3>
            <div className="space-y-6">
              <input 
                placeholder="Agent Name"
                value={newAgent.name}
                onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold placeholder:text-gray-600 outline-none focus:border-primary"
              />
              <textarea 
                placeholder="Personality & Core Directives..."
                value={newAgent.personality}
                onChange={e => setNewAgent({...newAgent, personality: e.target.value})}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-medium placeholder:text-gray-600 outline-none focus:border-primary no-scrollbar"
              />
              <button 
                onClick={deployAgent}
                disabled={isDeploying || !newAgent.name}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/30 disabled:opacity-50"
              >
                {isDeploying ? 'Synchronizing...' : 'Deploy Intelligence'}
              </button>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6 max-h-[600px] overflow-y-auto no-scrollbar pr-4">
            {agents.map((agent) => (
              <div key={agent.id} className="card-gloss p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">{agent.name}</h4>
                    <p className="text-[10px] text-gray-500 font-medium mb-3">{agent.personality}</p>
                  </div>
                </div>
                <button onClick={() => decommissionAgent(agent.id)} className="p-3 bg-white/5 rounded-xl hover:bg-red-500/10 hover:text-red-500">
                  <Database className="w-5 h-5 opacity-40" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Community <span className="text-primary italic">Bridge Registry.</span></h2>
            <div className="h-px flex-grow mx-8 bg-white/5"></div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{suggestions.length} Signals</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map(suggestion => (
              <div key={suggestion.id} className="card-gloss p-6 border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Share2 className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Neural Link Suggestion</span>
                </div>
                <p className="text-[10px] font-medium text-gray-400 italic mb-6">"{suggestion.reason}"</p>
                <div className="flex gap-3">
                  <button className="flex-grow bg-white/5 hover:bg-primary/20 text-[10px] font-black uppercase py-3 rounded-xl border border-white/5">Approve</button>
                  <button className="flex-grow bg-white/5 hover:bg-red-500/10 text-[10px] font-black uppercase py-3 rounded-xl border border-white/5">Dismiss</button>
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}

function AdminMembers() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      setError("Synchronization failed. Check signal priority.");
      handleFirestoreError(err, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => 
    (u.displayName?.toLowerCase().includes(search.toLowerCase())) || 
    (u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-12">
       {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-500 font-bold italic">
          <ShieldAlert className="w-6 h-6" />
          {error}
        </div>
      )}
       <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <input 
            type="text" 
            placeholder="Search Member Registry..."
            className="w-full md:w-96 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 ring-primary/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{users.length} Active Profiles</div>
       </div>

       <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map(user => (
            <div key={user.id} className="card-gloss p-6 flex items-center justify-between group">
               <div className="flex items-center gap-6">
                  <img src={user.photoURL} alt="" className="w-12 h-12 rounded-xl border border-white/10 shadow-xl" />
                  <div>
                     <h4 className="font-bold text-lg leading-none mb-1">{user.displayName}</h4>
                     <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest">
                     {user.role}
                  </div>
                  <button className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                     <ShieldAlert className="w-5 h-5" />
                  </button>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}

function ModerationDashboard() {
  const { allReports, flaggedMessages, loading, resolveReport, updateMessageStatus, banUser } = useAdminModeration(true);
  const [localError, setLocalError] = React.useState<string | null>(null);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-500">Scanning Signal protocols...</p>
    </div>
  );

  const handleAction = async (fn: Function, ...args: any[]) => {
    try {
      setLocalError(null);
      await fn(...args);
    } catch (err: any) {
      setLocalError("Enforcement protocol failure.");
    }
  };

  return (
    <div className="space-y-20">
      {localError && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-500 font-bold italic">
          <ShieldAlert className="w-6 h-6" />
          {localError}
        </div>
      )}
      <section>
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold tracking-tight italic uppercase">Anomalous <span className="text-primary not-italic uppercase">Signals.</span></h2>
          <div className="h-px flex-grow mx-8 bg-white/5"></div>
          <div className="px-4 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest">
            {flaggedMessages.length} Pending Intervention
          </div>
        </div>

        <div className="space-y-6">
          {flaggedMessages.map((msg) => (
            <div key={msg.id} className="card-gloss p-8 flex flex-col md:flex-row gap-8 items-start justify-between group bg-red-500/[0.02] border-red-500/20">
              <div className="flex-grow">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary font-bold">
                      {msg.userName?.[0] || '?'}
                   </div>
                   <div>
                      <h4 className="font-bold text-lg">{msg.userName}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">ID: {msg.userId}</p>
                   </div>
                </div>
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 text-gray-300">
                   {msg.text}
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-48">
                 <button onClick={() => handleAction(updateMessageStatus, msg.id, 'deleted')} className="w-full py-4 bg-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl">Purge Message</button>
                 <button onClick={() => handleAction(updateMessageStatus, msg.id, 'safe')} className="w-full py-4 bg-white/5 text-[10px] font-black uppercase tracking-widest border border-white/5 rounded-xl">Dismiss</button>
                 <button onClick={() => handleAction(banUser, msg.userId)} className="w-full py-4 bg-white/5 text-[10px] font-black uppercase tracking-widest border border-red-500/50 rounded-xl text-red-500">Ban User</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold tracking-tight italic uppercase">Manual <span className="text-primary not-italic">Reports.</span></h2>
          <div className="h-px flex-grow mx-8 bg-white/5"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allReports.map((report) => (
            <div key={report.id} className="card-gloss p-6 border-white/5">
              <div className="flex justify-between items-start mb-6">
                 <span className="text-[10px] font-black uppercase text-primary">{report.targetType}</span>
                 <span className="px-2 py-1 rounded text-[8px] font-black uppercase bg-yellow-500/10 text-yellow-500">{report.status}</span>
              </div>
              <p className="text-sm italic text-gray-300 mb-8">"{report.reason}"</p>
              {report.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => handleAction(resolveReport, report.id, 'resolved')} className="py-3 bg-primary text-[10px] font-black uppercase rounded-lg">Resolve</button>
                   <button onClick={() => handleAction(resolveReport, report.id, 'dismissed')} className="py-3 bg-white/5 text-[10px] font-black uppercase rounded-lg border border-white/5">Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

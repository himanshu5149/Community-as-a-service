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

export default function Admin() {
  const { data, loading } = useAnalytics();
  const [showAgents, setShowAgents] = React.useState(false);
  const isAdminUser = auth.currentUser?.email === 'royalisdevil@gmail.com';

  if (!isAdminUser) {
    return (
      <div className="h-screen bg-bg-dark flex items-center justify-center text-white px-10">
         <div className="text-center">
            <Lock className="w-16 h-16 text-primary mx-auto mb-8 animate-pulse" />
            <h2 className="text-4xl font-bold tracking-tighter mb-4 italic">Protocol <span className="text-primary not-italic">Restricted.</span></h2>
            <p className="text-gray-500 font-medium">Administrator clearance required to access system diagnostics.</p>
         </div>
      </div>
    );
  }

  return (
    <AdminContent />
  );
}

function AdminContent() {
  const { data, loading } = useAnalytics();
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

  React.useEffect(() => {
    const q = query(collection(db, 'ai_agents'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAgents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const deployAgent = async () => {
    if (!newAgent.name || !newAgent.personality) return;
    setIsDeploying(true);
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
    } catch (err) {
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
      handleFirestoreError(err, OperationType.DELETE, 'ai_agents');
    }
  };

  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  React.useEffect(() => {
    const q = query(collection(db, 'bridge_suggestions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSuggestions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-6 md:px-10 pb-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 px-4 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Central Intelligence Hub
            </div>
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.8] italic">System <br/><span className="text-primary not-italic">Control.</span></h1>
          </div>
          
          <div className="flex items-center gap-6 bg-white/5 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
             <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Database Integrity</span>
                <span className="text-primary font-bold">99.98% Status</span>
             </div>
             <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                <Database className="w-6 h-6" />
             </div>
          </div>
        </div>

        {/* AI Agent Management */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Autonomous <span className="text-primary italic">Node Registry.</span></h2>
            <div className="h-px flex-grow mx-8 bg-white/5"></div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{agents.length} Active Nodes</div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* Deploy New Agent */}
            <div className="card-gloss p-8 md:p-10 border-primary/20 bg-primary/5">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary" />
                Initialize New Node
              </h3>
              <div className="space-y-6">
                <input 
                  placeholder="Agent Name (e.g. Aria)"
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
                <input 
                  placeholder="Expertise Tags (comma separated)"
                  value={newAgent.expertise}
                  onChange={e => setNewAgent({...newAgent, expertise: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-medium placeholder:text-gray-600 outline-none focus:border-primary"
                />
                <div className="grid grid-cols-2 gap-4">
                   <input 
                    placeholder="Group ID"
                    value={newAgent.groupId}
                    onChange={e => setNewAgent({...newAgent, groupId: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary"
                  />
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 px-6">
                    <input 
                      type="checkbox"
                      checked={newAgent.isCrossGroup}
                      onChange={e => setNewAgent({...newAgent, isCrossGroup: e.target.checked})}
                      className="w-4 h-4 accent-primary"
                      id="cross-group"
                    />
                    <label htmlFor="cross-group" className="text-[10px] font-black uppercase tracking-widest text-gray-500 cursor-pointer">Cross-Group</label>
                  </div>
                </div>
                <button 
                  onClick={deployAgent}
                  disabled={isDeploying || !newAgent.name}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/30 disabled:opacity-50"
                >
                  {isDeploying ? 'Synchronizing...' : 'Deploy Intelligence'}
                </button>
              </div>
            </div>

            {/* List Existing Agents */}
            <div className="xl:col-span-2 space-y-6 max-h-[600px] overflow-y-auto no-scrollbar pr-4">
              {agents.map((agent, i) => (
                <motion.div 
                  key={agent.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-gloss p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center relative">
                       <Activity className="w-8 h-8 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                       <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-bg-dark animate-pulse"></div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-xl font-bold">{agent.name}</h4>
                        <span className="text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">{agent.model}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium mb-3 max-w-[400px] line-clamp-1">{agent.personality}</p>
                      <div className="flex flex-wrap gap-2">
                        {agent.expertise?.map((e: string) => (
                          <span key={e} className="text-[8px] font-black uppercase tracking-widest border border-white/5 bg-white/5 px-2 py-1 rounded-md text-gray-400">{e}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1">Responses</span>
                        <span className="text-lg font-bold italic">{agent.totalResponses}</span>
                     </div>
                     <button 
                      onClick={() => decommissionAgent(agent.id)}
                      className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all text-gray-600"
                    >
                      <Loader2 className="w-5 h-5 opacity-40" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {agents.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                   <Activity className="w-16 h-16 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No intelligence nodes registered</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bridge Suggestions Management */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Cross-Community <span className="text-primary italic">Bridge Registry.</span></h2>
            <div className="h-px flex-grow mx-8 bg-white/5"></div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{suggestions.length} Signals Detected</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((suggestion, i) => (
              <motion.div 
                key={suggestion.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="card-gloss p-6 bg-gradient-to-br from-white/5 to-white/0 border-white/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Neural Link Suggestion</span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block">From</span>
                      <span className="text-sm font-bold">{suggestion.fromGroup}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-700" />
                    <div className="text-right">
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block">Target</span>
                      <span className="text-sm font-bold">{suggestion.suggestedGroup}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-[10px] font-medium text-gray-400 italic leading-relaxed">
                      "{suggestion.reason}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex-grow bg-white/5 hover:bg-green-500/10 hover:text-green-500 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all border border-white/5">
                    Approve Link
                  </button>
                  <button className="flex-grow bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all border border-white/5">
                    Dismiss
                  </button>
                </div>
              </motion.div>
            ))}

            {suggestions.length === 0 && (
              <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center opacity-40">
                <Share2 className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">No cross-community signals detected</p>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-500">Aggregating Global Metrics...</p>
          </div>
        ) : (
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
              {/* Engagement Chart */}
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

              {/* Health Monitoring */}
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
        )}
      </div>
    </div>
  );
}

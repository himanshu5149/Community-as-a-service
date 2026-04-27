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
  Loader2,
  Lock
} from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Admin() {
  const { data, loading } = useAnalytics();
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

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-10 pb-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 px-4 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Central Intelligence Hub
            </div>
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.8] italic">System <br/><span className="text-primary not-italic">Analytics.</span></h1>
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

import { motion } from 'motion/react';
import { ArrowRight, Activity, Cpu, Palette, GraduationCap, Heart, Utensils, Briefcase, Plus, Box, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { useAnalytics } from '../hooks/useAnalytics';

const categories = [
  { name: 'Fitness', icon: <Activity />, color: '#EF4444' },
  { name: 'Tech', icon: <Cpu />, color: '#3B82F6' },
  { name: 'Arts', icon: <Palette />, color: '#F59E0B' },
  { name: 'Education', icon: <GraduationCap />, color: '#10B981' },
  { name: 'Social Good', icon: <Heart />, color: '#EC4899' },
  { name: 'Food', icon: <Utensils />, color: '#8B5CF6' },
  { name: 'Business', icon: <Briefcase />, color: '#6366F1' },
  { name: 'More', icon: <Plus />, color: '#64748B' },
];

export default function Home() {
  const { data, loading } = useAnalytics();

  return (
    <div className="flex flex-col bg-bg-dark text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute w-[1000px] h-[1000px] -top-1/2 -left-1/4 bg-primary/20 rounded-full blur-[160px] animate-pulse"></div>
          <div className="absolute w-[800px] h-[800px] bottom-0 -right-1/4 bg-blue-500/10 rounded-full blur-[140px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-bg-dark)_0%,_transparent_100%)]"></div>
        </div>
        
        {/* Particle Dots */}
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-[2px] bg-white/40 rounded-full"
            initial={{ 
              x: Math.random() * 2000, 
              y: Math.random() * 1200,
              opacity: Math.random() 
            }}
            animate={{ 
              y: [null, '-=150'],
              opacity: [0.1, 0.4, 0.1]
            }}
            transition={{ 
              duration: Math.random() * 10 + 5, 
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
          />
        ))}

        <div className="flex-grow flex flex-col items-center justify-center relative z-20 max-w-6xl mx-auto px-10 text-center py-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-10 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]"></span>
              Mainframe Version 2.0 Stable
            </div>
            
            <h1 className="text-7xl md:text-[112px] font-bold leading-[0.88] tracking-tighter mb-10 max-w-5xl mx-auto drop-shadow-2xl">
              Focus on People, <br/>
              <span className="text-gradient italic text-primary">Not the Plumbing.</span>
            </h1>

            <p className="text-xl md:text-3xl text-gray-300 max-w-3xl mx-auto mb-16 leading-tight font-medium opacity-90">
              Stop building tech and start building connections. CaaS handles the infrastructure and moderation of your community, so you can focus on your people.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link
                to="/signup"
                className="px-12 py-6 bg-primary rounded-2xl text-lg font-bold shadow-[0_20px_50px_rgba(83,74,183,0.4)] hover:scale-105 hover:-translate-y-1 transition-all duration-300"
              >
                Deploy Your Node
              </Link>
              <Link
                to="/how-it-works"
                className="px-12 py-6 glass rounded-2xl text-lg font-bold flex items-center gap-3 group transition-all duration-300"
              >
                <span className="w-8 h-8 rounded-full bg-white text-bg-dark flex items-center justify-center p-1 group-hover:bg-primary group-hover:text-white transition-colors">
                   <ArrowRight className="w-5 h-5" />
                </span>
                See it in Action
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Live Network Pulse */}
        <div className="w-full bg-white/5 backdrop-blur-3xl border-t border-white/5 h-32 md:h-44 z-20 flex items-center px-12 gap-12 overflow-hidden relative">
            <div className="w-1/4 hidden lg:block border-r border-white/5 pr-8">
              <h3 className="text-white font-bold text-2xl mb-1 tracking-tighter italic">Network Pulse</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                {loading ? 'Synchronizing...' : `${data?.totalUsers || 0} Active Connections`}
              </p>
            </div>
          
          <div className="flex-1 flex gap-8 items-center overflow-x-auto no-scrollbar py-4 text-white">
            {[
              { icon: '💻', count: '2.4k', name: 'Tech Founders', color: 'text-blue-400' },
              { icon: '🏋️', count: '1.8k', name: 'Fitness Elite', color: 'text-green-400' },
              { icon: '🎨', count: '900', name: 'Makers Studio', color: 'text-pink-400' },
              { icon: '⚡', count: '5.2k', name: 'Speed Network', color: 'text-amber-400' }
            ].map((item, i) => (
              <div key={i} className="flex-shrink-0 w-56 h-28 bg-white/5 border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start">
                  <span className={`text-xl ${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.count} Members</span>
                </div>
                <div>
                  <p className="text-white text-sm font-bold tracking-tight">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Continuation */}
      <div className="relative z-30 pt-20">
        <section className="py-48 px-10 relative z-30">
          <div className="absolute inset-0 bg-[#0c0c0c] rounded-t-[80px] -mt-20"></div>
          <div className="max-w-7xl mx-auto relative z-10 text-white">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-24">
              <div className="max-w-3xl">
                <div className="text-primary font-bold text-sm tracking-[0.4em] uppercase mb-4">Vertical Deployment</div>
                <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.85]">Strategic <span className="text-primary italic">Intelligence.</span></h2>
                <p className="text-xl md:text-2xl text-gray-300 font-medium leading-relaxed max-w-xl">Infrastructure tailored for high-performance communities, deployed with institutional precision.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  viewport={{ once: true }}
                  className="group card-gloss p-12 hover:bg-white/10 transition-all duration-500 cursor-pointer border-b-4 border-b-transparent hover:border-b-primary"
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-12 text-white shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6 duration-300"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <h3 className="text-4xl font-bold mb-6 tracking-tighter">{cat.name}</h3>
                  <p className="text-gray-300 font-medium text-lg leading-snug opacity-80 group-hover:opacity-100 transition-opacity">Specialized mesh network for {cat.name.toLowerCase()} operation nodes.</p>
                </motion.div>
              ))}
            </div>

            {/* Social Proof / Stats Section */}
            <div className="mt-48 grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-white/5 pt-24">
              {[
                { val: data?.totalGroups || 0, label: 'Active Communities' },
                { val: data?.totalUsers || 0, label: 'Network Members' },
                { val: '12ms', label: 'Avg Latency' },
                { val: '99.9%', label: 'Uptime Protocol' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-5xl md:text-7xl font-black tracking-tighter mb-2">{stat.val}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-10 relative z-30 bg-primary/5 border-y border-white/5 text-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex -space-x-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-16 h-16 rounded-full border-4 border-bg-dark bg-gray-800 overflow-hidden shadow-xl">
                   <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <div className="flex-1">
              <p className="text-2xl font-medium tracking-tight text-gray-300 italic">
                "We migrated our 5,000 member developer community to CaaS in 48 hours. The AI moderation has cut our manual work by 70%."
              </p>
              <div className="mt-4 text-sm font-bold uppercase tracking-widest text-primary">— Sarah Chen, CTO @ DevMesh</div>
            </div>
          </div>
        </section>

        <section className="py-48 px-10 relative z-30 overflow-hidden text-white">
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-24">
             <div className="md:w-1/2">
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.85] italic">Neural <br/> <span className="text-primary not-italic">Spaces.</span></h2>
                <p className="text-2xl text-gray-300 font-medium leading-tight mb-12">
                  Cross-disciplinary collaboration hubs where specialized group clusters intersect. Link protocols, share assets, and solve complex objectives.
                </p>
                <Link 
                  to="/spaces"
                  className="px-12 py-6 bg-white text-bg-dark rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:bg-primary hover:text-white transition-all shadow-2xl inline-block"
                >
                  Initialize Workspace
                </Link>
             </div>
             <div className="md:w-1/2 relative bg-white/5 border border-white/10 rounded-[4rem] p-12 backdrop-blur-3xl">
                <div className="grid grid-cols-2 gap-8">
                   <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] text-center">
                      <Box className="w-10 h-10 text-primary mx-auto mb-4" />
                      <div className="text-xs font-black uppercase tracking-widest">Linked Clusters</div>
                   </div>
                   <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] text-center">
                      <Users className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                      <div className="text-xs font-black uppercase tracking-widest">Synapse Flow</div>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { motion } from 'motion/react';
import { ArrowRight, Activity, Cpu, Palette, GraduationCap, Heart, Utensils, Briefcase, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  return (
    <div className="flex flex-col bg-bg-dark">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden">
        {/* Animated Background Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute w-[1000px] h-[1000px] -top-1/2 -left-1/4 bg-primary/20 rounded-full blur-[160px] animate-pulse"></div>
          <div className="absolute w-[800px] h-[800px] bottom-0 -right-1/4 bg-blue-500/10 rounded-full blur-[140px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-bg-dark)_0%,_transparent_100%)]"></div>
          <div className="absolute inset-0 video-hero-bg opacity-30"></div>
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

        {/* Floating Badges */}
        <div className="absolute inset-0 pointer-events-none z-10 hidden lg:block">
          <motion.div 
            initial={{ opacity: 0, rotate: -12, scale: 0.8 }}
            animate={{ opacity: 1, rotate: -12, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute left-[10%] top-[25%] px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white flex flex-col gap-1 backdrop-blur-2xl shadow-2xl"
          >
            <span className="text-xl">🏋️</span>
            <span className="text-sm font-bold uppercase tracking-widest text-gray-300">Fitness Node</span>
            <span className="text-xs font-mono text-primary">Status: Active</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, rotate: 8, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 8, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute right-[12%] top-[30%] px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white flex flex-col gap-1 backdrop-blur-2xl shadow-2xl"
          >
            <span className="text-xl">💻</span>
            <span className="text-sm font-bold uppercase tracking-widest text-gray-300">Tech Cluster</span>
            <span className="text-xs font-mono text-blue-400">Latency: 12ms</span>
          </motion.div>
        </div>

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
              Communities <br/>
              <span className="text-gradient italic">Engineered.</span>
            </h1>

            <p className="text-xl md:text-3xl text-gray-300 max-w-2xl mx-auto mb-16 leading-tight font-medium opacity-90 uppercase tracking-tight">
              AI-Powered infrastructure for vertical networks. <br />
              Deploy collective intelligence at scale.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link
                to="/groups"
                className="px-12 py-6 bg-primary rounded-2xl text-lg font-bold shadow-[0_20px_50px_rgba(83,74,183,0.4)] hover:scale-105 hover:-translate-y-1 transition-all duration-300"
              >
                Access Network
              </Link>
              <Link
                to="/how-it-works"
                className="px-12 py-6 glass rounded-2xl text-lg font-bold flex items-center gap-3 group transition-all duration-300"
              >
                <span className="w-8 h-8 rounded-full bg-white text-bg-dark flex items-center justify-center p-1 group-hover:bg-primary group-hover:text-white transition-colors">
                   <ArrowRight className="w-5 h-5" />
                </span>
                The Protocol
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom Preview Panel - Now Integrated Properly */}
        <div className="w-full bg-white/5 backdrop-blur-3xl border-t border-white/5 h-32 md:h-44 z-20 flex items-center px-12 gap-12 overflow-hidden relative">
            <div className="w-1/4 hidden lg:block border-r border-white/5 pr-8">
              <h3 className="text-white font-bold text-2xl mb-1 tracking-tighter italic">CaaS Bridge</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Cross-Node Mesh Protocol Active</p>
            </div>
          
          <div className="flex-1 flex gap-8 items-center overflow-x-auto no-scrollbar py-4">
            {/* Visual Bridge Elements */}
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
            
            <div className="flex-1 flex items-center justify-center min-w-[200px]">
              <div className="flex gap-4 items-center">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                <div className="w-24 h-[1px] bg-gradient-to-r from-primary/50 to-transparent"></div>
                <div className="w-1 h-1 rounded-full bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Continuation */}
      <div className="relative z-30 pt-20">

      {/* Categories Grid */}
      <section className="py-48 px-10 relative z-30">
        <div className="absolute inset-0 bg-[#0c0c0c] rounded-t-[80px] -mt-20"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-24">
            <div className="max-w-3xl">
              <div className="text-primary font-bold text-sm tracking-[0.4em] uppercase mb-4">Vertical Deployment</div>
              <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.85]">Strategic <span className="text-primary italic">Intelligence.</span></h2>
              <p className="text-xl md:text-2xl text-gray-300 font-medium leading-relaxed max-w-xl">Infrastructure tailored for high-performance communities, deployed with institutional precision.</p>
            </div>
            <div className="flex gap-3 mb-4">
               <div className="w-16 h-1 w-24 bg-primary rounded-full"></div>
               <div className="w-8 h-1 bg-white/10 rounded-full"></div>
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
                
                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Provision Node</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Bridge Concept */}
      <section className="py-40 px-10 bg-bg-dark text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-10 leading-[0.9]">
              The Community <span className="text-gradient italic">Bridge.</span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed font-medium">
              We've solved the isolation problem. Our proprietary Bridge architecture enables 
              limitless cross-pollination between independent vertical groups.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              {[
                { title: 'Unified Identity', desc: 'One profile, many worlds.' },
                { title: 'Cross-Sync', desc: 'Real-time data parity.' },
                { title: 'Shared Assets', desc: 'Pooling local resources.' },
                { title: 'Hybrid Flows', desc: 'Modular collaboration.' }
              ].map((item) => (
                <div key={item.title} className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                  <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link
              to="/about"
              className="inline-flex items-center gap-3 text-white font-bold text-xl hover:gap-5 transition-all group"
            >
              Explore the Architecture <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          
          <div className="relative h-[600px] flex items-center justify-center">
             {/* Visual representation of the bridge with motion */}
             <div className="relative flex items-center justify-center scale-125">
                <motion.div 
                  className="w-64 h-64 rounded-full border-2 border-white/5 flex items-center justify-center relative"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute w-2 h-2 bg-primary/40 rounded-full"
                      style={{ 
                        transform: `rotate(${i * 60}deg) translateY(-128px)`
                      }}
                    />
                  ))}
                </motion.div>
                
                <motion.div 
                  className="absolute w-44 h-44 rounded-full border border-primary/20 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute top-0 w-3 h-3 bg-primary rounded-full shadow-[0_0_20px_rgba(83,74,183,0.8)]" />
                </motion.div>

                <div className="absolute w-32 h-32 bg-primary rounded-full blur-[100px] opacity-30" />
                <div className="absolute flex flex-col items-center">
                   <span className="text-6xl font-display font-bold tracking-tighter italic">CaaS</span>
                   <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-primary">Bridge</span>
                </div>
             </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Download, 
  Star, 
  Search, 
  Filter, 
  Cpu, 
  Activity, 
  Palette, 
  ShieldCheck,
  Plus,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useGroups } from '../hooks/useGroups';
import { useNavigate } from 'react-router-dom';

const templates = [
  {
    id: 'fitness-elite',
    name: 'Fitness Elite Node',
    description: 'High-performance blueprint with workout trackers, macro calculators, and AI form analysis bots.',
    icon: <Activity />,
    color: 'bg-red-500',
    category: 'Vertical',
    rating: 4.9,
    installs: '12k'
  },
  {
    id: 'tech-forge',
    name: 'Tech Founders Cluster',
    description: 'The ultimate startup OS. Includes pitch deck reviews, founder match-making, and GitHub integration sinks.',
    icon: <Cpu />,
    color: 'bg-blue-500',
    category: 'Vertical',
    rating: 4.8,
    installs: '8.4k'
  },
  {
    id: 'creator-studio',
    name: 'Makers Studio',
    description: 'Portfolio-first community template with gallery views and automated commission management.',
    icon: <Palette />,
    color: 'bg-pink-500',
    category: 'Creative',
    rating: 4.7,
    installs: '5.2k'
  },
  {
    id: 'neural-safe',
    name: 'Neural Guardian',
    description: 'A dedicated safety layer. Adds advanced threat detection and high-fidelity verification flows.',
    icon: <ShieldCheck />,
    color: 'bg-purple-500',
    category: 'Security',
    rating: 5.0,
    installs: '24k'
  }
];

export default function Marketplace() {
  const [search, setSearch] = useState('');
  const { createGroup } = useGroups();
  const navigate = useNavigate();

  const handleInstall = async (template: typeof templates[0]) => {
    try {
      const groupId = await createGroup(template.name, template.description, template.category);
      if (groupId) {
        navigate(`/groups/${groupId}`);
      }
    } catch (error) {
      console.error("Installation failed:", error);
    }
  };

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-10 pb-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 px-4 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Blueprints & Protocols
            </div>
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.8] italic">App <br/><span className="text-primary not-italic text-gradient">Marketplace.</span></h1>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl w-full max-w-md backdrop-blur-xl">
            <Search className="w-5 h-5 text-gray-500" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search community OS blueprints..."
              className="bg-transparent border-none outline-none text-sm font-medium w-full"
            />
            <Filter className="w-5 h-5 text-gray-500 cursor-pointer" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {templates.map((template, i) => (
            <motion.div 
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-gloss p-12 group hover:bg-white/10 transition-all border-b-4 border-b-transparent hover:border-b-primary relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-10">
                <div className={cn(
                  "w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-3xl text-white shadow-2xl transition-transform group-hover:rotate-12",
                  template.color
                )}>
                  {template.icon}
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold">{template.rating}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{template.installs} Initializations</span>
                </div>
              </div>

              <div className="mb-10">
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-3">{template.category} Template</div>
                <h3 className="text-4xl font-bold tracking-tighter mb-4 italic group-hover:text-primary transition-colors">{template.name}</h3>
                <p className="text-gray-400 font-medium leading-relaxed max-w-md">{template.description}</p>
              </div>

              <div className="flex items-center justify-between pt-10 border-t border-white/5">
                <div className="flex gap-4">
                   <div className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400">1-Click Install</div>
                   <div className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Enabled</div>
                </div>
                <button 
                  onClick={() => handleInstall(template)}
                  className="flex items-center gap-4 bg-white text-bg-dark px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-primary hover:text-white transition-all shadow-2xl"
                >
                  <Download className="w-4 h-4" />
                  Install Protocol
                </button>
              </div>
            </motion.div>
          ))}

          {/* Developer Contribution Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-on-bg p-12 flex flex-col justify-center items-center text-center border-2 border-dashed border-white/10 hover:border-primary/50 transition-all group"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8">
              <Plus className="w-10 h-10 text-gray-500 group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-3xl font-bold tracking-tight mb-4">Build for the OS</h3>
            <p className="text-gray-400 max-w-xs mx-auto mb-10 leading-relaxed font-medium">Create your own community blueprint and share it with the CaaS network.</p>
            <button 
              onClick={() => navigate('/developer')}
              className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-gray-400 hover:text-primary transition-colors"
            >
              Developer Documentation <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

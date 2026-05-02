import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { Package, Zap, Users, Shield, Check, Loader2, ArrowRight, Star } from 'lucide-react';
import { cn } from '../lib/utils';

const blueprints = [
  {
    id: 'tech-founders',
    name: 'Tech Founders',
    description: 'A structured space for startup founders. Includes channels for funding, product, hiring, and growth.',
    category: 'Tech',
    icon: '💻',
    channels: ['#general', '#funding', '#product', '#hiring', '#growth', '#wins'],
    members: '2.4k',
    rating: 4.9,
    aiPreset: 'strict',
    tags: ['Startups', 'VC', 'Product']
  },
  {
    id: 'fitness-elite',
    name: 'Fitness Elite',
    description: 'High-performance fitness community. Channels for training logs, nutrition, challenges, and PRs.',
    category: 'Fitness',
    icon: '🏋️',
    channels: ['#general', '#training-logs', '#nutrition', '#challenges', '#prs'],
    members: '1.8k',
    rating: 4.8,
    aiPreset: 'moderate',
    tags: ['Training', 'Nutrition', 'Health']
  },
  {
    id: 'makers-studio',
    name: 'Makers Studio',
    description: 'Creative community for designers, artists, and builders. Showcase work, get feedback, collaborate.',
    category: 'Arts',
    icon: '🎨',
    channels: ['#general', '#showcase', '#feedback', '#resources', '#collabs'],
    members: '900',
    rating: 4.7,
    aiPreset: 'lenient',
    tags: ['Design', 'Art', 'Creative']
  },
  {
    id: 'dev-network',
    name: 'Dev Network',
    description: 'Developer community with channels for code review, job board, open source, and tech discussions.',
    category: 'Tech',
    icon: '⚡',
    channels: ['#general', '#code-review', '#jobs', '#open-source', '#help', '#showcase'],
    members: '5.2k',
    rating: 4.9,
    aiPreset: 'moderate',
    tags: ['Coding', 'OSS', 'Jobs']
  },
  {
    id: 'edu-collective',
    name: 'Edu Collective',
    description: 'Learning-focused community. Study groups, resources, accountability partners, and Q&A channels.',
    category: 'Education',
    icon: '🎓',
    channels: ['#general', '#study-groups', '#resources', '#qa', '#accountability'],
    members: '3.1k',
    rating: 4.6,
    aiPreset: 'strict',
    tags: ['Learning', 'Study', 'Growth']
  },
  {
    id: 'food-collective',
    name: 'Food Collective',
    description: 'Culinary community for home cooks and chefs. Recipes, restaurant reviews, techniques, and challenges.',
    category: 'Food',
    icon: '🍜',
    channels: ['#general', '#recipes', '#restaurant-reviews', '#techniques', '#challenges'],
    members: '1.2k',
    rating: 4.5,
    aiPreset: 'lenient',
    tags: ['Cooking', 'Recipes', 'Food']
  },
];

export default function Marketplace() {
  const { user } = useAuth();
  const { createGroup } = useGroups();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed, setInstalled] = useState<string[]>([]);
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Tech', 'Fitness', 'Arts', 'Education', 'Food'];
  const filtered = filter === 'All' ? blueprints : blueprints.filter(b => b.category === filter);

  const handleInstall = async (blueprint: typeof blueprints[0]) => {
    if (!user) { showToast('Sign in to install blueprints.'); return; }
    setInstalling(blueprint.id);
    try {
      const groupId = await createGroup(
        blueprint.name,
        blueprint.description,
        blueprint.category
      );
      if (groupId) {
        setInstalled(p => [...p, blueprint.id]);
        showToast(`${blueprint.name} blueprint installed successfully.`);
        setTimeout(() => navigate(`/groups/${groupId}`), 1500);
      }
    } catch {
      showToast('Installation failed. Try again.', 'error');
    } finally {
      setInstalling(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em]">
            <Package className="w-3 h-3 text-primary" />
            Community Blueprint Store
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.85]">
            Community<br/>
            <span className="text-primary italic">Marketplace.</span>
          </h1>
          <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto">
            Install pre-built community blueprints in one click. Channels, AI settings, and structure — all ready from day one.
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                filter === cat ? "bg-primary text-white shadow-[0_5px_20px_rgba(83,74,183,0.4)]" : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((blueprint, i) => (
            <motion.div
              key={blueprint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:border-white/20 transition-all group flex flex-col"
            >
              {/* Top */}
              <div className="flex items-start justify-between mb-6">
                <div className="text-4xl">{blueprint.icon}</div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span className="text-xs font-black">{blueprint.rating}</span>
                </div>
              </div>

              <h3 className="text-2xl font-black tracking-tighter mb-2">{blueprint.name}</h3>
              <p className="text-gray-400 text-sm font-medium leading-relaxed mb-6 flex-grow">{blueprint.description}</p>

              {/* Channels */}
              <div className="mb-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Included Channels</div>
                <div className="flex flex-wrap gap-2">
                  {blueprint.channels.map(ch => (
                    <span key={ch} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-400">{ch}</span>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {blueprint.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary">{tag}</span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between mb-8 text-xs text-gray-500 font-bold">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {blueprint.members} installs</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> AI: {blueprint.aiPreset}</span>
              </div>

              {/* Install Button */}
              <button
                onClick={() => handleInstall(blueprint)}
                disabled={installing !== null || installed.includes(blueprint.id)}
                className={cn(
                  "w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:cursor-not-allowed",
                  installed.includes(blueprint.id)
                    ? "bg-green-500/20 border border-green-500/30 text-green-400"
                    : "bg-primary text-white hover:bg-primary/90 shadow-[0_10px_30px_rgba(83,74,183,0.3)] hover:scale-105"
                )}
              >
                {installing === blueprint.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Installing...</>
                ) : installed.includes(blueprint.id) ? (
                  <><Check className="w-4 h-4" /> Installed</>
                ) : (
                  <><Zap className="w-4 h-4" /> Install Blueprint</>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Submit CTA */}
        <div className="mt-20 p-10 bg-white/5 border border-white/10 rounded-[2.5rem] text-center">
          <h3 className="text-3xl font-black tracking-tighter mb-3">Built a great community template?</h3>
          <p className="text-gray-400 font-medium mb-6">Submit your blueprint to the marketplace and help thousands of community managers.</p>
          <button className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all inline-flex items-center gap-2">
            Submit Blueprint <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

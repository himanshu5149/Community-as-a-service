import { useState } from 'react';
import { motion } from 'motion/react';
import { useGroups } from '../hooks/useGroups';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signInWithGoogle } from '../lib/firebase';
import { Search, Users, ArrowRight, Zap, LogIn } from 'lucide-react';
import { cn } from '../lib/utils';

const CATEGORIES = ['All', 'Tech', 'Fitness', 'Arts', 'Education', 'Business', 'Food', 'Social Good'];

const categoryEmoji: Record<string, string> = {
  Tech: '💻', Fitness: '🏋️', Arts: '🎨',
  Education: '🎓', Business: '💼', Food: '🍜',
  'Social Good': '❤️', General: '🌐'
};

export default function Explore() {
  const { groups, loading } = useGroups();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const publicGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || g.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleJoin = (groupId: string) => {
    if (!user) { signInWithGoogle(); return; }
    navigate(`/groups/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em]">
            <Zap className="w-3 h-3 text-primary" />
            Community Discovery Network
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.85]">
            Find Your<br/>
            <span className="text-primary italic">Community.</span>
          </h1>
          <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto">
            Browse active communities across every vertical. Join in one click.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search communities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white font-medium outline-none focus:ring-2 ring-primary/50 placeholder:text-gray-600 transition-all"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                category === cat
                  ? "bg-primary text-white shadow-[0_5px_20px_rgba(83,74,183,0.4)]"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Not signed in banner */}
        {!user && (
          <div className="mb-10 p-6 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
            <p className="text-sm font-medium text-gray-300">Sign in to join communities instantly.</p>
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-2 px-6 py-3 bg-primary rounded-2xl font-bold text-sm hover:scale-105 transition-all"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          </div>
        )}

        {/* Groups Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 bg-white/5 border border-white/10 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : publicGroups.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-black tracking-tighter mb-3">No communities found</h3>
            <p className="text-gray-400 font-medium mb-8">
              {search ? `No results for "${search}"` : 'No communities yet in this category.'}
            </p>
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-primary rounded-2xl font-bold hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              Start One <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicGroups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-white/20 hover:bg-white/8 transition-all flex flex-col"
              >
                {/* Icon + Category */}
                <div className="flex items-start justify-between mb-6">
                  <div className="text-4xl">
                    {group.icon || categoryEmoji[group.category] || '🌐'}
                  </div>
                  <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
                    {group.category || 'General'}
                  </span>
                </div>

                {/* Info */}
                <h3 className="text-2xl font-black tracking-tighter mb-2 group-hover:text-primary transition-colors">
                  {group.name}
                </h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed mb-6 flex-grow line-clamp-2">
                  {group.description || 'A community on CaaS OS.'}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-6 text-xs text-gray-500 font-bold">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {group.memberCount || 0} members
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Active
                  </span>
                </div>

                {/* Join Button */}
                <button
                  onClick={() => handleJoin(group.id)}
                  className="w-full py-4 bg-primary rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(83,74,183,0.3)]"
                >
                  Join Community <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

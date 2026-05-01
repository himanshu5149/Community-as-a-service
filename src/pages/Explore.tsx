import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Users, Activity, Filter, ArrowUpRight, Zap, Shield, Sparkles } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  type: string;
  isPublic: boolean;
}

const CATEGORIES = ['All', 'Tech', 'Fitness', 'Arts', 'Education', 'Business'];

export default function Explore() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'groups'),
          where('isPublic', '==', true),
          limit(20)
        );
        const snapshot = await getDocs(q);
        setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Group[]);
      } catch (err) {
        console.error("Explore fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || g.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto text-white">
      {/* Header Section */}
      <div className="mb-16 text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6"
        >
          <Sparkles className="w-3 h-3" />
          Discovery Engine Active
        </motion.div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic mb-6">
          Find Your <span className="text-primary not-italic">Mesh.</span>
        </h1>
        <p className="text-xl text-gray-400 font-medium max-w-2xl mx-auto">
          Explore the nexus of high-performance communities deployed on the CaaS protocol.
        </p>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center">
        <div className="relative flex-grow w-full">
           <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
           <input 
             type="text" 
             placeholder="Search active nodes..."
             className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-16 pr-8 outline-none focus:ring-2 ring-primary/40 transition-all font-bold"
             value={search}
             onChange={e => setSearch(e.target.value)}
           />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-4 rounded-full font-bold transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-primary text-white shadow-xl' : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-80 bg-white/5 animate-pulse rounded-[3rem]" />
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredGroups.map((group, i) => (
             <motion.div
               key={group.id}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.05 }}
               className="group card-gloss p-1 bg-gradient-to-br from-primary/10 to-transparent rounded-[3rem] overflow-hidden"
             >
                <Link to={`/groups/${group.id}`} className="block h-full bg-[#0a0a0a] rounded-[2.9rem] p-10 hover:bg-[#0f0f0f] transition-all relative">
                   <div className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <ArrowUpRight className="w-6 h-6 text-primary" />
                   </div>
                   
                   <div className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/20">
                      {group.category}
                   </div>
                   
                   <h3 className="text-4xl font-black tracking-tighter mb-4 italic group-hover:text-primary transition-colors">
                      {group.name}
                   </h3>
                   
                   <p className="text-gray-400 text-sm font-medium mb-10 line-clamp-2">
                      {group.description || 'No node description provided. This is a high-performance community cluster established on the CaaS protocol.'}
                   </p>
                   
                   <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2">
                         <Users className="w-5 h-5 text-gray-500" />
                         <span className="text-xs font-bold">{group.memberCount} Nodes</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Activity className="w-5 h-5 text-green-500" />
                         <span className="text-xs font-bold uppercase tracking-tighter">High Flow</span>
                      </div>
                   </div>
                </Link>
             </motion.div>
           ))}
           
           {!loading && filteredGroups.length === 0 && (
              <div className="col-span-full py-40 text-center">
                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                    <Zap className="w-10 h-10 text-gray-600" />
                 </div>
                 <h3 className="text-4xl font-black tracking-tighter italic mb-4">No Nodes Found.</h3>
                 <p className="text-gray-500 max-w-sm mx-auto font-medium">Try broadly searching or initialize your own community node today.</p>
              </div>
           )}
        </div>
      )}

      {/* Featured Banner */}
      <section className="mt-32 p-1 bg-gradient-to-r from-primary via-blue-500 to-primary rounded-[4rem] overflow-hidden">
         <div className="bg-[#0a0a0a] rounded-[3.9rem] p-16 md:p-24 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="max-w-xl relative z-10">
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 italic uppercase">Scale Beyond <br/> <span className="text-primary not-italic">Limits.</span></h2>
               <p className="text-xl text-gray-400 font-medium mb-10 leading-tight">
                  Running a massive community? Reach out for institutional support, custom AI agents, and dedicated mesh instances.
               </p>
               <Link to="/contact" className="px-10 py-5 bg-white text-bg-dark rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-2xl inline-block">
                  Request High-Flow
               </Link>
            </div>
            <div className="flex gap-4 relative z-10">
               <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center animate-bounce duration-[3000ms]">
                  <Shield className="w-10 h-10 text-primary" />
               </div>
               <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center animate-bounce duration-[4000ms]">
                  <Activity className="w-10 h-10 text-blue-500" />
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}

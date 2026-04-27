import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSearch, SearchResult } from '../hooks/useSearch';
import { Search as SearchIcon, Users, MessageSquare, Calendar, ArrowRight, Loader2, Command } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Search() {
  const [query, setQuery] = useState('');
  const { results, loading } = useSearch(query);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'group': return <Users className="w-5 h-5 text-primary" />;
      case 'member': return <Command className="w-5 h-5 text-green-500" />;
      case 'event': return <Calendar className="w-5 h-5 text-yellow-500" />;
      default: return <MessageSquare className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="pt-24 md:pt-32 min-h-screen bg-bg-dark text-white px-6 md:px-10 pb-40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 md:mb-20">
          <div className="mb-4 md:mb-6 inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
            Global Index Query
          </div>
          <h1 className="text-5xl md:text-9xl font-bold tracking-tighter leading-none italic mb-8 md:mb-10">Neural <br/><span className="text-primary not-italic">Search.</span></h1>
          
          <div className="relative group mx-auto">
             <SearchIcon className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-gray-400 group-focus-within:text-primary transition-colors" />
             <input 
               autoFocus
               type="text"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               placeholder="Index signal keywords..."
               className="w-full bg-white/5 border border-white/5 rounded-2xl md:rounded-[2.5rem] py-6 md:py-10 pl-14 md:pl-20 pr-6 md:pr-10 outline-none focus:border-primary/50 transition-all font-bold text-lg md:text-2xl backdrop-blur-2xl shadow-2xl"
             />
             {loading && (
               <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2">
                 <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-primary animate-spin" />
               </div>
             )}
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!query && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-xs">Ready for input extraction...</p>
              </motion.div>
            )}

            {query && !loading && results.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-xs">No matching frequencies detected.</p>
              </motion.div>
            )}

            {results.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link 
                  to={result.link}
                  className="card-gloss p-6 md:p-8 flex items-center justify-between group hover:bg-white/10 transition-all border-l-4 border-l-transparent hover:border-l-primary"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                      {getIcon(result.type)}
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold tracking-tight mb-1">{result.title}</h3>
                      <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-widest">{result.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">Access Frequency</span>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

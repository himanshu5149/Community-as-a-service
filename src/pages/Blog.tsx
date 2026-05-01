import { useBlogPosts } from '../hooks/useBlogPosts';
import { motion } from 'motion/react';
import { db, signInWithGoogle } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar, User, ArrowRight, Loader2, Lock, LogIn, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useBridgeSuggestions } from '../hooks/useBridgeSuggestions';
import { useAuth } from '../hooks/useAuth';

export default function Blog() {
  const { posts, loading } = useBlogPosts();
  const { suggestBridge } = useBridgeSuggestions();
  const { user, loading: authLoading } = useAuth();

  const seedBlog = async () => {
    const samplePosts = [
      {
        title: 'The Rise of Community-as-a-Service',
        excerpt: 'Why infrastructure is the new networking differentiator in 2026.',
        content: 'Full content here...',
        category: 'Trends',
        author: 'Sarah Chen',
        date: serverTimestamp(),
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800'
      },
      {
        title: 'Scaling Tech Communities with CaaS',
        excerpt: 'How TechNexus grew to 10k members using automated provisioning.',
        content: 'Full content here...',
        category: 'Case Study',
        author: 'Marcus J.',
        date: serverTimestamp(),
        imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800'
      }
    ];

    for (const post of samplePosts) {
      await addDoc(collection(db, 'blogPosts'), post);
    }
  };

  if (authLoading) {
    return (
      <div className="pt-24 min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-bg-dark text-white">
      <div className="max-w-7xl mx-auto px-10 py-24">
        <div className="text-center max-w-4xl mx-auto mb-24">
          <h1 className="text-6xl md:text-[88px] font-bold tracking-tighter mb-10 leading-[0.9]">
            The CaaS <span className="text-gradient italic">Journal.</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium leading-relaxed">
            Deep dives into the protocols, architectures, and philosophies shaping the next generation of human collectives.
          </p>
        </div>

        {loading ? (
             <div className="flex flex-col items-center justify-center py-40 gap-6">
               <Loader2 className="w-12 h-12 text-primary animate-spin" />
               <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Accessing Archives...</p>
             </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {posts.map((post, i) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ease: "easeOut" }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-[3rem] mb-10 bg-white/5 border border-white/10">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title}
                    className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-8 left-8 px-5 py-2 bg-primary rounded-full text-xs font-bold text-white uppercase tracking-widest shadow-xl shadow-primary/20">
                    {post.category}
                  </div>
                </div>
                
                <div className="flex items-center gap-8 text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{post.date?.toDate().toLocaleDateString() || 'Today'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>{post.author}</span>
                  </div>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter group-hover:text-primary transition-colors leading-[1.1]">
                  {post.title}
                </h2>
                <p className="text-xl text-gray-400 font-medium leading-relaxed mb-8">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-6">
                  <div className="inline-flex items-center gap-3 text-white font-bold text-lg border-b-2 border-transparent hover:border-primary transition-all pb-2">
                    Read Protocol <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const reason = prompt("Why should this post bridge communities?");
                      if (reason) suggestBridge(post.id, 'Blog', 'Global Feed', reason);
                    }}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-colors mt-1"
                  >
                    <Share2 className="w-4 h-4" />
                    Bridge Community
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div className="text-center">
            <button onClick={seedBlog} className="bg-primary text-white px-10 py-5 rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              Seed Journal Archive
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

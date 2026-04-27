import { motion } from 'motion/react';

export default function About() {
  return (
    <div className="pt-24 min-h-screen bg-bg-dark text-white">
      <div className="max-w-7xl mx-auto px-10 py-32">
        <div className="grid md:grid-cols-2 gap-24 items-center">
          <div>
            <div className="text-primary font-bold text-sm tracking-[0.4em] uppercase mb-6">Our DNA</div>
            <h1 className="text-6xl md:text-[100px] font-bold tracking-tighter mb-10 leading-[0.85]">Humanity <br/><span className="text-primary italic">Encoded.</span></h1>
            <p className="text-2xl text-gray-400 leading-tight mb-10 font-medium">
              CaaS was born from a simple realization: human connection is the ultimate utility, yet its infrastructure is often fragmented and primitive. 
            </p>
            <p className="text-lg text-gray-400 leading-relaxed mb-12 max-w-xl">
              We apply the principles of Distributed Systems to social impact. By treating Community as a Service, we enable leaders to focus on the "human" layer while we handle the "infrastructure" layer—security, networking, data sync, and platform delivery.
            </p>
            <div className="grid grid-cols-2 gap-10">
               <div className="p-8 card-gloss">
                  <div className="text-5xl font-bold text-white mb-2 tracking-tighter">2024</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Protocol Launch</div>
               </div>
               <div className="p-8 card-gloss">
                  <div className="text-5xl font-bold text-primary mb-2 tracking-tighter">1M+</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Nodes Served</div>
               </div>
            </div>
          </div>
          <div className="relative">
             <div className="aspect-[4/5] rounded-[4rem] overflow-hidden bg-white/5 border border-white/10 p-2">
                <img 
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800" 
                  alt="Team collaboration" 
                  className="w-full h-full object-cover rounded-[3.5rem] opacity-80 hover:opacity-100 transition-opacity duration-700" 
                  referrerPolicy="no-referrer"
                />
             </div>
             <motion.div 
               animate={{ y: [0, -20, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -bottom-10 -left-10 p-12 bg-primary text-white rounded-[3rem] shadow-[0_40px_80px_rgba(83,74,183,0.4)] hidden lg:block border border-white/20"
             >
                <div className="text-4xl font-bold mb-4 tracking-tighter italic">Mission</div>
                <p className="text-white/80 font-medium leading-snug max-w-[240px]">Bridging every human collective with high-fidelity infrastructure protocol.</p>
             </motion.div>
          </div>
        </div>

        {/* New How to Use Section */}
        <div className="mt-40 pt-40 border-t border-white/10">
          <div className="text-primary font-bold text-sm tracking-[0.4em] uppercase mb-6 text-center">User Protocol</div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-20 text-center">How to Use <span className="text-primary italic">CaaS.</span></h2>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-10 card-gloss rounded-[3rem] border border-white/10">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-8 font-black text-2xl">01</div>
              <h3 className="text-2xl font-bold mb-4">Authenticate</h3>
              <p className="text-gray-400 leading-relaxed">Sign in with your Google account to initialize your personal identity node. Your profile is instantly synced across the network.</p>
            </div>
            
            <div className="p-10 card-gloss rounded-[3rem] border border-white/10">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-8 font-black text-2xl">02</div>
              <h3 className="text-2xl font-bold mb-4">Explore Sectors</h3>
              <p className="text-gray-400 leading-relaxed">Browse various groups (Sectors) like Tech, Fitness, or Art. Join specific communities that align with your professional or personal vectors.</p>
            </div>

            <div className="p-10 card-gloss rounded-[3rem] border border-white/10">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-8 font-black text-2xl">03</div>
              <h3 className="text-2xl font-bold mb-4">Collaborate</h3>
              <p className="text-gray-400 leading-relaxed">Enter Collaboration Spaces, join real-time conversations with AI assistants, participate in events, and contribute to shared goals within your groups.</p>
            </div>
          </div>
        </div>

        {/* Features Table */}
        <div className="mt-40">
          <h2 className="text-3xl font-bold tracking-tighter mb-10 uppercase tracking-[0.2em]">Core Architecture</h2>
          <div className="overflow-hidden rounded-[2rem] border border-white/10 backdrop-blur-xl">
             <table className="w-full text-left">
                <thead className="bg-white/5">
                   <tr>
                      <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-primary">Feature</th>
                      <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-primary">Capabilities</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   <tr>
                      <td className="px-8 py-8 font-bold">Group Clusters</td>
                      <td className="px-8 py-8 text-gray-400">Host niche communities with dedicated chat channels, event calendars, and AI-powered moderation.</td>
                   </tr>
                   <tr>
                      <td className="px-8 py-8 font-bold">AI Personas</td>
                      <td className="px-8 py-8 text-gray-400">Specialized AI agents like Aria (Fitness) or Nexus (Tech) that provide expert guidance within respective groups.</td>
                   </tr>
                   <tr>
                      <td className="px-8 py-8 font-bold">Neural Spaces</td>
                      <td className="px-8 py-8 text-gray-400">Collaboration hubs where multiple groups intersect for cross-disciplinary projects and high-fidelity interaction.</td>
                   </tr>
                   <tr>
                      <td className="px-8 py-8 font-bold">Synapse Feed</td>
                      <td className="px-8 py-8 text-gray-400">Real-time updates, notifications, and event streams that keep the community network alive.</td>
                   </tr>
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}

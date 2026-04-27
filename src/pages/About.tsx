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
      </div>
    </div>
  );
}

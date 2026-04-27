import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function Contact() {
  return (
    <div className="pt-24 min-h-screen bg-bg-dark text-white">
      <div className="max-w-7xl mx-auto px-10 py-32">
        <div className="text-center mb-24">
          <div className="mb-8 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Interface Command
          </div>
          <h1 className="text-6xl md:text-[100px] font-bold tracking-tighter mb-10 leading-[0.85]">Start the <br/><span className="text-primary italic">Dialogue.</span></h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-medium uppercase tracking-tight">Ready to elevate your community infrastructure? Let's discuss the protocol.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="card-gloss p-12"
          >
            <form className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-2">Operator Name</label>
                  <input type="text" className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/5 focus:bg-white/10 focus:border-primary transition-all outline-none text-white font-medium" placeholder="Identity..." />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-2">Secure Email</label>
                  <input type="email" className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/5 focus:bg-white/10 focus:border-primary transition-all outline-none text-white font-medium" placeholder="Transmission point..." />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-2">Network Segment</label>
                <select className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/5 focus:bg-white/10 focus:border-primary transition-all outline-none text-white font-medium appearance-none">
                  <option className="bg-bg-dark">Fitness Wellness</option>
                  <option className="bg-bg-dark">Tech Infrastructure</option>
                  <option className="bg-bg-dark">Arts Creativity</option>
                  <option className="bg-bg-dark">Educational Nodes</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-2">Transmission Data</label>
                <textarea rows={5} className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/5 focus:bg-white/10 focus:border-primary transition-all outline-none text-white font-medium" placeholder="Define your collective goals..." />
              </div>
              <button className="w-full bg-primary text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/20">
                Initiate Uplink <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>

          <div className="space-y-16 py-10">
            {[
              { icon: <Mail />, title: 'Direct Node', content: 'ops@caas.io', color: 'text-blue-400' },
              { icon: <Phone />, title: 'Support Line', content: '+1 (800) INFRA', color: 'text-purple-400' },
              { icon: <MapPin />, title: 'Central Hub', content: 'SF - GRID 73', color: 'text-green-400' }
            ].map((item, i) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className="flex items-center gap-10 group"
              >
                <div className={`w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:rotate-12 ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-2">{item.title}</h4>
                  <p className="text-3xl font-bold tracking-tighter text-white">{item.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

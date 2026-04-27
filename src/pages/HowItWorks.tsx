import { motion } from 'motion/react';
import { Layers, Zap, Shield, BarChart } from 'lucide-react';

const steps = [
  {
    title: 'Select Your Vertical',
    description: 'Choose from our industry-specific community blueprints or request a custom setup.',
    icon: <Layers className="w-8 h-8" />
  },
  {
    title: 'Automated Migration',
    description: 'We handle the onboarding of your existing members and assets within 24 hours.',
    icon: <Zap className="w-8 h-8" />
  },
  {
    title: 'Governance & Security',
    description: 'Establish rules, roles, and security protocols with our enterprise-grade dashboard.',
    icon: <Shield className="w-8 h-8" />
  },
  {
    title: 'Growth Analytics',
    description: 'Monitor engagement metrics and scale infrastructure as your community expands.',
    icon: <BarChart className="w-8 h-8" />
  }
];

export default function HowItWorks() {
  return (
    <div className="pt-24 min-h-screen bg-bg-dark text-white">
      <section className="py-24 px-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24">
            <h1 className="text-6xl md:text-[88px] font-bold tracking-tighter mb-10 leading-[0.9]">
              Service <br/>
              <span className="text-gradient italic">Architecture.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl font-medium leading-relaxed">
              CaaS operates on a four-pillar deployment model, ensuring your community has the stability of a tech giant with the warmth of a local collective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {steps.map((step, i) => (
              <motion.div 
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row gap-10 group"
              >
                <div className="flex-shrink-0 w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-primary border border-white/10 group-hover:bg-primary group-hover:text-white transition-all shadow-xl group-hover:shadow-primary/30">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-5 tracking-tighter">{step.title}</h3>
                  <p className="text-lg text-gray-400 leading-relaxed font-medium pl-8 border-l-2 border-white/5 group-hover:border-primary transition-all">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-40 bg-[#0c0c0c] rounded-t-[80px] -mt-20 relative z-20">
         <div className="max-w-7xl mx-auto px-10 text-center">
            <div className="text-primary font-bold text-sm tracking-[0.4em] uppercase mb-6">Service Level Agreement</div>
            <h2 className="text-6xl md:text-8xl font-bold mb-24 tracking-tighter leading-none">Enterprise <span className="text-primary italic">Precision.</span></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               {[
                 { label: 'Uptime Protocol', val: '99.99%' },
                 { label: 'Settlement Speed', val: 'INST' },
                 { label: 'Data Sovereignty', val: 'PRIVATE' },
                 { label: 'Integrations', val: 'OPEN' }
               ].map((stat, i) => (
                 <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-12 card-gloss hover:bg-white/10 transition-all border-b-4 border-b-transparent hover:border-b-primary"
                  >
                    <div className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tighter">{stat.val}</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 whitespace-nowrap">{stat.label}</div>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}

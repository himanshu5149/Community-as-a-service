import { motion } from 'motion/react';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$49',
    description: 'Perfect for small local collectives.',
    features: ['Up to 500 members', '1 Vertical Group', 'Community Bridge (1 connection)', 'Standard Support']
  },
  {
    name: 'Professional',
    price: '$199',
    description: 'Infrastructure for growing networks.',
    features: ['Up to 5,000 members', '3 Vertical Groups', 'Unlimited Bridges', 'Priority Support', 'Custom Domain'],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Global scale community systems.',
    features: ['Unlimited members', 'Unlimited Groups', 'White-labeling', 'API Access', 'dedicated Manager']
  }
];

export default function Pricing() {
  return (
    <div className="pt-24 min-h-screen bg-bg-dark text-white">
      <div className="max-w-7xl mx-auto px-10 py-32 text-center">
        <div className="mb-12 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Infrastructure Licensing
        </div>
        
        <h1 className="text-6xl md:text-9xl font-bold tracking-tighter mb-10 leading-[0.85]">
          Transparent <br/>
          <span className="text-primary italic">Investment.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-24 font-medium uppercase tracking-tight">
          Choose the infrastructure tier that matches your community's current velocity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className={`group flex flex-col p-12 rounded-[3.5rem] border transition-all duration-500 ${plan.popular ? 'bg-primary border-primary shadow-[0_40px_100px_-20px_rgba(83,74,183,0.5)] scale-105 z-10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-primary px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                  Optimized Choice
                </div>
              )}
              
              <div className="mb-12">
                <h3 className="text-3xl font-bold mb-4 tracking-tighter">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-bold tracking-tighter">{plan.price}</span>
                  <span className={`text-sm font-bold uppercase tracking-widest ${plan.popular ? 'text-white/80' : 'text-gray-400'}`}>/mo</span>
                </div>
                <p className={`mt-6 text-lg font-medium leading-snug ${plan.popular ? 'text-white/80' : 'text-gray-400'}`}>{plan.description}</p>
              </div>
              
              <div className="flex-grow">
                <ul className="space-y-6 mb-16">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${plan.popular ? 'bg-white text-primary border-white' : 'bg-primary/20 text-primary border-primary/20'}`}>
                        <Check className="w-3.5 h-3.5 stroke-[4]" />
                      </div>
                      <span className={`font-semibold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-300'}`}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className={`w-full py-6 rounded-3xl font-black uppercase tracking-widest text-sm transition-all duration-300 ${plan.popular ? 'bg-white text-primary hover:scale-[1.02] shadow-2xl' : 'bg-primary text-white hover:bg-primary/90'}`}>
                Deploy Protocol
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { 
  Check, 
  Zap, 
  ShieldCheck, 
  Crown, 
  CreditCard,
  ExternalLink,
  Loader2,
  ArrowRight
} from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Operative',
    price: '$0',
    description: 'Perfect for starting your cluster.',
    features: [
      'Up to 100 Members',
      'Basic AI Moderation',
      '1 Community Node',
      'Public Marketplace',
      'Standard Support'
    ],
    cta: 'Current Plan',
    highlight: false
  },
  {
    id: 'pro',
    name: 'Architect',
    price: '$29',
    description: 'Advanced tools for scaling hubs.',
    features: [
      'Unlimited Members',
      'Gemini-Flash Moderation',
      '5 Community Nodes',
      'Private Marketplaces',
      'Custom AI Training',
      'Priority Support'
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
    lemonSqueezyUrl: 'https://caas.lemonsqueezy.com/checkout/buy/pro'
  },
  {
    id: 'elite',
    name: 'Network Lord',
    price: '$99',
    description: 'Full infrastructure control.',
    features: [
      'White-label Nodes',
      'Unlimited Nodes',
      'Dedicated AI Instance',
      '0% Marketplace Fees',
      'API Access Protocols',
      '24/7 VIP Support'
    ],
    cta: 'Go Elite',
    highlight: false,
    lemonSqueezyUrl: 'https://caas.lemonsqueezy.com/checkout/buy/elite'
  }
];

export default function Billing() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleUpgrade = (planId: string, url?: string) => {
    if (planId === profile?.plan) return;
    if (!url) return;
    
    setLoading(planId);
    // In real app, this would redirect to Lemon Squeezy or open checkout
    window.open(url, '_blank');
    setTimeout(() => setLoading(null), 2000);
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="pt-32 min-h-screen bg-[#0a0a0a] text-white px-6 md:px-10 pb-40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-3 px-4 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md"
          >
            <CreditCard className="w-3 h-3 text-primary" />
            Infrastructure Economics
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-9xl font-black tracking-tighter italic leading-[0.8] mb-8"
          >
            Power <br/><span className="text-primary not-italic uppercase">Up.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto"
          >
            Select your clearance level. Upgrade your node capabilities and take control of the network.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className={cn(
                "card-gloss flex flex-col p-10 relative overflow-hidden",
                plan.highlight && "border-primary/50 shadow-2xl shadow-primary/10 bg-primary/[0.03]",
                profile?.plan === plan.id && "border-green-500/30"
              )}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 p-4">
                  <Zap className="w-6 h-6 text-primary animate-pulse" />
                </div>
              )}
              
              <div className="mb-10">
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">{plan.name}</div>
                <div className="text-6xl font-black tracking-tighter mb-2 italic">
                  {plan.price}
                  <span className="text-xs font-bold text-gray-600 not-italic tracking-widest uppercase ml-2">/ month</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">{plan.description}</p>
              </div>

              <div className="flex-grow space-y-4 mb-12">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id, plan.lemonSqueezyUrl)}
                disabled={profile?.plan === plan.id || loading !== null}
                className={cn(
                  "w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-2",
                  profile?.plan === plan.id 
                    ? "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default"
                    : plan.highlight
                      ? "bg-primary text-white hover:scale-[1.02] shadow-xl shadow-primary/30"
                      : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                )}
              >
                {loading === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : profile?.plan === plan.id ? (
                  <>Current Priority <ShieldCheck className="w-4 h-4" /></>
                ) : (
                  <>Initialize {plan.name} Plan <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Founder Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-20 card-gloss p-12 border-primary/20 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-12"
        >
          <div className="flex items-start gap-8">
            <div className="w-20 h-20 rounded-[2rem] bg-white text-bg-dark flex items-center justify-center shadow-2xl shrink-0">
               <Crown className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tighter italic mb-4">Founder's <span className="text-primary not-italic">Edition.</span></h3>
              <p className="text-gray-400 font-medium max-w-xl leading-snug">
                Own a CaaS Node Sentinel NFT? You qualify for lifetime access to the Architect plan. Verified through on-chain signal verification.
              </p>
            </div>
          </div>
          <button className="px-10 py-5 bg-white text-bg-dark rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all shadow-xl flex items-center gap-3">
             Verify NFT <ExternalLink className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, Sparkles, X, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ─── Lemon Squeezy Store Configuration ──────────────────────────────────────
const LEMONSQUEEZY_STORE = import.meta.env.VITE_LEMONSQUEEZY_STORE || "YOUR_STORE_SLUG";

// ─── Variant IDs from Env ───────────────────────────────────────────────────
const LS_VARIANT_IDS: Record<string, string> = {
  starter: import.meta.env.VITE_LS_STARTER_VARIANT_ID || 'YOUR_STARTER_VARIANT_ID',
  professional: import.meta.env.VITE_LS_PROFESSIONAL_VARIANT_ID || 'YOUR_PROFESSIONAL_VARIANT_ID',
};

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'Perfect for small local collectives.',
    features: ['Up to 500 members', '1 Vertical Group', 'Community Bridge (1 connection)', 'AI Moderation included', 'Standard Support']
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$199',
    period: '/mo',
    description: 'Infrastructure for growing networks.',
    features: ['Up to 5,000 members', '3 Vertical Groups', 'Unlimited Bridges', 'AI Moderation + Analytics', 'Priority Support', 'Custom Domain'],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Global scale community systems.',
    features: ['Unlimited members', 'Unlimited Groups', 'White-labeling', 'API Access', 'Dedicated Manager', 'SLA guarantee']
  }
];

const isConfigured = !LEMONSQUEEZY_STORE.includes("YOUR_") && Object.values(LS_VARIANT_IDS).every(v => !v.startsWith('YOUR_'));

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast, toast, hideToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDeploy = async (plan: typeof plans[0]) => {
    if (plan.id === 'enterprise') {
      navigate('/contact');
      return;
    }

    if (!user) {
      showToast('Please sign in first to deploy infrastructure.', 'error');
      navigate('/login');
      return;
    }

    setLoadingPlan(plan.id);
    setError(null);

    const variantId = LS_VARIANT_IDS[plan.id];

    if (!variantId || variantId.startsWith('YOUR_')) {
      showToast("Payment not configured yet. Add your LemonSqueezy variant IDs.", "error");
      setLoadingPlan(null);
      return;
    }

    try {
      // Option 1: Direct link (Simple)
      const checkoutUrl = new URL(`https://${LEMONSQUEEZY_STORE}.lemonsqueezy.com/checkout/buy/${variantId}`);
      if (user.email) checkoutUrl.searchParams.set('checkout[email]', user.email);
      checkoutUrl.searchParams.set('checkout[custom][user_id]', user.uid);
      checkoutUrl.searchParams.set('checkout[custom][plan_id]', plan.id);
      checkoutUrl.searchParams.set('embed', '1');
      checkoutUrl.searchParams.set('media', '0');
      
      window.location.href = checkoutUrl.toString();

      // Option 2: Backend initialization (Secure)
      /*
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName,
          planId: plan.id,
          planName: plan.name,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Checkout initialization failed');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
      */

    } catch (err: any) {
      setError(err.message || 'Failed to initialize checkout. Please try again.');
      showToast('Checkout failed. Please try again.', 'error');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[150px] -z-10 rounded-full"></div>

        <div className="mb-12 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Infrastructure Licensing v2.4
        </div>

        {!isConfigured && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 p-8 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 text-left max-w-2xl mx-auto"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-amber-500 font-black uppercase tracking-widest text-xs mb-2">Developer Configuration Required</h4>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  LemonSqueezy variant IDs are currently using placeholders. Add variant IDs to your environment or replace them in <code className="text-amber-200">Pricing.tsx</code>.
                </p>
                <div className="flex gap-4">
                  <a href="https://app.lemonsqueezy.com" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 underline decoration-amber-500/30">LemonSqueezy Dashboard</a>
                  <a href="/help" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white underline decoration-white/10">Configuration Guide</a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-10 leading-[0.85] uppercase">
          Transparent <br/>
          <span className="text-primary italic normal-case tracking-normal">Investment.</span>
        </h1>

        <p className="text-sm md:text-lg text-gray-500 max-w-2xl mx-auto mb-6 font-black uppercase tracking-[0.2em] italic">
          "The value of a community is directly proportional to its compute capacity."
        </p>

        <div className="flex items-center justify-center gap-2 mb-24 text-xs text-gray-500 font-bold uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Secured by Lemon Squeezy · Cancel anytime · 7-day refund guarantee
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-10 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-stretch relative">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className={cn(
                "group relative flex flex-col p-10 md:p-12 rounded-[3.5rem] border transition-all duration-700",
                plan.popular
                  ? "bg-[#121212] border-primary shadow-[0_0_80px_-20px_rgba(83,74,183,0.3)] md:scale-110 z-10"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl border border-white/10">
                  Mainframe Choice
                </div>
              )}

              <div className="mb-12">
                <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase italic">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black tracking-tighter">{plan.id === 'enterprise' ? '???' : plan.price}</span>
                  {plan.period && (
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", plan.popular ? "text-primary" : "text-gray-500")}>
                      {plan.period} / NODE
                    </span>
                  )}
                </div>
                <p className={cn("mt-6 text-sm font-medium leading-snug", plan.popular ? "text-gray-300" : "text-gray-500")}>
                  {plan.description}
                </p>
              </div>

              <div className="flex-grow">
                <ul className="space-y-6 mb-16">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-center gap-4 group/item">
                      <div className={cn(
                        "w-6 h-6 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover/item:scale-110 flex-shrink-0",
                        plan.popular ? "bg-primary/20 text-primary border-primary/20" : "bg-white/5 text-gray-500 border-white/5"
                      )}>
                        <Check className="w-3.5 h-3.5 stroke-[4]" />
                      </div>
                      <span className={cn("text-xs font-black uppercase tracking-widest", plan.popular ? "text-white" : "text-gray-400")}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleDeploy(plan)}
                disabled={loadingPlan !== null}
                className={cn(
                  "w-full py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 disabled:cursor-not-allowed",
                  plan.popular
                    ? "bg-primary text-white shadow-2xl shadow-primary/30 hover:bg-primary/90"
                    : "bg-white/5 text-white hover:bg-white/10 border border-white/5",
                  loadingPlan === plan.id && "opacity-70"
                )}
              >
                {loadingPlan === plan.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Node initializing...</>
                ) : plan.id === 'enterprise' ? (
                  <><ExternalLink className="w-4 h-4" /> Contact Sales</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Deploy Protocol</>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-white/5 pt-20">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard with one click. No penalties, no questions.' },
            { q: 'How do I get a refund?', a: 'Email us within 7 days of payment. Full refund, no questions asked.' },
            { q: 'What payment methods?', a: 'All major cards (Visa, Mastercard, Amex) and PayPal via Lemon Squeezy.' }
          ].map(item => (
            <div key={item.q} className="p-8 bg-white/5 border border-white/10 rounded-[2rem]">
              <h4 className="text-sm font-black uppercase tracking-widest mb-3 text-white">{item.q}</h4>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={hideToast} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

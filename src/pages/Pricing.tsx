import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { useToast, Toast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    variantId: '123456', // Replace with real LS variant ID
    price: '$49',
    description: 'Perfect for small local collectives.',
    features: ['Up to 500 members', '1 Vertical Group', 'Community Bridge (1 connection)', 'Standard Support']
  },
  {
    id: 'pro',
    name: 'Pro',
    variantId: '123457', // Replace with real LS variant ID
    price: '$199',
    description: 'Infrastructure for growing networks.',
    features: ['Up to 5,000 members', '3 Vertical Groups', 'Unlimited Bridges', 'Priority Support', 'Custom Domain'],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    variantId: '123458', // Replace with real LS variant ID
    price: 'Custom',
    description: 'Global scale community systems.',
    features: ['Unlimited members', 'Unlimited Groups', 'White-labeling', 'API Access', 'dedicated Manager']
  }
];

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<any | null>(null);
  const { showToast, toast, hideToast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('success')) {
      showToast("Payment Protocol Synchronized. Provisioning...", "success");
      // For this build, we'll update the user directly if redirected with success
      if (user) {
        updateDoc(doc(db, 'users', user.uid), {
          tier: 'pro', // Simplified for demo
          lastInvestment: serverTimestamp()
        }).then(() => {
           setSuccessPlan(plans[1]);
           navigate('/pricing', { replace: true });
        });
      }
    }
  }, [location, user, navigate, showToast]);

  const handleInvestment = async (plan: any) => {
    if (!user) {
      showToast("Identity sync required for investment.", "error");
      return;
    }

    if (plan.id === 'enterprise') {
      window.location.href = `mailto:sales@caas.ai?subject=Enterprise Inquiry from ${user.email}`;
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const response = await fetch('/api/lemonsqueezy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: plan.variantId,
          successUrl: window.location.origin + "/pricing?success=true",
          checkoutData: {
            user_id: user.uid,
            plan: plan.name,
          },
        }),
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || "Checkout creation failed");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Checkout failed. Verify Lemon Squeezy configuration.", "error");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 text-center relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[150px] -z-10 rounded-full"></div>

        <div className="mb-12 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Infrastructure Licensing v2.4
        </div>
        
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-10 leading-[0.85] uppercase">
          Transparent <br/>
          <span className="text-primary italic not-uppercase tracking-normal">Investment.</span>
        </h1>
        <p className="text-sm md:text-lg text-gray-500 max-w-2xl mx-auto mb-24 font-black uppercase tracking-[0.2em] italic">
          "The value of a community is directly proportional to its compute capacity."
        </p>

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
                  {plan.id !== 'enterprise' && <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", plan.popular ? "text-primary" : "text-gray-500")}>/ NODE</span>}
                </div>
                <p className={cn("mt-6 text-sm font-medium leading-relaxed leading-snug", plan.popular ? "text-gray-300" : "text-gray-500")}>{plan.description}</p>
              </div>
              
              <div className="flex-grow">
                <ul className="space-y-6 mb-16">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-center gap-4 group/item">
                      <div className={cn(
                        "w-6 h-6 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover/item:scale-110",
                        plan.popular ? "bg-primary/20 text-primary border-primary/20" : "bg-white/5 text-gray-500 border-white/5"
                      )}>
                        <Check className="w-3.5 h-3.5 stroke-[4]" />
                      </div>
                      <span className={cn("text-xs font-black uppercase tracking-widest", plan.popular ? "text-white" : "text-gray-400")}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => handleInvestment(plan)}
                disabled={loadingPlan !== null}
                className={cn(
                  "w-full py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-300 flex items-center justify-center gap-3 active:scale-95",
                  plan.popular 
                    ? "bg-primary text-white shadow-2xl shadow-primary/30 hover:bg-primary/90" 
                    : "bg-white/5 text-white hover:bg-white/10 border border-white/5",
                  loadingPlan === plan.id && "opacity-50"
                )}
              >
                {loadingPlan === plan.id ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Initializing node...
                    </>
                ) : (
                    <>
                        Deploy Protocol
                    </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {successPlan && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0a]/90 backdrop-blur-3xl"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-[#121212] border border-primary/30 rounded-[3rem] p-12 text-center shadow-full"
                >
                    <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/30 group">
                        <Sparkles className="w-10 h-10 text-primary animate-pulse group-hover:scale-125 transition-transform" />
                    </div>
                    <h2 className="text-3xl font-black italic mb-4 tracking-tighter uppercase">Protocol <span className="text-primary not-italic tracking-normal">Integrated.</span></h2>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed mb-10 italic">
                        "Your community infrastructure for the <span className="text-white font-bold">{successPlan.name}</span> tier has been successfully provisioned. Welcome to the future of social compute."
                    </p>
                    <div className="space-y-4">
                        <button onClick={() => navigate('/groups')} className="w-full bg-primary py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/30">Continue to Dashboard</button>
                        <button onClick={() => setSuccessPlan(null)} className="w-full py-4 text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">Download System Logs</button>
                    </div>
                </motion.div>
                <button onClick={() => setSuccessPlan(null)} className="absolute top-10 right-10 text-white/50 hover:text-white"><X className="w-8 h-8" /></button>
            </motion.div>
        )}
      </AnimatePresence>
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


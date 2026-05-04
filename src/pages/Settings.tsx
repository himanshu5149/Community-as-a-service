import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { usePlan } from '../hooks/usePlan';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useToast } from '../hooks/useToast';
import { 
  User, Bell, Shield, Bot, Trash2, 
  Save, Moon, Sun, 
  Lock, LogOut, AlertTriangle, ExternalLink, CreditCard, Sparkles, CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'billing', label: 'Billing', icon: <Lock className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'ai', label: 'AI Config', icon: <Bot className="w-4 h-4" /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
  { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="w-4 h-4" /> },
];

export default function Settings() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [notifSettings, setNotifSettings] = useState({
    messages: true, mentions: true, aiAlerts: true, events: false, marketing: false
  });
  const [aiSettings, setAiSettings] = useState({
    moderationSensitivity: 70, autoDelete: false, showWarnings: true, language: 'en'
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName });
      showToast('Profile updated successfully.');
    } catch {
      showToast('Failed to save. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { notificationSettings: notifSettings });
      showToast('Notification settings saved.');
    } catch {
      showToast('Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAI = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { aiSettings });
      showToast('AI configuration saved.');
    } catch {
      showToast('Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await user.delete();
      navigate('/');
    } catch {
      showToast('Delete failed. Re-login and try again.', 'error');
    }
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={cn("w-12 h-6 rounded-full transition-all relative", value ? "bg-primary" : "bg-white/10")}>
      <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", value ? "left-7" : "left-1")} />
    </button>
  );

  const BillingTab = () => {
    const { plan, planStatus, isActive, isPro, loading: planLoading } = usePlan();
    
    return (
      <motion.div key="billing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">Billing & Subscription</h2>
          <div className={cn(
            "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
            isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-gray-500 border-white/10"
          )}>
            {planStatus || 'No Active Subscription'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10 group-hover:bg-primary/20 transition-all"></div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Current Infrastructure Tier</div>
            <div className="text-4xl font-black uppercase italic tracking-tighter mb-4 text-primary">{plan}</div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-6">
              {isActive ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <div className="w-4 h-4 rounded-full border border-gray-600" />}
              {isActive ? 'All nodes online and synchronized' : 'Nodes running on restricted starter protocol'}
            </div>
            <button 
              onClick={() => navigate('/pricing')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Change Protocol
            </button>
          </div>

          <div className="p-8 bg-white/5 border border-white/10 rounded-3xl flex flex-col justify-center items-center text-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold mb-1 uppercase tracking-tight">Upgrade Available</div>
              <div className="text-xs text-gray-500 max-w-[200px]">Unlock autonomous AI nodes, vertical groups, and enterprise support.</div>
            </div>
            <button 
              onClick={() => navigate('/pricing')}
              className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
            >
              View Full Specs <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
          <div className="flex gap-4">
            <CreditCard className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-sm font-bold text-amber-200 mb-1">Transaction History</div>
              <div className="text-xs text-amber-500/70 mb-4">You can manage your payment methods and download invoices through our payment partner, LemonSqueezy.</div>
              <a 
                href="https://app.lemonsqueezy.com/my-orders" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-widest text-white hover:text-amber-200 underline decoration-white/20"
              >
                Go to LemonSqueezy Portal
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-10">
      <div className="max-w-5xl mx-auto">

        <div className="mb-10">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">System Control Panel</div>
          <h1 className="text-5xl font-black tracking-tighter">Settings.</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <div className="md:w-56 flex-shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-4 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left",
                    activeTab === tab.id ? "bg-primary text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
              <div className="pt-2 border-t border-white/5">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white/5 border border-white/10 rounded-[2rem] p-8">
            <AnimatePresence mode="wait">

              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-2xl font-black tracking-tighter">Profile Identity</h2>
                  <div className="flex items-center gap-6 p-6 bg-white/5 rounded-2xl">
                    {user?.photoURL ? (
                      <img src={user.photoURL} className="w-20 h-20 rounded-2xl border-2 border-primary/30" referrerPolicy="no-referrer" alt="avatar" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border-2 border-primary/30 flex items-center justify-center bg-white/5">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-lg">{user?.displayName}</div>
                      <div className="text-gray-400 text-sm">{user?.email}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Verified Operator</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Display Name</label>
                    <input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/50"
                    />
                  </div>
                  <button onClick={handleSaveProfile} disabled={saving} className="px-8 py-4 bg-primary rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </motion.div>
              )}

              {activeTab === 'billing' && (
                <BillingTab />
              )}

              {activeTab === 'notifications' && (
                <motion.div key="notifs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-2xl font-black tracking-tighter">Notification Controls</h2>
                  <div className="space-y-4">
                    {Object.entries(notifSettings).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <div>
                          <div className="font-bold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                          <div className="text-xs text-gray-500">Receive {key} notifications</div>
                        </div>
                        <Toggle value={val as boolean} onChange={() => setNotifSettings(p => ({ ...p, [key]: !p[key as keyof typeof p] }))} />
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSaveNotifications} disabled={saving} className="px-8 py-4 bg-primary rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Notifications'}
                  </button>
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-2xl font-black tracking-tighter">AI Configuration</h2>
                  <div className="p-6 bg-white/5 rounded-2xl space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Moderation Sensitivity</label>
                        <span className="text-xs font-black text-primary">{aiSettings.moderationSensitivity}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100"
                        value={aiSettings.moderationSensitivity}
                        onChange={e => setAiSettings(p => ({ ...p, moderationSensitivity: Number(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                        <span>Lenient</span><span>Strict</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'autoDelete', label: 'Auto-delete flagged messages', sub: 'AI removes violations automatically' },
                      { key: 'showWarnings', label: 'Show member warnings', sub: 'Warn users before action is taken' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <div>
                          <div className="font-bold text-sm">{item.label}</div>
                          <div className="text-xs text-gray-500">{item.sub}</div>
                        </div>
                        <Toggle
                          value={aiSettings[item.key as 'autoDelete' | 'showWarnings']}
                          onChange={() => setAiSettings(p => ({ ...p, [item.key]: !p[item.key as 'autoDelete' | 'showWarnings'] }))}
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSaveAI} disabled={saving} className="px-8 py-4 bg-primary rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save AI Config'}
                  </button>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-2xl font-black tracking-tighter">Privacy & Security</h2>
                  <div className="space-y-4">
                    {[
                      { icon: <Lock className="w-5 h-5 text-primary" />, title: 'Authentication', sub: 'Google OAuth — Verified', action: 'Manage' },
                      { icon: <Shield className="w-5 h-5 text-green-400" />, title: 'Data Encryption', sub: 'All messages encrypted in transit', action: 'View' },
                    ].map(item => (
                      <div key={item.title} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl">
                        <div className="flex items-center gap-4">
                          {item.icon}
                          <div>
                            <div className="font-bold text-sm">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.sub}</div>
                          </div>
                        </div>
                        <button className="text-xs font-black uppercase tracking-widest text-primary">{item.action}</button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'danger' && (
                <motion.div key="danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-2xl font-black tracking-tighter text-red-400">Danger Zone</h2>
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-bold text-red-300 mb-1">Delete Account</div>
                        <div className="text-sm text-gray-400 mb-4">This permanently deletes your profile, communities, and all data. This cannot be undone.</div>
                        {!confirmDelete ? (
                          <button onClick={() => setConfirmDelete(true)} className="px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold hover:bg-red-500/30 transition-all">
                            Delete My Account
                          </button>
                        ) : (
                          <div className="flex gap-3">
                            <button onClick={handleDeleteAccount} className="px-6 py-3 bg-red-600 rounded-2xl text-white text-sm font-bold hover:bg-red-700 transition-all">
                              Yes, Delete Everything
                            </button>
                            <button onClick={() => setConfirmDelete(false)} className="px-6 py-3 bg-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

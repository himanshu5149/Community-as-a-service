import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useToast } from '../hooks/useToast';
import { 
  User, Bell, Shield, Bot, Trash2, 
  Save, Moon, Sun, 
  Lock, LogOut, AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
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
                    <img src={user?.photoURL || ''} className="w-20 h-20 rounded-2xl border-2 border-primary/30" referrerPolicy="no-referrer" alt="avatar" />
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

import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Menu, X, Users, LogIn, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, signInWithGoogle } from '../lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, MessageSquare } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const { notifications, markAsRead } = useNotifications();
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Groups', href: '/groups' },
    { name: 'Spaces', href: '/spaces' },
    { name: 'Members', href: '/members' },
    { name: 'Events', href: '/events' },
    { name: 'Messages', href: '/messages' },
    { name: 'Search', href: '/search' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Blog', href: '/blog' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group transition-transform active:scale-95">
          <BrandLogo className="w-10 h-10 group-hover:rotate-6 transition-transform" />
          <span className="text-2xl font-black tracking-tighter uppercase mr-6">CaaS</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "text-sm font-semibold transition-colors hover:text-white",
                location.pathname === link.href ? "text-white" : "text-gray-400"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          {user ? (
            <div className="flex items-center gap-6 border-l border-white/10 pl-8">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-bg-dark">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifs && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-96 bg-[#121212] border border-white/10 rounded-[2rem] shadow-full overflow-hidden z-50 backdrop-blur-3xl"
                    >
                      <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white">Directives</h4>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{unreadCount} New Signals</span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                            No active intelligence feeds
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <Link 
                              key={notif.id}
                              to={notif.link}
                              onClick={() => { markAsRead(notif.id); setShowNotifs(false); }}
                              className={cn(
                                "block p-6 border-b border-white/5 hover:bg-white/5 transition-all",
                                !notif.isRead && "bg-white/[0.02]"
                              )}
                            >
                              <div className="flex items-start gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                  notif.isRead ? "bg-white/5 text-gray-500" : "bg-primary/20 text-primary"
                                )}>
                                  <MessageSquare className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white mb-1">{notif.title}</div>
                                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{notif.message}</p>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                      <Link to="/notifications" className="block p-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white transition-colors bg-white/5">
                        View All Intelligence
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
                <span className="text-xs font-bold text-gray-300 hidden lg:block">{user.displayName || user.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="px-6 py-2.5 bg-primary rounded-full text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Links */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 top-0 left-0 w-full h-screen bg-bg-dark z-50 p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
                <BrandLogo className="w-10 h-10" />
                <span className="text-2xl font-black tracking-tighter uppercase">CaaS</span>
              </Link>
              <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
              {user && (
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 mb-8">
                  {user.photoURL ? (
                    <img src={user.photoURL} className="w-12 h-12 rounded-full ring-2 ring-primary/20" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-lg leading-tight">{user.displayName || 'Operator'}</div>
                    <div className="text-xs text-gray-400 font-medium">{user.email}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                {links.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-2xl font-bold tracking-tight py-3 border-b border-white/5 flex items-center justify-between group",
                      location.pathname === link.href ? "text-primary px-4 bg-primary/5 rounded-xl border-none" : "text-gray-300"
                    )}
                  >
                    {link.name}
                    <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
              {user ? (
                <>
                  <Link 
                    to="/notifications" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl text-gray-300 font-bold"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5" />
                      Intelligence Feed
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-3 py-1 bg-primary text-white text-[10px] rounded-full font-black">
                        {unreadCount} NEW
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="w-full bg-white/10 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/20 transition-all"
                  >
                    <LogOut className="w-5 h-5" /> Sign Out from Network
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { handleLogin(); setIsOpen(false); }}
                  className="w-full bg-primary text-white p-6 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
                >
                  <LogIn className="w-5 h-5" /> Initialize Session
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

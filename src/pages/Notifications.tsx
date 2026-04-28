import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { motion } from 'motion/react';
import { Bell, MessageSquare, ChevronRight, Activity, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Notifications() {
  const { notifications, markAsRead } = useNotifications();

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-6 md:px-10 pb-40">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-20">
          <div>
            <div className="flex items-center gap-3 text-primary mb-4">
              <Zap className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Intelligence Feed</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter italic">Neural <span className="text-primary not-italic">Signals.</span></h1>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/5 px-6 py-3 rounded-2xl">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">{notifications.length} Signals</span>
          </div>
        </header>

        <div className="space-y-6">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={notif.link}
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  "group block card-gloss p-8 hover:border-primary/30 transition-all",
                  !notif.isRead && "border-primary/20 bg-primary/[0.02]"
                )}
              >
                <div className="flex items-start gap-8">
                  <div className={cn(
                    "w-14 h-14 h rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110",
                    notif.isRead ? "bg-white/5 text-gray-500" : "bg-primary/20 text-primary border border-primary/20"
                  )}>
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="text-xl font-bold tracking-tight">{notif.title}</h4>
                       {!notif.isRead && (
                         <span className="px-3 py-0.5 bg-primary rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-primary/40">Urgent Signal</span>
                       )}
                    </div>
                    <p className="text-gray-400 font-medium leading-relaxed max-w-2xl mb-4 group-hover:text-gray-300 transition-colors">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-700">
                       <Bell className="w-3 h-3" />
                       Interpreted by Community Node at {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-800 self-center group-hover:text-primary transition-colors group-hover:translate-x-2" />
                </div>
              </Link>
            </motion.div>
          ))}

          {notifications.length === 0 && (
            <div className="py-40 text-center space-y-6 opacity-30">
               <Bell className="w-20 h-20 mx-auto" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">No neural signals detected on current frequency</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

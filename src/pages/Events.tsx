import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEvents, Event } from '../hooks/useEvents';
import { useGroups } from '../hooks/useGroups';
import { auth, signInWithGoogle } from '../lib/firebase';
import { 
  Calendar, 
  MapPin, 
  Video, 
  Users, 
  Clock, 
  Plus, 
  X, 
  ChevronRight,
  Globe,
  Loader2,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Events() {
  const { events, loading, rsvp, createEvent } = useEvents();
  const { groups } = useGroups();
  const [showCreator, setShowCreator] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    eventType: 'online' as 'online' | 'in-person',
    meetingLink: '',
    groupId: ''
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEvent({
      ...formData,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      maxAttendees: 50
    } as any);
    setShowCreator(false);
  };

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-10 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 px-4 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Live Sync Log
            </div>
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.8] italic">Community <br/><span className="text-primary not-italic">Events.</span></h1>
          </div>
          
          <button 
            onClick={() => setShowCreator(true)}
            className="flex items-center gap-4 bg-primary text-white px-10 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-sm hover:scale-105 transition-all shadow-2xl"
          >
            <Plus className="w-5 h-5" /> Schedule Sync
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400">Syncing Temporal Log...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {events.length === 0 ? (
              <div className="col-span-full py-40 bg-white/5 border border-dashed border-white/10 rounded-[4rem] text-center">
                 <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-6" />
                 <h3 className="text-2xl font-bold mb-2">No Scheduled Syncs</h3>
                 <p className="text-gray-400 max-w-xs mx-auto">Initialize the first temporal event to engage the community cluster.</p>
              </div>
            ) : (
              events.map((event, i) => {
                const isAttending = event.rsvps?.includes(auth.currentUser?.uid || '');
                const group = groups.find(g => g.id === event.groupId);
                const startDate = new Date(event.startTime?.toDate?.() || event.startTime);
                
                return (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="card-gloss p-12 group hover:bg-white/10 transition-all border-b-4 border-b-transparent hover:border-b-primary"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex flex-col">
                        <div className="text-primary font-black text-[10px] uppercase tracking-[0.4em] mb-2">
                          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <h3 className="text-3xl font-bold tracking-tighter leading-tight">{event.title}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                        {event.eventType === 'online' ? <Globe className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                      </div>
                    </div>

                    <p className="text-gray-400 font-medium mb-10 leading-relaxed max-w-md">{event.description}</p>
                    
                    <div className="grid grid-cols-2 gap-6 mb-12">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{event.rsvps?.length || 0} Synced</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {group?.name?.[0] || 'C'}
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{group?.name || 'Global'}</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (auth.currentUser) {
                            rsvp(event, isAttending ? 'not-attending' : 'attending');
                          } else {
                            signInWithGoogle();
                          }
                        }}
                        className={cn(
                          "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                          isAttending ? "bg-green-500/10 text-green-500" : "bg-primary text-white shadow-xl"
                        )}
                      >
                        {isAttending ? <span className="flex items-center gap-2"><Check className="w-3 h-3" /> RSVP Confirmed</span> : (auth.currentUser ? "Join Protocol" : "Sign in to Join")}
                      </button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        )}

        {/* Creator Modal */}
        <AnimatePresence>
          {showCreator && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-bg-dark/95 backdrop-blur-xl"
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-[#121212] border border-white/10 p-12 rounded-[4rem] w-full max-w-2xl shadow-full overflow-y-auto max-h-[90vh] no-scrollbar"
               >
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-4xl font-bold tracking-tighter">Event <span className="text-primary italic">Initialization.</span></h3>
                     <button onClick={() => setShowCreator(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                        <X />
                     </button>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Signal Title</label>
                        <input 
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all text-xl font-bold"
                          placeholder="Event name..."
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Initiation Date/Time</label>
                           <input 
                             required
                             type="datetime-local"
                             value={formData.startTime}
                             onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                             className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-xl outline-none focus:border-primary transition-all font-medium text-white appearance-none"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Termination Date/Time</label>
                           <input 
                             required
                             type="datetime-local"
                             value={formData.endTime}
                             onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                             className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-xl outline-none focus:border-primary transition-all font-medium text-white appearance-none"
                           />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Cluster Namespace</label>
                        <select 
                           value={formData.groupId}
                           onChange={(e) => setFormData({...formData, groupId: e.target.value})}
                           className="w-full bg-white/5 border border-white/5 px-6 py-4 rounded-xl outline-none focus:border-primary transition-all font-medium text-white appearance-none"
                        >
                           <option value="">Global Broadcast</option>
                           {groups.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                           ))}
                        </select>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 ml-2">Briefing</label>
                        <textarea 
                           required
                           rows={4}
                           value={formData.description}
                           onChange={(e) => setFormData({...formData, description: e.target.value})}
                           className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl outline-none focus:border-primary transition-all font-medium"
                           placeholder="Protocol details..."
                        />
                     </div>

                     <button 
                        type="submit"
                        className="w-full bg-primary text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/40 mt-6"
                      >
                        Authorize Broadcast
                      </button>
                  </form>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

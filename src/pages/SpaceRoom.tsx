import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useSpaces, Space } from '../hooks/useSpaces';
import { useGroups } from '../hooks/useGroups';
import { 
  ArrowLeft, 
  Users, 
  Zap, 
  MessageSquare, 
  Layout, 
  Settings, 
  Shield, 
  Sparkles,
  Plus,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string;
}

export default function SpaceRoom() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { spaces, loading: spacesLoading } = useSpaces();
  const { groups } = useGroups();
  const [space, setSpace] = useState<Space | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'chat' | 'settings'>('board');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    if (!spaceId) return;
    const unsubscribe = onSnapshot(doc(db, 'spaces', spaceId), (d) => {
      if (d.exists()) {
        const data = d.data();
        setSpace({ id: d.id, ...data } as Space);
        setTasks((data.tasks || []) as Task[]);
      }
    });
    return unsubscribe;
  }, [spaceId]);

  const addTask = async () => {
    if (!newTaskText.trim() || !spaceId) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: newTaskText,
      completed: false
    };
    await updateDoc(doc(db, 'spaces', spaceId), {
      tasks: arrayUnion(newTask)
    });
    setNewTaskText('');
  };

  const toggleTask = async (taskId: string) => {
    if (!spaceId || !space) return;
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    await updateDoc(doc(db, 'spaces', spaceId), {
      tasks: updatedTasks
    });
  };

  if (spacesLoading) {
    return (
      <div className="pt-24 min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!space) {
     return (
        <div className="pt-24 min-h-screen bg-bg-dark flex flex-col items-center justify-center">
           <h2 className="text-4xl font-bold mb-6">Neural Link Expired.</h2>
           <Link to="/spaces" className="text-primary font-bold uppercase tracking-widest text-xs border border-primary/20 px-8 py-4 rounded-2xl hover:bg-primary/10 transition-all">Return to Hub</Link>
        </div>
     )
  }

  const connectedGroups = groups.filter(g => space.connectedGroups.includes(g.id));

  return (
    <div className="pt-24 h-screen bg-bg-dark text-white flex flex-col overflow-hidden">
      {/* Space Header */}
      <div className="h-24 border-b border-white/5 bg-white/5 backdrop-blur-3xl px-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <Link to="/spaces" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl border border-white/5">
              {space.icon}
            </div>
            <div>
               <h1 className="text-2xl font-bold tracking-tighter italic">{space.name}</h1>
               <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cross-Node Synergy Active</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="flex -space-x-3">
              {connectedGroups.map(g => (
                <div key={g.id} className="w-10 h-10 rounded-xl border-4 border-bg-dark bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 overflow-hidden" title={g.name}>
                   {g.name[0]}
                </div>
              ))}
           </div>
           <div className="h-10 w-[1px] bg-white/5"></div>
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveTab('board')}
                className={cn(
                  "flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all",
                  activeTab === 'board' ? "text-primary" : "text-gray-500 hover:text-white"
                )}
              >
                <Layout className="w-4 h-4" /> Board
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all",
                  activeTab === 'chat' ? "text-primary" : "text-gray-500 hover:text-white"
                )}
              >
                <MessageSquare className="w-4 h-4" /> Discussion
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={cn(
                  "flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all",
                  activeTab === 'settings' ? "text-primary" : "text-gray-500 hover:text-white"
                )}
              >
                <Settings className="w-4 h-4" /> Nodes
              </button>
           </div>
        </div>
      </div>

      {/* Main Board Content */}
      <div className="flex-grow overflow-y-auto no-scrollbar p-10">
         <AnimatePresence mode="wait">
            {activeTab === 'board' && (
              <motion.div 
                key="board"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                 <div className="flex justify-between items-center mb-12">
                   <div>
                      <h2 className="text-4xl font-bold tracking-tighter mb-2">Objective <span className="text-primary italic">Manifest.</span></h2>
                      <p className="text-gray-500 font-medium">Shared task synchronization across connected nodes.</p>
                   </div>
                   <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
                      <Sparkles className="w-4 h-4" /> AI Assisted Prioritization
                   </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex gap-4 mb-10">
                       <input 
                         value={newTaskText}
                         onChange={(e) => setNewTaskText(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && addTask()}
                         className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-lg font-medium outline-none focus:border-primary transition-all"
                         placeholder="Add new objective..."
                       />
                       <button 
                        onClick={addTask}
                        className="px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-2xl"
                       >
                         <Plus className="w-5 h-5 mx-auto" />
                       </button>
                    </div>

                    {tasks.length === 0 ? (
                       <div className="py-20 text-center border border-dashed border-white/5 rounded-[3rem]">
                          <Zap className="w-10 h-10 text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No active objectives initialized.</p>
                       </div>
                    ) : (
                      tasks.map(task => (
                        <div key={task.id} className="p-8 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all group">
                           <div className="flex items-center gap-6">
                              <button 
                                onClick={() => toggleTask(task.id)}
                                className={cn(
                                  "w-8 h-8 rounded-xl border flex items-center justify-center transition-all",
                                  task.completed ? "bg-primary border-primary text-white" : "border-white/20 hover:border-primary"
                                )}
                              >
                                {task.completed && <Zap className="w-4 h-4" />}
                              </button>
                              <span className={cn(
                                "text-xl font-bold tracking-tight transition-all",
                                task.completed ? "text-gray-600 line-through" : "text-white"
                              )}>
                                {task.text}
                              </span>
                           </div>
                           <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex -space-x-2">
                                {[1, 2].map(i => (
                                  <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-dark bg-white/10"></div>
                                ))}
                              </div>
                              <button className="text-gray-600 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
               <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center"
               >
                  <MessageSquare className="w-20 h-20 text-primary mb-8" />
                  <h3 className="text-3xl font-bold mb-4">Neural Discussion</h3>
                  <p className="text-gray-400 text-center max-w-md">The unified discussion board for cross-node communication is being initialized. Connect with teams from different clusters here.</p>
               </motion.div>
            )}

            {activeTab === 'settings' && (
               <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
               >
                  <h3 className="text-3xl font-bold mb-10">Connected Shards</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                     {connectedGroups.map(g => (
                       <div key={g.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center font-bold text-primary">{g.name[0]}</div>
                            <div>
                               <h4 className="font-bold text-lg">{g.name}</h4>
                               <p className="text-xs text-gray-500 uppercase tracking-widest">{g.category}</p>
                            </div>
                          </div>
                          <Shield className="w-5 h-5 text-gray-500" />
                       </div>
                     ))}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}

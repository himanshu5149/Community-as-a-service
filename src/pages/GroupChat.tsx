import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useChat, Message } from '../hooks/useChat';
import { useGroups } from '../hooks/useGroups';
import { useGroupRoles, UserRole } from '../hooks/useGroupRoles';
import { useGroupMembers } from '../hooks/useGroupMembers';
import { useGamification } from '../hooks/useGamification';
import { useChannels } from '../hooks/useChannels';
import { useTyping } from '../hooks/useTyping';
import { usePresence } from '../hooks/usePresence';
import { useAiAgents } from '../hooks/useAiAgents';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useModeration } from '../hooks/useModeration';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { 
  Send, 
  Bot, 
  Users, 
  CheckCircle2,
  X,
  Plus,
  ShieldAlert,
  Sparkles,
  Search,
  Settings,
  Trash2,
  Hash,
  Megaphone,
  Pin,
  PinOff,
  ChevronRight,
  ChevronDown,
  MessageSquare
} from 'lucide-react';

export default function GroupChat() {
  const { groupId, channelId } = useParams<{ groupId: string; channelId: string }>();
  const navigate = useNavigate();
  const { groups } = useGroups();
  const group = groups.find(g => g.id === groupId);
  
  const { channels, loading: channelsLoading } = useChannels(groupId || '');
  const activeChannel = channels.find(c => c.id === channelId) || channels[0];
  
  const { messages, loading, sendMessage, reactToMessage, deleteMessage, editMessage, togglePinMessage } = useChat(groupId || '', activeChannel?.id);
  const { loading: rolesLoading, joinGroup, isAdmin, isMember, updateRole } = useGroupRoles(groupId || '');
  const { members } = useGroupMembers(groupId || '');
  const { agents } = useAiAgents(groupId || '');
  const { addPoints } = useGamification();
  const { toast, hideToast, showToast } = useToast();
  const { moderateMessage } = useModeration();
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const statuses = usePresence(user?.uid);
  const { typingUsers, setTyping } = useTyping(activeChannel?.id || '', user?.uid, user?.displayName || 'Anonymous');

  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showMemberSidebar, setShowMemberSidebar] = useState(true);
  const [showPins, setShowPins] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  useEffect(() => {
    if (group?.name) {
      setNewName(group.name);
    }
  }, [group]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const moderation = await moderateMessage(inputText);
    if (!moderation.isSafe) {
      setModerationWarning(moderation.reason || "This signal violates community protocols.");
      return;
    }

    const textToChat = inputText;
    setInputText('');
    setTyping(false);
    await sendMessage(textToChat);
    if (user) addPoints(10);
  };

  const handleUpdateName = async () => {
    if (!isAdmin || !groupId || !newName.trim()) return;
    try {
      await updateDoc(doc(db, 'groups', groupId), { name: newName });
      setIsEditingGroup(false);
      setShowSettings(false);
      showToast("Node identity reconfigured successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `groups/${groupId}`);
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
    msg.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-20 h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-sans">
      {/* 1. Channel Sidebar (Left) */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div 
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            className="w-64 h-full bg-[#121212] border-r border-white/5 flex flex-col flex-shrink-0 z-40"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black italic shadow-lg"
                  style={{ backgroundColor: group?.accentColor || '#534ab7' }}
                >
                  {group?.name?.[0] || 'G'}
                </div>
                <h1 className="text-sm font-black tracking-tight truncate">{group?.name || 'Protocol Hub'}</h1>
              </div>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="text-gray-500 hover:text-white"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-6">
              <div>
                <div className="px-2 mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <span>Text Channels</span>
                </div>
                <div className="space-y-0.5">
                  {channelsLoading ? (
                    [1,2,3].map(i => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg mx-2"></div>)
                  ) : channels.map(ch => (
                    <Link 
                      key={ch.id}
                      to={`/groups/${groupId}/channels/${ch.id}`}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-bold text-sm",
                        channelId === ch.id 
                          ? "bg-white/10 text-white" 
                          : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                      )}
                    >
                      {ch.type === 'announcements' ? <Megaphone className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                      {ch.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#0d0d0d] border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'U'}&background=random&color=fff`} className="w-8 h-8 rounded-full" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0d0d0d] rounded-full"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-tight truncate max-w-[100px]">{user?.displayName}</span>
                  <span className="text-[8px] font-bold text-gray-600 uppercase">#{user?.uid.slice(0, 4)}</span>
                </div>
              </div>
              <button onClick={() => navigate('/settings')} className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-white/5">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Chat Context */}
      <div className="flex-grow flex flex-col min-w-0 bg-[#161616]">
        <div className="h-14 border-b border-white/5 bg-[#161616]/80 backdrop-blur-xl px-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            {!showSidebar && (
              <button onClick={() => setShowSidebar(true)} className="p-2 text-gray-500 hover:text-white mr-2">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <Hash className="w-5 h-5 text-gray-500" />
            <h1 className="font-black tracking-tight text-sm">{activeChannel?.name || 'general'}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowPins(!showPins)}
              className={cn("p-2 transition-colors", showPins ? "text-primary" : "text-gray-500 hover:text-white")}
            >
              <Pin className="w-5 h-5" />
            </button>
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full bg-[#0a0a0a] border-none rounded-md pl-9 pr-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-primary/50 outline-none"
              />
            </div>
            <button 
              onClick={() => setShowMemberSidebar(!showMemberSidebar)}
              className={cn("p-2 transition-colors", showMemberSidebar ? "text-primary" : "text-gray-500 hover:text-white")}
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar px-6 py-4 space-y-1 relative">
           {loading ? (
             <ChatSkeleton />
           ) : filteredMessages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                 <Hash className="w-10 h-10 text-gray-500" />
               </div>
               <h3 className="text-xl font-black italic">
                 {searchQuery ? "No signals matching query" : `Welcome to #${activeChannel?.name || 'general'}!`}
               </h3>
             </div>
           ) : (
             filteredMessages.map((msg) => (
               <MessageNode 
                 key={msg.id} 
                 message={msg} 
                 isMe={msg.userId === user?.uid} 
                 isAdmin={isAdmin}
                 onReact={reactToMessage}
                 onDelete={deleteMessage}
                 onEdit={editMessage}
                 onPin={togglePinMessage}
                 status={statuses[msg.userId]}
               />
             ))
           )}
           <div ref={messagesEndRef} />
        </div>

        <div className="px-4 pb-6 pt-2">
           {typingUsers.length > 0 && (
             <div className="px-4 py-1 flex items-center gap-2 mb-1">
               <div className="flex gap-1">
                 <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce"></span>
                 <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                 <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
               </div>
               <span className="text-[10px] font-black text-gray-500 italic">
                 {typingUsers.join(', ')} typing...
               </span>
             </div>
           )}
           <div className="bg-[#242424] rounded-xl flex items-center gap-3 p-3 focus-within:ring-1 ring-primary/30 transition-all">
             <button className="text-gray-500 hover:text-white p-1">
               <Plus className="w-5 h-5" />
             </button>
             <input 
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setTyping(e.target.value.length > 0);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Message #${activeChannel?.name || 'general'}`}
                className="flex-grow bg-transparent border-none outline-none text-sm font-medium h-10"
             />
             <button 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="bg-primary p-2.5 rounded-lg text-white shadow-lg disabled:opacity-50"
             >
               <Send className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>

      {/* 3. Member Sidebar (Right) */}
      <AnimatePresence>
        {showMemberSidebar && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 240 }}
            exit={{ width: 0 }}
            className="h-full bg-[#121212] border-l border-white/5 flex flex-col flex-shrink-0 z-30 overflow-hidden"
          >
            <div className="p-4 overflow-y-auto no-scrollbar space-y-6">
               <div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 block px-2">Online — {members.filter(m => statuses[m.userId] === 'online').length}</span>
                 <div className="space-y-1">
                   {members.filter(m => statuses[m.userId] === 'online').map(m => (
                     <MemberItem key={m.userId} member={m} status="online" />
                   ))}
                   {agents.map(a => (
                     <MemberItem key={a.id} member={{ 
                        userId: a.id, 
                        userName: a.name, 
                        role: 'Ai' as any, 
                        joinedAt: null 
                      }} status="online" isAI />
                   ))}
                 </div>
               </div>

               <div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 block px-2">Offline</span>
                 <div className="space-y-1">
                   {members.filter(m => !statuses[m.userId] || statuses[m.userId] === 'offline').map(m => (
                     <MemberItem key={m.userId} member={m} status="offline" />
                   ))}
                 </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {moderationWarning && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-red-950/20 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1a0a0a] border border-red-500/30 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4 italic">Signal <span className="text-red-500">Blocked.</span></h3>
              <p className="text-gray-400 mb-8">{moderationWarning}</p>
              <button onClick={() => setModerationWarning(null)} className="w-full bg-red-500 py-4 rounded-xl font-black uppercase text-xs">Dismiss</button>
            </motion.div>
          </div>
        )}

        {isEditingGroup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-xl">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#121212] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg">
              <h3 className="text-3xl font-bold mb-8 italic">Node <span className="text-primary">Identity.</span></h3>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl mb-6 outline-none focus:border-primary transition-all font-bold" />
              <div className="flex gap-4">
                <button onClick={() => setIsEditingGroup(false)} className="flex-grow bg-white/5 py-4 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleUpdateName} className="flex-grow bg-primary py-4 rounded-2xl font-black uppercase text-xs">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}

        {showPins && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-bg-dark/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#121212] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold italic">Pinned <span className="text-primary not-italic">Signals.</span></h3>
                <button onClick={() => setShowPins(false)}><X /></button>
              </div>
              <div className="overflow-y-auto space-y-4 no-scrollbar">
                {messages.filter(m => m.isPinned).length === 0 ? <p className="text-center text-gray-500 py-10">No signals pinned in this channel.</p> :
                  messages.filter(m => m.isPinned).map(msg => (
                    <div key={msg.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 relative group">
                      <p className="text-sm text-gray-300 mb-2">{msg.text}</p>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase">
                        <span>{msg.userName}</span>
                        {isAdmin && <button onClick={() => togglePinMessage(msg.id, false)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Unpin</button>}
                      </div>
                    </div>
                  ))
                }
              </div>
            </motion.div>
          </div>
        )}

        {!isMember && !rolesLoading && user && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-2xl px-6">
            <div className="bg-[#121212]/90 backdrop-blur-3xl border border-primary/30 p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
              <div>
                <h3 className="text-xl font-bold tracking-tight italic">Access <span className="text-primary">Restricted.</span></h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Join this cluster to synchronize signals</p>
              </div>
              <button onClick={() => joinGroup(user?.displayName || 'Anonymous')} className="bg-primary text-white px-8 py-4 rounded-xl font-black uppercase text-[10px]">Join Cluster</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </AnimatePresence>
    </div>
  );
}

// Sub-components
function ChatSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-white/5"></div>
          <div className="flex-grow space-y-2">
            <div className="h-4 w-32 bg-white/5 rounded"></div>
            <div className="h-4 w-full bg-white/5 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MemberItem({ member, status, isAI = false }: { member: any, status: string, isAI?: boolean, key?: any }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer group">
      <div className="relative">
        <img src={`https://ui-avatars.com/api/?name=${member.userName}&background=random&color=fff`} className="w-8 h-8 rounded-full" />
        <div className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#121212]", status === 'online' ? 'bg-green-500' : 'bg-gray-600')}></div>
      </div>
      <div className="truncate flex flex-col">
        <span className="text-xs font-bold truncate text-gray-300">{member.userName}</span>
        {isAI && <span className="text-[6px] font-black uppercase text-primary">AI Node</span>}
      </div>
    </div>
  );
}

function MessageNode({ message, isMe, isAdmin, onReact, onDelete, onPin, status }: any) {
  return (
    <div className="group/msg hover:bg-white/[0.02] -mx-6 px-6 py-2 transition-all relative flex items-start gap-4">
      <img src={message.userAvatar || `https://ui-avatars.com/api/?name=${message.userName}&background=random&color=fff`} className="w-10 h-10 rounded-full" />
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-black text-white/90">{message.userName}</span>
          <span className="text-[8px] text-gray-700 font-bold uppercase">{message.createdAt?.toDate ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</span>
          {message.isPinned && <Pin className="w-3 h-3 text-primary" />}
        </div>
        <p className="text-sm text-gray-400 leading-relaxed font-medium">{message.text}</p>
      </div>
      
      <div className="absolute right-6 top-2 opacity-0 group-hover/msg:opacity-100 transition-all flex items-center gap-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-1">
        {isAdmin && (
          <button onClick={() => onPin(message.id, !message.isPinned)} className={cn("p-1.5 rounded", message.isPinned ? "text-primary" : "text-gray-500")}>
            <Pin className="w-4 h-4" />
          </button>
        )}
        {isMe && (
          <button onClick={() => onDelete(message.id)} className="p-1.5 text-gray-500 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Missing common components could be imported or defined here (Toast, etc)
// For now assuming they are available or simple enough to inline if needed.
// I see useToast hook, assuming Toast component is reachable.
function Toast({ message, type, onClose }: any) {
  return (
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-6 right-6 z-[200]">
      <div className={cn("px-6 py-3 rounded-2xl shadow-full border flex items-center gap-3", type === 'error' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-primary/10 border-primary/20 text-primary")}>
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-widest">{message}</span>
        <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
      </div>
    </motion.div>
  );
}

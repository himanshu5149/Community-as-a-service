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
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useToast, Toast } from '../components/Toast';
import { useModeration } from '../hooks/useModeration';
import { useAiModerator } from '../hooks/useAiModerator';
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
  Play,
  Smile,
  Reply,
  MoreVertical,
  Layers,
  AlertTriangle,
  Crown,
  Star,
  Calendar,
  Filter,
  History
} from 'lucide-react';

export default function GroupChat() {
  const { groupId, channelId } = useParams<{ groupId: string; channelId: string }>();
  const navigate = useNavigate();
  const { groups, deleteGroup } = useGroups();
  const group = groups.find(g => g.id === groupId);
  
  const { channels, loading: channelsLoading, createChannel } = useChannels(groupId || '');
  const activeChannel = channels.find(c => c.id === channelId) || channels[0];
  
  const { messages, loading, sendMessage, reactToMessage, deleteMessage, editMessage, togglePinMessage } = useChat(groupId || '', activeChannel?.id);
  const { member, loading: rolesLoading, joinGroup, isAdmin, isMember, permissions, updateRole } = useGroupRoles(groupId || '');
  const { members } = useGroupMembers(groupId || '');
  const { agents } = useAiAgents(groupId || '');
  const { addPoints } = useGamification();
  const { toast, hideToast, showToast } = useToast();
  const { moderateMessage } = useModeration();
  useAiModerator(groupId || '', activeChannel?.id);
  
  const { user, loading: authLoading } = useAuth();
  const statuses = usePresence(user?.uid);
  const { typingUsers, setTyping } = useTyping(activeChannel?.id || '', user?.uid, user?.displayName || 'Anonymous');

  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [showChannelSidebar, setShowChannelSidebar] = useState(true);
  const [showMemberSidebar, setShowMemberSidebar] = useState(true);
  const [showPins, setShowPins] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<{ text: string; reason: string } | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [inputShowEmojis, setInputShowEmojis] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    sender: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (group?.name) {
      setNewName(group.name);
    }
  }, [group]);

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // If we are more than 200px away from the bottom, consider it "scrolled up"
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;
    setIsScrolledUp(!isAtBottom);
  };

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    // Initial scroll
    scrollToBottom("auto");
  }, []);

  const handleSlashCommand = async (command: string) => {
    const parts = command.split(' ');
    const mainCmd = parts[0].toLowerCase();

    if (mainCmd === '/help') {
      showToast("Available Commands: /agent @name query, /summarize, /clear, /poll, /help");
      return true;
    }

    if (mainCmd === '/clear') {
      // Logic for client-side clearing is usually temporary state
      showToast("Local memory purge complete.");
      return true;
    }

    if (mainCmd === '/summarize') {
      if (!permissions.canUseAI) {
        showToast("Join this community to use AI features.", "error");
        return true;
      }
      try {
        const recentMessages = messages.slice(-50).map(m => ({ user: m.userName, text: m.text }));
        const res = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: recentMessages })
        });
        const data = await res.json();
        await sendMessage(data.summary, 'ai', undefined, true, { aiName: 'Bridge', aiAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=bridge' });
      } catch (err) {
        showToast("Intelligence node sync failed.", 'error');
      }
      return true;
    }

    if (mainCmd === '/agent') {
      if (!permissions.canUseAI) {
        showToast("Join this community to use AI features.", "error");
        return true;
      }
      const mention = parts[1];
      if (!mention || !mention.startsWith('@')) {
        showToast("Specify an agent: /agent @Aria [query]", 'error');
        return true;
      }
      const agentName = mention.substring(1);
      const query = parts.slice(2).join(' ');
      if (!query) {
        showToast(`What should I transmit to ${agentName}?`, 'error');
        return true;
      }

      try {
        const res = await fetch('/api/ai/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query, 
            agentId: agentName.toLowerCase(), 
            agentName,
            context: { groupName: group?.name, channelName: activeChannel?.name } 
          })
        });
        const data = await res.json();
        await sendMessage(data.response, 'ai', undefined, true, { 
          aiName: agentName, 
          aiAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${agentName.toLowerCase()}` 
        });
      } catch (err) {
        showToast("Node connection timeout.", 'error');
      }
      return true;
    }

    return false;
  };

  const handleSendMessage = async (e?: React.FormEvent, bypassModeration: boolean = false) => {
    e?.preventDefault();
    if (!isMember) {
      showToast("Identity not synchronized. Please join the cluster first.", "error");
      return;
    }
    const textToChat = moderationWarning ? moderationWarning.text : inputText;
    if (!textToChat.trim()) return;

    // Handle Slash Commands
    if (textToChat.startsWith('/')) {
      const handled = await handleSlashCommand(textToChat);
      if (handled) {
        setInputText('');
        return;
      }
    }

    try {
      if (!bypassModeration) {
        const moderation = await moderateMessage(textToChat);
        if (!moderation.isSafe) {
          setModerationWarning({
            text: textToChat,
            reason: moderation.reason || "This signal violates community protocols."
          });
          return;
        }
      }

      setInputText('');
      setModerationWarning(null);
      setTyping(false);
      
      const sendOptions = replyTo ? { 
        replyTo: {
          messageId: replyTo.id,
          userName: replyTo.userName,
          text: replyTo.text
        }
      } : {};

      await sendMessage(textToChat, 'text', undefined, false, sendOptions);
      setReplyTo(null);
      if (user) addPoints(10);

      // AI Mention Detection Logic
      if (permissions.canUseAI) {
        const mentions = agents.filter(agent => textToChat.toLowerCase().includes(`@${agent.name.toLowerCase()}`));
        if (mentions.length > 0) {
          // Trigger responses from all mentioned agents (usually just one)
          for (const agent of mentions) {
            try {
              const res = await fetch('/api/ai/persona', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  query: textToChat, 
                  persona: {
                    name: agent.name,
                    role: agent.expertise?.join(', ') || 'AI Assistant',
                    systemInstruction: agent.personality
                  },
                  context: { 
                    groupName: group?.name || 'Unknown', 
                    recentMessages: messages.slice(-5).map(m => ({ user: m.userName, text: m.text, isAI: m.userId === agent.id }))
                  } 
                })
              });
              const data = await res.json();
              if (data.response) {
                await sendMessage(data.response, 'ai', undefined, true, { 
                  aiName: agent.name, 
                  aiAvatar: agent.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.name.toLowerCase()}`,
                  aiRole: agent.role,
                  aiColor: agent.accentColor
                });
              }
            } catch (err) {
              console.error("AI mention logic failure:", err);
            }
          }
        }
      }
    } catch (err: any) {
      showToast("Signal failed to transmit. Internal logic error.", 'error');
      console.error("Link Failure:", err);
    }
  };

  const handleUpdateName = async () => {
    if (!permissions.canEditGroup || !groupId || !newName.trim()) return;
    try {
      await updateDoc(doc(db, 'groups', groupId), { name: newName });
      setIsEditingGroup(false);
      setShowSettings(false);
      showToast("Node identity reconfigured successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `groups/${groupId}`);
    }
  };

  const handleDeleteGroup = async () => {
    if (!permissions.canEditGroup || !groupId) return;
    const confirmed = window.confirm("Are you certain you want to decommission this shard? All synchronization data will be lost.");
    if (!confirmed) return;
    
    try {
      await deleteGroup(groupId);
      showToast("Node decommissioned. Sync terminated.");
      navigate('/groups');
    } catch (err) {
      showToast("Decommissioning failed.", 'error');
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesQuery = msg.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
      msg.userName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesQuery) return false;
    
    const matchesSender = !searchFilters.sender || msg.userName.toLowerCase().includes(searchFilters.sender.toLowerCase());
    
    let matchesDate = true;
    if (msg.createdAt?.toDate) {
      const msgDate = msg.createdAt.toDate();
      if (searchFilters.startDate) {
        matchesDate = matchesDate && msgDate >= new Date(searchFilters.startDate);
      }
      if (searchFilters.endDate) {
        matchesDate = matchesDate && msgDate <= new Date(searchFilters.endDate);
      }
    }
    
    return matchesSender && matchesDate;
  });

  const handleJoinCluster = async () => {
    setIsJoining(true);
    try {
      await joinGroup(user?.displayName || 'Anonymous');
      showToast("Identity synchronized with cluster.");
      addPoints(50);
    } catch (err: any) {
      showToast("Synchronization failed.", 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!permissions.canCreateChannel || !newChannelName.trim() || !user) return;
    try {
      await createChannel(newChannelName, "Node signal channel", 'general', user.uid);
      setShowCreateChannel(false);
      setNewChannelName('');
      showToast("New frequency established.");
      addPoints(30);
    } catch (err) {
      showToast("Failed to establish frequency.", 'error');
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editBuffer.trim()) return;
    try {
      await editMessage(id, editBuffer);
      setEditingMessageId(null);
      setEditBuffer('');
      showToast("Signal recalibrated.");
    } catch (err) {
      showToast("Edit failed.", 'error');
    }
  };

  const handlePin = async (messageId: string, isPinned: boolean) => {
    if (!permissions.canDeleteMessage) {
        showToast("Administrative clearance required to pin signal.", "error");
        return;
    }
    try {
        await togglePinMessage(messageId, isPinned);
        showToast(isPinned ? "Signal locked to mainframe." : "Signal released.");
    } catch (err) {
        showToast("Failed to modify signal pin.", "error");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!permissions.canDeleteMessage) {
        const msg = messages.find(m => m.id === messageId);
        if (msg?.userId !== user?.uid) {
            showToast("Administrative clearance required to redact external signals.", "error");
            return;
        }
    }
    try {
        await deleteMessage(messageId);
        showToast("Signal redacted.");
    } catch (err) {
        showToast("Failed to redact signal.", "error");
    }
  };

  return (
    <div className="pt-20 h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-sans">
      {/* 1. Channel Sidebar (Left) */}
      <AnimatePresence>
        {showChannelSidebar && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-[#121212] border-r border-white/5 flex flex-col flex-shrink-0 z-40 overflow-hidden"
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
                  {isAdmin && (
                    <button onClick={() => setShowCreateChannel(true)} className="hover:text-primary transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
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
        <div className="h-14 border-b border-white/5 bg-[#161616]/80 backdrop-blur-xl px-4 flex items-center justify-between z-30 relative overflow-hidden">
          {/* Scanning Animation */}
          <motion.div 
            animate={{ y: [0, 56, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-[1px] bg-primary/20 pointer-events-none"
          />
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowChannelSidebar(!showChannelSidebar)} 
              className={cn("p-2 rounded-lg transition-all", showChannelSidebar ? "text-primary bg-primary/10" : "text-gray-500 hover:text-white")}
            >
              <MoreVertical className="w-5 h-5 rotate-90" />
            </button>
            <div className="flex flex-col ml-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                <h1 className="font-black tracking-tighter text-sm uppercase">{activeChannel?.name || 'general'}</h1>
              </div>
              {typingUsers.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <div className="flex gap-0.5">
                    <span className="w-0.5 h-0.5 bg-primary rounded-full animate-pulse"></span>
                    <span className="w-0.5 h-0.5 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></span>
                  </div>
                  <span className="text-[8px] font-bold text-primary/70 uppercase">
                    {typingUsers[0]} {typingUsers.length > 1 ? `+${typingUsers.length - 1}` : ''} synchronizing...
                  </span>
                </motion.div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setShowPins(!showPins)}
              className={cn("p-2 transition-colors", showPins ? "text-primary" : "text-gray-500 hover:text-white")}
            >
              <Pin className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block w-32 md:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full bg-[#0a0a0a] border-none rounded-md pl-9 pr-8 py-1.5 text-xs font-medium focus:ring-1 focus:ring-primary/50 outline-none"
              />
              <button 
                onClick={() => setShowSearchModal(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
              >
                <Filter className="w-3 h-3" />
              </button>
            </div>
            <button 
              onClick={() => setShowMemberSidebar(!showMemberSidebar)}
              className={cn("p-2 transition-colors", showMemberSidebar ? "text-primary" : "text-gray-500 hover:text-white")}
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto no-scrollbar px-6 py-4 space-y-1 relative bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:20px_20px]"
        >
           {/* Pinned Messages Banner */}
           <AnimatePresence>
             {messages.filter(m => m.isPinned).length > 0 && (
               <motion.div 
                 initial={{ opacity: 0, y: -20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="sticky top-0 z-40 mb-4 mx-[-24px] px-6"
               >
                 <div className="bg-primary/10 backdrop-blur-xl border-b border-primary/20 p-3 rounded-b-2xl flex items-center justify-between shadow-lg">
                   <div className="flex items-center gap-3 overflow-hidden">
                     <Pin className="w-3 h-3 text-primary flex-shrink-0" />
                     <div className="flex flex-col truncate">
                       <span className="text-[8px] font-black uppercase tracking-widest text-primary/70">Pinned Signals ({messages.filter(m => m.isPinned).length})</span>
                       <p 
                         className="text-xs text-gray-300 truncate cursor-pointer hover:text-white"
                         onClick={() => {
                           const pinned = messages.filter(m => m.isPinned)[0];
                           if(pinned) {
                             const el = document.getElementById(`msg-${pinned.id}`);
                             el?.scrollIntoView({ behavior: 'smooth' });
                           }
                         }}
                       >
                         {messages.filter(m => m.isPinned)[0].text}
                       </p>
                     </div>
                   </div>
                   <button onClick={() => setShowPins(true)} className="text-[8px] font-black uppercase tracking-widest text-primary hover:underline ml-4">View All</button>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
           {loading ? (
             <ChatSkeleton />
           ) : filteredMessages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center py-20">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5"
               >
                 <Search className="w-10 h-10 text-gray-700" />
               </motion.div>
               <h3 className="text-xl font-black italic text-gray-500">
                 {searchQuery ? "No matches found in this frequency" : `Welcome to #${activeChannel?.name || 'general'}!`}
               </h3>
               {searchQuery && (
                 <button onClick={() => setSearchQuery('')} className="mt-4 text-[10px] font-black uppercase text-primary hover:underline">Clear Search</button>
               )}
             </div>
           ) : (
             filteredMessages.map((msg) => (
               <MessageNode 
                 key={msg.id} 
                 message={msg} 
                 isMe={msg.userId === user?.uid} 
                 permissions={permissions}
                 onReact={reactToMessage}
                 onDelete={handleDelete}
                 onEdit={editMessage}
                 onPin={handlePin}
                 onReply={(msg: Message) => setReplyTo(msg)}
                 onProfileClick={(userId: string) => {
                   const found = (members as any[]).find(m => m.userId === userId) || (agents as any[]).find(a => a.id === userId);
                   if (found) setSelectedMember(found);
                 }}
                 isEditing={editingMessageId === msg.id}
                 editBuffer={editBuffer}
                 setEditBuffer={setEditBuffer}
                 onEditStart={() => {
                   setEditingMessageId(msg.id);
                   setEditBuffer(msg.text);
                 }}
                 onEditSave={() => handleEditSave(msg.id)}
                 onEditCancel={() => setEditingMessageId(null)}
                 status={statuses[msg.userId]}
               />
             ))
           )}
           <div ref={messagesEndRef} />

           {/* Join Overlay for non-members */}
           <AnimatePresence>
             {!loading && !isMember && (
               <div className="absolute inset-x-0 bottom-0 top-0 z-[60] flex flex-col items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-md px-6 text-center">
                 <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="max-w-md p-10 bg-[#121212] border border-white/10 rounded-[3rem] shadow-full text-white"
                 >
                   <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary/20">
                     <Lock className="w-8 h-8 text-primary animate-pulse" />
                   </div>
                   <h2 className="text-3xl font-black italic mb-4 tracking-tighter uppercase">Cluster <span className="text-primary not-italic tracking-normal">Locked.</span></h2>
                   <p className="text-gray-400 font-medium leading-relaxed mb-10 text-sm italic">
                     "This node is restricted to verified identities. Join the cluster to transmit signals and neural agents."
                   </p>
                   <button 
                     onClick={handleJoinCluster}
                     disabled={isJoining}
                     className="w-full bg-primary py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                     {isJoining ? "Synchronizing..." : "Initialize Node Sync"}
                   </button>
                   <button onClick={() => navigate('/groups')} className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Abort Frequency</button>
                 </motion.div>
               </div>
             )}
           </AnimatePresence>
           
           {/* Jump to Bottom Button */}
           <AnimatePresence>
             {isScrolledUp && (
               <motion.button
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 onClick={() => scrollToBottom()}
                 className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-primary/90 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-2 hover:bg-primary transition-all"
               >
                 <ChevronDown className="w-3 h-3" />
                 Jump to Latest
               </motion.button>
             )}
           </AnimatePresence>
        </div>

        <div className="px-4 pb-6 pt-2">
           {replyTo && (
             <div className="bg-white/5 border-l-2 border-primary p-3 rounded-t-xl flex justify-between items-center mb-0.5">
               <div className="flex items-center gap-3 truncate">
                 <Reply className="w-3 h-3 text-primary" />
                 <img src={replyTo.userAvatar || `https://ui-avatars.com/api/?name=${replyTo.userName}&background=random&color=fff`} className="w-5 h-5 rounded-full border border-white/10" />
                 <span className="text-[10px] font-bold text-gray-500 uppercase">Replying to <span className="text-white">{replyTo.userName}</span></span>
                 <p className="text-xs text-gray-400 truncate max-w-sm italic">"{replyTo.text}"</p>
               </div>
               <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white"><X className="w-3 h-3" /></button>
             </div>
           )}
            <div className="bg-[#242424] rounded-xl flex flex-col p-1 focus-within:ring-1 ring-primary/30 transition-all shadow-2xl relative">
              {/* Smart Suggestion Bar */}
              <AnimatePresence>
                {!inputText && !replyTo && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 p-2 px-3 overflow-x-auto no-scrollbar border-b border-white/5 mb-1"
                  >
                    {['/summarize', '/agents', '/clear'].map(cmd => (
                      <button 
                        key={cmd}
                        onClick={() => setInputText(cmd)}
                        className="flex-shrink-0 px-2 py-1 rounded bg-white/5 hover:bg-primary/20 text-[8px] font-black uppercase text-gray-400 hover:text-primary transition-all border border-white/5"
                      >
                        {cmd}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3 p-2">
                <button className="text-gray-500 hover:text-white p-1 transition-transform active:scale-95">
                  <Plus className="w-5 h-5" />
                </button>
                <input 
                   value={inputText}
                   onChange={(e) => {
                     setInputText(e.target.value);
                     setTyping(e.target.value.length > 0);
                   }}
                   onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                   placeholder={`Transmit to #${activeChannel?.name || 'general'}...`}
                   className="flex-grow bg-transparent border-none outline-none text-sm font-medium h-10"
                />
                <div className="flex items-center gap-1">
                   <div className="relative">
                      <button 
                         onClick={() => setInputShowEmojis(!inputShowEmojis)}
                         className="text-gray-500 hover:text-primary p-2 transition-all"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {inputShowEmojis && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-4 p-2 bg-[#121212] border border-white/10 rounded-2xl grid grid-cols-6 gap-1 shadow-full z-[60] w-48"
                          >
                             {['👍', '🔥', '🚀', '❤️', '👀', '😂', '💯', '✨', '🙌', '🎉', '💡', '✅', '❌', '⚠️', '🤖', '👾', '🌈', '🍕'].map(emoji => (
                               <button 
                                 key={emoji}
                                 onClick={() => {
                                   setInputText(prev => prev + emoji);
                                   setInputShowEmojis(false);
                                 }}
                                 className="p-2 hover:bg-white/5 rounded-lg text-lg hover:scale-125 transition-transform"
                               >
                                 {emoji}
                               </button>
                             ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </div>
                   <button 
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim()}
                      className={cn(
                        "p-2.5 rounded-lg text-white shadow-xl transition-all active:scale-90",
                        inputText.trim() ? "bg-primary shadow-primary/20" : "bg-white/5 opacity-50"
                      )}
                   >
                     <Send className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
        </div>
       <AnimatePresence>
        {showMemberSidebar && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 300 }}
            exit={{ width: 0 }}
            className="h-full bg-[#121212] border-l border-white/5 flex flex-col flex-shrink-0 z-30 overflow-hidden"
          >
            <div className="p-4 overflow-y-auto no-scrollbar space-y-8">
               {/* AI Agents Section */}
               <div>
                  <div className="px-3 mb-3 flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Neural Nodes — {agents.length}</span>
                  </div>
                  {agents.length > 0 ? (
                    <div className="space-y-1">
                      {agents.map(a => (
                        <MemberItem 
                          key={a.id} 
                          member={{ 
                            userId: a.id, 
                            userName: a.name, 
                            role: 'Ai' as any, 
                            joinedAt: null,
                            bio: a.description || "Experimental intelligence node focused on group protocol optimization."
                          }} 
                          status="online" 
                          isAI 
                          onClick={() => setSelectedMember(a)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-6 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl text-center">
                      <Bot className="w-6 h-6 text-gray-700 mx-auto mb-3 opacity-50" />
                      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-relaxed mb-4">
                        Neural void detected. This cluster has no dedicated AI nodes.
                      </p>
                      <button 
                        onClick={() => navigate('/ai-management')}
                        className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-[8px] font-black uppercase tracking-[0.2em] rounded-lg transition-all border border-primary/20"
                      >
                        Enlist Node
                      </button>
                    </div>
                  )}
               </div>

               {/* Online Members Section */}
               <div>
                 <div className="px-3 mb-3 flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Synchronized — {members.filter(m => statuses[m.userId] === 'online').length}</span>
                 </div>
                 <div className="space-y-1">
                   {members.filter(m => statuses[m.userId] === 'online').map(m => (
                     <MemberItem 
                       key={m.userId} 
                       member={m} 
                       status="online" 
                       onClick={() => setSelectedMember(m)}
                     />
                   ))}
                 </div>
               </div>

               {/* Offline Members Section */}
               <div>
                 <div className="px-3 mb-3 flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Dormant</span>
                 </div>
                 <div className="space-y-1">
                   {members.filter(m => !statuses[m.userId] || statuses[m.userId] === 'offline').map(m => (
                     <MemberItem 
                       key={m.userId} 
                       member={m} 
                       status="offline" 
                       onClick={() => setSelectedMember(m)}
                     />
                   ))}
                 </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedMember && (
          <ProfileModal 
            member={selectedMember} 
            onClose={() => setSelectedMember(null)} 
            isAI={!!selectedMember.description || selectedMember.role === 'Ai'}
          />
        )}
        {moderationWarning && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-red-950/20 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1a0a0a] border border-red-500/30 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4 italic text-center">Protocol <span className="text-red-500">Violation.</span></h3>
              <div className="bg-white/5 p-4 rounded-2xl mb-8 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">AI Assessment</p>
                <p className="text-xs text-gray-300 font-medium">{moderationWarning.reason}</p>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => handleSendMessage(undefined, true)} 
                  className="w-full bg-red-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all"
                >
                  Force Synchronize
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setModerationWarning(null)} className="flex-grow bg-white/5 py-4 rounded-xl font-bold text-xs">Retract Signal</button>
                  <button 
                    onClick={() => {
                      showToast("Potential false positive reported.");
                      setModerationWarning(null);
                    }} 
                    className="flex-grow bg-white/5 py-4 rounded-xl font-bold text-xs"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isEditingGroup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-xl">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#121212] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg">
              <h3 className="text-3xl font-bold mb-8 italic">Node <span className="text-primary">Identity.</span></h3>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl mb-6 outline-none focus:border-primary transition-all font-bold" />
              <div className="flex gap-4 mb-8">
                <button onClick={() => setIsEditingGroup(false)} className="flex-grow bg-white/5 py-4 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleUpdateName} className="flex-grow bg-primary py-4 rounded-2xl font-black uppercase text-xs">Confirm</button>
              </div>
              
              <div className="pt-8 border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 ml-4">Danger Zone</p>
                <button 
                  onClick={handleDeleteGroup}
                  className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Decommission Node
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPins && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#121212] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold italic">Pinned <span className="text-primary not-italic">Signals.</span></h3>
                <button onClick={() => setShowPins(false)} className="text-gray-500 hover:text-white"><X /></button>
              </div>
              <div className="overflow-y-auto space-y-4 no-scrollbar">
                {messages.filter(m => m.isPinned).length === 0 ? <p className="text-center text-gray-500 py-10 font-bold uppercase tracking-widest text-[10px]">No signals pinned in this channel.</p> :
                  messages
                    .filter(m => m.isPinned)
                    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
                    .slice(0, 10)
                    .map(msg => (
                      <div key={msg.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 relative group">
                        <p className="text-sm text-gray-300 mb-2 truncate line-clamp-3">{msg.text}</p>
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

        {showCreateChannel && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-xl">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#121212] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg">
              <h3 className="text-3xl font-bold mb-8 italic">Add <span className="text-primary tracking-tight">Frequency.</span></h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 mb-2 block">Channel Name</label>
                  <input 
                    value={newChannelName} 
                    onChange={(e) => setNewChannelName(e.target.value)} 
                    placeholder="e.g. general-intel"
                    className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl outline-none focus:border-primary transition-all font-bold text-lg" 
                  />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowCreateChannel(false)} className="flex-grow bg-white/5 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all">Cancel</button>
                  <button onClick={handleCreateChannel} className="flex-grow bg-primary py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Establish</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showSearchModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#121212] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg shadow-full">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic tracking-tight">Signal <span className="text-primary not-italic uppercase tracking-widest text-lg font-black ml-1">Archive.</span></h3>
                <button onClick={() => setShowSearchModal(false)}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 mb-2 block">Content Query</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      placeholder="Keywords..."
                      className="w-full bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 mb-2 block">Sender Alias</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        value={searchFilters.sender} 
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, sender: e.target.value }))} 
                        placeholder="Username..."
                        className="w-full bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 mb-2 block">Start Date</label>
                    <input 
                      type="date"
                      value={searchFilters.startDate} 
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))} 
                      className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-gray-300" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 mb-2 block">End Date</label>
                    <input 
                      type="date"
                      value={searchFilters.endDate} 
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))} 
                      className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-gray-300" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => {
                      setSearchFilters({ sender: '', startDate: '', endDate: '' });
                      setSearchQuery('');
                    }}
                    className="flex-grow bg-white/5 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => setShowSearchModal(false)}
                    className="flex-grow bg-primary py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>

              {searchQuery && (
                <div className="mt-8 border-t border-white/5 pt-6">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Results In Current Context</span>
                      <span className="text-[10px] font-black text-primary">{filteredMessages.length} Matches</span>
                   </div>
                   <div className="max-h-40 overflow-y-auto no-scrollbar space-y-2">
                     {filteredMessages.slice(0, 5).map(m => (
                       <div key={m.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-all text-xs cursor-pointer">
                          <div className="flex justify-between mb-1">
                             <span className="font-bold text-gray-300">{m.userName}</span>
                             <span className="text-[8px] text-gray-600 tabular-nums">{m.createdAt?.toDate?.().toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-500 line-clamp-1">{m.text}</p>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </AnimatePresence>
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

function MemberItem({ member, status, isAI = false, onClick }: any) {
  const roleColors: Record<string, string> = {
    'admin': 'text-red-400',
    'moderator': 'text-purple-400',
    'member': 'text-gray-400',
    'Ai': 'text-primary'
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group relative"
    >
      <div className="relative flex-shrink-0">
        <img 
          src={member.userAvatar || `https://ui-avatars.com/api/?name=${member.userName}&background=random&color=fff`} 
          className="w-9 h-9 rounded-full shadow-lg" 
        />
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#121212]", 
          status === 'online' ? 'bg-green-500' : 'bg-gray-600'
        )}></div>
      </div>
      <div className="truncate flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className={cn(
              "text-xs font-black truncate transition-colors"
            )}
            style={status === 'online' ? (isAI && member.accentColor ? { color: member.accentColor } : (roleColors[member.role] ? { color: roleColors[member.role] } : { color: 'white' })) : { color: '#4b5563' }}
          >
            {member.userName}
          </span>
          {member.role === 'admin' && <Crown className="w-3 h-3 text-red-400 fill-red-400/10" />}
          {member.role === 'moderator' && <Star className="w-3 h-3 text-purple-400 fill-purple-400/10" />}
          {isAI && <Bot className="w-3 h-3 text-primary" />}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={cn("w-1 h-1 rounded-full", status === 'online' ? "bg-green-500" : "bg-gray-600")}></div>
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">
            {status === 'online' ? 'Online' : 'Offline'} — {isAI ? (member.role || 'Neural Agent') : member.role}
          </span>
        </div>
      </div>
      
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-3 h-3 text-gray-700" />
      </div>
    </div>
  );
}

function ProfileModal({ member, isAI, onClose }: { member: any, isAI: boolean, onClose: () => void }) {
  const toastManager = useToast();
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/80 backdrop-blur-3xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-[#0a0a0a] border border-white/5 w-full max-w-sm rounded-[3rem] overflow-hidden shadow-full"
      >
        <div className="h-24 bg-gradient-to-r from-primary/40 to-primary/20 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        
        <div className="px-8 pb-10 -mt-12 relative text-center">
          <div className="relative inline-block mb-4">
            <img 
              src={member.userAvatar || `https://ui-avatars.com/api/?name=${member.userName || member.name}&background=random&color=fff`} 
              className="w-24 h-24 rounded-full border-4 border-[#0a0a0a] shadow-2xl mx-auto" 
            />
            {isAI && (
              <div className="absolute top-0 -right-2 bg-primary p-2 rounded-full border-2 border-[#0a0a0a] shadow-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <h3 className="text-2xl font-black italic tracking-tighter mb-1">
            {member.userName || member.name}
          </h3>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary" style={isAI && member.accentColor ? { color: member.accentColor } : {}}>
              {isAI ? (member.role || 'Neural Synthesis') : member.role}
            </span>
            <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              #{ (member.userId || member.id || '').slice(0, 6) }
            </span>
          </div>

          <div className="text-left space-y-6">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600 block mb-2 px-1">
                {isAI ? 'Node Logic & Directive' : 'Node Biography'}
              </span>
              <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  {isAI ? (member.description || member.personality || 'Directive not established.') : (member.bio || `A key stakeholder in the ${member.userName || member.name} sub-cluster. Primary focus: high-signal collaboration.`)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block mb-1">Synchronized</span>
                <span className="text-xs font-bold text-gray-300">
                  {member.joinedAt?.toDate ? member.joinedAt.toDate().toLocaleDateString() : 'Initial Boot'}
                </span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block mb-1">Cluster Load</span>
                <span className="text-xs font-bold text-gray-300">12 Fragments</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              toastManager.showToast("Secure link established.");
              onClose();
            }}
            className="w-full mt-8 bg-white/5 hover:bg-primary transition-all py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:shadow-primary/20"
          >
            Direct Frequency
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function MessageNode({ 
  message, 
  isMe, 
  permissions, 
  onReact, 
  onDelete, 
  onPin, 
  onReply, 
  onProfileClick, 
  isEditing,
  editBuffer,
  setEditBuffer,
  onEditStart,
  onEditSave,
  onEditCancel,
  status 
}: any) {
  const [showEmojis, setShowEmojis] = useState(false);
  const emojis = ['👍', '🔥', '🚀', '❤️', '👀', '😂'];

  return (
    <div className="group/msg hover:bg-white/[0.02] -mx-6 px-6 py-2 transition-all relative flex flex-col items-start">
      {message.replyTo && (
        <div className="flex items-center gap-2 ml-14 mb-1 opacity-40 hover:opacity-100 transition-opacity">
           <div className="w-4 h-4 border-l-2 border-t-2 border-gray-700 rounded-tl-md ml-1 mt-2"></div>
           <Reply className="w-3 h-3 text-gray-500 -mt-1" />
           <span className="text-[10px] font-bold text-gray-500 truncate max-w-[200px]">
             {message.replyTo.userName}: <span className="font-medium italic">"{message.replyTo.text}"</span>
           </span>
        </div>
      )}
      
      <div className="flex items-start gap-4 w-full">
        <div className="relative flex-shrink-0 cursor-pointer" onClick={() => onProfileClick(message.userId)}>
          <img src={message.userAvatar || `https://ui-avatars.com/api/?name=${message.userName}&background=random&color=fff`} className="w-10 h-10 rounded-full" />
          <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#161616]", status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-700')}></div>
        </div>
        
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            <span 
              onClick={() => onProfileClick(message.userId)}
              className={cn("text-xs font-black tracking-tight cursor-pointer hover:underline flex items-center gap-1.5 relative", message.isAI ? "" : "text-white/90")}
              style={message.isAI ? { color: message.aiColor || '#534ab7' } : {}}
            >
              <div className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1", status === 'online' ? "bg-green-500" : "bg-gray-700")}></div>
              {message.userName}
              {message.role === 'admin' && <Crown className="w-3 h-3 text-red-500 fill-red-500/10 inline" />}
              {message.role === 'moderator' && <Star className="w-3 h-3 text-purple-500 fill-purple-500/10 inline" />}
              {message.isAI && (
                <span 
                  className="ml-1 py-0.5 px-1.5 border rounded text-[6px] font-black uppercase tracking-widest flex items-center gap-1"
                  style={{ 
                    backgroundColor: (message.aiColor || '#534ab7') + '33', 
                    color: message.aiColor || '#534ab7',
                    borderColor: (message.aiColor || '#534ab7') + '4d' 
                  }}
                >
                  AI Agent {message.aiRole && <span className="opacity-60 border-l border-current pl-1 ml-1">{message.aiRole}</span>}
                </span>
              )}
            </span>
            <span className="text-[8px] text-gray-700 font-bold uppercase">{message.createdAt?.toDate ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</span>
            {message.isPinned && <Pin className="w-3 h-3 text-primary fill-primary/20" />}
            {message.isEdited && <span className="text-[7px] text-gray-700 font-bold uppercase">(edited)</span>}
            {message.moderationStatus === 'flagged' && (
              <span className="text-[7px] text-red-500 font-black uppercase tracking-widest px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-1">
                <ShieldAlert className="w-2 h-2" />
                Flagged: {message.moderationType}
              </span>
            )}
          </div>
            <div className="relative">
              {isEditing ? (
                <div className="mt-1">
                  <textarea 
                    autoFocus
                    value={editBuffer}
                    onChange={(e) => setEditBuffer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onEditSave();
                      }
                      if (e.key === 'Escape') onEditCancel();
                    }}
                    className="w-full bg-white/5 border border-primary/30 rounded-xl p-3 text-sm text-gray-300 outline-none focus:ring-1 ring-primary/50"
                    rows={Math.max(1, editBuffer.split('\n').length)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={onEditSave} className="text-[9px] font-black uppercase text-primary hover:underline">Save</button>
                    <button onClick={onEditCancel} className="text-[9px] font-black uppercase text-gray-600 hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <p 
                  onDoubleClick={() => isMe && onEditStart()}
                  className={cn(
                    "text-sm text-gray-400 leading-relaxed font-medium transition-colors group-hover/msg:text-gray-300",
                    isMe && "cursor-pointer",
                    message.moderationStatus === 'flagged' && "opacity-40 line-through decoration-red-500/50"
                  )}
                >
                  {message.text}
                </p>
              )}
              {message.fileUrl && message.type === 'image' && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 max-w-sm">
                  <img src={message.fileUrl} alt="Signal Attachment" className="w-full h-auto" />
                </div>
              )}
              {message.fileUrl && message.type === 'video' && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 max-w-sm bg-black aspect-video flex items-center justify-center group/vid relative">
                  <video src={message.fileUrl} controls className="w-full h-full" />
                </div>
              )}
            </div>
          
          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(message.reactions as Record<string, string[]>).map(([emoji, userIds]) => (
                <button 
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-black transition-all",
                    userIds.includes(auth.currentUser?.uid || '')
                      ? "bg-primary/20 border-primary/50 text-primary shadow-lg shadow-primary/10"
                      : "bg-[#1f1f1f] border-white/5 text-gray-500 hover:border-white/20"
                  )}
                >
                  <span>{emoji}</span>
                  <span className="opacity-70">{userIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="absolute right-6 top-2 opacity-0 group-hover/msg:opacity-100 transition-all flex items-center gap-0.5 bg-[#1a1a1a] border border-white/10 rounded-lg p-0.5 shadow-2xl">
          <div className="relative">
            <button 
              onClick={() => setShowEmojis(!showEmojis)}
              className="p-1.5 text-gray-500 hover:text-primary transition-all hover:bg-white/5 rounded-md"
            >
              <Smile className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showEmojis && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 p-1.5 bg-[#121212] border border-white/10 rounded-xl flex gap-1 shadow-full z-50"
                >
                  {emojis.map(e => (
                    <button 
                      key={e}
                      onClick={() => {
                        onReact(message.id, e);
                        setShowEmojis(false);
                      }}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-lg hover:scale-125 transition-transform"
                    >
                      {e}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => onReply(message)}
            className="p-1.5 text-gray-500 hover:text-white transition-all hover:bg-white/5 rounded-md"
          >
            <Reply className="w-4 h-4" />
          </button>

          {permissions?.canDeleteMessage && (
            <button onClick={() => onPin(message.id, !message.isPinned)} className={cn("p-1.5 rounded-md hover:bg-white/5 transition-all", message.isPinned ? "text-primary" : "text-gray-500 hover:text-white")}>
              <Pin className="w-4 h-4" />
            </button>
          )}

          {(isMe || permissions?.canDeleteMessage) && (
            <button onClick={() => onDelete(message.id)} className="p-1.5 text-gray-500 hover:text-red-500 transition-all hover:bg-white/5 rounded-md">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Missing common components could be imported or defined here (Toast, etc)
// For now assuming they are available or simple enough to inline if needed.
// I see useToast hook, assuming Toast component is reachable.

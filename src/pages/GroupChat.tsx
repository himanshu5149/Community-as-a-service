import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useChat, Message } from '../hooks/useChat';
import { useGroups } from '../hooks/useGroups';
import { useGroupRoles } from '../hooks/useGroupRoles';
import { useGroupMembers } from '../hooks/useGroupMembers';
import { useGamification } from '../hooks/useGamification';
import { useChannels } from '../hooks/useChannels';
import { useTyping } from '../hooks/useTyping';
import { usePresence } from '../hooks/usePresence';
import { useAiAgents } from '../hooks/useAiAgents';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { useModeration } from '../hooks/useModeration';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { 
  User, 
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
  ChevronRight,
  ChevronDown,
  Smile,
  Reply,
  MoreVertical,
  Crown,
  Star,
  Filter,
  Lock,
  Loader2
} from 'lucide-react';

export default function GroupChat() {
  const { groupId, channelId } = useParams<{ groupId: string; channelId: string }>();
  const navigate = useNavigate();
  const { groups, deleteGroup } = useGroups();
  const group = groups.find(g => g.id === groupId);
  
  const { channels, loading: channelsLoading, createChannel } = useChannels(groupId || '');
  const activeChannel = channels.find(c => c.id === channelId) || channels[0];
  
  const { messages, loading: chatLoading, sendMessage, reactToMessage, deleteMessage, editMessage, togglePinMessage } = useChat(groupId || '', activeChannel?.id);
  const { member, joinGroup, isMember, permissions, loading: rolesLoading } = useGroupRoles(groupId || '');
  const { members } = useGroupMembers(groupId || '');
  const { agents } = useAiAgents(groupId || '');
  const { addPoints } = useGamification();
  const { toast, hideToast, showToast } = useToast();
  const { moderateMessage } = useModeration();
  
  const { user } = useAuth();
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
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;
    setIsScrolledUp(!isAtBottom);
  };

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSlashCommand = async (command: string) => {
    const parts = command.split(' ');
    const mainCmd = parts[0].toLowerCase();

    if (mainCmd === '/help') {
      showToast("Commands: /agent @name query, /summarize, /clear, /poll, /help");
      return true;
    }

    if (mainCmd === '/clear') {
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
      const agentNameQuery = mention.substring(1).toLowerCase();
      const queryText = parts.slice(2).join(' ');
      if (!queryText) {
        showToast(`What should I transmit to ${mention}?`, 'error');
        return true;
      }

      const agent = agents.find(a => a.name.toLowerCase() === agentNameQuery);
      
      try {
        const res = await fetch('/api/ai/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: queryText, 
            agentId: agent?.id || agentNameQuery, 
            agentName: agent?.name || mention.substring(1),
            persona: agent ? {
              role: agent.role,
              personality: agent.personality,
              expertise: agent.expertise.join(', '),
              systemInstruction: agent.systemInstruction
            } : undefined,
            context: { groupName: group?.name, channelName: activeChannel?.name } 
          })
        });
        const data = await res.json();
        const reply = data.reply || data.response;
        if (reply) await sendMessage(reply, 'ai', undefined, true, { 
          aiName: agent?.name || mention.substring(1), 
          aiAvatar: agent?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${agentNameQuery}`,
          aiColor: agent?.accentColor || '#534AB7'
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
              const res = await fetch('/api/ai/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  query: textToChat, 
                  agentId: agent.id, 
                  agentName: agent.name,
                  persona: {
                    role: agent.role,
                    personality: agent.personality,
                    expertise: agent.expertise.join(', '),
                    systemInstruction: agent.systemInstruction
                  },
                  context: { 
                    groupName: group?.name || 'Unknown', 
                    channelName: activeChannel?.name || 'general' 
                  } 
                })
              });
              const data = await res.json();
              const reply = data.reply || data.response;
              if (reply) {
                await sendMessage(reply, 'ai', undefined, true, { 
                  aiName: agent.name, 
                  aiAvatar: agent.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.name.toLowerCase()}`,
                  aiColor: agent.accentColor || '#534AB7'
                });
              }
            } catch (err) {
              console.error("AI mention failed:", err);
            }
          }
        }
      }
    } catch (err: any) {
      showToast("Message failed to send. Please try again.", 'error');
    }
  };

  const handleUpdateName = async () => {
    if (!permissions.canEditGroup || !groupId || !newName.trim()) return;
    try {
      await updateDoc(doc(db, 'groups', groupId), { name: newName });
      setIsEditingGroup(false);
      setShowSettings(false);
      showToast("Node identity reconfigured.");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `groups/${groupId}`);
    }
  };

  const handleJoinCluster = async () => {
    if (!user || !groupId) return;
    setIsJoining(true);
    try {
      await joinGroup(user.displayName || 'Anonymous');
      showToast("Identity synchronized with cluster.");
    } catch (err) {
      console.error("Join cluster failed:", err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="pt-20 h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-sans">
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

            {showSettings && (
              <div className="mx-2 mb-2 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                {permissions.canEditGroup && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Rename group..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-1 ring-primary/50"
                    />
                    <button
                      onClick={handleUpdateName}
                      className="w-full py-2 bg-primary rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/80 transition-all"
                    >
                      Save Name
                    </button>
                  </div>
                )}
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                  <Settings className="w-3 h-3" /> Settings
                </button>
              </div>
            )}

            <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-6">
              <div>
                <div className="px-2 mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <span>Channels</span>
                  {permissions.canCreateChannel && (
                    <button onClick={() => setShowCreateChannel(true)} className="hover:text-primary transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {channelsLoading ? (
                    [1,2,3].map(i => <div key={`chan-skele-${i}`} className="h-10 bg-white/5 animate-pulse rounded-lg mx-2"></div>)
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
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-tight truncate max-w-[100px]">{user?.displayName}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-grow flex flex-col min-w-0 bg-[#161616]">
        <div className="h-14 border-b border-white/5 bg-[#161616]/80 backdrop-blur-xl px-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChannelSidebar(!showChannelSidebar)} className="p-2 text-gray-500 hover:text-white">
              <MoreVertical className="w-5 h-5 rotate-90" />
            </button>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <h1 className="font-black tracking-tighter text-sm uppercase">{activeChannel?.name || 'general'}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSearchModal(true)} className="text-gray-500 hover:text-white">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => setShowMemberSidebar(!showMemberSidebar)} className="text-gray-500 hover:text-white">
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto no-scrollbar px-6 py-4 space-y-1 relative"
        >
           {chatLoading ? (
             <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
           ) : messages.map((msg) => (
               <MessageNode 
                 key={msg.id} 
                 message={msg} 
                 isMe={msg.userId === user?.uid} 
                 permissions={permissions}
                 onReact={reactToMessage}
                 onDelete={deleteMessage}
                 onPin={(id: string, pin: boolean) => togglePinMessage(id, pin)}
                 onReply={(msg: Message) => setReplyTo(msg)}
                 status={statuses[msg.userId]}
               />
           ))}
           <div ref={messagesEndRef} />

           {!rolesLoading && !isMember && (
               <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                 <div className="bg-[#121212] border border-white/10 p-10 rounded-[3rem] text-center max-w-sm">
                   <Lock className="w-12 h-12 text-primary mx-auto mb-6" />
                   <h2 className="text-2xl font-black mb-4 uppercase">Frequency Restricted</h2>
                   <p className="text-gray-500 text-sm mb-10 italic">Join this group to participate.</p>
                   <button 
                     onClick={handleJoinCluster}
                     disabled={isJoining}
                     className="w-full bg-primary py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                   >
                     {isJoining ? "Syncing..." : "Sync Identity"}
                   </button>
                 </div>
               </div>
           )}
        </div>

        <div className="px-4 pb-6 pt-2">
            {moderationWarning && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-2 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-grow">
                  <p className="text-xs text-red-200 font-bold mb-1 uppercase tracking-wider">Security Flag: {moderationWarning.reason}</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setModerationWarning(null)}
                      className="text-[10px] text-gray-500 hover:text-white underline font-bold"
                    >
                      ABORT SIGNAL
                    </button>
                    <button 
                      onClick={() => handleSendMessage(undefined, true)}
                      className="text-[10px] text-red-500 hover:text-red-400 underline font-black"
                    >
                      OVERRIDE (RISKY)
                    </button>
                  </div>
                </div>
              </div>
            )}
            {replyTo && (
              <div className="bg-white/5 p-2 rounded-t-xl flex justify-between items-center text-xs text-gray-500">
                <span>Replying to {replyTo.userName}</span>
                <button onClick={() => setReplyTo(null)}><X className="w-3 h-3" /></button>
              </div>
            )}
            <div className="bg-[#242424] rounded-xl flex items-center p-2">
              <input 
                 value={inputText}
                 onChange={(e) => {
                   setInputText(e.target.value);
                   setTyping(e.target.value.length > 0);
                 }}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                 placeholder="Transmit signal..."
                 className="flex-grow bg-transparent border-none outline-none text-sm px-4 h-10"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="bg-primary p-2.5 rounded-lg text-white"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {showMemberSidebar && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 240 }}
            exit={{ width: 0 }}
            className="h-full bg-[#121212] border-l border-white/5 flex flex-col flex-shrink-0 z-30 overflow-hidden"
          >
            <div className="p-4 space-y-6">
               <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-4 px-2">Synchronized</span>
                  <div className="space-y-1">
                    {members.map(m => (
                      <div key={m.id || m.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
                        <div className="relative">
                          {m.userAvatar ? (
                            <img src={m.userAvatar} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div className={cn("absolute bottom-0 right-0 w-2 h-2 rounded-full border border-black", statuses[m.userId] === 'online' ? 'bg-green-500' : 'bg-gray-600')}></div>
                        </div>
                        <span className="text-xs font-bold truncate">{m.userName}</span>
                      </div>
                    ))}
                  </div>
               </div>
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

function MessageNode({ 
  message, 
  isMe, 
  permissions, 
  onReact, 
  onDelete, 
  onPin, 
  onReply, 
  onProfileClick, 
  status 
}: any) {
  const timeString = message.createdAt?.toDate 
    ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '...';

  return (
    <div className="group/msg hover:bg-white/[0.02] -mx-6 px-6 py-2 transition-all relative flex gap-4">
      <div 
        className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-white/5 cursor-pointer relative"
        onClick={() => onProfileClick?.(message.userId)}
      >
        {message.userAvatar ? (
          <img src={message.userAvatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-600">
            {message.userName?.[0] || '?'}
          </div>
        )}
        <div className={cn(
          "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#161616]",
          status === 'online' ? "bg-green-500" : "bg-gray-600"
        )}></div>
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span 
            className={cn("text-xs font-black tracking-tight cursor-pointer hover:underline", message.isAI ? "text-primary" : "text-white")}
            onClick={() => onProfileClick?.(message.userId)}
          >
            {message.userName || 'Anonymous'}
          </span>
          <span className="text-[8px] text-gray-700 font-bold uppercase">{timeString}</span>
          {message.isPinned && <Pin className="w-2.5 h-2.5 text-primary" />}
        </div>
        <p className="text-sm text-gray-400 font-medium leading-relaxed break-words">
          {message.text || <span className="italic text-gray-600 font-normal">Signal lost or empty...</span>}
        </p>
      </div>
      <div className="hidden group-hover/msg:flex items-center gap-1 absolute right-6 top-2 bg-[#1a1a1a] border border-white/10 rounded-lg p-0.5 shadow-xl z-10 font-sans">
        <button onClick={() => onReply(message)} className="p-1.5 text-gray-500 hover:text-white" title="Reply"><Reply className="w-4 h-4" /></button>
        {(isMe || permissions?.canDeleteMessage) && (
          <button onClick={() => onDelete(message.id)} className="p-1.5 text-gray-500 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
    </div>
  );
}

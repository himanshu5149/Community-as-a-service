import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useChat, Message } from '../hooks/useChat';
import { useGroups } from '../hooks/useGroups';
import { useGroupRoles, UserRole } from '../hooks/useGroupRoles';
import { useGroupMembers } from '../hooks/useGroupMembers';
import { useGamification } from '../hooks/useGamification';
import { usePolls } from '../hooks/usePolls';
import { useModeration } from '../hooks/useModeration';
import { auth, signInWithGoogle, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { 
  Send, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  Bot, 
  ArrowLeft, 
  Users, 
  MoreVertical,
  Paperclip,
  Smile,
  Loader2,
  Lock,
  LogIn,
  CheckCircle2,
  BarChart3,
  X,
  Plus,
  ShieldAlert,
  Sparkles,
  History,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { moderateMessage, summarizeChat, askPersona } from '../services/geminiService';
import { getPersonaForGroup, AIPersona } from '../constants/aiPersonas';

export default function GroupChat() {
  const { groupId } = useParams<{ groupId: string }>();
  const { groups } = useGroups();
  const group = groups.find(g => g.id === groupId);
  const { messages, loading, sendMessage, reactToMessage, deleteMessage } = useChat(groupId || '');
  const { member, loading: rolesLoading, joinGroup, isAdmin, isModerator, isMember, updateRole } = useGroupRoles(groupId || '');
  const { members } = useGroupMembers(groupId || '');
  const { polls, vote } = usePolls(groupId || '');
  const { stats, addPoints } = useGamification();
  const { submitReport } = useModeration();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchQueryLower = searchQuery.toLowerCase();
  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchQueryLower)
  );

  const persona = getPersonaForGroup(group?.name || '', group?.description || '');

  const reportMessage = async (msg: Message) => {
    if (!window.confirm("Initialize containment protocol for this signal?")) return;
    await submitReport({
      targetType: 'message',
      targetId: msg.id,
      reason: 'Community Guideline Infraction'
    });
    alert("Signal flagged for terminal review.");
  };
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, polls]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const textToChat = inputText;
    
    // Phase 1: AI Moderation
    const moderation = await moderateMessage(textToChat);
    if (!moderation.isSafe) {
      setModerationWarning(moderation.reason || "This signal violates community protocols.");
      return;
    }

    setInputText('');
    await sendMessage(textToChat);
    
    // Award points for community contribution
    if (user) {
      addPoints(10);
    }

    // AI Response logic if mentioned or specifically asking help
    const aiMention = `@${persona.name.toLowerCase()}`;
    if (textToChat.toLowerCase().includes(aiMention) || textToChat.toLowerCase().includes('@ai') || (textToChat.toLowerCase().includes('help') && textToChat.length < 50)) {
      handleAIResponse(textToChat);
    }
  };

  const handleSummarize = async () => {
    if (messages.length < 5) {
      alert("Insufficient signal density for archival summarization.");
      return;
    }
    
    setIsSummarizing(true);
    try {
      const chatLogs = messages.slice(-20).map(m => ({ user: m.userName, text: m.text }));
      const summary = await summarizeChat(chatLogs);
      setChatSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const createPoll = async () => {
    if (!groupId || !pollQuestion.trim() || pollOptions.some(o => !o.trim())) return;
    
    const path = `groups/${groupId}/polls`;
    try {
      await addDoc(collection(db, path), {
        question: pollQuestion,
        options: pollOptions,
        creatorId: user?.uid,
        createdAt: serverTimestamp(),
        votes: {},
        userVotes: {}
      });
      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      addPoints(25); // Bonus for creating structured content
      await sendMessage(`[SIGNAL] Community intelligence poll deployed: ${pollQuestion}`, 'text');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleAIResponse = async (userPrompt: string) => {
    setIsBotTyping(true);
    try {
      const recentContext = messages.slice(-10).map(m => ({
        user: m.userName,
        text: m.text,
        isAI: m.isAI
      }));
      
      const response = await askPersona(userPrompt, persona, {
        groupName: group?.name || 'Protocol Hub',
        recentMessages: recentContext
      });

      await sendMessage(response, 'ai', '', true, {
        aiName: persona.name,
        aiAvatar: `https://ui-avatars.com/api/?name=${persona.name}&background=3B82F6&color=fff`
      });
    } catch (error) {
      console.error("AI Error:", error);
      await sendMessage("Protocol Error: Connection to neural link unstable. Please retry transmission.", 'ai', '', true, {
        aiName: persona.name
      });
    } finally {
      setIsBotTyping(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-24 min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center px-10 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/10 shadow-2xl backdrop-blur-xl">
            <Lock className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-none italic">Secure <br/><span className="text-primary not-italic">Uplink.</span></h2>
          <p className="text-xl md:text-2xl text-gray-500 mb-14 max-w-md font-medium leading-relaxed">
            Communication channels are encrypted. Authentication required for signal insertion.
          </p>
          <button 
            onClick={signInWithGoogle}
            className="px-12 py-6 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.3em] text-sm flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/40"
          >
            <LogIn className="w-5 h-5" />
            Establish Identity
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-20 h-screen bg-bg-dark text-white flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="h-20 md:h-24 border-b border-white/5 bg-white/5 backdrop-blur-3xl px-4 md:px-8 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-3 md:gap-6">
          <Link to="/groups" className="text-gray-300 hover:text-white transition-colors p-2">
            <ArrowLeft className="w-5 h-5 md:w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <div 
              className="w-10 h-10 md:w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold italic md:text-xl shadow-2xl"
              style={{ backgroundColor: group?.accentColor || '#534ab7' }}
            >
              {group?.name?.[0] || 'G'}
            </div>
            <div className="max-w-[120px] md:max-w-none">
              <h1 className="text-sm md:text-xl font-bold tracking-tight truncate">{group?.name || 'Protocol Hub'}</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {isMember ? (member?.role || 'Active') : 'Spectator'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          <div className="hidden lg:flex flex-col items-end mr-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{stats?.points || 0} XP</span>
            <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
               <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${((stats?.points || 0) % 100)}%` }}
               ></div>
            </div>
          </div>
          <div className="hidden sm:flex items-center -space-x-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-bg-dark bg-white/10 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=${i + (group?.id || '')}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
          <button 
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors text-primary disabled:opacity-50"
            title="Summarize Recent Signals"
          >
            {isSummarizing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Node address copied to clipboard. Share with authorized entities.");
            }}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400"
            title="Copy Invite Address"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowMembers(true)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Users className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col min-h-0 relative">
        {/* Search Bar */}
        <div className="px-6 md:px-10 py-4 border-b border-white/5 bg-bg-dark/50 backdrop-blur-md sticky top-0 z-40">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search transmission logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:border-primary/50 outline-none transition-all placeholder:text-gray-600"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar px-4 md:px-8 py-6 md:py-10 space-y-8 md:space-y-10 relative">
          {/* Background Visuals */}
        <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-primary/5 rounded-full blur-[100px] md:blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-blue-500/5 rounded-full blur-[100px] md:blur-[120px]"></div>
        </div>

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5">
              <Bot className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Awaiting primary signal initiation...</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-primary animate-spin" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Syncing Archive...</p>
          </div>
        ) : filteredMessages.length === 0 && searchQuery !== "" ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40">
            <Search className="w-16 h-16 md:w-20 md:h-20 text-gray-700" />
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">No signals matching "{searchQuery}" detected</p>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-10">
            {/* Display Active Polls */}
            {polls.map(poll => {
              const pollVotes = (poll.votes || {}) as Record<number, number>;
              const totalVotes = Object.values(pollVotes).reduce((a, b) => (a as number) + (b as number), 0) as number;
              const userVoted = poll.userVotes?.[user?.uid || ''];
              
              return (
                <motion.div 
                  key={poll.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="max-w-full md:max-w-2xl bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Active Directive Vote</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-6 md:mb-8">{poll.question}</h3>
                  
                  <div className="space-y-3 md:space-y-4">
                    {poll.options.map((opt, idx) => {
                      const count = (pollVotes[idx] || 0) as number;
                      const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                      return (
                        <button 
                          key={idx}
                          onClick={() => userVoted === undefined && vote(poll.id, idx)}
                          disabled={userVoted !== undefined}
                          className={cn(
                            "w-full p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all relative overflow-hidden text-left font-bold flex justify-between items-center",
                            userVoted === idx ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                          )}
                        >
                          <div 
                            className="absolute inset-0 bg-primary/10 transition-all duration-1000" 
                            style={{ width: `${percent}%` }}
                          ></div>
                          <span className="relative z-10 text-sm md:text-base">{opt}</span>
                          <span className="relative z-10 text-[10px] md:text-xs text-gray-500">{Math.round(percent)}%</span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-6 md:mt-8 flex justify-between items-center text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                    <span>{totalVotes} Votes Registered</span>
                    {userVoted !== undefined && <span className="text-primary flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Signature Confirmed</span>}
                  </div>
                </motion.div>
              );
            })}

            {filteredMessages.map((msg, i) => {
            const isMe = msg.userId === user.uid;
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-end gap-3 md:gap-4 max-w-[90%] md:max-w-[85%] group",
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {!isMe && (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex-shrink-0 overflow-hidden border border-white/10">
                    {msg.isAI ? (
                      <div className="w-full h-full bg-primary flex items-center justify-center">
                        <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                    ) : (
                      <img src={msg.userAvatar || `https://i.pravatar.cc/100?u=${msg.userId}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5 md:gap-2 relative">
                  <div className={cn(
                    "px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-[1.5rem] relative",
                    isMe 
                      ? "bg-primary text-white rounded-br-none" 
                      : msg.isAI 
                        ? "bg-blue-500/5 text-white border border-blue-500/20 rounded-bl-none shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                        : "bg-white/10 text-white rounded-bl-none"
                  )}>
                    {!isMe && !msg.isAI && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary">
                          {msg.userName}
                        </span>
                        {/* We don't have roles for every user easily here without more fetch, 
                            but we could if we added role to message payload */}
                      </div>
                    )}
                    {msg.isAI && (
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-4 h-4 bg-blue-500/20 rounded flex items-center justify-center">
                           <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                         </div>
                         <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-blue-400">
                          {msg.userName || persona.name} Intelligence
                        </span>
                       </div>
                    )}
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <p className={cn(
                        "text-xs md:text-sm font-medium leading-relaxed",
                        msg.isAI ? "text-blue-50/90 italic" : ""
                      )}>{msg.text}</p>
                      
                      {/* Reaction Picker Trigger */}
                      <div className={cn(
                        "flex items-center gap-2",
                        isMe ? "flex-row-reverse" : ""
                      )}>
                        {!msg.isAI && (
                          <div className="relative group/picker">
                            <button className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white transition-all p-1">
                              <Smile className="w-4 h-4" />
                            </button>
                            <div className={cn(
                              "absolute bottom-full mb-2 bg-[#1a1a1a] border border-white/10 rounded-full p-1.5 flex gap-1 shadow-2xl opacity-0 group-hover/picker:opacity-100 pointer-events-none group-hover/picker:pointer-events-auto transition-all z-40",
                              isMe ? "right-0" : "left-0"
                            )}>
                              {['👍', '❤️', '🔥', '😂', '😮', '😢'].map(emoji => (
                                <button 
                                  key={emoji}
                                  onClick={() => reactToMessage(msg.id, emoji)}
                                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-lg transition-transform active:scale-125"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {!isMe && !msg.isAI && (
                          <div className="flex items-center gap-2">
                             <button 
                              onClick={() => reportMessage(msg)}
                              className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-all p-1"
                              title="Report Signal"
                            >
                              <ShieldAlert className="w-3 h-3" />
                            </button>
                            {isModerator && (
                               <button 
                                onClick={() => deleteMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-all p-1"
                                title="Purge Signal"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                        {isMe && (
                           <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white transition-all p-1"
                            title="Purge Signal"
                          >
                             <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {msg.type === 'image' && msg.fileUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                        <img src={msg.fileUrl} className="max-w-full h-auto" referrerPolicy="no-referrer" />
                      </div>
                    )}

                    {/* Reactions Display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={cn(
                        "flex flex-wrap gap-1 mt-3",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        {Object.entries(msg.reactions || {}).map(([emoji, uIds]) => {
                          const userIds = uIds as string[];
                          return (
                            <button
                              key={emoji}
                              onClick={() => reactToMessage(msg.id, emoji)}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border transition-all",
                                userIds.includes(user.uid)
                                  ? "bg-primary/20 border-primary/40 text-white"
                                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                              )}
                            >
                              <span>{emoji}</span>
                              <span>{userIds.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-gray-600",
                    isMe ? "text-right" : "text-left"
                  )}>
                    {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Pending'}
                  </span>
                </div>
              </motion.div>
            )
          })
        }
        
        {/* Bot Typing Indicator */}
        <AnimatePresence>
          {isBotTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-3 md:gap-4 max-w-[85%] mr-auto mb-4"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" />
              </div>
              <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-bl-none flex flex-col gap-2">
                <span className="text-[7px] font-black uppercase tracking-widest text-primary/60">{persona.name} is thinking...</span>
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        </div>
      )}

        <AnimatePresence>
          {showPollCreator && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-bg-dark/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#121212] border border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] w-full max-w-xl shadow-full overflow-y-auto max-h-[90vh] no-scrollbar"
              >
                <div className="flex justify-between items-center mb-8 md:mb-10">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tighter">Initialize <span className="text-primary italic">Poll.</span></h3>
                  <button onClick={() => setShowPollCreator(false)} className="text-gray-400 hover:text-white p-2"><X /></button>
                </div>

                <div className="space-y-6 md:space-y-8">
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Objective Question</label>
                    <input 
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl outline-none focus:border-primary transition-all text-lg md:text-xl font-bold"
                      placeholder="Define the query..."
                    />
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <label className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Outcome Paths</label>
                    {pollOptions.map((opt, i) => (
                      <input 
                        key={i}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...pollOptions];
                          newOpts[i] = e.target.value;
                          setPollOptions(newOpts);
                        }}
                        className="w-full bg-white/5 border border-white/5 px-4 md:px-6 py-3 md:py-4 rounded-xl outline-none focus:border-primary transition-all font-medium"
                        placeholder={`Option ${i + 1}...`}
                      />
                    ))}
                    <button 
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="flex items-center gap-2 text-primary font-bold text-[10px] md:text-xs uppercase tracking-widest mt-2 hover:opacity-80"
                    >
                      <Plus className="w-3 h-3 md:w-4 md:h-4" /> Add Path
                    </button>
                  </div>

                  <button 
                    onClick={createPoll}
                    className="w-full bg-primary text-white py-5 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] md:text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/20 mt-4"
                  >
                    Deploy Directive
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showMembers && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-6 bg-bg-dark/90 backdrop-blur-xl"
            >
               <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#121212] border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-full"
              >
                 <div className="p-8 md:p-12 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                   <div>
                      <h3 className="text-3xl md:text-5xl font-bold tracking-tighter">Node <span className="text-primary italic">Registry.</span></h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">{members.length} Entities Synchronized</p>
                   </div>
                   <button onClick={() => setShowMembers(false)} className="text-gray-400 hover:text-white p-2">
                     <X className="w-8 h-8" />
                   </button>
                 </div>

                 <div className="flex-grow overflow-y-auto p-6 md:p-10 space-y-4 no-scrollbar">
                   {/* AI Persona Member */}
                   <div className="flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl bg-blue-500/5 border border-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.05)] group">
                     <div className="flex items-center gap-4 md:gap-6">
                       <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-primary/20 border border-primary/20 flex items-center justify-center overflow-hidden">
                         <Bot className="w-6 h-6 md:w-8 md:h-8 text-primary animate-pulse" />
                       </div>
                       <div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg md:text-xl font-bold text-white tracking-tight">{persona.name}</span>
                            <span className="bg-primary/20 text-primary text-[7px] md:text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">
                              CaaS — AI Node
                            </span>
                          </div>
                          <p className="text-[9px] md:text-[10px] text-blue-400/60 font-bold uppercase tracking-widest mt-1 italic">{persona.role}</p>
                          <p className="text-[8px] md:text-[9px] text-gray-500 mt-2 max-w-[200px] leading-tight">{persona.description}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <span className="text-[7px] md:text-[8px] bg-green-500/20 text-green-400 px-2 py-1 rounded-md font-bold uppercase tracking-[0.2em]">Synchronized</span>
                     </div>
                   </div>

                   {members.map(m => (
                     <div key={m.userId} className="flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl hover:bg-white/5 transition-all group">
                       <div className="flex items-center gap-4 md:gap-6">
                         <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
                           <img src={`https://i.pravatar.cc/150?u=${m.userId}`} className="w-full h-full object-cover" />
                         </div>
                         <div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg md:text-xl font-bold text-white tracking-tight">{m.userName}</span>
                              <span className={cn(
                                "text-[7px] md:text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                                m.role === 'admin' ? "bg-red-500/20 text-red-400" :
                                m.role === 'moderator' ? "bg-blue-500/20 text-blue-400" :
                                "bg-white/10 text-gray-400"
                              )}>
                                {m.role}
                              </span>
                            </div>
                            <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Joined {new Date(m.joinedAt?.seconds * 1000).toLocaleDateString()}</p>
                         </div>
                       </div>

                       {isAdmin && m.userId !== user.uid && (
                         <div className="flex items-center gap-2">
                            <select 
                              value={m.role}
                              onChange={(e) => updateRole(m.userId, e.target.value as UserRole)}
                              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary"
                            >
                              <option value="member">Member</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {chatSummary && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-bg-dark/90 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#121212] border border-primary/20 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] w-full max-w-2xl shadow-[0_0_50px_rgba(83,74,183,0.2)] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
                <div className="flex justify-between items-center mb-10 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tighter">Signal <span className="text-primary italic">Archive.</span></h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">AI Generated Summary</p>
                    </div>
                  </div>
                  <button onClick={() => setChatSummary(null)} className="text-gray-400 hover:text-white p-2"><X /></button>
                </div>
                
                <div className="prose prose-invert max-w-none relative z-10">
                  <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/5 text-gray-300 leading-relaxed font-medium text-lg whitespace-pre-line max-h-[50vh] overflow-y-auto no-scrollbar">
                    {chatSummary}
                  </div>
                </div>

                <div className="mt-10 flex flex-col md:flex-row gap-4 relative z-10">
                  <button 
                    onClick={() => {
                      sendMessage(`[ARCHIVE SUMMARY] ${chatSummary.slice(0, 500)}...`, 'ai', '', true);
                      setChatSummary(null);
                    }}
                    className="flex-grow bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/30"
                  >
                    Broadcast to Network
                  </button>
                  <button 
                    onClick={() => setChatSummary(null)}
                    className="px-8 py-5 bg-white/5 text-gray-400 rounded-2xl font-bold border border-white/5 hover:bg-white/10 transition-all"
                  >
                    Close Archive
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {moderationWarning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-red-950/20 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#1a0a0a] border border-red-500/30 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-red-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-red-500/30">
                  <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
                </div>
                <h3 className="text-3xl font-bold tracking-tighter text-white mb-4">Signal <span className="text-red-500 italic">Blocked.</span></h3>
                <p className="text-gray-400 font-medium mb-10 leading-relaxed">
                  {moderationWarning}
                  <br/><br/>
                  <span className="text-[10px] uppercase font-black tracking-widest text-red-500/50">Community integrity protocol enforcement active</span>
                </p>
                <button 
                  onClick={() => setModerationWarning(null)}
                  className="w-full bg-red-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:bg-red-600 transition-all shadow-2xl shadow-red-500/30"
                >
                  I Understand
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {!isMember && !rolesLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-bg-dark/80 backdrop-blur-xl px-6"
          >
            <div className="max-w-md w-full bg-[#121212] border border-white/10 p-10 rounded-[3rem] text-center shadow-full">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-3xl font-bold tracking-tighter mb-4">Join the <span className="text-primary italic">Cluster.</span></h3>
              <p className="text-gray-400 font-medium mb-10 leading-relaxed">
                This channel is restricted to verified node members. Synchronize your identity to enter the conversation.
              </p>
              <button 
                onClick={() => joinGroup(user?.displayName || 'Anonymous Node')}
                className="w-full bg-primary text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/30"
              >
                Join Metadata Node
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
      
      {/* Input Console */}
      <div className="p-4 md:p-8 border-t border-white/5 bg-bg-dark z-30">
        <form 
          onSubmit={handleSendMessage}
          className="max-w-5xl mx-auto flex items-center gap-2 md:gap-4 bg-white/5 border border-white/5 rounded-2xl md:rounded-3xl p-2 md:p-3 focus-within:border-primary/50 transition-all shadow-2xl"
        >
          <div className="flex items-center gap-1 md:gap-2 md:pl-4">
            <button type="button" className="text-gray-500 hover:text-white transition-colors p-2 hidden sm:block">
              <Paperclip className="w-5 h-5" />
            </button>
            <button 
              type="button" 
              onClick={() => setShowPollCreator(true)}
              className="text-gray-500 hover:text-primary transition-colors p-2"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
          
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow bg-transparent border-none outline-none text-white font-medium px-2 md:px-4 text-sm md:text-base placeholder:text-gray-600 placeholder:italic"
            placeholder="Insert signal..."
          />
          
          <div className="flex items-center gap-1 md:gap-2 md:pr-2">
            <button type="button" className="text-gray-500 hover:text-white transition-colors p-2 hidden sm:block">
              <Smile className="w-5 h-5" />
            </button>
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all",
                inputText.trim() 
                  ? "bg-primary text-white shadow-[0_10px_30px_rgba(83,74,183,0.4)] rotate-45 hover:rotate-0" 
                  : "bg-white/5 text-gray-700"
              )}
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </form>
        <p className="text-[7px] md:text-[9px] text-center mt-3 md:mt-4 font-black uppercase tracking-[0.4em] text-gray-700">
          Encrypted Signal Transmission Protocol v4.2
        </p>
      </div>
    </div>
  );
}

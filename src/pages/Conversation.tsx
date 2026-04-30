import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useDirectChat } from '../hooks/useDirectChat';
import { useToast, Toast } from '../components/Toast';
import { useModeration } from '../hooks/useModeration';
import { 
  Send, 
  ArrowLeft, 
  MoreVertical,
  Paperclip,
  Smile,
  Loader2,
  Lock,
  CheckCircle2,
  Phone,
  Video as VideoIcon,
  Trash2,
  AlertTriangle,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Conversation() {
  const { convId } = useParams<{ convId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { messages, loading: messagesLoading, sendMessage, reactToMessage, deleteMessage } = useDirectChat(convId || '');
  const { moderateMessage } = useModeration();
  const { showToast, toast, hideToast } = useToast();
  
  const [convData, setConvData] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<{ text: string; reason: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!convId || !user) return;

    const convRef = doc(db, 'conversations', convId);
    const unsubConv = onSnapshot(convRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (!data.participants.includes(user.uid)) {
          showToast("Unauthorized frequency access.", "error");
          navigate('/messages');
          return;
        }
        setConvData(data);
      } else {
        showToast("Signal lost. Channel terminated.", "error");
        navigate('/messages');
      }
    });

    return () => unsubConv();
  }, [convId, user]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom();
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;
    setIsScrolledUp(!isAtBottom);
  };

  const handleSendMessage = async (e?: React.FormEvent, bypassModeration: boolean = false) => {
    e?.preventDefault();
    const textToChat = moderationWarning ? moderationWarning.text : inputText;
    if (!textToChat.trim() || !user || !convId) return;

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
      await sendMessage(textToChat);
    } catch (err) {
      showToast("Transmission failed.", "error");
    }
  };

  const otherId = convData?.participants.find((p: string) => p !== user?.uid);
  const otherUser = convData?.participantData?.[otherId || ''];

  if (authLoading || (messagesLoading && !convData)) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">Synchronizing Neural Link...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="h-20 border-b border-white/5 bg-[#121212]/80 backdrop-blur-xl px-8 flex items-center justify-between flex-shrink-0 z-30 relative overflow-hidden">
        <motion.div 
          animate={{ x: [-100, 1000] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 bottom-0 h-[1px] bg-primary/20 pointer-events-none"
        />
        
        <div className="flex items-center gap-6">
          <Link to="/messages" className="text-gray-400 hover:text-white transition-all active:scale-90">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden p-1 shadow-2xl">
                <img src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.name || 'P'}&background=random&color=fff`} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#121212] rounded-full shadow-lg"></div>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">{otherUser?.name || 'Protocol Node'}</h1>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary animate-pulse">Secure Link Established</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white active:scale-95">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white active:scale-95">
            <VideoIcon className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white active:scale-95">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto no-scrollbar px-8 py-10 space-y-10 relative bg-[#0d0d0d] bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:32px_32px]"
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
                <Lock className="w-10 h-10 text-primary opacity-50" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest mb-2 italic">End-to-End <span className="text-primary not-italic">Encrypted.</span></h2>
            <p className="text-xs text-gray-500 font-medium max-w-xs leading-relaxed uppercase tracking-tighter">Messages sent in this session are restricted to participants. Neural moderation is active.</p>
        </div>

        {messages.map((msg, i) => {
          const isMe = msg.userId === user?.uid;
          const showAvatar = i === 0 || messages[i-1].userId !== msg.userId;
          
          return (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, x: isMe ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn("flex gap-4 group", isMe ? "flex-row-reverse" : "flex-row")}
            >
              <div className="w-8 h-8 flex-shrink-0">
                  {showAvatar && (
                      <img src={msg.userAvatar || `https://ui-avatars.com/api/?name=${msg.userName}&background=random&color=fff`} className="w-full h-full rounded-lg shadow-xl" />
                  )}
              </div>
              <div className={cn("max-w-[70%]", isMe ? "items-end" : "items-start")}>
                 <div className={cn(
                    "px-6 py-4 rounded-[2rem] shadow-full relative transition-all group-hover:scale-[1.01]",
                    isMe ? "bg-primary text-white rounded-tr-none hover:shadow-primary/20" : "bg-white/5 border border-white/5 text-gray-200 rounded-tl-none hover:bg-white/10"
                  )}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    
                    {/* Reactions Section */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className={cn("flex flex-wrap gap-1 mt-3", isMe ? "justify-end" : "justify-start")}>
                            {Object.entries(msg.reactions as Record<string, string[]>).map(([emoji, uids]) => (
                                <button 
                                    key={emoji}
                                    onClick={() => reactToMessage(msg.id, emoji)}
                                    className="px-2 py-0.5 rounded-full bg-white/10 border border-white/5 text-[10px] flex items-center gap-1.5 hover:bg-white/20 transition-all font-black"
                                >
                                    <span>{emoji}</span>
                                    <span className="opacity-60">{uids.length}</span>
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
                  <div className={cn(
                    "mt-2 text-[8px] font-black uppercase tracking-widest flex items-center gap-2",
                    isMe ? "justify-end text-white/30" : "text-gray-600"
                  )}>
                    {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Pending'}
                    {isMe && <CheckCircle2 className="w-3 h-3 text-primary opacity-50" />}
                  </div>
              </div>
              
              {/* Action Buttons (Hover) */}
              <div className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 self-center",
                  isMe ? "mr-2 flex-row-reverse" : "ml-2"
              )}>
                  <button onClick={() => reactToMessage(msg.id, '👍')} className="p-2 bg-white/5 rounded-full hover:bg-primary/20 hover:text-primary transition-all active:scale-90"><Smile className="w-3.5 h-3.5" /></button>
                  {isMe && (
                    <button 
                      onClick={() => {
                        if(window.confirm("Redact signal permanently?")) {
                          deleteMessage(msg.id);
                        }
                      }} 
                      className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-all active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
              </div>
            </motion.div>
          )
        })}
        <div ref={messagesEndRef} />

        {/* Jump to Latest */}
        <AnimatePresence>
            {isScrolledUp && (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={() => scrollToBottom()}
                    className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-primary px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                    <ChevronDown className="w-3 h-3" />
                    Latest Signal
                </motion.button>
            )}
        </AnimatePresence>
      </div>

      {/* Input Section */}
      <div className="p-8 border-t border-white/5 bg-[#0d0d0d] z-30">
        {moderationWarning && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-red-500">Neural Blockade Active</div>
                        <p className="text-xs text-red-100/70">{moderationWarning.reason}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setModerationWarning(null)} className="text-[10px] font-black uppercase text-gray-500 hover:text-white">Adjust Signal</button>
                    <button onClick={() => handleSendMessage(undefined, true)} className="text-[10px] font-black uppercase text-red-500 hover:underline">Force Transmit</button>
                </div>
            </motion.div>
        )}

        <form 
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center gap-4 bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-2 pr-4 focus-within:ring-1 ring-primary/30 transition-all shadow-2xl relative"
        >
          <div className="flex items-center gap-2 pl-2">
            <button type="button" className="text-gray-500 hover:text-white transition-all p-3 active:scale-90">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow bg-transparent border-none outline-none text-white font-medium px-4 py-4 placeholder:text-gray-700 placeholder:italic placeholder:font-normal text-sm"
            placeholder="Transmit secure signal..."
          />
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-500 hover:text-primary transition-all p-3 active:scale-90"
              >
                <Smile className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-6 p-2 bg-[#121212] border border-white/10 rounded-2xl grid grid-cols-6 gap-1 shadow-full z-[60] w-48"
                  >
                     {['👍', '🔥', '🚀', '❤️', '👀', '😂', '💯', '✨', '🙌', '🎉', '💡', '✅', '❌', '⚠️', '🤖', '👾', '🌈', '🍕'].map(emoji => (
                       <button 
                         key={emoji}
                         type="button"
                         onClick={() => {
                           setInputText(prev => prev + emoji);
                           setShowEmojiPicker(false);
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
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                inputText.trim() 
                  ? "bg-primary text-white shadow-primary/20 active:scale-95" 
                  : "bg-white/5 text-gray-700 opacity-50"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={hideToast} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}


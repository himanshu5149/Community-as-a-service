import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, ArrowLeft, Send, Sparkles, AlertTriangle, Loader2, Zap, Trash2, Smile, Paperclip } from 'lucide-react';
import { useAiAgents } from '../hooks/useAiAgents';
import { useAuth } from '../hooks/useAuth';
import { useModeration } from '../hooks/useModeration';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: number;
}

export default function AIAgentChat() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { agents } = useAiAgents();
  const { moderateMessage } = useModeration();
  const agent = agents.find(a => a.id === agentId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<{ text: string; reason: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!agentId) return;
    // Load local history if any
    const saved = localStorage.getItem(`ai_chat_${agentId}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    } else if (agent) {
      // First welcome message
      setMessages([{
        id: 'welcome',
        text: `Neural link established. I am ${agent.name}, ${agent.role}. How can I assist your community architecture today?`,
        isAI: true,
        timestamp: Date.now()
      }]);
    }
  }, [agentId, agent]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ai_chat_${agentId}`, JSON.stringify(messages));
    }
  }, [messages, agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent, bypassModeration = false) => {
    e?.preventDefault();
    const textToChat = moderationWarning ? moderationWarning.text : inputText;
    if (!textToChat.trim() || isTyping) return;

    if (!bypassModeration) {
      // ── Artificial delay to show "Analyzing Signal" only if it actually takes time ──────
      const modTimer = setTimeout(() => setModerationLoading(true), 150);
      try {
        const moderation = await moderateMessage(textToChat);
        clearTimeout(modTimer);
        setModerationLoading(false);
        
        if (!moderation.isSafe) {
          setModerationWarning({
            text: textToChat,
            reason: moderation.reason || "This signal violates community protocols."
          });
          return;
        }
      } catch (err) {
        clearTimeout(modTimer);
        setModerationLoading(false);
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToChat,
      isAI: false,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setModerationWarning(null);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToChat,
          agentId: agent?.id,
          agentName: agent?.name,
          history: messages.slice(-5).map(m => `${m.isAI ? agent?.name : 'User'}: ${m.text}`).join('\n')
        })
      });

      const data = await response.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || data.response || "Neural feedback looped. Try again.",
        isAI: true,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Neural link error:", err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Neural link timeout. Intelligence node unreachable.",
        isAI: true,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Purge all neural memory for this node?")) {
      setMessages([]);
      localStorage.removeItem(`ai_chat_${agentId}`);
    }
  };

  if (!agent) {
    return (
      <div className="h-screen bg-bg-dark flex items-center justify-center p-10 text-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-widest">Identifying Intelligence Node...</p>
      </div>
    );
  }

  return (
    <div className="pt-20 h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-24 border-b border-white/5 bg-[#121212]/80 backdrop-blur-xl px-8 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-6">
          <Link to={`/ai/${agentId}`} className="text-gray-400 hover:text-white transition-all active:scale-90">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div 
                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center p-2"
                style={{ boxShadow: `0 0 30px ${agent.accentColor}22` }}
              >
                {agent.avatarUrl ? (
                  <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Bot className="w-8 h-8 text-primary" style={{ color: agent.accentColor }} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#121212] rounded-full shadow-lg h-inner"></div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter italic">{agent.name} <span className="text-primary not-italic" style={{ color: agent.accentColor }}>Link.</span></h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ backgroundColor: agent.accentColor }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{agent.role}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={clearHistory}
            className="p-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto no-scrollbar px-8 py-10 space-y-12 relative bg-[#0d0d0d] bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:32px_32px]">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-4 max-w-4xl mx-auto", msg.isAI ? "flex-row" : "flex-row-reverse")}
          >
            <div className="w-10 h-10 flex-shrink-0">
               <div className={cn(
                 "w-full h-full rounded-xl flex items-center justify-center p-1.5 border transition-all",
                 msg.isAI ? "bg-white/5 border-white/10" : "bg-primary border-primary shadow-lg shadow-primary/20"
               )}>
                 {msg.isAI ? (
                    agent.avatarUrl ? <img src={agent.avatarUrl} className="w-full h-full rounded-md object-cover" /> : <Bot className="w-full h-full text-white/50" />
                 ) : (
                    <div className="text-[10px] font-black">{user?.displayName?.[0] || 'U'}</div>
                 )}
               </div>
            </div>
            <div className={cn("flex flex-col space-y-2", msg.isAI ? "items-start" : "items-end")}>
               <div className={cn(
                  "px-8 py-5 rounded-[2.5rem] relative shadow-2xl transition-all hover:scale-[1.01]",
                  msg.isAI 
                    ? "bg-white/5 border border-white/10 text-gray-100 rounded-tl-none font-medium leading-relaxed max-w-[85%]" 
                    : "bg-[#181818] border border-white/5 text-white rounded-tr-none font-bold max-w-[85%] shadow-primary/5"
               )}>
                  <p className="text-base">{msg.text}</p>
               </div>
               <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 px-4">
                 {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 max-w-4xl mx-auto"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5">
               <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            <div className="bg-white/5 border border-white/10 px-8 py-5 rounded-[2.5rem] rounded-tl-none flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
          </motion.div>
        )}

        {moderationLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 flex-row-reverse max-w-4xl mx-auto"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center p-1.5">
               <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div className="bg-primary/5 border border-primary/20 px-6 py-3 rounded-2xl flex items-center gap-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-primary">Analyzing Signal Protocol...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-10 border-t border-white/5 bg-[#0d0d0d]">
        {moderationWarning && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto mb-6 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Signal Blocked</div>
                <p className="text-sm text-red-100/70">{moderationWarning.reason}</p>
              </div>
            </div>
            <div className="flex gap-6">
              <button onClick={() => setModerationWarning(null)} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white">Adjust Signal</button>
              <button onClick={() => handleSendMessage(undefined, true)} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline">Force Sync</button>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4 group">
          <div className="flex-grow relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" style={{ backgroundColor: `${agent.accentColor}33` }} />
            <div className="relative bg-[#1a1a1a] border border-white/10 rounded-[3rem] p-2 flex items-center gap-2 shadow-2xl focus-within:border-primary/50 transition-all overflow-hidden">
               <button type="button" className="p-4 text-gray-500 hover:text-white transition-colors">
                  <Paperclip className="w-6 h-6" />
               </button>
               <input 
                 autoFocus
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 disabled={isTyping}
                 placeholder={`Query ${agent.name}...`}
                 className="flex-grow bg-transparent border-none outline-none py-4 px-2 text-white font-medium placeholder:text-gray-700 placeholder:italic"
               />
               <button type="button" className="p-4 text-gray-500 hover:text-primary transition-colors">
                  <Smile className="w-6 h-6" />
               </button>
            </div>
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={cn(
               "w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl",
               inputText.trim() && !isTyping 
                ? "bg-primary text-white shadow-primary/20 hover:scale-110 active:scale-95" 
                : "bg-white/5 text-gray-700"
            )}
            style={{ backgroundColor: (inputText.trim() && !isTyping) ? agent.accentColor : undefined }}
          >
            <Send className="w-6 h-6" />
          </button>
        </form>

        <div className="mt-8 flex justify-center">
           <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
             <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-primary" /> Low Latency</div>
             <div className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-primary" /> Neural Link Active</div>
           </div>
        </div>
      </div>
    </div>
  );
}

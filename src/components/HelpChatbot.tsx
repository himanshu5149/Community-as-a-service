import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Loader2, Bot, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

const CAAS_CONTEXT = `You are the CaaS OS Assistant — a helpful AI guide for CaaS (Community as a Service), a Community Operating System built by Himanshu from Janakpur, Nepal.

CaaS OS Features you know about:
- Groups/Communities: Users create and join communities organized by vertical (Tech, Fitness, Arts, Education, Business, Food)
- Channels: Each group has text channels like #general, #announcements etc
- Real-time Chat: Discord-style messaging with reactions, replies, pinning, AI moderation
- AI Moderation: Gemini AI automatically flags toxic content in real-time
- Direct Messages: Private 1-on-1 conversations between members  
- AI Agents: Personas like Aria, Nova, Muse, Sage, Bridge that help communities
- Spaces: Cross-community collaboration rooms where multiple groups intersect
- Events: Community events with RSVP functionality
- Members: Profile pages, roles (admin/moderator/member), reputation system
- Dashboard: OS-style desktop showing all your communities, stats, notifications
- Marketplace: Install pre-built community blueprints in one click
- Developer Hub: API keys, webhooks, code examples for extending CaaS
- Settings: Profile, notifications, AI config, privacy controls
- Onboarding: 3-step wizard to create your first community
- Explore: Discover and join public communities
- Pricing: Starter $49/mo, Professional $199/mo, Enterprise custom — via Lemon Squeezy
- Blog: Technical articles about community building
- Notifications: Real-time alerts for messages, mentions, AI actions

Navigation routes:
/ = Home, /groups = Communities, /explore = Discover, /dashboard = OS Desktop
/messages = Direct Messages, /spaces = Neural Spaces, /events = Events
/members = Members, /ai = AI Agents, /ai-nexus = AI Management
/marketplace = Blueprints, /developer = API Hub, /settings = Control Panel
/pricing = Plans, /blog = Journal, /admin = Moderation Dashboard
/onboarding = Create first community

Answer questions helpfully and concisely. If someone reports a bug or issue, acknowledge it and tell them it will be logged. Keep responses under 150 words. Use a friendly but technical tone matching the CaaS OS brand.`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'How do I create a community?',
  'How does AI moderation work?',
  'What is a Space?',
  'How do I invite members?',
];

export default function HelpChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hey${user?.displayName ? ` ${user.displayName.split(' ')[0]}` : ''}! 👋 I'm your CaaS OS Assistant. Ask me anything about how the app works, or report a bug and I'll log it for the team.`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(p => [...p, userMsg]);
    setLoading(true);

    // Check if reporting a bug
    const isBugReport = /bug|error|broken|not working|issue|problem|crash|fail/i.test(content);

    try {
      // Build conversation history for context
      const history = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');

      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'caas-help',
          message: content,
          systemContext: CAAS_CONTEXT,
          history,
        }),
      });

      let reply = '';
      if (response.ok) {
        const data = await response.json();
        reply = data.reply || data.response || data.content || '';
      }

      if (!reply) {
        // Fallback local answers for common questions
        if (/create.*community|new.*group|start.*community/i.test(content)) {
          reply = "Go to **Dashboard** → click **New Community**, or visit **/onboarding** for a guided 3-step setup. You'll name your community, choose a category, set access (open/invite-only), and launch with a default #general channel ready.";
        } else if (/moderat|ai.*safe|toxic/i.test(content)) {
          reply = "CaaS uses **Gemini AI** to scan every message in real-time. It flags toxic content, hate speech, and policy violations automatically. Admins see flagged messages in **/admin**. You can tune sensitivity in **Settings → AI Config**.";
        } else if (/space|neural space/i.test(content)) {
          reply = "**Spaces** are cross-community rooms where multiple groups collaborate. Think of them as shared meeting rooms across different communities. Find them at **/spaces** — any member can create or join a Space.";
        } else if (/invite|add member/i.test(content)) {
          reply = "Share your group link from the group settings. For invite-only communities, go to your group → Settings → copy the invite link. Members who join get the **member** role automatically.";
        } else if (/price|cost|plan|payment/i.test(content)) {
          reply = "CaaS has 3 plans: **Starter $49/mo** (500 members, 1 group), **Professional $199/mo** (5,000 members, 3 groups, custom domain), **Enterprise** (unlimited, custom pricing). Visit **/pricing** to deploy your plan via Lemon Squeezy.";
        } else {
          reply = "I can help you navigate CaaS OS! Try asking about creating communities, AI moderation, pricing, spaces, or any feature. You can also report bugs and I'll log them for the team.";
        }
      }

      // Log bug reports to Firestore
      if (isBugReport && user) {
        try {
          await addDoc(collection(db, 'reports'), {
            type: 'bug_report',
            content,
            userId: user.uid,
            userEmail: user.email,
            source: 'chatbot',
            status: 'open',
            createdAt: serverTimestamp(),
          });
          reply += '\n\n✅ **Bug logged** — our team will investigate. Thank you for reporting!';
        } catch { }
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages(p => [...p, assistantMsg]);
      if (!open) setUnread(u => u + 1);

    } catch {
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Try again in a moment.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\*\/(.*?)\*/g, '<code class="text-primary bg-primary/10 px-1 rounded text-xs">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setOpen(true)}
              className="relative w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgba(83,74,183,0.5)] hover:scale-110 active:scale-95 transition-all"
            >
              <MessageSquare className="w-6 h-6 text-white" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center">
                  {unread}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 right-0 w-[360px] h-[520px] bg-[#111] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-primary/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-white">CaaS Assistant</div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Online</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-2", msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-1",
                      msg.role === 'user' ? 'bg-white/10' : 'bg-primary/20'
                    )}>
                      {msg.role === 'user'
                        ? <User className="w-3.5 h-3.5 text-gray-300" />
                        : <Bot className="w-3.5 h-3.5 text-primary" />
                      }
                    </div>
                    <div className={cn(
                      "max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                    )}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  </motion.div>
                ))}

                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Quick questions</div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map(q => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="text-[10px] font-bold px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-primary/20 hover:border-primary/30 hover:text-primary transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-4 pb-4 pt-2 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Ask anything or report a bug..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 ring-primary/50 transition-all font-medium"
                  />
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/80 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {loading
                      ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                      : <Send className="w-4 h-4 text-white" />
                    }
                  </button>
                </div>
                <div className="text-center mt-2">
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Powered by CaaS AI · Gemini</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

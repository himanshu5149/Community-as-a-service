import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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
  Video as VideoIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Conversation() {
  const { convId } = useParams<{ convId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [convData, setConvData] = useState<any>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!convId || !user) return;

    setLoading(true);
    
    // Fetch conversation metadata
    const convRef = doc(db, 'conversations', convId);
    const unsubConv = onSnapshot(convRef, (snap) => {
      setConvData(snap.data());
    });

    // Fetch messages
    const q = query(
      collection(db, `conversations/${convId}/messages`),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubMsgs = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => {
      unsubConv();
      unsubMsgs();
    };
  }, [convId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !convId) return;

    const text = inputText;
    setInputText('');
    
    const path = `conversations/${convId}/messages`;
    await addDoc(collection(db, path), {
      userId: user.uid,
      userName: user.displayName,
      userAvatar: user.photoURL,
      text,
      type: 'text',
      createdAt: serverTimestamp()
    });

    // Update conversation last message for the list view
    await updateDoc(doc(db, 'conversations', convId), {
      lastMessage: text,
      lastMessageAt: serverTimestamp()
    });
  };

  const otherId = convData?.participants.find((p: string) => p !== user?.uid);
  const otherUser = convData?.participantData?.[otherId || ''];

  if (loading && !convData) {
    return (
      <div className="h-screen bg-bg-dark flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20 h-screen bg-bg-dark text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-24 border-b border-white/5 bg-white/5 backdrop-blur-3xl px-8 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-6">
          <Link to="/messages" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden p-1">
              <img src={otherUser?.avatar || `https://i.pravatar.cc/100?u=${otherId}`} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{otherUser?.name || 'Protocol Node'}</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Live Secure Connection</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400">
            <Phone className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400">
            <VideoIcon className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto no-scrollbar px-8 py-10 space-y-8 relative">
        <div className="fixed inset-0 pointer-events-none opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]"></div>
        </div>

        {messages.map((msg) => {
          const isMe = msg.userId === user?.uid;
          return (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex max-w-[80%]", isMe ? "ml-auto" : "mr-auto")}
            >
              <div className={cn(
                "px-6 py-4 rounded-[1.8rem]",
                isMe ? "bg-primary text-white rounded-br-none" : "bg-white/5 border border-white/5 text-white rounded-bl-none"
              )}>
                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                <div className={cn(
                  "mt-2 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1",
                  isMe ? "text-white/40 justify-end" : "text-gray-600"
                )}>
                  {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Transmitting'}
                  {isMe && <CheckCircle2 className="w-2.5 h-2.5" />}
                </div>
              </div>
            </motion.div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-8 pb-12 border-t border-white/5 bg-bg-dark z-30">
        <form 
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center gap-4 bg-white/5 border border-white/5 rounded-[2.5rem] p-2 pr-4 focus-within:border-primary/50 transition-all shadow-2xl"
        >
          <div className="flex items-center gap-2 pl-4">
            <button type="button" className="text-gray-500 hover:text-white transition-colors p-3">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow bg-transparent border-none outline-none text-white font-medium px-4 py-4 placeholder:text-gray-600 placeholder:italic"
            placeholder="Transmit private signal..."
          />
          
          <div className="flex items-center gap-2">
            <button type="button" className="text-gray-500 hover:text-white transition-colors p-3">
              <Smile className="w-5 h-5" />
            </button>
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                inputText.trim() 
                  ? "bg-primary text-white shadow-[0_10px_30px_rgba(83,74,183,0.4)]" 
                  : "bg-white/5 text-gray-700"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

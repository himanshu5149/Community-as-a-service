import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useGroups, Group } from '../hooks/useGroups';
import { useChannels, Channel } from '../hooks/useChannels';
import { useGroupMembers } from '../hooks/useGroupMembers';
import { useGroupRoles } from '../hooks/useGroupRoles';
import { useAiAgents, AiAgent } from '../hooks/useAiAgents';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Users, 
  Bot, 
  Hash, 
  ArrowLeft, 
  Calendar, 
  Shield, 
  Zap, 
  Clock, 
  Activity, 
  Crown, 
  Compass, 
  ChevronRight, 
  Plus, 
  MessageSquare, 
  Loader2, 
  Share2, 
  MessageCircle,
  Megaphone,
  User,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 1. Fetch group profile safely
  const { groups, joinGroup } = useGroups();
  const [localGroup, setLocalGroup] = useState<Group | null>(null);
  const [fetchingLocal, setFetchingLocal] = useState(false);
  const [joining, setJoining] = useState(false);

  // Derive group instance
  const group = groups.find(g => g.id === groupId) || localGroup;

  // 2. Fetch sub-collections
  const { channels, loading: channelsLoading } = useChannels(groupId || '');
  const { members, loading: membersLoading } = useGroupMembers(groupId || '');
  const { member: membership, isMember, permissions, loading: rolesLoading } = useGroupRoles(groupId || '');
  const { agents, loading: agentsLoading } = useAiAgents(groupId || '');

  // 3. Find the general frequency for live logs
  const generalChannel = channels.find(c => c.name.toLowerCase() === 'general') || channels[0];
  const { messages, loading: chatLoading } = useChat(groupId || '', generalChannel?.id);

  // 4. Group lookup effect for direct link reloading
  useEffect(() => {
    if (!groupId) return;
    
    const fetchGroupDoc = async () => {
      if (groups.some(g => g.id === groupId)) return;
      setFetchingLocal(true);
      try {
        const docRef = doc(db, 'groups', groupId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLocalGroup({
            id: docSnap.id,
            ...docSnap.data()
          } as Group);
        }
      } catch (err) {
        console.error("Failed to query group parameters:", err);
      } finally {
        setFetchingLocal(false);
      }
    };

    fetchGroupDoc();
  }, [groupId, groups]);

  const handleJoinFrequency = async () => {
    if (!groupId) return;
    setJoining(true);
    try {
      await joinGroup(groupId);
    } catch (e) {
      console.error("Failed to sequence connection:", e);
    } finally {
      setJoining(false);
    }
  };

  if (fetchingLocal || (groups.length === 0 && !group)) {
    return (
      <div className="pt-24 min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Neural Parameters...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="pt-24 min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white text-center px-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black mb-2">Cluster Shard Not Found</h2>
        <p className="text-gray-500 max-w-sm mb-8 text-sm">The community cluster you accessed does not exist or your permissions are insufficient.</p>
        <Link to="/groups" className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
          Back to Networks
        </Link>
      </div>
    );
  }

  const creationDate = (group as any).createdAt 
    ? new Date((group as any).createdAt.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'System Pre-Seed';

  const groupAccent = group.accentColor || '#3B82F6';

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Glow Effect matching group accent */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 opacity-[0.08] blur-[120px] pointer-events-none rounded-full"
        style={{ backgroundColor: groupAccent }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link 
            to="/groups" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Shards
          </Link>
        </div>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 pb-12 border-b border-white/5 mb-12"
        >
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center max-w-4xl">
            {/* Visual Cluster Icon Card */}
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.8rem] flex items-center justify-center text-white shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white/10 relative shrink-0"
              style={{ 
                backgroundColor: groupAccent,
                boxShadow: `0 20px 50px -15px ${groupAccent}30`
              }}
            >
              <div className="text-4xl sm:text-5xl font-black italic select-none">
                {group.name[0]}
              </div>
            </div>

            {/* Core Txt */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span 
                  className="px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] rounded-md bg-white/5 border border-white/5"
                  style={{ color: groupAccent }}
                >
                  {group.category}
                </span>
                <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {creationDate}
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none mb-4">
                {group.name}
              </h1>
              
              <p className="text-gray-400 text-base sm:text-lg font-medium leading-relaxed max-w-2xl">
                {group.description}
              </p>
            </div>
          </div>

          {/* Action Hub Panel */}
          <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto">
            {isMember ? (
              <Link 
                to={`/groups/${group.id}`}
                className="w-full lg:w-auto text-center px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm tracking-wide shadow-xl shadow-primary/25 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Enter Core Frequency
              </Link>
            ) : (
              <button 
                onClick={handleJoinFrequency}
                disabled={joining}
                className="w-full lg:w-auto text-center px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest text-[#ececec] transition-all flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sequencing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Interface Frequency
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Dashboard Grid Index */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Integrant Members', val: members.length, icon: <Users className="w-4 h-4" />, color: 'text-primary' },
            { label: 'Sub-Channels', val: channels.length, icon: <Hash className="w-4 h-4" />, color: 'text-green-400' },
            { label: 'AI Operatives', val: agents.length, icon: <Bot className="w-4 h-4" />, color: 'text-amber-400' },
            { label: 'Total Transmissions', val: messages.length, icon: <Activity className="w-4 h-4" />, color: 'text-blue-400' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                  {stat.label}
                </span>
                <span className="text-2xl sm:text-3xl font-black">
                  {stat.val}
                </span>
              </div>
              <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center", stat.color)}>
                {stat.icon}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content Layout Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Left Columns */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Connected Channels Area */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" /> Connected Transmissions
                </h2>
                {isMember && (
                  <Link 
                    to={`/groups/${group.id}`} 
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5"
                  >
                    Open Console <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {channelsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(n => (
                    <div key={n} className="h-16 bg-white/[0.02] border border-white/5 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : channels.length === 0 ? (
                <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                  <Hash className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No active frequencies mapped for this cluster node.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {channels.map((channel, idx) => (
                    <motion.div 
                      key={channel.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => isMember ? navigate(`/groups/${group.id}/channels/${channel.id}`) : handleJoinFrequency()}
                      className="group bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-[1.3rem] p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {channel.type === 'announcements' ? (
                              <Megaphone className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Hash className="w-4 h-4 text-primary" />
                            )}
                            <span className="font-black text-sm text-[#ececec] uppercase tracking-wide group-hover:text-primary transition-colors">
                              {channel.name}
                            </span>
                          </div>
                          
                          <span className="text-[9px] font-black uppercase text-gray-500 px-2 py-0.5 bg-white/5 rounded-md">
                            {channel.type || 'text'}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-xs font-medium line-clamp-2 leading-relaxed mb-6">
                          {channel.description || 'Welcome to this secure neural frequency shard.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <span>Frequency Shard</span>
                        <span className="text-primary group-hover:translate-x-1.5 transition-transform flex items-center gap-1.5">
                          Interface <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Live Feed / Transmissions */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Live Node Transmissions
              </h2>
              
              {chatLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-16 bg-white/[0.02] border border-white/5 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                  <MessageCircle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">Transmitting baseline signal. No recent transmissions recorded.</p>
                </div>
              ) : (
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                  {/* Outer terminal mock header */}
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5 pb-4">
                    <span>Frequency channel: #{generalChannel?.name}</span>
                    <span>Feed: REALTIME</span>
                  </div>
                  
                  <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                    {messages.slice(-8).map((msg) => {
                      const msgTime = msg.createdAt 
                        ? new Date(msg.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '';
                      return (
                        <div key={msg.id} className="flex gap-4 items-start group">
                          <img 
                            src={msg.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.userId}`} 
                            alt={msg.userName}
                            className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-grow">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-black text-xs text-[#ececec]">
                                {msg.userName}
                              </span>
                              {msg.isAI && (
                                <span 
                                  className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: `${msg.aiColor || '#534ab7'}20`, color: msg.aiColor || '#534ab7', border: `1px solid ${msg.aiColor || '#534ab7'}40` }}
                                >
                                  {msg.aiRole || 'Operative'}
                                </span>
                              )}
                              <span className="text-[9px] font-mono text-gray-500">
                                {msgTime}
                              </span>
                            </div>
                            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium break-words">
                              {msg.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Columns (AI Agents & Human Grid) */}
          <div className="space-y-12">
            
            {/* AI Custom Operatives */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-6 flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" /> Connected AI Operatives
              </h2>

              {agentsLoading ? (
                <div className="h-20 bg-white/[0.02] border border-white/5 animate-pulse rounded-2xl" />
              ) : agents.length === 0 ? (
                <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                  <Bot className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-xs font-medium">No specialized AI shards localized in this community node.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div 
                      key={agent.id}
                      className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl p-5 flex gap-4 pr-3 transition-colors"
                    >
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 text-white font-bold select-none"
                        style={{ 
                          borderColor: `${agent.accentColor || '#3b82f6'}40`,
                          backgroundColor: `${agent.accentColor || '#3b82f6'}15`,
                          color: agent.accentColor || '#3b82f6'
                        }}
                      >
                        {agent.avatarUrl ? (
                          <img 
                            src={agent.avatarUrl} 
                            alt={agent.name} 
                            className="w-full h-full object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Bot className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-sm text-[#efefef] truncate">{agent.name}</h4>
                          <span 
                            className="text-[8px] font-black uppercase tracking-wider px-1 bg-white/5 rounded-md text-gray-400 border border-white/5 shrink-0"
                            style={{ color: agent.accentColor }}
                          >
                            {agent.role}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-xs font-medium line-clamp-2 leading-relaxed mb-3">
                          {agent.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {agent.expertise.slice(0, 3).map((exp, expIdx) => (
                            <span 
                              key={expIdx}
                              className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 rounded"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Direct dialogue trigger */}
                      {isMember && (
                        <div className="flex items-center justify-center shrink-0">
                          <button 
                            onClick={() => navigate(`/ai/${agent.id}/chat`)}
                            className="p-2 border border-white/5 hover:border-white/20 bg-white/[0.01] hover:bg-white/5 rounded-xl text-primary transition-all"
                            title="Command AI Agent"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Human Operators Panel */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-6 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Active Cluster Operators
              </h2>

              {membersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-12 bg-white/[0.02] animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.01]">
                  <Users className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-xs font-medium">Awaiting operator connection signals.</p>
                </div>
              ) : (
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  {members.map((op) => {
                    const isGroupOwner = op.role === 'admin' || op.uid === group.ownerId;
                    const opDate = op.joinedAt 
                      ? new Date((op.joinedAt as any).seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : 'Legacy';
                    return (
                      <div key={op.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={op.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${op.uid}`} 
                            alt={op.displayName} 
                            className="w-8 h-8 rounded-xl object-cover shrink-0 border border-white/5"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-[#ececec] truncate flex items-center gap-1.5">
                              {op.displayName}
                              {isGroupOwner && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                            </div>
                            <span className="text-[9px] font-medium text-gray-500 block leading-none mt-0.5">
                              Joined {opDate}
                            </span>
                          </div>
                        </div>

                        <span className={cn(
                          "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border",
                          isGroupOwner 
                            ? "bg-amber-400/10 text-amber-400 border-amber-400/20" 
                            : op.role === 'moderator' 
                            ? "bg-purple-400/10 text-purple-400 border-purple-400/20" 
                            : "bg-white/5 text-gray-400 border-white/5"
                        )}>
                          {isGroupOwner ? 'ADMIN' : op.role === 'moderator' ? 'MOD' : 'AGENT'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { User, Mail, Calendar, ShieldCheck, Activity, Award, Settings, Loader2, UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { db, auth, signInWithGoogle } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useSocial } from '../hooks/useSocial';
import { useConversations } from '../hooks/useConversations';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Profile() {
  const { userId } = useParams();
  const { user, isAdmin } = useAuth();
  const { sendRequest, friends } = useSocial();
  const { startConversation } = useConversations();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = user?.uid === userId;
  const isFriend = friends.includes(userId || '');

  const handleStartDM = async () => {
    if (!profile || !userId) return;
    const convId = await startConversation(userId, profile.displayName, profile.photoURL);
    if (convId) {
      navigate(`/messages/${convId}`);
    }
  };

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) return;
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="h-screen bg-bg-dark flex items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const displayName = profile?.displayName || (isOwnProfile ? user?.displayName : null) || 'Community Member';
  const displayEmail = isOwnProfile ? (profile?.email || user?.email) : 'Encrypted Frequency';
  const displayAvatar = profile?.photoURL || (isOwnProfile ? user?.photoURL : null);

  return (
    <div className="pt-32 min-h-screen bg-bg-dark text-white px-6 md:px-10 pb-40">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row items-center gap-12 mb-20">
          <div className="relative">
             <div className="w-48 h-48 rounded-[3rem] bg-primary/10 border border-primary/20 flex items-center justify-center relative overflow-hidden group">
              {displayAvatar ? (
                <img src={displayAvatar} alt="User avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-24 h-24 text-primary opacity-40" />
              )}
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Settings className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            {isAdmin && userId === user?.uid && (
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-bg-dark">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          <div className="flex-grow text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 text-center md:text-left justify-center md:justify-start">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">{displayName}</h1>
              <span className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">ID: {userId?.slice(0, 8)}</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-8 items-center">
               <div className="flex items-center gap-3 text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-bold">{displayEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold">Joined April 2026</span>
              </div>
              
              {!isOwnProfile && (
                <div className="flex items-center gap-4 ml-auto md:ml-0">
                  <button 
                    onClick={() => {
                      if (auth.currentUser) {
                        sendRequest(userId!);
                      } else {
                        signInWithGoogle();
                      }
                    }}
                    disabled={isFriend}
                    className={cn(
                      "px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all",
                      isFriend ? "bg-green-500/10 text-green-500" : "bg-primary text-white hover:scale-105 shadow-xl shadow-primary/20"
                    )}
                  >
                    {isFriend ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isFriend ? "Connected" : "Connect"}
                  </button>
                  <button 
                    onClick={handleStartDM}
                    className="p-3 bg-white/5 border border-white/5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Send Private Signal"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="card-gloss p-8 space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">XP Level</span>
                <span className="text-xl font-bold tracking-tighter">Level 12 Specialist</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
               <div className="w-3/4 h-full bg-orange-500 shadow-lg shadow-orange-500/40" />
            </div>
          </div>

          <div className="card-gloss p-8 flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Reputation</span>
              <span className="text-xl font-bold tracking-tighter">Gold Contributor</span>
            </div>
          </div>

          <div className="card-gloss p-8 flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Neural Links</span>
              <span className="text-xl font-bold tracking-tighter">154 Active Feeds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

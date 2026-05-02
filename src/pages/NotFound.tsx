import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, ArrowLeft, Home, Users, Search, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickLinks = user ? [
    { label: 'Dashboard', icon: <Home className="w-4 h-4" />, to: '/dashboard' },
    { label: 'Communities', icon: <Users className="w-4 h-4" />, to: '/groups' },
    { label: 'Explore', icon: <Search className="w-4 h-4" />, to: '/explore' },
    { label: 'Messages', icon: <MessageSquare className="w-4 h-4" />, to: '/messages' },
  ] : [
    { label: 'Home', icon: <Home className="w-4 h-4" />, to: '/' },
    { label: 'Explore', icon: <Search className="w-4 h-4" />, to: '/explore' },
    { label: 'Pricing', icon: <Users className="w-4 h-4" />, to: '/pricing' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-10 text-white">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-8"
        >
          <span className="text-[12rem] leading-none font-black italic tracking-tighter opacity-5 select-none">404</span>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Radio className="w-12 h-12 text-primary animate-pulse mb-4" />
            <h1 className="text-5xl font-bold tracking-tighter">
              Signal <span className="text-primary italic">Lost.</span>
            </h1>
          </div>
        </motion.div>

        <p className="mb-10 text-lg text-gray-400 font-medium max-w-lg mx-auto">
          This frequency doesn't exist in the CaaS network. Let's get you back on track.
        </p>

        {/* Quick navigation */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {quickLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 hover:border-white/20 transition-all"
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-3 text-gray-500 hover:text-white transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    </div>
  );
}

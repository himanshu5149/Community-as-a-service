import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-10 text-white">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <span className="text-[15rem] leading-none font-black italic tracking-tighter opacity-10">404</span>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Radio className="w-12 h-12 text-primary animate-pulse mb-6" />
            <h1 className="text-6xl font-bold tracking-tighter">Signal <span className="text-primary italic">Lost.</span></h1>
          </div>
        </motion.div>
        
        <p className="mt-10 mb-12 text-xl text-gray-400 font-medium max-w-lg mx-auto">
          You've reached a frequency that doesn't exist in our current community nexus.
        </p>

        <Link 
          to="/"
          className="inline-flex items-center gap-4 bg-white text-bg-dark px-10 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to Base Frequency
        </Link>
      </div>
    </div>
  );
}

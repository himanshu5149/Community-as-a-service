import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const colors = {
    success: 'border-green-500/20 bg-green-500/10',
    error: 'border-red-500/20 bg-red-500/10',
    info: 'border-blue-500/20 bg-blue-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[320px] ${colors[type]}`}
    >
      {icons[type]}
      <p className="text-sm font-bold text-white flex-grow tracking-tight">{message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  return { toast, showToast, hideToast };
}

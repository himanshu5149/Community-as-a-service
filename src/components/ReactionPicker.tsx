import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Smile, Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
  align?: 'left' | 'right';
}

export function ReactionPicker({ onSelectEmoji, align = 'right' }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setShowFullPicker(false);
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const handleEmojiClick = (emojiData: any) => {
    if (emojiData && emojiData.emoji) {
      onSelectEmoji(emojiData.emoji);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all active:scale-95"
        title="Add reaction"
      >
        <Smile className="w-4.5 h-4.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {isMobile ? (
              // Mobile View: Slide-up Drawer/Modal at the bottom
              <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150] flex flex-col justify-end">
                {/* Backdrop Click */}
                <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />
                
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="bg-[#121212] border-t border-white/10 rounded-t-[2.5rem] p-6 max-h-[85vh] flex flex-col overflow-hidden max-w-md mx-auto w-full shadow-2xl"
                >
                  {/* Handle bar */}
                  <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 shrink-0" />
                  
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Add Reaction</span>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quick Reactions */}
                  <div className="flex justify-around items-center gap-2 mb-6 p-4 bg-white/5 rounded-2xl shrink-0">
                    {quickEmojis.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          onSelectEmoji(emoji);
                          setIsOpen(false);
                        }}
                        className="text-3xl hover:scale-125 hover:rotate-6 active:scale-90 transition-all filter drop-shadow-md duration-200"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowFullPicker(!showFullPicker)}
                      className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center transition-all bg-white/5 border border-white/5 active:scale-90",
                        showFullPicker ? "text-primary border-primary/30 rotate-45" : "text-gray-400"
                      )}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Full Picker Panel Container */}
                  <div className="flex-grow overflow-y-auto no-scrollbar min-h-[350px]">
                    {showFullPicker && (
                      <div className="flex justify-center overflow-hidden rounded-2xl border border-white/5">
                        <EmojiPicker
                          lazyLoadEmojis={true}
                          theme={Theme.DARK}
                          width="100%"
                          height={350}
                          skinTonesDisabled={true}
                          searchDisabled={false}
                          previewConfig={{ showPreview: false }}
                          onEmojiClick={handleEmojiClick}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            ) : (
              // Desktop View: Hover Absolute Tooltip-like popup
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "absolute z-[100] bg-[#161616] border border-white/10 rounded-2xl p-2.5 shadow-2xl flex flex-col gap-2.5",
                  align === 'right' ? 'right-0 top-full mt-1.5' : 'left-0 top-full mt-1.5',
                  showFullPicker ? 'w-[325px]' : 'w-auto'
                )}
              >
                {/* Quick Selection */}
                <div className="flex items-center gap-1.5">
                  {quickEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onSelectEmoji(emoji);
                        setIsOpen(false);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:scale-125 hover:rotate-6 active:scale-90 transition-all duration-200"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowFullPicker(!showFullPicker)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 active:scale-90",
                      showFullPicker ? "text-primary border-primary/30 rotate-45" : "text-gray-400"
                    )}
                    title="All Emojis"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* full Picker */}
                {showFullPicker && (
                  <div className="border-t border-white/5 pt-2 mt-1 rounded-xl overflow-hidden shadow-inner">
                    <EmojiPicker
                      theme={Theme.DARK}
                      width="100%"
                      height={320}
                      skinTonesDisabled={true}
                      searchDisabled={false}
                      previewConfig={{ showPreview: false }}
                      onEmojiClick={handleEmojiClick}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

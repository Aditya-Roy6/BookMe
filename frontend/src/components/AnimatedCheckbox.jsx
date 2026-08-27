import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export default function AnimatedCheckbox({
  checked,
  onChange,
  label,
  description,
  className = '',
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onChange(!checked)}
      className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all cursor-pointer select-none text-left ${
        checked
          ? 'bg-[#181818] border-[#1ed760]/60 shadow-[0_0_15px_rgba(30,215,96,0.15)] text-white'
          : 'bg-[#121212] border-white/10 hover:border-white/25 text-[#b3b3b3]'
      } ${className}`}
    >
      {/* Animated Circular Badge */}
      <motion.div
        animate={{
          scale: checked ? [0.85, 1.25, 1] : 1,
          backgroundColor: checked ? '#1ed760' : '#222222',
          borderColor: checked ? '#1ed760' : '#444444',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors shadow-sm"
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 45 }}
              transition={{ type: 'spring', stiffness: 650, damping: 22 }}
              className="flex items-center justify-center"
            >
              <Check className="w-3.5 h-3.5 text-black stroke-[3.5]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Label */}
      <div className="min-w-0">
        <span
          className={`text-xs font-bold transition-colors block leading-tight ${
            checked ? 'text-white' : 'text-[#a3a3a3] group-hover:text-white'
          }`}
        >
          {label}
        </span>
        {description && (
          <span className="text-[10px] text-[#777777] block mt-0.5 leading-tight">{description}</span>
        )}
      </div>
    </motion.button>
  );
}

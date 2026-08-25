import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, AlertTriangle, X, Sparkles } from 'lucide-react';
import { Info } from '../components/MappedIcons';

const ToastContext = createContext(null);

let toastCount = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', message, title, duration = 4000 }) => {
    const id = ++toastCount;
    const newToast = { id, type, message, title, duration };

    setToasts((prev) => [...prev.slice(-1), newToast]); // keep latest for ultra-clean look

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title, duration: 4000 }),
    error: (message, title) => addToast({ type: 'error', message, title, duration: 4000 }),
    warning: (message, title) => addToast({ type: 'warning', message, title, duration: 4000 }),
    info: (message, title) => addToast({ type: 'info', message, title, duration: 4000 }),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}

      {/* Top-Slide Rounded Notification Pill Container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-3 pointer-events-none w-full max-w-lg px-4">
        <AnimatePresence mode="sync">
          {toasts.map((t) => {
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';
            const isSuccess = t.type === 'success';

            return (
              <motion.div
                key={t.id}
                initial={{ y: -80, opacity: 0, scale: 0.92 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -80, opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                className="pointer-events-auto w-auto max-w-full bg-[#181818]/95 backdrop-blur-2xl border border-[#383838] shadow-[0_16px_40px_rgba(0,0,0,0.9)] rounded-full pl-3.5 pr-4 py-2.5 flex items-center gap-3 select-none"
              >
                {/* Rounded Icon Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                    isSuccess
                      ? 'bg-[#1ed760] text-black shadow-[#1ed760]/30'
                      : isError
                      ? 'bg-rose-500 text-white shadow-rose-500/30'
                      : isWarning
                      ? 'bg-amber-400 text-black shadow-amber-400/30'
                      : 'bg-sky-400 text-black shadow-sky-400/30'
                  }`}
                >
                  {isSuccess && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                  {isError && <AlertCircle className="w-4 h-4 stroke-[2.5]" />}
                  {isWarning && <AlertTriangle className="w-4 h-4 stroke-[2.5]" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 stroke-[2.5]" />}
                </div>

                {/* Text Body */}
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  {t.title && (
                    <span className="text-xs font-black text-white tracking-wide uppercase shrink-0">
                      {t.title}:
                    </span>
                  )}
                  <span className="text-xs font-semibold text-[#e5e5e5] truncate max-w-[280px] sm:max-w-md">
                    {t.message}
                  </span>
                </div>

                {/* Minimal Dismiss Button */}
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="text-[#777] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return {
    ...context.toast,
    toast: context.toast,
    addToast: context.addToast,
    removeToast: context.removeToast,
  };
}

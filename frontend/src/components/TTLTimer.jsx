import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function TTLTimer({ initialSeconds = 600, expiresAt, onExpire }) {
  const calculateRemaining = () => {
    if (expiresAt) {
      const targetTime = new Date(expiresAt).getTime();
      if (!isNaN(targetTime)) {
        const diff = Math.floor((targetTime - Date.now()) / 1000);
        return Math.max(0, diff);
      }
    }
    return Math.max(0, initialSeconds || 600);
  };

  const [remaining, setRemaining] = useState(calculateRemaining);

  useEffect(() => {
    setRemaining(calculateRemaining());
  }, [initialSeconds, expiresAt]);

  useEffect(() => {
    if (remaining <= 0) {
      if (expiresAt && onExpire) {
        onExpire();
      }
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, onExpire, expiresAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = remaining > 0 && remaining < 120; // Under 2 mins

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm border transition-all duration-300 ${
        isUrgent
          ? 'bg-danger/15 border-danger/40 text-danger shadow-lg shadow-danger/20 animate-pulse'
          : 'bg-white/5 border-white/10 text-white/90 shadow-sm'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-danger animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-[#1ed760]" />
      )}
      <span className="font-mono font-bold tracking-wider text-white text-sm">
        {formatted}
      </span>
    </div>
  );
}

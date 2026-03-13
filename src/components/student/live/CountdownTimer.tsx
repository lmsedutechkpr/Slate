'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownTimerProps {
  scheduledAt: string;
}

export default function CountdownTimer({ scheduledAt }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; started: boolean }>({
    days: 0, hours: 0, minutes: 0, seconds: 0, started: false
  });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, started: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds, started: false });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  if (timeLeft.started) {
    return (
      <motion.p
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-[#28C840] font-semibold text-sm"
      >
        Starting now...
      </motion.p>
    );
  }

  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff > 24 * 60 * 60 * 1000) {
    return (
      <div className="text-right">
        <div className="text-xs text-[#8E8E93] mb-1">Starts in</div>
        <div className="text-sm font-semibold text-gray-700">
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="text-xs text-[#8E8E93]">Starts in</div>
      <div className="flex items-center gap-1.5">
        {[
          { val: timeLeft.hours, label: 'HRS' },
          { val: timeLeft.minutes, label: 'MIN' },
          { val: timeLeft.seconds, label: 'SEC' },
        ].map(({ val, label }) => (
          <div key={label} className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 min-w-[52px] text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={val}
                initial={{ scale: 1.15, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-2xl font-bold text-gray-900 leading-none"
              >
                {String(val).padStart(2, '0')}
              </motion.div>
            </AnimatePresence>
            <div className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

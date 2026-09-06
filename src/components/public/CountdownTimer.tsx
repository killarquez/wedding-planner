'use client';

import React, { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';

interface Props {
  lang: Language;
}

export const CountdownTimer: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];
  // Target: December 20, 2026 17:30:00 PST (UTC-8)
  const targetDate = new Date('2026-12-20T17:30:00-08:00').getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6 py-4">
      <div className="flex flex-col items-center bg-white/80 backdrop-blur-md px-3 sm:px-5 py-2.5 rounded-2xl border border-gold-300/50 shadow-sm min-w-[68px] sm:min-w-[84px]">
        <span className="text-2xl sm:text-3xl font-bold font-serif text-crimson-800 tracking-tight">
          {timeLeft.days}
        </span>
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-500 font-medium">
          {t.countdown_days}
        </span>
      </div>

      <span className="text-gold-500 font-bold text-xl pb-3">:</span>

      <div className="flex flex-col items-center bg-white/80 backdrop-blur-md px-3 sm:px-5 py-2.5 rounded-2xl border border-gold-300/50 shadow-sm min-w-[68px] sm:min-w-[84px]">
        <span className="text-2xl sm:text-3xl font-bold font-serif text-crimson-800 tracking-tight">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-500 font-medium">
          {t.countdown_hours}
        </span>
      </div>

      <span className="text-gold-500 font-bold text-xl pb-3">:</span>

      <div className="flex flex-col items-center bg-white/80 backdrop-blur-md px-3 sm:px-5 py-2.5 rounded-2xl border border-gold-300/50 shadow-sm min-w-[68px] sm:min-w-[84px]">
        <span className="text-2xl sm:text-3xl font-bold font-serif text-crimson-800 tracking-tight">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-500 font-medium">
          {t.countdown_mins}
        </span>
      </div>

      <span className="text-gold-500 font-bold text-xl pb-3">:</span>

      <div className="flex flex-col items-center bg-white/80 backdrop-blur-md px-3 sm:px-5 py-2.5 rounded-2xl border border-gold-300/50 shadow-sm min-w-[68px] sm:min-w-[84px]">
        <span className="text-2xl sm:text-3xl font-bold font-serif text-gold-600 tracking-tight animate-pulse">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-500 font-medium">
          {t.countdown_secs}
        </span>
      </div>
    </div>
  );
};

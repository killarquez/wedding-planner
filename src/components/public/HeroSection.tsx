'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { CountdownTimer } from './CountdownTimer';
import { Calendar, MapPin, Sparkles, Heart } from 'lucide-react';
import { downloadIcsFile } from '@/lib/calendar';

interface Props {
  lang: Language;
  onRsvpClick: () => void;
}

export const HeroSection: React.FC<Props> = ({ lang, onRsvpClick }) => {
  const t = translations[lang];

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 max-w-6xl mx-auto text-center animate-fade-in">
      {/* Decorative Traditional Vietnamese & Western Floral Nuances */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-crimson-100/40 via-gold-100/30 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-crimson-50 border border-crimson-200 text-crimson-900 text-xs sm:text-sm font-semibold tracking-wide mb-6 shadow-xs animate-fade-in">
        <Sparkles className="w-3.5 h-3.5 text-gold-600 animate-spin" style={{ animationDuration: '6s' }} />
        <span>{lang === 'en' ? 'The Wedding Celebration' : 'Dạ Tiệc Cưới Thân Mật'}</span>
        <span className="text-crimson-300">•</span>
        <span>{lang === 'en' ? 'December 5, 2026' : '05 Tháng 12, 2026'}</span>
      </div>

      {/* Double Happiness Symbol 囍 */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-crimson-700 via-crimson-800 to-crimson-950 flex items-center justify-center shadow-lg border-2 border-gold-400/60 transform hover:scale-105 transition-transform duration-300">
          <span className="text-3xl sm:text-4xl text-gold-200 font-serif select-none drop-shadow-sm font-bold">
            囍
          </span>
        </div>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-serif text-stone-900 tracking-tight mb-4">
        Trang <span className="text-gold-600 font-sans font-light">&</span> Alfredo
      </h1>

      <p className="text-xl sm:text-2xl md:text-3xl font-serif text-crimson-800 font-medium max-w-2xl mx-auto mb-4 leading-snug">
        "{t.subtitle}"
      </p>

      <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
        {t.tagline}
      </p>

      {/* Countdown Clock */}
      <CountdownTimer lang={lang} />

      {/* Key Details Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
        <div className="bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-start gap-3.5 hover:border-gold-300 transition-colors">
          <div className="p-2.5 rounded-xl bg-crimson-50 text-crimson-800 mt-0.5">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-0.5">
              {lang === 'en' ? 'Date & Schedule' : 'Thời Gian & Lịch Trình'}
            </h2>
            <p className="text-sm font-bold text-stone-900">{t.date_display}</p>
            <p className="text-xs text-stone-600 mt-0.5">{t.time_display}</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-start gap-3.5 hover:border-gold-300 transition-colors">
          <div className="p-2.5 rounded-xl bg-gold-50 text-gold-800 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-0.5">
              {lang === 'en' ? 'Banquet Location' : 'Địa Điểm Tổ Chức'}
            </h2>
            <p className="text-sm font-bold text-stone-900">{t.venue_name}</p>
            <p className="text-xs text-stone-600 mt-0.5">{t.venue_address}</p>
          </div>
        </div>
      </div>

      {/* Hero CTA buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
        <button
          type="button"
          onClick={onRsvpClick}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-crimson-700 to-crimson-900 text-white font-semibold text-sm sm:text-base shadow-md hover:shadow-lg hover:from-crimson-800 hover:to-crimson-950 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
        >
          <Heart className="w-4 h-4 fill-white" />
          <span>{t.rsvp_now}</span>
        </button>

        <button
          type="button"
          onClick={() => downloadIcsFile('Honored Guest')}
          className="px-6 py-3.5 rounded-xl bg-white/90 text-stone-800 font-semibold text-sm sm:text-base border border-stone-200 shadow-xs hover:bg-stone-50 hover:border-gold-300 transition-all flex items-center gap-2"
        >
          <Calendar className="w-4 h-4 text-gold-600" />
          <span>{t.calendar_add}</span>
        </button>
      </div>
    </section>
  );
};

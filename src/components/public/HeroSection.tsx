'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { CountdownTimer } from './CountdownTimer';
import { Calendar, MapPin, Sparkles, Heart } from 'lucide-react';
import { downloadIcsFile } from '@/lib/calendar';
import { Party } from '@/lib/types';
import { VietnameseCloudDivider, VietnameseCornerFlourish } from './VietnameseMotifDividers';

interface Props {
  lang: Language;
  guestParty?: Party | null;
  onRsvpClick: () => void;
}

export const HeroSection: React.FC<Props> = ({ lang, guestParty, onRsvpClick }) => {
  const t = translations[lang];

  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 max-w-6xl mx-auto text-center animate-fade-in">
      {/* Auspicious Vietnamese Celebration Badge */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-crimson-50 via-lotus-50 to-amber-50 border border-crimson-300/70 text-crimson-950 text-xs sm:text-sm font-semibold tracking-wide shadow-xs animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-gold-600 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-serif">{lang === 'en' ? 'The Wedding Celebration' : 'Dạ Tiệc Cưới Thân Mật'}</span>
          <span className="text-crimson-300">•</span>
          <span>{lang === 'en' ? 'December 5, 2026' : '05 Tháng 12, 2026'}</span>
        </div>
      </div>

      {/* Personalized Welcome Banner if Guest/Party is Recognized */}
      {guestParty && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-100 via-rose-50 to-gold-100 border border-gold-400 text-stone-900 text-xs sm:text-sm font-semibold shadow-xs animate-fade-in">
            <Sparkles className="w-4 h-4 text-gold-700" />
            <span>
              {lang === 'en' ? 'Honored Invitation For:' : 'Trân Trọng Kính Mời:'}{' '}
              <strong className="text-crimson-900 font-bold">{guestParty.primary_guest_name}</strong>
              <span className="text-stone-400 mx-1.5">•</span>
              <span className="text-stone-700">{guestParty.total_invited} {lang === 'en' ? 'Seats Reserved' : 'Chỗ Ngồi'}</span>
            </span>
          </div>
        </div>
      )}

      {/* Double Happiness Symbol 囍 with Traditional Imperial Frame */}
      <div className="flex justify-center mb-5">
        <div className="relative inline-flex items-center justify-center">
          <VietnameseCornerFlourish position="top-left" className="absolute -top-3 -left-3 w-6 h-6 text-gold-500/80" />
          <VietnameseCornerFlourish position="top-right" className="absolute -top-3 -right-3 w-6 h-6 text-gold-500/80" />
          <VietnameseCornerFlourish position="bottom-left" className="absolute -bottom-3 -left-3 w-6 h-6 text-gold-500/80" />
          <VietnameseCornerFlourish position="bottom-right" className="absolute -bottom-3 -right-3 w-6 h-6 text-gold-500/80" />

          <div className="w-18 h-18 sm:w-22 sm:h-22 p-2 rounded-2xl bg-gradient-to-br from-crimson-700 via-crimson-800 to-crimson-950 flex items-center justify-center shadow-xl border-2 border-gold-400 transform hover:scale-105 transition-transform duration-300">
            <span className="text-3xl sm:text-4xl text-gold-200 font-serif select-none drop-shadow-md font-bold">
              囍
            </span>
          </div>
        </div>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-serif text-stone-900 tracking-tight mb-3">
        Trang <span className="text-gold-600 font-sans font-light">&</span> Alfredo
      </h1>

      <p className="text-xl sm:text-2xl md:text-3xl font-serif text-crimson-800 font-medium max-w-2xl mx-auto mb-3 leading-snug">
        "{t.subtitle}"
      </p>

      {/* Vietnamese Auspicious Cloud Scroll Divider */}
      <div className="my-4">
        <VietnameseCloudDivider />
      </div>

      <p className="text-sm sm:text-base text-stone-700 max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
        {t.tagline}
      </p>

      {/* Countdown Clock */}
      <CountdownTimer lang={lang} />

      {/* Jewel-Toned Details Cards (Jade & Royal Amber) */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
        {/* Date & Schedule: Imperial Jade Accent */}
        <div className="jade-glow-card p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 hover:border-jade-400 transition-all">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-jade-600 to-emerald-800 text-white mt-0.5 shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-jade-800 mb-0.5 flex items-center gap-1.5">
              <span>{lang === 'en' ? 'Date & Schedule' : 'Thời Gian & Lịch Trình'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-jade-500" />
            </h2>
            <p className="text-sm font-bold text-stone-900">{t.date_display}</p>
            <p className="text-xs text-stone-600 mt-0.5">{t.time_display}</p>
          </div>
        </div>

        {/* Banquet Location: Gilded Amber & Crimson Accent */}
        <div className="amber-glow-card p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 hover:border-amber-400 transition-all">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-600 to-crimson-800 text-white mt-0.5 shadow-xs">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-0.5 flex items-center gap-1.5">
              <span>{lang === 'en' ? 'Banquet Location' : 'Địa Điểm Tổ Chức'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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

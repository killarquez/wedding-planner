'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { Wine, Shirt, Music, Users, Sparkles } from 'lucide-react';
import { VietnameseCloudDivider, VietnameseCornerFlourish, VietnameseLotusCrest } from './VietnameseMotifDividers';

interface Props {
  lang: Language;
}

export const EventDetails: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Story Card: Imperial Vietnamese Celebration Frame */}
      <div className="relative bg-gradient-to-br from-white/95 via-rose-50/35 to-amber-50/40 backdrop-blur-md rounded-3xl p-7 sm:p-12 border border-gold-400/60 shadow-md mb-14 text-center max-w-4xl mx-auto">
        <VietnameseCornerFlourish position="top-left" className="absolute top-3 left-3 w-7 h-7 text-gold-500/70" />
        <VietnameseCornerFlourish position="top-right" className="absolute top-3 right-3 w-7 h-7 text-gold-500/70" />
        <VietnameseCornerFlourish position="bottom-left" className="absolute bottom-3 left-3 w-7 h-7 text-gold-500/70" />
        <VietnameseCornerFlourish position="bottom-right" className="absolute bottom-3 right-3 w-7 h-7 text-gold-500/70" />

        <div className="flex justify-center mb-3">
          <VietnameseLotusCrest className="w-9 h-9 text-crimson-700" />
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-3">
          {t.story_heading}
        </h2>

        <div className="my-3">
          <VietnameseCloudDivider />
        </div>

        <p className="text-stone-700 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          {t.story_p1}
        </p>
        {t.story_p2 && (
          <p className="text-sm sm:text-base leading-relaxed font-semibold text-crimson-900 max-w-2xl mx-auto mt-3">
            {t.story_p2}
          </p>
        )}
      </div>

      {/* 3 Jewel-Toned Cultural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: Attire (Lotus Rose & Silk Crimson) */}
        <div className="lotus-glow-card rounded-2xl p-6 transition-all hover:scale-[1.01] flex flex-col justify-between">
          <div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-lotus-500 via-rose-600 to-crimson-800 text-white flex items-center justify-center mb-4 shadow-sm border border-lotus-300/40">
              <Shirt className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
              {t.dress_code_title}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t.dress_code_desc}
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-lotus-200/60 flex items-center gap-2 text-xs font-bold text-lotus-800">
            <Sparkles className="w-3.5 h-3.5 text-lotus-600" />
            <span>{t.dress_code_tag}</span>
          </div>
        </div>

        {/* Pillar 2: Banquet & Open Bar (Gilded Amber & Cognac) */}
        <div className="amber-glow-card rounded-2xl p-6 transition-all hover:scale-[1.01] flex flex-col justify-between">
          <div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-gold-700 text-white flex items-center justify-center mb-4 shadow-sm border border-amber-300/40">
              <Wine className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
              {t.drinks_title}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t.drinks_desc}
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-amber-200/60 flex items-center gap-2 text-xs font-bold text-amber-800">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>{t.drinks_tag}</span>
          </div>
        </div>

        {/* Pillar 3: Music, Dancing & La Hora Loca (Imperial Jade & Royal Indigo) */}
        <div className="jade-glow-card rounded-2xl p-6 transition-all hover:scale-[1.01] flex flex-col justify-between">
          <div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-jade-600 via-emerald-700 to-teal-900 text-white flex items-center justify-center mb-4 shadow-sm border border-jade-300/40">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
              {t.music_title}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t.music_desc}
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-jade-200/60 flex items-center gap-2 text-xs font-bold text-jade-800">
            <Users className="w-3.5 h-3.5 text-jade-600" />
            <span>{t.music_tag}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

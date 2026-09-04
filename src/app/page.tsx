'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Language, translations } from '@/lib/i18n';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import { HeroSection } from '@/components/public/HeroSection';
import { EventDetails } from '@/components/public/EventDetails';
import { WeddingIntroExperience } from '@/components/public/WeddingIntroExperience';
import { MusicPlayerWidget } from '@/components/public/MusicPlayerWidget';
import { Sparkles, Settings2, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function WeddingPageContent() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');

  const searchParams = useSearchParams();
  const initialCode = searchParams.get('invite') || searchParams.get('code') || '';
  const rsvpUrl = initialCode ? `/rsvp?invite=${encodeURIComponent(initialCode)}` : '/rsvp';

  const t = translations[lang];

  const handleNavigateRsvp = () => {
    router.push(rsvpUrl);
  };

  const handleReplayIntro = () => {
    sessionStorage.removeItem('wedding_invite_opened');
    window.location.reload();
  };

  return (
    <main className="min-h-screen relative flex flex-col justify-between">
      {/* 1st Time Opening Royal Red Envelope & Music Experience */}
      <WeddingIntroExperience lang={lang} />

      {/* Persistent Floating Music Controller ("Em Đồng Ý - I Do") */}
      <MusicPlayerWidget lang={lang} onReplayIntro={handleReplayIntro} />

      {/* Top Floating Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-crimson-800 text-gold-200 font-serif font-bold flex items-center justify-center text-sm shadow-xs">
            囍
          </div>
          <span className="font-serif font-bold text-stone-900 text-sm sm:text-base hidden sm:inline">
            Trang & Alfredo
          </span>
          <span className="text-xs text-crimson-800 font-semibold uppercase tracking-wider hidden md:inline">
            • Dec 5, 2026
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href={rsvpUrl}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-crimson-700 to-crimson-900 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all"
          >
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span>{t.rsvp_now}</span>
          </Link>

          <LanguageToggle currentLang={lang} onToggle={setLang} />

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Settings2 className="w-3.5 h-3.5 text-gold-400" />
            <span className="hidden sm:inline">{t.enter_admin}</span>
          </Link>
        </div>
      </header>

      {/* Hero Section (RSVP button routes to /rsvp) */}
      <HeroSection lang={lang} onRsvpClick={handleNavigateRsvp} />

      {/* Event Details & Banquet Showcase */}
      <EventDetails lang={lang} />

      {/* Bottom RSVP Call-To-Action Banner */}
      <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-[#fffdf9] to-[#faf6ed] rounded-3xl p-8 sm:p-12 border-2 border-gold-300/80 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-crimson-800 to-crimson-950 text-gold-200 font-serif font-bold text-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gold-400/50">
            囍
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-2">
            {t.ready_to_celebrate}
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mb-6 leading-relaxed">
            {t.ready_to_celebrate_desc}
          </p>

          <Link
            href={rsvpUrl}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-crimson-700 via-crimson-800 to-crimson-900 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>{t.rsvp_now}</span>
            <ArrowRight className="w-4 h-4 text-gold-300" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-200/80 bg-white py-10 px-4 text-center">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-crimson-50 text-crimson-800 flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 fill-crimson-700 text-crimson-700" />
          </div>
          <p className="font-serif font-bold text-stone-900 text-lg">
            Trang & Alfredo
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Saturday, December 5, 2026 • Grand Harbor Restaurant, Temple City, CA
          </p>
          <p className="text-[11px] text-stone-400 mt-4">
            Bilingual Wedding Operations & Guest Portal • The Wedding Celebration
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function PublicWeddingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5]" />}>
      <WeddingPageContent />
    </Suspense>
  );
}

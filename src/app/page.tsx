'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Language, translations } from '@/lib/i18n';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import { HeroSection } from '@/components/public/HeroSection';
import { EventDetails } from '@/components/public/EventDetails';
import { WeddingIntroExperience } from '@/components/public/WeddingIntroExperience';
import { MusicPlayerWidget } from '@/components/public/MusicPlayerWidget';
import { Sparkles, Lock, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Party } from '@/lib/types';
import { VietnameseAtmosphereBackground } from '@/components/public/VietnameseAtmosphereBackground';
import { VietnameseCornerFlourish, VietnameseCloudDivider } from '@/components/public/VietnameseMotifDividers';

function WeddingPageContent() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [guestParty, setGuestParty] = useState<Party | null>(null);

  const searchParams = useSearchParams();
  const initialCode = searchParams.get('invite') || searchParams.get('code') || '';
  const rsvpUrl = initialCode ? `/rsvp?invite=${encodeURIComponent(initialCode)}` : '/rsvp';

  useEffect(() => {
    if (!initialCode) return;
    const fetchParty = async () => {
      try {
        const res = await fetch(`/api/rsvp?code=${encodeURIComponent(initialCode.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.party) {
            setGuestParty(data.party);
          }
        }
      } catch (e) {
        console.warn('Failed to load guest party for banner:', e);
      }
    };
    fetchParty();
  }, [initialCode]);

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
      {/* Dynamic Vietnamese Imperial Atmosphere & Drifting Petals */}
      <VietnameseAtmosphereBackground />

      {/* 1st Time Opening Royal Red Envelope & Music Experience */}
      <WeddingIntroExperience lang={lang} guestParty={guestParty} initialCode={initialCode} />

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
            • Dec 20, 2026
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
        </div>
      </header>

      {/* Hero Section (RSVP button routes to /rsvp) */}
      <HeroSection lang={lang} guestParty={guestParty} onRsvpClick={handleNavigateRsvp} />

      {/* Event Details & Banquet Showcase */}
      <EventDetails lang={lang} />

      {/* Bottom RSVP Call-To-Action Banner */}
      <section className="py-14 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <div className="relative bg-gradient-to-br from-white/95 via-amber-50/40 to-rose-50/35 rounded-3xl p-8 sm:p-12 border-2 border-gold-400/80 shadow-xl">
          <VietnameseCornerFlourish position="top-left" className="absolute top-3 left-3 w-7 h-7 text-gold-500/70" />
          <VietnameseCornerFlourish position="top-right" className="absolute top-3 right-3 w-7 h-7 text-gold-500/70" />
          <VietnameseCornerFlourish position="bottom-left" className="absolute bottom-3 left-3 w-7 h-7 text-gold-500/70" />
          <VietnameseCornerFlourish position="bottom-right" className="absolute bottom-3 right-3 w-7 h-7 text-gold-500/70" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-crimson-800 via-rose-900 to-crimson-950 text-gold-200 font-serif font-bold text-2xl flex items-center justify-center mx-auto mb-4 shadow-md border border-gold-400/60 transform hover:scale-105 transition-transform">
            囍
          </div>

          {/* Personalized Party Badge if Recognized */}
          {guestParty && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-100 via-rose-50 to-gold-100 border border-gold-400 text-stone-900 text-xs sm:text-sm font-semibold mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-gold-700" />
              <span>
                {lang === 'en' ? 'Honored Invitation For:' : 'Trân Trọng Kính Mời:'}{' '}
                <strong className="text-crimson-900 font-bold">{guestParty.primary_guest_name}</strong>
                <span className="text-stone-400 mx-1.5">•</span>
                <span>{guestParty.total_invited} {lang === 'en' ? 'Seats Reserved' : 'Chỗ Ngồi'}</span>
              </span>
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-2">
            {t.ready_to_celebrate}
          </h2>

          <div className="my-3">
            <VietnameseCloudDivider />
          </div>

          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mb-6 leading-relaxed">
            {t.ready_to_celebrate_desc}
          </p>

          <Link
            href={rsvpUrl}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-crimson-700 via-rose-700 to-crimson-900 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-gold-400/40"
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
            Sunday, December 20, 2026 •{' '}
            <a
              href="https://www.google.com/maps/search/?api=1&query=Grand+Harbor+Restaurant,+5733+Rosemead+Blvd,+Temple+City,+CA+91780"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-crimson-800 underline decoration-stone-300 hover:decoration-crimson-800 transition-colors"
            >
              Grand Harbor Restaurant, Temple City, CA
            </a>
          </p>
          <p className="text-[11px] text-stone-400 mt-4">
            Bilingual Wedding Operations & Guest Portal • The Wedding Celebration
          </p>
          <div className="pt-4 border-t border-stone-100 w-full mt-4 flex items-center justify-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
              title={t.enter_admin}
            >
              <Lock className="w-3 h-3 text-stone-400" />
              <span>{t.enter_admin}</span>
            </Link>
          </div>
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

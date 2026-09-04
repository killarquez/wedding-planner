'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Language, translations } from '@/lib/i18n';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import { HeroSection } from '@/components/public/HeroSection';
import { EventDetails } from '@/components/public/EventDetails';
import { RsvpForm } from '@/components/public/RsvpForm';
import { ConfirmationModal } from '@/components/public/ConfirmationModal';
import { WeddingIntroExperience } from '@/components/public/WeddingIntroExperience';
import { MusicPlayerWidget } from '@/components/public/MusicPlayerWidget';
import { Sparkles, Settings2, Heart } from 'lucide-react';
import Link from 'next/link';

function WeddingPageContent() {
  const [lang, setLang] = useState<Language>('en');
  const [modalOpen, setModalOpen] = useState(false);
  const [rsvpData, setRsvpData] = useState<any>(null);

  const searchParams = useSearchParams();
  const initialCode = searchParams.get('invite') || searchParams.get('code') || '';

  const t = translations[lang];

  const handleRsvpSuccess = (data: any) => {
    setRsvpData(data);
    setModalOpen(true);
  };

  const scrollToRsvp = () => {
    const el = document.getElementById('rsvp-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReplayIntro = () => {
    sessionStorage.removeItem('wedding_invite_opened');
    window.location.reload();
  };

  // If initialCode is provided in URL, auto-scroll to RSVP section after brief moment
  useEffect(() => {
    if (initialCode) {
      const timer = setTimeout(() => {
        scrollToRsvp();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [initialCode]);

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

        <div className="flex items-center gap-3">
          <LanguageToggle currentLang={lang} onToggle={setLang} />

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Settings2 className="w-3.5 h-3.5 text-gold-400" />
            <span>{t.enter_admin}</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection lang={lang} onRsvpClick={scrollToRsvp} />

      {/* Event Details & Banquet Showcase */}
      <EventDetails lang={lang} />

      {/* Personalized Link & Party RSVP Form */}
      <RsvpForm
        lang={lang}
        initialCode={initialCode}
        onSuccess={handleRsvpSuccess}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        lang={lang}
        rsvpResult={rsvpData}
      />

      {/* Footer */}
      <footer className="mt-20 border-t border-stone-200/80 bg-white py-10 px-4 text-center">
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

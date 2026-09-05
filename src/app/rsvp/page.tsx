'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Language, translations } from '@/lib/i18n';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import { RsvpForm } from '@/components/public/RsvpForm';
import { ConfirmationModal } from '@/components/public/ConfirmationModal';
import { MusicPlayerWidget } from '@/components/public/MusicPlayerWidget';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Heart,
  Settings2,
  Sparkles
} from 'lucide-react';
import { VietnameseAtmosphereBackground } from '@/components/public/VietnameseAtmosphereBackground';

function RsvpPageContent() {
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

  return (
    <main className="min-h-screen relative text-stone-900 flex flex-col justify-between">
      {/* Dynamic Vietnamese Imperial Atmosphere & Drifting Petals */}
      <VietnameseAtmosphereBackground />

      {/* Persistent Floating Music Controller */}
      <MusicPlayerWidget lang={lang} />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-gold-400 bg-white text-stone-700 hover:text-stone-900 text-xs font-semibold shadow-2xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.back_to_home}</span>
            <span className="sm:hidden">{lang === 'en' ? 'Home' : 'Trang chủ'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-crimson-800 text-gold-200 font-serif font-bold flex items-center justify-center text-xs shadow-xs">
              囍
            </div>
            <span className="font-serif font-bold text-stone-900 text-sm hidden md:inline">
              Trang & Alfredo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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

      {/* Main Container */}
      <div className="flex-1 py-8 sm:py-12 px-4 sm:px-6">
        {/* Header Branding */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-crimson-50 border border-crimson-200 text-crimson-900 text-xs font-semibold tracking-wide mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Saturday, Dec 12, 2026</span>
            <span className="text-crimson-300">•</span>
            <span>Grand Harbor Restaurant</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
            {t.rsvp_page_title}
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-lg mx-auto leading-relaxed">
            {t.rsvp_page_subtitle}
          </p>
        </div>

        {/* Personalized Link & Party RSVP Form */}
        <RsvpForm
          lang={lang}
          initialCode={initialCode}
          onSuccess={handleRsvpSuccess}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        lang={lang}
        rsvpResult={rsvpData}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-200/80 bg-white py-8 px-4 text-center">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-crimson-50 text-crimson-800 flex items-center justify-center mb-2">
            <Heart className="w-4 h-4 fill-crimson-700 text-crimson-700" />
          </div>
          <p className="font-serif font-bold text-stone-900 text-sm">
            Trang & Alfredo's Wedding Celebration
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Saturday, December 12, 2026 • Grand Harbor Restaurant, Temple City, CA
          </p>
          <Link
            href="/"
            className="text-xs text-crimson-800 hover:text-crimson-950 font-semibold mt-3 hover:underline inline-flex items-center gap-1"
          >
            <span>{t.back_to_home}</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}

export default function DedicatedRsvpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5]" />}>
      <RsvpPageContent />
    </Suspense>
  );
}

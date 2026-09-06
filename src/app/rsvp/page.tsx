'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { translations } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import { RsvpForm } from '@/components/public/RsvpForm';
import { ConfirmationModal } from '@/components/public/ConfirmationModal';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Heart,
  Lock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { VietnameseAtmosphereBackground } from '@/components/public/VietnameseAtmosphereBackground';

function RsvpPageContent() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [rsvpData, setRsvpData] = useState<any>(null);

  const searchParams = useSearchParams();
  const initialCode = searchParams.get('invite') || searchParams.get('code') || '';

  const t = translations[lang];

  const handleRsvpSuccess = (data: any) => {
    setRsvpData(data);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    const targetUrl = initialCode ? `/?invite=${encodeURIComponent(initialCode)}` : '/';
    router.push(targetUrl);
  };

  return (
    <main className="min-h-screen relative text-stone-900 flex flex-col justify-between">
      {/* Dynamic Vietnamese Imperial Atmosphere & Drifting Petals */}
      <VietnameseAtmosphereBackground />

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
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 py-8 sm:py-12 px-4 sm:px-6">
        {/* Header Branding */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-crimson-50 border border-crimson-200 text-crimson-900 text-xs font-semibold tracking-wide mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Sunday, Dec 20, 2026</span>
            <span className="text-crimson-300">•</span>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Grand+Harbor+Restaurant,+5733+Rosemead+Blvd,+Temple+City,+CA+91780"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-crimson-700 underline decoration-crimson-300 hover:decoration-crimson-700 flex items-center gap-1 transition-colors"
              title={lang === 'en' ? 'Open Grand Harbor Restaurant in Google Maps' : 'Mở Nhà Hàng Grand Harbor trên Google Maps'}
            >
              <span>Grand Harbor Restaurant</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
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
        onClose={handleCloseModal}
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
          <div className="pt-3 border-t border-stone-100 w-full mt-3 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="text-xs text-crimson-800 hover:text-crimson-950 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>{t.back_to_home}</span>
            </Link>
            <span className="text-stone-300">•</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
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

export default function DedicatedRsvpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5]" />}>
      <RsvpPageContent />
    </Suspense>
  );
}

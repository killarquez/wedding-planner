'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import { Sparkles, Bot, RotateCcw, ExternalLink, ShieldCheck, LogOut, User, QrCode } from 'lucide-react';
import Link from 'next/link';

interface Props {
  lang: Language;
  userEmail?: string | null;
  onLangToggle: (l: Language) => void;
  onOpenBriefing: () => void;
  onResetSeed: () => void;
  onSignOut?: () => void;
  isResetting: boolean;
}

export const AdminHeader: React.FC<Props> = ({
  lang,
  userEmail,
  onLangToggle,
  onOpenBriefing,
  onResetSeed,
  onSignOut,
  isResetting
}) => {
  const t = translations[lang];

  return (
    <header className="bg-stone-900 text-white border-b border-stone-800 px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand & Context */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-crimson-800 text-gold-300 font-serif font-bold flex items-center justify-center text-base border border-gold-500/50 shadow-inner">
            囍
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-base sm:text-lg text-stone-100">
                {t.crm_title}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold-950 text-gold-400 border border-gold-800/80 uppercase">
                Wedding Hub
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {t.crm_subtitle}
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* User Session Badge */}
          {userEmail && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 border border-stone-700 text-xs text-stone-300">
              <User className="w-3.5 h-3.5 text-gold-400" />
              <span className="truncate max-w-[150px]">{userEmail}</span>
            </div>
          )}

          <LanguageToggle currentLang={lang} onToggle={onLangToggle} className="bg-stone-800/80 border-stone-700 text-white" />

          {/* View Daily Briefing */}
          <button
            type="button"
            onClick={onOpenBriefing}
            className="px-3.5 py-1.5 rounded-xl bg-crimson-800 hover:bg-crimson-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-gold-300" />
            <span>{t.view_briefing_btn}</span>
          </button>

          {/* Reset Seed Button */}
          <button
            type="button"
            onClick={onResetSeed}
            disabled={isResetting}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5 border border-stone-700 transition-colors disabled:opacity-50"
            title="Reset DB with realistic demo data"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lang === 'en' ? 'Reset Seed' : 'Tải Lại'}</span>
          </button>

          {/* Reception Check-In Scanner */}
          <Link
            href="/checkin"
            className="px-3.5 py-1.5 rounded-xl bg-gold-600/20 hover:bg-gold-600/30 text-gold-300 text-xs font-semibold flex items-center gap-1.5 border border-gold-500/40 transition-colors"
            title="Launch VIP Reception Check-In Scanner"
          >
            <QrCode className="w-3.5 h-3.5 text-gold-300" />
            <span>{lang === 'en' ? 'Reception Scanner' : 'Máy Quét Check-in'}</span>
          </Link>

          {/* Back to Public View */}
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{t.exit_admin}</span>
          </Link>

          {/* Sign Out Button */}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="p-2 rounded-xl bg-stone-800 hover:bg-red-950/70 hover:text-red-300 text-stone-400 border border-stone-700 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

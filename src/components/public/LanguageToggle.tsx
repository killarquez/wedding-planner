'use client';

import React from 'react';
import { Language } from '@/lib/i18n';
import { Globe } from 'lucide-react';

interface Props {
  currentLang: Language;
  onToggle: (lang: Language) => void;
  className?: string;
}

export const LanguageToggle: React.FC<Props> = ({ currentLang, onToggle, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-full border border-gold-300/60 shadow-sm ${className}`}>
      <Globe className="w-3.5 h-3.5 text-gold-600 ml-1.5" />
      <button
        type="button"
        onClick={() => onToggle('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
          currentLang === 'en'
            ? 'bg-crimson-800 text-white shadow-xs'
            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onToggle('vi')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
          currentLang === 'vi'
            ? 'bg-crimson-800 text-white shadow-xs'
            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
        }`}
      >
        VI
      </button>
    </div>
  );
};

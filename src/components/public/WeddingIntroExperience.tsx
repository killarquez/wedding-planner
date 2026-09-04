'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/lib/i18n';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { weddingAudio } from '@/lib/audioManager';

interface Props {
  lang: Language;
  onOpened?: () => void;
}

export const WeddingIntroExperience: React.FC<Props> = ({ lang, onOpened }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    const openedSession = sessionStorage.getItem('wedding_invite_opened');
    if (!openedSession) {
      setIsVisible(true);
    } else {
      setHasOpened(true);
    }
  }, []);

  const triggerGrandFireworks = () => {
    // 1. Initial Central Fountain Burst from Envelope Mouth
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.55, x: 0.5 },
      colors: ['#ffd700', '#ff4d4d', '#ffffff', '#ffaa00', '#d4af37'],
      zIndex: 100,
    });

    // 2. Continuous Left and Right Celebration Fireworks
    const duration = 3200;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 75, zIndex: 100 };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 45 * (timeLeft / duration);

      // Left corner firework launch
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.15 + Math.random() * 0.2, y: Math.random() * 0.4 + 0.25 },
        colors: ['#ffd700', '#ff3366', '#ffcc00', '#ffffff', '#c41e3a']
      });

      // Right corner firework launch
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.65 + Math.random() * 0.2, y: Math.random() * 0.4 + 0.25 },
        colors: ['#ffd700', '#ff9900', '#ff0033', '#ffffff', '#fae19c']
      });
    }, 320);
  };

  const handleOpenEnvelope = () => {
    if (isOpen) return;
    setIsOpen(true);

    // 1. Instant audio response (zero latency)
    weddingAudio.playFireworkShow();
    weddingAudio.startMusic();
    window.dispatchEvent(new CustomEvent('wedding:start_youtube_audio'));

    // 2. Launch celebratory confetti immediately
    triggerGrandFireworks();

    // 3. Card slides out and centers smoothly in 300ms (no slow laggy delays)
    setTimeout(() => {
      setCardRevealed(true);
    }, 300);
  };

  const handleCompleteIntro = () => {
    if (isDissolving) return;
    setIsDissolving(true);
    setTimeout(() => {
      sessionStorage.setItem('wedding_invite_opened', 'true');
      setIsVisible(false);
      setHasOpened(true);
      if (onOpened) onOpened();
    }, 600);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCompleteIntro();
  };

  if (!isVisible && hasOpened) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 select-none transition-all duration-700 ease-out overflow-hidden ${
        isDissolving
          ? 'opacity-0 pointer-events-none scale-105'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Ambient Background Setting (Warm dark room with soft celebration vignette) */}
      <div className="absolute inset-0 bg-[#120608] bg-[radial-gradient(ellipse_at_center,_#2e0f13_0%,_#140507_65%,_#090203_100%)]" />

      {/* 2. Authentic Decorated Tabletop Flat-Lay Canvas */}
      {/* Sized with max bounds so on PC it does NOT blow up the brown box! */}
      <div 
        className="absolute inset-0 bg-no-repeat bg-center transition-all duration-700 ease-out"
        style={{
          backgroundImage: 'url(/images/tabletop-bg.jpg)',
          backgroundSize: 'min(100vw, 100vh, 820px)',
          opacity: cardRevealed ? 0.45 : 1, // Softly dim tabletop so the unveiled invitation card is the hero
        }}
      />

      {/* Soft Vignette Edge Blending */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(9,2,3,0.7)_85%)] pointer-events-none" />

      {/* Golden Celebration Glow when opening */}
      <div
        className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/25 via-crimson-900/15 to-transparent transition-opacity duration-700 pointer-events-none ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Top Header / Status Pill & Quick Skip */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-full max-w-sm px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-950/85 border border-amber-400/40 backdrop-blur-md text-amber-200 text-xs font-serif tracking-wide shadow-xl">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>
            {lang === 'en'
              ? 'A Wedding Delivery For You'
              : 'Món Quà Bất Ngờ Dành Riêng Cho Quý Khách'}
          </span>
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-stone-600/50 text-stone-300 hover:text-white text-xs backdrop-blur-md transition-all flex items-center gap-1 shadow-lg"
        >
          <span>{lang === 'en' ? 'Skip' : 'Bỏ qua'}</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. The Envelope Resting on the Table (Sized naturally for both Mobile & Desktop) */}
      <div
        className={`relative z-40 flex flex-col items-center justify-center transition-all duration-500 ease-out ${
          cardRevealed ? 'opacity-20 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        {/* Envelope Container (No weird pulsing, realistic proportions) */}
        <div
          onClick={handleOpenEnvelope}
          style={{ perspective: '1000px' }}
          className={`relative cursor-pointer transition-transform duration-300 hover:scale-102 active:scale-98 ${
            /* Mobile: 160px x 326px; Desktop: 200px x 407px (matches natural 511:1040 ratio) */
            'w-[160px] h-[326px] sm:w-[200px] sm:h-[407px]'
          }`}
        >
          {/* Realistic Soft Shadow Cast onto Kraft Box */}
          <div
            className="absolute -inset-1 rounded-xl bg-black/55 blur-lg translate-y-3 pointer-events-none"
          />

          {/* Layer 1: Envelope Interior Back Panel (Crimson Paper) */}
          <div
            className="absolute top-0 left-0 right-0 h-[92.8%] rounded-sm overflow-hidden z-10 bg-cover bg-center border border-crimson-950/50 shadow-md"
            style={{ backgroundImage: 'url(/images/paper-envelope-back.png)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Layer 2: Invitation peek sliding up inside envelope before opening */}
          <div
            className={`absolute left-2 right-2 rounded-t-md z-20 transition-all duration-500 ease-out bg-[#fffdfa] border border-amber-400/80 ${
              isOpen
                ? '-translate-y-24 opacity-100'
                : 'translate-y-0 opacity-0'
            }`}
            style={{ height: '75%' }}
          />

          {/* Layer 3: Envelope Front Pocket with Medallion & Silk Tassel */}
          <div
            className="absolute left-0 right-0 bottom-0 pointer-events-none z-30"
            style={{
              top: '11.05%',
              backgroundImage: 'url(/images/paper-envelope-pocket.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Layer 4: Top Flap with 3D Flip */}
          <div
            className="absolute top-0 left-0 right-0 z-40 transition-transform duration-400 ease-out pointer-events-none"
            style={{
              height: '12.02%',
              transformOrigin: 'top center',
              transformStyle: 'preserve-3d',
              transform: isOpen ? 'rotateX(180deg)' : 'rotateX(0deg)',
              zIndex: isOpen ? 15 : 40,
            }}
          >
            {/* Front Side of Flap */}
            <div
              className="absolute inset-0 bg-cover bg-center rounded-t-sm"
              style={{
                backgroundImage: 'url(/images/paper-envelope-flap.png)',
                backgroundSize: '100% 100%',
                backfaceVisibility: 'hidden',
              }}
            />

            {/* Back Side of Flap */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#6e0b12] to-[#8d1118] border-b border-amber-400/40 rounded-b-sm shadow-inner"
              style={{
                transform: 'rotateX(180deg)',
                backfaceVisibility: 'hidden',
              }}
            />
          </div>
        </div>

        {/* Crisp, Dignified "Tap to Open" Action Prompt */}
        {!isOpen && (
          <div className="mt-5 text-center">
            <button
              onClick={handleOpenEnvelope}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 border border-amber-200/70 transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-stone-900" />
              <span>{lang === 'en' ? 'Tap Envelope to Open' : 'Chạm Vào Bao Thư Để Mở'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. The Unveiled Golden Wedding Invitation Card (Centered, Fully Legible, Uncut) */}
      {cardRevealed && (
        <div
          onClick={handleCompleteIntro}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-500 animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[340px] sm:max-w-[380px] rounded-2xl bg-gradient-to-b from-[#fffefc] via-[#faf5ea] to-[#f4ecd8] text-stone-900 p-5 sm:p-6 flex flex-col justify-between items-center text-center border-2 border-amber-400/90 shadow-[0_25px_60px_rgba(0,0,0,0.7)] animate-scale-up cursor-default overflow-hidden"
          >
            {/* Shimmering Foil Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

            {/* Traditional Gold Foil Corner Accents */}
            <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-sm pointer-events-none" />

            {/* Top Double Happiness Emblem 囍 */}
            <div className="flex flex-col items-center space-y-1 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shadow-md">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-crimson-800 to-crimson-950 flex items-center justify-center border border-amber-300/80">
                  <span className="text-2xl font-serif text-amber-200 font-bold select-none drop-shadow">
                    囍
                  </span>
                </div>
              </div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-amber-800/90 font-serif font-semibold mt-0.5">
                {lang === 'en' ? 'Wedding Invitation' : 'Thiệp Báo Hỷ'}
              </div>
            </div>

            {/* Couple's Names */}
            <div className="space-y-1.5 mb-3">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-wide leading-tight">
                Trang & Alfredo
              </h2>
              <div className="w-20 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
              <p className="text-xs text-stone-600 font-serif max-w-[260px] leading-relaxed pt-1">
                {lang === 'en'
                  ? 'Together with our families, we cordially invite you to celebrate our wedding banquet & union.'
                  : 'Thân mời quý khách đến dự tiệc báo hỷ chung vui cùng gia đình chúng tôi.'}
              </p>
            </div>

            {/* Date & Venue Section */}
            <div className="w-full py-2.5 border-t border-b border-amber-400/40 space-y-1 text-center bg-amber-50/40 rounded-lg mb-4">
              <p className="text-xs sm:text-sm font-serif font-bold text-crimson-900">
                Saturday, December 5, 2026
              </p>
              <p className="text-[11px] text-stone-700 font-medium">
                5:30 PM Reception • 6:30 PM Banquet
              </p>
              <p className="text-[10px] sm:text-[11px] text-stone-500">
                Grand Harbor Restaurant • Temple City, CA
              </p>
            </div>

            {/* Action CTA Button: Clear, Responsive, Easy to Tap */}
            <button
              type="button"
              onClick={handleCompleteIntro}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
            >
              <span>{lang === 'en' ? 'Enter Celebration' : 'Vào Tiệc Cưới'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


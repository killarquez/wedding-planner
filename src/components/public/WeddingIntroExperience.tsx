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

    // 1. Trigger audio immediately (firework booms & start music)
    weddingAudio.playFireworkShow();
    weddingAudio.startMusic();
    window.dispatchEvent(new CustomEvent('wedding:start_youtube_audio'));

    // 2. Launch colorful confetti
    triggerGrandFireworks();

    // 3. Card slides out and reveals after flap unfolds
    setTimeout(() => {
      setCardRevealed(true);
    }, 600);

    // 4. Auto-transition gracefully after guest has time to admire the card
    setTimeout(() => {
      handleCompleteIntro();
    }, 8500);
  };

  const handleCompleteIntro = () => {
    if (isDissolving) return;
    setIsDissolving(true);
    setTimeout(() => {
      sessionStorage.setItem('wedding_invite_opened', 'true');
      setIsVisible(false);
      setHasOpened(true);
      if (onOpened) onOpened();
    }, 1100);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCompleteIntro();
  };

  if (!isVisible && hasOpened) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none transition-all duration-1000 ease-out overflow-hidden ${
        isDissolving
          ? 'opacity-0 pointer-events-none scale-105'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Authentic Decorated Tabletop Flat-Lay Background (Matching Picture #3) */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: 'url(/images/tabletop-bg.jpg)',
          transform: isOpen ? 'scale(1.03)' : 'scale(1)',
        }}
      />

      {/* Warm Ambient Vignette & Shadow Frame */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/70 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />

      {/* Floating Golden Celebration Glow when opening */}
      <div
        className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/30 via-crimson-900/20 to-transparent transition-opacity duration-1000 pointer-events-none ${
          isOpen ? 'opacity-100 scale-125' : 'opacity-0'
        }`}
      />

      {/* Top Header / Status Pill */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 max-w-[90vw]">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900/85 border border-amber-400/50 backdrop-blur-md text-amber-200 text-xs sm:text-sm font-serif tracking-wider shadow-2xl">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>
            {lang === 'en'
              ? 'A Special Wedding Delivery For You'
              : 'Món Quà Bất Ngờ Dành Riêng Cho Quý Khách'}
          </span>
        </div>

        {/* Skip button for quick browsing */}
        <button
          onClick={handleSkip}
          className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-stone-600/50 text-stone-300 hover:text-white text-xs backdrop-blur-md transition-all flex items-center gap-1 shadow-lg"
        >
          <span>{lang === 'en' ? 'Skip' : 'Bỏ qua'}</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Tabletop Interactive Envelope Stage */}
      <div
        className={`relative z-40 flex flex-col items-center justify-center transition-all duration-700 ease-out ${
          isOpen ? 'translate-y-6 sm:translate-y-10' : 'translate-y-0'
        }`}
      >
        {/* Envelope Container (Physical Paper Red Envelope with 3D Depth) */}
        <div
          onClick={handleOpenEnvelope}
          style={{ perspective: '1200px' }}
          className={`relative cursor-pointer group transition-transform duration-500 ${
            !isOpen ? 'hover:scale-105 active:scale-98 animate-pulse-subtle' : ''
          } ${
            /* Responsive Dimensions matching 511 x 1040 aspect ratio */
            'w-[240px] h-[488px] sm:w-[290px] sm:h-[590px]'
          }`}
        >
          {/* Realistic Shadow Cast onto Kraft Box */}
          <div
            className={`absolute -inset-2 rounded-2xl bg-black/50 blur-xl transition-all duration-700 pointer-events-none ${
              isOpen ? 'opacity-70 scale-110 blur-2xl translate-y-6' : 'opacity-40 group-hover:opacity-60 translate-y-3'
            }`}
          />

          {/* Layer 1: Envelope Interior Back Panel (Crimson Paper with Gold Speckles) */}
          <div
            className="absolute top-0 left-0 right-0 h-[92.8%] rounded-sm overflow-hidden shadow-2xl z-10 bg-cover bg-center border border-crimson-900/40"
            style={{ backgroundImage: 'url(/images/paper-envelope-back.png)' }}
          >
            {/* Subtle inner dark gradient simulating depth inside pouch */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none" />
          </div>

          {/* Layer 2: The Golden Wedding Invitation Card (Slides Up & Reveals) */}
          <div
            onClick={(e) => {
              if (isOpen) {
                e.stopPropagation();
                handleCompleteIntro();
              }
            }}
            className={`absolute left-2 right-2 sm:left-3 sm:right-3 z-20 rounded-xl transition-all duration-1000 ease-out cursor-pointer ${
              isOpen
                ? '-translate-y-[62%] sm:-translate-y-[68%] scale-105 sm:scale-110 opacity-100 shadow-[0_25px_50px_rgba(0,0,0,0.6)]'
                : 'translate-y-2 opacity-0 scale-95 pointer-events-none'
            }`}
            style={{
              height: '84%',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Elegant Luxury Invitation Cardstock */}
            <div className="relative w-full h-full rounded-xl bg-gradient-to-b from-[#fffdfa] via-[#fbf7ed] to-[#f6f0df] text-stone-900 p-4 sm:p-5 flex flex-col justify-between items-center text-center border-2 border-amber-400/90 shadow-2xl overflow-hidden">
              {/* Foil Shimmer Sweeping Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

              {/* Ornate Gold Foil Corner Borders */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-sm pointer-events-none" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-sm pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-sm pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-sm pointer-events-none" />

              {/* Top Double Happiness Emblem 囍 */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shadow-md">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-crimson-800 to-crimson-950 flex items-center justify-center border border-amber-300/80">
                    <span className="text-xl sm:text-2xl font-serif text-amber-200 font-bold select-none drop-shadow">
                      囍
                    </span>
                  </div>
                </div>
                <div className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-amber-800/80 font-serif font-semibold mt-1">
                  {lang === 'en' ? 'Wedding Invitation' : 'Thiệp Báo Hỷ'}
                </div>
              </div>

              {/* Couple's Names in Golden Calligraphy Serif */}
              <div className="my-auto py-2 space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-wide leading-tight">
                  Trang & Alfredo
                </h2>
                <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
                <p className="text-[11px] sm:text-xs text-stone-600 font-serif max-w-[210px] sm:max-w-[240px] leading-relaxed">
                  {lang === 'en'
                    ? 'Together with our families, we cordially invite you to celebrate our banquet & marriage.'
                    : 'Thân mời quý khách đến dự tiệc báo hỷ và chung vui cùng gia đình chúng tôi.'}
                </p>
              </div>

              {/* Date & Venue Snippet */}
              <div className="w-full pt-2 border-t border-amber-400/40 space-y-1 text-center">
                <p className="text-xs sm:text-sm font-serif font-bold text-crimson-900">
                  Saturday, December 5, 2026
                </p>
                <p className="text-[10px] sm:text-[11px] text-stone-600 font-medium">
                  5:30 PM Reception • 6:30 PM Banquet
                </p>
                <p className="text-[10px] sm:text-[11px] text-stone-500">
                  Grand Harbor Restaurant • Temple City, CA
                </p>
              </div>

              {/* Interactive Enter Celebration Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCompleteIntro();
                }}
                className="w-full mt-3 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 group"
              >
                <span>{lang === 'en' ? 'Enter Celebration' : 'Vào Tiệc Cưới'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Layer 3: Envelope Front Pocket with Medallion & Silk Tassel (paper-envelope-pocket.png) */}
          <div
            className="absolute left-0 right-0 bottom-0 pointer-events-none z-30"
            style={{
              top: '11.05%', // Exactly matches cut seam of flap
              backgroundImage: 'url(/images/paper-envelope-pocket.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Layer 4: Envelope Top Flap (paper-envelope-flap.png with 3D Flip) */}
          <div
            className="absolute top-0 left-0 right-0 z-40 transition-all duration-700 pointer-events-none"
            style={{
              height: '12.02%',
              transformOrigin: 'top center',
              transformStyle: 'preserve-3d',
              transform: isOpen ? 'rotateX(180deg)' : 'rotateX(0deg)',
              zIndex: isOpen ? 15 : 40, // When flipped, drops behind the rising card
            }}
          >
            {/* Front Side of Flap (Visible when closed) */}
            <div
              className="absolute inset-0 bg-cover bg-center rounded-t-sm"
              style={{
                backgroundImage: 'url(/images/paper-envelope-flap.png)',
                backgroundSize: '100% 100%',
                backfaceVisibility: 'hidden',
              }}
            />

            {/* Back Side of Flap (Visible when flipped open 180 degrees) */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#6e0b12] to-[#8d1118] border-b border-amber-400/40 rounded-b-sm shadow-inner"
              style={{
                transform: 'rotateX(180deg)',
                backfaceVisibility: 'hidden',
              }}
            />
          </div>
        </div>

        {/* Pulsing Interactive Prompt Below Envelope */}
        {!isOpen && (
          <div className="mt-4 sm:mt-6 text-center animate-bounce">
            <button
              onClick={handleOpenEnvelope}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 border border-amber-200/60"
            >
              <Sparkles className="w-4 h-4 text-stone-900" />
              <span>{lang === 'en' ? 'Tap Envelope to Open' : 'Chạm Vào Bao Thư Để Mở'}</span>
            </button>
          </div>
        )}

        {/* Audio feedback hint */}
        {isOpen && !cardRevealed && (
          <p className="mt-3 text-xs text-amber-200 font-serif animate-pulse flex items-center gap-1.5 drop-shadow">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'en' ? 'Unveiling invitation...' : 'Đang mở thiệp hỷ...'}</span>
          </p>
        )}
      </div>
    </div>
  );
};

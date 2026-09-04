'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/lib/i18n';
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { weddingAudio } from '@/lib/audioManager';

interface Props {
  lang: Language;
  onOpened?: () => void;
}

export const WeddingIntroExperience: React.FC<Props> = ({ lang, onOpened }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [flapOpen, setFlapOpen] = useState(false);
  const [cardEmerged, setCardEmerged] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [fireworkActive, setFireworkActive] = useState(false);

  useEffect(() => {
    const openedSession = sessionStorage.getItem('wedding_invite_opened');
    if (!openedSession) {
      setIsVisible(true);
    } else {
      setHasOpened(true);
    }
  }, []);

  const triggerGrandFireworks = () => {
    // 1. Initial Central Burst
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#ffd700', '#ff4d4d', '#ffffff', '#ff9900', '#e60000']
    });

    // 2. Left and Right Firework Launch Sequence
    const duration = 3200;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 70 };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);

      // Left corner firework launch
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.15 + Math.random() * 0.2, y: Math.random() * 0.4 + 0.3 },
        colors: ['#ffd700', '#ff3366', '#ffcc00', '#ffffff', '#a80000']
      });

      // Right corner firework launch
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.65 + Math.random() * 0.2, y: Math.random() * 0.4 + 0.3 },
        colors: ['#ffd700', '#ff9900', '#ff0033', '#ffffff', '#ffea75']
      });
    }, 320);
  };

  const handleOpenEnvelope = () => {
    if (isOpening) return;
    setIsOpening(true);

    // Step 1: Flip top flap open
    setFlapOpen(true);

    // Step 2: Audio & fireworks show start
    weddingAudio.playFireworkShow();
    weddingAudio.startMusic();
    window.dispatchEvent(new CustomEvent('wedding:start_youtube_audio'));

    // Step 3: Card slides up out of envelope pocket at 400ms
    setTimeout(() => {
      setCardEmerged(true);
      setFireworkActive(true);
      triggerGrandFireworks();
    }, 400);

    // Step 4: Theatrical duration before smoothly dissolving into homepage
    setTimeout(() => {
      sessionStorage.setItem('wedding_invite_opened', 'true');
      setIsVisible(false);
      setHasOpened(true);
      if (onOpened) onOpened();
    }, 4200);
  };

  if (!isVisible && hasOpened) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-1000 ${
        isOpening && !fireworkActive ? 'opacity-100' : ''
      } ${
        isOpening && cardEmerged ? 'bg-black/90 backdrop-blur-2xl' : 'bg-[#0e0708]/95 backdrop-blur-xl'
      }`}
    >
      {/* Ambient Night Sky & Glowing Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-crimson-900/30 rounded-full blur-[100px] animate-pulse-subtle" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gold-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full text-center space-y-6 animate-slide-up">
        {/* Mysterious Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-950/90 border border-gold-500/50 text-gold-300 text-xs font-semibold tracking-wider shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{lang === 'en' ? 'A Special Message For You' : 'Món Quà Bất Ngờ Dành Riêng Cho Bạn'}</span>
        </div>

        {/* Realistic 3D Envelope Container */}
        <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] h-[230px] sm:h-[250px] [perspective:1000px] cursor-pointer group select-none">
          
          {/* Main Envelope Body Wrapper */}
          <div
            onClick={handleOpenEnvelope}
            className={`relative w-full h-full rounded-2xl transition-transform duration-500 ${
              !isOpening ? 'group-hover:scale-105 active:scale-95' : 'scale-105'
            }`}
          >
            {/* 1. Envelope Back Pocket (Interior base) */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#52090c] via-[#6e0f14] to-[#450608] border-2 border-gold-500/40 shadow-2xl overflow-hidden">
              {/* Inner satin lining pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
            </div>

            {/* 2. Invitation Card inside the Envelope */}
            <div
              className={`absolute inset-x-3 bottom-2 h-[200px] sm:h-[220px] rounded-xl bg-gradient-to-b from-[#fffefb] via-[#fbf8f0] to-[#f5eedc] text-stone-900 border-2 border-gold-400/90 p-4 shadow-2xl flex flex-col items-center justify-between text-center transition-all duration-1000 ease-out z-10 ${
                cardEmerged
                  ? '-translate-y-[100px] sm:-translate-y-[115px] scale-105 shadow-gold-500/30'
                  : 'translate-y-0 scale-95 opacity-80'
              }`}
            >
              {/* Decorative Card Ornaments */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gold-500/70" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gold-500/70" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gold-500/70" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gold-500/70" />

              {/* Card Mini Header */}
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-crimson-800">
                <Sparkles className="w-3 h-3 text-gold-600" />
                <span>{lang === 'en' ? 'The Wedding Celebration' : 'Dạ Tiệc Cưới'}</span>
                <Sparkles className="w-3 h-3 text-gold-600" />
              </div>

              {/* Card Double Happiness Symbol */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-crimson-800 to-crimson-950 flex items-center justify-center border border-gold-300 shadow-md">
                <span className="text-xl sm:text-2xl font-serif text-gold-200 font-bold">
                  囍
                </span>
              </div>

              {/* Couple Names */}
              <div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight leading-tight">
                  Trang <span className="text-gold-600 font-sans font-light">&</span> Alfredo
                </h3>
                <p className="text-[11px] sm:text-xs text-crimson-700 font-serif italic mt-0.5">
                  {lang === 'en' ? "We said 'I do', now let's celebrate!" : "Chúng mình đã nên duyên, nay cùng nâng ly chúc mừng!"}
                </p>
              </div>

              {/* Date & Location Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-50 border border-crimson-200 text-[10px] sm:text-xs font-semibold text-crimson-900">
                <span>{lang === 'en' ? 'Saturday, Dec 5, 2026' : 'Thứ Bảy, 05.12.2026'}</span>
                <span className="text-gold-500">•</span>
                <span>Westminster, CA</span>
              </div>
            </div>

            {/* 3. Envelope Front Pocket (Lower Triangular Fold and Side Folds) */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none z-20 overflow-hidden">
              {/* Left triangle fold */}
              <div
                className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#7a1015] via-[#851218] to-transparent"
                style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)' }}
              />
              {/* Right triangle fold */}
              <div
                className="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-[#7a1015] via-[#851218] to-transparent"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }}
              />
              {/* Bottom triangle fold */}
              <div
                className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-[#8a141a] via-[#a31e24] to-[#801318] shadow-md border-t border-gold-400/40"
                style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 46%)' }}
              />
              {/* Gold border embroidery on front folds */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="100%" x2="50%" y2="46%" stroke="#e3ce8a" strokeWidth="1.5" strokeOpacity="0.7" />
                <line x1="100%" y1="100%" x2="50%" y2="46%" stroke="#e3ce8a" strokeWidth="1.5" strokeOpacity="0.7" />
              </svg>
            </div>

            {/* 4. Top Flap (Opens 180 degrees upwards) */}
            <div
              className={`absolute top-0 inset-x-0 h-full transition-all duration-700 ease-in-out pointer-events-none ${
                flapOpen ? 'z-0' : 'z-30'
              }`}
              style={{
                transformOrigin: 'top center',
                transform: flapOpen ? 'rotateX(180deg)' : 'rotateX(0deg)'
              }}
            >
              {/* Flap Triangle */}
              <div
                className="w-full h-full bg-gradient-to-b from-[#b5262c] via-[#94171d] to-[#6e0c11] shadow-xl"
                style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%)' }}
              />
              {/* Gold border lines along the flap edges */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="0" x2="50%" y2="50%" stroke="#e3ce8a" strokeWidth="2" strokeOpacity="0.8" />
                <line x1="100%" y1="0" x2="50%" y2="50%" stroke="#e3ce8a" strokeWidth="2" strokeOpacity="0.8" />
              </svg>
            </div>

            {/* 5. Central Gold Wax Seal & Seal Click Target */}
            {!flapOpen && (
              <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-none transition-all duration-300">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 p-0.5 shadow-2xl group-hover:scale-110 transition-transform">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-crimson-800 to-crimson-950 flex items-center justify-center border-2 border-gold-200 shadow-inner">
                    <span className="text-3xl sm:text-4xl font-serif text-gold-200 font-bold select-none drop-shadow-md">
                      囍
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-gold-400/40 text-[11px] font-serif text-gold-200 font-medium tracking-wide">
                    {lang === 'en' ? 'Click to Open' : 'Chạm Để Mở'}
                  </span>
                </div>
              </div>
            )}

            {/* 6. Gold Foil Corner Accents on Envelope */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-gold-400/70 rounded-tl-lg pointer-events-none z-30" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-gold-400/70 rounded-tr-lg pointer-events-none z-30" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-gold-400/70 rounded-bl-lg pointer-events-none z-30" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-gold-400/70 rounded-br-lg pointer-events-none z-30" />
          </div>
        </div>

        {/* Interactive Call to Action Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleOpenEnvelope}
            disabled={isOpening}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-2 group ${
              isOpening
                ? 'bg-gold-600/50 text-stone-900/60 cursor-default'
                : 'bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-stone-950 hover:shadow-gold-400/30 hover:brightness-110 active:brightness-95'
            }`}
          >
            <Sparkles className={`w-4 h-4 text-stone-900 ${isOpening ? 'animate-spin' : ''}`} />
            <span>
              {isOpening
                ? (lang === 'en' ? 'Revealing Invitation...' : 'Đang Mở Thiệp Mừng...')
                : (lang === 'en' ? 'Tap to Open Envelope' : 'Chạm Để Mở Phong Bì')}
            </span>
          </button>

          {isOpening && (
            <p className="text-xs text-gold-300 font-serif animate-pulse">
              ✨ {lang === 'en' ? 'Welcome to Trang & Alfredo\'s Celebration!' : 'Chào mừng đến với Tiệc Cưới Trang & Alfredo!'} ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
};


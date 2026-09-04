'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/lib/i18n';
import { Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { weddingAudio } from '@/lib/audioManager';

interface Props {
  lang: Language;
  onOpened?: () => void;
}

type IntroStage = 'closed' | 'opening' | 'popped' | 'zooming' | 'dissolving';

export const WeddingIntroExperience: React.FC<Props> = ({ lang, onOpened }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [stage, setStage] = useState<IntroStage>('closed');
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
    // 1. Central Golden Burst
    confetti({
      particleCount: 130,
      spread: 100,
      origin: { y: 0.45, x: 0.5 },
      colors: ['#ffd700', '#ff4d4d', '#ffffff', '#ff9900', '#e60000', '#ffea75']
    });

    // 2. Horizon Fireworks Sequences
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 38, spread: 360, ticks: 75, zIndex: 70 };

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
        origin: { x: 0.15 + Math.random() * 0.15, y: Math.random() * 0.35 + 0.25 },
        colors: ['#ffd700', '#ff3366', '#ffcc00', '#ffffff', '#a80000']
      });

      // Right corner firework launch
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.7 + Math.random() * 0.15, y: Math.random() * 0.35 + 0.25 },
        colors: ['#ffd700', '#ff9900', '#ff0033', '#ffffff', '#ffea75']
      });
    }, 300);
  };

  const handleOpenEnvelope = () => {
    if (stage !== 'closed') return;

    // 1. Open flap in 3D
    setStage('opening');
    weddingAudio.playFireworkShow();
    weddingAudio.startMusic();
    window.dispatchEvent(new CustomEvent('wedding:start_youtube_audio'));

    // 2. Letter pops out of the fixed envelope into the air
    setTimeout(() => {
      setStage('popped');
      triggerGrandFireworks();
    }, 450);

    // 3. Letter moves closer and closer toward the camera
    setTimeout(() => {
      setStage('zooming');
    }, 1800);

    // 4. Letter covers the screen and seamlessly becomes the landing page
    setTimeout(() => {
      handleCompleteTransition();
    }, 3400);
  };

  const handleCompleteTransition = () => {
    setStage('dissolving');
    setTimeout(() => {
      sessionStorage.setItem('wedding_invite_opened', 'true');
      setIsVisible(false);
      setHasOpened(true);
      if (onOpened) onOpened();
    }, 700);
  };

  if (!isVisible && hasOpened) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden select-none transition-opacity duration-1000 ${
        stage === 'dissolving'
          ? 'opacity-0 pointer-events-none'
          : 'opacity-100'
      } ${
        stage === 'zooming' || stage === 'dissolving'
          ? 'bg-black/40 backdrop-blur-md'
          : 'bg-[#0e0708]/95 backdrop-blur-xl'
      }`}
    >
      {/* Ambient Night Sky Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-crimson-900/25 rounded-full blur-[120px] animate-pulse-subtle" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gold-600/15 rounded-full blur-3xl" />
      </div>

      {/* Wind Breeze Streamers & Drifting Sparkles when envelope opens */}
      {stage !== 'closed' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          <div className="absolute top-[20%] left-0 w-full h-16 bg-gradient-to-r from-transparent via-gold-400/20 to-transparent blur-md animate-wind-gust" />
          <div
            className="absolute top-[48%] left-0 w-full h-12 bg-gradient-to-r from-transparent via-crimson-400/20 to-transparent blur-md animate-wind-gust"
            style={{ animationDelay: '0.9s' }}
          />
          <div
            className="absolute top-[75%] left-0 w-full h-20 bg-gradient-to-r from-transparent via-gold-300/15 to-transparent blur-lg animate-wind-gust"
            style={{ animationDelay: '1.8s' }}
          />

          {/* Floating Gold & Crimson Wind Motes */}
          <div className="absolute top-[26%] left-[18%] w-2 h-2 rounded-full bg-gold-300/70 blur-xs animate-wind-gust" style={{ animationDuration: '3.8s' }} />
          <div className="absolute top-[38%] left-[10%] w-3 h-3 rounded-full bg-crimson-400/60 blur-xs animate-wind-gust" style={{ animationDuration: '3.2s', animationDelay: '0.5s' }} />
          <div className="absolute top-[60%] left-[22%] w-2.5 h-2.5 rounded-full bg-gold-400/80 blur-xs animate-wind-gust" style={{ animationDuration: '4s', animationDelay: '1.2s' }} />
        </div>
      )}

      {/* Quick Skip Button in Top Corner */}
      <button
        type="button"
        onClick={handleCompleteTransition}
        className={`absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-gold-500/30 text-gold-300 text-xs font-serif transition-opacity duration-500 flex items-center gap-1.5 ${
          stage === 'closed' ? 'opacity-40 hover:opacity-100' : 'opacity-80 hover:opacity-100'
        }`}
      >
        <span>{lang === 'en' ? 'Skip to Site' : 'Vào Trang Ngay'}</span>
        <ArrowRight className="w-3 h-3" />
      </button>

      {/* Main Wrapper */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-md text-center z-20">
        
        {/* Mysterious Top Pill */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-950/90 border border-gold-500/50 text-gold-300 text-xs font-semibold tracking-wider shadow-lg mb-6 transition-all duration-500 ${
            stage !== 'closed' ? 'opacity-0 scale-90 -translate-y-4 pointer-events-none' : 'opacity-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{lang === 'en' ? 'A Special Message For You' : 'Món Quà Bất Ngờ Dành Riêng Cho Bạn'}</span>
        </div>

        {/* ========================================================= */}
        {/* FIXED ENVELOPE IN THE MIDDLE (STAYS ANCHORED IN CENTER)   */}
        {/* ========================================================= */}
        <div
          className="relative w-full max-w-[340px] sm:max-w-[380px] h-[230px] sm:h-[250px] [perspective:1200px] cursor-pointer group"
          onClick={stage === 'closed' ? handleOpenEnvelope : undefined}
        >
          {/* Envelope Fixed Outer Shell */}
          <div
            className={`relative w-full h-full rounded-2xl transition-transform duration-500 ${
              stage === 'closed' ? 'group-hover:scale-105 active:scale-95 animate-wind-float' : ''
            }`}
          >
            {/* 1. Envelope Back Wall (Interior Silk) */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#52090c] via-[#6e0f14] to-[#450608] border-2 border-gold-500/40 shadow-2xl overflow-hidden z-0">
              <div className="absolute inset-0 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
            </div>

            {/* 2. Top Flap: Opens backward in 3D */}
            <div
              className={`absolute top-0 inset-x-0 h-full transition-all duration-700 ease-in-out pointer-events-none ${
                stage !== 'closed' ? 'z-0' : 'z-20'
              }`}
              style={{
                transformOrigin: 'top center',
                transform: stage !== 'closed' ? 'rotateX(180deg)' : 'rotateX(0deg)'
              }}
            >
              <div
                className="w-full h-full bg-gradient-to-b from-[#b5262c] via-[#94171d] to-[#6e0c11] shadow-xl"
                style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%)' }}
              />
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="0" x2="50%" y2="50%" stroke="#e3ce8a" strokeWidth="2" strokeOpacity="0.8" />
                <line x1="100%" y1="0" x2="50%" y2="50%" stroke="#e3ce8a" strokeWidth="2" strokeOpacity="0.8" />
              </svg>
            </div>

            {/* ========================================================================= */}
            {/* 3. THE LETTER: POPS OUT OF THE ENVELOPE, HOVERS, THEN ZOOMS TO FULLSCREEN */}
            {/* ========================================================================= */}
            <div
              className={`absolute inset-x-3 bottom-2 h-[200px] sm:h-[220px] rounded-2xl bg-gradient-to-b from-[#fffefc] via-[#faf6ed] to-[#f4ecd8] border-2 border-gold-400 p-5 shadow-2xl flex flex-col items-center justify-between text-center select-none ${
                stage === 'zooming'
                  ? 'z-40'
                  : stage === 'popped'
                  ? 'z-30 animate-wind-float shadow-gold-500/40'
                  : 'z-5 opacity-90'
              }`}
              style={{
                transformOrigin: 'center center',
                transition:
                  stage === 'zooming'
                    ? 'transform 1500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 1200ms ease-out'
                    : stage === 'popped'
                    ? 'transform 1000ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 800ms ease-out'
                    : 'transform 500ms ease-out',
                transform:
                  stage === 'zooming'
                    ? 'translateY(0px) scale(4.2)'
                    : stage === 'popped'
                    ? 'translateY(-200px) scale(1.08) rotate(-1.5deg)'
                    : 'translateY(8px) scale(0.96)'
              }}
              onClick={stage === 'popped' || stage === 'zooming' ? handleCompleteTransition : undefined}
            >
              {/* Corner Filigree */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gold-500/80" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gold-500/80" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gold-500/80" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gold-500/80" />

              {/* Letter Header */}
              <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-crimson-800">
                <Sparkles className="w-3 h-3 text-gold-600" />
                <span>{lang === 'en' ? 'The Wedding Celebration' : 'Dạ Tiệc Cưới Thân Mật'}</span>
                <Sparkles className="w-3 h-3 text-gold-600" />
              </div>

              {/* Illuminated Double Happiness Emblem */}
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-br from-crimson-800 to-crimson-950 flex items-center justify-center border-2 border-gold-300 shadow-md">
                <span className="text-2xl sm:text-3xl font-serif text-gold-200 font-bold select-none">
                  囍
                </span>
              </div>

              {/* Couple Names */}
              <div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight leading-tight">
                  Trang <span className="text-gold-600 font-sans font-light">&</span> Alfredo
                </h3>
                <p className="text-[11px] text-crimson-700 font-serif italic mt-0.5">
                  "{lang === 'en' ? "We said 'I do', now let's celebrate!" : "Chúng mình đã nên duyên, nay cùng nâng ly chúc mừng!"}"
                </p>
              </div>

              {/* Schedule & Location Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-50 border border-crimson-200 text-[10px] sm:text-xs font-semibold text-crimson-900">
                <span>{lang === 'en' ? 'Dec 5, 2026' : '05.12.2026'}</span>
                <span className="text-gold-500">•</span>
                <span>The Grand Pearl Palace</span>
              </div>
            </div>

            {/* 4. Envelope Front Pocket: Stays fixed in the middle, in front of the letter initially */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none z-10 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#7a1015] via-[#851218] to-transparent"
                style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)' }}
              />
              <div
                className="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-[#7a1015] via-[#851218] to-transparent"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-[#8a141a] via-[#a31e24] to-[#801318] shadow-md border-t border-gold-400/40"
                style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 46%)' }}
              />
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="100%" x2="50%" y2="46%" stroke="#e3ce8a" strokeWidth="1.5" strokeOpacity="0.7" />
                <line x1="100%" y1="100%" x2="50%" y2="46%" stroke="#e3ce8a" strokeWidth="1.5" strokeOpacity="0.7" />
              </svg>
            </div>

            {/* 5. Central Gold Wax Seal on Closed Flap */}
            {stage === 'closed' && (
              <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center pointer-events-none transition-all duration-300">
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

            {/* 6. Gold Corner Accents on Envelope */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-gold-400/70 rounded-tl-lg pointer-events-none z-20" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-gold-400/70 rounded-tr-lg pointer-events-none z-20" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-gold-400/70 rounded-bl-lg pointer-events-none z-20" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-gold-400/70 rounded-br-lg pointer-events-none z-20" />
          </div>
        </div>

        {/* Call to Action Button below Envelope */}
        <div
          className={`w-full max-w-sm mt-6 transition-all duration-500 ${
            stage !== 'closed' ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={handleOpenEnvelope}
            className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-stone-950 hover:shadow-gold-400/30 hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-stone-900" />
            <span>{lang === 'en' ? 'Tap to Open Envelope' : 'Chạm Để Mở Phong Bì'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/lib/i18n';
import { Sparkles, Heart, Gift, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { weddingAudio } from '@/lib/audioManager';

interface Props {
  lang: Language;
  onOpened?: () => void;
}

export const WeddingIntroExperience: React.FC<Props> = ({ lang, onOpened }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
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
    // 1. Initial Central Burst
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#ffd700', '#ff4d4d', '#ffffff', '#ff9900', '#e60000']
    });

    // 2. Left and Right Firework Launch Sequence
    const duration = 3000; // 3 seconds fireworks
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 60 };

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
    }, 350);
  };

  const handleOpenEnvelope = () => {
    if (isOpening) return;
    setIsOpening(true);

    // Play synthesized realistic firework booms, launch whooshes and sparkles
    weddingAudio.playFireworkShow();

    // Start background YouTube music track (IOe0tNoUGv8)
    weddingAudio.startMusic();
    window.dispatchEvent(new CustomEvent('wedding:start_youtube_audio'));

    // Launch multi-stage grand fireworks
    triggerGrandFireworks();

    // Step 1: Smoothly dissolve envelope and unveil the landing page behind it
    setTimeout(() => {
      setIsDissolving(true);
    }, 2400);

    // Step 2: Unmount after the 1.2s smooth dissolve finishes
    setTimeout(() => {
      sessionStorage.setItem('wedding_invite_opened', 'true');
      setIsVisible(false);
      setHasOpened(true);
      if (onOpened) onOpened();
    }, 3600);
  };

  if (!isVisible && hasOpened) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none transition-all duration-1200 ease-out ${
        isDissolving
          ? 'opacity-0 pointer-events-none'
          : 'opacity-100'
      } ${
        isOpening ? 'bg-black/90 backdrop-blur-2xl' : 'bg-[#0e0708]/95 backdrop-blur-xl'
      }`}
    >
      {/* Radiant Golden Glow that connects into the landing page */}
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-500/25 via-crimson-900/20 to-transparent transition-opacity duration-1000 ${
        isDissolving ? 'opacity-100 scale-125' : 'opacity-0'
      } pointer-events-none`} />

      {/* Ambient Night Sky & Glowing Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-crimson-900/30 rounded-full blur-[100px] animate-pulse-subtle" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gold-600/15 rounded-full blur-3xl" />
      </div>

      <div className={`relative max-w-md w-full text-center space-y-6 transition-all duration-1000 ease-out ${
        isDissolving
          ? 'scale-110 opacity-0 blur-xs'
          : isOpening
          ? 'scale-105 animate-pulse'
          : 'animate-slide-up'
      }`}>
        {/* Mysterious Top Badge (No wedding spoilers or dates) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-950/90 border border-gold-500/50 text-gold-300 text-xs font-semibold tracking-wider shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{lang === 'en' ? 'A Special Message For You' : 'Món Quà Bất Ngờ Dành Riêng Cho Bạn'}</span>
        </div>

        {/* The Vietnamese Silk Red Envelope / Bao Thư Hỷ Sự */}
        <div
          onClick={handleOpenEnvelope}
          className={`relative mx-auto w-full max-w-[340px] sm:max-w-[380px] aspect-[4/3] rounded-3xl bg-gradient-to-br from-[#8a141a] via-[#ab252b] to-[#5e0a0e] p-6 shadow-2xl border-2 border-gold-400/80 cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-500 group ${
            isOpening ? 'scale-110 shadow-gold-500/50 shadow-2xl' : ''
          }`}
        >
          {/* Gold Foil Corner Ornaments */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-gold-400/80 rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-gold-400/80 rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-gold-400/80 rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-gold-400/80 rounded-br-lg" />

          {/* Envelope Flap Crease Simulation */}
          <div className="absolute top-0 left-0 right-0 h-1/2 border-b border-gold-400/30 bg-gradient-to-b from-black/15 to-transparent pointer-events-none" />

          {/* Central Gold Wax Seal */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 p-0.5 shadow-xl group-hover:shadow-gold-500/50 transition-shadow">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-crimson-800 to-crimson-950 flex items-center justify-center border-2 border-gold-200">
                <span className="text-4xl sm:text-5xl font-serif text-gold-200 font-bold select-none drop-shadow-md">
                  囍
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gold-100 tracking-wide">
                Trang & Alfredo
              </h2>
              <p className="text-xs text-gold-300/80 font-serif italic mt-0.5">
                {lang === 'en' ? 'Click to reveal' : 'Chạm để khám phá'}
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Button (Mysterious & Interactive) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleOpenEnvelope}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-stone-950 font-bold text-sm sm:text-base shadow-xl hover:shadow-gold-400/30 hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-stone-900" />
            <span>
              {lang === 'en' ? 'Tap to Open' : 'Chạm Để Mở'}
            </span>
          </button>

          {isOpening && (
            <p className="text-xs text-gold-300 font-serif animate-pulse">
              ✨ {lang === 'en' ? 'Opening...' : 'Đang mở...'} ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

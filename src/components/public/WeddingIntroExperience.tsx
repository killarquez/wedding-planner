'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/lib/i18n';
import { Sparkles, ArrowRight, X, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { weddingAudio } from '@/lib/audioManager';

interface Props {
  lang: Language;
  onOpened?: () => void;
}

type AnimationStep = 'ready' | 'animating' | 'kissed' | 'revealed';

export const WeddingIntroExperience: React.FC<Props> = ({ lang, onOpened }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<AnimationStep>('ready');
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

  const triggerCelebrationConfetti = () => {
    // 1. Central Fountain Confetti Burst
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.45, x: 0.5 },
      colors: ['#ffd700', '#ff4d4d', '#ffffff', '#ffaa00', '#d4af37'],
      zIndex: 120,
    });

    // 2. Dual-corner firework launch sequence
    const duration = 2400;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 120 };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 40 * (timeLeft / duration);

      // Left corner
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.2 + Math.random() * 0.15, y: Math.random() * 0.35 + 0.2 },
        colors: ['#ffd700', '#ff3366', '#ffcc00', '#ffffff', '#c41e3a'],
      });

      // Right corner
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.65 + Math.random() * 0.15, y: Math.random() * 0.35 + 0.2 },
        colors: ['#ffd700', '#ff9900', '#ff0033', '#ffffff', '#fae19c'],
      });
    }, 300);
  };

  const handleStartExperience = () => {
    if (step !== 'ready') return;

    // 1. Instant audio response on user tap
    weddingAudio.playFireworkShow();
    weddingAudio.startMusic();
    window.dispatchEvent(new CustomEvent('wedding:start_youtube_audio'));

    // 2. Continuous animation begins: couple glides together smoothly
    setStep('animating');

    // 3. Kiss meets at 1050ms: hearts erupt, fireworks boom
    setTimeout(() => {
      setStep('kissed');
      triggerCelebrationConfetti();
    }, 1050);

    // 4. Golden invitation card glides up into center view at 3600ms (allowing guests to enjoy the kiss, music, and fireworks)
    setTimeout(() => {
      setStep('revealed');
    }, 3600);
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

  const isKissedOrRevealed = step === 'kissed' || step === 'revealed';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 select-none transition-all duration-700 ease-out overflow-hidden ${
        isDissolving
          ? 'opacity-0 pointer-events-none scale-105'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Ambient Dark Crimson Vignette Backdrop */}
      <div className="absolute inset-0 bg-[#0e0406] bg-[radial-gradient(ellipse_at_center,_#2b0c11_0%,_#140407_65%,_#070102_100%)]" />

      {/* Floating Sparkles & Golden Glow */}
      <div
        className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/20 via-crimson-900/10 to-transparent transition-opacity duration-700 pointer-events-none ${
          isKissedOrRevealed ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Top Header Pill & Quick Skip */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-full max-w-sm px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-950/85 border border-amber-400/40 backdrop-blur-md text-amber-200 text-xs font-serif tracking-wide shadow-xl">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>
            {lang === 'en'
              ? 'Trang & Alfredo Wedding Invitation'
              : 'Thiệp Báo Hỷ Trang & Alfredo'}
          </span>
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-stone-600/50 text-stone-300 hover:text-white text-xs backdrop-blur-md transition-all flex items-center gap-1 shadow-lg cursor-pointer"
        >
          <span>{lang === 'en' ? 'Skip' : 'Bỏ qua'}</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Main Festive Wedding Poster Stage Canvas */}
      <div
        onClick={handleStartExperience}
        className={`relative w-full max-w-[390px] sm:max-w-[430px] aspect-[848/1264] max-h-[88vh] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-amber-400/40 transition-all duration-700 ${
          step === 'ready' ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
        }`}
      >
        {/* Stage Artwork Backdrop: Lanterns, Fans, Center Red Plaque, 囍 Seal, and Cloud Waves */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/images/cartoon-wedding-stage.jpg)',
          }}
        />

        {/* Subtle Vignette on Stage Edges */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(10,2,4,0.35)_100%)] pointer-events-none" />

        {/* Golden Diamond Seal at Top of Red Plaque */}
        <div className="absolute top-[3.2%] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="w-3.5 h-3.5 rotate-45 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-sm border border-amber-100/90" />
        </div>

        {/* 3. The Animated Couple Layer */}
        <div className="absolute bottom-[1.6%] inset-x-0 h-[44.2%] pointer-events-none z-30">
          {/* Walking Bride */}
          <div
            className={`absolute bottom-0 h-full aspect-[496/860] transition-all duration-1000 ease-out ${
              isKissedOrRevealed ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
            }`}
            style={{
              left: '17.7%',
              transform: step === 'ready' ? 'translateX(-35%)' : 'translateX(0%)',
            }}
          >
            <img
              src="/images/bride-walk-calibrated.png"
              alt="Bride"
              className={`w-full h-full object-contain ${
                step === 'animating'
                  ? 'animate-[walkBob_0.35s_ease-in-out_infinite]'
                  : 'animate-[gentleSway_3s_ease-in-out_infinite]'
              } drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]`}
            />
          </div>

          {/* Walking Groom */}
          <div
            className={`absolute bottom-0 h-full aspect-[576/860] transition-all duration-1000 ease-out ${
              isKissedOrRevealed ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
            }`}
            style={{
              right: '17.6%',
              transform: step === 'ready' ? 'translateX(35%)' : 'translateX(0%)',
            }}
          >
            <img
              src="/images/groom-walk-calibrated.png"
              alt="Groom"
              className={`w-full h-full object-contain ${
                step === 'animating'
                  ? 'animate-[walkBob_0.35s_ease-in-out_infinite_0.17s]'
                  : 'animate-[gentleSway_3s_ease-in-out_infinite_1.5s]'
              } drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]`}
            />
          </div>

          {/* Kissing Couple (Leaning into the kiss with closed eyes & flower ball united) */}
          <div
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-full aspect-[695/860] transition-all duration-500 ease-out ${
              isKissedOrRevealed
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <img
              src="/images/cartoon-couple-kiss.png"
              alt="Bride and Groom Kiss"
              className="w-full h-full object-contain drop-shadow-[0_12px_25px_rgba(0,0,0,0.5)]"
            />

            {/* Sweet Floating Hearts Erupting Exactly from the Kiss */}
            {isKissedOrRevealed && (
              <div className="absolute top-[26%] left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-40">
                <div className="absolute animate-[floatHeart_1.8s_ease-out_infinite] text-rose-400">
                  <Heart className="w-5 h-5 fill-rose-500 text-rose-300 drop-shadow" />
                </div>
                <div className="absolute animate-[floatHeart_2.2s_ease-out_infinite_0.4s] text-amber-300 -translate-x-4">
                  <Sparkles className="w-4 h-4 fill-amber-400 text-amber-200 drop-shadow" />
                </div>
                <div className="absolute animate-[floatHeart_2s_ease-out_infinite_0.8s] text-crimson-400 translate-x-5">
                  <Heart className="w-4 h-4 fill-red-500 text-red-200 drop-shadow" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Perfectly Centered "Tap to Open" Call to Action Badge */}
        <div
          className={`absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-full px-6 flex flex-col items-center pointer-events-none transition-all duration-300 ${
            step === 'ready' ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90'
          }`}
        >
          <div className="animate-bounce">
            <button
              type="button"
              onClick={handleStartExperience}
              className="py-3 px-5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-xs sm:text-sm shadow-[0_12px_30px_rgba(0,0,0,0.7)] flex items-center justify-center gap-2 border-2 border-amber-200/90 whitespace-nowrap cursor-pointer transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-stone-900" />
              <span>
                {lang === 'en'
                  ? 'Tap to Open Wedding Invitation'
                  : 'Chạm Để Mở Thiệp Báo Hỷ'}
              </span>
            </button>
          </div>
          <p className="mt-2 text-[11px] text-amber-200/90 font-serif tracking-wider drop-shadow-md">
            {lang === 'en' ? 'Trang & Alfredo • Dec 5, 2026' : 'Trang & Alfredo • 05.12.2026'}
          </p>
        </div>
      </div>

      {/* 5. The Unveiled Golden Wedding Invitation Card (Centered, Crystal-Clear Legibility) */}
      {step === 'revealed' && (
        <div
          onClick={handleCompleteIntro}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-500 animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[340px] sm:max-w-[380px] rounded-2xl bg-gradient-to-b from-[#fffefc] via-[#faf5ea] to-[#f4ecd8] text-stone-900 p-5 sm:p-6 flex flex-col justify-between items-center text-center border-2 border-amber-400/90 shadow-[0_25px_60px_rgba(0,0,0,0.85)] animate-scale-up cursor-default overflow-hidden"
          >
            {/* Shimmering Foil Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

            {/* Traditional Gold Foil Corner Borders */}
            <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-sm pointer-events-none" />

            {/* Top Double Happiness Crest 囍 */}
            <div className="flex flex-col items-center space-y-1 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shadow-md">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-crimson-800 to-crimson-950 flex items-center justify-center border border-amber-300/80">
                  <span className="text-2xl font-serif text-amber-200 font-bold select-none drop-shadow">
                    囍
                  </span>
                </div>
              </div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-amber-800/90 font-serif font-semibold mt-0.5">
                {lang === 'en' ? 'Wedding Banquet & Reception' : 'Tiệc Cưới & Báo Hỷ'}
              </div>
            </div>

            {/* Couple Calligraphy */}
            <div className="space-y-1 mb-2.5">
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

            {/* Date & Venue Box */}
            <div className="w-full py-2.5 border-t border-b border-amber-400/40 space-y-1 text-center bg-amber-50/50 rounded-lg mb-4">
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

            {/* Enter Celebration Button */}
            <button
              type="button"
              onClick={handleCompleteIntro}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{lang === 'en' ? 'Enter Celebration' : 'Vào Tiệc Cưới'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Embedded CSS for Floating Hearts and Step Bobbing */}
      <style jsx>{`
        @keyframes gentleSway {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-4px) rotate(1deg);
          }
        }
        @keyframes walkBob {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        @keyframes floatHeart {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.6);
          }
          25% {
            opacity: 1;
            transform: translateY(-20px) scale(1.1);
          }
          75% {
            opacity: 0.8;
            transform: translateY(-50px) scale(1.3);
          }
          100% {
            opacity: 0;
            transform: translateY(-75px) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
};

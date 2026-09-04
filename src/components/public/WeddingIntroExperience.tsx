'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/lib/i18n';
import { Sparkles, Calendar, MapPin, Heart, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { weddingAudio } from '@/lib/audioManager';

interface Props {
  lang: Language;
  onOpened?: () => void;
}

type IntroStage = 'closed' | 'opening' | 'emerged' | 'fullscreen' | 'dissolving';

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
      particleCount: 140,
      spread: 110,
      origin: { y: 0.45, x: 0.5 },
      colors: ['#ffd700', '#ff4d4d', '#ffffff', '#ff9900', '#e60000', '#ffea75']
    });

    // 2. Left and Right Horizon Launch Sequences
    const duration = 3600;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 38, spread: 360, ticks: 80, zIndex: 70 };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 55 * (timeLeft / duration);

      // Left corner firework launch
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.12 + Math.random() * 0.2, y: Math.random() * 0.4 + 0.25 },
        colors: ['#ffd700', '#ff3366', '#ffcc00', '#ffffff', '#a80000']
      });

      // Right corner firework launch
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.68 + Math.random() * 0.2, y: Math.random() * 0.4 + 0.25 },
        colors: ['#ffd700', '#ff9900', '#ff0033', '#ffffff', '#ffea75']
      });
    }, 320);
  };

  const handleOpenEnvelope = () => {
    if (stage !== 'closed') return;

    // 1. Flap unsealing
    setStage('opening');
    weddingAudio.playFireworkShow();
    weddingAudio.startMusic();
    window.dispatchEvent(new CustomEvent('wedding:start_youtube_audio'));

    // 2. Letter emerges completely out of envelope into the wind
    setTimeout(() => {
      setStage('emerged');
      triggerGrandFireworks();
    }, 450);

    // 3. Letter catches wind and expands into full-screen royal invitation
    setTimeout(() => {
      setStage('fullscreen');
    }, 1600);

    // 4. Dissolve full-screen letter smoothly into the landing page
    setTimeout(() => {
      handleEnterSite();
    }, 5500);
  };

  const handleEnterSite = () => {
    setStage('dissolving');
    setTimeout(() => {
      sessionStorage.setItem('wedding_invite_opened', 'true');
      setIsVisible(false);
      setHasOpened(true);
      if (onOpened) onOpened();
    }, 900);
  };

  if (!isVisible && hasOpened) return null;

  const isWindActive = stage !== 'closed';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-1000 select-none ${
        stage === 'dissolving'
          ? 'opacity-0 pointer-events-none'
          : 'opacity-100'
      } ${
        stage === 'fullscreen' || stage === 'dissolving'
          ? 'bg-black/85 backdrop-blur-2xl'
          : 'bg-[#0e0708]/95 backdrop-blur-xl'
      }`}
    >
      {/* Ambient Night Sky Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-crimson-900/25 rounded-full blur-[120px] animate-pulse-subtle" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gold-600/15 rounded-full blur-3xl" />
      </div>

      {/* Wind Breeze Streamers & Drifting Sparkles */}
      {isWindActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          {/* Glowing Wind Streamers */}
          <div className="absolute top-[22%] left-0 w-full h-16 bg-gradient-to-r from-transparent via-gold-400/20 to-transparent blur-md animate-wind-gust" />
          <div
            className="absolute top-[48%] left-0 w-full h-12 bg-gradient-to-r from-transparent via-crimson-400/20 to-transparent blur-md animate-wind-gust"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute top-[72%] left-0 w-full h-20 bg-gradient-to-r from-transparent via-gold-300/15 to-transparent blur-lg animate-wind-gust"
            style={{ animationDelay: '2s' }}
          />

          {/* Floating Breeze Particles */}
          <div className="absolute top-[28%] left-[15%] w-2.5 h-2.5 rounded-full bg-gold-300/70 blur-xs animate-wind-gust" style={{ animationDuration: '4s' }} />
          <div className="absolute top-[38%] left-[10%] w-3 h-3 rounded-full bg-crimson-400/60 blur-xs animate-wind-gust" style={{ animationDuration: '3.4s', animationDelay: '0.6s' }} />
          <div className="absolute top-[62%] left-[25%] w-2 h-2 rounded-full bg-gold-400/80 blur-xs animate-wind-gust" style={{ animationDuration: '4.2s', animationDelay: '1.4s' }} />
          <div className="absolute top-[52%] left-[18%] w-1.5 h-1.5 rounded-full bg-amber-200/90 blur-xs animate-wind-gust" style={{ animationDuration: '3.8s', animationDelay: '2.1s' }} />
        </div>
      )}

      {/* STAGE A: Envelope Opening & Letter Emerging */}
      {(stage === 'closed' || stage === 'opening' || stage === 'emerged') && (
        <div className="relative max-w-md w-full text-center space-y-6 animate-slide-up z-30">
          {/* Mysterious Top Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-950/90 border border-gold-500/50 text-gold-300 text-xs font-semibold tracking-wider shadow-lg transition-opacity duration-500 ${
            stage !== 'closed' ? 'opacity-0' : 'opacity-100'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>{lang === 'en' ? 'A Special Message For You' : 'Món Quà Bất Ngờ Dành Riêng Cho Bạn'}</span>
          </div>

          {/* 3D Envelope Container with Wind Physics */}
          <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] h-[230px] sm:h-[250px] [perspective:1000px] cursor-pointer group">
            
            {/* Main Envelope Body Wrapper */}
            <div
              onClick={handleOpenEnvelope}
              className={`relative w-full h-full rounded-2xl transition-all duration-1000 ${
                stage === 'emerged'
                  ? 'translate-y-20 opacity-30 scale-95'
                  : stage === 'opening'
                  ? 'scale-105'
                  : 'group-hover:scale-105 active:scale-95 animate-wind-float'
              }`}
            >
              {/* 1. Envelope Back Interior */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#52090c] via-[#6e0f14] to-[#450608] border-2 border-gold-500/40 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
              </div>

              {/* 2. Invitation Letter Gliding Out on the Wind */}
              <div
                className={`absolute inset-x-3 bottom-2 h-[200px] sm:h-[220px] rounded-xl bg-gradient-to-b from-[#fffefb] via-[#fbf8f0] to-[#f5eedc] text-stone-900 border-2 border-gold-400/90 p-4 shadow-2xl flex flex-col items-center justify-between text-center transition-all duration-1000 ease-out z-10 ${
                  stage === 'emerged'
                    ? '-translate-y-[230px] sm:-translate-y-[260px] scale-110 shadow-gold-500/50 animate-wind-float'
                    : stage === 'opening'
                    ? '-translate-y-8 scale-100 opacity-90'
                    : 'translate-y-0 scale-95 opacity-80'
                }`}
              >
                {/* Corner Accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gold-500/70" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gold-500/70" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gold-500/70" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gold-500/70" />

                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-crimson-800">
                  <Sparkles className="w-3 h-3 text-gold-600" />
                  <span>{lang === 'en' ? 'The Wedding Celebration' : 'Dạ Tiệc Cưới'}</span>
                  <Sparkles className="w-3 h-3 text-gold-600" />
                </div>

                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-crimson-800 to-crimson-950 flex items-center justify-center border border-gold-300 shadow-md">
                  <span className="text-xl sm:text-2xl font-serif text-gold-200 font-bold">囍</span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight leading-tight">
                    Trang <span className="text-gold-600 font-sans font-light">&</span> Alfredo
                  </h3>
                  <p className="text-[11px] sm:text-xs text-crimson-700 font-serif italic mt-0.5">
                    {lang === 'en' ? "We said 'I do', now let's celebrate!" : "Chúng mình đã nên duyên, nay cùng nâng ly chúc mừng!"}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-50 border border-crimson-200 text-[10px] sm:text-xs font-semibold text-crimson-900">
                  <span>{lang === 'en' ? 'Saturday, Dec 5, 2026' : 'Thứ Bảy, 05.12.2026'}</span>
                  <span className="text-gold-500">•</span>
                  <span>Westminster, CA</span>
                </div>
              </div>

              {/* 3. Envelope Front Pocket (Lower & Side Folds) */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none z-20 overflow-hidden">
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

              {/* 4. Top Flap Folding in 3D */}
              <div
                className={`absolute top-0 inset-x-0 h-full transition-all duration-700 ease-in-out pointer-events-none ${
                  stage !== 'closed' ? 'z-0' : 'z-30'
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

              {/* 5. Central Gold Wax Seal */}
              {stage === 'closed' && (
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

              {/* 6. Gold Corner Accents */}
              <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-gold-400/70 rounded-tl-lg pointer-events-none z-30" />
              <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-gold-400/70 rounded-tr-lg pointer-events-none z-30" />
              <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-gold-400/70 rounded-bl-lg pointer-events-none z-30" />
              <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-gold-400/70 rounded-br-lg pointer-events-none z-30" />
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleOpenEnvelope}
              disabled={stage !== 'closed'}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-2 group ${
                stage !== 'closed'
                  ? 'bg-gold-600/50 text-stone-900/60 cursor-default'
                  : 'bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-stone-950 hover:shadow-gold-400/30 hover:brightness-110 active:brightness-95'
              }`}
            >
              <Sparkles className={`w-4 h-4 text-stone-900 ${stage !== 'closed' ? 'animate-spin' : ''}`} />
              <span>
                {stage !== 'closed'
                  ? (lang === 'en' ? 'Catching the breeze...' : 'Đang mở theo làn gió...')
                  : (lang === 'en' ? 'Tap to Open Envelope' : 'Chạm Để Mở Phong Bì')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE B: Full-Screen Letter Swaying on the Wind into Landing Page */}
      {(stage === 'fullscreen' || stage === 'dissolving') && (
        <div
          onClick={handleEnterSite}
          className={`relative w-full max-w-xl sm:max-w-2xl md:max-w-3xl rounded-3xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f4ecd8] border-2 border-gold-400/90 p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-1000 ease-out z-50 ${
            stage === 'dissolving'
              ? 'scale-125 opacity-0 blur-sm pointer-events-none'
              : 'scale-100 opacity-100 animate-wind-float shadow-gold-500/30'
          }`}
          style={{ minHeight: '520px' }}
        >
          {/* Royal Corner Ornaments */}
          <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-gold-500/80 rounded-tl-sm" />
          <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-gold-500/80 rounded-tr-sm" />
          <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-gold-500/80 rounded-bl-sm" />
          <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-gold-500/80 rounded-br-sm" />

          {/* Top Celebration Emblem */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-crimson-50 border border-crimson-200 text-crimson-900 text-xs font-semibold tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-gold-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{lang === 'en' ? 'The Wedding Celebration' : 'Dạ Tiệc Cưới Thân Mật'}</span>
              <span className="text-crimson-300">•</span>
              <span>{lang === 'en' ? 'December 5, 2026' : '05.12.2026'}</span>
            </div>

            {/* Glowing Double Happiness Seal */}
            <div className="flex justify-center pt-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-crimson-800 via-crimson-900 to-crimson-950 flex items-center justify-center border-2 border-gold-300 shadow-lg">
                <span className="text-3xl sm:text-4xl font-serif text-gold-200 font-bold select-none drop-shadow-sm">
                  囍
                </span>
              </div>
            </div>
          </div>

          {/* Couple Names & Title */}
          <div className="space-y-3 my-4 max-w-xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-900 tracking-tight">
              Trang <span className="text-gold-600 font-sans font-light">&</span> Alfredo
            </h2>

            <p className="text-lg sm:text-xl font-serif text-crimson-800 font-medium leading-relaxed">
              "{lang === 'en' ? "We said 'I do', now let's celebrate!" : "Chúng mình đã nên duyên, nay cùng nâng ly chúc mừng!"}"
            </p>

            <p className="text-xs sm:text-sm md:text-base text-stone-600 leading-relaxed font-sans px-2">
              {lang === 'en'
                ? "We're so excited to welcome you to our wedding celebration! Join us for an intimate, joy-filled evening with family and friends, featuring a delicious multi-course banquet, heartfelt toasts, music, and lasting memories."
                : "Chúng mình vô cùng hào hứng được đón tiếp quý khách đến chung vui trong ngày cưới! Hãy cùng chia sẻ một buổi tối ấm cúng, tràn đầy niềm vui bên gia đình và bạn bè thân hữu, thưởng thức thực đơn yến tiệc thịnh soạn, cùng nâng ly chúc mừng trong điệu nhạc và những kỷ niệm đáng nhớ."}
            </p>
          </div>

          {/* Celebration Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mb-6">
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-stone-200/80 flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-crimson-50 text-crimson-800">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  {lang === 'en' ? 'Date & Time' : 'Thời Gian'}
                </p>
                <p className="text-xs sm:text-sm font-bold text-stone-900">
                  {lang === 'en' ? 'Saturday, Dec 5, 2026' : 'Thứ Bảy, 05/12/2026'}
                </p>
                <p className="text-[11px] text-stone-600">5:30 PM • 6:30 PM Feast</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-stone-200/80 flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-gold-50 text-gold-800">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  {lang === 'en' ? 'Venue Location' : 'Địa Điểm'}
                </p>
                <p className="text-xs sm:text-sm font-bold text-stone-900">The Grand Pearl Palace</p>
                <p className="text-[11px] text-stone-600">Westminster, California</p>
              </div>
            </div>
          </div>

          {/* Enter Celebration Button / Indicator */}
          <div className="w-full max-w-sm space-y-2">
            <button
              type="button"
              onClick={handleEnterSite}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-crimson-700 via-crimson-800 to-crimson-950 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:from-crimson-800 hover:to-crimson-900 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{lang === 'en' ? 'Enter Celebration' : 'Bước Vào Tiệc Cưới'}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[11px] text-stone-400 italic">
              {lang === 'en' ? 'Click anywhere to explore the wedding portal' : 'Chạm vào bất kỳ vị trí nào để vào trang'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


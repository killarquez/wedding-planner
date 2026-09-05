'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language } from '@/lib/i18n';
import { Music, Volume2, VolumeX, RotateCcw, Disc3, Play, Pause, Video, X } from 'lucide-react';
import { weddingAudio } from '@/lib/audioManager';

interface Props {
  lang: Language;
  onReplayIntro?: () => void;
}

export const YOUTUBE_VIDEO_ID = 'IOe0tNoUGv8'; // Đức Phúc x 911 x Khắc Hưng - Em Đồng Ý (I Do)
export const START_TIME_SECONDS = 13; // Skip the first 13 seconds of introduction

export const MusicPlayerWidget: React.FC<Props> = ({ lang, onReplayIntro }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Listen for custom event from WeddingIntroExperience to start YouTube playback
    const handleStartAudio = () => {
      startYouTubePlayback();
    };
    window.addEventListener('wedding:start_youtube_audio', handleStartAudio);
    return () => window.removeEventListener('wedding:start_youtube_audio', handleStartAudio);
  }, []);

  const startYouTubePlayback = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
      iframeRef.current.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${START_TIME_SECONDS}, true]}`, '*');
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      setIsPlaying(true);
      setIsMuted(false);
    }
  };

  const pauseYouTubePlayback = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      setIsPlaying(false);
    }
  };

  const togglePlayback = () => {
    if (isPlaying && !isMuted) {
      pauseYouTubePlayback();
      setIsPlaying(false);
    } else {
      startYouTubePlayback();
      setIsPlaying(true);
      setIsMuted(false);
    }
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowVideoModal(true);
    startYouTubePlayback();
  };

  return (
    <>
      {/* Background YouTube Audio Stream Player (Starts at second 10) */}
      <div className="fixed -bottom-96 -right-96 opacity-0 pointer-events-none w-10 h-10 overflow-hidden">
        <iframe
          ref={iframeRef}
          id="yt-wedding-audio-frame"
          width="200"
          height="200"
          src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?start=${START_TIME_SECONDS}&enablejsapi=1&autoplay=0&loop=1&playlist=${YOUTUBE_VIDEO_ID}`}
          title="Em Đồng Ý (I Do) - Đức Phúc x 911"
          allow="autoplay; encrypted-media"
        />
      </div>

      {/* Floating Interactive Music Disc Widget */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-full border-2 border-gold-400 shadow-xl hover:shadow-2xl transition-all animate-fade-in">
        {/* Vinyl Disc Icon */}
        <button
          onClick={togglePlayback}
          className={`w-10 h-10 rounded-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 text-gold-300 flex items-center justify-center shadow-inner relative transition-transform ${
            isPlaying ? 'animate-spin' : ''
          }`}
          style={{ animationDuration: '4s' }}
          title={isPlaying ? 'Pause Music' : 'Play Music'}
        >
          <Disc3 className="w-6 h-6 text-gold-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-crimson-800 absolute" />
        </button>

        {/* Song Details & Sound Wave */}
        <div onClick={togglePlayback} className="cursor-pointer pr-1 select-none">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-stone-900 font-serif leading-none truncate max-w-[130px] sm:max-w-[160px]">
              Em Đồng Ý (I Do)
            </p>
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-crimson-700 h-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                <span className="w-0.5 bg-gold-600 h-2/3 animate-pulse" style={{ animationDelay: '0.3s' }} />
                <span className="w-0.5 bg-crimson-700 h-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              </div>
            ) : (
              <span className="text-[10px] text-stone-400 font-medium italic">
                (Paused)
              </span>
            )}
          </div>
          <p className="text-[10px] text-stone-500 mt-0.5">
            Đức Phúc • 911 • Khắc Hưng
          </p>
        </div>

        {/* Play / Pause Toggle Button */}
        <button
          onClick={togglePlayback}
          className="p-2 rounded-full hover:bg-stone-100 text-stone-700 transition-colors"
          title={isPlaying ? 'Pause Music' : 'Play Music'}
        >
          {isPlaying ? (
            <Volume2 className="w-4 h-4 text-crimson-700" />
          ) : (
            <VolumeX className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {/* Watch Official Video (MV) Modal Button */}
        <button
          onClick={handleOpenModal}
          className="p-1.5 px-2.5 rounded-full bg-crimson-50 hover:bg-crimson-100 text-crimson-800 text-[11px] font-bold flex items-center gap-1 border border-crimson-200 transition-colors"
          title={lang === 'en' ? 'Watch Official Music Video' : 'Xem MV Gốc Đức Phúc x 911'}
        >
          <Video className="w-3.5 h-3.5 text-red-600" />
          <span>MV</span>
        </button>

        {/* Replay Intro Invitation Button */}
        {onReplayIntro && (
          <button
            onClick={onReplayIntro}
            className="p-2 rounded-full hover:bg-gold-50 text-gold-700 transition-colors border-l border-stone-200 pl-2.5 ml-0.5"
            title={lang === 'en' ? 'Replay Invitation Envelope' : 'Xem Lại Thiệp Mời'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Official YouTube Music Video Popup Modal (Starts at second 10) */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border-2 border-gold-400/60 relative text-white space-y-4">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-gold-200">
                  Em Đồng Ý (I Do) - Đức Phúc x 911 x Khắc Hưng
                </h3>
                <p className="text-xs text-stone-400">
                  {lang === 'en' ? 'Official Wedding Celebration Theme Song' : 'Bài Hát Chủ Đề Dạ Tiệc Cưới'}
                </p>
              </div>
            </div>

            {/* Responsive 16:9 Video Container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?start=${START_TIME_SECONDS}&autoplay=1&rel=0`}
                title="Em Đồng Ý (I Do) - Đức Phúc x 911 | Official Music Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
              <span>Trang & Alfredo • September 12, 2026</span>
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-1.5 rounded-full bg-crimson-800 hover:bg-crimson-700 text-white font-semibold transition-colors"
              >
                {lang === 'en' ? 'Close & Return to Portal' : 'Đóng & Trở Về Thiệp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

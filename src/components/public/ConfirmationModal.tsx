'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { Calendar, CheckCircle2, Heart, Sparkles, X, Download } from 'lucide-react';
import { downloadIcsFile } from '@/lib/calendar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  rsvpResult: any;
}

export const ConfirmationModal: React.FC<Props> = ({ isOpen, onClose, lang, rsvpResult }) => {
  if (!isOpen || !rsvpResult) return null;

  const t = translations[lang];
  const primary = rsvpResult.primaryGuest || {};
  const party = rsvpResult.party || {};
  const agentResp = rsvpResult.agentResponse || {};
  const isAttending = primary.rsvp_status === 'attending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-gold-400 relative overflow-hidden animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 shadow-md ${
            isAttending
              ? 'bg-gradient-to-br from-crimson-700 to-crimson-900 text-gold-300'
              : 'bg-stone-100 text-stone-600'
          }`}>
            {isAttending ? <Sparkles className="w-8 h-8" /> : <Heart className="w-8 h-8" />}
          </div>

          <h3 className="text-2xl font-serif font-bold text-stone-900">
            {isAttending ? t.rsvp_success_title : t.rsvp_declined_title}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {isAttending ? t.rsvp_success_desc : t.rsvp_declined_desc}
          </p>
        </div>

        {/* Digital Pass / Ticket Card */}
        {isAttending && (
          <div className="bg-gradient-to-br from-[#faf6ee] to-[#fffdfa] p-5 rounded-2xl border border-gold-300 shadow-xs mb-6 text-left">
            <div className="flex items-center justify-between border-b border-gold-200/80 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700">
                  {lang === 'en' ? 'Digital Banquet Pass' : 'Thẻ Tham Dự Dạ Tiệc'}
                </span>
                <h4 className="text-base font-bold font-serif text-stone-900">
                  {primary.first_name} {primary.last_name}
                </h4>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-gold-100 text-gold-900 border border-gold-300">
                {party.invitation_code || 'RSVP-PASS'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-stone-400 block font-medium">
                  {lang === 'en' ? 'Headcount' : 'Số Khách'}
                </span>
                <span className="font-bold text-stone-800">
                  {party.total_invited || 1} {lang === 'en' ? 'Person(s)' : 'Người'}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">
                  {lang === 'en' ? 'Date & Time' : 'Thời Gian'}
                </span>
                <span className="font-bold text-stone-800">
                  Dec 12, 2026 @ 5:30 PM
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-stone-400 block font-medium">
                  {lang === 'en' ? 'Venue' : 'Địa Điểm'}
                </span>
                <span className="font-bold text-stone-800">
                  Grand Harbor Restaurant (Temple City, CA)
                </span>
              </div>

              {agentResp.djSongTitle && (
                <div className="col-span-2 pt-2 border-t border-gold-200/50">
                  <span className="text-stone-400 block font-medium">
                    {lang === 'en' ? 'DJ Cue Song' : 'Bài Hát Đã Đưa Vào Hàng Đợi DJ'}
                  </span>
                  <span className="font-semibold text-crimson-800 italic">
                    ♫ {agentResp.djSongTitle}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {isAttending && (
            <button
              onClick={() => downloadIcsFile(`${primary.first_name} ${primary.last_name}`)}
              className="w-full py-3 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{t.download_ticket}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition-all"
          >
            {t.close_btn}
          </button>
        </div>
      </div>
    </div>
  );
};

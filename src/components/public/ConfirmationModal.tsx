'use client';

import React, { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';
import { Calendar, CheckCircle2, Heart, Sparkles, X, Camera, Loader2, QrCode, MapPin, ExternalLink } from 'lucide-react';
import { downloadIcsFile } from '@/lib/calendar';
import { saveTicketToPhotos, TicketData } from '@/lib/ticketGenerator';
import QRCode from 'qrcode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  rsvpResult: any;
}

export const ConfirmationModal: React.FC<Props> = ({ isOpen, onClose, lang, rsvpResult }) => {
  const [savingTicket, setSavingTicket] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const t = translations[lang];
  const guests = rsvpResult?.guests || [];
  const primary = rsvpResult?.primaryGuest || guests.find((g: any) => g.is_primary_contact) || guests[0] || {};
  const party = rsvpResult?.party || {};
  const agentResp = rsvpResult?.agentResponse || {};

  // Calculate actual attending headcount
  const attendingGuests = guests.filter((g: any) => g.rsvp_status === 'attending');
  const attendingCount = rsvpResult?.attendingCount !== undefined
    ? rsvpResult.attendingCount
    : (attendingGuests.length > 0 ? attendingGuests.length : (primary.rsvp_status === 'attending' ? 1 : 0));

  // The modal only shows "We will miss you" if the WHOLE party cannot come (0 attending)!
  const isAttending = attendingCount > 0;

  const primaryName = (primary.first_name ? `${primary.first_name} ${primary.last_name || ''}`.trim() : '') || party.primary_guest_name || 'Honored Guest';
  const invitationCode = party.invitation_code || 'RSVP-PASS';

  const attendingGuestNames = attendingGuests
    .map((g: any) => `${g.first_name || ''} ${g.last_name || ''}`.trim())
    .filter(Boolean);

  // Generate QR Code data URL for the in-modal ticket preview
  useEffect(() => {
    if (!isOpen || !isAttending) return;

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://wedding.au-tomato.com';
    const checkinUrl = `${siteUrl}/rsvp?invite=${encodeURIComponent(invitationCode)}`;

    QRCode.toDataURL(checkinUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#6F0D1E', // Royal Crimson modules
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate preview QR code:', err));
  }, [isOpen, isAttending, invitationCode]);

  if (!isOpen || !rsvpResult) return null;

  const ticketData: TicketData = {
    primaryName,
    partyName: party.party_name || undefined,
    invitationCode,
    attendingCount,
    attendingGuestNames: attendingGuestNames.length > 0 ? attendingGuestNames : [primaryName],
    lang,
  };

  const handleSaveTicket = async () => {
    try {
      setSavingTicket(true);
      const res = await saveTicketToPhotos(ticketData);
      if (res.success) {
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 5000);
      }
    } catch (err) {
      console.error('Failed to save ticket:', err);
    } finally {
      setSavingTicket(false);
    }
  };

  const handleAddToCalendar = () => {
    downloadIcsFile(primaryName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border-2 border-gold-400 relative max-h-[94vh] overflow-y-auto animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="text-center mb-5">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto flex items-center justify-center mb-3 shadow-md ${
            isAttending
              ? 'bg-gradient-to-br from-crimson-700 to-crimson-900 text-gold-300'
              : 'bg-stone-100 text-stone-600'
          }`}>
            {isAttending ? <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" /> : <Heart className="w-7 h-7 sm:w-8 sm:h-8" />}
          </div>

          <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            {isAttending ? t.rsvp_success_title : t.rsvp_declined_title}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {isAttending ? t.rsvp_success_desc : t.rsvp_declined_desc}
          </p>
        </div>

        {/* VIP Digital Ticket Card Preview */}
        {isAttending && (
          <div className="bg-gradient-to-b from-[#FAF6EE] via-[#FFFDF9] to-[#F5EEE0] p-4 sm:p-5 rounded-2xl border-2 border-gold-300 shadow-sm mb-5 text-left relative overflow-hidden">
            {/* Top Pass Ribbon */}
            <div className="flex items-center justify-between border-b border-gold-200/80 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-crimson-800 bg-crimson-50 px-2 py-0.5 rounded border border-crimson-200">
                  {lang === 'en' ? "Trang & Alfredo's Wedding" : "Lễ Cưới Trang & Alfredo"}
                </span>
                <h4 className="text-base sm:text-lg font-bold font-serif text-stone-900 mt-1">
                  {primaryName}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-gold-100 text-gold-950 border border-gold-300 block">
                  {invitationCode}
                </span>
              </div>
            </div>

            {/* Event Key Info Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs mb-3">
              <div className="bg-white/70 p-2.5 rounded-xl border border-gold-200/50">
                <span className="text-stone-400 block font-medium text-[11px]">
                  {lang === 'en' ? 'Confirmed Headcount' : 'Số Khách Tham Dự'}
                </span>
                <span className="font-bold text-emerald-800 text-sm">
                  ✓ {attendingCount} {lang === 'en' ? `Guest${attendingCount > 1 ? 's' : ''}` : 'Khách'}
                </span>
              </div>

              <div className="bg-white/70 p-2.5 rounded-xl border border-gold-200/50">
                <span className="text-stone-400 block font-medium text-[11px]">
                  {lang === 'en' ? 'Date & Time' : 'Thời Gian'}
                </span>
                <span className="font-bold text-stone-800">
                  {lang === 'en' ? 'Dec 20, 2026 • 5:30 PM' : '20/12/2026 • 17:30'}
                </span>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Grand+Harbor+Restaurant,+5733+Rosemead+Blvd,+Temple+City,+CA+91780"
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 bg-white/70 hover:bg-white p-2.5 rounded-xl border border-gold-200/50 hover:border-gold-400 transition-all block group cursor-pointer"
                title={lang === 'en' ? 'Open in Google Maps for Directions' : 'Mở Google Maps để xem chỉ đường'}
              >
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 block font-medium text-[11px]">
                    {lang === 'en' ? 'Banquet Venue' : 'Địa Điểm Dạ Tiệc'}
                  </span>
                  <span className="text-[10px] text-crimson-800 font-semibold flex items-center gap-1 group-hover:underline">
                    <MapPin className="w-3 h-3 text-crimson-700" />
                    <span>{lang === 'en' ? 'Directions' : 'Bản Đồ'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
                <span className="font-bold text-stone-800 group-hover:text-crimson-900 transition-colors block">
                  Grand Harbor Restaurant
                </span>
                <span className="text-[11px] text-stone-500 group-hover:text-stone-700 transition-colors block underline decoration-stone-200 group-hover:decoration-crimson-300">
                  5733 Rosemead Blvd., Temple City, CA 91780
                </span>
              </a>

              {attendingGuestNames.length > 0 && (
                <div className="col-span-2 pt-1">
                  <span className="text-[11px] text-stone-400 font-medium block mb-1">
                    {t.ticket_attendees}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {attendingGuestNames.map((name: string, idx: number) => (
                      <span key={idx} className="text-[11px] bg-gold-50 text-gold-900 border border-gold-200 px-2.5 py-1 rounded-md font-medium">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Mini Section */}
            <div className="mt-3 pt-3 border-t border-dashed border-gold-300 flex items-center gap-3 bg-white/80 p-3 rounded-xl border border-gold-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg p-1 border border-gold-300 shadow-xs flex-shrink-0 flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Check-in QR Code" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-8 h-8 text-crimson-800 animate-pulse" />
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-xs font-bold text-stone-900 block">
                  {t.scan_checkin_label}
                </span>
                <span className="text-[11px] text-stone-500 block leading-tight mt-0.5">
                  {lang === 'en'
                    ? 'Scan at entrance for table seating & welcome cocktail'
                    : 'Quét tại quầy lễ tân để nhận bàn và nước đón khách'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Saved to Photos Toast Alert */}
        {savedToast && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{t.ticket_saved_toast}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {isAttending && (
            <>
              {/* Option 2: Save VIP Pass directly to Photos / Camera Roll */}
              <button
                onClick={handleSaveTicket}
                disabled={savingTicket}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-crimson-800 via-crimson-900 to-crimson-800 hover:from-crimson-900 hover:to-black text-white font-bold text-sm shadow-md border border-gold-400/40 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
              >
                {savingTicket ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gold-300" />
                    <span>{lang === 'en' ? 'Generating HD Pass...' : 'Đang Tạo Thẻ VIP...'}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-gold-300 group-hover:scale-110 transition-transform" />
                    <span className="text-gold-100">{t.save_ticket_photo_btn}</span>
                  </>
                )}
              </button>

              {/* Option 3: Universal Add to Calendar (.ics for Apple Calendar & Google Calendar) */}
              <button
                onClick={handleAddToCalendar}
                className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-sm border border-amber-300 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>{t.add_calendar_btn}</span>
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{t.return_to_landing || t.close_btn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


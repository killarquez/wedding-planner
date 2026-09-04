'use client';

import React, { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';
import { Party, Guest, RsvpStatus } from '@/lib/types';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Music,
  Utensils,
  HeartHandshake,
  Search,
  Users,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VietnameseCornerFlourish, VietnameseCloudDivider } from './VietnameseMotifDividers';

interface Props {
  lang: Language;
  initialCode?: string;
  onSuccess: (responseData: any) => void;
}

interface GuestState {
  guest_id: string;
  first_name: string;
  last_name: string;
  rsvp_status: RsvpStatus;
  dietary_restrictions: string[];
  dietary_notes: string;
}

export const RsvpForm: React.FC<Props> = ({ lang, initialCode, onSuccess }) => {
  const t = translations[lang];

  // Lookup State
  const [lookupQuery, setLookupQuery] = useState(initialCode || '');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Party & Guests Data
  const [party, setParty] = useState<Party | null>(null);
  const [guestStates, setGuestStates] = useState<GuestState[]>([]);

  // Party-Level Inputs
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [specialMessage, setSpecialMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const dietaryOptions = [
    { id: 'Vegetarian', label: t.diet_vegetarian },
    { id: 'Vegan', label: t.diet_vegan },
    { id: 'Shellfish Allergy', label: t.diet_shellfish },
    { id: 'Peanut / Tree Nut Allergy', label: t.diet_nuts },
    { id: 'Gluten-Free', label: t.diet_gluten },
    { id: 'Halal / No Pork', label: t.diet_halal },
  ];

  // Lookup Function
  const handleLookup = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) {
      setLookupError(lang === 'en' ? 'Please enter your code or phone number.' : 'Vui lòng nhập mã thiệp hoặc số điện thoại.');
      return;
    }

    setLookupLoading(true);
    setLookupError('');

    try {
      const res = await fetch(`/api/rsvp?lookup=${encodeURIComponent(queryToSearch.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.party) {
        throw new Error(data.error || t.lookup_not_found);
      }

      setParty(data.party);
      setContactEmail(data.party.contact_email || '');
      setContactPhone(data.party.contact_phone || '');
      setSpecialMessage(data.party.special_message || '');

      const initialStates: GuestState[] = (data.guests || []).map((g: Guest) => ({
        guest_id: g.id,
        first_name: g.first_name,
        last_name: g.last_name,
        rsvp_status: g.rsvp_status === 'pending' ? 'attending' : g.rsvp_status,
        dietary_restrictions: g.dietary_restrictions || [],
        dietary_notes: g.dietary_notes || ''
      }));

      setGuestStates(initialStates);
    } catch (err: any) {
      setLookupError(err.message || t.lookup_not_found);
    } finally {
      setLookupLoading(false);
    }
  };

  // Auto-search if initialCode provided
  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      setLookupQuery(initialCode.trim());
      handleLookup(initialCode.trim());
    }
  }, [initialCode]);

  // Bulk Quick Buttons
  const handleSetAllStatus = (status: RsvpStatus) => {
    setGuestStates(prev => prev.map(g => ({ ...g, rsvp_status: status })));
  };

  // Individual Guest Toggle
  const handleToggleGuestStatus = (guestId: string, status: RsvpStatus) => {
    setGuestStates(prev =>
      prev.map(g => (g.guest_id === guestId ? { ...g, rsvp_status: status } : g))
    );
  };

  // Dietary Restrictions Toggle
  const handleToggleDietary = (guestId: string, allergy: string) => {
    setGuestStates(prev =>
      prev.map(g => {
        if (g.guest_id !== guestId) return g;
        const exists = g.dietary_restrictions.includes(allergy);
        const updated = exists
          ? g.dietary_restrictions.filter(item => item !== allergy)
          : [...g.dietary_restrictions, allergy];
        return { ...g, dietary_restrictions: updated };
      })
    );
  };

  // Custom Dietary Notes
  const handleUpdateDietaryNotes = (guestId: string, notes: string) => {
    setGuestStates(prev =>
      prev.map(g => (g.guest_id === guestId ? { ...g, dietary_notes: notes } : g))
    );
  };

  // Submit RSVP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!party) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        party_id: party.id,
        invitation_code: party.invitation_code,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        special_message: specialMessage.trim() || undefined,
        song_request: songTitle.trim()
          ? {
              song_title: songTitle.trim(),
              artist: songArtist.trim() || undefined
            }
          : undefined,
        guests: guestStates.map(g => ({
          guest_id: g.guest_id,
          first_name: g.first_name,
          last_name: g.last_name,
          rsvp_status: g.rsvp_status,
          dietary_restrictions: g.dietary_restrictions,
          dietary_notes: g.dietary_notes.trim() || undefined
        }))
      };

      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit RSVP');
      }

      // Celebratory Golden Confetti Burst
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#c41e3a', '#d4af37', '#ffd700', '#ffffff']
        });
      } catch (e) {
        // Confetti fallback
      }

      onSuccess(data);
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetParty = () => {
    setParty(null);
    setGuestStates([]);
    setLookupQuery('');
    setLookupError('');
  };

  return (
    <section id="rsvp-section" className="py-12 sm:py-16 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* 1. LOOKUP STATE (When no party loaded) */}
      {!party ? (
        <div className="relative bg-gradient-to-br from-white/95 via-amber-50/40 to-rose-50/30 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-2 border-gold-400/80 shadow-xl text-center max-w-xl mx-auto animate-fade-in">
          <VietnameseCornerFlourish position="top-left" className="absolute top-3 left-3 w-7 h-7 text-gold-500/70" />
          <VietnameseCornerFlourish position="top-right" className="absolute top-3 right-3 w-7 h-7 text-gold-500/70" />
          <VietnameseCornerFlourish position="bottom-left" className="absolute bottom-3 left-3 w-7 h-7 text-gold-500/70" />
          <VietnameseCornerFlourish position="bottom-right" className="absolute bottom-3 right-3 w-7 h-7 text-gold-500/70" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-crimson-800 to-crimson-950 text-gold-200 font-serif font-bold text-2xl flex items-center justify-center mx-auto mb-5 shadow-md border border-gold-400/60">
            囍
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-2">
            {t.lookup_heading}
          </h2>

          <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto mb-8 leading-relaxed">
            {t.lookup_subtitle}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(lookupQuery);
            }}
            className="space-y-4"
          >
            <div className="relative max-w-md mx-auto">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder={t.lookup_placeholder}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-stone-50/50"
              />
            </div>

            {lookupError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left max-w-md mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={lookupLoading || !lookupQuery.trim()}
              className="w-full max-w-md mx-auto py-3.5 px-6 rounded-xl bg-gradient-to-r from-crimson-700 via-crimson-800 to-crimson-900 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {lookupLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.lookup_searching}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-gold-300" />
                  <span>{t.lookup_btn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-stone-400 mt-6">
            {lang === 'en'
              ? 'Have an invite link? Click it directly to open your party without searching!'
              : 'Bạn nhận được đường link thiệp riêng? Nhấp trực tiếp vào link để mở thiệp ngay nhé!'}
          </p>
        </div>
      ) : (
        /* 2. PERSONALIZED PARTY RSVP STATE (When party is loaded) */
        <form
          onSubmit={handleSubmit}
          className="relative bg-gradient-to-br from-white/95 via-amber-50/30 to-rose-50/25 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-2 border-gold-400/80 shadow-xl space-y-8 animate-fade-in"
        >
          <VietnameseCornerFlourish position="top-left" className="absolute top-3 left-3 w-7 h-7 text-gold-500/70" />
          <VietnameseCornerFlourish position="top-right" className="absolute top-3 right-3 w-7 h-7 text-gold-500/70" />
          <VietnameseCornerFlourish position="bottom-left" className="absolute bottom-3 left-3 w-7 h-7 text-gold-500/70" />
          <VietnameseCornerFlourish position="bottom-right" className="absolute bottom-3 right-3 w-7 h-7 text-gold-500/70" />

          {/* Header Banner */}
          <div className="border-b border-stone-200/80 pb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-crimson-50 to-amber-50 border border-crimson-200 text-crimson-900 text-xs font-semibold mb-2 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-600" />
                <span>Code: {party.invitation_code}</span>
                <span className="text-crimson-300">•</span>
                <span>{guestStates.length} {t.party_invited_badge}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {t.party_welcome} <span className="text-crimson-800">{party.primary_guest_name}</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                {t.party_subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetParty}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors shrink-0 self-center sm:self-auto border border-stone-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.switch_party_btn}</span>
            </button>
          </div>

          {/* Quick Bulk Attendance Action Buttons */}
          <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => handleSetAllStatus('attending')}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{t.all_attending_btn}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetAllStatus('declined')}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4 text-stone-500" />
              <span>{t.all_declining_btn}</span>
            </button>
          </div>

          {/* Individual Guest Cards List */}
          <div className="space-y-4">
            {guestStates.map((guest, idx) => {
              const isAttending = guest.rsvp_status === 'attending';

              return (
                <div
                  key={guest.guest_id}
                  className={`rounded-2xl p-5 border-2 transition-all ${
                    isAttending
                      ? 'border-emerald-300 bg-emerald-50/20 shadow-2xs'
                      : 'border-stone-200 bg-stone-50/40 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/70">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-crimson-50 text-crimson-800 font-serif font-bold text-xs flex items-center justify-center border border-crimson-200">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="text-base font-serif font-bold text-stone-900">
                          {guest.first_name} {guest.last_name}
                        </h3>
                        {idx === 0 && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-700 block">
                            Primary Contact
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Attendance Toggle Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleGuestStatus(guest.guest_id, 'attending')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isAttending
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t.guest_attending}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleGuestStatus(guest.guest_id, 'declined')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          !isAttending
                            ? 'bg-stone-700 text-white shadow-xs'
                            : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{t.guest_declining}</span>
                      </button>
                    </div>
                  </div>

                  {/* Dietary Restrictions (shown when attending) */}
                  {isAttending && (
                    <div className="mt-4 pt-1 space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t.allergies_dietary_title}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {dietaryOptions.map(opt => {
                            const isSelected = guest.dietary_restrictions.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleToggleDietary(guest.guest_id, opt.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                  isSelected
                                    ? 'bg-amber-100 border-amber-400 text-amber-900 font-semibold'
                                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                                }`}
                              >
                                {isSelected ? '✓ ' : ''}{opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <input
                        type="text"
                        value={guest.dietary_notes}
                        onChange={(e) => handleUpdateDietaryNotes(guest.guest_id, e.target.value)}
                        placeholder={t.diet_custom_placeholder}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-crimson-600"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Song Request Section */}
          <div className="bg-stone-50/80 p-5 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-crimson-50 text-crimson-800">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-serif font-bold text-stone-900">
                  {t.song_title}
                </h4>
                <p className="text-[11px] text-stone-500">
                  {lang === 'en'
                    ? 'Request a favorite track to celebrate on the dance floor!'
                    : 'Yêu cầu bài hát bạn muốn nhảy hoặc nâng ly cùng cô dâu chú rể!'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder={t.song_placeholder}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson-700"
              />
              <input
                type="text"
                value={songArtist}
                onChange={(e) => setSongArtist(e.target.value)}
                placeholder={t.song_note_placeholder}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson-700"
              />
            </div>
          </div>

          {/* Heartfelt Message for Groom & Bride */}
          <div className="bg-stone-50/80 p-5 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gold-50 text-gold-800">
                <HeartHandshake className="w-4 h-4 text-gold-700" />
              </div>
              <div>
                <h4 className="text-sm font-serif font-bold text-stone-900">
                  {t.message_to_couple}
                </h4>
                <p className="text-[11px] text-stone-500">
                  {lang === 'en'
                    ? 'A personal note for Trang & Alfredo to read and cherish.'
                    : 'Những lời chúc phúc thân tình dành riêng cho Trang & Alfredo.'}
                </p>
              </div>
            </div>

            <textarea
              rows={3}
              value={specialMessage}
              onChange={(e) => setSpecialMessage(e.target.value)}
              placeholder={t.message_placeholder}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson-700"
            />
          </div>

          {/* Contact Details (Optional Verification) */}
          <div className="bg-stone-50/80 p-5 rounded-2xl border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {t.contact_info_title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Phone (SMS Updates)
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (714) 555-0101"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-crimson-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Email (Digital Invite Pass)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-crimson-700"
                />
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-crimson-700 via-crimson-800 to-crimson-950 text-white font-bold text-base shadow-lg hover:shadow-xl hover:from-crimson-800 hover:to-crimson-900 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t.submitting}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-gold-300" />
                <span>{t.submit_rsvp}</span>
              </>
            )}
          </button>
        </form>
      )}
    </section>
  );
};

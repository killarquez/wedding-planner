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
  RotateCcw,
  UserPlus,
  UserCheck,
  Trash2,
  Heart,
  Plus,
  Phone,
  Mail,
  FileText,
  CheckCircle2
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
  is_new?: boolean;
}

export const RsvpForm: React.FC<Props> = ({ lang, initialCode, onSuccess }) => {
  const t = translations[lang];

  // Lookup State
  const [lookupQuery, setLookupQuery] = useState(initialCode || '');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Paper Invite Sub-flow State
  const [showPaperPrompt, setShowPaperPrompt] = useState(false);
  const [showPaperForm, setShowPaperForm] = useState(false);
  const [paperFirstName, setPaperFirstName] = useState('');
  const [paperLastName, setPaperLastName] = useState('');
  const [paperPhone, setPaperPhone] = useState('');
  const [paperEmail, setPaperEmail] = useState('');
  const [paperSide, setPaperSide] = useState<'bride' | 'groom' | 'friend'>('bride');
  const [paperLeadAttending, setPaperLeadAttending] = useState(true);
  const [paperLeadDietary, setPaperLeadDietary] = useState<string[]>([]);
  const [paperLeadDietaryNotes, setPaperLeadDietaryNotes] = useState('');
  const [paperHasPlusOne, setPaperHasPlusOne] = useState(false);
  const [paperPlusOneFirstName, setPaperPlusOneFirstName] = useState('');
  const [paperPlusOneLastName, setPaperPlusOneLastName] = useState('');
  const [paperPlusOneAttending, setPaperPlusOneAttending] = useState(true);
  const [paperPlusOneDietary, setPaperPlusOneDietary] = useState<string[]>([]);
  const [paperPlusOneDietaryNotes, setPaperPlusOneDietaryNotes] = useState('');
  const [paperSpecialMessage, setPaperSpecialMessage] = useState('');
  const [paperSongTitle, setPaperSongTitle] = useState('');
  const [paperSongArtist, setPaperSongArtist] = useState('');
  const [paperSubmitting, setPaperSubmitting] = useState(false);
  const [paperSubmitError, setPaperSubmitError] = useState('');

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
    setShowPaperPrompt(false);

    try {
      const res = await fetch(`/api/rsvp?lookup=${encodeURIComponent(queryToSearch.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.party) {
        setShowPaperPrompt(true);
        setPaperPhone(queryToSearch.trim());
        throw new Error(data.error || t.lookup_not_found);
      }

      setParty(data.party);
      setShowPaperForm(false);
      setShowPaperPrompt(false);
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

  const togglePaperDietary = (target: 'lead' | 'plusone', optionId: string) => {
    if (target === 'lead') {
      setPaperLeadDietary(prev =>
        prev.includes(optionId) ? prev.filter(x => x !== optionId) : [...prev, optionId]
      );
    } else {
      setPaperPlusOneDietary(prev =>
        prev.includes(optionId) ? prev.filter(x => x !== optionId) : [...prev, optionId]
      );
    }
  };

  const handlePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperFirstName.trim() || !paperPhone.trim()) {
      setPaperSubmitError(lang === 'en' ? 'Please provide your name and phone number.' : 'Vui lòng nhập họ tên và số điện thoại.');
      return;
    }

    if (paperHasPlusOne && !paperPlusOneFirstName.trim()) {
      setPaperSubmitError(lang === 'en' ? "Please provide your plus-one's name." : 'Vui lòng nhập tên người đi cùng.');
      return;
    }

    setPaperSubmitting(true);
    setPaperSubmitError('');

    try {
      const attendees = [
        {
          first_name: paperFirstName.trim(),
          last_name: paperLastName.trim(),
          rsvp_status: (paperLeadAttending ? 'attending' : 'declined') as RsvpStatus,
          dietary_restrictions: paperLeadDietary,
          dietary_notes: paperLeadDietaryNotes.trim() || undefined
        }
      ];

      if (paperHasPlusOne && paperPlusOneFirstName.trim()) {
        attendees.push({
          first_name: paperPlusOneFirstName.trim(),
          last_name: paperPlusOneLastName.trim(),
          rsvp_status: (paperPlusOneAttending ? 'attending' : 'declined') as RsvpStatus,
          dietary_restrictions: paperPlusOneDietary,
          dietary_notes: paperPlusOneDietaryNotes.trim() || undefined
        });
      }

      const payload = {
        action: 'register_paper',
        primary_first_name: paperFirstName.trim(),
        primary_last_name: paperLastName.trim(),
        contact_phone: paperPhone.trim(),
        contact_email: paperEmail.trim() || undefined,
        relationship_side: paperSide,
        guests: attendees,
        special_message: paperSpecialMessage.trim() || undefined,
        song_request: paperSongTitle.trim() ? {
          song_title: paperSongTitle.trim(),
          artist_name: paperSongArtist.trim() || undefined
        } : undefined
      };

      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit paper RSVP');
      }

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#c41e3a', '#d4af37', '#ffd700', '#ffffff']
        });
      } catch (e) {}

      onSuccess(data);
    } catch (err: any) {
      setPaperSubmitError(err.message || 'Error submitting RSVP');
    } finally {
      setPaperSubmitting(false);
    }
  };

  // Auto-search if initialCode provided
  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      setLookupQuery(initialCode.trim());
      handleLookup(initialCode.trim());
    }
  }, [initialCode]);

  // Dynamic Party Limit & Add Guest Handlers
  const partyLimit = party?.total_invited || guestStates.length;
  const attendingCount = guestStates.filter(g => g.rsvp_status === 'attending').length;
  const declinedCount = guestStates.filter(g => g.rsvp_status === 'declined').length;
  const canAddGuest = attendingCount < partyLimit;

  // Bulk Quick Buttons
  const handleSetAllStatus = (status: RsvpStatus) => {
    if (status === 'attending') {
      if (guestStates.length > partyLimit) {
        setSubmitError(
          lang === 'en'
            ? `Your party has a limit of ${partyLimit} seats. Please remove any additional guests before selecting all attending.`
            : `Bàn tiệc có giới hạn tối đa ${partyLimit} chỗ. Vui lòng bỏ bớt thành viên đã thêm trước khi chọn tất cả cùng đi.`
        );
        return;
      }
    }
    setSubmitError('');
    setGuestStates(prev => prev.map(g => ({ ...g, rsvp_status: status })));
  };

  // Individual Guest Toggle
  const handleToggleGuestStatus = (guestId: string, status: RsvpStatus) => {
    if (status === 'attending') {
      const currentOtherAttending = guestStates.filter(
        g => g.guest_id !== guestId && g.rsvp_status === 'attending'
      ).length;
      if (currentOtherAttending >= partyLimit) {
        setSubmitError(
          lang === 'en'
            ? `Your party's allocation of ${partyLimit} attending seats is already filled. Please remove or adjust an added guest first.`
            : `Bàn tiệc của bạn chỉ có tối đa ${partyLimit} chỗ tham dự đã được chọn đủ. Vui lòng bỏ bớt thành viên thêm vào trước khi chọn lại người này.`
        );
        return;
      }
    }
    setSubmitError('');
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

  const handleAddGuest = () => {
    if (!canAddGuest) return;
    setSubmitError('');
    const newGuestId = `new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setGuestStates(prev => [
      ...prev,
      {
        guest_id: newGuestId,
        first_name: '',
        last_name: '',
        rsvp_status: 'attending',
        dietary_restrictions: [],
        dietary_notes: '',
        is_new: true
      }
    ]);
  };

  const handleRemoveGuest = (guestId: string) => {
    setSubmitError('');
    setGuestStates(prev => prev.filter(g => g.guest_id !== guestId));
  };

  const handleUpdateGuestName = (guestId: string, field: 'first_name' | 'last_name', value: string) => {
    setGuestStates(prev =>
      prev.map(g => (g.guest_id === guestId ? { ...g, [field]: value } : g))
    );
  };

  // Submit RSVP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!party) return;

    // Check for empty names on newly added guests
    const missingName = guestStates.some(g => g.is_new && !g.first_name.trim());
    if (missingName) {
      setSubmitError(
        lang === 'en'
          ? 'Please enter a name for each additional guest you added.'
          : 'Vui lòng nhập tên cho các thành viên mới được thêm vào.'
      );
      return;
    }

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
      {/* 1. LOOKUP OR PAPER REGISTRATION STATE (When no party loaded) */}
      {!party ? (
        showPaperForm ? (
          <form
            onSubmit={handlePaperSubmit}
            className="relative bg-gradient-to-br from-white/95 via-amber-50/40 to-rose-50/30 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-2 border-gold-400/80 shadow-xl space-y-8 animate-fade-in max-w-2xl mx-auto"
          >
            <VietnameseCornerFlourish position="top-left" className="absolute top-3 left-3 w-7 h-7 text-gold-500/70" />
            <VietnameseCornerFlourish position="top-right" className="absolute top-3 right-3 w-7 h-7 text-gold-500/70" />
            <VietnameseCornerFlourish position="bottom-left" className="absolute bottom-3 left-3 w-7 h-7 text-gold-500/70" />
            <VietnameseCornerFlourish position="bottom-right" className="absolute bottom-3 right-3 w-7 h-7 text-gold-500/70" />

            {/* Header Banner */}
            <div className="border-b border-stone-200/80 pb-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-crimson-800 to-crimson-950 text-gold-200 font-serif font-bold text-2xl flex items-center justify-center mx-auto mb-4 shadow-md border border-gold-400/60">
                囍
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold mb-3">
                <span>📩</span>
                <span>{t.paper_success_badge || (lang === 'en' ? 'Paper Invitation Registration' : 'Đăng Ký Thiệp Giấy')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-2">
                {t.paper_form_title}
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                {t.paper_form_subtitle}
              </p>
            </div>

            {/* Section 1: Relationship Hierarchy / Side */}
            <div className="space-y-3 bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                {t.paper_side_label} <span className="text-crimson-700">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'bride', label: t.paper_side_bride, icon: '🌸' },
                  { id: 'groom', label: t.paper_side_groom, icon: '👔' },
                  { id: 'friend', label: t.paper_side_friend, icon: '🥂' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPaperSide(s.id as any)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center gap-2 cursor-pointer ${
                      paperSide === s.id
                        ? 'border-crimson-700 bg-crimson-50 text-crimson-900 font-bold shadow-2xs'
                        : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Primary Attendee Information */}
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-crimson-100 text-crimson-800 font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-stone-900">
                    {t.paper_lead_guest}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperLeadAttending(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      paperLeadAttending
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t.guest_attending}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperLeadAttending(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      !paperLeadAttending
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t.guest_declining}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    {t.guest_first_name_label} <span className="text-crimson-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={paperFirstName}
                    onChange={(e) => setPaperFirstName(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g. John' : 'Ví dụ: Tuấn'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    {t.guest_last_name_label}
                  </label>
                  <input
                    type="text"
                    value={paperLastName}
                    onChange={(e) => setPaperLastName(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g. Smith' : 'Ví dụ: Nguyễn'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Lead Attendee Dietary Preferences if attending */}
              {paperLeadAttending && (
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-stone-700">
                    <Utensils className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t.allergies_dietary_title}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {dietaryOptions.map((opt) => {
                      const isChecked = paperLeadDietary.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => togglePaperDietary('lead', opt.id)}
                          className={`p-2 rounded-lg border text-[11px] text-left transition-all flex items-center gap-1.5 cursor-pointer ${
                            isChecked
                              ? 'border-crimson-700 bg-crimson-50 text-crimson-900 font-semibold'
                              : 'border-stone-200 bg-stone-50/50 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-crimson-700 border-crimson-700 text-white' : 'border-stone-300'
                          }`}>
                            {isChecked && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={paperLeadDietaryNotes}
                    onChange={(e) => setPaperLeadDietaryNotes(e.target.value)}
                    placeholder={lang === 'en' ? 'Other allergy details / notes for the kitchen...' : 'Ghi chú dị ứng khác cho đầu bếp...'}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Section 3: Contact Information */}
            <div className="space-y-4 bg-stone-50/70 p-5 rounded-2xl border border-stone-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>{t.contact_info_title}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    {lang === 'en' ? 'Phone Number' : 'Số Điện Thoại'} <span className="text-crimson-700">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={paperPhone}
                    onChange={(e) => setPaperPhone(e.target.value)}
                    placeholder="(714) 555-0199"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none bg-white"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    {lang === 'en' ? 'Used to verify and access your RSVP in the future.' : 'Dùng để quản lý và tra cứu thiệp của bạn sau này.'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    {lang === 'en' ? 'Email Address (Optional)' : 'Địa Chỉ Email (Tuỳ chọn)'}
                  </label>
                  <input
                    type="email"
                    value={paperEmail}
                    onChange={(e) => setPaperEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none bg-white"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    {lang === 'en' ? 'Receive an instant confirmation receipt and calendar pass.' : 'Nhận xác nhận qua email và lịch đám cưới.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Plus-One / Second Attendee (Capped at 2 total) */}
            <div className="space-y-3">
              {!paperHasPlusOne ? (
                <button
                  type="button"
                  onClick={() => setPaperHasPlusOne(true)}
                  className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-stone-300 hover:border-gold-500 bg-stone-50/50 hover:bg-amber-50/30 text-stone-700 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-gold-600" />
                  <span>{t.paper_add_plus_one}</span>
                </button>
              ) : (
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs animate-fade-in">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                        2
                      </div>
                      <h3 className="text-sm font-bold text-stone-900">
                        {t.paper_plus_one_label}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                        {lang === 'en' ? 'Plus-One' : 'Người đi cùng'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPaperPlusOneAttending(true)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            paperPlusOneAttending
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>{t.guest_attending}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaperPlusOneAttending(false)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            !paperPlusOneAttending
                              ? 'bg-red-600 text-white shadow-2xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          <XCircle className="w-3 h-3" />
                          <span>{t.guest_declining}</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPaperHasPlusOne(false);
                          setPaperPlusOneFirstName('');
                          setPaperPlusOneLastName('');
                          setPaperPlusOneDietary([]);
                          setPaperPlusOneDietaryNotes('');
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title={t.paper_remove_plus_one}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        {t.guest_first_name_label} <span className="text-crimson-700">*</span>
                      </label>
                      <input
                        type="text"
                        required={paperHasPlusOne}
                        value={paperPlusOneFirstName}
                        onChange={(e) => setPaperPlusOneFirstName(e.target.value)}
                        placeholder={lang === 'en' ? 'e.g. Jane' : 'Ví dụ: Lan'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        {t.guest_last_name_label}
                      </label>
                      <input
                        type="text"
                        value={paperPlusOneLastName}
                        onChange={(e) => setPaperPlusOneLastName(e.target.value)}
                        placeholder={lang === 'en' ? 'e.g. Smith' : 'Ví dụ: Trần'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Plus-One Dietary if attending */}
                  {paperPlusOneAttending && (
                    <div className="pt-3 border-t border-stone-100 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-700">
                        <Utensils className="w-3.5 h-3.5 text-stone-400" />
                        <span>{t.allergies_dietary_title}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {dietaryOptions.map((opt) => {
                          const isChecked = paperPlusOneDietary.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => togglePaperDietary('plusone', opt.id)}
                              className={`p-2 rounded-lg border text-[11px] text-left transition-all flex items-center gap-1.5 cursor-pointer ${
                                isChecked
                                  ? 'border-crimson-700 bg-crimson-50 text-crimson-900 font-semibold'
                                  : 'border-stone-200 bg-stone-50/50 text-stone-600 hover:border-stone-300'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                isChecked ? 'bg-crimson-700 border-crimson-700 text-white' : 'border-stone-300'
                              }`}>
                                {isChecked && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className="truncate">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        value={paperPlusOneDietaryNotes}
                        onChange={(e) => setPaperPlusOneDietaryNotes(e.target.value)}
                        placeholder={lang === 'en' ? 'Other allergy details / notes for the kitchen...' : 'Ghi chú dị ứng khác cho đầu bếp...'}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 5: Heartfelt Message & DJ Song Request */}
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-crimson-600 fill-crimson-600" />
                  <span>{t.message_to_couple}</span>
                </label>
                <textarea
                  rows={2}
                  value={paperSpecialMessage}
                  onChange={(e) => setPaperSpecialMessage(e.target.value)}
                  placeholder={t.message_placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-gold-600" />
                  <span>{lang === 'en' ? 'DJ Dance Song Request' : 'Yêu Cầu Bài Hát Khiêu Vũ Cho DJ'}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={paperSongTitle}
                    onChange={(e) => setPaperSongTitle(e.target.value)}
                    placeholder={lang === 'en' ? "Song Title (e.g. Can't Take My Eyes Off You)" : 'Tên bài hát...'}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={paperSongArtist}
                    onChange={(e) => setPaperSongArtist(e.target.value)}
                    placeholder={lang === 'en' ? 'Artist (e.g. Frankie Valli)' : 'Ca sĩ / Nghệ sĩ...'}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {paperSubmitError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{paperSubmitError}</span>
              </div>
            )}

            {/* Actions: Submit & Back */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={paperSubmitting}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-crimson-700 via-crimson-800 to-crimson-900 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {paperSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.lookup_searching}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-gold-300" />
                    <span>{t.paper_submit_btn}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPaperForm(false);
                  setPaperSubmitError('');
                }}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Back to Search' : 'Quay lại tra cứu'}
              </button>
            </div>
          </form>
        ) : (
          <div className="relative bg-gradient-to-br from-white/95 via-amber-50/40 to-rose-50/30 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-2 border-gold-400/80 shadow-xl text-center max-w-xl mx-auto animate-fade-in space-y-6">
            <VietnameseCornerFlourish position="top-left" className="absolute top-3 left-3 w-7 h-7 text-gold-500/70" />
            <VietnameseCornerFlourish position="top-right" className="absolute top-3 right-3 w-7 h-7 text-gold-500/70" />
            <VietnameseCornerFlourish position="bottom-left" className="absolute bottom-3 left-3 w-7 h-7 text-gold-500/70" />
            <VietnameseCornerFlourish position="bottom-right" className="absolute bottom-3 right-3 w-7 h-7 text-gold-500/70" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-crimson-800 to-crimson-950 text-gold-200 font-serif font-bold text-2xl flex items-center justify-center mx-auto mb-2 shadow-md border border-gold-400/60">
              囍
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-2">
                {t.lookup_heading}
              </h2>

              <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                {t.lookup_subtitle}
              </p>
            </div>

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

              {lookupError && !showPaperPrompt && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left max-w-md mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{lookupError}</span>
                </div>
              )}

              {/* Paper Invite Fallback Prompt Box */}
              {showPaperPrompt && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50/70 border-2 border-amber-300 text-left space-y-3 max-w-md mx-auto shadow-xs animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-900 text-lg shadow-2xs">
                      📩
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-amber-950">
                        {t.paper_invite_prompt_title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-stone-600 mt-1 leading-relaxed">
                        {t.paper_invite_prompt_desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaperForm(true);
                        setShowPaperPrompt(false);
                        setLookupError('');
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-gold-300" />
                      <span>{t.paper_invite_register_btn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaperPrompt(false);
                        setLookupError('');
                      }}
                      className="py-2.5 px-3 rounded-xl border border-amber-300 hover:bg-amber-100/60 text-amber-900 text-xs font-medium cursor-pointer transition-colors"
                    >
                      <span>{t.paper_invite_retry_btn}</span>
                    </button>
                  </div>
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

            {/* Direct Paper Invite Entry Option */}
            <div className="pt-4 border-t border-stone-200/70 max-w-md mx-auto">
              <p className="text-xs text-stone-500 mb-2.5">
                {lang === 'en'
                  ? 'Received a physical paper invite card without an RSVP code?'
                  : 'Quý khách nhận được thiệp cưới giấy in không có mã riêng?'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowPaperForm(true);
                  setShowPaperPrompt(false);
                  setLookupError('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/80 text-amber-950 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'en' ? 'Register Paper Invite RSVP' : 'Đăng Ký Tham Dự Với Thiệp Giấy'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
              </button>
            </div>

            <p className="text-[11px] text-stone-400">
              {lang === 'en'
                ? 'Have an invite link? Click it directly to open your party without searching!'
                : 'Bạn nhận được đường link thiệp riêng? Nhấp trực tiếp vào link để mở thiệp ngay nhé!'}
            </p>
          </div>
        )
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
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-crimson-50 to-amber-50 border border-crimson-200 text-crimson-900 text-xs font-semibold mb-2 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-600" />
                <span>Code: {party.invitation_code}</span>
                <span className="text-crimson-300">•</span>
                <span>{attendingCount} / {partyLimit} {lang === 'en' ? 'Seats Attending' : 'Chỗ Tham Dự'}</span>
                {declinedCount > 0 && (
                  <>
                    <span className="text-crimson-300">•</span>
                    <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md font-medium text-[11px]">
                      {declinedCount} {lang === 'en' ? 'Declined (Spot Opened)' : 'Vắng mặt (Đã mở chỗ)'}
                    </span>
                  </>
                )}
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

          {/* Validation Notice if cap exceeded */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

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
                    <div className="flex items-center gap-2.5 flex-1">
                      <span className="w-7 h-7 rounded-full bg-crimson-50 text-crimson-800 font-serif font-bold text-xs flex items-center justify-center border border-crimson-200 shrink-0">
                        {idx + 1}
                      </span>
                      {guest.is_new ? (
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-crimson-800 bg-crimson-100/80 px-2 py-0.5 rounded-md">
                              {lang === 'en' ? 'Additional Guest / Plus-One' : 'Thành Viên Thêm Vào'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveGuest(guest.guest_id)}
                              className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-red-600 transition-colors p-1"
                              title={t.remove_guest_btn}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              <span className="hidden sm:inline">{t.remove_guest_btn}</span>
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              value={guest.first_name}
                              onChange={(e) => handleUpdateGuestName(guest.guest_id, 'first_name', e.target.value)}
                              placeholder={t.guest_first_name_label}
                              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson-600"
                            />
                            <input
                              type="text"
                              value={guest.last_name}
                              onChange={(e) => handleUpdateGuestName(guest.guest_id, 'last_name', e.target.value)}
                              placeholder={t.guest_last_name_label}
                              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson-600"
                            />
                          </div>
                        </div>
                      ) : (
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
                      )}
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

          {/* Add Guest Button & Warm Apologetic Capacity Notice */}
          <div className="space-y-3 pt-1">
            {canAddGuest ? (
              <button
                type="button"
                onClick={handleAddGuest}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-crimson-300 bg-crimson-50/40 hover:bg-crimson-50 hover:border-crimson-400 text-crimson-800 font-medium text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-crimson-100 group-hover:bg-crimson-200 text-crimson-800 transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">{t.add_guest_party_btn}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-crimson-700 font-medium">
                    ({attendingCount} / {partyLimit} {lang === 'en' ? 'Attending' : 'Tham dự'})
                  </span>
                  {declinedCount > 0 && (
                    <span className="bg-amber-100/90 text-amber-900 text-[11px] font-medium px-2 py-0.5 rounded-md">
                      {lang === 'en'
                        ? `• ${declinedCount} spot opened from missing guest`
                        : `• ${declinedCount} chỗ trống từ người vắng mặt`}
                    </span>
                  )}
                </div>
              </button>
            ) : (
              <div className="w-full py-3.5 px-4 rounded-2xl border border-stone-200 bg-stone-100/80 text-stone-400 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-not-allowed select-none">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-stone-400" />
                  <span className="font-medium">
                    {t.party_cap_reached_btn
                      .replace('{current}', String(attendingCount))
                      .replace('{max}', String(partyLimit))}
                  </span>
                </div>
                {declinedCount > 0 && (
                  <span className="text-[11px] text-stone-400">
                    ({declinedCount} {lang === 'en' ? 'declined' : 'vắng mặt'})
                  </span>
                )}
              </div>
            )}

            {/* Apologetic and warm hospitality notice box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100/80 text-amber-800 shrink-0 mt-0.5">
                <Heart className="w-4 h-4 text-amber-700 fill-amber-700/20" />
              </div>
              <div className="space-y-1 text-left">
                <h5 className="text-xs font-serif font-bold text-amber-950">
                  {t.party_missed_anyone_title}
                </h5>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  {t.party_missed_anyone_desc}
                </p>
              </div>
            </div>
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

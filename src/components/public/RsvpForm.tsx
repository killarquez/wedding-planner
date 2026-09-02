'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { RsvpStatus, TableHierarchy } from '@/lib/types';
import { Sparkles, UserPlus, Trash2, CheckCircle, Music, Utensils, HeartHandshake, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlusOneInput {
  id: string;
  name: string;
  dietary_restrictions: string[];
  dietary_notes?: string;
}

interface Props {
  lang: Language;
  onSuccess: (responseData: any) => void;
}

export const RsvpForm: React.FC<Props> = ({ lang, onSuccess }) => {
  const t = translations[lang];

  // Primary Guest State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('attending');
  const [relationshipTag, setRelationshipTag] = useState<TableHierarchy>('general');
  const [dietary, setDietary] = useState<string[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [songRequest, setSongRequest] = useState('');
  const [notes, setNotes] = useState('');

  // Group / Family Linking State
  const [plusOnes, setPlusOnes] = useState<PlusOneInput[]>([]);

  // Submission Status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const dietaryOptions = [
    { id: 'Vegetarian', label: t.diet_vegetarian },
    { id: 'Vegan', label: t.diet_vegan },
    { id: 'Shellfish Allergy', label: t.diet_shellfish },
    { id: 'Peanut / Tree Nut Allergy', label: t.diet_nuts },
    { id: 'Gluten-Free', label: t.diet_gluten },
    { id: 'Halal / No Pork', label: t.diet_halal },
  ];

  const handleDietaryToggle = (id: string) => {
    if (dietary.includes(id)) {
      setDietary(dietary.filter((item) => item !== id));
    } else {
      setDietary([...dietary, id]);
    }
  };

  const handleAddPlusOne = () => {
    setPlusOnes([
      ...plusOnes,
      {
        id: `po-${Date.now()}`,
        name: '',
        dietary_restrictions: [],
        dietary_notes: ''
      }
    ]);
  };

  const handleRemovePlusOne = (id: string) => {
    setPlusOnes(plusOnes.filter((po) => po.id !== id));
  };

  const handleUpdatePlusOne = (id: string, updates: Partial<PlusOneInput>) => {
    setPlusOnes(
      plusOnes.map((po) => (po.id === id ? { ...po, ...updates } : po))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage(lang === 'en' ? 'Please enter your first and last name.' : 'Vui lòng nhập họ và tên của bạn.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        rsvp_status: rsvpStatus,
        headcount: rsvpStatus === 'attending' ? 1 + plusOnes.length : 0,
        dietary_restrictions: dietary,
        dietary_notes: dietaryNotes.trim() || undefined,
        song_request: songRequest.trim() || undefined,
        notes: notes.trim() || undefined,
        relationship_tag: relationshipTag,
        plus_ones: rsvpStatus === 'attending' ? plusOnes.filter(p => p.name.trim()) : []
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

      // Celebrate with confetti if attending
      if (rsvpStatus === 'attending') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#c59f3d', '#a3242a', '#e3ce8a', '#872126', '#ffffff']
        });
      }

      onSuccess(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || (lang === 'en' ? 'An error occurred while submitting.' : 'Đã có lỗi xảy ra khi lưu RSVP.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="rsvp-section" className="py-12 sm:py-16 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-gold-400/40 shadow-xl relative overflow-hidden">
        {/* Decorative Top Banner */}
        <div className="h-2.5 bg-gradient-to-r from-crimson-800 via-gold-500 to-crimson-800 -mt-6 sm:-mt-10 -mx-6 sm:-mx-10 mb-8" />

        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson-50 text-crimson-800 text-xs font-bold uppercase tracking-wider mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>RSVP Form</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900">
            {t.rsvp_heading}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2">
            {t.rsvp_subheading}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-800 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-crimson-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Attendance Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              {t.rsvp_status_label} <span className="text-crimson-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRsvpStatus('attending')}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                  rsvpStatus === 'attending'
                    ? 'border-crimson-800 bg-crimson-50/50 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div>
                  <p className="font-bold text-stone-900 text-sm sm:text-base">{t.attending_yes}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {lang === 'en' ? 'See you at the 8-course celebration!' : 'Sẵn sàng nâng ly chúc mừng!'}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  rsvpStatus === 'attending' ? 'border-crimson-800 bg-crimson-800' : 'border-stone-300'
                }`}>
                  {rsvpStatus === 'attending' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRsvpStatus('declined')}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                  rsvpStatus === 'declined'
                    ? 'border-stone-800 bg-stone-50 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div>
                  <p className="font-bold text-stone-900 text-sm sm:text-base">{t.attending_no}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {lang === 'en' ? 'Sending love from afar' : 'Gửi lời chúc mừng từ phương xa'}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  rsvpStatus === 'declined' ? 'border-stone-800 bg-stone-800' : 'border-stone-300'
                }`}>
                  {rsvpStatus === 'declined' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            </div>
          </div>

          {/* 2. Primary Guest Info */}
          <div className="bg-stone-50/70 p-5 rounded-2xl border border-stone-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">
              {t.rsvp_lead_info}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.first_name} <span className="text-crimson-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Trang / Kevin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.last_name} <span className="text-crimson-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Nguyen / Tran"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="youremail@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.phone}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (714) 555-0123"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.relationship_label}
                </label>
                <select
                  value={relationshipTag}
                  onChange={(e) => setRelationshipTag(e.target.value as TableHierarchy)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white text-sm"
                >
                  <option value="vip_family">{t.rel_vip}</option>
                  <option value="extended_relatives">{t.rel_relatives}</option>
                  <option value="friends_bar">{t.rel_friends}</option>
                  <option value="general">{t.rel_general}</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Group / Family Member Linking (Only if Attending) */}
          {rsvpStatus === 'attending' && (
            <div className="bg-stone-50/70 p-5 rounded-2xl border border-stone-200/80">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    {t.party_members_title} ({1 + plusOnes.length} {lang === 'en' ? 'Guests Total' : 'Khách'})
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {t.party_members_subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPlusOne}
                  className="px-3 py-1.5 rounded-lg bg-gold-100 text-gold-900 hover:bg-gold-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.add_guest_btn}</span>
                </button>
              </div>

              {plusOnes.length > 0 && (
                <div className="mt-4 space-y-3">
                  {plusOnes.map((po, idx) => (
                    <div key={po.id} className="p-3.5 bg-white rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span className="text-xs font-bold px-2 py-1 rounded bg-stone-100 text-stone-600 shrink-0">
                        {lang === 'en' ? `Guest #${idx + 2}` : `Khách #${idx + 2}`}
                      </span>
                      <input
                        type="text"
                        value={po.name}
                        onChange={(e) => handleUpdatePlusOne(po.id, { name: e.target.value })}
                        placeholder={t.member_name_placeholder}
                        className="flex-1 px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson-700"
                      />
                      <input
                        type="text"
                        value={po.dietary_notes || ''}
                        onChange={(e) => handleUpdatePlusOne(po.id, { dietary_notes: e.target.value })}
                        placeholder={lang === 'en' ? 'Dietary needs (optional)' : 'Ghi chú ăn kiêng (nếu có)'}
                        className="w-full sm:w-48 px-3 py-2 rounded-lg border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePlusOne(po.id)}
                        className="p-2 text-stone-400 hover:text-crimson-700 transition-colors"
                        title={t.remove_guest}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Dietary Restrictions (Only if Attending) */}
          {rsvpStatus === 'attending' && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="w-4 h-4 text-gold-600" />
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  {t.dietary_title}
                </label>
              </div>
              <p className="text-xs text-stone-500 mb-3">
                {t.dietary_subtitle}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
                {dietaryOptions.map((opt) => {
                  const isChecked = dietary.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleDietaryToggle(opt.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-gold-500 bg-gold-50/70 text-gold-950 font-bold shadow-2xs'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isChecked && <CheckCircle className="w-3.5 h-3.5 text-gold-700 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder={t.diet_custom_placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white text-xs"
              />
            </div>
          )}

          {/* 5. Song Request for DJ (Only if Attending) */}
          {rsvpStatus === 'attending' && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Music className="w-4 h-4 text-crimson-700" />
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  {t.song_title}
                </label>
              </div>
              <input
                type="text"
                value={songRequest}
                onChange={(e) => setSongRequest(e.target.value)}
                placeholder={t.song_placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white text-sm"
              />
            </div>
          )}

          {/* 6. Warm Wishes / Blessings */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              {t.notes_title}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notes_placeholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white text-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-stone-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-crimson-700 via-crimson-800 to-crimson-900 text-white font-bold text-base shadow-lg hover:shadow-xl hover:from-crimson-800 hover:to-crimson-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.submitting}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-gold-300" />
                  <span>{t.submit_rsvp}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

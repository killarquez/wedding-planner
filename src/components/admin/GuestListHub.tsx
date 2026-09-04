'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { Party, Guest, TableHierarchy } from '@/lib/types';
import {
  Users,
  Link2,
  Copy,
  Check,
  MessageSquare,
  Plus,
  FileSpreadsheet,
  Download,
  Trash2,
  Search,
  ExternalLink,
  Heart,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Mail
} from 'lucide-react';

interface Props {
  lang: Language;
  parties: Array<Party & { guests: Guest[]; confirmed_count: number }>;
  onRefresh: () => void;
}

export const GuestListHub: React.FC<Props> = ({ lang, parties, onRefresh }) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'pending' | 'declined'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Single Add Party State
  const [newPartyName, setNewPartyName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGuestNames, setNewGuestNames] = useState('');
  const [newTag, setNewTag] = useState<TableHierarchy>('general');
  const [newNotes, setNewNotes] = useState('');

  // Bulk Import State
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');

  // Base URL for invite links
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://wedding.au-tomato.com';

  const getInviteUrl = (code: string) => `${siteOrigin}/rsvp?invite=${encodeURIComponent(code)}`;

  const handleCopyLink = (code: string) => {
    const url = getInviteUrl(code);
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Metrics
  const totalParties = parties.length;
  const totalGuests = parties.reduce((sum, p) => sum + (p.guests?.length || p.total_invited || 0), 0);
  const totalConfirmed = parties.reduce((sum, p) => sum + (p.confirmed_count || 0), 0);
  const totalDeclined = parties.reduce((sum, p) => {
    const dec = p.guests?.filter(g => g.rsvp_status === 'declined').length || 0;
    return sum + dec;
  }, 0);
  const totalPending = totalGuests - totalConfirmed - totalDeclined;

  // Filtered Parties
  const filteredParties = parties.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      p.primary_guest_name.toLowerCase().includes(searchLower) ||
      p.invitation_code.toLowerCase().includes(searchLower) ||
      (p.contact_phone && p.contact_phone.includes(searchTerm)) ||
      p.guests?.some(g => `${g.first_name} ${g.last_name}`.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    if (statusFilter === 'attending') {
      return (p.confirmed_count || 0) > 0;
    }
    if (statusFilter === 'declined') {
      return p.guests?.every(g => g.rsvp_status === 'declined');
    }
    if (statusFilter === 'pending') {
      return p.guests?.some(g => g.rsvp_status === 'pending');
    }

    return true;
  });

  // Handle Add Single Party
  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;

    setLoadingAction(true);
    try {
      const names = newGuestNames
        .split(/[\n,]+/)
        .map(n => n.trim())
        .filter(Boolean);

      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_guest_name: newPartyName.trim(),
          contact_phone: newPhone.trim() || undefined,
          contact_email: newEmail.trim() || undefined,
          guest_names: names.length > 0 ? names : [newPartyName.trim()],
          relationship_tag: newTag,
          notes: newNotes.trim() || undefined
        })
      });

      if (!res.ok) throw new Error('Failed to create party');

      setIsAddModalOpen(false);
      setNewPartyName('');
      setNewPhone('');
      setNewEmail('');
      setNewGuestNames('');
      setNewNotes('');
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Bulk Import
  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;

    setLoadingAction(true);
    setBulkError('');

    try {
      // Parse lines: Party Name | Phone | Guest 1, Guest 2 | Tag
      const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
      const rows = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        const primaryName = parts[0] || '';
        const phone = parts[1] || '';
        const guestNames = parts[2]
          ? parts[2].split(',').map(n => n.trim()).filter(Boolean)
          : [primaryName];
        const tag = (parts[3] as TableHierarchy) || 'general';

        return {
          primary_guest_name: primaryName,
          contact_phone: phone || undefined,
          guest_names: guestNames,
          relationship_tag: tag
        };
      }).filter(r => r.primary_guest_name);

      if (rows.length === 0) {
        throw new Error('No valid party rows found. Please check format.');
      }

      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_import',
          rows
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import parties');

      setIsBulkModalOpen(false);
      setBulkText('');
      onRefresh();
    } catch (e: any) {
      setBulkError(e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Delete Party
  const handleDeleteParty = async (partyId: string, partyName: string) => {
    if (!confirm(lang === 'en' ? `Delete party "${partyName}" and all associated guests?` : `Xoá bàn tiệc "${partyName}" và danh sách khách kèm theo?`)) return;

    setLoadingAction(true);
    try {
      await fetch(`/api/parties?id=${partyId}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['Party Name', 'Invitation Code', 'Contact Phone', 'Contact Email', 'Total Invited', 'Confirmed Attending', 'Guest Names', 'Personalized Invite Link'];
    const rows = parties.map(p => {
      const guestNames = p.guests?.map(g => `${g.first_name} ${g.last_name}`.trim()).join('; ') || p.primary_guest_name;
      return [
        `"${p.primary_guest_name.replace(/"/g, '""')}"`,
        `"${p.invitation_code}"`,
        `"${p.contact_phone || ''}"`,
        `"${p.contact_email || ''}"`,
        p.guests?.length || p.total_invited || 1,
        p.confirmed_count || 0,
        `"${guestNames.replace(/"/g, '""')}"`,
        `"${getInviteUrl(p.invitation_code)}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Wedding_Guest_Invite_Links_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Collect Heartfelt Messages from parties
  const heartfeltMessages = parties.filter(p => p.special_message && p.special_message.trim());

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-stone-100 text-stone-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {lang === 'en' ? 'Total Parties' : 'Tổng Số Gia Đình'}
            </p>
            <p className="text-2xl font-bold font-serif text-stone-900">{totalParties}</p>
            <span className="text-[10px] text-stone-400">({totalGuests} {lang === 'en' ? 'guests' : 'khách'})</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {lang === 'en' ? 'Confirmed Guests' : 'Khách Đã Xác Nhận'}
            </p>
            <p className="text-2xl font-bold font-serif text-emerald-800">{totalConfirmed}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {lang === 'en' ? 'Pending RSVP' : 'Đang Chờ Phản Hồi'}
            </p>
            <p className="text-2xl font-bold font-serif text-amber-800">{totalPending}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-crimson-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-crimson-50 text-crimson-700">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {lang === 'en' ? 'Declined' : 'Không Thể Đến'}
            </p>
            <p className="text-2xl font-bold font-serif text-crimson-800">{totalDeclined}</p>
          </div>
        </div>
      </div>

      {/* 2. Action Bar: Search, Add Party, Bulk Import, Export CSV */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'en' ? 'Search by name, phone, code...' : 'Tìm theo tên, điện thoại, mã...'}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson-700"
          >
            <option value="all">{lang === 'en' ? 'All Statuses' : 'Tất cả trạng thái'}</option>
            <option value="attending">{lang === 'en' ? 'Attending Only' : 'Đã nhận lời'}</option>
            <option value="pending">{lang === 'en' ? 'Pending Only' : 'Chờ phản hồi'}</option>
            <option value="declined">{lang === 'en' ? 'Declined Only' : 'Đã từ chối'}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.add_party_btn}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-gold-300 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t.bulk_import_btn}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-white border border-stone-300 hover:border-gold-400 text-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>{t.export_csv_btn}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Parties Table & Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif font-bold text-stone-900 text-base">
            {lang === 'en' ? 'Invited Parties & Personalized Links' : 'Danh Sách Bàn Tiệc & Đường Dẫn Thiệp Riêng'}
            <span className="text-xs text-stone-500 font-normal ml-2">
              ({filteredParties.length} {lang === 'en' ? 'parties' : 'bàn/nhóm'})
            </span>
          </h3>
          {copiedCode && (
            <span className="text-xs text-emerald-700 font-bold animate-pulse flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {t.link_copied_toast}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredParties.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 text-stone-400 text-xs">
              {lang === 'en' ? 'No parties found matching your filter.' : 'Không tìm thấy bàn tiệc phù hợp.'}
            </div>
          ) : (
            filteredParties.map((party) => {
              const inviteUrl = getInviteUrl(party.invitation_code);
              const isCopied = copiedCode === party.invitation_code;
              const hasAttending = (party.confirmed_count || 0) > 0;
              const hasDeclined = party.guests?.some(g => g.rsvp_status === 'declined');
              const isAllDeclined = party.guests?.every(g => g.rsvp_status === 'declined');

              // SMS pre-draft
              const smsMessage = lang === 'en'
                ? `Hi ${party.primary_guest_name}! Here is your personalized invitation to Trang & Alfredo's Wedding Celebration on Dec 5, 2026: ${inviteUrl}`
                : `Thân gửi ${party.primary_guest_name}! Đây là thiệp mời dạ tiệc cưới Trang & Alfredo ngày 05/12/2026 dành riêng cho gia đình: ${inviteUrl}`;
              const smsHref = `sms:${party.contact_phone || ''}?&body=${encodeURIComponent(smsMessage)}`;

              return (
                <div
                  key={party.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:border-gold-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-serif font-bold text-stone-900">
                          {party.primary_guest_name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-crimson-50 border border-crimson-200 text-crimson-800 text-[10px] font-bold">
                          {party.invitation_code}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                        {party.contact_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {party.contact_phone}
                          </span>
                        )}
                        {party.contact_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400" />
                            {party.contact_email}
                          </span>
                        )}
                        <span>
                          • {party.guests?.length || party.total_invited} {lang === 'en' ? 'seats invited' : 'chỗ mời'}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {isAllDeclined ? (
                        <span className="px-3 py-1 rounded-xl bg-red-100 text-red-800 text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          {lang === 'en' ? 'Declined' : 'Từ chối'}
                        </span>
                      ) : hasAttending ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {party.confirmed_count} / {party.guests?.length || party.total_invited} {lang === 'en' ? 'Attending' : 'Tham dự'}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {lang === 'en' ? 'Pending RSVP' : 'Chưa phản hồi'}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteParty(party.id, party.primary_guest_name)}
                        className="text-stone-300 hover:text-red-500 p-1.5 transition-colors"
                        title="Delete Party"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Member Guests List with individual tags */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                    {party.guests?.map((guest) => {
                      const isGuestAttending = guest.rsvp_status === 'attending';
                      const isGuestDeclined = guest.rsvp_status === 'declined';

                      return (
                        <div
                          key={guest.id}
                          className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border ${
                            isGuestAttending
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                              : isGuestDeclined
                              ? 'bg-stone-100 border-stone-200 text-stone-400 line-through'
                              : 'bg-stone-50 border-stone-200 text-stone-700'
                          }`}
                        >
                          <span>{guest.first_name} {guest.last_name}</span>
                          {guest.dietary_restrictions?.length > 0 && (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title={`Dietary: ${guest.dietary_restrictions.join(', ')}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Special Message (if present) */}
                  {party.special_message && (
                    <div className="p-3 bg-gold-50/70 border border-gold-200 rounded-xl text-xs flex items-start gap-2">
                      <Heart className="w-3.5 h-3.5 text-crimson-700 shrink-0 mt-0.5 fill-crimson-700" />
                      <div className="text-stone-800">
                        <span className="font-bold text-crimson-900 block text-[11px] uppercase tracking-wider mb-0.5">
                          Message to Trang & Alfredo:
                        </span>
                        <p className="italic">"{party.special_message}"</p>
                      </div>
                    </div>
                  )}

                  {/* Unique Link & Action Triggers */}
                  <div className="p-3 bg-stone-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate flex-1">
                      <Link2 className="w-4 h-4 text-gold-600 shrink-0" />
                      <span className="text-xs font-mono text-stone-600 truncate">
                        {inviteUrl}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(party.invitation_code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isCopied
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white border border-stone-300 hover:border-gold-500 text-stone-800 shadow-2xs'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                        <span>{isCopied ? 'Copied!' : t.copy_link_btn}</span>
                      </button>

                      {party.contact_phone && (
                        <a
                          href={smsHref}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{t.sms_invite_btn}</span>
                        </a>
                      )}

                      <a
                        href={inviteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200 transition-colors"
                        title="Preview Guest View"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Heartfelt Messages Feed (if any messages received) */}
      {heartfeltMessages.length > 0 && (
        <div className="bg-gradient-to-br from-gold-50 to-crimson-50/30 p-6 sm:p-8 rounded-3xl border border-gold-300/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-crimson-800 text-gold-200 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-gold-200" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                {lang === 'en' ? 'Heartfelt Messages from Guests' : 'Lời Chúc Yêu Thương Từ Khách Mời'}
              </h3>
              <p className="text-xs text-stone-600">
                {lang === 'en' ? 'Special blessings & marriage advice submitted via RSVP' : 'Những lời chúc phúc được gửi qua thiệp cưới online'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {heartfeltMessages.map((p) => (
              <div
                key={p.id}
                className="bg-white/90 p-4 rounded-2xl border border-gold-200 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <p className="text-xs text-stone-700 italic leading-relaxed">
                  "{p.special_message}"
                </p>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="font-serif font-bold text-crimson-900">
                    {p.primary_guest_name}
                  </span>
                  <span className="text-stone-400">
                    {p.invitation_code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Single Party */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <form
            onSubmit={handleCreateParty}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gold-300 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-stone-900">
                {lang === 'en' ? 'Add New Invited Party' : 'Thêm Bàn Tiệc / Khách Mời'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 text-base"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Party / Family Name *
              </label>
              <input
                type="text"
                required
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                placeholder="e.g. Bác Hai Nguyen (Nguyen Family)"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contact Phone (for SMS)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1 (714) 555-0101"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Individual Guest Names (Comma or line separated)
              </label>
              <textarea
                rows={3}
                value={newGuestNames}
                onChange={(e) => setNewGuestNames(e.target.value)}
                placeholder="e.g. Uncle Hai Nguyen, Auntie Lan Nguyen, Kevin Nguyen"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Each named person will get an individual attendance toggle and dietary preference card on their party's RSVP link.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Relationship Tag
                </label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value as TableHierarchy)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson-700"
                >
                  <option value="vip_family">{t.table_vip_tag}</option>
                  <option value="extended_relatives">{t.table_relatives_tag}</option>
                  <option value="friends_bar">{t.table_friends_tag}</option>
                  <option value="general">General Banquet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Seating preferences, etc."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingAction}
                className="px-5 py-2 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white font-bold text-xs shadow-xs"
              >
                Create & Generate Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Bulk Import */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-gold-300 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-gold-600" />
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {lang === 'en' ? 'Bulk Import Guest List & Generate Links' : 'Nhập Danh Sách Khách & Tạo Link Hàng Loạt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5 text-stone-600">
              <p className="font-bold text-stone-800">
                Format: <code>Party Name | Phone | Guest 1, Guest 2, Guest 3 | Tag (optional)</code>
              </p>
              <p>Example lines:</p>
              <pre className="p-2 bg-white rounded-lg border border-stone-200 font-mono text-[11px] text-stone-700 overflow-x-auto">
{`Nguyen Family | (714) 555-0101 | Tam Nguyen, Linh Nguyen, Kevin Nguyen | vip_family
Roberto Rossi | (714) 555-0102 | Roberto Rossi, Maria Rossi | vip_family
David Miller | (714) 555-0105 | David Miller, Plus One | friends_bar`}
              </pre>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Paste Guest List Lines:
              </label>
              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Paste your lines here..."
                className="w-full p-3 font-mono text-xs rounded-xl border border-stone-300 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-crimson-700"
              />
            </div>

            {bulkError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={loadingAction || !bulkText.trim()}
                className="px-5 py-2 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {loadingAction ? 'Importing...' : 'Generate All Links & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

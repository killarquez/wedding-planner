'use client';

import React, { useState, useMemo } from 'react';
import { Language, translations } from '@/lib/i18n';
import { Table, Guest, Party, SongRequest } from '@/lib/types';
import {
  Utensils,
  Music,
  ShieldAlert,
  Printer,
  CheckCircle,
  PlayCircle,
  Ban,
  Search,
  Sparkles,
  Layers,
  Clock,
  Plus,
  Send,
  Check,
  AlertTriangle,
  Volume2,
  ListMusic,
  ChefHat,
  Filter,
  X
} from 'lucide-react';

interface Props {
  lang: Language;
  tables: Table[];
  guests: Guest[];
  parties?: Party[];
  songs: SongRequest[];
  onRefresh: () => void;
}

type ActiveSubTab = 'kitchen' | 'dj' | 'cue_sheet' | 'rsvp_tester';

export const KitchenDjOverview: React.FC<Props> = ({
  lang,
  tables,
  guests,
  parties = [],
  songs,
  onRefresh
}) => {
  const t = translations[lang];

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<ActiveSubTab>('kitchen');

  // Kitchen Dietary Filter
  const [selectedAllergenFilter, setSelectedAllergenFilter] = useState<string>('all');

  // DJ Queue Filters
  const [songSearch, setSongSearch] = useState('');
  const [songFilterGenre, setSongFilterGenre] = useState<string>('all');
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongGuest, setNewSongGuest] = useState('');
  const [newSongGenre, setNewSongGenre] = useState<'vpop' | 'edm_dance' | 'romantic_ballad' | 'viet_bolero' | 'hiphop_rnb' | '90s_2000s_classics' | 'other'>('vpop');
  const [newSongNotes, setNewSongNotes] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // RSVP Simulator State
  const [simPartyId, setSimPartyId] = useState<string>(parties[0]?.id || '');
  const [simStatus, setSimStatus] = useState<'attending' | 'declined'>('attending');
  const [simDietary, setSimDietary] = useState<string[]>(['Shellfish Allergy']);
  const [simDietaryNotes, setSimDietaryNotes] = useState('Severe lobster allergy - please substitute seabass');
  const [simSongTitle, setSimSongTitle] = useState('Một Nhà');
  const [simSongArtist, setSimSongArtist] = useState('Da LAB');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Group allergies by Table for the Head Chef
  const tableAllergies = useMemo(() => {
    return tables.map((table) => {
      const tableGuests = table.guests || [];
      const guestsWithDietary = tableGuests.filter(
        (g) => g.dietary_restrictions.length > 0 || g.dietary_notes
      );

      // Filter guests based on selected allergen filter
      const filteredGuests = selectedAllergenFilter === 'all'
        ? guestsWithDietary
        : guestsWithDietary.filter(g =>
            g.dietary_restrictions.includes(selectedAllergenFilter) ||
            (g.dietary_notes && g.dietary_notes.toLowerCase().includes(selectedAllergenFilter.toLowerCase()))
          );

      return {
        tableNumber: table.table_number,
        tableName: table.name,
        seatedCount: tableGuests.length,
        capacity: table.capacity,
        allDietaryGuests: guestsWithDietary,
        filteredGuests,
        hasHighRisk: guestsWithDietary.some(g =>
          g.dietary_restrictions.some(r => r.toLowerCase().includes('allergy') || r.toLowerCase().includes('peanut') || r.toLowerCase().includes('shellfish'))
        )
      };
    });
  }, [tables, selectedAllergenFilter]);

  // Global Allergy Totals across confirmed guests
  const allergySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    guests
      .filter((g) => g.rsvp_status === 'attending')
      .forEach((g) => {
        g.dietary_restrictions.forEach((r) => {
          summary[r] = (summary[r] || 0) + 1;
        });
      });
    return summary;
  }, [guests]);

  // Total guests with special dietary needs
  const totalDietaryGuestsCount = useMemo(() => {
    return guests.filter(g => g.rsvp_status === 'attending' && (g.dietary_restrictions.length > 0 || g.dietary_notes)).length;
  }, [guests]);

  // Handle DJ song status update
  const handleUpdateSongStatus = async (id: string, status: 'queued' | 'played' | 'banned') => {
    setLoadingAction(true);
    try {
      await fetch('/api/dj', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  // Add ad-hoc DJ song
  const handleAddCustomSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongTitle.trim()) return;
    setLoadingAction(true);
    try {
      await fetch('/api/dj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_title: newSongTitle.trim(),
          artist: newSongArtist.trim() || 'Custom Request',
          guest_name: newSongGuest.trim() || 'DJ Danny K / Couple',
          genre: newSongGenre,
          notes: newSongNotes.trim()
        })
      });
      setNewSongTitle('');
      setNewSongArtist('');
      setNewSongGuest('');
      setNewSongNotes('');
      setIsAddingSong(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  // Filtered Songs List
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      const matchesSearch =
        s.song_title.toLowerCase().includes(songSearch.toLowerCase()) ||
        s.guest_name.toLowerCase().includes(songSearch.toLowerCase()) ||
        s.artist.toLowerCase().includes(songSearch.toLowerCase());
      const matchesGenre = songFilterGenre === 'all' || s.genre === songFilterGenre;
      return matchesSearch && matchesGenre;
    });
  }, [songs, songSearch, songFilterGenre]);

  // Run Simulated Live RSVP Submission
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);

    try {
      const selectedParty = parties.find(p => p.id === simPartyId) || parties[0];
      const targetPartyGuests = guests.filter(g => g.party_id === selectedParty?.id);

      const payload = {
        party_id: selectedParty?.id || `party-sim-${Date.now()}`,
        contact_email: selectedParty?.contact_email || 'guest@example.com',
        contact_phone: selectedParty?.contact_phone || '+1 (714) 555-0199',
        special_message: 'So excited for Trang & Alfredo! Can\'t wait for the banquet and Hennessy toast!',
        guests: targetPartyGuests.map((g, idx) => ({
          guest_id: g.id,
          first_name: g.first_name,
          last_name: g.last_name,
          rsvp_status: simStatus,
          dietary_restrictions: idx === 0 ? simDietary : [],
          dietary_notes: idx === 0 ? simDietaryNotes : ''
        })),
        song_request: simSongTitle ? {
          song_title: simSongTitle,
          artist: simSongArtist
        } : undefined
      };

      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSimResult(data);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  // Toggle dietary in simulator
  const toggleSimDietary = (item: string) => {
    setSimDietary(prev =>
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    );
  };

  return (
    <div className="space-y-8">
      {/* Sub-Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-stone-200/70 rounded-2xl border border-stone-300/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('kitchen')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'kitchen'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-300" />
            <span>{t.tab_kitchen_specs}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold">
              {totalDietaryGuestsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dj')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'dj'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            <Music className="w-4 h-4 text-purple-300" />
            <span>{t.tab_dj_queue}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 font-bold">
              {songs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cue_sheet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cue_sheet'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            <ListMusic className="w-4 h-4 text-blue-400" />
            <span>{t.tab_audio_cues}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rsvp_tester')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'rsvp_tester'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>{t.tab_rsvp_tester}</span>
          </button>
        </div>

        {/* Global Action: Print Chef Spec Sheet */}
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all w-fit"
        >
          <Printer className="w-4 h-4 text-gold-400" />
          <span>{t.print_chef_sheet}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB 1: BANQUET KITCHEN DIETARY MATRIX                              */}
      {/* ========================================================================= */}
      {activeTab === 'kitchen' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
                  {lang === 'en' ? 'Grand Harbor Banquet Kitchen Dietary Matrix' : 'Bảng Tổng Hợp Ăn Kiêng & Dị Ứng Bếp Trưởng Grand Harbor'}
                </h3>
                <p className="text-xs text-stone-500">
                  {lang === 'en'
                    ? 'Table-by-table special meal substitutions for 8-course banquet (Lobster, Duck, Seabass).'
                    : 'Phân bổ khẩu phần ăn kiêng theo từng bàn 10 người cho yến tiệc 8 món.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                {totalDietaryGuestsCount} {lang === 'en' ? 'Special Meals Required' : 'Suất Ăn Đặc Biệt Cần Chuẩn Bị'}
              </span>
            </div>
          </div>

          {/* Quick Allergen Filter Pills */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              {lang === 'en' ? 'Filter by Specific Dietary Concern:' : 'Lọc Theo Loại Dị Ứng / Kiêng:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedAllergenFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedAllergenFilter === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {t.filter_allergies_all} ({totalDietaryGuestsCount})
              </button>

              {Object.entries(allergySummary).map(([allergy, count]) => (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => setSelectedAllergenFilter(allergy)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    selectedAllergenFilter === allergy
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{allergy}: {count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table by Table Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tableAllergies.map((table) => {
              const displayGuests = table.filteredGuests;
              const hasAlerts = displayGuests.length > 0;

              return (
                <div
                  key={table.tableNumber}
                  className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
                    hasAlerts
                      ? table.hasHighRisk
                        ? 'border-red-300 bg-red-50/20 shadow-2xs'
                        : 'border-amber-300 bg-amber-50/20 shadow-2xs'
                      : 'border-stone-200 bg-white opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-stone-900 text-gold-300 text-xs font-bold flex items-center justify-center">
                        {table.tableNumber}
                      </span>
                      <div>
                        <span className="font-bold text-stone-900 text-sm block">
                          {table.tableName}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {table.seatedCount} / {table.capacity} {lang === 'en' ? 'seated' : 'chỗ ngồi'}
                        </span>
                      </div>
                    </div>

                    {table.hasHighRisk && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>{t.high_risk_badge}</span>
                      </span>
                    )}
                  </div>

                  {!hasAlerts ? (
                    <p className="text-xs text-stone-400 italic py-3">
                      {selectedAllergenFilter === 'all'
                        ? (lang === 'en' ? 'Standard 8-course banquet menu (no dietary flags).' : 'Thực đơn 8 món tiêu chuẩn (không có yêu cầu kiêng).')
                        : (lang === 'en' ? `No guests with "${selectedAllergenFilter}" at this table.` : `Không có khách kiêng "${selectedAllergenFilter}" tại bàn này.`)}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {displayGuests.map((guest) => (
                        <div key={guest.id} className="text-xs p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-stone-900">
                            <span>{guest.first_name} {guest.last_name}</span>
                            <div className="flex flex-wrap gap-1">
                              {guest.dietary_restrictions.map((r, i) => (
                                <span
                                  key={i}
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                    r.toLowerCase().includes('allergy')
                                      ? 'bg-red-50 text-red-800 border-red-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>

                          {guest.dietary_notes && (
                            <p className="text-[11px] text-stone-600 italic bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                              Note: "{guest.dietary_notes}"
                            </p>
                          )}

                          {/* Chef Recommendation Prompt */}
                          <div className="text-[10px] text-emerald-800 font-medium pt-1 flex items-center gap-1">
                            <Utensils className="w-3 h-3 text-emerald-600" />
                            <span>
                              {guest.dietary_restrictions.includes('Shellfish Allergy')
                                ? 'Kitchen action: Substitute Course 2 (Lobster) with Steamed Chilean Seabass.'
                                : guest.dietary_restrictions.includes('Vegetarian')
                                ? 'Kitchen action: Prepare individual vegetarian tofu & mushroom claypot.'
                                : 'Kitchen action: Dedicated clean wok & zero nut contact.'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB 2: DJ PLAYLIST & GUEST SONG REQUESTS                           */}
      {/* ========================================================================= */}
      {activeTab === 'dj' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-crimson-50 text-crimson-800 flex items-center justify-center">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
                  {lang === 'en' ? 'Master DJ Song Queue & Guest Requests' : 'Danh Sách Yêu Cầu Nhạc DJ & Sàn Nhảy'}
                </h3>
                <p className="text-xs text-stone-500">
                  {lang === 'en'
                    ? 'Real-time aggregated playlist requested by guests via RSVP and curated for DJ Danny K.'
                    : 'Danh sách bài hát do khách mời yêu cầu trực tiếp qua cổng RSVP và bàn giao cho DJ.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingSong(!isAddingSong)}
                className="px-4 py-2 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'en' ? '+ Add Song' : '+ Thêm Bài Hát'}</span>
              </button>
            </div>
          </div>

          {/* Quick Add Song Drawer */}
          {isAddingSong && (
            <form onSubmit={handleAddCustomSong} className="p-5 bg-stone-50 rounded-2xl border-2 border-gold-400 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold font-serif text-stone-900">
                  {lang === 'en' ? 'Add Custom Song to DJ Cue' : 'Thêm Bài Hát Vào Danh Sách DJ'}
                </h4>
                <button type="button" onClick={() => setIsAddingSong(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Song Title *</label>
                  <input
                    type="text"
                    required
                    value={newSongTitle}
                    onChange={(e) => setNewSongTitle(e.target.value)}
                    placeholder="e.g. Cưới Nhau Đi"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Artist *</label>
                  <input
                    type="text"
                    required
                    value={newSongArtist}
                    onChange={(e) => setNewSongArtist(e.target.value)}
                    placeholder="e.g. Bùi Anh Tuấn & Hiền Hồ"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Requested By</label>
                  <input
                    type="text"
                    value={newSongGuest}
                    onChange={(e) => setNewSongGuest(e.target.value)}
                    placeholder="e.g. Trang & Alfredo"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Genre</label>
                  <select
                    value={newSongGenre}
                    onChange={(e) => setNewSongGenre(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="vpop">V-Pop / Việt</option>
                    <option value="edm_dance">EDM / Dance</option>
                    <option value="romantic_ballad">Romantic Ballad</option>
                    <option value="viet_bolero">Bolero / Trữ Tình</option>
                    <option value="hiphop_rnb">Hip Hop & RnB</option>
                    <option value="90s_2000s_classics">90s & 2000s Classics</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSong(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-1.5 bg-crimson-800 text-white rounded-lg text-xs font-bold hover:bg-crimson-900"
                >
                  Save to DJ Queue
                </button>
              </div>
            </form>
          )}

          {/* Search & Genre Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                placeholder={lang === 'en' ? 'Search song title, artist, or guest name...' : 'Tìm bài hát, ca sĩ, hoặc tên khách...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
              />
            </div>

            <select
              value={songFilterGenre}
              onChange={(e) => setSongFilterGenre(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
            >
              <option value="all">{lang === 'en' ? 'All Genres (Tất Cả)' : 'Tất Cả Thể Loại'}</option>
              <option value="vpop">V-Pop / Việt</option>
              <option value="viet_bolero">Bolero / Trữ Tình</option>
              <option value="edm_dance">EDM / Dance Floor</option>
              <option value="romantic_ballad">Romantic Ballad</option>
              <option value="90s_2000s_classics">90s & 2000s Throwbacks</option>
              <option value="hiphop_rnb">Hip Hop & RnB</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Songs Table */}
          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Song Title & Artist</th>
                  <th className="py-3 px-3">Genre</th>
                  <th className="py-3 px-3">Requested By</th>
                  <th className="py-3 px-3">Vibe / Notes</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">DJ Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {filteredSongs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400 italic">
                      {lang === 'en' ? 'No songs match the current search.' : 'Không có bài hát nào khớp bộ lọc.'}
                    </td>
                  </tr>
                ) : (
                  filteredSongs.map((song, idx) => (
                    <tr key={song.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-stone-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-stone-900 text-sm">
                          {song.song_title}
                        </p>
                        <p className="text-stone-500 text-[11px]">{song.artist}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 uppercase">
                          {song.genre}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-stone-700">
                        {song.guest_name}
                      </td>
                      <td className="py-3 px-3 text-stone-500 italic max-w-xs truncate">
                        {song.notes || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          song.status === 'played'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : song.status === 'banned'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {song.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateSongStatus(song.id, 'played')}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Mark as Played"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateSongStatus(song.id, 'queued')}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="Queue Song"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateSongStatus(song.id, 'banned')}
                            className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            title="Do Not Play"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB 3: RECEPTION & BANQUET AUDIO CUE SHEET                         */}
      {/* ========================================================================= */}
      {activeTab === 'cue_sheet' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
              {lang === 'en' ? 'Reception & Banquet Audio Cue Sheet' : 'Kịch Bản Âm Thanh Tiến Trình Tiệc Cưới'}
            </h3>
            <p className="text-xs text-stone-500">
              {lang === 'en'
                ? 'Master audio cues and volume pacing for DJ Danny K and bilingual MC across the December 12, 2026 program.'
                : 'Kịch bản điều phối nhạc nền, thời lượng và âm lượng cho DJ và MC song ngữ trong suốt chương trình 12/12/2026.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Cue 1 */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold-600" />
                  <span className="text-xs font-bold text-stone-900">{t.cue_time_reception}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-medium">
                    Background ~65 dB
                  </span>
                </div>
                <p className="text-xs text-stone-600">{t.cue_desc_reception}</p>
                <p className="text-[11px] text-stone-400">Audio note: Seamless looping, audible conversation at red envelope welcome photo station.</p>
              </div>
              <span className="text-xs font-bold text-stone-700 px-3 py-1 bg-white rounded-xl border border-stone-200 w-fit">
                Playlist: Acoustic Love Hits
              </span>
            </div>

            {/* Cue 2 */}
            <div className="p-4 rounded-2xl border-2 border-crimson-200 bg-crimson-50/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-crimson-700" />
                  <span className="text-xs font-bold text-stone-900">{t.cue_time_entrance}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-crimson-100 text-crimson-800 font-bold">
                    Peak Impact ~85 dB
                  </span>
                </div>
                <p className="text-xs text-stone-700 font-medium">{t.cue_desc_entrance}</p>
                <p className="text-[11px] text-stone-500">Audio note: MC countdown in Vietnamese & English, drop upbeat celebratory beat on couple doorway appearance.</p>
              </div>
              <span className="text-xs font-bold text-crimson-800 px-3 py-1 bg-white rounded-xl border border-crimson-200 w-fit">
                Track: Festive Grand Fanfare
              </span>
            </div>

            {/* Cue 3 */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-stone-900">{t.cue_time_toast}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                    Grand Stage ~75 dB
                  </span>
                </div>
                <p className="text-xs text-stone-600">{t.cue_desc_toast}</p>
                <p className="text-[11px] text-stone-400">Audio note: Champagne pouring swell, celebratory glass clinking cue, family bows.</p>
              </div>
              <span className="text-xs font-bold text-stone-700 px-3 py-1 bg-white rounded-xl border border-stone-200 w-fit">
                Track: Orchestral Champagne Pour
              </span>
            </div>

            {/* Cue 4 */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-stone-900">{t.cue_time_banquet}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                    Dining Ambience ~68 dB
                  </span>
                </div>
                <p className="text-xs text-stone-600">{t.cue_desc_banquet}</p>
                <p className="text-[11px] text-stone-400">Audio note: Accompanies the 8-station Chào Bàn table toasting with Hennessy XO cognac. Keep levels gentle for table talk.</p>
              </div>
              <span className="text-xs font-bold text-stone-700 px-3 py-1 bg-white rounded-xl border border-stone-200 w-fit">
                Playlist: V-Pop Acoustic & 90s Classics
              </span>
            </div>

            {/* Cue 5 */}
            <div className="p-4 rounded-2xl border-2 border-gold-300 bg-gold-50/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-600" />
                  <span className="text-xs font-bold text-stone-900">{t.cue_time_first_dance}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-200 text-gold-900 font-bold">
                    Center Stage ~80 dB
                  </span>
                </div>
                <p className="text-xs text-stone-700 font-medium">{t.cue_desc_first_dance}</p>
                <p className="text-[11px] text-stone-500">Audio note: Dim room lights, focus pin spot on center dance floor, fade smoothly into track.</p>
              </div>
              <span className="text-xs font-bold text-gold-900 px-3 py-1 bg-white rounded-xl border border-gold-300 w-fit">
                Track: Couple Love Song
              </span>
            </div>

            {/* Cue 6 */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-stone-900">{t.cue_time_open_dance}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                    Peak Club ~92 dB
                  </span>
                </div>
                <p className="text-xs text-stone-600">{t.cue_desc_open_dance}</p>
                <p className="text-[11px] text-stone-400">Audio note: Play guest requested tracks, incorporate V-Pop club remixes, build energy to 11:30 PM.</p>
              </div>
              <span className="text-xs font-bold text-stone-700 px-3 py-1 bg-white rounded-xl border border-stone-200 w-fit">
                Playlist: High-Energy Dance Floor
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB 4: LIVE RSVP PIPELINE TESTER / SIMULATOR                       */}
      {/* ========================================================================= */}
      {activeTab === 'rsvp_tester' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
              {lang === 'en' ? 'Live RSVP Pipeline & Kitchen/DJ Dispatch Simulator' : 'Mô Phỏng Tiếp Nhận RSVP Trực Tiếp & Điều Phối Tự Động'}
            </h3>
            <p className="text-xs text-stone-500">
              {lang === 'en'
                ? 'Test how an incoming guest RSVP instantly updates table math, dispatches dietary alerts to the Banquet Kitchen, and injects requested songs into the DJ Queue.'
                : 'Thử nghiệm cách một phản hồi RSVP tự động cập nhật hệ số bàn tròn, gửi cảnh báo dị ứng tới Bếp và đưa bài hát vào hàng đợi DJ.'}
            </p>
          </div>

          <form onSubmit={handleRunSimulation} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {/* Select Party */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Invitation Party *</label>
                <select
                  value={simPartyId}
                  onChange={(e) => setSimPartyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.primary_guest_name} ({p.invitation_code} • {p.total_invited} seats)
                    </option>
                  ))}
                </select>
              </div>

              {/* Attendance Status */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Simulated Attendance *</label>
                <select
                  value={simStatus}
                  onChange={(e) => setSimStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                >
                  <option value="attending">Attending Celebration (Tham Dự)</option>
                  <option value="declined">Declined with Regrets (Không Tham Dự)</option>
                </select>
              </div>

              {/* Song Request */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Song Request</label>
                <input
                  type="text"
                  value={simSongTitle}
                  onChange={(e) => setSimSongTitle(e.target.value)}
                  placeholder="e.g. Nơi Này Có Anh"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                />
              </div>

              {/* Song Artist */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Song Artist</label>
                <input
                  type="text"
                  value={simSongArtist}
                  onChange={(e) => setSimSongArtist(e.target.value)}
                  placeholder="e.g. Sơn Tùng M-TP"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                />
              </div>

              {/* Dietary Notes */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">Dietary Special Notes for Chef</label>
                <input
                  type="text"
                  value={simDietaryNotes}
                  onChange={(e) => setSimDietaryNotes(e.target.value)}
                  placeholder="e.g. Severe peanut allergy; requires seabass substitution for lobster"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>

            {/* Dietary Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Select Dietary Restrictions to Dispatch:
              </label>
              <div className="flex flex-wrap gap-2">
                {['Shellfish Allergy', 'Peanut / Tree Nut Allergy', 'Gluten-Free', 'Vegetarian', 'Halal / No Pork'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleSimDietary(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      simDietary.includes(item)
                        ? 'bg-crimson-800 text-white border-crimson-800'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {simDietary.includes(item) ? '✓ ' : '+ '}{item}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={simulating}
                className="px-5 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                {simulating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing RSVP Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t.simulate_rsvp_btn}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Simulation Output Card */}
          {simResult && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <span className="font-bold text-sm flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-700" />
                  <span>RSVP Pipeline Processed Successfully!</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-800">
                  Status: 200 OK • Supabase Synced
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Result 1: Kitchen Alert */}
                <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900">
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>Kitchen Dietary Dispatch</span>
                  </div>
                  <p className="text-stone-600 text-[11px]">
                    {simResult.agentResponse?.dietaryAlertRouted
                      ? `Dispatched alerts: ${simResult.agentResponse?.dietaryAlertDetails?.join(', ')}`
                      : 'No dietary restrictions flagged.'}
                  </p>
                </div>

                {/* Result 2: DJ Queue */}
                <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900">
                    <Music className="w-4 h-4 text-purple-600" />
                    <span>DJ Queue Insertion</span>
                  </div>
                  <p className="text-stone-600 text-[11px]">
                    {simResult.agentResponse?.djSongQueued
                      ? `Queued song: "${simResult.agentResponse?.djSongTitle}"`
                      : 'No song requested.'}
                  </p>
                </div>

                {/* Result 3: Calendar .ics */}
                <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900">
                    <Sparkles className="w-4 h-4 text-gold-600" />
                    <span>Instant Calendar Invite</span>
                  </div>
                  <p className="text-stone-600 text-[11px]">
                    Generated .ics file for Saturday, Dec 12, 2026 (5:30 PM PST).
                  </p>
                </div>
              </div>

              {/* Bilingual Email Preview */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
                <span className="font-bold text-stone-900 block">
                  Auto-Drafted Confirmation Email (Bilingual EN/VI):
                </span>
                <p className="text-[11px] font-mono text-stone-700 whitespace-pre-wrap bg-stone-50 p-3 rounded-lg border border-stone-200 max-h-40 overflow-y-auto">
                  {simResult.agentResponse?.emailConfirmation?.bodyEn}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PRINT-FRIENDLY CHEF SPEC SHEET (Hidden on screen, visible on print)    */}
      {/* ========================================================================= */}
      <div className="hidden print:block space-y-6 p-6">
        <div className="border-b-2 border-stone-900 pb-4">
          <h1 className="text-2xl font-bold font-serif">Grand Harbor Restaurant • Head Chef Banquet Spec Sheet</h1>
          <p className="text-sm text-stone-600">Trang & Alfredo Wedding Celebration • Saturday, December 12, 2026</p>
          <p className="text-xs text-stone-500">8-Course Grand Banquet • 8 Ten-Top Round Tables • Total Special Meals: {totalDietaryGuestsCount}</p>
        </div>

        <table className="w-full text-left text-xs border-collapse border border-stone-300">
          <thead>
            <tr className="bg-stone-100 border-b border-stone-300">
              <th className="p-2">Table #</th>
              <th className="p-2">Table Name</th>
              <th className="p-2">Guest Name</th>
              <th className="p-2">Dietary Restrictions</th>
              <th className="p-2">Chef Prep Instruction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {tableAllergies.flatMap((table) =>
              table.allDietaryGuests.map((g) => (
                <tr key={g.id}>
                  <td className="p-2 font-bold">{table.tableNumber}</td>
                  <td className="p-2">{table.tableName}</td>
                  <td className="p-2 font-bold">{g.first_name} {g.last_name}</td>
                  <td className="p-2 text-red-700 font-bold">{g.dietary_restrictions.join(', ')}</td>
                  <td className="p-2 italic">{g.dietary_notes || 'Standard substitution'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

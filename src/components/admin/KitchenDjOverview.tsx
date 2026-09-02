'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { Table, Guest, SongRequest } from '@/lib/types';
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
  Layers
} from 'lucide-react';

interface Props {
  lang: Language;
  tables: Table[];
  guests: Guest[];
  songs: SongRequest[];
  onRefresh: () => void;
}

export const KitchenDjOverview: React.FC<Props> = ({
  lang,
  tables,
  guests,
  songs,
  onRefresh
}) => {
  const t = translations[lang];
  const [songSearch, setSongSearch] = useState('');
  const [songFilterGenre, setSongFilterGenre] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Group allergies by Table for the Head Chef
  const tableAllergies = tables.map((table) => {
    const tableGuests = table.guests || [];
    const guestsWithDietary = tableGuests.filter(
      (g) => g.dietary_restrictions.length > 0 || g.dietary_notes
    );

    return {
      tableNumber: table.table_number,
      tableName: table.name,
      seatedCount: tableGuests.length,
      capacity: table.capacity,
      guestsWithDietary
    };
  });

  // Global Allergy Totals
  const allergySummary: Record<string, number> = {};
  guests
    .filter((g) => g.rsvp_status === 'attending')
    .forEach((g) => {
      g.dietary_restrictions.forEach((r) => {
        allergySummary[r] = (allergySummary[r] || 0) + 1;
      });
    });

  const handleUpdateSongStatus = async (id: string, status: 'queued' | 'played' | 'banned') => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handlePrintKitchenSheet = () => {
    window.print();
  };

  const filteredSongs = songs.filter((s) => {
    const matchesSearch =
      s.song_title.toLowerCase().includes(songSearch.toLowerCase()) ||
      s.guest_name.toLowerCase().includes(songSearch.toLowerCase()) ||
      s.artist.toLowerCase().includes(songSearch.toLowerCase());
    const matchesGenre = songFilterGenre === 'all' || s.genre === songFilterGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="space-y-10">
      {/* 1. Banquet Kitchen Dietary Matrix */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
                {lang === 'en' ? 'Banquet Kitchen Dietary Matrix' : 'Bảng Tổng Hợp Ăn Kiêng & Dị Ứng Bếp Trưởng'}
              </h3>
              <p className="text-xs text-stone-500">
                {lang === 'en'
                  ? 'Table-by-table special meal coordination for 8-course banquet chef.'
                  : 'Bảng phân bổ món ăn riêng theo từng bàn 10 người cho bếp trưởng.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrintKitchenSheet}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all w-fit"
          >
            <Printer className="w-4 h-4 text-gold-400" />
            <span>{lang === 'en' ? 'Print Chef Spec Sheet' : 'In Bảng Cho Bếp Trưởng'}</span>
          </button>
        </div>

        {/* Global Allergy Metric Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-stone-500 mr-2">
            {lang === 'en' ? 'Total Banquet Allergies:' : 'Tổng Số Suất Ăn Đặc Biệt:'}
          </span>
          {Object.entries(allergySummary).map(([allergy, count]) => (
            <span
              key={allergy}
              className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>{allergy}: {count}</span>
            </span>
          ))}
        </div>

        {/* Table by Table Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tableAllergies.map((table) => (
            <div
              key={table.tableNumber}
              className={`p-4 rounded-2xl border-2 transition-all ${
                table.guestsWithDietary.length > 0
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-900 text-gold-300 text-xs font-bold flex items-center justify-center">
                    {table.tableNumber}
                  </span>
                  <span className="font-bold text-stone-900 text-sm truncate max-w-[200px]">
                    {table.tableName}
                  </span>
                </div>
                <span className="text-xs font-semibold text-stone-500">
                  {table.seatedCount} / {table.capacity} {lang === 'en' ? 'guests' : 'khách'}
                </span>
              </div>

              {table.guestsWithDietary.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-2">
                  {lang === 'en' ? 'Standard 8-course banquet menu (no special alerts)' : 'Dùng thực đơn 8 món tiêu chuẩn (không kiêng)'}
                </p>
              ) : (
                <div className="space-y-2">
                  {table.guestsWithDietary.map((guest) => (
                    <div key={guest.id} className="text-xs p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                      <div className="flex items-center justify-between font-bold text-stone-800 mb-0.5">
                        <span>{guest.first_name} {guest.last_name}</span>
                        <span className="text-amber-800 text-[11px] font-semibold">
                          {guest.dietary_restrictions.join(', ')}
                        </span>
                      </div>
                      {guest.dietary_notes && (
                        <p className="text-[11px] text-stone-500 italic">
                          "{guest.dietary_notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. DJ Master Cue & Song Requests */}
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
                  ? 'Real-time aggregated playlist requested by guests via RSVP.'
                  : 'Danh sách bài hát được khách mời yêu cầu trực tiếp qua cổng RSVP.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-crimson-100 text-crimson-900 text-xs font-bold">
              {songs.length} {lang === 'en' ? 'Songs Queued' : 'Bài Hát'}
            </span>
          </div>
        </div>

        {/* Search & Genre Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              placeholder={lang === 'en' ? 'Search song or guest...' : 'Tìm bài hát hoặc tên khách...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700"
            />
          </div>

          <select
            value={songFilterGenre}
            onChange={(e) => setSongFilterGenre(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
          >
            <option value="all">{lang === 'en' ? 'All Genres' : 'Tất Cả Thể Loại'}</option>
            <option value="vpop">V-Pop / Việt</option>
            <option value="viet_bolero">Bolero / Trữ Tình</option>
            <option value="edm_dance">EDM / Dance</option>
            <option value="90s_2000s_classics">90s & 2000s Classics</option>
            <option value="hiphop_rnb">Hip Hop & RnB</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Songs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Song Title & Artist</th>
                <th className="py-3 px-3">Requested By</th>
                <th className="py-3 px-3">Vibe / Notes</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">DJ Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSongs.map((song, idx) => (
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
                  <td className="py-3 px-3 font-medium text-stone-700">
                    {song.guest_name}
                  </td>
                  <td className="py-3 px-3 text-stone-500 italic">
                    {song.notes || '—'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      song.status === 'played'
                        ? 'bg-emerald-100 text-emerald-800'
                        : song.status === 'banned'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {song.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleUpdateSongStatus(song.id, 'played')}
                        className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        title="Mark as Played"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateSongStatus(song.id, 'queued')}
                        className="p-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                        title="Queue Song"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateSongStatus(song.id, 'banned')}
                        className="p-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                        title="Do Not Play"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

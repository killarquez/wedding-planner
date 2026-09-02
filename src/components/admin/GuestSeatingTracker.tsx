'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { Table, Guest, TableHierarchy } from '@/lib/types';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  UserCheck,
  Search,
  MoveRight,
  Shield,
  GlassWater,
  Building
} from 'lucide-react';

interface Props {
  lang: Language;
  tables: Table[];
  guests: Guest[];
  banquetMath: any;
  onRefresh: () => void;
}

export const GuestSeatingTracker: React.FC<Props> = ({
  lang,
  tables,
  guests,
  banquetMath,
  onRefresh
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [hierarchyFilter, setHierarchyFilter] = useState<string>('all');
  const [selectedGuestForMove, setSelectedGuestForMove] = useState<Guest | null>(null);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableTag, setNewTableTag] = useState<TableHierarchy>('general');
  const [loadingAction, setLoadingAction] = useState(false);

  // Status Metrics
  const totalInvited = guests.length;
  const confirmed = guests.filter((g) => g.rsvp_status === 'attending').length;
  const declined = guests.filter((g) => g.rsvp_status === 'declined').length;
  const pending = guests.filter((g) => g.rsvp_status === 'pending').length;

  const unassignedConfirmed = guests.filter(
    (g) => g.rsvp_status === 'attending' && !g.table_id
  );

  const filteredUnassigned = unassignedConfirmed.filter((g) => {
    const fullName = `${g.first_name} ${g.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesHierarchy =
      hierarchyFilter === 'all' || g.relationship_tag === hierarchyFilter;
    return matchesSearch && matchesHierarchy;
  });

  // Hierarchy Helpers
  const getHierarchyBadge = (tag: TableHierarchy) => {
    switch (tag) {
      case 'vip_family':
        return {
          label: lang === 'en' ? 'VIP Stage-Front (Elders)' : 'VIP Sát Sân Khấu (Trưởng Bối)',
          bg: 'bg-crimson-100 text-crimson-900 border-crimson-300',
          icon: Shield
        };
      case 'extended_relatives':
        return {
          label: lang === 'en' ? 'Extended Relatives' : 'Họ Hàng Nội Ngoại',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Building
        };
      case 'friends_bar':
        return {
          label: lang === 'en' ? 'Friends (Near Bar)' : 'Bạn Bè (Gần Quầy Bar)',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: GlassWater
        };
      default:
        return {
          label: lang === 'en' ? 'General Banquet' : 'Bàn Chung',
          bg: 'bg-stone-100 text-stone-800 border-stone-300',
          icon: Users
        };
    }
  };

  // Actions
  const handleAutoAssign = async () => {
    setLoadingAction(true);
    try {
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_assign' })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAssignGuest = async (guestId: string, tableId: string | null) => {
    setLoadingAction(true);
    try {
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_guest', guest_id: guestId, table_id: tableId })
      });
      setSelectedGuestForMove(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTableName,
          hierarchy_tag: newTableTag,
          capacity: 10
        })
      });
      setNewTableName('');
      setIsAddingTable(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm(lang === 'en' ? 'Delete this table? Assigned guests will become unassigned.' : 'Xoá bàn này? Khách đã ngồi sẽ chuyển về danh sách chưa xếp.')) return;
    setLoadingAction(true);
    try {
      await fetch(`/api/tables?id=${tableId}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Live Aggregation KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-stone-100 text-stone-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.metric_invited}</p>
            <p className="text-2xl font-bold font-serif text-stone-900">{totalInvited}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.metric_confirmed}</p>
            <p className="text-2xl font-bold font-serif text-emerald-800">{confirmed}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-crimson-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-crimson-50 text-crimson-700">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.metric_declined}</p>
            <p className="text-2xl font-bold font-serif text-crimson-800">{declined}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.metric_pending}</p>
            <p className="text-2xl font-bold font-serif text-amber-800">{pending}</p>
          </div>
        </div>
      </div>

      {/* 2. Banquet Table Multiplier Math Banner */}
      <div className="bg-gradient-to-br from-gold-50 via-white to-gold-100/50 p-6 sm:p-7 rounded-3xl border-2 border-gold-300/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gold-200/80 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-500 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                {t.banquet_math_card}
              </h2>
              <p className="text-xs text-stone-600">
                {lang === 'en'
                  ? `Math logic: ⌈Confirmed Headcount (${confirmed}) / 10-Top Tables⌉ = ${banquetMath.required_10_top_tables} Tables Required`
                  : `Công thức: ⌈Khách xác nhận (${confirmed}) / Bàn 10 người⌉ = Cần đặt ${banquetMath.required_10_top_tables} Bàn`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoAssign}
              disabled={loadingAction || unassignedConfirmed.length === 0}
              className="px-4 py-2 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-gold-300" />
              <span>{t.assign_all_auto}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddingTable(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 hover:border-gold-400 text-stone-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Plus className="w-4 h-4 text-stone-600" />
              <span>{t.add_table_btn}</span>
            </button>
          </div>
        </div>

        {/* Multiplier KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-white/80 p-3.5 rounded-2xl border border-gold-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              {t.tables_needed}
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-crimson-800">
              {banquetMath.required_10_top_tables}
            </span>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              ({banquetMath.total_tables_configured} {lang === 'en' ? 'configured' : 'đã lập'})
            </span>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-gold-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              {t.seats_open}
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-gold-700">
              {banquetMath.empty_seats_in_active_tables}
            </span>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              {lang === 'en' ? 'buffer seats in 10-tops' : 'ghế dự phòng sẵn sàng'}
            </span>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-gold-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              {t.table_fill_rate}
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-emerald-800">
              {banquetMath.fill_rate_percent}%
            </span>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              {banquetMath.assigned_count} / {banquetMath.total_capacity_configured} {lang === 'en' ? 'seated' : 'đã ngồi'}
            </span>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-gold-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              {t.unassigned_guests}
            </span>
            <span className={`text-2xl sm:text-3xl font-bold font-serif ${
              banquetMath.unassigned_count > 0 ? 'text-amber-700' : 'text-stone-700'
            }`}>
              {banquetMath.unassigned_count}
            </span>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              {lang === 'en' ? 'needs table seat' : 'cần xếp bàn'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Modal to Add New Table */}
      {isAddingTable && (
        <form onSubmit={handleCreateTable} className="bg-white p-5 rounded-2xl border-2 border-gold-400 shadow-md space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-stone-900 font-serif">
            {lang === 'en' ? 'Create New 10-Top Banquet Table' : 'Thêm Bàn Tiệc 10 Chỗ Mới'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="e.g. Bàn 9: University Friends"
              className="px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson-700"
            />
            <select
              value={newTableTag}
              onChange={(e) => setNewTableTag(e.target.value as TableHierarchy)}
              className="px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson-700"
            >
              <option value="vip_family">{t.table_vip_tag}</option>
              <option value="extended_relatives">{t.table_relatives_tag}</option>
              <option value="friends_bar">{t.table_friends_tag}</option>
              <option value="general">General Banquet</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingTable(false)}
              className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              {lang === 'en' ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={loadingAction}
              className="px-4 py-1.5 bg-crimson-800 text-white rounded-lg text-xs font-bold hover:bg-crimson-900"
            >
              {lang === 'en' ? 'Create Table' : 'Tạo Bàn'}
            </button>
          </div>
        </form>
      )}

      {/* 4. Quick Move Target Selector (if a guest is selected) */}
      {selectedGuestForMove && (
        <div className="p-4 bg-crimson-50 border border-crimson-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-crimson-800" />
            <span className="text-sm font-bold text-crimson-950">
              {lang === 'en' ? 'Move' : 'Chuyển vị trí'}: {selectedGuestForMove.first_name} {selectedGuestForMove.last_name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600">{lang === 'en' ? 'Select target table:' : 'Chọn bàn muốn xếp:'}</span>
            <button
              onClick={() => handleAssignGuest(selectedGuestForMove.id, null)}
              className="px-3 py-1.5 rounded-lg bg-stone-200 text-stone-800 text-xs font-medium hover:bg-stone-300"
            >
              {lang === 'en' ? 'Unseat (Pool)' : 'Bỏ Xếp Chỗ'}
            </button>
            <button
              onClick={() => setSelectedGuestForMove(null)}
              className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800"
            >
              {lang === 'en' ? 'Cancel' : 'Đóng'}
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Seating Layout: Tables Matrix + Unassigned Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 10-Top Banquet Tables Floorplan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <span>{lang === 'en' ? 'Banquet Floor Tables' : 'Sơ Đồ Bàn Yến Tiệc'}</span>
              <span className="text-xs font-normal text-stone-500">
                ({tables.length} {lang === 'en' ? 'Tables' : 'Bàn'})
              </span>
            </h3>
            <span className="text-xs text-stone-400 italic">
              {t.drag_drop_hint}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tables.map((table) => {
              const badge = getHierarchyBadge(table.hierarchy_tag);
              const IconComp = badge.icon;
              const assignedGuests = table.guests || [];
              const isFull = assignedGuests.length >= table.capacity;
              const isOverflown = assignedGuests.length > table.capacity;

              return (
                <div
                  key={table.id}
                  className={`bg-white rounded-2xl p-4 border-2 transition-all shadow-xs flex flex-col justify-between ${
                    selectedGuestForMove
                      ? 'border-gold-400 ring-2 ring-gold-200 hover:border-crimson-600 cursor-pointer'
                      : isOverflown
                      ? 'border-red-400 bg-red-50/20'
                      : isFull
                      ? 'border-emerald-300'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                  onClick={() => {
                    if (selectedGuestForMove) {
                      handleAssignGuest(selectedGuestForMove.id, table.id);
                    }
                  }}
                >
                  <div>
                    {/* Table Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-stone-900 text-gold-300 font-bold text-xs flex items-center justify-center">
                            {table.table_number}
                          </span>
                          <h4 className="text-sm font-bold text-stone-900 font-serif line-clamp-1">
                            {table.name}
                          </h4>
                        </div>
                        <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}">
                          <IconComp className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(table.id);
                        }}
                        className="text-stone-300 hover:text-red-500 p-1 transition-colors"
                        title="Delete table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 mb-3">
                      <div className="flex justify-between text-[11px] font-medium text-stone-500 mb-1">
                        <span>{table.capacity} {lang === 'en' ? 'Max Seats' : 'Chỗ Tối Đa'}</span>
                        <span className={`font-bold ${isFull ? 'text-emerald-700' : 'text-stone-700'}`}>
                          {assignedGuests.length} / {table.capacity} {t.seats_filled}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverflown
                              ? 'bg-red-500'
                              : isFull
                              ? 'bg-emerald-600'
                              : 'bg-gold-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (assignedGuests.length / table.capacity) * 100)}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Seated Guests List */}
                    <div className="space-y-1.5 min-h-[90px]">
                      {assignedGuests.length === 0 ? (
                        <div className="h-full flex items-center justify-center py-6 text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                          {lang === 'en' ? 'Empty Table (10 open seats)' : 'Bàn trống (10 chỗ)'}
                        </div>
                      ) : (
                        assignedGuests.map((guest, idx) => (
                          <div
                            key={guest.id}
                            className="p-1.5 px-2 bg-stone-50 rounded-lg text-xs flex items-center justify-between group hover:bg-stone-100"
                          >
                            <span className="text-stone-800 font-medium truncate max-w-[140px]">
                              {idx + 1}. {guest.first_name} {guest.last_name}
                            </span>
                            <div className="flex items-center gap-1">
                              {guest.dietary_restrictions.length > 0 && (
                                <span className="w-2 h-2 rounded-full bg-amber-500" title={`Allergies: ${guest.dietary_restrictions.join(', ')}`} />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGuestForMove(guest);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-crimson-800 transition-opacity"
                                title="Move guest"
                              >
                                <MoveRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {selectedGuestForMove && (
                    <button
                      type="button"
                      className="mt-3 w-full py-1.5 rounded-lg bg-gold-100 hover:bg-gold-200 text-gold-900 text-xs font-bold transition-colors"
                    >
                      {lang === 'en' ? 'Seat Here' : 'Xếp Vào Bàn Này'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Unassigned Confirmed Guests Pool */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 text-base">
              {t.unassigned_guests}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
              {unassignedConfirmed.length}
            </span>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'en' ? 'Search guest name...' : 'Tìm tên khách...'}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700"
              />
            </div>

            <select
              value={hierarchyFilter}
              onChange={(e) => setHierarchyFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
            >
              <option value="all">{lang === 'en' ? 'All Relationships' : 'Tất cả đối tượng'}</option>
              <option value="vip_family">{t.rel_vip}</option>
              <option value="extended_relatives">{t.rel_relatives}</option>
              <option value="friends_bar">{t.rel_friends}</option>
              <option value="general">{t.rel_general}</option>
            </select>
          </div>

          {/* Guest Pool List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredUnassigned.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-400">
                {unassignedConfirmed.length === 0
                  ? (lang === 'en' ? '🎉 All confirmed guests are seated!' : '🎉 Tất cả khách đã được sắp bàn!')
                  : (lang === 'en' ? 'No matching unseated guests' : 'Không có khách phù hợp')}
              </div>
            ) : (
              filteredUnassigned.map((guest) => {
                const badge = getHierarchyBadge(guest.relationship_tag);
                const isSelected = selectedGuestForMove?.id === guest.id;

                return (
                  <div
                    key={guest.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-crimson-800 bg-crimson-50'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-900">
                        {guest.first_name} {guest.last_name}
                      </p>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedGuestForMove(isSelected ? null : guest)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-crimson-800 text-white'
                          : 'bg-white border border-stone-300 hover:border-gold-500 text-stone-700'
                      }`}
                    >
                      {isSelected ? (lang === 'en' ? 'Selected' : 'Đang chọn') : (lang === 'en' ? 'Seat' : 'Xếp bàn')}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

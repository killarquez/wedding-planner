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
  Building,
  Printer,
  Wine,
  MapPin,
  Footprints,
  Compass,
  ArrowRight,
  Music,
  Heart,
  ShieldAlert,
  Info
} from 'lucide-react';

interface Props {
  lang: Language;
  tables: Table[];
  guests: Guest[];
  banquetMath: any;
  onRefresh: () => void;
}

export const TableSeatingHub: React.FC<Props> = ({
  lang,
  tables,
  guests,
  banquetMath,
  onRefresh
}) => {
  const t = translations[lang];

  // View state: 'floorplan' | 'route' | 'cards'
  const [viewMode, setViewMode] = useState<'floorplan' | 'route' | 'cards'>('floorplan');
  const [searchTerm, setSearchTerm] = useState('');
  const [hierarchyFilter, setHierarchyFilter] = useState<string>('all');
  const [selectedGuestForMove, setSelectedGuestForMove] = useState<Guest | null>(null);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
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
          badgeBg: 'bg-crimson-800 text-gold-300',
          icon: Shield
        };
      case 'extended_relatives':
        return {
          label: lang === 'en' ? 'Extended Relatives' : 'Họ Hàng Nội Ngoại',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          badgeBg: 'bg-amber-700 text-white',
          icon: Building
        };
      case 'friends_bar':
        return {
          label: lang === 'en' ? 'Friends (Near Bar)' : 'Bạn Bè (Gần Quầy Bar)',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          badgeBg: 'bg-emerald-700 text-white',
          icon: GlassWater
        };
      default:
        return {
          label: lang === 'en' ? 'General Banquet' : 'Bàn Chung',
          bg: 'bg-stone-100 text-stone-800 border-stone-300',
          badgeBg: 'bg-stone-700 text-white',
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

  // Chào Bàn Walking Route Sequence Definitions
  const chaoBanStations = [
    {
      step: 1,
      tableNumber: 1,
      titleEn: 'Table 1: Trưởng Bối & VIP Family (Stage-Front Left)',
      titleVi: 'Bàn 1: Trưởng Bối Nhà Gái & Ông Bà Ngoại (Sát Sân Khấu Trái)',
      protocolEn: 'Traditional Cognac toast, bowing to Grandmother & Uncle Hai, receiving elders blessings and marriage advice.',
      protocolVi: 'Nghi thức dâng rượu mừng Bà Ngoại & Bác Hai, cúi đầu nhận lời chúc phúc và dặn dò của bậc trưởng thượng.',
      toastSpirit: 'Hennessy XO (Bottle #1)',
      duration: '7 mins',
      recipients: 'Bà Ngoại, Bác Hai Nguyen, VIP Elders'
    },
    {
      step: 2,
      tableNumber: 2,
      titleEn: 'Table 2: Rossi Family & Godparents (Stage-Front Right)',
      titleVi: 'Bàn 2: Gia Đình Rossi & Ba Mẹ Chú Rể (Sát Sân Khấu Phải)',
      protocolEn: 'Bilingual Italian-Vietnamese celebratory toast with Alfredo’s parents (Roberto & Maria), welcoming Trang to the Rossi family.',
      protocolVi: 'Nâng ly chúc mừng song ngữ Ý - Việt cùng Ba Mẹ Alfredo (Roberto & Maria), đón chào nàng dâu mới Trang.',
      toastSpirit: 'Hennessy XO (Bottle #2)',
      duration: '6 mins',
      recipients: 'Roberto & Maria Rossi, Godparents'
    },
    {
      step: 3,
      tableNumber: 3,
      titleEn: 'Table 3: Extended Relatives - Cô, Dì, Chú, Bác',
      titleVi: 'Bàn 3: Họ Hàng Nhà Gái - Cô, Dì, Chú, Bác',
      protocolEn: 'Table toast with aunts and uncles, collecting Bao Lì Xì (red envelopes), joyous laughter and commemorative table photo.',
      protocolVi: 'Chào rượu các cô chú bác, nhận phong bao đỏ may mắn, chụp ảnh kỷ niệm ấm cúng cùng họ hàng.',
      toastSpirit: 'Hennessy XO (Bottle #3)',
      duration: '6 mins',
      recipients: 'Cô Sáu, Chú Bảy Tran, Relatives'
    },
    {
      step: 4,
      tableNumber: 4,
      titleEn: 'Table 4: Cousins & Extended Relatives',
      titleVi: 'Bàn 4: Anh Chị Em Họ & Gia Đình Thân Thuộc',
      protocolEn: 'High-energy toasts with cousins, teasing the groom, and collecting wedding blessings.',
      protocolVi: 'Nâng ly rôm rả cùng anh chị em họ, trêu đùa cô dâu chú rể và trao gửi lời chúc trăm năm hạnh phúc.',
      toastSpirit: 'Hennessy XO (Bottle #4)',
      duration: '5 mins',
      recipients: 'Anh Tuấn & Chị Mai Le, Cousins'
    },
    {
      step: 5,
      tableNumber: 5,
      titleEn: 'Table 5: Tech & Creative Friends (Near Open Bar)',
      titleVi: 'Bàn 5: Bạn Bè Công Nghệ & Sáng Tạo (Gần Quầy Bar)',
      protocolEn: 'Rousing "Một, Hai, Ba, Dô!" toast chants, Cognac shots, and DJ Danny K upbeat music transition.',
      protocolVi: 'Hô vang "Một, Hai, Ba, Dô!", cạn ly mừng đôi bạn trẻ và kết nối cùng âm nhạc DJ Danny K.',
      toastSpirit: 'Hennessy XO (Bottle #5)',
      duration: '6 mins',
      recipients: 'David Miller, Kevin Vo & Creative Crew'
    },
    {
      step: 6,
      tableNumber: 6,
      titleEn: 'Table 6: College & High School Alumni Crew',
      titleVi: 'Bàn 6: Hội Bạn Đại Học & Phổ Thông',
      protocolEn: 'College stories, energetic table cheers, selfie photos with Trang & Alfredo.',
      protocolVi: 'Ôn lại kỷ niệm thời sinh viên, nâng ly chúc mừng nhiệt huyết và chụp ảnh selfie cùng cô dâu chú rể.',
      toastSpirit: 'Hennessy XO (Bottle #6)',
      duration: '5 mins',
      recipients: 'Alumni Friends & Classmates'
    },
    {
      step: 7,
      tableNumber: 7,
      titleEn: 'Table 7: Sports League & Bowling Teammates',
      titleVi: 'Bàn 7: Đồng Đội Thể Thao & Bowling League',
      protocolEn: 'Competitive cheers, camaraderie toasts, and gearing up for the dance floor.',
      protocolVi: 'Chúc mừng phong cách thể thao sôi nổi, khuấy động tinh thần chuẩn bị cho sàn khiêu vũ.',
      toastSpirit: 'Hennessy XO (Bottle #7)',
      duration: '5 mins',
      recipients: 'Carlos & Elena Gomez, Sports League'
    },
    {
      step: 8,
      tableNumber: 8,
      titleEn: 'Table 8: Open Banquet Table & Transition to Dance Floor',
      titleVi: 'Bàn 8: Bàn Mở / Khách Mời & Chuyển Tiếp Sang Sàn Khiêu Vũ',
      protocolEn: 'Final table toast, thanking banquet attendees, followed by grand transition to Dance Floor for First Dance & La Hora Loca!',
      protocolVi: 'Nâng ly trọn vẹn kết thúc vòng Chào Bàn, dẫn dắt toàn thể khách mời tiến ra sàn khiêu vũ bắt đầu La Hora Loca!',
      toastSpirit: 'Hennessy XO (Bottle #8) / Champagne Toast',
      duration: '6 mins',
      recipients: 'General Guests & Transition to Stage'
    }
  ];

  // Helper to render round table with 10 circumference seat pips
  const renderRoundTable = (table: Table) => {
    const assignedGuests = table.guests || [];
    const badge = getHierarchyBadge(table.hierarchy_tag);
    const isFull = assignedGuests.length >= table.capacity;
    const isHovered = hoveredTableId === table.id;
    const isTarget = selectedGuestForMove !== null;
    const hasDietary = assignedGuests.some(g => g.dietary_restrictions?.length > 0 || g.dietary_notes);

    // Generate 10 radial seat positions
    const seats = Array.from({ length: 10 }, (_, i) => {
      const angle = (i * 36 - 90) * (Math.PI / 180); // start at top (12 o'clock)
      const radius = 62; // px from center
      const x = Math.round(80 + radius * Math.cos(angle));
      const y = Math.round(80 + radius * Math.sin(angle));
      const guest = assignedGuests[i] || null;
      return { seatNumber: i + 1, x, y, guest };
    });

    return (
      <div
        key={table.id}
        onMouseEnter={() => setHoveredTableId(table.id)}
        onMouseLeave={() => setHoveredTableId(null)}
        onClick={() => {
          if (selectedGuestForMove) {
            handleAssignGuest(selectedGuestForMove.id, table.id);
          }
        }}
        className={`relative p-4 rounded-3xl border-2 transition-all bg-white shadow-xs flex flex-col items-center justify-between ${
          isTarget
            ? 'border-gold-400 ring-4 ring-gold-200 hover:border-crimson-600 hover:bg-gold-50/40 cursor-pointer'
            : isHovered
            ? 'border-gold-400 shadow-md'
            : isFull
            ? 'border-emerald-300'
            : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        {/* Table Tag Badge & Allergen Alert */}
        <div className="w-full flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg}`}>
            Bàn {table.table_number}
          </span>
          <div className="flex items-center gap-1">
            {hasDietary && (
              <span
                className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold"
                title="Table has guests with dietary restrictions/allergies"
              >
                !
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTable(table.id);
              }}
              className="text-stone-300 hover:text-red-500 p-0.5 transition-colors"
              title="Delete table"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 10-Top Circular Diagram */}
        <div className="relative w-[160px] h-[160px] my-1">
          {/* Central Round Table Surface */}
          <div className="absolute inset-0 m-auto w-[82px] h-[82px] rounded-full bg-gradient-to-br from-stone-900 to-stone-850 text-gold-300 border-2 border-gold-400 flex flex-col items-center justify-center text-center p-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300">
              Table {table.table_number}
            </span>
            <span className="text-sm font-bold font-serif text-gold-200">
              {assignedGuests.length}/{table.capacity}
            </span>
            <span className="text-[8px] text-stone-400">
              {assignedGuests.length === 10 ? 'Full' : `${10 - assignedGuests.length} open`}
            </span>
          </div>

          {/* 10 Circumferential Seats */}
          {seats.map((s) => {
            const hasGuest = !!s.guest;
            const isGuestAllergic = hasGuest && s.guest.dietary_restrictions?.length > 0;
            const initials = hasGuest
              ? `${s.guest.first_name[0] || ''}${s.guest.last_name[0] || ''}`.toUpperCase()
              : `${s.seatNumber}`;

            return (
              <div
                key={s.seatNumber}
                style={{ left: `${s.x - 12}px`, top: `${s.y - 12}px` }}
                title={
                  hasGuest
                    ? `${s.seatNumber}. ${s.guest.first_name} ${s.guest.last_name}${isGuestAllergic ? ` (Dietary: ${s.guest.dietary_restrictions.join(', ')})` : ''}`
                    : `Seat ${s.seatNumber}: Open`
                }
                className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-transform cursor-pointer hover:scale-125 ${
                  hasGuest
                    ? isGuestAllergic
                      ? 'bg-amber-500 text-white shadow-2xs border border-amber-300 ring-1 ring-amber-300'
                      : 'bg-crimson-800 text-gold-200 shadow-2xs border border-gold-300'
                    : 'bg-stone-100 text-stone-400 border border-dashed border-stone-300 hover:bg-gold-100 hover:text-gold-900'
                }`}
              >
                {initials}
              </div>
            );
          })}
        </div>

        {/* Table Title & Seated Preview */}
        <div className="w-full text-center mt-2 border-t border-stone-100 pt-2">
          <h4 className="text-xs font-bold font-serif text-stone-900 line-clamp-1">
            {table.name}
          </h4>
          <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
            {assignedGuests.length > 0
              ? assignedGuests.map(g => g.first_name).slice(0, 3).join(', ') + (assignedGuests.length > 3 ? '...' : '')
              : (lang === 'en' ? 'Empty 10-top round table' : 'Bàn trống 10 chỗ')}
          </p>
        </div>

        {/* Quick Assign Action if guest selected */}
        {selectedGuestForMove && (
          <button
            type="button"
            className="mt-2 w-full py-1 rounded-lg bg-gold-100 hover:bg-gold-200 text-gold-900 text-xs font-bold transition-colors"
          >
            {lang === 'en' ? 'Seat Here' : 'Xếp Vào Bàn Này'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
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

      {/* 2. Banquet Multiplier Math & Control Bar */}
      <div className="bg-gradient-to-br from-gold-50 via-white to-gold-100/50 p-6 sm:p-7 rounded-3xl border-2 border-gold-300/80 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gold-200/80 pb-5">
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
                  ? `Formula: ⌈Confirmed Headcount (${confirmed}) / 10-Top Tables⌉ = ${banquetMath.required_10_top_tables} Tables Required`
                  : `Công thức: ⌈Khách xác nhận (${confirmed}) / Bàn 10 người⌉ = Cần đặt ${banquetMath.required_10_top_tables} Bàn`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoAssign}
              disabled={loadingAction || unassignedConfirmed.length === 0}
              className="px-4 py-2 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-gold-300" />
              <span>{t.assign_all_auto}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddingTable(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 hover:border-gold-400 text-stone-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-stone-600" />
              <span>{t.add_table_btn}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-gold-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Print Seating Chart for greeters & ushers"
            >
              <Printer className="w-4 h-4" />
              <span>{t.print_seating_chart}</span>
            </button>
          </div>
        </div>

        {/* Multiplier KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-white/90 p-3.5 rounded-2xl border border-gold-200">
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

          <div className="bg-white/90 p-3.5 rounded-2xl border border-gold-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              {t.seats_open}
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-gold-700">
              {banquetMath.empty_seats_in_active_tables}
            </span>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              {lang === 'en' ? 'buffer seats ready' : 'ghế dự phòng sẵn sàng'}
            </span>
          </div>

          <div className="bg-white/90 p-3.5 rounded-2xl border border-gold-200">
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

          <div className="bg-white/90 p-3.5 rounded-2xl border border-gold-200">
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

      {/* 3. View Switcher Bar (Floorplan | Chào Bàn Route | Cards) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('floorplan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'floorplan'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t.view_floorplan}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('route')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'route'
                ? 'bg-stone-900 text-gold-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Footprints className="w-4 h-4 text-gold-400" />
            <span>{t.view_chao_ban_route}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-stone-900 text-gold-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.view_table_cards}</span>
          </button>
        </div>

        <span className="text-xs text-stone-500 font-medium px-2">
          {lang === 'en' ? 'Grand Harbor Restaurant • 10-Top Round Layout' : 'Nhà Hàng Grand Harbor • Bàn Tròn 10 Chỗ'}
        </span>
      </div>

      {/* 4. Active Move Guest Selector Alert (if guest selected) */}
      {selectedGuestForMove && (
        <div className="p-4 bg-crimson-50 border-2 border-crimson-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-crimson-800" />
            <div>
              <span className="text-sm font-bold text-crimson-950 block">
                {lang === 'en' ? 'Active Selected Guest:' : 'Đang chọn khách:'} {selectedGuestForMove.first_name} {selectedGuestForMove.last_name}
              </span>
              <span className="text-xs text-stone-600">
                {lang === 'en'
                  ? 'Click any round table in the floorplan to seat them immediately.'
                  : 'Nhấn vào bất kỳ bàn tròn nào trên sơ đồ để xếp chỗ ngay lập tức.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAssignGuest(selectedGuestForMove.id, null)}
              className="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-800 text-xs font-bold hover:bg-stone-300 cursor-pointer"
            >
              {lang === 'en' ? 'Unseat (Return to Pool)' : 'Bỏ Xếp Chỗ'}
            </button>
            <button
              onClick={() => setSelectedGuestForMove(null)}
              className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              {lang === 'en' ? 'Cancel' : 'Đóng'}
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Seating Area: Mode Render + Unassigned Pool Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Floorplan / Chào Bàn Route / Table Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* A. Floorplan Architectural View */}
          {viewMode === 'floorplan' && (
            <div className="bg-stone-50/80 rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
              {/* Grand Stage & Sweetheart Table Header */}
              <div className="w-full bg-gradient-to-r from-crimson-900 via-crimson-800 to-crimson-900 text-gold-200 p-4 rounded-2xl text-center border-2 border-gold-400 shadow-sm relative overflow-hidden">
                <div className="absolute top-1 right-3 text-gold-400/30 text-xs font-serif font-bold uppercase tracking-widest">
                  Grand Stage
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[11px] uppercase tracking-widest font-bold text-gold-300">
                    {lang === 'en' ? '★ Main Wedding Stage & Golden Dragon Backdrop ★' : '★ Sân Khấu Chính & Phông Song Hỷ Long Phụng ★'}
                  </span>
                  <div className="mt-2 px-4 py-1 rounded-full bg-crimson-950/80 border border-gold-300/60 text-xs font-serif text-gold-200 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-crimson-400 fill-crimson-400" />
                    <span>Trang & Alfredo Sweetheart Table</span>
                  </div>
                </div>
              </div>

              {/* Stage-Front Row (Tables 1 & 2) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-crimson-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-crimson-700" />
                    {lang === 'en' ? 'Stage-Front VIP Row (Parents & Elders)' : 'Hàng 1 Sát Sân Khấu (Trưởng Bối & Cha Mẹ)'}
                  </span>
                  <span className="text-[11px] text-stone-500">10 seats / table</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tables.filter(t => t.table_number <= 2).map(renderRoundTable)}
                </div>
              </div>

              {/* Center Rows: Relatives (Tables 3 & 4) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-700" />
                    {lang === 'en' ? 'Center Rows (Extended Relatives & Cousins)' : 'Hàng Giữa (Họ Hàng Nội Ngoại & Anh Em Họ)'}
                  </span>
                  <span className="text-[11px] text-stone-500">10 seats / table</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tables.filter(t => t.table_number === 3 || t.table_number === 4).map(renderRoundTable)}
                </div>
              </div>

              {/* Hall Features: Bar & Dance Floor Flanking */}
              <div className="grid grid-cols-2 gap-4 py-1">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GlassWater className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold">Grand Harbor Bar (Open Bar & Corkage)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded font-mono">West Side</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-700" />
                    <span className="font-bold">Saigon Nights DJ & Dance Floor</span>
                  </div>
                  <span className="text-[10px] bg-purple-200/60 px-2 py-0.5 rounded font-mono">East Side</span>
                </div>
              </div>

              {/* Friends & Buffer Rows (Tables 5 to 8+) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-600" />
                    {lang === 'en' ? 'Friends, Alumni & Buffer Rows' : 'Hàng Bạn Bè, Đồng Nghiệp & Bàn Dự Phòng'}
                  </span>
                  <span className="text-[11px] text-stone-500">10 seats / table</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tables.filter(t => t.table_number >= 5).map(renderRoundTable)}
                </div>
              </div>

              {/* Entrance Footnote */}
              <div className="w-full text-center py-2 text-[11px] text-stone-400 border-t border-dashed border-stone-200 font-mono">
                ↓ Entrance & Reception Welcome Table (Temple City, CA) ↓
              </div>
            </div>
          )}

          {/* B. Chào Bàn (Table Toasting) Walking Route Mode */}
          {viewMode === 'route' && (
            <div className="space-y-6 animate-fade-in">
              {/* Cultural Route Strategy Header Banner */}
              <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-crimson-950 text-white p-6 sm:p-7 rounded-3xl border-2 border-gold-400 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-crimson-800 text-gold-300 flex items-center justify-center shadow-xs">
                      <Wine className="w-6 h-6 text-gold-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-stone-100">
                        {t.chao_ban_title}
                      </h3>
                      <p className="text-xs text-stone-300">
                        {t.chao_ban_desc}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/50 text-xs font-mono font-bold shrink-0">
                    {t.chao_ban_pacing}
                  </span>
                </div>

                {/* Toasting Entourage Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-800 text-xs">
                  <div className="p-3 bg-stone-850/80 rounded-2xl border border-stone-700">
                    <span className="font-bold text-gold-300 block mb-0.5">Trang & Alfredo</span>
                    <p className="text-stone-300 text-[11px]">
                      {lang === 'en' ? 'Leading the toast with special glasses, greeting each table personally.' : 'Nâng ly chúc mừng, gửi lời tri ân từng bàn.'}
                    </p>
                  </div>

                  <div className="p-3 bg-stone-850/80 rounded-2xl border border-stone-700">
                    <span className="font-bold text-gold-300 block mb-0.5">Groomsman (Hennessy Tray)</span>
                    <p className="text-stone-300 text-[11px]">
                      {lang === 'en' ? 'Carries Hennessy XO bottle & shot glasses, pours Cognac at each table.' : 'Cầm khay rượu Hennessy XO và rót rượu cho khách.'}
                    </p>
                  </div>

                  <div className="p-3 bg-stone-850/80 rounded-2xl border border-stone-700">
                    <span className="font-bold text-gold-300 block mb-0.5">Bridesmaid (Silk Pouch)</span>
                    <p className="text-stone-300 text-[11px]">
                      {lang === 'en' ? 'Safeguards traditional red silk Bao Lì Xì pouch for gift envelopes.' : 'Cầm túi gấm lụa nhận phong bao đỏ chúc phúc.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Station-by-Station Walking Steps Accordion / Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-crimson-800" />
                    <span>{lang === 'en' ? 'Ordered Table Walking Route Sequence (Station 1 → 8)' : 'Thứ Tự Đi Chào Bàn Chi Tiết (Từ Trạm 1 Đến 8)'}</span>
                  </h4>
                  <span className="text-xs text-stone-500 font-mono">Total: 8 Tables</span>
                </div>

                <div className="space-y-3">
                  {chaoBanStations.map((station) => (
                    <div
                      key={station.step}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 hover:border-gold-300 transition-all shadow-2xs space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-crimson-800 text-gold-200 font-bold text-xs flex items-center justify-center">
                            #{station.step}
                          </span>
                          <div>
                            <h5 className="text-sm font-bold font-serif text-stone-900">
                              {lang === 'en' ? station.titleEn : station.titleVi}
                            </h5>
                            <span className="text-[11px] text-stone-500">
                              Target: {station.recipients}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-900 border border-gold-300 text-[11px] font-bold flex items-center gap-1">
                            <Wine className="w-3 h-3 text-gold-700" />
                            <span>{station.toastSpirit}</span>
                          </span>
                          <span className="text-xs text-stone-400 font-mono">
                            ~{station.duration}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-700 leading-relaxed italic">
                        "{lang === 'en' ? station.protocolEn : station.protocolVi}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* C. Traditional Detailed Cards & Roster Grid View */}
          {viewMode === 'cards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  {lang === 'en' ? 'Banquet Floor Tables & Rosters' : 'Danh Sách Chi Tiết Từng Bàn'}
                  <span className="text-xs font-normal text-stone-500 ml-2">
                    ({tables.length} {lang === 'en' ? 'Tables' : 'Bàn'})
                  </span>
                </h3>
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
                            <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                              <IconComp className="w-3 h-3" />
                              <span>{badge.label}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTable(table.id);
                            }}
                            className="text-stone-300 hover:text-red-500 p-1 transition-colors cursor-pointer"
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
                                  {guest.dietary_restrictions?.length > 0 && (
                                    <span
                                      className="w-2 h-2 rounded-full bg-amber-500"
                                      title={`Allergies: ${guest.dietary_restrictions.join(', ')}`}
                                    />
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedGuestForMove(guest);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-crimson-800 transition-opacity cursor-pointer"
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
          )}
        </div>

        {/* Right Col: Unassigned Confirmed Guests Pool Sidebar */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4 h-fit sticky top-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 text-base">
              {t.unassigned_guests}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
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
              <option value="vip_family">{t.table_vip_tag}</option>
              <option value="extended_relatives">{t.table_relatives_tag}</option>
              <option value="friends_bar">{t.table_friends_tag}</option>
              <option value="general">General Banquet</option>
            </select>
          </div>

          {/* Guest Pool List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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

      {/* 6. Modal: Add New Table */}
      {isAddingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <form
            onSubmit={handleCreateTable}
            className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-gold-400 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900 font-serif">
                {lang === 'en' ? 'Create New 10-Top Banquet Table' : 'Thêm Bàn Tiệc 10 Chỗ Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingTable(false)}
                className="text-stone-400 hover:text-stone-700 p-1 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Table Name / Designation *
              </label>
              <input
                type="text"
                required
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="e.g. Bàn 9: University Friends & Coworkers"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Hierarchy / Placement Zone
              </label>
              <select
                value={newTableTag}
                onChange={(e) => setNewTableTag(e.target.value as TableHierarchy)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson-700"
              >
                <option value="vip_family">{t.table_vip_tag}</option>
                <option value="extended_relatives">{t.table_relatives_tag}</option>
                <option value="friends_bar">{t.table_friends_tag}</option>
                <option value="general">General Banquet</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsAddingTable(false)}
                className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingAction || !newTableName.trim()}
                className="px-5 py-2 bg-crimson-800 text-white rounded-xl text-xs font-bold hover:bg-crimson-900 shadow-xs cursor-pointer"
              >
                {lang === 'en' ? 'Create Table' : 'Tạo Bàn'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

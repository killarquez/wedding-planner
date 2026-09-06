'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Language, translations } from '@/lib/i18n';
import { WeddingSettings, WeddingCategorySetup } from '@/lib/types';
import { defaultWeddingSettings } from '@/lib/seedData';
import {
  SlidersHorizontal,
  CheckCircle2,
  DollarSign,
  Users,
  Building2,
  Wine,
  Camera,
  Music,
  Sparkles,
  Heart,
  Save,
  RotateCcw,
  Calendar,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Percent
} from 'lucide-react';

interface Props {
  lang: Language;
  onRefresh: () => void;
  onNavigateToBudget?: () => void;
}

export const WeddingSetupWizard: React.FC<Props> = ({
  lang,
  onRefresh,
  onNavigateToBudget
}) => {
  const [settings, setSettings] = useState<WeddingSettings>(defaultWeddingSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch current setup
  useEffect(() => {
    const fetchSetup = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/setup');
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      } catch (e) {
        console.error('Error fetching setup:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSetup();
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Update specific category field
  const handleCategoryChange = (
    catKey: keyof WeddingSettings['categories'],
    field: keyof WeddingCategorySetup,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [catKey]: {
          ...prev.categories[catKey],
          [field]: field === 'estimated_cost' || field === 'deposit_paid' || field === 'hennessy_bottles'
            ? Number(value || 0)
            : value
        }
      }
    }));
  };

  // Live real-time calculations
  const totalEstimated = useMemo(() => {
    return Object.values(settings.categories).reduce(
      (sum, cat) => sum + Number(cat.estimated_cost || 0),
      0
    );
  }, [settings.categories]);

  const totalDeposits = useMemo(() => {
    return Object.values(settings.categories).reduce(
      (sum, cat) => sum + Number(cat.deposit_paid || 0),
      0
    );
  }, [settings.categories]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, totalEstimated - totalDeposits);
  }, [totalEstimated, totalDeposits]);

  const budgetDelta = useMemo(() => {
    return Number(settings.target_budget_cap || 0) - totalEstimated;
  }, [settings.target_budget_cap, totalEstimated]);

  // Save Setup
  const handleSaveSetup = async () => {
    setSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save setup');

      setSaveSuccess(true);
      onRefresh();
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Pre-fill realistic estimates
  const handlePreFillTemplate = () => {
    if (!confirm(lang === 'en' ? 'Load realistic template estimates for Grand Harbor banquet and vendors?' : 'Tải ước tính mẫu thực tế cho tiệc cưới Grand Harbor?')) return;
    setSettings(prev => ({
      ...prev,
      target_budget_cap: 35000,
      target_guest_count: 100,
      target_table_count: 10,
      categories: {
        venue_banquet: {
          estimated_cost: 14500,
          deposit_paid: 5000,
          vendor_name: 'Grand Harbor Restaurant',
          payment_due_date: '2026-12-01',
          notes: '8-Course Grand Asian Banquet (10 Tables @ $1,350/table + tax & service)'
        },
        host_beverages_corkage: {
          estimated_cost: 3800,
          deposit_paid: 1200,
          vendor_name: 'Wholesale Spirits & Grand Harbor Corkage',
          payment_due_date: '2026-12-10',
          hennessy_bottles: 10,
          notes: '10 Bottles Hennessy XO for Chào Bàn table toasts, Cabernet & corkage'
        },
        attire: {
          estimated_cost: 3200,
          deposit_paid: 1500,
          vendor_name: 'Áo Dài Ninh Khương & Men’s Wearhouse',
          payment_due_date: '2026-11-15',
          notes: 'Custom bride & groom silk Áo Dài with gold thread embroidery, tuxedo & veil'
        },
        photography_video: {
          estimated_cost: 4200,
          deposit_paid: 1500,
          vendor_name: 'Cinema Lumiere Wedding Studio',
          payment_due_date: '2026-12-05',
          notes: 'Full day coverage (Tea Ceremony + Banquet), drone & 4K cinematic highlight reel'
        },
        stage_av_dj: {
          estimated_cost: 2600,
          deposit_paid: 800,
          vendor_name: 'Saigon Nights DJ & Bilingual MC',
          payment_due_date: '2026-12-01',
          notes: 'Bilingual English/Vietnamese MC, sound system, wireless mics & dance lights'
        },
        decor_floral: {
          estimated_cost: 3500,
          deposit_paid: 1000,
          vendor_name: 'Lotus Blossom Floral & Decor',
          payment_due_date: '2026-12-05',
          notes: 'Red & gold floral arch, lanterns, tea ceremony backdrop & 10 banquet centerpieces'
        },
        gifts_favors: {
          estimated_cost: 1200,
          deposit_paid: 400,
          vendor_name: 'Double Happiness Favors & Bao Lì Xì',
          payment_due_date: '2026-11-20',
          notes: 'Custom red envelopes for tea ceremony, Vietnamese tea favors & boxes'
        },
        misc: {
          estimated_cost: 2000,
          deposit_paid: 0,
          vendor_name: 'Emergency Buffer & Rehearsal Lunch',
          payment_due_date: '2026-12-20',
          notes: 'Marriage license, cash tip envelopes, parking validation & unforeseen buffer'
        }
      }
    }));
  };

  // Reset to empty blank questionnaire
  const handleResetBlank = () => {
    if (!confirm(lang === 'en' ? 'Reset all questionnaire amounts to $0?' : 'Đặt lại toàn bộ số tiền về 0$?')) return;
    setSettings(defaultWeddingSettings);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
        <div className="w-8 h-8 border-3 border-crimson-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-stone-500 font-medium">Loading wedding setup questionnaire...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-crimson-950 text-white p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-crimson-800 text-gold-300 font-serif font-bold flex items-center justify-center text-2xl border-2 border-gold-400 shadow-sm shrink-0">
              囍
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                  {lang === 'en' ? 'Master Wedding Setup & Questionnaire' : 'Thiết Lập & Khảo Sát Kế Hoạch Tiệc Cưới'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                  settings.setup_completed
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}>
                  {settings.setup_completed ? (lang === 'en' ? 'Synchronized' : 'Đã Đồng Bộ') : (lang === 'en' ? 'Pending Setup' : 'Chưa Cài Đặt')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                {lang === 'en'
                  ? 'Fill this questionnaire out together to establish your true target budget, headcount, banquet tables, and major vendor commitments. Saving will instantly populate your live Budget Ledger!'
                  : 'Cùng nhau hoàn thành bảng khảo sát này để thiết lập hạn mức ngân sách thực tế, số lượng khách, bàn tiệc và các nhà cung cấp chính. Dữ liệu sẽ lập tức được đồng bộ sang Bảng Quản Lý Ngân Sách!'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePreFillTemplate}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition-colors cursor-pointer"
              title="Load realistic sample estimates"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>{lang === 'en' ? 'Sample Template' : 'Tải Mẫu Gợi Ý'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetBlank}
              className="px-3 py-2 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-medium flex items-center gap-1.5 border border-stone-700 transition-colors cursor-pointer"
              title="Reset amounts to 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Reset Blank' : 'Xoá Trắng'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Master Targets & Parameters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-crimson-800" />
          <span>{lang === 'en' ? 'Step 1: Core Wedding Targets & Venue Specs' : 'Bước 1: Chỉ Số Mục Tiêu & Thông Tin Sảnh Tiệc'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Target Budget Cap */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-crimson-700" />
              <span>{lang === 'en' ? 'Target Budget Cap ($)' : 'Hạn Mức Ngân Sách Tối Đa ($)'}</span>
            </label>
            <input
              type="number"
              step="500"
              value={settings.target_budget_cap || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, target_budget_cap: Number(e.target.value || 0) }))}
              placeholder="e.g. 35000"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold font-mono focus:ring-2 focus:ring-crimson-700 focus:outline-none bg-white"
            />
            <span className="text-[10px] text-stone-500 mt-1 block">
              {lang === 'en' ? 'Your hard spending limit' : 'Giới hạn chi tiêu tối đa'}
            </span>
          </div>

          {/* Expected Headcount */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-700" />
              <span>{lang === 'en' ? 'Target Guest Headcount' : 'Tổng Số Khách Dự Kiến'}</span>
            </label>
            <input
              type="number"
              value={settings.target_guest_count || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, target_guest_count: Number(e.target.value || 0) }))}
              placeholder="e.g. 100"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold font-mono focus:ring-2 focus:ring-crimson-700 focus:outline-none bg-white"
            />
            <span className="text-[10px] text-stone-500 mt-1 block">
              {lang === 'en' ? 'Used for seating & catering' : 'Dùng tính định lượng yến tiệc'}
            </span>
          </div>

          {/* Banquet Tables Count */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-gold-700" />
              <span>{lang === 'en' ? '10-Top Tables Planned' : 'Số Lượng Bàn 10 Người'}</span>
            </label>
            <input
              type="number"
              value={settings.target_table_count || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, target_table_count: Number(e.target.value || 0) }))}
              placeholder="e.g. 10"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold font-mono focus:ring-2 focus:ring-crimson-700 focus:outline-none bg-white"
            />
            <span className="text-[10px] text-stone-500 mt-1 block">
              {lang === 'en' ? `${(settings.target_table_count || 10) * 10} total seats capacity` : `${(settings.target_table_count || 10) * 10} chỗ ngồi tối đa`}
            </span>
          </div>

          {/* Venue & Date */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'en' ? 'Date & Venue' : 'Ngày & Địa Điểm'}</span>
            </label>
            <div className="text-xs font-semibold text-stone-900 truncate">
              {settings.venue_name}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Sunday, Dec 20, 2026 • Temple City
            </div>
          </div>
        </div>
      </div>

      {/* 3. The 8 Vendor Pillars Questionnaire */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-crimson-800" />
              <span>{lang === 'en' ? 'Step 2: Vendor Commitments & Expense Allocations' : 'Bước 2: Dự Toán Chi Tiết Các Hạng Mục & Nhà Cung Cấp'}</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {lang === 'en'
                ? 'Enter your estimated costs and any deposits paid so far. Leave at $0 if not applicable.'
                : 'Nhập chi phí dự toán và tiền cọc đã thanh toán (nếu có). Để 0$ nếu chưa chốt.'}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-crimson-800 bg-crimson-50 px-3 py-1 rounded-xl border border-crimson-200">
            {lang === 'en' ? '8 Master Categories' : '8 Hạng Mục Chính'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Banquet Food */}
          <div className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    {lang === 'en' ? 'Grand Asian Banquet (8-10 Courses)' : 'Yến Tiệc 8-10 Món Grand Harbor'}
                  </h4>
                  <span className="text-[10px] text-stone-500">Venue & Dining Contract</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  {lang === 'en' ? 'Estimated Cost ($)' : 'Tổng Dự Toán ($)'}
                </label>
                <input
                  type="number"
                  value={settings.categories.venue_banquet.estimated_cost || ''}
                  onChange={(e) => handleCategoryChange('venue_banquet', 'estimated_cost', e.target.value)}
                  placeholder="e.g. 14000"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  {lang === 'en' ? 'Deposit Paid So Far ($)' : 'Tiền Cọc Đã Đóng ($)'}
                </label>
                <input
                  type="number"
                  value={settings.categories.venue_banquet.deposit_paid || ''}
                  onChange={(e) => handleCategoryChange('venue_banquet', 'deposit_paid', e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white text-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Vendor / Restaurant</label>
                <input
                  type="text"
                  value={settings.categories.venue_banquet.vendor_name}
                  onChange={(e) => handleCategoryChange('venue_banquet', 'vendor_name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Final Due Date</label>
                <input
                  type="date"
                  value={settings.categories.venue_banquet.payment_due_date}
                  onChange={(e) => handleCategoryChange('venue_banquet', 'payment_due_date', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Menu Notes</label>
              <input
                type="text"
                value={settings.categories.venue_banquet.notes || ''}
                onChange={(e) => handleCategoryChange('venue_banquet', 'notes', e.target.value)}
                placeholder="e.g. Lobster noodles, steamed seabass, Peking duck, dessert"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
              />
            </div>
          </div>

          {/* Pillar 2: Beverages & Chào Bàn Corkage */}
          <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    {lang === 'en' ? 'Host Bar, Wine & Hennessy XO Corkage' : 'Rượu Chào Bàn Hennessy XO & Phí Phục Vụ'}
                  </h4>
                  <span className="text-[10px] text-stone-500">Couple-Supplied Bar & Chào Bàn</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  {lang === 'en' ? 'Estimated Cost ($)' : 'Tổng Dự Toán ($)'}
                </label>
                <input
                  type="number"
                  value={settings.categories.host_beverages_corkage.estimated_cost || ''}
                  onChange={(e) => handleCategoryChange('host_beverages_corkage', 'estimated_cost', e.target.value)}
                  placeholder="e.g. 3500"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  {lang === 'en' ? 'Deposit / Paid So Far ($)' : 'Tiền Đã Mua / Cọc ($)'}
                </label>
                <input
                  type="number"
                  value={settings.categories.host_beverages_corkage.deposit_paid || ''}
                  onChange={(e) => handleCategoryChange('host_beverages_corkage', 'deposit_paid', e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white text-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Hennessy XO Bottles (Chào Bàn)</label>
                <input
                  type="number"
                  value={settings.categories.host_beverages_corkage.hennessy_bottles || 10}
                  onChange={(e) => handleCategoryChange('host_beverages_corkage', 'hennessy_bottles', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={settings.categories.host_beverages_corkage.payment_due_date}
                  onChange={(e) => handleCategoryChange('host_beverages_corkage', 'payment_due_date', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Bar Notes</label>
              <input
                type="text"
                value={settings.categories.host_beverages_corkage.notes || ''}
                onChange={(e) => handleCategoryChange('host_beverages_corkage', 'notes', e.target.value)}
                placeholder="e.g. Wholesale Cognac, Napa Cabernet, Prosecco & restaurant corkage fee"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
              />
            </div>
          </div>

          {/* Pillar 3: Attire & Áo Dài */}
          <div className="p-5 rounded-2xl border-2 border-rose-200 bg-rose-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    {lang === 'en' ? 'Custom Silk Áo Dài, Tuxedo & Gown' : 'Áo Dài Truyền Thống, Tuxedo & Váy Cưới'}
                  </h4>
                  <span className="text-[10px] text-stone-500">Ceremonial Attire & Alterations</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={settings.categories.attire.estimated_cost || ''}
                  onChange={(e) => handleCategoryChange('attire', 'estimated_cost', e.target.value)}
                  placeholder="e.g. 3000"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Deposit Paid ($)</label>
                <input
                  type="number"
                  value={settings.categories.attire.deposit_paid || ''}
                  onChange={(e) => handleCategoryChange('attire', 'deposit_paid', e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white text-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Boutique / Tailor</label>
                <input
                  type="text"
                  value={settings.categories.attire.vendor_name}
                  onChange={(e) => handleCategoryChange('attire', 'vendor_name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Pickup / Due Date</label>
                <input
                  type="date"
                  value={settings.categories.attire.payment_due_date}
                  onChange={(e) => handleCategoryChange('attire', 'payment_due_date', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Pillar 4: Photography & Videography */}
          <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    {lang === 'en' ? 'Photography & 4K Cinematic Video' : 'Nhiếp Ảnh & Phim Cưới 4K'}
                  </h4>
                  <span className="text-[10px] text-stone-500">Full-Day Capture & Highlight Reel</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={settings.categories.photography_video.estimated_cost || ''}
                  onChange={(e) => handleCategoryChange('photography_video', 'estimated_cost', e.target.value)}
                  placeholder="e.g. 4000"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Deposit Paid ($)</label>
                <input
                  type="number"
                  value={settings.categories.photography_video.deposit_paid || ''}
                  onChange={(e) => handleCategoryChange('photography_video', 'deposit_paid', e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white text-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Studio / Photographer</label>
                <input
                  type="text"
                  value={settings.categories.photography_video.vendor_name}
                  onChange={(e) => handleCategoryChange('photography_video', 'vendor_name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Final Balance Due Date</label>
                <input
                  type="date"
                  value={settings.categories.photography_video.payment_due_date}
                  onChange={(e) => handleCategoryChange('photography_video', 'payment_due_date', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Pillar 5: Stage AV, DJ & MC */}
          <div className="p-5 rounded-2xl border-2 border-purple-200 bg-purple-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                  5
                </span>
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    {lang === 'en' ? 'Bilingual MC, DJ & Stage Audio/Lighting' : 'MC Song Ngữ, DJ & Âm Thanh Ánh Sáng'}
                  </h4>
                  <span className="text-[10px] text-stone-500">Bilingual Program, Dancing & Hora Loca</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={settings.categories.stage_av_dj.estimated_cost || ''}
                  onChange={(e) => handleCategoryChange('stage_av_dj', 'estimated_cost', e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Deposit Paid ($)</label>
                <input
                  type="number"
                  value={settings.categories.stage_av_dj.deposit_paid || ''}
                  onChange={(e) => handleCategoryChange('stage_av_dj', 'deposit_paid', e.target.value)}
                  placeholder="e.g. 800"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white text-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">MC / DJ Vendor</label>
                <input
                  type="text"
                  value={settings.categories.stage_av_dj.vendor_name}
                  onChange={(e) => handleCategoryChange('stage_av_dj', 'vendor_name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={settings.categories.stage_av_dj.payment_due_date}
                  onChange={(e) => handleCategoryChange('stage_av_dj', 'payment_due_date', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Pillar 6: Floral & Decor */}
          <div className="p-5 rounded-2xl border-2 border-pink-200 bg-pink-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-pink-100 text-pink-800 flex items-center justify-center font-bold text-xs">
                  6
                </span>
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    {lang === 'en' ? 'Floral Arch, Backdrop & Table Centerpieces' : 'Hoa Tươi, Cổng Hoa & Trang Trí Bàn Tiệc'}
                  </h4>
                  <span className="text-[10px] text-stone-500">Red & Gold Stage Backdrop & Floral Design</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={settings.categories.decor_floral.estimated_cost || ''}
                  onChange={(e) => handleCategoryChange('decor_floral', 'estimated_cost', e.target.value)}
                  placeholder="e.g. 3500"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Deposit Paid ($)</label>
                <input
                  type="number"
                  value={settings.categories.decor_floral.deposit_paid || ''}
                  onChange={(e) => handleCategoryChange('decor_floral', 'deposit_paid', e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white text-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Florist / Decorator</label>
                <input
                  type="text"
                  value={settings.categories.decor_floral.vendor_name}
                  onChange={(e) => handleCategoryChange('decor_floral', 'vendor_name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={settings.categories.decor_floral.payment_due_date}
                  onChange={(e) => handleCategoryChange('decor_floral', 'payment_due_date', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Pillar 7: Favors & Tea Ceremony */}
          <div className="p-5 rounded-2xl border-2 border-red-200 bg-red-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs">
                  7
                </span>
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    {lang === 'en' ? 'Favors, Bao Lì Xì & Tea Ceremony Sets' : 'Phong Bao Lì Xì, Tráp Trà & Quà Cảm Ơn'}
                  </h4>
                  <span className="text-[10px] text-stone-500">Double Happiness Envelopes & Gifts</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={settings.categories.gifts_favors.estimated_cost || ''}
                  onChange={(e) => handleCategoryChange('gifts_favors', 'estimated_cost', e.target.value)}
                  placeholder="e.g. 1200"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Deposit / Spent ($)</label>
                <input
                  type="number"
                  value={settings.categories.gifts_favors.deposit_paid || ''}
                  onChange={(e) => handleCategoryChange('gifts_favors', 'deposit_paid', e.target.value)}
                  placeholder="e.g. 400"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white text-emerald-800"
                />
              </div>
            </div>
          </div>

          {/* Pillar 8: Emergency Contingency */}
          <div className="p-5 rounded-2xl border-2 border-stone-200 bg-stone-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-xs">
                  8
                </span>
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    {lang === 'en' ? 'Emergency Contingency & Rehearsal' : 'Quỹ Dự Phòng & Tiệc Thử / Tập Dượt'}
                  </h4>
                  <span className="text-[10px] text-stone-500">Unforeseen Expenses, Tips & Buffer</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Buffer Reserve ($)</label>
                <input
                  type="number"
                  value={settings.categories.misc.estimated_cost || ''}
                  onChange={(e) => handleCategoryChange('misc', 'estimated_cost', e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Spent So Far ($)</label>
                <input
                  type="number"
                  value={settings.categories.misc.deposit_paid || ''}
                  onChange={(e) => handleCategoryChange('misc', 'deposit_paid', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold font-mono bg-white text-emerald-800"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Real-Time Financial Summary Bar & Action Button */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-gold-400 shadow-lg space-y-6 sticky bottom-6 z-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Estimated</span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
                {formatMoney(totalEstimated)}
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                Cap: {formatMoney(settings.target_budget_cap || 0)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Deposits Paid</span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-emerald-800">
                {formatMoney(totalDeposits)}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                {totalEstimated > 0 ? `${Math.round((totalDeposits / totalEstimated) * 100)}% paid` : '0% paid'}
              </span>
            </div>

            <div className="p-3 bg-crimson-50 rounded-2xl border border-crimson-200">
              <span className="text-[10px] uppercase font-bold text-crimson-700 block">Balance Due</span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-crimson-800">
                {formatMoney(remainingBalance)}
              </span>
              <span className="text-[10px] text-crimson-600 block mt-0.5">Due before wedding</span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              budgetDelta >= 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
            }`}>
              <span className="text-[10px] uppercase font-bold block">
                {budgetDelta >= 0 ? 'Surplus Reserve' : 'Over Budget Cap'}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif">
                {formatMoney(Math.abs(budgetDelta))}
              </span>
              <span className="text-[10px] font-semibold block mt-0.5">
                {budgetDelta >= 0 ? 'Within budget limit' : 'Adjust vendor costs'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSaveSetup}
              disabled={saving}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-crimson-800 to-crimson-900 hover:from-crimson-700 hover:to-crimson-800 text-white font-serif font-bold text-sm shadow-md flex items-center justify-center gap-2 border border-gold-400 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : 'text-gold-300'}`} />
              <span>{saving ? 'Saving & Syncing...' : (lang === 'en' ? 'Save & Populate Budget Ledger' : 'Lưu & Đồng Bộ Bảng Ngân Sách')}</span>
            </button>

            {onNavigateToBudget && (
              <button
                type="button"
                onClick={onNavigateToBudget}
                className="px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-gold-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{lang === 'en' ? 'View Budget Ledger' : 'Xem Bảng Ngân Sách'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-2xl flex items-center gap-2 font-medium animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {lang === 'en'
                ? '✨ Master wedding setup and actual budget ledger entries have been successfully synchronized!'
                : '✨ Thông tin thiết lập và các khoản chi tiêu thực tế đã được đồng bộ thành công vào Bảng Ngân Sách!'}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-300 text-red-900 text-xs rounded-2xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

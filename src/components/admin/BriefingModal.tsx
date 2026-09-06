'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { DailyBriefing, Expense } from '@/lib/types';
import {
  X,
  Bot,
  Calendar,
  Layers,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  briefing: DailyBriefing | null;
}

export const BriefingModal: React.FC<Props> = ({ isOpen, onClose, lang, briefing }) => {
  if (!isOpen || !briefing) return null;

  const t = translations[lang];

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border-2 border-gold-400 relative max-h-[90vh] overflow-y-auto animate-slide-up space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-crimson-800 text-gold-300 flex items-center justify-center font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-xl text-stone-900">
                {lang === 'en' ? 'Daily Executive Briefing for Trang & Alfredo' : 'Báo Cáo Điều Hành Hàng Ngày - Trang & Alfredo'}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold-100 text-gold-900 uppercase">
                {briefing.date}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {lang === 'en'
                ? `T-${briefing.days_until_wedding} Days to Wedding Celebration (Dec 20, 2026)`
                : `Còn ${briefing.days_until_wedding} ngày nữa đến Dạ Tiệc Cưới (20/12/2026)`}
            </p>
          </div>
        </div>

        {/* Section 1: Headcount & 10-Top Banquet Math Delta */}
        <div className="p-4 rounded-2xl bg-gold-50/60 border border-gold-200 space-y-3">
          <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-gold-700" />
            <span>{lang === 'en' ? 'Headcount & 10-Top Banquet Math' : 'Quy Mô Khách & Hệ Số Bàn Tròn 10 Chỗ'}</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-gold-100">
              <span className="text-stone-400 block font-medium">Confirmed</span>
              <span className="text-xl font-bold font-serif text-emerald-800">
                {briefing.banquet_math.confirmed_headcount}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-gold-100">
              <span className="text-stone-400 block font-medium">Tables Needed</span>
              <span className="text-xl font-bold font-serif text-crimson-800">
                {briefing.banquet_math.required_10_top_tables}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-gold-100">
              <span className="text-stone-400 block font-medium">Buffer Seats</span>
              <span className="text-xl font-bold font-serif text-gold-700">
                {briefing.banquet_math.empty_seats}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-gold-100">
              <span className="text-stone-400 block font-medium">Pending Followups</span>
              <span className="text-xl font-bold font-serif text-amber-700">
                {briefing.rsvp_summary.pending}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Financial Alerts Due in 7 / 14 / 30 Days */}
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-crimson-700" />
            <span>{lang === 'en' ? 'Upcoming Invoices & Vendor Cashflow Alerts' : 'Cảnh Báo Hạn Thanh Toán Nhà Cung Cấp'}</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <p className="font-bold text-red-700 mb-1">Due ≤ 7 Days</p>
              {briefing.financial_alerts.due_within_7_days.length === 0 ? (
                <p className="text-stone-400 italic">None</p>
              ) : (
                briefing.financial_alerts.due_within_7_days.map((e: Expense) => (
                  <p key={e.id} className="font-medium text-stone-800">
                    {e.vendor_name}: {formatMoney(e.remaining_balance)}
                  </p>
                ))
              )}
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <p className="font-bold text-amber-700 mb-1">Due ≤ 14 Days</p>
              {briefing.financial_alerts.due_within_14_days.length === 0 ? (
                <p className="text-stone-400 italic">None</p>
              ) : (
                briefing.financial_alerts.due_within_14_days.map((e: Expense) => (
                  <p key={e.id} className="font-medium text-stone-800">
                    {e.vendor_name}: {formatMoney(e.remaining_balance)}
                  </p>
                ))
              )}
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <p className="font-bold text-gold-700 mb-1">Due ≤ 30 Days</p>
              {briefing.financial_alerts.due_within_30_days.length === 0 ? (
                <p className="text-stone-400 italic">None</p>
              ) : (
                briefing.financial_alerts.due_within_30_days.map((e: Expense) => (
                  <p key={e.id} className="font-medium text-stone-800">
                    {e.vendor_name}: {formatMoney(e.remaining_balance)}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Critical Sprint Milestones */}
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-700" />
            <span>{lang === 'en' ? 'Sprint Milestones on Deck' : 'Nhiệm Vụ Cần Xử Lý Trong Kỳ'}</span>
          </h4>
          <div className="space-y-2">
            {briefing.critical_milestones.upcoming_sprint.slice(0, 3).map((ms) => (
              <div key={ms.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                <span className="font-bold text-stone-800">
                  {lang === 'vi' ? ms.title_vi : ms.title_en}
                </span>
                <span className="font-mono text-stone-500">{ms.target_date} ({ms.assignee})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Recent Autonomous Agent Actions */}
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-500">
            {lang === 'en' ? 'Recent Autonomous Agent Actions' : 'Nhật Ký Tác Vụ Tự Động Gần Đây'}
          </h4>
          <div className="p-3 bg-stone-900 text-gold-300 rounded-xl font-mono text-[11px] space-y-1">
            {briefing.agent_actions_taken.map((action, i) => (
              <p key={i} className="truncate">▶ {action}</p>
            ))}
          </div>
        </div>

        {/* Close */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm transition-all"
          >
            {lang === 'en' ? 'Close Briefing' : 'Đóng Báo Cáo'}
          </button>
        </div>
      </div>
    </div>
  );
};

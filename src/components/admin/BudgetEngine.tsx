'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { Expense, ExpenseCategory, PaymentStatus } from '@/lib/types';
import {
  DollarSign,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  CreditCard,
  PieChart,
  Tag,
  Building2,
  Wine
} from 'lucide-react';

interface Props {
  lang: Language;
  expenses: Expense[];
  metrics: any;
  onRefresh: () => void;
}

export const BudgetEngine: React.FC<Props> = ({ lang, expenses, metrics, onRefresh }) => {
  const t = translations[lang];

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State for new expense
  const [category, setCategory] = useState<ExpenseCategory>('venue_banquet');
  const [vendorName, setVendorName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualInvoiced, setActualInvoiced] = useState('');
  const [depositPaid, setDepositPaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [notes, setNotes] = useState('');

  const categoryNames: Record<ExpenseCategory, string> = {
    venue_banquet: t.category_venue,
    host_beverages_corkage: t.category_drinks,
    attire: t.category_attire,
    stage_av_dj: t.category_av,
    decor_floral: t.category_decor,
    photography_video: t.category_photo,
    gifts_favors: t.category_gifts,
    misc: t.category_misc,
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = filterCategory === 'all' || e.category === filterCategory;
    const matchesStat = filterStatus === 'all' || e.payment_status === filterStatus;
    return matchesCat && matchesStat;
  });

  const handleToggleStatus = async (exp: Expense) => {
    setLoading(true);
    try {
      const nextStatus: PaymentStatus = exp.payment_status === 'paid' ? 'pending' : 'paid';
      const updates: Partial<Expense> = {
        payment_status: nextStatus,
        deposit_paid: nextStatus === 'paid' ? exp.actual_invoiced : exp.deposit_paid
      };

      await fetch('/api/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exp.id, ...updates })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Delete this expense item?' : 'Xoá khoản chi tiêu này?')) return;
    setLoading(true);
    try {
      await fetch(`/api/budget?id=${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        category,
        vendor_name: vendorName,
        item_description: itemDescription,
        estimated_cost: Number(estimatedCost || actualInvoiced || 0),
        actual_invoiced: Number(actualInvoiced || estimatedCost || 0),
        deposit_paid: Number(depositPaid || 0),
        payment_due_date: dueDate,
        payment_status: status,
        notes
      };

      await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Reset form
      setVendorName('');
      setItemDescription('');
      setEstimatedCost('');
      setActualInvoiced('');
      setDepositPaid('');
      setDueDate('');
      setNotes('');
      setIsAddingExpense(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-8">
      {/* 1. Summary Metrics & Liquidity Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{t.budget_total_budget}</span>
            <DollarSign className="w-4 h-4 text-stone-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
            {formatMoney(metrics.total_budget_estimated)}
          </p>
          <span className="text-[10px] text-stone-400 mt-1 block">
            {lang === 'en' ? 'Estimated target' : 'Dự toán ban đầu'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{t.budget_total_invoiced}</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-blue-900">
            {formatMoney(metrics.total_invoiced)}
          </p>
          <span className="text-[10px] text-blue-600 mt-1 block">
            {lang === 'en' ? 'Committed contracts' : 'Hợp đồng đã ký'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{t.budget_deposit_paid}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-emerald-800">
            {formatMoney(metrics.total_deposit_paid)}
          </p>
          <span className="text-[10px] text-emerald-600 mt-1 block">
            {lang === 'en' ? 'Liquid cash paid' : 'Tiền mặt đã cọc'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-crimson-200 shadow-xs">
          <div className="flex items-center justify-between text-crimson-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{t.budget_remaining_liquidity}</span>
            <AlertTriangle className="w-4 h-4 text-crimson-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-crimson-800">
            {formatMoney(metrics.remaining_balance_due)}
          </p>
          <span className="text-[10px] text-crimson-600 mt-1 block">
            {lang === 'en' ? 'Outstanding balance' : 'Còn nợ nhà cung cấp'}
          </span>
        </div>
      </div>

      {/* 2. Upcoming Payment Due Alerts (7 / 14 / 30 Days) */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-850 text-white p-6 rounded-3xl border border-stone-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-gold-400" />
            <h3 className="text-base font-bold font-serif text-stone-100">
              {t.budget_alerts_title}
            </h3>
          </div>
          <span className="text-xs text-gold-300 font-medium">
            {lang === 'en' ? 'Reference Date: Aug 30, 2026' : 'Mốc tính: 30/08/2026'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Due in 7 Days */}
          <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-400">{t.due_in_7}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono">
                {metrics.due_within_7_days?.length || 0}
              </span>
            </div>
            {metrics.due_within_7_days?.length === 0 ? (
              <p className="text-xs text-stone-400 italic">{lang === 'en' ? 'No urgent payments due' : 'Không có khoản nợ gấp'}</p>
            ) : (
              metrics.due_within_7_days.map((e: Expense) => (
                <div key={e.id} className="text-xs py-1 border-b border-stone-700 last:border-0 flex justify-between">
                  <span className="text-stone-300 truncate max-w-[140px]">{e.vendor_name}</span>
                  <span className="font-bold text-red-300">{formatMoney(e.remaining_balance)}</span>
                </div>
              ))
            )}
          </div>

          {/* Due in 14 Days */}
          <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400">{t.due_in_14}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">
                {metrics.due_within_14_days?.length || 0}
              </span>
            </div>
            {metrics.due_within_14_days?.length === 0 ? (
              <p className="text-xs text-stone-400 italic">{lang === 'en' ? 'No invoices in this window' : 'Không có hạn trong kỳ này'}</p>
            ) : (
              metrics.due_within_14_days.map((e: Expense) => (
                <div key={e.id} className="text-xs py-1 border-b border-stone-700 last:border-0 flex justify-between">
                  <span className="text-stone-300 truncate max-w-[140px]">{e.vendor_name}</span>
                  <span className="font-bold text-amber-300">{formatMoney(e.remaining_balance)}</span>
                </div>
              ))
            )}
          </div>

          {/* Due in 30 Days */}
          <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gold-300">{t.due_in_30}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gold-950 text-gold-300 font-mono">
                {metrics.due_within_30_days?.length || 0}
              </span>
            </div>
            {metrics.due_within_30_days?.length === 0 ? (
              <p className="text-xs text-stone-400 italic">{lang === 'en' ? 'No upcoming invoices' : 'Không có hóa đơn sắp tới'}</p>
            ) : (
              metrics.due_within_30_days.map((e: Expense) => (
                <div key={e.id} className="text-xs py-1 border-b border-stone-700 last:border-0 flex justify-between">
                  <span className="text-stone-300 truncate max-w-[140px]">{e.vendor_name}</span>
                  <span className="font-bold text-gold-200">{formatMoney(e.remaining_balance)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Expense Ledger Header & Add Button */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              {lang === 'en' ? 'Categorized Expense Ledger' : 'Sổ Nhật Ký Chi Phí & Hóa Đơn'}
            </h3>
            <p className="text-xs text-stone-500">
              {lang === 'en'
                ? 'Tracks vendor commitments, 8-course banquet, host-supplied bar, Áo Dài, and AV contracts.'
                : 'Theo dõi hợp đồng nhà hàng 8 món, rượu chiêu đãi, may Áo Dài và âm thanh ánh sáng.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingExpense(!isAddingExpense)}
              className="px-4 py-2 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.add_expense}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-stone-100">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
          >
            <option value="all">{lang === 'en' ? 'All Categories' : 'Tất Cả Danh Mục'}</option>
            {Object.entries(categoryNames).map(([cat, name]) => (
              <option key={cat} value={cat}>{name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
          >
            <option value="all">{lang === 'en' ? 'All Payment Statuses' : 'Tất Cả Trạng Thái'}</option>
            <option value="pending">Pending Balance</option>
            <option value="paid">Paid in Full</option>
          </select>
        </div>

        {/* New Expense Form Drawer */}
        {isAddingExpense && (
          <form onSubmit={handleCreateExpense} className="p-5 bg-stone-50 rounded-2xl border-2 border-gold-400 space-y-4 animate-fade-in">
            <h4 className="text-sm font-bold font-serif text-stone-900">
              {lang === 'en' ? 'Add Vendor / Expense Item' : 'Thêm Hạng Mục Chi Tiêu'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                >
                  {Object.entries(categoryNames).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Grand Pearl Palace / Tailor"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Actual Invoiced ($) *</label>
                <input
                  type="number"
                  required
                  value={actualInvoiced}
                  onChange={(e) => setActualInvoiced(e.target.value)}
                  placeholder="e.g. 14500"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Deposit Paid ($)</label>
                <input
                  type="number"
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-xs font-semibold text-stone-700 mb-1">Item Description / Contract Notes</label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="e.g. 8-course banquet for 8 tables with lobster & peking duck"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-crimson-800 text-white rounded-lg text-xs font-bold hover:bg-crimson-900"
              >
                Save Expense
              </button>
            </div>
          </form>
        )}

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Vendor / Item</th>
                <th className="py-3 px-3 text-right">Invoiced</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                      {categoryNames[exp.category] || exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-bold text-stone-900">{exp.vendor_name}</p>
                    <p className="text-[11px] text-stone-500 truncate max-w-xs">{exp.item_description}</p>
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-stone-800">
                    {formatMoney(exp.actual_invoiced)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-700 font-medium">
                    {formatMoney(exp.deposit_paid)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-crimson-800">
                    {formatMoney(exp.remaining_balance)}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-stone-600">
                    {exp.payment_due_date}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(exp)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        exp.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                      }`}
                    >
                      {exp.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </button>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-stone-300 hover:text-red-600 p-1 transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

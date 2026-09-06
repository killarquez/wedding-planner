'use client';

import React, { useState, useMemo } from 'react';
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
  Wine,
  Download,
  Printer,
  Search,
  Filter,
  Edit3,
  X,
  ArrowUpRight,
  TrendingUp,
  PackageCheck,
  CheckSquare,
  Square,
  Sparkles,
  Info
} from 'lucide-react';

interface Props {
  lang: Language;
  expenses: Expense[];
  metrics: any;
  onRefresh: () => void;
}

type ActiveBudgetTab = 'ledger' | 'corkage' | 'calendar' | 'cashflow';

export const BudgetEngine: React.FC<Props> = ({ lang, expenses, metrics, onRefresh }) => {
  const t = translations[lang];

  // Primary Tab State
  const [activeTab, setActiveTab] = useState<ActiveBudgetTab>('ledger');

  // Ledger Filter & Search State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'due_date' | 'amount_desc' | 'vendor'>('due_date');

  // Drawer / Modal States
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State for Add / Edit
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('venue_banquet');
  const [formVendor, setFormVendor] = useState('');
  const [formItemDesc, setFormItemDesc] = useState('');
  const [formEstimatedCost, setFormEstimatedCost] = useState('');
  const [formActualInvoiced, setFormActualInvoiced] = useState('');
  const [formDepositPaid, setFormDepositPaid] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('pending');
  const [formNotes, setFormNotes] = useState('');

  // Corkage & Bar Engine State
  const [corkagePolicy, setCorkagePolicy] = useState<'per_bottle' | 'flat_table' | 'venue_bar'>('per_bottle');
  const [hennessyBottles, setHennessyBottles] = useState<number>(8);
  const [macallanBottles, setMacallanBottles] = useState<number>(4);
  const [wineBottles, setWineBottles] = useState<number>(24);
  const [sparklingBottles, setSparklingBottles] = useState<number>(12);
  const [mixersFlatCost, setMixersFlatCost] = useState<number>(180);

  // Corkage Inventory Checklist State
  const [inventoryChecks, setInventoryChecks] = useState<Record<string, boolean>>({
    hennessy: true,
    macallan: false,
    wine: false,
    sparkling: false,
    ribbons: true,
    transporter: true
  });

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

  const categoryColors: Record<ExpenseCategory, { bg: string; text: string; border: string }> = {
    venue_banquet: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    host_beverages_corkage: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
    attire: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    stage_av_dj: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    decor_floral: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    photography_video: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
    gifts_favors: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    misc: { bg: 'bg-stone-50', text: 'text-stone-800', border: 'border-stone-200' },
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Filtered & Sorted Expenses for Ledger
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchesCat = filterCategory === 'all' || e.category === filterCategory;
        const matchesStat = filterStatus === 'all' || e.payment_status === filterStatus;
        const matchesQuery =
          searchQuery === '' ||
          e.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.item_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCat && matchesStat && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'due_date') {
          return new Date(a.payment_due_date).getTime() - new Date(b.payment_due_date).getTime();
        }
        if (sortBy === 'amount_desc') {
          return (b.actual_invoiced || b.estimated_cost) - (a.actual_invoiced || a.estimated_cost);
        }
        if (sortBy === 'vendor') {
          return a.vendor_name.localeCompare(b.vendor_name);
        }
        return 0;
      });
  }, [expenses, filterCategory, filterStatus, searchQuery, sortBy]);

  // Days until due calculation relative to target anchor (Aug 30, 2026 reference or current)
  const getDueDays = (dueDateStr: string) => {
    const today = new Date('2026-08-30');
    const due = new Date(dueDateStr);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Quick Toggle Paid Status
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

  // Delete Expense
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

  // Open Edit Drawer
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormCategory(exp.category);
    setFormVendor(exp.vendor_name);
    setFormItemDesc(exp.item_description);
    setFormEstimatedCost(String(exp.estimated_cost || ''));
    setFormActualInvoiced(String(exp.actual_invoiced || ''));
    setFormDepositPaid(String(exp.deposit_paid || ''));
    setFormDueDate(exp.payment_due_date || '');
    setFormStatus(exp.payment_status || 'pending');
    setFormNotes(exp.notes || '');
    setIsAddingExpense(true);
  };

  // Open New Expense Drawer
  const handleOpenNew = () => {
    setEditingExpense(null);
    setFormCategory('venue_banquet');
    setFormVendor('');
    setFormItemDesc('');
    setFormEstimatedCost('');
    setFormActualInvoiced('');
    setFormDepositPaid('');
    setFormDueDate('2026-11-15');
    setFormStatus('pending');
    setFormNotes('');
    setIsAddingExpense(true);
  };

  // Save Expense (Add or Update)
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        category: formCategory,
        vendor_name: formVendor,
        item_description: formItemDesc,
        estimated_cost: Number(formEstimatedCost || formActualInvoiced || 0),
        actual_invoiced: Number(formActualInvoiced || formEstimatedCost || 0),
        deposit_paid: Number(formDepositPaid || 0),
        payment_due_date: formDueDate,
        payment_status: formStatus,
        notes: formNotes
      };

      if (editingExpense) {
        await fetch('/api/budget', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingExpense.id, ...payload })
        });
      } else {
        await fetch('/api/budget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      setIsAddingExpense(false);
      setEditingExpense(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Category', 'Vendor Name', 'Item Description', 'Invoiced ($)', 'Deposit Paid ($)', 'Balance Due ($)', 'Due Date', 'Status', 'Notes'];
    const rows = expenses.map((e) => [
      `"${categoryNames[e.category] || e.category}"`,
      `"${e.vendor_name.replace(/"/g, '""')}"`,
      `"${e.item_description.replace(/"/g, '""')}"`,
      e.actual_invoiced,
      e.deposit_paid,
      e.remaining_balance,
      e.payment_due_date,
      e.payment_status,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wedding_budget_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Corkage Math Calculations
  const spiritsSubtotal = useMemo(() => {
    const hennessyTotal = hennessyBottles * 220;
    const macallanTotal = macallanBottles * 85;
    const wineTotal = wineBottles * 30;
    const sparklingTotal = sparklingBottles * 18;
    return hennessyTotal + macallanTotal + wineTotal + sparklingTotal + mixersFlatCost;
  }, [hennessyBottles, macallanBottles, wineBottles, sparklingBottles, mixersFlatCost]);

  const totalBottles = hennessyBottles + macallanBottles + wineBottles + sparklingBottles;

  const corkageFeeTotal = useMemo(() => {
    if (corkagePolicy === 'per_bottle') {
      return totalBottles * 15; // $15 / bottle Grand Harbor corkage
    }
    if (corkagePolicy === 'flat_table') {
      return 8 * 250; // $250 flat unlimited per 10-top table (8 tables = $2,000)
    }
    return 0; // Venue standard bar includes its own drinks
  }, [corkagePolicy, totalBottles]);

  const totalHostBeverageCost = spiritsSubtotal + corkageFeeTotal;

  // Comparison vs Restaurant Bar Package
  // 80 guests @ $45/head open bar + 20% service fee ($720) + 10.25% sales tax ($442) = $4,762
  const venueOpenBarEstimate = 80 * 45 * 1.3225;

  // Savings calculation: wholesale spirits + corkage vs purchasing comparable spirits at restaurant markup
  const estimatedRestaurantRetailEquivalent = (hennessyBottles * 650) + (macallanBottles * 250) + (wineBottles * 85) + (sparklingBottles * 60);
  const netSavings = Math.max(0, estimatedRestaurantRetailEquivalent - totalHostBeverageCost);

  // Toggle inventory checkbox
  const toggleInventoryCheck = (key: string) => {
    setInventoryChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. Header Summary Metrics & KPI Cards                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Target Budget */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{t.budget_total_budget}</span>
            <DollarSign className="w-4 h-4 text-stone-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
            {formatMoney(metrics.total_budget_estimated || 0)}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-stone-400">
              {metrics.target_budget_cap
                ? `${lang === 'en' ? 'Target Cap:' : 'Mục tiêu:'} ${formatMoney(metrics.target_budget_cap)}`
                : (lang === 'en' ? 'No cap set' : 'Chưa đặt mục tiêu')}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
              {lang === 'en' ? `${expenses.length} Contracts` : `${expenses.length} Hợp đồng`}
            </span>
          </div>
        </div>

        {/* Total Invoiced / Committed */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{t.budget_total_invoiced}</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-blue-900">
            {formatMoney(metrics.total_invoiced || 0)}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-blue-600">
              {lang === 'en' ? 'Committed contracts' : 'Hợp đồng đã ký'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
              {metrics.target_budget_cap && metrics.target_budget_cap > 0
                ? `${Math.round(((metrics.total_invoiced || 0) / metrics.target_budget_cap) * 100)}%`
                : (expenses.length > 0 ? '100%' : '0%')}
            </span>
          </div>
        </div>

        {/* Liquid Cash Paid */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{t.budget_deposit_paid}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-emerald-800">
            {formatMoney(metrics.total_deposit_paid || 0)}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-emerald-600">
              {lang === 'en' ? 'Liquid cash cleared' : 'Tiền cọc đã giải ngân'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
              {metrics.total_invoiced && metrics.total_invoiced > 0
                ? `${Math.round(((metrics.total_deposit_paid || 0) / metrics.total_invoiced) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Remaining Outstanding Balance */}
        <div className="bg-white p-5 rounded-2xl border border-crimson-200 shadow-xs">
          <div className="flex items-center justify-between text-crimson-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{t.budget_remaining_liquidity}</span>
            <AlertTriangle className="w-4 h-4 text-crimson-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-crimson-800">
            {formatMoney(metrics.remaining_balance_due || 0)}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-crimson-600">
              {lang === 'en' ? 'Pending due dates' : 'Còn phải thanh toán'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-crimson-100 text-crimson-700 font-medium">
              {lang === 'en' ? 'Due by 12/20' : 'Trước 20/12'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Upcoming Payment Deadlines Alert Banner                                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 rounded-3xl border border-stone-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-gold-400 animate-pulse" />
            <h3 className="text-base font-bold font-serif text-stone-100">
              {t.budget_alerts_title}
            </h3>
          </div>
          <span className="text-xs text-gold-300 font-medium">
            {lang === 'en' ? 'Wedding Date: Sunday, Dec 20, 2026' : 'Ngày Cưới: Chủ Nhật, 20/12/2026'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Due in 7 Days */}
          <div className="bg-stone-800/90 p-4 rounded-2xl border border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-400">{t.due_in_7}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono">
                {metrics.due_within_7_days?.length || 0}
              </span>
            </div>
            {metrics.due_within_7_days?.length === 0 ? (
              <p className="text-xs text-stone-400 italic">
                {lang === 'en' ? 'No urgent payments due within 7 days' : 'Không có khoản nợ gấp trong 7 ngày'}
              </p>
            ) : (
              metrics.due_within_7_days?.map((e: Expense) => (
                <div key={e.id} className="text-xs py-1.5 border-b border-stone-700 last:border-0 flex justify-between items-center">
                  <span className="text-stone-300 truncate max-w-[140px]">{e.vendor_name}</span>
                  <span className="font-bold text-red-300">{formatMoney(e.remaining_balance)}</span>
                </div>
              ))
            )}
          </div>

          {/* Due in 14 Days */}
          <div className="bg-stone-800/90 p-4 rounded-2xl border border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400">{t.due_in_14}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">
                {metrics.due_within_14_days?.length || 0}
              </span>
            </div>
            {metrics.due_within_14_days?.length === 0 ? (
              <p className="text-xs text-stone-400 italic">
                {lang === 'en' ? 'No invoices due in this window' : 'Không có hóa đơn trong kỳ này'}
              </p>
            ) : (
              metrics.due_within_14_days?.map((e: Expense) => (
                <div key={e.id} className="text-xs py-1.5 border-b border-stone-700 last:border-0 flex justify-between items-center">
                  <span className="text-stone-300 truncate max-w-[140px]">{e.vendor_name}</span>
                  <span className="font-bold text-amber-300">{formatMoney(e.remaining_balance)}</span>
                </div>
              ))
            )}
          </div>

          {/* Due in 30 Days */}
          <div className="bg-stone-800/90 p-4 rounded-2xl border border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gold-300">{t.due_in_30}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gold-950 text-gold-300 font-mono">
                {metrics.due_within_30_days?.length || 0}
              </span>
            </div>
            {metrics.due_within_30_days?.length === 0 ? (
              <p className="text-xs text-stone-400 italic">
                {lang === 'en' ? 'No upcoming invoices within 30 days' : 'Không có khoản nợ trong 30 ngày'}
              </p>
            ) : (
              metrics.due_within_30_days?.map((e: Expense) => (
                <div key={e.id} className="text-xs py-1.5 border-b border-stone-700 last:border-0 flex justify-between items-center">
                  <span className="text-stone-300 truncate max-w-[140px]">{e.vendor_name}</span>
                  <span className="font-bold text-gold-200">{formatMoney(e.remaining_balance)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Sub-Navigation Tabs & Actions Bar                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-stone-200/70 rounded-2xl border border-stone-300/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{t.tab_ledger}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {expenses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('corkage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'corkage'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            <Wine className="w-4 h-4 text-purple-400" />
            <span>{t.tab_corkage_engine}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 font-bold">
              8 btls XO
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>{t.tab_payment_calendar}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cashflow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cashflow'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            <PieChart className="w-4 h-4 text-emerald-500" />
            <span>{t.tab_cashflow_analytics}</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            title="Download CSV of all expenses"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>{t.export_budget_csv_btn}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            title="Print Executive Budget and Cash Envelopes"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            <span>{t.print_budget_summary}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.add_expense}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: CATEGORIZED EXPENSE LEDGER                                      */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                {lang === 'en' ? 'Categorized Vendor & Expense Ledger' : 'Sổ Nhật Ký Chi Phí & Hóa Đơn Hợp Đồng'}
              </h3>
              <p className="text-xs text-stone-500">
                {lang === 'en'
                  ? 'Tracks vendor commitments, 8-course banquet, host-supplied bar, custom Áo Dài, and AV contracts.'
                  : 'Theo dõi hợp đồng nhà hàng 8 món, rượu chiêu đãi, may Áo Dài và âm thanh ánh sáng.'}
              </p>
            </div>
            <div className="text-xs font-mono text-stone-500">
              {filteredExpenses.length} {lang === 'en' ? 'items shown' : 'khoản hiển thị'}
            </div>
          </div>

          {/* Filters, Search & Sorting Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'en' ? 'Search vendor or notes...' : 'Tìm nhà cung cấp, ghi chú...'}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
            >
              <option value="all">{lang === 'en' ? 'All Categories (Tất Cả)' : 'Tất Cả Danh Mục'}</option>
              {Object.entries(categoryNames).map(([cat, name]) => (
                <option key={cat} value={cat}>{name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
            >
              <option value="all">{lang === 'en' ? 'All Statuses (Tất Cả)' : 'Tất Cả Trạng Thái'}</option>
              <option value="pending">{lang === 'en' ? 'Pending Balance' : 'Còn Nợ Số Dư'}</option>
              <option value="paid">{lang === 'en' ? 'Paid in Full' : 'Đã Thanh Toán Đầy Đủ'}</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
            >
              <option value="due_date">{lang === 'en' ? 'Sort: Due Date (Ascending)' : 'Xếp: Hạn Thanh Toán'}</option>
              <option value="amount_desc">{lang === 'en' ? 'Sort: Amount (Highest)' : 'Xếp: Số Tiền Cao Nhất'}</option>
              <option value="vendor">{lang === 'en' ? 'Sort: Vendor Name (A-Z)' : 'Xếp: Tên Nhà Cung Cấp'}</option>
            </select>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Vendor / Contract Item</th>
                  <th className="py-3 px-3 text-right">Invoiced</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400 italic">
                      {lang === 'en' ? 'No expenses match the current filter.' : 'Không tìm thấy chi tiêu nào khớp bộ lọc.'}
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const color = categoryColors[exp.category] || categoryColors.misc;
                    const dueDiff = getDueDays(exp.payment_due_date);
                    return (
                      <tr key={exp.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${color.bg} ${color.text} ${color.border}`}>
                            {categoryNames[exp.category] || exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-stone-900">{exp.vendor_name}</p>
                          <p className="text-[11px] text-stone-500 truncate max-w-sm">{exp.item_description}</p>
                          {exp.notes && (
                            <p className="text-[10px] text-amber-700 italic mt-0.5">Note: {exp.notes}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-stone-800">
                          {formatMoney(exp.actual_invoiced || exp.estimated_cost)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-emerald-700 font-medium">
                          {formatMoney(exp.deposit_paid)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-crimson-800">
                          {formatMoney(exp.remaining_balance)}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-stone-700 block">{exp.payment_due_date}</span>
                          {exp.payment_status === 'pending' && exp.remaining_balance > 0 && (
                            <span className={`text-[10px] block font-medium ${
                              dueDiff <= 7 ? 'text-red-600 font-bold' : dueDiff <= 14 ? 'text-amber-600' : 'text-stone-400'
                            }`}>
                              {dueDiff <= 0
                                ? (lang === 'en' ? 'Due today!' : 'Đến hạn hôm nay!')
                                : lang === 'en' ? `In ${dueDiff} days` : `Còn ${dueDiff} ngày`}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(exp)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-2xs ${
                              exp.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                            }`}
                            title="Click to toggle paid / pending"
                          >
                            {exp.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(exp)}
                              className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors"
                              title="Edit expense"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-stone-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: HOST-SUPPLIED BAR & CORKAGE CALCULATOR                          */}
      {/* ========================================================================= */}
      {activeTab === 'corkage' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-stone-900 via-purple-950 to-stone-900 text-white p-6 rounded-3xl border border-purple-900 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wine className="w-5 h-5 text-purple-400" />
                  <h3 className="font-serif font-bold text-lg text-stone-100">
                    {t.corkage_title}
                  </h3>
                </div>
                <p className="text-xs text-stone-300 max-w-3xl leading-relaxed">
                  {t.corkage_desc}
                </p>
              </div>

              {/* Net Savings Badge */}
              <div className="bg-gold-500/20 border border-gold-400/50 p-4 rounded-2xl text-right min-w-[200px]">
                <span className="text-[10px] text-gold-300 font-bold uppercase tracking-wider block">
                  {t.net_savings_badge}
                </span>
                <p className="text-2xl font-bold font-serif text-gold-200">
                  +{formatMoney(netSavings)}
                </p>
                <span className="text-[10px] text-stone-300">
                  {lang === 'en' ? 'vs Restaurant bottle retail' : 'so với giá bán lẻ nhà hàng'}
                </span>
              </div>
            </div>
          </div>

          {/* Policy Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Option A: Per-Bottle ($15/bottle) */}
            <div
              onClick={() => setCorkagePolicy('per_bottle')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                corkagePolicy === 'per_bottle'
                  ? 'border-crimson-700 bg-crimson-50/40 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-900">
                  {lang === 'en' ? 'Option A: Per-Bottle Corkage' : 'Lựa Chọn A: Phí Tính Theo Chai'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  corkagePolicy === 'per_bottle' ? 'bg-crimson-800 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  Grand Harbor Recommended
                </span>
              </div>
              <p className="text-xl font-bold font-serif text-stone-900 mb-1">
                $15 <span className="text-xs font-normal text-stone-500">/ bottle</span>
              </p>
              <p className="text-xs text-stone-600 leading-relaxed mb-3">
                {lang === 'en'
                  ? 'Grand Harbor waives cocktail setup and charges $15/bottle uncorked. Includes ice, glassware & cocktail napkins.'
                  : 'Grand Harbor tính $15/chai mở. Đã bao gồm toàn bộ ly tách pha lê, đá lạnh và phục vụ tại bàn.'}
              </p>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-medium">
                <span className="text-stone-500">Corkage for {totalBottles} bottles:</span>
                <span className="font-bold text-stone-900">{formatMoney(totalBottles * 15)}</span>
              </div>
            </div>

            {/* Option B: Flat Table Package ($250/table) */}
            <div
              onClick={() => setCorkagePolicy('flat_table')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                corkagePolicy === 'flat_table'
                  ? 'border-crimson-700 bg-crimson-50/40 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-900">
                  {lang === 'en' ? 'Option B: Flat Unlimited Table Fee' : 'Lựa Chọn B: Trọn Gói Theo Bàn'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  corkagePolicy === 'flat_table' ? 'bg-crimson-800 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  Unlimited Pouring
                </span>
              </div>
              <p className="text-xl font-bold font-serif text-stone-900 mb-1">
                $250 <span className="text-xs font-normal text-stone-500">/ 10-top table</span>
              </p>
              <p className="text-xs text-stone-600 leading-relaxed mb-3">
                {lang === 'en'
                  ? 'Flat uncorking fee for 8 tables ($2,000 total). No bottle counts required. Dedicated bar tender for spirits.'
                  : 'Trọn gói mở không giới hạn số lượng cho 8 bàn ($2.000). Nhân viên pha chế riêng phục vụ rượu mạnh.'}
              </p>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-medium">
                <span className="text-stone-500">Corkage for 8 tables:</span>
                <span className="font-bold text-stone-900">{formatMoney(8 * 250)}</span>
              </div>
            </div>

            {/* Option C: Restaurant Open Bar ($45/guest) */}
            <div
              onClick={() => setCorkagePolicy('venue_bar')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                corkagePolicy === 'venue_bar'
                  ? 'border-crimson-700 bg-crimson-50/40 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-900">
                  {lang === 'en' ? 'Option C: Venue In-House Standard Bar' : 'Lựa Chọn C: Gói Bar Của Nhà Hàng'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  corkagePolicy === 'venue_bar' ? 'bg-crimson-800 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  Standard Call Liquor
                </span>
              </div>
              <p className="text-xl font-bold font-serif text-stone-900 mb-1">
                $45 <span className="text-xs font-normal text-stone-500">/ guest (+ service & tax)</span>
              </p>
              <p className="text-xs text-stone-600 leading-relaxed mb-3">
                {lang === 'en'
                  ? 'Standard house liquor package for 80 guests. NOTE: Does NOT include Hennessy XO or Macallan 12!'
                  : 'Gói rượu cơ bản của nhà hàng cho 80 khách. Chú ý: KHÔNG bao gồm Hennessy XO hay Macallan 12!'}
              </p>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-medium">
                <span className="text-stone-500">Total with 20% svc + tax:</span>
                <span className="font-bold text-stone-900">{formatMoney(venueOpenBarEstimate)}</span>
              </div>
            </div>
          </div>

          {/* Interactive Bottle Calculator Grid */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-serif font-bold text-stone-900 text-base">
                  {lang === 'en' ? 'Host-Supplied Spirits & Wine Roster' : 'Bảng Định Mức Rượu Ngoại Chiêu Đãi'}
                </h4>
                <p className="text-xs text-stone-500">
                  {lang === 'en'
                    ? 'Adjust bottle counts and wholesale pricing to optimize total beverage spend and Grand Harbor corkage fees.'
                    : 'Tùy chỉnh số lượng chai và giá mua sỉ để tối ưu chi phí đồ uống và phí mở chai Grand Harbor.'}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-900 font-bold">
                {totalBottles} {lang === 'en' ? 'Total Bottles Allocated' : 'Tổng Chai Dự Kiến'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item 1: Hennessy XO Chào Bàn */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-crimson-700" />
                    <span className="text-xs font-bold text-stone-900">{t.chao_ban_hennessy_allocation}</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {lang === 'en' ? '1 bottle allocated per 10-top table for traditional toasting' : '1 chai cho mỗi bàn 10 người để chúc rượu Chào Bàn'}
                  </p>
                  <p className="text-xs font-mono text-stone-600">
                    Wholesale: ~$220 / 750ml bottle (BevMo / Costco Business)
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={hennessyBottles}
                      onChange={(e) => setHennessyBottles(Math.max(1, Number(e.target.value)))}
                      className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <span className="text-xs text-stone-500">btls</span>
                  </div>
                  <span className="text-sm font-bold text-stone-900 font-serif">
                    {formatMoney(hennessyBottles * 220)}
                  </span>
                </div>
              </div>

              {/* Item 2: Macallan 12 Single Malt */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-stone-900">{t.single_malt_bar}</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {lang === 'en' ? 'Cocktail bar & elder VIP preference service' : 'Phục vụ tại quầy bar và khách VIP yêu thích Scotch'}
                  </p>
                  <p className="text-xs font-mono text-stone-600">
                    Wholesale: ~$85 / 750ml bottle
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={macallanBottles}
                      onChange={(e) => setMacallanBottles(Math.max(0, Number(e.target.value)))}
                      className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <span className="text-xs text-stone-500">btls</span>
                  </div>
                  <span className="text-sm font-bold text-stone-900 font-serif">
                    {formatMoney(macallanBottles * 85)}
                  </span>
                </div>
              </div>

              {/* Item 3: Napa Cabernet Sauvignon */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-red-800" />
                    <span className="text-xs font-bold text-stone-900">{t.table_wine_napa}</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {lang === 'en' ? 'Paired with 8-course banquet (approx. 3 bottles per table)' : 'Dùng kèm tiệc 8 món (ước tính 3 chai mỗi bàn)'}
                  </p>
                  <p className="text-xs font-mono text-stone-600">
                    Wholesale: ~$30 / bottle ($360 / case of 12)
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={48}
                      step={6}
                      value={wineBottles}
                      onChange={(e) => setWineBottles(Math.max(0, Number(e.target.value)))}
                      className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <span className="text-xs text-stone-500">btls</span>
                  </div>
                  <span className="text-sm font-bold text-stone-900 font-serif">
                    {formatMoney(wineBottles * 30)}
                  </span>
                </div>
              </div>

              {/* Item 4: Prosecco DOCG Sparkling */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-600" />
                    <span className="text-xs font-bold text-stone-900">{t.sparkling_reception}</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {lang === 'en' ? 'Welcome toast flutes & Grand Stage champagne tower' : 'Ly vang sủi đón khách & nghi thức tháp rượu sân khấu'}
                  </p>
                  <p className="text-xs font-mono text-stone-600">
                    Wholesale: ~$18 / bottle ($216 / case of 12)
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={sparklingBottles}
                      onChange={(e) => setSparklingBottles(Math.max(0, Number(e.target.value)))}
                      className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <span className="text-xs text-stone-500">btls</span>
                  </div>
                  <span className="text-sm font-bold text-stone-900 font-serif">
                    {formatMoney(sparklingBottles * 18)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Rollup Footer */}
            <div className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-2xl">
              <div>
                <span className="text-[11px] text-stone-500 uppercase font-bold block">{t.spirits_subtotal}</span>
                <p className="text-lg font-bold text-stone-900 font-serif">{formatMoney(spiritsSubtotal)}</p>
                <span className="text-[10px] text-stone-400">Includes wholesale alcohol & mixers</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 uppercase font-bold block">{t.corkage_fee_total}</span>
                <p className="text-lg font-bold text-crimson-800 font-serif">{formatMoney(corkageFeeTotal)}</p>
                <span className="text-[10px] text-stone-400">
                  {corkagePolicy === 'per_bottle' ? `$15 × ${totalBottles} bottles` : '$250 × 8 tables'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 uppercase font-bold block">{t.total_beverage_investment}</span>
                <p className="text-xl font-bold text-emerald-800 font-serif">{formatMoney(totalHostBeverageCost)}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Full Host-Supplied Bar</span>
              </div>
            </div>
          </div>

          {/* Bar Logistics & Delivery Checklist */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-stone-700" />
                <h4 className="font-serif font-bold text-stone-900 text-base">
                  {t.inventory_checklist_title}
                </h4>
              </div>
              <span className="text-xs text-stone-500">
                {lang === 'en' ? 'Drop-off Window: Friday, Dec 11, 2026 (2:00 PM)' : 'Bàn giao: Thứ Sáu, 11/12/2026 (14:00)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={inventoryChecks.hennessy}
                  onChange={() => toggleInventoryCheck('hennessy')}
                  className="mt-0.5 rounded text-crimson-800 focus:ring-crimson-700"
                />
                <div className="text-xs">
                  <p className="font-bold text-stone-900">8 Bottles Hennessy XO</p>
                  <p className="text-stone-500 text-[11px]">Wholesale BevMo order confirmed</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={inventoryChecks.macallan}
                  onChange={() => toggleInventoryCheck('macallan')}
                  className="mt-0.5 rounded text-crimson-800 focus:ring-crimson-700"
                />
                <div className="text-xs">
                  <p className="font-bold text-stone-900">4 Bottles Macallan 12</p>
                  <p className="text-stone-500 text-[11px]">Reserved at wholesale</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={inventoryChecks.wine}
                  onChange={() => toggleInventoryCheck('wine')}
                  className="mt-0.5 rounded text-crimson-800 focus:ring-crimson-700"
                />
                <div className="text-xs">
                  <p className="font-bold text-stone-900">2 Cases Napa Cabernet</p>
                  <p className="text-stone-500 text-[11px]">To deliver to Grand Harbor cellar</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={inventoryChecks.sparkling}
                  onChange={() => toggleInventoryCheck('sparkling')}
                  className="mt-0.5 rounded text-crimson-800 focus:ring-crimson-700"
                />
                <div className="text-xs">
                  <p className="font-bold text-stone-900">1 Case Prosecco DOCG</p>
                  <p className="text-stone-500 text-[11px]">Chilling in Grand Harbor fridge</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={inventoryChecks.ribbons}
                  onChange={() => toggleInventoryCheck('ribbons')}
                  className="mt-0.5 rounded text-crimson-800 focus:ring-crimson-700"
                />
                <div className="text-xs">
                  <p className="font-bold text-stone-900">8 Red Silk Toasting Ribbons</p>
                  <p className="text-stone-500 text-[11px]">Tied around bottle necks for Chào Bàn</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={inventoryChecks.transporter}
                  onChange={() => toggleInventoryCheck('transporter')}
                  className="mt-0.5 rounded text-crimson-800 focus:ring-crimson-700"
                />
                <div className="text-xs">
                  <p className="font-bold text-stone-900">Groomsmen Transport Escort</p>
                  <p className="text-stone-500 text-[11px]">Vehicle assigned for secure delivery</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: PAYMENT MILESTONES & NIGHT-OF CASH ENVELOPES                    */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                {t.payment_timeline_title}
              </h3>
              <p className="text-xs text-stone-500">
                {t.payment_timeline_desc}
              </p>
            </div>

            {/* Timeline Sprint Groups */}
            <div className="space-y-6">
              {/* Group 1: Cleared Milestones (August 2026) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    {lang === 'en' ? 'August 2026 — Cleared & Completed' : 'Tháng 8/2026 — Đã Hoàn Thành'}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    $4,000 Cleared
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 border-l-2 border-emerald-300">
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-stone-900">Custom Silk Áo Dài Fitting & Tailoring</p>
                      <p className="text-[11px] text-stone-500">Ninh Khương & Indochine Tailors • Paid Aug 15</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">$2,800 (Paid)</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-stone-900">Hỷ Sự Silk Favors & Bao Lì Xì</p>
                      <p className="text-[11px] text-stone-500">Traditional silk favors for 80 guests • Paid Aug 20</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">$1,200 (Paid)</span>
                  </div>
                </div>
              </div>

              {/* Group 2: October 2026 Deadlines */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    {lang === 'en' ? 'October 2026 — Stage & AV Deadlines' : 'Tháng 10/2026 — Hạn Âm Thanh & Sân Khấu'}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                    $2,400 Balance
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 border-l-2 border-blue-300">
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-stone-900">Saigon Nights AV & DJ Danny K</p>
                      <p className="text-[11px] text-stone-500">Bilingual MC & Uplighting package • Due Oct 30, 2026</p>
                    </div>
                    <span className="text-xs font-bold text-stone-900">$2,400</span>
                  </div>
                </div>
              </div>

              {/* Group 3: November 2026 Crunch Month */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    {lang === 'en' ? 'November 2026 — Major Banquet Guarantees' : 'Tháng 11/2026 — Thanh Toán Đợt 2 Nhà Hàng & Rượu'}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    $14,700 Balance
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-6 border-l-2 border-amber-400">
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                    <p className="text-xs font-bold text-stone-900">Lotus & Pearl Florals</p>
                    <p className="text-[11px] text-stone-500">Backdrop & Centerpieces • Nov 01</p>
                    <p className="text-xs font-bold text-crimson-800 mt-2">$2,500 due</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                    <p className="text-xs font-bold text-stone-900">BevMo Alcohol Wholesale</p>
                    <p className="text-[11px] text-stone-500">Hennessy XO & Wine • Nov 15</p>
                    <p className="text-xs font-bold text-crimson-800 mt-2">$2,700 due</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                    <p className="text-xs font-bold text-stone-900">Grand Harbor 8-Course Banquet</p>
                    <p className="text-[11px] text-stone-500">Final Headcount Guarantee • Nov 20</p>
                    <p className="text-xs font-bold text-crimson-800 mt-2">$9,500 due</p>
                  </div>
                </div>
              </div>

              {/* Group 4: December 20, 2026 Event Week & Wedding Night */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    {lang === 'en' ? 'December 20, 2026 — Wedding Night Final Balances' : 'Ngày 20/12/2026 — Quyết Toán Đêm Tiệc'}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-100 text-gold-900 font-bold">
                    $3,100 Due On-Site
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 border-l-2 border-gold-400">
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-stone-900">Lumière Cinema & Photography</p>
                      <p className="text-[11px] text-stone-500">Dual Shooter Final Payment • Night-of Check</p>
                    </div>
                    <span className="text-xs font-bold text-crimson-800">$2,300</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-stone-900">Day-of Coordination & Contingency</p>
                      <p className="text-[11px] text-stone-500">Printed Menus, Table Cards & Buffer Reserve</p>
                    </div>
                    <span className="text-xs font-bold text-stone-900">$800</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wedding Night Cash Envelopes Calculator */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-stone-900 text-base">
                  {t.wedding_night_envelopes}
                </h4>
                <p className="text-xs text-stone-500">
                  {t.wedding_night_desc}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-900 font-bold">
                $3,300 Total Cash Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Envelope 1</span>
                <p className="font-bold text-xs text-stone-900">Lumière Cinema</p>
                <p className="text-[11px] text-stone-500">Lead Photographer</p>
                <p className="text-base font-bold text-stone-900 font-serif mt-2">$2,300</p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Envelope 2</span>
                <p className="font-bold text-xs text-stone-900">Grand Harbor Staff</p>
                <p className="text-[11px] text-stone-500">Captain & Waitstaff Gratuity</p>
                <p className="text-base font-bold text-stone-900 font-serif mt-2">$500</p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Envelope 3</span>
                <p className="font-bold text-xs text-stone-900">DJ Danny K & MC</p>
                <p className="text-[11px] text-stone-500">Audio Crew Gratuity</p>
                <p className="text-base font-bold text-stone-900 font-serif mt-2">$300</p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Envelope 4</span>
                <p className="font-bold text-xs text-stone-900">Red Lì Xì Envelopes</p>
                <p className="text-[11px] text-stone-500">Photographers & Ushers Luck</p>
                <p className="text-base font-bold text-stone-900 font-serif mt-2">$200</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 4: CASHFLOW & CATEGORY BREAKDOWN ANALYTICS                         */}
      {/* ========================================================================= */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                {lang === 'en' ? 'Category Spend Breakdown & Liquidity Distribution' : 'Phân Tích Cơ Cấu Ngân Sách Theo Danh Mục'}
              </h3>
              <p className="text-xs text-stone-500">
                {lang === 'en'
                  ? 'Visual representation of committed contracts across banquet, host beverages, attire, AV, and florals.'
                  : 'Biểu đồ phân bổ tỷ trọng ngân sách cho tiệc 8 món, rượu chiêu đãi, trang phục, âm thanh và trang trí hoa.'}
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(categoryNames).map(([catKey, label]) => {
                const totalInCat = expenses
                  .filter((e) => e.category === catKey)
                  .reduce((sum, e) => sum + Number(e.actual_invoiced || e.estimated_cost || 0), 0);
                const paidInCat = expenses
                  .filter((e) => e.category === catKey)
                  .reduce((sum, e) => sum + Number(e.deposit_paid || 0), 0);
                const totalBudget = metrics.total_invoiced || 0;
                const pctOfTotal = totalBudget > 0 ? Math.round((totalInCat / totalBudget) * 100) : 0;
                const paidPct = totalInCat > 0 ? Math.round((paidInCat / totalInCat) * 100) : 0;
                const color = categoryColors[catKey as ExpenseCategory] || categoryColors.misc;

                return (
                  <div key={catKey} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${color.bg} ${color.text} ${color.border}`}>
                          {label}
                        </span>
                        <span className="text-stone-400 font-mono">({pctOfTotal}% of total)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-stone-600">Paid: <strong className="text-emerald-700">{formatMoney(paidInCat)}</strong></span>
                        <span className="text-stone-400">/</span>
                        <span className="text-stone-800 font-bold">Total: {formatMoney(totalInCat)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-crimson-800 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${paidPct}%` }}
                        title={`${paidPct}% paid`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. QUICK ADD / EDIT EXPENSE DRAWER MODAL                                   */}
      {/* ========================================================================= */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 border border-stone-200 shadow-xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="text-base font-bold font-serif text-stone-900">
                  {editingExpense
                    ? (lang === 'en' ? 'Edit Vendor / Expense Item' : 'Chỉnh Sửa Chi Tiêu')
                    : (lang === 'en' ? 'Add Vendor / Expense Item' : 'Thêm Hạng Mục Chi Tiêu')}
                </h4>
                <p className="text-xs text-stone-500">
                  {lang === 'en' ? 'Trang & Alfredo Wedding Budget Ledger' : 'Sổ Quản Lý Ngân Sách Trang & Alfredo'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingExpense(false);
                  setEditingExpense(null);
                }}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-crimson-700"
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
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    placeholder="e.g. Grand Harbor Restaurant / BevMo"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-crimson-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Actual Invoiced ($) *</label>
                  <input
                    type="number"
                    required
                    value={formActualInvoiced}
                    onChange={(e) => setFormActualInvoiced(e.target.value)}
                    placeholder="e.g. 14500"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-crimson-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Deposit Paid ($)</label>
                  <input
                    type="number"
                    value={formDepositPaid}
                    onChange={(e) => setFormDepositPaid(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-crimson-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-crimson-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-crimson-700"
                  >
                    <option value="pending">Pending Balance</option>
                    <option value="paid">Paid in Full</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Item Description</label>
                  <input
                    type="text"
                    value={formItemDesc}
                    onChange={(e) => setFormItemDesc(e.target.value)}
                    placeholder="e.g. 8-course banquet for 8 tables with lobster & peking duck"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-crimson-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Contract Notes / Logistics</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Balance due night of event; couple brings own Hennessy XO"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-crimson-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingExpense(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-crimson-800 text-white rounded-xl text-xs font-bold hover:bg-crimson-900 shadow-xs"
                >
                  {editingExpense ? t.save_changes : t.add_expense}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. PRINT-FRIENDLY EXECUTIVE BUDGET & PAYOUT SUMMARY SHEET                 */}
      {/* ========================================================================= */}
      <div className="hidden print:block space-y-6 p-6">
        <div className="border-b-2 border-stone-900 pb-4">
          <h1 className="text-2xl font-bold font-serif">Trang & Alfredo Wedding Celebration</h1>
          <p className="text-sm text-stone-600">Executive Budget & Vendor Payout Sheet • Sunday, December 20, 2026</p>
          <p className="text-xs text-stone-500">Grand Harbor Restaurant • 5733 Rosemead Blvd., Temple City, CA 91780</p>
        </div>

        <div className="grid grid-cols-4 gap-4 text-xs">
          <div>
            <span className="font-bold block">Total Budget:</span>
            <span>{formatMoney(metrics.total_budget_estimated || 0)}</span>
          </div>
          <div>
            <span className="font-bold block">Total Invoiced:</span>
            <span>{formatMoney(metrics.total_invoiced || 0)}</span>
          </div>
          <div>
            <span className="font-bold block">Deposits Paid:</span>
            <span>{formatMoney(metrics.total_deposit_paid || 0)}</span>
          </div>
          <div>
            <span className="font-bold block">Night-of Balance Due:</span>
            <span className="font-bold text-red-800">{formatMoney(metrics.remaining_balance_due || 0)}</span>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse border border-stone-300 mt-4">
          <thead>
            <tr className="bg-stone-100 border-b border-stone-300">
              <th className="p-2">Category</th>
              <th className="p-2">Vendor</th>
              <th className="p-2 text-right">Invoiced</th>
              <th className="p-2 text-right">Paid</th>
              <th className="p-2 text-right">Balance</th>
              <th className="p-2">Due Date</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="p-2">{categoryNames[e.category] || e.category}</td>
                <td className="p-2 font-bold">{e.vendor_name}</td>
                <td className="p-2 text-right">{formatMoney(e.actual_invoiced)}</td>
                <td className="p-2 text-right">{formatMoney(e.deposit_paid)}</td>
                <td className="p-2 text-right font-bold">{formatMoney(e.remaining_balance)}</td>
                <td className="p-2">{e.payment_due_date}</td>
                <td className="p-2">{e.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Info,
  ShieldCheck,
  Layers,
  HelpCircle
} from 'lucide-react';

interface Props {
  lang: Language;
  expenses: Expense[];
  metrics: any;
  onRefresh: () => void;
}

type ActiveBudgetTab = 'ledger' | 'beverage' | 'calendar' | 'cashflow';

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
  const [formPaymentMethod, setFormPaymentMethod] = useState('Zelle');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('pending');
  const [formNotes, setFormNotes] = useState('');

  // Banquet Alcohol & Beverage Estimator State (No Corkage Fee at Grand Harbor)
  const [hennessyBottles, setHennessyBottles] = useState<number>(16);
  const [hennessyPrice, setHennessyPrice] = useState<number>(55);
  const [macallanBottles, setMacallanBottles] = useState<number>(4);
  const [macallanPrice, setMacallanPrice] = useState<number>(85);
  const [wineBottles, setWineBottles] = useState<number>(24);
  const [winePrice, setWinePrice] = useState<number>(20);
  const [sparklingBottles, setSparklingBottles] = useState<number>(12);
  const [sparklingPrice, setSparklingPrice] = useState<number>(18);
  const [beerCases, setBeerCases] = useState<number>(4);
  const [beerCasePrice, setBeerCasePrice] = useState<number>(35);
  const [mixersFlatCost, setMixersFlatCost] = useState<number>(150);

  // Beverage Purchase Checklist
  const [inventoryChecks, setInventoryChecks] = useState<Record<string, boolean>>({
    hennessy: false,
    macallan: false,
    wine: false,
    sparkling: false,
    beer: false,
    mixers: false,
    ribbons: false,
    transporter: false
  });

  const categoryNames: Record<ExpenseCategory, string> = {
    venue_banquet: t.category_venue,
    host_beverages_corkage: t.category_drinks,
    attire: t.category_attire,
    stage_av_dj: t.category_av,
    decor_floral: t.category_decor,
    photography_video: t.category_photo,
    gifts_favors: t.category_gifts,
    misc: t.category_misc || 'Miscellaneous / Incidentals',
  };

  const categoryColors: Record<ExpenseCategory, { bg: string; text: string; border: string }> = {
    venue_banquet: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    host_beverages_corkage: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
    attire: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    stage_av_dj: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    decor_floral: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    photography_video: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
    gifts_favors: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    misc: { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-300' },
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Master List of 8 Categories for Budget Planning
  const masterCategories: Array<{ key: ExpenseCategory; icon: string; labelEn: string; labelVi: string }> = [
    { key: 'venue_banquet', icon: '🍽️', labelEn: 'Venue & Banquet (Grand Harbor)', labelVi: 'Nhà Hàng & Tiệc 8 Món' },
    { key: 'decor_floral', icon: '🌸', labelEn: 'Floral, Arch & Stage Styling', labelVi: 'Hoa Tươi & Trang Trí Sân Khấu' },
    { key: 'host_beverages_corkage', icon: '🍷', labelEn: 'Host Bar & Beverage Purchases', labelVi: 'Rượu Ngoại & Đồ Uống Chiêu Đãi' },
    { key: 'photography_video', icon: '📸', labelEn: 'Photography & Videography', labelVi: 'Quay Phim & Chụp Hình' },
    { key: 'stage_av_dj', icon: '🎵', labelEn: 'Bilingual MC, DJ & Sound/Lighting', labelVi: 'MC Song Ngữ, DJ & Âm Thanh Ánh Sáng' },
    { key: 'gifts_favors', icon: '🎁', labelEn: 'Stationery, Favors & Lì Xì Red Envelopes', labelVi: 'Thiệp Cưới, Quà Cảm Ơn & Bao Lì Xì' },
    { key: 'attire', icon: '👰', labelEn: 'Attire, Custom Áo Dài & Wedding Bands', labelVi: 'Trang Phục, Áo Dài Cưới & Nhẫn Cưới' },
    { key: 'misc', icon: '🛡️', labelEn: 'Miscellaneous Costs & Emergency Buffer', labelVi: 'Chi Phí Khác, Phát Sinh & Dự Phòng' }
  ];

  // Category Target Budgets from Setup
  const categoryBudgets = metrics.category_budgets || {};

  // Compute Category Budget vs Actual Summary
  const categorySummary = useMemo(() => {
    return masterCategories.map((cat) => {
      const targetBudget = Number(categoryBudgets[cat.key]?.estimated_cost || 0);
      const catExpenses = expenses.filter((e) => e.category === cat.key);
      const invoiced = catExpenses.reduce((sum, e) => sum + Number(e.actual_invoiced || e.estimated_cost || 0), 0);
      const paid = catExpenses.reduce((sum, e) => sum + Number(e.deposit_paid || 0), 0);
      const balanceDue = Math.max(0, invoiced - paid);
      const uncommitted = Math.max(0, targetBudget - invoiced);
      const isOverBudget = invoiced > targetBudget && targetBudget > 0;

      return {
        ...cat,
        targetBudget,
        invoiced,
        paid,
        balanceDue,
        uncommitted,
        isOverBudget,
        itemCount: catExpenses.length
      };
    });
  }, [categoryBudgets, expenses]);

  // Overall Planning Totals
  const overallTotals = useMemo(() => {
    const totalTarget = categorySummary.reduce((sum, c) => sum + c.targetBudget, 0) || Number(metrics.target_budget_cap || 0);
    const totalInvoiced = categorySummary.reduce((sum, c) => sum + c.invoiced, 0);
    const totalPaid = categorySummary.reduce((sum, c) => sum + c.paid, 0);
    const totalBalanceDue = categorySummary.reduce((sum, c) => sum + c.balanceDue, 0);
    const totalUncommitted = Math.max(0, totalTarget - totalInvoiced);
    return {
      totalTarget,
      totalInvoiced,
      totalPaid,
      totalBalanceDue,
      totalUncommitted
    };
  }, [categorySummary, metrics]);

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
          (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.payment_method && e.payment_method.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCat && matchesStat && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'due_date') {
          return new Date(a.payment_due_date || '2099-01-01').getTime() - new Date(b.payment_due_date || '2099-01-01').getTime();
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

  // Dynamic Days until due calculation relative to today
  const getDueDays = (dueDateStr: string) => {
    if (!dueDateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Quick Toggle Paid Status
  const handleToggleStatus = async (exp: Expense) => {
    setLoading(true);
    try {
      const nextStatus: PaymentStatus = exp.payment_status === 'paid' ? 'partially_paid' : 'paid';
      const updates: Partial<Expense> = {
        payment_status: nextStatus,
        deposit_paid: nextStatus === 'paid' ? (exp.actual_invoiced || exp.estimated_cost) : exp.deposit_paid
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
    if (!confirm(lang === 'en' ? 'Delete this transaction record?' : 'Xoá bản ghi chi tiêu này?')) return;
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
    setFormPaymentMethod(exp.payment_method || 'Zelle');
    setFormDueDate(exp.payment_due_date || '');
    setFormStatus(exp.payment_status || 'pending');
    setFormNotes(exp.notes || '');
    setIsAddingExpense(true);
  };

  // Open New Expense Drawer
  const handleOpenNew = (prefillCat?: ExpenseCategory, prefillVendor?: string, prefillAmount?: number) => {
    setEditingExpense(null);
    setFormCategory(prefillCat || 'venue_banquet');
    setFormVendor(prefillVendor || '');
    setFormItemDesc('');
    setFormEstimatedCost(prefillAmount ? String(prefillAmount) : '');
    setFormActualInvoiced(prefillAmount ? String(prefillAmount) : '');
    setFormDepositPaid('');
    setFormPaymentMethod('Zelle');
    setFormDueDate('2026-12-20');
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
        payment_method: formPaymentMethod,
        payment_due_date: formDueDate || '2026-12-20',
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
    const headers = ['Date', 'Category', 'Vendor / Payee', 'Description', 'Invoiced ($)', 'Paid ($)', 'Balance Due ($)', 'Due Date', 'Status', 'Payment Method', 'Notes'];
    const rows = expenses.map((e) => [
      `"${e.created_at ? e.created_at.split('T')[0] : ''}"`,
      `"${categoryNames[e.category] || e.category}"`,
      `"${(e.vendor_name || '').replace(/"/g, '""')}"`,
      `"${(e.item_description || '').replace(/"/g, '""')}"`,
      e.actual_invoiced || e.estimated_cost || 0,
      e.deposit_paid || 0,
      e.remaining_balance || 0,
      e.payment_due_date || '',
      e.payment_status || '',
      `"${(e.payment_method || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wedding_transactions_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Beverage Purchase Subtotals (No Corkage Fee)
  const beverageTotalEstimated = useMemo(() => {
    const hennessySub = hennessyBottles * hennessyPrice;
    const macallanSub = macallanBottles * macallanPrice;
    const wineSub = wineBottles * winePrice;
    const sparklingSub = sparklingBottles * sparklingPrice;
    const beerSub = beerCases * beerCasePrice;
    return hennessySub + macallanSub + wineSub + sparklingSub + beerSub + mixersFlatCost;
  }, [hennessyBottles, hennessyPrice, macallanBottles, macallanPrice, wineBottles, winePrice, sparklingBottles, sparklingPrice, beerCases, beerCasePrice, mixersFlatCost]);

  const totalBottles = hennessyBottles + macallanBottles + wineBottles + sparklingBottles;
  const beverageTargetBudget = Number(categoryBudgets.host_beverages_corkage?.estimated_cost || 5000);

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. Header Summary Metrics & KPI Cards                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Target Budget */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{lang === 'en' ? 'Target Budget Goal' : 'Ngân Sách Mục Tiêu'}</span>
            <DollarSign className="w-4 h-4 text-stone-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
            {formatMoney(overallTotals.totalTarget)}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-stone-500">
              {lang === 'en' ? 'Allocated in Setup' : 'Thiết lập ban đầu'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-bold">
              8 Pillars
            </span>
          </div>
        </div>

        {/* Total Invoiced / Committed */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{lang === 'en' ? 'Invoiced / Contracted' : 'Hóa Đơn / Đã Ký'}</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-blue-900">
            {formatMoney(overallTotals.totalInvoiced)}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-blue-600 font-medium">
              {expenses.length} {lang === 'en' ? 'Contracts Signed' : 'Hợp đồng'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
              {overallTotals.totalTarget > 0
                ? `${Math.round((overallTotals.totalInvoiced / overallTotals.totalTarget) * 100)}% Committed`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Liquid Cash Spent (Paid So Far) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{lang === 'en' ? 'Total Spent (Paid)' : 'Thực Chi (Đã Thanh Toán)'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-emerald-800">
            {formatMoney(overallTotals.totalPaid)}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-emerald-600 font-medium">
              {lang === 'en' ? 'Cash / Deposits Disbursed' : 'Tiền cọc đã giải ngân'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              {overallTotals.totalInvoiced > 0
                ? `${Math.round((overallTotals.totalPaid / overallTotals.totalInvoiced) * 100)}% Paid`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Remaining Uncommitted Budget */}
        <div className="bg-white p-5 rounded-2xl border border-gold-300 shadow-xs bg-gradient-to-br from-white to-gold-50/20">
          <div className="flex items-center justify-between text-stone-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span>{lang === 'en' ? 'Uncommitted Budget' : 'Ngân Sách Chưa Dùng'}</span>
            <Sparkles className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
            {formatMoney(overallTotals.totalUncommitted)}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-stone-500 font-medium">
              {lang === 'en' ? 'Available for hiring' : 'Sẵn sàng chọn vendor'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-100 text-stone-900 font-bold">
              {formatMoney(overallTotals.totalBalanceDue)} Due
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Upcoming Payment Deadlines Alert Banner                                */}
      {/* ========================================================================= */}
      {expenses.some(e => e.payment_status !== 'paid' && Number(e.remaining_balance || 0) > 0) && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-5 rounded-3xl border border-stone-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-gold-400 animate-pulse" />
              <h3 className="text-sm font-bold font-serif text-stone-100">
                {lang === 'en' ? 'Outstanding Vendor Payment Due Dates' : 'Hạn Thanh Toán Tiền Cọc & Hợp Đồng Còn Lại'}
              </h3>
            </div>
            <span className="text-xs text-gold-300 font-medium">
              {lang === 'en' ? 'Final Reception: Sunday, Dec 20, 2026' : 'Dạ Tiệc: Chủ Nhật, 20/12/2026'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {expenses
              .filter(e => e.payment_status !== 'paid' && Number(e.remaining_balance || 0) > 0)
              .map((e) => {
                const dueDiff = getDueDays(e.payment_due_date);
                return (
                  <div key={e.id} className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-stone-200 truncate max-w-[160px]">{e.vendor_name}</p>
                      <p className="text-[10px] text-stone-400">Due: {e.payment_due_date || 'Dec 20, 2026'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-crimson-300">{formatMoney(e.remaining_balance)}</p>
                      <span className="text-[10px] text-gold-400 font-mono">
                        {dueDiff <= 0 ? 'Due today' : `${dueDiff} days left`}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Navigation Bar & Action Toolbar                                        */}
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
            <span>{lang === 'en' ? 'Budget & Ledger' : 'Ngân Sách & Chi Tiêu'}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {expenses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('beverage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'beverage'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            <Wine className="w-4 h-4 text-purple-400" />
            <span>{lang === 'en' ? 'Banquet Alcohol Estimator' : 'Dự Tính Mua Rượu Chiêu Đãi'}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-950 font-bold">
              $0 Corkage
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
            title="Print Executive Budget Summary"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            <span>{t.print_budget_summary}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNew()}
            className="px-4 py-2 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'en' ? '+ Log Expense / Payment' : '+ Ghi Nhận Chi Tiêu'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: CATEGORY BUDGET PLANNING & TRANSACTION LEDGER                   */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* A. CATEGORY BUDGET PLANNING VS ACTUAL TABLE */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-crimson-800" />
                  <span>{lang === 'en' ? 'Category Budget Planning vs. Actual Spending' : 'Bảng Kế Hoạch Ngân Sách vs. Thực Chi'}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {lang === 'en'
                    ? 'Compares your baseline budget targets against actual signed contracts and payments made. Click any row to filter the ledger.'
                    : 'Đối chiếu chỉ tiêu ngân sách với các hợp đồng đã ký và tiền thực chi. Nhấp vào hàng để lọc danh sách chi tiêu.'}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-stone-100 text-stone-700 font-bold">
                {lang === 'en' ? 'Macro Planning View' : 'Kế Hoạch Tổng Thể'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3.5">{lang === 'en' ? 'Category Pillar' : 'Hạng Mục Chi Tiêu'}</th>
                    <th className="py-3 px-3 text-right">{lang === 'en' ? 'Target Budget' : 'Chỉ Tiêu'}</th>
                    <th className="py-3 px-3 text-right">{lang === 'en' ? 'Invoiced / Contracted' : 'Đã Ký Hợp Đồng'}</th>
                    <th className="py-3 px-3 text-right">{lang === 'en' ? 'Total Spent (Paid)' : 'Đã Thanh Toán'}</th>
                    <th className="py-3 px-3 text-right">{lang === 'en' ? 'Balance Due' : 'Còn Lại Phải Trả'}</th>
                    <th className="py-3 px-3 text-right font-bold text-emerald-800">{lang === 'en' ? 'Uncommitted Budget' : 'Ngân Sách Còn Lại'}</th>
                    <th className="py-3 px-3 text-center">{lang === 'en' ? 'Planning Status' : 'Tình Trạng'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white font-medium">
                  {categorySummary.map((cat) => {
                    const isSelected = filterCategory === cat.key;
                    return (
                      <tr
                        key={cat.key}
                        onClick={() => setFilterCategory(filterCategory === cat.key ? 'all' : cat.key)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-crimson-50/60 font-semibold' : 'hover:bg-stone-50/80'
                        }`}
                        title="Click to filter transaction ledger by this category"
                      >
                        <td className="py-3.5 px-3.5 flex items-center gap-2">
                          <span className="text-base">{cat.icon}</span>
                          <div>
                            <span className="font-bold text-stone-900 block">
                              {lang === 'en' ? cat.labelEn : cat.labelVi}
                            </span>
                            {cat.itemCount > 0 ? (
                              <span className="text-[10px] text-blue-600">
                                {cat.itemCount} {lang === 'en' ? 'transaction(s) logged' : 'khoản đã ghi'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-400 italic">
                                {lang === 'en' ? 'Looking for vendors' : 'Chưa ký hợp đồng'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right text-stone-900 font-bold">
                          {formatMoney(cat.targetBudget)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-blue-900 font-semibold">
                          {formatMoney(cat.invoiced)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-emerald-700 font-semibold">
                          {formatMoney(cat.paid)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-crimson-700 font-bold">
                          {formatMoney(cat.balanceDue)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-emerald-800">
                          {formatMoney(cat.uncommitted)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {cat.invoiced === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                              {lang === 'en' ? 'Available (100%)' : 'Chưa Chi'}
                            </span>
                          ) : cat.isOverBudget ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                              {lang === 'en' ? 'Over Budget' : 'Vượt Dự Toán'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              {Math.round((cat.invoiced / (cat.targetBudget || 1)) * 100)}% {lang === 'en' ? 'Committed' : 'Đã Dùng'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-100 font-bold text-xs border-t-2 border-stone-300 text-stone-900">
                    <td className="py-3.5 px-3.5 uppercase tracking-wider">{lang === 'en' ? 'Total Master Budget' : 'Tổng Ngân Sách'}</td>
                    <td className="py-3.5 px-3 text-right">{formatMoney(overallTotals.totalTarget)}</td>
                    <td className="py-3.5 px-3 text-right text-blue-900">{formatMoney(overallTotals.totalInvoiced)}</td>
                    <td className="py-3.5 px-3 text-right text-emerald-800">{formatMoney(overallTotals.totalPaid)}</td>
                    <td className="py-3.5 px-3 text-right text-crimson-800">{formatMoney(overallTotals.totalBalanceDue)}</td>
                    <td className="py-3.5 px-3 text-right text-emerald-900">{formatMoney(overallTotals.totalUncommitted)}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-950 font-black">
                        {overallTotals.totalTarget > 0 ? `${Math.round((overallTotals.totalPaid / overallTotals.totalTarget) * 100)}% Paid` : '0%'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* B. REAL TRANSACTION & PAYMENT LEDGER */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-700" />
                  <span>{lang === 'en' ? 'Real Transaction & Payment Ledger' : 'Sổ Chi Tiết Giao Dịch & Thanh Toán'}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {lang === 'en'
                    ? 'Records real signed vendor contracts, actual deposit disbursements, receipts, and miscellaneous costs.'
                    : 'Ghi nhận thực tế các hợp đồng đã ký, tiền cọc đã đặt, hóa đơn và các khoản chi phát sinh.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {filterCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setFilterCategory('all')}
                    className="text-xs text-crimson-700 hover:text-crimson-800 font-bold underline"
                  >
                    Clear Filter
                  </button>
                )}
                <div className="text-xs font-mono text-stone-500">
                  {filteredExpenses.length} {lang === 'en' ? 'transactions' : 'giao dịch'}
                </div>
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
                  placeholder={lang === 'en' ? 'Search vendor, note, or method...' : 'Tìm nhà cung cấp, ghi chú...'}
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
                {masterCategories.map((c) => (
                  <option key={c.key} value={c.key}>{c.icon} {lang === 'en' ? c.labelEn : c.labelVi}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
              >
                <option value="all">{lang === 'en' ? 'All Payment Statuses' : 'Tất Cả Trạng Thái'}</option>
                <option value="paid">{lang === 'en' ? 'Paid in Full' : 'Đã Thanh Toán Đầy Đủ'}</option>
                <option value="partially_paid">{lang === 'en' ? 'Deposit / Partially Paid' : 'Đã Đặt Cọc'}</option>
                <option value="pending">{lang === 'en' ? 'Payment Pending / Invoiced' : 'Chưa Thanh Toán'}</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-crimson-700 bg-white"
              >
                <option value="due_date">{lang === 'en' ? 'Sort: Due Date (Earliest)' : 'Xếp: Hạn Thanh Toán'}</option>
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
                    <th className="py-3 px-3">Vendor / Payee</th>
                    <th className="py-3 px-3">Item Description</th>
                    <th className="py-3 px-3 text-right">Invoiced ($)</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Paid ($)</th>
                    <th className="py-3 px-3 text-right text-crimson-800">Balance Due</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-stone-400">
                        <PackageCheck className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                        <p className="font-semibold text-stone-600">
                          {lang === 'en' ? 'No actual expense transactions recorded yet.' : 'Chưa có khoản chi tiêu thực tế nào.'}
                        </p>
                        <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                          {lang === 'en'
                            ? 'As you interview and sign vendors, click "+ Log Expense / Payment" above to record contracts and deposits.'
                            : 'Khi ký hợp đồng hoặc đặt cọc cho nhà cung cấp, hãy bấm "+ Ghi Nhận Chi Tiêu" ở trên.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const color = categoryColors[exp.category] || categoryColors.misc;
                      const dueDiff = getDueDays(exp.payment_due_date);
                      return (
                        <tr key={exp.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${color.bg} ${color.text} ${color.border}`}>
                              {categoryNames[exp.category] || exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-stone-900">
                            {exp.vendor_name}
                          </td>
                          <td className="py-3 px-3 text-stone-600">
                            <p className="text-[11px] truncate max-w-xs">{exp.item_description || '—'}</p>
                            {exp.notes && (
                              <p className="text-[10px] text-amber-700 italic">Note: {exp.notes}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-stone-800">
                            {formatMoney(exp.actual_invoiced || exp.estimated_cost)}
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                            {formatMoney(exp.deposit_paid)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-crimson-800">
                            {formatMoney(exp.remaining_balance)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-stone-700 block text-[11px]">{exp.payment_due_date || '—'}</span>
                            {exp.payment_status !== 'paid' && Number(exp.remaining_balance || 0) > 0 && exp.payment_due_date && (
                              <span className={`text-[10px] block font-medium ${
                                dueDiff <= 7 ? 'text-red-600 font-bold' : dueDiff <= 14 ? 'text-amber-600' : 'text-stone-400'
                              }`}>
                                {dueDiff <= 0 ? 'Due now' : `In ${dueDiff} days`}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(exp)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                                exp.payment_status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                                  : exp.payment_status === 'partially_paid' || Number(exp.deposit_paid || 0) > 0
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              }`}
                              title="Click to toggle status"
                            >
                              {exp.payment_status === 'paid' ? 'Paid' : exp.deposit_paid > 0 ? 'Deposit Paid' : 'Pending'}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                              {exp.payment_method || 'Zelle'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(exp)}
                                className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors"
                                title="Edit transaction"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="text-stone-400 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                                title="Delete transaction"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: BANQUET ALCOHOL & BEVERAGE ESTIMATOR ($0 CORKAGE)              */}
      {/* ========================================================================= */}
      {activeTab === 'beverage' && (
        <div className="space-y-6">
          {/* Venue Free Corkage Announcement */}
          <div className="bg-gradient-to-r from-purple-950 via-stone-900 to-stone-900 text-white p-6 rounded-3xl border border-purple-800/60 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <Wine className="w-6 h-6 text-gold-400" />
                  <h3 className="text-lg font-bold font-serif text-white">
                    {lang === 'en' ? 'Banquet Alcohol & Beverage Purchasing Engine' : 'Hệ Thống Tính Toán Mua Sắm Rượu & Đồ Uống'}
                  </h3>
                </div>
                <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
                  {lang === 'en'
                    ? 'Grand Harbor Restaurant policy confirmed: FREE ($0 CORKAGE FEE). You are supplying your own Hennessy, whiskey, wine, and mixers without paying any per-bottle or per-table corkage fees.'
                    : 'Chính sách Grand Harbor: HOÀN TOÀN MIỄN PHÍ MỞ CHAI ($0). Bạn tự mua Hennessy, rượu mạnh, vang và nước ngọt mà không tốn phí mở chai.'}
                </p>
              </div>
              <div className="text-right bg-emerald-950/80 px-4 py-2.5 rounded-2xl border border-emerald-500/40">
                <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">Corkage Fee</p>
                <p className="text-2xl font-bold font-serif text-emerald-400">$0.00</p>
                <p className="text-[10px] text-emerald-300">100% Free at Grand Harbor</p>
              </div>
            </div>
          </div>

          {/* Beverage Budget Comparison Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-serif font-bold text-stone-900 text-base">
                  {lang === 'en' ? 'Estimated Beverage Spend vs. Target Budget' : 'Dự Tính Chi Phí Mua Rượu vs. Ngân Sách Dự Trù'}
                </h4>
                <p className="text-xs text-stone-500">
                  {lang === 'en'
                    ? `Your Setup questionnaire allocated ${formatMoney(beverageTargetBudget)} for Host Beverages & Alcohol.`
                    : `Ngân sách dự trù cho đồ uống trong bản Thiết lập là ${formatMoney(beverageTargetBudget)}.`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-900 font-bold">
                  {totalBottles} Total Bottles
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenNew('host_beverages_corkage', 'Costco / Total Wine & More', beverageTotalEstimated)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Log Beverage Purchase' : 'Lưu Vào Chi Phí'}</span>
                </button>
              </div>
            </div>

            {/* Total Math Bar */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-stone-500 block">Total Estimated Beverage Purchases</span>
                <span className="text-2xl font-bold font-serif text-purple-950">{formatMoney(beverageTotalEstimated)}</span>
              </div>
              <div>
                <span className="text-xs text-stone-500 block">Target Beverage Budget (Setup)</span>
                <span className="text-2xl font-bold font-serif text-stone-800">{formatMoney(beverageTargetBudget)}</span>
              </div>
              <div>
                <span className="text-xs text-stone-500 block">Remaining Budget Balance</span>
                <span className={`text-2xl font-bold font-serif ${
                  beverageTargetBudget >= beverageTotalEstimated ? 'text-emerald-700' : 'text-crimson-800'
                }`}>
                  {formatMoney(Math.abs(beverageTargetBudget - beverageTotalEstimated))}
                  <span className="text-xs font-sans font-normal ml-1 text-stone-500">
                    {beverageTargetBudget >= beverageTotalEstimated ? 'under budget' : 'exceeds budget'}
                  </span>
                </span>
              </div>
            </div>

            {/* Bottle Quantities & Pricing Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hennessy VSOP */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-stone-900">Hennessy VSOP (Chào Bàn)</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Tradition: 1-2 bottles per table for table-toasting</p>
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 font-mono">
                    <span>Est. Price: $</span>
                    <input
                      type="number"
                      value={hennessyPrice}
                      onChange={(e) => setHennessyPrice(Number(e.target.value))}
                      className="w-14 px-1 py-0.5 text-center font-bold text-xs rounded border border-stone-300 bg-white"
                    />
                    <span>/ 750ml</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={hennessyBottles}
                      onChange={(e) => setHennessyBottles(Number(e.target.value))}
                      className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <span className="text-xs text-stone-500">btls</span>
                  </div>
                  <span className="text-xs font-bold text-purple-900">{formatMoney(hennessyBottles * hennessyPrice)}</span>
                </div>
              </div>

              {/* Macallan 12 / Whiskey */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-stone-900">Macallan 12 / Single Malt</span>
                  </div>
                  <p className="text-[11px] text-stone-500">VIP Family Elders & Head Table</p>
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 font-mono">
                    <span>Est. Price: $</span>
                    <input
                      type="number"
                      value={macallanPrice}
                      onChange={(e) => setMacallanPrice(Number(e.target.value))}
                      className="w-14 px-1 py-0.5 text-center font-bold text-xs rounded border border-stone-300 bg-white"
                    />
                    <span>/ 750ml</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={macallanBottles}
                      onChange={(e) => setMacallanBottles(Number(e.target.value))}
                      className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <span className="text-xs text-stone-500">btls</span>
                  </div>
                  <span className="text-xs font-bold text-amber-900">{formatMoney(macallanBottles * macallanPrice)}</span>
                </div>
              </div>

              {/* Red / White Wine */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-rose-700" />
                    <span className="text-xs font-bold text-stone-900">Cabernet / Pinot Noir / White Wine</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Dinner pairing with banquet courses</p>
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 font-mono">
                    <span>Est. Price: $</span>
                    <input
                      type="number"
                      value={winePrice}
                      onChange={(e) => setWinePrice(Number(e.target.value))}
                      className="w-14 px-1 py-0.5 text-center font-bold text-xs rounded border border-stone-300 bg-white"
                    />
                    <span>/ bottle</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={wineBottles}
                      onChange={(e) => setWineBottles(Number(e.target.value))}
                      className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <span className="text-xs text-stone-500">btls</span>
                  </div>
                  <span className="text-xs font-bold text-rose-900">{formatMoney(wineBottles * winePrice)}</span>
                </div>
              </div>

              {/* Champagne / Toast Sparkling */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-gold-600" />
                    <span className="text-xs font-bold text-stone-900">Champagne & Sparkling Prosecco</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Grand Entrance & Cake Cutting Toast</p>
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 font-mono">
                    <span>Est. Price: $</span>
                    <input
                      type="number"
                      value={sparklingPrice}
                      onChange={(e) => setSparklingPrice(Number(e.target.value))}
                      className="w-14 px-1 py-0.5 text-center font-bold text-xs rounded border border-stone-300 bg-white"
                    />
                    <span>/ bottle</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={sparklingBottles}
                      onChange={(e) => setSparklingBottles(Number(e.target.value))}
                      className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <span className="text-xs text-stone-500">btls</span>
                  </div>
                  <span className="text-xs font-bold text-stone-900">{formatMoney(sparklingBottles * sparklingPrice)}</span>
                </div>
              </div>

              {/* Beer Cases */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-stone-900">Beer (Heineken / Tsingtao / Corona)</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Chilled cans/bottles for table toast</p>
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 font-mono">
                    <span>Est. Price: $</span>
                    <input
                      type="number"
                      value={beerCasePrice}
                      onChange={(e) => setBeerCasePrice(Number(e.target.value))}
                      className="w-14 px-1 py-0.5 text-center font-bold text-xs rounded border border-stone-300 bg-white"
                    />
                    <span>/ 24-case</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={beerCases}
                      onChange={(e) => setBeerCases(Number(e.target.value))}
                      className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <span className="text-xs text-stone-500">cases</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-900">{formatMoney(beerCases * beerCasePrice)}</span>
                </div>
              </div>

              {/* Mixers, Ice & Sodas */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-stone-900">Mixers, Club Soda, Coke & Water</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Mixer supplies for cocktail service</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-xs text-stone-600 font-mono">
                    <span>$</span>
                    <input
                      type="number"
                      min={0}
                      value={mixersFlatCost}
                      onChange={(e) => setMixersFlatCost(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <span className="text-xs font-bold text-blue-900">{formatMoney(mixersFlatCost)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: PAYMENT CALENDAR & COUNTDOWN                                    */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              {t.tab_payment_calendar}
            </h3>
            <p className="text-xs text-stone-500">
              {lang === 'en'
                ? 'Chronological schedule of vendor payment deadlines leading up to Sunday, Dec 20, 2026.'
                : 'Lịch thanh toán tiền cọc và hợp đồng theo tiến độ thời gian hướng đến ngày cưới.'}
            </p>
          </div>

          <div className="space-y-4">
            {expenses.length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-8">
                {lang === 'en' ? 'No scheduled payment deadlines yet.' : 'Chưa có lịch thanh toán nào.'}
              </p>
            ) : (
              expenses
                .slice()
                .sort((a, b) => new Date(a.payment_due_date || '2099-01-01').getTime() - new Date(b.payment_due_date || '2099-01-01').getTime())
                .map((exp) => {
                  const dueDiff = getDueDays(exp.payment_due_date);
                  const isPaid = exp.payment_status === 'paid';
                  return (
                    <div
                      key={exp.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isPaid
                          ? 'bg-stone-50/60 border-stone-200 opacity-75'
                          : dueDiff <= 7
                          ? 'bg-red-50/50 border-red-200'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-sm">{exp.vendor_name}</p>
                          <p className="text-xs text-stone-500">{categoryNames[exp.category] || exp.category} • {exp.item_description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-stone-700">{exp.payment_due_date || 'Dec 20, 2026'}</p>
                          <p className={`text-[10px] font-bold ${
                            isPaid ? 'text-emerald-700' : dueDiff <= 7 ? 'text-red-700' : 'text-stone-500'
                          }`}>
                            {isPaid ? 'Settled in Full' : dueDiff <= 0 ? 'Due Today' : `Due in ${dueDiff} days`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-crimson-900">{formatMoney(exp.remaining_balance || exp.actual_invoiced || 0)}</p>
                          <span className="text-[10px] text-stone-400">Balance</span>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 4: CASHFLOW ANALYTICS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'cashflow' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              {t.tab_cashflow_analytics}
            </h3>
            <p className="text-xs text-stone-500">
              {lang === 'en'
                ? 'Overview of your total budget commitments, cash paid, and remaining capital.'
                : 'Phân tích dòng tiền, tỷ lệ giải ngân và số tiền còn lại.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allocation by Category */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-600">
                {lang === 'en' ? 'Target Budget Allocation by Pillar' : 'Phân Bổ Ngân Sách Theo Hạng Mục'}
              </h4>
              <div className="space-y-3">
                {categorySummary.map((cat) => {
                  const pct = overallTotals.totalTarget > 0 ? Math.round((cat.targetBudget / overallTotals.totalTarget) * 100) : 0;
                  return (
                    <div key={cat.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-stone-800">{cat.icon} {lang === 'en' ? cat.labelEn : cat.labelVi}</span>
                        <span className="text-stone-600 font-mono">{formatMoney(cat.targetBudget)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-crimson-800 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoiced vs Paid Comparison */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-600">
                {lang === 'en' ? 'Liquidity & Settlement Ratio' : 'Tỷ Lệ Giải Ngân Tiền Mặt'}
              </h4>
              <div className="space-y-4 pt-4">
                <div className="p-4 rounded-xl bg-white border border-stone-200">
                  <span className="text-xs text-stone-500 block">Total Budget Cap</span>
                  <span className="text-xl font-bold font-serif text-stone-900">{formatMoney(overallTotals.totalTarget)}</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-blue-200">
                  <span className="text-xs text-blue-600 block">Total Invoiced / Contracted</span>
                  <span className="text-xl font-bold font-serif text-blue-900">{formatMoney(overallTotals.totalInvoiced)}</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-emerald-200">
                  <span className="text-xs text-emerald-600 block">Liquid Cash Disbursed (Paid)</span>
                  <span className="text-xl font-bold font-serif text-emerald-800">{formatMoney(overallTotals.totalPaid)}</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-gold-300">
                  <span className="text-xs text-stone-600 block">Remaining Uncommitted Budget</span>
                  <span className="text-xl font-bold font-serif text-stone-900">{formatMoney(overallTotals.totalUncommitted)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. Add / Edit Expense Drawer Modal                                        */}
      {/* ========================================================================= */}
      {isAddingExpense && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  {editingExpense
                    ? (lang === 'en' ? 'Edit Transaction Record' : 'Sửa Giao Dịch Chi Tiêu')
                    : (lang === 'en' ? 'Log New Transaction / Payment' : 'Ghi Nhận Giao Dịch Mới')}
                </h3>
                <p className="text-xs text-stone-500">
                  {lang === 'en'
                    ? 'Record signed contracts, deposit payments, receipts, or miscellaneous items.'
                    : 'Ghi nhận hợp đồng ký mới, tiền đặt cọc hoặc các khoản chi phát sinh.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'en' ? 'Budget Category Pillar' : 'Hạng Mục Ngân Sách'} *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-crimson-700 focus:outline-none bg-white"
                  required
                >
                  {masterCategories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.icon} {lang === 'en' ? c.labelEn : c.labelVi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor / Payee Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'en' ? 'Vendor / Payee / Store Name' : 'Tên Nhà Cung Cấp / Cửa Hàng'} *
                </label>
                <input
                  type="text"
                  required
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  placeholder="e.g. Grand Harbor, Costco, Total Wine, Tiffany, Floral Studio..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                />
              </div>

              {/* Item Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'en' ? 'Item / Contract Description' : 'Mô Tả Hạng Mục / Hợp Đồng'}
                </label>
                <input
                  type="text"
                  value={formItemDesc}
                  onChange={(e) => setFormItemDesc(e.target.value)}
                  placeholder="e.g. 10 banquet tables deposit, 16 bottles of Hennessy VSOP, Wedding rings..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                />
              </div>

              {/* Amounts Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {lang === 'en' ? 'Total Invoiced / Contracted ($)' : 'Tổng Tiền Hóa Đơn / Hợp Đồng ($)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formActualInvoiced}
                    onChange={(e) => setFormActualInvoiced(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    {lang === 'en' ? 'Amount Paid Now ($)' : 'Số Tiền Đã Trả / Đặt Cọc ($)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formDepositPaid}
                    onChange={(e) => setFormDepositPaid(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/30 text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {lang === 'en' ? 'Payment Method' : 'Phương Thức Thanh Toán'}
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-crimson-700 focus:outline-none bg-white"
                  >
                    <option value="Zelle">Zelle</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash (Tiền Mặt)</option>
                    <option value="Venmo">Venmo</option>
                    <option value="Check">Check (Séc)</option>
                    <option value="Bank Wire">Bank Wire</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {lang === 'en' ? 'Payment Status' : 'Trạng Thái'}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-crimson-700 focus:outline-none bg-white"
                  >
                    <option value="pending">{lang === 'en' ? 'Pending Invoice / Balance' : 'Chưa Thanh Toán'}</option>
                    <option value="partially_paid">{lang === 'en' ? 'Deposit / Partially Paid' : 'Đã Đặt Cọc'}</option>
                    <option value="paid">{lang === 'en' ? 'Paid in Full' : 'Đã Thanh Toán Xong'}</option>
                  </select>
                </div>
              </div>

              {/* Payment Due Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'en' ? 'Payment Due Date (for balance or invoice)' : 'Hạn Chót Thanh Toán'}
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                />
              </div>

              {/* Notes & Contract Terms */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'en' ? 'Notes / Receipt Reference / Contract Terms' : 'Ghi Chú / Điều Khoản Hợp Đồng'}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Deposit paid via Zelle. Remaining 50% due 7 days before wedding. Receipt #..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingExpense ? (lang === 'en' ? 'Update Transaction' : 'Cập Nhật') : (lang === 'en' ? 'Save Transaction' : 'Lưu Giao Dịch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';
import { InspirationLink, LinkCategory, LinkStatus, ExpenseCategory } from '@/lib/types';
import { DISCORD_FORUM_TAG_MAP } from '@/lib/links/classifier';
import {
  BookmarkCheck,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Trash2,
  DollarSign,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  Radio,
  Layers,
  ArrowRight,
  Heart,
  Share2,
  X,
  Pencil,
  Eye,
  Check
} from 'lucide-react';

interface Props {
  lang: Language;
}

export const LinkVault: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];

  const [links, setLinks] = useState<InspirationLink[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSubmitter, setSelectedSubmitter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline Price Editing State
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Receipt / Image Lightbox State
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Add Link / Idea Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'link' | 'idea'>('link');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newSubmitter, setNewSubmitter] = useState<string>('Alfredo');
  const [newCategory, setNewCategory] = useState<string>('auto');
  const [addingLoading, setAddingLoading] = useState(false);

  // Convert to Expense Modal
  const [convertingLink, setConvertingLink] = useState<InspirationLink | null>(null);
  const [expenseCost, setExpenseCost] = useState<number>(0);
  const [expenseDeposit, setExpenseDeposit] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('venue_banquet');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseDueDate, setExpenseDueDate] = useState('2026-11-15');
  const [convertLoading, setConvertLoading] = useState(false);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/links');
      const data = await res.json();
      if (data.success) {
        setLinks(data.links || []);
        setCounts(data.counts || {});
      }
    } catch (e) {
      console.error('Failed to load inspiration links:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // Filter links
  const filteredLinks = links.filter(link => {
    const matchesCat = selectedCategory === 'all' || link.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || link.status === selectedStatus;
    const matchesSubmitter = selectedSubmitter === 'all' || link.submitted_by.toLowerCase() === selectedSubmitter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      link.title.toLowerCase().includes(query) ||
      (link.notes && link.notes.toLowerCase().includes(query)) ||
      (link.site_name && link.site_name.toLowerCase().includes(query));

    return matchesCat && matchesStatus && matchesSubmitter && matchesSearch;
  });

  const handleStatusChange = async (id: string, newStatus: LinkStatus) => {
    try {
      await fetch('/api/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      setLinks(prev => prev.map(l => (l.id === id ? { ...l, status: newStatus } : l)));
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleSavePrice = async (id: string, costStr: string) => {
    const trimmed = costStr.trim();
    const cost = trimmed === '' ? null : parseFloat(trimmed);
    if (trimmed !== '' && isNaN(cost!)) {
      setEditingPriceId(null);
      return;
    }

    try {
      await fetch('/api/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estimated_cost: cost })
      });
      setLinks(prev => prev.map(l => (l.id === id ? { ...l, estimated_cost: cost } : l)));
    } catch (e) {
      console.error('Failed to update price:', e);
    } finally {
      setEditingPriceId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Delete this link?' : 'Xoá liên kết này?')) return;
    try {
      await fetch(`/api/links?id=${id}`, { method: 'DELETE' });
      setLinks(prev => prev.filter(l => l.id !== id));
      setCounts(prev => ({ ...prev, all: Math.max(0, (prev.all || 1) - 1) }));
    } catch (e) {
      console.error('Failed to delete link:', e);
    }
  };

  const handleAddLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addMode === 'link' && !newUrl.trim()) return;
    if (addMode === 'idea' && !newNotes.trim() && !newTitle.trim()) return;

    setAddingLoading(true);
    try {
      const payload: any = {
        url: addMode === 'link' ? newUrl.trim() : '',
        title: addMode === 'idea' ? newTitle.trim() : undefined,
        notes: newNotes.trim(),
        submitted_by: newSubmitter
      };
      if (newCategory !== 'auto') {
        payload.category = newCategory;
      }
      if (newPrice.trim()) {
        const parsedPrice = parseFloat(newPrice.trim());
        if (!isNaN(parsedPrice)) {
          payload.estimated_cost = parsedPrice;
        }
      }

      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewUrl('');
        setNewTitle('');
        setNewNotes('');
        setNewPrice('');
        setIsAddModalOpen(false);
        await fetchLinks();
      }
    } catch (e) {
      console.error('Error creating link or idea:', e);
    } finally {
      setAddingLoading(false);
    }
  };

  const openConvertModal = (link: InspirationLink) => {
    setConvertingLink(link);
    setExpenseCost(link.estimated_cost || 0);
    setExpenseDeposit(0);
    setExpenseVendor(link.site_name || link.title.slice(0, 40));

    // Map LinkCategory to ExpenseCategory
    let mappedCat: ExpenseCategory = 'misc';
    if (link.category === 'venue') mappedCat = 'venue_banquet';
    if (link.category === 'drinks') mappedCat = 'host_beverages_corkage';
    if (link.category === 'attire') mappedCat = 'attire';
    if (link.category === 'decor') mappedCat = 'decor_floral';
    if (link.category === 'photo_video') mappedCat = 'photography_video';
    if (link.category === 'music') mappedCat = 'stage_av_dj';
    if (link.category === 'favors_misc') mappedCat = 'gifts_favors';
    setExpenseCategory(mappedCat);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLink) return;

    setConvertLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert_to_expense',
          id: convertingLink.id,
          expenseData: {
            category: expenseCategory,
            actual_invoiced: Number(expenseCost),
            deposit_paid: Number(expenseDeposit),
            vendor_name: expenseVendor,
            item_description: `${convertingLink.title} (${convertingLink.url})`,
            payment_due_date: expenseDueDate,
            notes: `Converted from Link Vault. Original note: ${convertingLink.notes || 'None'}`
          }
        })
      });

      if (res.ok) {
        setConvertingLink(null);
        await fetchLinks();
      }
    } catch (e) {
      console.error('Error converting link to expense:', e);
    } finally {
      setConvertLoading(false);
    }
  };

  const categoriesList: Array<{ id: string; label: string; emoji: string }> = [
    { id: 'all', label: lang === 'en' ? 'All Categories' : 'Tất Cả Danh Mục', emoji: '🌟' },
    { id: 'attire', label: lang === 'en' ? 'Attire & Áo Dài' : 'Áo Dài & Trang Phục', emoji: '👗' },
    { id: 'drinks', label: lang === 'en' ? 'Bar & Cognac' : 'Rượu Ngoại & Bar', emoji: '🍷' },
    { id: 'venue', label: lang === 'en' ? 'Venue & Banquet' : 'Nhà Hàng & Tiệc', emoji: '🍽' },
    { id: 'decor', label: lang === 'en' ? 'Decor & Floral' : 'Trang Trí & Hoa', emoji: '🌸' },
    { id: 'photo_video', label: lang === 'en' ? 'Photo & Video' : 'Quay Phim & Ảnh', emoji: '📸' },
    { id: 'music', label: lang === 'en' ? 'Music & DJ' : 'Âm Nhạc & DJ', emoji: '🎵' },
    { id: 'favors_misc', label: lang === 'en' ? 'Favors & Details' : 'Quà Tặng & Khác', emoji: '🎁' },
  ];

  const submitters = Array.from(new Set(['Alfredo', 'Trang', ...links.map(l => l.submitted_by).filter(Boolean)]));
  const reviewingCount = links.filter(l => l.status === 'reviewing').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Discord Live Integration Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1e1f2b] to-crimson-950 text-white p-5 sm:p-6 rounded-3xl border-2 border-gold-400/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-xs">
            <Radio className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-300">
                Discord Bot Active & Listening
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-gold-200 mt-0.5">
              {lang === 'en' ? 'Inspiration & Vendor Link Vault' : 'Kho Ý Tưởng & Liên Kết Cưới Của Hai Bạn'}
            </h2>
            <p className="text-xs text-stone-300 max-w-xl">
              {lang === 'en'
                ? 'Drop any link, receipt photo, or expense note into Discord #link-inbox. Our bot automatically classifies it, tags the category in #wedding-vault, and syncs it here!'
                : 'Chỉ cần dán bất kỳ link, ảnh hóa đơn, hoặc tin nhắn chi tiêu vào #link-inbox. Bot sẽ tự động lấy ảnh, nhận diện giá tiền và đồng bộ về đây!'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          <a
            href="https://discord.com/channels/1545698731037294592/1546744623295234048"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Open #link-inbox</span>
          </a>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-stone-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-stone-950" />
            <span>{lang === 'en' ? 'Add Link / Expense' : 'Thêm Link / Chi Tiêu'}</span>
          </button>
        </div>
      </div>

      {/* 1.5 Evening Review Queue Banner */}
      {reviewingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/90 via-[#2a1d0d] to-stone-900 border-2 border-amber-400/90 text-white p-4 sm:p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-500/40">
                  {lang === 'en' ? 'Evening Review Queue' : 'Hàng Đợi Duyệt Cuối Ngày'}
                </span>
                <span className="text-xs font-bold text-amber-200">
                  {lang === 'en' ? `${reviewingCount} pending item${reviewingCount > 1 ? 's' : ''}` : `${reviewingCount} mục chờ duyệt`}
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1">
                {lang === 'en'
                  ? 'Expenses and receipts detected from Discord or web links awaiting confirmation together tonight. Click Approve or Add to Budget!'
                  : 'Chi phí và hóa đơn từ Discord hoặc đường link đang chờ hai bạn kiểm tra tối nay. Bấm Duyệt hoặc Chuyển vào ngân sách!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'reviewing' ? 'all' : 'reviewing')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'reviewing'
                  ? 'bg-amber-400 text-stone-950 shadow-md font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/40'
              }`}
            >
              {selectedStatus === 'reviewing'
                ? (lang === 'en' ? 'Showing Review Queue ✓' : 'Đang Lọc Cần Duyệt ✓')
                : (lang === 'en' ? 'Filter Review Queue' : 'Lọc Danh Sách Chờ Duyệt')}
            </button>
          </div>
        </div>
      )}

      {/* 2. Category Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categoriesList.map(cat => {
          const isSelected = selectedCategory === cat.id;
          const count = counts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-crimson-800 text-gold-200 border border-gold-400 shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isSelected ? 'bg-crimson-950 text-gold-300' : 'bg-stone-100 text-stone-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Submitter & Status Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'en' ? 'Search links, vendors, receipts, notes...' : 'Tìm kiếm link, nhà cung cấp, hóa đơn, ghi chú...'}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson-700"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Submitter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-400 text-[11px]">{lang === 'en' ? 'By:' : 'Bởi:'}</span>
            <select
              value={selectedSubmitter}
              onChange={(e) => setSelectedSubmitter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-crimson-700 font-medium cursor-pointer"
            >
              <option value="all">{lang === 'en' ? 'All People' : 'Tất Cả Người Gửi'}</option>
              {submitters.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-400 text-[11px]">{lang === 'en' ? 'Status:' : 'Trạng thái:'}</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-crimson-700 font-medium"
            >
              <option value="all">{lang === 'en' ? 'All Statuses' : 'Tất Cả'}</option>
              <option value="saved">{lang === 'en' ? 'Saved (Idea)' : 'Đã Lưu (Ý Tưởng)'}</option>
              <option value="reviewing">{lang === 'en' ? 'Reviewing' : 'Đang Cân Nhắc'}</option>
              <option value="booked">{lang === 'en' ? 'Booked / Approved' : 'Đã Chốt / Đặt'}</option>
              <option value="archived">{lang === 'en' ? 'Archived' : 'Lưu Trữ'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Link Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-stone-400 text-sm">
          <div className="w-8 h-8 border-2 border-crimson-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>{lang === 'en' ? 'Loading saved links...' : 'Đang tải danh sách liên kết...'}</span>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-stone-200 text-stone-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-stone-800 text-base">
            {lang === 'en' ? 'No links found in this category' : 'Chưa có liên kết nào trong danh mục này'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {lang === 'en'
              ? 'Drop a link into Discord #link-inbox or click "Add Link Manually" above!'
              : 'Hãy dán link vào #link-inbox trên Discord hoặc bấm nút "Thêm Link Mới" ở trên!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLinks.map(link => {
            const catMeta = DISCORD_FORUM_TAG_MAP[link.category] || DISCORD_FORUM_TAG_MAP.decor;
            const isBooked = link.status === 'booked';
            const isReviewing = link.status === 'reviewing';

            return (
              <div
                key={link.id}
                className={`bg-white rounded-3xl border transition-all flex flex-col overflow-hidden group ${
                  isReviewing
                    ? 'border-amber-400 ring-2 ring-amber-300/60 shadow-md bg-amber-50/15'
                    : 'border-stone-200 hover:border-gold-400/80 hover:shadow-lg'
                }`}
              >
                {/* Image Thumbnail or Written Idea Header */}
                <div
                  onClick={() => link.image_url && setPreviewImage({ url: link.image_url, title: link.title })}
                  className={`relative aspect-[16/10] bg-stone-100 overflow-hidden ${link.image_url ? 'cursor-pointer' : ''}`}
                  title={link.image_url ? (lang === 'en' ? 'Click to view image/receipt' : 'Bấm để phóng to ảnh') : undefined}
                >
                  {link.image_url ? (
                    <>
                      <img
                        src={link.image_url}
                        alt={link.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-xl bg-black/75 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 shadow-lg">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'en' ? 'View Photo' : 'Xem Ảnh'}</span>
                        </span>
                      </div>
                    </>
                  ) : !link.url || link.site_name === 'Written Idea' ? (
                    <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br from-amber-50 via-rose-50/50 to-gold-100/60 border-b border-gold-300/40">
                      <div className="flex items-center gap-1.5 text-gold-800 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                        <span>Brainstorm Note</span>
                      </div>
                      <p className="text-stone-800 font-serif font-bold text-sm line-clamp-3 italic">
                        "{link.notes || link.description || link.title}"
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono">Trang & Alfredo's Wedding</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400">
                      <BookmarkCheck className="w-8 h-8 stroke-[1.5] mb-1 text-stone-300" />
                      <span className="text-[11px] font-mono uppercase tracking-wider">{link.site_name || 'Link'}</span>
                    </div>
                  )}

                  {/* Top Floating Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-xs backdrop-blur-md ${catMeta.badgeClass}`}>
                      {catMeta.emoji} {lang === 'en' ? catMeta.labelEn : catMeta.labelVi}
                    </span>
                    {isReviewing && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500 text-stone-950 shadow-xs border border-amber-300 animate-pulse">
                        REVIEW
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5 pointer-events-none">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-xs ${
                      link.submitted_by.toLowerCase() === 'trang'
                        ? 'bg-rose-500 text-white'
                        : link.submitted_by.toLowerCase() === 'alfredo'
                        ? 'bg-stone-900 text-gold-300'
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {link.submitted_by}
                    </span>
                  </div>

                  {/* Bottom Image Source Pill */}
                  <div className="absolute bottom-2 left-2.5 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs">
                      {link.site_name || 'Web'}
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {link.url ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-serif font-bold text-stone-900 hover:text-crimson-800 line-clamp-2 transition-colors flex items-start justify-between gap-1 group/title"
                      >
                        <span>{link.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover/title:text-crimson-800 shrink-0 mt-1" />
                      </a>
                    ) : (
                      <h4 className="text-sm font-serif font-bold text-stone-900 line-clamp-2">
                        💡 {link.title}
                      </h4>
                    )}

                    {link.description && link.url && (
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {link.description}
                      </p>
                    )}

                    {/* Couple User Notes */}
                    {link.notes && (
                      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs italic flex items-start gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-crimson-700 shrink-0 mt-0.5 fill-crimson-700/20" />
                        <span className="line-clamp-2">"{link.notes}"</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions & Footer */}
                  <div className="pt-3 border-t border-stone-100 space-y-2.5">
                    {/* Status & Estimated Cost Bar */}
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={link.status}
                          onChange={(e) => handleStatusChange(link.id, e.target.value as LinkStatus)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border focus:outline-none cursor-pointer ${
                            isBooked
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isReviewing
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                        >
                          <option value="saved">{lang === 'en' ? '💡 Idea / Saved' : '💡 Đã Lưu'}</option>
                          <option value="reviewing">{lang === 'en' ? '⏳ Reviewing' : '⏳ Cân Nhắc'}</option>
                          <option value="booked">{lang === 'en' ? '✅ Booked / Done' : '✅ Đã Chốt'}</option>
                          <option value="archived">{lang === 'en' ? '📦 Archive' : '📦 Lưu Trữ'}</option>
                        </select>

                        {/* Quick Approve Button for items in reviewing */}
                        {isReviewing && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(link.id, 'booked')}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            title={lang === 'en' ? 'Confirm and mark Booked' : 'Xác nhận và đánh dấu đã chốt'}
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                            <span>{lang === 'en' ? 'Approve' : 'Duyệt'}</span>
                          </button>
                        )}
                      </div>

                      {/* Price Display and Inline Edit */}
                      {editingPriceId === link.id ? (
                        <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-gold-400 shadow-2xs">
                          <span className="text-[11px] text-stone-500 font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            autoFocus
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSavePrice(link.id, tempPrice);
                              if (e.key === 'Escape') setEditingPriceId(null);
                            }}
                            placeholder="0.00"
                            className="w-16 px-1 py-0.5 text-xs font-serif font-bold text-stone-900 border-b border-stone-300 focus:outline-none focus:border-gold-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePrice(link.id, tempPrice)}
                            className="p-0.5 text-emerald-700 hover:bg-emerald-50 rounded"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPriceId(null)}
                            className="p-0.5 text-stone-400 hover:bg-stone-100 rounded"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 group/price">
                          {link.estimated_cost !== null && link.estimated_cost !== undefined ? (
                            <span className="font-serif font-bold text-stone-900 text-xs bg-gold-50/90 px-2 py-0.5 rounded-md border border-gold-300/60 shadow-2xs">
                              ${link.estimated_cost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400 font-mono">
                              {new Date(link.created_at).toLocaleDateString()}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceId(link.id);
                              setTempPrice(link.estimated_cost !== null && link.estimated_cost !== undefined ? String(link.estimated_cost) : '');
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                            title={link.estimated_cost !== null && link.estimated_cost !== undefined ? (lang === 'en' ? 'Edit price' : 'Sửa giá') : (lang === 'en' ? 'Add price' : 'Thêm giá')}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {/* Convert to Expense Button */}
                      {!link.converted_to_expense_id ? (
                        <button
                          type="button"
                          onClick={() => openConvertModal(link)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-gold-50 hover:bg-gold-100 text-gold-900 border border-gold-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Convert this vendor link directly into a budget ledger item"
                        >
                          <DollarSign className="w-3 h-3 text-gold-700" />
                          <span>{lang === 'en' ? 'Add to Budget' : 'Chuyển Vào Ngân Sách'}</span>
                        </button>
                      ) : (
                        <div className="flex-1 py-1 px-2 rounded-xl bg-emerald-50 text-emerald-800 text-[10px] font-bold text-center border border-emerald-200">
                          ✓ {lang === 'en' ? 'Tracked in Budget' : 'Đã Ghi Vào Sổ Thu Chi'}
                        </div>
                      )}

                      {/* Discord Thread Link if available */}
                      {link.discord_thread_url && (
                        <a
                          href={link.discord_thread_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                          title="View thread card in Discord #wedding-vault"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(link.id)}
                        className="p-1.5 rounded-xl hover:bg-red-50 text-stone-300 hover:text-red-600 transition-colors"
                        title="Delete link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD LINK MANUALLY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border-2 border-gold-400 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gold-50 text-gold-800">
                  <BookmarkCheck className="w-5 h-5 text-gold-700" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  {lang === 'en' ? 'Add Inspiration Link' : 'Lưu Ý Tưởng / Liên Kết Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200">
              <button
                type="button"
                onClick={() => setAddMode('link')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  addMode === 'link' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                🔗 {lang === 'en' ? 'Web Link' : 'Đường Dẫn Web'}
              </button>
              <button
                type="button"
                onClick={() => setAddMode('idea')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  addMode === 'idea' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                💡 {lang === 'en' ? 'Written Idea / Note' : 'Ghi Chú / Ý Tưởng'}
              </button>
            </div>

            <form onSubmit={handleAddLinkSubmit} className="space-y-4">
              {addMode === 'link' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    URL / Web Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://instagram.com/p/... or https://yelp.com/biz/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Idea Title / Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g. Boba bar for cocktail hour' : 'Ví dụ: Quầy trà sữa trân châu đón khách'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none"
                  >
                    <option value="auto">⚡ Auto-Detect (AI)</option>
                    <option value="attire">👗 Attire & Áo Dài</option>
                    <option value="drinks">🍷 Bar & Cognac</option>
                    <option value="venue">🍽 Venue & Banquet</option>
                    <option value="decor">🌸 Decor & Floral</option>
                    <option value="photo_video">📸 Photo & Video</option>
                    <option value="music">🎵 Music & DJ</option>
                    <option value="favors_misc">🎁 Favors & Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Submitted By
                  </label>
                  <select
                    value={newSubmitter}
                    onChange={(e) => setNewSubmitter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none"
                  >
                    <option value="Alfredo">Alfredo</option>
                    <option value="Trang">Trang</option>
                    <option value="Lindsie">Lindsie</option>
                    <option value="Wedding Party">Wedding Party</option>
                  </select>
                </div>
              </div>

              {/* Price / Estimated Cost Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  {lang === 'en' ? 'Estimated Price / Amount ($) (Optional)' : 'Giá / Chi Phí Dự Kiến ($) (Không Bắt Buộc)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-stone-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g. 300 or leave empty' : 'Ví dụ: 300 hoặc để trống'}
                    className="w-full pl-7 pr-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  {addMode === 'link' ? 'Couple Notes (Optional)' : 'Idea Details & Notes *'}
                </label>
                <textarea
                  rows={2}
                  required={addMode === 'idea'}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder={lang === 'en' ? 'Details, thoughts, or reminders for your partner...' : 'Chi tiết ý tưởng hoặc dặn dò...'}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-crimson-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={addingLoading || (addMode === 'link' ? !newUrl.trim() : (!newTitle.trim() && !newNotes.trim()))}
                  className="px-5 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {addingLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{lang === 'en' ? 'Scraping & Saving...' : 'Đang xử lý...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-gold-300" />
                      <span>{lang === 'en' ? 'Save & Cross-Post to Discord' : 'Lưu & Đăng Vào Discord'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONVERT TO BUDGET EXPENSE */}
      {convertingLink && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border-2 border-gold-400 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gold-100 text-gold-900">
                  <DollarSign className="w-5 h-5 text-gold-800" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    {lang === 'en' ? 'Convert to Budget Expense' : 'Thêm Vào Sổ Thu Chi'}
                  </h3>
                  <p className="text-[11px] text-stone-500 line-clamp-1">{convertingLink.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConvertingLink(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  required
                  value={expenseVendor}
                  onChange={(e) => setExpenseVendor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-crimson-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Total Invoiced ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={expenseCost}
                    onChange={(e) => setExpenseCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-crimson-700"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Deposit Paid ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={expenseDeposit}
                    onChange={(e) => setExpenseDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-crimson-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Budget Category
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option value="venue_banquet">Venue Banquet</option>
                    <option value="host_beverages_corkage">Host Beverages / Cognac</option>
                    <option value="attire">Custom Áo Dài / Attire</option>
                    <option value="decor_floral">Decor & Floral</option>
                    <option value="photography_video">Photography & Video</option>
                    <option value="stage_av_dj">Stage AV & DJ</option>
                    <option value="gifts_favors">Gifts & Favors</option>
                    <option value="misc">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={expenseDueDate}
                    onChange={(e) => setExpenseDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-crimson-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setConvertingLink(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={convertLoading}
                  className="px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {convertLoading ? (
                    <span>{lang === 'en' ? 'Adding...' : 'Đang lưu...'}</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-stone-950" />
                      <span>{lang === 'en' ? 'Confirm & Track in Budget' : 'Xác Nhận & Ghi Sổ'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: IMAGE / RECEIPT FULL LIGHTBOX */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] w-full bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3.5 bg-stone-950/90 flex items-center justify-between border-b border-stone-800 text-white">
              <div className="flex items-center gap-2 truncate pr-4">
                <span className="text-xs font-bold text-gold-300 uppercase tracking-wider">
                  {lang === 'en' ? 'Photo / Receipt Preview' : 'Xem Ảnh / Hóa Đơn'}
                </span>
                <span className="text-xs text-stone-400 truncate max-w-md">
                  — {previewImage.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image display */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 min-h-[300px]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Footer */}
            <div className="p-3 bg-stone-950/90 flex items-center justify-between border-t border-stone-800 text-xs">
              <span className="text-stone-400 text-[11px] truncate max-w-sm">
                {lang === 'en' ? 'Click outside to close' : 'Bấm ra ngoài để đóng'}
              </span>
              <a
                href={previewImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-stone-300" />
                <span>{lang === 'en' ? 'Open Original Image' : 'Mở Ảnh Gốc'}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

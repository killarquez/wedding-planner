'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { Milestone, MilestoneStatus, MilestonePriority } from '@/lib/types';
import {
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Layers,
  Flag,
  UserCheck
} from 'lucide-react';

interface Props {
  lang: Language;
  milestones: Milestone[];
  onRefresh: () => void;
}

export const MilestoneTimeline: React.FC<Props> = ({ lang, milestones, onRefresh }) => {
  const t = translations[lang];

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Milestone Form
  const [titleEn, setTitleEn] = useState('');
  const [titleVi, setTitleVi] = useState('');
  const [category, setCategory] = useState<'venue' | 'attire' | 'guest_rsvp' | 'logistics' | 'beverage' | 'ceremony'>('venue');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<MilestonePriority>('high');
  const [assignee, setAssignee] = useState<'Alfredo & Partner' | 'Best Man / Groomsmen' | 'Maid of Honor / Bridesmaids' | 'Family Elders'>('Alfredo & Partner');
  const [culturalNotes, setCulturalNotes] = useState('');

  const today = new Date('2026-08-30');

  const filtered = milestones.filter((m) => {
    const matchesCat = filterCategory === 'all' || m.category === filterCategory;
    const matchesStat = filterStatus === 'all' || m.status === filterStatus;
    return matchesCat && matchesStat;
  });

  const handleUpdateStatus = async (id: string, newStatus: MilestoneStatus) => {
    setLoading(true);
    try {
      await fetch('/api/milestones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_en: titleEn,
          title_vi: titleVi || titleEn,
          category,
          target_date: targetDate,
          priority,
          assignee,
          cultural_notes: culturalNotes,
          status: 'pending'
        })
      });

      setTitleEn('');
      setTitleVi('');
      setTargetDate('');
      setCulturalNotes('');
      setIsAdding(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (p: MilestonePriority) => {
    switch (p) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Milestone Sprint Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson-50 text-crimson-800 text-xs font-bold uppercase tracking-wider mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{t.milestone_sprint_title}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            {lang === 'en' ? 'Critical Milestones & Task Dependencies' : 'Tiến Độ Trọng Yếu & Nhiệm Vụ Liên Hoàn'}
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            {lang === 'en'
              ? 'Tracking menu tasting, Áo Dài custom embroidery, Chào Bàn delegation, and kitchen locks.'
              : 'Theo dõi duyệt món, may Áo Dài rồng phụng, phân công Chào Bàn và chốt bếp.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>{t.milestone_add_btn}</span>
        </button>
      </div>

      {/* New Milestone Form */}
      {isAdding && (
        <form onSubmit={handleCreateMilestone} className="bg-white p-5 rounded-2xl border-2 border-gold-400 shadow-md space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold font-serif text-stone-900">
            {lang === 'en' ? 'Add Wedding Milestone' : 'Thêm Mốc Tiến Độ Mới'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Title (EN) *</label>
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Áo Dài Final Fitting"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Title (VI)</label>
              <input
                type="text"
                value={titleVi}
                onChange={(e) => setTitleVi(e.target.value)}
                placeholder="e.g. Thử Áo Dài Lần Cuối"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Target Date *</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              >
                <option value="venue">Venue & Menu</option>
                <option value="attire">Attire & Áo Dài</option>
                <option value="guest_rsvp">Guest RSVP & Chaser</option>
                <option value="beverage">Host Bar & Spirits</option>
                <option value="ceremony">Ceremony & Chào Bàn</option>
                <option value="logistics">Logistics & Kitchen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MilestonePriority)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              >
                <option value="Alfredo & Partner">Alfredo & Partner</option>
                <option value="Best Man / Groomsmen">Best Man / Groomsmen</option>
                <option value="Maid of Honor / Bridesmaids">Maid of Honor / Bridesmaids</option>
                <option value="Family Elders">Family Elders</option>
              </select>
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Cultural & Operational Notes</label>
              <input
                type="text"
                value={culturalNotes}
                onChange={(e) => setCulturalNotes(e.target.value)}
                placeholder="e.g. Assign groomsman to hold Hennessy tray for Table Toasting"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-crimson-800 text-white rounded-lg text-xs font-bold hover:bg-crimson-900"
            >
              Save Milestone
            </button>
          </div>
        </form>
      )}

      {/* Sprint Timeline Cards */}
      <div className="space-y-3">
        {filtered.map((ms, index) => {
          const isOverdue = ms.status !== 'completed' && new Date(ms.target_date) < today;
          const isDone = ms.status === 'completed';

          return (
            <div
              key={ms.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isOverdue
                  ? 'border-red-300 bg-red-50/30'
                  : 'border-stone-200 hover:border-gold-300'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className={`text-sm sm:text-base font-bold font-serif ${isDone ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                      {lang === 'vi' ? ms.title_vi : ms.title_en}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(ms.priority)}`}>
                      {ms.priority}
                    </span>
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-600 text-white animate-pulse">
                        {t.milestone_overdue}
                      </span>
                    )}
                  </div>

                  {ms.cultural_notes && (
                    <p className="text-xs text-stone-600 italic mb-1.5">
                      💡 {ms.cultural_notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                    <span className="font-mono font-medium text-stone-700">
                      🎯 {ms.target_date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-stone-400" />
                      {ms.assignee}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Toggle Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                {(['pending', 'in_progress', 'completed'] as MilestoneStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(ms.id, st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      ms.status === st
                        ? st === 'completed'
                          ? 'bg-emerald-700 text-white'
                          : st === 'in_progress'
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-700 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st === 'completed'
                      ? (lang === 'en' ? 'Completed' : 'Đã Xong')
                      : st === 'in_progress'
                      ? (lang === 'en' ? 'In Progress' : 'Đang Làm')
                      : (lang === 'en' ? 'Pending' : 'Chờ')}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

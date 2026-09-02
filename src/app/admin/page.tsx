'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language, translations } from '@/lib/i18n';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { GuestSeatingTracker } from '@/components/admin/GuestSeatingTracker';
import { BudgetEngine } from '@/components/admin/BudgetEngine';
import { MilestoneTimeline } from '@/components/admin/MilestoneTimeline';
import { KitchenDjOverview } from '@/components/admin/KitchenDjOverview';
import { AgentWorkflowsHub } from '@/components/admin/AgentWorkflowsHub';
import { BriefingModal } from '@/components/admin/BriefingModal';
import { Table, Guest, Expense, Milestone, SongRequest, DailyBriefing } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import {
  Layers,
  DollarSign,
  CalendarCheck,
  UtensilsCrossed,
  Bot
} from 'lucide-react';

export default function AdminCrmPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'seating' | 'budget' | 'timeline' | 'kitchen_dj' | 'agents'>('seating');

  // Supabase Auth User State
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Data State
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [banquetMath, setBanquetMath] = useState<any>({
    confirmed_headcount: 0,
    required_10_top_tables: 0,
    total_tables_configured: 0,
    total_capacity_configured: 0,
    assigned_count: 0,
    unassigned_count: 0,
    empty_seats_in_active_tables: 0,
    fill_rate_percent: 0
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetMetrics, setBudgetMetrics] = useState<any>({});
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [songs, setSongs] = useState<SongRequest[]>([]);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);

  // Modals & Loaders
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

  // Check Supabase Auth
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || null);
        }
      }
    };
    checkAuth();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [tablesRes, guestsRes, budgetRes, milestonesRes, djRes, briefingRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/guests'),
        fetch('/api/budget'),
        fetch('/api/milestones'),
        fetch('/api/dj'),
        fetch('/api/agents/chaser')
      ]);

      const [tablesData, guestsData, budgetData, milestonesData, djData, briefingData] = await Promise.all([
        tablesRes.json(),
        guestsRes.json(),
        budgetRes.json(),
        milestonesRes.json(),
        djRes.json(),
        briefingRes.json()
      ]);

      if (tablesData.tables) setTables(tablesData.tables);
      if (tablesData.math) setBanquetMath(tablesData.math);
      if (guestsData.guests) setGuests(guestsData.guests);
      if (budgetData.expenses) setExpenses(budgetData.expenses);
      if (budgetData.metrics) setBudgetMetrics(budgetData.metrics);
      if (milestonesData.milestones) setMilestones(milestonesData.milestones);
      if (djData.songs) setSongs(djData.songs);
      if (briefingData.briefing) setBriefing(briefingData.briefing);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleResetSeed = async () => {
    if (!confirm(lang === 'en' ? 'Reset all data to default sequel celebration seed dataset?' : 'Khôi phục lại toàn bộ dữ liệu mẫu ban đầu?')) return;
    setIsResetting(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 pb-20">
      {/* Header Bar */}
      <AdminHeader
        lang={lang}
        userEmail={userEmail}
        onLangToggle={setLang}
        onOpenBriefing={() => setIsBriefingOpen(true)}
        onResetSeed={handleResetSeed}
        onSignOut={handleSignOut}
        isResetting={isResetting}
      />

      {/* Main Single-Pane-of-Glass Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Module Tab Navigation Bar */}
        <div className="bg-white p-1.5 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('seating')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'seating'
                ? 'bg-stone-900 text-gold-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.crm_tab_overview}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'budget'
                ? 'bg-stone-900 text-gold-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{t.crm_tab_budget}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'bg-stone-900 text-gold-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{t.crm_tab_timeline}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kitchen_dj')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'kitchen_dj'
                ? 'bg-stone-900 text-gold-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>{t.crm_tab_kitchen_dj}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'agents'
                ? 'bg-crimson-800 text-white shadow-xs'
                : 'text-crimson-800 hover:bg-crimson-50'
            }`}
          >
            <Bot className="w-4 h-4 text-gold-300" />
            <span>{t.crm_tab_agents}</span>
          </button>
        </div>

        {/* Tab Modules View */}
        {activeTab === 'seating' && (
          <GuestSeatingTracker
            lang={lang}
            tables={tables}
            guests={guests}
            banquetMath={banquetMath}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetEngine
            lang={lang}
            expenses={expenses}
            metrics={budgetMetrics}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'timeline' && (
          <MilestoneTimeline
            lang={lang}
            milestones={milestones}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'kitchen_dj' && (
          <KitchenDjOverview
            lang={lang}
            tables={tables}
            guests={guests}
            songs={songs}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'agents' && (
          <AgentWorkflowsHub
            lang={lang}
            onRefresh={fetchAllData}
            onOpenBriefing={() => setIsBriefingOpen(true)}
          />
        )}
      </main>

      {/* Daily Executive Couple Briefing Modal */}
      <BriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        lang={lang}
        briefing={briefing}
      />
    </div>
  );
}

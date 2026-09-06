'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { VenueSourcingResult, Party, Guest } from '@/lib/types';
import {
  Bot,
  Sparkles,
  Search,
  Mail,
  MessageSquare,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Building,
  Wine,
  Activity,
  Layers,
  ArrowRight,
  Phone,
  Send,
  Utensils,
  Music,
  ExternalLink,
  ShieldAlert,
  Clock
} from 'lucide-react';

interface Props {
  lang: Language;
  parties?: Party[];
  guests?: Guest[];
  onRefresh: () => void;
  onOpenBriefing: () => void;
}

export const AgentWorkflowsHub: React.FC<Props> = ({
  lang,
  parties = [],
  guests = [],
  onRefresh,
  onOpenBriefing
}) => {
  const t = translations[lang];

  // Workflow A State
  const [city, setCity] = useState('Temple City / San Gabriel Valley');
  const [tablesNeeded, setTablesNeeded] = useState(8);
  const [expectedGuests, setExpectedGuests] = useState(80);
  const [hostSuppliedDrinks, setHostSuppliedDrinks] = useState(true);
  const [courses, setCourses] = useState(8);
  const [budgetPerTable, setBudgetPerTable] = useState(800);
  const [sourcingResults, setSourcingResults] = useState<VenueSourcingResult[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<VenueSourcingResult | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Workflow B State (Interactive RSVP Pipeline Simulator)
  const [selectedPartyIdB, setSelectedPartyIdB] = useState<string>(parties[0]?.id || '');
  const [simDietaryB, setSimDietaryB] = useState<string>('Shellfish Allergy');
  const [simSongB, setSimSongB] = useState<string>('Bài Ca Tình Yêu');
  const [agentBResult, setAgentBResult] = useState<any>(null);
  const [loadingB, setLoadingB] = useState(false);
  const [copiedBilingualEmail, setCopiedBilingualEmail] = useState(false);

  // Workflow C State (Deadlines & Chaser)
  const [chaserReport, setChaserReport] = useState<any>(null);
  const [loadingC, setLoadingC] = useState(false);
  const [copiedNudgeId, setCopiedNudgeId] = useState<string | null>(null);

  // 1. Run Venue Sourcing Agent (Workflow A)
  const handleRunVenueAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingA(true);
    try {
      const res = await fetch('/api/agents/venue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          tablesNeeded: Number(tablesNeeded),
          expectedGuests: Number(expectedGuests),
          hostSuppliedDrinks,
          asianBanquetCourses: Number(courses),
          budgetPerTableMax: Number(budgetPerTable)
        })
      });
      const data = await res.json();
      if (data.venues) {
        setSourcingResults(data.venues);
        setSelectedVenue(data.venues[0] || null);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingA(false);
    }
  };

  // 2. Run RSVP Pipeline Agent (Workflow B)
  const handleRunAgentBSimulation = async () => {
    setLoadingB(true);
    try {
      const selectedParty = parties.find(p => p.id === selectedPartyIdB) || parties[0];
      const partyGuests = guests.filter(g => g.party_id === selectedParty?.id);

      const payload = {
        party_id: selectedParty?.id || `party-${Date.now()}`,
        contact_email: selectedParty?.contact_email || 'guest@example.com',
        contact_phone: selectedParty?.contact_phone || '+1 (714) 555-0100',
        guests: partyGuests.map((g, idx) => ({
          guest_id: g.id,
          first_name: g.first_name,
          last_name: g.last_name,
          rsvp_status: 'attending',
          dietary_restrictions: idx === 0 && simDietaryB ? [simDietaryB] : [],
          dietary_notes: idx === 0 && simDietaryB ? `Strict ${simDietaryB} - requires kitchen substitution` : ''
        })),
        song_request: simSongB ? {
          song_title: simSongB,
          artist: 'Guest Requested'
        } : undefined
      };

      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setAgentBResult(data);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingB(false);
    }
  };

  // 3. Run Deadlines & Chaser Agent (Workflow C)
  const handleRunChaserAgent = async () => {
    setLoadingC(true);
    try {
      const res = await fetch('/api/agents/chaser', { method: 'POST' });
      const data = await res.json();
      setChaserReport(data);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingC(false);
    }
  };

  const copyToClipboard = (text: string, callback: () => void) => {
    navigator.clipboard.writeText(text);
    callback();
  };

  return (
    <div className="space-y-12">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gold-500 text-stone-950 flex items-center justify-center font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-100">
              {lang === 'en' ? 'Autonomous AI Workflows & Couple Automation Engine' : 'Trung Tâm Trợ Lý AI & Tự Động Hóa Hôn Lễ'}
            </h2>
            <p className="text-xs text-stone-400">
              {lang === 'en'
                ? 'Three specialized agentic pipelines: Venue Procurement (Agent A), Live RSVP & Kitchen/DJ Dispatch (Agent B), and Deadlines & Chaser (Agent C).'
                : '3 quy trình AI chuyên biệt: Đàm phán địa điểm tiệc (Agent A), Điều phối phản hồi RSVP (Agent B), và Nhắc hẹn tự động (Agent C).'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WORKFLOW A: AUTONOMOUS VENUE SOURCING AGENT                               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-crimson-50 text-crimson-800 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                {t.agent_a_title}
              </h3>
              <p className="text-xs text-stone-500">
                {t.agent_a_desc}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-crimson-100 text-crimson-900 text-xs font-bold shrink-0">
            Agent A
          </span>
        </div>

        {/* Input Parameters Form */}
        <form onSubmit={handleRunVenueAgent} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Target Region / City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Expected Guests</label>
              <input
                type="number"
                value={expectedGuests}
                onChange={(e) => setExpectedGuests(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">10-Top Tables</label>
              <input
                type="number"
                value={tablesNeeded}
                onChange={(e) => setTablesNeeded(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Banquet Courses</label>
              <input
                type="number"
                value={courses}
                onChange={(e) => setCourses(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={hostSuppliedDrinks}
                onChange={(e) => setHostSuppliedDrinks(e.target.checked)}
                className="rounded text-crimson-800 focus:ring-crimson-700"
              />
              <span>Couple Supplies Own Spirits & Hennessy XO (Requires Outside Corkage Allowance)</span>
            </label>

            <button
              type="submit"
              disabled={loadingA}
              className="px-5 py-2 bg-crimson-800 hover:bg-crimson-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {loadingA ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sourcing Venues...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{t.run_agent_btn}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sourcing Results & Email Draft */}
        {sourcingResults.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-stone-100 animate-fade-in">
            <h4 className="font-serif font-bold text-stone-900 text-base">
              Agent Sourcing Matches & Negotiation Status
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sourcingResults.map((venue) => (
                <div
                  key={venue.id}
                  onClick={() => setSelectedVenue(venue)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedVenue?.id === venue.id
                      ? 'border-crimson-700 bg-crimson-50/40 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-stone-900 text-sm truncate">{venue.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-900">
                      Score {venue.score}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-2">{venue.location}</p>
                  <div className="text-xs space-y-1 text-stone-700">
                    <p><span className="font-medium">Corkage:</span> {venue.corkage_policy}</p>
                    <p><span className="font-medium">Capacity:</span> {venue.ten_top_tables_capacity} ten-top tables</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedVenue && (
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-crimson-700" />
                    <span>Auto-Drafted Negotiation Inquiry ({selectedVenue.name})</span>
                  </h5>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedVenue.inquiry_email_draft_en, () => {
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    })}
                    className="px-3 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copied!' : 'Copy Draft'}</span>
                  </button>
                </div>

                <textarea
                  readOnly
                  rows={6}
                  value={selectedVenue.inquiry_email_draft_en}
                  className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono bg-white text-stone-800 leading-relaxed"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* WORKFLOW B: AUTOMATED RSVP PIPELINE & INSTANT RESPONSE                    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                {t.agent_b_title}
              </h3>
              <p className="text-xs text-stone-500">
                {t.agent_b_desc}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold shrink-0">
            Agent B
          </span>
        </div>

        {/* Pipeline Simulator Controls */}
        <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-200 space-y-4">
          <div>
            <p className="text-sm font-bold text-stone-900">
              {lang === 'en' ? 'Instant RSVP Event Dispatcher & Confirmation Engine' : 'Điều Phối Phản Hồi RSVP & Kích Hoạt Đa Kênh Tự Động'}
            </p>
            <p className="text-xs text-stone-600 mt-0.5">
              {lang === 'en'
                ? 'Select a party to simulate or review the instant automated pipeline triggered when a guest RSVPs.'
                : 'Chọn một gia đình khách mời để thử nghiệm luồng điều phối tự động khi khách xác nhận tham dự.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Select Target Party</label>
              <select
                value={selectedPartyIdB}
                onChange={(e) => setSelectedPartyIdB(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.primary_guest_name} ({p.invitation_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Simulated Dietary Restriction</label>
              <select
                value={simDietaryB}
                onChange={(e) => setSimDietaryB(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              >
                <option value="Shellfish Allergy">Shellfish Allergy (Severe)</option>
                <option value="Peanut / Tree Nut Allergy">Peanut / Nut Allergy</option>
                <option value="Gluten-Free">Gluten-Free</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="">None (Standard 8-Course)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Requested Song</label>
              <input
                type="text"
                value={simSongB}
                onChange={(e) => setSimSongB(e.target.value)}
                placeholder="e.g. Một Nhà - Da LAB"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleRunAgentBSimulation}
              disabled={loadingB}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              {loadingB ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching Pipeline...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Execute Agent B Dispatch</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Agent B Execution Report Card */}
        {agentBResult && (
          <div className="space-y-4 pt-4 border-t border-stone-100 animate-fade-in text-xs">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 flex items-center justify-between">
              <span className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-700" />
                <span>Agent B Pipeline Dispatched 4 Concurrent Automation Streams</span>
              </span>
              <span className="font-mono text-[10px] text-blue-800">
                Party: {agentBResult.party?.primary_guest_name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Stream 1: Kitchen Routing */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span>Banquet Kitchen Ticket</span>
                </div>
                <p className="text-stone-600 text-[11px]">
                  {agentBResult.agentResponse?.dietaryAlertRouted
                    ? `Routed to Chef: ${agentBResult.agentResponse?.dietaryAlertDetails?.join(', ')}`
                    : 'Standard menu confirmed. No kitchen substitution ticket needed.'}
                </p>
                <span className="text-[10px] text-emerald-700 font-bold block">✓ Status: Dispatched</span>
              </div>

              {/* Stream 2: DJ Queue */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                  <Music className="w-4 h-4 text-purple-600" />
                  <span>DJ Danny K Cue Ticket</span>
                </div>
                <p className="text-stone-600 text-[11px]">
                  {agentBResult.agentResponse?.djSongQueued
                    ? `Added to playlist: "${agentBResult.agentResponse?.djSongTitle}"`
                    : 'No song request entered.'}
                </p>
                <span className="text-[10px] text-purple-700 font-bold block">✓ Status: Queued</span>
              </div>

              {/* Stream 3: Calendar .ics */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                  <Calendar className="w-4 h-4 text-gold-600" />
                  <span>Calendar Invite (.ics)</span>
                </div>
                <p className="text-stone-600 text-[11px]">
                  Attached Dec 20, 2026 (5:30 PM PST, Grand Harbor Restaurant).
                </p>
                <span className="text-[10px] text-gold-800 font-bold block">✓ Status: Encoded</span>
              </div>
            </div>

            {/* Generated Bilingual Email Confirmation */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900">
                  Instant Confirmation Email (Generated by Agent B):
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(agentBResult.agentResponse?.emailConfirmation?.bodyEn, () => {
                    setCopiedBilingualEmail(true);
                    setTimeout(() => setCopiedBilingualEmail(false), 2000);
                  })}
                  className="px-3 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  {copiedBilingualEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBilingualEmail ? 'Copied!' : 'Copy Confirmation'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={5}
                value={agentBResult.agentResponse?.emailConfirmation?.bodyEn}
                className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono bg-white text-stone-800 leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* WORKFLOW C: INTELLIGENT DEADLINES & CHASER AGENT                          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                {t.agent_c_title}
              </h3>
              <p className="text-xs text-stone-500">
                {t.agent_c_desc}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold shrink-0">
            Agent C
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-amber-50/40 rounded-2xl border border-amber-200">
          <div>
            <p className="text-sm font-bold text-stone-900">
              {lang === 'en' ? 'Daily Pending RSVP Scanner & Executive Briefing Compiler' : 'Quét Khách Chưa Xác Nhận & Tổng Hợp Báo Cáo Điều Hành'}
            </p>
            <p className="text-xs text-stone-600 mt-0.5">
              {lang === 'en'
                ? 'Scans pending guests, groups into T-21 (3 weeks) and T-7 (1 week) windows, and prepares 1-click Native SMS reminders.'
                : 'Rà soát danh sách khách chưa phản hồi, phân nhóm T-21 và T-7 ngày, chuẩn bị tin nhắn SMS gửi trực tiếp.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunChaserAgent}
              disabled={loadingC}
              className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              {loadingC ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Executing Daily Scan...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>{t.trigger_chaser_btn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chaser Execution Output */}
        {chaserReport && (
          <div className="space-y-6 pt-4 border-t border-stone-100 animate-fade-in">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <span className="font-bold">✓ {chaserReport.statusMessage}</span>
              <button
                type="button"
                onClick={onOpenBriefing}
                className="px-3 py-1 rounded-lg bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors"
              >
                {t.view_briefing_btn}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* T-21 Nudges */}
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>T-21 Nudges Generated ({chaserReport.t21NudgesGenerated?.length || 0})</span>
                  </h5>
                  <span className="text-[10px] text-stone-400 font-mono">Cutoff: Nov 20, 2026</span>
                </div>

                {chaserReport.t21NudgesGenerated?.map((nudge: any) => (
                  <div key={nudge.guestId} className="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-stone-900">{nudge.guestName}</p>
                      <span className="text-[11px] font-mono text-stone-500">{nudge.contactPhone || nudge.contactEmail || 'No phone'}</span>
                    </div>
                    <p className="text-stone-600 italic bg-stone-50 p-2 rounded-lg border border-stone-100">
                      "{nudge.smsEn}"
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-stone-400 truncate max-w-[160px]">
                        {nudge.directRsvpLink}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(nudge.smsEn, () => {
                            setCopiedNudgeId(nudge.guestId);
                            setTimeout(() => setCopiedNudgeId(null), 2000);
                          })}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[11px] font-medium text-stone-700 flex items-center gap-1"
                        >
                          {copiedNudgeId === nudge.guestId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedNudgeId === nudge.guestId ? 'Copied' : 'Copy'}</span>
                        </button>

                        {nudge.contactPhone && (
                          <a
                            href={`sms:${nudge.contactPhone}?&body=${encodeURIComponent(nudge.smsEn)}`}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>SMS</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* T-7 Nudges */}
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>T-7 Urgent Nudges Generated ({chaserReport.t7NudgesGenerated?.length || 0})</span>
                  </h5>
                  <span className="text-[10px] text-red-600 font-bold font-mono">Imminent Cutoff</span>
                </div>

                {chaserReport.t7NudgesGenerated?.map((nudge: any) => (
                  <div key={nudge.guestId} className="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-stone-900">{nudge.guestName}</p>
                      <span className="text-[11px] font-mono text-stone-500">{nudge.contactPhone || nudge.contactEmail || 'No phone'}</span>
                    </div>
                    <p className="text-stone-600 italic bg-stone-50 p-2 rounded-lg border border-stone-100">
                      "{nudge.smsEn}"
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-stone-400 truncate max-w-[160px]">
                        {nudge.directRsvpLink}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(nudge.smsEn, () => {
                            setCopiedNudgeId(nudge.guestId);
                            setTimeout(() => setCopiedNudgeId(null), 2000);
                          })}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[11px] font-medium text-stone-700 flex items-center gap-1"
                        >
                          {copiedNudgeId === nudge.guestId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedNudgeId === nudge.guestId ? 'Copied' : 'Copy'}</span>
                        </button>

                        {nudge.contactPhone && (
                          <a
                            href={`sms:${nudge.contactPhone}?&body=${encodeURIComponent(nudge.smsEn)}`}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>SMS</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

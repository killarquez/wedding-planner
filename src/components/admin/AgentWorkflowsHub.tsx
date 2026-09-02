'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { VenueSourcingResult } from '@/lib/types';
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
  ArrowRight
} from 'lucide-react';

interface Props {
  lang: Language;
  onRefresh: () => void;
  onOpenBriefing: () => void;
}

export const AgentWorkflowsHub: React.FC<Props> = ({ lang, onRefresh, onOpenBriefing }) => {
  const t = translations[lang];

  // Workflow A State
  const [city, setCity] = useState('Westminster / Little Saigon');
  const [tablesNeeded, setTablesNeeded] = useState(9);
  const [expectedGuests, setExpectedGuests] = useState(90);
  const [hostSuppliedDrinks, setHostSuppliedDrinks] = useState(true);
  const [courses, setCourses] = useState(8);
  const [budgetPerTable, setBudgetPerTable] = useState(800);
  const [sourcingResults, setSourcingResults] = useState<VenueSourcingResult[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<VenueSourcingResult | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Workflow C State
  const [chaserReport, setChaserReport] = useState<any>(null);
  const [loadingC, setLoadingC] = useState(false);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
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
              {lang === 'en' ? 'Autonomous AI Workflows & Orchestration' : 'Trung Tâm Trợ Lý AI & Tự Động Hóa'}
            </h2>
            <p className="text-xs text-stone-400">
              {lang === 'en'
                ? 'Autonomous agents managing venue procurement, instant RSVP responses, and bilingual chasers.'
                : 'Các quy trình AI tự vận hành tìm địa điểm, tiếp nhận RSVP và gửi thông điệp nhắc hẹn.'}
            </p>
          </div>
        </div>
      </div>

      {/* Workflow A: Venue Sourcing Agent */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Target Region / City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">10-Top Tables Needed</label>
              <input
                type="number"
                value={tablesNeeded}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTablesNeeded(val);
                  setExpectedGuests(val * 10);
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Banquet Courses</label>
              <select
                value={courses}
                onChange={(e) => setCourses(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              >
                <option value={8}>8-Course Grand Banquet</option>
                <option value={10}>10-Course Imperial Banquet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Max Budget / Table ($)</label>
              <input
                type="number"
                value={budgetPerTable}
                onChange={(e) => setBudgetPerTable(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-4 flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hostSuppliedDrinks}
                  onChange={(e) => setHostSuppliedDrinks(e.target.checked)}
                  className="rounded text-crimson-800 focus:ring-crimson-700"
                />
                <span>Couple Supplies Own Spirits & Table Toasting Cognac (Requires Outside Corkage Allowance)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loadingA}
              className="px-5 py-2.5 rounded-xl bg-crimson-800 hover:bg-crimson-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              {loadingA ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Searching & Scoring Venues...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-gold-300" />
                  <span>{t.run_agent_btn}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Matrix & Email Draft Generator */}
        {sourcingResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-stone-100 animate-fade-in">
            {/* Left: Venue Comparison Table */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-stone-900 text-sm">
                {lang === 'en' ? 'Ranked Venue Comparison Matrix' : 'Bảng Xếp Hạng So Sánh Địa Điểm'}
              </h4>
              <div className="space-y-2.5">
                {sourcingResults.map((venue) => (
                  <div
                    key={venue.id}
                    onClick={() => setSelectedVenue(venue)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedVenue?.id === venue.id
                        ? 'border-crimson-800 bg-crimson-50/40 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h5 className="font-bold text-stone-900 text-sm font-serif">
                          {venue.name}
                        </h5>
                        <p className="text-xs text-stone-500">{venue.location}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold-100 text-gold-900 border border-gold-300">
                        {venue.score}/100 Match
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-stone-600 space-y-1">
                      <p>
                        <span className="font-semibold text-stone-800">Banquet Pricing:</span> from ${venue.menu_starting_price_per_table} / 10-top table
                      </p>
                      <p>
                        <span className="font-semibold text-stone-800">Corkage Policy:</span> {venue.corkage_policy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Negotiation Email Draft Drawer */}
            {selectedVenue && (
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-crimson-700" />
                    <span>Auto-Drafted Negotiation Inquiry</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard(selectedVenue.inquiry_email_draft_en)}
                    className="px-3 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copied!' : 'Copy Draft'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                      English Version (Contact: {selectedVenue.contact_email})
                    </span>
                    <textarea
                      readOnly
                      rows={6}
                      value={selectedVenue.inquiry_email_draft_en}
                      className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono bg-white text-stone-800 leading-relaxed"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                      Vietnamese Version (Bản Tiếng Việt)
                    </span>
                    <textarea
                      readOnly
                      rows={5}
                      value={selectedVenue.inquiry_email_draft_vi}
                      className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono bg-white text-stone-800 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Workflow C: Intelligent Deadlines & Chaser Agent */}
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
                ? 'Triggers T-21 and T-7 bilingual SMS/email follow-ups and recalculates 10-top banquet math.'
                : 'Tự động gửi thông điệp nhắc hẹn T-21 và T-7 ngày, cập nhật hệ số bàn tròn 10 người.'}
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
                onClick={onOpenBriefing}
                className="px-3 py-1 rounded-lg bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors"
              >
                View Full Briefing
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* T-21 Nudges */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>T-21 Nudges Generated ({chaserReport.t21NudgesGenerated?.length || 0})</span>
                </h5>
                {chaserReport.t21NudgesGenerated?.map((nudge: any) => (
                  <div key={nudge.guestId} className="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1">
                    <p className="font-bold text-stone-900">{nudge.guestName} ({nudge.contactPhone || nudge.contactEmail})</p>
                    <p className="text-stone-600 italic">SMS: "{nudge.smsEn}"</p>
                    <p className="text-[11px] text-stone-500 font-mono">Link: {nudge.directRsvpLink}</p>
                  </div>
                ))}
              </div>

              {/* T-7 Nudges */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>T-7 Urgent Nudges Generated ({chaserReport.t7NudgesGenerated?.length || 0})</span>
                </h5>
                {chaserReport.t7NudgesGenerated?.map((nudge: any) => (
                  <div key={nudge.guestId} className="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1">
                    <p className="font-bold text-stone-900">{nudge.guestName} ({nudge.contactPhone || nudge.contactEmail})</p>
                    <p className="text-stone-600 italic">SMS: "{nudge.smsEn}"</p>
                    <p className="text-[11px] text-stone-500 font-mono">Link: {nudge.directRsvpLink}</p>
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

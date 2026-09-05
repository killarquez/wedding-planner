'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { Language, translations } from '@/lib/i18n';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import {
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Utensils,
  Music,
  ArrowLeft,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  X,
  Volume2,
  ChevronRight,
  ShieldCheck,
  Undo2,
  Clock,
  QrCode
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

// Audio Feedback synthesizers (Web Audio API)
function playTone(freq: number, type: OscillatorType, duration: number, delay = 0) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

function playSuccessChime() {
  playTone(587.33, 'sine', 0.15, 0); // D5
  playTone(880, 'sine', 0.3, 0.1); // A5
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

function playWarningChime() {
  playTone(392.00, 'triangle', 0.15, 0); // G4
  playTone(329.63, 'triangle', 0.3, 0.15); // E4
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([250]);
  }
}

interface FloorStats {
  totalAttendingGuests: number;
  checkedInGuestsCount: number;
  percentCheckedIn: number;
  totalAttendingParties: number;
  checkedInPartiesCount: number;
  recentCheckIns: Array<{
    partyId: string;
    primaryGuestName: string;
    invitationCode: string;
    headcount: number;
    checkedInAt: string;
    tableInfo: string;
  }>;
}

function CheckinScannerContent() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  // Greeter Passcode Access
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Mode: 'camera' | 'manual'
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');

  // Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Search / Lookup State
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FloorStats | null>(null);
  const [allParties, setAllParties] = useState<any[]>([]);

  // Active Validation Card (when scanned or selected)
  const [activeResult, setActiveResult] = useState<any | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Check stored passcode on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wedding_greeter_unlocked');
      if (stored === 'true') {
        setIsUnlocked(true);
      }
    }
  }, []);

  // Fetch initial floor stats
  const fetchFloorData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/checkin');
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      if (data.parties) setAllParties(data.parties);
    } catch (e) {
      console.error('Failed to load floor stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchFloorData();
    }
  }, [isUnlocked]);

  // Handle Passcode Unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '121226' || pinInput === '1212') {
      setIsUnlocked(true);
      setPinError(false);
      localStorage.setItem('wedding_greeter_unlocked', 'true');
    } else {
      setPinError(true);
      playWarningChime();
    }
  };

  // Start Camera Scanner
  const startScanner = async () => {
    try {
      setCameraError(null);

      // Stop previous instance if exists
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
        } catch (e) {}
      }

      const scanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode },
        {
          fps: 12,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0
        },
        async (decodedText) => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          await handleScannedCode(decodedText);
        },
        () => {
          // Frame-by-frame no-op
        }
      );

      isScanningRef.current = true;
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError(err?.message || t.scan_camera_error);
      setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        isScanningRef.current = false;
        setCameraActive(false);
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
  };

  // Start / stop camera based on active tab and unlocked state
  useEffect(() => {
    if (isUnlocked && activeTab === 'camera' && !activeResult) {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isUnlocked, activeTab, facingMode, activeResult]);

  // Process scanned code or search click
  const handleScannedCode = async (rawInput: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/checkin?query=${encodeURIComponent(rawInput)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        playWarningChime();
        setStatusMessage({ text: data.error || 'Invitation not found', type: 'error' });
        setTimeout(() => {
          setStatusMessage(null);
          isProcessingRef.current = false;
        }, 3000);
        return;
      }

      // Valid party resolved!
      if (data.party?.is_checked_in) {
        playWarningChime();
      } else {
        playSuccessChime();
      }

      setActiveResult(data);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      console.error('Check-in lookup failed:', e);
      playWarningChime();
      setStatusMessage({ text: 'Error connecting to database', type: 'error' });
      isProcessingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Confirm Check-In Action
  const handleConfirmCheckin = async () => {
    if (!activeResult?.party?.id) return;
    try {
      setCheckingIn(true);
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_id: activeResult.party.id,
          greeter_name: 'Greeter Desk'
        })
      });
      const data = await res.json();

      if (data.success) {
        playSuccessChime();
        setStatusMessage({ text: t.checkin_success_alert, type: 'success' });
        setActiveResult((prev: any) => ({
          ...prev,
          party: {
            ...prev.party,
            is_checked_in: true,
            checked_in_at: data.checked_in_at,
            checked_in_by: data.checked_in_by
          }
        }));
        fetchFloorData();
      }
    } catch (e) {
      console.error('Failed to submit check-in:', e);
    } finally {
      setCheckingIn(false);
    }
  };

  // Undo Check-In Action
  const handleUndoCheckin = async () => {
    if (!activeResult?.party?.id) return;
    try {
      setCheckingIn(true);
      const res = await fetch(`/api/checkin?party_id=${activeResult.party.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        playWarningChime();
        setStatusMessage({ text: 'Check-in reverted', type: 'warning' });
        setActiveResult((prev: any) => ({
          ...prev,
          party: {
            ...prev.party,
            is_checked_in: false,
            checked_in_at: null
          }
        }));
        fetchFloorData();
      }
    } catch (e) {
      console.error('Failed to undo check-in:', e);
    } finally {
      setCheckingIn(false);
    }
  };

  // Reset to scan next guest
  const handleDismissResult = () => {
    setActiveResult(null);
    setStatusMessage(null);
    isProcessingRef.current = false;
  };

  // Filtered manual party list
  const filteredParties = allParties.filter((p: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.primary_guest_name?.toLowerCase().includes(q) ||
      p.invitation_code?.toLowerCase().includes(q) ||
      (p.attending_names && p.attending_names.some((n: string) => n.toLowerCase().includes(q)))
    );
  });

  // -------------------------------------------------------------
  // PIN Passcode Gate Screen
  // -------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#1c1917] via-[#292524] to-[#0c0a09] text-stone-100 flex items-center justify-center p-4">
        <div className="bg-stone-900/90 border border-gold-500/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl backdrop-blur-md text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crimson-800 to-crimson-950 border border-gold-400 text-gold-300 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-gold-100">
            {t.checkin_pin_title}
          </h2>
          <p className="text-xs text-stone-400 mt-1 mb-6">
            {t.checkin_pin_subtitle}
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••••"
                className="w-full text-center tracking-widest text-2xl font-mono py-3 px-4 bg-stone-950 border-2 border-gold-500/50 rounded-xl text-gold-300 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 placeholder:text-stone-700"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-400 mt-1.5 font-semibold animate-shake">
                  Incorrect passcode. (Try 121226)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-crimson-700 via-crimson-800 to-crimson-900 hover:from-crimson-800 hover:to-black text-white font-bold text-sm shadow-lg border border-gold-400/40 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4 text-gold-300" />
              <span>{t.checkin_pin_unlock}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-800 text-[11px] text-stone-500">
            Trang & Alfredo's Wedding Banquet • Dec 12, 2026
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // Main Check-In Scanner Screen
  // -------------------------------------------------------------
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between">
      {/* Top Reception App Bar */}
      <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-gold-500/30 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-1.5 rounded-lg border border-stone-800 hover:border-gold-500/50 text-stone-400 hover:text-gold-200 transition-colors"
              title="Return to Wedding Website"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-crimson-900 border border-gold-500 text-gold-200 font-serif font-bold text-xs flex items-center justify-center">
                囍
              </div>
              <h1 className="font-serif font-bold text-sm sm:text-base text-gold-100">
                {t.checkin_scanner_title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle currentLang={lang} onToggle={setLang} />
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gold-500/40 text-gold-300 hover:bg-gold-500/10 transition-colors"
            >
              <span>CRM</span>
            </Link>
          </div>
        </div>

        {/* Live Arrivals Floor Progress Bar */}
        {stats && (
          <div className="max-w-4xl mx-auto mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-1 mr-4">
              <div className="flex items-center gap-1 text-stone-400 font-medium">
                <Users className="w-3.5 h-3.5 text-gold-400" />
                <span>{lang === 'en' ? 'Checked In:' : 'Đã Đến:'}</span>
                <strong className="text-emerald-400 font-bold">
                  {stats.checkedInGuestsCount} / {stats.totalAttendingGuests}
                </strong>
                <span className="text-stone-500 text-[10px]">({stats.percentCheckedIn}%)</span>
              </div>

              <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, stats.percentCheckedIn)}%` }}
                />
              </div>
            </div>

            <button
              onClick={fetchFloorData}
              className="p-1 rounded text-stone-400 hover:text-gold-200 transition-colors"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-gold-400' : ''}`} />
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 flex flex-col justify-start">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-stone-900 p-1 rounded-2xl border border-gold-500/20 mb-4 shadow-inner">
          <button
            onClick={() => { setActiveTab('camera'); setActiveResult(null); }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-gradient-to-r from-crimson-800 to-crimson-900 text-gold-100 shadow-md border border-gold-400/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Camera className="w-4 h-4 text-gold-300" />
            <span>{t.scan_camera_btn}</span>
          </button>

          <button
            onClick={() => { setActiveTab('manual'); setActiveResult(null); }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-gradient-to-r from-crimson-800 to-crimson-900 text-gold-100 shadow-md border border-gold-400/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Search className="w-4 h-4 text-gold-300" />
            <span>{t.scan_manual_btn}</span>
          </button>
        </div>

        {/* Global Toast / Status Message */}
        {statusMessage && (
          <div className={`mb-4 p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : statusMessage.type === 'warning'
              ? 'bg-amber-950/80 border-amber-500 text-amber-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: Live Camera Scanner */}
        {activeTab === 'camera' && !activeResult && (
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-gold-500/40 shadow-2xl aspect-square max-w-sm mx-auto flex flex-col items-center justify-center">
              {/* html5-qrcode rendering target */}
              <div id="qr-reader" className="w-full h-full overflow-hidden" />

              {/* Decorative Luxury Reticle Overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-gold-400/60 rounded-2xl relative">
                  {/* Corner accents */}
                  <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-gold-300 rounded-tl" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-gold-300 rounded-tr" />
                  <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-gold-300 rounded-bl" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-gold-300 rounded-br" />

                  {/* Animated laser line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-crimson-500 to-transparent shadow-[0_0_8px_#ef4444] animate-bounce-slow" />
                </div>
              </div>

              {/* Camera Switch Floating Control */}
              <div className="absolute bottom-3 right-3 z-10">
                <button
                  onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                  className="p-2 rounded-full bg-stone-900/80 text-gold-300 border border-gold-500/40 backdrop-blur-sm text-xs shadow-md"
                  title="Flip camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-stone-400">
              {t.scan_point_camera}
            </p>

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs text-center">
                {cameraError}
                <button
                  onClick={() => setActiveTab('manual')}
                  className="block mx-auto mt-2 font-bold text-gold-300 underline"
                >
                  Switch to Manual Search
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Manual Search & Roster */}
        {activeTab === 'manual' && !activeResult && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.checkin_search_placeholder}
                className="w-full pl-10 pr-4 py-3 bg-stone-900 border border-gold-500/30 rounded-2xl text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-gold-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Roster List */}
            <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
              {filteredParties.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => handleScannedCode(p.invitation_code)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    p.is_checked_in
                      ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400'
                      : 'bg-stone-900/80 border-stone-800 hover:border-gold-500/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-serif font-bold text-sm text-gold-100 truncate">
                        {p.primary_guest_name}
                      </h4>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-800 text-gold-400 border border-stone-700">
                        {p.invitation_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <span>✓ {p.attending_count} Guests</span>
                      {p.table ? (
                        <span className="text-gold-300 font-semibold truncate">
                          • Table {p.table.table_number}: {p.table.name}
                        </span>
                      ) : (
                        <span className="text-stone-500 italic">• Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3">
                    {p.is_checked_in ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/50">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold-300 bg-stone-800 px-2.5 py-1 rounded-full border border-gold-500/30 hover:bg-gold-500/20">
                        <span>Check In</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {filteredParties.length === 0 && (
                <div className="text-center py-8 text-stone-500 text-xs">
                  No parties found matching "{searchQuery}".
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIVE RESULT: Table Seating & Verification Card */}
        {activeResult && (
          <div className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border-2 border-gold-400 rounded-3xl p-5 sm:p-6 shadow-2xl animate-slide-up relative">
            {/* Close / Next Guest button */}
            <button
              onClick={handleDismissResult}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Check-in Status Banner */}
            <div className="mb-4">
              {activeResult.party?.is_checked_in ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {t.checkin_already_alert} (
                    {new Date(activeResult.party.checked_in_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    )
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Ticket Pass</span>
                </div>
              )}
            </div>

            {/* Guest / Party Name */}
            <div className="mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gold-400 font-mono">
                CODE: {activeResult.party?.invitation_code}
              </span>
              <h2 className="text-2xl font-serif font-bold text-gold-100">
                {activeResult.party?.primary_guest_name}
              </h2>
            </div>

            {/* BIG BOLD ASSIGNED TABLE BADGE */}
            <div className="bg-gradient-to-br from-[#271d0e] to-[#1a1409] p-4 rounded-2xl border-2 border-gold-500/70 shadow-md mb-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 block mb-1">
                {t.checkin_table_label}
              </span>
              {activeResult.table ? (
                <div>
                  <h3 className="text-3xl sm:text-4xl font-serif font-black text-gold-200 tracking-wide">
                    TABLE {activeResult.table.table_number}
                  </h3>
                  <p className="text-xs font-semibold text-gold-300 mt-1">
                    {activeResult.table.name}
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-amber-400 font-mono">
                    Position: {activeResult.table.stage_position}
                  </span>
                </div>
              ) : (
                <div className="py-2">
                  <h3 className="text-xl font-serif font-bold text-amber-300">
                    {t.checkin_no_table}
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Please escort to Greeter Buffer Table
                  </p>
                </div>
              )}
            </div>

            {/* Headcount & Guest Roster */}
            <div className="bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800 mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-stone-400 font-medium">
                  Confirmed Headcount:
                </span>
                <span className="font-bold text-emerald-400 text-sm">
                  ✓ {activeResult.attending_headcount} Guest{activeResult.attending_headcount > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {activeResult.attending_guests?.map((g: any) => (
                  <span
                    key={g.id}
                    className="text-xs px-2.5 py-1 rounded-lg bg-stone-900 text-stone-200 border border-stone-700 font-medium"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Dietary Alert Box (Critical for Banquet Kitchen) */}
            {activeResult.dietary_alerts && activeResult.dietary_alerts.length > 0 && (
              <div className="bg-rose-950/60 border border-rose-500/60 p-3.5 rounded-2xl mb-4 text-xs">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1.5">
                  <Utensils className="w-4 h-4 text-rose-400" />
                  <span>{t.checkin_dietary_alert}</span>
                </div>
                <div className="space-y-1">
                  {activeResult.dietary_alerts.map((d: any, idx: number) => (
                    <div key={idx} className="text-rose-100 text-[11px]">
                      <strong>{d.guestName}:</strong> {d.restrictions.join(', ')}
                      {d.notes && <span className="italic text-rose-300"> ({d.notes})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5">
              {!activeResult.party?.is_checked_in ? (
                <button
                  onClick={handleConfirmCheckin}
                  disabled={checkingIn}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white font-bold text-base shadow-xl border border-emerald-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>{checkingIn ? 'Recording Check-In...' : `${t.checkin_confirm_btn} (${activeResult.attending_headcount})`}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndoCheckin}
                    disabled={checkingIn}
                    className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs border border-stone-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>{t.checkin_undo_btn}</span>
                  </button>

                  <button
                    onClick={handleDismissResult}
                    className="flex-2 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Scan Next Guest →
                  </button>
                </div>
              )}

              {!activeResult.party?.is_checked_in && (
                <button
                  onClick={handleDismissResult}
                  className="w-full py-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-400 font-medium text-xs transition-all cursor-pointer"
                >
                  Scan Next Guest
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Recent Arrivals Feed */}
      {stats && stats.recentCheckIns && stats.recentCheckIns.length > 0 && !activeResult && (
        <footer className="border-t border-stone-900 bg-stone-950/90 py-3 px-4">
          <div className="max-w-xl mx-auto">
            <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider block mb-2">
              {t.checkin_recent_title}
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {stats.recentCheckIns.slice(0, 5).map((r, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-stone-200">{r.primaryGuestName}</span>
                  <span className="text-[10px] text-gold-400 font-mono">({r.tableInfo})</span>
                </div>
              ))}
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950" />}>
      <CheckinScannerContent />
    </Suspense>
  );
}

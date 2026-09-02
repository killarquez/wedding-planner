'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'magic_link' | 'password'>('magic_link');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setIsConfigured(false);
    }

    if (urlError === 'unauthorized_email') {
      setMessage({
        type: 'error',
        text: 'This email is not authorized to access couple operations. Please sign in with an allowed admin email.'
      });
    }
  }, [urlError]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setMessage({
        type: 'error',
        text: 'Supabase environment variables are missing. Please configure .env.local.'
      });
      setLoading(false);
      return;
    }

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${siteUrl}${redirectPath}`,
        },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Magic link sent! Please check your email inbox to log in with 1 click.'
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to send magic link. Please check the email and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setMessage({
        type: 'error',
        text: 'Supabase environment variables are missing. Please configure .env.local.'
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Invalid email or password.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212] text-white selection:bg-crimson-900 selection:text-white">
      <div className="max-w-md w-full">
        {/* Back to Public Site Link */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Wedding Site</span>
          </Link>
          <span className="text-[11px] text-stone-500 font-mono">Couple Ops v1.0</span>
        </div>

        <div className="bg-stone-900/90 backdrop-blur-xl p-8 rounded-3xl border border-stone-800 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Top Gold Gradient Trim */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-crimson-700 via-gold-500 to-crimson-700" />

          {/* Emblem & Branding */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-crimson-800 to-crimson-950 text-gold-300 mx-auto flex items-center justify-center font-serif text-2xl font-bold shadow-lg border border-gold-500/30">
              囍
            </div>
            <h1 className="font-serif font-bold text-2xl text-stone-100">Couple Operations Hub</h1>
            <p className="text-xs text-stone-400">Trang & Alfredo Sequel Wedding (Dec 5, 2026)</p>
          </div>

          {!isConfigured && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Supabase Configuration Pending</span>
              </div>
              <p className="text-stone-300">
                Supabase credentials have not been configured yet in <code className="bg-stone-800 px-1.5 py-0.5 rounded text-amber-300">.env.local</code>.
              </p>
              <Link
                href="/admin"
                className="inline-block mt-2 text-xs font-bold text-gold-400 hover:text-gold-300 underline"
              >
                Proceed to Admin in Local Offline Mode &rarr;
              </Link>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex p-1 bg-stone-950 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => { setAuthMode('magic_link'); setMessage(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                authMode === 'magic_link'
                  ? 'bg-crimson-900/80 text-gold-200 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Magic Link
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setMessage(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                authMode === 'password'
                  ? 'bg-crimson-900/80 text-gold-200 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Password
            </button>
          </div>

          {/* Notifications */}
          {message && (
            <div
              className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
                message.type === 'error'
                  ? 'bg-red-950/50 border border-red-800/80 text-red-200'
                  : 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-200'
              }`}
            >
              {message.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Magic Link Form */}
          {authMode === 'magic_link' && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Couple Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alfredo@example.com or trang@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-crimson-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-crimson-800 via-crimson-700 to-crimson-900 hover:from-crimson-700 hover:to-crimson-800 text-white font-bold text-sm shadow-lg shadow-crimson-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-gold-300" />
                    <span>Send Magic Login Link</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Password Form */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alfredo@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-crimson-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-crimson-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-crimson-800 via-crimson-700 to-crimson-900 hover:from-crimson-700 hover:to-crimson-800 text-white font-bold text-sm shadow-lg shadow-crimson-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to CRM</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-stone-800 flex items-center justify-center gap-2 text-stone-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-500" />
            <span>Protected Couple Operations Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212] flex items-center justify-center text-stone-400">Loading auth...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}

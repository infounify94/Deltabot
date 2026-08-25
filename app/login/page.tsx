'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Activity, ArrowLeft, Lock, CheckCircle2, AlertCircle, User, Phone, Mail, KeyRound, Sun, Moon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  // Mode: 'signin' | 'signup'
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setMsg({ type: 'error', text: error.message });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Google sign-in failed' });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (isSignUp) {
      if (!fullName.trim()) {
        setMsg({ type: 'error', text: 'Please enter your full name.' });
        return;
      }
      if (!phone.trim()) {
        setMsg({ type: 'error', text: 'Please enter your mobile number.' });
        return;
      }
      if (!email.trim() || !password) {
        setMsg({ type: 'error', text: 'Please enter a valid email and password.' });
        return;
      }
      if (password.length < 6) {
        setMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
        return;
      }
      if (password !== confirmPassword) {
        setMsg({ type: 'error', text: 'Passwords do not match. Please re-enter to confirm.' });
        return;
      }
    } else {
      if (!email.trim() || !password) {
        setMsg({ type: 'error', text: 'Please enter both email and password.' });
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          setMsg({ type: 'error', text: error.message });
        } else if (data.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: email.trim(),
              full_name: fullName.trim(),
              phone: phone.trim(),
              created_at: new Date().toISOString(),
              is_paused: false,
            });
          } catch (profileErr) {
            console.error("Profile creation notice:", profileErr);
          }

          if (data.session) {
            window.location.href = '/dashboard';
          } else {
            setMsg({ 
              type: 'success', 
              text: 'Account registered! You can now proceed to sign in.' 
            });
            setIsSignUp(false);
          }
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setMsg({ type: 'error', text: error.message });
        } else if (data.session) {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Authentication failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col font-sans selection:bg-[#f59e0b]/20">
      
      {/* Top Navbar */}
      <nav className="w-full glass-header py-4 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-md">
            <Activity className="text-white w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-[var(--ink)]">Profit</span>
            <span className="font-bold text-lg tracking-tight text-[#d97706]">Pilot</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] flex items-center justify-center text-[var(--grey)] hover:text-[var(--ink)] transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link href="/" className="text-xs font-mono font-medium text-[var(--grey)] hover:text-[var(--ink)] flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="max-w-md w-full fintech-card p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          
          {/* Accent top line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#f59e0b] to-[#d97706]" />

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 bg-[var(--paper-2)] p-1 rounded-xl border border-[var(--hair)] text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setMsg(null);
              }}
              className={`py-2 rounded-lg transition-all ${!isSignUp ? 'bg-[#d97706] text-white shadow-sm' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setMsg(null);
              }}
              className={`py-2 rounded-lg transition-all ${isSignUp ? 'bg-[#d97706] text-white shadow-sm' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >
              Create Account
            </button>
          </div>

          {/* Card Header */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black font-mono text-[var(--ink)] tracking-tight">
              {isSignUp ? 'Create Free Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-[var(--grey)] font-mono">
              {isSignUp 
                ? 'Start your 30-day free trial on Delta Exchange' 
                : 'Sign in to access your quantitative dashboard'}
            </p>
          </div>

          {/* Error / Feedback alerts */}
          {errorParam === 'auth-failed' && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Authentication session expired. Please sign in again.</span>
            </div>
          )}

          {msg && (
            <div className={`p-3.5 rounded-xl text-xs font-mono flex items-center gap-2 ${msg.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Google Auth */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-[var(--paper)] hover:bg-[var(--raise)] text-[var(--ink)] border border-[var(--hair)] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-sm text-xs font-mono"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isSignUp ? 'Sign up with Google' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-[var(--hair)]" />
            <div className="relative bg-[var(--card)] px-3">
              <span className="text-[10px] text-[var(--grey)] uppercase font-mono font-semibold">
                Or with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3 font-mono text-xs">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--grey)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#d97706]" /> Full Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma" 
                    className="w-full bg-[var(--paper-2)] border border-[var(--hair)] rounded-xl px-3.5 py-2.5 text-[var(--ink)] placeholder:text-[var(--faint)] focus:outline-none focus:border-[#d97706] transition" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--grey)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#d97706]" /> Mobile Number
                  </label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210" 
                    className="w-full bg-[var(--paper-2)] border border-[var(--hair)] rounded-xl px-3.5 py-2.5 text-[var(--ink)] placeholder:text-[var(--faint)] focus:outline-none focus:border-[#d97706] transition" 
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[var(--grey)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#d97706]" /> Email Address
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com" 
                className="w-full bg-[var(--paper-2)] border border-[var(--hair)] rounded-xl px-3.5 py-2.5 text-[var(--ink)] placeholder:text-[var(--faint)] focus:outline-none focus:border-[#d97706] transition" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--grey)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#d97706]" /> Password {isSignUp && <span className="text-[10px] text-[var(--grey)] font-normal">(min 6 chars)</span>}
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••" 
                className="w-full bg-[var(--paper-2)] border border-[var(--hair)] rounded-xl px-3.5 py-2.5 text-[var(--ink)] placeholder:text-[var(--faint)] focus:outline-none focus:border-[#d97706] transition" 
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-[11px] font-bold text-[var(--grey)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#d97706]" /> Confirm Password
                </label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to confirm" 
                  className={`w-full bg-[var(--paper-2)] border rounded-xl px-3.5 py-2.5 text-[var(--ink)] placeholder:text-[var(--faint)] focus:outline-none transition ${confirmPassword && password !== confirmPassword ? 'border-rose-500' : 'border-[var(--hair)] focus:border-[#d97706]'}`} 
                />
                {confirmPassword && password !== confirmPassword && (
                  <span className="text-[10px] text-rose-500 mt-1 block">Passwords do not match</span>
                )}
              </div>
            )}

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#d97706] hover:bg-[#b45309] text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition disabled:opacity-50 text-xs"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account & Start Free Trial →' : 'Sign In to Command Center →'}
              </button>
            </div>
          </form>

          {/* Guarantee */}
          <div className="p-3 rounded-xl bg-[var(--paper-2)] border border-[var(--hair)] flex items-center gap-2.5 text-[11px] text-[var(--grey)] font-mono">
            <Shield className="w-4 h-4 text-[#d97706] shrink-0" />
            <span>Funds remain in your Delta Exchange account. Trade-only API architecture.</span>
          </div>

        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center font-mono text-xs">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

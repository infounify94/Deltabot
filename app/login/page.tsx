'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Activity, ArrowLeft, Lock, CheckCircle2, AlertCircle, User, Phone, Mail, KeyRound } from 'lucide-react';
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
          // Store user details into profiles table
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
              text: 'Account registered! If confirmation is required, please check your inbox, or sign in now.' 
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
    <div className="min-h-screen bg-[#0C0D10] text-[#F3F2EF] flex flex-col font-sans selection:bg-[#f09455]/30">
      
      {/* Top Navbar */}
      <nav className="w-full border-b border-white/10 bg-[#0C0D10]/80 backdrop-blur-xl py-4 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09455] via-[#e27625] to-[#d9a44e] flex items-center justify-center shadow-md">
            <Activity className="text-[#241505] w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-white">Profit</span>
            <span className="font-bold text-lg tracking-tight text-[#f09455]">Pilot</span>
          </div>
        </Link>

        <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="max-w-md w-full bg-[#15171C] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          
          {/* Top subtle accent gradient */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#f09455] via-[#f7b27c] to-[#d9a44e]" />

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 bg-[#0C0D10] p-1 rounded-xl border border-white/10 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setMsg(null);
              }}
              className={`py-2 rounded-lg transition-all ${!isSignUp ? 'bg-[#f09455] text-[#241505] shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setMsg(null);
              }}
              className={`py-2 rounded-lg transition-all ${isSignUp ? 'bg-[#f09455] text-[#241505] shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Create Account
            </button>
          </div>

          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isSignUp ? 'Create Free Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400">
              {isSignUp 
                ? 'Fill details below to start your 30-day free trial on Delta Exchange' 
                : 'Sign in to access your automated trading dashboard'}
            </p>
          </div>

          {/* URL Error Alerts */}
          {errorParam === 'auth-failed' && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Authentication session expired or failed. Please try again.</span>
            </div>
          )}

          {/* Dynamic Action Messages */}
          {msg && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 font-mono ${msg.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
              {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Google 1-Click Auth */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-md active:scale-95 text-xs sm:text-sm font-sans"
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
            <div className="absolute w-full border-t border-white/10" />
            <div className="relative bg-[#15171C] px-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                Or with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            
            {/* SIGN UP ONLY FIELDS: Full Name & Mobile */}
            {isSignUp && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#f09455]" />
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma" 
                    className="w-full bg-[#0C0D10] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#f09455] text-xs sm:text-sm transition" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#f09455]" />
                    Mobile Number
                  </label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210" 
                    className="w-full bg-[#0C0D10] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#f09455] text-xs sm:text-sm font-mono transition" 
                  />
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#f09455]" />
                Email Address
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com" 
                className="w-full bg-[#0C0D10] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#f09455] text-xs sm:text-sm transition" 
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#f09455]" />
                Password {isSignUp && <span className="text-[10px] text-slate-500 font-normal lowercase">(min 6 chars)</span>}
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••" 
                className="w-full bg-[#0C0D10] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#f09455] text-xs sm:text-sm font-mono transition" 
              />
            </div>

            {/* Confirm Password (SIGN UP ONLY) */}
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#f09455]" />
                  Confirm Password
                </label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to confirm" 
                  className={`w-full bg-[#0C0D10] border rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none text-xs sm:text-sm font-mono transition ${confirmPassword && password !== confirmPassword ? 'border-rose-500/60 focus:border-rose-500' : 'border-white/10 focus:border-[#f09455]'}`} 
                />
                {confirmPassword && password !== confirmPassword && (
                  <span className="text-[10px] text-rose-400 mt-1 block font-mono">
                    Passwords do not match
                  </span>
                )}
              </div>
            )}

            {/* Submit Button with direct UTF-8 arrow */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-b from-[#f7b27c] to-[#f09455] text-[#241505] font-black py-3.5 px-4 rounded-xl shadow-lg hover:brightness-105 active:scale-95 transition disabled:opacity-50 text-xs sm:text-sm"
              >
                {loading 
                  ? 'Processing...' 
                  : isSignUp 
                    ? 'Create Account & Start Free Trial →' 
                    : 'Sign In to Dashboard →'}
              </button>
            </div>

          </form>

          {/* Toggle between Login and Signup */}
          <div className="text-center pt-1">
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMsg(null);
              }}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              {isSignUp 
                ? 'Already have an account? Sign in here' 
                : "Don't have an account? Create one (30-day free trial)"}
            </button>
          </div>

          {/* Security Guarantee Box */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-[#f09455] shrink-0" />
            <span className="text-[11px] leading-tight">Funds remain in your Delta Exchange account. Trade-only API connection.</span>
          </div>

        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0C0D10] text-white flex items-center justify-center font-mono text-sm">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Activity, ArrowLeft, Lock, CheckCircle2, AlertCircle, User, Phone, Mail, KeyRound } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';

function LoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [isSignUp, setIsSignUp] = useState(false);
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
      if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
        setMsg({ type: 'error', text: 'Please fill out all fields.' });
        return;
      }
      if (password.length < 6) {
        setMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
        return;
      }
      if (password !== confirmPassword) {
        setMsg({ type: 'error', text: 'Passwords do not match.' });
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
          if (error.message.includes('already registered')) {
            setMsg({ type: 'error', text: 'Email already registered. Try signing in.' });
          } else {
            setMsg({ type: 'error', text: error.message });
          }
        } else if (data?.user && data?.session === null) {
          setMsg({ type: 'success', text: 'Account created! Please check your email for the verification link.' });
          setIsSignUp(false);
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login')) {
            setMsg({ type: 'error', text: 'Invalid email or password.' });
          } else {
            setMsg({ type: 'error', text: error.message });
          }
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aurora-wrapper flex flex-col">
      <div className="aurora-bg" />
      
      {/* Navigation Bar */}
      <nav className="w-full flex justify-between items-center px-4 sm:px-6 py-4 glass-header z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Activity className="text-indigo-400 w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-white">Profit</span>
            <span className="font-bold text-lg tracking-tight text-indigo-400">Pilot</span>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 z-10">
        <div className="max-w-md w-full">
          <GlassCard className="p-6 sm:p-8 space-y-6 relative overflow-hidden">
            
            {/* Accent top line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500" />

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 bg-black/40 p-1 rounded-lg border border-white/5 text-sm font-medium">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setMsg(null);
                }}
                className={`py-2 rounded-md transition-all ${!isSignUp ? 'bg-indigo-600 text-white shadow-subtle' : 'text-slate-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setMsg(null);
                }}
                className={`py-2 rounded-md transition-all ${isSignUp ? 'bg-indigo-600 text-white shadow-subtle' : 'text-slate-400 hover:text-white'}`}
              >
                Create Account
              </button>
            </div>

            {/* Card Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isSignUp ? 'Create Free Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-slate-400">
                {isSignUp 
                  ? 'Start your 30-day free trial on Delta Exchange' 
                  : 'Sign in to access your quantitative dashboard'}
              </p>
            </div>

            {/* Error / Feedback alerts */}
            {errorParam === 'auth-failed' && (
              <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Authentication session expired. Please sign in again.</span>
              </div>
            )}

            {msg && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${msg.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{msg.text}</span>
              </div>
            )}

            {/* Google Auth */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-slate-200 text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-subtle text-sm"
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
              <div className="relative bg-[#0b0c10] px-4">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Or with email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4 text-sm">
              {isSignUp && (
                <>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-400" /> Full Name
                    </label>
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma" 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" 
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-indigo-400" /> Mobile Number
                    </label>
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210" 
                      className="w-full font-mono bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" 
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-400" /> Email Address
                </label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" 
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-indigo-400" /> Password {isSignUp && <span className="text-xs text-slate-500 font-normal">(min 6 chars)</span>}
                </label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" 
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-indigo-400" /> Confirm Password
                  </label>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password to confirm" 
                    className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition ${confirmPassword && password !== confirmPassword ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'}`} 
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <span className="text-xs text-rose-500 mt-1 block">Passwords do not match</span>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition disabled:opacity-50 text-sm flex justify-center"
                >
                  {loading ? 'Processing...' : isSignUp ? 'Create Account & Start Free Trial →' : 'Sign In to Command Center →'}
                </button>
              </div>
            </form>

            {/* Guarantee */}
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3 text-xs text-teal-200/80 leading-relaxed">
              <Shield className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <p>Your funds stay in your Delta Exchange account. ProfitPilot uses trade-only API keys with no withdrawal access.</p>
            </div>

          </GlassCard>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] text-white flex items-center justify-center text-sm font-medium">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

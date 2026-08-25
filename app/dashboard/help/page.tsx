'use client';

import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Activity, 
  MessageCircle, 
  Mail, 
  Globe, 
  ShieldAlert, 
  HelpCircle, 
  ExternalLink,
  ChevronRight,
  Shield,
  BookOpen,
  Cpu,
  Layers
} from 'lucide-react';

export default function Help() {
  return (
    <div className="min-h-screen bg-[#0C0D10] text-[#F3F2EF] font-sans flex flex-col selection:bg-[#f09455]/30">
      
      {/* Shared Dashboard Navbar */}
      <nav className="w-full bg-[#121419] border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09455] via-[#e27625] to-[#d9a44e] flex items-center justify-center shadow-md">
            <Activity className="text-[#241505] w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-white">Profit</span>
            <span className="font-bold text-lg tracking-tight text-[#f09455]">Pilot</span>
          </div>
        </Link>

        {/* Dashboard Nav Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition">
            Live Terminal
          </Link>
          <Link href="/dashboard/settings" className="text-slate-400 hover:text-white transition">
            Settings &amp; Keys
          </Link>
          <Link href="/dashboard/help" className="text-[#f09455] border-b-2 border-[#f09455] pb-1 font-bold">
            Support &amp; Docs
          </Link>
        </div>

        {/* Sign Out */}
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/';
          }}
          className="text-xs font-medium text-rose-400 hover:text-rose-300 transition bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20"
        >
          Sign Out
        </button>
      </nav>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 w-full flex-1 space-y-10">
        
        {/* Header */}
        <div>
          <div className="text-xs font-mono font-bold uppercase text-[#f09455] tracking-wider mb-1">
            Support &amp; Knowledge Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            We respond within market hours.
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Execution questions, strategy mechanics, and live order assistance.
          </p>
        </div>

        {/* Support Channel Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* WhatsApp Direct */}
          <a 
            href="https://wa.me/918328217848" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-[#15171C] border border-white/10 hover:border-emerald-500/50 p-6 rounded-2xl shadow-xl transition-all group block space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Fastest
              </span>
            </div>
            <div>
              <h4 className="font-bold text-white text-base group-hover:text-emerald-400 transition">WhatsApp Support</h4>
              <div className="font-mono text-xs text-slate-400 mt-1">+91 83282 17848</div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct line to our algorithmic engineering team during live market sessions.
            </p>
          </a>

          {/* Email Support */}
          <a 
            href="mailto:support@profitpilot.in"
            className="bg-[#15171C] border border-white/10 hover:border-brand-500/50 p-6 rounded-2xl shadow-xl transition-all group block space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-[#f09455] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base group-hover:text-[#f09455] transition">Email Support</h4>
              <div className="font-mono text-xs text-slate-400 mt-1">support@profitpilot.in</div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Account configuration, billing queries, and integration assistance.
            </p>
          </a>

          {/* Emergency Stop */}
          <div className="bg-[#15171C] border border-white/10 p-6 rounded-2xl shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Emergency Stop</h4>
              <div className="font-mono text-xs text-rose-400 mt-1">Instant Halt</div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Revoking your API key on Delta Exchange cuts execution access the same millisecond.
            </p>
          </div>

          {/* Docs & Strategy */}
          <div className="bg-[#15171C] border border-white/10 p-6 rounded-2xl shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Strategy Specs</h4>
              <div className="font-mono text-xs text-blue-400 mt-1">Greeks &amp; Sizing</div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dynamic Iron Condor conversion at 0.35 Delta with continuous liquidation buffer checks.
            </p>
          </div>

        </div>

        {/* Strategy Mechanics Deep Dive */}
        <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-[#f09455]" />
            <div>
              <h3 className="text-lg font-bold text-white">How ProfitPilot Protects Your Capital</h3>
              <p className="text-xs text-slate-400">Core safety principles embedded into the multi-tenant execution daemon.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-slate-300">
            <div className="bg-[#0C0D10] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Target Delta Selection
              </div>
              <p className="text-slate-400">
                Instead of fixed distance strikes, the bot selects options with Delta ~0.15 - 0.18, giving each short strangle a high statistical probability of expiring OTM.
              </p>
            </div>

            <div className="bg-[#0C0D10] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f09455]" />
                Dynamic Wing Purchases
              </div>
              <p className="text-slate-400">
                If the underlying market trends strongly against a short leg and Delta breaches 0.35, the bot purchases outer wings to convert the trade into a defined-risk Iron Condor.
              </p>
            </div>

            <div className="bg-[#0C0D10] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Ratchet Trailing Stops
              </div>
              <p className="text-slate-400">
                Once a position hits 30% profit, trailing logic locks in partial gains to prevent sudden market reversals from erasing accumulated theta decay.
              </p>
            </div>
          </div>
        </div>

        {/* Common Questions */}
        <div className="bg-[#15171C] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10 bg-[#121419]">
            <h3 className="font-bold text-white text-base">Frequently Asked Questions</h3>
          </div>

          <div className="divide-y divide-white/5">
            {[
              {
                q: "Can you withdraw funds from my account?",
                a: "No. Your API key does not have withdrawal permissions, and Delta Exchange enforces this on their infrastructure. Funds can only ever be withdrawn to your verified bank account by you personally."
              },
              {
                q: "How are exchange fees and GST calculated?",
                a: "We deduct actual exchange taker commissions plus 18% GST from every gross trade fill, ensuring the P&L numbers on your dashboard represent true, ground-truth net returns."
              },
              {
                q: "What happens if a trade hits a stop-loss?",
                a: "When a hard stop-loss or dynamic wing conversion triggers, the trade closes cleanly. Losses are tracked and carried forward so you are never invoiced for performance fees until your account surpasses its prior High-Water Mark."
              },
              {
                q: "How do I trigger an emergency stop?",
                a: "You can click the red KILL button next to any position on your Live Terminal to exit immediately at market, or revoke the API key in your Delta Exchange settings."
              }
            ].map((faq, idx) => (
              <div key={idx} className="p-6 space-y-1.5">
                <h4 className="font-bold text-white text-sm">{faq.q}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

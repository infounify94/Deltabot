'use client';

import { useState } from 'react';
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
  Layers,
  Menu,
  X
} from 'lucide-react';

export default function Help() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Desktop Dashboard Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
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

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="hidden sm:block text-xs font-medium text-rose-400 hover:text-rose-300 transition bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20"
          >
            Sign Out
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#1B1E24] border border-white/10 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#15171C] border-b border-white/10 px-4 py-4 space-y-3 font-mono text-sm">
          <Link 
            href="/dashboard" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white border-b border-white/5"
          >
            ● Live Terminal
          </Link>
          <Link 
            href="/dashboard/settings" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white border-b border-white/5"
          >
            ⚙ Settings &amp; API Keys
          </Link>
          <Link 
            href="/dashboard/help" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#f09455] font-bold border-b border-white/5"
          >
            💬 Support &amp; Docs
          </Link>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="w-full text-left py-2 text-rose-400 font-bold"
          >
            🚪 Sign Out
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10 w-full flex-1 space-y-8 sm:space-y-10">
        
        {/* Header */}
        <div>
          <div className="text-xs font-mono font-bold uppercase text-[#f09455] tracking-wider mb-1">
            Knowledge &amp; Support Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Support &amp; Strategy Documentation
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Direct assistance, technical guides on Delta Exchange dynamic wing management, and 1-click emergency protocols.
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* WhatsApp Support */}
          <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Direct WhatsApp</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect directly with the strategy engineering team for immediate assistance.
              </p>
            </div>
            <a 
              href="https://wa.me/918328217848?text=Hello%20ProfitPilot%20Team%2C%20I%20need%20assistance%20with%20my%20options%20account"
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 hover:bg-emerald-400 transition"
            >
              Chat on WhatsApp (+91 83282 17848) <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Email Support */}
          <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-[#f09455] flex items-center justify-center border border-brand-500/20">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Email Desk</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                For detailed API audit inquiries, billing reconciliation, or institutional accounts.
              </p>
            </div>
            <a 
              href="mailto:support@profitpilot.in"
              className="w-full py-3 rounded-xl bg-[#1B1E24] hover:bg-[#262A33] text-white border border-white/10 font-bold text-xs font-mono flex items-center justify-center gap-2 transition"
            >
              support@profitpilot.in
            </a>
          </div>

          {/* Delta Exchange Portal */}
          <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Delta Exchange Portal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check manual margin balances, API key logs, and direct order books on the exchange.
              </p>
            </div>
            <a 
              href="https://www.delta.exchange/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#1B1E24] hover:bg-[#262A33] text-white border border-white/10 font-bold text-xs font-mono flex items-center justify-center gap-2 transition"
            >
              Visit Delta Exchange <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Emergency Procedure Box */}
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-rose-400">Emergency Stop &amp; Kill Switch Guide</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If you ever need to instantly halt bot activity or close positions manually, you have 3 instant options:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono pt-2">
            <div className="p-3 bg-[#0C0D10] rounded-xl border border-white/5 space-y-1">
              <div className="text-white font-bold">1. Pause New Entries</div>
              <div className="text-slate-500 text-[11px]">Click "Pause New Entries" on the Live Terminal. Open positions will continue to be safely managed until expiry, but no new strangles will be entered.</div>
            </div>
            <div className="p-3 bg-[#0C0D10] rounded-xl border border-white/5 space-y-1">
              <div className="text-white font-bold">2. Position KILL Switch</div>
              <div className="text-slate-500 text-[11px]">Click the red "KILL" button next to any open position. The engine will instantly cancel pending limit orders and market-close the position.</div>
            </div>
            <div className="p-3 bg-[#0C0D10] rounded-xl border border-white/5 space-y-1">
              <div className="text-white font-bold">3. Delete API Keys</div>
              <div className="text-slate-500 text-[11px]">Delete your API keys in the Settings tab, or delete them inside Delta Exchange. The bot will instantly lose all execution access.</div>
            </div>
          </div>
        </div>

        {/* Educational Breakdown */}
        <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#f09455]" />
            <h3 className="text-lg font-bold text-white">How the Engine Operates</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-300">
            <div className="space-y-3">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-500/20 text-[#f09455] flex items-center justify-center font-mono text-xs">1</span>
                Strangle Entry &amp; Greek Selection
              </div>
              <p className="text-slate-400">
                The engine evaluates Bitcoin volatility surfaces every 5 minutes, selecting Out-of-the-Money (OTM) calls and puts with target Deltas between 0.15 and 0.18 for daily expiries, maximizing theta decay while preserving wide standard deviation buffers.
              </p>
            </div>

            <div className="space-y-3">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs">2</span>
                Dynamic Iron Condor Wings
              </div>
              <p className="text-slate-400">
                If Bitcoin experiences sharp momentum and a threatened leg reaches &ge; 0.35 Delta, the engine executes a dynamic protective wing purchase, transforming the trade into a risk-defined Iron Condor and preventing catastrophic tail risk.
              </p>
            </div>

            <div className="space-y-3">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-xs">3</span>
                Ratchet Trailing Stops
              </div>
              <p className="text-slate-400">
                As the trade moves into profit (&ge; 50% max profit), trailing ratchet stops are automatically tightened to lock in green cycles and protect earned premium against late intraday reversals.
              </p>
            </div>

            <div className="space-y-3">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono text-xs">4</span>
                Real-Time Taker &amp; 18% GST Accounting
              </div>
              <p className="text-slate-400">
                Every calculation displayed on your dashboard accounts for Delta Exchange taker commission fees plus 18% Indian GST. The numbers you see are true net ground-truth P&amp;L.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

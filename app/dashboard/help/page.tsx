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
  X,
  Sun,
  Moon
} from 'lucide-react';

export default function Help() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans flex flex-col selection:bg-[#f59e0b]/20">
      
      {/* Shared Dashboard Navbar */}
      <nav className="w-full glass-header px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-md">
            <Activity className="text-white w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-[var(--ink)]">Profit</span>
            <span className="font-bold text-lg tracking-tight text-[#d97706]">Pilot</span>
          </div>
        </Link>

        {/* Desktop Dashboard Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium font-mono">
          <Link href="/dashboard" className="text-[var(--grey)] hover:text-[var(--ink)] transition">
            &larr; Command Center
          </Link>
          <Link href="/dashboard/settings" className="text-[var(--grey)] hover:text-[var(--ink)] transition">
            Settings &amp; Keys
          </Link>
          <Link href="/dashboard/help" className="text-[#d97706] border-b-2 border-[#d97706] pb-1 font-bold">
            Support &amp; Docs
          </Link>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] flex items-center justify-center text-[var(--grey)] hover:text-[var(--ink)] transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="hidden sm:block text-xs font-medium text-rose-500 hover:text-rose-600 transition bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20"
          >
            Sign Out
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--paper-2)] border-b border-[var(--hair)] px-4 py-4 space-y-3 font-mono text-sm">
          <Link 
            href="/dashboard" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[var(--grey)] hover:text-[var(--ink)] border-b border-[var(--hair)]"
          >
            ● Live Terminal
          </Link>
          <Link 
            href="/dashboard/settings" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[var(--grey)] hover:text-[var(--ink)] border-b border-[var(--hair)]"
          >
            ⚙ Settings &amp; API Keys
          </Link>
          <Link 
            href="/dashboard/help" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#d97706] font-bold border-b border-[var(--hair)]"
          >
            💬 Support &amp; Docs
          </Link>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10 w-full flex-1 space-y-8">
        
        {/* Header */}
        <div>
          <div className="text-xs font-mono font-bold uppercase text-[#d97706] tracking-wider mb-1">
            Knowledge &amp; Support Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono text-[var(--ink)] tracking-tight">
            Strategy Operations &amp; Assistance
          </h1>
          <p className="text-xs text-[var(--grey)] mt-1 max-w-xl font-mono">
            Direct assistance, technical guides on Delta Exchange dynamic wing management, and 1-click emergency protocols.
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* WhatsApp Support */}
          <div className="fintech-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2 font-mono">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)]">Direct WhatsApp Desk</h3>
              <p className="text-xs text-[var(--grey)] leading-relaxed">
                Connect directly with the strategy engineering team for immediate assistance.
              </p>
            </div>
            <a 
              href="https://wa.me/918328217848?text=Hello%20ProfitPilot%20Team%2C%20I%20need%20assistance%20with%20my%20options%20account"
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 transition shadow-sm"
            >
              Chat on WhatsApp (+91 83282 17848) <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Email Support */}
          <div className="fintech-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2 font-mono">
              <div className="w-10 h-10 rounded-xl bg-[var(--orange-tint)] text-[#d97706] flex items-center justify-center border border-[#d97706]/20">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)]">Email Desk</h3>
              <p className="text-xs text-[var(--grey)] leading-relaxed">
                For detailed API audit inquiries, billing reconciliation, or institutional accounts.
              </p>
            </div>
            <a 
              href="mailto:support@profitpilot.in"
              className="w-full py-3 rounded-xl bg-[var(--paper-2)] hover:bg-[var(--raise)] text-[var(--ink)] border border-[var(--hair)] font-bold text-xs font-mono flex items-center justify-center gap-2 transition"
            >
              support@profitpilot.in
            </a>
          </div>

          {/* Delta Exchange Portal */}
          <div className="fintech-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2 font-mono">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center border border-blue-200">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)]">Delta Exchange</h3>
              <p className="text-xs text-[var(--grey)] leading-relaxed">
                Check manual margin balances, API key logs, and direct order books on the exchange.
              </p>
            </div>
            <a 
              href="https://www.delta.exchange/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[var(--paper-2)] hover:bg-[var(--raise)] text-[var(--ink)] border border-[var(--hair)] font-bold text-xs font-mono flex items-center justify-center gap-2 transition"
            >
              Visit Delta Exchange <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Emergency Procedure Box */}
        <div className="fintech-card p-6 space-y-4 border-rose-200 bg-rose-50/50 dark:bg-rose-500/5">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-rose-600 font-mono">Emergency Stop Protocol</h3>
          </div>
          <p className="text-xs text-[var(--ink)] leading-relaxed font-mono">
            If you ever need to halt bot activity or close positions manually:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono pt-1">
            <div className="p-3.5 bg-[var(--card)] rounded-xl border border-[var(--hair)] space-y-1">
              <div className="text-[var(--ink)] font-bold">1. Pause New Entries</div>
              <div className="text-[var(--grey)] text-[11px]">Click "Pause New Entries" in Command Center. Open positions will continue to be safely managed until expiry, but no new strangles will be entered.</div>
            </div>
            <div className="p-3.5 bg-[var(--card)] rounded-xl border border-[var(--hair)] space-y-1">
              <div className="text-[var(--ink)] font-bold">2. Position KILL Switch</div>
              <div className="text-[var(--grey)] text-[11px]">Click the red "Emergency Market Kill" button next to any open position to immediately market-close the legs.</div>
            </div>
            <div className="p-3.5 bg-[var(--card)] rounded-xl border border-[var(--hair)] space-y-1">
              <div className="text-[var(--ink)] font-bold">3. Delete API Key</div>
              <div className="text-[var(--grey)] text-[11px]">Delete your API keys in the Settings tab, or delete them inside Delta Exchange. The bot will instantly lose execution capability.</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

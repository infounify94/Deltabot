'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardPreview } from '@/components/ui/dashboard-preview';
import { 
  Activity, 
  ArrowRight, 
  ChevronDown, 
  Moon, 
  Sun,
  Menu,
  X,
  Shield,
  Zap,
  Eye,
  BarChart3,
  Link2,
  Play,
  Monitor,
  CheckCircle2,
  Lock,
  Radio,
  Clock,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Scale
} from 'lucide-react';

export default function Home() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sliderBalance, setSliderBalance] = useState<number>(5000);
  
  // Macro Status for Live Radar
  const [macroStatus, setMacroStatus] = useState<{
    is_blocked: boolean;
    active_event: any;
    blackout_reason: string;
    blackout_end_ist: string;
    upcoming_events: any[];
  } | null>(null);

  const fxRate = 86.5;

  const fmt = (usdAmount: number) => {
    if (currency === 'INR') {
      const inr = usdAmount * fxRate;
      if (Math.abs(inr) >= 100000) return `₹${(inr / 100000).toFixed(2)} Lakh`;
      return `₹${Math.round(inr).toLocaleString('en-IN')}`;
    }
    return `$${Math.round(usdAmount).toLocaleString('en-US')}`;
  };

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

  useEffect(() => {
    fetch('/api/macro')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success) setMacroStatus(data);
      })
      .catch(console.error);
  }, []);

  // Pricing calculator
  const calcGross = sliderBalance * 0.145;
  const calcFees = sliderBalance * 0.015;
  const calcNet = calcGross - calcFees;
  const calcPerfFee = calcNet * 0.30;
  const calcTakeHome = calcNet - calcPerfFee;

  const faqs = [
    {
      q: "What is ProfitPilot?",
      a: "ProfitPilot is an automated crypto options trading platform. It connects to your Delta Exchange account, executes trades based on your configured strategy, monitors open positions, and manages risk — so you don't have to watch the market all day."
    },
    {
      q: "How does the Macro News Shield protect my capital?",
      a: "Before high-impact US economic events (such as Federal Reserve interest rate speeches, CPI inflation, or Non-Farm Payrolls), price whipsaws can easily trigger stop losses. ProfitPilot monitors global economic calendars, automatically pauses new trade entries 2 hours before the event, and resumes only after the market settles."
    },
    {
      q: "Do I keep custody of my funds?",
      a: "Yes, always. Your funds stay 100% in your Delta Exchange wallet. ProfitPilot connects via trade-only API keys that cannot initiate withdrawals. We never hold or have access to your capital."
    },
    {
      q: "Which exchange is supported?",
      a: "ProfitPilot supports Delta Exchange India (FPI-regulated, GST-compliant) and Delta Exchange Global. You choose your preferred venue during account setup."
    },
    {
      q: "How are fees calculated?",
      a: "We charge a 30% performance fee on net realized profits only. Net profit is calculated after deducting exchange trading fees and applicable GST. If a month ends in a loss, you owe nothing — and the loss carries forward to offset future gains (High-Water Mark protection)."
    },
    {
      q: "Can I pause the bot?",
      a: "Yes. You can pause new trades at any time from your dashboard. Existing open positions will continue to be monitored and managed until they close."
    },
    {
      q: "Can I close positions manually?",
      a: "Yes. Every open position has an emergency close button that triggers an immediate market exit. You also have the option to disconnect your API keys entirely, which stops all automation."
    },
    {
      q: "How do I start?",
      a: "Create a free account, connect your Delta Exchange API keys (trade-only, no withdrawal access), and activate automation. The first 30 days are completely free — no performance fees during your trial."
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans flex flex-col selection:bg-[#d97706]/15 relative overflow-x-hidden">
      
      {/* Subtle Ambient Background Mesh Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#d97706]/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 glass-header px-4 sm:px-8 py-3 flex items-center justify-between border-b border-[var(--hair)] transition-colors">
        
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-base tracking-tight text-[var(--ink)]">
            Profit<span className="text-[#d97706]">Pilot</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[var(--grey)]">
          <a href="#how-it-works" className="hover:text-[var(--ink)] transition-colors">How it works</a>
          <a href="#macro-shield" className="hover:text-[var(--ink)] transition-colors flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#d97706]" /> Macro Shield
          </a>
          <a href="#performance" className="hover:text-[var(--ink)] transition-colors">Performance</a>
          <a href="#pricing" className="hover:text-[var(--ink)] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[var(--ink)] transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="bg-[var(--paper-2)] p-0.5 rounded-lg border border-[var(--hair)] flex items-center text-xs font-medium">
            <button 
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1 rounded transition-all ${currency === 'INR' ? 'bg-[#d97706] text-white shadow-sm font-semibold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >₹ INR</button>
            <button 
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded transition-all ${currency === 'USD' ? 'bg-[#d97706] text-white shadow-sm font-semibold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >$ USD</button>
          </div>

          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] flex items-center justify-center text-[var(--grey)] hover:text-[var(--ink)] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link href="/login" className="text-[13px] font-medium text-[var(--grey)] hover:text-[var(--ink)] px-2.5 py-1 hidden sm:block transition-colors">
            Log in
          </Link>
          <Link href="/login" className="bg-[#d97706] hover:bg-[#b45309] text-white font-semibold text-xs sm:text-[13px] px-4 py-2 rounded-lg shadow-subtle transition-all active:scale-95">
            Start free trial
          </Link>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--paper-2)] border-b border-[var(--hair)] px-6 py-4 space-y-3 text-sm font-medium animate-in slide-in-from-top-2">
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)]">How it works</a>
          <a href="#macro-shield" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)] flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#d97706]" /> Macro Shield
          </a>
          <a href="#performance" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)]">Performance</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)]">Pricing</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)]">FAQ</a>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#d97706] font-semibold border-t border-[var(--hair)] mt-2">
            Access Dashboard &rarr;
          </Link>
        </div>
      )}

      {/* LIVE MACRO RISK TICKER */}
      <div className="bg-[var(--paper-2)] border-b border-[var(--hair)] py-2.5 px-4 text-xs font-mono text-[var(--ink)] overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            {macroStatus?.is_blocked ? (
              <span className="flex items-center gap-2 text-amber-600 font-semibold shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span>Macro Gate Active: {macroStatus.active_event?.title} ({macroStatus.active_event?.time_ist})</span>
                <span className="text-[var(--grey)] font-normal hidden sm:inline">• Standby until {macroStatus.blackout_end_ist}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-emerald-600 font-medium shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>All Global Macro Shields Green</span>
                <span className="text-[var(--grey)] font-normal hidden sm:inline">• 4-Ring Institutional Risk Architecture Live</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--grey)] hidden md:block shrink-0">
            Regulated Delta Exchange India &amp; Global Options
          </span>
        </div>
      </div>

      <main className="flex-1">

        {/* HERO */}
        <section className="py-14 sm:py-20 lg:py-24 border-b border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* Left Column */}
              <div className="space-y-6 text-center lg:text-left">
                <div className="flex justify-center lg:justify-start">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#d97706] uppercase tracking-wider bg-[#d97706]/10 px-3.5 py-1.5 rounded-full border border-[#d97706]/20 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" /> Institutional Options Automation
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-[var(--ink)] leading-[1.12]">
                  Your options strategy.{' '}
                  <span className="bg-gradient-to-r from-[#d97706] via-amber-500 to-[#f59e0b] bg-clip-text text-transparent">
                    Fully Automated.
                  </span>
                </h1>

                <p className="max-w-lg text-base sm:text-lg text-[var(--grey)] leading-relaxed mx-auto lg:mx-0">
                  ProfitPilot automates systematic delta-neutral strangles on Delta Exchange. Powered by real-time macro blackout shields, ATR volatility sensors, and trailing profit ratchets.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start pt-2">
                  <Link 
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#d97706] hover:bg-[#b45309] px-7 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    Start 30-Day Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a 
                    href="#how-it-works"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--hair)] bg-[var(--card)] hover:bg-[var(--raise)] px-7 py-3.5 text-sm font-medium text-[var(--ink)] transition-colors"
                  >
                    Explore Architecture
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-[var(--grey)] pt-2">
                  <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-600" /> Non-custodial API</span>
                  <span className="flex items-center gap-1.5"><Radio className="w-4 h-4 text-[#d97706]" /> Macro news blackout shield</span>
                  <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-600" /> 30% trailing ratchet</span>
                </div>
              </div>

              {/* Right Column — Dashboard Preview */}
              <div className="w-full">
                <DashboardPreview currency={currency} />
              </div>

            </div>
          </div>
        </section>

        {/* INSTITUTIONAL MACRO SHIELD & RADAR SECTION */}
        <section id="macro-shield" className="py-20 bg-[var(--paper-2)] border-b border-[var(--hair)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-[#d97706] uppercase tracking-wider bg-[#d97706]/10 px-3 py-1 rounded-full border border-[#d97706]/20">
                Institutional Risk Defense
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--ink)]">
                Why 95% of trading bots fail during news — and how we solve it.
              </h2>
              <p className="text-sm text-[var(--grey)] max-w-2xl mx-auto leading-relaxed">
                During Federal Reserve speeches, US CPI releases, and Jobs reports, algorithms cause violent whipsaws. ProfitPilot’s 4-ring safety architecture steps aside before the storm hits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="fintech-card p-6 sm:p-7 space-y-4 shadow-subtle border border-rose-500/20 bg-rose-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 font-bold">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[var(--ink)]">Unprotected Trading Bots</h3>
                </div>
                <ul className="space-y-3 text-xs text-[var(--grey)] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">&times;</span>
                    <span>Blindly opens options strangles directly into high-impact Fed and CPI releases.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">&times;</span>
                    <span>Sudden \$1,000 wicks trigger instant stop-losses and fee-churning loops.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">&times;</span>
                    <span>No order timeout rollback — gets stranded with dangerous naked directional risk.</span>
                  </li>
                </ul>
              </div>

              <div className="fintech-card p-6 sm:p-7 space-y-4 shadow-subtle border border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[var(--ink)]">ProfitPilot 4-Ring Shield</h3>
                </div>
                <ul className="space-y-3 text-xs text-[var(--grey)] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">&check;</span>
                    <span><strong>Pre-Emptive Blackout</strong>: Automatically halts new entries 2 hours before high-impact catalysts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">&check;</span>
                    <span><strong>Real ATR Sensor</strong>: Evaluates 72h continuous candle volatility before committing a single dollar.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">&check;</span>
                    <span><strong>30% Trailing Ratchet</strong>: Automatically locks in banked profits and protects against reversals.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Upcoming Catalysts Ticker Card */}
            {macroStatus?.upcoming_events && macroStatus.upcoming_events.length > 0 && (
              <div className="fintech-card p-5 sm:p-6 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#d97706]" /> Upcoming Monitored Macro Catalysts (This Week)
                  </span>
                  <span className="text-[11px] text-[var(--grey)] font-mono">Real-Time Global Feed</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {macroStatus.upcoming_events.map((ev, i) => (
                    <div key={i} className="p-3 bg-[var(--paper)] rounded-lg border border-[var(--hair)] space-y-1">
                      <div className="font-semibold text-[var(--ink)] truncate">{ev.title}</div>
                      <div className="text-[var(--grey)] flex items-center justify-between text-[11px]">
                        <span>{ev.time_ist}</span>
                        <span className="font-bold text-amber-600 uppercase text-[10px]">{ev.impact} Impact</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 border-b border-[var(--hair)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Three steps to institutional automation.
              </h2>
              <p className="text-sm text-[var(--grey)] max-w-lg mx-auto">
                Connect your existing Delta Exchange account in under 3 minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  step: '01',
                  title: 'Connect Trade API',
                  desc: 'Generate trade-only API keys on Delta Exchange. Your funds stay 100% in your personal wallet — withdrawal permissions are disabled.',
                  icon: Link2,
                },
                {
                  step: '02',
                  title: 'Configure & Activate',
                  desc: 'Select your preferred cash reserve buffer (default 40%) and activate automation with a single tap.',
                  icon: Play,
                },
                {
                  step: '03',
                  title: 'Harvest Time Decay',
                  desc: 'ProfitPilot scans orderbooks, opens delta-neutral strangles, tracks trailing ratchets, and secures your profits automatically.',
                  icon: Monitor,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="fintech-card p-6 sm:p-7 space-y-4 shadow-subtle">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold w-7 h-7 rounded-lg bg-[#d97706]/10 text-[#d97706] flex items-center justify-center border border-[#d97706]/20">
                        {item.step}
                      </span>
                      <h3 className="text-base font-semibold text-[var(--ink)]">{item.title}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#d97706]" />
                    </div>
                    <p className="text-sm text-[var(--grey)] leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* INTERACTIVE PROFIT CALCULATOR */}
        <section id="pricing" className="py-20 bg-[var(--paper-2)] border-b border-[var(--hair)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-[#d97706] uppercase tracking-wider bg-[#d97706]/10 px-3 py-1 rounded-full border border-[#d97706]/20">
                100% Performance-Aligned
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                We only win when you win.
              </h2>
              <p className="text-sm text-[var(--grey)] max-w-lg mx-auto">
                No monthly subscriptions. No upfront fees. We charge a 30% performance fee strictly on net realized gains above your high-water mark.
              </p>
            </div>

            {/* Interactive Calculator Card */}
            <div className="fintech-card p-6 sm:p-10 max-w-3xl mx-auto shadow-md space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--grey)]">
                    Simulate Your Trading Capital
                  </label>
                  <span className="font-mono text-xl sm:text-2xl font-bold text-[var(--ink)]">
                    {fmt(sliderBalance)}
                  </span>
                </div>
                <input 
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={sliderBalance}
                  onChange={(e) => setSliderBalance(parseFloat(e.target.value))}
                  className="w-full accent-[#d97706] cursor-pointer h-2 bg-[var(--hair)] rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-[var(--grey)] font-mono">
                  <span>{fmt(500)}</span>
                  <span>{fmt(25000)}</span>
                  <span>{fmt(50000)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[var(--hair)] text-center">
                <div className="p-4 bg-[var(--paper)] rounded-xl border border-[var(--hair)]">
                  <div className="text-xs text-[var(--grey)]">Estimated Monthly Net Gain</div>
                  <div className="font-mono text-xl font-bold text-emerald-600 mt-1">
                    +{fmt(calcNet)}
                  </div>
                  <div className="text-[10px] text-[var(--grey)] mt-0.5">Based on ~13% historical net</div>
                </div>

                <div className="p-4 bg-[var(--paper)] rounded-xl border border-[var(--hair)]">
                  <div className="text-xs text-[var(--grey)]">ProfitPilot 30% Fee</div>
                  <div className="font-mono text-xl font-bold text-[var(--ink)] mt-1">
                    {fmt(calcPerfFee)}
                  </div>
                  <div className="text-[10px] text-[var(--grey)] mt-0.5">Zero fee on red months</div>
                </div>

                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Your Take-Home Profit</div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    +{fmt(calcTakeHome)}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Retained 100% in your wallet</div>
                </div>
              </div>

              <div className="text-center pt-2">
                <Link 
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3.5 text-sm font-semibold shadow-subtle transition-all"
                >
                  Start Your 30-Day Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section id="faq" className="py-20 border-b border-[var(--hair)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-[var(--grey)]">
                Everything you need to know about safety, custody, and automation.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="fintech-card rounded-xl overflow-hidden border border-[var(--hair)] shadow-xs">
                    <button 
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full p-4 sm:p-5 text-left font-semibold text-sm sm:text-base flex items-center justify-between gap-4 text-[var(--ink)] hover:text-[#d97706] transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#d97706]' : 'text-[var(--grey)]'}`} />
                    </button>
                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-[var(--grey)] leading-relaxed border-t border-[var(--hair)] bg-[var(--paper-2)]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="py-12 bg-[var(--paper-2)] border-t border-[var(--hair)] text-xs text-[var(--grey)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#d97706] flex items-center justify-center text-white">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[var(--ink)]">ProfitPilot</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-[var(--ink)]">Architecture</a>
            <a href="#macro-shield" className="hover:text-[var(--ink)]">Macro Shield</a>
            <a href="#pricing" className="hover:text-[var(--ink)]">Pricing</a>
            <Link href="/login" className="text-[#d97706] font-semibold hover:underline">Launch App</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

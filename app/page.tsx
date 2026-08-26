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
  TrendingUp,
  Scale
} from 'lucide-react';

export default function Home() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sliderBalance, setSliderBalance] = useState<number>(5000);

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
      q: "How does automated trading work?",
      a: "Once you connect your Delta Exchange API keys and activate automation, ProfitPilot evaluates market conditions and executes options trades on your behalf. It continuously monitors open positions, manages risk, and closes trades according to predefined rules."
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
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans flex flex-col selection:bg-[#d97706]/15">
      
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 glass-header px-4 sm:px-8 py-3 flex items-center justify-between transition-colors">
        
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-base tracking-tight text-[var(--ink)]">
            Profit<span className="text-[#d97706]">Pilot</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[var(--grey)]">
          <a href="#how-it-works" className="hover:text-[var(--ink)] transition-colors">How it works</a>
          <a href="#performance" className="hover:text-[var(--ink)] transition-colors">Performance</a>
          <a href="#pricing" className="hover:text-[var(--ink)] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[var(--ink)] transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-2.5">
          <div className="bg-[var(--paper-2)] p-0.5 rounded-lg border border-[var(--hair)] flex items-center text-xs font-medium">
            <button 
              onClick={() => setCurrency('INR')}
              className={`px-2 py-1 rounded transition-all ${currency === 'INR' ? 'bg-[#d97706] text-white shadow-sm font-semibold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >₹ INR</button>
            <button 
              onClick={() => setCurrency('USD')}
              className={`px-2 py-1 rounded transition-all ${currency === 'USD' ? 'bg-[#d97706] text-white shadow-sm font-semibold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >$ USD</button>
          </div>

          <button 
            onClick={toggleTheme}
            className="w-7 h-7 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] flex items-center justify-center text-[var(--grey)] hover:text-[var(--ink)] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <Link href="/login" className="text-[13px] font-medium text-[var(--grey)] hover:text-[var(--ink)] px-2 py-1 hidden sm:block transition-colors">
            Log in
          </Link>
          <Link href="/login" className="bg-[#d97706] hover:bg-[#b45309] text-white font-medium text-xs sm:text-[13px] px-3.5 py-1.5 rounded-lg shadow-subtle transition-all active:scale-95">
            Start free trial
          </Link>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--paper-2)] border-b border-[var(--hair)] px-4 py-3 space-y-2 text-sm font-medium">
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)]">How it works</a>
          <a href="#performance" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)]">Performance</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)]">Pricing</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)]">FAQ</a>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[#d97706] font-semibold">Log in &rarr;</Link>
        </div>
      )}

      <main className="flex-1">

        {/* HERO */}
        <section className="py-16 sm:py-20 lg:py-24 border-b border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* Left */}
              <div className="space-y-6 text-center lg:text-left">
                <div className="flex justify-center lg:justify-start">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#d97706] uppercase tracking-wider bg-[var(--orange-tint)] px-3 py-1 rounded-full border border-[#d97706]/20">
                    Automated crypto options trading
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-[var(--ink)] leading-[1.1]">
                  Your options strategy.{' '}
                  <span className="text-[#d97706]">Automated.</span>
                </h1>

                <p className="max-w-lg text-base sm:text-lg text-[var(--grey)] leading-relaxed mx-auto lg:mx-0">
                  ProfitPilot monitors your account, executes your trading strategy automatically and keeps track of your positions and performance — so you don&apos;t have to watch the market all day.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start pt-1">
                  <Link 
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#d97706] hover:bg-[#b45309] px-6 py-3 text-sm font-medium text-white shadow-subtle transition-all active:scale-[0.98]"
                  >
                    Start free trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a 
                    href="#how-it-works"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--hair)] bg-[var(--card)] hover:bg-[var(--raise)] px-6 py-3 text-sm font-medium text-[var(--ink)] transition-colors"
                  >
                    See how it works
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-[var(--grey)] pt-2">
                  <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-600" /> Non-custodial</span>
                  <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-emerald-600" /> Automated execution</span>
                  <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-emerald-600" /> Real-time monitoring</span>
                </div>
              </div>

              {/* Right — Dashboard Preview */}
              <DashboardPreview currency={currency} />

            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 bg-[var(--paper-2)] border-b border-[var(--hair)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Simple to start. Fully automated.
              </h2>
              <p className="text-sm text-[var(--grey)] max-w-lg mx-auto">
                Get up and running in minutes with your existing Delta Exchange account.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  step: '01',
                  title: 'Connect',
                  desc: 'Connect your Delta Exchange account securely using trade-only API keys. Your funds stay in your wallet — we never have withdrawal access.',
                  icon: Link2,
                },
                {
                  step: '02',
                  title: 'Activate',
                  desc: 'Enable your automated trading setup. ProfitPilot begins evaluating market conditions and executing trades on your behalf.',
                  icon: Play,
                },
                {
                  step: '03',
                  title: 'Monitor',
                  desc: 'ProfitPilot handles execution and position monitoring. View your account, positions and performance anytime from your dashboard.',
                  icon: Monitor,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="fintech-card p-6 sm:p-7 space-y-4 shadow-subtle">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold w-7 h-7 rounded-lg bg-[var(--orange-tint)] text-[#d97706] flex items-center justify-center border border-[#d97706]/20">
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

        {/* PRODUCT BENEFITS */}
        <section className="py-20 border-b border-[var(--hair)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Everything you need. Nothing you don&apos;t.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  title: 'Automated execution',
                  desc: 'Trades are executed automatically according to your configured trading setup. No manual intervention required.',
                  icon: Zap,
                },
                {
                  title: 'Position monitoring',
                  desc: 'Open positions are monitored continuously. ProfitPilot tracks market conditions and manages your trades around the clock.',
                  icon: Eye,
                },
                {
                  title: 'Risk controls',
                  desc: 'Built-in controls help manage exposure and account risk. Pause trading, set limits, or trigger an emergency exit at any time.',
                  icon: Shield,
                },
                {
                  title: 'Complete transparency',
                  desc: 'View positions, P&L, trades, fees and account activity in one place. Every action is logged and visible in your dashboard.',
                  icon: BarChart3,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="fintech-card p-6 space-y-3 shadow-subtle">
                    <div className="w-10 h-10 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#d97706]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--ink)]">{item.title}</h3>
                    <p className="text-sm text-[var(--grey)] leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* PERFORMANCE */}
        <section id="performance" className="py-20 bg-[var(--paper-2)] border-b border-[var(--hair)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                See how the system has performed.
              </h2>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--grey)] bg-[var(--card)] px-3 py-1.5 rounded-full border border-[var(--hair)]">
                Historical backtest results
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'CAGR', value: '227.4%', color: 'text-emerald-600' },
                { label: 'Historical win rate', value: '68.3%', color: 'text-[var(--ink)]' },
                { label: 'Maximum drawdown', value: '11.4%', color: 'text-rose-600' },
                { label: 'Green months', value: '10 / 13', color: 'text-emerald-600' },
              ].map((m) => (
                <div key={m.label} className="fintech-card p-5 text-center shadow-subtle">
                  <div className={`font-mono text-2xl sm:text-3xl font-semibold num-tabular ${m.color}`}>
                    {m.value}
                  </div>
                  <div className="text-xs text-[var(--grey)] font-medium mt-2">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Methodology */}
            <div className="fintech-card p-5 space-y-3 text-xs text-[var(--grey)] shadow-subtle">
              <div className="font-semibold text-[var(--ink)]">Methodology &amp; assumptions</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 leading-relaxed">
                <div>Backtest period: Aug 2025 – Aug 2026</div>
                <div>Starting capital: $5,000 USD</div>
                <div>Exchange fees: Delta Exchange taker rates</div>
                <div>GST: 18% on exchange fees (India)</div>
                <div>Slippage model: 0.15% per leg</div>
                <div>Data source: Delta Exchange historical</div>
              </div>
              <p className="text-[11px] text-[var(--faint)] border-t border-[var(--hair)] pt-3 leading-relaxed">
                Past performance and backtest results do not guarantee future results. Options trading involves substantial risk of loss and is not suitable for every investor. All figures represent simulated historical performance.
              </p>
            </div>

          </div>
        </section>

        {/* PRODUCT PREVIEW */}
        <section className="py-20 border-b border-[var(--hair)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Your entire trading account, at a glance.
              </h2>
              <p className="text-sm text-[var(--grey)] max-w-lg mx-auto">
                Monitor balances, positions, trades and automation status from one clean dashboard.
              </p>
            </div>

            {/* Dashboard Mockup */}
            <div className="fintech-card p-6 sm:p-8 shadow-subtle space-y-6">
              
              {/* Mock Header */}
              <div className="flex items-center justify-between border-b border-[var(--hair)] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#d97706] flex items-center justify-center">
                    <Activity className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-[var(--ink)]">ProfitPilot Dashboard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-medium text-emerald-600">Automation active</span>
                </div>
              </div>

              {/* Mock KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Account balance', value: currency === 'INR' ? '₹4,64,230' : '$5,368', sub: 'Live' },
                  { label: "Today's P&L", value: currency === 'INR' ? '+₹1,284' : '+$14.84', sub: 'After fees', color: 'text-emerald-600' },
                  { label: 'Open P&L', value: currency === 'INR' ? '+₹684' : '+$7.91', sub: 'Unrealized', color: 'text-emerald-600' },
                  { label: 'Available margin', value: currency === 'INR' ? '₹3,78,420' : '$4,375', sub: '82% available' },
                  { label: 'Open positions', value: '1', sub: 'BTC Options' },
                  { label: 'Bot status', value: '● Active', sub: 'Monitoring', color: 'text-emerald-600' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-[var(--paper-2)] p-3 rounded-lg border border-[var(--hair)]">
                    <div className="text-[10px] text-[var(--grey)] font-medium">{kpi.label}</div>
                    <div className={`font-mono text-sm font-semibold mt-1 num-tabular ${kpi.color || 'text-[var(--ink)]'}`}>
                      {kpi.value}
                    </div>
                    <div className="text-[10px] text-[var(--faint)] mt-0.5">{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Mock Recent Trades */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[var(--ink)]">Recent trades</div>
                <div className="space-y-1.5">
                  {[
                    { date: 'Today', instrument: 'BTC Options', pnl: currency === 'INR' ? '+₹1,284' : '+$14.84', status: 'CLOSED', positive: true },
                    { date: 'Yesterday', instrument: 'BTC Options', pnl: currency === 'INR' ? '-₹832' : '-$9.62', status: 'CLOSED', positive: false },
                    { date: '2 days ago', instrument: 'BTC Options', pnl: currency === 'INR' ? '+₹1,682' : '+$19.45', status: 'CLOSED', positive: true },
                  ].map((trade, i) => (
                    <div key={i} className="flex items-center justify-between bg-[var(--paper-2)] p-3 rounded-lg border border-[var(--hair)] text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--faint)]">{trade.date}</span>
                        <span className="font-medium text-[var(--ink)]">{trade.instrument}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-semibold num-tabular ${trade.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {trade.pnl}
                        </span>
                        <span className="text-[10px] font-medium text-[var(--faint)] bg-[var(--card)] px-1.5 py-0.5 rounded border border-[var(--hair)]">
                          {trade.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock Account Health */}
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/10 p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">Account health: Normal</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400">No action required</span>
              </div>

            </div>

          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 bg-[var(--paper-2)] border-b border-[var(--hair)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Simple, aligned pricing.
              </h2>
              <p className="text-sm text-[var(--grey)]">
                We only earn when you earn. No monthly subscriptions. No upfront costs.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="fintech-card p-6 space-y-4 shadow-subtle border-2 border-[#d97706]">
                <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">First 30 days</div>
                <div className="font-mono text-4xl font-bold text-[var(--ink)]">
                  {currency === 'INR' ? '₹0' : '$0'}
                </div>
                <p className="text-sm text-[var(--grey)]">
                  Full access to all features. No credit card required. No performance fees during your trial.
                </p>
                <Link
                  href="/login"
                  className="w-full py-2.5 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-white font-medium text-sm text-center block transition shadow-subtle"
                >
                  Start free trial
                </Link>
              </div>

              <div className="fintech-card p-6 space-y-4 shadow-subtle">
                <div className="text-xs font-semibold text-[var(--grey)] uppercase tracking-wider">After trial</div>
                <div className="font-mono text-4xl font-bold text-[var(--ink)]">30%</div>
                <p className="text-sm text-[var(--grey)]">
                  Performance fee on net realized profits only. High-Water Mark protection ensures you never pay fees on recovered losses.
                </p>
                <Link
                  href="/login"
                  className="w-full py-2.5 rounded-lg bg-[var(--card)] hover:bg-[var(--raise)] border border-[var(--hair)] text-[var(--ink)] font-medium text-sm text-center block transition"
                >
                  Learn more
                </Link>
              </div>

            </div>

            {/* How Fees Work — Expandable */}
            <div className="fintech-card overflow-hidden shadow-subtle">
              <button
                onClick={() => setOpenFaq(openFaq === 99 ? null : 99)}
                className="w-full p-5 flex justify-between items-center text-left text-sm font-medium text-[var(--ink)] hover:bg-[var(--paper-2)] transition"
              >
                <span>How fees work</span>
                <ChevronDown className={`w-4 h-4 text-[var(--grey)] transition-transform duration-200 ${openFaq === 99 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 99 && (
                <div className="px-5 pb-5 border-t border-[var(--hair)] pt-4 space-y-4">
                  
                  <div>
                    <div className="flex justify-between items-center text-xs font-medium mb-2">
                      <span className="text-[var(--grey)]">Example collateral:</span>
                      <span className="font-mono text-base font-semibold text-[var(--ink)]">{fmt(sliderBalance)}</span>
                    </div>
                    <input 
                      type="range" min={500} max={50000} step={500} 
                      value={sliderBalance} onChange={(e) => setSliderBalance(parseFloat(e.target.value))} 
                      className="w-full"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-[var(--grey)] mt-1">
                      <span>{currency === 'INR' ? '₹43k' : '$500'}</span>
                      <span>{currency === 'INR' ? '₹43L' : '$50,000'}</span>
                    </div>
                  </div>

                  <div className="bg-[var(--paper-2)] p-4 rounded-lg border border-[var(--hair)] space-y-2.5 text-xs divide-y divide-[var(--hair)]">
                    <div className="flex justify-between pt-1">
                      <span className="text-[var(--grey)]">Modelled gross yield (~14.5%):</span>
                      <span className="font-mono font-semibold text-[var(--ink)]">+{fmt(calcGross)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-[var(--grey)]">Exchange fees + GST:</span>
                      <span className="font-mono font-semibold text-rose-600">-{fmt(calcFees)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-[var(--grey)]">ProfitPilot 30% performance fee:</span>
                      <span className="font-mono font-semibold text-[#d97706]">-{fmt(calcPerfFee)}</span>
                    </div>
                    <div className="flex justify-between pt-2.5 text-sm">
                      <span className="font-semibold text-[var(--ink)]">Your net take-home:</span>
                      <span className="font-mono font-semibold text-emerald-600">+{fmt(calcTakeHome)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--faint)] leading-relaxed">
                    If a month ends in a net loss, you owe nothing. The loss carries forward and must be recovered before any future performance fees apply (High-Water Mark protection).
                  </p>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 border-b border-[var(--hair)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Frequently asked questions
              </h2>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="fintech-card overflow-hidden shadow-subtle">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-4 flex justify-between items-center text-left text-sm font-medium text-[var(--ink)] hover:bg-[var(--paper-2)] transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[var(--grey)] shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-[var(--grey)] leading-relaxed border-t border-[var(--hair)] pt-3 bg-[var(--paper-2)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-[var(--paper-2)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
              Let ProfitPilot watch the market for you.
            </h2>
            <p className="text-sm text-[var(--grey)] max-w-lg mx-auto leading-relaxed">
              Automate your options trading and monitor everything from one place.
            </p>
            
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#d97706] hover:bg-[#b45309] px-8 py-3.5 text-sm font-medium text-white shadow-subtle transition-all active:scale-[0.98]"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-[var(--grey)] pt-2">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-600" /> Non-custodial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 30-day free trial</span>
              <span className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-emerald-600" /> High-Water Mark protection</span>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[var(--paper)] border-t border-[var(--hair)] py-8 text-xs text-[var(--grey)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#d97706] flex items-center justify-center">
                <Activity className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-[var(--ink)]">ProfitPilot</span>
              <span className="text-[var(--faint)]">&middot; Automated crypto options trading</span>
            </div>
            <div className="text-[11px] text-[var(--faint)]">
              Non-custodial &middot; Delta Exchange India &middot; Delta Exchange Global
            </div>
          </div>
          <div className="text-[11px] text-[var(--faint)] leading-relaxed border-t border-[var(--hair)] pt-3 text-center sm:text-left">
            Options trading involves substantial risk of loss and is not suitable for every investor. Past performance and backtest results do not guarantee future results.
          </div>
        </div>
      </footer>

    </div>
  );
}

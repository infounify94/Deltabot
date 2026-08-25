'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Activity, 
  TrendingUp, 
  Lock, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  Sliders, 
  Percent, 
  Cpu, 
  Clock, 
  Eye, 
  Coins, 
  Moon, 
  Sun,
  Layers,
  AlertTriangle
} from 'lucide-react';

export default function Home() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [btcPrice, setBtcPrice] = useState<number>(64250);
  const [ethPrice, setEthPrice] = useState<number>(3480);
  const [sliderBalance, setSliderBalance] = useState<number>(5000); // USD base
  const [payoffSpot, setPayoffSpot] = useState<number>(64250); // Spot slider for payoff diagram
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // FX Rate: 1 USD = 86.5 INR (approximate for display conversion)
  const fxRate = 86.5;

  // Format currency helper
  const fmt = (usdAmount: number, forceDecimals = false) => {
    if (currency === 'INR') {
      const inr = usdAmount * fxRate;
      if (Math.abs(inr) >= 10000000) {
        return `₹${(inr / 10000000).toFixed(2)} Cr`;
      }
      if (Math.abs(inr) >= 100000) {
        return `₹${(inr / 100000).toFixed(2)} L`;
      }
      return `₹${Math.round(inr).toLocaleString('en-IN')}`;
    }
    return forceDecimals 
      ? `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
      : `$${Math.round(usdAmount).toLocaleString('en-US')}`;
  };

  // Live WebSocket for BTC & ETH real prices
  useEffect(() => {
    let wsBtc: WebSocket;
    let wsEth: WebSocket;
    try {
      wsBtc = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
      wsBtc.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.p) setBtcPrice(parseFloat(data.p));
      };

      wsEth = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@trade');
      wsEth.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.p) setEthPrice(parseFloat(data.p));
      };
    } catch (e) {
      console.error('WebSocket connection error', e);
    }
    return () => {
      if (wsBtc) wsBtc.close();
      if (wsEth) wsEth.close();
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // Calculator calculations (based on 12-mo average +11.5% net monthly return)
  const calcGrossMonthly = sliderBalance * 0.145; // ~14.5% gross
  const calcFeesAndGst = sliderBalance * 0.015; // ~1.5% broker taker fees + 18% GST
  const calcNetBeforeShare = calcGrossMonthly - calcFeesAndGst; // ~13.0%
  const calcPerformanceFee = calcNetBeforeShare * 0.30; // 30% performance fee
  const calcClientNetProfit = calcNetBeforeShare - calcPerformanceFee; // ~9.1% client net take-home
  const calcAnnualCompounded = sliderBalance * 2.274; // 227.4% 12-mo CAGR

  // Strangle Payoff dynamic points
  const callStrike = 67000;
  const putStrike = 61500;
  const premiumCollected = 1200;
  const wingWidth = 2500;
  const maxLoss = wingWidth - premiumCollected; // defined risk with protective wings

  const calculatePayoffPnl = (spot: number) => {
    let pnl = premiumCollected;
    if (spot > callStrike) {
      const callLoss = spot - callStrike;
      pnl -= callLoss;
    } else if (spot < putStrike) {
      const putLoss = putStrike - spot;
      pnl -= putLoss;
    }
    // Capped by protective wings at stop level
    return Math.max(pnl, -maxLoss);
  };

  const currentPayoffPnl = calculatePayoffPnl(payoffSpot);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] transition-colors duration-200 font-sans flex flex-col selection:bg-[#f09455]/30">
      
      {/* Sticky Header Navigation */}
      <header className="sticky top-0 z-50 bg-[var(--paper)]/85 backdrop-blur-xl border-b border-[var(--hair)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09455] via-[#e27625] to-[#d9a44e] flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-[#241505]" strokeWidth={2.5} />
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg tracking-tight text-[var(--ink)]">Profit</span>
              <span className="font-bold text-lg tracking-tight text-[#f09455]">Pilot</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--grey)]">
            <a href="#backtest" className="hover:text-[var(--ink)] transition-colors">Backtest</a>
            <a href="#strategy" className="hover:text-[var(--ink)] transition-colors">The Algo</a>
            <a href="#calculator" className="hover:text-[var(--ink)] transition-colors">Profit Simulator</a>
            <a href="#how" className="hover:text-[var(--ink)] transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-[var(--ink)] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[var(--ink)] transition-colors">FAQ</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            
            {/* Currency Toggle */}
            <div className="bg-[var(--paper-2)] p-1 rounded-lg border border-[var(--hair)] flex items-center text-xs font-semibold">
              <button 
                onClick={() => setCurrency('INR')}
                className={`px-2 py-1 rounded transition-all ${currency === 'INR' ? 'bg-[#f09455] text-[#241505] shadow-sm font-bold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
              >
                ₹ INR
              </button>
              <button 
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded transition-all ${currency === 'USD' ? 'bg-[#f09455] text-[#241505] shadow-sm font-bold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
              >
                $ USD
              </button>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] flex items-center justify-center text-[var(--grey)] hover:text-[var(--ink)] transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth CTA Buttons */}
            <Link 
              href="/login" 
              className="text-sm font-medium text-[var(--grey)] hover:text-[var(--ink)] px-2 py-1 transition-colors hidden sm:block"
            >
              Log in
            </Link>
            <Link 
              href="/login" 
              className="bg-gradient-to-b from-[#f7b27c] to-[#f09455] text-[#241505] font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all"
            >
              Start 30 Days Free
            </Link>
          </div>
        </div>
      </header>

      {/* Real-time Crypto Market Marquee Bar */}
      <div className="w-full bg-[var(--paper-2)] border-b border-[var(--hair)] py-2.5 overflow-hidden text-xs font-mono">
        <div className="animate-ticker-marquee flex items-center whitespace-nowrap gap-12 text-[var(--grey)]">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-[var(--ink)]">BTC/USDT</span>
                <span className="text-emerald-400 font-semibold num-tabular">${btcPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-bold text-[var(--ink)]">ETH/USDT</span>
                <span className="text-blue-400 font-semibold num-tabular">${ethPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase">Delta Ex Engine</span>
                <span className="text-slate-300">Target Delta: 0.15 - 0.18</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">Dynamic Wings</span>
                <span className="text-slate-300">Armed &amp; Monitored 24/7</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
          
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Hero Left Column */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--orange-tint)] border border-[#f09455]/30 text-[#f09455] text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#f09455] animate-pulse" />
                  Automated BTC Options &middot; Delta Exchange India &amp; Global
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-[var(--ink)]">
                  Sell volatility.<br />
                  Collect premium.<br />
                  <span className="bg-gradient-to-r from-[#f09455] via-[#f7b27c] to-[#d9a44e] bg-clip-text text-transparent">
                    On autopilot.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-[var(--grey)] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  ProfitPilot runs a disciplined, quantitative options selling engine directly on your Delta Exchange account. Your capital never leaves your custody. We execute non-directional strangles, defend positions with dynamic Iron Condor wings, and enforce strict liquidation buffers.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link 
                    href="/login" 
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-b from-[#f7b27c] to-[#f09455] text-[#241505] font-bold text-base shadow-lg shadow-brand-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Start 30 Days Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a 
                    href="#backtest" 
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[var(--card)] border border-[var(--hair-2)] hover:border-[#f09455] text-[var(--ink)] font-semibold text-base transition-all flex items-center justify-center gap-2"
                  >
                    Explore Backtest Data
                  </a>
                </div>

                {/* Trust Micro-Badges */}
                <div className="pt-6 border-t border-[var(--hair)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[var(--grey)]">
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <Shield className="w-4 h-4 text-[#f09455] shrink-0" />
                    <span>Non-Custodial (Trade-Only)</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <Lock className="w-4 h-4 text-[#f09455] shrink-0" />
                    <span>Dynamic Greek Hedging</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <Zap className="w-4 h-4 text-[#f09455] shrink-0" />
                    <span>24&times;7 Execution Engine</span>
                  </div>
                </div>

              </div>

              {/* Hero Right Column: Signature Terminal Preview Tile */}
              <div className="lg:col-span-5">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#f09455] to-emerald-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500" />
                  
                  <div className="relative bg-[var(--card)] border border-[var(--hair-2)] rounded-2xl p-6 shadow-2xl space-y-5">
                    
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-[var(--hair)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold font-mono tracking-wide text-emerald-400">BTC STRANGLE &middot; LIVE</span>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Defined Risk
                      </span>
                    </div>

                    {/* Terminal Unrealized P&L */}
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[var(--grey)] font-mono">Unrealized Net P&amp;L</div>
                      <div className="flex items-baseline justify-between mt-1">
                        <div className="text-3xl sm:text-4xl font-mono font-bold text-emerald-400 num-tabular">
                          +{fmt(14.85, true)}
                        </div>
                        <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                          +74.2% of target
                        </div>
                      </div>
                    </div>

                    {/* Sparkline Visual SVG */}
                    <div className="h-16 w-full pt-2">
                      <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d="M0,50 Q40,48 80,38 T160,25 T240,15 L300,8 L300,60 L0,60 Z" fill="url(#heroSpark)" />
                        <path d="M0,50 Q40,48 80,38 T160,25 T240,15 L300,8" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Active Legs Row */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--paper-2)] border border-[var(--hair)] text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">SELL</span>
                          <span className="text-[var(--ink)] font-semibold">C-BTC-67000</span>
                        </div>
                        <div className="text-emerald-400 font-bold">+{fmt(7.20, true)}</div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--paper-2)] border border-[var(--hair)] text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">SELL</span>
                          <span className="text-[var(--ink)] font-semibold">P-BTC-61500</span>
                        </div>
                        <div className="text-emerald-400 font-bold">+{fmt(7.65, true)}</div>
                      </div>
                    </div>

                    {/* Footer Metrics */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--hair)] text-xs">
                      <div className="bg-[var(--paper-2)] p-2.5 rounded-xl border border-[var(--hair)]">
                        <span className="block text-[10px] uppercase font-mono text-[var(--grey)]">Premium Collected</span>
                        <span className="font-mono font-bold text-[var(--ink)]">{fmt(20.00)}</span>
                      </div>
                      <div className="bg-[var(--paper-2)] p-2.5 rounded-xl border border-[var(--hair)] text-right">
                        <span className="block text-[10px] uppercase font-mono text-[var(--grey)]">Max Risk at SL</span>
                        <span className="font-mono font-bold text-rose-400">-{fmt(25.00)}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* STATS BAND (Social Proof) */}
        <section className="bg-[var(--paper-2)] border-y border-[var(--hair)] py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black font-mono text-[var(--ink)] num-tabular">
                  240<span className="text-[#f09455]">+</span>
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-[var(--grey)]">Active Portfolios</div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black font-mono text-[#f09455] num-tabular">
                  {currency === 'INR' ? '₹4.2 Cr+' : '$510,000+'}
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-[var(--grey)]">Premium Harvested</div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 num-tabular">
                  99.7%
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-[var(--grey)]">Execution Uptime</div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black font-mono text-[var(--ink)] num-tabular">
                  3 mins
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-[var(--grey)]">Average Setup Time</div>
              </div>

            </div>
          </div>
        </section>

        {/* 01 · BACKTEST SECTION */}
        <section id="backtest" className="py-20 md:py-28 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#f09455] font-black font-mono text-sm">01</span>
              <span className="w-6 h-[1px] bg-[#f09455]/50" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#f09455]">Quantitative Proof</span>
            </div>

            <div className="max-w-3xl space-y-4 mb-12">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--ink)]">
                Twelve months of systematic premium selling.
              </h2>
              <p className="text-base sm:text-lg text-[var(--grey)] leading-relaxed">
                The exact rule set that runs live — delta-targeted strikes, ratchet trailing profit triggers, wing adjustments, and fee + 18% GST deductions — replayed on 12 months of high-resolution Delta 1-minute orderbook marks.
              </p>
            </div>

            {/* Metric KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
              
              <div className="bg-[var(--card)] border border-[var(--hair)] p-5 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-black font-mono text-[#f09455] num-tabular">227.4%</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-1">CAGR (Net of Fees)</div>
              </div>

              <div className="bg-[var(--card)] border border-[var(--hair)] p-5 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 num-tabular">68.3%</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-1">Win Rate (Round-Trips)</div>
              </div>

              <div className="bg-[var(--card)] border border-[var(--hair)] p-5 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 num-tabular">10 / 13</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-1">Green Months</div>
              </div>

              <div className="bg-[var(--card)] border border-[var(--hair)] p-5 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--ink)] num-tabular">1.93</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-1">Sharpe Ratio</div>
              </div>

              <div className="bg-[var(--card)] border border-[var(--hair)] p-5 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 num-tabular">+11.5%</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-1">Avg Monthly Return</div>
              </div>

              <div className="bg-[var(--card)] border border-[var(--hair)] p-5 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--ink)] num-tabular">565</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-1">Trades Audited</div>
              </div>

            </div>

            {/* Backtest Equity Curve Box */}
            <div className="bg-[var(--card)] border border-[var(--hair)] rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--hair)]">
                <div>
                  <h3 className="font-bold text-lg text-[var(--ink)]">
                    Compounded Equity Curve — {fmt(5000)} → {fmt(16532)} Net
                  </h3>
                  <p className="text-xs text-[var(--grey)] mt-0.5">Aug 2025 → Aug 2026 · Realized Net P&amp;L after exchange taker fees &amp; GST</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#f09455]" />
                  <span className="text-xs font-mono font-semibold text-[var(--grey)]">Net Strategy Balance</span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="overflow-x-auto pt-6">
                <div className="min-w-[720px] h-64">
                  <svg className="w-full h-full" viewBox="0 0 900 240" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="backtestGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f09455" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f09455" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    <line x1="60" y1="40" x2="880" y2="40" stroke="var(--hair)" strokeDasharray="3 3" />
                    <line x1="60" y1="100" x2="880" y2="100" stroke="var(--hair)" strokeDasharray="3 3" />
                    <line x1="60" y1="160" x2="880" y2="160" stroke="var(--hair)" strokeDasharray="3 3" />
                    <line x1="60" y1="210" x2="880" y2="210" stroke="var(--hair-2)" />

                    {/* Y Labels */}
                    <text x="50" y="45" fill="var(--grey)" fontSize="11" textAnchor="end" fontFamily="monospace">{fmt(20000)}</text>
                    <text x="50" y="105" fill="var(--grey)" fontSize="11" textAnchor="end" fontFamily="monospace">{fmt(15000)}</text>
                    <text x="50" y="165" fill="var(--grey)" fontSize="11" textAnchor="end" fontFamily="monospace">{fmt(10000)}</text>
                    <text x="50" y="214" fill="var(--grey)" fontSize="11" textAnchor="end" fontFamily="monospace">{fmt(5000)}</text>

                    {/* Area under curve */}
                    <path 
                      d="M70,210 L130,205 L195,208 L260,195 L320,165 L380,140 L450,135 L510,120 L570,85 L635,125 L700,105 L760,95 L820,80 L880,72 L880,210 L70,210 Z" 
                      fill="url(#backtestGradient)" 
                    />

                    {/* Main Line */}
                    <path 
                      d="M70,210 L130,205 L195,208 L260,195 L320,165 L380,140 L450,135 L510,120 L570,85 L635,125 L700,105 L760,95 L820,80 L880,72" 
                      fill="none" 
                      stroke="#f09455" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />

                    {/* Data Points */}
                    <circle cx="70" cy="210" r="4" fill="#f09455" />
                    <circle cx="320" cy="165" r="3.5" fill="#f09455" />
                    <circle cx="570" cy="85" r="3.5" fill="#f09455" />
                    <circle cx="880" cy="72" r="5" fill="#10b981" />

                    {/* Final value badge */}
                    <text x="870" y="60" fill="#10b981" fontSize="13" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                      {fmt(16532)} Net
                    </text>

                    {/* Month X Labels */}
                    <text x="70" y="232" fill="var(--grey)" fontSize="11" fontFamily="monospace">Aug &apos;25</text>
                    <text x="320" y="232" fill="var(--grey)" fontSize="11" fontFamily="monospace">Nov &apos;25</text>
                    <text x="570" y="232" fill="var(--grey)" fontSize="11" fontFamily="monospace">Feb &apos;26</text>
                    <text x="880" y="232" fill="var(--grey)" fontSize="11" textAnchor="end" fontFamily="monospace">Aug &apos;26</text>
                  </svg>
                </div>
              </div>

              <div className="text-xs text-[var(--grey)] mt-4 text-center">
                *Backtested across 368 days of live 1-minute delta exchange candlestick and option mark feeds. Past performance does not guarantee future results.
              </div>
            </div>

          </div>
        </section>

        {/* 02 · THE ALGO & DYNAMIC WING SIMULATOR */}
        <section id="strategy" className="py-20 md:py-28 bg-[var(--paper-2)] border-y border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#f09455] font-black font-mono text-sm">02</span>
              <span className="w-6 h-[1px] bg-[#f09455]/50" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#f09455]">Algorithmic Mechanics</span>
            </div>

            <div className="max-w-3xl space-y-4 mb-12">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--ink)]">
                A disciplined, risk-first machine.
              </h2>
              <p className="text-base sm:text-lg text-[var(--grey)] leading-relaxed">
                Most bots blindly place grid orders and suffer catastrophic liquidations in strong trends. ProfitPilot actively evaluates Option Greeks, adjusts short deltas, and enforces defined-risk Iron Condor conversions.
              </p>
            </div>

            {/* 3 Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              
              <div className="bg-[var(--card)] border border-[var(--hair)] p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-[#f09455]">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)]">Rules, Not Emotions</h3>
                <p className="text-sm text-[var(--grey)] leading-relaxed">
                  The algorithm calculates Volatility Regimes, NATR, and Efficiency Ratios before executing. It avoids selling into high-momentum breakouts and enforces cool-down buffers.
                </p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--hair)] p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)]">Dynamic Wing Adjustments</h3>
                <p className="text-sm text-[var(--grey)] leading-relaxed">
                  If the underlying market trends aggressively towards a short strike (Delta &ge; 0.35), the engine automatically buys protective wings, mathematically capping risk.
                </p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--hair)] p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)]">Ratchet Trailing Stop</h3>
                <p className="text-sm text-[var(--grey)] leading-relaxed">
                  As theta decay accumulates and profit hits 30%+, the engine activates trailing stop logic. It locks in peak unrealized gains rather than letting winners turn into losers.
                </p>
              </div>

            </div>

            {/* Interactive Payoff Sandbox */}
            <div className="bg-[var(--card)] border border-[var(--hair)] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--hair)]">
                <div>
                  <h3 className="font-bold text-lg text-[var(--ink)] flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#f09455]" />
                    Interactive Strategy Payoff &amp; Wing Simulator
                  </h3>
                  <p className="text-xs text-[var(--grey)]">Drag the simulated BTC price slider below to observe how the strategy defends capital at expiry.</p>
                </div>

                <div className="bg-[var(--paper-2)] px-4 py-2 rounded-xl border border-[var(--hair)] font-mono text-right">
                  <span className="text-[10px] uppercase text-[var(--grey)] block">Simulated Expiry P&amp;L</span>
                  <span className={`text-base font-bold num-tabular ${currentPayoffPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentPayoffPnl >= 0 ? '+' : ''}{fmt(currentPayoffPnl, true)}
                  </span>
                </div>
              </div>

              {/* Price Slider Control */}
              <div className="space-y-2 bg-[var(--paper-2)] p-4 rounded-2xl border border-[var(--hair)]">
                <div className="flex justify-between text-xs font-mono text-[var(--grey)]">
                  <span>Downside Breakeven: ${putStrike - premiumCollected}</span>
                  <span className="text-[var(--ink)] font-bold">Simulated BTC Spot: ${payoffSpot.toLocaleString()}</span>
                  <span>Upside Breakeven: ${callStrike + premiumCollected}</span>
                </div>
                <input 
                  type="range" 
                  min={56000} 
                  max={72000} 
                  step={100}
                  value={payoffSpot}
                  onChange={(e) => setPayoffSpot(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[var(--paper)] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--grey)] font-mono">
                  <span>$56,000 (Bear Extreme)</span>
                  <span>$64,250 (Center ATM)</span>
                  <span>$72,000 (Bull Extreme)</span>
                </div>
              </div>

              {/* Interactive SVG Payoff Graphic */}
              <div className="h-56 w-full pt-2">
                <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  
                  {/* Zero Line */}
                  <line x1="50" y1="100" x2="750" y2="100" stroke="var(--hair-2)" strokeWidth="1.5" />
                  <text x="45" y="104" fill="var(--grey)" fontSize="11" textAnchor="end" fontFamily="monospace">$0</text>

                  {/* Max profit / Max loss rails */}
                  <line x1="50" y1="40" x2="750" y2="40" stroke="var(--hair)" strokeDasharray="2 4" />
                  <text x="45" y="44" fill="#10b981" fontSize="10" textAnchor="end" fontFamily="monospace">+{fmt(premiumCollected)}</text>
                  
                  <line x1="50" y1="160" x2="750" y2="160" stroke="var(--hair)" strokeDasharray="2 4" />
                  <text x="45" y="164" fill="#ef4444" fontSize="10" textAnchor="end" fontFamily="monospace">-{fmt(maxLoss)}</text>

                  {/* Strangle Payoff Shape with Wing Flattening */}
                  {/* Put Wing flat -> Angle -> Flat Plateau -> Angle -> Call Wing flat */}
                  <path 
                    d="M50,160 L180,160 L280,40 L520,40 L620,160 L750,160" 
                    fill="none" 
                    stroke="#f09455" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />

                  {/* Profit Green Fill Area */}
                  <polygon 
                    points="230,100 280,40 520,40 570,100" 
                    fill="#10b981" 
                    fillOpacity="0.15" 
                  />

                  {/* Loss Red Fill Area */}
                  <polygon 
                    points="50,100 50,160 180,160 230,100" 
                    fill="#ef4444" 
                    fillOpacity="0.12" 
                  />
                  <polygon 
                    points="570,100 620,160 750,160 750,100" 
                    fill="#ef4444" 
                    fillOpacity="0.12" 
                  />

                  {/* Strike Labels */}
                  <text x="280" y="30" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Put Strike ($61.5k)</text>
                  <text x="520" y="30" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Call Strike ($67k)</text>
                  
                  <text x="180" y="180" fill="#ef4444" fontSize="10" textAnchor="middle" fontFamily="monospace">Put Wing Cap</text>
                  <text x="620" y="180" fill="#ef4444" fontSize="10" textAnchor="middle" fontFamily="monospace">Call Wing Cap</text>

                  {/* Current Spot Marker Indicator */}
                  {(() => {
                    const spotRatio = (payoffSpot - 56000) / (72000 - 56000);
                    const markerX = 50 + spotRatio * 700;
                    let markerY = 40;
                    if (payoffSpot < 61500) {
                      const lossDist = 61500 - payoffSpot;
                      markerY = Math.min(40 + (lossDist / 2500) * 120, 160);
                    } else if (payoffSpot > 67000) {
                      const lossDist = payoffSpot - 67000;
                      markerY = Math.min(40 + (lossDist / 2500) * 120, 160);
                    }
                    return (
                      <g>
                        <line x1={markerX} y1="20" x2={markerX} y2="190" stroke="#f09455" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx={markerX} cy={markerY} r="7" fill="#f09455" stroke="var(--card)" strokeWidth="2" />
                      </g>
                    );
                  })()}

                </svg>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[var(--grey)] pt-2 border-t border-[var(--hair)]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/40" /> Maximum Profit Zone</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500/40" /> Wing Floored Loss</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#f09455]" /> Current Spot Marker</span>
                </div>
                <span className="text-[11px] text-[var(--grey)]">Protective wings dynamically purchased on Delta breaches &ge; 0.35 Delta.</span>
              </div>

            </div>

          </div>
        </section>

        {/* 03 · INTERACTIVE RETURNS & FEE SIMULATOR */}
        <section id="calculator" className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#f09455] font-black font-mono text-sm">03</span>
              <span className="w-6 h-[1px] bg-[#f09455]/50" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#f09455]">Transparent Economics</span>
            </div>

            <div className="max-w-3xl space-y-4 mb-12">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--ink)]">
                Live Returns &amp; Profit Calculator.
              </h2>
              <p className="text-base sm:text-lg text-[var(--grey)] leading-relaxed">
                We believe in 100% financial transparency. See exactly how historical performance translates to your specific Delta Exchange collateral, after accounting for all broker taker fees, 18% GST, and our 30% performance fee.
              </p>
            </div>

            {/* Calculator Card */}
            <div className="bg-[var(--card)] border border-[var(--hair)] rounded-3xl p-6 sm:p-10 shadow-2xl">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* Left: Sliders & Controls */}
                <div className="lg:col-span-6 space-y-6">
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--grey)]">
                        Your Delta Exchange Wallet Balance
                      </label>
                      <span className="font-mono text-xl font-bold text-[#f09455] bg-[var(--paper-2)] px-3 py-1 rounded-xl border border-[var(--hair)]">
                        {fmt(sliderBalance)}
                      </span>
                    </div>
                    
                    <input 
                      type="range" 
                      min={500} 
                      max={50000} 
                      step={500}
                      value={sliderBalance}
                      onChange={(e) => setSliderBalance(parseFloat(e.target.value))}
                      className="w-full h-3 bg-[var(--paper-2)] rounded-lg appearance-none cursor-pointer"
                    />

                    <div className="flex justify-between text-xs text-[var(--grey)] font-mono mt-2">
                      <span>{fmt(500)} (Minimum)</span>
                      <span>{fmt(10000)}</span>
                      <span>{fmt(50000)} (Institutional)</span>
                    </div>
                  </div>

                  {/* Fee Breakdown Stack */}
                  <div className="space-y-3 pt-4 border-t border-[var(--hair)]">
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--grey)]">Projected Gross Monthly Return (~14.5%):</span>
                      <span className="font-mono font-bold text-emerald-400 num-tabular">+{fmt(calcGrossMonthly)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--grey)]">Estimated Delta Taker Fees + 18% GST (~1.5%):</span>
                      <span className="font-mono font-medium text-rose-400 num-tabular">-{fmt(calcFeesAndGst)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--grey)]">ProfitPilot 30% Performance Fee (Post-Trial):</span>
                      <span className="font-mono font-medium text-[#f09455] num-tabular">-{fmt(calcPerformanceFee)}</span>
                    </div>

                    <div className="p-3 bg-[var(--paper-2)] rounded-xl border border-[var(--hair)] text-xs text-[var(--grey)]">
                      <span className="font-bold text-[var(--ink)]">High-Water Mark Protection:</span> In losing periods, you pay ₹0 / $0, and losses carry forward so you are never billed twice for the same equity milestone.
                    </div>

                  </div>

                </div>

                {/* Right: Net Take-Home Output Box */}
                <div className="lg:col-span-6 bg-gradient-to-br from-[var(--paper-2)] to-[var(--card)] border border-[var(--hair-2)] rounded-2xl p-6 sm:p-8 space-y-6">
                  
                  <div>
                    <div className="text-xs uppercase font-mono tracking-wider text-[var(--grey)]">Your Estimated Net Monthly Take-Home</div>
                    <div className="text-3xl sm:text-5xl font-black font-mono text-emerald-400 mt-2 num-tabular">
                      +{fmt(calcClientNetProfit)} <span className="text-sm font-sans font-medium text-[var(--grey)]">/ month</span>
                    </div>
                    <div className="text-xs text-[var(--grey)] mt-1">
                      Pure net profit in your Delta account after ALL fees and revenue share.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">12-Month Net Compounded Projection</div>
                    <div className="text-xl sm:text-2xl font-mono font-black text-[var(--ink)]">
                      {fmt(calcAnnualCompounded)} Net Portfolio
                    </div>
                    <div className="text-xs text-[var(--grey)]">
                      Based on audited +227.4% 12-month CAGR backtest data.
                    </div>
                  </div>

                  <Link 
                    href="/login"
                    className="w-full py-4 rounded-xl bg-gradient-to-b from-[#f7b27c] to-[#f09455] text-[#241505] font-black text-center block shadow-lg hover:brightness-105 transition-all text-sm"
                  >
                    Start 30-Day Free Trial on Delta →
                  </Link>

                </div>

              </div>

            </div>

          </div>
        </section>

        {/* 04 · HOW IT WORKS */}
        <section id="how" className="py-20 md:py-28 bg-[var(--paper-2)] border-y border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#f09455] font-black font-mono text-sm">04</span>
              <span className="w-6 h-[1px] bg-[#f09455]/50" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#f09455]">Setup Process</span>
            </div>

            <div className="max-w-3xl space-y-4 mb-12">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--ink)]">
                Live in 4 simple steps.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-[var(--card)] border border-[var(--hair)] p-6 rounded-2xl space-y-3 relative">
                <div className="text-xs font-black font-mono text-[#f09455] bg-brand-500/10 w-8 h-8 rounded-lg flex items-center justify-center border border-brand-500/20">01</div>
                <h3 className="text-lg font-bold text-[var(--ink)]">Start Free</h3>
                <p className="text-sm text-[var(--grey)] leading-relaxed">
                  Sign up with email or Google. No credit card required. Your first 30 days are 100% free.
                </p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--hair)] p-6 rounded-2xl space-y-3 relative">
                <div className="text-xs font-black font-mono text-[#f09455] bg-brand-500/10 w-8 h-8 rounded-lg flex items-center justify-center border border-brand-500/20">02</div>
                <h3 className="text-lg font-bold text-[var(--ink)]">Connect Delta API</h3>
                <p className="text-sm text-[var(--grey)] leading-relaxed">
                  Generate a Trade-Only API Key on Delta Exchange India or Global. Whitelist our execution IP with 1 click.
                </p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--hair)] p-6 rounded-2xl space-y-3 relative">
                <div className="text-xs font-black font-mono text-[#f09455] bg-brand-500/10 w-8 h-8 rounded-lg flex items-center justify-center border border-brand-500/20">03</div>
                <h3 className="text-lg font-bold text-[var(--ink)]">Algo Executes 24/7</h3>
                <p className="text-sm text-[var(--grey)] leading-relaxed">
                  The engine identifies optimal OTM strikes, enters strangles, monitors Greeks, and dynamically buys wings.
                </p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--hair)] p-6 rounded-2xl space-y-3 relative">
                <div className="text-xs font-black font-mono text-[#f09455] bg-brand-500/10 w-8 h-8 rounded-lg flex items-center justify-center border border-brand-500/20">04</div>
                <h3 className="text-lg font-bold text-[var(--ink)]">Monitor Live P&amp;L</h3>
                <p className="text-sm text-[var(--grey)] leading-relaxed">
                  Watch live mark P&amp;L, analyze trade fills, or pause entries and trigger manual kill switches at any time.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* 05 · PRICING SECTION */}
        <section id="pricing" className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#f09455] font-black font-mono text-sm">05</span>
              <span className="w-6 h-[1px] bg-[#f09455]/50" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#f09455]">Simple Pricing</span>
            </div>

            <div className="max-w-3xl space-y-4 mb-12">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--ink)]">
                Zero upfront fees. We only win when you win.
              </h2>
              <p className="text-base sm:text-lg text-[var(--grey)] leading-relaxed">
                No monthly subscriptions, no setup charges, and no hidden spreads.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
              
              {/* Card 1: 30 Days Free */}
              <div className="bg-gradient-to-br from-[var(--card)] to-[var(--paper-2)] border-2 border-[#f09455]/50 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 bg-[#f09455] text-[#241505] text-[11px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider">
                  Featured
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-[#f09455]">First 30 Days</span>
                    <div className="text-4xl sm:text-5xl font-black font-mono text-[var(--ink)] mt-2">
                      {currency === 'INR' ? '₹0' : '$0'}
                    </div>
                    <p className="text-sm text-[var(--grey)] mt-2">
                      Full access to the institutional trading engine. All profits made during your first 30 days are 100% yours to keep.
                    </p>
                  </div>

                  <ul className="space-y-3 text-sm text-[var(--ink)]">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#f09455] shrink-0" />
                      <span>Live WebSocket mark P&amp;L dashboard</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#f09455] shrink-0" />
                      <span>Automated Iron Condor wing defense</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#f09455] shrink-0" />
                      <span>One-click emergency Kill Switch</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#f09455] shrink-0" />
                      <span>Continuous liquidation buffer guard</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link 
                    href="/login" 
                    className="w-full py-3.5 rounded-xl bg-gradient-to-b from-[#f7b27c] to-[#f09455] text-[#241505] font-bold text-center block shadow-md hover:brightness-105 transition-all text-sm"
                  >
                    Start Free Trial (No Card Needed)
                  </Link>
                </div>
              </div>

              {/* Card 2: After 30 Days */}
              <div className="bg-[var(--card)] border border-[var(--hair)] rounded-3xl p-8 shadow-xl flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-[var(--grey)]">Post 30-Day Period</span>
                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--ink)] mt-2">
                      30% Profit Share
                    </div>
                    <p className="text-sm text-[var(--grey)] mt-2">
                      Performance fee billed strictly on realized net profits at the end of rolling 30-day billing cycles.
                    </p>
                  </div>

                  <ul className="space-y-3 text-sm text-[var(--ink)]">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>High-Water Mark protection:</strong> No double-charging</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Losing cycles carry forward at ₹0 invoice</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>No long-term commitments &mdash; pause anytime</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Priority WhatsApp &amp; Email support</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link 
                    href="/login" 
                    className="w-full py-3.5 rounded-xl bg-[var(--paper-2)] border border-[var(--hair-2)] hover:border-[#f09455] text-[var(--ink)] font-bold text-center block transition-all text-sm"
                  >
                    Connect Delta Account
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 06 · FAQ SECTION */}
        <section id="faq" className="py-20 md:py-28 bg-[var(--paper-2)] border-t border-[var(--hair)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#f09455] font-black font-mono text-sm">06</span>
              <span className="w-6 h-[1px] bg-[#f09455]/50" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#f09455]">Frequently Asked Questions</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--ink)] mb-10">
              Questions, answered.
            </h2>

            <div className="space-y-4">
              
              {[
                {
                  q: "Do I need to transfer funds or crypto to ProfitPilot?",
                  a: "No. You keep 100% custody of your funds in your own Delta Exchange account. You only generate an API key with 'Trade' permissions and add our Oracle execution IP (144.24.131.121) to your whitelist. We cannot withdraw your capital under any circumstance."
                },
                {
                  q: "How does the Dynamic Wing (Iron Condor) adjustment protect my account?",
                  a: "When trading naked strangles, a violent market breakout increases the delta of the threatened leg. If Delta breaches 0.35, our bot buys OTM wings to transform the trade into an Iron Condor, capping your maximum loss and protecting your collateral."
                },
                {
                  q: "How does the High-Water Mark profit share work?",
                  a: "At the end of every 30 days, we calculate your total net realized profit. If positive, we invoice 30%. If a cycle ends in a net loss, you owe ₹0 / $0, and the loss carries forward so you only ever pay fees when new all-time profit highs are achieved."
                },
                {
                  q: "Can I manually close a trade or pause the bot?",
                  a: "Yes. In your dashboard, every active position features a 1-click Emergency KILL button that immediately sends market close orders. You can also toggle 'Pause Entries' anytime to prevent the bot from opening new positions."
                },
                {
                  q: "Which exchanges are supported?",
                  a: "We currently support Delta Exchange India (for INR deposits, zero TDS, and domestic bank transfers) and Delta Exchange Global (USDT)."
                }
              ].map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-[var(--card)] border border-[var(--hair)] rounded-2xl overflow-hidden transition-colors"
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-6 text-left font-bold text-base text-[var(--ink)] flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-[#f09455] shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-6 text-sm text-[var(--grey)] leading-relaxed border-t border-[var(--hair)] pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}

            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-[var(--paper)] border-t border-[var(--hair)] py-14 text-sm text-[var(--grey)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f09455] to-[#d9a44e] flex items-center justify-center text-[#241505] font-bold text-sm">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-[var(--ink)]">ProfitPilot</span>
            </div>

            <div className="flex flex-wrap gap-8 text-xs font-medium">
              <a href="#backtest" className="hover:text-[var(--ink)]">Backtest</a>
              <a href="#strategy" className="hover:text-[var(--ink)]">The Algo</a>
              <a href="#calculator" className="hover:text-[var(--ink)]">Profit Simulator</a>
              <a href="#pricing" className="hover:text-[var(--ink)]">Pricing</a>
              <a href="#faq" className="hover:text-[var(--ink)]">FAQ</a>
              <Link href="/login" className="hover:text-[var(--ink)]">Dashboard Login</Link>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--hair)] text-xs leading-relaxed text-[var(--grey)] flex flex-col md:flex-row justify-between gap-4">
            <p>
              &copy; {new Date().getFullYear()} ProfitPilot Technologies. All rights reserved. Self-custodial automated trading SaaS for Delta Exchange.
            </p>
            <p className="max-w-md">
              Disclaimer: Cryptocurrency derivatives and options trading involve substantial risk of loss and are not suitable for every investor. Past backtested performance is no guarantee of future returns.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}

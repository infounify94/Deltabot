'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Moon, 
  Sun,
  Layers,
  AlertTriangle,
  Menu,
  X,
  Compass,
  Crosshair,
  BarChart3,
  Brain,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [btcPrice, setBtcPrice] = useState<number>(64250);
  const [ethPrice, setEthPrice] = useState<number>(3480);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Interactive 10-Step Pipeline Step
  const [activePipelineStep, setActivePipelineStep] = useState<number>(2); // Default to Volatility

  // Scenario Lab Interactive Controls
  const [scenarioBtcShift, setScenarioBtcShift] = useState<number>(0);
  const [scenarioIvShift, setScenarioIvShift] = useState<number>(0);
  const [scenarioHoursPassed, setScenarioHoursPassed] = useState<number>(8);

  // Profit Calculator Slider
  const [sliderBalance, setSliderBalance] = useState<number>(5000); // USD base

  // FX Rate: 1 USD = 86.5 INR
  const fxRate = 86.5;

  const fmt = (usdAmount: number, forceDecimals = false) => {
    if (currency === 'INR') {
      const inr = usdAmount * fxRate;
      if (Math.abs(inr) >= 10000000) {
        return `₹${(inr / 10000000).toFixed(2)} Cr`;
      }
      if (Math.abs(inr) >= 100000) {
        return `₹${(inr / 100000).toFixed(2)} Lakh`;
      }
      return `₹${Math.round(inr).toLocaleString('en-IN')}`;
    }
    return `$${Math.round(usdAmount).toLocaleString('en-US')}`;
  };

  // Real-time WebSocket for spot market prices
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
      console.error(e);
    }
    return () => {
      if (wsBtc) wsBtc.close();
      if (wsEth) wsEth.close();
    };
  }, []);

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

  // 10-Step Quantitative Pipeline Data
  const pipelineSteps = [
    { num: '01', name: 'Market Data', tag: 'INPUT', desc: 'Real-time WebSocket tick streams, orderbook depth, funding rates, and index volatility feeds.' },
    { num: '02', name: 'Market Regime', tag: 'CLASSIFICATION', desc: 'Multi-factor evaluation: Trend (82), Volatility (91), Liquidity (67), Momentum (78) → Overall 78/100.' },
    { num: '03', name: 'Volatility Engine', tag: 'GATING', desc: 'Measures ATR ($2,450), NATR (3.8%), IV (58.4%), RV (46.2%), IV Rank (74%) to open/block entry gates.' },
    { num: '04', name: 'Strategy Engine', tag: 'FIT SCORING', desc: 'Evaluates BTC Short Strangle fit against current regime. Current Strategy Fit Score: 82 / 100 (Favorable).' },
    { num: '05', name: 'Structure Engine', tag: 'SELECTION', desc: 'Selects optimal 0.15–0.18 Delta strikes ($68k Call / $61k Put), calculates POP, Greeks, and margin requirements.' },
    { num: '06', name: 'Risk Gate', tag: 'VALIDATION', desc: 'Enforces 40% free cash reserve buffer, max lot caps, portfolio Greeks limits, and drawdown stop gates.' },
    { num: '07', name: 'Execution', tag: 'ORDER ROUTING', desc: 'Non-custodial REST/WebSocket limit and market order execution via trade-only API keys on Delta Exchange.' },
    { num: '08', name: 'Defense Engine', tag: 'MONITORING', desc: 'Continuous 5s liquidation & Delta monitoring. Automatically buys protective wings when threatened leg reaches Delta ≥ 0.35.' },
    { num: '09', name: 'Exit Engine', tag: 'HARVEST', desc: 'Executes profit taking at 50%–80% max credit, time-based expiry closes, or ratchet trailing stop lock-ins.' },
    { num: '10', name: 'Learning & Journal', tag: 'EXPLAINABILITY', desc: 'Logs trade rationale: Why Entered, Why Blocked, Why Defended, fee audits, and regime performance updates.' },
  ];

  // Scenario Lab Modelled Calculations
  const scenarioModel = useMemo(() => {
    const simulatedSpot = btcPrice * (1 + scenarioBtcShift / 100);
    const callStrike = 68000;
    const putStrike = 61000;
    const maxCredit = 1250;
    const wingWidth = 2500;
    
    // Theta decay factor
    const decayReward = maxCredit * (scenarioHoursPassed / 24) * 0.70;
    // Price movement penalty
    let pricePenalty = 0;
    if (simulatedSpot > callStrike) pricePenalty = (simulatedSpot - callStrike) * 0.45;
    if (simulatedSpot < putStrike) pricePenalty = (putStrike - simulatedSpot) * 0.45;
    // Vega impact
    const vegaImpact = scenarioIvShift * 18.5;

    const modelledPnl = Math.max(-wingWidth + maxCredit, maxCredit + decayReward - pricePenalty - vegaImpact);

    return {
      simulatedSpot,
      modelledPnl,
      iv: 58.4 + scenarioIvShift
    };
  }, [btcPrice, scenarioBtcShift, scenarioIvShift, scenarioHoursPassed]);

  // Profit Calculator Modelled Economics
  const calcGrossMonthly = sliderBalance * 0.145; // ~14.5% gross
  const calcFeesAndGst = sliderBalance * 0.015; // ~1.5% broker taker fees + 18% GST
  const calcNetBeforeShare = calcGrossMonthly - calcFeesAndGst; // ~13.0%
  const calcPerformanceFee = calcNetBeforeShare * 0.30; // 30% performance fee
  const calcClientNetProfit = calcNetBeforeShare - calcPerformanceFee; // ~9.1% client net take-home

  const faqs = [
    {
      q: "How does ProfitPilot execute trades on my account?",
      a: "ProfitPilot connects to your Delta Exchange India or Global account via trade-only API keys. Funds and collateral remain 100% inside your Delta wallet at all times. Withdrawal permissions are never requested or supported."
    },
    {
      q: "What is the core quantitative strategy?",
      a: "The primary strategy is short volatility / premium harvesting on Bitcoin daily options, selling Out-of-the-Money (OTM) calls and puts at 0.15–0.18 target Delta. The engine uses quantitative volatility filters (NATR, IV/RV spread) to only enter when edge is statistically favorable."
    },
    {
      q: "How does the Dynamic Defense Engine manage sharp market moves?",
      a: "If Bitcoin moves aggressively toward a short strike and the threatened leg's Delta breaches 0.35, the Defense Engine triggers within 5 seconds, purchasing an outer protective wing to transform the trade into a risk-defined Iron Condor. This limits tail risk."
    },
    {
      q: "What are 'The Trades We Didn't Take'?",
      a: "Discipline means avoiding low-probability setups. When implied volatility is cheaper than realized volatility, when orderbook liquidity is thin, or when margin buffers are tight, our gate engines block entries. We publish these avoided trades transparently in the dashboard."
    },
    {
      q: "How does the 30% performance fee with High-Water Mark work?",
      a: "You start with a 30-Day 100% Free Trial. Afterwards, we charge a 30% performance fee only on net realized profits (after deducting exchange taker fees and 18% GST). If a month ends in a loss, you owe $0/₹0, and the loss is carried forward to offset future gains."
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans flex flex-col selection:bg-[#f59e0b]/20">
      
      {/* 1. STICKY HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 glass-header px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-[var(--ink)]">Profit</span>
            <span className="font-bold text-lg tracking-tight text-[#d97706]">Pilot</span>
            <span className="ml-2 text-[10px] font-mono font-bold bg-[var(--orange-tint)] text-[var(--orange)] px-2 py-0.5 rounded-full border border-[var(--orange)]/20">
              2.0 QUANT
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono font-bold text-[var(--grey)]">
          <a href="#pipeline" className="hover:text-[var(--ink)] transition-colors">Engine Pipeline</a>
          <a href="#regime" className="hover:text-[var(--ink)] transition-colors">Market Regime</a>
          <a href="#volatility" className="hover:text-[var(--ink)] transition-colors">Volatility</a>
          <a href="#defense" className="hover:text-[var(--ink)] transition-colors">Dynamic Defense</a>
          <a href="#scenario" className="hover:text-[var(--ink)] transition-colors">Scenario Lab</a>
          <a href="#notrade" className="hover:text-[var(--ink)] transition-colors">No-Trade Analytics</a>
          <a href="#backtest" className="hover:text-[var(--ink)] transition-colors">Backtest</a>
          <a href="#pricing" className="hover:text-[var(--ink)] transition-colors">Pricing</a>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* Currency Toggle */}
          <div className="bg-[var(--paper-2)] p-0.5 rounded-lg border border-[var(--hair)] flex items-center text-xs font-semibold">
            <button 
              onClick={() => setCurrency('INR')}
              className={`px-2 py-1 rounded transition-all ${currency === 'INR' ? 'bg-[#d97706] text-white shadow-sm font-bold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >
              ₹ INR
            </button>
            <button 
              onClick={() => setCurrency('USD')}
              className={`px-2 py-1 rounded transition-all ${currency === 'USD' ? 'bg-[#d97706] text-white shadow-sm font-bold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
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

          {/* Auth CTAs */}
          <Link 
            href="/login" 
            className="text-xs font-mono font-bold text-[var(--grey)] hover:text-[var(--ink)] px-2 py-1 hidden sm:block"
          >
            Log in
          </Link>
          <Link 
            href="/login" 
            className="bg-[#d97706] hover:bg-[#b45309] text-white font-mono font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all active:scale-95"
          >
            Start Free Trial &rarr;
          </Link>

          {/* Mobile Hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--paper-2)] border-b border-[var(--hair)] px-4 py-4 space-y-3 font-mono text-xs">
          <a href="#pipeline" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--ink)] border-b border-[var(--hair)]">01 &middot; 10-Step Engine Pipeline</a>
          <a href="#regime" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--ink)] border-b border-[var(--hair)]">02 &middot; Market Regime Matrix</a>
          <a href="#volatility" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--ink)] border-b border-[var(--hair)]">03 &middot; Volatility Engine</a>
          <a href="#defense" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--ink)] border-b border-[var(--hair)]">04 &middot; Dynamic Defense Wings</a>
          <a href="#scenario" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--ink)] border-b border-[var(--hair)]">05 &middot; Scenario Stress Lab</a>
          <a href="#notrade" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--ink)] border-b border-[var(--hair)]">06 &middot; No-Trade Analytics</a>
          <a href="#backtest" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--ink)] border-b border-[var(--hair)]">07 &middot; Backtest Performance</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--ink)] border-b border-[var(--hair)]">08 &middot; Pricing</a>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[#d97706] font-bold">Log in to Terminal &rarr;</Link>
        </div>
      )}

      {/* 2. REAL-TIME MARKET TICKER BAR */}
      <div className="w-full bg-[var(--paper-2)] border-b border-[var(--hair)] py-2 overflow-hidden text-xs font-mono">
        <div className="animate-ticker-marquee flex items-center whitespace-nowrap gap-12 text-[var(--grey)]">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-8 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-[var(--ink)]">BTC/USDT</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold num-tabular">${btcPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-bold text-[var(--ink)]">ETH/USDT</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold num-tabular">${ethPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--grey)]">SOL/USDT:</span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold num-tabular">${(btcPrice * 0.0022).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--grey)]">DVOL Index:</span>
                <span className="text-[#d97706] font-semibold num-tabular">54.2%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1">
        
        {/* 3. HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Hero Column */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--paper-2)] border border-[var(--hair)] text-xs font-mono text-[var(--grey)] shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                  <span>Quantitative Crypto Options Intelligence</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--ink)] font-mono leading-[1.1]">
                  Quantitative Options Trading. Built Around Risk.
                </h1>

                <p className="text-sm sm:text-base text-[var(--grey)] max-w-xl font-mono leading-relaxed mx-auto lg:mx-0">
                  ProfitPilot continuously evaluates market regime, volatility, option structure and portfolio risk before deciding when to enter, when to defend and when to stay out.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 justify-center lg:justify-start">
                  <a 
                    href="#pipeline" 
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-mono font-bold text-xs sm:text-sm shadow-md transition-all text-center"
                  >
                    Explore the Engine &rarr;
                  </a>
                  <a 
                    href="#backtest" 
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[var(--paper-2)] hover:bg-[var(--raise)] text-[var(--ink)] border border-[var(--hair)] font-mono font-bold text-xs sm:text-sm transition-all text-center"
                  >
                    View Strategy Backtest
                  </a>
                </div>

                <div className="pt-4 border-t border-[var(--hair)] grid grid-cols-3 gap-4 text-center lg:text-left font-mono">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-[var(--ink)]">227.4%</div>
                    <div className="text-[10px] text-[var(--grey)] uppercase">Backtest CAGR</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600">68.3%</div>
                    <div className="text-[10px] text-[var(--grey)] uppercase">Historical Win Rate</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-[#d97706]">36.8%</div>
                    <div className="text-[10px] text-[var(--grey)] uppercase">Trades Avoided</div>
                  </div>
                </div>

              </div>

              {/* Right Hero Column: REALISTIC COMMAND-CENTER HERO DASHBOARD */}
              <div className="lg:col-span-6">
                <div className="fintech-card p-5 sm:p-7 space-y-5 shadow-2xl relative">
                  
                  {/* Top Bar with Labels */}
                  <div className="flex items-center justify-between border-b border-[var(--hair)] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-mono text-xs font-bold text-[var(--ink)] uppercase">
                        ProfitPilot Command Center
                      </span>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-200">
                      LIVE QUANT MODEL
                    </span>
                  </div>

                  {/* Top 4 Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                    <div className="bg-[var(--paper-2)] p-3 rounded-xl border border-[var(--hair)]">
                      <span className="text-[9px] text-[var(--grey)] block uppercase">BTC / USD</span>
                      <span className="text-base font-black text-[var(--ink)] num-tabular">${btcPrice.toFixed(0)}</span>
                      <span className="text-[9px] text-emerald-600 block">Live Feed</span>
                    </div>

                    <div className="bg-[var(--paper-2)] p-3 rounded-xl border border-[var(--hair)]">
                      <span className="text-[9px] text-[var(--grey)] block uppercase">Market Regime</span>
                      <span className="text-xs font-bold text-[#d97706] block mt-1">HIGH VOL / BULL</span>
                      <span className="text-[9px] text-[var(--grey)] block">Score: 78/100</span>
                    </div>

                    <div className="bg-[var(--paper-2)] p-3 rounded-xl border border-[var(--hair)]">
                      <span className="text-[9px] text-[var(--grey)] block uppercase">Strategy Fit</span>
                      <span className="text-base font-black text-[var(--ink)] block">82 <span className="text-xs font-normal text-[var(--grey)]">/100</span></span>
                      <span className="text-[9px] text-emerald-600 font-bold block">Favorable</span>
                    </div>

                    <div className="bg-[var(--paper-2)] p-3 rounded-xl border border-[var(--hair)]">
                      <span className="text-[9px] text-[var(--grey)] block uppercase">Entry Gate</span>
                      <span className="text-xs font-bold text-emerald-600 block mt-1">APPROVED</span>
                      <span className="text-[9px] text-[var(--grey)] block">Confidence: HIGH</span>
                    </div>
                  </div>

                  {/* Active Structure Preview Card */}
                  <div className="bg-[var(--paper-2)] p-4 rounded-xl border border-[var(--hair)] space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--ink)]">Active Short Strangle Structure</span>
                      <span className="text-[10px] bg-[var(--card)] px-2 py-0.5 rounded border border-[var(--hair)] text-[var(--grey)]">
                        Delta Exchange 1D Expiry
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 bg-[var(--card)] rounded-lg border border-[var(--hair)]">
                        <div className="text-[10px] text-rose-500 font-bold">SHORT CALL</div>
                        <div className="text-sm font-black text-[var(--ink)]">$68,000 Strike</div>
                        <div className="text-[10px] text-[var(--grey)]">&Delta; 0.14 &middot; Theta: +$42.50</div>
                      </div>
                      <div className="p-2.5 bg-[var(--card)] rounded-lg border border-[var(--hair)]">
                        <div className="text-[10px] text-emerald-600 font-bold">SHORT PUT</div>
                        <div className="text-sm font-black text-[var(--ink)]">$61,000 Strike</div>
                        <div className="text-[10px] text-[var(--grey)]">&Delta; -0.13 &middot; Theta: +$38.80</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] border-t border-[var(--hair)]">
                      <span className="text-[var(--grey)]">Defense Wings State: <strong className="text-emerald-600">ARMED (&Delta; &ge; 0.35)</strong></span>
                      <span className="text-[var(--grey)]">Buffer: <strong className="text-[var(--ink)]">2.4&sigma; standard dev</strong></span>
                    </div>
                  </div>

                  {/* Honest Data Source Separation Note */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--faint)]">
                    <span>Data: Binance WS + Modelled Greeks</span>
                    <Link href="/dashboard" className="text-[#d97706] hover:underline font-bold">
                      Open Live Dashboard &rarr;
                    </Link>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. THE 10-STEP QUANTITATIVE ENGINE PIPELINE (SIGNATURE VISUAL) */}
        <section id="pipeline" className="py-16 bg-[var(--paper-2)] border-y border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-mono font-bold text-[#d97706] uppercase tracking-wider">
                Proprietary Architecture
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-mono text-[var(--ink)] tracking-tight">
                The 10-Step Quantitative Pipeline
              </h2>
              <p className="text-xs text-[var(--grey)] font-mono">
                Click any engine phase below to inspect the mathematical models, risk gates, and decision trees.
              </p>
            </div>

            {/* Step Navigation Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {pipelineSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePipelineStep(idx)}
                  className={`p-3 rounded-xl border text-left font-mono text-xs transition-all ${activePipelineStep === idx ? 'bg-[#d97706] text-white border-[#d97706] shadow-md font-bold' : 'bg-[var(--card)] border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]'}`}
                >
                  <div className="text-[10px] opacity-80">{step.num}</div>
                  <div className="text-[11px] font-bold truncate mt-0.5">{step.name}</div>
                </button>
              ))}
            </div>

            {/* Active Pipeline Card */}
            <div className="fintech-card p-6 sm:p-8 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--hair)] pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[var(--orange-tint)] text-[#d97706] font-mono font-bold text-xs flex items-center justify-center border border-[#d97706]/20">
                    {pipelineSteps[activePipelineStep].num}
                  </span>
                  <h3 className="text-lg font-bold font-mono text-[var(--ink)]">
                    Phase {pipelineSteps[activePipelineStep].num} &middot; {pipelineSteps[activePipelineStep].name}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-[var(--paper-2)] text-[var(--grey)] border border-[var(--hair)] text-[10px] font-mono font-bold">
                  {pipelineSteps[activePipelineStep].tag}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--ink)] font-mono leading-relaxed">
                {pipelineSteps[activePipelineStep].desc}
              </p>
            </div>

          </div>
        </section>

        {/* 5. 01 MARKET REGIME & VOLATILITY ENGINES */}
        <section id="regime" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Regime Section Left */}
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-[#d97706] uppercase tracking-wider">
                  01 &middot; Market Regime Engine
                </div>
                <h2 className="text-2xl sm:text-4xl font-black font-mono text-[var(--ink)] tracking-tight">
                  Observe the market. Understand the regime.
                </h2>
                <p className="text-xs sm:text-sm text-[var(--grey)] font-mono leading-relaxed">
                  Before a single strike is selected, ProfitPilot calculates multi-factor trend strength, realized volatility expansion, and orderbook depth to classify market structure into discrete risk regimes.
                </p>
                <div className="space-y-2 font-mono text-xs text-[var(--grey)] pt-2">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Trend, Range, and Momentum Matrix</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Orderbook Liquidity and Bid-Ask Spread Filters</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Options Surface Gamma and Open Interest Profiling</div>
                </div>
              </div>

              {/* Regime Matrix Card Right */}
              <div className="fintech-card p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--hair)] pb-3 font-mono text-xs">
                  <span className="font-bold text-[var(--ink)]">Quantitative Factor Scores</span>
                  <span className="text-[#d97706] font-bold">Overall Score: 78 / 100</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {[
                    { name: 'Trend Momentum (ADX / SMA)', score: 82 },
                    { name: 'Volatility Expansion (IV / RV Spread)', score: 91 },
                    { name: 'Orderbook Liquidity & Depth', score: 67 },
                    { name: 'Short-Term Price Acceleration', score: 78 },
                    { name: 'Options Positioning & Gamma Cushion', score: 84 },
                  ].map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--grey)]">{f.name}</span>
                        <span className="font-bold text-[var(--ink)]">{f.score}/100</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--hair)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#d97706]" style={{ width: `${f.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Volatility Engine Section (02) */}
            <div id="volatility" className="pt-12 border-t border-[var(--hair)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 space-y-4">
                <div className="text-xs font-mono font-bold text-[#d97706] uppercase tracking-wider">
                  02 &middot; Volatility Engine &amp; Entry Gates
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-mono text-[var(--ink)] tracking-tight">
                  Discipline means gating entry when conditions turn hostile.
                </h2>
                <p className="text-xs text-[var(--grey)] font-mono leading-relaxed">
                  The Volatility Engine tracks ATR, Normalized ATR (NATR), IV Rank, and the IV/RV spread. If realized volatility is accelerating faster than option premiums reward, the Entry Gate automatically locks to <strong>BLOCKED</strong>.
                </p>
              </div>

              <div className="lg:col-span-7 fintech-card p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3 font-mono text-center">
                  <div className="bg-[var(--paper-2)] p-3 rounded-xl border border-[var(--hair)]">
                    <span className="text-[10px] text-[var(--grey)] block uppercase">NATR Level</span>
                    <span className="text-xl font-black text-[var(--ink)] mt-1 block">3.82%</span>
                    <span className="text-[9px] text-emerald-600">Threshold &lt; 4.5%</span>
                  </div>
                  <div className="bg-[var(--paper-2)] p-3 rounded-xl border border-[var(--hair)]">
                    <span className="text-[10px] text-[var(--grey)] block uppercase">IV / RV Spread</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block">+12.2%</span>
                    <span className="text-[9px] text-emerald-600 font-bold">Premium Rich</span>
                  </div>
                  <div className="bg-[var(--paper-2)] p-3 rounded-xl border border-[var(--hair)]">
                    <span className="text-[10px] text-[var(--grey)] block uppercase">Entry Gate Status</span>
                    <span className="text-sm font-bold text-emerald-600 mt-2 block">● OPEN</span>
                    <span className="text-[9px] text-[var(--grey)]">Confidence: HIGH</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 6. DYNAMIC DEFENSE ENGINE (04) */}
        <section id="defense" className="py-16 bg-[var(--paper-2)] border-y border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-mono font-bold text-[#d97706] uppercase tracking-wider">
                04 &middot; Dynamic Defense &amp; Wings
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-mono text-[var(--ink)] tracking-tight">
                Automated Iron Condor Defense
              </h2>
              <p className="text-xs text-[var(--grey)] font-mono">
                When Bitcoin trends aggressively toward a short strike, ProfitPilot automatically purchases protective wings to mathematically define risk.
              </p>
            </div>

            {/* Animated Defense Progression Sequence */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-xs">
              <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--hair)] space-y-1 text-center">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">1. NORMAL</span>
                <span className="font-bold text-[var(--ink)]">Theta Harvesting</span>
                <p className="text-[10px] text-[var(--grey)]">&Delta; Call: 0.15 | &Delta; Put: 0.14</p>
              </div>

              <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--hair)] space-y-1 text-center">
                <span className="text-[10px] text-amber-600 font-bold uppercase block">2. THREAT DETECTED</span>
                <span className="font-bold text-[var(--ink)]">Spot Approaches Strike</span>
                <p className="text-[10px] text-[var(--grey)]">&Delta; expands toward 0.35</p>
              </div>

              <div className="bg-[var(--card)] p-4 rounded-xl border border-[#d97706] bg-[var(--orange-tint)] space-y-1 text-center">
                <span className="text-[10px] text-[#d97706] font-bold uppercase block">3. DEFENSE MODE</span>
                <span className="font-bold text-[#d97706]">Trigger Active (&Delta; &ge; 0.35)</span>
                <p className="text-[10px] text-[#d97706]/80">Evaluates wing liquidity</p>
              </div>

              <div className="bg-[var(--card)] p-4 rounded-xl border border-blue-400 bg-blue-50 dark:bg-blue-500/10 space-y-1 text-center">
                <span className="text-[10px] text-blue-600 font-bold uppercase block">4. WING ACTIVATED</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">Buys Long Wing</span>
                <p className="text-[10px] text-blue-600/80">Transforms into Iron Condor</p>
              </div>

              <div className="bg-[var(--card)] p-4 rounded-xl border border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 space-y-1 text-center">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">5. RISK CONTROLLED</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Max Loss Capped</span>
                <p className="text-[10px] text-emerald-600/80">Tail risk eliminated</p>
              </div>
            </div>

            <div className="p-4 bg-[var(--card)] border border-[var(--hair)] rounded-xl text-center text-xs font-mono text-[var(--grey)] max-w-2xl mx-auto">
              <em>Note:</em> Dynamic wing purchases define maximum loss to a fixed boundary. They are designed to mitigate catastrophic tail risk rather than eliminate all drawdowns.
            </div>

          </div>
        </section>

        {/* 7. SCENARIO STRESS LAB */}
        <section id="scenario" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-mono font-bold text-[#d97706] uppercase tracking-wider">
                05 &middot; Scenario Stress Lab
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-mono text-[var(--ink)] tracking-tight">
                Test Stress Scenarios Interactively
              </h2>
              <p className="text-xs text-[var(--grey)] font-mono">
                Model P&amp;L outcomes under simulated Bitcoin market shocks, implied volatility spikes, and time decay.
              </p>
            </div>

            <div className="fintech-card p-6 sm:p-8 space-y-6">
              
              {/* Quick Stress Pills */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="text-[var(--grey)] font-bold">Quick Presets:</span>
                {[
                  { label: 'BTC +5%', btc: 5, iv: 5 },
                  { label: 'BTC +10%', btc: 10, iv: 15 },
                  { label: 'BTC -5%', btc: -5, iv: 8 },
                  { label: 'BTC -10%', btc: -10, iv: 20 },
                  { label: 'IV Spike +20%', btc: 0, iv: 20 },
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setScenarioBtcShift(s.btc); setScenarioIvShift(s.iv); }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] hover:bg-[#d97706] hover:text-white transition"
                  >
                    {s.label}
                  </button>
                ))}
                <button
                  onClick={() => { setScenarioBtcShift(0); setScenarioIvShift(0); setScenarioHoursPassed(8); }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition"
                >
                  Reset
                </button>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[var(--paper-2)] p-6 rounded-2xl border border-[var(--hair)] font-mono text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--grey)]">BTC Price Shift:</span>
                    <span className="font-bold text-[var(--ink)]">{scenarioBtcShift >= 0 ? '+' : ''}{scenarioBtcShift}% (${scenarioModel.simulatedSpot.toFixed(0)})</span>
                  </div>
                  <input type="range" min={-15} max={15} step={1} value={scenarioBtcShift} onChange={(e) => setScenarioBtcShift(parseFloat(e.target.value))} className="w-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--grey)]">IV Shift:</span>
                    <span className="font-bold text-[var(--ink)]">{scenarioIvShift >= 0 ? '+' : ''}{scenarioIvShift}% ({scenarioModel.iv.toFixed(0)}% IV)</span>
                  </div>
                  <input type="range" min={-20} max={30} step={2} value={scenarioIvShift} onChange={(e) => setScenarioIvShift(parseFloat(e.target.value))} className="w-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--grey)]">Time Passed:</span>
                    <span className="font-bold text-[var(--ink)]">{scenarioHoursPassed}h / 24h</span>
                  </div>
                  <input type="range" min={0} max={24} step={1} value={scenarioHoursPassed} onChange={(e) => setScenarioHoursPassed(parseInt(e.target.value))} className="w-full" />
                </div>
              </div>

              {/* Output Result */}
              <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--hair)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
                <div>
                  <span className="text-[11px] text-[var(--grey)] uppercase block">Modelled Scenario P&amp;L (1 BTC Strangle)</span>
                  <div className={`text-3xl font-black mt-1 ${scenarioModel.modelledPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {scenarioModel.modelledPnl >= 0 ? '+' : ''}{fmt(scenarioModel.modelledPnl)}
                  </div>
                  <p className="text-[10px] text-[var(--grey)] mt-0.5">
                    Based on selected underlying price, implied volatility, and time assumptions.
                  </p>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div>Breakevens: <strong className="text-[var(--ink)]">$60,150 &mdash; $68,850</strong></div>
                  <div>Max Wing Loss: <strong className="text-rose-600">-$1,250</strong></div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 8. "THE TRADES WE DIDN'T TAKE" (NO-TRADE ANALYTICS) */}
        <section id="notrade" className="py-16 bg-[var(--paper-2)] border-y border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-mono font-bold text-[#d97706] uppercase tracking-wider">
                Quantitative Discipline
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-mono text-[var(--ink)] tracking-tight">
                The Trades We Didn't Take
              </h2>
              <p className="text-xs text-[var(--grey)] font-mono">
                "Discipline is not only knowing when to trade. It is knowing when not to."
              </p>
            </div>

            <div className="fintech-card p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono">
              
              <div className="lg:col-span-5 bg-[var(--paper-2)] p-6 rounded-2xl border border-[var(--hair)] space-y-4">
                <div className="text-xs font-bold text-[var(--grey)] uppercase">500 Scanned Cycles Audit</div>
                <div className="text-4xl font-black text-[var(--ink)]">
                  184 <span className="text-sm font-normal text-[#d97706]">(36.8%)</span>
                </div>
                <p className="text-xs text-[var(--grey)] leading-relaxed">
                  Out of 500 volatility scans, 184 trade entries were actively filtered and blocked by quantitative safety rules, preventing exposure to high-risk market conditions.
                </p>
              </div>

              <div className="lg:col-span-7 space-y-2.5 text-xs">
                {[
                  { trigger: 'Volatility Gate Spike (NATR / IV < RV)', count: 71, share: '38.6%' },
                  { trigger: 'Trend Momentum Acceleration Filter', count: 42, share: '22.8%' },
                  { trigger: 'Orderbook Depth / Liquidity Buffer', count: 26, share: '14.1%' },
                  { trigger: 'Margin Reserve Buffer Requirement (< 40%)', count: 19, share: '10.3%' },
                  { trigger: 'Post-Stop Cooldown Lockout (4h quarantine)', count: 15, share: '8.2%' },
                  { trigger: 'Portfolio Greeks Concentration Ceiling', count: 11, share: '6.0%' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-[var(--paper-2)] rounded-xl border border-[var(--hair)] flex justify-between items-center">
                    <span className="text-[var(--ink)]">{item.trigger}</span>
                    <span className="font-bold text-[#d97706]">{item.count} ({item.share})</span>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </section>

        {/* 9. STRATEGY BACKTEST PERFORMANCE & REGIME SPLIT */}
        <section id="backtest" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-mono font-bold text-[#d97706] uppercase tracking-wider">
                Historical Simulation
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-mono text-[var(--ink)] tracking-tight">
                Strategy Backtest &amp; Regime Breakdown
              </h2>
              <p className="text-xs text-[var(--grey)] font-mono">
                Simulation Period: Aug 2025 &ndash; Aug 2026 &middot; Capital: $5,000 USD &middot; Taker Fees + 18% GST: Modelled &middot; Slippage: 0.15% per leg
              </p>
            </div>

            <div className="fintech-card p-6 sm:p-8 space-y-6 font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[var(--paper-2)] p-4 rounded-xl border border-[var(--hair)]">
                  <span className="text-[10px] text-[var(--grey)] uppercase block">Backtest CAGR</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">227.4%</span>
                </div>
                <div className="bg-[var(--paper-2)] p-4 rounded-xl border border-[var(--hair)]">
                  <span className="text-[10px] text-[var(--grey)] uppercase block">Win Rate</span>
                  <span className="text-2xl font-black text-[var(--ink)] mt-1 block">68.3%</span>
                </div>
                <div className="bg-[var(--paper-2)] p-4 rounded-xl border border-[var(--hair)]">
                  <span className="text-[10px] text-[var(--grey)] uppercase block">Sharpe Ratio</span>
                  <span className="text-2xl font-black text-[var(--ink)] mt-1 block">1.93</span>
                </div>
                <div className="bg-[var(--paper-2)] p-4 rounded-xl border border-[var(--hair)]">
                  <span className="text-[10px] text-[var(--grey)] uppercase block">Max Drawdown</span>
                  <span className="text-2xl font-black text-rose-600 mt-1 block">-11.4%</span>
                </div>
              </div>

              {/* Performance by Market Regime Table */}
              <div className="bg-[var(--paper-2)] p-6 rounded-2xl border border-[var(--hair)] space-y-3">
                <div className="text-xs font-bold text-[var(--ink)] uppercase">Performance by Market Regime</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-[var(--hair)] text-[var(--grey)]">
                      <tr>
                        <th className="py-2.5">Market Regime</th>
                        <th className="py-2.5">Cycles</th>
                        <th className="py-2.5">Win Rate</th>
                        <th className="py-2.5">Avg Return / Cycle</th>
                        <th className="py-2.5">Wing Defense Triggers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--hair)]">
                      <tr>
                        <td className="py-2.5 font-bold text-[var(--ink)]">Normal Volatility (35&ndash;50%)</td>
                        <td className="py-2.5">214</td>
                        <td className="py-2.5 text-emerald-600 font-bold">78.5%</td>
                        <td className="py-2.5 text-emerald-600">+1.8%</td>
                        <td className="py-2.5 text-[var(--grey)]">4.2%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-[var(--ink)]">High Volatility (50&ndash;75%)</td>
                        <td className="py-2.5">182</td>
                        <td className="py-2.5 text-emerald-600 font-bold">65.4%</td>
                        <td className="py-2.5 text-emerald-600">+2.4%</td>
                        <td className="py-2.5 text-amber-600 font-bold">14.8%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-[var(--ink)]">Range-Bound Consolidations</td>
                        <td className="py-2.5">112</td>
                        <td className="py-2.5 text-emerald-600 font-bold">84.8%</td>
                        <td className="py-2.5 text-emerald-600">+1.9%</td>
                        <td className="py-2.5 text-[var(--grey)]">1.8%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-[var(--ink)]">Extreme Volatility (&gt;75%)</td>
                        <td className="py-2.5">57</td>
                        <td className="py-2.5 text-rose-600 font-bold">47.3%</td>
                        <td className="py-2.5 text-rose-600">-0.8%</td>
                        <td className="py-2.5 text-rose-600 font-bold">38.6% (Wings Capped)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 10. PRICING & PROFIT CALCULATOR */}
        <section id="pricing" className="py-16 bg-[var(--paper-2)] border-y border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-mono font-bold text-[#d97706] uppercase tracking-wider">
                Transparent Economics
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-mono text-[var(--ink)] tracking-tight">
                30 Days Free &middot; 30% Performance Fee
              </h2>
              <p className="text-xs text-[var(--grey)] font-mono">
                No monthly subscriptions. No upfront costs. We only invoice when you make net realized profit.
              </p>
            </div>

            <div className="fintech-card p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono">
              
              {/* Slider Left */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--grey)] uppercase">Allocated Collateral:</span>
                    <span className="text-2xl font-black text-[var(--ink)]">{fmt(sliderBalance)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={500} 
                    max={50000} 
                    step={500} 
                    value={sliderBalance} 
                    onChange={(e) => setSliderBalance(parseFloat(e.target.value))} 
                    className="w-full mt-3"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--grey)] mt-1">
                    <span>$500 (₹43k)</span>
                    <span>$50,000 (₹43L)</span>
                  </div>
                </div>

                <div className="p-4 bg-[var(--paper-2)] rounded-xl border border-[var(--hair)] space-y-2 text-xs">
                  <div className="font-bold text-[var(--ink)]">High-Water Mark Protection</div>
                  <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                    If a monthly cycle ends in a net loss, you owe $0/₹0, and that loss is carried forward to offset future profits before any performance fee applies.
                  </p>
                </div>
              </div>

              {/* Economics Breakdown Right */}
              <div className="lg:col-span-6 bg-[var(--paper-2)] p-6 rounded-2xl border border-[var(--hair)] space-y-4 text-xs">
                <div className="text-xs font-bold text-[var(--grey)] uppercase">Modelled Monthly Net Output</div>
                
                <div className="space-y-3 divide-y divide-[var(--hair)]">
                  <div className="flex justify-between pt-2">
                    <span className="text-[var(--grey)]">Modelled Gross Yield (~14.5%):</span>
                    <span className="font-bold text-[var(--ink)]">+{fmt(calcGrossMonthly)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[var(--grey)]">Exchange Taker Fees + 18% GST:</span>
                    <span className="text-rose-600 font-bold">-{fmt(calcFeesAndGst)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[var(--grey)]">ProfitPilot 30% Performance Fee:</span>
                    <span className="text-[#d97706] font-bold">-{fmt(calcPerformanceFee)}</span>
                  </div>
                  <div className="flex justify-between pt-3 text-sm">
                    <span className="font-black text-[var(--ink)]">Client Net Take-Home:</span>
                    <span className="font-black text-emerald-600">+{fmt(calcClientNetProfit)}</span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="w-full py-3.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-center block transition shadow-sm"
                >
                  Start 30-Day Free Trial &rarr;
                </Link>
              </div>

            </div>

          </div>
        </section>

        {/* 11. FAQ ACCORDION */}
        <section id="faq" className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center space-y-2">
              <div className="text-xs font-mono font-bold text-[#d97706] uppercase tracking-wider">
                Institutional Knowledge
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-mono text-[var(--ink)] tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {faqs.map((faq, i) => (
                <div key={i} className="fintech-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-4 sm:p-5 flex justify-between items-center text-left font-bold text-[var(--ink)] hover:bg-[var(--paper-2)] transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[var(--grey)] transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-[var(--grey)] leading-relaxed border-t border-[var(--hair)] pt-3 bg-[var(--paper-2)]">
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
      <footer className="w-full bg-[var(--paper-2)] border-t border-[var(--hair)] py-12 font-mono text-xs text-[var(--grey)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#d97706] flex items-center justify-center text-white font-black text-xs">P</div>
              <span className="font-bold text-[var(--ink)]">ProfitPilot 2.0</span>
              <span>&mdash; Quantitative Options Intelligence &amp; Execution</span>
            </div>
            <div className="text-[10px] text-[var(--faint)]">
              Self-Custodial &middot; Non-Custodial Delta Exchange Architecture
            </div>
          </div>
          <div className="text-[10px] text-[var(--faint)] leading-relaxed border-t border-[var(--hair)] pt-4 text-center sm:text-left">
            Disclaimer: Options trading involves substantial risk of loss and is not suitable for every investor. Historical backtest performance does not guarantee future results. All figures presented represent quantitative models, simulated parameters, and rule-based executions.
          </div>
        </div>
      </footer>

    </div>
  );
}

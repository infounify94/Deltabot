'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import GlassmorphismTrustHero from '@/components/ui/glassmorphism-trust-hero';
import { InteractiveBentoGrid } from '@/components/ui/interactive-bento-grid';
import { ConnectionFlow } from '@/components/ui/connection-flow';
import { SpotlightCard } from '@/components/ui/spotlight-card';
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
  ShieldCheck,
  Brain,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Wallet,
  Scale
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
    { num: '01', name: 'Market Data', tag: 'Input', desc: 'Real-time WebSocket tick streams, orderbook depth, funding rates, and index volatility feeds.' },
    { num: '02', name: 'Market Regime', tag: 'Classification', desc: 'Multi-factor evaluation: Trend (82), Volatility (91), Liquidity (67), Momentum (78) → Overall 78/100.' },
    { num: '03', name: 'Volatility Engine', tag: 'Gating', desc: 'Measures ATR ($2,450), NATR (3.82%), IV (58.4%), RV (46.2%), IV Rank (74%) to open/block entry gates.' },
    { num: '04', name: 'Strategy Engine', tag: 'Fit Scoring', desc: 'Evaluates BTC Short Strangle fit against current regime. Current Strategy Fit Score: 82 / 100 (Favorable).' },
    { num: '05', name: 'Structure Engine', tag: 'Selection', desc: 'Selects optimal 0.15–0.18 Delta strikes ($68k Call / $61k Put), calculates POP, Greeks, and margin requirements.' },
    { num: '06', name: 'Risk Gate', tag: 'Validation', desc: 'Enforces 40% free cash reserve buffer, max lot caps, portfolio Greeks limits, and drawdown stop gates.' },
    { num: '07', name: 'Execution', tag: 'Order Routing', desc: 'Non-custodial REST/WebSocket limit and market order execution via trade-only API keys on Delta Exchange.' },
    { num: '08', name: 'Defense Engine', tag: 'Monitoring', desc: 'Continuous 5s liquidation & Delta monitoring. Automatically buys protective wings when threatened leg reaches Delta ≥ 0.35.' },
    { num: '09', name: 'Exit Engine', tag: 'Harvest', desc: 'Executes profit taking at 50%–80% max credit, time-based expiry closes, or ratchet trailing stop lock-ins.' },
    { num: '10', name: 'Learning & Journal', tag: 'Explainability', desc: 'Logs trade rationale: Why entered, why blocked, why defended, fee audits, and regime performance updates.' },
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
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans flex flex-col selection:bg-[#d97706]/15">
      
      {/* 1. STICKY HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 glass-header px-4 sm:px-8 py-3 flex items-center justify-between transition-colors">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-base tracking-tight text-[var(--ink)]">Profit</span>
            <span className="font-semibold text-base tracking-tight text-[#d97706]">Pilot</span>
            <span className="ml-2 text-[10px] font-medium bg-[var(--orange-tint)] text-[var(--orange)] px-2 py-0.5 rounded-full border border-[var(--orange)]/20">
              2.0 Quant
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-[var(--grey)]">
          <a href="#pipeline" className="hover:text-[var(--ink)] transition-colors">Pipeline</a>
          <a href="#bento" className="hover:text-[var(--ink)] transition-colors">7 Engines</a>
          <a href="#flow" className="hover:text-[var(--ink)] transition-colors">Architecture</a>
          <a href="#regime" className="hover:text-[var(--ink)] transition-colors">Regime Matrix</a>
          <a href="#scenario" className="hover:text-[var(--ink)] transition-colors">Scenario Lab</a>
          <a href="#notrade" className="hover:text-[var(--ink)] transition-colors">No-Trade</a>
          <a href="#backtest" className="hover:text-[var(--ink)] transition-colors">Backtest</a>
          <a href="#pricing" className="hover:text-[var(--ink)] transition-colors">Pricing</a>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* Currency Toggle */}
          <div className="bg-[var(--paper-2)] p-0.5 rounded-lg border border-[var(--hair)] flex items-center text-xs font-medium">
            <button 
              onClick={() => setCurrency('INR')}
              className={`px-2 py-1 rounded transition-all ${currency === 'INR' ? 'bg-[#d97706] text-white shadow-sm font-semibold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >
              ₹ INR
            </button>
            <button 
              onClick={() => setCurrency('USD')}
              className={`px-2 py-1 rounded transition-all ${currency === 'USD' ? 'bg-[#d97706] text-white shadow-sm font-semibold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >
              $ USD
            </button>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-7 h-7 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] flex items-center justify-center text-[var(--grey)] hover:text-[var(--ink)] transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Auth CTAs */}
          <Link 
            href="/login" 
            className="text-[13px] font-medium text-[var(--grey)] hover:text-[var(--ink)] px-2 py-1 hidden sm:block transition-colors"
          >
            Log in
          </Link>
          <Link 
            href="/login" 
            className="bg-[#d97706] hover:bg-[#b45309] text-white font-medium text-xs sm:text-[13px] px-3.5 py-1.5 rounded-lg shadow-subtle transition-all active:scale-95"
          >
            Start free trial &rarr;
          </Link>

          {/* Mobile Hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--paper-2)] border-b border-[var(--hair)] px-4 py-4 space-y-2.5 text-xs font-medium">
          <a href="#pipeline" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)] border-b border-[var(--hair)]">10-Step Quantitative Pipeline</a>
          <a href="#bento" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)] border-b border-[var(--hair)]">7 Proprietary Engines (Bento)</a>
          <a href="#flow" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)] border-b border-[var(--hair)]">Non-Custodial Architecture</a>
          <a href="#regime" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)] border-b border-[var(--hair)]">Market Regime Matrix</a>
          <a href="#scenario" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)] border-b border-[var(--hair)]">Scenario Stress Lab</a>
          <a href="#notrade" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)] border-b border-[var(--hair)]">No-Trade Analytics</a>
          <a href="#backtest" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)] border-b border-[var(--hair)]">Strategy Backtest</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[var(--ink)] border-b border-[var(--hair)]">Pricing</a>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-[#d97706] font-semibold">Log in to Command Center &rarr;</Link>
        </div>
      )}

      {/* 2. REAL-TIME MARKET TICKER BAR */}
      <div className="w-full bg-[var(--paper-2)] border-b border-[var(--hair)] py-1.5 overflow-hidden text-xs">
        <div className="animate-ticker-marquee flex items-center whitespace-nowrap gap-12 text-[var(--grey)]">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-8 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-[var(--ink)]">BTC/USD</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium num-tabular">${btcPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="font-medium text-[var(--ink)]">ETH/USD</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-medium num-tabular">${ethPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--grey)]">SOL/USD:</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-medium num-tabular">${(btcPrice * 0.0022).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--grey)]">DVOL Index:</span>
                <span className="font-mono text-[#d97706] font-medium num-tabular">54.2%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1">
        
        {/* 3. HERO SECTION (High-Impact Container with AnimatedGridBackground + Interactive OptionPayoffChart) */}
        <GlassmorphismTrustHero btcPrice={btcPrice} ethPrice={ethPrice} />

        {/* 4. THE 10-STEP QUANTITATIVE ENGINE PIPELINE */}
        <section id="pipeline" className="py-20 bg-[var(--paper-2)] border-b border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                Proprietary Architecture
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                The 10-Step Quantitative Pipeline
              </h2>
              <p className="text-sm text-[var(--grey)] leading-relaxed">
                Click any phase below to inspect the mathematical models, risk gates, and decision trees.
              </p>
            </div>

            {/* Step Navigation Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {pipelineSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePipelineStep(idx)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${activePipelineStep === idx ? 'bg-[#d97706] text-white border-[#d97706] shadow-subtle font-semibold' : 'bg-[var(--card)] border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]'}`}
                >
                  <div className="font-mono text-[10px] opacity-80">{step.num}</div>
                  <div className="text-[11px] font-medium truncate mt-0.5">{step.name}</div>
                </button>
              ))}
            </div>

            {/* Active Pipeline Card */}
            <div className="fintech-card p-6 sm:p-7 space-y-3 shadow-subtle">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--hair)] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold w-7 h-7 rounded-lg bg-[var(--orange-tint)] text-[#d97706] flex items-center justify-center border border-[#d97706]/20">
                    {pipelineSteps[activePipelineStep].num}
                  </span>
                  <h3 className="text-base font-semibold text-[var(--ink)]">
                    Phase {pipelineSteps[activePipelineStep].num} &middot; {pipelineSteps[activePipelineStep].name}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-[var(--paper-2)] text-[var(--grey)] border border-[var(--hair)] text-[11px] font-medium">
                  {pipelineSteps[activePipelineStep].tag}
                </span>
              </div>
              <p className="text-sm text-[var(--ink)] leading-relaxed">
                {pipelineSteps[activePipelineStep].desc}
              </p>
            </div>

          </div>
        </section>

        {/* 5. 21st.dev STYLE INTERACTIVE BENTO GRID SHOWCASE */}
        <section id="bento" className="py-20 bg-[var(--paper)] border-b border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                Modular Quant Stack
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                The 7 Proprietary Quantitative Engines
              </h2>
              <p className="text-sm text-[var(--grey)] leading-relaxed">
                Filter by architecture phase and inspect live formulas, metrics, and quantitative decision logic.
              </p>
            </div>

            <InteractiveBentoGrid />

          </div>
        </section>

        {/* 6. NON-CUSTODIAL CONNECTION ARCHITECTURE FLOW */}
        <section id="flow" className="py-20 bg-[var(--paper-2)] border-b border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                Security Architecture
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Non-Custodial. Funds Stay In Your Delta Wallet.
              </h2>
              <p className="text-sm text-[var(--grey)] leading-relaxed">
                ProfitPilot connects exclusively via trade-only API keys with zero withdrawal capabilities.
              </p>
            </div>

            <ConnectionFlow />

          </div>
        </section>

        {/* 7. 01 MARKET REGIME & VOLATILITY ENGINES */}
        <section id="regime" className="py-20 bg-[var(--paper)] border-b border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Regime Section Left */}
              <div className="space-y-4">
                <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                  01 &middot; Market Regime Engine
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                  Observe the market. Understand the regime.
                </h2>
                <p className="text-sm text-[var(--grey)] leading-relaxed">
                  Before a single strike is selected, ProfitPilot calculates multi-factor trend strength, realized volatility expansion, and orderbook depth to classify market structure into discrete risk regimes.
                </p>
                <div className="space-y-2 text-xs text-[var(--grey)] pt-2">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Trend, range, and momentum structure matrix</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Orderbook liquidity and bid-ask spread filters</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Options surface gamma and open interest profiling</div>
                </div>
              </div>

              {/* Regime Matrix Card Right */}
              <div className="fintech-card p-5 sm:p-6 space-y-4 shadow-subtle">
                <div className="flex justify-between items-center border-b border-[var(--hair)] pb-3 text-xs">
                  <span className="font-semibold text-[var(--ink)]">Quantitative Factor Scores</span>
                  <span className="font-mono text-[#d97706] font-semibold">Overall: 78 / 100</span>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { name: 'Trend momentum (ADX / SMA)', score: 82 },
                    { name: 'Volatility expansion (IV / RV spread)', score: 91 },
                    { name: 'Orderbook liquidity & depth', score: 67 },
                    { name: 'Short-term price acceleration', score: 78 },
                    { name: 'Options positioning & gamma cushion', score: 84 },
                  ].map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[var(--grey)]">{f.name}</span>
                        <span className="font-mono font-semibold text-[var(--ink)]">{f.score}/100</span>
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
                <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                  02 &middot; Volatility Engine &amp; Entry Gates
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                  Discipline means gating entry when conditions turn hostile.
                </h2>
                <p className="text-sm text-[var(--grey)] leading-relaxed">
                  The Volatility Engine tracks ATR, Normalized ATR (NATR), IV Rank, and the IV/RV spread. If realized volatility is accelerating faster than option premiums reward, the Entry Gate automatically locks to <strong>Blocked</strong>.
                </p>
              </div>

              <div className="lg:col-span-7 fintech-card p-5 sm:p-6 space-y-4 shadow-subtle">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[var(--paper-2)] p-3 rounded-lg border border-[var(--hair)]">
                    <span className="text-[11px] font-medium text-[var(--grey)] block">NATR Level</span>
                    <span className="font-mono text-lg font-semibold text-[var(--ink)] mt-1 block num-tabular">3.82%</span>
                    <span className="text-[10px] text-emerald-600">Threshold &lt; 4.5%</span>
                  </div>
                  <div className="bg-[var(--paper-2)] p-3 rounded-lg border border-[var(--hair)]">
                    <span className="text-[11px] font-medium text-[var(--grey)] block">IV / RV Spread</span>
                    <span className="font-mono text-lg font-semibold text-emerald-600 mt-1 block num-tabular">+12.2%</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Premium rich</span>
                  </div>
                  <div className="bg-[var(--paper-2)] p-3 rounded-lg border border-[var(--hair)]">
                    <span className="text-[11px] font-medium text-[var(--grey)] block">Entry Gate</span>
                    <span className="text-xs font-semibold text-emerald-600 mt-1.5 block">● Open</span>
                    <span className="text-[10px] text-[var(--grey)]">Confidence: High</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 8. SCENARIO STRESS LAB */}
        <section id="scenario" className="py-20 bg-[var(--paper-2)] border-b border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                05 &middot; Scenario Stress Lab
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Test Stress Scenarios Interactively
              </h2>
              <p className="text-sm text-[var(--grey)] max-w-xl mx-auto leading-relaxed">
                Model P&amp;L outcomes under simulated Bitcoin market shocks, implied volatility spikes, and time decay.
              </p>
            </div>

            <div className="fintech-card p-6 sm:p-7 space-y-6 shadow-subtle">
              
              {/* Quick Stress Presets */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[var(--grey)] font-medium">Quick presets:</span>
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
                    className="px-2.5 py-1 rounded-md bg-[var(--paper-2)] border border-[var(--hair)] hover:bg-[#d97706] hover:text-white transition text-xs font-medium font-mono"
                  >
                    {s.label}
                  </button>
                ))}
                <button
                  onClick={() => { setScenarioBtcShift(0); setScenarioIvShift(0); setScenarioHoursPassed(8); }}
                  className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition text-xs font-medium"
                >
                  Reset
                </button>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[var(--paper-2)] p-5 rounded-lg border border-[var(--hair)] text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--grey)]">BTC price shift:</span>
                    <span className="font-mono font-medium text-[var(--ink)]">{scenarioBtcShift >= 0 ? '+' : ''}{scenarioBtcShift}% (${scenarioModel.simulatedSpot.toFixed(0)})</span>
                  </div>
                  <input type="range" min={-15} max={15} step={1} value={scenarioBtcShift} onChange={(e) => setScenarioBtcShift(parseFloat(e.target.value))} className="w-full" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--grey)]">IV shift:</span>
                    <span className="font-mono font-medium text-[var(--ink)]">{scenarioIvShift >= 0 ? '+' : ''}{scenarioIvShift}% ({scenarioModel.iv.toFixed(0)}% IV)</span>
                  </div>
                  <input type="range" min={-20} max={30} step={2} value={scenarioIvShift} onChange={(e) => setScenarioIvShift(parseFloat(e.target.value))} className="w-full" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--grey)]">Time passed:</span>
                    <span className="font-mono font-medium text-[var(--ink)]">{scenarioHoursPassed}h / 24h</span>
                  </div>
                  <input type="range" min={0} max={24} step={1} value={scenarioHoursPassed} onChange={(e) => setScenarioHoursPassed(parseInt(e.target.value))} className="w-full" />
                </div>
              </div>

              {/* Output Result */}
              <div className="bg-[var(--card)] p-5 rounded-lg border border-[var(--hair)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-[var(--grey)] uppercase block font-medium">Modelled Scenario P&amp;L (1 BTC Contract)</span>
                  <div className={`font-mono text-2xl sm:text-3xl font-semibold mt-1 num-tabular ${scenarioModel.modelledPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {scenarioModel.modelledPnl >= 0 ? '+' : ''}{fmt(scenarioModel.modelledPnl)}
                  </div>
                  <p className="text-[11px] text-[var(--grey)] mt-0.5 leading-relaxed">
                    Based on selected underlying price, implied volatility, and time decay assumptions.
                  </p>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div>Breakevens: <strong className="font-mono text-[var(--ink)] font-medium">$60,150 &mdash; $68,850</strong></div>
                  <div>Max wing loss: <strong className="font-mono text-rose-600 font-medium">-$1,250</strong></div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 9. "THE TRADES WE DIDN'T TAKE" (NO-TRADE ANALYTICS) */}
        <section id="notrade" className="py-20 bg-[var(--paper)] border-b border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                Quantitative Discipline
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                The Trades We Didn't Take
              </h2>
              <p className="text-sm text-[var(--grey)]">
                "Discipline is not only knowing when to trade. It is knowing when not to."
              </p>
            </div>

            <div className="fintech-card p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-subtle">
              
              <div className="lg:col-span-5 bg-[var(--paper-2)] p-5 rounded-lg border border-[var(--hair)] space-y-3">
                <div className="text-xs font-semibold text-[var(--grey)]">500 Scanned Cycles Audit</div>
                <div className="font-mono text-3xl font-semibold text-[var(--ink)] num-tabular">
                  184 <span className="text-sm font-normal text-[#d97706]">(36.8%)</span>
                </div>
                <p className="text-xs text-[var(--grey)] leading-relaxed">
                  Out of 500 volatility scans, 184 trade entries were actively filtered and blocked by quantitative safety rules, preventing exposure to high-risk market conditions.
                </p>
              </div>

              <div className="lg:col-span-7 space-y-2 text-xs">
                {[
                  { trigger: 'Volatility gate spike (NATR / IV < RV spread)', count: 71, share: '38.6%' },
                  { trigger: 'Trend momentum acceleration filter', count: 42, share: '22.8%' },
                  { trigger: 'Orderbook depth / liquidity buffer', count: 26, share: '14.1%' },
                  { trigger: 'Margin reserve buffer requirement (< 40%)', count: 19, share: '10.3%' },
                  { trigger: 'Post-stop cooldown lockout (4h quarantine)', count: 15, share: '8.2%' },
                  { trigger: 'Portfolio Greeks concentration ceiling', count: 11, share: '6.0%' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-[var(--paper-2)] rounded-lg border border-[var(--hair)] flex justify-between items-center">
                    <span className="text-[var(--ink)] font-medium">{item.trigger}</span>
                    <span className="font-mono font-medium text-[#d97706] num-tabular">{item.count} ({item.share})</span>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </section>

        {/* 10. STRATEGY BACKTEST PERFORMANCE & REGIME SPLIT */}
        <section id="backtest" className="py-20 bg-[var(--paper-2)] border-b border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                Historical Simulation
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Strategy Backtest &amp; Regime Breakdown
              </h2>
              <p className="text-xs text-[var(--grey)]">
                Period: Aug 2025 &ndash; Aug 2026 &middot; Capital: $5,000 USD &middot; Taker fees + 18% GST: Modelled &middot; Slippage: 0.15% per leg
              </p>
            </div>

            <div className="fintech-card p-6 sm:p-7 space-y-6 shadow-subtle">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[var(--paper-2)] p-3.5 rounded-lg border border-[var(--hair)]">
                  <span className="text-[11px] font-medium text-[var(--grey)] block">Backtest CAGR</span>
                  <span className="font-mono text-xl sm:text-2xl font-semibold text-emerald-600 mt-1 block num-tabular">227.4%</span>
                </div>
                <div className="bg-[var(--paper-2)] p-3.5 rounded-lg border border-[var(--hair)]">
                  <span className="text-[11px] font-medium text-[var(--grey)] block">Win Rate</span>
                  <span className="font-mono text-xl sm:text-2xl font-semibold text-[var(--ink)] mt-1 block num-tabular">68.3%</span>
                </div>
                <div className="bg-[var(--paper-2)] p-3.5 rounded-lg border border-[var(--hair)]">
                  <span className="text-[11px] font-medium text-[var(--grey)] block">Sharpe Ratio</span>
                  <span className="font-mono text-xl sm:text-2xl font-semibold text-[var(--ink)] mt-1 block num-tabular">1.93</span>
                </div>
                <div className="bg-[var(--paper-2)] p-3.5 rounded-lg border border-[var(--hair)]">
                  <span className="text-[11px] font-medium text-[var(--grey)] block">Max Drawdown</span>
                  <span className="font-mono text-xl sm:text-2xl font-semibold text-rose-600 mt-1 block num-tabular">-11.4%</span>
                </div>
              </div>

              {/* Performance by Market Regime Table */}
              <div className="bg-[var(--paper-2)] p-5 rounded-lg border border-[var(--hair)] space-y-3">
                <div className="text-xs font-semibold text-[var(--ink)]">Performance by Market Regime</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-[var(--hair)] text-[var(--grey)] font-medium">
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
                        <td className="py-2.5 font-medium text-[var(--ink)]">Normal volatility (35&ndash;50%)</td>
                        <td className="font-mono py-2.5">214</td>
                        <td className="font-mono py-2.5 text-emerald-600 font-semibold">78.5%</td>
                        <td className="font-mono py-2.5 text-emerald-600">+1.8%</td>
                        <td className="font-mono py-2.5 text-[var(--grey)]">4.2%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-medium text-[var(--ink)]">High volatility (50&ndash;75%)</td>
                        <td className="font-mono py-2.5">182</td>
                        <td className="font-mono py-2.5 text-emerald-600 font-semibold">65.4%</td>
                        <td className="font-mono py-2.5 text-emerald-600">+2.4%</td>
                        <td className="font-mono py-2.5 text-amber-600 font-semibold">14.8%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-medium text-[var(--ink)]">Range-bound consolidations</td>
                        <td className="font-mono py-2.5">112</td>
                        <td className="font-mono py-2.5 text-emerald-600 font-semibold">84.8%</td>
                        <td className="font-mono py-2.5 text-emerald-600">+1.9%</td>
                        <td className="font-mono py-2.5 text-[var(--grey)]">1.8%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-medium text-[var(--ink)]">Extreme volatility (&gt;75%)</td>
                        <td className="font-mono py-2.5">57</td>
                        <td className="font-mono py-2.5 text-rose-600 font-semibold">47.3%</td>
                        <td className="font-mono py-2.5 text-rose-600">-0.8%</td>
                        <td className="font-mono py-2.5 text-rose-600 font-semibold">38.6% (Capped)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 11. PRICING & PROFIT CALCULATOR */}
        <section id="pricing" className="py-20 bg-[var(--paper)] border-b border-[var(--hair)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                Transparent Economics
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                30 Days Free &middot; 30% Performance Fee
              </h2>
              <p className="text-sm text-[var(--grey)]">
                No monthly subscriptions. No upfront costs. We only invoice when you make net realized profit.
              </p>
            </div>

            <div className="fintech-card p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-subtle">
              
              {/* Slider Left */}
              <div className="lg:col-span-6 space-y-5">
                <div>
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-[var(--grey)]">Allocated Collateral:</span>
                    <span className="font-mono text-xl font-semibold text-[var(--ink)]">{fmt(sliderBalance)}</span>
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
                  <div className="flex justify-between text-[11px] font-mono text-[var(--grey)] mt-1">
                    <span>$500 (₹43k)</span>
                    <span>$50,000 (₹43L)</span>
                  </div>
                </div>

                <div className="p-4 bg-[var(--paper-2)] rounded-lg border border-[var(--hair)] space-y-1.5 text-xs">
                  <div className="font-semibold text-[var(--ink)]">High-Water Mark Protection</div>
                  <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                    If a monthly cycle ends in a net loss, you owe $0/₹0, and that loss is carried forward to offset future profits before any performance fee applies.
                  </p>
                </div>
              </div>

              {/* Economics Breakdown Right */}
              <div className="lg:col-span-6 bg-[var(--paper-2)] p-5 rounded-lg border border-[var(--hair)] space-y-3.5 text-xs">
                <div className="font-semibold text-[var(--grey)]">Modelled Monthly Net Output</div>
                
                <div className="space-y-2.5 divide-y divide-[var(--hair)]">
                  <div className="flex justify-between pt-2">
                    <span className="text-[var(--grey)]">Modelled gross yield (~14.5%):</span>
                    <span className="font-mono font-semibold text-[var(--ink)]">+{fmt(calcGrossMonthly)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[var(--grey)]">Exchange taker fees + 18% GST:</span>
                    <span className="font-mono font-semibold text-rose-600">-{fmt(calcFeesAndGst)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[var(--grey)]">ProfitPilot 30% performance fee:</span>
                    <span className="font-mono font-semibold text-[#d97706]">-{fmt(calcPerformanceFee)}</span>
                  </div>
                  <div className="flex justify-between pt-3 text-sm">
                    <span className="font-semibold text-[var(--ink)]">Client net take-home:</span>
                    <span className="font-mono font-semibold text-emerald-600">+{fmt(calcClientNetProfit)}</span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="w-full py-3 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-white font-medium text-center block transition shadow-subtle text-xs sm:text-sm"
                >
                  Start 30-day free trial &rarr;
                </Link>
              </div>

            </div>

          </div>
        </section>

        {/* 12. FAQ ACCORDION */}
        <section id="faq" className="py-20 bg-[var(--paper-2)] border-b border-[var(--hair)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center space-y-2">
              <div className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                Institutional Knowledge
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-2.5 text-xs">
              {faqs.map((faq, i) => (
                <div key={i} className="fintech-card overflow-hidden shadow-subtle">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-4 flex justify-between items-center text-left font-medium text-[var(--ink)] hover:bg-[var(--paper-2)] transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[var(--grey)] transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-[var(--grey)] leading-relaxed border-t border-[var(--hair)] pt-3 bg-[var(--paper-2)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 13. FINAL HIGH-CONVERSION CTA CALLOUT BANNER */}
        <section className="py-20 bg-[var(--paper)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <SpotlightCard className="p-8 sm:p-12 text-center space-y-6 shadow-subtle bg-gradient-to-b from-[var(--card)] to-[var(--paper-2)]" spotlightColor="rgba(217, 119, 6, 0.12)">
              <div className="w-12 h-12 rounded-2xl bg-[var(--orange-tint)] text-[#d97706] border border-[#d97706]/20 flex items-center justify-center mx-auto shadow-sm">
                <Activity className="w-6 h-6" />
              </div>

              <div className="space-y-2 max-w-xl mx-auto">
                <h2 className="text-2xl sm:text-4xl font-bold text-[var(--ink)] tracking-tight">
                  Start Trading With a Systematic Quantitative Edge
                </h2>
                <p className="text-sm text-[var(--grey)] leading-relaxed">
                  Connect your trade-only Delta API keys and experience institutional-grade options intelligence with 30 days 100% free.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-white font-medium text-sm shadow-subtle transition-all active:scale-[0.98]"
                >
                  Create Free Account &rarr;
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[var(--card)] hover:bg-[var(--raise)] text-[var(--ink)] border border-[var(--hair)] font-medium text-sm shadow-subtle transition-colors"
                >
                  Open Command Center
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-[var(--grey)] pt-2">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Non-Custodial API</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 30-Day Free Trial</span>
                <span className="flex items-center gap-1.5"><Scale className="w-4 h-4 text-emerald-600" /> High-Water Mark Protection</span>
              </div>
            </SpotlightCard>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[var(--paper-2)] border-t border-[var(--hair)] py-10 text-xs text-[var(--grey)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#d97706] flex items-center justify-center text-white font-bold text-xs">P</div>
              <span className="font-semibold text-[var(--ink)]">ProfitPilot 2.0</span>
              <span>&mdash; Quantitative Options Intelligence &amp; Execution</span>
            </div>
            <div className="text-[11px] text-[var(--faint)]">
              Self-Custodial &middot; Non-Custodial Delta Exchange Architecture
            </div>
          </div>
          <div className="text-[11px] text-[var(--faint)] leading-relaxed border-t border-[var(--hair)] pt-4 text-center sm:text-left">
            Disclaimer: Options trading involves substantial risk of loss and is not suitable for every investor. Historical backtest performance does not guarantee future results. All figures presented represent quantitative models, simulated parameters, and rule-based executions.
          </div>
        </div>
      </footer>

    </div>
  );
}

'use client';

import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Play, 
  Target, 
  ShieldCheck, 
  Star,
  Activity,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  Lock,
  ExternalLink
} from "lucide-react";

// --- INSTITUTIONAL PARTNERS / ECOSYSTEM INTEGRATIONS ---
const ECOSYSTEM_PARTNERS = [
  { name: "Delta Exchange India", category: "Execution Venue", tag: "FPI & Trade-Only API" },
  { name: "Delta Exchange Global", category: "Derivatives", tag: "High Liquidity" },
  { name: "Binance WebSocket", category: "Market Data", tag: "Real-time Ticks" },
  { name: "Supabase Vault", category: "Infrastructure", tag: "Row Level Security" },
  { name: "Oracle Cloud Core", category: "Strategy Engine", tag: "5s Defense Loops" },
];

// --- STAT ITEM ---
const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center justify-center cursor-default">
    <span className="font-mono text-xl sm:text-2xl font-semibold text-[var(--ink)] num-tabular">{value}</span>
    <span className="text-[11px] font-medium text-[var(--grey)] mt-0.5">{label}</span>
  </div>
);

// --- MAIN HERO COMPONENT ---
export default function GlassmorphismTrustHero({
  btcPrice = 64250,
  ethPrice = 3480
}: {
  btcPrice?: number;
  ethPrice?: number;
}) {
  return (
    <section className="relative w-full bg-[var(--paper)] text-[var(--ink)] overflow-hidden font-sans border-b border-[var(--hair)]">
      
      {/* Background Subtle Gradient & Grid Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-25 dark:opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(var(--orange) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(180deg, black 0%, black 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 75%, transparent 100%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-14 pb-16 sm:px-6 md:pt-20 md:pb-24 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10 items-start">
          
          {/* --- LEFT COLUMN: VALUE PROPOSITION & CTAS --- */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 pt-2 text-center lg:text-left">
            
            {/* Quantitative Architecture Badge */}
            <div className="flex justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--hair)] bg-[var(--paper-2)] px-3.5 py-1.5 shadow-subtle">
                <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                <span className="text-xs font-medium text-[var(--ink)] flex items-center gap-1.5">
                  Quantitative Crypto Options Intelligence
                  <span className="text-[var(--grey)]">&middot;</span>
                  <span className="text-[#d97706] font-semibold">ProfitPilot 2.0</span>
                </span>
              </div>
            </div>

            {/* Headline (Inter 700, 56-64px desktop / 34-38px mobile) */}
            <h1 className="text-[36px] sm:text-[48px] lg:text-[60px] font-bold tracking-tight text-[var(--ink)] leading-[1.08]">
              Quantitative Options Trading.<br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#d97706] bg-clip-text text-transparent">
                Built Around Risk.
              </span>
            </h1>

            {/* Subheadline (Inter 400/500, 17-18px, relaxed line height) */}
            <p className="max-w-2xl text-base sm:text-[18px] text-[var(--grey)] leading-[1.6] mx-auto lg:mx-0">
              ProfitPilot continuously evaluates market regime, volatility, option structure and portfolio risk before deciding when to enter, when to defend and when to stay out.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 justify-center lg:justify-start">
              <Link 
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#d97706] hover:bg-[#b45309] px-6 py-3.5 text-xs sm:text-sm font-medium text-white shadow-subtle transition-all active:scale-[0.98]"
              >
                Start 30-day free trial
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <a 
                href="#pipeline"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--hair)] bg-[var(--card)] hover:bg-[var(--raise)] px-6 py-3.5 text-xs sm:text-sm font-medium text-[var(--ink)] shadow-subtle transition-colors"
              >
                <Activity className="w-4 h-4 text-[#d97706]" />
                Explore quantitative pipeline
              </a>
            </div>

            {/* Quick Metrics Strip */}
            <div className="pt-6 border-t border-[var(--hair)] grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <div className="font-mono text-2xl sm:text-3xl font-semibold text-[var(--ink)] num-tabular">227.4%</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-0.5">Backtest CAGR</div>
              </div>
              <div>
                <div className="font-mono text-2xl sm:text-3xl font-semibold text-emerald-600 num-tabular">68.3%</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-0.5">Win rate</div>
              </div>
              <div>
                <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#d97706] num-tabular">36.8%</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-0.5">Trades avoided</div>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: REFINED COMMAND-CENTER TRUST CARD & INTEGRATIONS --- */}
          <div className="lg:col-span-5 space-y-4 lg:mt-2">
            
            {/* Primary Strategy Status & Defense Card */}
            <div className="fintech-card p-6 space-y-6 shadow-subtle-md relative overflow-hidden">
              
              {/* Header Status Bar */}
              <div className="flex items-center justify-between border-b border-[var(--hair)] pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--orange-tint)] border border-[#d97706]/20 flex items-center justify-center text-[#d97706]">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[var(--ink)]">Daily BTC Strangle Engine</div>
                    <div className="text-xs text-[var(--grey)]">Delta Exchange India &amp; Global</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-medium text-emerald-600">Active</span>
                </div>
              </div>

              {/* Progress & Edge Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[var(--grey)]">Strategy Fit Score (High Vol Regime)</span>
                  <span className="font-mono text-emerald-600 font-semibold num-tabular">82 / 100</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--paper-2)] border border-[var(--hair)]">
                  <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#d97706] to-emerald-600" />
                </div>
                <div className="flex justify-between text-[11px] text-[var(--grey)] pt-0.5">
                  <span>Threshold: &ge; 70 pts</span>
                  <span className="text-emerald-600 font-medium">Entry Gate: Approved</span>
                </div>
              </div>

              {/* Mini Stats 3-Column Grid */}
              <div className="grid grid-cols-3 gap-3 text-center border-y border-[var(--hair)] py-4">
                <StatItem value="0.15–0.18" label="Target Delta" />
                <div className="border-x border-[var(--hair)]">
                  <StatItem value="Δ ≥ 0.35" label="Wing Trigger" />
                </div>
                <StatItem value="40%" label="Cash Reserve" />
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hair)] bg-[var(--paper-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)]">
                  <Lock className="w-3.5 h-3.5 text-[#d97706]" />
                  Non-custodial
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hair)] bg-[var(--paper-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Dynamic Wings
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hair)] bg-[var(--paper-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)]">
                  <span className="font-mono text-[#d97706]">5s</span> Loop
                </div>
              </div>

            </div>

            {/* Ecosystem & Venue Ticker Card */}
            <div className="fintech-card p-4 space-y-3 shadow-subtle">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--ink)]">Connected Execution Architecture</span>
                <span className="text-[10px] font-mono text-[var(--faint)]">REST + WebSocket API</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {ECOSYSTEM_PARTNERS.slice(0, 4).map((partner, i) => (
                  <div key={i} className="p-2.5 rounded-md bg-[var(--paper-2)] border border-[var(--hair)] space-y-0.5">
                    <div className="font-medium text-[var(--ink)] truncate">{partner.name}</div>
                    <div className="text-[10px] text-[var(--grey)]">{partner.tag}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

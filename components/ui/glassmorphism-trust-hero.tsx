'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Target, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Cpu, 
  Layers, 
  Lock, 
  Zap,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { AnimatedGridBackground } from '@/components/ui/animated-grid-background';
import { OptionPayoffChart } from '@/components/ui/option-payoff-chart';

// --- INSTITUTIONAL PARTNERS / VENUE LOGOS ---
const VENUE_PARTNERS = [
  { name: "Delta Exchange India", tag: "FPI Approved & 18% GST Compliant" },
  { name: "Delta Exchange Global", tag: "Deep Institutional Liquidity" },
  { name: "Binance WebSocket", tag: "Real-Time 100ms Ticks" },
  { name: "Supabase Vault", tag: "Row Level Security Auth" },
  { name: "Oracle Cloud Core", tag: "5s Low-Latency Loop" },
];

export default function GlassmorphismTrustHero({
  btcPrice = 64250,
  ethPrice = 3480
}: {
  btcPrice?: number;
  ethPrice?: number;
}) {
  return (
    <section className="relative w-full bg-[var(--paper)] text-[var(--ink)] overflow-hidden font-sans border-b border-[var(--hair)]">
      
      {/* 21st.dev Style Ambient Grid & Radial Glow Background */}
      <AnimatedGridBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 md:pt-16 md:pb-20 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10 items-center">
          
          {/* --- LEFT COLUMN: VALUE PROPOSITION & CTAS --- */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6 text-center lg:text-left">
            
            {/* Quantitative Architecture Badge */}
            <div className="flex justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--hair)] bg-[var(--paper-2)] px-3.5 py-1.5 shadow-subtle">
                <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                <span className="text-xs font-medium text-[var(--ink)] flex items-center gap-1.5">
                  Quantitative Crypto Options Platform
                  <span className="text-[var(--grey)]">&middot;</span>
                  <span className="text-[#d97706] font-semibold">ProfitPilot 2.0</span>
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-[36px] sm:text-[46px] lg:text-[56px] font-bold tracking-tight text-[var(--ink)] leading-[1.08]">
              Quantitative Options Trading.<br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#d97706] via-[#b45309] to-[#d97706] bg-clip-text text-transparent">
                Built Around Risk.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-xl text-base sm:text-[17px] text-[var(--grey)] leading-[1.6] mx-auto lg:mx-0">
              ProfitPilot continuously evaluates market regime, volatility, option structure and portfolio risk before deciding when to enter, when to defend and when to stay out.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 justify-center lg:justify-start">
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
                Explore 10-step pipeline
              </a>
            </div>

            {/* Quick Metrics Strip */}
            <div className="pt-5 border-t border-[var(--hair)] grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <div className="font-mono text-2xl font-semibold text-[var(--ink)] num-tabular">227.4%</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-0.5">Backtest CAGR</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-semibold text-emerald-600 num-tabular">68.3%</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-0.5">Win rate</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-semibold text-[#d97706] num-tabular">36.8%</div>
                <div className="text-xs text-[var(--grey)] font-medium mt-0.5">Trades avoided</div>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: INTERACTIVE PAYOFF CURVE GRAPHIC --- */}
          <div className="lg:col-span-6 space-y-4">
            <OptionPayoffChart />
          </div>

        </div>

        {/* Ecosystem & Infrastructure Bar */}
        <div className="mt-12 pt-6 border-t border-[var(--hair)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xs font-semibold text-[var(--grey)] uppercase tracking-wider">
              Connected Infrastructure:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--ink)] font-medium">
              {VENUE_PARTNERS.map((partner, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-medium text-[var(--ink)]">{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

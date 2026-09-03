'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  Radio, 
  Zap, 
  Lock, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Sliders,
  Layers
} from 'lucide-react';

interface HeroTerminalProps {
  currency?: 'INR' | 'USD';
}

export function HeroTerminal({ currency = 'INR' }: HeroTerminalProps) {
  const [activeTab, setActiveTab] = useState<'strategy' | 'execution' | 'radar'>('strategy');
  const [tickerPrice, setTickerPrice] = useState(78984);
  const fxRate = 86.5;

  const fmt = (usd: number) => {
    if (currency === 'INR') {
      const inr = usd * fxRate;
      return `₹${Math.round(inr).toLocaleString('en-IN')}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  // Live price wiggle for realistic high-frequency terminal feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPrice(prev => +(prev + (Math.random() * 8 - 4)).toFixed(2));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative">
      
      {/* Ambient Glow behind terminal */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500/20 via-[#d97706]/30 to-emerald-500/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

      {/* Main Terminal Window */}
      <div className="bg-[#0c0f17] text-slate-100 rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Terminal Window Chrome */}
        <div className="px-4 sm:px-5 py-3 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-medium ml-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              PROFITPILOT CORE v2.8 • LIVE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              BTC: ${tickerPrice.toLocaleString()}
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              IV: 31.4% (CALM)
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-white/5 bg-white/[0.01] flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'strategy' ? 'bg-[#d97706] text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Activity className="w-3.5 h-3.5" /> Delta-Neutral Matrix
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'execution' ? 'bg-[#d97706] text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Zap className="w-3.5 h-3.5" /> Live Orderbook Guard
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'radar' ? 'bg-[#d97706] text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Radio className="w-3.5 h-3.5" /> Macro News Radar
          </button>
        </div>

        {/* TAB 1: STRATEGY MATRIX */}
        {activeTab === 'strategy' && (
          <div className="p-4 sm:p-6 space-y-5">
            
            {/* Top Stat Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/[0.03] border border-white/5 p-3 rounded-xl">
                <div className="text-[10px] uppercase font-mono text-slate-400">Position Type</div>
                <div className="text-xs font-bold text-white mt-1">BTC Strangle (4 Lots)</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">● 68.3% Win Prob</div>
              </div>

              <div className="bg-white/[0.03] border border-white/5 p-3 rounded-xl">
                <div className="text-[10px] uppercase font-mono text-slate-400">Theta Harvest</div>
                <div className="text-xs font-bold text-emerald-400 mt-1">+$0.92 / hr</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Time decay active</div>
              </div>

              <div className="bg-white/[0.03] border border-white/5 p-3 rounded-xl">
                <div className="text-[10px] uppercase font-mono text-slate-400">Trailing Ratchet</div>
                <div className="text-xs font-bold text-amber-400 mt-1">30% Floor Armed</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Locks peak profits</div>
              </div>

              <div className="bg-white/[0.03] border border-white/5 p-3 rounded-xl">
                <div className="text-[10px] uppercase font-mono text-slate-400">Today&apos;s Return</div>
                <div className="text-xs font-bold text-emerald-400 mt-1">+{fmt(14.84)}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Net after fees</div>
              </div>
            </div>

            {/* Visual Payoff Distribution Curve */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#d97706]" /> Live Strangle Safe Zone
                </span>
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Buffer: $2,400 USD
                </span>
              </div>

              {/* Graphic Strangle Payoff Bar */}
              <div className="relative py-4">
                {/* Background Track */}
                <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden flex">
                  <div className="w-[20%] bg-rose-500/30" />
                  <div className="w-[60%] bg-gradient-to-r from-emerald-500/40 via-emerald-400/60 to-emerald-500/40" />
                  <div className="w-[20%] bg-rose-500/30" />
                </div>

                {/* Spot Price Pointer */}
                <div className="absolute top-1 left-[51%] -translate-x-1/2 flex flex-col items-center">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold font-mono shadow-md whitespace-nowrap animate-pulse">
                    SPOT ${tickerPrice.toLocaleString()}
                  </span>
                  <div className="w-0.5 h-5 bg-amber-400 mt-0.5" />
                </div>
              </div>

              {/* Guardrail Strike Labels */}
              <div className="flex justify-between items-center text-[11px] font-mono pt-1">
                <div className="text-left">
                  <span className="text-slate-400">Put Guard:</span>
                  <span className="text-emerald-400 font-bold ml-1">$76,800</span>
                </div>
                <div className="text-center text-slate-400 text-[10px]">
                  Maximum Profit Inside Green Zone
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Call Guard:</span>
                  <span className="text-emerald-400 font-bold ml-1">$79,200</span>
                </div>
              </div>
            </div>

            {/* 4-Ring Protection Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Ring 1: Macro Shield</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Ring 2: 72h ATR Sensor</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Ring 3: 30% Ratchet</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Ring 4: 40% Cash Guard</span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: EXECUTION & ROLLBACK SHIELD */}
        {activeTab === 'execution' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="text-xs font-semibold text-slate-200">Asymmetric Rollback Shield (Zero Naked Exposure)</div>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">Leg 1: Short Call 79,200</span>
                <span className="text-emerald-400 font-bold">FILLED @ $124.00</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">Leg 2: Short Put 76,800</span>
                <span className="text-emerald-400 font-bold">FILLED @ $117.00</span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-emerald-300">
                <span>Rollback Timeout Safety</span>
                <span className="font-bold">20s PASSIVE LIMIT MATCH</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If one leg fails to fill within 20 seconds, ProfitPilot immediately closes the opposing leg to guarantee you are never left with naked market exposure.
            </p>
          </div>
        )}

        {/* TAB 3: MACRO RADAR */}
        {activeTab === 'radar' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Autonomous Economic Blackout Engine</span>
              <span className="text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Live Global Feed
              </span>
            </div>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
                <span className="text-slate-300">ISM Services PMI (USD)</span>
                <span className="text-amber-400">PAUSED (Capital Guarded)</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
                <span className="text-slate-300">US Non-Farm Payrolls (NFP)</span>
                <span className="text-slate-400">Tomorrow 18:00 IST</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
                <span className="text-slate-300">FOMC Interest Rate Decision</span>
                <span className="text-slate-400">Auto-Blackout 2h Prior</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              New trades are strictly suspended 2 hours before high-impact economic news and resume only 1 hour after market volatility settles.
            </p>
          </div>
        )}

        {/* Terminal Status Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-black/40 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Non-Custodial • Delta Exchange API</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Latency: 14ms (Direct Gateway)</span>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  Radio, 
  Zap, 
  Lock, 
  CheckCircle2, 
  Sliders,
  ChevronRight
} from 'lucide-react';

interface HeroTerminalProps {
  currency?: 'INR' | 'USD';
}

export function HeroTerminal({ currency = 'INR' }: HeroTerminalProps) {
  const [activeTab, setActiveTab] = useState<'strategy' | 'safety' | 'live'>('strategy');
  const [tickerPrice, setTickerPrice] = useState(78984);
  const fxRate = 86.5;

  const fmt = (usd: number) => {
    if (currency === 'INR') {
      const inr = usd * fxRate;
      return `₹${Math.round(inr).toLocaleString('en-IN')}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPrice(prev => +(prev + (Math.random() * 6 - 3)).toFixed(2));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative max-w-xl mx-auto lg:max-w-none">
      
      {/* Soft, calm ambient background glow */}
      <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500/10 via-slate-200/40 dark:via-white/5 to-emerald-500/10 rounded-3xl blur-2xl -z-10 pointer-events-none" />

      {/* Main Glass Card (Calm Light/Dark Responsive) */}
      <div className="bg-white dark:bg-[#141720] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_4px_24px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden transition-all">
        
        {/* Terminal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 ml-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Delta-Neutral Engine Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-white/10 num-tabular">
              BTC ${tickerPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-transparent flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${activeTab === 'strategy' ? 'bg-[#d97706] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            <Activity className="w-3.5 h-3.5" /> Strategy Setup
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${activeTab === 'safety' ? 'bg-[#d97706] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Macro Safety
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${activeTab === 'live' ? 'bg-[#d97706] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            <Zap className="w-3.5 h-3.5" /> Execution Guard
          </button>
        </div>

        {/* TAB 1: STRATEGY SETUP */}
        {activeTab === 'strategy' && (
          <div className="p-5 sm:p-6 space-y-5">
            
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 p-3 rounded-xl">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Position Type</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">BTC Strangle</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">● 68% Win Rate</div>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 p-3 rounded-xl">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Time Decay</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">+$0.92 / hr</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Theta capture</div>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 p-3 rounded-xl">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Trailing Ratchet</div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">30% Floor</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Locks in profits</div>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 p-3 rounded-xl">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Net Today</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">+{fmt(14.84)}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">After fees &amp; GST</div>
              </div>
            </div>

            {/* Visual Strangle Range Bar */}
            <div className="bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#d97706]" /> Delta-Neutral Safe Range
                </span>
                <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  $2,400 Safety Buffer
                </span>
              </div>

              {/* Graphic Range Track */}
              <div className="relative py-3">
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="w-[15%] bg-rose-200 dark:bg-rose-950/60" />
                  <div className="w-[70%] bg-emerald-100 dark:bg-emerald-950/60 border-x border-emerald-300 dark:border-emerald-700" />
                  <div className="w-[15%] bg-rose-200 dark:bg-rose-950/60" />
                </div>

                {/* Spot Price Pointer */}
                <div className="absolute top-0 left-[51%] -translate-x-1/2 flex flex-col items-center">
                  <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold font-mono shadow-sm whitespace-nowrap">
                    SPOT ${tickerPrice.toLocaleString()}
                  </span>
                  <div className="w-0.5 h-4 bg-slate-900 dark:bg-white" />
                </div>
              </div>

              {/* Range Boundaries */}
              <div className="flex justify-between items-center text-xs font-mono pt-1 text-slate-600 dark:text-slate-400">
                <div>
                  Put Guard: <strong className="text-slate-900 dark:text-white">$76,800</strong>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                  Theta Decays Safely In Green Zone
                </div>
                <div>
                  Call Guard: <strong className="text-slate-900 dark:text-white">$79,200</strong>
                </div>
              </div>
            </div>

            {/* 4 Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Macro Blackout</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>72h ATR Sensor</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>30% Ratchet</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>40% Reserve</span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MACRO SAFETY */}
        {activeTab === 'safety' && (
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            <div className="font-semibold text-slate-900 dark:text-white">Pre-Emptive Macro Blackout Defense</div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-lg flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">ISM Services PMI</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Auto-Paused (News Protected)</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-lg flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">US Non-Farm Payrolls (NFP)</span>
                <span className="text-slate-500 dark:text-slate-400">Scheduled Blackout Tomorrow</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-lg flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">Federal Reserve FOMC Decisions</span>
                <span className="text-slate-500 dark:text-slate-400">2-Hour Prior Protection</span>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
              ProfitPilot monitors high-impact global events and stops entries before sudden spikes trigger stop losses.
            </p>
          </div>
        )}

        {/* TAB 3: EXECUTION GUARD */}
        {activeTab === 'live' && (
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            <div className="font-semibold text-slate-900 dark:text-white">Orderbook Rollback Shield</div>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-lg flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Short Call Leg</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Passive Limit Fill</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-lg flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Short Put Leg</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Passive Limit Fill</span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-sans">
                <span>Rollback Guarantee</span>
                <span className="font-semibold">Zero Naked Exposure</span>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
              If the orderbook moves while entering, ProfitPilot cancels the open leg within 20 seconds so you never take directional risk.
            </p>
          </div>
        )}

        {/* Card Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Non-Custodial • Delta Exchange API</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Live &amp; Monitored</span>
          </div>
        </div>

      </div>
    </div>
  );
}

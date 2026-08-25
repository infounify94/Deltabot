'use client';

import React, { useState } from 'react';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { CopyButton } from '@/components/ui/copy-button';
import { 
  Compass, 
  Zap, 
  Cpu, 
  Layers, 
  Shield, 
  ShieldAlert, 
  Brain,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Eye,
  Activity,
  Terminal
} from 'lucide-react';

interface EngineItem {
  id: string;
  num: string;
  name: string;
  category: 'Classification' | 'Gating' | 'Selection' | 'Risk' | 'Defense' | 'Explainability';
  score: string;
  status: string;
  statusType: 'success' | 'warning' | 'info';
  metrics: { label: string; value: string }[];
  description: string;
  codeSnippet: string;
}

const ENGINES: EngineItem[] = [
  {
    id: 'regime',
    num: '01',
    name: 'Market Regime Engine',
    category: 'Classification',
    score: '78 / 100',
    status: 'High Vol / Bull',
    statusType: 'warning',
    metrics: [
      { label: 'Trend Strength (ADX)', value: '82/100' },
      { label: 'Options Positioning', value: '84/100' },
      { label: 'Momentum Vector', value: '+3.4σ' },
    ],
    description: 'Classifies Bitcoin market structure into discrete risk regimes prior to strike calculation.',
    codeSnippet: 'const regime = evaluateRegime({ adx: 82, ivSpread: 12.2, dealerGamma: "positive" });',
  },
  {
    id: 'volatility',
    num: '02',
    name: 'Volatility Engine & Gates',
    category: 'Gating',
    score: '3.82% NATR',
    status: 'Gate: Approved',
    statusType: 'success',
    metrics: [
      { label: 'IV Rank', value: '74%' },
      { label: 'IV / RV Spread', value: '+12.2%' },
      { label: 'Expected Move (1D)', value: '±3.05%' },
    ],
    description: 'Tracks implied vs realized volatility spreads. Automatically locks entry when tail risk rises.',
    codeSnippet: 'if (iv - rv > 8.0 && natr < 4.5) return EntryGate.APPROVED;',
  },
  {
    id: 'strategy',
    num: '03',
    name: 'Strategy Fit Engine',
    category: 'Selection',
    score: '82 / 100',
    status: 'Favorable (Short Vol)',
    statusType: 'success',
    metrics: [
      { label: 'Target Delta', value: '0.15–0.18' },
      { label: 'Call Strike', value: '$68,000' },
      { label: 'Put Strike', value: '$61,000' },
    ],
    description: 'Mathematically calculates Out-of-the-Money strangle probability of profit (POP) & theta decay.',
    codeSnippet: 'const strangle = buildStrangle({ targetDelta: 0.16, expiry: "1D", underlying: "BTC" });',
  },
  {
    id: 'defense',
    num: '06',
    name: 'Dynamic Defense Wings',
    category: 'Defense',
    score: 'Δ ≥ 0.35 Trigger',
    status: 'Armed (5s Loop)',
    statusType: 'info',
    metrics: [
      { label: 'Wing Type', value: 'Iron Condor' },
      { label: 'Trigger Delta', value: '≥ 0.35' },
      { label: 'Tail Risk', value: 'Capped at $1,250' },
    ],
    description: 'Buys outer protective wings within 5 seconds when Bitcoin approaches a short strike.',
    codeSnippet: 'if (threatenedDelta >= 0.35) await executeWingPurchase({ width: 2500, symbol: threatenedLeg });',
  },
  {
    id: 'notrade',
    num: '05',
    name: 'Risk & No-Trade Gate',
    category: 'Risk',
    score: '184 Filtered',
    status: '40% Margin Reserve',
    statusType: 'success',
    metrics: [
      { label: 'Avoided Trades', value: '36.8%' },
      { label: 'Cooldown Quarantines', value: '4 Hours' },
      { label: 'Concentration Cap', value: 'Max 10 Lots' },
    ],
    description: 'Discipline in action: filters out 36.8% of low-probability market setups before risking capital.',
    codeSnippet: 'const marginAvailable = freeCollateral / totalBalance; if (marginAvailable < 0.40) blockEntry();',
  },
  {
    id: 'why',
    num: '07',
    name: '"WHY?" Explainability Engine',
    category: 'Explainability',
    score: '5 Real-Time Audits',
    status: 'Live Ground Truth',
    statusType: 'info',
    metrics: [
      { label: 'P&L Reconciliation', value: 'Net of 18% GST' },
      { label: 'Diagnostic Queries', value: 'Audit Trail' },
      { label: 'Audit Speed', value: '< 20ms' },
    ],
    description: 'Real-time contextual AI diagnostics explaining why trades were entered, defended, or avoided.',
    codeSnippet: 'const audit = explainDecision({ state: "HARVEST", deltaCall: 0.14, deltaPut: 0.13 });',
  },
];

export function InteractiveBentoGrid() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const categories = ['All', 'Classification', 'Gating', 'Selection', 'Risk', 'Defense', 'Explainability'];

  const filteredEngines = activeCategory === 'All' 
    ? ENGINES 
    : ENGINES.filter(e => e.category === activeCategory);

  return (
    <div className="space-y-6">
      
      {/* 21st.dev Style Category Filter Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              activeCategory === cat
                ? 'bg-[#d97706] text-white shadow-subtle font-semibold'
                : 'bg-[var(--paper-2)] text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)] border border-[var(--hair)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredEngines.map((engine) => (
          <SpotlightCard
            key={engine.id}
            className="p-5 sm:p-6 space-y-4 hover:border-[#d97706]/40 transition-all group shadow-subtle"
            spotlightColor="rgba(217, 119, 6, 0.09)"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[var(--hair)] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold w-6 h-6 rounded-md bg-[var(--orange-tint)] text-[#d97706] flex items-center justify-center border border-[#d97706]/20">
                  {engine.num}
                </span>
                <span className="text-xs font-semibold text-[var(--ink)]">
                  {engine.name}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                engine.statusType === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200'
                  : engine.statusType === 'warning'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200'
              }`}>
                {engine.status}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-[var(--grey)] leading-relaxed">
              {engine.description}
            </p>

            {/* Quantitative Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 bg-[var(--paper-2)] p-2.5 rounded-lg border border-[var(--hair)] text-center">
              {engine.metrics.map((m, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="text-[10px] text-[var(--grey)] truncate">{m.label}</div>
                  <div className="font-mono text-[11px] font-semibold text-[var(--ink)] num-tabular">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Code Snippet with 21st.dev 1-Click Copy Button */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--hair)] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[var(--faint)] flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-[#d97706]" /> logic.ts
                </span>
                <CopyButton text={engine.codeSnippet} label="Copy logic" />
              </div>
              <pre className="font-mono text-[10.5px] text-[var(--ink)] overflow-x-auto whitespace-pre leading-relaxed opacity-90">
                <code>{engine.codeSnippet}</code>
              </pre>
            </div>
          </SpotlightCard>
        ))}
      </div>

    </div>
  );
}

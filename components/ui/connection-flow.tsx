'use client';

import React from 'react';
import { ShieldCheck, Lock, ArrowRight, Activity, Database, Server, Wallet } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/spotlight-card';

export function ConnectionFlow() {
  const steps = [
    {
      step: '01',
      title: 'Your Delta Account',
      subtitle: 'Funds & collateral remain 100% in your Delta Exchange India or Global wallet.',
      icon: Wallet,
      badge: 'Zero Custody',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200',
    },
    {
      step: '02',
      title: 'Trade-Only API Key',
      subtitle: 'Create a restricted API key with trading permissions only. Withdrawals are mathematically blocked.',
      icon: Lock,
      badge: 'IP Whitelisted',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200',
    },
    {
      step: '03',
      title: 'Quantitative Core',
      subtitle: 'Calculates volatility regimes and executes strike entries & dynamic wings via low-latency REST/WS.',
      icon: Server,
      badge: '5s Monitoring',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200',
    },
    {
      step: '04',
      title: 'Real-Time Dashboard',
      subtitle: 'Monitor mark P&L, fee audits, decision diagnostics, and trigger emergency kill switches anytime.',
      icon: Activity,
      badge: 'Row Level Security',
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <SpotlightCard
              key={index}
              className="p-5 space-y-3.5 shadow-subtle relative flex flex-col justify-between"
              spotlightColor="rgba(217, 119, 6, 0.08)"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#d97706] bg-[var(--orange-tint)] w-6 h-6 rounded-md flex items-center justify-center border border-[#d97706]/20">
                    {item.step}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] flex items-center justify-center text-[var(--ink)]">
                    <Icon className="w-4 h-4 text-[#d97706]" />
                  </div>
                  <h4 className="font-semibold text-sm text-[var(--ink)]">{item.title}</h4>
                </div>

                <p className="text-xs text-[var(--grey)] leading-relaxed">
                  {item.subtitle}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 bg-[var(--card)] border border-[var(--hair)] rounded-full p-1 shadow-subtle text-[var(--grey)]">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </SpotlightCard>
          );
        })}
      </div>

      <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--hair)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-subtle">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-[var(--ink)] font-medium">
            Non-Custodial Architecture: We never hold your capital or have withdrawal authority.
          </span>
        </div>
        <span className="text-[11px] font-mono text-[var(--grey)]">
          Delta Exchange India &middot; Delta Exchange Global
        </span>
      </div>
    </div>
  );
}

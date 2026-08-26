'use client';

import React from 'react';
import { Activity } from 'lucide-react';

export function DashboardPreview({ currency = 'INR' }: { currency?: 'INR' | 'USD' }) {
  const isInr = currency === 'INR';

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <div className="bg-white dark:bg-[#141720] rounded-xl border border-[#e2e8f0] dark:border-white/10 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] overflow-hidden">
        
        {/* Preview Header */}
        <div className="px-5 py-3.5 border-b border-[#e2e8f0] dark:border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#f59e0b] to-[#d97706] flex items-center justify-center">
              <Activity className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-semibold text-[var(--ink)]">ProfitPilot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Automation active</span>
          </div>
        </div>

        {/* KPI Row */}
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] text-[var(--grey)] font-medium">Account value</div>
            <div className="font-mono text-xl font-semibold text-[var(--ink)] mt-0.5 num-tabular">
              {isInr ? '₹4,64,230' : '$5,368'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--grey)] font-medium">Today&apos;s P&amp;L</div>
            <div className="font-mono text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 num-tabular">
              {isInr ? '+₹1,284' : '+$14.84'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-[#e2e8f0] dark:border-white/8" />

        {/* Open Position */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-[var(--grey)] font-medium">Open positions</div>
            <span className="font-mono text-[11px] font-semibold text-[var(--ink)]">1</span>
          </div>

          <div className="bg-[var(--paper-2)] rounded-lg border border-[#e2e8f0] dark:border-white/8 p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[var(--ink)]">BTC Options</div>
                <div className="text-[11px] text-[var(--grey)] mt-0.5">Daily expiry</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 num-tabular">
                  {isInr ? '+₹684' : '+$7.91'}
                </div>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                  OPEN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-[#e2e8f0] dark:border-white/8" />

        {/* Bot Status Footer */}
        <div className="px-5 py-3.5 flex items-center justify-between">
          <div className="text-[11px] text-[var(--grey)] font-medium">Bot status</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-[var(--ink)]">Monitoring</span>
          </div>
        </div>

      </div>
    </div>
  );
}

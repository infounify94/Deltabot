'use client';

import React, { useState } from 'react';

export function OptionPayoffChart() {
  const [defenseActive, setDefenseActive] = useState(true);

  // SVG dimensions
  const width = 540;
  const height = 240;
  const zeroY = 120; // P&L = 0 line

  // Strikes
  const spotX = 270; // $64,250
  const putStrikeX = 180; // $61,000
  const callStrikeX = 360; // $68,000
  const putWingX = 100; // $58,500
  const callWingX = 440; // $70,500

  // P&L levels
  const maxProfitY = 50; // +$1,250
  const cappedLossY = 190; // -$1,250 (with wings)
  const nakedLossY = 230; // drops off (unprotected)

  return (
    <div className="w-full bg-[var(--card)] border border-[var(--hair)] rounded-xl p-5 space-y-4 shadow-subtle">
      
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--hair)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h4 className="text-xs font-semibold text-[var(--ink)]">
              BTC Daily Strangle vs Iron Condor Payoff Curve
            </h4>
          </div>
          <p className="text-[11px] text-[var(--grey)] mt-0.5">
            Simulates dynamic wing protection under extreme market expansions.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-1 bg-[var(--paper-2)] p-1 rounded-lg border border-[var(--hair)] text-xs">
          <button
            type="button"
            onClick={() => setDefenseActive(false)}
            className={`px-2.5 py-1 rounded-md transition-all ${
              !defenseActive 
                ? 'bg-rose-600 text-white font-semibold shadow-subtle' 
                : 'text-[var(--grey)] hover:text-[var(--ink)]'
            }`}
          >
            Naked Strangle
          </button>
          <button
            type="button"
            onClick={() => setDefenseActive(true)}
            className={`px-2.5 py-1 rounded-md transition-all ${
              defenseActive 
                ? 'bg-emerald-600 text-white font-semibold shadow-subtle' 
                : 'text-[var(--grey)] hover:text-[var(--ink)]'
            }`}
          >
            + Dynamic Wings Armed
          </button>
        </div>
      </div>

      {/* SVG Payoff Graphic */}
      <div className="relative w-full overflow-hidden bg-[var(--paper-2)] rounded-lg p-2 border border-[var(--hair)]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          
          {/* Grid lines */}
          <line x1="40" y1={zeroY} x2={width - 20} y2={zeroY} stroke="var(--hair-2)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="40" y1={maxProfitY} x2={width - 20} y2={maxProfitY} stroke="var(--hair)" strokeWidth="0.5" />
          <line x1="40" y1={cappedLossY} x2={width - 20} y2={cappedLossY} stroke="var(--hair)" strokeWidth="0.5" />

          {/* Vertical Strike Guideline Markers */}
          <line x1={putStrikeX} y1="20" x2={putStrikeX} y2={height - 20} stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <line x1={callStrikeX} y1="20" x2={callStrikeX} y2={height - 20} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <line x1={spotX} y1="20" x2={spotX} y2={height - 20} stroke="#d97706" strokeWidth="1.5" />

          {/* Profit Green Fill Zone */}
          <polygon
            points={`
              ${putStrikeX},${maxProfitY} 
              ${callStrikeX},${maxProfitY} 
              ${callStrikeX + 45},${zeroY} 
              ${putStrikeX - 45},${zeroY}
            `}
            fill="rgba(16, 185, 129, 0.12)"
          />

          {/* Payoff Curve Paths */}
          {defenseActive ? (
            /* Protected Iron Condor with Capped Loss Wings */
            <path
              d={`
                M 30,${cappedLossY} 
                L ${putWingX},${cappedLossY} 
                L ${putStrikeX},${maxProfitY} 
                L ${callStrikeX},${maxProfitY} 
                L ${callWingX},${cappedLossY} 
                L ${width - 20},${cappedLossY}
              `}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          ) : (
            /* Naked Strangle Curve (Uncapped Tail Risk) */
            <path
              d={`
                M 30,${nakedLossY} 
                L ${putStrikeX},${maxProfitY} 
                L ${callStrikeX},${maxProfitY} 
                L ${width - 20},${nakedLossY}
              `}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          )}

          {/* Markers & Labels */}
          {/* Max Profit label */}
          <text x="45" y={maxProfitY - 8} className="font-mono text-[10px] fill-emerald-600 font-semibold">
            +$1,250 Max Harvest
          </text>

          {/* Zero P&L label */}
          <text x="45" y={zeroY - 6} className="font-mono text-[9px] fill-[var(--grey)]">
            $0 Breakeven
          </text>

          {/* Capped Loss vs Tail Risk label */}
          {defenseActive ? (
            <text x="45" y={cappedLossY + 15} className="font-mono text-[10px] fill-emerald-600 font-semibold">
              -$1,250 Capped Max Loss (Wing Protection)
            </text>
          ) : (
            <text x="45" y={nakedLossY - 6} className="font-mono text-[10px] fill-rose-600 font-semibold">
              Uncapped Tail Risk (Naked Exposure)
            </text>
          )}

          {/* Spot Price Pin */}
          <circle cx={spotX} cy={maxProfitY} r="4" fill="#d97706" />
          <rect x={spotX - 35} y="15" width="70" height="18" rx="4" fill="#d97706" />
          <text x={spotX} y="27" textAnchor="middle" className="font-mono text-[9.5px] fill-white font-bold">
            BTC $64.2k
          </text>

          {/* Strike Labels */}
          <text x={putStrikeX} y={height - 8} textAnchor="middle" className="font-mono text-[10px] fill-emerald-600 font-semibold">
            Put $61k (0.15Δ)
          </text>
          <text x={callStrikeX} y={height - 8} textAnchor="middle" className="font-mono text-[10px] fill-rose-600 font-semibold">
            Call $68k (0.14Δ)
          </text>

        </svg>
      </div>

      {/* Footer Metrics Indicator */}
      <div className="grid grid-cols-3 gap-3 text-xs pt-1 border-t border-[var(--hair)]">
        <div>
          <span className="text-[11px] text-[var(--grey)]">Lower Breakeven</span>
          <div className="font-mono font-semibold text-[var(--ink)] mt-0.5">$60,150</div>
        </div>
        <div>
          <span className="text-[11px] text-[var(--grey)]">Upper Breakeven</span>
          <div className="font-mono font-semibold text-[var(--ink)] mt-0.5">$68,850</div>
        </div>
        <div>
          <span className="text-[11px] text-[var(--grey)]">Risk Boundary</span>
          <div className={`font-mono font-semibold mt-0.5 ${defenseActive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {defenseActive ? 'Capped (-$1,250)' : 'Uncapped'}
          </div>
        </div>
      </div>

    </div>
  );
}

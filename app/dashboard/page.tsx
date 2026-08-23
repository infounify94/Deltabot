'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PlayCircle, PauseCircle } from 'lucide-react';

export default function Dashboard() {
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [closedPositions, setClosedPositions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ roundTrips: 0, winners: 0, hitRate: 0, totalPnl: 0 });
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  const [btcPrice, setBtcPrice] = useState<string>('...');

  // WebSocket for Live BTC Price
  useEffect(() => {
    let ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setBtcPrice(parseFloat(data.p).toFixed(2));
    };
    return () => ws.close();
  }, []);

  async function fetchData() {
    // Fetch system_pause flag
    const { data: pauseData } = await supabase.from('positions').select('id').eq('status', 'system_pause');
    setIsPaused((pauseData || []).length > 0);

    // Fetch open positions
    const { data: openData } = await supabase.from('positions').select('*').in('status', ['open', 'adjusted']);
    
    // Enrich open positions with Live Delta API marks
    const enrichedOpenData = await Promise.all((openData || []).map(async (pos) => {
        try {
            const [callRes, putRes] = await Promise.all([
                fetch(`https://api.delta.exchange/v2/products/${pos.short_call_symbol}/ticker`),
                fetch(`https://api.delta.exchange/v2/products/${pos.short_put_symbol}/ticker`)
            ]);
            
            const callData = await callRes.json();
            const putData = await putRes.json();
            
            const cMark = parseFloat(callData.result?.mark_price || 0);
            const pMark = parseFloat(putData.result?.mark_price || 0);
            
            const currentCost = (cMark + pMark) * pos.lots * 0.001;
            const adjCost = parseFloat(pos.adjustment_cost || 0);
            const actualPnl = parseFloat(pos.credit_received || 0) - currentCost - adjCost;

            return {
                ...pos,
                actualPnl,
                peakPnl: parseFloat(pos.peak_unrealized_pnl || 0)
            };
        } catch (error) {
            return { ...pos, actualPnl: 0, peakPnl: parseFloat(pos.peak_unrealized_pnl || 0) };
        }
    }));
    
    // Fetch closed positions
    const { data: closedData } = await supabase.from('positions').select('*').eq('status', 'closed').order('closed_at', { ascending: false });

    // Fetch trade events
    const { data: eventsData } = await supabase.from('trade_events').select('*');

    // Process Closed Positions
    const processedClosed = (closedData || []).map(pos => {
      let fees = 0;
      let callEntry = 'N/A', putEntry = 'N/A', callExit = 'N/A', putExit = 'N/A';
      
      const posEvents = (eventsData || []).filter(e => e.position_id === pos.id);
      posEvents.forEach(e => {
        if (!e.detail) return;
        if (e.event_type === 'entry') {
          const fill = e.detail.fill || {};
          fees += parseFloat(fill.fees_paid || 0);
          callEntry = fill.short_call_fill || fill.call_fill_price || 'N/A';
          putEntry = fill.short_put_fill || fill.put_fill_price || 'N/A';
        }
        if (['time_exit', 'profit_take', 'stop_loss', 'manual_kill_switch', 'liquidation_buffer_breach'].includes(e.event_type)) {
          const fills = e.detail.fills || {};
          const cf = fills[pos.short_call_symbol] || {};
          const pf = fills[pos.short_put_symbol] || {};
          
          const extract = (f: any) => {
            if (f.average_fill_price) return [f.average_fill_price, parseFloat(f.paid_commission || 0) * 1.18];
            if (f.result?.average_fill_price) return [f.result.average_fill_price, parseFloat(f.result.paid_commission || 0) * 1.18];
            return [null, 0];
          };
          const [cp, cfFee] = extract(cf);
          const [pp, pfFee] = extract(pf);
          
          fees += cfFee + pfFee;
          callExit = cp ? `$${parseFloat(cp as string).toFixed(2)}` : 'N/A';
          putExit = pp ? `$${parseFloat(pp as string).toFixed(2)}` : 'N/A';
        }
      });

      const realizedPnl = parseFloat(pos.realized_pnl || 0);
      return {
        ...pos,
        fees,
        grossPnl: realizedPnl + fees,
        callEntry: callEntry !== 'N/A' ? `$${parseFloat(callEntry as string).toFixed(2)}` : 'N/A',
        putEntry: putEntry !== 'N/A' ? `$${parseFloat(putEntry as string).toFixed(2)}` : 'N/A',
        callExit,
        putExit,
        realizedPnl
      };
    });

    setOpenPositions(enrichedOpenData);
    setClosedPositions(processedClosed);

    const roundTrips = processedClosed.length;
    const winners = processedClosed.filter(p => p.realizedPnl > 0).length;
    const hitRate = roundTrips > 0 ? Math.round((winners / roundTrips) * 100) : 0;
    const totalPnl = processedClosed.reduce((sum, p) => sum + p.realizedPnl, 0);
    
    setMetrics({ roundTrips, winners, hitRate, totalPnl });
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handlePauseToggle = async () => {
    if (isPaused) {
      await supabase.from('positions').delete().eq('status', 'system_pause');
    } else {
      await supabase.from('positions').insert([{ 
        status: 'system_pause', underlying: 'SYSTEM', expiry_date: '2099-01-01', short_call_symbol: 'SYSTEM', short_call_strike: 0, short_put_symbol: 'SYSTEM', short_put_strike: 0, credit_received: 0, lots: 0
      }]);
    }
    fetchData();
  };

  const handleKillSwitch = async (id: string | number) => {
    if (confirm("Are you sure you want to emergency close this position?")) {
      await supabase.from('positions').update({ manual_exit_requested: true }).eq('id', id);
      fetchData();
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Dashboard...</div>;

  // Generate heatmap squares (last 20 trades)
  const heatmapTrades = [...closedPositions].reverse().slice(-30);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Top Ticker Bar (Like old dashboard) */}
      <div className="w-full bg-slate-100 border-b border-slate-200 py-2 px-4 flex items-center gap-6 overflow-hidden text-sm font-semibold">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-5 h-5 rounded-full bg-[#f7931a] text-white flex items-center justify-center text-xs">₿</span>
          <span className="text-slate-800">Bitcoin</span>
          <span className="text-slate-900">{btcPrice !== '...' ? `$${btcPrice}` : 'Loading...'}</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">ProfitPilot Bot</h1>
        <div className="flex items-center gap-3">
          <button onClick={handlePauseToggle} className={`px-4 py-2 font-bold rounded text-sm ${isPaused ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
            {isPaused ? '▶ Resume Entries' : '⏸ Pause Entries'}
          </button>
          <button className="px-4 py-2 font-bold rounded text-sm bg-slate-800 text-white hover:bg-slate-900">
            View Logs
          </button>
          <button onClick={fetchData} className="px-4 py-2 font-bold rounded text-sm bg-slate-900 text-white hover:bg-black">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        
        {/* KPI Row (Clean White Box) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-8 flex justify-between items-center">
          <div className="flex-1 border-r border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Live Balance</div>
            <div className="text-2xl font-bold text-slate-800">$15.90</div>
          </div>
          <div className="flex-1 border-r border-slate-100 pl-8">
            <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Round-Trips</div>
            <div className="text-2xl font-bold text-slate-800">{metrics.roundTrips}</div>
          </div>
          <div className="flex-1 border-r border-slate-100 pl-8">
            <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Winners</div>
            <div className="text-2xl font-bold text-slate-800">{metrics.winners}</div>
          </div>
          <div className="flex-1 border-r border-slate-100 pl-8">
            <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Hit Rate</div>
            <div className="text-2xl font-bold text-slate-800">{metrics.hitRate}%</div>
          </div>
          <div className="flex-1 pl-8">
            <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Realised P&L</div>
            <div className={`text-2xl font-bold ${metrics.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ${metrics.totalPnl.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mb-8">
          <div className="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Daily Profitability Heatmap</div>
          <div className="flex flex-wrap gap-1.5">
            {heatmapTrades.map((trade, i) => (
              <div 
                key={i} 
                title={`$${trade.realizedPnl.toFixed(2)}`}
                className={`w-6 h-6 rounded ${trade.realizedPnl > 0 ? 'bg-emerald-500' : trade.realizedPnl < 0 ? 'bg-rose-500' : 'bg-slate-300'}`}
              ></div>
            ))}
            {heatmapTrades.length === 0 && <div className="text-sm text-slate-400">No trades yet.</div>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-bold rounded-lg text-sm transition ${activeTab === 'active' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Active Positions ({openPositions.length})
          </button>
          <button 
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-2 font-bold rounded-lg text-sm transition ${activeTab === 'closed' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Closed Positions ({closedPositions.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'active' ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Instrument (C/P)</th>
                    <th className="px-6 py-4">Strategy</th>
                    <th className="px-6 py-4">Size (BTC)</th>
                    <th className="px-6 py-4">Entry Price</th>
                    <th className="px-6 py-4">Actual P&L</th>
                    <th className="px-6 py-4">Peak P&L</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {openPositions.map(pos => (
                    <tr key={pos.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 font-semibold">
                        <div>{pos.short_call_symbol}</div>
                        <div>{pos.short_put_symbol}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">Strangle</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{(pos.lots * 0.001).toFixed(3)}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <div>${(parseFloat(pos.credit_received) / 2).toFixed(2)}</div>
                        <div>${(parseFloat(pos.credit_received) / 2).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={pos.actualPnl >= 0 ? "text-emerald-500" : "text-rose-500"}>
                          {pos.actualPnl >= 0 ? "+" : ""}${pos.actualPnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={pos.peakPnl > 0 ? "text-emerald-500" : "text-slate-600"}>
                          {pos.peakPnl > 0 ? "+" : ""}${pos.peakPnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold uppercase">{pos.status}</span>
                        {pos.manual_exit_requested ? (
                          <span className="text-rose-600 font-bold text-xs">KILL SIGNAL SENT</span>
                        ) : (
                          <button onClick={() => handleKillSwitch(pos.id)} className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-xs font-bold transition">
                            KILL
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {openPositions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No active positions right now.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Instrument (C/P)</th>
                    <th className="px-6 py-4">Size (BTC)</th>
                    <th className="px-6 py-4">Entry Price</th>
                    <th className="px-6 py-4">Exit Price</th>
                    <th className="px-6 py-4">Fees</th>
                    <th className="px-6 py-4">Net P&L</th>
                    <th className="px-6 py-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {closedPositions.map(pos => (
                    <tr key={pos.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 font-semibold">
                        <div>{pos.short_call_symbol}</div>
                        <div>{pos.short_put_symbol}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{(pos.lots * 0.001).toFixed(3)}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        <div>{pos.callEntry}</div>
                        <div>{pos.putEntry}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        <div>{pos.callExit}</div>
                        <div>{pos.putExit}</div>
                      </td>
                      <td className="px-6 py-4 text-rose-500 font-medium">
                        -${pos.fees.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={pos.realizedPnl >= 0 ? "text-emerald-500" : "text-rose-500"}>
                          {pos.realizedPnl >= 0 ? "+" : ""}${pos.realizedPnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                        {pos.close_reason}
                      </td>
                    </tr>
                  ))}
                  {closedPositions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No closed positions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

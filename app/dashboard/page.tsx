'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PlayCircle, PauseCircle } from 'lucide-react';

export default function Dashboard() {
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [closedPositions, setClosedPositions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ roundTrips: 0, winners: 0, hitRate: 0, totalPnl: 0, liveBalance: 0 });
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch system_pause flag for this user specifically
    const { data: pauseData } = await supabase.from('positions').select('id').eq('status', 'system_pause').eq('user_id', user.id);
    setIsPaused((pauseData || []).length > 0);

    // Fetch open positions FOR THIS USER
    const { data: openData } = await supabase.from('positions').select('*').eq('user_id', user.id).in('status', ['open', 'adjusted']);
    
    // Enrich open positions using the master bot's updated database values
    const enrichedOpenData = (openData || []).map((pos: any) => ({
      ...pos,
      actualPnl: parseFloat(pos.actual_pnl || 0),
      peakPnl: parseFloat(pos.peak_unrealized_pnl || 0)
    }));
    
    // Fetch closed positions FOR THIS USER
    const { data: closedData } = await supabase.from('positions').select('*').eq('user_id', user.id).eq('status', 'closed').order('closed_at', { ascending: false });

    // Fetch trade events FOR THIS USER
    const { data: eventsData } = await supabase.from('trade_events').select('*').eq('user_id', user.id);

    let liveBalance = 0;
    const { data: profile } = await supabase.from('profiles').select('live_balance').eq('id', user.id).single();
    if (profile?.live_balance) {
        liveBalance = parseFloat(profile.live_balance);
    }

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

    const processedOpen = enrichedOpenData.map((pos: any) => {
      let callEntry = 'N/A', putEntry = 'N/A';
      const posEvents = (eventsData || []).filter(e => e.position_id === pos.id);
      posEvents.forEach(e => {
        if (!e.detail) return;
        if (e.event_type === 'entry') {
          const fill = e.detail.fill || {};
          callEntry = fill.short_call_fill || fill.call_fill_price || 'N/A';
          putEntry = fill.short_put_fill || fill.put_fill_price || 'N/A';
        }
      });
      return {
        ...pos,
        callEntry: callEntry !== 'N/A' ? `$${parseFloat(callEntry as string).toFixed(2)}` : 'N/A',
        putEntry: putEntry !== 'N/A' ? `$${parseFloat(putEntry as string).toFixed(2)}` : 'N/A',
      };
    });

    setOpenPositions(processedOpen);
    setClosedPositions(processedClosed);

    const roundTrips = processedClosed.length;
    const winners = processedClosed.filter(p => p.realizedPnl > 0).length;
    const hitRate = roundTrips > 0 ? Math.round((winners / roundTrips) * 100) : 0;
    const totalPnl = processedClosed.reduce((sum, p) => sum + p.realizedPnl, 0);
    
    setMetrics({ roundTrips, winners, hitRate, totalPnl, liveBalance });
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handlePauseToggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isPaused) {
      await supabase.from('positions').delete().eq('status', 'system_pause').eq('user_id', user.id);
    } else {
      await supabase.from('positions').insert([{ 
        user_id: user.id,
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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Main Shared Navbar */}
      <nav className="w-full bg-[#050505] py-4 px-6 flex items-center justify-between shadow-md z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/dashboard'}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">ProfitPilot</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-sm font-medium text-white transition border-b-2 border-[#e27625] pb-1">Dashboard</a>
          <a href="/dashboard/settings" className="text-sm font-medium text-slate-300 hover:text-white transition">Settings</a>
            <a href="/dashboard/help" className="text-sm font-medium text-slate-300 hover:text-white transition">Help</a>
            <a href="/dashboard/help" className="text-sm font-medium text-slate-300 hover:text-white transition">Help</a>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="text-sm font-medium text-rose-400 hover:text-rose-300 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Top Ticker Bar (Like old dashboard) */}
      <div className="w-full bg-slate-100 border-b border-slate-200 py-2 px-4 flex items-center gap-6 overflow-hidden text-sm font-semibold">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-5 h-5 rounded-full bg-[#f7931a] text-white flex items-center justify-center text-xs">₿</span>
          <span className="text-slate-800">Bitcoin</span>
          <span className="text-slate-900">{btcPrice !== '...' ? `$${btcPrice}` : 'Loading...'}</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <h1 className="text-xl font-bold text-slate-800">ProfitPilot Bot Dashboard</h1>
        <div className="flex items-center gap-3">
          <button onClick={handlePauseToggle} className={`px-4 py-2 font-bold rounded text-sm transition ${isPaused ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
            {isPaused ? '▶ Resume Entries' : '⏸ Pause Entries'}
          </button>
          <button 
            onClick={() => {
              setLoading(true);
              fetchData();
            }} 
            className="px-4 py-2 font-bold rounded text-sm bg-slate-900 text-white hover:bg-black transition flex items-center gap-2"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full">
        
        {/* KPI Row (Clean White Box) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-8 mb-8 grid grid-cols-2 gap-4 md:flex justify-between items-center">
          <div className="md:flex-1 md:border-r border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 mb-1 md:mb-2 uppercase tracking-wider">Live Balance</div>
            <div className="text-xl md:text-2xl font-bold text-slate-800">${metrics.liveBalance.toFixed(2)}</div>
          </div>
          <div className="md:flex-1 md:border-r border-slate-100 md:pl-8">
            <div className="text-[11px] font-bold text-slate-400 mb-1 md:mb-2 uppercase tracking-wider">Round-Trips</div>
            <div className="text-xl md:text-2xl font-bold text-slate-800">{metrics.roundTrips}</div>
          </div>
          <div className="md:flex-1 md:border-r border-slate-100 md:pl-8">
            <div className="text-[11px] font-bold text-slate-400 mb-1 md:mb-2 uppercase tracking-wider">Winners</div>
            <div className="text-xl md:text-2xl font-bold text-slate-800">{metrics.winners}</div>
          </div>
          <div className="md:flex-1 md:border-r border-slate-100 md:pl-8">
            <div className="text-[11px] font-bold text-slate-400 mb-1 md:mb-2 uppercase tracking-wider">Hit Rate</div>
            <div className="text-xl md:text-2xl font-bold text-slate-800">{metrics.hitRate}%</div>
          </div>
          <div className="col-span-2 md:col-span-1 md:flex-1 md:pl-8">
            <div className="text-[11px] font-bold text-slate-400 mb-1 md:mb-2 uppercase tracking-wider">Realised P&L</div>
            <div className={`text-xl md:text-2xl font-bold ${metrics.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8 w-full max-w-[100vw]">
          <div className="overflow-x-auto w-full">
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
                        <div>{pos.callEntry || 'N/A'}</div>
                        <div>{pos.putEntry || 'N/A'}</div>
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

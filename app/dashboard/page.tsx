'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Activity, 
  Play, 
  Pause, 
  RefreshCw, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ExternalLink,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function Dashboard() {
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [closedPositions, setClosedPositions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ roundTrips: 0, winners: 0, hitRate: 0, totalPnl: 0, liveBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [btcPrice, setBtcPrice] = useState<number>(64250);
  const [ethPrice, setEthPrice] = useState<number>(3480);
  const [userEmail, setUserEmail] = useState<string>('');

  const fxRate = 86.5;

  const fmt = (usdAmount: number, forceDecimals = true) => {
    if (currency === 'INR') {
      const inr = usdAmount * fxRate;
      return `₹${inr.toLocaleString('en-IN', { minimumFractionDigits: forceDecimals ? 2 : 0, maximumFractionDigits: forceDecimals ? 2 : 0 })}`;
    }
    return `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: forceDecimals ? 2 : 0, maximumFractionDigits: forceDecimals ? 2 : 0 })}`;
  };

  // WebSocket for Live BTC & ETH Prices
  useEffect(() => {
    let wsBtc: WebSocket;
    let wsEth: WebSocket;
    try {
      wsBtc = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
      wsBtc.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.p) setBtcPrice(parseFloat(data.p));
      };

      wsEth = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@trade');
      wsEth.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.p) setEthPrice(parseFloat(data.p));
      };
    } catch (e) {
      console.error(e);
    }
    return () => {
      if (wsBtc) wsBtc.close();
      if (wsEth) wsEth.close();
    };
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      setUserEmail(user.email || '');

      // Check system_pause status
      const { data: pauseData } = await supabase
        .from('positions')
        .select('id')
        .eq('status', 'system_pause')
        .eq('user_id', user.id);
      setIsPaused((pauseData || []).length > 0);

      // Fetch open/adjusted positions for this user
      const { data: openData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'adjusted']);

      // Fetch closed positions for this user
      const { data: closedData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'closed')
        .order('closed_at', { ascending: false });

      // Fetch trade events for fee and execution details
      const posIds = [...(openData || []), ...(closedData || [])].map((p: any) => p.id);
      const { data: eventsData } = posIds.length > 0 
        ? await supabase.from('trade_events').select('*').in('position_id', posIds) 
        : { data: [] };

      // Fetch live balance from profile
      let liveBalance = 0;
      const { data: profile } = await supabase.from('profiles').select('live_balance').eq('id', user.id).single();
      if (profile?.live_balance) {
        liveBalance = parseFloat(profile.live_balance);
      }

      // Process Closed Positions with fee + 18% GST calculation
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
          if (['time_exit', 'profit_take', 'stop_loss', 'manual_kill_switch', 'liquidation_buffer_breach', 'exit'].includes(e.event_type)) {
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

      // Process Open Positions
      const processedOpen = (openData || []).map((pos: any) => {
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
          actualPnl: parseFloat(pos.actual_pnl || 0),
          peakPnl: parseFloat(pos.peak_unrealized_pnl || 0),
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
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePauseToggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isPaused) {
      await supabase.from('positions').delete().eq('status', 'system_pause').eq('user_id', user.id);
    } else {
      await supabase.from('positions').insert([{ 
        user_id: user.id,
        status: 'system_pause', 
        underlying: 'SYSTEM', 
        expiry_date: '2099-01-01', 
        short_call_symbol: 'SYSTEM', 
        short_call_strike: 0, 
        short_put_symbol: 'SYSTEM', 
        short_put_strike: 0, 
        credit_received: 0, 
        lots: 0
      }]);
    }
    fetchData();
  };

  const handleKillSwitch = async (id: string | number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (confirm("Are you sure you want to trigger an emergency market close for this position?")) {
      await supabase.from('positions').update({ manual_exit_requested: true }).eq('id', id).eq('user_id', user.id);
      fetchData();
    }
  };

  const heatmapTrades = [...closedPositions].reverse().slice(-28);

  return (
    <div className="min-h-screen bg-[#0C0D10] text-[#F3F2EF] font-sans flex flex-col selection:bg-[#f09455]/30">
      
      {/* Shared Dashboard Navbar */}
      <nav className="w-full bg-[#121419] border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09455] via-[#e27625] to-[#d9a44e] flex items-center justify-center shadow-md">
            <Activity className="text-[#241505] w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-white">Profit</span>
            <span className="font-bold text-lg tracking-tight text-[#f09455]">Pilot</span>
          </div>
        </Link>

        {/* Dashboard Nav Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard" className="text-[#f09455] border-b-2 border-[#f09455] pb-1 font-bold">
            Live Terminal
          </Link>
          <Link href="/dashboard/settings" className="text-slate-400 hover:text-white transition">
            Settings &amp; Keys
          </Link>
          <Link href="/dashboard/help" className="text-slate-400 hover:text-white transition">
            Support &amp; Docs
          </Link>
        </div>

        {/* Right Controls: Currency & Logout */}
        <div className="flex items-center gap-3">
          
          {/* Currency Switcher */}
          <div className="bg-[#1B1E24] p-1 rounded-lg border border-white/10 flex items-center text-xs font-semibold">
            <button 
              onClick={() => setCurrency('INR')}
              className={`px-2 py-1 rounded transition-all ${currency === 'INR' ? 'bg-[#f09455] text-[#241505] shadow-sm font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              ₹ INR
            </button>
            <button 
              onClick={() => setCurrency('USD')}
              className={`px-2 py-1 rounded transition-all ${currency === 'USD' ? 'bg-[#f09455] text-[#241505] shadow-sm font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              $ USD
            </button>
          </div>

          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="text-xs font-medium text-rose-400 hover:text-rose-300 transition bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Top Crypto Live Ticker Marquee */}
      <div className="w-full bg-[#08090C] border-b border-white/5 py-2 overflow-hidden text-xs font-mono">
        <div className="animate-ticker-marquee flex items-center whitespace-nowrap gap-10 text-slate-400">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-8 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-white">BTC:</span>
                <span className="text-emerald-400 font-semibold num-tabular">${btcPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-bold text-white">ETH:</span>
                <span className="text-blue-400 font-semibold num-tabular">${ethPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">DELTA INDIA</span>
                <span className="text-slate-400">Target Delta: 0.15 - 0.18</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">STATUS</span>
                <span className="text-slate-300">{isPaused ? '⏸ ENTRIES PAUSED' : '▶ LIVE AUTO-EXECUTION'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Header / Global Strategy Action Bar */}
      <div className="bg-[#15171C] border-b border-white/10 px-4 sm:px-8 py-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-white tracking-tight">Institutional Terminal</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${isPaused ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
              {isPaused ? 'Entries Paused' : 'Strategy Active'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">Connected as: {userEmail || 'Loading...'}</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePauseToggle} 
            className={`px-4 py-2 font-bold rounded-xl text-xs font-mono transition flex items-center gap-2 shadow-sm ${isPaused ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'}`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            {isPaused ? 'Resume Strategy Entries' : 'Pause New Entries'}
          </button>
          
          <button 
            onClick={() => {
              setLoading(true);
              fetchData();
            }} 
            className="px-3.5 py-2 font-bold rounded-xl text-xs font-mono bg-[#1B1E24] hover:bg-[#262A33] text-white border border-white/10 transition flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Body Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full flex-1 space-y-8">
        
        {/* KPI Row (Obsidian Glass Box) */}
        <div className="bg-[#15171C] rounded-2xl border border-white/10 shadow-xl p-6 grid grid-cols-2 md:grid-cols-5 gap-6">
          
          <div className="border-r border-white/5 pr-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Delta Wallet Balance</div>
            <div className="text-2xl font-black font-mono text-white mt-1 num-tabular">
              {fmt(metrics.liveBalance)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Live on Delta India</div>
          </div>

          <div className="border-r border-white/5 pr-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Round-Trips</div>
            <div className="text-2xl font-black font-mono text-white mt-1 num-tabular">
              {metrics.roundTrips}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Closed Strategy Cycles</div>
          </div>

          <div className="border-r border-white/5 pr-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Winning Cycles</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1 num-tabular">
              {metrics.winners}
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">Profitable Exits</div>
          </div>

          <div className="border-r border-white/5 pr-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Hit Rate (Win %)</div>
            <div className="text-2xl font-black font-mono text-[#f09455] mt-1 num-tabular">
              {metrics.hitRate}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Historical Win Rate</div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">True Realized Net P&amp;L</div>
            <div className={`text-2xl font-black font-mono mt-1 num-tabular ${metrics.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.totalPnl >= 0 ? '+' : ''}{fmt(metrics.totalPnl)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">After Taker Fees &amp; 18% GST</div>
          </div>

        </div>

        {/* Daily Profitability Heatmap Matrix */}
        <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#f09455]" />
              Cycle Profitability Heatmap (Last 28 Executions)
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Win</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500" /> Loss / Stop</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-700" /> No Data</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {heatmapTrades.map((trade, i) => (
              <div 
                key={i} 
                title={`Cycle ${i + 1}: ${trade.realizedPnl >= 0 ? '+' : ''}${fmt(trade.realizedPnl)} (${trade.close_reason || 'exit'})`}
                className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 cursor-pointer flex items-center justify-center text-[10px] font-mono font-bold ${trade.realizedPnl > 0 ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20' : trade.realizedPnl < 0 ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20' : 'bg-slate-700 text-slate-300'}`}
              >
                {trade.realizedPnl > 0 ? '✓' : '✕'}
              </div>
            ))}
            {heatmapTrades.length === 0 && (
              <div className="text-xs font-mono text-slate-500 py-2">No closed trading cycles yet.</div>
            )}
          </div>
        </div>

        {/* Position View Tabs */}
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2.5 font-bold font-mono rounded-xl text-xs transition flex items-center gap-2 ${activeTab === 'active' ? 'bg-[#f09455] text-[#241505] shadow-lg shadow-brand-500/20 font-black' : 'bg-[#15171C] text-slate-400 hover:text-white border border-white/10'}`}
          >
            Active Positions ({openPositions.length})
          </button>
          
          <button 
            onClick={() => setActiveTab('closed')}
            className={`px-5 py-2.5 font-bold font-mono rounded-xl text-xs transition flex items-center gap-2 ${activeTab === 'closed' ? 'bg-[#f09455] text-[#241505] shadow-lg shadow-brand-500/20 font-black' : 'bg-[#15171C] text-slate-400 hover:text-white border border-white/10'}`}
          >
            Closed Trade History ({closedPositions.length})
          </button>
        </div>

        {/* Position Data Table */}
        <div className="bg-[#15171C] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#f09455] mb-2" />
              Syncing Delta orderbook and position states...
            </div>
          ) : activeTab === 'active' ? (
            
            /* Active Positions Table */
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#121419] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Opened At</th>
                    <th className="px-6 py-4">Instruments (Call / Put)</th>
                    <th className="px-6 py-4">Strategy</th>
                    <th className="px-6 py-4">Size (BTC)</th>
                    <th className="px-6 py-4">Entry Fills</th>
                    <th className="px-6 py-4">Actual Mark P&amp;L</th>
                    <th className="px-6 py-4">Peak P&amp;L</th>
                    <th className="px-6 py-4">Status &amp; Emergency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {openPositions.map(pos => (
                    <tr key={pos.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {pos.opened_at ? new Date(pos.opened_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">{pos.short_call_symbol || 'N/A'}</div>
                        <div className="text-slate-400">{pos.short_put_symbol || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-brand-500/10 text-[#f09455] border border-brand-500/20 text-[10px] font-bold">
                          {pos.status === 'adjusted' ? 'Iron Condor (Wings)' : 'Naked Strangle'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {(pos.lots * 0.001).toFixed(3)} BTC ({pos.lots} Lots)
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div>C: {pos.callEntry}</div>
                        <div>P: {pos.putEntry}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-sm ${pos.actualPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.actualPnl >= 0 ? '+' : ''}{fmt(pos.actualPnl)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-400 font-semibold">
                          +{fmt(pos.peakPnl)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                            {pos.status}
                          </span>
                          {pos.manual_exit_requested ? (
                            <span className="text-rose-400 font-bold text-[10px] animate-pulse">
                              KILL SENT
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleKillSwitch(pos.id)} 
                              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold transition flex items-center gap-1"
                            >
                              <ShieldAlert className="w-3 h-3" /> KILL
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {openPositions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No active options positions currently open. The engine is scanning orderbook deltas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          ) : (

            /* Closed Positions History Table */
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#121419] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Opened / Closed</th>
                    <th className="px-6 py-4">Instruments</th>
                    <th className="px-6 py-4">Size (BTC)</th>
                    <th className="px-6 py-4">Entry Fills</th>
                    <th className="px-6 py-4">Exit Fills</th>
                    <th className="px-6 py-4">Broker Fee + GST</th>
                    <th className="px-6 py-4">Net Realized P&amp;L</th>
                    <th className="px-6 py-4">Exit Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {closedPositions.map(pos => (
                    <tr key={pos.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 text-[10px] whitespace-nowrap">
                        <div className="text-emerald-400">O: {pos.opened_at ? new Date(pos.opened_at).toLocaleDateString() : 'N/A'}</div>
                        <div className="text-slate-400">C: {pos.closed_at ? new Date(pos.closed_at).toLocaleDateString() : 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">{pos.short_call_symbol || 'N/A'}</div>
                        <div className="text-slate-400">{pos.short_put_symbol || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {(pos.lots * 0.001).toFixed(3)} BTC
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div>C: {pos.callEntry}</div>
                        <div>P: {pos.putEntry}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div>C: {pos.callExit}</div>
                        <div>P: {pos.putExit}</div>
                      </td>
                      <td className="px-6 py-4 text-rose-400 font-medium">
                        -{fmt(pos.fees)}
                      </td>
                      <td className="px-6 py-4 font-bold text-sm">
                        <span className={pos.realizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {pos.realizedPnl >= 0 ? "+" : ""}{fmt(pos.realizedPnl)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 text-[10px] uppercase font-bold">
                          {pos.close_reason || 'time_exit'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {closedPositions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No closed positions logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          )}

        </div>

      </div>

    </div>
  );
}

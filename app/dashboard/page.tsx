'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, DollarSign, Target, Hash, PlayCircle, PauseCircle, AlertOctagon } from 'lucide-react';

export default function Dashboard() {
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [closedPositions, setClosedPositions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ roundTrips: 0, winners: 0, hitRate: 0, totalPnl: 0 });
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  async function fetchData() {
    // Fetch system_pause flag
    const { data: pauseData } = await supabase.from('positions').select('id').eq('status', 'system_pause');
    setIsPaused((pauseData || []).length > 0);

    // Fetch open positions
    const { data: openData } = await supabase
      .from('positions')
      .select('*')
      .in('status', ['open', 'adjusted']);
    
    // Fetch closed positions
    const { data: closedData } = await supabase
      .from('positions')
      .select('*')
      .eq('status', 'closed')
      .order('closed_at', { ascending: false });

    // Fetch trade events
    const { data: eventsData } = await supabase
      .from('trade_events')
      .select('*');

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
        putExit
      };
    });

    setOpenPositions(openData || []);
    setClosedPositions(processedClosed);

    // Calc metrics
    const roundTrips = processedClosed.length;
    const winners = processedClosed.filter(p => p.realized_pnl > 0).length;
    const hitRate = roundTrips > 0 ? Math.round((winners / roundTrips) * 100) : 0;
    const totalPnl = processedClosed.reduce((sum, p) => sum + parseFloat(p.realized_pnl || 0), 0);
    
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

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ProfitPilot Dashboard</h1>
            <p className="text-slate-500">Live Trading Data</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Live BTC Price */}
            <div className="hidden md:block text-right">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Live Market (Binance)</div>
              <div className="text-xl font-bold font-mono text-slate-800">
                <LiveBtcPrice />
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-4">
              {isPaused ? (
                <button onClick={handlePauseToggle} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition">
                  <PlayCircle size={18} /> Resume Trading
                </button>
              ) : (
                <button onClick={handlePauseToggle} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition">
                  <PauseCircle size={18} /> Pause Entries
                </button>
              )}
              <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${isPaused ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                {isPaused ? 'Paused (No New Entries)' : 'System Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard icon={<Hash />} label="Round Trips" value={metrics.roundTrips} />
          <MetricCard icon={<Target />} label="Winners" value={metrics.winners} />
          <MetricCard icon={<Activity />} label="Hit Rate" value={`${metrics.hitRate}%`} />
          <MetricCard 
            icon={<DollarSign />} 
            label="Net P&L" 
            value={`$${metrics.totalPnl.toFixed(2)}`} 
            valueClass={metrics.totalPnl >= 0 ? "text-emerald-600" : "text-rose-600"} 
          />
        </div>

        {/* Open Positions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Open Trades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Instrument</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Credit</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {openPositions.map(pos => (
                  <tr key={pos.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      <div>{pos.short_call_symbol}</div>
                      <div>{pos.short_put_symbol}</div>
                    </td>
                    <td className="px-6 py-4">{(pos.lots * 0.001).toFixed(3)} BTC</td>
                    <td className="px-6 py-4 font-medium">${parseFloat(pos.credit_received).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold uppercase">{pos.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pos.manual_exit_requested ? (
                        <span className="text-rose-600 font-semibold text-xs">KILL SIGNAL SENT</span>
                      ) : (
                        <button onClick={() => handleKillSwitch(pos.id)} className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded text-xs font-bold transition ml-auto">
                          <AlertOctagon size={14} /> KILL
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {openPositions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No open trades right now.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closed Positions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Closed Trades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Instrument</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Entry</th>
                  <th className="px-6 py-4">Exit</th>
                  <th className="px-6 py-4">Gross P&L</th>
                  <th className="px-6 py-4">Fees</th>
                  <th className="px-6 py-4">Net P&L</th>
                  <th className="px-6 py-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closedPositions.map(pos => (
                  <tr key={pos.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      <div>{pos.short_call_symbol}</div>
                      <div>{pos.short_put_symbol}</div>
                    </td>
                    <td className="px-6 py-4">{(pos.lots * 0.001).toFixed(3)} BTC</td>
                    <td className="px-6 py-4">
                      <div>{pos.callEntry}</div>
                      <div>{pos.putEntry}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{pos.callExit}</div>
                      <div>{pos.putExit}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <span className={pos.grossPnl >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {pos.grossPnl >= 0 ? "+" : ""}${pos.grossPnl.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-rose-500 font-medium">
                      -${pos.fees.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      <span className={pos.realized_pnl >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {pos.realized_pnl >= 0 ? "+" : ""}${parseFloat(pos.realized_pnl).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {pos.close_reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, valueClass = "text-slate-900" }: { icon: React.ReactNode, label: string, value: string | number, valueClass?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-500">{label}</div>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      </div>
    </div>
  );
}

function LiveBtcPrice() {
  const [price, setPrice] = useState<string>('...');
  const [color, setColor] = useState('text-slate-800');
  
  useEffect(() => {
    let ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newPrice = parseFloat(data.p).toFixed(2);
      setPrice((prev) => {
        if (prev !== '...') {
          setColor(parseFloat(newPrice) > parseFloat(prev) ? 'text-emerald-500' : 'text-rose-500');
          setTimeout(() => setColor('text-slate-800'), 1000);
        }
        return newPrice;
      });
    };
    return () => ws.close();
  }, []);

  return <span className={`transition-colors duration-300 ${color}`}>${price === '...' ? '...' : parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>;
}

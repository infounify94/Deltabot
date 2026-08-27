'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Users, DollarSign, BarChart3, Pause, Play, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    aum: 0,
    totalTrades: 0,
    globalPnl: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    // 1. Fetch Users
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (profiles) {
      setUsers(profiles);
      const activeUsers = profiles.filter(p => p.delta_api_key && p.delta_api_secret).length;
      const aum = profiles.reduce((sum, p) => sum + Number(p.live_balance || 0), 0);
      setStats(prev => ({ ...prev, activeUsers, aum }));
    }

    // 2. Fetch Trade Events for Ticker
    const { data: tradeEvents } = await supabase
      .from('trade_events')
      .select('*, positions(user_id, underlying)')
      .order('created_at', { ascending: false })
      .limit(20);
    if (tradeEvents) setEvents(tradeEvents);

    // 3. Fetch Global Stats
    const { count: tradesCount } = await supabase
      .from('trade_events')
      .select('*', { count: 'exact', head: true });
    
    const { data: positions } = await supabase
      .from('positions')
      .select('realized_pnl')
      .eq('status', 'closed');
    
    if (positions) {
      const globalPnl = positions.reduce((sum, p) => sum + Number(p.realized_pnl || 0), 0);
      setStats(prev => ({ ...prev, totalTrades: tradesCount || 0, globalPnl }));
    }
    
    setLoading(false);
  };

  const handlePauseUser = async (userId: string, currentStatus: boolean) => {
    await supabase.from('profiles').update({ is_paused: !currentStatus }).eq('id', userId);
    fetchData(); // Refresh list
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink)]">God View</h1>
        <p className="text-sm text-[var(--grey)]">Platform-wide statistics and user management.</p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fintech-card p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--grey)]">Bot Health</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-2xl font-bold font-mono">Online</span>
          </div>
        </div>
        
        <div className="fintech-card p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--grey)]">Active Users</span>
            <Users className="w-4 h-4 text-[var(--grey)]" />
          </div>
          <div className="text-2xl font-bold font-mono num-tabular">{stats.activeUsers}</div>
        </div>

        <div className="fintech-card p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--grey)]">AUM (Capital Managed)</span>
            <DollarSign className="w-4 h-4 text-[var(--grey)]" />
          </div>
          <div className="text-2xl font-bold font-mono num-tabular">{formatCurrency(stats.aum)}</div>
        </div>

        <div className="fintech-card p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--grey)]">Global P&amp;L</span>
            <BarChart3 className="w-4 h-4 text-[var(--grey)]" />
          </div>
          <div className={`text-2xl font-bold font-mono num-tabular ${stats.globalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.globalPnl >= 0 ? '+' : ''}{formatCurrency(stats.globalPnl)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Management Table */}
        <div className="lg:col-span-2 fintech-card shadow-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--hair)]">
            <h2 className="font-semibold text-[var(--ink)]">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--paper-2)] text-[var(--grey)] text-xs uppercase border-b border-[var(--hair)]">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Balance</th>
                  <th className="px-5 py-3 font-medium">API Key</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hair)]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[var(--paper-2)] transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/admin/users/${u.id}`} className="font-medium text-[var(--ink)] hover:text-[#d97706] hover:underline">
                        {u.full_name || 'Unnamed'}
                      </Link>
                      <div className="text-xs text-[var(--grey)]">{u.email}</div>
                    </td>
                    <td className="px-5 py-4 font-mono num-tabular">{formatCurrency(u.live_balance)}</td>
                    <td className="px-5 py-4">
                      {u.delta_api_key ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {u.is_paused ? (
                        <span className="inline-flex items-center gap-1.5 text-rose-600 text-xs font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Paused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                          <Activity className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handlePauseUser(u.id, u.is_paused)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                          u.is_paused 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {u.is_paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        {u.is_paused ? 'Resume Trading' : 'Pause Trading'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[var(--grey)] text-sm">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Ticker Feed */}
        <div className="fintech-card shadow-subtle flex flex-col h-[600px]">
          <div className="px-5 py-4 border-b border-[var(--hair)] flex justify-between items-center bg-[var(--paper-2)]">
            <h2 className="font-semibold text-[var(--ink)]">Live Activity Ticker</h2>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {events.map(ev => {
              const date = new Date(ev.created_at);
              const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const userEmail = users.find(u => u.id === ev.positions?.user_id)?.email || 'Unknown';
              const shortEmail = userEmail.split('@')[0];
              
              let msg = '';
              let color = 'text-[var(--grey)]';
              
              if (ev.event_type === 'entry') {
                msg = `entered Strangle on ${ev.positions?.underlying}`;
                color = 'text-blue-600';
              } else if (ev.event_type === 'exit' || ev.event_type === 'profit_take' || ev.event_type === 'stop_loss') {
                const pnl = ev.detail?.realized_pnl || 0;
                msg = `exited trade for ${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`;
                color = pnl >= 0 ? 'text-emerald-600' : 'text-rose-600';
              } else if (ev.event_type === 'error') {
                msg = `Error: ${ev.detail?.reason || 'Unknown'}`;
                color = 'text-rose-600';
              } else {
                msg = `updated position (${ev.event_type})`;
              }

              return (
                <div key={ev.id} className="text-xs bg-[var(--paper-2)] p-3 rounded-lg border border-[var(--hair)] flex flex-col gap-1">
                  <span className="font-mono text-[10px] text-[var(--faint)]">{timeStr}</span>
                  <div className="font-medium text-[var(--ink)]">
                    <span className="font-semibold">{shortEmail}</span> {msg}
                  </div>
                </div>
              );
            })}
            {events.length === 0 && !loading && (
              <div className="text-center text-[var(--grey)] text-sm py-8">No recent activity.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

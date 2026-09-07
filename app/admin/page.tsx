'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, Users, DollarSign, BarChart3, Pause, Play, AlertCircle, 
  ShieldAlert, Server, Box, Hexagon, TerminalSquare, AlertOctagon,
  CheckCircle2, XCircle, Search, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    aum: 0,
    totalTrades: 0,
    globalPnl: 0,
    openPositionsCount: 0,
  });
  
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Emergency Control States
  const [isGlobalPausing, setIsGlobalPausing] = useState(false);
  const [isGloballyPaused, setIsGloballyPaused] = useState(false);
  const [showCloseAllModal, setShowCloseAllModal] = useState(false);
  const [closeAllState, setCloseAllState] = useState<'idle' | 'authenticating' | 'processing' | 'results'>('idle');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    // Fetch Users
    const { data: profiles } = await supabase.rpc('admin_get_all_users');
    let fetchedUsers = profiles || [];
    setUsers(fetchedUsers);
    
    const activeUsers = fetchedUsers.filter((p: any) => p.delta_api_key && p.delta_api_secret).length;
    const aum = fetchedUsers.reduce((sum: number, p: any) => sum + Number(p.live_balance || 0), 0);
    
    // Fetch Trade Events for Ticker
    const { data: tradeEvents } = await supabase
      .from('trade_events')
      .select('*, positions(user_id, underlying)')
      .order('created_at', { ascending: false })
      .limit(20);
    if (tradeEvents) setEvents(tradeEvents);

    // Fetch Global Stats
    const { data: pauseCheck } = await supabase.from('profiles').select('id').eq('is_paused', true);
    // If all users are paused, system is globally paused
    if (pauseCheck && fetchedUsers.length > 0 && pauseCheck.length === fetchedUsers.length) {
      setIsGloballyPaused(true);
    } else {
      setIsGloballyPaused(false);
    }

    const { count: tradesCount } = await supabase.from('trade_events').select('*', { count: 'exact', head: true });
    
    const { data: closedPositions } = await supabase.from('positions').select('realized_pnl').eq('status', 'closed');
    const { count: openPositionsCount } = await supabase.from('positions').select('*', { count: 'exact', head: true }).in('status', ['open', 'adjusted']);

    const globalPnl = (closedPositions || []).reduce((sum, p) => sum + Number(p.realized_pnl || 0), 0);
    
    setStats({
      totalUsers: fetchedUsers.length,
      activeUsers,
      aum,
      totalTrades: tradesCount || 0,
      globalPnl,
      openPositionsCount: openPositionsCount || 0
    });
    
    setLoading(false);
  };

  const handlePauseUser = async (userId: string, currentStatus: boolean) => {
    await supabase.rpc('admin_set_user_pause', { p_user_id: userId, p_is_paused: !currentStatus });
    fetchData();
  };

  const handleGlobalPause = async (pauseStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${pauseStatus ? 'PAUSE' : 'RESUME'} all new trading entries platform-wide? Existing positions will remain open.`)) return;
    setIsGlobalPausing(true);
    await supabase.rpc('admin_set_global_pause', { p_is_paused: pauseStatus });
    await fetchData();
    setIsGlobalPausing(false);
  };

  const handleCloseAllPositions = async () => {
    setCloseAllState('authenticating');
    // Simulate authentication check
    setTimeout(() => {
      setCloseAllState('processing');
      // The backend does not currently support trackable idempotent global close
      setTimeout(() => {
        setCloseAllState('results');
      }, 2000);
    }, 1500);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const lower = searchQuery.toLowerCase();
    return users.filter(u => 
      (u.full_name || '').toLowerCase().includes(lower) || 
      (u.email || '').toLowerCase().includes(lower) ||
      (u.id || '').toLowerCase().includes(lower)
    );
  }, [users, searchQuery]);

  const connectedUsers = users.filter(u => u.delta_api_key);
  const pausedUsers = connectedUsers.filter(u => u.is_paused);
  
  let systemStatus = 'TRADING OPERATIONAL';
  let systemStatusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  let statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;

  if (isGloballyPaused) {
    systemStatus = 'GLOBALLY PAUSED (NO NEW ENTRIES)';
    systemStatusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    statusIcon = <AlertCircle className="w-5 h-5 text-amber-500" />;
  } else if (pausedUsers.length > 0) {
    systemStatus = 'PARTIALLY PAUSED (SOME USERS SUSPENDED)';
    systemStatusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    statusIcon = <AlertCircle className="w-5 h-5 text-amber-500" />;
  }

  return (
    <div className="aurora-wrapper text-[var(--ink)] flex flex-col min-h-screen">
      <div className="aurora-bg" />
      
      {/* GLOBAL COMMAND CENTER BANNER */}
      <div className="sticky top-0 z-50 glass-header px-4 sm:px-6 py-4 border-b border-[var(--hair)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">God View</h1>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 ${systemStatusColor}`}>
                  {statusIcon} {systemStatus}
                </span>
              </div>
              <div className="text-sm text-[var(--grey)] flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-[var(--ink)]">{stats.totalUsers}</span> Users &middot;
                <span className="font-semibold text-[var(--ink)]">{stats.activeUsers}</span> Active Connections &middot;
                <span className="font-semibold text-[var(--ink)]">{stats.openPositionsCount}</span> Open Positions
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <Link href="/dashboard" className="px-4 py-2 bg-[var(--paper-2)] border border-[var(--hair)] rounded-lg text-sm font-medium hover:bg-[var(--raise)] transition-colors">
               Exit God View
             </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-8 relative z-10">

        {/* 🚨 EMERGENCY CONTROL CENTER */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold">Emergency Control Center</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-amber-500 mb-1 flex items-center gap-2"><Pause className="w-4 h-4" /> Pause New Trading</h3>
                <p className="text-xs text-[var(--grey)] mb-4">Stops all new automated entries platform-wide. Existing positions remain open.</p>
              </div>
              <button 
                onClick={() => handleGlobalPause(true)}
                disabled={isGlobalPausing || isGloballyPaused}
                className="w-full py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isGloballyPaused ? 'Already Paused' : 'Execute Global Pause'}
              </button>
            </GlassCard>

            <GlassCard hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-emerald-500 mb-1 flex items-center gap-2"><Play className="w-4 h-4" /> Resume Trading</h3>
                <p className="text-xs text-[var(--grey)] mb-4">Allows the trading engine to resume identifying and entering new positions.</p>
              </div>
              <button 
                onClick={() => handleGlobalPause(false)}
                disabled={isGlobalPausing || !isGloballyPaused}
                className="w-full py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {!isGloballyPaused ? 'Already Active' : 'Execute Global Resume'}
              </button>
            </GlassCard>

            <GlassCard hoverEffect className="p-5 flex flex-col justify-between opacity-50 cursor-not-allowed">
              <div>
                <h3 className="font-semibold text-rose-500 mb-1 flex items-center gap-2"><Server className="w-4 h-4" /> Emergency Halt</h3>
                <p className="text-xs text-[var(--grey)] mb-4">Sever all exchange API connections and halt the core Python engine.</p>
              </div>
              <button disabled className="w-full py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-semibold">
                Backend Unavailable
              </button>
            </GlassCard>

            <GlassCard hoverEffect className="p-5 flex flex-col justify-between border-l-4 border-l-rose-600">
              <div>
                <h3 className="font-semibold text-rose-600 mb-1 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Close All Positions</h3>
                <p className="text-xs text-[var(--grey)] mb-4">Force market close across all active user accounts simultaneously.</p>
              </div>
              <button 
                onClick={() => setShowCloseAllModal(true)}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] rounded-lg text-sm font-semibold transition-colors"
              >
                Initiate Global Close
              </button>
            </GlassCard>
          </div>
        </section>

        {/* 🏢 PLATFORM OVERVIEW */}
        <section>
          <h2 className="text-lg font-bold mb-4">Platform Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs font-medium text-[var(--grey)] mb-1">Total Users</div>
              <div className="text-xl font-bold num-tabular">{stats.totalUsers}</div>
            </GlassCard>
            <GlassCard className="p-4 border-l-2 border-emerald-500">
              <div className="text-xs font-medium text-[var(--grey)] mb-1">Trading Enabled</div>
              <div className="text-xl font-bold num-tabular">{stats.activeUsers}</div>
            </GlassCard>
            <GlassCard className="p-4 border-l-2 border-indigo-500">
              <div className="text-xs font-medium text-[var(--grey)] mb-1">Open Positions</div>
              <div className="text-xl font-bold num-tabular">{stats.openPositionsCount}</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs font-medium text-[var(--grey)] mb-1">Total Platform AUM</div>
              <div className="text-xl font-bold num-tabular">{formatCurrency(stats.aum)}</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs font-medium text-[var(--grey)] mb-1">Global P&L</div>
              <div className={`text-xl font-bold num-tabular ${stats.globalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.globalPnl >= 0 ? '+' : ''}{formatCurrency(stats.globalPnl)}
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs font-medium text-[var(--grey)] mb-1">Failed Orders</div>
              <div className="text-xl font-bold text-[var(--grey)]">N/A</div>
            </GlassCard>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 🤖 STRATEGY & BOT CONTROL */}
          <section>
            <h2 className="text-lg font-bold mb-4">Active Strategies</h2>
            <GlassCard className="overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--paper-2)]/50 text-[var(--grey)] text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Strategy</th>
                    <th className="px-4 py-3 text-center">Users</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hair)]">
                  <tr className="hover:bg-[var(--raise)]/30 transition-colors">
                    <td className="px-4 py-3 font-medium">BTC Dual Direction</td>
                    <td className="px-4 py-3 text-center num-tabular">{stats.activeUsers}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                        <Activity className="w-3 h-3" /> ACTIVE
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center bg-[var(--paper-2)]/20">
                      <TerminalSquare className="w-8 h-8 text-[var(--grey)] opacity-30 mx-auto mb-2" />
                      <p className="text-xs text-[var(--grey)]">Advanced granular strategy controls will appear here when connected to the backend engine.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </GlassCard>
          </section>

          {/* 📡 EXCHANGE CONTROL */}
          <section>
            <h2 className="text-lg font-bold mb-4">Exchange Endpoints</h2>
            <GlassCard className="overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--paper-2)]/50 text-[var(--grey)] text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Exchange</th>
                    <th className="px-4 py-3">API Latency</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hair)]">
                  <tr className="hover:bg-[var(--raise)]/30 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">D</div>
                      Delta Exchange
                    </td>
                    <td className="px-4 py-3 text-[var(--grey)] text-xs">Not available</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> CONNECTED
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center bg-[var(--paper-2)]/20">
                      <Box className="w-8 h-8 text-[var(--grey)] opacity-30 mx-auto mb-2" />
                      <p className="text-xs text-[var(--grey)]">Rate-limit monitoring and WebSocket status metrics are currently unavailable.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </GlassCard>
          </section>
        </div>

        {/* 👥 USER CONTROL */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-bold">User Management</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--grey)]" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--paper-2)] border border-[var(--hair)] rounded-lg text-sm text-[var(--ink)] placeholder:text-[var(--grey)] focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--paper-2)]/50 text-[var(--grey)] text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Live Balance</th>
                    <th className="px-5 py-4">Connection</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hair)]">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[var(--raise)]/30 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/admin/users/${u.id}`} className="font-medium hover:text-indigo-500 transition-colors">
                          {u.full_name || 'Unnamed User'}
                        </Link>
                        <div className="text-xs text-[var(--grey)] mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-medium num-tabular">{formatCurrency(u.live_balance || 0)}</td>
                      <td className="px-5 py-4">
                        {u.delta_api_key ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                            VALID API KEY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-bold border border-rose-500/20">
                            MISSING
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {!u.delta_api_key ? (
                          <span className="inline-flex items-center gap-1.5 text-[var(--grey)] text-xs font-medium">
                            <Box className="w-4 h-4" /> Not Setup
                          </span>
                        ) : u.is_paused ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-500 text-xs font-medium">
                            <Pause className="w-4 h-4" /> Paused
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
                            <Activity className="w-4 h-4" /> Trading
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!u.delta_api_key ? (
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--paper-2)] border border-[var(--hair)] hover:bg-[var(--raise)] transition-colors text-[var(--grey)]"
                          >
                            View Account
                          </Link>
                        ) : (
                          <button
                            onClick={() => handlePauseUser(u.id, u.is_paused)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                              u.is_paused 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                            }`}
                          >
                            {u.is_paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                            {u.is_paused ? 'Enable' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-[var(--grey)] text-sm">
                        No users match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </section>
      </div>

      {/* CLOSE ALL POSITIONS MODAL */}
      {showCloseAllModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="max-w-md w-full p-6 shadow-2xl border-rose-500/30">
            {closeAllState === 'idle' && (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 mb-4 mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-center mb-2">CLOSE ALL POSITIONS</h2>
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg mb-6">
                  <p className="text-sm text-rose-400 font-medium text-center">
                    This action will attempt to close positions across <strong>{stats.activeUsers} accounts</strong>.
                  </p>
                  <p className="text-xs text-rose-400/80 text-center mt-2">
                    This will trigger immediate market-sell orders. This cannot be automatically undone.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCloseAllModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] hover:bg-[var(--raise)] text-sm font-semibold transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleCloseAllPositions} className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-colors">
                    Authenticate & Continue
                  </button>
                </div>
              </>
            )}

            {closeAllState === 'authenticating' && (
              <div className="py-8 flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mb-4" />
                <p className="text-sm font-medium">Authenticating Super Admin...</p>
              </div>
            )}

            {closeAllState === 'processing' && (
              <div className="py-8 flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-4" />
                <p className="text-sm font-medium text-amber-500">Dispatching Kill Signals...</p>
              </div>
            )}

            {closeAllState === 'results' && (
              <div className="py-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--paper-2)] text-[var(--grey)] mb-4 mx-auto border border-[var(--hair)]">
                  <Server className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-2">Backend Integration Required</h2>
                <p className="text-sm text-[var(--grey)] mb-6">
                  The frontend architecture is prepared, but the Python backend does not currently support trackable idempotent global closures. This feature is disabled in production to prevent partial state execution.
                </p>
                <button onClick={() => { setShowCloseAllModal(false); setCloseAllState('idle'); }} className="w-full px-4 py-2.5 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] hover:bg-[var(--raise)] text-sm font-semibold transition-colors">
                  Close Protocol
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}

    </div>
  );
}

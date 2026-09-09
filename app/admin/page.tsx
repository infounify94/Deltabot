'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, Users, DollarSign, BarChart3, Pause, Play, AlertCircle, 
  ShieldAlert, Server, Box, Hexagon, TerminalSquare, AlertOctagon,
  CheckCircle2, XCircle, Search, ShieldCheck, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';

type PlatformState = 'OPERATIONAL' | 'NEW_ENTRIES_PAUSED' | 'EMERGENCY_HALTED' | 'CLOSING_POSITIONS' | 'RECONCILING';

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

  // Authoritative Platform State
  const [platformState, setPlatformState] = useState<PlatformState>('OPERATIONAL');
  const [activeCloseOperation, setActiveCloseOperation] = useState<any>(null);

  // UI Action States
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [showCloseAllModal, setShowCloseAllModal] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll faster for the state machine
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    // 1. Fetch Authoritative Platform State
    const { data: pState } = await supabase.rpc('get_platform_state');
    if (pState) {
      setPlatformState(pState as PlatformState);
    }

    // 2. Fetch Active Close Operations if in Closing state
    if (pState === 'CLOSING_POSITIONS' || pState === 'RECONCILING') {
      const { data: ops } = await supabase
        .from('close_operations')
        .select('*')
        .in('status', ['REQUESTED', 'EXECUTING', 'RECONCILING'])
        .order('requested_at', { ascending: false })
        .limit(1);
      if (ops && ops.length > 0) {
        setActiveCloseOperation(ops[0]);
      } else {
        setActiveCloseOperation(null);
      }
    } else {
      setActiveCloseOperation(null);
    }

    // 3. Fetch Users
    const { data: profiles } = await supabase.rpc('admin_get_all_users_safe');
    let fetchedUsers = profiles || [];
    setUsers(fetchedUsers);
    
    const activeUsers = fetchedUsers.filter((p: any) => p.delta_api_key).length;
    const aum = fetchedUsers.reduce((sum: number, p: any) => sum + Number(p.live_balance || 0), 0);
    
    // 4. Fetch Trade Events for Ticker
    const { data: tradeEvents } = await supabase
      .from('trade_events')
      .select('*, positions(user_id, underlying)')
      .order('created_at', { ascending: false })
      .limit(20);
    if (tradeEvents) setEvents(tradeEvents);

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
    if (!confirm(`Are you sure you want to ${pauseStatus ? 'PAUSE' : 'RESUME'} all new trading entries platform-wide?`)) return;
    setIsProcessingAction(true);
    const { error } = await supabase.rpc('admin_set_global_pause', { p_is_paused: pauseStatus });
    if (error) alert(error.message);
    await fetchData();
    setIsProcessingAction(false);
  };

  const handleEmergencyHalt = async () => {
    if (!confirm(`CRITICAL WARNING: This will immediately HALT the entire platform. New entries will be blocked, and automated workflows may be restricted. Proceed?`)) return;
    setIsProcessingAction(true);
    const { error } = await supabase.rpc('admin_emergency_halt');
    if (error) alert(error.message);
    await fetchData();
    setIsProcessingAction(false);
  };

  const handleForceResume = async () => {
    if (!confirm(`WARNING: You are about to FORCE RESUME the platform to OPERATIONAL. Make sure any emergency has been resolved. Proceed?`)) return;
    setIsProcessingAction(true);
    const { error } = await supabase.rpc('admin_force_resume');
    if (error) alert(error.message);
    await fetchData();
    setIsProcessingAction(false);
  };

  const handleInitiateGlobalClose = async () => {
    setIsProcessingAction(true);
    const { data: opId, error } = await supabase.rpc('admin_close_all_positions');
    setIsProcessingAction(false);
    
    if (error) {
      alert(`Failed: ${error.message}`);
    } else {
      setShowCloseAllModal(false);
      fetchData(); // Immediately refresh to show the monitor
    }
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

  // Status mapping
  let systemStatus = 'TRADING OPERATIONAL';
  let systemStatusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  let statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;

  switch(platformState) {
    case 'NEW_ENTRIES_PAUSED':
      systemStatus = 'GLOBALLY PAUSED (NO NEW ENTRIES)';
      systemStatusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      statusIcon = <AlertCircle className="w-5 h-5 text-amber-500" />;
      break;
    case 'EMERGENCY_HALTED':
      systemStatus = 'EMERGENCY HALTED';
      systemStatusColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      statusIcon = <AlertOctagon className="w-5 h-5 text-rose-500" />;
      break;
    case 'CLOSING_POSITIONS':
    case 'RECONCILING':
      systemStatus = 'GLOBAL CLOSE IN PROGRESS';
      systemStatusColor = 'text-rose-600 bg-rose-600/10 border-rose-600/30 animate-pulse';
      statusIcon = <ShieldAlert className="w-5 h-5 text-rose-600" />;
      break;
  }

  return (
    <div className="admin-panel aurora-wrapper text-[var(--ink)] flex flex-col min-h-screen">
      <style jsx global>{`
        @media (max-width: 767px) {
          .admin-panel .admin-responsive-table,
          .admin-panel .admin-responsive-table tbody { display: block; width: 100%; }
          .admin-panel .admin-responsive-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
          .admin-panel .admin-responsive-table tbody tr { display: block; padding: 12px; }
          .admin-panel .admin-responsive-table td { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 8px; padding: 10px 4px; text-align: left; overflow-wrap: anywhere; }
          .admin-panel .admin-responsive-table td::before { content: attr(data-label); color: var(--grey); font-size: 12px; font-weight: 500; }
          .admin-panel .admin-responsive-table td > * { min-width: 0; }
          .admin-panel .admin-responsive-table td > div:not(:first-child) { grid-column: 2; }
          .admin-panel .admin-responsive-table td[colspan] { display: block; }
          .admin-panel .admin-responsive-table td[colspan]::before { display: none; }
        }
      `}</style>
      <div className="aurora-bg" />
      
      {/* GLOBAL COMMAND CENTER BANNER */}
      <div className="sticky top-0 z-50 glass-header px-4 sm:px-6 py-4 border-b border-[var(--hair)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">God View</h1>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 ${systemStatusColor}`}>
                  {statusIcon} {systemStatus}
                </span>
              </div>
              <div className="text-sm text-[var(--grey)] flex flex-wrap items-center gap-x-2 mt-0.5">
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

        {/* ACTIVE CLOSE OPERATION MONITOR */}
        {(platformState === 'CLOSING_POSITIONS' || platformState === 'RECONCILING') && activeCloseOperation && (
          <section>
            <GlassCard className="p-6 border-rose-500/50 shadow-[0_0_30px_rgba(225,29,72,0.15)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/20">
                <div 
                  className="h-full bg-rose-500 transition-all duration-1000" 
                  style={{ width: `${Math.max(5, 100 - (activeCloseOperation.pending / activeCloseOperation.targeted_positions * 100))}%` }}
                />
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse">
                    <RefreshCw className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-rose-500">Operation Monitor: {activeCloseOperation.human_id}</h2>
                    <p className="text-sm text-[var(--grey)]">Status: <strong className="text-[var(--ink)]">{activeCloseOperation.status}</strong></p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-xs text-[var(--grey)] mb-1">Targeted</div>
                    <div className="text-2xl font-bold">{activeCloseOperation.targeted_positions}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[var(--grey)] mb-1">Remaining</div>
                    <div className="text-2xl font-bold text-rose-500">{activeCloseOperation.pending}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[var(--grey)] mb-1">Failed</div>
                    <div className="text-2xl font-bold text-amber-500">{activeCloseOperation.failed}</div>
                  </div>
                </div>

                <button 
                  onClick={handleForceResume}
                  disabled={isProcessingAction}
                  className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold shadow-lg transition-colors disabled:opacity-50"
                >
                  Force Abort & Resume
                </button>
              </div>
            </GlassCard>
          </section>
        )}

        {/* dYs" EMERGENCY CONTROL CENTER */}
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
                disabled={isProcessingAction || platformState !== 'OPERATIONAL'}
                className="w-full py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {platformState === 'NEW_ENTRIES_PAUSED' ? 'Currently Paused' : 'Execute Global Pause'}
              </button>
            </GlassCard>

            <GlassCard hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-emerald-500 mb-1 flex items-center gap-2"><Play className="w-4 h-4" /> Resume Trading</h3>
                <p className="text-xs text-[var(--grey)] mb-4">Allows the trading engine to resume identifying and entering new positions.</p>
              </div>
              <button 
                onClick={() => handleGlobalPause(false)}
                disabled={isProcessingAction || platformState !== 'NEW_ENTRIES_PAUSED'}
                className="w-full py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {platformState === 'OPERATIONAL' ? 'Already Active' : 'Execute Global Resume'}
              </button>
            </GlassCard>

            <GlassCard hoverEffect className="p-5 flex flex-col justify-between border-l-4 border-l-rose-500">
              <div>
                <h3 className="font-semibold text-rose-500 mb-1 flex items-center gap-2"><Server className="w-4 h-4" /> Emergency Halt</h3>
                <p className="text-xs text-[var(--grey)] mb-4">Severely restrict trading engine. Prevents entries even upon worker restart.</p>
              </div>
              {platformState === 'EMERGENCY_HALTED' ? (
                <button 
                  onClick={handleForceResume}
                  disabled={isProcessingAction}
                  className="w-full py-2 bg-rose-500 text-white shadow-lg rounded-lg text-sm font-semibold"
                >
                  Authorized Resume
                </button>
              ) : (
                <button 
                  onClick={handleEmergencyHalt}
                  disabled={isProcessingAction || platformState === 'CLOSING_POSITIONS'}
                  className="w-full py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Initiate Global Halt
                </button>
              )}
            </GlassCard>

            <GlassCard hoverEffect className="p-5 flex flex-col justify-between border-l-4 border-l-rose-600">
              <div>
                <h3 className="font-semibold text-rose-600 mb-1 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Close All Positions</h3>
                <p className="text-xs text-[var(--grey)] mb-4">Force market close across all active user accounts simultaneously.</p>
              </div>
              <button 
                onClick={() => setShowCloseAllModal(true)}
                disabled={isProcessingAction || platformState === 'CLOSING_POSITIONS' || platformState === 'RECONCILING'}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {platformState === 'CLOSING_POSITIONS' ? 'Active Operation...' : 'Initiate Global Close'}
              </button>
            </GlassCard>
          </div>
        </section>

        {/* dY? PLATFORM OVERVIEW */}
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
          {/* dY - STRATEGY & BOT CONTROL */}
          <section>
            <h2 className="text-lg font-bold mb-4">Active Strategies</h2>
            <GlassCard className="overflow-hidden">
              <table className="admin-responsive-table w-full text-sm text-left">
                <thead className="bg-[var(--paper-2)]/50 text-[var(--grey)] text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Strategy</th>
                    <th className="px-4 py-3 text-center">Users</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hair)]">
                  <tr className="hover:bg-[var(--raise)]/30 transition-colors">
                    <td data-label="Strategy" className="px-4 py-3 font-medium">BTC Dual Direction</td>
                    <td data-label="Users" className="px-4 py-3 text-center num-tabular">{stats.activeUsers}</td>
                    <td data-label="Status" className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                        <Activity className="w-3 h-3" /> ACTIVE
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </GlassCard>
          </section>

          {/* dY4 EXCHANGE CONNECTIONS */}
          <section>
            <h2 className="text-lg font-bold mb-4">Exchange Endpoints</h2>
            <GlassCard className="overflow-hidden">
              <table className="admin-responsive-table w-full text-sm text-left">
                <thead className="bg-[var(--paper-2)]/50 text-[var(--grey)] text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Exchange</th>
                    <th className="px-4 py-3">API Latency</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hair)]">
                  <tr className="hover:bg-[var(--raise)]/30 transition-colors">
                    <td data-label="Exchange" className="px-4 py-3 font-medium flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">D</div>
                      Delta Exchange
                    </td>
                    <td data-label="API Latency" className="px-4 py-3 text-[var(--grey)] text-xs">Not available</td>
                    <td data-label="Status" className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> CONNECTED
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </GlassCard>
          </section>
        </div>

        {/* dY` USER CONTROL */}
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
              <table className="admin-responsive-table w-full text-sm text-left">
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
                      <td data-label="User" className="px-5 py-4">
                        <Link href={`/admin/users/${u.id}`} className="font-medium hover:text-indigo-500 transition-colors">
                          {u.full_name || 'Unnamed User'}
                        </Link>
                        <div className="text-xs text-[var(--grey)] mt-0.5">{u.email}</div>
                      </td>
                      <td data-label="Live Balance" className="px-5 py-4 font-mono font-medium num-tabular">{formatCurrency(u.live_balance || 0)}</td>
                      <td data-label="Connection" className="px-5 py-4">
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
                      <td data-label="Status" className="px-5 py-4">
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
                      <td data-label="Admin Actions" className="px-5 py-4 text-right">
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
                      <td data-label="User" colSpan={5} className="px-5 py-8 text-center text-[var(--grey)] text-sm">
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
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 mb-4 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">CLOSE ALL POSITIONS</h2>
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg mb-6">
              <p className="text-sm text-rose-400 font-medium text-center">
                This action will invoke the authoritative Global Close Protocol across <strong>{stats.activeUsers} accounts</strong>.
              </p>
              <p className="text-xs text-rose-400/80 text-center mt-2">
                This will lock the platform state to CLOSING_POSITIONS and direct the Python execution layer to market-close all active trades.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCloseAllModal(false)} 
                disabled={isProcessingAction}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] hover:bg-[var(--raise)] text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleInitiateGlobalClose} 
                disabled={isProcessingAction}
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {isProcessingAction ? 'Authenticating...' : 'Execute Protocol'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}

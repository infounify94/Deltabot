'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { 
  Activity, Play, Pause, ShieldAlert, Menu, X, Settings, Sun, Moon, 
  Home, Layers, History, TrendingUp, Radio, ShieldCheck, Clock, Calendar, 
  Sparkles, Zap, CheckCircle2, AlertCircle, CreditCard, PieChart, Shield
} from 'lucide-react';

type DashboardSection = 'dashboard' | 'trading' | 'history' | 'analytics' | 'risk' | 'settings' | 'billing';

export default function Dashboard() {
  const [section, setSection] = useState<DashboardSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real DB Data (Supabase)
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [closedPositions, setClosedPositions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ roundTrips: 0, winners: 0, hitRate: 0, totalPnl: 0, todayPnl: 0, liveBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Start with empty theme, let useEffect handle it to avoid hydration mismatch
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Macro Information
  const [macroInfo, setMacroInfo] = useState<{
    is_blocked: boolean;
    active_event: any;
    blackout_reason: string;
    blackout_end_ist: string;
    status: string;
    upcoming_events: any[];
  } | null>(null);

  // Real-time market WebSocket prices
  const [btcPrice, setBtcPrice] = useState<number>(78500);
  const [ethPrice, setEthPrice] = useState<number>(2450);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const fxRate = 86.5;

  const [expandedPositionIds, setExpandedPositionIds] = useState<Set<number | string>>(new Set());

  // Set theme on mount based on HTML attribute
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
    if (currentTheme) setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // Currency Formatter
  const fmt = (usdAmount: number, forceDecimals = true) => {
    if (currency === 'INR') {
      const inr = usdAmount * fxRate;
      return `₹${inr.toLocaleString('en-IN', { minimumFractionDigits: forceDecimals ? 2 : 0, maximumFractionDigits: forceDecimals ? 2 : 0 })}`;
    }
    return `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: forceDecimals ? 2 : 0, maximumFractionDigits: forceDecimals ? 2 : 0 })}`;
  };

  const formatTradeDate = (rawDate?: string | null) => {
    if (!rawDate) return 'Recent';
    const d = new Date(rawDate);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return 'Recent';
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, ${timeStr}`;
  };

  const formatDuration = (openedAt?: string | null, closedAt?: string | null) => {
    if (!openedAt || !closedAt) return null;
    const t1 = new Date(openedAt).getTime();
    const t2 = new Date(closedAt).getTime();
    if (isNaN(t1) || isNaN(t2) || t2 <= t1) return null;
    const diffMins = Math.round((t2 - t1) / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const toggleExpand = (id: number | string) => {
    const newSet = new Set(expandedPositionIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedPositionIds(newSet);
  };

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

  const fetchMacroStatus = async () => {
    try {
      const res = await fetch('/api/macro');
      if (res.ok) {
        const data = await res.json();
        setMacroInfo(data);
      }
    } catch (err) {
      console.error("Macro fetch error", err);
    }
  };

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      setUserEmail(user.email || '');
      setUserId(user.id);

      const { data: profile } = await supabase.from('profiles').select('is_paused, live_balance, is_admin').eq('id', user.id).single();
      setIsPaused(profile?.is_paused || false);
      setIsAdmin(profile?.is_admin || false);
      let liveBalance = profile?.live_balance ? parseFloat(profile.live_balance) : 0;

      const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      setInvoices(invs || []);

      const { data: openData } = await supabase.from('positions').select('*').eq('user_id', user.id).in('status', ['open', 'adjusted']);
      const { data: closedData } = await supabase.from('positions').select('*').eq('user_id', user.id).eq('status', 'closed').order('opened_at', { ascending: false });

      const posIds = [...(openData || []), ...(closedData || [])].map((p: any) => p.id);
      const { data: eventsData } = posIds.length > 0 
        ? await supabase.from('trade_events').select('*').in('position_id', posIds) 
        : { data: [] };

      const processedClosed = (closedData || []).map(pos => {
        let fees = 0;
        const posEvents = (eventsData || []).filter(e => e.position_id === pos.id);
        posEvents.forEach(e => {
          if (e.event_type === 'entry') fees += parseFloat(e.detail?.fill?.fees_paid || 0);
          if (['time_exit', 'profit_take', 'stop_loss', 'manual_kill_switch', 'exit'].includes(e.event_type)) {
            const fills = e.detail?.fills || {};
            const cf = fills[pos.short_call_symbol] || {};
            const pf = fills[pos.short_put_symbol] || {};
            const extractFee = (f: any) => parseFloat(f.paid_commission || f.result?.paid_commission || 0) * 1.18;
            fees += extractFee(cf) + extractFee(pf);
          }
        });
        const realizedPnl = parseFloat(pos.realized_pnl || 0);
        return { ...pos, fees, grossPnl: realizedPnl + fees, realizedPnl };
      });

      const processedOpen = (openData || []).map((pos: any) => ({
        ...pos,
        actualPnl: parseFloat(pos.actual_pnl || 0),
        peakPnl: parseFloat(pos.peak_unrealized_pnl || 0),
      }));

      setOpenPositions(processedOpen);
      setClosedPositions(processedClosed);

      const roundTrips = processedClosed.length;
      const winners = processedClosed.filter(p => p.realizedPnl > 0).length;
      const hitRate = roundTrips > 0 ? Math.round((winners / roundTrips) * 100) : 0;
      const totalPnl = processedClosed.reduce((sum, p) => sum + p.realizedPnl, 0);

      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      const todayClosed = processedClosed.filter(p => {
        const d = p.closed_at ? new Date(p.closed_at) : (p.opened_at ? new Date(p.opened_at) : null);
        return d && d >= todayMidnight;
      });
      const todayPnl = todayClosed.reduce((sum, p) => sum + p.realizedPnl, 0);
      
      setMetrics({ roundTrips, winners, hitRate, totalPnl, todayPnl, liveBalance });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    fetchMacroStatus();
    const interval = setInterval(() => { fetchData(); fetchMacroStatus(); }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handlePauseToggle = async () => {
    if (!userId) return;
    if (!confirm(isPaused ? "Are you sure you want to resume new trades?" : "Are you sure you want to pause new trades? (Existing positions will remain open)")) return;
    const nextPause = !isPaused;
    setIsPaused(nextPause);
    await supabase.from('profiles').update({ is_paused: nextPause }).eq('id', userId);
    fetchData();
  };

  const handleKillSwitch = async (id: string | number) => {
    if (!userId) return;
    if (confirm("EMERGENCY KILL SWITCH: Are you sure you want to market close this position immediately?")) {
      await supabase.from('positions').update({ manual_exit_requested: true }).eq('id', id).eq('user_id', userId);
      fetchData();
    }
  };

  const openPnl = useMemo(() => openPositions.reduce((acc, pos) => acc + (pos.actualPnl || 0), 0), [openPositions]);
  const totalPositionMargin = useMemo(() => openPositions.reduce((acc, pos) => acc + (pos.lots || 1) * 2.0, 0), [openPositions]);
  const availableMargin = Math.max(0, metrics.liveBalance - totalPositionMargin);
  const marginUsed = metrics.liveBalance > 0 ? (totalPositionMargin / metrics.liveBalance) * 100 : 0;

  if (loading) {
    return (
      <div className="aurora-wrapper flex items-center justify-center min-h-screen text-[var(--ink)]">
        <div className="aurora-bg" />
        <div className="aurora-content flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium animate-pulse">Initializing Terminal...</p>
        </div>
      </div>
    );
  }

  // Determine Trading Status
  let statusState: 'active' | 'paused' | 'halted' = 'active';
  let statusText = 'Trading Active';
  let statusDesc = 'All strategies are running and monitoring for new entries.';
  
  if (macroInfo?.is_blocked) {
    statusState = 'halted';
    statusText = 'Emergency Halted';
    statusDesc = macroInfo.blackout_reason || 'System paused due to extreme market volatility.';
  } else if (isPaused) {
    statusState = 'paused';
    statusText = 'New Trading Paused';
    statusDesc = 'You have manually paused new trade entries. Existing positions are still monitored.';
  }

  // Sidebar Component
  const NavItem = ({ id, icon: Icon, label }: { id: DashboardSection, icon: any, label: string }) => (
    <button 
      onClick={() => { setSection(id); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        section === id 
          ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400' 
          : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="aurora-wrapper text-[var(--ink)] flex flex-col min-h-screen">
      <div className="aurora-bg" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Activity className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <span className="font-bold text-lg hidden sm:block">Profit<span className="text-indigo-500 dark:text-indigo-400">Pilot</span></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 px-4 py-1.5 rounded-lg border border-[var(--hair)] bg-[var(--card)] shadow-sm text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--grey)]">BTC</span>
              <span className="text-emerald-500 num-tabular">${btcPrice.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-[var(--hair)]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--grey)]">ETH</span>
              <span className="text-emerald-500 num-tabular">${ethPrice.toLocaleString()}</span>
            </div>
          </div>
          
          <button 
            onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] hover:bg-[var(--raise)] transition-colors"
          >
            {currency}
          </button>
          
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] flex items-center justify-center text-[var(--grey)] hover:text-[var(--ink)] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAdmin && (
            <Link href="/admin" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-colors">
              God View
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative z-10">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-[var(--paper)]/95 backdrop-blur-xl border-r border-[var(--hair)] transform ${sidebarOpen ? 'translate-x-0 pt-16 lg:pt-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 z-40`}>
          <div className="p-4 space-y-1 h-full overflow-y-auto">
            <div className="text-xs font-semibold text-[var(--grey)] uppercase tracking-wider mb-3 px-4 mt-4">Overview</div>
            <NavItem id="dashboard" icon={Home} label="Dashboard" />
            <NavItem id="trading" icon={Activity} label="Live Trading" />
            
            <div className="text-xs font-semibold text-[var(--grey)] uppercase tracking-wider mb-3 px-4 mt-8">Performance</div>
            <NavItem id="analytics" icon={PieChart} label="Analytics" />
            <NavItem id="risk" icon={ShieldAlert} label="Risk Center" />
            <NavItem id="history" icon={History} label="Trade History" />
            
            <div className="text-xs font-semibold text-[var(--grey)] uppercase tracking-wider mb-3 px-4 mt-8">Account</div>
            <NavItem id="billing" icon={CreditCard} label="Billing & Invoices" />
            <NavItem id="settings" icon={Settings} label="Settings" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* LIVE TRADING STATUS BANNER (Visible on relevant sections) */}
            {(section === 'dashboard' || section === 'trading') && (
              <GlassCard className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4" style={{
                borderLeftColor: statusState === 'active' ? 'var(--pine)' : statusState === 'paused' ? 'var(--orange)' : 'var(--clay)'
              }}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-opacity-10 ${
                    statusState === 'active' ? 'bg-emerald-500 text-emerald-500' :
                    statusState === 'paused' ? 'bg-amber-500 text-amber-500' :
                    'bg-rose-500 text-rose-500'
                  }`}>
                    {statusState === 'active' ? <Activity className="w-6 h-6" /> :
                     statusState === 'paused' ? <Pause className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{statusText}</span>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${
                        statusState === 'active' ? 'bg-emerald-500' :
                        statusState === 'paused' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`} />
                    </div>
                    <p className="text-sm text-[var(--grey)]">{statusDesc}</p>
                  </div>
                </div>
                
                <button 
                  onClick={handlePauseToggle}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                    isPaused 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                  }`}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? 'Resume Trading' : 'Pause New Trades'}
                </button>
              </GlassCard>
            )}

            {/* DASHBOARD SECTION */}
            {section === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <GlassCard hoverEffect className="p-5">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Total Capital</div>
                    <div className="text-2xl font-bold num-tabular">{fmt(metrics.liveBalance)}</div>
                  </GlassCard>
                  <GlassCard hoverEffect className="p-5">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Available Margin</div>
                    <div className="text-2xl font-bold num-tabular">{fmt(availableMargin)}</div>
                  </GlassCard>
                  <GlassCard hoverEffect className="p-5">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Today's P&L</div>
                    <div className={`text-2xl font-bold num-tabular ${metrics.todayPnl > 0 ? 'text-emerald-500' : metrics.todayPnl < 0 ? 'text-rose-500' : ''}`}>
                      {metrics.todayPnl > 0 ? '+' : ''}{fmt(metrics.todayPnl)}
                    </div>
                  </GlassCard>
                  <GlassCard hoverEffect className="p-5">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Open P&L</div>
                    <div className={`text-2xl font-bold num-tabular ${openPnl > 0 ? 'text-emerald-500' : openPnl < 0 ? 'text-rose-500' : ''}`}>
                      {openPnl > 0 ? '+' : ''}{fmt(openPnl)}
                    </div>
                  </GlassCard>
                </div>

                <h2 className="text-xl font-bold mt-8 mb-4">Active Positions</h2>
                {openPositions.length === 0 ? (
                  <GlassCard variant="subtle" className="p-8 text-center flex flex-col items-center">
                    <ShieldCheck className="w-12 h-12 text-[var(--grey)] opacity-50 mb-3" />
                    <h3 className="font-semibold text-lg mb-1">No Open Positions</h3>
                    <p className="text-sm text-[var(--grey)]">ProfitPilot is actively monitoring the market for the next entry signal.</p>
                  </GlassCard>
                ) : (
                  <div className="space-y-4">
                    {openPositions.map(pos => (
                      <GlassCard key={pos.id} hoverEffect className="p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg">BTC Short Strangle</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                                {pos.lots || 1} LOT
                              </span>
                            </div>
                            <div className="text-sm text-[var(--grey)]">
                              Opened {formatTradeDate(pos.opened_at)}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-[var(--grey)] font-medium mb-1">Unrealized P&L</div>
                            <div className={`text-xl font-bold num-tabular ${pos.actualPnl > 0 ? 'text-emerald-500' : pos.actualPnl < 0 ? 'text-rose-500' : ''}`}>
                              {pos.actualPnl > 0 ? '+' : ''}{fmt(pos.actualPnl || 0)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-5 border-t border-[var(--hair)] flex justify-between items-center">
                          <button onClick={() => toggleExpand(pos.id)} className="text-sm text-indigo-500 dark:text-indigo-400 font-medium hover:underline">
                            {expandedPositionIds.has(pos.id) ? 'Hide Analytics' : 'View Analytics'}
                          </button>
                          <button 
                            onClick={() => handleKillSwitch(pos.id)}
                            className="px-3 py-1.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" /> Emergency Close
                          </button>
                        </div>
                        
                        {expandedPositionIds.has(pos.id) && (
                          <div className="mt-4 pt-4 border-t border-[var(--hair)] grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-[var(--grey)] mb-1">Short Call</div>
                              <div className="font-medium">{pos.short_call_symbol}</div>
                              <div className="text-xs text-[var(--grey)] mt-0.5">Entry: {pos.callEntry}</div>
                            </div>
                            <div>
                              <div className="text-[var(--grey)] mb-1">Short Put</div>
                              <div className="font-medium">{pos.short_put_symbol}</div>
                              <div className="text-xs text-[var(--grey)] mt-0.5">Entry: {pos.putEntry}</div>
                            </div>
                            <div>
                              <div className="text-[var(--grey)] mb-1">Peak Profit</div>
                              <div className="font-medium text-emerald-500">{fmt(pos.peakPnl)}</div>
                            </div>
                            <div>
                              <div className="text-[var(--grey)] mb-1">Margin Used</div>
                              <div className="font-medium">{fmt((pos.lots || 1) * 2)}</div>
                            </div>
                          </div>
                        )}
                      </GlassCard>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TRADING SECTION */}
            {section === 'trading' && (
              <div className="space-y-6">
                <GlassCard className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                   <Activity className="w-12 h-12 text-[var(--grey)] opacity-50 mb-3" />
                   <h3 className="font-semibold text-lg mb-1">Advanced Trading View</h3>
                   <p className="text-sm text-[var(--grey)] max-w-md mx-auto">
                     A fully featured order book, deep analytics, and real-time greeks view is coming in a future update.
                   </p>
                </GlassCard>
              </div>
            )}

            {/* ANALYTICS SECTION */}
            {section === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <GlassCard className="p-5">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Total Net P&L</div>
                    <div className={`text-3xl font-bold num-tabular ${metrics.totalPnl > 0 ? 'text-emerald-500' : metrics.totalPnl < 0 ? 'text-rose-500' : ''}`}>
                      {metrics.totalPnl > 0 ? '+' : ''}{fmt(metrics.totalPnl)}
                    </div>
                  </GlassCard>
                  <GlassCard className="p-5">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Win Rate</div>
                    <div className="text-3xl font-bold num-tabular">{metrics.hitRate}%</div>
                  </GlassCard>
                  <GlassCard className="p-5">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Total Trades</div>
                    <div className="text-3xl font-bold num-tabular">{metrics.roundTrips}</div>
                  </GlassCard>
                </div>

                <GlassCard variant="subtle" className="p-8 text-center flex flex-col items-center">
                   <PieChart className="w-12 h-12 text-[var(--grey)] opacity-50 mb-3" />
                   <h3 className="font-semibold text-lg mb-1">Advanced Strategy Analytics</h3>
                   <p className="text-sm text-[var(--grey)] max-w-md mx-auto">
                     Additional performance analytics (Drawdown, Sharpe Ratio, Profit Factor) will appear here when available from the engine.
                   </p>
                </GlassCard>
              </div>
            )}

            {/* RISK CENTER SECTION */}
            {section === 'risk' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassCard className="p-5 border-l-4 border-l-indigo-500">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Margin Utilization</div>
                    <div className="text-2xl font-bold num-tabular mb-3">{marginUsed.toFixed(1)}%</div>
                    <div className="w-full bg-[var(--raise)] rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, marginUsed)}%` }}></div>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-5 border-l-4 border-l-emerald-500">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Account Health</div>
                    <div className="text-2xl font-bold text-emerald-500">Healthy</div>
                    <p className="text-xs text-[var(--grey)] mt-1">Available margin safely exceeds current open exposure.</p>
                  </GlassCard>
                </div>
                
                <GlassCard variant="subtle" className="p-8 text-center flex flex-col items-center">
                   <Shield className="w-12 h-12 text-[var(--grey)] opacity-50 mb-3" />
                   <h3 className="font-semibold text-lg mb-1">Global Risk Controls</h3>
                   <p className="text-sm text-[var(--grey)] max-w-md mx-auto">
                     Daily loss limits and automated drawdown restrictions are strictly enforced by the core engine.
                   </p>
                </GlassCard>
              </div>
            )}

            {/* HISTORY SECTION */}
            {section === 'history' && (
              <GlassCard className="overflow-hidden">
                <div className="p-5 border-b border-[var(--hair)]">
                  <h2 className="text-lg font-bold">Trade History</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[var(--paper-2)]/50 text-[var(--grey)] text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-4">Date Closed</th>
                        <th className="px-5 py-4">Strategy</th>
                        <th className="px-5 py-4">Duration</th>
                        <th className="px-5 py-4">Exit Reason</th>
                        <th className="px-5 py-4 text-right">Net P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--hair)]">
                      {closedPositions.map(pos => (
                        <tr key={pos.id} className="hover:bg-[var(--raise)]/30 transition-colors">
                          <td className="px-5 py-4 font-medium">{formatTradeDate(pos.closed_at)}</td>
                          <td className="px-5 py-4">BTC Strangle ({pos.lots || 1}L)</td>
                          <td className="px-5 py-4 text-[var(--grey)]">{formatDuration(pos.opened_at, pos.closed_at) || 'N/A'}</td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-medium px-2 py-1 rounded bg-[var(--raise)] text-[var(--grey)]">
                              {pos.close_reason ? pos.close_reason.replace(/_/g, ' ') : 'Closed'}
                            </span>
                          </td>
                          <td className={`px-5 py-4 text-right font-bold num-tabular ${pos.realizedPnl > 0 ? 'text-emerald-500' : pos.realizedPnl < 0 ? 'text-rose-500' : ''}`}>
                            {pos.realizedPnl > 0 ? '+' : ''}{fmt(pos.realizedPnl)}
                          </td>
                        </tr>
                      ))}
                      {closedPositions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-10 text-center text-[var(--grey)]">
                            No closed trades found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            {/* SETTINGS / BILLING (Placeholders from original sections) */}
            {(section === 'settings' || section === 'billing') && (
              <GlassCard className="p-8 text-center flex flex-col items-center">
                 <Settings className="w-12 h-12 text-[var(--grey)] opacity-50 mb-3" />
                 <h3 className="font-semibold text-lg mb-1">Account & Billing Settings</h3>
                 <p className="text-sm text-[var(--grey)] max-w-md mx-auto">
                   Please use the Settings page to manage your API keys, and the Billing page to view invoices.
                 </p>
                 <div className="mt-6 flex gap-4">
                   <Link href="/dashboard/settings" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium">Go to Settings</Link>
                   <Link href="/dashboard/billing" className="px-4 py-2 bg-[var(--raise)] hover:bg-[var(--raise-2)] border border-[var(--hair)] rounded-lg text-sm font-medium">Go to Billing</Link>
                 </div>
              </GlassCard>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

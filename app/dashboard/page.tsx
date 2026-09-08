'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { formatAccountCurrency, INR_RATE_LABEL } from '@/lib/currency';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LogoutButton } from '@/components/ui/logout-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BillingList } from '@/components/ui/billing-list';
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
  const drawerRef = useRef<HTMLElement>(null);

  // Real DB Data (Supabase)
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [closedPositions, setClosedPositions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [accountMargin, setAccountMargin] = useState({ available: NaN, utilization: NaN });
  const [metrics, setMetrics] = useState({ roundTrips: 0, winners: 0, hitRate: 0, totalPnl: 0, todayPnl: 0, liveBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

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
  const [btcPrice, setBtcPrice] = useState<number>(NaN);
  const [ethPrice, setEthPrice] = useState<number>(NaN);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('USD');

  const [expandedPositionIds, setExpandedPositionIds] = useState<Set<number | string>>(new Set());

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;
    const focusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>('button, a[href]') || []).filter(el => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
      if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const wide = window.matchMedia('(min-width: 1024px)');
    const resize = () => { if (wide.matches) setSidebarOpen(false); };
    wide.addEventListener('change', resize);
    document.addEventListener('keydown', close);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', close);
      wide.removeEventListener('change', resize);
      document.body.style.overflow = previous;
      previousFocus?.focus();
    };
  }, [sidebarOpen]);

  const fmt = (amount: number, decimals = true) => formatAccountCurrency(amount, currency, decimals);

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

      const { data: profile, error: profileError } = await supabase.from('profiles').select('is_paused, live_balance, is_admin, available_balance, margin_utilization, balance_observed_at').eq('id', user.id).single();
      if (profileError || !profile) throw new Error("Account data unavailable");
      setIsPaused(profile.is_paused);
      setIsAdmin(profile?.is_admin || false);
      const balanceFresh = profile.balance_observed_at && Date.now() - Date.parse(profile.balance_observed_at) < 60000;
      let liveBalance = balanceFresh && profile.live_balance != null ? Number(profile.live_balance) : NaN;

      const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      setInvoices(invs || []);

      const { data: openData, error: openError } = await supabase.from('positions').select('*').eq('user_id', user.id).in('status', ['open', 'adjusted', 'closing', 'close_failed', 'execution_anomaly', 'reconciliation_required']);
      const { data: closedData, error: closedError } = await supabase.from('positions').select('*').eq('user_id', user.id).in('status', ['closed', 'closed_unreconciled']).order('opened_at', { ascending: false });

      if (openError || closedError) throw new Error("Position data unavailable");
      const posIds = [...(openData || []), ...(closedData || [])].map((p: any) => p.id);
      const { data: eventsData } = posIds.length > 0
        ? await supabase.from('trade_events').select('*').in('position_id', posIds)
        : { data: [] };

      const processedClosed = (closedData || []).map(pos => {
        let fees = 0;
        const posEvents = (eventsData || []).filter(e => e.position_id === pos.id);
        posEvents.forEach(e => {
          if (e.event_type === 'entry') fees += parseFloat(e.detail?.fees_paid ?? e.detail?.fill?.fees_paid ?? 0);
          if (['time_exit', 'profit_take', 'stop_loss', 'manual_kill_switch', 'exit'].includes(e.event_type)) {
            const reports = e.detail?.execution?.legs;
            if (reports) { fees += Object.values(reports).reduce((sum: number, r: any) => sum + Number(r.fees || 0), 0); return; }
            const fills = e.detail?.fills || {};
            const cf = fills[pos.short_call_symbol] || {};
            const pf = fills[pos.short_put_symbol] || {};
            const extractFee = (f: any) => parseFloat(f.paid_commission || f.result?.paid_commission || 0);
            fees += extractFee(cf) + extractFee(pf);
          }
        });
        const realizedPnl = pos.realized_pnl == null ? NaN : Number(pos.realized_pnl);
        return { ...pos, fees, grossPnl: realizedPnl + fees, realizedPnl };
      });

      const processedOpen = (openData || []).map((pos: any) => ({
        ...pos,
        actualPnl: pos.pnl_observed_at && Date.now() - Date.parse(pos.pnl_observed_at) < 60000 && pos.actual_pnl != null ? Number(pos.actual_pnl) : NaN,
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
      setAccountMargin({ available: !balanceFresh || profile.available_balance == null ? NaN : Number(profile.available_balance), utilization: !balanceFresh || profile.margin_utilization == null ? NaN : Number(profile.margin_utilization) });
      setDataError(balanceFresh ? null : 'Worker telemetry is stale; trading status is unconfirmed.'); setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setDataError("Data refresh failed. Displayed values may be stale.");
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
    const { error } = await supabase.from('profiles').update({ is_paused: nextPause }).eq('id', userId);
    if (error) { alert(`Trading state was not changed: ${error.message}`); return; }
    setIsPaused(nextPause);
    fetchData();
  };

  const handleKillSwitch = async (id: string | number) => {
    if (!userId) return;
    if (confirm("EMERGENCY KILL SWITCH: Are you sure you want to market close this position immediately?")) {
      const { error } = await supabase.from('positions').update({ manual_exit_requested: true }).eq('id', id).eq('user_id', userId);
      if (error) { alert(`Exit request failed: ${error.message}`); return; }
      fetchData();
    }
  };

  const openPnl = useMemo(() => openPositions.reduce((acc, pos) => acc + pos.actualPnl, 0), [openPositions]);
  const availableMargin = accountMargin.available;
  const marginUsed = accountMargin.utilization * 100;
  const totalPositionMargin = Number.isFinite(availableMargin) ? Math.max(0, metrics.liveBalance - availableMargin) : NaN;

  if (loading) {
    return (
      <div className="aurora-wrapper flex items-center justify-center min-h-screen text-[var(--ink)]">
        <div className="aurora-bg" />
        <div className="aurora-content flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium animate-pulse">Initializing Terminal...</p>
        </div>
      </div>
    );
  }

  // Determine Trading Status
  let statusState: 'active' | 'paused' | 'halted' = 'active';
  let statusText = 'Trading Active';
  let statusDesc = 'All strategies are running and monitoring for new entries.';

  if (dataError || !macroInfo || macroInfo.status === 'UNKNOWN') {
    statusState = 'paused'; statusText = 'Status Unavailable'; statusDesc = dataError || 'Macro safety has not been confirmed.';
  } else if (macroInfo?.is_blocked) {
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
      aria-current={section === id ? 'page' : undefined}
      onClick={() => { setSection(id); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        section === id
          ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
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
      <header className="sticky top-0 z-50 glass-header px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle dashboard navigation" aria-expanded={sidebarOpen} aria-controls="dashboard-navigation" onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden p-2 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Activity className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <span className="font-bold text-base sm:text-lg">Profit<span className="text-emerald-500 dark:text-emerald-400">Pilot</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-lg border border-[var(--hair)] bg-[var(--card)] shadow-sm text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--grey)]">BTC</span>
              <span className="text-[var(--pine)] num-tabular">{Number.isFinite(btcPrice) ? `$${btcPrice.toLocaleString()}` : "Unavailable"}</span>
            </div>
            <div className="w-px h-4 bg-[var(--hair)]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--grey)]">ETH</span>
              <span className="text-[var(--pine)] num-tabular">{Number.isFinite(ethPrice) ? `$${ethPrice.toLocaleString()}` : "Unavailable"}</span>
            </div>
          </div>

          <button
            onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
            className="hidden sm:block min-h-11 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] hover:bg-[var(--raise)] transition-colors"
          >
            {currency}
          </button>

          <ThemeToggle />
          <LogoutButton />

          {isAdmin && (
            <Link href="/admin" className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-colors">
              Admin
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative">
        {sidebarOpen && <button aria-label="Close dashboard navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-[55] bg-slate-950/60 backdrop-blur-sm lg:hidden" />}
        {/* Sidebar */}
        <aside ref={drawerRef} id="dashboard-navigation" role={sidebarOpen ? "dialog" : undefined} aria-modal={sidebarOpen ? true : undefined} aria-label="Dashboard navigation" className={`fixed lg:sticky lg:top-20 lg:h-[calc(100dvh-5rem)] shrink-0 inset-y-0 left-0 w-72 max-w-[calc(100vw-2rem)] bg-[var(--paper)] backdrop-blur-xl border-r border-[var(--hair)] transform ${sidebarOpen ? 'translate-x-0 visible' : '-translate-x-full invisible lg:visible'} lg:translate-x-0 transition-transform duration-300 z-[60] lg:z-20`}>
          <div className="p-4 space-y-1 h-full overflow-y-auto">
            <div className="lg:hidden flex items-center justify-between border-b border-[var(--hair)] pb-3 mb-3"><span className="font-semibold">Your workspace</span><button onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="h-11 w-11 inline-flex items-center justify-center rounded-lg hover:bg-[var(--raise)]"><X className="h-5 w-5" /></button></div>
            <div className="text-xs font-semibold text-[var(--grey)] uppercase tracking-wider mb-3 px-4 mt-4">Overview</div>
            <NavItem id="dashboard" icon={Home} label="Dashboard" />
            <NavItem id="trading" icon={Activity} label="Live Trading" />

            <div className="text-xs font-semibold text-[var(--grey)] uppercase tracking-wider mb-3 px-4 mt-8">Performance</div>
            <NavItem id="analytics" icon={PieChart} label="Analytics" />
            <NavItem id="risk" icon={ShieldAlert} label="Risk Center" />
            <NavItem id="history" icon={History} label="Trade History" />

            <div className="text-xs font-semibold text-[var(--grey)] uppercase tracking-wider mb-3 px-4 mt-8">Account</div>
            <NavItem id="billing" icon={CreditCard} label="Billing & Invoices" />
            <Link href="/dashboard/settings" className="flex min-h-11 items-center gap-3 px-4 py-3 text-sm text-[var(--grey)] hover:bg-[var(--raise)] rounded-lg"><Settings className="w-5 h-5" />Settings</Link>
            {isAdmin && <Link href="/admin" className="block px-4 py-3 text-sm text-[var(--indigo)]">Admin console</Link>}
            <Link href="/dashboard/help" className="block px-4 py-3 text-sm text-[var(--grey)]">Help & support</Link>
            <div className="border-t border-[var(--hair)] mt-5 pt-4 px-4"><p className="break-all text-xs text-[var(--grey)] mb-3">{userEmail}</p><LogoutButton /></div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative z-10 min-w-0 flex-1 p-4 sm:p-6 xl:p-8 pb-28 lg:pb-8">
          <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
            {section !== 'billing' && <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-semibold tracking-widest uppercase text-[var(--indigo)]">Your workspace</p><h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">{{ dashboard: 'Account overview', trading: 'Live trading', history: 'Trade history', analytics: 'Performance', risk: 'Risk center', settings: 'Account settings' }[section]}</h1></div>
              <button onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')} aria-label={`Display currency: ${currency}. Switch currency`} className="sm:hidden min-h-11 rounded-lg border border-[var(--hair-2)] px-3 text-xs font-semibold">{currency}</button>
            </div>}
            {section !== 'billing' && <p role="status" className={`text-xs leading-relaxed ${dataError ? 'text-[var(--clay)]' : 'text-[var(--grey)]'}`}>
              {dataError || `Updated ${lastUpdated || '—'} · P&L is estimated until execution settles.`}
              {currency === 'INR' && ` ${INR_RATE_LABEL}.`}
            </p>}


            {/* LIVE TRADING STATUS BANNER (Visible on relevant sections) */}
            {(section === 'dashboard' || section === 'trading') && (
              <GlassCard className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4" style={{
                borderLeftColor: statusState === 'active' ? 'var(--pine)' : statusState === 'paused' ? 'var(--orange)' : 'var(--clay)'
              }}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                    statusState === 'active' ? 'bg-emerald-500/10 text-[var(--pine)]' :
                    statusState === 'paused' ? 'bg-amber-500/10 text-[var(--orange)]' :
                    'bg-rose-500/10 text-[var(--clay)]'
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
                  className={`w-full sm:w-auto min-h-11 justify-center shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
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
            {(section === 'dashboard' || section === 'trading') && (
              <>
                {section === 'dashboard' && <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                  <GlassCard hoverEffect className="p-4 sm:p-5 min-w-0">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Total Capital</div>
                    <div className="text-lg sm:text-2xl font-semibold tracking-tight break-words num-tabular">{fmt(metrics.liveBalance)}</div>
                  </GlassCard>
                  <GlassCard hoverEffect className="p-4 sm:p-5 min-w-0">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Available Margin</div>
                    <div className="text-lg sm:text-2xl font-semibold tracking-tight break-words num-tabular">{fmt(availableMargin)}</div>
                  </GlassCard>
                  <GlassCard hoverEffect className="p-4 sm:p-5 min-w-0">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Today's P&L</div>
                    <div className={`text-lg sm:text-2xl font-semibold tracking-tight break-words num-tabular ${metrics.todayPnl > 0 ? 'text-[var(--pine)]' : metrics.todayPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                      {metrics.todayPnl > 0 ? '+' : ''}{fmt(metrics.todayPnl)}
                    </div>
                  </GlassCard>
                  <GlassCard hoverEffect className="p-4 sm:p-5 min-w-0">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Open P&L</div>
                    <div className={`text-lg sm:text-2xl font-semibold tracking-tight break-words num-tabular ${openPnl > 0 ? 'text-[var(--pine)]' : openPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                      {openPnl > 0 ? '+' : ''}{fmt(openPnl)}
                    </div>
                  </GlassCard>
                </div>}

                <h2 className="text-xl font-bold mt-8 mb-4">Active Positions</h2>
                {openPositions.length === 0 ? (
                  <GlassCard variant="subtle" className="p-8 text-center flex flex-col items-center">
                    <ShieldCheck className="w-12 h-12 text-[var(--grey)] opacity-50 mb-3" />
                    <h3 className="font-semibold text-lg mb-1">No Open Positions</h3>
                    <p className="text-sm text-[var(--grey)]">Positions will appear here when a trade opens. Check the trading status above for entry availability.</p>
                  </GlassCard>
                ) : (
                  <div className="space-y-4">
                    {openPositions.map(pos => (
                      <GlassCard key={pos.id} hoverEffect className="p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg">{pos.short_call_symbol?.split('-')[1] || 'Options'} Short Strangle</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                                {pos.lots || 1} LOT
                              </span>
                            </div>
                            <div className="text-sm text-[var(--grey)]">
                              Opened {formatTradeDate(pos.opened_at)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-[var(--grey)] font-medium mb-1">Unrealized P&L</div>
                            <div className={`text-xl font-bold num-tabular ${pos.actualPnl > 0 ? 'text-[var(--pine)]' : pos.actualPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                              {pos.actualPnl > 0 ? '+' : ''}{fmt(pos.actualPnl)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-5 border-t border-[var(--hair)] flex flex-wrap gap-3 justify-between items-center">
                          <button onClick={() => toggleExpand(pos.id)} className="text-sm text-emerald-500 dark:text-emerald-400 font-medium hover:underline">
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
                              <div className="font-medium break-all">{pos.short_call_symbol}</div>
                              <div className="text-xs text-[var(--grey)] mt-0.5">Entry: {pos.callEntry}</div>
                            </div>
                            <div>
                              <div className="text-[var(--grey)] mb-1">Short Put</div>
                              <div className="font-medium break-all">{pos.short_put_symbol}</div>
                              <div className="text-xs text-[var(--grey)] mt-0.5">Entry: {pos.putEntry}</div>
                            </div>
                            <div>
                              <div className="text-[var(--grey)] mb-1">Peak Profit</div>
                              <div className="font-medium text-[var(--pine)]">{fmt(pos.peakPnl)}</div>
                            </div>
                            <div>
                              <div className="text-[var(--grey)] mb-1">Position size</div>
                              <div className="font-medium">{pos.lots ?? 'Unavailable'} lots</div>
                            </div>
                          </div>
                        )}
                      </GlassCard>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ANALYTICS SECTION */}
            {section === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <GlassCard className="p-5">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Total Net P&L</div>
                    <div className={`text-3xl font-bold num-tabular ${metrics.totalPnl > 0 ? 'text-[var(--pine)]' : metrics.totalPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
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
                  <GlassCard className="p-5 border-l-4 border-l-emerald-500">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Margin Utilization</div>
                    <div className="text-lg sm:text-2xl font-semibold tracking-tight break-words num-tabular mb-3">{Number.isFinite(marginUsed) ? `${marginUsed.toFixed(1)}%` : 'Unavailable'}</div>
                    <div className="w-full bg-[var(--raise)] rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Number.isFinite(marginUsed) ? Math.max(0, Math.min(100, marginUsed)) : 0}%` }}></div>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-5 border-l-4 border-l-emerald-500">
                    <div className="text-sm text-[var(--grey)] font-medium mb-2">Account Health</div>
                    <div className="text-xl font-semibold">{Number.isFinite(marginUsed) ? 'Telemetry available' : 'Unavailable'}</div>
                    <p className="text-xs text-[var(--grey)] mt-1">Account health requires current margin and position data. The figures shown here do not guarantee trading safety.</p>
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
                          <td className={`px-5 py-4 text-right font-bold num-tabular ${pos.realizedPnl > 0 ? 'text-[var(--pine)]' : pos.realizedPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
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
            {section === 'billing' && <BillingList />}
            {section === 'settings' && (
              <GlassCard className="p-8 text-center flex flex-col items-center">
                 <Settings className="w-12 h-12 text-[var(--grey)] opacity-50 mb-3" />
                 <h3 className="font-semibold text-lg mb-1">Account & Billing Settings</h3>
                 <p className="text-sm text-[var(--grey)] max-w-md mx-auto">
                   Please use the Settings page to manage your API keys, and the Billing page to view invoices.
                 </p>
                 <div className="mt-6 flex gap-4">
                   <Link href="/dashboard/settings" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium">Go to Settings</Link>
                   <Link href="/dashboard/billing" className="px-4 py-2 bg-[var(--raise)] hover:bg-[var(--raise-2)] border border-[var(--hair)] rounded-lg text-sm font-medium">Go to Billing</Link>
                 </div>
              </GlassCard>
            )}

          </div>
        </main>
      </div>
      <nav aria-label="Mobile dashboard" className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--hair-2)] bg-[var(--paper)] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] grid grid-cols-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {([{ id: 'dashboard', label: 'Overview', icon: Home }, { id: 'trading', label: 'Trading', icon: Activity }, { id: 'billing', label: 'Invoices', icon: CreditCard }] as const).map(item => <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false); window.scrollTo({ top: 0 }); }} aria-current={section === item.id ? 'page' : undefined} className={`min-h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${section === item.id ? 'bg-[var(--emerald-tint)] text-[var(--indigo)]' : 'text-[var(--grey)]'}`}><item.icon className="h-5 w-5" />{item.label}</button>)}
        <button onClick={() => setSidebarOpen(true)} aria-expanded={sidebarOpen} aria-controls="dashboard-navigation" className="min-h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[var(--grey)]"><Menu className="h-5 w-5" />More</button>
      </nav>
    </div>
  );
}

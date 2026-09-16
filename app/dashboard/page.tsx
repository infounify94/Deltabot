'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { formatAccountCurrency, INR_RATE_LABEL } from '@/lib/currency';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LogoutButton } from '@/components/ui/logout-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BillingList } from '@/components/ui/billing-list';
import { GlassCard } from '@/components/ui/glass-card';
import { MacroCalendarPanel, type MacroInfo } from '@/components/ui/macro-calendar-panel';
import { fillDetails } from '@/lib/trade-details';
import { sectionFromSearch, sectionHref, type DashboardSection } from '@/lib/dashboard-navigation';
import {
  Activity, Play, Pause, ShieldAlert, Menu, X, Settings,
  Home, History, TrendingUp, ShieldCheck, Clock,
  CheckCircle2, AlertCircle, CreditCard, PieChart, Shield,
  ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp,
  BarChart2, ArrowRight, Wallet, DollarSign, Layers
} from 'lucide-react';

type TimePeriod = 'today' | '7d' | '30d' | 'mtd' | 'all';
type LedgerTab = 'open' | 'closed' | 'resting' | 'rejected';

export default function Dashboard() {
  const [section, setSection] = useState<DashboardSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const refreshInFlight = useRef(false);

  // Time filter for Dashboard hero
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('mtd');
  // Tab for Trade History page
  const [ledgerTab, setLedgerTab] = useState<LedgerTab>('closed');

  useEffect(() => {
    const restore = () => { setSection(sectionFromSearch(window.location.search)); setSidebarOpen(false); };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  const navigateSection = (event: React.MouseEvent<HTMLAnchorElement>, next: DashboardSection) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (section !== next) window.history.pushState(null, '', sectionHref(next));
    setSection(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Real DB Data (Supabase)
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [closedPositions, setClosedPositions] = useState<any[]>([]);
  const [rejectedTrades, setRejectedTrades] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const historyPageRef = useRef(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
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
  const [macroInfo, setMacroInfo] = useState<MacroInfo | null>(null);

  // Real-time market WebSocket prices
  const [btcPrice, setBtcPrice] = useState<number>(NaN);
  const [ethPrice, setEthPrice] = useState<number>(NaN);
  const [priceObservedAt, setPriceObservedAt] = useState<Record<string, number>>({});
  const [currency, setCurrency] = useState<'INR' | 'USD'>('USD');

  // Expanded trade details accordion
  const [expandedTradeIds, setExpandedTradeIds] = useState<Set<number | string>>(new Set());

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
    return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${timeStr}`;
  };

  const formatShortDate = (rawDate?: string | null) => {
    if (!rawDate) return '—';
    const d = new Date(rawDate);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
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
    setExpandedTradeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    let wsBtc: WebSocket;
    let wsEth: WebSocket;
    try {
      wsBtc = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
      wsBtc.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.p && Number(data.p) > 0) {
          setBtcPrice(parseFloat(data.p));
          setPriceObservedAt(prev => ({ ...prev, BTC: Date.now() }));
        }
      };

      wsEth = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@trade');
      wsEth.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.p && Number(data.p) > 0) {
          setEthPrice(parseFloat(data.p));
          setPriceObservedAt(prev => ({ ...prev, ETH: Date.now() }));
        }
      };
    } catch (e) {
      console.error('WebSocket price connection failed', e);
    }
    return () => {
      if (wsBtc) wsBtc.close();
      if (wsEth) wsEth.close();
    };
  }, []);

  const fetchMacroStatus = async () => {
    try {
      const res = await fetch('/api/macro', { cache: 'no-store', signal: AbortSignal.timeout(7000) });
      if (!res.ok) throw new Error('Calendar request failed');
      const data = await res.json();
      if (!data.success || !Array.isArray(data.upcoming_events)) throw new Error('Calendar unavailable');
      setMacroInfo(data);
    } catch (err) {
      setMacroInfo(null);
      console.error('Macro fetch error', err);
    }
  };

  async function fetchData() {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    const requestedPage = historyPageRef.current;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      setUserEmail(user.email || '');
      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_paused, live_balance, is_admin, available_balance, margin_utilization, balance_observed_at')
        .eq('id', user.id)
        .single();
      if (profileError || !profile) throw new Error('Account data unavailable');
      setIsPaused(profile.is_paused);
      setIsAdmin(profile?.is_admin || false);
      const balanceFresh = profile.balance_observed_at && Date.now() - Date.parse(profile.balance_observed_at) < 60000;
      let liveBalance = balanceFresh && profile.live_balance != null ? Number(profile.live_balance) : NaN;

      const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      setInvoices(invs || []);

      const { data: openData, error: openError } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'adjusted', 'closing', 'close_failed', 'execution_anomaly', 'reconciliation_required']);

      const { data: closedData, error: closedError, count: closedCount } = await supabase
        .from('positions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .in('status', ['closed', 'closed_unreconciled'])
        .order('closed_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
        .range(requestedPage * 50, requestedPage * 50 + 49);

      // Fetch authentic rejected trades or anomalies
      const { data: rejData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['execution_anomaly', 'close_failed', 'reconciliation_required'])
        .order('opened_at', { ascending: false })
        .limit(50);
      setRejectedTrades(rejData || []);

      const { data: summary, error: summaryError } = await supabase.rpc('dashboard_trade_summary');
      if (openError || closedError || summaryError || !summary) throw new Error('Position data unavailable');

      const posIds = [...(openData || []), ...(closedData || [])].map((p: any) => p.id);
      const { data: eventsData, error: eventsError } = posIds.length > 0
        ? await supabase.from('trade_events').select('position_id,event_type,detail,created_at').in('position_id', posIds).eq('user_id', user.id)
        : { data: [], error: null };
      if (eventsError) throw new Error('Trade details unavailable');

      const processedClosed = (closedData || []).map(pos => {
        let fees = 0;
        const posEvents = (eventsData || []).filter(e => e.position_id === pos.id);
        posEvents.forEach(e => {
          if (e.event_type === 'entry') fees += parseFloat(e.detail?.fees_paid ?? e.detail?.fill?.fees_paid ?? 0);
          if (['time_exit', 'profit_take', 'stop_loss', 'manual_kill_switch', 'exit'].includes(e.event_type)) {
            const reports = e.detail?.execution?.legs;
            if (reports) {
              fees += Object.values(reports).reduce((sum: number, r: any) => sum + Number(r.fees || 0), 0);
              return;
            }
            const fills = e.detail?.fills || {};
            const cf = fills[pos.short_call_symbol] || {};
            const pf = fills[pos.short_put_symbol] || {};
            const extractFee = (f: any) => parseFloat(f.paid_commission || f.result?.paid_commission || 0);
            fees += extractFee(cf) + extractFee(pf);
          }
        });
        const realizedPnl = pos.realized_pnl == null ? NaN : Number(pos.realized_pnl);
        return {
          ...pos,
          fees,
          grossPnl: realizedPnl + fees,
          realizedPnl,
          fillDetails: fillDetails(pos, posEvents)
        };
      });

      const processedOpen = (openData || []).map((pos: any) => ({
        ...pos,
        fillDetails: fillDetails(pos, (eventsData || []).filter(e => e.position_id === pos.id)),
        actualPnl: pos.pnl_observed_at && Date.now() - Date.parse(pos.pnl_observed_at) < 60000 && pos.actual_pnl != null ? Number(pos.actual_pnl) : NaN,
        peakPnl: parseFloat(pos.peak_unrealized_pnl || 0),
      }));

      setOpenPositions(processedOpen);
      if (requestedPage === historyPageRef.current) {
        setClosedPositions(processedClosed);
        setHistoryTotal(closedCount || 0);
        setHistoryLoading(false);
      }

      const roundTrips = Number(summary.round_trips);
      const winners = Number(summary.winners);
      const hitRate = roundTrips > 0 ? Math.round((winners / roundTrips) * 100) : 0;
      const totalPnl = summary.total_pnl == null ? NaN : Number(summary.total_pnl);
      const todayPnl = summary.today_pnl == null ? NaN : Number(summary.today_pnl);

      setMetrics({ roundTrips, winners, hitRate, totalPnl, todayPnl, liveBalance });
      setAccountMargin({
        available: !balanceFresh || profile.available_balance == null ? NaN : Number(profile.available_balance),
        utilization: !balanceFresh || profile.margin_utilization == null ? NaN : Number(profile.margin_utilization)
      });
      setDataError(balanceFresh ? null : 'Worker telemetry is stale; trading status is unconfirmed.');
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setDataError('Data refresh failed. Displayed values may be stale.');
      setHistoryLoading(false);
      console.error(err);
    } finally {
      refreshInFlight.current = false;
      setLoading(false);
      if (requestedPage !== historyPageRef.current) queueMicrotask(() => fetchData());
    }
  }

  const changeHistoryPage = (page: number) => {
    historyPageRef.current = page;
    setHistoryPage(page);
    setHistoryLoading(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
    fetchMacroStatus();
    const interval = setInterval(fetchData, 8000);
    const calendarInterval = setInterval(fetchMacroStatus, 60000);
    return () => { clearInterval(interval); clearInterval(calendarInterval); };
  }, []);

  const handlePauseToggle = async () => {
    if (!userId) return;
    if (!confirm(isPaused ? 'Are you sure you want to resume new trades?' : 'Are you sure you want to pause new trades? (Existing positions will remain open)')) return;
    const nextPause = !isPaused;
    const { error } = await supabase.from('profiles').update({ is_paused: nextPause }).eq('id', userId);
    if (error) { alert(`Trading state was not changed: ${error.message}`); return; }
    setIsPaused(nextPause);
    fetchData();
  };

  const handleKillSwitch = async (id: string | number) => {
    if (!userId) return;
    if (confirm('Request an emergency market close for this position? The worker will execute it; completion depends on the exchange.')) {
      const { data, error } = await supabase.from('positions').update({ manual_exit_requested: true }).eq('id', id).eq('user_id', userId).select('id');
      if (error) { alert(`Exit request failed: ${error.message}`); return; }
      if (!data?.length) { alert('No owned position was updated. Refresh and check its status.'); return; }
      fetchData();
    }
  };

  const openPnl = useMemo(() => openPositions.reduce((acc, pos) => acc + (Number.isFinite(pos.actualPnl) ? pos.actualPnl : 0), 0), [openPositions]);
  const availableMargin = accountMargin.available;
  const marginUsed = accountMargin.utilization * 100;

  // -------------------------------------------------------------
  // DYNAMIC PERIOD & PERFORMANCE CALCULATIONS
  // -------------------------------------------------------------
  const {
    filteredClosed,
    periodPnl,
    periodWinners,
    periodLosers,
    periodHitRate,
    periodAvgWin,
    periodAvgLoss,
    periodBestTrade,
    periodWorstTrade,
    periodFees,
    mtdPnl,
    mtdTradesCount,
    mtdWinRate,
    mtdFees,
    monthlyBreakdown,
    equityCurvePoints
  } = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 86400000;
    const thirtyDaysAgo = now.getTime() - 30 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // 1. Time-filtered closed positions
    const filteredClosed = closedPositions.filter(p => {
      const tradeTime = p.closed_at ? new Date(p.closed_at).getTime() : (p.opened_at ? new Date(p.opened_at).getTime() : 0);
      if (timePeriod === 'today') return tradeTime >= todayMidnight;
      if (timePeriod === '7d') return tradeTime >= sevenDaysAgo;
      if (timePeriod === '30d') return tradeTime >= thirtyDaysAgo;
      if (timePeriod === 'mtd') return tradeTime >= startOfMonth;
      return true; // 'all'
    });

    const periodCount = filteredClosed.length;
    const periodPnl = filteredClosed.reduce((sum, p) => sum + (Number.isFinite(p.realizedPnl) ? p.realizedPnl : 0), 0);
    const winningTrades = filteredClosed.filter(p => p.realizedPnl > 0);
    const losingTrades = filteredClosed.filter(p => p.realizedPnl < 0);
    const periodWinners = winningTrades.length;
    const periodLosers = losingTrades.length;
    const periodHitRate = periodCount > 0 ? Math.round((periodWinners / periodCount) * 100) : 0;

    const winTotal = winningTrades.reduce((sum, p) => sum + p.realizedPnl, 0);
    const lossTotal = losingTrades.reduce((sum, p) => sum + Math.abs(p.realizedPnl), 0);
    const periodAvgWin = periodWinners > 0 ? winTotal / periodWinners : 0;
    const periodAvgLoss = periodLosers > 0 ? lossTotal / periodLosers : 0;

    const allPnlValues = filteredClosed.map(p => p.realizedPnl).filter(Number.isFinite);
    const periodBestTrade = allPnlValues.length > 0 ? Math.max(...allPnlValues) : 0;
    const periodWorstTrade = allPnlValues.length > 0 ? Math.min(...allPnlValues) : 0;
    const periodFees = filteredClosed.reduce((sum, p) => sum + (p.fees || 0), 0);

    // 2. MTD specific figures for the prominent Monthly card
    const mtdPositions = closedPositions.filter(p => {
      const tradeTime = p.closed_at ? new Date(p.closed_at).getTime() : (p.opened_at ? new Date(p.opened_at).getTime() : 0);
      return tradeTime >= startOfMonth;
    });
    const mtdPnl = mtdPositions.reduce((sum, p) => sum + (Number.isFinite(p.realizedPnl) ? p.realizedPnl : 0), 0);
    const mtdTradesCount = mtdPositions.length;
    const mtdWinnersCount = mtdPositions.filter(p => p.realizedPnl > 0).length;
    const mtdWinRate = mtdTradesCount > 0 ? Math.round((mtdWinnersCount / mtdTradesCount) * 100) : 0;
    const mtdFees = mtdPositions.reduce((sum, p) => sum + (p.fees || 0), 0);

    // 3. Monthly Breakdown (group by YYYY-MM)
    const monthMap: Record<string, { label: string; pnl: number; count: number; winners: number }> = {};
    closedPositions.forEach(p => {
      const d = p.closed_at ? new Date(p.closed_at) : new Date();
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (!monthMap[key]) {
          monthMap[key] = { label, pnl: 0, count: 0, winners: 0 };
        }
        if (Number.isFinite(p.realizedPnl)) {
          monthMap[key].pnl += p.realizedPnl;
        }
        monthMap[key].count += 1;
        if (p.realizedPnl > 0) monthMap[key].winners += 1;
      }
    });
    const monthlyBreakdown = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([key, data]) => ({ key, ...data }));

    // 4. Cumulative Equity Curve Points
    // Chronological order (oldest to newest)
    const chronological = [...closedPositions]
      .filter(p => Number.isFinite(p.realizedPnl))
      .sort((a, b) => new Date(a.closed_at || a.opened_at || 0).getTime() - new Date(b.closed_at || b.opened_at || 0).getTime());

    let running = 0;
    const equityCurvePoints = chronological.map((p, idx) => {
      running += p.realizedPnl;
      return {
        idx,
        pnl: running,
        date: p.closed_at ? formatShortDate(p.closed_at) : `#${idx + 1}`
      };
    });

    return {
      filteredClosed,
      periodPnl,
      periodWinners,
      periodLosers,
      periodHitRate,
      periodAvgWin,
      periodAvgLoss,
      periodBestTrade,
      periodWorstTrade,
      periodFees,
      mtdPnl,
      mtdTradesCount,
      mtdWinRate,
      mtdFees,
      monthlyBreakdown,
      equityCurvePoints
    };
  }, [closedPositions, timePeriod]);

  // Title for Headline P&L Card following user selection
  const periodHeroTitle = useMemo(() => {
    switch (timePeriod) {
      case 'today': return "TODAY'S P&L – TRADED PRICES";
      case '7d': return "LAST 7 DAYS P&L – TRADED PRICES";
      case '30d': return "LAST 30 DAYS P&L – TRADED PRICES";
      case 'mtd': return "THIS MONTH P&L (MTD) – TRADED PRICES";
      case 'all': return "TOTAL REALIZED P&L (ALL TIME)";
    }
  }, [timePeriod]);

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

  // Real Trading Status (Strictly authentic, no fabricated states)
  let statusState: 'active' | 'paused' | 'halted' = 'active';
  let statusText = 'Automation Active';
  let statusDesc = 'All autonomous strategies are live and monitoring market volatility for entries.';

  if (dataError || !macroInfo || macroInfo.status === 'UNKNOWN') {
    statusState = 'paused';
    statusText = 'Telemetry Pending';
    statusDesc = dataError || 'Macro safety conditions are confirming.';
  } else if (macroInfo?.is_blocked) {
    statusState = 'halted';
    statusText = 'News Blackout Gate';
    statusDesc = macroInfo.blackout_reason || 'Entries paused for major scheduled economic releases.';
  } else if (isPaused) {
    statusState = 'paused';
    statusText = 'Automation Paused';
    statusDesc = 'You have manually paused new trade entries. Existing positions remain managed.';
  }

  const renderNavItem = (id: DashboardSection, Icon: any, label: string) => (
    <a
      href={sectionHref(id)}
      aria-current={section === id ? 'page' : undefined}
      onClick={event => navigateSection(event, id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        section === id
          ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-semibold'
          : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </a>
  );

  return (
    <div className="aurora-wrapper text-[var(--ink)] flex flex-col min-h-screen">
      <div className="aurora-bg" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 glass-header px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle dashboard navigation"
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-navigation"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Activity className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight">
              Profit<span className="text-emerald-500 dark:text-emerald-400">Pilot</span>
            </span>
          </div>

          {/* Live System Indicator Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--hair)] text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${statusState === 'active' ? 'bg-emerald-500 animate-pulse' : statusState === 'paused' ? 'bg-amber-500' : 'bg-rose-500'}`} />
            <span className="text-[var(--grey)] font-medium">Status:</span>
            <span className={statusState === 'active' ? 'text-emerald-500' : statusState === 'paused' ? 'text-amber-500' : 'text-rose-500'}>
              {statusState === 'active' ? '● LIVE' : statusText}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* BTC / ETH Live Prices */}
          <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-lg border border-[var(--hair)] bg-[var(--card)] text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--grey)] text-xs font-bold">BTC</span>
              <span className="num-tabular font-semibold">{Number.isFinite(btcPrice) ? `$${btcPrice.toLocaleString()}` : '—'}</span>
            </div>
            <div className="w-px h-4 bg-[var(--hair)]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--grey)] text-xs font-bold">ETH</span>
              <span className="num-tabular font-semibold">{Number.isFinite(ethPrice) ? `$${ethPrice.toLocaleString()}` : '—'}</span>
            </div>
          </div>

          <button
            onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
            className="min-h-10 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] hover:bg-[var(--raise)] transition-colors"
          >
            {currency}
          </button>

          <ThemeToggle />
          <LogoutButton />

          {isAdmin && (
            <Link href="/admin" className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
              Admin
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative">
        {sidebarOpen && (
          <button
            aria-label="Close dashboard navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-[55] bg-slate-950/60 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Reusable Sidebar Navigation */}
        <aside
          ref={drawerRef}
          id="dashboard-navigation"
          role={sidebarOpen ? 'dialog' : undefined}
          aria-modal={sidebarOpen ? true : undefined}
          aria-label="Dashboard navigation"
          className={`fixed lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] shrink-0 inset-y-0 left-0 w-72 max-w-[calc(100vw-2rem)] bg-[var(--paper)] backdrop-blur-xl border-r border-[var(--hair)] transform ${
            sidebarOpen ? 'translate-x-0 visible' : '-translate-x-full invisible lg:visible'
          } lg:translate-x-0 transition-transform duration-300 z-[60] lg:z-20`}
        >
          <div className="p-4 space-y-1 h-full overflow-y-auto">
            <div className="lg:hidden flex items-center justify-between border-b border-[var(--hair)] pb-3 mb-3">
              <span className="font-semibold">Navigation</span>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-[var(--raise)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs font-bold text-[var(--grey)] uppercase tracking-wider mb-2 px-4 mt-2">Overview</div>
            {renderNavItem('dashboard', Home, 'Dashboard')}
            {renderNavItem('trading', Activity, 'Live Trading')}

            <div className="text-xs font-bold text-[var(--grey)] uppercase tracking-wider mb-2 px-4 mt-6">Performance</div>
            {renderNavItem('history', History, 'Trade History')}
            {renderNavItem('analytics', PieChart, 'Analytics')}
            {renderNavItem('risk', ShieldAlert, 'Risk Center')}

            <div className="text-xs font-bold text-[var(--grey)] uppercase tracking-wider mb-2 px-4 mt-6">Account</div>
            {renderNavItem('billing', CreditCard, 'Billing & Invoices')}
            <Link href="/dashboard/settings" className="flex min-h-11 items-center gap-3 px-4 py-3 text-sm text-[var(--grey)] hover:bg-[var(--raise)] rounded-lg font-medium">
              <Settings className="w-5 h-5" /> Settings
            </Link>
            {isAdmin && (
              <Link href="/admin" className="flex min-h-11 items-center gap-3 px-4 py-3 text-sm text-indigo-500 dark:text-indigo-400 hover:bg-[var(--raise)] rounded-lg font-semibold">
                <Shield className="w-5 h-5" /> Admin Console
              </Link>
            )}
            <Link href="/dashboard/help" className="block px-4 py-3 text-sm text-[var(--grey)] hover:text-[var(--ink)]">
              Help & Support
            </Link>

            <div className="border-t border-[var(--hair)] mt-6 pt-4 px-4">
              <p className="break-all text-xs text-[var(--grey)] mb-3">{userEmail}</p>
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="relative z-10 min-w-0 flex-1 p-4 sm:p-6 xl:p-8 pb-28 lg:pb-8">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Sub-header text */}
            {section !== 'billing' && (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-emerald-500 dark:text-emerald-400">
                    {section === 'dashboard' ? 'Performance Overview' : section === 'history' ? 'Activity & Orders' : section === 'trading' ? 'Execution Engine' : 'System Performance'}
                  </p>
                  <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
                    {{
                      dashboard: 'Account Dashboard',
                      trading: 'Live Trading Terminal',
                      history: 'Every order we placed for you',
                      analytics: 'Strategy Performance',
                      risk: 'Risk Center & Gates',
                      settings: 'Settings & Security'
                    }[section]}
                  </h1>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 1: MAIN DASHBOARD (Cryptex Clarity & Performance-First)          */}
            {/* ========================================================================= */}
            {section === 'dashboard' && (
              <div className="space-y-6">

                {/* 1. Headline P&L Hero Card */}
                <GlassCard className="p-5 sm:p-6 relative overflow-hidden border border-[var(--hair)] shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--grey)]">
                        {periodHeroTitle}
                      </span>
                    </div>

                    {/* Period Switcher Pills */}
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)]">
                      {(['today', '7d', '30d', 'mtd', 'all'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setTimePeriod(p)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                            timePeriod === p
                              ? 'bg-[var(--card)] text-[var(--ink)] shadow-sm'
                              : 'text-[var(--grey)] hover:text-[var(--ink)]'
                          }`}
                        >
                          {p === 'today' ? 'Today' : p === '7d' ? '7D' : p === '30d' ? '30D' : p === 'mtd' ? 'MTD' : 'All Time'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clean, Proportional Headline Number */}
                  <div className="mb-4">
                    <div className={`text-2xl sm:text-3xl font-bold tracking-tight num-tabular ${
                      periodPnl > 0 ? 'text-[var(--pine)]' : periodPnl < 0 ? 'text-[var(--clay)]' : 'text-[var(--ink)]'
                    }`}>
                      {periodPnl > 0 ? '+' : ''}{fmt(periodPnl)}
                    </div>
                  </div>

                  {/* Clear Sub-Metrics Breakdown Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[var(--hair)]">
                    <div>
                      <div className="text-xs font-medium text-[var(--grey)] mb-1">Realised P&L</div>
                      <div className={`text-base sm:text-lg font-bold num-tabular ${periodPnl > 0 ? 'text-[var(--pine)]' : periodPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                        {periodPnl > 0 ? '+' : ''}{fmt(periodPnl)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[var(--grey)] mb-1">Open P&L</div>
                      <div className={`text-base sm:text-lg font-bold num-tabular ${openPnl > 0 ? 'text-[var(--pine)]' : openPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                        {openPnl > 0 ? '+' : ''}{fmt(openPnl)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[var(--grey)] mb-1">Wallet Balance</div>
                      <div className="text-base sm:text-lg font-bold num-tabular">{fmt(metrics.liveBalance)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[var(--grey)] mb-1">Available Margin</div>
                      <div className="text-base sm:text-lg font-bold num-tabular">{fmt(availableMargin)}</div>
                    </div>
                  </div>
                </GlassCard>

                {/* 2. Prominent Monthly Earnings Highlight + Trading Summary Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Monthly Earnings Highlight Card */}
                  <GlassCard hoverEffect className="p-5 border-l-4 border-l-emerald-500 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--grey)]">This Month (MTD)</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">Current</span>
                      </div>
                      <div className={`text-2xl font-black num-tabular ${mtdPnl > 0 ? 'text-[var(--pine)]' : mtdPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                        {mtdPnl > 0 ? '+' : ''}{fmt(mtdPnl)}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[var(--hair)] text-xs text-[var(--grey)]">
                      <span className="font-bold text-[var(--ink)]">{mtdTradesCount}</span> trades ·{' '}
                      <span className="font-bold text-[var(--ink)]">{mtdWinRate}%</span> win rate ·{' '}
                      <span className="font-semibold">{fmt(mtdFees)}</span> fees
                    </div>
                  </GlassCard>

                  {/* Summary Performance Metric Strip (Col 2 & 3) */}
                  <GlassCard hoverEffect className="p-5 md:col-span-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--grey)]">Selected Period Summary</span>
                      <span className="text-xs text-[var(--grey)] font-medium">1 Strangle = 1 Strategy Trade</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 py-1">
                      <div>
                        <div className="text-[11px] text-[var(--grey)] mb-0.5">Round-trips</div>
                        <div className="text-base font-bold num-tabular">{filteredClosed.length}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--grey)] mb-0.5">Winners</div>
                        <div className="text-base font-bold text-[var(--pine)] num-tabular">{periodWinners}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--grey)] mb-0.5">Losers</div>
                        <div className="text-base font-bold text-[var(--clay)] num-tabular">{periodLosers}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--grey)] mb-0.5">Hit Rate</div>
                        <div className="text-base font-bold num-tabular">{periodHitRate}%</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--grey)] mb-0.5">Avg Win</div>
                        <div className="text-base font-bold text-[var(--pine)] num-tabular">+{fmt(periodAvgWin)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--grey)] mb-0.5">Avg Loss</div>
                        <div className="text-base font-bold text-[var(--clay)] num-tabular">-{fmt(periodAvgLoss)}</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[var(--hair)] flex items-center justify-between text-xs text-[var(--grey)]">
                      <div>Best Trade: <span className="font-bold text-[var(--pine)]">+{fmt(periodBestTrade)}</span></div>
                      <div>Worst Trade: <span className="font-bold text-[var(--clay)]">{fmt(periodWorstTrade)}</span></div>
                      <div>Total Fees: <span className="font-semibold">{fmt(periodFees)}</span></div>
                    </div>
                  </GlassCard>
                </div>

                {/* 3. Dual Charts: Equity Curve + Monthly P&L Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Equity Curve SVG */}
                  <GlassCard className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold">Equity Curve</h2>
                        <p className="text-xs text-[var(--grey)]">Cumulative growth across closed strategy trades</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold num-tabular ${
                        metrics.totalPnl >= 0 ? 'bg-emerald-500/10 text-[var(--pine)]' : 'bg-rose-500/10 text-[var(--clay)]'
                      }`}>
                        {metrics.totalPnl >= 0 ? '+' : ''}{fmt(metrics.totalPnl)}
                      </span>
                    </div>

                    {equityCurvePoints.length > 1 ? (
                      <div className="w-full h-44 flex items-end relative pt-4">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={metrics.totalPnl >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.35" />
                              <stop offset="100%" stopColor={metrics.totalPnl >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {(() => {
                            const values = equityCurvePoints.map(p => p.pnl);
                            const min = Math.min(0, ...values);
                            const max = Math.max(1, ...values);
                            const range = (max - min) || 1;

                            const coords = equityCurvePoints.map((p, i) => {
                              const x = (i / (equityCurvePoints.length - 1)) * 390 + 5;
                              const y = 110 - ((p.pnl - min) / range) * 100;
                              return `${x},${y}`;
                            });

                            const lineD = `M ${coords.join(' L ')}`;
                            const areaD = `M ${coords[0]} L ${coords.join(' L ')} L 395,120 L 5,120 Z`;

                            return (
                              <>
                                <path d={areaD} fill="url(#equityGrad)" />
                                <path d={lineD} fill="none" stroke={metrics.totalPnl >= 0 ? '#10b981' : '#f43f5e'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center text-[var(--grey)] text-xs">
                        <TrendingUp className="w-8 h-8 opacity-40 mb-2" />
                        Equity curve displays as closed trades accumulate.
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-[var(--grey)] mt-3 pt-3 border-t border-[var(--hair)]">
                      <span>Inception</span>
                      <span>Latest Closed Trade</span>
                    </div>
                  </GlassCard>

                  {/* Monthly P&L Breakdown Bars */}
                  <GlassCard className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold">Monthly P&L</h2>
                        <p className="text-xs text-[var(--grey)]">Realized earnings grouped by calendar month</p>
                      </div>
                      <BarChart2 className="w-5 h-5 text-[var(--grey)]" />
                    </div>

                    {monthlyBreakdown.length > 0 ? (
                      <div className="space-y-3 my-auto">
                        {monthlyBreakdown.map(m => {
                          const maxAbsPnl = Math.max(1, ...monthlyBreakdown.map(x => Math.abs(x.pnl)));
                          const barWidth = Math.min(100, Math.max(8, (Math.abs(m.pnl) / maxAbsPnl) * 100));

                          return (
                            <div key={m.key} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold">{m.label}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-[var(--grey)]">{m.count} trades</span>
                                  <span className={`font-bold num-tabular ${m.pnl > 0 ? 'text-[var(--pine)]' : m.pnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                                    {m.pnl > 0 ? '+' : ''}{fmt(m.pnl)}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full h-2 rounded-full bg-[var(--raise)] overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${m.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center text-[var(--grey)] text-xs">
                        <BarChart2 className="w-8 h-8 opacity-40 mb-2" />
                        Monthly performance summary will appear with trade activity.
                      </div>
                    )}

                    <div className="text-[11px] text-[var(--grey)] mt-3 pt-3 border-t border-[var(--hair)]">
                      Net realized profit after exchange fees.
                    </div>
                  </GlassCard>
                </div>

                {/* 4. Active Positions Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-500" /> Active Positions ({openPositions.length})
                    </h2>
                    <span className="text-xs text-[var(--grey)]">Continuous liquidation & delta monitoring</span>
                  </div>

                  {openPositions.length === 0 ? (
                    <GlassCard variant="subtle" className="p-8 text-center flex flex-col items-center">
                      <ShieldCheck className="w-12 h-12 text-[var(--grey)] opacity-40 mb-3" />
                      <h3 className="font-semibold text-lg mb-1">No Open Positions</h3>
                      <p className="text-sm text-[var(--grey)] max-w-md">
                        ProfitPilot is monitoring market volatility for high-probability strangle setups. New trades will automatically execute when parameters align.
                      </p>
                    </GlassCard>
                  ) : (
                    <div className="space-y-3">
                      {openPositions.map(pos => {
                        const isExpanded = expandedTradeIds.has(pos.id);
                        const callStrike = pos.short_call_strike || (pos.short_call_symbol ? pos.short_call_symbol.split('-')[2] : '—');
                        const putStrike = pos.short_put_strike || (pos.short_put_symbol ? pos.short_put_symbol.split('-')[2] : '—');
                        const callEntry = pos.fillDetails?.[pos.short_call_symbol]?.entry;
                        const putEntry = pos.fillDetails?.[pos.short_put_symbol]?.entry;

                        return (
                          <GlassCard key={pos.id} hoverEffect className="p-5 border-l-4 border-l-emerald-500">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-base sm:text-lg">
                                    {pos.underlying || 'BTC'} Options Strangle
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    {pos.lots || 1} LOT
                                  </span>
                                </div>
                                <div className="text-xs text-[var(--grey)]">
                                  Opened {formatTradeDate(pos.opened_at)}
                                </div>
                              </div>

                              <div className="flex items-center gap-6 text-right">
                                <div>
                                  <div className="text-xs text-[var(--grey)] font-medium mb-0.5">Peak P&L</div>
                                  <div className="text-base sm:text-lg font-bold text-[var(--pine)] num-tabular">
                                    +{fmt(pos.peakPnl)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-[var(--grey)] font-medium mb-0.5">Floating P&L</div>
                                  <div className={`text-base sm:text-lg font-bold num-tabular ${pos.actualPnl > 0 ? 'text-[var(--pine)]' : pos.actualPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                                    {pos.actualPnl > 0 ? '+' : ''}{fmt(pos.actualPnl)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--hair)] flex items-center justify-between">
                              <button
                                onClick={() => toggleExpand(pos.id)}
                                className="text-xs text-emerald-500 font-semibold hover:underline flex items-center gap-1"
                              >
                                {isExpanded ? 'Hide Live Details' : 'View Live Details'}
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => handleKillSwitch(pos.id)}
                                disabled={!!pos.manual_exit_requested}
                                className="px-3 py-1.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                {pos.manual_exit_requested ? 'Close Requested' : 'Emergency Close'}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-[var(--hair)] space-y-2.5">
                                {/* Call Leg Line */}
                                <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">CALL LEG</span>
                                    <span className="font-mono font-bold text-[var(--ink)]">{pos.short_call_symbol || '—'}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-[var(--grey)]">
                                    <span>Strike: <strong className="text-[var(--ink)]">${Number(callStrike).toLocaleString()}</strong></span>
                                    <span>Entry Fill: <strong className="text-[var(--ink)]">{callEntry != null ? `$${callEntry} USD` : 'Recorded'}</strong></span>
                                  </div>
                                </div>

                                {/* Put Leg Line */}
                                <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">PUT LEG</span>
                                    <span className="font-mono font-bold text-[var(--ink)]">{pos.short_put_symbol || '—'}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-[var(--grey)]">
                                    <span>Strike: <strong className="text-[var(--ink)]">${Number(putStrike).toLocaleString()}</strong></span>
                                    <span>Entry Fill: <strong className="text-[var(--ink)]">{putEntry != null ? `$${putEntry} USD` : 'Recorded'}</strong></span>
                                  </div>
                                </div>

                                {/* Summary Line */}
                                <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-[var(--card)] border border-[var(--hair)] text-xs">
                                  <div className="flex flex-wrap items-center gap-6">
                                    <div>Credit Received: <strong className="text-[var(--pine)]">{pos.credit_received ? fmt(Number(pos.credit_received)) : '—'}</strong></div>
                                    <div>Peak P&L: <strong className="text-[var(--pine)]">+{fmt(pos.peakPnl)}</strong></div>
                                    <div>Floating P&L: <strong className={pos.actualPnl >= 0 ? 'text-[var(--pine)]' : 'text-[var(--clay)]'}>{fmt(pos.actualPnl)}</strong></div>
                                  </div>
                                  <div>Size: <strong className="text-[var(--ink)]">{pos.lots || 1} Lots</strong></div>
                                </div>
                              </div>
                            )}
                          </GlassCard>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 2: TRADE HISTORY / ORDER LEDGER (Full Cryptex 4-Tab Architecture) */}
            {/* ========================================================================= */}
            {section === 'history' && (
              <div className="space-y-6">
                <GlassCard className="overflow-hidden border border-[var(--hair)]">
                  {/* Ledger Header Description */}
                  <div className="p-5 sm:p-6 border-b border-[var(--hair)]">
                    <p className="text-xs font-semibold text-[var(--grey)] leading-relaxed max-w-3xl">
                      Sourced from our own execution ledger and priced on traded fills — not exchange marks. Trades you place yourself are not shown. 1 Strangle counts as 1 round-trip strategy trade.
                    </p>
                  </div>

                  {/* 4 Tabs Bar with Counts & Period Pill */}
                  <div className="px-5 sm:px-6 pt-4 border-b border-[var(--hair)] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLedgerTab('open')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                          ledgerTab === 'open' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'text-[var(--grey)] hover:text-[var(--ink)]'
                        }`}
                      >
                        Open <span className="px-1.5 py-0.2 rounded-full bg-[var(--raise)] text-[10px]">{openPositions.length}</span>
                      </button>

                      <button
                        onClick={() => setLedgerTab('closed')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                          ledgerTab === 'closed' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'text-[var(--grey)] hover:text-[var(--ink)]'
                        }`}
                      >
                        Closed <span className="px-1.5 py-0.2 rounded-full bg-[var(--raise)] text-[10px]">{historyTotal || closedPositions.length}</span>
                      </button>

                      <button
                        onClick={() => setLedgerTab('resting')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                          ledgerTab === 'resting' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'text-[var(--grey)] hover:text-[var(--ink)]'
                        }`}
                      >
                        Resting <span className="px-1.5 py-0.2 rounded-full bg-[var(--raise)] text-[10px]">0</span>
                      </button>

                      <button
                        onClick={() => setLedgerTab('rejected')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                          ledgerTab === 'rejected' ? 'bg-rose-500/10 text-rose-500' : 'text-[var(--grey)] hover:text-[var(--ink)]'
                        }`}
                      >
                        Rejected <span className="px-1.5 py-0.2 rounded-full bg-[var(--raise)] text-[10px]">{rejectedTrades.length}</span>
                      </button>
                    </div>

                    {/* BTC Reference Price Indicator */}
                    <div className="text-xs text-[var(--grey)] font-semibold flex items-center gap-2">
                      <span>BTC</span>
                      <span className="font-bold text-[var(--ink)] num-tabular">{Number.isFinite(btcPrice) ? `$${btcPrice.toLocaleString()}` : '—'}</span>
                    </div>
                  </div>

                  {/* Tab Metrics Summary Strip (Cryptex Style) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 sm:px-6 bg-[var(--paper-2)]/30 border-b border-[var(--hair)]">
                    <div>
                      <div className="text-xs text-[var(--grey)] font-medium mb-0.5">Round-trips</div>
                      <div className="text-xl font-bold num-tabular">{metrics.roundTrips}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--grey)] font-medium mb-0.5">Winners</div>
                      <div className="text-xl font-bold text-[var(--pine)] num-tabular">{metrics.winners}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--grey)] font-medium mb-0.5">Hit rate</div>
                      <div className="text-xl font-bold num-tabular">{metrics.hitRate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--grey)] font-medium mb-0.5">Total Realised</div>
                      <div className={`text-xl font-bold num-tabular ${metrics.totalPnl > 0 ? 'text-[var(--pine)]' : metrics.totalPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                        {metrics.totalPnl > 0 ? '+' : ''}{fmt(metrics.totalPnl)}
                      </div>
                    </div>
                  </div>

                  {/* CLOSED TAB TABLE */}
                  {ledgerTab === 'closed' && (
                    <>
                      <div className="overflow-x-auto max-h-[65vh] overflow-y-auto" aria-busy={historyLoading}>
                        <table className="w-full text-sm text-left">
                          <thead className="bg-[var(--paper-2)]/50 text-[var(--grey)] text-xs uppercase font-semibold">
                            <tr>
                              <th className="px-5 py-4">Instrument</th>
                              <th className="px-5 py-4">Strategy</th>
                              <th className="px-5 py-4">Size</th>
                              <th className="px-5 py-4">Duration</th>
                              <th className="px-5 py-4">Exit Reason</th>
                              <th className="px-5 py-4 text-right">Net P&L</th>
                              <th className="px-5 py-4">Closed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--hair)]">
                            {!historyLoading && closedPositions.map(pos => {
                              const isExpanded = expandedTradeIds.has(pos.id);

                              return (
                                <tr key={pos.id} className="hover:bg-[var(--raise)]/30 transition-colors group">
                                  <td className="px-5 py-4 font-mono font-medium text-xs">
                                    <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleExpand(pos.id)}>
                                      <span>{pos.underlying || 'BTC'}-{pos.expiry_date || 'DAILY'}</span>
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-emerald-500" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--grey)]" />}
                                    </div>

                                    {/* Expandable Leg Details Accordion */}
                                    {isExpanded && (
                                      <div className="mt-3 p-3 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] space-y-2 text-xs font-sans">
                                        <div className="font-bold text-[var(--ink)]">Strategy Leg Details:</div>
                                        {Object.entries(pos.fillDetails || {}).map(([sym, raw]) => {
                                          const r = raw as { entry: number | null; exit: number | null };
                                          return (
                                            <div key={sym} className="font-mono text-[11px] text-[var(--grey)]">
                                              <span className="font-semibold text-[var(--ink)]">{sym}</span>
                                              <div>Entry Fill: {r.entry ?? '—'} · Exit Fill: {r.exit ?? '—'} USD</div>
                                            </div>
                                          );
                                        })}
                                        <div className="pt-2 border-t border-[var(--hair)] text-[11px] space-y-1">
                                          <div>Gross Result: <span className="font-semibold">{fmt(pos.grossPnl)}</span></div>
                                          <div>Execution Fees: <span className="font-semibold">{fmt(pos.fees)}</span></div>
                                          <div>Net Realized: <span className="font-bold text-[var(--pine)]">{fmt(pos.realizedPnl)}</span></div>
                                          <div className="text-[var(--grey)] mt-1">Fill prices are per contract unit. Net P&L reflects total trade cash flow.</div>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--raise)] text-[var(--ink)] border border-[var(--hair)]">
                                      Strangle
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 font-medium num-tabular">{pos.lots || 1}L</td>
                                  <td className="px-5 py-4 text-xs text-[var(--grey)]">{formatDuration(pos.opened_at, pos.closed_at) || '—'}</td>
                                  <td className="px-5 py-4">
                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--raise)] text-[var(--grey)]">
                                      {pos.close_reason ? pos.close_reason.replace(/_/g, ' ') : 'Closed'}
                                    </span>
                                  </td>
                                  <td className={`px-5 py-4 text-right font-bold num-tabular ${
                                    pos.realizedPnl > 0 ? 'text-[var(--pine)]' : pos.realizedPnl < 0 ? 'text-[var(--clay)]' : ''
                                  }`}>
                                    {pos.realizedPnl > 0 ? '+' : ''}{fmt(pos.realizedPnl)}
                                  </td>
                                  <td className="px-5 py-4 text-xs text-[var(--grey)]">{formatTradeDate(pos.closed_at)}</td>
                                </tr>
                              );
                            })}
                            {(historyLoading || closedPositions.length === 0) && (
                              <tr>
                                <td colSpan={7} className="px-5 py-10 text-center text-[var(--grey)]">
                                  {historyLoading ? 'Loading execution records…' : 'No closed trades recorded.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <nav aria-label="Trade history pages" className="p-4 border-t border-[var(--hair)] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span>{historyTotal ? `${historyPage * 50 + 1}–${Math.min((historyPage + 1) * 50, historyTotal)} of ${historyTotal}` : '0 trades'} · Page {historyPage + 1}</span>
                        <div className="flex gap-2">
                          <button
                            disabled={historyPage === 0 || historyLoading}
                            onClick={() => changeHistoryPage(historyPage - 1)}
                            className="px-3 py-1.5 rounded border border-[var(--hair)] bg-[var(--paper-2)] disabled:opacity-40 font-semibold"
                          >
                            Previous
                          </button>
                          <button
                            disabled={(historyPage + 1) * 50 >= historyTotal || historyLoading}
                            onClick={() => changeHistoryPage(historyPage + 1)}
                            className="px-3 py-1.5 rounded border border-[var(--hair)] bg-[var(--paper-2)] disabled:opacity-40 font-semibold"
                          >
                            Next
                          </button>
                        </div>
                      </nav>
                    </>
                  )}

                  {/* OPEN TAB */}
                  {ledgerTab === 'open' && (
                    <div className="p-6">
                      {openPositions.length === 0 ? (
                        <div className="text-center py-10 text-[var(--grey)] text-sm">
                          No open positions currently active.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {openPositions.map(pos => (
                            <div key={pos.id} className="p-4 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] flex items-center justify-between">
                              <div>
                                <div className="font-bold">{pos.underlying || 'BTC'} Options Strangle ({pos.lots} lots)</div>
                                <div className="text-xs text-[var(--grey)] mt-0.5">Opened: {formatTradeDate(pos.opened_at)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-[var(--grey)]">Unrealized P&L</div>
                                <div className={`text-lg font-bold ${pos.actualPnl > 0 ? 'text-[var(--pine)]' : pos.actualPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                                  {pos.actualPnl > 0 ? '+' : ''}{fmt(pos.actualPnl)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* RESTING TAB */}
                  {ledgerTab === 'resting' && (
                    <div className="p-8 text-center text-[var(--grey)] text-sm">
                      <Clock className="w-8 h-8 opacity-40 mx-auto mb-2" />
                      No resting limit orders currently pending on Delta Exchange.
                    </div>
                  )}

                  {/* REJECTED TAB */}
                  {ledgerTab === 'rejected' && (
                    <div className="p-6">
                      {rejectedTrades.length === 0 ? (
                        <div className="text-center py-8 text-[var(--grey)] text-sm">
                          No rejected trades or anomaly events recorded.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rejectedTrades.map(pos => (
                            <div key={pos.id} className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs flex items-center justify-between">
                              <div>
                                <span className="font-bold text-rose-500">{pos.underlying || 'BTC'} Entry Event</span>
                                <p className="text-[var(--grey)] mt-0.5">Status: {pos.status} · {formatTradeDate(pos.opened_at)}</p>
                              </div>
                              <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 font-semibold">
                                {pos.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 3: LIVE TRADING (Dedicated Real-Time Execution Control)           */}
            {/* ========================================================================= */}
            {section === 'trading' && (
              <div className="space-y-6">
                {/* Live Trading Control Banner */}
                <GlassCard className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4" style={{
                  borderLeftColor: statusState === 'active' ? 'var(--pine)' : statusState === 'paused' ? 'var(--orange)' : 'var(--clay)'
                }}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                      statusState === 'active' ? 'bg-emerald-500/10 text-[var(--pine)]' :
                      statusState === 'paused' ? 'bg-amber-500/10 text-[var(--orange)]' : 'bg-rose-500/10 text-[var(--clay)]'
                    }`}>
                      {statusState === 'active' ? <Activity className="w-6 h-6" /> : statusState === 'paused' ? <Pause className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{statusText}</span>
                        <span className={`w-2 h-2 rounded-full animate-pulse ${statusState === 'active' ? 'bg-emerald-500' : statusState === 'paused' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      </div>
                      <p className="text-xs text-[var(--grey)]">{statusDesc}</p>
                    </div>
                  </div>

                  <button
                    onClick={handlePauseToggle}
                    className={`w-full sm:w-auto min-h-11 justify-center shrink-0 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
                      isPaused
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                    }`}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Resume Automation' : 'Pause New Trades'}
                  </button>
                </GlassCard>

                {/* Active Positions */}
                <h2 className="text-lg font-bold">Monitored Open Positions ({openPositions.length})</h2>
                {openPositions.length === 0 ? (
                  <GlassCard variant="subtle" className="p-8 text-center flex flex-col items-center">
                    <ShieldCheck className="w-12 h-12 text-[var(--grey)] opacity-50 mb-3" />
                    <h3 className="font-semibold text-lg mb-1">No Open Positions</h3>
                    <p className="text-xs text-[var(--grey)] max-w-md">
                      The autonomous engine is searching for high-probability strangle setups. When an entry triggers, live details and kill-switches will appear here.
                    </p>
                  </GlassCard>
                ) : (
                  <div className="space-y-4">
                    {openPositions.map(pos => {
                      const callStrike = pos.short_call_strike || (pos.short_call_symbol ? pos.short_call_symbol.split('-')[2] : '—');
                      const putStrike = pos.short_put_strike || (pos.short_put_symbol ? pos.short_put_symbol.split('-')[2] : '—');
                      const callEntry = pos.fillDetails?.[pos.short_call_symbol]?.entry;
                      const putEntry = pos.fillDetails?.[pos.short_put_symbol]?.entry;

                      return (
                        <GlassCard key={pos.id} className="p-5 border-l-4 border-l-emerald-500">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-lg">{pos.underlying || 'BTC'} Options Strangle</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  {pos.lots || 1} LOT
                                </span>
                              </div>
                              <div className="text-xs text-[var(--grey)]">Opened {formatTradeDate(pos.opened_at)}</div>
                            </div>
                            <div className="flex items-center gap-6 text-right">
                              <div>
                                <div className="text-xs text-[var(--grey)] font-medium mb-0.5">Peak P&L</div>
                                <div className="text-base sm:text-lg font-bold text-[var(--pine)] num-tabular">
                                  +{fmt(pos.peakPnl)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-[var(--grey)] font-medium mb-0.5">Floating P&L</div>
                                <div className={`text-base sm:text-lg font-bold num-tabular ${pos.actualPnl > 0 ? 'text-[var(--pine)]' : pos.actualPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                                  {pos.actualPnl > 0 ? '+' : ''}{fmt(pos.actualPnl)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Line-by-line strike details */}
                          <div className="mt-4 pt-4 border-t border-[var(--hair)] space-y-2">
                            <div className="flex flex-wrap items-center justify-between p-2.5 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-xs">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">CALL LEG</span>
                                <span className="font-mono font-bold text-[var(--ink)]">{pos.short_call_symbol || '—'}</span>
                              </div>
                              <div className="flex items-center gap-4 text-[var(--grey)]">
                                <span>Strike: <strong className="text-[var(--ink)]">${Number(callStrike).toLocaleString()}</strong></span>
                                <span>Entry Fill: <strong className="text-[var(--ink)]">{callEntry != null ? `$${callEntry} USD` : 'Recorded'}</strong></span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between p-2.5 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-xs">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">PUT LEG</span>
                                <span className="font-mono font-bold text-[var(--ink)]">{pos.short_put_symbol || '—'}</span>
                              </div>
                              <div className="flex items-center gap-4 text-[var(--grey)]">
                                <span>Strike: <strong className="text-[var(--ink)]">${Number(putStrike).toLocaleString()}</strong></span>
                                <span>Entry Fill: <strong className="text-[var(--ink)]">{putEntry != null ? `$${putEntry} USD` : 'Recorded'}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-[var(--hair)] flex items-center justify-between">
                            <div className="text-xs text-[var(--grey)]">
                              Total Credit: <strong className="text-[var(--pine)]">{pos.credit_received ? fmt(Number(pos.credit_received)) : '—'}</strong>
                            </div>

                            <button
                              onClick={() => handleKillSwitch(pos.id)}
                              disabled={!!pos.manual_exit_requested}
                              className="px-3 py-1.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              {pos.manual_exit_requested ? 'Exit Requested' : 'Emergency Close'}
                            </button>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 4: ANALYTICS                                                      */}
            {/* ========================================================================= */}
            {section === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <GlassCard className="p-5">
                    <div className="text-xs text-[var(--grey)] font-semibold uppercase mb-1">Total Net Realized P&L</div>
                    <div className={`text-3xl font-black num-tabular ${metrics.totalPnl > 0 ? 'text-[var(--pine)]' : metrics.totalPnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                      {metrics.totalPnl > 0 ? '+' : ''}{fmt(metrics.totalPnl)}
                    </div>
                  </GlassCard>
                  <GlassCard className="p-5">
                    <div className="text-xs text-[var(--grey)] font-semibold uppercase mb-1">Win Rate (Hit Rate)</div>
                    <div className="text-3xl font-black num-tabular">{metrics.hitRate}%</div>
                  </GlassCard>
                  <GlassCard className="p-5">
                    <div className="text-xs text-[var(--grey)] font-semibold uppercase mb-1">Total Strategy Trades</div>
                    <div className="text-3xl font-black num-tabular">{metrics.roundTrips}</div>
                  </GlassCard>
                </div>

                {/* Monthly breakdown table */}
                <GlassCard className="p-6">
                  <h2 className="text-base font-bold mb-4">Monthly Performance History</h2>
                  <div className="space-y-3">
                    {monthlyBreakdown.map(m => (
                      <div key={m.key} className="flex items-center justify-between p-3 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-sm">
                        <span className="font-bold">{m.label}</span>
                        <div className="flex items-center gap-6">
                          <span className="text-xs text-[var(--grey)]">{m.count} trades ({m.count > 0 ? Math.round((m.winners / m.count) * 100) : 0}% win rate)</span>
                          <span className={`font-bold num-tabular ${m.pnl > 0 ? 'text-[var(--pine)]' : m.pnl < 0 ? 'text-[var(--clay)]' : ''}`}>
                            {m.pnl > 0 ? '+' : ''}{fmt(m.pnl)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {monthlyBreakdown.length === 0 && (
                      <div className="text-center py-6 text-xs text-[var(--grey)]">No monthly history accumulated yet.</div>
                    )}
                  </div>
                </GlassCard>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 5: RISK CENTER                                                    */}
            {/* ========================================================================= */}
            {section === 'risk' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassCard className="p-5 border-l-4 border-l-emerald-500">
                    <div className="text-xs font-semibold text-[var(--grey)] uppercase mb-2">Margin Utilization</div>
                    <div className="text-2xl font-bold num-tabular mb-3">
                      {Number.isFinite(marginUsed) ? `${marginUsed.toFixed(1)}%` : 'Unavailable'}
                    </div>
                    <div className="w-full bg-[var(--raise)] rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${Number.isFinite(marginUsed) ? Math.max(0, Math.min(100, marginUsed)) : 0}%` }}
                      />
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5 border-l-4 border-l-emerald-500">
                    <div className="text-xs font-semibold text-[var(--grey)] uppercase mb-2">Exchange Telemetry</div>
                    <div className="text-xl font-bold">{Number.isFinite(marginUsed) ? 'Confirmed Active' : 'Pending Update'}</div>
                    <p className="text-xs text-[var(--grey)] mt-1">Live balances and margin requirements are verified directly against Delta Exchange.</p>
                  </GlassCard>
                </div>

                <MacroCalendarPanel info={macroInfo} />
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 6: BILLING & INVOICES                                            */}
            {/* ========================================================================= */}
            {section === 'billing' && <BillingList />}

            {/* ========================================================================= */}
            {/* SECTION 7: SETTINGS LINK CARD                                            */}
            {/* ========================================================================= */}
            {section === 'settings' && (
              <GlassCard className="p-8 text-center flex flex-col items-center">
                <Settings className="w-12 h-12 text-[var(--grey)] opacity-50 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Account & Billing Settings</h3>
                <p className="text-xs text-[var(--grey)] max-w-md mx-auto">
                  Configure your exchange API credentials, IP whitelists, and notification preferences in the dedicated settings view.
                </p>
                <div className="mt-6 flex gap-4">
                  <Link href="/dashboard/settings" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors">
                    Open Settings
                  </Link>
                  <Link href="/dashboard/billing" className="px-4 py-2 bg-[var(--raise)] hover:bg-[var(--raise-2)] border border-[var(--hair)] rounded-lg text-xs font-bold transition-colors">
                    View Invoices
                  </Link>
                </div>
              </GlassCard>
            )}

          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile dashboard"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--hair-2)] bg-[var(--paper)] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] grid grid-cols-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
      >
        {([
          { id: 'dashboard', label: 'Overview', icon: Home },
          { id: 'trading', label: 'Trading', icon: Activity },
          { id: 'history', label: 'Ledger', icon: History },
        ] as const).map(item => (
          <a
            key={item.id}
            href={sectionHref(item.id)}
            onClick={event => navigateSection(event, item.id)}
            aria-current={section === item.id ? 'page' : undefined}
            className={`min-h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${
              section === item.id ? 'bg-[var(--emerald-tint)] text-[var(--indigo)]' : 'text-[var(--grey)]'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </a>
        ))}
        <button
          onClick={() => setSidebarOpen(true)}
          aria-expanded={sidebarOpen}
          aria-controls="dashboard-navigation"
          className="min-h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-[var(--grey)]"
        >
          <Menu className="h-5 w-5" />
          More
        </button>
      </nav>
    </div>
  );
}

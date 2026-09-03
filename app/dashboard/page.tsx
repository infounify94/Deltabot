'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { 
  Activity, 
  Play, 
  Pause, 
  ShieldAlert, 
  Menu,
  X,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Home,
  Layers,
  History,
  TrendingUp,
  Radio,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Clock,
  Calendar,
  Sparkles,
  ExternalLink,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

type DashboardSection = 
  | 'dashboard'
  | 'positions'
  | 'trade_history'
  | 'performance'
  | 'automation'
  | 'account_health'
  | 'billing';

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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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
  const [positionsTab, setPositionsTab] = useState<'open' | 'closed'>('open');
  const [askPilotOpen, setAskPilotOpen] = useState(false);
  const [activeAiQuery, setActiveAiQuery] = useState<string | null>(null);

  // Currency Formatter
  const fmt = (usdAmount: number, forceDecimals = true) => {
    if (currency === 'INR') {
      const inr = usdAmount * fxRate;
      return `₹${inr.toLocaleString('en-IN', { minimumFractionDigits: forceDecimals ? 2 : 0, maximumFractionDigits: forceDecimals ? 2 : 0 })}`;
    }
    return `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: forceDecimals ? 2 : 0, maximumFractionDigits: forceDecimals ? 2 : 0 })}`;
  };

  // Safe Date Formatter (Prevents 1970 / Invalid Date bugs)
  const formatTradeDate = (closedAt?: string | null, fallbackOpenedAt?: string | null) => {
    const rawDate = closedAt || fallbackOpenedAt;
    if (!rawDate) return 'Recent';
    const d = new Date(rawDate);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return 'Recent';
    
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;
    return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, ${timeStr}`;
  };

  // Trade Duration Formatter
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

  // Human-Readable Exit Reason Badge
  const getExitReasonBadge = (reason?: string | null) => {
    const r = (reason || '').toLowerCase();
    if (r.includes('profit_take') || r.includes('ratchet')) {
      return { 
        label: 'Take Profit (Ratchet)', 
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
      };
    }
    if (r.includes('stop_loss')) {
      return { 
        label: 'Risk Cut (Stop Loss)', 
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' 
      };
    }
    if (r.includes('time_exit') || r.includes('expiry')) {
      return { 
        label: 'Expiry Settlement', 
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
      };
    }
    if (r.includes('manual') || r.includes('kill_switch')) {
      return { 
        label: 'Manual Eject', 
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
      };
    }
    if (r.includes('reconcil')) {
      return { 
        label: 'Auto-Reconciled', 
        bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' 
      };
    }
    return { 
      label: 'Closed', 
      bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' 
    };
  };

  // Theme Toggler
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

  const toggleExpand = (id: number | string) => {
    const newSet = new Set(expandedPositionIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedPositionIds(newSet);
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

  // Fetch Macro News Status
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
      
      if (!user) {
        setLoading(false);
        return;
      }
      setUserEmail(user.email || '');
      setUserId(user.id);

      const { data: profilePause } = await supabase
        .from('profiles')
        .select('is_paused')
        .eq('id', user.id)
        .single();
      setIsPaused(profilePause?.is_paused || false);

      const { data: invs } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      setInvoices(invs || []);

      const { data: openData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'adjusted']);

      const { data: closedData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'closed')
        .order('closed_at', { ascending: false });

      const posIds = [...(openData || []), ...(closedData || [])].map((p: any) => p.id);
      const { data: eventsData } = posIds.length > 0 
        ? await supabase.from('trade_events').select('*').in('position_id', posIds) 
        : { data: [] };

      let liveBalance = 0;
      const { data: profile } = await supabase.from('profiles').select('live_balance, is_admin').eq('id', user.id).single();
      if (profile?.live_balance) {
        liveBalance = parseFloat(profile.live_balance);
      }
      if (profile?.is_admin) {
        setIsAdmin(true);
      }

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

      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      const todayClosed = processedClosed.filter(p => {
        const d = p.closed_at ? new Date(p.closed_at) : (p.opened_at ? new Date(p.opened_at) : null);
        return d && d >= todayMidnight;
      });
      const todayPnl = todayClosed.reduce((sum, p) => sum + p.realizedPnl, 0);
      
      setMetrics({ roundTrips, winners, hitRate, totalPnl, todayPnl, liveBalance });
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    fetchMacroStatus();
    const interval = setInterval(() => {
      fetchData();
      fetchMacroStatus();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handlePauseToggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nextPause = !isPaused;
    setIsPaused(nextPause);
    await supabase.from('profiles').update({ is_paused: nextPause }).eq('id', user.id);
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

  // Calculated metrics
  const openPnl = useMemo(() => {
    return openPositions.reduce((acc, pos) => acc + (pos.actualPnl || 0), 0);
  }, [openPositions]);

  const totalPositionMargin = useMemo(() => {
    return openPositions.reduce((acc, pos) => {
      return acc + (pos.lots || 1) * 2.0;
    }, 0);
  }, [openPositions]);

  const availableMargin = Math.max(0, metrics.liveBalance - totalPositionMargin);
  const marginUsed = metrics.liveBalance > 0 ? (totalPositionMargin / metrics.liveBalance) * 100 : 0;
  
  const thisMonthPnl = useMemo(() => {
    const now = new Date();
    return closedPositions
      .filter(p => {
        const d = p.closed_at ? new Date(p.closed_at) : (p.opened_at ? new Date(p.opened_at) : null);
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + p.realizedPnl, 0);
  }, [closedPositions]);

  const simplifiedAiQueries = [
    {
      q: "Why isn't ProfitPilot trading right now?",
      a: macroInfo?.is_blocked 
        ? macroInfo.blackout_reason 
        : `ProfitPilot is actively monitoring the market. Market safety gates require calm volatility and favorable spreads before committing your capital.`
    },
    {
      q: "How does the Macro News Shield protect my account?",
      a: `Before high-impact US economic events (like Federal Reserve speeches or CPI reports), market volatility causes sudden whipsaws. ProfitPilot automatically pauses new entries 2 hours before the event and resumes 1 hour after the market stabilizes.`
    },
    {
      q: "Are my open positions safe?",
      a: `Yes. All active positions are tracked continuously every 5 seconds. If price approaches a stop-loss or delta threshold, our automated risk engine executes an immediate market exit to cap risk.`
    },
    {
      q: "How is my profit locked in?",
      a: `Our automated Trailing Ratchet activates as soon as your trade gains 30% profit. It locks in a rising floor so that a winning trade is never allowed to turn into a losing trade.`
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans flex flex-col selection:bg-[#d97706]/15">
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 glass-header px-4 sm:px-8 py-3 flex items-center justify-between border-b border-[var(--hair)]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setSection('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-sm">
              <Activity className="text-white w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-base tracking-tight text-[var(--ink)]">Profit</span>
              <span className="font-semibold text-base tracking-tight text-[#d97706]">Pilot</span>
            </div>
          </Link>
        </div>

        {/* Live Bot Status Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[var(--paper-2)] border border-[var(--hair)] px-3 py-1.5 rounded-full text-xs">
          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
          <span className="font-medium text-[var(--ink)]">
            {isPaused ? 'Automation Paused' : 'Automation Active'}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="bg-[var(--paper-2)] p-0.5 rounded-lg border border-[var(--hair)] flex items-center text-xs font-medium">
            <button 
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1 rounded transition-all ${currency === 'INR' ? 'bg-[#d97706] text-white shadow-sm font-semibold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >
              ₹ INR
            </button>
            <button 
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded transition-all ${currency === 'USD' ? 'bg-[#d97706] text-white shadow-sm font-semibold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >
              $ USD
            </button>
          </div>

          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] flex items-center justify-center text-[var(--grey)] hover:text-[var(--ink)] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="hidden sm:block text-xs font-medium text-rose-600 hover:text-rose-700 transition bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Crypto & Bot Intelligence Ticker */}
      <div className="bg-[var(--paper-2)] border-b border-[var(--hair)] py-2.5 px-4 sm:px-8 text-xs font-mono text-[var(--ink)]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium shrink-0">
              <span className="text-amber-500 font-bold">BTC</span> ${btcPrice.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 font-medium shrink-0">
              <span className="text-blue-500 font-bold">ETH</span> ${ethPrice.toLocaleString()}
            </span>
            {macroInfo?.is_blocked ? (
              <span className="flex items-center gap-2 text-amber-600 font-semibold shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Macro Shield Active: {macroInfo.active_event?.title}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-emerald-600 font-medium shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                All Safety Gates Clear
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--grey)] hidden md:block shrink-0">
            Delta Exchange Options Execution
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[var(--paper-2)] border-r border-[var(--hair)] transform transition-transform duration-200 lg:translate-x-0 lg:sticky lg:top-[98px] lg:h-[calc(100vh-98px)] flex flex-col justify-between shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 space-y-6 overflow-y-auto text-xs">
            
            {/* NAVIGATION */}
            <div>
              <div className="text-[11px] font-semibold text-[var(--faint)] px-2.5 mb-1.5 uppercase tracking-wider">Trading</div>
              <div className="space-y-1">
                <button
                  onClick={() => { setSection('dashboard'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${section === 'dashboard' ? 'bg-[#d97706] text-white shadow-subtle' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
                >
                  <Home className="w-4 h-4" /> Overview
                </button>
                <button
                  onClick={() => { setSection('positions'); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${section === 'positions' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
                >
                  <span className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4" /> Active Positions
                  </span>
                  {openPositions.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
                      {openPositions.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setSection('trade_history'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${section === 'trade_history' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
                >
                  <History className="w-4 h-4" /> Trade History
                </button>
                <button
                  onClick={() => { setSection('performance'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${section === 'performance' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
                >
                  <TrendingUp className="w-4 h-4" /> Performance
                </button>
              </div>
            </div>

            {/* CONTROLS & SETTINGS */}
            <div>
              <div className="text-[11px] font-semibold text-[var(--faint)] px-2.5 mb-1.5 uppercase tracking-wider">Account</div>
              <div className="space-y-1">
                <button
                  onClick={() => { setSection('automation'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${section === 'automation' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
                >
                  <Zap className="w-4 h-4" /> Automation & Risk
                </button>
                <button
                  onClick={() => { setSection('account_health'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${section === 'account_health' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
                >
                  <ShieldCheck className="w-4 h-4" /> Account Health
                </button>
                <button
                  onClick={() => { setSection('billing'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${section === 'billing' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
                >
                  <Calendar className="w-4 h-4" /> Invoices
                </button>
                <Link href="/dashboard/settings" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)] transition-all">
                  <Settings className="w-4 h-4" /> API Settings
                </Link>
                <Link href="/dashboard/help" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)] transition-all">
                  <HelpCircle className="w-4 h-4" /> Help & Support
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all mt-3 border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4" /> Admin Master Suite
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-[var(--hair)] bg-[var(--paper)]">
            <div className="text-xs text-[var(--grey)] truncate">
              Connected: <strong className="text-[var(--ink)] font-medium">{userEmail}</strong>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* SECTION: DASHBOARD OVERVIEW */}
          {section === 'dashboard' && (
            <div className="space-y-6">
              
              {/* LIVE MACROECONOMIC INTELLIGENCE BANNER */}
              {macroInfo?.is_blocked ? (
                <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-600 dark:text-amber-400">
                        <Radio className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm sm:text-base text-[var(--ink)]">
                            Macro Shield Active: {macroInfo.active_event?.title}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                            Standby
                          </span>
                        </div>
                        <p className="text-xs text-[var(--grey)] mt-1.5 max-w-2xl leading-relaxed">
                          {macroInfo.blackout_reason}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--hair)] flex sm:flex-col justify-between items-center sm:items-end">
                      <span className="text-[11px] font-medium text-[var(--grey)]">Resumes At</span>
                      <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 sm:mt-0.5">
                        {macroInfo.blackout_end_ist}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between gap-3 shadow-subtle">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-[var(--ink)]">
                        All Safety Shields Operational — Live Volatility Normal
                      </span>
                      <p className="text-[11px] text-[var(--grey)] mt-0.5 hidden sm:block">
                        ProfitPilot is actively scanning BTC, ETH & XAUT orderbooks for delta-neutral strangle opportunities.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold shrink-0 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    Scanning
                  </span>
                </div>
              )}

              {/* CORE METRICS GRID (Responsive 2x2 on Mobile, 4-col Desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <SpotlightCard className="p-4 sm:p-5 space-y-1 shadow-subtle">
                  <div className="text-[11px] font-medium text-[var(--grey)] uppercase tracking-wider">Account Balance</div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--ink)] mt-1 num-tabular">
                    {fmt(metrics.liveBalance)}
                  </div>
                  <div className="text-[10px] text-[var(--grey)] pt-0.5">Non-custodial in Delta wallet</div>
                </SpotlightCard>

                <SpotlightCard className="p-4 sm:p-5 space-y-1 shadow-subtle">
                  <div className="text-[11px] font-medium text-[var(--grey)] uppercase tracking-wider">Today's P&amp;L</div>
                  <div className={`font-mono text-xl sm:text-2xl font-bold mt-1 num-tabular ${metrics.todayPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {metrics.todayPnl >= 0 ? '+' : ''}{fmt(metrics.todayPnl)}
                  </div>
                  <div className="text-[10px] text-[var(--grey)] pt-0.5">Realized net profit today</div>
                </SpotlightCard>

                <SpotlightCard className="p-4 sm:p-5 space-y-1 shadow-subtle">
                  <div className="text-[11px] font-medium text-[var(--grey)] uppercase tracking-wider">Total Realized P&amp;L</div>
                  <div className={`font-mono text-xl sm:text-2xl font-bold mt-1 num-tabular ${metrics.totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {metrics.totalPnl >= 0 ? '+' : ''}{fmt(metrics.totalPnl)}
                  </div>
                  <div className="text-[10px] text-[var(--grey)] pt-0.5">{metrics.roundTrips} completed trades ({metrics.hitRate}% win rate)</div>
                </SpotlightCard>

                <SpotlightCard className="p-4 sm:p-5 space-y-1 shadow-subtle">
                  <div className="text-[11px] font-medium text-[var(--grey)] uppercase tracking-wider">Automation Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className={`text-base sm:text-lg font-bold ${isPaused ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {isPaused ? 'Paused' : 'Active'}
                    </span>
                  </div>
                  <button 
                    onClick={handlePauseToggle} 
                    className="text-[10px] font-semibold text-[#d97706] hover:underline pt-0.5 block"
                  >
                    {isPaused ? 'Click to Resume' : 'Click to Pause'}
                  </button>
                </SpotlightCard>
              </div>

              {/* ACTIVE POSITIONS SECTION */}
              <div className="fintech-card p-4 sm:p-6 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-[var(--ink)]">Active Positions</h3>
                    <p className="text-xs text-[var(--grey)] mt-0.5">Live options strangles currently monitored by our risk engine.</p>
                  </div>
                  <span className="font-mono text-xs text-[var(--grey)] bg-[var(--paper-2)] px-2.5 py-1 rounded-md border border-[var(--hair)]">
                    {openPositions.length} Open
                  </span>
                </div>

                {openPositions.length === 0 ? (
                  <div className="text-center text-[var(--grey)] text-xs sm:text-sm py-8 px-4 bg-[var(--paper-2)] rounded-xl border border-[var(--hair)] space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--hair)] flex items-center justify-center mx-auto text-[var(--grey)]">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="font-medium text-[var(--ink)]">No active trades running</div>
                    <p className="max-w-md mx-auto text-[var(--grey)] text-xs">
                      {macroInfo?.is_blocked 
                        ? `New entries are paused during ${macroInfo.active_event?.title}. The bot will seek setups once the blackout window ends.`
                        : 'ProfitPilot is scanning order books and will open a trade when conditions match our 65%+ Probability of Profit threshold.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {openPositions.map((pos) => {
                      const expanded = expandedPositionIds.has(pos.id);
                      return (
                        <div key={pos.id} className="bg-[var(--paper-2)] border border-[var(--hair)] rounded-xl overflow-hidden text-xs transition-all shadow-xs">
                          {/* Main Row */}
                          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[var(--ink)]">{pos.underlying || 'BTC'} Strangle</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                  Live Delta-Neutral
                                </span>
                              </div>
                              <div className="text-[var(--grey)] flex flex-wrap items-center gap-3">
                                <span>Expiry: <strong className="text-[var(--ink)]">{new Date(pos.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</strong></span>
                                <span>Lots: <strong className="text-[var(--ink)]">{pos.lots}</strong></span>
                                <span>Opened: <strong className="text-[var(--ink)]">{formatTradeDate(null, pos.opened_at)}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--hair)]">
                              <div className="text-left sm:text-right">
                                <div className="text-[10px] uppercase tracking-wider text-[var(--grey)]">Unrealized P&amp;L</div>
                                <div className={`font-mono text-base font-bold ${pos.actualPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {pos.actualPnl >= 0 ? '+' : ''}{fmt(pos.actualPnl)}
                                </div>
                              </div>
                              
                              {!pos.manual_exit_requested ? (
                                <button 
                                  onClick={() => handleKillSwitch(pos.id)} 
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition"
                                >
                                  Emergency Close
                                </button>
                              ) : (
                                <span className="text-xs font-semibold text-rose-600 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 animate-pulse">
                                  Closing at Market...
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Details Toggle */}
                          <div className="px-4 py-2.5 bg-[var(--card)] border-t border-[var(--hair)] flex items-center justify-between">
                            <button 
                              onClick={() => toggleExpand(pos.id)} 
                              className="text-xs font-medium text-[#d97706] flex items-center gap-1 hover:underline"
                            >
                              {expanded ? 'Hide Strike Details' : 'View Strike Details'}
                              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-[11px] text-[var(--grey)]">
                              Auto-defended by 1.75x Stop &amp; Trailing Ratchet
                            </span>
                          </div>

                          {/* Expanded Details */}
                          {expanded && (
                            <div className="p-4 bg-[var(--paper)] border-t border-[var(--hair)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                              <div>
                                <div className="text-[var(--grey)] mb-0.5">Short Call Strike</div>
                                <div className="font-mono font-semibold text-[var(--ink)]">{pos.short_call_strike ? `$${pos.short_call_strike}` : pos.short_call_symbol}</div>
                                <div className="text-[10px] text-[var(--grey)]">Entry: {pos.callEntry}</div>
                              </div>
                              <div>
                                <div className="text-[var(--grey)] mb-0.5">Short Put Strike</div>
                                <div className="font-mono font-semibold text-[var(--ink)]">{pos.short_put_strike ? `$${pos.short_put_strike}` : pos.short_put_symbol}</div>
                                <div className="text-[10px] text-[var(--grey)]">Entry: {pos.putEntry}</div>
                              </div>
                              <div>
                                <div className="text-[var(--grey)] mb-0.5">Total Credit Collected</div>
                                <div className="font-mono font-semibold text-emerald-600">{fmt(parseFloat(pos.credit_received || 0))}</div>
                                <div className="text-[10px] text-[var(--grey)]">Max potential profit</div>
                              </div>
                              <div>
                                <div className="text-[var(--grey)] mb-0.5">Peak Profit Tracked</div>
                                <div className="font-mono font-semibold text-emerald-600">+{fmt(pos.peakPnl)}</div>
                                <div className="text-[10px] text-[var(--grey)]">Ratchet activates @ 30%</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RECENT COMPLETED TRADES (Mobile Cards + Desktop Table) */}
              <div className="fintech-card p-4 sm:p-6 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-[var(--ink)]">Recent Completed Trades</h3>
                    <p className="text-xs text-[var(--grey)] mt-0.5">Realized performance from your latest executions.</p>
                  </div>
                  <button 
                    onClick={() => setSection('trade_history')} 
                    className="text-xs text-[#d97706] font-semibold hover:underline flex items-center gap-1"
                  >
                    View All &rarr;
                  </button>
                </div>

                {closedPositions.length === 0 ? (
                  <div className="text-center text-[var(--grey)] text-xs py-8 bg-[var(--paper-2)] rounded-xl border border-[var(--hair)]">
                    No closed trades recorded yet.
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="border-b border-[var(--hair)] text-[var(--grey)]">
                          <tr>
                            <th className="py-2.5 font-medium">Date &amp; Time</th>
                            <th className="py-2.5 font-medium">Instrument</th>
                            <th className="py-2.5 font-medium">Strikes</th>
                            <th className="py-2.5 font-medium">Duration</th>
                            <th className="py-2.5 font-medium">Exit Reason</th>
                            <th className="py-2.5 font-medium text-right">Net Return</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--hair)]">
                          {closedPositions.slice(0, 6).map((pos) => {
                            const badge = getExitReasonBadge(pos.close_reason);
                            const duration = formatDuration(pos.opened_at, pos.closed_at);
                            return (
                              <tr key={pos.id} className="hover:bg-[var(--paper-2)] transition-colors">
                                <td className="py-3 text-[var(--grey)] whitespace-nowrap">
                                  {formatTradeDate(pos.closed_at, pos.opened_at)}
                                </td>
                                <td className="py-3 font-medium text-[var(--ink)]">
                                  {pos.underlying || 'BTC'} Options
                                </td>
                                <td className="py-3 font-mono text-[var(--grey)]">
                                  {pos.short_call_strike && pos.short_put_strike ? (
                                    <span>C-{pos.short_call_strike} / P-{pos.short_put_strike}</span>
                                  ) : (
                                    <span>{pos.lots} Lots</span>
                                  )}
                                </td>
                                <td className="py-3 text-[var(--grey)] font-mono">
                                  {duration || '—'}
                                </td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                                    {badge.label}
                                  </span>
                                </td>
                                <td className={`py-3 text-right font-mono font-bold ${pos.realizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {pos.realizedPnl >= 0 ? '+' : ''}{fmt(pos.realizedPnl)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="sm:hidden space-y-3">
                      {closedPositions.slice(0, 5).map((pos) => {
                        const badge = getExitReasonBadge(pos.close_reason);
                        const duration = formatDuration(pos.opened_at, pos.closed_at);
                        return (
                          <div key={pos.id} className="p-3.5 bg-[var(--paper-2)] rounded-xl border border-[var(--hair)] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-[var(--ink)]">{pos.underlying || 'BTC'} Options Strangle</span>
                              <span className={`font-mono text-xs font-bold ${pos.realizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {pos.realizedPnl >= 0 ? '+' : ''}{fmt(pos.realizedPnl)}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--grey)] flex items-center justify-between">
                              <span>{formatTradeDate(pos.closed_at, pos.opened_at)}</span>
                              {duration && <span>Duration: {duration}</span>}
                            </div>
                            <div className="pt-1 flex items-center justify-between border-t border-[var(--hair)]">
                              <span className="font-mono text-[11px] text-[var(--grey)]">
                                {pos.short_call_strike ? `C-${pos.short_call_strike} / P-${pos.short_put_strike}` : `${pos.lots} Lots`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

            </div>
          )}

          {/* SECTION: ACTIVE POSITIONS TAB */}
          {section === 'positions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Positions Manager</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">Real-time status of current and completed options trades.</p>
              </div>

              <div className="flex gap-2 border-b border-[var(--hair)] pb-3 text-xs">
                <button 
                  onClick={() => setPositionsTab('open')} 
                  className={`px-3.5 py-2 rounded-lg font-medium transition ${positionsTab === 'open' ? 'bg-[#d97706] text-white shadow-xs' : 'bg-[var(--paper-2)] text-[var(--grey)] border border-[var(--hair)]'}`}
                >
                  Open Positions ({openPositions.length})
                </button>
                <button 
                  onClick={() => setPositionsTab('closed')} 
                  className={`px-3.5 py-2 rounded-lg font-medium transition ${positionsTab === 'closed' ? 'bg-[#d97706] text-white shadow-xs' : 'bg-[var(--paper-2)] text-[var(--grey)] border border-[var(--hair)]'}`}
                >
                  Closed Positions ({closedPositions.length})
                </button>
              </div>

              {positionsTab === 'open' && (
                <div className="space-y-4">
                  {openPositions.length === 0 ? (
                    <div className="text-center text-[var(--grey)] text-xs p-8 bg-[var(--paper-2)] rounded-xl border border-[var(--hair)]">
                      No active positions running. ProfitPilot is monitoring the market.
                    </div>
                  ) : (
                    openPositions.map(pos => (
                      <div key={pos.id} className="fintech-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-sm text-[var(--ink)]">{pos.underlying || 'BTC'} Options Strangle</div>
                            <div className="text-xs text-[var(--grey)] mt-0.5">Expiry: {new Date(pos.expiry_date).toLocaleDateString()}</div>
                          </div>
                          <div className={`font-mono font-bold text-base ${pos.actualPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {pos.actualPnl >= 0 ? '+' : ''}{fmt(pos.actualPnl)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[var(--paper-2)] rounded-lg text-xs">
                          <div>
                            <div className="text-[var(--grey)]">Call Strike / Entry</div>
                            <div className="font-mono font-medium text-[var(--ink)]">{pos.short_call_strike || 'N/A'} ({pos.callEntry})</div>
                          </div>
                          <div>
                            <div className="text-[var(--grey)]">Put Strike / Entry</div>
                            <div className="font-mono font-medium text-[var(--ink)]">{pos.short_put_strike || 'N/A'} ({pos.putEntry})</div>
                          </div>
                          <div>
                            <div className="text-[var(--grey)]">Credit Received</div>
                            <div className="font-mono font-medium text-emerald-600">{fmt(parseFloat(pos.credit_received || 0))}</div>
                          </div>
                          <div>
                            <div className="text-[var(--grey)]">Lots Sized</div>
                            <div className="font-mono font-medium text-[var(--ink)]">{pos.lots} lots</div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleKillSwitch(pos.id)} 
                            className="text-xs font-semibold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-1.5 rounded-lg border border-rose-500/20 transition"
                          >
                            Emergency Market Close
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {positionsTab === 'closed' && (
                <div className="fintech-card p-4 sm:p-5 overflow-x-auto shadow-subtle">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-[var(--hair)] text-[var(--grey)]">
                      <tr>
                        <th className="py-2.5 font-medium">Date</th>
                        <th className="py-2.5 font-medium">Instrument</th>
                        <th className="py-2.5 font-medium">Strikes</th>
                        <th className="py-2.5 font-medium">Exit Reason</th>
                        <th className="py-2.5 font-medium text-right">Net Return</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--hair)]">
                      {closedPositions.map(pos => {
                        const badge = getExitReasonBadge(pos.close_reason);
                        return (
                          <tr key={pos.id} className="hover:bg-[var(--paper-2)] transition-colors">
                            <td className="py-3 text-[var(--grey)] whitespace-nowrap">
                              {formatTradeDate(pos.closed_at, pos.opened_at)}
                            </td>
                            <td className="py-3 font-medium text-[var(--ink)]">
                              {pos.underlying || 'BTC'} Options
                            </td>
                            <td className="py-3 font-mono text-[var(--grey)]">
                              {pos.short_call_strike ? `C-${pos.short_call_strike} / P-${pos.short_put_strike}` : `${pos.lots} Lots`}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className={`py-3 text-right font-mono font-bold ${pos.realizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {pos.realizedPnl >= 0 ? '+' : ''}{fmt(pos.realizedPnl)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SECTION: COMPLETE TRADE HISTORY */}
          {section === 'trade_history' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Trade History</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">Audited record of all historical executions and fills.</p>
              </div>

              <div className="fintech-card p-4 sm:p-6 overflow-x-auto shadow-subtle">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[var(--hair)] text-[var(--grey)]">
                    <tr>
                      <th className="py-2.5 font-medium">Date &amp; Time</th>
                      <th className="py-2.5 font-medium">Instrument</th>
                      <th className="py-2.5 font-medium">Call Entry &rarr; Exit</th>
                      <th className="py-2.5 font-medium">Put Entry &rarr; Exit</th>
                      <th className="py-2.5 font-medium">Exit Reason</th>
                      <th className="py-2.5 font-medium text-right">Trading Fees</th>
                      <th className="py-2.5 font-medium text-right">Net P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hair)]">
                    {closedPositions.map(pos => {
                      const badge = getExitReasonBadge(pos.close_reason);
                      return (
                        <tr key={pos.id} className="hover:bg-[var(--paper-2)] transition-colors">
                          <td className="py-3 text-[var(--grey)] whitespace-nowrap">
                            {formatTradeDate(pos.closed_at, pos.opened_at)}
                          </td>
                          <td className="py-3 font-medium text-[var(--ink)]">
                            {pos.underlying || 'BTC'} Options
                          </td>
                          <td className="py-3 font-mono text-[var(--grey)]">{pos.callEntry} &rarr; {pos.callExit}</td>
                          <td className="py-3 font-mono text-[var(--grey)]">{pos.putEntry} &rarr; {pos.putExit}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-[var(--grey)]">{fmt(pos.fees)}</td>
                          <td className={`py-3 text-right font-mono font-bold ${pos.realizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {pos.realizedPnl >= 0 ? '+' : ''}{fmt(pos.realizedPnl)}
                          </td>
                        </tr>
                      );
                    })}
                    {closedPositions.length === 0 && (
                      <tr><td colSpan={7} className="py-6 text-center text-[var(--grey)]">No historical trades found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: PERFORMANCE */}
          {section === 'performance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Performance Metrics</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">High-water mark performance and hit rate analytics.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SpotlightCard className="p-5 shadow-subtle">
                  <div className="text-xs font-medium text-[var(--grey)] uppercase">Total P&amp;L</div>
                  <div className={`font-mono text-2xl font-bold mt-1 ${metrics.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {metrics.totalPnl >= 0 ? '+' : ''}{fmt(metrics.totalPnl)}
                  </div>
                </SpotlightCard>
                <SpotlightCard className="p-5 shadow-subtle">
                  <div className="text-xs font-medium text-[var(--grey)] uppercase">This Month</div>
                  <div className={`font-mono text-2xl font-bold mt-1 ${thisMonthPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {thisMonthPnl >= 0 ? '+' : ''}{fmt(thisMonthPnl)}
                  </div>
                </SpotlightCard>
                <SpotlightCard className="p-5 shadow-subtle">
                  <div className="text-xs font-medium text-[var(--grey)] uppercase">Win Rate</div>
                  <div className="font-mono text-2xl font-bold text-[var(--ink)] mt-1">{metrics.hitRate}%</div>
                </SpotlightCard>
                <SpotlightCard className="p-5 shadow-subtle">
                  <div className="text-xs font-medium text-[var(--grey)] uppercase">Total Trades</div>
                  <div className="font-mono text-2xl font-bold text-[var(--ink)] mt-1">{metrics.roundTrips}</div>
                </SpotlightCard>
              </div>
            </div>
          )}

          {/* SECTION: AUTOMATION CONTROL */}
          {section === 'automation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Automation &amp; Risk Parameters</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">Live execution switches and account circuit breakers.</p>
              </div>

              <div className="fintech-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-subtle">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <h3 className="font-bold text-base text-[var(--ink)]">
                      Bot Execution: {isPaused ? 'Paused' : 'Active'}
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--grey)] max-w-md leading-relaxed">
                    When active, ProfitPilot monitors Delta Exchange every 5 seconds, opening delta-neutral strangles and managing risk automatically.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handlePauseToggle}
                    className={`px-5 py-2.5 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-subtle ${isPaused ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                    {isPaused ? 'Resume Automation' : 'Pause New Trades'}
                  </button>
                  <button 
                    onClick={() => {
                      if (openPositions.length > 0) handleKillSwitch(openPositions[0].id);
                    }}
                    className="px-5 py-2.5 font-semibold rounded-lg text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 transition flex items-center justify-center gap-2"
                    disabled={openPositions.length === 0}
                  >
                    <ShieldAlert className="w-4 h-4" /> Emergency Market Eject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: ACCOUNT HEALTH */}
          {section === 'account_health' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Account Health &amp; Solvency</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">Live wallet margin buffer and liquidation clearance.</p>
              </div>

              <div className="fintech-card p-6 shadow-subtle text-xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--ink)] text-sm">Status: Protected &amp; Solvent</h3>
                    <p className="text-[var(--grey)]">40% mandatory cash cushion remains fully preserved in wallet.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--hair)]">
                  <div>
                    <div className="text-[var(--grey)] mb-1">Total Wallet Balance</div>
                    <div className="font-mono text-xl font-bold text-[var(--ink)]">{fmt(metrics.liveBalance)}</div>
                  </div>
                  <div>
                    <div className="text-[var(--grey)] mb-1">Available Margin Buffer</div>
                    <div className="font-mono text-xl font-bold text-[var(--ink)]">{fmt(availableMargin)}</div>
                  </div>
                  <div>
                    <div className="text-[var(--grey)] mb-1">Margin Utilization</div>
                    <div className="font-mono text-xl font-bold text-[var(--ink)]">{marginUsed.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: BILLING */}
          {section === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Billing &amp; Invoices</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">30% performance fee invoices calculated strictly on net profits above high-water mark.</p>
              </div>

              <div className="fintech-card overflow-hidden shadow-subtle">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[var(--paper-2)] text-[var(--grey)] text-xs uppercase border-b border-[var(--hair)]">
                    <tr>
                      <th className="px-5 py-3 font-medium">Month</th>
                      <th className="px-5 py-3 font-medium">Fee Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hair)]">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[var(--paper-2)] transition-colors text-xs">
                        <td className="px-5 py-4 font-medium text-[var(--ink)]">{inv.billing_month}</td>
                        <td className="px-5 py-4 font-mono font-medium">{fmt(inv.fee_amount)}</td>
                        <td className="px-5 py-4">
                          {inv.status === 'Paid' ? (
                            <span className="text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded text-xs font-semibold border border-emerald-500/20">Paid</span>
                          ) : inv.status === 'No Fee' ? (
                            <span className="text-[var(--grey)] bg-[var(--raise)] px-2 py-1 rounded text-xs font-medium border border-[var(--hair)]">No Fee (Zero Profit)</span>
                          ) : (
                            <span className="text-rose-600 bg-rose-500/10 px-2 py-1 rounded text-xs font-semibold border border-rose-500/20">Unpaid</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Link 
                            href={`/dashboard/billing/${inv.id}`}
                            target="_blank"
                            className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs flex items-center gap-1"
                          >
                            View Invoice
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-[var(--grey)] text-xs">
                          No invoices generated yet. (First 30 days are 100% free trial).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Floating Ask ProfitPilot Helper */}
      <div className="fixed bottom-6 right-6 z-50">
        {askPilotOpen ? (
          <div className="w-80 sm:w-96 bg-[var(--paper)] border border-[var(--hair)] rounded-xl shadow-2xl overflow-hidden flex flex-col mb-4 transition-all">
            <div className="bg-[#d97706] text-white p-3.5 flex justify-between items-center shadow-xs">
              <span className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4"/> Ask ProfitPilot
              </span>
              <button onClick={() => setAskPilotOpen(false)} className="hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-3 text-xs bg-[var(--paper-2)]">
              {!activeAiQuery ? (
                <div className="space-y-2">
                  <p className="text-[var(--grey)] mb-2 font-medium">Quick Answers About Your Trading:</p>
                  {simplifiedAiQueries.map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveAiQuery(item.q)} 
                      className="w-full text-left p-2.5 bg-[var(--paper)] border border-[var(--hair)] rounded-lg text-[var(--ink)] hover:border-[#d97706] transition shadow-2xs font-medium"
                    >
                      {item.q}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <button onClick={() => setActiveAiQuery(null)} className="text-[#d97706] font-semibold flex items-center gap-1">
                    &larr; Back to Questions
                  </button>
                  <div className="bg-[var(--paper)] p-3.5 rounded-lg border border-[var(--hair)] space-y-2">
                    <div className="font-bold text-[var(--ink)] text-xs">{activeAiQuery}</div>
                    <div className="text-[var(--grey)] leading-relaxed">
                      {simplifiedAiQueries.find(x => x.q === activeAiQuery)?.a}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setAskPilotOpen(true)}
            className="bg-[#d97706] hover:bg-[#b45309] text-white px-4 py-2.5 rounded-full shadow-xl transition-all flex items-center gap-2 hover:scale-105 active:scale-95 text-xs font-semibold"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask ProfitPilot</span>
          </button>
        )}
      </div>

    </div>
  );
}

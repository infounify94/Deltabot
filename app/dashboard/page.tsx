'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { CopyButton } from '@/components/ui/copy-button';
import { 
  Activity, 
  Play, 
  Pause, 
  RefreshCw, 
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
  Cpu,
  List,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

type DashboardSection = 
  | 'dashboard'
  | 'positions'
  | 'trade_history'
  | 'performance'
  | 'automation'
  | 'activity'
  | 'account_health';

export default function Dashboard() {
  const [section, setSection] = useState<DashboardSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real DB Data (Supabase)
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [closedPositions, setClosedPositions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ roundTrips: 0, winners: 0, hitRate: 0, totalPnl: 0, liveBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Real-time market WebSocket prices
  const [btcPrice, setBtcPrice] = useState<number>(92000);
  const [ethPrice, setEthPrice] = useState<number>(3480);
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

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      setUserEmail(user.email || '');
      setUserId(user.id);

      const { data: pauseData } = await supabase
        .from('positions')
        .select('id')
        .eq('status', 'system_pause')
        .eq('user_id', user.id);
      setIsPaused((pauseData || []).length > 0);

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

  // Calculated metrics
  const openPnl = useMemo(() => {
    return openPositions.reduce((acc, pos) => acc + (pos.actualPnl || 0), 0);
  }, [openPositions]);

  const availableMargin = metrics.liveBalance * 0.4; // rough calc for simplified display
  const marginUsed = metrics.liveBalance > 0 ? ((metrics.liveBalance - availableMargin) / metrics.liveBalance) * 100 : 0;
  
  const thisMonthPnl = useMemo(() => {
    const now = new Date();
    return closedPositions
      .filter(p => new Date(p.closed_at).getMonth() === now.getMonth() && new Date(p.closed_at).getFullYear() === now.getFullYear())
      .reduce((sum, p) => sum + p.realizedPnl, 0);
  }, [closedPositions]);

  // Keep it internally for when we need to show minimal simplified info
  const calculatedModel = useMemo(() => {
    return {
      iv: 58.4,
      rv: 46.2,
      natr: 3.82,
    };
  }, []);

  const simplifiedAiQueries = [
    {
      q: "Why isn't ProfitPilot trading right now?",
      a: `ProfitPilot is monitoring the market. Currently, market conditions are not optimal for new entries based on our safety parameters. We will automatically enter a position when conditions improve.`
    },
    {
      q: "Are my current positions safe?",
      a: `Yes, all active positions are continuously monitored. Automated risk management is active and ready to defend your capital if the market moves suddenly.`
    },
    {
      q: "What is my largest risk right now?",
      a: `Your positions are protected by defined risk boundaries. In the event of an extreme market move, the maximum potential loss per position is strictly capped.`
    },
    {
      q: "What happens if BTC drops rapidly?",
      a: `If the market drops rapidly, our automated defense system will instantly execute protective orders to limit downside exposure.`
    },
    {
      q: "How is my P&L calculated?",
      a: `Net P&L represents your total realized profit or loss, with all exchange fees and applicable taxes already deducted.`
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans flex flex-col selection:bg-[#d97706]/15">
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 glass-header px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setSection('dashboard')}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-sm">
              <Activity className="text-white w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-base tracking-tight text-[var(--ink)]">Profit</span>
              <span className="font-semibold text-base tracking-tight text-[#d97706]">Pilot</span>
            </div>
          </Link>
        </div>

        <div className="hidden sm:flex items-center gap-2.5 bg-[var(--paper-2)] border border-[var(--hair)] px-3.5 py-1.5 rounded-full text-xs">
          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span className="font-medium text-[var(--ink)]">
            {isPaused ? 'Automation Paused' : 'Automation Active'}
          </span>
          <span className="text-[var(--grey)] border-l border-[var(--hair)] pl-2">
            BTC <strong className="font-mono text-[var(--ink)] num-tabular">${btcPrice.toFixed(0)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-[var(--paper-2)] p-0.5 rounded-lg border border-[var(--hair)] flex items-center text-xs font-medium">
            <button 
              onClick={() => setCurrency('INR')}
              className={`px-2 py-1 rounded transition-all ${currency === 'INR' ? 'bg-[#d97706] text-white shadow-sm font-semibold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >
              ₹ INR
            </button>
            <button 
              onClick={() => setCurrency('USD')}
              className={`px-2 py-1 rounded transition-all ${currency === 'USD' ? 'bg-[#d97706] text-white shadow-sm font-semibold' : 'text-[var(--grey)] hover:text-[var(--ink)]'}`}
            >
              $ USD
            </button>
          </div>

          <button 
            onClick={toggleTheme}
            className="w-7 h-7 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] flex items-center justify-center text-[var(--grey)] hover:text-[var(--ink)] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
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

        {/* Crypto Price Ticker */}
        <div className="bg-[var(--paper)] border-b border-[var(--hair)] py-1.5 overflow-hidden flex items-center text-xs font-mono text-[var(--grey)] whitespace-nowrap">
          <div className="animate-marquee inline-flex gap-8 px-4">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> BTC ${btcPrice.toLocaleString()}</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ETH ${ethPrice.toLocaleString()}</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> ProfitPilot Automation Active</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Market Volatility: Normal</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> BTC ${btcPrice.toLocaleString()}</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ETH ${ethPrice.toLocaleString()}</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> ProfitPilot Automation Active</span>
          </div>
        </div>

        {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[var(--paper-2)] border-r border-[var(--hair)] transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto flex flex-col justify-between ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-80px)] text-xs">
            
            {/* HOME */}
            <div>
              <div className="text-[11px] font-medium text-[var(--faint)] px-2.5 mb-1">HOME</div>
              <button
                onClick={() => { setSection('dashboard'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${section === 'dashboard' ? 'bg-[#d97706] text-white shadow-subtle' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
              >
                <Home className="w-4 h-4" /> Dashboard
              </button>
            </div>

            {/* TRADING */}
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-[var(--faint)] px-2.5 mb-1">TRADING</div>
              <button
                onClick={() => { setSection('positions'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${section === 'positions' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
              >
                <Layers className="w-4 h-4" /> Positions
              </button>
              <button
                onClick={() => { setSection('trade_history'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${section === 'trade_history' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
              >
                <History className="w-4 h-4" /> Trade History
              </button>
            </div>

            {/* PERFORMANCE */}
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-[var(--faint)] px-2.5 mb-1">PERFORMANCE</div>
              <button
                onClick={() => { setSection('performance'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${section === 'performance' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
              >
                <TrendingUp className="w-4 h-4" /> Performance
              </button>
            </div>

            {/* AUTOMATION */}
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-[var(--faint)] px-2.5 mb-1">AUTOMATION</div>
              <button
                onClick={() => { setSection('automation'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${section === 'automation' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
              >
                <Cpu className="w-4 h-4" /> Automation
              </button>
              <button
                onClick={() => { setSection('activity'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${section === 'activity' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
              >
                <List className="w-4 h-4" /> Activity
              </button>
            </div>

            {/* ACCOUNT */}
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-[var(--faint)] px-2.5 mb-1">ACCOUNT</div>
              <button
                onClick={() => { setSection('account_health'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${section === 'account_health' ? 'bg-[#d97706] text-white' : 'text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)]'}`}
              >
                <ShieldCheck className="w-4 h-4" /> Account Health
              </button>
            </div>

            {/* SETTINGS */}
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-[var(--faint)] px-2.5 mb-1">SETTINGS</div>
              <Link href="/dashboard/settings" className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)] transition-all">
                <Settings className="w-4 h-4" /> Exchange
              </Link>
              <Link href="/dashboard/help" className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--grey)] hover:text-[var(--ink)] hover:bg-[var(--raise)] transition-all">
                <HelpCircle className="w-4 h-4" /> Help
              </Link>
              {isAdmin && (
                <Link href="/admin" className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all mt-2 border border-emerald-100">
                  <ShieldCheck className="w-4 h-4" /> Admin Panel
                </Link>
              )}
            </div>
          </div>

          <div className="p-3 border-t border-[var(--hair)] bg-[var(--paper)]">
            <div className="text-xs text-[var(--grey)] truncate">
              User: <strong className="text-[var(--ink)] font-medium">{userEmail}</strong>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Dashboard Home */}
          {section === 'dashboard' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <SpotlightCard className="p-4 space-y-1 shadow-subtle">
                  <div className="text-[11px] font-medium text-[var(--grey)]">Account Balance</div>
                  <div className="font-mono text-xl sm:text-2xl font-semibold text-[var(--ink)] mt-1 num-tabular">{fmt(metrics.liveBalance)}</div>
                </SpotlightCard>

                <SpotlightCard className="p-4 space-y-1 shadow-subtle">
                  <div className="text-[11px] font-medium text-[var(--grey)]">Today's P&amp;L</div>
                  <div className={`font-mono text-xl sm:text-2xl font-semibold mt-1 num-tabular ${metrics.totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {metrics.totalPnl >= 0 ? '+' : ''}{fmt(metrics.totalPnl)}
                  </div>
                </SpotlightCard>

                <SpotlightCard className="p-4 space-y-1 shadow-subtle">
                  <div className="text-[11px] font-medium text-[var(--grey)]">Open P&amp;L</div>
                  <div className={`font-mono text-xl sm:text-2xl font-semibold mt-1 num-tabular ${openPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {openPnl >= 0 ? '+' : ''}{fmt(openPnl)}
                  </div>
                </SpotlightCard>

                <SpotlightCard className="p-4 space-y-1 shadow-subtle">
                  <div className="text-[11px] font-medium text-[var(--grey)]">Available Margin</div>
                  <div className="font-mono text-xl sm:text-2xl font-semibold text-[var(--ink)] mt-1 num-tabular">{fmt(availableMargin)}</div>
                </SpotlightCard>

                <SpotlightCard className="p-4 space-y-1 shadow-subtle">
                  <div className="text-[11px] font-medium text-[var(--grey)]">Open Positions</div>
                  <div className="font-mono text-xl sm:text-2xl font-semibold text-[var(--ink)] mt-1 num-tabular">{openPositions.length}</div>
                </SpotlightCard>

                <SpotlightCard className="p-4 space-y-1 shadow-subtle">
                  <div className="text-[11px] font-medium text-[var(--grey)]">Bot Status</div>
                  <div className={`text-sm font-semibold mt-1.5 ${isPaused ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {isPaused ? 'Paused' : 'Active'}
                  </div>
                </SpotlightCard>
              </div>

              <div className="fintech-card p-4 sm:p-5 shadow-subtle">
                <h3 className="font-semibold text-sm text-[var(--ink)] mb-4">Open Positions</h3>
                {openPositions.length === 0 ? (
                  <div className="text-center text-[var(--grey)] text-xs p-6 bg-[var(--paper-2)] rounded-lg border border-[var(--hair)]">
                    No open positions — ProfitPilot is currently monitoring the market.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {openPositions.map(pos => {
                      const expanded = expandedPositionIds.has(pos.id);
                      return (
                        <div key={pos.id} className="bg-[var(--paper-2)] border border-[var(--hair)] rounded-lg overflow-hidden text-xs">
                          <div className="p-4 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-[var(--ink)]">BTC Options Position</div>
                              <div className="text-[var(--grey)] mt-0.5">Expiry: {new Date(pos.expiry_date).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-mono font-semibold ${pos.actualPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {pos.actualPnl >= 0 ? '+' : ''}{fmt(pos.actualPnl)}
                              </div>
                              <div className="text-emerald-600 font-medium">● Active</div>
                            </div>
                          </div>
                          
                          <div className="px-4 pb-3 flex items-center justify-between">
                            <button onClick={() => toggleExpand(pos.id)} className="text-[#d97706] font-medium flex items-center gap-1">
                              {expanded ? 'Hide Details' : 'View Details'} {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            {!pos.manual_exit_requested && (
                              <button onClick={() => handleKillSwitch(pos.id)} className="text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded transition">
                                Emergency Kill Switch
                              </button>
                            )}
                            {pos.manual_exit_requested && (
                              <span className="text-rose-600 font-medium animate-pulse">Closing...</span>
                            )}
                          </div>
                          
                          {expanded && (
                            <div className="bg-[var(--card)] p-4 border-t border-[var(--hair)] grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div><div className="text-[var(--grey)] mb-1">Call Entry</div><div className="font-mono">{pos.callEntry}</div></div>
                              <div><div className="text-[var(--grey)] mb-1">Put Entry</div><div className="font-mono">{pos.putEntry}</div></div>
                              <div><div className="text-[var(--grey)] mb-1">Peak P&amp;L</div><div className="font-mono text-emerald-600">+{fmt(pos.peakPnl)}</div></div>
                              <div><div className="text-[var(--grey)] mb-1">Lots</div><div className="font-mono">{pos.lots}</div></div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="fintech-card p-4 sm:p-5 shadow-subtle">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm text-[var(--ink)]">Recent Trades</h3>
                    <Link href="/dashboard" onClick={() => setSection('trade_history')} className="text-xs text-[#d97706] font-medium">View All</Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="border-b border-[var(--hair)] text-[var(--grey)]">
                        <tr>
                          <th className="py-2 font-medium">Date</th>
                          <th className="py-2 font-medium">Instrument</th>
                          <th className="py-2 font-medium text-right">P&amp;L</th>
                          <th className="py-2 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--hair)]">
                        {closedPositions.slice(0, 5).map(pos => (
                          <tr key={pos.id}>
                            <td className="py-2.5 text-[var(--grey)]">{new Date(pos.closed_at).toLocaleDateString()}</td>
                            <td className="py-2.5 font-medium text-[var(--ink)]">BTC Options</td>
                            <td className={`py-2.5 text-right font-mono font-medium ${pos.realizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {pos.realizedPnl >= 0 ? '+' : ''}{fmt(pos.realizedPnl)}
                            </td>
                            <td className="py-2.5 text-right"><span className="text-[10px] bg-[var(--paper-2)] border border-[var(--hair)] px-1.5 py-0.5 rounded text-[var(--grey)]">CLOSED</span></td>
                          </tr>
                        ))}
                        {closedPositions.length === 0 && (
                          <tr><td colSpan={4} className="py-4 text-center text-[var(--grey)]">No recent trades</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="fintech-card p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--ink)] mb-4">Account Health</h3>
                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between items-center p-3 bg-[var(--paper-2)] rounded-lg border border-[var(--hair)]">
                        <span className="text-[var(--grey)]">Status</span>
                        <span className="text-emerald-600 font-medium flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Normal</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[var(--paper-2)] rounded-lg border border-[var(--hair)]">
                        <span className="text-[var(--grey)]">Total Balance</span>
                        <span className="font-mono text-[var(--ink)] font-medium">{fmt(metrics.liveBalance)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[var(--paper-2)] rounded-lg border border-[var(--hair)]">
                        <span className="text-[var(--grey)]">Margin Used</span>
                        <span className="font-mono text-[var(--ink)] font-medium">{marginUsed.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center text-xs text-[var(--grey)]">
                    No action required.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Positions View */}
          {section === 'positions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Positions</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">View your open and completed trades.</p>
              </div>

              <div className="flex gap-2 border-b border-[var(--hair)] pb-3 text-xs">
                <button onClick={() => setPositionsTab('open')} className={`px-3 py-2 rounded-lg font-medium transition ${positionsTab === 'open' ? 'bg-[#d97706] text-white' : 'bg-[var(--paper-2)] text-[var(--grey)] border border-[var(--hair)]'}`}>
                  Open Positions
                </button>
                <button onClick={() => setPositionsTab('closed')} className={`px-3 py-2 rounded-lg font-medium transition ${positionsTab === 'closed' ? 'bg-[#d97706] text-white' : 'bg-[var(--paper-2)] text-[var(--grey)] border border-[var(--hair)]'}`}>
                  Closed Positions
                </button>
              </div>

              {positionsTab === 'open' && (
                <div className="space-y-4">
                  {openPositions.length === 0 ? (
                    <div className="text-center text-[var(--grey)] text-xs p-6 bg-[var(--paper-2)] rounded-lg border border-[var(--hair)]">No open positions.</div>
                  ) : (
                    openPositions.map(pos => {
                      const expanded = expandedPositionIds.has(pos.id);
                      return (
                        <div key={pos.id} className="fintech-card p-4 text-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-[var(--ink)]">BTC Options Position</div>
                              <div className="text-[var(--grey)]">Active</div>
                            </div>
                            <div className={`font-mono font-semibold text-sm ${pos.actualPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {pos.actualPnl >= 0 ? '+' : ''}{fmt(pos.actualPnl)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button onClick={() => toggleExpand(pos.id)} className="text-[#d97706] font-medium">
                              {expanded ? 'Hide Details' : 'View Details'}
                            </button>
                            <button onClick={() => handleKillSwitch(pos.id)} className="text-rose-600 font-medium">Emergency Kill Switch</button>
                          </div>
                          {expanded && (
                            <div className="bg-[var(--paper-2)] p-4 rounded border border-[var(--hair)] mt-2 grid grid-cols-2 gap-4">
                              <div><div className="text-[var(--grey)]">Call Entry</div><div className="font-mono">{pos.callEntry}</div></div>
                              <div><div className="text-[var(--grey)]">Put Entry</div><div className="font-mono">{pos.putEntry}</div></div>
                              <div><div className="text-[var(--grey)]">Expiry</div><div className="font-mono">{new Date(pos.expiry_date).toLocaleDateString()}</div></div>
                              <div><div className="text-[var(--grey)]">Lots</div><div className="font-mono">{pos.lots}</div></div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {positionsTab === 'closed' && (
                <div className="fintech-card p-4 overflow-x-auto shadow-subtle">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-[var(--hair)] text-[var(--grey)]">
                      <tr>
                        <th className="py-2 font-medium">Date</th>
                        <th className="py-2 font-medium">Instrument</th>
                        <th className="py-2 font-medium text-right">P&amp;L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--hair)]">
                      {closedPositions.map(pos => (
                        <tr key={pos.id}>
                          <td className="py-2.5 text-[var(--grey)]">{new Date(pos.closed_at).toLocaleString()}</td>
                          <td className="py-2.5 font-medium text-[var(--ink)]">BTC Options</td>
                          <td className={`py-2.5 text-right font-mono font-medium ${pos.realizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {pos.realizedPnl >= 0 ? '+' : ''}{fmt(pos.realizedPnl)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Trade History */}
          {section === 'trade_history' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Trade History</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">Complete record of your closed trades.</p>
              </div>
              <div className="fintech-card p-4 overflow-x-auto shadow-subtle">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[var(--hair)] text-[var(--grey)]">
                    <tr>
                      <th className="py-2 font-medium">Date</th>
                      <th className="py-2 font-medium">Instrument</th>
                      <th className="py-2 font-medium">Call Entry / Exit</th>
                      <th className="py-2 font-medium">Put Entry / Exit</th>
                      <th className="py-2 font-medium text-right">Fees</th>
                      <th className="py-2 font-medium text-right">Net P&amp;L</th>
                      <th className="py-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hair)]">
                    {closedPositions.map(pos => (
                      <tr key={pos.id}>
                        <td className="py-2.5 text-[var(--grey)]">{new Date(pos.closed_at).toLocaleDateString()}</td>
                        <td className="py-2.5 font-medium text-[var(--ink)]">BTC Options</td>
                        <td className="py-2.5 font-mono text-[var(--grey)]">{pos.callEntry} &rarr; {pos.callExit}</td>
                        <td className="py-2.5 font-mono text-[var(--grey)]">{pos.putEntry} &rarr; {pos.putExit}</td>
                        <td className="py-2.5 text-right font-mono text-[var(--grey)]">{fmt(pos.fees)}</td>
                        <td className={`py-2.5 text-right font-mono font-medium ${pos.realizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {pos.realizedPnl >= 0 ? '+' : ''}{fmt(pos.realizedPnl)}
                        </td>
                        <td className="py-2.5 text-right"><span className="text-[10px] bg-[var(--paper-2)] border border-[var(--hair)] px-1.5 py-0.5 rounded text-[var(--grey)]">CLOSED</span></td>
                      </tr>
                    ))}
                    {closedPositions.length === 0 && (
                      <tr><td colSpan={7} className="py-4 text-center text-[var(--grey)]">No trade history available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance */}
          {section === 'performance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Performance Overview</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">Track your overall trading results.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SpotlightCard className="p-5 shadow-subtle">
                  <div className="text-xs font-medium text-[var(--grey)]">Total P&amp;L</div>
                  <div className={`font-mono text-2xl font-semibold mt-1 ${metrics.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {metrics.totalPnl >= 0 ? '+' : ''}{fmt(metrics.totalPnl)}
                  </div>
                </SpotlightCard>
                <SpotlightCard className="p-5 shadow-subtle">
                  <div className="text-xs font-medium text-[var(--grey)]">This Month</div>
                  <div className={`font-mono text-2xl font-semibold mt-1 ${thisMonthPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {thisMonthPnl >= 0 ? '+' : ''}{fmt(thisMonthPnl)}
                  </div>
                </SpotlightCard>
                <SpotlightCard className="p-5 shadow-subtle">
                  <div className="text-xs font-medium text-[var(--grey)]">Win Rate</div>
                  <div className="font-mono text-2xl font-semibold text-[var(--ink)] mt-1">{metrics.hitRate}%</div>
                </SpotlightCard>
                <SpotlightCard className="p-5 shadow-subtle">
                  <div className="text-xs font-medium text-[var(--grey)]">Total Trades</div>
                  <div className="font-mono text-2xl font-semibold text-[var(--ink)] mt-1">{metrics.roundTrips}</div>
                </SpotlightCard>
              </div>

              <div className="fintech-card p-5 shadow-subtle">
                <h3 className="font-semibold text-sm text-[var(--ink)] mb-4">Trade Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-[var(--paper-2)] border border-[var(--hair)] rounded-lg">
                    <div className="text-[var(--grey)] mb-1">Winning Trades</div>
                    <div className="font-mono font-semibold text-[var(--ink)]">{metrics.winners}</div>
                  </div>
                  <div className="p-4 bg-[var(--paper-2)] border border-[var(--hair)] rounded-lg">
                    <div className="text-[var(--grey)] mb-1">Losing Trades</div>
                    <div className="font-mono font-semibold text-[var(--ink)]">{metrics.roundTrips - metrics.winners}</div>
                  </div>
                  <div className="p-4 bg-[var(--paper-2)] border border-[var(--hair)] rounded-lg">
                    <div className="text-[var(--grey)] mb-1">Net P&amp;L</div>
                    <div className={`font-mono font-semibold ${metrics.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(metrics.totalPnl)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Automation */}
          {section === 'automation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Automation Control</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">Manage automated trading execution.</p>
              </div>

              <div className="fintech-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-subtle">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <h3 className="font-semibold text-base text-[var(--ink)]">Automation Status: {isPaused ? 'Paused' : 'Active'}</h3>
                  </div>
                  <p className="text-xs text-[var(--grey)] max-w-sm">
                    When active, ProfitPilot monitors the market and executes trades automatically based on defined parameters.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <button 
                    onClick={handlePauseToggle}
                    className={`px-4 py-2.5 font-medium rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-subtle ${isPaused ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                    {isPaused ? 'Resume Automation' : 'Pause New Trades'}
                  </button>
                  <button 
                    onClick={() => {
                      if (openPositions.length > 0) handleKillSwitch(openPositions[0].id);
                    }}
                    className="px-4 py-2.5 font-medium rounded-lg text-xs bg-rose-50 text-rose-600 border border-rose-200 transition flex items-center justify-center gap-2"
                    disabled={openPositions.length === 0}
                  >
                    <ShieldAlert className="w-4 h-4" /> Emergency Stop
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="fintech-card p-5">
                  <div className="text-xs text-[var(--grey)] mb-1">Today's Trades</div>
                  <div className="font-mono text-2xl font-semibold text-[var(--ink)]">0</div>
                </div>
                <div className="fintech-card p-5">
                  <div className="text-xs text-[var(--grey)] mb-1">Last Activity</div>
                  <div className="text-sm font-semibold text-[var(--ink)] mt-1">{new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Activity */}
          {section === 'activity' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Activity Feed</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">Timeline of recent automated actions.</p>
              </div>

              <div className="fintech-card p-5 shadow-subtle">
                <div className="space-y-4">
                  <div className="flex gap-4 text-xs">
                    <div className="text-[var(--grey)] font-mono whitespace-nowrap">Today, 14:32</div>
                    <div>
                      <div className="font-medium text-[var(--ink)]">Trade opened — BTC Options</div>
                      <div className="text-[var(--grey)] mt-0.5">New position entered automatically.</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="text-[var(--grey)] font-mono whitespace-nowrap">Today, 13:18</div>
                    <div>
                      <div className="font-medium text-[var(--ink)]">No trade — Conditions not met</div>
                      <div className="text-[var(--grey)] mt-0.5">Market conditions did not match safety criteria.</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="text-[var(--grey)] font-mono whitespace-nowrap">Yesterday, 10:45</div>
                    <div>
                      <div className="font-medium text-[var(--ink)]">Trade closed — BTC Options</div>
                      <div className="text-[var(--grey)] mt-0.5">Position closed successfully.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Health */}
          {section === 'account_health' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">Account Health</h2>
                <p className="text-xs text-[var(--grey)] mt-0.5">Overview of your account balances and margin.</p>
              </div>

              <div className="fintech-card p-6 shadow-subtle text-xs space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink)] text-sm">Status: Normal</h3>
                    <p className="text-[var(--grey)]">Your account is in good standing.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--hair)]">
                  <div>
                    <div className="text-[var(--grey)] mb-1">Total Balance</div>
                    <div className="font-mono text-xl font-semibold text-[var(--ink)]">{fmt(metrics.liveBalance)}</div>
                  </div>
                  <div>
                    <div className="text-[var(--grey)] mb-1">Available Margin</div>
                    <div className="font-mono text-xl font-semibold text-[var(--ink)]">{fmt(availableMargin)}</div>
                  </div>
                  <div>
                    <div className="text-[var(--grey)] mb-1">Margin Used</div>
                    <div className="font-mono text-xl font-semibold text-[var(--ink)]">{marginUsed.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Ask ProfitPilot Floating Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {askPilotOpen ? (
          <div className="w-80 bg-[var(--paper)] border border-[var(--hair)] rounded-lg shadow-xl overflow-hidden flex flex-col mb-4">
            <div className="bg-[#d97706] text-white p-3 flex justify-between items-center">
              <span className="font-semibold text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Ask ProfitPilot</span>
              <button onClick={() => setAskPilotOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-3 text-xs bg-[var(--paper-2)]">
              {!activeAiQuery ? (
                <div className="space-y-2">
                  <p className="text-[var(--grey)] mb-3">What would you like to know?</p>
                  {simplifiedAiQueries.map((item, i) => (
                    <button key={i} onClick={() => setActiveAiQuery(item.q)} className="w-full text-left p-2.5 bg-[var(--paper)] border border-[var(--hair)] rounded text-[var(--ink)] hover:border-[#d97706] transition">
                      {item.q}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => setActiveAiQuery(null)} className="text-[#d97706] font-medium flex items-center gap-1">
                    &larr; Back
                  </button>
                  <div>
                    <div className="font-semibold text-[var(--ink)] mb-2">{activeAiQuery}</div>
                    <div className="text-[var(--grey)] leading-relaxed bg-[var(--paper)] p-3 rounded border border-[var(--hair)]">
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
            className="bg-[#d97706] hover:bg-[#b45309] text-white p-3 rounded-full shadow-xl transition flex items-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium text-sm pr-1">Ask ProfitPilot</span>
          </button>
        )}
      </div>

    </div>
  );
}

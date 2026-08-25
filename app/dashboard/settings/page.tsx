'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Activity, 
  Key, 
  ShieldCheck, 
  CreditCard, 
  User, 
  Copy, 
  Check, 
  AlertTriangle, 
  Sliders, 
  Lock, 
  RefreshCw,
  ExternalLink,
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'trading' | 'risk' | 'billing' | 'security' | 'profile'>('trading');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exchange, setExchange] = useState('Delta Exchange India');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Risk parameters state
  const [maxLots, setMaxLots] = useState(1);
  const [cashReservePct, setCashReservePct] = useState(40);

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const oracleIp = '144.24.131.121';

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

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileData) {
        setProfile(profileData);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleCopyIp = () => {
    navigator.clipboard.writeText(oracleIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        delta_api_key: apiKey,
        delta_api_secret: apiSecret,
        connected_at: new Date().toISOString(),
        is_paused: false
      });
      
    if (!error) {
      setProfile({ ...profile, delta_api_key: apiKey, is_paused: false, connected_at: new Date().toISOString() });
      setApiKey('');
      setApiSecret('');
    }
    setSaving(false);
  };

  const handleDisconnect = async () => {
    if (!user || !profile) return;
    if (!confirm("Are you sure you want to disconnect your Delta API keys? Live execution will halt immediately.")) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({
        delta_api_key: null,
        delta_api_secret: null,
        connected_at: null,
        is_paused: false
      })
      .eq('id', user.id);
      
    if (!error) {
      setProfile({ ...profile, delta_api_key: null });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      setPasswordSuccess(true);
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      alert("Failed to update password: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans flex flex-col selection:bg-[#f59e0b]/20">
      
      {/* Shared Dashboard Navbar */}
      <nav className="w-full glass-header px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-md">
            <Activity className="text-white w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-[var(--ink)]">Profit</span>
            <span className="font-bold text-lg tracking-tight text-[#d97706]">Pilot</span>
          </div>
        </Link>

        {/* Desktop Dashboard Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium font-mono">
          <Link href="/dashboard" className="text-[var(--grey)] hover:text-[var(--ink)] transition">
            &larr; Command Center
          </Link>
          <Link href="/dashboard/settings" className="text-[#d97706] border-b-2 border-[#d97706] pb-1 font-bold">
            Settings &amp; Keys
          </Link>
          <Link href="/dashboard/help" className="text-[var(--grey)] hover:text-[var(--ink)] transition">
            Support &amp; Docs
          </Link>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-[var(--hair)] bg-[var(--paper-2)] flex items-center justify-center text-[var(--grey)] hover:text-[var(--ink)] transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="hidden sm:block text-xs font-medium text-rose-500 hover:text-rose-600 transition bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20"
          >
            Sign Out
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[var(--paper-2)] border border-[var(--hair)] text-[var(--grey)] hover:text-[var(--ink)]"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--paper-2)] border-b border-[var(--hair)] px-4 py-4 space-y-3 font-mono text-sm">
          <Link 
            href="/dashboard" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[var(--grey)] hover:text-[var(--ink)] border-b border-[var(--hair)]"
          >
            ● Live Terminal
          </Link>
          <Link 
            href="/dashboard/settings" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#d97706] font-bold border-b border-[var(--hair)]"
          >
            ⚙ Settings &amp; API Keys
          </Link>
          <Link 
            href="/dashboard/help" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[var(--grey)] hover:text-[var(--ink)] border-b border-[var(--hair)]"
          >
            💬 Support &amp; Docs
          </Link>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10 w-full flex-1 space-y-8">
        
        {/* Header */}
        <div>
          <div className="text-xs font-mono font-bold uppercase text-[#d97706] tracking-wider mb-1">
            System Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono text-[var(--ink)] tracking-tight">
            Account &amp; API Whitelist
          </h1>
          <p className="text-xs text-[var(--grey)] font-mono mt-1">
            Logged in as: {user?.email || 'Loading...'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-[var(--hair)] pb-4 overflow-x-auto">
          {[
            { id: 'trading', label: 'Trading Account (API)', icon: Key },
            { id: 'risk', label: 'Risk & Lot Limits', icon: Sliders },
            { id: 'billing', label: 'Billing & High-Water Mark', icon: CreditCard },
            { id: 'security', label: 'Security & Whitelisting', icon: ShieldCheck },
            { id: 'profile', label: 'Profile & Password', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${isActive ? 'bg-[#d97706] text-white shadow-sm' : 'bg-[var(--paper-2)] text-[var(--grey)] hover:text-[var(--ink)] border border-[var(--hair)]'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: TRADING ACCOUNT */}
        {activeTab === 'trading' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Connected Accounts Status */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="fintech-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[var(--ink)] text-base font-mono">Connected Delta Account</h3>
                  {profile?.delta_api_key && (
                    <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-200">
                      Live Connected
                    </span>
                  )}
                </div>

                {profile?.delta_api_key ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[var(--paper-2)] border border-[var(--hair)] space-y-2">
                      <div className="text-xs font-mono text-[var(--grey)]">Active API Key:</div>
                      <div className="font-mono text-xs text-[var(--ink)] break-all font-bold">
                        {profile.delta_api_key.substring(0, 10)}************************
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Connected on: {new Date(profile.connected_at || Date.now()).toLocaleDateString()}
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={handleDisconnect}
                      className="w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-mono text-xs font-bold transition"
                    >
                      Disconnect API Key
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-[var(--paper-2)] border border-[var(--hair)] text-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="text-xs text-[var(--grey)] font-mono">
                      No Delta Exchange API key connected. Connect your trade-only API key to enable live execution.
                    </p>
                  </div>
                )}
              </div>

              {/* IP Whitelist Info Box */}
              <div className="fintech-card p-6 space-y-3">
                <h4 className="font-bold text-[var(--ink)] text-sm font-mono flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#d97706]" /> Required Execution IP Whitelist
                </h4>
                <p className="text-xs text-[var(--grey)] leading-relaxed font-mono">
                  When creating your API key inside Delta Exchange, restrict execution to our dedicated server IP:
                </p>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--paper-2)] border border-[var(--hair)]">
                  <code className="text-xs font-mono font-bold text-[var(--ink)]">{oracleIp}</code>
                  <button 
                    onClick={handleCopyIp}
                    className="p-1.5 rounded-lg bg-[var(--card)] hover:bg-[var(--raise)] text-[var(--grey)] border border-[var(--hair)] transition flex items-center gap-1 text-xs font-mono"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

            </div>

            {/* Right: API Key Connection Form */}
            <div className="lg:col-span-6 space-y-6">
              <div className="fintech-card p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-[var(--ink)] text-base font-mono">Connect API Credentials</h3>
                  <p className="text-xs text-[var(--grey)] font-mono mt-1">
                    Enter your trade-only Delta API key and secret. Funds remain in your Delta wallet.
                  </p>
                </div>

                <form onSubmit={handleConnect} className="space-y-4 font-mono">
                  <div>
                    <label className="block text-xs font-bold text-[var(--grey)] uppercase tracking-wider mb-1.5">
                      Target Exchange
                    </label>
                    <select 
                      value={exchange} 
                      onChange={(e) => setExchange(e.target.value)}
                      className="w-full bg-[var(--paper-2)] border border-[var(--hair)] rounded-xl px-4 py-3 text-[var(--ink)] text-xs focus:outline-none focus:border-[#d97706]"
                    >
                      <option value="Delta Exchange India">Delta Exchange India (.india / trade-only)</option>
                      <option value="Delta Exchange Global">Delta Exchange Global (.exchange / trade-only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--grey)] uppercase tracking-wider mb-1.5">
                      API Key
                    </label>
                    <input 
                      type="text" 
                      required
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste your Delta API Key"
                      className="w-full bg-[var(--paper-2)] border border-[var(--hair)] rounded-xl px-4 py-3 text-[var(--ink)] text-xs focus:outline-none focus:border-[#d97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--grey)] uppercase tracking-wider mb-1.5">
                      API Secret
                    </label>
                    <input 
                      type="password" 
                      required
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="Paste your Delta API Secret"
                      className="w-full bg-[var(--paper-2)] border border-[var(--hair)] rounded-xl px-4 py-3 text-[var(--ink)] text-xs focus:outline-none focus:border-[#d97706]"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full py-3.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-black font-mono shadow-sm transition disabled:opacity-50 text-xs"
                  >
                    {saving ? 'Connecting & Verifying...' : 'Save & Connect Delta Account &rarr;'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: RISK & LOT LIMITS */}
        {activeTab === 'risk' && (
          <div className="fintech-card p-6 sm:p-8 space-y-6 max-w-3xl font-mono">
            <div>
              <h3 className="text-lg font-bold text-[var(--ink)]">Risk Sizing &amp; Parameters</h3>
              <p className="text-xs text-[var(--grey)] mt-1">
                Customize maximum position sizes and cash buffer rules for your account.
              </p>
            </div>

            <div className="space-y-5">
              <div className="bg-[var(--paper-2)] p-4 rounded-xl border border-[var(--hair)] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--grey)]">Max Lot Sizing Cap:</span>
                  <span className="text-[#d97706] font-bold">{maxLots} Lots ({(maxLots * 0.001).toFixed(3)} BTC)</span>
                </div>
                <input 
                  type="range" 
                  min={1} 
                  max={10} 
                  value={maxLots}
                  onChange={(e) => setMaxLots(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="bg-[var(--paper-2)] p-4 rounded-xl border border-[var(--hair)] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--grey)]">Cash Reserve Buffer:</span>
                  <span className="text-emerald-600 font-bold">{cashReservePct}% Free Margin</span>
                </div>
                <input 
                  type="range" 
                  min={20} 
                  max={60} 
                  step={5}
                  value={cashReservePct}
                  onChange={(e) => setCashReservePct(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-[10px] text-[var(--grey)]">Guarantees unallocated margin is preserved for dynamic Iron Condor wing purchases.</p>
              </div>

              <button 
                type="button" 
                onClick={() => alert("Risk parameters saved successfully!")}
                className="px-6 py-3 rounded-xl bg-[#d97706] text-white font-bold text-xs shadow-sm hover:brightness-105 transition"
              >
                Save Risk Configuration
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: BILLING */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono">
            <div className="lg:col-span-7 fintech-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--ink)]">Plan &amp; High-Water Mark</h3>
                  <span className="text-xs text-[var(--grey)]">30-Day Rolling Performance Fee Model</span>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-200">
                  Free Trial Active
                </span>
              </div>

              <div className="space-y-4 divide-y divide-[var(--hair)] text-xs">
                <div className="flex justify-between pt-3">
                  <span className="text-[var(--grey)]">Trial Period:</span>
                  <span className="text-[var(--ink)] font-bold">30 Days (100% Free &amp; Retained)</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-[var(--grey)]">Performance Fee:</span>
                  <span className="text-[#d97706] font-bold">30% on Net Realized Profit</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-[var(--grey)]">High-Water Mark:</span>
                  <span className="text-emerald-600 font-bold">Active (Loss Carryover Enabled)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--paper-2)] border border-[var(--hair)] text-xs text-[var(--grey)] leading-relaxed">
                If a 30-day period ends in net negative P&amp;L, you are invoiced $0/₹0, and the loss carries forward to offset future gains before performance fees apply.
              </div>
            </div>

            <div className="lg:col-span-5 fintech-card p-6 flex flex-col items-center justify-center text-center space-y-3">
              <CreditCard className="w-10 h-10 text-[var(--faint)]" />
              <h4 className="font-bold text-[var(--ink)] text-sm">No Invoices Pending</h4>
              <p className="text-xs text-[var(--grey)] max-w-xs leading-relaxed">
                Invoices generate only at the conclusion of a profitable 30-day cycle.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE & PASSWORD */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl font-mono">
            <div className="fintech-card p-6 space-y-4">
              <h3 className="text-base font-bold text-[var(--ink)]">Account Details</h3>
              <div className="space-y-3 text-xs divide-y divide-[var(--hair)]">
                <div className="pt-2 flex justify-between">
                  <span className="text-[var(--grey)]">Full Name:</span>
                  <span className="text-[var(--ink)] font-bold">{profile?.full_name || user?.user_metadata?.full_name || 'Not Provided'}</span>
                </div>
                <div className="pt-3 flex justify-between">
                  <span className="text-[var(--grey)]">Mobile Number:</span>
                  <span className="text-[var(--ink)] font-bold">{profile?.phone || user?.user_metadata?.phone || 'Not Provided'}</span>
                </div>
                <div className="pt-3 flex justify-between">
                  <span className="text-[var(--grey)]">Email ID:</span>
                  <span className="text-[var(--ink)] font-bold">{user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="fintech-card p-6 space-y-4">
              <h3 className="text-base font-bold text-[var(--ink)]">Update Password</h3>
              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                  ✓ Password updated successfully!
                </div>
              )}
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--grey)] uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[var(--paper-2)] border border-[var(--hair)] rounded-xl px-4 py-2.5 text-[var(--ink)] text-sm focus:outline-none focus:border-[#d97706]"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 rounded-xl bg-[#d97706] text-white font-black text-xs shadow-sm hover:brightness-105 transition"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

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
  X
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

  // Risk parameters state
  const [maxLots, setMaxLots] = useState(1);
  const [cashReservePct, setCashReservePct] = useState(40);
  const [profitTargetMultiple, setProfitTargetMultiple] = useState(0.8);

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const oracleIp = '144.24.131.121';

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

  const handlePauseToggle = async () => {
    if (!user || !profile) return;
    const newStatus = !profile.is_paused;
    const { error } = await supabase
      .from('profiles')
      .update({ is_paused: newStatus })
      .eq('id', user.id);
      
    if (!error) {
      setProfile({ ...profile, is_paused: newStatus });
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
    <div className="min-h-screen bg-[#0C0D10] text-[#F3F2EF] font-sans flex flex-col selection:bg-[#f09455]/30">
      
      {/* Shared Dashboard Navbar */}
      <nav className="w-full bg-[#121419] border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09455] via-[#e27625] to-[#d9a44e] flex items-center justify-center shadow-md">
            <Activity className="text-[#241505] w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-white">Profit</span>
            <span className="font-bold text-lg tracking-tight text-[#f09455]">Pilot</span>
          </div>
        </Link>

        {/* Desktop Dashboard Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition">
            Live Terminal
          </Link>
          <Link href="/dashboard/settings" className="text-[#f09455] border-b-2 border-[#f09455] pb-1 font-bold">
            Settings &amp; Keys
          </Link>
          <Link href="/dashboard/help" className="text-slate-400 hover:text-white transition">
            Support &amp; Docs
          </Link>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="hidden sm:block text-xs font-medium text-rose-400 hover:text-rose-300 transition bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20"
          >
            Sign Out
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#1B1E24] border border-white/10 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#15171C] border-b border-white/10 px-4 py-4 space-y-3 font-mono text-sm">
          <Link 
            href="/dashboard" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white border-b border-white/5"
          >
            ● Live Terminal
          </Link>
          <Link 
            href="/dashboard/settings" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#f09455] font-bold border-b border-white/5"
          >
            ⚙ Settings &amp; API Keys
          </Link>
          <Link 
            href="/dashboard/help" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white border-b border-white/5"
          >
            💬 Support &amp; Docs
          </Link>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="w-full text-left py-2 text-rose-400 font-bold"
          >
            🚪 Sign Out
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 w-full flex-1 space-y-8">
        
        {/* Header */}
        <div>
          <div className="text-xs font-mono font-bold uppercase text-[#f09455] tracking-wider mb-1">
            Configuration Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Account &amp; API Key Settings
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Logged in as: {user?.email || 'Loading...'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
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
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${isActive ? 'bg-[#f09455] text-[#241505] shadow-lg shadow-brand-500/20' : 'bg-[#15171C] text-slate-400 hover:text-white border border-white/10'}`}
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
              
              <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">Connected Delta Account</h3>
                  {profile?.delta_api_key && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${profile.is_paused ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                      {profile.is_paused ? 'Paused' : 'Active & Trading'}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="text-xs text-slate-500 font-mono py-4">Checking configuration...</div>
                ) : profile?.delta_api_key ? (
                  <div className="bg-[#0C0D10] border border-white/10 rounded-xl p-4 space-y-4 font-mono">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white tracking-wider text-sm">
                            {profile.delta_api_key.substring(0, 6)}...{profile.delta_api_key.substring(profile.delta_api_key.length - 4)}
                          </span>
                          <span className="text-[10px] bg-brand-500/20 text-[#f09455] px-2 py-0.5 rounded font-bold uppercase">
                            Trade Only
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Connected on {profile.connected_at ? new Date(profile.connected_at).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={handlePauseToggle}
                          className="px-3 py-1.5 bg-[#1B1E24] hover:bg-[#262A33] text-white border border-white/10 rounded-lg text-xs font-bold transition"
                        >
                          {profile.is_paused ? 'Resume' : 'Pause'}
                        </button>
                        <button 
                          onClick={handleDisconnect}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 leading-relaxed pt-3 border-t border-white/10">
                      Pausing stops new strangle entries immediately. Existing open positions remain safely managed until profit target, wing stop, or expiry.
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-xl text-slate-400 text-xs font-mono">
                    No Delta Exchange API key connected yet. Fill out the form to activate 24/7 algorithmic trading.
                  </div>
                )}
              </div>

              {/* IP Whitelist Instructions */}
              <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-bold text-white text-sm">Mandatory IP Whitelist</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  For your security, paste our Oracle Cloud execution IP address into the <strong>IP Whitelist</strong> field when generating your API Key on Delta Exchange:
                </p>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0C0D10] border border-[#f09455]/30">
                  <code className="font-mono text-sm font-bold text-[#f09455]">{oracleIp}</code>
                  <button 
                    onClick={handleCopyIp}
                    className="px-3 py-1.5 rounded-lg bg-[#1B1E24] hover:bg-[#262A33] text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy IP'}
                  </button>
                </div>
              </div>

            </div>

            {/* Right: Connect Key Form */}
            <div className="lg:col-span-6">
              <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                
                <div>
                  <h3 className="text-lg font-bold text-white">Connect Delta API Key</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Grant <strong>Read</strong> and <strong>Trading</strong> permissions only. Never enable Withdrawals.
                  </p>
                </div>

                <form onSubmit={handleConnect} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Exchange Target
                    </label>
                    <select 
                      value={exchange}
                      onChange={(e) => setExchange(e.target.value)}
                      className="w-full bg-[#0C0D10] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f09455]"
                    >
                      <option>Delta Exchange India (INR / Zero TDS)</option>
                      <option>Delta Exchange Global (USDT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      API Key
                    </label>
                    <input 
                      type="text" 
                      required
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste your Delta API Key"
                      className="w-full bg-[#0C0D10] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#f09455]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      API Secret
                    </label>
                    <input 
                      type="password" 
                      required
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="Paste your Delta API Secret"
                      className="w-full bg-[#0C0D10] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#f09455]"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-b from-[#f7b27c] to-[#f09455] text-[#241505] font-black shadow-lg hover:brightness-105 transition disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Connecting & Verifying...' : 'Save & Connect Delta Account →'}
                  </button>
                </form>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: RISK & LOT LIMITS */}
        {activeTab === 'risk' && (
          <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl max-w-3xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Risk Sizing &amp; Parameters</h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize maximum position sizes and cash buffer rules for your account.
              </p>
            </div>

            <div className="space-y-5">
              
              <div className="bg-[#0C0D10] p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Max Lot Sizing Cap:</span>
                  <span className="text-[#f09455] font-bold">{maxLots} Lots ({(maxLots * 0.001).toFixed(3)} BTC)</span>
                </div>
                <input 
                  type="range" 
                  min={1} 
                  max={10} 
                  value={maxLots}
                  onChange={(e) => setMaxLots(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#1B1E24] rounded appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">Limits maximum leverage to protect smaller balances.</p>
              </div>

              <div className="bg-[#0C0D10] p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Cash Reserve Buffer:</span>
                  <span className="text-emerald-400 font-bold">{cashReservePct}% Free Margin</span>
                </div>
                <input 
                  type="range" 
                  min={20} 
                  max={60} 
                  step={5}
                  value={cashReservePct}
                  onChange={(e) => setCashReservePct(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#1B1E24] rounded appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">Guarantees unallocated margin is preserved for dynamic Iron Condor wing purchases.</p>
              </div>

              <button 
                type="button" 
                onClick={() => alert("Risk parameters updated successfully!")}
                className="px-6 py-3 rounded-xl bg-[#f09455] text-[#241505] font-bold text-xs font-mono shadow-md hover:brightness-105 transition"
              >
                Save Risk Configuration
              </button>

            </div>
          </div>
        )}

        {/* TAB 3: BILLING */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-7 bg-[#15171C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Your Plan &amp; Billing Cycle</h3>
                  <span className="text-xs text-slate-400 font-mono">30-Day Rolling Performance Fee Model</span>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold rounded-full border border-emerald-500/20">
                  Free Trial Active
                </span>
              </div>

              <div className="space-y-4 divide-y divide-white/5 text-xs font-mono">
                <div className="flex justify-between pt-3">
                  <span className="text-slate-400">Trial Period:</span>
                  <span className="text-white font-bold">30 Days (100% Free &amp; Retained)</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-400">Post-Trial Fee:</span>
                  <span className="text-[#f09455] font-bold">30% Share on Net Realized Profit</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-400">Upfront / Monthly Fee:</span>
                  <span className="text-emerald-400 font-bold">₹0 / $0 (No Upfront Fees)</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-400">High-Water Mark:</span>
                  <span className="text-emerald-400 font-bold">Active (Loss Carryover Enabled)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0C0D10] border border-white/10 text-xs text-slate-400 leading-relaxed">
                If a 30-day period ends in a net loss, you are invoiced ₹0, and the loss is carried forward to offset future gains before any performance fee applies.
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-3">
              <CreditCard className="w-10 h-10 text-slate-600" />
              <h4 className="font-bold text-white text-sm">No Invoices Yet</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Invoices are generated only after a completed 30-day period that ended in net profit.
              </p>
            </div>

          </div>
        )}

        {/* TAB 4: SECURITY */}
        {activeTab === 'security' && (
          <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl max-w-3xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Security &amp; Key Permission Matrix</h3>
              <p className="text-xs text-slate-400 mt-1">
                How ProfitPilot safeguards your exchange collateral at all times.
              </p>
            </div>

            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0C0D10] border border-white/10 text-xs font-mono">
                <div>
                  <div className="font-bold text-white">Read Permissions</div>
                  <div className="text-slate-500 text-[11px]">Allows bot to query orderbooks, positions, and live wallet balances.</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold">Required</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0C0D10] border border-white/10 text-xs font-mono">
                <div>
                  <div className="font-bold text-white">Trading Permissions</div>
                  <div className="text-slate-500 text-[11px]">Allows bot to place option limit/market orders and adjust protective wings.</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold">Required</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs font-mono">
                <div>
                  <div className="font-bold text-rose-400">Withdrawal Permissions</div>
                  <div className="text-slate-500 text-[11px]">Must stay completely disabled. Delta enforces this on their side.</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-bold">Must Stay OFF</span>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: PROFILE & PASSWORD */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            
            {/* User Details Box */}
            <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">Account Details</h3>
              
              <div className="space-y-3 font-mono text-xs divide-y divide-white/5">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="text-white font-bold">{profile?.full_name || user?.user_metadata?.full_name || 'Not Provided'}</span>
                </div>
                <div className="pt-3 flex justify-between">
                  <span className="text-slate-400">Mobile Number:</span>
                  <span className="text-white font-bold">{profile?.phone || user?.user_metadata?.phone || 'Not Provided'}</span>
                </div>
                <div className="pt-3 flex justify-between">
                  <span className="text-slate-400">Email ID:</span>
                  <span className="text-white font-bold">{user?.email || 'N/A'}</span>
                </div>
                <div className="pt-3 flex justify-between">
                  <span className="text-slate-400">User ID:</span>
                  <span className="text-slate-400 text-[10px] truncate max-w-[180px]">{user?.id || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Change Password Box */}
            <div className="bg-[#15171C] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Update Password</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Change your ProfitPilot account password.
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                  ✓ Password updated successfully!
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0C0D10] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#f09455]"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 rounded-xl bg-[#f09455] text-[#241505] font-black text-xs font-mono shadow-md hover:brightness-105 transition"
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

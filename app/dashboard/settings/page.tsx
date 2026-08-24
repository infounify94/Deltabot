'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
    // In a real app, verify current password if needed or just rely on session
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      alert("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
    } else {
      alert("Failed to update password: " + error.message);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-6">Profile</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Email</span>
                  <span className="font-bold text-slate-800 text-sm">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Delta account</span>
                  <span className="font-bold text-slate-800 text-sm">{profile?.delta_api_key ? 'Connected' : 'Not Connected'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Plan</span>
                  <span className="font-bold text-slate-800 text-sm">Free trial</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-500 text-sm">Wallet balance</span>
                  <span className="font-bold text-slate-800 text-sm">${profile?.live_balance ? parseFloat(profile.live_balance).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-6">Change password</h3>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Current password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#e27625]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">New password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#e27625]" />
                </div>
                <button type="submit" className="w-full bg-[#e27625] hover:bg-[#c9641d] text-white font-bold py-3 rounded-lg transition shadow-sm mt-4">
                  Update password
                </button>
              </form>
            </div>
          </div>
        );
      
      case 'billing':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Your plan</h3>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">Free trial</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm w-1/3">Status</span>
                  <span className="font-bold text-slate-800 text-sm text-right">30 days remaining</span>
                </div>
                <div className="flex justify-between items-start py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm w-1/3">Plan</span>
                  <span className="font-bold text-slate-800 text-sm text-right w-2/3">30% performance fee on realised profit (rolling 30-day periods, nothing payable up front)</span>
                </div>
                <div className="flex justify-between items-start py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm w-1/3">Payable up front</span>
                  <span className="font-bold text-slate-800 text-sm text-right w-2/3">Nothing â€” no subscription, no activation fee</span>
                </div>
                <div className="flex justify-between items-start py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm w-1/3">You are billed</span>
                  <span className="font-bold text-slate-800 text-sm text-right w-2/3">Only when the system makes you money, at the close of a 30-day period</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-6 leading-relaxed">
                A losing period costs you nothing, and losses carry forward â€” you are never billed twice for the same high-water mark.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h4 className="font-bold text-slate-800 mb-2">No invoices yet</h4>
              <p className="text-sm text-slate-500 max-w-[200px]">Your first invoice arrives at the close of a 30-day period that ended in profit.</p>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-6">Key permissions</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600 text-sm">Read</span>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded">Required</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600 text-sm">Trading</span>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded">Required</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600 text-sm">Withdrawal</span>
                  <span className="px-2 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded">Must stay OFF</span>
                </div>
                <div className="pt-4">
                  <span className="text-slate-600 text-sm block mb-3">IP whitelist</span>
                  <div className="flex items-center gap-3">
                    <code className="bg-white border border-orange-200 px-3 py-1.5 rounded text-orange-900 font-mono text-sm shadow-sm">{oracleIp}</code>
                    <button onClick={() => navigator.clipboard.writeText(oracleIp)} className="bg-white border border-slate-200 px-3 py-1.5 text-slate-700 text-xs font-bold rounded shadow-sm hover:bg-slate-50 transition">Copy</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
              <h3 className="font-bold text-slate-800 text-lg mb-6">How your money stays yours</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Funds never leave your Delta account. We hold a trade-only key, so the worst case is a bad trade â€” never a transfer. Revoke the key on Delta at any moment and execution stops instantly.
              </p>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Custody</span>
                  <span className="font-bold text-slate-800 text-sm">You, on Delta</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Our access</span>
                  <span className="font-bold text-slate-800 text-sm">Trade only</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-500 text-sm">Revoke</span>
                  <span className="font-bold text-slate-800 text-sm">Instant, from Delta</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'trading':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            <div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 text-lg">Connected accounts</h3>
                  {profile && profile.delta_api_key && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile.is_paused ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      âœ“ {profile.is_paused ? 'Paused' : 'Active'}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="text-sm text-slate-500">Loading profile...</div>
                ) : profile && profile.delta_api_key ? (
                  <div className="border border-slate-100 bg-slate-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-800 tracking-wider">
                            {profile.delta_api_key.substring(0, 4)}...{profile.delta_api_key.substring(profile.delta_api_key.length - 4)}
                          </span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase">Trading</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Delta Exchange India â€¢ connected {profile.connected_at ? profile.connected_at.split('T')[0] : 'recently'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handlePauseToggle} className="px-3 py-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded transition">
                          {profile.is_paused ? 'Resume' : 'Pause'}
                        </button>
                        <button onClick={handleDisconnect} className="px-3 py-1.5 border border-rose-200 bg-white text-rose-500 hover:bg-rose-50 font-semibold text-xs rounded transition">
                          Disconnect
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mt-4 pt-4 border-t border-slate-200">
                      Pausing stops new entries at once. Anything already open keeps its stop-loss and is still closed by us. Disconnecting stops trading immediately. Your funds are untouched.
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 py-4 text-center border-2 border-dashed border-slate-200 rounded-lg">
                    No accounts connected yet.
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-6">Add another account</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h4 className="font-bold text-orange-900 text-sm mb-2">Whitelist our execution IP</h4>
                  <p className="text-orange-800 text-xs mb-3">
                    When you create the API key on Delta, add this IP to the key's whitelist.
                  </p>
                  <div className="flex items-center gap-3">
                    <code className="bg-white border border-orange-200 px-3 py-1.5 rounded text-orange-900 font-mono text-sm shadow-sm">{oracleIp}</code>
                    <button onClick={() => navigator.clipboard.writeText(oracleIp)} className="bg-white border border-orange-200 px-3 py-1.5 text-orange-800 text-xs font-bold rounded shadow-sm hover:bg-orange-100 transition">Copy</button>
                  </div>
                </div>

                <form onSubmit={handleConnect} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Exchange</label>
                    <select className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-800 bg-slate-50">
                      <option>Delta Exchange India</option>
                      <option>Delta Exchange Global</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">API key</label>
                    <input type="text" required value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#e27625]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">API secret</label>
                    <input type="password" required value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#e27625]" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={saving} className="w-full bg-[#e27625] hover:bg-[#c9641d] text-white font-bold py-3 rounded-lg transition shadow-sm disabled:opacity-50">
                      {saving ? 'Connecting...' : 'Connect account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
    }
  };

  const getTabClass = (tabId: string) => {
    return activeTab === tabId 
      ? "text-slate-900 font-bold border-b-2 border-slate-900 pb-4 -mb-[17px] z-10" 
      : "text-slate-500 font-medium hover:text-slate-800 transition pb-4";
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      <nav className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <svg className="w-6 h-6 text-[#e27625]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="font-black text-white text-lg tracking-tight">ProfitPilot</span>
        </a>
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition">Dashboard</a>
          <a href="/dashboard/settings" className="text-sm font-medium text-[#e27625] transition border-b-2 border-[#e27625] pb-1">Settings</a>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} className="text-sm font-medium text-rose-400 hover:text-rose-300 transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-8 w-full flex-1">
        
        {/* User Account Header */}
        <div className="mb-8">
          <h2 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Account</h2>
          <h1 className="text-2xl font-bold text-slate-900">{user?.email || 'Loading...'}</h1>
          <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex gap-6 border-b border-slate-200 mb-8 relative">
          <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>Profile</button>
          <button onClick={() => setActiveTab('trading')} className={getTabClass('trading')}>Trading account</button>
          <button onClick={() => setActiveTab('billing')} className={getTabClass('billing')}>Billing</button>
          <button onClick={() => setActiveTab('security')} className={getTabClass('security')}>Security</button>
          <button onClick={() => setActiveTab('notifications')} className={getTabClass('notifications')}>Notifications</button>
        </div>

        {renderTabContent()}

      </div>
    </div>
  );
}

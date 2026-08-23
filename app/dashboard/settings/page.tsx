'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const oracleIp = "144.24.131.121";

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data || null);
    }
    setLoading(false);
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Mask the secret for display later
    const maskedSecret = apiSecret.substring(0, 4) + '...';
    
    // In a real production app, the secret would be encrypted before storing.
    // For this prototype, we rely on Supabase Row Level Security (RLS) to keep it safe.
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      delta_api_key: apiKey,
      delta_api_secret: apiSecret,
      is_paused: false,
      connected_at: new Date().toISOString()
    });

    if (!error) {
      setApiKey('');
      setApiSecret('');
      fetchProfile();
    } else {
      alert("Error saving API keys. Make sure the database table exists.");
    }
    setSaving(false);
  }

  async function handlePauseToggle() {
    if (!profile) return;
    const newStatus = !profile.is_paused;
    await supabase.from('profiles').update({ is_paused: newStatus }).eq('id', profile.id);
    fetchProfile();
  }

  async function handleDisconnect() {
    if (!profile) return;
    if (confirm("Are you sure you want to disconnect this account? Trading will stop immediately.")) {
      await supabase.from('profiles').delete().eq('id', profile.id);
      setProfile(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Main Shared Navbar */}
      <nav className="w-full bg-[#050505] py-4 px-6 flex items-center justify-between shadow-md z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">ProfitPilot</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition">Dashboard</a>
          <a href="/dashboard/settings" className="text-sm font-medium text-white transition border-b-2 border-indigo-500 pb-1">Settings</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-8 w-full flex-1">
        
        {/* Settings Navigation Tabs */}
        <div className="flex gap-6 border-b border-slate-200 mb-8 pb-4">
          <button className="text-slate-500 font-medium hover:text-slate-800 transition">Profile</button>
          <button className="text-slate-900 font-bold border-b-2 border-slate-900 pb-4 -mb-4">Trading account</button>
          <button className="text-slate-500 font-medium hover:text-slate-800 transition">Billing</button>
          <button className="text-slate-500 font-medium hover:text-slate-800 transition">Security</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Connected Accounts */}
          <div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Connected accounts</h3>
                {profile && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile.is_paused ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    ✓ {profile.is_paused ? 'Paused' : 'Active'}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="text-sm text-slate-500">Loading profile...</div>
              ) : profile ? (
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
                        Delta Exchange India • connected {profile.connected_at ? profile.connected_at.split('T')[0] : 'recently'}
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
                    Pausing stops new entries at once. Anything already open keeps its stop-loss and is still closed by us — pausing never strands a position. Disconnecting stops trading on that account immediately. Your funds and the Delta account itself are untouched — only the API key is removed from ProfitPilot.
                  </p>
                </div>
              ) : (
                <div className="text-sm text-slate-500 py-4 text-center border-2 border-dashed border-slate-200 rounded-lg">
                  No accounts connected yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Add Account Form */}
          <div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-6">Add another account</h3>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-orange-900 text-sm mb-2">Whitelist our execution IP</h4>
                <p className="text-orange-800 text-xs mb-3">
                  When you create the API key on Delta, add this IP to the key's whitelist — trades for your account are placed only from this address.
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
                  <input 
                    type="text" 
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Delta API key" 
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">API secret</label>
                  <input 
                    type="password" 
                    required
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter your Delta API secret" 
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" 
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full bg-[#e27625] hover:bg-[#c9641d] text-white font-bold py-3 rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Connecting...' : 'Connect account'}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

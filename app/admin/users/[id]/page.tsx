'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Activity, AlertCircle, ArrowLeft, TrendingUp, Key, Save } from 'lucide-react';
import Link from 'next/link';

export default function AdminUserDetail({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [params.id]);

  const fetchUserData = async () => {
    // Use RPC to bypass RLS
    const { data: allUsers } = await supabase.rpc('admin_get_all_users');
    const p = (allUsers || []).find((u: any) => u.id === params.id);
    if (p) setProfile(p);

    const { data: events } = await supabase
      .from('trade_events')
      .select('*, positions!inner(user_id, underlying)')
      .eq('positions.user_id', params.id)
      .order('created_at', { ascending: false });
    
    if (events) setTrades(events);
    setLoading(false);
  };

  const handlePauseUser = async () => {
    if (!profile) return;
    await supabase.from('profiles').update({ is_paused: !profile.is_paused }).eq('id', profile.id);
    fetchUserData();
  };

  const handleSaveApiKeys = async () => {
    if (!apiKey || !apiSecret) return;
    setSaving(true);
    setSaveMsg('');
    
    const { error } = await supabase
      .from('profiles')
      .update({
        delta_api_key: apiKey,
        delta_api_secret: apiSecret,
        connected_at: new Date().toISOString(),
        is_paused: false
      })
      .eq('id', params.id);
    
    if (error) {
      setSaveMsg(`Error: ${error.message}`);
    } else {
      setSaveMsg('API keys saved successfully!');
      setApiKey('');
      setApiSecret('');
      fetchUserData();
    }
    setSaving(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);
  };

  if (loading) return <div className="p-8 text-[var(--grey)]">Loading user data...</div>;
  if (!profile) return <div className="p-8 text-rose-600">User not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[var(--grey)] hover:text-[var(--ink)] mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to God View
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ink)]">{profile.full_name || profile.email?.split('@')[0] || 'Unnamed User'}</h1>
            <p className="text-sm text-[var(--grey)]">{profile.email}</p>
          </div>
          {profile.delta_api_key ? (
            <button
              onClick={handlePauseUser}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                profile.is_paused 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              {profile.is_paused ? 'Resume Trading' : 'Pause Trading'}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" /> Not Connected
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="fintech-card p-5 shadow-subtle space-y-3">
          <div className="text-sm font-medium text-[var(--grey)]">Live Balance</div>
          <div className="text-2xl font-bold font-mono num-tabular">{formatCurrency(profile.live_balance)}</div>
        </div>
        
        <div className="fintech-card p-5 shadow-subtle space-y-3">
          <div className="text-sm font-medium text-[var(--grey)]">Unrecovered Losses (HWM)</div>
          <div className="text-2xl font-bold font-mono text-rose-600 num-tabular">{formatCurrency(profile.unrecovered_losses)}</div>
        </div>

        <div className="fintech-card p-5 shadow-subtle space-y-3">
          <div className="text-sm font-medium text-[var(--grey)]">API Connection</div>
          <div className="text-lg font-bold">
            {profile.delta_api_key ? (
              <span className="text-emerald-600 flex items-center gap-2"><Activity className="w-5 h-5" /> Connected</span>
            ) : (
              <span className="text-amber-600 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Missing</span>
            )}
          </div>
        </div>
      </div>

      {/* API Key Setup (Admin can set for user) */}
      {!profile.delta_api_key && (
        <div className="fintech-card shadow-subtle p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-[#d97706]" />
            <h2 className="font-semibold text-[var(--ink)]">Setup API Keys for {profile.full_name || profile.email}</h2>
          </div>
          <p className="text-sm text-[var(--grey)] mb-4">
            This user has not connected their Delta Exchange API keys yet. As an admin, you can set them here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--grey)] mb-1.5">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Enter Delta Exchange API Key"
                className="w-full px-3 py-2 rounded-lg border border-[var(--hair)] bg-[var(--paper)] text-sm font-mono text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--grey)] mb-1.5">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
                placeholder="Enter Delta Exchange API Secret"
                className="w-full px-3 py-2 rounded-lg border border-[var(--hair)] bg-[var(--paper)] text-sm font-mono text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706]"
              />
            </div>
          </div>
          {saveMsg && (
            <div className={`text-sm mb-3 ${saveMsg.startsWith('Error') ? 'text-rose-600' : 'text-emerald-600'}`}>
              {saveMsg}
            </div>
          )}
          <button
            onClick={handleSaveApiKeys}
            disabled={saving || !apiKey || !apiSecret}
            className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save API Keys'}
          </button>
        </div>
      )}

      <div className="fintech-card shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--hair)]">
          <h2 className="font-semibold text-[var(--ink)]">User Trade Ledger</h2>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--paper-2)] text-[var(--grey)] text-xs uppercase border-b border-[var(--hair)] sticky top-0">
              <tr>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Instrument</th>
                <th className="px-5 py-3 font-medium">PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hair)]">
              {trades.map(t => {
                const date = new Date(t.created_at);
                const pnl = t.detail?.realized_pnl;
                return (
                  <tr key={t.id} className="hover:bg-[var(--paper-2)] transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-[var(--grey)]">
                      {date.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-medium capitalize text-[var(--ink)]">
                      {t.event_type.replace('_', ' ')}
                    </td>
                    <td className="px-5 py-4 text-[var(--grey)]">
                      {t.positions?.underlying}
                    </td>
                    <td className="px-5 py-4 font-mono num-tabular font-semibold">
                      {pnl !== undefined ? (
                        <span className={pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[var(--grey)] text-sm">
                    No trades found for this user.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

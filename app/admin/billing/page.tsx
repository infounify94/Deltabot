'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, FileText, CheckCircle2, AlertTriangle, RefreshCw, Users } from 'lucide-react';

export default function AdminBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.rpc('admin_get_all_users');
    if (data) setAllUsers(data);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_get_all_invoices');
    
    if (error) console.error("Fetch invoices error:", error);
    
    if (data) {
      const { data: profiles } = await supabase.rpc('admin_get_all_users');
      const enriched = data.map((inv: any) => {
        const prof = profiles?.find((p: any) => p.id === inv.user_id);
        return { ...inv, profiles: prof };
      });
      setInvoices(enriched);
    }
    setLoading(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUserIds.length === allUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(allUsers.map(u => u.id));
    }
  };

  const handleGenerateBilling = async () => {
    const targetDesc = selectedUserIds.length > 0 
      ? `${selectedUserIds.length} selected user(s)` 
      : 'all users';
    
    if (!confirm(`Generate invoices for ${targetDesc} for the previous month? This will update High-Water Marks and create Unpaid invoices for profitable users.`)) return;
    
    setGenerating(true);
    setMessage('Generating invoices...');
    
    try {
      const body = selectedUserIds.length > 0 
        ? JSON.stringify({ user_ids: selectedUserIds })
        : '{}';
      
      const res = await fetch('/api/billing/generate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body 
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage(`Success! Billing cycle for ${data.billingMonth} complete. ${data.results?.length || 0} statement(s) generated.`);
        fetchInvoices();
        setSelectedUserIds([]);
        setShowUserPicker(false);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Billing &amp; Invoices</h1>
          <p className="text-sm text-[var(--grey)]">Automated performance fee billing with High-Water Mark tracking.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUserPicker(!showUserPicker)}
            className="inline-flex items-center gap-2 border border-[var(--hair)] text-[var(--ink)] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--paper-2)]"
          >
            <Users className="w-4 h-4" />
            {selectedUserIds.length > 0 ? `${selectedUserIds.length} Selected` : 'Select Users'}
          </button>
          <button
            onClick={handleGenerateBilling}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-subtle disabled:opacity-50"
          >
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            {generating ? 'Generating...' : selectedUserIds.length > 0 ? `Generate for ${selectedUserIds.length} User(s)` : 'Generate All Invoices'}
          </button>
        </div>
      </div>

      {/* User Picker Dropdown */}
      {showUserPicker && (
        <div className="fintech-card shadow-subtle p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--ink)]">Select Users for Invoice Generation</h3>
            <button onClick={toggleAllUsers} className="text-xs text-[#d97706] font-medium hover:underline">
              {selectedUserIds.length === allUsers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allUsers.map(u => (
              <label key={u.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedUserIds.includes(u.id) 
                  ? 'border-[#d97706] bg-amber-50' 
                  : 'border-[var(--hair)] hover:bg-[var(--paper-2)]'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(u.id)}
                  onChange={() => toggleUserSelection(u.id)}
                  className="w-4 h-4 accent-[#d97706] rounded"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--ink)] truncate">{u.full_name || 'Unnamed'}</div>
                  <div className="text-xs text-[var(--grey)] truncate">{u.email}</div>
                </div>
                {u.delta_api_key ? (
                  <span className="ml-auto text-xs text-emerald-600 font-medium shrink-0">Connected</span>
                ) : (
                  <span className="ml-auto text-xs text-amber-600 font-medium shrink-0">No API</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-lg text-sm border ${
          message.startsWith('Error') 
            ? 'bg-rose-50 text-rose-700 border-rose-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {message}
        </div>
      )}

      <div className="fintech-card shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--hair)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--ink)]">All Invoices</h2>
          <span className="text-xs text-[var(--grey)]">{invoices.length} invoice(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--paper-2)] text-[var(--grey)] text-xs uppercase border-b border-[var(--hair)]">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Month</th>
                <th className="px-5 py-3 font-medium">Profit</th>
                <th className="px-5 py-3 font-medium">HWM Offset</th>
                <th className="px-5 py-3 font-medium">Fee (30%)</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hair)]">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-[var(--paper-2)] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[var(--ink)]">{inv.profiles?.full_name || inv.profiles?.email?.split('@')[0] || 'Unnamed'}</div>
                    <div className="text-xs text-[var(--grey)]">{inv.profiles?.email}</div>
                  </td>
                  <td className="px-5 py-4 font-medium">{inv.billing_month}</td>
                  <td className="px-5 py-4 font-mono text-emerald-600 num-tabular">{Number(inv.total_profit) >= 0 ? '+' : ''}{formatCurrency(inv.total_profit)}</td>
                  <td className="px-5 py-4 font-mono text-rose-600 num-tabular">-{formatCurrency(inv.previous_losses)}</td>
                  <td className="px-5 py-4 font-mono font-bold text-[#d97706] num-tabular">{formatCurrency(inv.fee_amount)}</td>
                  <td className="px-5 py-4">
                    {inv.status === 'Paid' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </span>
                    ) : inv.status === 'No Fee' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> No Fee
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" /> Unpaid
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <a 
                      href={`/admin/billing/${inv.id}`} 
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--ink)] border border-[var(--hair)] hover:bg-[var(--paper-2)] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> View / Print
                    </a>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[var(--grey)] text-sm">
                    No invoices generated yet.
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

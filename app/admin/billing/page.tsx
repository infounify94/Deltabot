'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, FileText, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*, profiles(email, full_name)')
      .order('created_at', { ascending: false });
    
    if (data) setInvoices(data);
    setLoading(false);
  };

  const handleGenerateBilling = async () => {
    if (!confirm('Are you sure you want to generate invoices for the previous month? This will update High-Water Marks and create Unpaid invoices for profitable users.')) return;
    
    setGenerating(true);
    setMessage('Generating invoices...');
    
    try {
      const res = await fetch('/api/billing/generate', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        const invoicedCount = data.results.filter((r: any) => r.status === 'Invoiced').length;
        setMessage(`Success! Billing cycle for ${data.billingMonth} complete. ${invoicedCount} invoices were created.`);
        fetchInvoices();
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Billing &amp; Invoices</h1>
          <p className="text-sm text-[var(--grey)]">Automated performance fee billing with High-Water Mark tracking.</p>
        </div>
        
        <button
          onClick={handleGenerateBilling}
          disabled={generating}
          className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-subtle disabled:opacity-50"
        >
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
          {generating ? 'Generating...' : 'Generate Monthly Invoices'}
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">
          {message}
        </div>
      )}

      <div className="fintech-card shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--hair)]">
          <h2 className="font-semibold text-[var(--ink)]">All Invoices</h2>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hair)]">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-[var(--paper-2)] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[var(--ink)]">{inv.profiles?.full_name || 'Unnamed'}</div>
                    <div className="text-xs text-[var(--grey)]">{inv.profiles?.email}</div>
                  </td>
                  <td className="px-5 py-4 font-medium">{inv.billing_month}</td>
                  <td className="px-5 py-4 font-mono text-emerald-600 num-tabular">+{formatCurrency(inv.total_profit)}</td>
                  <td className="px-5 py-4 font-mono text-rose-600 num-tabular">-{formatCurrency(inv.previous_losses)}</td>
                  <td className="px-5 py-4 font-mono font-bold text-[#d97706] num-tabular">{formatCurrency(inv.fee_amount)}</td>
                  <td className="px-5 py-4">
                    {inv.status === 'Paid' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" /> Unpaid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[var(--grey)] text-sm">
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Invoice = { id: string; billing_month: string; fee_amount: number; status: string; due_date: string | null };

export function BillingList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function fetchInvoices() {
      setLoading(true);
      setError('');
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Please sign in again to view your invoices.');
        const { data, error } = await supabase.from('invoices').select('id,billing_month,fee_amount,status,due_date').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw new Error('We could not load your invoices. Please try again.');
        if (active) setInvoices(data || []);
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : 'Unable to load billing records.');
      } finally { if (active) setLoading(false); }
    }
    fetchInvoices();
    return () => { active = false; };
  }, [attempt]);
  return <section className="space-y-6" aria-labelledby="billing-title">
    <div><p className="text-sm font-medium text-[var(--indigo)]">Your account</p><h1 id="billing-title" className="mt-1 text-2xl sm:text-3xl font-bold">Billing & invoices</h1><p className="mt-2 text-sm text-[var(--grey)]">Review your monthly statements. Open an invoice to preview, print, or save it as a PDF.</p></div>
    {loading ? <p role="status" className="fintech-card p-6">Loading invoices…</p> : error ? <div role="alert" className="fintech-card p-6 space-y-3"><p>{error}</p><button onClick={() => setAttempt(value => value + 1)} className="min-h-11 rounded-lg border border-[var(--hair-2)] px-4">Try again</button></div> : invoices.length === 0 ? <div className="fintech-card p-8 text-center"><CreditCard className="mx-auto mb-3 h-8 w-8 text-[var(--grey)]" /><h2 className="font-semibold">No invoices yet</h2><p className="mt-2 text-sm text-[var(--grey)]">Your statements will appear here after a billing period is processed.</p></div> : <div className="space-y-3">{invoices.map(invoice => <article key={invoice.id} className="fintech-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0"><h2 className="font-semibold">{invoice.billing_month}</h2><p className="mt-1 text-sm text-[var(--grey)]">{invoice.status} · {invoice.due_date ? `Due ${invoice.due_date.slice(0, 10)}` : 'No due date'}</p><p className="mt-2 text-xs font-mono text-[var(--grey)]">Invoice #{invoice.id.split('-')[0].toUpperCase()}</p></div>
      <div className="flex flex-wrap items-center justify-between gap-4"><span className="font-mono text-lg">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(invoice.fee_amount))}</span><Link href={`/dashboard/billing/${invoice.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--hair-2)] px-4 text-sm font-medium hover:bg-[var(--raise)]" aria-label={`Preview invoice for ${invoice.billing_month}`}>Preview / PDF<ArrowUpRight className="h-4 w-4" /></Link></div>
    </article>)}</div>}
  </section>;
}

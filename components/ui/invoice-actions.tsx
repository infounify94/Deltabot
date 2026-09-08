'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Download, Printer } from 'lucide-react';

export function InvoiceActions({ backHref, invoiceId }: { backHref: string; invoiceId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function download() {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, { cache: 'no-store' });
      if (!response.ok || !response.headers.get('Content-Type')?.includes('application/pdf')) throw new Error(response.status === 401 ? 'Your session expired. Please sign in again.' : 'Unable to download your invoice. Please try again.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = `ProfitPilot-Invoice-${invoiceId}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) { setError(error instanceof Error ? error.message : 'Download failed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="mb-8 print:hidden flex flex-wrap items-center justify-between gap-3">
    <Link href={backHref} className="text-sm text-gray-600 underline underline-offset-4">← Back to billing</Link>
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.print()} className="min-h-11 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50"><Printer className="h-4 w-4" />Print</button>
    <button type="button" disabled={busy} onClick={download} className="min-h-11 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"><Download className="h-4 w-4" />{busy ? 'Preparing…' : 'Download PDF'}</button></div>
    <p className="w-full text-sm text-gray-600">Generated from your billing records. No receipt files are stored.</p>
    {error && <p role="alert" className="w-full text-sm text-red-700">{error}</p>}
  </div>;
}

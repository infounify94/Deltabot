import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Activity } from 'lucide-react';

export default async function InvoicePrintView({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) redirect('/dashboard');

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, profiles(email, full_name)')
    .eq('id', params.id)
    .single();

  if (!invoice) {
    return <div className="p-10 font-sans">Invoice not found.</div>;
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const invoiceDate = new Date(invoice.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  
  const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 p-8 sm:p-16 max-w-4xl mx-auto">
      {/* Print Button (Hidden when printing) */}
      <div className="mb-8 print:hidden flex justify-end">
        <button 
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm shadow hover:bg-blue-700 transition"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <Activity className="text-white w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight">ProfitPilot</span>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>123 Quant Street</p>
            <p>New York, NY 10001</p>
            <p>billing@profitpilot.com</p>
          </div>
        </div>
        
        <div className="text-right">
          <h1 className="text-4xl font-light text-gray-400 uppercase tracking-widest mb-4">Invoice</h1>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500 inline-block w-24">Invoice #</span> <span className="font-mono">{invoice.id.split('-')[0].toUpperCase()}</span></p>
            <p><span className="text-gray-500 inline-block w-24">Date</span> {invoiceDate}</p>
            <p><span className="text-gray-500 inline-block w-24">Due Date</span> <span className="font-medium text-red-600">{dueDate}</span></p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-12">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
        <p className="font-medium text-lg">{invoice.profiles?.full_name || 'Valued Customer'}</p>
        <p className="text-gray-600">{invoice.profiles?.email}</p>
      </div>

      {/* Invoice Details */}
      <table className="w-full text-left mb-12">
        <thead>
          <tr className="border-b-2 border-black text-sm uppercase tracking-wider text-gray-600">
            <th className="py-3 font-semibold">Description</th>
            <th className="py-3 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          <tr className="border-b border-gray-200">
            <td className="py-4">
              <p className="font-medium">Performance Fee - {invoice.billing_month}</p>
              <p className="text-gray-500 text-xs mt-1">Gross Trading Profit for the period</p>
            </td>
            <td className="py-4 text-right font-mono text-emerald-600">
              +{formatCurrency(invoice.total_profit)}
            </td>
          </tr>
          {invoice.previous_losses > 0 && (
            <tr className="border-b border-gray-200 bg-gray-50">
              <td className="py-4 px-2">
                <p className="font-medium">High-Water Mark Offset</p>
                <p className="text-gray-500 text-xs mt-1">Deduction for unrecovered previous losses</p>
              </td>
              <td className="py-4 px-2 text-right font-mono text-red-600">
                -{formatCurrency(invoice.previous_losses)}
              </td>
            </tr>
          )}
          <tr className="border-b border-gray-200">
            <td className="py-4">
              <p className="font-medium">Net Billable Profit</p>
            </td>
            <td className="py-4 text-right font-mono">
              {formatCurrency(invoice.total_profit - invoice.previous_losses)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-16">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Fee Percentage</span>
            <span>30%</span>
          </div>
          <div className="flex justify-between font-bold text-xl border-t-2 border-black pt-3">
            <span>Total Due</span>
            <span className="font-mono">{formatCurrency(invoice.fee_amount)}</span>
          </div>
          
          <div className="pt-4 text-right">
            {invoice.status === 'Paid' ? (
              <span className="inline-block px-4 py-1.5 border-2 border-emerald-500 text-emerald-600 font-bold uppercase tracking-wider text-sm rounded transform -rotate-2">Paid in Full</span>
            ) : (
              <span className="inline-block px-4 py-1.5 border-2 border-red-500 text-red-600 font-bold uppercase tracking-wider text-sm rounded transform -rotate-2">Payment Required</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-8 text-center text-xs text-gray-500">
        <p>Please remit payment by {dueDate} to avoid automated account suspension.</p>
        <p className="mt-1">Thank you for trading with ProfitPilot.</p>
      </div>

    </div>
  );
}

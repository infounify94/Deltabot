import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { createInvoicePdf } from '@/lib/invoice-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' };

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: privateHeaders });
  const cookieStore = cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: values => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail('Please sign in to download this invoice.', 401);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) return fail('Invoice not found.', 404);
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  let query = supabase.from('invoices').select('*').eq('id', params.id);
  if (!profile?.is_admin) query = query.eq('user_id', user.id);
  const { data: invoice, error } = await query.maybeSingle();
  if (error) return fail('Unable to load the invoice. Please try again.', 503);
  if (!invoice) return fail('Invoice not found.', 404);
  const { data: customer, error: customerError } = await supabase.from('profiles').select('full_name,email').eq('id', invoice.user_id).maybeSingle();
  if (customerError) return fail('Unable to load billing details. Please try again.', 503);
  try {
    const pdf = await createInvoicePdf(invoice, customer || { email: invoice.user_id === user.id ? user.email : null });
    return new NextResponse(Buffer.from(pdf), { headers: { ...privateHeaders, 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="ProfitPilot-Invoice-${invoice.id}.pdf"` } });
  } catch {
    return fail('Unable to generate the PDF. Please try again.', 500);
  }
}

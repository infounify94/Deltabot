import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  // NOTE: In production, this should be protected by a secure Cron secret,
  // e.g., checking if req.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const now = new Date().toISOString();

    // Find all overdue, unpaid invoices
    const { data: overdueInvoices, error: fetchErr } = await supabase
      .from('invoices')
      .select('user_id')
      .eq('status', 'Unpaid')
      .lt('due_date', now);

    if (fetchErr) throw fetchErr;

    const userIdsToPause = overdueInvoices?.map(inv => inv.user_id) || [];

    if (userIdsToPause.length > 0) {
      // Auto-pause users who have overdue invoices
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ is_paused: true })
        .in('id', userIdsToPause);
        
      if (updateErr) throw updateErr;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Enforcement complete. Paused ${userIdsToPause.length} users with overdue invoices.` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

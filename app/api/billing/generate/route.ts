import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to get last month's name and start/end dates
function getLastMonthInfo() {
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayLastMonth = new Date(firstDayThisMonth.getTime() - 1);
  const firstDayLastMonth = new Date(lastDayLastMonth.getFullYear(), lastDayLastMonth.getMonth(), 1);
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const billingMonth = `${monthNames[lastDayLastMonth.getMonth()]} ${lastDayLastMonth.getFullYear()}`;
  
  return { billingMonth, firstDayLastMonth, lastDayLastMonth, firstDayThisMonth };
}

export async function POST(req: Request) {
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

  // Authenticate and verify Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { billingMonth, firstDayLastMonth, firstDayThisMonth } = getLastMonthInfo();

  try {
    // 1. Fetch all users
    const { data: users, error: usersErr } = await supabase.from('profiles').select('*');
    if (usersErr) throw usersErr;

    const results = [];

    // 2. Loop through users to generate invoices
    for (const u of users) {
      // Fetch closed positions for the previous month
      const { data: positions } = await supabase
        .from('positions')
        .select('realized_pnl')
        .eq('user_id', u.id)
        .eq('status', 'closed')
        .gte('closed_at', firstDayLastMonth.toISOString())
        .lt('closed_at', firstDayThisMonth.toISOString());

      const thisMonthPnl = positions?.reduce((sum, p) => sum + Number(p.realized_pnl || 0), 0) || 0;
      const previousLosses = Number(u.unrecovered_losses || 0);

      // Calculate Net Billable Profit
      let netBillableProfit = thisMonthPnl - previousLosses;
      let newUnrecoveredLosses = 0;
      let feeAmount = 0;
      let invoiceCreated = false;

      if (netBillableProfit <= 0) {
        // Did not clear HWM, all losses carry forward
        newUnrecoveredLosses = Math.abs(netBillableProfit);
      } else {
        // Cleared HWM and made profit
        newUnrecoveredLosses = 0;
        feeAmount = netBillableProfit * 0.30; // 30% performance fee
      }

      // Update unrecovered losses in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ unrecovered_losses: newUnrecoveredLosses })
        .eq('id', u.id);

      if (updateError) throw updateError;

      // Always generate an invoice/statement record
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

      const invoiceStatus = feeAmount > 0 ? 'Unpaid' : 'No Fee';

      const { data: invoice, error: insertError } = await supabase
        .from('invoices')
        .insert({
          user_id: u.id,
          billing_month: billingMonth,
          total_profit: thisMonthPnl,
          previous_losses: previousLosses,
          fee_amount: feeAmount,
          status: invoiceStatus,
          due_date: dueDate.toISOString(),
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      invoiceCreated = true;
      results.push({ email: u.email, fee: feeAmount, status: invoiceStatus });
    }

    return NextResponse.json({ success: true, billingMonth, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
  }
}

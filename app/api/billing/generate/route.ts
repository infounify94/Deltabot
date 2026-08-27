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
    // Parse optional user_ids from request body
    let selectedUserIds: string[] | null = null;
    try {
      const body = await req.json();
      if (body.user_ids && Array.isArray(body.user_ids) && body.user_ids.length > 0) {
        selectedUserIds = body.user_ids;
      }
    } catch { /* no body or invalid JSON, generate for all */ }

    // 1. Fetch all users using RPC to bypass RLS
    const { data: allUsers, error: usersErr } = await supabase.rpc('admin_get_all_users');
    if (usersErr) throw usersErr;

    // Filter to selected users if specified
    const users = selectedUserIds
      ? allUsers.filter((u: any) => selectedUserIds!.includes(u.id))
      : allUsers;

    const results = [];

    // 2. Loop through users to generate invoices
    for (const u of users) {
      // Fetch closed positions for the previous month (user's own positions, so RLS might allow, but let's be safe)
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
        newUnrecoveredLosses = Math.abs(netBillableProfit);
      } else {
        newUnrecoveredLosses = 0;
        feeAmount = netBillableProfit * 0.30;
      }

      // Update unrecovered losses using RPC
      const { error: updateError } = await supabase.rpc('admin_update_unrecovered_losses', {
        p_user_id: u.id,
        p_new_losses: newUnrecoveredLosses
      });
      if (updateError) throw updateError;

      // Generate invoice using RPC
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const invoiceStatus = feeAmount > 0 ? 'Unpaid' : 'No Fee';

      const { error: insertError } = await supabase.rpc('admin_generate_invoice', {
        p_user_id: u.id,
        p_billing_month: billingMonth,
        p_total_profit: thisMonthPnl,
        p_previous_losses: previousLosses,
        p_fee_amount: feeAmount,
        p_status: invoiceStatus,
        p_due_date: dueDate.toISOString().split('T')[0]
      });
      
      if (insertError) throw insertError;
      
      invoiceCreated = true;
      results.push({ email: u.email, fee: feeAmount, status: invoiceStatus });
    }

    return NextResponse.json({ success: true, billingMonth, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
  }
}

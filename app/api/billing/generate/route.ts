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
    const { data: allUsers, error: usersErr } = await supabase.rpc('admin_get_all_users_safe');
    if (usersErr) throw usersErr;

    // Filter to selected users if specified
    const users = selectedUserIds
      ? allUsers.filter((u: any) => selectedUserIds!.includes(u.id))
      : allUsers;

    const results = [];

    // 2. Loop through users to generate invoices
    for (const u of users) {
      const { data, error } = await supabase.rpc('admin_bill_previous_month', { p_user_id: u.id });
      if (error) throw error;
      results.push({ email: u.email, ...data });
    }

    return NextResponse.json({ success: true, billingMonth, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
  }
}

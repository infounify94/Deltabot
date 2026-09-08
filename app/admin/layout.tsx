import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ProtectedSession } from '@/components/ui/protected-session';
import { LogoutButton } from '@/components/ui/logout-button';
import { ShieldCheck, Activity, Users, DollarSign, LogOut } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_admin) {
    redirect('/dashboard');
  }

  return (
    <ProtectedSession>
    <div className="min-h-screen bg-[var(--paper)] flex flex-col font-sans text-[var(--ink)]">
      <header className="print:hidden glass-header px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-center justify-between sticky top-0 z-50">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-base tracking-tight text-[var(--ink)]">
              Admin Panel
            </span>
          </Link>
          <div className="h-4 w-px bg-[var(--hair)] mx-2" />
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/admin" className="text-[var(--grey)] hover:text-[var(--ink)] transition-colors flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> God View
            </Link>
            <Link href="/admin#users" className="text-[var(--grey)] hover:text-[var(--ink)] transition-colors flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Users
            </Link>
            <Link href="/admin/billing" className="text-[var(--grey)] hover:text-[var(--ink)] transition-colors flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Billing
            </Link>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard" className="text-sm font-medium text-[var(--grey)] hover:text-[var(--ink)] transition-colors">
            Exit Admin
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 print:p-0 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
    </ProtectedSession>
  );
}

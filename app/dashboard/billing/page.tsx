import Link from 'next/link';
import { BillingList } from '@/components/ui/billing-list';
import { LogoutButton } from '@/components/ui/logout-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function BillingPage() {
  return <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]"><header className="glass-header px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard" className="text-sm font-medium">← Dashboard</Link><div className="flex gap-2"><ThemeToggle /><LogoutButton /></div></header><main className="max-w-5xl mx-auto px-4 sm:px-8 py-8"><BillingList /></main></div>;
}

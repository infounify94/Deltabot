'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      try { localStorage.setItem('profitpilot-signout', String(Date.now())); } catch {}
      window.location.replace('/login');
    } catch {
      setError('Unable to log out. Please try again.');
      setBusy(false);
    }
  }
  return <div>
    <button type="button" onClick={logout} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--hair-2)] bg-[var(--paper)] px-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--raise)] disabled:opacity-50">
      <LogOut className="h-4 w-4" />{busy ? 'Logging out…' : 'Log out'}
    </button>
    {error && <p role="alert" className="max-w-52 text-xs text-[var(--clay)]">{error}</p>}
  </div>;
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function ProtectedSession({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const leave = () => { if (active) { setVerified(false); window.location.replace('/login'); } };
    async function verify() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!active) return;
        if (error?.name === 'AuthRetryableFetchError') { setError(true); return; }
        if (!user) { leave(); return; }
        setError(false); setVerified(true);
      } catch { if (active) setError(true); }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') leave();
    });
    const storage = (event: StorageEvent) => { if (event.key === 'profitpilot-signout') leave(); };
    const visible = () => { if (document.visibilityState === 'visible') void verify(); };
    const restored = (event: PageTransitionEvent) => { if (event.persisted) { setVerified(false); void verify(); } };
    window.addEventListener('storage', storage);
    window.addEventListener('pageshow', restored);
    document.addEventListener('visibilitychange', visible);
    void verify();
    return () => {
      active = false; subscription.unsubscribe();
      window.removeEventListener('storage', storage);
      window.removeEventListener('pageshow', restored);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);
  if (!verified) return <div role="status" className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-sm text-[var(--grey)]">
    <p>{error ? 'Unable to verify your session. Check your connection and try again.' : 'Verifying your session…'}</p>
    {error && <button onClick={() => window.location.reload()} className="min-h-11 rounded-lg border border-[var(--hair-2)] px-4">Try again</button>}
  </div>;
  return <>{children}</>;
}

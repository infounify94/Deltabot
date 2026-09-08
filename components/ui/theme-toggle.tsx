'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.dataset.theme === 'dark');
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  function toggle() {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('profitpilot-theme', next); } catch {}
    setDark(!dark);
  }
  return <button type="button" onClick={toggle} aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--hair-2)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--raise)]">
    {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
  </button>;
}

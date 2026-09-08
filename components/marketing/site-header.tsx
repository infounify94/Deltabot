'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const links = [['Product', '/product'], ['Performance', '/performance'], ['Pricing', '/pricing'], ['Resources', '/resources']];
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);
  return <header className="site-header">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="site-container header-inner">
      <Link href="/" aria-label="ProfitPilot home"><Brand /></Link>
      <nav aria-label="Main navigation" className="desktop-links">{links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}</nav>
      <div className="header-actions"><ThemeToggle /><Link className="header-login" href="/login">Log in</Link><Link className="site-button primary header-cta" href="/demo">Explore demo <ArrowUpRight size={15} /></Link><button className="mobile-menu-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button></div>
    </div>
    {open && <nav id="public-navigation" aria-label="Mobile navigation" className="mobile-site-nav">{[...links, ['Security', '/security'], ['Contact', '/contact']].map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={16} /></Link>)}<div className="mobile-nav-actions"><Link className="site-button secondary" href="/login">Log in</Link><Link className="site-button primary" href="/demo">Explore demo</Link></div></nav>}
  </header>;
}

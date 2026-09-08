import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand } from '@/components/brand';
import { SiteHeader } from './site-header';

const groups = [
  { title: 'Platform', links: [['Product', '/product'], ['Interactive demo', '/demo'], ['Performance', '/performance'], ['Pricing', '/pricing'], ['Security', '/security']] },
  { title: 'Company', links: [['About', '/about'], ['Resources', '/resources'], ['Help center', '/help'], ['Contact', '/contact']] },
  { title: 'Legal', links: [['Terms of use', '/terms'], ['Privacy policy', '/privacy'], ['Risk disclosure', '/risk-disclosure'], ['Disclaimer', '/disclaimer'], ['Billing & refunds', '/refund-policy'], ['Cookie policy', '/cookies']] },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="public-site"><SiteHeader /><main id="main-content">{children}</main><footer className="site-footer"><div className="site-container">
    <div className="footer-top"><div className="footer-brand"><Link href="/"><Brand /></Link><p>A clearer workspace for automated trading.</p><a href="mailto:support@profitpilot.in">Get in touch <ArrowUpRight size={14} /></a></div>
    {groups.map(group => <nav aria-label={`${group.title} links`} key={group.title}><h2>{group.title}</h2>{group.links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav>)}</div>
    <div className="footer-risk"><strong>Trading involves risk.</strong> Crypto derivatives and leverage can result in substantial losses. Automation does not guarantee returns. Interface examples are illustrative and are not a performance record. <Link href="/risk-disclosure">Read the risk disclosure.</Link></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} ProfitPilot. All rights reserved.</span><span>Independent software · Connected to Delta Exchange</span></div>
  </div></footer></div>;
}

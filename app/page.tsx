import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Activity, ShieldCheck, Receipt, CircleDot } from 'lucide-react';
import { SiteShell } from '@/components/marketing/site-shell';
import { ProductPreview } from '@/components/marketing/product-preview';

export default function Home() {
  return <SiteShell>
    <section className="home-hero site-container">
      <div className="hero-copy"><div className="eyebrow"><span className="status-dot" />THE AUTOMATED TRADING WORKSPACE</div>
        <h1>Automated trading.<br /><span>Clearly in view.</span></h1>
        <p className="hero-description">Your account, positions, and performance. One considered workspace to stay connected to your trading.</p>
        <div className="hero-actions"><Link className="site-button primary" href="/demo">Explore the platform <ArrowRight size={17} /></Link><Link className="site-button secondary" href="/login">Open your dashboard <ArrowUpRight size={17} /></Link></div>
        <div className="hero-assurance"><span><ShieldCheck size={15} />Funds stay at your exchange</span><span><CircleDot size={15} />Your account. Your control.</span></div>
      </div>
      <div className="hero-product"><div className="product-orbit" aria-hidden="true"/><ProductPreview /><div className="hero-product-caption"><span>DESIGNED FOR THE FULL PICTURE</span><Link href="/product">Take a closer look <ArrowUpRight size={13} /></Link></div></div>
    </section>
    <div className="platform-strip"><div className="site-container"><span>CONNECTED TO <strong>Delta Exchange</strong></span><span>BTC & ETH options</span><span>USD / INR account views</span><span>Performance-based fees</span></div></div>
    <section className="home-workspace site-container"><div className="section-intro"><div><p className="eyebrow">A MORE CONSIDERED TRADING EXPERIENCE</p><h2>The details matter.<br />See them in one place.</h2></div><p>From an open position to a monthly statement, ProfitPilot keeps your trading activity connected and easy to follow.</p></div>
      <div className="feature-columns">{[{n:'01',icon:Activity,title:'A clear account view',text:'Balances, positions, and recorded results, organized around the information you need.',href:'/product',link:'Explore the workspace'},{n:'02',icon:ShieldCheck,title:'Control stays with you',text:'Review account status, manage your connection, and access trading controls from your workspace.',href:'/security',link:'Account & security'},{n:'03',icon:Receipt,title:'A transparent record',text:'Follow closed trades and review performance-based invoices with downloadable statements.',href:'/pricing',link:'See how pricing works'}].map(item=><article key={item.n}><div className="feature-number"><span>{item.n}</span><item.icon size={23}/></div><h3>{item.title}</h3><p>{item.text}</p><Link href={item.href}>{item.link}<ArrowUpRight size={16}/></Link></article>)}</div>
    </section>
    <section className="home-bottom site-container"><div className="home-bottom-copy"><p className="eyebrow">THE WORKSPACE GOES WITH YOU</p><h2>At your desk.<br />Or away from it.</h2><p>A focused mobile dashboard with the same account visibility. Check your positions, find an invoice, and get back to your day.</p><Link className="text-link" href="/product">Built for your everyday <ArrowRight size={16}/></Link></div><div className="mobile-product-art" aria-label="Illustrative mobile account interface"><div className="mobile-art-header"><span className="status-dot"/> ProfitPilot <span>DEMO</span></div><span className="micro-label">YOUR WORKSPACE</span><h3>Account overview</h3><div className="mobile-art-stats"><div><span>Account balance</span><strong>$12,480.00</strong></div><div><span>Realized P&L</span><strong className="positive">+$480.00</strong></div></div><div className="mobile-art-line"><Activity size={18}/><div><strong>Positions at a glance</strong><span>BTC & ETH · example account</span></div><ArrowUpRight size={17}/></div><div className="mobile-art-nav"><span>Overview</span><span>Trading</span><span>Invoices</span><span>More</span></div><small>Product illustration · not actual performance</small></div></section>
    <section className="home-cta site-container"><div><p className="eyebrow">MAKE ROOM FOR A CLEARER VIEW</p><h2>Meet your trading workspace.</h2></div><Link className="site-button primary" href="/demo">Explore the demo <ArrowUpRight size={17}/></Link></section>
  </SiteShell>;
}

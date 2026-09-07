'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { HeroTerminal } from '@/components/ui/hero-terminal';
import { 
  ArrowRight, 
  ChevronDown, 
  Menu,
  X,
  Shield,
  Zap,
  Activity,
  Eye,
  BarChart3,
  Monitor,
  CheckCircle2,
  Lock,
  Radio,
  Clock,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Scale,
  Layers,
  Cpu
} from 'lucide-react';

export default function Home() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sliderBalance, setSliderBalance] = useState<number>(5000);
  
  // Macro Status for Live Radar
  const [macroStatus, setMacroStatus] = useState<{
    is_blocked: boolean;
    active_event: any;
    blackout_reason: string;
    blackout_end_ist: string;
    upcoming_events: any[];
  } | null>(null);

  const fxRate = 86.5;

  const fmt = (usdAmount: number) => {
    if (currency === 'INR') {
      const inr = usdAmount * fxRate;
      if (Math.abs(inr) >= 100000) return `₹${(inr / 100000).toFixed(2)} Lakh`;
      return `₹${Math.round(inr).toLocaleString('en-IN')}`;
    }
    return `$${Math.round(usdAmount).toLocaleString('en-US')}`;
  };

  useEffect(() => {
    fetch('/api/macro')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success) setMacroStatus(data);
      })
      .catch(console.error);
  }, []);

  // Pricing calculator
  const calcGross = sliderBalance * 0.145;
  const calcFees = sliderBalance * 0.015;
  const calcNet = calcGross - calcFees;
  const calcPerfFee = calcNet * 0.30;
  const calcTakeHome = calcNet - calcPerfFee;

  const faqs = [
    {
      q: "What is ProfitPilot?",
      a: "ProfitPilot is an institutional-grade automated crypto options trading platform. It connects to your Delta Exchange account via non-custodial trade-only APIs, systematically executes delta-neutral strangles, monitors open positions every 5 seconds, and manages risk with automated trailing ratchets."
    },
    {
      q: "How does the Macro News Blackout Shield protect my capital?",
      a: "Before high-impact US economic events (such as Federal Reserve interest rate decisions, CPI reports, or Non-Farm Payrolls), market volatility causes sudden whipsaws. ProfitPilot monitors global economic calendars in real-time, automatically pausing new entries 2 hours before the event and resuming 1 hour after the market stabilizes."
    },
    {
      q: "Do I keep custody of my funds?",
      a: "Yes, 100%. Your funds remain securely in your personal Delta Exchange wallet. ProfitPilot connects via trade-only API keys that cannot initiate withdrawals or transfers. We never hold or touch your funds."
    },
    {
      q: "What is the performance fee structure?",
      a: "We operate on a strict high-water mark performance fee model. We only charge 30% on net new profits. If the bot loses money, we do not charge any fees until those losses are fully recovered."
    }
  ];

  return (
    <div className="aurora-wrapper">
      <div className="aurora-bg" />
      
      <div className="aurora-content">
        {/* Navigation */}
        <nav className="fixed w-full z-50 glass-header transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">
                  Profit<span className="text-indigo-400">Pilot</span>
                </span>
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
                <a href="#risk" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Risk Management</a>
                <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</a>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {currency}
                  </button>
                  <Link 
                    href="/login" 
                    className="text-sm font-medium px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                  >
                    Client Login
                  </Link>
                </div>
              </div>

              <div className="md:hidden">
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 p-2">
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[#0A0A0C] border-b border-white/5 px-4 pt-2 pb-6 space-y-4">
              <a href="#features" className="block text-base font-medium text-slate-300">Features</a>
              <a href="#risk" className="block text-base font-medium text-slate-300">Risk Management</a>
              <a href="#pricing" className="block text-base font-medium text-slate-300">Pricing</a>
              <Link href="/login" className="block text-center text-base font-medium px-5 py-3 rounded-lg bg-indigo-600 text-white">
                Client Login
              </Link>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Next-Gen Institutional Options Protocol</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-8">
                Institutional-Grade <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-400">
                  Automated Trading
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Connect your Delta Exchange account securely. We systematically execute delta-neutral short strangles, perfectly managing risk while you sleep.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black font-semibold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  Start Trading <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#how-it-works"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white font-semibold text-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors flex items-center justify-center gap-2"
                >
                  View Performance
                </a>
              </div>
            </div>

            {/* Dashboard Preview Component */}
            <div className="mt-20 flex justify-center">
              <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(79,70,229,0.15)] border border-white/10">
                {/* Fallback mock UI instead of full HeroTerminal to avoid complex dependencies, or we can use HeroTerminal if it exists */}
                <HeroTerminal />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 relative z-10 border-t border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Enterprise Grade Infrastructure</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">We've built a robust, non-custodial engine that executes with mathematical precision.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <GlassCard hoverEffect className="p-8">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">100% Non-Custodial</h3>
                <p className="text-slate-400 leading-relaxed">
                  Your funds never leave your Delta Exchange wallet. We execute trades via highly-restricted API keys without withdrawal permissions.
                </p>
              </GlassCard>

              <GlassCard hoverEffect className="p-8">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6">
                  <Activity className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Delta-Neutral Logic</h3>
                <p className="text-slate-400 leading-relaxed">
                  We sell out-of-the-money Options on both sides. The system profits from time decay (Theta) while automatically hedging against volatility.
                </p>
              </GlassCard>

              <GlassCard hoverEffect className="p-8">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">5-Second Heartbeat</h3>
                <p className="text-slate-400 leading-relaxed">
                  The risk engine calculates account exposure, unrealized P&L, and stop-loss proximity every 5 seconds, reacting faster than any human.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Pricing / Calculator */}
        <section id="pricing" className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <GlassCard className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">High-Water Mark Pricing</h2>
                  <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                    We succeed only when you succeed. We charge a flat <span className="text-white font-bold">30% performance fee</span> on net new profits.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-teal-400" /> No setup fees or monthly subscriptions.
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-teal-400" /> Unrecovered losses are carried forward.
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-teal-400" /> Invoices are generated automatically on the 1st of every month.
                    </li>
                  </ul>
                </div>
                
                <div className="bg-black/30 border border-white/5 rounded-2xl p-6 md:p-8">
                  <div className="mb-8">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-sm font-medium text-slate-400">Trading Capital</span>
                      <span className="text-2xl font-bold text-white num-tabular">{fmt(sliderBalance)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1000" 
                      max="100000" 
                      step="1000"
                      value={sliderBalance} 
                      onChange={(e) => setSliderBalance(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>{fmt(1000)}</span>
                      <span>{fmt(100000)}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Estimated Monthly Profit (14.5%)</span>
                      <span className="text-white font-medium num-tabular">{fmt(calcGross)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Exchange Fees (Est. 1.5%)</span>
                      <span className="text-slate-300 num-tabular">-{fmt(calcFees)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">ProfitPilot Fee (30% of Net)</span>
                      <span className="text-indigo-400 font-medium num-tabular">-{fmt(calcPerfFee)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <span className="font-medium text-white">Your Take-Home Profit</span>
                      <span className="text-2xl font-bold text-teal-400 num-tabular">{fmt(calcTakeHome)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 relative z-10 border-t border-white/5 bg-black/20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <GlassCard 
                  key={i} 
                  variant="subtle" 
                  className="cursor-pointer" 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="px-6 py-5 flex justify-between items-center">
                    <span className="font-medium text-white">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </div>
                  {openFaq === i && (
                    <div className="px-6 pb-5 text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-xl tracking-tight text-white">Profit<span className="text-indigo-400">Pilot</span></span>
            </div>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Automated algorithmic options trading on Delta Exchange. Trading involves significant risk of loss and is not suitable for all investors.
            </p>
            <div className="mt-8 text-slate-600 text-xs">
              © {new Date().getFullYear()} ProfitPilot SaaS. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

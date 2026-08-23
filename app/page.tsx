'use client';

import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ArrowRight, Activity, Shield, Zap, Lock, BarChart3, Crosshair, ChevronRight, Menu } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Demo Data for Hero Chart
const chartData = [
  { time: '09:00', price: 74200 },
  { time: '10:00', price: 74800 },
  { time: '11:00', price: 74500 },
  { time: '12:00', price: 75200 },
  { time: '13:00', price: 75900 },
  { time: '14:00', price: 75600 },
  { time: '15:00', price: 76842 },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-indigo-500/30">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-indigo-500/5 blur-[150px] rounded-full transform -translate-y-1/2"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]"></div>
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-md border-b border-white/5 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center">
              <Activity className="text-white w-5 h-5" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">ProfitPilot</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#platform" className="hover:text-white transition">Platform</a>
            <a href="#strategies" className="hover:text-white transition">Strategies</a>
            <a href="#risk" className="hover:text-white transition">Risk Engine</a>
            <a href="#security" className="hover:text-white transition">Security</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">Log in</Link>
            <Link href="/login" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-md hover:bg-slate-200 transition">
              Start Trading
            </Link>
          </div>
          <button className="md:hidden text-white"><Menu /></button>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
          }}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Built for systematic traders
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Automated Trading.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Smarter Risk Management.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">
              Deploy automated trading strategies, monitor positions in real time, and let the institutional-grade risk engine respond when markets move. You stay in control.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
              <Link href="/login" className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-slate-200 transition">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#platform" className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition">
                Explore the Platform
              </a>
            </motion.div>
          </motion.div>

          {/* Hero Visual - Premium Dashboard Demo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 blur-3xl -z-10 rounded-full"></div>
            <div className="bg-[#0c101a] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1">BTC/USD (Demo Data)</div>
                  <div className="text-3xl font-bold text-white">$76,842.30 <span className="text-emerald-500 text-lg font-medium">+2.41%</span></div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-500 mb-1">Demo P&L</div>
                  <div className="text-xl font-bold text-emerald-500">+$1,284.32</div>
                </div>
              </div>
              
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['dataMin - 500', 'dataMax + 500']} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0c101a', borderColor: '#ffffff1a', color: '#fff' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Risk Status</div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <Shield className="w-4 h-4" /> LOW
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Strategy</div>
                  <div className="flex items-center gap-2 text-indigo-400 font-medium">
                    <Activity className="w-4 h-4" /> ACTIVE
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Dashboard Showcase & Risk Engine */}
        <section id="risk" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Risk management happens in real time.</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Every open position is continuously monitored against predefined risk rules. If volatility spikes, the risk engine detects the change and automatically deploys protective wings or exits.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-[#0c101a] border border-white/5 rounded-2xl p-8">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Continuous Analysis</h3>
              <p className="text-slate-400 text-sm leading-relaxed">The algorithm evaluates Delta, Volatility, and Margin utilization every few seconds to assess exact exposure.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.1 }} variants={fadeUp} className="bg-[#0c101a] border border-white/5 rounded-2xl p-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Dynamic Protection</h3>
              <p className="text-slate-400 text-sm leading-relaxed">If risk thresholds are breached, the system automatically buys protective wings to cap losses instantly.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.2 }} variants={fadeUp} className="bg-[#0c101a] border border-white/5 rounded-2xl p-8">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Automated Execution</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Limit orders are dynamically managed. Stop-losses act as the final failsafe for total capital protection.</p>
            </motion.div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Your account.<br/>Your control.</h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">We utilize secure API protocols to execute trades. Your funds stay on your exchange. Strict risk limits and emergency controls guarantee you hold the ultimate authority.</p>
              
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle /> Trading-only permissions (no withdrawals)
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle /> Encrypted credential storage
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle /> Hard-coded max daily loss limits
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle /> Universal Emergency Kill-Switch
                </li>
              </ul>
            </div>
            
            <div className="bg-[#0c101a] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-rose-500/5 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
                <div>
                  <div className="text-white font-bold mb-1">Global Kill Switch</div>
                  <div className="text-sm text-slate-500">Emergency force-close all open positions at market price.</div>
                </div>
                <div className="px-4 py-2 bg-rose-500/10 text-rose-500 font-bold rounded-lg border border-rose-500/20 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> ARMED
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold mb-1">Max Daily Drawdown</div>
                  <div className="text-sm text-slate-500">Trading stops automatically if hit.</div>
                </div>
                <div className="text-xl font-bold text-white font-mono">
                  $5,000.00
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-12 relative overflow-hidden">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to automate your trading?</h2>
            <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">Build your strategy. Set your risk parameters. Let ProfitPilot's algorithms handle the execution flawlessly.</p>
            <Link href="/login" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-lg font-bold hover:bg-slate-200 transition text-lg">
              Start Trading Now
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Activity className="text-indigo-400 w-5 h-5" />
                <span className="text-white font-bold">ProfitPilot</span>
              </div>
              <p className="text-sm text-slate-500">Premium algorithmic trading and risk management infrastructure.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-white transition">Strategies</a></li>
                <li><a href="#" className="hover:text-white transition">Risk Engine</a></li>
                <li><a href="#" className="hover:text-white transition">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Risk Disclosure</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-xs text-slate-600 border-t border-white/5 pt-8">
            Trading involves significant risk. Simulated and demo data shown for illustrative purposes only. Past performance does not guarantee future results.
            <br/>&copy; {new Date().getFullYear()} ProfitPilot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function CheckCircle() {
  return (
    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
    </div>
  );
}

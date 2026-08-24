import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-[#e27625]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="font-black text-white text-xl tracking-tight">ProfitPilot</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition">Features</a>
            <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-slate-300 hover:text-white transition">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-white hover:text-[#e27625] transition">Log in</Link>
            <Link href="/login" className="bg-[#e27625] hover:bg-[#c9641d] text-white text-sm font-bold px-5 py-2.5 rounded-lg transition shadow-lg shadow-[#e27625]/20">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight mb-8">
            Institutional-Grade <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e27625] to-amber-500">Options Selling</span> Engine
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Connect your Delta Exchange API keys and let our advanced algorithmic engine dynamically sell premium, manage Gamma risk, and enforce strict liquidation buffers. You keep custody. We automate the profits.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login" className="bg-[#e27625] hover:bg-[#c9641d] text-white text-lg font-bold px-8 py-4 rounded-xl transition shadow-xl shadow-[#e27625]/20">Connect Your Account</Link>
            <a href="#features" className="bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold px-8 py-4 rounded-xl transition">See How It Works</a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-slate-950 py-24 border-t border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-white mb-4">Why ProfitPilot?</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">We abandoned basic spot trading bots to build a high-performance options selling engine.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-[#e27625]/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[#e27625]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Dynamic Delta Hedging</h3>
                <p className="text-slate-400 text-sm leading-relaxed">The bot continuously evaluates Option Greeks. If a naked position threatens your capital, it automatically buys protective wings, mathematically converting your trade into a risk-defined Iron Condor.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-[#e27625]/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[#e27625]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Liquidation Awareness</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Most bots place orders completely blind to your margin limits. ProfitPilot calculates your exact liquidation buffer every 5 seconds, actively preventing the exchange from taking your collateral.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-[#e27625]/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[#e27625]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Self-Custodial</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Your funds never leave your Delta Exchange wallet. You grant us a strict "Trade-Only" API key. We cannot withdraw your funds. You can revoke our access at any time with one click on Delta.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Zero Upfront Fees. <span className="text-[#e27625]">We Win When You Win.</span></h2>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
              We do not charge monthly subscriptions or activation fees. We only make money if our algorithm makes you money.
            </p>
            
            <div className="bg-slate-950/50 rounded-2xl p-8 mb-10 border border-slate-800">
              <div className="text-5xl font-black text-white mb-2">30%</div>
              <div className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-6">Performance Fee</div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
                Billed only on your realized profits at the end of a rolling 30-day period. If the period ends in a loss, you pay absolutely nothing, and losses carry forward (High-Water Mark protection).
              </p>
            </div>

            <Link href="/login" className="bg-white hover:bg-slate-100 text-slate-900 text-lg font-bold px-10 py-4 rounded-xl transition">Start Your 30-Day Free Trial</Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-24 border-t border-slate-800">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-white mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h4 className="text-lg font-bold text-white mb-3">Do I need to transfer crypto to you?</h4>
              <p className="text-slate-400 text-sm leading-relaxed">No. You deposit your funds directly into your own Delta Exchange account. You simply generate an API key with "Trading" permissions and connect it to our dashboard. We never have withdrawal access.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h4 className="text-lg font-bold text-white mb-3">How does the 30% profit share work?</h4>
              <p className="text-slate-400 text-sm leading-relaxed">At the end of every 30 days, our system calculates your total net realized profit from the bot's trades. If the number is positive, we generate an invoice for 30% of that profit. If the number is negative, you pay nothing, and the losses are offset against future profits.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h4 className="text-lg font-bold text-white mb-3">Can I pause the bot manually?</h4>
              <p className="text-slate-400 text-sm leading-relaxed">Yes. Inside your dashboard, there is a "Pause Entries" button. This instantly prevents the bot from opening any new positions, while safely managing and closing any positions that are currently open.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 text-center text-slate-500 text-sm">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            <span className="font-bold text-slate-400">ProfitPilot</span>
          </div>
          <p>Â© 2026 ProfitPilot. All rights reserved. Options trading carries significant risk.</p>
        </div>
      </footer>
    </div>
  );
}

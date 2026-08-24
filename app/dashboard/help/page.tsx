'use client';

import { supabase } from '@/lib/supabase';

export default function Help() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      {/* Navigation */}
      <nav className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <svg className="w-6 h-6 text-[#e27625]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="font-black text-white text-lg tracking-tight">ProfitPilot</span>
        </a>
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition">Dashboard</a>
          <a href="/dashboard/settings" className="text-sm font-medium text-slate-300 hover:text-white transition">Settings</a>
          <a href="/dashboard/help" className="text-sm font-medium text-[#e27625] transition border-b-2 border-[#e27625] pb-1">Help</a>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }} 
            className="text-sm font-medium text-rose-400 hover:text-rose-300 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10 w-full flex-1">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Support</h2>
          <h1 className="text-3xl font-bold text-slate-900">We answer within the trading day</h1>
        </div>

        {/* Support Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          {/* Website Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center mb-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold rounded-full border border-emerald-100 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Website
              </span>
            </div>
            <h4 className="font-bold text-slate-800 text-[15px] mb-2">profitpilot.in</h4>
            <p className="text-slate-500 text-xs leading-relaxed">Your dashboard and account.</p>
          </div>

          {/* Email Card */}
          <a href="mailto:support@profitpilot.in" className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:border-emerald-500 hover:shadow-md transition group block">
            <div className="flex items-center mb-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold rounded-full border border-emerald-100 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                Email
              </span>
            </div>
            <h4 className="font-bold text-slate-800 text-[15px] mb-2 group-hover:text-emerald-600 transition">support@profitpilot.in</h4>
            <p className="text-slate-500 text-xs leading-relaxed">Account, billing and execution questions.</p>
          </a>

          {/* WhatsApp Card */}
          <a href="https://wa.me/918328217848" target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:border-emerald-500 hover:shadow-md transition group block cursor-pointer">
            <div className="flex items-center mb-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold rounded-full border border-emerald-100 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp
              </span>
            </div>
            <h4 className="font-bold text-slate-800 text-[15px] mb-2 group-hover:text-emerald-600 transition">+91 83282 17848</h4>
            <p className="text-slate-500 text-xs leading-relaxed">Fastest route during market hours.</p>
          </a>

          {/* Emergency Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center mb-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] uppercase font-bold rounded-full border border-slate-200 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Emergency
              </span>
            </div>
            <h4 className="font-bold text-slate-800 text-[15px] mb-2">Stop everything</h4>
            <p className="text-slate-500 text-xs leading-relaxed">Revoke the API key on Delta. Execution halts the same second.</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800">Common questions</h3>
          </div>
          
          <div className="divide-y divide-slate-100">
            <div className="p-8">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Can you withdraw my funds?</h4>
              <p className="text-slate-500 text-sm">No. The key you give us has withdrawals disabled, and Delta enforces that on their side. Money can only ever leave to your own bank.</p>
            </div>
            
            <div className="p-8">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Why is my size different from someone else's?</h4>
              <p className="text-slate-500 text-sm">Position size is proportional to your wallet balance, so every account carries the same percentage risk.</p>
            </div>
            
            <div className="p-8">
              <h4 className="font-bold text-slate-800 text-sm mb-2">What price are my numbers based on?</h4>
              <p className="text-slate-500 text-sm">Traded prices â€” the fills that actually happened on your account. We never show P&L from exchange mark prices.</p>
            </div>
            
            <div className="p-8">
              <h4 className="font-bold text-slate-800 text-sm mb-2">What happens if I lose money in a period?</h4>
              <p className="text-slate-500 text-sm">You are not invoiced, and the loss carries forward before any future fee applies.</p>
            </div>

            <div className="p-8">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Can I close a position myself?</h4>
              <p className="text-slate-500 text-sm">Yes â€” from the Dashboard using the KILL button, or directly on Delta Exchange. The system will recognize the manual close and stop managing that leg.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

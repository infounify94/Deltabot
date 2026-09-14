'use client';
import { useMemo, useState } from 'react';
import { buildPayoff } from '@/lib/trade-details';

export function PositionPayoff({position}:{position:any}) {
  const curve=useMemo(()=>buildPayoff(position),[position]);
  const [selected,setSelected]=useState<number|null>(null);
  if(!curve) return <p className="text-xs text-[var(--grey)] mt-4">Payoff unavailable: complete contract quantities and accounting are required.</p>;
  const points=curve.points, minX=points[0].spot,maxX=points[100].spot;
  const minY=Math.min(0,...points.map(p=>p.pnl)),maxY=Math.max(.01,...points.map(p=>p.pnl));
  const x=(v:number)=>45+(v-minX)/(maxX-minX)*630;
  const y=(v:number)=>15+(maxY-v)/(maxY-minY)*165;
  const path=points.map((p,i)=>`${i?'L':'M'}${x(p.spot)},${y(p.pnl)}`).join(' ');
  const money=(v:number)=>Number.isFinite(v)?`$${v.toFixed(2)}`:'Unlimited';
  const active=selected==null?null:points[selected];
  return <div className="mt-5 border-t border-[var(--hair)] pt-4">
    <h3 className="font-semibold text-sm">Your position at expiry · USD</h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mt-3">
      <div className="text-[var(--grey)]">Maximum profit<div className="font-semibold text-[var(--pine)] mt-1">{money(curve.maxProfit)}</div></div>
      <div className="text-[var(--grey)]">Maximum expiry loss<div className="font-semibold text-[var(--clay)] mt-1">{money(curve.maxLoss)}</div></div>
      <div className="text-[var(--grey)]">Breakevens<div className="font-semibold text-[var(--ink)] mt-1">{curve.breakevens.map(v=>v.toLocaleString('en-US',{maximumFractionDigits:2})).join(' / ') || 'None'}</div></div>
    </div>
    <svg viewBox="0 0 700 215" role="img" aria-label={`${position.underlying} expiry profit and loss for your actual position size`} className="w-full mt-2 touch-pan-y" onMouseLeave={()=>setSelected(null)} onMouseMove={e=>{const box=e.currentTarget.getBoundingClientRect();setSelected(Math.max(0,Math.min(100,Math.round(((e.clientX-box.left)/box.width*700-45)/630*100))));}}>
      <line x1="45" x2="675" y1={y(0)} y2={y(0)} stroke="var(--grey)" strokeDasharray="4 4"/>
      <path d={path} fill="none" stroke="var(--pine)" strokeWidth="2.5"/>
      {[0,25,50,75,100].map(i=><text key={i} x={x(points[i].spot)} y="200" textAnchor="middle" fontSize="10" fill="var(--grey)">{Math.round(points[i].spot).toLocaleString()}</text>)}
      {[minY,0,maxY].map((v,i)=><text key={i} x="40" y={y(v)+3} textAnchor="end" fontSize="10" fill="var(--grey)">{v.toFixed(2)}</text>)}
      {active && <circle cx={x(active.spot)} cy={y(active.pnl)} r="4" fill="var(--ink)"/>}
    </svg>
    <p className="text-xs min-h-5">{active?`Underlying $${active.spot.toFixed(2)} → expiry P&L ${money(active.pnl)}`:'Underlying price at expiry → position profit / loss'}</p>
    <p className="text-xs text-[var(--grey)] mt-1">Uses your lots, strikes, filled wings and net credit. This is an expiry payoff, not a live price forecast or stop-loss guarantee. Future exit/settlement fees are excluded.</p>
  </div>;
}

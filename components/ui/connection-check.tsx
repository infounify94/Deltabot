'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {connectionLabel,connectionReasons} from '@/lib/connection-status';
export function ConnectionCheck({profile,compact=false}:{profile:any;compact?:boolean}) {
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),15000);return()=>clearInterval(timer);},[]);
  useEffect(()=>setMessage(''),[profile.connection_checked_at]);
  const request=async()=>{
    setBusy(true);
    try {const {error}=await supabase.rpc('request_connection_check',{p_user_id:profile.id});if(error)throw error;setMessage('Check queued for Oracle. This does not place an order.');}
    catch(e:any){setMessage(`Request failed: ${e.message}`);}finally{setBusy(false);}
  };
  return <div className="space-y-1 text-xs">
    <p className="font-semibold">{connectionLabel(profile,now)}</p>
    <p className="text-[var(--grey)]">{profile.connection_checked_at?`Checked ${new Date(profile.connection_checked_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST`:'No completed check yet'}</p>
    {(!compact || profile.connection_status==='FAILED') && <p>{connectionReasons[profile.connection_code] || 'Read-only authentication check from Oracle.'}</p>}
    <button disabled={busy || !profile.delta_api_key} onClick={request} className="border border-[var(--hair)] rounded px-2 py-1 disabled:opacity-50">{busy?'Requesting…':'Verify connection'}</button>
    {message && <p role="status">{message}</p>}
  </div>;
}

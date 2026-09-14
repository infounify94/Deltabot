'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {normalizePhone,validPhone} from '@/lib/connection-status';
export function ContactPhone({profile,admin=false,onSaved}:{profile:any;admin?:boolean;onSaved?:(phone:string)=>void}) {
  const [phone,setPhone]=useState(profile?.phone || '');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  useEffect(()=>setPhone(profile?.phone || ''),[profile?.phone]);
  const save=async()=>{
    if(!validPhone(phone)){setMessage('Enter country code and number, for example +919876543210.');return;}
    setBusy(true);
    try {const value=normalizePhone(phone);const {error}=admin?await supabase.rpc('admin_set_contact_phone',{p_user_id:profile.id,p_phone:value}):await supabase.from('profiles').update({phone:value}).eq('id',profile.id);if(error)throw error;onSaved?.(value);setMessage('Contact number saved.');}
    catch(e:any){setMessage(e.message);}finally{setBusy(false);}
  };
  return <div className="border border-[var(--hair)] rounded-lg p-4 space-y-2 text-sm">
    <label className="block">Contact phone (required for Delta connection)<input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+919876543210" className="block w-full mt-1 border rounded px-3 py-2 bg-[var(--paper)]"/></label>
    <p className="text-xs text-[var(--grey)]">For account support. Country code required; ownership is not verified by SMS.</p>
    {admin && validPhone(profile.phone || '') && <a className="block underline" href={`tel:${normalizePhone(profile.phone)}`}>Call {profile.phone}</a>}
    <button onClick={save} disabled={busy} className="px-3 py-2 border rounded disabled:opacity-50">{busy?'Saving…':'Save contact number'}</button>
    {message && <p role="status">{message}</p>}
  </div>;
}

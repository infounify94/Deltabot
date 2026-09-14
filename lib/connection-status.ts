export const normalizePhone=(value:string)=>value.replace(/[\s().-]/g,'');
export const validPhone=(value:string)=>/^\+[1-9]\d{7,14}$/.test(normalizePhone(value));
export function connectionLabel(p:any,now=Date.now()) {
  if(!p?.delta_api_key) return 'No credentials';
  const checked=Date.parse(p.connection_checked_at || '');
  const requested=Date.parse(p.connection_requested_at || '');
  if(Number.isFinite(requested) && (!Number.isFinite(checked) || requested>checked)) return now-requested>120000?'Waiting for Oracle':'Check queued';
  if(!Number.isFinite(checked)) return 'Not checked';
  if(now-checked>900000) return 'Check stale';
  return p.connection_status==='VERIFIED'?'Wallet access verified':p.connection_status==='FAILED'?'Check failed':'Not checked';
}
export const connectionReasons:Record<string,string>={
  WALLET_AUTHENTICATED:'Signed wallet access succeeded from Oracle. Order-placement permission is not tested.',
  IP_NOT_ALLOWED:'Delta rejected the server IP. Check the API IP allowlist.',
  AUTHENTICATION_FAILED:'Delta rejected authentication. Check the key and secret.',
  ACCESS_DENIED:'Delta denied access. Check API permissions and the IP allowlist.',
  RATE_LIMITED:'Delta rate-limited the request. Try again later.',
  EXCHANGE_UNAVAILABLE:'Delta is temporarily unavailable.',
  CONNECTION_UNAVAILABLE:'The connection could not be verified. Check again; this does not prove the key is invalid.',
  DUPLICATE_ACCOUNT:'This exchange account is connected to another profile. New entries are blocked.',
};

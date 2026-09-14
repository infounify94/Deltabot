begin;
alter table public.profiles add column if not exists credential_version bigint not null default 0;
alter table public.profiles add column if not exists connection_status text not null default 'NOT_CHECKED';
alter table public.profiles add column if not exists connection_code text;
alter table public.profiles add column if not exists connection_checked_at timestamptz;
alter table public.profiles add column if not exists connection_requested_at timestamptz;
grant select(credential_version,connection_status,connection_code,connection_checked_at,connection_requested_at) on public.profiles to authenticated;

create or replace function public.connection_profile_guard()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare changed boolean;
begin
 changed:=new.delta_api_key is distinct from old.delta_api_key or new.delta_api_secret is distinct from old.delta_api_secret;
 if new.phone is distinct from old.phone then new.phone:=regexp_replace(coalesce(new.phone,''),'[[:space:]().-]','','g');end if;
 if new.delta_api_key is not null and (changed or new.phone is distinct from old.phone)
 and coalesce(new.phone,'') !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'Contact phone required with country code, for example +919876543210';end if;
 if changed then
  new.credential_version:=old.credential_version+1;
  new.connection_status:=case when new.delta_api_key is null or new.delta_api_secret is null then 'MISSING' else 'PENDING' end;
  new.connection_code:=null;new.connection_checked_at:=null;new.connection_requested_at:=now();
 end if;
 return new;
end $$;
drop trigger if exists connection_profile_guard on public.profiles;
create trigger connection_profile_guard before update on public.profiles for each row execute function public.connection_profile_guard();

create or replace function public.request_connection_check(p_user_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or (auth.uid()<>p_user_id and not exists(select 1 from public.profiles where id=auth.uid() and is_admin)) then raise exception 'Access denied';end if;
 if not exists(select 1 from public.profiles where id=p_user_id and delta_api_key is not null and delta_api_secret is not null) then raise exception 'Save both API credentials first';end if;
 update public.profiles set connection_requested_at=now() where id=p_user_id and (connection_requested_at is null or connection_requested_at<now()-interval '30 seconds');
end $$;
revoke all on function public.request_connection_check(uuid) from public,anon;
grant execute on function public.request_connection_check(uuid) to authenticated;

create or replace function public.worker_record_connection_check(p_user_id uuid,p_version bigint,p_status text,p_code text,p_checked_at timestamptz)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_status not in ('VERIFIED','FAILED') or p_code not in ('WALLET_AUTHENTICATED','IP_NOT_ALLOWED','AUTHENTICATION_FAILED','ACCESS_DENIED','RATE_LIMITED','EXCHANGE_UNAVAILABLE','CONNECTION_UNAVAILABLE','DUPLICATE_ACCOUNT') then raise exception 'Invalid check result';end if;
 update public.profiles set connection_status=p_status,connection_code=p_code,connection_checked_at=p_checked_at
 where id=p_user_id and credential_version=p_version and (connection_checked_at is null or connection_checked_at<=p_checked_at);
end $$;
revoke all on function public.worker_record_connection_check(uuid,bigint,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.worker_record_connection_check(uuid,bigint,text,text,timestamptz) to service_role;

create or replace function public.admin_set_contact_phone(p_user_id uuid,p_phone text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then raise exception 'Administrator required';end if;
 update public.profiles set phone=p_phone where id=p_user_id;
end $$;
revoke all on function public.admin_set_contact_phone(uuid,text) from public,anon;
grant execute on function public.admin_set_contact_phone(uuid,text) to authenticated;

create or replace function public.admin_connect_delta(p_user_id uuid,p_api_key text,p_api_secret text,p_phone text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then raise exception 'Administrator required';end if;
 if coalesce(trim(p_api_key),'')='' or coalesce(trim(p_api_secret),'')='' then raise exception 'Both credentials required';end if;
 update public.profiles set delta_api_key=trim(p_api_key),delta_api_secret=trim(p_api_secret),phone=p_phone,connected_at=now(),is_paused=true where id=p_user_id;
 if not found then raise exception 'Profile unavailable';end if;
end $$;
revoke all on function public.admin_connect_delta(uuid,text,text,text) from public,anon;
grant execute on function public.admin_connect_delta(uuid,text,text,text) to authenticated;
-- Replaced by the authenticated, phone-aware admin connection function above.
do $$ declare f record;begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='admin_set_user_api_keys' loop
 execute format('revoke execute on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
commit;

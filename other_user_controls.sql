begin;
alter table public.profiles add column if not exists admin_close_requested boolean not null default false;
grant select(admin_close_requested) on public.profiles to authenticated;

create or replace function public.admin_set_user_pause(p_user_id uuid,p_is_paused boolean)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then raise exception 'Administrator required'; end if;
 if p_is_paused is null then raise exception 'Pause value required'; end if;
 if not p_is_paused and exists(select 1 from public.profiles where id=p_user_id and admin_close_requested)
 and (exists(select 1 from public.positions where user_id=p_user_id and status in ('open','adjusted','closing','close_failed','execution_anomaly','reconciliation_required'))
 or exists(select 1 from public.execution_intents where payload->>'user_id'=p_user_id::text and state<>'COMPLETE')) then
 raise exception 'Wait for close and execution reconciliation before resuming entries'; end if;
 update public.profiles set is_paused=p_is_paused,admin_manual_pause=p_is_paused,
 admin_close_requested=case when not p_is_paused then false else admin_close_requested end where id=p_user_id;
 if not found then raise exception 'Profile unavailable'; end if;
end $$;
revoke all on function public.admin_set_user_pause(uuid,boolean) from public,anon;
grant execute on function public.admin_set_user_pause(uuid,boolean) to authenticated;

create or replace function public.admin_close_other_users()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare accounts integer; positions_requested integer;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then raise exception 'Administrator required'; end if;
 -- Durable per-account close flag also catches entries already in flight.
 update public.profiles set is_paused=true,admin_manual_pause=true,admin_close_requested=true
 where id<>'b82b7580-f27e-473a-ba4b-5b929db1556b'::uuid;
 get diagnostics accounts=row_count;
 update public.positions set manual_exit_requested=true
 where user_id<>'b82b7580-f27e-473a-ba4b-5b929db1556b'::uuid
 and status in ('open','adjusted','closing','close_failed','execution_anomaly','reconciliation_required');
 get diagnostics positions_requested=row_count;
 return jsonb_build_object('accounts_paused',accounts,'positions_requested',positions_requested);
end $$;
revoke all on function public.admin_close_other_users() from public,anon;
grant execute on function public.admin_close_other_users() to authenticated;
commit;

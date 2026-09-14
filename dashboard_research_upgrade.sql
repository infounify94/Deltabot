begin;
create or replace function public.dashboard_trade_summary()
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 select jsonb_build_object(
 'round_trips',count(*), 'winners',count(*) filter(where realized_pnl>0),
 'total_pnl',case when count(*) filter(where realized_pnl is null)>0 then null else coalesce(sum(realized_pnl),0) end,
 'today_pnl',case when count(*) filter(where realized_pnl is null and closed_at >= (date_trunc('day',now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'))>0 then null else coalesce(sum(realized_pnl) filter(where closed_at >= (date_trunc('day',now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata')),0) end)
 from public.positions where user_id=auth.uid() and status in ('closed','closed_unreconciled');
$$;
revoke all on function public.dashboard_trade_summary() from public,anon;
grant execute on function public.dashboard_trade_summary() to authenticated;

create or replace function public.admin_request_position_close(p_position_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then
  raise exception 'Administrator required';
 end if;
 update public.positions set manual_exit_requested=true where id=p_position_id
 and status in ('open','adjusted','closing','close_failed','execution_anomaly','reconciliation_required');
 return found;
end;
$$;
revoke all on function public.admin_request_position_close(uuid) from public,anon;
grant execute on function public.admin_request_position_close(uuid) to authenticated;
commit;

begin;
-- RLS restricts rows; column privileges independently keep secrets out of browsers.
revoke select on public.profiles from public, anon, authenticated;
revoke insert,delete,update on public.profiles from public,anon,authenticated;
grant update(delta_api_key,delta_api_secret,connected_at,is_paused,full_name,phone) on public.profiles to authenticated;
-- Only the worker writes financial/position ownership facts. Users may request exits.
revoke insert,delete,update on public.positions from public,anon,authenticated;
grant update(manual_exit_requested) on public.positions to authenticated;
revoke insert,delete,update on public.trade_events from public,anon,authenticated;
do $$ declare cols text;
begin
 select string_agg(quote_ident(column_name),',') into cols from information_schema.columns
 where table_schema='public' and table_name='profiles' and column_name<>'delta_api_secret';
 execute 'grant select (' || cols || ') on public.profiles to authenticated';
end $$;
create or replace function public.admin_get_all_users_safe()
returns setof jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from profiles where id=auth.uid() and is_admin) then
  raise exception 'Administrator required';
 end if;
 return query select to_jsonb(p)-'delta_api_secret' from profiles p order by id;
end $$;
revoke all on function public.admin_get_all_users_safe() from public,anon;
grant execute on function public.admin_get_all_users_safe() to authenticated;
revoke execute on function public.admin_get_all_users() from public,anon,authenticated;
create or replace function public.admin_get_all_invoices()
returns setof public.invoices language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from profiles where id=auth.uid() and is_admin) then
  raise exception 'Administrator required';
 end if;
 return query select * from invoices order by created_at desc;
end $$;
revoke execute on function public.admin_get_all_invoices() from public,anon;
grant execute on function public.admin_get_all_invoices() to authenticated;
commit;

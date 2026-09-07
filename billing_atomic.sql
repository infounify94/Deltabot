-- Preserve historical invoices, including duplicates. Uniqueness applies to new
-- automated generations through a dedicated key, without rewriting past billing.
begin;
create table if not exists public.billing_generations (
 user_id uuid not null references public.profiles(id), billing_month text not null,
 invoice_id uuid not null unique references public.invoices(id),
 created_at timestamptz not null default now(), primary key(user_id,billing_month));
alter table public.billing_generations enable row level security;
revoke all on public.billing_generations from public,anon,authenticated;
grant all on public.billing_generations to service_role;
create or replace function public.admin_bill_previous_month(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 first_day date := (date_trunc('month',now() at time zone 'Asia/Kolkata') - interval '1 month')::date;
 end_day date := date_trunc('month',now() at time zone 'Asia/Kolkata')::date;
 period text;
 prior numeric;
 profit numeric;
 fee numeric;
 existing invoices%rowtype;
begin
 if auth.uid() is null or not exists(select 1 from profiles where id=auth.uid() and is_admin) then
  raise exception 'Administrator required';
 end if;
 period := to_char(first_day,'Mon YYYY');
 select unrecovered_losses into prior from profiles where id=p_user_id for update;
 if not found then raise exception 'Profile unavailable'; end if;
 if (select count(*) from invoices where user_id=p_user_id and billing_month=period)>1 then
  raise exception 'Duplicate historical invoices require reconciliation';
 end if;
 select * into existing from invoices where user_id=p_user_id and billing_month=period;
 if found then return jsonb_build_object('id',existing.id,'fee',existing.fee_amount,'status',existing.status,'replayed',true); end if;
 if exists(select 1 from positions where user_id=p_user_id
   and closed_at >= (first_day::timestamp at time zone 'Asia/Kolkata')
   and closed_at < (end_day::timestamp at time zone 'Asia/Kolkata')
   and (realized_pnl is null or status<>'closed')) then raise exception 'Financial reconciliation incomplete'; end if;
 select coalesce(sum(realized_pnl),0) into profit from positions where user_id=p_user_id and status='closed'
   and closed_at >= (first_day::timestamp at time zone 'Asia/Kolkata')
   and closed_at < (end_day::timestamp at time zone 'Asia/Kolkata');
 fee := round(greatest(profit-prior,0)*.30,8);
 insert into invoices(user_id,billing_month,total_profit,previous_losses,fee_amount,status,due_date)
 values(p_user_id,period,profit,prior,fee,case when fee>0 then 'Unpaid' else 'No Fee' end,current_date+7)
 returning * into existing;
 insert into billing_generations(user_id,billing_month,invoice_id) values(p_user_id,period,existing.id);
 update profiles set unrecovered_losses=greatest(prior-profit,0) where id=p_user_id;
 return jsonb_build_object('id',existing.id,'fee',fee,'status',existing.status,'replayed',false);
end $$;
revoke all on function public.admin_bill_previous_month(uuid) from public,anon;
grant execute on function public.admin_bill_previous_month(uuid) to authenticated;
-- Disable obsolete multi-request billing mutations to prevent bypassing atomicity.
revoke execute on function public.admin_update_unrecovered_losses(uuid,numeric) from public,anon,authenticated;
revoke execute on function public.admin_generate_invoice(uuid,text,numeric,numeric,numeric,text,date) from public,anon,authenticated;
commit;

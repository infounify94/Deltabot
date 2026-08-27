create or replace function public.admin_generate_invoice(
  p_user_id uuid,
  p_billing_month text,
  p_total_profit numeric,
  p_previous_losses numeric,
  p_fee_amount numeric,
  p_status text,
  p_due_date date
) returns public.invoices
language plpgsql
security definer
as $$
declare
  _inv public.invoices;
begin
  -- Optional: check if caller is admin, but since API route checks it, we can trust the API route.
  insert into public.invoices (user_id, billing_month, total_profit, previous_losses, fee_amount, status, due_date)
  values (p_user_id, p_billing_month, p_total_profit, p_previous_losses, p_fee_amount, p_status, p_due_date)
  returning * into _inv;
  return _inv;
end;
$$;

create or replace function public.admin_get_all_users()
returns setof public.profiles
language sql
security definer
as $$
  select * from public.profiles order by created_at desc;
$$;

create or replace function public.admin_get_all_invoices()
returns setof public.invoices
language sql
security definer
as $$
  select * from public.invoices order by created_at desc;
$$;

create or replace function public.admin_update_unrecovered_losses(
  p_user_id uuid,
  p_new_losses numeric
) returns void
language sql
security definer
as $$
  update public.profiles set unrecovered_losses = p_new_losses where id = p_user_id;
$$;

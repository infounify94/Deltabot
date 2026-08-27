-- ==============================================================================
-- Admin Panel & Automated Billing Additions
-- ==============================================================================

-- 1. Add admin flag and high-water mark tracking to profiles
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists unrecovered_losses numeric not null default 0;

-- 2. Create INVOICES table for automated billing
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  billing_month text not null,      -- e.g., 'Aug 2026'
  total_profit numeric not null,
  previous_losses numeric not null default 0,
  fee_amount numeric not null,
  status text not null default 'Unpaid', -- 'Unpaid' | 'Paid'
  due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on invoices
alter table public.invoices enable row level security;

-- Users can view their own invoices
create policy "Users can view own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

-- Admins can view all invoices
create policy "Admins can view all invoices"
  on public.invoices for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Admins can manage invoices
create policy "Admins can manage invoices"
  on public.invoices for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 3. Update RLS policies to allow Admins to read all tables
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles admin_check
      where admin_check.id = auth.uid() and admin_check.is_admin = true
    )
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles admin_check
      where admin_check.id = auth.uid() and admin_check.is_admin = true
    )
  );

create policy "Admins can view all positions"
  on public.positions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can view all trade events"
  on public.trade_events for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

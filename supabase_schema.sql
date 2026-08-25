-- ==============================================================================
-- ProfitPilot Supabase Database Schema & Multi-Tenant Setup
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Create PROFILES table with full_name, phone, API keys & risk settings
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  delta_api_key text,
  delta_api_secret text,
  live_balance numeric default 0,
  is_paused boolean not null default false,
  max_lots integer not null default 1,
  cash_reserve_pct numeric not null default 40,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If the profiles table already existed, ensure new columns are added safely
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists max_lots integer default 1;
alter table public.profiles add column if not exists cash_reserve_pct numeric default 40;

-- 2. Enable Row Level Security (RLS) on profiles
alter table public.profiles enable row level security;

-- Drop existing policies if any to prevent conflicts
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Service role has full access to profiles" on public.profiles;

-- Create RLS Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. Automatic Profile Creation Trigger on Sign Up (Email & Google OAuth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Multi-Tenant POSITIONS Table (with user_id reference)
create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  run_id uuid,
  status text not null default 'open',   -- 'open' | 'adjusted' | 'closed' | 'system_pause'
  underlying text not null default 'BTC',
  expiry_date date not null,
  short_call_symbol text,
  short_call_strike numeric,
  short_put_symbol text,
  short_put_strike numeric,
  long_call_symbol text,          -- populated if adjusted to iron condor
  long_put_symbol text,
  credit_received numeric default 0,
  adjustment_cost numeric default 0,   -- debit paid for protective wings
  lots integer not null default 1,
  actual_pnl numeric default 0,
  peak_unrealized_pnl numeric default 0,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  close_reason text,               -- 'profit_take' | 'stop_loss' | 'time_exit' | 'reconciliation_mismatch' | 'kill_switch'
  realized_pnl numeric,
  manual_exit_requested boolean not null default false
);

alter table public.positions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.positions add column if not exists actual_pnl numeric default 0;

-- 5. TRADE EVENTS Table
create table if not exists public.trade_events (
  id uuid primary key default gen_random_uuid(),
  position_id uuid references public.positions(id) on delete cascade,
  event_type text not null,        -- 'entry' | 'adjust' | 'exit' | 'stop_loss' | 'profit_take' | 'error'
  detail jsonb,
  created_at timestamptz not null default now()
);

-- 6. Enable RLS on positions & trade_events
alter table public.positions enable row level security;
alter table public.trade_events enable row level security;

drop policy if exists "Users can view own positions" on public.positions;
drop policy if exists "Users can update own positions" on public.positions;
drop policy if exists "Users can insert own positions" on public.positions;

create policy "Users can view own positions"
  on public.positions for select
  using (auth.uid() = user_id);

create policy "Users can update own positions"
  on public.positions for update
  using (auth.uid() = user_id);

create policy "Users can insert own positions"
  on public.positions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own trade events" on public.trade_events;
create policy "Users can view own trade events"
  on public.trade_events for select
  using (
    exists (
      select 1 from public.positions
      where public.positions.id = public.trade_events.position_id
      and public.positions.user_id = auth.uid()
    )
  );

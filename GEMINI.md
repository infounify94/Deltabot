# ProfitPilot SaaS Dashboard - Architecture & Rules

This project is a Next.js (App Router) + Tailwind CSS dashboard using Supabase (SSR). 
When working in this codebase, the agent MUST adhere to the following rules:

## 1. Supabase Access & Schema Modifications
- The agent does NOT have MCP access to the live Supabase project. 
- Any database schema changes, table creations, or raw SQL migrations must be printed out clearly so the user can manually run them in the Supabase SQL Editor.

## 2. Row Level Security (RLS) & Admin Operations
- The database is heavily protected by RLS.
- **CRITICAL**: Do NOT use standard Supabase `.from().select()` queries for Admin pages. Because of complex `profiles` policies, querying `profiles` from within an RLS policy causes infinite recursion.
- **Solution**: All Admin-level data fetching and mutations MUST use the dedicated `SECURITY DEFINER` RPC functions:
  - `supabase.rpc('admin_get_all_users')`
  - `supabase.rpc('admin_get_all_invoices')`
  - `supabase.rpc('admin_generate_invoice')`
  - `supabase.rpc('admin_update_unrecovered_losses')`

## 3. Database Schema Quirks
- **Profiles Table**: The `profiles` table DOES NOT have a `created_at` column. Do not attempt to `ORDER BY created_at` on profiles.
- **API Keys**: `delta_api_key` and `delta_api_secret` are optional and can be null.
- **Dates**: When inserting into Postgres `date` columns (like `invoices.due_date`), ALWAYS format the date string strictly as `YYYY-MM-DD` (e.g., using `.split('T')[0]`). Sending a full ISO timestamp will cause a server 500 error.

## 4. UI & Styling Rules (Fintech Design)
- The app uses an institutional "Fintech" design system (Calm, high-contrast, paper backgrounds).
- **Tickers & Live Data**: Any numeric data that updates rapidly via WebSockets MUST use the `tabular-nums` (or `num-tabular`) utility class and fixed decimal places (e.g., `.toFixed(2)`). This prevents layout shifting and jittering.
- **Marquees**: Use GPU-accelerated CSS animations (`will-change: transform`, `translateX`) for smooth scrolling, not React state re-renders.

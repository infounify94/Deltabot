BEGIN;

-- ==============================================================================
-- 1. SECURE RPCs (Add internal auth checks & fixed search_path='')
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_all_invoices()
RETURNS SETOF public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.invoices ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_generate_invoice(
  p_user_id uuid, p_billing_month text, p_total_profit numeric, 
  p_previous_losses numeric, p_fee_amount numeric, p_status text, p_due_date date
) RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _inv public.invoices;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO public.invoices (user_id, billing_month, total_profit, previous_losses, fee_amount, status, due_date)
  VALUES (p_user_id, p_billing_month, p_total_profit, p_previous_losses, p_fee_amount, p_status, p_due_date)
  RETURNING * INTO _inv;
  RETURN _inv;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_unrecovered_losses(
  p_user_id uuid, p_new_losses numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles SET unrecovered_losses = p_new_losses WHERE id = p_user_id;
END;
$$;

-- Add an RPC for admins to modify sensitive user fields securely from the dashboard
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_user_id uuid, p_is_paused boolean, p_admin_manual_pause boolean, p_is_admin boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles 
  SET is_paused = p_is_paused, admin_manual_pause = p_admin_manual_pause, is_admin = p_is_admin
  WHERE id = p_user_id;
END;
$$;

-- EXPLICIT RPC PRIVILEGE MANAGEMENT
-- Revoke from PUBLIC and anon, grant only to authenticated (which is internally checked for is_admin=true)
REVOKE EXECUTE ON FUNCTION public.admin_get_all_users() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_all_invoices() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_generate_invoice(uuid, text, numeric, numeric, numeric, text, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_unrecovered_losses(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_profile(uuid, boolean, boolean, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_all_invoices() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_generate_invoice(uuid, text, numeric, numeric, numeric, text, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_unrecovered_losses(uuid, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, boolean, boolean, boolean) TO authenticated, service_role;


-- ==============================================================================
-- 2. PRIVILEGE ESCALATION (Column-level write permissions)
-- ==============================================================================

-- Revoke all table-wide UPDATE privileges from anon and authenticated users
REVOKE UPDATE ON public.profiles FROM anon, authenticated;

-- Explicitly grant UPDATE only on self-service columns to authenticated users
GRANT UPDATE (email, full_name, phone, delta_api_key, delta_api_secret, is_paused) ON public.profiles TO authenticated;

-- (Note: service_role inherently bypasses these GRANTS, retaining full UPDATE privileges)


-- ==============================================================================
-- 3. INFINITE RECURSION (Non-recursive auth helper)
-- ==============================================================================

-- Create a helper function that runs as superuser to bypass RLS when checking admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Secure the helper
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Drop all recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all positions" ON public.positions;
DROP POLICY IF EXISTS "Admins can view all trade events" ON public.trade_events;
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;

-- Recreate policies using the non-recursive helper
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view all positions" ON public.positions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view all trade events" ON public.trade_events FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view all invoices" ON public.invoices FOR SELECT USING (public.is_admin());

-- For updates/deletes that admins need, use the helper
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (public.is_admin());

COMMIT;

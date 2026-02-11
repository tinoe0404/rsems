-- =====================================================
-- SECURITY FIXES
-- =====================================================
-- 1. Secure Views
--    Set security_invoker = true so RLS policies on underlying tables 
--    are respected for the user querying the view.
-- =====================================================

ALTER VIEW public.upcoming_appointments SET (security_invoker = true);
ALTER VIEW public.high_risk_patients SET (security_invoker = true);

-- =====================================================
-- 2. Secure Functions
--    Set fixed search_path to prevent search path hijacking.
-- =====================================================

ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.calculate_risk_score(jsonb) SET search_path = public;
ALTER FUNCTION public.auto_calculate_daily_log_risk() SET search_path = public;
ALTER FUNCTION public.is_clinician() SET search_path = public;

-- =====================================================
-- 3. Fix Notifications Policy
--    Restrict INSERT permission to service_role only (which bypasses RLS).
--    Authenticated users should not be able to insert notifications directly.
-- =====================================================

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
    -- Only allow if the user is a service role (admin)
    -- This technically evaluates to false for standard users
    -- Service role bypasses RLS, so this check won't even be hit for them
    -- But for safety, we make it always false to block everyone else
    false
);

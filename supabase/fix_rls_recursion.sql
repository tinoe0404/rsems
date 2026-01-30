-- =====================================================
-- FIX: Infinite Recursion in Profiles RLS
-- =====================================================

-- 1. Create a helper function to check if the current user is a clinician
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator (postgres)
-- and bypasses RLS on the profiles table itself to avoid the loop.
CREATE OR REPLACE FUNCTION public.is_clinician()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'clinician'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic policies causing recursion
DROP POLICY IF EXISTS "Clinicians can view patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Clinicians can manage symptoms" ON public.symptoms_master;
DROP POLICY IF EXISTS "Clinicians can view all logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Clinicians can view assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clinicians can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clinicians can update appointments" ON public.appointments;

-- 3. Re-create policies using the new helper function

-- PROFILES: Clinicians can view all
CREATE POLICY "Clinicians can view all profiles" ON public.profiles
    FOR SELECT
    USING (public.is_clinician());

-- SYMPTOMS: Clinicians can manage (insert/update/delete)
CREATE POLICY "Clinicians can mange symptoms" ON public.symptoms_master
    FOR ALL
    USING (public.is_clinician());

-- DAILY_LOGS: Clinicians can view all
CREATE POLICY "Clinicians can view all logs" ON public.daily_logs
    FOR SELECT
    USING (public.is_clinician());

-- APPOINTMENTS: Clinicians can view all (simplification for "assigned" or "all" access)
CREATE POLICY "Clinicians can view all appointments" ON public.appointments
    FOR SELECT
    USING (public.is_clinician());

-- APPOINTMENTS: Clinicians can insert
CREATE POLICY "Clinicians can create appointments" ON public.appointments
    FOR INSERT
    WITH CHECK (public.is_clinician());

-- APPOINTMENTS: Clinicians can update
CREATE POLICY "Clinicians can update appointments" ON public.appointments
    FOR UPDATE
    USING (public.is_clinician());

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE 'Recursion fixed. Helper function public.is_clinician() created.';
END $$;

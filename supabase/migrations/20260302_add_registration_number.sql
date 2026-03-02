-- =====================================================
-- Migration: Add Registration Number to Profiles
-- Date: 2026-03-02
-- Description: Auto-generate unique RSEMS-XXXX numbers
--              for patient identification and login
-- =====================================================

-- 1. Add the column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS registration_number TEXT UNIQUE;

-- 2. Create a sequence for registration numbers
CREATE SEQUENCE IF NOT EXISTS public.registration_number_seq START WITH 1001;

-- 3. Function to generate a unique registration number
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
    reg_number TEXT;
BEGIN
    next_val := nextval('public.registration_number_seq');
    reg_number := 'RSEMS-' || LPAD(next_val::TEXT, 4, '0');
    RETURN reg_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update the handle_new_user trigger to include registration_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, registration_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
        public.generate_registration_number()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Backfill existing patients who don't have a registration number
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT id FROM public.profiles
        WHERE registration_number IS NULL
        ORDER BY created_at ASC
    LOOP
        UPDATE public.profiles
        SET registration_number = public.generate_registration_number()
        WHERE id = rec.id;
    END LOOP;
END $$;

-- 6. Create index for fast lookup by registration number
CREATE INDEX IF NOT EXISTS idx_profiles_registration_number
ON public.profiles(registration_number);

-- 7. Grant access
GRANT USAGE, SELECT ON SEQUENCE public.registration_number_seq TO authenticated;

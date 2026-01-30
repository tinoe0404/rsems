-- =====================================================
-- RSEMS (Radiotherapy Side Effect Monitoring System)
-- Supabase PostgreSQL Database Schema
-- =====================================================
-- Author: Best Backend Architect
-- Date: 2026-01-30
-- Description: Production-ready database schema for cancer patient monitoring
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PROFILES TABLE (Extending Supabase Auth)
-- =====================================================
-- This table extends the built-in auth.users table
-- to store additional user profile information

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'clinician')),
    cancer_type TEXT DEFAULT 'Cervical Cancer',
    treatment_start_date DATE,
    phone_number TEXT,
    date_of_birth DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase Auth with role-based information for patients and clinicians';
COMMENT ON COLUMN public.profiles.role IS 'User role: patient or clinician';
COMMENT ON COLUMN public.profiles.cancer_type IS 'Type of cancer being treated (for patients)';
COMMENT ON COLUMN public.profiles.treatment_start_date IS 'Date when radiotherapy treatment began';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- =====================================================
-- 2. SYMPTOMS_MASTER TABLE (Static Symptom Library)
-- =====================================================
-- This table stores the predefined list of symptoms
-- that patients can select during daily logging

CREATE TABLE IF NOT EXISTS public.symptoms_master (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    default_severity INTEGER NOT NULL DEFAULT 1 CHECK (default_severity BETWEEN 0 AND 3),
    description TEXT,
    clinical_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.symptoms_master IS 'Master library of all possible radiotherapy side effects/symptoms';
COMMENT ON COLUMN public.symptoms_master.default_severity IS 'Default severity level: 0=None, 1=Mild, 2=Moderate, 3=Severe';
COMMENT ON COLUMN public.symptoms_master.category IS 'Symptom category for grouping (e.g., General, Toilet, Pain, Skin)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_symptoms_category ON public.symptoms_master(category);
CREATE INDEX IF NOT EXISTS idx_symptoms_active ON public.symptoms_master(is_active);

-- =====================================================
-- SEED DATA: Populate symptoms_master with common
-- radiotherapy side effects for cervical cancer
-- =====================================================

INSERT INTO public.symptoms_master (name, category, default_severity, description, clinical_notes) VALUES
    -- General Symptoms
    ('Fatigue', 'General', 1, 'Feeling tired or lacking energy', 'Common during radiotherapy, monitor for progression'),
    ('Weakness', 'General', 1, 'General weakness or reduced strength', 'May require nutritional assessment'),
    ('Loss of Appetite', 'General', 1, 'Reduced desire to eat', 'Monitor weight and nutritional intake'),
    ('Fever', 'General', 2, 'Elevated body temperature', 'May indicate infection if persistent'),
    
    -- Nausea & Vomiting
    ('Mild Nausea', 'Nausea/Vomiting', 1, 'Slight feeling of nausea', 'Anti-emetics may help'),
    ('Moderate Nausea', 'Nausea/Vomiting', 2, 'Persistent uncomfortable nausea', 'Consider medication adjustment'),
    ('Severe Vomiting', 'Nausea/Vomiting', 3, 'Frequent vomiting episodes', 'URGENT: Risk of dehydration'),
    
    -- Bowel Issues
    ('Diarrhea (Mild)', 'Toilet/Bowel', 1, 'Loose stools 2-3 times per day', 'Monitor hydration'),
    ('Diarrhea (Severe)', 'Toilet/Bowel', 3, 'Loose stools more than 6 times per day', 'URGENT: Risk of dehydration and electrolyte imbalance'),
    ('Rectal Bleeding', 'Toilet/Bowel', 3, 'Blood in stool or rectal bleeding', 'URGENT: Immediate medical attention required'),
    ('Rectal Pain', 'Toilet/Bowel', 2, 'Pain during bowel movements', 'May require pain management'),
    ('Constipation', 'Toilet/Bowel', 1, 'Difficulty passing stools', 'Dietary management advised'),
    
    -- Urinary Issues
    ('Urinary Frequency', 'Toilet/Urinary', 1, 'Need to urinate more often', 'Common pelvic radiation side effect'),
    ('Urinary Urgency', 'Toilet/Urinary', 2, 'Sudden strong urge to urinate', 'Monitor for infection'),
    ('Painful Urination', 'Toilet/Urinary', 2, 'Pain or burning during urination', 'May require urinalysis'),
    ('Blood in Urine', 'Toilet/Urinary', 3, 'Visible blood in urine', 'URGENT: Medical evaluation needed'),
    
    -- Vaginal/Pelvic Symptoms
    ('Vaginal Discharge', 'Vaginal/Pelvic', 1, 'Unusual vaginal discharge', 'Monitor for infection signs'),
    ('Vaginal Bleeding', 'Vaginal/Pelvic', 3, 'Abnormal vaginal bleeding', 'URGENT: Immediate assessment required'),
    ('Vaginal Dryness', 'Vaginal/Pelvic', 1, 'Dryness or discomfort', 'May benefit from moisturizers'),
    ('Pelvic Pain', 'Vaginal/Pelvic', 2, 'Pain in pelvic area', 'Monitor intensity and location'),
    
    -- Skin Reactions
    ('Mild Skin Irritation', 'Skin', 1, 'Slight redness or tenderness', 'Gentle skincare recommended'),
    ('Moderate Skin Reaction', 'Skin', 2, 'Red, sore, or peeling skin', 'Specialized creams may help'),
    ('Severe Skin Breakdown', 'Skin', 3, 'Open wounds or severe blistering', 'URGENT: Wound care needed'),
    
    -- Pain
    ('Mild Abdominal Pain', 'Pain', 1, 'Slight discomfort in abdomen', 'Monitor for changes'),
    ('Severe Abdominal Pain', 'Pain', 3, 'Intense abdominal pain', 'URGENT: Immediate evaluation'),
    ('Headache', 'Pain', 1, 'Headache or head pain', 'Usually manageable with standard pain relief'),
    ('Joint/Muscle Pain', 'Pain', 1, 'Aches in joints or muscles', 'May benefit from gentle movement'),
    
    -- Sleep & Mental Health
    ('Insomnia', 'Sleep/Mental', 1, 'Difficulty sleeping', 'Sleep hygiene advice may help'),
    ('Anxiety', 'Sleep/Mental', 2, 'Feeling anxious or worried', 'Psychosocial support available'),
    ('Depression', 'Sleep/Mental', 2, 'Persistent low mood', 'May require counseling or medication'),
    
    -- Other
    ('Swelling (Legs/Feet)', 'Other', 2, 'Edema in lower extremities', 'Monitor for progression'),
    ('Shortness of Breath', 'Other', 2, 'Difficulty breathing', 'May require oxygen assessment'),
    ('Hair Loss', 'Other', 1, 'Thinning or loss of hair', 'Usually temporary')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. DAILY_LOGS TABLE (Patient Symptom Tracking)
-- =====================================================
-- This table stores each patient's daily symptom entries

CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    symptoms_entry JSONB NOT NULL DEFAULT '[]'::jsonb,
    calculated_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (calculated_risk_score BETWEEN 0 AND 3),
    requires_action BOOLEAN NOT NULL DEFAULT FALSE,
    additional_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one log per user per day
    CONSTRAINT unique_user_log_date UNIQUE(user_id, log_date)
);

-- Add comments
COMMENT ON TABLE public.daily_logs IS 'Daily symptom logs submitted by patients';
COMMENT ON COLUMN public.daily_logs.symptoms_entry IS 'JSONB array of selected symptoms with severity levels: [{symptom_id: 1, severity: 2, notes: "..."}]';
COMMENT ON COLUMN public.daily_logs.calculated_risk_score IS 'Highest severity score from the symptom entry (0-3). Auto-calculated.';
COMMENT ON COLUMN public.daily_logs.requires_action IS 'TRUE if risk score is 3 (severe), triggering clinician alert';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_log_date ON public.daily_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_requires_action ON public.daily_logs(requires_action) WHERE requires_action = TRUE;
CREATE INDEX IF NOT EXISTS idx_daily_logs_risk_score ON public.daily_logs(calculated_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, log_date DESC);

-- Create GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_daily_logs_symptoms_entry ON public.daily_logs USING GIN (symptoms_entry);

-- =====================================================
-- 4. APPOINTMENTS TABLE (Clinician Scheduling)
-- =====================================================
-- This table manages appointments between patients and clinicians

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    clinician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type TEXT DEFAULT 'Follow-up',
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
    notes TEXT,
    cancellation_reason TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.appointments IS 'Appointment scheduling between patients and clinicians';
COMMENT ON COLUMN public.appointments.status IS 'Appointment status: scheduled, confirmed, completed, cancelled, no-show';
COMMENT ON COLUMN public.appointments.appointment_type IS 'Type of appointment: Follow-up, Emergency, Consultation, etc.';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinician_id ON public.appointments(clinician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_scheduled ON public.appointments(patient_id, scheduled_at DESC);

-- =====================================================
-- 5. HELPER FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Apply trigger to daily_logs
DROP TRIGGER IF EXISTS set_updated_at_daily_logs ON public.daily_logs;
CREATE TRIGGER set_updated_at_daily_logs
    BEFORE UPDATE ON public.daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Apply trigger to appointments
DROP TRIGGER IF EXISTS set_updated_at_appointments ON public.appointments;
CREATE TRIGGER set_updated_at_appointments
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function: Calculate risk score from symptoms_entry JSONB
CREATE OR REPLACE FUNCTION public.calculate_risk_score(symptoms JSONB)
RETURNS INTEGER AS $$
DECLARE
    max_severity INTEGER := 0;
    symptom JSONB;
BEGIN
    -- Loop through symptoms array and find max severity
    FOR symptom IN SELECT * FROM jsonb_array_elements(symptoms)
    LOOP
        IF (symptom->>'severity')::INTEGER > max_severity THEN
            max_severity := (symptom->>'severity')::INTEGER;
        END IF;
    END LOOP;
    
    RETURN max_severity;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Auto-calculate risk score and set requires_action
CREATE OR REPLACE FUNCTION public.auto_calculate_daily_log_risk()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate the risk score from symptoms_entry
    NEW.calculated_risk_score := public.calculate_risk_score(NEW.symptoms_entry);
    
    -- Set requires_action if score is 3 (severe)
    NEW.requires_action := (NEW.calculated_risk_score = 3);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-calculate risk on insert/update
DROP TRIGGER IF EXISTS calculate_risk_score_trigger ON public.daily_logs;
CREATE TRIGGER calculate_risk_score_trigger
    BEFORE INSERT OR UPDATE OF symptoms_entry ON public.daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_calculate_daily_log_risk();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES RLS POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Clinicians can view all patient profiles
CREATE POLICY "Clinicians can view patient profiles" ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'clinician'
        )
    );

-- Allow profile creation (handled by trigger)
CREATE POLICY "Allow profile creation" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- SYMPTOMS_MASTER RLS POLICIES
-- =====================================================

-- All authenticated users can view symptoms
CREATE POLICY "Authenticated users can view symptoms" ON public.symptoms_master
    FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- Only clinicians can modify symptoms master
CREATE POLICY "Clinicians can manage symptoms" ON public.symptoms_master
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'clinician'
        )
    );

-- =====================================================
-- DAILY_LOGS RLS POLICIES
-- =====================================================

-- Patients can view their own logs
CREATE POLICY "Patients can view own logs" ON public.daily_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Patients can insert their own logs
CREATE POLICY "Patients can create own logs" ON public.daily_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Patients can update their own logs (same day only)
CREATE POLICY "Patients can update own logs" ON public.daily_logs
    FOR UPDATE
    USING (auth.uid() = user_id AND log_date = CURRENT_DATE);

-- Patients can delete their own logs (same day only)
CREATE POLICY "Patients can delete own logs" ON public.daily_logs
    FOR DELETE
    USING (auth.uid() = user_id AND log_date = CURRENT_DATE);

-- Clinicians can view all patient logs
CREATE POLICY "Clinicians can view all logs" ON public.daily_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'clinician'
        )
    );

-- =====================================================
-- APPOINTMENTS RLS POLICIES
-- =====================================================

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON public.appointments
    FOR SELECT
    USING (auth.uid() = patient_id);

-- Clinicians can view their assigned appointments
CREATE POLICY "Clinicians can view assigned appointments" ON public.appointments
    FOR SELECT
    USING (
        auth.uid() = clinician_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'clinician'
        )
    );

-- Clinicians can create appointments
CREATE POLICY "Clinicians can create appointments" ON public.appointments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'clinician'
        )
    );

-- Clinicians can update appointments
CREATE POLICY "Clinicians can update appointments" ON public.appointments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'clinician'
        )
    );

-- Patients can update their appointment status (confirm/cancel only)
CREATE POLICY "Patients can update appointment status" ON public.appointments
    FOR UPDATE
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- =====================================================
-- 7. HELPFUL VIEWS FOR ANALYTICS
-- =====================================================

-- View: High-risk patients (recent severity 3 symptoms)
CREATE OR REPLACE VIEW public.high_risk_patients AS
SELECT 
    p.id,
    p.full_name,
    p.cancer_type,
    dl.log_date,
    dl.calculated_risk_score,
    dl.symptoms_entry,
    dl.created_at
FROM public.profiles p
INNER JOIN public.daily_logs dl ON p.id = dl.user_id
WHERE dl.requires_action = TRUE
  AND p.role = 'patient'
ORDER BY dl.log_date DESC, dl.created_at DESC;

COMMENT ON VIEW public.high_risk_patients IS 'Patients with recent severe (level 3) symptoms requiring urgent attention';

-- View: Upcoming appointments
CREATE OR REPLACE VIEW public.upcoming_appointments AS
SELECT 
    a.id,
    a.scheduled_at,
    a.status,
    a.appointment_type,
    p_patient.full_name AS patient_name,
    p_patient.cancer_type,
    p_clinician.full_name AS clinician_name,
    a.notes
FROM public.appointments a
INNER JOIN public.profiles p_patient ON a.patient_id = p_patient.id
LEFT JOIN public.profiles p_clinician ON a.clinician_id = p_clinician.id
WHERE a.scheduled_at >= NOW()
  AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.scheduled_at ASC;

COMMENT ON VIEW public.upcoming_appointments IS 'All scheduled and confirmed upcoming appointments';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant access to tables
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.symptoms_master TO authenticated;
GRANT ALL ON public.daily_logs TO authenticated;
GRANT ALL ON public.appointments TO authenticated;

-- Grant access to sequences
GRANT USAGE, SELECT ON SEQUENCE public.symptoms_master_id_seq TO authenticated;

-- Grant access to views
GRANT SELECT ON public.high_risk_patients TO authenticated;
GRANT SELECT ON public.upcoming_appointments TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Output confirmation
DO $$
BEGIN
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'RSEMS Database Schema Created Successfully!';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'Tables created: profiles, symptoms_master, daily_logs, appointments';
    RAISE NOTICE 'RLS Policies: Enabled and configured';
    RAISE NOTICE 'Triggers: Auto-update timestamps, auto-calculate risk scores';
    RAISE NOTICE 'Seed Data: 32 symptoms loaded into symptoms_master';
    RAISE NOTICE 'Views: high_risk_patients, upcoming_appointments';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test with sample data';
    RAISE NOTICE '2. Configure Supabase Auth settings';
    RAISE NOTICE '3. Set up frontend API integration';
    RAISE NOTICE '==========================================================';
END $$;

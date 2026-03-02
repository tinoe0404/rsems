-- =====================================================
-- Migration: Update Symptoms to Match Clinical Document
-- Date: 2026-03-02
-- Description: Reorganise symptoms into Mild/Moderate/Severe
--              categories per the clinical severity scale
-- =====================================================

-- 1. Deactivate all existing symptoms (soft-delete approach)
UPDATE public.symptoms_master SET is_active = FALSE;

-- 2. Insert new symptom set matching the clinical document
-- Using ON CONFLICT to handle any name collisions with existing data
INSERT INTO public.symptoms_master (name, category, default_severity, description, clinical_notes) VALUES
    -- ================================
    -- MILD / Common (Severity 1) - Normal to Tolerable
    -- ================================
    ('Fatigue', 'General', 1, 'General tiredness, low energy', 'Common during radiotherapy, normal to tolerable'),
    ('Skin changes', 'Skin', 1, 'Redness, dryness, mild irritation in pelvic area', 'Monitor for progression to moderate/severe'),
    ('Loss of appetite', 'General', 1, 'Reduced desire to eat', 'Monitor weight and nutritional intake'),
    ('Mild nausea', 'Nausea/Vomiting', 1, 'Slight feeling of nausea', 'Anti-emetics may help if persistent'),
    ('Urinary frequency', 'Toilet/Urinary', 1, 'Needing to urinate more often', 'Common pelvic radiation side effect'),
    ('Vaginal dryness or mild discharge', 'Vaginal/Pelvic', 1, 'Dryness or mild vaginal discharge', 'May benefit from moisturizers'),

    -- ================================
    -- MODERATE (Severity 2) - Needs Monitoring
    -- ================================
    ('Diarrhoea', 'Toilet/Bowel', 2, 'Frequent loose stools, manageable with diet/medication', 'Monitor hydration and electrolytes'),
    ('Moderate nausea/vomiting', 'Nausea/Vomiting', 2, 'Occasional nausea or vomiting, not daily', 'Consider medication adjustment'),
    ('Bladder irritation', 'Toilet/Urinary', 2, 'Burning sensation when urinating, urgency', 'May require urinalysis to rule out infection'),
    ('Pelvic pain or cramping', 'Vaginal/Pelvic', 2, 'Pain or cramping in the pelvic area', 'Monitor intensity and location'),
    ('Mucositis', 'Vaginal/Pelvic', 2, 'Inflammation of vaginal or rectal lining', 'May require topical treatment'),
    ('Skin breakdown', 'Skin', 2, 'Peeling, moist desquamation in treated area', 'Specialized wound care may be needed'),

    -- ================================
    -- SEVERE (Severity 3) - Requires Immediate Clinical Attention
    -- ================================
    ('Severe diarrhoea', 'Toilet/Bowel', 3, 'Persistent diarrhoea, risk of dehydration', 'URGENT: IV fluids may be required'),
    ('Severe vomiting', 'Nausea/Vomiting', 3, 'More than once daily, unable to keep fluids down', 'URGENT: Risk of dehydration, may need IV support'),
    ('Rectal bleeding or blood in stool', 'Toilet/Bowel', 3, 'Blood in stool or rectal bleeding', 'URGENT: Immediate medical attention required'),
    ('Severe bladder problems', 'Toilet/Urinary', 3, 'Blood in urine, inability to urinate', 'URGENT: Immediate evaluation needed'),
    ('Severe pelvic pain', 'Vaginal/Pelvic', 3, 'Uncontrolled pain by standard medication', 'URGENT: Pain management review required'),
    ('Radiation cystitis', 'Toilet/Urinary', 3, 'Chronic inflammation causing pain, bleeding or strictures', 'URGENT: Specialist referral may be needed'),
    ('Bleeding or strictures', 'Vaginal/Pelvic', 3, 'Vaginal or rectal bleeding, tissue strictures', 'URGENT: Immediate clinical assessment required')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    default_severity = EXCLUDED.default_severity,
    description = EXCLUDED.description,
    clinical_notes = EXCLUDED.clinical_notes,
    is_active = TRUE;

# RSEMS Database Architecture

## Overview

This document provides a comprehensive overview of the RSEMS (Radiotherapy Side Effect Electronic Monitoring System) database schema designed for Supabase (PostgreSQL).

## Database Design Philosophy

The schema follows these core principles:

1. **Security First**: Row Level Security (RLS) on all tables
2. **Data Integrity**: Foreign keys, check constraints, and unique constraints
3. **Performance**: Strategic indexes on high-query columns
4. **Automation**: Triggers for timestamps and risk calculation
5. **Scalability**: JSONB for flexible symptom tracking
6. **Clinical Safety**: Automatic alerting for severe symptoms

---

## Tables

### 1. `profiles`

Extends Supabase's built-in `auth.users` table with application-specific user data.

**Columns:**
- `id` (UUID, PK): References `auth.users.id`
- `full_name` (TEXT): User's full name
- `role` (TEXT): Either 'patient' or 'clinician'
- `cancer_type` (TEXT): Type of cancer (default: Cervical Cancer)
- `treatment_start_date` (DATE): When radiotherapy began
- `phone_number` (TEXT): Contact number
- `date_of_birth` (DATE): Patient's DOB
- `created_at` (TIMESTAMPTZ): Auto-populated
- `updated_at` (TIMESTAMPTZ): Auto-updated on changes

**Key Features:**
- Auto-created when a user signs up via trigger
- Role-based access control (RBAC) foundation
- Cascade deletes when auth user is removed

**RLS Policies:**
- Users can view/edit their own profile
- Clinicians can view all patient profiles
- Auto-creation allowed for new signups

---

### 2. `symptoms_master`

Static library of all possible radiotherapy side effects.

**Columns:**
- `id` (SERIAL, PK): Auto-incrementing ID
- `name` (TEXT, UNIQUE): Symptom name (e.g., "Fatigue")
- `category` (TEXT): Group (General, Toilet, Pain, etc.)
- `default_severity` (INTEGER 0-3): Expected severity level
- `description` (TEXT): Patient-facing description
- `clinical_notes` (TEXT): Notes for clinicians
- `is_active` (BOOLEAN): Soft delete flag
- `created_at` (TIMESTAMPTZ): Creation timestamp

**Severity Levels:**
- `0` = None/Not applicable
- `1` = Mild (manageable at home)
- `2` = Moderate (requires monitoring)
- `3` = Severe (urgent medical attention)

**Seed Data:**
Contains 32 pre-populated symptoms specific to cervical cancer radiotherapy, including:
- General (Fatigue, Weakness, etc.)
- Nausea/Vomiting
- Bowel issues (Diarrhea, Rectal bleeding)
- Urinary issues
- Vaginal/Pelvic symptoms
- Skin reactions
- Pain
- Mental health

**RLS Policies:**
- All authenticated users can view active symptoms
- Only clinicians can modify the master list

---

### 3. `daily_logs`

Patient-submitted daily symptom tracking entries.

**Columns:**
- `id` (UUID, PK): Unique log identifier
- `user_id` (UUID, FK): References `profiles.id`
- `log_date` (DATE): Date of symptom entry (default: today)
- `symptoms_entry` (JSONB): Array of selected symptoms with severity
- `calculated_risk_score` (INTEGER 0-3): Auto-calculated max severity
- `requires_action` (BOOLEAN): Auto-set to true if score = 3
- `additional_notes` (TEXT): Optional patient notes
- `created_at` (TIMESTAMPTZ): When logged
- `updated_at` (TIMESTAMPTZ): Last modification time

**JSONB Structure for `symptoms_entry`:**
```json
[
  {
    "symptom_id": 1,
    "symptom_name": "Fatigue",
    "severity": 2,
    "notes": "Worse in the afternoons"
  },
  {
    "symptom_id": 9,
    "symptom_name": "Diarrhea (Severe)",
    "severity": 3,
    "notes": "8 times today"
  }
]
```

**Key Features:**
- One log per user per day (unique constraint)
- Auto-calculates risk score via trigger
- Auto-flags severe cases (`requires_action`)
- GIN index on JSONB for fast queries
- Patients can only edit same-day entries

**RLS Policies:**
- Patients can view/create their own logs
- Patients can edit/delete only same-day logs
- Clinicians can view all patient logs

---

### 4. `appointments`

Scheduling system for patient-clinician appointments.

**Columns:**
- `id` (UUID, PK): Unique appointment ID
- `patient_id` (UUID, FK): References `profiles.id`
- `clinician_id` (UUID, FK): References `profiles.id` (nullable)
- `scheduled_at` (TIMESTAMPTZ): Appointment date/time
- `duration_minutes` (INTEGER): Default 30 minutes
- `appointment_type` (TEXT): Follow-up, Emergency, Consultation
- `status` (TEXT): scheduled, confirmed, completed, cancelled, no-show
- `notes` (TEXT): Appointment notes
- `cancellation_reason` (TEXT): If cancelled
- `created_by` (UUID, FK): Who created the appointment
- `created_at` (TIMESTAMPTZ): Creation time
- `updated_at` (TIMESTAMPTZ): Last update

**Status Flow:**
```
scheduled → confirmed → completed
         ↘ cancelled
         ↘ no-show
```

**RLS Policies:**
- Patients can view their own appointments
- Clinicians can view all appointments
- Clinicians can create/update appointments
- Patients can confirm or cancel their own

---

## Triggers & Automation

### 1. `handle_updated_at()`
Auto-updates the `updated_at` timestamp on any UPDATE operation.

**Applied to:** `profiles`, `daily_logs`, `appointments`

### 2. `handle_new_user()`
Automatically creates a profile entry when a new user signs up via Supabase Auth.

**Triggered on:** New `auth.users` insertion

**Logic:**
- Extracts `full_name` and `role` from user metadata
- Creates corresponding `profiles` entry
- Defaults to 'patient' role if not specified

### 3. `auto_calculate_daily_log_risk()`
Auto-calculates the risk score and sets `requires_action` flag.

**Triggered on:** INSERT or UPDATE of `daily_logs.symptoms_entry`

**Logic:**
```sql
1. Parse symptoms_entry JSONB array
2. Find the maximum severity value (0-3)
3. Set calculated_risk_score = max severity
4. If max severity = 3, set requires_action = TRUE
```

This ensures:
- No manual risk calculation needed
- Immediate alerting for severe symptoms
- Consistent risk assessment

---

## Helper Functions

### `calculate_risk_score(symptoms JSONB)`
Pure function that extracts the maximum severity from a symptoms JSONB array.

**Returns:** INTEGER (0-3)

**Used by:** The auto-calculation trigger

---

## Views

### 1. `high_risk_patients`
Lists all patients with recent severe symptoms (score = 3).

**Columns:**
- Patient ID, name, cancer type
- Log date, risk score
- Symptoms entry (JSONB)
- Created timestamp

**Use Case:** Dashboard for clinicians to prioritize urgent cases

### 2. `upcoming_appointments`
Shows all scheduled and confirmed future appointments.

**Columns:**
- Appointment details
- Patient and clinician names
- Cancer type
- Status and notes

**Use Case:** Calendar view for scheduling

---

## Indexes

Strategic indexes for optimal query performance:

### `profiles`
- `idx_profiles_role`: Fast role-based queries
- `idx_profiles_created_at`: Chronological sorting

### `symptoms_master`
- `idx_symptoms_category`: Category filtering
- `idx_symptoms_active`: Active symptom lookup

### `daily_logs`
- `idx_daily_logs_user_id`: User's log history
- `idx_daily_logs_log_date`: Date-based queries
- `idx_daily_logs_requires_action`: Urgent cases (partial index)
- `idx_daily_logs_risk_score`: Severity-based filtering
- `idx_daily_logs_user_date`: Composite for pagination
- `idx_daily_logs_symptoms_entry`: GIN index for JSONB queries

### `appointments`
- `idx_appointments_patient_id`: Patient's appointments
- `idx_appointments_clinician_id`: Clinician's schedule
- `idx_appointments_scheduled_at`: Time-based queries
- `idx_appointments_status`: Status filtering
- `idx_appointments_patient_scheduled`: Composite for patient history

---

## Security (Row Level Security)

All tables have RLS enabled to ensure data privacy.

### Access Patterns

| Table | Patient Access | Clinician Access |
|-------|---------------|------------------|
| `profiles` | Own profile only | All patient profiles |
| `symptoms_master` | Read-only (active) | Full CRUD |
| `daily_logs` | Own logs (edit same-day) | All logs (read-only) |
| `appointments` | Own appointments | All appointments |

### Policy Highlights

**Patients:**
- ✅ Can view/edit their own profile
- ✅ Can create daily symptom logs
- ✅ Can edit logs only on the same day
- ✅ Can view/update their appointment status
- ❌ Cannot view other patients' data

**Clinicians:**
- ✅ Can view all patient profiles
- ✅ Can view all symptom logs
- ✅ Can create/manage appointments
- ✅ Can modify symptoms_master library
- ❌ Cannot delete patient data

---

## Data Flow Examples

### Example 1: Patient Logs Symptoms

```sql
-- Patient submits symptoms
INSERT INTO daily_logs (user_id, symptoms_entry, additional_notes)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  '[
    {"symptom_id": 1, "symptom_name": "Fatigue", "severity": 2},
    {"symptom_id": 10, "symptom_name": "Rectal Bleeding", "severity": 3}
  ]'::jsonb,
  'Bleeding started this morning'
);

-- Trigger automatically:
-- 1. Calculates risk_score = 3 (max severity)
-- 2. Sets requires_action = TRUE
-- 3. Alerts clinician dashboard
```

### Example 2: Clinician Views High-Risk Patients

```sql
-- Query the view
SELECT * FROM high_risk_patients
WHERE log_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY log_date DESC;

-- Returns all patients with severity 3 symptoms in past week
```

### Example 3: Auto-Create Profile on Signup

```javascript
// Frontend: User signs up with Supabase Auth
const { data, error } = await supabase.auth.signUp({
  email: 'patient@example.com',
  password: 'secure_password',
  options: {
    data: {
      full_name: 'Jane Doe',
      role: 'patient'
    }
  }
});

// Trigger automatically creates profile entry
// No additional API call needed!
```

---

## Performance Considerations

1. **JSONB Indexing**: GIN index on `symptoms_entry` allows fast queries on symptom data
2. **Partial Indexes**: `requires_action` index only on TRUE values (saves space)
3. **Composite Indexes**: Combined user+date indexes for common query patterns
4. **Cascade Deletes**: Automatic cleanup when users are removed
5. **View Materialization**: Consider materializing views for analytics if dataset grows large

---

## Monitoring & Alerts

### Critical Alerts Setup

```sql
-- Query to identify patients needing immediate attention
SELECT 
  p.full_name,
  p.phone_number,
  dl.log_date,
  dl.symptoms_entry,
  dl.additional_notes
FROM daily_logs dl
JOIN profiles p ON dl.user_id = p.id
WHERE dl.requires_action = TRUE
  AND dl.log_date >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY dl.created_at DESC;
```

### Recommended Monitoring

1. **Daily:** Check `high_risk_patients` view
2. **Weekly:** Review appointment compliance rates
3. **Monthly:** Analyze symptom trends by category
4. **Real-time:** Set up webhook or edge function to notify clinicians when `requires_action = TRUE`

---

## Migration & Deployment

### Running the Schema

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the entire contents of `schema.sql`
4. Execute the script
5. Verify success message

### Rollback Strategy

```sql
-- Drop all tables (CAUTION: Data loss!)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.daily_logs CASCADE;
DROP TABLE IF EXISTS public.symptoms_master CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop views
DROP VIEW IF EXISTS public.high_risk_patients;
DROP VIEW IF EXISTS public.upcoming_appointments;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_risk_score(JSONB);
DROP FUNCTION IF EXISTS public.auto_calculate_daily_log_risk() CASCADE;
```

---

## Future Enhancements

### Phase 2 Considerations

1. **Medication Tracking Table**
   - Link to daily logs
   - Reminders and compliance tracking

2. **Clinician Notes Table**
   - Separate table for confidential clinical notes
   - Link to daily logs and appointments

3. **File Attachments**
   - Integration with Supabase Storage
   - Lab results, imaging

4. **Audit Log**
   - Track all data modifications
   - Compliance and security

5. **Analytics Tables**
   - Aggregated statistics
   - Trend analysis queries

---

## API Integration (Next.js)

### Supabase Client Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Example Queries

```typescript
// Get current user's profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// Create daily log
const { data, error } = await supabase
  .from('daily_logs')
  .insert({
    user_id: user.id,
    symptoms_entry: selectedSymptoms,
    additional_notes: notes
  });

// Get all symptoms for selection
const { data: symptoms } = await supabase
  .from('symptoms_master')
  .select('*')
  .eq('is_active', true)
  .order('category', { ascending: true });
```

---

## Testing

### Sample Test Data

```sql
-- Create test patient
INSERT INTO profiles (id, full_name, role, cancer_type, treatment_start_date)
VALUES (
  gen_random_uuid(),
  'Test Patient',
  'patient',
  'Cervical Cancer',
  '2026-01-15'
);

-- Create test clinician
INSERT INTO profiles (id, full_name, role)
VALUES (
  gen_random_uuid(),
  'Dr. Test Clinician',
  'clinician'
);

-- Create test log with severe symptom
INSERT INTO daily_logs (user_id, symptoms_entry)
VALUES (
  (SELECT id FROM profiles WHERE full_name = 'Test Patient'),
  '[{"symptom_id": 10, "severity": 3, "symptom_name": "Rectal Bleeding"}]'::jsonb
);

-- Verify auto-calculation worked
SELECT calculated_risk_score, requires_action
FROM daily_logs
WHERE user_id = (SELECT id FROM profiles WHERE full_name = 'Test Patient');
-- Should return: risk_score = 3, requires_action = TRUE
```

---

## Conclusion

This database schema provides a **production-ready, secure, and scalable** foundation for the RSEMS application. Key highlights:

✅ **32 pre-loaded symptoms** specific to cervical cancer radiotherapy  
✅ **Automatic risk calculation** to flag severe cases  
✅ **Row Level Security** for patient data privacy  
✅ **Performance-optimized** with strategic indexes  
✅ **Clinician-friendly** views for dashboards  
✅ **Audit trail** with timestamps on all records  

The schema is ready to be integrated with the Next.js frontend and will scale to support the needs of cancer patients in Zimbabwe.

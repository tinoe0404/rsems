# RSEMS Database Schema - Quick Reference

## 🚀 Quick Start

### 1. Run the Schema in Supabase
```bash
# Copy the SQL file contents
# Paste into Supabase Dashboard → SQL Editor → Run
```

### 2. Verify Installation
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return: profiles, symptoms_master, daily_logs, appointments

-- Check seed data
SELECT COUNT(*) FROM symptoms_master; -- Should be 32
```

---

## 📊 Tables Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **profiles** | User accounts (patients & clinicians) | Auto-created on signup, role-based access |
| **symptoms_master** | Library of 32 symptoms | Pre-seeded, categorized, severity-rated |
| **daily_logs** | Patient symptom entries | Auto risk calculation, JSONB storage |
| **appointments** | Scheduling system | Status tracking, clinician assignment |

---

## 🔐 Security Summary

**All tables use Row Level Security (RLS)**

### Patients Can:
- ✅ View/edit own profile
- ✅ Create daily logs
- ✅ Edit logs (same day only)
- ✅ View own appointments
- ❌ View other patients' data

### Clinicians Can:
- ✅ View all patient profiles
- ✅ View all symptom logs
- ✅ Create/manage appointments
- ✅ Modify symptoms library
- ❌ Delete patient data

---

## ⚡ Auto-Calculations

### Risk Score Trigger
When a patient submits symptoms:
```
1. System finds max severity (0-3) from symptoms_entry
2. Sets calculated_risk_score automatically
3. If score = 3, sets requires_action = TRUE
4. Alerts clinician dashboard
```

**Example:**
```json
Input: [
  {"severity": 1},  // Fatigue
  {"severity": 3}   // Rectal bleeding (SEVERE)
]
Result: risk_score = 3, requires_action = TRUE
```

---

## 📋 Common Queries

### Get Patient's Symptom History
```sql
SELECT log_date, calculated_risk_score, symptoms_entry
FROM daily_logs
WHERE user_id = '...'
ORDER BY log_date DESC
LIMIT 30;
```

### Get High-Risk Patients (Today)
```sql
SELECT * FROM high_risk_patients
WHERE log_date = CURRENT_DATE;
```

### Get Upcoming Appointments
```sql
SELECT * FROM upcoming_appointments
WHERE scheduled_at >= NOW()
ORDER BY scheduled_at ASC;
```

### Get Symptom Trends
```sql
SELECT 
  log_date,
  jsonb_array_length(symptoms_entry) as symptom_count,
  calculated_risk_score
FROM daily_logs
WHERE user_id = '...'
  AND log_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY log_date DESC;
```

---

## 🎯 Severity Levels

| Level | Label | Action Required | Examples |
|-------|-------|-----------------|----------|
| **0** | None | No | No symptoms |
| **1** | Mild | Monitor | Fatigue, mild nausea |
| **2** | Moderate | Schedule review | Persistent pain, frequent urination |
| **3** | Severe | **URGENT** | Rectal bleeding, severe vomiting |

---

## 📱 Frontend Integration (TypeScript)

### Setup Supabase Client
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Submit Daily Log
```typescript
const { data, error } = await supabase
  .from('daily_logs')
  .insert({
    user_id: user.id,
    symptoms_entry: [
      {
        symptom_id: 1,
        symptom_name: 'Fatigue',
        severity: 2,
        notes: 'Worse in afternoons'
      }
    ],
    additional_notes: 'Feeling better overall'
  });

// Risk score calculated automatically!
```

### Get All Symptoms
```typescript
const { data: symptoms } = await supabase
  .from('symptoms_master')
  .select('*')
  .eq('is_active', true)
  .order('category');
```

### Get High-Risk Patients (Clinician)
```typescript
const { data: highRisk } = await supabase
  .from('high_risk_patients')
  .select('*')
  .gte('log_date', new Date().toISOString().split('T')[0]);
```

---

## 🧪 Test Data

### Create Test Patient
```sql
-- First, create auth user in Supabase Auth UI
-- Then profile auto-creates via trigger

-- Or manually:
INSERT INTO profiles (id, full_name, role, cancer_type)
VALUES (
  'test-uuid-here',
  'Jane Doe',
  'patient',
  'Cervical Cancer'
);
```

### Create Test Log
```sql
INSERT INTO daily_logs (user_id, symptoms_entry)
VALUES (
  'test-uuid-here',
  '[
    {"symptom_id": 1, "symptom_name": "Fatigue", "severity": 2},
    {"symptom_id": 10, "symptom_name": "Rectal Bleeding", "severity": 3}
  ]'::jsonb
);

-- Verify auto-calculation
SELECT calculated_risk_score, requires_action FROM daily_logs
WHERE user_id = 'test-uuid-here';
-- Should return: 3, TRUE
```

---

## 📊 Symptom Categories

32 pre-loaded symptoms across 8 categories:

1. **General** (4 symptoms): Fatigue, Weakness, Loss of Appetite, Fever
2. **Nausea/Vomiting** (3): Mild/Moderate Nausea, Severe Vomiting
3. **Toilet/Bowel** (6): Diarrhea, Rectal Bleeding, Pain, Constipation
4. **Toilet/Urinary** (4): Frequency, Urgency, Painful Urination, Blood
5. **Vaginal/Pelvic** (4): Discharge, Bleeding, Dryness, Pain
6. **Skin** (3): Mild/Moderate/Severe reactions
7. **Pain** (4): Abdominal, Headache, Joint/Muscle
8. **Sleep/Mental** (3): Insomnia, Anxiety, Depression
9. **Other** (3): Swelling, Shortness of Breath, Hair Loss

---

## ⚠️ Important Notes

1. **One Log Per Day**: Unique constraint prevents duplicate logs for same user+date
2. **Same-Day Edits Only**: Patients can only modify today's log
3. **Auto-Profile Creation**: New users automatically get a profile entry
4. **Cascade Deletes**: Deleting a user removes all their logs, appointments, etc.
5. **JSONB Flexibility**: symptoms_entry can store any additional fields as needed

---

## 🔍 Monitoring Queries

### Daily Stats
```sql
SELECT 
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE requires_action) as urgent_cases,
  AVG(calculated_risk_score) as avg_risk
FROM daily_logs
WHERE log_date = CURRENT_DATE;
```

### Patient Compliance (Last 7 Days)
```sql
SELECT 
  p.full_name,
  COUNT(dl.id) as logs_submitted
FROM profiles p
LEFT JOIN daily_logs dl ON p.id = dl.user_id 
  AND dl.log_date >= CURRENT_DATE - INTERVAL '7 days'
WHERE p.role = 'patient'
GROUP BY p.id, p.full_name
HAVING COUNT(dl.id) < 7;  -- Patients not logging daily
```

---

## 🛠️ Maintenance

### Add New Symptom
```sql
INSERT INTO symptoms_master (name, category, default_severity, description)
VALUES ('New Symptom', 'General', 1, 'Description here');
```

### Deactivate Symptom (Soft Delete)
```sql
UPDATE symptoms_master
SET is_active = FALSE
WHERE name = 'Old Symptom';
```

### View Appointment Statistics
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(duration_minutes) as avg_duration
FROM appointments
GROUP BY status;
```

---

## 📚 Files in This Repository

- `schema.sql` - **Full database schema** (run this in Supabase)
- `DATABASE.md` - **Comprehensive documentation** (architecture details)
- `QUICK_REFERENCE.md` - **This file** (quick lookups)
- `../types/database.types.ts` - **TypeScript types** (frontend integration)

---

## 🚨 Emergency Queries

### Find All Severe Cases (Last 24h)
```sql
SELECT 
  p.full_name,
  p.phone_number,
  dl.log_date,
  dl.symptoms_entry,
  dl.additional_notes
FROM daily_logs dl
JOIN profiles p ON dl.user_id = p.id
WHERE dl.requires_action = TRUE
  AND dl.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY dl.created_at DESC;
```

### Patients Not Logging Recently
```sql
SELECT 
  p.id,
  p.full_name,
  MAX(dl.log_date) as last_log
FROM profiles p
LEFT JOIN daily_logs dl ON p.id = dl.user_id
WHERE p.role = 'patient'
GROUP BY p.id, p.full_name
HAVING MAX(dl.log_date) < CURRENT_DATE - INTERVAL '3 days'
   OR MAX(dl.log_date) IS NULL;
```

---

## ✅ Checklist

After running the schema:

- [ ] Verify 4 tables created
- [ ] Verify 32 symptoms in `symptoms_master`
- [ ] Test RLS policies with test user
- [ ] Create test patient profile
- [ ] Submit test daily log
- [ ] Verify auto-calculation works
- [ ] Check `high_risk_patients` view
- [ ] Set up frontend Supabase client
- [ ] Import TypeScript types

---

**Need help?** Check `DATABASE.md` for detailed explanations.

**Ready to code?** Use the types in `database.types.ts` for type-safe queries!

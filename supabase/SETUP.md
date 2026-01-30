# RSEMS Database Setup Instructions

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Project Created**: Create a new Supabase project
3. **Access**: Have your project URL and anon key ready

---

## Step 1: Run the Schema

### Option A: Via Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open `supabase/schema.sql` from this repository
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** or press `Ctrl+Enter`
8. Wait for success message (should see "RSEMS Database Schema Created Successfully!")

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run the schema
supabase db push

# Or run the SQL file directly
supabase db execute -f supabase/schema.sql
```

---

## Step 2: Verify Installation

Run these verification queries in the SQL Editor:

```sql
-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
-- Expected: appointments, daily_logs, profiles, symptoms_master

-- 2. Check symptoms are loaded
SELECT COUNT(*) as symptom_count FROM symptoms_master;
-- Expected: 32

-- 3. Check views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
-- Expected: high_risk_patients, upcoming_appointments

-- 4. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- Expected: All tables should show rowsecurity = true

-- 5. Check triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
-- Expected: Multiple triggers for updated_at, risk calculation, etc.
```

---

## Step 3: Configure Supabase Auth

### 3.1 Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional but recommended)

### 3.2 Set Up Auth Metadata

When users sign up, pass metadata to auto-create profiles:

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'patient'  // or 'clinician'
    }
  }
});
```

The `handle_new_user()` trigger will automatically create the profile!

---

## Step 4: Set Environment Variables

Create `.env.local` in your Next.js project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
1. Supabase Dashboard → **Settings** → **API**
2. Copy "Project URL" and "anon public" key

---

## Step 5: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

---

## Step 6: Test with Sample Data

### Create Test Patient

```sql
-- Option 1: Via Auth (Recommended)
-- Sign up a user through Supabase Auth
-- Profile auto-creates via trigger

-- Option 2: Manual (for testing)
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'test-patient@rsems.com',
  crypt('test123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Test Patient", "role": "patient"}'::jsonb
);
-- Profile auto-creates!
```

### Create Test Clinician

```sql
INSERT INTO profiles (id, full_name, role)
VALUES (
  gen_random_uuid(),
  'Dr. Test Clinician',
  'clinician'
);
```

### Submit Test Daily Log

```sql
INSERT INTO daily_logs (user_id, symptoms_entry, additional_notes)
VALUES (
  (SELECT id FROM profiles WHERE role = 'patient' LIMIT 1),
  '[
    {
      "symptom_id": 1, 
      "symptom_name": "Fatigue", 
      "severity": 2,
      "notes": "Feeling tired"
    },
    {
      "symptom_id": 10, 
      "symptom_name": "Rectal Bleeding", 
      "severity": 3,
      "notes": "Started this morning"
    }
  ]'::jsonb,
  'Need to see doctor soon'
);

-- Check auto-calculation worked
SELECT 
  log_date,
  calculated_risk_score,  -- Should be 3
  requires_action,         -- Should be TRUE
  symptoms_entry
FROM daily_logs
ORDER BY created_at DESC LIMIT 1;
```

### Create Test Appointment

```sql
INSERT INTO appointments (patient_id, clinician_id, scheduled_at, notes)
VALUES (
  (SELECT id FROM profiles WHERE role = 'patient' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'clinician' LIMIT 1),
  NOW() + INTERVAL '1 day',
  'Follow-up for severe symptoms'
);
```

---

## Step 7: Test RLS Policies

### Test as Patient

```javascript
// Sign in as patient
const { data: { user } } = await supabase.auth.signIn({
  email: 'patient@example.com',
  password: 'password123'
});

// Should work: View own logs
const { data: myLogs } = await supabase
  .from('daily_logs')
  .select('*')
  .eq('user_id', user.id);

// Should fail: View other patient's logs
const { data: otherLogs, error } = await supabase
  .from('daily_logs')
  .select('*')
  .neq('user_id', user.id);
// error should indicate RLS violation
```

### Test as Clinician

```javascript
// Sign in as clinician
const { data: { user } } = await supabase.auth.signIn({
  email: 'clinician@example.com',
  password: 'password123'
});

// Should work: View all patient logs
const { data: allLogs } = await supabase
  .from('daily_logs')
  .select('*');
// Should return all logs

// Should work: View high-risk patients
const { data: highRisk } = await supabase
  .from('high_risk_patients')
  .select('*');
```

---

## Step 8: Enable Real-time (Optional)

For live updates when new high-risk logs are submitted:

1. Go to **Database** → **Replication**
2. Enable replication for `daily_logs` table
3. Subscribe in your app:

```typescript
const subscription = supabase
  .channel('public:daily_logs')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'daily_logs',
      filter: 'requires_action=eq.true'
    },
    (payload) => {
      console.log('New urgent case!', payload);
      // Trigger notification to clinician
    }
  )
  .subscribe();
```

---

## Step 9: Set Up Edge Functions (Optional)

For automatic notifications when severe symptoms are logged:

Create `supabase/functions/notify-clinician/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { record } = await req.json();
  
  if (record.requires_action) {
    // Send SMS/Email to on-call clinician
    // Using Twilio, SendGrid, etc.
  }
  
  return new Response('OK', { status: 200 });
});
```

Hook it up to database webhook:
1. **Database** → **Webhooks**
2. Create webhook on `daily_logs` INSERT
3. Call your edge function

---

## Step 10: Backup Strategy

### Enable Point-in-Time Recovery

1. Go to **Settings** → **Database**
2. Enable **Point-in-Time Recovery** (PITR)
3. Choose backup window

### Export Schema (for version control)

```bash
# Export current schema
supabase db dump -f supabase/schema_backup.sql

# Or via pg_dump
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  > schema_backup.sql
```

---

## Troubleshooting

### Issue: "permission denied for schema public"

**Solution:** Run this in SQL Editor:
```sql
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### Issue: RLS policies blocking everything

**Solution:** Check if you're using the correct anon key and user is authenticated:
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);  // Should not be null
```

### Issue: Triggers not firing

**Solution:** Check triggers exist:
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

Re-run the schema if missing.

### Issue: Auto-profile creation not working

**Solution:** Verify trigger on auth.users:
```sql
SELECT * FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';
```

Should see `on_auth_user_created` trigger.

---

## Performance Monitoring

### Check Index Usage

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Check Table Sizes

```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Auth policies tested
- [ ] Environment variables secured (not committed to git)
- [ ] API keys rotated if exposed
- [ ] PITR backups enabled
- [ ] SSL enforced for database connections
- [ ] Rate limiting configured (Supabase dashboard)
- [ ] Audit logging enabled (if on Pro plan)

---

## Next Steps

1. ✅ Schema deployed and verified
2. ✅ Test data created
3. ✅ RLS policies tested
4. 📱 Build frontend symptom logging form
5. 📊 Create clinician dashboard
6. 🔔 Set up real-time notifications
7. 📈 Add analytics queries
8. 🧪 Write integration tests

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **RSEMS Schema**: See `DATABASE.md` for architecture details
- **Quick Reference**: See `QUICK_REFERENCE.md` for common queries

---

**Database is ready! 🎉** 

You now have a production-ready, secure, and scalable foundation for the RSEMS application.

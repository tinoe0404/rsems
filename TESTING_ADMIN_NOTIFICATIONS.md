# Testing Admin Notifications

## Test Instructions

1. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Navigate to Console tab
   - Look for `[DEBUG]` and `[AdminNotificationBell]` messages

2. **Log Severe Symptoms as Patient**:
   - Login as patient
   - Go to "Log Symptoms"
   - Select 2-3 symptoms
   - Grade ALL as **Severe (3)**
   - Submit

3. **Expected Console Output**:
   ```
   [DEBUG] Critical symptom detected, notifying clinicians...
   [DEBUG] Patient name: <name>
   [DEBUG] Clinicians found: <number>
   [DEBUG] Creating notifications for <number> clinicians
   [DEBUG] Notification creation result: { success: true }
   [DEBUG] Successfully created <number> notifications
   ```

4. **On Admin Side**:
   - Login as clinician in separate browser/tab
   - Check console for:
   ```
   [AdminNotificationBell] Initializing for user: <clinician-id>
   [AdminNotificationBell] Setting up realtime subscription...
   [AdminNotificationBell] Subscription status: SUBSCRIBED
   [AdminNotificationBell] Received new notification: <payload>
   ```

## Troubleshooting

### If no clinicians found:
- Check database: `SELECT * FROM profiles WHERE role = 'clinician'`
- Ensure admin user has `role = 'clinician'` in profiles table

### If notifications not created:
- Check for errors in console after `[DEBUG] Creating notifications...`
- Verify permissions on notifications table

### If realtime not working:
- Check Supabase Realtime is enabled on `notifications` table
- Verify subscription status shows "SUBSCRIBED" not "CLOSED"
- Check browser console for WebSocket errors

### If notifications created but not received:
- Verify `user_id` in notifications matches clinician's `id`
- Check RLS policies allow clinician to SELECT their notifications
- Refresh the browser to reconnect WebSocket

## Direct Database Check

Run in Supabase SQL Editor:
```sql
-- Check if notifications were created
SELECT * FROM notifications 
WHERE type = 'critical_symptom_alert' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check clinician user IDs
SELECT id, full_name, role FROM profiles WHERE role = 'clinician';
```

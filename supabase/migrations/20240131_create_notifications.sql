-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- e.g., 'appointment_new'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    resource_id UUID, -- link to appointment_id
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Enable Realtime
-- This is CRITICAL for the bell to update instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Policy: Users can see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Admins/Service Role can insert notifications
CREATE POLICY "System can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

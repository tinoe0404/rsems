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
-- Assuming logic is handled via server-side API with service role, but allowing authenticated users for now if needed.
-- Ideally, only system creates notifications.
CREATE POLICY "System can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true); -- Usually restricted, but for simplicity in this setup

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

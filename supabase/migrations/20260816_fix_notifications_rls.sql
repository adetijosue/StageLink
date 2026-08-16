-- Fix RLS Policies for Notifications Table
-- Allow users to delete their own notifications

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Delete Policy: Users can delete notifications where they are the recipient
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can delete their own notifications'
    ) THEN
        CREATE POLICY "Users can delete their own notifications"
            ON public.notifications
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Ensure Select Policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications"
            ON public.notifications
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Ensure Update Policy exists (for marking as read)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can update their own notifications'
    ) THEN
        CREATE POLICY "Users can update their own notifications"
            ON public.notifications
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END
$$;

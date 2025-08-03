-- Fix session deletion policies
-- This script updates RLS policies to allow tutors to manage their own sessions

-- First check if the policy already exists
DO $$
BEGIN
    -- Drop old policies if they exist
    DROP POLICY IF EXISTS "Sessions are viewable by everyone" ON public.sessions;
    DROP POLICY IF EXISTS "Anyone can view active sessions" ON public.sessions;
    DROP POLICY IF EXISTS "Tutors can manage their own sessions" ON public.sessions;
    
    -- Create the correct policies
    
    -- Policy for reading sessions (public can view active sessions)
    CREATE POLICY "Anyone can view active sessions" ON public.sessions
      FOR SELECT USING (is_active = true);
    
    -- Policy for tutors to manage their own sessions (CREATE, UPDATE, DELETE)
    CREATE POLICY "Tutors can manage their own sessions" ON public.sessions
      FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM public.tutors WHERE id = tutor_id
      ));
      
    RAISE NOTICE 'Session policies updated successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating policies: %', SQLERRM;
END
$$;

-- Verify the policies are created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'sessions' 
ORDER BY policyname;

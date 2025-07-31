-- Simple SQL Script to create test tutor account
-- Run this AFTER creating the auth user in Supabase Auth UI

-- Step 1: Update user to be a tutor
UPDATE public.users 
SET 
  role = 'TUTOR',
  name = 'Daniel Elkjær',
  phone = '+45 20 30 40 50',
  updated_at = NOW()
WHERE email = 'daniel@airookie.dk';

-- Step 2: Check what columns exist in tutors table
-- Run this first to see the actual schema:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'tutors' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Step 3: Create tutor profile (basic version)
-- Insert with only the required fields first
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO user_uuid FROM public.users WHERE email = 'daniel@airookie.dk';
    
    -- Insert tutor record with required fields
    INSERT INTO public.tutors (
        user_id,
        title,
        specialty,
        base_price,
        price
    ) VALUES (
        user_uuid,
        'Senior AI Consultant & Automation Specialist',
        'AI for Business Process Optimization',
        1200,
        950
    );
    
    -- Update with additional fields if they exist
    UPDATE public.tutors 
    SET 
        experience = 'Over 5 års erfaring med at implementere AI-løsninger i danske virksomheder.',
        value_prop = 'Hjælper virksomheder med at identificere og implementere AI-løsninger.',
        img = 'https://placehold.co/200x200/22C55E/FFFFFF?text=DE',
        base_price = 1200,
        price = 950,
        is_active = true,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
END $$;

-- Step 4: Verify the setup
SELECT 
    u.name, 
    u.email, 
    u.role, 
    t.title, 
    t.specialty
FROM public.users u
LEFT JOIN public.tutors t ON u.id = t.user_id
WHERE u.email = 'daniel@airookie.dk';
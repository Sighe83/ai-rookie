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

-- Step 4: Create sample sessions for the tutor
INSERT INTO public.sessions (
  tutor_id,
  title,
  description,
  duration,
  price_override,
  is_active,
  created_at,
  updated_at
) VALUES 
-- Session 1
(
  (SELECT id FROM public.tutors WHERE user_id = (SELECT id FROM public.users WHERE email = 'daniel@airookie.dk')),
  'AI-drevne business processer',
  'Lær at identificere og automatisere repetitive processer med AI-værktøjer som Zapier, Make og custom solutions.',
  90,
  NULL,
  true,
  NOW(),
  NOW()
),
-- Session 2
(
  (SELECT id FROM public.tutors WHERE user_id = (SELECT id FROM public.users WHERE email = 'daniel@airookie.dk')),
  'Intelligent dokumenthåndtering',
  'Implementér AI-baserede systemer til at behandle, kategorisere og analysere dokumenter automatisk.',
  60,
  800,
  true,
  NOW(),
  NOW()
),
-- Session 3
(
  (SELECT id FROM public.tutors WHERE user_id = (SELECT id FROM public.users WHERE email = 'daniel@airookie.dk')),
  'Data-drevet beslutningstagning',
  'Brug AI til at analysere business data og generere actionable insights for bedre beslutninger.',
  120,
  1500,
  true,
  NOW(),
  NOW()
);

-- Step 5: Verify the setup
SELECT 
    u.name, 
    u.email, 
    u.role, 
    t.title, 
    t.specialty,
    COUNT(s.id) as session_count
FROM public.users u
LEFT JOIN public.tutors t ON u.id = t.user_id
LEFT JOIN public.sessions s ON t.id = s.tutor_id
WHERE u.email = 'daniel@airookie.dk'
GROUP BY u.name, u.email, u.role, t.title, t.specialty;
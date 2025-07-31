-- Clean Test Tutor Creation Script
-- Use this AFTER running clean-database-schema.sql
-- Run this AFTER creating auth user in Supabase Auth UI with email 'daniel@airookie.dk'

-- Step 1: Update user to be a tutor
UPDATE public.users 
SET 
  role = 'TUTOR',
  name = 'Daniel Elkjær',
  phone = '+45 20 30 40 50',
  updated_at = NOW()
WHERE email = 'daniel@airookie.dk';

-- Step 2: Create tutor profile
DO $$
DECLARE
    user_uuid UUID;
    tutor_uuid UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO user_uuid FROM public.users WHERE email = 'daniel@airookie.dk';
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not found for email daniel@airookie.dk. Create auth user first!';
    END IF;
    
    -- Insert tutor record
    INSERT INTO public.tutors (
        user_id,
        title,
        specialty,
        experience,
        value_prop,
        img,
        base_price,
        price,
        is_active
    ) VALUES (
        user_uuid,
        'Senior AI Consultant & Automation Specialist',
        'AI for Business Process Optimization',
        'Over 5 års erfaring med at implementere AI-løsninger i danske virksomheder.',
        'Hjælper virksomheder med at identificere og implementere AI-løsninger.',
        'https://placehold.co/200x200/22C55E/FFFFFF?text=DE',
        1200, -- B2B price
        950,  -- B2C price  
        true
    ) RETURNING id INTO tutor_uuid;
    
    -- Step 3: Create sample sessions
    INSERT INTO public.sessions (
        tutor_id,
        title,
        description,
        duration,
        price_override,
        is_active
    ) VALUES 
    -- Session 1
    (
        tutor_uuid,
        'AI-drevne business processer',
        'Lær at identificere og automatisere repetitive processer med AI-værktøjer som Zapier, Make og custom solutions.',
        90,
        NULL,
        true
    ),
    -- Session 2
    (
        tutor_uuid,
        'Intelligent dokumenthåndtering',
        'Implementér AI-baserede systemer til at behandle, kategorisere og analysere dokumenter automatisk.',
        60,
        800,
        true
    ),
    -- Session 3
    (
        tutor_uuid,
        'Data-drevet beslutningstagning',
        'Brug AI til at analysere business data og generere actionable insights for bedre beslutninger.',
        120,
        1500,
        true
    );
    
    RAISE NOTICE 'Successfully created tutor and % sessions', 3;
    
END $$;

-- Step 4: Verify the setup
SELECT 
    u.name, 
    u.email, 
    u.role, 
    t.title as tutor_title, 
    t.specialty,
    COUNT(s.id) as session_count
FROM public.users u
LEFT JOIN public.tutors t ON u.id = t.user_id
LEFT JOIN public.sessions s ON t.id = s.tutor_id
WHERE u.email = 'daniel@airookie.dk'
GROUP BY u.name, u.email, u.role, t.title, t.specialty;
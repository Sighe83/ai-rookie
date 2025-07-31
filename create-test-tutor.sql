-- SQL Script to create test tutor account
-- Run this in your Supabase SQL Editor

-- First, create the auth user (this will trigger the user profile creation)
-- You need to do this through Supabase Auth UI or API since auth.users is protected

-- After creating the auth user, update the profile to make them a tutor
UPDATE public.users 
SET 
  role = 'TUTOR',
  name = 'Daniel Elkjær',
  phone = '+45 20 30 40 50',
  updated_at = NOW()
WHERE email = 'daniel@airookie.dk';

-- Create tutor profile
INSERT INTO public.tutors (
  user_id,
  title,
  specialty,
  experience,
  value_prop,
  img,
  base_price,
  price,
  site_mode,
  is_active,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM public.users WHERE email = 'daniel@airookie.dk'),
  'Senior AI Consultant & Automation Specialist',
  'AI for Business Process Optimization',
  'Over 5 års erfaring med at implementere AI-løsninger i danske virksomheder. Specialist i automatisering af workflows og business intelligence.',
  'Hjælper virksomheder med at identificere og implementere AI-løsninger der reducerer manuelle processer med op til 60%.',
  'https://placehold.co/200x200/22C55E/FFFFFF?text=DE',
  1200,
  950,
  'B2B',
  true,
  NOW(),
  NOW()
);

-- Create sample sessions for the tutor
INSERT INTO public.sessions (
  tutor_id,
  title,
  description,
  duration_minutes,
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

-- Add some sample availability (optional)
INSERT INTO public.tutor_availability (
  tutor_id,
  date,
  time_slots,
  created_at,
  updated_at
) VALUES 
(
  (SELECT id FROM public.tutors WHERE user_id = (SELECT id FROM public.users WHERE email = 'daniel@airookie.dk')),
  CURRENT_DATE + INTERVAL '1 day',
  '[
    {"time": "09:00", "available": true, "booked": false},
    {"time": "10:30", "available": true, "booked": false},
    {"time": "14:00", "available": true, "booked": false}
  ]'::jsonb,
  NOW(),
  NOW()
),
(
  (SELECT id FROM public.tutors WHERE user_id = (SELECT id FROM public.users WHERE email = 'daniel@airookie.dk')),
  CURRENT_DATE + INTERVAL '2 days',
  '[
    {"time": "16:00", "available": true, "booked": false}
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Verify the setup
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
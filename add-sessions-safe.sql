-- Safe way to add sessions - checks which columns exist first

-- First check if sessions table has duration or duration_minutes
DO $$
DECLARE
    has_duration boolean := false;
    has_duration_minutes boolean := false;
    tutor_uuid UUID;
BEGIN
    -- Check if duration column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'duration'
        AND table_schema = 'public'
    ) INTO has_duration;
    
    -- Check if duration_minutes column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'duration_minutes'
        AND table_schema = 'public'
    ) INTO has_duration_minutes;
    
    -- Get tutor ID
    SELECT id INTO tutor_uuid FROM public.tutors 
    WHERE user_id = (SELECT id FROM public.users WHERE email = 'daniel@airookie.dk');
    
    IF tutor_uuid IS NULL THEN
        RAISE EXCEPTION 'Tutor not found for daniel@airookie.dk';
    END IF;
    
    -- Insert sessions based on which column exists
    IF has_duration THEN
        -- Use duration column
        INSERT INTO public.sessions (tutor_id, title, description, duration, is_active, created_at, updated_at)
        VALUES 
        (tutor_uuid, 'AI-drevne business processer', 'Lær at identificere og automatisere repetitive processer med AI-værktøjer som Zapier, Make og custom solutions.', 90, true, NOW(), NOW()),
        (tutor_uuid, 'Intelligent dokumenthåndtering', 'Implementér AI-baserede systemer til at behandle, kategorisere og analysere dokumenter automatisk.', 60, true, NOW(), NOW()),
        (tutor_uuid, 'Data-drevet beslutningstagning', 'Brug AI til at analysere business data og generere actionable insights for bedre beslutninger.', 120, true, NOW(), NOW());
        
        RAISE NOTICE 'Sessions created using duration column';
        
    ELSIF has_duration_minutes THEN
        -- Use duration_minutes column
        INSERT INTO public.sessions (tutor_id, title, description, duration_minutes, is_active, created_at, updated_at)
        VALUES 
        (tutor_uuid, 'AI-drevne business processer', 'Lær at identificere og automatisere repetitive processer med AI-værktøjer som Zapier, Make og custom solutions.', 90, true, NOW(), NOW()),
        (tutor_uuid, 'Intelligent dokumenthåndtering', 'Implementér AI-baserede systemer til at behandle, kategorisere og analysere dokumenter automatisk.', 60, true, NOW(), NOW()),
        (tutor_uuid, 'Data-drevet beslutningstagning', 'Brug AI til at analysere business data og generere actionable insights for bedre beslutninger.', 120, true, NOW(), NOW());
        
        RAISE NOTICE 'Sessions created using duration_minutes column';
        
    ELSE
        RAISE EXCEPTION 'Neither duration nor duration_minutes column found in sessions table';
    END IF;
    
END $$;

-- Verify the sessions were created
SELECT 
    t.title as tutor_title,
    s.title as session_title,
    s.description,
    COALESCE(s.duration, s.duration_minutes) as duration_value
FROM public.tutors t
JOIN public.sessions s ON t.id = s.tutor_id
JOIN public.users u ON t.user_id = u.id
WHERE u.email = 'daniel@airookie.dk';
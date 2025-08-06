-- Debug queries for tutor dashboard issues
-- Run these in Supabase SQL Editor to check data

-- 1. Check if tutor_time_slots table exists and has data
SELECT 
    'tutor_time_slots table check' as check_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT tutor_id) as unique_tutors,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM public.tutor_time_slots;

-- 2. Check available slots for next week (example tutor_id - replace with actual)
SELECT 
    'Available slots next week' as check_type,
    tutor_id,
    date,
    COUNT(*) as slots_count,
    COUNT(CASE WHEN is_available = true AND is_booked = false THEN 1 END) as available_slots,
    COUNT(CASE WHEN is_booked = true THEN 1 END) as booked_slots
FROM public.tutor_time_slots
WHERE date >= CURRENT_DATE + INTERVAL '1 day'
  AND date <= CURRENT_DATE + INTERVAL '7 days'
GROUP BY tutor_id, date
ORDER BY tutor_id, date;

-- 3. Check bookings for next 7 days
SELECT 
    'Bookings next 7 days' as check_type,
    tutor_id,
    status,
    COUNT(*) as booking_count,
    DATE(selected_date_time) as booking_date
FROM public.bookings
WHERE selected_date_time >= NOW()
  AND selected_date_time <= NOW() + INTERVAL '7 days'
GROUP BY tutor_id, status, DATE(selected_date_time)
ORDER BY tutor_id, booking_date;

-- 4. Check monthly earnings (current month)
SELECT 
    'Monthly earnings' as check_type,
    tutor_id,
    status,
    COUNT(*) as booking_count,
    SUM(total_price) as total_earnings,
    AVG(total_price) as avg_price
FROM public.bookings
WHERE DATE(selected_date_time) >= DATE_TRUNC('month', CURRENT_DATE)
  AND DATE(selected_date_time) < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND status IN ('CONFIRMED', 'COMPLETED')
GROUP BY tutor_id, status
ORDER BY tutor_id;

-- 5. Check completed sessions total
SELECT 
    'Completed sessions total' as check_type,
    tutor_id,
    COUNT(*) as completed_count,
    MIN(selected_date_time) as first_session,
    MAX(selected_date_time) as last_session
FROM public.bookings
WHERE status = 'COMPLETED'
GROUP BY tutor_id
ORDER BY tutor_id;

-- 6. Check if old tutor_availability table still exists
SELECT 
    'Old availability table check' as check_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT tutor_id) as unique_tutors
FROM public.tutor_availability;

-- 7. Sample of actual tutors for reference
SELECT 
    'Sample tutors' as check_type,
    id as tutor_id,
    user_id,
    title,
    is_active
FROM public.tutors
WHERE is_active = true
LIMIT 5;
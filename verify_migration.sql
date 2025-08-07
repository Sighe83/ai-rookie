-- Verification queries for tutor_time_slots migration
-- Run these after applying the migration

-- 1. Check if new table exists and has data
SELECT 
  'tutor_time_slots' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT tutor_id) as unique_tutors,
  COUNT(DISTINCT date) as unique_dates,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM public.tutor_time_slots;

-- 2. Check data migration completeness
SELECT 
  'Migration Summary' as check_type,
  (SELECT COUNT(*) FROM public.tutor_availability) as old_records,
  (SELECT COUNT(*) FROM public.tutor_time_slots) as new_records,
  (SELECT COUNT(DISTINCT tutor_id || date::text) FROM public.tutor_availability) as unique_old_dates,
  (SELECT COUNT(DISTINCT tutor_id || date::text) FROM public.tutor_time_slots) as unique_new_dates;

-- 3. Sample data comparison
SELECT 
  'Sample Old Data' as data_type,
  ta.tutor_id,
  ta.date,
  jsonb_array_length(ta.time_slots) as slot_count,
  ta.time_slots->0->>'time' as first_slot_time
FROM public.tutor_availability ta
LIMIT 5;

SELECT 
  'Sample New Data' as data_type,
  tts.tutor_id,
  tts.date,
  tts.start_time,
  tts.end_time,
  tts.is_available,
  tts.is_booked
FROM public.tutor_time_slots tts
ORDER BY tts.tutor_id, tts.date, tts.start_time
LIMIT 10;

-- 4. Check for any missing data
WITH old_data AS (
  SELECT DISTINCT tutor_id, date
  FROM public.tutor_availability
),
new_data AS (
  SELECT DISTINCT tutor_id, date
  FROM public.tutor_time_slots
)
SELECT 
  'Missing in New Table' as check_type,
  COUNT(*) as missing_count
FROM old_data
LEFT JOIN new_data USING (tutor_id, date)
WHERE new_data.tutor_id IS NULL;

-- 5. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tutor_time_slots'
  AND table_schema = 'public'
ORDER BY ordinal_position;
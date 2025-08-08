-- Check for orphaned data before migration
SELECT 
  COUNT(*) as total_slots,
  COUNT(CASE WHEN status != 'AVAILABLE' THEN 1 END) as non_available,
  COUNT(CASE WHEN booking_id IS NOT NULL THEN 1 END) as with_booking_id
FROM tutor_time_slots;
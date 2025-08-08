-- Migration: Simplify TutorTimeSlot status from two boolean columns to one enum
-- Author: Claude Code Assistant
-- Date: 2025-08-07
-- Purpose: Eliminate confusion between is_available and is_booked, prevent contradictory states

BEGIN;

-- Step 1: Create the new enum type
CREATE TYPE time_slot_status AS ENUM ('AVAILABLE', 'BOOKED', 'PENDING', 'UNAVAILABLE');

-- Step 2: Add the new status column (nullable initially for data migration)
ALTER TABLE tutor_time_slots 
ADD COLUMN status time_slot_status;

-- Step 3: Migrate existing data based on current boolean combinations
-- This handles all possible states including the problematic "available but booked"
UPDATE tutor_time_slots 
SET status = CASE 
    -- Normal available slot (free for booking)
    WHEN is_available = true AND is_booked = false THEN 'AVAILABLE'::time_slot_status
    
    -- Problematic case: available but booked = awaiting payment  
    WHEN is_available = true AND is_booked = true THEN 'PENDING'::time_slot_status
    
    -- Tutor blocked this time
    WHEN is_available = false AND is_booked = false THEN 'UNAVAILABLE'::time_slot_status
    
    -- Confirmed booking (slot unavailable due to confirmed booking)
    WHEN is_available = false AND is_booked = true THEN 'BOOKED'::time_slot_status
    
    -- Default fallback (should never happen but safety first)
    ELSE 'AVAILABLE'::time_slot_status
END;

-- Step 4: Make the new column NOT NULL (after data migration)
ALTER TABLE tutor_time_slots 
ALTER COLUMN status SET NOT NULL;

-- Step 5: Set default value for future inserts
ALTER TABLE tutor_time_slots 
ALTER COLUMN status SET DEFAULT 'AVAILABLE'::time_slot_status;

-- Step 6: Create indexes on the new status column for performance
CREATE INDEX idx_tutor_time_slots_status ON tutor_time_slots(status);
CREATE INDEX idx_tutor_time_slots_tutor_status ON tutor_time_slots(tutor_id, status);
CREATE INDEX idx_tutor_time_slots_date_status ON tutor_time_slots(date, status);

-- Step 7: Drop the old composite index (it will be recreated by Prisma if needed)
DROP INDEX IF EXISTS "tutor_time_slots_isAvailable_isBooked_idx";

-- Step 8: Remove the old confusing columns
ALTER TABLE tutor_time_slots 
DROP COLUMN is_available,
DROP COLUMN is_booked;

-- Step 9: Add helpful comment explaining the status values
COMMENT ON COLUMN tutor_time_slots.status IS 
'Time slot availability status:
- AVAILABLE: Free for booking by B2C users
- PENDING: Reserved for awaiting payment (15-minute window)  
- BOOKED: Has confirmed paid booking
- UNAVAILABLE: Tutor has blocked this time slot';

-- Step 10: Add constraint to ensure booking_id consistency
-- If status is PENDING or BOOKED, booking_id should exist
-- If status is AVAILABLE or UNAVAILABLE, booking_id should be null
ALTER TABLE tutor_time_slots
ADD CONSTRAINT chk_booking_id_consistency 
CHECK (
  (status IN ('PENDING', 'BOOKED') AND booking_id IS NOT NULL) OR
  (status IN ('AVAILABLE', 'UNAVAILABLE') AND booking_id IS NULL)
);

COMMIT;

-- Verification queries to check the migration results:
-- SELECT status, COUNT(*) as count FROM tutor_time_slots GROUP BY status ORDER BY status;
-- SELECT status, COUNT(*) FILTER (WHERE booking_id IS NOT NULL) as with_booking FROM tutor_time_slots GROUP BY status;

-- Expected results after migration:
-- AVAILABLE: Most slots (booking_id = null)
-- PENDING: 1-2 slots (with booking_id, awaiting payment)
-- BOOKED: 0 slots initially (confirmed bookings)  
-- UNAVAILABLE: 0 slots initially (tutor blocked times)
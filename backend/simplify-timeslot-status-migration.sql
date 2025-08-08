-- Migration: Simplify TutorTimeSlot status from two boolean columns to one enum
-- This eliminates the confusion between is_available and is_booked

-- Step 1: Create the new enum type
CREATE TYPE time_slot_status AS ENUM ('AVAILABLE', 'BOOKED', 'PENDING', 'UNAVAILABLE');

-- Step 2: Add the new status column
ALTER TABLE tutor_time_slots 
ADD COLUMN status time_slot_status;

-- Step 3: Migrate existing data based on current boolean combinations
UPDATE tutor_time_slots 
SET status = CASE 
    WHEN is_available = true AND is_booked = false THEN 'AVAILABLE'::time_slot_status
    WHEN is_available = true AND is_booked = true THEN 'PENDING'::time_slot_status    -- Awaiting payment
    WHEN is_available = false AND is_booked = false THEN 'UNAVAILABLE'::time_slot_status
    WHEN is_available = false AND is_booked = true THEN 'BOOKED'::time_slot_status    -- Confirmed booking
    ELSE 'AVAILABLE'::time_slot_status  -- Default fallback
END;

-- Step 4: Make the new column NOT NULL (after data migration)
ALTER TABLE tutor_time_slots 
ALTER COLUMN status SET NOT NULL;

-- Step 5: Create index on the new status column for performance
CREATE INDEX idx_tutor_time_slots_status ON tutor_time_slots(status);
CREATE INDEX idx_tutor_time_slots_tutor_status ON tutor_time_slots(tutor_id, status);

-- Step 6: Drop the old composite index
DROP INDEX IF EXISTS "tutor_time_slots_isAvailable_isBooked_idx";

-- Step 7: Remove the old confusing columns
ALTER TABLE tutor_time_slots 
DROP COLUMN is_available,
DROP COLUMN is_booked;

-- Step 8: Add a comment explaining the new status values
COMMENT ON COLUMN tutor_time_slots.status IS 
'Time slot availability status: AVAILABLE (free for booking), BOOKED (confirmed booking), PENDING (awaiting payment), UNAVAILABLE (tutor blocked)';

-- Verification query to check the migration results
-- SELECT status, COUNT(*) as count FROM tutor_time_slots GROUP BY status;
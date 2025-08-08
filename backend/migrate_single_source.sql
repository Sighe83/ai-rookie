-- Migration to implement single source of truth architecture
-- Remove redundant status tracking from tutor_time_slots

-- Step 1: Drop foreign key constraint first
ALTER TABLE tutor_time_slots DROP CONSTRAINT IF EXISTS tutor_time_slots_booking_id_fkey;

-- Step 2: Drop the columns that create dual state management
ALTER TABLE tutor_time_slots DROP COLUMN IF EXISTS status;
ALTER TABLE tutor_time_slots DROP COLUMN IF EXISTS booking_id;
ALTER TABLE tutor_time_slots DROP COLUMN IF EXISTS client_name;

-- Step 3: Drop the enum type since it's no longer used
DROP TYPE IF EXISTS time_slot_status;
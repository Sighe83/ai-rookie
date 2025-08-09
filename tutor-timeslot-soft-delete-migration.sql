-- Migration to add soft delete capabilities to tutor_time_slots
-- This allows tracking when tutors remove availability slots

-- Add status and deletion tracking columns
ALTER TABLE tutor_time_slots 
ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_reason TEXT NULL;

-- Create index for efficient queries on active slots
CREATE INDEX idx_tutor_time_slots_status ON tutor_time_slots(status);
CREATE INDEX idx_tutor_time_slots_active ON tutor_time_slots(tutor_id, date, status) WHERE status = 'ACTIVE';

-- Add comments for documentation
COMMENT ON COLUMN tutor_time_slots.status IS 'ACTIVE, DELETED, CANCELLED, BOOKED';
COMMENT ON COLUMN tutor_time_slots.deleted_at IS 'When the tutor removed this time slot';
COMMENT ON COLUMN tutor_time_slots.deleted_reason IS 'Why the slot was removed (tutor_edit, conflict, etc)';

-- Update existing records to be ACTIVE
UPDATE tutor_time_slots SET status = 'ACTIVE' WHERE status IS NULL;
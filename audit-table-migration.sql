-- Migration: Add audit log table for availability changes
-- This maintains single source of truth while adding change tracking

-- Create audit log table (separate from main availability logic)
CREATE TABLE tutor_availability_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NULL, -- for future use
    action VARCHAR(20) NOT NULL CHECK (action IN ('ADDED', 'REMOVED')),
    reason VARCHAR(50) DEFAULT 'tutor_edit',
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    changed_by UUID NOT NULL REFERENCES users(id),
    
    -- Additional context fields
    session_id UUID NULL, -- if change was due to booking
    notes TEXT NULL
);

-- Indexes for efficient queries
CREATE INDEX idx_tutor_availability_log_tutor_date 
ON tutor_availability_log(tutor_id, date);

CREATE INDEX idx_tutor_availability_log_changed_at 
ON tutor_availability_log(changed_at);

CREATE INDEX idx_tutor_availability_log_action 
ON tutor_availability_log(action);

-- Comments for documentation
COMMENT ON TABLE tutor_availability_log IS 'Audit log for tutor availability changes - does not affect real-time availability calculations';
COMMENT ON COLUMN tutor_availability_log.action IS 'ADDED = slot was created, REMOVED = slot was deleted';
COMMENT ON COLUMN tutor_availability_log.reason IS 'Why the change happened: tutor_edit, booking_conflict, admin_action, etc';
COMMENT ON COLUMN tutor_availability_log.changed_by IS 'User who made the change (usually the tutor)';

-- Optional: Add RLS policies if using Supabase RLS
-- ALTER TABLE tutor_availability_log ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Tutors can view their own availability log" ON tutor_availability_log
-- FOR SELECT USING (
--     tutor_id IN (
--         SELECT id FROM tutors WHERE user_id = auth.uid()
--     )
-- );

-- CREATE POLICY "Tutors can insert their own availability log" ON tutor_availability_log  
-- FOR INSERT WITH CHECK (
--     tutor_id IN (
--         SELECT id FROM tutors WHERE user_id = auth.uid()
--     )
-- );

-- Optional: Create view for easy reporting
CREATE VIEW tutor_availability_changes_summary AS
SELECT 
    t.user_id,
    u.name as tutor_name,
    DATE_TRUNC('week', tal.changed_at) as week,
    tal.action,
    COUNT(*) as change_count,
    COUNT(DISTINCT tal.date) as dates_affected
FROM tutor_availability_log tal
JOIN tutors t ON tal.tutor_id = t.id  
JOIN users u ON t.user_id = u.id
WHERE tal.changed_at >= NOW() - INTERVAL '90 days'
GROUP BY t.user_id, u.name, DATE_TRUNC('week', tal.changed_at), tal.action
ORDER BY week DESC, change_count DESC;
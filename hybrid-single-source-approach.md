# Hybrid Single Source of Truth + Tracking

## Current Single Source of Truth ✅
Your system already calculates availability dynamically:

1. **Time Slots** (`tutor_time_slots`) = "When I'm potentially available"
2. **Bookings** (`bookings`) = "When I'm actually booked"  
3. **Real Availability** = Time Slots - Active Bookings

This is perfect! The booking state is the ultimate truth.

## Problem: Losing Change History
When tutors edit availability, we lose:
- What slots were removed and when
- Why they were removed (conflict, personal, etc.)
- Audit trail for business analysis

## Solution: Hybrid Approach

### Keep Single Source of Truth + Add Change Log

```
┌─────────────────────────────────────────────────────────┐
│                 SINGLE SOURCE OF TRUTH                   │
├─────────────────────────────────────────────────────────┤
│ tutor_time_slots (ACTIVE only) + bookings = availability │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   CHANGE TRACKING                       │
├─────────────────────────────────────────────────────────┤
│ tutor_availability_log (audit/analytics only)           │
└─────────────────────────────────────────────────────────┘
```

### Implementation Strategy

#### 1. Keep Current Approach (99% of queries)
```javascript
// Current logic stays exactly the same
const availability = calculateAvailability(timeSlots, bookings);
```

#### 2. Add Separate Audit Log (1% overhead)
```sql
-- New table for tracking changes only
CREATE TABLE tutor_availability_log (
    id UUID PRIMARY KEY,
    tutor_id UUID REFERENCES tutors(id),
    date DATE,
    start_time TIME,
    end_time TIME,
    action VARCHAR(20), -- 'ADDED', 'REMOVED'
    reason TEXT,
    changed_at TIMESTAMP DEFAULT NOW(),
    changed_by UUID -- tutor user_id
);
```

#### 3. Hybrid Update Logic
```javascript
updateAvailability: async (tutorId, date, newTimeSlots) => {
    // 1. Get current active slots (single source of truth)
    const currentSlots = await getCurrentActiveSlots(tutorId, date);
    
    // 2. Calculate differences
    const { added, removed } = calculateDifferences(currentSlots, newTimeSlots);
    
    // 3. Update single source of truth (PRIMARY)
    await updateTimeSlotsTable(tutorId, date, newTimeSlots);
    
    // 4. Log changes for audit (SECONDARY)
    await logAvailabilityChanges(tutorId, added, removed);
    
    return { success: true };
}
```

## Benefits of Hybrid Approach

### ✅ Maintains Single Source of Truth
- Real-time availability = `time_slots + bookings` (unchanged)
- No complex status management in main queries
- Performance stays optimal

### ✅ Adds Change Tracking
- Complete audit trail in separate table
- Analytics without affecting core logic
- Can track deletion patterns

### ✅ Best of Both Worlds
- **Operational**: Fast, simple, reliable
- **Analytical**: Full history, insights, debugging

## Practical Implementation

### Core Availability (Unchanged)
```javascript
// This stays exactly the same - your single source of truth
const getAvailability = (tutorId, date) => {
    const slots = getActiveTimeSlots(tutorId, date);
    const bookings = getActiveBookings(tutorId, date); 
    return calculateRealAvailability(slots, bookings);
};
```

### Change Tracking (Added)
```javascript
const logAvailabilityChange = async (change) => {
    await supabase.from('tutor_availability_log').insert({
        tutor_id: change.tutorId,
        date: change.date,
        start_time: change.startTime,
        action: change.action, // 'ADDED' or 'REMOVED'
        reason: change.reason || 'tutor_edit',
        changed_at: new Date().toISOString(),
        changed_by: change.userId
    });
    // This never affects main availability logic
};
```

## Decision Matrix

| Approach | Single Source | Change History | Complexity | Performance |
|----------|---------------|----------------|------------|-------------|
| **Current** | ✅ Perfect | ❌ Lost | ✅ Simple | ✅ Fast |
| **Soft Delete** | ❌ Complex | ✅ Full | ❌ Complex | ⚠️ Slower |
| **Hybrid** | ✅ Perfect | ✅ Full | ✅ Moderate | ✅ Fast |

## Recommendation: Hybrid Approach

Keep your excellent single source of truth design and add a lightweight audit log. This gives you:
- All the benefits of your current approach
- Complete change tracking for analytics
- Minimal complexity overhead
- Future-proof architecture
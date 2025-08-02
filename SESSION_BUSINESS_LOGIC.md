# Session Business Logic Implementation

## Overview

This implementation enforces the following business rules for all sessions in the AI Rookie platform:

1. **All sessions are exactly 1 hour (60 minutes)**
2. **All sessions start on the hour (00 minutes)**

These rules ensure consistency, simplify scheduling, and improve user experience.

## Implementation Details

### Backend Implementation

#### SessionService (`backend/src/services/sessionService.js`)

The core business logic service that provides:

- **Session Duration**: Always 60 minutes (`SESSION_DURATION_MINUTES = 60`)
- **Time Validation**: Ensures sessions start on the hour
- **Business Hours**: Enforces 8:00 - 18:00 scheduling window
- **Conflict Detection**: Prevents double-booking
- **Time Slot Generation**: Creates valid hour-based slots

Key methods:
```javascript
SessionService.validateSessionTime(startTime)
SessionService.isValidSessionStartTime(dateTime)
SessionService.calculateSessionEndTime(startTime)
SessionService.generateTimeSlots(date, excludeHours)
```

#### Updated Components

1. **Booking Routes** (`backend/src/routes/bookings.js`)
   - Added session time validation before booking creation
   - Integrated conflict checking
   - Enforces hour-only start times

2. **Validation Middleware** (`backend/src/middleware/validation.js`)
   - Custom Joi validation for booking times
   - Ensures times are on the hour
   - Validates business hours (8:00-18:00)
   - Fixed session duration to 60 minutes only

3. **Database Seed** (`backend/src/database/seed.js`)
   - Uses SessionService for time slot generation
   - Ensures all seeded sessions have 60-minute duration
   - Generates hour-based availability slots

### Frontend Implementation

#### SessionUtils (`src/utils/sessionUtils.js`)

Frontend utility class providing:

- **Time Validation**: Client-side validation matching backend rules
- **Display Formatting**: Consistent time display (e.g., "10:00 - 11:00")
- **Slot Generation**: Creates valid hour-based time slots
- **Conflict Detection**: Prevents scheduling conflicts

Key methods:
```javascript
SessionUtils.validateSessionTime(startTime)
SessionUtils.formatSessionTime(startTime)
SessionUtils.getAvailableHours(date, bookedHours)
SessionUtils.createHourOnlyDateTime(date, hour)
```

#### Updated Components

1. **TutorAvailability** (`src/components/TutorAvailability.jsx`)
   - Simplified to hour-based slot selection
   - Integrated SessionUtils for validation
   - Updated UI to show time ranges (e.g., "10:00 - 11:00")

## Business Rules Enforcement

### Time Constraints

- **Valid Start Times**: 08:00, 09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00, 17:00
- **Invalid Start Times**: Any time with minutes ≠ 00 (e.g., 10:30, 14:15)
- **Business Hours**: 08:00 - 18:00 (last session starts at 17:00, ends at 18:00)
- **Lunch Break**: 12:00-13:00 typically excluded from availability

### Session Duration

- **Fixed Duration**: All sessions are exactly 60 minutes
- **No Variations**: No 30-minute, 90-minute, or custom duration sessions
- **Automatic End Time**: End time is always start time + 1 hour

### Validation Flow

1. **Frontend Validation**:
   - User selects hour-only times from dropdown
   - Immediate feedback on invalid selections
   - Visual time range display (e.g., "10:00 - 11:00")

2. **Backend Validation**:
   - Double validation in booking endpoint
   - Joi schema validation
   - Business logic validation via SessionService
   - Conflict detection with existing bookings

## Database Schema

### Sessions Table
```sql
duration INTEGER DEFAULT 60 -- Always 60 minutes, no other values allowed
```

### Bookings Table
```sql
selected_date_time TIMESTAMPTZ -- Must be on the hour (minutes = 00)
```

### Tutor Availability
```json
{
  "time_slots": [
    {
      "time": "10:00",      // Always HH:00 format
      "available": true,
      "booked": false
    }
  ]
}
```

## Migration Notes

### Existing Data
- Existing sessions with non-60-minute durations should be reviewed
- Existing bookings with non-hour start times may need adjustment
- Time slot data will be converted to hour-based format

### API Changes
- Booking creation now validates start times must be on the hour
- Session creation enforces 60-minute duration
- Availability endpoints return hour-based slots

## Testing

Run the test script to verify implementation:

```bash
./test-session-logic.sh
```

This tests:
- Backend validation of session times
- Frontend utility functions
- Database seed data compliance
- API endpoint validation

## Error Messages

### Frontend (Danish)
- "Sessioner skal starte på hele timer (f.eks. 10:00, 11:00, 14:00)"
- "Sessioner skal planlægges mellem 8:00 og 18:00"
- "Dette tidsrum er allerede optaget"

### Backend (English)
- "Sessions must start on the hour (e.g., 10:00, 11:00, 14:00)"
- "Sessions must be scheduled between 8:00 and 18:00"
- "Selected time slot is not available"

## Benefits

1. **Consistency**: All sessions follow the same format
2. **Simplicity**: Easy to understand scheduling rules
3. **Efficiency**: Reduces booking complexity and conflicts
4. **User Experience**: Clear time slots with predictable duration
5. **Business Logic**: Easier pricing, resource planning, and calendar management

## Future Enhancements

- Calendar integration with hour-based slots
- Automated reminder system based on 1-hour sessions
- Resource allocation optimization
- Advanced conflict resolution
- Multi-timezone support with hour-based scheduling

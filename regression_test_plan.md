# Regression Test Plan: Migration to tutor_time_slots

## Overview
This document outlines the comprehensive testing plan for migrating from `tutor_availability` (JSONB) to `tutor_time_slots` (normalized table).

## Pre-Migration Checklist
- [ ] Backup current database
- [ ] Run `migration_to_tutor_time_slots.sql` in Supabase SQL editor
- [ ] Run `verify_migration.sql` to confirm data integrity
- [ ] Deploy updated backend code
- [ ] Deploy updated frontend code

## Backend API Testing

### 1. Availability API Endpoints
#### GET /api/availability/:tutorId
- [ ] **Test**: Fetch availability for valid tutor
  - Expected: Returns grouped data by date with time_slots array
  - Fields: `date`, `time_slots[]`, `hasAvailability`
- [ ] **Test**: Fetch availability with date range
  - Expected: Only returns slots within specified range
- [ ] **Test**: Fetch availability for non-existent tutor
  - Expected: 404 error
- [ ] **Test**: Fetch availability with no slots
  - Expected: Empty array

#### POST /api/availability/:tutorId
- [ ] **Test**: Create new availability slots
  - Send: `{ date: "2025-08-10", timeSlots: [{ time: "09:00", available: true, booked: false }] }`
  - Expected: Creates individual records in tutor_time_slots
- [ ] **Test**: Update existing availability slots
  - Expected: Deletes old slots and creates new ones
- [ ] **Test**: Create slots with invalid format
  - Expected: 400 error with validation message
- [ ] **Test**: Unauthorized tutor access
  - Expected: 403 error

#### PATCH /api/availability/:tutorId/:date/book
- [ ] **Test**: Book available time slot
  - Expected: Updates is_booked to true
- [ ] **Test**: Book already booked slot
  - Expected: 400 error
- [ ] **Test**: Book non-existent slot
  - Expected: 404 error

## Frontend Component Testing

### 1. TutorAvailability Component
- [ ] **Test**: Load existing availability
  - Expected: Displays current slots grouped by date
- [ ] **Test**: Add new time slot
  - Expected: Creates slot and refreshes display
- [ ] **Test**: Delete time slot
  - Expected: Removes slot from display
- [ ] **Test**: Edit time slot (if not booked)
  - Expected: Updates slot time range
- [ ] **Test**: View booked slots
  - Expected: Shows booked status and client name
- [ ] **Test**: Copy availability between dates
  - Expected: Duplicates slots to target date

### 2. WeeklyAvailabilityManager Component
- [ ] **Test**: Load weekly view
  - Expected: Shows grid with available slots
- [ ] **Test**: Navigate between weeks
  - Expected: Loads different week data
- [ ] **Test**: Bulk create availability
  - Expected: Creates multiple slots across weeks
- [ ] **Test**: Save weekly template
  - Expected: Persists all changes
- [ ] **Test**: Mobile day selector
  - Expected: Works on mobile viewport
- [ ] **Test**: Drag selection (desktop)
  - Expected: Selects time ranges by dragging

### 3. Booking Flow Integration
- [ ] **Test**: Display available slots in booking
  - Expected: Shows only available, non-booked slots
- [ ] **Test**: Book a time slot
  - Expected: Updates slot status in real-time
- [ ] **Test**: Prevent double booking
  - Expected: Slot becomes unavailable after booking

## Data Integrity Testing

### 1. Migration Verification
- [ ] **Test**: All old records migrated
  - Query: Compare count of tutor_availability vs tutor_time_slots
- [ ] **Test**: Time formatting correct
  - Verify: HH:MM format preserved, 1-hour durations
- [ ] **Test**: Booking status preserved
  - Verify: Booked slots maintain client names
- [ ] **Test**: No data loss
  - Verify: All tutors and dates present

### 2. Performance Testing
- [ ] **Test**: Query performance with indexes
  - Compare: Response times before/after migration
- [ ] **Test**: Bulk operations performance
  - Test: Weekly availability updates
- [ ] **Test**: Memory usage
  - Monitor: Database query efficiency

## Edge Cases Testing

### 1. Timezone Handling
- [ ] **Test**: Date boundaries
  - Verify: Dates handle timezone conversions correctly
- [ ] **Test**: Daylight saving transitions
  - Expected: Time slots remain consistent

### 2. Concurrent Access
- [ ] **Test**: Multiple tutors editing simultaneously
  - Expected: No data conflicts
- [ ] **Test**: Booking while tutor edits availability
  - Expected: Proper conflict resolution

### 3. Error Handling
- [ ] **Test**: Database connection issues
  - Expected: Graceful error messages
- [ ] **Test**: Invalid date formats
  - Expected: Validation errors
- [ ] **Test**: Malformed time slots
  - Expected: Proper error handling

## Rollback Plan
If critical issues are found:
1. Restore database from backup
2. Revert to previous code version
3. Investigate and fix issues
4. Re-run migration after fixes

## Performance Benchmarks
Before migration (baseline):
- [ ] Record avg response time for availability queries
- [ ] Record avg response time for booking operations
- [ ] Record database query count per operation

After migration (target):
- [ ] Response times should be ≤ baseline + 10%
- [ ] Database queries should be ≤ baseline (due to normalization)

## User Acceptance Testing
- [ ] **Test**: Tutor can manage availability normally
- [ ] **Test**: Students can book sessions normally  
- [ ] **Test**: All booking confirmations work
- [ ] **Test**: No visible changes to user experience
- [ ] **Test**: Mobile responsiveness maintained

## Final Verification
- [ ] All automated tests pass
- [ ] Manual testing complete
- [ ] Performance meets benchmarks
- [ ] No data integrity issues
- [ ] User experience unchanged
- [ ] Error logging functioning
- [ ] Database migrations applied successfully

## Post-Migration Monitoring
- [ ] Monitor error logs for 24 hours
- [ ] Check booking success rates
- [ ] Verify data consistency daily for 1 week
- [ ] User feedback collection
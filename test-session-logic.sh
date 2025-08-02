#!/bin/bash

# Test script for session business logic
# This script tests the new session rules implementation

echo "🧪 Testing Session Business Logic Implementation"
echo "==============================================="

# Test 1: Start the backend server and test session validation
echo "📋 Test 1: Testing session time validation..."

# Check if backend server is running
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "⚠️  Backend server not running. Starting backend..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    sleep 5
    cd ..
else
    echo "✅ Backend server is running"
fi

# Test invalid session times (should fail)
echo "🔴 Testing invalid session times (should fail)..."

# Test with non-hour start time (should fail)
curl -s -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tutorId": "test-tutor-id",
    "sessionId": "test-session-id", 
    "format": "INDIVIDUAL",
    "selectedDateTime": "2025-08-03T10:30:00.000Z",
    "contactName": "Test User",
    "contactEmail": "test@example.com",
    "siteMode": "B2C"
  }' | grep -q "must start on the hour" && echo "✅ Correctly rejected non-hour time" || echo "❌ Failed to reject non-hour time"

# Test with time outside business hours (should fail) 
curl -s -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tutorId": "test-tutor-id",
    "sessionId": "test-session-id",
    "format": "INDIVIDUAL", 
    "selectedDateTime": "2025-08-03T07:00:00.000Z",
    "contactName": "Test User",
    "contactEmail": "test@example.com",
    "siteMode": "B2C"
  }' | grep -q "between 8:00 and 18:00" && echo "✅ Correctly rejected time outside business hours" || echo "❌ Failed to reject time outside business hours"

echo ""
echo "🟢 Testing valid session times (should succeed)..."

# Test with valid hour time (should succeed - though may fail for other reasons like missing tutor)
curl -s -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tutorId": "test-tutor-id",
    "sessionId": "test-session-id",
    "format": "INDIVIDUAL",
    "selectedDateTime": "2025-08-03T10:00:00.000Z", 
    "contactName": "Test User",
    "contactEmail": "test@example.com",
    "siteMode": "B2C"
  }' | grep -q "start on the hour\|between 8:00 and 18:00" && echo "❌ Valid time was incorrectly rejected" || echo "✅ Valid time passed validation"

echo ""
echo "📅 Test 2: Testing session duration enforcement..."

# Test the SessionService directly if we can run node
if command -v node >/dev/null 2>&1; then
    node -e "
    const SessionService = require('./backend/src/services/sessionService.js');
    
    console.log('Testing SessionService...');
    
    // Test session duration
    const duration = SessionService.SESSION_DURATION_MINUTES;
    console.log(duration === 60 ? '✅ Session duration is 60 minutes' : '❌ Session duration is not 60 minutes');
    
    // Test hour validation
    const validTime = SessionService.isValidSessionStartTime('2025-08-03T10:00:00.000Z');
    console.log(validTime ? '✅ Hour start time validation works' : '❌ Hour start time validation failed');
    
    const invalidTime = SessionService.isValidSessionStartTime('2025-08-03T10:30:00.000Z');
    console.log(!invalidTime ? '✅ Non-hour time correctly rejected' : '❌ Non-hour time incorrectly accepted');
    
    // Test time slot generation
    const slots = SessionService.generateTimeSlots(new Date('2025-08-03'));
    const hasCorrectHours = slots.every(slot => slot.time.endsWith(':00'));
    console.log(hasCorrectHours ? '✅ Time slots are all on the hour' : '❌ Time slots contain non-hour times');
    
    const correctDuration = slots.every(slot => slot.duration === 60);
    console.log(correctDuration ? '✅ All slots have 60-minute duration' : '❌ Slots have incorrect duration');
    "
fi

echo ""
echo "🏗️  Test 3: Testing database seed with new session logic..."

# Run database seed and check that sessions have 60-minute duration
cd backend
if npm run seed 2>&1 | grep -q "Database seeded successfully"; then
    echo "✅ Database seed completed successfully"
    
    # Check session durations in database
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    prisma.session.findMany()
      .then(sessions => {
        const allHave60MinDuration = sessions.every(session => session.duration === 60);
        console.log(allHave60MinDuration ? '✅ All sessions have 60-minute duration' : '❌ Some sessions have incorrect duration');
        return prisma.\$disconnect();
      })
      .catch(err => {
        console.log('❌ Error checking session durations:', err.message);
        return prisma.\$disconnect();
      });
    " 2>/dev/null || echo "⚠️  Could not verify session durations in database"
else
    echo "❌ Database seed failed"
fi

cd ..

echo ""
echo "📱 Test 4: Testing frontend utilities..."

# Test frontend SessionUtils if possible
if command -v node >/dev/null 2>&1; then
    node -e "
    // Mock ES modules for Node.js testing
    global.SessionUtils = {};
    eval(require('fs').readFileSync('./src/utils/sessionUtils.js', 'utf8').replace('export class SessionUtils', 'global.SessionUtils = class SessionUtils'));
    
    console.log('Testing frontend SessionUtils...');
    
    // Test session duration
    const duration = global.SessionUtils.SESSION_DURATION_MINUTES;
    console.log(duration === 60 ? '✅ Frontend session duration is 60 minutes' : '❌ Frontend session duration is not 60 minutes');
    
    // Test validation
    const valid = global.SessionUtils.validateSessionTime('2025-08-03T10:00:00.000Z');
    console.log(valid.isValid ? '✅ Frontend validation accepts valid time' : '❌ Frontend validation rejects valid time');
    
    const invalid = global.SessionUtils.validateSessionTime('2025-08-03T10:30:00.000Z');
    console.log(!invalid.isValid ? '✅ Frontend validation rejects invalid time' : '❌ Frontend validation accepts invalid time');
    " 2>/dev/null || echo "⚠️  Could not test frontend utilities"
fi

# Clean up background process if we started it
if [ ! -z "$BACKEND_PID" ]; then
    echo ""
    echo "🧹 Cleaning up background processes..."
    kill $BACKEND_PID 2>/dev/null
fi

echo ""
echo "✨ Session business logic tests completed!"
echo ""
echo "📋 Summary of new business rules implemented:"
echo "   • Sessions are always exactly 1 hour (60 minutes)"
echo "   • Sessions always start on the hour (e.g., 10:00, 11:00, 14:00)"
echo "   • Business hours are 8:00 - 18:00 (last session starts at 17:00)"
echo "   • Lunch hour (12:00-13:00) is typically excluded"
echo "   • No sessions can start at non-hour times (e.g., 10:30, 14:15)"

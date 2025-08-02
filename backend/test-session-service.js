const SessionService = require('./src/services/sessionService.js');

console.log('🧪 Testing SessionService implementation...\n');

// Test 1: Session duration
console.log('Test 1: Session Duration');
console.log('Duration:', SessionService.SESSION_DURATION_MINUTES, 'minutes');
console.log('✅ Session duration is', SessionService.SESSION_DURATION_MINUTES === 60 ? 'correct (60 minutes)' : 'incorrect');
console.log('');

// Test 2: Valid session time
console.log('Test 2: Valid Session Time');
const validTime = '2025-08-03T10:00:00.000Z';
const validation = SessionService.validateSessionTime(validTime);
console.log('Testing:', validTime);
console.log('Valid:', validation.isValid);
if (validation.isValid) {
  console.log('Start time:', validation.startTime.toISOString());
  console.log('End time:', validation.endTime.toISOString());
  console.log('Duration:', validation.duration, 'minutes');
  console.log('✅ Valid time correctly accepted');
} else {
  console.log('❌ Valid time incorrectly rejected:', validation.error);
}
console.log('');

// Test 3: Invalid session time (not on hour)
console.log('Test 3: Invalid Session Time (not on hour)');
const invalidTime = '2025-08-03T10:30:00.000Z';
const invalidValidation = SessionService.validateSessionTime(invalidTime);
console.log('Testing:', invalidTime);
console.log('Valid:', invalidValidation.isValid);
if (!invalidValidation.isValid) {
  console.log('Error:', invalidValidation.error);
  console.log('✅ Invalid time correctly rejected');
} else {
  console.log('❌ Invalid time incorrectly accepted');
}
console.log('');

// Test 4: Time slot generation
console.log('Test 4: Time Slot Generation');
const slots = SessionService.generateTimeSlots(new Date('2025-08-03'));
console.log('Generated', slots.length, 'time slots');
console.log('Sample slots:');
slots.slice(0, 3).forEach(slot => {
  console.log('  -', slot.time, '(duration:', slot.duration, 'minutes)');
});
const allOnHour = slots.every(slot => slot.time.endsWith(':00'));
const allCorrectDuration = slots.every(slot => slot.duration === 60);
console.log('All slots on hour:', allOnHour ? '✅ Yes' : '❌ No');
console.log('All correct duration:', allCorrectDuration ? '✅ Yes' : '❌ No');
console.log('');

console.log('🎉 SessionService tests completed!');

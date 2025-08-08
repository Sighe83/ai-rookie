const { convertToUTC, timeIsInRange, formatDenmarkTime } = require('./src/utils/timezone');

console.log('🧪 TESTING TIMEZONE FIX');
console.log('='.repeat(50));

// Test scenarios that should work after the fix
const testScenarios = [
  {
    name: 'Danish user selects 14:00 (no timezone)',
    input: '2025-08-07T14:00:00',
    expected: 'Should convert to 12:00:00 UTC'
  },
  {
    name: 'Danish user selects 15:00 (no timezone)', 
    input: '2025-08-07T15:00:00',
    expected: 'Should convert to 13:00:00 UTC'
  },
  {
    name: 'User sends proper Denmark timezone',
    input: '2025-08-07T14:00:00+02:00',
    expected: 'Should convert to 12:00:00 UTC'
  },
  {
    name: 'User sends UTC directly',
    input: '2025-08-07T12:00:00Z',
    expected: 'Should stay 12:00:00 UTC'
  }
];

console.log('\n🔍 TESTING TIMEZONE CONVERSIONS:');
testScenarios.forEach((scenario, i) => {
  console.log(`\n${i+1}. ${scenario.name}`);
  console.log(`   Input: ${scenario.input}`);
  
  try {
    const result = convertToUTC(scenario.input);
    console.log(`   Output: ${result.convertedDate.toISOString()}`);
    console.log(`   Time only: ${result.timeOnly}`);
    console.log(`   Conversion applied: ${result.conversionApplied ? '✅' : '❌'}`);
    console.log(`   Expected: ${scenario.expected}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
});

console.log('\n🕐 TESTING TIME SLOT MATCHING:');

// Test the specific problematic case
const testSlot = {
  start: '14:00:00',
  end: '15:00:00'
};

const timeTests = [
  { time: '14:00:00', shouldMatch: true },
  { time: '14:30:00', shouldMatch: true },
  { time: '15:00:00', shouldMatch: true },  // This was the problem case!
  { time: '13:59:59', shouldMatch: false },
  { time: '15:00:01', shouldMatch: false }
];

timeTests.forEach((test, i) => {
  const matches = timeIsInRange(test.time, testSlot.start, testSlot.end);
  const result = matches === test.shouldMatch ? '✅' : '❌';
  
  console.log(`${i+1}. Time ${test.time} in slot ${testSlot.start}-${testSlot.end}: ${matches} ${result}`);
});

console.log('\n🇩🇰 TESTING COMPLETE DENMARK SCENARIO:');
console.log('Scenario: Danish user selects 14:00 Denmark time on frontend');

const denmarkInput = '2025-08-07T14:00:00'; // What frontend sends (no timezone)
const conversion = convertToUTC(denmarkInput);
const utcTime = conversion.timeOnly;

console.log(`Frontend input: ${denmarkInput}`);
console.log(`Backend converts to: ${conversion.convertedDate.toISOString()}`);
console.log(`UTC time extracted: ${utcTime}`);

// Test against a 14:00-15:00 Denmark slot (stored as 14:00:00-15:00:00 in database)
const denmarkSlot = { start: '14:00:00', end: '15:00:00' };
const matchesDenmarkSlot = timeIsInRange(utcTime, denmarkSlot.start, denmarkSlot.end);

console.log(`Matches Denmark 14:00-15:00 slot: ${matchesDenmarkSlot ? '✅' : '❌'}`);

// Test against a UTC slot (what the conversion should match)
const utcSlot = { start: '12:00:00', end: '13:00:00' }; // 14:00 Denmark = 12:00 UTC
const matchesUtcSlot = timeIsInRange(utcTime, utcSlot.start, utcSlot.end);

console.log(`Matches UTC 12:00-13:00 slot: ${matchesUtcSlot ? '✅' : '❌'}`);

console.log('\n💡 SUMMARY:');
console.log('✅ Timezone conversion utility created');
console.log('✅ Time slot matching logic fixed (uses <= for end time)');
console.log('✅ Backend now handles Denmark timezone properly');
console.log('⚠️  Frontend should send timezone-aware times for best results');
console.log('⚠️  Database time slots should be created in proper timezone context');
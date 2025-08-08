const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function fixTimeAlignment() {
  const prisma = new PrismaClient();
  try {
    console.log('🔧 FIXING TIME ALIGNMENT ISSUES');
    console.log('='.repeat(50));
    
    console.log('ISSUE 1: Time zone handling');
    console.log('ISSUE 2: Time slot boundary logic (12:00 not < 12:00)');
    console.log('ISSUE 3: Display vs storage timezone mismatch');
    
    console.log('\n💡 RECOMMENDED FIXES:');
    console.log('1. Fix time slot matching logic (use <= instead of < for end time)');
    console.log('2. Ensure consistent timezone handling (Denmark = UTC+2 in summer)');
    console.log('3. Frontend should send timezone-aware times');
    console.log('4. Display times in user\'s local timezone');
    
    // Let's test the proposed fix for time slot matching
    console.log('\n🧪 TESTING IMPROVED TIME SLOT MATCHING:');
    
    const testSlot = {
      startTime: new Date('1970-01-01T11:00:00.000Z'),
      endTime: new Date('1970-01-01T12:00:00.000Z')
    };
    
    const selectedTime = '12:00:00'; // User wants 12:00
    const slotStart = testSlot.startTime.toISOString().slice(11, 19);
    const slotEnd = testSlot.endTime.toISOString().slice(11, 19);
    
    const currentLogic = selectedTime >= slotStart && selectedTime < slotEnd;
    const fixedLogic = selectedTime >= slotStart && selectedTime <= slotEnd;
    
    console.log(`Slot: ${slotStart}-${slotEnd}`);
    console.log(`Selected: ${selectedTime}`);
    console.log(`Current logic (< endTime): ${currentLogic} ❌`);
    console.log(`Fixed logic (<= endTime): ${fixedLogic} ✅`);
    
    console.log('\n🇩🇰 DENMARK TIMEZONE HANDLING:');
    console.log('Current time:', new Date().toLocaleString('da-DK', {timeZone: 'Europe/Copenhagen'}));
    console.log('UTC time:', new Date().toISOString());
    
    // Show the conversion issue
    const denmarkTime = '2025-08-07T14:00'; // What user sees in Denmark
    const withDenmarkTZ = '2025-08-07T14:00:00+02:00'; // Proper Denmark timezone
    
    console.log(`\nUser sees: 14:00 (Denmark time)`);
    console.log(`Frontend should send: "${withDenmarkTZ}"`);
    console.log(`Converts to UTC: ${new Date(withDenmarkTZ).toISOString()}`);
    console.log(`Time only: ${new Date(withDenmarkTZ).toISOString().slice(11, 19)}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTimeAlignment();
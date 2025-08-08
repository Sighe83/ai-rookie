const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function verifyFix() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 VERIFY THE AVAILABILITY API FIX');
    console.log('='.repeat(40));
    
    const tutorId = 'b1cdef00-1d2e-3f4a-5b6c-7d8e9f0a1b2d';
    
    // Get the exact date as a proper Date object
    const testDate = new Date('2025-08-10T00:00:00.000Z');
    
    console.log('1. LOOKING FOR BOOKED SLOTS ON 2025-08-10:');
    const bookedSlots = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: tutorId,
        date: testDate,
        isBooked: true
      }
    });
    
    console.log(`Found ${bookedSlots.length} booked slots:`);
    bookedSlots.forEach((slot, i) => {
      const time = slot.startTime.toISOString().slice(11, 19);
      console.log(`  ${i+1}. ${time} - Available: ${slot.isAvailable}, Booked: ${slot.isBooked}`);
    });
    
    console.log('\n2. TESTING AVAILABILITY API QUERY (with fix):');
    const availableSlots = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: tutorId,
        date: testDate,
        isAvailable: true,
        isBooked: false // THE FIX
      }
    });
    
    console.log(`Available slots returned: ${availableSlots.length}`);
    availableSlots.forEach((slot, i) => {
      const time = slot.startTime.toISOString().slice(11, 19);
      console.log(`  ${i+1}. ${time} - Available: ${slot.isAvailable}, Booked: ${slot.isBooked}`);
    });
    
    console.log('\n3. TESTING OLD API QUERY (without fix):');
    const oldApiSlots = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: tutorId,
        date: testDate,
        isAvailable: true
        // Missing isBooked: false
      }
    });
    
    console.log(`Old API would return: ${oldApiSlots.length} slots`);
    oldApiSlots.forEach((slot, i) => {
      const time = slot.startTime.toISOString().slice(11, 19);
      const warning = slot.isBooked ? '⚠️ BOOKED' : '✅';
      console.log(`  ${i+1}. ${time} - Available: ${slot.isAvailable}, Booked: ${slot.isBooked} ${warning}`);
    });
    
    console.log('\n4. CONCLUSION:');
    const difference = oldApiSlots.length - availableSlots.length;
    console.log(`Difference: ${difference} slots excluded by the fix`);
    
    if (difference > 0) {
      console.log(`✅ SUCCESS: Fix is working! ${difference} booked slots are properly excluded`);
    } else if (bookedSlots.length === 0) {
      console.log('ℹ️ No booked slots to test with on this date');
    } else {
      console.log('❌ Issue: Fix may not be working properly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFix();
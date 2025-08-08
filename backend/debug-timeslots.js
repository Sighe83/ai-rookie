const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function debugTimeSlots() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 Debug: Available time slots and matching logic...');
    
    // Get a sample available slot
    const sampleSlot = await prisma.tutorTimeSlot.findFirst({
      where: {
        isAvailable: true,
        isBooked: false
      }
    });
    
    if (!sampleSlot) {
      console.log('❌ No available slots found');
      return;
    }
    
    console.log('📅 Sample slot found:');
    console.log('  - ID:', sampleSlot.id);
    console.log('  - TutorId:', sampleSlot.tutorId);
    console.log('  - Date:', sampleSlot.date);
    console.log('  - StartTime:', sampleSlot.startTime);
    console.log('  - EndTime:', sampleSlot.endTime);
    
    // Test the time matching logic - use a time within the slot range
    const selectedDateTime = new Date(sampleSlot.date);
    selectedDateTime.setUTCHours(10, 15, 0, 0); // Set to 10:15 UTC, which should be within 10:00-11:00
    
    const selectedTimeOnly = selectedDateTime.toISOString().slice(11, 19);
    const startTime = sampleSlot.startTime.toISOString().slice(11, 19);
    const endTime = sampleSlot.endTime.toISOString().slice(11, 19);
    
    console.log('\n🕐 Time comparison test:');
    console.log('  - Selected time:', selectedTimeOnly);
    console.log('  - Slot start:', startTime);
    console.log('  - Slot end:', endTime);
    console.log('  - Is match?', selectedTimeOnly >= startTime && selectedTimeOnly < endTime);
    
    // Test with the actual slot times
    const slotStartDateTime = new Date(sampleSlot.date);
    const [hours, minutes] = sampleSlot.startTime.toTimeString().slice(0, 5).split(':');
    slotStartDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const slotSelectedTime = slotStartDateTime.toTimeString().slice(0, 8);
    console.log('\n🎯 Testing with slot start time:');
    console.log('  - Selected time:', slotSelectedTime);
    console.log('  - Is match?', slotSelectedTime >= startTime && slotSelectedTime < endTime);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugTimeSlots();
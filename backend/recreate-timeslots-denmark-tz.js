const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function recreateTimeSlotsWithDenmarkTZ() {
  const prisma = new PrismaClient();
  try {
    console.log('🇩🇰 RECREATING TIME SLOTS WITH PROPER DENMARK TIMEZONE');
    console.log('='.repeat(60));
    
    // Find Daniel's tutor profile
    const user = await prisma.user.findUnique({
      where: { email: 'daniel.elkjaer@cph.dk' },
      include: { tutor: true }
    });
    
    if (!user?.tutor) {
      console.log('❌ Daniel Elkjær tutor profile not found');
      return;
    }
    
    const tutorId = user.tutor.id;
    console.log(`✅ Found tutor: ${user.name} (${tutorId})`);
    
    // Delete existing time slots
    console.log('\n🗑️ Deleting existing time slots...');
    const deleted = await prisma.tutorTimeSlot.deleteMany({
      where: { tutorId: tutorId }
    });
    console.log(`✅ Deleted ${deleted.count} existing time slots`);
    
    // Create time slots with proper Denmark timezone consideration
    console.log('\n📅 Creating new time slots (Denmark timezone aware)...');
    
    const timeSlots = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    // Denmark working hours in local time (what users see)
    const denmarkWorkingHours = [
      { start: 9, end: 10 },   // 09:00-10:00 Denmark time
      { start: 10, end: 11 },  // 10:00-11:00 Denmark time
      { start: 11, end: 12 },  // 11:00-12:00 Denmark time
      { start: 13, end: 14 },  // 13:00-14:00 Denmark time (skip lunch 12-13)
      { start: 14, end: 15 },  // 14:00-15:00 Denmark time
      { start: 15, end: 16 },  // 15:00-16:00 Denmark time
      { start: 16, end: 17 }   // 16:00-17:00 Denmark time
    ];
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);
      
      // Skip weekends
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }
      
      console.log(`   Creating slots for ${currentDate.toDateString()}:`);
      
      for (const { start, end } of denmarkWorkingHours) {
        // Create time slots that represent Denmark time but stored as TIME fields
        // Since PostgreSQL TIME doesn't have timezone info, we store Denmark local time
        const startTime = new Date('1970-01-01T00:00:00.000Z');
        startTime.setUTCHours(start, 0, 0, 0);
        
        const endTime = new Date('1970-01-01T00:00:00.000Z');
        endTime.setUTCHours(end, 0, 0, 0);
        
        const timeSlot = {
          tutorId: tutorId,
          date: new Date(currentDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
          startTime: startTime,
          endTime: endTime,
          isAvailable: true,
          isBooked: false
        };
        
        timeSlots.push(timeSlot);
        console.log(`     - ${start.toString().padStart(2, '0')}:00-${end.toString().padStart(2, '0')}:00 (Denmark time)`);
      }
    }
    
    // Create all time slots
    const created = await prisma.tutorTimeSlot.createMany({
      data: timeSlots,
      skipDuplicates: true
    });
    
    console.log(`\n✅ Created ${created.count} time slots`);
    
    // Verify and show sample
    const sampleSlots = await prisma.tutorTimeSlot.findMany({
      where: { tutorId: tutorId },
      take: 5,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });
    
    console.log('\n📋 Sample time slots created:');
    sampleSlots.forEach((slot, i) => {
      const date = slot.date.toISOString().split('T')[0];
      const startTime = slot.startTime.toISOString().slice(11, 19);
      const endTime = slot.endTime.toISOString().slice(11, 19);
      console.log(`   ${i+1}. ${date} ${startTime}-${endTime} (Denmark display time)`);
    });
    
    console.log('\n💡 IMPORTANT NOTES:');
    console.log('- Time slots now represent Denmark local time');
    console.log('- Frontend should display these times directly (no conversion needed)');
    console.log('- When user selects a time, frontend should send Denmark timezone');
    console.log('- Backend will handle proper UTC conversion for booking comparison');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Update frontend to send timezone-aware times');
    console.log('2. Test booking with Denmark times (e.g., 14:00 Denmark = 12:00 UTC)');
    console.log('3. Verify time slot matching works correctly');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

recreateTimeSlotsWithDenmarkTZ();
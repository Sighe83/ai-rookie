const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function createTimeSlotsForDaniel() {
  const prisma = new PrismaClient();
  try {
    console.log('📅 CREATING TIME SLOTS FOR DANIEL ELKJAER');
    console.log('='.repeat(50));
    
    // Find the user with email daniel.elkjaer@cph.dk
    console.log('🔍 Finding user daniel.elkjaer@cph.dk...');
    const user = await prisma.user.findUnique({
      where: { email: 'daniel.elkjaer@cph.dk' },
      include: {
        tutor: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found with email daniel.elkjaer@cph.dk');
      console.log('📋 Available users:');
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true },
        take: 10
      });
      allUsers.forEach((u, i) => {
        console.log(`   ${i+1}. ${u.name} - ${u.email}`);
      });
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    
    if (!user.tutor) {
      console.log('❌ This user is not a tutor - cannot create time slots');
      return;
    }
    
    const tutor = user.tutor;
    console.log(`✅ Found tutor profile: ${tutor.id}`);
    
    // Create time slots for the next 7 days
    const timeSlots = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start from today at midnight
    
    console.log('\n📅 Creating time slots for the next 7 days...');
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log(`   Skipping ${currentDate.toDateString()} (weekend)`);
        continue;
      }
      
      console.log(`   Creating slots for ${currentDate.toDateString()}:`);
      
      // Create time slots from 9:00 to 17:00 (every hour)
      const workingHours = [
        { start: 9, end: 10 },   // 09:00-10:00
        { start: 10, end: 11 },  // 10:00-11:00
        { start: 11, end: 12 },  // 11:00-12:00
        { start: 13, end: 14 },  // 13:00-14:00 (skip lunch 12-13)
        { start: 14, end: 15 },  // 14:00-15:00
        { start: 15, end: 16 },  // 15:00-16:00
        { start: 16, end: 17 }   // 16:00-17:00
      ];
      
      for (const { start, end } of workingHours) {
        const startTime = new Date('1970-01-01T00:00:00.000Z');
        startTime.setUTCHours(start, 0, 0, 0);
        
        const endTime = new Date('1970-01-01T00:00:00.000Z');
        endTime.setUTCHours(end, 0, 0, 0);
        
        const timeSlot = {
          tutorId: tutor.id,
          date: new Date(currentDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
          startTime: startTime,
          endTime: endTime,
          isAvailable: true,
          isBooked: false
        };
        
        timeSlots.push(timeSlot);
        console.log(`     - ${start.toString().padStart(2, '0')}:00-${end.toString().padStart(2, '0')}:00`);
      }
    }
    
    console.log(`\n💾 Creating ${timeSlots.length} time slots in database...`);
    
    // Create all time slots
    const createdSlots = await prisma.tutorTimeSlot.createMany({
      data: timeSlots,
      skipDuplicates: true
    });
    
    console.log(`✅ Created ${createdSlots.count} time slots`);
    
    // Verify creation
    const totalSlots = await prisma.tutorTimeSlot.count({
      where: { tutorId: tutor.id }
    });
    
    console.log(`\n📊 Total time slots for ${user.name}: ${totalSlots}`);
    
    // Show a sample of created slots
    const sampleSlots = await prisma.tutorTimeSlot.findMany({
      where: { tutorId: tutor.id },
      take: 5,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });
    
    console.log('\n📅 Sample time slots created:');
    sampleSlots.forEach((slot, i) => {
      const date = slot.date.toISOString().split('T')[0];
      const startTime = slot.startTime.toISOString().slice(11, 19);
      const endTime = slot.endTime.toISOString().slice(11, 19);
      console.log(`   ${i+1}. ${date} ${startTime}-${endTime} (Available: ${slot.isAvailable})`);
    });
    
    console.log('\n🎉 SUCCESS: Time slots created for Daniel Elkjaer!');
    
  } catch (error) {
    console.error('❌ Error creating time slots:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createTimeSlotsForDaniel();
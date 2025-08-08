const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function analyzeBookingIssue() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 ROOT CAUSE ANALYSIS: "Selected time slot is not available"');
    console.log('='.repeat(70));
    
    // Step 1: Check available tutors
    console.log('\n1️⃣ CHECKING AVAILABLE TUTORS:');
    const tutors = await prisma.tutor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        userId: true,
        user: {
          select: { name: true }
        }
      }
    });
    console.log(`📊 Found ${tutors.length} active tutors:`, tutors.map(t => `${t.user.name} (${t.id})`));
    
    if (tutors.length === 0) {
      console.log('❌ ROOT CAUSE: No active tutors found!');
      return;
    }
    
    // Step 2: Check available sessions
    console.log('\n2️⃣ CHECKING AVAILABLE SESSIONS:');
    const sessions = await prisma.session.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        tutorId: true,
        price: true
      }
    });
    console.log(`📊 Found ${sessions.length} active sessions:`, sessions.map(s => `${s.title} (${s.id}) - Tutor: ${s.tutorId}`));
    
    if (sessions.length === 0) {
      console.log('❌ ROOT CAUSE: No active sessions found!');
      return;
    }
    
    // Step 3: Check time slots for each tutor
    console.log('\n3️⃣ CHECKING TIME SLOTS BY TUTOR:');
    for (const tutor of tutors) {
      console.log(`\n👤 TUTOR: ${tutor.user.name} (${tutor.id})`);
      
      const allSlots = await prisma.tutorTimeSlot.findMany({
        where: { tutorId: tutor.id },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      });
      
      const availableSlots = allSlots.filter(slot => slot.isAvailable && !slot.isBooked);
      const bookedSlots = allSlots.filter(slot => slot.isBooked);
      const unavailableSlots = allSlots.filter(slot => !slot.isAvailable);
      
      console.log(`  📊 Total slots: ${allSlots.length}`);
      console.log(`  ✅ Available & not booked: ${availableSlots.length}`);
      console.log(`  📅 Booked slots: ${bookedSlots.length}`);
      console.log(`  ❌ Unavailable slots: ${unavailableSlots.length}`);
      
      if (availableSlots.length > 0) {
        console.log(`  📅 First 3 available slots:`);
        availableSlots.slice(0, 3).forEach((slot, i) => {
          const date = slot.date.toISOString().split('T')[0];
          const startTime = slot.startTime.toISOString().slice(11, 19);
          const endTime = slot.endTime.toISOString().slice(11, 19);
          console.log(`    ${i+1}. ${date} ${startTime}-${endTime} UTC`);
        });
      } else {
        console.log(`  ⚠️ NO AVAILABLE TIME SLOTS for this tutor!`);
      }
    }
    
    // Step 4: Test the booking query logic
    console.log('\n4️⃣ TESTING BOOKING QUERY LOGIC:');
    if (tutors.length > 0 && sessions.length > 0) {
      const testTutor = tutors[0];
      const testSession = sessions.find(s => s.tutorId === testTutor.id) || sessions[0];
      
      console.log(`🧪 Testing with Tutor: ${testTutor.user.name}, Session: ${testSession.title}`);
      
      // Get an available slot
      const availableSlot = await prisma.tutorTimeSlot.findFirst({
        where: {
          tutorId: testTutor.id,
          isAvailable: true,
          isBooked: false
        }
      });
      
      if (!availableSlot) {
        console.log('❌ ROOT CAUSE: No available slots found for test tutor!');
        return;
      }
      
      console.log('📅 Test slot found:', {
        date: availableSlot.date.toISOString().split('T')[0],
        startTime: availableSlot.startTime.toISOString().slice(11, 19),
        endTime: availableSlot.endTime.toISOString().slice(11, 19)
      });
      
      // Simulate the exact booking query logic
      const selectedDateTime = new Date(availableSlot.date);
      selectedDateTime.setUTCHours(10, 15, 0, 0); // Set to middle of typical time slot
      
      const dateOnly = new Date(selectedDateTime.toISOString().split('T')[0] + 'T00:00:00.000Z');
      
      console.log('🔍 Simulating booking request:', {
        tutorId: testTutor.id,
        sessionId: testSession.id,
        selectedDateTime: selectedDateTime.toISOString(),
        dateOnly: dateOnly.toISOString().split('T')[0]
      });
      
      // Replicate the booking logic
      const selectedTimeOnly = selectedDateTime.toISOString().slice(11, 19);
      
      const availableSlots = await prisma.tutorTimeSlot.findMany({
        where: {
          tutorId: testTutor.id,
          date: dateOnly,
          isAvailable: true,
          isBooked: false
        }
      });
      
      console.log(`📊 Slots found for date ${dateOnly.toISOString().split('T')[0]}: ${availableSlots.length}`);
      
      const matchingSlots = availableSlots.filter(slot => {
        const startTime = slot.startTime.toISOString().slice(11, 19);
        const endTime = slot.endTime.toISOString().slice(11, 19);
        const isMatch = selectedTimeOnly >= startTime && selectedTimeOnly < endTime;
        console.log(`  🕐 Slot ${startTime}-${endTime} vs selected ${selectedTimeOnly}: ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        return isMatch;
      });
      
      console.log(`🎯 Matching slots: ${matchingSlots.length}`);
      
      if (matchingSlots.length === 0) {
        console.log('❌ ROOT CAUSE: No slots match the selected time!');
        console.log('💡 POSSIBLE ISSUES:');
        console.log('   - Frontend sending wrong date/time format');
        console.log('   - Timezone conversion problems');
        console.log('   - Time slots not covering the selected time range');
        console.log('   - Date comparison issues (date-only vs full datetime)');
      } else {
        console.log('✅ Time slot matching logic works correctly!');
        console.log('💡 The issue might be in the frontend data being sent.');
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 SUMMARY: Check the specific tutor ID, session ID, and selectedDateTime');
    console.log('   being sent from the frontend to identify the exact mismatch.');
    
  } catch (error) {
    console.error('❌ Analysis Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeBookingIssue();
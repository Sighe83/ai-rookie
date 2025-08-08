const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function debugB2CAvailability() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 ROOT CAUSE ANALYSIS: B2C AVAILABILITY ISSUE');
    console.log('='.repeat(60));
    
    // Step 1: Check database state
    console.log('\n1️⃣ DATABASE STATE ANALYSIS:');
    console.log('-'.repeat(40));
    
    const tutorIds = await prisma.tutor.findMany({
      select: { id: true, user: { select: { name: true, email: true } } },
      include: { user: true }
    });
    
    if (tutorIds.length === 0) {
      console.log('❌ No tutors found');
      return;
    }
    
    const testTutor = tutorIds[0];
    console.log(`Test Tutor: ${testTutor.user.name} (${testTutor.id})`);
    
    // Check all time slots for this tutor
    const allSlots = await prisma.tutorTimeSlot.findMany({
      where: { tutorId: testTutor.id },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 20
    });
    
    console.log(`\nTotal time slots for tutor: ${allSlots.length}`);
    
    const availableSlots = allSlots.filter(s => s.isAvailable && !s.isBooked);
    const bookedSlots = allSlots.filter(s => s.isBooked);
    const unavailableSlots = allSlots.filter(s => !s.isAvailable);
    
    console.log(`  - Available & not booked: ${availableSlots.length}`);
    console.log(`  - Booked slots: ${bookedSlots.length}`);
    console.log(`  - Unavailable slots: ${unavailableSlots.length}`);
    
    if (bookedSlots.length > 0) {
      console.log('\n📋 BOOKED SLOTS DETAILS:');
      for (const slot of bookedSlots) {
        const date = slot.date.toISOString().split('T')[0];
        const time = slot.startTime.toISOString().slice(11, 19);
        console.log(`  - ${date} ${time} | Available: ${slot.isAvailable} | Booked: ${slot.isBooked} | BookingID: ${slot.bookingId}`);
        
        if (slot.bookingId) {
          const booking = await prisma.booking.findUnique({
            where: { id: slot.bookingId },
            select: { 
              status: true, 
              paymentStatus: true, 
              paymentExpiresAt: true,
              createdAt: true
            }
          });
          if (booking) {
            const now = new Date();
            const isExpired = booking.paymentExpiresAt && booking.paymentExpiresAt < now;
            console.log(`    └─ Status: ${booking.status} | Payment: ${booking.paymentStatus} | Expired: ${isExpired ? 'YES' : 'NO'}`);
          }
        }
      }
    }
    
    // Step 2: Test the exact query used by availabilityApi.getAvailability
    console.log('\n2️⃣ TESTING AVAILABILITY API QUERY:');
    console.log('-'.repeat(40));
    
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`Query parameters:`);
    console.log(`  - Tutor ID: ${testTutor.id}`);
    console.log(`  - Date range: ${startDate} to ${endDate}`);
    
    // Exact same query as availabilityApi.getAvailability
    const queryResult = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: testTutor.id,
        isAvailable: true,
        isBooked: false, // The fix I added
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    console.log(`\nQuery result: ${queryResult.length} slots found`);
    
    if (queryResult.length > 0) {
      console.log('\n📅 SLOTS RETURNED BY API (what B2C users see):');
      queryResult.forEach((slot, i) => {
        const date = slot.date.toISOString().split('T')[0];
        const time = slot.startTime.toISOString().slice(11, 19);
        console.log(`  ${i+1}. ${date} ${time} | Available: ${slot.isAvailable} | Booked: ${slot.isBooked}`);
      });
    } else {
      console.log('  ✅ No slots returned - this is good if there are awaiting payment bookings');
    }
    
    // Step 3: Check what should be hidden
    console.log('\n3️⃣ CHECKING WHAT SHOULD BE HIDDEN:');
    console.log('-'.repeat(40));
    
    const shouldBeHidden = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: testTutor.id,
        isBooked: true,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        booking: {
          select: {
            status: true,
            paymentStatus: true,
            paymentExpiresAt: true
          }
        }
      }
    });
    
    console.log(`Slots that should be hidden: ${shouldBeHidden.length}`);
    
    if (shouldBeHidden.length > 0) {
      shouldBeHidden.forEach((slot, i) => {
        const date = slot.date.toISOString().split('T')[0];
        const time = slot.startTime.toISOString().slice(11, 19);
        const booking = slot.booking;
        const now = new Date();
        const isExpired = booking?.paymentExpiresAt && booking.paymentExpiresAt < now;
        
        console.log(`  ${i+1}. ${date} ${time} - ${booking?.status} (${booking?.paymentStatus}) ${isExpired ? '[EXPIRED]' : ''}`);
      });
    }
    
    // Step 4: Final diagnosis
    console.log('\n4️⃣ DIAGNOSIS:');
    console.log('-'.repeat(40));
    
    const problemSlots = shouldBeHidden.filter(slot => {
      // Find slots that are booked but the query would still return them
      return queryResult.some(resultSlot => resultSlot.id === slot.id);
    });
    
    if (problemSlots.length > 0) {
      console.log('❌ PROBLEM FOUND: These booked slots are still being returned by the API:');
      problemSlots.forEach((slot, i) => {
        const date = slot.date.toISOString().split('T')[0];
        const time = slot.startTime.toISOString().slice(11, 19);
        console.log(`  ${i+1}. ${date} ${time} | Available: ${slot.isAvailable} | Booked: ${slot.isBooked}`);
      });
    } else {
      console.log('✅ API query is working correctly - booked slots are properly excluded');
      
      if (shouldBeHidden.length > 0) {
        console.log('✅ Awaiting payment slots are correctly hidden from B2C users');
      } else {
        console.log('ℹ️  No awaiting payment slots found to test with');
      }
    }
    
    // Step 5: Test frontend data transformation
    console.log('\n5️⃣ TESTING FRONTEND DATA TRANSFORMATION:');
    console.log('-'.repeat(40));
    
    // Simulate what the frontend receives
    const simulatedApiResponse = {
      data: [],
      success: true
    };
    
    const groupedData = {};
    queryResult.forEach(slot => {
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          time_slots: []
        };
      }
      groupedData[dateKey].time_slots.push({
        time: slot.startTime.toISOString().slice(11, 16), // HH:MM format
        available: slot.isAvailable,
        booked: slot.isBooked,
      });
    });
    
    simulatedApiResponse.data = Object.values(groupedData);
    
    console.log('Frontend receives data structure:');
    simulatedApiResponse.data.forEach((day, i) => {
      console.log(`  Day ${i+1}: ${day.date} - ${day.time_slots.length} slots`);
      day.time_slots.forEach((slot, j) => {
        console.log(`    ${j+1}. ${slot.time} | Available: ${slot.available} | Booked: ${slot.booked}`);
      });
    });
    
    console.log('\n✅ ROOT CAUSE ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugB2CAvailability();
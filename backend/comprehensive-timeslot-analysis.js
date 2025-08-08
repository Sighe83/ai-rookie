const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function comprehensiveTimeslotAnalysis() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 COMPREHENSIVE TIME SLOT LOGIC ANALYSIS');
    console.log('='.repeat(70));
    
    console.log('\n1️⃣ DATABASE SCHEMA ANALYSIS:');
    console.log('='.repeat(40));
    
    // Check TutorTimeSlot structure
    const sampleSlot = await prisma.tutorTimeSlot.findFirst({
      include: {
        tutor: { include: { user: true } },
        booking: true
      }
    });
    
    if (sampleSlot) {
      console.log('📋 TutorTimeSlot structure:');
      console.log('  Fields:', Object.keys(sampleSlot));
      console.log('  Sample data:', {
        id: sampleSlot.id,
        tutorId: sampleSlot.tutorId,
        date: sampleSlot.date,
        startTime: sampleSlot.startTime,
        endTime: sampleSlot.endTime,
        isAvailable: sampleSlot.isAvailable,
        isBooked: sampleSlot.isBooked,
        bookingId: sampleSlot.bookingId
      });
    }
    
    console.log('\n2️⃣ TIME SLOT STATES ANALYSIS:');
    console.log('='.repeat(40));
    
    // Count slots by state
    const totalSlots = await prisma.tutorTimeSlot.count();
    const availableSlots = await prisma.tutorTimeSlot.count({ where: { isAvailable: true } });
    const bookedSlots = await prisma.tutorTimeSlot.count({ where: { isBooked: true } });
    const availableNotBooked = await prisma.tutorTimeSlot.count({ 
      where: { isAvailable: true, isBooked: false } 
    });
    
    console.log('📊 Time slot counts:');
    console.log(`  Total slots: ${totalSlots}`);
    console.log(`  Available (isAvailable=true): ${availableSlots}`);
    console.log(`  Booked (isBooked=true): ${bookedSlots}`);
    console.log(`  Available & Not Booked: ${availableNotBooked}`);
    
    // Check for inconsistent states
    const inconsistentSlots = await prisma.tutorTimeSlot.findMany({
      where: {
        OR: [
          // Slot is not available but not booked
          { isAvailable: false, isBooked: false },
          // Slot is booked but has no booking ID
          { isBooked: true, bookingId: null },
          // Slot has booking ID but is not marked as booked
          { isBooked: false, bookingId: { not: null } }
        ]
      },
      include: { booking: true }
    });
    
    if (inconsistentSlots.length > 0) {
      console.log(`\n❌ Found ${inconsistentSlots.length} INCONSISTENT time slots:`);
      inconsistentSlots.forEach((slot, i) => {
        console.log(`  ${i+1}. Slot ${slot.id}:`);
        console.log(`     isAvailable: ${slot.isAvailable}`);
        console.log(`     isBooked: ${slot.isBooked}`);
        console.log(`     bookingId: ${slot.bookingId}`);
        console.log(`     booking exists: ${slot.booking ? 'YES' : 'NO'}`);
      });
    } else {
      console.log('✅ No inconsistent time slot states found');
    }
    
    console.log('\n3️⃣ BOOKING STATES ANALYSIS:');
    console.log('='.repeat(40));
    
    const allBookings = await prisma.booking.findMany({
      include: { timeSlots: true }
    });
    
    const bookingsByStatus = {};
    allBookings.forEach(booking => {
      const status = booking.status;
      if (!bookingsByStatus[status]) bookingsByStatus[status] = [];
      bookingsByStatus[status].push(booking);
    });
    
    console.log('📊 Bookings by status:');
    Object.keys(bookingsByStatus).forEach(status => {
      console.log(`  ${status}: ${bookingsByStatus[status].length}`);
    });
    
    // Check for orphaned bookings (bookings without time slots)
    const orphanedBookings = allBookings.filter(booking => 
      booking.timeSlots.length === 0 && booking.status !== 'CANCELLED'
    );
    
    if (orphanedBookings.length > 0) {
      console.log(`\n❌ Found ${orphanedBookings.length} ORPHANED bookings (no time slots):`);
      orphanedBookings.forEach((booking, i) => {
        console.log(`  ${i+1}. Booking ${booking.id}: ${booking.status} - ${booking.selectedDateTime}`);
      });
    } else {
      console.log('✅ No orphaned bookings found');
    }
    
    console.log('\n4️⃣ TIME SLOT BOOKING LOGIC ANALYSIS:');
    console.log('='.repeat(40));
    
    // Test the booking query logic with real data
    const testTutorId = sampleSlot?.tutorId;
    if (testTutorId) {
      console.log(`🧪 Testing booking logic with tutor: ${testTutorId}`);
      
      // Get available slots for this tutor
      const tutorSlots = await prisma.tutorTimeSlot.findMany({
        where: {
          tutorId: testTutorId,
          isAvailable: true,
          isBooked: false
        },
        take: 3
      });
      
      console.log(`📅 Found ${tutorSlots.length} available slots for this tutor`);
      
      if (tutorSlots.length > 0) {
        const testSlot = tutorSlots[0];
        const testDate = testSlot.date;
        const testTime = new Date(testDate);
        testTime.setUTCHours(
          testSlot.startTime.getUTCHours(),
          testSlot.startTime.getUTCMinutes() + 15, // 15 minutes into the slot
          0, 0
        );
        
        console.log(`🎯 Testing time slot matching for:`);
        console.log(`   Date: ${testDate.toISOString().split('T')[0]}`);
        console.log(`   Time: ${testTime.toISOString()}`);
        console.log(`   Slot: ${testSlot.startTime.toISOString().slice(11,19)}-${testSlot.endTime.toISOString().slice(11,19)}`);
        
        // Replicate the exact booking logic
        const selectedDateTime = testTime;
        const dateOnly = new Date(selectedDateTime.toISOString().split('T')[0] + 'T00:00:00.000Z');
        const selectedTimeOnly = selectedDateTime.toISOString().slice(11, 19);
        
        console.log(`🔍 Logic variables:`);
        console.log(`   selectedDateTime: ${selectedDateTime.toISOString()}`);
        console.log(`   dateOnly: ${dateOnly.toISOString()}`);
        console.log(`   selectedTimeOnly: ${selectedTimeOnly}`);
        
        // Check for pending payments
        const pendingBookings = await prisma.booking.findMany({
          where: {
            tutorId: testTutorId,
            selectedDateTime: selectedDateTime,
            status: 'AWAITING_PAYMENT',
            paymentStatus: 'PENDING',
            paymentExpiresAt: {
              gt: new Date()
            }
          }
        });
        
        console.log(`⏳ Pending bookings for this exact time: ${pendingBookings.length}`);
        
        // Get available slots for the date
        const availableSlotsForDate = await prisma.tutorTimeSlot.findMany({
          where: {
            tutorId: testTutorId,
            date: dateOnly,
            isAvailable: true,
            isBooked: false
          }
        });
        
        console.log(`📊 Available slots for date: ${availableSlotsForDate.length}`);
        
        // Test time matching
        const matchingSlots = availableSlotsForDate.filter(slot => {
          const startTime = slot.startTime.toISOString().slice(11, 19);
          const endTime = slot.endTime.toISOString().slice(11, 19);
          const matches = selectedTimeOnly >= startTime && selectedTimeOnly < endTime;
          console.log(`  🕐 Slot ${startTime}-${endTime} vs ${selectedTimeOnly}: ${matches ? '✅' : '❌'}`);
          return matches;
        });
        
        console.log(`🎯 Matching slots: ${matchingSlots.length}`);
        
        if (matchingSlots.length === 0) {
          console.log('❌ ISSUE: No matching slots found - this could be a logic problem');
        } else {
          console.log('✅ Time slot matching logic appears correct');
        }
      }
    }
    
    console.log('\n5️⃣ CLEANUP SERVICE ANALYSIS:');
    console.log('='.repeat(40));
    
    // Check for expired bookings that should be cleaned up
    const now = new Date();
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'AWAITING_PAYMENT',
        paymentStatus: 'PENDING',
        paymentExpiresAt: { lt: now }
      },
      include: { timeSlots: true }
    });
    
    console.log(`⏰ Expired bookings awaiting cleanup: ${expiredBookings.length}`);
    
    if (expiredBookings.length > 0) {
      console.log('❌ ISSUE: Expired bookings not cleaned up:');
      expiredBookings.forEach((booking, i) => {
        console.log(`  ${i+1}. Booking ${booking.id}:`);
        console.log(`     Expired: ${booking.paymentExpiresAt.toISOString()}`);
        console.log(`     Time slots: ${booking.timeSlots.length}`);
        booking.timeSlots.forEach(slot => {
          console.log(`       - Slot ${slot.id}: isBooked=${slot.isBooked}`);
        });
      });
    } else {
      console.log('✅ No expired bookings awaiting cleanup');
    }
    
    // Check for time slots with expired bookings
    const slotsWithExpiredBookings = await prisma.tutorTimeSlot.findMany({
      where: {
        isBooked: true,
        booking: {
          status: 'AWAITING_PAYMENT',
          paymentStatus: 'PENDING',
          paymentExpiresAt: { lt: now }
        }
      },
      include: { booking: true }
    });
    
    if (slotsWithExpiredBookings.length > 0) {
      console.log(`❌ ISSUE: ${slotsWithExpiredBookings.length} time slots blocked by expired bookings`);
    } else {
      console.log('✅ No time slots blocked by expired bookings');
    }
    
    console.log('\n6️⃣ DATE/TIME HANDLING ANALYSIS:');
    console.log('='.repeat(40));
    
    // Test date conversion consistency
    const testDates = [
      '2025-08-09T15:00:00.000Z',
      '2025-08-09T15:00',
      new Date('2025-08-09T15:00:00.000Z')
    ];
    
    console.log('🧪 Testing date conversion consistency:');
    testDates.forEach((date, i) => {
      const converted = new Date(date);
      const dateOnly = new Date(converted.toISOString().split('T')[0] + 'T00:00:00.000Z');
      const timeOnly = converted.toISOString().slice(11, 19);
      
      console.log(`  ${i+1}. Input: ${date}`);
      console.log(`     Converted: ${converted.toISOString()}`);
      console.log(`     DateOnly: ${dateOnly.toISOString()}`);
      console.log(`     TimeOnly: ${timeOnly}`);
    });
    
    console.log('\n7️⃣ RECOMMENDATIONS:');
    console.log('='.repeat(40));
    
    const issues = [];
    
    if (inconsistentSlots.length > 0) {
      issues.push('Fix inconsistent time slot states');
    }
    
    if (orphanedBookings.length > 0) {
      issues.push('Handle orphaned bookings');
    }
    
    if (expiredBookings.length > 0) {
      issues.push('Expired bookings not being cleaned up - check cleanup service');
    }
    
    if (slotsWithExpiredBookings.length > 0) {
      issues.push('Time slots blocked by expired bookings - update cleanup logic');
    }
    
    if (issues.length > 0) {
      console.log('❌ ISSUES FOUND:');
      issues.forEach((issue, i) => {
        console.log(`  ${i+1}. ${issue}`);
      });
    } else {
      console.log('✅ No major issues detected in time slot logic');
    }
    
  } catch (error) {
    console.error('❌ Analysis Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveTimeslotAnalysis();
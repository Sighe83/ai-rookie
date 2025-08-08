const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function simpleAvailabilityDebug() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 SIMPLE B2C AVAILABILITY DEBUG');
    console.log('='.repeat(50));
    
    // Get a tutor to test with
    const tutor = await prisma.tutor.findFirst({
      include: { user: true }
    });
    
    if (!tutor) {
      console.log('❌ No tutors found');
      return;
    }
    
    console.log(`Testing with tutor: ${tutor.user.name} (${tutor.id})`);
    
    // Check current state of time slots
    console.log('\n1. CURRENT TIME SLOT STATE:');
    const allSlots = await prisma.tutorTimeSlot.findMany({
      where: { tutorId: tutor.id },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 10
    });
    
    console.log(`Found ${allSlots.length} time slots for this tutor:`);
    allSlots.forEach((slot, i) => {
      const date = slot.date.toISOString().split('T')[0];
      const time = slot.startTime.toISOString().slice(11, 19);
      console.log(`  ${i+1}. ${date} ${time} - Available: ${slot.isAvailable}, Booked: ${slot.isBooked}, BookingID: ${slot.bookingId || 'none'}`);
    });
    
    // Test what the availability API would return (BEFORE my fix)
    console.log('\n2. TESTING OLD API QUERY (without is_booked filter):');
    const oldQuery = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: tutor.id,
        isAvailable: true
        // Missing: isBooked: false
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 10
    });
    
    console.log(`Old query would return ${oldQuery.length} slots:`);
    oldQuery.forEach((slot, i) => {
      const date = slot.date.toISOString().split('T')[0];
      const time = slot.startTime.toISOString().slice(11, 19);
      const problem = slot.isBooked ? '❌ PROBLEM!' : '✅';
      console.log(`  ${i+1}. ${date} ${time} - Available: ${slot.isAvailable}, Booked: ${slot.isBooked} ${problem}`);
    });
    
    // Test what the availability API returns (AFTER my fix)
    console.log('\n3. TESTING NEW API QUERY (with is_booked filter):');
    const newQuery = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: tutor.id,
        isAvailable: true,
        isBooked: false // My fix
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 10
    });
    
    console.log(`New query returns ${newQuery.length} slots:`);
    newQuery.forEach((slot, i) => {
      const date = slot.date.toISOString().split('T')[0];
      const time = slot.startTime.toISOString().slice(11, 19);
      console.log(`  ${i+1}. ${date} ${time} - Available: ${slot.isAvailable}, Booked: ${slot.isBooked} ✅`);
    });
    
    // Check for specific awaiting payment bookings
    console.log('\n4. CHECKING AWAITING PAYMENT BOOKINGS:');
    const awaitingPayment = await prisma.booking.findMany({
      where: {
        tutorId: tutor.id,
        status: 'AWAITING_PAYMENT',
        paymentStatus: 'PENDING'
      },
      select: {
        id: true,
        selectedDateTime: true,
        paymentExpiresAt: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${awaitingPayment.length} awaiting payment bookings:`);
    const now = new Date();
    awaitingPayment.forEach((booking, i) => {
      const isExpired = booking.paymentExpiresAt < now;
      const minutesLeft = Math.ceil((booking.paymentExpiresAt - now) / (1000 * 60));
      console.log(`  ${i+1}. Booking ${booking.id}`);
      console.log(`      Time: ${booking.selectedDateTime.toISOString()}`);
      console.log(`      Expires: ${booking.paymentExpiresAt.toISOString()}`);
      console.log(`      Status: ${isExpired ? 'EXPIRED' : `${minutesLeft} min left`}`);
    });
    
    // FINAL CHECK: Are there any booked slots that would still be returned?
    console.log('\n5. FINAL CHECK - PROBLEMATIC SLOTS:');
    const problematicSlots = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: tutor.id,
        isAvailable: true,
        isBooked: true // These should NOT be returned by the API
      }
    });
    
    if (problematicSlots.length > 0) {
      console.log(`❌ FOUND ${problematicSlots.length} PROBLEMATIC SLOTS:`);
      console.log('These slots are Available=true AND Booked=true (should be hidden from B2C)');
      
      problematicSlots.forEach((slot, i) => {
        const date = slot.date.toISOString().split('T')[0];
        const time = slot.startTime.toISOString().slice(11, 19);
        console.log(`  ${i+1}. ${date} ${time} - BookingID: ${slot.bookingId}`);
      });
      
      console.log('\n✅ GOOD NEWS: My fix with .eq("is_booked", false) should exclude these');
      console.log('If B2C users can still see these, there might be a caching issue or the frontend is not updated');
      
    } else {
      console.log('✅ No problematic slots found');
      console.log('Either all booked slots are properly marked as unavailable, or there are no current bookings');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleAvailabilityDebug();
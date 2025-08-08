const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testExpiredBookingCleanup() {
  const prisma = new PrismaClient();
  try {
    console.log('🧪 TESTING EXPIRED BOOKING CLEANUP');
    console.log('='.repeat(50));
    
    // Find an available time slot
    const availableSlot = await prisma.tutorTimeSlot.findFirst({
      where: {
        isAvailable: true,
        isBooked: false
      }
    });
    
    if (!availableSlot) {
      console.log('❌ No available time slots found for testing');
      return;
    }
    
    console.log('📅 Using test slot:', {
      id: availableSlot.id,
      date: availableSlot.date.toISOString().split('T')[0],
      time: availableSlot.startTime.toISOString().slice(11,19)
    });
    
    // Create a test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test-cleanup@example.com' },
      update: {},
      create: {
        email: 'test-cleanup@example.com',
        name: 'Test Cleanup User',
        siteMode: 'B2C'
      }
    });
    
    // Find tutor and session for the slot
    const tutor = await prisma.tutor.findUnique({
      where: { id: availableSlot.tutorId }
    });
    
    const session = await prisma.session.findFirst({
      where: { tutorId: tutor.id, isActive: true }
    });
    
    // Create a booking that expires in the past (already expired)
    const expiredTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    
    const testBooking = await prisma.booking.create({
      data: {
        userId: testUser.id,
        tutorId: tutor.id,
        sessionId: session.id,
        format: 'INDIVIDUAL',
        selectedDateTime: new Date(availableSlot.date),
        participants: 1,
        totalPrice: session.price,
        siteMode: 'B2C',
        contactName: 'Test User',
        contactEmail: 'test-cleanup@example.com',
        status: 'AWAITING_PAYMENT',
        paymentStatus: 'PENDING',
        paymentExpiresAt: expiredTime  // Already expired!
      }
    });
    
    // Book the time slot
    await prisma.tutorTimeSlot.update({
      where: { id: availableSlot.id },
      data: {
        isBooked: true,
        bookingId: testBooking.id
      }
    });
    
    console.log('✅ Created test booking:', testBooking.id);
    console.log('✅ Booked time slot:', availableSlot.id);
    console.log('⏰ Booking expired at:', expiredTime.toISOString());
    
    // Check current state
    const bookedSlot = await prisma.tutorTimeSlot.findUnique({
      where: { id: availableSlot.id }
    });
    
    console.log('\n📊 CURRENT STATE:');
    console.log('  - Time slot isBooked:', bookedSlot.isBooked);
    console.log('  - Time slot bookingId:', bookedSlot.bookingId);
    
    // Wait for cleanup service to run (it runs every minute)
    console.log('\n⏳ Waiting 65 seconds for cleanup service to run...');
    await new Promise(resolve => setTimeout(resolve, 65000));
    
    // Check state after cleanup
    const cleanedSlot = await prisma.tutorTimeSlot.findUnique({
      where: { id: availableSlot.id }
    });
    
    const cleanedBooking = await prisma.booking.findUnique({
      where: { id: testBooking.id }
    });
    
    console.log('\n📊 STATE AFTER CLEANUP:');
    console.log('  - Time slot isBooked:', cleanedSlot.isBooked);
    console.log('  - Time slot bookingId:', cleanedSlot.bookingId);
    console.log('  - Booking status:', cleanedBooking.status);
    console.log('  - Booking paymentStatus:', cleanedBooking.paymentStatus);
    
    if (!cleanedSlot.isBooked && cleanedSlot.bookingId === null && cleanedBooking.status === 'CANCELLED') {
      console.log('\n🎉 SUCCESS: Expired booking was cleaned up and time slot is now available (ledig)!');
    } else {
      console.log('\n❌ FAILED: Cleanup did not work as expected');
    }
    
    // Cleanup test data
    await prisma.booking.delete({ where: { id: testBooking.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testExpiredBookingCleanup();
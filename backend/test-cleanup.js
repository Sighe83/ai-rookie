const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testCleanupLogic() {
  const prisma = new PrismaClient();
  try {
    console.log('🧪 TESTING CLEANUP LOGIC');
    console.log('='.repeat(50));
    
    // Check current expired bookings
    console.log('\n1️⃣ CHECKING FOR EXPIRED BOOKINGS:');
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'AWAITING_PAYMENT',
        paymentStatus: 'PENDING',
        paymentExpiresAt: {
          lt: new Date()
        }
      },
      include: {
        tutor: { include: { user: true } }
      }
    });
    
    console.log(`Found ${expiredBookings.length} expired bookings`);
    
    for (const booking of expiredBookings) {
      console.log(`📋 Booking ${booking.id}:`);
      console.log(`   - Tutor: ${booking.tutor.user.name}`);
      console.log(`   - Selected time: ${booking.selectedDateTime}`);
      console.log(`   - Expired at: ${booking.paymentExpiresAt}`);
      console.log(`   - Status: ${booking.status}`);
      
      // Check associated time slots
      const timeSlots = await prisma.tutorTimeSlot.findMany({
        where: { bookingId: booking.id }
      });
      
      console.log(`   - Associated time slots: ${timeSlots.length}`);
      timeSlots.forEach((slot, i) => {
        console.log(`     ${i+1}. Slot ${slot.id}: isBooked=${slot.isBooked}, bookingId=${slot.bookingId}`);
      });
    }
    
    // Check for bookings that should be expired but aren't cleaned up yet
    console.log('\n2️⃣ CHECKING TIME SLOTS THAT SHOULD BE FREED:');
    const blockedSlots = await prisma.tutorTimeSlot.findMany({
      where: {
        isBooked: true,
        booking: {
          status: 'AWAITING_PAYMENT',
          paymentStatus: 'PENDING',
          paymentExpiresAt: {
            lt: new Date()
          }
        }
      },
      include: {
        booking: true
      }
    });
    
    console.log(`Found ${blockedSlots.length} time slots that should be freed`);
    
    if (blockedSlots.length > 0) {
      console.log('❌ These time slots are still blocked by expired bookings:');
      blockedSlots.forEach((slot, i) => {
        console.log(`   ${i+1}. Slot ${slot.id}: ${slot.date.toISOString().split('T')[0]} ${slot.startTime.toISOString().slice(11,19)}`);
        console.log(`      Booking: ${slot.booking.id} (expired: ${slot.booking.paymentExpiresAt})`);
      });
    } else {
      console.log('✅ All expired bookings have been properly cleaned up');
    }
    
    // Show available slots
    console.log('\n3️⃣ CURRENT AVAILABLE TIME SLOTS:');
    const availableSlots = await prisma.tutorTimeSlot.findMany({
      where: {
        isAvailable: true,
        isBooked: false
      },
      take: 5,
      include: {
        tutor: { include: { user: true } }
      }
    });
    
    console.log(`Found ${availableSlots.length} available slots (showing first 5)`);
    availableSlots.forEach((slot, i) => {
      console.log(`   ${i+1}. ${slot.tutor.user.name}: ${slot.date.toISOString().split('T')[0]} ${slot.startTime.toISOString().slice(11,19)}-${slot.endTime.toISOString().slice(11,19)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCleanupLogic();
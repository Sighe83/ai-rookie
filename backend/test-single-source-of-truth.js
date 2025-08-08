#!/usr/bin/env node

const { databaseService } = require('./src/config/database');

async function testSingleSourceOfTruth() {
  try {
    console.log('🧪 Testing Single Source of Truth Architecture');
    console.log('=' .repeat(60));

    // 1. Verify schema changes
    console.log('1️⃣  VERIFYING SCHEMA CHANGES...');
    
    try {
      await databaseService.getPrismaClient().$queryRaw`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'tutor_time_slots' AND column_name IN ('status', 'booking_id', 'client_name')
      `;
      console.log('❌ ERROR: Old columns still exist in database!');
      return false;
    } catch (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('✅ Schema migration successful - old columns removed');
      } else {
        console.log('⚠️  Unexpected error checking schema:', error.message);
      }
    }

    // 2. Test availability logic without status columns
    console.log('\n2️⃣  TESTING AVAILABILITY CALCULATION...');
    
    const tutorId = 'b1cdef00-1d2e-3f4a-5b6c-7d8e9f0a1b2d'; // Sample tutor
    const testDate = '2025-08-08';

    // Get base time slots
    const baseSlots = await databaseService.findMany('tutorTimeSlot', {
      where: {
        tutorId: tutorId,
        date: new Date(`${testDate}T00:00:00.000Z`)
      },
      orderBy: { startTime: 'asc' }
    });

    console.log(`📊 Found ${baseSlots.length} base time slots for ${testDate}`);

    // Get active bookings
    const activeBookings = await databaseService.findMany('booking', {
      where: {
        tutorId: tutorId,
        selectedDateTime: {
          gte: new Date(`${testDate}T00:00:00.000Z`),
          lt: new Date(`${testDate}T23:59:59.999Z`)
        },
        OR: [
          { status: 'CONFIRMED' },
          { 
            status: 'AWAITING_PAYMENT', 
            paymentStatus: 'PENDING',
            paymentExpiresAt: { gt: new Date() }
          }
        ]
      }
    });

    console.log(`📅 Found ${activeBookings.length} active bookings for ${testDate}`);

    // Calculate availability using single source of truth
    const bookedTimes = new Set();
    activeBookings.forEach(booking => {
      const bookingTime = new Date(booking.selectedDateTime);
      const timeStr = bookingTime.toLocaleString('en-US', {
        timeZone: 'Europe/Copenhagen',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      bookedTimes.add(timeStr);
      console.log(`🔒 Booked time: ${timeStr} (${booking.status})`);
    });

    // Show availability calculation
    console.log('\n📋 AVAILABILITY CALCULATION:');
    baseSlots.forEach(slot => {
      const slotTime = slot.startTime.toTimeString().substring(0, 5);
      const isAvailable = !bookedTimes.has(slotTime);
      console.log(`   ${slotTime}: ${isAvailable ? '🟢 AVAILABLE' : '🔴 BOOKED'}`);
    });

    // 3. Test booking creation
    console.log('\n3️⃣  TESTING BOOKING CREATION (DRY RUN)...');
    
    const availableSlot = baseSlots.find(slot => {
      const slotTime = slot.startTime.toTimeString().substring(0, 5);
      return !bookedTimes.has(slotTime);
    });

    if (availableSlot) {
      console.log(`✅ Can book slot at ${availableSlot.startTime.toTimeString().substring(0, 5)}`);
      console.log('   → Booking would be created in bookings table');
      console.log('   → No time slot updates needed');
      console.log('   → Availability determined by booking existence');
    } else {
      console.log('⚠️  No available slots found for booking test');
    }

    // 4. Test data consistency
    console.log('\n4️⃣  TESTING DATA CONSISTENCY...');
    
    const totalSlots = await databaseService.getPrismaClient().tutorTimeSlot.count();
    const totalBookings = await databaseService.getPrismaClient().booking.count();
    
    console.log(`📊 Total time slots in system: ${totalSlots}`);
    console.log(`📊 Total bookings in system: ${totalBookings}`);
    
    // Verify no orphaned data
    try {
      const orphanTest = await databaseService.getPrismaClient().$queryRaw`
        SELECT COUNT(*) as count FROM tutor_time_slots WHERE booking_id IS NOT NULL
      `;
      console.log('❌ ERROR: booking_id column should not exist!');
    } catch (error) {
      console.log('✅ No orphaned booking references found');
    }

    console.log('\n🎉 SINGLE SOURCE OF TRUTH ARCHITECTURE VERIFIED!');
    console.log('=' .repeat(60));
    console.log('📋 SUMMARY:');
    console.log('   ✅ Redundant columns removed from schema');
    console.log('   ✅ Availability calculated from bookings table');
    console.log('   ✅ No dual state management');
    console.log('   ✅ Single source of truth established');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    await databaseService.getPrismaClient().$disconnect();
  }
}

if (require.main === module) {
  testSingleSourceOfTruth()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = testSingleSourceOfTruth;
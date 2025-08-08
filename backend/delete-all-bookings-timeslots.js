const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function deleteAllBookingsAndTimeslots() {
  const prisma = new PrismaClient();
  try {
    console.log('🗑️  DELETING ALL BOOKINGS AND TIME SLOTS');
    console.log('='.repeat(50));
    
    // Count existing records first
    const bookingCount = await prisma.booking.count();
    const timeslotCount = await prisma.tutorTimeSlot.count();
    
    console.log(`📊 Current counts:`);
    console.log(`   Bookings: ${bookingCount}`);
    console.log(`   Time slots: ${timeslotCount}`);
    
    if (bookingCount === 0 && timeslotCount === 0) {
      console.log('✅ Database is already clean - no records to delete');
      return;
    }
    
    console.log('\n🔥 Starting deletion...');
    
    // Delete bookings first (due to foreign key constraints)
    console.log('\n1️⃣ Deleting all bookings...');
    const deletedBookings = await prisma.booking.deleteMany({});
    console.log(`✅ Deleted ${deletedBookings.count} bookings`);
    
    // Delete time slots
    console.log('\n2️⃣ Deleting all time slots...');
    const deletedTimeslots = await prisma.tutorTimeSlot.deleteMany({});
    console.log(`✅ Deleted ${deletedTimeslots.count} time slots`);
    
    // Verify deletion
    const remainingBookings = await prisma.booking.count();
    const remainingTimeslots = await prisma.tutorTimeSlot.count();
    
    console.log('\n📊 Final counts:');
    console.log(`   Bookings: ${remainingBookings}`);
    console.log(`   Time slots: ${remainingTimeslots}`);
    
    if (remainingBookings === 0 && remainingTimeslots === 0) {
      console.log('\n🎉 SUCCESS: All bookings and time slots have been deleted!');
      console.log('✅ Database is now clean and ready for new tests');
    } else {
      console.log('\n❌ WARNING: Some records may still remain');
    }
    
  } catch (error) {
    console.error('❌ Error deleting records:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllBookingsAndTimeslots();
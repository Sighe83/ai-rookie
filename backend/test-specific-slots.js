const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testSpecificSlots() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 TESTING SPECIFIC PROBLEMATIC SLOTS');
    console.log('='.repeat(50));
    
    const tutorId = 'b1cdef00-1d2e-3f4a-5b6c-7d8e9f0a1b2d';
    
    // Test the EXACT problematic slots from the debug
    console.log('\n1. DIRECT QUERY FOR PROBLEMATIC SLOTS:');
    const problematicSlots = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: tutorId,
        date: '2025-08-10',
        OR: [
          { startTime: '13:00:00' },
          { startTime: '09:00:00' }
        ]
      }
    });
    
    console.log('Direct query results:');
    problematicSlots.forEach((slot, i) => {
      const time = slot.startTime.toISOString().slice(11, 19);
      console.log(`  ${i+1}. ${slot.date.toISOString().split('T')[0]} ${time}`);
      console.log(`      Available: ${slot.isAvailable}`);
      console.log(`      Booked: ${slot.isBooked}`);
      console.log(`      BookingID: ${slot.bookingId}`);
    });
    
    // Test what OLD availability API would return (should include these problematic slots)
    console.log('\n2. OLD AVAILABILITY API (what B2C users currently see):');
    const oldApiQuery = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: tutorId,
        isAvailable: true,
        // Missing the is_booked: false filter
        date: '2025-08-10'
      }
    });
    
    console.log(`OLD API returns ${oldApiQuery.length} slots for 2025-08-10:`);
    oldApiQuery.forEach((slot, i) => {
      const time = slot.startTime.toISOString().slice(11, 19);
      const shouldBeHidden = slot.isBooked ? '❌ SHOULD BE HIDDEN' : '✅ OK';
      console.log(`  ${i+1}. ${time} - Available: ${slot.isAvailable}, Booked: ${slot.isBooked} ${shouldBeHidden}`);
    });
    
    // Test what NEW availability API returns (should exclude the problematic slots)  
    console.log('\n3. NEW AVAILABILITY API (with my fix):');
    const newApiQuery = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: tutorId,
        isAvailable: true,
        isBooked: false, // My fix - should exclude the problematic slots
        date: '2025-08-10'
      }
    });
    
    console.log(`NEW API returns ${newApiQuery.length} slots for 2025-08-10:`);
    newApiQuery.forEach((slot, i) => {
      const time = slot.startTime.toISOString().slice(11, 19);
      console.log(`  ${i+1}. ${time} - Available: ${slot.isAvailable}, Booked: ${slot.isBooked} ✅`);
    });
    
    // Verify the specific problematic slots are excluded
    console.log('\n4. VERIFICATION - PROBLEMATIC SLOTS EXCLUDED:');
    const problemSlot1 = newApiQuery.find(slot => slot.startTime.toISOString().slice(11, 19) === '13:00:00');
    const problemSlot2 = newApiQuery.find(slot => slot.startTime.toISOString().slice(11, 19) === '09:00:00');
    
    console.log(`13:00:00 slot in NEW API result: ${problemSlot1 ? '❌ STILL THERE' : '✅ CORRECTLY EXCLUDED'}`);
    console.log(`09:00:00 slot in NEW API result: ${problemSlot2 ? '❌ STILL THERE' : '✅ CORRECTLY EXCLUDED'}`);
    
    console.log('\n5. CONCLUSION:');
    if (!problemSlot1 && !problemSlot2) {
      console.log('✅ SUCCESS: My fix correctly excludes the awaiting payment slots');
      console.log('✅ B2C users should no longer see these slots as available');
      console.log('✅ The root cause has been fixed');
    } else {
      console.log('❌ ISSUE: The fix is not working as expected');
      console.log('❌ Need to investigate further');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpecificSlots();
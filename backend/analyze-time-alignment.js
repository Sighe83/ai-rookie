const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function analyzeTimeAlignment() {
  const prisma = new PrismaClient();
  try {
    console.log('🕐 ANALYZING TIME ALIGNMENT BETWEEN USER AND TUTOR SIDES');
    console.log('='.repeat(70));
    
    // Get some time slots to analyze
    const timeSlots = await prisma.tutorTimeSlot.findMany({
      where: { isAvailable: true },
      take: 5,
      include: {
        tutor: { include: { user: true } }
      }
    });
    
    console.log('📅 CURRENT TIME SLOTS IN DATABASE:');
    timeSlots.forEach((slot, i) => {
      const date = slot.date.toISOString().split('T')[0];
      const startTime = slot.startTime.toISOString();
      const endTime = slot.endTime.toISOString();
      
      console.log(`  ${i+1}. Tutor: ${slot.tutor.user.name}`);
      console.log(`     Date: ${date}`);
      console.log(`     Start Time (Raw): ${startTime}`);
      console.log(`     End Time (Raw): ${endTime}`);
      console.log(`     Start Time (Display): ${slot.startTime.toISOString().slice(11, 19)}`);
      console.log(`     End Time (Display): ${slot.endTime.toISOString().slice(11, 19)}`);
      console.log('');
    });
    
    console.log('🔍 TIME ZONE ANALYSIS:');
    console.log('='.repeat(40));
    
    const now = new Date();
    const denmarkTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Copenhagen"}));
    const utcTime = new Date(now.toISOString());
    
    console.log(`Current UTC time: ${utcTime.toISOString()}`);
    console.log(`Current Denmark time: ${denmarkTime.toISOString()}`);
    console.log(`Time zone offset: ${now.getTimezoneOffset()} minutes`);
    console.log(`Denmark is UTC${denmarkTime.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(denmarkTime.getTimezoneOffset()/60)}`);
    
    console.log('\n🧪 TESTING TIME CONVERSION SCENARIOS:');
    console.log('='.repeat(40));
    
    // Test scenario: User selects 14:00 Denmark time
    const userSelection = '2025-08-07T14:00';  // This is what frontend typically sends
    const userSelectionWithTZ = '2025-08-07T14:00:00+02:00';  // Denmark summer time
    const userSelectionUTC = '2025-08-07T14:00:00Z';  // UTC
    
    console.log('Scenario: User selects 14:00 Denmark time');
    console.log(`  Frontend sends: "${userSelection}"`);
    console.log(`  Converted by new Date(): ${new Date(userSelection).toISOString()}`);
    console.log(`  With timezone: "${userSelectionWithTZ}"`);
    console.log(`  Converted: ${new Date(userSelectionWithTZ).toISOString()}`);
    console.log(`  As UTC: "${userSelectionUTC}"`);
    console.log(`  Converted: ${new Date(userSelectionUTC).toISOString()}`);
    
    console.log('\n📊 DATABASE TIME SLOT MATCHING LOGIC:');
    console.log('='.repeat(40));
    
    if (timeSlots.length > 0) {
      const testSlot = timeSlots[0];
      console.log(`Testing with slot: ${testSlot.startTime.toISOString().slice(11,19)}-${testSlot.endTime.toISOString().slice(11,19)}`);
      
      // Test different time inputs
      const testInputs = [
        '2025-08-07T14:00',           // No timezone (local interpretation)
        '2025-08-07T14:00:00Z',       // UTC
        '2025-08-07T14:00:00+02:00',  // Denmark summer time
        '2025-08-07T12:00:00Z'        // 14:00 Denmark = 12:00 UTC
      ];
      
      testInputs.forEach((input, i) => {
        const converted = new Date(input);
        const timeOnly = converted.toISOString().slice(11, 19);
        const slotStart = testSlot.startTime.toISOString().slice(11, 19);
        const slotEnd = testSlot.endTime.toISOString().slice(11, 19);
        const matches = timeOnly >= slotStart && timeOnly < slotEnd;
        
        console.log(`  ${i+1}. Input: "${input}"`);
        console.log(`      Converts to: ${converted.toISOString()}`);
        console.log(`      Time only: ${timeOnly}`);
        console.log(`      Matches slot (${slotStart}-${slotEnd}): ${matches ? '✅' : '❌'}`);
      });
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('='.repeat(40));
    
    console.log('1. Frontend should send times in consistent timezone');
    console.log('2. Backend should handle timezone conversion explicitly');
    console.log('3. Display times should match user\'s local timezone');
    console.log('4. Database stores times in UTC but needs proper conversion logic');
    
    console.log('\n💡 POTENTIAL ISSUES:');
    console.log('- Frontend might display 14:00 Denmark time');
    console.log('- But sends 14:00 without timezone (gets interpreted as local server time)');
    console.log('- Backend stores/compares in UTC');
    console.log('- Time slots created in UTC might not align with user expectations');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeTimeAlignment();
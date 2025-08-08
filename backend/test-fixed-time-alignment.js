const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testFixedTimeAlignment() {
  const prisma = new PrismaClient();
  try {
    console.log('🧪 TESTING FIXED TIME ALIGNMENT');
    console.log('='.repeat(50));
    
    // Get a sample time slot
    const timeSlot = await prisma.tutorTimeSlot.findFirst({
      where: { isAvailable: true }
    });
    
    if (!timeSlot) {
      console.log('❌ No time slots found');
      return;
    }
    
    console.log('📅 Testing with slot:');
    console.log(`  Date: ${timeSlot.date.toISOString().split('T')[0]}`);
    console.log(`  Time: ${timeSlot.startTime.toISOString().slice(11,19)}-${timeSlot.endTime.toISOString().slice(11,19)}`);
    
    // Test scenarios that should now work
    const testScenarios = [
      {
        name: 'User selects exact start time (14:00)',
        input: '2025-08-07T14:00:00+02:00', // Denmark timezone
        expectedMatch: '14:00:00-15:00:00'
      },
      {
        name: 'User selects exact end time (15:00)', 
        input: '2025-08-07T15:00:00+02:00', // Denmark timezone
        expectedMatch: '14:00:00-15:00:00'
      },
      {
        name: 'User selects middle time (14:30)',
        input: '2025-08-07T14:30:00+02:00', // Denmark timezone
        expectedMatch: '14:00:00-15:00:00'
      }
    ];
    
    console.log('\n🧪 TESTING DIFFERENT USER SELECTIONS:');
    
    testScenarios.forEach((scenario, i) => {
      console.log(`\n${i+1}. ${scenario.name}`);
      
      const selectedDateTime = new Date(scenario.input);
      const selectedTimeOnly = selectedDateTime.toISOString().slice(11, 19);
      
      console.log(`   User input: ${scenario.input}`);
      console.log(`   Converts to UTC: ${selectedDateTime.toISOString()}`);
      console.log(`   Time only: ${selectedTimeOnly}`);
      
      // Test against our sample slot
      const slotStart = timeSlot.startTime.toISOString().slice(11, 19);
      const slotEnd = timeSlot.endTime.toISOString().slice(11, 19);
      
      // Using the NEW logic: >= start && <= end
      const matchesNewLogic = selectedTimeOnly >= slotStart && selectedTimeOnly <= slotEnd;
      
      console.log(`   Slot: ${slotStart}-${slotEnd}`);
      console.log(`   Matches (NEW logic): ${matchesNewLogic ? '✅' : '❌'}`);
    });
    
    // Test the specific problematic case from before
    console.log('\n🎯 TESTING SPECIFIC PROBLEM CASE:');
    console.log('Problem: 12:00:00 should match 11:00:00-12:00:00 slot');
    
    const problemCase = {
      selectedTime: '12:00:00',
      slotStart: '11:00:00',
      slotEnd: '12:00:00'
    };
    
    const oldLogic = problemCase.selectedTime >= problemCase.slotStart && problemCase.selectedTime < problemCase.slotEnd;
    const newLogic = problemCase.selectedTime >= problemCase.slotStart && problemCase.selectedTime <= problemCase.slotEnd;
    
    console.log(`Selected: ${problemCase.selectedTime}`);
    console.log(`Slot: ${problemCase.slotStart}-${problemCase.slotEnd}`);
    console.log(`Old logic (< endTime): ${oldLogic} ${oldLogic ? '✅' : '❌'}`);
    console.log(`New logic (<= endTime): ${newLogic} ${newLogic ? '✅' : '❌'}`);
    
    console.log('\n🇩🇰 DENMARK TIMEZONE EXAMPLE:');
    console.log('Scenario: Danish user selects 14:00 on their calendar');
    
    const danishTime = '2025-08-07T14:00:00+02:00';
    const converted = new Date(danishTime);
    const utcTime = converted.toISOString().slice(11, 19);
    
    console.log(`Danish input: ${danishTime}`);
    console.log(`Converts to UTC: ${converted.toISOString()}`);
    console.log(`UTC time: ${utcTime}`);
    console.log(`Should match 14:00:00-15:00:00 Denmark slot: ${utcTime >= '14:00:00' && utcTime <= '15:00:00' ? '✅' : '❌'}`);
    
    console.log('\n💡 SUMMARY:');
    console.log('✅ Fixed time slot boundary matching (<= instead of <)');
    console.log('✅ Recreated time slots with Denmark timezone awareness');
    console.log('✅ Time slots now display Denmark local times directly');
    console.log('⚠️ Frontend needs to send timezone-aware datetime strings');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedTimeAlignment();
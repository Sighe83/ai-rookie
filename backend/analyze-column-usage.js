const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function analyzeColumnUsage() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 ANALYZING is_available vs is_booked COLUMN USAGE');
    console.log('='.repeat(60));
    
    // Get all time slots to analyze the current state
    const allSlots = await prisma.tutorTimeSlot.findMany({
      take: 100,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });
    
    console.log(`\n📊 ANALYZING ${allSlots.length} TIME SLOTS:`);
    console.log('-'.repeat(40));
    
    // Categorize slots by their state combinations
    const categories = {
      available_not_booked: 0,    // is_available: true, is_booked: false
      available_booked: 0,        // is_available: true, is_booked: true (PROBLEMATIC)
      unavailable_not_booked: 0,  // is_available: false, is_booked: false
      unavailable_booked: 0       // is_available: false, is_booked: true
    };
    
    const examples = {
      available_not_booked: [],
      available_booked: [],
      unavailable_not_booked: [],
      unavailable_booked: []
    };
    
    allSlots.forEach(slot => {
      const key = `${slot.isAvailable ? 'available' : 'unavailable'}_${slot.isBooked ? 'booked' : 'not_booked'}`;
      categories[key]++;
      
      if (examples[key].length < 3) {
        const date = slot.date.toISOString().split('T')[0];
        const time = slot.startTime.toISOString().slice(11, 19);
        examples[key].push({
          date,
          time,
          bookingId: slot.bookingId
        });
      }
    });
    
    console.log('STATE COMBINATIONS:');
    Object.entries(categories).forEach(([key, count]) => {
      const percentage = ((count / allSlots.length) * 100).toFixed(1);
      console.log(`  ${key.replace(/_/g, ' ')}: ${count} slots (${percentage}%)`);
      
      if (examples[key].length > 0) {
        console.log(`    Examples:`);
        examples[key].forEach(ex => {
          console.log(`      - ${ex.date} ${ex.time}${ex.bookingId ? ` (booking: ${ex.bookingId.substring(0, 8)}...)` : ''}`);
        });
      }
    });
    
    console.log('\n🎯 ANALYSIS:');
    console.log('-'.repeat(20));
    
    if (categories.available_booked > 0) {
      console.log(`❌ FOUND ${categories.available_booked} CONTRADICTORY SLOTS:`);
      console.log('   These slots are marked as AVAILABLE but also BOOKED');
      console.log('   This creates confusion and the current bug!');
    }
    
    if (categories.unavailable_booked > 0) {
      console.log(`⚠️  FOUND ${categories.unavailable_booked} UNAVAILABLE+BOOKED SLOTS:`);
      console.log('   These might be correctly blocked slots');
    }
    
    console.log('\n💡 PROPOSED SIMPLIFICATION:');
    console.log('-'.repeat(30));
    console.log('Instead of two confusing boolean columns, use ONE status enum:');
    console.log('');
    console.log('enum TimeSlotStatus {');
    console.log('  AVAILABLE     // Free for booking');
    console.log('  BOOKED        // Has confirmed booking');
    console.log('  PENDING       // Has awaiting payment booking');
    console.log('  UNAVAILABLE   // Tutor blocked this time');
    console.log('}');
    
    console.log('\n📋 CURRENT MAPPING:');
    console.log('  is_available: true,  is_booked: false  → AVAILABLE');
    console.log('  is_available: true,  is_booked: true   → PENDING (awaiting payment)');
    console.log('  is_available: false, is_booked: false  → UNAVAILABLE');
    console.log('  is_available: false, is_booked: true   → BOOKED (confirmed)');
    
    console.log('\n🔧 MIGRATION STRATEGY:');
    console.log('1. Add new "status" column with enum');
    console.log('2. Migrate existing data based on current combinations');
    console.log('3. Update all queries to use single status field');
    console.log('4. Remove old is_available and is_booked columns');
    
    console.log('\n✅ BENEFITS:');
    console.log('- Eliminates confusion between two boolean fields');
    console.log('- Makes queries simpler: WHERE status = "AVAILABLE"');
    console.log('- Clearer business logic and easier to understand');
    console.log('- Prevents contradictory states');
    console.log('- Better performance (single column index)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeColumnUsage();
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function runStatusMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 RUNNING TIME SLOT STATUS MIGRATION');
    console.log('='.repeat(50));
    
    console.log('\n1. CHECKING CURRENT STATE:');
    const beforeCount = await prisma.tutorTimeSlot.count();
    console.log(`Total time slots: ${beforeCount}`);
    
    // Check current combinations
    const combinations = await prisma.$queryRaw`
      SELECT 
        is_available, 
        is_booked, 
        COUNT(*) as count 
      FROM tutor_time_slots 
      GROUP BY is_available, is_booked 
      ORDER BY is_available, is_booked
    `;
    
    console.log('Current boolean combinations:');
    combinations.forEach(row => {
      console.log(`  is_available: ${row.is_available}, is_booked: ${row.is_booked} = ${row.count} slots`);
    });
    
    console.log('\n2. RUNNING MIGRATION SQL:');
    
    // Step 1: Create enum type
    console.log('Creating enum type...');
    await prisma.$executeRaw`CREATE TYPE time_slot_status AS ENUM ('AVAILABLE', 'BOOKED', 'PENDING', 'UNAVAILABLE')`;
    
    // Step 2: Add status column
    console.log('Adding status column...');
    await prisma.$executeRaw`ALTER TABLE tutor_time_slots ADD COLUMN status time_slot_status`;
    
    // Step 3: Migrate data
    console.log('Migrating existing data...');
    await prisma.$executeRaw`
      UPDATE tutor_time_slots 
      SET status = CASE 
        WHEN is_available = true AND is_booked = false THEN 'AVAILABLE'::time_slot_status
        WHEN is_available = true AND is_booked = true THEN 'PENDING'::time_slot_status
        WHEN is_available = false AND is_booked = false THEN 'UNAVAILABLE'::time_slot_status
        WHEN is_available = false AND is_booked = true THEN 'BOOKED'::time_slot_status
        ELSE 'AVAILABLE'::time_slot_status
      END
    `;
    
    // Step 4: Make NOT NULL
    console.log('Making status column NOT NULL...');
    await prisma.$executeRaw`ALTER TABLE tutor_time_slots ALTER COLUMN status SET NOT NULL`;
    
    // Step 5: Set default
    console.log('Setting default value...');
    await prisma.$executeRaw`ALTER TABLE tutor_time_slots ALTER COLUMN status SET DEFAULT 'AVAILABLE'::time_slot_status`;
    
    // Step 6: Create indexes
    console.log('Creating indexes...');
    await prisma.$executeRaw`CREATE INDEX idx_tutor_time_slots_status ON tutor_time_slots(status)`;
    await prisma.$executeRaw`CREATE INDEX idx_tutor_time_slots_tutor_status ON tutor_time_slots(tutor_id, status)`;
    await prisma.$executeRaw`CREATE INDEX idx_tutor_time_slots_date_status ON tutor_time_slots(date, status)`;
    
    // Step 7: Drop old index
    console.log('Dropping old composite index...');
    try {
      await prisma.$executeRaw`DROP INDEX IF EXISTS "tutor_time_slots_isAvailable_isBooked_idx"`;
    } catch (e) {
      console.log('  (Old index may not exist, continuing...)');
    }
    
    // Step 8: Add consistency constraint
    console.log('Adding consistency constraint...');
    await prisma.$executeRaw`
      ALTER TABLE tutor_time_slots
      ADD CONSTRAINT chk_booking_id_consistency 
      CHECK (
        (status IN ('PENDING', 'BOOKED') AND booking_id IS NOT NULL) OR
        (status IN ('AVAILABLE', 'UNAVAILABLE') AND booking_id IS NULL)
      )
    `;
    
    // Step 9: Remove old columns
    console.log('Removing old boolean columns...');
    await prisma.$executeRaw`ALTER TABLE tutor_time_slots DROP COLUMN is_available, DROP COLUMN is_booked`;
    
    console.log('\n3. VERIFYING MIGRATION RESULTS:');
    
    const statusCounts = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM tutor_time_slots 
      GROUP BY status 
      ORDER BY status
    `;
    
    console.log('New status distribution:');
    statusCounts.forEach(row => {
      console.log(`  ${row.status}: ${row.count} slots`);
    });
    
    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('🔄 Now run: npx prisma generate');
    console.log('🔄 And restart your application');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('You may need to manually clean up any partial changes');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runStatusMigration();
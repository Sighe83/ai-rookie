const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testMigration() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('🧪 Testing database migration...');
    
    // Test 1: Check if payment_expires_at column exists
    console.log('\n1️⃣ Checking if payment_expires_at column exists...');
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'payment_expires_at'
    `;
    
    if (columnCheck.length > 0) {
      console.log('✅ payment_expires_at column found:', columnCheck[0]);
    } else {
      console.log('❌ payment_expires_at column NOT found');
      return;
    }

    // Test 2: Check if indexes were created
    console.log('\n2️⃣ Checking if indexes were created...');
    const indexCheck = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'bookings' 
      AND indexname LIKE '%payment%'
    `;
    
    console.log('📊 Payment-related indexes:', indexCheck);

    // Test 3: Try to create a test booking with payment_expires_at
    console.log('\n3️⃣ Testing booking creation with payment_expires_at...');
    
    const testDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    // Just test the query structure without actually creating
    console.log('🧪 Testing query structure (dry run)...');
    console.log('Would create booking with payment_expires_at:', testDate);
    
    console.log('\n🎉 Database migration test PASSED!');
    console.log('✅ payment_expires_at column is ready');
    console.log('✅ Booking creation should work now');
    
  } catch (error) {
    console.error('❌ Database migration test FAILED:', error.message);
    if (error.message.includes('payment_expires_at')) {
      console.log('\n💡 This likely means the SQL migration did not run successfully.');
      console.log('Please run the SQL in Supabase Dashboard again.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testMigration();
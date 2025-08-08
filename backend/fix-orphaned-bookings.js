const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function fixOrphanedBookings() {
  const prisma = new PrismaClient();
  try {
    console.log('🔧 FIXING ORPHANED BOOKINGS');
    console.log('='.repeat(50));
    
    // Get all orphaned bookings (bookings without time slots)
    const orphanedBookings = await prisma.booking.findMany({
      where: {
        AND: [
          { status: { not: 'CANCELLED' } },
          {
            timeSlots: {
              none: {}  // No associated time slots
            }
          }
        ]
      },
      include: {
        tutor: { include: { user: true } }
      }
    });
    
    console.log(`Found ${orphanedBookings.length} orphaned bookings to fix`);
    
    if (orphanedBookings.length === 0) {
      console.log('✅ No orphaned bookings to fix');
      return;
    }
    
    console.log('\n📋 Orphaned bookings:');
    orphanedBookings.forEach((booking, i) => {
      console.log(`  ${i+1}. ${booking.id}: ${booking.status} - ${booking.selectedDateTime} (${booking.tutor.user.name})`);
    });
    
    console.log('\n🛠️ FIXING OPTIONS:');
    console.log('  A) Cancel all orphaned bookings (safest)');
    console.log('  B) Try to match them with available time slots');
    console.log('  C) Just report (no changes)');
    
    // For safety, let's cancel all orphaned bookings since we can't reliably determine
    // which time slots they should have reserved
    console.log('\n🔄 Cancelling all orphaned bookings...');
    
    for (const booking of orphanedBookings) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          notes: (booking.notes || '') + ' [Auto-cancelled: orphaned booking without time slot]'
        }
      });
      
      console.log(`✅ Cancelled booking ${booking.id}`);
    }
    
    console.log(`\n🎉 Successfully cancelled ${orphanedBookings.length} orphaned bookings`);
    
    // Verify the fix
    const remainingOrphaned = await prisma.booking.count({
      where: {
        AND: [
          { status: { not: 'CANCELLED' } },
          {
            timeSlots: {
              none: {}
            }
          }
        ]
      }
    });
    
    console.log(`\n📊 Remaining orphaned bookings: ${remainingOrphaned}`);
    
    if (remainingOrphaned === 0) {
      console.log('✅ All orphaned bookings have been resolved');
    } else {
      console.log('❌ Some orphaned bookings still remain');
    }
    
  } catch (error) {
    console.error('❌ Error fixing orphaned bookings:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrphanedBookings();
/**
 * Migration script to update existing data to comply with new session business logic
 * 
 * This script:
 * 1. Updates all sessions to have 60-minute duration
 * 2. Rounds existing booking times to the nearest hour
 * 3. Updates availability time slots to hour-based format
 */

const { PrismaClient } = require('@prisma/client');
const SessionService = require('./src/services/sessionService');

const prisma = new PrismaClient();

async function migrateSessionData() {
  console.log('🔄 Starting session data migration...');
  
  try {
    // 1. Update all sessions to have 60-minute duration
    console.log('📝 Updating session durations...');
    const sessionUpdate = await prisma.session.updateMany({
      data: {
        duration: SessionService.SESSION_DURATION_MINUTES
      }
    });
    console.log(`✅ Updated ${sessionUpdate.count} sessions to 60-minute duration`);

    // 2. Update booking times to be on the hour
    console.log('📅 Updating booking times...');
    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        selectedDateTime: true
      }
    });

    let updatedBookings = 0;
    for (const booking of bookings) {
      const currentTime = new Date(booking.selectedDateTime);
      const roundedTime = SessionService.roundToHourStart(currentTime);
      
      // Only update if the time was actually rounded
      if (currentTime.getTime() !== roundedTime.getTime()) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { selectedDateTime: roundedTime }
        });
        updatedBookings++;
        console.log(`   📍 Rounded booking ${booking.id}: ${currentTime.toISOString()} -> ${roundedTime.toISOString()}`);
      }
    }
    console.log(`✅ Updated ${updatedBookings} bookings to hour-based times`);

    // 3. Update availability time slots to new format
    console.log('🗓️  Updating availability time slots...');
    const availabilities = await prisma.tutorAvailability.findMany();
    
    let updatedAvailabilities = 0;
    for (const availability of availabilities) {
      const timeSlots = Array.isArray(availability.timeSlots) ? availability.timeSlots : [];
      let needsUpdate = false;
      
      const updatedSlots = timeSlots.map(slot => {
        // Handle both old format (startTime/endTime) and new format (time)
        if (slot.startTime && !slot.time) {
          needsUpdate = true;
          const hour = parseInt(slot.startTime.split(':')[0]);
          return {
            time: `${hour.toString().padStart(2, '0')}:00`,
            available: slot.available !== false,
            booked: slot.booked || slot.isBooked || false
          };
        } else if (slot.time) {
          // Ensure time is on the hour
          const [hour] = slot.time.split(':');
          const hourOnTime = `${hour.padStart(2, '0')}:00`;
          if (slot.time !== hourOnTime) {
            needsUpdate = true;
            return {
              ...slot,
              time: hourOnTime
            };
          }
        }
        return slot;
      }).filter(slot => {
        // Remove slots outside business hours
        if (slot.time) {
          const hour = parseInt(slot.time.split(':')[0]);
          return hour >= 8 && hour <= 17 && hour !== 12; // Business hours, no lunch
        }
        return true;
      });

      if (needsUpdate) {
        await prisma.tutorAvailability.update({
          where: { id: availability.id },
          data: { timeSlots: updatedSlots }
        });
        updatedAvailabilities++;
        console.log(`   🕐 Updated availability for tutor ${availability.tutorId} on ${availability.date}`);
      }
    }
    console.log(`✅ Updated ${updatedAvailabilities} availability records`);

    // 4. Validate migrated data
    console.log('🔍 Validating migrated data...');
    
    // Check sessions
    const invalidSessions = await prisma.session.findMany({
      where: {
        duration: {
          not: 60
        }
      }
    });
    if (invalidSessions.length > 0) {
      console.log(`⚠️  Found ${invalidSessions.length} sessions with non-60-minute duration`);
    } else {
      console.log('✅ All sessions have 60-minute duration');
    }

    // Check bookings
    const allBookings = await prisma.booking.findMany();
    const invalidBookings = allBookings.filter(booking => {
      const date = new Date(booking.selectedDateTime);
      return date.getMinutes() !== 0 || date.getSeconds() !== 0;
    });
    if (invalidBookings.length > 0) {
      console.log(`⚠️  Found ${invalidBookings.length} bookings with non-hour start times`);
    } else {
      console.log('✅ All bookings start on the hour');
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateSessionData()
    .then(() => {
      console.log('✨ Session data migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateSessionData;

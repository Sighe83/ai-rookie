const express = require('express');
const { databaseService } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/availability/:tutorId - Get tutor availability for a date range
router.get('/:tutorId', optionalAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to next 14 days if no date range provided
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Validate tutor exists
    const tutor = await databaseService.findUnique('tutor', {
      where: { id: tutorId, isActive: true }
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: 'Tutor not found'
      });
    }

    // Get all base time slots for this tutor in the date range
    const baseTimeSlots = await databaseService.findMany('tutorTimeSlot', {
      where: {
        tutorId: tutorId,
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Get all active bookings for this tutor in the date range
    const activeBookings = await databaseService.findMany('booking', {
      where: {
        tutorId: tutorId,
        selectedDateTime: {
          gte: start,
          lte: end
        },
        unifiedStatus: {
          in: ['CONFIRMED', 'AWAITING_PAYMENT']
        }
      }
    });

    // Create booking lookup for faster checking  
    const bookedTimes = new Set();
    activeBookings.forEach(booking => {
      const bookingTime = new Date(booking.selectedDateTime);
      const timeKey = `${bookingTime.toISOString().split('T')[0]}_${bookingTime.toLocaleString('en-US', {
        timeZone: 'Europe/Copenhagen',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      bookedTimes.add(timeKey);
    });

    // Determine availability based on absence of bookings
    const timeSlots = baseTimeSlots.map(slot => {
      const slotTimeKey = `${slot.date.toISOString().split('T')[0]}_${slot.startTime.toTimeString().substring(0, 5)}`;
      const isAvailable = !bookedTimes.has(slotTimeKey);
      
      return {
        ...slot,
        status: isAvailable ? 'AVAILABLE' : 'BOOKED'
      };
    });

    // Transform data to group by date for backward compatibility
    const groupedData = {};
    timeSlots.forEach(slot => {
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          timeSlots: [],
          hasAvailability: false
        };
      }
      groupedData[dateKey].timeSlots.push({
        time: slot.startTime.toTimeString().substring(0, 5), // HH:MM format
        status: slot.status
      });
      if (slot.status === 'AVAILABLE') {
        groupedData[dateKey].hasAvailability = true;
      }
    });

    const transformedAvailability = Object.values(groupedData);

    res.json({
      success: true,
      data: transformedAvailability
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability'
    });
  }
});

// POST /api/availability/:tutorId - Add/update tutor availability (tutor only)
router.post('/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { date, timeSlots } = req.body;

    if (!date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({
        success: false,
        error: 'Date and timeSlots array are required'
      });
    }

    // Validate tutor exists
    const tutor = await databaseService.findUnique('tutor', {
      where: { id: tutorId, isActive: true }
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: 'Tutor not found'
      });
    }

    // Validate time slots format
    const validTimeSlots = timeSlots.every(slot => 
      slot.time && 
      (slot.status === undefined || ['AVAILABLE', 'UNAVAILABLE'].includes(slot.status))
    );

    if (!validTimeSlots) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time slots format'
      });
    }

    // Delete existing time slots for this date
    await databaseService.deleteMany('tutorTimeSlot', {
      where: {
        tutorId: tutorId,
        date: new Date(date)
      }
    });

    // Insert new time slots
    const slotsToInsert = timeSlots.map(slot => {
      const [startHour, startMinute = '00'] = slot.time.split(':');
      const endHour = (parseInt(startHour) + 1).toString().padStart(2, '0');
      
      return {
        tutorId: tutorId,
        date: new Date(date),
        startTime: new Date(`1970-01-01T${startHour.padStart(2, '0')}:${startMinute}:00`),
        endTime: new Date(`1970-01-01T${endHour}:${startMinute}:00`)
      };
    });

    const createdSlots = slotsToInsert.length > 0 
      ? await databaseService.createMany('tutorTimeSlot', {
          data: slotsToInsert
        })
      : { count: 0 };

    res.json({
      success: true,
      data: {
        date: date,
        slotsCreated: createdSlots.count || slotsToInsert.length
      }
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability'
    });
  }
});

// NOTE: Direct time slot booking removed - use /api/bookings endpoint instead
// Time slots are now managed through the booking system as single source of truth

module.exports = router;
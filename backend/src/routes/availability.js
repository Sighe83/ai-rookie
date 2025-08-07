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

    const timeSlots = await databaseService.findMany('tutorTimeSlot', {
      where: {
        tutorId: tutorId,
        date: {
          gte: start,
          lte: end
        },
        isAvailable: true
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
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
        available: slot.isAvailable,
        booked: slot.isBooked,
        clientName: slot.clientName
      });
      if (slot.isAvailable && !slot.isBooked) {
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
      typeof slot.available === 'boolean' && 
      typeof slot.booked === 'boolean'
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
        endTime: new Date(`1970-01-01T${endHour}:${startMinute}:00`),
        isAvailable: slot.available !== false,
        isBooked: slot.booked === true,
        clientName: slot.clientName || null
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

// PATCH /api/availability/:tutorId/:date/book - Book a specific time slot
router.patch('/:tutorId/:date/book', optionalAuth, async (req, res) => {
  try {
    const { tutorId, date } = req.params;
    const { time } = req.body;

    if (!time) {
      return res.status(400).json({
        success: false,
        error: 'Time is required'
      });
    }

    // Find the specific time slot
    const [startHour, startMinute = '00'] = time.split(':');
    const timeSlot = await databaseService.findFirst('tutorTimeSlot', {
      where: {
        tutorId: tutorId,
        date: new Date(date),
        startTime: new Date(`1970-01-01T${startHour.padStart(2, '0')}:${startMinute}:00`)
      }
    });

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found'
      });
    }

    if (!timeSlot.isAvailable || timeSlot.isBooked) {
      return res.status(400).json({
        success: false,
        error: 'Time slot is not available'
      });
    }

    // Update the time slot to mark as booked
    const updatedTimeSlot = await databaseService.update('tutorTimeSlot', {
      where: {
        id: timeSlot.id
      },
      data: {
        isBooked: true
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedTimeSlot.id,
        date: updatedTimeSlot.date.toISOString().split('T')[0],
        time: updatedTimeSlot.startTime.toTimeString().substring(0, 5),
        isBooked: updatedTimeSlot.isBooked
      }
    });
  } catch (error) {
    console.error('Error booking time slot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to book time slot'
    });
  }
});

module.exports = router;
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/availability/:tutorId - Get tutor availability for a date range
router.get('/:tutorId', optionalAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to next 14 days if no date range provided
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Validate tutor exists
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId, isActive: true }
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: 'Tutor not found'
      });
    }

    const availability = await prisma.tutorAvailability.findMany({
      where: {
        tutorId: tutorId,
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Transform data to include formatted dates and available times
    const transformedAvailability = availability.map(slot => {
      const timeSlots = typeof slot.timeSlots === 'string' ? JSON.parse(slot.timeSlots) : slot.timeSlots;
      return {
        date: slot.date.toISOString().split('T')[0], // YYYY-MM-DD format
        timeSlots: timeSlots,
        hasAvailability: timeSlots.some(time => time.available && !time.booked)
      };
    });

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
    const tutor = await prisma.tutor.findUnique({
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

    const availability = await prisma.tutorAvailability.upsert({
      where: {
        tutorId_date: {
          tutorId: tutorId,
          date: new Date(date)
        }
      },
      update: {
        timeSlots: JSON.stringify(timeSlots)
      },
      create: {
        tutorId: tutorId,
        date: new Date(date),
        timeSlots: JSON.stringify(timeSlots)
      }
    });

    res.json({
      success: true,
      data: {
        date: availability.date.toISOString().split('T')[0],
        timeSlots: availability.timeSlots
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

    // Get current availability
    const availability = await prisma.tutorAvailability.findUnique({
      where: {
        tutorId_date: {
          tutorId: tutorId,
          date: new Date(date)
        }
      }
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        error: 'Availability not found for this date'
      });
    }

    // Update the specific time slot
    const timeSlots = typeof availability.timeSlots === 'string' ? JSON.parse(availability.timeSlots) : availability.timeSlots;
    const slotIndex = timeSlots.findIndex(slot => slot.time === time);

    if (slotIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found'
      });
    }

    if (!timeSlots[slotIndex].available || timeSlots[slotIndex].booked) {
      return res.status(400).json({
        success: false,
        error: 'Time slot is not available'
      });
    }

    timeSlots[slotIndex].booked = true;

    // Update availability
    const updatedAvailability = await prisma.tutorAvailability.update({
      where: {
        tutorId_date: {
          tutorId: tutorId,
          date: new Date(date)
        }
      },
      data: {
        timeSlots: JSON.stringify(timeSlots)
      }
    });

    res.json({
      success: true,
      data: {
        date: updatedAvailability.date.toISOString().split('T')[0],
        timeSlots: updatedAvailability.timeSlots
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
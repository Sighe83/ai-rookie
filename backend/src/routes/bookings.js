const express = require('express');
const { databaseService } = require('../config/database');
const { authMiddleware, optionalAuth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/bookings - Get user's bookings or all bookings (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { user } = req;
    const { status, siteMode } = req.query;

    let whereClause = {};

    // Non-admin users can only see their own bookings
    if (user.role !== 'ADMIN') {
      whereClause.userId = user.id;
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Filter by site mode if provided
    if (siteMode) {
      whereClause.siteMode = siteMode;
    }

    const bookings = await databaseService.findMany('booking', {
      where: whereClause,
      include: {
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        session: {
          select: {
            title: true,
            description: true,
            duration: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// POST /api/bookings - Create a new booking
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      tutorId,
      sessionId,
      format,
      selectedDateTime,
      participants,
      siteMode,
      contactName,
      contactEmail,
      contactPhone,
      company,
      department,
      notes
    } = req.body;

    // Validate required fields
    if (!tutorId || !sessionId || !format || !selectedDateTime || !contactName || !contactEmail || !siteMode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate tutor and session exist
    const tutor = await databaseService.findUnique('tutor', {
      where: { id: tutorId, isActive: true }
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: 'Tutor not found'
      });
    }

    const session = await databaseService.findUnique('session', {
      where: { id: sessionId, isActive: true }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Calculate total price based on format and site mode
    let totalPrice = siteMode === 'B2C' ? tutor.price : tutor.basePrice;
    
    if (format === 'TEAM' && participants) {
      totalPrice = totalPrice * participants;
    }

    // Create or get user
    let userId;
    if (req.user) {
      userId = req.user.id;
    } else {
      // Create guest user
      const existingUser = await databaseService.findUnique('user', {
        where: { email: contactEmail }
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await databaseService.create('user', {
          data: {
            email: contactEmail,
            name: contactName,
            phone: contactPhone,
            company: company,
            department: department,
            siteMode: siteMode
          }
        });
        userId = newUser.id;
      }
    }

    // Check availability for the selected time
    const bookingDate = new Date(selectedDateTime);
    const timeString = bookingDate.toTimeString().slice(0, 5); // HH:MM format
    const dateOnly = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

    const availability = await databaseService.findUnique('tutorAvailability', {
      where: {
        tutorId_date: {
          tutorId: tutorId,
          date: dateOnly
        }
      }
    });

    if (!availability) {
      return res.status(400).json({
        success: false,
        error: 'No availability found for selected date'
      });
    }

    const timeSlot = availability.timeSlots.find(slot => slot.time === timeString);
    if (!timeSlot || !timeSlot.available || timeSlot.booked) {
      return res.status(400).json({
        success: false,
        error: 'Selected time slot is not available'
      });
    }

    // Create booking
    const booking = await databaseService.create('booking', {
      data: {
        userId: userId,
        tutorId: tutorId,
        sessionId: sessionId,
        format: format,
        selectedDateTime: new Date(selectedDateTime),
        participants: participants,
        totalPrice: totalPrice,
        siteMode: siteMode,
        contactName: contactName,
        contactEmail: contactEmail,
        contactPhone: contactPhone,
        company: company,
        department: department,
        notes: notes,
        status: 'PENDING'
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        session: {
          select: {
            title: true,
            description: true,
            duration: true
          }
        }
      }
    });

    // Mark time slot as booked
    const updatedTimeSlots = availability.timeSlots.map(slot => 
      slot.time === timeString ? { ...slot, booked: true } : slot
    );

    await databaseService.update('tutorAvailability', {
      where: {
        tutorId_date: {
          tutorId: tutorId,
          date: dateOnly
        }
      },
      data: {
        timeSlots: updatedTimeSlots
      }
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

// PATCH /api/bookings/:id/status - Update booking status (admin/tutor only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { user } = req;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const booking = await databaseService.findUnique('booking', {
      where: { id: id },
      include: {
        tutor: {
          include: {
            user: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check permissions
    if (user.role !== 'ADMIN' && user.role !== 'TUTOR') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (user.role === 'TUTOR' && booking.tutor.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own bookings'
      });
    }

    const updateData = { status };
    
    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      
      // Free up the time slot
      const bookingDate = new Date(booking.selectedDateTime);
      const timeString = bookingDate.toTimeString().slice(0, 5);
      const dateOnly = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

      const availability = await databaseService.findUnique('tutorAvailability', {
        where: {
          tutorId_date: {
            tutorId: booking.tutorId,
            date: dateOnly
          }
        }
      });

      if (availability) {
        const updatedTimeSlots = availability.timeSlots.map(slot => 
          slot.time === timeString ? { ...slot, booked: false } : slot
        );

        await databaseService.update('tutorAvailability', {
          where: {
            tutorId_date: {
              tutorId: booking.tutorId,
              date: dateOnly
            }
          },
          data: {
            timeSlots: updatedTimeSlots
          }
        });
      }
    }

    const updatedBooking = await databaseService.update('booking', {
      where: { id: id },
      data: updateData,
      include: {
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        session: {
          select: {
            title: true,
            description: true,
            duration: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status'
    });
  }
});

// GET /api/bookings/:id - Get specific booking
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const booking = await databaseService.findUnique('booking', {
      where: { id: id },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        session: {
          select: {
            title: true,
            description: true,
            duration: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check permissions
    if (user.role !== 'ADMIN' && booking.userId !== user.id && booking.tutor.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

module.exports = router;
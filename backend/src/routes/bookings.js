const express = require('express');
const { databaseService } = require('../config/database');
const { authMiddleware, optionalAuth, adminOnly } = require('../middleware/auth');
const SessionService = require('../services/sessionService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { convertToUTC, timeIsInRange } = require('../utils/timezone');

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
    console.log('📝 Booking request received:', req.body);
    console.log('👤 User:', req.user);
    console.log('🗄️ Database service:', typeof databaseService, databaseService ? 'exists' : 'undefined');
    console.log('🔍 Database service methods:', Object.keys(databaseService || {}));
    
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

    // Validate session time according to business rules
    const sessionTimeValidation = SessionService.validateSessionTime(selectedDateTime);
    if (!sessionTimeValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: sessionTimeValidation.error
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

    // Calculate total price based on session price and format
    let totalPrice = session.price;
    
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
    const dateOnly = new Date(bookingDate.toISOString().split('T')[0] + 'T00:00:00.000Z'); // Keep UTC date

    // This validation is now handled below with the more comprehensive booking check

    // Check if there's an available time slot for the selected date/time
    // Use timezone utility to handle Denmark timezone conversion properly
    const timeConversion = convertToUTC(selectedDateTime);
    const actualSelectedTime = timeConversion.convertedDate;
    // Convert selected time from UTC back to Denmark time for comparison with timeslots
    const selectedTimeOnly = actualSelectedTime.toLocaleString('en-US', { 
      timeZone: 'Europe/Copenhagen', 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    console.log('🔍 Looking for time slots:', {
      tutorId,
      date: dateOnly,
      selectedTime: actualSelectedTime,
      selectedTimeOnly: selectedTimeOnly,
      conversionApplied: timeConversion.conversionApplied
    });
    
    // Get all base time slots for this tutor/date (no status filtering needed)
    const availableSlots = await databaseService.findMany('tutorTimeSlot', {
      where: {
        tutorId: tutorId,
        date: dateOnly
      }
    });
    
    console.log('📊 All available slots for this tutor/date:', availableSlots.length);
    
    // Check for any active bookings at the selected time using unified status
    const existingBookings = await databaseService.findMany('booking', {
      where: {
        tutorId: tutorId,
        selectedDateTime: actualSelectedTime,
        unifiedStatus: {
          in: ['AWAITING_PAYMENT', 'CONFIRMED']
        }
      }
    });

    if (existingBookings.length > 0) {
      console.log('⏳ Time slot is already booked or reserved for pending payment');
      return res.status(400).json({
        success: false,
        error: 'This time slot is no longer available. Please choose a different time.'
      });
    }

    // Filter slots where the selected time falls within the slot's time range
    const matchingSlots = availableSlots.filter(slot => {
      // Timeslots are stored as UTC but represent Denmark local times
      // Extract the time portion directly (they represent Denmark times)
      const slotStartTime = slot.startTime.toISOString().slice(11, 19); // HH:MM:SS
      const slotEndTime = slot.endTime.toISOString().slice(11, 19);
      
      console.log(`🕐 Checking slot: ${slotStartTime} - ${slotEndTime} vs selected: ${selectedTimeOnly}`);
      
      // Use timezone utility function for consistent time range checking
      const matches = timeIsInRange(selectedTimeOnly, slotStartTime, slotEndTime);
      console.log(`   Match result: ${matches ? '✅' : '❌'}`);
      return matches;
    });

    if (matchingSlots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Selected time slot is not available'
      });
    }

    // Set payment expiration time (15 minutes from now)
    const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Create booking with payment pending status
    const booking = await databaseService.create('booking', {
      data: {
        userId: userId,
        tutorId: tutorId,
        sessionId: sessionId,
        format: format,
        selectedDateTime: actualSelectedTime, // Use timezone-corrected datetime
        participants: participants,
        totalPrice: totalPrice,
        siteMode: siteMode,
        contactName: contactName,
        contactEmail: contactEmail,
        contactPhone: contactPhone,
        company: company,
        department: department,
        notes: notes,
        unifiedStatus: 'AWAITING_PAYMENT',
        paymentExpiresAt: paymentExpiresAt
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

    // No need to update time slots - booking table is now single source of truth
    // Time slot availability will be determined by querying bookings table
    console.log('✅ Booking created, availability now determined by booking existence');

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'dkk',
            product_data: {
              name: `${session.title} - ${booking.tutor.user.name}`,
              description: session.description,
              metadata: {
                bookingId: booking.id,
                tutorName: booking.tutor.user.name,
                sessionTitle: session.title
              }
            },
            unit_amount: Math.round(totalPrice * 100), // Convert to øre
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled?booking_id=${booking.id}`,
      client_reference_id: booking.id,
      metadata: {
        bookingId: booking.id,
        userId: userId,
        tutorId: tutorId,
        sessionId: sessionId
      },
      expires_at: Math.floor((Date.now() + 30 * 60 * 1000) / 1000), // 30 minutes for Stripe (minimum required)
    });

    // Update booking with Stripe session ID
    await databaseService.update('booking', {
      where: { id: booking.id },
      data: { 
        paymentIntentId: checkoutSession.id 
      }
    });

    res.status(201).json({
      success: true,
      data: booking,
      paymentUrl: checkoutSession.url,
      paymentExpiresAt: paymentExpiresAt
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PATCH /api/bookings/:id/status - Update booking status (admin/tutor only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { user } = req;

    if (!['DRAFT', 'AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED'].includes(status)) {
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

    const updateData = { unifiedStatus: status };
    
    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      
      // No need to free time slots - unified status automatically handles availability
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

// GET /api/bookings/:id/public - Get booking details for payment verification (no auth required)
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;

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
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Only return basic booking info for payment verification
    const publicBookingData = {
      id: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      selectedDateTime: booking.selectedDateTime,
      totalPrice: booking.totalPrice,
      contactName: booking.contactName,
      contactEmail: booking.contactEmail,
      tutor: {
        name: booking.tutor.user.name
      },
      session: {
        title: booking.session.title,
        duration: booking.session.duration
      },
      createdAt: booking.createdAt,
      paidAt: booking.paidAt
    };

    res.json({
      success: true,
      data: publicBookingData
    });
  } catch (error) {
    console.error('Error fetching public booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
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
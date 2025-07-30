import { supabase, dbHelpers } from '../config/supabase.js';

export default async function handler(req, res) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (req.method === 'GET') {
      // Get bookings for user
      const { status, date_from, date_to, limit = 50, offset = 0 } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const bookings = await dbHelpers.getBookings(user.id, filters);

      // Apply pagination
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const paginatedBookings = bookings.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        data: paginatedBookings,
        pagination: {
          total: bookings.length,
          offset: startIndex,
          limit: parseInt(limit),
          hasMore: endIndex < bookings.length
        }
      });

    } else if (req.method === 'POST') {
      // Create new booking
      const {
        tutorId,
        sessionId,
        format,
        selectedDateTime,
        participants,
        totalPrice,
        siteMode = 'B2B',
        contactName,
        contactEmail,
        contactPhone,
        company,
        department,
        notes
      } = req.body;

      // Validation
      if (!tutorId || !sessionId || !format || !selectedDateTime || !totalPrice || !contactName || !contactEmail) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['tutorId', 'sessionId', 'format', 'selectedDateTime', 'totalPrice', 'contactName', 'contactEmail']
        });
      }

      // Verify tutor and session exist
      const { data: tutor, error: tutorError } = await supabase
        .from('tutors')
        .select('id, is_active')
        .eq('id', tutorId)
        .single();

      if (tutorError || !tutor || !tutor.is_active) {
        return res.status(404).json({ error: 'Tutor not found or inactive' });
      }

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, is_active')
        .eq('id', sessionId)
        .eq('tutor_id', tutorId)
        .single();

      if (sessionError || !session || !session.is_active) {
        return res.status(404).json({ error: 'Session not found or inactive' });
      }

      // Check availability (basic check - you might want to make this more robust)
      const selectedDate = new Date(selectedDateTime).toISOString().split('T')[0];
      const { data: availability } = await supabase
        .from('tutor_availability')
        .select('time_slots')
        .eq('tutor_id', tutorId)
        .eq('date', selectedDate)
        .single();

      if (availability) {
        const timeSlots = typeof availability.time_slots === 'string' ? 
          JSON.parse(availability.time_slots) : 
          availability.time_slots;
        
        const selectedTime = new Date(selectedDateTime).toTimeString().slice(0, 5);
        const timeSlot = timeSlots?.find(slot => slot.time === selectedTime);
        
        if (!timeSlot || !timeSlot.available || timeSlot.booked) {
          return res.status(409).json({ error: 'Selected time slot is not available' });
        }
      }

      // Create booking
      const bookingData = {
        user_id: user.id,
        tutor_id: tutorId,
        session_id: sessionId,
        format,
        selected_date_time: selectedDateTime,
        participants: participants || null,
        total_price: totalPrice,
        status: 'PENDING',
        site_mode: siteMode,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        company: company || null,
        department: department || null,
        notes: notes || null,
        payment_status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const booking = await dbHelpers.createBooking(bookingData);

      // Update availability to mark time slot as booked
      if (availability) {
        const timeSlots = typeof availability.time_slots === 'string' ? 
          JSON.parse(availability.time_slots) : 
          availability.time_slots;
        
        const selectedTime = new Date(selectedDateTime).toTimeString().slice(0, 5);
        const updatedTimeSlots = timeSlots?.map(slot => 
          slot.time === selectedTime ? { ...slot, booked: true } : slot
        );

        await dbHelpers.updateAvailability(tutorId, selectedDate, updatedTimeSlots);
      }

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created successfully'
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Bookings handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
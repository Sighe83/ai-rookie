// Updated availability API using the simplified status enum
// This is MUCH cleaner than the previous is_available AND is_booked logic

export const availabilityApi = {
  // Get available slots for B2C users
  getAvailability: async (tutorId, startDate, endDate) => {
    let query = supabase
      .from('tutor_time_slots')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('status', 'AVAILABLE'); // MUCH SIMPLER! Just one condition

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw new ApiError(error.message, 400, error);
    
    // Transform data to group by date for backward compatibility
    const groupedData = {};
    data?.forEach(slot => {
      const dateKey = slot.date;
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          time_slots: []
        };
      }
      groupedData[dateKey].time_slots.push({
        time: slot.start_time.substring(0, 5), // HH:MM format
        status: slot.status, // Now we have clear status
        bookable: slot.status === 'AVAILABLE' // Explicit bookable flag
      });
    });
    
    return { data: Object.values(groupedData), success: true };
  }
};

// Updated booking creation logic
const createBooking = async (bookingData) => {
  // ... existing booking creation code ...

  // Mark the time slot as PENDING (awaiting payment) instead of confusing boolean logic
  await databaseService.update('tutorTimeSlot', {
    where: { id: timeSlotToBook.id },
    data: {
      status: 'PENDING',      // Clear and explicit
      bookingId: booking.id
    }
  });
};

// Updated booking cleanup service
const cancelExpiredBooking = async (booking) => {
  // Update booking status
  await databaseService.update('booking', {
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'EXPIRED',
      cancelledAt: new Date()
    }
  });

  // Free up the time slot - much clearer logic
  await databaseService.updateMany('tutorTimeSlot', {
    where: { bookingId: booking.id },
    data: {
      status: 'AVAILABLE',  // Back to available
      bookingId: null
    }
  });
};

// Updated payment success handler
const handlePaymentSuccess = async (bookingId) => {
  // Confirm the booking
  await databaseService.update('booking', {
    where: { id: bookingId },
    data: {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paidAt: new Date()
    }
  });

  // Mark time slot as fully booked
  await databaseService.updateMany('tutorTimeSlot', {
    where: { bookingId: bookingId },
    data: {
      status: 'BOOKED'  // Confirmed booking
    }
  });
};

// Much simpler queries throughout the codebase:
// 
// Find all available slots:
// WHERE status = 'AVAILABLE'
//
// Find all booked slots (confirmed + pending):  
// WHERE status IN ('BOOKED', 'PENDING')
//
// Find only awaiting payment slots:
// WHERE status = 'PENDING'
//
// Find slots that need cleanup:
// WHERE status = 'PENDING' AND payment_expires_at < NOW()

console.log(`
🎯 BENEFITS OF SIMPLIFIED STATUS:

✅ CLARITY: 
   - Old: is_available=true AND is_booked=false  
   - New: status='AVAILABLE'

✅ PERFORMANCE:
   - Old: Need to check two columns with complex AND/OR logic
   - New: Single equality check with index

✅ MAINTAINABILITY:
   - Old: 4 possible combinations (2^2), some contradictory
   - New: 4 clear states, each with specific meaning

✅ BUSINESS LOGIC:
   - Old: What does "available but booked" mean?
   - New: PENDING clearly means "awaiting payment"

✅ QUERY SIMPLICITY:
   - Old: WHERE is_available = true AND is_booked = false
   - New: WHERE status = 'AVAILABLE'

❌ ELIMINATES BUGS:
   - No more contradictory states like "available but booked"
   - Impossible to have data inconsistencies
   - Clear state transitions
`);
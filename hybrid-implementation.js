// Hybrid Single Source of Truth + Change Tracking Implementation
// Maintains your excellent current architecture while adding audit capabilities

export const hybridAvailabilityApi = {
  
  // PRIMARY: Get availability (unchanged - single source of truth)
  getAvailability: async (tutorId, startDate, endDate) => {
    // This stays exactly the same - your current perfect logic
    
    // Get time slots (when tutor is potentially available)
    let slotsQuery = supabase
      .from('tutor_time_slots')
      .select('*')
      .eq('tutor_id', tutorId);

    if (startDate) slotsQuery = slotsQuery.gte('date', startDate);
    if (endDate) slotsQuery = slotsQuery.lte('date', endDate);

    const { data: slots, error: slotsError } = await slotsQuery
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (slotsError) throw new ApiError(slotsError.message, 400, slotsError);
    
    // Get bookings (when tutor is actually booked)
    let bookingsQuery = supabase
      .from('bookings')
      .select('selected_date_time, unified_status, payment_expires_at')
      .eq('tutor_id', tutorId);
    
    if (startDate) bookingsQuery = bookingsQuery.gte('selected_date_time', startDate);
    if (endDate) bookingsQuery = bookingsQuery.lte('selected_date_time', endDate);
    
    const { data: bookings, error: bookingsError } = await bookingsQuery;
    if (bookingsError) throw new ApiError(bookingsError.message, 400, bookingsError);

    // Calculate real availability (single source of truth)
    const bookedTimes = new Set();
    const now = new Date();
    
    bookings?.forEach(booking => {
      const isActiveBooking = booking.unified_status === 'CONFIRMED' || 
        (booking.unified_status === 'AWAITING_PAYMENT' && 
         booking.payment_expires_at && 
         new Date(booking.payment_expires_at) > now);
      
      if (isActiveBooking) {
        const bookingDateTime = new Date(booking.selected_date_time);
        const dateStr = bookingDateTime.toISOString().split('T')[0];
        const timeStr = bookingDateTime.toTimeString().substring(0, 5);
        bookedTimes.add(`${dateStr}_${timeStr}`);
      }
    });
    
    // Transform slots to availability (with booking status)
    const groupedData = {};
    slots?.forEach(slot => {
      const dateKey = slot.date;
      const timeKey = `${slot.date}_${slot.start_time.substring(0, 5)}`;
      const isAvailable = !bookedTimes.has(timeKey);
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          time_slots: []
        };
      }
      groupedData[dateKey].time_slots.push({
        time: slot.start_time.substring(0, 5),
        status: isAvailable ? 'AVAILABLE' : 'BOOKED'
      });
    });
    
    return { data: Object.values(groupedData), success: true };
  },

  // PRIMARY: Update availability (enhanced with change tracking)
  updateAvailability: async (tutorId, date, timeSlots) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new ApiError('Authentication required', 401, authError);
      }

      // Get current slots before change (for change tracking)
      const { data: currentSlots, error: fetchError } = await supabase
        .from('tutor_time_slots')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('date', date);

      if (fetchError) throw new ApiError(fetchError.message, 400, fetchError);

      // Calculate changes for audit log
      const currentTimes = new Set(currentSlots?.map(slot => 
        slot.start_time.substring(0, 5)) || []);
      const newTimes = new Set(timeSlots.map(slot => slot.time));
      
      const added = [...newTimes].filter(time => !currentTimes.has(time));
      const removed = [...currentTimes].filter(time => !newTimes.has(time));

      // SINGLE SOURCE OF TRUTH UPDATE (same as before)
      // Delete existing slots
      const { error: deleteError } = await supabase
        .from('tutor_time_slots')
        .delete()
        .eq('tutor_id', tutorId)
        .eq('date', date);

      if (deleteError) throw new ApiError(deleteError.message, 400, deleteError);

      // Insert new slots
      if (timeSlots.length > 0) {
        const slotsToInsert = timeSlots.map(slot => {
          const [startHour] = slot.time.split(':');
          const startMinute = slot.time.includes(':') ? slot.time.split(':')[1] : '00';
          const endHour = (parseInt(startHour) + 1).toString().padStart(2, '0');
          
          return {
            id: generateUUID(),
            tutor_id: tutorId,
            date: date,
            start_time: `${startHour.padStart(2, '0')}:${startMinute}:00`,
            end_time: `${endHour}:${startMinute}:00`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        });

        const { error: insertError } = await supabase
          .from('tutor_time_slots')
          .insert(slotsToInsert);

        if (insertError) throw new ApiError(insertError.message, 400, insertError);
      }

      // AUDIT LOG (secondary - never affects main logic)
      await logAvailabilityChanges(tutorId, date, added, removed, user.id);

      return { 
        data: { 
          updated: timeSlots.length,
          changes: { added: added.length, removed: removed.length }
        }, 
        success: true 
      };

    } catch (err) {
      console.error('updateAvailability error:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Unknown error occurred', 500, err);
    }
  },

  // SECONDARY: Analytics and audit queries
  getChangeHistory: async (tutorId, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('tutor_availability_log')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('changed_at', startDate.toISOString())
      .order('changed_at', { ascending: false });

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  getChangeStats: async (tutorId, days = 30) => {
    const { data: changes } = await this.getChangeHistory(tutorId, days);
    
    const stats = {
      totalChanges: changes?.length || 0,
      slotsAdded: changes?.filter(c => c.action === 'ADDED').length || 0,
      slotsRemoved: changes?.filter(c => c.action === 'REMOVED').length || 0,
      mostActiveDay: null,
      avgChangesPerDay: 0
    };

    // Calculate most active day
    const dayCount = {};
    changes?.forEach(change => {
      const day = new Date(change.changed_at).toISOString().split('T')[0];
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    stats.mostActiveDay = Object.keys(dayCount).reduce((a, b) => 
      dayCount[a] > dayCount[b] ? a : b, null);
    stats.avgChangesPerDay = stats.totalChanges / days;

    return { data: stats, success: true };
  }
};

// Helper function for audit logging (runs in background)
async function logAvailabilityChanges(tutorId, date, added, removed, userId) {
  try {
    const changes = [];
    
    added.forEach(time => {
      changes.push({
        id: generateUUID(),
        tutor_id: tutorId,
        date: date,
        start_time: time + ':00',
        action: 'ADDED',
        reason: 'tutor_edit',
        changed_at: new Date().toISOString(),
        changed_by: userId
      });
    });
    
    removed.forEach(time => {
      changes.push({
        id: generateUUID(),
        tutor_id: tutorId,
        date: date,
        start_time: time + ':00',
        action: 'REMOVED', 
        reason: 'tutor_edit',
        changed_at: new Date().toISOString(),
        changed_by: userId
      });
    });

    if (changes.length > 0) {
      await supabase.from('tutor_availability_log').insert(changes);
      // Note: We don't throw errors here - audit logging is secondary
      // Main availability functionality should never fail due to logging
    }
  } catch (error) {
    console.warn('Audit logging failed (non-critical):', error);
    // Don't throw - this should never break the main flow
  }
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
// Improved Time Slot Management with Soft Delete
// This replaces the hard delete approach with status tracking

export const improvedAvailabilityApi = {
  
  // Get active availability for a tutor
  getAvailability: async (tutorId, startDate, endDate) => {
    let slotsQuery = supabase
      .from('tutor_time_slots')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('status', 'ACTIVE'); // Only get active slots

    if (startDate) slotsQuery = slotsQuery.gte('date', startDate);
    if (endDate) slotsQuery = slotsQuery.lte('date', endDate);

    const { data: slots, error: slotsError } = await slotsQuery
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (slotsError) throw new ApiError(slotsError.message, 400, slotsError);
    return { data: slots, success: true };
  },

  // Update availability with soft delete approach
  updateAvailability: async (tutorId, date, timeSlots) => {
    try {
      // Get existing active slots for this date
      const { data: existingSlots, error: fetchError } = await supabase
        .from('tutor_time_slots')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('date', date)
        .eq('status', 'ACTIVE');

      if (fetchError) throw new ApiError(fetchError.message, 400, fetchError);

      // Create set of new slot times for comparison
      const newSlotTimes = new Set(timeSlots.map(slot => slot.time));
      const existingSlotTimes = new Map();
      
      existingSlots?.forEach(slot => {
        const timeKey = slot.start_time.substring(0, 5);
        existingSlotTimes.set(timeKey, slot.id);
      });

      // Mark removed slots as deleted (soft delete)
      const slotsToDelete = [];
      for (const [timeKey, slotId] of existingSlotTimes) {
        if (!newSlotTimes.has(timeKey)) {
          slotsToDelete.push(slotId);
        }
      }

      if (slotsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('tutor_time_slots')
          .update({
            status: 'DELETED',
            deleted_at: new Date().toISOString(),
            deleted_reason: 'tutor_edit',
            updated_at: new Date().toISOString()
          })
          .in('id', slotsToDelete);

        if (deleteError) throw new ApiError(deleteError.message, 400, deleteError);
      }

      // Add new slots (only ones that don't exist)
      const slotsToInsert = [];
      timeSlots.forEach(slot => {
        if (!existingSlotTimes.has(slot.time)) {
          const [startHour] = slot.time.split(':');
          const startMinute = slot.time.includes(':') ? slot.time.split(':')[1] : '00';
          const endHour = (parseInt(startHour) + 1).toString().padStart(2, '0');
          
          slotsToInsert.push({
            id: generateUUID(),
            tutor_id: tutorId,
            date: date,
            start_time: `${startHour.padStart(2, '0')}:${startMinute}:00`,
            end_time: `${endHour}:${startMinute}:00`,
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });

      if (slotsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('tutor_time_slots')
          .insert(slotsToInsert);

        if (insertError) throw new ApiError(insertError.message, 400, insertError);
      }

      return { 
        data: { 
          deleted: slotsToDelete.length, 
          added: slotsToInsert.length 
        }, 
        success: true 
      };

    } catch (err) {
      console.error('updateAvailability error:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Unknown error occurred', 500, err);
    }
  },

  // Get availability history (including deleted slots)
  getAvailabilityHistory: async (tutorId, startDate, endDate) => {
    let query = supabase
      .from('tutor_time_slots')
      .select('*, tutor:tutors(user:users(name))')
      .eq('tutor_id', tutorId);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  // Analytics: Get deletion patterns
  getDeletionStats: async (tutorId, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('tutor_time_slots')
      .select('status, deleted_reason, deleted_at, date')
      .eq('tutor_id', tutorId)
      .eq('status', 'DELETED')
      .gte('deleted_at', startDate.toISOString());

    if (error) throw new ApiError(error.message, 400, error);

    const stats = {
      totalDeleted: data?.length || 0,
      byReason: {},
      byWeek: {}
    };

    data?.forEach(slot => {
      // Count by reason
      const reason = slot.deleted_reason || 'unknown';
      stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;

      // Count by week
      const week = new Date(slot.deleted_at).toISOString().substring(0, 10);
      stats.byWeek[week] = (stats.byWeek[week] || 0) + 1;
    });

    return { data: stats, success: true };
  }
};

// Helper function (same as before)
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
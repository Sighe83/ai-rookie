// Pure Supabase RLS API Service - No Backend JWT Required
import { supabase, authHelpers } from './supabase.js';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ✅ REMOVED: JWT token management and Bearer auth
// Supabase RLS handles authentication automatically via client
// No need for manual token management or bearer headers

// ✅ REMOVED: Dual authentication system eliminated
// All authentication now handled directly by Supabase RLS
// This removes JWT backend conflicts and security gaps

// Tutors API - Direct Supabase queries with RLS
export const tutorsApi = {
  getAll: async (siteMode = 'B2B') => {
    const { data, error } = await supabase
      .from('tutors')
      .select(`
        *,
        user:users(name, email),
        sessions!inner(*)
      `)
      .eq('is_active', true)
      .eq('sessions.is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(error.message, 400, error);
    
    // Transform data to include user name at tutor level
    const transformedData = data?.map(tutor => ({
      ...tutor,
      name: tutor.user?.name || 'Unavngivet Tutor'
    })) || [];
    
    return { data: transformedData, success: true };
  },

  getById: async (id, siteMode = 'B2B') => {
    // Get tutor data
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select(`
        *,
        user:users(name, email)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (tutorError) throw new ApiError(tutorError.message, 404, tutorError);

    // Get active sessions separately
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (sessionsError) throw new ApiError(sessionsError.message, 400, sessionsError);

    // Transform data to include user name at tutor level and active sessions
    const transformedData = {
      ...tutorData,
      name: tutorData.user?.name || 'Unavngivet Tutor',
      sessions: sessions || []
    };
    
    return { data: transformedData, success: true };
  }
};

// Availability API - Using new tutor_time_slots table
export const availabilityApi = {
  getAvailability: async (tutorId, startDate, endDate) => {
    // Get all base time slots for this tutor
    let slotsQuery = supabase
      .from('tutor_time_slots')
      .select('*')
      .eq('tutor_id', tutorId);

    if (startDate) slotsQuery = slotsQuery.gte('date', startDate);
    if (endDate) slotsQuery = slotsQuery.lte('date', endDate);

    const { data: slots, error: slotsError } = await slotsQuery.order('date', { ascending: true }).order('start_time', { ascending: true });
    
    if (slotsError) throw new ApiError(slotsError.message, 400, slotsError);
    
    // Get all active bookings for this tutor in the date range
    let bookingsQuery = supabase
      .from('bookings')
      .select('selected_date_time, unified_status, payment_expires_at, paid_at')
      .eq('tutor_id', tutorId);
    
    if (startDate) bookingsQuery = bookingsQuery.gte('selected_date_time', startDate);
    if (endDate) bookingsQuery = bookingsQuery.lte('selected_date_time', endDate);
    
    const { data: bookings, error: bookingsError } = await bookingsQuery;
    
    if (bookingsError) throw new ApiError(bookingsError.message, 400, bookingsError);
    
    // Create booking lookup for faster checking
    const bookedTimes = new Set();
    const now = new Date();
    bookings?.forEach(booking => {
      // Only consider confirmed bookings or pending payments that haven't expired
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
    
    // Transform data to group by date and determine availability
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
        time: slot.start_time.substring(0, 5), // HH:MM format
        status: isAvailable ? 'AVAILABLE' : 'BOOKED'
      });
    });
    
    return { data: Object.values(groupedData), success: true };
  },

  updateAvailability: async (tutorId, date, timeSlots) => {
    try {
      // Verify user has tutor permissions first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new ApiError('Authentication required', 401, authError);
      }

      // Verify the tutorId belongs to the authenticated user
      const { data: tutorCheck, error: tutorError } = await supabase
        .from('tutors')
        .select('id, user_id')
        .eq('id', tutorId)
        .eq('user_id', user.id)
        .single();

      if (tutorError || !tutorCheck) {
        throw new ApiError('Unauthorized: Tutor not found or access denied', 403, tutorError);
      }

      // HYBRID APPROACH: Get current slots for change tracking (before deletion)
      const { data: currentSlots, error: fetchError } = await supabase
        .from('tutor_time_slots')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('date', date);

      if (fetchError) {
        console.error('Error fetching current slots for audit:', fetchError);
        // Don't fail - audit logging is secondary
      }

      // Calculate changes for audit log
      const currentTimes = new Set(currentSlots?.map(slot => 
        slot.start_time.substring(0, 5)) || []);
      const newTimes = new Set(timeSlots.map(slot => slot.time));
      
      const added = [...newTimes].filter(time => !currentTimes.has(time));
      const removed = [...currentTimes].filter(time => !newTimes.has(time));

      // SINGLE SOURCE OF TRUTH UPDATE (unchanged)
      // Delete existing time slots for this date
      const { error: deleteError } = await supabase
        .from('tutor_time_slots')
        .delete()
        .eq('tutor_id', tutorId)
        .eq('date', date);

      if (deleteError) {
        console.error('Error deleting existing slots:', deleteError);
        throw new ApiError(deleteError.message, 400, deleteError);
      }

      // Helper function to generate UUID
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        // Fallback UUID generation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Insert new time slots
      const slotsToInsert = timeSlots.map(slot => {
        const [startHour] = slot.time.split(':');
        const startMinute = slot.time.includes(':') ? slot.time.split(':')[1] : '00';
        const endHour = (parseInt(startHour) + 1).toString().padStart(2, '0');
        
        return {
          id: generateUUID(), // Generate UUID for each slot
          tutor_id: tutorId,
          date: date,
          start_time: `${startHour.padStart(2, '0')}:${startMinute}:00`,
          end_time: `${endHour}:${startMinute}:00`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      if (slotsToInsert.length > 0) {
        const { data, error } = await supabase
          .from('tutor_time_slots')
          .insert(slotsToInsert)
          .select();

        if (error) {
          console.error('Database insert error:', error);
          
          // If error is about missing column, provide helpful error message
          if (error.message.includes('client_name')) {
            throw new ApiError('Table structure mismatch. Please run the database migration or check table schema.', 400, error);
          }
          
          throw new ApiError(error.message, 400, error);
        }
        
        console.log('Availability operation successful:', data);
      } else {
        console.log('No slots to insert');
      }

      // HYBRID APPROACH: Log changes for audit (secondary - never affects main logic)
      await logAvailabilityChanges(tutorId, date, added, removed, user.id);

      return { 
        data: timeSlots, 
        success: true,
        changes: { added: added.length, removed: removed.length }
      };
    } catch (err) {
      console.error('updateAvailability error:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Unknown error occurred', 500, err);
    }
  },

  // New method for bulk weekly availability updates
  updateWeeklyAvailability: async (tutorId, weekStartDate, weeklyTemplate) => {
    try {
      const weekStart = new Date(weekStartDate);
      const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const results = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + dayIndex);
        const dayKey = dayKeys[dayIndex];
        const daySlots = weeklyTemplate[dayKey] || [];

        // Convert template slots to API format
        const timeSlots = daySlots.map(slot => {
          const startTime = slot.split('-')[0];
          return {
            time: startTime,
            status: 'AVAILABLE'
          };
        });

        // Only update if there are slots for this day
        if (timeSlots.length > 0) {
          const result = await availabilityApi.updateAvailability(
            tutorId,
            date.toISOString().split('T')[0],
            timeSlots
          );
          results.push(result);
        } else {
          // Clear availability for days with no slots
          try {
            await supabase
              .from('tutor_time_slots')
              .delete()
              .eq('tutor_id', tutorId)
              .eq('date', date.toISOString().split('T')[0]);
          } catch (deleteError) {
            console.log('No existing availability to delete for', date.toISOString().split('T')[0]);
          }
        }
      }

      return { data: results, success: true };
    } catch (err) {
      console.error('updateWeeklyAvailability error:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Failed to update weekly availability', 500, err);
    }
  },

  bookTimeSlot: async (tutorId, date, time) => {
    // This would typically be handled by booking creation
    // which updates availability automatically via triggers
    const { data, error } = await supabase.rpc('book_time_slot', {
      p_tutor_id: tutorId,
      p_date: date,
      p_time: time
    });

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  // Clear all future availability for a tutor
  clearAllFutureAvailability: async (tutorId) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new ApiError('Authentication required', 401, authError);
      }

      // Verify the tutorId belongs to the authenticated user
      const { data: tutorCheck, error: tutorError } = await supabase
        .from('tutors')
        .select('id, user_id')
        .eq('id', tutorId)
        .eq('user_id', user.id)
        .single();

      if (tutorError || !tutorCheck) {
        throw new ApiError('Unauthorized: Tutor not found or access denied', 403, tutorError);
      }

      // Calculate tomorrow's date (all future dates)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      console.log('🗑️ Clearing all future availability from:', tomorrowStr);

      // Get current future slots for audit logging
      const { data: currentSlots, error: fetchError } = await supabase
        .from('tutor_time_slots')
        .select('*')
        .eq('tutor_id', tutorId)
        .gte('date', tomorrowStr);

      if (fetchError) {
        console.warn('⚠️ Could not fetch current slots for audit:', fetchError.message);
      }

      // Delete ALL future time slots from database
      const { error: deleteError } = await supabase
        .from('tutor_time_slots')
        .delete()
        .eq('tutor_id', tutorId)
        .gte('date', tomorrowStr);

      if (deleteError) {
        throw new ApiError(`Database error: ${deleteError.message}`, 400, deleteError);
      }

      const deletedCount = currentSlots?.length || 0;

      // AUDIT LOGGING: Log all deleted slots
      if (currentSlots && currentSlots.length > 0) {
        const auditChanges = currentSlots.map(slot => ({
          id: generateAuditUUID(),
          tutor_id: tutorId,
          date: slot.date,
          start_time: slot.start_time,
          action: 'REMOVED',
          reason: 'bulk_clear_future',
          changed_at: new Date().toISOString(),
          changed_by: user.id,
          notes: 'Bulk deletion of all future availability'
        }));

        try {
          await supabase.from('tutor_availability_log').insert(auditChanges);
          console.log(`✅ Logged ${auditChanges.length} deleted slots to audit log`);
        } catch (auditError) {
          console.warn('⚠️ Audit logging failed (non-critical):', auditError.message);
        }
      }

      console.log(`✅ Deleted ${deletedCount} future availability slots`);

      return { 
        data: { 
          deletedCount,
          fromDate: tomorrowStr
        }, 
        success: true 
      };

    } catch (err) {
      console.error('clearAllFutureAvailability error:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Failed to clear future availability', 500, err);
    }
  }
};

// Bookings API - Direct Supabase queries with RLS
export const bookingsApi = {
  getBookings: async (filters = {}) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);
    if (!user) throw new ApiError('Not authenticated', 401);

    let query = supabase
      .from('bookings')
      .select(`
        *,
        tutor:tutors(*),
        session:sessions(*)
      `)
      .eq('user_id', user.id);

    if (filters.status) query = query.eq('unified_status', filters.status.toUpperCase());
    if (filters.siteMode) query = query.eq('site_mode', filters.siteMode.toUpperCase());

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  createBooking: async (bookingData) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);
    if (!user) throw new ApiError('Not authenticated', 401);

    try {
      // Generate UUID for booking
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        // Fallback UUID generation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // First create the booking
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          id: generateUUID(), // Explicitly provide UUID
          ...bookingData,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          tutor:tutors(*),
          session:sessions(*)
        `)
        .single();

      if (error) throw new ApiError(error.message, 400, error);

      // Now update the availability to mark the slot as booked
      if (bookingData.selectedDateTime && bookingData.tutorId) {
        await bookingsApi.markSlotAsBooked(
          bookingData.tutorId,
          bookingData.selectedDateTime
        );
      }

      return { data, success: true };
    } catch (err) {
      console.error('createBooking error:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Failed to create booking', 500, err);
    }
  },

  // New method to mark availability slot as booked
  markSlotAsBooked: async (tutorId, selectedDateTime) => {
    try {
      // Parse the selectedDateTime to get date and time
      const dateTime = new Date(selectedDateTime);
      const date = dateTime.toISOString().split('T')[0];
      const hour = dateTime.getHours();
      const timeString = `${hour.toString().padStart(2, '0')}:00`;

      // Get existing availability for this date
      const { data: existing, error: findError } = await supabase
        .from('tutor_availability')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('date', date)
        .maybeSingle();

      if (findError) throw new ApiError(findError.message, 400, findError);
      if (!existing) throw new ApiError('No availability found for this date', 404);

      // Update the specific time slot to mark as booked
      const updatedTimeSlots = existing.time_slots.map(slot => {
        if (slot.time === timeString || slot.time === hour.toString()) {
          return { ...slot, status: 'BOOKED' };
        }
        return slot;
      });

      // Update the availability record
      const { error: updateError } = await supabase
        .from('tutor_availability')
        .update({
          time_slots: updatedTimeSlots,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw new ApiError(updateError.message, 400, updateError);
      
      return { success: true };
    } catch (err) {
      console.error('markSlotAsBooked error:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Failed to mark slot as booked', 500, err);
    }
  },

  getBooking: async (id) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        tutor:tutors(*),
        session:sessions(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw new ApiError(error.message, 404, error);
    return { data, success: true };
  },

  updateBookingStatus: async (id, status) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);

    try {
      // First get the booking to check if we need to free up a slot
      const { data: booking, error: getError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (getError) throw new ApiError(getError.message, 400, getError);

      // Update the booking status
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          unified_status: status.toUpperCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, 400, error);

      // If booking is being cancelled, free up the slot
      if (status.toUpperCase() === 'CANCELLED' && booking.selectedDateTime && booking.tutorId) {
        await bookingsApi.freeUpSlot(booking.tutorId, booking.selectedDateTime);
      }

      return { data, success: true };
    } catch (err) {
      console.error('updateBookingStatus error:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Failed to update booking status', 500, err);
    }
  },

  // Method to free up a slot when booking is cancelled
  freeUpSlot: async (tutorId, selectedDateTime) => {
    try {
      // Parse the selectedDateTime to get date and time
      const dateTime = new Date(selectedDateTime);
      const date = dateTime.toISOString().split('T')[0];
      const hour = dateTime.getHours();
      const timeString = `${hour.toString().padStart(2, '0')}:00`;

      // Get existing availability for this date
      const { data: existing, error: findError } = await supabase
        .from('tutor_availability')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('date', date)
        .maybeSingle();

      if (findError) throw new ApiError(findError.message, 400, findError);
      if (!existing) return { success: true }; // No availability record, nothing to update

      // Update the specific time slot to mark as available again
      const updatedTimeSlots = existing.time_slots.map(slot => {
        if (slot.time === timeString || slot.time === hour.toString()) {
          return { ...slot, status: 'AVAILABLE' };
        }
        return slot;
      });

      // Update the availability record
      const { error: updateError } = await supabase
        .from('tutor_availability')
        .update({
          time_slots: updatedTimeSlots,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw new ApiError(updateError.message, 400, updateError);
      
      return { success: true };
    } catch (err) {
      console.error('freeUpSlot error:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Failed to free up slot', 500, err);
    }
  }
};

// Health check for Vercel
export const healthApi = {
  check: async () => {
    try {
      // Check Supabase connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) throw error;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          supabase: 'connected',
          vercel: 'running'
        }
      };
    } catch (error) {
      throw new ApiError('Health check failed', 0, { originalError: error.message });
    }
  }
};

// Tutor Management API - For authenticated tutors managing their profile
export const tutorManagementApi = {
  getProfile: async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);
    if (!user) throw new ApiError('Not authenticated', 401);

    // Get tutor data
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select(`
        *,
        user:users(*)
      `)
      .eq('user_id', user.id)
      .single();

    if (tutorError) throw new ApiError(tutorError.message, 404, tutorError);

    // Get active sessions separately
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', tutorData.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (sessionsError) throw new ApiError(sessionsError.message, 400, sessionsError);

    // Combine the data
    const result = {
      ...tutorData,
      sessions: sessions || []
    };

    return { data: result, success: true };
  },

  updateProfile: async (profileData) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);
    if (!user) throw new ApiError('Not authenticated', 401);

    const { data, error } = await supabase
      .from('tutors')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select(`
        *,
        user:users(*),
        sessions(*)
      `)
      .single();

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  getTutorBookings: async (filters = {}) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);
    if (!user) throw new ApiError('Not authenticated', 401);

    // First get tutor ID
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (tutorError) throw new ApiError('Tutor not found', 404, tutorError);

    let query = supabase
      .from('bookings')
      .select(`
        *,
        user:users(name, email, phone, company),
        session:sessions(title, description, duration)
      `)
      .eq('tutor_id', tutorData.id);

    if (filters.status) query = query.eq('unified_status', filters.status.toUpperCase());

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  updateBookingStatus: async (bookingId, status) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);
    if (!user) throw new ApiError('Not authenticated', 401);

    // Get tutor ID
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (tutorError) throw new ApiError('Tutor not found', 404, tutorError);

    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        unified_status: status.toUpperCase(),
        updated_at: new Date().toISOString(),
        ...(status.toUpperCase() === 'CONFIRMED' && { confirmed_at: new Date().toISOString() }),
        ...(status.toUpperCase() === 'CANCELLED' && { cancelled_at: new Date().toISOString() })
      })
      .eq('id', bookingId)
      .eq('tutor_id', tutorData.id)
      .select()
      .single();

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  updateUserData: async (userData) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);
    if (!user) throw new ApiError('Not authenticated', 401);

    const { data, error } = await supabase
      .from('users')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  uploadProfileImage: async (formData) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);
    if (!user) throw new ApiError('Not authenticated', 401);

    try {
      // Get file from FormData
      const file = formData.get('image');
      if (!file) throw new ApiError('No image file provided', 400);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new ApiError('Filen skal være et billede (JPG, PNG, WebP)', 400);
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new ApiError('Billedet må ikke være større end 5MB', 400);
      }

      // Generate unique filename with user ID folder for organization
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${user.id}/profile_${Date.now()}.${fileExt}`;

      console.log('Uploading to Supabase Storage:', {
        fileName,
        fileSize: file.size,
        fileType: file.type
      });

      // Delete any existing profile image for this user first
      try {
        const { data: existingFiles } = await supabase.storage
          .from('avatars')
          .list(user.id, {
            limit: 100,
            search: 'profile_'
          });

        if (existingFiles && existingFiles.length > 0) {
          const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
          await supabase.storage
            .from('avatars')
            .remove(filesToDelete);
          console.log('Removed existing profile images:', filesToDelete);
        }
      } catch (cleanupError) {
        console.log('Could not cleanup existing files (OK):', cleanupError);
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false // Don't overwrite, we deleted old files above
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new ApiError(`Upload fejlede: ${uploadError.message}`, 400, uploadError);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new ApiError('Kunne ikke generere billede URL', 500);
      }

      console.log('Upload successful:', {
        path: uploadData.path,
        publicUrl: urlData.publicUrl
      });

      return { 
        data: { 
          imageUrl: urlData.publicUrl,
          fileName: uploadData.path
        }, 
        success: true 
      };
    } catch (err) {
      console.error('uploadProfileImage error:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Kunne ikke uploade billede', 500, err);
    }
  }
};

// Sessions API - For managing tutor sessions
export const sessionsApi = {
  getSessions: async (tutorId) => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  createSession: async (sessionData) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);
    if (!user) throw new ApiError('Not authenticated', 401);

    // Get tutor ID
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (tutorError) throw new ApiError('Tutor not found', 404, tutorError);

    // Generate UUID for session
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback UUID generation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        id: generateUUID(), // Explicitly provide UUID
        ...sessionData,
        tutor_id: tutorData.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  updateSession: async (sessionId, sessionData) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new ApiError('Authentication failed', 401, userError);
    if (!user) throw new ApiError('Not authenticated', 401);

    // Get tutor ID
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (tutorError) throw new ApiError('Tutor not found', 404, tutorError);

    const { data, error } = await supabase
      .from('sessions')
      .update({
        ...sessionData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('tutor_id', tutorData.id)
      .select()
      .single();

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  deleteSession: async (sessionId) => {
    console.log('🔄 Starting deleteSession API call for:', sessionId);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Auth error in deleteSession:', userError);
      throw new ApiError('Authentication failed', 401, userError);
    }
    if (!user) {
      console.error('❌ No user found in deleteSession');
      throw new ApiError('Not authenticated', 401);
    }
    
    console.log('✅ User authenticated:', user.email);

    // Get tutor ID
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (tutorError) {
      console.error('❌ Tutor lookup error:', tutorError);
      throw new ApiError('Tutor not found', 404, tutorError);
    }
    
    console.log('✅ Tutor found:', tutorData.id);

    // Perform the update
    console.log('🔄 Updating session is_active to false...');
    const { data, error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('id', sessionId)
      .eq('tutor_id', tutorData.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Session update error:', error);
      throw new ApiError(error.message, 400, error);
    }
    
    console.log('✅ Session successfully marked as inactive:', data);
    return { data, success: true };
  }
};

// HYBRID APPROACH: Audit logging helpers (secondary functionality)
// These functions log availability changes without affecting core logic

async function logAvailabilityChanges(tutorId, date, added, removed, userId) {
  try {
    const changes = [];
    
    // Log added slots
    added.forEach(time => {
      changes.push({
        id: generateAuditUUID(),
        tutor_id: tutorId,
        date: date,
        start_time: time + ':00',
        action: 'ADDED',
        reason: 'tutor_edit',
        changed_at: new Date().toISOString(),
        changed_by: userId
      });
    });
    
    // Log removed slots
    removed.forEach(time => {
      changes.push({
        id: generateAuditUUID(),
        tutor_id: tutorId,
        date: date,
        start_time: time + ':00',
        action: 'REMOVED',
        reason: 'tutor_edit',
        changed_at: new Date().toISOString(),
        changed_by: userId
      });
    });

    // Insert audit records (background logging)
    if (changes.length > 0) {
      await supabase.from('tutor_availability_log').insert(changes);
      console.log(`✅ Logged ${changes.length} availability changes for audit`);
    }
  } catch (error) {
    // CRITICAL: Audit logging failures should never break main functionality
    console.warn('⚠️ Audit logging failed (non-critical):', error.message);
    // Don't throw - this should never break the availability update
  }
}

function generateAuditUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// New API methods for accessing audit data
export const auditApi = {
  // Get change history for a tutor
  getAvailabilityHistory: async (tutorId, days = 30) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new ApiError('Authentication required', 401, authError);
      }

      // Verify tutor ownership
      const { data: tutorCheck, error: tutorError } = await supabase
        .from('tutors')
        .select('id, user_id')
        .eq('id', tutorId)
        .eq('user_id', user.id)
        .single();

      if (tutorError || !tutorCheck) {
        throw new ApiError('Unauthorized: Tutor not found or access denied', 403, tutorError);
      }

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
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Failed to get availability history', 500, err);
    }
  },

  // Get change statistics
  getChangeStats: async (tutorId, days = 30) => {
    try {
      const { data: changes } = await auditApi.getAvailabilityHistory(tutorId, days);
      
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

      if (Object.keys(dayCount).length > 0) {
        stats.mostActiveDay = Object.keys(dayCount).reduce((a, b) => 
          dayCount[a] > dayCount[b] ? a : b);
      }
      
      stats.avgChangesPerDay = days > 0 ? stats.totalChanges / days : 0;

      return { data: stats, success: true };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Failed to get change statistics', 500, err);
    }
  }
};

// Export utilities
export { ApiError, supabase, authHelpers };

// Default export - Pure Supabase RLS API with Hybrid Audit
const api = {
  tutors: tutorsApi,
  availability: availabilityApi,
  bookings: bookingsApi,
  tutorManagement: tutorManagementApi,
  sessions: sessionsApi,
  health: healthApi,
  audit: auditApi
};

export default api;
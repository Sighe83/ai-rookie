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
        sessions(*)
      `)
      .eq('is_active', true)
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
    const { data, error } = await supabase
      .from('tutors')
      .select(`
        *,
        user:users(name, email),
        sessions(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw new ApiError(error.message, 404, error);
    
    // Transform data to include user name at tutor level
    const transformedData = {
      ...data,
      name: data.user?.name || 'Unavngivet Tutor'
    };
    
    return { data: transformedData, success: true };
  }
};

// Availability API - Direct Supabase queries with RLS
export const availabilityApi = {
  getAvailability: async (tutorId, startDate, endDate) => {
    let query = supabase
      .from('tutor_availability')
      .select('*')
      .eq('tutor_id', tutorId);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query.order('date', { ascending: true });
    
    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  updateAvailability: async (tutorId, date, timeSlots) => {
    try {
      // First try to find existing record
      const { data: existing, error: findError } = await supabase
        .from('tutor_availability')
        .select('id')
        .eq('tutor_id', tutorId)
        .eq('date', date)
        .maybeSingle();

      if (findError) {
        console.error('Error finding existing availability:', findError);
        throw new ApiError(findError.message, 400, findError);
      }

      let result;
      if (existing) {
        // Update existing record
        console.log('Updating existing availability record:', existing.id);
        result = await supabase
          .from('tutor_availability')
          .update({
            time_slots: timeSlots,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Insert new record
        console.log('Creating new availability record for tutor:', tutorId, 'date:', date);
        
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

        // Generate UUID on client side as fallback
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

        const insertData = {
          id: generateUUID(), // Explicitly provide UUID
          tutor_id: tutorId,
          date: date,
          time_slots: timeSlots
        };
        console.log('Insert data:', insertData);
        
        result = await supabase
          .from('tutor_availability')
          .insert(insertData)
          .select()
          .single();
      }

      const { data, error } = result;
      if (error) {
        console.error('Database operation error:', error);
        throw new ApiError(error.message, 400, error);
      }
      
      console.log('Availability operation successful:', data);
      return { data, success: true };
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
            available: true,
            booked: false
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
              .from('tutor_availability')
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

    if (filters.status) query = query.eq('status', filters.status.toUpperCase());
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
          return { ...slot, booked: true, available: false };
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
          status: status.toUpperCase(),
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
          return { ...slot, booked: false, available: true };
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

    const { data, error } = await supabase
      .from('tutors')
      .select(`
        *,
        user:users(*),
        sessions(*)
      `)
      .eq('user_id', user.id)
      .single();

    if (error) throw new ApiError(error.message, 404, error);
    return { data, success: true };
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

    if (filters.status) query = query.eq('status', filters.status.toUpperCase());

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
        status: status.toUpperCase(),
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
      .update({ is_active: false })
      .eq('id', sessionId)
      .eq('tutor_id', tutorData.id)
      .select()
      .single();

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  }
};

// Export utilities
export { ApiError, supabase, authHelpers };

// Default export - Pure Supabase RLS API
const api = {
  tutors: tutorsApi,
  availability: availabilityApi,
  bookings: bookingsApi,
  tutorManagement: tutorManagementApi,
  sessions: sessionsApi,
  health: healthApi
};

export default api;
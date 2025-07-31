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
        sessions(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
  },

  getById: async (id, siteMode = 'B2B') => {
    const { data, error } = await supabase
      .from('tutors')
      .select(`
        *,
        sessions(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw new ApiError(error.message, 404, error);
    return { data, success: true };
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
    const { data, error } = await supabase
      .from('tutor_availability')
      .upsert([{
        tutor_id: tutorId,
        date,
        time_slots: timeSlots,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw new ApiError(error.message, 400, error);
    return { data, success: true };
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

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
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
    return { data, success: true };
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
    return { data, success: true };
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

// Export utilities
export { ApiError, supabase, authHelpers };

// Default export - Pure Supabase RLS API
const api = {
  tutors: tutorsApi,
  availability: availabilityApi,
  bookings: bookingsApi,
  health: healthApi
};

export default api;
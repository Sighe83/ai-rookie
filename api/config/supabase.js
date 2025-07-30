import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for frontend operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Admin client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database helper functions
export const dbHelpers = {
  // Safe query with error handling
  async safeQuery(query) {
    try {
      const result = await query;
      if (result.error) {
        console.error('Database error:', result.error);
        throw new Error(result.error.message);
      }
      return result;
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  },

  // Get user profile with error handling
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create user profile
  async createUserProfile(userProfile) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([userProfile])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get tutors with filtering
  async getTutors(filters = {}) {
    let query = supabase
      .from('tutors')
      .select(`
        *,
        user:users(name, email),
        sessions(*)
      `)
      .eq('is_active', true);

    if (filters.specialty) {
      query = query.eq('specialty', filters.specialty);
    }

    if (filters.siteMode) {
      query = query.eq('site_mode', filters.siteMode);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get bookings with relationships
  async getBookings(userId, filters = {}) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        tutor:tutors(
          *,
          user:users(name, email)
        ),
        session:sessions(*)
      `)
      .eq('user_id', userId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.date_from) {
      query = query.gte('selected_date_time', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('selected_date_time', filters.date_to);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Create booking with transaction
  async createBooking(bookingData) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert([bookingData])
      .select(`
        *,
        tutor:tutors(*),
        session:sessions(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Get availability
  async getAvailability(tutorId, startDate, endDate) {
    let query = supabase
      .from('tutor_availability')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Update availability
  async updateAvailability(tutorId, date, timeSlots) {
    const { data, error } = await supabase
      .from('tutor_availability')
      .upsert([
        {
          tutor_id: tutorId,
          date,
          time_slots: JSON.stringify(timeSlots),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Real-time subscriptions
export const realtimeHelpers = {
  // Subscribe to booking updates
  subscribeToBookings(userId, callback) {
    return supabase
      .channel('bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Booking update:', payload);
          callback(payload);
        }
      )
      .subscribe();
  },

  // Subscribe to availability updates
  subscribeToAvailability(tutorId, callback) {
    return supabase
      .channel('availability')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tutor_availability',
          filter: `tutor_id=eq.${tutorId}`
        },
        (payload) => {
          console.log('Availability update:', payload);
          callback(payload);
        }
      )
      .subscribe();
  },

  // Unsubscribe from channel
  unsubscribe(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};

// Storage helpers
export const storageHelpers = {
  // Upload file to Supabase Storage
  async uploadFile(file, bucket = 'uploads', path = '') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      publicUrl,
      fileName
    };
  },

  // Delete file from Supabase Storage
  async deleteFile(bucket, path) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  },

  // Get signed URL for private files
  async getSignedUrl(bucket, path, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }
};

export default supabase;
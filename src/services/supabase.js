// Frontend Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

console.log('Supabase config:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  anonKeyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Tilføj storage fallback
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Debug mode
    debug: import.meta.env.DEV || import.meta.env.NODE_ENV === 'development'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  // Tilføj global options
  global: {
    headers: {
      'X-Client-Info': 'ai-rookie-frontend'
    }
  }
});

// Auth helpers
export const authHelpers = {
  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get current session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Sign in with email/password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  // Sign up with email/password
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Reset password
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  },

  // Update password
  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({
      password
    });
    if (error) throw error;
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};

// Database helpers
export const dbHelpers = {
  // Get current user profile
  getCurrentUserProfile: async () => {
    const user = await authHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  updateUserProfile: async (updates) => {
    const user = await authHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get tutors
  getTutors: async (filters = {}) => {
    // Get tutors first
    let tutorQuery = supabase
      .from('tutors')
      .select(`
        *,
        user:users(name, email)
      `)
      .eq('is_active', true);

    if (filters.specialty) {
      tutorQuery = tutorQuery.eq('specialty', filters.specialty);
    }

    const { data: tutors, error: tutorError } = await tutorQuery.order('created_at', { ascending: false });
    if (tutorError) throw tutorError;

    // Get active sessions for each tutor
    const tutorsWithSessions = await Promise.all(
      tutors.map(async (tutor) => {
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('tutor_id', tutor.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (sessionsError) throw sessionsError;
        
        return {
          ...tutor,
          sessions: sessions || []
        };
      })
    );

    return tutorsWithSessions;
  },

  // Get tutor by ID
  getTutorById: async (id) => {
    // Get tutor data
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select(`
        *,
        user:users(name, email),
        timeSlots:tutor_time_slots(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (tutorError) throw tutorError;

    // Get active sessions separately
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    return {
      ...tutorData,
      sessions: sessions || []
    };
  },

  // Get user bookings
  getUserBookings: async (filters = {}) => {
    const user = await authHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

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
      .eq('user_id', user.id);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Create booking
  createBooking: async (bookingData) => {
    const user = await authHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

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

    if (error) throw error;
    return data;
  },

  // Get availability
  getAvailability: async (tutorId, startDate, endDate) => {
    let query = supabase
      .from('tutor_time_slots')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('date', { ascending: true });

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};

// Real-time helpers
export const realtimeHelpers = {
  // Subscribe to user bookings
  subscribeToUserBookings: (callback) => {
    return supabase
      .channel('user_bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  },

  // Subscribe to tutor availability
  subscribeToTutorAvailability: (tutorId, callback) => {
    return supabase
      .channel('tutor_time_slots')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tutor_time_slots',
          filter: `tutor_id=eq.${tutorId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  },

  // Unsubscribe from channel
  unsubscribe: (channel) => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};

// Storage helpers
export const storageHelpers = {
  // Upload file
  uploadFile: async (file, bucket = 'uploads', path = '') => {
    const user = await authHelpers.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

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

  // Delete file
  deleteFile: async (bucket, path) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  },

  // Get public URL
  getPublicUrl: (bucket, path) => {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }
};

export default supabase;
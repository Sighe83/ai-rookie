import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

// Simplified API hooks that use Supabase directly
// This eliminates CORS issues with external API endpoints

// Generic hook for Supabase calls
export const useSupabaseQuery = (queryFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
    } catch (error) {
      console.error('Supabase query error:', error);
      setError(error.message || 'Query failed');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Hook for tutors data - simplified to use Supabase directly
export const useTutors = (siteMode = 'B2B') => {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('tutors')
      .select(`
        *,
        sessions(*)
      `)
      .eq('is_active', true)
      .eq('site_mode', siteMode);

    if (error) throw error;
    
    // Transform data to match expected format
    return data.map(tutor => ({
      id: tutor.id,
      userId: tutor.user_id,
      title: tutor.title,
      specialty: tutor.specialty,
      experience: tutor.experience,
      valueProp: tutor.value_prop,
      img: tutor.img,
      basePrice: tutor.base_price,
      price: tutor.price,
      isActive: tutor.is_active,
      name: tutor.title, // For compatibility
      sessions: tutor.sessions || []
    }));
  }, [siteMode]);
};

// Hook for single tutor
export const useTutor = (id, siteMode = 'B2B') => {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('tutors')
      .select(`
        *,
        sessions(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return {
      ...data,
      basePrice: data.base_price,
      valueProp: data.value_prop,
      sessions: data.sessions || []
    };
  }, [id, siteMode]);
};

// Hook for bookings using direct Supabase
export const useBookings = (filters = {}) => {
  return useSupabaseQuery(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('bookings')
      .select(`
        *,
        tutor:tutors(*),
        session:sessions(*)
      `)
      .eq('user_id', user.id);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.siteMode) {
      query = query.eq('site_mode', filters.siteMode);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return data.map(booking => ({
      ...booking,
      totalPrice: booking.total_price,
      bookingDate: booking.created_at
    }));
  }, [JSON.stringify(filters)]);
};

// Hook for mutations (create/update operations)
export const useMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (supabaseCall) => {
    try {
      setLoading(true);
      setError(null);
      const result = await supabaseCall();
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error.message || 'Operation failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error, clearError: () => setError(null) };
};

// Hook for booking creation using direct Supabase
export const useCreateBooking = () => {
  const { mutate, loading, error, clearError } = useMutation();

  const createBooking = useCallback(async (bookingData) => {
    return await mutate(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...bookingData,
          user_id: user.id,
          tutor_id: bookingData.tutorId,
          session_id: bookingData.sessionId,
          selected_date_time: bookingData.selectedDateTime,
          total_price: bookingData.totalPrice || 0,
          contact_name: bookingData.contactName,
          contact_email: bookingData.contactEmail,
          contact_phone: bookingData.contactPhone || '',
          site_mode: bookingData.siteMode,
          status: 'PENDING',
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
    });
  }, [mutate]);

  return { createBooking, loading, error, clearError };
};
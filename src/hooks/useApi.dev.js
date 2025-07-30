import { useState, useEffect, useCallback } from 'react';
import { supabase, dbHelpers } from '../services/supabase';

// Development version that uses Supabase directly to avoid CORS issues

// Generic hook for direct Supabase calls
export const useApi = (supabaseCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await supabaseCall();
      setData(result);
    } catch (error) {
      console.error('Supabase error:', error);
      setError(error.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};

// Hook for tutors data using direct Supabase
export const useTutors = (siteMode = 'B2B') => {
  return useApi(async () => {
    const { data, error } = await supabase
      .from('tutors')
      .select(`
        *,
        sessions(*)
      `)
      .eq('is_active', true)
      .eq('site_mode', siteMode);

    if (error) throw error;
    
    // Transform data similar to API format
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
      name: tutor.title, // Use title as name for compatibility
      sessions: tutor.sessions || []
    }));
  }, [siteMode]);
};

// Hook for single tutor
export const useTutor = (id, siteMode = 'B2B') => {
  return useApi(async () => {
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
    return data;
  }, [id, siteMode]);
};

// Hook for bookings using direct Supabase
export const useBookings = (filters = {}) => {
  return useApi(async () => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return [];

    let query = supabase
      .from('bookings')
      .select(`
        *,
        tutor:tutors(*),
        session:sessions(*)
      `)
      .eq('user_id', user.data.user.id);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
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
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...bookingData,
          user_id: user.data.user.id,
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
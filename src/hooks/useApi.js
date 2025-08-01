import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';

// Simplified API hooks that use Supabase directly
// This eliminates CORS issues with external API endpoints

// Generic hook for Supabase calls with improved error handling
export const useSupabaseQuery = (queryFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    // Generate unique request ID to handle race conditions
    const currentRequestId = ++requestIdRef.current;
    console.log('useSupabaseQuery: fetchData called, mounted:', mountedRef.current);
    
    console.log('useSupabaseQuery: Starting request', currentRequestId);
    
    // Only set loading if this is the latest request and component is mounted
    if (currentRequestId === requestIdRef.current && mountedRef.current) {
      console.log('useSupabaseQuery: Setting loading true');
      setLoading(true);
      setError(null);
    }
    
    console.log('useSupabaseQuery: Calling queryFn');
    try {
      const result = await queryFn();
      console.log('useSupabaseQuery: QueryFn returned:', result);
      
      // Only update state if this is still the latest request and component is mounted
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        console.log('useSupabaseQuery: Setting data and clearing loading');
        setData(result);
        setError(null); // Clear any previous errors
        setLoading(false); // Set loading false here too
      }
    } catch (error) {
      console.error('Supabase query error:', error);
      
      // Only update error state if this is still the latest request and component is mounted
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        let errorMessage = 'Der opstod en fejl';
        
        if (error.message?.includes('JWT') || error.message?.includes('expired')) {
          errorMessage = 'Login session udløbet';
        } else if (error.message?.includes('permission denied')) {
          errorMessage = 'Adgang nægtet';
        } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          errorMessage = 'Database tabel ikke fundet';
        } else if (error.message?.includes('fetch')) {
          errorMessage = 'Netværksfejl - tjek din internetforbindelse';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
      }
    } finally {
      // Always set loading to false when request completes
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        console.log('useSupabaseQuery: Setting loading to false');
        setLoading(false);
      }
    }
  }, dependencies);

  useEffect(() => {
    if (!mountedRef.current) return;
    fetchData();
  }, [fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(() => {
    if (mountedRef.current) {
      fetchData();
    }
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Hook for tutors data
export const useTutors = (siteMode = 'B2B') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: rawData, error: fetchError } = await supabase
          .from('tutors')
          .select(`
            *,
            sessions(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Transform data
        const transformedTutors = rawData?.map(tutor => ({
          id: tutor.id,
          userId: tutor.user_id,
          title: tutor.title || 'Unavailable',
          specialty: tutor.specialty || 'General',
          experience: tutor.experience || '',
          valueProp: tutor.value_prop || '',
          img: tutor.img || `https://placehold.co/100x100/E2E8F0/4A5568?text=${(tutor.title || 'T')[0]}`,
          basePrice: tutor.base_price || tutor.price || 0,
          price: tutor.price || tutor.base_price || 0,
          isActive: tutor.is_active,
          name: tutor.title || tutor.name || 'Unavailable',
          sessions: Array.isArray(tutor.sessions) ? tutor.sessions : []
        })) || [];

        setData(transformedTutors);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, [siteMode]);
  
  return { data: data || [], loading, error };
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

// Hook for bookings using direct Supabase with better error handling
export const useBookings = (filters = {}) => {
  return useSupabaseQuery(async () => {
    console.log('useBookings: Starting fetch with filters:', filters);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User fetch error:', userError);
      if (userError.message?.includes('JWT')) {
        throw new Error('Login session udløbet');
      }
      throw new Error('Autentificering fejlede');
    }
    
    if (!user) {
      console.warn('No authenticated user found');
      return [];
    }

    console.log('useBookings: User authenticated:', user.id);

    let query = supabase
      .from('bookings')
      .select(`
        *,
        tutor:tutors(*),
        session:sessions(*)
      `)
      .eq('user_id', user.id);

    if (filters.status && typeof filters.status === 'string') {
      query = query.eq('status', filters.status.toUpperCase());
    }

    if (filters.siteMode && typeof filters.siteMode === 'string') {
      const validSiteModes = ['B2B', 'B2C'];
      const normalizedSiteMode = validSiteModes.includes(filters.siteMode.toUpperCase()) 
        ? filters.siteMode.toUpperCase() 
        : null;
      
      if (normalizedSiteMode) {
        query = query.eq('site_mode', normalizedSiteMode);
      }
    }

    console.log('useBookings: Executing query...');
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Bookings fetch error:', error);
      
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        throw new Error('Database tabeller ikke fundet');
      }
      
      if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        throw new Error('Adgang nægtet til bookings data');
      }
      
      throw new Error(error.message || 'Kunne ikke hente bookings');
    }
    
    console.log('useBookings: Query successful, data length:', data?.length || 0);
    
    if (!data) {
      console.log('useBookings: No data returned, returning empty array');
      return [];
    }
    
    console.log('useBookings: Transforming', data.length, 'bookings');
    
    // Transform data with error handling
    return data.map(booking => {
      try {
        return {
          ...booking,
          totalPrice: booking.total_price || 0,
          bookingDate: booking.created_at,
          // Ensure nested objects exist
          tutor: booking.tutor || { name: 'Unknown', title: 'Unknown' },
          session: booking.session || { title: 'Unknown Session' }
        };
      } catch (transformError) {
        console.warn('Error transforming booking data:', transformError, booking);
        return {
          ...booking,
          totalPrice: 0,
          bookingDate: booking.created_at,
          tutor: { name: 'Unknown', title: 'Unknown' },
          session: { title: 'Unknown Session' }
        };
      }
    });
  }, [JSON.stringify(filters)]);
};

// Hook for mutations (create/update operations) with rate limiting
export const useMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const lastRequestRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(async (supabaseCall) => {
    if (!mountedRef.current) {
      return { success: false, error: null };
    }
    
    // Simple rate limiting - prevent multiple rapid requests
    const now = Date.now();
    if (now - lastRequestRef.current < 1000) { // 1 second cooldown
      return { success: false, error: 'For hurtige forespørgsler. Vent venligst.' };
    }
    
    lastRequestRef.current = now;
    
    try {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      const result = await supabaseCall();
      
      if (!mountedRef.current) {
        return { success: false, error: null };
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Mutation error:', error);
      
      let errorMsg = 'Operation failed';
      
      if (error.message?.includes('duplicate key')) {
        errorMsg = 'Data findes allerede';
      } else if (error.message?.includes('permission denied')) {
        errorMsg = 'Adgang nægtet';
      } else if (error.message?.includes('not authenticated')) {
        errorMsg = 'Ikke logget ind';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      if (mountedRef.current) {
        setError(errorMsg);
      }
      
      return { success: false, error: errorMsg };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const clearError = useCallback(() => {
    if (mountedRef.current) {
      setError(null);
    }
  }, []);

  return { mutate, loading, error, clearError };
};

// Hook for booking creation using direct Supabase with validation
export const useCreateBooking = () => {
  const { mutate, loading, error, clearError } = useMutation();

  const createBooking = useCallback(async (bookingData) => {
    return await mutate(async () => {
      // Validate booking data
      if (!bookingData.tutorId || !bookingData.sessionId) {
        throw new Error('Tutor og session er påkrævet');
      }
      
      if (!bookingData.contactName?.trim() || !bookingData.contactEmail?.trim()) {
        throw new Error('Kontakt navn og email er påkrævet');
      }
      
      if (!bookingData.selectedDateTime) {
        throw new Error('Vælg venligst en tid for sessionen');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(bookingData.contactEmail.trim())) {
        throw new Error('Ugyldig email adresse');
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error('Authentication fejlede');
      if (!user) throw new Error('Ikke logget ind');

      // Calculate total price if not provided
      let totalPrice = bookingData.totalPrice || 0;
      if (!totalPrice && bookingData.participants && bookingData.basePrice) {
        totalPrice = bookingData.basePrice * bookingData.participants;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          user_id: user.id,
          tutor_id: bookingData.tutorId,
          session_id: bookingData.sessionId,
          selected_date_time: bookingData.selectedDateTime,
          total_price: totalPrice,
          contact_name: bookingData.contactName.trim(),
          contact_email: bookingData.contactEmail.trim(),
          contact_phone: bookingData.contactPhone?.trim() || '',
          company: bookingData.company?.trim() || '',
          department: bookingData.department?.trim() || '',
          participants: bookingData.participants || 1,
          format: bookingData.format || 'INDIVIDUAL',
          site_mode: bookingData.siteMode || 'B2C',
          status: 'PENDING',
          notes: bookingData.notes?.trim() || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          tutor:tutors(*),
          session:sessions(*)
        `)
        .single();

      if (error) {
        console.error('Booking creation error:', error);
        throw error;
      }
      
      return data;
    });
  }, [mutate]);

  return { createBooking, loading, error, clearError };
};
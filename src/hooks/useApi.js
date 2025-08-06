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
        
        // Get tutors first
        const { data: tutors, error: tutorError } = await supabase
          .from('tutors')
          .select(`
            *,
            user:users(name, email)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (tutorError) {
          throw tutorError;
        }

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
              name: tutor.user?.name || 'Unavngivet Tutor',
              email: tutor.user?.email || 'No email',
              sessions: sessions || []
            };
          })
        );
        
        setData(tutorsWithSessions);
        
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

// Hook for getting tutor by user ID
export const useTutorByUserId = (userId) => {
  return useSupabaseQuery(async () => {
    if (!userId) {
      // Return null instead of throwing error to handle loading state gracefully
      return null;
    }

    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }
    
    return data;
  }, [userId]);
};

// Hook for single tutor
export const useTutor = (id, siteMode = 'B2B') => {
  return useSupabaseQuery(async () => {
    // Get tutor data
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select(`
        *
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
      valueProp: tutorData.value_prop,
      sessions: sessions || []
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
        tutor:tutors(*, user:users(name, email)),
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
          // Ensure nested objects exist and include name from user relation
          tutor: {
            ...(booking.tutor || {}),
            name: booking.tutor?.user?.name || booking.tutor?.name || 'Unknown',
            email: booking.tutor?.user?.email || booking.tutor?.email || 'No email'
          },
          session: booking.session || { title: 'Unknown Session' }
        };
      } catch (transformError) {
        console.warn('Error transforming booking data:', transformError, booking);
        return {
          ...booking,
          totalPrice: 0,
          bookingDate: booking.created_at,
          tutor: { name: 'Unknown', title: 'Unknown', email: 'No email' },
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

      // Calculate total price if not provided
      let totalPrice = bookingData.totalPrice || 0;
      if (!totalPrice && bookingData.participants && bookingData.sessionPrice) {
        totalPrice = bookingData.sessionPrice * bookingData.participants;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          id: generateUUID(), // Explicitly provide UUID
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
          tutor:tutors(*, user:users(name, email)),
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

// Hook for tutor dashboard statistics
export const useTutorStats = (tutorId) => {
  return useSupabaseQuery(async () => {
    if (!tutorId) {
      // Return null instead of throwing error to handle loading state gracefully
      return null;
    }

    const now = new Date();
    
    // Fix date ranges - 7 dage (i dag + 6 dage frem) men kun kommende tider
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0); // Start of today
    
    const endOf7Days = new Date(now);
    endOf7Days.setDate(now.getDate() + 6);
    endOf7Days.setHours(23, 59, 59, 999); // End of 6th day from today
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Get next 7 days' bookings (confirmed or pending) - only future start times
    const { data: allNext7DaysBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, total_price, status, selected_date_time')
      .eq('tutor_id', tutorId)
      .in('status', ['CONFIRMED', 'PENDING']) // Include both confirmed and pending
      .gte('selected_date_time', startOfToday.toISOString())
      .lte('selected_date_time', endOf7Days.toISOString());
    
    // Count only future bookings, but keep all for potential display
    let futureBookingsCount = 0;
    allNext7DaysBookings?.forEach(booking => {
      const bookingDateTime = new Date(booking.selected_date_time);
      const isFuture = bookingDateTime > now;
      
      // Debug individual bookings
      console.log('Booking filter debug:', {
        bookingId: booking.id,
        bookingTime: booking.selected_date_time,
        bookingDateTime: bookingDateTime.toISOString(),
        currentTime: now.toISOString(),
        isFuture,
        timeDiff: bookingDateTime.getTime() - now.getTime()
      });
      
      if (isFuture) {
        futureBookingsCount++;
      }
    });
    
    // Keep all bookings for display, but count only future ones
    const next7DaysBookings = allNext7DaysBookings || [];
    const next7DaysCount = futureBookingsCount;
      
    if (bookingsError) {
      console.error('Error fetching next 7 days bookings:', bookingsError);
    }
    
    console.log('Next 7 days bookings query result:', {
      tutorId,
      dateRange: `${startOfToday.toISOString()} to ${endOf7Days.toISOString()}`,
      totalBookingsInRange: allNext7DaysBookings?.length || 0,
      futureBookingsOnly: next7DaysBookings?.length || 0,
      currentTime: now.toISOString(),
      bookings: next7DaysBookings
    });

    // Get this month's earnings - only completed sessions count for earnings
    const { data: thisMonthBookings, error: earningsError } = await supabase
      .from('bookings')
      .select('total_price, status, selected_date_time')
      .eq('tutor_id', tutorId)
      .eq('status', 'COMPLETED') // Only completed sessions count for earnings
      .gte('selected_date_time', startOfMonth.toISOString())
      .lte('selected_date_time', endOfMonth.toISOString());
      
    if (earningsError) {
      console.error('Error fetching monthly earnings:', earningsError);
    }
    
    console.log('Monthly earnings query result:', {
      tutorId,
      monthRange: `${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`,
      bookingsFound: thisMonthBookings?.length || 0,
      totalEarnings: thisMonthBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0,
      bookings: thisMonthBookings
    });

    // Get total completed sessions
    const { data: completedSessions, error: completedError } = await supabase
      .from('bookings')
      .select('id, selected_date_time')
      .eq('tutor_id', tutorId)
      .eq('status', 'COMPLETED');
      
    if (completedError) {
      console.error('Error fetching completed sessions:', completedError);
    }
    
    console.log('Completed sessions query result:', {
      tutorId,
      completedFound: completedSessions?.length || 0,
      sessions: completedSessions
    });

    // Get actual available slots for the next 7 days (same period as bookings)
    
    // Get available time slots for the next 7 days from the new table
    let availableSlots = 0;
    const todayDate = startOfToday.toISOString().split('T')[0];
    const endDate = endOf7Days.toISOString().split('T')[0];
    
    try {
      const { data: allAvailableTimeSlots, error: timeSlotsError } = await supabase
        .from('tutor_time_slots')
        .select('id, date, start_time, is_available, is_booked')
        .eq('tutor_id', tutorId)
        .eq('is_available', true)
        .eq('is_booked', false)
        .gte('date', todayDate)
        .lte('date', endDate);
      
      if (!timeSlotsError && allAvailableTimeSlots) {
        // Count only future slots, but keep all for potential display
        let futureAvailableSlotsCount = 0;
        allAvailableTimeSlots.forEach(slot => {
          const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
          if (slotDateTime > now) {
            futureAvailableSlotsCount++;
          }
        });
        
        availableSlots = futureAvailableSlotsCount;
        console.log('Available slots from tutor_time_slots:', {
          tutorId,
          dateRange: `${todayDate} to ${endDate}`,
          totalSlotsInRange: allAvailableTimeSlots.length,
          futureSlotsOnly: availableSlots,
          currentTime: now.toISOString(),
          allSlots: allAvailableTimeSlots
        });
      } else {
        // Fallback: Use old estimation method if new table doesn't exist
        console.warn('Could not fetch from tutor_time_slots, using fallback calculation', timeSlotsError);
        const estimatedWeeklySlots = 70; // 10 hours/day * 7 days (8:00-18:00 = 10 timer per dag)
        const { data: next7DaysBookingsForSlots } = await supabase
          .from('bookings')
          .select('id')
          .eq('tutor_id', tutorId)
          .gte('selected_date_time', startOfToday.toISOString())
          .lte('selected_date_time', endOf7Days.toISOString());
        availableSlots = Math.max(0, estimatedWeeklySlots - (next7DaysBookingsForSlots?.length || 0));
      }
    } catch (error) {
      console.warn('Error fetching available slots:', error);
      availableSlots = 0;
    }

    // next7DaysCount already defined above as futureBookingsCount
    const monthlyEarnings = thisMonthBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
    const completedCount = completedSessions?.length || 0;

    // Debug logging
    console.log('Tutor Stats Debug:', {
      tutorId,
      next7DaysCount,
      availableSlots,
      monthlyEarnings,
      completedCount,
      availableSlotsDateRange: `${todayDate} to ${endDate}`
    });

    return {
      next7DaysBookings: next7DaysCount,
      nextWeekAvailableSlots: availableSlots,
      monthlyEarnings: monthlyEarnings, // Already in kroner, no conversion needed
      totalCompletedSessions: completedCount
    };
  }, [tutorId]);
};
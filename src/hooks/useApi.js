import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Generic hook for API calls
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || 'Request failed');
      }
    } catch (error) {
      setError(error.data?.error || error.message || 'Request failed');
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

// Hook for tutors data
export const useTutors = (siteMode = 'B2B') => {
  return useApi(() => api.tutors.getAll(siteMode), [siteMode]);
};

// Hook for single tutor
export const useTutor = (id, siteMode = 'B2B') => {
  return useApi(() => api.tutors.getById(id, siteMode), [id, siteMode]);
};

// Hook for availability
export const useAvailability = (tutorId, startDate, endDate) => {
  return useApi(
    () => api.availability.getAvailability(tutorId, startDate, endDate),
    [tutorId, startDate, endDate]
  );
};

// Hook for bookings
export const useBookings = (filters = {}) => {
  return useApi(() => api.bookings.getBookings(filters), [JSON.stringify(filters)]);
};

// Hook for mutations (create/update operations)
export const useMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (apiCall) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.error || 'Operation failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = error.data?.error || error.message || 'Operation failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error, clearError: () => setError(null) };
};

// Hook for booking creation
export const useCreateBooking = () => {
  const { mutate, loading, error, clearError } = useMutation();

  const createBooking = useCallback(async (bookingData) => {
    return await mutate(() => api.bookings.createBooking(bookingData));
  }, [mutate]);

  return { createBooking, loading, error, clearError };
};

// Hook for availability booking
export const useBookTimeSlot = () => {
  const { mutate, loading, error, clearError } = useMutation();

  const bookTimeSlot = useCallback(async (tutorId, date, time) => {
    return await mutate(() => api.availability.bookTimeSlot(tutorId, date, time));
  }, [mutate]);

  return { bookTimeSlot, loading, error, clearError };
};
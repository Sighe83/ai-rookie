// API Service for AI Rookie Backend - Vercel + Supabase
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
import { supabase, authHelpers } from './supabase.js';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token management using Supabase session
const tokenStorage = {
  get: async () => {
    try {
      const session = await authHelpers.getCurrentSession();
      return session?.access_token || null;
    } catch (error) {
      console.warn('Token storage get failed:', error);
      return null;
    }
  },
  set: () => {
    // Supabase handles token storage automatically
    console.log('Token storage is handled by Supabase');
  },
  remove: async () => {
    try {
      await authHelpers.signOut();
    } catch (error) {
      console.warn('Token storage remove failed:', error);
    }
  }
};

// API request helper with Supabase auth
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await tokenStorage.get();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      'Network error or server unavailable',
      0,
      { originalError: error.message }
    );
  }
};

// Auth API using Supabase + Vercel API
export const authApi = {
  login: async (email, password) => {
    // Use Supabase auth directly
    const authData = await authHelpers.signIn(email, password);
    
    // Also call API endpoint for any additional processing
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        ...response.data
      }
    };
  },

  register: async (userData) => {
    // Register via API endpoint (which handles both Supabase auth and profile creation)
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    return response;
  },

  getProfile: async () => {
    return await apiRequest('/auth/me');
  },

  updateProfile: async (userData) => {
    return await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  changePassword: async (newPassword) => {
    await authHelpers.updatePassword(newPassword);
    return { success: true, message: 'Password updated successfully' };
  },

  resetPassword: async (email) => {
    await authHelpers.resetPassword(email);
    return { success: true, message: 'Password reset email sent' };
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      await authHelpers.signOut();
    }
  },

  isAuthenticated: async () => {
    const session = await authHelpers.getCurrentSession();
    return !!session;
  },

  onAuthStateChange: (callback) => {
    return authHelpers.onAuthStateChange(callback);
  }
};

// Tutors API
export const tutorsApi = {
  getAll: async (siteMode = 'B2B') => {
    return await apiRequest('/tutors', {
      headers: {
        'x-site-mode': siteMode
      }
    });
  },

  getById: async (id, siteMode = 'B2B') => {
    return await apiRequest(`/tutors/${id}`, {
      headers: {
        'x-site-mode': siteMode
      }
    });
  }
};

// Availability API
export const availabilityApi = {
  getAvailability: async (tutorId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const endpoint = `/availability/${tutorId}${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  },

  updateAvailability: async (tutorId, date, timeSlots) => {
    return await apiRequest(`/availability/${tutorId}`, {
      method: 'POST',
      body: JSON.stringify({ date, timeSlots }),
    });
  },

  bookTimeSlot: async (tutorId, date, time) => {
    return await apiRequest(`/availability/${tutorId}/${date}/book`, {
      method: 'PATCH',
      body: JSON.stringify({ time }),
    });
  }
};

// Bookings API
export const bookingsApi = {
  getBookings: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const queryString = params.toString();
    const endpoint = `/bookings${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  },

  createBooking: async (bookingData) => {
    return await apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  getBooking: async (id) => {
    return await apiRequest(`/bookings/${id}`);
  },

  updateBookingStatus: async (id, status) => {
    return await apiRequest(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
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
export { ApiError, tokenStorage, supabase, authHelpers };

// Default export
const api = {
  auth: authApi,
  tutors: tutorsApi,
  availability: availabilityApi,
  bookings: bookingsApi,
  health: healthApi
};

export default api;
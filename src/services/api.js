// API Service for AI Rookie Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Safe localStorage for tokens
const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem('ai-rookie-token');
    } catch (error) {
      console.warn('Token storage get failed:', error);
      return null;
    }
  },
  set: (token) => {
    try {
      if (token) {
        localStorage.setItem('ai-rookie-token', token);
      } else {
        localStorage.removeItem('ai-rookie-token');
      }
    } catch (error) {
      console.warn('Token storage set failed:', error);
    }
  },
  remove: () => {
    try {
      localStorage.removeItem('ai-rookie-token');
    } catch (error) {
      console.warn('Token storage remove failed:', error);
    }
  }
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = tokenStorage.get();
  
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

// Auth API
export const authApi = {
  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data.token) {
      tokenStorage.set(response.data.token);
    }
    
    return response;
  },

  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.data.token) {
      tokenStorage.set(response.data.token);
    }
    
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

  changePassword: async (currentPassword, newPassword) => {
    return await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      tokenStorage.remove();
    }
  },

  isAuthenticated: () => {
    return !!tokenStorage.get();
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

// Health check
export const healthApi = {
  check: async () => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return await response.json();
    } catch (error) {
      throw new ApiError('Health check failed', 0, { originalError: error.message });
    }
  }
};

// Export utilities
export { ApiError, tokenStorage };

// Default export
const api = {
  auth: authApi,
  tutors: tutorsApi,
  availability: availabilityApi,
  bookings: bookingsApi,
  health: healthApi
};

export default api;
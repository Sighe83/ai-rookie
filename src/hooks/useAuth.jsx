import { useState, useEffect, createContext, useContext } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (authApi.isAuthenticated()) {
        try {
          const response = await authApi.getProfile();
          if (response.success) {
            setUser(response.data);
          }
        } catch (error) {
          console.warn('Failed to load user profile:', error);
          // Token might be expired, clear it
          await authApi.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authApi.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      
      return { success: false, error: response.error };
    } catch (error) {
      const errorMessage = error.data?.error || error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authApi.register(userData);
      if (response.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      
      return { success: false, error: response.error };
    } catch (error) {
      const errorMessage = error.data?.error || error.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await authApi.updateProfile(userData);
      if (response.success) {
        setUser(response.data);
        return { success: true, user: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      const errorMessage = error.data?.error || error.message || 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
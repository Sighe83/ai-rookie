import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

// Rate limiting for auth operations
const createRateLimit = (maxAttempts, windowMs) => {
  const attempts = new Map();
  
  return (key) => {
    const now = Date.now();
    const userAttempts = attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }
    
    recentAttempts.push(now);
    attempts.set(key, recentAttempts);
    return true; // Allow request
  };
};

// Rate limiter: max 3 attempts per 60 seconds
const authRateLimit = createRateLimit(3, 60000);

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
  const [initialized, setInitialized] = useState(false);
  const subscriptionRef = useRef(null);
  const mountedRef = useRef(true);

  // Safe user profile fetch with error handling
  const fetchUserProfile = useCallback(async (userId) => {
    if (!mountedRef.current) return null;
    
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('Profile fetch error:', error);
        return null;
      }
      
      return profile;
    } catch (error) {
      console.warn('Profile fetch failed:', error);
      return null;
    }
  }, []);

  // Initialize auth state from Supabase
  useEffect(() => {
    if (initialized) return; // Prevent multiple initializations
    
    const initAuth = async () => {
      try {
        if (!mountedRef.current) return;
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session fetch error:', error);
          return;
        }
        
        if (session?.user && mountedRef.current) {
          const profile = await fetchUserProfile(session.user.id);
          
          if (mountedRef.current) {
            setUser({
              ...session.user,
              ...profile
            });
          }
        }
      } catch (error) {
        console.warn('Failed to initialize auth:', error);
        if (mountedRef.current) {
          setError('Authentication initialization failed');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    // Cleanup any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Listen for auth changes with proper cleanup
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        try {
          if (session?.user && mountedRef.current) {
            const profile = await fetchUserProfile(session.user.id);
            
            if (mountedRef.current) {
              setUser({
                ...session.user,
                ...profile
              });
            }
          } else if (mountedRef.current) {
            setUser(null);
          }
        } catch (error) {
          console.warn('Auth state change error:', error);
        } finally {
          if (mountedRef.current) {
            setLoading(false);
          }
        }
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [initialized, fetchUserProfile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      if (!mountedRef.current) return { success: false, error: 'Component unmounted' };
      
      // Rate limiting check
      const rateLimitKey = `login_${email}`;
      if (!authRateLimit(rateLimitKey)) {
        const errorMsg = 'For mange login-forsøg. Prøv igen om 1 minut.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      setError(null);
      setLoading(true);
      
      // Validate inputs
      if (!email?.trim() || !password?.trim()) {
        throw new Error('Email og adgangskode er påkrævet');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        // Handle specific Supabase auth errors
        let errorMessage = 'Login fejlede';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Ugyldig email eller adgangskode';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email ikke bekræftet. Tjek din indbakke.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'For mange forsøg. Prøv igen senere.';
        } else {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (!mountedRef.current) return { success: false, error: 'Component unmounted' };

      // Get user profile with error handling
      const profile = await fetchUserProfile(data.user.id);
      
      if (!mountedRef.current) return { success: false, error: 'Component unmounted' };

      const userData = {
        ...data.user,
        ...profile
      };

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login fejlede';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      return { success: false, error: errorMessage };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const register = async (userData) => {
    try {
      if (!mountedRef.current) return { success: false, error: 'Component unmounted' };
      
      // Rate limiting check
      const rateLimitKey = `register_${userData.email}`;
      if (!authRateLimit(rateLimitKey)) {
        const errorMsg = 'For mange registrerings-forsøg. Prøv igen om 1 minut.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      setError(null);
      setLoading(true);
      
      // Validate inputs
      if (!userData.email?.trim() || !userData.password?.trim() || !userData.name?.trim()) {
        throw new Error('Email, adgangskode og navn er påkrævet');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email.trim(),
        password: userData.password,
        options: {
          data: {
            name: userData.name?.trim(),
            phone: userData.phone?.trim() || null,
            company: userData.company?.trim() || null,
            department: userData.department?.trim() || null
          }
        }
      });

      if (error) {
        // Handle specific Supabase auth errors
        let errorMessage = 'Registrering fejlede';
        if (error.message.includes('User already registered')) {
          errorMessage = 'Email er allerede registreret';
        } else if (error.message.includes('Password should be')) {
          errorMessage = 'Adgangskoden skal være mindst 6 tegn';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Ugyldig email adresse';
        } else {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (!mountedRef.current) return { success: false, error: 'Component unmounted' };

      // Create user profile in database
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              email: userData.email.trim(),
              name: userData.name.trim(),
              phone: userData.phone?.trim() || null,
              company: userData.company?.trim() || null,
              department: userData.department?.trim() || null,
              role: 'USER',
              site_mode: userData.siteMode || 'B2C',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);

          if (profileError) {
            console.warn('Profile creation failed:', profileError);
            // Don't fail registration if profile creation fails
          }
        } catch (profileError) {
          console.warn('Profile creation error:', profileError);
        }
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registrering fejlede';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      return { success: false, error: errorMessage };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const logout = async () => {
    try {
      if (!mountedRef.current) return;
      
      setError(null);
      await supabase.auth.signOut();
      
      if (mountedRef.current) {
        setUser(null);
      }
    } catch (error) {
      console.warn('Logout error:', error);
      if (mountedRef.current) {
        setError('Logout fejlede');
      }
    }
  };

  const updateProfile = async (userData) => {
    try {
      if (!mountedRef.current || !user) {
        return { success: false, error: 'Ikke logget ind' };
      }
      
      setError(null);
      
      // Validate inputs
      if (!userData.name?.trim()) {
        throw new Error('Navn er påkrævet');
      }
      
      // Update user profile in database
      const { data, error } = await supabase
        .from('users')
        .update({
          ...userData,
          name: userData.name?.trim(),
          phone: userData.phone?.trim() || null,
          company: userData.company?.trim() || null,
          department: userData.department?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (!mountedRef.current) return { success: false, error: 'Component unmounted' };

      const updatedUser = {
        ...user,
        ...data
      };

      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.message || 'Profil opdatering fejlede';
      if (mountedRef.current) {
        setError(errorMessage);
      }
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
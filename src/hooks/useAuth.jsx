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
  const initPromiseRef = useRef(null); // Track initialization promise to prevent multiple inits

  // Safe user profile fetch with error handling
  const fetchUserProfile = useCallback(async (userId) => {
    if (!mountedRef.current) return null;
    
    try {
      console.log('fetchUserProfile: Starting profile fetch for userId:', userId);
      
      // Add a shorter timeout to prevent hanging
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );
      
      const { data: profile, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('fetchUserProfile: Profile fetch result:', { 
        hasProfile: !!profile, 
        error: error?.message,
        errorCode: error?.code 
      });
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user profile doesn't exist yet
          console.log('fetchUserProfile: No profile found (PGRST116), will create from auth data');
          return null;
        } else {
          console.warn('Profile fetch error:', error);
          return null;
        }
      }
      
      console.log('fetchUserProfile: Profile fetch successful, returning profile');
      return profile;
    } catch (error) {
      console.warn('Profile fetch failed:', error);
      return null;
    }
  }, []);

  // Initialize auth state from Supabase
  useEffect(() => {
    if (initialized || initPromiseRef.current) return; // Prevent multiple initializations
    
    mountedRef.current = true;
    
    console.log('useAuth: Starting initialization...');
    
    const initAuth = async () => {
      console.log('useAuth: Initializing auth state...');
      
      try {
        if (!mountedRef.current) {
          console.log('useAuth: Component unmounted during init, aborting');
          return;
        }

        // Check if Supabase is available
        if (!supabase) {
          console.error('useAuth: Supabase client not available');
          if (mountedRef.current) {
            setError('Authentication service unavailable');
            setLoading(false);
            setInitialized(true);
          }
          return;
        }
        
        // First check for existing session
        console.log('useAuth: Fetching session from Supabase...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session check error:', sessionError);
          if (mountedRef.current) {
            setError(sessionError.message);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user && mountedRef.current) {
          console.log('useAuth: Found existing session for user:', session.user.email);
          
          // Fetch user profile from database
          const profile = await fetchUserProfile(session.user.id);
          
          if (mountedRef.current) {
            if (!profile) {
              console.warn('No profile found during init, using auth data only');
              const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || session.user.email;
              console.log('Setting user name during init to:', userName);
              setUser({
                id: session.user.id,
                email: session.user.email,
                name: userName,
                role: 'USER',
                site_mode: session.user.user_metadata?.site_mode || 'B2C',
                phone: null,
                company: null,
                department: null
              });
            } else {
              // Ensure name is always set, fallback to email if missing from profile
              const userName = profile.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || session.user.email;
              console.log('Setting user name from profile during init to:', userName);
              setUser({
                ...profile,
                name: userName
              });
            }
            setError(null);
            console.log('useAuth: User state set during initialization');
          }
        } else {
          console.log('useAuth: No existing session found');
        }
        
        // Set up auth state listener
        if (mountedRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('useAuth: Auth state changed:', event, session?.user?.email);
              
              if (!mountedRef.current) return;
              
              if (event === 'SIGNED_IN' && session?.user) {
                // Fetch fresh profile data
                const profile = await fetchUserProfile(session.user.id);
                
                if (mountedRef.current) {
                  if (!profile) {
                    const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || session.user.email;
                    setUser({
                      id: session.user.id,
                      email: session.user.email,
                      name: userName,
                      role: 'USER',
                      site_mode: session.user.user_metadata?.site_mode || 'B2C',
                      phone: null,
                      company: null,
                      department: null
                    });
                  } else {
                    const userName = profile.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || session.user.email;
                    setUser({
                      ...profile,
                      name: userName
                    });
                  }
                  setError(null);
                }
              } else if (event === 'SIGNED_OUT') {
                if (mountedRef.current) {
                  setUser(null);
                  setError(null);
                }
              } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                console.log('useAuth: Token refreshed successfully');
                // Optionally refresh user profile
              }
            }
          );
          
          subscriptionRef.current = subscription;
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mountedRef.current) {
          setError(error.message);
        }
      } finally {
        // Always set initialized to true to prevent app from hanging
        if (mountedRef.current) {
          console.log('useAuth: Setting loading=false and initialized=true');
          setLoading(false);
          setInitialized(true);
        }
        initPromiseRef.current = null;
      }
    };

    initPromiseRef.current = initAuth();

    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [fetchUserProfile]);

  // Cleanup on unmount - set mountedRef to false and cleanup subscription
  useEffect(() => {
    return () => {
      console.log('useAuth: Component unmounting, setting mountedRef to false');
      mountedRef.current = false;
      initPromiseRef.current = null;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run on final unmount

  const login = async (email, password) => {
    try {
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
      
      console.log('useAuth: Attempting Supabase login with:', { 
        email: email.trim(), 
        passwordLength: password?.length,
        hasPassword: !!password
      });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      console.log('useAuth: Supabase response:', { 
        success: !error, 
        error: error?.message,
        errorCode: error?.code,
        user: data?.user?.id,
        fullError: error
      });

      if (error) {
        // Handle specific Supabase auth errors
        let errorMessage = 'Login fejlede';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Ugyldig email eller adgangskode';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Du skal bekræfte din email før du kan logge ind. Tjek din indbakke og klik på bekræftelseslinket.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'For mange forsøg. Prøv igen senere.';
        } else {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      console.log('useAuth: Checking if component is mounted:', mountedRef.current);
      if (!mountedRef.current) {
        console.warn('useAuth: Component unmounted during login, but continuing with login process');
        // Don't abort - let the login complete and rely on the auth state change listener
        // to update the user state when the component remounts
      }

      // Set user state if component is still mounted, otherwise let auth state change handle it
      if (data.user) {
        if (mountedRef.current) {
          const profile = await fetchUserProfile(data.user.id);
          if (mountedRef.current) {
            const userName = profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || data.user.email;
            setUser({
              ...data.user,
              ...profile,
              name: userName
            });
            console.log('Login successful, user state updated.');
          }
        } else {
          console.log('Login successful, but component unmounted. Auth state change listener will handle user state.');
        }
      }
      
      return { success: true };
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
      // Rate limiting check
      const rateLimitKey = `register_${userData.email}`;
      if (!authRateLimit(rateLimitKey)) {
        const errorMsg = 'For mange registrerings-forsøg. Prøv igen om 1 minut.';
        if (mountedRef.current) {
          setError(errorMsg);
        }
        return { success: false, error: errorMsg };
      }
      
      if (mountedRef.current) {
        setError(null);
        setLoading(true);
      }
      
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
            department: userData.department?.trim() || null,
            site_mode: userData.siteMode || 'B2C'
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

      if (!mountedRef.current) return { success: false, error: null };

      // User profile is automatically created by database trigger with all fields
      // No need for additional update since trigger handles everything
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
      
      // Update user profile in database - explicit fields only (no userId)
      const { data, error } = await supabase
        .from('users')
        .update({
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

      if (!mountedRef.current) return { success: false, error: null };

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

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!mountedRef.current || !user) {
        return { success: false, error: 'Ikke logget ind' };
      }
      
      setError(null);
      
      // Validate inputs
      if (!currentPassword?.trim() || !newPassword?.trim()) {
        throw new Error('Både nuværende og ny adgangskode er påkrævet');
      }
      
      if (newPassword.length < 6) {
        throw new Error('Ny adgangskode skal være mindst 6 tegn');
      }

      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (verifyError) {
        if (verifyError.message.includes('Invalid login credentials')) {
          throw new Error('Nuværende adgangskode er forkert');
        }
        throw new Error('Kunne ikke verificere nuværende adgangskode');
      }
      
      // Now update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        // Handle specific Supabase auth errors
        let errorMessage = 'Adgangskode opdatering fejlede';
        if (error.message.includes('New password should be different')) {
          errorMessage = 'Ny adgangskode skal være forskellig fra den nuværende';
        } else if (error.message.includes('Password should be')) {
          errorMessage = 'Adgangskoden skal være mindst 6 tegn';
        } else {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (!mountedRef.current) return { success: false, error: null };

      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      const errorMessage = error.message || 'Adgangskode ændring fejlede';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  };

  const validateUserSiteMode = (currentSiteMode) => {
    // Check if user should be on this site mode
    if (user && user.site_mode && user.site_mode !== currentSiteMode.toUpperCase()) {
      return {
        shouldRedirect: true,
        correctSiteMode: user.site_mode.toLowerCase()
      };
    }
    return { shouldRedirect: false };
  };

  const value = {
    user,
    loading,
    error,
    initialized, // Ny property
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    validateUserSiteMode,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
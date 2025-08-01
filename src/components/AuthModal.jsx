import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff, Mail, Lock, User, Building, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import EmailConfirmation from './EmailConfirmation.jsx';

// Helper function to get theme colors based on user type and site mode
const getThemeColors = (siteMode, user) => {
  const isTutor = user?.role === 'TUTOR';
  const isB2B = siteMode === 'b2b';
  
  if (isTutor) {
    return {
      primary: 'bg-purple-600',
      primaryHover: 'hover:bg-purple-700'
    };
  }
  
  if (isB2B) {
    return {
      primary: 'bg-green-600',
      primaryHover: 'hover:bg-green-700'
    };
  }
  
  return {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700'
  };
};

const AuthModal = ({ isOpen, onClose, initialMode = 'signup', siteMode = 'b2b' }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', or 'email-confirmation'
  const [showPassword, setShowPassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false); // Track if user needs to create account
  const [confirmationEmail, setConfirmationEmail] = useState(''); // Store email for confirmation page
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    company: '',
    department: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, error: authError, clearError, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = getThemeColors(siteMode, user);
  
  const isB2B = siteMode === 'b2b';

  // Initialize mode on first mount
  React.useEffect(() => {
    setMode(initialMode);
    console.log('AuthModal: Initialized with mode:', initialMode);
  }, []); // Only run once on mount

  // Reset form when modal closes - but preserve mode for better UX
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        password: '',
        name: '',
        phone: '',
        company: '',
        department: ''
      });
      setErrors({});
      setIsSubmitting(false);
      // ✅ DON'T reset mode - let user return to their last chosen mode
      // Only reset mode if coming from email confirmation
      if (mode === 'email-confirmation') {
        setMode('login'); // After email confirmation, show login
      }
      setConfirmationEmail(''); // Reset confirmation email
      clearError();
    }
  }, [isOpen, clearError, mode]);

  React.useEffect(() => {
    console.log('AuthModal: Mode changed to:', mode);
    setErrors({});
    setIsNewUser(false);
    // Don't clear authError when switching modes to preserve error messages
    // Don't clear form data when switching modes to preserve email
  }, [mode]);

  // Close modal and redirect when user becomes authenticated
  React.useEffect(() => {
    if (isAuthenticated && isOpen) {
      console.log('AuthModal: User is authenticated, closing modal and redirecting to dashboard.');
      onClose();
      const isTutor = user?.role === 'TUTOR';
      navigate(isTutor ? '/tutor-dashboard' : '/dashboard');
    }
  }, [isAuthenticated, isOpen, onClose, navigate, user]);


  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear auth errors when user starts typing
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get actual DOM values (handles Chrome autofill correctly)
    const formElement = e.target;
    const emailInput = formElement.querySelector('input[name="email"]');
    const passwordInput = formElement.querySelector('input[name="password"]');
    
    const actualEmail = emailInput?.value || formData.email;
    const actualPassword = passwordInput?.value || formData.password;
    
    // Update formData with actual values for validation
    const actualFormData = {
      ...formData,
      email: actualEmail,
      password: actualPassword
    };
    
    // Validate using actual values
    const newErrors = {};
    
    // Email validation
    if (!actualEmail?.trim()) {
      newErrors.email = 'Email er påkrævet';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actualEmail)) {
      newErrors.email = 'Indtast en gyldig email adresse';
    }

    // Password validation
    if (!actualPassword?.trim()) {
      newErrors.password = 'Adgangskode er påkrævet';
    } else if (mode === 'signup' && actualPassword.length < 6) {
      newErrors.password = 'Adgangskode skal være mindst 6 tegn';
    }

    // Name validation for signup
    if (mode === 'signup') {
      if (!actualFormData.name?.trim()) {
        newErrors.name = 'Navn er påkrævet';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      let result;
      if (mode === 'login') {
        result = await login(actualEmail, actualPassword);
        
        // Handle login errors with better UX
        if (!result.success) {
          console.error('Login failed with error:', result.error);
          
          if (result.error?.includes('Invalid login credentials') || result.error?.includes('Ugyldig email eller adgangskode')) {
            setErrors({ 
              general: 'Forkert email eller adgangskode. Tjek dine oplysninger og prøv igen.',
              email: '',
              password: ''
            });
          } else if (result.error?.includes('Email not confirmed') || result.error?.includes('ikke bekræftet')) {
            setErrors({ 
              general: 'Din email er ikke bekræftet endnu. Tjek din indbakke og klik på bekræftelseslinket, så kan du logge ind.',
              email: '',
              password: ''
            });
          } else if (result.error?.includes('Too many requests') || result.error?.includes('mange forsøg')) {
            setErrors({ 
              general: 'For mange login-forsøg. Vent et par minutter og prøv igen.',
              email: '',
              password: ''
            });
          } else if (result.error?.includes('User not found') || result.error?.includes('ikke fundet')) {
            setErrors({ 
              email: 'Denne email er ikke registreret. Vil du oprette en konto?',
              password: ''
            });
            setIsNewUser(true);
          } else {
            setErrors({ 
              general: result.error || 'Login fejlede. Prøv igen.',
              email: '',
              password: ''
            });
          }
          setIsSubmitting(false);
          return;
        }
      } else {
        result = await register({
          email: actualEmail,
          password: actualPassword,
          name: actualFormData.name,
          phone: actualFormData.phone,
          company: isB2B ? actualFormData.company : '',
          department: isB2B ? actualFormData.department : '',
          siteMode: siteMode.toUpperCase()
        });
        
        if (result.success) {
          setConfirmationEmail(actualEmail);
          setMode('email-confirmation');
          setIsSubmitting(false);
          return;
        }
        
        if (!result.success) {
          if (result.error?.includes('User already registered') || result.error?.includes('allerede registreret')) {
            setErrors({ 
              email: 'Denne email er allerede registreret. Prøv at logge ind i stedet.',
              general: ''
            });
          } else if (result.error?.includes('Password should be') || result.error?.includes('Adgangskoden skal')) {
            setErrors({ 
              password: 'Adgangskoden skal være mindst 6 tegn lang.',
              general: ''
            });
          } else if (result.error?.includes('Invalid email') || result.error?.includes('Ugyldig email')) {
            setErrors({ 
              email: 'Indtast en gyldig email adresse.',
              general: ''
            });
          } else if (result.error?.includes('Signup is disabled')) {
            setErrors({ 
              general: 'Kontooprettelse er midlertidigt deaktiveret. Kontakt support.',
              email: ''
            });
          } else {
            setErrors({ 
              general: result.error || 'Kontooprettelse fejlede. Prøv igen.',
              email: ''
            });
          }
          setIsSubmitting(false);
          return;
        }
      }

      if (result.success && mode === 'login') {
        console.log('AuthModal: Login successful, waiting for user state to update');
        // On successful login, we don't need to do anything here.
        // The useEffect hook will detect the authentication and close the modal.
        // We leave isSubmitting as true to show the loading spinner until the modal closes.
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Der opstod en uventet fejl. Prøv igen.' });
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = () => {
    setMode('signup');
    setIsNewUser(false);
    setErrors({});
  };

  const handleBackToLogin = () => {
    console.log('AuthModal: handleBackToLogin called, switching to login mode');
    setMode('login');
    setConfirmationEmail('');
    setErrors({});
    setIsNewUser(false);
  };

  if (!isOpen) return null;

  // Show email confirmation screen
  if (mode === 'email-confirmation') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>
          <EmailConfirmation 
            email={confirmationEmail}
            onBackToLogin={handleBackToLogin}
            siteMode={siteMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">
              {mode === 'login' ? 'Velkommen tilbage' : `Kom i gang med AI Rookie${isB2B ? ' Enterprise' : ''}`}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-slate-400 text-sm">
            {mode === 'login' 
              ? 'Log ind for at fortsætte din AI-rejse'
              : isB2B 
                ? 'Få adgang til ekspertviden og workshops der driver resultater'
                : 'Start din personlige AI-læring med erfarne tutorer'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Messages */}
          {(authError || errors.general) && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{authError || errors.general}</p>
            </div>
          )}

          {/* Name field (signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fulde navn *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full bg-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border border-red-500' : ''
                  }`}
                  placeholder="Dit fulde navn"
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name}</p>
              )}
            </div>
          )}


          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full bg-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border border-red-500' : ''
                }`}
                placeholder="din@email.dk"
              />
            </div>
            {errors.email && (
              <div className="mt-1">
                <p className="text-red-400 text-xs">{errors.email}</p>
                {isNewUser && (
                  <button
                    type="button"
                    onClick={handleCreateAccount}
                    className={`mt-2 text-xs ${isB2B ? 'text-green-400 hover:text-green-300' : 'text-blue-400 hover:text-blue-300'} underline`}
                  >
                    Ja, opret en konto med denne email
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Adgangskode *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full bg-slate-700 rounded-md py-2 pl-10 pr-10 text-white focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border border-red-500' : ''
                }`}
                placeholder={mode === 'signup' ? 'Mindst 6 tegn' : 'Din adgangskode'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Additional fields for signup */}
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full bg-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="+45 12 34 56 78"
                />
              </div>

              {/* B2B specific fields */}
              {isB2B && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Virksomhed
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full bg-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Virksomhedens navn"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Afdeling
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="w-full bg-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Marketing, Sales, IT, etc."
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full ${theme.primary} ${theme.primaryHover} text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {mode === 'login' ? 'Logger ind...' : 'Opretter konto...'}
              </>
            ) : (
              mode === 'login' ? 'Log ind' : 'Kom i gang nu'
            )}
          </button>

          {/* Switch mode */}
          <div className="text-center border-t border-slate-700 pt-4">
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Ny bruger?' : 'Har du allerede en konto?'}
              <button
                type="button"
                onClick={() => {
                  const newMode = mode === 'login' ? 'signup' : 'login';
                  console.log('AuthModal: Mode switch button clicked, changing from', mode, 'to', newMode);
                  setMode(newMode);
                }}
                className={`${isB2B ? 'text-green-400 hover:text-green-300' : 'text-blue-400 hover:text-blue-300'} ml-2 font-medium underline`}
              >
                {mode === 'login' ? 'Kom i gang her' : 'Log ind her'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
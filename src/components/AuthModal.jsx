import React, { useState } from 'react';
import { X, Eye, EyeOff, Mail, Lock, User, Building, Briefcase } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

const AuthModal = ({ isOpen, onClose, initialMode = 'login', siteMode = 'b2b' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [showPassword, setShowPassword] = useState(false);
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

  const { login, register, error: authError, clearError } = useAuth();
  
  const isB2B = siteMode === 'b2b';

  // Reset form when modal closes or mode changes
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
      clearError();
    }
  }, [isOpen, clearError]);

  React.useEffect(() => {
    setErrors({});
    clearError();
  }, [mode, clearError]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email?.trim()) {
      newErrors.email = 'Email er påkrævet';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Indtast en gyldig email adresse';
    }

    // Password validation
    if (!formData.password?.trim()) {
      newErrors.password = 'Adgangskode er påkrævet';
    } else if (mode === 'signup' && formData.password.length < 6) {
      newErrors.password = 'Adgangskode skal være mindst 6 tegn';
    }

    // Name validation for signup
    if (mode === 'signup') {
      if (!formData.name?.trim()) {
        newErrors.name = 'Navn er påkrævet';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    clearError();

    try {
      let result;
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          company: isB2B ? formData.company : '',
          department: isB2B ? formData.department : '',
          siteMode: siteMode.toUpperCase()
        });
      }

      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' ? 'Log ind' : `Opret ${isB2B ? 'virksomheds' : 'personlig'} konto`}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Messages */}
          {authError && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-3">
              <p className="text-red-200 text-sm">{authError}</p>
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
              <p className="text-red-400 text-xs mt-1">{errors.email}</p>
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
            className={`w-full ${isB2B ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {mode === 'login' ? 'Logger ind...' : 'Opretter konto...'}
              </>
            ) : (
              mode === 'login' ? 'Log ind' : 'Opret konto'
            )}
          </button>

          {/* Switch mode */}
          <div className="text-center border-t border-slate-700 pt-4">
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Har du ikke en konto?' : 'Har du allerede en konto?'}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className={`${isB2B ? 'text-green-400 hover:text-green-300' : 'text-blue-400 hover:text-blue-300'} ml-2 font-medium`}
              >
                {mode === 'login' ? 'Opret konto' : 'Log ind'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
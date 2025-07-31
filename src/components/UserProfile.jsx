import React, { useState } from 'react';
import { User, Mail, Phone, Building, Briefcase, Lock, Save, X, Edit, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

const UserProfile = ({ isOpen, onClose, siteMode = 'b2b' }) => {
  const { user, updateProfile, logout, changePassword } = useAuth();
  const isB2B = siteMode === 'b2b';
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(() => ({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
    department: user?.department || '',
    lastUserId: user?.id || null // Tracking only, not sent to database
  }));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
  const timeoutRef = React.useRef(null);
  const passwordTimeoutRef = React.useRef(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Calculate profile completion percentage
  const getCompletionPercentage = () => {
    if (!formData) return 0;
    
    const fields = ['name', 'phone'];
    if (isB2B) {
      fields.push('company', 'department');
    }
    
    const filledFields = fields.filter(field => formData[field]?.trim());
    return Math.round((filledFields.length / fields.length) * 100);
  };

  // Only update form data when user changes significantly (like login/logout)
  React.useEffect(() => {
    if (user && user.id !== formData.lastUserId) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        company: user.company || '',
        department: user.department || '',
        lastUserId: user.id // Track which user this data belongs to
      });
    }
  }, [user]);

  // Reset editing state when modal closes and cleanup timeouts
  React.useEffect(() => {
    if (!isOpen) {
      // Clear any active timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      
      // Modal closed - reset for next time
      setIsEditing(false);
      setErrors({});
      setSuccessMessage('');
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setPasswordSuccessMessage('');
    }
  }, [isOpen]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
      }
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Navn er påkrævet';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone?.trim()) {
      // Remove all spaces and non-digit characters except +
      const cleanPhone = formData.phone.replace(/[^\d+]/g, '');
      
      // Danish phone number patterns:
      // +4512345678, +45 12 34 56 78, 12345678, 12 34 56 78
      const phoneRegex = /^(\+45)?[2-9]\d{7}$/;
      
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Indtast et gyldigt dansk telefonnummer (8 cifre, evt. med +45)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Check if form is dirty (different from original user data)
      const isDirty = newData.name !== (user?.name || '') ||
                     newData.phone !== (user?.phone || '') ||
                     newData.company !== (user?.company || '') ||
                     newData.department !== (user?.department || '');
      
      setIsFormDirty(isDirty);
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrors({});

    try {
      const result = await updateProfile(formData);
      
      if (result.success) {
        setIsEditing(false);
        setIsFormDirty(false);
        setSuccessMessage('Profil opdateret succesfuldt');
        timeoutRef.current = setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // Handle updateProfile errors
        setErrors({
          general: result.error || 'Profil opdatering fejlede. Prøv igen.'
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrors({
        general: 'Der opstod en uventet fejl. Prøv igen senere.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    // Current password validation
    if (!passwordData.currentPassword?.trim()) {
      newErrors.currentPassword = 'Nuværende adgangskode er påkrævet';
    }

    // New password validation
    if (!passwordData.newPassword?.trim()) {
      newErrors.newPassword = 'Ny adgangskode er påkrævet';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Ny adgangskode skal være mindst 6 tegn';
    }

    // Confirm password validation
    if (!passwordData.confirmPassword?.trim()) {
      newErrors.confirmPassword = 'Bekræft ny adgangskode';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Adgangskoderne er ikke ens';
    }

    // Check if new password is same as current (basic check)
    if (passwordData.currentPassword && passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'Ny adgangskode skal være forskellig fra den nuværende';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    setPasswordSuccessMessage('');
    setPasswordErrors({});

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        setPasswordSuccessMessage('Adgangskode ændret succesfuldt');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        passwordTimeoutRef.current = setTimeout(() => {
          setPasswordSuccessMessage('');
          setShowPasswordChange(false);
        }, 2000);
      } else {
        setPasswordErrors({
          general: result.error || 'Adgangskode ændring fejlede. Prøv igen.'
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordErrors({
        general: 'Der opstod en uventet fejl. Prøv igen senere.'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Min Profil</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-900/50 border border-green-600 rounded-lg p-3">
              <p className="text-green-200 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Visual editing indicator */}
          {isEditing && (
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-400" />
                <p className="text-blue-200 text-sm">Du redigerer din profil</p>
              </div>
            </div>
          )}

          {/* Progress indicator for form completion */}
          {isEditing && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Profil fuldendthed</span>
                <span>{getCompletionPercentage()}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${isB2B ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${getCompletionPercentage()}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">{user.name}</h3>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.role === 'ADMIN' ? 'bg-purple-600 text-white' :
                user.role === 'TUTOR' ? 'bg-blue-600 text-white' :
                'bg-gray-600 text-white'
              }`}>
                {user.role === 'ADMIN' ? 'Administrator' :
                 user.role === 'TUTOR' ? 'Tutor' : 'Kunde'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.site_mode === 'B2B' ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
              }`}>
                {user.site_mode}
              </span>
            </div>
          </div>

          {/* Error Messages */}
          {errors.general && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 flex items-start gap-2">
              <div className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5">⚠</div>
              <p className="text-red-200 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSave} className="space-y-6 md:space-y-4">
            {/* Name */}
            <div className={`transition-all duration-200 ${isEditing ? 'ring-1 ring-blue-500/20 rounded-lg p-1' : ''}`}>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fulde navn *
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors
                  ${isEditing ? 'text-blue-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full bg-slate-700 rounded-lg py-3 pl-11 pr-12 text-white transition-all duration-200
                    ${isEditing
                      ? 'focus:ring-2 focus:ring-blue-500 focus:bg-slate-600 border-transparent'
                      : 'opacity-60 cursor-not-allowed'
                    }
                    ${errors.name ? 'ring-2 ring-red-500' : ''}
                  `}
                  placeholder="Dit fulde navn"
                />
                {/* Success indicator */}
                {isEditing && formData.name && !errors.name && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                )}
              </div>
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-slate-700 rounded-md py-2 pl-10 pr-3 text-white opacity-60 cursor-not-allowed"
                />
              </div>
              <p className="text-slate-400 text-xs mt-1">Email kan ikke ændres</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Telefon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    // Auto-format phone number as user types
                    let value = e.target.value;
                    
                    // Remove all non-digits except +
                    const cleaned = value.replace(/[^\d+]/g, '');
                    
                    // Format Danish phone numbers
                    if (cleaned.startsWith('+45')) {
                      const number = cleaned.slice(3);
                      if (number.length <= 8) {
                        value = '+45 ' + number.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
                      }
                    } else if (cleaned.length <= 8) {
                      value = cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
                    }
                    
                    handleInputChange('phone', value);
                  }}
                  disabled={!isEditing}
                  className={`w-full bg-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-blue-500 ${
                    !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                  } ${errors.phone ? 'border border-red-500' : ''}`}
                  placeholder="+45 12 34 56 78"
                />
              </div>
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Company - B2B only */}
            {isB2B && (
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
                    disabled={!isEditing}
                    className={`w-full bg-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-blue-500 ${
                      !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    placeholder="Virksomhedens navn"
                  />
                </div>
              </div>
            )}

            {/* Department - B2B only */}
            {isB2B && (
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
                    disabled={!isEditing}
                    className={`w-full bg-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-blue-500 ${
                      !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    placeholder="Marketing, Sales, IT, etc."
                  />
                </div>
              </div>
            )}

            {/* Improved Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-600">
              {isEditing ? (
                <>
                  {/* Primary Action - Save */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !isFormDirty || Object.keys(errors).length > 0}
                    className={`flex-1 min-h-[44px] text-base font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2
                      focus:ring-offset-slate-800 shadow-lg hover:shadow-xl ${isSubmitting ? 'cursor-wait' : ''}
                      ${Object.keys(errors).length > 0 ? 'bg-red-600 cursor-not-allowed' :
                        !isFormDirty ? 'bg-gray-600 cursor-not-allowed' :
                        isB2B ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                      } text-white`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Gemmer...
                      </>
                    ) : Object.keys(errors).length > 0 ? (
                      'Ret fejl først'
                    ) : !isFormDirty ? (
                      'Ingen ændringer'
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Gem ændringer
                      </>
                    )}
                  </button>

                  {/* Secondary Action - Cancel */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isFormDirty) {
                        const confirmReset = window.confirm('Du har ugemte ændringer. Er du sikker på at du vil annullere?');
                        if (!confirmReset) return;
                      }
                      
                      setIsEditing(false);
                      setFormData({
                        name: user.name || '',
                        phone: user.phone || '',
                        company: user.company || '',
                        department: user.department || '',
                        lastUserId: user.id
                      });
                      setErrors({});
                      setSuccessMessage('');
                      setIsFormDirty(false);
                    }}
                    className="flex-1 min-h-[44px] text-base bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 px-6 rounded-lg
                    transition-all duration-200 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                  >
                    Annuller
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`w-full min-h-[44px] text-base font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                  focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-lg hover:shadow-xl
                  ${isB2B ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'} text-white`}
                >
                  <Edit className="w-5 h-5" />
                  Rediger profil
                </button>
              )}
            </div>
          </form>

          {/* Password Change Section */}
          {showPasswordChange ? (
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Skift adgangskode</h3>
              
              {/* Password Success Message */}
              {passwordSuccessMessage && (
                <div className="bg-green-900/50 border border-green-600 rounded-lg p-3 mb-4">
                  <p className="text-green-200 text-sm">{passwordSuccessMessage}</p>
                </div>
              )}

              {/* Password Error Messages */}
              {passwordErrors.general && (
                <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <div className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5">⚠</div>
                  <p className="text-red-200 text-sm">{passwordErrors.general}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Nuværende adgangskode
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                    disabled={isChangingPassword}
                    className={`w-full bg-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      passwordErrors.currentPassword ? 'border border-red-500' : ''
                    }`}
                    placeholder="Indtast nuværende adgangskode"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-red-400 text-xs mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Ny adgangskode
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    disabled={isChangingPassword}
                    className={`w-full bg-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      passwordErrors.newPassword ? 'border border-red-500' : ''
                    }`}
                    placeholder="Mindst 6 tegn"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-400 text-xs mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Bekræft ny adgangskode
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    disabled={isChangingPassword}
                    className={`w-full bg-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      passwordErrors.confirmPassword ? 'border border-red-500' : ''
                    }`}
                    placeholder="Gentag ny adgangskode"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                    className={`flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isChangingPassword ? 'cursor-wait' : ''}`}
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Skifter...
                      </>
                    ) : (
                      'Skift adgangskode'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({currentPassword: '', newPassword: '', confirmPassword: ''});
                      setPasswordErrors({});
                      setPasswordSuccessMessage('');
                    }}
                    disabled={isChangingPassword}
                    className="flex-1 bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuller
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Account Actions */
            <div className="border-t border-slate-700 pt-4 space-y-3">
              <button
                type="button"
                onClick={() => setShowPasswordChange(true)}
                className="w-full bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Skift adgangskode
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Log ud
              </button>
            </div>
          )}

          {/* Account Info */}
          <div className="text-xs text-slate-400 text-center">
            {(() => {
              try {
                const createdDate = user.created_at ? new Date(user.created_at) : null;
                if (createdDate && !isNaN(createdDate.getTime())) {
                  return `Medlem siden ${createdDate.toLocaleDateString('da-DK')}`;
                }
                return 'Medlem siden ukendt dato';
              } catch (error) {
                console.warn('Error formatting created_at date:', error);
                return 'Medlem siden ukendt dato';
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
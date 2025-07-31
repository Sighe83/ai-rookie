import React, { useState } from 'react';
import { User, Mail, Phone, Building, Briefcase, Lock, Save, X } from 'lucide-react';
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
    userId: user?.id || null
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

  // Only update form data when user changes significantly (like login/logout)
  React.useEffect(() => {
    if (user && user.id !== formData.userId) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        company: user.company || '',
        department: user.department || '',
        userId: user.id // Track which user this data belongs to
      });
    }
  }, [user, formData.userId]);

  // Reset editing state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
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

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Navn er påkrævet';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone?.trim()) {
      const phoneRegex = /^(\+45\s?)?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2}|\d{8})$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Indtast et gyldigt dansk telefonnummer (f.eks. +45 12 34 56 78 eller 12345678)';
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
        setSuccessMessage('Profil opdateret succesfuldt');
        setTimeout(() => setSuccessMessage(''), 3000);
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
        setTimeout(() => {
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
      <div className="bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
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
          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
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
                  disabled={!isEditing}
                  className={`w-full bg-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-blue-500 ${
                    !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                  } ${errors.name ? 'border border-red-500' : ''}`}
                  placeholder="Dit fulde navn"
                />
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
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full bg-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-blue-500 ${
                    !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 ${isB2B ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'cursor-wait' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Gemmer...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Godkend redigering
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name || '',
                        phone: user.phone || '',
                        company: user.company || '',
                        department: user.department || '',
                        userId: user.id
                      });
                      setErrors({});
                      setSuccessMessage('');
                    }}
                    className="flex-1 bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Annuller
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`flex-1 ${isB2B ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded-lg transition-colors`}
                >
                  Rediger Profil
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
            Medlem siden {new Date(user.created_at).toLocaleDateString('da-DK')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
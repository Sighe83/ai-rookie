import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building, Briefcase } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

// Design System imports
import {
  Modal,
  Button,
  Input,
  PasswordInput,
  FormField,
  NavigationTabs,
  Alert,
  useToast,
  useTheme
} from './design-system';

// Refactored AuthModal using Design System
const AuthModalRefactored = ({ isOpen, onClose, initialMode = 'signup', siteMode = 'b2b' }) => {
  const [mode, setMode] = useState(initialMode);
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
  const { success, error } = useToast();
  const { colors } = useTheme();
  
  const isB2B = siteMode === 'b2b';

  React.useEffect(() => {
    if (isAuthenticated && isOpen) {
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
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
    if (mode === 'signup' && !formData.name?.trim()) {
      newErrors.name = 'Navn er påkrævet';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      let result;
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
        
        if (result.success) {
          success('Login succesfuldt!');
        } else {
          if (result.error?.includes('Invalid login credentials')) {
            error('Forkert email eller adgangskode');
          } else if (result.error?.includes('Email not confirmed')) {
            error('Din email er ikke bekræftet endnu');
          } else {
            error('Login fejlede. Prøv igen.');
          }
        }
      } else {
        result = await register(formData);
        
        if (result.success) {
          success('Konto oprettet! Tjek din email for bekræftelse.');
          setMode('email-confirmation');
        } else {
          error(result.error || 'Registrering fejlede. Prøv igen.');
        }
      }
    } catch (err) {
      error('Der opstod en fejl. Prøv igen senere.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'login', label: 'Log ind' },
    { id: 'signup', label: 'Opret konto' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Log ind' : 'Opret konto'}
      size="md"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <NavigationTabs
          tabs={tabs}
          activeTab={mode}
          onTabChange={setMode}
          variant="underlined"
        />

        {/* Auth Error Alert */}
        {authError && (
          <Alert type="error" onClose={clearError}>
            {authError}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <FormField label="Fulde navn" error={errors.name} required>
              <Input
                icon={User}
                placeholder="Dit fulde navn"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
              />
            </FormField>
          )}

          <FormField label="Email" error={errors.email} required>
            <Input
              icon={Mail}
              type="email"
              placeholder="din@email.dk"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
            />
          </FormField>

          <FormField label="Adgangskode" error={errors.password} required>
            <PasswordInput
              placeholder="Din adgangskode"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
            />
          </FormField>

          {mode === 'signup' && (
            <>
              <FormField label="Telefon" error={errors.phone}>
                <Input
                  placeholder="Dit telefonnummer"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={errors.phone}
                />
              </FormField>

              {isB2B && (
                <>
                  <FormField label="Virksomhed" error={errors.company}>
                    <Input
                      icon={Building}
                      placeholder="Virksomhedsnavn"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      error={errors.company}
                    />
                  </FormField>

                  <FormField label="Afdeling" error={errors.department}>
                    <Input
                      icon={Briefcase}
                      placeholder="Afdeling/stilling"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      error={errors.department}
                    />
                  </FormField>
                </>
              )}
            </>
          )}

          <div className="flex flex-col space-y-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full"
            >
              {mode === 'login' ? 'Log ind' : 'Opret konto'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onClose}
              className="w-full"
            >
              Annuller
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AuthModalRefactored;

// Example of migrating existing component patterns to design system
export const MigrationExamples = {
  
  // Before: Manual button styling
  OldButton: () => (
    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
      Gem
    </button>
  ),
  
  // After: Design system button
  NewButton: () => (
    <Button variant="primary">
      Gem
    </Button>
  ),

  // Before: Manual card layout
  OldCard: ({ children }) => (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-purple-500/50 transition-colors">
      {children}
    </div>
  ),

  // After: Design system card
  NewCard: ({ children }) => (
    <Card hover>
      {children}
    </Card>
  ),

  // Before: Manual form input
  OldInput: ({ value, onChange, error }) => (
    <div>
      <input
        value={value}
        onChange={onChange}
        className={`w-full bg-slate-700 rounded-md py-3 px-3 text-white focus:ring-2 focus:ring-purple-500 ${
          error ? 'border border-red-500' : ''
        }`}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  ),

  // After: Design system input
  NewInput: ({ value, onChange, error }) => (
    <Input
      value={value}
      onChange={onChange}
      error={error}
    />
  ),

  // Before: Manual success message
  OldSuccessMessage: ({ message, onClose }) => (
    <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 flex items-center justify-between">
      <span className="text-green-400">{message}</span>
      <button onClick={onClose} className="text-green-400">×</button>
    </div>
  ),

  // After: Design system toast
  NewSuccessMessage: () => {
    const { success } = useToast();
    
    const handleSuccess = () => {
      success('Operation completed successfully!');
    };

    return (
      <Button onClick={handleSuccess}>
        Show Success
      </Button>
    );
  }
};
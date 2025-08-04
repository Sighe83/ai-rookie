import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building, Briefcase } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import EmailConfirmation from './EmailConfirmation.jsx';

// Design System imports
import {
  Modal,
  Button,
  Input,
  PasswordInput,
  FormField,
  NavigationTabs,
  Alert,
  useToast
} from './design-system';

const AuthModal = ({ isOpen, onClose, initialMode = 'signup', siteMode = 'b2b' }) => {
  const [mode, setMode] = useState(initialMode);
  const [isNewUser, setIsNewUser] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
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
  
  const isB2B = siteMode === 'b2b';

  // Initialize mode on first mount
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Reset form when modal closes
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
      if (mode === 'email-confirmation') {
        setMode('login');
      }
      setConfirmationEmail('');
      clearError();
    }
  }, [isOpen, clearError, mode]);

  React.useEffect(() => {
    setErrors({});
    setIsNewUser(false);
  }, [mode]);

  // Close modal and redirect when user becomes authenticated
  React.useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
      const isTutor = user?.role === 'TUTOR';
      navigate(isTutor ? '/tutor-dashboard' : '/dashboard');
      success(`Velkommen${user?.name ? `, ${user.name}` : ''}!`);
    }
  }, [isAuthenticated, isOpen, onClose, navigate, user, success]);

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
    
    // Get actual DOM values (handles Chrome autofill correctly)
    const formElement = e.target;
    const emailInput = formElement.querySelector('input[name="email"]');
    const passwordInput = formElement.querySelector('input[name="password"]');
    
    const actualEmail = emailInput?.value || formData.email;
    const actualPassword = passwordInput?.value || formData.password;
    
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
    if (mode === 'signup' && !actualFormData.name?.trim()) {
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
        result = await login(actualEmail, actualPassword);
        
        if (!result.success) {
          if (result.error?.includes('Invalid login credentials') || result.error?.includes('Ugyldig email eller adgangskode')) {
            setErrors({ 
              general: 'Forkert email eller adgangskode. Tjek dine oplysninger og prøv igen.'
            });
          } else if (result.error?.includes('Email not confirmed') || result.error?.includes('ikke bekræftet')) {
            setErrors({ 
              general: 'Din email er ikke bekræftet endnu. Tjek din indbakke og klik på bekræftelseslinket.'
            });
          } else if (result.error?.includes('Too many requests') || result.error?.includes('mange forsøg')) {
            setErrors({ 
              general: 'For mange login-forsøg. Vent et par minutter og prøv igen.'
            });
          } else if (result.error?.includes('User not found') || result.error?.includes('ikke fundet')) {
            setErrors({ 
              email: 'Denne email er ikke registreret. Vil du oprette en konto?'
            });
            setIsNewUser(true);
          } else {
            error('Login fejlede. Prøv igen.');
          }
        }
      } else if (mode === 'signup') {
        result = await register(actualFormData);
        
        if (result.success) {
          success('Konto oprettet! Tjek din email for bekræftelse.');
          setConfirmationEmail(actualEmail);
          setMode('email-confirmation');
        } else {
          if (result.error?.includes('User already registered') || result.error?.includes('allerede registreret')) {
            setErrors({
              email: 'Denne email er allerede registreret. Prøv at logge ind i stedet.'
            });
          } else if (result.error?.includes('Password should be at least 6 characters') || result.error?.includes('mindst 6 tegn')) {
            setErrors({
              password: 'Adgangskode skal være mindst 6 tegn'
            });
          } else {
            error(result.error || 'Registrering fejlede. Prøv igen.');
          }
        }
      }
    } catch (err) {
      error('Der opstod en uventet fejl. Prøv igen senere.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === 'email-confirmation') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Bekræft din email" size="md">
        <EmailConfirmation 
          email={confirmationEmail}
          onBack={() => setMode('signup')}
          onResend={() => {
            success('Bekræftelsesmail sendt igen!');
          }}
        />
      </Modal>
    );
  }

  const tabs = [
    { id: 'login', label: 'Log ind' },
    { id: 'signup', label: 'Opret konto' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Log ind på din konto' : 'Opret ny konto'}
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

        {/* General Error Alert */}
        {(authError || errors.general) && (
          <Alert type="error" onClose={() => {
            clearError();
            setErrors(prev => ({ ...prev, general: '' }));
          }}>
            {authError || errors.general}
          </Alert>
        )}

        {/* New User Prompt */}
        {isNewUser && (
          <Alert type="info" title="Bruger ikke fundet">
            Denne email er ikke registreret. Vil du oprette en konto i stedet?
            <div className="mt-3">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  setMode('signup');
                  setIsNewUser(false);
                }}
              >
                Opret konto
              </Button>
            </div>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <FormField label="Fulde navn" error={errors.name} required>
              <Input
                name="name"
                icon={User}
                placeholder="Dit fulde navn"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
              />
            </FormField>
          )}

          <FormField label="Email adresse" error={errors.email} required>
            <Input
              name="email"
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
              name="password"
              placeholder={mode === 'signup' ? 'Mindst 6 tegn' : 'Din adgangskode'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
            />
          </FormField>

          {mode === 'signup' && (
            <>
              <FormField label="Telefonnummer" error={errors.phone}>
                <Input
                  name="phone"
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
                      name="company"
                      icon={Building}
                      placeholder="Virksomhedsnavn"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      error={errors.company}
                    />
                  </FormField>

                  <FormField label="Afdeling / Stilling" error={errors.department}>
                    <Input
                      name="department"
                      icon={Briefcase}
                      placeholder="F.eks. IT-afdeling, Udvikler"
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

        {mode === 'login' && (
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Har du ikke en konto?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Opret en her
              </button>
            </p>
          </div>
        )}

        {mode === 'signup' && (
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Har du allerede en konto?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Log ind her
              </button>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;
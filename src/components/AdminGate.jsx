import React, { useState, useEffect } from 'react';
import { Rocket, Lock, Eye, EyeOff } from 'lucide-react';

const AdminGate = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check if admin gate should be enabled
  const isEnabled = import.meta.env.VITE_ADMIN_GATE_ENABLED === 'true';

  useEffect(() => {
    // If admin gate is disabled, skip authentication
    if (!isEnabled) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Check if already authenticated (stored in sessionStorage)
    const adminAuth = sessionStorage.getItem('admin-authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [isEnabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (password === 'AI1234') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin-authenticated', 'true');
    } else {
      setError('Ugyldig adgangskode');
      setPassword('');
    }
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authenticated or gate disabled, show main app
  if (isAuthenticated) {
    return children;
  }

  // Show admin gate
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Coming Soon Display */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Rocket className="w-20 h-20 text-blue-400 animate-bounce" />
              <div className="absolute -top-2 -right-2">
                <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Kommer snart
          </h1>
          <p className="text-slate-300 text-lg">
            Vi arbejder på noget fantastisk! 🚀
          </p>
        </div>

        {/* Admin Login Form */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-slate-400 mr-2" />
            <h2 className="text-lg font-semibold text-white">Admin Adgang</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-3">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin adgangskode"
                className="w-full bg-slate-700 rounded-md py-2 pl-3 pr-10 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Log ind
            </button>
          </form>
          
          <p className="text-slate-500 text-xs text-center mt-4">
            Admin adgang krævet for at se siden
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminGate;
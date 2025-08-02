import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

const AuthDebug = () => {
  const { user, loading, initialized, isAuthenticated } = useAuth();
  const [sessionInfo, setSessionInfo] = React.useState(null);

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSessionInfo(session);
      } catch (error) {
        console.error('Debug session check failed:', error);
        setSessionInfo(null);
      }
    };
    checkSession();
  }, []);

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 p-4 rounded-lg text-xs text-white max-w-xs z-50 border border-slate-600">
      <h4 className="font-bold mb-2 text-blue-400">🔧 Auth Debug</h4>
      <div className="space-y-1">
        <div>Initialized: {initialized ? '✅' : '❌'}</div>
        <div>Loading: {loading ? '🔄' : '✅'}</div>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {user?.email || 'None'}</div>
        <div>Session: {sessionInfo ? '✅' : '❌'}</div>
        <div>Site Mode: {user?.site_mode || 'Unknown'}</div>
        <div>Role: {user?.role || 'N/A'}</div>
        {user && (
          <div className="mt-2 pt-2 border-t border-slate-600">
            <div className="text-xs text-slate-400">User ID: {user.id?.slice(0, 8)}...</div>
            <div className="text-xs text-slate-400">Name: {user.name || 'No name'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;

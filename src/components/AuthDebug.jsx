import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bug, ChevronUp, ChevronDown } from 'lucide-react';

const AuthDebug = () => {
  const { user, session, loading, initialized, isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) return null;

  // Keyboard shortcut to toggle debug panel (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsExpanded(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed state - just the icon */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`bg-slate-800 hover:bg-slate-700 p-3 rounded-full text-white shadow-lg border border-slate-600 transition-all duration-200 hover:scale-105 group ${
            loading || !initialized ? 'animate-pulse' : ''
          }`}
          title="Open Auth Debug (Ctrl+Shift+D)"
        >
          <Bug className={`w-5 h-5 group-hover:text-blue-300 transition-colors ${
            isAuthenticated && initialized ? 'text-green-400' : 
            loading ? 'text-yellow-400' : 'text-red-400'
          }`} />
        </button>
      )}
      
      {/* Expanded state - full debug info */}
      {isExpanded && (
        <div className="bg-slate-800 p-4 rounded-lg text-xs text-white max-w-xs border border-slate-600 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-blue-400 flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Auth Debug
            </h4>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded"
              title="Collapse"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-1">
            <div>Initialized: {initialized ? '✅' : '❌'}</div>
            <div>Loading: {loading ? '🔄' : '✅'}</div>
            <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
            <div>User: {user?.email || 'None'}</div>
            <div>Session: {session ? '✅' : '❌'}</div>
            <div>Site Mode: {user?.site_mode || 'Unknown'}</div>
            <div>Role: {user?.role || 'N/A'}</div>
            {user && (
              <div className="mt-2 pt-2 border-t border-slate-600">
                <div className="text-xs text-slate-400">User ID: {user.id?.slice(0, 8)}...</div>
                <div className="text-xs text-slate-400">Name: {user.name || 'No name'}</div>
              </div>
            )}
          </div>
          
          {/* Quick status indicator */}
          <div className="mt-3 pt-2 border-t border-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isAuthenticated && initialized ? 'bg-green-500' : 
                loading ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-slate-400">
                {isAuthenticated && initialized ? 'Ready' : 
                 loading ? 'Loading...' : 'Not authenticated'}
              </span>
            </div>
            <span className="text-xs text-slate-500">Ctrl+Shift+D</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;

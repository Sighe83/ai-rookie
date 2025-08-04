import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useTheme } from './DesignSystem.jsx';

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const showToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
    
    return id;
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const success = (message, options = {}) => {
    return showToast({ ...options, type: 'success', message });
  };
  
  const error = (message, options = {}) => {
    return showToast({ ...options, type: 'error', message });
  };
  
  const warning = (message, options = {}) => {
    return showToast({ ...options, type: 'warning', message });
  };
  
  const info = (message, options = {}) => {
    return showToast({ ...options, type: 'info', message });
  };
  
  return (
    <ToastContext.Provider value={{ showToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container
const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

// Individual Toast Component
export const Toast = ({ 
  type = 'info',
  title,
  message,
  onClose,
  closable = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);
  
  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.();
    }, 200);
  };
  
  const types = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500',
      text: 'text-green-400',
      icon: CheckCircle
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500',
      text: 'text-red-400',
      icon: XCircle
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500',
      text: 'text-yellow-400',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500',
      text: 'text-blue-400',
      icon: Info
    }
  };
  
  const typeStyles = types[type];
  const Icon = typeStyles.icon;
  
  const animationClass = isLeaving 
    ? 'translate-x-full opacity-0' 
    : isVisible 
    ? 'translate-x-0 opacity-100' 
    : 'translate-x-full opacity-0';
  
  return (
    <div className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm bg-slate-800/90 transform transition-all duration-200 ${typeStyles.border} ${animationClass} ${className}`}>
      <div className="flex items-start">
        <Icon className={`w-5 h-5 ${typeStyles.text} mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-medium ${typeStyles.text} mb-1`}>{title}</h4>
          )}
          <div className="text-slate-300 text-sm">
            {message}
          </div>
        </div>
        {closable && (
          <button
            onClick={handleClose}
            className={`${typeStyles.text} hover:text-white ml-3 flex-shrink-0 transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Notification Bell Component
export const NotificationBell = ({ 
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useTheme();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5l-5-5h5v-5h5v5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 3h.01M6.05 6.05l.01-.01m0 12.01l-.01-.01M13 21h.01M18.95 6.05l-.01-.01" />
        </svg>
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 ${colors.primary} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Notifikationer</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Marker alle som læst
                  </button>
                )}
              </div>
            </div>
            
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                Ingen notifikationer
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => {
                      onNotificationClick?.(notification);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Individual Notification Item
const NotificationItem = ({ notification, onClick }) => {
  const { colors } = useTheme();
  
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700 last:border-b-0 ${
        !notification.read ? 'bg-slate-700/20' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {!notification.read && (
          <div className={`w-2 h-2 ${colors.primary.replace('bg-', 'bg-')} rounded-full mt-2 flex-shrink-0`} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium mb-1">
            {notification.title}
          </p>
          <p className="text-slate-400 text-sm mb-2">
            {notification.message}
          </p>
          <p className="text-slate-500 text-xs">
            {notification.timestamp}
          </p>
        </div>
      </div>
    </button>
  );
};

// Banner Notification
export const Banner = ({ 
  type = 'info',
  title,
  message,
  action,
  onClose,
  className = ''
}) => {
  const types = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500',
      text: 'text-green-400'
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500',
      text: 'text-red-400'
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500',
      text: 'text-yellow-400'
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500',
      text: 'text-blue-400'
    }
  };
  
  const typeStyles = types[type];
  
  return (
    <div className={`border-l-4 p-4 ${typeStyles.bg} ${typeStyles.border} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {title && (
            <h4 className={`font-medium ${typeStyles.text} mb-1`}>{title}</h4>
          )}
          <div className="text-slate-300 text-sm">
            {message}
          </div>
        </div>
        <div className="flex items-center space-x-3 ml-4">
          {action}
          {onClose && (
            <button
              onClick={onClose}
              className={`${typeStyles.text} hover:text-white transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Progress Notification
export const ProgressNotification = ({ 
  title,
  progress = 0,
  status = 'in-progress', // in-progress, success, error
  onCancel,
  className = ''
}) => {
  const { colors } = useTheme();
  
  const statusColors = {
    'in-progress': colors.primary,
    'success': 'bg-green-600',
    'error': 'bg-red-600'
  };
  
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium">{title}</h4>
        {onCancel && status === 'in-progress' && (
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-sm text-slate-400 mb-1">
          <span>Fremgang</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${statusColors[status]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {status === 'success' && (
        <div className="flex items-center text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 mr-2" />
          Fuldført
        </div>
      )}
      
      {status === 'error' && (
        <div className="flex items-center text-red-400 text-sm">
          <XCircle className="w-4 h-4 mr-2" />
          Fejl opstod
        </div>
      )}
    </div>
  );
};

export default {
  ToastProvider,
  useToast,
  Toast,
  NotificationBell,
  Banner,
  ProgressNotification
};
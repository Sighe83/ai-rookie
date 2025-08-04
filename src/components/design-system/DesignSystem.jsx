import React, { createContext, useContext } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, Clock, 
  X, Eye, EyeOff, User, Mail, Phone, Building,
  Edit, Save, Plus, Trash2, Calendar
} from 'lucide-react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, siteMode = 'b2b', userRole }) => {
  const getThemeColors = () => {
    const isTutor = userRole === 'TUTOR';
    const isB2B = siteMode === 'b2b';
    
    if (isTutor) {
      return {
        primary: 'bg-purple-600',
        primaryHover: 'hover:bg-purple-700',
        primaryText: 'text-purple-400',
        primaryRing: 'ring-purple-500',
        primaryBorder: 'border-purple-500',
        primaryBorderHover: 'hover:border-purple-500'
      };
    }
    
    if (isB2B) {
      return {
        primary: 'bg-green-600',
        primaryHover: 'hover:bg-green-700',
        primaryText: 'text-green-400',
        primaryRing: 'ring-green-500',
        primaryBorder: 'border-green-500',
        primaryBorderHover: 'hover:border-green-500'
      };
    }
    
    return {
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      primaryText: 'text-blue-400',
      primaryRing: 'ring-blue-500',
      primaryBorder: 'border-blue-500',
      primaryBorderHover: 'hover:border-blue-500'
    };
  };

  return (
    <ThemeContext.Provider value={{ colors: getThemeColors(), siteMode, userRole }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const DesignTokens = {
  colors: {
    slate: {
      900: 'bg-slate-900',
      800: 'bg-slate-800',
      700: 'bg-slate-700',
      600: 'bg-slate-600',
      500: 'bg-slate-500',
      400: 'text-slate-400',
      300: 'text-slate-300'
    },
    status: {
      success: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500',
        dot: 'bg-green-400'
      },
      error: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500',
        dot: 'bg-red-400'
      },
      warning: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500',
        dot: 'bg-yellow-400'
      },
      info: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500',
        dot: 'bg-blue-400'
      },
      pending: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500',
        dot: 'bg-yellow-400'
      },
      confirmed: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500',
        dot: 'bg-purple-400'
      },
      completed: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500',
        dot: 'bg-blue-400'
      },
      cancelled: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500',
        dot: 'bg-red-400'
      }
    }
  },
  typography: {
    heading: {
      xl: 'text-2xl sm:text-3xl font-bold text-white',
      lg: 'text-lg sm:text-xl font-semibold text-white',
      md: 'text-base sm:text-lg font-semibold text-white',
      sm: 'text-lg sm:text-xl font-bold text-white'
    },
    body: {
      lg: 'text-slate-300 text-sm sm:text-base',
      md: 'text-slate-400 text-xs sm:text-sm',
      sm: 'text-slate-300 text-xs sm:text-sm font-medium'
    }
  },
  spacing: {
    container: 'max-w-7xl mx-auto py-4 sm:py-8 px-4',
    section: 'mb-6 sm:mb-8',
    content: 'space-y-4 sm:space-y-6',
    grid: 'gap-3 sm:gap-4'
  },
  borders: {
    default: 'border-slate-700',
    hover: 'border-slate-600',
    active: 'border-slate-500'
  }
};

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props 
}) => {
  const { colors } = useTheme();
  
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: `${colors.primary} ${colors.primaryHover} text-white ${colors.primaryRing}`,
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white ring-green-500',
    outline: `border ${colors.primaryBorder} ${colors.primaryText} ${colors.primaryBorderHover} bg-transparent`
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2 sm:py-3 text-sm sm:text-base min-h-[44px]',
    lg: 'py-3 px-4 sm:px-6 text-sm sm:text-base min-h-[48px]'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button 
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      )}
      {Icon && !loading && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
};

export const Card = ({ 
  variant = 'default', 
  children, 
  className = '',
  hover = false,
  as: Component = 'div',
  ...props 
}) => {
  const { colors } = useTheme();
  
  const baseClasses = 'rounded-lg border transition-colors';
  
  const variants = {
    default: 'bg-slate-800 border-slate-700',
    nested: 'bg-slate-700 border-slate-600',
    info: 'bg-slate-700/30 border-slate-600'
  };
  
  const hoverClasses = hover ? `${colors.primaryBorderHover}/50` : '';
  
  const classes = `${baseClasses} ${variants[variant]} ${hoverClasses} ${className}`;
  
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};

export const Input = ({ 
  type = 'text',
  placeholder,
  error,
  icon: Icon,
  value,
  onChange,
  disabled = false,
  className = '',
  ...props 
}) => {
  const { colors } = useTheme();
  
  const baseClasses = 'w-full bg-slate-700 rounded-md py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]';
  
  const iconClasses = Icon ? 'pl-10 pr-3' : 'px-3';
  const errorClasses = error ? 'border border-red-500' : '';
  const focusClasses = `${colors.primaryRing}`;
  
  const classes = `${baseClasses} ${iconClasses} ${errorClasses} ${focusClasses} ${className}`;
  
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={classes}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export const StatusBadge = ({ status, children, customColors }) => {
  const statusColors = customColors || DesignTokens.colors.status[status] || DesignTokens.colors.status.info;
  
  return (
    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
      <div className={`w-2 h-2 rounded-full ${statusColors.dot}`}></div>
      <span>{children}</span>
    </span>
  );
};

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '' 
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-slate-800 rounded-lg ${sizes[size]} w-full max-h-[90vh] overflow-y-auto ${className}`}>
        {title && (
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const { colors } = useTheme();
  
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className={`animate-spin rounded-full border-b-2 ${colors.primaryBorder.replace('border-', 'border-')} ${sizes[size]} ${className}`}></div>
  );
};

export const IconButton = ({ 
  icon: Icon, 
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...props 
}) => {
  const { colors } = useTheme();
  
  const baseClasses = 'inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900';
  
  const variants = {
    default: 'text-slate-400 hover:text-white',
    primary: `${colors.primaryText} hover:text-white`,
    danger: 'text-red-400 hover:text-red-300'
  };
  
  const sizes = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      <Icon className={iconSizes[size]} />
      {children}
    </button>
  );
};

export const Grid = ({ 
  cols = 1, 
  smCols, 
  lgCols, 
  gap = 'md',
  children, 
  className = '' 
}) => {
  const gaps = {
    sm: 'gap-2',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6'
  };
  
  const gridCols = `grid-cols-${cols}`;
  const smGridCols = smCols ? `sm:grid-cols-${smCols}` : '';
  const lgGridCols = lgCols ? `lg:grid-cols-${lgCols}` : '';
  
  const classes = `grid ${gridCols} ${smGridCols} ${lgGridCols} ${gaps[gap]} ${className}`;
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export const Container = ({ children, className = '' }) => {
  return (
    <div className={`${DesignTokens.spacing.container} ${className}`}>
      {children}
    </div>
  );
};

export const Section = ({ children, className = '' }) => {
  return (
    <div className={`${DesignTokens.spacing.section} ${className}`}>
      {children}
    </div>
  );
};

export const FormField = ({ label, children, error, required }) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-slate-300 text-sm font-medium">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export const Tabs = ({ tabs, activeTab, onTabChange, className = '' }) => {
  const { colors } = useTheme();
  
  return (
    <div className={`border-b border-slate-700 ${className}`}>
      <div className="flex overflow-x-auto gap-2 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.id
                ? `${colors.primaryText} bg-slate-700`
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const Alert = ({ type = 'info', title, children, onClose }) => {
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
      icon: AlertCircle
    }
  };
  
  const typeStyles = types[type];
  const Icon = typeStyles.icon;
  
  return (
    <div className={`border rounded-lg p-4 ${typeStyles.bg} ${typeStyles.border}`}>
      <div className="flex items-start">
        <Icon className={`w-5 h-5 ${typeStyles.text} mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          {title && (
            <h4 className={`font-medium ${typeStyles.text} mb-1`}>{title}</h4>
          )}
          <div className="text-slate-300 text-sm">
            {children}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${typeStyles.text} hover:text-white ml-3 flex-shrink-0`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const Tooltip = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-xs text-white bg-slate-800 border border-slate-600 rounded shadow-lg whitespace-nowrap ${positions[position]}`}>
          {content}
        </div>
      )}
    </div>
  );
};

export default {
  ThemeProvider,
  useTheme,
  DesignTokens,
  Button,
  Card,
  Input,
  StatusBadge,
  Modal,
  LoadingSpinner,
  IconButton,
  Grid,
  Container,
  Section,
  FormField,
  Tabs,
  Alert,
  Tooltip
};
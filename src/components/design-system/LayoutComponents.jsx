import React, { useState } from 'react';
import { Menu, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from './DesignSystem.jsx';

export const MobileNavigation = ({ 
  isOpen, 
  onToggle, 
  children,
  className = '' 
}) => {
  return (
    <>
      <button
        onClick={onToggle}
        className="sm:hidden fixed top-4 right-4 z-50 p-2 bg-slate-800 rounded-md border border-slate-700 text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      
      {isOpen && (
        <div className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className={`bg-slate-800 w-64 h-full border-r border-slate-700 p-4 ${className}`}>
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export const Sidebar = ({ 
  isOpen = true, 
  onToggle, 
  children,
  width = 'w-64',
  className = '' 
}) => {
  return (
    <div className={`${isOpen ? width : 'w-16'} transition-all duration-300 bg-slate-800 border-r border-slate-700 ${className}`}>
      {onToggle && (
        <button
          onClick={onToggle}
          className="w-full p-2 text-slate-400 hover:text-white transition-colors border-b border-slate-700"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      )}
      <div className={`${isOpen ? 'block' : 'hidden'} p-4`}>
        {children}
      </div>
    </div>
  );
};

export const Header = ({ 
  title, 
  subtitle, 
  actions, 
  className = '' 
}) => {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
          )}
          {subtitle && (
            <p className="text-slate-400 text-sm sm:text-base mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 sm:gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export const PageLayout = ({ 
  header, 
  navigation, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`max-w-7xl mx-auto py-4 sm:py-8 px-4 ${className}`}>
      {header}
      {navigation}
      <div className="space-y-4 sm:space-y-6">
        {children}
      </div>
    </div>
  );
};

export const SplitLayout = ({ 
  left, 
  right, 
  leftWidth = 'lg:w-1/3', 
  rightWidth = 'lg:w-2/3',
  gap = 'gap-6',
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 ${gap} ${className}`}>
      <div className={leftWidth}>
        {left}
      </div>
      <div className={rightWidth}>
        {right}
      </div>
    </div>
  );
};

export const Accordion = ({ 
  items = [],
  multiple = false,
  className = '' 
}) => {
  const [openItems, setOpenItems] = useState(new Set());
  
  const toggleItem = (id) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (multiple) {
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      } else {
        newSet.clear();
        if (!prev.has(id)) {
          newSet.add(id);
        }
      }
      return newSet;
    });
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        return (
          <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors"
            >
              <span className="text-white font-medium">{item.title}</span>
              {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            {isOpen && (
              <div className="p-4 border-t border-slate-700 text-slate-300">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const StatsGrid = ({ 
  stats = [],
  columns = 4,
  className = '' 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4'
  };
  
  return (
    <div className={`grid ${gridCols[columns]} gap-3 sm:gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-4 sm:p-6">
          {stat.icon && (
            <div className="mb-3">
              <stat.icon className="w-8 h-8 text-slate-400" />
            </div>
          )}
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {stat.value}
          </div>
          <div className="text-slate-400 text-sm">
            {stat.label}
          </div>
          {stat.change && (
            <div className={`text-xs mt-2 ${stat.change.positive ? 'text-green-400' : 'text-red-400'}`}>
              {stat.change.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const Timeline = ({ 
  items = [],
  className = '' 
}) => {
  const { colors } = useTheme();
  
  return (
    <div className={`space-y-6 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="relative flex items-start">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colors.primary} flex items-center justify-center mr-4`}>
            {item.icon && <item.icon className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium">{item.title}</div>
            <div className="text-slate-400 text-sm mt-1">{item.description}</div>
            <div className="text-slate-500 text-xs mt-2">{item.timestamp}</div>
          </div>
          {index < items.length - 1 && (
            <div className="absolute left-5 top-10 w-px h-6 bg-slate-600"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export const EmptyState = ({ 
  icon: Icon,
  title,
  description,
  action,
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <Icon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
      )}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  );
};

export const Breadcrumbs = ({ 
  items = [],
  className = '' 
}) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
          {item.href ? (
            <a 
              href={item.href}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className={index === items.length - 1 ? 'text-white' : 'text-slate-400'}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export const Divider = ({ 
  orientation = 'horizontal',
  className = '' 
}) => {
  const classes = orientation === 'horizontal' 
    ? 'w-full h-px bg-slate-700'
    : 'w-px h-full bg-slate-700';
    
  return <div className={`${classes} ${className}`} />;
};

export default {
  MobileNavigation,
  Sidebar,
  Header,
  PageLayout,
  SplitLayout,
  Accordion,
  StatsGrid,
  Timeline,
  EmptyState,
  Breadcrumbs,
  Divider
};
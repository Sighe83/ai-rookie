import React, { useState } from 'react';
import { ChevronDown, Home, Settings, User, LogOut, Bell } from 'lucide-react';
import { useTheme } from './DesignSystem.jsx';

export const NavigationTabs = ({ 
  tabs = [],
  activeTab,
  onTabChange,
  orientation = 'horizontal',
  variant = 'default',
  className = ''
}) => {
  const { colors } = useTheme();
  
  const isVertical = orientation === 'vertical';
  const isUnderlined = variant === 'underlined';
  
  const containerClasses = isVertical 
    ? 'flex flex-col space-y-1'
    : 'flex overflow-x-auto gap-2 pb-2';
    
  const borderClasses = !isVertical && !isUnderlined ? 'border-b border-slate-700' : '';
  
  return (
    <div className={`${borderClasses} ${className}`}>
      <div className={containerClasses}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          let buttonClasses = 'whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors';
          
          if (isUnderlined) {
            buttonClasses += isActive
              ? ` ${colors.primaryText} border-b-2 ${colors.primaryBorder}`
              : ' text-slate-400 hover:text-slate-300 border-b-2 border-transparent';
          } else {
            buttonClasses += isActive
              ? ` ${colors.primaryText} bg-slate-700 rounded-md`
              : ' text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-md';
          }
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={buttonClasses}
              disabled={tab.disabled}
            >
              {tab.icon && <tab.icon className="w-4 h-4 mr-2 inline" />}
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${colors.primary} text-white`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const Breadcrumb = ({ 
  items = [],
  separator = '/',
  className = ''
}) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-slate-500">{separator}</span>
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

export const Dropdown = ({ 
  trigger,
  items = [],
  placement = 'bottom-start',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const placementClasses = {
    'bottom-start': 'top-full left-0 mt-2',
    'bottom-end': 'top-full right-0 mt-2',
    'top-start': 'bottom-full left-0 mb-2',
    'top-end': 'bottom-full right-0 mb-2'
  };
  
  return (
    <div className={`relative inline-block ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute z-20 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-2 ${placementClasses[placement]}`}>
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.divider ? (
                  <div className="h-px bg-slate-700 my-2" />
                ) : (
                  <button
                    onClick={() => {
                      item.onClick?.();
                      setIsOpen(false);
                    }}
                    disabled={item.disabled}
                    className="w-full flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {item.icon && <item.icon className="w-4 h-4 mr-3" />}
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-slate-600 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const SideNavigation = ({ 
  items = [],
  activeItem,
  onItemClick,
  collapsed = false,
  className = ''
}) => {
  const { colors } = useTheme();
  
  return (
    <nav className={`space-y-1 ${className}`}>
      {items.map((item) => {
        const isActive = activeItem === item.id;
        const hasChildren = item.children && item.children.length > 0;
        
        return (
          <div key={item.id}>
            <button
              onClick={() => onItemClick?.(item)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? `${colors.primaryText} bg-slate-700`
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {item.icon && (
                <item.icon className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
              )}
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasChildren && <ChevronDown className="w-4 h-4" />}
                  {item.badge && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${colors.primary} text-white`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
            
            {!collapsed && hasChildren && isActive && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onItemClick?.(child)}
                    className="w-full flex items-center px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors"
                  >
                    {child.icon && <child.icon className="w-4 h-4 mr-3" />}
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export const TopNavigation = ({ 
  brand,
  navigation = [],
  actions,
  className = ''
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav className={`bg-slate-800 border-b border-slate-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex-shrink-0">
            {brand}
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            {actions}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <span className="sr-only">Open menu</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700 py-4">
            <div className="space-y-2">
              {navigation.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="block text-slate-300 hover:text-white px-3 py-2 text-base font-medium transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export const Pagination = ({ 
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className = ''
}) => {
  const { colors } = useTheme();
  
  const getVisiblePages = () => {
    const delta = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  
  const visiblePages = getVisiblePages();
  
  const buttonClass = (isActive = false, disabled = false) => {
    let classes = 'px-3 py-2 text-sm border transition-colors';
    
    if (disabled) {
      classes += ' text-slate-500 border-slate-700 cursor-not-allowed';
    } else if (isActive) {
      classes += ` ${colors.primary} ${colors.primaryBorder} text-white`;
    } else {
      classes += ' text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white';
    }
    
    return classes;
  };
  
  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`${buttonClass(false, currentPage === 1)} rounded-l-md`}
        >
          Første
        </button>
      )}
      
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={buttonClass(false, currentPage === 1)}
        >
          Forrige
        </button>
      )}
      
      {visiblePages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={buttonClass()}
          >
            1
          </button>
          {visiblePages[0] > 2 && (
            <span className="px-2 py-2 text-slate-500">...</span>
          )}
        </>
      )}
      
      {visiblePages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={buttonClass(page === currentPage)}
        >
          {page}
        </button>
      ))}
      
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2 py-2 text-slate-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className={buttonClass()}
          >
            {totalPages}
          </button>
        </>
      )}
      
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={buttonClass(false, currentPage === totalPages)}
        >
          Næste
        </button>
      )}
      
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`${buttonClass(false, currentPage === totalPages)} rounded-r-md`}
        >
          Sidste
        </button>
      )}
    </div>
  );
};

export const MegaMenu = ({ 
  trigger,
  sections = [],
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      <div 
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {trigger}
        
        {isOpen && (
          <div className="absolute top-full left-0 w-screen max-w-4xl bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-white font-semibold mb-3">{section.title}</h3>
                  <div className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <a
                        key={itemIndex}
                        href={item.href}
                        className="block p-2 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <div className="font-medium">{item.title}</div>
                        {item.description && (
                          <div className="text-sm text-slate-400">{item.description}</div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  NavigationTabs,
  Breadcrumb,
  Dropdown,
  SideNavigation,
  TopNavigation,
  Pagination,
  MegaMenu
};
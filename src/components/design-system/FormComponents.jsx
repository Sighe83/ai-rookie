import React, { useState } from 'react';
import { Eye, EyeOff, ChevronDown, Search } from 'lucide-react';
import { useTheme } from './DesignSystem.jsx';

export const SearchInput = ({ 
  placeholder = "Søg...",
  value,
  onChange,
  className = '',
  ...props 
}) => {
  const { colors } = useTheme();
  
  const baseClasses = 'w-full bg-slate-700 rounded-md py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900';
  const focusClasses = `${colors.primaryRing}`;
  
  const classes = `${baseClasses} ${focusClasses} ${className}`;
  
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={classes}
        {...props}
      />
    </div>
  );
};

export const PasswordInput = ({ 
  placeholder = "Password",
  value,
  onChange,
  error,
  className = '',
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { colors } = useTheme();
  
  const baseClasses = 'w-full bg-slate-700 rounded-md py-3 pl-3 pr-10 text-white text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 min-h-[44px]';
  const errorClasses = error ? 'border border-red-500' : '';
  const focusClasses = `${colors.primaryRing}`;
  
  const classes = `${baseClasses} ${errorClasses} ${focusClasses} ${className}`;
  
  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={classes}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export const Select = ({ 
  options = [],
  value,
  onChange,
  placeholder = "Vælg...",
  error,
  className = '',
  ...props 
}) => {
  const { colors } = useTheme();
  
  const baseClasses = 'w-full bg-slate-700 rounded-md py-3 pl-3 pr-10 text-white text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 appearance-none cursor-pointer min-h-[44px]';
  const errorClasses = error ? 'border border-red-500' : '';
  const focusClasses = `${colors.primaryRing}`;
  
  const classes = `${baseClasses} ${errorClasses} ${focusClasses} ${className}`;
  
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={classes}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export const Textarea = ({ 
  placeholder,
  value,
  onChange,
  error,
  rows = 4,
  className = '',
  ...props 
}) => {
  const { colors } = useTheme();
  
  const baseClasses = 'w-full bg-slate-700 rounded-md py-3 px-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 resize-vertical';
  const errorClasses = error ? 'border border-red-500' : '';
  const focusClasses = `${colors.primaryRing}`;
  
  const classes = `${baseClasses} ${errorClasses} ${focusClasses} ${className}`;
  
  return (
    <div>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={classes}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export const Checkbox = ({ 
  label,
  checked,
  onChange,
  disabled = false,
  className = ''
}) => {
  const { colors } = useTheme();
  
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`w-5 h-5 border-2 rounded ${checked ? `${colors.primary} ${colors.primaryBorder}` : 'border-slate-500'} transition-colors`}>
          {checked && (
            <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span className="ml-2 text-sm text-slate-300">{label}</span>
      )}
    </label>
  );
};

export const RadioGroup = ({ 
  options = [],
  value,
  onChange,
  name,
  className = ''
}) => {
  const { colors } = useTheme();
  
  return (
    <div className={`space-y-2 ${className}`}>
      {options.map((option) => (
        <label key={option.value} className="inline-flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <div className={`w-5 h-5 border-2 rounded-full ${value === option.value ? `${colors.primary} ${colors.primaryBorder}` : 'border-slate-500'} transition-colors`}>
              {value === option.value && (
                <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              )}
            </div>
          </div>
          <span className="ml-2 text-sm text-slate-300">{option.label}</span>
        </label>
      ))}
    </div>
  );
};

export const Toggle = ({ 
  checked,
  onChange,
  label,
  disabled = false,
  className = ''
}) => {
  const { colors } = useTheme();
  
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? colors.primary : 'bg-slate-600'}`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'} absolute top-0.5 left-0.5`}></div>
        </div>
      </div>
      {label && (
        <span className="ml-3 text-sm text-slate-300">{label}</span>
      )}
    </label>
  );
};

export const FileUpload = ({ 
  accept,
  onChange,
  multiple = false,
  className = '',
  children
}) => {
  const handleFileChange = (event) => {
    const files = multiple ? Array.from(event.target.files) : event.target.files[0];
    onChange(files);
  };
  
  return (
    <label className={`cursor-pointer ${className}`}>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="sr-only"
      />
      {children}
    </label>
  );
};

export default {
  SearchInput,
  PasswordInput,
  Select,
  Textarea,
  Checkbox,
  RadioGroup,
  Toggle,
  FileUpload
};
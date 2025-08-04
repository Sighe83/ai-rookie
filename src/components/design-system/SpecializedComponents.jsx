import { useState, useEffect, useRef } from 'react';
import { Clock, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { useTheme } from './DesignSystem.jsx';
import { useToast } from './NotificationComponents.jsx';

// Calendar Component
export const Calendar = ({ 
  value,
  onChange,
  mode = 'single', // single, range, multiple
  availableDates = [],
  disabledDates = [],
  minDate,
  maxDate,
  className = ''
}) => {
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const { colors } = useTheme();
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Next month days to fill the grid
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };
  
  const isDateDisabled = (date) => {
    const dateString = date.toISOString().split('T')[0];
    if (disabledDates.includes(dateString)) return true;
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    if (availableDates.length > 0 && !availableDates.includes(dateString)) return true;
    return false;
  };
  
  const isDateSelected = (date) => {
    if (!value) return false;
    const dateString = date.toISOString().split('T')[0];
    if (mode === 'multiple') {
      return Array.isArray(value) && value.includes(dateString);
    }
    return value === dateString;
  };
  
  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    
    const dateString = date.toISOString().split('T')[0];
    
    if (mode === 'single') {
      onChange(dateString);
    } else if (mode === 'multiple') {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(dateString)
        ? currentValue.filter(d => d !== dateString)
        : [...currentValue, dateString];
      onChange(newValue);
    }
  };
  
  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };
  
  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
  
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-white capitalize">{monthYear}</h3>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isSelected = isDateSelected(day.date);
          const isDisabled = isDateDisabled(day.date);
          const isCurrentMonth = day.isCurrentMonth;
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(day.date)}
              disabled={isDisabled}
              className={`p-2 text-sm rounded-md transition-colors ${
                isSelected
                  ? `${colors.primary} text-white`
                  : isDisabled
                  ? 'text-slate-600 cursor-not-allowed'
                  : isCurrentMonth
                  ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// TimeSlot Grid Component
export const TimeSlotGrid = ({ 
  timeSlots = [],
  selectedSlots = [],
  onSlotToggle,
  bookedSlots = [],
  unavailableSlots = [],
  className = ''
}) => {
  const { colors } = useTheme();
  
  const getSlotStatus = (slot) => {
    if (bookedSlots.includes(slot)) return 'booked';
    if (unavailableSlots.includes(slot)) return 'unavailable';
    if (selectedSlots.includes(slot)) return 'selected';
    return 'available';
  };
  
  const getSlotStyles = (status) => {
    switch (status) {
      case 'selected':
        return `${colors.primary} text-white`;
      case 'booked':
        return 'bg-red-600 text-white cursor-not-allowed';
      case 'unavailable':
        return 'bg-slate-600 text-slate-400 cursor-not-allowed';
      default:
        return 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white';
    }
  };
  
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 ${className}`}>
      {timeSlots.map((slot) => {
        const status = getSlotStatus(slot);
        const isDisabled = status === 'booked' || status === 'unavailable';
        
        return (
          <button
            key={slot}
            onClick={() => !isDisabled && onSlotToggle(slot)}
            disabled={isDisabled}
            className={`p-3 text-sm font-medium rounded-md border transition-colors ${getSlotStyles(status)} ${
              status === 'selected' ? colors.primaryBorder : 'border-slate-600'
            }`}
          >
            <div className="flex items-center justify-center">
              <Clock className="w-4 h-4 mr-2" />
              {slot}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// Optimized Image Component
export const OptimizedImage = ({ 
  src,
  alt = '',
  fallback,
  placeholder = true,
  width,
  height,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  
  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);
  
  const handleLoad = (e) => {
    setIsLoading(false);
    onLoad?.(e);
  };
  
  const handleError = (e) => {
    setIsLoading(false);
    setHasError(true);
    if (fallback) {
      setImageSrc(fallback);
      setHasError(false);
    }
    onError?.(e);
  };
  
  if (hasError && !fallback) {
    return (
      <div className={`bg-slate-600 flex items-center justify-center text-slate-400 ${className}`} style={{ width, height }}>
        <span className="text-sm">Kunne ikke indlæse billede</span>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && placeholder && (
        <div className="absolute inset-0 bg-slate-600 animate-pulse flex items-center justify-center">
          <div className="text-slate-400 text-sm">Indlæser...</div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        {...props}
      />
    </div>
  );
};

// Avatar Component
export const Avatar = ({ 
  src,
  alt = '',
  fallback,
  size = 'md',
  name,
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);
  
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  if (src && !hasError) {
    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden bg-slate-600 flex-shrink-0 ${className}`}>
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  
  if (fallback) {
    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden bg-slate-600 flex-shrink-0 ${className}`}>
        <img src={fallback} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }
  
  return (
    <div className={`${sizes[size]} rounded-full bg-slate-600 flex items-center justify-center text-white font-medium flex-shrink-0 ${className}`}>
      {getInitials(name || alt)}
    </div>
  );
};

// Image Upload Component
export const ImageUpload = ({ 
  onUpload,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  preview = true,
  currentImage,
  className = ''
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const { success, error: showError } = useToast();
  const fileInputRef = useRef(null);
  
  const handleFile = async (file) => {
    if (!file) return;
    
    if (file.size > maxSize) {
      alert(`Filen er for stor. Maksimal størrelse er ${maxSize / (1024 * 1024)}MB`);
      return;
    }
    
    if (preview) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    
    try {
      setUploading(true);
      await onUpload(file);
      success('Billede uploadet succesfuldt');
    } catch (error) {
      console.error('Upload failed:', error);
      showError('Upload fejlede. Prøv igen.');
      if (preview) {
        setPreviewUrl(currentImage);
      }
    } finally {
      setUploading(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };
  
  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600 hover:border-slate-500'
        }`}
      >
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative w-32 h-32 mx-auto">
              <OptimizedImage
                src={previewUrl}
                alt="Preview"
                className="rounded-lg"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors disabled:opacity-50"
            >
              Skift billede
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-slate-700 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-300 mb-2">Træk og slip et billede her, eller</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                Vælg billede
              </button>
            </div>
            <p className="text-slate-400 text-sm">
              Maksimal størrelse: {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

// Skeleton Loading Components
export const Skeleton = ({ 
  variant = 'rectangle',
  width = '100%',
  height = '1rem',
  className = ''
}) => {
  const variants = {
    rectangle: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4'
  };
  
  return (
    <div 
      className={`bg-slate-600 animate-pulse ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

export const CardSkeleton = ({ className = '' }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4 ${className}`}>
    <Skeleton height="1.5rem" width="60%" />
    <Skeleton height="1rem" width="100%" />
    <Skeleton height="1rem" width="80%" />
    <div className="flex space-x-2">
      <Skeleton width="4rem" height="2rem" />
      <Skeleton width="4rem" height="2rem" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-lg overflow-hidden ${className}`}>
    <div className="p-4 border-b border-slate-700">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="1rem" width="80%" />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="p-4 border-b border-slate-700 last:border-b-0">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="1rem" width={colIndex === 0 ? "100%" : "60%"} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default {
  Calendar,
  TimeSlotGrid,
  OptimizedImage,
  Avatar,
  ImageUpload,
  Skeleton,
  CardSkeleton,
  TableSkeleton
};
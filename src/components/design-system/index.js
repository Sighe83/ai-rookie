// Design System Index - Main entry point for all design system components

// Core Design System
export {
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
} from './DesignSystem.jsx';

// Form Components
export {
  PasswordInput,
  Select,
  Textarea,
  Checkbox,
  RadioGroup,
  Toggle,
  FileUpload
} from './FormComponents.jsx';

// Layout Components
export {
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
} from './LayoutComponents.jsx';

// Data Components
export {
  DataTable,
  StatCard,
  ProgressBar,
  MetricCard,
  KeyValueList,
  DataList,
  Pagination as DataPagination
} from './DataComponents.jsx';

// Navigation Components
export {
  NavigationTabs,
  Breadcrumb,
  Dropdown,
  SideNavigation,
  TopNavigation,
  Pagination,
  MegaMenu
} from './NavigationComponents.jsx';

// Specialized Components
export {
  Calendar,
  TimeSlotGrid,
  OptimizedImage,
  Avatar,
  ImageUpload,
  Skeleton,
  CardSkeleton,
  TableSkeleton
} from './SpecializedComponents.jsx';

// Notification Components
export {
  ToastProvider,
  useToast,
  Toast,
  NotificationBell,
  Banner,
  ProgressNotification
} from './NotificationComponents.jsx';

// Design System Utilities
export const DesignSystemUtils = {
  // Common component patterns
  patterns: {
    cardHover: 'hover:border-purple-500/50 transition-colors',
    focusRing: 'focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900',
    textTransition: 'transition-colors duration-200',
    buttonTransition: 'transition-all duration-200'
  },
  
  // Responsive breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Common spacing scale
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  
  // Animation durations
  animation: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms'
  }
};

// Component composition helpers
export const createThemedComponent = (BaseComponent, defaultProps = {}) => {
  return (props) => {
    // This would need to be used in a .jsx file for JSX syntax
    // For now, return a function that creates the component
    return { BaseComponent, defaultProps, props };
  };
};

// Common hook for consistent component behavior
export const useDesignSystemProps = (props, defaults = {}) => {
  return {
    ...defaults,
    ...props,
    className: `${defaults.className || ''} ${props.className || ''}`.trim()
  };
};
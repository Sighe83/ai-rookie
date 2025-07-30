import React, { useState, useMemo, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { useTutors, useCreateBooking, useBookings } from './hooks/useApi';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import {
  Briefcase,
  Users,
  TrendingUp,
  Factory,
  Building2,
  Lightbulb,
  ChevronDown,
  ArrowRight,
  Award,
  BrainCircuit,
  Rocket,
  ClipboardCheck,
  Menu,
  X,
  Target,
  Clock,
  Shield,
  Linkedin,
  Star,
  DollarSign,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogIn,
  UserPlus,
  User as UserIcon,
  LogOut,
} from 'lucide-react';

// Site Mode Context
const SiteModeContext = createContext();

// Safe localStorage utilities
const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.warn('localStorage getItem failed:', error);
    }
    return null;
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.warn('localStorage setItem failed:', error);
    }
    return false;
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.warn('localStorage removeItem failed:', error);
    }
    return false;
  }
};

// Safe JSON parsing utility
const safeJsonParse = (jsonString, fallback = null) => {
  try {
    if (typeof jsonString === 'string' && jsonString.trim()) {
      const parsed = JSON.parse(jsonString);
      return parsed;
    }
  } catch (error) {
    console.warn('JSON parse failed:', error);
  }
  return fallback;
};

const SiteModeProvider = ({ children }) => {
  const [siteMode, setSiteMode] = useState(() => {
    const saved = safeLocalStorage.getItem('ai-rookie-site-mode');
    return saved || 'b2b';
  });

  const toggleSiteMode = useMemo(() => {
    return (onModeChange) => {
      const newMode = siteMode === 'b2b' ? 'b2c' : 'b2b';
      setSiteMode(newMode);
      safeLocalStorage.setItem('ai-rookie-site-mode', newMode);
      
      // Call callback if provided (for navigation)
      if (onModeChange && typeof onModeChange === 'function') {
        onModeChange(newMode);
      }
    };
  }, [siteMode]);

  const contextValue = useMemo(() => ({
    siteMode,
    toggleSiteMode
  }), [siteMode, toggleSiteMode]);

  return (
    <SiteModeContext.Provider value={contextValue}>
      {children}
    </SiteModeContext.Provider>
  );
};

const useSiteMode = () => {
  const context = useContext(SiteModeContext);
  if (!context) {
    throw new Error('useSiteMode must be used within a SiteModeProvider');
  }
  return context;
};

// B2B Mock data (now replaced by API)
/* const b2bTutors = [
  {
    id: 1,
    name: 'Mette Jensen',
    title: 'Marketing Director & AI‑praktiker',
    valueProp: 'Øg jeres marketing‑output med 10× uden ekstra headcount.',
    specialty: 'AI for Marketing & Kommunikation',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=MJ',
    sessions: [
      {
        id: 1,
        title: 'Skaler content‑produktionen med AI',
        description: 'Strømliner jeres SoMe & kampagner gennem smart prompt‑design og værktøjer.',
      },
      {
        id: 2,
        title: 'Datadrevet kampagneoptimering',
        description: 'Lær at bruge AI til at analysere kampagnedata og justere i realtid.',
      },
    ],
    basePrice: 850,
  },
  {
    id: 2,
    name: 'Lars Petersen',
    title: 'Sales VP & Workflow‑Optimist',
    valueProp: 'Forkort salgscyklussen med gennemsnitligt 32 %.',
    specialty: 'Effektivitets‑boost i salgsorganisationer',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=LP',
    sessions: [
      {
        id: 3,
        title: 'Lead‑research på autopilot',
        description: 'Automatisér indsamling & kvalificering af leads med AI‑drevne pipelines.',
      },
      {
        id: 4,
        title: 'AI‑assist til salgs‑mails',
        description: 'Personaliser salgs‑kommunikation i skala — uden at miste det menneskelige touch.',
      },
    ],
    basePrice: 995,
  },
  {
    id: 3,
    name: 'Anna Kristensen',
    title: 'Operations Manager & Automation Expert',
    valueProp: 'Reducer manuelle processer med op til 60% gennem intelligent automatisering.',
    specialty: 'Proces‑optimering & AI‑workflows',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=AK',
    sessions: [
      {
        id: 5,
        title: 'Automatisér dokumenthåndtering',
        description: 'Implementér AI‑baserede systemer til at behandle og kategorisere dokumenter.',
      },
      {
        id: 6,
        title: 'Intelligent kvalitetskontrol',
        description: 'Opsæt AI‑drevne kontroller der fanger fejl før de når kunden.',
      },
    ],
    basePrice: 925,
  },
]; */

const b2bTestimonials = [
  {
    quote: 'Efter tre team‑workshops fik vores marketingafdeling fordoblet outputtet uden ekstra budget. AI Rookie Enterprise var lynhurtigt tjent hjem.',
    name: 'Stine Ø.',
    role: 'CMO, SaaS‑scale‑up',
  },
  {
    quote: 'Vores salgs‑pipeline er blevet 30 % hurtigere. Investeringen i gruppesessioner gav positiv ROI på under en måned.',
    name: 'Poul A.',
    role: 'Chief Revenue Officer',
  },
  {
    quote: 'Automatiseringen af vores kvalitetskontrol har sparet os 15 timer om ugen. Fantastisk ROI!',
    name: 'Thomas B.',
    role: 'Operations Director',
  },
];

// B2C Mock data (now replaced by API)
/* const b2cTutors = [
  {
    id: 1,
    name: 'Mette Jensen',
    title: 'Marketing Director & AI Praktiker',
    experience: 'Forstår travle professionelles behov for hurtig, relevant læring.',
    specialty: 'Praktisk AI for Marketing & Kommunikation',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=MJ',
    price: 695,
    sessions: [
      {
        id: 1,
        title: 'Få ideer til SoMe-opslag på minutter',
        description: 'Lær at bruge AI til at brainstorme og skabe indhold til sociale medier, der fanger opmærksomhed.',
      },
      {
        id: 2,
        title: 'Skriv bedre marketingtekster med AI',
        description: 'Optimer dine nyhedsbreve, annoncer og webtekster ved hjælp af en AI-assistent.',
      },
      {
        id: 3,
        title: 'Analyser en konkurrents marketing',
        description: 'Få indsigt i dine konkurrenters strategi ved at lade en AI analysere deres online tilstedeværelse.',
      },
    ],
  },
  {
    id: 2,
    name: 'Lars Petersen',
    title: 'Sales VP & Workflow-Optimist',
    experience: 'Specialist i at omsætte AI til målbare salgsresultater.',
    specialty: 'Effektivitets-boost med AI for Salgsteams',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=LP',
    price: 950,
    sessions: [
      {
        id: 4,
        title: 'Automatiser research af nye leads',
        description: 'Spar timer på at finde og kvalificere potentielle kunder med AI-drevne værktøjer.',
      },
      {
        id: 5,
        title: 'Skriv personlige salgs-emails hurtigere',
        description: 'Lær teknikker til at skræddersy dine salgs-emails i stor skala uden at miste det personlige touch.',
      },
      {
        id: 6,
        title: 'Forbered dig til et kundemøde med AI',
        description: 'Brug AI til at indsamle de vigtigste informationer om en kunde lige før et vigtigt møde.',
      },
    ],
  },
  {
    id: 3,
    name: 'Helle Nielsen',
    title: 'HR Business Partner & AI Adoption Lead',
    experience: 'Hjælper ledere med at integrere AI i teams og processer.',
    specialty: 'AI for Ledere: Fra Strategi til Handling',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=HN',
    price: 475,
    sessions: [
      {
        id: 7,
        title: 'Skriv effektive jobopslag med AI',
        description: 'Lær at formulere jobopslag, der tiltrækker de rigtige kandidater ved hjælp af AI.',
      },
      {
        id: 8,
        title: 'Introduktion til AI for ledere',
        description: 'Få et strategisk overblik over, hvad AI betyder for din afdeling og din rolle som leder.',
      },
      {
        id: 9,
        title: 'Brug AI i MUS-samtaler',
        description: 'Opdag hvordan AI kan hjælpe med at forberede og strukturere udviklingssamtaler med medarbejdere.',
      },
    ],
  },
  {
    id: 4,
    name: 'Camilla Holm',
    title: 'Indkøbschef & Udbudsspecialist',
    experience: 'Bruger AI til at navigere komplekse udbudsmaterialer og leverandøranalyser.',
    specialty: 'AI i Procurement og EU-udbud',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=CH',
    price: 850,
    sessions: [
      {
        id: 10,
        title: 'Analyser udbudsmateriale på rekordtid',
        description: 'Lær at bruge AI til hurtigt at ekstrahere krav og risici fra store EU-udbudsdokumenter.',
      },
      {
        id: 11,
        title: 'Optimer din leverandør-screening',
        description: 'Brug AI til at analysere og sammenligne potentielle leverandører baseret på data.',
      },
      {
        id: 12,
        title: 'Udarbejd et første udkast til tilbud',
        description: 'Se hvordan AI kan generere strukturerede og velformulerede første udkast til tilbudsgivning.',
      },
    ],
  },
  {
    id: 5,
    name: 'Jesper Thomsen',
    title: 'Senior Projektleder (PMP)',
    experience: 'Anvender AI til at forbedre projektplanlægning, risikostyring og stakeholder-kommunikation.',
    specialty: 'AI-drevet Projektledelse',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=JT',
    price: 750,
    sessions: [
      {
        id: 13,
        title: 'Udarbejd projektplaner med AI',
        description: 'Lær at bruge AI til at generere tidslinjer, identificere afhængigheder og definere milestones.',
      },
      {
        id: 14,
        title: 'Automatiser din statusrapportering',
        description: 'Omsæt rå data og noter til præcise og letforståelige statusrapporter for stakeholders.',
      },
      {
        id: 15,
        title: 'Identificer projektrisici proaktivt',
        description: 'Brug AI til at analysere projektdata og forudse potentielle faldgruber, før de opstår.',
      },
    ],
  },
  {
    id: 6,
    name: 'David Chen',
    title: 'Lead Developer & Tech Mentor',
    experience: 'Fokuserer på at bruge AI-værktøjer som Copilot til at skrive bedre kode hurtigere og reducere fejl.',
    specialty: 'AI for Softwareudviklere',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=DC',
    price: 800,
    sessions: [
      {
        id: 16,
        title: 'Mestr AI-assisteret kodning (Copilot)',
        description: 'Lær avancerede teknikker til at få maksimal værdi ud af din AI-kodeassistent.',
      },
      {
        id: 17,
        title: 'Automatiseret debugging og kode-reviews',
        description: 'Se hvordan AI kan finde fejl og foreslå forbedringer i din kodebase.',
      },
      {
        id: 18,
        title: 'Skriv unit tests på den halve tid',
        description: 'Brug AI til at generere meningsfulde og dækkende tests for din kode.',
      },
    ],
  },
  {
    id: 7,
    name: 'Henrik Falk',
    title: 'Director of Security, CPH Airport',
    experience: 'Praktisk erfaring med at bruge AI som et ledelsesværktøj til operationel planlægning og analyse.',
    specialty: 'Praktisk AI for Operationelle Ledere',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=HF',
    price: 1000,
    sessions: [
      {
        id: 19,
        title: 'AI som din personlige ledelses-sparringspartner',
        description: 'Brug AI til at forberede svære samtaler, analysere team-dynamikker og formulere klar kommunikation.',
      },
      {
        id: 20,
        title: 'Analyser hændelsesrapporter for mønstre',
        description: 'Lær at bruge AI til at finde skjulte sammenhænge og tendenser i store mængder operationel data.',
      },
      {
        id: 21,
        title: 'Udarbejd bemandingsplaner og scenarier',
        description: 'Se hvordan AI kan hjælpe med at optimere ressourceallokering og simulere forskellige operationelle scenarier.',
      },
    ],
  },
  {
    id: 8,
    name: 'Sofie Bruun',
    title: 'Advokat & Partner',
    experience: 'Pioner inden for brug af AI til juridisk research, due diligence og kontraktanalyse.',
    specialty: 'AI i den Juridiske Verden',
    img: 'https://placehold.co/100x100/E2E8F0/4A5568?text=SB',
    price: 975,
    sessions: [
      {
        id: 22,
        title: 'Effektiviser din juridiske research med AI',
        description: 'Find relevante domme og lovtekster på en brøkdel af tiden med AI-drevne søgeværktøjer.',
      },
      {
        id: 23,
        title: 'Analyser kontrakter for risici og klausuler',
        description: 'Lær at bruge AI til hurtigt at identificere problematiske eller vigtige afsnit i juridiske dokumenter.',
      },
      {
        id: 24,
        title: 'Forbered en sag med AI-drevet dokumentanalyse',
        description: 'Se hvordan AI kan organisere og opsummere tusindvis af siders sagsakter til et klart overblik.',
      },
    ],
  },
]; */

const b2cTestimonials = [
  {
    quote: 'Jeg troede, jeg var bagud, men efter få sessions følte jeg mig som den skarpeste i teamet. Det handler ikke om at lære alt, men at lære det rigtige. Det forstod min tutor perfekt.',
    name: 'Charlotte P.',
    role: 'Projektleder, 44',
  },
  {
    quote: 'Det at kunne tale kvalificeret om AI med ledelsen og kunder har givet mig en helt ny selvtillid. Det er den bedste investering, jeg har lavet i min karriere i årevis.',
    name: 'Michael B.',
    role: 'Key Account Manager, 51',
  },
];

// Constants
const FORMAT_MULTIPLIER = {
  individual: 1,
  team: 8,
  program: 25,
};

const FORMAT_LABEL = {
  individual: '1‑til‑1 sparring',
  team: 'Team‑workshop (op til 10 pers.)',
  program: '6‑ugers forløb',
};

// B2C Session Format Constants
const B2C_FORMAT_MULTIPLIER = {
  individual: 1,
  group: 0.7, // 30% discount for group sessions
};

const B2C_FORMAT_LABEL = {
  individual: '1‑til‑1 session',
  group: 'Gruppesession (op til 10 deltagere)',
};

const B2C_FORMAT_DESCRIPTION = {
  individual: 'Personlig session kun for dig',
  group: 'Fælles session med andre deltagere - spar 30%',
};

// Safe date utilities
const safeDateUtils = {
  isValidDate: (date) => {
    return date instanceof Date && !isNaN(date.getTime());
  },
  
  addDays: (date, days) => {
    if (!safeDateUtils.isValidDate(date) || typeof days !== 'number') {
      return null;
    }
    const result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
  },
  
  formatDateKey: (date) => {
    if (!safeDateUtils.isValidDate(date)) {
      return null;
    }
    try {
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Date formatting failed:', error);
      return null;
    }
  }
};

// Availability Helper Functions (with safety checks and memoization)
const generateAvailabilitySlots = (tutorId) => {
  if (!tutorId || typeof tutorId !== 'number') {
    console.warn('Invalid tutorId provided to generateAvailabilitySlots');
    return [];
  }

  const slots = [];
  const today = new Date();
  
  if (!safeDateUtils.isValidDate(today)) {
    console.error('Invalid date in generateAvailabilitySlots');
    return [];
  }
  
  // Generate availability for the next 14 days
  for (let i = 1; i <= 14; i++) {
    const date = safeDateUtils.addDays(today, i);
    if (!date) continue;
    
    // Skip weekends for most tutors
    const dayOfWeek = date.getDay();
    if ((dayOfWeek === 0 || dayOfWeek === 6) && tutorId % 3 !== 0) {
      continue; // Only every 3rd tutor works weekends
    }
    
    const dateStr = safeDateUtils.formatDateKey(date);
    if (!dateStr) continue;
    
    const availableSlots = [];
    
    // Generate time slots based on tutor preferences
    const startHour = tutorId % 2 === 0 ? 9 : 10;
    const endHour = tutorId % 3 === 0 ? 17 : 16;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      // Skip lunch hour (12-13)
      if (hour === 12) continue;
      
      // Use seeded randomness for consistent results per tutor
      const seed = tutorId * 1000 + i * 100 + hour;
      const isAvailable = ((seed * 9301 + 49297) % 233280) / 233280 > 0.3;
      
      if (isAvailable) {
        availableSlots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: true,
          booked: false,
        });
      }
    }
    
    if (availableSlots.length > 0) {
      slots.push({
        date: dateStr,
        slots: availableSlots,
      });
    }
  }
  
  return slots;
};

// Mock availability data - in a real app, this would come from an API
const getTutorAvailability = (tutorId) => {
  return generateAvailabilitySlots(tutorId);
};

// Custom hook for booking state
const useBookingState = () => {
  const { siteMode } = useSiteMode();
  const storageKey = `ai-rookie-bookings-${siteMode}`;
  
  const [bookings, setBookings] = useState(() => {
    const saved = safeLocalStorage.getItem(storageKey);
    return safeJsonParse(saved, []);
  });

  const addBooking = (booking) => {
    if (!booking || typeof booking !== 'object') {
      console.warn('Invalid booking object provided');
      return;
    }

    try {
      // Deep clone to prevent mutations
      const safeBooking = {
        ...JSON.parse(JSON.stringify(booking)),
        id: Date.now(),
        siteMode
      };
      
      const newBookings = [...bookings, safeBooking];
      setBookings(newBookings);
      
      const jsonString = JSON.stringify(newBookings);
      safeLocalStorage.setItem(storageKey, jsonString);
    } catch (error) {
      console.error('Failed to add booking:', error);
    }
  };

  return { bookings, addBooking };
};

// Components
const AuthButtons = ({ onAuthClick, onProfileClick }) => {
  const { user, isAuthenticated } = useAuth();
  const { siteMode } = useSiteMode();
  const isB2B = siteMode === 'b2b';

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white text-sm"
        >
          <UserIcon className="w-4 h-4" />
          <span className="hidden sm:block">{user.name}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <button
        onClick={() => onAuthClick('signup')}
        className={`flex items-center gap-1 px-4 py-2 ${isB2B ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-lg transition-colors text-white text-sm font-semibold shadow-lg`}
      >
        <UserPlus className="w-4 h-4" />
        <span>Kom i gang</span>
      </button>
    </div>
  );
};

const SiteModeToggle = ({ onModeChange }) => {
  const { siteMode, toggleSiteMode } = useSiteMode();
  
  const handleToggle = () => {
    toggleSiteMode(onModeChange);
  };
  
  return (
    <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-600">
      <button
        onClick={() => siteMode !== 'b2b' && handleToggle()}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
          siteMode === 'b2b' 
            ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' 
            : 'text-slate-400 hover:text-green-400 hover:bg-slate-700'
        }`}
        title={siteMode === 'b2b' ? 'Aktiv: B2B mode' : 'Skift til B2B mode'}
      >
        <Building2 className="w-4 h-4" />
        B2B
        {siteMode === 'b2b' && <span className="text-xs bg-green-500 px-1.5 py-0.5 rounded-full">Aktiv</span>}
      </button>
      <button
        onClick={() => siteMode !== 'b2c' && handleToggle()}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
          siteMode === 'b2c' 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
            : 'text-slate-400 hover:text-blue-400 hover:bg-slate-700'
        }`}
        title={siteMode === 'b2c' ? 'Aktiv: B2C mode' : 'Skift til B2C mode'}
      >
        <UserIcon className="w-4 h-4" />
        B2C
        {siteMode === 'b2c' && <span className="text-xs bg-blue-500 px-1.5 py-0.5 rounded-full">Aktiv</span>}
      </button>
    </div>
  );
};

const MobileMenu = ({ isOpen, onClose, currentPage, onAuthClick, onProfileClick, isAuthenticated }) => {
  const navigate = useNavigate();
  const { siteMode } = useSiteMode();
  const isB2B = siteMode === 'b2b';
  
  const handleNavigation = (page) => {
    navigate(page === 'home' ? '/' : `/${page}`);
    onClose();
  };

  if (!isOpen) return null;

  const navItems = siteMode === 'b2b' 
    ? [
        { label: 'Hjem', key: 'home' }, 
        { label: 'Eksperter', key: 'tutors' },
        ...(isAuthenticated ? [{ label: 'Dashboard', key: 'dashboard' }] : [])
      ]
    : [
        { label: 'Hjem', key: 'home' }, 
        { label: 'Find Tutor', key: 'tutors' },
        ...(isAuthenticated ? [{ label: 'Dashboard', key: 'dashboard' }] : [])
      ];

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-64 bg-slate-800 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <span className="text-white font-bold">Menu</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 border-b border-slate-700">
          <SiteModeToggle onModeChange={() => {
            navigate('/');
            onClose();
          }} />
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigation(item.key)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === item.key ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        
        {/* Auth Section */}
        <div className="p-4 border-t border-slate-700">
          {isAuthenticated ? (
            <button
              onClick={() => {
                onProfileClick();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white text-sm"
            >
              <UserIcon className="w-4 h-4" />
              Min Profil
            </button>
          ) : (
            <button
              onClick={() => {
                onAuthClick('signup');
                onClose();
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 ${isB2B ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-lg transition-colors text-white text-sm font-semibold shadow-lg`}
            >
              <UserPlus className="w-4 h-4" />
              Kom i gang
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const TutorCard = ({ tutor, onSelect, isExpanded, onExpand }) => {
  const { siteMode } = useSiteMode();
  const isB2B = siteMode === 'b2b';
  
  return (
    <div
      className={`bg-slate-800 rounded-lg overflow-hidden transition-all duration-300 ${
        isExpanded ? `ring-2 ${isB2B ? 'ring-green-500' : 'ring-blue-500'}` : 'hover:bg-slate-700/50'
      }`}
    >
      <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
        <img
          src={tutor.img}
          alt={tutor.name}
          className="w-24 h-24 rounded-full mx-auto sm:mx-0 flex-shrink-0 border-4 border-slate-700"
        />
        <div className="flex-grow text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">{tutor.name}</h3>
          <p className={`${isB2B ? 'text-blue-400' : 'text-blue-400'} font-semibold`}>{tutor.title}</p>
          <p className="text-sm text-slate-300 mt-1 flex items-center justify-center sm:justify-start gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" /> {tutor.specialty}
          </p>
          {isB2B && tutor.valueProp && (
            <p className="text-slate-400 text-xs mt-2 italic">{tutor.valueProp}</p>
          )}
          {!isB2B && tutor.experience && (
            <p className="text-slate-400 text-xs mt-2 italic">{tutor.experience}</p>
          )}
        </div>
        <div className="flex-shrink-0 mt-4 sm:mt-0">
          <button
            onClick={() => onExpand(tutor.id)}
            className={`${isB2B ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2`}
          >
            {isB2B ? 'Se Workshops' : 'Vælg Session & Se Pris'} <ChevronDown className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-slate-800/50 px-6 pb-6 pt-4 border-t border-slate-700">
          <h4 className="font-bold text-white mb-3">{isB2B ? 'Vælg et emne:' : 'Vælg et emne for din session:'}</h4>
          <div className="space-y-4">
            {tutor.sessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4"
              >
                <div>
                  <p className="font-semibold text-white">{session.title}</p>
                  <p className="text-sm text-slate-400">{session.description}</p>
                </div>
                <div className="flex-shrink-0 text-center">
                  {!isB2B && (
                    <p className="text-xl font-bold text-white">{tutor.price},-</p>
                  )}
                  <button
                    onClick={() => onSelect(tutor, session)}
                    className={`${!isB2B ? 'mt-1' : ''} ${isB2B ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'} text-white text-sm font-bold py-2 px-5 rounded-lg transition-colors flex items-center gap-2`}
                  >
                    Book <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
  </div>
);

const AvailabilityCalendar = ({ tutor, selectedDateTime, onSelectDateTime }) => {
  const [currentWeek, setCurrentWeek] = useState(0);
  
  // Validate props
  if (!tutor || !tutor.id) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="text-center py-8 text-slate-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Tutor information ikke tilgængelig</p>
        </div>
      </div>
    );
  }

  // Memoize expensive availability calculation
  const availability = useMemo(() => {
    try {
      return getTutorAvailability(tutor.id);
    } catch (error) {
      console.error('Failed to get tutor availability:', error);
      return [];
    }
  }, [tutor.id]);
  
  const getWeekDates = (weekOffset) => {
    const dates = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1 + (weekOffset * 7));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  const weekDates = getWeekDates(currentWeek);
  const maxWeeks = 2; // Show 2 weeks ahead
  
  const formatDate = (date) => {
    return date.toLocaleDateString('da-DK', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };
  
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  const getAvailabilityForDate = (date) => {
    const dateKey = formatDateKey(date);
    return availability.find(a => a.date === dateKey);
  };
  
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Vælg tid med {tutor.name}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
            disabled={currentWeek === 0}
            className="p-1 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <span className="text-sm text-slate-400 min-w-[80px] text-center">
            Uge {currentWeek + 1}
          </span>
          <button
            onClick={() => setCurrentWeek(Math.min(maxWeeks - 1, currentWeek + 1))}
            disabled={currentWeek >= maxWeeks - 1}
            className="p-1 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDates.map((date, index) => {
          const dateAvailability = getAvailabilityForDate(date);
          const hasSlots = dateAvailability && dateAvailability.slots.length > 0;
          
          return (
            <div
              key={index}
              className={`p-2 rounded-lg text-center text-sm ${
                hasSlots ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              <div className="font-medium">{formatDate(date)}</div>
              {hasSlots && (
                <div className="text-xs text-slate-400 mt-1">
                  {dateAvailability.slots.length} slots
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="space-y-4">
        {weekDates.map((date, index) => {
          const dateAvailability = getAvailabilityForDate(date);
          if (!dateAvailability || dateAvailability.slots.length === 0) return null;
          
          return (
            <div key={index} className="border-t border-slate-700 pt-4 first:border-t-0 first:pt-0">
              <h4 className="font-medium text-white mb-2">{formatDate(date)}</h4>
              <div className="grid grid-cols-4 gap-2">
                {dateAvailability.slots.map((slot, slotIndex) => {
                  const dateTimeKey = `${formatDateKey(date)}T${slot.time}`;
                  const isSelected = selectedDateTime === dateTimeKey;
                  
                  return (
                    <button
                      key={slotIndex}
                      onClick={() => onSelectDateTime(dateTimeKey)}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {availability.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Ingen ledige tider i øjeblikket</p>
        </div>
      )}
    </div>
  );
};

// Pages
const B2BHomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const minPrice = 850; // Default minimum price for B2B
  
  return (
    <div className="space-y-24 pb-20">
      <section className="text-center pt-20 pb-14 max-w-3xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight">
          Hello <span className="text-green-400">AI Rookie</span>
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          AI Rookie Enterprise leverer hands‑on workshops og forløb, der
          omsætter AI til målbare resultater på bundlinjen.
        </p>
        <button
          onClick={() => navigate('/tutors')}
          className="mt-8 bg-green-600 text-white font-bold text-lg py-4 px-8 rounded-lg transform hover:scale-105 transition-transform shadow-lg shadow-green-600/30"
        >
          <Rocket className="inline-block mr-2" /> Udforsk Eksperter
        </button>
        <p className="mt-6 text-slate-400 text-sm">
          Fra kun {minPrice} kr. pr. medarbejder for 1‑til‑1‑sessioner.
        </p>
      </section>

      <section className="bg-slate-800/50 rounded-lg p-10 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-2">
          Din bundlinje
        </h2>
        <p className="text-center text-slate-400 mb-10 max-w-3xl mx-auto">
          Uanset om det gælder marketing, salg eller operationel excellence,
          leverer vores eksperter målbare forbedringer, der kan aflæses i
          KPI‑erne.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="border-2 border-green-500 bg-slate-800 p-6 rounded-lg shadow-xl shadow-green-500/20">
            <Briefcase className="w-10 h-10 mx-auto text-green-400 mb-2" />
            <p className="font-bold text-green-400 text-sm mb-1">0‑2 MDR.</p>
            <h3 className="text-xl font-bold text-white mt-2 mb-1">
              <span className="text-green-400">ROI</span> • Måleligt afkast
            </h3>
            <p className="text-slate-300 mt-2 text-sm">
              Se konkrete KPI‑løft og en payback‑tid på max 8 uger.
            </p>
          </div>
          <div className="border-2 border-green-500 bg-slate-800 p-6 rounded-lg">
            <Users className="w-10 h-10 mx-auto text-green-400 mb-2" />
            <p className="font-bold text-green-400 text-sm mb-1">6 MDR.</p>
            <h3 className="text-xl font-bold text-white mt-2 mb-1">
              <span className="text-green-400">Team</span> • Hurtig adoption
            </h3>
            <p className="text-slate-400 mt-2 text-sm">
              Hele afdelingen arbejder sikkert med AI‑flows og best practices.
            </p>
          </div>
          <div className="border-2 border-green-500 bg-slate-800 p-6 rounded-lg">
            <TrendingUp className="w-10 h-10 mx-auto text-green-400 mb-2" />
            <p className="font-bold text-green-400 text-sm mb-1">1 ÅR</p>
            <h3 className="text-xl font-bold text-white mt-2 mb-1">
              <span className="text-green-400">Skalering</span> • Vedvarende effekt
            </h3>
            <p className="text-slate-400 mt-2 text-sm">
              AI‑kompetencer forankret på tværs af organisationen.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          HR‑ og L&D‑chefer fortæller
        </h2>
        <div className="space-y-8">
          {b2bTestimonials.map((testimonial, i) => (
            <div
              key={i}
              className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto"
            >
              <p className="text-slate-300 text-lg italic">"{testimonial.quote}"</p>
              <p className="mt-4 font-bold text-white text-right">
                – {testimonial.name}, <span className="text-slate-400">{testimonial.role}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const B2CHomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const minPrice = 475; // Default minimum price for B2C

  return (
    <div className="space-y-20 sm:space-y-28 pb-20">
      <section className="text-center pt-20 pb-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
          Hello <span className="text-blue-400">AI Rookie</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-300">
          Gør AI til din personlige styrke. Lær præcis de færdigheder, du har brug for, og omsæt dem til konkrete fordele i din karriere – hurtigt og effektivt.
        </p>
        <button
          onClick={() => navigate('/tutors')}
          className="mt-8 bg-blue-600 text-white font-bold text-lg py-4 px-8 rounded-lg transform hover:scale-105 transition-transform shadow-lg shadow-blue-600/30"
        >
          <Rocket className="inline-block mr-2" /> Find Din Vej til AI
        </button>
        <div className="mt-6">
          <p className="text-lg text-white">
            En investering i din karriere. <span className="font-bold text-blue-400">Fra kun {minPrice} kr. pr. session.</span>
          </p>
        </div>
      </section>
      
      <section className="bg-slate-800/50 rounded-lg p-8 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-2">Din karriere</h2>
        <p className="text-center text-slate-400 mb-10 max-w-3xl mx-auto">
          AI-kompetencer er på en rejse fra at være en unik fordel til at blive en fundamental forventning. Her ser du, hvorfor det er en fordel at handle nu.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="border-2 border-blue-500 bg-slate-800 p-6 rounded-lg shadow-xl shadow-blue-500/20">
            <Rocket className="w-10 h-10 mx-auto text-blue-400 mb-2" />
            <p className="font-bold text-blue-400 text-sm mb-1">0‑2 MDR.</p>
            <h3 className="text-xl font-bold text-white mt-2 mb-1">
              <span className="text-blue-400">Kickstart</span> • Synlige sejre
            </h3>
            <p className="text-slate-300 mt-2 text-sm">
              Spar 2‑4 timer om ugen og imponer chefen med hurtige AI‑løsninger.
            </p>
          </div>
          <div className="border-2 border-blue-500 bg-slate-800 p-6 rounded-lg">
            <Award className="w-10 h-10 mx-auto text-blue-400 mb-2" />
            <p className="font-bold text-blue-400 text-sm mb-1">6 MDR.</p>
            <h3 className="text-xl font-bold text-white mt-2 mb-1">
              <span className="text-blue-400">Troværdighed</span> • Bliv go‑to‑person
            </h3>
            <p className="text-slate-400 mt-2 text-sm">
              Du er nu "AI‑champ" i teamet og driver små projekter på egne ben.
            </p>
          </div>
          <div className="border-2 border-blue-500 bg-slate-800 p-6 rounded-lg">
            <TrendingUp className="w-10 h-10 mx-auto text-blue-400 mb-2" />
            <p className="font-bold text-blue-400 text-sm mb-1">1 ÅR</p>
            <h3 className="text-xl font-bold text-white mt-2 mb-1">
              <span className="text-blue-400">Karriereboost</span> • Klar til næste step
            </h3>
            <p className="text-slate-400 mt-2 text-sm">
              Du har dokumenteret impact og står stærkt til løn‑ eller stillingshop.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          Hør fra andre professionelle, der har styrket deres karriere
        </h2>
        <div className="space-y-8">
          {b2cTestimonials.map((testimonial, index) => (
            <div key={index} className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
              <p className="text-slate-300 text-lg italic">"{testimonial.quote}"</p>
              <p className="mt-4 font-bold text-white text-right">
                – {testimonial.name}, <span className="font-normal text-slate-400">{testimonial.role}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const HomePage = () => {
  const { siteMode } = useSiteMode();
  
  return siteMode === 'b2b' ? <B2BHomePage /> : <B2CHomePage />;
};

const TutorsPage = () => {
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();
  const { siteMode } = useSiteMode();
  
  // Use API to fetch tutors
  const { data: tutors = [], loading, error } = useTutors(siteMode.toUpperCase());
  const isB2B = siteMode === 'b2b';
  
  const handleSelect = (tutor, session) => {
    navigate('/booking', { state: { tutor, session } });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 sm:py-20">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 sm:py-20">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <h2 className="text-2xl font-bold">Failed to load tutors</h2>
            <p className="text-slate-400 mt-2">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-12 sm:py-20">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white">
          {isB2B ? 'Vælg ekspert og workshop' : 'Find en tutor, der forstår din verden'}
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
          {isB2B 
            ? 'Alle vores eksperter har selv implementeret AI i forretningskritiske processer.'
            : 'Vores tutorer er erfarne fagfolk, ikke kun tekniske eksperter. De fokuserer på de resultater, der betyder noget i din karriere.'
          }
        </p>
      </div>
      <div className="space-y-6">
        {tutors.map((tutor) => (
          <TutorCard
            key={tutor.id}
            tutor={tutor}
            isExpanded={expandedId === tutor.id}
            onExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
};

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { siteMode } = useSiteMode();
  const { user, isAuthenticated } = useAuth();
  const { createBooking, loading: bookingLoading, error: bookingError, clearError } = useCreateBooking();
  
  const isB2B = siteMode === 'b2b';
  const [format, setFormat] = useState(isB2B ? 'team' : 'individual');
  const [formData, setFormData] = useState({
    company: '',
    department: '',
    participants: 10,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isBooked, setIsBooked] = useState(false);

  const { tutor, session } = location.state || {};

  // Redirect to home if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Pre-fill form with user data if available
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: user.name || '',
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        company: user.company || '',
        department: user.department || ''
      }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    try {
      if (isB2B) {
        if (!formData.company?.trim()) {
          newErrors.company = 'Virksomhedsnavn er påkrævet og må ikke være tomt';
        }
        if (!formData.department?.trim()) {
          newErrors.department = 'Afdeling er påkrævet og må ikke være tomt';
        }
        if (!formData.contactPhone?.trim()) {
          newErrors.contactPhone = 'Telefon er påkrævet og må ikke være tomt';
        }
        if (format === 'team') {
          const participants = parseInt(formData.participants);
          if (isNaN(participants) || participants < 2 || participants > 10) {
            newErrors.participants = 'Antal deltagere skal være et tal mellem 2 og 10';
          }
        }
      }
      
      if (!formData.contactName?.trim()) {
        newErrors.contactName = isB2B 
          ? 'Kontaktperson er påkrævet og må ikke være tomt' 
          : 'Dit navn er påkrævet og må ikke være tomt';
      }
      
      const email = formData.contactEmail?.trim();
      if (!email) {
        newErrors.contactEmail = 'Email er påkrævet';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.contactEmail = 'Indtast venligst en gyldig email-adresse (f.eks. navn@example.com)';
      }
      
      if (!selectedDateTime?.trim()) {
        newErrors.selectedDateTime = 'Vælg venligst en tid for sessionen fra kalenderen';
      } else {
        // Validate selectedDateTime format
        try {
          const date = new Date(selectedDateTime);
          if (!safeDateUtils.isValidDate(date)) {
            newErrors.selectedDateTime = 'Den valgte tid er ugyldig. Vælg venligst en ny tid.';
          } else if (date < new Date()) {
            newErrors.selectedDateTime = 'Kan ikke booke tid i fortiden. Vælg venligst en fremtidig tid.';
          }
        } catch (error) {
          newErrors.selectedDateTime = 'Den valgte tid har et ugyldigt format. Vælg venligst en ny tid.';
        }
      }
      
    } catch (error) {
      console.error('Validation error:', error);
      newErrors.general = 'Der opstod en fejl ved validering. Prøv venligst igen.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!validateForm()) return;
      
      setIsSubmitting(true);
      setErrors({});
      clearError();
      
      // Validate required data exists
      if (!tutor || !session) {
        setErrors({ general: 'Tutor eller session information mangler. Prøv at vælge en tutor igen.' });
        setIsSubmitting(false);
        return;
      }
      
      // Calculate total price based on format
      let totalPrice = isB2B ? (tutor.basePrice || tutor.price) : tutor.price;
      if (format === 'team' && formData.participants) {
        totalPrice = totalPrice * formData.participants;
      }
      
      // Format API request data
      const bookingData = {
        tutorId: tutor.id,
        sessionId: session.id,
        format: format.toUpperCase(),
        selectedDateTime: selectedDateTime,
        participants: format === 'team' ? formData.participants : 1,
        siteMode: siteMode.toUpperCase(),
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || '',
        company: isB2B ? formData.company : '',
        department: isB2B ? formData.department : '',
        notes: ''
      };
      
      const result = await createBooking(bookingData);
      
      if (result.success) {
        const booking = {
          ...result.data,
          tutor: { ...tutor },
          session: { ...session },
          totalPrice,
          siteMode
        };
        
        if (isB2B) {
          navigate('/booking-success', { state: { booking } });
        } else {
          setIsBooked(true);
        }
      } else {
        setErrors({ 
          general: result.error || 'Der opstod en fejl ved booking. Prøv igen senere.' 
        });
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      setErrors({ 
        general: bookingError || error.message || 'Der opstod en fejl ved booking. Prøv igen senere.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!tutor || !session) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <h1 className="text-2xl text-white mb-4">
          {isB2B ? 'Vælg venligst en workshop først.' : 'Vælg venligst en tutor og et sessionsemne først.'}
        </h1>
        <button
          onClick={() => navigate('/tutors')}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500"
        >
          {isB2B ? 'Tilbage til eksperter' : 'Tilbage til Tutorer'}
        </button>
      </div>
    );
  }

  if (!isB2B && isBooked) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="bg-slate-800 p-8 rounded-lg">
          <Award className="w-16 h-16 mx-auto text-green-400" />
          <h1 className="text-3xl font-bold text-white mt-4">Fantastisk! Du er i gang.</h1>
          <p className="text-slate-300 mt-2">
            Din bookingforespørgsel er sendt til <span className="font-bold text-blue-400">{tutor.name}</span>, som kontakter dig inden for 24 timer for at aftale jeres {format === 'individual' ? '1-til-1 session' : 'gruppesession'} om <span className="font-bold text-blue-400">"{session.title}"</span>.
          </p>
          {selectedDateTime && (
            <div className="mt-4 p-3 bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-300">
                <strong>Ønsket tid:</strong> {(() => {
                  try {
                    const date = new Date(selectedDateTime);
                    if (!safeDateUtils.isValidDate(date)) {
                      return 'Ugyldig dato';
                    }
                    const timeString = selectedDateTime.includes('T') ? selectedDateTime.split('T')[1] : '';
                    return `${date.toLocaleDateString('da-DK', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} kl. ${timeString}`;
                  } catch (error) {
                    console.warn('Date formatting error:', error);
                    return 'Dato ikke tilgængelig';
                  }
                })()}
              </p>
            </div>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Se dit Karriere-Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = isB2B 
    ? tutor.basePrice * FORMAT_MULTIPLIER[format] 
    : tutor.price * B2C_FORMAT_MULTIPLIER[format];

  return (
    <div className="max-w-3xl mx-auto py-12 sm:py-20">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">Bekræft {isB2B ? 'booking' : 'din booking'}</h1>
        <p className="text-slate-300 mt-2">
          {isB2B ? 'I er ved at booke' : 'Du er ved at booke'} <span className={`${isB2B ? 'text-green-400' : 'text-blue-400'} font-bold`}>
            {tutor.name}
          </span> til {isB2B ? 'workshoppen' : 'en session om:'}
        </p>
        <p className="text-xl font-semibold text-white mt-1">
          "{session.title}"
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg space-y-6">
        {errors.general && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4">
            <p className="text-red-200 text-sm">{errors.general}</p>
          </div>
        )}
        {isB2B ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Virksomhed *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className={`w-full bg-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-green-500 ${
                    errors.company ? 'border-red-500' : ''
                  }`}
                />
                {errors.company && <p className="text-red-400 text-sm mt-1">{errors.company}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Afdeling / Team *
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className={`w-full bg-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-green-500 ${
                    errors.department ? 'border-red-500' : ''
                  }`}
                />
                {errors.department && <p className="text-red-400 text-sm mt-1">{errors.department}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Kontaktperson *
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  className={`w-full bg-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-green-500 ${
                    errors.contactName ? 'border-red-500' : ''
                  }`}
                />
                {errors.contactName && <p className="text-red-400 text-sm mt-1">{errors.contactName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className={`w-full bg-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-green-500 ${
                    errors.contactEmail ? 'border-red-500' : ''
                  }`}
                />
                {errors.contactEmail && <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  className={`w-full bg-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-green-500 ${
                    errors.contactPhone ? 'border-red-500' : ''
                  }`}
                />
                {errors.contactPhone && <p className="text-red-400 text-sm mt-1">{errors.contactPhone}</p>}
              </div>
            </div>

            <fieldset className="border border-slate-700 rounded-md p-4">
              <legend className="text-slate-400 text-sm px-2">Format</legend>
              <div className="space-y-3">
                {Object.entries(FORMAT_LABEL).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="format"
                      value={key}
                      checked={format === key}
                      onChange={() => setFormat(key)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {format === 'team' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Antal deltagere (2-10) *
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={formData.participants}
                  onChange={(e) => handleInputChange('participants', parseInt(e.target.value))}
                  className={`w-full bg-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-green-500 ${
                    errors.participants ? 'border-red-500' : ''
                  }`}
                />
                {errors.participants && <p className="text-red-400 text-sm mt-1">{errors.participants}</p>}
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Dit navn *
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                className={`w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contactName ? 'border-red-500' : ''
                }`}
                placeholder="Fx John Doe"
              />
              {errors.contactName && <p className="text-red-400 text-sm mt-1">{errors.contactName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Din email *
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className={`w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contactEmail ? 'border-red-500' : ''
                }`}
                placeholder="Fx john.doe@example.com"
              />
              {errors.contactEmail && <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>}
            </div>

            <fieldset className="border border-slate-700 rounded-md p-4">
              <legend className="text-slate-400 text-sm px-2">Vælg sessiontype</legend>
              <div className="space-y-3">
                {Object.entries(B2C_FORMAT_LABEL).map(([key, label]) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value={key}
                      checked={format === key}
                      onChange={() => setFormat(key)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">{label}</span>
                        <span className="text-lg font-bold text-white">
                          {Math.round(tutor.price * B2C_FORMAT_MULTIPLIER[key])},-
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {B2C_FORMAT_DESCRIPTION[key]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <div className="mt-6">
          <AvailabilityCalendar 
            tutor={tutor} 
            selectedDateTime={selectedDateTime} 
            onSelectDateTime={setSelectedDateTime}
          />
          {errors.selectedDateTime && <p className="text-red-400 text-sm mt-2">{errors.selectedDateTime}</p>}
        </div>

        <div className="border-t border-slate-700 pt-6 text-center">
          <p className="text-slate-400">{isB2B ? 'Total (ex. moms):' : 'Total pris:'}</p>
          <p className="text-4xl font-extrabold text-white">
            {Math.round(totalPrice).toLocaleString('da-DK')} kr{!isB2B ? ',-' : '.'}
          </p>
          {!isB2B && format === 'group' && (
            <p className="text-sm text-green-400 mt-2">
              Du sparer {Math.round(tutor.price * 0.3)} kr. med gruppesession!
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || bookingLoading}
            className={`mt-4 w-full ${isB2B ? 'bg-green-600 hover:bg-green-500' : 'bg-green-600 hover:bg-green-500'} text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg flex items-center justify-center gap-2`}
          >
            {(isSubmitting || bookingLoading) ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Behandler...
              </>
            ) : (
              <>
                {isB2B ? 'Bekræft booking' : 'Bekræft og send forespørgsel'} <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const BookingSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking } = location.state || {};

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <h1 className="text-2xl text-white mb-4">Booking ikke fundet</h1>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500"
        >
          Tilbage til forsiden
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <div className="bg-slate-800 p-8 rounded-lg">
        <Award className="w-16 h-16 mx-auto text-green-400" />
        <h1 className="text-3xl font-bold text-white mt-4">
          Tak for jeres booking!
        </h1>
        <p className="text-slate-300 mt-2">
          {booking.tutor?.user?.name || booking.tutor?.name} kontakter jer inden for 24 timer med
          praktiske detaljer om "{booking.session?.title}" ({FORMAT_LABEL[booking.format]}).
        </p>
        <div className="mt-6 text-left bg-slate-700 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Booking detaljer:</h3>
          <p className="text-slate-300 text-sm">Virksomhed: {booking.company}</p>
          <p className="text-slate-300 text-sm">Afdeling: {booking.department}</p>
          <p className="text-slate-300 text-sm">Kontakt: {booking.contactName}</p>
          <p className="text-slate-300 text-sm">Email: {booking.contactEmail}</p>
          <p className="text-slate-300 text-sm">Total: {booking.totalPrice.toLocaleString('da-DK')} kr.</p>
          {booking.selectedDateTime && (
            <p className="text-slate-300 text-sm mt-2">
              <strong>Ønsket tid:</strong> {(() => {
                try {
                  const date = new Date(booking.selectedDateTime);
                  if (!safeDateUtils.isValidDate(date)) {
                    return 'Ugyldig dato';
                  }
                  const timeString = booking.selectedDateTime.includes('T') ? booking.selectedDateTime.split('T')[1] : '';
                  return `${date.toLocaleDateString('da-DK', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} kl. ${timeString}`;
                } catch (error) {
                  console.warn('Date formatting error:', error);
                  return 'Dato ikke tilgængelig';
                }
              })()}
            </p>
          )}
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Gå til Dashboard
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-slate-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-slate-500 transition-colors"
          >
            Tilbage til forsiden
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { siteMode } = useSiteMode();
  const { data: bookings = [], loading, error } = useBookings({ siteMode: siteMode.toUpperCase() });
  const isB2B = siteMode === 'b2b';

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 sm:py-20">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12 sm:py-20">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <h2 className="text-2xl font-bold">Failed to load bookings</h2>
            <p className="text-slate-400 mt-2">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto py-12 sm:py-20 space-y-10">
      <h1 className="text-4xl font-bold text-white">
        {isB2B ? 'Virksomheds‑dashboard' : 'Dit Karriere-Dashboard'}
      </h1>
      
      {!isB2B && (
        <p className="text-slate-400 -mt-8">
          Her tracker du din fremgang og ser effekten af dine nye kompetencer.
        </p>
      )}
      
      {bookings.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">
              {isB2B ? 'Jeres bookings' : 'Dine bookings'}
            </h2>
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-slate-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">{booking.session?.title}</h3>
                      <p className="text-slate-300">Med {booking.tutor?.user?.name || booking.tutor?.name}</p>
                      {isB2B && booking.company && (
                        <p className="text-slate-400 text-sm">{booking.company} - {booking.department}</p>
                      )}
                      {isB2B && booking.format && (
                        <p className="text-slate-400 text-sm">{FORMAT_LABEL[booking.format]}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{booking.totalPrice.toLocaleString('da-DK')} kr.</p>
                      <p className="text-slate-400 text-sm">
                        {new Date(booking.bookingDate).toLocaleDateString('da-DK')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Statistik</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{bookings.length}</p>
                <p className="text-slate-400">{isB2B ? 'Bookede workshops' : 'Bookede sessioner'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">
                  {bookings.reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString('da-DK')} kr.
                </p>
                <p className="text-slate-400">Total investering</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">
                  {isB2B ? new Set(bookings.map(b => b.department)).size : new Set(bookings.map(b => b.tutor.name)).size}
                </p>
                <p className="text-slate-400">{isB2B ? 'Afdelinger involveret' : 'Forskellige tutorer'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 p-10 rounded-lg flex flex-col items-center gap-6">
          <ClipboardCheck className="w-14 h-14 text-slate-400" />
          <div className="text-center">
            <p className="text-slate-300 text-lg mb-2">Ingen bookings endnu</p>
            <p className="text-slate-400 max-w-xl">
              {isB2B 
                ? 'Når I har booket jeres første workshop, vil I kunne følge progression og resultater her.'
                : 'Når du har booket din første session, vil du kunne følge din progression og resultater her.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
const AppContent = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { siteMode } = useSiteMode();
  const { isAuthenticated } = useAuth();

  const handleAuthClick = (mode) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleProfileClick = () => {
    setProfileModalOpen(true);
  };

  const currentPage = location.pathname === '/' ? 'home' : location.pathname.slice(1);
  const isB2B = siteMode === 'b2b';

  const navItems = isB2B 
    ? [
        { label: 'Hjem', key: 'home', path: '/' }, 
        { label: 'Eksperter', key: 'tutors', path: '/tutors' },
        ...(isAuthenticated ? [{ label: 'Dashboard', key: 'dashboard', path: '/dashboard' }] : [])
      ]
    : [
        { label: 'Hjem', key: 'home', path: '/' }, 
        { label: 'Find Tutor', key: 'tutors', path: '/tutors' },
        ...(isAuthenticated ? [{ label: 'Dashboard', key: 'dashboard', path: '/dashboard' }] : [])
      ];

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
      <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white text-2xl font-bold"
            >
              <BrainCircuit className={`${isB2B ? 'text-green-400' : 'text-blue-400'} h-8 w-8`} />
              <span>AI Rookie {isB2B && <span className="font-light">Enterprise</span>}</span>
            </button>
            
            <div className="hidden md:flex items-center gap-6">
              <SiteModeToggle onModeChange={() => navigate('/')} />
              
              <div className="h-6 w-px bg-slate-600"></div>
              
              <div className="flex items-center gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.path)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === item.key ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              
              <AuthButtons onAuthClick={handleAuthClick} onProfileClick={handleProfileClick} />
            </div>
            
            <button
              className="md:hidden text-slate-300 hover:text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        currentPage={currentPage}
        onAuthClick={handleAuthClick}
        onProfileClick={handleProfileClick}
        isAuthenticated={isAuthenticated}
      />

      <main className="px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tutors" element={<TutorsPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking-success" element={<BookingSuccessPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>

      <footer className="bg-slate-800 mt-20 border-t border-slate-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h3 className="text-lg font-semibold text-white">
            {isB2B 
              ? 'AI Rookie Enterprise – Realiser AI‑potentialet i jeres forretning'
              : 'AI Rookie: Fra Læring til Konkret Karriereværdi'
            }
          </h3>
          <div className="flex justify-center space-x-6">
            <button className="text-slate-400 hover:text-white">
              {isB2B ? 'Kontakt' : 'Om Os'}
            </button>
            <button className="text-slate-400 hover:text-white">
              Priser
            </button>
            <button className="text-slate-400 hover:text-white">
              {isB2B ? 'Demo' : 'Kontakt'}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} AI Rookie{isB2B ? ' Enterprise' : ''}. {isB2B ? 'Alle rettigheder forbeholdes.' : 'Styrk din karriere i dag.'}
          </p>
        </div>
      </footer>

      {/* Auth Modals */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        siteMode={siteMode}
      />
      
      <UserProfile
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        siteMode={siteMode}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SiteModeProvider>
        <AppContent />
      </SiteModeProvider>
    </AuthProvider>
  );
}
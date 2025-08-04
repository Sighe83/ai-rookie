# AI Rookie Design System

Et komplet designsystem til AI Rookie Enterprise applikationen med konsistente komponenter, farver og mønstre.

## Oversigt

Dette designsystem indeholder alle nødvendige komponenter til at bygge konsistente brugergrænseflader på tværs af hele applikationen. Systemet er bygget med React og Tailwind CSS og understøtter tema-baserede farver afhængigt af brugerrolle (Tutor/B2B/B2C).

## Installation og Brug

### Grundlæggende Setup

```jsx
import { ThemeProvider } from './components/design-system';

function App() {
  return (
    <ThemeProvider siteMode="b2b" userRole="TUTOR">
      {/* Din app */}
    </ThemeProvider>
  );
}
```

### Import af komponenter

```jsx
import { 
  Button, 
  Card, 
  Input, 
  Modal,
  Calendar,
  Toast,
  useToast 
} from './components/design-system';
```

## Komponenter

### Core Components

#### Button
```jsx
<Button variant="primary" size="lg" icon={Plus}>
  Tilføj ny
</Button>

<Button variant="secondary" loading={isLoading}>
  Gem
</Button>
```

**Varianter:** `primary`, `secondary`, `danger`, `success`, `outline`
**Størrelser:** `sm`, `md`, `lg`

#### Card
```jsx
<Card variant="default" hover>
  <h3>Korttitel</h3>
  <p>Kortindhold</p>
</Card>
```

**Varianter:** `default`, `nested`, `info`

#### Input
```jsx
<Input 
  icon={Mail}
  placeholder="Email adresse"
  error={errors.email}
  value={email}
  onChange={setEmail}
/>
```

### Form Components

#### FormField
```jsx
<FormField label="Email" error={errors.email} required>
  <Input type="email" value={email} onChange={setEmail} />
</FormField>
```

#### PasswordInput
```jsx
<PasswordInput 
  placeholder="Adgangskode"
  value={password}
  onChange={setPassword}
  error={errors.password}
/>
```

#### Select
```jsx
<Select
  options={[
    { value: 'da', label: 'Dansk' },
    { value: 'en', label: 'English' }
  ]}
  value={language}
  onChange={setLanguage}
/>
```

### Layout Components

#### Container
```jsx
<Container>
  <Header title="Dashboard" subtitle="Velkommen tilbage" />
  <Section>
    {/* Indhold */}
  </Section>
</Container>
```

#### Grid
```jsx
<Grid cols={1} smCols={2} lgCols={4} gap="md">
  <Card>Element 1</Card>
  <Card>Element 2</Card>
</Grid>
```

#### Header
```jsx
<Header 
  title="Dashboard" 
  subtitle="Oversigt over dine aktiviteter"
  actions={
    <Button variant="primary" icon={Plus}>
      Tilføj ny
    </Button>
  }
/>
```

### Navigation Components

#### NavigationTabs
```jsx
<NavigationTabs
  tabs={[
    { id: 'overview', label: 'Oversigt', icon: Home },
    { id: 'bookings', label: 'Bookings', badge: '3' }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

#### Dropdown
```jsx
<Dropdown
  trigger={<Button>Menu</Button>}
  items={[
    { label: 'Profil', icon: User, onClick: () => {} },
    { label: 'Indstillinger', icon: Settings, onClick: () => {} },
    { divider: true },
    { label: 'Log ud', icon: LogOut, onClick: logout }
  ]}
/>
```

### Data Components

#### DataTable
```jsx
<DataTable
  data={bookings}
  columns={[
    { key: 'name', label: 'Navn' },
    { key: 'date', label: 'Dato' },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> }
  ]}
  searchable
  pagination
  pageSize={10}
/>
```

#### StatusBadge
```jsx
<StatusBadge status="confirmed">
  Bekræftet
</StatusBadge>
```

### Specialized Components

#### Calendar
```jsx
<Calendar
  value={selectedDate}
  onChange={setSelectedDate}
  availableDates={availableDates}
  disabledDates={bookedDates}
/>
```

#### TimeSlotGrid
```jsx
<TimeSlotGrid
  timeSlots={['09:00', '10:00', '11:00']}
  selectedSlots={selectedSlots}
  onSlotToggle={handleSlotToggle}
  bookedSlots={bookedSlots}
/>
```

#### OptimizedImage
```jsx
<OptimizedImage
  src={user.profileImage}
  alt="Profilbillede"
  fallback="/default-avatar.jpg"
  className="w-24 h-24 rounded-full"
/>
```

#### Avatar
```jsx
<Avatar 
  src={user.avatar}
  name={user.name}
  size="lg"
/>
```

### Notification Components

#### Toast (med useToast hook)
```jsx
function MyComponent() {
  const { success, error } = useToast();
  
  const handleSave = async () => {
    try {
      await saveData();
      success('Data gemt succesfuldt!');
    } catch (err) {
      error('Kunne ikke gemme data');
    }
  };
}
```

#### NotificationBell
```jsx
<NotificationBell
  notifications={notifications}
  onNotificationClick={handleNotificationClick}
  onMarkAllRead={markAllAsRead}
/>
```

## Tema System

### Understøttede temaer

- **Tutor tema:** Purple (`bg-purple-600`)
- **B2B tema:** Green (`bg-green-600`)  
- **B2C tema:** Blue (`bg-blue-600`)

### Brug af tema

```jsx
import { useTheme } from './components/design-system';

function MyComponent() {
  const { colors } = useTheme();
  
  return (
    <div className={colors.primary}>
      Tema-baseret indhold
    </div>
  );
}
```

## Design Tokens

### Farver
```jsx
import { DesignTokens } from './components/design-system';

// Brug design tokens
className={DesignTokens.colors.slate[800]}
className={DesignTokens.colors.status.success.bg}
```

### Typography
```jsx
// Overskrifter
className={DesignTokens.typography.heading.xl} // text-2xl sm:text-3xl font-bold text-white
className={DesignTokens.typography.heading.lg} // text-lg sm:text-xl font-semibold text-white

// Brødtekst
className={DesignTokens.typography.body.lg} // text-slate-300 text-sm sm:text-base
```

### Spacing
```jsx
// Layout containere
className={DesignTokens.spacing.container} // max-w-7xl mx-auto py-4 sm:py-8 px-4
className={DesignTokens.spacing.section}    // mb-6 sm:mb-8
```

## Loading States

### Skeleton Loading
```jsx
// Generisk skeleton
<Skeleton variant="rectangle" width="100%" height="2rem" />

// Forudbyggede skeletons
<CardSkeleton />
<TableSkeleton rows={5} cols={4} />
```

### Loading Spinner
```jsx
<LoadingSpinner size="lg" />
```

## Responsive Design

Alle komponenter er bygget mobile-first med responsive breakpoints:

- **sm:** 640px+
- **md:** 768px+  
- **lg:** 1024px+
- **xl:** 1280px+

## Accessibility

- Minimum touch targets (44px)
- Focus states på alle interaktive elementer
- Semantiske farver og kontrast
- Screen reader support
- Keyboard navigation

## Best Practices

1. **Konsistent spacing:** Brug design system's spacing tokens
2. **Tema-baserede farver:** Brug `useTheme()` hook til dynamiske farver
3. **Mobile-first:** Start med mobile layout og udvid til desktop
4. **Loading states:** Vis altid loading states under asynkrone operationer
5. **Error handling:** Brug Toast notifications til feedback
6. **Accessibility:** Test med keyboard navigation

## Migration Guide

For at migrere eksisterende komponenter til designsystemet:

1. **Erstat hardcoded styles** med design system komponenter
2. **Brug ThemeProvider** omkring din app
3. **Erstat inline success/error messages** med Toast notifications
4. **Standardiser button varianter** med Button komponenten
5. **Brug Card komponenten** til alle kortlignende layouts

### Eksempel migration

**Før:**
```jsx
<div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md">
    Gem
  </button>
</div>
```

**Efter:**
```jsx
<Card>
  <Button variant="primary">
    Gem  
  </Button>
</Card>
```

## Support

For spørgsmål eller forbedringer til designsystemet, kontakt udviklingsteamet eller opret et issue i projektets repository.
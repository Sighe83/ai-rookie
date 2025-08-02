# Ugentlig Tilgængeligheds Manager

## Oversigt

Den nye `WeeklyAvailabilityManager` komponent giver tutorer en intuitiv måde at administrere deres tilgængelighed på uge-for-uge basis. Komponenten er integreret med vores SessionService business logic og sikrer, at alle sessioner følger 1-times reglen.

## Funktioner

### 🗓️ **Ugentlig Planlægning**
- Tutorer kan konfigurere forskellige tilgængelighedsmønstre for forskellige uger
- Navigation mellem uger med klare labels
- Forhåndsvisning af hvordan ugen kommer til at se ud

### ⏰ **SessionService Integration**
- Alle time slots følger business logic: 1 time præcis, starter på hele timer
- Kun gyldig arbejdstid: 8:00-17:00 (sidste session starter 17:00, slutter 18:00)
- Frokostpause 12:00-13:00 er automatisk udelukket
- Ingen mulighed for non-standard tider

### 📅 **Smart UI Features**
- **Checkbox Grid**: Simpelt klik for at vælge/fravælge time slots
- **Forhåndsvisning**: Se hvordan ugen kommer til at se ud for studerende
- **Kopi mellem uger**: Gentag mønstre fra andre uger
- **Ryd/Slet funktioner**: Hurtig rydning af hele uger
- **Statistikker**: Realtid oversigt over antal slots og aktive dage

### 🔄 **API Integration**
- Indlæser eksisterende tilgængelighed fra databasen
- Bulk save funktionalitet for hele uger
- Fejlhåndtering og loading states
- Success/error meddelelser

## Teknisk Implementation

### Komponentstruktur
```
WeeklyAvailabilityManager.jsx
├── Week Navigation (forrige/næste uge)
├── Edit Mode (checkbox grid)
├── Preview Mode (visuel kalender)
├── Bulk Operations (kopier, ryd, slet)
├── Statistics Display
└── Save Functionality
```

### SessionService Integration
```javascript
// Genererer gyldige time slots baseret på business rules
const generateValidTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 17; hour++) {
    if (hour === 12) continue; // Skip lunch
    const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push(timeSlot);
  }
  return slots;
};
```

### API Calls
```javascript
// Bulk weekly update
await availabilityApi.updateWeeklyAvailability(
  tutorId,
  weekStartDate,
  weeklyTemplate
);

// Indlæs eksisterende data
const response = await availabilityApi.getAvailability(
  tutorId,
  weekStart,
  weekEnd
);
```

## Brugerflow

### 1. **Initial Load**
- Komponenten indlæser tutor profil
- Henter eksisterende tilgængelighed for den valgte uge
- Viser loading state under indlæsning

### 2. **Editing Mode**
- Tutor ser checkbox grid med alle mulige time slots
- Kan klikke for at vælge/fravælge time slots
- Realtid statistikker opdateres automatisk

### 3. **Preview Mode**
- Skifter til kalendervisning
- Viser hvordan ugen kommer til at se ud for studerende
- Klar visuel representation af tilgængelighed

### 4. **Save Process**
- Bulk save af hele ugen på én gang
- Loading state og progress feedback
- Success/error meddelelser
- Automatisk refresh af data

## UI/UX Fordele

### ✅ **For Tutorer**
- **Hurtigt**: Opsætning af en hel uge på under 1 minut
- **Intuitivt**: Checkbox interface som alle kender
- **Flexibelt**: Forskellige mønstre for forskellige uger
- **Visuelt**: Klar forhåndsvisning af resultatet

### ✅ **For Studerende**
- **Konsistente tider**: Alle sessioner er 1 time, starter på hele timer
- **Klare slots**: 10:00-11:00, 14:00-15:00, etc.
- **Pålidelig planlægning**: Ingen forvirring om session varighed

### ✅ **For Systemet**
- **Standardiseret**: Følger SessionService business logic
- **Skalerbar**: Kan håndtere mange uger af gangen
- **Maintainbar**: Klar separation mellem UI og business logic

## Integration i TutorDashboard

Komponenten er tilgængeligt som en ny tab i TutorDashboard:

```jsx
const tabs = [
  { id: 'overview', label: 'Oversigt', icon: TrendingUp },
  { id: 'bookings', label: 'Bookinger', icon: Calendar },
  { id: 'availability', label: 'Tider', icon: Clock },
  { id: 'weekly', label: 'Ugentlig Plan', icon: CalendarDays }, // NY!
  { id: 'profile', label: 'Profil', icon: Settings }
];
```

## Fremtidige Udvidelser

### 🚀 **Mulige Forbedringer**
- **Recurring Templates**: Gem templates til gentagelse
- **Semester Planlægning**: Planlæg flere måneder frem
- **Integration med Eksterne Kalendere**: Sync med Google Calendar
- **Bulk Import**: Import fra Excel/CSV
- **Analytics**: Statistik over tilgængelighed og booking mønstre

### 🔧 **Tekniske Forbedringer**
- **Offline Support**: Cache templates lokalt
- **Real-time Updates**: WebSocket updates når andre ændrer booking
- **Advanced Validation**: Konflikt detection med andre tutorer
- **Export Funktioner**: PDF/Excel export af planer

## Test Cases

### ✅ **Funktionalitet**
- Oprettelse af ugentlige templates
- Navigation mellem uger
- Kopi af templates mellem uger
- Bulk save og indlæsning
- Fejlhåndtering og recovery

### ✅ **Integration**
- SessionService validation
- API calls og response handling
- Database persistence
- UI state management

### ✅ **Business Logic**
- Kun gyldige timer (8:00-17:00)
- Ingen frokostpause slots
- 1-times sessions kun
- Start på hele timer kun

Komponenten er nu klar til production og giver tutorer den fleksibilitet de har brug for, mens den opretholder vores strenge session business rules.

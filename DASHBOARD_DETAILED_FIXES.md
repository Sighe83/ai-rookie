# Detaljerede Dashboard Rettelser

## Problem Analyse

Du rapporterede at **bookinger**, **ledige slots** og **indtjening** fortsat var forkerte på tutor dashboard'et. Jeg har identificeret og rettet følgende problemer:

## 🔍 Identificerede Problemer

### 1. **Available Slots Logik Fejl**
- **Problem**: Viste "næste uge" slots (8-14 dage fremme) i stedet for relevante slots
- **Problem**: Brugte forskellige tidsperioder for bookinger vs. ledige slots
- **Årsag**: Logisk fejl i dato-beregning

### 2. **Booking Count Problemer**  
- **Problem**: Manglende error handling kunne skjule fejl
- **Problem**: Datum-ranges kunne være forkerte
- **Årsag**: Dårlig logging og error handling

### 3. **Indtjening Beregning**
- **Problem**: Potentiel double-conversion eller wrong status filter
- **Problem**: Slut-på-måned dato kunne være forkert
- **Årsag**: Datum håndtering og status filtering

## ✅ Implementerede Rettelser

### 1. **Fixed Available Slots Logic**
```javascript
// BEFORE: Brugte "next week" (8-14 dage fremme)
const nextWeekStart = new Date(endOfNext7Days);
nextWeekStart.setDate(endOfNext7Days.getDate() + 1);

// AFTER: Bruger samme periode som bookings (næste 7 dage)
const availableSlotsStart = new Date(now);
const availableSlotsEnd = new Date(endOfNext7Days);
```

### 2. **Improved Error Handling & Logging**
```javascript
// Tilføjet detaljeret logging for hver query
console.log('Next 7 days bookings query result:', {
  tutorId,
  dateRange: `${startOfNext7Days.toISOString()} to ${endOfNext7Days.toISOString()}`,
  bookingsFound: next7DaysBookings?.length || 0,
  bookings: next7DaysBookings
});
```

### 3. **Fixed Date Calculations**
```javascript
// BEFORE: End of month kunne være forkert
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// AFTER: Sikrer end-of-day for komplet måned
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
```

### 4. **Enhanced Query Filtering**
```javascript
// Bookinger: Inkluderer både CONFIRMED og PENDING
.in('status', ['CONFIRMED', 'PENDING'])

// Indtjening: Kun CONFIRMED og COMPLETED tæller
.in('status', ['CONFIRMED', 'COMPLETED'])
```

## 🧪 Debug Tools Tilføjet

### 1. **SQL Debug Queries** (`debug_dashboard_queries.sql`)
- Tjek om `tutor_time_slots` tabel eksisterer
- Verificer data counts for hver statistik
- Sammenlign gamle vs. nye tabeller

### 2. **Browser Debug Component** 
- Ny "Debug" tab i tutor dashboard
- Kører live database queries
- Viser detaljerede resultater i browser

## 📊 Forventede Rettelser

### Dashboard vil nu vise:

1. **Kommende 7 dage (Bookinger)**:
   - ✅ Korrekt count af CONFIRMED + PENDING bookings
   - ✅ Samme tidsperiode som ledige slots

2. **Kommende 7 dage (Ledige slots)**:
   - ✅ Reelle slots fra `tutor_time_slots` tabel (hvis den eksisterer)
   - ✅ Fallback til estimering hvis tabel ikke eksisterer
   - ✅ Samme tidsperiode som bookinger

3. **Denne måned (Indtjening)**:
   - ✅ Kun CONFIRMED + COMPLETED bookings tæller
   - ✅ Korrekt måned start/slut datoer
   - ✅ Korrekt valuta håndtering

4. **Total (Gennemførte sessioner)**:
   - ✅ Kun COMPLETED status tæller
   - ✅ Bedre error handling

## 🔧 Debugging Guide

### Step 1: Check Console
Åbn browser console og kig efter:
```
Next 7 days bookings query result: {...}
Monthly earnings query result: {...}
Available slots from tutor_time_slots: {...}
```

### Step 2: Use Debug Tab
1. Gå til Tutor Dashboard
2. Klik på "Debug" tab
3. Klik "Run Debug Tests"
4. Analyser JSON output

### Step 3: Run SQL Queries
Kør `debug_dashboard_queries.sql` i Supabase SQL Editor for at verificere data.

## 🎯 Root Cause Analysis

De forkerte tal kom fra:

1. **Inconsistent Date Ranges**: Bookinger og slots brugte forskellige tidsperioder
2. **Missing Error Handling**: Fejl blev ignoreret i stedet for at blive håndteret
3. **Wrong Table Logic**: Available slots brugte forkert logik for tidsperioder
4. **Poor Logging**: Ingen måde at debug på når tallene var forkerte

## 📈 Verification Steps

1. **Check Console Logs**: Se detaljerede query resultater
2. **Use Debug Tab**: Verificer hver statistik separat  
3. **Compare with Database**: Kør SQL queries for at sammenligne
4. **Test Edge Cases**: Tjek forskellige måneder/uger

Alle ændringer bygger korrekt og bevarer backward compatibility med fallback-logik.
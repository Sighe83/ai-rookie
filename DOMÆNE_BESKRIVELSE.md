# AI Rookie Enterprise - Domænebeskrivelse

## 📋 Projektoverview

**AI Rookie Enterprise** er en komplet B2B/B2C platform for AI-træning og workshops. Platformen fungerer som et booking- og administrationssystem, der forbinder virksomheder og individuelle kunder med AI-eksperter gennem forskellige træningsformater.

### 🎯 Formål
- Skalere AI-kompetencer i danske virksomheder
- Tilbyde fleksible træningsformater (individuel, team, program)
- Skabe en professionel platform for eksperter og kunder
- Understøtte både B2B (virksomheder) og B2C (individuelle) kundesegmenter

---

## 🏗️ Systemarkitektur

### **Arkitektur Overview**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/Vite)  │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Authentication │    │  File Storage   │    │  External APIs  │
│  (JWT/Supabase) │    │  (Cloud/Local)  │    │  (Stripe, etc.) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Teknologi Stack**

#### **Frontend**
- **React 18** - Moderne komponentbaseret UI
- **React Router 6** - Client-side routing og navigation
- **Tailwind CSS** - Utility-first styling framework
- **Vite** - Hurtig development build tool
- **Lucide React** - Icon bibliotek
- **React Hook Form** - Formular håndtering og validering

#### **Backend**
- **Node.js** med Express.js framework
- **Prisma ORM** - Type-safe database access
- **JWT** - Token-baseret authentication
- **bcrypt** - Password hashing og sikkerhed
- **Helmet** - Security headers og beskyttelse
- **CORS** - Cross-origin request handling
- **Rate Limiting** - API beskyttelse

#### **Database**
- **PostgreSQL** - Primær relationsdatabase
- **Prisma Schema** - Database modeling og migrationer
- **UUID** - Unikke identifikatorer på tværs af systemet

#### **Deployment & Cloud**
- **Vercel** - Frontend hosting og deployment
- **Supabase** - Backend-as-a-Service, authentication og database
- **Stripe** - Payment processing
- **GitHub** - Version control og CI/CD integration

---

## 🎭 Domænemodeller og Objekter

### **1. 👤 User (Bruger)**
**Rolle**: Primær entitet for alle systembrugere

```
User {
  id: UUID (primærnøgle)
  email: String (unik)
  name: String
  phone: String?
  company: String? (kun B2B)
  department: String? (kun B2B)
  role: Enum ['USER', 'TUTOR', 'ADMIN']
  siteMode: Enum ['B2B', 'B2C']
  password: String? (hashed)
  emailVerified: Boolean
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Relationer**:
- `1:N` → Booking (en bruger kan have mange bookinger)
- `1:1` → Tutor (en bruger kan være tutor)

**Forretningsregler**:
- B2B brugere skal have company og department
- B2C brugere kan oprette sig uden virksomhedsinfo
- Email skal være unik på tværs af systemet
- Kun ADMIN kan administrere andre brugere

---

### **2. 🎓 Tutor (Underviser/Ekspert)**
**Rolle**: AI-eksperter der tilbyder træningssessioner

```
Tutor {
  id: UUID (primærnøgle)
  userId: UUID (fremmed nøgle → User)
  title: String (professionel titel)
  specialty: String (AI-specialisering)
  experience: String? (erfaring beskrivelse)
  valueProp: String? (værdiproposition)
  img: String? (profilbillede URL)
  basePrice: Integer (B2B pris i øre)
  price: Integer (B2C pris i øre)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Relationer**:
- `N:1` → User (tutor tilhører en bruger)
- `1:N` → Session (tutor kan have mange sessioner)
- `1:N` → Booking (tutor kan have mange bookinger)
- `1:N` → TutorAvailability (tutor har tilgængelighed)

**Forretningsregler**:
- En bruger kan kun være tutor hvis role = 'TUTOR'
- B2B og B2C priser kan være forskellige
- Kun aktive tutors vises til kunder
- Tutors skal have mindst én session for at være bookbare

---

### **3. 📚 Session (Træningssession)**
**Rolle**: Specifikke træningssessioner tilbudt af tutors

```
Session {
  id: UUID (primærnøgle)
  tutorId: UUID (fremmed nøgle → Tutor)
  title: String (session navn)
  description: String (detaljeret beskrivelse)
  duration: Integer (varighed i minutter, default 60)
  priceOverride: Integer? (tilsidesæt tutor pris)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Relationer**:
- `N:1` → Tutor (session tilhører en tutor)
- `1:N` → Booking (session kan bookes mange gange)

**Forretningsregler**:
- Duration skal være minimum 30 minutter
- PriceOverride har prioritet over tutor basePrice/price
- Kun aktive sessioner kan bookes
- Session kræver tilgængelige tidspunkter for booking

---

### **4. 📅 Booking (Booking/Reservation)**
**Rolle**: Kundens reservation af en specifik session

```
Booking {
  id: UUID (primærnøgle)
  userId: UUID (fremmed nøgle → User)
  tutorId: UUID (fremmed nøgle → Tutor)
  sessionId: UUID (fremmed nøgle → Session)
  format: Enum ['INDIVIDUAL', 'TEAM', 'PROGRAM']
  selectedDateTime: DateTime (valgt tidspunkt)
  participants: Integer (antal deltagere, default 1)
  totalPrice: Integer (samlet pris i øre)
  status: Enum ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
  siteMode: Enum ['B2B', 'B2C']
  contactName: String
  contactEmail: String
  contactPhone: String?
  company: String? (B2B)
  department: String? (B2B)
  paymentStatus: Enum ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
  paymentIntentId: String? (Stripe payment ID)
  paidAt: DateTime?
  notes: String? (ekstra bemærkninger)
  createdAt: DateTime
  updatedAt: DateTime
  confirmedAt: DateTime?
  cancelledAt: DateTime?
}
```

**Relationer**:
- `N:1` → User (booking tilhører en bruger)
- `N:1` → Tutor (booking er hos en tutor)
- `N:1` → Session (booking er for en session)

**Forretningsregler**:
- TotalPrice beregnes baseret på format og participants
- B2B bookinger bruger basePrice, B2C bruger price
- TEAM format kan have 2-10 deltagere
- PROGRAM format er længere kurser med multiple sessioner
- Payment skal være PAID før status kan være CONFIRMED

---

### **5. ⏰ TutorAvailability (Tutor Tilgængelighed)**
**Rolle**: Styrer hvornår tutors er tilgængelige for bookinger

```
TutorAvailability {
  id: UUID (primærnøgle)
  tutorId: UUID (fremmed nøgle → Tutor)
  date: Date (specifik dato)
  timeSlots: JSON (tilgængelige tidspunkter)
  createdAt: DateTime
  updatedAt: DateTime
}
```

**JSON timeSlots format**:
```json
{
  "09:00": { "available": true, "booked": false },
  "10:00": { "available": true, "booked": true },
  "11:00": { "available": false, "booked": false }
}
```

**Relationer**:
- `N:1` → Tutor (tilgængelighed tilhører en tutor)
- **Unique constraint**: (tutorId, date) - kun én post per tutor per dag

**Forretningsregler**:
- Tidspunkter kan være available eller unavailable
- Bookede tidspunkter markeres som booked: true
- Kun available og ikke-bookede slots kan reserveres
- Automatisk cleanup af gamle tilgængelighedsdata

---

### **6. ⚙️ SystemSettings (System Indstillinger)**
**Rolle**: Konfigurable systemindstillinger

```
SystemSettings {
  id: UUID (primærnøgle)
  key: String (unik indstillingsnøgle)
  value: JSON (indstillingsværdi)
}
```

**Eksempler på indstillinger**:
```json
{
  "key": "booking_window_days",
  "value": { "value": 30, "description": "Booking window in days" }
}
{
  "key": "payment_methods",
  "value": { "stripe": true, "invoice": true, "bank_transfer": false }
}
```

---

## 🔄 Forretningsprocesser og Workflows

### **1. 👥 Brugeroprettelse og Login**

#### **B2C Workflow**:
1. Bruger vælger B2C mode (blå tema)
2. Udfylder navn, email, telefon, password
3. Oprettes med role = 'USER', siteMode = 'B2C'
4. Email bekræftelse sendes
5. Login giver adgang til individuelle priser

#### **B2B Workflow**:
1. Bruger vælger B2B mode (grønt tema)
2. Udfylder navn, email, telefon, password, company, department
3. Oprettes med role = 'USER', siteMode = 'B2B'
4. Virksomhedsvalidering kan kræves
5. Login giver adgang til erhvervspriser

### **2. 🎓 Tutor Onboarding**
1. Eksisterende bruger ansøger om tutor-rolle
2. Admin godkender og ændrer role til 'TUTOR'
3. Tutor opretter profil (title, specialty, experience, pricing)
4. Tutor opretter træningssessioner
5. Tutor sætter tilgængelighed
6. Profil aktiveres og vises til kunder

### **3. 📋 Booking Process**

#### **Kunde-side**:
1. Browse tutors og sessions
2. Vælg ønsket session og format
3. Check tutor tilgængelighed
4. Vælg specifikt tidspunkt
5. Udfyld booking detaljer (participants, notes)
6. Bekræft booking og proceed til betaling
7. Modtag booking bekræftelse

#### **System-side**:
1. Validate tilgængelighed
2. Beregn totalPrice baseret på format og siteMode
3. Reserve tidspunkt i TutorAvailability
4. Opret Booking med status 'PENDING'
5. Initier betaling (Stripe)
6. Ved succesfuld betaling: status → 'CONFIRMED'
7. Send bekræftelses emails til alle parter

### **4. 💰 Payment og Pricing**

#### **Pris Beregning**:
```javascript
// B2B pricing
totalPrice = tutor.basePrice * participants * duration_multiplier

// B2C pricing  
totalPrice = tutor.price * participants * duration_multiplier

// Format multipliers
INDIVIDUAL: 1.0
TEAM: 0.8 per participant (discount for groups)
PROGRAM: Custom pricing based on session count
```

#### **Payment Flow**:
1. Booking oprettes med paymentStatus = 'PENDING'
2. Stripe Payment Intent oprettes
3. Frontend håndterer payment med Stripe.js
4. Webhook fra Stripe opdaterer paymentStatus
5. Successful payment trigger booking confirmation

---

## 🔐 Sikkerhed og Adgangskontrol

### **Authentication**
- **JWT Tokens** - Stateless authentication
- **Refresh Tokens** - Sikker token fornyelse
- **Password Hashing** - bcrypt med salt
- **Email Verification** - Bekræft email ved oprettelse

### **Authorization (Role-based)**

#### **USER (Standard kunde)**
- Kan browse tutors og sessions
- Kan oprette bookinger
- Kan se egen booking historie
- Kan opdatere egen profil

#### **TUTOR (Underviser)**
- Alle USER rettigheder
- Kan administrere egen profil og sessions
- Kan se egen booking historie som tutor
- Kan opdatere tilgængelighed
- Kan se indtjening og statistik

#### **ADMIN (Administrator)**
- Alle TUTOR rettigheder
- Kan administrere alle brugere
- Kan godkende tutor ansøgninger
- Kan se alle bookinger og statistik
- Kan administrere systemindstillinger

### **Data Protection**
- **Passwords** - Aldrig gemt i plaintext
- **PII** - Personlig data krypteret i transit
- **Rate Limiting** - Beskyttelse mod API abuse
- **CORS** - Kontrolleret cross-origin adgang
- **Input Validation** - Sanitizing af alle inputs

---

## 📊 Business Intelligence og Analytics

### **Bruger Metrics**
- Registreringer per dag/uge/måned
- B2B vs B2C fordeling
- Bruger retention rate
- Active users

### **Tutor Performance**
- Booking rate per tutor
- Gennemsnitlig vurdering
- Indtjening per tutor
- Mest populære sessions

### **Booking Analytics**
- Total bookinger og revenue
- Format fordeling (Individual/Team/Program)
- Peak booking times
- Cancellation rates
- Payment success rates

### **System Health**
- API response times
- Error rates
- Database performance
- Active connections

---

## 🚀 Deployment og Miljøer

### **Development Environment**
```bash
# Frontend
npm run dev          # http://localhost:3001

# Backend  
npm run dev          # http://localhost:3001/api

# Database
Prisma Studio        # Database administration
```

### **Staging Environment**
- Vercel preview deployment
- Supabase staging database
- Stripe test mode
- Limited data retention

### **Production Environment**

#### **Nuværende Stack: Vercel + Supabase**
- **Frontend**: Vercel auto-deployment fra GitHub
- **Backend**: Supabase Edge Functions + REST API
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth med JWT
- **Files**: Supabase Storage
- **Payments**: Stripe integration

### **CI/CD Pipeline**
```
GitHub Push → Vercel Build → Automated Deployment → Supabase Sync
```

### **Miljø Konfiguration**
- **Development**: Lokale miljøvariabler
- **Preview**: Vercel preview deployments
- **Production**: Vercel production deployment

---

## 🔧 Konfiguration og Environment Variables

### **Frontend (.env)**
```bash
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=anon_key
VITE_API_BASE_URL=http://localhost:3001/api
VITE_STRIPE_PUBLIC_KEY=pk_test_stripe_key
```

### **Backend (.env)**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/database
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
STRIPE_SECRET_KEY=sk_test_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret
SUPABASE_SERVICE_ROLE_KEY=service_role_key
```

---

## 📈 Fremtidige Udvidelser

### **Tekniske Forbedringer**
- **Real-time Updates** - WebSocket for live booking updates
- **Caching** - Redis for improved performance
- **Search** - Elasticsearch for advanced tutor/session search
- **Notifications** - Push notifications for booking updates
- **Mobile App** - React Native mobile application

### **Business Features**
- **Rating System** - Kunde vurderinger af tutors
- **Subscription Model** - Månedlige træningsabonnementer
- **Group Management** - Team administration for virksomheder
- **Advanced Analytics** - Machine learning insights
- **Multi-language** - Internationalisering
- **Integration APIs** - HR-systemer og læringsplatforme

### **Skalering**
- **Vercel Edge Functions** - Serverless skalering
- **Supabase Connection Pooling** - Database optimering
- **CDN** - Vercel's globale edge network
- **Auto-scaling** - Indbygget i Vercel og Supabase

---

## 📞 Support og Documentation

### **Developer Resources**
- **API Documentation** - Swagger/OpenAPI specs
- **Database Schema** - ER-diagrams og migration guides
- **Component Library** - Storybook for React komponenter
- **Testing Guides** - Unit, integration og E2E tests

### **Business Resources**
- **User Manuals** - Guides for kunder og tutors
- **Admin Guides** - Platform administration
- **Business Analytics** - KPI dashboards og reports
- **Training Materials** - Onboarding for neue users

---

*Denne domænebeskrivelse er et levende dokument der opdateres løbende i takt med systemets udvikling og nye forretningsmæssige krav.*

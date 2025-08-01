# Clean Database Migration Plan

## NEW STRATEGY: Prisma-First Approach

Since production data can be wiped, we'll take the **Prisma-first approach**:
1. Fix the Prisma schema to be correct and consistent
2. Drop and recreate the database from the clean Prisma schema
3. Use Prisma migrations going forward

## ADVANTAGES OF CLEAN SLATE:
- ✅ Consistent schema from the start
- ✅ Proper Prisma migration history
- ✅ No legacy schema issues
- ✅ Better type safety with proper ID types
- ✅ Clean field naming conventions

## REVISED MIGRATION PLAN

### PHASE 1: Fix Prisma Schema
**Current issues to fix in schema.prisma:**

1. **Keep cuid() for IDs** (Prisma best practice, not UUID)
2. **Add missing timestamp fields** to all models
3. **Fix field type consistency**
4. **Ensure proper relationships**

### PHASE 2: Clean Database Recreation
1. Drop all existing tables in Supabase
2. Run `npx prisma db push` to create fresh schema
3. Verify schema alignment
4. Set up proper indexing

### PHASE 3: Initialize Prisma Migrations
1. Run `npx prisma migrate dev --name init`
2. Create baseline migration
3. Future schema changes use proper migrations

## RECOMMENDED PRISMA SCHEMA FIXES

### 1. User Model Updates:
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  phone         String?
  company       String?
  department    String?
  role          String    @default("USER")
  siteMode      String    @default("B2C")  // Match production usage
  password      String?   // Keep for auth
  emailVerified Boolean   @default(false)
  isActive      Boolean   @default(true)   // Add missing field
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  bookings      Booking[]
  tutor         Tutor?

  @@map("users")
}
```

### 2. Tutor Model Updates:
```prisma
model Tutor {
  id           String              @id @default(cuid())
  userId       String              @unique
  title        String
  specialty    String
  experience   String?
  valueProp    String?
  img          String?
  basePrice    Int
  price        Int                 // Make required
  isActive     Boolean             @default(true)
  createdAt    DateTime            @default(now())  // Add missing
  updatedAt    DateTime            @updatedAt       // Add missing
  bookings     Booking[]
  sessions     Session[]
  availability TutorAvailability[]
  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("tutors")
}
```

### 3. Session Model Updates:
```prisma
model Session {
  id           String    @id @default(cuid())
  tutorId      String
  title        String
  description  String
  duration     Int       @default(60)
  priceOverride Int?     // Add missing field
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())  // Add missing
  updatedAt    DateTime  @updatedAt       // Add missing
  bookings     Booking[]
  tutor        Tutor     @relation(fields: [tutorId], references: [id], onDelete: Cascade)

  @@index([tutorId])
  @@map("sessions")
}
```

### 4. TutorAvailability Model Fix:
```prisma
model TutorAvailability {
  id        String   @id @default(cuid())
  tutorId   String
  date      DateTime @db.Date
  timeSlots Json     // Use Json instead of String for better type safety
  createdAt DateTime @default(now())  // Add missing
  updatedAt DateTime @updatedAt       // Add missing
  tutor     Tutor    @relation(fields: [tutorId], references: [id], onDelete: Cascade)

  @@unique([tutorId, date])
  @@map("tutor_availability")
}
```

## EXECUTION STEPS

### Step 1: Update Prisma Schema
- Fix all field types and add missing fields
- Ensure proper relationships and constraints

### Step 2: Drop Existing Database
```sql
-- In Supabase SQL editor, drop all tables
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS tutor_availability CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS tutors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
```

### Step 3: Create Fresh Schema
```bash
npx prisma db push
```

### Step 4: Initialize Migrations
```bash
npx prisma migrate dev --name init
```

### Step 5: Verify and Test
```bash
npx prisma db pull  # Should show no changes
npx prisma generate # Update client
npm run dev         # Test application
```

## BENEFITS OF THIS APPROACH

1. **Clean Migration History**: Start with proper Prisma migrations
2. **Type Safety**: Proper field types from the start
3. **Consistency**: Schema matches code expectations
4. **Future-Proof**: Easy to maintain with Prisma migrations
5. **No Legacy Issues**: Clean slate eliminates technical debt

## RISKS ELIMINATED

- ❌ No more ID type mismatches
- ❌ No more field name conflicts  
- ❌ No more missing field issues
- ❌ No more type conversion problems
- ❌ No more migration complexity
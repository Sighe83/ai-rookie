# Database Schema Comparison: Supabase vs Prisma

## CRITICAL MISALIGNMENTS

### 1. **USERS Table**
**Database has:**
- `id: uuid` (NOT NULL)
- `email: text` (NOT NULL) 
- `name: text` (NOT NULL)
- `phone: text` (NULL)
- `company: text` (NULL)
- `department: text` (NULL)
- `role: text` (NOT NULL) DEFAULT 'USER'
- `site_mode: text` (NOT NULL) DEFAULT 'B2C'  ⚠️ **MISMATCH**
- `is_active: boolean` (NULL) DEFAULT true  ⚠️ **MISSING IN PRISMA**
- `created_at: timestamp` (NULL) DEFAULT now()
- `updated_at: timestamp` (NULL) DEFAULT now()

**Prisma schema has:**
- `id: String` @id @default(cuid())  ⚠️ **TYPE MISMATCH (should be uuid)**
- `email: String` @unique
- `name: String`
- `phone: String?`
- `company: String?`
- `department: String?`
- `role: String` @default("USER")
- `siteMode: String` @default("B2B")  ⚠️ **DEFAULT MISMATCH (DB has B2C)**
- `password: String?`  ⚠️ **MISSING IN DATABASE**
- `emailVerified: Boolean` @default(false)  ⚠️ **MISSING IN DATABASE**
- `createdAt: DateTime` @default(now())
- `updatedAt: DateTime` @updatedAt

### 2. **TUTORS Table**
**Database has:**
- `id: uuid` (NOT NULL)
- `user_id: uuid` (NOT NULL)
- `title: text` (NOT NULL)
- `specialty: text` (NOT NULL)
- `experience: text` (NULL)
- `value_prop: text` (NULL)  ⚠️ **FIELD NAME MISMATCH**
- `img: text` (NULL)
- `base_price: integer` (NOT NULL)
- `price: integer` (NOT NULL)  ⚠️ **REQUIRED IN DB, OPTIONAL IN PRISMA**
- `is_active: boolean` (NULL) DEFAULT true
- `created_at: timestamp` (NULL) DEFAULT now()  ⚠️ **MISSING IN PRISMA**
- `updated_at: timestamp` (NULL) DEFAULT now()  ⚠️ **MISSING IN PRISMA**

**Prisma schema has:**
- `id: String` @id @default(cuid())  ⚠️ **TYPE MISMATCH**
- `userId: String` @unique
- `title: String`
- `specialty: String`
- `experience: String?`
- `valueProp: String?`  ⚠️ **FIELD NAME MISMATCH**
- `img: String?`
- `basePrice: Int`
- `isActive: Boolean` @default(true)
- `price: Int?`  ⚠️ **OPTIONAL IN PRISMA, REQUIRED IN DB**

### 3. **SESSIONS Table**
**Database has:**
- `id: uuid` (NOT NULL)
- `tutor_id: uuid` (NOT NULL)
- `title: text` (NOT NULL)
- `description: text` (NOT NULL)
- `duration: integer` (NULL) DEFAULT 60
- `price_override: integer` (NULL)  ⚠️ **MISSING IN PRISMA**
- `is_active: boolean` (NULL) DEFAULT true
- `created_at: timestamp` (NULL) DEFAULT now()  ⚠️ **MISSING IN PRISMA**
- `updated_at: timestamp` (NULL) DEFAULT now()  ⚠️ **MISSING IN PRISMA**

**Prisma schema has:**
- `id: String` @id @default(cuid())  ⚠️ **TYPE MISMATCH**
- `tutorId: String`
- `title: String`
- `description: String`
- `duration: Int` @default(60)
- `isActive: Boolean` @default(true)

### 4. **BOOKINGS Table**
**Database has:**
- All basic fields match Prisma
- **MISSING FIELDS from Prisma:**
  - `paymentStatus: String?` @default("PENDING")
  - `paymentIntentId: String?`
  - `paidAt: DateTime?`
  - `confirmedAt: DateTime?`
  - `cancelledAt: DateTime?`

### 5. **TUTOR_AVAILABILITY Table**
**Database has:**
- `id: uuid` (NOT NULL)
- `tutor_id: uuid` (NOT NULL)
- `date: date` (NOT NULL)
- `time_slots: jsonb` (NOT NULL)  ⚠️ **TYPE MISMATCH (Prisma expects String)**
- `created_at: timestamp` (NULL) DEFAULT now()  ⚠️ **MISSING IN PRISMA**
- `updated_at: timestamp` (NULL) DEFAULT now()  ⚠️ **MISSING IN PRISMA**

**Prisma schema has:**
- `id: String` @id @default(cuid())  ⚠️ **TYPE MISMATCH**
- `tutorId: String`
- `date: DateTime`
- `timeSlots: String`  ⚠️ **TYPE MISMATCH (DB has jsonb)**
- `createdAt: DateTime` @default(now())
- `updatedAt: DateTime` @updatedAt

### 6. **SYSTEM_SETTINGS Table**
**Prisma has this model but NO TABLE EXISTS in database**

## FIELD NAME CONVENTION MISMATCHES
- Database uses `snake_case`
- Prisma uses `camelCase`
- These are handled by Prisma's `@@map` directives

## ID TYPE MISALIGNMENTS
- Database uses `uuid` type with `uuid_generate_v4()` 
- Prisma uses `String` with `cuid()` - this is a major mismatch

## SUMMARY OF ISSUES TO FIX
1. **Critical**: ID type mismatches across all tables
2. **Critical**: Missing payment-related fields in bookings table
3. **Critical**: Missing password and emailVerified fields in users table
4. **Critical**: Missing system_settings table
5. **Important**: timeSlots type mismatch in tutor_availability
6. **Important**: Missing created_at/updated_at in some Prisma models
7. **Minor**: Default value mismatches (B2B vs B2C)
8. **Minor**: Field nullability differences
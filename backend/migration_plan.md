# Database Schema Alignment Migration Plan

## DECISION: Update Prisma Schema to Match Database

Since the database is already in production and contains data, we'll update the Prisma schema to match the existing database structure rather than migrating the database.

## PHASE 1: Critical ID Type Fixes
**Problem**: Database uses `uuid` with `uuid_generate_v4()`, Prisma expects `cuid()`

**Solution**: Update Prisma schema to use `@db.Uuid` and proper UUID generation

```prisma
// Change from:
id String @id @default(cuid())

// Change to:
id String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
```

## PHASE 2: Missing Database Fields
**Add to database via SQL migrations:**

### 2.1 Users table additions:
```sql
ALTER TABLE users ADD COLUMN password TEXT;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
```

### 2.2 Bookings table additions:
```sql
ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'PENDING';
ALTER TABLE bookings ADD COLUMN payment_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
```

### 2.3 System Settings table creation:
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);
```

## PHASE 3: Update Prisma Schema
**Update prisma/schema.prisma to match database:**

### 3.1 Fix ID types and defaults:
- Change all `@default(cuid())` to `@default(dbgenerated("uuid_generate_v4()"))`
- Add `@db.Uuid` to all ID fields

### 3.2 Add missing fields:
- Add `password` and `emailVerified` to User model
- Add payment fields to Booking model
- Add `createdAt`/`updatedAt` to Tutor and Session models
- Fix `timeSlots` type in TutorAvailability

### 3.3 Fix defaults:
- Change User `siteMode` default from "B2B" to "B2C"
- Make Tutor `price` field required (non-optional)

## PHASE 4: Code Updates
**Update application code to handle schema changes:**

### 4.1 Field name mappings:
- Ensure all database field names are properly mapped
- Update any code expecting different field types

### 4.2 Handle new optional fields:
- Update authentication code to handle password field
- Update booking creation to handle payment fields

## EXECUTION PLAN

### Step 1: Backup Database
```sql
-- Create backup before any changes
pg_dump DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Database Migrations (SQL)
- Add missing columns to existing tables
- Create system_settings table
- Verify data integrity

### Step 3: Update Prisma Schema
- Update schema.prisma file
- Run `npx prisma db pull` to verify alignment
- Run `npx prisma generate` to update client

### Step 4: Test Application
- Test all database operations
- Verify no breaking changes
- Run any existing tests

### Step 5: Deploy
- Deploy updated schema
- Monitor for issues

## RISK MITIGATION

1. **Backup Strategy**: Full database backup before changes
2. **Rollback Plan**: Keep backup and previous schema version
3. **Testing**: Thorough testing in development environment first
4. **Monitoring**: Watch for runtime errors after deployment

## FILES TO MODIFY

1. `prisma/schema.prisma` - Main schema updates
2. Database - SQL migrations for missing fields
3. Application code - Handle new field types and optionality
4. Tests - Update any tests that expect old schema

## VALIDATION STEPS

1. `npx prisma db pull` should show no changes after alignment
2. `npx prisma validate` should pass
3. Application should start without errors
4. All existing functionality should work
5. Database queries should return expected data types
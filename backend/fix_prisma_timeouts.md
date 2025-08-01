# Fixing Prisma Timeout Issues

## Root Cause Analysis

The timeouts occur specifically with Prisma commands (`db pull`, `migrate status`) but NOT with direct database connections. This indicates:

1. **Supabase Connection Pooler Issues**: The pooler at `aws-0-eu-west-1.pooler.supabase.com:6543` may have session timeouts
2. **Prisma Client Hanging**: Long-running introspection queries getting stuck
3. **SSL/Connection Mode Issues**: Prisma might be using session mode instead of transaction mode

## Solutions (In Order of Priority)

### 1. 🔧 Use Direct Database Connection (Bypass Pooler)

**Problem**: Connection pooler can cause timeouts with long-running operations
**Solution**: Use direct connection for Prisma operations

Add to `.env`:
```bash
# Direct connection for Prisma operations (bypasses pooler)
DIRECT_DATABASE_URL="postgresql://postgres.dfovfdluhrdmrhtubomt:5Ny6anczMSaZtlaX@aws-0-eu-west-1.compute.amazonaws.com:5432/postgres"

# Keep pooled connection for application
DATABASE_URL="postgresql://postgres.dfovfdluhrdmrhtubomt:5Ny6anczMSaZtlaX@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
```

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DIRECT_DATABASE_URL")  // Use direct connection
}
```

### 2. 🔧 Add Connection Timeout Settings

**Problem**: Default timeouts too short for schema operations
**Solution**: Increase timeouts in connection string

Update `.env`:
```bash
DATABASE_URL="postgresql://postgres.dfovfdluhrdmrhtubomt:5Ny6anczMSaZtlaX@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?connect_timeout=60&pool_timeout=60&connection_limit=10&schema=public"
```

### 3. 🔧 Use Transaction Mode Instead of Session Mode

**Problem**: Session mode holds connections longer
**Solution**: Add pgbouncer transaction mode

Update connection string:
```bash
DATABASE_URL="postgresql://postgres.dfovfdluhrdmrhtubomt:5Ny6anczMSaZtlaX@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

### 4. 🔧 Update Prisma Version

**Problem**: Known timeout issues in older versions
**Solution**: Update to latest Prisma

```bash
npm install prisma@latest @prisma/client@latest
```

### 5. 🔧 Alternative: Use Supabase CLI

**Problem**: Prisma commands timing out
**Solution**: Use Supabase's native tools

```bash
# Install Supabase CLI
npm install -g supabase

# Generate types directly from Supabase
supabase gen types typescript --project-id dfovfdluhrdmrhtubomt
```

## Quick Fixes to Try Now

### Option A: Direct Connection (Recommended)
1. Get direct connection URL from Supabase dashboard
2. Update `DATABASE_URL` to use direct connection
3. Retry Prisma commands

### Option B: Bypass Problematic Commands
Instead of `prisma db pull`, manually verify schema alignment:
```bash
# Skip introspection, just validate what we have
npx prisma validate

# Generate client from existing schema
npx prisma generate

# Check migration status manually via database query
```

### Option C: Use Shorter Timeouts for Testing
```bash
# Test with shorter timeout to fail fast
timeout 30s npx prisma db pull || echo "Command timed out - confirms network issue"
```

## Long-term Solutions

1. **Move to Direct Connection**: Always use direct DB connection for admin operations
2. **Connection Pooling Strategy**: Use pooler only for application runtime, not tooling
3. **Monitor Supabase**: Check dashboard for connection limits and active sessions
4. **Schema Management**: Consider using Supabase migrations instead of Prisma migrations

## Testing the Fixes

After applying fixes, test with:
```bash
# Should complete quickly
npx prisma validate

# Should complete within 30 seconds
npx prisma db pull

# Should show clean status
npx prisma migrate status
```
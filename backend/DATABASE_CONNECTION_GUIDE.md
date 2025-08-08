# Supabase Database Connection Guide

## Connection Types & Usage

### 1. Session Pooler (Current Default)
**URL Format**: `postgresql://[user]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`

**Use for**:
- ✅ Prisma migrations (`npx prisma migrate`)
- ✅ Prisma introspection (`npx prisma db pull`)
- ✅ Schema operations (`npx prisma db execute`)
- ✅ Development and debugging

**Why it works**: Session pooler maintains longer connections, allowing complex operations like migrations and schema changes.

### 2. Transaction Pooler
**URL Format**: `postgres://[user]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`

**Use for**:
- ✅ High-performance application runtime
- ✅ Production connections with many concurrent users
- ❌ NOT for migrations or schema operations

**Why**: Transaction pooler optimizes for speed but doesn't support long-running operations.

### 3. Direct Connection (Not Available)
**Issue**: IPv4 compatibility problems in this environment
**URL Format**: `postgres://[user]:[password]@db.[project-ref].supabase.co:5432/postgres`

## Current Setup

- **DATABASE_URL**: Session pooler (for Prisma operations)
- **DATABASE_URL_TRANSACTION**: Transaction pooler (available if needed)

## Common Commands That Now Work

```bash
# Migrations
npx prisma migrate deploy
npx prisma migrate dev

# Schema introspection
npx prisma db pull

# Execute custom SQL
npx prisma db execute --file=path/to/file.sql

# Generate client
npx prisma generate

# Reset database (use with caution)
npx prisma migrate reset
```

## Troubleshooting

### If connection fails:
1. Verify you're in the `/backend` directory
2. Check that `.env` file exists with correct DATABASE_URL
3. Ensure you're using session pooler (port 5432) for Prisma operations
4. For runtime issues, try switching to transaction pooler

### Error: "Can't reach database server"
- Usually means wrong connection type for the operation
- Switch between session and transaction pooler URLs

### Error: "Transaction pooler doesn't support..."
- Use session pooler (DATABASE_URL) for schema operations
- Use transaction pooler only for application runtime

## Best Practices

1. **Always use session pooler for development and migrations**
2. **Test connection before major operations**: `npx prisma db pull --print | head -10`
3. **Keep both connection strings available** in `.env` for different use cases
4. **Document any changes** to connection configuration

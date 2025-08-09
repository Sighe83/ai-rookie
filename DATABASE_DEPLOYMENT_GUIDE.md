# AI-Rookie Database Deployment Guide

## Overview

This guide explains how to deploy and establish both development (`ai-rookie-dev`) and production (`ai-rookie-prod`) databases for the AI-Rookie platform.

## Database Configuration

The application now supports environment-specific database connections:

- **Development**: `ai-rookie-dev`
- **Production**: `ai-rookie-prod`

### Environment Variables

Set the following environment variables for each environment:

```bash
# Development
POSTGRES_URL_DEV="postgresql://user:password@host:port/ai-rookie-dev"
VERCEL_ENV=development

# Production
POSTGRES_URL_PROD="postgresql://user:password@host:port/ai-rookie-prod"
VERCEL_ENV=production
```

## Quick Start

### 1. Set Database URLs

Replace the placeholder connection strings in your environment files:

```bash
# Update .env.development
POSTGRES_URL_DEV="your-actual-dev-database-url"

# Update .env.production  
POSTGRES_URL_PROD="your-actual-prod-database-url"
```

### 2. Deploy Both Databases

```bash
cd backend
npm run db:deploy:all
```

### 3. Test Connections

```bash
npm run db:test
```

## Individual Database Setup

### Development Database

```bash
# Setup development database with seed data
npm run db:setup:dev

# Or setup manually:
VERCEL_ENV=development npx prisma migrate deploy
VERCEL_ENV=development npm run db:seed
```

### Production Database

```bash
# Setup production database (no seeding)
npm run db:setup:prod

# Or setup manually:
VERCEL_ENV=production npx prisma migrate deploy
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run db:setup:dev` | Setup development database with seeding |
| `npm run db:setup:prod` | Setup production database (no seeding) |
| `npm run db:deploy:all` | Deploy both databases |
| `npm run db:test` | Test both database connections |
| `npm run db:migrate` | Run development migrations |
| `npm run db:deploy` | Deploy migrations to current environment |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed current database |

## Database Schema

The application uses the following main models:

- **User**: User accounts and authentication
- **Tutor**: Tutor profiles and information  
- **Session**: Available tutoring sessions
- **Booking**: Booking records and payments
- **TutorTimeSlot**: Tutor availability slots
- **SystemSettings**: Application configuration

## Environment Detection

The system automatically detects the environment using:

1. `VERCEL_ENV` environment variable
2. Falls back to `NODE_ENV`
3. Development uses `POSTGRES_URL_DEV`
4. Production uses `POSTGRES_URL_PROD`

## Migration Management

### Creating New Migrations

```bash
# Development
npx prisma migrate dev --name migration_name

# Production (deploy existing migrations)
npx prisma migrate deploy
```

### Migration Files

Migrations are stored in `backend/prisma/migrations/` and include:

- `001_simplify_timeslot_status.sql`
- `006_simplify_timeslot_schema/`
- `007_unified_booking_status/`
- `20250107_add_missing_columns/`
- `20250107_add_payment_expires_at/`

## Troubleshooting

### Connection Issues

1. Verify database URLs are correct
2. Check network connectivity
3. Ensure database exists
4. Verify credentials

```bash
# Test connections
npm run db:test
```

### Migration Issues

```bash
# Reset development database
npm run db:reset

# Check migration status
npx prisma migrate status
```

### Environment Issues

```bash
# Check current environment
echo $VERCEL_ENV

# Verify environment variables are loaded
node -e "console.log(process.env.DATABASE_URL)"
```

## Security Notes

- Never commit actual database URLs to version control
- Use environment variables for all sensitive data
- Production databases should not be automatically seeded
- Always backup production data before migrations

## Next Steps

After deployment:

1. ✅ Configure actual database URLs
2. ✅ Run `npm run db:deploy:all`
3. ✅ Verify connections with `npm run db:test`
4. ✅ Setup monitoring and alerts
5. ✅ Configure backup strategies
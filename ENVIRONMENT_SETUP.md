# Environment Configuration Guide

## Overview
This application uses multiple environment files for different deployment scenarios. Each file contains specific configurations for its target environment.

## Environment Files Structure

### 🔧 Development Environment
- **File**: `.env` (main development config)
- **Purpose**: Local development with development database
- **Servers**: Frontend: `http://localhost:3001`, Backend: `http://localhost:8080`
- **Database**: Development Supabase instance (`kqayvowdlnlfaqonrudy`)

### 🔧 Development Override
- **File**: `.env.development` (Vite-specific development config)
- **Purpose**: Override certain variables when using Vite dev server
- **Note**: Takes precedence over `.env` when using `npm run dev`

### 🚀 Production Environment
- **File**: `.env.production`
- **Purpose**: Production deployment configuration
- **API**: `https://ai-rookie-774363048882.europe-north1.run.app`
- **Database**: Production Supabase instance (`ycdhzwnjiarflruwavxi`)

### 📝 Template Files
- **File**: `.env.example` (frontend template)
- **File**: `backend/.env.example` (backend template)
- **Purpose**: Templates for new developers to create their environment files

## Key Configuration Points

### API URL Configuration ⚠️
**IMPORTANT**: Always set `VITE_API_URL` to the base URL WITHOUT `/api` suffix:
- ✅ Correct: `VITE_API_URL=http://localhost:8080`
- ❌ Wrong: `VITE_API_URL=http://localhost:8080/api`

The frontend code automatically appends `/api` to create proper endpoints like `/api/bookings`, `/api/tutors`, etc.

### Environment Loading Order (Vite)
1. `.env.development` (if NODE_ENV=development)
2. `.env.production` (if NODE_ENV=production)
3. `.env` (always loaded)
4. Command line variables

### Database Configuration
- **Development**: Uses `kqayvowdlnlfaqonrudy.supabase.co`
- **Production**: Uses `ycdhzwnjiarflruwavxi.supabase.co`
- Both frontend and backend must use matching Supabase URLs

## Security & Git

### Ignored Files (.gitignore)
All environment files are ignored by git to prevent secrets from being committed:
```
.env
.env.local
.env.development
.env.development.local
.env.test
.env.test.local
.env.production
.env.production.local
.env.staging
```

### Secret Management
- Never commit actual environment files with secrets
- Use `.env.example` files as templates
- Update secrets in deployment platforms (Vercel, etc.) separately

## Development Setup

1. Copy environment templates:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

2. Fill in your actual values:
   - Supabase URLs and keys
   - Database connections
   - API endpoints
   - Stripe keys

3. Start development servers:
   ```bash
   # Frontend (port 3001)
   npm run dev
   
   # Backend (port 8080)
   cd backend && npm run dev
   ```

## Common Issues

1. **Double `/api` in URLs**: Check that `VITE_API_URL` doesn't include `/api`
2. **Database connection errors**: Verify Supabase URLs and keys match
3. **CORS issues**: Ensure backend `FRONTEND_URL` matches frontend port
4. **Environment not loading**: Check file naming and NODE_ENV setting

## Verification

Test your configuration:
- Frontend: http://localhost:3001
- Backend API: http://localhost:8080/api
- Backend health: http://localhost:8080/health
#!/bin/bash

# Setup Production Database (ai-rookie-prod)
echo "🚀 Setting up production database..."

# Load environment variables
export $(grep -v '^#' ../.env.production | xargs)

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Note: We don't automatically seed production databases
echo "⚠️  Production database migrations complete!"
echo "⚠️  Seeding production database must be done manually for safety"
echo "💡 Database: ai-rookie-prod"
echo "💡 Environment: production"
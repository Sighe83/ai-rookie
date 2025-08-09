#!/bin/bash

# Setup Development Database (ai-rookie-dev)
echo "🚀 Setting up development database..."

# Load environment variables
export $(grep -v '^#' ../.env.development | xargs)

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Run database seed (optional)
if [ "$1" == "--seed" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed
fi

echo "✅ Development database setup complete!"
echo "💡 Database: ai-rookie-dev"
echo "💡 Environment: development"
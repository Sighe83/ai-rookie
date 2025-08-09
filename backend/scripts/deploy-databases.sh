#!/bin/bash

# Deploy both development and production databases
echo "🚀 Deploying AI-Rookie databases..."

# Check if database URLs are provided
if [ -z "$POSTGRES_URL_DEV" ] || [ -z "$POSTGRES_URL_PROD" ]; then
    echo "❌ Error: Database URLs not configured!"
    echo "Please set POSTGRES_URL_DEV and POSTGRES_URL_PROD environment variables"
    echo "Example:"
    echo "  export POSTGRES_URL_DEV='postgresql://user:pass@host:port/ai-rookie-dev'"
    echo "  export POSTGRES_URL_PROD='postgresql://user:pass@host:port/ai-rookie-prod'"
    exit 1
fi

echo "🔧 Setting up development database..."
VERCEL_ENV=development ./setup-dev-db.sh --seed

echo "🔧 Setting up production database..."
VERCEL_ENV=production ./setup-prod-db.sh

echo "✅ Database deployment complete!"
echo ""
echo "📋 Summary:"
echo "  • Development: ai-rookie-dev (seeded with test data)"
echo "  • Production: ai-rookie-prod (empty, ready for production data)"
echo ""
echo "🔗 Connection Details:"
echo "  • Dev URL: $POSTGRES_URL_DEV"
echo "  • Prod URL: $POSTGRES_URL_PROD"
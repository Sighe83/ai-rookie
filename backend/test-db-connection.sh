#!/bin/bash

# Supabase Database Connection Test Script
# Run this script to verify database connectivity before operations

echo "🔄 Testing Supabase Database Connection..."
echo ""

# Test if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Not in backend directory. Please run from /backend folder."
    exit 1
fi

# Test session pooler connection (used for migrations/schema operations)
echo "1️⃣ Testing Session Pooler (migrations/schema operations)..."
if npx prisma db pull --print | head -5 > /dev/null 2>&1; then
    echo "✅ Session pooler connection successful"
else
    echo "❌ Session pooler connection failed"
    echo "   Check DATABASE_URL in .env file"
    exit 1
fi

# Test Prisma client generation
echo ""
echo "2️⃣ Testing Prisma Client Generation..."
if npx prisma generate > /dev/null 2>&1; then
    echo "✅ Prisma client generation successful"
else
    echo "❌ Prisma client generation failed"
    exit 1
fi

echo ""
echo "🎉 All database connections working properly!"
echo ""
echo "Ready for:"
echo "  • Migrations (npx prisma migrate deploy)"
echo "  • Schema operations (npx prisma db execute)"
echo "  • Development (npx prisma migrate dev)"
echo ""

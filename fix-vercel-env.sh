#!/bin/bash

# Fix Vercel Production Environment Variables
# This script sets the correct production Supabase URL in Vercel

echo "🔧 Fixing Vercel Production Environment Variables..."
echo "=================================================="

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "📋 Setting production environment variables in Vercel..."

# Set the correct production Supabase URL
echo "🔗 Setting VITE_SUPABASE_URL..."
vercel env add VITE_SUPABASE_URL production <<< "https://ycdhzwnjiarflruwavxi.supabase.co"

# Set the correct production Supabase anon key
echo "🔑 Setting VITE_SUPABASE_ANON_KEY..."
vercel env add VITE_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZGh6d25qaWFyZmxydXdhdnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Mjk1MjQsImV4cCI6MjA3MDMwNTUyNH0.eh2ZZGaLxf-oi70z2n7Zs9YCCSAMixDX1pO3yIdI0Q0"

# Set the correct production API URL
echo "🌐 Setting VITE_API_URL..."
vercel env add VITE_API_URL production <<< "https://ai-rookie-774363048882.europe-north1.run.app/api"

echo "✅ Environment variables updated in Vercel!"
echo ""
echo "🚀 Next steps:"
echo "1. Run: vercel --prod (to redeploy with new env vars)"
echo "2. Clear browser cache"
echo "3. Test production site"
echo ""
echo "📊 Verify environment variables:"
echo "vercel env ls"
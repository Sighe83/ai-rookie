#!/bin/bash

echo "🚀 Setting up AI Rookie Backend..."

# Navigate to backend directory
cd backend

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    
    echo "⚠️  IMPORTANT: Please update the .env file with your actual values:"
    echo "   - DATABASE_URL: Your PostgreSQL connection string"
    echo "   - JWT_SECRET: A secure secret key"
    echo ""
    echo "Example DATABASE_URL format:"
    echo "DATABASE_URL=\"mysql://username:password@mysql106.unoeuro.com:3306/databasename\""
    echo ""
else
    echo "✅ .env file already exists"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing backend dependencies..."
    npm install
else
    echo "✅ Backend dependencies already installed"
fi


# Kør Prisma migration og generate automatisk
if [ -f .env ]; then
    echo "�️ Migrating database (production mode)..."
    npx prisma generate
    npx prisma migrate deploy
    echo "✅ Database migrated!"
else
    echo "❌ Please create .env file first"
fi

echo "🚀 To start the backend server:"
echo "   npm run start"

echo ""
echo "✅ Backend setup complete!"
echo "📖 See backend/README.md for detailed setup instructions"
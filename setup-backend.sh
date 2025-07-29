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
    echo "DATABASE_URL=\"postgresql://username:password@localhost:5432/ai_rookie_db\""
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

# Check if database is set up
echo "🗄️ Checking database setup..."
if [ -f .env ]; then
    echo "🔧 To set up the database, run these commands:"
    echo "   1. npx prisma generate"
    echo "   2. npx prisma migrate dev"
    echo "   3. npm run seed"
    echo ""
    echo "🚀 To start the backend server:"
    echo "   npm run dev"
else
    echo "❌ Please create .env file first"
fi

echo ""
echo "✅ Backend setup complete!"
echo "📖 See backend/README.md for detailed setup instructions"
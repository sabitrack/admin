#!/bin/bash

# Admin API Setup Script
echo "🚀 Setting up SabiTrack Admin API..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please update .env file with your MongoDB URI and JWT secret"
else
    echo "✅ .env file already exists"
fi

# Run seed script
echo "🌱 Running seed script..."
npm run seed

echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your MongoDB URI"
echo "2. Run: npm run start:dev"
echo "3. Visit: http://localhost:3002/api-docs"
echo "4. Login with superadmin@sabitrack.com / SuperAdmin123!"







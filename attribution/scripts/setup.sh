#!/bin/bash

# UnMoGrowP Attribution Platform - Setup Script
# Automates initial project setup

set -e  # Exit on error

echo "🚀 UnMoGrowP Attribution Platform - Setup"
echo "=========================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check Bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun 1.3+"
    echo "   Visit: https://bun.sh"
    exit 1
fi
echo "✅ Bun $(bun --version)"

# Check Go
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.25+"
    exit 1
fi
echo "✅ Go $(go version | awk '{print $3}')"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker"
    exit 1
fi
echo "✅ Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  docker-compose not found, checking for 'docker compose'..."
    if ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose is not installed"
        exit 1
    fi
    echo "✅ Docker Compose (plugin)"
else
    echo "✅ Docker Compose $(docker-compose --version | awk '{print $3}' | tr -d ',')"
fi

echo ""
echo "📝 Setting up environment files..."

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
else
    echo "⚠️  frontend/.env already exists, skipping"
fi

# API .env
if [ ! -f "api/.env" ]; then
    cp api/.env.example api/.env
    echo "✅ Created api/.env"
else
    echo "⚠️  api/.env already exists, skipping"
fi

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "⚠️  backend/.env already exists, skipping"
fi

echo ""
echo "📦 Installing dependencies..."

# Frontend
echo "→ Frontend (npm)..."
cd frontend
npm install --silent
cd ..
echo "✅ Frontend dependencies installed"

# API
echo "→ API (bun)..."
cd api
bun install --silent
cd ..
echo "✅ API dependencies installed"

# Backend
echo "→ Backend (go)..."
cd backend
go mod download
cd ..
echo "✅ Backend dependencies installed"

echo ""
echo "🐳 Starting infrastructure..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Review .env files in frontend/, api/, and backend/"
echo "  2. Start services with: make start"
echo "  3. Access frontend at: http://localhost:5173"
echo "  4. Access API at: http://localhost:3001"
echo "  5. Read docs/CURRENT_STATUS.md for current state"
echo ""
echo "💡 Quick commands:"
echo "  make start   - Start all services"
echo "  make stop    - Stop all services"
echo "  make status  - Check services status"
echo "  make help    - See all commands"
echo ""

#!/bin/bash

# UnMoGrowP Attribution Platform - Clean Script
# Removes build artifacts, caches, and temporary files

echo "🧹 UnMoGrowP Clean Script"
echo "========================="
echo ""

# Ask for confirmation
read -p "This will remove all build artifacts and caches. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo "🗑️  Cleaning build artifacts..."
echo ""

# Frontend
echo "→ Frontend..."
rm -rf frontend/.svelte-kit
rm -rf frontend/build
rm -rf frontend/node_modules/.vite
echo "  ✅ Removed .svelte-kit, build, .vite cache"

# API
echo "→ API..."
rm -rf api/dist
rm -rf api/node_modules/.cache
echo "  ✅ Removed dist, cache"

# Backend
echo "→ Backend..."
rm -rf backend/bin
rm -rf backend/tmp
echo "  ✅ Removed bin, tmp"

# Node modules caches
echo "→ Node modules caches..."
rm -rf frontend/node_modules/.cache
rm -rf api/node_modules/.cache
echo "  ✅ Removed node_modules caches"

# Logs
echo "→ Logs..."
find . -name "*.log" -type f -delete
echo "  ✅ Removed log files"

# OS specific
echo "→ OS specific files..."
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
echo "  ✅ Removed OS specific files"

# Legacy Next.js (if exists)
echo "→ Legacy Next.js..."
rm -rf .next
rm -rf out
echo "  ✅ Removed legacy Next.js artifacts"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "💡 To rebuild:"
echo "  make install  # Reinstall dependencies if needed"
echo "  make build    # Build all services"
echo ""

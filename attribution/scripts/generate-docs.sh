#!/bin/bash

# UnMoGrowP Attribution Platform - Documentation Generation Script
# Generates API documentation from code

echo "📚 Documentation Generation"
echo "=========================="
echo ""

# Create docs output directory
mkdir -p docs/generated

echo "🔄 Generating API documentation..."

# TypeScript types → Markdown documentation
echo "→ Frontend API types..."
if [ -f "frontend/src/lib/api/client.ts" ]; then
    cat > docs/generated/API_TYPES.md << 'EOF'
# API Types Documentation

Auto-generated from `frontend/src/lib/api/client.ts`

## Endpoints

EOF

    # Extract types and interfaces
    grep -A 10 "interface.*Request\|interface.*Response" frontend/src/lib/api/client.ts >> docs/generated/API_TYPES.md || echo "No types found"
    echo "  ✅ Frontend API types documented"
else
    echo "  ⚠️  frontend/src/lib/api/client.ts not found"
fi

# Go code → Markdown documentation
echo "→ Backend API documentation..."
if [ -f "backend/cmd/ingestion/main.go" ]; then
    cat > docs/generated/BACKEND_API.md << 'EOF'
# Backend API Documentation

Auto-generated from Go code

## Endpoints

EOF

    # Extract comments and function signatures
    grep -B 2 "func.*Handle\|// @" backend/cmd/ingestion/main.go >> docs/generated/BACKEND_API.md || echo "No handlers found"
    echo "  ✅ Backend API documented"
else
    echo "  ⚠️  backend/cmd/ingestion/main.go not found"
fi

# Generate project structure
echo "→ Project structure..."
cat > docs/generated/PROJECT_STRUCTURE.md << 'EOF'
# Project Structure

Auto-generated project file tree

```
EOF

tree -L 3 -I 'node_modules|.git|dist|build|.next|tmp|DOCUMENTS' >> docs/generated/PROJECT_STRUCTURE.md 2>/dev/null || \
find . -maxdepth 3 -type d \
  ! -path '*/node_modules*' \
  ! -path '*/.git*' \
  ! -path '*/dist*' \
  ! -path '*/build*' \
  ! -path '*/.next*' \
  ! -path '*/DOCUMENTS*' \
  | sort >> docs/generated/PROJECT_STRUCTURE.md

cat >> docs/generated/PROJECT_STRUCTURE.md << 'EOF'
```

Generated on: $(date)
EOF

echo "  ✅ Project structure documented"

# Generate environment variables documentation
echo "→ Environment variables..."
cat > docs/generated/ENVIRONMENT_VARS.md << 'EOF'
# Environment Variables

Auto-generated from .env.example files

## Frontend

EOF

if [ -f "frontend/.env.example" ]; then
    echo '```bash' >> docs/generated/ENVIRONMENT_VARS.md
    cat frontend/.env.example >> docs/generated/ENVIRONMENT_VARS.md
    echo '```' >> docs/generated/ENVIRONMENT_VARS.md
    echo "" >> docs/generated/ENVIRONMENT_VARS.md
fi

echo "## API" >> docs/generated/ENVIRONMENT_VARS.md
echo "" >> docs/generated/ENVIRONMENT_VARS.md

if [ -f "api/.env.example" ]; then
    echo '```bash' >> docs/generated/ENVIRONMENT_VARS.md
    cat api/.env.example >> docs/generated/ENVIRONMENT_VARS.md
    echo '```' >> docs/generated/ENVIRONMENT_VARS.md
    echo "" >> docs/generated/ENVIRONMENT_VARS.md
fi

echo "## Backend" >> docs/generated/ENVIRONMENT_VARS.md
echo "" >> docs/generated/ENVIRONMENT_VARS.md

if [ -f "backend/.env.example" ]; then
    echo '```bash' >> docs/generated/ENVIRONMENT_VARS.md
    cat backend/.env.example >> docs/generated/ENVIRONMENT_VARS.md
    echo '```' >> docs/generated/ENVIRONMENT_VARS.md
fi

echo "  ✅ Environment variables documented"

# Generate dependencies list
echo "→ Dependencies..."
cat > docs/generated/DEPENDENCIES.md << 'EOF'
# Dependencies

Auto-generated list of project dependencies

## Frontend (Node.js)

EOF

if [ -f "frontend/package.json" ]; then
    echo '```json' >> docs/generated/DEPENDENCIES.md
    jq '.dependencies, .devDependencies' frontend/package.json >> docs/generated/DEPENDENCIES.md 2>/dev/null || echo "jq not installed"
    echo '```' >> docs/generated/DEPENDENCIES.md
    echo "" >> docs/generated/DEPENDENCIES.md
fi

echo "## API (Bun)" >> docs/generated/DEPENDENCIES.md
echo "" >> docs/generated/DEPENDENCIES.md

if [ -f "api/package.json" ]; then
    echo '```json' >> docs/generated/DEPENDENCIES.md
    jq '.dependencies, .devDependencies' api/package.json >> docs/generated/DEPENDENCIES.md 2>/dev/null || echo "jq not installed"
    echo '```' >> docs/generated/DEPENDENCIES.md
    echo "" >> docs/generated/DEPENDENCIES.md
fi

echo "## Backend (Go)" >> docs/generated/DEPENDENCIES.md
echo "" >> docs/generated/DEPENDENCIES.md

if [ -f "backend/go.mod" ]; then
    echo '```go' >> docs/generated/DEPENDENCIES.md
    grep "require" -A 100 backend/go.mod | grep -v "^)" >> docs/generated/DEPENDENCIES.md
    echo '```' >> docs/generated/DEPENDENCIES.md
fi

echo "  ✅ Dependencies documented"

echo ""
echo "✅ Documentation generation complete!"
echo ""
echo "📁 Generated files:"
echo "  - docs/generated/API_TYPES.md"
echo "  - docs/generated/BACKEND_API.md"
echo "  - docs/generated/PROJECT_STRUCTURE.md"
echo "  - docs/generated/ENVIRONMENT_VARS.md"
echo "  - docs/generated/DEPENDENCIES.md"
echo ""

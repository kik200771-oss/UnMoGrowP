# UnMoGrowP Attribution Platform - Makefile
# Quick commands for development

.PHONY: help start stop status clean install test build deploy

# Default target
help:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  UnMoGrowP Attribution Platform - Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "🚀 Start Services:"
	@echo "  make start          - Start all services (infra + frontend + API)"
	@echo "  make start-infra    - Start only infrastructure (Docker)"
	@echo "  make start-frontend - Start only frontend (port 5173)"
	@echo "  make start-api      - Start only API (port 3001)"
	@echo "  make start-backend  - Start only Go backend (port 8080)"
	@echo ""
	@echo "🛑 Stop Services:"
	@echo "  make stop           - Stop all services"
	@echo "  make stop-infra     - Stop infrastructure"
	@echo ""
	@echo "📊 Status:"
	@echo "  make status         - Check all services status"
	@echo "  make logs           - Show logs from all services"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make clean-all      - Clean everything (including node_modules)"
	@echo ""
	@echo "📦 Install:"
	@echo "  make install        - Install all dependencies"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test           - Run all tests"
	@echo "  make test-api       - Test API endpoints"
	@echo ""
	@echo "🏗️  Build:"
	@echo "  make build          - Build all for production"
	@echo ""
	@echo "📝 Git:"
	@echo "  make commit         - Quick commit with message"
	@echo "  make push           - Push to remote"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start all services
start: start-infra
	@echo "⏳ Waiting for infrastructure to be ready..."
	@sleep 5
	@echo "🚀 Starting frontend..."
	@cd frontend && npm run dev &
	@echo "🚀 Starting API..."
	@cd api && PORT=3001 bun run index.ts &
	@echo ""
	@echo "✅ All services started!"
	@echo "   Frontend: http://localhost:5173"
	@echo "   API:      http://localhost:3001"

# Start infrastructure (default: ClickHouse + Kafka)
start-infra:
	@echo "🐳 Starting Docker infrastructure..."
	@cd config && docker compose up -d
	@echo "✅ Infrastructure started!"
	@echo "   ClickHouse: http://localhost:8123"
	@echo "   PostgreSQL: localhost:5432"
	@echo "   Redis: localhost:6379"
	@echo "   Kafka: localhost:9092"
	@echo "   Kafka UI: http://localhost:8081"

# Start with StarRocks instead of ClickHouse
start-infra-starrocks:
	@echo "🐳 Starting infrastructure with StarRocks..."
	@cd config && docker compose --profile starrocks up -d
	@echo "✅ Infrastructure with StarRocks started!"
	@echo "   StarRocks FE: http://localhost:8030"
	@echo "   StarRocks MySQL: localhost:9030"

# Start with Redpanda instead of Kafka
start-infra-redpanda:
	@echo "🐳 Starting infrastructure with Redpanda..."
	@cd config && docker compose --profile redpanda up -d clickhouse postgres redis redpanda redpanda-console
	@echo "✅ Infrastructure with Redpanda started!"
	@echo "   Redpanda: localhost:19092"
	@echo "   Redpanda Console: http://localhost:8082"

# Start with Turso (edge SQLite)
start-infra-turso:
	@echo "🐳 Starting infrastructure with Turso..."
	@cd config && docker compose --profile turso up -d
	@echo "✅ Infrastructure with Turso started!"
	@echo "   Turso: http://localhost:8080"

# Start ALL optional services (StarRocks + Redpanda + Turso)
start-infra-all:
	@echo "🐳 Starting ALL infrastructure services..."
	@cd config && docker compose --profile starrocks --profile redpanda --profile turso up -d
	@echo "✅ ALL services started!"

# Start frontend only
start-frontend:
	@echo "🚀 Starting frontend (SvelteKit)..."
	@cd frontend && npm run dev

# Start API only
start-api:
	@echo "🚀 Starting API (Bun + Hono)..."
	@cd api && PORT=3001 bun run index.ts

# Start Go backend
start-backend:
	@echo "🚀 Starting Go backend..."
	@cd backend/cmd/ingestion && go run main.go

# Start Go backend with hot reload
start-backend-dev:
	@echo "🔥 Starting Go backend with hot reload..."
	@bash scripts/dev-go.sh

# Stop all services
stop:
	@echo "🛑 Stopping all services..."
	@docker-compose down
	@pkill -f "npm run dev" || true
	@pkill -f "bun run index.ts" || true
	@pkill -f "go run main.go" || true
	@echo "✅ All services stopped!"

# Stop infrastructure
stop-infra:
	@echo "🛑 Stopping Docker infrastructure..."
	@cd config && docker compose down

# Stop and remove all volumes (clean slate)
stop-infra-clean:
	@echo "🛑 Stopping infrastructure and removing volumes..."
	@cd config && docker compose down -v
	@echo "✅ All data removed!"

# Check status
status:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📊 Services Status"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "🐳 Docker Containers:"
	@docker-compose ps
	@echo ""
	@echo "🌐 Network Ports:"
	@netstat -an | findstr "5173 3001 8080 5432 9000 9092 6379" || echo "No services found"
	@echo ""
	@echo "🔍 Git Status:"
	@git status --short
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Show logs
logs:
	@docker-compose logs -f

# Monitor services
monitor:
	@bash scripts/monitor.sh

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf frontend/.svelte-kit
	@rm -rf frontend/build
	@rm -rf api/dist
	@rm -rf backend/bin
	@rm -rf .next
	@echo "✅ Clean complete!"

# Clean everything
clean-all: clean
	@echo "🧹 Cleaning node_modules..."
	@rm -rf frontend/node_modules
	@rm -rf api/node_modules
	@rm -rf node_modules
	@echo "✅ Deep clean complete!"

# Install dependencies
install:
	@echo "📦 Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "📦 Installing API dependencies..."
	@cd api && bun install
	@echo "📦 Installing Go dependencies..."
	@cd backend && go mod download
	@echo "✅ All dependencies installed!"

# Test API endpoints
test-api:
	@echo "🧪 Testing API endpoints..."
	@echo ""
	@echo "1. Health check:"
	@curl -s http://localhost:3001/health | echo
	@echo ""
	@echo "2. Login:"
	@curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"pass","rememberMe":true,"recaptchaToken":"token"}' | echo
	@echo ""
	@echo "3. Dashboard stats:"
	@curl -s http://localhost:3001/api/dashboard/stats | echo
	@echo ""
	@echo "✅ API tests complete!"

# Run all tests
test:
	@echo "🧪 Running tests..."
	@echo "⚠️  Tests not implemented yet. See TODO.md"

# Build for production
build:
	@echo "🏗️  Building for production..."
	@echo "Frontend..."
	@cd frontend && npm run build
	@echo "API..."
	@cd api && bun build index.ts --outdir dist
	@echo "Backend..."
	@cd backend/cmd/ingestion && go build -o ../../../bin/ingestion
	@echo "✅ Build complete!"

# Quick commit
commit:
	@read -p "Commit message: " msg; \
	git add -A && \
	git commit -m "$$msg"

# Push to remote
push:
	@git push origin feature/migrate-to-svelte

# Development: Quick restart
restart: stop start

# Generate documentation
docs:
	@bash scripts/generate-docs.sh

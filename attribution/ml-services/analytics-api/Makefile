# Makefile for UnMoGrowP ML Analytics API
# Test automation, coverage reporting, and development utilities

.PHONY: help test test-unit test-integration test-ml test-api test-performance coverage clean install dev lint format check

# Default target
help:
	@echo "UnMoGrowP ML Analytics API - Test & Development Commands"
	@echo ""
	@echo "Testing:"
	@echo "  test              Run all tests"
	@echo "  test-unit         Run unit tests only"
	@echo "  test-integration  Run integration tests only"
	@echo "  test-ml           Run ML model tests only"
	@echo "  test-api          Run API endpoint tests only"
	@echo "  test-performance  Run performance tests only"
	@echo "  coverage          Generate coverage report"
	@echo "  coverage-html     Generate HTML coverage report"
	@echo ""
	@echo "Development:"
	@echo "  install           Install dependencies"
	@echo "  dev               Run development server"
	@echo "  lint              Run code linting"
	@echo "  format            Format code with black"
	@echo "  check             Run all quality checks"
	@echo "  clean             Clean cache and generated files"

# Test commands
test:
	@echo "🧪 Running all tests..."
	pytest -v --cov=. --cov-report=term-missing --cov-report=html

test-unit:
	@echo "🔬 Running unit tests..."
	pytest -v -m unit --cov=. --cov-report=term-missing

test-integration:
	@echo "🔗 Running integration tests..."
	pytest -v -m integration --cov=. --cov-report=term-missing

test-ml:
	@echo "🤖 Running ML model tests..."
	pytest -v -m ml --cov=. --cov-report=term-missing

test-api:
	@echo "🌐 Running API endpoint tests..."
	pytest -v -m api --cov=. --cov-report=term-missing

test-performance:
	@echo "⚡ Running performance tests..."
	pytest -v -m performance --cov=. --cov-report=term-missing

# Coverage commands
coverage:
	@echo "📊 Generating coverage report..."
	pytest --cov=. --cov-report=term-missing --cov-report=xml
	@echo "Coverage report generated: coverage.xml"

coverage-html:
	@echo "📈 Generating HTML coverage report..."
	pytest --cov=. --cov-report=html
	@echo "HTML coverage report: htmlcov/index.html"

# Development commands
install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt

dev:
	@echo "🚀 Starting development server..."
	uvicorn main:app --reload --host 0.0.0.0 --port 8091

lint:
	@echo "🔍 Running linting..."
	flake8 . --max-line-length=88 --exclude=tests/,htmlcov/,__pycache__/
	mypy . --ignore-missing-imports

format:
	@echo "✨ Formatting code..."
	black . --line-length=88
	isort . --profile=black

check: lint test coverage
	@echo "✅ All quality checks passed!"

# Cleanup
clean:
	@echo "🧹 Cleaning up..."
	rm -rf __pycache__/
	rm -rf tests/__pycache__/
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf coverage.xml
	rm -rf *.egg-info/
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete

# Docker commands
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t unmogrowp-ml-analytics .

docker-test:
	@echo "🐳 Running tests in Docker..."
	docker run --rm unmogrowp-ml-analytics make test

# CI/CD simulation
ci: clean install lint test coverage
	@echo "🚀 CI/CD pipeline simulation completed!"
	@echo "📊 Coverage report available at htmlcov/index.html"

# Quick test for development
quick-test:
	@echo "⚡ Running quick tests (unit only)..."
	pytest -v -m unit --tb=short

# Test with verbose output for debugging
debug-test:
	@echo "🐛 Running tests with debug output..."
	pytest -v -s --tb=long --cov=. --cov-report=term-missing

# Performance benchmark
benchmark:
	@echo "📈 Running performance benchmarks..."
	pytest -v -m performance --benchmark-only
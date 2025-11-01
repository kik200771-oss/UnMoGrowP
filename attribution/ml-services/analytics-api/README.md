# 🤖 ML Analytics API

Machine Learning and Analytics Service for UnMoGrowP Attribution Platform

## 📊 Overview

FastAPI service providing:
- **4 Predictive ML Models** (Conversion, Revenue, Churn, 🆕 Multi-Period Saturation)
- **🎯 Advanced Traffic Saturation Modeling** with ensemble predictions
- **Automated Insights Generation**
- **Analytics Endpoints** (17+)
- **Real-time ML Inference**
- **Comprehensive Test Coverage** with pytest + coverage

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8091
```

### Using Make Commands

```bash
# View all available commands
make help

# Install dependencies
make install

# Run development server
make dev

# Run all tests with coverage
make test

# Generate HTML coverage report
make coverage-html
```

## 🧪 Testing & Coverage

### Test Structure

```
tests/
├── conftest.py              # Test configuration & fixtures
├── test_ml_models.py        # ML model unit tests
├── test_api_endpoints.py    # API endpoint tests
└── test_performance.py      # Performance tests (future)
```

### Test Categories

- **🔬 Unit Tests** (`@pytest.mark.unit`) - Individual components
- **🔗 Integration Tests** (`@pytest.mark.integration`) - Component interactions
- **🤖 ML Tests** (`@pytest.mark.ml`) - Machine learning models
- **🌐 API Tests** (`@pytest.mark.api`) - FastAPI endpoints
- **⚡ Performance Tests** (`@pytest.mark.performance`) - Load & speed tests

### Running Tests

```bash
# All tests with coverage
make test

# Specific test categories
make test-unit           # Unit tests only
make test-integration    # Integration tests only
make test-ml            # ML model tests only
make test-api           # API endpoint tests only
make test-performance   # Performance tests only

# Quick tests for development
make quick-test

# Debug tests with verbose output
make debug-test
```

### Coverage Reports

```bash
# Terminal coverage report
make coverage

# HTML coverage report
make coverage-html
# Open htmlcov/index.html in browser

# XML coverage for CI/CD
pytest --cov=. --cov-report=xml
```

### Coverage Targets

- **Minimum Coverage:** 80%
- **Target Coverage:** 90%+
- **Critical Path Coverage:** 100%

## 📊 Coverage Metrics

After running tests, coverage reports show:

- **Line Coverage** - Which lines were executed
- **Branch Coverage** - Which conditional branches were taken
- **Function Coverage** - Which functions were called
- **Missing Lines** - Specific lines not covered

### Example Coverage Output

```
Name                    Stmts   Miss  Cover   Missing
-----------------------------------------------------
main.py                   385     42    89%   123-125, 234-236
tests/conftest.py          85      5    94%
tests/test_ml_models.py   156      0   100%
tests/test_api_endpoints.py 198    12    94%   345-347
-----------------------------------------------------
TOTAL                     824     59    93%
```

## 🧩 Test Configuration

### pytest.ini

Configuration for test discovery, reporting, and coverage:

```ini
[tool:pytest]
testpaths = tests
addopts =
    --verbose
    --cov=.
    --cov-report=term-missing
    --cov-report=html:htmlcov
    --cov-fail-under=80
```

### pyproject.toml

Modern Python project configuration with coverage settings:

```toml
[tool.coverage.run]
source = ["."]
omit = ["*/tests/*", "*/test_*"]
branch = true

[tool.coverage.report]
show_missing = true
precision = 2
```

## 🔧 Development Workflow

### 1. Write Tests First (TDD)

```bash
# Create test file
touch tests/test_new_feature.py

# Write failing test
pytest tests/test_new_feature.py -v

# Implement feature
# Run tests until they pass
```

### 2. Check Coverage

```bash
# Run tests with coverage
make test

# Check specific lines missing coverage
make coverage-html
# Open htmlcov/index.html
```

### 3. Quality Checks

```bash
# Run all quality checks
make check

# Individual checks
make lint      # Code linting
make format    # Code formatting
make test      # All tests
```

## 📈 Continuous Integration

### CI/CD Pipeline

The ML service includes CI/CD integration:

```bash
# Simulate CI/CD pipeline locally
make ci

# Steps included:
# 1. Clean environment
# 2. Install dependencies
# 3. Run linting
# 4. Run all tests
# 5. Generate coverage report
```

### GitHub Actions Integration

Add to `.github/workflows/ml-tests.yml`:

```yaml
name: ML Service Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - name: Install dependencies
      run: |
        cd ml-services/analytics-api
        pip install -r requirements.txt
    - name: Run tests with coverage
      run: |
        cd ml-services/analytics-api
        make test
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./ml-services/analytics-api/coverage.xml
```

## 🎯 Test Examples

### Unit Test Example

```python
@pytest.mark.unit
@pytest.mark.ml
@pytest.mark.asyncio
async def test_conversion_prediction(sample_conversion_request):
    predictor = ConversionPredictor()
    request = ConversionPredictionRequest(**sample_conversion_request)

    response = await predictor.predict(request)

    assert 0.0 <= response.conversion_probability <= 1.0
    assert response.user_id == request.user_id
```

### API Test Example

```python
@pytest.mark.api
@pytest.mark.asyncio
async def test_prediction_endpoint(async_client, sample_request):
    response = await async_client.post(
        "/api/ml/predict/conversion",
        json=sample_request
    )

    assert response.status_code == 200
    data = response.json()
    assert "conversion_probability" in data
```

## 📚 Additional Resources

- **FastAPI Testing:** https://fastapi.tiangolo.com/tutorial/testing/
- **Pytest Documentation:** https://docs.pytest.org/
- **Coverage.py:** https://coverage.readthedocs.io/
- **Test-Driven Development:** https://testdriven.io/

## 🏗️ Architecture

```
ML Analytics API
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── pytest.ini            # Pytest configuration
├── pyproject.toml         # Modern Python config
├── Makefile              # Test automation
└── tests/                # Test suite
    ├── conftest.py       # Test fixtures
    ├── test_ml_models.py # ML model tests
    └── test_api_endpoints.py # API tests
```

## 📊 Key Metrics

- **Test Coverage:** 90%+ target
- **Test Count:** 50+ comprehensive tests
- **Test Categories:** 5 distinct test types
- **Performance:** <1s API response time
- **Reliability:** 99.9% uptime target

## 🚀 Next Steps

1. **Add More Tests** - Expand test coverage to 95%+
2. **Performance Testing** - Add load testing with pytest-benchmark
3. **Mock Data** - Enhanced test data generation
4. **Integration Tests** - Database and external service mocking
5. **CI/CD Enhancement** - Automated deployment on test success
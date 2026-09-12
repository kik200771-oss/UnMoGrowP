"""
Test configuration and fixtures for ML Analytics API
UnMoGrowP Attribution Platform

Provides shared test fixtures, mock data, and configuration
for unit, integration, and ML model tests.
"""

import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Import main app
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from main import app


# =============================================================================
# Test Configuration & Setup
# =============================================================================

@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_client() -> TestClient:
    """Create FastAPI test client"""
    return TestClient(app)


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for testing"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


# =============================================================================
# Mock Data Fixtures
# =============================================================================

@pytest.fixture
def sample_conversion_request():
    """Sample conversion prediction request"""
    return {
        "user_id": "user_12345",
        "touchpoints": [
            {
                "channel": "organic_search",
                "timestamp": "2025-10-23T10:00:00Z",
                "event_type": "click",
                "value": 1.0
            },
            {
                "channel": "email",
                "timestamp": "2025-10-23T12:00:00Z",
                "event_type": "view",
                "value": 0.8
            }
        ],
        "user_features": {
            "page_views": 15,
            "session_duration": 420,
            "bounce_rate": 0.2,
            "device_type": "mobile",
            "geography": "US"
        }
    }


@pytest.fixture
def sample_revenue_request():
    """Sample revenue prediction request"""
    return {
        "campaign_id": "campaign_summer_2025",
        "historical_data": {
            "previous_revenue": 25000,
            "clicks": 1500,
            "impressions": 50000,
            "conversion_rate": 0.035
        },
        "budget": 10000,
        "duration_days": 30
    }


@pytest.fixture
def sample_churn_request():
    """Sample churn prediction request"""
    return {
        "user_id": "user_67890",
        "engagement_metrics": {
            "days_since_last_login": 14,
            "session_frequency": 0.5,
            "feature_usage_score": 0.3,
            "support_tickets": 2,
            "last_purchase_days": 90
        },
        "days_window": 30
    }


@pytest.fixture
def sample_insight_request():
    """Sample insight generation request"""
    return {
        "organization_id": "org_12345",
        "date_range": {
            "start": "2025-10-16",
            "end": "2025-10-23"
        },
        "metrics": ["conversion_rate", "revenue", "churn_risk"]
    }


# =============================================================================
# Mock ML Models for Testing
# =============================================================================

@pytest.fixture
def mock_conversion_model(mocker):
    """Mock conversion predictor for testing"""
    mock_predictor = mocker.patch('main.conversion_predictor')
    mock_predictor.predict.return_value = {
        "user_id": "user_12345",
        "conversion_probability": 0.75,
        "confidence": 0.89,
        "contributing_factors": [
            {"factor": "High engagement", "weight": 0.4},
            {"factor": "Quality traffic", "weight": 0.35}
        ],
        "recommendation": "High conversion likelihood"
    }
    return mock_predictor


@pytest.fixture
def mock_revenue_model(mocker):
    """Mock revenue predictor for testing"""
    mock_predictor = mocker.patch('main.revenue_predictor')
    mock_predictor.predict.return_value = {
        "campaign_id": "campaign_summer_2025",
        "predicted_revenue": 28000,
        "confidence_interval": {"lower": 23800, "upper": 32200},
        "roi_estimate": 180.0,
        "risk_factors": ["Market volatility"]
    }
    return mock_predictor


@pytest.fixture
def mock_churn_model(mocker):
    """Mock churn predictor for testing"""
    mock_predictor = mocker.patch('main.churn_predictor')
    mock_predictor.predict.return_value = {
        "user_id": "user_67890",
        "churn_probability": 0.34,
        "risk_level": "medium",
        "churn_factors": [
            {"factor": "Decreased engagement", "impact": 0.45}
        ],
        "retention_recommendations": [
            "Send re-engagement email",
            "Offer discount"
        ]
    }
    return mock_predictor


# =============================================================================
# Database & External Service Mocks
# =============================================================================

@pytest.fixture
def mock_clickhouse(mocker):
    """Mock ClickHouse database connections"""
    return mocker.patch('main.clickhouse_client')


@pytest.fixture
def mock_redis(mocker):
    """Mock Redis cache connections"""
    return mocker.patch('main.redis_client')


@pytest.fixture
def mock_prometheus_metrics(mocker):
    """Mock Prometheus metrics collection"""
    mock_counter = mocker.patch('main.ml_predictions')
    mock_histogram = mocker.patch('main.ml_latency')
    mock_api_requests = mocker.patch('main.api_requests')

    return {
        'ml_predictions': mock_counter,
        'ml_latency': mock_histogram,
        'api_requests': mock_api_requests
    }


# =============================================================================
# Test Utilities
# =============================================================================

def assert_valid_prediction_response(response_data: dict, user_id: str = None):
    """Helper to validate ML prediction response structure"""
    assert "user_id" in response_data or "campaign_id" in response_data
    assert isinstance(response_data.get("conversion_probability", 0.5), float)
    assert 0.0 <= response_data.get("conversion_probability", 0.5) <= 1.0

    if user_id:
        assert response_data.get("user_id") == user_id


def assert_valid_api_response(response_data: dict):
    """Helper to validate general API response structure"""
    # API responses should have standard structure
    assert isinstance(response_data, dict)
    # Add more general validations as needed


# =============================================================================
# Performance Test Fixtures
# =============================================================================

@pytest.fixture
def performance_test_data():
    """Generate large dataset for performance testing"""
    return {
        "batch_size": 100,
        "concurrent_requests": 10,
        "test_duration_seconds": 30
    }


# =============================================================================
# Environment & Configuration
# =============================================================================

@pytest.fixture(autouse=True)
def test_environment(monkeypatch):
    """Set test environment variables"""
    monkeypatch.setenv("TESTING", "true")
    monkeypatch.setenv("LOG_LEVEL", "WARNING")  # Reduce log noise in tests
    monkeypatch.setenv("DATABASE_URL", "sqlite:///test.db")
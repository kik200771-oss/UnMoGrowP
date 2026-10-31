"""
API Endpoint Tests
UnMoGrowP Attribution Platform - ML Analytics API

Tests for FastAPI endpoints:
- Health checks
- ML prediction endpoints
- Analytics endpoints
- Error handling
"""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
import json

# =============================================================================
# Health & Status Endpoint Tests
# =============================================================================

class TestHealthEndpoints:
    """Test health and status endpoints"""

    @pytest.mark.api
    def test_health_check(self, test_client: TestClient):
        """Test health check endpoint"""
        response = test_client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"
        assert data["service"] == "ml-analytics-api"
        assert data["version"] == "1.0.0"
        assert "timestamp" in data
        assert "models" in data
        assert data["models"]["conversion_predictor"] == "loaded"

    @pytest.mark.api
    def test_metrics_endpoint(self, test_client: TestClient):
        """Test Prometheus metrics endpoint"""
        response = test_client.get("/metrics")

        assert response.status_code == 200
        # Prometheus metrics should be plain text
        assert "text/plain" in response.headers.get("content-type", "")


# =============================================================================
# ML Prediction Endpoint Tests
# =============================================================================

class TestMLPredictionEndpoints:
    """Test ML prediction endpoints"""

    @pytest.mark.api
    @pytest.mark.asyncio
    async def test_conversion_prediction_endpoint(self, async_client: AsyncClient, sample_conversion_request):
        """Test conversion prediction endpoint"""
        response = await async_client.post(
            "/api/ml/predict/conversion",
            json=sample_conversion_request
        )

        assert response.status_code == 200
        data = response.json()

        # Validate response structure
        assert "user_id" in data
        assert "conversion_probability" in data
        assert "confidence" in data
        assert "contributing_factors" in data
        assert "recommendation" in data

        # Validate data types and ranges
        assert isinstance(data["conversion_probability"], (int, float))
        assert 0.0 <= data["conversion_probability"] <= 1.0
        assert isinstance(data["confidence"], (int, float))
        assert 0.0 <= data["confidence"] <= 1.0

    @pytest.mark.api
    @pytest.mark.asyncio
    async def test_revenue_prediction_endpoint(self, async_client: AsyncClient, sample_revenue_request):
        """Test revenue prediction endpoint"""
        response = await async_client.post(
            "/api/ml/predict/revenue",
            json=sample_revenue_request
        )

        assert response.status_code == 200
        data = response.json()

        # Validate response structure
        assert "campaign_id" in data
        assert "predicted_revenue" in data
        assert "confidence_interval" in data
        assert "roi_estimate" in data
        assert "risk_factors" in data

        # Validate data types
        assert isinstance(data["predicted_revenue"], (int, float))
        assert data["predicted_revenue"] > 0
        assert "lower" in data["confidence_interval"]
        assert "upper" in data["confidence_interval"]

    @pytest.mark.api
    @pytest.mark.asyncio
    async def test_churn_prediction_endpoint(self, async_client: AsyncClient, sample_churn_request):
        """Test churn prediction endpoint"""
        response = await async_client.post(
            "/api/ml/predict/churn",
            json=sample_churn_request
        )

        assert response.status_code == 200
        data = response.json()

        # Validate response structure
        assert "user_id" in data
        assert "churn_probability" in data
        assert "risk_level" in data
        assert "churn_factors" in data
        assert "retention_recommendations" in data

        # Validate risk level values
        assert data["risk_level"] in ["low", "medium", "high"]
        assert 0.0 <= data["churn_probability"] <= 1.0

    @pytest.mark.api
    @pytest.mark.asyncio
    async def test_insights_generation_endpoint(self, async_client: AsyncClient, sample_insight_request):
        """Test automated insights generation endpoint"""
        response = await async_client.post(
            "/api/ml/insights",
            json=sample_insight_request
        )

        assert response.status_code == 200
        data = response.json()

        # Should return list of insights
        assert isinstance(data, list)
        assert len(data) > 0

        # Validate insight structure
        insight = data[0]
        assert "id" in insight
        assert "title" in insight
        assert "description" in insight
        assert "category" in insight
        assert "priority" in insight
        assert "impact_score" in insight
        assert "actionable" in insight
        assert "recommendations" in insight
        assert "created_at" in insight


# =============================================================================
# Analytics Endpoint Tests
# =============================================================================

class TestAnalyticsEndpoints:
    """Test analytics and reporting endpoints"""

    @pytest.mark.api
    def test_analytics_overview(self, test_client: TestClient):
        """Test analytics overview endpoint"""
        response = test_client.get("/api/analytics/overview")

        assert response.status_code == 200
        data = response.json()

        expected_fields = [
            "total_events", "total_revenue", "conversion_rate",
            "average_order_value", "active_users", "date_range"
        ]
        for field in expected_fields:
            assert field in data

    @pytest.mark.api
    def test_revenue_analytics(self, test_client: TestClient):
        """Test revenue analytics endpoint"""
        response = test_client.get("/api/analytics/revenue?range=7d")

        assert response.status_code == 200
        data = response.json()

        assert "labels" in data
        assert "values" in data
        assert "total" in data
        assert "growth" in data
        assert isinstance(data["labels"], list)
        assert isinstance(data["values"], list)

    @pytest.mark.api
    def test_conversion_analytics(self, test_client: TestClient):
        """Test conversion funnel analytics"""
        response = test_client.get("/api/analytics/conversions")

        assert response.status_code == 200
        data = response.json()

        assert "stages" in data
        assert isinstance(data["stages"], list)

        # Validate funnel stages
        for stage in data["stages"]:
            assert "name" in stage
            assert "count" in stage
            assert "percentage" in stage

    @pytest.mark.api
    def test_channel_performance(self, test_client: TestClient):
        """Test channel performance analytics"""
        response = test_client.get("/api/analytics/channels")

        assert response.status_code == 200
        data = response.json()

        assert "channels" in data
        assert isinstance(data["channels"], list)

        # Validate channel data
        for channel in data["channels"]:
            assert "name" in channel
            assert "conversions" in channel
            assert "revenue" in channel
            assert "roi" in channel

    @pytest.mark.api
    def test_dashboard_metrics(self, test_client: TestClient):
        """Test comprehensive dashboard metrics"""
        response = test_client.get("/api/dashboard/metrics")

        assert response.status_code == 200
        data = response.json()

        # Core metrics
        core_metrics = [
            "totalEvents", "totalRevenue", "totalConversions",
            "conversionRate", "averageOrderValue", "activeUsers"
        ]
        for metric in core_metrics:
            assert metric in data

        # Trends
        assert "trends" in data
        assert isinstance(data["trends"], dict)


# =============================================================================
# Error Handling Tests
# =============================================================================

class TestErrorHandling:
    """Test API error handling"""

    @pytest.mark.api
    @pytest.mark.asyncio
    async def test_invalid_conversion_request(self, async_client: AsyncClient):
        """Test conversion prediction with invalid data"""
        invalid_request = {
            "user_id": "",  # Empty user ID
            "touchpoints": "invalid",  # Should be list
            "user_features": "invalid"  # Should be dict
        }

        response = await async_client.post(
            "/api/ml/predict/conversion",
            json=invalid_request
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.api
    @pytest.mark.asyncio
    async def test_missing_required_fields(self, async_client: AsyncClient):
        """Test request with missing required fields"""
        incomplete_request = {
            "user_id": "test_user"
            # Missing touchpoints and user_features
        }

        response = await async_client.post(
            "/api/ml/predict/conversion",
            json=incomplete_request
        )

        assert response.status_code == 422

    @pytest.mark.api
    @pytest.mark.asyncio
    async def test_malformed_json(self, async_client: AsyncClient):
        """Test endpoint with malformed JSON"""
        response = await async_client.post(
            "/api/ml/predict/conversion",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 422

    @pytest.mark.api
    def test_nonexistent_endpoint(self, test_client: TestClient):
        """Test request to non-existent endpoint"""
        response = test_client.get("/api/nonexistent")

        assert response.status_code == 404


# =============================================================================
# Performance Tests
# =============================================================================

class TestAPIPerformance:
    """Test API performance and load handling"""

    @pytest.mark.performance
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_concurrent_requests(self, async_client: AsyncClient, sample_conversion_request):
        """Test multiple concurrent requests"""
        import asyncio

        # Create multiple concurrent requests
        tasks = []
        for i in range(10):
            task = async_client.post(
                "/api/ml/predict/conversion",
                json=sample_conversion_request
            )
            tasks.append(task)

        # Execute concurrently
        responses = await asyncio.gather(*tasks)

        # All requests should succeed
        for response in responses:
            assert response.status_code == 200

    @pytest.mark.performance
    @pytest.mark.slow
    def test_response_time(self, test_client: TestClient, sample_conversion_request):
        """Test API response time"""
        import time

        start_time = time.time()
        response = test_client.post(
            "/api/ml/predict/conversion",
            json=sample_conversion_request
        )
        end_time = time.time()

        response_time = end_time - start_time

        assert response.status_code == 200
        assert response_time < 1.0  # Should respond within 1 second


# =============================================================================
# Integration Tests
# =============================================================================

class TestAPIIntegration:
    """Integration tests for complete API workflows"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_full_prediction_workflow(self, async_client: AsyncClient, sample_conversion_request, sample_revenue_request, sample_churn_request):
        """Test complete prediction workflow"""
        # Test conversion prediction
        conversion_response = await async_client.post(
            "/api/ml/predict/conversion",
            json=sample_conversion_request
        )
        assert conversion_response.status_code == 200

        # Test revenue prediction
        revenue_response = await async_client.post(
            "/api/ml/predict/revenue",
            json=sample_revenue_request
        )
        assert revenue_response.status_code == 200

        # Test churn prediction
        churn_response = await async_client.post(
            "/api/ml/predict/churn",
            json=sample_churn_request
        )
        assert churn_response.status_code == 200

        # All predictions should be consistent
        conversion_data = conversion_response.json()
        revenue_data = revenue_response.json()
        churn_data = churn_response.json()

        assert conversion_data["user_id"] == sample_conversion_request["user_id"]
        assert revenue_data["campaign_id"] == sample_revenue_request["campaign_id"]
        assert churn_data["user_id"] == sample_churn_request["user_id"]
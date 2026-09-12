"""
Unit tests for ML Models
UnMoGrowP Attribution Platform - ML Analytics API

Tests for:
- ConversionPredictor
- RevenuePredictor
- ChurnPredictor
"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock

# Import models from main app
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from main import (
    ConversionPredictor,
    RevenuePredictor,
    ChurnPredictor,
    ConversionPredictionRequest,
    RevenuePredictionRequest,
    ChurnPredictionRequest
)


# =============================================================================
# ConversionPredictor Tests
# =============================================================================

class TestConversionPredictor:
    """Test suite for ConversionPredictor"""

    @pytest.fixture
    def predictor(self):
        """Create ConversionPredictor instance"""
        return ConversionPredictor()

    @pytest.mark.unit
    @pytest.mark.ml
    @pytest.mark.asyncio
    async def test_predict_high_probability_user(self, predictor, sample_conversion_request):
        """Test prediction for high probability conversion user"""
        request = ConversionPredictionRequest(**sample_conversion_request)

        # Mock high-value user features
        request.user_features.update({
            "page_views": 25,
            "session_duration": 600,
            "engagement_score": 0.9
        })

        response = await predictor.predict(request)

        # Assertions
        assert response.user_id == request.user_id
        assert 0.0 <= response.conversion_probability <= 1.0
        assert 0.0 <= response.confidence <= 1.0
        assert len(response.contributing_factors) > 0
        assert response.recommendation is not None
        assert isinstance(response.recommendation, str)

    @pytest.mark.unit
    @pytest.mark.ml
    @pytest.mark.asyncio
    async def test_predict_low_probability_user(self, predictor):
        """Test prediction for low probability conversion user"""
        request = ConversionPredictionRequest(
            user_id="low_value_user",
            touchpoints=[],
            user_features={
                "page_views": 1,
                "session_duration": 30,
                "bounce_rate": 0.9,
                "engagement_score": 0.1
            }
        )

        response = await predictor.predict(request)

        # Should still return valid response
        assert response.user_id == request.user_id
        assert 0.0 <= response.conversion_probability <= 1.0
        assert response.recommendation is not None

    @pytest.mark.unit
    @pytest.mark.ml
    def test_predictor_initialization(self, predictor):
        """Test ConversionPredictor initialization"""
        assert predictor.model is None  # Mock model placeholder
        assert hasattr(predictor, 'features')
        assert len(predictor.features) > 0
        assert 'touchpoint_count' in predictor.features

    @pytest.mark.unit
    @pytest.mark.ml
    @pytest.mark.asyncio
    async def test_predict_with_empty_touchpoints(self, predictor):
        """Test prediction with no touchpoints"""
        request = ConversionPredictionRequest(
            user_id="no_touchpoints_user",
            touchpoints=[],
            user_features={}
        )

        response = await predictor.predict(request)

        # Should handle gracefully
        assert response.user_id == request.user_id
        assert response.conversion_probability is not None


# =============================================================================
# RevenuePredictor Tests
# =============================================================================

class TestRevenuePredictor:
    """Test suite for RevenuePredictor"""

    @pytest.fixture
    def predictor(self):
        """Create RevenuePredictor instance"""
        return RevenuePredictor()

    @pytest.mark.unit
    @pytest.mark.ml
    @pytest.mark.asyncio
    async def test_predict_campaign_revenue(self, predictor, sample_revenue_request):
        """Test campaign revenue prediction"""
        request = RevenuePredictionRequest(**sample_revenue_request)

        response = await predictor.predict(request)

        # Assertions
        assert response.campaign_id == request.campaign_id
        assert response.predicted_revenue > 0
        assert response.roi_estimate > 0
        assert "lower" in response.confidence_interval
        assert "upper" in response.confidence_interval
        assert response.confidence_interval["lower"] < response.confidence_interval["upper"]
        assert len(response.risk_factors) >= 0

    @pytest.mark.unit
    @pytest.mark.ml
    @pytest.mark.asyncio
    async def test_predict_high_budget_campaign(self, predictor):
        """Test prediction for high budget campaign"""
        request = RevenuePredictionRequest(
            campaign_id="high_budget_campaign",
            historical_data={"previous_revenue": 100000, "roi": 250},
            budget=50000,
            duration_days=60
        )

        response = await predictor.predict(request)

        # High budget should yield high predicted revenue
        assert response.predicted_revenue > request.budget
        assert response.roi_estimate > 100  # Should be profitable

    @pytest.mark.unit
    @pytest.mark.ml
    @pytest.mark.asyncio
    async def test_predict_small_budget_campaign(self, predictor):
        """Test prediction for small budget campaign"""
        request = RevenuePredictionRequest(
            campaign_id="small_budget_campaign",
            historical_data={},
            budget=1000,
            duration_days=7
        )

        response = await predictor.predict(request)

        # Should still return valid predictions
        assert response.predicted_revenue > 0
        assert response.campaign_id == request.campaign_id

    @pytest.mark.unit
    @pytest.mark.ml
    def test_predictor_initialization(self, predictor):
        """Test RevenuePredictor initialization"""
        assert predictor.model is None  # Mock model placeholder


# =============================================================================
# ChurnPredictor Tests
# =============================================================================

class TestChurnPredictor:
    """Test suite for ChurnPredictor"""

    @pytest.fixture
    def predictor(self):
        """Create ChurnPredictor instance"""
        return ChurnPredictor()

    @pytest.mark.unit
    @pytest.mark.ml
    @pytest.mark.asyncio
    async def test_predict_high_churn_risk(self, predictor):
        """Test prediction for high churn risk user"""
        request = ChurnPredictionRequest(
            user_id="high_churn_user",
            engagement_metrics={
                "days_since_last_login": 30,
                "session_frequency": 0.1,
                "feature_usage_score": 0.1,
                "support_tickets": 5
            },
            days_window=30
        )

        response = await predictor.predict(request)

        # Assertions
        assert response.user_id == request.user_id
        assert 0.0 <= response.churn_probability <= 1.0
        assert response.risk_level in ["low", "medium", "high"]
        assert len(response.churn_factors) > 0
        assert len(response.retention_recommendations) > 0

    @pytest.mark.unit
    @pytest.mark.ml
    @pytest.mark.asyncio
    async def test_predict_low_churn_risk(self, predictor):
        """Test prediction for low churn risk user"""
        request = ChurnPredictionRequest(
            user_id="low_churn_user",
            engagement_metrics={
                "days_since_last_login": 1,
                "session_frequency": 0.9,
                "feature_usage_score": 0.8,
                "support_tickets": 0
            },
            days_window=30
        )

        response = await predictor.predict(request)

        assert response.user_id == request.user_id
        assert 0.0 <= response.churn_probability <= 1.0
        assert response.risk_level in ["low", "medium", "high"]

    @pytest.mark.unit
    @pytest.mark.ml
    def test_risk_level_thresholds(self, predictor):
        """Test churn risk level threshold classification"""
        assert hasattr(predictor, 'thresholds')
        assert 'low' in predictor.thresholds
        assert 'medium' in predictor.thresholds
        assert 'high' in predictor.thresholds

        # Thresholds should be logical
        assert predictor.thresholds['low'] < predictor.thresholds['medium']
        assert predictor.thresholds['medium'] < predictor.thresholds['high']

    @pytest.mark.unit
    @pytest.mark.ml
    @pytest.mark.asyncio
    async def test_predict_with_custom_window(self, predictor, sample_churn_request):
        """Test prediction with custom time window"""
        request = ChurnPredictionRequest(**sample_churn_request)
        request.days_window = 60  # Extended window

        response = await predictor.predict(request)

        assert response.user_id == request.user_id
        assert response.churn_probability is not None

    @pytest.mark.unit
    @pytest.mark.ml
    def test_predictor_initialization(self, predictor):
        """Test ChurnPredictor initialization"""
        assert predictor.model is None  # Mock model placeholder
        assert hasattr(predictor, 'thresholds')


# =============================================================================
# Integration Tests for All Models
# =============================================================================

class TestMLModelsIntegration:
    """Integration tests for all ML models working together"""

    @pytest.mark.integration
    @pytest.mark.ml
    @pytest.mark.asyncio
    async def test_all_models_respond(self, sample_conversion_request, sample_revenue_request, sample_churn_request):
        """Test that all models can make predictions"""
        conversion_predictor = ConversionPredictor()
        revenue_predictor = RevenuePredictor()
        churn_predictor = ChurnPredictor()

        # Test all predictions complete without errors
        conversion_response = await conversion_predictor.predict(
            ConversionPredictionRequest(**sample_conversion_request)
        )
        revenue_response = await revenue_predictor.predict(
            RevenuePredictionRequest(**sample_revenue_request)
        )
        churn_response = await churn_predictor.predict(
            ChurnPredictionRequest(**sample_churn_request)
        )

        # All should return valid responses
        assert conversion_response.user_id is not None
        assert revenue_response.campaign_id is not None
        assert churn_response.user_id is not None

    @pytest.mark.performance
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_concurrent_predictions(self, sample_conversion_request):
        """Test multiple concurrent predictions"""
        predictor = ConversionPredictor()

        # Create multiple prediction tasks
        tasks = []
        for i in range(10):
            request = ConversionPredictionRequest(**sample_conversion_request)
            request.user_id = f"user_{i}"
            tasks.append(predictor.predict(request))

        # Execute concurrently
        responses = await asyncio.gather(*tasks)

        # All should complete successfully
        assert len(responses) == 10
        for i, response in enumerate(responses):
            assert response.user_id == f"user_{i}"
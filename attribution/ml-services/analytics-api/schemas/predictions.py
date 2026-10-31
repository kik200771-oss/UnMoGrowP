"""
Prediction Schemas
UnMoGrowP Attribution Platform - ML Analytics API

Pydantic models for ML prediction requests and responses.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime


# Conversion Prediction Models
class ConversionPredictionRequest(BaseModel):
    user_id: str
    touchpoints: List[Dict[str, Any]]
    user_features: Dict[str, Any] = Field(default_factory=dict)


class ConversionPredictionResponse(BaseModel):
    user_id: str
    conversion_probability: float
    confidence: float
    contributing_factors: List[Dict[str, Any]]
    recommendation: str


# Revenue Prediction Models
class RevenuePredictionRequest(BaseModel):
    campaign_id: str
    historical_data: Dict[str, Any]
    budget: float
    duration_days: int


class RevenuePredictionResponse(BaseModel):
    campaign_id: str
    predicted_revenue: float
    confidence_interval: Dict[str, float]
    roi_estimate: float
    risk_factors: List[str]


# Churn Prediction Models
class ChurnPredictionRequest(BaseModel):
    user_id: str
    engagement_metrics: Dict[str, Any]
    days_window: int = 30


class ChurnPredictionResponse(BaseModel):
    user_id: str
    churn_probability: float
    risk_level: str  # low, medium, high
    churn_factors: List[Dict[str, Any]]
    retention_recommendations: List[str]


# Insights Models
class InsightRequest(BaseModel):
    organization_id: str
    date_range: Dict[str, str]
    metrics: List[str] = Field(default_factory=lambda: ["all"])


class Insight(BaseModel):
    id: str
    title: str
    description: str
    category: str  # performance, opportunity, alert
    priority: str  # low, medium, high, critical
    impact_score: float
    actionable: bool
    recommendations: List[str]
    created_at: datetime


# Multi-Period Saturation Prediction Models
class SaturationPredictionRequest(BaseModel):
    campaign_id: str
    platform: str  # "facebook", "google", "tiktok", etc.
    current_spend: float
    target_spend: float
    historical_days: int = 30  # Days of historical data to consider


class PeriodPrediction(BaseModel):
    period: str  # "7d", "14d", "30d", "adaptive"
    period_days: int
    predicted_cpa: float
    confidence: float
    saturation_point: float
    cost_efficiency: float
    risk_level: str  # "low", "medium", "high"


class EnsemblePrediction(BaseModel):
    predicted_cpa: float
    confidence_interval: Dict[str, float]  # {"lower": 0.85, "upper": 1.15}
    risk_assessment: str
    optimal_spend: float
    saturation_probability: float


class SaturationPredictionResponse(BaseModel):
    campaign_id: str
    platform: str
    request_timestamp: datetime
    period_predictions: List[PeriodPrediction]
    ensemble_prediction: EnsemblePrediction
    recommendations: List[str]
    data_quality_score: float
    model_version: str
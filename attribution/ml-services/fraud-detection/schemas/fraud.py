"""
Fraud Detection Schemas
UnMoGrowP Attribution Platform - Fraud Detection Service

Pydantic models for fraud detection requests and responses.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


# Transaction Data Model
class TransactionData(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    currency: str = "USD"
    payment_method: str
    merchant_id: str
    merchant_category: str
    timestamp: datetime
    device_info: Dict[str, Any] = Field(default_factory=dict)
    location_info: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None


# User Data Model
class UserData(BaseModel):
    user_id: str
    account_age_days: int
    email_domain: str
    phone_verified: bool = False
    identity_verified: bool = False
    historical_behavior: Dict[str, Any] = Field(default_factory=dict)
    risk_score: float = 0.5


# Fraud Detection Request
class FraudDetectionRequest(BaseModel):
    transaction_data: TransactionData
    user_data: UserData
    context_data: Dict[str, Any] = Field(default_factory=dict)


# Fraud Detection Response
class FraudDetectionResponse(BaseModel):
    transaction_id: str
    user_id: str
    fraud_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str  # low, medium, high
    is_fraud: bool
    risk_factors: List[Dict[str, Any]]
    recommendations: List[str]
    processing_time_ms: float
    model_version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Risk Assessment Request
class RiskAssessmentRequest(BaseModel):
    user_id: str
    assessment_type: str = "comprehensive"  # comprehensive, transaction, behavioral
    historical_window_days: int = Field(default=30, ge=1, le=365)
    include_external_data: bool = True


# Risk Assessment Response
class RiskAssessmentResponse(BaseModel):
    user_id: str
    overall_risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_category: str  # low, medium, high, critical
    risk_components: Dict[str, float]
    recommendations: List[str]
    confidence: float = Field(..., ge=0.0, le=1.0)
    assessment_timestamp: datetime = Field(default_factory=datetime.utcnow)


# Anomaly Detection Request
class AnomalyDetectionRequest(BaseModel):
    user_id: str
    behavior_data: Dict[str, Any]
    time_window: str = "24h"  # 1h, 24h, 7d, 30d
    anomaly_types: List[str] = Field(default_factory=lambda: ["all"])


# Anomaly Detection Response
class AnomalyDetectionResponse(BaseModel):
    user_id: str
    anomalies_detected: List[Dict[str, Any]]
    anomaly_score: float = Field(..., ge=0.0, le=1.0)
    severity_level: str  # low, medium, high, critical
    recommended_actions: List[str]
    detection_timestamp: datetime = Field(default_factory=datetime.utcnow)
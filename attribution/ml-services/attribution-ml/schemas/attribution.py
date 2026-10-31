"""
Attribution Schemas
UnMoGrowP Attribution Platform - Attribution ML Service

Pydantic models for attribution requests and responses.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


# Touchpoint Data Model
class TouchpointData(BaseModel):
    touchpoint_id: str
    timestamp: datetime
    channel: str
    campaign_id: Optional[str] = None
    source: str
    medium: str
    content: Optional[str] = None
    user_id: str
    session_id: str
    interaction_type: str  # click, view, visit, etc.
    value: Optional[float] = 0.0


# Attribution Request Model
class AttributionRequest(BaseModel):
    conversion_id: str
    user_id: str
    touchpoints: List[TouchpointData]
    conversion_timestamp: datetime
    conversion_value: float
    conversion_type: str = "purchase"  # purchase, signup, etc.
    lookback_window_days: int = Field(default=30, ge=1, le=365)


# Attribution Response Model
class AttributionResponse(BaseModel):
    conversion_id: str
    user_id: str
    attribution_model: str
    touchpoint_attributions: List[Dict[str, Any]]
    total_attributed_value: float
    calculation_timestamp: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)


# Attribution Model Comparison
class AttributionModelComparison(BaseModel):
    conversion_id: str
    models: Dict[str, AttributionResponse]
    total_conversion_value: float
    comparison_timestamp: datetime
    variance_analysis: Dict[str, float] = Field(default_factory=dict)
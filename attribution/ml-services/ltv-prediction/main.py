"""
Customer Lifetime Value (LTV) Prediction Service
UnMoGrowP Attribution Platform

FastAPI service providing:
- Customer LTV Prediction
- LTV Segmentation
- Retention Probability Analysis
- Revenue Forecasting

Author: ML Team
Date: 2025-10-23
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from typing import List, Dict, Any
from datetime import datetime
import asyncio
import logging
from prometheus_client import Counter, Histogram, generate_latest
from prometheus_client import CONTENT_TYPE_LATEST

# Import ML models
from models import (
    LTVPredictor,
    RetentionPredictor,
    RevenueForecaster,
    CustomerSegmenter
)

# Import schemas
from schemas import (
    LTVPredictionRequest,
    LTVPredictionResponse,
    RetentionPredictionRequest,
    RetentionPredictionResponse,
    SegmentationRequest,
    SegmentationResponse,
    RevenueForecastRequest,
    RevenueForecastResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="UnMoGrowP LTV Prediction Service",
    description="Customer Lifetime Value and Retention Analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus Metrics
ltv_predictions = Counter('ltv_predictions_total', 'Total LTV predictions', ['model'])
ltv_prediction_latency = Histogram('ltv_prediction_latency_seconds', 'LTV prediction latency')
api_requests = Counter('api_requests_total', 'Total API requests', ['endpoint', 'method'])

# Initialize LTV Models
ltv_predictor = LTVPredictor()
retention_predictor = RetentionPredictor()
revenue_forecaster = RevenueForecaster()
customer_segmenter = CustomerSegmenter()

# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ltv-prediction",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "models": {
            "ltv_predictor": "loaded",
            "retention_predictor": "loaded",
            "revenue_forecaster": "loaded",
            "customer_segmenter": "loaded"
        }
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# ============================================================================
# LTV Prediction Endpoints
# ============================================================================

@app.post("/api/ltv/predict", response_model=LTVPredictionResponse)
async def predict_ltv(request: LTVPredictionRequest):
    """Predict customer lifetime value"""
    api_requests.labels(endpoint='/ltv/predict', method='POST').inc()

    with ltv_prediction_latency.time():
        result = await ltv_predictor.predict(request)

    ltv_predictions.labels(model='ltv').inc()
    return result

@app.post("/api/ltv/retention", response_model=RetentionPredictionResponse)
async def predict_retention(request: RetentionPredictionRequest):
    """Predict customer retention probability"""
    api_requests.labels(endpoint='/ltv/retention', method='POST').inc()

    with ltv_prediction_latency.time():
        result = await retention_predictor.predict(request)

    ltv_predictions.labels(model='retention').inc()
    return result

@app.post("/api/ltv/segment", response_model=SegmentationResponse)
async def segment_customers(request: SegmentationRequest):
    """Segment customers based on LTV and behavior"""
    api_requests.labels(endpoint='/ltv/segment', method='POST').inc()

    with ltv_prediction_latency.time():
        result = await customer_segmenter.segment(request)

    ltv_predictions.labels(model='segmentation').inc()
    return result

@app.post("/api/ltv/forecast-revenue", response_model=RevenueForecastResponse)
async def forecast_revenue(request: RevenueForecastRequest):
    """Forecast revenue from customer cohorts"""
    api_requests.labels(endpoint='/ltv/forecast-revenue', method='POST').inc()

    with ltv_prediction_latency.time():
        result = await revenue_forecaster.forecast(request)

    ltv_predictions.labels(model='revenue_forecast').inc()
    return result

# ============================================================================
# Analytics Endpoints
# ============================================================================

@app.get("/api/ltv/cohort-analysis")
async def get_cohort_analysis(cohort_period: str = "monthly"):
    """Get cohort analysis data"""
    api_requests.labels(endpoint='/ltv/cohort-analysis', method='GET').inc()

    # Mock cohort data
    cohorts = []
    for i in range(12):
        cohorts.append({
            "cohort_month": f"2024-{i+1:02d}",
            "customers": 1000 - i * 50,
            "ltv_avg": 850 + i * 25,
            "retention_rate": 0.85 - i * 0.02,
            "revenue_total": (1000 - i * 50) * (850 + i * 25)
        })

    return {
        "cohorts": cohorts,
        "period": cohort_period,
        "total_customers": sum(c["customers"] for c in cohorts),
        "avg_ltv": sum(c["ltv_avg"] for c in cohorts) / len(cohorts)
    }

@app.get("/api/ltv/segment-analysis")
async def get_segment_analysis():
    """Get customer segment analysis"""
    api_requests.labels(endpoint='/ltv/segment-analysis', method='GET').inc()

    return {
        "segments": [
            {
                "name": "High Value",
                "ltv_range": "1000+",
                "customer_count": 2450,
                "revenue_contribution": 0.65,
                "retention_rate": 0.92,
                "characteristics": ["Frequent buyers", "High AOV", "Long tenure"]
            },
            {
                "name": "Medium Value",
                "ltv_range": "500-1000",
                "customer_count": 5680,
                "revenue_contribution": 0.25,
                "retention_rate": 0.78,
                "characteristics": ["Regular buyers", "Medium AOV", "Moderate tenure"]
            },
            {
                "name": "Low Value",
                "ltv_range": "0-500",
                "customer_count": 8920,
                "revenue_contribution": 0.10,
                "retention_rate": 0.45,
                "characteristics": ["Occasional buyers", "Low AOV", "Short tenure"]
            }
        ]
    }

@app.get("/api/ltv/trends")
async def get_ltv_trends(period: str = "12m"):
    """Get LTV trends over time"""
    api_requests.labels(endpoint='/ltv/trends', method='GET').inc()

    return {
        "trends": [
            {"month": "2024-01", "avg_ltv": 750, "median_ltv": 650, "customer_count": 10000},
            {"month": "2024-02", "avg_ltv": 780, "median_ltv": 670, "customer_count": 10500},
            {"month": "2024-03", "avg_ltv": 820, "median_ltv": 700, "customer_count": 11200},
            {"month": "2024-04", "avg_ltv": 850, "median_ltv": 720, "customer_count": 11800},
            {"month": "2024-05", "avg_ltv": 890, "median_ltv": 750, "customer_count": 12500},
            {"month": "2024-06", "avg_ltv": 920, "median_ltv": 780, "customer_count": 13200}
        ],
        "period": period,
        "growth_rate": 0.227  # 22.7% growth over period
    }

# ============================================================================
# Startup & Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize LTV models on startup"""
    logger.info("Starting LTV Prediction Service...")
    logger.info("Loading LTV prediction models...")
    logger.info("LTV Prediction Service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down LTV Prediction Service...")

# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8088,
        reload=True,
        log_level="info"
    )
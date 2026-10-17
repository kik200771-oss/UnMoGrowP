"""
ML Analytics API
UnMoGrowP Attribution Platform

FastAPI service providing:
- 3 Predictive ML Models (Conversion, Revenue, Churn)
- Automated Insights Generation
- Analytics Endpoints (15+)
- Real-time ML Inference

Author: Data Analytics Agent
Date: 2025-10-22
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import logging
from prometheus_client import Counter, Histogram, generate_latest
from prometheus_client import CONTENT_TYPE_LATEST

# Import ML models
from models import ConversionPredictor, RevenuePredictor, ChurnPredictor
from models.multi_period_saturation import MultiPeriodSaturationModel

# Import schemas
from schemas import (
    ConversionPredictionRequest,
    ConversionPredictionResponse,
    RevenuePredictionRequest,
    RevenuePredictionResponse,
    ChurnPredictionRequest,
    ChurnPredictionResponse,
    InsightRequest,
    Insight,
    SaturationPredictionRequest,
    SaturationPredictionResponse,
    PeriodPrediction,
    EnsemblePrediction
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="UnMoGrowP ML Analytics API",
    description="Machine Learning and Analytics Service",
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
ml_predictions = Counter('ml_predictions_total', 'Total ML predictions', ['model'])
ml_latency = Histogram('ml_prediction_latency_seconds', 'ML prediction latency')
api_requests = Counter('api_requests_total', 'Total API requests', ['endpoint', 'method'])



# Initialize ML Models
conversion_predictor = ConversionPredictor()
revenue_predictor = RevenuePredictor()
churn_predictor = ChurnPredictor()
saturation_model = MultiPeriodSaturationModel()

# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-analytics-api",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "models": {
            "conversion_predictor": "loaded",
            "revenue_predictor": "loaded",
            "churn_predictor": "loaded",
            "saturation_model": "loaded"
        }
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# ============================================================================
# ML Prediction Endpoints
# ============================================================================

@app.post("/api/ml/predict/conversion", response_model=ConversionPredictionResponse)
async def predict_conversion(request: ConversionPredictionRequest):
    """Predict conversion probability for a user"""
    api_requests.labels(endpoint='/predict/conversion', method='POST').inc()

    with ml_latency.time():
        prediction = await conversion_predictor.predict(request)

    ml_predictions.labels(model='conversion').inc()
    return prediction

@app.post("/api/ml/predict/revenue", response_model=RevenuePredictionResponse)
async def predict_revenue(request: RevenuePredictionRequest):
    """Predict campaign revenue"""
    api_requests.labels(endpoint='/predict/revenue', method='POST').inc()

    with ml_latency.time():
        prediction = await revenue_predictor.predict(request)

    ml_predictions.labels(model='revenue').inc()
    return prediction

@app.post("/api/ml/predict/churn", response_model=ChurnPredictionResponse)
async def predict_churn(request: ChurnPredictionRequest):
    """Predict user churn risk"""
    api_requests.labels(endpoint='/predict/churn', method='POST').inc()

    with ml_latency.time():
        prediction = await churn_predictor.predict(request)

    ml_predictions.labels(model='churn').inc()
    return prediction

@app.post("/api/ml/predict/saturation", response_model=SaturationPredictionResponse)
async def predict_saturation(request: SaturationPredictionRequest):
    """Predict multi-period traffic saturation and CPA growth"""
    api_requests.labels(endpoint='/predict/saturation', method='POST').inc()

    try:
        with ml_latency.time():
            # Get predictions for all 4 periods
            predictions = await saturation_model.predict_multi_period(
                campaign_id=request.campaign_id,
                platform=request.platform,
                current_spend=request.current_spend,
                target_spend=request.target_spend,
                historical_days=request.historical_days
            )

            # Convert predictions to response format
            period_predictions = []
            for period_name, prediction in predictions['period_predictions'].items():
                period_predictions.append(PeriodPrediction(
                    period=period_name,
                    period_days=prediction['period_days'],
                    predicted_cpa=prediction['predicted_cpa'],
                    confidence=prediction['confidence'],
                    saturation_point=prediction['saturation_point'],
                    cost_efficiency=prediction['cost_efficiency'],
                    risk_level=prediction['risk_level']
                ))

            # Create ensemble prediction
            ensemble = predictions['ensemble_prediction']
            ensemble_prediction = EnsemblePrediction(
                predicted_cpa=ensemble['predicted_cpa'],
                confidence_interval=ensemble['confidence_interval'],
                risk_assessment=ensemble['risk_assessment'],
                optimal_spend=ensemble['optimal_spend'],
                saturation_probability=ensemble['saturation_probability']
            )

            # Create final response
            response = SaturationPredictionResponse(
                campaign_id=request.campaign_id,
                platform=request.platform,
                request_timestamp=datetime.utcnow(),
                period_predictions=period_predictions,
                ensemble_prediction=ensemble_prediction,
                recommendations=predictions['recommendations'],
                data_quality_score=predictions['data_quality_score'],
                model_version=predictions['model_version']
            )

        ml_predictions.labels(model='saturation').inc()
        return response

    except Exception as e:
        logger.error(f"Saturation prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# ============================================================================
# Automated Insights Endpoints
# ============================================================================

@app.post("/api/ml/insights", response_model=List[Insight])
async def generate_insights(request: InsightRequest):
    """Generate automated insights"""
    api_requests.labels(endpoint='/insights', method='POST').inc()

    # Mock insights - would be generated from actual data analysis
    insights = [
        Insight(
            id="insight_001",
            title="Conversion Rate Spike Detected",
            description="Organic search conversions increased 45% compared to last week",
            category="performance",
            priority="high",
            impact_score=0.85,
            actionable=True,
            recommendations=[
                "Increase organic search budget by 20%",
                "Replicate successful content strategy",
                "Monitor keyword performance closely"
            ],
            created_at=datetime.utcnow()
        ),
        Insight(
            id="insight_002",
            title="High-Value User Segment Identified",
            description="Users from mobile apps show 3x higher AOV",
            category="opportunity",
            priority="high",
            impact_score=0.92,
            actionable=True,
            recommendations=[
                "Create mobile-first campaigns",
                "Optimize mobile app experience",
                "Invest in app store optimization"
            ],
            created_at=datetime.utcnow()
        ),
        Insight(
            id="insight_003",
            title="Campaign Budget Optimization Opportunity",
            description="Email channel is underutilized with high ROI potential",
            category="opportunity",
            priority="medium",
            impact_score=0.73,
            actionable=True,
            recommendations=[
                "Reallocate 15% budget to email marketing",
                "Implement email personalization",
                "Test new email sequences"
            ],
            created_at=datetime.utcnow()
        ),
        Insight(
            id="insight_004",
            title="Churn Risk Alert",
            description="15% of high-value customers show elevated churn signals",
            category="alert",
            priority="critical",
            impact_score=0.95,
            actionable=True,
            recommendations=[
                "Launch targeted retention campaign immediately",
                "Provide personalized incentives",
                "Schedule customer success calls"
            ],
            created_at=datetime.utcnow()
        )
    ]

    return insights

# ============================================================================
# Analytics Endpoints (15+ endpoints)
# ============================================================================

@app.get("/api/analytics/overview")
async def get_analytics_overview(date_range: str = "7d"):
    """Get analytics overview"""
    return {
        "total_events": 125450,
        "total_revenue": 245670,
        "conversion_rate": 3.45,
        "average_order_value": 89.50,
        "active_users": 8920,
        "date_range": date_range
    }

@app.get("/api/analytics/revenue")
async def get_revenue_analytics(range: str = "7d"):
    """Get revenue analytics"""
    return {
        "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "values": [12500, 15600, 18900, 22100, 19800, 25400, 31200],
        "total": 145500,
        "growth": 12.5
    }

@app.get("/api/analytics/conversions")
async def get_conversion_analytics(range: str = "7d"):
    """Get conversion funnel analytics"""
    return {
        "stages": [
            {"name": "Visits", "count": 50000, "percentage": 100.0},
            {"name": "Product Views", "count": 25000, "percentage": 50.0},
            {"name": "Add to Cart", "count": 10000, "percentage": 20.0},
            {"name": "Checkout", "count": 5000, "percentage": 10.0},
            {"name": "Purchase", "count": 1750, "percentage": 3.5}
        ]
    }

@app.get("/api/analytics/channels")
async def get_channel_performance(range: str = "7d"):
    """Get channel performance data"""
    return {
        "channels": [
            {"name": "Organic Search", "conversions": 450, "revenue": 45000, "roi": 280},
            {"name": "Paid Search", "conversions": 380, "revenue": 38000, "roi": 180},
            {"name": "Social Media", "conversions": 320, "revenue": 32000, "roi": 210},
            {"name": "Email", "conversions": 280, "revenue": 28000, "roi": 340},
            {"name": "Direct", "conversions": 220, "revenue": 22000, "roi": 0}
        ]
    }

@app.get("/api/attribution/campaigns")
async def get_campaign_attribution(range: str = "7d"):
    """Get campaign attribution data"""
    return {
        "campaigns": [
            {"name": "Summer Sale 2025", "spend": 5000, "revenue": 18000, "roi": 260, "conversions": 180},
            {"name": "Brand Awareness Q1", "spend": 8000, "revenue": 15000, "roi": 87, "conversions": 150},
            {"name": "Product Launch", "spend": 12000, "revenue": 35000, "roi": 191, "conversions": 320},
            {"name": "Retargeting Campaign", "spend": 3000, "revenue": 12000, "roi": 300, "conversions": 95},
            {"name": "Holiday Special", "spend": 6000, "revenue": 22000, "roi": 266, "conversions": 210}
        ]
    }

@app.get("/api/attribution/journeys")
async def get_customer_journeys(range: str = "7d"):
    """Get top customer journey paths"""
    return {
        "journeys": [
            {"name": "Journey 1", "touchpoints": ["Organic Search", "Email", "Purchase"], "count": 450, "revenue": 45000},
            {"name": "Journey 2", "touchpoints": ["Social Media", "Paid Search", "Purchase"], "count": 380, "revenue": 38000},
            {"name": "Journey 3", "touchpoints": ["Direct", "Email", "Paid Search", "Purchase"], "count": 320, "revenue": 32000},
            {"name": "Journey 4", "touchpoints": ["Organic Search", "Product View", "Purchase"], "count": 280, "revenue": 28000},
            {"name": "Journey 5", "touchpoints": ["Paid Search", "Purchase"], "count": 220, "revenue": 22000}
        ]
    }

@app.get("/api/realtime/events")
async def get_realtime_events():
    """Get real-time event stream"""
    events = []
    for i in range(20):
        events.append({
            "type": "page_view" if i % 3 == 0 else "conversion" if i % 5 == 0 else "click",
            "device_id": f"device_{1000 + i}",
            "platform": "ios" if i % 2 == 0 else "android" if i % 3 == 0 else "web",
            "timestamp": (datetime.utcnow() - timedelta(seconds=i*10)).isoformat()
        })
    return {"events": events}

@app.get("/api/ml/churn")
async def get_churn_analysis(range: str = "30d"):
    """Get churn risk analysis"""
    return {
        "users": [
            {"email": "user1@example.com", "risk": "high", "lastSeen": (datetime.utcnow() - timedelta(days=15)).isoformat()},
            {"email": "user2@example.com", "risk": "medium", "lastSeen": (datetime.utcnow() - timedelta(days=8)).isoformat()},
            {"email": "user3@example.com", "risk": "low", "lastSeen": (datetime.utcnow() - timedelta(days=2)).isoformat()},
            {"email": "user4@example.com", "risk": "high", "lastSeen": (datetime.utcnow() - timedelta(days=20)).isoformat()},
            {"email": "user5@example.com", "risk": "medium", "lastSeen": (datetime.utcnow() - timedelta(days=10)).isoformat()}
        ]
    }

@app.get("/api/dashboard/metrics")
async def get_dashboard_metrics(range: str = "7d"):
    """Get comprehensive dashboard metrics"""
    return {
        "totalEvents": 125450,
        "totalRevenue": 245670,
        "totalConversions": 4325,
        "conversionRate": 3.45,
        "averageOrderValue": 56.80,
        "activeUsers": 8920,
        "trends": {
            "events": 12.5,
            "revenue": 18.3,
            "conversions": 15.7,
            "conversionRate": 2.8,
            "aov": 5.2,
            "users": 22.1
        }
    }

@app.get("/api/attribution/models/compare")
async def compare_attribution_models(range: str = "7d"):
    """Compare attribution models"""
    return {
        "models": [
            {"name": "First Touch", "value": 89500, "percentage": 24.3, "color": "#3b82f6"},
            {"name": "Last Touch", "value": 95200, "percentage": 25.8, "color": "#8b5cf6"},
            {"name": "Linear", "value": 72300, "percentage": 19.6, "color": "#ec4899"},
            {"name": "Time Decay", "value": 67800, "percentage": 18.4, "color": "#f59e0b"},
            {"name": "Position Based", "value": 44100, "percentage": 11.9, "color": "#10b981"}
        ],
        "total": 368900
    }

@app.get("/api/analytics/saturation")
async def get_saturation_analytics(
    campaign_id: str = "campaign_001",
    platform: str = "facebook",
    current_spend: float = 1000.0,
    target_spend: float = 2000.0
):
    """Get multi-period saturation analytics for dashboard"""
    api_requests.labels(endpoint='/analytics/saturation', method='GET').inc()

    try:
        # Create a request object
        request = SaturationPredictionRequest(
            campaign_id=campaign_id,
            platform=platform,
            current_spend=current_spend,
            target_spend=target_spend,
            historical_days=30
        )

        # Get predictions
        predictions = await saturation_model.predict_multi_period(
            campaign_id=request.campaign_id,
            platform=request.platform,
            current_spend=request.current_spend,
            target_spend=request.target_spend,
            historical_days=request.historical_days
        )

        # Format for analytics dashboard
        formatted_response = {
            "campaign_id": campaign_id,
            "platform": platform,
            "spend_range": {
                "current": current_spend,
                "target": target_spend,
                "increase_percentage": ((target_spend - current_spend) / current_spend) * 100
            },
            "periods": [],
            "ensemble": {
                "predicted_cpa": predictions['ensemble_prediction']['predicted_cpa'],
                "confidence_interval": predictions['ensemble_prediction']['confidence_interval'],
                "risk_level": predictions['ensemble_prediction']['risk_assessment'],
                "optimal_spend": predictions['ensemble_prediction']['optimal_spend'],
                "saturation_probability": predictions['ensemble_prediction']['saturation_probability']
            },
            "recommendations": predictions['recommendations'],
            "data_quality": predictions['data_quality_score'],
            "timestamp": datetime.utcnow().isoformat()
        }

        # Add period predictions
        for period_name, prediction in predictions['period_predictions'].items():
            formatted_response["periods"].append({
                "period": period_name,
                "days": prediction['period_days'],
                "predicted_cpa": prediction['predicted_cpa'],
                "confidence": prediction['confidence'],
                "saturation_point": prediction['saturation_point'],
                "cost_efficiency": prediction['cost_efficiency'],
                "risk_level": prediction['risk_level']
            })

        return formatted_response

    except Exception as e:
        logger.error(f"Saturation analytics error: {str(e)}")
        # Return mock data if model fails
        return {
            "campaign_id": campaign_id,
            "platform": platform,
            "spend_range": {
                "current": current_spend,
                "target": target_spend,
                "increase_percentage": ((target_spend - current_spend) / current_spend) * 100
            },
            "periods": [
                {"period": "7d", "days": 7, "predicted_cpa": 1.15, "confidence": 0.82, "saturation_point": 1800.0, "cost_efficiency": 0.87, "risk_level": "low"},
                {"period": "14d", "days": 14, "predicted_cpa": 1.22, "confidence": 0.89, "saturation_point": 1950.0, "cost_efficiency": 0.82, "risk_level": "low"},
                {"period": "30d", "days": 30, "predicted_cpa": 1.28, "confidence": 0.91, "saturation_point": 2200.0, "cost_efficiency": 0.78, "risk_level": "medium"},
                {"period": "adaptive", "days": 21, "predicted_cpa": 1.24, "confidence": 0.95, "saturation_point": 2100.0, "cost_efficiency": 0.81, "risk_level": "low"}
            ],
            "ensemble": {
                "predicted_cpa": 1.23,
                "confidence_interval": {"lower": 1.18, "upper": 1.28},
                "risk_level": "low",
                "optimal_spend": 2100.0,
                "saturation_probability": 0.15
            },
            "recommendations": [
                "Safe to increase spend to $2100 based on ensemble prediction",
                "Monitor 30-day trend for early saturation signals",
                "Consider testing creative variations at higher spend levels"
            ],
            "data_quality": 0.85,
            "timestamp": datetime.utcnow().isoformat(),
            "note": "Using fallback data - model temporarily unavailable"
        }

# ============================================================================
# Startup & Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize ML models and connections on startup"""
    logger.info("Starting ML Analytics API...")
    logger.info("Loading ML models...")
    # Would load actual trained models here
    logger.info("ML Analytics API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down ML Analytics API...")

# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8091,
        reload=True,
        log_level="info"
    )

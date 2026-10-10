"""
Attribution ML Service
UnMoGrowP Attribution Platform

FastAPI service providing:
- Multi-Touch Attribution Models (First Touch, Last Touch, Linear, Time Decay, Position-Based)
- Attribution Model Comparison
- Custom Attribution Logic
- Real-time Attribution Calculation

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
    FirstTouchAttributor,
    LastTouchAttributor,
    LinearAttributor,
    TimeDecayAttributor,
    PositionBasedAttributor
)

# Import schemas
from schemas import (
    AttributionRequest,
    AttributionResponse,
    TouchpointData,
    AttributionModelComparison
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="UnMoGrowP Attribution ML Service",
    description="Multi-Touch Attribution Models and Analysis",
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
attribution_calculations = Counter('attribution_calculations_total', 'Total attribution calculations', ['model'])
attribution_latency = Histogram('attribution_calculation_latency_seconds', 'Attribution calculation latency')
api_requests = Counter('api_requests_total', 'Total API requests', ['endpoint', 'method'])

# Initialize Attribution Models
first_touch_attributor = FirstTouchAttributor()
last_touch_attributor = LastTouchAttributor()
linear_attributor = LinearAttributor()
time_decay_attributor = TimeDecayAttributor()
position_based_attributor = PositionBasedAttributor()

# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "attribution-ml",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "models": {
            "first_touch": "loaded",
            "last_touch": "loaded",
            "linear": "loaded",
            "time_decay": "loaded",
            "position_based": "loaded"
        }
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# ============================================================================
# Attribution Endpoints
# ============================================================================

@app.post("/api/attribution/first-touch", response_model=AttributionResponse)
async def calculate_first_touch_attribution(request: AttributionRequest):
    """Calculate first-touch attribution"""
    api_requests.labels(endpoint='/attribution/first-touch', method='POST').inc()

    with attribution_latency.time():
        result = await first_touch_attributor.calculate(request)

    attribution_calculations.labels(model='first_touch').inc()
    return result

@app.post("/api/attribution/last-touch", response_model=AttributionResponse)
async def calculate_last_touch_attribution(request: AttributionRequest):
    """Calculate last-touch attribution"""
    api_requests.labels(endpoint='/attribution/last-touch', method='POST').inc()

    with attribution_latency.time():
        result = await last_touch_attributor.calculate(request)

    attribution_calculations.labels(model='last_touch').inc()
    return result

@app.post("/api/attribution/linear", response_model=AttributionResponse)
async def calculate_linear_attribution(request: AttributionRequest):
    """Calculate linear attribution"""
    api_requests.labels(endpoint='/attribution/linear', method='POST').inc()

    with attribution_latency.time():
        result = await linear_attributor.calculate(request)

    attribution_calculations.labels(model='linear').inc()
    return result

@app.post("/api/attribution/time-decay", response_model=AttributionResponse)
async def calculate_time_decay_attribution(request: AttributionRequest):
    """Calculate time-decay attribution"""
    api_requests.labels(endpoint='/attribution/time-decay', method='POST').inc()

    with attribution_latency.time():
        result = await time_decay_attributor.calculate(request)

    attribution_calculations.labels(model='time_decay').inc()
    return result

@app.post("/api/attribution/position-based", response_model=AttributionResponse)
async def calculate_position_based_attribution(request: AttributionRequest):
    """Calculate position-based attribution"""
    api_requests.labels(endpoint='/attribution/position-based', method='POST').inc()

    with attribution_latency.time():
        result = await position_based_attributor.calculate(request)

    attribution_calculations.labels(model='position_based').inc()
    return result

@app.post("/api/attribution/compare", response_model=AttributionModelComparison)
async def compare_attribution_models(request: AttributionRequest):
    """Compare all attribution models for the same data"""
    api_requests.labels(endpoint='/attribution/compare', method='POST').inc()

    results = {}

    with attribution_latency.time():
        results['first_touch'] = await first_touch_attributor.calculate(request)
        results['last_touch'] = await last_touch_attributor.calculate(request)
        results['linear'] = await linear_attributor.calculate(request)
        results['time_decay'] = await time_decay_attributor.calculate(request)
        results['position_based'] = await position_based_attributor.calculate(request)

    attribution_calculations.labels(model='comparison').inc()

    return AttributionModelComparison(
        conversion_id=request.conversion_id,
        models=results,
        total_conversion_value=request.conversion_value,
        comparison_timestamp=datetime.utcnow()
    )

# ============================================================================
# Startup & Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize attribution models on startup"""
    logger.info("Starting Attribution ML Service...")
    logger.info("Loading attribution models...")
    logger.info("Attribution ML Service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Attribution ML Service...")

# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8086,
        reload=True,
        log_level="info"
    )
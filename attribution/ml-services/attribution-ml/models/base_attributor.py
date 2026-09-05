"""
Base Attribution Model
UnMoGrowP Attribution Platform - Attribution ML Service

Base class for all attribution models.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime
from schemas.attribution import AttributionRequest, AttributionResponse, TouchpointData


class BaseAttributor(ABC):
    """Base class for all attribution models"""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def calculate(self, request: AttributionRequest) -> AttributionResponse:
        """Calculate attribution for given touchpoints"""
        pass

    def _create_response(self, request: AttributionRequest,
                        touchpoint_attributions: List[Dict[str, Any]],
                        metadata: Dict[str, Any] = None) -> AttributionResponse:
        """Create standardized attribution response"""
        total_attributed = sum(tp.get('attributed_value', 0) for tp in touchpoint_attributions)

        return AttributionResponse(
            conversion_id=request.conversion_id,
            user_id=request.user_id,
            attribution_model=self.name,
            touchpoint_attributions=touchpoint_attributions,
            total_attributed_value=total_attributed,
            calculation_timestamp=datetime.utcnow(),
            metadata=metadata or {}
        )

    def _filter_touchpoints_by_window(self, touchpoints: List[TouchpointData],
                                    conversion_timestamp: datetime,
                                    lookback_days: int) -> List[TouchpointData]:
        """Filter touchpoints within the lookback window"""
        from datetime import timedelta

        cutoff_time = conversion_timestamp - timedelta(days=lookback_days)
        return [
            tp for tp in touchpoints
            if tp.timestamp >= cutoff_time and tp.timestamp <= conversion_timestamp
        ]

    def _sort_touchpoints_by_time(self, touchpoints: List[TouchpointData]) -> List[TouchpointData]:
        """Sort touchpoints by timestamp"""
        return sorted(touchpoints, key=lambda tp: tp.timestamp)
"""
Linear Attribution Model
UnMoGrowP Attribution Platform - Attribution ML Service

Distributes conversion value equally across all touchpoints.
"""

from typing import List, Dict, Any
from .base_attributor import BaseAttributor
from schemas.attribution import AttributionRequest, AttributionResponse


class LinearAttributor(BaseAttributor):
    """Linear Attribution Model"""

    def __init__(self):
        super().__init__("linear")

    async def calculate(self, request: AttributionRequest) -> AttributionResponse:
        """Calculate linear attribution"""
        # Filter touchpoints within lookback window
        valid_touchpoints = self._filter_touchpoints_by_window(
            request.touchpoints,
            request.conversion_timestamp,
            request.lookback_window_days
        )

        if not valid_touchpoints:
            return self._create_response(
                request,
                [],
                {"reason": "No touchpoints within lookback window"}
            )

        # Sort by timestamp
        sorted_touchpoints = self._sort_touchpoints_by_time(valid_touchpoints)
        total_touchpoints = len(sorted_touchpoints)

        # Distribute value equally across all touchpoints
        value_per_touchpoint = request.conversion_value / total_touchpoints
        percentage_per_touchpoint = 100.0 / total_touchpoints

        touchpoint_attributions = []
        for i, touchpoint in enumerate(sorted_touchpoints, 1):
            touchpoint_attributions.append({
                "touchpoint_id": touchpoint.touchpoint_id,
                "timestamp": touchpoint.timestamp,
                "channel": touchpoint.channel,
                "source": touchpoint.source,
                "medium": touchpoint.medium,
                "campaign_id": touchpoint.campaign_id,
                "attributed_value": value_per_touchpoint,
                "attribution_percentage": percentage_per_touchpoint,
                "position": i,
                "total_touchpoints": total_touchpoints
            })

        metadata = {
            "total_touchpoints_in_window": total_touchpoints,
            "lookback_window_days": request.lookback_window_days,
            "attribution_logic": f"Equal distribution across {total_touchpoints} touchpoints",
            "value_per_touchpoint": value_per_touchpoint
        }

        return self._create_response(request, touchpoint_attributions, metadata)
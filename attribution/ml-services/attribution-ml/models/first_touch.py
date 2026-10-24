"""
First Touch Attribution Model
UnMoGrowP Attribution Platform - Attribution ML Service

Attributes 100% of conversion value to the first touchpoint.
"""

from typing import List, Dict, Any
from .base_attributor import BaseAttributor
from schemas.attribution import AttributionRequest, AttributionResponse


class FirstTouchAttributor(BaseAttributor):
    """First Touch Attribution Model"""

    def __init__(self):
        super().__init__("first_touch")

    async def calculate(self, request: AttributionRequest) -> AttributionResponse:
        """Calculate first-touch attribution"""
        # Filter touchpoints within lookback window
        valid_touchpoints = self._filter_touchpoints_by_window(
            request.touchpoints,
            request.conversion_timestamp,
            request.lookback_window_days
        )

        if not valid_touchpoints:
            # No touchpoints in window
            return self._create_response(
                request,
                [],
                {"reason": "No touchpoints within lookback window"}
            )

        # Sort by timestamp
        sorted_touchpoints = self._sort_touchpoints_by_time(valid_touchpoints)

        # Attribute 100% to first touchpoint
        first_touchpoint = sorted_touchpoints[0]
        touchpoint_attributions = [{
            "touchpoint_id": first_touchpoint.touchpoint_id,
            "timestamp": first_touchpoint.timestamp,
            "channel": first_touchpoint.channel,
            "source": first_touchpoint.source,
            "medium": first_touchpoint.medium,
            "campaign_id": first_touchpoint.campaign_id,
            "attributed_value": request.conversion_value,
            "attribution_percentage": 100.0,
            "position": 1,
            "total_touchpoints": len(sorted_touchpoints)
        }]

        metadata = {
            "total_touchpoints_in_window": len(sorted_touchpoints),
            "lookback_window_days": request.lookback_window_days,
            "attribution_logic": "100% to first touchpoint"
        }

        return self._create_response(request, touchpoint_attributions, metadata)
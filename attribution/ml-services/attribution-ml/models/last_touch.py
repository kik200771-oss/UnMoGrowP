"""
Last Touch Attribution Model
UnMoGrowP Attribution Platform - Attribution ML Service

Attributes 100% of conversion value to the last touchpoint.
"""

from typing import List, Dict, Any
from .base_attributor import BaseAttributor
from schemas.attribution import AttributionRequest, AttributionResponse


class LastTouchAttributor(BaseAttributor):
    """Last Touch Attribution Model"""

    def __init__(self):
        super().__init__("last_touch")

    async def calculate(self, request: AttributionRequest) -> AttributionResponse:
        """Calculate last-touch attribution"""
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

        # Attribute 100% to last touchpoint
        last_touchpoint = sorted_touchpoints[-1]
        touchpoint_attributions = [{
            "touchpoint_id": last_touchpoint.touchpoint_id,
            "timestamp": last_touchpoint.timestamp,
            "channel": last_touchpoint.channel,
            "source": last_touchpoint.source,
            "medium": last_touchpoint.medium,
            "campaign_id": last_touchpoint.campaign_id,
            "attributed_value": request.conversion_value,
            "attribution_percentage": 100.0,
            "position": len(sorted_touchpoints),
            "total_touchpoints": len(sorted_touchpoints)
        }]

        metadata = {
            "total_touchpoints_in_window": len(sorted_touchpoints),
            "lookback_window_days": request.lookback_window_days,
            "attribution_logic": "100% to last touchpoint"
        }

        return self._create_response(request, touchpoint_attributions, metadata)
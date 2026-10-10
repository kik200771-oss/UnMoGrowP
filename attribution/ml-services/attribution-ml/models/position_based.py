"""
Position-Based Attribution Model
UnMoGrowP Attribution Platform - Attribution ML Service

Attributes 40% to first touchpoint, 40% to last touchpoint,
and distributes remaining 20% equally among middle touchpoints.
"""

from typing import List, Dict, Any
from .base_attributor import BaseAttributor
from schemas.attribution import AttributionRequest, AttributionResponse


class PositionBasedAttributor(BaseAttributor):
    """Position-Based Attribution Model (U-shaped)"""

    def __init__(self, first_touch_weight: float = 0.4, last_touch_weight: float = 0.4):
        super().__init__("position_based")
        self.first_touch_weight = first_touch_weight
        self.last_touch_weight = last_touch_weight
        self.middle_touch_weight = 1.0 - first_touch_weight - last_touch_weight

    async def calculate(self, request: AttributionRequest) -> AttributionResponse:
        """Calculate position-based attribution"""
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

        touchpoint_attributions = []

        if total_touchpoints == 1:
            # Single touchpoint gets 100%
            touchpoint = sorted_touchpoints[0]
            touchpoint_attributions.append({
                "touchpoint_id": touchpoint.touchpoint_id,
                "timestamp": touchpoint.timestamp,
                "channel": touchpoint.channel,
                "source": touchpoint.source,
                "medium": touchpoint.medium,
                "campaign_id": touchpoint.campaign_id,
                "attributed_value": request.conversion_value,
                "attribution_percentage": 100.0,
                "position": 1,
                "total_touchpoints": 1,
                "position_type": "only"
            })

        elif total_touchpoints == 2:
            # First touchpoint gets first_touch_weight, last gets last_touch_weight
            for i, touchpoint in enumerate(sorted_touchpoints):
                if i == 0:
                    weight = self.first_touch_weight
                    position_type = "first"
                else:
                    weight = self.last_touch_weight
                    position_type = "last"

                attributed_value = request.conversion_value * weight
                attribution_percentage = weight * 100.0

                touchpoint_attributions.append({
                    "touchpoint_id": touchpoint.touchpoint_id,
                    "timestamp": touchpoint.timestamp,
                    "channel": touchpoint.channel,
                    "source": touchpoint.source,
                    "medium": touchpoint.medium,
                    "campaign_id": touchpoint.campaign_id,
                    "attributed_value": attributed_value,
                    "attribution_percentage": attribution_percentage,
                    "position": i + 1,
                    "total_touchpoints": total_touchpoints,
                    "position_type": position_type,
                    "weight": weight
                })

        else:
            # Multiple touchpoints: first 40%, last 40%, middle 20% distributed
            middle_touchpoints = total_touchpoints - 2
            weight_per_middle = self.middle_touch_weight / middle_touchpoints if middle_touchpoints > 0 else 0

            for i, touchpoint in enumerate(sorted_touchpoints):
                if i == 0:
                    weight = self.first_touch_weight
                    position_type = "first"
                elif i == total_touchpoints - 1:
                    weight = self.last_touch_weight
                    position_type = "last"
                else:
                    weight = weight_per_middle
                    position_type = "middle"

                attributed_value = request.conversion_value * weight
                attribution_percentage = weight * 100.0

                touchpoint_attributions.append({
                    "touchpoint_id": touchpoint.touchpoint_id,
                    "timestamp": touchpoint.timestamp,
                    "channel": touchpoint.channel,
                    "source": touchpoint.source,
                    "medium": touchpoint.medium,
                    "campaign_id": touchpoint.campaign_id,
                    "attributed_value": attributed_value,
                    "attribution_percentage": attribution_percentage,
                    "position": i + 1,
                    "total_touchpoints": total_touchpoints,
                    "position_type": position_type,
                    "weight": weight
                })

        metadata = {
            "total_touchpoints_in_window": total_touchpoints,
            "lookback_window_days": request.lookback_window_days,
            "attribution_logic": f"Position-based: {self.first_touch_weight*100}% first, {self.last_touch_weight*100}% last, {self.middle_touch_weight*100}% middle",
            "first_touch_weight": self.first_touch_weight,
            "last_touch_weight": self.last_touch_weight,
            "middle_touch_weight": self.middle_touch_weight
        }

        return self._create_response(request, touchpoint_attributions, metadata)
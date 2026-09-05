"""
Time Decay Attribution Model
UnMoGrowP Attribution Platform - Attribution ML Service

Gives more credit to touchpoints closer to conversion time using exponential decay.
"""

import math
from typing import List, Dict, Any
from datetime import datetime, timedelta
from .base_attributor import BaseAttributor
from schemas.attribution import AttributionRequest, AttributionResponse


class TimeDecayAttributor(BaseAttributor):
    """Time Decay Attribution Model"""

    def __init__(self, half_life_days: float = 7.0):
        super().__init__("time_decay")
        self.half_life_days = half_life_days

    async def calculate(self, request: AttributionRequest) -> AttributionResponse:
        """Calculate time-decay attribution"""
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

        # Calculate weights using exponential decay
        weights = []
        total_weight = 0

        for touchpoint in sorted_touchpoints:
            days_before_conversion = (
                request.conversion_timestamp - touchpoint.timestamp
            ).total_seconds() / (24 * 3600)

            # Exponential decay formula: weight = e^(-λt) where λ = ln(2)/half_life
            decay_constant = math.log(2) / self.half_life_days
            weight = math.exp(-decay_constant * days_before_conversion)

            weights.append(weight)
            total_weight += weight

        # Normalize weights and calculate attributions
        touchpoint_attributions = []
        for i, (touchpoint, weight) in enumerate(zip(sorted_touchpoints, weights), 1):
            normalized_weight = weight / total_weight
            attributed_value = request.conversion_value * normalized_weight
            attribution_percentage = normalized_weight * 100.0

            days_before_conversion = (
                request.conversion_timestamp - touchpoint.timestamp
            ).total_seconds() / (24 * 3600)

            touchpoint_attributions.append({
                "touchpoint_id": touchpoint.touchpoint_id,
                "timestamp": touchpoint.timestamp,
                "channel": touchpoint.channel,
                "source": touchpoint.source,
                "medium": touchpoint.medium,
                "campaign_id": touchpoint.campaign_id,
                "attributed_value": attributed_value,
                "attribution_percentage": attribution_percentage,
                "position": i,
                "total_touchpoints": len(sorted_touchpoints),
                "days_before_conversion": round(days_before_conversion, 2),
                "decay_weight": round(weight, 4),
                "normalized_weight": round(normalized_weight, 4)
            })

        metadata = {
            "total_touchpoints_in_window": len(sorted_touchpoints),
            "lookback_window_days": request.lookback_window_days,
            "attribution_logic": f"Exponential decay with {self.half_life_days}-day half-life",
            "half_life_days": self.half_life_days,
            "total_weight": round(total_weight, 4)
        }

        return self._create_response(request, touchpoint_attributions, metadata)
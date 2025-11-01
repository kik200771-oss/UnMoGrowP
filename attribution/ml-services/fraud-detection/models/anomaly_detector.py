"""
Anomaly Detection Model
UnMoGrowP Attribution Platform - Fraud Detection Service

ML model for detecting behavioral anomalies and unusual patterns.
"""

import asyncio
from typing import List, Dict, Any
from schemas.fraud import AnomalyDetectionRequest, AnomalyDetectionResponse


class AnomalyDetector:
    """Behavioral Anomaly Detection Model"""

    def __init__(self):
        self.model = None  # Would load trained anomaly detection model (Isolation Forest, etc.)
        self.anomaly_types = [
            'spending_pattern', 'frequency_pattern', 'location_pattern',
            'device_pattern', 'time_pattern', 'merchant_pattern'
        ]
        self.severity_thresholds = {
            'low': 0.3,
            'medium': 0.6,
            'high': 0.8,
            'critical': 1.0
        }

    async def detect(self, request: AnomalyDetectionRequest) -> AnomalyDetectionResponse:
        """Detect behavioral anomalies"""
        # Mock anomaly detection - replace with actual model inference
        detected_anomalies = []

        # Simulate different types of anomalies
        behavior_data = request.behavior_data

        # Check spending patterns
        if behavior_data.get('avg_transaction_amount', 0) > behavior_data.get('historical_avg', 0) * 3:
            detected_anomalies.append({
                "type": "spending_pattern",
                "description": "Unusually high transaction amounts",
                "severity": 0.7,
                "confidence": 0.85,
                "details": {
                    "current_avg": behavior_data.get('avg_transaction_amount', 0),
                    "historical_avg": behavior_data.get('historical_avg', 0),
                    "deviation_factor": 3.2
                }
            })

        # Check frequency patterns
        transaction_count = behavior_data.get('transaction_count_24h', 0)
        if transaction_count > 20:
            detected_anomalies.append({
                "type": "frequency_pattern",
                "description": "Unusually high transaction frequency",
                "severity": 0.6,
                "confidence": 0.90,
                "details": {
                    "transaction_count_24h": transaction_count,
                    "normal_range": "1-10",
                    "time_window": "24h"
                }
            })

        # Check location patterns
        if behavior_data.get('new_location_transactions', 0) > 0:
            detected_anomalies.append({
                "type": "location_pattern",
                "description": "Transactions from new geographic locations",
                "severity": 0.5,
                "confidence": 0.75,
                "details": {
                    "new_locations": behavior_data.get('new_locations', []),
                    "distance_from_usual": behavior_data.get('location_distance_km', 0)
                }
            })

        # Calculate overall anomaly score
        if detected_anomalies:
            anomaly_score = max(anomaly['severity'] for anomaly in detected_anomalies)
        else:
            anomaly_score = 0.1  # Low baseline anomaly score

        severity_level = self._determine_severity_level(anomaly_score)
        recommended_actions = self._generate_recommendations(severity_level, detected_anomalies)

        return AnomalyDetectionResponse(
            user_id=request.user_id,
            anomalies_detected=detected_anomalies,
            anomaly_score=anomaly_score,
            severity_level=severity_level,
            recommended_actions=recommended_actions
        )

    def load_model(self, model_path: str = None):
        """Load trained anomaly detection model"""
        # TODO: Implement actual model loading
        # from sklearn.ensemble import IsolationForest
        # self.model = joblib.load(model_path)
        pass

    def _determine_severity_level(self, anomaly_score: float) -> str:
        """Determine severity level based on anomaly score"""
        if anomaly_score >= self.severity_thresholds['high']:
            return "critical"
        elif anomaly_score >= self.severity_thresholds['medium']:
            return "high"
        elif anomaly_score >= self.severity_thresholds['low']:
            return "medium"
        else:
            return "low"

    def _generate_recommendations(self, severity_level: str,
                                anomalies: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations based on detected anomalies"""
        recommendations = []

        if severity_level == "critical":
            recommendations.extend([
                "Immediately suspend account pending review",
                "Require identity verification",
                "Contact user via verified communication channels",
                "Escalate to fraud investigation team"
            ])
        elif severity_level == "high":
            recommendations.extend([
                "Require additional authentication for transactions",
                "Implement transaction limits",
                "Monitor account activity closely",
                "Send security alert to user"
            ])
        elif severity_level == "medium":
            recommendations.extend([
                "Send security notification to user",
                "Increase monitoring frequency",
                "Request transaction confirmation",
                "Log for pattern analysis"
            ])
        else:
            recommendations.extend([
                "Continue normal monitoring",
                "Log behavior for baseline updates"
            ])

        # Add specific recommendations based on anomaly types
        anomaly_types = [anomaly['type'] for anomaly in anomalies]

        if 'location_pattern' in anomaly_types:
            recommendations.append("Verify location with user")

        if 'spending_pattern' in anomaly_types:
            recommendations.append("Review spending patterns with user")

        if 'frequency_pattern' in anomaly_types:
            recommendations.append("Implement velocity controls")

        return recommendations

    def preprocess_behavior_data(self, raw_data: Dict[str, Any]) -> Dict[str, float]:
        """Preprocess behavior data for anomaly detection"""
        features = {}

        # Extract and normalize features
        features['transaction_frequency'] = raw_data.get('transaction_count_24h', 0) / 24.0
        features['amount_variance'] = raw_data.get('amount_std', 0) / max(raw_data.get('amount_mean', 1), 1)
        features['time_variance'] = raw_data.get('time_pattern_score', 0.5)
        features['location_variance'] = len(raw_data.get('unique_locations', [])) / 10.0

        return features
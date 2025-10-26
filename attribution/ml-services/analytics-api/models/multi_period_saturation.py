"""
Multi-Period Saturation Model - Enhanced CPA/Traffic Cost Prediction
UnMoGrowP Attribution Platform

Модель работает с 4 временными периодами:
1. Last 7 days - краткосрочные тренды
2. Last 14 days - среднесрочные тренды
3. Last 30 days - месячные тренды
4. Adaptive period - оптимальный период для конкретной кампании

Каждый период дает свой прогноз, пользователь видит все 4 варианта + ensemble.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from scipy.optimize import curve_fit
import xgboost as xgb
from sklearn.metrics import mean_absolute_percentage_error
import logging

logger = logging.getLogger(__name__)

@dataclass
class SaturationPrediction:
    """Результат прогноза для одного периода"""
    period_name: str
    period_days: int
    data_points: int
    confidence: float  # 0-1

    # Curve parameters
    max_cpa: float
    steepness: float
    inflection_point: float

    # Прогнозы для разных spend levels
    spend_trajectory: List[Dict]

    # Метрики качества
    mape: float
    r_squared: float
    fit_quality: str  # 'excellent', 'good', 'fair', 'poor'

    # Рекомендации
    optimal_spend: float
    saturation_warning: Optional[str]

@dataclass
class EnsemblePrediction:
    """Финальный ensemble прогноз"""
    consensus_trajectory: List[Dict]
    confidence_intervals: List[Dict]

    # Веса каждого периода в ensemble
    period_weights: Dict[str, float]

    # Ensemble метрики
    ensemble_confidence: float
    prediction_variance: float

    # Финальные рекомендации
    recommended_spend: float
    risk_level: str  # 'low', 'medium', 'high'

class MultiPeriodSaturationModel:
    """
    Enhanced Saturation Model с 4 временными периодами
    """

    def __init__(self):
        self.periods = {
            'short_term': 7,    # Последние 7 дней
            'medium_term': 14,  # Последние 14 дней
            'long_term': 30,    # Последние 30 дней
            'adaptive': None    # Адаптивно выбирается
        }

        # XGBoost для refinement каждого периода
        self.refinement_models = {}
        for period in self.periods.keys():
            self.refinement_models[period] = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42
            )

        # Ensemble meta-model
        self.ensemble_model = xgb.XGBRegressor(
            n_estimators=50,
            max_depth=4,
            learning_rate=0.2,
            random_state=42
        )

        self.min_data_points = 5  # Минимум точек для анализа

    def predict_multi_period(self, campaign_id: str, target_spends: List[float]) -> Dict:
        """
        Главная функция: прогноз на основе всех 4 периодов

        Returns:
        {
            'predictions_by_period': {
                'short_term': SaturationPrediction,
                'medium_term': SaturationPrediction,
                'long_term': SaturationPrediction,
                'adaptive': SaturationPrediction
            },
            'ensemble': EnsemblePrediction,
            'metadata': {...}
        }
        """

        logger.info(f"Starting multi-period prediction for campaign {campaign_id}")

        results = {
            'campaign_id': campaign_id,
            'prediction_timestamp': datetime.now().isoformat(),
            'target_spends': target_spends,
            'predictions_by_period': {},
            'ensemble': None,
            'metadata': {}
        }

        # 1. Получаем исторические данные
        historical_data = self._get_historical_data(campaign_id)

        if len(historical_data) < self.min_data_points:
            logger.warning(f"Insufficient data for campaign {campaign_id}: {len(historical_data)} points")
            return self._insufficient_data_response(campaign_id, target_spends)

        # 2. Прогноз для каждого периода
        period_predictions = {}

        for period_name, period_days in self.periods.items():
            if period_name == 'adaptive':
                # Адаптивный период выбирается отдельно
                optimal_days = self._find_optimal_period(historical_data, campaign_id)
                period_data = self._filter_by_period(historical_data, optimal_days)
                period_days = optimal_days
            else:
                period_data = self._filter_by_period(historical_data, period_days)

            if len(period_data) >= self.min_data_points:
                prediction = self._predict_single_period(
                    period_data,
                    period_name,
                    period_days,
                    target_spends,
                    campaign_id
                )
                period_predictions[period_name] = prediction
            else:
                logger.warning(f"Insufficient data for {period_name} period: {len(period_data)} points")

        results['predictions_by_period'] = period_predictions

        # 3. Создаем ensemble прогноз
        if len(period_predictions) >= 2:
            ensemble = self._create_ensemble(period_predictions, target_spends)
            results['ensemble'] = ensemble

        # 4. Добавляем метаданные
        results['metadata'] = self._generate_metadata(historical_data, period_predictions)

        logger.info(f"Multi-period prediction completed for campaign {campaign_id}")
        return results

    def _predict_single_period(self, data: pd.DataFrame, period_name: str,
                             period_days: int, target_spends: List[float],
                             campaign_id: str) -> SaturationPrediction:
        """Прогноз для одного временного периода"""

        logger.debug(f"Predicting for {period_name} period ({period_days} days, {len(data)} points)")

        # 1. Подготовка данных
        spend_values = data['ad_spend'].values
        cpi_values = data['cost_per_install'].values

        # 2. Fit logistic curve: CPI = L / (1 + exp(-k * (spend - x0)))
        try:
            curve_params = self._fit_logistic_curve(spend_values, cpi_values)
            max_cpa, steepness, inflection_point = curve_params
        except Exception as e:
            logger.warning(f"Curve fitting failed for {period_name}: {e}")
            # Fallback to linear trend
            max_cpa, steepness, inflection_point = self._fit_linear_fallback(spend_values, cpi_values)

        # 3. ML refinement с контекстными факторами
        contextual_features = self._extract_contextual_features(data, campaign_id)
        base_predictions = [self._logistic_function(spend, max_cpa, steepness, inflection_point)
                          for spend in target_spends]

        # XGBoost коррекция
        if period_name in self.refinement_models and len(data) > 10:
            ml_adjustments = self._apply_ml_refinement(
                contextual_features, period_name, target_spends
            )
            refined_predictions = [base * (1 + adj) for base, adj in zip(base_predictions, ml_adjustments)]
        else:
            refined_predictions = base_predictions
            ml_adjustments = [0.0] * len(target_spends)

        # 4. Рассчитываем метрики качества
        predicted_cpi = [self._logistic_function(spend, max_cpa, steepness, inflection_point)
                        for spend in spend_values]
        mape = mean_absolute_percentage_error(cpi_values, predicted_cpi)
        r_squared = self._calculate_r_squared(cpi_values, predicted_cpi)

        # 5. Определяем качество fit
        fit_quality = self._assess_fit_quality(mape, r_squared, len(data))

        # 6. Формируем trajectory
        spend_trajectory = []
        for i, spend in enumerate(target_spends):
            # Рассчитываем дополнительные метрики
            saturation_level = self._calculate_saturation_level(spend, max_cpa, steepness, inflection_point)

            spend_trajectory.append({
                'spend': spend,
                'predicted_cpi': refined_predictions[i],
                'base_prediction': base_predictions[i],
                'ml_adjustment': ml_adjustments[i],
                'saturation_level': saturation_level,
                'efficiency_rating': self._rate_efficiency(saturation_level),
                'risk_level': self._assess_risk(saturation_level, refined_predictions[i])
            })

        # 7. Находим оптимальный spend
        optimal_spend = self._find_optimal_spend(spend_trajectory)

        # 8. Генерируем предупреждения
        saturation_warning = self._generate_saturation_warning(spend_trajectory, period_name)

        # 9. Рассчитываем confidence
        confidence = self._calculate_confidence(mape, r_squared, len(data), period_days)

        return SaturationPrediction(
            period_name=period_name,
            period_days=period_days,
            data_points=len(data),
            confidence=confidence,
            max_cpa=max_cpa,
            steepness=steepness,
            inflection_point=inflection_point,
            spend_trajectory=spend_trajectory,
            mape=mape,
            r_squared=r_squared,
            fit_quality=fit_quality,
            optimal_spend=optimal_spend,
            saturation_warning=saturation_warning
        )

    def _find_optimal_period(self, historical_data: pd.DataFrame, campaign_id: str) -> int:
        """
        Адаптивный выбор оптимального периода для анализа

        Критерии:
        - Статистическая значимость (достаточно данных)
        - Стабильность тренда (не слишком волатильно)
        - Свежесть данных (не слишком старые)
        - Качество fit (лучший R²)
        """

        candidate_periods = [7, 14, 21, 30, 45, 60, 90]
        period_scores = {}

        for days in candidate_periods:
            period_data = self._filter_by_period(historical_data, days)

            if len(period_data) < self.min_data_points:
                continue

            # Критерий 1: Количество данных (нормализовано)
            data_score = min(len(period_data) / 20, 1.0)  # Optimal 20+ points

            # Критерий 2: Стабильность тренда
            stability_score = self._calculate_trend_stability(period_data)

            # Критерий 3: Свежесть (предпочитаем более свежие данные)
            freshness_score = 1.0 / (1 + days / 30)  # Decay с 30-дневным половинным периодом

            # Критерий 4: Качество fit
            try:
                spend_values = period_data['ad_spend'].values
                cpi_values = period_data['cost_per_install'].values
                curve_params = self._fit_logistic_curve(spend_values, cpi_values)

                predicted_cpi = [self._logistic_function(spend, *curve_params) for spend in spend_values]
                r_squared = self._calculate_r_squared(cpi_values, predicted_cpi)
                fit_score = max(r_squared, 0)
            except:
                fit_score = 0

            # Комбинированный score
            total_score = (
                data_score * 0.25 +
                stability_score * 0.25 +
                freshness_score * 0.25 +
                fit_score * 0.25
            )

            period_scores[days] = {
                'total_score': total_score,
                'data_score': data_score,
                'stability_score': stability_score,
                'freshness_score': freshness_score,
                'fit_score': fit_score,
                'data_points': len(period_data)
            }

        if not period_scores:
            logger.warning(f"No valid periods found for campaign {campaign_id}, defaulting to 14 days")
            return 14

        # Выбираем период с лучшим score
        optimal_period = max(period_scores.keys(), key=lambda x: period_scores[x]['total_score'])

        logger.info(f"Adaptive period for campaign {campaign_id}: {optimal_period} days "
                   f"(score: {period_scores[optimal_period]['total_score']:.3f})")

        return optimal_period

    def _create_ensemble(self, period_predictions: Dict[str, SaturationPrediction],
                        target_spends: List[float]) -> EnsemblePrediction:
        """
        Создает ensemble прогноз из всех периодов

        Использует weighted voting на основе:
        - Confidence каждого периода
        - Качества fit (R²)
        - Количества данных
        - Стабильности предсказаний
        """

        logger.debug("Creating ensemble prediction from period predictions")

        # 1. Рассчитываем веса для каждого периода
        period_weights = {}
        total_weight = 0

        for period_name, prediction in period_predictions.items():
            # Вес = confidence * качество_fit * log(data_points)
            weight = (
                prediction.confidence * 0.4 +
                prediction.r_squared * 0.3 +
                min(np.log10(prediction.data_points) / 2, 1.0) * 0.2 +
                (1 if prediction.fit_quality in ['excellent', 'good'] else 0.5) * 0.1
            )

            period_weights[period_name] = weight
            total_weight += weight

        # Нормализуем веса
        for period_name in period_weights:
            period_weights[period_name] /= total_weight

        logger.info(f"Ensemble weights: {period_weights}")

        # 2. Создаем weighted consensus trajectory
        consensus_trajectory = []
        confidence_intervals = []

        for i, spend in enumerate(target_spends):
            # Собираем все предсказания для этого spend level
            predictions = []
            weights = []

            for period_name, prediction in period_predictions.items():
                pred_cpi = prediction.spend_trajectory[i]['predicted_cpi']
                predictions.append(pred_cpi)
                weights.append(period_weights[period_name])

            # Weighted average
            consensus_cpi = np.average(predictions, weights=weights)

            # Confidence interval (weighted std)
            variance = np.average((np.array(predictions) - consensus_cpi) ** 2, weights=weights)
            std_dev = np.sqrt(variance)

            # Рассчитываем saturation level для consensus
            # Используем среднее из всех saturation levels
            saturation_levels = [pred.spend_trajectory[i]['saturation_level']
                               for pred in period_predictions.values()]
            consensus_saturation = np.mean(saturation_levels)

            consensus_trajectory.append({
                'spend': spend,
                'predicted_cpi': consensus_cpi,
                'saturation_level': consensus_saturation,
                'efficiency_rating': self._rate_efficiency(consensus_saturation),
                'individual_predictions': {
                    period: pred.spend_trajectory[i]['predicted_cpi']
                    for period, pred in period_predictions.items()
                }
            })

            confidence_intervals.append({
                'spend': spend,
                'lower_bound': consensus_cpi - 1.96 * std_dev,
                'upper_bound': consensus_cpi + 1.96 * std_dev,
                'std_deviation': std_dev,
                'variance': variance
            })

        # 3. Общие метрики ensemble
        ensemble_confidence = np.mean([pred.confidence for pred in period_predictions.values()])
        prediction_variance = np.mean([ci['variance'] for ci in confidence_intervals])

        # 4. Финальные рекомендации
        recommended_spend = self._find_optimal_spend(consensus_trajectory)
        risk_level = self._assess_ensemble_risk(consensus_trajectory, confidence_intervals)

        return EnsemblePrediction(
            consensus_trajectory=consensus_trajectory,
            confidence_intervals=confidence_intervals,
            period_weights=period_weights,
            ensemble_confidence=ensemble_confidence,
            prediction_variance=prediction_variance,
            recommended_spend=recommended_spend,
            risk_level=risk_level
        )

    # === UTILITY METHODS ===

    def _get_historical_data(self, campaign_id: str) -> pd.DataFrame:
        """Получает исторические данные кампании из ClickHouse"""
        # В продакшене здесь будет SQL запрос к campaign_performance таблице
        # Для демонстрации создаем synthetic данные

        # Generate synthetic historical data for demo
        np.random.seed(42)  # For reproducible results

        # Create 90 days of historical data
        dates = pd.date_range(
            end=datetime.now().date(),
            periods=90,
            freq='D'
        )

        # Simulate realistic campaign performance data
        base_spend = 5000
        spend_variance = 2000

        data = []
        for i, date in enumerate(dates):
            # Simulate spend with weekly patterns and growth trend
            weekly_multiplier = 1.0 + 0.2 * np.sin(2 * np.pi * i / 7)  # Weekly pattern
            growth_trend = 1.0 + 0.001 * i  # Slight growth over time
            noise = np.random.normal(0, 0.1)

            daily_spend = base_spend * weekly_multiplier * growth_trend * (1 + noise)
            daily_spend = max(daily_spend, 1000)  # Minimum spend

            # Simulate CPI with saturation curve (logistic)
            # CPI increases as spend increases (diminishing returns)
            normalized_spend = (daily_spend - 1000) / 10000
            base_cpi = 2.5 + 3.0 / (1 + np.exp(-5 * (normalized_spend - 0.5)))
            cpi_noise = np.random.normal(0, 0.2)
            daily_cpi = max(base_cpi + cpi_noise, 1.0)

            # Calculate installs and cost
            daily_cost = daily_spend
            daily_installs = int(daily_cost / daily_cpi)
            actual_cpi = daily_cost / daily_installs if daily_installs > 0 else daily_cpi

            data.append({
                'date': date,
                'campaign_id': campaign_id,
                'ad_spend': daily_spend,
                'cost_per_install': actual_cpi,
                'installs': daily_installs,
                'cost': daily_cost,
                'impressions': daily_installs * 10,  # Rough conversion rate
                'clicks': daily_installs * 2
            })

        df = pd.DataFrame(data)
        logger.info(f"Generated {len(df)} days of synthetic data for campaign {campaign_id}")

        return df

    def _filter_by_period(self, data: pd.DataFrame, days: int) -> pd.DataFrame:
        """Фильтрует данные по последним N дням"""
        cutoff_date = datetime.now() - timedelta(days=days)
        return data[data['date'] >= cutoff_date]

    def _fit_logistic_curve(self, spend_values: np.ndarray, cpi_values: np.ndarray) -> Tuple[float, float, float]:
        """Fit logistic curve: CPI = L / (1 + exp(-k * (spend - x0)))"""

        def logistic(x, L, k, x0):
            return L / (1 + np.exp(-k * (x - x0)))

        # Initial parameter estimates
        L_init = np.max(cpi_values) * 1.5  # Max CPI estimate
        k_init = 1 / np.std(spend_values)   # Steepness
        x0_init = np.mean(spend_values)     # Inflection point

        # Fit curve
        popt, _ = curve_fit(
            logistic,
            spend_values,
            cpi_values,
            p0=[L_init, k_init, x0_init],
            bounds=([0, 0, 0], [np.inf, np.inf, np.inf]),
            maxfev=1000
        )

        return popt

    def _logistic_function(self, x: float, L: float, k: float, x0: float) -> float:
        """Logistic function"""
        return L / (1 + np.exp(-k * (x - x0)))

    def _calculate_saturation_level(self, spend: float, max_cpa: float, steepness: float, inflection_point: float) -> float:
        """Рассчитывает уровень насыщения (0-1)"""
        current_cpa = self._logistic_function(spend, max_cpa, steepness, inflection_point)
        return current_cpa / max_cpa

    def _rate_efficiency(self, saturation_level: float) -> str:
        """Оценка эффективности spend level"""
        if saturation_level < 0.3:
            return "highly_efficient"
        elif saturation_level < 0.6:
            return "efficient"
        elif saturation_level < 0.8:
            return "moderate"
        else:
            return "inefficient"

    def _find_optimal_spend(self, trajectory: List[Dict]) -> float:
        """Находит оптимальный spend (лучший ROI point)"""
        # Ищем точку где efficiency еще good, но близко к снижению
        for item in trajectory:
            if item['saturation_level'] > 0.65:  # Before heavy saturation
                return item['spend']

        # Если не нашли, возвращаем последний efficient
        return trajectory[-1]['spend'] if trajectory else 0

    def _calculate_confidence(self, mape: float, r_squared: float, data_points: int, period_days: int) -> float:
        """Рассчитывает confidence score (0-1)"""

        # Базовый confidence на основе метрик качества
        mape_score = max(0, 1 - mape / 50)  # MAPE 0% = 1.0, 50% = 0.0
        r2_score = max(0, r_squared)

        # Бонус за количество данных
        data_bonus = min(data_points / 15, 1.0)  # Optimal 15+ points

        # Penalty за слишком короткий период (менее стабильный)
        period_penalty = 1.0 if period_days >= 14 else 0.8

        confidence = (mape_score * 0.4 + r2_score * 0.4 + data_bonus * 0.2) * period_penalty

        return min(max(confidence, 0.1), 1.0)  # Clip между 0.1 и 1.0

    def _insufficient_data_response(self, campaign_id: str, target_spends: List[float]) -> Dict:
        """Возвращает ответ при недостаточных данных"""
        return {
            'campaign_id': campaign_id,
            'prediction_timestamp': datetime.now().isoformat(),
            'target_spends': target_spends,
            'predictions_by_period': {},
            'ensemble': None,
            'metadata': {
                'error': 'insufficient_data',
                'message': f'Insufficient historical data for campaign {campaign_id}',
                'min_required_points': self.min_data_points
            }
        }

    def _generate_metadata(self, historical_data: pd.DataFrame, period_predictions: Dict) -> Dict:
        """Генерирует метаданные анализа"""
        return {
            'total_data_points': len(historical_data),
            'data_date_range': {
                'start': historical_data['date'].min().isoformat(),
                'end': historical_data['date'].max().isoformat(),
                'span_days': (historical_data['date'].max() - historical_data['date'].min()).days
            },
            'periods_analyzed': list(period_predictions.keys()),
            'model_version': '2.0.0',
            'analysis_timestamp': datetime.now().isoformat()
        }

    def _fit_linear_fallback(self, spend_values: np.ndarray, cpi_values: np.ndarray) -> Tuple[float, float, float]:
        """Fallback к линейной модели когда logistic curve не работает"""
        # Simple linear regression
        slope = np.corrcoef(spend_values, cpi_values)[0, 1] * np.std(cpi_values) / np.std(spend_values)
        intercept = np.mean(cpi_values) - slope * np.mean(spend_values)

        # Convert to logistic parameters
        max_cpa = max(cpi_values) * 1.5
        steepness = 0.0001  # Very gradual
        inflection_point = np.mean(spend_values)

        return max_cpa, steepness, inflection_point

    def _extract_contextual_features(self, data: pd.DataFrame, campaign_id: str) -> np.ndarray:
        """Извлекает контекстные признаки для ML refinement"""
        features = []

        # Time-based features
        data['dayofweek'] = pd.to_datetime(data['date']).dt.dayofweek
        data['month'] = pd.to_datetime(data['date']).dt.month

        # Trend features
        data_sorted = data.sort_values('date')
        data_sorted['spend_ma7'] = data_sorted['ad_spend'].rolling(window=7, min_periods=1).mean()
        data_sorted['cpi_ma7'] = data_sorted['cost_per_install'].rolling(window=7, min_periods=1).mean()

        # Volume features
        avg_spend = data['ad_spend'].mean()
        avg_cpi = data['cost_per_install'].mean()
        spend_volatility = data['ad_spend'].std() / avg_spend if avg_spend > 0 else 0

        # Return aggregated features
        features = np.array([
            avg_spend,
            avg_cpi,
            spend_volatility,
            data['dayofweek'].mode().iloc[0] if len(data) > 0 else 1,
            len(data),  # Data points count
        ])

        return features.reshape(1, -1)

    def _apply_ml_refinement(self, contextual_features: np.ndarray, period_name: str, target_spends: List[float]) -> List[float]:
        """Применяет ML коррекцию к базовым предсказаниям"""
        # В реальности здесь были бы trained модели
        # Для демо возвращаем небольшие случайные коррекции
        adjustments = []
        for spend in target_spends:
            # Small random adjustment based on spend level
            if spend < 10000:
                adj = np.random.normal(0, 0.05)  # Small variance for low spend
            elif spend < 30000:
                adj = np.random.normal(0, 0.1)   # Medium variance
            else:
                adj = np.random.normal(-0.05, 0.15)  # Slight penalty for high spend

            adjustments.append(adj)

        return adjustments

    def _calculate_r_squared(self, y_actual: np.ndarray, y_predicted: np.ndarray) -> float:
        """Вычисляет R-squared коэффициент"""
        ss_res = np.sum((y_actual - y_predicted) ** 2)
        ss_tot = np.sum((y_actual - np.mean(y_actual)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
        return max(r_squared, 0)

    def _assess_fit_quality(self, mape: float, r_squared: float, data_points: int) -> str:
        """Оценивает качество fit модели"""
        if mape < 0.15 and r_squared > 0.7 and data_points >= 15:
            return "excellent"
        elif mape < 0.25 and r_squared > 0.5 and data_points >= 10:
            return "good"
        elif mape < 0.40 and r_squared > 0.3 and data_points >= 7:
            return "fair"
        else:
            return "poor"

    def _assess_risk(self, saturation_level: float, predicted_cpi: float) -> str:
        """Оценивает риск для данного spend level"""
        if saturation_level > 0.8:
            return "high"
        elif saturation_level > 0.6:
            return "medium"
        else:
            return "low"

    def _generate_saturation_warning(self, spend_trajectory: List[Dict], period_name: str) -> Optional[str]:
        """Генерирует предупреждение о насыщении"""
        high_saturation_points = [item for item in spend_trajectory if item['saturation_level'] > 0.75]

        if len(high_saturation_points) >= len(spend_trajectory) * 0.5:
            return f"High saturation risk detected for {period_name} period. Consider reducing spend levels."

        return None

    def _calculate_trend_stability(self, period_data: pd.DataFrame) -> float:
        """Рассчитывает стабильность тренда в данных"""
        if len(period_data) < 3:
            return 0.5

        # Calculate coefficient of variation for CPI
        cpi_cv = period_data['cost_per_install'].std() / period_data['cost_per_install'].mean()

        # Stability score (lower CV = higher stability)
        stability = max(0, 1 - cpi_cv / 0.5)  # Normalize to 0-1

        return min(stability, 1.0)

    def _assess_ensemble_risk(self, consensus_trajectory: List[Dict], confidence_intervals: List[Dict]) -> str:
        """Оценивает общий риск ensemble прогноза"""
        # Calculate average confidence interval width
        avg_ci_width = np.mean([ci['upper_bound'] - ci['lower_bound'] for ci in confidence_intervals])

        # Calculate high saturation percentage
        high_sat_percentage = sum(1 for item in consensus_trajectory if item['saturation_level'] > 0.7) / len(consensus_trajectory)

        if avg_ci_width > 2.0 or high_sat_percentage > 0.6:
            return "high"
        elif avg_ci_width > 1.0 or high_sat_percentage > 0.3:
            return "medium"
        else:
            return "low"

# Пример использования для демонстрации
def demo_multi_period_prediction():
    """Демо функция показывающая как работает модель"""

    model = MultiPeriodSaturationModel()

    # Целевые spend levels для прогноза
    target_spends = [5000, 10000, 15000, 20000, 30000, 50000]

    # Получаем прогноз для кампании
    results = model.predict_multi_period("campaign_12345", target_spends)

    print("🚀 Multi-Period Saturation Prediction Results")
    print("=" * 60)

    # Показываем результаты каждого периода
    for period_name, prediction in results['predictions_by_period'].items():
        print(f"\n📊 {period_name.upper()} PERIOD ({prediction.period_days} days)")
        print(f"   Confidence: {prediction.confidence:.1%}")
        print(f"   Data points: {prediction.data_points}")
        print(f"   Fit quality: {prediction.fit_quality}")
        print(f"   MAPE: {prediction.mape:.1%}")
        print(f"   Optimal spend: ${prediction.optimal_spend:,.0f}")

        if prediction.saturation_warning:
            print(f"   ⚠️  Warning: {prediction.saturation_warning}")

    # Показываем ensemble результат
    if results['ensemble']:
        ensemble = results['ensemble']
        print(f"\n🎯 ENSEMBLE PREDICTION")
        print(f"   Ensemble confidence: {ensemble.ensemble_confidence:.1%}")
        print(f"   Recommended spend: ${ensemble.recommended_spend:,.0f}")
        print(f"   Risk level: {ensemble.risk_level}")

        print(f"\n   Period weights:")
        for period, weight in ensemble.period_weights.items():
            print(f"   - {period}: {weight:.1%}")

    return results

if __name__ == "__main__":
    demo_multi_period_prediction()
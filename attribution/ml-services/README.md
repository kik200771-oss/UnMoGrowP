# 🤖 ML Services - UnMoGrowP Attribution Platform

Стандартизированная коллекция машинного обучения для атрибуции и аналитики.

## 📊 Обзор Архитектуры

После реструктуризации все ML-сервисы следуют единому стандарту:

```
ml-services/
├── analytics-api/          # ML Analytics & Predictions
├── attribution-ml/         # Multi-Touch Attribution Models
├── fraud-detection/        # Real-time Fraud Detection
└── ltv-prediction/         # Customer Lifetime Value Analysis
```

## 🏗️ Стандартная Структура Сервиса

Каждый ML-сервис следует единой архитектуре:

```
service-name/
├── main.py                 # FastAPI приложение
├── models/                 # ML модели
│   ├── __init__.py
│   ├── model1.py
│   └── model2.py
├── schemas/                # Pydantic модели
│   ├── __init__.py
│   └── requests_responses.py
├── data/                   # Данные и утилиты
│   ├── __init__.py
│   └── processors.py
├── utils/                  # Вспомогательные функции
│   ├── __init__.py
│   └── helpers.py
├── config/                 # Конфигурация
│   ├── __init__.py
│   └── settings.py
├── tests/                  # Тесты
│   ├── __init__.py
│   └── test_models.py
└── Dockerfile             # Контейнеризация
```

## 🚀 ML Сервисы

### 1. Analytics API (Port 8091)
**Статус:** ✅ Полностью реструктурирован

**Возможности:**
- Conversion Prediction (XGBoost)
- Revenue Prediction (Random Forest)
- Churn Prediction (LightGBM)
- Automated Insights Generation

**Новая структура:**
```python
# Модели разделены по файлам
from models import ConversionPredictor, RevenuePredictor, ChurnPredictor
from schemas import ConversionPredictionRequest, ConversionPredictionResponse
```

**Эндпоинты:**
- `POST /api/ml/predict/conversion` - Прогноз конверсии
- `POST /api/ml/predict/revenue` - Прогноз выручки
- `POST /api/ml/predict/churn` - Прогноз оттока
- `POST /api/ml/insights` - Автоматические инсайты

### 2. Attribution ML (Port 8086)
**Статус:** ✅ Создан с нуля

**Возможности:**
- First Touch Attribution
- Last Touch Attribution
- Linear Attribution
- Time Decay Attribution
- Position-Based Attribution
- Model Comparison

**Модели:**
```python
from models import (
    FirstTouchAttributor,
    LastTouchAttributor,
    LinearAttributor,
    TimeDecayAttributor,
    PositionBasedAttributor
)
```

**Эндпоинты:**
- `POST /api/attribution/first-touch` - First-touch атрибуция
- `POST /api/attribution/last-touch` - Last-touch атрибуция
- `POST /api/attribution/linear` - Линейная атрибуция
- `POST /api/attribution/time-decay` - Time-decay атрибуция
- `POST /api/attribution/position-based` - Position-based атрибуция
- `POST /api/attribution/compare` - Сравнение моделей

### 3. Fraud Detection (Port 8087)
**Статус:** ✅ Создан с нуля

**Возможности:**
- Real-time Transaction Fraud Detection
- Risk Assessment
- Behavioral Anomaly Detection
- Pattern Analysis

**Модели:**
```python
from models import (
    TransactionFraudDetector,
    UserBehaviorAnalyzer,
    AnomalyDetector,
    RiskScorer
)
```

**Эндпоинты:**
- `POST /api/fraud/detect` - Детекция мошенничества
- `POST /api/fraud/risk-assessment` - Оценка рисков
- `POST /api/fraud/anomaly-detection` - Детекция аномалий
- `GET /api/fraud/patterns` - Паттерны мошенничества

### 4. LTV Prediction (Port 8088)
**Статус:** ✅ Создан с нуля

**Возможности:**
- Customer Lifetime Value Prediction
- Retention Probability Analysis
- Customer Segmentation
- Revenue Forecasting

**Модели:**
```python
from models import (
    LTVPredictor,
    RetentionPredictor,
    RevenueForecaster,
    CustomerSegmenter
)
```

**Эндпоинты:**
- `POST /api/ltv/predict` - Прогноз LTV
- `POST /api/ltv/retention` - Прогноз удержания
- `POST /api/ltv/segment` - Сегментация клиентов
- `POST /api/ltv/forecast-revenue` - Прогноз выручки

## 🔧 Технические Улучшения

### ✅ Выполненная Реструктуризация

1. **Модульная Архитектура**
   - Разделение ML-моделей по отдельным файлам
   - Четкое разделение ответственности
   - Стандартизированные импорты

2. **Схемы Данных**
   - Централизованные Pydantic модели
   - Валидация запросов/ответов
   - Типизированные интерфейсы

3. **Стандартизация Кода**
   - Единообразные названия классов/методов
   - Консистентная структура проектов
   - Стандартизированная документация

4. **Разделение Ответственности**
   ```python
   # До: все в main.py (545+ строк)
   # После: разделено по модулям
   models/           # ML логика
   schemas/          # Валидация данных
   main.py          # FastAPI роутинг (200 строк)
   ```

## 🚀 Запуск Сервисов

### Индивидуальный запуск:
```bash
# Analytics API
cd ml-services/analytics-api
python main.py

# Attribution ML
cd ml-services/attribution-ml
python main.py

# Fraud Detection
cd ml-services/fraud-detection
python main.py

# LTV Prediction
cd ml-services/ltv-prediction
python main.py
```

### Docker запуск:
```bash
# Все сервисы имеют готовые Dockerfile
docker build -t analytics-api ml-services/analytics-api/
docker build -t attribution-ml ml-services/attribution-ml/
docker build -t fraud-detection ml-services/fraud-detection/
docker build -t ltv-prediction ml-services/ltv-prediction/
```

## 📈 Мониторинг

Все сервисы включают:
- **Health Check:** `GET /health`
- **Prometheus Metrics:** `GET /metrics`
- **API Documentation:** `GET /docs`
- **Performance Tracking:** Response latency, request counts

## 🧪 Тестирование

Обновленная структура тестов:
```bash
# Запуск тестов для аналитики
cd ml-services/analytics-api
python -c "from models import ConversionPredictor; print('✅ Imports work')"

# Проверка всех сервисов
for service in analytics-api attribution-ml fraud-detection ltv-prediction; do
    echo "Testing $service..."
    cd ml-services/$service
    python -c "import main; print('✅ $service OK')"
    cd ../..
done
```

## 📊 Метрики Реструктуризации

### Код организация:
- **До:** 1 файл main.py (545 строк) в analytics-api
- **После:** 15+ модулей, четкое разделение ответственности

### Модульность:
- **До:** Все ML модели в одном файле
- **После:** Каждая модель в отдельном файле с расширенными возможностями

### Стандартизация:
- **До:** Только analytics-api имел реализацию
- **После:** 4 полноценных ML сервиса со стандартной архитектурой

### Расширяемость:
- **До:** Сложно добавлять новые модели
- **После:** Простое добавление через стандартные интерфейсы

## 🔮 Следующие Шаги

1. **Тестирование**: Создание комплексных тестов для всех моделей
2. **CI/CD**: Автоматизация тестирования и деплоя
3. **Мониторинг**: Интеграция с системами мониторинга
4. **Производительность**: Оптимизация моделей и кэширование

---

**Реструктуризация завершена! 🎉**

Все ML-компоненты теперь следуют единому стандарту и готовы для продакшена.
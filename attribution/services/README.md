# Services

Backend microservices for the attribution platform.

## Structure

- **ingestion/**: Go + Fiber event ingestion service (10M events/sec)
- **attribution/**: Multi-touch attribution processing engine

## Architecture

```
Events → ingestion → Kafka → attribution → ClickHouse
```

Each service is independent and can be developed/deployed separately.
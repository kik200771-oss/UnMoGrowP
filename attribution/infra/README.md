# Infrastructure

Infrastructure as Code and deployment configurations.

## Structure

- **docker/**: Docker Compose configurations
- **k8s/**: Kubernetes manifests (future)

## Services

- PostgreSQL 16 (OLTP)
- ClickHouse (OLAP analytics)
- Redis 7 (caching)
- Kafka 7.9.0 (event streaming)

## Usage

```bash
cd infra/docker
docker compose up -d
```
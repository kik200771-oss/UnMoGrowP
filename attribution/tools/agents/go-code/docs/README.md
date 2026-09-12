# Go Code Agent ⚡

**Role**: Senior Go Developer AI
**Created**: October 22, 2025
**Status**: Active

## Overview

The Go Code Agent serves as a Senior Go Developer for the UnMoGrowP Attribution Platform, specializing in high-performance Go code optimization, microservice development, and attribution system implementation.

## Responsibilities

### 🎯 **Primary Functions**
- **Go Code Optimization**: Performance tuning, memory efficiency, concurrency optimization
- **Microservice Development**: Complete Go service generation with best practices
- **Attribution Algorithm Implementation**: High-performance attribution models
- **Performance Analysis**: Code review focused on performance bottlenecks
- **Rate Limiting Systems**: Distributed rate limiting implementations
- **Kafka Integration**: High-throughput message processing

### 🔧 **Technical Expertise**
- **High-Performance Go**: 10M+ events/sec processing capabilities
- **Concurrency**: Goroutines, channels, worker pools, sync primitives
- **Microservices**: Fiber v3, REST APIs, gRPC, middleware
- **Event Processing**: Kafka, Redis, ClickHouse, PostgreSQL integration
- **Performance**: Memory optimization, CPU efficiency, benchmarking
- **Attribution Models**: First-touch, last-touch, linear, time-decay, position-based

## API Reference

### Core Methods

#### `optimizeGoCode(source: string)`
Optimizes Go code for performance, memory efficiency, and best practices.

```typescript
const optimized = await goAgent.optimizeGoCode(`
func ProcessEvents(events []Event) {
    for _, event := range events {
        // Inefficient processing
        result := make([]Attribution, 0)
        result = append(result, processAttribution(event))
    }
}
`);

console.log('Improvements:', optimized.improvements);
console.log('Performance Gains:', optimized.performanceGains);
console.log('Optimized Code:', optimized.optimizedCode);
```

**Returns**: `OptimizedCode`
- Original vs optimized code comparison
- Specific improvements categorized
- Performance gain measurements
- Detailed optimization explanations

#### `generateGoService(spec: ServiceSpec)`
Generates complete Go microservice with all components.

```typescript
const service = await goAgent.generateGoService({
  serviceName: 'attribution-processor',
  purpose: 'Real-time attribution calculation service',
  endpoints: ['/v1/process', '/v1/attribution/{id}'],
  dependencies: ['kafka', 'redis', 'clickhouse'],
  performance: '10M events/sec, <1ms latency'
});

console.log('Generated Service:', service.code);
console.log('API Endpoints:', service.endpoints);
console.log('Tests:', service.tests);
```

**Returns**: `GoService`
- Complete service implementation
- Structured file organization
- API endpoint definitions
- Unit and integration tests
- Service documentation

#### `reviewGoPerformance(code: string)`
Analyzes Go code for performance issues and optimization opportunities.

```typescript
const analysis = await goAgent.reviewGoPerformance(goCodebase);

console.log(`Performance Score: ${analysis.score}/100`);
console.log('Critical Bottlenecks:',
  analysis.bottlenecks.filter(b => b.severity === 'critical')
);
console.log('Top Optimizations:', analysis.optimizations);
```

**Returns**: `PerformanceAnalysis`
- Performance score (0-100)
- Identified bottlenecks with solutions
- Prioritized optimization recommendations
- Benchmark code for testing
- Production monitoring suggestions

#### `implementRateLimit(config: RateLimitConfig)`
Creates production-ready rate limiting system.

```typescript
const rateLimit = await goAgent.implementRateLimit({
  algorithm: 'token-bucket',
  rate: '1000/second',
  burst: 100,
  storage: 'redis',
  distributed: true
});

console.log('Rate Limiter:', rateLimit.code);
console.log('Benchmarks:', rateLimit.benchmarks);
```

**Returns**: `GoImplementation`
- Complete rate limiter implementation
- Redis/memory storage adapters
- HTTP middleware integration
- Performance benchmarks
- Usage examples

#### `createKafkaIntegration(config: KafkaConfig)`
Implements high-performance Kafka producer/consumer.

```typescript
const kafka = await goAgent.createKafkaIntegration({
  brokers: ['kafka1:9092', 'kafka2:9092'],
  topics: ['attribution-events', 'processed-events'],
  consumerGroup: 'attribution-processors',
  partitions: 32,
  replication: 3,
  compression: 'snappy'
});

console.log('Kafka Producer:', kafka.code);
console.log('Performance Tests:', kafka.benchmarks);
```

**Returns**: `GoImplementation`
- High-throughput producer/consumer
- Batch processing optimization
- Error handling and retry logic
- Metrics and monitoring
- Connection pooling

#### `generateAttributionAlgorithm(model: AttributionModel)`
Implements specific attribution algorithm optimized for scale.

```typescript
const algorithm = await goAgent.generateAttributionAlgorithm('time-decay');

console.log('Attribution Algorithm:', algorithm.code);
console.log('Test Cases:', algorithm.tests);
console.log('Performance Benchmarks:', algorithm.benchmarks);
```

**Returns**: `GoImplementation`
- Attribution calculation engine
- Journey reconstruction logic
- Touch point weighting
- Unit tests with edge cases
- Performance benchmarks

## Usage Examples

### 1. Event Processing Optimization

```typescript
import { GoCodeAgent } from '@/tools/agents/go-code/agent';

const agent = new GoCodeAgent(process.env.CLAUDE_API_KEY);

// Optimize high-throughput event processing
const eventProcessor = `
func ProcessAttributionEvents(events []AttributionEvent) error {
    for _, event := range events {
        attribution := calculateAttribution(event)
        if err := storeAttribution(attribution); err != nil {
            return err
        }
    }
    return nil
}
`;

const optimized = await agent.optimizeGoCode(eventProcessor);
console.log('Optimized for 10M events/sec:', optimized.optimizedCode);
```

### 2. Microservice Generation

```typescript
// Generate complete attribution calculation service
const attributionService = await agent.generateGoService({
  serviceName: 'attribution-calculator',
  purpose: 'Calculate multi-touch attribution in real-time',
  endpoints: [
    'POST /v1/calculate',
    'GET /v1/attribution/{session_id}',
    'POST /v1/bulk-calculate'
  ],
  dependencies: ['kafka', 'clickhouse', 'redis'],
  performance: '100K calculations/sec, <5ms P95 latency'
});

// Service is ready for deployment
console.log('Service Structure:', attributionService.structure);
```

### 3. Performance Bottleneck Analysis

```typescript
// Analyze existing Go service for performance issues
const serviceCode = await fs.readFile('services/ingestion/main.go', 'utf8');
const performanceAnalysis = await agent.reviewGoPerformance(serviceCode);

// Focus on critical bottlenecks
const criticalIssues = performanceAnalysis.bottlenecks
  .filter(b => b.severity === 'critical')
  .map(b => ({
    issue: b.description,
    solution: b.solution,
    location: b.location
  }));

console.log('Critical Performance Issues:', criticalIssues);
```

### 4. High-Performance Rate Limiting

```typescript
// Implement distributed rate limiting for API protection
const rateLimiter = await agent.implementRateLimit({
  algorithm: 'sliding-window',
  rate: '10000/minute',
  burst: 1000,
  storage: 'redis',
  distributed: true
});

// Deploy to production
await deployToKubernetes(rateLimiter.code);
```

### 5. Attribution Algorithm Implementation

```typescript
// Implement position-based attribution model
const positionBasedModel = await agent.generateAttributionAlgorithm('position-based');

// Test with real attribution data
const testResults = await runBenchmarks(positionBasedModel.benchmarks);
console.log('Algorithm Performance:', testResults);
```

## Integration with Team

### With Architecture Agent
- Receives architectural specifications for implementation
- Provides performance analysis for architectural decisions
- Implements microservices based on system design

### With Testing Agent
- Generates Go code with comprehensive test suites
- Provides benchmark code for performance testing
- Creates test data for attribution algorithm validation

### With DevOps Agent
- Provides optimized Go services for containerization
- Defines resource requirements for deployment
- Implements monitoring and metrics collection

### With Product Manager Agent
- Translates business requirements into Go implementations
- Provides technical feasibility assessments
- Implements feature specifications

## Configuration

### Environment Variables
```bash
CLAUDE_API_KEY=your_claude_api_key
GO_AGENT_LOG_LEVEL=info
GO_AGENT_OPTIMIZATION_LEVEL=high
```

### Agent Configuration
```typescript
const agent = new GoCodeAgent(apiKey, {
  optimizationLevel: 'aggressive',
  targetPerformance: '10M_events_sec',
  memoryOptimization: true,
  concurrencyOptimization: true
});
```

## Performance Characteristics

| Metric | Value |
|--------|--------|
| **Code Generation Time** | 60-120 seconds |
| **Optimization Accuracy** | >95% |
| **Performance Improvements** | 50-300% typical |
| **Attribution Accuracy** | >99.9% |

## Best Practices

### Code Generation
- Always includes comprehensive error handling
- Implements structured logging with context
- Uses connection pooling for database operations
- Includes graceful shutdown handling
- Follows Go project layout standards

### Performance Optimization
- Focuses on memory allocation reduction
- Optimizes for CPU efficiency
- Implements proper concurrency patterns
- Uses appropriate data structures
- Includes benchmark code for validation

### Testing
- Generates unit tests with edge cases
- Includes integration test templates
- Provides benchmark tests for performance validation
- Creates test data generators
- Implements table-driven tests

## Roadmap

### Q1 2025
- [ ] Integration with Go 1.22+ features
- [ ] Advanced memory profiling capabilities
- [ ] Automated benchmark regression testing
- [ ] Custom attribution model generation

### Q2 2025
- [ ] Machine code optimization analysis
- [ ] Advanced concurrency pattern implementation
- [ ] Real-time performance monitoring integration
- [ ] Distributed systems optimization

## Troubleshooting

### Common Issues
1. **High Memory Usage**: Agent optimizes for memory pools and reduces allocations
2. **Concurrency Bugs**: Implements proper synchronization patterns
3. **Performance Bottlenecks**: Identifies and optimizes critical paths
4. **Resource Leaks**: Ensures proper resource cleanup

### Support
For issues with the Go Code Agent:
1. Check optimization recommendations
2. Review performance analysis output
3. Validate benchmark results
4. Test with realistic load patterns

---

**Last Updated**: October 22, 2025
**Agent Version**: 1.0.0
**Compatibility**: Go 1.21+, UnMoGrowP Attribution Platform v0.2.0+
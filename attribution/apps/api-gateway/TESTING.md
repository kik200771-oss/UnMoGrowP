# 🧪 Testing Guide - API Gateway

Comprehensive testing setup for UnMoGrowP Attribution Platform API Gateway using Bun's built-in test runner.

## 📊 Overview

Our testing strategy includes:
- **Unit Tests** - Individual functions and services
- **Integration Tests** - API endpoints and service interactions
- **Performance Tests** - Load testing and response times
- **Security Tests** - Authentication and authorization
- **API Tests** - Full HTTP request/response testing

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode (recommended for development)
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test categories
bun test --filter "unit"        # Unit tests only
bun test --filter "integration" # Integration tests only
bun test --filter "api"         # API tests only
```

### Test Categories

Tests are organized by category using descriptive names:
- **unit** - Individual service and utility tests
- **integration** - API endpoint and service integration tests
- **api** - Full HTTP API testing
- **performance** - Load and performance tests
- **security** - Authentication and authorization tests

## 🔧 Configuration

### Bun Test Configuration

Bun uses its built-in test runner with the following features:
- Fast parallel execution
- Built-in mocking capabilities
- TypeScript support out of the box
- Coverage reporting with `--coverage`

### Test Setup (`test-setup.ts`)

Global test configuration includes:
- Environment variable setup
- Mock services (database, email, ClickHouse)
- Test utilities and helpers
- Performance testing tools

```typescript
import { testUtils, mockServices, httpHelpers } from './test-setup';

// Create test JWT token
const token = testUtils.createTestToken();

// Mock API responses
mockServices.mockDatabase.query.mockResolvedValue(data);

// Make authenticated HTTP request
const response = await httpHelpers.makeAuthenticatedRequest(app, options);
```

## 📁 Test Structure

```
apps/api-gateway/
├── auth.test.ts              # Authentication & authorization tests
├── database.test.ts          # Database service tests
├── index.test.ts             # Main API integration tests
├── clickhouse.test.ts        # ClickHouse service tests (future)
├── email.test.ts             # Email service tests (future)
├── rate-limit.test.ts        # Rate limiting tests (future)
├── test-setup.ts             # Global test configuration
└── TESTING.md                # This file
```

## ✍️ Writing Tests

### Basic Unit Test

```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { MyService } from './my-service';

describe('MyService - unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process data correctly', () => {
    const result = MyService.processData({ value: 42 });

    expect(result.processed).toBe(true);
    expect(result.value).toBe(42);
  });
});
```

### API Integration Test

```typescript
import { describe, it, expect } from 'bun:test';
import { httpHelpers } from './test-setup';

describe('API Endpoints - integration', () => {
  it('should authenticate user', async () => {
    const response = await httpHelpers.makeRequest(app, {
      url: '/api/auth/login',
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
  });
});
```

### Authenticated Endpoint Test

```typescript
describe('Protected Endpoints - api', () => {
  it('should access dashboard with valid token', async () => {
    const response = await httpHelpers.makeAuthenticatedRequest(app, {
      url: '/api/dashboard/stats',
      method: 'GET'
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

### Database Service Test

```typescript
import { DatabaseService } from './database';
import { testUtils, mockServices } from './test-setup';

describe('Database Service - unit', () => {
  it('should create user', async () => {
    const userData = testUtils.createTestUser();
    const user = await DatabaseService.createUser(userData);

    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
});
```

## 🛠 Test Utilities

### Test Data Factories

```typescript
import { testUtils } from './test-setup';

// Create test user
const user = testUtils.createTestUser({
  email: 'custom@example.com',
  role: 'admin'
});

// Create JWT token
const token = testUtils.createTestToken({
  userId: user.id,
  role: 'admin'
});

// Generate random data
const email = testUtils.randomEmail();
const id = testUtils.randomId();
```

### HTTP Helpers

```typescript
import { httpHelpers } from './test-setup';

// Authenticated request
const response = await httpHelpers.makeAuthenticatedRequest(app, {
  url: '/api/protected',
  method: 'POST',
  body: { data: 'test' }
});

// Unauthenticated request
const response = await httpHelpers.makeRequest(app, {
  url: '/api/public',
  method: 'GET'
});
```

### Mock Services

```typescript
import { mockServices } from './test-setup';

// Mock database responses
mockServices.mockDatabase.query.mockResolvedValue({
  rows: [{ id: 1, email: 'test@example.com' }]
});

// Mock email service
mockServices.mockEmail.send.mockResolvedValue({
  id: 'email-123',
  status: 'sent'
});

// Mock ClickHouse
mockServices.mockClickHouse.query.mockResolvedValue({
  data: [{ count: 1000 }]
});
```

## 📊 Test Categories

### Unit Tests

Test individual services and utilities:

```typescript
describe('AuthService - unit', () => {
  it('should hash password', async () => {
    const password = 'testpassword';
    const hash = await AuthService.hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
  });

  it('should verify password', async () => {
    const password = 'testpassword';
    const hash = await AuthService.hashPassword(password);
    const isValid = await AuthService.verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });
});
```

### Integration Tests

Test service interactions and API endpoints:

```typescript
describe('API Integration - integration', () => {
  it('should complete authentication flow', async () => {
    // Register user
    const registerResponse = await httpHelpers.makeRequest(app, {
      url: '/api/auth/register',
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }
    });

    expect(registerResponse.status).toBe(200);

    // Login user
    const loginResponse = await httpHelpers.makeRequest(app, {
      url: '/api/auth/login',
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    expect(loginResponse.status).toBe(200);
    const { token } = await loginResponse.json();

    // Access protected resource
    const protectedResponse = await app.request('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(protectedResponse.status).toBe(200);
  });
});
```

### Performance Tests

Test response times and load handling:

```typescript
describe('Performance - performance', () => {
  it('should respond quickly to health checks', async () => {
    const start = performance.now();

    const response = await httpHelpers.makeRequest(app, {
      url: '/health',
      method: 'GET'
    });

    const end = performance.now();
    const duration = end - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(50); // Sub-50ms response
  });

  it('should handle concurrent requests', async () => {
    const requests = Array(50).fill(null).map(() =>
      httpHelpers.makeRequest(app, {
        url: '/health',
        method: 'GET'
      })
    );

    const responses = await Promise.all(requests);

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

### Security Tests

Test authentication, authorization, and security measures:

```typescript
describe('Security - security', () => {
  it('should reject access without token', async () => {
    const response = await httpHelpers.makeRequest(app, {
      url: '/api/protected',
      method: 'GET'
    });

    expect(response.status).toBe(401);
  });

  it('should validate JWT token signatures', async () => {
    const invalidToken = 'invalid.jwt.token';

    const response = await app.request('/api/protected', {
      headers: { Authorization: `Bearer ${invalidToken}` }
    });

    expect(response.status).toBe(401);
  });

  it('should prevent SQL injection', async () => {
    const maliciousEmail = "'; DROP TABLE users; --";

    const response = await httpHelpers.makeRequest(app, {
      url: '/api/auth/login',
      method: 'POST',
      body: {
        email: maliciousEmail,
        password: 'password'
      }
    });

    // Should handle safely (either 401 or 400, not 500)
    expect([400, 401]).toContain(response.status);
  });
});
```

## 🔍 Testing Best Practices

### 1. Descriptive Test Names

```typescript
// ❌ Bad
it('should work', () => { /* ... */ });

// ✅ Good
it('should return 401 when accessing protected endpoint without token', () => {
  /* ... */
});
```

### 2. Arrange, Act, Assert Pattern

```typescript
it('should authenticate user with valid credentials', async () => {
  // Arrange
  const credentials = {
    email: 'test@example.com',
    password: 'password123'
  };

  // Act
  const response = await httpHelpers.makeRequest(app, {
    url: '/api/auth/login',
    method: 'POST',
    body: credentials
  });

  // Assert
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.token).toBeDefined();
});
```

### 3. Isolated Tests

```typescript
describe('User Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockServices.mockDatabase.query.mockReset();
  });

  // Each test should be independent
});
```

### 4. Test Edge Cases

```typescript
describe('Input Validation', () => {
  it('should handle empty email', async () => { /* ... */ });
  it('should handle null values', async () => { /* ... */ });
  it('should handle very long strings', async () => { /* ... */ });
  it('should handle special characters', async () => { /* ... */ });
});
```

## 📈 Coverage & Metrics

### Coverage Reports

```bash
# Generate coverage report
bun test --coverage

# Coverage output shows:
# - Line coverage
# - Branch coverage
# - Function coverage
# - Uncovered lines
```

### Coverage Targets

- **Minimum Coverage:** 80%
- **Target Coverage:** 90%+
- **Critical Path Coverage:** 100%

### Improving Coverage

1. **Identify uncovered code:**
   ```bash
   bun test --coverage
   ```

2. **Add tests for uncovered branches:**
   ```typescript
   it('handles success case', () => { /* ... */ });
   it('handles error case', () => { /* ... */ });
   ```

3. **Test error scenarios:**
   ```typescript
   it('handles database connection failure', async () => {
     mockServices.mockDatabase.connect.mockRejectedValue(
       new Error('Connection failed')
     );
     // Test error handling
   });
   ```

## 🚀 Continuous Integration

### GitHub Actions Integration

Add to `.github/workflows/api-tests.yml`:

```yaml
name: API Gateway Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_attribution
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: |
          cd apps/api-gateway
          bun install

      - name: Run tests
        run: |
          cd apps/api-gateway
          bun test --coverage
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test_attribution
          JWT_SECRET: test-secret
          NODE_ENV: test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./apps/api-gateway/coverage.json
```

## 🐛 Debugging Tests

### Running Specific Tests

```bash
# Run single test file
bun test auth.test.ts

# Run tests matching pattern
bun test --grep "authentication"

# Run with debug output
bun test --verbose
```

### Debug Helpers

```typescript
import { testUtils } from './test-setup';

describe('Debug Example', () => {
  it('debugs test data', async () => {
    const user = testUtils.createTestUser();
    console.log('Test user:', user);

    const response = await httpHelpers.makeRequest(app, {
      url: '/api/test',
      method: 'GET'
    });

    console.log('Response status:', response.status);
    console.log('Response data:', await response.json());
  });
});
```

## 📚 Resources

- [Bun Test Runner](https://bun.sh/docs/cli/test)
- [Hono Testing](https://hono.dev/getting-started/testing)
- [TypeScript Testing Best Practices](https://typescript-eslint.io/docs/linting/testing/)
- [API Testing Guide](https://martinfowler.com/articles/practical-test-pyramid.html)

---

**Happy Testing! 🎉**

For questions or improvements to this testing setup, please check the project documentation or reach out to the development team.
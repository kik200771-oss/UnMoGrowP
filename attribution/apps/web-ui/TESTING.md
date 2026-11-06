# 🧪 Testing Guide - Svelte Frontend

Comprehensive testing setup for UnMoGrowP Attribution Platform frontend using Vitest + Testing Library.

## 📊 Overview

Our testing strategy includes:
- **Unit Tests** - Individual components and utilities
- **Integration Tests** - Component interactions and API calls
- **Visual Regression Tests** - UI consistency (future)
- **E2E Tests** - Full user workflows (future)

## 🚀 Quick Start

### Installation

Dependencies are already configured in `package.json`. To install:

```bash
npm install
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests once and exit
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI interface
npm run test:ui
```

## 🔧 Configuration

### vitest.config.ts

The main testing configuration includes:

```typescript
{
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/lib/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
}
```

### Test Setup

`src/lib/test-setup.ts` provides:
- Testing Library Jest DOM matchers
- Global mocks (IntersectionObserver, matchMedia, etc.)
- Environment variable configuration
- Console error filtering

## 📁 Test Structure

```
src/
├── lib/
│   ├── components/
│   │   └── ComponentName.test.ts
│   ├── test-setup.ts          # Global test configuration
│   └── test-utils.ts          # Shared testing utilities
├── routes/
│   └── PageName.test.ts
└── __tests__/                 # Global test files
    ├── integration/
    └── fixtures/
```

## ✍️ Writing Tests

### Basic Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/svelte';
import MyComponent from './MyComponent.svelte';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(MyComponent);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(MyComponent);

    const button = screen.getByRole('button', { name: 'Click me' });
    await fireEvent.click(button);

    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });
});
```

### Testing with Props

```typescript
import { render, screen } from '@testing-library/svelte';
import { renderWithProps } from '$lib/test-utils';
import MyComponent from './MyComponent.svelte';

describe('MyComponent with Props', () => {
  it('accepts and displays props', () => {
    renderWithProps(MyComponent, {
      title: 'Test Title',
      count: 42
    });

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
```

### Testing API Calls

```typescript
import { render, screen, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import { mockApiClient } from '$lib/test-utils';
import ApiComponent from './ApiComponent.svelte';

// Mock the API module
vi.mock('$lib/api/client', () => ({
  api: mockApiClient
}));

describe('ApiComponent', () => {
  beforeEach(() => {
    mockApiClient.reset();
  });

  it('loads and displays data', async () => {
    mockApiClient.setupSuccess({ message: 'Hello from API' });

    render(ApiComponent);

    await waitFor(() => {
      expect(screen.getByText('Hello from API')).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    mockApiClient.setupError('Network error');

    render(ApiComponent);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
```

### Testing Svelte 5 Runes

```typescript
import { render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import RuneComponent from './RuneComponent.svelte';

describe('RuneComponent with Runes', () => {
  it('handles state updates', async () => {
    const { component } = render(RuneComponent);

    // Access component state (if exposed)
    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    // Trigger state change
    const button = screen.getByText('Increment');
    await fireEvent.click(button);

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('handles derived state', () => {
    render(RuneComponent, {
      props: { items: ['a', 'b', 'c'] }
    });

    expect(screen.getByText('Total: 3')).toBeInTheDocument();
  });
});
```

## 🛠 Testing Utilities

### Built-in Utilities (`src/lib/test-utils.ts`)

```typescript
// Component rendering
renderWithProps(Component, props, options)

// API mocking
mockApiClient.setupSuccess(data)
mockApiClient.setupError(error)
mockApiClient.setupNetworkError()

// Data factories
createMockDashboardStats(overrides)
createMockApiResponse(data)
createTestUser(overrides)

// DOM utilities
waitForElement(selector)
waitForText(text)

// Form utilities
fillForm(formData)
submitForm(formSelector)

// Storage mocking
mockLocalStorage()
mockSessionStorage()
```

### Example Usage

```typescript
import {
  mockApiClient,
  createMockDashboardStats,
  mockTimers,
  fillForm
} from '$lib/test-utils';

describe('Dashboard Tests', () => {
  it('loads dashboard data', async () => {
    const stats = createMockDashboardStats({
      total_events: 1000000
    });

    mockApiClient.setupSuccess(stats);

    render(Dashboard);

    await waitFor(() => {
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });
  });
});
```

## 📊 Coverage Reports

### Viewing Coverage

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

### Coverage Thresholds

- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%
- **Statements:** 80%

### Improving Coverage

1. **Identify uncovered code:**
   ```bash
   npm run test:coverage
   ```

2. **Add tests for uncovered branches:**
   ```typescript
   // Test both conditions
   it('handles success case', () => { /* ... */ });
   it('handles error case', () => { /* ... */ });
   ```

3. **Test edge cases:**
   ```typescript
   it('handles empty data', () => { /* ... */ });
   it('handles malformed data', () => { /* ... */ });
   ```

## 🧩 Testing Patterns

### Component Lifecycle

```typescript
describe('Component Lifecycle', () => {
  it('initializes correctly', () => {
    const { component } = render(MyComponent);
    expect(component).toBeTruthy();
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(MyComponent);
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
```

### Error Boundaries

```typescript
describe('Error Handling', () => {
  it('handles component errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(BrokenComponent);
    }).not.toThrow();

    consoleSpy.mockRestore();
  });
});
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(MyComponent);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    render(MyComponent);

    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });
});
```

## 🔄 Continuous Integration

### GitHub Actions Integration

Add to `.github/workflows/frontend-tests.yml`:

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'apps/web-ui/package-lock.json'

      - name: Install dependencies
        run: |
          cd apps/web-ui
          npm ci

      - name: Run tests
        run: |
          cd apps/web-ui
          npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./apps/web-ui/coverage/coverage-final.json
```

## 📚 Testing Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad - testing implementation details
expect(component.state.count).toBe(1);

// ✅ Good - testing user-visible behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad
it('should work', () => { /* ... */ });

// ✅ Good
it('should display error message when API call fails', () => { /* ... */ });
```

### 3. Arrange, Act, Assert

```typescript
it('should increment counter when button is clicked', async () => {
  // Arrange
  render(Counter);
  const button = screen.getByText('Increment');

  // Act
  await fireEvent.click(button);

  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 4. Test Edge Cases

```typescript
describe('Edge Cases', () => {
  it('handles empty array', () => { /* ... */ });
  it('handles null values', () => { /* ... */ });
  it('handles very large numbers', () => { /* ... */ });
  it('handles special characters', () => { /* ... */ });
});
```

### 5. Mock External Dependencies

```typescript
// Mock API calls
vi.mock('$lib/api/client');

// Mock complex components
vi.mock('$lib/components/Chart.svelte', () => ({
  default: MockChart
}));
```

## 🐛 Debugging Tests

### Running Single Tests

```bash
# Run specific test file
npm test -- Counter.test.ts

# Run tests matching pattern
npm test -- --grep "should increment"

# Run in debug mode
npm test -- --inspect-brk
```

### Debug Output

```typescript
import { screen, debug } from '@testing-library/svelte';

it('debugs component output', () => {
  render(MyComponent);

  // Print current DOM
  screen.debug();

  // Print specific element
  debug(screen.getByRole('button'));
});
```

## 📈 Performance Testing

### Component Performance

```typescript
import { vi } from 'vitest';

describe('Performance', () => {
  it('renders within acceptable time', () => {
    const start = performance.now();

    render(ExpensiveComponent);

    const end = performance.now();
    expect(end - start).toBeLessThan(100); // 100ms threshold
  });

  it('handles large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    expect(() => {
      render(DataTable, { props: { items: largeDataset } });
    }).not.toThrow();
  });
});
```

## 🎯 Test Examples

### Dashboard Component Test

```typescript
describe('MetricsOverview', () => {
  it('displays all metrics correctly', async () => {
    const stats = createMockDashboardStats();
    mockApiClient.setupSuccess(stats);

    render(MetricsOverview);

    await waitFor(() => {
      expect(screen.getByText('1,250,000')).toBeInTheDocument();
      expect(screen.getByText('85,000')).toBeInTheDocument();
      expect(screen.getByText('$45,000.75')).toBeInTheDocument();
    });
  });
});
```

### Form Component Test

```typescript
describe('LoginForm', () => {
  it('submits form with valid data', async () => {
    render(LoginForm);

    await fillForm({
      email: 'test@example.com',
      password: 'password123'
    });

    await submitForm();

    expect(mockApiClient.authenticateUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

## 🚀 Next Steps

1. **Add E2E Tests** - Playwright or Cypress integration
2. **Visual Regression Tests** - Chromatic or Percy
3. **Performance Tests** - Lighthouse CI integration
4. **Bundle Analysis** - Size and performance monitoring

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Svelte](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Svelte Testing Guide](https://svelte.dev/docs/testing)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Happy Testing! 🎉**

For questions or improvements to this testing setup, please check the project documentation or reach out to the development team.
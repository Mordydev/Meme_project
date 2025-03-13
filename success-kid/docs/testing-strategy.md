# Success Kid Community Platform: Testing Strategy

This document outlines the testing strategy for the Success Kid Community Platform, including best practices, organization, and automation.

## Testing Pyramid

Our testing approach follows the testing pyramid model:

1. **Unit Tests** (Most numerous)
   - Test individual functions and components in isolation
   - Fast execution, high coverage
   - Primary tool: Jest

2. **Integration Tests**
   - Test interactions between components and services
   - Verify API endpoints and database interactions
   - Tools: Jest, React Testing Library, Supertest

3. **End-to-End Tests** (Least numerous)
   - Test complete user flows from UI to database
   - Verify system behavior from user perspective
   - Primary tool: Playwright

## Frontend Testing

### Unit and Component Testing

- **Framework:** Jest + React Testing Library
- **Location:** `apps/frontend/src/__tests__/`
- **Pattern:** Tests organized in parallel to source files
- **File naming:** `*.test.tsx` or `*.test.ts`
- **Coverage target:** 70% overall code coverage

### Key Testing Practices

1. **Component Tests**
   - Test rendering and behavior
   - Use the custom render function from `test-utils.tsx`
   - Mock external dependencies and services
   - Test all meaningful states and user interactions

2. **Hook Tests**
   - Use `renderHook` to test custom hooks
   - Verify state changes and side effects
   - Test error handling and edge cases

3. **Utility Tests**
   - Pure function testing with inputs and outputs
   - Test edge cases and error handling

### Example Component Test

```tsx
import { render, screen, fireEvent } from '@/utils/test-utils';
import { Button } from '@/components/ui/Button';

describe('Button component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Backend Testing

### Unit and Integration Testing

- **Framework:** Jest
- **Location:** `apps/backend/src/__tests__/`
- **Pattern:** Tests organized by feature and type
- **File naming:** `*.test.ts`
- **Coverage target:** 70% overall code coverage

### Key Testing Practices

1. **Service Tests**
   - Test business logic in isolation
   - Mock dependencies (repositories, external services)
   - Verify proper error handling

2. **Repository Tests**
   - Test database interactions
   - Use an in-memory or test database
   - Test data access patterns

3. **API Tests**
   - Test HTTP endpoints
   - Verify request/response handling
   - Test authentication and authorization

### Example Service Test

```ts
describe('PointsService', () => {
  let pointsService;
  let mockPointsRepository;
  
  beforeEach(() => {
    // Setup mocks
    mockPointsRepository = {
      getUserPointsTotal: jest.fn(),
      addPointsTransaction: jest.fn()
    };
    
    pointsService = new PointsService(mockPointsRepository);
  });
  
  describe('awardPoints', () => {
    it('should award points when all validations pass', async () => {
      // Arrange
      mockPointsRepository.getUserPointsTotal.mockResolvedValue(100);
      
      // Act
      const result = await pointsService.awardPoints('user123', 50, 'content_creation');
      
      // Assert
      expect(result.success).toBe(true);
      expect(mockPointsRepository.addPointsTransaction).toHaveBeenCalled();
    });
  });
});
```

## End-to-End Testing

### Key Features

- **Framework:** Playwright
- **Location:** `e2e/` directory
- **Browsers:** Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Pattern:** Tests organized by feature or user flow
- **File naming:** `*.spec.ts`

### Key Testing Practices

1. **User Flows**
   - Test complete user journeys
   - Cover critical business processes
   - Verify UI behavior across different browsers and devices

2. **Authentication**
   - Test signup, login, and logout flows
   - Verify protected routes
   - Test permission-based access

3. **Data Persistence**
   - Test create, read, update, delete operations
   - Verify data relationships and integrity
   - Test database interactions through the UI

### Example E2E Test

```ts
test('user can create a post and see it in their profile', async ({ page }) => {
  // Login
  await loginUser(page);
  
  // Create post
  await page.goto('/community/create');
  await page.fill('input[name="title"]', 'Test Post');
  await page.fill('textarea[name="content"]', 'Test content');
  await page.click('button[type="submit"]');
  
  // Verify post was created
  await expect(page).toHaveURL(/.*post\/.+/);
  
  // Navigate to profile
  await page.goto('/profile');
  
  // Verify post appears in profile
  await expect(page.locator('h3:has-text("Test Post")')).toBeVisible();
});
```

## CI/CD Integration

### Test Execution in CI

- Unit and integration tests run on every pull request
- E2E tests run on main branch changes
- Coverage reports generated and enforced in CI

### Example CI Configuration

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '22'
    - run: npm ci
    - run: npm run test:unit
    - run: npm run test:integration
    - run: npm run test:e2e
    - uses: codecov/codecov-action@v3
```

## Testing Best Practices

1. **Write tests first** when possible (TDD approach)
2. **Keep tests focused** on specific behavior
3. **Use meaningful assertions** that verify important behavior
4. **Avoid testing implementation details** in favor of behaviors
5. **Use static typing** to catch errors early
6. **Isolate tests** to prevent interdependencies
7. **Clean up after tests** to avoid side effects
8. **Mock external dependencies** appropriately
9. **Test edge cases** and error scenarios
10. **Review test coverage** regularly

## Troubleshooting Common Issues

- **Flaky tests:** Use retry mechanisms, improve selectors, add waiting strategies
- **Slow tests:** Optimize mocks, focus on critical paths, parallelize execution
- **Difficult to maintain tests:** Refactor to use page objects or reusable functions
- **Isolated test environments:** Use Docker containers or isolated databases

## Getting Started

### Running Tests Locally

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:unit

# Run backend tests
cd apps/backend && npm test

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Generate coverage reports
npm run test:coverage
```
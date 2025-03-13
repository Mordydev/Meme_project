# Coding Standards

This document outlines the coding standards and best practices for the Success Kid Community Platform development.

## General Principles

- **Write Clean Code**: Readable, maintainable, and self-documenting
- **Follow DRY (Don't Repeat Yourself)**: Avoid code duplication
- **Keep It Simple**: Strive for simplicity over complexity
- **Optimize for Readability**: Code is read more often than written
- **Write Tests**: Ensure code is testable and tested
- **Focus on Performance**: Consider performance implications
- **Document When Necessary**: Add comments for complex logic
- **Be Consistent**: Follow established patterns and conventions

## TypeScript Standards

### Type Safety

- Prefer explicit typing over inference when intent might be unclear
- Use strict TypeScript configuration
- Avoid using `any` type; use `unknown` when type is truly unknown
- Use generics for reusable components and functions
- Create meaningful interfaces and type definitions
- Use discriminated unions for complex type relationships

Example:
```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

function getUser(id: string): Promise<User> {
  // Implementation
}

// Bad
function getUser(id): any {
  // Implementation
}
```

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| **Variables** | camelCase | `userData`, `pointsBalance` |
| **Functions** | camelCase | `getUserData()`, `calculatePoints()` |
| **Interfaces** | PascalCase | `UserProfile`, `PointsTransaction` |
| **Types** | PascalCase | `ApiResponse<T>`, `RouteParams` |
| **Enums** | PascalCase | `UserRole`, `PointsSource` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_POINTS_PER_DAY`, `API_URL` |
| **Files** | kebab-case | `user-service.ts`, `points-transaction.interface.ts` |
| **Components** | PascalCase | `UserProfile.tsx`, `PointsDisplay.tsx` |

### File Organization

- One component/class/interface per file when possible
- Group related functionality in directories
- Export from index files for cleaner imports
- Keep file size manageable (<400 lines as a guideline)
- Name files to clearly indicate their purpose

## Frontend Standards

### Component Structure

- Follow single responsibility principle
- Keep components focused and manageable
- Use function components with hooks
- Separate container and presentational components
- Leverage composition over inheritance
- Use TypeScript for prop definitions

Example:
```tsx
// UserProfile.tsx
interface UserProfileProps {
  user: User;
  onUpdate?: (user: User) => void;
  isEditable?: boolean;
}

export function UserProfile({ user, onUpdate, isEditable = false }: UserProfileProps) {
  // Implementation
}
```

### React Best Practices

- Use hooks for state and side effects
- Prefer controlled components for forms
- Memoize expensive calculations with useMemo
- Optimize callbacks with useCallback when appropriate
- Avoid state when props are sufficient
- Use component composition for flexibility
- Implement proper error boundaries
- Consider performance for lists and large datasets

### Styling Guidelines

- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Use design tokens for consistency
- Avoid inline styles except for dynamic values
- Organize Tailwind classes logically:
  1. Layout (display, position)
  2. Box model (width, height, padding, margin)
  3. Typography (font, text)
  4. Visual (colors, backgrounds, borders)
  5. Other (shadows, opacity, transitions)

Example:
```tsx
<div className="
  flex items-center justify-between 
  w-full p-4 mb-4 
  text-lg font-medium 
  bg-white border border-gray-200 rounded-lg 
  shadow-sm hover:bg-gray-50
">
  Content
</div>
```

## Backend Standards

### API Design

- Follow RESTful principles
- Use consistent URL patterns
- Implement proper status codes
- Structure responses consistently
- Include comprehensive error handling
- Document APIs with OpenAPI/Swagger
- Validate inputs thoroughly
- Paginate large result sets

Example:
```typescript
/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
export async function getUserById(request, reply) {
  const { id } = request.params;
  
  try {
    const user = await userService.getUserById(id);
    
    if (!user) {
      return reply.code(404).send({
        data: null,
        errors: [{ code: 'USER_NOT_FOUND', message: 'User not found' }]
      });
    }
    
    return reply.code(200).send({
      data: user,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}
```

### Data Access

- Use repository pattern for database access
- Implement proper database transactions
- Apply query optimization techniques
- Handle errors gracefully
- Use parameterized queries to prevent SQL injection
- Implement proper data validation

### Error Handling

- Use custom error classes
- Include error codes for client interpretation
- Provide meaningful error messages
- Log errors appropriately
- Avoid exposing sensitive information in errors
- Handle different error types appropriately

Example:
```typescript
export class AppError extends Error {
  constructor(
    public message: string, 
    public code: string, 
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with ID ${id} not found` 
      : `${resource} not found`;
    super(message, 'RESOURCE_NOT_FOUND', 404);
  }
}
```

## Testing Standards

### Unit Testing

- Test one unit of functionality at a time
- Mock dependencies
- Focus on behavior, not implementation details
- Cover edge cases and error scenarios
- Keep tests fast and isolated
- Use descriptive test names

Example:
```typescript
describe('PointsService', () => {
  describe('awardPoints', () => {
    it('should award points when user exists and amount is valid', async () => {
      // Arrange
      const mockUserRepo = { getUserById: jest.fn().mockResolvedValue({ id: 'user1' }) };
      const mockPointsRepo = { addPointsTransaction: jest.fn() };
      const service = new PointsService(mockUserRepo, mockPointsRepo);
      
      // Act
      await service.awardPoints('user1', 100, 'test');
      
      // Assert
      expect(mockPointsRepo.addPointsTransaction).toHaveBeenCalledWith({
        userId: 'user1',
        amount: 100,
        source: 'test'
      });
    });
    
    it('should throw an error when user does not exist', async () => {
      // Arrange
      const mockUserRepo = { getUserById: jest.fn().mockResolvedValue(null) };
      const mockPointsRepo = { addPointsTransaction: jest.fn() };
      const service = new PointsService(mockUserRepo, mockPointsRepo);
      
      // Act & Assert
      await expect(service.awardPoints('nonexistent', 100, 'test'))
        .rejects.toThrow('User not found');
    });
  });
});
```

### Integration Testing

- Test component interactions
- Use real dependencies when possible
- Test API endpoints
- Verify database interactions
- Focus on critical paths and user flows

### E2E Testing

- Test complete user flows
- Focus on critical business processes
- Test across different browsers
- Include mobile device testing
- Verify key functionality works end-to-end

## Git Workflow Standards

### Branches

- `main`: Production-ready code
- `develop`: Integration branch for new features
- `feature/*`: New features
- `fix/*`: Bug fixes
- `release/*`: Release preparation
- `hotfix/*`: Critical production fixes

### Commit Messages

Follow conventional commits format:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation updates
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Test additions or corrections
- `chore`: Build process or tool changes

Example:
```
feat(points): implement daily points cap system

- Add daily limit configuration
- Implement tracking of daily points
- Add validation in points service

Closes #123
```

### Pull Requests

- Create descriptive PR titles
- Include adequate description of changes
- Reference related issues
- Keep PRs focused and reasonably sized
- Ensure all tests pass
- Obtain required reviews
- Address review comments

## Documentation Standards

### Code Documentation

- Document public APIs and interfaces
- Add comments for complex logic
- Use JSDoc format for function documentation
- Keep comments up-to-date with code changes
- Avoid obvious comments that add no value

Example:
```typescript
/**
 * Award points to a user for a specific activity
 * 
 * @param userId - ID of the user receiving points
 * @param amount - Number of points to award (must be positive)
 * @param source - Source or reason for the points
 * @returns Object containing success status and new balance
 * @throws {NotFoundError} If user does not exist
 * @throws {ValidationError} If amount is not positive
 */
async function awardPoints(
  userId: string, 
  amount: number, 
  source: PointsSource
): Promise<PointsResult> {
  // Implementation
}
```

### Project Documentation

- Keep README files up-to-date
- Document architecture decisions
- Provide clear setup instructions
- Include usage examples
- Document API endpoints
- Maintain changelog
- Use diagrams for complex systems

## Performance Standards

### Frontend Performance

- Optimize bundle size
- Implement code splitting
- Lazy load components when appropriate
- Optimize images and assets
- Monitor and improve Core Web Vitals
- Implement proper caching strategies
- Use performance measurement tools

### Backend Performance

- Optimize database queries
- Implement proper indexes
- Use caching for frequent operations
- Optimize API response times
- Monitor memory usage
- Implement connection pooling
- Use asynchronous processing for long-running tasks

## Accessibility Standards

- Follow WCAG 2.1 AA standards
- Use semantic HTML
- Provide alternative text for images
- Ensure keyboard navigation
- Maintain proper focus management
- Use ARIA attributes appropriately
- Test with screen readers
- Ensure sufficient color contrast
- Support text resizing
- Respect user preferences (reduced motion, etc.)

Example:
```jsx
// Good
<button 
  type="button"
  onClick={handleClick}
  aria-label="Close dialog"
  disabled={isDisabled}
>
  <span className="sr-only">Close</span>
  <CloseIcon />
</button>

// Bad
<div 
  className="button" 
  onClick={handleClick}
>
  <CloseIcon />
</div>
```

## Security Standards

- Validate all inputs
- Sanitize data before rendering
- Implement proper authentication and authorization
- Use HTTPS for all communications
- Follow OWASP security guidelines
- Keep dependencies updated
- Handle sensitive data properly
- Implement rate limiting
- Use security headers
- Conduct security testing

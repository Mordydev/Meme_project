# Success Kid Community Platform - Backend

## Database & Storage Architecture

This document provides information about the database and storage architecture implemented for the Success Kid Community Platform.

### Database Configuration

The platform uses two main data stores:

1. **PostgreSQL** - Primary relational database
   - Used for storing user data, content, points, achievements, etc.
   - Connection pooling for efficient database operations
   - Repository pattern for clean data access abstraction

2. **Redis** - In-memory data store
   - Used for caching, pub/sub, and session management
   - Fast key-value operations for high-performance features
   - Supports real-time features and websocket communication

### Environment Configuration

Database configuration is managed through environment variables:

```env
# PostgreSQL configuration
DATABASE_URL=postgresql://dev:dev@localhost:5432/successKidPlatform
DATABASE_POOL_SIZE=20  # Optional, defaults to 20

# Redis configuration
REDIS_URL=redis://localhost:6379
```

### Schema Migration

Database schema is managed through SQL migration files in the `migrations` directory:

- `001_initial_schema.sql` - Initial schema with core tables
- More migration files will be added as the schema evolves

To run migrations:

```bash
# Run all pending migrations
npm run migrate

# Create a new migration file (replace my_migration_name with a descriptive name)
npm run migrate:create my_migration_name
```

### Data Models

The platform includes the following core data models:

- **Users** - Core user information
- **Profiles** - Extended user information
- **WalletConnections** - Connected cryptocurrency wallets
- **Content** - User-created content (posts, etc.)
- **Comments** - Responses to content
- **UserPoints** - Success Points earned by users
- **Achievements** - Predefined and user achievements
- **ContentReactions** - Likes, upvotes, reactions
- **Referrals** - User referral tracking

### Repository Pattern

Data access is implemented using the repository pattern:

- **BaseRepository** - Abstract base class with common CRUD operations
- **UserRepository** - User-specific data access
- Additional repositories for other entities

Example usage:

```typescript
import { createUserRepository } from './repositories';

const userRepo = createUserRepository();
const user = await userRepo.findById('user-123');
```

### Health Monitoring

Database health can be monitored through the health API endpoint:

```
GET /api/v1/health
```

Example response:

```json
{
  "status": "healthy",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "checks": {
    "postgres": "connected",
    "redis": "connected"
  }
}
```

### Best Practices

When working with the database:

1. Use repositories for all data access
2. Use transactions for multi-operation consistency
3. Implement proper error handling
4. Follow the established patterns for new features
5. Add indexes for frequently queried fields
6. Create migration files for all schema changes
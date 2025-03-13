# Backend Architecture

This document outlines the architecture of the Success Kid Community Platform backend application, built with Node.js and Fastify.

## Core Architecture

The backend is a Fastify application that provides RESTful API endpoints and WebSocket connections for real-time features.

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 22.3+ | Runtime environment |
| **Fastify** | 5.2+ | API framework |
| **TypeScript** | 5.4+ | Type safety |
| **PostgreSQL** | 17.2+ | Primary database |
| **Redis** | 8.2+ | Caching, pub/sub, job queues |
| **Clerk** | 5.3+ | Authentication |
| **Web3.js** | 4.0+ | Blockchain integration |

### Project Structure

```
apps/backend/
├── src/
│   ├── api/                  # API route handlers
│   │   ├── auth/             # Authentication endpoints
│   │   ├── content/          # Content management endpoints
│   │   ├── points/           # Points system endpoints
│   │   ├── users/            # User management endpoints
│   │   └── wallet/           # Wallet integration endpoints
│   ├── config/               # Application configuration
│   │   ├── app.ts            # App configuration
│   │   └── env.ts            # Environment variables
│   ├── lib/                  # Shared utilities and helpers
│   │   ├── errors.ts         # Error handling
│   │   └── logger.ts         # Logging utilities
│   ├── middleware/           # HTTP middleware
│   │   ├── auth.ts           # Authentication middleware
│   │   └── validation.ts     # Request validation
│   ├── models/               # Data models and schemas
│   │   ├── content.ts        # Content models
│   │   ├── points.ts         # Points models
│   │   └── user.ts           # User models
│   ├── plugins/              # Fastify plugins
│   │   ├── cors.ts           # CORS configuration
│   │   ├── jwt.ts            # JWT authentication
│   │   ├── swagger.ts        # API documentation
│   │   └── websocket.ts      # WebSocket support
│   ├── repositories/         # Data access layer
│   │   ├── content-repo.ts   # Content data access
│   │   ├── points-repo.ts    # Points data access
│   │   └── user-repo.ts      # User data access
│   ├── services/             # Business logic services
│   │   ├── content-service.ts # Content management
│   │   ├── points-service.ts  # Points management
│   │   └── wallet-service.ts  # Wallet integration
│   ├── websockets/           # WebSocket handlers
│   │   ├── connection.ts     # Connection management
│   │   ├── notifications.ts  # Notification broadcasting
│   │   └── points.ts         # Points real-time updates
│   └── app.ts                # Fastify app setup
├── migrations/               # Database migrations
└── openapi/                  # OpenAPI definitions
```

## Key Architecture Decisions

### API Design Philosophy

We follow RESTful API design principles with these characteristics:

1. **Resource-Oriented:** Endpoints are organized around resources
2. **Consistent Patterns:** Apply the same patterns across all endpoints
3. **Self-Documenting:** Use descriptive names that reveal purpose
4. **Versioned:** API routes include version (`/api/v1/resource`)
5. **Validated:** Input validation using JSON Schema
6. **Performance-Oriented:** Optimized payload size and response time

### Request/Response Standards

**Request Format**
```json
{
  "data": {
    // Request payload
  },
  "meta": {
    // Additional metadata (optional)
  }
}
```

**Success Response Format**
```json
{
  "data": {
    // Response payload
  },
  "meta": {
    "timestamp": "2025-03-12T12:00:00Z",
    "requestId": "req_123456"
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

**Error Response Format**
```json
{
  "data": null,
  "meta": {
    "timestamp": "2025-03-12T12:00:00Z",
    "requestId": "req_123456"
  },
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "The provided input is invalid",
      "details": [
        {
          "field": "amount",
          "message": "Amount must be a positive number"
        }
      ]
    }
  ]
}
```

### Authentication Flow

We use Clerk for authentication:

1. Client authenticates with Clerk
2. Backend verifies JWT tokens from Clerk
3. User ID is extracted from the JWT
4. Middleware enforces authentication requirements
5. Route handlers access the authenticated user ID

### Data Access Layer

We implement a repository pattern to abstract database operations:

1. **Repositories:** Handle data access and storage
2. **Services:** Implement business logic using repositories
3. **API Routes:** Handle HTTP requests and delegate to services

Example:
```typescript
// Repository Layer
export class PointsRepository {
  async getUserPointsTotal(userId: string): Promise<number> {
    const result = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM user_points WHERE user_id = $1',
      [userId]
    );
    return Number(result.rows[0].total);
  }
  
  async addPointsTransaction(transaction: PointsTransaction): Promise<PointsTransaction> {
    // Database operation
  }
}

// Service Layer
export class PointsService {
  constructor(private pointsRepository: PointsRepository) {}
  
  async awardPoints(userId: string, amount: number, source: string): Promise<PointsResult> {
    // Validation and business logic
    // Call repository methods
    return result;
  }
}

// API Route Layer
export async function awardPointsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = request.user;
  const { amount, source } = request.body.data;
  
  const pointsService = request.diContainer.resolve('pointsService');
  const result = await pointsService.awardPoints(userId, amount, source);
  
  return reply.code(200).send({
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: request.id
    }
  });
}
```

### Background Processing

For asynchronous operations, we use a job queue system:

1. **Job Queues:** Redis-based queues for handling background jobs
2. **Producers:** Enqueue jobs for asynchronous processing
3. **Consumers:** Process jobs in the background

Example:
```typescript
// Job queue configuration
import Queue from 'bull';

const pointsProcessingQueue = new Queue('points-processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD
  }
});

// Job producer
export async function schedulePointsRedemption(userId: string, amount: number): Promise<string> {
  const job = await pointsProcessingQueue.add(
    'redemption',
    { 
      userId, 
      amount,
      requestedAt: new Date().toISOString()
    }
  );
  
  return job.id;
}

// Job consumer
pointsProcessingQueue.process('redemption', async (job) => {
  const { userId, amount } = job.data;
  
  // Process the job
});
```

### Real-time Communication

We use WebSockets for real-time features:

1. **Connection Management:** Track active connections
2. **Channel Subscriptions:** Allow clients to subscribe to specific events
3. **Pub/Sub:** Use Redis for distributing events across servers
4. **Authentication:** Validate WebSocket connections

Example:
```typescript
// WebSocket handler
export default async function websocketPlugin(fastify: FastifyInstance) {
  fastify.register(require('@fastify/websocket'));
  
  fastify.get('/ws', { websocket: true }, (connection, request) => {
    const userId = authenticateWebsocketConnection(request);
    if (!userId) {
      connection.socket.close();
      return;
    }
    
    connectionRegistry.add(userId, connection.socket);
    
    connection.socket.on('message', (message) => {
      // Handle messages
    });
    
    connection.socket.on('close', () => {
      connectionRegistry.remove(userId, connection.socket);
    });
  });
}

// Broadcasting events
export function broadcastToUser(userId: string, event: string, data: any) {
  const userConnections = connectionRegistry.getUserConnections(userId);
  
  userConnections.forEach(socket => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  });
}
```

## Performance Optimization

### Database Optimization

- Connection pooling for efficient database usage
- Query optimization for high-volume operations
- Indexing strategy for common access patterns
- Prepared statements for security and performance

### Caching Strategy

- Redis caching for frequently accessed data
- Cache invalidation strategy for data mutations
- Stale-while-revalidate pattern for fresh data
- Request-level caching for repeated operations

### API Performance

- Response time targets (<200ms for most operations)
- Payload size optimization with selection parameters
- Batched operations for bulk data changes
- Rate limiting for API abuse prevention

## Security Measures

### API Security

- Input validation for all request data
- Rate limiting to prevent abuse
- CORS configuration for browser security
- Security headers (HSTS, CSP, etc.)

### Data Protection

- Parameterized queries to prevent SQL injection
- Data encryption for sensitive information
- Access control based on user permissions
- Audit logging for security events

## Related Documentation

- [Frontend Architecture](./frontend.md)
- [Database Schema](./database-schema.md)
- [API Documentation](http://localhost:3001/documentation)

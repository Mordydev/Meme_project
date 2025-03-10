# Wild 'n Out Meme Coin Platform: Backend Guidelines

## Document Purpose and Strategic Vision

This document serves as the definitive reference for backend development standards on the Wild 'n Out Meme Coin Platform. It provides actionable guidance directly supporting our business objectives of achieving market cap progression ($10M → $50M → $100M → $500M+) through technical excellence and reliability.

Each guideline, pattern, and standard in this document is explicitly connected to key business metrics to ensure technical decisions directly support platform growth, community engagement, and token value appreciation.

**Implementation Priority Key:**
- **[CRITICAL]** - Implement immediately; essential for platform stability and growth
- **[HIGH]** - Implement within 1-2 sprints; significant business impact
- **[STANDARD]** - Implement as part of regular development; important for consistency

## 1. Strategic Foundation

### 1.1 Business Impact Analysis

| Business Objective | Backend Strategy | Measurable Impact | Priority |
|-------------------|-------------------|-------------------|----------|
| Achieve $10M → $50M → $100M → $500M+ market cap progression | Implement scalable, reliable infrastructure with high-performance API responses and real-time data capabilities | • Market cap growth rate<br>• System uptime (99.9%+)<br>• API response times (<200ms) | Critical |
| Build community with 30%+ DAU/MAU ratio | Create robust real-time battle systems, achievement processing, and social features with sub-second response times | • Daily/weekly active users<br>• Real-time feature reliability<br>• Feature response times | High |
| Drive content creation from 20% of users | Develop reliable content storage, optimized media handling, and efficient moderation systems | • Content creation rate<br>• Media processing speed<br>• Moderation queue processing time | High | 
| Achieve 25%+ wallet connection rate | Build secure, reliable blockchain integration with transparent transaction tracking | • Wallet connection success rate<br>• Blockchain transaction reliability<br>• Token data accuracy | Medium |
| Build 45% Day 7 retention | Implement high-performance achievement systems, notification delivery, and personalized experiences | • Feature reliability metrics<br>• Notification delivery rates<br>• System response times | Critical |

### 1.2 System Quality Requirements

| Quality Attribute | Business Impact | Key Requirements | Implementation Priority |
|-----------------|-----------------|------------------|------------------------|
| **Reliability** | Directly affects user trust, platform reputation, and transaction confidence | • 99.9% uptime for core services<br>• Error rate <0.1% for critical operations<br>• MTTR <10 minutes for core services | **[CRITICAL]** |
| **Performance** | Impacts user experience, engagement metrics, and operational costs | • API response time <200ms (95th percentile)<br>• Database query execution <50ms for common operations<br>• Real-time updates <500ms latency | **[CRITICAL]** |
| **Scalability** | Enables business growth and supports marketing initiatives | • Support for 5,000+ concurrent users at launch<br>• Scale to 100,000+ concurrent users within 6 months<br>• Linear cost scaling with user growth | **[HIGH]** |
| **Security** | Protects user assets, data, and platform integrity | • Zero critical security vulnerabilities<br>• 100% compliance with authentication standards<br>• Complete audit trail for sensitive operations | **[CRITICAL]** |

## 2. Technology Stack and Architecture

### 2.1 Core Technologies

| Technology | Version | Purpose | Selection Rationale | Evolution Plan | Priority |
|------------|---------|---------|---------------------|----------------|----------|
| **Node.js** | 22.3+ | Runtime environment | Excellent performance for I/O-intensive operations, large ecosystem, developer familiarity | Monitor for LTS releases, evaluate Bun.js for specific services | **[CRITICAL]** |
| **Fastify** | 5.2+ | API framework | High-performance, low overhead, extensive plugin ecosystem, TypeScript support | Maintain latest version, evaluate future major releases | **[CRITICAL]** |
| **TypeScript** | 5.4+ | Type safety | Reduced runtime errors, better IDE support, improved maintainability | Track new language features, maintain strict type checking | **[CRITICAL]** |
| **PostgreSQL** | 17.2+ | Primary database | Robust relational database with JSON support, reliability, complex query capability | Evaluate cloud-native options for specific workloads | **[CRITICAL]** |
| **Redis** | 8.2+ | Caching, pub/sub | High-performance caching, real-time messaging, session storage | Monitor for new data structures and capabilities | **[CRITICAL]** |
| **Supabase** | Latest | Database service | Simplified PostgreSQL management, real-time capabilities, reduced operational burden | Evaluate managed vs. self-hosted for cost optimization | **[HIGH]** |
| **Clerk** | Latest | Authentication | Comprehensive auth solution, multiple providers, security best practices | Track for new security features, evaluate self-hosted options | **[HIGH]** |
| **Web3.js** | 4.0+ | Blockchain integration | Industry-standard for blockchain integration, Solana compatibility | Monitor for new Web3 standards and alternatives | **[HIGH]** |

### 2.2 Key Architectural Decisions

#### Server Architecture: Fastify with Node.js

**Decision**: Use Fastify on Node.js for all API services.

**Options Considered**: 
- Express.js (lower performance, larger ecosystem)
- Nest.js (higher structure, more opinionated)
- Hono (newer, less mature)

**Rationale**: Fastify provides the best balance of performance, developer experience, and ecosystem support. Its plugin architecture and TypeScript support align well with our development practices.

**Business Impact**: Directly supports API performance requirements (200ms response times) critical for 30%+ DAU/MAU ratio and 45% Day 7 retention targets.

**Implementation Priority**: **[CRITICAL]**

#### Database: Supabase (PostgreSQL)

**Decision**: Use Supabase as our primary database with PostgreSQL.

**Options Considered**:
- MongoDB (document database, less structured)
- Firebase (proprietary, less control)
- Raw PostgreSQL (more management overhead)

**Rationale**: Supabase provides a managed PostgreSQL service with additional features like real-time subscriptions, built-in authentication, and simplified operations.

**Business Impact**: Supports content creation targets (20% of users) through reliable data storage and real-time capabilities needed for battle systems.

**Implementation Priority**: **[HIGH]**

#### API Design: REST with WebSockets

**Decision**: Implement RESTful API design with WebSockets for real-time features.

**Options Considered**:
- GraphQL (more flexible queries, more complex)
- gRPC (higher performance, steeper learning curve)
- Pure WebSockets (less standardized, more complex state management)

**Rationale**: REST provides a familiar, well-understood pattern with excellent tooling and documentation support, while WebSockets enable real-time requirements.

**Business Impact**: Enables real-time battle and community features critical for 30%+ DAU/MAU ratio.

**Implementation Priority**: **[CRITICAL]**

#### Authentication: Clerk

**Decision**: Use Clerk for authentication and user management.

**Options Considered**:
- Custom auth solution (more control, higher maintenance)
- Firebase Auth (limited customization)
- Auth0 (higher cost at scale)

**Rationale**: Clerk provides a comprehensive authentication solution with social login, MFA, and security best practices built-in, reducing development and maintenance burden.

**Business Impact**: Supports 25%+ wallet connection rate through streamlined authentication.

**Implementation Priority**: **[HIGH]**

## 3. Code Organization and Structure

### 3.1 Project Structure

```
backend/
├── src/
│   ├── api/                   # API route handlers
│   │   ├── battles/           # Battle-related endpoints
│   │   ├── content/           # Content management endpoints
│   │   ├── users/             # User management endpoints
│   │   ├── token/             # Token and wallet endpoints
│   ├── services/              # Business logic services
│   ├── repositories/          # Data access layer
│   ├── models/                # Data models and schemas
│   ├── lib/                   # Shared utilities
│   ├── websockets/            # WebSocket handlers
│   ├── jobs/                  # Background jobs
│   ├── middleware/            # HTTP middleware
│   ├── config/                # Application configuration
```

### 3.2 Module Boundaries

**Critical Principles**: **[HIGH]**

1. **Clear Responsibility Separation**:
   - API Layer: Request handling, validation, response formatting
   - Service Layer: Business logic, orchestration, rules enforcement
   - Repository Layer: Data access, persistence, query optimization
   - Model Layer: Data structure definition, validation rules

2. **Dependency Direction**:
   - Dependencies flow downward: API → Service → Repository → Models
   - Lower layers must not import from higher layers
   - Circular dependencies are strictly prohibited

3. **Interface-Based Design**:
   - Each module exposes clear interfaces via index.ts exports
   - Implementation details remain private to the module
   - Testing leverages interfaces for proper mocking

## 4. API Design and Standards

### 4.1 API Design Principles

**Critical Principles**: **[CRITICAL]**

1. **Resource-Oriented**: Design APIs around business domain resources, not actions
2. **Consistent Patterns**: Apply consistent patterns for all endpoints
3. **Predictable Behavior**: Use HTTP methods and status codes conventionally
4. **Self-Documenting**: Design APIs to be easily understood without extensive documentation
5. **Secure by Default**: Implement proper authentication and authorization

### 4.2 Request/Response Format

**Standard Request Format**:

```json
{
  "title": "Freestyle Battle",
  "description": "Show your best freestyle skills",
  "type": "wild-style",
  "startTime": "2025-03-15T18:00:00Z",
  "endTime": "2025-03-15T20:00:00Z",
  "rules": {
    "submissionTimeLimit": 60,
    "maxParticipants": 20
  }
}
```

**Standard Response Format**:

```json
{
  "data": {
    "id": "123",
    "title": "Freestyle Battle",
    "description": "Show your best freestyle skills",
    "type": "wild-style",
    "startTime": "2025-03-15T18:00:00Z",
    "endTime": "2025-03-15T20:00:00Z",
    "status": "active",
    "participantCount": 12
  },
  "meta": {
    "requestId": "req-uuid",
    "timestamp": "2025-03-06T12:00:00Z"
  }
}
```

**Error Response Format**: **[CRITICAL]**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "startTime",
        "message": "Start time must be in the future"
      }
    ]
  },
  "meta": {
    "requestId": "req-uuid",
    "timestamp": "2025-03-06T12:00:00Z"
  }
}
```

### 4.3 API Implementation Example

```typescript
// src/api/battles/create-battle.ts
import { FastifyInstance } from 'fastify';
import { createBattle } from '../../services/battle-service';
import { createBattleSchema } from './schemas';
import { authenticate } from '../../middleware/auth';

export default async function (fastify: FastifyInstance) {
  fastify.post(
    '/api/battles',
    {
      schema: {
        body: createBattleSchema,
        response: {
          201: { /* success response schema */ }
        }
      },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      // Business logic delegated to service
      const result = await createBattle(
        request.user.id,
        request.body
      );
      
      return reply.code(201).send({ data: result });
    }
  );
}
```

## 5. Data Model and Storage

### 5.1 Schema Design Principles

**Critical Principles**: **[HIGH]**

1. **Normalization Balance**: Normalize for data integrity but denormalize when performance requires
2. **Clear Relationships**: Define explicit relationships with proper constraints
3. **Appropriate Indexes**: Create indexes based on query patterns
4. **Audit Columns**: Include creation and update timestamps on all tables

### 5.2 Query Optimization Patterns

**Prioritized Patterns**: **[HIGH]**

#### 1. Indexed Filtering

```sql
-- Good: Uses indexes
SELECT * FROM battles WHERE status = 'active' AND format_type = 'wildstyle';

-- Bad: Function on indexed column prevents index usage
SELECT * FROM battles WHERE LOWER(status) = 'active';
```

#### 2. Efficient Pagination

```typescript
// Keyset pagination for optimal performance
async function getBattlesPaginated(lastSeenId, lastSeenTime, limit = 20) {
  const result = await db.query(
    `SELECT * FROM battles 
     WHERE (created_at, id) < ($1, $2)
     ORDER BY created_at DESC, id DESC
     LIMIT $3`,
    [lastSeenTime, lastSeenId, limit]
  );
  
  return result.rows;
}
```

#### 3. N+1 Query Prevention

```typescript
// Good: Single query with join
async function getBattlesWithCreator() {
  const { data } = await supabase
    .from('battles')
    .select(`
      *,
      creator:users(id, username, display_name)
    `);
    
  return data.map(item => ({
    ...mapBattleToModel(item),
    creator: item.creator ? mapUserToModel(item.creator) : null
  }));
}
```

## 6. Authentication and Authorization

### 6.1 Authentication Implementation

**Critical Implementations**: **[CRITICAL]**

```typescript
// src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { clerkClient, getAuth } from '@clerk/fastify';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return reply.code(401).send({
        error: {
          code: 'unauthorized',
          message: 'Authentication required'
        }
      });
    }
    
    // Add userId to request for downstream handlers
    request.userId = userId;
    
    // Optional: Fetch additional user data
    const user = await clerkClient.users.getUser(userId);
    request.user = user;
    
  } catch (error) {
    request.log.error(error, 'Authentication error');
    return reply.code(401).send({
      error: {
        code: 'unauthorized',
        message: 'Invalid authentication'
      }
    });
  }
}
```

### 6.2 Security Headers and Protection

**Implementation Priority**: **[CRITICAL]**

```typescript
// src/plugins/security.ts
import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

export async function setupSecurity(fastify: FastifyInstance) {
  // Setup security headers with Helmet
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://*.clerk.accounts.dev", "https://*.supabase.co"]
      }
    }
  });
  
  // Setup rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.headers['x-forwarded-for'] || 
             request.ip || 
             'unknown';
    },
    errorResponseBuilder: (request, context) => {
      return {
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many requests, please try again later',
          details: {
            limit: context.max,
            remaining: context.remaining,
            reset: new Date(Date.now() + context.ttl).toISOString()
          }
        }
      };
    }
  });
  
  // Add CSRF protection for sensitive routes
  await fastify.register(async (instance) => {
    instance.addHook('onRequest', (request, reply, done) => {
      // Skip GET/HEAD requests
      if (['GET', 'HEAD'].includes(request.method)) {
        return done();
      }
      
      const csrfToken = request.headers['x-csrf-token'];
      const storedToken = request.session?.csrfToken;
      
      if (!csrfToken || csrfToken !== storedToken) {
        return reply.code(403).send({
          error: {
            code: 'invalid_csrf_token',
            message: 'Invalid or missing CSRF token'
          }
        });
      }
      
      done();
    });
  });
}
```

## 7. Error Handling and Logging

### 7.1 Error Categorization System

**Implementation Priority**: **[CRITICAL]**

| Error Category | HTTP Status | Business Impact | Example |
|----------------|-------------|-----------------|---------|
| **Validation Errors** | 400 | Low - Client issue, not affecting other users | Missing required field, Invalid format |
| **Authentication Errors** | 401 | Medium - May indicate security threats or user experience issues | Invalid token, Expired session |
| **Authorization Errors** | 403 | Medium - Potential security breach attempts | Insufficient privileges, Resource access denied |
| **Resource Errors** | 404 | Low - Client issue, generally benign | Invalid ID, Deleted resource |
| **Conflict Errors** | 409 | Medium - Data integrity concerns | Duplicate username, Concurrent update |
| **Rate Limit Errors** | 429 | Medium - Potential DoS or misuse | Exceeded API call limit |
| **Server Errors** | 500 | Critical - Affects all users, damages trust | Unhandled exception, Database failure |
| **Dependency Errors** | 502/503 | High - Widespread impact, affects key features | Blockchain service unavailable |

### 7.2 Centralized Error Handler

**Implementation Priority**: **[CRITICAL]**

```typescript
// src/middleware/error-handler.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { ValidationError, AuthError, NotFoundError } from '../errors';
import { logger } from '../lib/logger';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.id;
  
  // Log error with context
  logger.error({
    err: error,
    req: {
      id: requestId,
      method: request.method,
      url: request.url,
      path: request.routerPath,
      params: request.params,
      query: request.query
    }
  }, error.message);
  
  // Handle validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: 'validation_error',
        message: 'Invalid request parameters',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      },
      meta: { requestId }
    });
  }
  
  // Handle business errors
  if (error instanceof ValidationError) {
    return reply.status(400).send({
      error: {
        code: 'validation_error',
        message: error.message,
        details: error.details
      },
      meta: { requestId }
    });
  }
  
  if (error instanceof AuthError) {
    return reply.status(401).send({
      error: {
        code: 'unauthorized',
        message: error.message
      },
      meta: { requestId }
    });
  }
  
  if (error instanceof NotFoundError) {
    return reply.status(404).send({
      error: {
        code: 'not_found',
        message: error.message,
        resource: error.resource
      },
      meta: { requestId }
    });
  }
  
  // Default handler for unexpected errors
  const statusCode = error.statusCode || 500;
  
  // Don't expose details in production
  const errorMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : error.message;
  
  return reply.status(statusCode).send({
    error: {
      code: error.code || 'internal_error',
      message: errorMessage
    },
    meta: { requestId }
  });
}
```

## 8. Performance and Optimization

### 8.1 Performance Requirements

| Operation | Target Response Time | Business Impact | Implementation Priority |
|-----------|----------------------|-----------------|-------------------------|
| API Endpoints | <200ms (95th percentile) | Direct impact on user retention and engagement | **[CRITICAL]** |
| Database Queries | <50ms (95th percentile) | Affects system throughput and scalability | **[HIGH]** |
| Battle Creation | <500ms (end-to-end) | Influences content creator satisfaction | **[HIGH]** |
| Content Submission | <1s (including media) | Critical for 20% content creation target | **[HIGH]** |
| WebSocket Messages | <100ms latency | Essential for real-time engagement | **[CRITICAL]** |

### 8.2 Adaptive Caching Strategy

**Implementation Priority**: **[HIGH]**

```typescript
// src/lib/adaptive-cache.ts
import { Redis } from 'ioredis';
import { getSystemStatus } from '../monitoring/system-status';

// Cache TTL multipliers based on system status
const TTL_MULTIPLIERS = {
  HEALTHY: 1,    // Normal TTL
  DEGRADED: 2,   // Double TTL to reduce load
  CRITICAL: 5    // 5x TTL during critical periods
};

export class AdaptiveCache {
  constructor(
    private redis: Redis,
    private baseTtl = 60, // default 60 seconds
    private prefix = 'cache:'
  ) {}
  
  // Get effective TTL based on system status
  private async getEffectiveTtl(): Promise<number> {
    const status = await getSystemStatus();
    return this.baseTtl * TTL_MULTIPLIERS[status];
  }
  
  // Get or compute a cached value
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    options: { forceFresh?: boolean } = {}
  ): Promise<T> {
    const cacheKey = `${this.prefix}${key}`;
    
    // Skip cache if force fresh is requested
    if (options.forceFresh) {
      const value = await compute();
      await this.set(key, value);
      return value;
    }
    
    try {
      // Try to get from cache
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Compute fresh value
      const value = await compute();
      
      // Store in cache with adaptive TTL
      await this.set(key, value);
      
      return value;
    } catch (error) {
      // If cache access fails, compute directly
      return compute();
    }
  }
  
  // Store value with adaptive TTL
  async set<T>(key: string, value: T): Promise<void> {
    const cacheKey = `${this.prefix}${key}`;
    const ttl = await this.getEffectiveTtl();
    
    try {
      await this.redis.set(cacheKey, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      // Log but don't throw - caching is non-critical
      console.error('Cache set failed:', error);
    }
  }
  
  // Invalidate cached value
  async invalidate(key: string): Promise<void> {
    const cacheKey = `${this.prefix}${key}`;
    try {
      await this.redis.del(cacheKey);
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  }
}
```

### 8.3 Circuit Breaker Implementation

**Implementation Priority**: **[HIGH]**

```typescript
// src/lib/circuit-breaker.ts
import { logger } from './logger';

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly resetTimeout: number;
  private readonly failureThreshold: number;
  
  constructor(
    private name: string,
    options: {
      failureThreshold: number;
      resetTimeout: number;
    }
  ) {
    this.resetTimeout = options.resetTimeout;
    this.failureThreshold = options.failureThreshold;
    
    logger.info({
      circuitName: this.name,
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout
    }, 'Circuit breaker initialized');
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.toHalfOpen();
      } else {
        throw new Error(`Circuit ${this.name} is open`);
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= 3) {
        this.reset();
      }
    }
  }
  
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.toOpen();
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      if (this.failureCount >= this.failureThreshold) {
        this.toOpen();
      }
    }
  }
  
  private toOpen(): void {
    if (this.state !== CircuitState.OPEN) {
      this.state = CircuitState.OPEN;
      this.failureCount = 0;
      this.successCount = 0;
      
      logger.warn({
        circuitName: this.name,
        lastFailureTime: new Date(this.lastFailureTime)
      }, 'Circuit breaker opened');
    }
  }
  
  private toHalfOpen(): void {
    if (this.state !== CircuitState.HALF_OPEN) {
      this.state = CircuitState.HALF_OPEN;
      this.failureCount = 0;
      this.successCount = 0;
      
      logger.info({
        circuitName: this.name
      }, 'Circuit breaker half-open');
    }
  }
  
  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    
    logger.info({
      circuitName: this.name
    }, 'Circuit breaker reset to closed state');
  }
}
```

## 9. Asynchronous Processing

### 9.1 Event-Driven Architecture

**Implementation Priority**: **[HIGH]**

```typescript
// src/events/event-bus.ts
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { logger } from '../lib/logger';

// Event types
export enum EventType {
  USER_REGISTERED = 'user.registered',
  CONTENT_CREATED = 'content.created',
  BATTLE_CREATED = 'battle.created',
  BATTLE_COMPLETED = 'battle.completed',
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked'
}

// Event handler type
type EventHandler = (data: any) => Promise<void>;

// Local event emitter
const localEmitter = new EventEmitter();

// Redis connection for pub/sub
const pubRedis = new Redis(process.env.REDIS_URL);
const subRedis = new Redis(process.env.REDIS_URL);

// Event handlers
const handlers: Record<string, EventHandler[]> = {};

// Register handler
export function on(event: EventType, handler: EventHandler) {
  if (!handlers[event]) {
    handlers[event] = [];
  }
  
  handlers[event].push(handler);
  localEmitter.on(event, handler);
  
  return () => off(event, handler);
}

// Remove handler
export function off(event: EventType, handler: EventHandler) {
  if (!handlers[event]) return;
  
  const index = handlers[event].indexOf(handler);
  if (index !== -1) {
    handlers[event].splice(index, 1);
    localEmitter.off(event, handler);
  }
}

// Emit event
export async function emit(event: EventType, data: any) {
  logger.debug({ event, data }, 'Emitting event');
  
  // Emit locally
  localEmitter.emit(event, data);
  
  // Publish to Redis
  await pubRedis.publish(
    `events:${event}`,
    JSON.stringify({ event, data, timestamp: Date.now() })
  );
}
```

### 9.2 Background Job Queue

**Implementation Priority**: **[HIGH]**

```typescript
// src/jobs/queue.ts
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '../lib/logger';

// Redis connection for queues
const queueRedis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

// Create job queue
export const jobQueue = new Queue('jobs', { 
  connection: queueRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

// Job types
export enum JobType {
  PROCESS_CONTENT = 'process_content',
  CHECK_ACHIEVEMENT = 'check_achievement',
  SEND_NOTIFICATION = 'send_notification',
  UPDATE_LEADERBOARD = 'update_leaderboard'
}

// Job processors
const processors: Record<JobType, (job: any) => Promise<any>> = {
  [JobType.PROCESS_CONTENT]: processContent,
  [JobType.CHECK_ACHIEVEMENT]: checkAchievement,
  [JobType.SEND_NOTIFICATION]: sendNotification,
  [JobType.UPDATE_LEADERBOARD]: updateLeaderboard
};

// Create worker
const worker = new Worker('jobs', async job => {
  logger.info({ jobId: job.id, jobName: job.name }, 'Processing job');
  
  const processor = processors[job.name as JobType];
  
  if (!processor) {
    throw new Error(`No processor found for job type: ${job.name}`);
  }
  
  return processor(job);
}, { connection: queueRedis });

// Handle worker events
worker.on('completed', (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, 'Job completed successfully');
});

worker.on('failed', (job, error) => {
  logger.error(
    { jobId: job?.id, jobName: job?.name, err: error },
    'Job failed'
  );
});

// Add job helper
export async function addJob(
  type: JobType,
  data: any,
  options: any = {}
) {
  return jobQueue.add(type, data, options);
}
```

## 10. Testing Strategy

### 10.1 Testing Levels

| Test Type | Coverage Target | Business Impact | Implementation Priority |
|-----------|-----------------|-----------------|-------------------------|
| Unit Tests | 80%+ of business logic | Prevents regression, ensures core functionality | **[CRITICAL]** |
| Integration Tests | 70%+ of API endpoints | Validates end-to-end flows, ensures system integration | **[HIGH]** |
| Performance Tests | Critical API paths | Ensures system meets response time requirements | **[HIGH]** |
| Security Tests | Authentication, authorization flows | Prevents security breaches and data leaks | **[CRITICAL]** |

### 10.2 Unit Testing Pattern

**Implementation Priority**: **[CRITICAL]**

```typescript
// src/services/battle-service.test.ts
import { getBattleById, createBattle } from './battle-service';
import { BattleRepository } from '../repositories/battle-repository';
import { BattleNotFoundError } from '../errors';

// Mock dependencies
jest.mock('../repositories/battle-repository');

describe('Battle Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getBattleById', () => {
    it('should return battle when found', async () => {
      // Arrange
      const mockBattle = { id: '123', title: 'Test Battle' };
      BattleRepository.prototype.findById = jest.fn().mockResolvedValue(mockBattle);
      
      // Act
      const result = await getBattleById('123');
      
      // Assert
      expect(result).toEqual(mockBattle);
      expect(BattleRepository.prototype.findById).toHaveBeenCalledWith('123');
    });
    
    it('should throw BattleNotFoundError when battle not found', async () => {
      // Arrange
      BattleRepository.prototype.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(getBattleById('123')).rejects.toThrow(BattleNotFoundError);
      expect(BattleRepository.prototype.findById).toHaveBeenCalledWith('123');
    });
  });
});
```

### 10.3 API Testing Pattern

**Implementation Priority**: **[HIGH]**

```typescript
// tests/integration/battle-api.test.ts
import { build } from '../helpers/server';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('Battle API Endpoints', () => {
  let app;
  let authToken;
  
  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
    
    // Build test server
    app = await build();
    
    // Get auth token for testing
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
    
    authToken = JSON.parse(loginResponse.payload).data.token;
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  describe('GET /api/v1/battles', () => {
    it('should return a list of battles', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/battles',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
```

## 11. Risk Assessment and Mitigation

### 11.1 Key Backend Risks

| Risk | Likelihood | Impact | Business Importance | Mitigation Strategy | Implementation Priority |
|------|------------|--------|---------------------|---------------------|-------------------------|
| **Performance Degradation** | High | High | Critical - directly impacts user experience and engagement metrics worth $250K+ monthly | • Implement performance monitoring<br>• Establish performance budgets<br>• Regular load testing<br>• Horizontal scaling capacity | **[CRITICAL]** |
| **Data Integrity Issues** | Medium | Critical | Critical - threatens the foundation of the platform and user trust | • Implement database constraints<br>• Validate at application layer<br>• Comprehensive transaction management<br>• Regular data integrity checks | **[CRITICAL]** |
| **Authentication Failures** | Medium | Critical | Critical - prevents users from accessing the platform | • Multiple auth providers<br>• Graceful fallbacks<br>• Circuit breakers for auth services<br>• Emergency access protocols | **[CRITICAL]** |
| **Real-time Feature Failures** | Medium | High | High - Battle system and real-time updates are core differentiators | • Circuit breaker implementation<br>• Fallback to polling when needed<br>• Clear error handling with recovery paths<br>• Comprehensive monitoring | **[HIGH]** |
| **Blockchain Integration Failures** | High | Medium | Medium - Affects token functionality but not core experience | • Retry mechanisms<br>• Multiple providers<br>• Graceful degradation<br>• Caching strategies | **[HIGH]** |

### 11.2 Transaction Management for Critical Operations

**Implementation Priority**: **[CRITICAL]**

```typescript
// src/lib/transaction.ts
import { Pool, PoolClient } from 'pg';
import { logger } from './logger';

export async function withTransaction<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error }, 'Transaction rolled back');
    throw error;
  } finally {
    client.release();
  }
}
```

## 12. Implementation Roadmap

### Phase 1: Foundation Establishment (2-4 weeks)

**Critical Deliverables**:

1. Technology stack selection and standardization
2. Error handling implementation with centralized handler
3. Core authentication and security implementation
4. Project structure and organization standards

**Key Dependencies**:
- Technical leadership alignment
- Development environment setup
- Initial team training

### Phase 2: Feature Implementation (1-2 months)

**Critical Deliverables**:

1. API design patterns and implementation
2. Data model and repository pattern implementation
3. Performance optimization with caching strategy
4. Asynchronous processing for background tasks

**Key Dependencies**:
- Phase 1 completion
- Database schema design
- Cloud infrastructure setup

### Phase 3: Scaling and Optimization (3+ months)

**Critical Deliverables**:

1. Enhanced monitoring and alerting
2. Advanced performance optimization
3. Comprehensive testing automation
4. Governance and maintenance procedures

**Key Dependencies**:
- Initial production deployment
- Real-world usage patterns
- Performance baseline establishment

### Success Criteria

1. **Technical Quality**: >95% compliance with critical standards in code reviews
2. **Performance**: API response times <200ms for 95% of requests
3. **Reliability**: 99.9% uptime for core services
4. **Security**: Zero critical vulnerabilities in security assessments
5. **Business Impact**: Directly supporting 30%+ DAU/MAU and 45% Day 7 retention targets
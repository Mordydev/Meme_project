# Success Kid Community Platform: Backend Implementation Guide

## 1. Strategic Foundation

### 1.1 Business-Driven Architecture

The backend architecture directly supports core business objectives through specific technical strategies:

| Business Objective | Technical Strategy | Success Metrics |
|-------------------|-------------------|-----------------|
| **User Engagement** | Real-time data synchronization with <200ms responses | 50+ daily contributions, 10+ min sessions |
| **Wallet Connections** | Reliable blockchain integration with fault tolerance | 25%+ wallet connection rate |
| **Points Redemption** | Secure transaction processing with audit trails | 20%+ weekly redemption rate |
| **Community Visibility** | Event-driven notifications and activity feeds | 40%+ users on leaderboards |
| **Mobile Engagement** | Optimized payloads and edge computing | Equal cross-device performance |

### 1.2 Quality Framework

| Attribute | Target | Implementation Approach | Measurement |
|-----------|--------|-------------------------|-------------|
| **Performance** | API: <200ms (p95)<br>WebSocket: <500ms latency | Query optimization, caching layers, async processing | Response time monitoring, synthetic tests |
| **Reliability** | 99.9%+ uptime<br>Zero data loss | Circuit breakers, graceful degradation, automated recovery | Uptime tracking, error rates |
| **Security** | Zero critical vulnerabilities | Input validation, encryption, authentication | Vulnerability scanning, penetration testing |
| **Scalability** | Support 10x user growth | Serverless architecture, stateless services, efficient queries | Load testing, resource utilization |

## 2. Technology Architecture

### 2.1 Core Stack

```
┌─────────────────────────────────────────────────────┐
│                   Client Applications                │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│                  Vercel Edge Runtime                 │
├─────────────────┬─────────────────┬─────────────────┤
│  Edge Functions │ Server Actions  │  API Routes     │
├─────────────────┴─────────────────┴─────────────────┤
│                Fastify Application Layer             │
├───────────────────────┬───────────────────────────┬─┤
│    Service Layer      │    Repository Layer       │C│
│  (Business Logic)     │    (Data Access)          │I│
├───────────────────────┴───────────────────────────┤/│
│                 Infrastructure Layer               │C│
├─────────────────┬────────────────┬─────────────────┤D│
│  Neon PostgreSQL│  Vercel Blob   │  Redis Cache    │ │
└─────────────────┴────────────────┴─────────────────┴─┘
```

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | 22.3+ | Server environment |
| API Framework | Fastify | 5.2+ | Backend API |
| Type System | TypeScript | 5.8+ | Type safety |
| Database | Neon PostgreSQL | Latest | Serverless database |
| ORM | Drizzle | 0.30+ | Type-safe data access |
| Caching/Messaging | Redis | 8.2+ | Cache, pub/sub, jobs |
| Authentication | Clerk | 5.3+ | Identity management |
| Blockchain | Web3.js | 4.0+ | Wallet integration |
| Storage | Vercel Blob | Latest | Media storage |
| Real-time | Socket.io | 4.6+ | WebSocket communication |

### 2.2 Architectural Patterns

#### Serverless-First Design
- **Edge Functions** for location-specific operations
- **Connection Pooling** for database efficiency
- **Stateless Services** enabling horizontal scaling
- **Distributed Caching** to minimize database load

#### API Architecture
- **RESTful Resources** for standard operations
- **WebSockets** for real-time notifications
- **Server Actions** for form submissions
- **Idempotent Operations** via transaction verification

#### Data Flow
- **Repository Pattern** for data access abstraction
- **Service Layer** for business logic encapsulation
- **Event-Driven Communication** for system integration
- **Background Processing** for computation-heavy tasks

## 3. Implementation Patterns

### 3.1 Project Structure

```
backend/
├── src/
│   ├── api/                  # API route handlers
│   ├── config/               # Application configuration
│   ├── lib/                  # Shared utilities
│   ├── middleware/           # HTTP middleware
│   ├── models/               # Data models and schemas
│   ├── repositories/         # Data access layer
│   ├── services/             # Business logic
│   ├── jobs/                 # Background processors
│   ├── websockets/           # WebSocket handlers
│   ├── storage/              # Blob storage handlers
│   └── app.ts                # Application entry
├── drizzle/                  # Database migrations
├── test/                     # Test files
└── package.json              # Dependencies
```

### 3.2 Data Model Implementation

```typescript
// Drizzle schema definition
import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  authProvider: text('auth_provider').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  status: text('status').notNull().default('active')
});

// User profiles with JSON for flexible data
export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  level: integer('level').notNull().default(1),
  title: text('title'),
  socialLinks: jsonb('social_links'),
  preferences: jsonb('preferences')
});

// Points transactions for core rewards system
export const userPoints = pgTable('user_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(),
  source: text('source').notNull(),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  description: text('description')
});
```

### 3.3 Data Access Pattern

```typescript
// Repository implementation with Drizzle ORM
import { eq, sum, desc } from 'drizzle-orm';
import { db } from '../lib/db';
import { userPoints } from '../schema';

export class PointsRepository {
  async getUserPointsTotal(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ total: sum(userPoints.amount) })
        .from(userPoints)
        .where(eq(userPoints.userId, userId));
      
      return result[0]?.total || 0;
    } catch (error) {
      logger.error('Failed to get user points total', { userId, error });
      throw new Error('Failed to get user points total');
    }
  }
  
  async addPointsTransaction(transaction: PointsTransaction): Promise<any> {
    try {
      return await db.insert(userPoints).values({
        userId: transaction.userId,
        amount: transaction.amount,
        source: transaction.source,
        referenceId: transaction.referenceId,
        description: transaction.description
      }).returning();
    } catch (error) {
      logger.error('Failed to add points transaction', { transaction, error });
      throw new Error('Failed to add points transaction');
    }
  }
  
  // Additional methods omitted for brevity
}
```

### 3.4 API Implementation

```typescript
// Route handler with service delegation
export async function awardPoints(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Extract and validate data
    const { userId, amount, source } = request.body.data;
    
    // Delegate to service layer
    const result = await pointsService.awardPoints(userId, amount, source);
    
    // Return standardized response
    return reply.code(200).send({
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    // Centralized error handling
    return handleApiError(request, reply, error);
  }
}
```

### 3.5 Service Implementation

```typescript
// Business logic in service layer
export class PointsService {
  constructor(
    private pointsRepository: PointsRepository,
    private securityService: SecurityService,
    private eventBus: EventBus
  ) {}
  
  async awardPoints(userId: string, amount: number, source: string): Promise<PointsResult> {
    // Validation
    if (amount <= 0) {
      throw new ValidationError('Points amount must be positive');
    }
    
    // Security checks
    if (await this.securityService.checkRateLimit(userId, 'points.award')) {
      throw new RateLimitExceededError('Rate limit exceeded for points award');
    }
    
    if (await this.securityService.checkForAnomalousActivity(userId, source, amount)) {
      await this.securityService.logSuspiciousActivity(userId, 'points.award', { amount, source });
      throw new SuspiciousActivityError('Suspicious activity detected');
    }
    
    // Check daily limits
    const dailyPointsFromSource = await this.pointsRepository.getDailyPointsBySource(userId, source);
    const sourceConfig = POINTS_CONFIG[source] || POINTS_CONFIG.default;
    
    if (dailyPointsFromSource + amount > sourceConfig.dailyLimit) {
      throw new DailyLimitExceededError(`Daily limit of ${sourceConfig.dailyLimit} for ${source} exceeded`);
    }
    
    // Award points
    await this.pointsRepository.addPointsTransaction({
      userId,
      amount,
      source,
      description: sourceConfig.description
    });
    
    // Get updated total
    const total = await this.pointsRepository.getUserPointsTotal(userId);
    
    // Publish event
    await this.eventBus.publish(EventType.POINTS_AWARDED, {
      userId,
      amount,
      source,
      total,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      amount,
      total
    };
  }
}
```

## 4. Core System Implementations

### 4.1 Points System Protection Framework

The points system implements a defense-in-depth strategy with multiple security layers:

| Layer | Purpose | Implementation | Trigger Point |
|-------|---------|----------------|--------------|
| **Input Validation** | Data integrity | Schema validation, type checking | All API requests |
| **Rate Limiting** | Abuse prevention | Request throttling, cooldown periods | Point-earning endpoints |
| **Daily Caps** | Maximum limits | Source-specific daily caps | During points award |
| **Anomaly Detection** | Pattern identification | Statistical analysis, behavior tracking | During points award |
| **Transaction Integrity** | Data consistency | Atomic operations, audit trails | Database writes |
| **Automated Review** | Edge case handling | Flagging system, verification queue | Suspicious activity |

```typescript
// Rate limiting implementation
export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user?.id || request.ip;
  const route = request.routerPath || 'default';
  const limiter = limiters[route] || limiters.default;
  
  const key = `ratelimit:${userId}:${route}`;
  
  try {
    // Get current usage
    const current = await redis.get(key);
    const usage = current ? parseInt(current, 10) : 0;
    
    if (usage >= limiter.points) {
      throw new RateLimitExceededError(`Too many requests. Try again in ${limiter.duration} seconds.`);
    }
    
    // Increment usage
    if (usage === 0) {
      await redis.set(key, 1, 'EX', limiter.duration);
    } else {
      await redis.incr(key);
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) throw error;
    request.log.error('Rate limit check failed', { error });
  }
}
```

### 4.2 Blockchain Integration

```typescript
// Wallet verification service
async function verifyWalletOwnership(
  walletAddress: string, 
  message: string, 
  signature: string
): Promise<boolean> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    
    // Verify signature
    return nacl.sign.detached.verify(
      messageBytes,
      bs58.decode(signature),
      publicKey.toBytes()
    );
  } catch (error) {
    logger.error('Wallet verification error', { walletAddress, error });
    return false;
  }
}

// Points redemption background job
async function processRedemptionJob(data) {
  const { userId, amount } = data;
  
  // 1. Verify user has sufficient points
  const userPoints = await pointsRepository.getUserPointsTotal(userId);
  if (userPoints < amount) {
    throw new Error('Insufficient points');
  }
  
  // 2. Deduct points from user (atomic operation)
  await pointsRepository.deductPoints({
    userId,
    amount: -amount,
    source: 'redemption',
    referenceId: job.id
  });
  
  // 3. Process blockchain transaction
  const txHash = await blockchainService.transferTokens(userId, amount / 100);
  
  // 4. Record redemption with transaction hash
  await redemptionRepository.recordRedemption({
    userId,
    pointsAmount: amount,
    tokenAmount: amount / 100,
    transactionHash: txHash,
    status: 'completed'
  });
  
  // 5. Notify user
  await notificationService.sendNotification(userId, 'redemption_complete', {
    pointsAmount: amount,
    tokenAmount: amount / 100,
    transactionHash: txHash
  });
  
  return { success: true, transactionHash: txHash };
}
```

### 4.3 File Storage with Vercel Blob

```typescript
// File storage service
export class BlobStorageService {
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxSizeBytes = 5 * 1024 * 1024; // 5MB
  
  async uploadFile(
    fileBuffer: Buffer, 
    filename: string, 
    contentType: string, 
    userId: string
  ): Promise<string> {
    try {
      // Validate file
      if (!this.allowedTypes.includes(contentType)) {
        throw new Error('Unsupported file type');
      }
      
      if (fileBuffer.length > this.maxSizeBytes) {
        throw new Error('File exceeds maximum size');
      }
      
      // Generate path with user context
      const path = `${userId}/${Date.now()}-${filename}`;
      
      // Upload to Vercel Blob
      const { url } = await put(path, fileBuffer, {
        contentType,
        access: 'public',
        addRandomSuffix: false,
      });
      
      logger.info('File uploaded', { path, size: fileBuffer.length });
      return url;
    } catch (error) {
      logger.error('File upload failed', { filename, error });
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
  
  // Additional methods for listing and deleting files
}
```

### 4.4 Asynchronous Processing

```typescript
// Job queue configuration with BullMQ
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

// Create Redis connection
const redisConnection = new Redis(process.env.REDIS_URL);

// Create named queue for points processing
const pointsProcessingQueue = new Queue('points-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true
  }
});

// Job producer - enqueue a job
export async function schedulePointsRedemption(userId: string, amount: number): Promise<string> {
  const job = await pointsProcessingQueue.add(
    'redemption',
    { 
      userId, 
      amount,
      requestedAt: new Date().toISOString()
    },
    {
      priority: 10,
      attempts: 5
    }
  );
  
  return job.id;
}

// Job consumer for processing
const worker = new Worker('points-processing', async (job) => {
  try {
    // Process different job types
    if (job.name === 'redemption') {
      return await processRedemptionJob(job.data);
    }
    throw new Error(`Unknown job type: ${job.name}`);
  } catch (error) {
    logger.error('Job failed:', error);
    throw error;
  }
}, { connection: redisConnection });
```

### 4.5 Real-time Updates

```typescript
// WebSocket implementation with Socket.io
export function setupWebSockets(server) {
  // Create Redis clients for pub/sub
  const pubClient = new Redis(process.env.REDIS_URL);
  const subClient = pubClient.duplicate();
  
  // Create Socket.io server with Redis adapter
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    },
    adapter: createAdapter(pubClient, subClient)
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const user = await verifyAuthToken(token);
      if (!user) {
        return next(new Error('Invalid token'));
      }
      
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    const { user } = socket.data;
    logger.info(`User connected: ${user.id}`);
    
    // Add user to personal room
    socket.join(`user:${user.id}`);
    
    // Subscribe to channels
    socket.on('subscribe', (channels) => {
      const validChannels = channels.filter(channel => 
        channel.startsWith('public:') || 
        channel.startsWith(`user:${user.id}:`)
      );
      
      validChannels.forEach(channel => socket.join(channel));
    });
    
    // Send initial state
    socket.emit('connection:established', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });
  });
  
  // Return interface for sending events
  return {
    io,
    emitToUser: (userId, eventName, data) => {
      io.to(`user:${userId}`).emit(eventName, data);
    }
  };
}
```

## 5. Performance Optimization

### 5.1 Multi-level Caching

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                   Edge Cache (CDN)                  │
│              Static assets, Public API              │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│               Application-Level Cache               │
│          User data, Content, Computations           │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│                   Database Cache                    │
│               Query results, Lookups                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Cache Level | Purpose | Implementation | TTL Strategy |
|------------|---------|----------------|--------------|
| **Edge (CDN)** | Global asset delivery | Vercel Edge Network | Static: long TTL<br>Dynamic: stale-while-revalidate |
| **Application** | Computed data, user context | Redis | User data: 5-15 min<br>Common requests: 1-5 min |
| **Database** | Query acceleration | Neon's built-in caching | Automatic based on query patterns |
| **Browser** | Reduce round trips | Cache-Control headers | Assets: 24h with versioning<br>API: no-cache for dynamic data |

```typescript
// Cache decorator for service methods
export function cached<T>(
  keyGenerator: (args: any[]) => string,
  options?: CacheOptions
) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const key = keyGenerator(args);
      
      // Try to get from cache
      const cachedValue = await getFromCache<T>(key, options);
      if (cachedValue !== null) {
        return cachedValue;
      }
      
      // If not in cache, call original method
      const result = await originalMethod.apply(this, args);
      
      // Store in cache and return
      await setInCache<T>(key, result, options);
      return result;
    };
    
    return descriptor;
  };
}
```

### 5.2 Database Optimization

```typescript
// Efficient batch loading with Drizzle
async function getContentWithAuthors(contentIds: string[]): Promise<any[]> {
  if (!contentIds.length) return [];
  
  // Single query for content and authors using joins
  return db
    .select({
      id: content.id,
      type: content.type,
      contentText: content.contentText,
      createdAt: content.createdAt,
      author: {
        id: users.id,
        name: users.displayName,
        avatar: profiles.avatarUrl
      }
    })
    .from(content)
    .innerJoin(users, eq(content.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(inArray(content.id, contentIds));
}
```

### 5.3 Query Patterns

| Pattern | Implementation | Use Case |
|---------|----------------|----------|
| **Cursor Pagination** | Use IDs or timestamps instead of offset | Content feeds, long lists |
| **Composite Queries** | Join related data in single query | User profiles with stats |
| **Partial Updates** | Update only changed fields | User preferences, status changes |
| **Batch Operations** | Process multiple records in one query | Bulk point awards, notifications |
| **Materialized Data** | Precalculate and store derived data | Leaderboards, point totals |

## 6. Deployment & Operations

### 6.1 CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Backend CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint & Type check
        run: npm run lint && npm run type-check
      
      - name: Run tests
        run: npm test
      
      - name: Upload test coverage
        uses: codecov/codecov-action@v3

  deploy:
    name: Deploy
    needs: test
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to Vercel
        uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
```

### 6.2 Monitoring Strategy

```typescript
// Pino logger with structured logging
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['password', 'token', 'authorization', 'cookie'],
  mixin() {
    return {
      service: 'success-kid-backend',
      env: process.env.NODE_ENV,
    };
  },
});

// Request logger middleware
export function requestLoggerMiddleware(request, reply, done) {
  request.id = request.id || randomUUID();
  
  request.log = logger.child({
    requestId: request.id,
    method: request.method,
    url: request.url,
    userId: request.user?.id
  });
  
  const startTime = process.hrtime();
  
  reply.onSend((payload, next) => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    request.log.info({
      responseTime: duration,
      statusCode: reply.statusCode,
      contentLength: payload ? payload.length : 0
    }, 'Request completed');
    
    next(null, payload);
  });
  
  done();
}
```

### 6.3 Test Strategy

| Test Type | Focus | Tools | Coverage Target |
|-----------|-------|-------|----------------|
| **Unit Tests** | Individual functions and classes | Vitest | 80%+ of utility functions and hooks |
| **Integration Tests** | Module interactions | Vitest, Supertest | 70%+ of API endpoints |
| **Contract Tests** | API contracts | Pact.js | All client-consumed endpoints |
| **Performance Tests** | Response times, throughput | autocannon, k6 | Critical paths under load |
| **Security Tests** | Vulnerability detection | OWASP ZAP | Quarterly security assessment |

## 7. Development Guidelines

### 7.1 Anti-Patterns to Avoid

| Anti-Pattern | Why It's Harmful | Correct Approach |
|--------------|------------------|------------------|
| **Business Logic in API Handlers** | Hard to test, duplicates code | Move logic to service layer |
| **Direct Database Access** | Breaks abstraction, testing difficulty | Use repository pattern |
| **Synchronous Blockchain Calls** | Slow responses, timeout issues | Use asynchronous background jobs |
| **Large Route Handlers** | Hard to understand and test | Extract to smaller functions |
| **Insufficient Error Handling** | Cryptic errors, exposes sensitive information | Implement standardized error handling |

### 7.2 Code Quality Enforcement

```json
// ESLint configuration
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:security/recommended"
  ],
  "plugins": ["@typescript-eslint", "security"],
  "rules": {
    "no-console": "error",
    "require-await": "error",
    "@typescript-eslint/explicit-function-return-type": ["error"],
    "@typescript-eslint/no-explicit-any": "warn",
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn"
  }
}
```

### 7.3 API Standards Checklist

- ✅ Use resource-oriented endpoints (not action-oriented)
- ✅ Apply consistent response format across all endpoints
- ✅ Implement proper HTTP status codes for different scenarios
- ✅ Include comprehensive API documentation with OpenAPI
- ✅ Centralize error handling with standardized formats
- ✅ Ensure all routes have authentication/authorization checks
- ✅ Implement rate limiting for public endpoints
- ✅ Validate all inputs with schema validation

### 7.4 Event-Driven Architecture

```typescript
// Event types shared with frontend
export enum EventType {
  POINTS_AWARDED = 'points.awarded',
  POINTS_REDEEMED = 'points.redeemed',
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  CONTENT_CREATED = 'content.created',
  CONTENT_COMMENTED = 'content.commented',
  LEVEL_UP = 'user.levelUp',
  WALLET_CONNECTED = 'wallet.connected',
  MILESTONE_REACHED = 'milestone.reached'
}

// Standardized event payload format
interface EventPayload<T> {
  type: EventType;
  data: T;
  timestamp: string;
  userId?: string;
}

// Example event publishing
await eventBus.publish<PointsAwardedEvent>(
  EventType.POINTS_AWARDED, 
  {
    userId: 'user-123',
    amount: 50,
    source: 'content_creation',
    total: 1250,
    timestamp: new Date().toISOString()
  }
);
```

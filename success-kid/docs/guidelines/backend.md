# Success Kid Community Platform: Backend Implementation Guide

## Introduction

This guide provides essential standards and implementation patterns for building the Success Kid Community Platform backend. It focuses on strategic alignment, concrete implementation guidance, and critical technical decisions that directly support business objectives.

**Target Audiences:**
- **Backend Developers:** Implementation patterns and standards
- **Technical Leads:** Architecture decisions and governance
- **DevOps Engineers:** Deployment and operations guidance

---

## 1. Strategic Foundation

### 1.1 Business Impact Analysis

| Business Objective | Backend Strategy | Measurable Impact | Priority |
|-------------------|-------------------|-------------------|----------|
| **Increase user engagement** | Real-time data synchronization, API response times <200ms | 50+ daily contributions, 10+ min avg. session | High |
| **Drive wallet connections** | Reliable wallet integration with robust error handling | 25%+ wallet connection rate | High |
| **Maximize points redemption** | Secure points-to-token conversion with transaction integrity | 20%+ weekly redemption rate | High |
| **Build community visibility** | Real-time activity feeds and notifications | 40%+ of users on leaderboards | Medium |
| **Support mobile engagement** | Optimized API payloads, efficient caching | Mobile session duration equal to desktop | Medium |

### 1.2 System Quality Attributes

| Quality | Targets | Implementation Approach | Monitoring |
|---------|---------|------------------------|-----------|
| **Performance** | API response <200ms (p95)<br>WebSocket latency <500ms | Query optimization, caching, async processing | Response time tracking, synthetic tests |
| **Reliability** | 99.9%+ uptime<br>Zero data loss | Circuit breakers, graceful degradation, automated recovery | Uptime tracking, error rate monitoring |
| **Security** | Zero critical vulnerabilities<br>Complete auth coverage | Input validation, encryption, multi-layer protection | Vulnerability scanning, auth audits |
| **Scalability** | Support 10x user growth<br>Linear cost scaling | Horizontal scaling, stateless services, efficient queries | Load testing, resource utilization |

---

## 2. Technology Stack & Architecture

### 2.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 22.3+ | Runtime environment |
| **Fastify** | 5.2+ | API framework |
| **TypeScript** | 5.8+ | Type safety |
| **Neon PostgreSQL** | Latest | Serverless database |
| **Drizzle ORM** | 0.30+ | Type-safe database access |
| **Redis** | 8.2+ | Caching, pub/sub, job queues |
| **Clerk** | 5.3+ | Authentication |
| **Web3.js** | 4.0+ | Blockchain integration |
| **Vercel Blob** | Latest | Media and file storage |
| **Socket.io** | 4.6+ | WebSocket communication |

### 2.2 Architectural Decisions

#### 2.2.1 Serverless Architecture

| Aspect | Details |
|--------|---------|
| **Decision** | Implement serverless architecture with edge functions for global distribution |
| **Rationale** | Enables automatic scaling, reduces operational overhead, and provides global low-latency performance |
| **Implementation Guidance** | • Deploy API endpoints as serverless functions<br>• Use edge functions for location-specific operations<br>• Implement connection pooling for database efficiency<br>• Design for stateless operation |

#### 2.2.2 Decoupled Frontend/Backend Architecture

| Aspect | Details |
|--------|---------|
| **Decision** | Implement separate frontend and backend services with clear API contracts |
| **Rationale** | Enables independent scaling, clear separation of concerns, and better maintainability |
| **Implementation Guidance** | • Define API contracts before implementation<br>• Use versioned endpoints<br>• Implement comprehensive request validation<br>• Leverage Server Actions for form submissions |

#### 2.2.3 RESTful API with WebSocket Augmentation

| Aspect | Details |
|--------|---------|
| **Decision** | Primary API is RESTful with WebSockets for real-time features |
| **Rationale** | REST provides simplicity and broad compatibility while WebSockets enable real-time features |
| **Implementation Guidance** | • Use REST for CRUD operations<br>• Reserve WebSockets for real-time notifications and updates<br>• Implement fallback mechanisms for WebSocket failures |

#### 2.2.4 Centralized Authentication

| Aspect | Details |
|--------|---------|
| **Decision** | Implement authentication through Clerk with custom JWT validation |
| **Rationale** | Balances security needs with development efficiency and multi-provider support |
| **Implementation Guidance** | • Implement middleware for JWT validation<br>• Cache user permissions<br>• Create fallback auth mechanism |

#### 2.2.5 Points System Implementation

| Aspect | Details |
|--------|---------|
| **Decision** | Implement points as a core data entity with strict validation rules |
| **Rationale** | Better performance and control while maintaining integrity through validation |
| **Implementation Guidance** | • Implement transaction-based point operations<br>• Create comprehensive audit trail<br>• Build multi-layer protection system |

---

## 3. Code Organization & Structure

### 3.1 Project Structure

```
backend/
├── src/
│   ├── api/                  # API route handlers
│   ├── config/               # Application configuration
│   ├── lib/                  # Shared utilities and helpers
│   ├── middleware/           # HTTP middleware
│   ├── models/               # Data models and schemas
│   ├── repositories/         # Data access layer
│   ├── services/             # Business logic services
│   ├── jobs/                 # Background job processors
│   ├── websockets/           # WebSocket handlers
│   ├── storage/              # Blob storage handlers
│   └── app.ts                # Fastify app setup
├── drizzle/                  # Drizzle migrations and schema
├── test/                     # Test files
└── package.json              # Package dependencies
```

### 3.2 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files/Directories | Kebab-case for files, plural for collections | `user-service.ts`, `api/users/` |
| Classes/Interfaces | PascalCase | `UserService`, `PointsTransaction` |
| Functions | Camel case, verb-first for actions | `getUserById()`, `createContent()` |
| Variables | Camel case | `userProfile`, `pointsBalance` |
| Constants | UPPER_SNAKE_CASE | `MAX_POINTS_PER_DAY` |
| Database | Snake_case | `user_points`, `content_items` |
| API Endpoints | Kebab-case, RESTful resources | `/api/v1/users/{id}` |

### 3.3 Module Boundaries

- **API Layer**: Request/response handling only, no business logic
- **Service Layer**: Business logic and orchestration
- **Repository Layer**: Data access only, no business logic
- **Model Layer**: Data validation and structure
- **Job Layer**: Background processing operations
- **WebSocket Layer**: Real-time communication
- **Storage Layer**: File storage and retrieval operations

**Critical Rules:**
1. API handlers must delegate to services for business logic
2. Services must not directly access repositories from other domains
3. Cross-domain operations must go through service interfaces
4. Circular dependencies are prohibited

---

## 4. API Design & Standards

### 4.1 API Design Principles

1. **Resource-Oriented**: Design endpoints around resources, not actions
2. **Consistent Patterns**: Apply the same patterns across all endpoints
3. **Self-Documenting**: Use descriptive names that reveal purpose
4. **Secure by Default**: Apply authentication and authorization by default
5. **Performance-Conscious**: Optimize payload size and request frequency

### 4.2 Request/Response Standards

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

### 4.3 API Documentation

All API endpoints must be documented using OpenAPI/Swagger annotations to ensure frontend-backend alignment:

```typescript
/**
 * @openapi
 * /api/v1/points:
 *   post:
 *     summary: Award points to a user
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, amount, source]
 *             properties:
 *               userId: 
 *                 type: string
 *               amount:
 *                 type: number
 *               source:
 *                 type: string
 *     responses:
 *       200:
 *         description: Points awarded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                     total:
 *                       type: number
 */
export async function awardPoints(request, reply) {
  // Implementation
}
```

**Implementation Requirements:**
- Use a Swagger UI plugin for interactive API documentation
- Document all endpoints, parameters, request bodies, and responses
- Include authentication requirements for each endpoint
- Automatically validate requests against OpenAPI schemas
- Generate API clients for frontend development

### 4.4 API Implementation Pattern

```typescript
// Route handler example
export async function getUserProfile(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    // Extract parameters
    const { id } = request.params;
    
    // Delegate to service
    const profile = await userService.getUserProfile(id);
    
    // Return response
    return reply.code(200).send({
      data: profile,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    // Handle errors using standardized error handling
    return handleApiError(request, reply, error);
  }
}
```

### 4.5 Server Actions Implementation

Server Actions provide an efficient way to handle form submissions and data mutations:

```typescript
// Server Action example for points redemption
"use server"

import { z } from "zod";
import { revalidatePath } from "next/cache";

// Define validation schema
const redeemSchema = z.object({
  amount: z.number().positive().int(),
  userId: z.string().uuid()
});

export async function redeemPoints(formData: FormData) {
  // Extract and validate data
  const amount = Number(formData.get("amount"));
  const userId = formData.get("userId") as string;
  
  // Validate input
  const result = redeemSchema.safeParse({ amount, userId });
  if (!result.success) {
    return { 
      success: false, 
      errors: result.error.flatten().fieldErrors 
    };
  }
  
  try {
    // Process redemption through service
    const redemption = await pointsService.redeemPoints(userId, amount);
    
    // Revalidate relevant paths
    revalidatePath(`/rewards/${userId}`);
    revalidatePath(`/profile/${userId}`);
    
    return { 
      success: true, 
      data: redemption 
    };
  } catch (error) {
    return { 
      success: false, 
      errors: { _form: error.message } 
    };
  }
}
```

### 4.6 Transaction Verification Middleware

Implement transaction verification to ensure idempotent operations, especially for points-related transactions:

```typescript
// Transaction verification middleware for idempotency
export async function transactionVerification(request: FastifyRequest, reply: FastifyReply) {
  // Only apply to write operations
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return;
  }
  
  // Generate transaction ID if not present
  if (!request.headers['x-transaction-id']) {
    const transactionId = crypto.randomUUID();
    request.headers['x-transaction-id'] = transactionId;
  }
  
  const transactionId = request.headers['x-transaction-id'] as string;
  
  // Check if transaction has been processed already (idempotency)
  const processed = await redis.get(`transaction:${transactionId}`);
  if (processed) {
    // Transaction already processed, return original response
    return reply.code(200).send(JSON.parse(processed));
  }
  
  // Store original send function to capture response
  const originalSend = reply.send;
  
  // Override send to record successful responses
  reply.send = function(payload) {
    // Only cache successful responses
    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      const stringPayload = typeof payload === 'string' 
        ? payload 
        : JSON.stringify(payload);
      
      // Store response for idempotency (5 minute expiry)
      redis.set(`transaction:${transactionId}`, stringPayload, 'EX', 300)
        .catch(err => request.log.error('Failed to store transaction', { err }));
    }
    
    // Call original send
    return originalSend.call(this, payload);
  };
}

// Register middleware
app.addHook('preHandler', transactionVerification);
```

### 4.7 Standardized Error Handling

Create a centralized error handling system to ensure consistency across all endpoints:

```typescript
// Define standard error types
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  
  constructor(message: string, code: string, statusCode: number, details?: any) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
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

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

// Centralized error handler for API responses
export function handleApiError(request: FastifyRequest, reply: FastifyReply, error: any) {
  if (error instanceof AppError) {
    // Known application error
    return reply.code(error.statusCode).send({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      },
      errors: [
        {
          code: error.code,
          message: error.message,
          details: error.details
        }
      ]
    });
  }
  
  // Log unexpected errors
  request.log.error(error);
  
  // Return generic error
  return reply.code(500).send({
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: request.id
    },
    errors: [
      {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    ]
  });
}
```

---

## 5. Data & Database Implementation

### 5.1 Neon PostgreSQL Configuration

**Connection Strategy**
```typescript
// Database connection with Neon PostgreSQL
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon for serverless environment
neonConfig.fetchConnectionCache = true;

// Create SQL client with connection pooling
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle ORM instance
export const db = drizzle(sql);
```

**Connection Pooling for High Traffic**
```typescript
// For high-traffic environments, use a connection pool
import { Pool } from '@neondatabase/serverless';

// Configure connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Adjust based on workload
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000, // How long a connection can remain idle
  connectionTimeoutMillis: 2000 // Max time to wait for a connection
});

// Acquire a client from the pool for a transaction
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

### 5.2 Drizzle ORM Implementation

**Schema Definition**
```typescript
// Define database schema with Drizzle ORM
import { pgTable, serial, text, uuid, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

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

// User profiles table
export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  level: integer('level').notNull().default(1),
  title: text('title'),
  socialLinks: jsonb('social_links'),
  preferences: jsonb('preferences')
});

// Points transactions table
export const userPoints = pgTable('user_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(),
  source: text('source').notNull(),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  description: text('description')
});

// Content table with JSONB for flexibility
export const content = pgTable('content', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  contentText: text('content_text'),
  mediaUrls: jsonb('media_urls'),
  metadata: jsonb('metadata'), // Flexible field for additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  status: text('status').notNull().default('active')
});
```

**Repository Implementation**
```typescript
// PointsRepository with Drizzle ORM
import { eq, sum, desc } from 'drizzle-orm';
import { db } from '../lib/db';
import { userPoints, users } from '../schema';
import { logger } from '../lib/logger';

export interface PointsTransaction {
  userId: string;
  amount: number;
  source: string;
  referenceId?: string;
  description?: string;
}

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
  
  async getPointsHistory(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      return await db
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, userId))
        .orderBy(desc(userPoints.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      logger.error('Failed to get points history', { userId, error });
      throw new Error('Failed to get points history');
    }
  }
  
  // Additional methods omitted for brevity
}
```

### 5.3 Vercel Blob Storage Implementation

```typescript
// File storage service with Vercel Blob
import { put, list, del, head } from '@vercel/blob';
import { logger } from '../lib/logger';

export class BlobStorageService {
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly maxSizeBytes = 5 * 1024 * 1024; // 5MB
  
  // Upload a file
  async uploadFile(
    fileBuffer: Buffer, 
    filename: string, 
    contentType: string, 
    userId: string
  ): Promise<string> {
    try {
      // Validate file
      if (!this.allowedImageTypes.includes(contentType)) {
        throw new Error('Unsupported file type');
      }
      
      if (fileBuffer.length > this.maxSizeBytes) {
        throw new Error('File exceeds maximum size');
      }
      
      // Generate path
      const path = `${userId}/${Date.now()}-${filename}`;
      
      // Upload to Vercel Blob
      const { url } = await put(path, fileBuffer, {
        contentType,
        access: 'public',
        addRandomSuffix: false, // Use our generated path
      });
      
      logger.info('File uploaded', { path, size: fileBuffer.length });
      return url;
    } catch (error) {
      logger.error('File upload failed', { filename, error });
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
  
  // List user files
  async listUserFiles(userId: string): Promise<any[]> {
    try {
      const { blobs } = await list({ prefix: `${userId}/` });
      return blobs.map(blob => ({
        url: blob.url,
        filename: blob.pathname.split('/').pop(),
        uploadedAt: new Date(blob.uploadedAt).toISOString(),
        size: blob.size
      }));
    } catch (error) {
      logger.error('Failed to list user files', { userId, error });
      throw new Error('Failed to list user files');
    }
  }
  
  // Delete a file
  async deleteFile(url: string, userId: string): Promise<void> {
    try {
      // Verify the file belongs to the user
      const pathname = new URL(url).pathname.split('/').pop();
      if (!pathname.startsWith(`${userId}/`)) {
        throw new Error('Unauthorized file access');
      }
      
      await del(url);
      logger.info('File deleted', { url });
    } catch (error) {
      logger.error('File deletion failed', { url, error });
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }
}
```

---

## 6. Asynchronous Processing

### 6.1 Background Job Processing

```typescript
// Job queue configuration with BullMQ
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { Redis } from 'ioredis';

// Create Redis connection
const redisConnection = new Redis(process.env.REDIS_URL);

// Create named queues for different job types
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

// Set up queue scheduler
const scheduler = new QueueScheduler('points-processing', { connection: redisConnection });

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
      priority: 10, // Higher priority
      attempts: 5   // Override default attempts
    }
  );
  
  return job.id;
}

// Job consumer with workers
const worker = new Worker('points-processing', async (job) => {
  try {
    // Extract job data
    const { name, data } = job;
    
    // Process different job types
    if (name === 'redemption') {
      // Process redemption job
      return await processRedemptionJob(data);
    }
    
    throw new Error(`Unknown job type: ${name}`);
  } catch (error) {
    // Log error and rethrow for retry mechanism
    console.error('Job failed:', error);
    throw error;
  }
}, { connection: redisConnection });

// Listen for worker events
worker.on('completed', job => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

// Redemption job processing function
async function processRedemptionJob(data) {
  const { userId, amount } = data;
  
  // 1. Verify user has sufficient points
  const userPoints = await pointsRepository.getUserPointsTotal(userId);
  if (userPoints < amount) {
    throw new Error('Insufficient points');
  }
  
  // 2. Deduct points from user
  await pointsRepository.deductPoints({
    userId,
    amount: -amount, // Negative to deduct
    source: 'redemption',
    referenceId: job.id
  });
  
  // 3. Process blockchain transaction
  const txHash = await blockchainService.transferTokens(userId, amount / 100);
  
  // 4. Record successful redemption
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

### 6.2 WebSocket Implementation

```typescript
// WebSocket handler for real-time updates
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

export function setupWebSockets(server) {
  // Create Redis clients for pub/sub
  const pubClient = new Redis(process.env.REDIS_URL);
  const subClient = pubClient.duplicate();
  
  // Create Socket.io server
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true
    },
    adapter: createAdapter(pubClient, subClient)
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify token and get user
      const user = await verifyAuthToken(token);
      if (!user) {
        return next(new Error('Invalid token'));
      }
      
      // Attach user to socket for later use
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    const { user } = socket.data;
    console.log(`User connected: ${user.id}`);
    
    // Add user to their personal room
    socket.join(`user:${user.id}`);
    
    // Subscribe to channels
    socket.on('subscribe', (channels) => {
      // Validate channel subscriptions
      const validChannels = channels.filter(channel => 
        channel.startsWith('public:') || 
        channel.startsWith(`user:${user.id}:`)
      );
      
      validChannels.forEach(channel => {
        socket.join(channel);
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.id}`);
    });
    
    // Send initial state
    socket.emit('connection:established', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });
  });
  
  // Function to emit events to specific users
  const emitToUser = (userId, eventName, data) => {
    io.to(`user:${userId}`).emit(eventName, data);
  };
  
  // Export for use in other modules
  return {
    io,
    emitToUser
  };
}
```

### 6.3 WebSocket Connection Management

```typescript
// Connection registry for WebSocket management
class ConnectionRegistry {
  private connections: Map<string, Set<WebSocket>> = new Map();
  
  add(userId: string, socket: WebSocket): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId).add(socket);
  }
  
  remove(userId: string, socket: WebSocket): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(socket);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }
  
  sendToUser(userId: string, message: any): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const messageString = JSON.stringify(message);
      userConnections.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(messageString);
        }
      });
    }
  }
  
  sendToAll(message: any): void {
    const messageString = JSON.stringify(message);
    this.connections.forEach(sockets => {
      sockets.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(messageString);
        }
      });
    });
  }
}
```

---

## 7. Points System Protection Framework

### 7.1 Multi-layered Protection Approach

The points system requires comprehensive protection to prevent exploitation while maintaining a positive user experience. We implement a defense-in-depth strategy with multiple security layers:

| Protection Layer | Purpose | Implementation | When Applied |
|-----------------|---------|----------------|--------------|
| **Input Validation** | Verify data integrity | Schema validation, type checking | On all API requests |
| **Rate Limiting** | Prevent rapid exploitation | Request throttling, cooldown periods | On point-earning endpoints |
| **Daily Caps** | Limit maximum earnings | Source-specific limits, user totals | During points award |
| **Anomaly Detection** | Identify suspicious patterns | Activity rate analysis, statistical outliers | During points award |
| **Transaction Integrity** | Ensure data consistency | Database transactions, audit logs | During database operations |
| **Automated Review** | Review edge cases | Flagging system, manual verification queue | For suspicious activity |

### 7.2 Exploitation Prevention Implementation

```typescript
// Enhance the detectAnomalousActivity function with specific strategies
async function checkForAnomalousActivity(userId, source, amount) {
  // Strategy 1: Check for sudden spike in points
  const recentPoints = await getRecentPointsTotal(userId, 300); // Last 5 minutes
  const sourceConfig = POINTS_CONFIG[source] || POINTS_CONFIG.default;
  const normalMaxRate = sourceConfig.dailyLimit / 24 / 12; // Expected max per 5 minutes
  
  if (recentPoints > normalMaxRate * 3) {
    return true;
  }
  
  // Strategy 2: Check for unusual source pattern
  const unusualPattern = await detectUnusualSourcePattern(userId, source);
  if (unusualPattern) {
    return true;
  }
  
  // Strategy 3: Check against known suspicious patterns
  return matchesSuspiciousPattern(userId, amount, source);
}
```

### 7.3 Rate Limiting Implementation

```typescript
// Rate limit middleware
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
      // Rate limit exceeded
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
    
    // If Redis fails, log but allow request (fail open for usability)
    request.log.error('Rate limit check failed', { error });
  }
}
```

---

## 8. Performance Requirements

### 8.1 Operation-Specific Targets

| Operation | Target Response Time | Throughput Target | Resource Utilization |
|-----------|----------------------|-------------------|----------------------|
| Authentication | <100ms (p95) | 50 req/sec | Low |
| Content Feed | <200ms (p95) | 100 req/sec | Medium |
| Points Transactions | <150ms (p95) | 200 req/sec | Medium |
| Profile Operations | <200ms (p95) | 30 req/sec | Low |
| Wallet Operations | <300ms (p95) | 20 req/sec | Medium |
| Search Operations | <500ms (p95) | 20 req/sec | High |
| WebSocket Messages | <50ms latency | 10,000 msg/sec | Medium |
| Background Jobs | <5s processing time | 100 jobs/min | Medium |

### 8.2 Multi-level Caching Strategy

```typescript
// Caching service implementation with Redis
import { Redis } from 'ioredis';
import { logger } from '../lib/logger';

// Create Redis client
const redis = new Redis(process.env.REDIS_URL);

// Default options
const defaultOptions = {
  prefix: 'cache:',
  ttl: 300, // 5 minutes in seconds
  ignoreErrors: false
};

// Cache operations
export async function getFromCache<T>(key: string, options?: CacheOptions): Promise<T | null> {
  const opts = { ...defaultOptions, ...options };
  const fullKey = `${opts.prefix}${key}`;
  
  try {
    const value = await redis.get(fullKey);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    if (!opts.ignoreErrors) throw error;
    logger.error('Cache get error', { key, error });
    return null;
  }
}

export async function setInCache<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
  const opts = { ...defaultOptions, ...options };
  const fullKey = `${opts.prefix}${key}`;
  
  try {
    const stringValue = JSON.stringify(value);
    if (opts.ttl) {
      await redis.set(fullKey, stringValue, 'EX', opts.ttl);
    } else {
      await redis.set(fullKey, stringValue);
    }
  } catch (error) {
    if (!opts.ignoreErrors) throw error;
    logger.error('Cache set error', { key, error });
  }
}

export async function invalidateCache(key: string, options?: CacheOptions): Promise<void> {
  const opts = { ...defaultOptions, ...options };
  const fullKey = `${opts.prefix}${key}`;
  
  try {
    await redis.del(fullKey);
  } catch (error) {
    if (!opts.ignoreErrors) throw error;
    logger.error('Cache invalidation error', { key, error });
  }
}

// Pattern-based invalidation (for related keys)
export async function invalidatePattern(pattern: string, options?: CacheOptions): Promise<void> {
  const opts = { ...defaultOptions, ...options };
  const fullPattern = `${opts.prefix}${pattern}*`;
  
  try {
    const keys = await redis.keys(fullPattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    if (!opts.ignoreErrors) throw error;
    logger.error('Cache pattern invalidation error', { pattern, error });
  }
}

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

### 8.3 Edge Function Optimization

```typescript
// Edge function for location-based content
import { geolocation } from '@vercel/edge';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Get user location from edge
  const { country, city, latitude, longitude } = geolocation(request);
  
  // Prepare search parameters
  const params = new URLSearchParams({
    lat: latitude?.toString() || '',
    lng: longitude?.toString() || '',
    country: country || '',
    city: city || '',
  });
  
  // Fetch location-specific content
  const response = await fetch(`${process.env.API_URL}/content/nearby?${params}`);
  const data = await response.json();
  
  // Return location-specific data
  return new Response(JSON.stringify({
    data,
    meta: {
      location: {
        country,
        city,
        coordinates: latitude && longitude ? [latitude, longitude] : null
      }
    }
  }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  });
}
```

### 8.4 Query Optimization

```typescript
// Optimized query example for content feed with Drizzle
import { eq, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../lib/db';
import { content, users, profiles } from '../schema';

async function getContentFeed(lastId: string | null = null, limit: number = 20): Promise<any[]> {
  // Base query with table alias for joins
  const query = db
    .select({
      id: content.id,
      type: content.type,
      contentText: content.contentText,
      createdAt: content.createdAt,
      authorName: users.displayName,
      authorAvatar: profiles.avatarUrl,
      // Use sub-query for counting comments
      commentCount: sql<number>`(select count(*) from comments where content_id = ${content.id})`
    })
    .from(content)
    .innerJoin(users, eq(content.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(content.status, 'active'))
    .orderBy(desc(content.createdAt))
    .limit(limit);
  
  // Apply cursor-based pagination if lastId provided
  if (lastId) {
    const lastItemDate = await db
      .select({ createdAt: content.createdAt })
      .from(content)
      .where(eq(content.id, lastId))
      .limit(1);
    
    if (lastItemDate.length > 0) {
      query.where(sql`${content.createdAt} < ${lastItemDate[0].createdAt}`);
    }
  }
  
  return query;
}

// Efficient batch loading for related data
async function getContentWithAuthors(contentIds: string[]): Promise<any[]> {
  if (!contentIds.length) return [];
  
  // Fetch content and authors in a single query
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

---

## 9. Deployment & Infrastructure

### 9.1 Vercel Deployment Configuration

```
# vercel.json configuration
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    },
    "edge-api/**/*.js": {
      "runtime": "edge"
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily-points-reset",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/weekly-leaderboard-reset",
      "schedule": "0 0 * * 1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 9.2 CI/CD Implementation

```yaml
# .github/workflows/main.yml
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
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
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
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
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
          working-directory: ./
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
```

### 9.3 Environment Management

```typescript
// Environment configuration validation
import { z } from 'zod';

// Define environment schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server configuration
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
  
  // Database configuration
  DATABASE_URL: z.string(),
  
  // Redis configuration
  REDIS_URL: z.string(),
  
  // Authentication
  CLERK_SECRET_KEY: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string(),
  
  // Blockchain (optional in development)
  WEB3_PROVIDER_URL: z.string().optional().default(''),
  CONTRACT_ADDRESS: z.string().optional().default(''),
  
  // Blob storage
  BLOB_READ_WRITE_TOKEN: z.string()
});

// Parse environment variables
const env = envSchema.parse(process.env);

// Export validated environment
export default env;
```

### 9.4 Monitoring & Observability

```typescript
// Pino logger configuration
import pino from 'pino';
import { randomUUID } from 'crypto';

// Create base logger
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
  // Generate request id if not present
  request.id = request.id || randomUUID();
  
  // Create child logger with request context
  request.log = logger.child({
    requestId: request.id,
    method: request.method,
    url: request.url,
    userId: request.user?.id
  });
  
  // Log request
  request.log.info('Request received');
  
  // Time request
  const startTime = process.hrtime();
  
  // Log on response
  reply.onSend((payload, next) => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    // Log response info
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

---

## 10. Testing Strategy

### 10.1 Unit Test Pattern for Services

```typescript
// Unit test for points service
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PointsService } from './points-service';

describe('PointsService', () => {
  let pointsService;
  let mockPointsRepository;
  let mockSecurityService;
  let mockEventBus;
  
  beforeEach(() => {
    // Setup mocks
    mockPointsRepository = {
      getUserPointsTotal: vi.fn(),
      getDailyPointsBySource: vi.fn(),
      getRecentPointsActivity: vi.fn(),
      addPointsTransaction: vi.fn()
    };
    
    mockSecurityService = {
      checkRateLimit: vi.fn(),
      checkForAnomalousActivity: vi.fn(),
      logSuspiciousActivity: vi.fn()
    };
    
    mockEventBus = {
      publish: vi.fn()
    };
    
    // Create service with mocked dependencies
    pointsService = new PointsService(
      mockPointsRepository,
      mockSecurityService,
      mockEventBus
    );
  });
  
  describe('awardPoints', () => {
    it('should award points when all validations pass', async () => {
      // Arrange
      const userId = 'user123';
      const amount = 50;
      const source = 'content_creation';
      
      mockSecurityService.checkRateLimit.mockResolvedValue(false);
      mockSecurityService.checkForAnomalousActivity.mockResolvedValue(false);
      mockPointsRepository.getDailyPointsBySource.mockResolvedValue(0);
      mockPointsRepository.addPointsTransaction.mockResolvedValue({
        id: 'tx123',
        userId,
        amount,
        source,
        created_at: new Date()
      });
      mockPointsRepository.getUserPointsTotal.mockResolvedValue(150);
      
      // Act
      const result = await pointsService.awardPoints(userId, amount, source);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.amount).toBe(amount);
      expect(result.newTotal).toBe(150);
      expect(mockPointsRepository.addPointsTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          amount,
          source
        })
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'points.awarded',
        expect.objectContaining({
          userId,
          amount,
          source
        })
      );
    });
  });
});
```

### 10.2 Database Integration Tests

```typescript
// Database integration test using actual database
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../src/lib/db';
import { users, profiles, userPoints } from '../src/schema';
import { createUser, getUserById } from '../src/repositories/user-repository';
import { randomUUID } from 'crypto';

describe('User Repository', () => {
  // Generate unique test data
  const testUser = {
    email: `test-${randomUUID()}@example.com`,
    displayName: 'Test User',
    authProvider: 'email'
  };
  
  let userId;
  
  // Clean up after tests
  afterEach(async () => {
    if (userId) {
      await db.delete(profiles).where(eq(profiles.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
      userId = null;
    }
  });
  
  it('should create a user and return the inserted record', async () => {
    // Act
    const result = await createUser(testUser);
    userId = result.id;
    
    // Assert
    expect(result).toHaveProperty('id');
    expect(result.email).toBe(testUser.email);
    expect(result.displayName).toBe(testUser.displayName);
    expect(result.authProvider).toBe(testUser.authProvider);
    expect(result.createdAt).toBeInstanceOf(Date);
  });
  
  it('should retrieve a user by ID', async () => {
    // Arrange
    const created = await createUser(testUser);
    userId = created.id;
    
    // Act
    const result = await getUserById(userId);
    
    // Assert
    expect(result).not.toBeNull();
    expect(result.id).toBe(userId);
    expect(result.email).toBe(testUser.email);
  });
});
```

### 10.3 API Integration Tests

```typescript
// API endpoint test with Supertest
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/app';
import { createTestToken } from './utils/auth-helper';

describe('Points API', () => {
  let app;
  let token;
  
  beforeAll(async () => {
    // Create app instance
    app = await build();
    
    // Create test user and generate auth token
    token = await createTestToken('test-user');
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('should award points to a user', async () => {
    // Arrange
    const payload = {
      data: {
        userId: 'test-user',
        amount: 50,
        source: 'test'
      }
    };
    
    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/points',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload
    });
    
    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveProperty('amount', 50);
    expect(body.data).toHaveProperty('total');
  });
});
```

---

## 11. Anti-Pattern Catalog

### 11.1 Common Anti-Patterns to Avoid

| Anti-Pattern | Description | Why It's Harmful | Correct Approach |
|--------------|-------------|------------------|------------------|
| **Business Logic in API Handlers** | Implementing complex logic directly in route handlers | - Hard to test<br>- Violates separation of concerns<br>- Duplicates code across endpoints | Move business logic to service layer, keep handlers thin |
| **Direct Database Access** | Bypassing repository pattern to access database directly | - Breaks abstraction<br>- Makes testing difficult<br>- Complicates transaction management | Always use repository pattern for data access |
| **Synchronous Blockchain Calls** | Making blockchain calls synchronously in request handler | - Creates slow responses<br>- Leads to timeout issues<br>- Affects scalability | Use asynchronous processing with background jobs |
| **Large Route Handlers** | Putting too much code in route handlers | - Hard to understand<br>- Difficult to test<br>- Mixes concerns | Extract logic to smaller, focused functions and services |
| **Insufficient Error Handling** | Not handling errors properly throughout the stack | - Results in cryptic errors<br>- May expose sensitive information<br>- Creates inconsistent user experience | Implement comprehensive error handling at each layer |

### 11.2 Before/After Example

❌ **INCORRECT**:
```typescript
// Anti-pattern: Synchronous blockchain call
app.post('/api/v1/redeem', async (request, reply) => {
  const { userId, amount } = request.body.data;
  
  // Check balance
  const balance = await pointsRepository.getUserPointsTotal(userId);
  if (balance < amount) {
    return reply.code(400).send({ error: 'Insufficient balance' });
  }
  
  // Deduct points
  await pointsRepository.deductPoints(userId, amount);
  
  // Direct blockchain call - this can take a long time and fail
  const txHash = await blockchainService.transferTokens(userId, amount / 100);
  
  return reply.code(200).send({
    data: {
      transactionHash: txHash,
      pointsRedeemed: amount
    }
  });
});
```

✅ **CORRECT**:
```typescript
// Pattern: Asynchronous processing with job queue
app.post('/api/v1/redeem', async (request, reply) => {
  try {
    const { userId, amount } = request.body.data;
    
    // Delegate to service
    const result = await pointsService.redeemPoints(userId, amount);
    
    return reply.code(202).send({
      data: {
        transactionId: result.transactionId,
        status: 'processing',
        pointsRedeemed: amount
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    // Error handling...
  }
});
```

---

## 12. Governance & Enforcement

### 12.1 ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:security/recommended"
  ],
  "plugins": [
    "@typescript-eslint",
    "security"
  ],
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

### 12.2 Code Review Checklist

Before approving any pull request, ensure it meets these requirements:

1. **Business Alignment**: Changes support business objectives and user needs
2. **Architecture Compliance**: Implementation follows architectural decisions
3. **Security**: Proper input validation, authentication, and authorization
4. **Performance**: Meets performance targets for its operation type
5. **Error Handling**: Comprehensive error handling at appropriate levels
6. **Testing**: Adequate test coverage, including edge cases
7. **Documentation**: Code is self-documenting with comments where needed
8. **Anti-patterns**: No anti-patterns from the catalog are present

---

## 13. Event-Driven Communication

To ensure proper alignment with frontend expectations, implement consistent event naming and payload structure:

```typescript
// Event types - shared with frontend
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

// Event bus implementation
class EventBus {
  private redis: Redis;
  private subscribers: Map<string, Array<(data: any) => void>> = new Map();
  
  constructor(redis: Redis) {
    this.redis = redis;
    this.setupRedisSubscription();
  }
  
  // Publish an event
  async publish(eventType: EventType | string, data: any): Promise<void> {
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Publish to Redis for distributed events
    await this.redis.publish('events', JSON.stringify(event));
    
    // Call local subscribers directly
    this.notifySubscribers(eventType, data);
  }
  
  // Subscribe to an event
  subscribe(eventType: EventType | string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    this.subscribers.get(eventType).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  // Handle Redis subscription
  private setupRedisSubscription(): void {
    const subscriber = this.redis.duplicate();
    
    subscriber.subscribe('events');
    
    subscriber.on('message', (_channel, message) => {
      try {
        const event = JSON.parse(message);
        this.notifySubscribers(event.type, event.data);
      } catch (error) {
        logger.error('Failed to process event message', { error });
      }
    });
  }
  
  // Notify local subscribers
  private notifySubscribers(eventType: string, data: any): void {
    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Error in event subscriber', { eventType, error });
        }
      });
    }
  }
}
```

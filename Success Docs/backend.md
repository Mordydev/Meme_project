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
| **TypeScript** | 5.4+ | Type safety |
| **PostgreSQL** | 17.2+ | Primary database |
| **Redis** | 8.2+ | Caching, pub/sub, job queues |
| **Clerk** | 5.3+ | Authentication |
| **Web3.js** | 4.0+ | Blockchain integration |

### 2.2 Architectural Decisions

#### 2.2.1 Decoupled Frontend/Backend Architecture

| Aspect | Details |
|--------|---------|
| **Decision** | Implement separate frontend and backend services with clear API contracts |
| **Rationale** | Enables independent scaling, clear separation of concerns, and better maintainability |
| **Implementation Guidance** | • Define API contracts before implementation<br>• Use versioned endpoints<br>• Implement comprehensive request validation |

#### 2.2.2 RESTful API with WebSocket Augmentation

| Aspect | Details |
|--------|---------|
| **Decision** | Primary API is RESTful with WebSockets for real-time features |
| **Rationale** | REST provides simplicity and broad compatibility while WebSockets enable real-time features |
| **Implementation Guidance** | • Use REST for CRUD operations<br>• Reserve WebSockets for real-time notifications and updates<br>• Implement fallback mechanisms for WebSocket failures |

#### 2.2.3 Centralized Authentication

| Aspect | Details |
|--------|---------|
| **Decision** | Implement authentication through Clerk with custom JWT validation |
| **Rationale** | Balances security needs with development efficiency and multi-provider support |
| **Implementation Guidance** | • Implement middleware for JWT validation<br>• Cache user permissions<br>• Create fallback auth mechanism |

#### 2.2.4 Points System Implementation

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
│   └── app.ts                # Fastify app setup
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

### 4.5 Transaction Verification Middleware

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

### 4.5 Standardized Error Handling

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

// Comprehensive error code system - shared with frontend
export enum ErrorCode {
  // General errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Points-specific errors
  POINTS_LIMIT_EXCEEDED = 'POINTS_LIMIT_EXCEEDED',
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',
  POINTS_TRANSFER_FAILED = 'POINTS_TRANSFER_FAILED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  REDEMPTION_FAILED = 'REDEMPTION_FAILED',
  
  // Wallet-specific errors
  WALLET_CONNECTION_ERROR = 'WALLET_CONNECTION_ERROR',
  WALLET_VERIFICATION_FAILED = 'WALLET_VERIFICATION_FAILED',
  WALLET_ALREADY_CONNECTED = 'WALLET_ALREADY_CONNECTED',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  
  // Content-specific errors
  CONTENT_CREATION_FAILED = 'CONTENT_CREATION_FAILED',
  CONTENT_MODERATION_REQUIRED = 'CONTENT_MODERATION_REQUIRED',
  CONTENT_TYPE_UNSUPPORTED = 'CONTENT_TYPE_UNSUPPORTED',
  
  // User-specific errors
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  ACHIEVEMENT_CRITERIA_UNMET = 'ACHIEVEMENT_CRITERIA_UNMET'
}
```

---

## 5. Asynchronous Processing

### 5.1 Background Job Processing

```typescript
// Job queue configuration
import Queue from 'bull';

// Create named queues for different job types
const pointsProcessingQueue = new Queue('points-processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD
  },
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
      priority: 10, // Higher priority
      attempts: 5   // Override default attempts
    }
  );
  
  return job.id;
}

// Job consumer - process jobs
pointsProcessingQueue.process('redemption', async (job) => {
  const { userId, amount } = job.data;
  
  try {
    // 1. Verify user has sufficient points
    const userPoints = await pointsRepository.getUserPointsTotal(userId);
    if (userPoints < amount) {
      throw new Error('Insufficient points');
    }
    
    // 2. Deduct points from user
    await pointsRepository.deductPoints({
      userId,
      amount,
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
  } catch (error) {
    // Handle failure with points refund logic
    // (implementation details omitted for brevity)
  }
});
```

### 5.2 WebSocket Implementation

```typescript
// WebSocket handler for real-time updates
import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

export default async function websocketPlugin(fastify: FastifyInstance) {
  // Register WebSocket plugin
  fastify.register(require('@fastify/websocket'));
  
  // Create Redis client for pub/sub
  const redis = new Redis(process.env.REDIS_URL);
  
  // WebSocket connection handler
  fastify.get('/ws', { websocket: true }, (connection, request) => {
    // Authenticate connection
    const userId = authenticateWebsocketConnection(request);
    if (!userId) {
      connection.socket.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Unauthorized' }
      }));
      connection.socket.close();
      return;
    }
    
    // Handle messages and subscriptions
    // (implementation details omitted for brevity)
  });
}

// WebSocket reconnection strategy (client-side implementation guidance)
const createWebSocketConnection = (userId, authToken) => {
  let reconnectAttempts = 0;
  let maxReconnectAttempts = 5;
  let reconnectDelay = 1000;
  let ws = null;
  
  const connect = () => {
    ws = new WebSocket(`${WS_URL}?token=${authToken}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts = 0;
      reconnectDelay = 1000;
      
      // Subscribe to user-specific channels
      ws.send(JSON.stringify({
        type: 'subscribe',
        payload: {
          channels: [`user:${userId}:notifications`, 'public:announcements']
        }
      }));
      
      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 30000);
    };
    
    ws.onclose = (event) => {
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        // Exponential backoff with jitter for reconnection
        const jitter = Math.random() * 0.3 + 0.85; // Random factor between 0.85-1.15
        const delay = reconnectDelay * Math.pow(1.5, reconnectAttempts - 1) * jitter;
        console.log(`WebSocket closed. Reconnecting in ${Math.round(delay)}ms...`);
        setTimeout(connect, delay);
      } else {
        console.error('WebSocket connection failed after maximum attempts');
        // Notify application of connection failure
        dispatchEvent(new CustomEvent('ws:connection-failed'));
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle pong responses to reset connection timeout
        if (message.type === 'pong') {
          return;
        }
        
        // Process other message types
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error processing WebSocket message', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };
  };
  
  // Start connection
  connect();
  
  // Return controls for the connection
  return {
    send: (message) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      } else {
        console.warn('Cannot send message, WebSocket not connected');
      }
    },
    close: () => {
      if (ws) {
        ws.close();
      }
    }
  };
};
```

### 5.3 WebSocket Connection Management

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

// Usage example with event bus
eventBus.subscribe('points.awarded', (event) => {
  connectionRegistry.sendToUser(event.userId, {
    type: 'points.update',
    data: {
      amount: event.amount,
      source: event.source,
      timestamp: event.timestamp
    }
  });
});
```

---

## 6. Data Model & Repository Implementation

### 6.1 Core Database Entities

```typescript
// TypeScript representation of key database entities

// Users and Profiles
interface User {
  id: string;
  email: string;
  display_name: string;
  auth_provider: string;
  created_at: Date;
  last_login: Date;
  status: 'active' | 'suspended' | 'deleted';
}

interface Profile {
  user_id: string;
  bio: string;
  avatar_url: string;
  level: number;
  title: string;
  social_links: Record<string, string>;
  preferences: Record<string, any>;
}

// Points System
interface UserPoints {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  reference_id: string;
  created_at: Date;
  description: string;
}

// Content entities
interface Content {
  id: string;
  user_id: string;
  type: 'text' | 'image' | 'link' | 'poll';
  content_text: string;
  media_urls: string[];
  created_at: Date;
  updated_at: Date;
  status: 'active' | 'deleted' | 'flagged';
}
```

### 6.2 Repository Pattern Implementation

```typescript
// src/repositories/points-repository.ts
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';

export interface PointsTransaction {
  userId: string;
  amount: number;
  source: string;
  referenceId?: string;
  description?: string;
}

export class PointsRepository {
  constructor(private db: Pool) {}
  
  async getUserPointsTotal(userId: string): Promise<number> {
    try {
      const result = await this.db.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM user_points WHERE user_id = $1',
        [userId]
      );
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      logger.error('Failed to get user points total', { userId, error });
      throw new Error('Failed to get user points total');
    }
  }
  
  // Additional methods omitted for brevity
}
```

### 6.3 Detailed Database Transaction Handling

For operations that affect multiple tables or require atomic execution, use proper transaction management:

```typescript
// Example of transferring points between users with transaction handling
async function transferPointsBetweenUsers(fromUserId: string, toUserId: string, amount: number): Promise<void> {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Deduct points from one user
    await client.query(
      'INSERT INTO user_points(id, user_id, amount, source, reference_id) VALUES($1, $2, $3, $4, $5)',
      [uuidv4(), fromUserId, -amount, 'transfer_out', toUserId]
    );
    
    // Add points to another user
    await client.query(
      'INSERT INTO user_points(id, user_id, amount, source, reference_id) VALUES($1, $2, $3, $4, $5)',
      [uuidv4(), toUserId, amount, 'transfer_in', fromUserId]
    );
    
    // Update both user profiles
    await client.query(
      'UPDATE profiles SET total_points = total_points - $1 WHERE user_id = $2',
      [amount, fromUserId]
    );
    
    await client.query(
      'UPDATE profiles SET total_points = total_points + $1 WHERE user_id = $2',
      [amount, toUserId]
    );
    
    // Check for invariants - ensure no user has negative points
    const fromUserResult = await client.query(
      'SELECT total_points FROM profiles WHERE user_id = $1',
      [fromUserId]
    );
    
    if (fromUserResult.rows[0].total_points < 0) {
      throw new Error('Insufficient points for transfer');
    }
    
    // Record the transfer in transaction log
    await client.query(
      'INSERT INTO point_transfers(id, from_user_id, to_user_id, amount, created_at) VALUES($1, $2, $3, $4, $5)',
      [uuidv4(), fromUserId, toUserId, amount, new Date()]
    );
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Points transfer failed', { fromUserId, toUserId, amount, error });
    throw error;
  } finally {
    client.release();
  }
}
```

### 6.3 Service Layer Implementation

```typescript
// src/services/points-service.ts
import { PointsRepository, PointsTransaction } from '../repositories/points-repository';
import { EventBus } from '../lib/event-bus';
import { logger } from '../lib/logger';
import { PointsLimitError, ValidationError } from '../lib/errors';
import { POINTS_CONFIG } from '../config/points-config';

export class PointsService {
  constructor(
    private pointsRepository: PointsRepository,
    private eventBus: EventBus
  ) {}
  
  async awardPoints(userId: string, amount: number, source: string, referenceId?: string): Promise<{ success: boolean; amount: number; total: number }> {
    // Input validation
    if (amount <= 0) {
      throw new ValidationError('Points amount must be positive');
    }
    
    // Implementation details omitted for brevity
    
    return { success: true, amount, total };
  }
}
```

### 6.4 Wallet Verification Enhancement

```typescript
// Enhanced wallet verification service
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
    logger.error('Wallet verification error', { 
      walletAddress, 
      error: error.message 
    });
    return false;
  }
}

// Connect wallet with additional validations
async function connectWallet(userId: string, walletAddress: string): Promise<WalletConnection> {
  // Validate wallet address format
  if (!isValidWalletAddress(walletAddress)) {
    throw new ValidationError('Invalid wallet address format');
  }
  
  // Check if wallet already connected to another user
  const existingConnection = await walletRepository.findByAddress(walletAddress);
  if (existingConnection && existingConnection.userId !== userId) {
    throw new ConflictError('Wallet already connected to another account');
  }
  
  // Create or update wallet connection
  return walletRepository.saveConnection({
    userId,
    walletAddress,
    connectedAt: new Date(),
    isVerified: true
  });
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

### 8.2 Caching Strategy

```typescript
// Caching service implementation
export async function getFromCache<T>(key: string, options?: CacheOptions): Promise<T | null> {
  const opts = { ...defaultOptions, ...options };
  const fullKey = `${opts.prefix}${key}`;
  
  try {
    const value = await redis.get(fullKey);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    if (!opts.ignoreErrors) throw error;
    return null;
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

### 8.3 Query Optimization

```typescript
// Optimized query example for content feed
async function getContentFeed(lastId: string | null = null, limit: number = 20): Promise<any[]> {
  // Use keyset pagination for better performance
  let query = `
    SELECT c.id, c.type, c.content_text, c.created_at,
           u.display_name as author_name, 
           p.avatar_url as author_avatar,
           (SELECT COUNT(*) FROM comments WHERE content_id = c.id) as comment_count
    FROM content c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE c.status = 'active'
  `;
  
  // Apply keyset pagination
  if (lastId) {
    query += ` AND c.id < $1 ORDER BY c.id DESC LIMIT $2`;
    return db.query(query, [lastId, limit]);
  } else {
    query += ` ORDER BY c.id DESC LIMIT $1`;
    return db.query(query, [limit]);
  }
}
```

### 8.4 Monitoring Strategy

```typescript
// Health check implementation
app.get('/health', async (request, reply) => {
  const checks = {
    database: await checkDatabaseConnection(),
    redis: await checkRedisConnection(),
    queues: await checkQueueStatus()
  };
  
  const status = Object.values(checks).every(Boolean) ? 'healthy' : 'unhealthy';
  const statusCode = status === 'healthy' ? 200 : 503;
  
  return reply.code(statusCode).send({
    status,
    checks,
    timestamp: new Date().toISOString()
  });
});

// Performance monitoring middleware
app.addHook('onRequest', async (request, reply) => {
  request.locals = request.locals || {};
  request.locals.startTime = process.hrtime();
});

app.addHook('onResponse', async (request, reply) => {
  const startTime = request.locals?.startTime;
  if (startTime) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
    
    // Log and report metrics
    request.log.info({
      responseTime: responseTimeMs,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode
    });
    
    // Send to metrics collection system
    metrics.recordResponseTime(request.routerPath, responseTimeMs);
  }
});
```

### 8.5 Feature Flag Implementation

```typescript
// Feature flag service
class FeatureFlagService {
  private redis: Redis;
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  async isFeatureEnabled(featureName: string, userId?: string): Promise<boolean> {
    // Check user-specific override
    if (userId) {
      const userOverride = await this.redis.get(`feature:${featureName}:user:${userId}`);
      if (userOverride !== null) {
        return userOverride === 'true';
      }
    }
    
    // Check global flag
    const globalFlag = await this.redis.get(`feature:${featureName}`);
    return globalFlag === 'true';
  }
  
  async setFeatureFlag(featureName: string, enabled: boolean): Promise<void> {
    await this.redis.set(`feature:${featureName}`, enabled ? 'true' : 'false');
  }
  
  async setUserFeatureFlag(featureName: string, userId: string, enabled: boolean): Promise<void> {
    await this.redis.set(`feature:${featureName}:user:${userId}`, enabled ? 'true' : 'false');
  }
}

// Usage in API handler
app.get('/api/content', async (request, reply) => {
  const featureFlags = request.diContainer.resolve('featureFlagService');
  
  // Check if new content algorithm is enabled
  const useNewAlgorithm = await featureFlags.isFeatureEnabled('new-content-algorithm', request.user?.id);
  
  const content = useNewAlgorithm
    ? await contentService.getContentWithNewAlgorithm()
    : await contentService.getContent();
    
  // Return response
  return reply.send({ data: content });
});
```

---

## 9. Testing Strategy

### 9.1 Unit Test Pattern for Services

```typescript
// Unit test for points service
describe('PointsService', () => {
  let pointsService;
  let mockPointsRepository;
  let mockSecurityService;
  let mockEventBus;
  
  beforeEach(() => {
    // Setup mocks
    mockPointsRepository = {
      getUserPointsTotal: jest.fn(),
      getDailyPointsBySource: jest.fn(),
      getRecentPointsActivity: jest.fn(),
      addPointsTransaction: jest.fn()
    };
    
    mockSecurityService = {
      checkRateLimit: jest.fn(),
      checkForAnomalousActivity: jest.fn(),
      logSuspiciousActivity: jest.fn()
    };
    
    mockEventBus = {
      publish: jest.fn()
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

### 9.2 Testing Categories and Approaches

| Test Type | Focus | Tools | Approach |
|-----------|-------|-------|----------|
| **Unit Tests** | Individual functions and classes | Jest, ts-jest | Mock dependencies, test business logic |
| **Integration Tests** | Module interactions | Jest, Supertest | Test API endpoints, database interactions |
| **Contract Tests** | API contracts | Pact.js | Verify frontend/backend compatibility |
| **Performance Tests** | Response times, throughput | autocannon, k6 | Benchmark critical endpoints |
| **Security Tests** | Vulnerability detection | OWASP ZAP, SonarQube | Scan code and API endpoints |

---

## 10. CI/CD Implementation

### 10.1 GitHub Actions Workflow

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
    
    services:
      # Database services for testing
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:6
        ports:
          - 6379:6379
    
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

  # Deployment jobs omitted for brevity
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
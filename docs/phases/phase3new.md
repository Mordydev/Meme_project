# Wild 'n Out Meme Coin Platform: Phase 3 Backend Implementation

## Project Context
This implementation is part of a comprehensive five-phase development process:
1. **Phase 1:** Project Structure, Environment & Dependencies Setup ✓ *Completed*
2. **Phase 2:** Complete Frontend Implementation ✓ *Completed*
3. **Phase 3:** Complete Backend Implementation ← *Current Phase*
4. **Phase 4:** Integration, Review, and Polish
5. **Phase 5:** Deployment and Production Readiness

## Primary Objective
Implement a high-performance, secure, and scalable backend that supports all frontend features while ensuring platform reliability, data integrity, and blockchain integration to drive the project toward its $500M+ market cap goal.

## Table of Contents
- [Task 1: Core Infrastructure & Architecture](#task-1-core-infrastructure--architecture)
- [Task 2: Authentication & Authorization System](#task-2-authentication--authorization-system)
- [Task 3: Battle System Backend](#task-3-battle-system-backend)
- [Task 4: Content Management System](#task-4-content-management-system)
- [Task 5: Community & Social Features](#task-5-community--social-features)
- [Task 6: Token & Blockchain Integration](#task-6-token--blockchain-integration)
- [Task 7: User Profile & Achievement Backend](#task-7-user-profile--achievement-backend)
- [Task 8: Real-time Communication System](#task-8-real-time-communication-system)
- [Task 9: Data Storage & Database Optimization](#task-9-data-storage--database-optimization)
- [Task 10: Security, Monitoring & DevOps](#task-10-security-monitoring--devops)

---

# Task 1: Core Infrastructure & Architecture

## Task Overview
- **Purpose:** Establish the fundamental backend architecture, project structure, and infrastructure
- **Value:** Creates a scalable, maintainable foundation that enables rapid development of all features
- **Dependencies:** This is the foundation for all other backend tasks

## Implementation Sub-Tasks

### Sub-Task 1.1: Service Architecture ⭐️ *PRIORITY*

**Goal:** Establish a service-oriented architecture with proper dependency injection and clean separation of concerns

**Key Implementation:**
```typescript
// src/services/service-provider.ts
import { FastifyInstance } from 'fastify';
import { BattleService } from './battle-service';
import { ContentService } from './content-service';
import { UserService } from './user-service';
import { TokenService } from './token-service';
// Import other services

export interface ServiceContainer {
  battleService: BattleService;
  contentService: ContentService;
  userService: UserService;
  tokenService: TokenService;
  // Other services
}

export async function registerServices(fastify: FastifyInstance): Promise<void> {
  // Initialize repositories first (using the repository pattern)
  const battleRepository = new BattleRepository(fastify.db);
  const contentRepository = new ContentRepository(fastify.db);
  const userRepository = new UserRepository(fastify.db);
  // Initialize other repositories

  // Initialize services with their dependencies
  const userService = new UserService(userRepository);
  const contentService = new ContentService(contentRepository);
  const battleService = new BattleService(battleRepository, fastify.eventEmitter);
  const tokenService = new TokenService(fastify.config.token);
  // Initialize other services

  // Register services with fastify for global access
  fastify.decorate('services', {
    battleService,
    contentService,
    userService,
    tokenService,
    // Other services
  });
}

// Example service interface
// src/services/interfaces/battle-service.interface.ts
export interface IBattleService {
  findById(id: string): Promise<Battle | null>;
  create(data: CreateBattleInput): Promise<Battle>;
  listActive(limit?: number, cursor?: string): Promise<Battle[]>;
  updateStatus(id: string, status: BattleStatus): Promise<Battle>;
  // Other methods
}
```

**Example Service Implementation:**
```typescript
// src/services/battle-service.ts
import { IBattleService } from './interfaces/battle-service.interface';
import { IBattleRepository } from '../repositories/interfaces/battle-repository.interface';
import { EventEmitter } from '../lib/events';

export class BattleService implements IBattleService {
  constructor(
    private battleRepository: IBattleRepository,
    private eventEmitter: EventEmitter
  ) {}
  
  async findById(id: string): Promise<Battle | null> {
    return this.battleRepository.findById(id);
  }
  
  async create(data: CreateBattleInput): Promise<Battle> {
    const battle = await this.battleRepository.create(data);
    
    // Emit event instead of directly calling other services
    this.eventEmitter.emit('battle.created', {
      battleId: battle.id,
      creatorId: battle.creatorId,
      battleType: battle.type
    });
    
    return battle;
  }
  
  // Other methods
}
```

**Essential Requirements:**
- Implement interface-based service design for all core services
- Use constructor dependency injection for all service dependencies
- Create centralized service registration pattern
- Provide proper typing for all service methods

**Key Best Practices:**
- Services should not directly instantiate repositories or other services
- Implement services behind interfaces for testability
- Use event-based communication between services when appropriate
- Apply consistent service naming and structure

### Sub-Task 1.2: Event-Driven Communication System ⭐️ *PRIORITY*

**Goal:** Implement an event-driven architecture for loose coupling between services

**Key Implementation:**
```typescript
// src/lib/events.ts
import { EventEmitter as NodeEventEmitter } from 'events';
import { logger } from './logger';

// Define the event types
export enum EventType {
  // User events
  USER_REGISTERED = 'user.registered',
  USER_UPDATED = 'user.updated',
  
  // Content events
  CONTENT_CREATED = 'content.created',
  CONTENT_UPDATED = 'content.updated',
  
  // Battle events
  BATTLE_CREATED = 'battle.created',
  BATTLE_UPDATED = 'battle.updated',
  BATTLE_ACTIVATED = 'battle.activated',
  BATTLE_VOTING_STARTED = 'battle.votingStarted',
  BATTLE_COMPLETED = 'battle.completed',
  
  // Social events
  REACTION_CREATED = 'reaction.created',
  COMMENT_CREATED = 'comment.created',
  FOLLOW_CREATED = 'follow.created',
  
  // Token events
  TOKEN_MILESTONE = 'token.milestone'
}

// Event payload type definitions
export interface BattleCreatedEvent {
  battleId: string;
  creatorId: string;
  battleType: string;
}

export interface ContentCreatedEvent {
  contentId: string;
  creatorId: string;
  contentType: string;
}

// Add more event interfaces for other event types

// Create a singleton event emitter
export class EventEmitter extends NodeEventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Increase from default 10
  }
  
  emit(event: string | symbol, ...args: any[]): boolean {
    logger.debug({ event, args: args[0] }, 'Event emitted');
    return super.emit(event, ...args);
  }
}

export const eventEmitter = new EventEmitter();

// Register with Fastify
export function registerEventSystem(fastify: FastifyInstance): void {
  fastify.decorate('eventEmitter', eventEmitter);
  
  // Register event handlers for WebSocket broadcasting
  if (fastify.ws) {
    // User events
    eventEmitter.on(EventType.USER_UPDATED, (data) => {
      fastify.ws.sendToUser(data.userId, 'profile.updated', data);
    });
    
    // Battle events
    eventEmitter.on(EventType.BATTLE_ACTIVATED, (data) => {
      fastify.ws.broadcast('battle.activated', data);
    });
    
    // More event handlers
  }
}
```

**Essential Requirements:**
- Implement typed events with proper payload interfaces
- Create centralized event registration
- Provide WebSocket integration for real-time updates
- Document event patterns and usage

**Key Best Practices:**
- Use typed events for compile-time validation
- Implement proper logging of events for debugging
- Create consistent event naming patterns
- Apply event-driven communication between services

### Sub-Task 1.3: Repository Pattern ⭐️ *PRIORITY*

**Goal:** Implement a standardized repository pattern for data access

**Key Implementation:**
```typescript
// src/repositories/base-repository.ts
import { Pool, QueryResult } from 'pg';
import { CacheService } from '../services/cache-service';
import { logger } from '../lib/logger';

export abstract class BaseRepository<T> {
  constructor(
    protected pool: Pool,
    protected tableName: string,
    protected cacheService?: CacheService
  ) {}
  
  async findById(id: string, options: { useCache?: boolean } = {}): Promise<T | null> {
    const useCache = options.useCache !== false && this.cacheService;
    const cacheKey = `${this.tableName}:${id}`;
    
    // Try to get from cache first
    if (useCache) {
      const cached = await this.cacheService.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const item = this.mapRowToEntity(result.rows[0]);
      
      // Cache result
      if (useCache) {
        await this.cacheService.set(cacheKey, item, 300); // 5 minutes TTL
      }
      
      return item;
    } catch (error) {
      logger.error(
        { error, tableName: this.tableName, id },
        'Failed to find by ID'
      );
      throw error;
    }
  }
  
  async findMany(
    conditions: Partial<T> = {},
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDir?: 'ASC' | 'DESC';
      useCache?: boolean;
    } = {}
  ): Promise<T[]> {
    // Implementation with query building, pagination, and caching
  }
  
  async create(data: Omit<T, 'id'>): Promise<T> {
    // Implementation with proper type handling
  }
  
  async update(id: string, data: Partial<T>): Promise<T | null> {
    // Implementation with cache invalidation
  }
  
  async delete(id: string): Promise<boolean> {
    // Implementation with cache invalidation
  }
  
  // Optimized transaction handling
  async withTransaction<R>(
    callback: (client: any) => Promise<R>
  ): Promise<R> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  protected abstract mapRowToEntity(row: any): T;
}
```

**Example Implementation:**
```typescript
// src/repositories/battle-repository.ts
import { BaseRepository } from './base-repository';
import { IBattleRepository } from './interfaces/battle-repository.interface';
import { Battle, CreateBattleInput } from '../models/battle';

export class BattleRepository extends BaseRepository<Battle> implements IBattleRepository {
  constructor(pool, cacheService?) {
    super(pool, 'battles', cacheService);
  }
  
  protected mapRowToEntity(row: any): Battle {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      battleType: row.type,
      status: row.status,
      creatorId: row.creator_id,
      startTime: row.start_time,
      endTime: row.end_time,
      // More field mappings
    };
  }
  
  // Add specialized methods for battle repository
}
```

**Essential Requirements:**
- Implement generic base repository with typed methods
- Create consistent data access patterns
- Provide transaction support
- Add caching integration with invalidation

**Key Best Practices:**
- Use repository interfaces for all data access
- Apply consistent error handling
- Create clear mapping between database and domain models
- Implement proper transaction boundaries

### Sub-Task 1.4: Adaptive Caching Strategy ⭐️ *PRIORITY*

**Goal:** Implement an adaptive caching system that adjusts based on system load

**Key Implementation:**
```typescript
// src/services/cache-service.ts
import Redis from 'ioredis';
import { getSystemStatus } from '../monitoring/system-status';
import { logger } from '../lib/logger';

// Cache TTL multipliers based on system status
const TTL_MULTIPLIERS = {
  HEALTHY: 1,    // Normal TTL
  DEGRADED: 2,   // Double TTL to reduce load
  CRITICAL: 5    // 5x TTL during critical periods
};

export class CacheService {
  private redis: Redis;
  
  constructor(config) {
    this.redis = new Redis(config.redis.url, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });
    
    this.redis.on('error', (err) => {
      logger.error({ err }, 'Redis cache error');
    });
  }
  
  // Get effective TTL based on system status
  private async getEffectiveTtl(baseTtl: number): Promise<number> {
    const status = await getSystemStatus();
    return baseTtl * TTL_MULTIPLIERS[status];
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(`cache:${key}`);
      
      if (!cached) {
        return null;
      }
      
      return JSON.parse(cached);
    } catch (error) {
      logger.error({ error, key }, 'Cache get failed');
      return null;
    }
  }
  
  async set<T>(key: string, value: T, ttl = 60): Promise<void> {
    try {
      const effectiveTtl = await this.getEffectiveTtl(ttl);
      
      await this.redis.set(
        `cache:${key}`,
        JSON.stringify(value),
        'EX',
        effectiveTtl
      );
    } catch (error) {
      logger.error({ error, key }, 'Cache set failed');
    }
  }
  
  async invalidate(key: string): Promise<void> {
    try {
      await this.redis.del(`cache:${key}`);
    } catch (error) {
      logger.error({ error, key }, 'Cache invalidation failed');
    }
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`cache:${pattern}`);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Pattern invalidation failed');
    }
  }
  
  // Combine with getOrSet pattern for cleaner usage
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = 60
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // If not in cache, fetch and store
    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }
}
```

**Essential Requirements:**
- Implement Redis-based cache with connection resilience
- Create adaptive TTL based on system load
- Provide pattern-based cache invalidation
- Add helper methods for common cache operations

**Key Best Practices:**
- Use typed cache operations
- Implement fallback for cache failures
- Create consistent cache key patterns
- Apply proper error handling and logging

### Sub-Task 1.5: Application Configuration ⭐️ *PRIORITY*

**Goal:** Establish a robust configuration system with environment-specific settings

**Key Implementation:**
```typescript
// src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../lib/logger';

// Load appropriate .env file
const envFile = process.env.NODE_ENV === 'production' ? '.env' : `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export interface Config {
  app: {
    name: string;
    port: number;
    host: string;
    environment: string;
    apiPrefix: string;
  };
  database: {
    url: string;
    poolSize: number;
    idleTimeout: number;
  };
  redis: {
    url: string;
    maxRetriesPerRequest: number;
  };
  security: {
    cors: {
      origin: string[];
      methods: string[];
      credentials: boolean;
    };
    rateLimit: {
      standard: {
        max: number;
        timeWindow: number;
      };
      auth: {
        max: number;
        timeWindow: number;
      };
    };
    jwt: {
      secret: string;
      expiresIn: string;
    };
  };
  token: {
    mintAddress: string;
    rpcUrl: string[];
    fallbackRpcUrl: string[];
  };
  // Other configuration sections...
}

// Default configuration values
const config: Config = {
  app: {
    name: process.env.APP_NAME || 'wild-n-out-backend',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api'
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wildnout',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10)
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10)
  },
  security: {
    cors: {
      origin: (process.env.CORS_ORIGIN || '*').split(','),
      methods: (process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,PATCH').split(','),
      credentials: process.env.CORS_CREDENTIALS === 'true'
    },
    rateLimit: {
      standard: {
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10)
      },
      auth: {
        max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
        timeWindow: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '60000', 10)
      }
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  },
  token: {
    mintAddress: process.env.TOKEN_MINT_ADDRESS || '',
    rpcUrl: (process.env.SOLANA_RPC_URLS || 'https://api.mainnet-beta.solana.com').split(','),
    fallbackRpcUrl: (process.env.SOLANA_FALLBACK_RPC_URLS || '').split(',').filter(Boolean)
  }
  // Other configuration sections...
};

// Validate required configuration
function validateConfig(config: Config): void {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  // Validate specific config values
  if (config.app.environment === 'production') {
    if (config.security.jwt.secret === 'super-secret-key-change-in-production') {
      logger.error('Default JWT secret used in production environment');
      process.exit(1);
    }
  }
  
  logger.info({
    environment: config.app.environment,
    port: config.app.port
  }, 'Configuration loaded successfully');
}

validateConfig(config);

export default config;
```

**Essential Requirements:**
- Create environment-specific configuration loading
- Implement config validation with required fields
- Provide sensible defaults for non-critical settings
- Add production-specific validation rules

**Key Best Practices:**
- Use strongly typed configuration
- Implement clear error messages for missing values
- Create centralized configuration access
- Support different environments (dev, test, prod)

## Testing Strategy
- Unit tests for core infrastructure components
- Integration tests for service communication
- Repository integration tests
- Cache effectiveness tests
- System status adaptation tests

## Definition of Done
- [ ] Service architecture implemented with proper interfaces and dependency injection
- [ ] Event system functioning with typed events
- [ ] Repository pattern applied consistently across data access
- [ ] Adaptive caching strategy implemented and verified
- [ ] Configuration loading working for all environments
- [ ] All core infrastructure tests passing

---

# Task 2: Authentication & Authorization System

## Task Overview
- **Purpose:** Implement secure user authentication and role-based authorization
- **Value:** Ensures platform security and appropriate access control for all features
- **Dependencies:** Relies on Core Backend Infrastructure; required for all authenticated features

## Implementation Sub-Tasks

### Sub-Task 2.1: Clerk Authentication Integration ⭐️ *PRIORITY*

**Goal:** Implement backend authentication using Clerk

**Key Implementation:**
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

**Essential Requirements:**
- Integrate Clerk SDK for backend authentication
- Implement JWT validation middleware
- Create user synchronization with internal database
- Setup session management
- Implement proper error handling for auth failures

**Key Best Practices:**
- Validate tokens server-side for security
- Implement proper error handling for auth failures
- Use environment variables for auth configuration
- Create clear authentication middleware
- Log authentication events securely

### Sub-Task 2.2: Authorization System ⭐️ *PRIORITY*

**Goal:** Implement role-based access control for platform features

**Key Implementation:**
```typescript
// src/middleware/authorization.ts
import { FastifyRequest, FastifyReply } from 'fastify';

export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request;
    
    if (!user) {
      return reply.code(401).send({
        error: {
          code: 'unauthorized',
          message: 'Authentication required'
        }
      });
    }
    
    const userRole = user.publicMetadata?.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return reply.code(403).send({
        error: {
          code: 'forbidden',
          message: 'Insufficient permissions'
        }
      });
    }
  };
}

// Usage in route
fastify.get(
  '/admin/battles',
  { preHandler: [authenticate, requireRole(['admin', 'moderator'])] },
  async (request, reply) => {
    // Handler implementation...
  }
);
```

**Essential Requirements:**
- Implement role-based access control system
- Create resource-based permission checks
- Implement user ownership validation
- Setup moderator and admin roles
- Create authentication middleware composition

**Key Best Practices:**
- Implement principle of least privilege
- Create granular permission checks
- Apply consistent authorization patterns
- Document role requirements for endpoints
- Implement proper audit logging

### Sub-Task 2.3: Security Middleware ⭐️ *PRIORITY*

**Goal:** Implement comprehensive security middleware

**Key Implementation:**
```typescript
// src/plugins/security.ts
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

export default fp(async (fastify: FastifyInstance) => {
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
  
  // Add more granular rate limits for specific routes
  await fastify.register(async (instance) => {
    // More strict limit for auth routes
    instance.register(rateLimit, {
      prefix: '/api/auth',
      max: 5,
      timeWindow: '1 minute'
    });
    
    // Limit for wallet verification
    instance.register(rateLimit, {
      prefix: '/api/wallet/verify',
      max: 5,
      timeWindow: '1 minute'
    });
  });
  
  // Add CSRF protection for sensitive routes
  fastify.addHook('onRequest', (request, reply, done) => {
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
```

**Essential Requirements:**
- Implement CSRF protection for sensitive operations
- Setup rate limiting for API endpoints
- Configure secure HTTP headers
- Implement input validation for all requests
- Setup XSS protection

**Key Best Practices:**
- Apply defense-in-depth approach
- Implement strict Content Security Policy
- Apply appropriate rate limits by endpoint type
- Validate all user inputs
- Use secure HTTP headers

## Testing Strategy
- Authentication flow testing
- Authorization rule validation
- Security middleware testing
- Token validation and expiry testing
- Rate limiting verification

## Definition of Done
- [ ] Clerk authentication fully integrated
- [ ] Role-based authorization system implemented
- [ ] Security middleware configured and tested
- [ ] CSRF protection implemented for sensitive routes
- [ ] Rate limiting applied to all endpoints
- [ ] Input validation implemented for all requests
- [ ] Security headers configured appropriately
- [ ] All authentication and security tests passing

---

# Task 3: Battle System Backend

## Task Overview
- **Purpose:** Implement the core battle system backend supporting the platform's competitive features
- **Value:** Enables the distinctive Wild 'n Out battle experience that drives user engagement
- **Dependencies:** Relies on Core Backend and Authentication; supports Battle UI from frontend

## Implementation Sub-Tasks

### Sub-Task 3.1: Battle Service Implementation ⭐️ *PRIORITY*

**Goal:** Create the core battle service with proper event integration

**Key Implementation:**
```typescript
// src/services/battle-service.ts
import { IBattleService } from './interfaces/battle-service.interface';
import { IBattleRepository } from '../repositories/interfaces/battle-repository.interface';
import { EventEmitter, EventType } from '../lib/events';
import { Battle, CreateBattleInput } from '../models/battle';
import { ValidationError, NotFoundError } from '../errors';

export class BattleService implements IBattleService {
  constructor(
    private battleRepository: IBattleRepository,
    private eventEmitter: EventEmitter
  ) {}
  
  async getBattleById(id: string): Promise<Battle> {
    const battle = await this.battleRepository.findById(id);
    
    if (!battle) {
      throw new NotFoundError(`Battle not found: ${id}`, 'battle');
    }
    
    return battle;
  }
  
  async createBattle(data: CreateBattleInput): Promise<Battle> {
    // Validate battle data
    this.validateBattleData(data);
    
    // Create battle
    const battle = await this.battleRepository.create({
      ...data,
      status: this.determineBattleStatus(data.startTime, data.endTime),
      participantCount: 0,
      entryCount: 0,
      voteCount: 0
    });
    
    // Emit event (rather than directly calling other services)
    this.eventEmitter.emit(EventType.BATTLE_CREATED, {
      battleId: battle.id,
      creatorId: battle.creatorId,
      battleType: battle.battleType,
      title: battle.title
    });
    
    return battle;
  }
  
  async listActiveBattles(limit = 20, cursor?: string): Promise<Battle[]> {
    return this.battleRepository.findMany(
      { status: 'active' },
      { 
        limit,
        orderBy: 'startTime',
        orderDir: 'ASC',
        cursor
      }
    );
  }
  
  async updateBattleStatus(id: string, status: string): Promise<Battle> {
    const battle = await this.getBattleById(id);
    
    // Validate status transition
    this.validateStatusTransition(battle.status, status);
    
    // Update battle
    const updatedBattle = await this.battleRepository.update(id, { status });
    
    // Emit appropriate event based on new status
    switch (status) {
      case 'active':
        this.eventEmitter.emit(EventType.BATTLE_ACTIVATED, { battleId: id });
        break;
      case 'voting':
        this.eventEmitter.emit(EventType.BATTLE_VOTING_STARTED, { battleId: id });
        break;
      case 'completed':
        this.eventEmitter.emit(EventType.BATTLE_COMPLETED, { battleId: id });
        break;
    }
    
    return updatedBattle;
  }
  
  private validateBattleData(data: CreateBattleInput): void {
    const errors: Record<string, string> = {};
    
    if (!data.title || data.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    
    if (!data.description) {
      errors.description = 'Description is required';
    }
    
    if (!data.battleType) {
      errors.battleType = 'Battle type is required';
    }
    
    if (new Date(data.startTime) >= new Date(data.endTime)) {
      errors.endTime = 'End time must be after start time';
    }
    
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Invalid battle data', errors);
    }
  }
  
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions = {
      'upcoming': ['active', 'cancelled'],
      'active': ['voting', 'cancelled'],
      'voting': ['completed'],
      'completed': [],
      'cancelled': []
    };
    
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        { status: `Cannot transition from ${currentStatus} to ${newStatus}` }
      );
    }
  }
  
  private determineBattleStatus(startTime: Date, endTime: Date): string {
    const now = new Date();
    
    if (now < new Date(startTime)) {
      return 'upcoming';
    } else if (now < new Date(endTime)) {
      return 'active';
    } else {
      return 'voting';
    }
  }
}
```

**Essential Requirements:**
- Implement battle CRUD operations using repository pattern
- Create proper validation for battle data
- Setup event emission for battle state changes
- Implement battle status management
- Create listing with pagination support

**Key Best Practices:**
- Use typed interfaces for service and repository
- Implement clear validation with specific error messages
- Apply event-driven communication for state changes
- Create consistent error handling patterns
- Use proper transaction boundaries

### Sub-Task 3.2: Entry Submission System ⭐️ *PRIORITY*

**Goal:** Implement the entry submission and validation system

**Key Implementation:**
```typescript
// src/services/entry-service.ts
import { IEntryService } from './interfaces/entry-service.interface';
import { IEntryRepository } from '../repositories/interfaces/entry-repository.interface';
import { IBattleService } from './interfaces/battle-service.interface';
import { EventEmitter, EventType } from '../lib/events';
import { BattleEntry, CreateEntryInput } from '../models/battle-entry';
import { ValidationError, NotFoundError } from '../errors';

export class EntryService implements IEntryService {
  constructor(
    private entryRepository: IEntryRepository,
    private battleService: IBattleService,
    private eventEmitter: EventEmitter
  ) {}
  
  async submitEntry(userId: string, battleId: string, data: CreateEntryInput): Promise<BattleEntry> {
    // Get battle to check status and rules
    const battle = await this.battleService.getBattleById(battleId);
    
    // Validate battle is open for submission
    if (battle.status !== 'active') {
      throw new ValidationError(
        'Battle is not accepting entries',
        { status: `Battle is ${battle.status}` }
      );
    }
    
    // Check if user already submitted
    const existingEntry = await this.entryRepository.findOne({ 
      battleId, 
      userId 
    });
    
    if (existingEntry) {
      throw new ValidationError(
        'You have already submitted an entry to this battle',
        { entry: existingEntry.id }
      );
    }
    
    // Validate entry against battle rules
    this.validateEntryAgainstRules(data, battle.rules);
    
    // Create entry
    const entry = await this.entryRepository.create({
      battleId,
      userId,
      content: data.content,
      moderation: { status: 'pending' },
      metrics: { viewCount: 0, voteCount: 0, commentCount: 0, shareCount: 0 },
      submissionTime: new Date()
    });
    
    // Emit event
    this.eventEmitter.emit(EventType.ENTRY_CREATED, {
      entryId: entry.id,
      battleId,
      userId
    });
    
    return entry;
  }
  
  async getEntryById(id: string): Promise<BattleEntry> {
    const entry = await this.entryRepository.findById(id);
    
    if (!entry) {
      throw new NotFoundError(`Entry not found: ${id}`, 'entry');
    }
    
    return entry;
  }
  
  async getBattleEntries(
    battleId: string,
    options: {
      status?: string,
      limit?: number,
      cursor?: string
    } = {}
  ): Promise<BattleEntry[]> {
    return this.entryRepository.findMany(
      { 
        battleId,
        ...(options.status ? { 'moderation.status': options.status } : {})
      },
      {
        limit: options.limit || 20,
        cursor: options.cursor
      }
    );
  }
  
  private validateEntryAgainstRules(data: CreateEntryInput, rules: any): void {
    const errors: Record<string, string> = {};
    
    // Check content type
    if (rules.allowedTypes && !rules.allowedTypes.includes(data.content.type)) {
      errors.contentType = `Content type must be one of: ${rules.allowedTypes.join(', ')}`;
    }
    
    // Check text length if applicable
    if (data.content.type === 'text' && rules.textLimits) {
      const textLength = data.content.text?.length || 0;
      
      if (rules.textLimits.min && textLength < rules.textLimits.min) {
        errors.textLength = `Text must be at least ${rules.textLimits.min} characters`;
      }
      
      if (rules.textLimits.max && textLength > rules.textLimits.max) {
        errors.textLength = `Text must be no more than ${rules.textLimits.max} characters`;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Entry does not meet battle rules', errors);
    }
  }
}
```

**Essential Requirements:**
- Implement entry submission with validation against battle rules
- Create entry retrieval with filtering and pagination
- Setup moderation status management
- Implement validation against multiple content types
- Create event emission for entry creation

**Key Best Practices:**
- Use dependency injection for service dependencies
- Implement proper validation with clear error messages
- Apply event-driven communication for notifications
- Create consistent repository usage patterns
- Use typed interfaces for all services

### Sub-Task 3.3: Voting and Results System ⭐️ *PRIORITY*

**Goal:** Implement the voting mechanics and results calculation system

**Key Implementation:**
```typescript
// src/services/voting-service.ts
import { IVotingService } from './interfaces/voting-service.interface';
import { IVoteRepository } from '../repositories/interfaces/vote-repository.interface';
import { IEntryRepository } from '../repositories/interfaces/entry-repository.interface';
import { IBattleService } from './interfaces/battle-service.interface';
import { EventEmitter, EventType } from '../lib/events';
import { Vote, CreateVoteInput } from '../models/vote';
import { ValidationError, NotFoundError } from '../errors';

export class VotingService implements IVotingService {
  constructor(
    private voteRepository: IVoteRepository,
    private entryRepository: IEntryRepository,
    private battleService: IBattleService,
    private eventEmitter: EventEmitter
  ) {}
  
  async castVote(userId: string, battleId: string, data: CreateVoteInput): Promise<Vote> {
    // Verify battle is in voting phase
    const battle = await this.battleService.getBattleById(battleId);
    
    if (battle.status !== 'voting') {
      throw new ValidationError(
        'Battle is not in voting phase',
        { status: `Battle is in ${battle.status} status` }
      );
    }
    
    // Verify entry exists
    const entry = await this.entryRepository.findOne({ 
      id: data.entryId,
      battleId
    });
    
    if (!entry) {
      throw new NotFoundError(`Entry not found: ${data.entryId}`, 'entry');
    }
    
    // Check if user already voted for this entry
    const existingVote = await this.voteRepository.findOne({
      userId,
      entryId: data.entryId
    });
    
    if (existingVote) {
      throw new ValidationError(
        'You have already voted for this entry',
        { vote: existingVote.id }
      );
    }
    
    // Create vote using transaction
    const vote = await this.voteRepository.withTransaction(async (client) => {
      // Create vote
      const newVote = await this.voteRepository.create({
        battleId,
        entryId: data.entryId,
        userId,
        value: data.value,
        timestamp: new Date()
      }, client);
      
      // Update entry vote count
      await this.entryRepository.incrementField(
        data.entryId,
        'metrics.voteCount',
        1,
        client
      );
      
      return newVote;
    });
    
    // Emit event
    this.eventEmitter.emit(EventType.VOTE_CREATED, {
      voteId: vote.id,
      battleId,
      entryId: data.entryId,
      userId
    });
    
    return vote;
  }
  
  async getUserVotes(userId: string, battleId: string): Promise<Vote[]> {
    return this.voteRepository.findMany({
      userId,
      battleId
    });
  }
  
  async getEntryVotes(entryId: string): Promise<Vote[]> {
    return this.voteRepository.findMany({
      entryId
    });
  }
  
  async calculateResults(battleId: string): Promise<void> {
    // Implement a fair ranking algorithm
    const battle = await this.battleService.getBattleById(battleId);
    
    if (battle.status !== 'voting' && battle.status !== 'completed') {
      throw new ValidationError(
        'Cannot calculate results',
        { status: `Battle is in ${battle.status} status` }
      );
    }
    
    // Get all entries for this battle
    const entries = await this.entryRepository.findMany({ battleId });
    
    // Get votes for each entry
    const entryVotes = {};
    for (const entry of entries) {
      const votes = await this.getEntryVotes(entry.id);
      entryVotes[entry.id] = votes.reduce((sum, vote) => sum + vote.value, 0);
    }
    
    // Calculate rankings
    const sortedEntries = [...entries].sort((a, b) => {
      const aVotes = entryVotes[a.id] || 0;
      const bVotes = entryVotes[b.id] || 0;
      return bVotes - aVotes; // Descending order
    });
    
    // Update rankings using transaction
    await this.entryRepository.withTransaction(async (client) => {
      for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        const rank = i + 1;
        
        await this.entryRepository.update(
          entry.id,
          { rank },
          client
        );
      }
      
      // Update battle status if needed
      if (battle.status === 'voting') {
        await this.battleService.updateBattleStatus(battleId, 'completed');
      }
    });
    
    // Emit event
    this.eventEmitter.emit(EventType.BATTLE_RESULTS_CALCULATED, {
      battleId,
      resultsTimestamp: new Date(),
      entries: sortedEntries.map((entry, index) => ({
        entryId: entry.id,
        userId: entry.userId,
        rank: index + 1,
        votes: entryVotes[entry.id] || 0
      }))
    });
  }
}
```

**Essential Requirements:**
- Implement voting with validation against battle state
- Create vote counting and storage with transactions
- Setup results calculation algorithm
- Implement ranking mechanism
- Create event emission for votes and results

**Key Best Practices:**
- Use transactions for data consistency
- Implement proper validation of voting conditions
- Apply event-driven communication for notifications
- Create clear ranking algorithm
- Use proper error handling for edge cases

## Testing Strategy
- Battle CRUD operation tests
- Entry submission with rule validation tests
- Voting mechanics and validation tests
- Results calculation algorithm tests
- Event emission verification

## Definition of Done
- [ ] Battle service implemented with proper validation
- [ ] Entry submission system working with rule validation
- [ ] Voting mechanics implemented with proper constraints
- [ ] Results calculation algorithm working correctly
- [ ] All events properly emitted for state changes
- [ ] All battle-related tests passing

---

# Task 4: Content Management System

## Task Overview
- **Purpose:** Implement the content creation, storage, and retrieval functionality
- **Value:** Enables the content creation features that drive user engagement and community interaction
- **Dependencies:** Relies on Core Backend and Authentication; supports Content Creation from frontend

## Implementation Sub-Tasks

### Sub-Task 4.1: Content Service Implementation ⭐️ *PRIORITY*

**Goal:** Create the core content service with proper validation and event emission

**Key Implementation:**
```typescript
// src/services/content-service.ts
import { IContentService } from './interfaces/content-service.interface';
import { IContentRepository } from '../repositories/interfaces/content-repository.interface';
import { EventEmitter, EventType } from '../lib/events';
import { Content, CreateContentInput } from '../models/content';
import { ValidationError, NotFoundError } from '../errors';

export class ContentService implements IContentService {
  constructor(
    private contentRepository: IContentRepository,
    private eventEmitter: EventEmitter
  ) {}
  
  async createContent(userId: string, data: CreateContentInput): Promise<Content> {
    // Validate content data
    this.validateContentData(data);
    
    // Determine initial status
    const status = data.isDraft ? 'draft' : 'published';
    
    // Create content
    const content = await this.contentRepository.create({
      ...data,
      status,
      creatorId: userId,
      moderation: { status: 'pending' },
      metrics: { viewCount: 0, likeCount: 0, commentCount: 0, shareCount: 0 },
      createdAt: new Date(),
      publishedAt: status === 'published' ? new Date() : null
    });
    
    // Emit event
    this.eventEmitter.emit(EventType.CONTENT_CREATED, {
      contentId: content.id,
      creatorId: userId,
      contentType: content.type,
      status
    });
    
    return content;
  }
  
  async getContentById(id: string): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    
    if (!content) {
      throw new NotFoundError(`Content not found: ${id}`, 'content');
    }
    
    return content;
  }
  
  async updateContent(id: string, userId: string, data: Partial<Content>): Promise<Content> {
    // Get existing content
    const content = await this.getContentById(id);
    
    // Verify ownership
    if (content.creatorId !== userId) {
      throw new ValidationError(
        'You do not own this content',
        { permission: 'Insufficient permissions to modify this content' }
      );
    }
    
    // Validate update data
    if (data.title || data.body || data.type) {
      this.validateContentData({
        ...content,
        ...data
      });
    }
    
    // Check for status change from draft to published
    let publishedAt = content.publishedAt;
    if (content.status === 'draft' && data.status === 'published') {
      publishedAt = new Date();
    }
    
    // Update content
    const updatedContent = await this.contentRepository.update(id, {
      ...data,
      publishedAt,
      updatedAt: new Date()
    });
    
    // Emit event
    this.eventEmitter.emit(EventType.CONTENT_UPDATED, {
      contentId: id,
      creatorId: userId,
      status: updatedContent.status
    });
    
    return updatedContent;
  }
  
  async listContent(
    options: {
      creatorId?: string;
      type?: string;
      status?: string;
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<Content[]> {
    return this.contentRepository.findMany(
      {
        creatorId: options.creatorId,
        type: options.type,
        status: options.status
      },
      {
        limit: options.limit || 20,
        cursor: options.cursor,
        orderBy: 'createdAt',
        orderDir: 'DESC'
      }
    );
  }
  
  private validateContentData(data: Partial<Content>): void {
    const errors: Record<string, string> = {};
    
    if ('title' in data && (!data.title || data.title.length < 3)) {
      errors.title = 'Title must be at least 3 characters';
    }
    
    if ('type' in data && !data.type) {
      errors.type = 'Content type is required';
    }
    
    // Require body or mediaUrl
    if ('body' in data || 'mediaUrl' in data) {
      if (!data.body && !data.mediaUrl) {
        errors.content = 'Content must have either text body or media';
      }
    }
    
    // Check content size limits
    if ('body' in data && data.body && data.body.length > 50000) {
      errors.body = 'Content body exceeds maximum length (50,000 characters)';
    }
    
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Invalid content data', errors);
    }
  }
}
```

**Essential Requirements:**
- Implement content CRUD operations using repository pattern
- Create proper validation for content data
- Setup draft and published state management
- Implement content listing with filtering and pagination
- Create event emission for content changes

**Key Best Practices:**
- Use typed interfaces for service and repository
- Implement clear validation with specific error messages
- Apply event-driven communication for state changes
- Create consistent error handling patterns
- Implement proper ownership validation

### Sub-Task 4.2: Media Handling Service ⭐️ *PRIORITY*

**Goal:** Implement secure media file handling and storage

**Key Implementation:**
```typescript
// src/services/media-service.ts
import { createHash } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IMediaService } from './interfaces/media-service.interface';
import { ValidationError } from '../errors';
import { logger } from '../lib/logger';

export class MediaService implements IMediaService {
  private s3Client: S3Client;
  
  constructor(config) {
    this.s3Client = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey
      }
    });
  }
  
  async generateUploadUrl(
    userId: string,
    fileType: string,
    contentType: string,
    fileSize: number
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    // Validate content type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'audio/mpeg', 'audio/wav', 'video/mp4'
    ];
    
    if (!allowedTypes.includes(contentType)) {
      throw new ValidationError('Unsupported content type', {
        contentType: `Must be one of: ${allowedTypes.join(', ')}`
      });
    }
    
    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (fileSize > maxSize) {
      throw new ValidationError('File too large', {
        size: `Maximum file size is ${maxSize / (1024 * 1024)}MB`
      });
    }
    
    // Generate file key
    const timestamp = Date.now();
    const hash = createHash('md5')
      .update(`${userId}${timestamp}${Math.random()}`)
      .digest('hex');
    
    const key = `uploads/${userId}/${hash}.${fileType}`;
    
    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });
    
    try {
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 15 // 15 minutes
      });
      
      return {
        uploadUrl,
        fileUrl: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`,
        key
      };
    } catch (error) {
      logger.error({ error, userId, fileType }, 'Failed to generate upload URL');
      throw new Error('Failed to generate upload URL');
    }
  }
  
  async getMediaUrl(key: string): Promise<string> {
    if (!key) {
      throw new ValidationError('Media key is required');
    }
    
    return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  }
  
  async validateUploadedMedia(key: string): Promise<boolean> {
    try {
      // Check if file exists in S3
      const command = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Media validation failed');
      return false;
    }
  }
}
```

**Essential Requirements:**
- Implement secure upload mechanism with presigned URLs
- Create media type validation
- Setup file size and format restrictions
- Implement media URL generation
- Create upload validation

**Key Best Practices:**
- Use secure file naming with randomization
- Implement proper content type validation
- Apply appropriate file size limits
- Create clear error messages for validation failures
- Use proper S3 client setup with error handling

### Sub-Task 4.3: Content Moderation Service ⭐️ *PRIORITY*

**Goal:** Implement content moderation workflow and policies

**Key Implementation:**
```typescript
// src/services/moderation-service.ts
import { IModerationService } from './interfaces/moderation-service.interface';
import { IContentRepository } from '../repositories/interfaces/content-repository.interface';
import { IModerationRepository } from '../repositories/interfaces/moderation-repository.interface';
import { EventEmitter, EventType } from '../lib/events';
import { ModerationAction, ModerationResult } from '../models/moderation';
import { ValidationError, NotFoundError } from '../errors';

export class ModerationService implements IModerationService {
  constructor(
    private contentRepository: IContentRepository,
    private moderationRepository: IModerationRepository,
    private eventEmitter: EventEmitter
  ) {}
  
  async moderateContent(
    contentId: string,
    moderatorId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<ModerationResult> {
    // Get content to moderate
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw new NotFoundError(`Content not found: ${contentId}`, 'content');
    }
    
    // Verify content is pending moderation
    if (content.moderation.status !== 'pending') {
      throw new ValidationError(
        'Content is not pending moderation',
        { status: `Content moderation status is ${content.moderation.status}` }
      );
    }
    
    // Create moderation action
    const moderationAction = await this.moderationRepository.create({
      contentId,
      moderatorId,
      action,
      reason,
      timestamp: new Date()
    });
    
    // Update content status
    let newStatus = content.status;
    
    if (action === 'reject') {
      newStatus = 'rejected';
    } else if (content.status === 'published') {
      // Keep as published but update moderation status
      newStatus = 'published';
    } else if (content.status === 'draft') {
      // Keep as draft but update moderation status
      newStatus = 'draft';
    }
    
    await this.contentRepository.update(contentId, {
      status: newStatus,
      moderation: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: new Date(),
        reviewerId: moderatorId,
        reason
      }
    });
    
    // Emit event
    this.eventEmitter.emit(EventType.CONTENT_MODERATED, {
      contentId,
      moderatorId,
      action,
      reason
    });
    
    return {
      contentId,
      action,
      status: newStatus,
      moderatorId,
      timestamp: new Date()
    };
  }
  
  async getContentForModeration(
    options: {
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<any[]> {
    return this.contentRepository.findMany(
      { 'moderation.status': 'pending' },
      {
        limit: options.limit || 20,
        cursor: options.cursor,
        orderBy: 'createdAt',
        orderDir: 'ASC'
      }
    );
  }
  
  async getModerationHistory(contentId: string): Promise<ModerationAction[]> {
    return this.moderationRepository.findMany(
      { contentId },
      { orderBy: 'timestamp', orderDir: 'DESC' }
    );
  }
}
```

**Essential Requirements:**
- Implement moderation workflow with approval/rejection
- Create moderation action tracking
- Setup moderation queue management
- Implement moderation history
- Create event emission for moderation actions

**Key Best Practices:**
- Use transactions for moderation actions
- Implement proper validation of moderation state
- Apply event-driven communication for notifications
- Create clear audit trail for moderation actions
- Use proper error handling for edge cases

## Testing Strategy
- Content CRUD operation tests
- Media upload and validation tests
- Content moderation workflow tests
- Permission and ownership tests
- Event emission verification

## Definition of Done
- [ ] Content service implemented with proper validation
- [ ] Media handling service working with proper security
- [ ] Moderation service implemented with workflow
- [ ] All events properly emitted for state changes
- [ ] All content-related tests passing

---

# Task 5: Community & Social Features

## Task Overview
- **Purpose:** Implement the backend for community interaction and social engagement
- **Value:** Enhances user retention by creating meaningful connections and interactions
- **Dependencies:** Relies on Core Backend, Authentication, and Content Management

## Implementation Sub-Tasks

### Sub-Task 5.1: Reaction Service ⭐️ *PRIORITY*

**Goal:** Implement the reaction system for lightweight engagement

**Key Implementation:**
```typescript
// src/services/reaction-service.ts
import { IReactionService } from './interfaces/reaction-service.interface';
import { IReactionRepository } from '../repositories/interfaces/reaction-repository.interface';
import { IContentRepository } from '../repositories/interfaces/content-repository.interface';
import { EventEmitter, EventType } from '../lib/events';
import { Reaction, ReactionType } from '../models/reaction';
import { ValidationError, NotFoundError } from '../errors';

export class ReactionService implements IReactionService {
  constructor(
    private reactionRepository: IReactionRepository,
    private contentRepository: IContentRepository,
    private eventEmitter: EventEmitter
  ) {}
  
  async addReaction(
    userId: string,
    targetType: 'content' | 'comment' | 'battle',
    targetId: string,
    type: ReactionType
  ): Promise<Reaction | null> {
    // Validate target exists (simplified example)
    if (targetType === 'content') {
      const content = await this.contentRepository.findById(targetId);
      if (!content) {
        throw new NotFoundError(`Content not found: ${targetId}`, 'content');
      }
    }
    // Similar validations for other target types
    
    // Check if user already reacted
    const existingReaction = await this.reactionRepository.findOne({
      userId,
      targetType,
      targetId
    });
    
    if (existingReaction) {
      // If same reaction type, remove it (toggle behavior)
      if (existingReaction.type === type) {
        await this.reactionRepository.delete(existingReaction.id);
        
        // Update target metrics
        await this.updateTargetMetrics(targetType, targetId, -1);
        
        // Emit event
        this.eventEmitter.emit(EventType.REACTION_REMOVED, {
          userId,
          targetType,
          targetId,
          reactionType: type
        });
        
        return null;
      }
      
      // If different reaction type, update it
      const updatedReaction = await this.reactionRepository.update(
        existingReaction.id,
        { type }
      );
      
      // Emit event
      this.eventEmitter.emit(EventType.REACTION_UPDATED, {
        reactionId: updatedReaction.id,
        userId,
        targetType,
        targetId,
        reactionType: type
      });
      
      return updatedReaction;
    }
    
    // Create new reaction
    const reaction = await this.reactionRepository.create({
      userId,
      targetType,
      targetId,
      type,
      createdAt: new Date()
    });
    
    // Update target metrics
    await this.updateTargetMetrics(targetType, targetId, 1);
    
    // Emit event
    this.eventEmitter.emit(EventType.REACTION_CREATED, {
      reactionId: reaction.id,
      userId,
      targetType,
      targetId,
      reactionType: type
    });
    
    return reaction;
  }
  
  async getReactions(
    targetType: string,
    targetId: string,
    options: {
      type?: ReactionType;
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<Reaction[]> {
    return this.reactionRepository.findMany(
      {
        targetType,
        targetId,
        ...(options.type ? { type: options.type } : {})
      },
      {
        limit: options.limit || 50,
        cursor: options.cursor
      }
    );
  }
  
  async getReactionSummary(targetType: string, targetId: string): Promise<Record<string, number>> {
    // Get counts by reaction type
    const reactions = await this.reactionRepository.findMany(
      { targetType, targetId }
    );
    
    // Group by type
    const summary = {};
    
    for (const reaction of reactions) {
      if (!summary[reaction.type]) {
        summary[reaction.type] = 0;
      }
      summary[reaction.type]++;
    }
    
    return summary;
  }
  
  private async updateTargetMetrics(targetType: string, targetId: string, change: number): Promise<void> {
    // Update reaction count on the target
    if (targetType === 'content') {
      await this.contentRepository.incrementField(
        targetId,
        'metrics.reactionCount',
        change
      );
    }
    // Similar updates for other target types
  }
}
```

**Essential Requirements:**
- Implement reaction creation and removal with toggle behavior
- Create reaction counting and summarization
- Setup automatic metrics updates on targets
- Implement event emission for reaction changes
- Create type-specific validation

**Key Best Practices:**
- Use transactions for data consistency
- Implement proper validation of reaction targets
- Apply event-driven communication for notifications
- Create efficient query patterns for reaction summaries
- Use proper error handling for edge cases

### Sub-Task 5.2: Comment Service ⭐️ *PRIORITY*

**Goal:** Implement the comment system with threading support

**Key Implementation:**
```typescript
// src/services/comment-service.ts
import { ICommentService } from './interfaces/comment-service.interface';
import { ICommentRepository } from '../repositories/interfaces/comment-repository.interface';
import { IContentRepository } from '../repositories/interfaces/content-repository.interface';
import { EventEmitter, EventType } from '../lib/events';
import { Comment, CreateCommentInput } from '../models/comment';
import { ValidationError, NotFoundError } from '../errors';

export class CommentService implements ICommentService {
  constructor(
    private commentRepository: ICommentRepository,
    private contentRepository: IContentRepository,
    private eventEmitter: EventEmitter
  ) {}
  
  async createComment(
    userId: string,
    targetType: 'content' | 'battle' | 'comment',
    targetId: string,
    data: CreateCommentInput
  ): Promise<Comment> {
    // Validate target exists (simplified example)
    if (targetType === 'content') {
      const content = await this.contentRepository.findById(targetId);
      if (!content) {
        throw new NotFoundError(`Content not found: ${targetId}`, 'content');
      }
    } else if (targetType === 'comment') {
      // For reply to comment
      const parentComment = await this.commentRepository.findById(targetId);
      if (!parentComment) {
        throw new NotFoundError(`Parent comment not found: ${targetId}`, 'comment');
      }
    }
    // Similar validations for other target types
    
    // Validate comment data
    this.validateCommentData(data);
    
    // Create comment with appropriate field mappings
    const comment = await this.commentRepository.create({
      userId,
      body: data.body,
      ...(targetType === 'content' ? { contentId: targetId } : {}),
      ...(targetType === 'battle' ? { battleId: targetId } : {}),
      ...(targetType === 'comment' ? { parentId: targetId } : {}),
      status: 'active',
      moderation: { status: 'pending' },
      metrics: { reactionCount: 0, replyCount: 0 },
      createdAt: new Date()
    });
    
    // Update target metrics
    await this.updateTargetMetrics(targetType, targetId, 1);
    
    // Emit event
    this.eventEmitter.emit(EventType.COMMENT_CREATED, {
      commentId: comment.id,
      userId,
      targetType,
      targetId,
      isReply: targetType === 'comment'
    });
    
    return comment;
  }
  
  async getComments(
    targetType: 'content' | 'battle' | 'comment',
    targetId: string,
    options: {
      limit?: number;
      cursor?: string;
      sort?: 'recent' | 'popular';
    } = {}
  ): Promise<Comment[]> {
    // Build query conditions based on target type
    const conditions: any = {};
    
    if (targetType === 'content') {
      conditions.contentId = targetId;
      conditions.parentId = null; // Only top-level comments
    } else if (targetType === 'battle') {
      conditions.battleId = targetId;
      conditions.parentId = null; // Only top-level comments
    } else if (targetType === 'comment') {
      conditions.parentId = targetId; // Get replies to comment
    }
    
    // Determine sort order
    const sortOptions = options.sort === 'popular' 
      ? { orderBy: 'metrics.reactionCount', orderDir: 'DESC' } 
      : { orderBy: 'createdAt', orderDir: 'DESC' };
    
    return this.commentRepository.findMany(
      conditions,
      {
        limit: options.limit || 20,
        cursor: options.cursor,
        ...sortOptions
      }
    );
  }
  
  async getComment(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findById(id);
    
    if (!comment) {
      throw new NotFoundError(`Comment not found: ${id}`, 'comment');
    }
    
    return comment;
  }
  
  private validateCommentData(data: CreateCommentInput): void {
    if (!data.body || data.body.trim().length === 0) {
      throw new ValidationError('Comment body is required');
    }
    
    if (data.body.length > 5000) {
      throw new ValidationError(
        'Comment exceeds maximum length',
        { body: 'Maximum length is 5000 characters' }
      );
    }
  }
  
  private async updateTargetMetrics(targetType: string, targetId: string, change: number): Promise<void> {
    // Update comment count on the target
    if (targetType === 'content') {
      await this.contentRepository.incrementField(
        targetId,
        'metrics.commentCount',
        change
      );
    } else if (targetType === 'comment') {
      await this.commentRepository.incrementField(
        targetId,
        'metrics.replyCount',
        change
      );
    }
    // Similar updates for other target types
  }
}
```

**Essential Requirements:**
- Implement comment creation with threading support
- Create comment retrieval with sorting options
- Setup automatic metrics updates on targets
- Implement event emission for comment changes
- Create validation with appropriate limits

**Key Best Practices:**
- Use transactions for data consistency
- Implement proper validation of comment targets
- Apply event-driven communication for notifications
- Create efficient query patterns for threaded comments
- Use proper error handling for edge cases

### Sub-Task 5.3: Social Connection Service ⭐️ *PRIORITY*

**Goal:** Implement user following and social graph features

**Key Implementation:**
```typescript
// src/services/social-service.ts
import { ISocialService } from './interfaces/social-service.interface';
import { IFollowRepository } from '../repositories/interfaces/follow-repository.interface';
import { IUserRepository } from '../repositories/interfaces/user-repository.interface';
import { EventEmitter, EventType } from '../lib/events';
import { Follow } from '../models/follow';
import { ValidationError, NotFoundError } from '../errors';

export class SocialService implements ISocialService {
  constructor(
    private followRepository: IFollowRepository,
    private userRepository: IUserRepository,
    private eventEmitter: EventEmitter
  ) {}
  
  async followUser(followerId: string, followedId: string): Promise<Follow> {
    // Cannot follow yourself
    if (followerId === followedId) {
      throw new ValidationError('Cannot follow yourself');
    }
    
    // Check if followed user exists
    const followedUser = await this.userRepository.findById(followedId);
    if (!followedUser) {
      throw new NotFoundError(`User not found: ${followedId}`, 'user');
    }
    
    // Check if already following
    const existingFollow = await this.followRepository.findOne({
      followerId,
      followedId
    });
    
    if (existingFollow) {
      return existingFollow;
    }
    
    // Create follow relationship
    const follow = await this.followRepository.create({
      followerId,
      followedId,
      createdAt: new Date()
    });
    
    // Update follower counts
    await this.userRepository.incrementField(followedId, 'followerCount', 1);
    await this.userRepository.incrementField(followerId, 'followingCount', 1);
    
    // Emit event
    this.eventEmitter.emit(EventType.FOLLOW_CREATED, {
      followerId,
      followedId
    });
    
    return follow;
  }
  
  async unfollowUser(followerId: string, followedId: string): Promise<void> {
    // Find the follow relationship
    const follow = await this.followRepository.findOne({
      followerId,
      followedId
    });
    
    if (!follow) {
      throw new NotFoundError('Follow relationship not found');
    }
    
    // Delete the follow relationship
    await this.followRepository.delete(follow.id);
    
    // Update follower counts
    await this.userRepository.incrementField(followedId, 'followerCount', -1);
    await this.userRepository.incrementField(followerId, 'followingCount', -1);
    
    // Emit event
    this.eventEmitter.emit(EventType.FOLLOW_DELETED, {
      followerId,
      followedId
    });
  }
  
  async getFollowers(
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<{ followers: any[]; cursor?: string }> {
    const follows = await this.followRepository.findMany(
      { followedId: userId },
      {
        limit: options.limit || 20,
        cursor: options.cursor,
        orderBy: 'createdAt',
        orderDir: 'DESC',
        include: {
          follower: {
            select: ['id', 'username', 'displayName', 'avatarUrl']
          }
        }
      }
    );
    
    return {
      followers: follows.map(f => f.follower),
      cursor: follows.length === options.limit ? follows[follows.length - 1].id : undefined
    };
  }
  
  async getFollowing(
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<{ following: any[]; cursor?: string }> {
    const follows = await this.followRepository.findMany(
      { followerId: userId },
      {
        limit: options.limit || 20,
        cursor: options.cursor,
        orderBy: 'createdAt',
        orderDir: 'DESC',
        include: {
          followed: {
            select: ['id', 'username', 'displayName', 'avatarUrl']
          }
        }
      }
    );
    
    return {
      following: follows.map(f => f.followed),
      cursor: follows.length === options.limit ? follows[follows.length - 1].id : undefined
    };
  }
  
  async checkFollowStatus(followerId: string, followedId: string): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      followerId,
      followedId
    });
    
    return !!follow;
  }
}
```

**Essential Requirements:**
- Implement follow and unfollow functionality
- Create follower and following listing with pagination
- Setup follower count tracking
- Implement follow status checking
- Create event emission for follow changes

**Key Best Practices:**
- Use transactions for data consistency
- Implement proper validation of follow relationships
- Apply event-driven communication for notifications
- Create efficient query patterns for follow relationships
- Use proper error handling for edge cases

## Testing Strategy
- Reaction service functionality tests
- Comment system with threading tests
- Social connection management tests
- Metrics update verification
- Event emission tests

## Definition of Done
- [ ] Reaction service implemented with proper validation
- [ ] Comment service with threading support implemented
- [ ] Social connection service working correctly
- [ ] All metrics properly updated on interactions
- [ ] All events properly emitted for social interactions
- [ ] All community feature tests passing

---

# Task 6: Token & Blockchain Integration

## Task Overview
- **Purpose:** Implement blockchain connectivity and token functionality
- **Value:** Provides core utility value by connecting the platform to token holdings
- **Dependencies:** Relies on Core Backend and Authentication

## Implementation Sub-Tasks

### Sub-Task 6.1: Blockchain Connection Service ⭐️ *PRIORITY*

**Goal:** Implement reliable Solana blockchain connectivity with fallback mechanisms

**Key Implementation:**
```typescript
// src/services/blockchain-service.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { IBlockchainService } from './interfaces/blockchain-service.interface';
import { retry } from '../utils/retry';
import { logger } from '../lib/logger';

export class BlockchainService implements IBlockchainService {
  private mainConnection: Connection;
  private fallbackConnections: Connection[];
  private tokenMint: PublicKey;
  
  constructor(config) {
    // Set up primary connection
    this.mainConnection = new Connection(config.token.rpcUrl[0], 'confirmed');
    
    // Set up fallback connections
    this.fallbackConnections = config.token.fallbackRpcUrl.map(
      url => new Connection(url, 'confirmed')
    );
    
    // Set token mint address
    this.tokenMint = new PublicKey(config.token.mintAddress);
  }
  
  async getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Retry up to 3 times with exponential backoff
      const tokenAccounts = await retry(
        () => this.executeWithFallback(
          conn => conn.getTokenAccountsByOwner(
            publicKey,
            { mint: this.tokenMint }
          )
        ),
        { retries: 3, initialDelay: 200 }
      );
      
      // If no accounts found, balance is 0
      if (tokenAccounts.value.length === 0) {
        return 0;
      }
      
      // Sum balances from all accounts
      let balance = 0;
      for (const account of tokenAccounts.value) {
        const accountData = account.account.data;
        const accountInfo = accountData; // Decode account data
        balance += accountInfo.amount / Math.pow(10, 9); // Adjust for decimals
      }
      
      return balance;
    } catch (error) {
      logger.error({ error, walletAddress }, 'Failed to get token balance');
      throw new Error('Failed to get token balance');
    }
  }
  
  async getTokenPrice(): Promise<number> {
    // Implementation of token price fetching from oracle or DEX
    // This would typically call an external price API
    return 0.0001; // Placeholder
  }
  
  async getMarketCap(): Promise<number> {
    try {
      // Get total supply and price
      const [totalSupply, price] = await Promise.all([
        this.getTotalSupply(),
        this.getTokenPrice()
      ]);
      
      return totalSupply * price;
    } catch (error) {
      logger.error({ error }, 'Failed to get market cap');
      throw new Error('Failed to get market cap');
    }
  }
  
  async getTotalSupply(): Promise<number> {
    try {
      // Get token supply from blockchain
      const supplyInfo = await this.executeWithFallback(
        conn => conn.getTokenSupply(this.tokenMint)
      );
      
      return supplyInfo.value.uiAmount;
    } catch (error) {
      logger.error({ error }, 'Failed to get total supply');
      throw new Error('Failed to get total supply');
    }
  }
  
  private async executeWithFallback<T>(
    operation: (connection: Connection) => Promise<T>
  ): Promise<T> {
    try {
      // Try with main connection first
      return await operation(this.mainConnection);
    } catch (error) {
      logger.warn({ error }, 'Main RPC connection failed, trying fallbacks');
      
      // Try each fallback connection
      for (const fallbackConn of this.fallbackConnections) {
        try {
          return await operation(fallbackConn);
        } catch (fallbackError) {
          logger.warn({ error: fallbackError }, 'Fallback RPC connection failed');
          // Continue to next fallback
        }
      }
      
      // If all fallbacks fail, throw the original error
      throw error;
    }
  }
}
```

**Essential Requirements:**
- Implement Solana RPC connection with fallback mechanisms
- Create token balance checking functionality
- Setup market data retrieval
- Implement robust error handling
- Create token supply tracking

**Key Best Practices:**
- Use multiple RPC endpoints with fallback
- Implement retry logic with backoff
- Create proper error logging
- Apply consistent error handling
- Use proper decimal handling for token amounts

### Sub-Task 6.2: Wallet Verification Service ⭐️ *PRIORITY*

**Goal:** Implement secure wallet ownership verification

**Key Implementation:**
```typescript
// src/services/wallet-service.ts
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { IWalletService } from './interfaces/wallet-service.interface';
import { IWalletRepository } from '../repositories/interfaces/wallet-repository.interface';
import { IBlockchainService } from './interfaces/blockchain-service.interface';
import { EventEmitter, EventType } from '../lib/events';
import { ValidationError } from '../errors';
import { logger } from '../lib/logger';

export class WalletService implements IWalletService {
  private messageCache: Map<string, { message: string, expires: number }> = new Map();
  
  constructor(
    private walletRepository: IWalletRepository,
    private blockchainService: IBlockchainService,
    private eventEmitter: EventEmitter
  ) {}
  
  async generateVerificationMessage(userId: string): Promise<string> {
    // Create a unique message with timestamp
    const message = `Verify your wallet for Wild 'n Out platform: ${userId}:${Date.now()}`;
    
    // Store in cache with 15-minute expiration
    this.messageCache.set(userId, {
      message,
      expires: Date.now() + 15 * 60 * 1000
    });
    
    return message;
  }
  
  async verifySignature(
    userId: string,
    walletAddress: string,
    signature: string
  ): Promise<boolean> {
    // Get cached message
    const cached = this.messageCache.get(userId);
    if (!cached || cached.expires < Date.now()) {
      throw new ValidationError('Verification message expired');
    }
    
    try {
      // Convert inputs to correct format
      const publicKey = new PublicKey(walletAddress);
      const signatureBytes = bs58.decode(signature);
      const messageBytes = new TextEncoder().encode(cached.message);
      
      // Verify signature
      const verified = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );
      
      if (!verified) {
        throw new ValidationError('Invalid signature');
      }
      
      // If verified, associate wallet with user
      await this.walletRepository.create({
        userId,
        address: walletAddress,
        provider: 'phantom', // Default provider
        lastVerifiedAt: new Date()
      });
      
      // Check and update token holdings
      await this.updateTokenHoldings(userId, walletAddress);
      
      // Clean up cache
      this.messageCache.delete(userId);
      
      // Emit event
      this.eventEmitter.emit(EventType.WALLET_CONNECTED, {
        userId,
        walletAddress
      });
      
      return true;
    } catch (error) {
      logger.error({ error, userId, walletAddress }, 'Wallet verification failed');
      throw new ValidationError('Signature verification failed');
    }
  }
  
  async getConnectedWallets(userId: string): Promise<any[]> {
    return this.walletRepository.findMany({ userId });
  }
  
  async disconnectWallet(userId: string, walletAddress: string): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      userId,
      address: walletAddress
    });
    
    if (!wallet) {
      throw new ValidationError('Wallet not connected');
    }
    
    await this.walletRepository.delete(wallet.id);
    
    // Emit event
    this.eventEmitter.emit(EventType.WALLET_DISCONNECTED, {
      userId,
      walletAddress
    });
  }
  
  private async updateTokenHoldings(userId: string, walletAddress: string): Promise<void> {
    try {
      // Get token balance
      const balance = await this.blockchainService.getTokenBalance(walletAddress);
      
      // Update user's token holdings in database
      await this.walletRepository.upsertTokenHoldings(userId, balance, walletAddress);
      
      // Determine holder tier based on amount
      const tier = this.determineHolderTier(balance);
      
      // Update user's holder tier
      await this.walletRepository.updateHolderTier(userId, tier);
    } catch (error) {
      logger.error({ error, userId, walletAddress }, 'Failed to update token holdings');
      // Non-blocking error - don't throw
    }
  }
  
  private determineHolderTier(amount: number): string {
    if (amount >= 100000) return 'platinum';
    if (amount >= 10000) return 'gold';
    if (amount >= 1000) return 'silver';
    if (amount > 0) return 'bronze';
    return 'none';
  }
}
```

**Essential Requirements:**
- Implement secure signature verification
- Create wallet-to-user association
- Setup token holding detection
- Implement wallet disconnection
- Create holder tier determination

**Key Best Practices:**
- Use cryptographic signature verification
- Implement proper message expiration
- Create clear error messages
- Apply proper logging for verification attempts
- Use transaction for wallet connection

### Sub-Task 6.3: Token Data Service ⭐️ *PRIORITY*

**Goal:** Implement token price tracking and market data aggregation

**Key Implementation:**
```typescript
// src/services/token-service.ts
import { ITokenService } from './interfaces/token-service.interface';
import { IBlockchainService } from './interfaces/blockchain-service.interface';
import { ITokenDataRepository } from '../repositories/interfaces/token-data-repository.interface';
import { CacheService } from './cache-service';
import { EventEmitter, EventType } from '../lib/events';
import { logger } from '../lib/logger';

export class TokenService implements ITokenService {
  constructor(
    private blockchainService: IBlockchainService,
    private tokenDataRepository: ITokenDataRepository,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter
  ) {}
  
  async getCurrentMarketData(): Promise<any> {
    // Try cache first
    const cached = await this.cacheService.get('market_data');
    if (cached) {
      return cached;
    }
    
    try {
      // Fetch current data from blockchain
      const [price, marketCap, totalSupply] = await Promise.all([
        this.blockchainService.getTokenPrice(),
        this.blockchainService.getMarketCap(),
        this.blockchainService.getTotalSupply()
      ]);
      
      // Get yesterday's price for 24h change
      const yesterday = await this.tokenDataRepository.getHistoricalPrice(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      const priceChange24h = yesterday ? 
        ((price - yesterday.price) / yesterday.price) * 100 : 0;
      
      const data = {
        price,
        marketCap,
        totalSupply,
        priceChange24h,
        updatedAt: new Date()
      };
      
      // Save to database for historical tracking
      await this.tokenDataRepository.create(data);
      
      // Cache for 1 minute
      await this.cacheService.set('market_data', data, 60);
      
      // Check for milestone events
      await this.checkMilestones(marketCap);
      
      return data;
    } catch (error) {
      logger.error({ error }, 'Failed to get market data');
      
      // Return last known data if available
      const lastData = await this.tokenDataRepository.getLatest();
      return lastData || { price: 0, marketCap: 0, totalSupply: 0, priceChange24h: 0 };
    }
  }
  
  async getHistoricalData(
    timeframe: 'day' | 'week' | 'month' | 'year'
  ): Promise<any[]> {
    // Calculate time range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // Get data points from repository
    return this.tokenDataRepository.getHistoricalData(startDate, now);
  }
  
  private async checkMilestones(marketCap: number): Promise<void> {
    const milestones = [10000000, 50000000, 100000000, 200000000, 500000000];
    
    // Get last recorded milestone
    const lastMilestone = await this.tokenDataRepository.getLastMilestone();
    const lastMilestoneValue = lastMilestone?.marketCap || 0;
    
    // Find the next milestone
    const nextMilestone = milestones.find(m => m > lastMilestoneValue);
    
    // If we've crossed a new milestone
    if (nextMilestone && marketCap >= nextMilestone) {
      // Record new milestone
      await this.tokenDataRepository.createMilestone({
        marketCap,
        milestone: nextMilestone,
        timestamp: new Date()
      });
      
      // Emit milestone event
      this.eventEmitter.emit(EventType.TOKEN_MILESTONE, {
        marketCap,
        milestone: nextMilestone,
        timestamp: new Date()
      });
      
      logger.info(
        { marketCap, milestone: nextMilestone },
        'New token milestone reached'
      );
    }
  }
}
```

**Essential Requirements:**
- Implement token price tracking with historical data
- Create market cap calculation
- Setup milestone tracking and events
- Implement price change calculation
- Create caching for frequent data requests

**Key Best Practices:**
- Use caching for performance optimization
- Implement fallback mechanisms for data sources

## Task 6: Token & Blockchain Integration (Continued)

**Key Best Practices:**
- Use caching for performance optimization
- Implement fallback mechanisms for data sources
- Create clear milestone definitions
- Apply consistent event emission
- Use proper error handling with fallbacks

### Sub-Task 6.4: Transaction Feed Service ⭐️ *PRIORITY*

**Goal:** Implement token transaction monitoring and feed generation

**Key Implementation:**
```typescript
// src/services/transaction-service.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { ITransactionService } from './interfaces/transaction-service.interface';
import { ITransactionRepository } from '../repositories/interfaces/transaction-repository.interface';
import { parseTransactionData } from '../utils/transaction-parser';
import { CacheService } from './cache-service';
import { logger } from '../lib/logger';

export class TransactionService implements ITransactionService {
  private connection: Connection;
  private tokenMint: PublicKey;
  
  constructor(
    private transactionRepository: ITransactionRepository,
    private cacheService: CacheService,
    config
  ) {
    this.connection = new Connection(config.token.rpcUrl[0], 'confirmed');
    this.tokenMint = new PublicKey(config.token.mintAddress);
  }
  
  async getRecentTransactions(limit = 20): Promise<Transaction[]> {
    // Try to get from cache first
    const cachedTxs = await this.cacheService.get('recent_transactions');
    if (cachedTxs) {
      return cachedTxs.slice(0, limit);
    }
    
    try {
      // Fetch recent transactions from repository (already processed)
      const storedTxs = await this.transactionRepository.findMany(
        {},
        { limit, orderBy: 'timestamp', orderDir: 'DESC' }
      );
      
      // If we have enough, use them
      if (storedTxs.length >= limit) {
        // Cache the result
        await this.cacheService.set('recent_transactions', storedTxs, 60); // 1 minute
        return storedTxs;
      }
      
      // Otherwise, fetch more from the blockchain
      // Fetch recent signatures for token program
      const signatures = await this.connection.getSignaturesForAddress(
        this.tokenMint,
        { limit: 100 }
      );
      
      // Process new transactions
      const newTransactions = [];
      for (const sig of signatures) {
        // Skip already processed transactions
        const exists = await this.transactionRepository.exists({ signature: sig.signature });
        if (exists) continue;
        
        try {
          const tx = await this.connection.getTransaction(sig.signature);
          
          if (!tx) continue;
          
          const parsed = parseTransactionData(tx, this.tokenMint);
          
          // If it's a token transfer
          if (parsed.isTokenTransfer) {
            // Save to database
            const savedTx = await this.transactionRepository.create({
              signature: sig.signature,
              blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(),
              sender: parsed.sender,
              recipient: parsed.recipient,
              amount: parsed.amount,
              txType: parsed.txType
            });
            
            newTransactions.push(savedTx);
          }
        } catch (txError) {
          logger.error(
            { error: txError, signature: sig.signature },
            'Failed to process transaction'
          );
        }
      }
      
      // Combine stored and new transactions
      const allTransactions = [...newTransactions, ...storedTxs].slice(0, limit);
      
      // Cache the result
      await this.cacheService.set('recent_transactions', allTransactions, 60); // 1 minute
      
      return allTransactions;
    } catch (error) {
      logger.error({ error }, 'Failed to get recent transactions');
      
      // Return stored transactions as fallback
      return await this.transactionRepository.findMany(
        {},
        { limit, orderBy: 'timestamp', orderDir: 'DESC' }
      );
    }
  }
  
  async getUserTransactions(userId: string, walletAddresses: string[], limit = 20): Promise<Transaction[]> {
    if (walletAddresses.length === 0) {
      return [];
    }
    
    return this.transactionRepository.findMany(
      {
        OR: [
          { sender: { in: walletAddresses } },
          { recipient: { in: walletAddresses } }
        ]
      },
      { limit, orderBy: 'timestamp', orderDir: 'DESC' }
    );
  }
  
  async syncTransactions(): Promise<number> {
    try {
      // Get latest processed signature
      const latestTx = await this.transactionRepository.findOne(
        {},
        { orderBy: 'blockTime', orderDir: 'DESC' }
      );
      
      const options = latestTx 
        ? { until: latestTx.signature } 
        : { limit: 100 };
      
      // Fetch new signatures
      const signatures = await this.connection.getSignaturesForAddress(
        this.tokenMint,
        options
      );
      
      let processed = 0;
      
      // Process each signature
      for (const sig of signatures) {
        try {
          // Skip already processed
          const exists = await this.transactionRepository.exists({ signature: sig.signature });
          if (exists) continue;
          
          const tx = await this.connection.getTransaction(sig.signature);
          
          if (!tx) continue;
          
          const parsed = parseTransactionData(tx, this.tokenMint);
          
          // If it's a token transfer
          if (parsed.isTokenTransfer) {
            await this.transactionRepository.create({
              signature: sig.signature,
              blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(),
              sender: parsed.sender,
              recipient: parsed.recipient,
              amount: parsed.amount,
              txType: parsed.txType
            });
            
            processed++;
          }
        } catch (txError) {
          logger.error(
            { error: txError, signature: sig.signature },
            'Failed to process transaction'
          );
        }
      }
      
      // Invalidate cache
      await this.cacheService.invalidate('recent_transactions');
      
      return processed;
    } catch (error) {
      logger.error({ error }, 'Failed to sync transactions');
      throw error;
    }
  }
}
```

**Essential Requirements:**
- Implement transaction monitoring mechanism
- Create transaction feed generation
- Setup user-specific transaction filtering
- Implement transaction parsing and storage
- Create caching for frequent requests

**Key Best Practices:**
- Use background sync for transaction processing
- Implement proper error handling for API calls
- Create efficient transaction storage
- Apply caching for quick transaction access
- Use proper filtering for relevant transactions

## Testing Strategy
- Blockchain connectivity tests with mock data
- Wallet verification tests with signature validation
- Token data service tests with caching verification
- Transaction feed tests with parsing validation
- Fallback mechanism tests

## Definition of Done
- [ ] Blockchain connection service implemented with fallback
- [ ] Wallet verification service working correctly
- [ ] Token data service with market information implemented
- [ ] Transaction feed service functioning properly
- [ ] Milestone tracking and notification working
- [ ] All blockchain integration tests passing

---

# Task 7: User Profile & Achievement Backend

## Task Overview
- **Purpose:** Implement the system for user profiles, progression, and achievements
- **Value:** Drives retention through recognition, status, and progression mechanics
- **Dependencies:** Relies on Core Backend, Authentication, and Content Management

## Implementation Sub-Tasks

### Sub-Task 7.1: User Profile Service ⭐️ *PRIORITY*

**Goal:** Implement comprehensive user profile management

**Key Implementation:**
```typescript
// src/services/profile-service.ts
import { IProfileService } from './interfaces/profile-service.interface';
import { IUserRepository } from '../repositories/interfaces/user-repository.interface';
import { IContentRepository } from '../repositories/interfaces/content-repository.interface';
import { EventEmitter, EventType } from '../lib/events';
import { ValidationError, NotFoundError } from '../errors';
import { UserProfile, UpdateProfileInput } from '../models/user';

export class ProfileService implements IProfileService {
  constructor(
    private userRepository: IUserRepository,
    private contentRepository: IContentRepository,
    private eventEmitter: EventEmitter
  ) {}
  
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId, {
      include: {
        stats: true,
        achievements: {
          where: { earned: true },
          include: { achievement: true }
        }
      }
    });
    
    if (!user) {
      throw new NotFoundError(`User not found: ${userId}`, 'user');
    }
    
    return user;
  }
  
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfile> {
    // Validate profile data
    this.validateProfileData(data);
    
    // Update profile
    const updatedProfile = await this.userRepository.update(userId, {
      ...data,
      updatedAt: new Date()
    });
    
    // Emit event
    this.eventEmitter.emit(EventType.PROFILE_UPDATED, {
      userId,
      updatedFields: Object.keys(data)
    });
    
    return updatedProfile;
  }
  
  async getPublicProfile(username: string): Promise<UserProfile> {
    const user = await this.userRepository.findOne(
      { username },
      {
        include: {
          stats: true,
          achievements: {
            where: { earned: true, achievement: { hidden: false } },
            include: { achievement: true }
          }
        }
      }
    );
    
    if (!user) {
      throw new NotFoundError(`User not found: ${username}`, 'user');
    }
    
    return user;
  }
  
  async getUserStats(userId: string): Promise<any> {
    // Get basic stats from database
    const user = await this.userRepository.findById(userId, {
      include: { stats: true }
    });
    
    if (!user) {
      throw new NotFoundError(`User not found: ${userId}`, 'user');
    }
    
    // Calculate additional stats
    const [contentCount, battleCount, battleWins] = await Promise.all([
      this.contentRepository.count({ creatorId: userId }),
      this.battleEntryRepository.count({ creatorId: userId }),
      this.battleEntryRepository.count({ creatorId: userId, rank: 1 })
    ]);
    
    return {
      ...user.stats,
      contentCount,
      battleCount,
      battleWins,
      winRate: battleCount > 0 ? (battleWins / battleCount) * 100 : 0
    };
  }
  
  async searchProfiles(query: string, options: { limit?: number } = {}): Promise<UserProfile[]> {
    return this.userRepository.search(
      query,
      { limit: options.limit || 10 }
    );
  }
  
  private validateProfileData(data: UpdateProfileInput): void {
    const errors: Record<string, string> = {};
    
    if (data.displayName && data.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }
    
    if (data.bio && data.bio.length > 500) {
      errors.bio = 'Bio cannot exceed 500 characters';
    }
    
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Invalid profile data', errors);
    }
  }
}
```

**Essential Requirements:**
- Implement profile CRUD operations
- Create public profile view with privacy controls
- Setup statistics aggregation
- Implement profile search functionality
- Create event emission for profile updates

**Key Best Practices:**
- Use typed interfaces for service and repository
- Implement proper validation of profile data
- Apply privacy filtering for public profiles
- Create efficient query patterns for profile data
- Use proper error handling for missing profiles

### Sub-Task 7.2: Achievement System ⭐️ *PRIORITY*

**Goal:** Implement achievement tracking and awarding

**Key Implementation:**
```typescript
// src/services/achievement-service.ts
import { IAchievementService } from './interfaces/achievement-service.interface';
import { IAchievementRepository } from '../repositories/interfaces/achievement-repository.interface';
import { IUserAchievementRepository } from '../repositories/interfaces/user-achievement-repository.interface';
import { EventEmitter, EventType } from '../lib/events';
import { PointsService } from './points-service';
import { logger } from '../lib/logger';

export class AchievementService implements IAchievementService {
  private achievementDefinitions: Map<string, Achievement> = new Map();
  
  constructor(
    private achievementRepository: IAchievementRepository,
    private userAchievementRepository: IUserAchievementRepository,
    private pointsService: PointsService,
    private eventEmitter: EventEmitter
  ) {
    // Load achievement definitions
    this.loadAchievements();
    
    // Register event handlers
    this.registerEventHandlers();
  }
  
  private async loadAchievements(): Promise<void> {
    const achievements = await this.achievementRepository.findMany();
    
    for (const achievement of achievements) {
      this.achievementDefinitions.set(achievement.id, achievement);
    }
    
    logger.info(`Loaded ${achievements.length} achievements`);
  }
  
  private registerEventHandlers(): void {
    // Content creation events
    this.eventEmitter.on(EventType.CONTENT_CREATED, async (data) => {
      await this.updateAchievementProgress(
        data.creatorId,
        'content_created',
        1
      );
    });
    
    // Battle participation events
    this.eventEmitter.on(EventType.ENTRY_CREATED, async (data) => {
      await this.updateAchievementProgress(
        data.userId,
        'battle_entries',
        1
      );
    });
    
    // Battle results events
    this.eventEmitter.on(EventType.BATTLE_RESULTS_CALCULATED, async (data) => {
      for (const entry of data.entries) {
        if (entry.rank === 1) {
          await this.updateAchievementProgress(
            entry.userId,
            'battle_victories',
            1
          );
        }
        
        await this.updateAchievementProgress(
          entry.userId,
          'battle_participations',
          1
        );
      }
    });
    
    // Reaction events
    this.eventEmitter.on(EventType.REACTION_CREATED, async (data) => {
      if (data.targetType === 'content') {
        const content = await this.contentRepository.findById(data.targetId);
        if (content) {
          await this.updateAchievementProgress(
            content.creatorId,
            'content_reactions',
            1
          );
        }
      }
    });
    
    // Follower events
    this.eventEmitter.on(EventType.FOLLOW_CREATED, async (data) => {
      await this.updateAchievementProgress(
        data.followedId,
        'followers',
        1
      );
    });
    
    // Token events
    this.eventEmitter.on(EventType.WALLET_CONNECTED, async (data) => {
      await this.checkWalletAchievements(data.userId);
    });
  }
  
  async getUserAchievements(userId: string): Promise<any> {
    // Get achievements with progress
    const userAchievements = await this.userAchievementRepository.findMany(
      { userId },
      { include: { achievement: true } }
    );
    
    // Get all achievement definitions
    const allAchievements = Array.from(this.achievementDefinitions.values());
    
    // Create a map for quick lookup
    const userProgressMap = new Map();
    userAchievements.forEach(ua => {
      userProgressMap.set(ua.achievementId, ua);
    });
    
    // Combine with all achievements to include ones without progress
    const fullAchievements = allAchievements.map(achievement => {
      const userAchievement = userProgressMap.get(achievement.id);
      
      return {
        ...achievement,
        earned: userAchievement ? userAchievement.earned : false,
        progress: userAchievement ? userAchievement.progress : 0,
        earnedAt: userAchievement ? userAchievement.earnedAt : null,
        // Hide criteria for hidden achievements that aren't earned
        criteria: achievement.hidden && !userAchievement?.earned 
          ? { type: 'hidden', threshold: 0 } 
          : achievement.criteria
      };
    });
    
    // Group by category
    const grouped = {};
    fullAchievements.forEach(achievement => {
      if (!grouped[achievement.category]) {
        grouped[achievement.category] = [];
      }
      grouped[achievement.category].push(achievement);
    });
    
    // Calculate overall stats
    const earnedCount = userAchievements.filter(ua => ua.earned).length;
    const totalCount = allAchievements.length;
    
    return {
      achievements: grouped,
      stats: {
        earned: earnedCount,
        total: totalCount,
        percentage: totalCount > 0 ? (earnedCount / totalCount) * 100 : 0
      }
    };
  }
  
  async updateAchievementProgress(
    userId: string,
    criteriaType: string,
    increment: number
  ): Promise<void> {
    try {
      // Find achievements matching this criteria type
      const relevantAchievements = Array.from(this.achievementDefinitions.values())
        .filter(a => a.criteria.type === criteriaType);
      
      if (relevantAchievements.length === 0) {
        return;
      }
      
      // Update progress for each achievement
      for (const achievement of relevantAchievements) {
        await this.updateSingleAchievement(userId, achievement, increment);
      }
    } catch (error) {
      logger.error(
        { error, userId, criteriaType, increment },
        'Failed to update achievement progress'
      );
    }
  }
  
  private async updateSingleAchievement(
    userId: string,
    achievement: Achievement,
    increment: number
  ): Promise<void> {
    // Get current progress
    let userAchievement = await this.userAchievementRepository.findOne({
      userId,
      achievementId: achievement.id
    });
    
    // If not found, create it
    if (!userAchievement) {
      userAchievement = await this.userAchievementRepository.create({
        userId,
        achievementId: achievement.id,
        progress: 0,
        earned: false
      });
    }
    
    // Skip if already earned
    if (userAchievement.earned) {
      return;
    }
    
    // Update progress
    const newProgress = userAchievement.progress + increment;
    const earned = newProgress >= achievement.criteria.threshold;
    
    // Update in database
    await this.userAchievementRepository.update(userAchievement.id, {
      progress: newProgress,
      earned,
      earnedAt: earned ? new Date() : null
    });
    
    // If newly earned, award points and emit event
    if (earned && !userAchievement.earned) {
      // Award points
      await this.pointsService.awardPoints(
        userId,
        achievement.points,
        `Achievement: ${achievement.name}`
      );
      
      // Emit event
      this.eventEmitter.emit(EventType.ACHIEVEMENT_EARNED, {
        userId,
        achievementId: achievement.id,
        name: achievement.name,
        points: achievement.points
      });
      
      logger.info(
        { userId, achievementId: achievement.id, name: achievement.name },
        'Achievement earned'
      );
    }
  }
  
  private async checkWalletAchievements(userId: string): Promise<void> {
    // Check token holdings
    const holdings = await this.tokenHoldingRepository.findOne({ userId });
    
    if (holdings) {
      // Update token holding achievements
      await this.updateAchievementProgress(
        userId,
        'token_holdings',
        holdings.amount
      );
    }
  }
}
```

**Essential Requirements:**
- Implement achievement tracking for multiple criteria
- Create progress updating based on events
- Setup achievement awarding with points
- Implement achievement listing with categories
- Create milestone achievement checks

**Key Best Practices:**
- Use event-driven achievement updates
- Implement proper achievement definition loading
- Apply category grouping for organization
- Create efficient progress tracking
- Use transactions for achievement updates

### Sub-Task 7.3: Points and Leveling System ⭐️ *PRIORITY*

**Goal:** Implement user points economy and level progression

**Key Implementation:**
```typescript
// src/services/points-service.ts
import { IPointsService } from './interfaces/points-service.interface';
import { IPointsRepository } from '../repositories/interfaces/points-repository.interface';
import { IUserRepository } from '../repositories/interfaces/user-repository.interface';
import { EventEmitter, EventType } from '../lib/events';
import { PointTransaction } from '../models/point';
import { logger } from '../lib/logger';

export class PointsService implements IPointsService {
  private levelThresholds: number[] = [
    0,      // Level 1
    100,    // Level 2
    300,    // Level 3
    600,    // Level 4
    1000,   // Level 5
    1500,   // Level 6
    2100,   // Level 7
    2800,   // Level 8
    3600,   // Level 9
    4500,   // Level 10
    // Additional levels...
  ];
  
  constructor(
    private pointsRepository: IPointsRepository,
    private userRepository: IUserRepository,
    private eventEmitter: EventEmitter
  ) {}
  
  async awardPoints(
    userId: string,
    amount: number,
    reason: string,
    source: string = 'system'
  ): Promise<PointTransaction> {
    try {
      // Validate amount
      if (amount <= 0) {
        throw new Error('Points amount must be positive');
      }
      
      // Create transaction and update user points using transaction
      const [transaction, user] = await this.pointsRepository.withTransaction(async (client) => {
        // Create transaction
        const tx = await this.pointsRepository.create({
          userId,
          amount,
          type: 'credit',
          reason,
          source,
          createdAt: new Date()
        }, client);
        
        // Get current user points
        const user = await this.userRepository.findById(userId, {}, client);
        const currentPoints = user.points || 0;
        const newTotal = currentPoints + amount;
        
        // Update user points
        await this.userRepository.update(
          userId,
          { points: newTotal },
          client
        );
        
        return [tx, { ...user, points: newTotal }];
      });
      
      // Check for level up
      const currentLevel = this.calculateLevel(user.points - amount);
      const newLevel = this.calculateLevel(user.points);
      
      // If level changed, update user level and emit event
      if (newLevel > currentLevel) {
        await this.userRepository.update(userId, { level: newLevel });
        
        this.eventEmitter.emit(EventType.LEVEL_UP, {
          userId,
          previousLevel: currentLevel,
          newLevel,
          timestamp: new Date()
        });
        
        logger.info(
          { userId, previousLevel: currentLevel, newLevel },
          'User leveled up'
        );
      }
      
      // Emit points awarded event
      this.eventEmitter.emit(EventType.POINTS_AWARDED, {
        userId,
        amount,
        reason,
        source,
        newTotal: user.points,
        timestamp: new Date()
      });
      
      return transaction;
    } catch (error) {
      logger.error(
        { error, userId, amount, reason },
        'Failed to award points'
      );
      throw error;
    }
  }
  
  async deductPoints(
    userId: string,
    amount: number,
    reason: string,
    source: string = 'system'
  ): Promise<PointTransaction> {
    try {
      // Validate amount
      if (amount <= 0) {
        throw new Error('Points amount must be positive');
      }
      
      // Check if user has enough points
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      if (user.points < amount) {
        throw new Error('Insufficient points');
      }
      
      // Create transaction and update user points using transaction
      const [transaction, updatedUser] = await this.pointsRepository.withTransaction(async (client) => {
        // Create transaction
        const tx = await this.pointsRepository.create({
          userId,
          amount: -amount, // Negative for deduction
          type: 'debit',
          reason,
          source,
          createdAt: new Date()
        }, client);
        
        // Update user points
        const newTotal = user.points - amount;
        await this.userRepository.update(
          userId,
          { points: newTotal },
          client
        );
        
        return [tx, { ...user, points: newTotal }];
      });
      
      // Check for level change
      const previousLevel = this.calculateLevel(user.points);
      const newLevel = this.calculateLevel(updatedUser.points);
      
      // If level decreased, update user level
      if (newLevel < previousLevel) {
        await this.userRepository.update(userId, { level: newLevel });
        
        this.eventEmitter.emit(EventType.LEVEL_CHANGED, {
          userId,
          previousLevel,
          newLevel,
          timestamp: new Date()
        });
        
        logger.info(
          { userId, previousLevel, newLevel },
          'User level decreased'
        );
      }
      
      // Emit points deducted event
      this.eventEmitter.emit(EventType.POINTS_DEDUCTED, {
        userId,
        amount,
        reason,
        source,
        newTotal: updatedUser.points,
        timestamp: new Date()
      });
      
      return transaction;
    } catch (error) {
      logger.error(
        { error, userId, amount, reason },
        'Failed to deduct points'
      );
      throw error;
    }
  }
  
  async getUserPointsHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: string;
    } = {}
  ): Promise<PointTransaction[]> {
    return this.pointsRepository.findMany(
      {
        userId,
        ...(options.type ? { type: options.type } : {})
      },
      {
        limit: options.limit || 20,
        offset: options.offset || 0,
        orderBy: 'createdAt',
        orderDir: 'DESC'
      }
    );
  }
  
  async getUserPointsBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findById(userId);
    return user?.points || 0;
  }
  
  async getLeaderboard(
    options: {
      limit?: number;
      offset?: number;
      timeframe?: 'all' | 'day' | 'week' | 'month';
    } = {}
  ): Promise<any[]> {
    // For all time, use user points
    if (!options.timeframe || options.timeframe === 'all') {
      return this.userRepository.findMany(
        {},
        {
          limit: options.limit || 10,
          offset: options.offset || 0,
          orderBy: 'points',
          orderDir: 'DESC',
          select: ['id', 'username', 'displayName', 'avatarUrl', 'points', 'level']
        }
      );
    }
    
    // For specific timeframe, calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (options.timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }
    
    // Get point transactions grouped by user
    const pointsData = await this.pointsRepository.sumByUser(
      {
        createdAt: { gte: startDate },
        type: 'credit' // Only count points earned
      },
      options.limit || 10,
      options.offset || 0
    );
    
    // Get user details for each entry
    const userIds = pointsData.map(entry => entry.userId);
    const users = await this.userRepository.findMany(
      { id: { in: userIds } },
      {
        select: ['id', 'username', 'displayName', 'avatarUrl', 'level']
      }
    );
    
    // Create user map for quick lookup
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user.id, user);
    });
    
    // Combine data
    return pointsData.map(entry => ({
      ...userMap.get(entry.userId),
      points: entry.totalPoints
    }));
  }
  
  calculateLevel(points: number): number {
    for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
      if (points >= this.levelThresholds[i]) {
        return i + 1;
      }
    }
    return 1; // Default to level 1
  }
  
  getLevelProgress(points: number): any {
    const currentLevel = this.calculateLevel(points);
    const currentThreshold = this.levelThresholds[currentLevel - 1];
    const nextLevelIndex = currentLevel < this.levelThresholds.length ? currentLevel : null;
    const nextThreshold = nextLevelIndex ? this.levelThresholds[nextLevelIndex] : null;
    
    let progress = 100;
    let pointsToNextLevel = 0;
    
    if (nextThreshold !== null) {
      const pointsNeeded = nextThreshold - currentThreshold;
      const pointsGained = points - currentThreshold;
      progress = Math.floor((pointsGained / pointsNeeded) * 100);
      pointsToNextLevel = nextThreshold - points;
    }
    
    return {
      level: currentLevel,
      points,
      currentThreshold,
      nextThreshold,
      progress,
      pointsToNextLevel
    };
  }
}
```

**Essential Requirements:**
- Implement points awarding and deduction
- Create level calculation based on points
- Setup points transaction history
- Implement leaderboard generation
- Create level progression tracking

**Key Best Practices:**
- Use transactions for data consistency
- Implement proper level threshold definition
- Apply event-driven notifications
- Create efficient query patterns for leaderboards
- Use proper error handling for edge cases

## Testing Strategy
- Profile CRUD operation tests
- Achievement tracking and awarding tests
- Points transaction and level calculation tests
- Leaderboard generation tests
- Event emission verification

## Definition of Done
- [ ] User profile service implemented with validation
- [ ] Achievement system with progress tracking working
- [ ] Points and leveling system implemented
- [ ] Events properly emitted for achievements and leveling
- [ ] Leaderboard generation functioning correctly
- [ ] All profile and achievement tests passing

---

# Task 8: Real-time Communication System

## Task Overview
- **Purpose:** Implement WebSocket-based real-time features for dynamic user experiences
- **Value:** Creates engaging, responsive experiences that increase user engagement and session time
- **Dependencies:** Relies on Core Backend and Authentication; supports all real-time frontend features

## Implementation Sub-Tasks

### Sub-Task 8.1: WebSocket Server ⭐️ *PRIORITY*

**Goal:** Implement WebSocket server with connection management

**Key Implementation:**
```typescript
// src/websockets/server.ts
import { FastifyInstance } from 'fastify';
import { Server } from 'ws';
import { verifySession } from '../lib/auth';
import { ConnectionManager } from './connection-manager';
import { registerHandlers } from './handlers';
import { logger } from '../lib/logger';

export class WebSocketServer {
  private wss: Server;
  private connectionManager: ConnectionManager;
  
  constructor(server: any, private fastify: FastifyInstance) {
    // Create WebSocket server
    this.wss = new Server({
      server,
      path: '/ws',
      maxPayload: 1048576 // 1MB max payload
    });
    
    // Create connection manager
    this.connectionManager = new ConnectionManager();
    
    // Initialize
    this.initialize();
  }
  
  private initialize(): void {
    // Register connection handler
    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract token from URL params
        const url = new URL(req.url, 'http://localhost');
        const token = url.searchParams.get('token');
        
        if (!token) {
          ws.close(1008, 'Authentication required');
          return;
        }
        
        // Verify token
        const session = await verifySession(token);
        if (!session) {
          ws.close(1008, 'Invalid authentication');
          return;
        }
        
        const userId = session.userId;
        
        // Register connection
        const connectionId = this.connectionManager.registerConnection(userId, ws);
        
        logger.info({ userId, connectionId }, 'WebSocket client connected');
        
        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connection',
          status: 'connected',
          userId
        }));
        
        // Register message handler
        ws.on('message', (message: string) => {
          try {
            const data = JSON.parse(message);
            this.handleMessage(connectionId, userId, data);
          } catch (error) {
            logger.error({ error, userId, connectionId }, 'Failed to handle WebSocket message');
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format'
            }));
          }
        });
        
        // Register close handler
        ws.on('close', (code, reason) => {
          this.connectionManager.removeConnection(connectionId);
          logger.info({ userId, connectionId, code, reason }, 'WebSocket client disconnected');
        });
        
        // Register error handler
        ws.on('error', (error) => {
          logger.error({ error, userId, connectionId }, 'WebSocket error');
          this.connectionManager.removeConnection(connectionId);
        });
        
        // Setup ping/pong for connection keepalive
        const pingInterval = setInterval(() => {
          if (ws.readyState === ws.OPEN) {
            ws.ping();
          } else {
            clearInterval(pingInterval);
          }
        }, 30000); // 30 second ping
        
        ws.on('pong', () => {
          // Connection is alive
        });
        
        // Clear interval on close
        ws.on('close', () => {
          clearInterval(pingInterval);
        });
      } catch (error) {
        logger.error({ error }, 'WebSocket connection error');
        ws.close(1011, 'Internal server error');
      }
    });
    
    // Register specific message handlers
    registerHandlers(this.fastify, this.connectionManager);
    
    logger.info('WebSocket server initialized');
  }
  
  private handleMessage(connectionId: string, userId: string, data: any): void {
    if (!data.type) {
      logger.warn({ userId, data }, 'WebSocket message missing type');
      return;
    }
    
    // Dispatch to appropriate handler
    this.connectionManager.routeMessage(connectionId, userId, data);
  }
  
  // Method to broadcast to all users
  broadcast(type: string, data: any): void {
    this.connectionManager.broadcast(JSON.stringify({
      type,
      data,
      timestamp: Date.now()
    }));
  }
  
  // Method to send to specific user
  sendToUser(userId: string, type: string, data: any): void {
    this.connectionManager.sendToUser(userId, JSON.stringify({
      type,
      data,
      timestamp: Date.now()
    }));
  }
  
  // Method to send to channel subscribers
  sendToChannel(channel: string, type: string, data: any): void {
    this.connectionManager.sendToChannel(channel, JSON.stringify({
      type,
      data,
      timestamp: Date.now()
    }));
  }
}
```

**Essential Requirements:**
- Implement WebSocket server with secure authentication
- Create connection management and tracking
- Setup connection lifecycle handling
- Implement message routing
- Create broadcast and targeted messaging

**Key Best Practices:**
- Use secure authentication for all connections
- Implement proper connection tracking
- Apply ping/pong for connection health
- Create clear message structure
- Use proper error handling for connections

### Sub-Task 8.2: Connection Management ⭐️ *PRIORITY*

**Goal:** Implement efficient connection tracking and routing

**Key Implementation:**
```typescript
// src/websockets/connection-manager.ts
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';

interface Connection {
  id: string;
  userId: string;
  ws: WebSocket;
  connectedAt: Date;
  channels: Set<string>;
}

export class ConnectionManager {
  // Connection ID -> Connection
  private connections: Map<string, Connection> = new Map();
  
  // User ID -> Set of Connection IDs
  private userConnections: Map<string, Set<string>> = new Map();
  
  // Channel -> Set of Connection IDs
  private channelSubscriptions: Map<string, Set<string>> = new Map();
  
  // Message handlers by type
  private messageHandlers: Map<string, (connectionId: string, userId: string, data: any) => void> = new Map();
  
  constructor() {}
  
  registerConnection(userId: string, ws: WebSocket): string {
    const connectionId = uuidv4();
    
    // Create connection
    const connection: Connection = {
      id: connectionId,
      userId,
      ws,
      connectedAt: new Date(),
      channels: new Set()
    };
    
    // Store connection
    this.connections.set(connectionId, connection);
    
    // Add to user connections
    let userConns = this.userConnections.get(userId);
    if (!userConns) {
      userConns = new Set();
      this.userConnections.set(userId, userConns);
    }
    userConns.add(connectionId);
    
    return connectionId;
  }
  
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    // Remove from user connections
    const userConns = this.userConnections.get(connection.userId);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }
    
    // Remove from channel subscriptions
    for (const channel of connection.channels) {
      const channelConns = this.channelSubscriptions.get(channel);
      if (channelConns) {
        channelConns.delete(connectionId);
        if (channelConns.size === 0) {
          this.channelSubscriptions.delete(channel);
        }
      }
    }
    
    // Remove connection
    this.connections.delete(connectionId);
  }
  
  subscribeToChannel(connectionId: string, channel: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    // Add channel to connection
    connection.channels.add(channel);
    
    // Add connection to channel
    let channelConns = this.channelSubscriptions.get(channel);
    if (!channelConns) {
      channelConns = new Set();
      this.channelSubscriptions.set(channel, channelConns);
    }
    channelConns.add(connectionId);
  }
  
  unsubscribeFromChannel(connectionId: string, channel: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    // Remove channel from connection
    connection.channels.delete(channel);
    
    // Remove connection from channel
    const channelConns = this.channelSubscriptions.get(channel);
    if (channelConns) {
      channelConns.delete(connectionId);
      if (channelConns.size === 0) {
        this.channelSubscriptions.delete(channel);
      }
    }
  }
  
  registerMessageHandler(
    type: string,
    handler: (connectionId: string, userId: string, data: any) => void
  ): void {
    this.messageHandlers.set(type, handler);
  }
  
  routeMessage(connectionId: string, userId: string, data: any): void {
    const { type } = data;
    
    // Get handler for message type
    const handler = this.messageHandlers.get(type);
    
    if (handler) {
      handler(connectionId, userId, data);
    } else {
      logger.warn({ userId, type }, 'No handler for WebSocket message type');
    }
  }
  
  broadcast(message: string): void {
    for (const connection of this.connections.values()) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(message);
      }
    }
  }
  
  sendToUser(userId: string, message: string): void {
    const userConns = this.userConnections.get(userId);
    if (!userConns) return;
    
    for (const connectionId of userConns) {
      const connection = this.connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(message);
      }
    }
  }
  
  sendToChannel(channel: string, message: string): void {
    const channelConns = this.channelSubscriptions.get(channel);
    if (!channelConns) return;
    
    for (const connectionId of channelConns) {
      const connection = this.connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(message);
      }
    }
  }
  
  getConnectionStats(): any {
    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size,
      totalChannels: this.channelSubscriptions.size
    };
  }
  
  isUserConnected(userId: string): boolean {
    const userConns = this.userConnections.get(userId);
    return !!userConns && userConns.size > 0;
  }
}
```

**Essential Requirements:**
- Implement connection tracking by ID and user
- Create channel subscription management
- Setup message handler registration
- Implement targeted message routing
- Create connection statistics tracking

**Key Best Practices:**
- Use efficient data structures for lookups
- Implement proper cleanup on disconnection
- Apply channel-based messaging
- Create clear connection lifecycle
- Use proper error handling for messages

### Sub-Task 8.3: Real-time Event Integration ⭐️ *PRIORITY*

**Goal:** Integrate real-time events with WebSocket communication

**Key Implementation:**
```typescript
// src/websockets/event-integration.ts
import { FastifyInstance } from 'fastify';
import { ConnectionManager } from './connection-manager';
import { EventEmitter, EventType } from '../lib/events';
import { logger } from '../lib/logger';

export function registerEventIntegration(
  fastify: FastifyInstance,
  connectionManager: ConnectionManager,
  eventEmitter: EventEmitter
): void {
  // Battle events
  eventEmitter.on(EventType.BATTLE_CREATED, (data) => {
    connectionManager.sendToChannel('battles', 'battle.created', data);
    logger.debug({ event: 'battle.created', data }, 'WebSocket broadcast');
  });
  
  eventEmitter.on(EventType.BATTLE_ACTIVATED, (data) => {
    connectionManager.sendToChannel('battles', 'battle.activated', data);
    logger.debug({ event: 'battle.activated', data }, 'WebSocket broadcast');
  });
  
  eventEmitter.on(EventType.BATTLE_VOTING_STARTED, (data) => {
    connectionManager.sendToChannel('battles', 'battle.voting_started', data);
    logger.debug({ event: 'battle.voting_started', data }, 'WebSocket broadcast');
  });
  
  eventEmitter.on(EventType.BATTLE_COMPLETED, (data) => {
    connectionManager.sendToChannel('battles', 'battle.completed', data);
    logger.debug({ event: 'battle.completed', data }, 'WebSocket broadcast');
  });
  
  eventEmitter.on(EventType.ENTRY_CREATED, (data) => {
    connectionManager.sendToChannel(`battle:${data.battleId}`, 'battle.new_entry', data);
    logger.debug({ event: 'battle.new_entry', data }, 'WebSocket broadcast');
  });
  
  // Content events
  eventEmitter.on(EventType.CONTENT_CREATED, (data) => {
    // Notify followers
    notifyFollowers(connectionManager, data.creatorId, 'content.created', data);
    logger.debug({ event: 'content.created', data }, 'WebSocket notification');
  });
  
  // Reaction events
  eventEmitter.on(EventType.REACTION_CREATED, (data) => {
    // Get content owner
    if (data.targetType === 'content') {
      getContentCreator(fastify, data.targetId).then(creatorId => {
        if (creatorId && creatorId !== data.userId) {
          connectionManager.sendToUser(creatorId, 'reaction.received', data);
          logger.debug({ event: 'reaction.received', creatorId }, 'WebSocket notification');
        }
      });
    }
  });
  
  // Comment events
  eventEmitter.on(EventType.COMMENT_CREATED, (data) => {
    // Get content owner
    if (data.targetType === 'content') {
      getContentCreator(fastify, data.targetId).then(creatorId => {
        if (creatorId && creatorId !== data.userId) {
          connectionManager.sendToUser(creatorId, 'comment.received', data);
          logger.debug({ event: 'comment.received', creatorId }, 'WebSocket notification');
        }
      });
    }
  });
  
  // Achievement events
  eventEmitter.on(EventType.ACHIEVEMENT_EARNED, (data) => {
    connectionManager.sendToUser(data.userId, 'achievement.earned', data);
    logger.debug({ event: 'achievement.earned', userId: data.userId }, 'WebSocket notification');
  });
  
  // Level up events
  eventEmitter.on(EventType.LEVEL_UP, (data) => {
    connectionManager.sendToUser(data.userId, 'level.up', data);
    logger.debug({ event: 'level.up', userId: data.userId }, 'WebSocket notification');
  });
  
  // Token events
  eventEmitter.on(EventType.TOKEN_MILESTONE, (data) => {
    connectionManager.broadcast('token.milestone', data);
    logger.debug({ event: 'token.milestone', data }, 'WebSocket broadcast');
  });
}

// Helper function to notify followers
async function notifyFollowers(
  connectionManager: ConnectionManager,
  creatorId: string,
  eventType: string,
  data: any
): Promise<void> {
  // In a real implementation, this would fetch followers from the database
  // and send notifications to them
  connectionManager.sendToChannel(`user:${creatorId}:followers`, eventType, data);
}

// Helper function to get content creator
async function getContentCreator(
  fastify: FastifyInstance,
  contentId: string
): Promise<string | null> {
  try {
    const content = await fastify.services.contentService.getContentById(contentId);
    return content.creatorId;
  } catch (error) {
    logger.error({ error, contentId }, 'Failed to get content creator');
    return null;
  }
}
```

**Essential Requirements:**
- Implement event-to-WebSocket integration
- Create targeted notifications for relevant users
- Setup public event broadcasts
- Implement channel-based subscriptions
- Create content-specific notification routing

**Key Best Practices:**
- Use event-driven architecture
- Implement proper notification targeting
- Apply channel subscriptions for efficiency
- Create clear notification format
- Use proper error handling for events

### Sub-Task 8.4: Channel-Specific Handlers ⭐️ *PRIORITY*

**Goal:** Implement specialized handlers for different real-time features

**Key Implementation:**
```typescript
// src/websockets/handlers/index.ts
import { FastifyInstance } from 'fastify';
import { ConnectionManager } from '../connection-manager';
import { registerBattleHandlers } from './battle-handlers';
import { registerNotificationHandlers } from './notification-handlers';
import { registerChatHandlers } from './chat-handlers';
import { registerPresenceHandlers } from './presence-handlers';

export function registerHandlers(
  fastify: FastifyInstance,
  connectionManager: ConnectionManager
): void {
  // Register battle-specific handlers
  registerBattleHandlers(fastify, connectionManager);
  
  // Register notification handlers
  registerNotificationHandlers(fastify, connectionManager);
  
  // Register chat handlers
  registerChatHandlers(fastify, connectionManager);
  
  // Register presence handlers
  registerPresenceHandlers(fastify, connectionManager);
}

// src/websockets/handlers/battle-handlers.ts
export function registerBattleHandlers(
  fastify: FastifyInstance,
  connectionManager: ConnectionManager
): void {
  // Handler for subscribing to battle updates
  connectionManager.registerMessageHandler(
    'battle.subscribe',
    async (connectionId, userId, data) => {
      const { battleId } = data;
      
      // Validate battle ID
      if (!battleId) {
        sendError(connectionManager, connectionId, 'Missing battleId');
        return;
      }
      
      try {
        // Check if battle exists
        const battle = await fastify.services.battleService.getBattleById(battleId);
        
        // Subscribe to battle channel
        connectionManager.subscribeToChannel(connectionId, `battle:${battleId}`);
        
        // Send confirmation
        const connection = connectionManager.getConnection(connectionId);
        if (connection) {
          connection.ws.send(JSON.stringify({
            type: 'battle.subscribed',
            battleId,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        sendError(connectionManager, connectionId, 'Failed to subscribe to battle');
      }
    }
  );
  
  // Handler for unsubscribing from battle updates
  connectionManager.registerMessageHandler(
    'battle.unsubscribe',
    (connectionId, userId, data) => {
      const { battleId } = data;
      
      // Validate battle ID
      if (!battleId) {
        sendError(connectionManager, connectionId, 'Missing battleId');
        return;
      }
      
      // Unsubscribe from battle channel
      connectionManager.unsubscribeFromChannel(connectionId, `battle:${battleId}`);
      
      // Send confirmation
      const connection = connectionManager.getConnection(connectionId);
      if (connection) {
        connection.ws.send(JSON.stringify({
          type: 'battle.unsubscribed',
          battleId,
          timestamp: Date.now()
        }));
      }
    }
  );
  
  // Additional battle-specific handlers...
}

// Helper function to send error
function sendError(
  connectionManager: ConnectionManager,
  connectionId: string,
  message: string
): void {
  const connection = connectionManager.getConnection(connectionId);
  if (connection) {
    connection.ws.send(JSON.stringify({
      type: 'error',
      message,
      timestamp: Date.now()
    }));
  }
}
```

**Essential Requirements:**
- Implement feature-specific WebSocket handlers
- Create subscription management for topics
- Setup error handling for client requests
- Implement presence and status tracking
- Create real-time notification handling

**Key Best Practices:**
- Use modular handler registration
- Implement proper validation of client requests
- Apply clear message structure
- Create efficient subscription management
- Use proper error handling for client messages

## Testing Strategy
- WebSocket server connection tests
- Connection management and tracking tests
- Real-time event integration tests
- Channel subscription and messaging tests
- Client message handling tests

## Definition of Done
- [ ] WebSocket server implemented with authentication
- [ ] Connection management system working
- [ ] Real-time event integration functioning
- [ ] Channel-specific handlers implemented
- [ ] Message routing and delivery working
- [ ] All real-time communication tests passing

---

# Task 9: Data Storage & Database Optimization

## Task Overview
- **Purpose:** Optimize database schema, queries, and storage for performance and scalability
- **Value:** Ensures the platform can handle growth while maintaining performance and reliability
- **Dependencies:** Impacts all data access across backend services

## Implementation Sub-Tasks

### Sub-Task 9.1: Schema Optimization ⭐️ *PRIORITY*

**Goal:** Optimize database schema for performance and scalability

**Key Implementation:**
```sql
-- Create optimized indexes for critical queries
-- battles table indexes
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_creator_id ON battles(creator_id);
CREATE INDEX idx_battles_type_status ON battles(type, status);
CREATE INDEX idx_battles_start_time ON battles(start_time);

-- battle_entries table indexes
CREATE INDEX idx_battle_entries_battle_id ON battle_entries(battle_id);
CREATE INDEX idx_battle_entries_creator_id ON battle_entries(creator_id);
CREATE INDEX idx_battle_entries_battle_creator ON battle_entries(battle_id, creator_id);
CREATE INDEX idx_battle_entries_status ON battle_entries(status);

-- content table indexes
CREATE INDEX idx_content_creator_id ON content(creator_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_type_status ON content(type, status);
CREATE INDEX idx_content_created_at ON content(created_at);

-- comments table indexes
CREATE INDEX idx_comments_content_id ON comments(content_id);
CREATE INDEX idx_comments_creator_id ON comments(creator_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- reactions table indexes
CREATE INDEX idx_reactions_target_type_id ON reactions(target_type, target_id);
CREATE INDEX idx_reactions_creator_id ON reactions(creator_id);

-- user_follows table indexes
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);

-- transactions table indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);

-- Optimize enum types with dedicated columns
ALTER TABLE battles ALTER COLUMN status TYPE varchar(20);
ALTER TABLE battles ALTER COLUMN type TYPE varchar(20);
ALTER TABLE content ALTER COLUMN status TYPE varchar(20);
ALTER TABLE content ALTER COLUMN type TYPE varchar(20);

-- Add constraints for data integrity
ALTER TABLE battles ADD CONSTRAINT chk_battle_status 
  CHECK (status IN ('upcoming', 'active', 'voting', 'completed', 'cancelled'));
  
ALTER TABLE battles ADD CONSTRAINT chk_battle_type 
  CHECK (type IN ('wildStyle', 'pickUpKillIt', 'rAndBeef', 'tournament'));
  
ALTER TABLE content ADD CONSTRAINT chk_content_status 
  CHECK (status IN ('draft', 'published', 'archived', 'removed'));
  
ALTER TABLE content ADD CONSTRAINT chk_content_type 
  CHECK (type IN ('text', 'image', 'audio', 'video', 'mixed'));

-- Add foreign key constraints
ALTER TABLE battle_entries ADD CONSTRAINT fk_battle_entries_battle_id 
  FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE;
  
ALTER TABLE battle_entries ADD CONSTRAINT fk_battle_entries_creator_id 
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE;
  
ALTER TABLE content ADD CONSTRAINT fk_content_creator_id 
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE;
  
ALTER TABLE comments ADD CONSTRAINT fk_comments_creator_id 
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE;
  
ALTER TABLE comments ADD CONSTRAINT fk_comments_content_id 
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE;
  
ALTER TABLE comments ADD CONSTRAINT fk_comments_parent_id 
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
```

**Essential Requirements:**
- Implement optimized indexes for critical queries
- Create proper constraints for data integrity
- Setup appropriate column types for efficiency
- Implement foreign key relationships
- Create check constraints for enum values

**Key Best Practices:**
- Use targeted indexes for common query patterns
- Implement proper constraints for data validation
- Apply appropriate column types for data
- Create efficient foreign key relationships
- Use check constraints for enum validation

### Sub-Task 9.2: Query Optimization ⭐️ *PRIORITY*

**Goal:** Optimize database queries for performance

**Key Implementation:**
```typescript
// src/repositories/optimized-query-patterns.ts

// Optimized keyset pagination pattern
async function getPaginatedBattles(
  lastId?: string,
  lastCreatedAt?: Date,
  limit = 20
): Promise<Battle[]> {
  // Build query conditions for keyset pagination
  const whereClause = lastId && lastCreatedAt
    ? `WHERE (created_at, id) < ($1, $2)`
    : '';
  
  const params = lastId && lastCreatedAt
    ? [lastCreatedAt, lastId, limit]
    : [limit];
  
  const query = `
    SELECT * FROM battles
    ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT $${params.length}
  `;
  
  return db.query(query, params);
}

// Optimized join pattern for content with creator
async function getContentWithCreator(contentId: string): Promise<any> {
  const query = `
    SELECT 
      c.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'displayName', u.display_name,
        'avatarUrl', u.avatar_url
      ) AS creator
    FROM content c
    JOIN users u ON c.creator_id = u.id
    WHERE c.id = $1
  `;
  
  const result = await db.query(query, [contentId]);
  return result.rows[0];
}

// Optimized aggregation query for reaction counts
async function getReactionCounts(targetType: string, targetId: string): Promise<any> {
  const query = `
    SELECT 
      type,
      COUNT(*) AS count
    FROM reactions
    WHERE target_type = $1 AND target_id = $2
    GROUP BY type
  `;
  
  const result = await db.query(query, [targetType, targetId]);
  
  // Convert to map for easier usage
  const counts = {};
  result.rows.forEach(row => {
    counts[row.type] = parseInt(row.count);
  });
  
  return counts;
}

// Optimized query for threaded comments
async function getThreadedComments(contentId: string, limit = 20): Promise<any> {
  // First get top-level comments
  const topLevelQuery = `
    SELECT 
      c.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'displayName', u.display_name,
        'avatarUrl', u.avatar_url
      ) AS creator,
      (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) AS reply_count
    FROM comments c
    JOIN users u ON c.creator_id = u.id
    WHERE c.content_id = $1 AND c.parent_id IS NULL
    ORDER BY c.created_at DESC
    LIMIT $2
  `;
  
  const topLevelComments = await db.query(topLevelQuery, [contentId, limit]);
  
  // Get replies for each top-level comment
  const commentIds = topLevelComments.rows.map(c => c.id);
  
  if (commentIds.length === 0) {
    return topLevelComments.rows;
  }
  
  const repliesQuery = `
    SELECT 
      c.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'displayName', u.display_name,
        'avatarUrl', u.avatar_url
      ) AS creator
    FROM comments c
    JOIN users u ON c.creator_id = u.id
    WHERE c.parent_id = ANY($1)
    ORDER BY c.created_at ASC
  `;
  
  const replies = await db.query(repliesQuery, [commentIds]);
  
  // Group replies by parent
  const repliesByParent = {};
  replies.rows.forEach(reply => {
    if (!repliesByParent[reply.parent_id]) {
      repliesByParent[reply.parent_id] = [];
    }
    repliesByParent[reply.parent_id].push(reply);
  });
  
  // Add replies to top-level comments
  topLevelComments.rows.forEach(comment => {
    comment.replies = repliesByParent[comment.id] || [];
  });
  
  return topLevelComments.rows;
}

// Optimized leaderboard query
async function getPointsLeaderboard(timeframe: string, limit = 10): Promise<any> {
  let timeCondition = '';
  const params = [limit];
  
  if (timeframe !== 'all') {
    let interval;
    switch (timeframe) {
      case 'day':
        interval = '1 day';
        break;
      case 'week':
        interval = '7 days';
        break;
      case 'month':
        interval = '30 days';
        break;
      default:
        interval = '30 days';
    }
    
    timeCondition = 'WHERE pt.created_at > NOW() - INTERVAL $2';
    params.push(interval);
  }
  
  const query = `
    SELECT 
      u.id,
      u.username,
      u.display_name AS "displayName",
      u.avatar_url AS "avatarUrl",
      u.level,
      COALESCE(SUM(pt.amount), 0) AS points
    FROM users u
    LEFT JOIN point_transactions pt ON u.id = pt.user_id
      ${timeCondition}
    GROUP BY u.id, u.username, u.display_name, u.avatar_url, u.level
    ORDER BY points DESC
    LIMIT $1
  `;
  
  const result = await db.query(query, params);
  return result.rows;
}
```

**Essential Requirements:**
- Implement keyset pagination for efficient paging
- Create optimized join patterns for related data
- Setup efficient aggregation queries
- Implement threaded comment retrieval optimization
- Create leaderboard query optimization

**Key Best Practices:**
- Use keyset pagination instead of offset/limit
- Implement targeted indexes for query patterns
- Apply proper join strategies for related data
- Create optimized aggregation methods
- Use parameterized queries for security

### Sub-Task 9.3: Caching Strategy ⭐️ *PRIORITY*

**Goal:** Implement a comprehensive caching strategy for database queries

**Key Implementation:**
```typescript
// src/repositories/cached-repository.ts
import { BaseRepository } from './base-repository';
import { CacheService } from '../services/cache-service';
import { logger } from '../lib/logger';

export abstract class CachedRepository<T> extends BaseRepository<T> {
  constructor(
    protected pool,
    protected tableName: string,
    protected cacheService: CacheService,
    protected cacheTtl: number = 300 // 5 minutes default
  ) {
    super(pool, tableName);
  }
  
  async findById(id: string, options: { useCache?: boolean } = {}): Promise<T | null> {
    const useCache = options.useCache !== false;
    const cacheKey = `${this.tableName}:${id}`;
    
    // Try to get from cache first
    if (useCache) {
      const cached = await this.cacheService.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Get from database
    const result = await super.findById(id);
    
    // Cache result if found
    if (result && useCache) {
      await this.cacheService.set(cacheKey, result, this.cacheTtl);
    }
    
    return result;
  }
  
  async findMany(
    conditions: any = {},
    options: any = {}
  ): Promise<T[]> {
    const useCache = options.useCache !== false;
    
    // Only cache if simple conditions and options
    const canCache = useCache && 
      this.isSimpleObject(conditions) &&
      this.isSimpleObject(options);
    
    if (!canCache) {
      return super.findMany(conditions, options);
    }
    
    // Generate cache key from conditions and options
    const cacheKey = `${this.tableName}:list:${JSON.stringify(conditions)}:${JSON.stringify(options)}`;
    
    // Try to get from cache
    const cached = await this.cacheService.get<T[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Get from database
    const results = await super.findMany(conditions, options);
    
    // Cache results
    await this.cacheService.set(cacheKey, results, this.cacheTtl);
    
    return results;
  }
  
  async create(data: any): Promise<T> {
    // Create in database
    const result = await super.create(data);
    
    // Invalidate relevant caches
    await this.invalidateRelatedCaches(result);
    
    return result;
  }
  
  async update(id: string, data: any): Promise<T | null> {
    // Update in database
    const result = await super.update(id, data);
    
    // Invalidate specific item cache
    const cacheKey = `${this.tableName}:${id}`;
    await this.cacheService.invalidate(cacheKey);
    
    // Invalidate list caches
    await this.cacheService.invalidatePattern(`${this.tableName}:list:`);
    
    // Invalidate related caches
    await this.invalidateRelatedCaches(result);
    
    return result;
  }
  
  async delete(id: string): Promise<boolean> {
    // Delete from database
    const result = await super.delete(id);
    
    // Invalidate specific item cache
    const cacheKey = `${this.tableName}:${id}`;
    await this.cacheService.invalidate(cacheKey);
    
    // Invalidate list caches
    await this.cacheService.invalidatePattern(`${this.tableName}:list:`);
    
    return result;
  }
  
  private isSimpleObject(obj: any): boolean {
    // Check if object is simple enough to be part of a cache key
    if (!obj || typeof obj !== 'object') {
      return true;
    }
    
    // Check for functions or complex objects
    for (const key in obj) {
      if (typeof obj[key] === 'function') {
        return false;
      }
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Allow simple arrays of primitives
        if (Array.isArray(obj[key])) {
          if (obj[key].some(item => typeof item === 'object' || typeof item === 'function')) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    
    return true;
  }
  
  protected async invalidateRelatedCaches(entity: any): Promise<void> {
    // Override in child classes to invalidate related caches
    // Default implementation just invalidates list caches
    await this.cacheService.invalidatePattern(`${this.tableName}:list:`);
  }
}
```

**Essential Requirements:**
- Implement caching for repository methods
- Create cache invalidation strategy
- Setup selective caching based on query complexity
- Implement related cache invalidation
- Create cache key generation

**Key Best Practices:**
- Use selective caching based on query complexity
- Implement proper cache invalidation on updates
- Apply consistent cache key generation
- Create efficient invalidation patterns
- Use proper error handling for cache operations

### Sub-Task 9.4: Database Connection Management ⭐️ *PRIORITY*

**Goal:** Optimize database connection management for scalability

**Key Implementation:**
```typescript
// src/lib/database.ts
import { Pool, PoolClient } from 'pg';
import { logger } from './logger';

interface DatabaseConfig {
  url: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  maxUses?: number;
}

export class Database {
  private pool: Pool;
  private readPool: Pool | null = null;
  
  constructor(config: DatabaseConfig, readConfig?: DatabaseConfig) {
    // Main write pool
    this.pool = new Pool({
      connectionString: config.url,
      max: config.max || 10,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 5000
    });
    
    this.pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle database client');
    });
    
    // Read replica pool (if configured)
    if (readConfig) {
      this.readPool = new Pool({
        connectionString: readConfig.url,
        max: readConfig.max || 20, // Usually more read connections
        idleTimeoutMillis: readConfig.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: readConfig.connectionTimeoutMillis || 5000
      });
      
      this.readPool.on('error', (err) => {
        logger.error({ err }, 'Unexpected error on idle read database client');
      });
    }
    
    logger.info({
      writePoolSize: config.max || 10,
      readPoolSize: this.readPool ? (readConfig?.max || 20) : 0
    }, 'Database connection pools initialized');
  }
  
  async query(text: string, params: any[], options: { useReadReplica?: boolean } = {}): Promise<any> {
    // Use read replica for read queries if available and requested
    const useReadReplica = options.useReadReplica && this.readPool && 
      (text.trim().toLowerCase().startsWith('select') || text.trim().toLowerCase().startsWith('with'));
    
    const pool = useReadReplica ? this.readPool : this.pool;
    
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 100) {
      // Log slow queries
      logger.warn({
        query: text,
        params,
        duration,
        rows: res.rowCount
      }, 'Slow query detected');
    } else if (process.env.NODE_ENV !== 'production') {
      // Log all queries in non-production
      logger.debug({
        query: text,
        duration,
        rows: res.rowCount
      }, 'Query executed');
    }
    
    return res;
  }
  
  async getClient(): Promise<PoolClient> {
    const client = await this.pool.connect();
    
    // Monitor query execution time
    const query = client.query;
    client.query = (...args) => {
      const start = Date.now();
      const result = query.apply(client, args);
      
      if (result.then) {
        return result.then(res => {
          const duration = Date.now() - start;
          
          if (duration > 100) {
            // Log slow queries
            logger.warn({
              query: args[0],
              params: args[1],
              duration,
              rows: res.rowCount
            }, 'Slow query detected (client)');
          }
          
          return res;
        });
      }
      
      return result;
    };
    
    return client;
  }
  
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
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
  
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT 1');
      
      if (this.readPool) {
        await this.readPool.query('SELECT 1');
      }
      
      return result.rows.length === 1;
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return false;
    }
  }
  
  async end(): Promise<void> {
    await this.pool.end();
    
    if (this.readPool) {
      await this.readPool.end();
    }
    
    logger.info('Database connection pools closed');
  }
}
```

**Essential Requirements:**
- Implement connection pooling with configuration
- Create read/write splitting for scalability
- Setup connection monitoring and logging
- Implement transaction support
- Create database health check

**Key Best Practices:**
- Use proper connection pooling
- Implement query monitoring and logging
- Apply read/write splitting for scaling
- Create efficient transaction handling
- Use proper error handling for connections

## Testing Strategy
- Schema optimization verification
- Query performance benchmarking
- Caching effectiveness tests
- Connection management tests
- Transaction integrity tests

## Definition of Done
- [ ] Database schema optimized with proper indexes
- [ ] Query patterns optimized for performance
- [ ] Caching strategy implemented effectively
- [ ] Connection management improved for scalability
- [ ] All database optimization tests passing

---

# Task 10: Security, Monitoring & DevOps

## Task Overview
- **Purpose:** Implement comprehensive security, monitoring, and operational infrastructure
- **Value:** Ensures platform reliability, security, and observability, supporting business continuity
- **Dependencies:** Applies to all aspects of the backend implementation

## Implementation Sub-Tasks

### Sub-Task 10.1: Security Implementation ⭐️ *PRIORITY*

**Goal:** Implement comprehensive security measures

**Key Implementation:**
```typescript
// src/middleware/security.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimiter } from '../lib/rate-limiter';
import { logger } from '../lib/logger';
import { AuditService } from '../services/audit-service';

// Rate limiter for sensitive endpoints
const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  standardHeaders: true,
  message: 'Too many attempts, please try again later'
});

// Standard API rate limiter
const apiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  message: 'Too many requests, please try again later'
});

// Specific route limiters
const highVolumeEndpoints = {
  '/api/battles': 200,
  '/api/content': 200,
  '/api/feed': 150
};

export function setupSecurityMiddleware(fastify: FastifyInstance, auditService: AuditService): void {
  // Apply rate limiting based on route
  fastify.addHook('onRequest', async (request, reply) => {
    const path = request.routerPath || request.url;
    
    // Apply auth rate limiting to sensitive routes
    if (path.includes('/auth/') || path.includes('/wallet/verify')) {
      await authLimiter.consume(request, reply);
    } else {
      // Apply appropriate limit based on endpoint
      const customLimit = Object.entries(highVolumeEndpoints)
        .find(([route]) => path.startsWith(route))?.[1];
      
      if (customLimit) {
        // Use custom limiter for high-volume endpoint
        const customLimiter = new RateLimiter({
          windowMs: 60 * 1000,
          max: customLimit,
          standardHeaders: true
        });
        
        await customLimiter.consume(request, reply);
      } else {
        // Use standard API limiter
        await apiLimiter.consume(request, reply);
      }
    }
  });
  
  // Add security headers
  fastify.addHook('onRequest', (request, reply, done) => {
    // Standard security headers
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Content Security Policy
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https://*.cloudfront.net; " +
      "connect-src 'self' https://*.clerk.dev https://*.solana.com; " +
      "frame-ancestors 'none';"
    );
    
    done();
  });
  
  // CSRF protection for non-GET requests
  fastify.addHook('onRequest', (request, reply, done) => {
    // Skip for GET/HEAD/OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return done();
    }
    
    // Skip for API endpoints with token authentication
    if (request.headers.authorization) {
      return done();
    }
    
    // Check CSRF token for session-based requests
    const csrfToken = request.headers['x-csrf-token'];
    const storedToken = request.session?.csrfToken;
    
    if (!csrfToken || csrfToken !== storedToken) {
      logger.warn({
        ip: request.ip,
        path: request.url,
        method: request.method
      }, 'CSRF token validation failed');
      
      return reply.code(403).send({
        error: {
          code: 'invalid_csrf_token',
          message: 'Invalid or missing CSRF token'
        }
      });
    }
    
    done();
  });
  
  // Audit logging for sensitive operations
  fastify.addHook('onRequest', async (request, reply) => {
    // Identify sensitive operations for audit logging
    const sensitiveRoutes = [
      { path: '/api/auth', method: 'POST' },
      { path: '/api/wallet/verify', method: 'POST' },
      { path: '/api/users/.*', method: 'PUT' },
      { path: '/api/users/.*', method: 'DELETE' },
      { path: '/api/admin/.*', method: 'ANY' }
    ];
    
    const path = request.url;
    const method = request.method;
    
    const isSensitive = sensitiveRoutes.some(route => {
      const pathMatch = new RegExp(route.path).test(path);
      const methodMatch = route.method === 'ANY' || route.method === method;
      return pathMatch && methodMatch;
    });
    
    if (isSensitive && request.userId) {
      await auditService.logAction({
        actionType: 'api.access',
        userId: request.userId,
        metadata: {
          path,
          method,
          ip: request.ip,
          userAgent: request.headers['user-agent']
        },
        severity: 'medium'
      });
    }
  });
}
```

**Essential Requirements:**
- Implement rate limiting with different tiers
- Create security headers for all responses
- Setup CSRF protection for state-changing operations
- Implement audit logging for sensitive actions
- Create input validation middleware

**Key Best Practices:**
- Use tiered rate limiting based on endpoint sensitivity
- Implement proper security headers
- Apply CSRF protection for non-API routes
- Create comprehensive audit logging
- Use proper error handling for security events

### Sub-Task 10.2: Monitoring and Logging ⭐️ *PRIORITY*

**Goal:** Implement comprehensive monitoring and logging system

**Key Implementation:**
```typescript
// src/lib/logger.ts
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

// Create log level based on environment
const level = process.env.LOG_LEVEL || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create base logger configuration
const pinoConfig = {
  level,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.token'
    ],
    censor: '[REDACTED]'
  },
  mixin() {
    return { appId: 'wild-n-out-backend' };
  },
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime
};

// Create transport based on environment
const transport = process.env.NODE_ENV === 'production'
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: false,
        translateTime: 'SYS:standard'
      }
    })
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    };

// Create logger
export const logger = pino(pinoConfig, transport);

// Request logging middleware
export function requestLogger(request, reply, done) {
  // Generate request ID if not present
  request.id = request.id || uuidv4();
  
  // Add request ID to response headers
  reply.header('X-Request-ID', request.id);
  
  // Log the request
  request.log.info({
    req: {
      id: request.id,
      method: request.method,
      url: request.url,
      path: request.routerPath,
      parameters: request.params,
      query: request.query,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    }
  }, 'Incoming request');
  
  // Track timing
  const startTime = process.hrtime();
  
  // Log after response
  reply.addHook('onSend', (request, reply, payload, done) => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = seconds * 1000 + nanoseconds / 1000000;
    
    const logMethod = responseTime > 1000 ? 'warn' : 'info';
    
    request.log[logMethod]({
      res: {
        statusCode: reply.statusCode,
        responseTime: `${responseTime.toFixed(2)}ms`
      }
    }, 'Request completed');
    
    done(null, payload);
  });
  
  done();
}

// src/monitoring/metrics.ts
import client from 'prom-client';
import { FastifyInstance } from 'fastify';

// Create registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

const cacheHitRatio = new client.Gauge({
  name: 'cache_hit_ratio',
  help: 'Cache hit ratio'
});

const activeWebSocketConnections = new client.Gauge({
  name: 'websocket_connections_active',
  help: 'Active WebSocket connections'
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(databaseQueryDuration);
register.registerMetric(cacheHitRatio);
register.registerMetric(activeWebSocketConnections);

export function setupMetrics(fastify: FastifyInstance): void {
  // Metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });
  
  // Add metrics middleware
  fastify.addHook('onRequest', (request, reply, done) => {
    request.metrics = {
      startTime: process.hrtime()
    };
    done();
  });
  
  fastify.addHook('onResponse', (request, reply, done) => {
    const { startTime } = request.metrics;
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds + nanoseconds / 1e9;
    
    const route = request.routerPath || request.url;
    
    httpRequestDuration.observe(
      { method: request.method, route, status_code: reply.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: request.method,
      route,
      status_code: reply.statusCode
    });
    
    done();
  });
}

// Export metrics for external usage
export const metrics = {
  databaseQueryDuration,
  cacheHitRatio,
  activeWebSocketConnections
};
```

**Essential Requirements:**
- Implement structured logging with redaction
- Create request/response logging
- Setup metrics collection with Prometheus
- Implement custom metrics for key components
- Create performance monitoring

**Key Best Practices:**
- Use structured logging format
- Implement sensitive data redaction
- Apply request ID tracking
- Create standardized metrics
- Use proper error logging levels

### Sub-Task 10.3: Health Checks & Circuit Breakers ⭐️ *PRIORITY*

**Goal:** Implement health check system and circuit breakers for resilience

**Key Implementation:**
```typescript
// src/lib/circuit-breaker.ts
import { EventEmitter } from 'events';
import { logger } from './logger';

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

interface CircuitOptions {
  failureThreshold: number;
  successThreshold: number;
  resetTimeout: number;
  name: string;
  fallbackFn?: (...args: any[]) => any;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private readonly options: CircuitOptions;
  
  constructor(options: Partial<CircuitOptions> = {}) {
    super();
    
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      resetTimeout: options.resetTimeout || 10000, // 10 seconds
      name: options.name || 'circuit',
      fallbackFn: options.fallbackFn
    };
    
    logger.info({
      circuit: this.options.name,
      failureThreshold: this.options.failureThreshold,
      successThreshold: this.options.successThreshold,
      resetTimeout: this.options.resetTimeout
    }, 'Circuit breaker initialized');
  }
  
  async execute<T>(fn: () => Promise<T>, ...args: any[]): Promise<T> {
    // If circuit is open, check if it's time to try again
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        logger.debug(
          { circuit: this.options.name, state: this.state },
          'Circuit is open, using fallback'
        );
        
        if (this.options.fallbackFn) {
          return this.options.fallbackFn(...args);
        }
        
        throw new Error(`Circuit ${this.options.name} is open`);
      }
      
      // Try again - move to half-open state
      this.toHalfOpen();
    }
    
    try {
      // Execute the function
      const result = await fn();
      
      // Record success
      this.onSuccess();
      
      return result;
    } catch (error) {
      // Record failure
      this.onFailure();
      
      logger.error(
        { 
          error,
          circuit: this.options.name,
          state: this.state,
          failureCount: this.failureCount
        },
        'Circuit breaker caught error'
      );
      
      if (this.options.fallbackFn) {
        return this.options.fallbackFn(...args);
      }
      
      throw error;
    }
  }
  
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.successThreshold) {
        this.toClosed();
      }
    }
    
    // Reset failure count when closed
    if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }
  
  private onFailure(): void {
    if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      if (this.failureCount >= this.options.failureThreshold) {
        this.toOpen();
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.toOpen();
    }
  }
  
  private toClosed(): void {
    if (this.state !== CircuitState.CLOSED) {
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.successCount = 0;
      
      this.emit('close');
      
      logger.info(
        { circuit: this.options.name },
        'Circuit breaker closed'
      );
    }
  }
  
  private toOpen(): void {
    if (this.state !== CircuitState

### Sub-Task 10.3: Health Checks & Circuit Breakers (Continued)

```typescript
  private toOpen(): void {
    if (this.state !== CircuitState.OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
      this.failureCount = 0;
      this.successCount = 0;
      
      this.emit('open');
      
      logger.info(
        { 
          circuit: this.options.name,
          nextAttempt: new Date(this.nextAttempt)
        },
        'Circuit breaker opened'
      );
    }
  }
  
  private toHalfOpen(): void {
    if (this.state !== CircuitState.HALF_OPEN) {
      this.state = CircuitState.HALF_OPEN;
      this.failureCount = 0;
      this.successCount = 0;
      
      this.emit('half-open');
      
      logger.info(
        { circuit: this.options.name },
        'Circuit breaker half-open'
      );
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
}

// src/health/health-checks.ts
import { FastifyInstance } from 'fastify';
import { Database } from '../lib/database';
import { CacheService } from '../services/cache-service';
import { BlockchainService } from '../services/blockchain-service';
import { logger } from '../lib/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      details?: any;
    };
  };
  timestamp: Date;
}

export class HealthCheckService {
  constructor(
    private database: Database,
    private cacheService: CacheService,
    private blockchainService: BlockchainService
  ) {}
  
  async getHealth(): Promise<HealthStatus> {
    // Check all core components
    const [dbStatus, cacheStatus, blockchainStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkBlockchain()
    ]);
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (dbStatus.status === 'unhealthy') {
      // Database is critical, mark as unhealthy
      overallStatus = 'unhealthy';
    } else if (cacheStatus.status === 'unhealthy' || blockchainStatus.status === 'unhealthy') {
      // Cache or blockchain unhealthy means degraded
      overallStatus = 'degraded';
    } else if (dbStatus.status === 'degraded' || cacheStatus.status === 'degraded' || blockchainStatus.status === 'degraded') {
      // Any component degraded means overall degraded
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      components: {
        database: dbStatus,
        cache: cacheStatus,
        blockchain: blockchainStatus
      },
      timestamp: new Date()
    };
  }
  
  private async checkDatabase(): Promise<any> {
    try {
      const healthy = await this.database.healthCheck();
      
      return {
        status: healthy ? 'healthy' : 'unhealthy'
      };
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      
      return {
        status: 'unhealthy',
        details: { message: error.message }
      };
    }
  }
  
  private async checkCache(): Promise<any> {
    try {
      // Simple ping check
      await this.cacheService.ping();
      
      return {
        status: 'healthy'
      };
    } catch (error) {
      logger.error({ error }, 'Cache health check failed');
      
      return {
        status: 'unhealthy',
        details: { message: error.message }
      };
    }
  }
  
  private async checkBlockchain(): Promise<any> {
    try {
      // Check blockchain connection
      const connected = await this.blockchainService.checkConnection();
      
      if (!connected) {
        return {
          status: 'unhealthy',
          details: { message: 'Failed to connect to blockchain' }
        };
      }
      
      return {
        status: 'healthy'
      };
    } catch (error) {
      logger.error({ error }, 'Blockchain health check failed');
      
      return {
        status: 'unhealthy',
        details: { message: error.message }
      };
    }
  }
}

export function setupHealthChecks(fastify: FastifyInstance, healthCheckService: HealthCheckService): void {
  // Public health endpoint
  fastify.get('/health', async (request, reply) => {
    const health = await healthCheckService.getHealth();
    
    // Set status code based on health
    if (health.status === 'unhealthy') {
      reply.code(503); // Service Unavailable
    } else if (health.status === 'degraded') {
      reply.code(200); // OK but degraded
    } else {
      reply.code(200); // OK
    }
    
    return health;
  });
  
  // Detailed health endpoint (protected)
  fastify.get('/health/details', {
    preHandler: [fastify.authenticate, fastify.authorize({ roles: ['admin'] })]
  }, async (request, reply) => {
    const health = await healthCheckService.getHealth();
    
    // Add more detailed information for admin users
    // Implementation details...
    
    // Set status code based on health
    if (health.status === 'unhealthy') {
      reply.code(503); // Service Unavailable
    } else if (health.status === 'degraded') {
      reply.code(200); // OK but degraded
    } else {
      reply.code(200); // OK
    }
    
    return health;
  });
  
  // Kubernetes liveness probe
  fastify.get('/health/liveness', async (request, reply) => {
    // Simple check to verify server is running
    return { status: 'ok' };
  });
  
  // Kubernetes readiness probe
  fastify.get('/health/readiness', async (request, reply) => {
    const health = await healthCheckService.getHealth();
    
    if (health.status === 'unhealthy') {
      reply.code(503); // Service Unavailable
      return { status: 'not_ready' };
    }
    
    return { status: 'ready' };
  });
}
```

**Essential Requirements:**
- Implement circuit breaker pattern for external dependencies
- Create comprehensive health check system
- Setup liveness and readiness probes for Kubernetes
- Implement component-specific health checks
- Create health status aggregation

**Key Best Practices:**
- Use circuit breaker for resilience
- Implement proper health check endpoints
- Apply different health check levels
- Create clear health status representation
- Use proper error handling for health checks

### Sub-Task 10.4: Deployment Infrastructure ⭐️ *PRIORITY*

**Goal:** Implement deployment and infrastructure automation

**Key Implementation:**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run linting
        run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
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
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
      - name: Upload coverage
        uses: actions/upload-artifact@v3
        with:
          name: coverage
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Package build
        run: |
          tar -czf build.tar.gz dist node_modules package.json package-lock.json
      - name: Upload build
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: build.tar.gz

  docker:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Download build
        uses: actions/download-artifact@v3
        with:
          name: build
      - name: Extract build
        run: tar -xzf build.tar.gz
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKER_REPO }}:latest
            ${{ secrets.DOCKER_REPO }}:${{ github.sha }}
          cache-from: type=registry,ref=${{ secrets.DOCKER_REPO }}:buildcache
          cache-to: type=registry,ref=${{ secrets.DOCKER_REPO }}:buildcache,mode=max

  deploy:
    runs-on: ubuntu-latest
    needs: docker
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Install kubectl
        uses: azure/setup-kubectl@v3
      - name: Set Kubernetes context
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/wildnout-backend backend=${{ secrets.DOCKER_REPO }}:${{ github.sha }}
          kubectl rollout status deployment/wildnout-backend
```

```yaml
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy build
COPY dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
```

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wildnout-backend
  labels:
    app: wildnout-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wildnout-backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: wildnout-backend
    spec:
      containers:
      - name: backend
        image: ${DOCKER_REPO}:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: wildnout-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: wildnout-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: wildnout-secrets
              key: jwt-secret
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health/liveness
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Essential Requirements:**
- Implement CI/CD pipeline with GitHub Actions
- Create Docker containerization
- Setup Kubernetes deployment configuration
- Implement environment-specific configuration
- Create health probes for container orchestration

**Key Best Practices:**
- Use multi-stage CI/CD process
- Implement proper Docker containerization
- Apply Kubernetes deployment best practices
- Create secure secrets management
- Use proper resource constraints

## Testing Strategy
- Security testing with penetration tools
- Performance testing under load
- Health check and circuit breaker tests
- CI/CD pipeline verification
- Kubernetes deployment tests

## Definition of Done
- [ ] Security measures implemented and tested
- [ ] Monitoring and logging system configured
- [ ] Health checks and circuit breakers implemented
- [ ] CI/CD pipeline configured and tested
- [ ] Kubernetes deployment verified
- [ ] Documentation updated with security and operations guidelines
- [ ] All security and DevOps tests passing

---

## Final Phase 3 Deliverable

**Backend System:**
- Complete API implementation for all frontend features
- Authentication and authorization system using Clerk
- Battle system with entry, voting, and results functionality
- Content management with moderation support
- Community features with social interactions
- Token & blockchain integration with wallet verification
- User profile and achievement system
- Real-time communication infrastructure
- Optimized database with proper indexing
- Comprehensive security implementation
- Monitoring and logging infrastructure
- CI/CD pipeline with Kubernetes deployment

### Implementation Guidelines
1. Use service-oriented architecture with dependency injection
2. Apply event-driven communication between services
3. Implement repository pattern with caching
4. Create comprehensive error handling and validation
5. Apply proper security practices across all features
6. Use proper transaction boundaries for data integrity
7. Implement real-time communication with WebSockets
8. Create clear API documentation for frontend integration
9. Apply performance optimization with caching and indexing
10. Implement comprehensive testing strategy
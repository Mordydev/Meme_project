# Wild 'n Out Meme Coin Platform: Phase 3 Backend Implementation

## Project Context
This implementation is part of a comprehensive five-phase development process:
1. **Phase 1:** Project Structure, Environment & Dependencies Setup ✓ *Completed*
2. **Phase 2:** Complete Frontend Implementation ✓ *Completed*
3. **Phase 3:** Complete Backend Implementation ← *Current Phase*
4. **Phase 4:** Integration, Review, and Polish
5. **Phase 5:** Deployment and Production Readiness

## Primary Objective
Create a high-performance, scalable backend that supports the Wild 'n Out platform's unique features while meeting strict performance requirements to handle explosive growth toward $500M+ market cap.

## Table of Contents
- [Task 1: API Foundation & Server Architecture](#task-1-api-foundation--server-architecture)
- [Task 2: Authentication & Authorization System](#task-2-authentication--authorization-system)
- [Task 3: Database Schema & Data Access Layer](#task-3-database-schema--data-access-layer)
- [Task 4: Battle System Backend](#task-4-battle-system-backend)
- [Task 5: Content Management System](#task-5-content-management-system)
- [Task 6: User Profile & Achievement Engine](#task-6-user-profile--achievement-engine)
- [Task 7: Community & Social Features](#task-7-community--social-features)
- [Task 8: Token & Blockchain Integration](#task-8-token--blockchain-integration)
- [Task 9: Real-time Communication System](#task-9-real-time-communication-system)
- [Task 10: Asynchronous Job Processing](#task-10-asynchronous-job-processing)
- [Task 11: Security Implementation](#task-11-security-implementation)
- [Task 12: Performance Optimization & Scaling](#task-12-performance-optimization--scaling)

---

# Task 1: API Foundation & Server Architecture

## Task Overview
- **Purpose:** Establish the core API architecture and server infrastructure
- **Value:** Creates a scalable, maintainable foundation for all backend services that will support the entire platform
- **Dependencies:** Phase 1 environment setup; will be used by all other backend tasks

## Required Knowledge
- **Key Documents:** `backend.md`, `mastersummary.md`, `prd.md`
- **Architecture Guidelines:** API Design Principles, Error Handling Framework, Performance Targets
- **Phase 1 Dependencies:** Node.js environment, npm/package setup

## Implementation Sub-Tasks

### Sub-Task 1.1: Fastify Server Setup ⭐️ *PRIORITY*

**Goal:** Create the foundational Fastify server with core configuration

**Key Interface:**
```typescript
// src/server.ts
import Fastify, { FastifyInstance } from 'fastify';
import { config } from './config';
import { setupPlugins } from './plugins';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/error-handler';

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: config.logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    trustProxy: config.production,
    connectionTimeout: 30000,
    disableRequestLogging: false,
  });
  
  // Register plugins (cors, helmet, rate-limit, etc.)
  await setupPlugins(server);
  
  // Register routes
  await setupRoutes(server);
  
  // Set up error handler
  server.setErrorHandler(errorHandler);
  
  return server;
}

// src/index.ts
import { buildServer } from './server';
import { config } from './config';

const start = async () => {
  try {
    const server = await buildServer();
    await server.listen({
      port: config.port,
      host: config.host,
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
```

**Essential Requirements:**
- Fastify server with proper configuration
- Environment-based settings
- Structured logging setup
- Plugin registration system
- Global error handling

**Key Best Practices:**
- Use typed configuration objects
- Implement graceful shutdown
- Apply consistent logging format
- Structure server setup for testability
- Enable appropriate security headers

**Key Potential Challenges:**
- Balancing flexibility with consistency
- Managing environment-specific configuration
- Structuring for both local development and production
- Setting up proper logging levels

### Sub-Task 1.2: API Design Implementation ⭐️ *PRIORITY*

**Goal:** Establish core API patterns and route structure

**Directory Structure:**
```
src/
├── api/                   # API route handlers
│   ├── battles/           # Battle-related endpoints
│   ├── content/           # Content management endpoints
│   ├── users/             # User management endpoints
│   ├── token/             # Token and wallet endpoints
├── services/              # Business logic services
├── repositories/          # Data access layer
├── models/                # Data models and schemas
├── lib/                   # Shared utilities
├── middleware/            # HTTP middleware
├── config/                # Application configuration
└── plugins/               # Fastify plugins
```

**Request/Response Format:**
```typescript
// Standard success response
export interface SuccessResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

// Standard error response
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any[];
  };
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}
```

**Example Route Implementation:**
```typescript
// src/api/battles/index.ts
import { FastifyInstance } from 'fastify';
import { getBattleById } from './get-battle';
import { createBattle } from './create-battle';
import { listBattles } from './list-battles';
import { authenticate } from '../../middleware/auth';

export default async function battleRoutes(fastify: FastifyInstance) {
  // Get battle by ID (public)
  fastify.get('/api/battles/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { $ref: 'Battle#' },
            meta: { type: 'object' }
          }
        }
      }
    }
  }, getBattleById);
  
  // Create new battle (authenticated)
  fastify.post('/api/battles', {
    preHandler: [authenticate],
    schema: {
      body: { $ref: 'CreateBattleInput#' },
      response: {
        201: {
          type: 'object',
          properties: {
            data: { $ref: 'Battle#' },
            meta: { type: 'object' }
          }
        }
      }
    }
  }, createBattle);
  
  // List battles with filtering (public)
  fastify.get('/api/battles', {
    schema: {
      querystring: { $ref: 'BattleFilterQuery#' },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { 
              type: 'array',
              items: { $ref: 'Battle#' }
            },
            meta: { 
              type: 'object',
              properties: {
                pagination: { $ref: 'Pagination#' }
              }
            }
          }
        }
      }
    }
  }, listBattles);
}
```

**Essential Requirements:**
- Consistent route structure across endpoints
- Standardized request/response format
- Schema validation for all endpoints
- Documentation through schema definitions
- Clean separation of route handlers and business logic

**Key Best Practices:**
- Use JSON Schema for validation
- Implement consistent response format
- Document API endpoints in code
- Apply consistent error handling
- Organize routes by domain/feature

**Key Potential Challenges:**
- Balancing schema complexity with flexibility
- Managing schema reuse across endpoints
- Implementing proper error handling
- Ensuring consistent response formats

### Sub-Task 1.3: Middleware & Plugin System ⭐️ *PRIORITY*

**Goal:** Implement core middleware components and plugin architecture

**Key Components:**
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

// src/plugins/security.ts
import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';

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
  
  // Setup CORS
  await fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });
  
  // Setup rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    // Skip rate limiting for certain endpoints
    skip: (request) => {
      return request.url.startsWith('/api/public');
    }
  });
}
```

**Essential Requirements:**
- Authentication middleware with Clerk integration
- Rate limiting for API protection
- Security headers configuration
- CORS policy implementation
- Request logging and tracking

**Key Best Practices:**
- Implement modular plugin system
- Apply targeted rate limiting strategies
- Configure appropriate security headers
- Use request ID tracking for logging
- Create reusable middleware patterns

**Key Potential Challenges:**
- Balancing security with usability
- Implementing proper rate limiting
- Managing CORS policies appropriately
- Configuring content security policy

## Testing Strategy
- API endpoint integration tests
- Middleware functionality verification
- Error handler testing
- Rate limiting validation
- Security headers verification

## Definition of Done
- [ ] Fastify server configured and running
- [ ] Core API patterns implemented
- [ ] Middleware components created
- [ ] Plugin system operational
- [ ] Standard request/response format implemented
- [ ] Error handling strategy established
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Documentation for API patterns created
- [ ] Tests for core server functionality passing

---

# Task 2: Authentication & Authorization System

## Task Overview
- **Purpose:** Implement secure user authentication and role-based authorization
- **Value:** Ensures platform security and proper access control for features
- **Dependencies:** Requires API Foundation; will be used by all secured routes

## Required Knowledge
- **Key Documents:** `backend.md`, `setup-clerk-next.md`, `add-feature-clerk-next.md`
- **Architecture Guidelines:** Authentication Implementation, Security Headers and Protection
- **Phase 1 Dependencies:** Clerk configuration, API Foundation

## Implementation Sub-Tasks

### Sub-Task 2.1: Clerk Authentication Integration ⭐️ *PRIORITY*

**Goal:** Fully integrate Clerk authentication with the backend

**Key Interface:**
```typescript
// src/plugins/clerk.ts
import { FastifyInstance } from 'fastify';
import { clerkPlugin } from '@clerk/fastify';
import { config } from '../config';

export async function setupClerk(fastify: FastifyInstance) {
  await fastify.register(clerkPlugin, {
    secretKey: config.clerk.secretKey,
    publishableKey: config.clerk.publishableKey,
  });
  
  // Log auth initialization
  fastify.log.info('Clerk authentication initialized');
}

// src/config/index.ts
export const config = {
  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  // other config values
};
```

**Authentication Middleware:**
```typescript
// src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { getAuth } from '@clerk/fastify';

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
    
    // Add userId to request for use in handlers
    request.userId = userId;
    
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
- Complete Clerk integration with the Fastify server
- Secure authentication middleware
- Proper error handling for auth failures
- User identity verification

**Key Best Practices:**
- Keep authentication logic isolated
- Implement proper error handling
- Use typed interfaces for auth data
- Apply secure cookies and token management
- Log authentication events appropriately

**Key Potential Challenges:**
- Managing token verification securely
- Handling authentication errors properly
- Integrating with frontend authentication flow
- Maintaining session management

### Sub-Task 2.2: Role-Based Authorization ⭐️ *PRIORITY*

**Goal:** Implement a robust role-based access control system

**Key Interface:**
```typescript
// src/middleware/authorize.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user-service';

export function authorize(requiredRoles: string[] = []) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Ensure user is authenticated
      if (!request.userId) {
        return reply.code(401).send({
          error: {
            code: 'unauthorized',
            message: 'Authentication required'
          }
        });
      }
      
      // If no roles required, just need authentication
      if (requiredRoles.length === 0) {
        return;
      }
      
      // Get user with roles
      const userService = new UserService();
      const userRoles = await userService.getUserRoles(request.userId);
      
      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.some(role => 
        userRoles.includes(role)
      );
      
      if (!hasRequiredRole) {
        return reply.code(403).send({
          error: {
            code: 'forbidden',
            message: 'Insufficient permissions'
          }
        });
      }
      
    } catch (error) {
      request.log.error(error, 'Authorization error');
      return reply.code(500).send({
        error: {
          code: 'internal_error',
          message: 'Authorization check failed'
        }
      });
    }
  };
}

// Usage in route
fastify.post('/api/admin/battles', {
  preHandler: [authenticate, authorize(['admin', 'moderator'])],
  // route handler details
}, adminCreateBattle);
```

**Essential Requirements:**
- Role-based access control middleware
- User role management and storage
- Permission checking for protected routes
- Proper error handling for authorization failures

**Key Best Practices:**
- Create flexible permission structure
- Implement role hierarchy if needed
- Use clear, descriptive role names
- Apply least privilege principle
- Document role requirements

**Key Potential Challenges:**
- Designing flexible but secure role system
- Managing role assignments efficiently
- Integrating with Clerk user metadata
- Handling complex permission scenarios

### Sub-Task 2.3: User Session Management ⭐️ *PRIORITY*

**Goal:** Implement secure session handling and management

**Key Interface:**
```typescript
// src/services/session-service.ts
import { Redis } from 'ioredis';
import { config } from '../config';

export class SessionService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(config.redis.url);
  }
  
  // Store session data
  async storeSessionData(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    await this.redis.set(
      `session:${sessionId}`,
      JSON.stringify(data),
      'EX',
      ttl
    );
  }
  
  // Get session data
  async getSessionData(sessionId: string): Promise<any | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data);
  }
  
  // Extend session TTL
  async extendSession(sessionId: string, ttl: number = 3600): Promise<void> {
    await this.redis.expire(`session:${sessionId}`, ttl);
  }
  
  // Invalidate session
  async invalidateSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}
```

**Essential Requirements:**
- Secure session data storage in Redis
- Session expiration and extension
- Session invalidation on logout
- Session data retrieval

**Key Best Practices:**
- Store minimal data in sessions
- Implement appropriate TTL (Time To Live)
- Use secure, random session IDs
- Apply proper encryption if storing sensitive data
- Monitor and log suspicious session activity

**Key Potential Challenges:**
- Balancing security with performance
- Managing session expiration properly
- Handling concurrent sessions
- Integrating with Clerk session management

## Testing Strategy
- Authentication flow testing
- Role-based access control verification
- Session management testing
- Security vulnerability testing
- Error handling validation

## Definition of Done
- [ ] Clerk authentication fully integrated
- [ ] Authentication middleware implemented
- [ ] Role-based authorization system operational
- [ ] Session management implemented
- [ ] Proper error handling for auth failures
- [ ] Security best practices applied
- [ ] Documentation for auth system created
- [ ] Tests for authentication and authorization passing

---

# Task 3: Database Schema & Data Access Layer

## Task Overview
- **Purpose:** Design and implement the database schema and data access layer
- **Value:** Provides structured data storage and retrieval for all platform features
- **Dependencies:** Standalone task that will be used by all feature implementations

## Required Knowledge
- **Key Documents:** `backend.md`, `prd.md`
- **Architecture Guidelines:** Schema Design Principles, Query Optimization Patterns
- **Phase 1 Dependencies:** Supabase/PostgreSQL setup

## Implementation Sub-Tasks

### Sub-Task 3.1: Core Database Schema ⭐️ *PRIORITY*

**Goal:** Design and implement the foundational database schema

**Key Database Tables:**
```sql
-- Users table (extends Clerk user data)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Battles table
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  battle_type VARCHAR(30) NOT NULL, -- wildStyle, pickUpKillIt, rAndBeef
  creator_id UUID NOT NULL REFERENCES users(id),
  rules JSONB NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  voting_start TIMESTAMP WITH TIME ZONE,
  voting_end TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL, -- draft, scheduled, active, voting, completed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Content table (for both battle entries and community content)
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(100),
  body TEXT,
  media_urls TEXT[],
  content_type VARCHAR(20) NOT NULL, -- text, image, audio, video, mixed
  battle_id UUID REFERENCES battles(id),
  is_battle_entry BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id),
  battle_id UUID REFERENCES battles(id),
  parent_id UUID REFERENCES comments(id),
  creator_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Reactions table (for content and comments)
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  target_type VARCHAR(20) NOT NULL, -- content, comment
  target_id UUID NOT NULL,
  reaction_type VARCHAR(20) NOT NULL, -- like, fire, laugh, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id, reaction_type)
);

-- Votes table (for battle entries)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id),
  content_id UUID NOT NULL REFERENCES content(id),
  voter_id UUID NOT NULL REFERENCES users(id),
  vote_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(voter_id, content_id, battle_id)
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(30) NOT NULL,
  icon_url TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  progress INTEGER NOT NULL DEFAULT 0,
  max_progress INTEGER NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create index for common queries
CREATE INDEX idx_content_creator_id ON content(creator_id);
CREATE INDEX idx_content_battle_id ON content(battle_id) WHERE battle_id IS NOT NULL;
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_comments_content_id ON comments(content_id) WHERE content_id IS NOT NULL;
CREATE INDEX idx_comments_battle_id ON comments(battle_id) WHERE battle_id IS NOT NULL;
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX idx_votes_battle_content ON votes(battle_id, content_id);
```

**Essential Requirements:**
- Complete database schema covering all entities
- Proper relationships between tables
- Appropriate indexing for performance
- Constraints for data integrity
- Timestamp fields for all tables

**Key Best Practices:**
- Follow normalization best practices
- Create appropriate indexes
- Use consistent naming conventions
- Document schema design decisions
- Implement proper foreign key constraints

**Key Potential Challenges:**
- Designing for performance and scalability
- Balancing normalization with query performance
- Planning for future schema evolution
- Managing complex relationships

### Sub-Task 3.2: Repository Pattern Implementation ⭐️ *PRIORITY*

**Goal:** Create data access layer using repository pattern

**Key Interface:**
```typescript
// src/repositories/base-repository.ts
import { Pool, PoolClient } from 'pg';
import { config } from '../config';

export class BaseRepository {
  protected pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl,
    });
  }
  
  // Execute query with parameters
  async query(text: string, params: any[] = []) {
    const start = Date.now();
    const result = await this.pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 100) {
      console.log('Slow query:', { text, duration, rows: result.rowCount });
    }
    
    return result;
  }
  
  // Execute transaction with callback
  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
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
}

// src/repositories/battle-repository.ts
import { BaseRepository } from './base-repository';
import { Battle, BattleStatus, CreateBattleInput, BattleFilters } from '../models/battle';

export class BattleRepository extends BaseRepository {
  // Create a new battle
  async create(data: CreateBattleInput): Promise<Battle> {
    const { rows } = await this.query(
      `INSERT INTO battles 
        (title, description, battle_type, creator_id, rules, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.title,
        data.description,
        data.battleType,
        data.creatorId,
        JSON.stringify(data.rules),
        data.startTime,
        data.endTime,
        data.status || 'scheduled'
      ]
    );
    
    return this.mapRowToBattle(rows[0]);
  }
  
  // Find battle by ID
  async findById(id: string): Promise<Battle | null> {
    const { rows } = await this.query(
      'SELECT * FROM battles WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return this.mapRowToBattle(rows[0]);
  }
  
  // Find battles with filtering
  async findAll(filters: BattleFilters = {}): Promise<Battle[]> {
    let query = 'SELECT * FROM battles WHERE 1=1';
    const params: any[] = [];
    
    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }
    
    if (filters.battleType) {
      params.push(filters.battleType);
      query += ` AND battle_type = $${params.length}`;
    }
    
    if (filters.creatorId) {
      params.push(filters.creatorId);
      query += ` AND creator_id = $${params.length}`;
    }
    
    // Add sorting
    query += ' ORDER BY created_at DESC';
    
    // Add pagination
    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
      
      if (filters.offset) {
        params.push(filters.offset);
        query += ` OFFSET $${params.length}`;
      }
    }
    
    const { rows } = await this.query(query, params);
    
    return rows.map(this.mapRowToBattle);
  }
  
  // Update battle status
  async updateStatus(id: string, status: BattleStatus): Promise<Battle | null> {
    const { rows } = await this.query(
      `UPDATE battles 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return this.mapRowToBattle(rows[0]);
  }
  
  // Private helper to map row to model
  private mapRowToBattle(row: any): Battle {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      battleType: row.battle_type,
      creatorId: row.creator_id,
      rules: row.rules,
      startTime: row.start_time,
      endTime: row.end_time,
      votingStart: row.voting_start,
      votingEnd: row.voting_end,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
```

**Essential Requirements:**
- Repository classes for all major entities
- Data mapping between database and models
- Transaction support for complex operations
- Query parameter handling
- Proper error handling

**Key Best Practices:**
- Abstract database interaction details
- Use consistent patterns across repositories
- Implement proper parameter sanitization
- Add logging for slow queries
- Create clear data mapping

**Key Potential Challenges:**
- Managing complex queries efficiently
- Implementing proper error handling
- Designing flexible filtering options
- Balancing abstraction with functionality

### Sub-Task 3.3: Supabase Integration ⭐️ *PRIORITY*

**Goal:** Implement Supabase client and real-time features

**Key Interface:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Create Supabase client
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// src/repositories/supabase-repository.ts
import { supabase } from '../lib/supabase';

export class SupabaseRepository {
  protected tableName: string;
  
  constructor(tableName: string) {
    this.tableName = tableName;
  }
  
  // Find by ID
  async findById(id: string) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  }
  
  // Create record
  async create(data: any) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return result;
  }
  
  // Update record
  async update(id: string, data: any) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return result;
  }
  
  // Delete record
  async delete(id: string) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  }
  
  // Find with filters
  async find(filters: any = {}, options: any = {}) {
    let query = supabase
      .from(this.tableName)
      .select(options.select || '*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });
    
    // Apply sorting
    if (options.orderBy) {
      const [column, direction] = options.orderBy.split(':');
      query = query.order(column, { ascending: direction === 'asc' });
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  }
}
```

**Essential Requirements:**
- Supabase client integration
- Real-time subscription capabilities
- Repository pattern using Supabase
- Error handling for Supabase operations
- Authentication integration

**Key Best Practices:**
- Create consistent interface with other repositories
- Implement proper error handling
- Use types for query results
- Apply appropriate caching where needed
- Document real-time capabilities

**Key Potential Challenges:**
- Managing real-time subscriptions efficiently
- Handling Supabase-specific quirks
- Integrating with authentication system
- Ensuring consistent error handling

## Testing Strategy
- Database schema validation
- Repository method testing
- Supabase integration testing
- Transaction handling verification
- Query performance testing

## Definition of Done
- [ ] Database schema created and validated
- [ ] Repository pattern implemented for all entities
- [ ] Supabase integration completed
- [ ] Data access layer fully tested
- [ ] Query performance optimizations applied
- [ ] Indexing strategy implemented
- [ ] Documentation for data access layer created
- [ ] Tests for database operations passing

---

# Task 4: Battle System Backend

## Task Overview
- **Purpose:** Implement the core battle system backend functionality
- **Value:** Powers the primary engagement feature that directly translates the Wild 'n Out format
- **Dependencies:** Requires Database Schema, API Foundation, Authentication

## Required Knowledge
- **Key Documents:** `prd.md` (Battle Arena section), `backend.md`, `appflow.md`
- **Architecture Guidelines:** Battle System Flow, API Design Implementation
- **Phase 1 Dependencies:** Database Schema, API Foundation

## Implementation Sub-Tasks

### Sub-Task 4.1: Battle Management ⭐️ *PRIORITY*

**Goal:** Implement creation, retrieval, and management of battles

**Key Service:**
```typescript
// src/services/battle-service.ts
import { BattleRepository } from '../repositories/battle-repository';
import { ContentRepository } from '../repositories/content-repository';
import { UserRepository } from '../repositories/user-repository';
import { Battle, CreateBattleInput, BattleFilters, BattleStatus } from '../models/battle';
import { NotFoundError, ValidationError } from '../errors';

export class BattleService {
  private battleRepository: BattleRepository;
  private contentRepository: ContentRepository;
  private userRepository: UserRepository;
  
  constructor() {
    this.battleRepository = new BattleRepository();
    this.contentRepository = new ContentRepository();
    this.userRepository = new UserRepository();
  }
  
  // Create a new battle
  async createBattle(userId: string, data: CreateBattleInput): Promise<Battle> {
    // Validate battle data
    this.validateBattleData(data);
    
    // Set creator ID
    const battleData = {
      ...data,
      creatorId: userId,
    };
    
    // Create battle
    return this.battleRepository.create(battleData);
  }
  
  // Get battle by ID with details
  async getBattleById(id: string, userId?: string): Promise<Battle> {
    const battle = await this.battleRepository.findById(id);
    
    if (!battle) {
      throw new NotFoundError('Battle not found', 'battle');
    }
    
    // Get creator details
    const creator = await this.userRepository.findById(battle.creatorId);
    
    // Get entry count
    const entryCount = await this.contentRepository.countBattleEntries(id);
    
    // Get user participation status if userId provided
    let userParticipation = null;
    if (userId) {
      const userEntry = await this.contentRepository.findUserBattleEntry(id, userId);
      userParticipation = {
        hasEntered: Boolean(userEntry),
        entryId: userEntry?.id || null,
      };
    }
    
    return {
      ...battle,
      creator,
      entryCount,
      userParticipation,
    };
  }
  
  // List battles with filtering
  async listBattles(filters: BattleFilters, userId?: string): Promise<{ battles: Battle[], total: number }> {
    const battles = await this.battleRepository.findAll(filters);
    const total = await this.battleRepository.count(filters);
    
    // Get creator details for all battles
    const creatorIds = [...new Set(battles.map(b => b.creatorId))];
    const creators = await this.userRepository.findByIds(creatorIds);
    
    // Get entry counts for all battles
    const battleIds = battles.map(b => b.id);
    const entryCounts = await this.contentRepository.countEntriesForBattles(battleIds);
    
    // Get user participation if userId provided
    let userParticipation = {};
    if (userId) {
      userParticipation = await this.contentRepository.getUserBattleEntries(battleIds, userId);
    }
    
    // Map creator and entry count to battles
    const enrichedBattles = battles.map(battle => ({
      ...battle,
      creator: creators.find(c => c.id === battle.creatorId),
      entryCount: entryCounts[battle.id] || 0,
      userParticipation: userId ? {
        hasEntered: Boolean(userParticipation[battle.id]),
        entryId: userParticipation[battle.id] || null,
      } : null,
    }));
    
    return {
      battles: enrichedBattles,
      total,
    };
  }
  
  // Update battle status
  async updateBattleStatus(id: string, status: BattleStatus, userId: string): Promise<Battle> {
    const battle = await this.battleRepository.findById(id);
    
    if (!battle) {
      throw new NotFoundError('Battle not found', 'battle');
    }
    
    // Check permissions (only creator or admin can update)
    if (battle.creatorId !== userId) {
      // Check if user is admin (would use role-based auth here)
      throw new ValidationError('Not authorized to update this battle');
    }
    
    // Validate status transition
    this.validateStatusTransition(battle.status, status);
    
    // Update status
    return this.battleRepository.updateStatus(id, status);
  }
  
  // Private helper for validation
  private validateBattleData(data: CreateBattleInput): void {
    if (!data.title || data.title.length < 3) {
      throw new ValidationError('Title must be at least 3 characters');
    }
    
    if (!data.description) {
      throw new ValidationError('Description is required');
    }
    
    if (!data.battleType) {
      throw new ValidationError('Battle type is required');
    }
    
    // Validate dates
    const now = new Date();
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    
    if (startTime < now) {
      throw new ValidationError('Start time must be in the future');
    }
    
    if (endTime <= startTime) {
      throw new ValidationError('End time must be after start time');
    }
  }
  
  // Validate status transition
  private validateStatusTransition(currentStatus: BattleStatus, newStatus: BattleStatus): void {
    const validTransitions = {
      draft: ['scheduled', 'active', 'cancelled'],
      scheduled: ['active', 'cancelled'],
      active: ['voting', 'completed', 'cancelled'],
      voting: ['completed'],
      completed: [],
      cancelled: [],
    };
    
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ValidationError(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  }
}
```

**API Implementation:**
```typescript
// src/api/battles/create-battle.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { BattleService } from '../../services/battle-service';
import { CreateBattleInput } from '../../models/battle';

export async function createBattle(
  request: FastifyRequest<{ Body: CreateBattleInput }>,
  reply: FastifyReply
) {
  const battleService = new BattleService();
  
  try {
    const battle = await battleService.createBattle(
      request.userId,
      request.body
    );
    
    return reply.code(201).send({
      data: battle,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to create battle');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Battle creation and validation
- Battle retrieval with details
- Battle listing with filtering
- Battle status management
- Creator and participant information

**Key Best Practices:**
- Implement proper validation
- Use service layer for business logic
- Apply repository pattern for data access
- Handle permissions and authorization
- Create type-safe interfaces

**Key Potential Challenges:**
- Managing complex battle state transitions
- Handling permissions efficiently
- Optimizing queries for large battle lists
- Integrating with user system

### Sub-Task 4.2: Battle Entry Management ⭐️ *PRIORITY*

**Goal:** Implement submission, retrieval, and management of battle entries

**Key Service:**
```typescript
// src/services/battle-entry-service.ts
import { ContentRepository } from '../repositories/content-repository';
import { BattleRepository } from '../repositories/battle-repository';
import { BattleEntry, CreateBattleEntryInput } from '../models/battle-entry';
import { NotFoundError, ValidationError } from '../errors';

export class BattleEntryService {
  private contentRepository: ContentRepository;
  private battleRepository: BattleRepository;
  
  constructor() {
    this.contentRepository = new ContentRepository();
    this.battleRepository = new BattleRepository();
  }
  
  // Submit entry to battle
  async submitEntry(userId: string, battleId: string, data: CreateBattleEntryInput): Promise<BattleEntry> {
    // Get battle to check status
    const battle = await this.battleRepository.findById(battleId);
    
    if (!battle) {
      throw new NotFoundError('Battle not found', 'battle');
    }
    
    // Check if battle is accepting entries
    if (battle.status !== 'active') {
      throw new ValidationError('Battle is not accepting entries');
    }
    
    // Check if user already submitted entry
    const existingEntry = await this.contentRepository.findUserBattleEntry(battleId, userId);
    
    if (existingEntry) {
      throw new ValidationError('You have already submitted an entry to this battle');
    }
    
    // Validate entry against battle rules
    this.validateEntryAgainstRules(data, battle.rules);
    
    // Create entry content
    const entryData = {
      creatorId: userId,
      title: data.title,
      body: data.body,
      mediaUrls: data.mediaUrls || [],
      contentType: data.contentType,
      battleId,
      isBattleEntry: true,
    };
    
    return this.contentRepository.createContent(entryData);
  }
  
  // Get entries for a battle
  async getBattleEntries(battleId: string, options: { 
    limit?: number, 
    offset?: number, 
    includeCreator?: boolean 
  } = {}): Promise<{ entries: BattleEntry[], total: number }> {
    // Check if battle exists
    const battle = await this.battleRepository.findById(battleId);
    
    if (!battle) {
      throw new NotFoundError('Battle not found', 'battle');
    }
    
    // Get entries
    const entries = await this.contentRepository.findBattleEntries(
      battleId,
      options
    );
    
    const total = await this.contentRepository.countBattleEntries(battleId);
    
    return {
      entries,
      total,
    };
  }
  
  // Get entry by ID
  async getEntryById(entryId: string): Promise<BattleEntry> {
    const entry = await this.contentRepository.findById(entryId);
    
    if (!entry) {
      throw new NotFoundError('Entry not found', 'entry');
    }
    
    if (!entry.battleId || !entry.isBattleEntry) {
      throw new ValidationError('Content is not a battle entry');
    }
    
    return entry;
  }
  
  // Validate entry against battle rules
  private validateEntryAgainstRules(entry: CreateBattleEntryInput, rules: any): void {
    // Check content type allowed
    if (rules.allowedContentTypes && !rules.allowedContentTypes.includes(entry.contentType)) {
      throw new ValidationError(`Content type ${entry.contentType} is not allowed for this battle`);
    }
    
    // Check text length if applicable
    if (entry.body && rules.maxTextLength && entry.body.length > rules.maxTextLength) {
      throw new ValidationError(`Text exceeds maximum length of ${rules.maxTextLength} characters`);
    }
    
    if (entry.body && rules.minTextLength && entry.body.length < rules.minTextLength) {
      throw new ValidationError(`Text must be at least ${rules.minTextLength} characters`);
    }
    
    // Check media requirements if applicable
    if (rules.requiresMedia && (!entry.mediaUrls || entry.mediaUrls.length === 0)) {
      throw new ValidationError('Media is required for this battle');
    }
    
    // Check max media count if applicable
    if (entry.mediaUrls && rules.maxMediaCount && entry.mediaUrls.length > rules.maxMediaCount) {
      throw new ValidationError(`Maximum of ${rules.maxMediaCount} media items allowed`);
    }
  }
}
```

**API Implementation:**
```typescript
// src/api/battles/submit-entry.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { BattleEntryService } from '../../services/battle-entry-service';
import { CreateBattleEntryInput } from '../../models/battle-entry';

export async function submitBattleEntry(
  request: FastifyRequest<{
    Params: { battleId: string },
    Body: CreateBattleEntryInput
  }>,
  reply: FastifyReply
) {
  const battleEntryService = new BattleEntryService();
  
  try {
    const entry = await battleEntryService.submitEntry(
      request.userId,
      request.params.battleId,
      request.body
    );
    
    return reply.code(201).send({
      data: entry,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to submit battle entry');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Entry submission with validation
- Entry retrieval for battles
- Entry detail retrieval
- Rule validation against battle type
- Creator information inclusion

**Key Best Practices:**
- Validate entries against battle rules
- Check battle status before submission
- Apply proper error handling
- Use typed interfaces for data
- Implement efficient querying

**Key Potential Challenges:**
- Handling various content types
- Validating against complex rule sets
- Managing media submissions
- Enforcing fair participation rules

### Sub-Task 4.3: Voting & Results System ⭐️ *PRIORITY*

**Goal:** Implement the battle voting and results calculation system

**Key Service:**
```typescript
// src/services/voting-service.ts
import { VoteRepository } from '../repositories/vote-repository';
import { BattleRepository } from '../repositories/battle-repository';
import { ContentRepository } from '../repositories/content-repository';
import { Vote, CreateVoteInput } from '../models/vote';
import { NotFoundError, ValidationError } from '../errors';

export class VotingService {
  private voteRepository: VoteRepository;
  private battleRepository: BattleRepository;
  private contentRepository: ContentRepository;
  
  constructor() {
    this.voteRepository = new VoteRepository();
    this.battleRepository = new BattleRepository();
    this.contentRepository = new ContentRepository();
  }
  
  // Cast vote for an entry
  async castVote(userId: string, input: CreateVoteInput): Promise<Vote> {
    const { battleId, contentId, voteValue = 1 } = input;
    
    // Check if battle exists and is in voting phase
    const battle = await this.battleRepository.findById(battleId);
    
    if (!battle) {
      throw new NotFoundError('Battle not found', 'battle');
    }
    
    if (battle.status !== 'voting') {
      throw new ValidationError('Battle is not in voting phase');
    }
    
    // Check if entry exists and belongs to the battle
    const entry = await this.contentRepository.findById(contentId);
    
    if (!entry || entry.battleId !== battleId || !entry.isBattleEntry) {
      throw new NotFoundError('Entry not found in this battle', 'entry');
    }
    
    // Check if user is voting for their own entry
    if (entry.creatorId === userId) {
      throw new ValidationError('Cannot vote for your own entry');
    }
    
    // Check if user already voted for this entry
    const existingVote = await this.voteRepository.findUserVoteForEntry(userId, contentId, battleId);
    
    if (existingVote) {
      throw new ValidationError('You have already voted for this entry');
    }
    
    // Create vote
    return this.voteRepository.createVote({
      voterId: userId,
      contentId,
      battleId,
      voteValue,
    });
  }
  
  // Get user's votes for a battle
  async getUserVotes(userId: string, battleId: string): Promise<Vote[]> {
    return this.voteRepository.findUserVotesForBattle(userId, battleId);
  }
  
  // Get vote counts for battle entries
  async getVoteCountsForBattle(battleId: string): Promise<Record<string, number>> {
    return this.voteRepository.getVoteCountsByEntry(battleId);
  }
  
  // Calculate battle results
  async calculateBattleResults(battleId: string): Promise<any> {
    // Check if battle exists and is in voting or completed phase
    const battle = await this.battleRepository.findById(battleId);
    
    if (!battle) {
      throw new NotFoundError('Battle not found', 'battle');
    }
    
    if (battle.status !== 'voting' && battle.status !== 'completed') {
      throw new ValidationError('Cannot calculate results - battle is not in voting or completed phase');
    }
    
    // Get all entries for battle
    const { entries } = await this.contentRepository.findBattleEntries(battleId, { includeCreator: true });
    
    // Get vote counts for each entry
    const voteCounts = await this.voteRepository.getVoteCountsByEntry(battleId);
    
    // Calculate rankings
    const rankedEntries = entries.map(entry => ({
      ...entry,
      voteCount: voteCounts[entry.id] || 0,
    })).sort((a, b) => b.voteCount - a.voteCount);
    
    // Assign rankings
    let rank = 1;
    let lastVoteCount = -1;
    
    const rankedResults = rankedEntries.map((entry, index) => {
      // If vote count is different from last entry, increment rank
      if (entry.voteCount !== lastVoteCount) {
        rank = index + 1;
        lastVoteCount = entry.voteCount;
      }
      
      return {
        ...entry,
        rank,
      };
    });
    
    // If battle is in voting phase, return results without updating
    if (battle.status === 'voting') {
      return {
        battleId,
        status: battle.status,
        results: rankedResults,
        finalized: false,
      };
    }
    
    // For completed battles, also update rankings in database if not already done
    const entriesNeedingUpdate = rankedResults.filter(entry => entry.rank !== entry.storedRank);
    
    if (entriesNeedingUpdate.length > 0) {
      // Update ranks in database
      await Promise.all(entriesNeedingUpdate.map(entry => 
        this.contentRepository.updateEntryRank(entry.id, entry.rank)
      ));
    }
    
    return {
      battleId,
      status: battle.status,
      results: rankedResults,
      finalized: true,
    };
  }
}
```

**API Implementation:**
```typescript
// src/api/battles/cast-vote.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { VotingService } from '../../services/voting-service';
import { CreateVoteInput } from '../../models/vote';

export async function castVote(
  request: FastifyRequest<{ Body: CreateVoteInput }>,
  reply: FastifyReply
) {
  const votingService = new VotingService();
  
  try {
    const vote = await votingService.castVote(
      request.userId,
      request.body
    );
    
    return reply.code(201).send({
      data: vote,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to cast vote');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/battles/get-results.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { VotingService } from '../../services/voting-service';

export async function getBattleResults(
  request: FastifyRequest<{ Params: { battleId: string } }>,
  reply: FastifyReply
) {
  const votingService = new VotingService();
  
  try {
    const results = await votingService.calculateBattleResults(
      request.params.battleId
    );
    
    return reply.code(200).send({
      data: results,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to get battle results');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Vote casting with validation
- Vote counting and tracking
- Results calculation with rankings
- Entry status updates based on results
- Leaderboard generation

**Key Best Practices:**
- Apply proper validation rules
- Implement fair voting mechanics
- Design efficient vote counting
- Create clear ranking algorithm
- Handle ties appropriately

**Key Potential Challenges:**
- Preventing voting manipulation
- Handling large vote volumes
- Creating fair ranking system
- Managing ties and edge cases
- Optimizing vote counting for performance

## Testing Strategy
- Battle creation and management tests
- Entry submission flow testing
- Voting mechanics validation
- Results calculation verification
- Edge case testing for voting and results

## Definition of Done
- [ ] Battle creation and management implemented
- [ ] Battle entry submission system working
- [ ] Voting system implemented with validation
- [ ] Results calculation functioning correctly
- [ ] Leaderboard generation working
- [ ] Battle state transitions properly handled
- [ ] Documentation for battle system created
- [ ] Tests for battle system passing

---

# Task 5: Content Management System

## Task Overview
- **Purpose:** Implement the content creation, storage, and retrieval system
- **Value:** Enables user-generated content that drives engagement and platform value
- **Dependencies:** Requires Database Schema, API Foundation, Authentication

## Required Knowledge
- **Key Documents:** `prd.md` (Content Management section), `backend.md`
- **Architecture Guidelines:** Data Model and Storage, API Design Implementation
- **Phase 1 Dependencies:** Database Schema, API Foundation

## Implementation Sub-Tasks

### Sub-Task 5.1: Content Creation & Management ⭐️ *PRIORITY*

**Goal:** Implement core content creation and management functionality

**Key Service:**
```typescript
// src/services/content-service.ts
import { ContentRepository } from '../repositories/content-repository';
import { UserRepository } from '../repositories/user-repository';
import { Content, CreateContentInput, ContentFilters } from '../models/content';
import { NotFoundError, ValidationError } from '../errors';

export class ContentService {
  private contentRepository: ContentRepository;
  private userRepository: UserRepository;
  
  constructor() {
    this.contentRepository = new ContentRepository();
    this.userRepository = new UserRepository();
  }
  
  // Create new content
  async createContent(userId: string, data: CreateContentInput): Promise<Content> {
    // Validate content data
    this.validateContentData(data);
    
    // Create content
    const contentData = {
      ...data,
      creatorId: userId,
      isBattleEntry: false, // Regular content, not a battle entry
    };
    
    return this.contentRepository.createContent(contentData);
  }
  
  // Get content by ID
  async getContentById(id: string, userId?: string): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    
    if (!content) {
      throw new NotFoundError('Content not found', 'content');
    }
    
    // Get creator details
    const creator = await this.userRepository.findById(content.creatorId);
    
    // Get reaction statistics
    const reactionStats = await this.contentRepository.getContentReactionStats(id);
    
    // Get user-specific reaction data if userId provided
    let userReactions = null;
    if (userId) {
      userReactions = await this.contentRepository.getUserReactionsForContent(id, userId);
    }
    
    return {
      ...content,
      creator,
      reactionStats,
      userReactions,
    };
  }
  
  // List content with filtering
  async listContent(filters: ContentFilters, userId?: string): Promise<{ content: Content[], total: number }> {
    const content = await this.contentRepository.findAll(filters);
    const total = await this.contentRepository.count(filters);
    
    // Get creator information
    const creatorIds = [...new Set(content.map(c => c.creatorId))];
    const creators = await this.userRepository.findByIds(creatorIds);
    
    // Get reaction stats for all content
    const contentIds = content.map(c => c.id);
    const reactionStats = await this.contentRepository.getReactionStatsForContent(contentIds);
    
    // Get user-specific reaction data if userId provided
    let userReactions = {};
    if (userId) {
      userReactions = await this.contentRepository.getUserReactionsForMultipleContent(contentIds, userId);
    }
    
    // Enrich content with additional data
    const enrichedContent = content.map(c => ({
      ...c,
      creator: creators.find(creator => creator.id === c.creatorId),
      reactionStats: reactionStats[c.id] || { likes: 0, comments: 0 },
      userReactions: userId ? userReactions[c.id] || null : null,
    }));
    
    return {
      content: enrichedContent,
      total,
    };
  }
  
  // Update content
  async updateContent(id: string, userId: string, data: Partial<CreateContentInput>): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    
    if (!content) {
      throw new NotFoundError('Content not found', 'content');
    }
    
    // Check ownership
    if (content.creatorId !== userId) {
      // Check if user is admin (would use role-based auth here)
      throw new ValidationError('Not authorized to update this content');
    }
    
    // Validate updated data
    if (data.title !== undefined && data.title.length < 3) {
      throw new ValidationError('Title must be at least 3 characters');
    }
    
    // Cannot update battle entries
    if (content.isBattleEntry) {
      throw new ValidationError('Cannot update battle entries');
    }
    
    // Update content
    return this.contentRepository.updateContent(id, data);
  }
  
  // Delete content
  async deleteContent(id: string, userId: string): Promise<boolean> {
    const content = await this.contentRepository.findById(id);
    
    if (!content) {
      throw new NotFoundError('Content not found', 'content');
    }
    
    // Check ownership
    if (content.creatorId !== userId) {
      // Check if user is admin (would use role-based auth here)
      throw new ValidationError('Not authorized to delete this content');
    }
    
    // Cannot delete battle entries
    if (content.isBattleEntry) {
      throw new ValidationError('Cannot delete battle entries');
    }
    
    // Delete content
    return this.contentRepository.deleteContent(id);
  }
  
  // Private helper for validation
  private validateContentData(data: CreateContentInput): void {
    if (!data.contentType) {
      throw new ValidationError('Content type is required');
    }
    
    if (!data.title || data.title.length < 3) {
      throw new ValidationError('Title must be at least 3 characters');
    }
    
    // For text content, validate body
    if (data.contentType === 'text' && (!data.body || data.body.length < 10)) {
      throw new ValidationError('Text content must have a body with at least 10 characters');
    }
    
    // For media content, validate media URLs
    if (['image', 'audio', 'video'].includes(data.contentType) && 
        (!data.mediaUrls || data.mediaUrls.length === 0)) {
      throw new ValidationError('Media content must have at least one media URL');
    }
  }
}
```

**API Implementation:**
```typescript
// src/api/content/create-content.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { ContentService } from '../../services/content-service';
import { CreateContentInput } from '../../models/content';

export async function createContent(
  request: FastifyRequest<{ Body: CreateContentInput }>,
  reply: FastifyReply
) {
  const contentService = new ContentService();
  
  try {
    const content = await contentService.createContent(
      request.userId,
      request.body
    );
    
    return reply.code(201).send({
      data: content,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to create content');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Content creation with validation
- Content retrieval with details
- Content update and deletion
- Content listing with filtering
- Creator information inclusion

**Key Best Practices:**
- Validate content data thoroughly
- Check permissions for updates/deletes
- Apply proper error handling
- Use typed interfaces for data
- Optimize queries for content listing

**Key Potential Challenges:**
- Handling diverse content types
- Managing media references
- Optimizing for feed generation
- Implementing proper permissions
- Supporting content moderation

### Sub-Task 5.2: Media Upload & Management ⭐️ *PRIORITY*

**Goal:** Implement secure media upload and storage system

**Key Service:**
```typescript
// src/services/media-service.ts
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { NotFoundError, ValidationError } from '../errors';

export class MediaService {
  private supabase;
  private ALLOWED_MIME_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    video: ['video/mp4', 'video/webm'],
  };
  private MAX_FILE_SIZE = {
    image: 5 * 1024 * 1024, // 5MB
    audio: 20 * 1024 * 1024, // 20MB
    video: 50 * 1024 * 1024, // 50MB
  };
  
  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey
    );
  }
  
  // Get upload URL for direct upload
  async getUploadUrl(
    userId: string, 
    fileType: 'image' | 'audio' | 'video', 
    mimeType: string,
    fileName: string
  ): Promise<{ uploadUrl: string, mediaUrl: string }> {
    // Validate mime type
    if (!this.ALLOWED_MIME_TYPES[fileType].includes(mimeType)) {
      throw new ValidationError(`Unsupported mime type ${mimeType} for ${fileType}`);
    }
    
    // Generate path
    const fileExtension = fileName.split('.').pop() || '';
    const filePath = `${fileType}/${userId}/${uuidv4()}.${fileExtension}`;
    
    // Generate signed upload URL
    const { data, error } = await this.supabase.storage
      .from('media')
      .createSignedUploadUrl(filePath);
    
    if (error) {
      throw error;
    }
    
    // Get public URL for the file
    const mediaUrl = this.supabase.storage
      .from('media')
      .getPublicUrl(filePath).data.publicUrl;
    
    return {
      uploadUrl: data.signedUrl,
      mediaUrl,
    };
  }
  
  // Upload file directly (for small files)
  async uploadFile(
    userId: string,
    fileType: 'image' | 'audio' | 'video',
    file: Buffer,
    mimeType: string,
    fileName: string
  ): Promise<{ mediaUrl: string }> {
    // Validate mime type
    if (!this.ALLOWED_MIME_TYPES[fileType].includes(mimeType)) {
      throw new ValidationError(`Unsupported mime type ${mimeType} for ${fileType}`);
    }
    
    // Validate file size
    if (file.length > this.MAX_FILE_SIZE[fileType]) {
      throw new ValidationError(`File too large (max ${this.MAX_FILE_SIZE[fileType] / (1024 * 1024)}MB)`);
    }
    
    // Generate path
    const fileExtension = fileName.split('.').pop() || '';
    const filePath = `${fileType}/${userId}/${uuidv4()}.${fileExtension}`;
    
    // Upload file
    const { error } = await this.supabase.storage
      .from('media')
      .upload(filePath, file, {
        contentType: mimeType,
        upsert: false,
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL for the file
    const mediaUrl = this.supabase.storage
      .from('media')
      .getPublicUrl(filePath).data.publicUrl;
    
    return { mediaUrl };
  }
  
  // Delete media file
  async deleteFile(userId: string, mediaUrl: string): Promise<boolean> {
    // Extract file path from media URL
    const urlObj = new URL(mediaUrl);
    const path = urlObj.pathname.replace('/storage/v1/object/public/media/', '');
    
    // Check if path starts with user ID (basic permission check)
    const pathParts = path.split('/');
    if (pathParts[1] !== userId) {
      throw new ValidationError('Not authorized to delete this file');
    }
    
    // Delete file
    const { error } = await this.supabase.storage
      .from('media')
      .remove([path]);
    
    if (error) {
      throw error;
    }
    
    return true;
  }
}
```

**API Implementation:**
```typescript
// src/api/media/get-upload-url.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { MediaService } from '../../services/media-service';

interface GetUploadUrlRequest {
  Querystring: {
    fileType: 'image' | 'audio' | 'video';
    mimeType: string;
    fileName: string;
  };
}

export async function getUploadUrl(
  request: FastifyRequest<GetUploadUrlRequest>,
  reply: FastifyReply
) {
  const mediaService = new MediaService();
  const { fileType, mimeType, fileName } = request.query;
  
  try {
    const result = await mediaService.getUploadUrl(
      request.userId,
      fileType,
      mimeType,
      fileName
    );
    
    return reply.code(200).send({
      data: result,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to generate upload URL');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/media/upload-file.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { MediaService } from '../../services/media-service';

export async function uploadFile(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const mediaService = new MediaService();
  
  try {
    // Parse multipart form data
    const data = await request.file();
    
    if (!data) {
      throw new Error('No file uploaded');
    }
    
    const fileType = request.query.fileType as 'image' | 'audio' | 'video';
    const buffer = await data.toBuffer();
    const mimeType = data.mimetype;
    const fileName = data.filename;
    
    const result = await mediaService.uploadFile(
      request.userId,
      fileType,
      buffer,
      mimeType,
      fileName
    );
    
    return reply.code(200).send({
      data: result,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to upload file');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Secure direct upload URL generation
- Server-side file upload handling
- File type and size validation
- Media file organization and storage
- Media file deletion with permission checking

**Key Best Practices:**
- Validate file types and sizes
- Use signed upload URLs for larger files
- Organize files by user and type
- Implement proper permission checking
- Apply secure access controls

**Key Potential Challenges:**
- Handling large file uploads efficiently
- Creating secure file access control
- Managing storage costs at scale
- Implementing proper file organization
- Supporting various media types

### Sub-Task 5.3: Content Moderation System ⭐️ *PRIORITY*

**Goal:** Implement a robust content moderation system

**Key Service:**
```typescript
// src/services/moderation-service.ts
import { ContentRepository } from '../repositories/content-repository';
import { ModerationRepository } from '../repositories/moderation-repository';
import { UserRepository } from '../repositories/user-repository';
import { Content, ModerationStatus, ModerationDecision } from '../models/content';
import { NotFoundError, ValidationError } from '../errors';

export class ModerationService {
  private contentRepository: ContentRepository;
  private moderationRepository: ModerationRepository;
  private userRepository: UserRepository;
  
  constructor() {
    this.contentRepository = new ContentRepository();
    this.moderationRepository = new ModerationRepository();
    this.userRepository = new UserRepository();
  }
  
  // Get content pending moderation
  async getPendingContent(options: {
    limit?: number;
    offset?: number;
    priority?: boolean;
  } = {}): Promise<{ content: Content[], total: number }> {
    const content = await this.moderationRepository.getPendingContent(options);
    const total = await this.moderationRepository.countPendingContent(options);
    
    // Get creator information
    const creatorIds = [...new Set(content.map(c => c.creatorId))];
    const creators = await this.userRepository.findByIds(creatorIds);
    
    // Enrich content with creator info
    const enrichedContent = content.map(c => ({
      ...c,
      creator: creators.find(creator => creator.id === c.creatorId),
    }));
    
    return {
      content: enrichedContent,
      total,
    };
  }
  
  // Make moderation decision
  async moderateContent(
    contentId: string, 
    moderatorId: string, 
    decision: ModerationDecision
  ): Promise<Content> {
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw new NotFoundError('Content not found', 'content');
    }
    
    // Check if content already moderated
    if (content.moderationStatus !== 'pending') {
      throw new ValidationError('Content already moderated');
    }
    
    // Check if user is a moderator (would use role-based auth here)
    // For now, assume the user calling this is authorized
    
    // Update content moderation status
    const status: ModerationStatus = decision.approved ? 'approved' : 'rejected';
    
    // Record moderation decision
    await this.moderationRepository.recordModerationDecision({
      contentId,
      moderatorId,
      decision: status,
      reason: decision.reason || null,
    });
    
    // Update content status
    return this.contentRepository.updateModerationStatus(contentId, status);
  }
  
  // Report content for moderation
  async reportContent(
    contentId: string, 
    reporterId: string, 
    reason: string
  ): Promise<boolean> {
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw new NotFoundError('Content not found', 'content');
    }
    
    // Check if user already reported this content
    const alreadyReported = await this.moderationRepository.hasUserReportedContent(
      contentId,
      reporterId
    );
    
    if (alreadyReported) {
      throw new ValidationError('You have already reported this content');
    }
    
    // Record report
    await this.moderationRepository.createContentReport({
      contentId,
      reporterId,
      reason,
    });
    
    // Check report count and potentially flag for priority review
    const reportCount = await this.moderationRepository.getReportCount(contentId);
    
    if (reportCount >= 3 && content.moderationStatus === 'pending') {
      await this.moderationRepository.flagForPriorityReview(contentId);
    }
    
    return true;
  }
  
  // Get content moderation history
  async getContentModerationHistory(contentId: string): Promise<any[]> {
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw new NotFoundError('Content not found', 'content');
    }
    
    return this.moderationRepository.getContentModerationHistory(contentId);
  }
}
```

**API Implementation:**
```typescript
// src/api/moderation/moderate-content.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { ModerationService } from '../../services/moderation-service';
import { ModerationDecision } from '../../models/content';

export async function moderateContent(
  request: FastifyRequest<{
    Params: { contentId: string };
    Body: ModerationDecision;
  }>,
  reply: FastifyReply
) {
  const moderationService = new ModerationService();
  
  try {
    const result = await moderationService.moderateContent(
      request.params.contentId,
      request.userId,
      request.body
    );
    
    return reply.code(200).send({
      data: result,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to moderate content');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/content/report-content.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { ModerationService } from '../../services/moderation-service';

interface ReportContentRequest {
  Params: { contentId: string };
  Body: {
    reason: string;
  };
}

export async function reportContent(
  request: FastifyRequest<ReportContentRequest>,
  reply: FastifyReply
) {
  const moderationService = new ModerationService();
  
  try {
    const result = await moderationService.reportContent(
      request.params.contentId,
      request.userId,
      request.body.reason
    );
    
    return reply.code(200).send({
      data: {
        success: result,
      },
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to report content');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Pending content moderation queue
- Moderation decision recording
- Content status updating
- User reporting system
- Moderation history tracking

**Key Best Practices:**
- Design clear moderation workflows
- Implement priority flagging
- Create comprehensive reporting system
- Track moderation decisions
- Apply proper permission checking

**Key Potential Challenges:**
- Scaling moderation with content growth
- Balancing automated and manual moderation
- Creating fair reporting system
- Managing moderation queue efficiently
- Implementing proper escalation paths

## Testing Strategy
- Content creation and retrieval testing
- Media upload and management verification
- Moderation workflow testing
- Permission and validation testing
- Edge case testing for content types

## Definition of Done
- [ ] Content creation and management implemented
- [ ] Media upload and storage system working
- [ ] Content moderation system operational
- [ ] Content listing with filtering implemented
- [ ] User reporting system functional
- [ ] Documentation for content management created
- [ ] Tests for content management passing

---

# Task 6: User Profile & Achievement Engine

## Task Overview
- **Purpose:** Implement user profile management and achievement system
- **Value:** Drives user engagement and retention through progression and recognition
- **Dependencies:** Requires Database Schema, API Foundation, Authentication

## Required Knowledge
- **Key Documents:** `prd.md` (Profile & Achievement section), `backend.md`, `appflow.md`
- **Architecture Guidelines:** Data Model and Storage, API Design Implementation
- **Phase 1 Dependencies:** Database Schema, API Foundation

## Implementation Sub-Tasks

### Sub-Task 6.1: User Profile Management ⭐️ *PRIORITY*

**Goal:** Implement user profile creation, retrieval, and updating

**Key Service:**
```typescript
// src/services/user-service.ts
import { UserRepository } from '../repositories/user-repository';
import { ContentRepository } from '../repositories/content-repository';
import { AchievementRepository } from '../repositories/achievement-repository';
import { User, UpdateUserProfileInput } from '../models/user';
import { NotFoundError, ValidationError } from '../errors';
import { clerkClient } from '@clerk/fastify';

export class UserService {
  private userRepository: UserRepository;
  private contentRepository: ContentRepository;
  private achievementRepository: AchievementRepository;
  
  constructor() {
    this.userRepository = new UserRepository();
    this.contentRepository = new ContentRepository();
    this.achievementRepository = new AchievementRepository();
  }
  
  // Create or update user from Clerk webhook
  async handleUserCreated(clerkUserId: string, userData: any): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByClerkId(clerkUserId);
    
    if (existingUser) {
      // Update existing user
      return this.userRepository.updateUser(existingUser.id, {
        displayName: userData.first_name + (userData.last_name ? ` ${userData.last_name}` : ''),
        avatarUrl: userData.image_url,
        updatedAt: new Date(),
      });
    }
    
    // Generate username from email or name if not available
    let username = userData.username;
    if (!username) {
      const emailUsername = userData.email_addresses[0]?.email.split('@')[0];
      username = emailUsername || `user${Math.floor(Math.random() * 10000)}`;
    }
    
    // Make username unique if needed
    const isUsernameTaken = await this.userRepository.isUsernameTaken(username);
    if (isUsernameTaken) {
      username = `${username}${Math.floor(Math.random() * 10000)}`;
    }
    
    // Create new user
    return this.userRepository.createUser({
      clerkId: clerkUserId,
      username,
      displayName: userData.first_name + (userData.last_name ? ` ${userData.last_name}` : ''),
      avatarUrl: userData.image_url,
      bio: '',
      level: 1,
      points: 0,
    });
  }
  
  // Get user profile by ID or username
  async getUserProfile(userIdOrUsername: string): Promise<User> {
    // Check if input is a UUID or username
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrUsername);
    
    let user;
    if (isUuid) {
      user = await this.userRepository.findById(userIdOrUsername);
    } else {
      user = await this.userRepository.findByUsername(userIdOrUsername);
    }
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Get content count
    const contentCount = await this.contentRepository.countUserContent(user.id);
    
    // Get achievement summary
    const achievementSummary = await this.achievementRepository.getUserAchievementSummary(user.id);
    
    return {
      ...user,
      contentCount,
      achievements: achievementSummary,
    };
  }
  
  // Get current user profile
  async getCurrentUserProfile(clerkUserId: string): Promise<User> {
    const user = await this.userRepository.findByClerkId(clerkUserId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    return this.getUserProfile(user.id);
  }
  
  // Update user profile
  async updateUserProfile(
    userId: string, 
    clerkUserId: string, 
    data: UpdateUserProfileInput
  ): Promise<User> {
    // Verify current user is updating own profile
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    if (user.clerkId !== clerkUserId) {
      throw new ValidationError('Not authorized to update this profile');
    }
    
    // Validate username if changing
    if (data.username && data.username !== user.username) {
      // Check username format
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(data.username)) {
        throw new ValidationError('Username must be 3-30 characters and can only contain letters, numbers, and underscores');
      }
      
      // Check if username is taken
      const isUsernameTaken = await this.userRepository.isUsernameTaken(data.username);
      if (isUsernameTaken) {
        throw new ValidationError('Username is already taken');
      }
    }
    
    // Update Clerk profile if needed
    if (data.displayName) {
      try {
        // Extract first and last name
        const nameParts = data.displayName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        await clerkClient.users.updateUser(clerkUserId, {
          firstName,
          lastName: lastName || '',
        });
      } catch (error) {
        console.error('Failed to update Clerk profile:', error);
        // Continue with local update even if Clerk update fails
      }
    }
    
    // Update local profile
    return this.userRepository.updateUser(userId, {
      ...data,
      updatedAt: new Date(),
    });
  }
  
  // Get user roles
  async getUserRoles(userId: string): Promise<string[]> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // For now, return basic roles
    // In a real implementation, this would query a roles table
    return ['user'];
  }
}
```

**API Implementation:**
```typescript
// src/api/users/get-profile.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../../services/user-service';

export async function getUserProfile(
  request: FastifyRequest<{ Params: { userIdOrUsername: string } }>,
  reply: FastifyReply
) {
  const userService = new UserService();
  
  try {
    const profile = await userService.getUserProfile(
      request.params.userIdOrUsername
    );
    
    return reply.code(200).send({
      data: profile,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to get user profile');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/users/update-profile.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../../services/user-service';
import { UpdateUserProfileInput } from '../../models/user';

export async function updateUserProfile(
  request: FastifyRequest<{
    Params: { userId: string };
    Body: UpdateUserProfileInput;
  }>,
  reply: FastifyReply
) {
  const userService = new UserService();
  
  try {
    const profile = await userService.updateUserProfile(
      request.params.userId,
      request.userId, // From Clerk auth middleware
      request.body
    );
    
    return reply.code(200).send({
      data: profile,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to update user profile');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- User profile creation from Clerk data
- Profile retrieval with details
- Profile updating with validation
- Username management
- Profile statistics inclusion

**Key Best Practices:**
- Validate profile information
- Sync with Clerk user data
- Apply proper error handling
- Use typed interfaces for data
- Implement proper permission checking

**Key Potential Challenges:**
- Syncing with Clerk user data
- Managing unique usernames
- Implementing efficient profile retrieval
- Handling profile statistics
- Managing profile privacy settings

### Sub-Task 6.2: Achievement System ⭐️ *PRIORITY*

**Goal:** Implement a comprehensive achievement tracking and reward system

**Key Service:**
```typescript
// src/services/achievement-service.ts
import { AchievementRepository } from '../repositories/achievement-repository';
import { UserRepository } from '../repositories/user-repository';
import { Achievement, UserAchievement, AchievementProgress } from '../models/achievement';
import { NotFoundError } from '../errors';

export class AchievementService {
  private achievementRepository: AchievementRepository;
  private userRepository: UserRepository;
  
  constructor() {
    this.achievementRepository = new AchievementRepository();
    this.userRepository = new UserRepository();
  }
  
  // Get all achievements
  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementRepository.findAll();
  }
  
  // Get achievement by ID
  async getAchievementById(id: string): Promise<Achievement> {
    const achievement = await this.achievementRepository.findById(id);
    
    if (!achievement) {
      throw new NotFoundError('Achievement not found', 'achievement');
    }
    
    return achievement;
  }
  
  // Get user achievements
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    return this.achievementRepository.getUserAchievements(userId);
  }
  
  // Track achievement progress
  async trackAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number
  ): Promise<AchievementProgress> {
    // Get achievement details
    const achievement = await this.achievementRepository.findById(achievementId);
    
    if (!achievement) {
      throw new NotFoundError('Achievement not found', 'achievement');
    }
    
    // Get current user achievement
    let userAchievement = await this.achievementRepository.getUserAchievement(
      userId,
      achievementId
    );
    
    // Calculate new progress
    let newProgress = progress;
    if (
        ## Continuing from Achievement Service...

```typescript
// src/services/achievement-service.ts (continued)
  // Track achievement progress
  async trackAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number
  ): Promise<AchievementProgress> {
    // Get achievement details
    const achievement = await this.achievementRepository.findById(achievementId);
    
    if (!achievement) {
      throw new NotFoundError('Achievement not found', 'achievement');
    }
    
    // Get current user achievement
    let userAchievement = await this.achievementRepository.getUserAchievement(
      userId,
      achievementId
    );
    
    // Calculate new progress
    let newProgress = progress;
    if (userAchievement) {
      // If achievement tracking already exists, add to progress
      newProgress = userAchievement.progress + progress;
    }
    
    // Cap progress at max value
    const maxProgress = achievement.criteria.maxProgress || 100;
    newProgress = Math.min(newProgress, maxProgress);
    
    // Check if achievement is newly unlocked
    const isNewlyUnlocked = 
      userAchievement && 
      userAchievement.progress < maxProgress && 
      newProgress >= maxProgress;
    
    // Update or create user achievement
    if (userAchievement) {
      userAchievement = await this.achievementRepository.updateUserAchievement(
        userId,
        achievementId,
        {
          progress: newProgress,
          unlockedAt: isNewlyUnlocked ? new Date() : userAchievement.unlockedAt,
        }
      );
    } else {
      userAchievement = await this.achievementRepository.createUserAchievement({
        userId,
        achievementId,
        progress: newProgress,
        maxProgress,
        unlockedAt: newProgress >= maxProgress ? new Date() : null,
      });
    }
    
    // If newly unlocked, award points
    if (isNewlyUnlocked) {
      await this.userRepository.addPoints(userId, achievement.points);
      
      // Check for level up based on total points
      const totalPoints = await this.userRepository.getUserPoints(userId);
      const newLevel = this.calculateLevel(totalPoints);
      
      const user = await this.userRepository.findById(userId);
      if (user && user.level < newLevel) {
        await this.userRepository.updateLevel(userId, newLevel);
      }
    }
    
    return {
      achievement,
      progress: userAchievement.progress,
      maxProgress,
      isUnlocked: userAchievement.unlockedAt !== null,
      isNewlyUnlocked,
      pointsAwarded: isNewlyUnlocked ? achievement.points : 0,
    };
  }
  
  // Check multiple achievements
  async checkMultipleAchievements(
    userId: string,
    eventType: string,
    metadata: any
  ): Promise<AchievementProgress[]> {
    // Get achievements that match this event type
    const achievements = await this.achievementRepository.findAchievementsByEventType(eventType);
    
    // Process each matching achievement
    const progressUpdates = await Promise.all(
      achievements.map(async (achievement) => {
        // Check if achievement criteria is met based on metadata
        const progress = this.evaluateAchievementCriteria(achievement, metadata);
        
        if (progress > 0) {
          return this.trackAchievementProgress(userId, achievement.id, progress);
        }
        
        return null;
      })
    );
    
    // Filter out null results (achievements that didn't progress)
    return progressUpdates.filter(Boolean);
  }
  
  // Calculate level based on points
  private calculateLevel(points: number): number {
    // Simple level calculation: Level = 1 + sqrt(points / 100)
    // This creates a curve where each level requires more points
    return Math.floor(1 + Math.sqrt(points / 100));
  }
  
  // Evaluate achievement criteria
  private evaluateAchievementCriteria(achievement: Achievement, metadata: any): number {
    const criteria = achievement.criteria;
    
    switch (criteria.type) {
      case 'count':
        // Simple count-based achievement (e.g., "Create 5 battles")
        return this.evaluateCountCriteria(criteria, metadata);
        
      case 'threshold':
        // Threshold-based achievement (e.g., "Reach 100 followers")
        return this.evaluateThresholdCriteria(criteria, metadata);
        
      case 'streak':
        // Streak-based achievement (e.g., "Log in 7 days in a row")
        return this.evaluateStreakCriteria(criteria, metadata);
        
      default:
        return 0;
    }
  }
  
  // Evaluate count criteria
  private evaluateCountCriteria(criteria: any, metadata: any): number {
    // Extract count from metadata based on criteria.field
    const count = metadata[criteria.field] || 1;
    
    // Return the count as progress
    return count;
  }
  
  // Evaluate threshold criteria
  private evaluateThresholdCriteria(criteria: any, metadata: any): number {
    // Extract value from metadata based on criteria.field
    const value = metadata[criteria.field] || 0;
    
    // Check if threshold is reached
    if (value >= criteria.threshold) {
      return criteria.maxProgress || 100; // Complete the achievement
    }
    
    // Calculate partial progress
    return Math.floor((value / criteria.threshold) * (criteria.maxProgress || 100));
  }
  
  // Evaluate streak criteria
  private evaluateStreakCriteria(criteria: any, metadata: any): number {
    // Extract current streak from metadata
    const currentStreak = metadata.currentStreak || 1;
    
    // Return the streak count as progress
    return currentStreak;
  }
}
```

**API Implementation:**
```typescript
// src/api/achievements/get-user-achievements.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { AchievementService } from '../../services/achievement-service';

export async function getUserAchievements(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const achievementService = new AchievementService();
  
  try {
    const achievements = await achievementService.getUserAchievements(
      request.params.userId
    );
    
    return reply.code(200).send({
      data: achievements,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to get user achievements');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/achievements/track-achievement.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { AchievementService } from '../../services/achievement-service';

interface TrackAchievementRequest {
  Params: { achievementId: string };
  Body: {
    progress: number;
  };
}

export async function trackAchievement(
  request: FastifyRequest<TrackAchievementRequest>,
  reply: FastifyReply
) {
  const achievementService = new AchievementService();
  
  try {
    const result = await achievementService.trackAchievementProgress(
      request.userId,
      request.params.achievementId,
      request.body.progress
    );
    
    return reply.code(200).send({
      data: result,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to track achievement progress');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Achievement definition and storage
- User achievement tracking
- Progress calculation and updates
- Achievement unlocking with rewards
- Multiple achievement types support

**Key Best Practices:**
- Design flexible achievement criteria system
- Implement efficient progress tracking
- Create clear achievement categories
- Apply proper notification on unlock
- Design scalable achievement storage

**Key Potential Challenges:**
- Designing flexible achievement criteria
- Implementing efficient progress tracking
- Creating balanced point rewards
- Managing complex achievement types
- Handling achievement notifications

### Sub-Task 6.3: Points and Leveling System ⭐️ *PRIORITY*

**Goal:** Implement a comprehensive points and leveling system

**Key Service:**
```typescript
// src/services/points-service.ts
import { UserRepository } from '../repositories/user-repository';
import { PointsRepository } from '../repositories/points-repository';
import { PointTransaction, PointTransactionType } from '../models/user';
import { NotFoundError } from '../errors';

export class PointsService {
  private userRepository: UserRepository;
  private pointsRepository: PointsRepository;
  
  constructor() {
    this.userRepository = new UserRepository();
    this.pointsRepository = new PointsRepository();
  }
  
  // Award points to user
  async awardPoints(
    userId: string,
    points: number,
    transactionType: PointTransactionType,
    referenceId?: string,
    description?: string
  ): Promise<PointTransaction> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Create point transaction
    const transaction = await this.pointsRepository.createTransaction({
      userId,
      points,
      transactionType,
      referenceId,
      description,
    });
    
    // Update user's total points
    await this.userRepository.addPoints(userId, points);
    
    // Check for level up
    const totalPoints = await this.userRepository.getUserPoints(userId);
    const newLevel = this.calculateLevel(totalPoints);
    
    if (user.level < newLevel) {
      await this.userRepository.updateLevel(userId, newLevel);
      
      // Return updated level info with transaction
      return {
        ...transaction,
        levelUp: {
          oldLevel: user.level,
          newLevel,
        },
      };
    }
    
    return transaction;
  }
  
  // Get user point transactions
  async getUserTransactions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      transactionType?: PointTransactionType;
    } = {}
  ): Promise<{ transactions: PointTransaction[], total: number }> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    const transactions = await this.pointsRepository.getUserTransactions(userId, options);
    const total = await this.pointsRepository.countUserTransactions(userId, options);
    
    return {
      transactions,
      total,
    };
  }
  
  // Get user point balance
  async getUserPointBalance(userId: string): Promise<{ points: number, level: number }> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    return {
      points: user.points,
      level: user.level,
    };
  }
  
  // Get level requirements
  async getLevelRequirements(level: number): Promise<{ level: number, pointsRequired: number, pointsToNextLevel: number }> {
    // Calculate points required for current level
    const pointsRequired = this.calculatePointsForLevel(level);
    
    // Calculate points required for next level
    const pointsForNextLevel = this.calculatePointsForLevel(level + 1);
    
    // Calculate points needed to reach next level
    const pointsToNextLevel = pointsForNextLevel - pointsRequired;
    
    return {
      level,
      pointsRequired,
      pointsToNextLevel,
    };
  }
  
  // Calculate level based on points
  private calculateLevel(points: number): number {
    // Simple level calculation: Level = 1 + sqrt(points / 100)
    // This creates a curve where each level requires more points
    return Math.floor(1 + Math.sqrt(points / 100));
  }
  
  // Calculate points required for a specific level
  private calculatePointsForLevel(level: number): number {
    // Inverse of level calculation:
    // Points = 100 * (level - 1)^2
    return 100 * Math.pow(level - 1, 2);
  }
}
```

**API Implementation:**
```typescript
// src/api/users/award-points.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { PointsService } from '../../services/points-service';
import { PointTransactionType } from '../../models/user';

interface AwardPointsRequest {
  Params: { userId: string };
  Body: {
    points: number;
    transactionType: PointTransactionType;
    referenceId?: string;
    description?: string;
  };
}

export async function awardPoints(
  request: FastifyRequest<AwardPointsRequest>,
  reply: FastifyReply
) {
  const pointsService = new PointsService();
  
  try {
    const result = await pointsService.awardPoints(
      request.params.userId,
      request.body.points,
      request.body.transactionType,
      request.body.referenceId,
      request.body.description
    );
    
    return reply.code(200).send({
      data: result,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to award points');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/users/get-point-balance.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { PointsService } from '../../services/points-service';

export async function getPointBalance(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const pointsService = new PointsService();
  
  try {
    const result = await pointsService.getUserPointBalance(
      request.params.userId
    );
    
    return reply.code(200).send({
      data: result,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to get point balance');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Point transaction recording
- Point balance tracking
- Leveling system with progression
- Transaction history retrieval
- Level-up detection and notification

**Key Best Practices:**
- Design transparent point system
- Create balanced level progression
- Implement transaction record keeping
- Apply proper permission checking
- Design engaging level-up mechanics

**Key Potential Challenges:**
- Balancing point economy
- Creating fair level progression
- Managing transaction volume
- Preventing point exploitation
- Designing meaningful level benefits

## Testing Strategy
- User profile creation and update testing
- Achievement tracking and unlocking verification
- Point transaction and balance testing
- Level progression validation
- Permission and validation testing

## Definition of Done
- [ ] User profile management implemented
- [ ] Achievement system with tracking operational
- [ ] Points and leveling system working
- [ ] Achievement unlocking with rewards functional
- [ ] User statistics and progression tracking implemented
- [ ] Documentation for user and achievement system created
- [ ] Tests for user profile and achievement system passing

---

# Task 7: Community & Social Features

## Task Overview
- **Purpose:** Implement community engagement and social interaction features
- **Value:** Creates a vibrant community ecosystem that drives retention and engagement
- **Dependencies:** Requires Database Schema, API Foundation, User Profiles

## Required Knowledge
- **Key Documents:** `prd.md` (Community Zone section), `backend.md`
- **Architecture Guidelines:** API Design Implementation, Data Model and Storage
- **Phase 1 Dependencies:** Database Schema, API Foundation, User Profiles

## Implementation Sub-Tasks

### Sub-Task 7.1: Comment System ⭐️ *PRIORITY*

**Goal:** Implement comprehensive comment functionality for content and battles

**Key Service:**
```typescript
// src/services/comment-service.ts
import { CommentRepository } from '../repositories/comment-repository';
import { ContentRepository } from '../repositories/content-repository';
import { BattleRepository } from '../repositories/battle-repository';
import { UserRepository } from '../repositories/user-repository';
import { Comment, CreateCommentInput, CommentFilters } from '../models/comment';
import { NotFoundError, ValidationError } from '../errors';

export class CommentService {
  private commentRepository: CommentRepository;
  private contentRepository: ContentRepository;
  private battleRepository: BattleRepository;
  private userRepository: UserRepository;
  
  constructor() {
    this.commentRepository = new CommentRepository();
    this.contentRepository = new ContentRepository();
    this.battleRepository = new BattleRepository();
    this.userRepository = new UserRepository();
  }
  
  // Create a comment
  async createComment(userId: string, data: CreateCommentInput): Promise<Comment> {
    // Validate target exists (content or battle)
    if (data.contentId) {
      const content = await this.contentRepository.findById(data.contentId);
      if (!content) {
        throw new NotFoundError('Content not found', 'content');
      }
    } else if (data.battleId) {
      const battle = await this.battleRepository.findById(data.battleId);
      if (!battle) {
        throw new NotFoundError('Battle not found', 'battle');
      }
    } else {
      throw new ValidationError('Either contentId or battleId must be provided');
    }
    
    // Validate parent comment if provided
    if (data.parentId) {
      const parentComment = await this.commentRepository.findById(data.parentId);
      if (!parentComment) {
        throw new NotFoundError('Parent comment not found', 'comment');
      }
      
      // Ensure parent comment is associated with the same content/battle
      if (
        (data.contentId && parentComment.contentId !== data.contentId) ||
        (data.battleId && parentComment.battleId !== data.battleId)
      ) {
        throw new ValidationError('Parent comment does not belong to the specified content or battle');
      }
      
      // Limit nesting depth to prevent deep threads
      if (parentComment.parentId) {
        throw new ValidationError('Cannot reply to a nested comment (max depth: 1)');
      }
    }
    
    // Validate comment body
    if (!data.body || data.body.trim().length < 3) {
      throw new ValidationError('Comment must be at least 3 characters');
    }
    
    // Create comment
    const comment = await this.commentRepository.createComment({
      creatorId: userId,
      contentId: data.contentId,
      battleId: data.battleId,
      parentId: data.parentId,
      body: data.body.trim(),
    });
    
    // Get creator info
    const creator = await this.userRepository.findById(userId);
    
    return {
      ...comment,
      creator,
    };
  }
  
  // Get comments for content or battle
  async getComments(
    filters: CommentFilters,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: 'recent' | 'popular';
    } = {}
  ): Promise<{ comments: Comment[], total: number }> {
    // Validate filters (must have either contentId or battleId)
    if (!filters.contentId && !filters.battleId) {
      throw new ValidationError('Either contentId or battleId must be provided');
    }
    
    // Get comments
    const comments = await this.commentRepository.findComments(filters, options);
    const total = await this.commentRepository.countComments(filters);
    
    // Get creator information
    const creatorIds = [...new Set(comments.map(c => c.creatorId))];
    const creators = await this.userRepository.findByIds(creatorIds);
    
    // Get reply counts for top-level comments
    const commentIds = comments.filter(c => !c.parentId).map(c => c.id);
    const replyCounts = await this.commentRepository.getReplyCountsForComments(commentIds);
    
    // Enrich comments with additional data
    const enrichedComments = comments.map(comment => ({
      ...comment,
      creator: creators.find(creator => creator.id === comment.creatorId),
      replyCount: comment.parentId ? 0 : (replyCounts[comment.id] || 0),
    }));
    
    return {
      comments: enrichedComments,
      total,
    };
  }
  
  // Get a single comment with replies
  async getCommentWithReplies(
    commentId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ comment: Comment, replies: Comment[], total: number }> {
    // Get the comment
    const comment = await this.commentRepository.findById(commentId);
    
    if (!comment) {
      throw new NotFoundError('Comment not found', 'comment');
    }
    
    // Get creator info
    const creator = await this.userRepository.findById(comment.creatorId);
    
    // Get replies if it's a top-level comment
    let replies = [];
    let total = 0;
    
    if (!comment.parentId) {
      // Get replies
      replies = await this.commentRepository.findReplies(commentId, options);
      total = await this.commentRepository.countReplies(commentId);
      
      // Get creator information for replies
      const replyCreatorIds = [...new Set(replies.map(r => r.creatorId))];
      const replyCreators = await this.userRepository.findByIds(replyCreatorIds);
      
      // Enrich replies with creator info
      replies = replies.map(reply => ({
        ...reply,
        creator: replyCreators.find(c => c.id === reply.creatorId),
      }));
    }
    
    return {
      comment: {
        ...comment,
        creator,
      },
      replies,
      total,
    };
  }
  
  // Delete comment
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    // Get the comment
    const comment = await this.commentRepository.findById(commentId);
    
    if (!comment) {
      throw new NotFoundError('Comment not found', 'comment');
    }
    
    // Check ownership
    if (comment.creatorId !== userId) {
      // Check if user is admin (would use role-based auth here)
      throw new ValidationError('Not authorized to delete this comment');
    }
    
    // Delete comment
    return this.commentRepository.deleteComment(commentId);
  }
}
```

**API Implementation:**
```typescript
// src/api/comments/create-comment.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { CommentService } from '../../services/comment-service';
import { CreateCommentInput } from '../../models/comment';

export async function createComment(
  request: FastifyRequest<{ Body: CreateCommentInput }>,
  reply: FastifyReply
) {
  const commentService = new CommentService();
  
  try {
    const comment = await commentService.createComment(
      request.userId,
      request.body
    );
    
    return reply.code(201).send({
      data: comment,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to create comment');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/comments/get-comments.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { CommentService } from '../../services/comment-service';
import { CommentFilters } from '../../models/comment';

interface GetCommentsRequest {
  Querystring: CommentFilters & {
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'popular';
  };
}

export async function getComments(
  request: FastifyRequest<GetCommentsRequest>,
  reply: FastifyReply
) {
  const commentService = new CommentService();
  
  try {
    const { contentId, battleId } = request.query;
    const filters: CommentFilters = {};
    
    if (contentId) filters.contentId = contentId;
    if (battleId) filters.battleId = battleId;
    
    const { limit, offset, sortBy } = request.query;
    
    const result = await commentService.getComments(
      filters,
      { limit, offset, sortBy }
    );
    
    return reply.code(200).send({
      data: result.comments,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
        total: result.total,
        limit,
        offset,
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to get comments');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Comment creation with validation
- Comment retrieval for content and battles
- Threaded comments with nesting
- Comment creator information inclusion
- Comment deletion with permission checking

**Key Best Practices:**
- Limit comment nesting depth
- Validate comment content
- Apply proper permission checking
- Use efficient query patterns
- Include creator information

**Key Potential Challenges:**
- Managing threaded comments efficiently
- Handling large comment volumes
- Implementing moderation for comments
- Creating efficient comment querying
- Supporting real-time comment updates

### Sub-Task 7.2: Reaction System ⭐️ *PRIORITY*

**Goal:** Implement a flexible reaction system for content and comments

**Key Service:**
```typescript
// src/services/reaction-service.ts
import { ReactionRepository } from '../repositories/reaction-repository';
import { ContentRepository } from '../repositories/content-repository';
import { CommentRepository } from '../repositories/comment-repository';
import { UserRepository } from '../repositories/user-repository';
import { Reaction, CreateReactionInput, ReactionType, ReactionTarget } from '../models/reaction';
import { NotFoundError, ValidationError } from '../errors';

export class ReactionService {
  private reactionRepository: ReactionRepository;
  private contentRepository: ContentRepository;
  private commentRepository: CommentRepository;
  private userRepository: UserRepository;
  
  // Available reaction types
  private ALLOWED_REACTION_TYPES: ReactionType[] = [
    'like', 
    'fire', 
    'laugh', 
    'wow', 
    'sad'
  ];
  
  constructor() {
    this.reactionRepository = new ReactionRepository();
    this.contentRepository = new ContentRepository();
    this.commentRepository = new CommentRepository();
    this.userRepository = new UserRepository();
  }
  
  // Create or update a reaction
  async createReaction(userId: string, data: CreateReactionInput): Promise<Reaction> {
    // Validate reaction type
    if (!this.ALLOWED_REACTION_TYPES.includes(data.reactionType)) {
      throw new ValidationError(`Invalid reaction type: ${data.reactionType}`);
    }
    
    // Validate target exists
    switch (data.targetType) {
      case 'content':
        const content = await this.contentRepository.findById(data.targetId);
        if (!content) {
          throw new NotFoundError('Content not found', 'content');
        }
        break;
        
      case 'comment':
        const comment = await this.commentRepository.findById(data.targetId);
        if (!comment) {
          throw new NotFoundError('Comment not found', 'comment');
        }
        break;
        
      default:
        throw new ValidationError(`Invalid target type: ${data.targetType}`);
    }
    
    // Check if user already reacted to this target
    const existingReaction = await this.reactionRepository.findUserReaction(
      userId,
      data.targetType,
      data.targetId
    );
    
    if (existingReaction) {
      // Update existing reaction if type is different
      if (existingReaction.reactionType !== data.reactionType) {
        return this.reactionRepository.updateReaction(
          existingReaction.id,
          data.reactionType
        );
      }
      
      // Remove reaction if the same type (toggle behavior)
      await this.reactionRepository.deleteReaction(existingReaction.id);
      return { ...existingReaction, deleted: true };
    }
    
    // Create new reaction
    return this.reactionRepository.createReaction({
      userId,
      targetType: data.targetType,
      targetId: data.targetId,
      reactionType: data.reactionType,
    });
  }
  
  // Get reactions for a target
  async getReactions(
    targetType: ReactionTarget,
    targetId: string,
    options: {
      groupByType?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ reactions: Reaction[] | Record<ReactionType, number>, total: number }> {
    // Validate target exists
    switch (targetType) {
      case 'content':
        const content = await this.contentRepository.findById(targetId);
        if (!content) {
          throw new NotFoundError('Content not found', 'content');
        }
        break;
        
      case 'comment':
        const comment = await this.commentRepository.findById(targetId);
        if (!comment) {
          throw new NotFoundError('Comment not found', 'comment');
        }
        break;
    }
    
    // Get reactions based on options
    if (options.groupByType) {
      // Get grouped reaction counts
      const counts = await this.reactionRepository.getReactionCountsByType(
        targetType,
        targetId
      );
      
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      
      return {
        reactions: counts,
        total,
      };
    } else {
      // Get individual reactions with user info
      const reactions = await this.reactionRepository.getReactions(
        targetType,
        targetId,
        options
      );
      
      const total = await this.reactionRepository.countReactions(
        targetType,
        targetId
      );
      
      // Get user information
      const userIds = [...new Set(reactions.map(r => r.userId))];
      const users = await this.userRepository.findByIds(userIds);
      
      // Enrich reactions with user info
      const enrichedReactions = reactions.map(reaction => ({
        ...reaction,
        user: users.find(user => user.id === reaction.userId),
      }));
      
      return {
        reactions: enrichedReactions,
        total,
      };
    }
  }
  
  // Get user reactions
  async getUserReactions(
    userId: string,
    targetType: ReactionTarget,
    targetIds: string[]
  ): Promise<Record<string, ReactionType | null>> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Get user reactions for the targets
    const reactions = await this.reactionRepository.getUserReactionsForTargets(
      userId,
      targetType,
      targetIds
    );
    
    // Create a map of targetId -> reactionType
    const result: Record<string, ReactionType | null> = {};
    
    // Initialize all targets with null reactions
    targetIds.forEach(targetId => {
      result[targetId] = null;
    });
    
    // Update with actual reactions
    reactions.forEach(reaction => {
      result[reaction.targetId] = reaction.reactionType;
    });
    
    return result;
  }
  
  // Delete a reaction
  async deleteReaction(reactionId: string, userId: string): Promise<boolean> {
    // Get the reaction
    const reaction = await this.reactionRepository.findById(reactionId);
    
    if (!reaction) {
      throw new NotFoundError('Reaction not found', 'reaction');
    }
    
    // Check ownership
    if (reaction.userId !== userId) {
      // Check if user is admin (would use role-based auth here)
      throw new ValidationError('Not authorized to delete this reaction');
    }
    
    // Delete reaction
    return this.reactionRepository.deleteReaction(reactionId);
  }
}
```

**API Implementation:**
```typescript
// src/api/reactions/create-reaction.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { ReactionService } from '../../services/reaction-service';
import { CreateReactionInput } from '../../models/reaction';

export async function createReaction(
  request: FastifyRequest<{ Body: CreateReactionInput }>,
  reply: FastifyReply
) {
  const reactionService = new ReactionService();
  
  try {
    const reaction = await reactionService.createReaction(
      request.userId,
      request.body
    );
    
    return reply.code(reaction.deleted ? 200 : 201).send({
      data: reaction,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to create reaction');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/reactions/get-reactions.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { ReactionService } from '../../services/reaction-service';
import { ReactionTarget } from '../../models/reaction';

interface GetReactionsRequest {
  Params: {
    targetType: ReactionTarget;
    targetId: string;
  };
  Querystring: {
    groupByType?: boolean;
    limit?: number;
    offset?: number;
  };
}

export async function getReactions(
  request: FastifyRequest<GetReactionsRequest>,
  reply: FastifyReply
) {
  const reactionService = new ReactionService();
  
  try {
    const { targetType, targetId } = request.params;
    const { groupByType, limit, offset } = request.query;
    
    const result = await reactionService.getReactions(
      targetType,
      targetId,
      { groupByType: Boolean(groupByType), limit, offset }
    );
    
    return reply.code(200).send({
      data: result.reactions,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
        total: result.total,
        limit,
        offset,
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to get reactions');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Multiple reaction types support
- Reaction creation and deletion
- Reaction toggling behavior
- Reaction counting and aggregation
- User reaction status retrieval

**Key Best Practices:**
- Use efficient database indexing
- Implement toggle behavior for reactions
- Apply proper permission checking
- Create appropriate reaction types
- Design for real-time updates

**Key Potential Challenges:**
- Handling high volume of reactions
- Implementing efficient counting
- Supporting real-time reaction updates
- Managing complex reaction types
- Optimizing reaction retrieval

### Sub-Task 7.3: Feed Generation System ⭐️ *PRIORITY*

**Goal:** Implement a dynamic feed generation system for personalized content

**Key Service:**
```typescript
// src/services/feed-service.ts
import { ContentRepository } from '../repositories/content-repository';
import { UserRepository } from '../repositories/user-repository';
import { BattleRepository } from '../repositories/battle-repository';
import { FeedRepository } from '../repositories/feed-repository';
import { FeedItem, FeedFilters, FeedItemType } from '../models/feed';
import { NotFoundError } from '../errors';

export class FeedService {
  private contentRepository: ContentRepository;
  private userRepository: UserRepository;
  private battleRepository: BattleRepository;
  private feedRepository: FeedRepository;
  
  constructor() {
    this.contentRepository = new ContentRepository();
    this.userRepository = new UserRepository();
    this.battleRepository = new BattleRepository();
    this.feedRepository = new FeedRepository();
  }
  
  // Get feed for a user
  async getUserFeed(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      types?: FeedItemType[];
    } = {}
  ): Promise<{ items: FeedItem[], total: number }> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Get feed items
    const items = await this.feedRepository.getUserFeed(userId, options);
    const total = await this.feedRepository.countUserFeedItems(userId, options);
    
    // Enrich items with additional data
    const enrichedItems = await this.enrichFeedItems(items, userId);
    
    return {
      items: enrichedItems,
      total,
    };
  }
  
  // Get explore feed (content discovery)
  async getExploreFeed(
    userId: string | null,
    filters: FeedFilters,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ items: FeedItem[], total: number }> {
    // Get explore feed items
    const items = await this.feedRepository.getExploreFeed(filters, options);
    const total = await this.feedRepository.countExploreFeedItems(filters);
    
    // Enrich items with additional data
    const enrichedItems = await this.enrichFeedItems(items, userId);
    
    return {
      items: enrichedItems,
      total,
    };
  }
  
  // Generate feed for a user
  async generateUserFeed(userId: string): Promise<number> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Get followed users
    const followedUsers = await this.userRepository.getFollowedUsers(userId);
    
    // Get recent content from followed users
    const contentItems = await this.contentRepository.getRecentContentFromUsers(
      followedUsers.map(u => u.id),
      { limit: 50 }
    );
    
    // Get recent active battles
    const battleItems = await this.battleRepository.getRecentBattles(
      { status: 'active', limit: 10 }
    );
    
    // Transform items to feed items
    const feedItems = [
      ...contentItems.map(content => ({
        type: 'content' as const,
        targetId: content.id,
        creatorId: content.creatorId,
        createdAt: content.createdAt,
        score: this.calculateContentScore(content),
      })),
      ...battleItems.map(battle => ({
        type: 'battle' as const,
        targetId: battle.id,
        creatorId: battle.creatorId,
        createdAt: battle.createdAt,
        score: this.calculateBattleScore(battle),
      })),
    ];
    
    // Sort by score and created date
    feedItems.sort((a, b) => {
      // Sort by score first (higher score first)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      
      // Then by created date (newer first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Save feed items
    await this.feedRepository.clearUserFeed(userId);
    await this.feedRepository.saveFeedItems(userId, feedItems);
    
    return feedItems.length;
  }
  
  // Enrich feed items with additional data
  private async enrichFeedItems(items: FeedItem[], userId: string | null): Promise<FeedItem[]> {
    // Group items by type for batch fetching
    const contentIds = items
      .filter(item => item.type === 'content')
      .map(item => item.targetId);
      
    const battleIds = items
      .filter(item => item.type === 'battle')
      .map(item => item.targetId);
      
    // Batch fetch content and battles
    const contents = contentIds.length > 0
      ? await this.contentRepository.findByIds(contentIds)
      : [];
      
    const battles = battleIds.length > 0
      ? await this.battleRepository.findByIds(battleIds)
      : [];
    
    // Get creator info
    const creatorIds = [...new Set(items.map(item => item.creatorId))];
    const creators = creatorIds.length > 0
      ? await this.userRepository.findByIds(creatorIds)
      : [];
    
    // Get user reactions if userId provided
    let userContentReactions = {};
    let userBattleReactions = {};
    
    if (userId && contentIds.length > 0) {
      userContentReactions = await this.feedRepository.getUserReactionsForContent(
        userId,
        contentIds
      );
    }
    
    // Enrich items with fetched data
    return items.map(item => {
      let enrichedItem: any = { ...item };
      
      // Add creator info
      enrichedItem.creator = creators.find(creator => creator.id === item.creatorId);
      
      // Add target info based on type
      if (item.type === 'content') {
        const content = contents.find(content => content.id === item.targetId);
        enrichedItem.content = content;
        
        // Add user reaction if available
        if (userId) {
          enrichedItem.userReaction = userContentReactions[item.targetId] || null;
        }
      } else if (item.type === 'battle') {
        const battle = battles.find(battle => battle.id === item.targetId);
        enrichedItem.battle = battle;
      }
      
      return enrichedItem;
    });
  }
  
  // Calculate content score for feed ranking
  private calculateContentScore(content: any): number {
    // Simple scoring based on recency, reactions, and comments
    const ageInHours = (new Date().getTime() - new Date(content.createdAt).getTime()) / (1000 * 60 * 60);
    const reactionScore = (content.reactionCount || 0) * 5;
    const commentScore = (content.commentCount || 0) * 10;
    
    // Score decays with age
    return (reactionScore + commentScore) / Math.max(1, Math.log(ageInHours + 2));
  }
  
  // Calculate battle score for feed ranking
  private calculateBattleScore(battle: any): number {
    // Score active battles highly, score based on participation and time left
    const ageInHours = (new Date().getTime() - new Date(battle.createdAt).getTime()) / (1000 * 60 * 60);
    const participantScore = (battle.participantCount || 0) * 5;
    
    // Battles closing soon get a boost
    const endTime = new Date(battle.endTime).getTime();
    const timeLeftHours = (endTime - new Date().getTime()) / (1000 * 60 * 60);
    const urgencyBoost = timeLeftHours > 0 && timeLeftHours < 6 ? 100 : 0;
    
    // Active battles have higher score
    const statusBoost = battle.status === 'active' ? 200 : 0;
    
    return (participantScore + statusBoost + urgencyBoost) / Math.max(1, Math.log(ageInHours + 2));
  }
}
```

**API Implementation:**
```typescript
// src/api/feed/get-user-feed.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { FeedService } from '../../services/feed-service';
import { FeedItemType } from '../../models/feed';

interface GetUserFeedRequest {
  Querystring: {
    limit?: number;
    offset?: number;
    types?: string; // Comma-separated types
  };
}

export async function getUserFeed(
  request: FastifyRequest<GetUserFeedRequest>,
  reply: FastifyReply
) {
  const feedService = new FeedService();
  
  try {
    const { limit, offset } = request.query;
    
    // Parse types from comma-separated string
    const types = request.query.types
      ? request.query.types.split(',') as FeedItemType[]
      : undefined;
    
    const result = await feedService.getUserFeed(
      request.userId,
      { limit, offset, types }
    );
    
    return reply.code(200).send({
      data: result.items,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
        total: result.total,
        limit,
        offset,
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to get user feed');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/feed/get-explore-feed.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { FeedService } from '../../services/feed-service';
import { FeedFilters } from '../../models/feed';

interface GetExploreFeedRequest {
  Querystring: FeedFilters & {
    limit?: number;
    offset?: number;
  };
}

export async function getExploreFeed(
  request: FastifyRequest<GetExploreFeedRequest>,
  reply: FastifyReply
) {
  const feedService = new FeedService();
  
  try {
    const { category, trending, limit, offset } = request.query;
    const filters: FeedFilters = {};
    
    if (category) filters.category = category;
    if (trending !== undefined) filters.trending = Boolean(trending);
    
    const userId = request.userId || null;
    
    const result = await feedService.getExploreFeed(
      userId,
      filters,
      { limit, offset }
    );
    
    return reply.code(200).send({
      data: result.items,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
        total: result.total,
        limit,
        offset,
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to get explore feed');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Dynamic feed generation with personalization
- Content and battle ranking algorithm
- Feed item enrichment with details
- Exploration feed for content discovery
- User-specific feed filtering

**Key Best Practices:**
- Implement efficient feed generation
- Design flexible ranking algorithms
- Create batched data fetching
- Apply proper caching strategies
- Support both authenticated and anonymous users

**Key Potential Challenges:**
- Creating performant feed generation
- Designing effective ranking algorithms
- Handling large volumes of content
- Implementing efficient data fetching
- Managing feed freshness

## Testing Strategy
- Comment creation and retrieval testing
- Reaction system functionality validation
- Feed generation and retrieval testing
- Performance testing for high-volume scenarios
- Permission and validation testing

## Definition of Done
- [ ] Comment system implemented with threading
- [ ] Reaction system operational with multiple types
- [ ] Feed generation system implemented
- [ ] Content discovery features working
- [ ] Performance optimization for high-volume operations
- [ ] Documentation for community features created
- [ ] Tests for community features passing

---

# Task 8: Token & Blockchain Integration

## Task Overview
- **Purpose:** Implement token and blockchain integration features
- **Value:** Provides utility for token holders and drives token value
- **Dependencies:** Requires Database Schema, API Foundation, Authentication

## Required Knowledge
- **Key Documents:** `prd.md` (Token Hub section), `backend.md`
- **Architecture Guidelines:** API Design Implementation, Error Handling and Logging
- **Phase 1 Dependencies:** Database Schema, API Foundation

## Implementation Sub-Tasks

### Sub-Task 8.1: Wallet Integration ⭐️ *PRIORITY*

**Goal:** Implement secure wallet connection and verification

**Key Service:**
```typescript
// src/services/wallet-service.ts
import { WalletRepository } from '../repositories/wallet-repository';
import { UserRepository } from '../repositories/user-repository';
import { Web3Service } from '../services/web3-service';
import { Wallet, ConnectWalletInput, WalletVerification } from '../models/wallet';
import { NotFoundError, ValidationError } from '../errors';
import { createHash } from 'crypto';

export class WalletService {
  private walletRepository: WalletRepository;
  private userRepository: UserRepository;
  private web3Service: Web3Service;
  
  constructor() {
    this.walletRepository = new WalletRepository();
    this.userRepository = new UserRepository();
    this.web3Service = new Web3Service();
  }
  
  // Generate a message for wallet verification
  async generateVerificationMessage(userId: string): Promise<{ message: string, nonce: string }> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Generate a random nonce
    const nonce = createHash('sha256')
      .update(userId + Date.now().toString() + Math.random().toString())
      .digest('hex')
      .slice(0, 16);
    
    // Store nonce for the user
    await this.walletRepository.storeNonce(userId, nonce);
    
    // Generate verification message
    const message = `Sign this message to verify your wallet ownership with Wild 'n Out platform.\n\nNonce: ${nonce}\nUser ID: ${userId}\nTimestamp: ${new Date().toISOString()}`;
    
    return { message, nonce };
  }
  
  // Connect wallet with verification
  async connectWallet(
    userId: string,
    input: ConnectWalletInput
  ): Promise<WalletVerification> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Verify the signature
    const { publicKey, signature, message } = input;
    
    // Retrieve stored nonce for the user
    const storedNonce = await this.walletRepository.getNonce(userId);
    
    if (!storedNonce) {
      throw new ValidationError('Invalid or expired verification request');
    }
    
    // Check if nonce is in the message
    if (!message.includes(`Nonce: ${storedNonce}`)) {
      throw new ValidationError('Invalid verification message');
    }
    
    // Verify signature using Web3 service
    const isValid = await this.web3Service.verifySignature(
      message,
      signature,
      publicKey
    );
    
    if (!isValid) {
      throw new ValidationError('Invalid signature');
    }
    
    // Check if wallet is already connected to another user
    const existingWallet = await this.walletRepository.findByPublicKey(publicKey);
    
    if (existingWallet && existingWallet.userId !== userId) {
      throw new ValidationError('Wallet already connected to another account');
    }
    
    // Get token holdings
    const tokenHoldings = await this.web3Service.getTokenHoldings(publicKey);
    
    // Calculate holder tier based on token amount
    const holderTier = this.calculateHolderTier(tokenHoldings.amount);
    
    // Create or update wallet connection
    let wallet: Wallet;
    
    if (existingWallet) {
      // Update existing wallet
      wallet = await this.walletRepository.updateWallet(
        existingWallet.id,
        {
          provider: input.provider,
          tokenAmount: tokenHoldings.amount,
          holderTier,
          lastVerifiedAt: new Date(),
        }
      );
    } else {
      // Create new wallet connection
      wallet = await this.walletRepository.createWallet({
        userId,
        publicKey,
        provider: input.provider,
        tokenAmount: tokenHoldings.amount,
        holderTier,
        lastVerifiedAt: new Date(),
      });
    }
    
    // Clear the nonce
    await this.walletRepository.clearNonce(userId);
    
    // Get benefits based on holder tier
    const benefits = await this.walletRepository.getHolderBenefits(holderTier);
    
    return {
      wallet,
      tokenHoldings,
      holderTier,
      benefits,
    };
  }
  
  // Get wallet verification status
  async getWalletStatus(userId: string): Promise<WalletVerification | null> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Get user's wallet
    const wallet = await this.walletRepository.findByUserId(userId);
    
    if (!wallet) {
      return null;
    }
    
    // Check if verification is recent (within last 24 hours)
    const isVerificationRecent = wallet.lastVerifiedAt
      ? (new Date().getTime() - new Date(wallet.lastVerifiedAt).getTime()) < 24 * 60 * 60 * 1000
      : false;
    
    // If verification is recent, return cached data
    if (isVerificationRecent) {
      // Get benefits based on holder tier
      const benefits = await this.walletRepository.getHolderBenefits(wallet.holderTier);
      
      return {
        wallet,
        tokenHoldings: {
          amount: wallet.tokenAmount,
          lastUpdated: wallet.lastVerifiedAt,
        },
        holderTier: wallet.holderTier,
        benefits,
      };
    }
    
    // Otherwise, refresh token holdings
    try {
      const tokenHoldings = await this.web3Service.getTokenHoldings(wallet.publicKey);
      
      // Calculate holder tier based on token amount
      const holderTier = this.calculateHolderTier(tokenHoldings.amount);
      
      // Update wallet data
      const updatedWallet = await this.walletRepository.updateWallet(
        wallet.id,
        {
          tokenAmount: tokenHoldings.amount,
          holderTier,
          lastVerifiedAt: new Date(),
        }
      );
      
      // Get benefits based on holder tier
      const benefits = await this.walletRepository.getHolderBenefits(holderTier);
      
      return {
        wallet: updatedWallet,
        tokenHoldings,
        holderTier,
        benefits,
      };
    } catch (error) {
      // If update fails, return cached data with error flag
      const benefits = await this.walletRepository.getHolderBenefits(wallet.holderTier);
      
      return {
        wallet,
        tokenHoldings: {
          amount: wallet.tokenAmount,
          lastUpdated: wallet.lastVerifiedAt,
        },
        holderTier: wallet.holderTier,
        benefits,
        updateFailed: true,
      };
    }
  }
  
  // Disconnect wallet
  async disconnectWallet(userId: string): Promise<boolean> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Get user's wallet
    const wallet = await this.walletRepository.findByUserId(userId);
    
    if (!wallet) {
      throw new NotFoundError('No wallet connected for this user', 'wallet');
    }
    
    // Delete wallet connection
    return this.walletRepository.deleteWallet(wallet.id);
  }
  
  // Calculate holder tier based on token amount
  private calculateHolderTier(tokenAmount: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (tokenAmount >= 100000) {
      return 'platinum';
    } else if (tokenAmount >= 10000) {
      return 'gold';
    } else if (tokenAmount >= 1000) {
      return 'silver';
    } else {
      return 'bronze';
    }
  }
}
```

**API Implementation:**
```typescript
// src/api/wallet/generate-message.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { WalletService } from '../../services/wallet-service';

export async function generateMessage(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const walletService = new WalletService();
  
  try {
    const result = await walletService.generateVerificationMessage(
      request.userId
    );
    
    return reply.code(200).send({
      data: result,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to generate verification message');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/wallet/connect-wallet.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { WalletService } from '../../services/wallet-service';
import { ConnectWalletInput } from '../../models/wallet';

export async function connectWallet(
  request: FastifyRequest<{ Body: ConnectWalletInput }>,
  reply: FastifyReply
) {
  const walletService = new WalletService();
  
  try {
    const result = await walletService.connectWallet(
      request.userId,
      request.body
    );
    
    return reply.code(200).send({
      data: result,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to connect wallet');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Secure message signing for verification
- Wallet connection with Phantom
- Token holdings verification
- Holder tier calculation
- Benefit determination based on holdings

**Key Best Practices:**
- Use secure nonce-based verification
- Apply proper error handling
- Create typed interfaces for data
- Implement cached verification
- Design fallback mechanisms

**Key Potential Challenges:**
- Managing secure verification
- Handling blockchain connectivity issues
- Designing reliable tier calculation
- Creating efficient holding verification
- Supporting multiple wallet providers

### Sub-Task 8.2: Token Data Integration ⭐️ *PRIORITY*

**Goal:** Implement token data tracking and visualization features

**Key Service:**
```typescript
// src/services/token-service.ts
import { TokenRepository } from '../repositories/token-repository';
import { Web3Service } from '../services/web3-service';
import { TokenData, TokenPriceHistory, TokenMilestone } from '../models/token';
import { NotFoundError } from '../errors';
import { config } from '../config';

export class TokenService {
  private tokenRepository: TokenRepository;
  private web3Service: Web3Service;
  
  // Token contract address
  private tokenAddress: string = config.token.contractAddress;
  
  // Milestone definitions
  private MILESTONES: TokenMilestone[] = [
    { id: 'milestone1', name: '$10M Market Cap', targetValue: 10000000, achieved: false },
    { id: 'milestone2', name: '$50M Market Cap', targetValue: 50000000, achieved: false },
    { id: 'milestone3', name: '$100M Market Cap', targetValue: 100000000, achieved: false },
    { id: 'milestone4', name: '$200M Market Cap', targetValue: 200000000, achieved: false },
    { id: 'milestone5', name: '$500M Market Cap', targetValue: 500000000, achieved: false },
  ];
  
  constructor() {
    this.tokenRepository = new TokenRepository();
    this.web3Service = new Web3Service();
  }
  
  // Get current token data
  async getTokenData(): Promise<TokenData> {
    // Try to get from cache first
    const cachedData = await this.tokenRepository.getTokenData();
    
    // If cache is recent (within 5 minutes), return it
    if (
      cachedData && 
      cachedData.lastUpdated && 
      (new Date().getTime() - new Date(cachedData.lastUpdated).getTime()) < 5 * 60 * 1000
    ) {
      return cachedData;
    }
    
    try {
      // Get fresh data from blockchain
      const tokenData = await this.web3Service.getTokenData(this.tokenAddress);
      
      // Update milestones based on current market cap
      const milestones = this.MILESTONES.map(milestone => ({
        ...milestone,
        achieved: tokenData.marketCap >= milestone.targetValue,
      }));
      
      // Get current milestone progress
      const currentMilestone = milestones.find(m => !m.achieved) || milestones[milestones.length - 1];
      const previousMilestone = milestones.filter(m => m.achieved).pop();
      
      const startValue = previousMilestone ? previousMilestone.targetValue : 0;
      const progress = Math.min(
        (tokenData.marketCap - startValue) / (currentMilestone.targetValue - startValue),
        1
      ) * 100;
      
      // Combine data
      const enrichedData: TokenData = {
        ...tokenData,
        milestones,
        currentMilestone: currentMilestone.id,
        milestoneProgress: progress,
        lastUpdated: new Date(),
      };
      
      // Store in cache
      await this.tokenRepository.storeTokenData(enrichedData);
      
      return enrichedData;
      
    } catch (error) {
      // If fetch fails, return cached data if available
      if (cachedData) {
        return {
          ...cachedData,
          fetchFailed: true,
        };
      }
      
      // If no cached data, rethrow
      throw error;
    }
  }
  
  // Get token price history
  async getTokenPriceHistory(timespan: '1d' | '1w' | '1m' | 'all'): Promise<TokenPriceHistory> {
    // Try to get from cache first
    const cachedHistory = await this.tokenRepository.getTokenPriceHistory(timespan);
    
    // If cache is recent (within 30 minutes), return it
    if (
      cachedHistory && 
      cachedHistory.lastUpdated && 
      (new Date().getTime() - new Date(cachedHistory.lastUpdated).getTime()) < 30 * 60 * 1000
    ) {
      return cachedHistory;
    }
    
    try {
      // Get fresh data from price service
      const priceHistory = await this.web3Service.getTokenPriceHistory(
        this.tokenAddress,
        timespan
      );
      
      // Add last updated timestamp
      const enrichedHistory = {
        ...priceHistory,
        lastUpdated: new Date(),
      };
      
      // Store in cache
      await this.tokenRepository.storeTokenPriceHistory(timespan, enrichedHistory);
      
      return enrichedHistory;
      
    } catch (error) {
      // If fetch fails, return cached history if available
      if (cachedHistory) {
        return {
          ...cachedHistory,
          fetchFailed: true,
        };
      }
      
      // If no cached history, rethrow
      throw error;
    }
  }
  
  // Get recent transactions
  async getRecentTransactions(
    limit: number = 10
  ): Promise<any[]> {
    // Try to get from cache first
    const cachedTransactions = await this.tokenRepository.getRecentTransactions();
    
    // If cache is recent (within 5 minutes), return it
    if (
      cachedTransactions && 
      cachedTransactions.lastUpdated && 
      (new Date().getTime() - new Date(cachedTransactions.lastUpdated).getTime()) < 5 * 60 * 1000
    ) {
      return cachedTransactions.transactions.slice(0, limit);
    }
    
    try {
      // Get fresh data from blockchain
      const transactions = await this.web3Service.getRecentTransactions(
        this.tokenAddress,
        limit
      );
      
      // Store in cache
      await this.tokenRepository.storeRecentTransactions({
        transactions,
        lastUpdated: new Date(),
      });
      
      return transactions;
      
    } catch (error) {
      // If fetch fails, return cached transactions if available
      if (cachedTransactions) {
        return cachedTransactions.transactions.slice(0, limit);
      }
      
      // If no cached transactions, rethrow
      throw error;
    }
  }
}
```

**API Implementation:**
```typescript
// src/api/token/get-token-data.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenService } from '../../services/token-service';

export async function getTokenData(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tokenService = new TokenService();
  
  try {
    const data = await tokenService.getTokenData();
    
    return reply.code(200).send({
      data,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to get token data');
    
    // Let error handler middleware handle the error
    throw error;
  }
}

// src/api/token/get-price-history.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenService } from '../../services/token-service';

interface GetPriceHistoryRequest {
  Querystring: {
    timespan: '1d' | '1w' | '1m' | 'all';
  };
}

export async function getPriceHistory(
  request: FastifyRequest<GetPriceHistoryRequest>,
  reply: FastifyReply
) {
  const tokenService = new TokenService();
  
  try {
    const { timespan = '1d' } = request.query;
    
    const data = await tokenService.getTokenPriceHistory(timespan);
    
    return reply.code(200).send({
      data,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    request.log.error(error, 'Failed to get price history');
    
    // Let error handler middleware handle the error
    throw error;
  }
}
```

**Essential Requirements:**
- Real-time token price display
- Price history with different timespans
- Market cap tracking and milestone progress
- Transaction feed display
- Caching for performance and reliability

**Key Best Practices:**
- Implement proper caching strategies
- Create fallback mechanisms
- Design for data visualization
- Apply consistent error handling
- Use typed interfaces for data

**Key Potential Challenges:**
- Handling blockchain connectivity issues
- Creating reliable caching
- Designing effective visualizations
- Managing real-time updates
- Supporting high-traffic periods

### Sub-Task 8.3: Web3 Service Implementation ⭐️ *PRIORITY*

**Goal:** Implement the core blockchain interaction service

**Key Service:**
```typescript
// src/services/web3-service.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { CircuitBreaker } from '../lib/circuit-breaker';
import { logger } from '../lib/logger';
import { config } from '../config';
import * as nacl from 'tweetnacl';
import { TokenData, TokenPriceHistory } from '../models/token';

export class Web3Service {
  private connection: Connection;
  private circuitBreaker: CircuitBreaker;
  
  constructor() {
    // Create Solana connection
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    
    // Create circuit breaker for RPC calls
    this.circuitBreaker = new CircuitBreaker('solana-rpc', {
      failureThreshold: 3,
      resetTimeout: 10000, // 10 seconds
    });
  }
  
  // Get token data from blockchain
  async getTokenData(tokenAddress: string): Promise<TokenData> {
    try {
      // Use circuit breaker to protect against RPC failures
      return await this.circuitBreaker.execute(async () => {
        // In a real implementation, this would fetch on-chain data
        // For this example, we'll simulate the API call
        
        // Fetch token supply
        const publicKey = new PublicKey(tokenAddress);
        // const tokenSupply = await this.connection.getTokenSupply(publicKey);
        
        // Fetch token price from an oracle or price feed
        // const tokenPrice = await this.fetchTokenPrice(tokenAddress);
        
        // For demo, we'll use simulated data
        const tokenSupply = 1000000000; // 1 billion tokens
        const tokenPrice = 0.000092; // $0.000092 per token
        
        // Calculate market cap
        const marketCap = tokenSupply * tokenPrice;
        
        // Calculate 24h change (simulated)
        const change24h = 5.2; // 5.2% increase
        
        // Get holder count (simulated)
        const holderCount = 12500;
        
        return {
          price: tokenPrice,
          marketCap,
          supply: tokenSupply,
          change24h,
          holderCount,
          lastUpdated: new Date(),
        };
      });
    } catch (error) {
      logger.error({ err: error, tokenAddress }, 'Failed to fetch token data');
      throw new Error('Failed to fetch token data');
    }
  }
  
  // Get token price history
  async getTokenPriceHistory(
    tokenAddress: string,
    timespan: '1d' | '1w' | '1m' | 'all'
  ): Promise<TokenPriceHistory> {
    try {
      // Use circuit breaker to protect against API failures
      return await this.circuitBreaker.execute(async () => {
        // In a real implementation, this would fetch price history from an API
        // For this example, we'll simulate the API call
        
        // Generate simulated price data
        const now = new Date();
        const dataPoints: [number, number][] = []; // [timestamp, price]
        
        let numPoints;
        let startDate;
        
        switch (timespan) {
          case '1d':
            numPoints = 24; // Hourly for 1 day
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '1w':
            numPoints = 7 * 24; // Hourly for 1 week
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '1m':
            numPoints = 30; // Daily for 1 month
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'all':
            numPoints = 90; // Daily for all time (simulated as 90 days)
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        }
        
        // Generate price points with some randomness
        // Start with current price
        let price = 0.000092;
        
        for (let i = 0; i < numPoints; i++) {
          // Calculate timestamp for this data point
          const timestamp = new Date(
            startDate.getTime() + (i / numPoints) * (now.getTime() - startDate.getTime())
          ).getTime();
          
          // Add some randomness to price (simulated)
          const changePercent = (Math.random() - 0.5) * 0.05; // -2.5% to +2.5%
          price = price * (1 + changePercent);
          
          // Add data point
          dataPoints.push([timestamp, price]);
        }
        
        // Add current price as last point
        dataPoints.push([now.getTime(), 0.000092]);
        
        return {
          timespan,
          data: dataPoints,
          lastUpdated: now,
        };
      });
    } catch (error) {
      logger.error({ err: error, tokenAddress, timespan }, 'Failed to fetch price history');
      throw new Error('Failed to fetch price history');
    }
  }
  
  // Get token holdings for a wallet
  async getTokenHoldings(walletAddress: string): Promise<{ amount: number, lastUpdated: Date }> {
    try {
      // Use circuit breaker to protect against RPC failures
      return await this.circuitBreaker.execute(async () => {
        // In a real implementation, this would fetch token balance from blockchain
        // For this example, we'll simulate the API call
        
        // Convert wallet address to PublicKey
        const publicKey = new PublicKey(walletAddress);
        
        // For demo, we'll use simulated data based on wallet address
        // This helps ensure consistent values for testing
        const hashValue = publicKey.toBase58().split('').reduce((acc, char) => {
          return acc + char.charCodeAt(0);
        }, 0);
        
        // Use hash value to generate consistent token amount
        const tokenAmount = 500 + (hashValue % 100000);
        
        return {
          amount: tokenAmount,
          lastUpdated: new Date(),
        };
      });
    } catch (error) {
      logger.error({ err: error, walletAddress }, 'Failed to fetch token holdings');
      throw new Error('Failed to fetch token holdings');
    }
  }
  
  // Get recent transactions
  async getRecentTransactions(
    tokenAddress: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      // Use circuit breaker to protect against RPC failures
      return await this.circuitBreaker.execute(async () => {
        // In a real implementation, this would fetch transaction history
        // For this example, we'll simulate the API call
        
        // Generate simulated transaction data
        const now = new Date();
        const transactions = [];
        
        for (let i = 0; i < limit; i++) {
          // Generate transaction timestamp (random within last 24 hours)
          const timestamp = new Date(
            now.getTime() - Math.random() * 24 * 60 * 60 * 1000
          );
          
          // Generate transaction type (buy/sell)
          const type = Math.random() > 0.5 ? 'buy' : 'sell';
          
          // Generate amount (random between 100 and 10000)
          const amount = Math.floor(100 + Math.random() * 9900);
          
          // Generate transaction hash
          const hash = `tx${Math.random().toString(36).substring(2, 10)}`;
          
          // Generate sender/receiver
          const sender = `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`;
          const receiver = `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`;
          
          transactions.push({
            hash,
            type,
            amount,
            timestamp,
            sender,
            receiver,
          });
        }
        
        // Sort by timestamp (newest first)
        transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        return transactions;
      });
    } catch (error) {
      logger.error({ err: error, tokenAddress }, 'Failed to fetch recent transactions');
      throw new Error('Failed to fetch recent transactions');
    }
  }
  
  // Verify signature for wallet connection
  async verifySignature(
    message: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Convert signature from hex to Uint8Array
      const signatureBytes = Buffer.from(signature, 'hex');
      
      // Convert public key from string to PublicKey and then to bytes
      const publicKeyBytes = new PublicKey(publicKey).toBytes();
      
      // Convert message to bytes
      const messageBytes = Buffer.from(message);
      
      // Verify signature
      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );
    } catch (error) {
      logger.error({ err: error, publicKey }, 'Failed to verify signature');
      return false;
    }
  }
}
```

**Essential Requirements:**
- Solana blockchain integration
- Token data retrieval
- Token balance checking
- Transaction history fetching
- Signature verification

**Key Best Practices:**
- Implement circuit breaker pattern
- Apply proper error handling
- Create connection pooling
- Use typed interfaces for data
- Design fallback mechanisms

**Key Potential Challenges:**
- Handling RPC failures gracefully
- Managing blockchain rate limits
- Creating reliable signature verification
- Optimizing blockchain queries
- Supporting high-traffic periods

## Testing Strategy
- Wallet connection and verification testing
- Token data retrieval validation
- Web3 service functionality testing
- Caching and fallback mechanism testing
- Error handling verification

## Definition of Done
- [ ] Wallet integration implemented
- [ ] Token data tracking operational
- [ ] Web3 service implemented
- [ ] Caching mechanisms in place
- [ ] Error handling and fallbacks working
- [ ] Documentation for token features created
- [ ] Tests for token and blockchain features passing

---

# Task 9: Real-time Communication System

## Task Overview
- **Purpose:** Implement real-time communication features across the platform
- **Value:** Enhances user experience with live updates and interactive features
- **Dependencies:** Requires Database Schema, API Foundation, Redis setup

## Required Knowledge
- **Key Documents:** `backend.md`, `prd.md`
- **Architecture Guidelines:** WebSocket Integration, Asynchronous Processing
- **Phase 1 Dependencies:** Database Schema, API Foundation, Redis setup

## Implementation Sub-Tasks

### Sub-Task 9.1: WebSocket Server ⭐️ *PRIORITY*

**Goal:** Implement a robust WebSocket server for real-time communication

**Key Implementation:**
```typescript
// src/websockets/server.ts
import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { authenticate } from '../middleware/auth';
import { handleConnectionOpen } from './handlers/connection';
import { handleBattleEvents } from './handlers/battle';
import { handleNotificationEvents } from './handlers/notification';
import { handleChatEvents } from './handlers/chat';
import { logger } from '../lib/logger';

export async function setupWebSocketServer(fastify: FastifyInstance) {
  // Register WebSocket plugin
  await fastify.register(websocket, {
    options: { 
      maxPayload: 1048576, // 1MB
      pingInterval: 30000, // 30 seconds
    }
  });
  
  // WebSocket route
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    logger.info({ connectionId: req.id }, 'WebSocket connection established');
    
    // Set up connection state
    const connectionState = {
      id: req.id,
      userId: null,
      subscriptions: new Set<string>(),
      isAuthenticated: false,
    };
    
    // Handle connection open
    handleConnectionOpen(connection, connectionState);
    
    // Set up message handler
    connection.socket.on('message', async (message) => {
      try {
        // Parse message
        const data = JSON.parse(message.toString());
        
        // Handle messages based on type
        switch (data.type) {
          case 'authenticate':
            await handleAuthenticate(connection, connectionState, data);
            break;
            
          case 'subscribe':
            await handleSubscribe(connection, connectionState, data);
            break;
            
          case 'unsubscribe':
            await handleUnsubscribe(connection, connectionState, data);
            break;
            
          case 'battle':
            await handleBattleEvents(connection, connectionState, data);
            break;
            
          case 'chat':
            await handleChatEvents(connection, connectionState, data);
            break;
            
          default:
            // Unknown message type
            connection.socket.send(JSON.stringify({
              type: 'error',
              error: 'Unknown message type',
              requestId: data.requestId,
            }));
        }
      } catch (error) {
        logger.error({ err: error, connectionId: req.id }, 'Error handling WebSocket message');
        
        // Send error response
        connection.socket.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
        }));
      }
    });
    
    // Handle connection close
    connection.socket.on('close', () => {
      logger.info({ connectionId: req.id }, 'WebSocket connection closed');
      
      // Clean up subscriptions
      handleCleanup(connectionState);
    });
  });
}

// Handle authentication
async function handleAuthenticate(connection, connectionState, data) {
  try {
    // Validate token
    const { token } = data;
    
    // Use auth service to verify token
    const authResult = await verifyToken(token);
    
    if (authResult.valid) {
      // Set authenticated state
      connectionState.userId = authResult.userId;
      connectionState.isAuthenticated = true;
      
      // Send success response
      connection.socket.send(JSON.stringify({
        type: 'auth_success',
        userId: authResult.userId,
        requestId: data.requestId,
      }));
      
      // Set up user-specific subscriptions
      await setupUserSubscriptions(connection, connectionState);
    } else {
      // Send error response
      connection.socket.send(JSON.stringify({
        type: 'auth_error',
        error: 'Invalid authentication',
        requestId: data.requestId,
      }));
    }
  } catch (error) {
    logger.error({ err: error, connectionId: connectionState.id }, 'Authentication error');
    
    // Send error response
    connection.socket.send(JSON.stringify({
      type: 'auth_error',
      error: 'Authentication failed',
      requestId: data.requestId,
    }));
  }
}

// Handle subscription
async function handleSubscribe(connection, connectionState, data) {
  try {
    const { channel } = data;
    
    // Check if channel requires authentication
    if (isAuthRequiredForChannel(channel) && !connectionState.isAuthenticated) {
      connection.socket.send(JSON.stringify({
        type: 'subscribe_error',
        error: 'Authentication required for this channel',
        channel,
        requestId: data.requestId,
      }));
      return;
    }
    
    // Subscribe to channel
    await subscribeToChannel(connection, connectionState, channel);
    
    // Send success response
    connection.socket.send(JSON.stringify({
      type: 'subscribe_success',
      channel,
      requestId: data.requestId,
    }));
  } catch (error) {
    logger.error({ err: error, connectionId: connectionState.id, channel: data.channel }, 'Subscription error');
    
    // Send error response
    connection.socket.send(JSON.stringify({
      type: 'subscribe_error',
      error: 'Subscription failed',
      channel: data.channel,
      requestId: data.requestId,
    }));
  }
}

// Handle unsubscribe
async function handleUnsubscribe(connection, connectionState, data) {
  try {
    const { channel } = data;
    
    // Unsubscribe from channel
    await unsubscribeFromChannel(connection, connectionState, channel);
    
    // Send success response
    connection.socket.send(JSON.stringify({
      type: 'unsubscribe_success',
      channel,
      requestId: data.requestId,
    }));
  } catch (error) {
    logger.error({ err: error, connectionId: connectionState.id, channel: data.channel }, 'Unsubscription error');
    
    // Send error response
    connection.socket.send(JSON.stringify({
      type: 'unsubscribe_error',
      error: 'Unsubscription failed',
      channel: data.channel,
      requestId: data.requestId,
    }));
  }
}

// Clean up when connection closes
function handleCleanup(connectionState) {
  // Unsubscribe from all channels
  connectionState.subscriptions.forEach(channel => {
    unsubscribeFromChannel(null, connectionState, channel)
      .catch(error => {
        logger.error({ err: error, connectionId: connectionState.id, channel }, 'Cleanup error');
      });
  });
  
  // Clear subscriptions
  connectionState.subscriptions.clear();
}

// Verify token
async function verifyToken(token) {
  // In a real implementation, this would verify the JWT token
  // For this example, we'll simulate the verification
  
  if (!token) {
    return { valid: false };
  }
  
  try {
    // Here you would verify the token using your auth service
    // For example:
    // const result = await fastify.jwt.verify(token);
    
    // For demo, we'll simulate a successful verification
    const userId = 'user_' + Math.random().toString(36).substring(2, 10);
    
    return {
      valid: true,
      userId,
    };
  } catch (error) {
    return { valid: false };
  }
}

// Set up user-specific subscriptions
async function setupUserSubscriptions(connection, connectionState) {
  // Subscribe to user-specific notification channel
  await subscribeToChannel(
    connection,
    connectionState,
    `user:${connectionState.userId}:notifications`
  );
  
  // Subscribe to global updates channel
  await subscribeToChannel(
    connection,
    connectionState,
    'global:updates'
  );
}

// Subscribe to channel
async function subscribeToChannel(connection, connectionState, channel) {
  // Add channel to user's subscriptions
  connectionState.subscriptions.add(channel);
  
  // Register subscription in Redis
  // In a real implementation, you would register this subscription
  // For example:
  // await redis.sadd(`channel:${channel}:subscribers`, connectionState.id);
}

// Unsubscribe from channel
async function unsubscribeFromChannel(connection, connectionState, channel) {
  // Remove channel from user's subscriptions
  connectionState.subscriptions.delete(channel);
  
  // Unregister subscription in Redis
  // In a real implementation, you would unregister this subscription
  // For example:
  // await redis.srem(`channel:${channel}:subscribers`, connectionState.id);
}

// Check if channel requires authentication
function isAuthRequiredForChannel(channel) {
  // Channels that require authentication
  if (channel.startsWith('user:') || 
      channel.startsWith('battle:') ||
      channel.startsWith('chat:')) {
    return true;
  }
  
  // Public channels
  return false;
}
```

**Essential Requirements:**
- WebSocket server with connection handling
- Authentication integration
- Channel subscription system
- Message parsing and routing
- Error handling

**Key Best Practices:**
- Implement proper authentication
- Create structured message format
- Apply connection state management
- Design efficient subscription handling
- Handle connection lifecycle properly

**Key Potential Challenges:**
- Scaling WebSocket connections
- Managing authentication securely
- Handling connection failures
- Implementing efficient message routing
- Creating reliable subscription system

### Sub-Task 9.2: Notification System ⭐️ *PRIORITY*

**Goal:** Implement a real-time notification system

**Key Service:**
```typescript
// src/services/notification-service.ts
import { Redis } from 'ioredis';
import { NotificationRepository } from '../repositories/notification-repository';
import { UserRepository } from '../repositories/user-repository';
import { Notification, NotificationType, CreateNotificationInput } from '../models/notification';
import { NotFoundError } from '../errors';
import { config } from '../config';
import { logger } from '../lib/logger';

export class NotificationService {
  private notificationRepository: NotificationRepository;
  private userRepository: UserRepository;
  private redis: Redis;
  
  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
    this.redis = new Redis(config.redis.url);
  }
  
  // Create a notification
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    // Check if user exists
    const user = await this.userRepository.findById(input.userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Create notification
    const notification = await this.notificationRepository.createNotification({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
      read: false,
    });
    
    // Publish notification to Redis for real-time delivery
    await this.publishNotification(notification);
    
    return notification;
  }
  
  // Publish notification to Redis
  private async publishNotification(notification: Notification): Promise<void> {
    try {
      // Create channel name
      const channel = `user:${notification.userId}:notifications`;
      
      // Publish notification
      await this.redis.publish(
        channel,
        JSON.stringify({
          type: 'notification',
          data: notification,
        })
      );
      
      logger.info(
        { notificationId: notification.id, userId: notification.userId, type: notification.type },
        'Notification published'
      );
    } catch (error) {
      logger.error(
        { err: error, notificationId: notification.id, userId: notification.userId },
        'Failed to publish notification'
      );
      
      // Don't throw - publishing is non-critical
      // Notification is still stored in database
    }
  }
  
  // Get user notifications
  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: Notification[], total: number }> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'user');
    }
    
    // Get notifications
    const notifications = await this.notificationRepository.getUserNotifications(
      userId,
      options
    );
    
    const total = await this.notificationRepository.countUserNotifications(
      userId,
      options
    );
    
    return {
      notifications,
      total,
    };
  }
  
  // Mark notification as read
  async markNotificationRead(
    userId: string,
    notificationId: string
  ): Promise<Notification> {
    // Get notification
    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundError('Notification not found', 'notification');
      
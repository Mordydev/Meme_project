# Wild 'n Out Meme Coin Platform: Phase 3 Backend Implementation

## Project Context
This implementation is part of a comprehensive five-phase development process:
1. **Phase 1:** Project Structure, Environment & Dependencies Setup ✓ *Completed*
2. **Phase 2:** Complete Frontend Implementation ✓ *Completed*
3. **Phase 3:** Complete Backend Implementation ← *Current Phase*
4. **Phase 4:** Integration, Review, and Polish
5. **Phase 5:** Deployment and Production Readiness

## Primary Objective
Implement a high-performance, secure backend that supports all frontend features while ensuring reliability, scalability, and real-time capability to achieve platform market cap progression ($10M → $50M → $100M → $500M+).

## Table of Contents
- [Task 1: Core Infrastructure & Architecture](#task-1-core-infrastructure--architecture)
- [Task 2: Authentication & User Management](#task-2-authentication--user-management)
- [Task 3: Battle System Backend](#task-3-battle-system-backend)
- [Task 4: Content Management System](#task-4-content-management-system)
- [Task 5: Community & Social Features](#task-5-community--social-features)
- [Task 6: Blockchain Integration](#task-6-blockchain-integration)
- [Task 7: Real-time Communication System](#task-7-real-time-communication-system)
- [Task 8: Achievement & Gamification Engine](#task-8-achievement--gamification-engine)
- [Task 9: Security Implementation](#task-9-security-implementation)
- [Task 10: Performance Optimization](#task-10-performance-optimization)

---

# Task 1: Core Infrastructure & Architecture

## Task Overview
- **Purpose:** Establish the foundational backend infrastructure and architecture patterns
- **Value:** Creates a scalable, maintainable foundation that supports all platform features and future growth
- **Dependencies:** None (foundational task)

## Required Knowledge
- **Key Documents:** `backend.md`, `mastersummary.md`
- **Technical Guidelines:** Reliability, Performance, and Scalability requirements
- **Phase 2 Dependencies:** Frontend API requirements

## Implementation Sub-Tasks

### Sub-Task 1.1: Application Bootstrapping ⭐️ *PRIORITY*

**Goal:** Create the core application entry point and configuration system

**Key Implementation:**
```typescript
// src/index.ts - Application entry point
import { buildServer } from './server';
import { logger } from './lib/logger';
import { loadConfig } from './config';

async function bootstrap() {
  const config = await loadConfig();
  const server = await buildServer(config);
  
  await server.listen({ port: config.port, host: config.host });
  logger.info(`Server started on http://${config.host}:${config.port}`);
}

bootstrap().catch(err => {
  logger.error(err, 'Server failed to start');
  process.exit(1);
});
```

**Essential Requirements:**
- Graceful startup and shutdown
- Environment-based configuration
- Proper error handling and logging
- Health check endpoints

**Key Best Practices:**
- Use typed configuration
- Implement structured logging
- Design for containerization
- Support different environments

**Key Potential Challenges:**
- Configuration management across environments
- Startup dependency ordering
- Proper error handling during initialization
- Clean shutdown under load

### Sub-Task 1.2: Fastify Server Setup ⭐️ *PRIORITY*

**Goal:** Configure Fastify with all necessary plugins and middleware

**Key Implementation:**
```typescript
// src/server.ts - Server configuration
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/error-handler';

export async function buildServer(config): Promise<FastifyInstance> {
  const server = Fastify({
    logger: config.logger,
    trustProxy: true
  });
  
  // Register plugins
  await server.register(cors, config.cors);
  await server.register(helmet);
  
  // Register routes
  await registerRoutes(server);
  
  // Set error handler
  server.setErrorHandler(errorHandler);
  
  return server;
}
```

**Essential Requirements:**
- Security middleware configuration (CORS, Helmet)
- Structured plugin registration
- Global error handling
- Request validation with schemas

**Key Best Practices:**
- Modular plugin registration
- Environment-specific configurations
- Consistent error response format
- Request/response logging

**Key Potential Challenges:**
- Plugin order dependencies
- Security configuration balance
- Cross-origin resource sharing (CORS) configuration
- Performance impact of middleware

### Sub-Task 1.3: Database Infrastructure ⭐️ *PRIORITY*

**Goal:** Set up database connection and migration system

**Key Implementation:**
```typescript
// src/lib/database.ts - Database client setup
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

export async function initializeDatabase(config) {
  // PostgreSQL pool for direct queries
  const pool = new Pool(config.database);
  
  // Supabase client for higher-level operations
  const supabase = createClient(
    config.supabase.url, 
    config.supabase.key
  );
  
  // Verify connection
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connection successful');
  } catch (err) {
    logger.error(err, 'Database connection failed');
    throw err;
  }
  
  return { pool, supabase };
}
```

**Essential Requirements:**
- Database connection pooling
- Migration system for schema management
- Initial schema definition
- Transaction support

**Key Best Practices:**
- Use connection pooling
- Implement database migrations
- Design for horizontal scaling
- Create repository pattern abstraction

**Key Potential Challenges:**
- Managing migration complexity
- Connection handling under load
- Optimizing database configuration
- Supporting both direct queries and Supabase

### Sub-Task 1.4: API Structure & Routes ⭐️ *PRIORITY*

**Goal:** Define the core API structure and route registration pattern

**Key Implementation:**
```typescript
// src/routes/index.ts - Route registration
import { FastifyInstance } from 'fastify';
import { userRoutes } from './users';
import { battleRoutes } from './battles';
import { contentRoutes } from './content';
import { authRoutes } from './auth';

export async function registerRoutes(server: FastifyInstance) {
  // Register route modules
  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(userRoutes, { prefix: '/api/users' });
  server.register(battleRoutes, { prefix: '/api/battles' });
  server.register(contentRoutes, { prefix: '/api/content' });
  
  // Health check route
  server.get('/health', async () => ({ status: 'ok' }));
}
```

**Essential Requirements:**
- Consistent API route structure
- Versioning strategy
- Route validation schemas
- API documentation generation

**Key Best Practices:**
- Group routes by domain
- Implement consistent naming
- Use schema validation for all endpoints
- Document API with OpenAPI/Swagger

**Key Potential Challenges:**
- Maintaining API consistency across domains
- Balancing flexibility with standardization
- Managing breaking changes
- Handling route dependencies

## Testing Strategy
- Unit tests for core infrastructure
- Integration tests for database connection
- API health check validation
- Configuration validation tests

## Definition of Done
- [ ] Application bootstrap process implemented
- [ ] Fastify server configured with all necessary plugins
- [ ] Database connection and migration system working
- [ ] API structure and route registration pattern established
- [ ] Health check endpoints implemented and tested
- [ ] Error handling and logging configured
- [ ] Configuration management working across environments
- [ ] Basic security measures implemented
- [ ] All infrastructure tests passing

---

# Task 2: Authentication & User Management

## Task Overview
- **Purpose:** Implement user authentication, authorization, and profile management
- **Value:** Secures the platform and provides the foundation for user identity and permissions
- **Dependencies:** Core Infrastructure (Task 1)

## Required Knowledge
- **Key Documents:** `backend.md`, `setup-clerk-next.md`, `add-feature-clerk-next.md`
- **Technical Guidelines:** Security requirements, authentication integration
- **Phase 2 Dependencies:** Frontend authentication components

## Implementation Sub-Tasks

### Sub-Task 2.1: Clerk Integration ⭐️ *PRIORITY*

**Goal:** Implement server-side Clerk authentication

**Key Implementation:**
```typescript
// src/lib/auth.ts - Clerk authentication utilities
import { clerkClient } from '@clerk/fastify';
import { logger } from './logger';

export async function verifySession(sessionId: string) {
  try {
    const session = await clerkClient.sessions.getSession(sessionId);
    if (!session || !session.userId) {
      return null;
    }
    return session;
  } catch (error) {
    logger.error(error, 'Failed to verify session');
    return null;
  }
}

export async function getUserData(userId: string) {
  try {
    return await clerkClient.users.getUser(userId);
  } catch (error) {
    logger.error(error, 'Failed to get user data');
    throw error;
  }
}
```

**Essential Requirements:**
- JWT verification middleware
- User session management
- Authentication error handling
- Clear auth-related logging

**Key Best Practices:**
- Separate auth logic from routes
- Implement proper error handling
- Use typed interfaces for users
- Apply consistent auth patterns

**Key Potential Challenges:**
- Token validation security
- Session management at scale
- Auth provider API reliability
- Handling expired/revoked tokens

### Sub-Task 2.2: Authorization Middleware ⭐️ *PRIORITY*

**Goal:** Create middleware for route protection and permission checking

**Key Implementation:**
```typescript
// src/middleware/auth.ts - Authentication middleware
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifySession } from '../lib/auth';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const sessionId = request.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return reply.code(401).send({
      error: {
        code: 'unauthorized',
        message: 'Authentication required'
      }
    });
  }
  
  const session = await verifySession(sessionId);
  if (!session) {
    return reply.code(401).send({
      error: {
        code: 'unauthorized',
        message: 'Invalid authentication'
      }
    });
  }
  
  request.userId = session.userId;
}
```

**Essential Requirements:**
- Role-based access control
- Resource ownership verification
- Granular permission checks
- Authorization error handling

**Key Best Practices:**
- Implement declarative permissions
- Use consistent auth error responses
- Create reusable authorization helpers
- Apply principle of least privilege

**Key Potential Challenges:**
- Complex permission combinations
- Performance impact of auth checks
- Maintaining authorization rules
- Testing different permission scenarios

### Sub-Task 2.3: User Profile Management ⭐️ *PRIORITY*

**Goal:** Implement user profile data storage and management

**Key Implementation:**
```typescript
// src/services/user-service.ts - User profile management
import { db } from '../lib/database';

export async function createUserProfile(userId: string, profileData: any) {
  return await db.profile.create({
    data: {
      userId,
      displayName: profileData.displayName || 'New User',
      avatarUrl: profileData.avatarUrl,
      bio: profileData.bio || '',
      createdAt: new Date()
    }
  });
}

export async function getUserProfile(userId: string) {
  return await db.profile.findUnique({
    where: { userId },
    include: {
      achievements: true,
      stats: true
    }
  });
}
```

**Essential Requirements:**
- Profile data model and schema
- Profile creation and update flows
- User preferences storage
- Profile validation rules

**Key Best Practices:**
- Separate user identity from profile
- Implement transaction-based updates
- Create validation middleware
- Use database constraints

**Key Potential Challenges:**
- Synchronizing with auth provider
- Managing profile completeness
- Handling profile data privacy
- Scaling profile data efficiently

### Sub-Task 2.4: Webhook Handler ⭐️ *PRIORITY*

**Goal:** Implement webhook handlers for authentication events

**Key Implementation:**
```typescript
// src/routes/webhooks/clerk.ts - Clerk webhook handler
import { FastifyInstance } from 'fastify';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUserProfile } from '../../services/user-service';

export async function clerkWebhooks(fastify: FastifyInstance) {
  fastify.post('/clerk', async (request, reply) => {
    const svixId = request.headers['svix-id'] as string;
    const svixTimestamp = request.headers['svix-timestamp'] as string;
    const svixSignature = request.headers['svix-signature'] as string;
    
    if (!svixId || !svixTimestamp || !svixSignature) {
      return reply.code(400).send({ error: 'Missing svix headers' });
    }
    
    const payload = request.body as string;
    const wh = new Webhook(process.env.WEBHOOK_SECRET);
    
    let evt: WebhookEvent;
    try {
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature
      }) as WebhookEvent;
    } catch (err) {
      return reply.code(400).send({ error: 'Invalid webhook' });
    }
    
    // Handle webhook events
    const { type, data } = evt;
    
    switch (type) {
      case 'user.created':
        await createUserProfile(data.id, {
          displayName: `${data.first_name} ${data.last_name}`.trim(),
          avatarUrl: data.image_url
        });
        break;
      case 'user.updated':
        // Handle user update
        break;
      case 'user.deleted':
        // Handle user deletion
        break;
    }
    
    return { success: true };
  });
}
```

**Essential Requirements:**
- Webhook signature verification
- Event type handling (user creation, updates)
- Error handling and logging
- Sync with internal user state

**Key Best Practices:**
- Verify webhook signatures
- Implement idempotent event handling
- Use typed event data
- Log all webhook activity

**Key Potential Challenges:**
- Ensuring webhook security
- Handling duplicate events
- Managing webhook downtime
- Synchronizing with database

## Testing Strategy
- Authentication integration tests
- Authorization rule validation
- Profile data CRUD tests
- Webhook handler tests with mocked payloads

## Definition of Done
- [ ] Clerk authentication integrated
- [ ] Authorization middleware implemented
- [ ] User profile management working
- [ ] Webhook handlers implemented and tested
- [ ] Role-based access control system working
- [ ] Profile validation rules implemented
- [ ] Auth error handling tested
- [ ] All authentication tests passing

---

# Task 3: Battle System Backend

## Task Overview
- **Purpose:** Implement the backend for the core Battle Arena feature
- **Value:** Supports the primary engagement mechanic that drives user activity and content creation
- **Dependencies:** Core Infrastructure (Task 1), Authentication (Task 2)

## Required Knowledge
- **Key Documents:** `backend.md`, `prd.md` (Battle Arena section)
- **Technical Guidelines:** Data model requirements, real-time features
- **Phase 2 Dependencies:** Frontend Battle Arena components

## Implementation Sub-Tasks

### Sub-Task 3.1: Battle Data Model ⭐️ *PRIORITY*

**Goal:** Implement the data model for battles and related entities

**Key Implementation:**
```typescript
// src/models/battle.ts - Battle data models
export interface Battle {
  id: string;
  title: string;
  description: string;
  battleType: 'wildStyle' | 'pickUpKillIt' | 'rAndBeef' | 'tournament';
  rules: BattleRules;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  creatorId: string;
  startTime: Date;
  endTime: Date;
  votingStartTime: Date;
  votingEndTime: Date;
  participantCount: number;
  entryCount: number;
  voteCount: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BattleEntry {
  id: string;
  battleId: string;
  userId: string;
  content: {
    type: 'text' | 'image' | 'audio' | 'video' | 'mixed';
    body?: string;
    mediaUrl?: string;
    additionalMedia?: string[];
  };
  moderation: {
    status: 'pending' | 'approved' | 'rejected';
    reviewerId?: string;
    reviewedAt?: Date;
    reason?: string;
  };
  metrics: {
    viewCount: number;
    voteCount: number;
    commentCount: number;
    shareCount: number;
  };
  rank?: number;
  submissionTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Essential Requirements:**
- Battle entity model with all necessary fields
- Entry submission data model
- Voting and results data structures
- Relationships between models

**Key Best Practices:**
- Use strict TypeScript interfaces
- Design for efficient querying
- Implement proper date handling
- Create clear entity relationships

**Key Potential Challenges:**
- Modeling complex battle rules
- Handling different content types
- Efficient vote storage design
- Managing state transitions

### Sub-Task 3.2: Battle CRUD Operations ⭐️ *PRIORITY*

**Goal:** Implement core battle management functionality

**Key Implementation:**
```typescript
// src/repositories/battle-repository.ts
import { db } from '../lib/database';
import { Battle, CreateBattleInput } from '../models/battle';

export class BattleRepository {
  async findById(id: string): Promise<Battle | null> {
    return db.battle.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } }
      }
    });
  }
  
  async create(data: CreateBattleInput): Promise<Battle> {
    return db.battle.create({
      data: {
        ...data,
        status: 'upcoming',
        participantCount: 0,
        entryCount: 0,
        voteCount: 0
      }
    });
  }
  
  async update(id: string, data: Partial<Battle>): Promise<Battle> {
    return db.battle.update({
      where: { id },
      data
    });
  }
  
  async findActive(limit = 20, cursor?: string): Promise<Battle[]> {
    return db.battle.findMany({
      where: { status: 'active' },
      orderBy: { endTime: 'asc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });
  }
}
```

**Essential Requirements:**
- Battle creation with validation
- Battle listing with filtering
- Battle detail retrieval
- Battle update and status management

**Key Best Practices:**
- Use repository pattern for data access
- Implement pagination for listings
- Apply consistent error handling
- Validate inputs thoroughly

**Key Potential Challenges:**
- Complex query optimization
- Managing transaction boundaries
- Implementing efficient pagination
- Handling concurrent updates

### Sub-Task 3.3: Entry Submission System ⭐️ *PRIORITY*

**Goal:** Implement the entry submission and validation system

**Key Implementation:**
```typescript
// src/services/entry-service.ts
import { BattleRepository } from '../repositories/battle-repository';
import { EntryRepository } from '../repositories/entry-repository';
import { validateEntryContent } from '../validators/entry-validator';
import { BattleNotFoundError, ValidationError } from '../errors';

export class EntryService {
  constructor(
    private battleRepo: BattleRepository,
    private entryRepo: EntryRepository
  ) {}
  
  async submitEntry(userId: string, battleId: string, content: any) {
    // Get battle to check status and rules
    const battle = await this.battleRepo.findById(battleId);
    if (!battle) {
      throw new BattleNotFoundError(battleId);
    }
    
    // Validate battle is open for submission
    if (battle.status !== 'active') {
      throw new ValidationError('Battle is not active for submissions');
    }
    
    // Validate content against battle rules
    const validationResult = validateEntryContent(content, battle.rules);
    if (!validationResult.valid) {
      throw new ValidationError(
        'Entry content validation failed',
        validationResult.errors
      );
    }
    
    // Create entry
    return this.entryRepo.create({
      battleId,
      userId,
      content,
      moderation: { status: 'pending' },
      metrics: { viewCount: 0, voteCount: 0, commentCount: 0, shareCount: 0 },
      submissionTime: new Date()
    });
  }
}
```

**Essential Requirements:**
- Content validation against battle rules
- Media file handling and storage
- Draft saving functionality
- Submission status tracking

**Key Best Practices:**
- Implement thorough validation
- Create clear validation error messages
- Design secure media handling
- Use transaction for submission

**Key Potential Challenges:**
- Complex rule validation
- Media file processing
- Handling large submission volumes
- Preventing duplicate submissions

### Sub-Task 3.4: Voting and Results System ⭐️ *PRIORITY*

**Goal:** Implement the voting mechanics and results calculation system

**Key Implementation:**
```typescript
// src/services/voting-service.ts
import { VoteRepository } from '../repositories/vote-repository';
import { EntryRepository } from '../repositories/entry-repository';
import { BattleRepository } from '../repositories/battle-repository';
import { AlreadyVotedError, BattleNotFoundError } from '../errors';

export class VotingService {
  constructor(
    private voteRepo: VoteRepository,
    private entryRepo: EntryRepository,
    private battleRepo: BattleRepository
  ) {}
  
  async castVote(userId: string, battleId: string, entryId: string) {
    // Verify battle is in voting phase
    const battle = await this.battleRepo.findById(battleId);
    if (!battle || battle.status !== 'voting') {
      throw new BattleNotFoundError(battleId);
    }
    
    // Check if user already voted for this entry
    const existingVote = await this.voteRepo.findUserVoteForEntry(
      userId,
      entryId
    );
    
    if (existingVote) {
      throw new AlreadyVotedError();
    }
    
    // Record vote
    const vote = await this.voteRepo.create({
      battleId,
      entryId,
      userId,
      timestamp: new Date()
    });
    
    // Update entry vote count
    await this.entryRepo.incrementVotes(entryId);
    
    return vote;
  }
  
  async calculateResults(battleId: string) {
    // Implementation of result calculation algorithm
    // Including ranking, ties handling, etc.
  }
}
```

**Essential Requirements:**
- Vote submission and validation
- Vote counting and storage
- Results calculation algorithm
- Tiebreaker mechanism

**Key Best Practices:**
- Prevent duplicate voting
- Implement transaction-based vote counting
- Design fair ranking algorithm
- Create audit trail for votes

**Key Potential Challenges:**
- Handling high vote volume
- Designing fair voting mechanics
- Implementing efficient results calculation
- Preventing voting manipulation

### Sub-Task 3.5: Battle State Management ⭐️ *PRIORITY*

**Goal:** Implement battle lifecycle and state transition system

**Key Implementation:**
```typescript
// src/jobs/battle-state-manager.ts
import { BattleRepository } from '../repositories/battle-repository';
import { logger } from '../lib/logger';
import { EventEmitter } from '../lib/events';

export class BattleStateManager {
  constructor(private battleRepo: BattleRepository) {}
  
  async processBattleStates() {
    const now = new Date();
    
    // Process battles that should become active
    const startingBattles = await this.battleRepo.findBattlesByState(
      'upcoming',
      { fieldName: 'startTime', comparator: 'lte', value: now }
    );
    
    for (const battle of startingBattles) {
      await this.battleRepo.updateStatus(battle.id, 'active');
      logger.info(`Battle ${battle.id} is now active`);
      EventEmitter.emit('battle.activated', { battleId: battle.id });
    }
    
    // Process battles that should move to voting phase
    const endingBattles = await this.battleRepo.findBattlesByState(
      'active',
      { fieldName: 'endTime', comparator: 'lte', value: now }
    );
    
    for (const battle of endingBattles) {
      await this.battleRepo.updateStatus(battle.id, 'voting');
      logger.info(`Battle ${battle.id} is now in voting phase`);
      EventEmitter.emit('battle.votingStarted', { battleId: battle.id });
    }
    
    // Process battles that should be completed
    const completingBattles = await this.battleRepo.findBattlesByState(
      'voting',
      { fieldName: 'votingEndTime', comparator: 'lte', value: now }
    );
    
    for (const battle of completingBattles) {
      await this.battleRepo.updateStatus(battle.id, 'completed');
      logger.info(`Battle ${battle.id} is now completed`);
      EventEmitter.emit('battle.completed', { battleId: battle.id });
      
      // Queue results calculation
      // this.jobQueue.add('calculateBattleResults', { battleId: battle.id });
    }
  }
}
```

**Essential Requirements:**
- Automated state transitions based on time
- Event generation for state changes
- Status verification for actions
- Results processing on completion

**Key Best Practices:**
- Use scheduled job for state updates
- Emit events for state changes
- Implement transaction-based updates
- Create audit log for state transitions

**Key Potential Challenges:**
- Handling time zone issues
- Managing scheduled jobs reliably
- Coordinating state transitions
- Handling edge cases in transitions

## Testing Strategy
- Battle CRUD operation tests
- Entry submission validation tests
- Voting system mechanics tests
- State transition integration tests

## Definition of Done
- [ ] Battle data model implemented
- [ ] Battle CRUD operations working
- [ ] Entry submission system implemented
- [ ] Voting and results system functional
- [ ] Battle state management working
- [ ] Media handling for entries implemented
- [ ] Validation for all operations implemented
- [ ] All battle system tests passing

---

# Task 4: Content Management System

## Task Overview
- **Purpose:** Implement the content creation, storage, and retrieval functionality
- **Value:** Enables the 20% content creation target by providing reliable content infrastructure
- **Dependencies:** Core Infrastructure (Task 1), Authentication (Task 2)

## Required Knowledge
- **Key Documents:** `backend.md`, `prd.md` (Creator Studio section)
- **Technical Guidelines:** Content storage requirements, media handling
- **Phase 2 Dependencies:** Frontend Content Creation components

## Implementation Sub-Tasks

### Sub-Task 4.1: Content Data Model ⭐️ *PRIORITY*

**Goal:** Implement the data model for user-generated content

**Key Implementation:**
```typescript
// src/models/content.ts - Content data models
export interface Content {
  id: string;
  creatorId: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'mixed';
  title: string;
  body?: string;
  mediaUrl?: string;
  additionalMedia?: string[];
  metadata: ContentMetadata;
  status: 'draft' | 'published' | 'archived' | 'removed';
  visibility: 'public' | 'private' | 'limited';
  battleId?: string;
  moderation: {
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: Date;
    reviewerId?: string;
    reason?: string;
  };
  metrics: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ContentMetadata {
  tags?: string[];
  location?: string;
  mentions?: string[];
  contentWarnings?: string[];
  language?: string;
  [key: string]: any;
}
```

**Essential Requirements:**
- Content entity with support for all format types
- Draft and published state handling
- Metadata storage for extended information
- Moderation status tracking

**Key Best Practices:**
- Design for content type flexibility
- Implement proper indexing strategy
- Create clear ownership model
- Support content versioning

**Key Potential Challenges:**
- Modeling complex mixed-media content
- Designing efficient search capabilities
- Balancing normalization and performance
- Supporting rich metadata

### Sub-Task 4.2: Media Upload and Storage ⭐️ *PRIORITY*

**Goal:** Implement secure media file handling and storage

**Key Implementation:**
```typescript
// src/services/media-service.ts
import { createHash } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MediaUploadError } from '../errors';

export class MediaService {
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
  
  async generatePresignedUrl(userId: string, fileType: string, contentType: string) {
    const timestamp = Date.now();
    const hash = createHash('md5')
      .update(`${userId}${timestamp}${Math.random()}`)
      .digest('hex');
    
    const key = `uploads/${userId}/${hash}.${fileType}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });
    
    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 15 // 15 minutes
      });
      
      return {
        uploadUrl: signedUrl,
        fileUrl: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`,
        key
      };
    } catch (error) {
      throw new MediaUploadError('Failed to generate upload URL', error);
    }
  }
  
  // Additional methods for media processing, validation, etc.
}
```

**Essential Requirements:**
- Secure upload mechanism
- Media type validation
- File size and format restrictions
- CDN integration for delivery

**Key Best Practices:**
- Use presigned URLs for direct uploads
- Implement server-side validation
- Create secure file naming strategy
- Support media optimization

**Key Potential Challenges:**
- Handling large file uploads
- Securing media access control
- Supporting various media formats
- Optimizing storage costs

### Sub-Task 4.3: Content CRUD Operations ⭐️ *PRIORITY*

**Goal:** Implement core content management functionality

**Key Implementation:**
```typescript
// src/repositories/content-repository.ts
import { db } from '../lib/database';
import { Content, CreateContentInput } from '../models/content';

export class ContentRepository {
  async findById(id: string): Promise<Content | null> {
    return db.content.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        metrics: true
      }
    });
  }
  
  async create(data: CreateContentInput): Promise<Content> {
    return db.content.create({
      data: {
        ...data,
        metrics: {
          create: {
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0
          }
        },
        moderation: {
          create: {
            status: 'pending'
          }
        }
      }
    });
  }
  
  async findByCreator(
    creatorId: string,
    status?: string,
    limit = 20,
    cursor?: string
  ): Promise<Content[]> {
    return db.content.findMany({
      where: {
        creatorId,
        ...(status ? { status } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });
  }
  
  async publish(id: string): Promise<Content> {
    return db.content.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date()
      }
    });
  }
}
```

**Essential Requirements:**
- Content creation with validation
- Draft management and saving
- Publishing workflow
- Content retrieval with filtering

**Key Best Practices:**
- Implement repository pattern
- Use transactions for data integrity
- Create efficient query patterns
- Apply proper authorization checks

**Key Potential Challenges:**
- Handling complex content queries
- Managing mixed-media content
- Supporting efficient pagination
- Optimizing for content discovery

### Sub-Task 4.4: Content Moderation System ⭐️ *PRIORITY*

**Goal:** Implement content moderation workflow and policies

**Key Implementation:**
```typescript
// src/services/moderation-service.ts
import { ContentRepository } from '../repositories/content-repository';
import { ModerationResult, ModerationType } from '../models/moderation';
import { autoModerateContent } from '../lib/auto-moderation';
import { logger } from '../lib/logger';
import { EventEmitter } from '../lib/events';

export class ModerationService {
  constructor(private contentRepo: ContentRepository) {}
  
  async moderateContent(contentId: string): Promise<ModerationResult> {
    // Get content to moderate
    const content = await this.contentRepo.findById(contentId);
    if (!content) {
      throw new Error(`Content not found: ${contentId}`);
    }
    
    // Perform automated moderation
    const autoModerationResult = await autoModerateContent(content);
    
    // If content clearly violates policies, reject automatically
    if (autoModerationResult.severity === 'high') {
      await this.rejectContent(
        contentId,
        'system',
        autoModerationResult.reason
      );
      
      logger.info(
        { contentId, result: autoModerationResult },
        'Content automatically rejected'
      );
      
      return {
        status: 'rejected',
        reason: autoModerationResult.reason,
        type: ModerationType.AUTOMATED
      };
    }
    
    // If content needs human review
    if (autoModerationResult.severity === 'medium' || 
        autoModerationResult.needsHumanReview) {
      // Queue for human review
      await this.queueForHumanReview(contentId, autoModerationResult);
      
      return {
        status: 'pending',
        type: ModerationType.HUMAN_REVIEW_NEEDED
      };
    }
    
    // If content passes automated checks
    await this.approveContent(contentId, 'system');
    
    return {
      status: 'approved',
      type: ModerationType.AUTOMATED
    };
  }
  
  // Additional methods for human moderation workflows
}
```

**Essential Requirements:**
- Automated content screening
- Human moderation workflow
- Moderation queue management
- Appeals and review process

**Key Best Practices:**
- Implement multi-level moderation
- Create clear policy violations
- Design audit trail for decisions
- Support contextual moderation

**Key Potential Challenges:**
- Balancing automation with human review
- Handling moderation at scale
- Creating fair appeals process
- Supporting Wild 'n Out-specific content

## Testing Strategy
- Content CRUD operation tests
- Media upload and storage tests
- Content moderation workflow tests
- Content retrieval and filtering tests

## Definition of Done
- [ ] Content data model implemented
- [ ] Media upload and storage working
- [ ] Content CRUD operations implemented
- [ ] Content moderation system functional
- [ ] Draft management workflow implemented
- [ ] Content discovery queries working
- [ ] Media validation and processing working
- [ ] All content management tests passing

---

# Task 5: Community & Social Features

## Task Overview
- **Purpose:** Implement the social interaction features that drive community engagement
- **Value:** Enhances user retention by creating meaningful connections and interactions
- **Dependencies:** Core Infrastructure (Task 1), Authentication (Task 2), Content Management (Task 4)

## Required Knowledge
- **Key Documents:** `backend.md`, `prd.md` (Community Zone section)
- **Technical Guidelines:** Social interaction requirements, real-time features
- **Phase 2 Dependencies:** Frontend Community Zone components

## Implementation Sub-Tasks

### Sub-Task 5.1: Social Activity Data Model ⭐️ *PRIORITY*

**Goal:** Implement the data model for social interactions

**Key Implementation:**
```typescript
// src/models/social.ts - Social interaction models
export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  WOW = 'wow',
  FIRE = 'fire'
}

export interface Reaction {
  id: string;
  userId: string;
  targetType: 'content' | 'comment' | 'battle_entry';
  targetId: string;
  type: ReactionType;
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  targetType: 'content' | 'battle_entry';
  targetId: string;
  parentId?: string; // For nested comments
  body: string;
  attachments?: string[];
  status: 'active' | 'hidden' | 'removed';
  moderation: {
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: Date;
    reviewerId?: string;
    reason?: string;
  };
  metrics: {
    reactionCount: number;
    replyCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Follow {
  id: string;
  followerId: string;
  followedId: string;
  createdAt: Date;
}
```

**Essential Requirements:**
- Reaction system for lightweight engagement
- Comment system with threading
- Follow relationship tracking
- Activity metrics aggregation

**Key Best Practices:**
- Design for efficient querying
- Use appropriate indexing
- Create flexible reaction types
- Support comment threading

**Key Potential Challenges:**
- Efficient comment threading
- Reaction count aggregation
- Follow relationship optimization
- Handling high-volume activities

### Sub-Task 5.2: Social Interaction Services ⭐️ *PRIORITY*

**Goal:** Implement core services for social interactions

**Key Implementation:**
```typescript
// src/services/reaction-service.ts
import { ReactionRepository } from '../repositories/reaction-repository';
import { ContentRepository } from '../repositories/content-repository';
import { ReactionType } from '../models/social';
import { EventEmitter } from '../lib/events';

export class ReactionService {
  constructor(
    private reactionRepo: ReactionRepository,
    private contentRepo: ContentRepository
  ) {}
  
  async addReaction(
    userId: string,
    targetType: string,
    targetId: string,
    reactionType: ReactionType
  ) {
    // Check if user already reacted
    const existingReaction = await this.reactionRepo.findUserReaction(
      userId,
      targetType,
      targetId
    );
    
    if (existingReaction) {
      // If same reaction type, remove it (toggle)
      if (existingReaction.type === reactionType) {
        await this.reactionRepo.remove(existingReaction.id);
        await this.updateMetrics(targetType, targetId, -1);
        
        EventEmitter.emit('reaction.removed', {
          userId,
          targetType,
          targetId,
          reactionType
        });
        
        return null;
      }
      
      // If different reaction type, update it
      const updatedReaction = await this.reactionRepo.update(
        existingReaction.id,
        { type: reactionType }
      );
      
      EventEmitter.emit('reaction.updated', {
        userId,
        targetType,
        targetId,
        reactionType
      });
      
      return updatedReaction;
    }
    
    // Create new reaction
    const reaction = await this.reactionRepo.create({
      userId,
      targetType,
      targetId,
      type: reactionType
    });
    
    await this.updateMetrics(targetType, targetId, 1);
    
    EventEmitter.emit('reaction.created', {
      userId,
      targetType,
      targetId,
      reactionType
    });
    
    return reaction;
  }
  
  private async updateMetrics(targetType: string, targetId: string, change: number) {
    if (targetType === 'content') {
      await this.contentRepo.incrementReactionCount(targetId, change);
    }
    // Handle other target types...
  }
}
```

**Essential Requirements:**
- Reaction creation and removal
- Comment posting and management
- Follow relationship management
- Activity feed generation

**Key Best Practices:**
- Handle duplicates and conflicts
- Update metrics efficiently
- Generate appropriate events
- Apply proper transaction boundaries

**Key Potential Challenges:**
- Handling high traffic interactions
- Efficient feed generation
- Transaction consistency
- Event generation volume

### Sub-Task 5.3: Activity Feed System ⭐️ *PRIORITY*

**Goal:** Implement the activity feed generation system

**Key Implementation:**
```typescript
// src/services/feed-service.ts
import { ActivityRepository } from '../repositories/activity-repository';
import { UserRepository } from '../repositories/user-repository';
import { ContentRepository } from '../repositories/content-repository';
import { BattleRepository } from '../repositories/battle-repository';

export class FeedService {
  constructor(
    private activityRepo: ActivityRepository,
    private userRepo: UserRepository,
    private contentRepo: ContentRepository,
    private battleRepo: BattleRepository
  ) {}
  
  async generatePersonalFeed(userId: string, limit = 20, cursor?: string) {
    // Get users the current user follows
    const following = await this.userRepo.getUserFollowing(userId);
    const followingIds = following.map(f => f.followedId);
    
    // Add the user's own ID to include their activity
    const relevantUserIds = [...followingIds, userId];
    
    // Get recent content from relevant users
    const recentContent = await this.contentRepo.findByCreators(
      relevantUserIds,
      'published',
      limit,
      cursor
    );
    
    // Get active battles (not user-specific)
    const activeBattles = await this.battleRepo.findActive(5);
    
    // Get trending content based on metrics
    const trendingContent = await this.contentRepo.findTrending(
      5,
      { excludeUserIds: [userId] } // Avoid duplication with user's feed
    );
    
    // Merge, sort, and prioritize feed items
    const feedItems = [
      ...recentContent.map(c => ({ type: 'content', item: c, score: calculateContentScore(c) })),
      ...activeBattles.map(b => ({ type: 'battle', item: b, score: calculateBattleScore(b) })),
      ...trendingContent.map(c => ({ type: 'trending', item: c, score: calculateTrendingScore(c) }))
    ];
    
    // Sort by score (descending)
    feedItems.sort((a, b) => b.score - a.score);
    
    return {
      items: feedItems.slice(0, limit),
      cursor: feedItems.length > limit ? feedItems[limit - 1].item.id : null
    };
  }
  
  // Helper functions for scoring feed items
  function calculateContentScore(content) {
    // Algorithm for content relevance scoring
    const recencyScore = getRecencyScore(content.publishedAt);
    const engagementScore = getEngagementScore(content.metrics);
    return recencyScore * 0.7 + engagementScore * 0.3;
  }
  
  // Similar functions for other item types...
}
```

**Essential Requirements:**
- Personalized feed generation
- Activity aggregation by type
- Feed caching and updating
- Discovery-based feed items

**Key Best Practices:**
- Implement efficient feed algorithms
- Use background generation
- Apply caching strategies
- Design for feed freshness

**Key Potential Challenges:**
- Scaling feed generation
- Balancing relevance and freshness
- Handling diverse content types
- Caching and invalidation strategy

### Sub-Task 5.4: Notification System ⭐️ *PRIORITY*

**Goal:** Implement the user notification system

**Key Implementation:**
```typescript
// src/services/notification-service.ts
import { NotificationRepository } from '../repositories/notification-repository';
import { UserRepository } from '../repositories/user-repository';
import { NotificationType, Notification } from '../models/notification';
import { EventEmitter } from '../lib/events';
import { WebSocketService } from '../services/websocket-service';

export class NotificationService {
  constructor(
    private notificationRepo: NotificationRepository,
    private userRepo: UserRepository,
    private wsService: WebSocketService
  ) {
    // Register event handlers for notification creation
    this.registerEventHandlers();
  }
  
  private registerEventHandlers() {
    // React when someone reacts to user's content
    EventEmitter.on('reaction.created', this.handleReactionEvent.bind(this));
    
    // React when someone comments on user's content
    EventEmitter.on('comment.created', this.handleCommentEvent.bind(this));
    
    // React when a battle status changes
    EventEmitter.on('battle.votingStarted', this.handleBattleStateChange.bind(this));
    
    // And other relevant events...
  }
  
  async createNotification(userId: string, notification: Partial<Notification>) {
    // Create notification in database
    const newNotification = await this.notificationRepo.create({
      userId,
      ...notification,
      read: false,
      createdAt: new Date()
    });
    
    // Send real-time notification via WebSocket
    this.wsService.sendToUser(userId, 'notification', newNotification);
    
    return newNotification;
  }
  
  async getUserNotifications(userId: string, limit = 20, onlyUnread = false) {
    return this.notificationRepo.findByUser(userId, {
      limit,
      read: onlyUnread ? false : undefined,
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async markAsRead(notificationId: string, userId: string) {
    return this.notificationRepo.update(notificationId, {
      read: true,
      readAt: new Date()
    });
  }
  
  async markAllAsRead(userId: string) {
    return this.notificationRepo.markAllAsRead(userId);
  }
  
  // Event handlers for different notification triggers
  private async handleReactionEvent(event) {
    // Get content owner
    const content = await this.contentRepo.findById(event.targetId);
    if (!content || content.creatorId === event.userId) return; // Don't notify for own reactions
    
    await this.createNotification(content.creatorId, {
      type: NotificationType.REACTION,
      title: 'New reaction',
      body: `Someone reacted to your content`,
      data: {
        contentId: content.id,
        reactionType: event.reactionType,
        userId: event.userId
      }
    });
  }
  
  // Similar handlers for other events...
}
```

**Essential Requirements:**
- Notification generation from events
- Notification storage and retrieval
- Read/unread state management
- Real-time delivery via WebSockets

**Key Best Practices:**
- Use event-driven architecture
- Batch similar notifications
- Implement notification preferences
- Design for delivery reliability

**Key Potential Challenges:**
- Handling notification volume
- Managing delivery failures
- Implementing notification preferences
- Aggregating similar notifications

## Testing Strategy
- Social interaction service tests
- Activity feed generation tests
- Notification system tests
- Performance testing with high volume

## Definition of Done
- [ ] Social activity data model implemented
- [ ] Social interaction services implemented
- [ ] Activity feed system working
- [ ] Notification system implemented
- [ ] Comment threading system functional
- [ ] Reaction system implemented
- [ ] Follow relationships working
- [ ] All community feature tests passing

---

# Task 6: Blockchain Integration

## Task Overview
- **Purpose:** Implement the blockchain connectivity for token verification and tracking
- **Value:** Provides core utility value by connecting the platform to token holdings
- **Dependencies:** Core Infrastructure (Task 1), Authentication (Task 2)

## Required Knowledge
- **Key Documents:** `backend.md`, `prd.md` (Token Hub section)
- **Technical Guidelines:** Blockchain integration requirements, security considerations
- **Phase 2 Dependencies:** Frontend Token Hub components

## Implementation Sub-Tasks

### Sub-Task 6.1: Solana Connection Service ⭐️ *PRIORITY*

**Goal:** Implement core Solana blockchain connectivity

**Key Implementation:**
```typescript
// src/services/blockchain-service.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { retry } from '../utils/retry';
import { logger } from '../lib/logger';
import { BlockchainError } from '../errors';

export class BlockchainService {
  private connection: Connection;
  private tokenMint: PublicKey;
  
  constructor(config) {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.tokenMint = new PublicKey(config.solana.tokenMint);
  }
  
  async getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Retry up to 3 times with exponential backoff
      const tokenAccounts = await retry(
        () => this.connection.getTokenAccountsByOwner(
          publicKey,
          { mint: this.tokenMint }
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
      throw new BlockchainError('Failed to get token balance', error);
    }
  }
  
  async getTokenPrice(): Promise<number> {
    // Implementation of token price fetching from oracle or DEX
  }
  
  async getMarketCap(): Promise<number> {
    // Implementation of market cap calculation
  }
}
```

**Essential Requirements:**
- Solana RPC connection establishment
- Token balance checking
- Multiple node fallback
- Error handling and retries

**Key Best Practices:**
- Implement connection pooling
- Use multiple RPC endpoints
- Apply retry with backoff
- Create detailed error logging

**Key Potential Challenges:**
- RPC node reliability
- Connection rate limiting
- Response time variability
- Error handling complexity

### Sub-Task 6.2: Wallet Verification ⭐️ *PRIORITY*

**Goal:** Implement secure wallet ownership verification

**Key Implementation:**
```typescript
// src/services/wallet-service.ts
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { v4 as uuidv4 } from 'uuid';
import { BlockchainService } from './blockchain-service';
import { WalletRepository } from '../repositories/wallet-repository';
import { WalletVerificationError } from '../errors';

export class WalletService {
  private messageCache: Map<string, { message: string, expires: number }> = new Map();
  
  constructor(
    private blockchainService: BlockchainService,
    private walletRepo: WalletRepository
  ) {}
  
  async generateVerificationMessage(userId: string): Promise<string> {
    // Create a unique message with timestamp and nonce
    const message = `Verify your wallet on Wild 'n Out: ${uuidv4()} at ${Date.now()}`;
    
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
      throw new WalletVerificationError('Verification message expired');
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
        throw new WalletVerificationError('Invalid signature');
      }
      
      // If verified, associate wallet with user
      await this.walletRepo.saveUserWallet(userId, walletAddress);
      
      // Clean up cache
      this.messageCache.delete(userId);
      
      return true;
    } catch (error) {
      logger.error({ error, userId, walletAddress }, 'Wallet verification failed');
      throw new WalletVerificationError('Signature verification failed', error);
    }
  }
}
```

**Essential Requirements:**
- Secure message generation
- Cryptographic signature verification
- Wallet-to-user association
- Verification timeout handling

**Key Best Practices:**
- Use nonce for replay protection
- Implement message expiration
- Store verification history
- Create clear error messages

**Key Potential Challenges:**
- Secure signature verification
- Supporting multiple wallet types
- Handling verification timeouts
- Preventing replay attacks

### Sub-Task 6.3: Token Data Services ⭐️ *PRIORITY*

**Goal:** Implement token data aggregation and tracking services

**Key Implementation:**
```typescript
// src/services/token-service.ts
import { BlockchainService } from './blockchain-service';
import { MarketDataRepository } from '../repositories/market-data-repository';
import { CacheService } from './cache-service';
import { EventEmitter } from '../lib/events';

export class TokenService {
  constructor(
    private blockchainService: BlockchainService,
    private marketDataRepo: MarketDataRepository,
    private cacheService: CacheService
  ) {}
  
  async getCurrentMarketData() {
    // Try to get from cache first
    const cached = await this.cacheService.get('market_data');
    if (cached) return cached;
    
    // Fetch current price from blockchain service
    const price = await this.blockchainService.getTokenPrice();
    
    // Fetch market cap and volume
    const marketCap = await this.blockchainService.getMarketCap();
    const volume24h = await this.blockchainService.get24hVolume();
    
    // Calculate 24h change
    const yesterday = await this.marketDataRepo.getHistoricalPrice(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    const priceChange24h = yesterday ? 
      ((price - yesterday.price) / yesterday.price) * 100 : 0;
    
    const data = {
      price,
      marketCap,
      volume24h,
      priceChange24h,
      updatedAt: new Date()
    };
    
    // Save to database for historical tracking
    await this.marketDataRepo.create(data);
    
    // Cache for 1 minute
    await this.cacheService.set('market_data', data, 60);
    
    // Emit event for milestones
    if (this.checkMilestoneReached(marketCap)) {
      EventEmitter.emit('token.milestone', {
        marketCap,
        milestone: this.getCurrentMilestone(marketCap)
      });
    }
    
    return data;
  }
  
  async getHistoricalData(timeframe: string) {
    // Implementation of historical data retrieval
  }
  
  private checkMilestoneReached(marketCap: number): boolean {
    // Check if a new milestone has been reached
    // Implementation...
  }
  
  private getCurrentMilestone(marketCap: number): number {
    // Get the current milestone based on market cap
    const milestones = [10e6, 50e6, 100e6, 200e6, 500e6]; // $10M, $50M, etc.
    return milestones.find(m => marketCap >= m) || 0;
  }
}
```

**Essential Requirements:**
- Token price tracking
- Market cap calculation
- Milestone tracking
- Historical data storage

**Key Best Practices:**
- Implement efficient caching
- Use multiple data sources
- Create milestone triggers
- Design for data reliability

**Key Potential Challenges:**
- Handling price data volatility
- Ensuring data source reliability
- Calculating market cap accurately
- Managing high-frequency updates

### Sub-Task 6.4: Transaction Feed ⭐️ *PRIORITY*

**Goal:** Implement transaction monitoring and feed generation

**Key Implementation:**
```typescript
// src/services/transaction-service.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { parseTransactionData } from '../utils/transaction-parser';
import { TransactionRepository } from '../repositories/transaction-repository';
import { logger } from '../lib/logger';

export class TransactionService {
  private connection: Connection;
  private tokenMint: PublicKey;
  
  constructor(
    private config,
    private transactionRepo: TransactionRepository
  ) {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.tokenMint = new PublicKey(config.solana.tokenMint);
  }
  
  async getRecentTransactions(limit = 20): Promise<Transaction[]> {
    try {
      // First check cached recent transactions
      const cachedTxs = await this.transactionRepo.getRecent(limit);
      
      // If we have enough cached, return them
      if (cachedTxs.length >= limit) {
        return cachedTxs;
      }
      
      // Fetch recent signatures for token program
      const signatures = await this.connection.getSignaturesForAddress(
        this.tokenMint,
        { limit: 100 }
      );
      
      // Parse transaction data
      const transactions = [];
      for (const sig of signatures) {
        // Skip already processed transactions
        if (cachedTxs.some(tx => tx.signature === sig.signature)) {
          continue;
        }
        
        try {
          const tx = await this.connection.getTransaction(sig.signature);
          
          if (!tx) continue;
          
          const parsed = parseTransactionData(tx, this.tokenMint);
          
          // If it's a token transfer
          if (parsed.isTokenTransfer) {
            // Save to database
            const savedTx = await this.transactionRepo.create({
              signature: sig.signature,
              blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(),
              sender: parsed.sender,
              recipient: parsed.recipient,
              amount: parsed.amount,
              txType: parsed.txType
            });
            
            transactions.push(savedTx);
            
            // If we have enough, stop
            if (transactions.length >= limit) {
              break;
            }
          }
        } catch (txError) {
          logger.error(
            { error: txError, signature: sig.signature },
            'Failed to process transaction'
          );
        }
      }
      
      // Combine cached and new transactions
      return [...transactions, ...cachedTxs].slice(0, limit);
    } catch (error) {
      logger.error({ error }, 'Failed to get recent transactions');
      throw new Error('Failed to get recent transactions');
    }
  }
}
```

**Essential Requirements:**
- Token transaction monitoring
- Transaction data parsing
- Feed generation and storage
- Transaction categorization

**Key Best Practices:**
- Implement efficient data fetching
- Create transaction caching
- Design for transaction privacy
- Apply clear transaction parsing

**Key Potential Challenges:**
- Handling transaction volume
- Parsing complex transactions
- Managing blockchain reorgs
- Scaling transaction processing

## Testing Strategy
- Blockchain connectivity tests
- Wallet verification tests
- Token data service tests
- Transaction feed generation tests

## Definition of Done
- [ ] Solana connection service implemented
- [ ] Wallet verification system working
- [ ] Token data services implemented
- [ ] Transaction feed processing working
- [ ] Milestone tracking functional
- [ ] Multiple RPC node fallback implemented
- [ ] Error handling and logging in place
- [ ] All blockchain integration tests passing

---

# Task 7: Real-time Communication System

## Task Overview
- **Purpose:** Implement the WebSocket-based real-time communication infrastructure
- **Value:** Enables engaging real-time features that drive retention and platform energy
- **Dependencies:** Core Infrastructure (Task 1), Authentication (Task 2)

## Required Knowledge
- **Key Documents:** `backend.md`, `appflow.md`
- **Technical Guidelines:** Real-time requirements, WebSocket implementation
- **Phase 2 Dependencies:** Frontend real-time feature components

## Implementation Sub-Tasks

### Sub-Task 7.1: WebSocket Server Implementation ⭐️ *PRIORITY*

**Goal:** Set up the WebSocket server with connection handling

**Key Implementation:**
```typescript
// src/services/websocket-service.ts
import { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { verifySession } from '../lib/auth';
import { logger } from '../lib/logger';
import { ConnectionManager } from './connection-manager';

export class WebSocketService {
  private wss: WebSocket.Server;
  private connectionManager: ConnectionManager;
  
  constructor(server: FastifyInstance, private config) {
    this.connectionManager = new ConnectionManager();
    
    this.wss = new WebSocket.Server({
      server: server.server,
      path: '/ws',
      maxPayload: 1048576 // 1MB max message size
    });
    
    this.initializeEventHandlers();
    
    logger.info('WebSocket server initialized');
  }
  
  private initializeEventHandlers() {
    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract token from URL params
        const url = new URL(req.url, 'http://localhost');
        const token = url.searchParams.get('token');
        
        if (!token) {
          ws.close(1008, 'Authentication required');
          return;
        }
        
        // Verify session
        const session = await verifySession(token);
        if (!session) {
          ws.close(1008, 'Invalid authentication');
          return;
        }
        
        const userId = session.userId;
        
        // Register connection
        const connectionId = this.connectionManager.registerConnection(userId, ws);
        
        logger.info({ userId, connectionId }, 'WebSocket client connected');
        
        // Set up message handler
        ws.on('message', (message) => {
          this.handleMessage(userId, connectionId, message);
        });
        
        // Set up close handler
        ws.on('close', () => {
          this.connectionManager.removeConnection(connectionId);
          logger.info({ userId, connectionId }, 'WebSocket client disconnected');
        });
        
        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connection',
          status: 'connected',
          userId
        }));
      } catch (error) {
        logger.error({ error }, 'WebSocket connection error');
        ws.close(1011, 'Internal server error');
      }
    });
  }
  
  private handleMessage(userId: string, connectionId: string, message: WebSocket.Data) {
    try {
      const data = JSON.parse(message.toString());
      // Process message based on type
      // Implementation...
    } catch (error) {
      logger.error({ error, userId }, 'Failed to handle WebSocket message');
    }
  }
  
  // Methods for sending messages
  sendToUser(userId: string, type: string, data: any) {
    const connections = this.connectionManager.getUserConnections(userId);
    
    if (!connections.length) return;
    
    const message = JSON.stringify({
      type,
      data,
      timestamp: Date.now()
    });
    
    for (const connection of connections) {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(message);
      }
    }
  }
  
  broadcast(type: string, data: any, filter?: (userId: string) => boolean) {
    const message = JSON.stringify({
      type,
      data,
      timestamp: Date.now()
    });
    
    this.connectionManager.broadcast(message, filter);
  }
}
```

**Essential Requirements:**
- WebSocket server setup with Fastify
- Secure connection authentication
- Client connection management
- Message handling infrastructure

**Key Best Practices:**
- Authenticate all connections
- Implement connection tracking
- Design efficient message format
- Handle connection errors

**Key Potential Challenges:**
- Scaling WebSocket connections
- Managing authentication state
- Handling reconnection logic
- Optimizing message throughput

### Sub-Task 7.2: Connection Management ⭐️ *PRIORITY*

**Goal:** Implement efficient user connection tracking and management

**Key Implementation:**
```typescript
// src/services/connection-manager.ts
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

export class ConnectionManager {
  // User ID -> Connection IDs
  private userConnections: Map<string, Set<string>> = new Map();
  
  // Connection ID -> Connection data
  private connections: Map<string, {
    userId: string;
    ws: WebSocket;
    connectedAt: Date;
  }> = new Map();
  
  registerConnection(userId: string, ws: WebSocket): string {
    const connectionId = uuidv4();
    
    // Store connection data
    this.connections.set(connectionId, {
      userId,
      ws,
      connectedAt: new Date()
    });
    
    // Update user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    
    this.userConnections.get(userId).add(connectionId);
    
    return connectionId;
  }
  
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    const { userId } = connection;
    
    // Remove from user connections
    const userConns = this.userConnections.get(userId);
    if (userConns) {
      userConns.delete(connectionId);
      
      // Clean up if no more connections
      if (userConns.size === 0) {
        this.userConnections.delete(userId);
      }
    }
    
    // Remove connection data
    this.connections.delete(connectionId);
  }
  
  getUserConnections(userId: string): WebSocket[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return [];
    
    return Array.from(connectionIds)
      .map(id => this.connections.get(id)?.ws)
      .filter(Boolean);
  }
  
  isUserConnected(userId: string): boolean {
    const connections = this.userConnections.get(userId);
    return !!connections && connections.size > 0;
  }
  
  broadcast(message: string, filter?: (userId: string) => boolean): void {
    for (const [connectionId, connection] of this.connections.entries()) {
      // Apply filter if provided
      if (filter && !filter(connection.userId)) {
        continue;
      }
      
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(message);
      }
    }
  }
  
  getConnectionStats(): {
    totalConnections: number;
    totalUsers: number;
  } {
    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size
    };
  }
}
```

**Essential Requirements:**
- User connection tracking
- Multiple device support
- Connection status monitoring
- Connection cleanup on disconnect

**Key Best Practices:**
- Use efficient data structures
- Implement proper garbage collection
- Create connection analytics
- Design for multi-instance support

**Key Potential Challenges:**
- Scaling to many connections
- Handling connection timeouts
- Managing reconnection logic
- Supporting multiple devices per user

### Sub-Task 7.3: Real-time Event System ⭐️ *PRIORITY*

**Goal:** Implement event-driven real-time communication

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

// Create a singleton event emitter
class EventSystem extends NodeEventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Increase from default 10
  }
  
  emit(event: string | symbol, ...args: any[]): boolean {
    logger.debug({ event, args: args[0] }, 'Event emitted');
    return super.emit(event, ...args);
  }
}

export const EventEmitter = new EventSystem();

// Add centralized event handling for WebSocket broadcasting
export function initializeEventHandlers(wsService) {
  // User events
  EventEmitter.on(EventType.USER_UPDATED, (data) => {
    wsService.sendToUser(data.userId, 'profile.updated', data);
  });
  
  // Battle events
  EventEmitter.on(EventType.BATTLE_ACTIVATED, (data) => {
    wsService.broadcast('battle.activated', data);
  });
  
  EventEmitter.on(EventType.BATTLE_VOTING_STARTED, (data) => {
    wsService.broadcast('battle.votingStarted', data);
  });
  
  EventEmitter.on(EventType.BATTLE_COMPLETED, (data) => {
    wsService.broadcast('battle.completed', data);
  });
  
  // Content events
  EventEmitter.on(EventType.CONTENT_CREATED, (data) => {
    // Notify followers
    // Implementation...
  });
  
  // Social events
  EventEmitter.on(EventType.REACTION_CREATED, (data) => {
    // Notify content creator
    wsService.sendToUser(data.targetUserId, 'reaction.received', data);
  });
  
  EventEmitter.on(EventType.COMMENT_CREATED, (data) => {
    // Notify content creator and other commenters
    // Implementation...
  });
  
  // Token events
  EventEmitter.on(EventType.TOKEN_MILESTONE, (data) => {
    // Broadcast milestone to all users
    wsService.broadcast('token.milestone', data);
  });
}
```

**Essential Requirements:**
- Centralized event system
- Event categorization by type
- Topic-based subscription
- Reliable event delivery

**Key Best Practices:**
- Use typed events for consistency
- Implement event logging
- Create clear event naming patterns
- Design for decoupling services

**Key Potential Challenges:**
- Handling high event volume
- Ensuring event delivery
- Managing event dependencies
- Scaling event processing

### Sub-Task 7.4: Channel-Specific Implementation ⭐️ *PRIORITY*

**Goal:** Implement specific real-time features for key platform areas

**Key Implementation:**
```typescript
// src/services/real-time-battle-service.ts
import { WebSocketService } from './websocket-service';
import { BattleRepository } from '../repositories/battle-repository';
import { EventEmitter, EventType } from '../lib/events';

export class RealTimeBattleService {
  constructor(
    private wsService: WebSocketService,
    private battleRepo: BattleRepository
  ) {
    // Register event handlers
    this.registerEventHandlers();
  }
  
  private registerEventHandlers() {
    // New entry submitted
    EventEmitter.on('entry.created', (data) => {
      this.handleNewEntry(data);
    });
    
    // Vote cast
    EventEmitter.on('vote.created', (data) => {
      this.handleNewVote(data);
    });
    
    // Battle state changes
    EventEmitter.on(EventType.BATTLE_ACTIVATED, (data) => {
      this.handleBattleActivated(data);
    });
    
    EventEmitter.on(EventType.BATTLE_VOTING_STARTED, (data) => {
      this.handleVotingStarted(data);
    });
    
    EventEmitter.on(EventType.BATTLE_COMPLETED, (data) => {
      this.handleBattleCompleted(data);
    });
  }
  
  private async handleNewEntry(data) {
    const { battleId, entryId, userId } = data;
    
    // Get battle details
    const battle = await this.battleRepo.findById(battleId);
    if (!battle) return;
    
    // Get entry details (with limited data for broadcasting)
    const entry = await this.entryRepo.findByIdLimited(entryId);
    if (!entry) return;
    
    // Broadcast to battle channel
    this.wsService.broadcast(
      'battle.newEntry',
      {
        battleId,
        entry: {
          id: entry.id,
          creatorId: entry.userId,
          submissionTime: entry.submissionTime
        }
      },
      // Only to users viewing this battle
      (userId) => this.userViewingBattle(userId, battleId)
    );
  }
  
  // Similar handlers for other battle events...
  
  // Helper method to track which battles users are viewing
  private userViewingBattle(userId: string, battleId: string): boolean {
    // Implementation using a tracking mechanism 
    // (e.g., Redis, in-memory map, etc.)
  }
}
```

**Essential Requirements:**
- Battle-specific real-time updates
- Notification channel implementation
- Direct messaging support
- Activity feed real-time updates

**Key Best Practices:**
- Create topic-based subscriptions
- Implement efficient filtering
- Design targeted broadcasts
- Use consistent message formats

**Key Potential Challenges:**
- Optimizing channel membership
- Scaling broadcast operations
- Maintaining consistency
- Supporting different update types

## Testing Strategy
- WebSocket server connection tests
- Connection management tests
- Event system functionality tests
- Channel-specific implementation tests

## Definition of Done
- [ ] WebSocket server implemented
- [ ] Connection management system working
- [ ] Real-time event system functional
- [ ] Channel-specific implementations working
- [ ] Authentication for WebSocket connections
- [ ] Message handling and routing implemented
- [ ] Connection analytics and monitoring
- [ ] All real-time communication tests passing

---

# Task 8: Achievement & Gamification Engine

## Task Overview
- **Purpose:** Implement the achievement system and gamification mechanics
- **Value:** Drives retention and engagement through progression and recognition
- **Dependencies:** Core Infrastructure (Task 1), Authentication (Task 2), various feature services

## Required Knowledge
- **Key Documents:** `prd.md` (Profile & Achievement section), `appflow.md`
- **Technical Guidelines:** Gamification requirements, achievement design
- **Phase 2 Dependencies:** Frontend Profile & Achievement components

## Implementation Sub-Tasks

### Sub-Task 8.1: Achievement Data Model ⭐️ *PRIORITY*

**Goal:** Implement the data model for achievements and user progress

**Key Implementation:**
```typescript
// src/models/achievement.ts
export enum AchievementCategory {
  BATTLE = 'battle',
  CONTENT = 'content',
  COMMUNITY = 'community',
  PLATFORM = 'platform',
  TOKEN = 'token'
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold'
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  criteria: AchievementCriteria;
  points: number;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AchievementCriteria {
  type: string;
  threshold: number;
  requirements?: {
    [key: string]: any;
  };
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Essential Requirements:**
- Achievement definition model
- Progress tracking model
- Achievement categorization
- Tiered achievement support

**Key Best Practices:**
- Design for achievement flexibility
- Implement multi-tier achievements
- Create clear category organization
- Support hidden achievements

**Key Potential Challenges:**
- Modeling complex achievement criteria
- Supporting different achievement types
- Designing achievement progression
- Balancing achievement difficulty

### Sub-Task 8.2: Achievement Service ⭐️ *PRIORITY*

**Goal:** Implement core achievement tracking and awarding functionality

**Key Implementation:**
```typescript
// src/services/achievement-service.ts
import { AchievementRepository } from '../repositories/achievement-repository';
import { UserAchievementRepository } from '../repositories/user-achievement-repository';
import { Achievement, UserAchievement } from '../models/achievement';
import { EventEmitter } from '../lib/events';
import { logger } from '../lib/logger';

export class AchievementService {
  constructor(
    private achievementRepo: AchievementRepository,
    private userAchievementRepo: UserAchievementRepository,
    private pointsService: PointsService
  ) {
    // Register event listeners for achievement progress
    this.registerEventHandlers();
  }
  
  private registerEventHandlers() {
    // Battle completion
    EventEmitter.on('entry.created', async (data) => {
      await this.updateAchievementProgress(
        data.userId,
        'battle_entries',
        1
      );
    });
    
    // Battle victory
    EventEmitter.on('battle.result', async (data) => {
      if (data.position === 1) {
        await this.updateAchievementProgress(
          data.userId,
          'battle_victories',
          1
        );
      }
      
      await this.updateAchievementProgress(
        data.userId,
        'battle_participations',
        1
      );
    });
    
    // Content creation
    EventEmitter.on('content.created', async (data) => {
      await this.updateAchievementProgress(
        data.userId,
        'content_created',
        1
      );
    });
    
    // More event handlers for different achievement types...
  }
  
  async updateAchievementProgress(
    userId: string,
    criteriaType: string,
    increment: number
  ): Promise<UserAchievement[]> {
    try {
      // Find all achievements that match this criteria type
      const relevantAchievements = await this.achievementRepo.findByCriteriaType(
        criteriaType
      );
      
      if (relevantAchievements.length === 0) {
        return [];
      }
      
      const updatedAchievements: UserAchievement[] = [];
      const newlyCompleted: Achievement[] = [];
      
      // Update progress for each relevant achievement
      for (const achievement of relevantAchievements) {
        // Get user's current progress
        let userAchievement = await this.userAchievementRepo.findByUserAndAchievement(
          userId,
          achievement.id
        );
        
        // If no record exists, create one
        if (!userAchievement) {
          userAchievement = await this.userAchievementRepo.create({
            userId,
            achievementId: achievement.id,
            progress: 0,
            completed: false
          });
        }
        
        // Skip if already completed
        if (userAchievement.completed) {
          continue;
        }
        
        // Update progress
        const newProgress = userAchievement.progress + increment;
        const completed = newProgress >= achievement.criteria.threshold;
        
        // Update record
        const updated = await this.userAchievementRepo.update(
          userAchievement.id,
          {
            progress: newProgress,
            completed,
            completedAt: completed ? new Date() : undefined
          }
        );
        
        updatedAchievements.push(updated);
        
        // If newly completed, track for rewards
        if (completed && !userAchievement.completed) {
          newlyCompleted.push(achievement);
          
          // Emit achievement unlocked event
          EventEmitter.emit('achievement.unlocked', {
            userId,
            achievementId: achievement.id,
            achievement
          });
        }
      }
      
      // Award points for completed achievements
      if (newlyCompleted.length > 0) {
        for (const achievement of newlyCompleted) {
          await this.pointsService.awardPoints(
            userId,
            achievement.points,
            `Achievement: ${achievement.title}`
          );
        }
      }
      
      return updatedAchievements;
    } catch (error) {
      logger.error(
        { error, userId, criteriaType },
        'Failed to update achievement progress'
      );
      throw error;
    }
  }
  
  async getUserAchievements(userId: string): Promise<{
    achievements: any[];
    stats: {
      completed: number;
      inProgress: number;
      totalPoints: number;
    };
  }> {
    // Implementation to get user's achievements with stats
  }
}
```

**Essential Requirements:**
- Achievement progress tracking
- Achievement completion detection
- Points award for achievements
- Event-based progress updates

**Key Best Practices:**
- Use event-driven architecture
- Implement transaction-based updates
- Create detailed logging
- Design for performance at scale

**Key Potential Challenges:**
- Handling progress edge cases
- Managing achievement completion
- Processing high event volume
- Ensuring progress consistency

### Sub-Task 8.3: Points and Level System ⭐️ *PRIORITY*

**Goal:** Implement the points economy and level progression system

**Key Implementation:**
```typescript
// src/services/points-service.ts
import { PointsRepository } from '../repositories/points-repository';
import { UserRepository } from '../repositories/user-repository';
import { PointTransaction } from '../models/points';
import { EventEmitter } from '../lib/events';
import { logger } from '../lib/logger';

export class PointsService {
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
    private pointsRepo: PointsRepository,
    private userRepo: UserRepository
  ) {}
  
  async awardPoints(
    userId: string,
    amount: number,
    description: string,
    source?: string
  ): Promise<PointTransaction> {
    try {
      // Validate amount
      if (amount <= 0) {
        throw new Error('Points amount must be positive');
      }
      
      // Create transaction
      const transaction = await this.pointsRepo.createTransaction({
        userId,
        amount,
        description,
        source: source || 'system',
        type: 'credit',
        createdAt: new Date()
      });
      
      // Update user's total points
      const user = await this.userRepo.findById(userId);
      const currentPoints = user.points || 0;
      const newTotal = currentPoints + amount;
      
      // Check for level up
      const currentLevel = this.calculateLevel(currentPoints);
      const newLevel = this.calculateLevel(newTotal);
      
      await this.userRepo.update(userId, { points: newTotal });
      
      // If level changed, update user level and emit event
      if (newLevel > currentLevel) {
        await this.userRepo.update(userId, { level: newLevel });
        
        EventEmitter.emit('user.levelUp', {
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
      EventEmitter.emit('points.awarded', {
        userId,
        amount,
        description,
        source,
        newTotal,
        timestamp: new Date()
      });
      
      return transaction;
    } catch (error) {
      logger.error(
        { error, userId, amount, description },
        'Failed to award points'
      );
      throw error;
    }
  }
  
  calculateLevel(points: number): number {
    for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
      if (points >= this.levelThresholds[i]) {
        return i + 1;
      }
    }
    return 1; // Default to level 1
  }
  
  async getUserPointsHistory(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<PointTransaction[]> {
    return this.pointsRepo.findByUser(userId, { limit, offset });
  }
}
```

**Essential Requirements:**
- Points transaction system
- Level calculation and progression
- Points history tracking
- Level-up detection and celebration

**Key Best Practices:**
- Use transaction-based point system
- Implement level threshold progression
- Create detailed transaction history
- Design engaging level-up experience

**Key Potential Challenges:**
- Balancing point economy
- Managing point inflation
- Scaling transaction history
- Creating fair level progression

### Sub-Task 8.4: Gamification Rules Engine ⭐️ *PRIORITY*

**Goal:** Implement the rules engine for gamification mechanics

**Key Implementation:**
```typescript
// src/services/gamification-service.ts
import { AchievementService } from './achievement-service';
import { PointsService } from './points-service';
import { EventEmitter } from '../lib/events';
import { logger } from '../lib/logger';

export class GamificationService {
  private rules: GamificationRule[] = [];
  
  constructor(
    private achievementService: AchievementService,
    private pointsService: PointsService
  ) {
    // Register default rules
    this.registerDefaultRules();
    
    // Listen for events that trigger rule evaluation
    this.registerEventHandlers();
  }
  
  private registerDefaultRules() {
    // Content creation rules
    this.rules.push({
      id: 'content_creation',
      event: 'content.created',
      condition: () => true, // Always apply
      action: async (data) => {
        await this.pointsService.awardPoints(
          data.userId,
          10,
          'Created new content',
          'content'
        );
      }
    });
    
    // Battle participation rules
    this.rules.push({
      id: 'battle_participation',
      event: 'entry.created',
      condition: () => true, // Always apply
      action: async (data) => {
        await this.pointsService.awardPoints(
          data.userId,
          15,
          'Participated in battle',
          'battle'
        );
      }
    });
    
    // Battle voting rules
    this.rules.push({
      id: 'battle_voting',
      event: 'vote.created',
      condition: () => true, // Always apply
      action: async (data) => {
        await this.pointsService.awardPoints(
          data.userId,
          2,
          'Voted in battle',
          'battle'
        );
      }
    });
    
    // Battle results rules
    this.rules.push({
      id: 'battle_win',
      event: 'battle.result',
      condition: (data) => data.position === 1, // First place
      action: async (data) => {
        await this.pointsService.awardPoints(
          data.userId,
          50,
          'Won battle',
          'battle'
        );
      }
    });
    
    // More rules for different actions...
  }
  
  private registerEventHandlers() {
    // Handle all events defined in rules
    const events = [...new Set(this.rules.map(r => r.event))];
    
    for (const event of events) {
      EventEmitter.on(event, async (data) => {
        await this.processEvent(event, data);
      });
    }
  }
  
  async processEvent(event: string, data: any) {
    try {
      // Find matching rules
      const matchingRules = this.rules.filter(r => 
        r.event === event && r.condition(data)
      );
      
      // Apply rules
      for (const rule of matchingRules) {
        try {
          await rule.action(data);
        } catch (ruleError) {
          logger.error(
            { error: ruleError, rule: rule.id, event, data },
            'Rule action failed'
          );
        }
      }
    } catch (error) {
      logger.error(
        { error, event, data },
        'Failed to process gamification event'
      );
    }
  }
  
  // Methods to register custom rules, disable rules, etc.
}

interface GamificationRule {
  id: string;
  event: string;
  condition: (data: any) => boolean;
  action: (data: any) => Promise<void>;
}
```

**Essential Requirements:**
- Rule-based gamification engine
- Event-driven rule evaluation
- Point award rules
- Achievement progress rules

**Key Best Practices:**
- Use declarative rule definitions
- Implement conditional rule triggers
- Create extensible rule system
- Design for rule customization

**Key Potential Challenges:**
- Managing rule complexity
- Handling rule conflicts
- Scaling rule processing
- Balancing gamification mechanics

## Testing Strategy
- Achievement system functionality tests
- Points and level system tests
- Gamification rules engine tests
- Integration with other features tests

## Definition of Done
- [ ] Achievement data model implemented
- [ ] Achievement service with tracking working
- [ ] Points and level system implemented
- [ ] Gamification rules engine functional
- [ ] Event-based achievement progress
- [ ] Level-up detection and celebration
- [ ] Achievement unlocking notifications
- [ ] All achievement and gamification tests passing

---

# Task 9: Security Implementation

## Task Overview
- **Purpose:** Implement comprehensive security measures across the platform
- **Value:** Protects user data, platform integrity, and business reputation
- **Dependencies:** Core Infrastructure (Task 1), all feature implementations

## Required Knowledge
- **Key Documents:** `backend.md` (Security sections)
- **Technical Guidelines:** Security requirements, data protection
- **Phase 2 Dependencies:** Frontend security integration points

## Implementation Sub-Tasks

### Sub-Task 9.1: Authentication Security ⭐️ *PRIORITY*

**Goal:** Implement authentication-related security features

**Key Implementation:**
```typescript
// src/middleware/security.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimiter } from '../lib/rate-limiter';
import { logger } from '../lib/logger';

// Rate limiter for auth endpoints
const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts
  message: 'Too many failed login attempts, please try again later',
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || 
           req.ip || 
           'unknown';
  }
});

export async function authRateLimiter(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await authLimiter.consume(request, reply);
  } catch (error) {
    logger.warn(
      { ip: request.ip, path: request.url },
      'Rate limit exceeded for authentication'
    );
    
    return reply.code(429).send({
      error: {
        code: 'rate_limit_exceeded',
        message: 'Too many login attempts, please try again later'
      }
    });
  }
}

export function generateSecurityHeaders(
  request: FastifyRequest,
  reply: FastifyReply,
  done
) {
  // Set security headers
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
}
```

**Essential Requirements:**
- Authentication rate limiting
- Security headers implementation
- JWT security configuration
- Session management security

**Key Best Practices:**
- Implement strict rate limiting
- Use robust security headers
- Create secure token handling
- Design for defense-in-depth

**Key Potential Challenges:**
- Balancing security with usability
- Handling legitimate high traffic
- Configuring security headers properly
- Managing session security

### Sub-Task 9.2: Data Protection ⭐️ *PRIORITY*

**Goal:** Implement data protection and privacy features

**Key Implementation:**
```typescript
// src/services/data-protection-service.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { logger } from '../lib/logger';

export class DataProtectionService {
  private algorithm = 'aes-256-gcm';
  private encryptionKey: Buffer;
  
  constructor(config) {
    // Use environment variable for encryption key
    if (!config.encryption.key) {
      throw new Error('Encryption key is required');
    }
    
    // Convert hex key to buffer
    this.encryptionKey = Buffer.from(config.encryption.key, 'hex');
    
    // Validate key length
    if (this.encryptionKey.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (64 hex chars)');
    }
  }
  
  encrypt(text: string): { encryptedData: string, iv: string, tag: string } {
    try {
      // Generate initialization vector
      const iv = randomBytes(16);
      
      // Create cipher
      const cipher = createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      );
      
      // Encrypt data
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get auth tag
      const tag = cipher.getAuthTag().toString('hex');
      
      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag
      };
    } catch (error) {
      logger.error({ error }, 'Encryption failed');
      throw new Error('Failed to encrypt data');
    }
  }
  
  decrypt(encryptedData: string, iv: string, tag: string): string {
    try {
      // Create decipher
      const decipher = createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      );
      
      // Set auth tag
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error({ error }, 'Decryption failed');
      throw new Error('Failed to decrypt data');
    }
  }
  
  // Additional methods for hashing, data masking, etc.
}
```

**Essential Requirements:**
- Sensitive data encryption
- PII data protection
- Data access logging
- Privacy controls implementation

**Key Best Practices:**
- Use strong encryption algorithms
- Implement proper key management
- Create data access audit trails
- Design for data minimization

**Key Potential Challenges:**
- Balancing access with protection
- Managing encryption performance
- Handling key rotation
- Implementing proper access controls

### Sub-Task 9.3: API Security ⭐️ *PRIORITY*

**Goal:** Implement API-specific security measures

**Key Implementation:**
```typescript
// src/middleware/api-security.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimiter } from '../lib/rate-limiter';
import { validateRequestSchema } from '../validators/request-validator';
import { logger } from '../lib/logger';

// Rate limiter for API endpoints
const apiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  keyGenerator: (req) => {
    // Use authenticated user ID if available, otherwise IP
    return req.userId || 
           req.headers['x-forwarded-for'] || 
           req.ip || 
           'unknown';
  }
});

export async function apiRateLimiter(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await apiLimiter.consume(request, reply);
  } catch (error) {
    logger.warn(
      { userId: request.userId, ip: request.ip, path: request.url },
      'API rate limit exceeded'
    );
    
    return reply.code(429).send({
      error: {
        code: 'rate_limit_exceeded',
        message: 'Too many requests, please try again later',
        details: {
          retryAfter: error.headers['Retry-After'] || 60
        }
      }
    });
  }
}

export async function validateRequest(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Skip validation if no schema defined
  if (!request.routeSchema || !request.routeSchema.body) {
    return;
  }
  
  try {
    // Validate request against schema
    await validateRequestSchema(request);
  } catch (error) {
    logger.warn(
      { userId: request.userId, path: request.url, error },
      'Request validation failed'
    );
    
    return reply.code(400).send({
      error: {
        code: 'validation_error',
        message: 'Invalid request data',
        details: error.details || []
      }
    });
  }
}

export async function csrfProtection(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Skip for GET/HEAD requests
  if (['GET', 'HEAD'].includes(request.method)) {
    return;
  }
  
  const csrfToken = request.headers['x-csrf-token'];
  const storedToken = request.session?.csrfToken;
  
  if (!csrfToken || csrfToken !== storedToken) {
    logger.warn(
      { userId: request.userId, ip: request.ip, path: request.url },
      'CSRF token validation failed'
    );
    
    return reply.code(403).send({
      error: {
        code: 'invalid_csrf_token',
        message: 'Invalid or missing CSRF token'
      }
    });
  }
}
```

**Essential Requirements:**
- API rate limiting
- Request validation
- CSRF protection
- Proper error responses

**Key Best Practices:**
- Implement tiered rate limiting
- Use schema validation
- Create clear security error messages
- Design for secure defaults

**Key Potential Challenges:**
- Balancing rate limits with usability
- Managing complex validation rules
- Implementing effective CSRF protection
- Handling legitimate high traffic

### Sub-Task 9.4: Audit and Monitoring ⭐️ *PRIORITY*

**Goal:** Implement security audit and monitoring systems

**Key Implementation:**
```typescript
// src/services/audit-service.ts
import { AuditRepository } from '../repositories/audit-repository';
import { logger } from '../lib/logger';

export enum AuditActionType {
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PROFILE_UPDATE = 'user.profile.update',
  USER_WALLET_CONNECT = 'user.wallet.connect',
  USER_WALLET_DISCONNECT = 'user.wallet.disconnect',
  ADMIN_ACTION = 'admin.action',
  SENSITIVE_DATA_ACCESS = 'data.sensitive.access',
  SECURITY_VIOLATION = 'security.violation'
}

export class AuditService {
  constructor(private auditRepo: AuditRepository) {}
  
  async logAction(
    actionType: AuditActionType,
    userId: string,
    metadata: any = {},
    severity: 'low' | 'medium' | 'high' = 'low'
  ) {
    try {
      const auditLog = await this.auditRepo.create({
        actionType,
        userId,
        metadata,
        severity,
        timestamp: new Date(),
        ipAddress: metadata.ipAddress || 'unknown',
        userAgent: metadata.userAgent || 'unknown'
      });
      
      // For high severity events, also log to application logs
      if (severity === 'high') {
        logger.warn(
          { actionType, userId, metadata },
          'High severity audit event'
        );
      }
      
      return auditLog;
    } catch (error) {
      logger.error(
        { error, actionType, userId },
        'Failed to create audit log'
      );
      
      // Even if DB logging fails, ensure we log critical events
      if (severity === 'high') {
        logger.error(
          { actionType, userId, metadata },
          'HIGH SEVERITY AUDIT EVENT (DB logging failed)'
        );
      }
    }
  }
  
  async getAuditLogs(
    filters: {
      userId?: string;
      actionType?: AuditActionType;
      severity?: string;
      startDate?: Date;
      endDate?: Date;
    },
    pagination: {
      limit?: number;
      offset?: number;
    } = {}
  ) {
    return this.auditRepo.find(filters, pagination);
  }
  
  async getUserAuditTrail(userId: string, limit = 20, offset = 0) {
    return this.getAuditLogs(
      { userId },
      { limit, offset }
    );
  }
}
```

**Essential Requirements:**
- Security event logging
- Audit trail creation
- Anomaly detection
- Compliance reporting

**Key Best Practices:**
- Create comprehensive audit logs
- Implement secure log storage
- Design anomaly detection rules
- Support compliance requirements

**Key Potential Challenges:**
- Managing log volume
- Balancing detail with performance
- Implementing effective detection
- Meeting compliance requirements

## Testing Strategy
- Authentication security tests
- Data protection tests
- API security tests
- Audit and monitoring tests

## Definition of Done
- [ ] Authentication security measures implemented
- [ ] Data protection features working
- [ ] API security measures implemented
- [ ] Audit and monitoring system functional
- [ ] Security headers configured
- [ ] Rate limiting working correctly
- [ ] CSRF protection implemented
- [ ] All security tests passing

---

# Task 10: Performance Optimization

## Task Overview
- **Purpose:** Optimize backend performance to meet scalability requirements
- **Value:** Ensures the platform can scale to support market cap progression goals
- **Dependencies:** All feature implementations

## Required Knowledge
- **Key Documents:** `backend.md` (Performance sections)
- **Technical Guidelines:** Performance requirements, scalability targets
- **Phase 2 Dependencies:** Frontend performance expectations

## Implementation Sub-Tasks

### Sub-Task 10.1: Caching Strategy ⭐️ *PRIORITY*

**Goal:** Implement comprehensive caching system

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
}
```

**Essential Requirements:**
- Redis-based cache implementation
- Adaptive TTL based on system load
- Pattern-based cache invalidation
- Error handling and fallbacks

**Key Best Practices:**
- Use distributed caching system
- Implement strategic TTL settings
- Create clear invalidation patterns
- Design fallback behavior

**Key Potential Challenges:**
- Cache consistency management
- Invalidation complexity
- Redis connection reliability
- Optimizing cache hit rates

### Sub-Task 10.2: Database Optimization ⭐️ *PRIORITY*

**Goal:** Optimize database queries and structure

**Key Implementation:**
```typescript
// src/repositories/base-repository.ts
import { Pool } from 'pg';
import { CacheService } from '../services/cache-service';
import { logger } from '../lib/logger';

export abstract class BaseRepository<T> {
  constructor(
    protected pool: Pool,
    protected tableName: string,
    protected cacheService: CacheService
  ) {}
  
  // Example optimized query method with caching
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
  
  // Optimized bulk find with single query
  async findByIds(ids: string[]): Promise<T[]> {
    if (ids.length === 0) {
      return [];
    }
    
    try {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      const result = await this.pool.query(
        `SELECT * FROM ${this.tableName} WHERE id IN (${placeholders})`,
        ids
      );
      
      return result.rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      logger.error(
        { error, tableName: this.tableName, ids },
        'Failed to find by IDs'
      );
      throw error;
    }
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
  
  // Other repository methods...
  
  protected abstract mapRowToEntity(row: any): T;
}
```

**Essential Requirements:**
- Query optimization patterns
- Indexing strategy
- Connection pooling optimization
- Transaction management

**Key Best Practices:**
- Implement efficient query patterns
- Use proper database indexes
- Create optimized data access
- Design for transaction integrity

**Key Potential Challenges:**
- Complex query optimization
- Index maintenance
- Connection pool optimization
- Transaction boundary design

### Sub-Task 10.3: API Optimization ⭐️ *PRIORITY*

**Goal:** Optimize API response time and throughput

**Key Implementation:**
```typescript
// src/middleware/performance.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { performance } from 'perf_hooks';
import { logger } from '../lib/logger';
import { MetricsService } from '../services/metrics-service';

export function requestTracking(metricsService: MetricsService) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip tracking for health check endpoints
    if (request.url === '/health') {
      return;
    }
    
    // Start tracking request
    const startTime = performance.now();
    
    // Add tracking ID to request
    const requestId = request.id;
    
    // Add hook for when response is sent
    reply.addHook('onSend', async (_, payload) => {
      const responseTime = performance.now() - startTime;
      
      // Log slow requests
      if (responseTime > 500) {
        logger.warn({
          requestId,
          method: request.method,
          url: request.url,
          responseTime: `${responseTime.toFixed(2)}ms`,
          userId: request.userId
        }, 'Slow request detected');
      }
      
      // Record metrics
      metricsService.recordApiResponseTime(
        request.method,
        request.routerPath || request.url,
        responseTime
      );
      
      // Record payload size
      const payloadSize = typeof payload === 'string' 
        ? Buffer.byteLength(payload)
        : undefined;
        
      if (payloadSize) {
        metricsService.recordResponseSize(
          request.method,
          request.routerPath || request.url,
          payloadSize
        );
      }
      
      return payload;
    });
  };
}

export function compressionMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  done
) {
  // Check if client accepts compression
  const acceptEncoding = request.headers['accept-encoding'];
  
  if (acceptEncoding && acceptEncoding.includes('gzip')) {
    reply.header('Content-Encoding', 'gzip');
    // Fastify will handle compression
  }
  
  done();
}
```

**Essential Requirements:**
- Response time optimization
- Payload size reduction
- Route-specific optimizations
- Performance monitoring

**Key Best Practices:**
- Implement request tracking
- Use response compression
- Create targeted optimizations
- Design for observability

**Key Potential Challenges:**
- Identifying performance bottlenecks
- Balancing optimization with readability
- Managing response compression
- Implementing granular monitoring

### Sub-Task 10.4: Background Processing ⭐️ *PRIORITY*

**Goal:** Implement efficient background job processing

**Key Implementation:**
```typescript
// src/services/job-queue-service.ts
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '../lib/logger';

export enum JobType {
  PROCESS_CONTENT = 'process_content',
  CHECK_ACHIEVEMENT = 'check_achievement',
  UPDATE_BATTLE_STATE = 'update_battle_state',
  CALCULATE_RESULTS = 'calculate_results',
  SEND_NOTIFICATION = 'send_notification',
  UPDATE_LEADERBOARD = 'update_leaderboard'
}

export class JobQueueService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private schedulers: Map<string, QueueScheduler> = new Map();
  private processors: Map<string, (job: any) => Promise<any>> = new Map();
  private redis: Redis;
  
  constructor(config) {
    this.redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: null
    });
    
    // Initialize queues
    this.setupQueues();
  }
  
  private setupQueues() {
    // Create queues for different job types
    Object.values(JobType).forEach(jobType => {
      // Create queue
      const queue = new Queue(jobType, {
        connection: this.redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          },
          removeOnComplete: 500, // Keep last 500 completed jobs
          removeOnFail: 5000     // Keep last 5000 failed jobs
        }
      });
      
      this.queues.set(jobType, queue);
      
      // Create scheduler
      const scheduler = new QueueScheduler(jobType, {
        connection: this.redis
      });
      
      this.schedulers.set(jobType, scheduler);
    });
    
    logger.info('Job queues initialized');
  }
  
  registerProcessor(
    jobType: JobType,
    processor: (job: any) => Promise<any>,
    options: {
      concurrency?: number
    } = {}
  ) {
    this.processors.set(jobType, processor);
    
    // Create worker
    const worker = new Worker(
      jobType,
      processor,
      {
        connection: this.redis,
        concurrency: options.concurrency || 1
      }
    );
    
    // Handle worker events
    worker.on('completed', (job) => {
      logger.info(
        { jobId: job.id, jobName: job.name },
        'Job completed successfully'
      );
    });
    
    worker.on('failed', (job, error) => {
      logger.error(
        { jobId: job?.id, jobName: job?.name, error },
        'Job failed'
      );
    });
    
    this.workers.set(jobType, worker);
    
    logger.info(
      { jobType, concurrency: options.concurrency || 1 },
      'Job processor registered'
    );
  }
  
  async addJob(
    type: JobType,
    data: any,
    options: {
      delay?: number;
      priority?: number;
      attempts?: number;
    } = {}
  ) {
    const queue = this.queues.get(type);
    
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }
    
    return queue.add(type, data, options);
  }
  
  async scheduleJob(
    type: JobType,
    data: any,
    cron: string,
    options: {
      priority?: number;
      attempts?: number;
    } = {}
  ) {
    const queue = this.queues.get(type);
    
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }
    
    return queue.add(
      type,
      data,
      {
        repeat: {
          pattern: cron
        },
        ...options
      }
    );
  }
  
  async getJobCounts() {
    const counts = {};
    
    for (const [type, queue] of this.queues.entries()) {
      counts[type] = await queue.getJobCounts(
        'active',
        'completed',
        'delayed',
        'failed',
        'waiting'
      );
    }
    
    return counts;
  }
}
```

**Essential Requirements:**
- Queue-based job processing
- Scheduled task management
- Priority-based processing
- Job status tracking

**Key Best Practices:**
- Use reliable job queuing
- Implement job retries
- Create failure handling
- Design for monitoring

**Key Potential Challenges:**
- Managing processing backlogs
- Scaling worker processes
- Handling persistent failures
- Implementing job priorities

## Testing Strategy
- Caching strategy performance tests
- Database query optimization tests
- API response time tests
- Background processing throughput tests

## Definition of Done
- [ ] Caching strategy implemented
- [ ] Database optimizations implemented
- [ ] API performance optimizations working
- [ ] Background processing system functional
- [ ] Performance monitoring implemented
- [ ] System meets response time targets
- [ ] Optimizations work under high load
- [ ] All performance tests passing

---

## Final Phase 3 Deliverable

**Backend System:**
- Complete API implementation for all frontend features
- Authentication and authorization system
- Battle system with entry, voting, and results functionality
- Content management with moderation support
- Community features with social interactions
- Blockchain connectivity with wallet verification
- Real-time communication infrastructure
- Achievement and gamification system
- Comprehensive security implementation
- Performance-optimized infrastructure

## Implementation Guidelines
1. Follow service-oriented architecture principles
2. Implement thorough error handling and validation
3. Apply consistent security practices across all features
4. Use transaction boundaries for data integrity
5. Implement proper logging and monitoring
6. Create clear API documentation for frontend integration
7. Design for performance at scale
8. Build with testability in mind

Upon completion of Phase 3, the backend will provide all necessary functionality for the frontend to create the complete Wild 'n Out Meme Coin Platform experience, supporting the path to $500M+ market cap through reliable, secure, and performant operation.
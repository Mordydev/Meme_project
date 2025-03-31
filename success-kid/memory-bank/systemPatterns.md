# System Patterns: Success Kid Backend

## 1. Core Architecture

The platform utilizes a modern, serverless-oriented architecture:

```mermaid
graph TD
    subgraph Client Tier
        ClientApps[Client Applications (Next.js App Router)]
    end

    subgraph Edge Tier
        Edge[CDN & Edge Functions (Cloudflare/Vercel)]
    end

    subgraph API Tier
        AuthService[Auth Service (Clerk)]
        APILayer[API Layer (Fastify)]
        WebSocketService[WebSocket Service (Socket.io)]
    end

    subgraph Service & Data Tier
        NeonDB[Neon PostgreSQL (Drizzle ORM)]
        Redis[Redis Services (Cache, Pub/Sub, Queue)]
        BlockchainService[Blockchain Service (Web3.js, Phantom)]
        VercelBlob[Vercel Blob (Media Storage)]
    end

    ClientApps --> Edge;
    Edge --> APILayer;
    ClientApps <-.-> AuthService;
    APILayer <-.-> AuthService;
    APILayer --> NeonDB;
    APILayer --> Redis;
    APILayer --> BlockchainService;
    APILayer --> VercelBlob;
    APILayer -- Events --> WebSocketService;
    WebSocketService -- Pub/Sub --> Redis;
    WebSocketService --> ClientApps;
```

*   **Client:** Next.js App Router with React Server/Client Components.
*   **Edge:** CDN/Edge functions for performance and caching.
*   **Authentication:** Managed by Clerk.
*   **API Layer:** Fastify for RESTful endpoints, Socket.io for WebSockets, integrated with Redis for scaling.
*   **Data Storage:** Neon PostgreSQL (managed via Drizzle ORM) for primary data, Vercel Blob for media.
*   **Caching/Messaging/Jobs:** Redis handles caching, Pub/Sub for events, and background job queuing (BullMQ).
*   **Blockchain Interaction:** Dedicated service using Web3.js, potentially integrating with Phantom wallet.

## 2. Layered Architecture (Backend - `apps/backend/src/`)

The backend follows a layered architecture for separation of concerns:

*   **`api/`**: Handles HTTP requests, defines routes, validates input/output schemas (Zod), and calls services. Thin layer, delegates logic. Organized by feature.
*   **`services/`**: Contains core business logic. Encapsulates specific domains (Points, Achievements, Content, Market, Auth, etc.). Interacts with repositories and other services.
*   **`repositories/`**: Data access layer. Interacts directly with the database (Drizzle ORM) and cache (`CacheService`). Uses `BaseRepository` pattern.
*   **`lib/`**: Shared utilities, libraries, and core functionalities like error handling (`errors/`), logging (`logger/`), caching (`cache.ts`), Redis client (`redis/`), event bus (`event-bus.ts`), authentication helpers (`clerk/`, `rbac/`), etc.
*   **`middleware/`**: Shared Fastify middleware (Authentication, Rate Limiting, Validation, Security Headers).
*   **`database/`**: Drizzle schema definitions, migrations, and DB client setup.
*   **`websockets/`**: WebSocket server setup, connection management, event handlers (listening to Redis Pub/Sub).
*   **`jobs/`**: Background job definitions (queues) and worker implementations (using BullMQ).
*   **`models/`**: TypeScript interfaces/types defining data structures (entities, DTOs).

## 3. Key Technical Decisions & Patterns

*   **Framework:** Fastify (API), Next.js App Router (Frontend).
*   **Database:** Neon PostgreSQL with Drizzle ORM.
*   **Authentication:** Clerk.
*   **Real-time:** Socket.io with Redis Adapter for scaling.
*   **Caching:** Multi-level (Edge, Redis via `CacheService`, HTTP headers). Stale-While-Revalidate (SWR) pattern encouraged.
*   **Background Jobs:** BullMQ with Redis.
*   **Media Storage:** Vercel Blob.
*   **State Management (Frontend):** Zustand (example provided).
*   **Styling (Frontend):** Tailwind CSS.
*   **Naming Convention:** `camelCase` enforced in TypeScript codebase. Drizzle handles DB mapping (camelCase in TS -> snake_case in DB).
*   **Error Handling:** Standardized using `handleApiError` utility and custom `AppError` classes.
*   **API Structure:** Standardized module structure (`handler.ts`, `routes.ts`, `schema.ts`, `types.ts`). Standard response envelope (`{ data, meta, pagination }`).
*   **Validation:** Zod schemas for all API inputs/outputs.
*   **Points Verification:** Strategy Pattern (`services/points/verification/strategies/`).
*   **Market Data Providers:** Adapter Pattern likely used (`services/market/providers/`).
*   **Data Access:** Repository Pattern (`repositories/`).
*   **Event Communication:** Event Bus pattern using Redis Pub/Sub (`lib/event-bus.ts`). Events published *after* successful state changes.
*   **Dependency Injection:** Services often receive dependencies (repositories, other services, utilities) via constructor injection (managed in `services/index.ts`).

## 4. Component Relationships & Flow Examples

*   **Content Creation:** API Handler -> `ContentService.createContent` -> `MediaService.verifyMedia` (if media) -> `ContentRepository.create` -> `PointsService.awardPoints` -> `EventBus.publish(CONTENT_CREATED)`.
*   **Points Award (via Achievement):** External Event (e.g., Content Created) -> Redis Pub/Sub -> Achievement Subscriber -> `AchievementService.checkAndAward` -> Criteria Evaluator -> `AchievementRepository.updateProgress` -> (If unlocked) `PointsService.awardPoints` & `EventBus.publish(ACHIEVEMENT_UNLOCKED)`.
*   **Real-time Notification:** Service Action -> `EventBus.publish` -> Redis Pub/Sub -> WebSocket Handler -> Format Notification -> `io.to(userRoom).emit`.
*   **Dashboard Request:** API Handler -> `Promise.allSettled`([`PointsService.getSummary`, `AchievementService.getSummary`, ...]) -> Aggregate Results -> `CacheService.set` -> Format Response.

## 5. Critical Implementation Paths

*   **Points System:** Accurate tracking, verification, caps, trends, redemption.
*   **Achievement System:** Criteria evaluation, progress tracking, event subscription, points awarding.
*   **Content Management:** CRUD, feeds, reactions, drafts, media integration.
*   **Market Data:** Reliable external API fetching, caching, milestone tracking.
*   **Dashboard API:** Efficient aggregation, caching, resilience to partial failures.
*   **Real-time Notifications:** Secure connection, reliable event handling and delivery.
*   **Security:** Authentication, authorization, rate limiting, input validation, anti-exploitation.
*   **Performance:** Caching, database optimization, background jobs.

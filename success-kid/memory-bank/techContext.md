# Tech Context: Success Kid Backend

## 1. Core Technologies

*   **Backend Framework:** Fastify (Node.js)
*   **Frontend Framework:** Next.js (App Router)
*   **Language:** TypeScript (Strict mode preferred)
*   **Database:** Neon PostgreSQL (Serverless Postgres)
*   **ORM:** Drizzle ORM (with Drizzle Kit for migrations)
*   **Authentication:** Clerk
*   **Real-time Communication:** Socket.io
*   **Caching/Messaging/Jobs:** Redis (using `ioredis` client, BullMQ for jobs)
*   **Media Storage:** Vercel Blob (`@vercel/blob` SDK)
*   **Blockchain Interaction:** Web3.js (specific library/provider TBD, Phantom Connect mentioned)
*   **API Schema/Validation:** Zod
*   **Package Manager:** pnpm (using workspaces for monorepo)
*   **Testing:** Vitest (Unit/Integration), Supertest (API testing), k6/Artillery (Performance), Playwright (E2E)
*   **Linting/Formatting:** ESLint, Prettier
*   **Deployment:** Vercel (implied by Vercel Blob usage and Next.js focus)

## 2. Development Setup & Environment

*   **Monorepo:** Managed with pnpm workspaces and Turborepo (implied by `turbo.json`).
*   **Environment Variables:** Managed via `.env` files (e.g., `DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, `BLOB_READ_WRITE_TOKEN`). See `.env.example`.
*   **Database Migrations:** Handled by Drizzle Kit (`pnpm drizzle-kit generate:pg` and `pnpm drizzle-kit push:pg` or equivalent migration script).
*   **Containerization:** Docker setup available (`docker/`) for development and potentially deployment.

## 3. Key Dependencies & Libraries (Backend - `apps/backend`)

*   `@fastify/`: Core framework plugins (cors, helmet, rate-limit, multipart, etc.)
*   `@neondatabase/serverless`: Neon DB driver.
*   `drizzle-orm`, `drizzle-kit`: ORM and migration tools.
*   `@clerk/fastify`: Clerk integration.
*   `socket.io`, `@socket.io/redis-adapter`: WebSocket implementation and scaling.
*   `ioredis`: Redis client.
*   `bullmq`: Background job processing.
*   `zod`: Schema validation.
*   `@vercel/blob`: Vercel Blob storage client.
*   `axios`: HTTP client (used for external API calls, e.g., Market Data).
*   `nanoid`: Unique ID generation (used in Media Service).
*   `pino`, `pino-pretty`: Logging.
*   `web3`: Blockchain interaction (likely).

## 4. Technical Constraints & Considerations

*   **Serverless Environment:** Neon DB is serverless; consider connection pooling implications. Vercel functions have execution limits.
*   **Rate Limits:** External APIs (Clerk, Market Data Providers, Vercel Blob) have rate limits. Internal rate limiting is also implemented.
*   **Cold Starts:** Potential issue with serverless functions; keep bundles small.
*   **Cache Invalidation:** Requires careful management, especially with multi-level caching.
*   **Database Performance:** Neon scales, but efficient queries and indexing are still crucial.
*   **TypeScript Strictness:** Aim for high type safety, avoid `any`. Resolve TS errors promptly.
*   **Naming Conventions:** Stick to `camelCase` in TS. Drizzle handles DB mapping.

## 5. Tool Usage Patterns

*   **Drizzle Kit:** Used for generating and applying database migrations based on schema changes.
*   **pnpm:** Used for installing dependencies and running scripts within the monorepo workspace.
*   **ESLint/Prettier:** Integrated for code quality and consistency.
*   **Vitest:** Used for running unit and integration tests.
*   **Supertest:** Used for testing API endpoints during integration tests.
*   **BullMQ:** Used for defining queues, creating workers, and enqueueing background jobs.
*   **Zod:** Used extensively in API layers (`api/**/schema.ts`) for request/response validation.

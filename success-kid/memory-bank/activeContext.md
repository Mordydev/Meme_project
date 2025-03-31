# Active Context: Success Kid Backend (as of 2025-03-31 AM)

## 1. Current Focus

*   **Primary Goal:** Begin Phase 3, Task 8: Complete WebSocket Notification System. This involves setting up the Socket.io server, implementing authentication, and handling connections/events.
*   **Secondary Goal:** Address remaining TODOs and implementation details for Task 7 (Service APIs), particularly implementing Market Provider logic and refining ProfileService updates.
*   **Standardization:** Continue ensuring all new and existing code adheres to the `camelCase` convention in TypeScript and utilizes standard API response/error patterns.

## 2. Recent Changes & Learnings

*   **Task 7 Structure Completed:** API modules (routes, handlers, schemas, types) created or updated for Achievements, Content (Drafts/Reactions), Market Data, and Profiles. Services were updated/instantiated where necessary (e.g., `MarketService`, `DraftService`, `ProfileService`). Handlers were connected to services.
*   **Error Resolution:** Resolved several persistent TypeScript errors related to missing dependencies (`@types/node`, `nanoid`, `@fastify/multipart`), Fastify request types (`.file()`, `.locals`, `.routerPath`), service instantiation (`MediaServiceAdapter`), and type mismatches (`AchievementService`, `AchievementRepository`, `ProfileService`).
*   **Skipped Errors:** Temporarily skipped fixing `ErrorCode.EXTERNAL_API_ERROR` usage in Market providers.
*   **Refactoring:** Continued alignment with layered architecture and `camelCase` standard.

## 3. Next Steps (Immediate)

1.  **Begin Task 8:** Start WebSocket implementation by setting up the server and authentication middleware (replacing placeholder logic in `websockets/index.ts`).
2.  **Implement Market Providers (Task 7):** Replace placeholder logic in `PriceProvider` and `TransactionProvider` with actual external API calls (DexScreener, SolScan).
3.  **Refine Profile Service (Task 7):** Implement a more robust `updateProfile` method in `ProfileService` to handle partial updates efficiently.
4.  **Database Migration (Task 7):** Generate and apply migration for the `achievements.isSecret` column.
5.  **Address TODOs:** Review remaining TODOs in recently modified files.

## 4. Key Patterns & Preferences Reminder

*   **Layered Architecture:** Strictly adhere to API -> Service -> Repository flow.
*   **`camelCase`:** Use exclusively in TypeScript.
*   **Error Handling:** Use `handleApiError` and `AppError`.
*   **Validation:** Zod schemas are mandatory for API boundaries.
*   **Async/Await:** Standard for handling promises.
*   **Dependency Injection:** Use constructor injection for services/repositories (see `services/index.ts`).
*   **Event Bus:** Publish events *after* successful state changes.
*   **Caching:** Use `CacheService` (`getOrSet`, `invalidate`) strategically.

## 5. Open Questions / Decisions

*   Final implementation strategy for Achievement event subscribers (`services/achievements/subscribers/`).
*   Specific external APIs and data mapping for `MarketService` providers.
*   Resolution strategy for the `BaseRepository` transaction type error.

Okay, here is the Detailed Implementation Plan for **Phase 2: Foundation: Auth & Backend Basics**.

## **Detailed Implementation Plan**

**Phase:** Phase 2: Foundation: Auth & Backend Basics
**Based on Strategic Implementation Roadmap Version:** v1.0
**Detailed Plan Version:** v1.0
**Date Prepared:** May 8, 2025

---

### 1. Phase Initialization & Contextual Overview

*   **A. Phase Recap (from Strategic Roadmap):**
    *   **Phase Name:** Foundation: Auth & Backend Basics
    *   **Primary Goal & Focus:** Integrate user authentication, set up the database connection and core schemas, enable persistent score submission, and implement foundational frontend state management and UI structure.
    *   **Key Deliverables (Components):** Clerk Authentication Integration, Next.js Project Structure (Refinement), Zustand Store Setup, Basic HUD (React Integration), Drizzle ORM & Neon DB Setup, User & Score Schemas, Score Submission API/Action (Protected), Basic Play Limit Logic (Anon vs. Auth).
    *   **Success Criteria:** Users can sign up/log in via Clerk, Authenticated game scores are successfully saved to the Neon DB via Drizzle, Basic play limits are enforced based on auth status, Game state (score) is managed via Zustand and reflected in the React HUD, Stable Next.js integration with backend components.
    *   **Business Value Delivered:** Enables user accounts, paves the way for persistent scoring, leaderboards, and rewards, transitions the prototype towards a full application architecture.
*   **B. Phase-Specific Objectives & Technical Goals:**
    1.  **Secure User Authentication:** Implement Clerk authentication robustly for user signup, login, and session management across the Next.js application.
    2.  **Establish Database Connectivity & Schema:** Configure Drizzle ORM to connect reliably to the Neon PostgreSQL database and define/migrate the initial `users` and `scores` tables.
    3.  **Enable Persistent Scoring:** Create a secure mechanism (Server Action preferred) for authenticated users to submit their game scores, storing them accurately in the database.
    4.  **Implement Frontend State Management:** Set up Zustand store to manage core game UI state (score, auth status, user ID) and decouple game logic updates from direct DOM manipulation.
    5.  **Enforce Basic Access Control:** Implement logic to differentiate gameplay limits between anonymous and authenticated users.
*   **C. Key Phase Milestones (Internal Checkpoints):**
    1.  **Milestone 2.1 (DB Ready):** Drizzle ORM configured, Neon connection established, `users` and `scores` schemas defined and migrated successfully.
    2.  **Milestone 2.2 (Auth Integrated):** Clerk setup complete in Next.js; users can sign up, log in, log out; user state (`userId`, signed-in status) accessible in frontend components and backend actions.
    3.  **Milestone 2.3 (State Management Live):** Zustand store created; game score updates from Phase 1 Three.js logic now update the Zustand store; React HUD component displays score from Zustand.
    4.  **Milestone 2.4 (Score Submission E2E):** Authenticated user completes a game (simulated score ok), score is submitted via Server Action/API, and verified in the Neon database linked to the correct user ID. Play limit logic blocks excessive plays.

---

### 2. Detailed Component Implementation Breakdown

---

#### Component: Clerk Authentication Integration ([Auth & Security]) ([Frontend/Backend])

*   **A. Component Overview & Purpose:** Integrates Clerk into the Next.js application to handle all user authentication flows (signup, login, logout, session management) and provide user context. (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Next.js App Router, Clerk (React SDK, Node SDK for backend if needed), React.
    *   **Architectural Patterns:** Clerk Provider wrapping the application layout, utilization of Clerk hooks (`useUser`, `useAuth`) and components (`<SignInButton>`, `<UserButton>`, potentially custom flows). Middleware for protecting routes/actions.
    *   **Key Libraries:** `@clerk/nextjs`.
    *   **UI Elements:** Use Clerk's pre-built components initially for sign-in/sign-up flows, user button.
*   **C. Actionable Implementation Tasks & Sub-Tasks (Sequenced):**
    *   **Task 1: Clerk Account Setup & Configuration (Effort: S)**
        *   Sub-task 1.1: Set up Clerk application in the Clerk dashboard.
        *   Sub-task 1.2: Obtain API keys (Publishable Key, Secret Key). Configure allowed origins, redirect URLs, and preferred sign-in methods.
        *   Sub-task 1.3: Add Clerk API keys securely to Next.js environment variables (`.env.local`, Vercel env vars). Use prefixes like `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
    *   **Task 2: Integrate Clerk Provider (Effort: S)**
        *   Sub-task 2.1: Install `@clerk/nextjs`.
        *   Sub-task 2.2: Wrap the root layout (`app/layout.tsx`) with `<ClerkProvider>`.
        *   Sub-task 2.3: Configure Clerk provider settings if necessary (e.g., appearance).
    *   **Task 3: Implement Frontend Auth Components (Effort: S)**
        *   Sub-task 3.1: Add `<SignInButton>`, `<SignUpButton>`, `<SignOutButton>`, and `<UserButton>` components to the application header or a designated auth section.
        *   Sub-task 3.2: Test basic sign-up, sign-in, sign-out flows using Clerk's default UI.
    *   **Task 4: Implement Auth Middleware (Effort: S)**
        *   Sub-task 4.1: Create `middleware.ts` at the project root.
        *   Sub-task 4.2: Use `authMiddleware` from Clerk to protect specific routes or default to protecting most routes except public ones (like `/`). Configure `publicRoutes`. Ensure the score submission endpoint will require authentication.
    *   **Task 5: Access User State (Effort: S)**
        *   Sub-task 5.1: Use `useAuth` hook in relevant client components to get `userId` and `isSignedIn` status.
        *   Sub-task 5.2: Use `auth()` helper in Server Actions/API Routes to get user context on the backend.
*   **D. Key Integration Points:** Wraps the entire Next.js app. Provides user context (`userId`, `isSignedIn`) to frontend components and backend logic (API/Actions). Used by Score Submission logic for user association. Used by Play Limit Logic.
*   **E. Acceptance Criteria:**
    *   AC1: Users can successfully sign up using configured methods.
    *   AC2: Users can successfully sign in and sign out.
    *   AC3: User session is persisted correctly. `<UserButton>` displays user info when signed in.
    *   AC4: Middleware correctly protects designated routes/actions, redirecting unauthenticated users.
    *   AC5: `userId` and `isSignedIn` status are correctly accessible on both client and server-side where needed.
*   **F. Implementation Guidance:** Follow Clerk's official Next.js App Router documentation closely. Start with Clerk's hosted pages/components for simplicity. Securely manage API keys using environment variables. Understand how `authMiddleware` works for route protection.
*   **G. Component-Specific Risks:** Misconfiguration of Clerk settings or environment variables; incorrect middleware setup leading to security holes or blocked access; difficulty customizing Clerk UI later if needed.
*   **H. Testing Considerations:** Test all auth flows (signup, signin, signout). Test access to protected vs. public routes. Verify user context is available.
*   **I. Definition of Done (DoD):** Clerk integrated, core auth flows functional, middleware protects routes, user context accessible.

---

#### Component: Next.js Project Structure (Refinement) ([Frontend/Backend])

*   **A. Component Overview & Purpose:** Refine the project structure established in Phase 1 to incorporate backend logic, state management, database interactions, and modular game code. (Roadmap Priority: High, Est. Effort: Low)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Structure:** Follow standard Next.js App Router conventions, organizing code logically.
    *   **Folders:** `app/` (routing), `components/` (React UI), `lib/` (shared logic: `game/`, `db/`, `actions/`, `utils/`), `store/` (Zustand), `styles/`.
    *   **Modularity:** Ensure game logic remains separate from React components. Database logic separate from API/actions.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Organize Game Logic Modules (Effort: S)**
        *   Sub-task 1.1: Move Phase 1 Three.js code into the `/lib/game/` structure defined in the Phase 1 plan (e.g., `core/`, `player/`, `assets/`, `managers/`).
        *   Sub-task 1.2: Ensure modules export necessary classes/functions. Update imports in `GameCanvas.tsx`.
    *   **Task 2: Create Backend/Data Folders (Effort: S)**
        *   Sub-task 2.1: Create `lib/db/` for Drizzle schema and queries.
        *   Sub-task 2.2: Create `lib/actions/` for Next.js Server Actions.
        *   Sub-task 2.3: Create `store/` for Zustand store definition.
*   **D. Key Integration Points:** Defines how all other components are organized and imported.
*   **E. Acceptance Criteria:**
    *   AC1: Project files are organized according to the defined structure.
    *   AC2: Phase 1 game logic is correctly refactored into `/lib/game/` modules.
    *   AC3: Imports work correctly after refactoring.
*   **F. Implementation Guidance:** Establish clear naming conventions. Use index files (`index.ts`) within module folders for cleaner exports/imports. Consider using path aliases in `tsconfig.json` (e.g., `@/lib/*`).
*   **G. Component-Specific Risks:** Incorrect imports after refactoring; overly complex structure hindering navigation.
*   **H. Testing Considerations:** Verify the application still builds and runs after refactoring. Check import paths.
*   **I. Definition of Done (DoD):** Project structure implemented as defined, Phase 1 code refactored, imports updated.

---

#### Component: Zustand Store Setup ([Frontend State])

*   **A. Component Overview & Purpose:** Initialize and configure the Zustand store to manage shared frontend and game state. (Roadmap Priority: High, Est. Effort: Low)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Zustand library.
    *   **State:** Initial state includes `score`, `distance`, `gameState`, `userId`, `isSignedIn`, `remainingPlays`.
    *   **Actions:** Define actions to update the state (`setScore`, `setGameState`, `setAuthInfo`, `decrementPlays`, `resetGame`).
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Install & Define Store (Effort: S)**
        *   Sub-task 1.1: Install Zustand (`npm install zustand`).
        *   Sub-task 1.2: Create `store/gameStore.ts`.
        *   Sub-task 1.3: Define the store interface (TypeScript types for state and actions).
        *   Sub-task 1.4: Use `create` from Zustand to implement the store with initial state and action logic. Include a `resetGame` action that resets score, distance, plays (based on auth), and gameState.
    *   **Task 2: Integrate Auth State Update (Effort: S)**
        *   Sub-task 2.1: In a top-level client component (e.g., layout or specific page component where auth state is definitive), use Clerk's `useAuth` hook.
        *   Sub-task 2.2: Use a `useEffect` hook that triggers when `userId` or `isSignedIn` from Clerk changes.
        *   Sub-task 2.3: Inside this `useEffect`, call a Zustand action (e.g., `setAuthInfo(userId, isSignedIn)`) to update the store. Also update `remainingPlays` based on `isSignedIn`.
*   **D. Key Integration Points:** Provides state to React UI components (HUD). State is updated by game logic (Three.js) and potentially other UI components. Receives auth updates based on Clerk state.
*   **E. Acceptance Criteria:**
    *   AC1: Zustand store is created with the defined initial state and actions.
    *   AC2: Actions correctly update the store state.
    *   AC3: Auth status (`userId`, `isSignedIn`, `remainingPlays`) in the store updates automatically based on Clerk's state.
    *   AC4: Store state can be accessed from both React components and non-React modules.
*   **F. Implementation Guidance:** Keep the store focused on genuinely shared state. Avoid putting purely local component state in Zustand. Structure actions clearly.
*   **G. Component-Specific Risks:** Over-reliance on global state; difficulty debugging state changes if actions are not well-defined.
*   **H. Testing Considerations:** Basic unit tests for store actions. Verify state updates correctly in React components and via direct access (`getState`).
*   **I. Definition of Done (DoD):** Zustand store implemented, includes required state/actions, integrates with Clerk auth status.

---

#### Component: Basic HUD (React Integration) ([Frontend UI])

*   **A. Component Overview & Purpose:** Updates the Phase 1 basic HUD to read state (score, distance) from the Zustand store instead of direct DOM manipulation. (Roadmap Priority: High, Est. Effort: Low)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** React.
    *   **State Source:** Zustand (`useGameStore`).
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Create HUD Component (Effort: S)**
        *   Sub-task 1.1: Create `components/game/HUD.tsx`.
        *   Sub-task 1.2: Use `useGameStore` hook to select `score` and `distance` state.
        *   Sub-task 1.3: Render the score and distance within the component's JSX.
        *   Sub-task 1.4: Style the component using CSS for positioning over the canvas (similar to Phase 1 overlay).
    *   **Task 2: Integrate into Game Page (Effort: S)**
        *   Sub-task 2.1: Import and render the `HUD` component within the `app/play/page.tsx` or potentially layered within `GameCanvas.tsx`.
        *   Sub-task 2.2: Remove the direct DOM manipulation logic for score display from Phase 1 game loop/scoring system.
*   **D. Key Integration Points:** Consumes state from Zustand store. Rendered alongside `GameCanvas`.
*   **E. Acceptance Criteria:**
    *   AC1: HUD component correctly displays `score` and `distance` values read from the Zustand store.
    *   AC2: HUD updates visually when the corresponding state changes in Zustand.
    *   AC3: Phase 1 direct DOM score update logic is removed.
*   **F. Implementation Guidance:** Keep the HUD component simple and focused on displaying data from the store. Use Zustand selectors for performance (`useGameStore(state => state.score)`).
*   **G. Component-Specific Risks:** UI not updating correctly if Zustand subscription is misconfigured.
*   **H. Testing Considerations:** Visually verify HUD updates during gameplay simulation. Check React DevTools for component re-renders.
*   **I. Definition of Done (DoD):** HUD component created, displays score/distance from Zustand, updates correctly.

---

#### Component: Drizzle ORM & Neon DB Setup ([Backend Infra])

*   **A. Component Overview & Purpose:** Configure Drizzle ORM, connect to the Neon PostgreSQL database, and set up the migration management system. (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`), Neon Serverless Driver (`@neondatabase/serverless`), PostgreSQL.
    *   **Configuration:** Use `.env` for `DATABASE_URL`. Configure `drizzle.config.ts`.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Install Dependencies (Effort: S)**
        *   Sub-task 1.1: `npm install drizzle-orm @neondatabase/serverless`
        *   Sub-task 1.2: `npm install -D drizzle-kit pg` (`pg` needed by kit)
    *   **Task 2: Setup Neon Database (Effort: S)**
        *   Sub-task 2.1: Create project and database on Neon.tech.
        *   Sub-task 2.2: Obtain the PostgreSQL connection string (use the pooled one).
        *   Sub-task 2.3: Add `DATABASE_URL="<your_neon_connection_string>"` to `.env.local`. Ensure `.env.local` is in `.gitignore`.
    *   **Task 3: Configure Drizzle ORM (Effort: S)**
        *   Sub-task 3.1: Create `drizzle.config.ts` (reference provided example configuration). Point `schema` to `lib/db/schema.ts`. Set `dialect` to `postgresql`. Configure `dbCredentials` using `process.env.DATABASE_URL`.
        *   Sub-task 3.2: Create `lib/db/index.ts`. Import `neon` and `drizzle`. Initialize the Drizzle client instance using the Neon driver and `DATABASE_URL`. Export the `db` instance.
    *   **Task 4: Setup Migration Commands (Effort: S)**
        *   Sub-task 4.1: Add npm scripts to `package.json` for `drizzle-kit generate` and `drizzle-kit push:pg` (or `migrate` if using SQL migrations).
*   **D. Key Integration Points:** Provides `db` client for use in Server Actions/API Routes. Uses `DATABASE_URL` env var. `drizzle-kit` reads config and schema files.
*   **E. Acceptance Criteria:**
    *   AC1: Drizzle ORM and Neon driver installed.
    *   AC2: Drizzle configuration file (`drizzle.config.ts`) is correctly set up.
    *   AC3: Database connection string is securely stored in environment variables.
    *   AC4: Drizzle client (`lib/db/index.ts`) successfully connects to the Neon database (verify with a simple test query if possible, or wait for schema migration).
    *   AC5: `drizzle-kit` commands are configured in `package.json`.
*   **F. Implementation Guidance:** Follow Drizzle and Neon documentation carefully. Ensure the correct Neon connection string (pooled) is used. Securely handle the `DATABASE_URL`.
*   **G. Component-Specific Risks:** Incorrect connection string or configuration; driver compatibility issues; problems generating/applying migrations.
*   **H. Testing Considerations:** Run `drizzle-kit generate` after defining schemas to verify config. Run `drizzle-kit push:pg` to test connection and apply initial schema.
*   **I. Definition of Done (DoD):** Drizzle configured, Neon connection established, migration scripts runnable.

---

#### Component: User & Score Schemas ([Backend DB])

*   **A. Component Overview & Purpose:** Define the database table structures for `users` and `scores` using Drizzle ORM schema syntax. (Roadmap Priority: High, Est. Effort: Low)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Drizzle ORM (pg-core), TypeScript.
    *   **Schema:** Define tables using `pgTable`. `users` table links to Clerk `userId` (text primary key). `scores` table references `users` via foreign key, includes score, distance, timestamp, etc. Add appropriate indexes (e.g., on `scores.userId`, `scores.playedAt`).
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Define Schemas in `schema.ts` (Effort: S)**
        *   Sub-task 1.1: Create `lib/db/schema.ts`.
        *   Sub-task 1.2: Import necessary functions from `drizzle-orm/pg-core`.
        *   Sub-task 1.3: Define `users` table schema as per documentation (id: text PK, username: text, walletAddress: text nullable, createdAt: timestamp). Link `id` conceptually to Clerk ID.
        *   Sub-task 1.4: Define `scores` table schema (id: serial PK, userId: text references users.id, score: integer, distance: integer, playedAt: timestamp, environment: text nullable, verified: boolean default true).
        *   Sub-task 1.5: Define necessary indexes (e.g., `index("user_idx").on(scores.userId)`).
        *   Sub-task 1.6: Export schemas and potentially inferred types (`export type User = typeof users.$inferSelect;`).
    *   **Task 2: Generate Initial Migration (Effort: S)**
        *   Sub-task 2.1: Run `npm run drizzle-kit:generate` (or equivalent script) to create the initial migration SQL file based on the schema. Review the generated SQL.
    *   **Task 3: Apply Initial Migration (Effort: S)**
        *   Sub-task 3.1: Run `npm run drizzle-kit:push` (or equivalent) to apply the schema changes to the Neon database.
        *   Sub-task 3.2: Verify tables are created correctly in the Neon console.
*   **D. Key Integration Points:** Schema definitions used by Drizzle client for type-safe queries. Migration files managed by `drizzle-kit`. Provides structure for Score Submission and Leaderboard Views.
*   **E. Acceptance Criteria:**
    *   AC1: `users` and `scores` table schemas correctly defined in `schema.ts` using Drizzle syntax.
    *   AC2: Required columns, types, constraints (PK, FK, not null) are present.
    *   AC3: `drizzle-kit generate` successfully creates migration files.
    *   AC4: `drizzle-kit push` successfully applies the schema to the Neon database.
    *   AC5: Tables and indexes are visible and correctly structured in the database.
*   **F. Implementation Guidance:** Use appropriate data types (e.g., `text` for Clerk IDs, `integer` for score, `timestamp` with defaults). Define foreign key relationships correctly. Add indexes for frequently queried columns (`userId`, `playedAt`).
*   **G. Component-Specific Risks:** Incorrect schema definition leading to data integrity issues; migration failures.
*   **H. Testing Considerations:** Review generated SQL. Verify schema in DB console after push.
*   **I. Definition of Done (DoD):** Schemas defined, initial migration generated and successfully applied to the database.

---

#### Component: Score Submission API/Action (Protected) ([Backend API])

*   **A. Component Overview & Purpose:** Backend logic (preferably Server Action) to receive score data from the frontend, validate it, and insert it into the `scores` table associated with the authenticated user. (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Next.js Server Actions, Drizzle ORM, TypeScript.
    *   **Architecture:** Server Action defined in `lib/actions/scoreActions.ts`.
    *   **Input:** Action takes parameters like `score: number`, `distance: number`, `environment?: string`.
    *   **Logic:** Get authenticated `userId` using Clerk's `auth()` helper. Validate input data (basic checks on numbers). Insert data into `scores` table using Drizzle `db.insert()`. Handle potential errors.
    *   **Security:** Action implicitly protected by Clerk middleware (if configured correctly) or explicit check for `auth().userId`. Validate input to prevent injection or invalid data.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Create Server Action File (Effort: S)**
        *   Sub-task 1.1: Create `lib/actions/scoreActions.ts`. Add `'use server';` directive.
        *   Sub-task 1.2: Import `db` from `lib/db`, schema types, `auth` from `@clerk/nextjs/server`.
    *   **Task 2: Implement `submitScore` Action (Effort: M)**
        *   Sub-task 2.1: Define `async function submitScore(formData)` or `async function submitScore(payload)`. Define input parameters/payload type.
        *   Sub-task 2.2: Get authenticated user: `const { userId } = auth();`. If no `userId`, throw Authentication error.
        *   Sub-task 2.3: Extract score, distance, etc., from input. Perform basic validation (e.g., `typeof score === 'number'`, `score >= 0`). If invalid, return error state.
        *   Sub-task 2.4: Construct `NewScore` object for insertion using validated data and the `userId`.
        *   Sub-task 2.5: Use `await db.insert(scores).values(newScore).returning();` to insert the score.
        *   Sub-task 2.6: Implement try/catch block for database insertion. Log errors. Return success/error state.
    *   **Task 3: Integrate Frontend Call (Effort: S)**
        *   Sub-task 3.1: In the `GameCanvas` component or game manager logic, when `gameState` becomes `GAME_OVER`:
        *   Sub-task 3.2: Check if user is authenticated (using Zustand state updated by Clerk).
        *   Sub-task 3.3: If authenticated, call the `submitScore` Server Action, passing the final score, distance, etc.
        *   Sub-task 3.4: Handle the action's return state (e.g., display confirmation or error message, perhaps via Zustand action).
*   **D. Key Integration Points:** Called from frontend game logic. Uses Clerk `auth()` for user ID. Uses Drizzle `db` client to interact with `scores` table. Implicitly protected by Clerk middleware.
*   **E. Acceptance Criteria:**
    *   AC1: Server Action exists and accepts score data.
    *   AC2: Action correctly retrieves authenticated `userId`. Throws error if unauthenticated user attempts call.
    *   AC3: Input data is validated (basic checks).
    *   AC4: Valid score data is successfully inserted into the `scores` table associated with the correct `userId`.
    *   AC5: Database errors are caught and handled gracefully.
    *   AC6: Frontend successfully calls the action upon game over for authenticated users.
*   **F. Implementation Guidance:** Use Server Actions for simpler frontend integration compared to API routes. Implement robust error handling and logging. Ensure proper validation of incoming data. Use Drizzle's type safety.
*   **G. Component-Specific Risks:** Security vulnerability allowing score submission for wrong user or invalid scores; Database errors during insertion; Failure to get authenticated `userId`.
*   **H. Testing Considerations:** Test authenticated calls. Test unauthenticated calls (should fail). Test with valid and invalid score data. Verify data integrity in the database. Consider basic integration tests for the action.
*   **I. Definition of Done (DoD):** Server Action implemented, secured, validates input, inserts scores correctly for authenticated users, integrated with frontend game over logic.

---

#### Component: Basic Play Limit Logic ([Frontend/Game Logic])

*   **A. Component Overview & Purpose:** Implements the basic gameplay limits: 1 play session for anonymous users, 10 plays per day for registered users. (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Strategy:** Check auth status (from Zustand/Clerk) before allowing game start. Track plays for authenticated users (initially simple client-side tracking via Zustand for Phase 2, potentially enhancing with DB in later phases if needed for strictness). Reset daily count.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Track Remaining Plays in Zustand (Effort: S)**
        *   Sub-task 1.1: Add `remainingPlays: number` and `lastPlayTimestamp: number | null` to Zustand store state.
        *   Sub-task 1.2: When `setAuthInfo` action updates state: if signed in, set `remainingPlays` to 10 (or check last play timestamp); if signed out, set `remainingPlays` to 1.
        *   Sub-task 1.3: Create `decrementPlays` action in Zustand store.
        *   Sub-task 1.4: Add logic to check `lastPlayTimestamp` against current time to reset `remainingPlays` to 10 daily (e.g., check before starting game).
    *   **Task 2: Implement Play Limit Check (Effort: S)**
        *   Sub-task 2.1: Before starting the game (e.g., when "Play" button is clicked or `setGameState('PLAYING')` is called):
        *   Sub-task 2.2: Check Zustand store: `const { isSignedIn, remainingPlays } = useGameStore.getState();`. Perform daily reset check here if needed.
        *   Sub-task 2.3: If `remainingPlays <= 0`, prevent game start and display a message (e.g., "Come back tomorrow!").
        *   Sub-task 2.4: If allowed to play, proceed to start the game.
    *   **Task 3: Decrement Plays on Game Start/End (Effort: S)**
        *   Sub-task 3.1: When the game successfully starts (`gameState` becomes `PLAYING`), call `useGameStore.getState().decrementPlays()`. Update `lastPlayTimestamp`.
*   **D. Key Integration Points:** Reads auth state from Zustand store (populated by Clerk). Modifies Zustand store state (`remainingPlays`). Interacts with game start logic.
*   **E. Acceptance Criteria:**
    *   AC1: Anonymous users are limited to 1 play session (can start game once).
    *   AC2: Authenticated users can play up to 10 times.
    *   AC3: Play count correctly decrements upon starting a game.
    *   AC4: Play count resets daily (based on client-side timestamp check initially).
    *   AC5: Users are prevented from starting a game when the limit is reached, and appropriate feedback is shown.
*   **F. Implementation Guidance:** Rely on Zustand state derived from Clerk for auth status. The daily reset based on client-side timestamp is simpler for Phase 2 but less robust than a backend check; this can be improved later. Ensure the check happens *before* the game actually starts.
*   **G. Component-Specific Risks:** Client-side tracking easily bypassed; incorrect daily reset logic due to time zones or client manipulation (acceptable risk for Phase 2 basic implementation).
*   **H. Testing Considerations:** Test anonymous limit. Test authenticated limit (requires playing/simulating 10 games). Test daily reset logic (manually changing system clock or mocking time).
*   **I. Definition of Done (DoD):** Play limits based on auth status implemented using Zustand state. Check prevents game start when limit reached. Basic daily reset functions.

---

### 3. Intra-Phase Dependency Management & Sequencing

*   **A. Dependency Matrix/Diagram:**

    | Dependent Item                  | Prerequisite Item(s)                            | Nature           | Notes / Parallel Potential                      |
    | :------------------------------ | :---------------------------------------------- | :--------------- | :---------------------------------------------- |
    | Drizzle/Neon Setup              | Next.js Structure                               | Infra            | Can start early in parallel with Frontend.    |
    | User/Score Schemas              | Drizzle/Neon Setup                              | DB               | Requires DB connection setup.                 |
    | Clerk Integration               | Next.js Structure                               | Auth/Frontend    | Can start in parallel with DB setup.           |
    | Zustand Store Setup             | Next.js Structure                               | Frontend State | Can start early.                              |
    | Zustand Auth State Integration  | Clerk Integration, Zustand Store Setup          | Frontend State | Links Auth status to global state.            |
    | Score Submission API/Action     | Drizzle Client, Schemas, Clerk (for `auth()`) | Backend/API      | Depends on DB and Auth backend setup.         |
    | Play Limit Logic                | Zustand Auth State Integration                 | Frontend Logic | Depends on store being updated by Clerk.      |
    | Basic HUD (React Integration) | Zustand Store Setup                             | Frontend UI      | Depends on store having score data.            |
    | Game Logic Score Submission Call | Score Submission API/Action, Zustand Auth State | Integration      | Links Phase 1 game end to Phase 2 backend.    |

*   **B. Recommended Implementation Sequence:**
    1.  **Parallel Foundations:**
        *   Refine Next.js Structure.
        *   Setup Drizzle/Neon connection (`drizzle.config.ts`, `lib/db/index.ts`).
        *   Setup Clerk account, install provider, basic frontend components (`<SignInButton>`, etc.).
        *   Setup Zustand store (`store/gameStore.ts`) with initial state/actions.
    2.  **Database:** Define User/Score Schemas -> Generate & Apply Migrations.
    3.  **Authentication Deep Dive:** Implement Clerk Middleware -> Integrate Clerk auth status into Zustand Store.
    4.  **Core Backend Logic:** Implement Score Submission Server Action (including DB insert logic).
    5.  **Frontend Integration:** Integrate HUD with Zustand -> Implement Play Limit Logic checks -> Integrate Score Submission call from game logic on Game Over.
    6.  **Testing & Refinement:** Thoroughly test Auth flows, Score submission, Play limits.
*   **C. Handoff Points & Interface Contracts:**
    *   DB Schema (`schema.ts`) defines the contract for Drizzle queries.
    *   `submitScore` Server Action signature is the contract for the frontend call.
    *   Zustand store state/actions define the contract between UI, Auth updates, and Game logic updates.

### 4. Phase-Level Quality Assurance & Validation Strategy

*   **A. Integration Testing Focus:**
    *   **Auth -> Zustand -> Play Limit:** Verify signing in/out correctly updates Zustand and allows/blocks play attempts.
    *   **Game End -> Auth Check -> Score Action -> Drizzle -> DB:** Full flow validation for score submission for an authenticated user.
    *   **Clerk Components -> Auth State:** Ensure Clerk UI actions correctly reflect in `useAuth` and subsequently in Zustand.
    *   **Drizzle Client -> Neon DB:** Basic query execution via Drizzle to confirm connectivity after setup.
*   **B. End-to-End (E2E) Scenario Validation:**
    1.  **New User Flow:** Sign up -> Play game (within limit) -> Game Over -> Verify score saved in DB linked to new user ID.
    2.  **Returning User Flow:** Log in -> Play game (within limit) -> Game Over -> Verify score saved. Log out -> Attempt to play (should allow 1 anon game or block if played already).
    3.  **Limit Test:** Log in -> Simulate playing 10 times (can bypass actual gameplay for testing count) -> Attempt 11th play (should be blocked).
*   **C. Non-Functional Testing:**
    *   **Security:** Manual checks: Ensure Score Submission Action requires authentication. Verify sensitive keys are in `.env`. Basic review of Clerk security settings.
    *   **Performance:** Check response time for the Score Submission action. Monitor DB query performance via Neon console if needed (should be simple inserts initially).
*   **D. Test Environment & Data:** Local development environment sufficient. Need test user accounts via Clerk. Need access to Neon DB console to verify data.
*   **E. Stakeholder Validation:** Demo user signup/login flow. Demo successful score submission showing DB record. Demo play limit enforcement.

### 5. Phase-Level Risk Management & Mitigation

*   **A. Refined Phase Risk Assessment:**

    | Risk ID | Risk Description                                                  | Likelihood | Impact | Mitigation Strategy                                                                       | Contingency Plan                                                                    | Owner          |
    | :------ | :---------------------------------------------------------------- | :--------- | :----- | :---------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- | :------------- |
    | PH2-R01 | Clerk integration issues (config, middleware, state sync).      | Medium     | High   | Follow docs carefully. Isolate Clerk setup testing. Use Clerk dev support if needed.    | Simplify protected routes initially. Fallback to basic session mgmt if blocked. | Frontend/Auth Lead |
    | PH2-R02 | Drizzle/Neon connection or migration problems.                  | Low        | High   | Verify connection string meticulously. Test `drizzle-kit push` early. Check Neon logs.     | Use Neon console for direct schema changes if kit fails critically. Debug config. | Backend Lead   |
    | PH2-R03 | Score Submission security vulnerability (e.g., submitting for others). | Medium     | High   | Strictly enforce `userId` check from `auth()` in Server Action. Validate inputs server-side. | Add stricter server-side validation logic. Implement rate limiting if abused.     | Backend Lead   |
    | PH2-R04 | Complexity managing state between Clerk -> Zustand -> Game Logic. | Medium     | Medium | Keep state updates unidirectional where possible. Use `useEffect` for syncing Clerk->Zustand. | Simplify state managed in Zustand; potentially pass props more directly.          | Frontend Lead  |
    | PH2-R05 | Inaccurate client-side daily play limit reset.                    | High       | Low    | Acknowledge limitation for Phase 2. Document need for future server-side validation.      | Accept minor inaccuracy for Phase 2; implement robust backend check later.      | Tech Lead      |

*   **B. Phase-Specific Contingency Planning:** If major blockers occur with Clerk or Drizzle/Neon, prioritize getting *one* flow working completely (e.g., login + score submit) before tackling all edge cases. If state management proves overly complex, simplify the initial HUD/game interactions relying on it.

### 6. Environment, Tools & Infrastructure for the Phase

*   **A. Development Environment:** Same as Phase 1 + access to Clerk Dashboard, Neon Console. Ensure `.env.local` is configured with `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
*   **B. Shared Environments:** Consider setting up a shared "dev" or "staging" environment on Vercel connected to a separate Neon "dev" branch database towards the end of the phase for integration testing.
*   **C. CI/CD Pipeline:** Add steps to install backend dependencies. Potentially run Drizzle Kit check command in CI to catch schema/config errors.
*   **D. Key Libraries:** `@clerk/nextjs`, `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `pg`, `zustand`. (Confirm versions).

### 7. Phase Completion Criteria (Definition of "Done" for the Phase)

*   **A. Comprehensive Checklist:**
    *   ✅ All components designated for Phase 2 have met their individual DoD.
    *   ✅ Users can successfully sign up, log in, and log out using Clerk integration.
    *   ✅ Drizzle ORM is configured and successfully connected to the Neon database.
    *   ✅ `users` and `scores` schemas are migrated to the database.
    *   ✅ Zustand store is implemented and manages core UI state (score, auth status).
    *   ✅ React HUD component displays state accurately from Zustand.
    *   ✅ Authenticated users' scores are successfully submitted via Server Action/API and saved to the database with the correct `userId`.
    *   ✅ Score submission endpoint is protected, preventing unauthenticated access.
    *   ✅ Basic play limit logic (1 anon, 10 auth/day based on client check) is functional.
    *   ✅ Phase-level integration tests (Auth flow, Score submission flow) pass.
    *   ✅ Critical E2E scenarios for this phase are validated.
    *   ✅ Code reviewed, merged to main development branch.
    *   ✅ No critical/high-severity bugs related to Phase 2 functionality remain open.
    *   ✅ Successful demo of auth flows and score persistence conducted and accepted.
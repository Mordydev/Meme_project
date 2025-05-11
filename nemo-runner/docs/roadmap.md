## Strategic Implementation Roadmap: $NEMO Underwater Runner Game

### 1. Executive Summary

This roadmap outlines the strategic implementation plan for the $NEMO Underwater Runner game, a key sub-ecosystem within the Pixarfication platform. The project aims to deliver an engaging, Pixar-style underwater endless runner game built with Next.js and Three.js, featuring purely procedural asset generation for the core game experience. The implementation is structured in **6 distinct phases**, starting with a foundational **Playable Core Game Prototype** (Phase 1) focused on mechanics and visuals, followed by integrating **Backend & Authentication** (Phase 2), building out **Core Features like Leaderboards** (Phase 3), **Polishing & Optimizing** (Phase 4), adding **Advanced Features & Community Tools** (Phase 5), and culminating in **Launch Readiness** (Phase 6). This phased approach prioritizes validating the core gameplay loop early, ensures technical foundations are built sequentially, manages risk effectively, and allows for incremental delivery of value aligned with the project's strategic goals of community growth and ecosystem expansion. Approximately **25-30 major components/features** have been identified. Critical success factors include achieving fluid gameplay performance across devices, nailing the procedural Pixar-style aesthetic, seamless backend/auth integration, and fostering strong community engagement through game mechanics.

### 2. Implementation Principles

1.  **Gameplay First, Polish Follows:** Phase 1 prioritizes delivering a fun, functional, and visually appealing core game loop. Advanced features and extensive polish are deferred until the core mechanics are proven solid and enjoyable.
2.  **Procedural Purity for Core Game Assets:** Adhere strictly to generating all in-game visual assets (character, obstacles, collectibles, environment) procedurally using Three.js for Phase 1, establishing the unique visual identity and ensuring performance without external dependencies.
3.  **Mobile-First Performance & Controls:** Design and optimize gameplay, controls (touch & keyboard), and rendering with mobile browser performance as a primary consideration from the outset, ensuring broad accessibility.
4.  **Iterative Backend Integration:** Integrate backend services (Auth, DB, APIs) incrementally after the core game is established, ensuring each piece is stable before adding the next layer of complexity.
5.  **Secure & Scalable Foundations:** Implement authentication (Clerk) and database interactions (Drizzle/Neon) using best practices for security and scalability from the start of backend integration (Phase 2).

### 3. Implementation Phases Overview

| Phase # | Phase Name                                | Primary Goal & Focus                                                                                                | Key Deliverables (Major Features/Modules)                                                                                                                               | Dependencies (Previous Phases, External) | Success Criteria (Measurable)                                                                                                                               | Business Value Delivered                                    | Estimated Effort/Duration (Relative) |
| :------ | :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------- | :----------------------------------------- |
| **1**   | **Playable Core Game Prototype (in Next.js)** | Validate core gameplay loop, controls, procedural visuals, and performance within the target frontend framework.      | Functional 3-lane runner (move, jump, dive), Procedural Player Character (animated), Procedural Obstacles (Coral, Rocks, Clam), Procedural Collectibles (Bubbles - Instanced), Procedural Environment Segment (Seafloor), Keyboard & Touch Controls, Collision Detection, Basic Scoring & Game Over state, Segment Generation/Cleanup. | None                                     | Smooth gameplay (~30-60fps mobile/desktop), Responsive controls (Touch/KB), Core mechanics functional, Visually distinct procedural style achieved.          | Core game concept validation, Playable demo for feedback.     | High (6-8 weeks)                         |
| **2**   | **Foundation: Auth & Backend Basics**       | Integrate user authentication, set up database, enable score submission, implement basic UI structure & state management. | Clerk Authentication Integration, Next.js Project Structure (modules), Zustand Store Setup, Basic HUD (React), Drizzle ORM & Neon DB Setup, User & Score Schemas, Score Submission API/Action (Protected), Basic Play Limit Logic (Anon vs. Auth).                                             | Phase 1                                  | Users can sign up/log in, Authenticated scores are saved to DB, Play limits enforced, Basic game state managed via Zustand, Stable Next.js integration.         | User accounts enabled, Path to persistent scoring/rewards.  | High (4-6 weeks)                         |
| **3**   | **Leaderboards & Core Features**          | Implement persistent leaderboards and basic user profile display.                                                 | Leaderboard DB Views (Daily, Weekly, Monthly), Leaderboard Fetch API/Actions, Leaderboard UI Component/Page, Basic User Profile Display (Username, High Score), Refined HUD.                                                                                                                | Phase 2                                  | Leaderboards display accurate data, Users can view rankings and basic profile info, API performance acceptable.                                               | Competitive element introduced, Increased player retention. | Medium (3-5 weeks)                        |
| **4**   | **Polish, Optimization & Expansion**      | Enhance visuals, optimize performance, add gameplay variety, incorporate sound.                                   | Performance Optimizations (shaders, geometry), Additional Procedural Obstacle Types, Basic Power-up *Pickup* Implementation (visual only), Sound Effects & Music Integration, Refined Animations & Transitions, Basic Water Effects (from examples).                                           | Phase 3                                  | Measurable performance improvement (FPS, load time), Increased gameplay variety, Enhanced audio-visual experience, Game feels more polished and complete.       | Improved user experience, Deeper engagement.             | Medium (4-6 weeks)                        |
| **5**   | **Advanced Features & Community Tools**   | Implement advanced features like the Meme Generator and social sharing.                                           | Meme Generator Backend (GPT-4o API integration via Server Action), Meme Generator Frontend UI, Social Sharing Buttons (Score/Achievements), Refined Profile Page, Deeper Water Effects, Potential Power-up *Effects* Implementation.                                                         | Phase 4                                  | Meme generator functional and performs adequately, Users can share scores/achievements easily, Advanced features integrate smoothly.                             | Unique value proposition (Meme Gen), Community growth tools. | High (5-7 weeks)                         |
| **6**   | **Launch Readiness & Iteration**          | Final testing, deployment preparation, monitoring setup, initial post-launch planning.                             | Comprehensive Testing (Functional, Perf, Security, UX), Vercel Deployment Configuration, Monitoring & Analytics Setup (Basic), Launch Marketing Assets Prep, Initial Post-Launch Feature Backlog.                                                                                        | Phase 5                                  | Stable deployment on Vercel, Critical bugs resolved, Monitoring operational, Launch plan finalized, Positive initial user feedback post-soft launch (if any). | Ready for public launch, Sustainable operations planned.  | Medium (3-4 weeks)                        |

### 4. Comprehensive Component Inventory

*(Note: "Source Reference" refers conceptually to the provided documentation)*

**Backend Services & APIs:**

| Component Name                   | Purpose (1 sentence)                                       | Source Reference                      | Implementation Phase | Priority | Est. Effort |
| :------------------------------- | :--------------------------------------------------------- | :------------------------------------ | :------------------- | :------- | :---------- |
| User Authentication Service      | Integrates Clerk for user signup, login, session management. | Technical Specs, User Stories         | Phase 2              | High     | Medium      |
| Score Submission API/Action      | Securely receives and stores player scores in the DB.      | PRD, Technical Specs (Drizzle)      | Phase 2              | High     | Medium      |
| Leaderboard Fetch API/Action     | Retrieves formatted leaderboard data from DB views.        | PRD, Technical Specs (Drizzle Views) | Phase 3              | High     | Medium      |
| User Profile Data API/Action (Basic) | Retrieves basic user data (username, high score).        | User Stories, PRD                   | Phase 3              | Medium   | Low         |
| Meme Generator API/Action        | Interfaces with GPT-4o to perform image transformations.   | PRD, Feature Spec                   | Phase 5              | Medium   | High        |
| Play Limit Tracking Logic        | Enforces daily play limits for anonymous/auth users.       | Game Design Doc                     | Phase 2              | High     | Medium      |
| Reward Verification Logic (Stub) | Placeholder for future reward validation (if implemented). | Game Design Doc, Reward System      | Phase 4/5 (Low Pri) | Low      | Low         |

**Frontend Applications & Shared Components:**

| Component Name        | Purpose (1 sentence)                                              | Source Reference            | Implementation Phase | Priority | Est. Effort |
| :-------------------- | :---------------------------------------------------------------- | :-------------------------- | :------------------- | :------- | :---------- |
| Next.js Application   | Main web application shell using App Router.                      | Technical Specs             | Phase 1              | High     | Medium      |
| GameCanvas Component  | React component hosting the Three.js game instance.               | User Story, Technical Specs | Phase 1              | High     | High        |
| HUD Component         | Displays score, distance, potentially power-up status.            | Game Design Doc, UI/UX      | Phase 2              | High     | Low         |
| Leaderboard Component | Displays ranked list of players for different timeframes.         | PRD, UI/UX                  | Phase 3              | High     | Medium      |
| User Profile Display  | Component showing basic user info.                                | PRD, UI/UX                  | Phase 3              | Medium   | Low         |
| Meme Generator UI     | Interface for uploading images and viewing transformations.       | PRD, Feature Spec, UI/UX    | Phase 5              | Medium   | High        |
| Auth UI Components    | Login/Signup buttons/modals (using Clerk components).             | Technical Specs (Clerk)     | Phase 2              | High     | Low         |
| Shared UI Library     | Common buttons, layout elements (potentially simple Tailwind setup). | Design System             | Phase 2              | Medium   | Medium      |

**Core Game Logic (Three.js within GameCanvas):**

| Component Name                    | Purpose (1 sentence)                                                | Source Reference        | Implementation Phase | Priority | Est. Effort |
| :-------------------------------- | :------------------------------------------------------------------ | :---------------------- | :------------------- | :------- | :---------- |
| Three.js Scene Setup              | Initializes scene, camera, renderer, lighting, fog.                 | Technical Specs         | Phase 1              | High     | Medium      |
| Player Character Controller       | Manages player state, movement (lanes, jump, dive), animations.     | Game Design Doc         | Phase 1              | High     | High        |
| Procedural Asset Factory          | Functions to generate character, obstacles, collectibles via code.  | PRD, Style Guide        | Phase 1              | High     | High        |
| Obstacle Manager                  | Spawns, positions, and manages obstacle lifecycle.                | Game Design Doc         | Phase 1              | High     | Medium      |
| Collectible Manager (Instanced) | Spawns, manages, and handles pickup of instanced collectibles.        | Game Design Doc         | Phase 1              | High     | Medium      |
| Environment Segment Manager       | Generates/removes procedural environment segments (floor, decor). | Technical Specs         | Phase 1              | High     | Medium      |
| Game Loop & State Machine         | Controls game flow (playing, game over), updates game objects.      | Game Design Doc         | Phase 1              | High     | Medium      |
| Collision Detection System        | Detects collisions between player, obstacles, and collectibles.     | Game Design Doc         | Phase 1              | High     | Medium      |
| Scoring System                    | Tracks and updates score based on distance and collectibles.        | Game Design Doc         | Phase 1              | High     | Low         |
| Input Handler (Keyboard & Touch) | Processes player input for movement actions.                      | Game Design Doc         | Phase 1              | High     | Medium      |
| Water Effects Module (Basic)    | Implements basic caustics, potentially particles.                 | Style Guide, Tech Specs | Phase 4              | Medium   | Medium      |
| Sound Manager (Placeholder)       | Interface for triggering sound effects/music.                       | Game Design Doc         | Phase 4              | Medium   | Low         |

**Database & Data Models:**

| Component Name                    | Purpose (1 sentence)                                       | Source Reference                       | Implementation Phase | Priority | Est. Effort |
| :-------------------------------- | :--------------------------------------------------------- | :------------------------------------- | :------------------- | :------- | :---------- |
| Neon PostgreSQL Database          | Cloud-based PostgreSQL database instance.                  | Technical Specs                        | Phase 2              | High     | Low         |
| Drizzle ORM Setup                 | Configuration and integration of Drizzle ORM.              | Technical Specs                        | Phase 2              | High     | Low         |
| User Schema (`users` table)       | Stores user ID (linked to Clerk) and profile info.           | DB Schema Doc                          | Phase 2              | High     | Low         |
| Score Schema (`scores` table)     | Stores individual game scores with user ID, timestamp, etc. | DB Schema Doc                          | Phase 2              | High     | Low         |
| Leaderboard Materialized Views    | Pre-aggregated views for efficient leaderboard queries.    | DB Schema Doc                          | Phase 3              | High     | Medium      |
| Drizzle Migrations Management     | System for generating and applying schema changes.         | Technical Specs                        | Phase 2 onwards      | High     | Low         |

**Infrastructure & DevOps Components:**

| Component Name                  | Purpose (1 sentence)                                       | Source Reference   | Implementation Phase | Priority | Est. Effort |
| :------------------------------ | :--------------------------------------------------------- | :----------------- | :------------------- | :------- | :---------- |
| Vercel Hosting Setup            | Configuration for deploying the Next.js application.       | Technical Specs    | Phase 2 onwards      | High     | Low         |
| Vercel Blob Storage (Potential) | For storing user-uploaded images for Meme Generator.       | Technical Specs    | Phase 5              | Medium   | Low         |
| Environment Variables Mgmt      | Secure management of API keys, DB URLs, etc.             | Technical Specs    | Phase 2 onwards      | High     | Low         |
| Basic Monitoring Setup (Vercel) | Utilize Vercel analytics and basic monitoring.           | PRD              | Phase 6              | Medium   | Low         |

**Authentication & Security Systems:**

| Component Name          | Purpose (1 sentence)                                    | Source Reference        | Implementation Phase | Priority | Est. Effort |
| :---------------------- | :------------------------------------------------------ | :---------------------- | :------------------- | :------- | :---------- |
| Clerk Integration       | Handles all user auth flows (signup, login, session). | Technical Specs (Clerk) | Phase 2              | High     | Medium      |
| Protected API/Actions | Ensures only authenticated users can access certain routes. | Security Guidelines     | Phase 2              | High     | Low         |
| Input Validation        | Server-side validation for score submission, etc.       | Security Guidelines     | Phase 2              | High     | Low         |
| IP Disclaimer Logic     | Displaying necessary IP disclaimers.                    | Risk Assessment         | Phase 1/2            | High     | Low         |

*(Note: Analytics & Marketing Pages are simpler and integrated within the Next.js app structure)*

### 5. Critical Path & Dependencies Analysis

1.  **Core Critical Path:** Phase 1 (Playable Game) -> Phase 2 (Auth & Score Submission) -> Phase 3 (Leaderboards) -> Phase 6 (Launch Readiness).
2.  **Key Dependencies:**
    *   Score Submission (Phase 2) **depends on** Playable Game (Phase 1 Game Over State) AND Clerk Auth (Phase 2).
    *   Leaderboard Display (Phase 3 Frontend) **depends on** Leaderboard API/Actions (Phase 3 Backend) which **depends on** DB Views (Phase 3 DB) which **depends on** Score Schema & Data (Phase 2).
    *   Play Limit Logic (Phase 2) **depends on** Clerk Auth State (Phase 2).
    *   Meme Generator (Phase 5) **depends on** Auth (Phase 2) and potentially Blob Storage (Phase 5 Infra).
    *   Sound/Advanced VFX (Phase 4) **depends on** stable Core Game (Phase 1).
3.  **Potential Bottlenecks:**
    *   **Procedural Generation Quality (Phase 1):** Achieving the desired Pixar aesthetic purely procedurally while maintaining performance can be challenging and time-consuming. *Risk:* Visuals unsatisfactory or performance issues delay core validation.
    *   **Auth Integration (Phase 2):** Correctly integrating Clerk and securing endpoints is critical and can be complex. *Risk:* Security flaws or delays in user-specific features.
    *   **Leaderboard Performance (Phase 3):** Materialized views need efficient design and refresh strategy. *Risk:* Slow leaderboard loading impacts user experience.
    *   **Mobile Performance Tuning (Phase 4/5):** Optimizing Three.js for diverse mobile devices requires careful profiling and iteration. *Risk:* Poor performance on target mobile devices limits reach.
4.  **Parallel Work Streams:**
    *   While Phase 1 focuses on the game core, basic Next.js setup and component structure (Phase 2 Frontend) can begin.
    *   DB Schema design (Phase 2) can occur alongside Phase 1 frontend work.
    *   UI design for Leaderboards/Profile (Phase 3) can occur during Phase 2 backend work.

### 6. High-Level Testing & Validation Strategy

| Phase     | Testing Focus                                                         | Validation Approach                                                                   | Key Metrics/Criteria                  |
| :-------- | :-------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :------------------------------------ |
| Phase 1   | Core gameplay mechanics, Controls (Touch/KB), Collision accuracy, Procedural asset generation (visuals/perf), Basic scoring, Segment loading/unloading. | Manual playtesting (various devices), Basic performance profiling (FPS), Visual review. | Stable FPS, Responsive controls, No major collision bugs, Assets generate correctly. |
| Phase 2   | Auth flows (signup/login), Secure score submission, Play limit logic, DB writes/reads (basic), HUD updates via Zustand.      | Unit tests (API/Actions), Integration tests (Auth flow), Manual testing (Auth scenarios). | Users can auth, Scores save correctly, Limits work, State syncs UI.   |
| Phase 3   | Leaderboard data accuracy & performance, Profile data display.          | Automated tests (API endpoints), Data validation against raw scores, UI testing.      | Leaderboards load fast & accurately. |
| Phase 4   | Performance optimization results, New obstacle integration, Sound playback, Visual polish effectiveness.                  | Performance benchmark tests (before/after), Regression testing, Audio testing.         | Improved FPS/load times, No regressions, Audio functional.         |
| Phase 5   | Meme generator functionality & API usage, Social sharing links, Overall application stability & UX.                     | End-to-end testing, API load testing (Meme Gen), Usability testing.               | Meme gen works, Sharing functions, Positive UX feedback.         |
| Phase 6   | Final regression testing, Security vulnerability scan (basic), Deployment process validation, Monitoring checks.       | Full manual playthroughs, Security audit (checklist), Test deployment pipeline.        | No critical bugs, Secure configuration, Smooth deployment.          |

### 7. High-Level Resource Requirements

| Phase     | Key Roles Required                                                                  | Specialized Skills Needed (if any)                       | Potential Bottlenecks        |
| :-------- | :---------------------------------------------------------------------------------- | :------------------------------------------------------- | :--------------------------- |
| Phase 1   | Frontend/Game Dev (Strong Three.js, JS, Procedural Gen), Basic UI (HTML/CSS)          | Shader Programming (GLSL), 3D Math, Performance Optim. | Skilled Three.js developers. |
| Phase 2   | Frontend (React/Next.js), Backend (Node/TS, API/Actions), DB Admin (Drizzle/SQL), Auth Specialist (Clerk) | Secure API Design, Clerk Integration                    | Backend resource availability. |
| Phase 3   | Backend (Drizzle/SQL Views), Frontend (React/Next.js), UI/UX Design                | Database Optimization (Views)                            | Frontend availability.       |
| Phase 4   | Frontend/Game Dev (Three.js Perf), Sound Design/Implementation, QA                    | Three.js Optimization, Audio Integration                 | Performance tuning expertise.  |
| Phase 5   | Frontend (React), Backend (API Integration - GPT-4o), UI/UX Design                   | External API Integration (OpenAI)                      | API integration complexity.  |
| Phase 6   | QA, DevOps (Vercel), Project Management, Marketing Coordination                     | Deployment Automation, Monitoring Tools                | Thorough QA bandwidth.      |

### 8. Implementation Risks & Mitigation Strategies

| Risk ID | Risk Description                                                          | Likelihood | Impact | Mitigation Strategy                                                                                                    | Contingency Plan                                                    |
| :------ | :------------------------------------------------------------------------ | :--------- | :----- | :--------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| R01     | **Mobile Performance:** Core game loop doesn't perform well on target mobile devices. | Medium     | High   | Prioritize mobile testing from Phase 1. Optimize shaders/geometry aggressively. Implement dynamic quality settings.          | Reduce visual fidelity (fewer decorations, simpler shaders).          |
| R02     | **Procedural Generation Quality:** Fails to achieve desired Pixar aesthetic. | Medium     | Medium | Focus on shader techniques over geometry. Iterate based on feedback in Phase 1. Reference examples closely.                | Simplify visual style goals slightly. Introduce minimal texture assets later if essential. |
| R03     | **Control Responsiveness:** Touch or keyboard controls feel laggy or inaccurate. | Low        | High   | Implement input handling carefully. Test extensively on target devices. Fine-tune interpolation/timing.                  | Simplify control scheme if needed (e.g., tap instead of swipe).    |
| R04     | **Clerk/Auth Integration Complexity:** Issues integrating auth securely.  | Medium     | High   | Allocate dedicated time in Phase 2. Follow Clerk best practices strictly. Perform security reviews.                       | Delay features requiring fine-grained auth, launch with simpler model. |
| R05     | **Leaderboard Scalability:** Leaderboard queries become slow under load. | Medium     | Medium | Design materialized views efficiently. Implement caching. Monitor DB performance.                                         | Increase DB resources (Neon). Simplify leaderboard display (e.g., Top 50 only). |
| R06     | **Scope Creep:** Adding unplanned features delays core delivery.         | Medium     | High   | Strictly adhere to phased deliverables. Maintain a prioritized backlog for post-launch features.                       | Defer non-essential features identified during development.        |
| R07     | **GPT-4o API Costs/Performance (Meme Gen):** High cost or slow image generation. | Medium     | Medium | Implement rate limiting/usage quotas. Optimize prompts. Cache results where possible. Clearly communicate potential costs. | Launch without Meme Generator or use a simpler image effect.       |
| R08     | **IP Sensitivity:** Visual style deemed too close to source material.   | Low        | High   | Maintain clear "inspired by" positioning & disclaimers. Focus on original character/elements. Avoid direct asset copying. | Adjust visual style elements if issues arise. Consult legal if needed. |

### 9. Strategic Recommendations

1.  **Validate Core Loop Rigorously in Phase 1:** Prioritize getting the *feel* of the movement, controls, and procedural generation right before adding backend complexity. Gather early feedback on the playable prototype.
2.  **Embrace Modular Code Design:** Structure the Three.js and React code into well-defined, reusable modules from the start. This will significantly ease integration, testing, and future maintenance.
3.  **Profile Performance Early & Often:** Integrate basic FPS monitoring during Phase 1. Conduct targeted performance testing on mobile devices at the end of Phase 1 and Phase 4. Don't let performance become an afterthought.
4.  **Leverage Serverless Effectively:** Utilize Neon's scale-to-zero and Drizzle's type safety for efficient backend development, but be mindful of potential cold starts for less-frequently accessed API routes (consider warming strategies if needed later).
5.  **Plan for Iteration:** Acknowledge that procedural generation and game balance will require iteration. Build flexibility into the generation parameters and plan for tuning based on testing and feedback, especially after Phase 1 and Phase 4.

### 10. Implementation Assumptions & Constraints

| Type        | Description                                                                           | Impact on Implementation                                            |
| :---------- | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------ |
| Assumption  | Required skill sets (Three.js, React, Next.js, Drizzle, GLSL) are available.         | Resource allocation is critical; lack of skills could cause delays. |
| Assumption  | Clerk, Neon, Vercel, and GPT-4o services meet performance/uptime requirements.        | Service outages could impact development or production.               |
| Assumption  | Provided examples and documentation accurately reflect desired functionality/style. | Misinterpretations require clarification and potential rework.       |
| Constraint  | Core game visuals **must** be procedural (no external assets for Phase 1 game core). | Requires strong shader/geometry generation skills; limits texturing. |
| Constraint  | Target platforms include modern desktop browsers and mobile browsers (Safari/Chrome). | Requires cross-browser testing and mobile performance optimization.    |
| Constraint  | Technology stack (Next.js, Three.js, Clerk, Drizzle, Neon, Vercel) is mandated.       | Limits alternative technical solutions.                             |
| Dependency  | GPT-4o API availability and pricing for Meme Generator.                               | Feature viability depends on external factors.                    |

### 11. Next Steps

1.  **Finalize & Approve Roadmap:** Review this roadmap with key stakeholders for alignment and approval.
2.  **Detailed Planning (Phase 1):** Create a detailed task breakdown and sprint plan specifically for Phase 1 objectives (Core Playable Game Prototype).
3.  **Team Kick-off:** Formally kick off the project, assign roles and responsibilities for Phase 1.
4.  **Setup Development Environment:** Initialize Next.js project, configure Three.js, install necessary dependencies, set up Git repository.
5.  **Begin Phase 1 Development:** Start implementing the core scene setup and procedural asset generation based on the approved plan.
6.  **Establish Feedback Loop:** Plan for regular demos and feedback sessions, especially after Phase 1 completion.
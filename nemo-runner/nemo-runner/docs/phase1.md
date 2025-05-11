# $NEMO Underwater Runner: Unified Phase 1 Implementation Plan

**Version:** 2.0
**Date:** Current Date

## 1. Executive Summary

This document outlines the comprehensive, unified implementation plan for Phase 1 of the $NEMO Underwater Runner game: a Finding Nemo-inspired endless runner within the Pixarfication ecosystem. The plan focuses on creating a **production-ready game prototype** with outstanding Pixar-style visuals, responsive controls, and engaging gameplay, validating the core game concept and providing a foundational asset for community engagement and future ecosystem integration.

The implementation prioritizes:
-   **Resolving critical initialization issues** in the React/Three.js integration for a stable framework.
-   **Implementing a modular, maintainable architecture** with specialized managers for scalability.
-   **Creating high-quality procedural assets** inspired by Pixar's underwater aesthetic.
-   **Delivering engaging gameplay mechanics** with progressive difficulty.
-   **Ensuring stable performance** (target 30-60fps) across desktop and mobile devices.

This phase will deliver a fully playable game featuring lane-based movement with jump/dive mechanics, six distinctive obstacle types, collectible systems, power-up pickups, lives management, and an immersive underwater atmosphere.

## 2. Phase Overview & Technical Foundations

### 2.1 Phase Objectives

1.  **Create Stable Game Framework:** Implement reliable Three.js initialization within Next.js, resolving potential canvas availability errors and ensuring proper resource cleanup.
2.  **Establish Modular Architecture:** Implement a specialized manager system for maintainability, separation of concerns, and scalability.
3.  **Develop Procedural Generation System:** Create a modular asset factory system producing high-quality Pixar-style visuals using shared shader techniques.
4.  **Build Core Gameplay Systems:** Implement responsive player controls, varied obstacles with distinct behaviors, collectibles, and dynamically increasing challenge.
5.  **Optimize Cross-Platform Performance:** Ensure smooth gameplay on both desktop and mobile devices through aggressive optimization.

### 2.2 Key Architectural Components

The game architecture is designed for modularity and scalability:

```
[ Next.js Application Shell ]
    └── GameCanvas (React Component - UI Overlay, Lifecycle Mgt.)
        └── GameEngine (Orchestrator - Game Loop, Global State)
            ├─── Core Services & Managers ──────────
            │    ├── ConfigurationSystem (Game Params, Constants)
            │    ├── ShaderManager (GLSL Chunks, Shared Uniforms)
            │    ├── RenderManager (Rendering Pipeline, Quality Settings)
            │    ├── LightingManager (Scene Lighting, Dynamic Caustics)
            │    ├── CameraManager (View Control, Camera Effects)
            │    ├── InputHandler (Keyboard & Touch Input Processing)
            │    └── CollisionDetectionSystem (Object Interaction Logic)
            │
            ├─── Gameplay Feature Managers ────────
            │    ├── PlayerController (State, Movement, Lives)
            │    ├── ObstacleManager (Spawning, Behavior, Patterns)
            │    ├── CollectibleManager (Instanced Items, Collection)
            │    ├── PowerUpManager (Pickups, Visuals)
            │    ├── EnvironmentManager (Segments, Decorations, Atmosphere)
            │    ├── ScoringSystem (Score Tracking, UI Updates)
            │    └── DifficultyManager (5-Tier Progression, Pacing)
            │
            └─── Asset Generation & Effects ─────────
                 ├── ProceduralAssetFactory (Generates All Visual Assets)
                 │   ├── CharacterAssets
                 │   ├── ObstacleAssets
                 │   ├── CollectibleAssets
                 │   ├── PowerUpAssets
                 │   └── EnvironmentAssets
                 └── VisualEffectsService (Particles, Screen Effects, Feedback)
```

## 3. Critical Component Implementation

### 3.1 GameCanvas Component (React)

*   **Purpose:** Provides React integration for the Three.js canvas, manages the game engine lifecycle, and handles UI overlays (score, lives, game over).
*   **Integration Points:** Hosts the `GameEngine`, receives game state updates for UI, passes user interactions (e.g., restart) to the `GameEngine`.
*   **Key Risks:**
    *   Canvas initialization failures within React lifecycle. (High)
    *   Memory leaks due to improper Three.js resource cleanup. (Medium)
*   **Implementation Tasks:**
    1.  **Robust Initialization & Mounting (Effort: M):**
        *   Create an unconditionally rendered canvas mount ref in component JSX.
        *   Implement initialization in `useEffect` with guards for `window` and `canvasRef.current`.
        ```typescript
        // Illustrative snippet for GameCanvas.tsx
        useEffect(() => {
          if (typeof window === 'undefined') return; // SSR guard
        
          let gameEngineInstance: GameEngine | null = null;
        
          try {
            if (!canvasRef.current) {
              console.error("GameCanvas: Canvas mount point not available on initial effect run.");
              // Optionally set an error state to inform the user or retry
              return;
            }
        
            // Clear previous canvas content if any (e.g., from HMR or previous errors)
            while (canvasRef.current.firstChild) {
              canvasRef.current.removeChild(canvasRef.current.firstChild);
            }
        
            gameEngineInstance = new GameEngine(canvasRef.current, {
              onScoreUpdate: setScore, // Example callback to update React state
              onLivesUpdate: setLives,
              onGameOver: () => setGameOver(true)
            });
        
            gameEngineRef.current = gameEngineInstance; // Store instance for cleanup and interactions
            gameEngineInstance.initialize();
            gameEngineInstance.start();
        
            const handleResize = () => gameEngineInstance?.handleResize();
            window.addEventListener('resize', handleResize);
        
            return () => { // Cleanup function
              window.removeEventListener('resize', handleResize);
              gameEngineRef.current?.dispose();
              gameEngineRef.current = null;
              // Ensure canvas is clear for potential remounts
              if (canvasRef.current) {
                  while (canvasRef.current.firstChild) {
                    canvasRef.current.removeChild(canvasRef.current.firstChild);
                  }
              }
            };
          } catch (error) {
            console.error("GameCanvas initialization error:", error);
            // Set error state for UI feedback
          }
        }, []); // Empty dependency array: runs once on mount, cleans up on unmount
        ```
    2.  **UI Integration & State Management (Effort: M):**
        *   Implement `GameOverlay` component for displaying score, lives, and game over state.
        *   Connect UI elements to React state updated via `GameEngine` callbacks.
        *   Implement restart functionality by calling `gameEngineRef.current?.reset()`.
    3.  **Error Handling & Feedback (Effort: S):**
        *   Implement graceful error display within the component.
        *   Add detailed console logging for easier troubleshooting.
*   **Acceptance Criteria:**
    *   ✅ Three.js canvas initializes reliably without errors across target browsers (Chrome, Firefox, Safari).
    *   ✅ Component correctly handles mounting/unmounting cycles (React StrictMode compatible) with no memory leaks.
    *   ✅ UI overlays accurately display real-time game state (score, lives, game over).
    *   ✅ Window resize is handled correctly, adjusting canvas and game rendering.
    *   ✅ Game can be restarted successfully from the UI.

### 3.2 GameEngine Core

*   **Purpose:** Orchestrates all game systems, manages the main game loop, state transitions (Loading, Playing, Paused, Game Over), and communication between managers.
*   **Integration Points:** Initialized by `GameCanvas`, coordinates all specialized managers, drives the game update cycle.
*   **Key Risks:**
    *   Performance bottlenecks in the main update loop. (Medium)
    *   Incorrect state transitions leading to unstable game behavior. (Medium)
*   **Implementation Tasks:**
    1.  **Modular Architecture Setup (Effort: M):**
        *   Instantiate and manage all specialized managers (RenderManager, PlayerController, etc.).
        *   Define clear interfaces for manager communication.
    2.  **Game Loop & State Machine (Effort: H):**
        *   Implement `requestAnimationFrame` based game loop with delta time calculation.
        *   Develop a robust state machine for game states.
        ```typescript
        // Illustrative snippet for GameEngine.ts update loop
        private gameLoop(timestamp: number): void {
          if (!this.isRunning) return;
        
          const deltaTime = (timestamp - this.lastTimestamp) / 1000;
          this.lastTimestamp = timestamp;
        
          // Cap deltaTime to prevent physics explosions on long frames
          const dt = Math.min(deltaTime, 0.1); 
        
          if (this.currentState === GameState.PLAYING) {
            this.inputHandler.update(); // Process inputs first
            
            // Update game logic for all relevant managers
            this.difficultyManager.update(dt, this.playerController.getDistanceTraveled());
            this.playerController.update(dt);
            this.environmentManager.update(dt, this.playerController.position.z);
            this.obstacleManager.update(dt, this.playerController.position.z);
            this.collectibleManager.update(dt, this.playerController.position.z);
            this.powerUpManager.update(dt, this.playerController.position.z);
            
            this.collisionDetectionSystem.checkCollisions();
            
            this.scoringSystem.update(dt); // e.g., for time-based score elements
            this.visualEffectsService.update(dt); // Update particle systems, etc.
          }
          
          this.cameraManager.update(dt); // Camera can update in PAUSED state too for effects
          this.lightingManager.update(dt); // Lighting might animate
          this.renderManager.render(); // Render the scene
        
          this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        }
        ```
    3.  **Initialization & Disposal (Effort: M):**
        *   Implement `initialize()` method to set up all systems in the correct order.
        *   Implement `dispose()` method for comprehensive resource cleanup of all managers.
    4.  **API for GameCanvas (Effort: S):**
        *   Provide methods like `start()`, `pause()`, `resume()`, `reset()`.
*   **Acceptance Criteria:**
    *   ✅ All managers are initialized, updated in the correct sequence, and disposed of properly.
    *   ✅ Game loop maintains target frame rate and handles delta time correctly.
    *   ✅ State transitions (e.g., Playing -> Game Over) are handled cleanly.
    *   ✅ Game can be paused, resumed, and reset correctly.

### 3.3 ConfigurationSystem & ShaderManager

*   **Purpose:**
    *   `ConfigurationSystem`: Central repository for all tunable game parameters (speeds, spawn rates, difficulty thresholds, etc.) for easy balancing.
    *   `ShaderManager`: Loads, caches, and provides shared GLSL shader chunks and manages global shader uniforms.
*   **Integration Points:** `ConfigurationSystem` used by most managers. `ShaderManager` used by `ProceduralAssetFactory` and `RenderManager`.
*   **Key Risks:**
    *   Inflexible configuration making tuning difficult. (Low)
    *   Shader compilation errors or performance issues with complex shaders. (Medium)
*   **Implementation Tasks:**
    1.  **ConfigurationSystem Design (Effort: M):**
        *   Define structure for game parameters (JSON or TypeScript objects).
        *   Implement system to load and provide access to configurations.
    2.  **ShaderManager GLSL Framework (Effort: H):**
        *   Develop a system for loading GLSL shader code (e.g., as string imports or via fetch).
        *   Implement utility for composing shaders from reusable chunks (e.g., noise, lighting, caustics).
        *   Establish conventions for material parameters and global uniforms (e.g., time, resolution).
*   **Acceptance Criteria:**
    *   ✅ Game parameters are easily accessible and modifiable via `ConfigurationSystem`.
    *   ✅ `ShaderManager` successfully loads, composes, and provides shaders.
    *   ✅ Shared GLSL chunks are utilized effectively, promoting consistency and maintainability.

### 3.4 RenderManager & LightingManager

*   **Purpose:**
    *   `RenderManager`: Handles the Three.js rendering pipeline, manages scene, camera, renderer instances, and applies post-processing effects. Controls quality settings.
    *   `LightingManager`: Manages all light sources (ambient, directional, point), shadows, and dynamic underwater caustic effects.
*   **Integration Points:** `RenderManager` renders the scene populated by other managers. `LightingManager` interacts with environment and character shaders.
*   **Key Risks:**
    *   Poor rendering performance, especially on mobile. (High)
    *   Unconvincing or computationally expensive lighting and caustics. (Medium)
*   **Implementation Tasks:**
    1.  **RenderManager Setup (Effort: M):**
        *   Initialize Three.js `WebGLRenderer`, `Scene`.
        *   Implement render loop integration and quality scaling options (resolution, anti-aliasing).
    2.  **LightingManager Design (Effort: H):**
        *   Implement ambient and directional lighting appropriate for an underwater scene.
        *   Develop a system for projecting animated caustic patterns onto the seafloor and objects (e.g., using a projected texture or shader).
        *   Implement god rays/volumetric light shafts.
*   **Acceptance Criteria:**
    *   ✅ `RenderManager` achieves target FPS with appropriate quality settings.
    *   ✅ `LightingManager` creates an immersive underwater atmosphere with believable lighting and caustics.
    *   ✅ Lighting and rendering effects are optimized for performance.

### 3.5 CameraManager & VisualEffectsService

*   **Purpose:**
    *   `CameraManager`: Controls the main game camera (position,追蹤, field of view), and implements camera effects (e.g., shake on impact, zoom during speed boosts).
    *   `VisualEffectsService`: Manages creation and lifecycle of particle effects (e.g., bubble trails, collection sparks, impacts) and other visual feedback.
*   **Integration Points:** `CameraManager` provides the view for `RenderManager`. `VisualEffectsService` is triggered by game events (collisions, power-ups).
*   **Key Risks:**
    *   Camera movement feels jarring or disorienting. (Medium)
    *   Visual effects are performance-intensive or visually noisy. (Medium)
*   **Implementation Tasks:**
    1.  **CameraManager Control (Effort: M):**
        *   Implement camera追蹤 logic for the player character.
        *   Develop smooth camera transitions and dynamic effects (shake, FOV changes).
    2.  **VisualEffectsService Particle Systems (Effort: H):**
        *   Implement an object pooling system for particles.
        *   Create effects for collections, impacts, player trails, ambient particles (plankton, dust).
        *   Develop screen-space effects (e.g., flash on hit).
*   **Acceptance Criteria:**
    *   ✅ Camera provides a clear and stable view of the gameplay, enhancing immersion.
    *   ✅ Camera effects provide meaningful feedback without being distracting.
    *   ✅ `VisualEffectsService` delivers impactful feedback for game events.
    *   ✅ Particle effects are optimized and do not cause significant frame drops.

### 3.6 InputHandler

*   **Purpose:** Captures and processes user input from keyboard (desktop) and touch gestures (mobile), translating them into game actions.
*   **Integration Points:** Listens to DOM events; sends interpreted commands to `PlayerController`.
*   **Key Risks:**
    *   Unresponsive or inaccurate controls, especially touch gestures. (High)
    *   Inconsistent behavior across different browsers/devices. (Medium)
*   **Implementation Tasks:**
    1.  **Event Listener Setup (Effort: S):**
        *   Attach and clean up keyboard (`keydown`, `keyup`) and touch (`touchstart`, `touchmove`, `touchend`) event listeners.
    2.  **Keyboard Input Processing (Effort: M):**
        *   Map arrow keys to lane changes, jump, dive.
        *   Handle continuous input vs. single-press actions.
    3.  **Touch Gesture Recognition (Effort: H):**
        *   Implement swipe detection logic (thresholds for distance and velocity) for directional commands.
        *   Consider tap detection for actions like power-up activation.
        *   Prevent default browser actions (e.g., scrolling) during gameplay.
*   **Acceptance Criteria:**
    *   ✅ Keyboard controls are responsive and intuitive.
    *   ✅ Touch swipe gestures are reliably detected and mapped to player actions on mobile.
    *   ✅ Input latency is minimal.
    *   ✅ No interference with browser default behaviors outside gameplay.

### 3.7 ProceduralAssetFactory

*   **Purpose:** Generates all game visual assets (character, obstacles, collectibles, environment elements) procedurally using Three.js geometry and custom GLSL shaders.
*   **Integration Points:** Provides meshes and materials to all game managers (`PlayerController`, `ObstacleManager`, etc.). Uses `ShaderManager` for shader code.
*   **Key Risks:**
    *   Visual quality of procedural assets doesn't meet Pixar-style target. (High)
    *   Generated assets are too high-poly or shaders too complex, impacting performance. (High)
    *   Lack of variety in procedural generation. (Medium)
*   **Implementation Tasks:**
    1.  **Modular Asset Structure (Effort: M):**
        *   Organize generation code by asset type (Character, Obstacles, etc.).
    2.  **Character Generation (Clownfish) (Effort: H):**
        *   Procedural geometry for body, fins, tail.
        *   Shader for stripe patterns, eye details, and subtle animations (e.g., fin flutter).
        *   Implement hit feedback visual changes.
    3.  **Obstacle Generation (6 Types) (Effort: XL):**
        *   **Coral & Rock:** Static, varied shapes using procedural noise/displacement.
        *   **Clam:** Animated open/close states, shader for pearlescent interior.
        *   **Pufferfish:** Dynamic inflation/deflation, spine details.
        *   **Jellyfish:** Translucent body, animated tentacles using shaders or simple physics.
        *   **Shark:** Basic patrolling AI, procedural geometry with distinctive silhouette.
    4.  **Collectible Generation (Bubbles, Coins) (Effort: M):**
        *   Bubbles: Instanced rendering, shader for iridescence/refraction.
        *   Coins: Instanced rendering, metallic shader, simple animation.
    5.  **PowerUp Pickup Generation (3 Types) (Effort: M):**
        *   Visually distinct shapes/colors for Shield, Magnet, DoubleScore.
        *   Shaders for glow effects or unique visual cues.
    6.  **Environment Element Generation (Effort: H):**
        *   Seafloor: Varied terrain, textures via shaders.
        *   Kelp/Seaweed: Procedural geometry with swaying animation (shader-based or simple skeletal).
        *   Water Surface: Shader effect for surface shimmer visible from below.
*   **Acceptance Criteria:**
    *   ✅ All game assets are generated procedurally with high visual quality, matching the Pixar-inspired underwater aesthetic.
    *   ✅ Assets are optimized for performance (polycount, shader efficiency).
    *   ✅ Sufficient visual variety is achieved for each asset type.
    *   ✅ Assets include necessary metadata for gameplay (e.g., collision bounds, animation hooks).

### 3.8 PlayerController

*   **Purpose:** Manages player character state (swimming, jumping, diving), movement (3-lane system, vertical actions), animations, and lives system.
*   **Integration Points:** Receives commands from `InputHandler`, provides position to `CameraManager` and `CollisionDetectionSystem`, interacts with `VisualEffectsService` for feedback.
*   **Key Risks:**
    *   Player movement feels unresponsive, floaty, or imprecise. (High)
    *   Animations do not sync well with actions. (Medium)
*   **Implementation Tasks:**
    1.  **Movement System (Effort: H):**
        *   Implement 3-lane positioning with smooth, eased transitions between lanes.
        *   Develop jump (upward arc) and dive (downward arc) mechanics with appropriate physics (gravity, duration).
        *   Ensure character rotation/orientation aligns with movement (e.g., slight roll on lane change, pitch on jump/dive).
        ```typescript
        // Illustrative snippet for PlayerController.ts lane change
        public changeLane(direction: -1 | 1): void {
          if (this.isTransitioningLane || this.state === PlayerState.HIT) return;
        
          const targetLane = Math.max(-1, Math.min(1, this.currentLane + direction));
          if (targetLane === this.currentLane) return;
        
          this.isTransitioningLane = true;
          this.previousLaneX = this.mesh.position.x;
          this.targetLaneX = targetLane * this.config.laneWidth;
          this.laneTransitionProgress = 0;
          this.currentLane = targetLane;
        
          // Trigger animation (e.g., roll)
          // this.animator.play('laneChange'); 
        }
        // In update(deltaTime):
        // if (this.isTransitioningLane) {
        //   this.laneTransitionProgress += deltaTime / this.config.laneChangeDuration;
        //   this.mesh.position.x = lerp(this.previousLaneX, this.targetLaneX, easeOutCubic(this.laneTransitionProgress));
        //   if (this.laneTransitionProgress >= 1) this.isTransitioningLane = false;
        // }
        ```
    2.  **Lives & Hit System (Effort: M):**
        *   Implement 2-lives system.
        *   Manage invincibility period after a hit (e.g., 2 seconds).
        *   Trigger visual feedback for hits (shader effects, screen shake via `VisualEffectsService`).
        *   Handle game over state when lives reach zero.
    3.  **Animation Integration (Effort: M):**
        *   Synchronize procedural animations (fin/tail movement, body flex) with player state and speed.
        *   Implement hit reaction animations.
*   **Acceptance Criteria:**
    *   ✅ Player movement is fluid, responsive, and intuitive across all actions (lane change, jump, dive).
    *   ✅ Character animations are smooth and clearly reflect player actions and state.
    *   ✅ Lives system functions correctly, including hit detection, invincibility, and game over.
    *   ✅ Player controls feel satisfying on both desktop and mobile.

### 3.9 EnvironmentManager

*   **Purpose:** Creates and manages the infinitely scrolling procedural underwater environment, including segment handling, decoration placement, and atmospheric effects.
*   **Integration Points:** Uses `ProceduralAssetFactory` for environment assets, provides context for `ObstacleManager` and `CollectibleManager` spawning, interacts with `LightingManager` for caustics.
*   **Key Risks:**
    *   Visible seams or repetition in the infinite environment. (Medium)
    *   Performance issues with dense decorations or complex atmospheric effects. (Medium)
*   **Implementation Tasks:**
    1.  **Segment Management (Effort: H):**
        *   Implement a system for pooling and recycling environment segments based on player position.
        *   Ensure seamless visual transitions between segments.
        *   Optimize culling/LOD for off-screen or distant segments.
    2.  **Procedural Seafloor & Decoration (Effort: H):**
        *   Generate varied seafloor terrain (lanes must remain clear).
        *   Procedurally place decorations (kelp, seaweed, small rocks, shells) with variety.
        *   Implement instanced rendering for common decorative elements.
    3.  **Atmospheric Effects (Effort: M):**
        *   Integrate dynamic caustic lighting from `LightingManager`.
        *   Implement water surface shader effects (shimmer, refraction).
        *   Add ambient particle systems (plankton, dust) via `VisualEffectsService`.
*   **Acceptance Criteria:**
    *   ✅ Environment scrolls infinitely and seamlessly without noticeable gaps or excessive repetition.
    *   ✅ Underwater atmosphere is immersive with convincing caustics, particles, and lighting.
    *   ✅ Segment recycling and decoration placement are performant.

### 3.10 ObstacleManager

*   **Purpose:** Manages the spawning, behavior, patterns, and lifecycle of all six types of game obstacles.
*   **Integration Points:** Uses `ProceduralAssetFactory` for obstacle assets, gets spawn context from `EnvironmentManager`, provides obstacles to `CollisionDetectionSystem`, influenced by `DifficultyManager`.
*   **Key Risks:**
    *   Obstacle patterns are unfair, too easy, or repetitive. (High)
    *   Behaviors of dynamic obstacles (Shark, Jellyfish, Pufferfish, Clam) are buggy or unconvincing. (Medium)
*   **Implementation Tasks:**
    1.  **Obstacle Pooling & Spawning (Effort: M):**
        *   Implement object pooling for each of the 6 obstacle types.
        *   Develop a robust spawning system linked to environment segments and player progress.
    2.  **Pattern Generation (Effort: H):**
        *   Create algorithms for generating varied obstacle patterns (rows, zigzags, sequences requiring jump/dive).
        *   Ensure patterns scale in complexity with `DifficultyManager` tiers.
        *   Prevent impossible-to-pass configurations.
    3.  **Behavior Implementation for 6 Types (Effort: XL):**
        *   Define and implement unique behaviors, animations, and collision characteristics for Coral, Rock, Clam (animated open/close), Pufferfish (dynamic inflation), Jellyfish (floating, tentacles), and Shark (patrolling AI).
*   **Acceptance Criteria:**
    *   ✅ All six obstacle types are implemented with their distinct visual appearances and behaviors.
    *   ✅ Obstacle spawning patterns provide varied, engaging, and fair challenges.
    *   ✅ Obstacle density and complexity scale appropriately with the difficulty level.
    *   ✅ Obstacle pooling and management are efficient.

### 3.11 CollectibleManager

*   **Purpose:** Manages the spawning, instanced rendering, and collection logic for bubbles and coins.
*   **Integration Points:** Uses `ProceduralAssetFactory` for collectible assets, provides data to `CollisionDetectionSystem`, updates `ScoringSystem`.
*   **Key Risks:**
    *   Performance degradation with a high number of instanced collectibles. (Medium)
    *   Collectible patterns are uninteresting or interfere with obstacle avoidance. (Low)
*   **Implementation Tasks:**
    1.  **Instanced Rendering Setup (Effort: M):**
        *   Implement `InstancedMesh` for both bubbles and coins.
        *   Manage instance matrices efficiently for position, scale, and animation.
    2.  **Pattern Generation (Effort: M):**
        *   Create algorithms for spawning collectibles in various patterns (lines, curves, clusters).
        *   Ensure patterns guide players or offer risk/reward scenarios without obstructing critical paths.
    3.  **Collection Logic (Effort: S):**
        *   Interface with `CollisionDetectionSystem` for collection.
        *   Trigger score updates and visual feedback (`VisualEffectsService`).
*   **Acceptance Criteria:**
    *   ✅ Bubbles and coins are rendered efficiently using instancing.
    *   ✅ Collectible patterns are visually appealing and enhance gameplay.
    *   ✅ Collection detection is accurate, and appropriate feedback is provided.

### 3.12 PowerUpManager

*   **Purpose:** Manages the spawning and visual representation of the three power-up pickups (Shield, Magnet, DoubleScore). Phase 1 focuses on pickup visuals and collection detection; effects are for a later phase.
*   **Integration Points:** Uses `ProceduralAssetFactory` for power-up assets, provides data to `CollisionDetectionSystem`.
*   **Key Risks:**
    *   Power-up visuals are not distinct enough. (Low)
    *   Spawning logic is unbalanced (too rare/common). (Medium)
*   **Implementation Tasks:**
    1.  **Visual Pickups (Effort: M):**
        *   Ensure the three power-up types (Shield, Magnet, DoubleScore) are visually distinct and appealing.
        *   Implement spawning logic with appropriate rarity, managed by `ConfigurationSystem`.
    2.  **Collection Detection (Effort: S):**
        *   Interface with `CollisionDetectionSystem` for collection.
        *   Trigger visual feedback upon collection (`VisualEffectsService`).
*   **Acceptance Criteria:**
    *   ✅ Three distinct power-up pickups are visually implemented and spawn in the game world.
    *   ✅ Power-ups can be collected by the player, triggering visual feedback.
    *   ✅ Spawning rarity is configurable and feels balanced for Phase 1 (even without functional effects).

### 3.13 CollisionDetectionSystem

*   **Purpose:** Detects and handles collisions between the player and various game objects (obstacles, collectibles, power-ups).
*   **Integration Points:** Gets positional data from `PlayerController`, `ObstacleManager`, `CollectibleManager`, `PowerUpManager`. Triggers responses on these managers.
*   **Key Risks:**
    *   Inaccurate or "unfair" feeling collisions. (High)
    *   Performance issues with many objects to check. (Medium)
*   **Implementation Tasks:**
    1.  **Collision Algorithm (Effort: M):**
        *   Implement efficient collision detection (e.g., AABB or Bounding Sphere tests).
        *   Optimize checks (e.g., broad-phase/narrow-phase, spatial partitioning if necessary for many obstacles).
    2.  **Object-Specific Logic (Effort: H):**
        *   Handle player vs. obstacle collisions (triggering hit on player).
        *   Handle player vs. collectible collisions (triggering collection).
        *   Handle player vs. power-up collisions (triggering pickup).
        *   Account for obstacle states (e.g., an open clam is dangerous, a closed one might not be).
*   **Acceptance Criteria:**
    *   ✅ Collisions are detected accurately and feel fair to the player.
    *   ✅ Different collision types (obstacle, collectible, power-up) trigger appropriate game logic.
    *   ✅ Collision detection is performant and does not cause frame drops.

### 3.14 ScoringSystem & DifficultyManager

*   **Purpose:**
    *   `ScoringSystem`: Tracks player score based on distance traveled, collectibles gathered. Provides updates to the UI.
    *   `DifficultyManager`: Implements the 5-tier progressive difficulty system, adjusting game parameters (speed, obstacle density/complexity) based on player progress (e.g., distance).
*   **Integration Points:** `ScoringSystem` updated by `CollectibleManager` and player progress. `DifficultyManager` influences `ObstacleManager`, `GameEngine` (speed). Both provide data to UI.
*   **Key Risks:**
    *   Difficulty curve is too steep, too flat, or erratic. (High)
    *   Scoring feels unrewarding or unbalanced. (Medium)
*   **Implementation Tasks:**
    1.  **Scoring Logic (Effort: S):**
        *   Implement score accumulation for distance and collected items.
        *   Provide callbacks for UI updates.
    2.  **Difficulty Tier System (5 Tiers) (Effort: H):**
        *   Define parameters for each tier (e.g., player speed, obstacle spawn rates, pattern complexity).
        *   Implement logic for transitioning between tiers based on distance or other metrics.
        *   Ensure smooth transitions rather than abrupt difficulty spikes.
        *   Provide visual/audio cues for tier changes if possible.
*   **Acceptance Criteria:**
    *   ✅ Scoring is accurate and updates in real-time on the UI.
    *   ✅ Game difficulty progressively increases across 5 distinct tiers, offering a balanced challenge.
    *   ✅ Difficulty parameters correctly influence relevant game systems.
    *   ✅ Tier transitions are noticeable yet smooth.

## 4. Implementation Sequence & Dependencies

### 4.1 Critical Path

1.  **Foundation & Critical Fix (Weeks 1-2):** Next.js shell, `GameCanvas` stable initialization, basic Three.js scene, `GameEngine` structure, `ShaderManager`.
2.  **Core Engine & Player (Weeks 2-3):** `PlayerController` (movement), basic `EnvironmentManager` (segments), `RenderManager`, `CameraManager`, `InputHandler`.
3.  **Gameplay Systems (Weeks 3-4):** Basic `ObstacleManager` (Coral, Rock), `CollectibleManager` (bubbles), `CollisionDetectionSystem`, `ScoringSystem`, `PlayerController` (lives).
4.  **Advanced Gameplay & Visuals (Weeks 4-6):** Advanced obstacles (Clam, Pufferfish, Jellyfish, Shark), enhanced `EnvironmentManager` (kelp, seaweed), `DifficultyManager`, `PowerUpManager` (pickups), `VisualEffectsService` (basic effects).
5.  **Polish & Optimization (Weeks 6-8):** `VisualEffectsService` (enhancements), performance optimization (especially mobile), controls tuning, final visual polish, balancing.

### 4.2 Key Dependencies

*   **`ProceduralAssetFactory` → Game Managers:** Managers depend on asset generation functions.
*   **`GameEngine` → All Managers:** Orchestrates initialization and updates.
*   **`PlayerController` → `InputHandler`:** Player movement relies on processed input.
*   **`ObstacleManager`/`CollectibleManager` → `EnvironmentManager`:** Need segment positions for spawning.
*   **`CollisionDetectionSystem` → All Game Object Managers:** Requires updated positions of collidable objects.

## 5. Quality Assurance Strategy

### 5.1 Testing Approach

*   **Component Testing:** Unit tests for critical utility functions (e.g., procedural generation algorithms, collision math). Visual inspection of generated assets.
*   **Integration Testing:** Testing interactions between managers (e.g., player collides with obstacle, score updates).
*   **Performance Testing:** FPS monitoring, memory usage tracking (Chrome DevTools, `stats.js`), draw call analysis across target devices.
*   **Gameplay Testing:** Extensive playtesting for control responsiveness, difficulty balancing, fun factor, and engagement.
*   **Cross-Browser/Device Testing:** Verifying consistent experience on Chrome, Firefox, Safari (desktop) and iOS Safari, Android Chrome (mobile).

### 5.2 Validation Scenarios

1.  **Core Gameplay Loop:** Player can start a game, navigate using lane changes/jump/dive, collect items, avoid varied obstacles, lose lives upon collision, and experience a game over state, then restart.
2.  **Mobile Experience:** Touch controls are responsive and accurate. Game performs at target FPS on representative mobile devices. UI is legible and usable.
3.  **Visual Quality & Immersion:** Procedural assets and environment match the Pixar-inspired reference aesthetic. Underwater atmosphere (lighting, caustics, particles) is convincing.
4.  **Progressive Difficulty:** Game clearly and smoothly transitions through all 5 difficulty tiers, with noticeable increases in challenge (speed, obstacle complexity).
5.  **Extended Play Stability:** Game remains stable with no memory leaks or significant performance degradation after prolonged play sessions (e.g., 15-20 minutes).

## 6. Risk Management (Overall)

| Risk                                                     | Likelihood | Impact | Mitigation Strategy                                                                                                                               |
| :------------------------------------------------------- | :--------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Canvas initialization fails in React lifecycle**         | High       | High   | Implement robust ref handling, unconditional canvas rendering in JSX, thorough error handling, and detailed logging. Test with React StrictMode. |
| **Performance issues on mobile devices**                 | High       | High   | Profile aggressively from early stages. Implement dynamic quality scaling. Optimize shaders, geometry, and draw calls. Use instancing & pooling. |
| **Controls feel unresponsive or delayed (esp. touch)**   | Medium     | High   | Prioritize input handling in update loop. Add input buffering if needed. Tune response parameters extensively. Test on diverse physical devices.  |
| **Visual quality doesn't match Pixar-style reference**   | Medium     | Medium | Continuously reference style guides. Create modular shader system with shared components. Focus on key visual elements (character, water). Iterate. |
| **Gameplay difficulty curve feels imbalanced**           | Medium     | Medium | Implement easily configurable parameters in `ConfigurationSystem`. Conduct extensive playtesting with varied skill levels. Smooth progression curve. |
| **Procedural generation lacks variety or looks artificial** | Medium     | Medium | Invest in robust noise algorithms and parameterization for asset generation. Combine multiple procedural techniques. Add subtle random variations. |

## 7. Tools & Environment

### 7.1 Development Environment

*   **Core Stack:** Next.js (latest stable), React (latest stable), Three.js (latest stable), TypeScript (latest stable).
*   **IDE:** VS Code (recommended) with extensions for ESLint, Prettier, GLSL, TypeScript.
*   **Version Control:** Git with a feature branch workflow (e.g., Gitflow).
*   **Local Development:** Next.js development server with hot reloading.

### 7.2 Debugging & Profiling

*   **Browser DevTools:** Chrome DevTools (Performance, Memory, Console), Firefox Developer Tools.
*   **Three.js Specific:** `stats.js` for FPS/memory, Three.js Inspector browser extension, `WebGLRenderer.info`.
*   **Mobile Testing:** iOS Simulator (Xcode), Android Emulator (Android Studio), physical devices connected for remote debugging.
*   **Performance Monitoring:** Custom in-game FPS counter, memory usage logging.

## 8. Phase Completion Criteria

To consider Phase 1 complete, ALL of the following criteria must be met:

### 8.1 Technical Implementation

*   ✅ `GameCanvas` initialization error is definitively resolved with reliable React lifecycle integration.
*   ✅ `GameEngine` is refactored into the specified specialized managers with clean interfaces and responsibilities.
*   ✅ All procedural assets (character, 6 obstacles, 2 collectibles, 3 power-up visuals, environment elements) are implemented with high visual quality using shared shader techniques.
*   ✅ Player movement (lane changes, jump, dive) is responsive, fluid, and functions correctly.
*   ✅ All six obstacle types are implemented with their correct behaviors and visual cues.
*   ✅ Collectible system (bubbles, coins) is working correctly using instanced rendering.
*   ✅ Power-up pickups are visually implemented and can be collected.
*   ✅ Environment generates infinitely with proper segment recycling and immersive underwater effects.
*   ✅ `CollisionDetectionSystem` is accurate for all relevant game object interactions.
*   ✅ Player lives system (2 lives) functions correctly with hit feedback and invincibility period.
*   ✅ Dynamic difficulty system provides a noticeable 5-tier progression influencing gameplay parameters.
*   ✅ `ScoringSystem` accurately tracks and displays score.
*   ✅ `VisualEffectsService` enhances gameplay with appropriate feedback without performance degradation.

### 8.2 Performance Requirements

*   ✅ Sustained 60fps on target desktop browsers (Chrome, Firefox, Safari).
*   ✅ Minimum 30fps (target 45-60fps) consistently on target high-to-mid-range mobile devices (iOS Safari, Android Chrome).
*   ✅ Memory usage is stable during extended play sessions with no detectable leaks.
*   ✅ No significant performance degradation during complex scenes or high entity counts.

### 8.3 Gameplay & User Experience

*   ✅ Controls are responsive and intuitive on both desktop (keyboard) and mobile (touch swipe).
*   ✅ Difficulty progression creates an engaging and fair challenge that increases over time.
*   ✅ Visual feedback clearly communicates game events (collections, hits, power-ups, tier changes).
*   ✅ The underwater atmosphere is immersive and aligns with the Pixar-inspired aesthetic.
*   ✅ The game is fun to play, with satisfying core mechanics and a clear objective.

### 8.4 Code Quality & Documentation

*   ✅ Code is modular, maintainable, and adheres to established project best practices and linting rules.
*   ✅ All major components and systems have clear interfaces and responsibilities.
*   ✅ Resource management (Three.js objects, event listeners) is efficient with proper cleanup to prevent leaks.
*   ✅ Configuration parameters (`ConfigurationSystem`) are well-organized for easy tuning and balancing.
*   ✅ Key architectural decisions and complex logic are adequately commented.

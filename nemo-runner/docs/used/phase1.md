Okay, let's generate the Detailed Implementation Plan for Phase 1.

## **Detailed Implementation Plan**

**Phase:** Phase 1: Playable Core Game Prototype (in Next.js)
**Based on Strategic Implementation Roadmap Version:** v1.0 (Generated previously)
**Detailed Plan Version:** v1.0
**Date Prepared:** May 8, 2025

---

### 1. Phase Initialization & Contextual Overview

*   **A. Phase Recap (from Strategic Roadmap):**
    *   **Phase Name:** Playable Core Game Prototype (in Next.js)
    *   **Primary Goal & Focus:** Validate core gameplay loop, controls (keyboard & touch), procedural visuals (Pixar-style underwater), and performance within the target Next.js frontend framework. Establish the foundational interactive experience.
    *   **Key Deliverables (Components):** Next.js Application (Basic Shell), GameCanvas Component, Three.js Scene Setup, Player Character Controller, Procedural Asset Factory, Obstacle Manager, Collectible Manager (Instanced), Environment Segment Manager, Game Loop & State Machine, Collision Detection System, Scoring System, Input Handler (Keyboard & Touch), Basic IP Disclaimer Logic (Display).
    *   **Success Criteria:** Smooth gameplay (~30-60fps mobile/desktop), Responsive controls (Touch/KB), Core mechanics functional (move, jump, dive, collect, collide), Visually distinct procedural style achieved, Game runs within Next.js component.
    *   **Business Value Delivered:** Core game concept validation, Foundational codebase for future phases, Playable demo for internal feedback and iteration.
*   **B. Phase-Specific Objectives & Technical Goals:**
    1.  **Establish Stable Rendering Context:** Successfully integrate and manage a Three.js canvas within a client-rendered Next.js component, ensuring proper setup and cleanup.
    2.  **Implement Fluid Player Control:** Create a responsive and intuitive control system for lane switching, jumping, and diving using both keyboard and touch inputs, optimized for mobile feel.
    3.  **Prove Procedural Asset Viability:** Generate all core visual elements (player, obstacles, collectibles, basic environment) purely via code, achieving the target "Finding Nemo" inspired aesthetic while monitoring performance.
    4.  **Core Loop Functionality:** Implement the fundamental endless runner loop: automatic forward motion, dynamic obstacle/collectible spawning, collision detection, scoring, and game over condition.
    5.  **Baseline Performance:** Achieve acceptable performance targets (target ~60fps, min ~30fps) on representative desktop and mobile browsers *before* adding backend complexity.
*   **C. Key Phase Milestones (Internal Checkpoints):**
    1.  **Milestone 1.1 (Integration Check):** Three.js scene rendering basic procedural geometry within the `GameCanvas.tsx` component in the Next.js app. Cleanup working correctly.
    2.  **Milestone 1.2 (Character & Control):** Procedural player character generated, visible, and controllable (lane changes, jump, dive) via both keyboard and touch inputs within the environment.
    3.  **Milestone 1.3 (Core Loop):** Environment segments generate infinitely; procedural obstacles and instanced collectibles spawn; basic collision detection implemented; scoring updates; Game Over state triggerable.
    4.  **Milestone 1.4 (Visual & Perf Baseline):** Core procedural assets (player, main obstacles, collectibles, floor) visually meet initial style goals; performance baseline established on target devices.

---

### 2. Detailed Component Implementation Breakdown

---

#### Component: Next.js Application (Basic Shell) ([Frontend])

*   **A. Component Overview & Purpose:** The main Next.js application structure using App Router, serving as the container for the game and future UI. (Roadmap Priority: High, Est. Effort: Low)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Next.js (latest stable), React (latest stable), TypeScript.
    *   **Architectural Patterns:** App Router file-based routing.
    *   **Key Libraries:** `three`, `@types/three`.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Initialize Next.js Project (Effort: S)**
        *   Sub-task 1.1: Run `npx create-next-app@latest` with TypeScript.
        *   Sub-task 1.2: Install Three.js types (`npm install --save-dev @types/three`).
        *   Sub-task 1.3: Configure basic project structure (`app`, `components`, `lib`, `styles`).
        *   Sub-task 1.4: Set up basic global CSS for body/html, minimal styling for layout.
    *   **Task 2: Create Game Page Route (Effort: S)**
        *   Sub-task 2.1: Create route file (e.g., `app/play/page.tsx`) to host the game component.
        *   Sub-task 2.2: Ensure basic layout and rendering of the page.
*   **D. Key Integration Points:** N/A for shell. Hosts `GameCanvas`.
*   **E. Acceptance Criteria:**
    *   AC1: Next.js project initializes and runs locally.
    *   AC2: Basic `/play` route exists and renders placeholder content.
    *   AC3: Three.js types installed and usable.
*   **F. Implementation Guidance:** Use standard Next.js App Router practices. Keep initial setup minimal.
*   **G. Component-Specific Risks:** Minimal for basic setup.
*   **H. Testing Considerations:** Verify local dev server runs.
*   **I. Definition of Done (DoD):** Tasks complete, project runs locally.

---

#### Component: GameCanvas Component ([Frontend])

*   **A. Component Overview & Purpose:** React component responsible for rendering the Three.js canvas, initializing the game engine, and handling the game loop lifecycle. (Roadmap Priority: High, Est. Effort: High)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** React, TypeScript, Three.js.
    *   **Architectural Patterns:** Client Component (`'use client'`), `useEffect` for setup/cleanup, `useRef` for canvas mount point. Dynamic import (`next/dynamic`) with `ssr: false`.
    *   **UI Elements:** A `div` container for the Three.js canvas, basic HTML element overlay for score display.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Component Setup & Dynamic Import (Effort: M)**
        *   Sub-task 1.1: Create `components/game/GameCanvas.tsx`. Mark as `'use client'`.
        *   Sub-task 1.2: Implement dynamic import in `app/play/page.tsx` to load `GameCanvas` only client-side.
        *   Sub-task 1.3: Add a `div` element within the component and use `useRef` to get a reference to it.
        *   Sub-task 1.4: Add basic HTML overlay div for score display (e.g., `<div id="score-display">Score: 0</div>`). Style minimally with CSS.
    *   **Task 2: Three.js Initialization in useEffect (Effort: M)**
        *   Sub-task 2.1: Implement a `useEffect` hook with an empty dependency array `[]` to run only on mount.
        *   Sub-task 2.2: Inside `useEffect`, call initialization functions for Scene Setup, Player, Environment, etc. (defined elsewhere).
        *   Sub-task 2.3: Append the `renderer.domElement` to the `div` referenced by `useRef`.
        *   Sub-task 2.4: Initialize the game loop (`requestAnimationFrame`).
        *   Sub-task 2.5: Add a window resize event listener to handle canvas resizing.
    *   **Task 3: Implement Cleanup Logic (Effort: M)**
        *   Sub-task 3.1: Return a cleanup function from the `useEffect` hook.
        *   Sub-task 3.2: Inside cleanup: `cancelAnimationFrame`, remove event listeners (resize, input).
        *   Sub-task 3.3: Implement thorough disposal of Three.js assets (geometries, materials, scene children).
        *   Sub-task 3.4: Remove the canvas from the DOM. Nullify Three.js object references.
*   **D. Key Integration Points:** Hosts all Three.js game logic modules. Renders the canvas. Displays score updated by game logic.
*   **E. Acceptance Criteria:**
    *   AC1: Component loads dynamically only on the client-side.
    *   AC2: Three.js canvas is successfully created and appended to the DOM within the component.
    *   AC3: Basic scene (e.g., a cube) renders correctly.
    *   AC4: Cleanup function executes correctly on component unmount (verify no console errors/memory leaks during hot-reloading).
    *   AC5: Score display overlay is visible.
*   **F. Implementation Guidance:** Pay **critical attention** to the cleanup logic in `useEffect` to prevent memory leaks. Structure the `useEffect` to call distinct setup/teardown functions for clarity.
*   **G. Component-Specific Risks:** Memory leaks due to improper cleanup; performance issues if initialization is too heavy.
*   **H. Testing Considerations:** Manual verification of rendering and cleanup during development (hot-reloading).
*   **I. Definition of Done (DoD):** All tasks complete, basic Three.js scene renders and cleans up correctly within the Next.js component structure.

---

#### Component: Three.js Scene Setup ([Game Logic])

*   **A. Component Overview & Purpose:** Initializes the core Three.js `Scene`, `Camera`, `Renderer`, lighting, and fog. (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Three.js.
    *   **Camera:** `PerspectiveCamera` configured for the 2.5D view (suitable FOV, near/far planes).
    *   **Renderer:** `WebGLRenderer` with antialiasing, appropriate encoding (`sRGBEncoding`), tone mapping (`ACESFilmicToneMapping`). Set pixel ratio correctly.
    *   **Lighting:** `AmbientLight`, `HemisphereLight`, `DirectionalLight` (configured for underwater feel, casting shadows if performant enough).
    *   **Fog:** `FogExp2` using a color derived from the environment theme.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Initialize Scene & Camera (Effort: S)**
        *   Sub-task 1.1: Create `THREE.Scene` instance.
        *   Sub-task 1.2: Create `THREE.PerspectiveCamera`, set initial position/rotation suitable for the runner view (behind/above player start).
    *   **Task 2: Initialize Renderer (Effort: S)**
        *   Sub-task 2.1: Create `THREE.WebGLRenderer` with `antialias: true`.
        *   Sub-task 2.2: Configure `toneMapping`, `outputEncoding`.
        *   Sub-task 2.3: Set size and pixel ratio based on window dimensions.
        *   Sub-task 2.4: Enable shadow map (`PCFSoftShadowMap`).
    *   **Task 3: Setup Lighting (Effort: S)**
        *   Sub-task 3.1: Add `AmbientLight` and `HemisphereLight` with appropriate underwater colors/intensities.
        *   Sub-task 3.2: Add `DirectionalLight`, position for surface light effect, enable `castShadow`, configure shadow map parameters (resolution, camera frustum - initially broad, tune later).
    *   **Task 4: Setup Fog (Effort: S)**
        *   Sub-task 4.1: Create `THREE.FogExp2` with initial color/density matching the 'reef' theme. Assign to `scene.fog`.
*   **D. Key Integration Points:** Provides the core rendering objects (`scene`, `camera`, `renderer`) used by all other game logic.
*   **E. Acceptance Criteria:**
    *   AC1: Renderer canvas is created and visible.
    *   AC2: Scene background and fog have the initial underwater color.
    *   AC3: Basic lighting illuminates objects correctly. Shadows are functional (test with simple shapes).
*   **F. Implementation Guidance:** Encapsulate setup logic in a dedicated function or class (e.g., `setupScene()`). Make lighting/fog parameters easily configurable for potential future theme changes.
*   **G. Component-Specific Risks:** Incorrect camera setup impacting view; poor lighting affecting visual style; shadow performance impact.
*   **H. Testing Considerations:** Visual inspection of lighting, fog, and shadows using simple primitives.
*   **I. Definition of Done (DoD):** All tasks complete, core scene elements initialized and configured correctly.

---

#### Component: Procedural Asset Factory ([Game Logic])

*   **A. Component Overview & Purpose:** Contains functions to procedurally generate all required 3D assets (character, obstacles, collectibles, environment pieces) using Three.js geometry and custom shaders. (Roadmap Priority: High, Est. Effort: High)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Three.js (`SphereGeometry`, `CylinderGeometry`, `PlaneGeometry`, `ExtrudeGeometry`, `InstancedMesh`), GLSL (for `ShaderMaterial`).
    *   **Techniques:** Noise displacement (Simplex/FBM), shader-based texturing/patterns (stripes, gradients, noise), geometry deformation, beveling. Reference provided code examples extensively.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Implement Noise Functions (Effort: M)**
        *   Sub-task 1.1: Implement or integrate simple JS/GLSL noise functions (hash, noise, FBM) accessible to shaders and geometry generation logic.
    *   **Task 2: Create Player Character Function (`createProceduralCharacter`) (Effort: L)**
        *   Sub-task 2.1: Implement geometry generation based on `Refined Procedural Bubbles Character v2` example (deformed sphere body, extruded fins).
        *   Sub-task 2.2: Implement corresponding `ShaderMaterial` with vertex/fragment shaders for colors, stripes, fin gradients, noise texture (reference example shader).
        *   Sub-task 2.3: Assemble parts into a `THREE.Group`, store references to animatable parts in `userData`.
    *   **Task 3: Create Collectible Bubble Function (`createCollectibleInstances`) (Effort: M)**
        *   Sub-task 3.1: Create base `IcosahedronGeometry` for bubbles.
        *   Sub-task 3.2: Implement `ShaderMaterial` with vertex/fragment shaders for wobble, Fresnel glow, transparency (reference `High Quality Collectible Bubbles` example).
        *   Sub-task 3.3: Set up `InstancedMesh` for bubble rendering.
    *   **Task 4: Create Obstacle Functions (`createObstacle_Coral`, `_Rock`, `_Clam`) (Effort: L)**
        *   Sub-task 4.1: Implement Coral generation (combinations of deformed spheres/cylinders, vibrant shader). Ref `Procedural Static Obstacles`.
        *   Sub-task 4.2: Implement Rock generation (noise-deformed Icosahedrons/Dodecahedrons, rock shader). Ref `Procedural Static Obstacles`.
        *   Sub-task 4.3: Implement Clam generation (deformed sphere halves, distinct inner/outer shell shaders, store references for animation). Ref `Procedural Clam Obstacle`.
    *   **Task 5: Create Environment Element Functions (`createFloorSegment`, `createSeaweed`) (Effort: M)**
        *   Sub-task 5.1: Implement `PlaneGeometry` generation with noise-based vertex displacement for the floor.
        *   Sub-task 5.2: Implement floor `ShaderMaterial` with slope/height based texturing (sand/rock) and caustics effect (reference `Environment` examples).
        *   Sub-task 5.3: Implement basic Seaweed generation (`PlaneGeometry`, vertex shader for sway). Ref `Environment` examples.
*   **D. Key Integration Points:** Provides meshes/groups to Player Controller, Obstacle Manager, Collectible Manager, Environment Manager.
*   **E. Acceptance Criteria:**
    *   AC1: Functions exist to generate all required asset types procedurally.
    *   AC2: Generated assets visually resemble the target style (Pixar underwater) and examples.
    *   AC3: Assets use `ShaderMaterial` with custom GLSL code where appropriate.
    *   AC4: Collectibles utilize `InstancedMesh`.
    *   AC5: Generated geometry complexity is reasonable for target performance.
*   **F. Implementation Guidance:** Keep functions modular. Parameterize generation where possible (size, color variations). Focus on achieving the *look* via shaders primarily. Heavily reference the provided successful examples.
*   **G. Component-Specific Risks:** Difficulty achieving desired visual style procedurally; generated assets too high-poly impacting performance.
*   **H. Testing Considerations:** Visual inspection of each generated asset type in isolation. Check polygon counts.
*   **I. Definition of Done (DoD):** All asset generation functions implemented and produce visually acceptable, performant results according to requirements.

---

#### Component: Player Character Controller ([Game Logic])

*   **A. Component Overview & Purpose:** Manages the player character's state, position, movement logic (lane changes, jump, dive), and triggers animations. (Roadmap Priority: High, Est. Effort: High)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Three.js, TypeScript/JavaScript.
    *   **State Machine:** Implement states (`SWIMMING`, `LANE_CHANGING`, `JUMPING`, `DIVING`).
    *   **Physics:** Simple parabolic motion for jump (`y = y0 + v0*t - 0.5*g*t^2`), potentially sine wave for dive. Interpolation (`lerp`) for smooth lane changes.
    *   **Animation:** Update character mesh rotations (pitch/roll) based on state. Trigger ambient swim animations (tail/fin sway).
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Class/Object Setup (Effort: S)**
        *   Sub-task 1.1: Define `PlayerController` class or object. Store reference to player mesh group.
        *   Sub-task 1.2: Initialize state variables (current lane, target lane, state, action timers, base Y position).
    *   **Task 2: Implement Lane Change Logic (Effort: M)**
        *   Sub-task 2.1: Implement `changeLane(direction)` method to update `targetLane` and `state`.
        *   Sub-task 2.2: In the `update` method, handle `LANE_CHANGING` state: calculate target X, interpolate `mesh.position.x`, calculate and interpolate roll (`mesh.rotation.z`). Transition back to `SWIMMING`. (Ref `CharacterController` example).
    *   **Task 3: Implement Jump Logic (Effort: M)**
        *   Sub-task 3.1: Implement `jump()` method to set state, store `jumpStartY`, reset `actionTime`.
        *   Sub-task 3.2: In `update`, handle `JUMPING` state: calculate Y position using physics formula, calculate and interpolate pitch (`mesh.rotation.x`), transition back to `SWIMMING` when landed. (Ref `CharacterController` example).
    *   **Task 4: Implement Dive Logic (Effort: M)**
        *   Sub-task 4.1: Implement `dive()` method to set state, store start Y, reset `actionTime`.
        *   Sub-task 4.2: In `update`, handle `DIVING` state: calculate Y position using curve (e.g., sine wave offset), calculate/interpolate pitch (`mesh.rotation.x`), transition back to `SWIMMING`. (Ref `CharacterController` example).
    *   **Task 5: Implement Ambient Animation Control (Effort: S)**
        *   Sub-task 5.1: Implement `animateAmbient` method (similar to example) to update tail/fin rotations based on time and potentially state (e.g., faster fins during actions).
*   **D. Key Integration Points:** Takes player mesh from Asset Factory. Called by Game Loop `update`. Receives input commands from Input Handler. Position used by Collision Detection.
*   **E. Acceptance Criteria:**
    *   AC1: Player smoothly transitions between the 3 lanes on command.
    *   AC2: Player performs a visually correct jump arc on command.
    *   AC3: Player performs a visually correct dive curve on command.
    *   AC4: Player character exhibits continuous ambient swimming animation.
    *   AC5: State transitions are handled correctly. Controls are responsive.
*   **F. Implementation Guidance:** Focus on smooth interpolation (`THREE.MathUtils.lerp`) for position and rotation changes. Tune physics/curve parameters for jump/dive to feel good. Ensure state management is robust.
*   **G. Component-Specific Risks:** Clunky/unresponsive controls; unrealistic jump/dive physics; animation glitches during state transitions.
*   **H. Testing Considerations:** Manual testing of all movement actions extensively. Check transitions between actions (e.g., lane change during jump).
*   **I. Definition of Done (DoD):** All movement actions implemented, functional, and feel responsive. State machine works correctly. Ambient animations are active.

---

#### Component: Input Handler (Keyboard & Touch) ([Game Logic])

*   **A. Component Overview & Purpose:** Captures and interprets user input (keyboard arrows, touch swipes) and translates them into player actions. (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** JavaScript DOM Events (`keydown`, `touchstart`, `touchmove`, `touchend`).
    *   **Swipe Detection:** Calculate swipe vector (deltaX, deltaY) on `touchend`. Determine primary direction (horizontal/vertical). Use thresholds for minimum swipe distance.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Setup Event Listeners (Effort: S)**
        *   Sub-task 1.1: In `GameCanvas` `useEffect`, add `keydown` event listener.
        *   Sub-task 1.2: Add `touchstart`, `touchmove`, `touchend` listeners to the canvas or a container div.
        *   Sub-task 1.3: Ensure listeners are removed in the `useEffect` cleanup function.
    *   **Task 2: Implement Keyboard Handling (Effort: S)**
        *   Sub-task 2.1: In `keydown` handler, check `event.key` (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`).
        *   Sub-task 2.2: Call corresponding `PlayerController` methods (`changeLane(-1)`, `jump()`, etc.). Prevent default browser scroll behavior for arrow keys.
    *   **Task 3: Implement Touch Swipe Handling (Effort: M)**
        *   Sub-task 3.1: In `touchstart`, record starting touch coordinates (`clientX`, `clientY`).
        *   Sub-task 3.2: In `touchend`, record ending coordinates. Calculate `deltaX`, `deltaY`.
        *   Sub-task 3.3: Determine dominant axis (`abs(deltaX) > abs(deltaY)`?).
        *   Sub-task 3.4: Based on dominant axis and sign of delta, and checking against a distance threshold (e.g., 50 pixels), call the appropriate `PlayerController` method (`changeLane`, `jump`, `dive`).
        *   Sub-task 3.5: Consider adding `touchmove` listener with `preventDefault` to prevent scrolling *during* a swipe intended for the game.
*   **D. Key Integration Points:** Calls methods on `PlayerController`. Needs access to DOM for event listeners.
*   **E. Acceptance Criteria:**
    *   AC1: Arrow keys correctly trigger lane changes, jump, and dive.
    *   AC2: Swiping left/right correctly triggers lane changes.
    *   AC3: Swiping up/down correctly triggers jump/dive.
    *   AC4: Input handling is responsive on both desktop and mobile.
    *   AC5: Accidental inputs (short taps, small drags) do not trigger actions.
*   **F. Implementation Guidance:** Tune swipe thresholds for a good balance between responsiveness and avoiding accidental triggers. Ensure event listeners are properly cleaned up. Consider touch vs mouse event handling differences if supporting mouse drags for testing.
*   **G. Component-Specific Risks:** Poor swipe detection logic (too sensitive/insensitive); conflicts with browser default touch actions (scrolling).
*   **H. Testing Considerations:** Test thoroughly on various mobile devices/screen sizes and desktop browsers. Test edge cases (diagonal swipes, quick taps).
*   **I. Definition of Done (DoD):** Both keyboard and touch swipe inputs reliably trigger the correct player actions across target platforms.

---

#### Component: Environment Segment Manager ([Game Logic])

*   **A. Component Overview & Purpose:** Manages the creation, positioning, and recycling/removal of environment segments (floor, basic decorations) to create the endless runner effect. (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Three.js.
    *   **Strategy:** Maintain a pool of active segments. As the player moves forward, check if the furthest segment is beyond the view distance; if so, reposition/regenerate it ahead of the player. Remove segments far behind.
    *   **Segment Content:** Each segment contains a floor piece and procedurally placed decorations (simple seaweed/rocks).
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Segment Pool Management (Effort: M)**
        *   Sub-task 1.1: Define segment length and number of active segments (e.g., 5-7).
        *   Sub-task 1.2: Initialize the pool of segments at the start, positioning them contiguously.
        *   Sub-task 1.3: Store segments in an array or similar structure.
    *   **Task 2: Segment Generation (`generateSegmentContent`) (Effort: M)**
        *   Sub-task 2.1: Create function to populate a segment group: call Asset Factory for floor geometry/material.
        *   Sub-task 2.2: Implement logic to procedurally place basic decorations (e.g., seaweed) on the floor segment, avoiding player lanes initially. Use raycasting onto the floor mesh to get placement positions and normals.
    *   **Task 3: Update & Recycling Logic (Effort: M)**
        *   Sub-task 3.1: In the game loop `update`, track player's Z position.
        *   Sub-task 3.2: Identify the segment furthest behind the player.
        *   Sub-task 3.3: If the rear segment is beyond a threshold distance behind the player, reposition it far ahead of the player.
        *   Sub-task 3.4: When repositioning, clear old decorations and call `generateSegmentContent` to repopulate it with new floor noise and decorations.
*   **D. Key Integration Points:** Uses Asset Factory for segment content. Provides floor meshes for obstacle/player placement via raycasting. Position determined relative to player Z.
*   **E. Acceptance Criteria:**
    *   AC1: Environment segments are generated continuously as the player moves forward.
    *   AC2: Segments behind the player are correctly removed or recycled.
    *   AC3: Floor appears seamless between segments.
    *   AC4: Basic procedural decorations (seaweed) appear on segments.
    *   AC5: Segment management does not cause noticeable performance hitches.
*   **F. Implementation Guidance:** Use a circular buffer or queue pattern for managing segments efficiently. Ensure accurate positioning to avoid gaps. Clear/dispose of old decoration meshes properly when recycling segments.
*   **G. Component-Specific Risks:** Gaps appearing between segments; performance degradation due to inefficient generation/cleanup; repetitive decoration placement.
*   **H. Testing Considerations:** Play the game for extended periods to verify seamless generation. Monitor object counts and performance.
*   **I. Definition of Done (DoD):** Infinite, seamless environment generation is functional. Segments recycle correctly. Basic decorations are placed.

---

#### Component: Obstacle Manager ([Game Logic])

*   **A. Component Overview & Purpose:** Responsible for spawning, positioning, managing the lifecycle, and checking collisions for obstacles within the active environment segments. (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Strategy:** Spawn obstacles within upcoming environment segments based on difficulty/random chance. Store active obstacles. Check for collisions against the player. Remove obstacles far behind the player. Consider simple object pooling.
    *   **Obstacle Types:** Coral, Rock, Clam (initially).
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Obstacle Spawning Logic (Effort: M)**
        *   Sub-task 1.1: Determine spawn frequency/probability based on distance traveled (simple increasing difficulty).
        *   Sub-task 1.2: When new segments are generated/recycled, decide whether to spawn obstacle(s) within them.
        *   Sub-task 1.3: Randomly select obstacle type (Coral, Rock, Clam).
        *   Sub-task 1.4: Randomly select lane (0, 1, or 2) for placement. Avoid placing obstacles consecutively in the same lane too often.
        *   Sub-task 1.5: Call Asset Factory to get the obstacle mesh.
        *   Sub-task 1.6: Position the obstacle correctly within the target lane and segment, potentially using raycasting onto the floor for accurate Y position.
        *   Sub-task 1.7: Add obstacle mesh to the scene/segment group and track it in an `activeObstacles` array.
    *   **Task 2: Obstacle Update & Animation (Effort: M)**
        *   Sub-task 2.1: In game loop `update`, iterate through active obstacles.
        *   Sub-task 2.2: For dynamic obstacles (Clams), call their update function (e.g., `clam.userData.update()`) to handle open/close animation state.
    *   **Task 3: Obstacle Cleanup (Effort: S)**
        *   Sub-task 3.1: In `update`, check if obstacles are far behind the player.
        *   Sub-task 3.2: If behind threshold, remove obstacle from scene, dispose geometry/material, and remove from `activeObstacles` array. (Consider pooling later for optimization).
*   **D. Key Integration Points:** Uses Asset Factory. Places obstacles within Environment Segments. Position checked by Collision Detection. Difficulty potentially influenced by Scoring System distance.
*   **E. Acceptance Criteria:**
    *   AC1: Obstacles (Coral, Rock, Clam) spawn randomly in lanes within generated segments.
    *   AC2: Spawn rate potentially increases slightly over time/distance.
    *   AC3: Clam obstacles animate (open/close).
    *   AC4: Obstacles are correctly removed when far behind the player.
*   **F. Implementation Guidance:** Start with simple placement logic. Ensure obstacles are placed *relative* to their segment's position. Implement basic pooling pattern early if performance allows.
*   **G. Component-Specific Risks:** Obstacles spawning too close together or in impossible patterns; performance issues with many obstacles; collision detection inaccuracies.
*   **H. Testing Considerations:** Playtesting to verify spawn rates, patterns, and fairness. Monitor object counts.
*   **I. Definition of Done (DoD):** Required obstacle types spawn correctly, clams animate, and obstacles are cleaned up appropriately.

---

#### Component: Collectible Manager (Instanced) ([Game Logic])

*   **A. Component Overview & Purpose:** Manages the spawning, positioning, rendering (via InstancedMesh), and pickup logic for collectible items (bubbles). (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** Three.js `InstancedMesh`.
    *   **Strategy:** Use one `InstancedMesh` per collectible type (just bubbles for now). Spawn instances in patterns within upcoming segments. Update instance matrices for position/visibility. Check collisions. Hide instance on pickup.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: InstancedMesh Setup (Effort: M)**
        *   Sub-task 1.1: Initialize `InstancedMesh` using bubble geometry/material from Asset Factory. Set a maximum instance count (e.g., 500).
        *   Sub-task 1.2: Add `InstancedMesh` to the scene. Maintain an array or structure to track logical state (position, active) of each instance.
    *   **Task 2: Spawning Logic (Effort: M)**
        *   Sub-task 2.1: Similar to obstacles, determine spawn locations within upcoming segments.
        *   Sub-task 2.2: Spawn patterns (lines, curves) rather than single items. Place instances in lanes or slightly above.
        *   Sub-task 2.3: Find an inactive instance slot in the `InstancedMesh`.
        *   Sub-task 2.4: Set the instance's matrix (`mesh.setMatrixAt(index, matrix)`) based on calculated position and scale.
        *   Sub-task 2.5: Increment `mesh.count`. Set `mesh.instanceMatrix.needsUpdate = true`. Track the active instance's logical position.
    *   **Task 3: Update & Cleanup (Effort: M)**
        *   Sub-task 3.1: In `update`, update time uniform in the instanced material shader.
        *   Sub-task 3.2: Check if active instances are far behind the player.
        *   Sub-task 3.3: If behind, mark the instance as inactive. To "hide" it efficiently, set its scale to zero in its matrix OR manage the `mesh.count` and compact the active instances (more complex). Setting scale to zero is simpler initially. Update the matrix.
    *   **Task 4: Pickup Logic Integration (Effort: S)**
        *   Sub-task 4.1: Provide a method `collect(instanceId)` to be called by Collision Detection.
        *   Sub-task 4.2: Inside `collect`, mark the instance as inactive and hide it (set scale to 0 in matrix, update matrix). Trigger score update.
*   **D. Key Integration Points:** Uses Asset Factory. Places instances within Environment Segments. Collision checked by Collision Detection, calls `collect`. Score updated by Scoring System.
*   **E. Acceptance Criteria:**
    *   AC1: Bubbles spawn in patterns within the game world using `InstancedMesh`.
    *   AC2: Bubbles are visually rendered using the specified shader (wobble, fresnel).
    *   AC3: Bubbles are correctly hidden/removed upon simulated pickup.
    *   AC4: Bubbles are correctly removed when far behind the player.
    *   AC5: Performance remains acceptable with many bubbles visible.
*   **F. Implementation Guidance:** Managing instance state alongside the `InstancedMesh` is key. Setting scale to zero is the easiest way to hide instances initially. Remember `instanceMatrix.needsUpdate = true`.
*   **G. Component-Specific Risks:** Performance issues if instance count is too high or matrix updates are inefficient; complexity in managing instance state and IDs for collision/pickup.
*   **H. Testing Considerations:** Visually verify spawning patterns and rendering. Test pickup functionality. Monitor draw calls and performance.
*   **I. Definition of Done (DoD):** Instanced bubbles are spawning, rendering correctly, can be 'collected', and are cleaned up. Performance is acceptable.

---

#### Component: Game Loop & State Machine ([Game Logic])

*   **A. Component Overview & Purpose:** The main loop driving the game's updates and rendering. Manages high-level game states (e.g., Playing, Game Over). (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Core Technologies:** JavaScript `requestAnimationFrame`.
    *   **State Machine:** Simple states: `LOADING`, `PLAYING`, `GAME_OVER`.
    *   **Structure:** Central `animate` function called by `requestAnimationFrame`. Calculates `deltaTime`. Calls update methods of other managers/controllers based on game state. Calls renderer.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Setup requestAnimationFrame Loop (Effort: S)**
        *   Sub-task 1.1: Create the main `animate()` function.
        *   Sub-task 1.2: Use `requestAnimationFrame(animate)` to create the loop.
        *   Sub-task 1.3: Use `THREE.Clock` to calculate `deltaTime` and `elapsedTime`.
    *   **Task 2: Implement Game State Logic (Effort: S)**
        *   Sub-task 2.1: Define game state variable (e.g., `let gameState = 'LOADING';`).
        *   Sub-task 2.2: Add functions `startGame()`, `pauseGame()`, `gameOver()`, `resetGame()` to change the state.
    *   **Task 3: Orchestrate Updates in Loop (Effort: M)**
        *   Sub-task 3.1: Inside `animate`, check `gameState`.
        *   Sub-task 3.2: If `PLAYING`:
            *   Call `PlayerController.update()`.
            *   Call `ObstacleManager.update()`.
            *   Call `CollectibleManager.update()`.
            *   Call `EnvironmentManager.update()`.
            *   Call `CollisionDetection.checkCollisions()`.
            *   Call `ScoringSystem.update()`.
        *   Sub-task 3.3: Always call `renderer.render(scene, camera)`. (Or conditional rendering if paused).
*   **D. Key Integration Points:** Orchestrates calls to all other game logic update methods. Controls flow based on game state. Performs rendering.
*   **E. Acceptance Criteria:**
    *   AC1: Game loop runs smoothly using `requestAnimationFrame`.
    *   AC2: Game objects (player, obstacles) update their state/position each frame when `gameState` is `PLAYING`.
    *   AC3: Game visually stops updating logic (except rendering maybe) when `gameState` is `GAME_OVER`.
    *   AC4: State transitions occur correctly (e.g., collision triggers `GAME_OVER`).
*   **F. Implementation Guidance:** Keep the main loop clean; delegate complex logic to manager/controller update methods. Ensure `deltaTime` is passed consistently for frame-rate independent movement/physics.
*   **G. Component-Specific Risks:** Performance bottlenecks within the loop; incorrect state management leading to bugs.
*   **H. Testing Considerations:** Monitor FPS. Test state transitions manually.
*   **I. Definition of Done (DoD):** Game loop established, core update functions orchestrated based on game state, state transitions function correctly.

---

#### Component: Collision Detection System ([Game Logic])

*   **A. Component Overview & Purpose:** Detects collisions between the player character and obstacles or collectibles. (Roadmap Priority: High, Est. Effort: Medium)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Strategy:** Simple, performant collision checks. Use bounding boxes (`THREE.Box3`) or bounding spheres (`THREE.Sphere`). Check player bounds against active obstacles and active collectible instances each frame.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Define Bounding Volumes (Effort: S)**
        *   Sub-task 1.1: Determine appropriate bounding volume type (Box or Sphere) for player, obstacles, and collectibles. Spheres are often simpler/faster.
        *   Sub-task 1.2: Calculate/define the size/radius of bounding volumes for each relevant asset type. Add methods to get the *current* world-space bounding volume for dynamic objects.
    *   **Task 2: Implement Collision Check Logic (Effort: M)**
        *   Sub-task 2.1: Create `checkCollisions()` function called by the game loop.
        *   Sub-task 2.2: Get the player's current world-space bounding volume.
        *   Sub-task 2.3: Iterate through `activeObstacles`. Get each obstacle's bounding volume. Check for intersection (`intersectsBox` or `intersectsSphere`). If collision detected, trigger game over state (`gameLoop.gameOver()`).
        *   Sub-task 2.4: Iterate through *active* collectible instances (requires querying state from Collectible Manager). Get bounding volume for each instance's world position. Check for intersection. If collision detected, call `CollectibleManager.collect(instanceId)` and trigger score update.
*   **D. Key Integration Points:** Called by Game Loop. Gets player position from Player Controller. Gets obstacle list/positions from Obstacle Manager. Gets collectible positions/IDs from Collectible Manager. Triggers game over state in Game Loop. Triggers collection in Collectible Manager.
*   **E. Acceptance Criteria:**
    *   AC1: Collision between player and obstacles correctly triggers the Game Over state.
    *   AC2: Collision between player and collectibles correctly triggers collectible removal and score increase.
    *   AC3: Collision detection is reasonably accurate (tuning bounding volumes may be needed).
    *   AC4: Collision checks do not significantly impact performance.
*   **F. Implementation Guidance:** Start with bounding spheres for simplicity. Use `Box3.setFromObject` initially but be aware it can be slow if called every frame; calculating world bounds manually from local bounds and world matrix is faster. Optimize iteration loops. Be careful checking against *active* collectible instances only.
*   **G. Component-Specific Risks:** Inaccurate collision detection (misses or false positives); performance cost of checking many objects.
*   **H. Testing Considerations:** Manual testing by deliberately colliding with obstacles/collectibles. Add debug visuals for bounding volumes.
*   **I. Definition of Done (DoD):** Collisions correctly detected for both obstacles and collectibles, triggering appropriate game events (game over, score). Performance acceptable.

---

#### Component: Scoring System ([Game Logic])

*   **A. Component Overview & Purpose:** Manages the player's score based on distance traveled and collectibles gathered. Updates the UI display. (Roadmap Priority: High, Est. Effort: Low)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Strategy:** Maintain `score` and `distance` variables. Increment distance based on time/player movement. Increment score on collectible pickup. Update HTML overlay.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Variable Initialization (Effort: S)**
        *   Sub-task 1.1: Initialize `score = 0`, `distance = 0`.
    *   **Task 2: Update Distance (Effort: S)**
        *   Sub-task 2.1: In the game loop `update`, increment `distance` based on `deltaTime` and current game speed.
    *   **Task 3: Increment Score (`addScore`) (Effort: S)**
        *   Sub-task 3.1: Create function `addScore(points)` to be called by Collectible Manager on pickup.
    *   **Task 4: Update UI Display (Effort: S)**
        *   Sub-task 4.1: In `update`, get the score display HTML element (e.g., `document.getElementById('score-display')`).
        *   Sub-task 4.2: Update its `innerText` with the current score (potentially formatted). Update less frequently than every frame if needed for performance (e.g., every 10 frames).
*   **D. Key Integration Points:** Updated by Game Loop (distance) and Collectible Manager (score). Updates HTML UI element.
*   **E. Acceptance Criteria:**
    *   AC1: Score starts at 0.
    *   AC2: Score increases based on distance traveled.
    *   AC3: Score increases when collectibles are picked up.
    *   AC4: Score is accurately displayed on the HTML overlay.
*   **F. Implementation Guidance:** Keep it simple for Phase 1. Score calculation can become more complex later (multipliers, etc.). Ensure UI update doesn't cause performance issues.
*   **G. Component-Specific Risks:** Incorrect score calculation; performance impact of frequent DOM updates.
*   **H. Testing Considerations:** Manually verify score updates correctly during gameplay.
*   **I. Definition of Done (DoD):** Scoring based on distance and collectibles is functional and displayed correctly.

---

#### Component: IP Disclaimer Logic ([Frontend/Security])

*   **A. Component Overview & Purpose:** Displays the necessary legal/IP disclaimers regarding inspiration from source material. (Roadmap Priority: High, Est. Effort: Low)
*   **B. Detailed Technical Specifications & Design Choices:**
    *   **Strategy:** Simple text display, potentially in the HTML or overlaid via CSS.
*   **C. Actionable Implementation Tasks & Sub-Tasks:**
    *   **Task 1: Add Disclaimer Text (Effort: S)**
        *   Sub-task 1.1: Define the required disclaimer text (inspired by, not affiliated, fan art, etc.).
        *   Sub-task 1.2: Add the text to a visible location (e.g., small footer below the game canvas in the HTML).
*   **D. Key Integration Points:** Displayed as part of the main HTML structure.
*   **E. Acceptance Criteria:**
    *   AC1: Required disclaimer text is visible on the game page.
*   **F. Implementation Guidance:** Ensure text is clear and meets legal requirements outlined in project docs.
*   **G. Component-Specific Risks:** Disclaimer missing or incorrect.
*   **H. Testing Considerations:** Visual confirmation.
*   **I. Definition of Done (DoD):** Disclaimer text added and visible.

---

### 3. Intra-Phase Dependency Management & Sequencing

*   **A. Dependency Matrix/Diagram:**

    | Dependent Item                    | Prerequisite Item(s)                                                                   | Nature        | Notes / Parallel Potential                    |
    | :-------------------------------- | :------------------------------------------------------------------------------------- | :------------ | :-------------------------------------------- |
    | GameCanvas Component              | Next.js App Shell                                                                      | Structural    | Can start after basic Next.js setup.        |
    | Three.js Scene Setup              | GameCanvas Component (for mount point)                                                  | Integration   | Core part of GameCanvas `useEffect`.         |
    | Procedural Asset Factory          | Three.js Scene Setup (uses THREE objects)                                               | Technical     | Can be developed largely in parallel.        |
    | Player Character Controller       | Three.js Scene Setup, Asset Factory (for mesh)                                        | Integration   | Needs player mesh before full implementation. |
    | Input Handler                     | Player Character Controller (to call methods)                                          | Functional    | Needs Player Controller instance.             |
    | Environment Segment Manager       | Three.js Scene Setup, Asset Factory (for floor/decor)                                  | Integration   | Can start after basic scene/assets.           |
    | Obstacle Manager                  | Three.js Scene Setup, Asset Factory (for obstacles), Environment Manager (for placement) | Integration   | Depends on environment generation.            |
    | Collectible Manager (Instanced) | Three.js Scene Setup, Asset Factory (for bubbles)                                      | Integration   | Depends on InstancedMesh setup.               |
    | Game Loop & State Machine         | All Managers/Controllers (calls update methods)                                       | Orchestration | Needs most other components to be functional. |
    | Collision Detection System        | Player Controller, Obstacle Mgr, Collectible Mgr (needs positions/bounds), Game Loop | Integration   | Depends on objects being managed/updated.   |
    | Scoring System                    | Collectible Mgr (pickup event), Game Loop (distance)                                  | Functional    | Simple, can be implemented early.           |
    | IP Disclaimer Logic               | GameCanvas Component (for placement)                                                   | Structural    | Simple HTML/CSS, parallel.                |

*   **B. Recommended Implementation Sequence:**
    1.  **Setup:** Next.js App Shell -> GameCanvas Component (Basic) -> Three.js Scene Setup (Basic). *(Verify rendering context)*
    2.  **Assets:** Procedural Asset Factory (Character, Floor, Bubble geometry/shaders first).
    3.  **Player & Input:** Player Controller (Basic Movement) -> Input Handler -> Player Controller (Jump/Dive). *(Verify controls)*
    4.  **Environment:** Environment Segment Manager (Floor generation/recycling).
    5.  **Core Loop:** Game Loop (Basic Structure) -> Scoring System (Basic Distance) -> IP Disclaimer.
    6.  **Obstacles & Collectibles:** Asset Factory (Obstacles) -> Obstacle Manager -> Collectible Manager (Instanced) -> Scoring System (Collectible points).
    7.  **Interaction:** Collision Detection System -> Integrate Game Over trigger -> Integrate Collectible pickup trigger.
    8.  **Refinement:** Polish procedural assets, tune controls/physics, basic performance checks.
*   **C. Handoff Points & Interface Contracts:**
    *   `Procedural Asset Factory` needs to provide consistent `THREE.Group` or `THREE.Mesh` outputs for other managers.
    *   `PlayerController` needs clear methods (`changeLane`, `jump`, `dive`) for `Input Handler`.
    *   Collision Detection needs reliable ways to get bounding volumes/positions from Player, Obstacles, Collectibles.
    *   Collectible Manager needs a clear `collect(instanceId)` interface.

### 4. Phase-Level Quality Assurance & Validation Strategy

*   **A. Integration Testing Focus:**
    *   Input -> Player Controller -> Player Mesh Movement.
    *   Environment Manager -> Obstacle/Collectible Manager -> Spawning in correct segments/lanes.
    *   Player Position -> Collision Detection -> Game Loop State Change (Game Over).
    *   Player Position -> Collision Detection -> Collectible Manager -> Scoring System -> UI Update.
    *   Game Loop -> Update calls for all active managers/controllers.
*   **B. End-to-End (E2E) Scenario Validation:**
    1.  **Basic Playthrough:** Start game, successfully navigate lanes, jump over low obstacles, dive under high obstacles, collect bubbles, eventually collide with an obstacle triggering Game Over and displaying score.
    2.  **Mobile Playthrough:** Perform the Basic Playthrough using touch swipe controls on a target mobile browser (or simulation). Verify responsiveness.
    3.  **Extended Play:** Play for several minutes to verify continuous segment generation, increasing difficulty (speed), and stability.
*   **C. Non-Functional Testing:**
    *   **Performance:** Monitor FPS continuously during development using browser dev tools or `stats.js`. Test on target low-end mobile device/emulator towards the end of the phase. Aim for min ~30fps, target ~60fps.
    *   **Visuals:** Regular visual checks against style guide/examples. Ensure procedural assets are generated correctly without visual artifacts.
*   **D. Test Environment & Data:** Local development environment is primary. No complex test data needed for this phase.
*   **E. Stakeholder Validation:** Conduct internal demos at Milestones 1.2, 1.3, and 1.4 for feedback on controls, visuals, and core loop fun factor.

### 5. Phase-Level Risk Management & Mitigation

*   **A. Refined Phase Risk Assessment:**

    | Risk ID | Risk Description                                                     | Likelihood | Impact | Mitigation Strategy                                                                                                      | Contingency Plan                                                                  | Owner      |
    | :------ | :------------------------------------------------------------------- | :--------- | :----- | :----------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :--------- |
    | PH1-R01 | Mobile performance significantly below target (~30fps).              | Medium     | High   | Profile early on mobile. Aggressively simplify procedural geometry/shaders if needed. Reduce decoration density. Limit segment view distance. | Reduce target visual fidelity significantly. Limit target mobile devices.           | Tech Lead  |
    | PH1-R02 | Procedural generation fails to capture desired Pixar/Nemo aesthetic. | Medium     | Medium | Prioritize shader work over complex geometry. Iterate visuals based on feedback. Stick closely to provided examples' techniques. | Simplify aesthetic goals. Accept a less polished look for Phase 1.                | Game Dev   |
    | PH1-R03 | Touch controls feel unresponsive or inaccurate on mobile devices.    | Medium     | High   | Test on multiple devices. Tune swipe thresholds carefully. Ensure no conflicts with browser scrolling.                   | Consider alternative touch input (e.g., tap zones) if swipes prove problematic. | Game Dev   |
    | PH1-R04 | Integration complexity (Three.js within React `useEffect`) causes significant memory leaks or instability. | Low        | High   | Implement rigorous cleanup logic from the start. Test component unmounting/remounting thoroughly. Use React DevTools profiler. | Refactor state management or Three.js initialization approach if necessary.     | Frontend Dev |
    | PH1-R05 | Core gameplay loop or controls don't feel "fun" or engaging.         | Medium     | High   | Gather feedback early via internal demos (Milestones 1.2, 1.3). Iterate on control tuning, game speed, jump/dive physics. | Pivot on specific mechanics based on feedback; potentially simplify game scope.   | Tech Lead/PM |

*   **B. Phase-Specific Contingency Planning:** If major performance or visual issues arise, prioritize core functionality (movement, collision, scoring) over complex procedural details or decorations. Simplify obstacle types or generation logic if necessary to meet deadlines/performance goals.

### 6. Environment, Tools & Infrastructure for the Phase

*   **A. Development Environment:** Node.js (latest LTS), npm/yarn, VS Code (or preferred IDE), TypeScript, Git. Local Next.js development server (`npm run dev`).
*   **B. Shared Environments:** N/A for Phase 1 (local development focus).
*   **C. CI/CD Pipeline:** Basic setup for linting, type checking, and potentially automated builds on commit (via Vercel integration later). No automated deployments needed yet.
*   **D. Key Libraries:** `three`, `@types/three`. (Confirm versions).

### 7. Phase Completion Criteria (Definition of "Done" for the Phase)

*   **A. Comprehensive Checklist:**
    *   All components designated for Phase 1 (listed in section 1.C & detailed in section 2) have met their individual "Definition of Done".
    *   Core game loop is fully functional: player can move (KB+Touch), jump, dive, collect items, collide with obstacles, score updates, game over state triggers.
    *   All core assets (player, main obstacles, collectibles, floor) are generated **purely procedurally** via code and meet initial visual style goals.
    *   Environment segments generate infinitely and recycle correctly.
    *   Basic scoring system is functional and displayed.
    *   Collision detection works reliably for obstacles and collectibles.
    *   Keyboard AND Touch controls are implemented and responsive.
    *   Performance baseline (~30-60fps) achieved and documented on representative desktop/mobile browsers.
    *   Code is modular, reasonably commented, and adheres to basic coding standards.
    *   IP Disclaimer is displayed.
    *   Successful demo of the playable core game conducted and accepted by internal stakeholders.
    *   Code merged to main development branch.
    *   No critical or high-severity bugs related to Phase 1 functionality remain open.
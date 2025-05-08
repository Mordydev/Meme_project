The primary issues seem to stem from a disconnect between how procedural assets (like decorations) are intended to be created and how the code is currently attempting to handle them (via the `AssetManager`), leading to fallback placeholders and potential performance bottlenecks. We also need to address the Next.js server error and the general performance warnings.

**High-Level Objectives:**

1.  **Correct Procedural Asset Handling:** Ensure that entities and decorations designed to be procedurally generated are created directly using their respective code functions, bypassing the `AssetManager` lookup where appropriate.
2.  **Implement Missing Procedural Logic:** Fill in the procedural generation code in TypeScript classes based on the provided `example/` files.
3.  **Stabilize Initialization & Game Start:** Resolve any lingering issues with the game starting reliably and the character moving correctly after the countdown.
4.  **Fix Server-Side Errors:** Address the Next.js `headers()` error.
5.  **Refine & Optimize:** Clean up redundant code and address performance warnings once the core functionality is stable.

---

## Implementation Plan: NEMO Runner Finalization & Fixes

### Phase 1: Fix Procedural Generation & Initialization Flow (Critical Path)

**Task 1.1: Implement Procedural Methods in Decoration Classes**

*   **Objective:** Ensure all static `create...` methods within `src/game/entities/environment/decorations/*.ts` contain the actual, functional procedural generation logic adapted from the corresponding `example/` files. Add robust error handling.
*   **Rationale:** This is the core missing piece causing placeholder fallbacks. Decorations need their defined generation logic implemented in TypeScript.
*   **Files to Modify:**
    *   `src/game/entities/environment/decorations/CoralDecorations.ts`
    *   `src/game/entities/environment/decorations/RockDecorations.ts`
    *   `src/game/entities/environment/decorations/VegetationDecorations.ts`
    *   `src/game/entities/environment/decorations/ShipwreckDecorations.ts`
    *   `src/game/entities/environment/decorations/DeepSeaDecorations.ts`
    *   `src/game/entities/environment/decorations/FloatingDecorations.ts`
    *   `src/game/utils/PlaceholderGenerator.ts` (Ensure it's robust)
*   **Sub-tasks:**
    *   [ ] **1.1.1:** For each decoration type (e.g., `coral1`, `rock2`, `seaweed1`):
        *   Locate the corresponding procedural generation code in the `example/` directory (e.g., `example/rock&coral` for rock and coral types).
        *   Carefully port the Three.js geometry and material creation logic into the relevant static method in the appropriate `decorations/*.ts` file (e.g., `CoralDecorations.createCoral1`, `RockDecorations.createRock2`).
        *   Ensure materials utilize shared utilities where possible (e.g., `DecorationUtils.createStandardMaterial`, `DecorationUtils.createPlantColor`).
    *   [ ] **1.1.2:** Inside *each* static `create...` method, wrap the entire procedural generation logic in a `try...catch` block.
    *   [ ] **1.1.3:** In the `catch` block of each method, log a specific error (e.g., `console.error(\`Error creating ${definition.type}: \`, error);`) and return a distinct, visible placeholder using `PlaceholderGenerator.createErrorPlaceholder(definition.type)`.
*   **Code Example (Pattern for `CoralDecorations.createCoral1`):**
    ```typescript
    // src/game/entities/environment/decorations/CoralDecorations.ts
    import * as THREE from 'three';
    import { DecorationDefinition } from '../DecorationDefinitions';
    import { DecorationUtils } from '../DecorationUtils';
    import { PlaceholderGenerator } from '../../../utils/PlaceholderGenerator'; // Adjust path

    export class CoralDecorations {
      static createCoral1(definition: DecorationDefinition): THREE.Object3D { // Return Object3D to allow Group or Mesh
        try { // <-- Wrap in try
          const group = new THREE.Group();
          group.name = `coral1_${definition.type}`; // Use type in name

          // --- Ported procedural logic starts here ---
          const branchCount = 3 + Math.floor(Math.random() * 4);
          for (let i = 0; i < branchCount; i++) {
              // ... (Create geometry, material, mesh for each branch) ...
              // Use DecorationUtils where possible
              const heightScale = 0.5 + Math.random() * 0.5;
              const geometry = DecorationUtils.getGeometry(`coral1_branch_${heightScale.toFixed(1)}`,
                 () => new THREE.CylinderGeometry(0.05, 0.2, 1.0 * heightScale, 8)); // Example caching
              const color = DecorationUtils.createPlantColor('coral');
              const material = DecorationUtils.createStandardMaterial(color, { roughness: 0.8, metalness: 0.2 });
              const branch = new THREE.Mesh(geometry, material);
              // ... (Position and add branch) ...
              group.add(branch);
          }
          // --- Ported procedural logic ends here ---

          // Apply scale/rotation AFTER successful creation
          DecorationUtils.applyScale(group, definition);
          DecorationUtils.applyRotation(group, definition);

          return group;

        } catch (error) { // <-- Add catch block
          console.error(`❌ Error during procedural generation for coral1:`, error);
          // Return a visible error placeholder
          return PlaceholderGenerator.createErrorPlaceholder('coral1');
        }
      }
      // ... other coral creation methods with try/catch ...
    }
    ```
*   **Potential Challenges:** Porting JavaScript example code accurately to TypeScript; ensuring materials and geometries are correctly created and disposed of; subtle differences in noise or math functions between examples and TypeScript utils.
*   **Best Practices:** Test each decoration type individually after porting; use shared `DecorationUtils` extensively; ensure placeholders are clearly identifiable.
*   **Definition of Done:** All static `create...` methods in the `decorations/*.ts` files are implemented with functional procedural logic derived from the examples and include robust `try...catch` blocks returning specific placeholders on *internal procedural generation* failure.
*   **Self-Validation:**
    *   [ ] Does each `create...` method contain geometry/material creation logic, not just placeholders?
    *   [ ] Is the core logic of each `create...` method wrapped in a `try...catch`?
    *   [ ] Does the `catch` block log an error and return a `PlaceholderGenerator` object?

**Task 1.2: Refactor `DecorationFactory` to Use Direct Procedural Calls**

*   **Objective:** Modify `DecorationFactory` to directly call the static procedural generation methods implemented in Task 1.1, completely bypassing the `AssetManager` for these types.
*   **Rationale:** This corrects the fundamental flow error where procedural assets were being treated as loadable assets.
*   **Files to Modify:**
    *   `src/game/entities/environment/DecorationFactory.ts`
*   **Sub-tasks:**
    *   [ ] **1.2.1:** Update the `decorationCreators` map at the top of `DecorationFactory.ts` to ensure it includes *all* decoration types listed in `DecorationDefinitions.ts` and maps them to the correct static methods in the `decorations/*.ts` classes (e.g., `'coralRock': RockDecorations.createCoralRock`). Double-check the mapping against the class structure.
    *   [ ] **1.2.2:** In `DecorationFactory.createUniqueDecoration`:
        *   Remove *all* logic related to checking the `decorationCache` or calling `this.assetManager.getAsset`. The factory should now *always* attempt procedural creation first via the `decorationCreators` map. Caching can be handled *internally* within the static creation methods if desired, or re-added later if performance dictates.
        *   Use the `decorationCreators` map to get the correct creator function based on `definition.type`.
        *   Wrap the call to `creatorFunction(definition)` in a `try...catch` block.
        *   If the `creatorFunction` is not found or the call throws an error, log a warning and return `this.createPlaceholderDecoration(definition.type)` (this is the factory's *own* fallback, distinct from the internal fallbacks in the creator methods).
    *   [ ] **1.2.3:** Remove the `assetManager` dependency from the `DecorationFactory` constructor if it's no longer needed for anything else within the factory.
*   **Code Example (Refactored `createUniqueDecoration`):**
    ```typescript
    // src/game/entities/environment/DecorationFactory.ts
    private createUniqueDecoration(
      definition: DecorationDefinition,
      position: THREE.Vector3,
      theme: EnvironmentTheme
    ): THREE.Object3D {
      let decorationObj: THREE.Object3D | null = null;

      try {
        console.log(`DecorationFactory: Creating procedural decoration for ${definition.type}`);
        const creatorFunction = decorationCreators[definition.type];

        if (creatorFunction) {
          // Directly call the static procedural generation method
          decorationObj = creatorFunction(definition); // This method should have its OWN try/catch

          // Check if the creator returned an error placeholder
          if (decorationObj && decorationObj.name.includes('error_placeholder')) {
             console.warn(`Procedural generator for ${definition.type} returned an error placeholder.`);
          }

        } else {
          // No creator function found for this type in our map
          console.warn(`No creator function found for type: ${definition.type}. Using generic placeholder.`);
          decorationObj = this.createPlaceholderDecoration(definition.type);
        }

        // Ensure we have *some* object (even if it's a placeholder)
        if (!decorationObj) {
           console.error(`CRITICAL: Decoration object is null after creation attempt for ${definition.type}. Using emergency placeholder.`);
           decorationObj = PlaceholderGenerator.createErrorPlaceholder(`factory_critical_${definition.type}`);
        }

        // Apply variations (scale, rotation, theme color)
        this.applyVariations(decorationObj, definition, theme);

        // Position decoration
        const finalPosition = position.clone();
        finalPosition.y += definition.yOffset;
        decorationObj.position.copy(finalPosition);

        // Add shadow properties
        decorationObj.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        return decorationObj;

      } catch (factoryError) {
        // Catch any errors during the factory's processing steps
        console.error(`CRITICAL Error in DecorationFactory for ${definition.type}:`, factoryError);
        // Return the factory's specific error placeholder
        return this.createPlaceholderDecoration(`factory_error_${definition.type}`);
      }
    }
    ```*   **Potential Challenges:** Ensuring the `decorationCreators` map is complete and correct; managing dependencies if creator functions require access to other systems (they generally shouldn't).
*   **Best Practices:** Keep creator functions pure where possible; rely on the factory for positioning and theme variations.
*   **Definition of Done:** `DecorationFactory` no longer attempts to load decoration assets. It directly calls the appropriate static creation method from the `decorations/*.ts` classes. Failures in the factory result in a placeholder.
*   **Self-Validation:**
    *   [ ] Search `DecorationFactory.ts`: Is `assetManager.getAsset` called for decorations? (Should be No).
    *   [ ] Does `createUniqueDecoration` use the `decorationCreators` map or a similar mechanism to call static methods?
    *   [ ] Test game: Are decorations appearing? Check console for "Using placeholder" logs (should be minimal, only if procedural generation *itself* fails internally) or "No creator function found" warnings.

**Task 1.3: Clean Up `AssetManager` Registrations**

*   **Objective:** Remove unnecessary asset registrations and `setIgnoreAssets` calls related to procedural decorations.
*   **Rationale:** Simplifies `AssetManager` and prevents confusion about how assets are handled.
*   **Files to Modify:**
    *   `src/game/core/AssetManager.ts`
*   **Sub-tasks:**
    *   [ ] **1.3.1:** In `AssetManager.registerCoreAssets`, delete all lines that register assets with IDs starting `decoration_`.
    *   [ ] **1.3.2:** Review the call to `this.setIgnoreAssets(allAssetIds)`. If its *only* purpose was to ignore decorations, remove the entire call. If it ignores other genuinely loaded-then-ignored assets, modify it to exclude decoration IDs.
*   **Potential Challenges:** Accidentally removing registrations for assets that *are* actually loaded.
*   **Best Practices:** Keep asset registration focused on files that are actually loaded from paths.
*   **Definition of Done:** `AssetManager.ts` no longer contains registrations for procedural decorations. The `setIgnoreAssets` call is either removed or correctly filters out decoration IDs.
*   **Self-Validation:**
    *   [ ] Review `AssetManager.registerCoreAssets`: Are there any `registerAsset` calls with IDs like `'decoration_coral1'`? (Should be No).
    *   [ ] Is the `setIgnoreAssets` call removed or updated?

**Task 1.4: Verify Initialization Sequence & State**

*   **Objective:** Ensure the game reliably initializes and ends up in the `MENU` state, using the updated `GameStartController` logic from `docs/next/nextphases.md`.
*   **Rationale:** Correcting the decoration flow might impact initialization timing. We need to ensure the fixes from `docs/next/nextphases.md` (which centralize control in `GameStartController`) are correctly implemented and functioning.
*   **Files to Review/Modify:**
    *   `src/components/game/GameCanvas.tsx` (Verify `useEffect` initialization flow)
    *   `src/game/core/GameStartController.ts` (Verify `initialize`, `checkAllSystemsReady`, `requestStartGame`, `startCountdownSequence`)
    *   `src/game/core/GameStateManager.ts` (Verify `setState` logic)
    *   `src/components/game/LoadingScreen.tsx` (Verify it only reacts to state, doesn't trigger changes)
    *   `src/components/game/GameStateDisplay.tsx` (Verify it reacts to events, doesn't manage timing)
*   **Sub-tasks:**
    *   [ ] **1.4.1:** Review the implementation of `GameStartController.initialize`. Confirm it correctly awaits `initializeRenderingSystem`, `loadAssets`, and `initializeAudio`.
    *   [ ] **1.4.2:** Verify that *after* all systems are ready (e.g., in `checkAllSystemsReady` or at the end of `initialize`), `GameStartController` explicitly calls `gameStateManager.setState('MENU')`.
    *   [ ] **1.4.3:** Confirm that `LoadingScreen.tsx`'s failsafe timeout *only logs* a warning and does *not* call `gameStateManager.setState`.
    *   [ ] **1.4.4:** Confirm that `GameStateDisplay.tsx` *only* displays the countdown value received via the `countdown-update` event and does *not* manage the timing itself.
    *   [ ] **1.4.5:** Test game loading repeatedly. Check console logs for the state transition sequence (should reliably end in `MENU`).
*   **Potential Challenges:** Subtle timing issues between async initializations; React StrictMode causing double initialization calls in development (mitigated by flags in `GameCanvas.tsx`).
*   **Best Practices:** Centralize initialization orchestration in `GameStartController`; use events for cross-component communication; avoid state changes in UI components.
*   **Definition of Done:** The game consistently loads into the `MENU` state. Console logs show the correct initialization sequence managed by `GameStartController`. `LoadingScreen` and `GameStateDisplay` behave passively regarding state changes.
*   **Self-Validation:**
    *   [ ] Does the game consistently show the Menu UI first?
    *   [ ] Check console logs: Is `gameStateManager.setState('MENU')` called by `GameStartController` *after* asset/audio/renderer checks complete?
    *   [ ] Check `LoadingScreen.tsx` and `GameStateDisplay.tsx`: Are there any `gameStateManager.setState` calls remaining? (Should be No).

---

### Phase 2: System Refinement & Cleanup

**Task 2.1: Refine Character Movement Trigger**

*   **Objective:** Solidify the character movement start trigger, ensuring it *only* relies on the `game-start-movement` event while the game is in the `PLAYING` state, removing any remaining failsafes or redundant listeners identified in `docs/next/nextphases.md` (Task 3).
*   **Rationale:** Ensures a single, reliable trigger for movement, preventing the "stuck on GO!" bug.
*   **Files to Review/Modify:**
    *   `src/game/entities/character/CharacterController.ts`
    *   `src/game/core/GameStateManager.ts`
*   **Sub-tasks:**
    *   [ ] **2.1.1:** Thoroughly review `CharacterController.ts`. Remove *any* remaining listeners for `game-start`, `verify-character-movement`, `nemo-game-start-playing`, or `game-state-change` that *initiate* movement (`this.isMoving = true`).
    *   [ ] **2.1.2:** Ensure the *only* place `this.isMoving` is set to `true` initially is within the `game-start-movement` event handler, guarded by a check `if (gameStateManager.state === 'PLAYING' && !this.isMoving)`.
    *   [ ] **2.1.3:** Verify the `moveForward` call within the `game-start-movement` handler provides a sufficient initial impulse.
    *   [ ] **2.1.4:** Review `CharacterController.update`. Remove any logic that checks `gameState === 'PLAYING'` and sets `this.isMoving = true`. The update loop should only move the character *if* `this.isMoving` is *already* true. Keep the stuck detection (`lastPositionZ` check).
    *   [ ] **2.1.5:** Double-check `GameStateManager.handleStateSpecifics`. Confirm `eventBus.emit('game-start-movement', ...)` is called reliably *only* when entering the `PLAYING` state.
*   **Potential Challenges:** Reintroducing the stuck bug if the event timing isn't perfect or if the initial impulse isn't enough.
*   **Best Practices:** Single, clear event trigger; state guards within handlers.
*   **Definition of Done:** Character movement starts reliably *only* via the `game-start-movement` event when the game state is `PLAYING`. All other triggers are removed.
*   **Self-Validation:**
    *   [ ] Test starting the game 10 times. Does the character *always* start moving?
    *   [ ] Search `CharacterController.ts`: Are there any other places `this.isMoving = true` is set besides the `game-start-movement` handler? (Should be No, except potentially on resume from pause).
    *   [ ] Check console logs: Is `[CharacterController] Initializing character movement via event` logged exactly once per game start?

**Task 2.2: Finalize UI Component Visibility Logic**

*   **Objective:** Ensure `GameStateDisplay` and `GameUI` render correctly based on the game state, using the pattern established in `docs/next/nextphases.md` (Task 4).
*   **Rationale:** Prevents UI elements from overlapping or showing at incorrect times.
*   **Files to Review/Modify:**
    *   `src/components/game/GameCanvas.tsx`
    *   `src/components/game/GameStateDisplay.tsx`
    *   `src/components/game/GameUI.tsx`
*   **Sub-tasks:**
    *   [ ] **2.2.1:** Review `GameCanvas.tsx`. Confirm it uses a state variable (like `showStateOverlays` or similar logic based on `gameState`) to conditionally render `<GameStateDisplay />` only for `MENU`, `READY`, `PAUSED`, `GAME_OVER`.
    *   [ ] **2.2.2:** Confirm `<GameUI />` is rendered but has internal logic (or receives props) to only display its content when `gameState` is `PLAYING`.
    *   [ ] **2.2.3:** Remove any self-hiding logic from `GameStateDisplay.tsx` based on the `PLAYING` or `LOADING` state.
*   **Potential Challenges:** CSS transition timing causing slight overlaps.
*   **Best Practices:** Parent component (`GameCanvas`) controls layout/visibility; child components focus on rendering their specific state.
*   **Definition of Done:** UI overlays display correctly for each game state without incorrect overlap.
*   **Self-Validation:**
    *   [ ] Cycle through game states (Menu -> Start -> Pause -> Resume -> Game Over -> Menu). Does the correct UI show for each state?
    *   [ ] Is the HUD (`GameUI`) *only* visible during `PLAYING`?
    *   [ ] Is the Menu/Pause/Game Over overlay (`GameStateDisplay`) hidden during `PLAYING`?

---

### Phase 3: Address Secondary Issues

**Task 3.1: Fix Next.js Server Error (`headers()` usage)**

*   **Objective:** Resolve the server-side error related to `headers()`.
*   **Rationale:** This error impacts server rendering and potentially deployment.
*   **Files to Review/Modify:**
    *   `src/app/layout.tsx`
    *   `src/app/page.tsx`
    *   Any other component potentially using `next/headers` functions or hooks like `useSearchParams`, `usePathname` within the root layout or page.
*   **Sub-tasks:**
    *   [ ] **3.1.1:** Identify the exact component and line causing the `headers()` error from the server console stack trace.
    *   [ ] **3.1.2:** Choose a fix strategy:
        *   **If headers are needed server-side:** Convert the component (or a parent) to an `async` Server Component and `await headers()`.
        *   **If headers data is not needed for initial render:** Wrap the specific part using the dynamic function/hook in `<React.Suspense fallback={...}>`.
        *   **Refactor:** Move the logic requiring headers to a Client Component and fetch/access the data using client-side hooks (`useEffect`, `useSearchParams` from `next/navigation`).
    *   [ ] **3.1.3:** Implement the chosen fix.
    *   [ ] **3.1.4:** Test by reloading the root page (`/`) and checking the server console for the error.
*   **Potential Challenges:** Identifying the exact source if it's indirect (e.g., a child component using `useSearchParams`); choosing the best fix strategy without negatively impacting performance or SEO.
*   **Best Practices:** Use Server Components for server data fetching; use Client Components for browser-specific APIs and client-side hooks; use `Suspense` for dynamically loaded client components.
*   **Definition of Done:** The `headers()` server error no longer appears when loading the application.
*   **Self-Validation:**
    *   [ ] Restart the dev server (`npm run dev`).
    *   [ ] Load the application's root route (`/`).
    *   [ ] Check the *server* console output. Is the `headers()` error gone?

---

### Phase 4: Performance Tuning & Final Testing

**Task 4.1: Performance Profiling and Optimization**

*   **Objective:** Address the "Severe performance issues" warnings by identifying and fixing bottlenecks now that procedural generation is correctly implemented.
*   **Rationale:** Ensure smooth gameplay, especially on target devices.
*   **Files to Review/Modify:** Potentially many, guided by profiling results:
    *   `src/game/core/GameLoop.ts`
    *   `src/game/core/GameEngine.ts`
    *   `src/game/core/RenderingInitializer.ts`
    *   `src/game/entities/**` (All entity update methods)
    *   `src/game/entities/environment/**` (Environment generation and culling)
    *   `src/game/utils/PerformanceMonitor.ts` / `QualityAdjuster.ts` (Ensure they are working correctly)
*   **Sub-tasks:**
    *   [ ] **4.1.1:** Play the game under various conditions (many obstacles, different environments).
    *   [ ] **4.1.2:** Use browser Performance profiling tools to record sessions where the warnings appear.
    *   [ ] **4.1.3:** Analyze traces: Identify long JavaScript tasks, expensive rendering operations (GPU time), frequent garbage collection.
    *   [ ] **4.1.4:** Implement targeted optimizations:
        *   Review `GameLoop` and `GameEngine` update functions for expensive calculations.
        *   Optimize entity `update` methods – can calculations be cached or skipped for distant/inactive entities?
        *   Verify `ProceduralEnvironment` culling (`cullSegments`) is effective.
        *   Verify `ObstacleManager` limits (`enforceLimits`) are working.
        *   Check if LODs are being applied correctly based on distance/quality.
        *   Optimize any complex custom shaders.
    *   [ ] **4.1.5:** Re-profile after optimizations to confirm improvement.
*   **Potential Challenges:** Difficulty pinpointing specific bottlenecks; balancing visual quality with performance; optimizations introducing subtle bugs.
*   **Best Practices:** Profile first, optimize second; target the biggest bottlenecks; test on low-end devices/simulators.
*   **Definition of Done:** The "Severe performance issues" warnings are significantly reduced or eliminated. Gameplay feels smooth (target 60 FPS where feasible).
*   **Self-Validation:**
    *   [ ] Play the game for 5 minutes. Are the performance warnings gone or rare?
    *   [ ] Check FPS using browser dev tools or a library. Is it stable and meeting targets for the quality level?

**Task 4.2: Final Comprehensive Testing**

*   **Objective:** Ensure overall game stability, functionality, and user experience after all fixes.
*   **Rationale:** Catch any regressions introduced during the fixes and verify the game meets quality standards.
*   **Sub-tasks:**
    *   [ ] **4.2.1:** Test the full game loop: Menu -> Game Start -> Gameplay -> Pause -> Resume -> Game Over -> Restart -> Menu.
    *   [ ] **4.2.2:** Test on different screen sizes (desktop, tablet, mobile simulation).
    *   [ ] **4.2.3:** Test different environment transitions.
    *   [ ] **4.2.4:** Test all power-ups.
    *   [ ] **4.2.5:** Attempt edge cases (e.g., rapid pausing/resuming, clicking start multiple times).
*   **Definition of Done:** The game is stable, all core features work as expected, and no major bugs or visual glitches are present.
*   **Self-Validation:**
    *   [ ] Can the game be played from start to finish without crashing?
    *   [ ] Do all UI elements update correctly?
    *   [ ] Are there any obvious visual errors or glitches?

This detailed plan provides a structured approach to fixing the primary procedural generation issues, addressing the server error, and laying the groundwork for performance optimization, moving the game closer to a stable, playable state.
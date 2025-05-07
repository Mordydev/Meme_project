## NEMO Runner Finalization & Optimization Plan

**Overall Goal:** To achieve a stable, performant, and visually polished core gameplay loop by resolving initialization issues, eliminating redundancies, integrating procedural assets correctly, refactoring key components, and finalizing the UI.

---

### Phase 1: Foundation Cleanup & Integration (Critical Path)

**Task 1: Finalize Initialization & Procedural Fallback Logic**

*   **Objective:** Ensure the game initializes reliably and correctly uses *existing* procedural generation logic within entity classes when assets are intentionally ignored or unavailable. Eliminate "asset loading" errors caused by missing procedural fallbacks.
*   **Key Details:**
    *   The primary issue is *not* failed asset loading, but the failure to invoke procedural generation when an asset isn't loaded (because it was never meant to be).
    *   Modify entity constructors/initialization methods to *directly* call their internal procedural generation logic (`create...Mesh`/`create...Model`) instead of attempting to load an asset first if the entity is designed to be purely procedural.
    *   For entities that *could* load an asset but might use procedural as a fallback (less likely based on current design but good practice), check `assetManager.getAsset()`. If `null`, *then* call the procedural method.
    *   Implement robust `try...catch` blocks around *all* procedural generation calls within entity classes (`CoralDecorations.create...`, `RockDecorations.create...`, `Shark.createSharkMesh`, `Pufferfish.createPufferfishMesh`, etc.).
    *   Inside the `catch` block for a failed procedural generation, create and return a simple, visible placeholder mesh (e.g., a bright red `THREE.BoxGeometry`) and log a `console.error` clearly stating which entity/decoration failed its procedural generation.
*   **Files to Review/Modify:**
    *   `src/game/entities/character/CharacterModel.ts` (`createModel` method)
    *   `src/game/entities/obstacles/Shark.ts` (`createSharkMesh` method)
    *   `src/game/entities/obstacles/Jellyfish.ts` (`createJellyfishMesh` method)
    *   `src/game/entities/obstacles/Pufferfish.ts` (`createPufferfishMesh` method)
    *   `src/game/entities/obstacles/Clam.ts` (`createClamMesh` method)
    *   `src/game/entities/obstacles/Coral.ts` (`createCoralMesh` method)
    *   `src/game/entities/environment/decorations/*.ts` (All `create...` static methods)
    *   `src/game/entities/environment/DecorationFactory.ts` (`createUniqueDecoration` method - ensure it handles failures from `DecorationModels`)
    *   `src/game/core/AssetManager.ts` (Review `getAsset` logging; `setIgnoreAssets` calls might now be redundant if procedural entities don't attempt loading).
    *   `src/game/core/RenderingInitializer.ts` / `src/game/core/GameStartController.ts` (Ensure asset loading waits correctly, but doesn't block if assets are correctly ignored/procedural).
*   **Sub-tasks:**
    *   [ ] Audit each entity/decoration creation method to confirm if it's asset-based or procedural.
    *   [ ] Modify constructors/creation methods to directly call procedural logic where appropriate.
    *   [ ] Add `try...catch` around all procedural generation calls.
    *   [ ] Implement the visible error placeholder generation in the `catch` blocks.
    *   [ ] Test game initialization repeatedly, checking console for errors and verifying placeholders appear *only* on *actual* procedural generation failures.
    *   [ ] Remove `setIgnoreAssets` calls in `AssetManager` if entities no longer attempt to load ignored assets.
*   **Potential Challenges:** Procedural generation code ported from examples might be incomplete or contain errors; ensuring placeholders are distinct enough to identify the failed component.
*   **Best Practices:** Fail gracefully – placeholders are better than crashes; clear error logging.
*   **Self-Validation:**
    *   [ ] Does the game start consistently without 404s or errors related to *ignored* assets?
    *   [ ] Do console logs confirm that procedural generation methods are being called directly for relevant entities?
    *   [ ] If a procedural method *fails*, does a visible placeholder appear and is a clear error logged?

**Task 2: Consolidate Shader Usage via `ShaderLibrary`**

*   **Objective:** Eliminate shader code redundancy by ensuring all custom shaders utilize the `ShaderLibrary`.
*   **Key Details:** Scan the codebase for `new THREE.ShaderMaterial` instantiations or raw GLSL strings. Refactor these to use `#include <chunk_name>` directives for common functions (noise, fresnel, lighting, animation utilities) defined in `ShaderLibrary.ts`. Use the `createShaderWithLibrary` helper function.
*   **Files to Review/Modify:**
    *   `src/game/entities/obstacles/*.ts` (Check `create...ShaderMaterial` methods).
    *   `src/game/entities/collectibles/CollectibleManager.ts` (Check `createBubbleMaterial`, `createPowerupMaterial`).
    *   `src/game/entities/character/CharacterModel.ts` (If custom shaders are used).
    *   `src/game/entities/environment/WaterEffects.ts` (Check caustics, particles, ripples shaders).
    *   `src/game/entities/environment/GroundSystem.ts` (Check ground shader).
    *   Any other file defining `ShaderMaterial`.
*   **Sub-tasks:**
    *   [ ] Identify all custom shader implementations.
    *   [ ] Add any missing common functions to `ShaderLibrary.ts`.
    *   [ ] Refactor existing shaders to use `#include` directives.
    *   [ ] Replace shader instantiation with `createShaderWithLibrary`.
    *   [ ] Test visuals meticulously to ensure no regressions after refactoring.
*   **Potential Challenges:** Ensuring shader logic remains identical; managing uniforms correctly after includes.
*   **Best Practices:** Keep shader chunks small and focused; comment includes clearly.
*   **Self-Validation:**
    *   [ ] Is shader code significantly reduced and less repetitive?
    *   [ ] Are `#include` directives used consistently for common GLSL functions?
    *   [ ] Do all visual effects and entity appearances remain correct?

**Task 3: Standardize Noise Generation via `NoiseGenerator.ts`**

*   **Objective:** Ensure all procedural noise calculations use the centralized `NoiseGenerator` utility.
*   **Key Details:** Search for `Math.random()` used for procedural *shape/placement* variation (keep it for simple probability checks), `simplex.noise3D`, `fbm`, or other custom noise implementations within entity and environment generation code. Replace these with calls to methods on a `NoiseGenerator` instance.
*   **Files to Review/Modify:**
    *   `src/game/entities/environment/decorations/*.ts` (All procedural geometry generation).
    *   `src/game/entities/obstacles/*.ts` (Any procedural deformation).
    *   `src/game/entities/environment/GroundSystem.ts` (Terrain height/texture generation).
    *   `src/game/entities/environment/WaterEffects.ts` (Potentially for particle movement or caustics, though shaders are preferred here).
*   **Sub-tasks:**
    *   [ ] Search codebase for non-standard noise generation patterns.
    *   [ ] Ensure `NoiseGenerator` instances are available where needed (pass via constructor or use a shared instance).
    *   [ ] Refactor procedural generation logic to use `noiseGenerator.noise2D/3D/fractal2D`.
    *   [ ] Test procedural outputs visually to confirm consistency.
*   **Potential Challenges:** Ensuring noise parameters (frequency, amplitude, octaves) translate correctly; managing `NoiseGenerator` instances effectively.
*   **Best Practices:** Use seeded noise for reproducible results during testing; encapsulate noise logic within the generator.
*   **Self-Validation:**
    *   [ ] Are all procedural generation noise calls routed through `NoiseGenerator.ts`?
    *   [ ] Do procedural elements (terrain, rocks, coral shapes) look consistent with their intended design?
    *   [ ] Are there no remaining custom noise functions defined within entity/decoration classes?

**Task 4: Streamline Game Start Character Movement**

*   **Objective:** Ensure character movement starts reliably and *immediately* after the "GO!" countdown state finishes, relying on a single, robust event chain. Remove redundant failsafes.
*   **Key Details:** The primary trigger should be the transition to the `PLAYING` state, which should emit the `game-start-movement` event. `CharacterController` should listen *only* for this event to initiate movement. Remove the multiple `setTimeout` failsafes, DOM event listeners, and redundant event emissions added in `GameStateImplementation.md` as temporary fixes.
*   **Files to Review/Modify:**
    *   `src/game/core/GameStateManager.ts`: Ensure `setState` to `PLAYING` reliably emits `game-start-movement` *after* the state is fully set and `game-state-change` has been emitted.
    *   `src/components/game/GameStateDisplay.tsx`: Remove all `setTimeout` logic related to forcing state changes or emitting `game-start-movement`. It should purely *display* the state and countdown values provided by the manager/controller. Ensure it correctly hides itself when the state changes *away* from READY/LOADING/etc.
    *   `src/game/entities/character/CharacterController.ts` / `Character.ts`: Remove *all* redundant event listeners (`game-start`, `verify-character-movement`, DOM events, `setTimeout` failsafes). Have *one* primary listener for `game-start-movement` that sets `this.isMoving = true` and potentially applies a small initial forward impulse. Ensure the `update` loop reliably moves the character forward *if* `this.isMoving` is true and `gameStateManager.state === 'PLAYING'`. Strengthen the stuck detection slightly if needed (e.g., check over 2-3 frames).
    *   `src/game/core/GameStartController.ts`: Ensure it correctly signals readiness (`all-systems-ready`) leading to `GameStateManager` setting state to `READY`. It should *not* directly trigger `PLAYING` or `game-start-movement`.
*   **Sub-tasks:**
    *   [ ] Identify and remove all redundant/failsafe movement triggers (`setTimeout`, extra `emit` calls, DOM listeners) in reviewed files.
    *   [ ] Ensure `GameStateManager` emits `game-start-movement` reliably upon entering `PLAYING` state.
    *   [ ] Simplify `Character.ts`/`CharacterController.ts` to listen *only* for `game-start-movement` to initiate movement.
    *   [ ] Test game start sequence thoroughly under various conditions (fast/slow machine, quick clicks).
*   **Potential Challenges:** Reintroducing the "stuck on GO!" bug if the primary event chain has a subtle timing issue; debugging the exact moment movement should start.
*   **Best Practices:** Single source of truth for state transitions; clear event-driven flow; minimal use of timers for core logic.
*   **Self-Validation:**
    *   [ ] Does character movement start *immediately* and reliably after the "GO!" display finishes?
    *   [ ] Are all previously added redundant triggers and failsafes removed from the code?
    *   [ ] Do console logs show a clean, single `game-start-movement` event triggering the character?

---

### Phase 2: Entity & Environment Refinement

**Task 5: Refine Decoration Implementation (`decorations/*.ts`)**

*   **Objective:** Improve maintainability and reduce potential redundancy within the specialized decoration creation classes.
*   **Key Details:** Review the static `create...` methods within `CoralDecorations.ts`, `RockDecorations.ts`, `VegetationDecorations.ts`, `ShipwreckDecorations.ts`, `DeepSeaDecorations.ts`, and `FloatingDecorations.ts`. Look for:
    *   Repeated geometry deformation logic (e.g., applying noise).
    *   Similar material creation patterns.
    *   Common positioning or clustering algorithms.
    *   Extract these common parts into private static helper methods within the same class or potentially into a new `DecorationUtils.ts` if broadly applicable.
*   **Sub-tasks:**
    *   [ ] Analyze code within each `decorations/*.ts` file for repeated patterns.
    *   [ ] Identify potential helper functions (e.g., `applyVertexNoise`, `createVariedMaterial`, `positionInCluster`).
    *   [ ] Implement helper functions and refactor `create...` methods to use them.
    *   [ ] Test that decorations still generate correctly and visually match previous versions.
*   **Potential Challenges:** Finding the right level of abstraction for helpers; ensuring helpers are flexible enough for different decoration types.
*   **Best Practices:** DRY (Don't Repeat Yourself); clear function naming; keep helpers focused.
*   **Self-Validation:**
    *   [ ] Is the code within decoration classes more concise?
    *   [ ] Are common procedural techniques encapsulated in reusable helper functions?
    *   [ ] Do all decorations still generate correctly?

**Task 6: Optimize Obstacle Implementations (`obstacles/*.ts`)**

*   **Objective:** Review and optimize existing obstacle classes for performance and visual fidelity according to the quality level.
*   **Key Details:**
    *   **LODs:** Ensure `create...Mesh` methods correctly generate/select geometry based on the `qualityLevel` constructor argument. Verify triangle counts align with targets in `docs/ObstacleImplementation.md`.
    *   **Materials:** Check material complexity. Are `ShaderMaterial` instances being created unnecessarily for medium/low quality? Use `material.clone()` efficiently. Ensure materials are disposed of correctly in the `dispose` method.
    *   **Animation:** For shader-based animations (Shark undulation, Jellyfish pulse/sway, Pufferfish inflation), ensure uniforms are updated efficiently in the `update` method. For mixer-based animations (Shark attack/chase), ensure transitions are smooth and actions are stopped/reset correctly. Review the fallback animation logic (`updateFallbackAnimation`) in `Shark.ts` - is it still needed if the mixer setup is robust?
    *   **Collision:** Verify collider shapes (`Box3`, `Sphere`) are appropriate and updated correctly in `updateCollider`. Could simpler shapes be used when the obstacle is far away?
*   **Files to Review/Modify:**
    *   `src/game/entities/obstacles/Shark.ts`
    *   `src/game/entities/obstacles/Jellyfish.ts`
    *   `src/game/entities/obstacles/Pufferfish.ts`
    *   `src/game/entities/obstacles/Clam.ts`
    *   `src/game/entities/obstacles/Coral.ts`
*   **Sub-tasks:**
    *   [ ] Verify LOD geometry selection/generation based on `qualityLevel`.
    *   [ ] Optimize material creation and cloning.
    *   [ ] Review animation update logic (shader uniforms and mixer).
    *   [ ] Assess collider accuracy and update frequency.
    *   [ ] Profile performance with many obstacles active.
*   **Potential Challenges:** Balancing visual quality across LODs; optimizing complex shader animations; ensuring accurate collision detection without performance hits.
*   **Best Practices:** Profile before optimizing; use instancing where possible (though less applicable for unique obstacles); simplify distant objects.
*   **Self-Validation:**
    *   [ ] Do obstacles visually match the intended quality level?
    *   [ ] Is performance acceptable when many obstacles are on screen?
    *   [ ] Are materials and geometries being disposed of correctly when obstacles are removed/pooled?

---

### Phase 3: Game Engine Refactoring & UI Polish

**Task 7: Refactor `GameEngine.ts`**

*   **Objective:** Streamline `GameEngine` to focus on orchestrating game systems, delegating initialization and rendering responsibilities.
*   **Key Details:**
    *   Remove renderer, scene, and camera creation logic – this should be handled by `RenderingInitializer` and the results passed *to* `GameEngine` (or accessed via a singleton/context).
    *   Modify `GameEngine`'s constructor to accept pre-initialized core components (renderer, scene, camera, assetManager, audioManager).
    *   Ensure the `render` method in `GameEngine` is removed or simply calls `renderingInitializer.render()`.
    *   Verify that `GameLoop` is instantiated with the correct, simplified `updateFn`, `fixedUpdateFn`, and the delegated `renderFn`.
    *   The `updateGame` and `updatePhysics` methods should primarily contain the calls to `this.player.update()`, `this.obstacleManager.update()`, `this.collectibleManager.update()`, `this.environment.update()`, `this.collisionSystem.update()`, etc.
*   **Files to Modify:**
    *   `src/game/core/GameEngine.ts`
    *   `src/components/game/GameCanvas.tsx` (Adjust initialization call to `GameEngine` constructor).
    *   `src/game/core/RenderingInitializer.ts` (Ensure it provides access to necessary components).
*   **Sub-tasks:**
    *   [ ] Refactor `GameEngine` constructor.
    *   [ ] Remove initialization code from `GameEngine`.
    *   [ ] Remove rendering code from `GameEngine`.
    *   [ ] Update `GameCanvas.tsx` instantiation.
    *   [ ] Test the game's core loop and initialization process thoroughly.
*   **Potential Challenges:** Managing dependencies correctly after refactoring; ensuring the correct order of updates is maintained.
*   **Best Practices:** Dependency injection; clear separation of concerns; single responsibility principle.
*   **Self-Validation:**
    *   [ ] Is `GameEngine.ts` significantly smaller and focused on system coordination and updates?
    *   [ ] Does the game initialize and run correctly after the refactor?
    *   [ ] Is rendering handled outside of `GameEngine`?

**Task 8: Finalize UI/UX Polish**

*   **Objective:** Complete all UI elements, ensure smooth transitions, and implement basic accessibility features.
*   **Key Details:**
    *   **Implement Remaining Elements:** Based on `progress.md`, finish any missing HUD elements (e.g., power-up timers if not fully done), settings screens, tutorial prompts/overlays.
    *   **Refine Transitions:** Polish CSS animations/transitions in `GameUI.module.css` for smoother fades/slides between states shown in `GameStateDisplay.tsx`. Ensure `EnhancedUI.tsx` effects (vignette, damage flash, environment tint) are subtle and performant.
    *   **Responsiveness:** Test UI thoroughly on different screen sizes (mobile, tablet, desktop) and aspect ratios. Adjust CSS using media queries as needed.
    *   **Accessibility:** Implement basic features: keyboard navigation for menus (tab, enter, escape), sufficient color contrast, ARIA labels for buttons/interactive elements (`docs/nemo-game.md`).
*   **Files to Review/Modify:**
    *   `src/components/game/GameUI.tsx`
    *   `src/components/game/GameElements.tsx`
    *   `src/components/game/GameStateDisplay.tsx`
    *   `src/components/game/EnhancedUI.tsx`
    *   `src/styles/GameUI.module.css`
    *   `src/styles/GameElements.module.css`
*   **Sub-tasks:**
    *   [ ] Build any missing UI components.
    *   [ ] Refine CSS for transitions and effects.
    *   [ ] Add ARIA labels and implement basic keyboard navigation.
    *   [ ] Test UI responsiveness across multiple viewport sizes.
    *   [ ] Verify color contrast meets accessibility standards (WCAG AA).
*   **Potential Challenges:** Achieving smooth CSS animations across all browsers/devices; implementing robust keyboard navigation; ensuring state syncing between `GameStateManager` and UI components is flawless.
*   **Best Practices:** Use hardware-accelerated CSS properties (transform, opacity); test with accessibility tools; keep UI logic separate from game logic.
*   **Self-Validation:**
    *   [ ] Are all required UI elements present and functional?
    *   [ ] Are transitions between game states visually smooth?
    *   [ ] Is the UI responsive and usable on different screen sizes?
    *   [ ] Can menus be navigated using only the keyboard?
    *   [ ] Do interactive elements have appropriate ARIA labels?

---

### Phase 4: Final Testing & Optimization

**Task 9: Comprehensive Testing**

*   **Objective:** Validate game stability, functionality, performance, and user experience across target platforms.
*   **Key Details:** Execute a mix of automated tests (unit/integration if feasible) and manual playtesting. Cover:
    *   Core gameplay loop (movement, collision, collection).
    *   State transitions (menu, ready, playing, paused, game over).
    *   Initialization and error recovery.
    *   Obstacle patterns and difficulty scaling.
    *   Power-up activation/deactivation and effects.
    *   UI responsiveness and correctness.
    *   Performance on low, mid, and high-end device profiles (emulated and real if possible).
*   **Sub-tasks:**
    *   [ ] Define test cases covering core features and edge cases.
    *   [ ] Perform structured playtesting sessions targeting different user personas.
    *   [ ] Use browser developer tools to simulate different network/CPU conditions.
    *   [ ] Document all bugs/issues found with clear reproduction steps.
    *   [ ] Verify all fixes.
*   **Potential Challenges:** Reproducing device-specific bugs; testing long play sessions for memory leaks or performance degradation.
*   **Best Practices:** Clear bug reporting; systematic testing approach; regression testing after fixes.
*   **Self-Validation:**
    *   [ ] Have all critical and major bugs been identified and fixed?
    *   [ ] Does the game perform acceptably on all target device profiles?
    *   [ ] Is the gameplay loop stable and engaging?

**Task 10: Performance Profiling & Final Optimization**

*   **Objective:** Identify and resolve any remaining performance bottlenecks for a smooth 60 FPS target (where feasible).
*   **Key Details:** Use browser profiling tools (Performance tab, Memory tab) to analyze:
    *   **CPU Usage:** Identify long tasks, excessive script execution time, layout thrashing. Focus on `update` loops (`GameEngine`, entity updates).
    *   **GPU Usage:** Analyze frame times, draw calls, shader performance. Look for bottlenecks in rendering complex scenes or effects.
    *   **Memory Allocation:** Check for memory leaks by running long sessions and observing memory heap snapshots. Ensure object pools are effective and `dispose()` methods are correctly cleaning up GPU resources.
    *   Apply targeted micro-optimizations based on findings (e.g., caching calculations, reducing object creation in loops, optimizing shader logic).
*   **Sub-tasks:**
    *   [ ] Profile gameplay during high-intensity moments (many obstacles/effects).
    *   [ ] Analyze performance traces to pinpoint bottlenecks.
    *   [ ] Implement specific optimizations based on analysis.
    *   [ ] Re-profile and test to confirm improvements and avoid regressions.
    *   [ ] Verify garbage collection behavior and memory usage stability.
*   **Potential Challenges:** Interpreting profiling data accurately; optimizing without introducing new bugs; balancing performance gains vs. code complexity.
*   **Best Practices:** Profile, Measure, Optimize, Repeat; focus on the biggest bottlenecks first; test optimizations on target devices.
*   **Self-Validation:**
    *   [ ] Does the game consistently meet or exceed FPS targets on target devices?
    *   [ ] Are frame times relatively smooth without major spikes?
    *   [ ] Is memory usage stable over longer play sessions?

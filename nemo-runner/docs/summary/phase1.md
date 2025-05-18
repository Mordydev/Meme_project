## Phase 1 Summary: Playable Core Game Prototype (in Next.js)

### Step 7: Enhance Environment Visuals to Pixar Style (Seafloor, Kelp, Water Surface, Lighting)

**Status: In Progress**

**Implementation Checkpoint: 2025-05-12 (Integrated SeafloorAsset)**

#### Implemented Changes (Sub-Task 2.1, 2.5 Partial, 2.2, and Integration):
- **Sub-Task 2.1 (Completed):**
    - Defined/Refined visual parameters in `src/lib/game/config/gameConfig.ts` (`SeafloorVisualConfig`, `KelpVisualConfig`, `WaterSurfaceVisualConfig`, `LightingConfig` reorganization).
- **Sub-Task 2.5 (Partial - Core `LightingManager` Updates - Completed):**
    - Refactored `LightingManager.ts` for new caustic approach (added `globalCausticTimeUniform`, `getCausticGLSLChunk`, `getDirectionalLight`, shader chunk registration).
- **Sub-Task 2.2 (Completed): Refactor `SeafloorAsset.ts` for Enhanced Visuals:**
    - Completely refactored `src/lib/game/assets/environment/SeafloorAsset.ts`.
    - Constructor now takes `ShaderManager` and `LightingManager` dependencies.
    - Fetches `SeafloorVisualConfig` from `configSystem`.
    - Implemented `_createSandTexture()`: uses Canvas API to generate a procedural sand texture with base color and splotches based on config.
    - Implemented `_createSandBumpMap()`: uses Canvas API to generate a procedural bump map for sand details.
    - Implemented `_createMaterial()`:
        - Initializes a `THREE.MeshStandardMaterial`.
        - Assigns the procedurally generated `sandTexture` (to `map`) and `sandBumpMap` (to `bumpMap`).
        - If `enableCaustics` is true in `LightingConfig`, it uses `material.onBeforeCompile` to inject caustic rendering logic:
            - Adds uniforms: `uCausticColor`, `uCausticIntensity`, `uCausticScale`, `uCausticSpeed` (from `LightingConfig`).
            - Links shader uniform `uTime` to `lightingManager.globalCausticTimeUniform`.
            - Passes `vWorldPosition_Seafloor` from vertex to fragment shader.
            - Injects GLSL code from `lightingManager.getCausticGLSLChunk()` (containing noise functions and caustic pattern logic).
            - Modifies the material's fragment shader to calculate and blend the caustic color with the diffuse color, supporting different `causticBlendMode` options from config.
    - `createMesh()` now uses this enhanced material with a `THREE.PlaneGeometry`.
    - UVs are handled by Three.js default PlaneGeometry UVs in conjunction with texture `repeat` settings derived from `textureScale`.
    - Includes a `dispose()` method to clean up textures and material.
    - Segment dimensions (`segmentWidth`, `segmentLength`) are calculated based on `gameConfig` values.
- **Integration of SeafloorAsset:**
    - **`ProceduralAssetFactory.ts` modified:**
        - Constructor now accepts `LightingManager` as a dependency.
        - Stores the `LightingManager` instance.
        - Passes both `ShaderManager` and `LightingManager` to the `SeafloorAsset` constructor during its own instantiation.
        - `createSeafloorSegmentMesh()` now uses the `seafloorAssetGenerator` instance (which is initialized with `LightingManager`) directly.
    - **`GameEngine.ts` modified:**
        - When `ProceduralAssetFactory` is instantiated, the `lightingManager` instance is now passed to its constructor.
        - Removed an obsolete call to `this.assetFactory.seafloorAsset.linkLightingManager(this.lightingManager);`.
    - **Linter Errors in `GameEngine.ts` Addressed:**
        - Changed type of `this.renderer` to `THREE.WebGLRenderer | null` to allow null assignment.
        - Cast WebGL context event handlers to `EventListener` in `addEventListener` and `removeEventListener` calls to satisfy linter.
- **Shader Compilation Error Resolution (Attempt 1 - `LightingManager.ts`):**
    - Removed direct assignments to `THREE.ShaderChunk` from `LightingManager.registerShaderChunks()` to prevent potential duplicate GLSL function definitions when `getCausticGLSLChunk()` is used for manual injection in `SeafloorAsset.ts`.
- **Shader Compilation Error Resolution (Attempt 2 - `SeafloorAsset.ts`):**
    - Modified `SeafloorAsset.ts` in the `onBeforeCompile` section of `_createMaterial()`:
        - Ensured all custom uniforms required for caustics (`uTime`, `uCausticScale`, `uCausticIntensity`, `uCausticColor`, `uCausticSpeed`) are explicitly declared at the beginning of the fragment shader's GLSL.
        - Confirmed `varying vec3 vWorldPosition_Seafloor;` is also declared in the fragment shader and its assignment in the vertex shader is correctly placed.
- **Shader Error Resolution & Water Surface Implementation (Current Session):**
    - **`noise.glsl.ts` Refined:**
        - Removed the embedded "random2D" definition from `noise2D` string to prevent duplicate function bodies when `random2D` is provided separately. `noise2D` now relies on an externally provided `random2D`.
    - **`caustics.glsl.ts` Enhanced:**
        - Added an FBM-based `getCausticColor` GLSL function for more advanced caustic patterns.
        - Introduced an exported `causticPattern` string that includes the `FBM` and `getCausticColor` logic.
        - Updated `CausticsGLSL` default export to include these new exports.
    - **`LightingManager.ts` Updated for New Caustics:**
        - `registerShaderChunks` now registers `getCausticColor` (from the new `CausticsGLSL` export) instead of the older `causticPattern`.
        - `getCausticGLSLChunk` updated to provide the new `getCausticColor` GLSL string (which includes FBM logic) along with `random2D` and `noise2D`.
    - **`SeafloorAsset.ts` Vertex Shader Fixed:**
        - Updated `onBeforeCompile` to set the `vWorldPosition_Seafloor` varying *after* `#include <worldpos_vertex>` using the `worldPosition.xyz` (which is in world space after this include).
    - **`WaterSurfaceAsset.ts` Implemented (Sub-Task 2.4):**
        - Created `src/lib/game/assets/environment/WaterSurfaceAsset.ts`.
        - Uses `MeshPhysicalMaterial` for realistic water properties (transmission, ior).
        - Implements `onBeforeCompile` for animated ripple effects:
            - Adds uniforms for `uTime`, `uRippleSpeed`, `uRippleScale`, `uRippleIntensity`, `uRippleColor` from `WaterSurfaceVisualConfig`.
            - Passes `vWorldPosition_Water` from vertex to fragment shader.
            - Modifies fragment shader to calculate ripple-based normal perturbations (using `dFdx`/`dFdy`) and adds shimmer based on a ripple function and `fresnelPower`.
        - Includes `update(deltaTime, elapsedTime)` to update `uTime` for animation.
        - Includes `dispose()` method.
        - Linter error for `THREE.Shader` type resolved by using `any`.
        - Ensured `fresnelPower` access is safe with a default value.
    - **Integration for Water Surface & Decorative Kelp (Sub-Task 2.6 Partial):**
        - **`ProceduralAssetFactory.ts` Updated:**
            - Added `createWaterSurfaceAsset(): WaterSurfaceAsset` method.
            - Added `createKelpWallAsset(): KelpWallAsset` method.
        - **`EnvironmentManager.ts` Updated:**
            - Constructor now also takes `ShaderManager`.
            - `initializeWaterSurface` now uses `assetFactory.createWaterSurfaceAsset()` if enabled in config.
            - `initializeKelpPool` now uses `assetFactory.createKelpWallAsset()` to populate the kelp pool.
            - `dispose` method made `async`.
        - **`GameEngine.ts` Updated:**
            - `dispose` method made `async` to `await environmentManager.dispose()`.
    - **`ShaderManager.ts` Updated:**
        - Imports `CausticsGLSL`.
        - In `registerCoreChunks`, now registers `causticPattern` (the new one from `caustics.glsl.ts` which includes FBM and `getCausticColor`) using `registerIfNotExists`.
        - Resolved several linter errors:
            - Removed `emissive` and `emissiveIntensity` from `materialParameters` in `clownfishShader` definition (these are not standard `ShaderMaterial` params).
            - Commented out direct assignment to `THREE.ShaderChunk` in `registerChunk` method to prevent read-only errors.
            - Removed direct assignment to `THREE.ShaderChunk` in `registerCoreChunks` fallback.
            - Removed `cached.material = null;` line in `resetProgramCache` to fix `Type 'null' is not assignable` error, as cache is cleared immediately after.
    - **`ClamAsset.ts` Refined:**
        - Imported `ObstacleStandardMaterialVisuals` from `gameConfig.ts`.
        - Created a typed `visualConf` constant within `createMesh` using `ObstacleStandardMaterialVisuals` for clearer access to visual configuration options.
    - **Kelp Visuals & Configuration Enhanced:**
        - **`gameConfig.ts`:**
            - Added optional `stalkRadius` and `frondCount` to `KelpWallObstacleConfig`.
            - Updated `defaultConfig` for `kelpWall` to include default values for these new parameters.
        - **`KelpWallAsset.ts`:**
            - Constructor now accepts an optional `overrideConfig` (Partial<KelpWallObstacleConfig>).
            - `_fetchConfig` method now merges `defaultConfig`, `specificConfig` (from global config), and `overrideConfig` to allow per-instance customization of kelp walls.
            - `createMesh` updated to use `this.config.stalkRadius` and `this.config.frondCount`.
        - **`ProceduralAssetFactory.ts`:**
            - `createKelpWallAsset` method now accepts an optional `config?: Partial<KelpWallObstacleConfig>` and passes it to the `KelpWallAsset` constructor.
        - **`EnvironmentManager.ts`:**
            - `decorativeKelpConfig` type changed to `KelpVisualConfig` (obtained from `configSystem.get('visuals').kelp`).
            - In `initializeKelpPool`, an `override` object is created using `decorativeKelpConfig` and random values for height, then passed to `assetFactory.createKelpWallAsset(override)` to create varied decorative kelp.
    - **God Rays Implemented (Sub-Task 2.5 Partial):**
        - **`godRaysPP.frag.ts` Created:**
            - New shader file added at `src/lib/game/shaders/postprocessing/godRaysPP.frag.ts`.
            - Implements a radial blur effect for god rays with uniforms for `lightPosition`, `godRayColor`, `density`, `weight`, `decay`, `exposure`, and `samples`.
        - **`VisualEffectsService.ts` Updated:**
            - Imports `godRaysFragmentShader` and `LightingManager`.
            - Added `godRaysPass` (ShaderPass) and `godRaysPassName` properties.
            - Added `lightingManager` property.
            - `initializeParticlesAndPostProcessing` now accepts an optional `lightingManager` and stores it. It calls `setupGodRaysPass` if `enableGodRays` is true in `lightingConfig`.
            - `setupGodRaysPass` method added: Creates a `ShaderPass` with `godRaysFragmentShader` and uniforms linked to `lightingConfig` values. Adds this pass to `RenderManager`.
            - `update` method now updates `godRaysPass` uniforms:
                - Enables/disables pass based on `lightingConfig.enableGodRays`.
                - Calculates `lightPosition` in screen space based on the directional light's world position.
                - Updates color and effect parameters from `lightingConfig`.
            - `dispose` method now removes the `godRaysPass` from `RenderManager`.
        - **`GameEngine.ts` Updated:**
            - Passes `this.lightingManager` to `this.visualEffectsService.initializeParticlesAndPostProcessing`.

#### Technical Decisions:
- **Procedural Texturing (Canvas API):** Adopted for seafloor color and bump details to avoid external texture dependencies and allow dynamic generation based on config.
- **`onBeforeCompile` for Caustics:** Leveraged Three.js's `onBeforeCompile` feature to inject custom GLSL into the `MeshStandardMaterial` for dynamic caustic effects. This allows standard material features to be preserved while adding custom rendering logic.
- **Dependency Injection:** `SeafloorAsset` now correctly receives `LightingManager` for caustic data, promoting better separation of concerns.
- **Configurable Caustic Blending:** The caustic effect supports different blend modes (`additive`, `multiply`, `mix`) configured via `gameConfig.ts`.
- **Water Surface Shaders:** `WaterSurfaceAsset` uses `onBeforeCompile` with `MeshPhysicalMaterial` to inject custom GLSL for ripple normals and fresnel-based shimmer, allowing for an animated and configurable water look.
- **Centralized Asset Creation for Environment:** `EnvironmentManager` now uses `ProceduralAssetFactory` to obtain instances of `WaterSurfaceAsset` and decorative `KelpWallAsset`.

#### Status Tracking:
- **Completed:**
    - [X] Sub-Task 2.1: Define/Refine Environment Visual Parameters in `gameConfig.ts`.
    - [X] Sub-Task 2.5 (Partial): Core `LightingManager` updates for caustics.
    - [X] Sub-Task 2.2: Refactor `SeafloorAsset.ts` (procedural texture, caustic interaction, shader fixes).
    - [X] Integration of `SeafloorAsset` into `ProceduralAssetFactory` and `GameEngine`.
    - [X] Sub-Task 2.4: Implement `WaterSurfaceAsset.ts`.
    - [X] Sub-Task 2.6 (Partial): Initial integration of `WaterSurfaceAsset` and decorative `KelpWallAsset` (via factory) into `EnvironmentManager`. Async disposal chain from `GameEngine`.
- **Remaining Work (Step 7):**
    - [ ] Testing: Verify seafloor visuals (procedural texture, caustics), water surface (ripples, shimmer), and stability.
    - [ ] Sub-Task 2.6 (Partial): Ensure `EnvironmentManager.ts` correctly gets `segmentLength`/`segmentWidth` from the `ProceduralAssetFactory`'s `seafloorAsset` getter. (This was marked as next but let's double-check if it was fully addressed by previous SeafloorAsset changes).
    - [ ] Sub-Task 2.3: Implement/Refine `KelpAsset.ts` (or enhance `KelpWallAsset.ts`) - currently `EnvironmentManager` uses the factory method for `KelpWallAsset` which is a good step, but the asset itself might need visual enhancements as per step 7.
    - [ ] Sub-Task 2.5 (Remaining): Any further `LightingManager` refinements specifically for god rays.
    - [ ] Sub-Task 2.7: Final lighting refinements in `gameConfig.ts` and `RenderManager.ts`.

#### Technical Debt:
- **GLSL Module Typing:** (Carried over) Use of `as any` in `LightingManager` and `ShaderManager` for GLSL modules needs future refinement.
- **Canvas Texture Fallbacks:** Basic fallbacks exist if canvas context creation fails, but more robust error handling or logging could be added.
- **`GameEngine.ts` Linter Errors (WebGL context handlers):** While cast to `EventListener` fixed strict type checking, the underlying type difference for `WebGLContextEvent` vs `Event` might still be a point of fragility.
- **`ShaderManager.ts` `emissive` property for `clownfishShader`:** Removed `emissive` and `emissiveIntensity` from `materialParameters` as they are not standard `ShaderMaterial` params. If emissive behavior is desired for the clownfish, it should be handled via its custom shader logic and uniforms (like `uEmissiveIntensity` which is already defined).
- **Global `THREE.ShaderChunk` Assignments:** Removed attempts to assign to global `THREE.ShaderChunk` from `ShaderManager` to prevent errors with modern Three.js read-only properties. Custom chunks are managed internally by `ShaderManager`.

#### Next Steps (within Step 7):
- **PRIMARY: Test the current implementation thoroughly.**
    - Verify game loads without errors.
    - Confirm seafloor procedural texture and caustics are working as expected.
    - Confirm water surface is visible and animating.
    - Test configuration changes for seafloor, caustics, and water surface in `gameConfig.ts`.
- **Address `EnvironmentManager` segment dimensioning (Verification):**
    - Double-check that `EnvironmentManager` correctly uses `this.assetFactory.seafloorAsset` (the getter) to access `segmentLength` and `segmentWidth`.
- Then, proceed with **Sub-Task 2.3: Implement/Refine `KelpAsset.ts`** (or enhance `KelpWallAsset.ts` for detailed visuals beyond basic instantiation).

#### Redundancy Analysis:
- No files are redundant at this stage. The old logic in `SeafloorAsset.ts` has been replaced.

#### Knowledge Transfer:
- `SeafloorAsset.ts` demonstrates how to create procedural textures with the Canvas API and integrate them into Three.js materials.
- It also shows a practical example of using `material.onBeforeCompile` for advanced visual effects like caustics, driven by configurations and services like `LightingManager`.
- The calculation of `segmentWidth` now relies on `worldConfig` and `playerConfig` from `gameConfig.ts`.
- Correct dependency injection is crucial. The error `Cannot read properties of undefined` for `globalCausticTimeUniform` was a direct result of `LightingManager` not being passed down the instantiation chain to `SeafloorAsset`.
- `ProceduralAssetFactory` now plays a key role in ensuring assets like `SeafloorAsset` receive all their necessary service dependencies (like `ShaderManager` and `LightingManager`).
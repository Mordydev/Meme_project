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

#### Technical Decisions:
- **Procedural Texturing (Canvas API):** Adopted for seafloor color and bump details to avoid external texture dependencies and allow dynamic generation based on config.
- **`onBeforeCompile` for Caustics:** Leveraged Three.js's `onBeforeCompile` feature to inject custom GLSL into the `MeshStandardMaterial` for dynamic caustic effects. This allows standard material features to be preserved while adding custom rendering logic.
- **Dependency Injection:** `SeafloorAsset` now correctly receives `LightingManager` for caustic data, promoting better separation of concerns.
- **Configurable Caustic Blending:** The caustic effect supports different blend modes (`additive`, `multiply`, `mix`) configured via `gameConfig.ts`.

#### Status Tracking:
- **Completed:**
    - [X] Sub-Task 2.1: Define/Refine Environment Visual Parameters in `gameConfig.ts`.
    - [X] Sub-Task 2.5 (Partial): Core `LightingManager` updates.
    - [X] Sub-Task 2.2: Refactor `SeafloorAsset.ts` (procedural texture, caustic interaction).
    - [X] Integration of `SeafloorAsset` into `ProceduralAssetFactory` and `GameEngine`.
- **Remaining Work (Step 7):**
    - [ ] Testing: Verify seafloor visuals (procedural texture, caustics) and stability.
    - [ ] Sub-Task 2.6 (Partial): Ensure `EnvironmentManager.ts` correctly gets `segmentLength`/`segmentWidth` from the `ProceduralAssetFactory`'s `seafloorAsset` getter (or a new dedicated method if needed).
    - [ ] Sub-Task 2.3: Implement/Refine `KelpAsset.ts` (or enhance `KelpWallAsset.ts`).
    - [ ] Sub-Task 2.4: Implement `WaterSurfaceAsset.ts`.
    - [ ] Sub-Task 2.5 (Remaining): Any further `LightingManager` refinements specifically for god rays.
    - [ ] Sub-Task 2.6 (Remaining): Full integration of Kelp and Water Surface into `EnvironmentManager.ts` & relevant `GameEngine.ts` async updates.
    - [ ] Sub-Task 2.7: Final lighting refinements in `gameConfig.ts` and `RenderManager.ts`.

#### Technical Debt:
- **GLSL Module Typing:** (Carried over) Use of `as any` in `LightingManager` for GLSL modules and `THREE.ShaderChunk` needs future refinement.
- **Canvas Texture Fallbacks:** Basic fallbacks exist if canvas context creation fails, but more robust error handling or logging could be added.
- **`GameEngine.ts` Linter Errors (WebGL context handlers):** While cast to `EventListener` fixed strict type checking, the underlying type difference for `WebGLContextEvent` vs `Event` might still be a point of fragility if not handled carefully by Three.js internally or if custom properties of `WebGLContextEvent` were needed.

#### Next Steps (within Step 7):
- **PRIMARY: Test the current implementation thoroughly.**
    - Verify game loads without errors.
    - Confirm seafloor procedural texture and caustics are working as expected.
    - Test configuration changes for seafloor and caustics in `gameConfig.ts`.
- **Address `EnvironmentManager` segment dimensioning:**
    - `EnvironmentManager.initialize()` uses `this.assetFactory.getSeafloorAssetGenerator()` which was a placeholder. It should now use `this.assetFactory.seafloorAsset` (the getter that returns the initialized `SeafloorAsset` instance) to access `segmentLength` and `segmentWidth`.
- Then, proceed with **Sub-Task 2.3: Implement/Refine `KelpAsset.ts`** (or enhance `KelpWallAsset.ts`).

#### Redundancy Analysis:
- No files are redundant at this stage. The old logic in `SeafloorAsset.ts` has been replaced.

#### Knowledge Transfer:
- `SeafloorAsset.ts` demonstrates how to create procedural textures with the Canvas API and integrate them into Three.js materials.
- It also shows a practical example of using `material.onBeforeCompile` for advanced visual effects like caustics, driven by configurations and services like `LightingManager`.
- The calculation of `segmentWidth` now relies on `worldConfig` and `playerConfig` from `gameConfig.ts`.
- Correct dependency injection is crucial. The error `Cannot read properties of undefined` for `globalCausticTimeUniform` was a direct result of `LightingManager` not being passed down the instantiation chain to `SeafloorAsset`.
- `ProceduralAssetFactory` now plays a key role in ensuring assets like `SeafloorAsset` receive all their necessary service dependencies (like `ShaderManager` and `LightingManager`).

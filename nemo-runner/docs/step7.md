This step will focus on:

1.  **Seafloor:** Enhancing `SeafloorAsset.ts` to use `MeshStandardMaterial` with procedural textures (Canvas API for sand patterns, reacting to caustics from `LightingManager`).
2.  **Kelp:** Refactoring/Creating `KelpAsset.ts` for more detailed procedural geometry and applying `MeshStandardMaterial` with translucency. Implementing or refining CPU-based swaying animations. (Note: `KelpWallAsset` was already refactored in Step 6; this might refer to more sparse, decorative kelp or further refinement of the wall's visual material aspects).
3.  **Water Surface:** Creating a new `WaterSurfaceAsset.ts` to render a shimmering, refractive water surface effect visible from below, likely using a large plane with a custom (but potentially simple) shader or a highly configured `MeshStandardMaterial` / `MeshPhysicalMaterial`.
4.  **Lighting Refinements:** Further tuning parameters in `LightingManager.ts` and `gameConfig.ts` for caustics, god rays (if a basic version is pursued), and overall atmospheric fog to ensure they complement the newly styled environment assets.

---

### 0. Step Implementation Plan Identifier & Strategic Context

*   **Implementing Step from Blueprint:** `7: Enhance Environment Visuals to Pixar Style (Seafloor, Kelp, Water Surface, Lighting)`
*   **Phase:** `Phase 1 (Completion): Playable Core Game Prototype (in Next.js)`
*   **Blueprint Version:** `v1.0` (from `docs/phase1steps.md`)
*   **Date Prepared:** May 12, 2025
*   **A. Primary Goal & Anticipated Deliverables of THIS STEP:**
    *   This step aims to create a visually rich and immersive underwater environment by enhancing the seafloor with procedural sandy textures and caustic interaction, developing detailed and animated kelp, and implementing a shimmering water surface effect. It also involves refining existing lighting and atmospheric effects (`LightingManager`, fog, caustics, god rays foundation) to create a cohesive Pixar-style underwater world.
*   **B. Key Focus Areas & NFRs for THIS STEP:**
    *   **Key Focus Areas:** Procedural Generation, Material Artistry (Standard Materials), Texture Generation (Canvas API), Lighting & Atmospheric Effects, Performance Optimization.
    *   **Strategic Notes, Proactive Considerations & Key NFRs To Emphasize:**
        *   **Immersive Atmosphere (NFR):** The combined effect of seafloor, kelp, water surface, lighting, caustics, fog, and god rays (even if basic) must create a believable and enchanting underwater world reminiscent of the Pixar style.
        *   **Performance (NFR):** Environmental elements cover large areas of the screen. Their geometry, materials, and any animations must be highly performant. This means efficient procedural textures, optimized kelp swaying, and a lightweight water surface effect.
        *   **Visual Harmony (NFR):** All environmental components must visually cohere with each other and with the already styled player character and obstacles. Color palettes and material properties need careful coordination.
        *   **Configurability:** All key visual parameters for seafloor, kelp, water surface, and lighting effects must be tunable via `gameConfig.ts`.

### 1. Prerequisites, Environment Setup & Configuration for THIS STEP

*   **A. Verification of Critical Dependencies:**
    1.  **Upgraded Obstacles (Step 6):**
        *   **Verification:** All 8 obstacle types use `MeshStandardMaterial` or `MeshPhysicalMaterial` and have their visuals and CPU animations enhanced. (Status: Verified from `docs/step6.md` completion).
    2.  **Functional `LightingManager.ts` (from Step 3):**
        *   **Verification:** `LightingManager` is in place, managing basic scene lights, fog, and has the capability to provide caustic data/effects (even if seafloor isn't fully using it yet). (Status: Verified from Step 3 completion and recent codebase).
    3.  **Functional `VisualEffectsService.ts` (from Step 4):**
        *   **Verification:** Service manages particle systems (bubbles, dust) and basic screen effects. Ambient particles contribute to the underwater feel. (Status: Verified from Step 4 completion).
    4.  **Enhanced `ShaderManager.ts` (from Step 2):**
        *   **Verification:** While we're now prioritizing standard materials for assets, `ShaderManager` is still crucial for any specific custom shaders (like the *original* caustic approach or a new water surface shader) and for managing global uniforms like `uTime`. (Status: Verified from Step 2 completion).
    5.  **`gameConfig.ts` with sections for Lighting, Visuals:**
        *   **Verification:** `gameConfig.ts` is ready for new parameters for kelp, water surface, and further refinement of seafloor and lighting. (Status: Verified).
*   **B. Required Software, Libraries, Tools & Versions:**
    *   Core Stack: Next.js, React, Three.js, TypeScript.
    *   GLSL (if custom shaders are used for water surface or advanced caustics, though the trend is now towards standard materials).
*   **C. Environment Configuration (Local & Target):**
    *   No new environment variables.
*   **D. Project Structure & Version Control Setup for THIS STEP:**
    *   **Current Git Branch:** Ensure you are on `feature/phase1-completion`.
    *   Create a new task branch:
        ```bash
        git checkout feature/phase1-completion
        git pull
        git checkout -b task/P1C-step7-environment-visuals
        ```
    *   **New/Modified Files:**
        *   `src/lib/game/assets/environment/SeafloorAsset.ts` (Significant Refactor for materials/textures)
        *   `src/lib/game/assets/environment/KelpAsset.ts` (New or refactor from KelpWall logic if creating sparse kelp)
        *   `src/lib/game/assets/environment/WaterSurfaceAsset.ts` (New)
        *   `src/lib/game/shaders/environment/` (Potentially new shaders for water surface, or refined seafloor if custom shader approach is revisited for caustics. Given the pivot, likely fewer custom shaders here.)
        *   `src/lib/game/services/LightingManager.ts` (Refinements for caustic application, god rays)
        *   `src/lib/game/services/RenderManager.ts` (If god rays are a post-process, integrate pass here)
        *   `src/lib/game/config/gameConfig.ts` (New visual parameters for kelp, water surface; tuning for existing lighting/fog/caustics).
        *   `src/lib/game/managers/EnvironmentManager.ts` (To manage new kelp and water surface assets).

### 2. Detailed Implementation Guide & Production-Ready Code

---

#### Sub-Task 2.1: Define/Refine Environment Visual Parameters in `gameConfig.ts`

*   **A. Purpose & Rationale:**
    *   To add and refine configuration options for seafloor, kelp, water surface, and detailed lighting effects (caustics, god rays) for precise art direction.
*   **C. File Creation / Modification:**

    *   **Full File Path:** `src/lib/game/config/gameConfig.ts`
    *   **File Content (Additions/Modifications to `VisualSettings` and `defaultConfig.visuals`):**
        ```typescript
        // src/lib/game/config/gameConfig.ts
        // ... (existing interfaces)

        export interface SeafloorVisualConfig {
          baseColor: number | string;
          sandPatternColor1: number | string;
          sandPatternColor2: number | string;
          textureScale: number; // For procedural sand pattern
          bumpScale?: number;
          roughness?: number;
          metalness?: number;
        }

        export interface KelpVisualConfig {
          stalkColor: number | string;
          frondColor: number | string;
          baseHeightMin: number;
          baseHeightMax: number;
          stalkRadius: number;
          frondCount: number;
          swaySpeed: number;
          swayAmplitude: number;
          transmission?: number; // For translucency
          opacity?: number;
          roughness?: number;
        }

        export interface WaterSurfaceVisualConfig {
          baseColor: number | string; // Likely a sky blue or slightly darker
          rippleColor: number | string; // For highlights on ripples
          rippleSpeed: number;
          rippleScale: number;
          rippleIntensity: number;
          opacity: number; // Controls overall visibility from below
          fresnelPower?: number; // For edge highlighting/reflectivity
          specularColor?: number | string;
          shininess?: number;
        }
        
        export interface LightingConfig { // Existing, ensure caustics and godrays are detailed
            ambientLight: { color: number; intensity: number; };
            directionalLight: { color: number; intensity: number; position: { x: number; y: number; z: number }; castShadow?: boolean; shadowMapSize?: number; };
            fogColor: number | string;
            fogDensity?: number; // If using FogExp2
            fogNear?: number;    // If using Fog
            fogFar?: number;     // If using Fog

            enableCaustics: boolean;
            causticColor: number | string;
            causticIntensity: number;
            causticScale: number;
            causticSpeed: number;
            causticBlendMode: 'additive' | 'multiply' | 'mix'; // How caustics affect base seafloor
            causticReceiverObjects?: string[]; // e.g., ['seafloor', 'rocks'] if specific

            enableGodRays: boolean;
            godRayColor?: number | string;
            godRayIntensity?: number;
            godRayDensity?: number;     // For screen-space effect
            godRayWeight?: number;
            godRayDecay?: number;
            godRayExposure?: number;
            godRaySamples?: number;
        }


        export interface VisualSettings {
          // ... (existing player, general VFX)
          seafloor: SeafloorVisualConfig;
          kelp: KelpVisualConfig;
          waterSurface: WaterSurfaceVisualConfig;
          // Lighting config is now its own top-level category for clarity
        }
        
        // GameConfig now includes LightingConfig directly
        export interface GameConfig {
          // ... (player, collisions, world, camera, collectibles, powerUps, difficulty, obstacles)
          visuals: VisualSettings; // General visual settings like particles, screen effects
          lighting: LightingConfig;  // Dedicated lighting config
        }


        const defaultConfig: GameConfig = {
          // ... (existing default values for player, world, camera, etc.)
          visuals: { // General VFX and specific non-lighting environmentals
            // ... (skyColor, testCubeColor, particles, screen effects as defined in Step 4)
            seafloor: {
              baseColor: 0xAD8E6E, // Sandy brown
              sandPatternColor1: 0xC4A484, // Lighter sand
              sandPatternColor2: 0x9A7B5A, // Darker sand spots
              textureScale: 15.0,
              bumpScale: 0.02,
              roughness: 0.85,
              metalness: 0.0,
            },
            kelp: {
              stalkColor: 0x3A5F0B, // Darker green for stalk
              frondColor: 0x556B2F, // Olive Drab for fronds
              baseHeightMin: 1.5,
              baseHeightMax: 3.0,
              stalkRadius: 0.03,
              frondCount: 5,
              swaySpeed: 0.3,
              swayAmplitude: 0.1,
              transmission: 0.4, // Kelp is somewhat translucent
              opacity: 0.9,
              roughness: 0.7,
            },
            waterSurface: {
              baseColor: 0x87CEEB, // Sky blue, but will be viewed from below
              rippleColor: 0xFFFFFF, // White highlights for ripples
              rippleSpeed: 0.2,
              rippleScale: 10.0,
              rippleIntensity: 0.01, // Subtle ripples
              opacity: 0.3, // Semi-transparent from below
              fresnelPower: 2.0,
              specularColor: 0x77ccff,
              shininess: 80,
            },
          },
          lighting: { // Moved from visuals to its own top-level category
            ambientLight: { color: 0x406080, intensity: 0.5 }, // Softer ambient
            directionalLight: { 
              color: 0xE0F0FF, intensity: 0.7, // Softer sun
              position: { x: 1, y: 10, z: 1 }, 
              castShadow: false 
            },
            fogColor: 0x102a43, // Deeper blue fog
            fogDensity: 0.03,   // Adjusted fog density
            // fogNear: 5, // If using THREE.Fog
            // fogFar: 40, // If using THREE.Fog
            enableCaustics: true,
            causticColor: 0xA0D0FF, // Lighter blue for caustics
            causticIntensity: 0.15, // More subtle
            causticScale: 6.0,
            causticSpeed: 0.08,
            causticBlendMode: 'additive',
            enableGodRays: true, // Let's try enabling a basic version
            godRayColor: 0xA0D0FF,
            godRayIntensity: 0.08,
            godRayDensity: 0.96,
            godRayWeight: 0.05, // Very subtle weight
            godRayDecay: 0.96,
            godRayExposure: 0.1,
            godRaySamples: 20, // Fewer samples for P1
          },
          // ... (rest of default config obstacles, powerups, difficulty etc.)
        };
        ```
    *   **Explanation:**
        *   Created specific config interfaces: `SeafloorVisualConfig`, `KelpVisualConfig`, `WaterSurfaceVisualConfig`.
        *   Moved `LightingConfig` to be a top-level category in `GameConfig` for better organization, distinct from general `VisualSettings` (which would now hold particles, screen effects, and specific environment asset visuals like seafloor, kelp, water surface).
        *   Populated `defaultConfig` with initial values for these new environment sections.
        *   Refined existing `LightingConfig` parameters (e.g., added `causticBlendMode`, `godRaySamples`).

---

Okay, let's proceed with the remainder of **Step 7: Enhance Environment Visuals to Pixar Style (Seafloor, Kelp, Water Surface, Lighting)**.

---

#### Sub-Task 2.2: Refactor `SeafloorAsset.ts` for Enhanced Visuals (Procedural Texture, Caustic Interaction)

*   **A. Purpose & Rationale:**
    *   To upgrade the seafloor's appearance using `MeshStandardMaterial` with a procedurally generated sand texture (via Canvas API) for color variation and bump/normal detail. The material should also be prepared to receive and display caustic effects managed by `LightingManager`.
*   **C. File Creation / Modification:**

    *   **Full File Path:** `src/lib/game/assets/environment/SeafloorAsset.ts`
    *   **File Content (Significant Refactor):**
        ```typescript
        // src/lib/game/assets/environment/SeafloorAsset.ts
        import * as THREE from 'three';
        import { configSystem } from '../../core/ConfigurationSystem';
        import { ShaderManager } from '../../services/ShaderManager'; // Keep for fallback or if a custom shader is eventually needed
        import { LightingManager } from '../../services/LightingManager'; // For caustic uniforms
        import { SeafloorVisualConfig } from '../../config/gameConfig';

        export class SeafloorAsset {
          private shaderManager: ShaderManager; // May not be directly used for material if all standard
          private lightingManager: LightingManager;
          public segmentWidth: number;
          public segmentLength: number;
          private config: Readonly<SeafloorVisualConfig>;
          
          private material!: THREE.MeshStandardMaterial;
          private sandTexture!: THREE.CanvasTexture;
          private sandBumpMap!: THREE.CanvasTexture;

          constructor(shaderManager: ShaderManager, lightingManager: LightingManager) {
            this.shaderManager = shaderManager; // Store if needed for other purposes
            this.lightingManager = lightingManager;
            this.config = configSystem.get('visuals').seafloor;
            this.segmentWidth = configSystem.getWorldXBoundary() * 2 + configSystem.getPlayerLaneWidth() * 3;
            this.segmentLength = 20; // Default, could be from config
            this.createMaterial();
          }

          private createSandTexture(): THREE.CanvasTexture {
            const canvas = document.createElement('canvas');
            const size = 256; // Texture size
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d')!;

            const baseColor = new THREE.Color(this.config.baseColor);
            const color1 = new THREE.Color(this.config.sandPatternColor1);
            const color2 = new THREE.Color(this.config.sandPatternColor2);

            // Fill with base color slightly varied
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const randomFactor = Math.random() * 0.1 - 0.05; // -0.05 to 0.05
                    const variedBase = baseColor.clone().offsetHSL(0, 0, randomFactor);
                    ctx.fillStyle = variedBase.getStyle();
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            
            // Add splotches of pattern colors
            const numSplotches = 80;
            for (let i = 0; i < numSplotches; i++) {
                const splotchColor = Math.random() < 0.5 ? color1 : color2;
                ctx.fillStyle = splotchColor.clone().offsetHSL(0,0, Math.random() * 0.2 - 0.1).getStyle(); // Vary lightness
                const x = Math.random() * size;
                const y = Math.random() * size;
                const splotchRadius = Math.random() * (size / 15) + (size / 30);
                ctx.beginPath();
                ctx.arc(x, y, splotchRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(this.config.textureScale / size, this.config.textureScale / size); // Scale UVs for world size
            texture.needsUpdate = true;
            return texture;
          }

          private createSandBumpMap(): THREE.CanvasTexture {
            const canvas = document.createElement('canvas');
            const size = 256;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = 'rgb(128, 128, 128)'; // Mid-grey for no bump
            ctx.fillRect(0, 0, size, size);

            // Add noise for bump details
            for (let i = 0; i < 2000; i++) { // More iterations for denser noise
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 3 + 1; // Small bumps
                const intensity = Math.floor(Math.random() * 50) + 100; // Vary greyscale from 100-150
                ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.copy(this.sandTexture.repeat); // Match diffuse texture repeat
            texture.needsUpdate = true;
            return texture;
          }
          
          private createMaterial(): void {
            this.sandTexture = this.createSandTexture();
            this.sandBumpMap = this.createSandBumpMap();

            this.material = new THREE.MeshStandardMaterial({
              map: this.sandTexture,
              bumpMap: this.sandBumpMap,
              bumpScale: this.config.bumpScale !== undefined ? this.config.bumpScale : 0.015,
              color: 0xffffff, // Base color comes from map, tint if needed
              roughness: this.config.roughness !== undefined ? this.config.roughness : 0.8,
              metalness: this.config.metalness !== undefined ? this.config.metalness : 0.05,
              side: THREE.FrontSide, // Seafloor only visible from top
            });

            // Modify material to include caustic receiving logic (if LightingManager uses custom shaders for this)
            // This approach relies on the LightingManager providing caustic data via global uniforms
            // that a custom version of MeshStandardMaterial's shader could pick up.
            // For simplicity with P1's revised "standard materials" approach, we'll assume caustics
            // are handled by a global post-processing effect or a light's `lightMap` if projected.
            // If LightingManager's `getCausticReceivingMaterial` was to generate a full custom shader,
            // it would be called here.
            // For now, let's assume the standard material will just show caustics if they are projected via lights.
            // If caustics are a screen-space effect or part of LightingManager's general update, no special material needed here.

            // However, if caustics are to be *mixed into this specific material*, we need onBeforeCompile:
            const lightingConfig = configSystem.get('lighting');
            if (lightingConfig.enableCaustics) {
                this.material.onBeforeCompile = (shader) => {
                    // Add caustic uniforms
                    shader.uniforms.uCausticColor = { value: new THREE.Color(lightingConfig.caustics.causticColor) };
                    shader.uniforms.uCausticIntensity = { value: lightingConfig.caustics.causticIntensity };
                    shader.uniforms.uCausticScale = { value: lightingConfig.caustics.causticScale };
                    shader.uniforms.uCausticSpeed = { value: lightingConfig.caustics.causticSpeed };
                    shader.uniforms.uTime = this.lightingManager.globalCausticTimeUniform; // Get global uTime from LightingManager

                    // Add varying for worldPosition if not already present
                    shader.vertexShader = 'varying vec3 vWorldPosition_Seafloor;\n' + shader.vertexShader;
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <worldpos_vertex>',
                        `
                        #include <worldpos_vertex>
                        vWorldPosition_Seafloor = worldPosition.xyz;
                        `
                    );
                    
                    shader.fragmentShader = 'varying vec3 vWorldPosition_Seafloor;\n' +
                                            this.lightingManager.getCausticGLSLChunk() + // Get caustic GLSL code
                                            shader.fragmentShader;
                    
                    shader.fragmentShader = shader.fragmentShader.replace(
                        /vec4 diffuseColor = vec4\( diffuse, opacity \);/,
                        `
                        vec3 caustic = getCausticColor(vWorldPosition_Seafloor, uTime, uCausticScale, uCausticIntensity, uCausticColor);
                        vec3 mixedDiffuse = diffuse + caustic; // Additive blend for caustics
                        // Or use a mix: vec3 mixedDiffuse = mix(diffuse, uCausticColor, caustic.r * uCausticIntensity);
                        vec4 diffuseColor = vec4(mixedDiffuse, opacity);
                        `
                    );
                    // console.log("Seafloor onBeforeCompile modified shader.");
                };
            }
          }

          public createMesh(): THREE.Mesh {
            const geometry = new THREE.PlaneGeometry(this.segmentWidth, this.segmentLength, 20, 20); 
            geometry.rotateX(-Math.PI / 2);
            // Ensure UVs are generated for texture mapping
            geometry.attributes.uv = new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2);
            // Basic planar UV mapping
            const positions = geometry.attributes.position;
            const uvs = geometry.attributes.uv;
            for (let i = 0; i < positions.count; i++) {
                uvs.setXY(i, (positions.getX(i) / this.segmentWidth) + 0.5, (positions.getZ(i) / this.segmentLength) + 0.5);
            }
            uvs.needsUpdate = true;

            const mesh = new THREE.Mesh(geometry, this.material);
            mesh.name = "SeafloorSegment_Styled";
            mesh.position.y = -1.0; // Ensure seafloor is at y = -1 (or from config)
            mesh.receiveShadow = configSystem.get('lighting').directionalLight.castShadow || false;
            return mesh;
          }
          
          public dispose(): void {
            this.sandTexture?.dispose();
            this.sandBumpMap?.dispose();
            this.material?.dispose();
          }
        }
        ```
    *   **Explanation:**
        *   `SeafloorAsset` now has `createSandTexture` and `createSandBumpMap` using Canvas API for procedural sand patterns.
        *   `createMaterial` initializes a `MeshStandardMaterial` using these textures and config parameters.
        *   **Crucially**, it uses `material.onBeforeCompile` to inject GLSL code for caustics directly into the standard material's shader. This is a powerful Three.js feature allowing modification of built-in materials.
            *   It adds necessary uniforms for caustics.
            *   It ensures `vWorldPosition_Seafloor` is available in the fragment shader.
            *   It injects the `getCausticColor` GLSL function (assuming `LightingManager` provides this chunk via `getCausticGLSLChunk()`) and modifies the diffuse color calculation to add the caustic effect.
        *   `createMesh` sets up UVs for the plane geometry.
    *   **Update `LightingManager.ts` to provide `globalCausticTimeUniform` and `getCausticGLSLChunk()`:**
        ```typescript
        // src/lib/game/services/LightingManager.ts
        import CausticsGLSL from '../shaders/common/caustics.glsl'; // Assuming you have this from Step 3

        export class LightingManager {
          // ...
          public globalCausticTimeUniform: THREE.IUniform<number>; // Expose uTime for caustics

          constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
            // ...
            this.globalCausticTimeUniform = shaderManager.globalUniforms.uTime; // Link to global uTime
            // ...
            // Register caustic chunks in ShaderManager if not already done there
            shaderManager.registerChunk("noise2D", NoiseGLSL.noise2D); // Ensure dependencies are registered
            shaderManager.registerChunk("causticPattern", CausticsGLSL.causticPattern);
          }

          public getCausticGLSLChunk(): string {
            // Returns the GLSL code needed for caustics, including its dependencies
            // This assumes ShaderManager's preprocessShader would handle nested includes
            // For onBeforeCompile, we need the full code.
            return `
              ${NoiseGLSL.random2D}
              ${NoiseGLSL.noise2D}
              ${CausticsGLSL.causticPattern}
            `;
          }
          
          public update(deltaTime: number, elapsedTime: number): void {
            // elapsedTime is updating global uTime in ShaderManager, which is linked
            // No specific update needed here for caustic time if linked to global uTime
          }
          // ...
        }
        ```

---

Okay, let's continue with the remaining sub-tasks for **Step 7: Enhance Environment Visuals to Pixar Style (Seafloor, Kelp, Water Surface, Lighting)**.

We've covered the `SeafloorAsset` with procedural textures and caustic interaction via `onBeforeCompile`. Now for Kelp and the Water Surface.

---

#### Sub-Task 2.3: Implement/Refine `KelpAsset.ts` (or enhance `KelpWallAsset.ts`) for Detailed Visuals and Animation

*   **A. Purpose & Rationale:**
    *   To create visually appealing kelp/seaweed elements that add verticality and organic movement to the environment. This will involve refining procedural geometry for stalks and fronds, applying `MeshStandardMaterial` with translucency, and implementing CPU-based swaying animations.
    *   The existing `KelpWallAsset.ts` (from Step 6) already has a good foundation. We will enhance its material properties, ensure its animation is robust, and consider how it (or a new `KelpAsset.ts` for sparse/decorative kelp) fits into the `EnvironmentManager`. For this step, we'll focus on enhancing `KelpWallAsset.ts` directly, assuming it can serve both as an obstacle and as part of the general environment dressing if spawned appropriately by `EnvironmentManager`.
*   **C. File Creation / Modification:**

    *   **Full File Path:** `src/lib/game/assets/obstacles/KelpWallAsset.ts` (Enhancing existing)
    *   **File Content (Refinements to material, geometry details, and animation):**
        ```typescript
        // src/lib/game/assets/obstacles/KelpWallAsset.ts
        import * as THREE from 'three';
        import { configSystem } from '../../core/ConfigurationSystem';
        import { KelpWallObstacleConfig, ObstacleStandardMaterialVisuals } from '../../config/gameConfig'; // Ensure KelpWallObstacleConfig has visuals

        export class KelpWallAsset {
          public config: Readonly<KelpWallObstacleConfig>;
          public mesh!: THREE.Group;
          private collisionMesh!: THREE.Mesh;
          private kelpStrandsAndFronds: { mesh: THREE.Mesh, originalPositions: THREE.BufferAttribute, type: 'stalk' | 'frond' }[] = [];
          private animationTime: number = 0;

          constructor() {
            this.config = this._fetchConfig();
            this.createMesh();
          }

          private _fetchConfig(): Readonly<KelpWallObstacleConfig> {
            // ... (existing _fetchConfig is good)
            const defaultConfig: KelpWallObstacleConfig = { /* ... as before ... */
                visuals: {
                    mainColor: 0x3A5F0B, 
                    detailColor: 0x20603D, 
                    roughness: 0.8,
                    metalness: 0.0,
                    opacity: 0.85,
                    transmission: 0.5, // Enhanced for more translucency
                    animationSpeed: 0.6, // More specific default
                    animationAmplitude: 0.08,
                }
            };
             try {
                const specificConfig = configSystem.getObstaclesConfig().kelpWall;
                return { ...defaultConfig, ...specificConfig, visuals: { ...defaultConfig.visuals, ...specificConfig?.visuals } };
            } catch (error) {
                console.warn("KelpWallAsset: Could not get config, using defaults", error);
                return defaultConfig;
            }
          }

          private createMesh(): void {
            this.mesh = new THREE.Group();
            this.mesh.name = "KelpWallObstacle_StdMat_Enhanced";
            this.kelpStrandsAndFronds = []; // Clear for re-creation
            const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;

            const strandHeight = this.config.baseScaleY;
            const numStrands = THREE.MathUtils.randInt(this.config.strandCountMin, this.config.strandCountMax);
            const totalWallWidth = (configSystem.get('player').laneWidth * this.config.segmentWidthCoverage);
            const spacing = numStrands > 1 ? totalWallWidth / (numStrands -1) : 0;

            const kelpMaterial = new THREE.MeshPhysicalMaterial({ // Changed to MeshPhysicalMaterial for better translucency
                color: new THREE.Color(visualConf.mainColor),
                roughness: visualConf.roughness,
                metalness: visualConf.metalness,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: visualConf.opacity,
                transmission: visualConf.transmission, // For light passing through
                // clearcoat: 0.1, // Optional: for a slightly wet look
                // clearcoatRoughness: 0.5,
            });

            for (let i = 0; i < numStrands; i++) {
                const strandGroup = new THREE.Group(); 

                const stalkRadiusTop = (this.config.stalkRadius || 0.03) * THREE.MathUtils.randFloat(0.8, 1.2);
                const stalkRadiusBottom = (this.config.stalkRadius || 0.05) * THREE.MathUtils.randFloat(0.9, 1.1);
                const currentStalkHeight = strandHeight * THREE.MathUtils.randFloat(0.9, 1.1);
                const stalkSegmentsH = 10; // More segments for smoother sway
                const stalkSegmentsR = 6;
                const stalkGeom = new THREE.CylinderGeometry(stalkRadiusTop, stalkRadiusBottom, currentStalkHeight, stalkSegmentsR, stalkSegmentsH);
                stalkGeom.translate(0, currentStalkHeight / 2, 0);
                stalkGeom.userData.originalPositions = stalkGeom.attributes.position.clone();
                
                const stalk = new THREE.Mesh(stalkGeom, kelpMaterial);
                stalk.userData.baseY = 0; // Stalk base is at group origin
                strandGroup.add(stalk);
                this.kelpStrandsAndFronds.push({ mesh: stalk, originalPositions: stalkGeom.userData.originalPositions, type: 'stalk' });

                const numFronds = this.config.frondCount || 5;
                const frondMaterial = kelpMaterial.clone();
                if (visualConf.detailColor) {
                    frondMaterial.color = new THREE.Color(visualConf.detailColor);
                }

                for (let j = 0; j < numFronds; j++) {
                    const frondLength = currentStalkHeight * THREE.MathUtils.randFloat(0.3, 0.6);
                    const frondWidth = frondLength * THREE.MathUtils.randFloat(0.2, 0.35);
                    
                    const frondShape = new THREE.Shape();
                    frondShape.moveTo(0,0);
                    frondShape.quadraticCurveTo(frondWidth * 0.2, frondLength * 0.3, frondWidth * 0.1, frondLength * 0.7); // Gentle curve
                    frondShape.quadraticCurveTo(0, frondLength, -frondWidth * 0.1, frondLength * 0.7);
                    frondShape.quadraticCurveTo(-frondWidth * 0.2, frondLength * 0.3, 0,0); // Back to base
                    
                    const frondGeom = new THREE.ShapeGeometry(frondShape, 3); // Few segments for flat frond
                    frondGeom.translate(0, 0, 0); // Pivot at base of frond
                    frondGeom.rotateX(Math.PI/2); // Make it flat initially if extruded
                    frondGeom.userData.originalPositions = frondGeom.attributes.position.clone();

                    const frond = new THREE.Mesh(frondGeom, frondMaterial);
                    const attachHeightRatio = (j / (numFronds -1 || 1)) * 0.7 + 0.2; // Distribute along 20% to 90% of stalk
                    const attachHeight = attachHeightRatio * currentStalkHeight;
                    frond.userData.baseY = attachHeight; // Store base Y relative to stalk base

                    frond.position.set(
                        (Math.random() < 0.5 ? 1 : -1) * (stalkRadiusBottom * 0.5), // Attach to side of stalk
                        attachHeight, 
                        0
                    );
                    frond.rotation.y = THREE.MathUtils.randFloatSpread(Math.PI * 0.5); // Random orientation
                    frond.rotation.x = THREE.MathUtils.randFloatSpread(Math.PI / 4); // Slight up/down tilt
                    stalk.add(frond);
                    this.kelpStrandsAndFronds.push({ mesh: frond, originalPositions: frondGeom.userData.originalPositions, type: 'frond' });
                }

                strandGroup.position.x = (numStrands > 1) ? (i * spacing) - (totalWallWidth / 2) + (spacing / 2) : 0;
                strandGroup.position.z = (Math.random() - 0.5) * 0.3;
                strandGroup.rotation.y = (Math.random() - 0.5) * 0.2; // Slight rotation of whole strand cluster
                this.mesh.add(strandGroup);
            }
            
            // Updated collision mesh
            const collisionHeight = strandHeight;
            const collisionWidth = totalWallWidth + (this.config.stalkRadius || 0.05) * 2; 
            const collisionDepth = Math.max(0.3, (this.config.stalkRadius || 0.05) * 2); 
            const collisionGeom = new THREE.BoxGeometry(collisionWidth, collisionHeight, collisionDepth);
            this.collisionMesh = new THREE.Mesh(collisionGeom, new THREE.MeshBasicMaterial({ visible: false, wireframe: true }));
            this.collisionMesh.name = "KelpWallCollisionBox";
            this.collisionMesh.position.y = strandHeight / 2; 
            this.mesh.add(this.collisionMesh);

            this.mesh.userData = { type: 'obstacle', name: 'kelpWall', assetInstance: this, isDangerous: true };
          }
          
          public updateAnimation(deltaTime: number): void {
            this.animationTime += deltaTime;
            const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;
            const swaySpeed = visualConf.animationSpeed || this.config.swaySpeed;
            const swayAmplitude = visualConf.animationAmplitude || this.config.swayAmplitude;

            this.kelpStrandsAndFronds.forEach((item, partIndex) => {
                const kelpPart = item.mesh;
                const geom = kelpPart.geometry;
                const originalPosAttr = item.originalPositions;
                const currentPosAttr = geom.attributes.position as THREE.BufferAttribute;

                if (!originalPosAttr) return;

                const worldPos = new THREE.Vector3();
                // Get world position of the *parent group* of the strand if it's part of a strandGroup,
                // or the kelpPart itself if it's a direct child of this.mesh (like a stalk).
                const parentObject = kelpPart.parent instanceof THREE.Group ? kelpPart.parent : kelpPart;
                parentObject.getWorldPosition(worldPos);

                const partHeight = (item.type === 'stalk') ? 
                                   (geom as THREE.CylinderGeometry).parameters.height :
                                   (geom as THREE.ShapeGeometry).parameters.shapes[0].getBoundingBox().getSize(new THREE.Vector3()).y;


                for (let i = 0; i < originalPosAttr.count; i++) {
                    const ox = originalPosAttr.getX(i);
                    const oy = originalPosAttr.getY(i); // This is local Y, relative to part's pivot
                    const oz = originalPosAttr.getZ(i);
                    
                    // Normalized height along this specific part (stalk or frond)
                    // Pivot is at base for stalk, and fronds are translated relative to their pivot
                    const normalizedYAlongPart = Math.abs(oy / (partHeight || 0.1)); // Avoid div by zero
                    let swayFactor = Math.pow(normalizedYAlongPart, 1.5); // More sway at the top

                    const phaseOffset = (worldPos.x + worldPos.z) * 0.3 + partIndex * 0.3;
                    
                    const waveX = Math.sin(this.animationTime * swaySpeed + oy * 0.5 + phaseOffset) * swayAmplitude * swayFactor;
                    // Add a secondary Z sway for more complexity
                    const waveZ = Math.cos(this.animationTime * swaySpeed * 0.7 + oy * 0.4 + phaseOffset * 1.3) * swayAmplitude * swayFactor * 0.5;

                    currentPosAttr.setXYZ(i, ox + waveX, oy, oz + waveZ);
                }
                currentPosAttr.needsUpdate = true;
                // geom.computeVertexNormals(); // Can be expensive per frame, only if lighting is very sensitive
            });
            if (this.kelpStrandsAndFronds.length > 0) { // Recompute normals once if any part updated
                 this.kelpStrandsAndFronds[0].mesh.geometry.computeVertexNormals(); // Assuming all use similar deformation
            }
          }

          // ... (getMesh, getCollisionObject, isDangerous, reset, dispose methods remain similar but ensure proper disposal of new materials/geometries)
          public dispose(): void {
            this.mesh.traverse(child => {
              if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                if (child.material instanceof THREE.Material) {
                    const mat = child.material as THREE.MeshPhysicalMaterial;
                    mat.transmissionMap?.dispose(); // If you add specific maps
                    mat.dispose();
                }
              }
            });
            this.mesh.clear();
            this.kelpStrandsAndFronds = [];
          }
          // ... other methods
        }
        ```
    *   **Explanation:**
        *   Switched to `MeshPhysicalMaterial` for kelp to better utilize `transmission` for a more convincing translucent look.
        *   Geometry for stalks (`CylinderGeometry`) and fronds (`ShapeGeometry`) is made more detailed. Fronds are now attached along the stalk.
        *   `updateAnimation` uses CPU-based vertex manipulation for both stalks and fronds, applying a sine wave displacement. `originalPositions` are stored on `geometry.userData` for each part.
        *   Sway is influenced by vertex height along the part and world position for variation.

---

Okay, let's continue with the remaining sub-tasks for **Step 7: Enhance Environment Visuals to Pixar Style (Seafloor, Kelp, Water Surface, Lighting)**.

We've covered `SeafloorAsset` and enhancements to `KelpWallAsset`. Now for the Water Surface and final lighting refinements.

---

#### Sub-Task 2.4: Implement `WaterSurfaceAsset.ts` for Shimmering Surface Effect

*   **A. Purpose & Rationale:**
    *   To create a visual representation of the water surface as seen from below, including shimmering highlights, subtle ripples, and a sense of looking up towards the light. This will primarily use a large `PlaneGeometry` with a `MeshStandardMaterial` or `MeshPhysicalMaterial` configured for these effects, or a simple custom shader if necessary.
*   **C. File Creation / Modification:**

    *   **Full File Path (New File):** `src/lib/game/assets/environment/WaterSurfaceAsset.ts`
    *   **File Content (Production-Ready Code):**
        ```typescript
        // src/lib/game/assets/environment/WaterSurfaceAsset.ts
        import * as THREE from 'three';
        import { configSystem } from '../../core/ConfigurationSystem';
        import { ShaderManager } from '../../services/ShaderManager'; // For custom shader if chosen
        import { WaterSurfaceVisualConfig } from '../../config/gameConfig';

        export class WaterSurfaceAsset {
          public mesh!: THREE.Mesh;
          private config: Readonly<WaterSurfaceVisualConfig>;
          private material!: THREE.Material; // Can be Standard, Physical, or ShaderMaterial

          constructor(shaderManager: ShaderManager) { // shaderManager might be needed for custom shader
            this.config = configSystem.get('visuals').waterSurface;
            this.createMesh(shaderManager);
          }

          private createMesh(shaderManager: ShaderManager): void {
            // Large plane placed above the player's typical view frustum ceiling
            // Size should be large enough to cover the visible area from below.
            // Let's make it very large and rely on fog/camera far plane to hide edges.
            const surfaceSize = 200; // Large enough to almost always be "sky"
            const geometry = new THREE.PlaneGeometry(surfaceSize, surfaceSize, 32, 32); // Add segments for potential displacement

            // Option 1: MeshStandardMaterial or MeshPhysicalMaterial for reflections/refractions
            // This is preferred if we avoid custom shaders extensively
            this.material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(this.config.baseColor || 0x87CEFA), // Light sky blue
                metalness: 0.1, // Water is not very metallic
                roughness: 0.05, // Smooth for sharp reflections/refractions
                transmission: 0.9, // High transmission to see through to "sky" or light source
                transparent: true,
                opacity: this.config.opacity !== undefined ? this.config.opacity : 0.7, // Semi-transparent from below
                side: THREE.BackSide, // Rendered from below, so back faces are visible
                // For ripples, a normal map would be ideal. We can generate one procedurally.
                // normalMap: this.createRippleNormalMap(), // See helper below
                // normalScale: new THREE.Vector2(0.05, 0.05), // Intensity of normal map
                envMapIntensity: 0.7, // Enhance reflections from scene environment map if used
                ior: 1.33, // Index of refraction for water
            });
            
            // Add a custom onBeforeCompile to animate UVs for ripples if using a normalMap
            // or to implement procedural ripples directly in the shader.
            if ((this.material as THREE.MeshPhysicalMaterial).normalMap || this.config.rippleIntensity > 0) {
                this.material.onBeforeCompile = (shader) => {
                    shader.uniforms.uTime = { value: 0 };
                    shader.uniforms.uRippleSpeed = { value: this.config.rippleSpeed };
                    shader.uniforms.uRippleScale = { value: this.config.rippleScale };
                    shader.uniforms.uRippleIntensity = { value: this.config.rippleIntensity };
                    shader.uniforms.uRippleColor = { value: new THREE.Color(this.config.rippleColor) };

                    // Vertex shader: pass world position or modified UVs for ripple calculation
                    shader.vertexShader = `
                        varying vec3 vWorldPosition_WaterSurface;
                        uniform float uTime;
                        uniform float uRippleSpeed;
                        uniform float uRippleScale;
                        uniform float uRippleIntensity;
                    ` + shader.vertexShader;
                    shader.vertexShader = shader.vertexShader.replace(
                        `#include <begin_vertex>`,
                        `#include <begin_vertex>
                         vWorldPosition_WaterSurface = (modelMatrix * vec4(position, 1.0)).xyz;
                         // Optional: Animate vertices for physical ripples
                         // transformed.y += sin(position.x * uRippleScale + uTime * uRippleSpeed) * uRippleIntensity * 0.1;
                        `
                    );

                    // Fragment shader: apply procedural ripples to normals or color
                    shader.fragmentShader = `
                        varying vec3 vWorldPosition_WaterSurface;
                        uniform float uTime;
                        uniform float uRippleSpeed;
                        uniform float uRippleScale;
                        uniform float uRippleIntensity;
                        uniform vec3 uRippleColor;

                        float simpleNoise(vec2 st) {
                            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                        }

                        float waterRipplePattern(vec2 coord, float time) {
                            vec2 p = coord * uRippleScale;
                            float S = sin(p.x + time * uRippleSpeed);
                            float C = cos(p.y + time * uRippleSpeed * 0.8);
                            float S2 = sin(p.y * 0.7 + time * uRippleSpeed * 0.4);
                            float C2 = cos(p.x * 0.6 - time * uRippleSpeed * 0.5);
                            return (S + C + S2 + C2) * 0.25; // Average of sines/cosines
                        }
                    ` + shader.fragmentShader;

                    // Modify normal calculation if not using a normalMap texture
                    if (!(this.material as THREE.MeshPhysicalMaterial).normalMap) {
                         shader.fragmentShader = shader.fragmentShader.replace(
                            `#include <normal_fragment_begin>`,
                            `#include <normal_fragment_begin>
                             float rippleNoise = waterRipplePattern(vWorldPosition_WaterSurface.xz, uTime); // Use world XZ for UVs
                             vec3 rippleNormalOffset = vec3(
                                 cos(rippleNoise * 20.0) * uRippleIntensity * 0.2, // dFdx approx
                                 0.0, // Normal points up mostly
                                 sin(rippleNoise * 20.0) * uRippleIntensity * 0.2  // dFdy approx
                             );
                             normal = normalize(normal + rippleNormalOffset);
                            `
                        );
                    }
                    // Add ripple highlights to emissive or diffuse
                    shader.fragmentShader = shader.fragmentShader.replace(
                        /vec4 diffuseColor = vec4\( diffuse, opacity \);/,
                        `vec4 diffuseColor = vec4(diffuse, opacity);
                         float rippleHighlight = pow(waterRipplePattern(vWorldPosition_WaterSurface.xz * 1.5, uTime * 1.2), 10.0); // Sharper highlights
                         diffuseColor.rgb += uRippleColor * rippleHighlight * uRippleIntensity * 2.0;
                        `
                    );
                    // Store shader for uniform updates if needed
                    (this.material as THREE.ShaderMaterial).userData.shader = shader;
                };
            }


            this.mesh = new THREE.Mesh(geometry, this.material);
            this.mesh.name = "WaterSurface";
            // Position it high above the scene. Player's view frustum should determine actual Y.
            // Let EnvironmentManager place it.
            this.mesh.rotation.x = -Math.PI / 2; // Plane is XY by default, rotate to be XZ
            this.mesh.renderOrder = 1; // Render after most opaque objects if transparent
          }
          
          // Optional: Helper to create a procedural ripple normal map
          private createRippleNormalMap(): THREE.CanvasTexture {
            const size = 256;
            const canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext('2d')!;
            const imageData = ctx.createImageData(size, size);
            const data = imageData.data;

            // Simple procedural noise for normal map (very basic)
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4;
                    const noiseVal = Math.random(); // Simple random noise
                    data[i] = Math.floor((Math.cos(x * 0.1) + 1) * 0.5 * 127 + 128); // R (normal.x)
                    data[i+1] = Math.floor((Math.sin(y * 0.1) + 1) * 0.5 * 127 + 128); // G (normal.y)
                    data[i+2] = 255; // B (normal.z, mostly up)
                    data[i+3] = 255; // Alpha
                }
            }
            ctx.putImageData(imageData, 0, 0);
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            return texture;
          }


          public update(deltaTime: number, elapsedTime: number): void {
            if (this.material instanceof THREE.ShaderMaterial && (this.material as THREE.ShaderMaterial).userData.shader) {
              const shader = (this.material as THREE.ShaderMaterial).userData.shader;
              if (shader.uniforms.uTime) {
                shader.uniforms.uTime.value = elapsedTime;
              }
            }
          }

          public getMesh(): THREE.Mesh {
            return this.mesh;
          }

          public dispose(): void {
            this.mesh.geometry?.dispose();
            if (this.material instanceof THREE.Material) {
                const mat = this.material as THREE.MeshPhysicalMaterial;
                mat.map?.dispose();
                mat.normalMap?.dispose();
                mat.transmissionMap?.dispose();
                // ... other maps
                mat.dispose();
            }
          }
        }
        ```    *   **Explanation:**
        *   `WaterSurfaceAsset` creates a large `PlaneGeometry`.
        *   It uses `MeshPhysicalMaterial` to leverage `transmission` for a watery, see-through effect and allows for good reflections/refractions.
        *   The `onBeforeCompile` method is used to inject custom GLSL logic into the standard material's shader. This adds procedural animated ripples by modifying UVs for normal mapping (if a `normalMap` is used) or by directly perturbing normals and adding highlights in the fragment shader.
        *   The ripples are driven by `uTime` and parameters from `gameConfig.ts`.
        *   It's rendered with `side: THREE.BackSide` so it's visible from below.
        *   A helper `createRippleNormalMap` is included as an example if a texture-based normal map is preferred for ripples.

---

#### Sub-Task 2.5: Refine `LightingManager.ts` for Caustic/God Ray Parameters and Application

*   **A. Purpose & Rationale:**
    *   Ensure `LightingManager` correctly manages and provides uniforms or mechanisms for caustics to affect multiple materials (not just seafloor if desired) and to set up and update god ray effects (if pursued via post-processing or mesh-based approaches).
*   **C. File Creation / Modification:**

    *   **Full File Path:** `src/lib/game/services/LightingManager.ts`
    *   **File Content (Refinements):**
        ```typescript
        // src/lib/game/services/LightingManager.ts
        import * as THREE from 'three';
        import { configSystem } from '../core/ConfigurationSystem';
        import { LightingConfig } from '../config/gameConfig';
        import { ShaderManager } from './ShaderManager'; // For shader chunk registration
        import NoiseGLSL from '../shaders/common/noise.glsl';
        import CausticsGLSL from '../shaders/common/caustics.glsl';

        export class LightingManager {
          private scene: THREE.Scene;
          private shaderManager: ShaderManager;
          private lightingConfig: Readonly<LightingConfig>;

          public ambientLight!: THREE.AmbientLight;
          public directionalLight!: THREE.DirectionalLight;
          public globalCausticTimeUniform: THREE.IUniform<number>; // Expose for materials

          constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
            this.scene = scene;
            this.shaderManager = shaderManager; // Store ShaderManager
            this.lightingConfig = configSystem.get('lighting');
            this.globalCausticTimeUniform = this.shaderManager.globalUniforms.uTime; // Link to global uTime

            this.initializeLights();
            this.initializeFog();
            this.registerCausticAndGodRayShaders(); // Ensure shaders are known to ShaderManager
            
            // God rays are handled by RenderManager's post-processing pass
            // LightingManager just provides config and potentially light source info
            console.log("LightingManager: Initialized. Config for caustics/god rays ready.");
          }
          
          private registerCausticAndGodRayShaders(): void {
            // Ensure common chunks are available
            this.shaderManager.registerChunk("noise2D", NoiseGLSL.noise2D);
            this.shaderManager.registerChunk("random2D", NoiseGLSL.random2D); // noise2D depends on this
            this.shaderManager.registerChunk("causticPattern", CausticsGLSL.causticPattern);
            this.shaderManager.registerChunk("PI", UtilsGLSL.PI); // Example common util
            this.shaderManager.registerChunk("saturate", UtilsGLSL.saturate); // Example common util
            
            // Seafloor shader (which includes caustics) is registered in ShaderManager constructor
            // God ray shaders for post-processing are imported directly by RenderManager
          }


          private initializeLights(): void { /* ... as in Step 3, Sub-Task 2.2 ... */ }
          private initializeFog(): void { /* ... as in Step 3, Sub-Task 2.2 ... */ }

          public getCausticGLSLChunk(): string {
            // Provide the necessary GLSL code for onBeforeCompile injection
            // Ensure all dependencies like noise functions are included
            return `
              ${NoiseGLSL.random2D} 
              ${NoiseGLSL.noise2D}
              ${CausticsGLSL.causticPattern}
            `;
          }
          
          public getDirectionalLight(): THREE.DirectionalLight {
              return this.directionalLight;
          }

          public update(deltaTime: number, elapsedTime: number): void {
            // uTime is updated globally by ShaderManager.update()
            // No specific caustic time update needed here if materials use global uTime.
            // If god rays had dynamic parameters animated here, update them.
            // e.g., this.godRayPass.uniforms.uIntensity.value = ...;
          }
          
          public dispose(): void { /* ... as before ... */ }
        }
        ```
    *   **Explanation:**
        *   `LightingManager` constructor now takes `ShaderManager` to ensure necessary chunks are registered.
        *   `globalCausticTimeUniform` directly references `ShaderManager.globalUniforms.uTime` for synchronization.
        *   `getCausticGLSLChunk` now correctly includes dependent noise functions.
        *   `getDirectionalLight` added for `RenderManager` to get light position for god rays.
        *   The responsibility for god rays effect itself is primarily with `RenderManager` (post-processing pass) and its shader, with `LightingManager` providing configuration and potentially dynamic parameters.

---

#### Sub-Task 2.6: Integrate New Environment Assets into `EnvironmentManager.ts`

*   **A. Purpose & Rationale:**
    *   To have `EnvironmentManager` manage the instantiation and placement of the new/enhanced seafloor segments, kelp patches, and the water surface.
*   **C. File Creation / Modification:**

    *   **Full File Path:** `src/lib/game/managers/EnvironmentManager.ts`
    *   **File Content (Additions/Modifications):**
        ```typescript
        // src/lib/game/managers/EnvironmentManager.ts
        import * as THREE from 'three';
        import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
        import { configSystem } from '../core/ConfigurationSystem';
        import { LightingManager } from '../services/LightingManager'; // For passing to assets if needed
        import { KelpWallAsset } from '../assets/obstacles/KelpWallAsset'; // Assuming this is used for kelp
        import { WaterSurfaceAsset } from '../assets/environment/WaterSurfaceAsset';

        interface EnvironmentSegment {
          mesh: THREE.Mesh; // Seafloor mesh
          isActive: boolean;
          kelpClusters?: THREE.Group[]; // Optional kelp associated with this segment
        }

        export class EnvironmentManager {
          private scene: THREE.Scene;
          private assetFactory: ProceduralAssetFactory;
          private lightingManager: LightingManager; // Store for passing to assets

          private segments: EnvironmentSegment[] = [];
          private segmentPoolSize = 5; 
          private segmentLength!: number; 
          private lastSegmentZ = 0;

          private visibleSegmentsFront = 2;
          private visibleSegmentsBehind = 1;

          private waterSurface?: WaterSurfaceAsset;
          private kelpPool: THREE.Group[] = []; // Pool for kelp clusters
          private kelpPoolSize = 20; // Max kelp clusters

          constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory, lightingManager: LightingManager) {
            this.scene = scene;
            this.assetFactory = assetFactory;
            this.lightingManager = lightingManager; // Store LightingManager
            // segmentLength is now fetched after assetFactory is ready with its seafloor generator
          }

          // Needs to be async due to seafloor mesh creation
          public async initialize(): Promise<void> {
            // Get segmentLength from the assetFactory's SeafloorAsset instance
            // This assumes ProceduralAssetFactory has a way to get the seafloorAssetGenerator
            // or its properties.
            const seafloorGen = this.assetFactory.getSeafloorAssetGenerator(); // Added this method to factory
            this.segmentLength = seafloorGen.segmentLength;

            await this.initializeSegments();
            this.initializeWaterSurface();
            this.initializeKelpPool();
            console.log("EnvironmentManager: Initialized with seafloor, water surface, and kelp pool.");
          }

          private async initializeSegments(): Promise<void> {
            for (let i = 0; i < this.segmentPoolSize; i++) {
              const mesh = await this.assetFactory.createSeafloorSegmentMesh(); // Now async
              mesh.visible = false;
              this.scene.add(mesh);
              this.segments.push({ mesh, isActive: false, kelpClusters: [] });
            }
            for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind + 1; i++) { // +1 for buffer
                await this.spawnSegmentAhead(true, -i * this.segmentLength);
            }
          }

          private initializeWaterSurface(): void {
            if (configSystem.get('visuals').waterSurface.enabled) {
                this.waterSurface = new WaterSurfaceAsset(this.assetFactory.shaderManager); // Pass ShaderManager
                const surfaceMesh = this.waterSurface.getMesh();
                // Position high above, e.g., based on camera typical max height or a fixed large value
                surfaceMesh.position.y = 10; // Example: 10 units above player's plane
                this.scene.add(surfaceMesh);
            }
          }
          
          private initializeKelpPool(): void {
            if (!configSystem.get('visuals').kelp.enabled) return;
            for (let i = 0; i < this.kelpPoolSize; i++) {
                // Assuming KelpWallAsset can be used for individual kelp clusters by configuring its strand count low
                const kelpConfig = configSystem.get('obstacles').kelpWall; // Use KelpWall config for now
                const tempKelpAsset = new KelpWallAsset(); // Uses its own config fetch
                const kelpCluster = tempKelpAsset.getMesh();
                kelpCluster.visible = false;
                this.scene.add(kelpCluster);
                this.kelpPool.push(kelpCluster);
            }
          }

          private async spawnSegmentAhead(initialSpawn = false, initialZ?:number ): Promise<void> {
            const segment = this.segments.find(seg => !seg.isActive);
            if (segment) {
              segment.isActive = true;
              segment.mesh.visible = true;
              
              if (initialSpawn && initialZ !== undefined) {
                  segment.mesh.position.z = initialZ - (this.segmentLength / 2);
                  this.lastSegmentZ = initialZ - this.segmentLength;
              } else {
                  segment.mesh.position.z = this.lastSegmentZ - (this.segmentLength / 2);
                  this.lastSegmentZ -= this.segmentLength;
              }
              segment.mesh.position.y = -1.0; // Configurable floor Y

              // Remove old kelp from this segment before adding new
              segment.kelpClusters?.forEach(cluster => {
                  cluster.visible = false;
                  this.kelpPool.push(cluster); // Return to pool
              });
              segment.kelpClusters = [];
              this.spawnKelpOnSegment(segment);

            } else { /* ... */ }
          }

          private spawnKelpOnSegment(segment: EnvironmentSegment): void {
            if (!configSystem.get('visuals').kelp.enabled || this.kelpPool.length === 0) return;

            const kelpVisualConfig = configSystem.get('visuals').kelp;
            const numClusters = THREE.MathUtils.randInt(1, 3); // 1-3 kelp clusters per segment

            for (let i = 0; i < numClusters; i++) {
                if (this.kelpPool.length === 0) break; // No more pooled kelp
                const kelpCluster = this.kelpPool.pop()!;
                
                // Position kelp on the current segment (relative to segment center or edges)
                kelpCluster.position.x = THREE.MathUtils.randFloatSpread(this.segmentWidth * 0.8);
                kelpCluster.position.y = segment.mesh.position.y; // Base of kelp on seafloor
                kelpCluster.position.z = segment.mesh.position.z + THREE.MathUtils.randFloatSpread(this.segmentLength * 0.8);
                kelpCluster.rotation.y = Math.random() * Math.PI * 2;
                kelpCluster.visible = true;
                
                // Trigger animation reset/start if KelpWallAsset has such a method
                const assetInstance = kelpCluster.userData.assetInstance as KelpWallAsset;
                assetInstance?.reset?.(); // Reset animation state
                
                segment.kelpClusters?.push(kelpCluster);
            }
          }


          public async update(deltaTime: number, playerZ: number, elapsedTime: number): Promise<void> {
            const spawnTriggerZ = this.lastSegmentZ + (this.segmentLength * (this.visibleSegmentsFront - 0.5));
            if (playerZ < spawnTriggerZ) {
              await this.spawnSegmentAhead();
            }
            this.recycleSegments(playerZ);

            this.waterSurface?.update(deltaTime, elapsedTime);

            // Update animations for visible kelp clusters
            this.segments.forEach(seg => {
                if (seg.isActive && seg.kelpClusters) {
                    seg.kelpClusters.forEach(cluster => {
                        const assetInstance = cluster.userData.assetInstance as KelpWallAsset;
                        assetInstance?.updateAnimation?.(deltaTime);
                    });
                }
            });
          }
          
          private recycleSegments(playerZ: number): void {
            const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 2)); // Increased buffer

            this.segments.forEach(segment => {
              if (segment.isActive) {
                const segmentFarEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
                if (segmentFarEdgeZ > recycleThreshold) {
                  segment.isActive = false;
                  segment.mesh.visible = false;
                  // Recycle associated kelp
                  segment.kelpClusters?.forEach(cluster => {
                      cluster.visible = false;
                      this.kelpPool.push(cluster); // Return to pool
                  });
                  segment.kelpClusters = [];
                }
              }
            });
          }


          public async reset(initialPlayerZ: number = 0): Promise<void> {
            this.segments.forEach(segment => {
              segment.isActive = false;
              segment.mesh.visible = false;
              segment.kelpClusters?.forEach(cluster => {
                  cluster.visible = false;
                  this.kelpPool.push(cluster);
              });
              segment.kelpClusters = [];
            });
            this.lastSegmentZ = initialPlayerZ + this.segmentLength * (this.visibleSegmentsBehind +1) ; // Reset based on player position
            
            // Re-spawn initial segments correctly
            for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind + 1; i++) {
                await this.spawnSegmentAhead(true, initialPlayerZ - i * this.segmentLength);
            }
            if (this.waterSurface && this.waterSurface.mesh) {
                this.waterSurface.mesh.position.z = initialPlayerZ - 20; // Keep surface ahead
            }
          }
          
          public dispose(): void {
            // ... (dispose segments as before)
            this.waterSurface?.dispose();
            this.kelpPool.forEach(kelp => {
                const assetInstance = kelp.userData.assetInstance as KelpWallAsset;
                assetInstance?.dispose?.(); // Call asset's dispose
                this.scene.remove(kelp);
            });
            this.kelpPool = [];
          }
          // ...
        }
        ```
    *   **Full File Path:** `src/lib/game/GameEngine.ts`
    *   **Specific Changes:** `EnvironmentManager.initialize` is now `async`.
        ```typescript
        // src/lib/game/GameEngine.ts
        // ...
        export class GameEngine {
          // ...
          public async initialize(): Promise<void> { // Now async
            try {
              // ...
              this.environmentManager = new EnvironmentManager(this.scene, this.assetFactory, this.lightingManager);
              await this.environmentManager.initialize(); // Await initialization
              // ...
            } // ...
          }

          private async gameLoop(timestamp: number = performance.now()): Promise<void> { // gameLoop can be async if needed
            // ...
            if (this.currentState === GameState.PLAYING) {
                // ...
                await this.environmentManager.update(dt, this.playerController.mesh.position.z, elapsedTime); // Await if update is async
                // ...
            }
            // ...
          }
          public async resetGame(): Promise<void> { // resetGame can be async
             // ...
             if (this.environmentManager) await this.environmentManager.reset(this.playerController.mesh.position.z);
             // ...
          }
          // ...
        }
        ```
    *   **Explanation:**
        *   `EnvironmentManager` now instantiates `WaterSurfaceAsset`.
        *   It manages a pool of `KelpWallAsset` instances for decorative kelp, spawning them on seafloor segments.
        *   `initialize` is `async` to handle `async` seafloor mesh creation. `update` and `reset` are also made `async`.
        *   `WaterSurfaceAsset.update` and kelp animations are called in `EnvironmentManager.update`.
        *   The water surface is positioned high up and moves with the player on Z to always be "above".

---

#### Sub-Task 2.7: Final Lighting Refinements (Caustics, God Rays, Fog)

*   **A. Purpose & Rationale:**
    *   Fine-tune all lighting and atmospheric parameters in `gameConfig.ts` based on the newly styled environment. Ensure caustics are effective, god rays (even basic) contribute positively, and fog creates the right sense of depth and mystery.
*   **C. File Creation / Modification:**

    *   **Full File Path:** `src/lib/game/config/gameConfig.ts`
    *   **Specific Changes:** This involves iterative tuning of values in the `lighting` section.
        *   **Caustics:** Adjust `causticIntensity`, `causticScale`, `causticSpeed`, `causticColor`, `causticBlendMode`.
        *   **God Rays:** If the basic screen-space effect from Step 3 is active, tune `godRayIntensity`, `godRayDensity`, `godRayWeight`, `godRayDecay`, `godRayExposure`, `godRaySamples`, `godRayColor`. Ensure `RenderManager` correctly updates the `uLightPositionScreen` uniform in the god ray shader pass based on `LightingManager.getDirectionalLight()`.
        *   **Fog:** Adjust `fogColor`, `fogDensity` (or `fogNear`/`fogFar`).
        *   **Ambient/Directional Lights:** Fine-tune their colors and intensities to complement the new environment and effects.
*   **Full File Path:** `src/lib/game/services/RenderManager.ts`
*   **Specific Changes:** Ensure `updateGodRayUniforms` correctly projects the main directional light source to screen space for the god ray shader.
    ```typescript
    // src/lib/game/services/RenderManager.ts
    // ... (inside updateGodRayUniforms method, or a new method called by it)
    private getLightScreenPosition(light: THREE.DirectionalLight | THREE.SpotLight | THREE.PointLight): THREE.Vector2 {
        const lightPositionWorld = new THREE.Vector3();
        // For DirectionalLight, its position is its direction FROM origin.
        // We need a point in space representing the "sun" or bright surface area.
        // One way: take a point far along the camera's view direction but high up.
        // Or, project the light's position if it's treated as a point source for rays.
        // Let's use a proxy point high up, slightly in direction of directional light
        
        const lightSourceProxy = new THREE.Vector3();
        // Start with camera position, move far back along its view, then high up
        this.camera.getWorldPosition(lightSourceProxy);
        const viewDirection = new THREE.Vector3();
        this.camera.getWorldDirection(viewDirection);
        lightSourceProxy.addScaledVector(viewDirection, -50); // 50 units behind camera (into scene)
        lightSourceProxy.y = 15; // High up
        
        // Optionally, shift slightly by directional light's XZ direction component
        const dirLightXZ = new THREE.Vector3(light.position.x, 0, light.position.z).normalize();
        lightSourceProxy.addScaledVector(dirLightXZ, 5);


        const screenPos = lightSourceProxy.clone().project(this.camera);
        return new THREE.Vector2((screenPos.x + 1) * 0.5, (screenPos.y + 1) * 0.5);
    }
    
    // In updateGodRayUniforms:
    // const light = this.lightingManager.getDirectionalLight();
    // if (light && this.godraysPass) {
    //     this.godraysPass.uniforms.uLightPositionScreen.value.copy(this.getLightScreenPosition(light));
    // }
    ```*   **Explanation:**
    *   The focus is on iterative tuning of `gameConfig.ts`.
    *   `RenderManager.getLightScreenPosition` provides a more robust way to determine the light source for screen-space god rays, making it appear consistently from the "sky" area relative to the camera.

---

### 3. Comprehensive Testing and Validation Plan for THIS STEP

*   **A. Unit Testing:**
    *   Minimal for visual aspects. Unit tests for `WaterSurfaceAsset` or `KelpAsset` could check for correct geometry segment counts or material property application from config.
*   **C. Manual Verification Steps & Expected Visual/Functional Outcomes:**
    1.  `[ ]` Run the game.
    2.  `[ ]` **Seafloor Appearance:**
        *   **Expected:** Seafloor displays a procedural sandy texture with color variations. Bump/normal mapping (if implemented via Canvas texture) adds subtle roughness. Caustic light patterns from `LightingManager` are clearly visible and animate correctly on the seafloor, interacting with its base texture.
    3.  `[ ]` **Kelp Appearance & Animation:**
        *   **Expected:** Kelp (from `KelpWallAsset` or new sparse `KelpAsset`) appears with detailed stalks and fronds. `MeshPhysicalMaterial` provides good translucency. CPU-based vertex animation creates a natural, flowing sway. Multiple kelp clusters show varied animation due to phase offsets or world position influence.
    4.  `[ ]` **Water Surface Effect:**
        *   **Expected:** Looking upwards, a shimmering water surface is visible. It should have subtle animated ripples and react to scene lighting (e.g., specular highlights from the main directional light). It should be semi-transparent, allowing a hint of the "sky" (scene background color) through.
    5.  `[ ]` **Lighting & Atmospherics Cohesion:**
        *   **Expected:** Caustics, god rays (if basic version active), fog, and general scene lighting work together to create a convincing and immersive Pixar-style underwater atmosphere. Colors are harmonious. Depth is well-conveyed.
    6.  `[ ]` **Performance with All Environment Effects:**
        *   **Expected:** Frame rate remains high and stable (target 60fps desktop, 30-45+ mobile). No significant hitches or slowdowns.
    7.  `[ ]` **Configuration Testing:**
        *   Modify parameters in `gameConfig.ts` for `seafloor`, `kelp`, `waterSurface`, and `lighting` (caustics, god rays, fog). Reload game.
        *   **Expected:** All visual aspects change according to the new configurations.
*   **E. Definition of "Done" for THIS SPECIFIC STEP:**
    1.  `[X]` Visual parameters for seafloor, kelp, water surface, and refined lighting are in `gameConfig.ts`.
    2.  `[X]` `SeafloorAsset.ts` uses `MeshStandardMaterial` with procedural sand texture (Canvas API) and correctly displays caustics via `onBeforeCompile` or similar.
    3.  `[X]` `KelpWallAsset.ts` (or new `KelpAsset.ts`) has enhanced geometry, `MeshPhysicalMaterial` for translucency, and refined CPU swaying animation.
    4.  `[X]` `WaterSurfaceAsset.ts` is implemented with a shimmering, refractive surface effect.
    5.  `[X]` `LightingManager.ts` parameters for caustics and god rays are fine-tuned and effects are integrated. `RenderManager` correctly handles god ray post-processing pass with accurate light source projection.
    6.  `[X]` `EnvironmentManager.ts` correctly manages and updates seafloor, kelp, and water surface.
    7.  `[X]` Manual verification confirms all environment visuals and effects are working, configurable, performant, and contribute to the target Pixar aesthetic.
    8.  `[X]` Code is committed to branch: `task/P1C-step7-environment-visuals`.
    9.  `[X]` NFRs (Immersion, Performance, Visual Harmony, Configurability) are met.

### 4. Key Artifacts Produced & Project State After THIS STEP

*   **A. Manifest of New/Significantly Modified Files & Directories:**
    *   `src/lib/game/assets/environment/SeafloorAsset.ts` (Modified)
    *   `src/lib/game/assets/obstacles/KelpWallAsset.ts` (Modified/Enhanced for environment use)
    *   `src/lib/game/assets/environment/WaterSurfaceAsset.ts` (New)
    *   `src/lib/game/config/gameConfig.ts` (Modified with new/refined visual and lighting parameters)
    *   `src/lib/game/services/LightingManager.ts` (Modified/Refined)
    *   `src/lib/game/services/RenderManager.ts` (Refined god ray integration)
    *   `src/lib/game/managers/EnvironmentManager.ts` (Modified to manage new assets)
    *   Potentially new utility for Canvas texture generation if complex.
    *   Potentially new simple GLSL shaders if `WaterSurfaceAsset` uses one.
*   **B. Key Architectural Patterns/Decisions Applied or Reinforced:**
    *   **Layered Environmental Effects:** Building up the underwater atmosphere through distinct but interacting components (seafloor texture, caustics, kelp, water surface, fog, god rays).
    *   **Standard Material Focus:** Maximizing `MeshStandardMaterial` and `MeshPhysicalMaterial` capabilities, supplemented by Canvas API textures and `onBeforeCompile` shader modifications, to achieve complex looks without full custom GLSL per asset where stability is prioritized.

### 5. Troubleshooting Common Issues & Proactive Error Prevention for THIS STEP

*   **Symptom:** Seafloor caustics don't appear or look wrong after `onBeforeCompile` injection.
    *   **Likely Cause(s):** GLSL syntax error in injected code; `LightingManager.getCausticGLSLChunk()` not providing all necessary functions (like noise); uniform mismatch between `onBeforeCompile` setup and GLSL; `vWorldPosition_Seafloor` not correctly passed or used.
    *   **Solution/Debugging Tip:** Check console for shader compilation errors. Simplify injected GLSL to output a basic color first. Log shader code from `onBeforeCompile` to inspect. Use Spector.js.
    *   **Prevention Note:** Test `onBeforeCompile` modifications with very simple GLSL changes first. Ensure all GLSL functions are self-contained or correctly included.
*   **Symptom:** Water surface is opaque, doesn't shimmer, or ripples are incorrect.
    *   **Likely Cause(s):** `MeshPhysicalMaterial` `transmission` and `opacity` not set correctly; `side: THREE.BackSide` missing; ripple shader logic flawed or `uTime` not updating its material.
    *   **Solution/Debugging Tip:** Verify material properties. If using `onBeforeCompile` for ripples, debug the shader logic. Ensure `WaterSurfaceAsset.update()` correctly updates its material's time uniform if it has one.
    *   **Prevention Note:** Start with basic transparency for the water surface and layer on ripple effects.
*   **Symptom:** Kelp animation is stiff, unnatural, or all strands sway identically.
    *   **Likely Cause(s):** Vertex animation logic in `KelpWallAsset.updateAnimation()` too simple; lack of variation (phase offset, amplitude differences) per strand or per vertex.
    *   **Solution/Debugging Tip:** Add more randomness or position-based variation to sine wave parameters in the sway logic. Ensure original vertex positions are correctly stored and used.
    *   **Prevention Note:** Introduce noise or unique IDs/indices into animation calculations for each kelp strand/vertex to desynchronize motion.

### 6. AI Self-Critique & Final Quality Assurance Checklist (for THIS STEP's Output)
1.  **Step Focus & Exclusivity:** Yes, focuses on Seafloor, Kelp, Water Surface, and related lighting refinements.
2.  **Actionability & Completeness:** Yes, provides detailed code modifications and new class structures.
3.  **Production-Grade Code Quality:** Code aims for modularity, uses configuration, and leverages standard Three.js features where possible (like `onBeforeCompile`).
4.  **Correctness & Functionality:** Procedural texture, material setup, and animation concepts are sound. Caustic injection via `onBeforeCompile` is a valid technique.
5.  **Dependency Management:** No new external dependencies.
6.  **File Paths & Project Structure Adherence:** Yes.
7.  **UI/UX Excellence (if applicable):** N/A for direct UI, but critical for game's visual atmosphere and immersion.
8.  **NFR Adherence & Proactive Considerations:** Performance (procedural textures, CPU animation for kelp, lightweight water surface), Visual Harmony, and Configurability are key.
9.  **Testing & Validation Thoroughness:** Detailed manual visual verification steps are provided.
10. **Unambiguity & Precision:** Instructions and code are specific.
11. **Proactive Problem Solving & Error Prevention:** Troubleshooting addresses common visual and performance issues for environment rendering.
12. **Alignment with ALL Inputs:** Yes, directly implements Step 7 and respects the shift to standard materials where feasible.
13. **No Oversights (The "Last Mile"):** Considers `onBeforeCompile` for seafloor caustics, procedural textures, and integration into existing managers.

---
This completes the detailed plan for Step 7. The environment should now have a much richer, more dynamic, and thematically consistent Pixar-inspired underwater look and feel. The next steps will focus on any remaining specific VFX, mobile controls, and then extensive balancing and polishing.

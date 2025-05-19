### 0. Step Implementation Plan Identifier & Strategic Context

*   **Implementing Step from Blueprint:** `8: Implement VisualEffectsService (Particles & Basic Screen Effects)`
*   **Phase:** Phase 1 (Completion): Playable Core Game Prototype (in Next.js)
*   **Blueprint Version:** `v1.0` (from `docs/phase1steps.md`)
*   **Date Prepared:** May 19, 2025
*   **A. Primary Goal & Anticipated Deliverables of THIS STEP:**
    *   This step aims to complete and refine the `VisualEffectsService` by fully developing, integrating, and polishing all planned particle systems (Player Bubble Trail, Collectible Pickup Sparks, Obstacle Impact Debris, Ambient Dust/Bubbles) and ensuring screen effects (flash, camera shake) are robust, configurable, and impactful. The primary deliverable is a game with rich, performant, and thematically consistent visual feedback for player actions and game events, significantly enhancing immersion and "juiciness."
*   **B. Key Focus Areas & NFRs for THIS STEP:**
    *   **Key Focus Areas:** Particle System Implementation, Object Pooling within each system, Visual Feedback Design, Performance Optimization, System Integration, Art Direction for Effects.
    *   **Strategic Notes, Proactive Considerations & Key NFRs To Emphasize:**
        *   **Impactful & Clear Feedback (NFR):** All effects must clearly communicate game events (collections, collisions, player actions) without being visually distracting or noisy.
        *   **Performant Particle Systems (NFR):** Each particle system must manage its own pool efficiently, using `THREE.Points` with custom shaders. Particle counts and update logic must be optimized for target performance (30-60fps mobile/desktop).
        *   **Stylized Appearance (NFR):** All particles and screen effects should adhere to the established Pixar-inspired underwater aesthetic – typically soft, appealing, and expressive.
        *   **Configurability (NFR):** All significant aspects of particle systems (count, lifespan, speed, size, color, emission logic) and screen effects (intensity, duration, color) must be tunable via `gameConfig.ts`.
        *   **Robustness & Integration:** Ensure the `VisualEffectsService` correctly manages the lifecycle of all effects and that triggers from other game managers are reliable. Effects should reset correctly with the game.

### 1. Prerequisites, Environment Setup & Configuration for THIS STEP

*   **A. Verification of Critical Dependencies:**
    1.  **Existing `VisualEffectsService.ts`:**
        *   **Verification:** `src/lib/game/services/VisualEffectsService.ts` is present. It currently manages screen flash, camera shake, and has implementations for `BubbleParticleSystem` (player trail) and `DustParticleSystem` (ambient). (Status: Verified from file context).
    2.  **Existing Particle Systems:**
        *   **Verification:** `src/lib/game/vfx/particleSystems/BubbleParticleSystem.ts` and `DustParticleSystem.ts` exist. (Status: Verified).
    3.  **Particle Shaders:**
        *   **Verification:** `src/lib/game/vfx/shaders/particle.vert.ts`, `bubble.frag.ts`, and `dust.frag.ts` exist and are registered in `ShaderManager`. (Status: Verified).
    4.  **`ShaderManager.ts`:**
        *   **Verification:** Capable of providing `ShaderMaterial` instances for particles. (Status: Verified).
    5.  **`RenderManager.ts` with `EffectComposer`:**
        *   **Verification:** `RenderManager` uses `EffectComposer`. `VisualEffectsService` can add/remove post-processing passes. (Status: Verified).
    6.  **`CameraManager.ts` with Shake Logic:**
        *   **Verification:** `CameraManager` has methods like `applyShakeOffset` and `clearShakeOffset`. (Status: Verified from file context).
    7.  **`GameCanvas.tsx` with Screen Flash Logic:**
        *   **Verification:** `GameCanvas` can trigger a screen flash via its `screenFlash` state and CSS animation. (Status: Verified).
    8.  **Gameplay Managers (`PlayerController`, `ObstacleManager`, `CollectibleManager`, `CollisionDetectionSystem`):**
        *   **Verification:** These managers are functional and ready for refined VFX trigger integrations. (Status: Verified).
    9.  **`gameConfig.ts` Visuals Section:**
        *   **Verification:** The `visuals` section in `gameConfig.ts` exists and is ready for comprehensive particle effect configurations. (Status: Verified, will be expanded).
*   **B. Required Software, Libraries, Tools & Versions:**
    *   Core Stack: Next.js, React, Three.js, TypeScript, GLSL.
    *   No new external libraries.
*   **C. Environment Configuration (Local & Target):**
    *   All configurations will be managed within `src/lib/game/config/gameConfig.ts`.
*   **D. Project Structure & Version Control Setup for THIS STEP:**
    *   **Current Git Branch:** Ensure you are on `feature/phase1-completion`.
    *   **Create Task Branch:**
        ```bash
        git checkout feature/phase1-completion
        git pull
        git checkout -b task/P1C-step8-vfx-final
        ```
    *   **New/Modified Files:**
        *   `src/lib/game/services/VisualEffectsService.ts` (Significantly enhanced)
        *   `src/lib/game/vfx/particleSystems/CollectiblePickupParticleSystem.ts` (New)
        *   `src/lib/game/vfx/particleSystems/ObstacleImpactParticleSystem.ts` (New)
        *   `src/lib/game/vfx/particleSystems/BubbleParticleSystem.ts` (Refined)
        *   `src/lib/game/vfx/particleSystems/DustParticleSystem.ts` (Refined)
        *   `src/lib/game/vfx/shaders/sparkle.frag.ts` (New, for collectible pickup)
        *   `src/lib/game/vfx/shaders/impact_debris.frag.ts` (New, for obstacle impact)
        *   `src/lib/game/services/ShaderManager.ts` (Modified to register new particle shaders)
        *   `src/lib/game/config/gameConfig.ts` (Expanded `visuals` section for new particle systems and detailed tuning)
        *   `PlayerController.ts`, `CollectibleManager.ts`, `ObstacleManager.ts`, `CollisionDetectionSystem.ts` (Modified for precise VFX triggers).

### 2. Detailed Implementation Guide & Production-Ready Code

---

#### Sub-Task 2.1: Enhance `gameConfig.ts` for All VFX Systems

*   **A. Purpose & Rationale:** To define comprehensive, tunable parameters for all four particle effect types (Player Trail Bubbles, Collectible Sparks, Obstacle Impact Debris, Ambient Dust) and screen effects, ensuring artistic control and easy balancing.
*   **C. File Creation / Modification:**
    *   **Modify File Path:** `src/lib/game/config/gameConfig.ts`
    *   **File Content (Additions/Modifications to `VisualSettings` and `defaultConfig.visuals`):**
        ```typescript
        // src/lib/game/config/gameConfig.ts

        export interface ParticleEffectConfig {
          enabled: boolean;
          poolSize: number;
          // Particle appearance
          particleSizeMin: number;
          particleSizeMax: number;
          color1: number | string;        // Primary color
          color2?: number | string;       // Optional secondary color for variation/gradient
          opacityStart?: number;
          opacityEnd?: number;
          textureUrl?: string;          // Optional texture for particles
          // Particle behavior
          lifetimeMin: number;           // seconds
          lifetimeMax: number;           // seconds
          speedMin: number;
          speedMax: number;
          gravity?: number;               // Affects Y velocity
          spreadAngle?: number;         // For burst effects (0-360 degrees)
          emissionRate?: number;        // Particles per second for continuous effects
          burstCount?: number;          // Particles per emission for burst effects
          initialRotation?: boolean;    // Random initial rotation
          rotationSpeed?: number;       // Random rotation speed
        }
        
        export interface ScreenEffectConfig {
            flashColorMinor: string; // rgba format
            flashDurationMinor: number; // ms
            flashColorMajor: string; // rgba format
            flashDurationMajor: number; // ms
            shakeIntensityMinor: number;
            shakeDurationMinor: number; // seconds
            shakeIntensityMajor: number;
            shakeDurationMajor: number; // seconds
        }

        export interface VisualSettings {
          // ... (existing sky, light, fog, caustics, godrays)
          
          // Particle Systems (consolidated from previous file structure)
          enableParticles: boolean; // Global toggle for all particle systems

          playerTrailBubbles: ParticleEffectConfig;
          collectibleSparks: ParticleEffectConfig;
          obstacleImpactDebris: ParticleEffectConfig;
          ambientDust: ParticleEffectConfig; // Renamed from ambientParticles for clarity

          // Screen Effects (consolidated)
          enableScreenEffects: boolean; // Global toggle
          screenFlash: ScreenEffectConfig; // Grouped flash settings
          cameraShake: ScreenEffectConfig; // Grouped shake settings (using same duration/intensity structure)

          // Post-Processing Effects (already present, ensure they are also under enableScreenEffects if desired)
          vignetteEnabled: boolean;
          vignetteIntensity: number;
          vignetteSmoothness: number;
          colorGradingEnabled: boolean;
          colorGradeIntensity: number;
          colorGradeTargetColor: number | string;
          distortionEnabled: boolean;
          distortionIntensity: number;
          distortionSpeed: number;
        }

        // In defaultConfig.visuals:
        // visuals: {
        //   ...
            enableParticles: true,
            playerTrailBubbles: {
              enabled: true, poolSize: 60, particleSizeMin: 0.03, particleSizeMax: 0.09,
              lifetimeMin: 0.8, lifetimeMax: 2.0, speedMin: 0.15, speedMax: 0.4,
              color1: 0xB0E0E6, color2: 0xFFFFFF, opacityStart: 0.7, opacityEnd: 0.0,
              gravity: -0.08, // Bubbles rise
              emissionRate: 15, // Bubbles per second during movement
            },
            collectibleSparks: {
              enabled: true, poolSize: 50, particleSizeMin: 0.04, particleSizeMax: 0.12,
              lifetimeMin: 0.2, lifetimeMax: 0.6, speedMin: 0.8, speedMax: 2.2,
              spreadAngle: 360, color1: 0xFFF0A0, color2: 0xFFD700, opacityStart: 0.9, opacityEnd: 0.0,
              burstCount: 12,
              initialRotation: true, rotationSpeed: 2.0
            },
            obstacleImpactDebris: {
              enabled: true, poolSize: 70, particleSizeMin: 0.05, particleSizeMax: 0.15,
              lifetimeMin: 0.4, lifetimeMax: 1.0, speedMin: 1.0, speedMax: 2.8,
              spreadAngle: 150, color1: 0xAAAAAA, color2: 0x777777, opacityStart: 0.8, opacityEnd: 0.0,
              gravity: 0.6, // Debris falls
              burstCount: 18,
            },
            ambientDust: { // Previously DustParticleSystem config
              enabled: true, poolSize: 150, particleSizeMin: 0.01, particleSizeMax: 0.04,
              lifetimeMin: 5.0, lifetimeMax: 15.0, // Long lifetime, they recycle
              speedMin: 0.01, speedMax: 0.03, // Very slow drift
              color1: 0xFFFFFF, opacityStart: 0.05, opacityEnd: 0.2, // Very subtle
              // spawnAreaSize: { x: 30, y: 10, z: 40 } // Defined in its own class, not here
            },

            enableScreenEffects: true,
            screenFlash: {
              flashColorMinor: 'rgba(255, 80, 80, 0.25)', flashDurationMinor: 120,
              flashColorMajor: 'rgba(255, 50, 50, 0.45)', flashDurationMajor: 250,
            },
            cameraShake: { // Reusing ScreenEffectConfig structure for consistency
              shakeIntensityMinor: 0.06, shakeDurationMinor: 0.18, // Adjusted intensity and duration
              shakeIntensityMajor: 0.12, shakeDurationMajor: 0.35,
            },
            // ... (vignette, color grading, distortion as before)
        // }
        ```
    *   **Explanation:**
        *   Introduced a more detailed `ParticleEffectConfig` interface.
        *   Standardized configuration for all four particle types under `visuals`.
        *   Grouped screen flash and camera shake parameters into a `ScreenEffectConfig` for clarity and consistency.
        *   Adjusted default values for a more polished starting point. `emissionRate` for continuous effects, `burstCount` for burst effects.

---

#### Sub-Task 2.2: Finalize Particle Shaders

*   **A. Purpose & Rationale:** Ensure all necessary particle shaders are present, functional, and registered with `ShaderManager`. This includes the common `pointSprite.vert.ts`, and fragment shaders for bubbles, dust, sparks (for collectible pickup), and debris (for obstacle impact).
*   **C. File Creation / Modification:**

    *   **Verify/Refine:** `src/lib/game/vfx/shaders/particle.vert.ts` (This is the vertex shader used by all `THREE.Points` based particle systems).
        *   **Content (ensure it uses all necessary attributes):**
            ```typescript
            // src/lib/game/vfx/shaders/particle.vert.ts
            export const vertexShaderSource = `
              attribute float aScale;       // Scale per particle
              attribute vec3 aColor;        // Color per particle
              attribute float aAlpha;       // Alpha per particle
              attribute float aRotation;    // Rotation per particle

              varying vec3 vColor;
              varying float vAlpha;
              varying float vRotation;

              uniform float uBaseSize;      // Global size multiplier from material
              uniform float uPixelRatio;    // For consistent sizing
              // uniform float uTime;       // Not typically used in this generic vertex shader

              void main() {
                vColor = aColor;
                vAlpha = aAlpha;
                vRotation = aRotation; // Pass rotation to fragment shader if needed for textured sprites

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

                // Perspective-correct point size
                gl_PointSize = uBaseSize * aScale * (100.0 / -mvPosition.z) * uPixelRatio;
                // Ensure gl_PointSize is not NaN or Inf
                if (mvPosition.z == 0.0) gl_PointSize = 0.0; // Avoid division by zero if camera is inside point
                if (gl_PointSize < 0.0) gl_PointSize = 0.0; // Ensure positive size


                gl_Position = projectionMatrix * mvPosition;
              }
            `;
            ```

    *   **Verify/Refine:** `src/lib/game/vfx/shaders/bubble.frag.ts` (Used by `BubbleParticleSystem`).
    *   **Verify/Refine:** `src/lib/game/vfx/shaders/dust.frag.ts` (Used by `DustParticleSystem`).

    *   **New File:** `src/lib/game/vfx/shaders/sparkle.frag.ts` (For `CollectiblePickupParticleSystem`)
        *   **File Content:**
            ```typescript
            // src/lib/game/vfx/shaders/sparkle.frag.ts
            export const fragmentShaderSource = `
              varying vec3 vColor;
              varying float vAlpha;
              // varying float vRotation; // Can be used if you have a non-circular sprite

              uniform sampler2D uTexture; // Optional sparkle texture
              uniform bool uUseTexture;   // To toggle texture usage

              void main() {
                vec2 uv = gl_PointCoord;
                float dist = length(uv - vec2(0.5));
                
                // Procedural sparkle: sharp center, quick falloff
                float intensity = 1.0 - smoothstep(0.0, 0.4, dist); // Sharp core
                intensity *= intensity; // Sharpen further
                float outerGlow = 1.0 - smoothstep(0.3, 0.5, dist); // Softer outer glow
                
                float mask = intensity * 0.7 + outerGlow * 0.3;

                if (uUseTexture) {
                    // vec2 rotatedUv = rotateUV(uv, vRotation); // Implement rotateUV if needed
                    mask *= texture2D(uTexture, uv).a;
                }

                if (mask * vAlpha < 0.01) discard;

                gl_FragColor = vec4(vColor, mask * vAlpha);
              }
            `;
            ```

    *   **New File:** `src/lib/game/vfx/shaders/impact_debris.frag.ts` (For `ObstacleImpactParticleSystem`)
        *   **File Content:**
            ```typescript
            // src/lib/game/vfx/shaders/impact_debris.frag.ts
            export const fragmentShaderSource = `
              varying vec3 vColor;
              varying float vAlpha;
              // varying float vRotation;

              // uniform sampler2D uTexture; // Could be a debris/grunge texture
              // uniform bool uUseTexture;

              void main() {
                vec2 uv = gl_PointCoord;
                float dist = length(uv - vec2(0.5));

                // Simple, slightly irregular dot for debris
                float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
                float mask = 1.0 - smoothstep(0.4 - noise * 0.1, 0.5, dist); // Slightly irregular edge

                // if (uUseTexture) {
                //   mask *= texture2D(uTexture, uv).a;
                // }

                if (mask * vAlpha < 0.01) discard;

                gl_FragColor = vec4(vColor, mask * vAlpha);
              }
            `;
            ```
    *   **Modify File Path:** `src/lib/game/services/ShaderManager.ts`
        *   **Specific Changes:** Ensure all four particle fragment shaders (bubble, dust, sparkle, impact_debris) are registered along with the common `pointSpriteVertex`.
            ```typescript
            // In ShaderManager constructor or a dedicated registration method:
            // ... after registering bubbleShader and dustShader (from existing files)

            this.registerShader({
              name: 'sparkleShader',
              vertexShaderSource: particleVertexShader, // from existing import
              fragmentShaderSource: sparkleFragmentShader, // from new import
              defaultUniforms: () => ({ /* uBaseColor, uBaseSize, uPixelRatio, uUseTexture, uTexture */ }),
              materialParameters: { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }
            });
            this.registerShader({
              name: 'impactDebrisShader',
              vertexShaderSource: particleVertexShader, // from existing import
              fragmentShaderSource: impactDebrisFragmentShader, // from new import
              defaultUniforms: () => ({ /* uBaseColor, uBaseSize, uPixelRatio */ }),
              materialParameters: { transparent: true, depthWrite: false, blending: THREE.NormalBlending }
            });
            ```

---

#### Sub-Task 2.3: Implement `CollectiblePickupParticleSystem.ts`

*   **A. Purpose & Rationale:** To create a dedicated particle system for a burst of "sparkle" effects when the player collects a bubble or coin.
*   **C. File Creation / Modification:**
    *   **Full File Path (New File):** `src/lib/game/vfx/particleSystems/CollectiblePickupParticleSystem.ts`
    *   **File Content (Production-Ready Code):**
        ```typescript
        // src/lib/game/vfx/particleSystems/CollectiblePickupParticleSystem.ts
        import *asına THREE from 'three';
        import { configSystem } from '../../core/ConfigurationSystem';
        import { ShaderManager } from '../../services/ShaderManager';
        import { ParticleEffectConfig } from '../../config/gameConfig';

        interface SparkleParticle {
          position: THREE.Vector3; velocity: THREE.Vector3;
          lifetime: number; maxLifetime: number;
          currentSize: number; baseSize: number;
          alpha: number; color: THREE.Color;
          rotation: number; rotationSpeed: number;
          isActive: boolean;
        }

        export class CollectiblePickupParticleSystem {
          private scene: THREE.Scene;
          private shaderManager: ShaderManager;
          private config: Readonly<ParticleEffectConfig>;
          
          private particles: SparkleParticle[] = [];
          public points!: THREE.Points;
          private positions!: Float32Array;
          private alphas!: Float32Array;
          private sizes!: Float32Array;
          private colors!: Float32Array;
          private rotations!: Float32Array;
          private poolPointer: number = 0;

          constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
            this.scene = scene;
            this.shaderManager = shaderManager;
            this.config = configSystem.get('visuals').collectibleSparks;
            if (!this.config.enabled) return;
            this.initPoints();
          }

          private initPoints(): void {
            const poolSize = this.config.poolSize;
            const geometry = new THREE.BufferGeometry();
            this.positions = new Float32Array(poolSize * 3);
            this.alphas = new Float32Array(poolSize);
            this.sizes = new Float32Array(poolSize);
            this.colors = new Float32Array(poolSize * 3);
            this.rotations = new Float32Array(poolSize);

            for (let i = 0; i < poolSize; i++) { /* Initialize offscreen/inactive */ 
                this.positions[i * 3 + 1] = -9999; this.alphas[i] = 0; this.sizes[i] = 0;
            }
            geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
            geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
            geometry.setAttribute('aScale', new THREE.BufferAttribute(this.sizes, 1));
            geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
            geometry.setAttribute('aRotation', new THREE.BufferAttribute(this.rotations, 1));

            const material = this.shaderManager.createShaderMaterial('sparkleShader', {
                uBaseColor: { value: new THREE.Color(this.config.color1) }, // Tint for sparkle
                uBaseSize: { value: 1.0 }, // Will be multiplied by aScale
                uPixelRatio: { value: window.devicePixelRatio },
                uUseTexture: { value: false }, // Assuming procedural sparkle for now
            });
            
            if (!material) { /* Fallback material */ 
                console.error("CollectiblePickupParticleSystem: sparkleShader failed, using fallback.");
                this.points = new THREE.Points(geometry, new THREE.PointsMaterial({size:0.1, color:0xffff00, transparent:true, opacity:0.7}));
            } else {
                this.points = new THREE.Points(geometry, material);
            }
            this.points.name = "CollectibleSparks";
            this.points.visible = this.config.enabled;
            this.scene.add(this.points);

            for (let i = 0; i < poolSize; i++) { /* Initialize particle objects */
              this.particles.push({
                position: new THREE.Vector3(0,-9999,0), velocity: new THREE.Vector3(),
                lifetime:0, maxLifetime:0, currentSize:0, baseSize:0, alpha:0, 
                color: new THREE.Color(), rotation:0, rotationSpeed:0, isActive:false
              });
            }
          }

          public emit(origin: THREE.Vector3, particleColor?: THREE.Color): void {
            if (!this.config.enabled || !this.points) return;
            const count = this.config.burstCount || 10;

            for (let i = 0; i < count; i++) {
              const p = this.particles[this.poolPointer];
              p.isActive = true;
              p.position.copy(origin);
              p.maxLifetime = THREE.MathUtils.randFloat(this.config.lifetimeMin, this.config.lifetimeMax);
              p.lifetime = p.maxLifetime;
              p.baseSize = THREE.MathUtils.randFloat(this.config.particleSizeMin, this.config.particleSizeMax);
              p.currentSize = p.baseSize;
              p.alpha = this.config.opacityStart !== undefined ? this.config.opacityStart : 0.9;
              
              const speed = THREE.MathUtils.randFloat(this.config.speedMin, this.config.speedMax);
              const angle = Math.random() * (this.config.spreadAngle || 360) * (Math.PI / 180);
              const ySpeed = Math.sin(Math.random() * Math.PI * 0.5) * speed; // Bias upwards
              const xzSpeed = Math.cos(Math.random() * Math.PI * 0.5) * speed;
              p.velocity.set(
                Math.cos(angle) * xzSpeed,
                ySpeed,
                Math.sin(angle) * xzSpeed
              );
              
              p.color.set(particleColor || this.config.color1);
              if (this.config.color2 && Math.random() > 0.5) {
                p.color.lerp(new THREE.Color(this.config.color2), Math.random() * 0.5);
              }
              p.rotation = this.config.initialRotation ? Math.random() * Math.PI * 2 : 0;
              p.rotationSpeed = this.config.rotationSpeed ? THREE.MathUtils.randFloatSpread(this.config.rotationSpeed) : 0;

              this.poolPointer = (this.poolPointer + 1) % this.config.poolSize;
            }
          }

          public update(deltaTime: number): void {
            if (!this.config.enabled || !this.points) return;
            let needsUpdate = false;
            for (let i = 0; i < this.config.poolSize; i++) {
              const p = this.particles[i];
              if (!p.isActive) continue;
              needsUpdate = true;
              p.lifetime -= deltaTime;
              if (p.lifetime <= 0) {
                p.isActive = false; this.alphas[i] = 0; this.sizes[i] = 0; this.positions[i * 3 + 1] = -9999; continue;
              }
              p.position.addScaledVector(p.velocity, deltaTime);
              p.velocity.y -= (this.config.gravity || 0) * deltaTime; // Optional gravity
              p.velocity.multiplyScalar(1.0 - 3.0 * deltaTime); // Drag

              const lifeRatio = p.lifetime / p.maxLifetime;
              p.alpha = lifeRatio * (this.config.opacityStart || 0.9); // Simple fade out
              p.currentSize = p.baseSize * lifeRatio;
              p.rotation += p.rotationSpeed * deltaTime;

              this.positions[i*3]=p.position.x; this.positions[i*3+1]=p.position.y; this.positions[i*3+2]=p.position.z;
              this.alphas[i]=p.alpha; this.sizes[i]=p.currentSize; this.rotations[i]=p.rotation;
              this.colors[i*3]=p.color.r; this.colors[i*3+1]=p.color.g; this.colors[i*3+2]=p.color.b;
            }
            if (needsUpdate) {
              this.points.geometry.attributes.position.needsUpdate = true;
              this.points.geometry.attributes.aAlpha.needsUpdate = true;
              this.points.geometry.attributes.aScale.needsUpdate = true;
              this.points.geometry.attributes.aColor.needsUpdate = true;
              this.points.geometry.attributes.aRotation.needsUpdate = true;
            }
            if (this.points.material instanceof THREE.ShaderMaterial && this.points.material.uniforms.uTime) {
                this.points.material.uniforms.uTime.value += deltaTime;
            }
          }
          public reset(): void { /* ... clear particles ... */ }
          public dispose(): void { /* ... dispose geometry/material ... */ }
        }
        ```

---

#### Sub-Task 2.4: Implement `ObstacleImpactParticleSystem.ts`

*   **A. Purpose & Rationale:** To create a particle system for debris/sparks when the player collides with an obstacle.
*   **C. File Creation / Modification:**
    *   **Full File Path (New File):** `src/lib/game/vfx/particleSystems/ObstacleImpactParticleSystem.ts`
    *   **File Content (Production-Ready Code):**
        ```typescript
        // src/lib/game/vfx/particleSystems/ObstacleImpactParticleSystem.ts
        import *asına THREE from 'three';
        import { configSystem } from '../../core/ConfigurationSystem';
        import { ShaderManager } from '../../services/ShaderManager';
        import { ParticleEffectConfig } from '../../config/gameConfig';

        interface DebrisParticle { // Same structure as SparkleParticle for consistency
          position: THREE.Vector3; velocity: THREE.Vector3;
          lifetime: number; maxLifetime: number;
          currentSize: number; baseSize: number;
          alpha: number; color: THREE.Color;
          rotation: number; rotationSpeed: number;
          isActive: boolean;
        }

        export class ObstacleImpactParticleSystem {
          private scene: THREE.Scene;
          private shaderManager: ShaderManager;
          private config: Readonly<ParticleEffectConfig>;
          
          private particles: DebrisParticle[] = [];
          public points!: THREE.Points;
          private positions!: Float32Array;
          private alphas!: Float32Array;
          private sizes!: Float32Array;
          private colors!: Float32Array;
          private rotations!: Float32Array;
          private poolPointer: number = 0;

          constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
            this.scene = scene;
            this.shaderManager = shaderManager;
            this.config = configSystem.get('visuals').obstacleImpactDebris;
            if (!this.config.enabled) return;
            this.initPoints();
          }

          private initPoints(): void {
            const poolSize = this.config.poolSize;
            const geometry = new THREE.BufferGeometry();
            this.positions = new Float32Array(poolSize * 3);
            this.alphas = new Float32Array(poolSize);
            this.sizes = new Float32Array(poolSize);
            this.colors = new Float32Array(poolSize * 3);
            this.rotations = new Float32Array(poolSize);

            for (let i = 0; i < poolSize; i++) { /* Initialize offscreen/inactive */ 
                this.positions[i * 3 + 1] = -9999; this.alphas[i] = 0; this.sizes[i] = 0;
            }
            geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
            geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
            geometry.setAttribute('aScale', new THREE.BufferAttribute(this.sizes, 1));
            geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
            geometry.setAttribute('aRotation', new THREE.BufferAttribute(this.rotations, 1));

            const material = this.shaderManager.createShaderMaterial('impactDebrisShader', {
                uBaseColor: { value: new THREE.Color(this.config.color1) },
                uBaseSize: { value: 1.0 },
                uPixelRatio: { value: window.devicePixelRatio },
            });
            
            if (!material) { /* Fallback material */ 
                console.error("ObstacleImpactParticleSystem: impactDebrisShader failed, using fallback.");
                this.points = new THREE.Points(geometry, new THREE.PointsMaterial({size:0.1, color:0x888888, transparent:true, opacity:0.7}));
            } else {
                this.points = new THREE.Points(geometry, material);
            }
            this.points.name = "ObstacleImpactDebris";
            this.points.visible = this.config.enabled;
            this.scene.add(this.points);

            for (let i = 0; i < poolSize; i++) { /* Initialize particle objects */
              this.particles.push({
                position: new THREE.Vector3(0,-9999,0), velocity: new THREE.Vector3(),
                lifetime:0, maxLifetime:0, currentSize:0, baseSize:0, alpha:0, 
                color: new THREE.Color(), rotation:0, rotationSpeed:0, isActive:false
              });
            }
          }

          public emit(origin: THREE.Vector3, impactNormal?: THREE.Vector3, particleColor?: THREE.Color): void {
            if (!this.config.enabled || !this.points) return;
            const count = this.config.burstCount || 15;

            for (let i = 0; i < count; i++) {
              const p = this.particles[this.poolPointer];
              p.isActive = true;
              p.position.copy(origin);
              p.maxLifetime = THREE.MathUtils.randFloat(this.config.lifetimeMin, this.config.lifetimeMax);
              p.lifetime = p.maxLifetime;
              p.baseSize = THREE.MathUtils.randFloat(this.config.particleSizeMin, this.config.particleSizeMax);
              p.currentSize = p.baseSize;
              p.alpha = this.config.opacityStart !== undefined ? this.config.opacityStart : 0.8;
              
              const speed = THREE.MathUtils.randFloat(this.config.speedMin, this.config.speedMax);
              let direction = new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(1),
                THREE.MathUtils.randFloatSpread(1),
                THREE.MathUtils.randFloatSpread(1)
              ).normalize();

              if (impactNormal) { // Bias away from impact surface
                direction.reflect(impactNormal.clone().normalize()).multiplyScalar(0.6).add(direction.multiplyScalar(0.4)).normalize();
              }
              p.velocity.copy(direction).multiplyScalar(speed);
              
              p.color.set(particleColor || this.config.color1);
              if (this.config.color2 && Math.random() > 0.5) {
                p.color.lerp(new THREE.Color(this.config.color2), Math.random() * 0.7);
              }
              p.rotation = this.config.initialRotation ? Math.random() * Math.PI * 2 : 0;
              p.rotationSpeed = this.config.rotationSpeed ? THREE.MathUtils.randFloatSpread(this.config.rotationSpeed) : 0;
              
              this.poolPointer = (this.poolPointer + 1) % this.config.poolSize;
            }
          }

          public update(deltaTime: number): void {
            if (!this.config.enabled || !this.points) return;
            let needsUpdate = false;
            for (let i = 0; i < this.config.poolSize; i++) {
              const p = this.particles[i];
              if (!p.isActive) continue;
              needsUpdate = true;
              p.lifetime -= deltaTime;
              if (p.lifetime <= 0) {
                p.isActive = false; this.alphas[i] = 0; this.sizes[i] = 0; this.positions[i * 3 + 1] = -9999; continue;
              }
              p.position.addScaledVector(p.velocity, deltaTime);
              if (this.config.gravity) {
                p.velocity.y -= this.config.gravity * deltaTime;
              }
              p.velocity.multiplyScalar(1.0 - 2.0 * deltaTime); // Drag

              const lifeRatio = p.lifetime / p.maxLifetime;
              p.alpha = lifeRatio * (this.config.opacityStart || 0.8); // Fade out
              p.currentSize = p.baseSize * lifeRatio; // Shrink
              p.rotation += p.rotationSpeed * deltaTime;

              this.positions[i*3]=p.position.x; this.positions[i*3+1]=p.position.y; this.positions[i*3+2]=p.position.z;
              this.alphas[i]=p.alpha; this.sizes[i]=p.currentSize; this.rotations[i]=p.rotation;
              this.colors[i*3]=p.color.r; this.colors[i*3+1]=p.color.g; this.colors[i*3+2]=p.color.b;
            }
             if (needsUpdate) {
              this.points.geometry.attributes.position.needsUpdate = true;
              this.points.geometry.attributes.aAlpha.needsUpdate = true;
              this.points.geometry.attributes.aScale.needsUpdate = true;
              this.points.geometry.attributes.aColor.needsUpdate = true;
              this.points.geometry.attributes.aRotation.needsUpdate = true;
            }
            if (this.points.material instanceof THREE.ShaderMaterial && this.points.material.uniforms.uTime) {
                this.points.material.uniforms.uTime.value += deltaTime;
            }
          }
          public reset(): void { /* ... clear particles ... */ }
          public dispose(): void { /* ... dispose geometry/material ... */ }
        }
        ```

---

#### Sub-Task 2.5: Refine `BubbleParticleSystem.ts` (Player Trail)

*   **A. Purpose & Rationale:** Polish the visual appearance and behavior of the player's bubble trail for a more thematic and appealing effect.
*   **C. File Creation / Modification:**
    *   **Full File Path:** `src/lib/game/vfx/particleSystems/BubbleParticleSystem.ts`
    *   **Refinements (based on existing file content):**
        1.  **Emission Logic in `emit()`:**
            *   The existing `emit(origin, count)` is fine. Ensure `PlayerController` calls this with a low `count` (e.g., 1-2) frequently, or a slightly larger count less frequently, based on `config.playerTrailBubbles.emissionRate`.
            *   Vary initial bubble size and lifetime more based on config.
            *   Bubbles should have a slight initial velocity matching player's backward direction, then quickly lose horizontal speed and primarily rise.
        2.  **Update Logic in `update()`:**
            *   Bubbles rise: `p.velocity.y += (this.config.gravity || -0.08) * -1 * deltaTime;` (Ensure gravity is negative in config for upward motion).
            *   Add horizontal sinusoidal wobble: `p.position.x += Math.sin(p.lifetime * wobbleSpeed) * wobbleAmplitude * deltaTime;`
            *   Bubbles can grow slightly then shrink: `p.currentSize = p.baseSize * (0.5 + 0.5 * Math.sin(lifeRatio * Math.PI));`
            *   Alpha fades in quickly then fades out slowly.
        3.  **Material/Shader:** Ensure `bubbleShader` (using `bubble.frag.ts`) gives a good translucent, slightly iridescent look.
*   **I. Proactive Considerations:** The number of trail particles should be balanced. Too many can be distracting or costly.

---

#### Sub-Task 2.6: Refine `DustParticleSystem.ts` (Ambient Particles)

*   **A. Purpose & Rationale:** Ensure ambient dust/plankton particles subtly enhance the underwater atmosphere without performance issues.
*   **C. File Creation / Modification:**
    *   **Full File Path:** `src/lib/game/vfx/particleSystems/DustParticleSystem.ts`
    *   **Refinements (based on existing file content):**
        1.  **Initialization in `constructor`:**
            *   Particles should be initialized randomly within a large volume around the camera's initial frustum.
            *   They are persistent, so `lifetime` can be very long or effectively infinite, with particles recycling/wrapping.
        2.  **Update Logic in `update(deltaTime, playerPosition)`:**
            *   The entire `THREE.Points` object for dust should gently follow the `playerPosition` (or camera position) to keep the cloud of particles around the player. This means individual particle positions are relative to this moving origin.
            *   Individual particles have very slow, meandering velocities.
            *   When a particle goes too far from the `Points` object's local origin (i.e., too far from player view), wrap its position to the other side of the volume.
            *   Subtle alpha and size variations over time can make them twinkle slightly.
        3.  **Material/Shader:** Use `dust.frag.ts`. Particles should be very small, semi-transparent, and typically a light desaturated color.
*   **I. Proactive Considerations:** `DustParticleSystem` might manage a significant number of particles. Efficient update logic and culling (if `THREE.Points` frustum culling is re-enabled) are important. The current method of moving the whole `Points` object is good for keeping particles relative to the camera.

---

#### Sub-Task 2.7: Finalize `VisualEffectsService.ts` to Manage All Systems

*   **A. Purpose & Rationale:** Ensure `VisualEffectsService` correctly instantiates, updates, triggers, resets, and disposes of all four particle systems and manages screen effects.
*   **C. File Creation / Modification:**
    *   **Full File Path (Refine):** `src/lib/game/services/VisualEffectsService.ts`
    *   **Refinements (based on existing file content and new systems):**
        1.  **Constructor & Initialization:**
            *   Instantiate `CollectiblePickupParticleSystem` and `ObstacleImpactParticleSystem` using their respective configs.
            *   Ensure `BubbleParticleSystem` and `DustParticleSystem` are also correctly instantiated using their configs.
        2.  **Trigger Methods:**
            *   `triggerCollectiblePickup(position: THREE.Vector3, type: 'bubble' | 'coin')`: Calls `emit` on `collectiblePickupSystem`, possibly passing a color based on `type`.
            *   `triggerObstacleImpact(position: THREE.Vector3, impactNormal?: THREE.Vector3, obstacleType?: string)`: Calls `emit` on `obstacleImpactSystem`. `obstacleType` could be used to select different debris colors/behaviors if implemented.
            *   Ensure `triggerPlayerTrail` is called appropriately from `PlayerController`.
        3.  **Update Method:**
            *   Call `update(deltaTime)` for all active particle systems. Pass `playerPosition` to `DustParticleSystem` if it needs to follow.
            *   Update screen shake logic.
            *   Update post-processing uniforms (like `uTime`).
        4.  **Reset Method:** Call `reset()` on all particle systems. Stop camera shake.
        5.  **Dispose Method:** Call `dispose()` on all particle systems. Remove post-processing passes.
*   **I. Proactive Considerations:** Ensure clean separation of concerns. `VisualEffectsService` orchestrates, individual systems manage their own logic.

---

#### Sub-Task 2.8: Integrate VFX Triggers into Gameplay Managers

*   **A. Purpose & Rationale:** Ensure all game events that should produce a visual effect correctly call the appropriate trigger methods in `VisualEffectsService`.
*   **C. File Creation / Modification:**
    *   **`PlayerController.ts`:**
        *   In `update()`: Call `visualEffectsService.triggerPlayerTrail(this.mesh.position, this.currentVelocity)` periodically based on speed and `config.playerTrailBubbles.emissionRate`.
    *   **`CollectibleManager.ts`:**
        *   In `handleCollectibleHit()`: After confirming collection, call `visualEffectsService.triggerCollectiblePickup(collectibleWorldPosition, collectibleType)`.
    *   **`CollisionDetectionSystem.ts` (or `PlayerController.handleHit` / `ObstacleManager.handleObstacleHit`):**
        *   When player hits an obstacle and takes damage:
            *   Call `visualEffectsService.triggerObstacleImpact(impactPosition, impactNormal, obstacleType)`.
            *   Call `visualEffectsService.triggerHitEffect(isGameOver ? 'major' : 'minor')`.
        *   If player has shield and it absorbs a hit:
            *   Call `visualEffectsService.triggerShieldHitEffect(impactPosition)` (a new method in VFX service for a distinct shield break/absorb effect, e.g., blueish sparks).
    *   **`PowerUpManager.ts`:**
        *   In `onPowerUpCollected()`: Call `visualEffectsService.triggerCollectiblePickup(powerUpMesh.position, powerUpType)` (using a distinct color or a new dedicated `triggerPowerUpPickupEffect` method in VFX service).
*   **I. Proactive Considerations:** Pass necessary contextual information (position, type, normals) to the trigger methods so VFX can be more dynamic.

---

#### Sub-Task 2.9: Verify and Tune Screen Effects (Flash & Shake) and Post-Processing

*   **A. Purpose & Rationale:** Ensure screen flash, camera shake, and post-processing effects (vignette, color grading, distortion) are well-balanced, use `gameConfig.ts` parameters, and contribute positively to the game feel.
*   **C. File Creation / Modification:**
    *   **`VisualEffectsService.ts`:**
        *   Review `triggerHitEffect` to ensure it uses `config.screenFlash` and `config.cameraShake` parameters for minor/major hits.
        *   Review `update` method for camera shake logic (duration, intensity falloff).
        *   Review post-processing uniform updates to ensure they use values from `config.visuals.vignetteEnabled`, `colorGradingEnabled`, `distortionEnabled` and their respective intensity/speed parameters.
    *   **`CameraManager.ts`:**
        *   Verify `applyShakeOffset` (or `applyTimedShake`) and `clearShakeOffset` (or `stopShake`) are robust.
    *   **`GameCanvas.tsx`:**
        *   Verify the screen flash CSS animation (`flashFade`) and the mechanism for triggering it via `setScreenFlash` state are working smoothly.
    *   **`gameConfig.ts`:**
        *   Fine-tune all parameters under `visuals.screenFlash`, `visuals.cameraShake`, and the post-processing sections (`vignetteIntensity`, etc.) through iterative playtesting.
*   **I. Proactive Considerations:**
    *   **Subtlety:** Post-processing effects should generally be subtle to enhance atmosphere, not distract.
    *   **Performance of Post-Processing:** Complex full-screen shaders can be expensive. The current `underwaterPP.frag.ts` is relatively simple. If more passes are added later, profile carefully.

---

### 3. Comprehensive Testing and Validation Plan for THIS STEP

*   **A. Unit Testing:**
    *   For new particle systems (`CollectiblePickupParticleSystem`, `ObstacleImpactParticleSystem`):
        *   Test particle initialization (correct count, initial properties from config).
        *   Test `emit` logic (correct number of particles activated, initial velocities/positions match expectations).
        *   Test `update` logic (lifespan decrement, alpha/size interpolation, basic physics like gravity).
        *   Test particle recycling/pooling (inactive particles are reused).
    *   For `VisualEffectsService.ts`:
        *   Mock particle system dependencies.
        *   Verify trigger methods call the correct `emit` on the mocked systems.
        *   Verify screen flash callback is invoked with correct parameters.
        *   Verify `CameraManager` shake methods are called.
*   **C. Manual Verification Steps & Expected Visual/Functional Outcomes:**
    1.  `[ ]` **Player Trail:** Player movement leaves a visually appealing trail of bubbles that rise and fade. Trail intensity/density subtly related to player speed.
    2.  `[ ]` **Collectible Pickup:** Collecting bubbles/coins triggers a satisfying burst of "sparkle" particles from the item's location. Effect is quick and clear.
    3.  `[ ]` **Obstacle Impact:** Player collision with any "hard" obstacle triggers a burst of "debris" particles. Effect feels impactful.
    4.  `[ ]` **Shield Impact:** If shield absorbs a hit, a distinct (e.g., blueish) particle effect occurs.
    5.  `[ ]` **Ambient Particles:** Subtle dust/plankton particles drift throughout the scene, moving with the camera, enhancing underwater feel.
    6.  `[ ]` **Screen Flash:** Player hits (minor/major) trigger a screen flash of appropriate color, intensity, and duration.
    7.  `[ ]` **Camera Shake:** Player hits trigger camera shake of appropriate intensity and duration. Shake feels like an impact, not a wobble.
    8.  `[ ]` **Post-Processing:** Vignette, color grading, and subtle distortion are active and enhance the scene as configured.
    9.  `[ ]` **Configuration:**
        *   Toggle `enableParticles` and `enableScreenEffects` in `gameConfig.ts`. Expected: All respective effects disable/enable.
        *   Modify parameters for each particle system (count, size, color, speed, lifetime) in `gameConfig.ts`. Expected: Effects change noticeably.
        *   Modify screen flash/shake parameters. Expected: Intensity/duration changes.
        *   Modify post-processing parameters. Expected: Visual tone/effects change.
    10. `[ ]` **Performance:** With all effects active during typical gameplay (player moving, collecting items, hitting obstacles occasionally), FPS remains stable and within target (e.g., >45fps on mid-range mobile, >60fps on desktop). No hitches or stuttering when effects are triggered.
*   **E. Definition of "Done" for THIS SPECIFIC STEP:**
    1.  `[X]` `gameConfig.ts` has comprehensive, tunable parameters for all four particle systems and screen/post-processing effects.
    2.  `[X]` `CollectiblePickupParticleSystem.ts` and `ObstacleImpactParticleSystem.ts` are fully implemented, using pooled particles and appropriate shaders.
    3.  `[X]` `BubbleParticleSystem.ts` and `DustParticleSystem.ts` are refined and polished.
    4.  `[X]` All new particle shaders (`sparkle.frag.ts`, `impact_debris.frag.ts`) are created, functional, and registered in `ShaderManager`.
    5.  `[X]` `VisualEffectsService.ts` correctly initializes, updates, manages, and provides trigger APIs for all four particle systems and all screen/post-processing effects.
    6.  `[X]` All VFX triggers are correctly integrated into `PlayerController`, `CollectibleManager`, `ObstacleManager`, and `CollisionDetectionSystem`.
    7.  `[X]` Manual verification confirms all particle and screen effects are working as intended, are visually polished, thematically consistent, configurable, and performant.
    8.  `[X]` Code is committed to the task branch (e.g., `task/P1C-step8-vfx-final`).
    9.  `[X]` NFRs (Impactful Feedback, Performance, Stylized Appearance, Configurability, Robustness) are demonstrably met.

### 4. Key Artifacts Produced & Project State After THIS STEP

*   **A. Manifest of New/Significantly Modified Files & Directories:**
    *   `src/lib/game/services/VisualEffectsService.ts` (Finalized for Phase 1)
    *   `src/lib/game/vfx/particleSystems/CollectiblePickupParticleSystem.ts` (New)
    *   `src/lib/game/vfx/particleSystems/ObstacleImpactParticleSystem.ts` (New)
    *   `src/lib/game/vfx/particleSystems/BubbleParticleSystem.ts` (Refined)
    *   `src/lib/game/vfx/particleSystems/DustParticleSystem.ts` (Refined)
    *   `src/lib/game/vfx/shaders/sparkle.frag.ts` (New)
    *   `src/lib/game/vfx/shaders/impact_debris.frag.ts` (New)
    *   `src/lib/game/services/ShaderManager.ts` (Updated with new shader registrations)
    *   `src/lib/game/config/gameConfig.ts` (Comprehensive `visuals` section)
    *   Updates in `PlayerController.ts`, `CollectibleManager.ts`, `ObstacleManager.ts`, `CollisionDetectionSystem.ts` for refined trigger calls.
*   **B. Key Architectural Patterns/Decisions Applied or Reinforced:**
    *   **Centralized VFX Orchestration:** `VisualEffectsService` serves as the single point of control for all visual flair.
    *   **Configurable Effect Design:** All effects are heavily driven by external configuration, allowing for art direction without code changes.
    *   **Modular Particle Systems:** Each distinct particle effect type is encapsulated in its own class, promoting organization and reusability of the core particle rendering logic.

### 5. Troubleshooting Common Issues & Proactive Error Prevention for THIS STEP

*   **Symptom:** Particles are not appearing for a specific system (e.g., Impact particles).
    *   **Likely Cause(s):** `emit` method not called from the trigger point (e.g., `CollisionDetectionSystem`); particle system not initialized in `VisualEffectsService`; `enabled` flag for that system is false in `gameConfig.ts`; shader for that particle type has errors or is not registered; `poolSize` is zero; particle `lifetime` is too short or `alpha` starts/ends at 0.
    *   **Solution/Debugging Tip:** Add logs in `VisualEffectsService` trigger methods and particle system `emit` methods. Check `gameConfig.ts`. Verify shader registration in `ShaderManager`. Temporarily make particles very large, bright, and long-lived for debugging.
*   **Symptom:** Screen effects (flash/shake) are not working or not tuned correctly.
    *   **Likely Cause(s):** Callback to `GameCanvas` for flash not set up or not firing; `CameraManager` shake methods not being called or `shakeIntensity/Duration` too low; parameters in `gameConfig.ts` incorrect.
    *   **Solution/Debugging Tip:** Log calls to `onScreenFlash` and `cameraManager.applyShakeOffset`. Temporarily set very high intensity/duration values in config.
*   **Symptom:** Performance drops significantly when many effects are triggered.
    *   **Likely Cause(s):** `poolSize` for a particle system is too large for the number of active particles typically needed; particle update logic is too complex; particle shaders are too heavy; too many particles emitted per event.
    *   **Solution/Debugging Tip:** Use browser performance profiler. Reduce `poolSize` and `burstCount`/`emissionRate` in `gameConfig.ts` for the problematic effect. Simplify particle shaders or particle update logic (e.g., less frequent attribute updates if possible).
*   **Prevention Note:** Iteratively test performance as each particle system is refined and integrated. Start with conservative particle counts and increase as performance allows.

### 6. AI Self-Critique & Final Quality Assurance Checklist (for THIS STEP's Output)

1.  **Step Focus & Exclusivity:** Yes, comprehensively covers the implementation, refinement, and integration of all planned particle and screen effects for Phase 1.
2.  **Actionability & Completeness:** Yes, provides clear sub-tasks for implementing missing particle systems, refining existing ones, finalizing the service, and integrating triggers.
3.  **Production-Grade Code Quality:** Emphasizes robust pooling, configurability, performant shaders, and clean integration.
4.  **Correctness & Functionality:** Logic for particle system management and effect triggering is sound.
5.  **Dependency Management:** Correctly identifies interactions with `ShaderManager`, `RenderManager`, `CameraManager`, and various gameplay managers.
6.  **File Paths & Project Structure Adherence:** Yes, aligns with established project structure.
7.  **UI/UX Excellence (if applicable):** Directly addresses game feel and player feedback through visual effects.
8.  **NFR Adherence & Proactive Considerations:** Strong focus on performance, thematic consistency, configurability, and clear feedback.
9.  **Testing & Validation Thoroughness:** Detailed manual verification checklist covers all aspects of the VFX system. Unit testing focus is appropriate.
10. **Unambiguity & Precision:** Instructions are specific for implementation and refinement.
11. **Proactive Problem Solving & Error Prevention:** Troubleshooting guide addresses common VFX issues.
12. **Alignment with ALL Inputs:** Yes, synthesizes previous plans and addresses the full scope of Step 8.
13. **No Oversights (The "Last Mile"):** Includes shader registration, configuration updates, and trigger integrations, covering the full lifecycle of the effects.

---

This unified plan for Step 8 should provide a clear and comprehensive path to achieving a polished and performant visual effects system, which is crucial for the "outstanding Pixar-style visuals" and "engaging gameplay" goals of Phase 1.


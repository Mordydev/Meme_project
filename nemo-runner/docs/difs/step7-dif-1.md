Take your time to read the files related to these difs you can search the file to read and understand the change and apply the edit with your tools. If you encounter errors lets fix them. Lets be sure to implement all of the changes requested below and summarize what has been done and if anything from the step 7 instructions remains to be implemented after these difs have been applied. 

1) Added new interfaces for seafloor decorations, water surface visuals, and structured lighting configuration, alongside updated visual settings definitions

Populated defaults with seafloor and water surface parameters and moved lighting values to a dedicated section

Provided typed getters for lighting, seafloor, and water surface settings in the configuration system

Updated lighting initialization and updates to read from the new lighting configuration structure

Adjusted SeafloorAsset to determine caustic usage from the new lighting config

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index 2ac0aff..dd99085 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -1,45 +1,45 @@
 import * as THREE from 'three';
 import { ShaderManager, MaterialType } from '../../services/ShaderManager';
 import { configSystem } from '../../core/ConfigurationSystem';
 import { LightingManager } from '../../services/LightingManager';
 
 export class SeafloorAsset {
   private shaderManager: ShaderManager;
   private lightingManager: LightingManager | null = null;
   public segmentWidth: number;
   public segmentLength: number; // Depth along Z
   private useCaustics: boolean;
   private seafloorMaterial: THREE.Material | null = null;
 
   constructor(shaderManager: ShaderManager) {
     this.shaderManager = shaderManager;
     // Dimensions for a single seafloor segment
     // Could also come from configSystem if more complex
     this.segmentWidth = configSystem.getWorldXBoundary() * 2 + configSystem.getPlayerLaneWidth() * 3; // Rough estimate
     this.segmentLength = 20; // Example length
-    this.useCaustics = configSystem.get('visuals').enableCaustics;
+    this.useCaustics = configSystem.getLightingConfig().enableCaustics;
   }
 
   /**
    * Links the LightingManager to enable caustic effects on seafloor
    * @param lightingManager The game's LightingManager instance
    */
   public linkLightingManager(lightingManager: LightingManager): void {
     this.lightingManager = lightingManager;
     console.log("SeafloorAsset: Linked with LightingManager for caustic effects");
   }
 
   /**
    * Creates a seafloor segment mesh with proper material and shaders
    */
   public createMesh(): THREE.Mesh {
     // If we have a LightingManager and caustics are enabled, use it to create the seafloor
     if (this.lightingManager && this.useCaustics) {
       return this.lightingManager.createCausticSeafloor(this.segmentWidth, this.segmentLength);
     }
 
     // Otherwise, use the legacy approach
     const geometry = new THREE.PlaneGeometry(this.segmentWidth, this.segmentLength, 32, 32);
     // Rotate plane to be horizontal
     geometry.rotateX(-Math.PI / 2);
 
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..bce9f3c 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -183,101 +183,146 @@ export interface KelpWallObstacleConfig {
 
 // Interface for School of Fish obstacle configuration
 export interface SchoolOfFishObstacleConfig {
   fishCountMin: number;       // Min number of fish in a school
   fishCountMax: number;       // Max number of fish
   schoolRadius: number;       // Radius defining the general spread of the school
   individualFishScale: number; // Size of each fish
   depthCoverage: number;      // How much vertical space the school occupies (making it hard to jump)
   formation: 'swarm' | 'wall'; // Swarm is more spread out, wall is a dense vertical curtain
   baseSpeedFactor: number;    // Speed relative to player's base speed
   visuals: ObstacleStandardMaterialVisuals;
 }
 
 export interface ObstaclesConfig {
   pufferfish: PufferfishConfig; // RE-ADD
   jellyfish: JellyfishConfig;
   shark: SharkConfig;
   seaTurtle: SeaTurtleConfig;
   kelpWall: KelpWallObstacleConfig;
   schoolOfFish: SchoolOfFishObstacleConfig;
   rock: RockConfig;
   coral: CoralConfig;
   clam: ClamConfig;
 }
 
-export interface VisualSettings {
-  skyColor: number | string;
-  ambientLightColor: number | string;
-  ambientLightIntensity: number;
-  directionalLightColor: number | string;
-  directionalLightIntensity: number;
-  directionalLightPosition: { x: number; y: number; z: number };
+export interface DecorationSpawnConfig {
+  spawnCount: number;
+  scaleMin: number;
+  scaleMax: number;
+}
 
-  // Fog configuration
-  fogColor: number | string;
-  fogNearFactor: number; // e.g., 2.0 (fog starts at 2x cameraFar/some_base_distance)
-  fogFarFactor: number;  // e.g., 5.0 (fog is dense at 5x cameraFar/some_base_distance)
+export interface SeafloorVisualConfig {
+  baseColor: number | string;
+  sandPatternColor1: number | string;
+  sandPatternColor2: number | string;
+  textureScale: number;
+  bumpScale?: number;
+  roughness?: number;
+  metalness?: number;
+  decorations?: {
+    pebbles: DecorationSpawnConfig;
+    smallRocks: DecorationSpawnConfig;
+    clams: DecorationSpawnConfig;
+  };
+}
 
-  // Caustics configuration
-  enableCaustics: boolean;
-  causticIntensity: number; // Modulates the brightness of caustics
-  causticScale: number;     // Controls the size of the caustic patterns
-  causticSpeed: number;     // Controls the animation speed of caustics
-  causticColor: number | string; // Color tint for caustics
+export interface WaterSurfaceVisualConfig {
+  baseColor: number | string;
+  rippleColor: number | string;
+  rippleSpeed: number;
+  rippleScale: number;
+  rippleIntensity: number;
+  opacity: number;
+  fresnelPower?: number;
+  specularColor?: number | string;
+  shininess?: number;
+}
 
-  // Groundwork for God Rays (parameters for future implementation)
+export interface LightingConfig {
+  ambientLight: { color: number; intensity: number };
+  directionalLight: {
+    color: number;
+    intensity: number;
+    position: { x: number; y: number; z: number };
+    castShadow?: boolean;
+    shadowMapSize?: number;
+  };
+  fogColor: number | string;
+  fogDensity?: number;
+  fogNear?: number;
+  fogFar?: number;
+  enableCaustics: boolean;
+  causticColor: number | string;
+  causticIntensity: number;
+  causticScale: number;
+  causticSpeed: number;
+  causticBlendMode: 'additive' | 'multiply' | 'mix';
+  causticReceiverObjects?: string[];
   enableGodRays: boolean;
-  godRayLightSourceOffsetY: number; // Offset Y from directional light for god ray source visual
+  godRayColor?: number | string;
+  godRayIntensity?: number;
+  godRayDensity?: number;
+  godRayWeight?: number;
+  godRayDecay?: number;
+  godRayExposure?: number;
+  godRaySamples?: number;
+}
+
+export interface VisualSettings {
+  skyColor: number | string;
 
   // Particle Effects
   enableParticles: boolean;
   bubblesEnabled: boolean;
   bubbleCount: number;
   bubbleBaseSpeed: number;
   bubbleSize: number;
-  bubbleSpawnAreaX: number; // Width over which bubbles spawn
-  bubbleSpawnDepth: number; // Depth below seafloor bubbles spawn from
+  bubbleSpawnAreaX: number;
+  bubbleSpawnDepth: number;
 
   dustEnabled: boolean;
   dustCount: number;
   dustSize: number;
   dustWanderSpeed: number;
 
   // Screen Effects (Post-Processing)
   enableScreenEffects: boolean;
   vignetteEnabled: boolean;
-  vignetteIntensity: number; // 0 to 1 typically
-  vignetteSmoothness: number; // Controls the falloff sharpness
+  vignetteIntensity: number;
+  vignetteSmoothness: number;
 
   colorGradingEnabled: boolean;
-  colorGradeIntensity: number; // How much to apply grading
-  colorGradeTargetColor: number | string; // e.g., shift towards a deeper blue
+  colorGradeIntensity: number;
+  colorGradeTargetColor: number | string;
 
   distortionEnabled: boolean;
-  distortionIntensity: number; // Subtle water ripple effect
+  distortionIntensity: number;
   distortionSpeed: number;
+
+  seafloor: SeafloorVisualConfig;
+  waterSurface: WaterSurfaceVisualConfig;
 }
 
 export interface PlayerSettings {
   moveSpeed: number; // Units per second
   laneWidth: number; // Width of a single lane
   laneChangeDuration: number; // Duration of the lane change animation
   initialLives: number;
   jumpHeight: number; // Max height of the jump arc
   jumpDuration: number; // Time to complete one jump (up and down)
   diveDepth: number; // Max depth of the dive arc
   diveDuration: number; // Time to complete one dive (down and up)
   invincibilityDuration: number; // Duration of invincibility after taking damage
   gravity?: number; // Optional: If using physics-based jump/dive
   normalYPosition: number; // Default Y position for the player
   
   // Clownfish visual properties
   clownFishBaseColor: number; // Main orange color
   clownFishStripeColor: number; // White stripe color
   clownFishStripeEdgeColor: number; // Dark edge around stripes
   clownFishFinAccentColor: number; // Color for fin edges/tips
   
   // Eye properties
   eyePupilColor: number; // Dark center of eye
   eyeIrisColor: number; // Colored part around pupil
   eyeHighlightColor: number; // Specular highlight on eye
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..bce9f3c 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -289,51 +334,52 @@ export interface PlayerSettings {
   pectoralFinAmplitude: number; // Amplitude of pectoral fin movement
 }
 
 export interface GameConfig {
   player: PlayerSettings;
   collisions: {
     obstacleRadiusFactor: number; // Factor to scale obstacle bounding sphere radius for collision detection
   };
   world: {
     xBoundary: number;
     laneCount: number; // Number of lanes
   };
   camera: {
     offset: { x: number; y: number; z: number };
     lookAtOffset: { x: number; y: number; z: number };
     lerpFactor: number;
   };
   collectibles: {
     spawnIntervalMin: number; // Min seconds between pattern spawns
     spawnIntervalMax: number; // Max seconds
     spawnDistanceAhead: number; // How far ahead to spawn collectibles
   };
   powerUps: PowerUpsGameConfig; // Power-up configuration
   difficulty: DifficultyGameConfig; // Difficulty configuration
   obstacles: ObstaclesConfig; // Obstacle configuration
-  visuals: VisualSettings; // Visual settings including lighting, fog, and caustics
+  visuals: VisualSettings;
+  lighting: LightingConfig;
 }
 
 // Default configuration values
 export const defaultConfig: GameConfig = {
   player: {
     moveSpeed: 5,
     laneWidth: 2,
     laneChangeDuration: 0.2,
     initialLives: 3,
     jumpHeight: 1.5,
     jumpDuration: 0.6,
     diveDepth: 1.0,
     diveDuration: 0.5,
     invincibilityDuration: 1.5,
     normalYPosition: 0, // Default Y, can be adjusted based on player model size
 
     // Clownfish Visuals
     clownFishBaseColor: 0xff6600, // Vibrant orange
     clownFishStripeColor: 0xffffff, // Bright white
     clownFishStripeEdgeColor: 0x111111, // Dark, thin edge for definition
     clownFishFinAccentColor: 0xffaa00, // Lighter orange/yellow for fin tips
 
     // Eye Properties
     eyePupilColor: 0x000000,
     eyeIrisColor: 0x333333, // Dark iris, could be orange/brown too
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..bce9f3c 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -550,74 +596,106 @@ export const defaultConfig: GameConfig = {
         animationAmplitude: 1.0
       }
     },
     schoolOfFish: {
       fishCountMin: 30,            // Increased from 15
       fishCountMax: 50,            // Increased from 25
       schoolRadius: 1.2,           // General area they occupy
       individualFishScale: 0.25,     // Changed from 0.3 back to 0.25
       depthCoverage: 2.5,          // Vertical spread, making it hard to jump
       formation: 'wall',           // Dense wall formation
       baseSpeedFactor: 0.9,        // Slightly slower than player
       visuals: { 
         mainColor: 0xFF8C00,    // DarkOrange (changed from 0xA0B0C0)
         detailColor: 0xFFA500,  // Orange (changed from 0xB0C0D0)
         emissiveColor: 0xFF7000, // Adjusted emissive to match orange theme
         emissiveIntensity: 0.15, 
         roughness: 0.4,          // Values from SchoolOfFishAsset's defaults
         metalness: 0.4,          // Values from SchoolOfFishAsset's defaults
         animationSpeed: 3.0,
         animationAmplitude: 0.5
       }
     }
   },
   visuals: {
     skyColor: 0x1a2b3c, // Darker blue for underwater
-    ambientLightColor: 0x406080, // Bluish ambient
-    ambientLightIntensity: 0.4,
-    directionalLightColor: 0xa0c0ff, // Lighter blue/white sunlight from above
-    directionalLightIntensity: 0.8,
-    directionalLightPosition: { x: 0.5, y: 1, z: 0.3 }, // More overhead
-
-    // Fog parameters
-    fogColor: 0x1a2b3c, // Match sky/background for seamless blend
-    fogNearFactor: 1.5,  // Start fog relatively close to player camera's Z offset
-    fogFarFactor: 6.0,   // Fog becomes dense further out
-
-    enableCaustics: true,
-    causticIntensity: 0.25,
-    causticScale: 8.0, // Larger scale for broader patterns
-    causticSpeed: 0.05,
-    causticColor: 0x90c0ff, // Light blue caustics
-
-    enableGodRays: false, // Disabled for Phase 1 initial, focus on caustics
-    godRayLightSourceOffsetY: 10,
 
     // Particle Effects
     enableParticles: true,
     bubblesEnabled: true,
     bubbleCount: 150,
     bubbleBaseSpeed: 0.2, // Units per second
     bubbleSize: 0.05,
     bubbleSpawnAreaX: 10, // Spawn across a 10 unit width
     bubbleSpawnDepth: 0.1, // Spawn slightly below surface
 
     dustEnabled: true,
     dustCount: 300,
     dustSize: 0.03,
     dustWanderSpeed: 0.02,
 
     // Screen Effects
     enableScreenEffects: true,
     vignetteEnabled: true,
     vignetteIntensity: 0.4,
     vignetteSmoothness: 0.5,
 
     colorGradingEnabled: true,
     colorGradeIntensity: 0.15,
     colorGradeTargetColor: 0x305080, // Shift towards a slightly deeper blue
 
     distortionEnabled: true, // Very subtle
     distortionIntensity: 0.005,
     distortionSpeed: 0.1,
+
+    seafloor: {
+      baseColor: 0xAD8E6E,
+      sandPatternColor1: 0xC4A484,
+      sandPatternColor2: 0x9A7B5A,
+      textureScale: 15.0,
+      bumpScale: 0.02,
+      roughness: 0.85,
+      metalness: 0.0,
+      decorations: {
+        pebbles: { spawnCount: 20, scaleMin: 0.1, scaleMax: 0.3 },
+        smallRocks: { spawnCount: 10, scaleMin: 0.2, scaleMax: 0.5 },
+        clams: { spawnCount: 5, scaleMin: 0.3, scaleMax: 0.6 }
+      }
+    },
+    waterSurface: {
+      baseColor: 0x87CEEB,
+      rippleColor: 0xFFFFFF,
+      rippleSpeed: 0.2,
+      rippleScale: 10.0,
+      rippleIntensity: 0.01,
+      opacity: 0.3,
+      fresnelPower: 2.0,
+      specularColor: 0x77ccff,
+      shininess: 80
+    }
+  },
+  lighting: {
+    ambientLight: { color: 0x406080, intensity: 0.5 },
+    directionalLight: {
+      color: 0xE0F0FF,
+      intensity: 0.7,
+      position: { x: 1, y: 10, z: 1 },
+      castShadow: false
+    },
+    fogColor: 0x102a43,
+    fogDensity: 0.03,
+    enableCaustics: true,
+    causticColor: 0xA0D0FF,
+    causticIntensity: 0.15,
+    causticScale: 6.0,
+    causticSpeed: 0.08,
+    causticBlendMode: 'additive',
+    enableGodRays: true,
+    godRayColor: 0xA0D0FF,
+    godRayIntensity: 0.08,
+    godRayDensity: 0.96,
+    godRayWeight: 0.05,
+    godRayDecay: 0.96,
+    godRayExposure: 0.1,
+    godRaySamples: 20
   },
 };
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/core/ConfigurationSystem.ts b/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
index 9720b51..75385c7 100644
--- a/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
+++ b/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
@@ -1,27 +1,36 @@
 // src/lib/game/core/ConfigurationSystem.ts
-import { GameConfig, defaultConfig, PowerUpsGameConfig, DifficultyGameConfig } from '../config/gameConfig';
+import {
+  GameConfig,
+  defaultConfig,
+  PowerUpsGameConfig,
+  DifficultyGameConfig,
+  LightingConfig,
+  SeafloorVisualConfig,
+  WaterSurfaceVisualConfig,
+  VisualSettings
+} from '../config/gameConfig';
 
 class ConfigurationSystem {
   private config: GameConfig;
 
   constructor(initialConfig?: Partial<GameConfig>) {
     this.config = {
       ...defaultConfig,
       ...initialConfig,
       // Deep merge powerUps if provided in initialConfig
       powerUps: initialConfig?.powerUps
         ? { ...defaultConfig.powerUps, ...initialConfig.powerUps }
         : { ...defaultConfig.powerUps },
       // Deep merge difficulty if provided in initialConfig
       difficulty: initialConfig?.difficulty
         ? {
             ...defaultConfig.difficulty,
             ...initialConfig.difficulty,
             tiers: initialConfig.difficulty.tiers
               ? [...initialConfig.difficulty.tiers]
               : [...defaultConfig.difficulty.tiers]
           }
         : {
             ...defaultConfig.difficulty,
             tiers: [...defaultConfig.difficulty.tiers]
           }
diff --git a/nemo-runner/src/lib/game/core/ConfigurationSystem.ts b/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
index 9720b51..75385c7 100644
--- a/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
+++ b/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
@@ -80,29 +89,46 @@ class ConfigurationSystem {
   public getPlayerJumpDuration(): number {
     return this.config.player.jumpDuration;
   }
 
   public getPlayerDiveDepth(): number {
     return this.config.player.diveDepth;
   }
 
   public getPlayerDiveDuration(): number {
     return this.config.player.diveDuration;
   }
 
   public getPlayerInitialLives(): number {
     return this.config.player.initialLives;
   }
 
   // Collision getters
   public getObstacleRadiusFactor(): number {
     return this.config.collisions.obstacleRadiusFactor;
   }
 
   // Obstacles config getter
   public getObstaclesConfig(): Readonly<GameConfig['obstacles']> {
     return this.config.obstacles;
   }
+
+  // Typed getters for new config sections
+  public getLightingConfig(): Readonly<LightingConfig> {
+    return this.config.lighting;
+  }
+
+  public getVisualSettings(): Readonly<VisualSettings> {
+    return this.config.visuals;
+  }
+
+  public getSeafloorConfig(): Readonly<SeafloorVisualConfig> {
+    return this.config.visuals.seafloor;
+  }
+
+  public getWaterSurfaceConfig(): Readonly<WaterSurfaceVisualConfig> {
+    return this.config.visuals.waterSurface;
+  }
 }
 
 // Export a singleton instance for easy access throughout the game
 export const configSystem = new ConfigurationSystem(); 
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/services/LightingManager.ts b/nemo-runner/src/lib/game/services/LightingManager.ts
index a30fad4..c8dd608 100644
--- a/nemo-runner/src/lib/game/services/LightingManager.ts
+++ b/nemo-runner/src/lib/game/services/LightingManager.ts
@@ -5,202 +5,201 @@ import { ShaderManager } from './ShaderManager';
 import CausticsGLSL from '../shaders/common/caustics.glsl';
 import { vertexShaderSource as seafloorVertexShader } from '../shaders/environment/seafloor.vert';
 import { fragmentShaderSource as seafloorFragmentShader } from '../shaders/environment/seafloor.frag';
 
 /**
  * Manages the scene's lighting, fog, and underwater visual effects including caustics
  */
 export class LightingManager {
   private scene: THREE.Scene;
   private shaderManager: ShaderManager;
   
   // Lights
   private ambientLight: THREE.AmbientLight;
   private directionalLight: THREE.DirectionalLight;
   
   // Visual effects
   private causticTargets: THREE.Mesh[] = [];
   private useCaustics: boolean;
   
   // For animating caustics
   private elapsedTime: number = 0;
   
   constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
     this.scene = scene;
     this.shaderManager = shaderManager;
-    const visuals = configSystem.get('visuals');
-    this.useCaustics = visuals.enableCaustics;
+    const lighting = configSystem.getLightingConfig();
+    this.useCaustics = lighting.enableCaustics;
     
     // Register caustic shader chunks
     this.registerCausticChunks();
     
     // Initialize lights
     this.ambientLight = this.createAmbientLight();
     this.directionalLight = this.createDirectionalLight();
     
     // Initialize fog
     this.setupFog();
     
     // Register seafloor shader with caustics
     this.registerSeafloorShader();
     
     console.log("LightingManager: Initialized with lighting, fog, and caustic shaders.");
   }
   
   /**
    * Creates and adds the ambient light to the scene based on config
    */
   private createAmbientLight(): THREE.AmbientLight {
-    const visuals = configSystem.get('visuals');
-    const { ambientLightColor, ambientLightIntensity } = visuals;
+    const lighting = configSystem.getLightingConfig();
+    const { color, intensity } = lighting.ambientLight;
     
     const light = new THREE.AmbientLight(
-      ambientLightColor,
-      ambientLightIntensity
+      color,
+      intensity
     );
     
     this.scene.add(light);
     return light;
   }
   
   /**
    * Creates and adds the directional light to the scene based on config
    */
   private createDirectionalLight(): THREE.DirectionalLight {
-    const visuals = configSystem.get('visuals');
-    const { 
-      directionalLightColor, 
-      directionalLightIntensity,
-      directionalLightPosition
-    } = visuals;
+    const lighting = configSystem.getLightingConfig();
+    const {
+      color,
+      intensity,
+      position,
+      castShadow
+    } = lighting.directionalLight;
     
     const light = new THREE.DirectionalLight(
-      directionalLightColor,
-      directionalLightIntensity
+      color,
+      intensity
     );
-    
+
     light.position.set(
-      directionalLightPosition.x,
-      directionalLightPosition.y,
-      directionalLightPosition.z
+      position.x,
+      position.y,
+      position.z
     );
-    
-    // Enable shadows for directional light (optional, can be configured)
-    light.castShadow = false; // Default off for performance, can be enabled later
+
+    // Enable shadows if configured
+    light.castShadow = castShadow ?? false;
     
     this.scene.add(light);
     return light;
   }
   
   /**
    * Sets up the scene fog using the configured parameters
    */
   private setupFog(): void {
-    const visuals = configSystem.get('visuals');
-    const { fogColor, fogNearFactor, fogFarFactor } = visuals;
-    
-    // Base the fog distances on the camera's viewing distance
-    // These values should be adjusted based on actual gameplay testing
-    const fogNear = 20 * fogNearFactor; // Starting point of fog
-    const fogFar = 40 * fogFarFactor;   // Point where fog is completely opaque
-    
-    this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
-    
-    // Also set the scene background to match the fog color for seamless blending
-    this.scene.background = new THREE.Color(fogColor);
+    const lighting = configSystem.getLightingConfig();
+    if (lighting.fogDensity !== undefined) {
+      this.scene.fog = new THREE.FogExp2(lighting.fogColor, lighting.fogDensity);
+    } else {
+      const fogNear = lighting.fogNear ?? 20;
+      const fogFar = lighting.fogFar ?? 40;
+      this.scene.fog = new THREE.Fog(lighting.fogColor, fogNear, fogFar);
+    }
+
+    this.scene.background = new THREE.Color(lighting.fogColor);
   }
   
   /**
    * Registers caustic shader chunks for use in shaders
    */
   private registerCausticChunks(): void {
     // Register all the caustic chunks
     this.shaderManager.registerChunk('causticEffect', CausticsGLSL.causticEffect);
     this.shaderManager.registerChunk('advancedCaustics', CausticsGLSL.advancedCaustics);
     this.shaderManager.registerChunk('blendCaustics', CausticsGLSL.blendCaustics);
 
     // Make sure they're properly integrated with THREE.js ShaderChunk
     THREE.ShaderChunk['causticEffect'] = CausticsGLSL.causticEffect;
     THREE.ShaderChunk['advancedCaustics'] = CausticsGLSL.advancedCaustics;
     THREE.ShaderChunk['blendCaustics'] = CausticsGLSL.blendCaustics;
 
     console.log("LightingManager: Registered caustic shader chunks.");
   }
   
   /**
    * Registers the seafloor shader with caustic effects
    */
   private registerSeafloorShader(): void {
-    const visuals = configSystem.get('visuals');
+    const lighting = configSystem.getLightingConfig();
     
     // Register the seafloor shader with the shader manager
     this.shaderManager.registerShader({
       name: 'seafloorShader',
       vertexShaderSource: seafloorVertexShader,
       fragmentShaderSource: seafloorFragmentShader,
       defaultUniforms: () => ({
         // Include the required global uniforms explicitly
         uTime: { value: 0.0 },
         uResolution: { value: new THREE.Vector2(1, 1) },
         // Caustic-specific uniforms
-        uCausticColor: { value: new THREE.Color(visuals.causticColor) },
-        uCausticIntensity: { value: visuals.causticIntensity },
-        uCausticScale: { value: visuals.causticScale },
-        uCausticSpeed: { value: visuals.causticSpeed }
+        uCausticColor: { value: new THREE.Color(lighting.causticColor) },
+        uCausticIntensity: { value: lighting.causticIntensity },
+        uCausticScale: { value: lighting.causticScale },
+        uCausticSpeed: { value: lighting.causticSpeed }
       }),
       materialParameters: {
         transparent: false,
         side: THREE.FrontSide,
         lights: true // Enable THREE.js lights in the shader
       }
     });
     
     console.log("LightingManager: Registered seafloor shader with caustics.");
   }
   
   /**
    * Creates a seafloor segment with caustic effects enabled
    * @returns A mesh with the caustic shader applied
    */
   public createCausticSeafloor(width: number, length: number): THREE.Mesh {
     try {
       // Create a simple plane geometry for the seafloor
       const geometry = new THREE.PlaneGeometry(width, length, 32, 32);
 
       // Rotate it to be horizontal
       geometry.rotateX(-Math.PI / 2);
 
       // Don't use complex shader materials at all - use built-in THREE.js materials with simpler properties
       // This avoids the shader uniform errors that are causing the WebGL context loss
-      const visuals = configSystem.get('visuals');
+      const lighting = configSystem.getLightingConfig();
       
       // Create a MeshPhongMaterial with underwater-like appearance
       const material = new THREE.MeshPhongMaterial({
         color: 0x99bbcc,                     // Base seafloor color
         specular: 0x6688ff,                  // Slight blue specular highlights
         shininess: 30,                       // Moderate shininess
-        emissive: new THREE.Color(visuals.causticColor).multiplyScalar(0.2), // Subtle caustic-like glow
+        emissive: new THREE.Color(lighting.causticColor).multiplyScalar(0.2), // Subtle caustic-like glow
         side: THREE.FrontSide,               // Only render front face for performance
         flatShading: false                   // Smooth shading
       });
       
       console.log("LightingManager: Created seafloor with built-in PhongMaterial (no custom shaders)");
 
       // Create and return the mesh
       const mesh = new THREE.Mesh(geometry, material);
       mesh.name = "SeafloorSegment";
       mesh.receiveShadow = true;
       
       return mesh;
     } catch (error) {
       console.error("LightingManager: Failed to create seafloor mesh", error);
 
       // Ultimate fallback - simple plane with basic material
       const geometry = new THREE.PlaneGeometry(width, length, 4, 4);
       geometry.rotateX(-Math.PI / 2);
       const material = new THREE.MeshBasicMaterial({ 
         color: 0x6688aa,
         side: THREE.FrontSide 
       });
       return new THREE.Mesh(geometry, material);
     }
   }
diff --git a/nemo-runner/src/lib/game/services/LightingManager.ts b/nemo-runner/src/lib/game/services/LightingManager.ts
index a30fad4..c8dd608 100644
--- a/nemo-runner/src/lib/game/services/LightingManager.ts
+++ b/nemo-runner/src/lib/game/services/LightingManager.ts
@@ -216,71 +215,73 @@ export class LightingManager {
     
     // Create a clone of the mesh's material to avoid affecting other objects
     if (mesh.material instanceof THREE.Material) {
       // You could use a custom shader here or modify the material properties
       // For now, we're just tracking this mesh for potential updates
       this.causticTargets.push(mesh);
     }
   }
   
   /**
    * Updates the lighting and caustic effects
    * @param deltaTime Time since last frame in seconds
    * @param elapsedTime Total game time in seconds
    */
   public update(deltaTime: number, elapsedTime: number): void {
     this.elapsedTime = elapsedTime;
     
     // We're no longer updating complex caustic targets since we're using simpler materials
     // This helps prevent the WebGL context loss issues
   }
   
   /**
    * Updates the lighting configuration based on current game settings
    */
   public updateConfig(): void {
-    const visuals = configSystem.get('visuals');
+    const lighting = configSystem.getLightingConfig();
     
     // Update ambient light
-    this.ambientLight.color.set(visuals.ambientLightColor);
-    this.ambientLight.intensity = visuals.ambientLightIntensity;
+    this.ambientLight.color.set(lighting.ambientLight.color);
+    this.ambientLight.intensity = lighting.ambientLight.intensity;
     
     // Update directional light
-    this.directionalLight.color.set(visuals.directionalLightColor);
-    this.directionalLight.intensity = visuals.directionalLightIntensity;
+    this.directionalLight.color.set(lighting.directionalLight.color);
+    this.directionalLight.intensity = lighting.directionalLight.intensity;
     this.directionalLight.position.set(
-      visuals.directionalLightPosition.x,
-      visuals.directionalLightPosition.y,
-      visuals.directionalLightPosition.z
+      lighting.directionalLight.position.x,
+      lighting.directionalLight.position.y,
+      lighting.directionalLight.position.z
     );
+    this.directionalLight.castShadow = lighting.directionalLight.castShadow ?? false;
     
     // Update fog
     if (this.scene.fog) {
-      const fogNear = 20 * visuals.fogNearFactor;
-      const fogFar = 40 * visuals.fogFarFactor;
-      
-      (this.scene.fog as THREE.Fog).color.set(visuals.fogColor);
-      (this.scene.fog as THREE.Fog).near = fogNear;
-      (this.scene.fog as THREE.Fog).far = fogFar;
-      
-      // Update scene background to match fog
-      this.scene.background = new THREE.Color(visuals.fogColor);
+      if (lighting.fogDensity !== undefined) {
+        const fogExp = new THREE.FogExp2(lighting.fogColor, lighting.fogDensity);
+        this.scene.fog = fogExp;
+      } else {
+        const fogNear = lighting.fogNear ?? 20;
+        const fogFar = lighting.fogFar ?? 40;
+        this.scene.fog = new THREE.Fog(lighting.fogColor, fogNear, fogFar);
+      }
+
+      this.scene.background = new THREE.Color(lighting.fogColor);
     }
-    
+
     // Update caustic settings flag
-    this.useCaustics = visuals.enableCaustics;
+    this.useCaustics = lighting.enableCaustics;
   }
   
   /**
    * Clean up resources used by the LightingManager
    */
   public dispose(): void {
     // Remove lights from scene
     this.scene.remove(this.ambientLight);
     this.scene.remove(this.directionalLight);
     
     // Clean up caustic targets
     this.causticTargets = [];
     
     console.log("LightingManager: Disposed.");
   }
 }
 
EOF
)

2) Introduced a procedural sand material with on-the-fly canvas textures and bump mapping for the seafloor, including caustic integration via onBeforeCompile

Added globalCausticTimeUniform and a new getCausticGLSLChunk() method to supply caustic GLSL code for material injection

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index 2ac0aff..c0fb1c5 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -1,83 +1,239 @@
 import * as THREE from 'three';
-import { ShaderManager, MaterialType } from '../../services/ShaderManager';
 import { configSystem } from '../../core/ConfigurationSystem';
+import { ShaderManager } from '../../services/ShaderManager';
 import { LightingManager } from '../../services/LightingManager';
 
+// Minimal interface mirroring Step 7 documentation
+interface SeafloorVisualConfig {
+  baseColor: number | string;
+  sandPatternColor1: number | string;
+  sandPatternColor2: number | string;
+  textureScale: number;
+  bumpScale?: number;
+  roughness?: number;
+  metalness?: number;
+}
+
 export class SeafloorAsset {
   private shaderManager: ShaderManager;
   private lightingManager: LightingManager | null = null;
   public segmentWidth: number;
-  public segmentLength: number; // Depth along Z
-  private useCaustics: boolean;
-  private seafloorMaterial: THREE.Material | null = null;
+  public segmentLength: number;
+  private config: Readonly<SeafloorVisualConfig>;
+
+  private material!: THREE.MeshStandardMaterial;
+  private sandTexture!: THREE.CanvasTexture;
+  private sandBumpMap!: THREE.CanvasTexture;
 
   constructor(shaderManager: ShaderManager) {
     this.shaderManager = shaderManager;
-    // Dimensions for a single seafloor segment
-    // Could also come from configSystem if more complex
-    this.segmentWidth = configSystem.getWorldXBoundary() * 2 + configSystem.getPlayerLaneWidth() * 3; // Rough estimate
-    this.segmentLength = 20; // Example length
-    this.useCaustics = configSystem.get('visuals').enableCaustics;
+    this.config = this._fetchConfig();
+    this.segmentWidth =
+      configSystem.getWorldXBoundary() * 2 +
+      configSystem.getPlayerLaneWidth() * 3;
+    this.segmentLength = 20;
+    this.createMaterial();
+  }
+
+  private _fetchConfig(): Readonly<SeafloorVisualConfig> {
+    const defaultConfig: SeafloorVisualConfig = {
+      baseColor: 0xad8e6e,
+      sandPatternColor1: 0xc4a484,
+      sandPatternColor2: 0x9a7b5a,
+      textureScale: 15,
+      bumpScale: 0.02,
+      roughness: 0.85,
+      metalness: 0.0
+    };
+    try {
+      const visuals: any = configSystem.get('visuals');
+      return { ...defaultConfig, ...(visuals?.seafloor || {}) };
+    } catch (error) {
+      console.warn('SeafloorAsset: Could not fetch config, using defaults', error);
+      return defaultConfig;
+    }
+  }
+
+  private createSandTexture(): THREE.CanvasTexture {
+    const canvas = document.createElement('canvas');
+    const size = 256;
+    canvas.width = size;
+    canvas.height = size;
+    const ctx = canvas.getContext('2d')!;
+
+    const baseColor = new THREE.Color(this.config.baseColor);
+    const color1 = new THREE.Color(this.config.sandPatternColor1);
+    const color2 = new THREE.Color(this.config.sandPatternColor2);
+
+    for (let y = 0; y < size; y++) {
+      for (let x = 0; x < size; x++) {
+        const randomFactor = Math.random() * 0.1 - 0.05;
+        const varied = baseColor.clone().offsetHSL(0, 0, randomFactor);
+        ctx.fillStyle = varied.getStyle();
+        ctx.fillRect(x, y, 1, 1);
+      }
+    }
+
+    const numSplotches = 80;
+    for (let i = 0; i < numSplotches; i++) {
+      const splotchColor = Math.random() < 0.5 ? color1 : color2;
+      ctx.fillStyle = splotchColor
+        .clone()
+        .offsetHSL(0, 0, Math.random() * 0.2 - 0.1)
+        .getStyle();
+      const x = Math.random() * size;
+      const y = Math.random() * size;
+      const r = Math.random() * (size / 15) + size / 30;
+      ctx.beginPath();
+      ctx.arc(x, y, r, 0, Math.PI * 2);
+      ctx.fill();
+    }
+
+    const texture = new THREE.CanvasTexture(canvas);
+    texture.wrapS = THREE.RepeatWrapping;
+    texture.wrapT = THREE.RepeatWrapping;
+    texture.repeat.set(
+      this.config.textureScale / size,
+      this.config.textureScale / size
+    );
+    texture.needsUpdate = true;
+    return texture;
+  }
+
+  private createSandBumpMap(): THREE.CanvasTexture {
+    const canvas = document.createElement('canvas');
+    const size = 256;
+    canvas.width = size;
+    canvas.height = size;
+    const ctx = canvas.getContext('2d')!;
+    ctx.fillStyle = 'rgb(128,128,128)';
+    ctx.fillRect(0, 0, size, size);
+
+    for (let i = 0; i < 2000; i++) {
+      const x = Math.random() * size;
+      const y = Math.random() * size;
+      const radius = Math.random() * 3 + 1;
+      const intensity = Math.floor(Math.random() * 50) + 100;
+      ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
+      ctx.beginPath();
+      ctx.arc(x, y, radius, 0, Math.PI * 2);
+      ctx.fill();
+    }
+
+    const texture = new THREE.CanvasTexture(canvas);
+    texture.wrapS = THREE.RepeatWrapping;
+    texture.wrapT = THREE.RepeatWrapping;
+    texture.repeat.set(
+      this.config.textureScale / size,
+      this.config.textureScale / size
+    );
+    texture.needsUpdate = true;
+    return texture;
+  }
+
+  private createMaterial(): void {
+    this.sandTexture = this.createSandTexture();
+    this.sandBumpMap = this.createSandBumpMap();
+
+    this.material = new THREE.MeshStandardMaterial({
+      map: this.sandTexture,
+      bumpMap: this.sandBumpMap,
+      bumpScale: this.config.bumpScale ?? 0.02,
+      color: 0xffffff,
+      roughness: this.config.roughness ?? 0.8,
+      metalness: this.config.metalness ?? 0.05,
+      side: THREE.FrontSide
+    });
+
+    const visuals = configSystem.get('visuals');
+    if (visuals.enableCaustics && this.lightingManager) {
+      this.material.onBeforeCompile = (shader) => {
+        shader.uniforms.uCausticColor = {
+          value: new THREE.Color(visuals.causticColor)
+        };
+        shader.uniforms.uCausticIntensity = { value: visuals.causticIntensity };
+        shader.uniforms.uCausticScale = { value: visuals.causticScale };
+        shader.uniforms.uTime = this.lightingManager!.globalCausticTimeUniform;
+
+        shader.vertexShader =
+          'varying vec3 vWorldPosition_Seafloor;\n' + shader.vertexShader;
+        shader.vertexShader = shader.vertexShader.replace(
+          '#include <worldpos_vertex>',
+          `#include <worldpos_vertex>
+          vWorldPosition_Seafloor = worldPosition.xyz;`
+        );
+
+        shader.fragmentShader =
+          'varying vec3 vWorldPosition_Seafloor;\n' +
+          this.lightingManager!.getCausticGLSLChunk() +
+          '\n' +
+          shader.fragmentShader;
+
+        shader.fragmentShader = shader.fragmentShader.replace(
+          /vec4 diffuseColor = vec4\( diffuse, opacity \);/,
+          `vec3 caustic = getCausticColor(vWorldPosition_Seafloor, uTime, uCausticScale, uCausticIntensity, uCausticColor);\nvec4 diffuseColor = vec4(diffuse + caustic, opacity);`
+        );
+      };
+    }
   }
 
   /**
    * Links the LightingManager to enable caustic effects on seafloor
    * @param lightingManager The game's LightingManager instance
    */
   public linkLightingManager(lightingManager: LightingManager): void {
     this.lightingManager = lightingManager;
-    console.log("SeafloorAsset: Linked with LightingManager for caustic effects");
+    // Rebuild material if lighting manager was missing during construction
+    if (this.material && !this.material.onBeforeCompile) {
+      this.dispose();
+      this.createMaterial();
+    }
+    console.log('SeafloorAsset: Linked with LightingManager for caustic effects');
   }
 
   /**
-   * Creates a seafloor segment mesh with proper material and shaders
+   * Creates a seafloor segment mesh with updated UVs
    */
   public createMesh(): THREE.Mesh {
-    // If we have a LightingManager and caustics are enabled, use it to create the seafloor
-    if (this.lightingManager && this.useCaustics) {
-      return this.lightingManager.createCausticSeafloor(this.segmentWidth, this.segmentLength);
-    }
-
-    // Otherwise, use the legacy approach
-    const geometry = new THREE.PlaneGeometry(this.segmentWidth, this.segmentLength, 32, 32);
-    // Rotate plane to be horizontal
+    const geometry = new THREE.PlaneGeometry(
+      this.segmentWidth,
+      this.segmentLength,
+      20,
+      20
+    );
     geometry.rotateX(-Math.PI / 2);
 
-    // Use cached material if it exists to prevent shader recompilation issues
-    if (!this.seafloorMaterial) {
-      try {
-        // Create basic material with simple blue color - no shaders
-        this.seafloorMaterial = new THREE.MeshStandardMaterial({
-          color: 0x335599,
-          side: THREE.DoubleSide,
-          roughness: 0.8,
-          metalness: 0.2
-        });
-        console.log("SeafloorAsset: Created fallback standard material for seafloor");
-      } catch (error) {
-        console.warn("SeafloorAsset: Error creating material, using most basic fallback", error);
-        // Ultimate fallback - if even MeshStandardMaterial fails
-        this.seafloorMaterial = new THREE.MeshBasicMaterial({
-          color: 0x335599,
-          side: THREE.DoubleSide
-        });
-      }
+    geometry.setAttribute(
+      'uv',
+      new THREE.BufferAttribute(
+        new Float32Array(geometry.attributes.position.count * 2),
+        2
+      )
+    );
+    const positions = geometry.attributes.position as THREE.BufferAttribute;
+    const uvs = geometry.attributes.uv as THREE.BufferAttribute;
+    for (let i = 0; i < positions.count; i++) {
+      uvs.setXY(
+        i,
+        positions.getX(i) / this.segmentWidth + 0.5,
+        positions.getZ(i) / this.segmentLength + 0.5
+      );
     }
+    uvs.needsUpdate = true;
 
-    const mesh = new THREE.Mesh(geometry, this.seafloorMaterial);
-    mesh.name = "SeafloorSegment";
+    const mesh = new THREE.Mesh(geometry, this.material);
+    mesh.name = 'SeafloorSegment_Styled';
+    mesh.position.y = -1.0;
     mesh.receiveShadow = true;
-
     return mesh;
   }
 
   /**
    * Disposes material resources to prevent memory leaks
    */
   public dispose(): void {
-    if (this.seafloorMaterial) {
-      this.seafloorMaterial.dispose();
-      this.seafloorMaterial = null;
-    }
+    this.sandTexture?.dispose();
+    this.sandBumpMap?.dispose();
+    this.material?.dispose();
   }
-} 
+}
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/services/LightingManager.ts b/nemo-runner/src/lib/game/services/LightingManager.ts
index a30fad4..b8e7c2d 100644
--- a/nemo-runner/src/lib/game/services/LightingManager.ts
+++ b/nemo-runner/src/lib/game/services/LightingManager.ts
@@ -1,56 +1,60 @@
 // src/lib/game/services/LightingManager.ts
 import * as THREE from 'three';
 import { configSystem } from '../core/ConfigurationSystem';
 import { ShaderManager } from './ShaderManager';
 import CausticsGLSL from '../shaders/common/caustics.glsl';
+import NoiseGLSL from '../shaders/common/noise.glsl';
 import { vertexShaderSource as seafloorVertexShader } from '../shaders/environment/seafloor.vert';
 import { fragmentShaderSource as seafloorFragmentShader } from '../shaders/environment/seafloor.frag';
 
 /**
  * Manages the scene's lighting, fog, and underwater visual effects including caustics
  */
 export class LightingManager {
   private scene: THREE.Scene;
   private shaderManager: ShaderManager;
   
   // Lights
   private ambientLight: THREE.AmbientLight;
   private directionalLight: THREE.DirectionalLight;
   
   // Visual effects
   private causticTargets: THREE.Mesh[] = [];
   private useCaustics: boolean;
+
+  public globalCausticTimeUniform: THREE.IUniform<number>;
   
   // For animating caustics
   private elapsedTime: number = 0;
   
   constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
     this.scene = scene;
     this.shaderManager = shaderManager;
     const visuals = configSystem.get('visuals');
     this.useCaustics = visuals.enableCaustics;
+    this.globalCausticTimeUniform = this.shaderManager.globalUniforms.uTime;
     
     // Register caustic shader chunks
     this.registerCausticChunks();
     
     // Initialize lights
     this.ambientLight = this.createAmbientLight();
     this.directionalLight = this.createDirectionalLight();
     
     // Initialize fog
     this.setupFog();
     
     // Register seafloor shader with caustics
     this.registerSeafloorShader();
     
     console.log("LightingManager: Initialized with lighting, fog, and caustic shaders.");
   }
   
   /**
    * Creates and adds the ambient light to the scene based on config
    */
   private createAmbientLight(): THREE.AmbientLight {
     const visuals = configSystem.get('visuals');
     const { ambientLightColor, ambientLightIntensity } = visuals;
     
     const light = new THREE.AmbientLight(
diff --git a/nemo-runner/src/lib/game/services/LightingManager.ts b/nemo-runner/src/lib/game/services/LightingManager.ts
index a30fad4..b8e7c2d 100644
--- a/nemo-runner/src/lib/game/services/LightingManager.ts
+++ b/nemo-runner/src/lib/game/services/LightingManager.ts
@@ -199,50 +203,62 @@ export class LightingManager {
       geometry.rotateX(-Math.PI / 2);
       const material = new THREE.MeshBasicMaterial({ 
         color: 0x6688aa,
         side: THREE.FrontSide 
       });
       return new THREE.Mesh(geometry, material);
     }
   }
   
   /**
    * Applies caustic shader to an existing mesh
    * Useful for adding caustic effects to various objects in the scene
    * @param mesh The mesh to apply caustic effects to
    * @param intensity Optional intensity multiplier for this specific object
    */
   public applyCausticsToObject(mesh: THREE.Mesh, intensity: number = 1.0): void {
     if (!this.useCaustics) return;
     
     // Create a clone of the mesh's material to avoid affecting other objects
     if (mesh.material instanceof THREE.Material) {
       // You could use a custom shader here or modify the material properties
       // For now, we're just tracking this mesh for potential updates
       this.causticTargets.push(mesh);
     }
   }
+
+  public getCausticGLSLChunk(): string {
+    return `
+      ${NoiseGLSL.random2D}
+      ${NoiseGLSL.noise2D}
+      ${CausticsGLSL.causticEffect}
+      vec3 getCausticColor(vec3 worldPos, float time, float scale, float intensity, vec3 color) {
+        float c = causticEffect(worldPos.xz * scale, time, 1.0);
+        return color * c * intensity;
+      }
+    `;
+  }
   
   /**
    * Updates the lighting and caustic effects
    * @param deltaTime Time since last frame in seconds
    * @param elapsedTime Total game time in seconds
    */
   public update(deltaTime: number, elapsedTime: number): void {
     this.elapsedTime = elapsedTime;
     
     // We're no longer updating complex caustic targets since we're using simpler materials
     // This helps prevent the WebGL context loss issues
   }
   
   /**
    * Updates the lighting configuration based on current game settings
    */
   public updateConfig(): void {
     const visuals = configSystem.get('visuals');
     
     // Update ambient light
     this.ambientLight.color.set(visuals.ambientLightColor);
     this.ambientLight.intensity = visuals.ambientLightIntensity;
     
     // Update directional light
     this.directionalLight.color.set(visuals.directionalLightColor);
 
EOF
)

3) Implemented a new water surface asset that uses MeshPhysicalMaterial and injects ripple uniforms via onBeforeCompile to animate color ripples. The asset exposes methods for updating time, retrieving the mesh, and disposing resources

Extended the configuration with a WaterSurfaceVisualConfig interface and added a waterSurface section in the default visuals configuration for controlling ripple behavior

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
index 0000000..5ac8330 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
@@ -0,0 +1,73 @@
+import * as THREE from 'three';
+import { configSystem } from '../../core/ConfigurationSystem';
+import { ShaderManager } from '../../services/ShaderManager';
+import { WaterSurfaceVisualConfig } from '../../config/gameConfig';
+
+export class WaterSurfaceAsset {
+  public mesh!: THREE.Mesh;
+  private config: Readonly<WaterSurfaceVisualConfig>;
+  private material!: THREE.MeshPhysicalMaterial;
+
+  constructor(_shaderManager: ShaderManager) {
+    this.config = configSystem.get('visuals').waterSurface;
+    this.createMesh();
+  }
+
+  private createMesh(): void {
+    const surfaceSize = 200;
+    const geometry = new THREE.PlaneGeometry(surfaceSize, surfaceSize, 1, 1);
+
+    this.material = new THREE.MeshPhysicalMaterial({
+      color: new THREE.Color(this.config.baseColor),
+      metalness: 0.1,
+      roughness: 0.05,
+      transmission: 0.9,
+      transparent: true,
+      opacity: this.config.opacity,
+      side: THREE.BackSide,
+      envMapIntensity: 0.7,
+      ior: 1.33,
+    });
+
+    this.material.onBeforeCompile = (shader) => {
+      shader.uniforms.uTime = { value: 0 };
+      shader.uniforms.uRippleSpeed = { value: this.config.rippleSpeed };
+      shader.uniforms.uRippleScale = { value: this.config.rippleScale };
+      shader.uniforms.uRippleIntensity = { value: this.config.rippleIntensity };
+
+      shader.fragmentShader =
+        `uniform float uTime;\n` +
+        `uniform float uRippleSpeed;\n` +
+        `uniform float uRippleScale;\n` +
+        `uniform float uRippleIntensity;\n` +
+        shader.fragmentShader;
+
+      shader.fragmentShader = shader.fragmentShader.replace(
+        '#include <color_fragment>',
+        `#include <color_fragment>\n  float ripple = sin((vUv.x + uTime * uRippleSpeed) * uRippleScale) *\n                      sin((vUv.y + uTime * uRippleSpeed) * uRippleScale);\n  diffuseColor.rgb += ripple * uRippleIntensity;`
+      );
+
+      (this.material as any).userData.shader = shader;
+    };
+
+    this.mesh = new THREE.Mesh(geometry, this.material);
+    this.mesh.rotation.x = -Math.PI / 2;
+    this.mesh.name = 'WaterSurface';
+  }
+
+  public update(_delta: number, elapsed: number): void {
+    const shader = (this.material as any).userData?.shader;
+    if (shader && shader.uniforms.uTime) {
+      shader.uniforms.uTime.value = elapsed;
+    }
+  }
+
+  public getMesh(): THREE.Mesh {
+    return this.mesh;
+  }
+
+  public dispose(): void {
+    this.mesh.geometry.dispose();
+    this.material.dispose();
+  }
+}
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..3b00ff2 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -183,50 +183,60 @@ export interface KelpWallObstacleConfig {
 
 // Interface for School of Fish obstacle configuration
 export interface SchoolOfFishObstacleConfig {
   fishCountMin: number;       // Min number of fish in a school
   fishCountMax: number;       // Max number of fish
   schoolRadius: number;       // Radius defining the general spread of the school
   individualFishScale: number; // Size of each fish
   depthCoverage: number;      // How much vertical space the school occupies (making it hard to jump)
   formation: 'swarm' | 'wall'; // Swarm is more spread out, wall is a dense vertical curtain
   baseSpeedFactor: number;    // Speed relative to player's base speed
   visuals: ObstacleStandardMaterialVisuals;
 }
 
 export interface ObstaclesConfig {
   pufferfish: PufferfishConfig; // RE-ADD
   jellyfish: JellyfishConfig;
   shark: SharkConfig;
   seaTurtle: SeaTurtleConfig;
   kelpWall: KelpWallObstacleConfig;
   schoolOfFish: SchoolOfFishObstacleConfig;
   rock: RockConfig;
   coral: CoralConfig;
   clam: ClamConfig;
 }
 
+export interface WaterSurfaceVisualConfig {
+  enabled: boolean;
+  baseColor: number | string;
+  rippleColor: number | string;
+  rippleSpeed: number;
+  rippleScale: number;
+  rippleIntensity: number;
+  opacity: number;
+}
+
 export interface VisualSettings {
   skyColor: number | string;
   ambientLightColor: number | string;
   ambientLightIntensity: number;
   directionalLightColor: number | string;
   directionalLightIntensity: number;
   directionalLightPosition: { x: number; y: number; z: number };
 
   // Fog configuration
   fogColor: number | string;
   fogNearFactor: number; // e.g., 2.0 (fog starts at 2x cameraFar/some_base_distance)
   fogFarFactor: number;  // e.g., 5.0 (fog is dense at 5x cameraFar/some_base_distance)
 
   // Caustics configuration
   enableCaustics: boolean;
   causticIntensity: number; // Modulates the brightness of caustics
   causticScale: number;     // Controls the size of the caustic patterns
   causticSpeed: number;     // Controls the animation speed of caustics
   causticColor: number | string; // Color tint for caustics
 
   // Groundwork for God Rays (parameters for future implementation)
   enableGodRays: boolean;
   godRayLightSourceOffsetY: number; // Offset Y from directional light for god ray source visual
 
   // Particle Effects
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..3b00ff2 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -234,50 +244,53 @@ export interface VisualSettings {
   bubblesEnabled: boolean;
   bubbleCount: number;
   bubbleBaseSpeed: number;
   bubbleSize: number;
   bubbleSpawnAreaX: number; // Width over which bubbles spawn
   bubbleSpawnDepth: number; // Depth below seafloor bubbles spawn from
 
   dustEnabled: boolean;
   dustCount: number;
   dustSize: number;
   dustWanderSpeed: number;
 
   // Screen Effects (Post-Processing)
   enableScreenEffects: boolean;
   vignetteEnabled: boolean;
   vignetteIntensity: number; // 0 to 1 typically
   vignetteSmoothness: number; // Controls the falloff sharpness
 
   colorGradingEnabled: boolean;
   colorGradeIntensity: number; // How much to apply grading
   colorGradeTargetColor: number | string; // e.g., shift towards a deeper blue
 
   distortionEnabled: boolean;
   distortionIntensity: number; // Subtle water ripple effect
   distortionSpeed: number;
+
+  // Water surface configuration
+  waterSurface: WaterSurfaceVisualConfig;
 }
 
 export interface PlayerSettings {
   moveSpeed: number; // Units per second
   laneWidth: number; // Width of a single lane
   laneChangeDuration: number; // Duration of the lane change animation
   initialLives: number;
   jumpHeight: number; // Max height of the jump arc
   jumpDuration: number; // Time to complete one jump (up and down)
   diveDepth: number; // Max depth of the dive arc
   diveDuration: number; // Time to complete one dive (down and up)
   invincibilityDuration: number; // Duration of invincibility after taking damage
   gravity?: number; // Optional: If using physics-based jump/dive
   normalYPosition: number; // Default Y position for the player
   
   // Clownfish visual properties
   clownFishBaseColor: number; // Main orange color
   clownFishStripeColor: number; // White stripe color
   clownFishStripeEdgeColor: number; // Dark edge around stripes
   clownFishFinAccentColor: number; // Color for fin edges/tips
   
   // Eye properties
   eyePupilColor: number; // Dark center of eye
   eyeIrisColor: number; // Colored part around pupil
   eyeHighlightColor: number; // Specular highlight on eye
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..3b00ff2 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -597,27 +610,37 @@ export const defaultConfig: GameConfig = {
     bubblesEnabled: true,
     bubbleCount: 150,
     bubbleBaseSpeed: 0.2, // Units per second
     bubbleSize: 0.05,
     bubbleSpawnAreaX: 10, // Spawn across a 10 unit width
     bubbleSpawnDepth: 0.1, // Spawn slightly below surface
 
     dustEnabled: true,
     dustCount: 300,
     dustSize: 0.03,
     dustWanderSpeed: 0.02,
 
     // Screen Effects
     enableScreenEffects: true,
     vignetteEnabled: true,
     vignetteIntensity: 0.4,
     vignetteSmoothness: 0.5,
 
     colorGradingEnabled: true,
     colorGradeIntensity: 0.15,
     colorGradeTargetColor: 0x305080, // Shift towards a slightly deeper blue
 
     distortionEnabled: true, // Very subtle
     distortionIntensity: 0.005,
     distortionSpeed: 0.1,
+
+    waterSurface: {
+      enabled: true,
+      baseColor: 0x87ceeb,
+      rippleColor: 0xffffff,
+      rippleSpeed: 0.2,
+      rippleScale: 10.0,
+      rippleIntensity: 0.01,
+      opacity: 0.3,
+    },
   },
 };
 
EOF
)

4) The kelp wall asset now stores stalk and frond meshes with their original vertex data for animation, enabling a more detailed sway effect

Mesh creation uses MeshPhysicalMaterial and constructs stalk and frond geometry with adjustable radii and frond counts for improved visuals and translucency

Animation logic updates vertex positions of both stalks and fronds, recalculating normals after deformation for smoother motion

Reset and disposal methods handle the new kelp part data structures and dispose of MeshPhysicalMaterial resources correctly

The obstacle configuration interface includes optional stalkRadius and frondCount properties for flexibility

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/obstacles/KelpWallAsset.ts b/nemo-runner/src/lib/game/assets/obstacles/KelpWallAsset.ts
index 2c438fe..ab864b2 100644
--- a/nemo-runner/src/lib/game/assets/obstacles/KelpWallAsset.ts
+++ b/nemo-runner/src/lib/game/assets/obstacles/KelpWallAsset.ts
@@ -1,222 +1,212 @@
 import * as THREE from 'three';
 import { configSystem } from '../../core/ConfigurationSystem';
 import { KelpWallObstacleConfig, ObstacleStandardMaterialVisuals } from '../../config/gameConfig';
 
 export class KelpWallAsset {
   public config: Readonly<KelpWallObstacleConfig>;
   public mesh!: THREE.Group;
   private collisionMesh!: THREE.Mesh;
-  private kelpStrands: THREE.Mesh[] = []; // To hold individual strand meshes for animation
+  // Holds stalk and frond meshes with their original vertex positions
+  private kelpParts: { mesh: THREE.Mesh; original: THREE.BufferAttribute; type: 'stalk' | 'frond' }[] = [];
 
   private animationTime: number = 0;
 
   constructor() {
     this.config = this._fetchConfig();
     this.createMesh();
   }
 
   private _fetchConfig(): Readonly<KelpWallObstacleConfig> {
     const defaultConfig: KelpWallObstacleConfig = {
         baseScaleY: 3.5, // Overall height of the kelp wall
         segmentWidthCoverage: 1.0, // How many lane widths the kelp wall segment covers
         strandCountMin: 5,
         strandCountMax: 8,
         swayAmplitude: 0.15,
         swaySpeed: 0.8,
         visuals: { // Default visuals for KelpWall
             mainColor: 0x2E8B57, // SeaGreen
             detailColor: 0x20603D, // Darker green for fronds or variation
             roughness: 0.8,
             metalness: 0.05,
             opacity: 0.85,
             transmission: 0.3, // For light passing through
             animationSpeed: 0.8, // Overrides general swaySpeed for vertex anim
             animationAmplitude: 0.15, // Overrides general swayAmplitude for vertex anim
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
 
+  
   private createMesh(): void {
     this.mesh = new THREE.Group();
-    this.mesh.name = "KelpWallObstacle_StdMat";
+    this.mesh.name = "KelpWallObstacle_StdMat_Enhanced";
+    this.kelpParts = [];
+
     const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;
 
     const strandHeight = this.config.baseScaleY;
     const numStrands = THREE.MathUtils.randInt(this.config.strandCountMin, this.config.strandCountMax);
-    const totalWallWidth = (configSystem.get('player').laneWidth * this.config.segmentWidthCoverage);
+    const totalWallWidth = configSystem.get('player').laneWidth * this.config.segmentWidthCoverage;
     const spacing = numStrands > 1 ? totalWallWidth / (numStrands - 1) : 0;
 
     const kelpMaterial = new THREE.MeshPhysicalMaterial({
-        color: new THREE.Color(visualConf.mainColor),
-        roughness: visualConf.roughness,
-        metalness: visualConf.metalness,
-        side: THREE.DoubleSide,
-        transparent: true,
-        opacity: visualConf.opacity,
-        // Attempt to use transmission; ensure your Three.js version supports it on MeshStandardMaterial
-        // or consider MeshPhysicalMaterial if this is critical and causes issues.
-        ...(visualConf.transmission && visualConf.transmission > 0 && { transmission: visualConf.transmission }),
+      color: new THREE.Color(visualConf.mainColor),
+      roughness: visualConf.roughness,
+      metalness: visualConf.metalness,
+      side: THREE.DoubleSide,
+      transparent: true,
+      opacity: visualConf.opacity,
+      transmission: visualConf.transmission,
     });
 
     for (let i = 0; i < numStrands; i++) {
-        const strandGroup = new THREE.Group(); // Each strand is a group of stalk + fronds
-
-        // Stalk Geometry (tapered cylinder or box)
-        const stalkRadiusTop = 0.03;
-        const stalkRadiusBottom = 0.05;
-        const stalkHeight = strandHeight * THREE.MathUtils.randFloat(0.9, 1.1); // Slight height variation
-        const stalkSegments = 12; // More segments for smoother bending
-        const stalkGeom = new THREE.CylinderGeometry(stalkRadiusTop, stalkRadiusBottom, stalkHeight, 8, stalkSegments);
-        stalkGeom.translate(0, stalkHeight / 2, 0); // Pivot at base
-        // Store original positions for vertex animation
-        stalkGeom.userData.originalPositions = stalkGeom.attributes.position.clone();
-        
-        const stalk = new THREE.Mesh(stalkGeom, kelpMaterial);
-        strandGroup.add(stalk);
-        this.kelpStrands.push(stalk); // Add stalk for vertex animation
-
-        // Frond Geometry (attached to stalk)
-        const numFronds = THREE.MathUtils.randInt(3, 6);
-        const frondMaterial = kelpMaterial.clone(); // Can use same or vary color slightly
-        if (visualConf.detailColor) {
-            frondMaterial.color = new THREE.Color(visualConf.detailColor);
-            if (frondMaterial.emissive && visualConf.mainColor === visualConf.emissiveColor) {
-                 // If main color was used for emissive, update frond emissive based on detail color
-                (frondMaterial.emissive as THREE.Color).set(visualConf.detailColor).multiplyScalar(0.3);
-            }
-        }
+      const strandGroup = new THREE.Group();
+
+      const stalkRadiusTop = (this.config.stalkRadius || 0.03) * THREE.MathUtils.randFloat(0.8, 1.2);
+      const stalkRadiusBottom = (this.config.stalkRadius || 0.05) * THREE.MathUtils.randFloat(0.9, 1.1);
+      const currentStalkHeight = strandHeight * THREE.MathUtils.randFloat(0.9, 1.1);
+      const stalkGeom = new THREE.CylinderGeometry(stalkRadiusTop, stalkRadiusBottom, currentStalkHeight, 6, 10);
+      stalkGeom.translate(0, currentStalkHeight / 2, 0);
+      stalkGeom.userData.originalPositions = stalkGeom.attributes.position.clone();
+
+      const stalk = new THREE.Mesh(stalkGeom, kelpMaterial);
+      stalk.userData.baseY = 0;
+      strandGroup.add(stalk);
+      this.kelpParts.push({ mesh: stalk, original: stalkGeom.attributes.position.clone(), type: 'stalk' });
+
+      const numFronds = this.config.frondCount || 5;
+      const frondMaterial = kelpMaterial.clone();
+      if (visualConf.detailColor) {
+        frondMaterial.color = new THREE.Color(visualConf.detailColor);
+      }
 
-        for (let j = 0; j < numFronds; j++) {
-            const frondLength = stalkHeight * THREE.MathUtils.randFloat(0.2, 0.4);
-            const frondWidth = frondLength * THREE.MathUtils.randFloat(0.15, 0.25);
-            
-            const frondShape = new THREE.Shape();
-            frondShape.moveTo(0,0);
-            frondShape.quadraticCurveTo(frondWidth * 0.3, frondLength * 0.2, frondWidth * 0.5, frondLength * 0.5);
-            frondShape.quadraticCurveTo(frondWidth * 0.4, frondLength * 0.8, 0, frondLength); // Pointed tip
-            frondShape.quadraticCurveTo(-frondWidth * 0.4, frondLength * 0.8, -frondWidth * 0.5, frondLength * 0.5);
-            frondShape.quadraticCurveTo(-frondWidth * 0.3, frondLength * 0.2, 0,0);
-            
-            // Simpler plane for fronds can also work well and be cheaper
-            // const frondGeom = new THREE.PlaneGeometry(frondWidth, frondLength, 1, 5);
-            const frondGeom = new THREE.ShapeGeometry(frondShape, 5);
-            frondGeom.translate(0, frondLength / 2, 0); // Pivot at its attachment point
-            frondGeom.userData.originalPositions = frondGeom.attributes.position.clone();
-
-            const frond = new THREE.Mesh(frondGeom, frondMaterial);
-            const attachHeight = (j / numFronds) * stalkHeight * 0.8 + stalkHeight * 0.1; // Distribute along stalk
-            frond.position.set(0, attachHeight, stalkRadiusBottom);
-            frond.rotation.x = Math.PI / 2 + THREE.MathUtils.randFloat(-0.3, 0.3); // Angle outwards
-            frond.rotation.y = THREE.MathUtils.randFloat(-Math.PI, Math.PI); // Random orientation around stalk
-            stalk.add(frond); // Attach frond to the stalk
-            this.kelpStrands.push(frond); // Add frond for vertex animation
-        }
+      for (let j = 0; j < numFronds; j++) {
+        const frondLength = currentStalkHeight * THREE.MathUtils.randFloat(0.3, 0.6);
+        const frondWidth = frondLength * THREE.MathUtils.randFloat(0.2, 0.35);
+
+        const frondShape = new THREE.Shape();
+        frondShape.moveTo(0, 0);
+        frondShape.quadraticCurveTo(frondWidth * 0.2, frondLength * 0.3, frondWidth * 0.1, frondLength * 0.7);
+        frondShape.quadraticCurveTo(0, frondLength, -frondWidth * 0.1, frondLength * 0.7);
+        frondShape.quadraticCurveTo(-frondWidth * 0.2, frondLength * 0.3, 0, 0);
+
+        const frondGeom = new THREE.ShapeGeometry(frondShape, 3);
+        frondGeom.translate(0, 0, 0);
+        frondGeom.rotateX(Math.PI / 2);
+        frondGeom.userData.originalPositions = frondGeom.attributes.position.clone();
+
+        const frond = new THREE.Mesh(frondGeom, frondMaterial);
+        const attachHeightRatio = (j / (numFronds - 1 || 1)) * 0.7 + 0.2;
+        const attachHeight = attachHeightRatio * currentStalkHeight;
+        frond.userData.baseY = attachHeight;
+        frond.position.set((Math.random() < 0.5 ? 1 : -1) * (stalkRadiusBottom * 0.5), attachHeight, 0);
+        frond.rotation.y = THREE.MathUtils.randFloatSpread(Math.PI * 0.5);
+        frond.rotation.x = THREE.MathUtils.randFloatSpread(Math.PI / 4);
+        stalk.add(frond);
+        this.kelpParts.push({ mesh: frond, original: frondGeom.attributes.position.clone(), type: 'frond' });
+      }
 
-        strandGroup.position.x = (i * spacing) - (totalWallWidth / 2) + (spacing / 2);
-        if (numStrands === 1) strandGroup.position.x = 0;
-        strandGroup.position.z = (Math.random() - 0.5) * 0.3;
-        strandGroup.rotation.y = (Math.random() - 0.5) * 0.4;
-        this.mesh.add(strandGroup);
+      strandGroup.position.x = numStrands > 1 ? i * spacing - totalWallWidth / 2 + spacing / 2 : 0;
+      strandGroup.position.z = (Math.random() - 0.5) * 0.3;
+      strandGroup.rotation.y = (Math.random() - 0.5) * 0.2;
+      this.mesh.add(strandGroup);
     }
-    
+
     const collisionHeight = strandHeight;
-    const collisionWidth = totalWallWidth + 0.1; 
-    const collisionDepth = 0.3; 
+    const collisionWidth = totalWallWidth + (this.config.stalkRadius || 0.05) * 2;
+    const collisionDepth = Math.max(0.3, (this.config.stalkRadius || 0.05) * 2);
     const collisionGeom = new THREE.BoxGeometry(collisionWidth, collisionHeight, collisionDepth);
     this.collisionMesh = new THREE.Mesh(collisionGeom, new THREE.MeshBasicMaterial({ visible: false, wireframe: true }));
     this.collisionMesh.name = "KelpWallCollisionBox";
-    this.collisionMesh.position.y = strandHeight / 2; 
+    this.collisionMesh.position.y = strandHeight / 2;
     this.mesh.add(this.collisionMesh);
 
     this.mesh.userData = { type: 'obstacle', name: 'kelpWall', assetInstance: this, isDangerous: true };
   }
-  
-  public updateAnimation(deltaTime: number): void {
+}  public updateAnimation(deltaTime: number): void {
     this.animationTime += deltaTime;
     const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;
     const swaySpeed = visualConf.animationSpeed || this.config.swaySpeed;
     const swayAmplitude = visualConf.animationAmplitude || this.config.swayAmplitude;
 
-    this.kelpStrands.forEach((kelpPart, partIndex) => {
-        const geom = kelpPart.geometry;
-        const originalPos = geom.userData.originalPositions as THREE.BufferAttribute;
-        const currentPos = geom.attributes.position as THREE.BufferAttribute;
-
-        if (!originalPos) return; // Skip if original positions not stored
-
-        const worldPos = new THREE.Vector3();
-        kelpPart.getWorldPosition(worldPos); // Get world position of the kelp part's origin
-
-        for (let i = 0; i < originalPos.count; i++) {
-            const ox = originalPos.getX(i);
-            const oy = originalPos.getY(i);
-            const oz = originalPos.getZ(i);
-
-            // Create a local reference point for sway based on original y (height along stalk/frond)
-            // And add some variation based on the kelp part's world position to desynchronize strands
-            const phaseOffset = (worldPos.x + worldPos.z) * 0.5 + partIndex * 0.2;
-            const swayFactor = Math.pow(oy / (this.config.baseScaleY * 0.5), 1.5); // More sway at the top, less at base
-            
-            const waveX = Math.sin(this.animationTime * swaySpeed * 0.7 + oy * 0.3 + phaseOffset) * swayAmplitude * swayFactor;
-            const waveZ = Math.cos(this.animationTime * swaySpeed * 0.5 + oy * 0.4 + phaseOffset * 1.2) * swayAmplitude * swayFactor * 0.6;
-
-            // Validate waveX and waveZ before applying
-            if (isNaN(waveX) || isNaN(waveZ) || !isFinite(waveX) || !isFinite(waveZ)) {
-                // console.warn("KelpWallAsset: Invalid waveX or waveZ. Skipping vertex update.", {waveX, waveZ, oy, swayFactor});
-                // If problematic, just use original position for this vertex for this frame
-                currentPos.setXYZ(i, ox, oy, oz);
-                continue; 
-  }
+    this.kelpParts.forEach((item, partIndex) => {
+      const kelpPart = item.mesh;
+      const geom = kelpPart.geometry;
+      const originalAttr = item.original as THREE.BufferAttribute;
+      const currentAttr = geom.attributes.position as THREE.BufferAttribute;
+      if (!originalAttr) return;
 
-            // Apply sway relative to the original X and Z, Y remains mostly for height
-            currentPos.setXYZ(i, ox + waveX, oy, oz + waveZ);
-        }
-        currentPos.needsUpdate = true;
-        geom.computeVertexNormals(); // Important if lighting is affected by deformation
+      const worldPos = new THREE.Vector3();
+      const parentObject = kelpPart.parent instanceof THREE.Group ? kelpPart.parent : kelpPart;
+      parentObject.getWorldPosition(worldPos);
+
+      const partHeight = item.type === 'stalk'
+        ? (geom as THREE.CylinderGeometry).parameters.height
+        : (geom as THREE.ShapeGeometry).parameters.shapes[0].getBoundingBox().getSize(new THREE.Vector3()).y;
+
+      for (let i = 0; i < originalAttr.count; i++) {
+        const ox = originalAttr.getX(i);
+        const oy = originalAttr.getY(i);
+        const oz = originalAttr.getZ(i);
+
+        const normalized = Math.abs(oy / (partHeight || 0.1));
+        const swayFactor = Math.pow(normalized, 1.5);
+
+        const phaseOffset = (worldPos.x + worldPos.z) * 0.3 + partIndex * 0.3;
+
+        const waveX = Math.sin(this.animationTime * swaySpeed + oy * 0.5 + phaseOffset) * swayAmplitude * swayFactor;
+        const waveZ = Math.cos(this.animationTime * swaySpeed * 0.7 + oy * 0.4 + phaseOffset * 1.3) * swayAmplitude * swayFactor * 0.5;
+
+        currentAttr.setXYZ(i, ox + waveX, oy, oz + waveZ);
+      }
+      currentAttr.needsUpdate = true;
     });
+    if (this.kelpParts.length > 0) {
+      this.kelpParts[0].mesh.geometry.computeVertexNormals();
+    }
   }
 
   public getMesh(): THREE.Group { return this.mesh; }
   public getCollisionObject(): THREE.Mesh { return this.collisionMesh; }
   public isDangerous(): boolean { return true; }
 
   public reset(): void {
     this.animationTime = 0;
-    this.kelpStrands.forEach(kelpPart => {
-        const geom = kelpPart.geometry;
-        const originalPos = geom.userData.originalPositions as THREE.BufferAttribute;
-        const currentPos = geom.attributes.position as THREE.BufferAttribute;
-        if (originalPos && currentPos) {
-            currentPos.copy(originalPos);
-            currentPos.needsUpdate = true;
-            geom.computeVertexNormals();
-        }
+    this.kelpParts.forEach(item => {
+      const geom = item.mesh.geometry;
+      const orig = item.original;
+      const curr = geom.attributes.position as THREE.BufferAttribute;
+      if (orig && curr) {
+        curr.copy(orig);
+        curr.needsUpdate = true;
+        geom.computeVertexNormals();
+      }
     });
   }
 
   public dispose(): void {
     this.mesh.traverse(child => {
       if (child instanceof THREE.Mesh) {
-        child.geometry?.dispose(); // originalPositions is on geometry, will be GC'd
+        child.geometry?.dispose();
         if (child.material instanceof THREE.Material) {
-            const mat = child.material as THREE.MeshStandardMaterial; // or Physical
-            mat.map?.dispose();
-            mat.normalMap?.dispose();
-            mat.bumpMap?.dispose();
-            // If using transmission, specific transmissionMap might need disposal if it's a texture
-            // mat.transmissionMap?.dispose(); 
-            mat.dispose();
+          const mat = child.material as THREE.MeshPhysicalMaterial;
+          mat.map?.dispose();
+          mat.normalMap?.dispose();
+          mat.bumpMap?.dispose();
+          (mat as any).transmissionMap?.dispose?.();
+          mat.dispose();
         }
       }
     });
     this.mesh.clear();
-    this.kelpStrands = [];
+    this.kelpParts = [];
   }
-}
+}
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..9cf9ddf 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -156,50 +156,54 @@ export interface SharkConfig {
 export interface SeaTurtleConfig {
   baseScale: number;          // Overall size of the turtle
   forwardSpeedFactor: number; // Multiplier of player's base forward speed
   laneChangeTelegraphTime: number; // Seconds it signals before changing lane
   laneChangeDuration: number; // Seconds to complete the lane change
   minTimeInLane: number;      // Minimum time turtle stays in a lane
   maxTimeInLane: number;      // Maximum time turtle stays in a lane
   proximityTriggerDistance: number; // Distance from player that forces a lane change
   turnAngleDegrees: number;   // How much it visually turns to indicate lane change
   visuals: ObstacleStandardMaterialVisuals & {
     shellPatternColor?: number | string, 
     skinColor?: number | string,
     shellBumpScale?: number; 
     bankFactor?: number; // Added for turn banking intensity
   };
 }
 
 // Interface for Kelp Wall obstacle configuration
 export interface KelpWallObstacleConfig {
   baseScaleY: number;         // Defines the height of the kelp strands
   strandCountMin: number;     // Min number of kelp strands in a "wall" segment
   strandCountMax: number;     // Max number of kelp strands
   segmentWidthCoverage: number; // How much of a lane or multiple lanes it covers (e.g., 1.0 for one lane, 2.0 for two)
   swayAmplitude: number;      // How much the kelp sways
   swaySpeed: number;          // Speed of the swaying animation
+  /** Optional radius for stalk geometry. */
+  stalkRadius?: number;
+  /** Optional number of fronds per stalk. */
+  frondCount?: number;
   visuals: ObstacleStandardMaterialVisuals;
 }
 
 // Interface for School of Fish obstacle configuration
 export interface SchoolOfFishObstacleConfig {
   fishCountMin: number;       // Min number of fish in a school
   fishCountMax: number;       // Max number of fish
   schoolRadius: number;       // Radius defining the general spread of the school
   individualFishScale: number; // Size of each fish
   depthCoverage: number;      // How much vertical space the school occupies (making it hard to jump)
   formation: 'swarm' | 'wall'; // Swarm is more spread out, wall is a dense vertical curtain
   baseSpeedFactor: number;    // Speed relative to player's base speed
   visuals: ObstacleStandardMaterialVisuals;
 }
 
 export interface ObstaclesConfig {
   pufferfish: PufferfishConfig; // RE-ADD
   jellyfish: JellyfishConfig;
   shark: SharkConfig;
   seaTurtle: SeaTurtleConfig;
   kelpWall: KelpWallObstacleConfig;
   schoolOfFish: SchoolOfFishObstacleConfig;
   rock: RockConfig;
   coral: CoralConfig;
   clam: ClamConfig;
 
EOF
)

5) Extended the game configuration with decoration settings for pebbles, small rocks, and clams

Added a getter for the new decoration config in ConfigurationSystem

Created PebbleAsset, SmallRockAsset, and ClamDecorAsset classes to generate simple meshes using standard materials

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/ClamDecorAsset.ts
index 0000000..2c4f8b5 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/ClamDecorAsset.ts
@@ -0,0 +1,69 @@
+import * as THREE from 'three';
+import { configSystem } from '../../core/ConfigurationSystem';
+import { DecorationItemConfig } from '../../config/gameConfig';
+
+/**
+ * Simple closed clam decoration for the seafloor.
+ */
+export class ClamDecorAsset {
+  private config: Readonly<DecorationItemConfig>;
+  private group: THREE.Group;
+
+  constructor() {
+    this.config = configSystem.getDecorationsConfig().clam;
+    this.group = new THREE.Group();
+    this.createMesh();
+  }
+
+  private randomColor(): THREE.Color {
+    const colors = this.config.colors;
+    const value = colors[Math.floor(Math.random() * colors.length)];
+    return new THREE.Color(value as any);
+  }
+
+  private createShellGeometry(size: number, top: boolean): THREE.BufferGeometry {
+    const geo = new THREE.SphereGeometry(size, 8, 8, 0, Math.PI * 2, top ? 0 : Math.PI / 2, Math.PI / 2);
+    if (top) geo.rotateX(Math.PI);
+    return geo;
+  }
+
+  private createMesh(): void {
+    const material = new THREE.MeshStandardMaterial({
+      color: this.randomColor(),
+      roughness: 0.8,
+      metalness: 0.2,
+      side: THREE.DoubleSide,
+    });
+
+    const size = 0.5;
+    const top = new THREE.Mesh(this.createShellGeometry(size, true), material);
+    const bottom = new THREE.Mesh(this.createShellGeometry(size, false), material);
+
+    top.position.y = size * 0.25;
+    bottom.position.y = -size * 0.25;
+
+    this.group.add(top, bottom);
+    this.group.name = 'ClamDecor';
+
+    const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
+    this.group.scale.setScalar(scale);
+    this.group.rotation.y = Math.random() * Math.PI * 2;
+  }
+
+  public getMesh(): THREE.Group {
+    return this.group;
+  }
+
+  public dispose(): void {
+    this.group.traverse(child => {
+      if (child instanceof THREE.Mesh) {
+        child.geometry.dispose();
+        if (child.material instanceof THREE.Material) {
+          child.material.dispose();
+        }
+      }
+    });
+    this.group.clear();
+  }
+}
+
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/PebbleAsset.ts
index 0000000..ebd9964 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/PebbleAsset.ts
@@ -0,0 +1,55 @@
+import * as THREE from 'three';
+import { configSystem } from '../../core/ConfigurationSystem';
+import { DecorationItemConfig } from '../../config/gameConfig';
+
+/**
+ * Simple decorative pebble placed on the seafloor.
+ */
+export class PebbleAsset {
+  private config: Readonly<DecorationItemConfig>;
+  private mesh: THREE.Mesh;
+
+  constructor() {
+    this.config = configSystem.getDecorationsConfig().pebble;
+    this.mesh = this.createMesh();
+  }
+
+  private randomColor(): THREE.Color {
+    const colors = this.config.colors;
+    const value = colors[Math.floor(Math.random() * colors.length)];
+    return new THREE.Color(value as any);
+  }
+
+  private createMesh(): THREE.Mesh {
+    const geometry = new THREE.SphereGeometry(0.5, 6, 6);
+    const material = new THREE.MeshStandardMaterial({
+      color: this.randomColor(),
+      roughness: 0.9,
+      metalness: 0.1,
+    });
+
+    const mesh = new THREE.Mesh(geometry, material);
+    mesh.name = 'PebbleDecor';
+
+    const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
+    mesh.scale.setScalar(scale);
+    mesh.rotation.set(
+      Math.random() * Math.PI,
+      Math.random() * Math.PI,
+      Math.random() * Math.PI,
+    );
+    return mesh;
+  }
+
+  public getMesh(): THREE.Mesh {
+    return this.mesh;
+  }
+
+  public dispose(): void {
+    this.mesh.geometry.dispose();
+    if (this.mesh.material instanceof THREE.Material) {
+      this.mesh.material.dispose();
+    }
+  }
+}
+
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/SmallRockAsset.ts
index 0000000..3bbcca8 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/SmallRockAsset.ts
@@ -0,0 +1,61 @@
+import * as THREE from 'three';
+import { configSystem } from '../../core/ConfigurationSystem';
+import { DecorationItemConfig } from '../../config/gameConfig';
+
+/**
+ * Slightly larger decorative rock for the seafloor.
+ */
+export class SmallRockAsset {
+  private config: Readonly<DecorationItemConfig>;
+  private mesh: THREE.Mesh;
+
+  constructor() {
+    this.config = configSystem.getDecorationsConfig().smallRock;
+    this.mesh = this.createMesh();
+  }
+
+  private randomColor(): THREE.Color {
+    const colors = this.config.colors;
+    const value = colors[Math.floor(Math.random() * colors.length)];
+    return new THREE.Color(value as any);
+  }
+
+  private createMesh(): THREE.Mesh {
+    const geometry = new THREE.DodecahedronGeometry(0.6, 1);
+    // Slightly roughen shape
+    const pos = geometry.attributes.position as THREE.BufferAttribute;
+    const vertex = new THREE.Vector3();
+    for (let i = 0; i < pos.count; i++) {
+      vertex.fromBufferAttribute(pos, i);
+      vertex.addScaledVector(vertex.clone().normalize(), (Math.random() - 0.5) * 0.2);
+      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
+    }
+    geometry.computeVertexNormals();
+
+    const material = new THREE.MeshStandardMaterial({
+      color: this.randomColor(),
+      roughness: 0.85,
+      metalness: 0.15,
+    });
+
+    const mesh = new THREE.Mesh(geometry, material);
+    mesh.name = 'SmallRockDecor';
+
+    const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
+    mesh.scale.setScalar(scale);
+    mesh.rotation.y = Math.random() * Math.PI * 2;
+    return mesh;
+  }
+
+  public getMesh(): THREE.Mesh {
+    return this.mesh;
+  }
+
+  public dispose(): void {
+    this.mesh.geometry.dispose();
+    if (this.mesh.material instanceof THREE.Material) {
+      this.mesh.material.dispose();
+    }
+  }
+}
+
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..94aee04 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -183,50 +183,62 @@ export interface KelpWallObstacleConfig {
 
 // Interface for School of Fish obstacle configuration
 export interface SchoolOfFishObstacleConfig {
   fishCountMin: number;       // Min number of fish in a school
   fishCountMax: number;       // Max number of fish
   schoolRadius: number;       // Radius defining the general spread of the school
   individualFishScale: number; // Size of each fish
   depthCoverage: number;      // How much vertical space the school occupies (making it hard to jump)
   formation: 'swarm' | 'wall'; // Swarm is more spread out, wall is a dense vertical curtain
   baseSpeedFactor: number;    // Speed relative to player's base speed
   visuals: ObstacleStandardMaterialVisuals;
 }
 
 export interface ObstaclesConfig {
   pufferfish: PufferfishConfig; // RE-ADD
   jellyfish: JellyfishConfig;
   shark: SharkConfig;
   seaTurtle: SeaTurtleConfig;
   kelpWall: KelpWallObstacleConfig;
   schoolOfFish: SchoolOfFishObstacleConfig;
   rock: RockConfig;
   coral: CoralConfig;
   clam: ClamConfig;
 }
 
+export interface DecorationItemConfig {
+  colors: Array<number | string>;
+  scaleMin: number;
+  scaleMax: number;
+}
+
+export interface DecorationsConfig {
+  pebble: DecorationItemConfig;
+  smallRock: DecorationItemConfig;
+  clam: DecorationItemConfig;
+}
+
 export interface VisualSettings {
   skyColor: number | string;
   ambientLightColor: number | string;
   ambientLightIntensity: number;
   directionalLightColor: number | string;
   directionalLightIntensity: number;
   directionalLightPosition: { x: number; y: number; z: number };
 
   // Fog configuration
   fogColor: number | string;
   fogNearFactor: number; // e.g., 2.0 (fog starts at 2x cameraFar/some_base_distance)
   fogFarFactor: number;  // e.g., 5.0 (fog is dense at 5x cameraFar/some_base_distance)
 
   // Caustics configuration
   enableCaustics: boolean;
   causticIntensity: number; // Modulates the brightness of caustics
   causticScale: number;     // Controls the size of the caustic patterns
   causticSpeed: number;     // Controls the animation speed of caustics
   causticColor: number | string; // Color tint for caustics
 
   // Groundwork for God Rays (parameters for future implementation)
   enableGodRays: boolean;
   godRayLightSourceOffsetY: number; // Offset Y from directional light for god ray source visual
 
   // Particle Effects
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..94aee04 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -289,50 +301,51 @@ export interface PlayerSettings {
   pectoralFinAmplitude: number; // Amplitude of pectoral fin movement
 }
 
 export interface GameConfig {
   player: PlayerSettings;
   collisions: {
     obstacleRadiusFactor: number; // Factor to scale obstacle bounding sphere radius for collision detection
   };
   world: {
     xBoundary: number;
     laneCount: number; // Number of lanes
   };
   camera: {
     offset: { x: number; y: number; z: number };
     lookAtOffset: { x: number; y: number; z: number };
     lerpFactor: number;
   };
   collectibles: {
     spawnIntervalMin: number; // Min seconds between pattern spawns
     spawnIntervalMax: number; // Max seconds
     spawnDistanceAhead: number; // How far ahead to spawn collectibles
   };
   powerUps: PowerUpsGameConfig; // Power-up configuration
   difficulty: DifficultyGameConfig; // Difficulty configuration
   obstacles: ObstaclesConfig; // Obstacle configuration
+  decorations: DecorationsConfig; // Seafloor decoration configuration
   visuals: VisualSettings; // Visual settings including lighting, fog, and caustics
 }
 
 // Default configuration values
 export const defaultConfig: GameConfig = {
   player: {
     moveSpeed: 5,
     laneWidth: 2,
     laneChangeDuration: 0.2,
     initialLives: 3,
     jumpHeight: 1.5,
     jumpDuration: 0.6,
     diveDepth: 1.0,
     diveDuration: 0.5,
     invincibilityDuration: 1.5,
     normalYPosition: 0, // Default Y, can be adjusted based on player model size
 
     // Clownfish Visuals
     clownFishBaseColor: 0xff6600, // Vibrant orange
     clownFishStripeColor: 0xffffff, // Bright white
     clownFishStripeEdgeColor: 0x111111, // Dark, thin edge for definition
     clownFishFinAccentColor: 0xffaa00, // Lighter orange/yellow for fin tips
 
     // Eye Properties
     eyePupilColor: 0x000000,
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..94aee04 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -548,50 +561,67 @@ export const defaultConfig: GameConfig = {
         transmission: 0.2,
         animationSpeed: 0.5,
         animationAmplitude: 1.0
       }
     },
     schoolOfFish: {
       fishCountMin: 30,            // Increased from 15
       fishCountMax: 50,            // Increased from 25
       schoolRadius: 1.2,           // General area they occupy
       individualFishScale: 0.25,     // Changed from 0.3 back to 0.25
       depthCoverage: 2.5,          // Vertical spread, making it hard to jump
       formation: 'wall',           // Dense wall formation
       baseSpeedFactor: 0.9,        // Slightly slower than player
       visuals: { 
         mainColor: 0xFF8C00,    // DarkOrange (changed from 0xA0B0C0)
         detailColor: 0xFFA500,  // Orange (changed from 0xB0C0D0)
         emissiveColor: 0xFF7000, // Adjusted emissive to match orange theme
         emissiveIntensity: 0.15, 
         roughness: 0.4,          // Values from SchoolOfFishAsset's defaults
         metalness: 0.4,          // Values from SchoolOfFishAsset's defaults
         animationSpeed: 3.0,
         animationAmplitude: 0.5
       }
     }
   },
+  decorations: {
+    pebble: {
+      colors: [0x888888, 0x777777],
+      scaleMin: 0.1,
+      scaleMax: 0.3
+    },
+    smallRock: {
+      colors: [0x666666, 0x555555],
+      scaleMin: 0.3,
+      scaleMax: 0.6
+    },
+    clam: {
+      colors: [0xD8C0A8, 0xE0D0B0],
+      scaleMin: 0.4,
+      scaleMax: 0.7
+    }
+  },
   visuals: {
     skyColor: 0x1a2b3c, // Darker blue for underwater
     ambientLightColor: 0x406080, // Bluish ambient
     ambientLightIntensity: 0.4,
     directionalLightColor: 0xa0c0ff, // Lighter blue/white sunlight from above
     directionalLightIntensity: 0.8,
     directionalLightPosition: { x: 0.5, y: 1, z: 0.3 }, // More overhead
 
     // Fog parameters
     fogColor: 0x1a2b3c, // Match sky/background for seamless blend
     fogNearFactor: 1.5,  // Start fog relatively close to player camera's Z offset
     fogFarFactor: 6.0,   // Fog becomes dense further out
 
     enableCaustics: true,
     causticIntensity: 0.25,
     causticScale: 8.0, // Larger scale for broader patterns
     causticSpeed: 0.05,
     causticColor: 0x90c0ff, // Light blue caustics
 
     enableGodRays: false, // Disabled for Phase 1 initial, focus on caustics
     godRayLightSourceOffsetY: 10,
 
     // Particle Effects
     enableParticles: true,
     bubblesEnabled: true,
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/core/ConfigurationSystem.ts b/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
index 9720b51..179d6fb 100644
--- a/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
+++ b/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
@@ -80,29 +80,34 @@ class ConfigurationSystem {
   public getPlayerJumpDuration(): number {
     return this.config.player.jumpDuration;
   }
 
   public getPlayerDiveDepth(): number {
     return this.config.player.diveDepth;
   }
 
   public getPlayerDiveDuration(): number {
     return this.config.player.diveDuration;
   }
 
   public getPlayerInitialLives(): number {
     return this.config.player.initialLives;
   }
 
   // Collision getters
   public getObstacleRadiusFactor(): number {
     return this.config.collisions.obstacleRadiusFactor;
   }
 
   // Obstacles config getter
   public getObstaclesConfig(): Readonly<GameConfig['obstacles']> {
     return this.config.obstacles;
   }
+
+  // Decorations config getter
+  public getDecorationsConfig(): Readonly<GameConfig['decorations']> {
+    return this.config.decorations;
+  }
 }
 
 // Export a singleton instance for easy access throughout the game
 export const configSystem = new ConfigurationSystem(); 
 
EOF
)

6) Made the seafloor mesh creation asynchronous in SeafloorAsset, preparing it for future texture loading work

Provided a new accessor in the factory so other systems can fetch the existing seafloor generator instance

Added helper methods in the factory for new decorative environment assets like water surfaces, pebbles, rocks, and clams

Created simple implementations for WaterSurfaceAsset, PebbleAsset, SmallRockAsset, and ClamDecorAsset

Updated EnvironmentManager to await asynchronous segment creation during initialization

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
index 0d503e7..e76c37a 100644
--- a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
+++ b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
@@ -1,114 +1,122 @@
 import * as THREE from 'three';
 import { ShaderManager, MaterialType } from '../services/ShaderManager';
 import { SeafloorAsset } from './environment/SeafloorAsset';
+import { WaterSurfaceAsset } from './environment/WaterSurfaceAsset';
+import { PebbleAsset } from './environment/PebbleAsset';
+import { SmallRockAsset } from './environment/SmallRockAsset';
+import { ClamDecorAsset } from './environment/ClamDecorAsset';
 import { CoralAsset } from './obstacles/CoralAsset';
 import { RockAsset } from './obstacles/RockAsset';
 import { ClamAsset } from './obstacles/ClamAsset';
 import { PufferfishAsset } from './obstacles/PufferfishAsset';
 import { JellyfishAsset } from './obstacles/JellyfishAsset';
 import { SharkAsset } from './obstacles/SharkAsset';
 import { SeaTurtleAsset } from './obstacles/SeaTurtleAsset';
 import { KelpWallAsset } from './obstacles/KelpWallAsset';
 import { SchoolOfFishAsset } from './obstacles/SchoolOfFishAsset';
 import { BubbleAsset } from './collectibles/BubbleAsset';
 import { CoinAsset } from './collectibles/CoinAsset';
 import { ShieldPowerUpAsset } from './powerups/ShieldPowerUpAsset';
 import { MagnetPowerUpAsset } from './powerups/MagnetPowerUpAsset';
 import { DoubleScorePowerUpAsset } from './powerups/DoubleScorePowerUpAsset';
 import { ClownfishAsset } from './character/ClownfishAsset';
 
 // Define a union type for all obstacle asset classes
 export type ObstacleAssetType = CoralAsset | RockAsset | ClamAsset | PufferfishAsset | JellyfishAsset | SharkAsset | SeaTurtleAsset | KelpWallAsset | SchoolOfFishAsset;
 export type AnyObstacleTypeString = 'coral' | 'rock' | 'clam' | 'pufferfish' | 'jellyfish' | 'shark' | 'seaTurtle' | 'kelpWall' | 'schoolOfFish';
 
 export class ProceduralAssetFactory {
   private shaderManager: ShaderManager;
   private seafloorAssetGenerator: SeafloorAsset;
   private coralAssetGenerator: CoralAsset;
   private rockAssetGenerator: RockAsset;
   private clamAssetGenerator: ClamAsset;
   private pufferfishAssetGenerator: PufferfishAsset;
   private jellyfishAssetGenerator: JellyfishAsset;
   private bubbleAssetGenerator: BubbleAsset;
   private coinAssetGenerator: CoinAsset;
   private clownfishAssetGenerator: ClownfishAsset; // Add clownfish asset generator
+  private waterSurfaceAsset?: WaterSurfaceAsset;
+  private pebbleAssetGenerator?: PebbleAsset;
+  private smallRockAssetGenerator?: SmallRockAsset;
+  private clamDecorAssetGenerator?: ClamDecorAsset;
 
   constructor(shaderManager: ShaderManager) {
     this.shaderManager = shaderManager;
     
     // Initialize asset generators
     this.seafloorAssetGenerator = new SeafloorAsset(this.shaderManager);
     
     // Initialize updated assets that don't need ShaderManager
     try {
       this.rockAssetGenerator = new RockAsset();
       this.coralAssetGenerator = new CoralAsset();
       this.clamAssetGenerator = new ClamAsset();
       this.jellyfishAssetGenerator = new JellyfishAsset();
       this.pufferfishAssetGenerator = new PufferfishAsset(); // Corrected initialization
     } catch (error) {
       console.error("Error initializing updated asset generators:", error);
       // Create empty placeholders if initialization fails
       // These will be created on-demand in createObstacle
       this.rockAssetGenerator = null as any;
       this.coralAssetGenerator = null as any;
       this.clamAssetGenerator = null as any;
       this.jellyfishAssetGenerator = null as any;
       this.pufferfishAssetGenerator = null as any; // Also ensure placeholder on error
     }
     
     // Assets still using ShaderManager
     // We use any to bypass type checking since we're in a transition period
     // this.pufferfishAssetGenerator = new PufferfishAsset(this.shaderManager as any); // This line is now handled above
     this.bubbleAssetGenerator = new BubbleAsset(this.shaderManager);
     this.coinAssetGenerator = new CoinAsset(this.shaderManager);
     this.clownfishAssetGenerator = new ClownfishAsset(this.shaderManager);
     
     console.log("ProceduralAssetFactory: Initialized with new obstacles and clownfish player.");
   }
 
   public createPlayerMesh(): THREE.Group {
     // Create or retrieve a clownfish asset and return its mesh
     return this.clownfishAssetGenerator.getMesh();
   }
   
   /**
    * Creates a new clownfish asset instance
    * @returns A new ClownfishAsset instance
    */
   public createClownfishAsset(): ClownfishAsset {
     return new ClownfishAsset(this.shaderManager);
   }
 
-  public createSeafloorSegmentMesh(): THREE.Mesh {
+  public async createSeafloorSegmentMesh(): Promise<THREE.Mesh> {
     // Create a new instance of SeafloorAsset if needed to avoid potential issues
     if (!this.seafloorAssetGenerator) {
       this.seafloorAssetGenerator = new SeafloorAsset(this.shaderManager);
     }
     // Create and return the mesh
-    const mesh = this.seafloorAssetGenerator.createMesh();
+    const mesh = await this.seafloorAssetGenerator.createMesh();
     return mesh;
   }
 
   public createObstacleMesh(type: AnyObstacleTypeString): THREE.Mesh | THREE.Group {
     try {
       switch (type) {
         case 'coral':
           // Ensure we have a valid generator
           if (!this.coralAssetGenerator) {
             this.coralAssetGenerator = new CoralAsset();
           }
           return this.coralAssetGenerator.getMesh();
         case 'rock':
           // Ensure we have a valid generator
           if (!this.rockAssetGenerator) {
             this.rockAssetGenerator = new RockAsset();
           }
           return this.rockAssetGenerator.getMesh();
         case 'clam':
           // Ensure we have a valid generator
           if (!this.clamAssetGenerator) {
             this.clamAssetGenerator = new ClamAsset();
           }
           return this.clamAssetGenerator.getMesh();
         case 'jellyfish':
diff --git a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
index 0d503e7..e76c37a 100644
--- a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
+++ b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
@@ -248,69 +256,101 @@ export class ProceduralAssetFactory {
   }
 
   // Later: createObstacleMesh(type), createCollectibleMesh(type), etc.
 
   public dispose(): void {
     // Make sure to dispose any asset generators that have their own dispose methods
     // This is critical for assets that hold their own materials or WebGL resources
     if (this.seafloorAssetGenerator && typeof this.seafloorAssetGenerator.dispose === 'function') {
       this.seafloorAssetGenerator.dispose();
     }
 
     // Add dispose calls for any other asset generators that implement dispose()
     // For future maintenance
 
     console.log("ProceduralAssetFactory: Disposed.");
   }
 
   public get seafloorSegmentLength(): number {
     return this.seafloorAssetGenerator.segmentLength;
   }
 
   public get seafloorAsset(): SeafloorAsset {
     return this.seafloorAssetGenerator;
   }
 
+  public getSeafloorAssetGenerator(): SeafloorAsset {
+    return this.seafloorAssetGenerator;
+  }
+
   // Methods for collectibles - used by CollectibleManager for instanced rendering
   public getCollectibleGeometry(type: 'bubble' | 'coin'): THREE.BufferGeometry {
     return type === 'bubble'
       ? this.bubbleAssetGenerator.getGeometry()
       : this.coinAssetGenerator.getGeometry();
   }
 
   public getCollectibleMaterial(type: 'bubble' | 'coin'): THREE.Material {
     return type === 'bubble'
       ? this.bubbleAssetGenerator.getMaterial()
       : this.coinAssetGenerator.getMaterial();
   }
 
   public getCollectibleScoreValue(type: 'bubble' | 'coin'): number {
     return type === 'bubble'
       ? this.bubbleAssetGenerator.scoreValue
       : this.coinAssetGenerator.scoreValue;
   }
 
+  public getWaterSurfaceAsset(): WaterSurfaceAsset {
+    if (!this.waterSurfaceAsset) {
+      this.waterSurfaceAsset = new WaterSurfaceAsset();
+    }
+    return this.waterSurfaceAsset;
+  }
+
+  public getPebbleMesh(): THREE.Mesh {
+    if (!this.pebbleAssetGenerator) {
+      this.pebbleAssetGenerator = new PebbleAsset();
+    }
+    return this.pebbleAssetGenerator.createMesh();
+  }
+
+  public getSmallRockMesh(): THREE.Mesh {
+    if (!this.smallRockAssetGenerator) {
+      this.smallRockAssetGenerator = new SmallRockAsset();
+    }
+    return this.smallRockAssetGenerator.createMesh();
+  }
+
+  public getClamDecorMesh(): THREE.Mesh {
+    if (!this.clamDecorAssetGenerator) {
+      this.clamDecorAssetGenerator = new ClamDecorAsset();
+    }
+    return this.clamDecorAssetGenerator.createMesh();
+  }
+
   /**
    * Creates a power-up mesh of the specified type at the given position
    * @param type The type of power-up to create
    * @param position The position of the power-up
    * @returns The power-up asset
    */
   public createPowerUpAsset(type: 'shield' | 'magnet' | 'doublescore', position: THREE.Vector3): ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset {
     let powerUpAsset: ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset;
 
     switch (type) {
       case 'shield':
         powerUpAsset = new ShieldPowerUpAsset(position);
         break;
       case 'magnet':
         powerUpAsset = new MagnetPowerUpAsset(position);
         break;
       case 'doublescore':
         powerUpAsset = new DoubleScorePowerUpAsset(position);
         break;
       default:
         console.warn(`ProceduralAssetFactory: Unknown power-up type "${type}". Creating shield as fallback.`);
         powerUpAsset = new ShieldPowerUpAsset(position);
     }
 
     // Ensure the mesh has proper userData for type identification by collision system
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/ClamDecorAsset.ts
index 0000000..8f37be7 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/ClamDecorAsset.ts
@@ -0,0 +1,28 @@
+import * as THREE from 'three';
+
+export class ClamDecorAsset {
+  private geometry: THREE.BufferGeometry;
+  private material: THREE.MeshStandardMaterial;
+
+  constructor() {
+    this.geometry = new THREE.ConeGeometry(0.4, 0.3, 12, 1, true);
+    this.material = new THREE.MeshStandardMaterial({
+      color: 0xccbbaa,
+      roughness: 0.7,
+      metalness: 0.2,
+      side: THREE.DoubleSide,
+    });
+  }
+
+  public createMesh(): THREE.Mesh {
+    const mesh = new THREE.Mesh(this.geometry, this.material);
+    mesh.rotation.x = Math.PI;
+    mesh.name = 'ClamDecor';
+    return mesh;
+  }
+
+  public dispose(): void {
+    this.geometry.dispose();
+    this.material.dispose();
+  }
+}
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/PebbleAsset.ts
index 0000000..6a87579 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/PebbleAsset.ts
@@ -0,0 +1,27 @@
+import * as THREE from 'three';
+
+export class PebbleAsset {
+  private geometry: THREE.BufferGeometry;
+  private material: THREE.MeshStandardMaterial;
+
+  constructor() {
+    this.geometry = new THREE.SphereGeometry(0.2, 8, 6);
+    this.material = new THREE.MeshStandardMaterial({
+      color: 0x666666,
+      roughness: 0.8,
+      metalness: 0.2,
+    });
+  }
+
+  public createMesh(): THREE.Mesh {
+    const mesh = new THREE.Mesh(this.geometry, this.material);
+    mesh.name = 'PebbleDecor';
+    mesh.rotation.y = Math.random() * Math.PI * 2;
+    return mesh;
+  }
+
+  public dispose(): void {
+    this.geometry.dispose();
+    this.material.dispose();
+  }
+}
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index 2ac0aff..8b8c533 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -10,51 +10,51 @@ export class SeafloorAsset {
   public segmentLength: number; // Depth along Z
   private useCaustics: boolean;
   private seafloorMaterial: THREE.Material | null = null;
 
   constructor(shaderManager: ShaderManager) {
     this.shaderManager = shaderManager;
     // Dimensions for a single seafloor segment
     // Could also come from configSystem if more complex
     this.segmentWidth = configSystem.getWorldXBoundary() * 2 + configSystem.getPlayerLaneWidth() * 3; // Rough estimate
     this.segmentLength = 20; // Example length
     this.useCaustics = configSystem.get('visuals').enableCaustics;
   }
 
   /**
    * Links the LightingManager to enable caustic effects on seafloor
    * @param lightingManager The game's LightingManager instance
    */
   public linkLightingManager(lightingManager: LightingManager): void {
     this.lightingManager = lightingManager;
     console.log("SeafloorAsset: Linked with LightingManager for caustic effects");
   }
 
   /**
    * Creates a seafloor segment mesh with proper material and shaders
    */
-  public createMesh(): THREE.Mesh {
+  public async createMesh(): Promise<THREE.Mesh> {
     // If we have a LightingManager and caustics are enabled, use it to create the seafloor
     if (this.lightingManager && this.useCaustics) {
       return this.lightingManager.createCausticSeafloor(this.segmentWidth, this.segmentLength);
     }
 
     // Otherwise, use the legacy approach
     const geometry = new THREE.PlaneGeometry(this.segmentWidth, this.segmentLength, 32, 32);
     // Rotate plane to be horizontal
     geometry.rotateX(-Math.PI / 2);
 
     // Use cached material if it exists to prevent shader recompilation issues
     if (!this.seafloorMaterial) {
       try {
         // Create basic material with simple blue color - no shaders
         this.seafloorMaterial = new THREE.MeshStandardMaterial({
           color: 0x335599,
           side: THREE.DoubleSide,
           roughness: 0.8,
           metalness: 0.2
         });
         console.log("SeafloorAsset: Created fallback standard material for seafloor");
       } catch (error) {
         console.warn("SeafloorAsset: Error creating material, using most basic fallback", error);
         // Ultimate fallback - if even MeshStandardMaterial fails
         this.seafloorMaterial = new THREE.MeshBasicMaterial({
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/SmallRockAsset.ts
index 0000000..2685764 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/SmallRockAsset.ts
@@ -0,0 +1,36 @@
+import * as THREE from 'three';
+
+export class SmallRockAsset {
+  private geometry: THREE.BufferGeometry;
+  private material: THREE.MeshStandardMaterial;
+
+  constructor() {
+    const radius = 0.4 + Math.random() * 0.2;
+    this.geometry = new THREE.IcosahedronGeometry(radius, 1);
+    const pos = this.geometry.attributes.position;
+    const v = new THREE.Vector3();
+    for (let i = 0; i < pos.count; i++) {
+      v.fromBufferAttribute(pos, i);
+      v.addScaledVector(v.clone().normalize(), (Math.random() - 0.5) * 0.1);
+      pos.setXYZ(i, v.x, v.y, v.z);
+    }
+    this.geometry.computeVertexNormals();
+    this.material = new THREE.MeshStandardMaterial({
+      color: 0x555555,
+      roughness: 0.9,
+      metalness: 0.1,
+    });
+  }
+
+  public createMesh(): THREE.Mesh {
+    const mesh = new THREE.Mesh(this.geometry, this.material);
+    mesh.name = 'SmallRockDecor';
+    mesh.rotation.y = Math.random() * Math.PI * 2;
+    return mesh;
+  }
+
+  public dispose(): void {
+    this.geometry.dispose();
+    this.material.dispose();
+  }
+}
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
index 0000000..d31d86a 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
@@ -0,0 +1,35 @@
+import * as THREE from 'three';
+
+export class WaterSurfaceAsset {
+  public mesh: THREE.Mesh;
+  private material: THREE.MeshPhysicalMaterial;
+
+  constructor() {
+    this.material = new THREE.MeshPhysicalMaterial({
+      color: 0x87cefa,
+      roughness: 0.05,
+      metalness: 0.1,
+      transmission: 0.9,
+      transparent: true,
+      opacity: 0.7,
+      side: THREE.BackSide,
+    });
+    const geometry = new THREE.PlaneGeometry(200, 200, 1, 1);
+    this.mesh = new THREE.Mesh(geometry, this.material);
+    this.mesh.rotation.x = -Math.PI / 2;
+    this.mesh.name = 'WaterSurface';
+  }
+
+  public update(_delta: number, elapsed: number): void {
+    if (this.material.userData.shader && this.material.userData.shader.uniforms?.uTime) {
+      this.material.userData.shader.uniforms.uTime.value = elapsed;
+    }
+  }
+
+  public getMesh(): THREE.Mesh { return this.mesh; }
+
+  public dispose(): void {
+    this.mesh.geometry.dispose();
+    this.material.dispose();
+  }
+}
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index cf9921b..6067984 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -6,58 +6,58 @@ import { ConfigurationSystem, configSystem } from '../core/ConfigurationSystem';
 interface EnvironmentSegment {
   mesh: THREE.Mesh;
   isActive: boolean;
 }
 
 export class EnvironmentManager {
   private scene: THREE.Scene;
   private assetFactory: ProceduralAssetFactory;
   // private playerController: PlayerController; // To track player's Z position
 
   private segments: EnvironmentSegment[] = [];
   private segmentPoolSize = 5; // Number of segments to pool
   private segmentLength = 20; // Must match SeafloorAsset.segmentLength or get from asset
   private lastSegmentZ = 0; // Z position of the front edge of the furthest segment
 
   private visibleSegmentsFront = 2; // How many segments to keep ahead of player
   private visibleSegmentsBehind = 1; // How many segments to keep behind player
 
   constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory /*, playerController: PlayerController */) {
     this.scene = scene;
     this.assetFactory = assetFactory;
     // this.playerController = playerController;
 
     // Get segmentLength from the assetFactory's public getter
     this.segmentLength = assetFactory.seafloorSegmentLength;
-
-    this.initializeSegments();
-    console.log("EnvironmentManager: Initialized.");
+    this.initializeSegments().then(() => {
+      console.log("EnvironmentManager: Initialized.");
+    });
   }
 
-  private initializeSegments(): void {
+  private async initializeSegments(): Promise<void> {
     for (let i = 0; i < this.segmentPoolSize; i++) {
-      const mesh = this.assetFactory.createSeafloorSegmentMesh();
+      const mesh = await this.assetFactory.createSeafloorSegmentMesh();
       mesh.visible = false; // Initially hide
       this.scene.add(mesh);
       this.segments.push({ mesh, isActive: false });
     }
     // Position initial segments
     for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
         this.spawnSegmentAhead(true); // true to force spawn at specific positions
     }
   }
   
   // Helper to get an inactive segment from the pool
   private getInactiveSegment(): EnvironmentSegment | undefined {
     return this.segments.find(seg => !seg.isActive);
   }
 
   // Spawns a segment at the front of the current environment path
   private spawnSegmentAhead(initialSpawn = false): void {
     const segment = this.getInactiveSegment();
     if (segment) {
       segment.isActive = true;
       segment.mesh.visible = true;
       
       // Position new segment ahead of the last one
       // The plane's origin is at its center. We want to place them edge-to-edge.
       // If lastSegmentZ is the Z of the *center* of the furthest segment:
 
EOF
)

7) Added water surface integration and decoration pools with initialization of segments and asset pools

Spawned decorations for each segment and recycled them properly with the segment lifecycle

Implemented a simple WaterSurfaceAsset for animated surface effects

Exposed the shader manager from ProceduralAssetFactory for use by new assets

Updated GameEngine to await environment initialization and pass elapsed time to updates

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/components/game/GameCanvas.tsx b/nemo-runner/src/components/game/GameCanvas.tsx
index 40c2e32..008c7e9 100644
--- a/nemo-runner/src/components/game/GameCanvas.tsx
+++ b/nemo-runner/src/components/game/GameCanvas.tsx
@@ -345,54 +345,55 @@ export default function GameCanvas() {
         },
         onActivePowerUpsUpdate: (powerUps) => setActivePowerUps(powerUps)
       });
 
       // Expose for debug helpers
       // @ts-ignore
       window.__gameEngine = engine;
       gameEngineRef.current = engine;
 
       // Add WebGL context error listeners to the canvas
       const canvas = canvasMountRef.current.querySelector('canvas');
       if (canvas) {
         canvas.addEventListener('webglcontextlost', handleWebGLError, false);
         canvas.addEventListener('webglcontexterror', handleWebGLError, false);
       }
 
       // Set up screen flash callback for hit effects
       const vfxService = engine.getVisualEffectsService?.();
       if (vfxService) {
         vfxService.setFlashCallback((color: string, duration: number) => {
           setScreenFlash({ color, duration, key: Date.now() }); // Use key for unique state updates
           setTimeout(() => setScreenFlash(null), duration);
         });
       }
 
-      engine.initialize();
-      engine.start();
-      setIsLoading(false);
-      console.log("GameCanvas: GameEngine started.");
+      engine.initialize().then(() => {
+        engine.start();
+        setIsLoading(false);
+        console.log("GameCanvas: GameEngine started.");
+      });
 
       const handleResize = () => {
         if (gameEngineRef.current) {
           gameEngineRef.current.handleResize();
         }
       };
 
       window.addEventListener('resize', handleResize);
 
       return () => {
         // Check if this cleanup is due to Fast Refresh or actual unmount
         const isFastRefresh = isHotReloadingRef.current;
 
         console.log(`GameCanvas: Cleaning up GameEngine... (Fast Refresh: ${isFastRefresh})`);
 
         // Always remove event listeners
         window.removeEventListener('resize', handleResize);
 
         // Remove WebGL context event listeners
         if (canvas) {
           canvas.removeEventListener('webglcontextlost', handleWebGLError);
           canvas.removeEventListener('webglcontexterror', handleWebGLError);
         }
 
         if (gameEngineRef.current) {
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/GameEngine.ts b/nemo-runner/src/lib/game/GameEngine.ts
index f2427ba..5191e0d 100644
--- a/nemo-runner/src/lib/game/GameEngine.ts
+++ b/nemo-runner/src/lib/game/GameEngine.ts
@@ -55,51 +55,51 @@ export class GameEngine {
   private shaderManager!: ShaderManager;
   private lightingManager!: LightingManager;
   private visualEffectsService!: VisualEffectsService;
   private assetFactory!: ProceduralAssetFactory;
   private environmentManager!: EnvironmentManager;
   private obstacleManager!: ObstacleManager;
   private collectibleManager!: CollectibleManager;
   private powerUpManager!: PowerUpManager;
   private scoringSystem!: ScoringSystem;
   private collisionSystem!: CollisionDetectionSystem;
   private difficultyManager!: DifficultyManager;
 
   private animationFrameId?: number;
   private isRunning: boolean = false;
   private lastTimestamp: number = 0;
   private currentState: GameState = GameState.LOADING;
 
   private contextLostHandler: ((event: WebGLContextEvent) => void) | null = null;
   private contextRestoredHandler: ((event: WebGLContextEvent) => void) | null = null;
 
   constructor(mountElement: HTMLDivElement, callbacks: GameEngineCallbacks = {}) {
     this.mountElement = mountElement;
     this.callbacks = callbacks;
   }
 
-  public initialize(): void {
+  public async initialize(): Promise<void> {
     try {
       // Scene
       this.scene = new THREE.Scene();
       this.scene.background = new THREE.Color(0x1a2b3c);
 
       // Camera
       const aspectRatio = this.mountElement.clientWidth / this.mountElement.clientHeight;
       this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
 
       // Renderer
       this.renderer = new THREE.WebGLRenderer({
         antialias: true,
         powerPreference: "high-performance", // Prefer higher performance
         preserveDrawingBuffer: false // Better performance
       });
       this.renderer.setSize(this.mountElement.clientWidth, this.mountElement.clientHeight);
       this.renderer.setPixelRatio(window.devicePixelRatio);
       this.mountElement.appendChild(this.renderer.domElement);
 
       // Set up WebGL context loss/restore handlers
       this.setupWebGLContextHandlers();
 
       this.renderManager = new RenderManager(this.scene, this.camera, this.renderer);
 
       // ShaderManager for assets and lighting effects
diff --git a/nemo-runner/src/lib/game/GameEngine.ts b/nemo-runner/src/lib/game/GameEngine.ts
index f2427ba..5191e0d 100644
--- a/nemo-runner/src/lib/game/GameEngine.ts
+++ b/nemo-runner/src/lib/game/GameEngine.ts
@@ -117,50 +117,51 @@ export class GameEngine {
         this.shaderManager, 
         this.renderManager
       );
 
       // Register the test pattern shader
       this.shaderManager.registerShader({
         name: 'testPatternShader',
         vertexShaderSource: testPatternVertex,
         fragmentShaderSource: testPatternFragment,
         defaultUniforms: () => ({ // Function to return fresh uniform objects
           uBaseColor: { value: new THREE.Color(0x00ffff) }, // Cyan base color
         }),
         materialParameters: {
           transparent: false,
           side: THREE.FrontSide
         }
       });
 
       this.assetFactory = new ProceduralAssetFactory(this.shaderManager);
 
       // Link the LightingManager to the SeafloorAsset for caustic effects
       this.assetFactory.seafloorAsset.linkLightingManager(this.lightingManager);
 
       // EnvironmentManager
       this.environmentManager = new EnvironmentManager(this.scene, this.assetFactory);
+      await this.environmentManager.initialize();
 
       // Player Controller
       this.playerController = new PlayerController(this.scene, this.assetFactory, this);
 
       // CameraManager (after playerController)
       this.cameraManager = new CameraManager(this.camera, this.playerController);
       
       // Update CameraManager link for VisualEffectsService since it was created after CameraManager
       this.visualEffectsService.linkCameraManager(this.cameraManager);
 
       // Notify UI of initial lives count
       this.callbacks.onLivesUpdate?.(this.playerController.lives);
 
       // Input Handler
       this.inputHandler = new InputHandler(this.playerController);
       this.inputHandler.initialize();
 
       // ObstacleManager
       this.obstacleManager = new ObstacleManager(this.scene, this.assetFactory);
 
       // Link PlayerController to ObstacleManager for proximity-based behaviors
       this.obstacleManager.linkPlayerController(this.playerController);
 
       // ScoringSystem and CollectibleManager
       this.scoringSystem = new ScoringSystem();
diff --git a/nemo-runner/src/lib/game/GameEngine.ts b/nemo-runner/src/lib/game/GameEngine.ts
index f2427ba..5191e0d 100644
--- a/nemo-runner/src/lib/game/GameEngine.ts
+++ b/nemo-runner/src/lib/game/GameEngine.ts
@@ -231,51 +232,51 @@ export class GameEngine {
     if (this.animationFrameId) {
       cancelAnimationFrame(this.animationFrameId);
     }
     console.log("GameEngine: Stopped.");
   }
 
   private gameLoop(timestamp: number = performance.now()): void {
     if (!this.isRunning) {
       if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
       this.animationFrameId = undefined;
       return;
     }
     const deltaTime = (timestamp - this.lastTimestamp) / 1000;
     this.lastTimestamp = timestamp;
     const dt = Math.min(deltaTime, 0.1);
     if (this.currentState === GameState.PLAYING) {
       this.inputHandler.update(dt);
       this.playerController.update(dt);
 
       // Get current distance for difficulty scaling
       const currentDistance = this.scoringSystem.totalDistanceTraveled;
 
       // Update difficulty based on player's distance
       this.difficultyManager.update(dt, currentDistance);
 
-      this.environmentManager.update(dt, this.playerController.mesh.position.z);
+      this.environmentManager.update(dt, this.playerController.mesh.position.z, timestamp / 1000);
       this.obstacleManager.update(dt, this.playerController.mesh.position.z);
       this.collectibleManager.update(dt, this.playerController.mesh.position.z);
 
       // Update lighting and caustic effects
       this.lightingManager.update(dt, timestamp / 1000);
       
       // Update visual effects (particles and post-processing)
       this.visualEffectsService.update(dt, timestamp / 1000, this.playerController.mesh.position);
 
       // Update forward speed for power-ups
       this.powerUpManager.setGameSpeed(this.playerController.getForwardSpeed());
       // Fix: Pass player's Z position to powerUpManager.update
       this.powerUpManager.update(dt, this.playerController.mesh.position.z);
 
       // Update score based on distance
       const distanceTraveled = dt * this.playerController.getForwardSpeed();
       this.scoringSystem.update(dt, distanceTraveled);
 
       // Update UI with active power-ups
       if (this.callbacks.onActivePowerUpsUpdate) {
         const activePowerUps = this.powerUpManager.getActiveEffectsForUI();
         this.callbacks.onActivePowerUpsUpdate(activePowerUps);
       }
 
       // Update shader global uniforms (time, resolution)
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
index 0d503e7..734e5d7 100644
--- a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
+++ b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
@@ -267,50 +267,57 @@ export class ProceduralAssetFactory {
   }
 
   public get seafloorAsset(): SeafloorAsset {
     return this.seafloorAssetGenerator;
   }
 
   // Methods for collectibles - used by CollectibleManager for instanced rendering
   public getCollectibleGeometry(type: 'bubble' | 'coin'): THREE.BufferGeometry {
     return type === 'bubble'
       ? this.bubbleAssetGenerator.getGeometry()
       : this.coinAssetGenerator.getGeometry();
   }
 
   public getCollectibleMaterial(type: 'bubble' | 'coin'): THREE.Material {
     return type === 'bubble'
       ? this.bubbleAssetGenerator.getMaterial()
       : this.coinAssetGenerator.getMaterial();
   }
 
   public getCollectibleScoreValue(type: 'bubble' | 'coin'): number {
     return type === 'bubble'
       ? this.bubbleAssetGenerator.scoreValue
       : this.coinAssetGenerator.scoreValue;
   }
 
+  /**
+   * Exposes the internal ShaderManager instance
+   */
+  public getShaderManager(): ShaderManager {
+    return this.shaderManager;
+  }
+
   /**
    * Creates a power-up mesh of the specified type at the given position
    * @param type The type of power-up to create
    * @param position The position of the power-up
    * @returns The power-up asset
    */
   public createPowerUpAsset(type: 'shield' | 'magnet' | 'doublescore', position: THREE.Vector3): ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset {
     let powerUpAsset: ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset;
 
     switch (type) {
       case 'shield':
         powerUpAsset = new ShieldPowerUpAsset(position);
         break;
       case 'magnet':
         powerUpAsset = new MagnetPowerUpAsset(position);
         break;
       case 'doublescore':
         powerUpAsset = new DoubleScorePowerUpAsset(position);
         break;
       default:
         console.warn(`ProceduralAssetFactory: Unknown power-up type "${type}". Creating shield as fallback.`);
         powerUpAsset = new ShieldPowerUpAsset(position);
     }
 
     // Ensure the mesh has proper userData for type identification by collision system
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
index 0000000..9105e42 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
@@ -0,0 +1,58 @@
+import * as THREE from 'three';
+import { ShaderManager } from '../../services/ShaderManager';
+
+export class WaterSurfaceAsset {
+  private material: THREE.MeshPhysicalMaterial;
+  private mesh: THREE.Mesh;
+
+  constructor(shaderManager: ShaderManager) {
+    const geometry = new THREE.PlaneGeometry(200, 200, 32, 32);
+    this.material = new THREE.MeshPhysicalMaterial({
+      color: new THREE.Color(0x87cefa),
+      roughness: 0.05,
+      metalness: 0.1,
+      transmission: 0.9,
+      transparent: true,
+      opacity: 0.7,
+      side: THREE.BackSide,
+    });
+
+    this.material.onBeforeCompile = (shader) => {
+      shader.uniforms.uTime = { value: 0 };
+      shader.vertexShader =
+        'uniform float uTime;\n' +
+        'varying vec3 vWorldPosition_WaterSurface;\n' +
+        shader.vertexShader;
+      shader.vertexShader = shader.vertexShader.replace(
+        '#include <begin_vertex>',
+        `#include <begin_vertex>
+         vWorldPosition_WaterSurface = (modelMatrix * vec4(position, 1.0)).xyz;`
+      );
+      shader.fragmentShader =
+        'uniform float uTime;\n' +
+        'varying vec3 vWorldPosition_WaterSurface;\n' +
+        shader.fragmentShader;
+      (this.material as any).userData.shader = shader;
+    };
+
+    this.mesh = new THREE.Mesh(geometry, this.material);
+    this.mesh.rotation.x = -Math.PI / 2;
+    this.mesh.name = 'WaterSurface';
+  }
+
+  public update(deltaTime: number, elapsedTime: number): void {
+    const shader = (this.material as any).userData.shader;
+    if (shader && shader.uniforms.uTime) {
+      shader.uniforms.uTime.value = elapsedTime;
+    }
+  }
+
+  public getMesh(): THREE.Mesh {
+    return this.mesh;
+  }
+
+  public dispose(): void {
+    this.mesh.geometry.dispose();
+    this.material.dispose();
+  }
+}
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index cf9921b..e13616d 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -1,147 +1,282 @@
 import * as THREE from 'three';
 import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
 import { ConfigurationSystem, configSystem } from '../core/ConfigurationSystem';
+import { WaterSurfaceAsset } from '../assets/environment/WaterSurfaceAsset';
 // import { PlayerController } from './PlayerController'; // Will need later for player position
 
 interface EnvironmentSegment {
   mesh: THREE.Mesh;
   isActive: boolean;
+  decorations: THREE.Object3D[];
 }
 
 export class EnvironmentManager {
   private scene: THREE.Scene;
   private assetFactory: ProceduralAssetFactory;
   // private playerController: PlayerController; // To track player's Z position
 
   private segments: EnvironmentSegment[] = [];
   private segmentPoolSize = 5; // Number of segments to pool
   private segmentLength = 20; // Must match SeafloorAsset.segmentLength or get from asset
+  private segmentWidth = 10;
   private lastSegmentZ = 0; // Z position of the front edge of the furthest segment
 
   private visibleSegmentsFront = 2; // How many segments to keep ahead of player
   private visibleSegmentsBehind = 1; // How many segments to keep behind player
 
+  private waterSurface?: WaterSurfaceAsset;
+
+  private pebblePool: THREE.Mesh[] = [];
+  private rockPool: THREE.Mesh[] = [];
+  private clamPool: THREE.Group[] = [];
+
+  private pebblePoolSize = 50;
+  private rockPoolSize = 20;
+  private clamPoolSize = 10;
+
   constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory /*, playerController: PlayerController */) {
     this.scene = scene;
     this.assetFactory = assetFactory;
     // this.playerController = playerController;
-
-    // Get segmentLength from the assetFactory's public getter
     this.segmentLength = assetFactory.seafloorSegmentLength;
+    this.segmentWidth = assetFactory.seafloorAsset.segmentWidth;
+  }
 
+  public async initialize(): Promise<void> {
     this.initializeSegments();
+    this.initializeDecorationPools();
+    this.initializeWaterSurface();
     console.log("EnvironmentManager: Initialized.");
   }
 
   private initializeSegments(): void {
     for (let i = 0; i < this.segmentPoolSize; i++) {
       const mesh = this.assetFactory.createSeafloorSegmentMesh();
       mesh.visible = false; // Initially hide
       this.scene.add(mesh);
-      this.segments.push({ mesh, isActive: false });
+      this.segments.push({ mesh, isActive: false, decorations: [] });
     }
     // Position initial segments
     for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
         this.spawnSegmentAhead(true); // true to force spawn at specific positions
     }
   }
+
+  private initializeDecorationPools(): void {
+    for (let i = 0; i < this.pebblePoolSize; i++) {
+      const geom = new THREE.SphereGeometry(0.1, 6, 4);
+      const mat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });
+      const pebble = new THREE.Mesh(geom, mat);
+      pebble.visible = false;
+      pebble.userData.decorationType = 'pebble';
+      this.scene.add(pebble);
+      this.pebblePool.push(pebble);
+    }
+    for (let i = 0; i < this.rockPoolSize; i++) {
+      const rock = this.assetFactory.createObstacleMesh('rock') as THREE.Mesh;
+      rock.scale.setScalar(0.4);
+      rock.visible = false;
+      rock.userData.decorationType = 'rock';
+      this.scene.add(rock);
+      this.rockPool.push(rock);
+    }
+    for (let i = 0; i < this.clamPoolSize; i++) {
+      const clam = this.assetFactory.createObstacleMesh('clam') as THREE.Group;
+      clam.scale.setScalar(0.5);
+      clam.visible = false;
+      clam.userData.decorationType = 'clam';
+      this.scene.add(clam);
+      this.clamPool.push(clam);
+    }
+  }
+
+  private initializeWaterSurface(): void {
+    this.waterSurface = new WaterSurfaceAsset(this.assetFactory.getShaderManager());
+    const mesh = this.waterSurface.getMesh();
+    mesh.position.y = 10;
+    this.scene.add(mesh);
+  }
   
   // Helper to get an inactive segment from the pool
   private getInactiveSegment(): EnvironmentSegment | undefined {
     return this.segments.find(seg => !seg.isActive);
   }
 
   // Spawns a segment at the front of the current environment path
   private spawnSegmentAhead(initialSpawn = false): void {
     const segment = this.getInactiveSegment();
     if (segment) {
       segment.isActive = true;
       segment.mesh.visible = true;
       
       // Position new segment ahead of the last one
       // The plane's origin is at its center. We want to place them edge-to-edge.
       // If lastSegmentZ is the Z of the *center* of the furthest segment:
       // segment.mesh.position.z = this.lastSegmentZ - this.segmentLength;
       // this.lastSegmentZ = segment.mesh.position.z;
 
       // If lastSegmentZ tracks the "front" edge (further Z for player) of the last segment:
       if (initialSpawn && this.segments.filter(s => s.isActive).length <=1 ) { // First segment
         segment.mesh.position.z = 0 - (this.segmentLength / 2);
         this.lastSegmentZ = 0 - this.segmentLength; // Front edge of this segment
       } else {
         segment.mesh.position.z = this.lastSegmentZ - (this.segmentLength / 2);
         this.lastSegmentZ -= this.segmentLength; // Update front edge tracker
       }
 
       // Y position for the floor (can be configurable)
       segment.mesh.position.y = -1; // Example: player is at y=0, floor is below
+      segment.decorations = [];
+      this.spawnDecorations(segment);
       console.log(`EnvironmentManager: Spawned segment at Z: ${segment.mesh.position.z}`);
     } else {
       console.warn("EnvironmentManager: No inactive segments available to spawn!");
     }
   }
 
+  private spawnDecorations(segment: EnvironmentSegment): void {
+    const pebbleCount = THREE.MathUtils.randInt(2, 4);
+    for (let i = 0; i < pebbleCount && this.pebblePool.length > 0; i++) {
+      const pebble = this.pebblePool.pop()!;
+      this.placeDecoration(pebble, segment);
+      segment.decorations.push(pebble);
+    }
+
+    const rockCount = THREE.MathUtils.randInt(0, 2);
+    for (let i = 0; i < rockCount && this.rockPool.length > 0; i++) {
+      const rock = this.rockPool.pop()!;
+      rock.scale.setScalar(0.3 + Math.random() * 0.2);
+      this.placeDecoration(rock, segment);
+      segment.decorations.push(rock);
+    }
+
+    if (Math.random() < 0.3 && this.clamPool.length > 0) {
+      const clam = this.clamPool.pop()!;
+      this.placeDecoration(clam, segment);
+      segment.decorations.push(clam);
+    }
+  }
+
+  private placeDecoration(obj: THREE.Object3D, segment: EnvironmentSegment): void {
+    obj.position.x = THREE.MathUtils.randFloatSpread(this.segmentWidth * 0.8);
+    obj.position.y = segment.mesh.position.y;
+    obj.position.z = segment.mesh.position.z + THREE.MathUtils.randFloatSpread(this.segmentLength);
+    obj.rotation.y = Math.random() * Math.PI * 2;
+    obj.visible = true;
+  }
+
   // Recycles segments that are too far behind the player
   private recycleSegments(playerZ: number): void {
     const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 1)); // Point beyond which segments are recycled
 
     this.segments.forEach(segment => {
       if (segment.isActive) {
         // A segment's "front" edge (closest to player when behind) is its position.z + segmentLength/2
         const segmentFrontEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
         if (segmentFrontEdgeZ > recycleThreshold) {
           segment.isActive = false;
           segment.mesh.visible = false;
+          segment.decorations.forEach(obj => {
+            obj.visible = false;
+            switch (obj.userData.decorationType) {
+              case 'pebble':
+                this.pebblePool.push(obj as THREE.Mesh);
+                break;
+              case 'rock':
+                this.rockPool.push(obj as THREE.Mesh);
+                break;
+              case 'clam':
+                this.clamPool.push(obj as THREE.Group);
+                break;
+            }
+          });
+          segment.decorations = [];
           console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
         }
       }
     });
   }
 
 
-  public update(deltaTime: number, playerZ: number): void {
+  public update(deltaTime: number, playerZ: number, elapsedTime: number): void {
     // Check if we need to spawn new segments ahead
     // If the player is approaching the "end" of the visible segments
     const spawnTriggerZ = this.lastSegmentZ + (this.segmentLength * this.visibleSegmentsFront) - (this.segmentLength * 0.5) ;
     if (playerZ < spawnTriggerZ) {
       this.spawnSegmentAhead();
     }
 
     // Check if we need to recycle segments behind
     this.recycleSegments(playerZ);
+
+    this.waterSurface?.update(deltaTime, elapsedTime);
   }
 
   public dispose(): void {
     this.segments.forEach(segment => {
       segment.mesh.geometry.dispose();
       if (Array.isArray(segment.mesh.material)) {
         segment.mesh.material.forEach(m => m.dispose());
       } else {
         segment.mesh.material.dispose();
       }
       this.scene.remove(segment.mesh);
+      segment.decorations.forEach(obj => {
+        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
+        if ((obj as THREE.Mesh).material) {
+          const mat = (obj as THREE.Mesh).material as THREE.Material;
+          mat.dispose();
+        }
+        this.scene.remove(obj);
+      });
     });
     this.segments = [];
+    this.waterSurface?.dispose();
+
+    this.pebblePool.forEach(p => { p.geometry.dispose(); (p.material as THREE.Material).dispose(); this.scene.remove(p); });
+    this.rockPool.forEach(r => { r.geometry.dispose(); (r.material as THREE.Material).dispose(); this.scene.remove(r); });
+    this.clamPool.forEach(c => { this.scene.remove(c); });
+    this.pebblePool = [];
+    this.rockPool = [];
+    this.clamPool = [];
     console.log("EnvironmentManager: Disposed.");
   }
 
   public reset(initialPlayerZ: number = 0): void {
     this.segments.forEach(segment => {
       segment.isActive = false;
       segment.mesh.visible = false;
+      segment.decorations.forEach(obj => {
+        obj.visible = false;
+        switch (obj.userData.decorationType) {
+          case 'pebble':
+            this.pebblePool.push(obj as THREE.Mesh);
+            break;
+          case 'rock':
+            this.rockPool.push(obj as THREE.Mesh);
+            break;
+          case 'clam':
+            this.clamPool.push(obj as THREE.Group);
+            break;
+        }
+      });
+      segment.decorations = [];
     });
     this.lastSegmentZ = initialPlayerZ + this.segmentLength;
     for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
       this.spawnSegmentAhead(true);
     }
+    if (this.waterSurface) {
+      this.waterSurface.getMesh().position.z = initialPlayerZ - 20;
+    }
     console.log("EnvironmentManager: Reset.");
   }
 
   /**
    * Gets the configuration system used by the game
    * @returns The configuration system
    */
   public getConfigSystem(): ConfigurationSystem {
     return configSystem;
   }
-} 
+} 
 
EOF
)

8) The caustic shader chunk referenced in the documentation does not exist in the current codebase, so LightingManager registers it using a fallback cast to ensure TypeScript compilation.

Summary

Linked globalCausticTimeUniform to ShaderManager’s global uTime uniform and registered necessary shader chunks at construction

Added a GLSL accessor for caustic code and provided access to the directional light for other systems

Documentation describes adding these features, including chunk registration and GLSL generation

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/services/LightingManager.ts b/nemo-runner/src/lib/game/services/LightingManager.ts
index a30fad4..e9a7e11 100644
--- a/nemo-runner/src/lib/game/services/LightingManager.ts
+++ b/nemo-runner/src/lib/game/services/LightingManager.ts
@@ -1,58 +1,63 @@
 // src/lib/game/services/LightingManager.ts
 import * as THREE from 'three';
 import { configSystem } from '../core/ConfigurationSystem';
 import { ShaderManager } from './ShaderManager';
 import CausticsGLSL from '../shaders/common/caustics.glsl';
+import NoiseGLSL from '../shaders/common/noise.glsl';
 import { vertexShaderSource as seafloorVertexShader } from '../shaders/environment/seafloor.vert';
 import { fragmentShaderSource as seafloorFragmentShader } from '../shaders/environment/seafloor.frag';
 
 /**
  * Manages the scene's lighting, fog, and underwater visual effects including caustics
  */
 export class LightingManager {
   private scene: THREE.Scene;
   private shaderManager: ShaderManager;
   
   // Lights
   private ambientLight: THREE.AmbientLight;
   private directionalLight: THREE.DirectionalLight;
   
   // Visual effects
   private causticTargets: THREE.Mesh[] = [];
   private useCaustics: boolean;
-  
+
   // For animating caustics
   private elapsedTime: number = 0;
+  public globalCausticTimeUniform: THREE.IUniform<number>;
   
   constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
     this.scene = scene;
     this.shaderManager = shaderManager;
     const visuals = configSystem.get('visuals');
     this.useCaustics = visuals.enableCaustics;
-    
-    // Register caustic shader chunks
+
+    // Link to global uTime for caustic animations
+    this.globalCausticTimeUniform = this.shaderManager.globalUniforms.uTime;
+
+    // Register required shader chunks
     this.registerCausticChunks();
     
     // Initialize lights
     this.ambientLight = this.createAmbientLight();
     this.directionalLight = this.createDirectionalLight();
     
     // Initialize fog
     this.setupFog();
     
     // Register seafloor shader with caustics
     this.registerSeafloorShader();
     
     console.log("LightingManager: Initialized with lighting, fog, and caustic shaders.");
   }
   
   /**
    * Creates and adds the ambient light to the scene based on config
    */
   private createAmbientLight(): THREE.AmbientLight {
     const visuals = configSystem.get('visuals');
     const { ambientLightColor, ambientLightIntensity } = visuals;
     
     const light = new THREE.AmbientLight(
       ambientLightColor,
       ambientLightIntensity
diff --git a/nemo-runner/src/lib/game/services/LightingManager.ts b/nemo-runner/src/lib/game/services/LightingManager.ts
index a30fad4..e9a7e11 100644
--- a/nemo-runner/src/lib/game/services/LightingManager.ts
+++ b/nemo-runner/src/lib/game/services/LightingManager.ts
@@ -91,93 +96,111 @@ export class LightingManager {
     return light;
   }
   
   /**
    * Sets up the scene fog using the configured parameters
    */
   private setupFog(): void {
     const visuals = configSystem.get('visuals');
     const { fogColor, fogNearFactor, fogFarFactor } = visuals;
     
     // Base the fog distances on the camera's viewing distance
     // These values should be adjusted based on actual gameplay testing
     const fogNear = 20 * fogNearFactor; // Starting point of fog
     const fogFar = 40 * fogFarFactor;   // Point where fog is completely opaque
     
     this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
     
     // Also set the scene background to match the fog color for seamless blending
     this.scene.background = new THREE.Color(fogColor);
   }
   
   /**
    * Registers caustic shader chunks for use in shaders
    */
   private registerCausticChunks(): void {
-    // Register all the caustic chunks
-    this.shaderManager.registerChunk('causticEffect', CausticsGLSL.causticEffect);
-    this.shaderManager.registerChunk('advancedCaustics', CausticsGLSL.advancedCaustics);
-    this.shaderManager.registerChunk('blendCaustics', CausticsGLSL.blendCaustics);
+    // Ensure noise dependencies are registered
+    this.shaderManager.registerChunk('random2D', NoiseGLSL.random2D);
+    this.shaderManager.registerChunk('noise2D', NoiseGLSL.noise2D);
+
+    // Register caustic pattern chunk
+    this.shaderManager.registerChunk('causticPattern', (CausticsGLSL as any).causticPattern);
 
-    // Make sure they're properly integrated with THREE.js ShaderChunk
-    THREE.ShaderChunk['causticEffect'] = CausticsGLSL.causticEffect;
-    THREE.ShaderChunk['advancedCaustics'] = CausticsGLSL.advancedCaustics;
-    THREE.ShaderChunk['blendCaustics'] = CausticsGLSL.blendCaustics;
+    // Mirror in THREE.ShaderChunk for compatibility
+    THREE.ShaderChunk['random2D'] = NoiseGLSL.random2D;
+    THREE.ShaderChunk['noise2D'] = NoiseGLSL.noise2D;
+    THREE.ShaderChunk['causticPattern'] = (CausticsGLSL as any).causticPattern;
 
-    console.log("LightingManager: Registered caustic shader chunks.");
+    console.log('LightingManager: Registered caustic and noise shader chunks.');
   }
   
   /**
    * Registers the seafloor shader with caustic effects
    */
   private registerSeafloorShader(): void {
     const visuals = configSystem.get('visuals');
     
     // Register the seafloor shader with the shader manager
     this.shaderManager.registerShader({
       name: 'seafloorShader',
       vertexShaderSource: seafloorVertexShader,
       fragmentShaderSource: seafloorFragmentShader,
       defaultUniforms: () => ({
         // Include the required global uniforms explicitly
         uTime: { value: 0.0 },
         uResolution: { value: new THREE.Vector2(1, 1) },
         // Caustic-specific uniforms
         uCausticColor: { value: new THREE.Color(visuals.causticColor) },
         uCausticIntensity: { value: visuals.causticIntensity },
         uCausticScale: { value: visuals.causticScale },
         uCausticSpeed: { value: visuals.causticSpeed }
       }),
       materialParameters: {
         transparent: false,
         side: THREE.FrontSide,
         lights: true // Enable THREE.js lights in the shader
       }
     });
     
     console.log("LightingManager: Registered seafloor shader with caustics.");
   }
+
+  /**
+   * Returns GLSL code for caustic pattern generation
+   */
+  public getCausticGLSLChunk(): string {
+    return `
+      ${NoiseGLSL.random2D}
+      ${NoiseGLSL.noise2D}
+      ${(CausticsGLSL as any).causticPattern}
+    `;
+  }
+
+  /** Accessor for the main directional light */
+  public getDirectionalLight(): THREE.DirectionalLight {
+    return this.directionalLight;
+  }
   
   /**
    * Creates a seafloor segment with caustic effects enabled
    * @returns A mesh with the caustic shader applied
    */
   public createCausticSeafloor(width: number, length: number): THREE.Mesh {
     try {
       // Create a simple plane geometry for the seafloor
       const geometry = new THREE.PlaneGeometry(width, length, 32, 32);
 
       // Rotate it to be horizontal
       geometry.rotateX(-Math.PI / 2);
 
       // Don't use complex shader materials at all - use built-in THREE.js materials with simpler properties
       // This avoids the shader uniform errors that are causing the WebGL context loss
       const visuals = configSystem.get('visuals');
       
       // Create a MeshPhongMaterial with underwater-like appearance
       const material = new THREE.MeshPhongMaterial({
         color: 0x99bbcc,                     // Base seafloor color
         specular: 0x6688ff,                  // Slight blue specular highlights
         shininess: 30,                       // Moderate shininess
         emissive: new THREE.Color(visuals.causticColor).multiplyScalar(0.2), // Subtle caustic-like glow
         side: THREE.FrontSide,               // Only render front face for performance
         flatShading: false                   // Smooth shading
 
EOF
)

9) RenderManager now links to LightingManager and can compute a screen-space position for the god‑ray light source. The helper projects a proxy point into screen space for use by the shader

GameEngine connects the new lighting manager instance to RenderManager so that god‑ray uniform updates have access to the main directional light

LightingManager exposes a getDirectionalLight method to provide the active directional light source for other systems

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/GameEngine.ts b/nemo-runner/src/lib/game/GameEngine.ts
index f2427ba..72ac10d 100644
--- a/nemo-runner/src/lib/game/GameEngine.ts
+++ b/nemo-runner/src/lib/game/GameEngine.ts
@@ -85,50 +85,51 @@ export class GameEngine {
 
       // Camera
       const aspectRatio = this.mountElement.clientWidth / this.mountElement.clientHeight;
       this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
 
       // Renderer
       this.renderer = new THREE.WebGLRenderer({
         antialias: true,
         powerPreference: "high-performance", // Prefer higher performance
         preserveDrawingBuffer: false // Better performance
       });
       this.renderer.setSize(this.mountElement.clientWidth, this.mountElement.clientHeight);
       this.renderer.setPixelRatio(window.devicePixelRatio);
       this.mountElement.appendChild(this.renderer.domElement);
 
       // Set up WebGL context loss/restore handlers
       this.setupWebGLContextHandlers();
 
       this.renderManager = new RenderManager(this.scene, this.camera, this.renderer);
 
       // ShaderManager for assets and lighting effects
       this.shaderManager = new ShaderManager();
 
       // LightingManager for scene lighting, fog, and underwater effects
       this.lightingManager = new LightingManager(this.scene, this.shaderManager);
+      this.renderManager.linkLightingManager(this.lightingManager);
 
       // Visual Effects Service for particles and post-processing
       this.visualEffectsService = new VisualEffectsService();
       this.visualEffectsService.linkCameraManager(this.cameraManager);
       this.visualEffectsService.linkGameEngine(this);
       this.visualEffectsService.initializeParticlesAndPostProcessing(
         this.scene, 
         this.shaderManager, 
         this.renderManager
       );
 
       // Register the test pattern shader
       this.shaderManager.registerShader({
         name: 'testPatternShader',
         vertexShaderSource: testPatternVertex,
         fragmentShaderSource: testPatternFragment,
         defaultUniforms: () => ({ // Function to return fresh uniform objects
           uBaseColor: { value: new THREE.Color(0x00ffff) }, // Cyan base color
         }),
         materialParameters: {
           transparent: false,
           side: THREE.FrontSide
         }
       });
 
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/core/RenderManager.ts b/nemo-runner/src/lib/game/core/RenderManager.ts
index f531842..de7ee70 100644
--- a/nemo-runner/src/lib/game/core/RenderManager.ts
+++ b/nemo-runner/src/lib/game/core/RenderManager.ts
@@ -1,47 +1,54 @@
 import * as THREE from 'three';
 import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
 import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
 import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
+import { LightingManager } from '../services/LightingManager';
 
 export class RenderManager {
   private scene: THREE.Scene;
   private camera: THREE.PerspectiveCamera;
   private renderer: THREE.WebGLRenderer;
   private composer: EffectComposer | null = null;
+  private godraysPass?: ShaderPass;
+  private lightingManager?: LightingManager;
   private postProcessingPasses: Map<string, ShaderPass> = new Map();
   private _errorHandlerCalled: boolean = false; // Track if we've already called error handler
   private _lastRenderSuccess: boolean = true;   // Track if last render was successful
   private _errorDebounceTimer: any = null;      // Debounce timer for error handling
 
   constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
     this.scene = scene;
     this.camera = camera;
     this.renderer = renderer;
     this.setupEffectComposer();
   }
 
+  public linkLightingManager(lightingManager: LightingManager): void {
+    this.lightingManager = lightingManager;
+  }
+
   private setupEffectComposer(): void {
     if (!this.scene || !this.camera || !this.renderer) {
       console.error("RenderManager: Cannot set up EffectComposer - scene, camera, or renderer not set");
       return;
     }
     
     try {
       this.composer = new EffectComposer(this.renderer);
       const renderPass = new RenderPass(this.scene, this.camera);
       this.composer.addPass(renderPass); // Render the scene first
       console.log("RenderManager: EffectComposer initialized");
     } catch (error) {
       console.error("RenderManager: Failed to set up EffectComposer", error);
       this.composer = null;
     }
   }
 
   /**
    * Updates the renderer reference after WebGL context loss/restoration
    * @param newRenderer The new WebGLRenderer instance
    */
   public updateRenderer(newRenderer: THREE.WebGLRenderer): void {
     if (!newRenderer) {
       console.error("RenderManager: Cannot update renderer - new renderer is undefined");
       return;
diff --git a/nemo-runner/src/lib/game/core/RenderManager.ts b/nemo-runner/src/lib/game/core/RenderManager.ts
index f531842..de7ee70 100644
--- a/nemo-runner/src/lib/game/core/RenderManager.ts
+++ b/nemo-runner/src/lib/game/core/RenderManager.ts
@@ -228,50 +235,51 @@ export class RenderManager {
 
       if (!this.camera) {
         console.error("RenderManager: Camera is undefined");
         this._lastRenderSuccess = false;
         return;
       }
 
       // Deep WebGL state validation
       if (!this.isWebGLStateValid()) {
         this.handleWebGLError("WebGL state is invalid", "State validation failed");
         this._lastRenderSuccess = false;
         return;
       }
 
       // Reset render state before rendering to prevent residual state issues
       try {
         this.renderer.state.reset();
       } catch (stateError) {
         this.handleWebGLError("Error resetting WebGL state", stateError);
         this._lastRenderSuccess = false;
         return;
       }
 
       // Attempt to render with protective try/catch
       try {
+        this.updateGodRayUniforms();
         if (this.composer && this.postProcessingPasses.size > 0) {
           // Use composer to render with post-processing passes
           this.composer.render();
         } else {
           // Fallback to standard rendering if composer isn't ready or no passes are added
           this.renderer.render(this.scene, this.camera);
         }
 
         // If we got here, render was successful
         this._lastRenderSuccess = true;
       } catch (renderError) {
         this._lastRenderSuccess = false;
 
         // Check for specific WebGL-related errors
         const errorString = String(renderError);
 
         // Expanded error detection for various THREE.js and WebGL errors
         if (errorString.includes("Cannot set properties of undefined") ||
             errorString.includes("Cannot read properties of null") ||
             errorString.includes("WebGL") ||
             errorString.includes("shader") ||
             errorString.includes("program") ||
             errorString.includes("context") ||
             errorString.includes("INVALID_OPERATION") ||
             errorString.includes("WebGLBuffer") ||
diff --git a/nemo-runner/src/lib/game/core/RenderManager.ts b/nemo-runner/src/lib/game/core/RenderManager.ts
index f531842..de7ee70 100644
--- a/nemo-runner/src/lib/game/core/RenderManager.ts
+++ b/nemo-runner/src/lib/game/core/RenderManager.ts
@@ -296,50 +304,80 @@ export class RenderManager {
    */
   public resize(width: number, height: number): void {
     if (!this.renderer) return;
     
     this.renderer.setSize(width, height);
     this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
     
     if (this.composer) {
       this.composer.setSize(width, height);
       this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
     }
     
     if (this.camera instanceof THREE.PerspectiveCamera) {
       this.camera.aspect = width / height;
       this.camera.updateProjectionMatrix();
     }
   }
 
   /**
    * Get the renderer for external use
    */
   public getRenderer(): THREE.WebGLRenderer {
     return this.renderer;
   }
 
+  private getLightScreenPosition(
+    light: THREE.DirectionalLight | THREE.SpotLight | THREE.PointLight
+  ): THREE.Vector2 {
+    const lightSourceProxy = new THREE.Vector3();
+    this.camera.getWorldPosition(lightSourceProxy);
+    const viewDirection = new THREE.Vector3();
+    this.camera.getWorldDirection(viewDirection);
+    lightSourceProxy.addScaledVector(viewDirection, -50);
+    lightSourceProxy.y = 15;
+    const dirLightXZ = new THREE.Vector3(light.position.x, 0, light.position.z).normalize();
+    lightSourceProxy.addScaledVector(dirLightXZ, 5);
+    const screenPos = lightSourceProxy.clone().project(this.camera);
+    return new THREE.Vector2((screenPos.x + 1) * 0.5, (screenPos.y + 1) * 0.5);
+  }
+
+  private updateGodRayUniforms(): void {
+    if (!this.godraysPass || !this.godraysPass.enabled || !this.lightingManager) return;
+    const light = (this.lightingManager as any).getDirectionalLight?.();
+    if (!light) return;
+    const pos = this.getLightScreenPosition(light);
+    const uniform = this.godraysPass.uniforms['uLightPositionScreen'];
+    if (uniform) {
+      if (uniform.value instanceof THREE.Vector2) {
+        (uniform.value as THREE.Vector2).copy(pos);
+      } else {
+        uniform.value = pos.clone();
+      }
+    }
+  }
+
   // Properly dispose resources and clear references
   public dispose(): void {
     // Clear debounce timer if active
     if (this._errorDebounceTimer) {
       clearTimeout(this._errorDebounceTimer);
       this._errorDebounceTimer = null;
     }
 
     // Dispose composer passes if needed
     this.postProcessingPasses.forEach(pass => {
       // Proper disposal of pass resources like textures/materials if necessary
       if (pass.material) {
         pass.material.dispose();
       }
     });
     this.postProcessingPasses.clear();
     
     // Clear the composer
     this.composer = null;
 
     // Reset tracking variables
     this._errorHandlerCalled = false;
     this._lastRenderSuccess = true;
 
     // Clear references to prevent memory leaks
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/services/LightingManager.ts b/nemo-runner/src/lib/game/services/LightingManager.ts
index a30fad4..7965f6d 100644
--- a/nemo-runner/src/lib/game/services/LightingManager.ts
+++ b/nemo-runner/src/lib/game/services/LightingManager.ts
@@ -247,40 +247,44 @@ export class LightingManager {
     // Update directional light
     this.directionalLight.color.set(visuals.directionalLightColor);
     this.directionalLight.intensity = visuals.directionalLightIntensity;
     this.directionalLight.position.set(
       visuals.directionalLightPosition.x,
       visuals.directionalLightPosition.y,
       visuals.directionalLightPosition.z
     );
     
     // Update fog
     if (this.scene.fog) {
       const fogNear = 20 * visuals.fogNearFactor;
       const fogFar = 40 * visuals.fogFarFactor;
       
       (this.scene.fog as THREE.Fog).color.set(visuals.fogColor);
       (this.scene.fog as THREE.Fog).near = fogNear;
       (this.scene.fog as THREE.Fog).far = fogFar;
       
       // Update scene background to match fog
       this.scene.background = new THREE.Color(visuals.fogColor);
     }
     
     // Update caustic settings flag
     this.useCaustics = visuals.enableCaustics;
   }
+
+  public getDirectionalLight(): THREE.DirectionalLight {
+    return this.directionalLight;
+  }
   
   /**
    * Clean up resources used by the LightingManager
    */
   public dispose(): void {
     // Remove lights from scene
     this.scene.remove(this.ambientLight);
     this.scene.remove(this.directionalLight);
     
     // Clean up caustic targets
     this.causticTargets = [];
     
     console.log("LightingManager: Disposed.");
   }
 }
 
EOF
)

10) GameEngine’s initialization now awaits the EnvironmentManager before setting up the player controller, ensuring async setup happens in order

The main game loop is async and waits for EnvironmentManager updates, passing elapsed time for environment animations

resetGame is also async, awaiting EnvironmentManager reset before continuing with other resets

GameCanvas initializes the engine asynchronously and starts the loop once initialization completes

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/components/game/GameCanvas.tsx b/nemo-runner/src/components/game/GameCanvas.tsx
index 40c2e32..2155326 100644
--- a/nemo-runner/src/components/game/GameCanvas.tsx
+++ b/nemo-runner/src/components/game/GameCanvas.tsx
@@ -345,52 +345,53 @@ export default function GameCanvas() {
         },
         onActivePowerUpsUpdate: (powerUps) => setActivePowerUps(powerUps)
       });
 
       // Expose for debug helpers
       // @ts-ignore
       window.__gameEngine = engine;
       gameEngineRef.current = engine;
 
       // Add WebGL context error listeners to the canvas
       const canvas = canvasMountRef.current.querySelector('canvas');
       if (canvas) {
         canvas.addEventListener('webglcontextlost', handleWebGLError, false);
         canvas.addEventListener('webglcontexterror', handleWebGLError, false);
       }
 
       // Set up screen flash callback for hit effects
       const vfxService = engine.getVisualEffectsService?.();
       if (vfxService) {
         vfxService.setFlashCallback((color: string, duration: number) => {
           setScreenFlash({ color, duration, key: Date.now() }); // Use key for unique state updates
           setTimeout(() => setScreenFlash(null), duration);
         });
       }
 
-      engine.initialize();
-      engine.start();
+      engine.initialize().then(() => {
+        engine.start();
+      });
       setIsLoading(false);
       console.log("GameCanvas: GameEngine started.");
 
       const handleResize = () => {
         if (gameEngineRef.current) {
           gameEngineRef.current.handleResize();
         }
       };
 
       window.addEventListener('resize', handleResize);
 
       return () => {
         // Check if this cleanup is due to Fast Refresh or actual unmount
         const isFastRefresh = isHotReloadingRef.current;
 
         console.log(`GameCanvas: Cleaning up GameEngine... (Fast Refresh: ${isFastRefresh})`);
 
         // Always remove event listeners
         window.removeEventListener('resize', handleResize);
 
         // Remove WebGL context event listeners
         if (canvas) {
           canvas.removeEventListener('webglcontextlost', handleWebGLError);
           canvas.removeEventListener('webglcontexterror', handleWebGLError);
         }
diff --git a/nemo-runner/src/components/game/GameCanvas.tsx b/nemo-runner/src/components/game/GameCanvas.tsx
index 40c2e32..2155326 100644
--- a/nemo-runner/src/components/game/GameCanvas.tsx
+++ b/nemo-runner/src/components/game/GameCanvas.tsx
@@ -429,54 +430,54 @@ export default function GameCanvas() {
             }
 
             try {
               // For full component unmount, perform proper cleanup
               gameEngineRef.current.dispose();
             } catch (disposeError) {
               console.warn("GameCanvas: Error during engine disposal:", disposeError);
             }
 
             gameEngineRef.current = null; // Clear the ref
           }
         }
 
         // The GameEngine's dispose should handle removing the canvas child
         console.log("GameCanvas: Cleanup complete.");
         setIsGameOver(false);
       };
     } catch (e: any) {
       const errMsg = `GameCanvas: Failed to initialize GameEngine: ${e.message}`;
       console.error(errMsg, e);
       setError(errMsg);
       setIsLoading(false);
     }
   }, []); // Empty dependency array
 
-  const handleRestart = () => {
+  const handleRestart = async () => {
     if (gameEngineRef.current && gameEngineRef.current.getCurrentState() === GameState.GAME_OVER) {
       console.log("GameCanvas: Restarting game...");
-      gameEngineRef.current.resetGame();
+      await gameEngineRef.current.resetGame();
       gameEngineRef.current.start();
       setIsGameOver(false);
       setActivePowerUps([]); // Clear power-ups on restart
     } else if (gameEngineRef.current && gameEngineRef.current.getCurrentState() === GameState.READY) {
       gameEngineRef.current.start();
     }
   };
 
   return (
     <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C6B9C' }}>
       {isLoading && (
         <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '20px' }}>
           Loading 3D Scene...
         </div>
       )}
 
       {error && (
         <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'red', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
           Error: {error}
         </div>
       )}
 
       <div ref={canvasMountRef} style={{ width: '100%', height: '100%' }} />
 
       {/* Screen Flash Effect for Hits */}
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/GameEngine.ts b/nemo-runner/src/lib/game/GameEngine.ts
index f2427ba..4be2521 100644
--- a/nemo-runner/src/lib/game/GameEngine.ts
+++ b/nemo-runner/src/lib/game/GameEngine.ts
@@ -55,51 +55,51 @@ export class GameEngine {
   private shaderManager!: ShaderManager;
   private lightingManager!: LightingManager;
   private visualEffectsService!: VisualEffectsService;
   private assetFactory!: ProceduralAssetFactory;
   private environmentManager!: EnvironmentManager;
   private obstacleManager!: ObstacleManager;
   private collectibleManager!: CollectibleManager;
   private powerUpManager!: PowerUpManager;
   private scoringSystem!: ScoringSystem;
   private collisionSystem!: CollisionDetectionSystem;
   private difficultyManager!: DifficultyManager;
 
   private animationFrameId?: number;
   private isRunning: boolean = false;
   private lastTimestamp: number = 0;
   private currentState: GameState = GameState.LOADING;
 
   private contextLostHandler: ((event: WebGLContextEvent) => void) | null = null;
   private contextRestoredHandler: ((event: WebGLContextEvent) => void) | null = null;
 
   constructor(mountElement: HTMLDivElement, callbacks: GameEngineCallbacks = {}) {
     this.mountElement = mountElement;
     this.callbacks = callbacks;
   }
 
-  public initialize(): void {
+  public async initialize(): Promise<void> {
     try {
       // Scene
       this.scene = new THREE.Scene();
       this.scene.background = new THREE.Color(0x1a2b3c);
 
       // Camera
       const aspectRatio = this.mountElement.clientWidth / this.mountElement.clientHeight;
       this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
 
       // Renderer
       this.renderer = new THREE.WebGLRenderer({
         antialias: true,
         powerPreference: "high-performance", // Prefer higher performance
         preserveDrawingBuffer: false // Better performance
       });
       this.renderer.setSize(this.mountElement.clientWidth, this.mountElement.clientHeight);
       this.renderer.setPixelRatio(window.devicePixelRatio);
       this.mountElement.appendChild(this.renderer.domElement);
 
       // Set up WebGL context loss/restore handlers
       this.setupWebGLContextHandlers();
 
       this.renderManager = new RenderManager(this.scene, this.camera, this.renderer);
 
       // ShaderManager for assets and lighting effects
diff --git a/nemo-runner/src/lib/game/GameEngine.ts b/nemo-runner/src/lib/game/GameEngine.ts
index f2427ba..4be2521 100644
--- a/nemo-runner/src/lib/game/GameEngine.ts
+++ b/nemo-runner/src/lib/game/GameEngine.ts
@@ -117,50 +117,51 @@ export class GameEngine {
         this.shaderManager, 
         this.renderManager
       );
 
       // Register the test pattern shader
       this.shaderManager.registerShader({
         name: 'testPatternShader',
         vertexShaderSource: testPatternVertex,
         fragmentShaderSource: testPatternFragment,
         defaultUniforms: () => ({ // Function to return fresh uniform objects
           uBaseColor: { value: new THREE.Color(0x00ffff) }, // Cyan base color
         }),
         materialParameters: {
           transparent: false,
           side: THREE.FrontSide
         }
       });
 
       this.assetFactory = new ProceduralAssetFactory(this.shaderManager);
 
       // Link the LightingManager to the SeafloorAsset for caustic effects
       this.assetFactory.seafloorAsset.linkLightingManager(this.lightingManager);
 
       // EnvironmentManager
       this.environmentManager = new EnvironmentManager(this.scene, this.assetFactory);
+      await this.environmentManager.initialize();
 
       // Player Controller
       this.playerController = new PlayerController(this.scene, this.assetFactory, this);
 
       // CameraManager (after playerController)
       this.cameraManager = new CameraManager(this.camera, this.playerController);
       
       // Update CameraManager link for VisualEffectsService since it was created after CameraManager
       this.visualEffectsService.linkCameraManager(this.cameraManager);
 
       // Notify UI of initial lives count
       this.callbacks.onLivesUpdate?.(this.playerController.lives);
 
       // Input Handler
       this.inputHandler = new InputHandler(this.playerController);
       this.inputHandler.initialize();
 
       // ObstacleManager
       this.obstacleManager = new ObstacleManager(this.scene, this.assetFactory);
 
       // Link PlayerController to ObstacleManager for proximity-based behaviors
       this.obstacleManager.linkPlayerController(this.playerController);
 
       // ScoringSystem and CollectibleManager
       this.scoringSystem = new ScoringSystem();
diff --git a/nemo-runner/src/lib/game/GameEngine.ts b/nemo-runner/src/lib/game/GameEngine.ts
index f2427ba..4be2521 100644
--- a/nemo-runner/src/lib/game/GameEngine.ts
+++ b/nemo-runner/src/lib/game/GameEngine.ts
@@ -212,70 +213,75 @@ export class GameEngine {
   }
 
   public start(): void {
     if (this.currentState !== GameState.READY && this.currentState !== GameState.GAME_OVER && this.currentState !== GameState.PAUSED) return;
     if (this.currentState === GameState.GAME_OVER) {
       this.resetGame();
     }
     this.isRunning = true;
     this.currentState = GameState.PLAYING;
     this.lastTimestamp = performance.now();
     if (!this.animationFrameId) {
       this.gameLoop();
     }
     console.log("GameEngine: Started. State: PLAYING");
   }
 
   public stop(): void {
     if (!this.isRunning) return;
     this.isRunning = false;
     if (this.animationFrameId) {
       cancelAnimationFrame(this.animationFrameId);
     }
     console.log("GameEngine: Stopped.");
   }
 
-  private gameLoop(timestamp: number = performance.now()): void {
+  private async gameLoop(timestamp: number = performance.now()): Promise<void> {
     if (!this.isRunning) {
       if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
       this.animationFrameId = undefined;
       return;
     }
     const deltaTime = (timestamp - this.lastTimestamp) / 1000;
     this.lastTimestamp = timestamp;
     const dt = Math.min(deltaTime, 0.1);
     if (this.currentState === GameState.PLAYING) {
       this.inputHandler.update(dt);
       this.playerController.update(dt);
 
       // Get current distance for difficulty scaling
       const currentDistance = this.scoringSystem.totalDistanceTraveled;
 
       // Update difficulty based on player's distance
       this.difficultyManager.update(dt, currentDistance);
 
-      this.environmentManager.update(dt, this.playerController.mesh.position.z);
+      const elapsedTime = timestamp / 1000;
+      await this.environmentManager.update(
+        dt,
+        this.playerController.mesh.position.z,
+        elapsedTime
+      );
       this.obstacleManager.update(dt, this.playerController.mesh.position.z);
       this.collectibleManager.update(dt, this.playerController.mesh.position.z);
 
       // Update lighting and caustic effects
       this.lightingManager.update(dt, timestamp / 1000);
       
       // Update visual effects (particles and post-processing)
       this.visualEffectsService.update(dt, timestamp / 1000, this.playerController.mesh.position);
 
       // Update forward speed for power-ups
       this.powerUpManager.setGameSpeed(this.playerController.getForwardSpeed());
       // Fix: Pass player's Z position to powerUpManager.update
       this.powerUpManager.update(dt, this.playerController.mesh.position.z);
 
       // Update score based on distance
       const distanceTraveled = dt * this.playerController.getForwardSpeed();
       this.scoringSystem.update(dt, distanceTraveled);
 
       // Update UI with active power-ups
       if (this.callbacks.onActivePowerUpsUpdate) {
         const activePowerUps = this.powerUpManager.getActiveEffectsForUI();
         this.callbacks.onActivePowerUpsUpdate(activePowerUps);
       }
 
       // Update shader global uniforms (time, resolution)
diff --git a/nemo-runner/src/lib/game/GameEngine.ts b/nemo-runner/src/lib/game/GameEngine.ts
index f2427ba..4be2521 100644
--- a/nemo-runner/src/lib/game/GameEngine.ts
+++ b/nemo-runner/src/lib/game/GameEngine.ts
@@ -631,57 +637,57 @@ export class GameEngine {
             console.warn("GameEngine: Could not force context loss during disposal:", e);
           }
         }
       }
     }
 
     if (this.mountElement && this.renderer) {
       if (this.mountElement.contains(this.renderer.domElement)) {
         this.mountElement.removeChild(this.renderer.domElement);
       }
     }
 
     console.log("GameEngine: Disposed.");
   }
 
   public gameOver(): void {
     if (this.currentState === GameState.GAME_OVER) return;
     this.currentState = GameState.GAME_OVER;
     this.isRunning = false;
     console.log("GameEngine: GAME OVER!");
     if (this.callbacks.onGameOver) {
       this.callbacks.onGameOver();
     }
   }
 
-  public resetGame(): void {
+  public async resetGame(): Promise<void> {
     console.log("GameEngine: Resetting game...");
 
     // Reset all game managers
     this.playerController.reset();
     this.obstacleManager.reset();
-    this.environmentManager.reset(this.playerController.mesh.position.z);
+    await this.environmentManager.reset(this.playerController.mesh.position.z);
     this.collectibleManager.reset();
     
     // Reset the VisualEffectsService
     this.visualEffectsService.reset();
 
     // Reset the PowerUpManager instead of recreating it
     this.powerUpManager.reset();
 
     // CRITICAL: Explicitly reset the camera to the player's new position
     // This ensures the camera follows the player after restart
     this.cameraManager.reset(this.playerController);
     
     // CRITICAL FIX: Recreate the CollisionDetectionSystem to ensure it has fresh references
     // This is needed so collisions with power-ups work after restart
     this.collisionSystem = new CollisionDetectionSystem(
       this.playerController,
       this.obstacleManager,
       this.collectibleManager,
       this.scoringSystem,
       () => this.gameOver(),
       this,
       this.powerUpManager
     );
 
     // Reset the difficulty to the starting level
 
EOF
)

11) Introduced SeafloorVisualConfig, DecorationSpawnSettings, and related environment interfaces to configure decorative prop spawning

Added an environment section to GameConfig and default values for pebble and clam decorations

Extended ConfigurationSystem to merge and expose environment settings

Updated EnvironmentManager to spawn decorative props per segment using the new configuration and manage their lifecycle

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..aff3948 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -236,50 +236,79 @@ export interface VisualSettings {
   bubbleBaseSpeed: number;
   bubbleSize: number;
   bubbleSpawnAreaX: number; // Width over which bubbles spawn
   bubbleSpawnDepth: number; // Depth below seafloor bubbles spawn from
 
   dustEnabled: boolean;
   dustCount: number;
   dustSize: number;
   dustWanderSpeed: number;
 
   // Screen Effects (Post-Processing)
   enableScreenEffects: boolean;
   vignetteEnabled: boolean;
   vignetteIntensity: number; // 0 to 1 typically
   vignetteSmoothness: number; // Controls the falloff sharpness
 
   colorGradingEnabled: boolean;
   colorGradeIntensity: number; // How much to apply grading
   colorGradeTargetColor: number | string; // e.g., shift towards a deeper blue
 
   distortionEnabled: boolean;
   distortionIntensity: number; // Subtle water ripple effect
   distortionSpeed: number;
 }
 
+// Visual configuration for the seafloor appearance
+export interface SeafloorVisualConfig {
+  baseColor: number | string;
+  sandPatternColor1: number | string;
+  sandPatternColor2: number | string;
+  textureScale: number;
+  bumpScale: number;
+  roughness: number;
+  metalness: number;
+}
+
+// Parameters controlling decorative prop spawning
+export interface DecorationSpawnSettings {
+  countMin: number; // Minimum objects spawned per seafloor segment
+  countMax: number; // Maximum objects spawned per seafloor segment
+  scaleMin: number; // Minimum random scale factor
+  scaleMax: number; // Maximum random scale factor
+}
+
+export interface DecorationConfig {
+  pebble: DecorationSpawnSettings;
+  clam: DecorationSpawnSettings;
+}
+
+export interface EnvironmentConfig {
+  seafloor: SeafloorVisualConfig;
+  decorations: DecorationConfig;
+}
+
 export interface PlayerSettings {
   moveSpeed: number; // Units per second
   laneWidth: number; // Width of a single lane
   laneChangeDuration: number; // Duration of the lane change animation
   initialLives: number;
   jumpHeight: number; // Max height of the jump arc
   jumpDuration: number; // Time to complete one jump (up and down)
   diveDepth: number; // Max depth of the dive arc
   diveDuration: number; // Time to complete one dive (down and up)
   invincibilityDuration: number; // Duration of invincibility after taking damage
   gravity?: number; // Optional: If using physics-based jump/dive
   normalYPosition: number; // Default Y position for the player
   
   // Clownfish visual properties
   clownFishBaseColor: number; // Main orange color
   clownFishStripeColor: number; // White stripe color
   clownFishStripeEdgeColor: number; // Dark edge around stripes
   clownFishFinAccentColor: number; // Color for fin edges/tips
   
   // Eye properties
   eyePupilColor: number; // Dark center of eye
   eyeIrisColor: number; // Colored part around pupil
   eyeHighlightColor: number; // Specular highlight on eye
   
   // Animation parameters
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..aff3948 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -289,50 +318,51 @@ export interface PlayerSettings {
   pectoralFinAmplitude: number; // Amplitude of pectoral fin movement
 }
 
 export interface GameConfig {
   player: PlayerSettings;
   collisions: {
     obstacleRadiusFactor: number; // Factor to scale obstacle bounding sphere radius for collision detection
   };
   world: {
     xBoundary: number;
     laneCount: number; // Number of lanes
   };
   camera: {
     offset: { x: number; y: number; z: number };
     lookAtOffset: { x: number; y: number; z: number };
     lerpFactor: number;
   };
   collectibles: {
     spawnIntervalMin: number; // Min seconds between pattern spawns
     spawnIntervalMax: number; // Max seconds
     spawnDistanceAhead: number; // How far ahead to spawn collectibles
   };
   powerUps: PowerUpsGameConfig; // Power-up configuration
   difficulty: DifficultyGameConfig; // Difficulty configuration
   obstacles: ObstaclesConfig; // Obstacle configuration
+  environment: EnvironmentConfig; // Seafloor and decoration settings
   visuals: VisualSettings; // Visual settings including lighting, fog, and caustics
 }
 
 // Default configuration values
 export const defaultConfig: GameConfig = {
   player: {
     moveSpeed: 5,
     laneWidth: 2,
     laneChangeDuration: 0.2,
     initialLives: 3,
     jumpHeight: 1.5,
     jumpDuration: 0.6,
     diveDepth: 1.0,
     diveDuration: 0.5,
     invincibilityDuration: 1.5,
     normalYPosition: 0, // Default Y, can be adjusted based on player model size
 
     // Clownfish Visuals
     clownFishBaseColor: 0xff6600, // Vibrant orange
     clownFishStripeColor: 0xffffff, // Bright white
     clownFishStripeEdgeColor: 0x111111, // Dark, thin edge for definition
     clownFishFinAccentColor: 0xffaa00, // Lighter orange/yellow for fin tips
 
     // Eye Properties
     eyePupilColor: 0x000000,
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index dc069f8..aff3948 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -548,50 +578,65 @@ export const defaultConfig: GameConfig = {
         transmission: 0.2,
         animationSpeed: 0.5,
         animationAmplitude: 1.0
       }
     },
     schoolOfFish: {
       fishCountMin: 30,            // Increased from 15
       fishCountMax: 50,            // Increased from 25
       schoolRadius: 1.2,           // General area they occupy
       individualFishScale: 0.25,     // Changed from 0.3 back to 0.25
       depthCoverage: 2.5,          // Vertical spread, making it hard to jump
       formation: 'wall',           // Dense wall formation
       baseSpeedFactor: 0.9,        // Slightly slower than player
       visuals: { 
         mainColor: 0xFF8C00,    // DarkOrange (changed from 0xA0B0C0)
         detailColor: 0xFFA500,  // Orange (changed from 0xB0C0D0)
         emissiveColor: 0xFF7000, // Adjusted emissive to match orange theme
         emissiveIntensity: 0.15, 
         roughness: 0.4,          // Values from SchoolOfFishAsset's defaults
         metalness: 0.4,          // Values from SchoolOfFishAsset's defaults
         animationSpeed: 3.0,
         animationAmplitude: 0.5
       }
     }
   },
+  environment: {
+    seafloor: {
+      baseColor: 0xAD8E6E,
+      sandPatternColor1: 0xC4A484,
+      sandPatternColor2: 0x9A7B5A,
+      textureScale: 15.0,
+      bumpScale: 0.02,
+      roughness: 0.85,
+      metalness: 0.0,
+    },
+    decorations: {
+      pebble: { countMin: 3, countMax: 6, scaleMin: 0.1, scaleMax: 0.3 },
+      clam: { countMin: 0, countMax: 2, scaleMin: 0.6, scaleMax: 1.0 },
+    },
+  },
   visuals: {
     skyColor: 0x1a2b3c, // Darker blue for underwater
     ambientLightColor: 0x406080, // Bluish ambient
     ambientLightIntensity: 0.4,
     directionalLightColor: 0xa0c0ff, // Lighter blue/white sunlight from above
     directionalLightIntensity: 0.8,
     directionalLightPosition: { x: 0.5, y: 1, z: 0.3 }, // More overhead
 
     // Fog parameters
     fogColor: 0x1a2b3c, // Match sky/background for seamless blend
     fogNearFactor: 1.5,  // Start fog relatively close to player camera's Z offset
     fogFarFactor: 6.0,   // Fog becomes dense further out
 
     enableCaustics: true,
     causticIntensity: 0.25,
     causticScale: 8.0, // Larger scale for broader patterns
     causticSpeed: 0.05,
     causticColor: 0x90c0ff, // Light blue caustics
 
     enableGodRays: false, // Disabled for Phase 1 initial, focus on caustics
     godRayLightSourceOffsetY: 10,
 
     // Particle Effects
     enableParticles: true,
     bubblesEnabled: true,
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/core/ConfigurationSystem.ts b/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
index 9720b51..cd4135f 100644
--- a/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
+++ b/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
@@ -2,52 +2,64 @@
 import { GameConfig, defaultConfig, PowerUpsGameConfig, DifficultyGameConfig } from '../config/gameConfig';
 
 class ConfigurationSystem {
   private config: GameConfig;
 
   constructor(initialConfig?: Partial<GameConfig>) {
     this.config = {
       ...defaultConfig,
       ...initialConfig,
       // Deep merge powerUps if provided in initialConfig
       powerUps: initialConfig?.powerUps
         ? { ...defaultConfig.powerUps, ...initialConfig.powerUps }
         : { ...defaultConfig.powerUps },
       // Deep merge difficulty if provided in initialConfig
       difficulty: initialConfig?.difficulty
         ? {
             ...defaultConfig.difficulty,
             ...initialConfig.difficulty,
             tiers: initialConfig.difficulty.tiers
               ? [...initialConfig.difficulty.tiers]
               : [...defaultConfig.difficulty.tiers]
           }
         : {
             ...defaultConfig.difficulty,
             tiers: [...defaultConfig.difficulty.tiers]
+          },
+      environment: initialConfig?.environment
+        ? {
+            ...defaultConfig.environment,
+            ...initialConfig.environment,
+            decorations: initialConfig.environment.decorations
+              ? {
+                  ...defaultConfig.environment.decorations,
+                  ...initialConfig.environment.decorations
+                }
+              : { ...defaultConfig.environment.decorations }
           }
-    };
+        : { ...defaultConfig.environment }
+      };
     console.log("ConfigurationSystem: Initialized with config:", JSON.stringify(this.config));
   }
 
   public get<K extends keyof GameConfig>(category: K): Readonly<GameConfig[K]> {
     return this.config[category];
   }
 
   // Typed getter for powerUps config
   public getPowerUpsConfig(): Readonly<PowerUpsGameConfig> {
     return this.config.powerUps;
   }
 
   // Typed getter for difficulty config
   public getDifficultyConfig(): Readonly<DifficultyGameConfig> {
     return this.config.difficulty;
   }
 
   // Example of getting a specific value
   public getPlayerMoveSpeed(): number {
     return this.config.player.moveSpeed;
   }
 
   // Base speeds for difficulty system
   public getPlayerBaseSpeed(): number {
     return this.config.difficulty.basePlayerSpeed;
diff --git a/nemo-runner/src/lib/game/core/ConfigurationSystem.ts b/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
index 9720b51..cd4135f 100644
--- a/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
+++ b/nemo-runner/src/lib/game/core/ConfigurationSystem.ts
@@ -80,29 +92,34 @@ class ConfigurationSystem {
   public getPlayerJumpDuration(): number {
     return this.config.player.jumpDuration;
   }
 
   public getPlayerDiveDepth(): number {
     return this.config.player.diveDepth;
   }
 
   public getPlayerDiveDuration(): number {
     return this.config.player.diveDuration;
   }
 
   public getPlayerInitialLives(): number {
     return this.config.player.initialLives;
   }
 
   // Collision getters
   public getObstacleRadiusFactor(): number {
     return this.config.collisions.obstacleRadiusFactor;
   }
 
   // Obstacles config getter
   public getObstaclesConfig(): Readonly<GameConfig['obstacles']> {
     return this.config.obstacles;
   }
+
+  // Environment config getter
+  public getEnvironmentConfig(): Readonly<GameConfig['environment']> {
+    return this.config.environment;
+  }
 }
 
 // Export a singleton instance for easy access throughout the game
 export const configSystem = new ConfigurationSystem(); 
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index cf9921b..12c35f2 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -1,147 +1,218 @@
 import * as THREE from 'three';
 import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
 import { ConfigurationSystem, configSystem } from '../core/ConfigurationSystem';
+import { EnvironmentConfig } from '../config/gameConfig';
 // import { PlayerController } from './PlayerController'; // Will need later for player position
 
 interface EnvironmentSegment {
-  mesh: THREE.Mesh;
+  mesh: THREE.Group;
+  seafloor: THREE.Mesh;
+  decorations: THREE.Object3D[];
   isActive: boolean;
 }
 
 export class EnvironmentManager {
   private scene: THREE.Scene;
   private assetFactory: ProceduralAssetFactory;
   // private playerController: PlayerController; // To track player's Z position
 
+  private envConfig: EnvironmentConfig;
+  private segmentWidth: number;
+
   private segments: EnvironmentSegment[] = [];
   private segmentPoolSize = 5; // Number of segments to pool
   private segmentLength = 20; // Must match SeafloorAsset.segmentLength or get from asset
   private lastSegmentZ = 0; // Z position of the front edge of the furthest segment
 
   private visibleSegmentsFront = 2; // How many segments to keep ahead of player
   private visibleSegmentsBehind = 1; // How many segments to keep behind player
 
   constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory /*, playerController: PlayerController */) {
     this.scene = scene;
     this.assetFactory = assetFactory;
     // this.playerController = playerController;
 
+    this.envConfig = configSystem.getEnvironmentConfig();
+    this.segmentWidth = assetFactory.seafloorAsset.segmentWidth;
+
     // Get segmentLength from the assetFactory's public getter
     this.segmentLength = assetFactory.seafloorSegmentLength;
 
     this.initializeSegments();
     console.log("EnvironmentManager: Initialized.");
   }
 
   private initializeSegments(): void {
     for (let i = 0; i < this.segmentPoolSize; i++) {
-      const mesh = this.assetFactory.createSeafloorSegmentMesh();
-      mesh.visible = false; // Initially hide
-      this.scene.add(mesh);
-      this.segments.push({ mesh, isActive: false });
+      const floor = this.assetFactory.createSeafloorSegmentMesh();
+      const group = new THREE.Group();
+      group.add(floor);
+      group.visible = false; // Initially hide
+      this.scene.add(group);
+      this.segments.push({ mesh: group, seafloor: floor, decorations: [], isActive: false });
     }
     // Position initial segments
     for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
         this.spawnSegmentAhead(true); // true to force spawn at specific positions
     }
   }
   
   // Helper to get an inactive segment from the pool
   private getInactiveSegment(): EnvironmentSegment | undefined {
     return this.segments.find(seg => !seg.isActive);
   }
 
+  // Remove and dispose decorative props from a segment
+  private clearDecorations(segment: EnvironmentSegment): void {
+    segment.decorations.forEach(obj => {
+      if (obj.parent) obj.parent.remove(obj);
+      if (obj instanceof THREE.Mesh) {
+        obj.geometry.dispose();
+        if (Array.isArray(obj.material)) {
+          obj.material.forEach(m => m.dispose());
+        } else {
+          obj.material.dispose();
+        }
+      }
+    });
+    segment.decorations = [];
+  }
+
+  // Spawn decorative rocks and clams on a segment using config parameters
+  private spawnDecorations(segment: EnvironmentSegment): void {
+    const deco = this.envConfig.decorations;
+
+    const pebbleCount = THREE.MathUtils.randInt(deco.pebble.countMin, deco.pebble.countMax);
+    for (let i = 0; i < pebbleCount; i++) {
+      const mesh = this.assetFactory.createObstacleMesh('rock') as THREE.Mesh;
+      const s = THREE.MathUtils.randFloat(deco.pebble.scaleMin, deco.pebble.scaleMax);
+      mesh.scale.set(s, s, s);
+      mesh.position.set(
+        (Math.random() - 0.5) * this.segmentWidth,
+        -1,
+        (Math.random() - 0.5) * this.segmentLength
+      );
+      mesh.userData = { type: 'decoration', subtype: 'pebble' };
+      segment.mesh.add(mesh);
+      segment.decorations.push(mesh);
+    }
+
+    const clamCount = THREE.MathUtils.randInt(deco.clam.countMin, deco.clam.countMax);
+    for (let i = 0; i < clamCount; i++) {
+      const mesh = this.assetFactory.createObstacleMesh('clam');
+      mesh.scale.setScalar(
+        THREE.MathUtils.randFloat(deco.clam.scaleMin, deco.clam.scaleMax)
+      );
+      mesh.position.set(
+        (Math.random() - 0.5) * this.segmentWidth,
+        -1,
+        (Math.random() - 0.5) * this.segmentLength
+      );
+      (mesh as any).userData = { type: 'decoration', subtype: 'clam' };
+      segment.mesh.add(mesh);
+      segment.decorations.push(mesh);
+    }
+  }
+
   // Spawns a segment at the front of the current environment path
   private spawnSegmentAhead(initialSpawn = false): void {
     const segment = this.getInactiveSegment();
     if (segment) {
       segment.isActive = true;
       segment.mesh.visible = true;
+
+      // Clear previous decorations if any
+      this.clearDecorations(segment);
       
       // Position new segment ahead of the last one
       // The plane's origin is at its center. We want to place them edge-to-edge.
       // If lastSegmentZ is the Z of the *center* of the furthest segment:
       // segment.mesh.position.z = this.lastSegmentZ - this.segmentLength;
       // this.lastSegmentZ = segment.mesh.position.z;
 
       // If lastSegmentZ tracks the "front" edge (further Z for player) of the last segment:
       if (initialSpawn && this.segments.filter(s => s.isActive).length <=1 ) { // First segment
         segment.mesh.position.z = 0 - (this.segmentLength / 2);
         this.lastSegmentZ = 0 - this.segmentLength; // Front edge of this segment
       } else {
         segment.mesh.position.z = this.lastSegmentZ - (this.segmentLength / 2);
         this.lastSegmentZ -= this.segmentLength; // Update front edge tracker
       }
 
       // Y position for the floor (can be configurable)
       segment.mesh.position.y = -1; // Example: player is at y=0, floor is below
+
+      // Spawn decorative props on this segment
+      this.spawnDecorations(segment);
+
       console.log(`EnvironmentManager: Spawned segment at Z: ${segment.mesh.position.z}`);
     } else {
       console.warn("EnvironmentManager: No inactive segments available to spawn!");
     }
   }
 
   // Recycles segments that are too far behind the player
   private recycleSegments(playerZ: number): void {
     const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 1)); // Point beyond which segments are recycled
 
     this.segments.forEach(segment => {
       if (segment.isActive) {
         // A segment's "front" edge (closest to player when behind) is its position.z + segmentLength/2
         const segmentFrontEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
         if (segmentFrontEdgeZ > recycleThreshold) {
           segment.isActive = false;
           segment.mesh.visible = false;
+          this.clearDecorations(segment);
           console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
         }
       }
     });
   }
 
 
   public update(deltaTime: number, playerZ: number): void {
     // Check if we need to spawn new segments ahead
     // If the player is approaching the "end" of the visible segments
     const spawnTriggerZ = this.lastSegmentZ + (this.segmentLength * this.visibleSegmentsFront) - (this.segmentLength * 0.5) ;
     if (playerZ < spawnTriggerZ) {
       this.spawnSegmentAhead();
     }
 
     // Check if we need to recycle segments behind
     this.recycleSegments(playerZ);
   }
 
   public dispose(): void {
     this.segments.forEach(segment => {
-      segment.mesh.geometry.dispose();
-      if (Array.isArray(segment.mesh.material)) {
-        segment.mesh.material.forEach(m => m.dispose());
-      } else {
-        segment.mesh.material.dispose();
+      this.clearDecorations(segment);
+      segment.seafloor.geometry.dispose();
+      if (segment.seafloor.material instanceof THREE.Material) {
+        segment.seafloor.material.dispose();
       }
       this.scene.remove(segment.mesh);
     });
     this.segments = [];
     console.log("EnvironmentManager: Disposed.");
   }
 
   public reset(initialPlayerZ: number = 0): void {
     this.segments.forEach(segment => {
       segment.isActive = false;
       segment.mesh.visible = false;
+      this.clearDecorations(segment);
     });
     this.lastSegmentZ = initialPlayerZ + this.segmentLength;
     for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
       this.spawnSegmentAhead(true);
     }
     console.log("EnvironmentManager: Reset.");
   }
 
   /**
    * Gets the configuration system used by the game
    * @returns The configuration system
    */
   public getConfigSystem(): ConfigurationSystem {
     return configSystem;
   }
 } 
 
EOF
)
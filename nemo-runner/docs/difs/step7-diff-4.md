1) Ambient light now uses a turquoise color with slightly higher intensity

Directional light intensity decreased and color adjusted to a cooler tone

Fog parameters updated for a subtler underwater effect

LightingManager continues to pull its settings from the config during updates

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 120619e..cab669a 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -703,51 +703,57 @@ export const defaultConfig: GameConfig = {
       roughness: 0.85,
       metalness: 0.0,
       pebbleColors: [0x8e7b65, 0x9c8b76, 0x7b6a55],
       pebbleDensity: 40,
       pebbleSizeRange: [1, 3],
       decorations: {
         pebbles: { spawnCount: 20, scaleMin: 0.1, scaleMax: 0.3 },
         smallRocks: { spawnCount: 10, scaleMin: 0.2, scaleMax: 0.5 },
         clams: { spawnCount: 5, scaleMin: 0.3, scaleMax: 0.6 },
         kelp: { spawnCount: 3, scaleMin: 0.8, scaleMax: 1.2 }
       }
     },
     waterSurface: {
       baseColor: 0x87CEEB,
       rippleColor: 0xFFFFFF,
       rippleSpeed: 0.2,
       rippleScale: 10.0,
       rippleIntensity: 0.01,
       opacity: 0.3,
       fresnelPower: 2.0,
       specularColor: 0x77ccff,
       shininess: 80
     }
   },
   lighting: {
-    ambientLight: { color: 0x6699aa, intensity: 0.55 },
+    // Ambient light provides overall illumination for the scene. A slightly
+    // brighter turquoise tone enhances underwater visibility.
+    ambientLight: { color: 0x80d0d0, intensity: 0.6 },
+    // Directional light acts as the main light source. A cool light colour and
+    // slightly reduced intensity keeps the scene moody while still readable.
     directionalLight: {
-      color: 0xb3ecff,
-      intensity: 0.85,
+      color: 0xc8ffff,
+      intensity: 0.8,
       position: { x: 1, y: 10, z: 1 },
       castShadow: false
     },
-    fogColor: 0x083848,
-    fogNear: 8,
-    fogFar: 70,
+    // Fog parameters tuned to create a subtle turquoise atmosphere without
+    // overwhelming the player.
+    fogColor: 0x0d5660,
+    fogNear: 10,
+    fogFar: 60,
     enableCaustics: true,
     causticColor: 0x9cdfff,
     causticIntensity: 0.12,
     causticScale: 7.0,
     causticSpeed: 0.1,
     causticBlendMode: 'additive',
     enableGodRays: true,
     godRayColor: 0x9cdfff,
     godRayIntensity: 0.1,
     godRayDensity: 0.97,
     godRayWeight: 0.07,
     godRayDecay: 0.94,
     godRayExposure: 0.12,
     godRaySamples: 30
   },
 };
 
EOF
)

2) Introduced a textureResolution setting in the seafloor visuals configuration for finer control over generated sand textures

Defaulted textureResolution to 512 and raised pebbleDensity to 60 in the default configuration

Updated the seafloor asset’s internal interface and defaults to include textureResolution

Modified texture generation methods to respect the configured resolution

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index 55acb06..e09974e 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -88,104 +88,107 @@ class SimplexNoise {
       n0 = t0 * t0 * (this.grad3[gi0][0] * x0 + this.grad3[gi0][1] * y0);
     }
 
     let t1 = 0.5 - x1 * x1 - y1 * y1;
     if (t1 >= 0) {
       t1 *= t1;
       n1 = t1 * t1 * (this.grad3[gi1][0] * x1 + this.grad3[gi1][1] * y1);
     }
 
     let t2 = 0.5 - x2 * x2 - y2 * y2;
     if (t2 >= 0) {
       t2 *= t2;
       n2 = t2 * t2 * (this.grad3[gi2][0] * x2 + this.grad3[gi2][1] * y2);
     }
 
     return 70 * (n0 + n1 + n2);
   }
 }
 
 // Minimal interface mirroring Step 7 documentation
 interface SeafloorVisualConfig {
   baseColor: number | string;
   sandPatternColor1: number | string;
   sandPatternColor2: number | string;
   textureScale: number;
+  /** Resolution of generated textures. */
+  textureResolution?: number;
   bumpScale?: number;
   roughness?: number;
   metalness?: number;
   pebbleColors?: Array<number | string>;
   pebbleDensity?: number;
   pebbleSizeRange?: [number, number];
 }
 
 export class SeafloorAsset {
   private shaderManager: ShaderManager;
   private lightingManager: LightingManager | null = null;
   public segmentWidth: number;
   public segmentLength: number;
   private config: Readonly<SeafloorVisualConfig>;
 
   private material!: THREE.MeshStandardMaterial;
   private sandTexture!: THREE.CanvasTexture;
   private sandBumpMap!: THREE.CanvasTexture;
 
   constructor(shaderManager: ShaderManager) {
     this.shaderManager = shaderManager;
     this.config = this._fetchConfig();
     this.segmentWidth =
       configSystem.getWorldXBoundary() * 2 +
       configSystem.getPlayerLaneWidth() * 3;
     this.segmentLength = 20;
     this.createMaterial();
   }
 
   private _fetchConfig(): Readonly<SeafloorVisualConfig> {
     const defaultConfig: SeafloorVisualConfig = {
       baseColor: 0xad8e6e,
       sandPatternColor1: 0xc4a484,
       sandPatternColor2: 0x9a7b5a,
       textureScale: 15,
+      textureResolution: 256,
       bumpScale: 0.04,
       roughness: 0.85,
       metalness: 0.0,
       pebbleColors: [0x8e7b65, 0x9c8b76, 0x7b6a55],
       pebbleDensity: 40,
       pebbleSizeRange: [1, 3]
     };
     try {
       const visuals: any = configSystem.get('visuals');
       return { ...defaultConfig, ...(visuals?.seafloor || {}) };
     } catch (error) {
       console.warn('SeafloorAsset: Could not fetch config, using defaults', error);
       return defaultConfig;
     }
   }
 
   private createSandTexture(): THREE.CanvasTexture {
     const canvas = document.createElement('canvas');
-    const size = 256;
+    const size = this.config.textureResolution ?? 256;
     canvas.width = size;
     canvas.height = size;
     const ctx = canvas.getContext('2d')!;
 
     const baseColor = new THREE.Color(this.config.baseColor);
     const color1 = new THREE.Color(this.config.sandPatternColor1);
     const color2 = new THREE.Color(this.config.sandPatternColor2);
 
     const simplex = new SimplexNoise();
 
     const fbm = (x: number, y: number): number => {
       let value = 0;
       let amplitude = 0.5;
       let frequency = 1;
       for (let o = 0; o < 4; o++) {
         // Tileable simplex noise
         const n00 = simplex.noise2D((x * frequency) / size, (y * frequency) / size);
         const n10 = simplex.noise2D(((x - size) * frequency) / size, (y * frequency) / size);
         const n01 = simplex.noise2D((x * frequency) / size, ((y - size) * frequency) / size);
         const n11 = simplex.noise2D(((x - size) * frequency) / size, ((y - size) * frequency) / size);
         const sx = x / size;
         const sy = y / size;
         const ix0 = THREE.MathUtils.lerp(n00, n10, sx);
         const ix1 = THREE.MathUtils.lerp(n01, n11, sx);
         const n = THREE.MathUtils.lerp(ix0, ix1, sy);
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index 55acb06..e09974e 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -237,51 +240,51 @@ export class SeafloorAsset {
       const x = Math.random() * size;
       const y = Math.random() * size;
       const color =
         pebbleColors[Math.floor(Math.random() * pebbleColors.length)] ||
         baseColor;
       for (let dx = -1; dx <= 1; dx++) {
         for (let dy = -1; dy <= 1; dy++) {
           drawPebble(x + dx * size, y + dy * size, rx, ry, color);
         }
       }
     }
 
     const texture = new THREE.CanvasTexture(canvas);
     texture.wrapS = THREE.RepeatWrapping;
     texture.wrapT = THREE.RepeatWrapping;
     texture.repeat.set(
       this.config.textureScale / size,
       this.config.textureScale / size
     );
     texture.needsUpdate = true;
     return texture;
   }
 
   private createSandBumpMap(): THREE.CanvasTexture {
     const canvas = document.createElement('canvas');
-    const size = 256;
+    const size = this.config.textureResolution ?? 256;
     canvas.width = size;
     canvas.height = size;
     const ctx = canvas.getContext('2d')!;
 
     const simplex = new SimplexNoise();
 
     const fbm = (x: number, y: number): number => {
       let value = 0;
       let amplitude = 0.5;
       let frequency = 1;
       for (let o = 0; o < 5; o++) {
         const n00 = simplex.noise2D((x * frequency) / size, (y * frequency) / size);
         const n10 = simplex.noise2D(((x - size) * frequency) / size, (y * frequency) / size);
         const n01 = simplex.noise2D((x * frequency) / size, ((y - size) * frequency) / size);
         const n11 = simplex.noise2D(((x - size) * frequency) / size, ((y - size) * frequency) / size);
         const sx = x / size;
         const sy = y / size;
         const ix0 = THREE.MathUtils.lerp(n00, n10, sx);
         const ix1 = THREE.MathUtils.lerp(n01, n11, sx);
         const n = THREE.MathUtils.lerp(ix0, ix1, sy);
 
         value += n * amplitude;
         frequency *= 2;
         amplitude *= 0.5;
       }
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 120619e..6728bcf 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -213,50 +213,55 @@ export interface ObstaclesConfig {
 
 export interface DecorationSpawnConfig {
   spawnCount: number;
   scaleMin: number;
   scaleMax: number;
 }
 
 export interface DecorationItemConfig {
   colors: Array<number | string>;
   scaleMin: number;
   scaleMax: number;
 }
 
 export interface DecorationsConfig {
   pebble: DecorationItemConfig;
   smallRock: DecorationItemConfig;
   clam: DecorationItemConfig;
   kelp: DecorationItemConfig;
 }
 
 export interface SeafloorVisualConfig {
   baseColor: number | string;
   sandPatternColor1: number | string;
   sandPatternColor2: number | string;
   textureScale: number;
+  /**
+   * Resolution of the procedurally generated sand texture.
+   * Higher values yield finer detail at the cost of generation time.
+   */
+  textureResolution?: number;
   bumpScale?: number;
   roughness?: number;
   metalness?: number;
   pebbleColors?: Array<number | string>;
   pebbleDensity?: number;
   pebbleSizeRange?: [number, number];
   decorations?: {
     pebbles: DecorationSpawnConfig;
     smallRocks: DecorationSpawnConfig;
     clams: DecorationSpawnConfig;
     kelp: DecorationSpawnConfig;
   };
 }
 
 export interface WaterSurfaceVisualConfig {
   baseColor: number | string;
   rippleColor: number | string;
   rippleSpeed: number;
   rippleScale: number;
   rippleIntensity: number;
   opacity: number;
   fresnelPower?: number;
   specularColor?: number | string;
   shininess?: number;
 }
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 120619e..6728bcf 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -677,55 +682,56 @@ export const defaultConfig: GameConfig = {
 
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
 
     seafloor: {
       baseColor: 0xAD8E6E,
       sandPatternColor1: 0xC4A484,
       sandPatternColor2: 0x9A7B5A,
       textureScale: 15.0,
+      textureResolution: 512,
       bumpScale: 0.04,
       roughness: 0.85,
       metalness: 0.0,
       pebbleColors: [0x8e7b65, 0x9c8b76, 0x7b6a55],
-      pebbleDensity: 40,
+      pebbleDensity: 60,
       pebbleSizeRange: [1, 3],
       decorations: {
         pebbles: { spawnCount: 20, scaleMin: 0.1, scaleMax: 0.3 },
         smallRocks: { spawnCount: 10, scaleMin: 0.2, scaleMax: 0.5 },
         clams: { spawnCount: 5, scaleMin: 0.3, scaleMax: 0.6 },
         kelp: { spawnCount: 3, scaleMin: 0.8, scaleMax: 1.2 }
       }
     },
     waterSurface: {
       baseColor: 0x87CEEB,
       rippleColor: 0xFFFFFF,
       rippleSpeed: 0.2,
       rippleScale: 10.0,
       rippleIntensity: 0.01,
       opacity: 0.3,
       fresnelPower: 2.0,
       specularColor: 0x77ccff,
       shininess: 80
     }
   },
   lighting: {
     ambientLight: { color: 0x6699aa, intensity: 0.55 },
     directionalLight: {
       color: 0xb3ecff,
       intensity: 0.85,
 
EOF
)

3) Updated the default decoration sizes to match the requested ranges for pebbles, small rocks, and clams in the main configuration file

Adjusted the seafloor decoration spawn settings accordingly to use the new size ranges

Verified that the spawn logic pulls these values when creating decorations on the seafloor

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 120619e..cedc460 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -622,117 +622,117 @@ export const defaultConfig: GameConfig = {
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
   decorations: {
     pebble: {
       colors: [0x888888, 0x777777, 0x999999, 0x666666],
-      scaleMin: 0.1,
-      scaleMax: 0.3
+      scaleMin: 0.08,
+      scaleMax: 0.25
     },
     smallRock: {
       colors: [0x666666, 0x555555, 0x444444, 0x777777],
-      scaleMin: 0.3,
-      scaleMax: 0.6
+      scaleMin: 0.15,
+      scaleMax: 0.4
     },
     clam: {
       colors: [0xD8C0A8, 0xE0D0B0, 0xC8B090, 0xF0E0C8],
-      scaleMin: 0.4,
-      scaleMax: 0.7
+      scaleMin: 0.25,
+      scaleMax: 0.55
     },
     kelp: {
       colors: [0x2e8b57, 0x3a5f0b, 0x20603d],
       scaleMin: 0.8,
       scaleMax: 1.2
     }
   },
   visuals: {
     skyColor: 0x144c55, // Turquoise-tinted background
 
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
 
     seafloor: {
       baseColor: 0xAD8E6E,
       sandPatternColor1: 0xC4A484,
       sandPatternColor2: 0x9A7B5A,
       textureScale: 15.0,
       bumpScale: 0.04,
       roughness: 0.85,
       metalness: 0.0,
       pebbleColors: [0x8e7b65, 0x9c8b76, 0x7b6a55],
       pebbleDensity: 40,
       pebbleSizeRange: [1, 3],
-      decorations: {
-        pebbles: { spawnCount: 20, scaleMin: 0.1, scaleMax: 0.3 },
-        smallRocks: { spawnCount: 10, scaleMin: 0.2, scaleMax: 0.5 },
-        clams: { spawnCount: 5, scaleMin: 0.3, scaleMax: 0.6 },
-        kelp: { spawnCount: 3, scaleMin: 0.8, scaleMax: 1.2 }
-      }
+        decorations: {
+          pebbles: { spawnCount: 20, scaleMin: 0.08, scaleMax: 0.25 },
+          smallRocks: { spawnCount: 10, scaleMin: 0.15, scaleMax: 0.4 },
+          clams: { spawnCount: 5, scaleMin: 0.25, scaleMax: 0.55 },
+          kelp: { spawnCount: 3, scaleMin: 0.8, scaleMax: 1.2 }
+        }
     },
     waterSurface: {
       baseColor: 0x87CEEB,
       rippleColor: 0xFFFFFF,
       rippleSpeed: 0.2,
       rippleScale: 10.0,
       rippleIntensity: 0.01,
       opacity: 0.3,
       fresnelPower: 2.0,
       specularColor: 0x77ccff,
       shininess: 80
     }
   },
   lighting: {
     ambientLight: { color: 0x6699aa, intensity: 0.55 },
     directionalLight: {
       color: 0xb3ecff,
       intensity: 0.85,
       position: { x: 1, y: 10, z: 1 },
       castShadow: false
     },
     fogColor: 0x083848,
     fogNear: 8,
     fogFar: 70,
     enableCaustics: true,
 
EOF
)

4) Implemented a new StarfishAsset that creates a five-armed star mesh with random colors for decoration purposes

Added a starfish asset generator and getter to ProceduralAssetFactory so the asset can be reused from pools

Extended EnvironmentManager to maintain a starfish pool, spawn starfish decorations, and recycle them with other decorations

Updated game configuration to include starfish decoration settings and seafloor spawn counts

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
index 42da845..857364c 100644
--- a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
+++ b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
@@ -1,69 +1,71 @@
 import * as THREE from 'three';
 import { ShaderManager, MaterialType } from '../services/ShaderManager';
 import { SeafloorAsset } from './environment/SeafloorAsset';
 import { WaterSurfaceAsset } from './environment/WaterSurfaceAsset';
 import { PebbleAsset } from './environment/PebbleAsset';
 import { SmallRockAsset } from './environment/SmallRockAsset';
 import { ClamDecorAsset } from './environment/ClamDecorAsset';
 import { KelpAsset } from './environment/KelpAsset';
+import { StarfishAsset } from './environment/StarfishAsset';
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
   private waterSurfaceAsset?: WaterSurfaceAsset;
   private pebbleAssetGenerator?: PebbleAsset;
   private smallRockAssetGenerator?: SmallRockAsset;
   private clamDecorAssetGenerator?: ClamDecorAsset;
   private kelpAssetGenerator?: KelpAsset;
+  private starfishAssetGenerator?: StarfishAsset;
 
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
     
diff --git a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
index 42da845..857364c 100644
--- a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
+++ b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
@@ -316,50 +318,57 @@ export class ProceduralAssetFactory {
     }
     return this.pebbleAssetGenerator.getMesh();
   }
 
   public getSmallRockMesh(): THREE.Mesh {
     if (!this.smallRockAssetGenerator) {
       this.smallRockAssetGenerator = new SmallRockAsset();
     }
     return this.smallRockAssetGenerator.getMesh();
   }
 
   public getClamDecorMesh(): THREE.Group {
     if (!this.clamDecorAssetGenerator) {
       this.clamDecorAssetGenerator = new ClamDecorAsset();
     }
     return this.clamDecorAssetGenerator.getMesh();
   }
 
   public getKelpMesh(): THREE.Group {
     if (!this.kelpAssetGenerator) {
       this.kelpAssetGenerator = new KelpAsset();
     }
     return this.kelpAssetGenerator.getMesh();
   }
 
+  public getStarfishMesh(): THREE.Mesh {
+    if (!this.starfishAssetGenerator) {
+      this.starfishAssetGenerator = new StarfishAsset();
+    }
+    return this.starfishAssetGenerator.getMesh();
+  }
+
   public createKelpAsset(): KelpAsset {
     return new KelpAsset();
   }
 
   /**
    * Exposes the internal ShaderManager instance
    */
   public getShaderManager(): ShaderManager {
     return this.shaderManager;
   }
 
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
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/StarfishAsset.ts
index 0000000..264ba5c 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/StarfishAsset.ts
@@ -0,0 +1,78 @@
+import * as THREE from 'three';
+import { configSystem } from '../../core/ConfigurationSystem';
+import { DecorationItemConfig } from '../../config/gameConfig';
+
+/**
+ * Simple decorative starfish with five arms.
+ */
+export class StarfishAsset {
+  private config: Readonly<DecorationItemConfig>;
+  private mesh: THREE.Mesh;
+
+  constructor() {
+    this.config = (configSystem.getDecorationsConfig() as any).starfish;
+    this.mesh = this.createMesh();
+  }
+
+  private randomColor(): THREE.Color {
+    const colors = this.config?.colors || [0xffa07a];
+    const value = colors[Math.floor(Math.random() * colors.length)];
+    return new THREE.Color(value as any);
+  }
+
+  private createGeometry(): THREE.BufferGeometry {
+    const arms = 5;
+    const outerRadius = 0.5;
+    const innerRadius = outerRadius * 0.4;
+    const shape = new THREE.Shape();
+    for (let i = 0; i < arms; i++) {
+      const angle = (i / arms) * Math.PI * 2;
+      const outerX = Math.cos(angle) * outerRadius;
+      const outerY = Math.sin(angle) * outerRadius;
+      if (i === 0) {
+        shape.moveTo(outerX, outerY);
+      } else {
+        shape.lineTo(outerX, outerY);
+      }
+      const innerAngle = angle + Math.PI / arms;
+      const innerX = Math.cos(innerAngle) * innerRadius;
+      const innerY = Math.sin(innerAngle) * innerRadius;
+      shape.lineTo(innerX, innerY);
+    }
+    shape.closePath();
+
+    const geometry = new THREE.ExtrudeGeometry(shape, {
+      depth: 0.1,
+      bevelEnabled: false,
+    });
+    geometry.rotateX(Math.PI / 2);
+    geometry.computeVertexNormals();
+    return geometry;
+  }
+
+  private createMesh(): THREE.Mesh {
+    const geometry = this.createGeometry();
+    const material = new THREE.MeshStandardMaterial({
+      color: this.randomColor(),
+      roughness: 0.9,
+      metalness: 0.1,
+    });
+    const mesh = new THREE.Mesh(geometry, material);
+    mesh.name = 'StarfishDecor';
+    const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
+    mesh.scale.setScalar(scale);
+    mesh.userData.decorationType = 'starfish';
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
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 120619e..13702b4 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -206,68 +206,70 @@ export interface ObstaclesConfig {
   seaTurtle: SeaTurtleConfig;
   kelpWall: KelpWallObstacleConfig;
   schoolOfFish: SchoolOfFishObstacleConfig;
   rock: RockConfig;
   coral: CoralConfig;
   clam: ClamConfig;
 }
 
 export interface DecorationSpawnConfig {
   spawnCount: number;
   scaleMin: number;
   scaleMax: number;
 }
 
 export interface DecorationItemConfig {
   colors: Array<number | string>;
   scaleMin: number;
   scaleMax: number;
 }
 
 export interface DecorationsConfig {
   pebble: DecorationItemConfig;
   smallRock: DecorationItemConfig;
   clam: DecorationItemConfig;
   kelp: DecorationItemConfig;
+  starfish: DecorationItemConfig;
 }
 
 export interface SeafloorVisualConfig {
   baseColor: number | string;
   sandPatternColor1: number | string;
   sandPatternColor2: number | string;
   textureScale: number;
   bumpScale?: number;
   roughness?: number;
   metalness?: number;
   pebbleColors?: Array<number | string>;
   pebbleDensity?: number;
   pebbleSizeRange?: [number, number];
   decorations?: {
     pebbles: DecorationSpawnConfig;
     smallRocks: DecorationSpawnConfig;
     clams: DecorationSpawnConfig;
     kelp: DecorationSpawnConfig;
+    starfish: DecorationSpawnConfig;
   };
 }
 
 export interface WaterSurfaceVisualConfig {
   baseColor: number | string;
   rippleColor: number | string;
   rippleSpeed: number;
   rippleScale: number;
   rippleIntensity: number;
   opacity: number;
   fresnelPower?: number;
   specularColor?: number | string;
   shininess?: number;
 }
 
 export interface LightingConfig {
   ambientLight: { color: number; intensity: number };
   directionalLight: {
     color: number;
     intensity: number;
     position: { x: number; y: number; z: number };
     castShadow?: boolean;
     shadowMapSize?: number;
   };
   fogColor: number | string;
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 120619e..13702b4 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -639,99 +641,105 @@ export const defaultConfig: GameConfig = {
         animationSpeed: 3.0,
         animationAmplitude: 0.5
       }
     }
   },
   decorations: {
     pebble: {
       colors: [0x888888, 0x777777, 0x999999, 0x666666],
       scaleMin: 0.1,
       scaleMax: 0.3
     },
     smallRock: {
       colors: [0x666666, 0x555555, 0x444444, 0x777777],
       scaleMin: 0.3,
       scaleMax: 0.6
     },
     clam: {
       colors: [0xD8C0A8, 0xE0D0B0, 0xC8B090, 0xF0E0C8],
       scaleMin: 0.4,
       scaleMax: 0.7
     },
     kelp: {
       colors: [0x2e8b57, 0x3a5f0b, 0x20603d],
       scaleMin: 0.8,
       scaleMax: 1.2
+    },
+    starfish: {
+      colors: [0xffa07a, 0xff6347, 0xffc1a1, 0xffd1b3],
+      scaleMin: 0.4,
+      scaleMax: 0.7
     }
   },
   visuals: {
     skyColor: 0x144c55, // Turquoise-tinted background
 
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
 
     seafloor: {
       baseColor: 0xAD8E6E,
       sandPatternColor1: 0xC4A484,
       sandPatternColor2: 0x9A7B5A,
       textureScale: 15.0,
       bumpScale: 0.04,
       roughness: 0.85,
       metalness: 0.0,
       pebbleColors: [0x8e7b65, 0x9c8b76, 0x7b6a55],
       pebbleDensity: 40,
       pebbleSizeRange: [1, 3],
       decorations: {
         pebbles: { spawnCount: 20, scaleMin: 0.1, scaleMax: 0.3 },
         smallRocks: { spawnCount: 10, scaleMin: 0.2, scaleMax: 0.5 },
         clams: { spawnCount: 5, scaleMin: 0.3, scaleMax: 0.6 },
-        kelp: { spawnCount: 3, scaleMin: 0.8, scaleMax: 1.2 }
+        kelp: { spawnCount: 3, scaleMin: 0.8, scaleMax: 1.2 },
+        starfish: { spawnCount: 4, scaleMin: 0.4, scaleMax: 0.7 }
       }
     },
     waterSurface: {
       baseColor: 0x87CEEB,
       rippleColor: 0xFFFFFF,
       rippleSpeed: 0.2,
       rippleScale: 10.0,
       rippleIntensity: 0.01,
       opacity: 0.3,
       fresnelPower: 2.0,
       specularColor: 0x77ccff,
       shininess: 80
     }
   },
   lighting: {
     ambientLight: { color: 0x6699aa, intensity: 0.55 },
     directionalLight: {
       color: 0xb3ecff,
       intensity: 0.85,
       position: { x: 1, y: 10, z: 1 },
       castShadow: false
     },
     fogColor: 0x083848,
     fogNear: 8,
     fogFar: 70,
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index 12d5571..886426a 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -9,55 +9,57 @@ interface EnvironmentSegment {
   seafloor: THREE.Mesh;
   decorations: THREE.Object3D[];
   isActive: boolean;
 }
 
 export class EnvironmentManager {
   private scene: THREE.Scene;
   private assetFactory: ProceduralAssetFactory;
   // private playerController: PlayerController; // To track player's Z position
 
   private segments: EnvironmentSegment[] = [];
   private segmentPoolSize = 5; // Number of segments to pool
   private segmentLength = 20; // Must match SeafloorAsset.segmentLength or get from asset
   private segmentWidth = 10;
   private lastSegmentZ = 0; // Z position of the front edge of the furthest segment
 
   private visibleSegmentsFront = 2; // How many segments to keep ahead of player
   private visibleSegmentsBehind = 1; // How many segments to keep behind player
 
   private waterSurface?: WaterSurfaceAsset;
 
   private pebblePool: THREE.Mesh[] = [];
   private rockPool: THREE.Mesh[] = [];
   private clamPool: THREE.Group[] = [];
   private kelpPool: THREE.Group[] = [];
+  private starfishPool: THREE.Mesh[] = [];
 
   private pebblePoolSize = 50;
   private rockPoolSize = 20;
   private clamPoolSize = 10;
   private kelpPoolSize = 20;
+  private starfishPoolSize = 15;
 
   constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory /*, playerController: PlayerController */) {
     this.scene = scene;
     this.assetFactory = assetFactory;
     // this.playerController = playerController;
 
     // Get segmentLength from the assetFactory's public getter
     this.segmentLength = assetFactory.seafloorSegmentLength;
     this.segmentWidth = assetFactory.seafloorAsset.segmentWidth;
   }
 
   public async initialize(): Promise<void> {
     await this.initializeSegments();
     this.initializeDecorationPools();
     this.initializeWaterSurface();
     console.log("EnvironmentManager: Initialized.");
   }
 
   private async initializeSegments(): Promise<void> {
     for (let i = 0; i < this.segmentPoolSize; i++) {
       const floor = await this.assetFactory.createSeafloorSegmentMesh();
       const group = new THREE.Group();
       group.add(floor);
       group.visible = false; // Initially hide
       this.scene.add(group);
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index 12d5571..886426a 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -83,100 +85,111 @@ export class EnvironmentManager {
     for (let i = 0; i < this.rockPoolSize; i++) {
       const rock = this.assetFactory.getSmallRockMesh();
       rock.visible = false;
       rock.userData.decorationType = 'rock';
       this.scene.add(rock);
       this.rockPool.push(rock);
     }
 
     // Initialize clams
     for (let i = 0; i < this.clamPoolSize; i++) {
       const clam = this.assetFactory.getClamDecorMesh();
       clam.visible = false;
       clam.userData.decorationType = 'clam';
       this.scene.add(clam);
       this.clamPool.push(clam);
     }
 
     // Initialize kelp decorations
     for (let i = 0; i < this.kelpPoolSize; i++) {
       const kelp = this.assetFactory.getKelpMesh();
       kelp.visible = false;
       kelp.userData.decorationType = 'kelp';
       this.scene.add(kelp);
       this.kelpPool.push(kelp);
     }
+
+    // Initialize starfish decorations
+    for (let i = 0; i < this.starfishPoolSize; i++) {
+      const star = this.assetFactory.getStarfishMesh();
+      star.visible = false;
+      star.userData.decorationType = 'starfish';
+      this.scene.add(star);
+      this.starfishPool.push(star);
+    }
   }
 
   private initializeWaterSurface(): void {
     this.waterSurface = this.assetFactory.getWaterSurfaceAsset();
     const mesh = this.waterSurface.getMesh();
     mesh.position.y = 10;
     this.scene.add(mesh);
   }
 
   /** Disposes a material and any textures referenced on it */
   private disposeMaterial(material: THREE.Material): void {
     const mat = material as any;
     for (const key of Object.keys(mat)) {
       const value = mat[key];
       if (value instanceof THREE.Texture) {
         value.dispose();
       }
     }
     material.dispose();
   }
 
   /** Fully dispose of a mesh or group and remove it from the scene */
   private disposeObject(object: THREE.Object3D): void {
     object.traverse(child => {
       if (child instanceof THREE.Mesh) {
         child.geometry?.dispose();
         const material = child.material as THREE.Material | THREE.Material[];
         if (Array.isArray(material)) {
           material.forEach(m => this.disposeMaterial(m));
         } else if (material) {
           this.disposeMaterial(material);
         }
       }
     });
     this.scene.remove(object);
   }
 
   /**
    * Dispose all decoration objects currently stored in pools and empty them
    */
   private clearDecorationPools(): void {
     this.pebblePool.forEach(p => this.disposeObject(p));
     this.rockPool.forEach(r => this.disposeObject(r));
     this.clamPool.forEach(c => this.disposeObject(c));
     this.kelpPool.forEach(k => this.disposeObject(k));
+    this.starfishPool.forEach(s => this.disposeObject(s));
 
     this.pebblePool = [];
     this.rockPool = [];
     this.clamPool = [];
     this.kelpPool = [];
+    this.starfishPool = [];
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
       // segment.mesh.position.z = this.lastSegmentZ - this.segmentLength;
       // this.lastSegmentZ = segment.mesh.position.z;
 
       // If lastSegmentZ tracks the "front" edge (further Z for player) of the last segment:
       if (initialSpawn && this.segments.filter(s => s.isActive).length <=1 ) { // First segment
         segment.mesh.position.z = 0 - (this.segmentLength / 2);
         this.lastSegmentZ = 0 - this.segmentLength; // Front edge of this segment
       } else {
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index 12d5571..886426a 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -224,89 +237,103 @@ export class EnvironmentManager {
       this.placeDecoration(rock, segment);
       segment.decorations.push(rock);
     }
 
     // Spawn clams
     const clamSettings = decoConfig.clams;
     const clamCount = clamSettings.spawnCount;
     for (let i = 0; i < clamCount && this.clamPool.length > 0; i++) {
       const clam = this.clamPool.pop()!;
       const scale = THREE.MathUtils.randFloat(clamSettings.scaleMin, clamSettings.scaleMax);
       clam.scale.setScalar(scale);
       this.placeDecoration(clam, segment);
       segment.decorations.push(clam);
     }
 
     // Spawn kelp
     const kelpSettings = decoConfig.kelp;
     const kelpCount = kelpSettings.spawnCount;
     for (let i = 0; i < kelpCount && this.kelpPool.length > 0; i++) {
       const kelp = this.kelpPool.pop()!;
       const scale = THREE.MathUtils.randFloat(kelpSettings.scaleMin, kelpSettings.scaleMax);
       kelp.scale.setScalar(scale);
       this.placeDecoration(kelp, segment);
       segment.decorations.push(kelp);
     }
+
+    // Spawn starfish
+    const starSettings = decoConfig.starfish;
+    const starCount = starSettings.spawnCount;
+    for (let i = 0; i < starCount && this.starfishPool.length > 0; i++) {
+      const star = this.starfishPool.pop()!;
+      const scale = THREE.MathUtils.randFloat(starSettings.scaleMin, starSettings.scaleMax);
+      star.scale.setScalar(scale);
+      this.placeDecoration(star, segment);
+      segment.decorations.push(star);
+    }
   }
 
   private placeDecoration(obj: THREE.Object3D, segment: EnvironmentSegment): void {
     obj.position.x = THREE.MathUtils.randFloatSpread(this.segmentWidth * 0.8);
     obj.position.y = segment.mesh.position.y;
     obj.position.z = segment.mesh.position.z + THREE.MathUtils.randFloatSpread(this.segmentLength);
     obj.rotation.y = Math.random() * Math.PI * 2;
     obj.visible = true;
   }
 
   // Recycles segments that are too far behind the player
   private recycleSegments(playerZ: number): void {
     const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 2)); // Increased buffer
 
     this.segments.forEach(segment => {
       if (segment.isActive) {
         // A segment's far edge (farthest from the player when behind)
         // is its position.z + segmentLength/2
         const segmentFarEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
         if (segmentFarEdgeZ > recycleThreshold) {
           segment.isActive = false;
           segment.mesh.visible = false;
 
           // Return decorations to pools
           segment.decorations.forEach(obj => {
             obj.visible = false;
             switch (obj.userData.decorationType) {
               case 'pebble':
                 this.pebblePool.push(obj as THREE.Mesh);
                 break;
               case 'rock':
                 this.rockPool.push(obj as THREE.Mesh);
                 break;
               case 'clam':
                 this.clamPool.push(obj as THREE.Group);
                 break;
               case 'kelp':
                 this.kelpPool.push(obj as THREE.Group);
                 break;
+              case 'starfish':
+                this.starfishPool.push(obj as THREE.Mesh);
+                break;
             }
           });
           segment.decorations = [];
           console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
         }
       }
     });
   }
 
 
   public async update(deltaTime: number, playerZ: number, elapsedTime: number): Promise<void> {
     // Check if we need to spawn new segments ahead
     // If the player is approaching the "end" of the visible segments
     const spawnTriggerZ = this.lastSegmentZ + (this.segmentLength * this.visibleSegmentsFront) - (this.segmentLength * 0.5) ;
     if (playerZ < spawnTriggerZ) {
       this.spawnSegmentAhead();
     }
 
     // Check if we need to recycle segments behind
     this.recycleSegments(playerZ);
 
     // Update water surface
     this.waterSurface?.update(deltaTime, elapsedTime);
   }
 
 
EOF
)

5) Console warning in “SeafloorAsset” is now wrapped in a development check, ensuring it only shows outside production

Linking message in “SeafloorAsset” also respects the development check to prevent noise in production logs

Environment manager initialization and lifecycle logs are now gated by the same development check

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index 55acb06..c75d897 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -134,51 +134,53 @@ export class SeafloorAsset {
     this.config = this._fetchConfig();
     this.segmentWidth =
       configSystem.getWorldXBoundary() * 2 +
       configSystem.getPlayerLaneWidth() * 3;
     this.segmentLength = 20;
     this.createMaterial();
   }
 
   private _fetchConfig(): Readonly<SeafloorVisualConfig> {
     const defaultConfig: SeafloorVisualConfig = {
       baseColor: 0xad8e6e,
       sandPatternColor1: 0xc4a484,
       sandPatternColor2: 0x9a7b5a,
       textureScale: 15,
       bumpScale: 0.04,
       roughness: 0.85,
       metalness: 0.0,
       pebbleColors: [0x8e7b65, 0x9c8b76, 0x7b6a55],
       pebbleDensity: 40,
       pebbleSizeRange: [1, 3]
     };
     try {
       const visuals: any = configSystem.get('visuals');
       return { ...defaultConfig, ...(visuals?.seafloor || {}) };
     } catch (error) {
-      console.warn('SeafloorAsset: Could not fetch config, using defaults', error);
+      if (process.env.NODE_ENV !== 'production') {
+        console.warn('SeafloorAsset: Could not fetch config, using defaults', error);
+      }
       return defaultConfig;
     }
   }
 
   private createSandTexture(): THREE.CanvasTexture {
     const canvas = document.createElement('canvas');
     const size = 256;
     canvas.width = size;
     canvas.height = size;
     const ctx = canvas.getContext('2d')!;
 
     const baseColor = new THREE.Color(this.config.baseColor);
     const color1 = new THREE.Color(this.config.sandPatternColor1);
     const color2 = new THREE.Color(this.config.sandPatternColor2);
 
     const simplex = new SimplexNoise();
 
     const fbm = (x: number, y: number): number => {
       let value = 0;
       let amplitude = 0.5;
       let frequency = 1;
       for (let o = 0; o < 4; o++) {
         // Tileable simplex noise
         const n00 = simplex.noise2D((x * frequency) / size, (y * frequency) / size);
         const n10 = simplex.noise2D(((x - size) * frequency) / size, (y * frequency) / size);
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index 55acb06..c75d897 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -373,51 +375,53 @@ export class SeafloorAsset {
         shader.fragmentShader =
           'varying vec3 vWorldPosition_Seafloor;\n' +
           this.lightingManager!.getCausticGLSLChunk() +
           '\n' +
           shader.fragmentShader;
 
         shader.fragmentShader = shader.fragmentShader.replace(
           /vec4 diffuseColor = vec4\( diffuse, opacity \);/,
           `vec3 caustic = getCausticColor(vWorldPosition_Seafloor, uTime, uCausticScale, uCausticIntensity, uCausticColor);\nvec4 diffuseColor = vec4(diffuse + caustic, opacity);`
         );
       };
     }
   }
 
   /**
    * Links the LightingManager to enable caustic effects on seafloor
    * @param lightingManager The game's LightingManager instance
    */
   public linkLightingManager(lightingManager: LightingManager): void {
     this.lightingManager = lightingManager;
     // Rebuild material if lighting manager was missing during construction
     if (this.material && !this.material.onBeforeCompile) {
       this.dispose();
       this.createMaterial();
     }
-    console.log('SeafloorAsset: Linked with LightingManager for caustic effects');
+    if (process.env.NODE_ENV !== 'production') {
+      console.log('SeafloorAsset: Linked with LightingManager for caustic effects');
+    }
   }
 
   /**
    * Creates a seafloor segment mesh with updated UVs
    */
   public createMesh(): THREE.Mesh {
     const geometry = new THREE.PlaneGeometry(
       this.segmentWidth,
       this.segmentLength,
       20,
       20
     );
     geometry.rotateX(-Math.PI / 2);
 
     geometry.setAttribute(
       'uv',
       new THREE.BufferAttribute(
         new Float32Array(geometry.attributes.position.count * 2),
         2
       )
     );
     const positions = geometry.attributes.position as THREE.BufferAttribute;
     const uvs = geometry.attributes.uv as THREE.BufferAttribute;
     for (let i = 0; i < positions.count; i++) {
       uvs.setXY(
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index 12d5571..8c304cf 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -29,51 +29,53 @@ export class EnvironmentManager {
 
   private pebblePool: THREE.Mesh[] = [];
   private rockPool: THREE.Mesh[] = [];
   private clamPool: THREE.Group[] = [];
   private kelpPool: THREE.Group[] = [];
 
   private pebblePoolSize = 50;
   private rockPoolSize = 20;
   private clamPoolSize = 10;
   private kelpPoolSize = 20;
 
   constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory /*, playerController: PlayerController */) {
     this.scene = scene;
     this.assetFactory = assetFactory;
     // this.playerController = playerController;
 
     // Get segmentLength from the assetFactory's public getter
     this.segmentLength = assetFactory.seafloorSegmentLength;
     this.segmentWidth = assetFactory.seafloorAsset.segmentWidth;
   }
 
   public async initialize(): Promise<void> {
     await this.initializeSegments();
     this.initializeDecorationPools();
     this.initializeWaterSurface();
-    console.log("EnvironmentManager: Initialized.");
+    if (process.env.NODE_ENV !== 'production') {
+      console.log("EnvironmentManager: Initialized.");
+    }
   }
 
   private async initializeSegments(): Promise<void> {
     for (let i = 0; i < this.segmentPoolSize; i++) {
       const floor = await this.assetFactory.createSeafloorSegmentMesh();
       const group = new THREE.Group();
       group.add(floor);
       group.visible = false; // Initially hide
       this.scene.add(group);
       this.segments.push({ mesh: group, seafloor: floor, decorations: [], isActive: false });
     }
     // Position initial segments
     for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
         this.spawnSegmentAhead(true); // true to force spawn at specific positions
     }
   }
 
   private initializeDecorationPools(): void {
     // Initialize pebbles
     for (let i = 0; i < this.pebblePoolSize; i++) {
       const pebble = this.assetFactory.getPebbleMesh();
       pebble.visible = false;
       pebble.userData.decorationType = 'pebble';
       this.scene.add(pebble);
       this.pebblePool.push(pebble);
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index 12d5571..8c304cf 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -168,53 +170,57 @@ export class EnvironmentManager {
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
 
       segment.decorations = [];
       this.spawnDecorations(segment);
       
-      console.log(`EnvironmentManager: Spawned segment at Z: ${segment.mesh.position.z}`);
+      if (process.env.NODE_ENV !== 'production') {
+        console.log(`EnvironmentManager: Spawned segment at Z: ${segment.mesh.position.z}`);
+      }
     } else {
-      console.warn("EnvironmentManager: No inactive segments available to spawn!");
+      if (process.env.NODE_ENV !== 'production') {
+        console.warn("EnvironmentManager: No inactive segments available to spawn!");
+      }
     }
   }
 
   private spawnDecorations(segment: EnvironmentSegment): void {
     const decoConfig = configSystem.getSeafloorConfig().decorations;
 
     if (!decoConfig) {
       return;
     }
 
     // Spawn pebbles
     const pebbleSettings = decoConfig.pebbles;
     const pebbleCount = pebbleSettings.spawnCount;
     for (let i = 0; i < pebbleCount && this.pebblePool.length > 0; i++) {
       const pebble = this.pebblePool.pop()!;
       const scale = THREE.MathUtils.randFloat(pebbleSettings.scaleMin, pebbleSettings.scaleMax);
       pebble.scale.setScalar(scale);
       this.placeDecoration(pebble, segment);
       segment.decorations.push(pebble);
     }
 
     // Spawn rocks
     const rockSettings = decoConfig.smallRocks;
     const rockCount = rockSettings.spawnCount;
     for (let i = 0; i < rockCount && this.rockPool.length > 0; i++) {
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index 12d5571..8c304cf 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -266,96 +272,102 @@ export class EnvironmentManager {
         // is its position.z + segmentLength/2
         const segmentFarEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
         if (segmentFarEdgeZ > recycleThreshold) {
           segment.isActive = false;
           segment.mesh.visible = false;
 
           // Return decorations to pools
           segment.decorations.forEach(obj => {
             obj.visible = false;
             switch (obj.userData.decorationType) {
               case 'pebble':
                 this.pebblePool.push(obj as THREE.Mesh);
                 break;
               case 'rock':
                 this.rockPool.push(obj as THREE.Mesh);
                 break;
               case 'clam':
                 this.clamPool.push(obj as THREE.Group);
                 break;
               case 'kelp':
                 this.kelpPool.push(obj as THREE.Group);
                 break;
             }
           });
           segment.decorations = [];
-          console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
+          if (process.env.NODE_ENV !== 'production') {
+            console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
+          }
         }
       }
     });
   }
 
 
   public async update(deltaTime: number, playerZ: number, elapsedTime: number): Promise<void> {
     // Check if we need to spawn new segments ahead
     // If the player is approaching the "end" of the visible segments
     const spawnTriggerZ = this.lastSegmentZ + (this.segmentLength * this.visibleSegmentsFront) - (this.segmentLength * 0.5) ;
     if (playerZ < spawnTriggerZ) {
       this.spawnSegmentAhead();
     }
 
     // Check if we need to recycle segments behind
     this.recycleSegments(playerZ);
 
     // Update water surface
     this.waterSurface?.update(deltaTime, elapsedTime);
   }
 
   public dispose(): void {
     this.segments.forEach(segment => {
       this.disposeObject(segment.seafloor);
       this.scene.remove(segment.mesh);
       segment.decorations.forEach(obj => this.disposeObject(obj));
     });
     this.segments = [];
 
     this.waterSurface?.dispose();
 
     // Dispose decoration pools
     this.clearDecorationPools();
 
-    console.log("EnvironmentManager: Disposed.");
+    if (process.env.NODE_ENV !== 'production') {
+      console.log("EnvironmentManager: Disposed.");
+    }
   }
 
   public async reset(initialPlayerZ: number = 0): Promise<void> {
     // Remove and dispose any active decorations
     this.segments.forEach(segment => {
       segment.isActive = false;
       segment.mesh.visible = false;
 
       segment.decorations.forEach(obj => {
         this.disposeObject(obj);
       });
       segment.decorations = [];
     });
 
     // Clear existing pooled decorations and recreate them
     this.clearDecorationPools();
     this.initializeDecorationPools();
     this.lastSegmentZ = initialPlayerZ + this.segmentLength;
     for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
       this.spawnSegmentAhead(true);
     }
     if (this.waterSurface) {
       this.waterSurface.getMesh().position.z = initialPlayerZ - 20;
     }
-    console.log("EnvironmentManager: Reset.");
+    if (process.env.NODE_ENV !== 'production') {
+      console.log("EnvironmentManager: Reset.");
+    }
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

6) Added new DecorationInstanceData and DecorationRef interfaces and replaced individual decoration pools with instanced meshes for pebbles, rocks, clams, and kelp

Created instanced meshes during initialization and populated them with hidden instances ready for use

Updated decoration spawning to place instances by composing matrices rather than attaching meshes directly

Reworked recycling and reset logic to deactivate instances and mark their matrices as off-screen for reuse

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index 12d5571..528d32d 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -1,361 +1,438 @@
 import * as THREE from 'three';
+import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
 import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
 import { ConfigurationSystem, configSystem } from '../core/ConfigurationSystem';
 import { WaterSurfaceAsset } from '../assets/environment/WaterSurfaceAsset';
 // import { PlayerController } from './PlayerController'; // Will need later for player position
 
+interface DecorationRef {
+  type: 'pebble' | 'rock' | 'clam' | 'kelp';
+  index: number;
+}
+
+interface DecorationInstanceData {
+  id: number;
+  matrix: THREE.Matrix4;
+  isActive: boolean;
+}
+
 interface EnvironmentSegment {
   mesh: THREE.Group;
   seafloor: THREE.Mesh;
-  decorations: THREE.Object3D[];
+  decorations: DecorationRef[];
   isActive: boolean;
 }
 
 export class EnvironmentManager {
   private scene: THREE.Scene;
   private assetFactory: ProceduralAssetFactory;
   // private playerController: PlayerController; // To track player's Z position
 
   private segments: EnvironmentSegment[] = [];
   private segmentPoolSize = 5; // Number of segments to pool
   private segmentLength = 20; // Must match SeafloorAsset.segmentLength or get from asset
   private segmentWidth = 10;
   private lastSegmentZ = 0; // Z position of the front edge of the furthest segment
 
   private visibleSegmentsFront = 2; // How many segments to keep ahead of player
   private visibleSegmentsBehind = 1; // How many segments to keep behind player
 
   private waterSurface?: WaterSurfaceAsset;
 
-  private pebblePool: THREE.Mesh[] = [];
-  private rockPool: THREE.Mesh[] = [];
-  private clamPool: THREE.Group[] = [];
-  private kelpPool: THREE.Group[] = [];
+  private pebbleInstances!: THREE.InstancedMesh;
+  private rockInstances!: THREE.InstancedMesh;
+  private clamInstances!: THREE.InstancedMesh;
+  private kelpInstances!: THREE.InstancedMesh;
+
+  private pebbleData: DecorationInstanceData[] = [];
+  private rockData: DecorationInstanceData[] = [];
+  private clamData: DecorationInstanceData[] = [];
+  private kelpData: DecorationInstanceData[] = [];
 
   private pebblePoolSize = 50;
   private rockPoolSize = 20;
   private clamPoolSize = 10;
   private kelpPoolSize = 20;
 
+  private nextInstanceId = 0;
+
   constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory /*, playerController: PlayerController */) {
     this.scene = scene;
     this.assetFactory = assetFactory;
     // this.playerController = playerController;
 
     // Get segmentLength from the assetFactory's public getter
     this.segmentLength = assetFactory.seafloorSegmentLength;
     this.segmentWidth = assetFactory.seafloorAsset.segmentWidth;
   }
 
   public async initialize(): Promise<void> {
     await this.initializeSegments();
     this.initializeDecorationPools();
     this.initializeWaterSurface();
     console.log("EnvironmentManager: Initialized.");
   }
 
   private async initializeSegments(): Promise<void> {
     for (let i = 0; i < this.segmentPoolSize; i++) {
       const floor = await this.assetFactory.createSeafloorSegmentMesh();
       const group = new THREE.Group();
       group.add(floor);
       group.visible = false; // Initially hide
       this.scene.add(group);
       this.segments.push({ mesh: group, seafloor: floor, decorations: [], isActive: false });
     }
     // Position initial segments
     for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
         this.spawnSegmentAhead(true); // true to force spawn at specific positions
     }
   }
 
   private initializeDecorationPools(): void {
-    // Initialize pebbles
+    // Helper to convert complex groups to a single geometry with material array
+    const mergeGroup = (group: THREE.Group): { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] } => {
+      const geometries: THREE.BufferGeometry[] = [];
+      const materials: THREE.Material[] = [];
+      group.updateMatrixWorld(true);
+      group.traverse(child => {
+        if (child instanceof THREE.Mesh) {
+          const geom = child.geometry.clone();
+          geom.applyMatrix4(child.matrix);
+          geometries.push(geom);
+          materials.push(child.material as THREE.Material);
+        }
+      });
+      const geometry = mergeGeometries(geometries, true) as THREE.BufferGeometry;
+      return { geometry, material: materials };
+    };
+
+    // Pebbles
+    const pebbleMesh = this.assetFactory.getPebbleMesh();
+    const pebbleGeom = pebbleMesh.geometry.clone();
+    const pebbleMat = (pebbleMesh.material as THREE.Material).clone();
+    this.pebbleInstances = new THREE.InstancedMesh(pebbleGeom, pebbleMat, this.pebblePoolSize);
+    this.pebbleInstances.frustumCulled = false;
+    this.scene.add(this.pebbleInstances);
     for (let i = 0; i < this.pebblePoolSize; i++) {
-      const pebble = this.assetFactory.getPebbleMesh();
-      pebble.visible = false;
-      pebble.userData.decorationType = 'pebble';
-      this.scene.add(pebble);
-      this.pebblePool.push(pebble);
+      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0);
+      this.pebbleInstances.setMatrixAt(i, matrix);
+      this.pebbleData.push({ id: this.nextInstanceId++, matrix, isActive: false });
     }
-
-    // Initialize rocks
+    this.pebbleInstances.instanceMatrix.needsUpdate = true;
+
+    // Rocks
+    const rockMesh = this.assetFactory.getSmallRockMesh();
+    const rockGeom = rockMesh.geometry.clone();
+    const rockMat = (rockMesh.material as THREE.Material).clone();
+    this.rockInstances = new THREE.InstancedMesh(rockGeom, rockMat, this.rockPoolSize);
+    this.rockInstances.frustumCulled = false;
+    this.scene.add(this.rockInstances);
     for (let i = 0; i < this.rockPoolSize; i++) {
-      const rock = this.assetFactory.getSmallRockMesh();
-      rock.visible = false;
-      rock.userData.decorationType = 'rock';
-      this.scene.add(rock);
-      this.rockPool.push(rock);
+      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0);
+      this.rockInstances.setMatrixAt(i, matrix);
+      this.rockData.push({ id: this.nextInstanceId++, matrix, isActive: false });
     }
-
-    // Initialize clams
+    this.rockInstances.instanceMatrix.needsUpdate = true;
+
+    // Clams
+    const clamGroup = this.assetFactory.getClamDecorMesh();
+    const clamMerged = mergeGroup(clamGroup);
+    this.clamInstances = new THREE.InstancedMesh(clamMerged.geometry, clamMerged.material, this.clamPoolSize);
+    this.clamInstances.frustumCulled = false;
+    this.scene.add(this.clamInstances);
     for (let i = 0; i < this.clamPoolSize; i++) {
-      const clam = this.assetFactory.getClamDecorMesh();
-      clam.visible = false;
-      clam.userData.decorationType = 'clam';
-      this.scene.add(clam);
-      this.clamPool.push(clam);
+      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0);
+      this.clamInstances.setMatrixAt(i, matrix);
+      this.clamData.push({ id: this.nextInstanceId++, matrix, isActive: false });
     }
-
-    // Initialize kelp decorations
+    this.clamInstances.instanceMatrix.needsUpdate = true;
+
+    // Kelp
+    const kelpGroup = this.assetFactory.getKelpMesh();
+    const kelpMerged = mergeGroup(kelpGroup);
+    this.kelpInstances = new THREE.InstancedMesh(kelpMerged.geometry, kelpMerged.material, this.kelpPoolSize);
+    this.kelpInstances.frustumCulled = false;
+    this.scene.add(this.kelpInstances);
     for (let i = 0; i < this.kelpPoolSize; i++) {
-      const kelp = this.assetFactory.getKelpMesh();
-      kelp.visible = false;
-      kelp.userData.decorationType = 'kelp';
-      this.scene.add(kelp);
-      this.kelpPool.push(kelp);
+      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0);
+      this.kelpInstances.setMatrixAt(i, matrix);
+      this.kelpData.push({ id: this.nextInstanceId++, matrix, isActive: false });
     }
+    this.kelpInstances.instanceMatrix.needsUpdate = true;
   }
 
   private initializeWaterSurface(): void {
     this.waterSurface = this.assetFactory.getWaterSurfaceAsset();
     const mesh = this.waterSurface.getMesh();
     mesh.position.y = 10;
     this.scene.add(mesh);
   }
 
   /** Disposes a material and any textures referenced on it */
   private disposeMaterial(material: THREE.Material): void {
     const mat = material as any;
     for (const key of Object.keys(mat)) {
       const value = mat[key];
       if (value instanceof THREE.Texture) {
         value.dispose();
       }
     }
     material.dispose();
   }
 
   /** Fully dispose of a mesh or group and remove it from the scene */
   private disposeObject(object: THREE.Object3D): void {
     object.traverse(child => {
       if (child instanceof THREE.Mesh) {
         child.geometry?.dispose();
         const material = child.material as THREE.Material | THREE.Material[];
         if (Array.isArray(material)) {
           material.forEach(m => this.disposeMaterial(m));
         } else if (material) {
           this.disposeMaterial(material);
         }
       }
     });
     this.scene.remove(object);
   }
 
   /**
-   * Dispose all decoration objects currently stored in pools and empty them
-   */
+  * Dispose all decoration objects currently stored in pools and empty them
+  */
   private clearDecorationPools(): void {
-    this.pebblePool.forEach(p => this.disposeObject(p));
-    this.rockPool.forEach(r => this.disposeObject(r));
-    this.clamPool.forEach(c => this.disposeObject(c));
-    this.kelpPool.forEach(k => this.disposeObject(k));
-
-    this.pebblePool = [];
-    this.rockPool = [];
-    this.clamPool = [];
-    this.kelpPool = [];
+    if (this.pebbleInstances) {
+      this.pebbleInstances.geometry.dispose();
+      const mat = this.pebbleInstances.material as THREE.Material | THREE.Material[];
+      if (Array.isArray(mat)) mat.forEach(m => m.dispose()); else mat.dispose();
+      this.scene.remove(this.pebbleInstances);
+    }
+    if (this.rockInstances) {
+      this.rockInstances.geometry.dispose();
+      const mat = this.rockInstances.material as THREE.Material | THREE.Material[];
+      if (Array.isArray(mat)) mat.forEach(m => m.dispose()); else mat.dispose();
+      this.scene.remove(this.rockInstances);
+    }
+    if (this.clamInstances) {
+      this.clamInstances.geometry.dispose();
+      const mat = this.clamInstances.material as THREE.Material | THREE.Material[];
+      if (Array.isArray(mat)) mat.forEach(m => m.dispose()); else mat.dispose();
+      this.scene.remove(this.clamInstances);
+    }
+    if (this.kelpInstances) {
+      this.kelpInstances.geometry.dispose();
+      const mat = this.kelpInstances.material as THREE.Material | THREE.Material[];
+      if (Array.isArray(mat)) mat.forEach(m => m.dispose()); else mat.dispose();
+      this.scene.remove(this.kelpInstances);
+    }
+
+    this.pebbleData = [];
+    this.rockData = [];
+    this.clamData = [];
+    this.kelpData = [];
   }
   
   // Helper to get an inactive segment from the pool
   private getInactiveSegment(): EnvironmentSegment | undefined {
     return this.segments.find(seg => !seg.isActive);
   }
 
+  private getInactiveInstance(dataArray: DecorationInstanceData[]): [DecorationInstanceData | undefined, number] {
+    for (let i = 0; i < dataArray.length; i++) {
+      if (!dataArray[i].isActive) return [dataArray[i], i];
+    }
+    return [undefined, -1];
+  }
+
+  private getDataAndMesh(type: DecorationRef['type']): [DecorationInstanceData[], THREE.InstancedMesh] {
+    switch (type) {
+      case 'pebble':
+        return [this.pebbleData, this.pebbleInstances];
+      case 'rock':
+        return [this.rockData, this.rockInstances];
+      case 'clam':
+        return [this.clamData, this.clamInstances];
+      case 'kelp':
+      default:
+        return [this.kelpData, this.kelpInstances];
+    }
+  }
+
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
 
       segment.decorations = [];
       this.spawnDecorations(segment);
       
       console.log(`EnvironmentManager: Spawned segment at Z: ${segment.mesh.position.z}`);
     } else {
       console.warn("EnvironmentManager: No inactive segments available to spawn!");
     }
   }
 
   private spawnDecorations(segment: EnvironmentSegment): void {
     const decoConfig = configSystem.getSeafloorConfig().decorations;
 
     if (!decoConfig) {
       return;
     }
 
-    // Spawn pebbles
-    const pebbleSettings = decoConfig.pebbles;
-    const pebbleCount = pebbleSettings.spawnCount;
-    for (let i = 0; i < pebbleCount && this.pebblePool.length > 0; i++) {
-      const pebble = this.pebblePool.pop()!;
-      const scale = THREE.MathUtils.randFloat(pebbleSettings.scaleMin, pebbleSettings.scaleMax);
-      pebble.scale.setScalar(scale);
-      this.placeDecoration(pebble, segment);
-      segment.decorations.push(pebble);
-    }
-
-    // Spawn rocks
-    const rockSettings = decoConfig.smallRocks;
-    const rockCount = rockSettings.spawnCount;
-    for (let i = 0; i < rockCount && this.rockPool.length > 0; i++) {
-      const rock = this.rockPool.pop()!;
-      const scale = THREE.MathUtils.randFloat(rockSettings.scaleMin, rockSettings.scaleMax);
-      rock.scale.setScalar(scale);
-      this.placeDecoration(rock, segment);
-      segment.decorations.push(rock);
-    }
-
-    // Spawn clams
-    const clamSettings = decoConfig.clams;
-    const clamCount = clamSettings.spawnCount;
-    for (let i = 0; i < clamCount && this.clamPool.length > 0; i++) {
-      const clam = this.clamPool.pop()!;
-      const scale = THREE.MathUtils.randFloat(clamSettings.scaleMin, clamSettings.scaleMax);
-      clam.scale.setScalar(scale);
-      this.placeDecoration(clam, segment);
-      segment.decorations.push(clam);
-    }
+    const place = (settings: { scaleMin: number; scaleMax: number; spawnCount: number },
+                   dataArray: DecorationInstanceData[],
+                   mesh: THREE.InstancedMesh,
+                   type: DecorationRef['type']) => {
+      for (let i = 0; i < settings.spawnCount; i++) {
+        const [inst, index] = this.getInactiveInstance(dataArray);
+        if (!inst) break;
+        inst.isActive = true;
+
+        const scaleVal = THREE.MathUtils.randFloat(settings.scaleMin, settings.scaleMax);
+        const pos = new THREE.Vector3(
+          THREE.MathUtils.randFloatSpread(this.segmentWidth * 0.8),
+          segment.mesh.position.y,
+          segment.mesh.position.z + THREE.MathUtils.randFloatSpread(this.segmentLength)
+        );
+        const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.random() * Math.PI * 2, 0));
+        const scale = new THREE.Vector3(scaleVal, scaleVal, scaleVal);
+        inst.matrix.compose(pos, quat, scale);
+        mesh.setMatrixAt(index, inst.matrix);
+        segment.decorations.push({ type, index });
+      }
+      mesh.instanceMatrix.needsUpdate = true;
+    };
 
-    // Spawn kelp
-    const kelpSettings = decoConfig.kelp;
-    const kelpCount = kelpSettings.spawnCount;
-    for (let i = 0; i < kelpCount && this.kelpPool.length > 0; i++) {
-      const kelp = this.kelpPool.pop()!;
-      const scale = THREE.MathUtils.randFloat(kelpSettings.scaleMin, kelpSettings.scaleMax);
-      kelp.scale.setScalar(scale);
-      this.placeDecoration(kelp, segment);
-      segment.decorations.push(kelp);
-    }
+    place(decoConfig.pebbles, this.pebbleData, this.pebbleInstances, 'pebble');
+    place(decoConfig.smallRocks, this.rockData, this.rockInstances, 'rock');
+    place(decoConfig.clams, this.clamData, this.clamInstances, 'clam');
+    place(decoConfig.kelp, this.kelpData, this.kelpInstances, 'kelp');
   }
 
-  private placeDecoration(obj: THREE.Object3D, segment: EnvironmentSegment): void {
-    obj.position.x = THREE.MathUtils.randFloatSpread(this.segmentWidth * 0.8);
-    obj.position.y = segment.mesh.position.y;
-    obj.position.z = segment.mesh.position.z + THREE.MathUtils.randFloatSpread(this.segmentLength);
-    obj.rotation.y = Math.random() * Math.PI * 2;
-    obj.visible = true;
-  }
+
 
   // Recycles segments that are too far behind the player
   private recycleSegments(playerZ: number): void {
     const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 2)); // Increased buffer
 
     this.segments.forEach(segment => {
       if (segment.isActive) {
-        // A segment's far edge (farthest from the player when behind)
-        // is its position.z + segmentLength/2
         const segmentFarEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
         if (segmentFarEdgeZ > recycleThreshold) {
           segment.isActive = false;
           segment.mesh.visible = false;
 
-          // Return decorations to pools
-          segment.decorations.forEach(obj => {
-            obj.visible = false;
-            switch (obj.userData.decorationType) {
-              case 'pebble':
-                this.pebblePool.push(obj as THREE.Mesh);
-                break;
-              case 'rock':
-                this.rockPool.push(obj as THREE.Mesh);
-                break;
-              case 'clam':
-                this.clamPool.push(obj as THREE.Group);
-                break;
-              case 'kelp':
-                this.kelpPool.push(obj as THREE.Group);
-                break;
-            }
+          const updateNeeded: Record<DecorationRef['type'], boolean> = { pebble: false, rock: false, clam: false, kelp: false };
+
+          segment.decorations.forEach(ref => {
+            const [dataArray, mesh] = this.getDataAndMesh(ref.type);
+            const inst = dataArray[ref.index];
+            inst.isActive = false;
+            inst.matrix.setPosition(0, -1000, 0);
+            mesh.setMatrixAt(ref.index, inst.matrix);
+            updateNeeded[ref.type] = true;
           });
+
+          if (updateNeeded.pebble) this.pebbleInstances.instanceMatrix.needsUpdate = true;
+          if (updateNeeded.rock) this.rockInstances.instanceMatrix.needsUpdate = true;
+          if (updateNeeded.clam) this.clamInstances.instanceMatrix.needsUpdate = true;
+          if (updateNeeded.kelp) this.kelpInstances.instanceMatrix.needsUpdate = true;
+
           segment.decorations = [];
           console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
         }
       }
     });
   }
 
 
   public async update(deltaTime: number, playerZ: number, elapsedTime: number): Promise<void> {
     // Check if we need to spawn new segments ahead
     // If the player is approaching the "end" of the visible segments
     const spawnTriggerZ = this.lastSegmentZ + (this.segmentLength * this.visibleSegmentsFront) - (this.segmentLength * 0.5) ;
     if (playerZ < spawnTriggerZ) {
       this.spawnSegmentAhead();
     }
 
     // Check if we need to recycle segments behind
     this.recycleSegments(playerZ);
 
     // Update water surface
     this.waterSurface?.update(deltaTime, elapsedTime);
   }
 
   public dispose(): void {
     this.segments.forEach(segment => {
       this.disposeObject(segment.seafloor);
       this.scene.remove(segment.mesh);
-      segment.decorations.forEach(obj => this.disposeObject(obj));
     });
     this.segments = [];
 
     this.waterSurface?.dispose();
 
     // Dispose decoration pools
     this.clearDecorationPools();
 
     console.log("EnvironmentManager: Disposed.");
   }
 
   public async reset(initialPlayerZ: number = 0): Promise<void> {
     // Remove and dispose any active decorations
     this.segments.forEach(segment => {
       segment.isActive = false;
       segment.mesh.visible = false;
-
-      segment.decorations.forEach(obj => {
-        this.disposeObject(obj);
+      segment.decorations.forEach(ref => {
+        const [dataArray, mesh] = this.getDataAndMesh(ref.type);
+        const inst = dataArray[ref.index];
+        inst.isActive = false;
+        inst.matrix.setPosition(0, -1000, 0);
+        mesh.setMatrixAt(ref.index, inst.matrix);
       });
       segment.decorations = [];
     });
 
+    this.pebbleInstances.instanceMatrix.needsUpdate = true;
+    this.rockInstances.instanceMatrix.needsUpdate = true;
+    this.clamInstances.instanceMatrix.needsUpdate = true;
+    this.kelpInstances.instanceMatrix.needsUpdate = true;
+
     // Clear existing pooled decorations and recreate them
     this.clearDecorationPools();
     this.initializeDecorationPools();
     this.lastSegmentZ = initialPlayerZ + this.segmentLength;
     for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
       this.spawnSegmentAhead(true);
     }
     if (this.waterSurface) {
       this.waterSurface.getMesh().position.z = initialPlayerZ - 20;
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
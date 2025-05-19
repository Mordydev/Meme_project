1) Updated the fragment shader code in WaterSurfaceAsset.ts to reference vNormal instead of normal, ensuring the water surface shader compiles correctly

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts b/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
index 6fa0b30..bdbe5e1 100644
--- a/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
@@ -55,51 +55,51 @@ export class WaterSurfaceAsset {
       shader.uniforms.uLightDirection = { value: new THREE.Vector3(0, -1, 0) };
       shader.uniforms.uLightIntensity = { value: 1.0 };
 
       // Make sure vUv is available - add it to the vertex shader
       shader.vertexShader = 
         `varying vec2 vUv;\n` +
         shader.vertexShader.replace(
           '#include <uv_vertex>',
           '#include <uv_vertex>\nvUv = uv;'
         );
 
       shader.fragmentShader =
         `uniform float uTime;\n` +
         `uniform float uRippleSpeed;\n` +
         `uniform float uRippleScale;\n` +
         `uniform float uRippleIntensity;\n` +
         `uniform float uFresnelPower;\n` +
         `uniform vec3 uSpecularColor;\n` +
         `uniform vec3 uLightDirection;\n` +
         `uniform float uLightIntensity;\n` +
         `varying vec2 vUv;\n` +
         shader.fragmentShader;
 
       shader.fragmentShader = shader.fragmentShader.replace(
         '#include <color_fragment>',
-        `#include <color_fragment>\n  float ripple = sin((vUv.x + uTime * uRippleSpeed) * uRippleScale) *\n                      sin((vUv.y + uTime * uRippleSpeed) * uRippleScale);\n  vec3 lightDir = normalize(uLightDirection);\n  float lightFactor = max(dot(normalize(normal), lightDir), 0.0) * uLightIntensity;\n  float fresnel = pow(1.0 - dot(normalize(normal), normalize(vViewPosition)), uFresnelPower);\n  vec3 fresnelSpec = uSpecularColor * fresnel * lightFactor;\n  diffuseColor.rgb += ripple * uRippleIntensity * lightFactor + fresnelSpec;`
+        `#include <color_fragment>\n  float ripple = sin((vUv.x + uTime * uRippleSpeed) * uRippleScale) *\n                      sin((vUv.y + uTime * uRippleSpeed) * uRippleScale);\n  vec3 lightDir = normalize(uLightDirection);\n  float lightFactor = max(dot(normalize(vNormal), lightDir), 0.0) * uLightIntensity;\n  float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(vViewPosition)), uFresnelPower);\n  vec3 fresnelSpec = uSpecularColor * fresnel * lightFactor;\n  diffuseColor.rgb += ripple * uRippleIntensity * lightFactor + fresnelSpec;`
       );
 
       (this.material as any).userData.shader = shader;
     };
 
     this.mesh = new THREE.Mesh(geometry, this.material);
     this.mesh.rotation.x = -Math.PI / 2;
     this.mesh.name = 'WaterSurface';
   }
 
   public update(_delta: number, elapsed: number): void {
     const shader = (this.material as any).userData?.shader;
     if (!shader) return;
 
     if (shader.uniforms.uTime) {
       shader.uniforms.uTime.value = elapsed;
     }
 
     if (this.directionalLight) {
       this.directionalLight.getWorldDirection(this._tmpLightDir);
       shader.uniforms.uLightDirection.value.copy(this._tmpLightDir);
       shader.uniforms.uLightIntensity.value = this.directionalLight.intensity;
     }
   }
 
 
EOF
)

2) Added pebble options to SeafloorVisualConfig and provided defaults in _fetchConfig() for texture generation

Drew randomized pebbles in the sand texture and bump map, respecting wrapping by duplicating across edges

Updated the game configuration to include pebble defaults for the seafloor visuals

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index 78a05b9..55acb06 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -91,82 +91,88 @@ class SimplexNoise {
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
   bumpScale?: number;
   roughness?: number;
   metalness?: number;
+  pebbleColors?: Array<number | string>;
+  pebbleDensity?: number;
+  pebbleSizeRange?: [number, number];
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
       bumpScale: 0.04,
       roughness: 0.85,
-      metalness: 0.0
+      metalness: 0.0,
+      pebbleColors: [0x8e7b65, 0x9c8b76, 0x7b6a55],
+      pebbleDensity: 40,
+      pebbleSizeRange: [1, 3]
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
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index 78a05b9..55acb06 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -182,50 +188,86 @@ export class SeafloorAsset {
         const sy = y / size;
         const ix0 = THREE.MathUtils.lerp(n00, n10, sx);
         const ix1 = THREE.MathUtils.lerp(n01, n11, sx);
         const n = THREE.MathUtils.lerp(ix0, ix1, sy);
 
         value += n * amplitude;
         frequency *= 2;
         amplitude *= 0.5;
       }
       return value;
     };
 
     for (let y = 0; y < size; y++) {
       for (let x = 0; x < size; x++) {
         const n = fbm(x, y) * 0.5 + 0.5; // Map to 0-1
         // Slight brightness gradient - darker for lower noise values
         const brightness = THREE.MathUtils.lerp(0.85, 1.0, n);
         const patternColor = color1.clone().lerp(color2, n);
         const finalColor = baseColor.clone().lerp(patternColor, 0.5);
         finalColor.multiplyScalar(brightness);
         ctx.fillStyle = `#${finalColor.getHexString()}`;
         ctx.fillRect(x, y, 1, 1);
       }
     }
 
+    const pebbleColors = (this.config.pebbleColors || []).map(
+      (c) => new THREE.Color(c)
+    );
+    const pebbleCount = this.config.pebbleDensity ?? 0;
+    const [minPebble, maxPebble] = this.config.pebbleSizeRange || [1, 3];
+
+    const drawPebble = (
+      cx: number,
+      cy: number,
+      rx: number,
+      ry: number,
+      color: THREE.Color
+    ): void => {
+      ctx.fillStyle = `#${color.getHexString()}`;
+      ctx.beginPath();
+      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
+      ctx.fill();
+    };
+
+    for (let i = 0; i < pebbleCount; i++) {
+      const radius = THREE.MathUtils.randFloat(minPebble, maxPebble);
+      const aspect = THREE.MathUtils.randFloat(0.7, 1.3);
+      const rx = radius;
+      const ry = radius * aspect;
+      const x = Math.random() * size;
+      const y = Math.random() * size;
+      const color =
+        pebbleColors[Math.floor(Math.random() * pebbleColors.length)] ||
+        baseColor;
+      for (let dx = -1; dx <= 1; dx++) {
+        for (let dy = -1; dy <= 1; dy++) {
+          drawPebble(x + dx * size, y + dy * size, rx, ry, color);
+        }
+      }
+    }
+
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
     const size = 256;
     canvas.width = size;
     canvas.height = size;
     const ctx = canvas.getContext('2d')!;
 
     const simplex = new SimplexNoise();
 
     const fbm = (x: number, y: number): number => {
       let value = 0;
       let amplitude = 0.5;
       let frequency = 1;
       for (let o = 0; o < 5; o++) {
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index 78a05b9..55acb06 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -233,50 +275,80 @@ export class SeafloorAsset {
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
       return value;
     };
 
     for (let y = 0; y < size; y++) {
       for (let x = 0; x < size; x++) {
         const n = fbm(x, y) * 0.5 + 0.5; // 0-1
         const value = Math.floor(n * 255);
         ctx.fillStyle = `rgb(${value},${value},${value})`;
         ctx.fillRect(x, y, 1, 1);
       }
     }
 
+    const pebbleCount = this.config.pebbleDensity ?? 0;
+    const [minPebble, maxPebble] = this.config.pebbleSizeRange || [1, 3];
+    const drawPebble = (
+      cx: number,
+      cy: number,
+      rx: number,
+      ry: number,
+      value: number
+    ): void => {
+      ctx.fillStyle = `rgb(${value},${value},${value})`;
+      ctx.beginPath();
+      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
+      ctx.fill();
+    };
+
+    for (let i = 0; i < pebbleCount; i++) {
+      const radius = THREE.MathUtils.randFloat(minPebble, maxPebble);
+      const aspect = THREE.MathUtils.randFloat(0.7, 1.3);
+      const rx = radius;
+      const ry = radius * aspect;
+      const x = Math.random() * size;
+      const y = Math.random() * size;
+      const v = 220;
+      for (let dx = -1; dx <= 1; dx++) {
+        for (let dy = -1; dy <= 1; dy++) {
+          drawPebble(x + dx * size, y + dy * size, rx, ry, v);
+        }
+      }
+    }
+
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
 
   private createMaterial(): void {
     this.sandTexture = this.createSandTexture();
     this.sandBumpMap = this.createSandBumpMap();
 
     this.material = new THREE.MeshStandardMaterial({
       map: this.sandTexture,
       bumpMap: this.sandBumpMap,
       bumpScale: this.config.bumpScale ?? 0.04,
       color: 0xffffff,
       roughness: this.config.roughness ?? 0.8,
       metalness: this.config.metalness ?? 0.05,
       side: THREE.FrontSide
     });
 
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 49f6012..e77cbd8 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -214,50 +214,53 @@ export interface DecorationSpawnConfig {
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
   bumpScale?: number;
   roughness?: number;
   metalness?: number;
+  pebbleColors?: Array<number | string>;
+  pebbleDensity?: number;
+  pebbleSizeRange?: [number, number];
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
 
 export interface LightingConfig {
   ambientLight: { color: number; intensity: number };
   directionalLight: {
     color: number;
     intensity: number;
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 49f6012..e77cbd8 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -674,50 +677,53 @@ export const defaultConfig: GameConfig = {
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
+      pebbleColors: [0x8e7b65, 0x9c8b76, 0x7b6a55],
+      pebbleDensity: 40,
+      pebbleSizeRange: [1, 3],
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
     ambientLight: { color: 0x80d0d0, intensity: 0.6 },
     directionalLight: {
       color: 0xc8ffff,
       intensity: 0.8,
       position: { x: 1, y: 10, z: 1 },
 
EOF
)

3) Decoration counts and scales are now taken from the seafloor decorations configuration rather than hard-coded values, applying the configured ranges during spawning

Spawn counts and scale ranges are defined under visuals.seafloor in the game configuration

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index dacc8ed..9a5eae0 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -132,78 +132,96 @@ export class EnvironmentManager {
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
+    const decoConfig = configSystem.getSeafloorConfig().decorations;
+
+    if (!decoConfig) {
+      return;
+    }
+
     // Spawn pebbles
-    const pebbleCount = THREE.MathUtils.randInt(3, 6);
+    const pebbleSettings = decoConfig.pebbles;
+    const pebbleCount = pebbleSettings.spawnCount;
     for (let i = 0; i < pebbleCount && this.pebblePool.length > 0; i++) {
       const pebble = this.pebblePool.pop()!;
+      const scale = THREE.MathUtils.randFloat(pebbleSettings.scaleMin, pebbleSettings.scaleMax);
+      pebble.scale.setScalar(scale);
       this.placeDecoration(pebble, segment);
       segment.decorations.push(pebble);
     }
 
     // Spawn rocks
-    const rockCount = THREE.MathUtils.randInt(1, 3);
+    const rockSettings = decoConfig.smallRocks;
+    const rockCount = rockSettings.spawnCount;
     for (let i = 0; i < rockCount && this.rockPool.length > 0; i++) {
       const rock = this.rockPool.pop()!;
-      rock.scale.setScalar(0.3 + Math.random() * 0.3);
+      const scale = THREE.MathUtils.randFloat(rockSettings.scaleMin, rockSettings.scaleMax);
+      rock.scale.setScalar(scale);
       this.placeDecoration(rock, segment);
       segment.decorations.push(rock);
     }
 
     // Spawn clams
-    if (Math.random() < 0.3 && this.clamPool.length > 0) {
+    const clamSettings = decoConfig.clams;
+    const clamCount = clamSettings.spawnCount;
+    for (let i = 0; i < clamCount && this.clamPool.length > 0; i++) {
       const clam = this.clamPool.pop()!;
+      const scale = THREE.MathUtils.randFloat(clamSettings.scaleMin, clamSettings.scaleMax);
+      clam.scale.setScalar(scale);
       this.placeDecoration(clam, segment);
       segment.decorations.push(clam);
     }
 
     // Spawn kelp
-    const kelpCount = THREE.MathUtils.randInt(1, 2);
+    const kelpSettings = decoConfig.kelp;
+    const kelpCount = kelpSettings.spawnCount;
     for (let i = 0; i < kelpCount && this.kelpPool.length > 0; i++) {
       const kelp = this.kelpPool.pop()!;
+      const scale = THREE.MathUtils.randFloat(kelpSettings.scaleMin, kelpSettings.scaleMax);
+      kelp.scale.setScalar(scale);
       this.placeDecoration(kelp, segment);
       segment.decorations.push(kelp);
     }
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
     const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 1)); // Point beyond which segments are recycled
 
     this.segments.forEach(segment => {
       if (segment.isActive) {
         // A segment's "front" edge (closest to player when behind) is its position.z + segmentLength/2
         const segmentFrontEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
         if (segmentFrontEdgeZ > recycleThreshold) {
           segment.isActive = false;
           segment.mesh.visible = false;
 
 
EOF
)

4) Updated EnvironmentManager so segments recycle only after the player has passed them completely by increasing the buffer in recycleThreshold and using a clearer variable name for the far edge

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index dacc8ed..4f77a61 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -175,57 +175,58 @@ export class EnvironmentManager {
     if (Math.random() < 0.3 && this.clamPool.length > 0) {
       const clam = this.clamPool.pop()!;
       this.placeDecoration(clam, segment);
       segment.decorations.push(clam);
     }
 
     // Spawn kelp
     const kelpCount = THREE.MathUtils.randInt(1, 2);
     for (let i = 0; i < kelpCount && this.kelpPool.length > 0; i++) {
       const kelp = this.kelpPool.pop()!;
       this.placeDecoration(kelp, segment);
       segment.decorations.push(kelp);
     }
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
-    const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 1)); // Point beyond which segments are recycled
+    const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 2)); // Increased buffer
 
     this.segments.forEach(segment => {
       if (segment.isActive) {
-        // A segment's "front" edge (closest to player when behind) is its position.z + segmentLength/2
-        const segmentFrontEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
-        if (segmentFrontEdgeZ > recycleThreshold) {
+        // A segment's far edge (farthest from the player when behind)
+        // is its position.z + segmentLength/2
+        const segmentFarEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
+        if (segmentFarEdgeZ > recycleThreshold) {
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
           console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
         }
       }
 
EOF
)

5) Added a recycleDistance property to the obstacle configuration for controlling how far behind the player obstacles are recycled

Set the default recycle distance to 15 units in the game configuration file

Stored the configured recycle distance in ObstacleManager and replaced the hard-coded value with the new configuration value

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 49f6012..ca933c8 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -176,50 +176,52 @@ export interface KelpWallObstacleConfig {
   strandCountMin: number;     // Min number of kelp strands in a "wall" segment
   strandCountMax: number;     // Max number of kelp strands
   segmentWidthCoverage: number; // How much of a lane or multiple lanes it covers (e.g., 1.0 for one lane, 2.0 for two)
   swayAmplitude: number;      // How much the kelp sways
   swaySpeed: number;          // Speed of the swaying animation
   /** Optional radius for stalk geometry. */
   stalkRadius?: number;
   /** Optional number of fronds per stalk. */
   frondCount?: number;
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
+  /** Distance behind the player where obstacles are recycled */
+  recycleDistance: number;
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
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 49f6012..ca933c8 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -429,50 +431,51 @@ export const defaultConfig: GameConfig = {
   },
   powerUps: {
     shield: { duration: 10, visual: { color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5, opacity: 0.5 } },
     magnet: { duration: 15, attractionRadius: 5, attractionSpeed: 15 },
     doublescore: { duration: 20 },
     spawnIntervalMin: 15, // Min seconds between power-up spawns
     spawnIntervalMax: 30, // Max seconds
   },
   difficulty: {
     tiers: [
       { distanceThreshold: 0, playerSpeedMultiplier: 1.0, obstacleSpawnRateMultiplier: 1.0, obstacleComplexityFactor: 0.2 },
       { distanceThreshold: 100, playerSpeedMultiplier: 1.5, obstacleSpawnRateMultiplier: 1.3, obstacleComplexityFactor: 0.5 },
       { distanceThreshold: 400, playerSpeedMultiplier: 2.0, obstacleSpawnRateMultiplier: 1.6, obstacleComplexityFactor: 0.8 },
       { distanceThreshold: 800, playerSpeedMultiplier: 2.6, obstacleSpawnRateMultiplier: 1.9, obstacleComplexityFactor: 1.0 },
       { distanceThreshold: 1250, playerSpeedMultiplier: 3.2, obstacleSpawnRateMultiplier: 2.2, obstacleComplexityFactor: 1.0 },
       { distanceThreshold: 2000, playerSpeedMultiplier: 3.8, obstacleSpawnRateMultiplier: 2.5, obstacleComplexityFactor: 1.0 },
       { distanceThreshold: 3000, playerSpeedMultiplier: 4.4, obstacleSpawnRateMultiplier: 2.8, obstacleComplexityFactor: 1.0 },
       { distanceThreshold: 4000, playerSpeedMultiplier: 5.0, obstacleSpawnRateMultiplier: 3.2, obstacleComplexityFactor: 1.0 },
     ],
     basePlayerSpeed: 8, // Initial speed for tier 0, units per second
     baseObstacleSpawnIntervalMin: 2.5,
     baseObstacleSpawnIntervalMax: 4.5,
     transitionSpeed: 0.1, // Smoothness factor for tier transitions
   },
   obstacles: {
+    recycleDistance: 15,
     rock: {
       baseScale: 1,
       visuals: {
         mainColor: 0x888888, // Medium grey
         detailColor: 0x666666, // Darker grey for crevices/details
         roughness: 0.8,
         metalness: 0.1,
       },
     },
     coral: {
       baseScale: 0.9,
       branchCount: 5,
       branchLengthMin: 0.5,
       branchLengthMax: 1.0,
       visuals: {
         mainColor: 0xff7f50, // Coral color
         detailColor: 0xff6347, // Slightly darker coral
         roughness: 0.6,
         metalness: 0.0,
         emissiveColor: 0xff7f50,
         emissiveIntensity: 0.1,
       },
     },
     clam: {
       baseScale: 0.8,
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/ObstacleManager.ts b/nemo-runner/src/lib/game/managers/ObstacleManager.ts
index 86e4280..487e0d3 100644
--- a/nemo-runner/src/lib/game/managers/ObstacleManager.ts
+++ b/nemo-runner/src/lib/game/managers/ObstacleManager.ts
@@ -46,50 +46,51 @@ export class ObstacleManager {
   private assetFactory: ProceduralAssetFactory;
   // private environmentManager: EnvironmentManager;
   private gameEngine?: any; // Reference to GameEngine for player position
   private playerController?: PlayerController; // Reference to PlayerController for proximity effects
 
   public activeObstacles: Obstacle[] = []; // Public for collision detection access
   public obstaclePool: Obstacle[] = [];
   private poolSize = 30; // Increased to accommodate more complex obstacle patterns
 
   // Store references to obstacle configs for performance
   private sharkConfig = configSystem.getObstaclesConfig().shark;
   private seaTurtleConfig = configSystem.getObstaclesConfig().seaTurtle;
   private kelpWallConfig = configSystem.getObstaclesConfig().kelpWall;
   private schoolOfFishConfig = configSystem.getObstaclesConfig().schoolOfFish;
 
   // Spawn intervals (now controlled by difficulty system)
   private spawnIntervalMin: number;
   private spawnIntervalMax: number;
   private timeToNextSpawn = 0;
 
   // Complexity factor affects obstacle types and patterns (0-1 range)
   private complexityFactor: number = 0.2;
 
   private lastSpawnZ = 0; // Keep track of Z to avoid too close spawns
   private minZSpacing = 10; // Minimum Z distance between obstacles
+  private recycleDistance = configSystem.getObstaclesConfig().recycleDistance;
 
   // Track pattern sequences for more interesting gameplay
   private patternSequence: PatternType[] = [];
   private currentPatternIndex: number = 0;
 
   constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory, gameEngine?: any /*, environmentManager: EnvironmentManager */) {
     this.scene = scene;
     this.assetFactory = assetFactory;
     this.gameEngine = gameEngine;
     // this.environmentManager = environmentManager;
 
     // Initialize with base spawn intervals from config
     const baseIntervals = configSystem.getObstacleBaseSpawnIntervals();
     this.spawnIntervalMin = baseIntervals.min;
     this.spawnIntervalMax = baseIntervals.max;
 
     this.initializePool();
     this.resetTimeToNextSpawn();
     // Spawn initial set of obstacles immediately
     // Assuming player starts near Z=0, or manager handles initial placement appropriately.
     this.spawnObstaclePattern(0); 
     // console.log("ObstacleManager: Initialized with new obstacle types and initial spawn triggered.");
   }
 
   /**
diff --git a/nemo-runner/src/lib/game/managers/ObstacleManager.ts b/nemo-runner/src/lib/game/managers/ObstacleManager.ts
index 86e4280..487e0d3 100644
--- a/nemo-runner/src/lib/game/managers/ObstacleManager.ts
+++ b/nemo-runner/src/lib/game/managers/ObstacleManager.ts
@@ -790,51 +791,51 @@ export class ObstacleManager {
 
         // Store danger state in userData (kelp is always dangerous)
         if (obstacle.mesh.userData) {
           obstacle.mesh.userData.isDangerous = true;
         }
       }
       // Handle school of fish animations and movement
       else if (obstacle.type === 'schoolOfFish' && obstacle.assetInstance instanceof SchoolOfFishAsset) {
         const schoolAsset = obstacle.assetInstance;
         schoolAsset.updateAnimation(deltaTime);
 
         // Handle school's forward movement (slower than environment scroll)
         const playerBaseSpeed = configSystem.getDifficultyConfig().basePlayerSpeed;
         const schoolActualForwardSpeed = playerBaseSpeed * (obstacle.schoolForwardSpeed ?? this.schoolOfFishConfig.baseSpeedFactor);
         const worldScrollSpeed = this.playerController?.mesh.userData.currentActualSpeed || playerBaseSpeed;
         obstacle.mesh.position.z += (worldScrollSpeed - schoolActualForwardSpeed) * deltaTime;
 
         // Store danger state in userData (school of fish is always dangerous)
         if (obstacle.mesh.userData) {
           obstacle.mesh.userData.isDangerous = true;
         }
       }
     }
 
     // Recycle obstacles that are far behind the player
-    const recycleThreshold = playerZ + 10; // Recycle if 10 units behind player
+    const recycleThreshold = playerZ + this.recycleDistance; // Recycle when this distance behind player
 
     // Use a reverse loop since we're modifying the array while iterating
     for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
       const obstacle = this.activeObstacles[i];
       if (obstacle.mesh.position.z > recycleThreshold) {
         // Reset the asset to its initial state
         if (obstacle.assetInstance && typeof obstacle.assetInstance.reset === 'function') {
           try {
             obstacle.assetInstance.reset();
           } catch (error) {
             // console.warn(`ObstacleManager: Error resetting ${obstacle.type} asset:`, error);
           }
         }
 
         obstacle.isActive = false;
         obstacle.mesh.visible = false;
 
         // Remove from activeObstacles array
         this.activeObstacles.splice(i, 1);
 
         // console.log(`ObstacleManager: Recycled ${obstacle.type} obstacle at z:${obstacle.mesh.position.z.toFixed(1)}`);
       }
     }
   }
 
 
EOF
)

6) Updated lighting configuration with cooler blues and adjusted intensities for a richer underwater atmosphere

Added a method in LightingManager to refresh caustic shader uniforms when the config changes, ensuring new settings are applied at runtime

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 49f6012..377df8b 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -694,51 +694,51 @@ export const defaultConfig: GameConfig = {
       sandPatternColor2: 0x9A7B5A,
       textureScale: 15.0,
       bumpScale: 0.04,
       roughness: 0.85,
       metalness: 0.0,
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
-    ambientLight: { color: 0x80d0d0, intensity: 0.6 },
+    ambientLight: { color: 0x6699aa, intensity: 0.55 },
     directionalLight: {
-      color: 0xc8ffff,
-      intensity: 0.8,
+      color: 0xb3ecff,
+      intensity: 0.85,
       position: { x: 1, y: 10, z: 1 },
       castShadow: false
     },
-    fogColor: 0x0d5660,
-    fogNear: 10,
-    fogFar: 60,
+    fogColor: 0x083848,
+    fogNear: 8,
+    fogFar: 70,
     enableCaustics: true,
-    causticColor: 0xA0D0FF,
-    causticIntensity: 0.15,
-    causticScale: 6.0,
-    causticSpeed: 0.08,
+    causticColor: 0x9cdfff,
+    causticIntensity: 0.12,
+    causticScale: 7.0,
+    causticSpeed: 0.1,
     causticBlendMode: 'additive',
     enableGodRays: true,
-    godRayColor: 0xA0D0FF,
-    godRayIntensity: 0.08,
-    godRayDensity: 0.96,
-    godRayWeight: 0.05,
-    godRayDecay: 0.96,
-    godRayExposure: 0.1,
-    godRaySamples: 20
+    godRayColor: 0x9cdfff,
+    godRayIntensity: 0.1,
+    godRayDensity: 0.97,
+    godRayWeight: 0.07,
+    godRayDecay: 0.94,
+    godRayExposure: 0.12,
+    godRaySamples: 30
   },
 };
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/services/LightingManager.ts b/nemo-runner/src/lib/game/services/LightingManager.ts
index 12c1eca..d8700c1 100644
--- a/nemo-runner/src/lib/game/services/LightingManager.ts
+++ b/nemo-runner/src/lib/game/services/LightingManager.ts
@@ -212,54 +212,74 @@ export class LightingManager {
   
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
   
   /**
    * Updates the lighting and caustic effects
    * @param deltaTime Time since last frame in seconds
    * @param elapsedTime Total game time in seconds
    */
   public update(deltaTime: number, elapsedTime: number): void {
     this.elapsedTime = elapsedTime;
-    
+
     // We're no longer updating complex caustic targets since we're using simpler materials
     // This helps prevent the WebGL context loss issues
   }
+
+  /**
+   * Update caustic uniforms on tracked meshes
+   */
+  private updateCausticUniforms(lighting: ReturnType<typeof configSystem.getLightingConfig>): void {
+    for (const mesh of this.causticTargets) {
+      const mat: any = mesh.material;
+      const uniforms = mat?.uniforms;
+      if (!uniforms) continue;
+      if (uniforms.uCausticColor) {
+        uniforms.uCausticColor.value.set(lighting.causticColor);
+      }
+      if (uniforms.uCausticIntensity) {
+        uniforms.uCausticIntensity.value = lighting.causticIntensity;
+      }
+      if (uniforms.uCausticScale) {
+        uniforms.uCausticScale.value = lighting.causticScale;
+      }
+    }
+  }
   
   /**
    * Returns GLSL code for caustic pattern generation
    */
   public getCausticGLSLChunk(): string {
     return `
       ${NoiseGLSL.random2D}
       ${NoiseGLSL.noise2D}
       ${(CausticsGLSL as any).causticPattern}
     `;
   }
 
   /**
    * Accessor for the main directional light
    */
   public getDirectionalLight(): THREE.DirectionalLight {
     return this.directionalLight;
   }
 
   /**
    * Updates the lighting configuration based on current game settings
    */
   public updateConfig(): void {
     const lighting = configSystem.getLightingConfig();
     
diff --git a/nemo-runner/src/lib/game/services/LightingManager.ts b/nemo-runner/src/lib/game/services/LightingManager.ts
index 12c1eca..d8700c1 100644
--- a/nemo-runner/src/lib/game/services/LightingManager.ts
+++ b/nemo-runner/src/lib/game/services/LightingManager.ts
@@ -271,41 +291,44 @@ export class LightingManager {
     this.directionalLight.color.set(lighting.directionalLight.color);
     this.directionalLight.intensity = lighting.directionalLight.intensity;
     this.directionalLight.position.set(
       lighting.directionalLight.position.x,
       lighting.directionalLight.position.y,
       lighting.directionalLight.position.z
     );
     this.directionalLight.castShadow = lighting.directionalLight.castShadow ?? false;
     
     // Update fog
     if (this.scene.fog) {
       if (lighting.fogDensity !== undefined) {
         const fogExp = new THREE.FogExp2(lighting.fogColor, lighting.fogDensity);
         this.scene.fog = fogExp;
       } else {
         const fogNear = lighting.fogNear ?? 20;
         const fogFar = lighting.fogFar ?? 40;
         this.scene.fog = new THREE.Fog(lighting.fogColor, fogNear, fogFar);
       }
 
       this.scene.background = new THREE.Color(lighting.fogColor);
     }
 
     // Update caustic settings flag
     this.useCaustics = lighting.enableCaustics;
+    if (this.useCaustics) {
+      this.updateCausticUniforms(lighting);
+    }
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

7) Introduced helper methods in EnvironmentManager to dispose materials, textures, and objects, ensuring cleanup of pooled meshes and textures

Updated dispose logic to use these helpers and clear all decoration pools properly

Added pool clearing and reinitialization during environment resets to avoid lingering resources

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index dacc8ed..40f7129 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -91,50 +91,93 @@ export class EnvironmentManager {
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
   }
 
   private initializeWaterSurface(): void {
     this.waterSurface = this.assetFactory.getWaterSurfaceAsset();
     const mesh = this.waterSurface.getMesh();
     mesh.position.y = 10;
     this.scene.add(mesh);
   }
+
+  /** Disposes a material and any textures referenced on it */
+  private disposeMaterial(material: THREE.Material): void {
+    const mat = material as any;
+    for (const key of Object.keys(mat)) {
+      const value = mat[key];
+      if (value instanceof THREE.Texture) {
+        value.dispose();
+      }
+    }
+    material.dispose();
+  }
+
+  /** Fully dispose of a mesh or group and remove it from the scene */
+  private disposeObject(object: THREE.Object3D): void {
+    object.traverse(child => {
+      if (child instanceof THREE.Mesh) {
+        child.geometry?.dispose();
+        const material = child.material as THREE.Material | THREE.Material[];
+        if (Array.isArray(material)) {
+          material.forEach(m => this.disposeMaterial(m));
+        } else if (material) {
+          this.disposeMaterial(material);
+        }
+      }
+    });
+    this.scene.remove(object);
+  }
+
+  /**
+   * Dispose all decoration objects currently stored in pools and empty them
+   */
+  private clearDecorationPools(): void {
+    this.pebblePool.forEach(p => this.disposeObject(p));
+    this.rockPool.forEach(r => this.disposeObject(r));
+    this.clamPool.forEach(c => this.disposeObject(c));
+    this.kelpPool.forEach(k => this.disposeObject(k));
+
+    this.pebblePool = [];
+    this.rockPool = [];
+    this.clamPool = [];
+    this.kelpPool = [];
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
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index dacc8ed..40f7129 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -228,111 +271,72 @@ export class EnvironmentManager {
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
-      segment.seafloor.geometry.dispose();
-      if (segment.seafloor.material instanceof THREE.Material) {
-        segment.seafloor.material.dispose();
-      }
+      this.disposeObject(segment.seafloor);
       this.scene.remove(segment.mesh);
-
-      segment.decorations.forEach(obj => {
-        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
-        if ((obj as THREE.Mesh).material) {
-          const mat = (obj as THREE.Mesh).material as THREE.Material;
-          mat.dispose();
-        }
-        this.scene.remove(obj);
-      });
+      segment.decorations.forEach(obj => this.disposeObject(obj));
     });
     this.segments = [];
 
     this.waterSurface?.dispose();
 
     // Dispose decoration pools
-    this.pebblePool.forEach(p => { 
-      p.geometry.dispose(); 
-      (p.material as THREE.Material).dispose(); 
-      this.scene.remove(p); 
-    });
-    this.rockPool.forEach(r => { 
-      r.geometry.dispose(); 
-      (r.material as THREE.Material).dispose(); 
-      this.scene.remove(r); 
-    });
-    this.clamPool.forEach(c => { 
-      this.scene.remove(c); 
-    });
-    this.kelpPool.forEach(k => {
-      this.scene.remove(k);
-    });
-    this.pebblePool = [];
-    this.rockPool = [];
-    this.clamPool = [];
-    this.kelpPool = [];
+    this.clearDecorationPools();
 
     console.log("EnvironmentManager: Disposed.");
   }
 
   public async reset(initialPlayerZ: number = 0): Promise<void> {
+    // Remove and dispose any active decorations
     this.segments.forEach(segment => {
       segment.isActive = false;
       segment.mesh.visible = false;
-      
+
       segment.decorations.forEach(obj => {
-        obj.visible = false;
-        switch (obj.userData.decorationType) {
-          case 'pebble':
-            this.pebblePool.push(obj as THREE.Mesh);
-            break;
-          case 'rock':
-            this.rockPool.push(obj as THREE.Mesh);
-            break;
-          case 'clam':
-            this.clamPool.push(obj as THREE.Group);
-            break;
-          case 'kelp':
-            this.kelpPool.push(obj as THREE.Group);
-            break;
-        }
+        this.disposeObject(obj);
       });
       segment.decorations = [];
     });
+
+    // Clear existing pooled decorations and recreate them
+    this.clearDecorationPools();
+    this.initializeDecorationPools();
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
1) Bounding boxes are now computed for frond geometries during creation to ensure accurate dimensions

Animation height calculations use the geometry’s bounding box instead of relying on shape parameters, improving accuracy

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/obstacles/KelpWallAsset.ts b/nemo-runner/src/lib/game/assets/obstacles/KelpWallAsset.ts
index 0d58bcf..6120cc3 100644
--- a/nemo-runner/src/lib/game/assets/obstacles/KelpWallAsset.ts
+++ b/nemo-runner/src/lib/game/assets/obstacles/KelpWallAsset.ts
@@ -80,100 +80,107 @@ export class KelpWallAsset {
       const stalk = new THREE.Mesh(stalkGeom, kelpMaterial);
       stalk.userData.baseY = 0;
       strandGroup.add(stalk);
       this.kelpParts.push({ mesh: stalk, original: stalkGeom.attributes.position.clone(), type: 'stalk' });
 
       const numFronds = this.config.frondCount || 5;
       const frondMaterial = kelpMaterial.clone();
       if (visualConf.detailColor) {
         frondMaterial.color = new THREE.Color(visualConf.detailColor);
       }
 
       for (let j = 0; j < numFronds; j++) {
         const frondLength = currentStalkHeight * THREE.MathUtils.randFloat(0.3, 0.6);
         const frondWidth = frondLength * THREE.MathUtils.randFloat(0.2, 0.35);
 
         const frondShape = new THREE.Shape();
         frondShape.moveTo(0, 0);
         frondShape.quadraticCurveTo(frondWidth * 0.2, frondLength * 0.3, frondWidth * 0.1, frondLength * 0.7);
         frondShape.quadraticCurveTo(0, frondLength, -frondWidth * 0.1, frondLength * 0.7);
         frondShape.quadraticCurveTo(-frondWidth * 0.2, frondLength * 0.3, 0, 0);
 
         const frondGeom = new THREE.ShapeGeometry(frondShape, 3);
         frondGeom.translate(0, 0, 0);
         frondGeom.rotateX(Math.PI / 2);
         frondGeom.userData.originalPositions = frondGeom.attributes.position.clone();
+        // Ensure bounding information exists for later calculations
+        frondGeom.computeBoundingBox();
 
         const frond = new THREE.Mesh(frondGeom, frondMaterial);
         const attachHeightRatio = (j / (numFronds - 1 || 1)) * 0.7 + 0.2;
         const attachHeight = attachHeightRatio * currentStalkHeight;
         frond.userData.baseY = attachHeight;
         frond.position.set((Math.random() < 0.5 ? 1 : -1) * (stalkRadiusBottom * 0.5), attachHeight, 0);
         frond.rotation.y = THREE.MathUtils.randFloatSpread(Math.PI * 0.5);
         frond.rotation.x = THREE.MathUtils.randFloatSpread(Math.PI / 4);
         stalk.add(frond);
         this.kelpParts.push({ mesh: frond, original: frondGeom.attributes.position.clone(), type: 'frond' });
       }
 
       strandGroup.position.x = numStrands > 1 ? i * spacing - totalWallWidth / 2 + spacing / 2 : 0;
       strandGroup.position.z = (Math.random() - 0.5) * 0.3;
       strandGroup.rotation.y = (Math.random() - 0.5) * 0.2;
       this.mesh.add(strandGroup);
     }
 
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
 
     this.kelpParts.forEach((item, partIndex) => {
       const kelpPart = item.mesh;
       const geom = kelpPart.geometry;
       const originalAttr = item.original as THREE.BufferAttribute;
       const currentAttr = geom.attributes.position as THREE.BufferAttribute;
       if (!originalAttr) return;
 
       const worldPos = new THREE.Vector3();
       const parentObject = kelpPart.parent instanceof THREE.Group ? kelpPart.parent : kelpPart;
       parentObject.getWorldPosition(worldPos);
 
       const partHeight = item.type === 'stalk'
         ? (geom as THREE.CylinderGeometry).parameters.height
-        : (geom as THREE.ShapeGeometry).parameters.shapes[0].getBoundingBox().getSize(new THREE.Vector3()).y;
+        : (() => {
+            const shapeGeom = geom as THREE.ShapeGeometry;
+            shapeGeom.computeBoundingBox();
+            const bbox = shapeGeom.boundingBox!;
+            return bbox.max.y - bbox.min.y;
+          })();
 
       for (let i = 0; i < originalAttr.count; i++) {
         const ox = originalAttr.getX(i);
         const oy = originalAttr.getY(i);
         const oz = originalAttr.getZ(i);
 
         const normalized = Math.abs(oy / (partHeight || 0.1));
         const swayFactor = Math.pow(normalized, 1.5);
 
         const phaseOffset = (worldPos.x + worldPos.z) * 0.3 + partIndex * 0.3;
 
         const waveX = Math.sin(this.animationTime * swaySpeed + oy * 0.5 + phaseOffset) * swayAmplitude * swayFactor;
         const waveZ = Math.cos(this.animationTime * swaySpeed * 0.7 + oy * 0.4 + phaseOffset * 1.3) * swayAmplitude * swayFactor * 0.5;
 
         currentAttr.setXYZ(i, ox + waveX, oy, oz + waveZ);
       }
       currentAttr.needsUpdate = true;
     });
     if (this.kelpParts.length > 0) {
       this.kelpParts[0].mesh.geometry.computeVertexNormals();
     }
   }
 
   public getMesh(): THREE.Group { return this.mesh; }
   public getCollisionObject(): THREE.Mesh { return this.collisionMesh; }
 
EOF
)

2) Added a procedurally generated bump texture and improved geometry with vertex displacement for a more natural look

Ensured the bump texture is disposed of properly to avoid memory leaks

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/PebbleAsset.ts b/nemo-runner/src/lib/game/assets/environment/PebbleAsset.ts
index cd7e543..49c78ac 100644
--- a/nemo-runner/src/lib/game/assets/environment/PebbleAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/PebbleAsset.ts
@@ -1,54 +1,98 @@
 import * as THREE from 'three';
 import { configSystem } from '../../core/ConfigurationSystem';
 import { DecorationItemConfig } from '../../config/gameConfig';
 
 /**
  * Simple decorative pebble placed on the seafloor.
  */
 export class PebbleAsset {
   private config: Readonly<DecorationItemConfig>;
   private mesh: THREE.Mesh;
+  private bumpTexture: THREE.CanvasTexture | null = null;
 
   constructor() {
     this.config = configSystem.getDecorationsConfig().pebble;
     this.mesh = this.createMesh();
   }
 
   private randomColor(): THREE.Color {
     const colors = this.config.colors;
     const value = colors[Math.floor(Math.random() * colors.length)];
     return new THREE.Color(value as any);
   }
 
+  private createBumpTexture(): THREE.CanvasTexture {
+    const size = 32;
+    const canvas = document.createElement('canvas');
+    canvas.width = size;
+    canvas.height = size;
+    const ctx = canvas.getContext('2d')!;
+
+    const imageData = ctx.createImageData(size, size);
+    for (let i = 0; i < imageData.data.length; i += 4) {
+      const val = 128 + (Math.random() - 0.5) * 40;
+      imageData.data[i] = val;
+      imageData.data[i + 1] = val;
+      imageData.data[i + 2] = val;
+      imageData.data[i + 3] = 255;
+    }
+    ctx.putImageData(imageData, 0, 0);
+
+    const texture = new THREE.CanvasTexture(canvas);
+    texture.wrapS = THREE.RepeatWrapping;
+    texture.wrapT = THREE.RepeatWrapping;
+    texture.needsUpdate = true;
+    return texture;
+  }
+
   private createMesh(): THREE.Mesh {
-    const geometry = new THREE.SphereGeometry(0.5, 6, 6);
+    const geometry = new THREE.SphereGeometry(0.5, 12, 12);
+
+    const pos = geometry.attributes.position as THREE.BufferAttribute;
+    const vertex = new THREE.Vector3();
+    const normal = new THREE.Vector3();
+    for (let i = 0; i < pos.count; i++) {
+      vertex.fromBufferAttribute(pos, i);
+      normal.copy(vertex).normalize();
+      vertex.addScaledVector(normal, (Math.random() - 0.5) * 0.08);
+      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
+    }
+    geometry.computeVertexNormals();
+
+    this.bumpTexture = this.createBumpTexture();
     const material = new THREE.MeshStandardMaterial({
       color: this.randomColor(),
       roughness: 0.9,
       metalness: 0.1,
+      bumpMap: this.bumpTexture,
+      bumpScale: 0.02,
     });
 
     const mesh = new THREE.Mesh(geometry, material);
     mesh.name = 'PebbleDecor';
 
     const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
     mesh.scale.setScalar(scale);
     mesh.rotation.set(
       Math.random() * Math.PI,
       Math.random() * Math.PI,
       Math.random() * Math.PI,
     );
     return mesh;
   }
 
   public getMesh(): THREE.Mesh {
     return this.mesh;
   }
 
   public dispose(): void {
     this.mesh.geometry.dispose();
     if (this.mesh.material instanceof THREE.Material) {
       this.mesh.material.dispose();
     }
+    if (this.bumpTexture) {
+      this.bumpTexture.dispose();
+      this.bumpTexture = null;
+    }
   }
 }
 
EOF
)

3) Switched the rock to an icosahedron with higher detail, applying additional vertex displacement for irregularity

Added per-vertex color selection from config for subtle mottling and generated a procedural bump map to give surface texture

Disposed of the bump map and material correctly to free resources

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/SmallRockAsset.ts b/nemo-runner/src/lib/game/assets/environment/SmallRockAsset.ts
index 45f0e64..f8fd399 100644
--- a/nemo-runner/src/lib/game/assets/environment/SmallRockAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SmallRockAsset.ts
@@ -1,60 +1,107 @@
 import * as THREE from 'three';
 import { configSystem } from '../../core/ConfigurationSystem';
 import { DecorationItemConfig } from '../../config/gameConfig';
 
 /**
  * Slightly larger decorative rock for the seafloor.
  */
 export class SmallRockAsset {
   private config: Readonly<DecorationItemConfig>;
   private mesh: THREE.Mesh;
+  private bumpMap?: THREE.CanvasTexture;
 
   constructor() {
     this.config = configSystem.getDecorationsConfig().smallRock;
     this.mesh = this.createMesh();
   }
 
   private randomColor(): THREE.Color {
     const colors = this.config.colors;
     const value = colors[Math.floor(Math.random() * colors.length)];
     return new THREE.Color(value as any);
   }
 
+  private createBumpMap(): THREE.CanvasTexture {
+    const canvas = document.createElement('canvas');
+    const size = 64;
+    canvas.width = size;
+    canvas.height = size;
+    const ctx = canvas.getContext('2d')!;
+    for (let x = 0; x < size; x++) {
+      for (let y = 0; y < size; y++) {
+        const val = Math.floor(Math.random() * 50) + 180;
+        ctx.fillStyle = `rgb(${val},${val},${val})`;
+        ctx.fillRect(x, y, 1, 1);
+      }
+    }
+    const texture = new THREE.CanvasTexture(canvas);
+    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
+    return texture;
+  }
+
   private createMesh(): THREE.Mesh {
-    const geometry = new THREE.DodecahedronGeometry(0.6, 1);
-    // Slightly roughen shape
+    const geometry = new THREE.IcosahedronGeometry(0.6, 2);
+
+    // Displace vertices for a more organic shape
     const pos = geometry.attributes.position as THREE.BufferAttribute;
     const vertex = new THREE.Vector3();
+    const normal = new THREE.Vector3();
     for (let i = 0; i < pos.count; i++) {
       vertex.fromBufferAttribute(pos, i);
-      vertex.addScaledVector(vertex.clone().normalize(), (Math.random() - 0.5) * 0.2);
+      normal.copy(vertex).normalize();
+      const disp = (Math.random() - 0.5) * 0.3;
+      vertex.addScaledVector(normal, disp);
       pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
     }
+
+    // Assign random vertex colors for mottling
+    const colorAttr = new Float32Array(pos.count * 3);
+    const color = new THREE.Color();
+    const colors = this.config.colors;
+    for (let i = 0; i < pos.count; i++) {
+      color.set(colors[Math.floor(Math.random() * colors.length)] as any);
+      colorAttr[i * 3] = color.r;
+      colorAttr[i * 3 + 1] = color.g;
+      colorAttr[i * 3 + 2] = color.b;
+    }
+    geometry.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));
+
     geometry.computeVertexNormals();
 
+    this.bumpMap = this.createBumpMap();
+
     const material = new THREE.MeshStandardMaterial({
-      color: this.randomColor(),
+      vertexColors: true,
       roughness: 0.85,
       metalness: 0.15,
+      bumpMap: this.bumpMap,
+      bumpScale: 0.03,
     });
 
     const mesh = new THREE.Mesh(geometry, material);
     mesh.name = 'SmallRockDecor';
 
     const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
     mesh.scale.setScalar(scale);
     mesh.rotation.y = Math.random() * Math.PI * 2;
     return mesh;
   }
 
   public getMesh(): THREE.Mesh {
     return this.mesh;
   }
 
   public dispose(): void {
     this.mesh.geometry.dispose();
     if (this.mesh.material instanceof THREE.Material) {
-      this.mesh.material.dispose();
+      const mat = this.mesh.material as THREE.MeshStandardMaterial;
+      if (mat.bumpMap) {
+        mat.bumpMap.dispose();
+      }
+      mat.dispose();
+    }
+    if (this.bumpMap) {
+      this.bumpMap.dispose();
     }
   }
-}
+}
 
EOF
)

4) Clam decoration shells now use more segments for smoother geometry and include random ridges for a natural look

Added a new interior material with sheen to give the closed shells a subtle richness

Outer and inner shell meshes are created separately, still selecting random exterior colors from the configuration and honoring existing disposal logic

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/ClamDecorAsset.ts b/nemo-runner/src/lib/game/assets/environment/ClamDecorAsset.ts
index 34bb4dc..391009f 100644
--- a/nemo-runner/src/lib/game/assets/environment/ClamDecorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/ClamDecorAsset.ts
@@ -1,65 +1,120 @@
 import * as THREE from 'three';
 import { configSystem } from '../../core/ConfigurationSystem';
 import { DecorationItemConfig } from '../../config/gameConfig';
 
 /**
  * Simple closed clam decoration for the seafloor.
  */
 export class ClamDecorAsset {
   private config: Readonly<DecorationItemConfig>;
   private group: THREE.Group;
 
   constructor() {
     this.config = configSystem.getDecorationsConfig().clam;
     this.group = new THREE.Group();
     this.createMesh();
   }
 
   private randomColor(): THREE.Color {
     const colors = this.config.colors;
     const value = colors[Math.floor(Math.random() * colors.length)];
     return new THREE.Color(value as any);
   }
 
   private createShellGeometry(size: number, top: boolean): THREE.BufferGeometry {
-    const geo = new THREE.SphereGeometry(size, 8, 8, 0, Math.PI * 2, top ? 0 : Math.PI / 2, Math.PI / 2);
+    const widthSegments = 24;
+    const heightSegments = 16;
+
+    const geo = new THREE.SphereGeometry(
+      size,
+      widthSegments,
+      heightSegments,
+      0,
+      Math.PI * 2,
+      top ? 0 : Math.PI / 2,
+      Math.PI / 2
+    );
     if (top) geo.rotateX(Math.PI);
+
+    // Add subtle ridges/noise
+    const positions = geo.attributes.position as THREE.BufferAttribute;
+    const vertex = new THREE.Vector3();
+    for (let i = 0; i < positions.count; i++) {
+      vertex.fromBufferAttribute(positions, i);
+
+      const dist = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
+      const norm = dist / size;
+      const angle = Math.atan2(vertex.z, vertex.x);
+      const ridge = Math.sin(angle * 6) * size * 0.02 * norm;
+      vertex.y += ridge * (top ? 1 : -1);
+
+      vertex.x += (Math.random() - 0.5) * size * 0.005;
+      vertex.y += (Math.random() - 0.5) * size * 0.005;
+      vertex.z += (Math.random() - 0.5) * size * 0.005;
+
+      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
+    }
+
+    positions.needsUpdate = true;
+    geo.computeVertexNormals();
+
     return geo;
   }
 
   private createMesh(): void {
-    const material = new THREE.MeshStandardMaterial({
+    const outerMaterial = new THREE.MeshStandardMaterial({
       color: this.randomColor(),
       roughness: 0.8,
       metalness: 0.2,
-      side: THREE.DoubleSide,
+      side: THREE.FrontSide,
+    });
+
+    const interiorMaterial = new THREE.MeshPhysicalMaterial({
+      color: 0xf0e8d8,
+      roughness: 0.3,
+      metalness: 0.1,
+      sheen: 0.5,
+      sheenColor: new THREE.Color(0xffffff),
+      side: THREE.BackSide,
     });
 
     const size = 0.5;
-    const top = new THREE.Mesh(this.createShellGeometry(size, true), material);
-    const bottom = new THREE.Mesh(this.createShellGeometry(size, false), material);
+    const topGeo = this.createShellGeometry(size, true);
+    const bottomGeo = this.createShellGeometry(size, false);
+
+    const top = new THREE.Group();
+    const topOuter = new THREE.Mesh(topGeo, outerMaterial);
+    const topInner = new THREE.Mesh(topGeo.clone(), interiorMaterial);
+    topInner.scale.multiplyScalar(0.98);
+    top.add(topOuter, topInner);
+
+    const bottom = new THREE.Group();
+    const bottomOuter = new THREE.Mesh(bottomGeo, outerMaterial);
+    const bottomInner = new THREE.Mesh(bottomGeo.clone(), interiorMaterial);
+    bottomInner.scale.multiplyScalar(0.98);
+    bottom.add(bottomOuter, bottomInner);
 
     top.position.y = size * 0.25;
     bottom.position.y = -size * 0.25;
 
     this.group.add(top, bottom);
     this.group.name = 'ClamDecor';
 
     const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
     this.group.scale.setScalar(scale);
     this.group.rotation.y = Math.random() * Math.PI * 2;
   }
 
   public getMesh(): THREE.Group {
     return this.group;
   }
 
   public dispose(): void {
     this.group.traverse(child => {
       if (child instanceof THREE.Mesh) {
         child.geometry.dispose();
         if (child.material instanceof THREE.Material) {
           child.material.dispose();
         }
       }
     });
 
EOF
)

5) Implemented a lightweight simplex noise generator to avoid extra dependencies and provide smoother noise variation

Rewrote sand texture creation to use tileable fractal noise with a subtle brightness gradient for depth variation

Generated a higher frequency noise-based bump map and increased the default bump scale accordingly

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
index cc9a53f..78a05b9 100644
--- a/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/SeafloorAsset.ts
@@ -1,166 +1,301 @@
 import * as THREE from 'three';
 import { configSystem } from '../../core/ConfigurationSystem';
 import { ShaderManager } from '../../services/ShaderManager';
 import { LightingManager } from '../../services/LightingManager';
 
+// Minimal simplex noise implementation (2D) adapted from the
+// three.js SimplexNoise class. This keeps the dependency footprint
+// small and avoids importing from the examples directory.
+class SimplexNoise {
+  private perm: Uint8Array;
+  private permMod12: Uint8Array;
+  private grad3: number[][] = [
+    [1, 1],
+    [-1, 1],
+    [1, -1],
+    [-1, -1],
+    [1, 0],
+    [-1, 0],
+    [1, 0],
+    [-1, 0],
+    [0, 1],
+    [0, -1],
+    [0, 1],
+    [0, -1]
+  ];
+
+  constructor(randomFn: () => number = Math.random) {
+    const p = new Uint8Array(256);
+    for (let i = 0; i < 256; i++) {
+      p[i] = i;
+    }
+    // Shuffle using Fisher–Yates algorithm
+    for (let i = 255; i > 0; i--) {
+      const r = Math.floor(randomFn() * (i + 1));
+      const tmp = p[i];
+      p[i] = p[r];
+      p[r] = tmp;
+    }
+
+    this.perm = new Uint8Array(512);
+    this.permMod12 = new Uint8Array(512);
+    for (let i = 0; i < 512; i++) {
+      this.perm[i] = p[i & 255];
+      this.permMod12[i] = this.perm[i] % 12;
+    }
+  }
+
+  public noise2D(xin: number, yin: number): number {
+    const F2 = 0.5 * (Math.sqrt(3) - 1);
+    const G2 = (3 - Math.sqrt(3)) / 6;
+
+    let n0 = 0;
+    let n1 = 0;
+    let n2 = 0;
+
+    const s = (xin + yin) * F2;
+    const i = Math.floor(xin + s);
+    const j = Math.floor(yin + s);
+    const t = (i + j) * G2;
+    const X0 = i - t;
+    const Y0 = j - t;
+    const x0 = xin - X0;
+    const y0 = yin - Y0;
+
+    let i1: number, j1: number;
+    if (x0 > y0) {
+      i1 = 1;
+      j1 = 0;
+    } else {
+      i1 = 0;
+      j1 = 1;
+    }
+
+    const x1 = x0 - i1 + G2;
+    const y1 = y0 - j1 + G2;
+    const x2 = x0 - 1 + 2 * G2;
+    const y2 = y0 - 1 + 2 * G2;
+
+    const ii = i & 255;
+    const jj = j & 255;
+    const gi0 = this.permMod12[ii + this.perm[jj]];
+    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
+    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
+
+    let t0 = 0.5 - x0 * x0 - y0 * y0;
+    if (t0 >= 0) {
+      t0 *= t0;
+      n0 = t0 * t0 * (this.grad3[gi0][0] * x0 + this.grad3[gi0][1] * y0);
+    }
+
+    let t1 = 0.5 - x1 * x1 - y1 * y1;
+    if (t1 >= 0) {
+      t1 *= t1;
+      n1 = t1 * t1 * (this.grad3[gi1][0] * x1 + this.grad3[gi1][1] * y1);
+    }
+
+    let t2 = 0.5 - x2 * x2 - y2 * y2;
+    if (t2 >= 0) {
+      t2 *= t2;
+      n2 = t2 * t2 * (this.grad3[gi2][0] * x2 + this.grad3[gi2][1] * y2);
+    }
+
+    return 70 * (n0 + n1 + n2);
+  }
+}
+
 // Minimal interface mirroring Step 7 documentation
 interface SeafloorVisualConfig {
   baseColor: number | string;
   sandPatternColor1: number | string;
   sandPatternColor2: number | string;
   textureScale: number;
   bumpScale?: number;
   roughness?: number;
   metalness?: number;
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
-      bumpScale: 0.02,
+      bumpScale: 0.04,
       roughness: 0.85,
       metalness: 0.0
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
 
+    const simplex = new SimplexNoise();
+
+    const fbm = (x: number, y: number): number => {
+      let value = 0;
+      let amplitude = 0.5;
+      let frequency = 1;
+      for (let o = 0; o < 4; o++) {
+        // Tileable simplex noise
+        const n00 = simplex.noise2D((x * frequency) / size, (y * frequency) / size);
+        const n10 = simplex.noise2D(((x - size) * frequency) / size, (y * frequency) / size);
+        const n01 = simplex.noise2D((x * frequency) / size, ((y - size) * frequency) / size);
+        const n11 = simplex.noise2D(((x - size) * frequency) / size, ((y - size) * frequency) / size);
+        const sx = x / size;
+        const sy = y / size;
+        const ix0 = THREE.MathUtils.lerp(n00, n10, sx);
+        const ix1 = THREE.MathUtils.lerp(n01, n11, sx);
+        const n = THREE.MathUtils.lerp(ix0, ix1, sy);
+
+        value += n * amplitude;
+        frequency *= 2;
+        amplitude *= 0.5;
+      }
+      return value;
+    };
+
     for (let y = 0; y < size; y++) {
       for (let x = 0; x < size; x++) {
-        const randomFactor = Math.random() * 0.1 - 0.05;
-        const varied = baseColor.clone().offsetHSL(0, 0, randomFactor);
-        ctx.fillStyle = varied.getStyle();
+        const n = fbm(x, y) * 0.5 + 0.5; // Map to 0-1
+        // Slight brightness gradient - darker for lower noise values
+        const brightness = THREE.MathUtils.lerp(0.85, 1.0, n);
+        const patternColor = color1.clone().lerp(color2, n);
+        const finalColor = baseColor.clone().lerp(patternColor, 0.5);
+        finalColor.multiplyScalar(brightness);
+        ctx.fillStyle = `#${finalColor.getHexString()}`;
         ctx.fillRect(x, y, 1, 1);
       }
     }
 
-    const numSplotches = 80;
-    for (let i = 0; i < numSplotches; i++) {
-      const splotchColor = Math.random() < 0.5 ? color1 : color2;
-      ctx.fillStyle = splotchColor
-        .clone()
-        .offsetHSL(0, 0, Math.random() * 0.2 - 0.1)
-        .getStyle();
-      const x = Math.random() * size;
-      const y = Math.random() * size;
-      const r = Math.random() * (size / 15) + size / 30;
-      ctx.beginPath();
-      ctx.arc(x, y, r, 0, Math.PI * 2);
-      ctx.fill();
-    }
-
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
-    ctx.fillStyle = 'rgb(128,128,128)';
-    ctx.fillRect(0, 0, size, size);
-
-    for (let i = 0; i < 2000; i++) {
-      const x = Math.random() * size;
-      const y = Math.random() * size;
-      const radius = Math.random() * 3 + 1;
-      const intensity = Math.floor(Math.random() * 50) + 100;
-      ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
-      ctx.beginPath();
-      ctx.arc(x, y, radius, 0, Math.PI * 2);
-      ctx.fill();
+
+    const simplex = new SimplexNoise();
+
+    const fbm = (x: number, y: number): number => {
+      let value = 0;
+      let amplitude = 0.5;
+      let frequency = 1;
+      for (let o = 0; o < 5; o++) {
+        const n00 = simplex.noise2D((x * frequency) / size, (y * frequency) / size);
+        const n10 = simplex.noise2D(((x - size) * frequency) / size, (y * frequency) / size);
+        const n01 = simplex.noise2D((x * frequency) / size, ((y - size) * frequency) / size);
+        const n11 = simplex.noise2D(((x - size) * frequency) / size, ((y - size) * frequency) / size);
+        const sx = x / size;
+        const sy = y / size;
+        const ix0 = THREE.MathUtils.lerp(n00, n10, sx);
+        const ix1 = THREE.MathUtils.lerp(n01, n11, sx);
+        const n = THREE.MathUtils.lerp(ix0, ix1, sy);
+
+        value += n * amplitude;
+        frequency *= 2;
+        amplitude *= 0.5;
+      }
+      return value;
+    };
+
+    for (let y = 0; y < size; y++) {
+      for (let x = 0; x < size; x++) {
+        const n = fbm(x, y) * 0.5 + 0.5; // 0-1
+        const value = Math.floor(n * 255);
+        ctx.fillStyle = `rgb(${value},${value},${value})`;
+        ctx.fillRect(x, y, 1, 1);
+      }
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
 
   private createMaterial(): void {
     this.sandTexture = this.createSandTexture();
     this.sandBumpMap = this.createSandBumpMap();
 
     this.material = new THREE.MeshStandardMaterial({
       map: this.sandTexture,
       bumpMap: this.sandBumpMap,
-      bumpScale: this.config.bumpScale ?? 0.02,
+      bumpScale: this.config.bumpScale ?? 0.04,
       color: 0xffffff,
       roughness: this.config.roughness ?? 0.8,
       metalness: this.config.metalness ?? 0.05,
       side: THREE.FrontSide
     });
 
     const lighting = configSystem.getLightingConfig();
     if (lighting.enableCaustics && this.lightingManager) {
       this.material.onBeforeCompile = (shader) => {
         shader.uniforms.uCausticColor = {
           value: new THREE.Color(lighting.causticColor)
         };
         shader.uniforms.uCausticIntensity = { value: lighting.causticIntensity };
         shader.uniforms.uCausticScale = { value: lighting.causticScale };
         shader.uniforms.uTime = this.lightingManager!.globalCausticTimeUniform;
 
         shader.vertexShader =
           'varying vec3 vWorldPosition_Seafloor;\n' + shader.vertexShader;
         shader.vertexShader = shader.vertexShader.replace(
           '#include <worldpos_vertex>',
           `#include <worldpos_vertex>
           vWorldPosition_Seafloor = worldPosition.xyz;`
         );
 
         shader.fragmentShader =
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 7024033..2497a45 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -664,51 +664,51 @@ export const defaultConfig: GameConfig = {
 
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
-      bumpScale: 0.02,
+      bumpScale: 0.04,
       roughness: 0.85,
       metalness: 0.0,
       decorations: {
         pebbles: { spawnCount: 20, scaleMin: 0.1, scaleMax: 0.3 },
         smallRocks: { spawnCount: 10, scaleMin: 0.2, scaleMax: 0.5 },
         clams: { spawnCount: 5, scaleMin: 0.3, scaleMax: 0.6 }
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
     ambientLight: { color: 0x406080, intensity: 0.5 },
     directionalLight: {
       color: 0xE0F0FF,
       intensity: 0.7,
 
EOF
)

6) Shifted the sky and fog toward a turquoise tone and enabled a gradient fog using near/far distances instead of density

Increased ambient light brightness and gave both lights a more aqua hue to mimic underwater scattering

Confirmed LightingManager.updateConfig applies the fog color to the scene background, so the new turquoise fog sets the overall environment tone

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 7024033..f0b5509 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -629,51 +629,51 @@ export const defaultConfig: GameConfig = {
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
     }
   },
   visuals: {
-    skyColor: 0x1a2b3c, // Darker blue for underwater
+    skyColor: 0x144c55, // Turquoise-tinted background
 
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
 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 7024033..f0b5509 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -686,50 +686,51 @@ export const defaultConfig: GameConfig = {
       sandPatternColor1: 0xC4A484,
       sandPatternColor2: 0x9A7B5A,
       textureScale: 15.0,
       bumpScale: 0.02,
       roughness: 0.85,
       metalness: 0.0,
       decorations: {
         pebbles: { spawnCount: 20, scaleMin: 0.1, scaleMax: 0.3 },
         smallRocks: { spawnCount: 10, scaleMin: 0.2, scaleMax: 0.5 },
         clams: { spawnCount: 5, scaleMin: 0.3, scaleMax: 0.6 }
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
-    ambientLight: { color: 0x406080, intensity: 0.5 },
+    ambientLight: { color: 0x80d0d0, intensity: 0.6 },
     directionalLight: {
-      color: 0xE0F0FF,
-      intensity: 0.7,
+      color: 0xc8ffff,
+      intensity: 0.8,
       position: { x: 1, y: 10, z: 1 },
       castShadow: false
     },
-    fogColor: 0x102a43,
-    fogDensity: 0.03,
+    fogColor: 0x0d5660,
+    fogNear: 10,
+    fogFar: 60,
     enableCaustics: true,
     causticColor: 0xA0D0FF,
     causticIntensity: 0.15,
     causticScale: 6.0,
     causticSpeed: 0.08,
     causticBlendMode: 'additive',
     enableGodRays: true,
     godRayColor: 0xA0D0FF,
     godRayIntensity: 0.08,
     godRayDensity: 0.96,
     godRayWeight: 0.05,
     godRayDecay: 0.96,
     godRayExposure: 0.1,
     godRaySamples: 20
   },
 };
 
EOF
)

7) Added a new decorative kelp asset with a lightweight geometry setup and CPU-based sway animation

Extended the asset factory to manage kelp meshes and allow creation of new instances on demand

Updated environment management to pool kelp objects and spawn them alongside other decorations

Expanded configuration to include kelp color options and spawn parameters within decoration settings

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
index 513b3a2..42da845 100644
--- a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
+++ b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
@@ -1,67 +1,69 @@
 import * as THREE from 'three';
 import { ShaderManager, MaterialType } from '../services/ShaderManager';
 import { SeafloorAsset } from './environment/SeafloorAsset';
 import { WaterSurfaceAsset } from './environment/WaterSurfaceAsset';
 import { PebbleAsset } from './environment/PebbleAsset';
 import { SmallRockAsset } from './environment/SmallRockAsset';
 import { ClamDecorAsset } from './environment/ClamDecorAsset';
+import { KelpAsset } from './environment/KelpAsset';
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
+  private kelpAssetGenerator?: KelpAsset;
 
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
index 513b3a2..42da845 100644
--- a/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
+++ b/nemo-runner/src/lib/game/assets/ProceduralAssetFactory.ts
@@ -307,50 +309,61 @@ export class ProceduralAssetFactory {
     }
     return this.waterSurfaceAsset;
   }
 
   public getPebbleMesh(): THREE.Mesh {
     if (!this.pebbleAssetGenerator) {
       this.pebbleAssetGenerator = new PebbleAsset();
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
 
+  public getKelpMesh(): THREE.Group {
+    if (!this.kelpAssetGenerator) {
+      this.kelpAssetGenerator = new KelpAsset();
+    }
+    return this.kelpAssetGenerator.getMesh();
+  }
+
+  public createKelpAsset(): KelpAsset {
+    return new KelpAsset();
+  }
+
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
         powerUpAsset = new MagnetPowerUpAsset(position);
         break;
       case 'doublescore':
         powerUpAsset = new DoubleScorePowerUpAsset(position);
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/nemo-runner/src/lib/game/assets/environment/KelpAsset.ts
index 0000000..8d1db05 100644
--- a//dev/null
+++ b/nemo-runner/src/lib/game/assets/environment/KelpAsset.ts
@@ -0,0 +1,156 @@
+import * as THREE from 'three';
+import { configSystem } from '../../core/ConfigurationSystem';
+import { DecorationItemConfig } from '../../config/gameConfig';
+
+/**
+ * Decorative kelp cluster with gentle sway animation.
+ * Derived from KelpWallAsset geometry but smaller and less dense.
+ */
+export class KelpAsset {
+  private config: Readonly<DecorationItemConfig>;
+  private group: THREE.Group;
+  private kelpParts: { mesh: THREE.Mesh; original: THREE.BufferAttribute; type: 'stalk' | 'frond' }[] = [];
+  private animationTime = 0;
+
+  constructor() {
+    this.config = (configSystem.getDecorationsConfig() as any).kelp;
+    this.group = new THREE.Group();
+    this.createMesh();
+  }
+
+  private randomColor(): THREE.Color {
+    const colors = this.config?.colors || [0x2e8b57, 0x3a5f0b, 0x20603d];
+    const value = colors[Math.floor(Math.random() * colors.length)];
+    return new THREE.Color(value as any);
+  }
+
+  private createMesh(): void {
+    const material = new THREE.MeshPhysicalMaterial({
+      color: this.randomColor(),
+      roughness: 0.8,
+      metalness: 0.05,
+      side: THREE.DoubleSide,
+      transparent: true,
+      opacity: 0.85,
+      transmission: 0.2,
+    });
+
+    const strandHeight = THREE.MathUtils.randFloat(1.0, 1.6);
+    const numStrands = THREE.MathUtils.randInt(1, 2);
+    const spacing = 0.15;
+
+    for (let i = 0; i < numStrands; i++) {
+      const strandGroup = new THREE.Group();
+      const stalkRadiusTop = 0.015 * THREE.MathUtils.randFloat(0.8, 1.2);
+      const stalkRadiusBottom = 0.025 * THREE.MathUtils.randFloat(0.9, 1.1);
+      const currentHeight = strandHeight * THREE.MathUtils.randFloat(0.9, 1.1);
+
+      const stalkGeom = new THREE.CylinderGeometry(stalkRadiusTop, stalkRadiusBottom, currentHeight, 6, 8);
+      stalkGeom.translate(0, currentHeight / 2, 0);
+      stalkGeom.userData.originalPositions = stalkGeom.attributes.position.clone();
+
+      const stalk = new THREE.Mesh(stalkGeom, material);
+      stalk.userData.baseY = 0;
+      strandGroup.add(stalk);
+      this.kelpParts.push({ mesh: stalk, original: stalkGeom.attributes.position.clone(), type: 'stalk' });
+
+      const numFronds = 3;
+      const frondMaterial = material.clone();
+
+      for (let j = 0; j < numFronds; j++) {
+        const frondLength = currentHeight * THREE.MathUtils.randFloat(0.3, 0.5);
+        const frondWidth = frondLength * THREE.MathUtils.randFloat(0.2, 0.35);
+        const frondShape = new THREE.Shape();
+        frondShape.moveTo(0, 0);
+        frondShape.quadraticCurveTo(frondWidth * 0.2, frondLength * 0.3, frondWidth * 0.1, frondLength * 0.7);
+        frondShape.quadraticCurveTo(0, frondLength, -frondWidth * 0.1, frondLength * 0.7);
+        frondShape.quadraticCurveTo(-frondWidth * 0.2, frondLength * 0.3, 0, 0);
+
+        const frondGeom = new THREE.ShapeGeometry(frondShape, 3);
+        frondGeom.rotateX(Math.PI / 2);
+        frondGeom.userData.originalPositions = frondGeom.attributes.position.clone();
+
+        const frond = new THREE.Mesh(frondGeom, frondMaterial);
+        const attachHeight = ((j + 1) / (numFronds + 1)) * currentHeight;
+        frond.userData.baseY = attachHeight;
+        frond.position.set((Math.random() < 0.5 ? 1 : -1) * stalkRadiusBottom * 0.5, attachHeight, 0);
+        frond.rotation.y = THREE.MathUtils.randFloatSpread(Math.PI * 0.5);
+        frond.rotation.x = THREE.MathUtils.randFloatSpread(Math.PI / 4);
+        stalk.add(frond);
+        this.kelpParts.push({ mesh: frond, original: frondGeom.attributes.position.clone(), type: 'frond' });
+      }
+
+      strandGroup.position.x = (i - (numStrands - 1) / 2) * spacing;
+      this.group.add(strandGroup);
+    }
+
+    const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
+    this.group.scale.setScalar(scale);
+    this.group.name = 'KelpDecor';
+    this.group.userData.decorationType = 'kelp';
+  }
+
+  public updateAnimation(deltaTime: number): void {
+    this.animationTime += deltaTime;
+    const swaySpeed = 0.6;
+    const swayAmplitude = 0.1;
+
+    this.kelpParts.forEach((item, index) => {
+      const geom = item.mesh.geometry;
+      const original = item.original as THREE.BufferAttribute;
+      const current = geom.attributes.position as THREE.BufferAttribute;
+      const worldPos = new THREE.Vector3();
+      item.mesh.getWorldPosition(worldPos);
+      const partHeight = item.type === 'stalk'
+        ? (geom as THREE.CylinderGeometry).parameters.height
+        : (geom as THREE.ShapeGeometry).parameters.shapes[0].getBoundingBox().getSize(new THREE.Vector3()).y;
+
+      for (let i = 0; i < original.count; i++) {
+        const ox = original.getX(i);
+        const oy = original.getY(i);
+        const oz = original.getZ(i);
+        const normalized = Math.abs(oy / (partHeight || 0.1));
+        const swayFactor = Math.pow(normalized, 1.5);
+        const phase = (worldPos.x + worldPos.z) * 0.3 + index * 0.5;
+        const waveX = Math.sin(this.animationTime * swaySpeed + oy * 0.5 + phase) * swayAmplitude * swayFactor;
+        const waveZ = Math.cos(this.animationTime * swaySpeed * 0.7 + oy * 0.4 + phase * 1.1) * swayAmplitude * swayFactor * 0.5;
+        current.setXYZ(i, ox + waveX, oy, oz + waveZ);
+      }
+      current.needsUpdate = true;
+    });
+    if (this.kelpParts.length > 0) {
+      this.kelpParts[0].mesh.geometry.computeVertexNormals();
+    }
+  }
+
+  public getMesh(): THREE.Group {
+    return this.group;
+  }
+
+  public reset(): void {
+    this.animationTime = 0;
+    this.kelpParts.forEach(item => {
+      const geom = item.mesh.geometry;
+      const orig = item.original;
+      const curr = geom.attributes.position as THREE.BufferAttribute;
+      if (orig && curr) {
+        curr.copy(orig);
+        curr.needsUpdate = true;
+        geom.computeVertexNormals();
+      }
+    });
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
+    this.kelpParts = [];
+  }
+}
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/config/gameConfig.ts b/nemo-runner/src/lib/game/config/gameConfig.ts
index 7024033..542ecf0 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -203,64 +203,66 @@ export interface ObstaclesConfig {
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
   smallRock: DecorationItemConfig;
   clam: DecorationItemConfig;
+  kelp: DecorationItemConfig;
 }
 
 export interface SeafloorVisualConfig {
   baseColor: number | string;
   sandPatternColor1: number | string;
   sandPatternColor2: number | string;
   textureScale: number;
   bumpScale?: number;
   roughness?: number;
   metalness?: number;
   decorations?: {
     pebbles: DecorationSpawnConfig;
     smallRocks: DecorationSpawnConfig;
     clams: DecorationSpawnConfig;
+    kelp: DecorationSpawnConfig;
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
index 7024033..542ecf0 100644
--- a/nemo-runner/src/lib/game/config/gameConfig.ts
+++ b/nemo-runner/src/lib/game/config/gameConfig.ts
@@ -626,95 +628,101 @@ export const defaultConfig: GameConfig = {
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
+    },
+    kelp: {
+      colors: [0x2e8b57, 0x3a5f0b, 0x20603d],
+      scaleMin: 0.8,
+      scaleMax: 1.2
     }
   },
   visuals: {
     skyColor: 0x1a2b3c, // Darker blue for underwater
 
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
       bumpScale: 0.02,
       roughness: 0.85,
       metalness: 0.0,
       decorations: {
         pebbles: { spawnCount: 20, scaleMin: 0.1, scaleMax: 0.3 },
         smallRocks: { spawnCount: 10, scaleMin: 0.2, scaleMax: 0.5 },
-        clams: { spawnCount: 5, scaleMin: 0.3, scaleMax: 0.6 }
+        clams: { spawnCount: 5, scaleMin: 0.3, scaleMax: 0.6 },
+        kelp: { spawnCount: 3, scaleMin: 0.8, scaleMax: 1.2 }
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
     ambientLight: { color: 0x406080, intensity: 0.5 },
     directionalLight: {
       color: 0xE0F0FF,
       intensity: 0.7,
       position: { x: 1, y: 10, z: 1 },
       castShadow: false
     },
     fogColor: 0x102a43,
     fogDensity: 0.03,
     enableCaustics: true,
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index 366c35e..3b0c78d 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -8,54 +8,56 @@ interface EnvironmentSegment {
   mesh: THREE.Group;
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
+  private kelpPool: THREE.Group[] = [];
 
   private pebblePoolSize = 50;
   private rockPoolSize = 20;
   private clamPoolSize = 10;
+  private kelpPoolSize = 20;
 
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
index 366c35e..3b0c78d 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -72,50 +74,59 @@ export class EnvironmentManager {
     for (let i = 0; i < this.pebblePoolSize; i++) {
       const pebble = this.assetFactory.getPebbleMesh();
       pebble.visible = false;
       pebble.userData.decorationType = 'pebble';
       this.scene.add(pebble);
       this.pebblePool.push(pebble);
     }
 
     // Initialize rocks
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
+
+    // Initialize kelp decorations
+    for (let i = 0; i < this.kelpPoolSize; i++) {
+      const kelp = this.assetFactory.getKelpMesh();
+      kelp.visible = false;
+      kelp.userData.decorationType = 'kelp';
+      this.scene.add(kelp);
+      this.kelpPool.push(kelp);
+    }
   }
 
   private initializeWaterSurface(): void {
     this.waterSurface = this.assetFactory.getWaterSurfaceAsset();
     const mesh = this.waterSurface.getMesh();
     mesh.position.y = 10;
     this.scene.add(mesh);
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
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index 366c35e..3b0c78d 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -144,85 +155,96 @@ export class EnvironmentManager {
 
   private spawnDecorations(segment: EnvironmentSegment): void {
     // Spawn pebbles
     const pebbleCount = THREE.MathUtils.randInt(3, 6);
     for (let i = 0; i < pebbleCount && this.pebblePool.length > 0; i++) {
       const pebble = this.pebblePool.pop()!;
       this.placeDecoration(pebble, segment);
       segment.decorations.push(pebble);
     }
 
     // Spawn rocks
     const rockCount = THREE.MathUtils.randInt(1, 3);
     for (let i = 0; i < rockCount && this.rockPool.length > 0; i++) {
       const rock = this.rockPool.pop()!;
       rock.scale.setScalar(0.3 + Math.random() * 0.3);
       this.placeDecoration(rock, segment);
       segment.decorations.push(rock);
     }
 
     // Spawn clams
     if (Math.random() < 0.3 && this.clamPool.length > 0) {
       const clam = this.clamPool.pop()!;
       this.placeDecoration(clam, segment);
       segment.decorations.push(clam);
     }
+
+    // Spawn kelp
+    const kelpCount = THREE.MathUtils.randInt(1, 2);
+    for (let i = 0; i < kelpCount && this.kelpPool.length > 0; i++) {
+      const kelp = this.kelpPool.pop()!;
+      this.placeDecoration(kelp, segment);
+      segment.decorations.push(kelp);
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
     const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 1)); // Point beyond which segments are recycled
 
     this.segments.forEach(segment => {
       if (segment.isActive) {
         // A segment's "front" edge (closest to player when behind) is its position.z + segmentLength/2
         const segmentFrontEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
         if (segmentFrontEdgeZ > recycleThreshold) {
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
+              case 'kelp':
+                this.kelpPool.push(obj as THREE.Group);
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
 
diff --git a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
index 366c35e..3b0c78d 100644
--- a/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
+++ b/nemo-runner/src/lib/game/managers/EnvironmentManager.ts
@@ -231,79 +253,86 @@ export class EnvironmentManager {
       segment.seafloor.geometry.dispose();
       if (segment.seafloor.material instanceof THREE.Material) {
         segment.seafloor.material.dispose();
       }
       this.scene.remove(segment.mesh);
 
       segment.decorations.forEach(obj => {
         if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
         if ((obj as THREE.Mesh).material) {
           const mat = (obj as THREE.Mesh).material as THREE.Material;
           mat.dispose();
         }
         this.scene.remove(obj);
       });
     });
     this.segments = [];
 
     this.waterSurface?.dispose();
 
     // Dispose decoration pools
     this.pebblePool.forEach(p => { 
       p.geometry.dispose(); 
       (p.material as THREE.Material).dispose(); 
       this.scene.remove(p); 
     });
-    this.rockPool.forEach(r => { 
-      r.geometry.dispose(); 
-      (r.material as THREE.Material).dispose(); 
-      this.scene.remove(r); 
+    this.rockPool.forEach(r => {
+      r.geometry.dispose();
+      (r.material as THREE.Material).dispose();
+      this.scene.remove(r);
+    });
+    this.clamPool.forEach(c => {
+      this.scene.remove(c);
     });
-    this.clamPool.forEach(c => { 
-      this.scene.remove(c); 
+    this.kelpPool.forEach(k => {
+      this.scene.remove(k);
     });
     this.pebblePool = [];
     this.rockPool = [];
     this.clamPool = [];
+    this.kelpPool = [];
 
     console.log("EnvironmentManager: Disposed.");
   }
 
   public async reset(initialPlayerZ: number = 0): Promise<void> {
     this.segments.forEach(segment => {
       segment.isActive = false;
       segment.mesh.visible = false;
       
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
+          case 'kelp':
+            this.kelpPool.push(obj as THREE.Group);
+            break;
         }
       });
       segment.decorations = [];
     });
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

8) Added integration with LightingManager in WaterSurfaceAsset, including new uniforms for Fresnel power, specular color, light direction, and intensity

WaterSurfaceAsset now updates light direction and intensity each frame, enabling specular highlights that react to the directional light

GameEngine links the LightingManager to the water surface asset after initialization so the shader receives lighting data

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/GameEngine.ts b/nemo-runner/src/lib/game/GameEngine.ts
index 90b54e5..2a572b9 100644
--- a/nemo-runner/src/lib/game/GameEngine.ts
+++ b/nemo-runner/src/lib/game/GameEngine.ts
@@ -119,50 +119,53 @@ export class GameEngine {
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
       await this.environmentManager.initialize();
+      this.assetFactory
+        .getWaterSurfaceAsset()
+        .linkLightingManager(this.lightingManager);
 
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
 
EOF
)

 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts b/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
index 6547ff7..06aad95 100644
--- a/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
+++ b/nemo-runner/src/lib/game/assets/environment/WaterSurfaceAsset.ts
@@ -1,82 +1,116 @@
 import * as THREE from 'three';
 import { configSystem } from '../../core/ConfigurationSystem';
 import { ShaderManager } from '../../services/ShaderManager';
+import { LightingManager } from '../../services/LightingManager';
 import { WaterSurfaceVisualConfig } from '../../config/gameConfig';
 
 export class WaterSurfaceAsset {
   public mesh!: THREE.Mesh;
   private config: Readonly<WaterSurfaceVisualConfig>;
   private material!: THREE.MeshPhysicalMaterial;
+  private lightingManager: LightingManager | null = null;
+  private directionalLight: THREE.DirectionalLight | null = null;
+  private _tmpLightDir: THREE.Vector3 = new THREE.Vector3();
 
   constructor(_shaderManager: ShaderManager) {
     this.config = configSystem.get('visuals').waterSurface;
     this.createMesh();
   }
 
+  /**
+   * Links the LightingManager to allow lighting-reactive highlights
+   */
+  public linkLightingManager(lightingManager: LightingManager): void {
+    this.lightingManager = lightingManager;
+    this.directionalLight = lightingManager.getDirectionalLight();
+  }
+
   private createMesh(): void {
     const surfaceSize = 200;
     const geometry = new THREE.PlaneGeometry(surfaceSize, surfaceSize, 1, 1);
 
     this.material = new THREE.MeshPhysicalMaterial({
       color: new THREE.Color(this.config.baseColor),
       metalness: 0.1,
       roughness: 0.05,
       transmission: 0.9,
       transparent: true,
       opacity: this.config.opacity,
       side: THREE.BackSide,
       envMapIntensity: 0.7,
       ior: 1.33,
     });
 
     this.material.onBeforeCompile = (shader) => {
       shader.uniforms.uTime = { value: 0 };
       shader.uniforms.uRippleSpeed = { value: this.config.rippleSpeed };
       shader.uniforms.uRippleScale = { value: this.config.rippleScale };
       shader.uniforms.uRippleIntensity = { value: this.config.rippleIntensity };
+      shader.uniforms.uFresnelPower = {
+        value: this.config.fresnelPower ?? 2.0
+      };
+      shader.uniforms.uSpecularColor = {
+        value: new THREE.Color(this.config.specularColor)
+      };
+      shader.uniforms.uLightDirection = { value: new THREE.Vector3(0, -1, 0) };
+      shader.uniforms.uLightIntensity = { value: 1.0 };
 
       // Make sure vUv is available - add it to the vertex shader
-      shader.vertexShader = 
+      shader.vertexShader =
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
+        `uniform float uFresnelPower;\n` +
+        `uniform vec3 uSpecularColor;\n` +
+        `uniform vec3 uLightDirection;\n` +
+        `uniform float uLightIntensity;\n` +
         `varying vec2 vUv;\n` +
         shader.fragmentShader;
 
       shader.fragmentShader = shader.fragmentShader.replace(
         '#include <color_fragment>',
-        `#include <color_fragment>\n  float ripple = sin((vUv.x + uTime * uRippleSpeed) * uRippleScale) *\n                      sin((vUv.y + uTime * uRippleSpeed) * uRippleScale);\n  diffuseColor.rgb += ripple * uRippleIntensity;`
+        `#include <color_fragment>\n  float ripple = sin((vUv.x + uTime * uRippleSpeed) * uRippleScale) *\n                      sin((vUv.y + uTime * uRippleSpeed) * uRippleScale);\n  vec3 lightDir = normalize(uLightDirection);\n  float lightFactor = max(dot(normalize(normal), lightDir), 0.0) * uLightIntensity;\n  float fresnel = pow(1.0 - dot(normalize(normal), normalize(vViewPosition)), uFresnelPower);\n  vec3 fresnelSpec = uSpecularColor * fresnel * lightFactor;\n  diffuseColor.rgb += ripple * uRippleIntensity * lightFactor + fresnelSpec;`
       );
 
       (this.material as any).userData.shader = shader;
     };
 
     this.mesh = new THREE.Mesh(geometry, this.material);
     this.mesh.rotation.x = -Math.PI / 2;
     this.mesh.name = 'WaterSurface';
   }
 
   public update(_delta: number, elapsed: number): void {
     const shader = (this.material as any).userData?.shader;
-    if (shader && shader.uniforms.uTime) {
+    if (!shader) return;
+
+    if (shader.uniforms.uTime) {
       shader.uniforms.uTime.value = elapsed;
     }
+
+    if (this.directionalLight) {
+      this.directionalLight.getWorldDirection(this._tmpLightDir);
+      shader.uniforms.uLightDirection.value.copy(this._tmpLightDir);
+      shader.uniforms.uLightIntensity.value = this.directionalLight.intensity;
+    }
   }
 
   public getMesh(): THREE.Mesh {
     return this.mesh;
   }
 
   public dispose(): void {
     this.mesh.geometry.dispose();
+    this.material.map?.dispose();
+    this.material.normalMap?.dispose();
     this.material.dispose();
   }
 }
 
EOF
)
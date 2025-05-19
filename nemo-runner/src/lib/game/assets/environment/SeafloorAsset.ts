import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';
import { LightingManager } from '../../services/LightingManager';

// Minimal simplex noise implementation (2D) adapted from the
// three.js SimplexNoise class. This keeps the dependency footprint
// small and avoids importing from the examples directory.
class SimplexNoise {
  private perm: Uint8Array;
  private permMod12: Uint8Array;
  private grad3: number[][] = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [0, 1],
    [0, -1]
  ];

  constructor(randomFn: () => number = Math.random) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    // Shuffle using Fisher–Yates algorithm
    for (let i = 255; i > 0; i--) {
      const r = Math.floor(randomFn() * (i + 1));
      const tmp = p[i];
      p[i] = p[r];
      p[r] = tmp;
    }

    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  public noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    let n0 = 0;
    let n1 = 0;
    let n2 = 0;

    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;

    let i1: number, j1: number;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
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
  /** Resolution of generated textures. */
  textureResolution?: number;
  bumpScale?: number;
  roughness?: number;
  metalness?: number;
  pebbleColors?: Array<number | string>;
  pebbleDensity?: number;
  pebbleSizeRange?: [number, number];
}

export class SeafloorAsset {
  /**
   * Cached sand texture shared between instances.
   * Cleared when the last instance is disposed.
   */
  private static cachedSandTexture: THREE.CanvasTexture | null = null;

  /**
   * Cached bump map shared between instances.
   * Cleared when the last instance is disposed.
   */
  private static cachedSandBumpMap: THREE.CanvasTexture | null = null;

  /** Number of active SeafloorAsset instances using the cached textures. */
  private static usageCount = 0;
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
    SeafloorAsset.usageCount++;
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
      textureResolution: 256,
      bumpScale: 0.04,
      roughness: 0.85,
      metalness: 0.0,
      pebbleColors: [0x8e7b65, 0x9c8b76, 0x7b6a55],
      pebbleDensity: 100,
      pebbleSizeRange: [2, 5]
    };
    try {
      const visuals: any = configSystem.get('visuals');
      return { ...defaultConfig, ...(visuals?.seafloor || {}) };
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('SeafloorAsset: Could not fetch config, using defaults', error);
      }
      return defaultConfig;
    }
  }

  /**
   * Generates (or retrieves) the procedural sand texture.
   * The result is cached statically to avoid regenerating it
   * for every asset instance.
   */
  private createSandTexture(): THREE.CanvasTexture {
    if (SeafloorAsset.cachedSandTexture) {
      return SeafloorAsset.cachedSandTexture;
    }
    const canvas = document.createElement('canvas');
    const size = this.config.textureResolution ?? 256;
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

    const pebbleColors = (this.config.pebbleColors || []).map(
      (c) => new THREE.Color(c)
    );
    const pebbleCount = this.config.pebbleDensity ?? 0;
    const [minPebble, maxPebble] = this.config.pebbleSizeRange || [1, 3];

    const drawPebble = (
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      color: THREE.Color
    ): void => {
      ctx.fillStyle = `#${color.getHexString()}`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    for (let i = 0; i < pebbleCount; i++) {
      const radius = THREE.MathUtils.randFloat(minPebble, maxPebble);
      const aspect = THREE.MathUtils.randFloat(0.7, 1.3);
      const rx = radius;
      const ry = radius * aspect;
      const x = Math.random() * size;
      const y = Math.random() * size;
      const basePebbleColor =
        pebbleColors[Math.floor(Math.random() * pebbleColors.length)] ||
        baseColor;
      const brightnessFactor = THREE.MathUtils.randFloat(0.7, 1.3);
      const color = basePebbleColor
        .clone()
        .multiplyScalar(brightnessFactor);
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
    SeafloorAsset.cachedSandTexture = texture;
    return texture;
  }

  /**
   * Generates (or retrieves) the sand bump map used for subtle relief.
   * Cached in a static variable and shared across instances.
   */
  private createSandBumpMap(): THREE.CanvasTexture {
    if (SeafloorAsset.cachedSandBumpMap) {
      return SeafloorAsset.cachedSandBumpMap;
    }
    const canvas = document.createElement('canvas');
    const size = this.config.textureResolution ?? 256;
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

    const pebbleCount = this.config.pebbleDensity ?? 0;
    const [minPebble, maxPebble] = this.config.pebbleSizeRange || [1, 3];
    const drawPebble = (
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      value: number
    ): void => {
      ctx.fillStyle = `rgb(${value},${value},${value})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    for (let i = 0; i < pebbleCount; i++) {
      const radius = THREE.MathUtils.randFloat(minPebble, maxPebble);
      const aspect = THREE.MathUtils.randFloat(0.7, 1.3);
      const rx = radius;
      const ry = radius * aspect;
      const x = Math.random() * size;
      const y = Math.random() * size;
      const baseVal = 220;
      const brightnessFactor = THREE.MathUtils.randFloat(0.8, 1.2);
      const v = Math.floor(
        THREE.MathUtils.clamp(baseVal * brightnessFactor, 0, 255)
      );
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          drawPebble(x + dx * size, y + dy * size, rx, ry, v);
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
    SeafloorAsset.cachedSandBumpMap = texture;
    return texture;
  }

  /**
   * Builds the material using cached textures to avoid redundant generation.
   */
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
    if (process.env.NODE_ENV !== 'production') {
      console.log('SeafloorAsset: Linked with LightingManager for caustic effects');
    }
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
        i,
        positions.getX(i) / this.segmentWidth + 0.5,
        positions.getZ(i) / this.segmentLength + 0.5
      );
    }
    uvs.needsUpdate = true;

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.name = 'SeafloorSegment_Styled';
    mesh.position.y = -1.0;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Disposes material resources. Cached textures are released only when
   * no other SeafloorAsset instances are using them.
   */
  public dispose(): void {
    SeafloorAsset.usageCount = Math.max(SeafloorAsset.usageCount - 1, 0);
    if (SeafloorAsset.usageCount === 0) {
      SeafloorAsset.cachedSandTexture?.dispose();
      SeafloorAsset.cachedSandBumpMap?.dispose();
      SeafloorAsset.cachedSandTexture = null;
      SeafloorAsset.cachedSandBumpMap = null;
    }
    this.material?.dispose();
  }
}
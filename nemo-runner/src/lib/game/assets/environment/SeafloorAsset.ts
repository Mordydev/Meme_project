import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';
import { LightingManager } from '../../services/LightingManager';

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
      bumpScale: 0.02,
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

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const randomFactor = Math.random() * 0.1 - 0.05;
        const varied = baseColor.clone().offsetHSL(0, 0, randomFactor);
        ctx.fillStyle = varied.getStyle();
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const numSplotches = 80;
    for (let i = 0; i < numSplotches; i++) {
      const splotchColor = Math.random() < 0.5 ? color1 : color2;
      ctx.fillStyle = splotchColor
        .clone()
        .offsetHSL(0, 0, Math.random() * 0.2 - 0.1)
        .getStyle();
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * (size / 15) + size / 30;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
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
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgb(128,128,128)';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 3 + 1;
      const intensity = Math.floor(Math.random() * 50) + 100;
      ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
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
      bumpScale: this.config.bumpScale ?? 0.02,
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
    console.log('SeafloorAsset: Linked with LightingManager for caustic effects');
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
   * Disposes material resources to prevent memory leaks
   */
  public dispose(): void {
    this.sandTexture?.dispose();
    this.sandBumpMap?.dispose();
    this.material?.dispose();
  }
}
import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';
import { LightingManager } from '../../services/LightingManager';
import NoiseGLSL from '../../shaders/common/noise.glsl';
import CausticsGLSL from '../../shaders/common/caustics.glsl';
import { SeafloorVisualConfig } from '../../config/gameConfig';

export class SeafloorAsset {
  private shaderManager: ShaderManager;
  private lightingManager: LightingManager;
  public segmentWidth: number;
  public segmentLength: number;
  private config: Readonly<SeafloorVisualConfig>;
  
  private material!: THREE.MeshStandardMaterial;
  private sandTexture!: THREE.CanvasTexture;
  private sandBumpMap!: THREE.CanvasTexture;

  constructor(shaderManager: ShaderManager, lightingManager: LightingManager) {
    this.shaderManager = shaderManager;
    this.lightingManager = lightingManager;
    this.config = configSystem.get('visuals').seafloor;
    
    const worldConfig = configSystem.get('world');
    const playerConfig = configSystem.get('player');
    this.segmentWidth = (worldConfig.xBoundary || 5) * 2 + (playerConfig.laneWidth || 2) * (worldConfig.laneCount || 3);
    this.segmentLength = 20;

    this._createMaterial();
  }

  private _createSandTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D context for sand texture");
        canvas.width = 1; canvas.height = 1;
        const fallbackCtx = canvas.getContext('2d')!;
        fallbackCtx.fillStyle = new THREE.Color(this.config.baseColor).getStyle();
        fallbackCtx.fillRect(0,0,1,1);
        const fallbackTexture = new THREE.CanvasTexture(canvas);
        fallbackTexture.needsUpdate = true;
        return fallbackTexture;
    }

    const baseColor = new THREE.Color(this.config.baseColor);
    const color1 = new THREE.Color(this.config.sandPatternColor1);
    const color2 = new THREE.Color(this.config.sandPatternColor2);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const randomFactor = Math.random() * 0.1 - 0.05;
            const variedBase = baseColor.clone().offsetHSL(0, 0, randomFactor);
            ctx.fillStyle = variedBase.getStyle();
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    const numSplotches = 80;
    for (let i = 0; i < numSplotches; i++) {
        const splotchColor = Math.random() < 0.5 ? color1 : color2;
        ctx.fillStyle = splotchColor.clone().offsetHSL(0,0, Math.random() * 0.2 - 0.1).getStyle();
        const xPos = Math.random() * size;
        const yPos = Math.random() * size;
        const splotchRadius = Math.random() * (size / 15) + (size / 30);
        ctx.beginPath();
        ctx.arc(xPos, yPos, splotchRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(this.config.textureScale, this.config.textureScale * (this.segmentLength / this.segmentWidth));
    texture.needsUpdate = true;
    return texture;
  }

  private _createSandBumpMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
     if (!ctx) {
        console.error("Failed to get 2D context for sand bump map");
        canvas.width = 1; canvas.height = 1;
        const fallbackCtx = canvas.getContext('2d')!;
        fallbackCtx.fillStyle = 'rgb(128,128,128)';
        fallbackCtx.fillRect(0,0,1,1);
        const fallbackTexture = new THREE.CanvasTexture(canvas);
        fallbackTexture.needsUpdate = true;
        return fallbackTexture;
    }
    ctx.fillStyle = 'rgb(128, 128, 128)';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 2000; i++) {
        const xPos = Math.random() * size;
        const yPos = Math.random() * size;
        const radius = Math.random() * 3 + 1;
        const intensity = Math.floor(Math.random() * 50) + 100;
        ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
        ctx.beginPath();
        ctx.arc(xPos, yPos, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    if (this.sandTexture) {
      texture.repeat.copy(this.sandTexture.repeat);
    }
    texture.needsUpdate = true;
    return texture;
  }
  
  private _createMaterial(): void {
    this.sandTexture = this._createSandTexture();
    this.sandBumpMap = this._createSandBumpMap();

    this.material = new THREE.MeshStandardMaterial({
      map: this.sandTexture,
      bumpMap: this.sandBumpMap,
      bumpScale: this.config.bumpScale !== undefined ? this.config.bumpScale : 0.015,
      color: 0xffffff,
      roughness: this.config.roughness !== undefined ? this.config.roughness : 0.8,
      metalness: this.config.metalness !== undefined ? this.config.metalness : 0.05,
      side: THREE.FrontSide,
    });

    const lightingSpecificConfig = configSystem.get('lighting');
    if (lightingSpecificConfig.enableCaustics) {
        this.material.onBeforeCompile = (shader) => {
            // Uniforms for caustics, linked to LightingManager and config
            shader.uniforms.uCausticColor = { value: new THREE.Color(lightingSpecificConfig.causticColor) };
            shader.uniforms.uCausticIntensity = { value: lightingSpecificConfig.causticIntensity };
            shader.uniforms.uCausticScale = { value: lightingSpecificConfig.causticScale };
            shader.uniforms.uCausticSpeed = { value: lightingSpecificConfig.causticSpeed }; // uCausticSpeed is used by getCausticGLSLChunk
            shader.uniforms.uTime = this.lightingManager.globalCausticTimeUniform;

            // Vertex shader modifications
            shader.vertexShader = 'varying vec3 vWorldPosition_Seafloor;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>
                vec3 worldPosSeafloor = (modelMatrix * vec4(transformed, 1.0)).xyz;
                vWorldPosition_Seafloor = worldPosSeafloor;`
            );
            
            // Fragment shader modifications
            const uniformDeclarations = `
                uniform float uTime;
                uniform float uCausticScale;
                uniform float uCausticIntensity;
                uniform vec3 uCausticColor;
                uniform float uCausticSpeed;
                varying vec3 vWorldPosition_Seafloor;
            `;

            shader.fragmentShader = uniformDeclarations + '\n' +
                                    NoiseGLSL.random2D + '\n' +
                                    NoiseGLSL.noise2D + '\n' +
                                    CausticsGLSL.causticPattern + '\n' +
                                    shader.fragmentShader;
            
            // Remove existing varying declaration if present to avoid duplication, as we add it with other uniforms
            // shader.fragmentShader = shader.fragmentShader.replace('varying vec3 vWorldPosition_Seafloor;\n', ''); // REMOVED: This line is problematic


            const blendMode = lightingSpecificConfig.causticBlendMode || 'additive';
            let blendLogic = 'diffuse + caustic';
            if (blendMode === 'multiply') {
                blendLogic = 'diffuse * vec3(1.0 + caustic.r - 0.5, 1.0 + caustic.g - 0.5, 1.0 + caustic.b - 0.5)';
            } else if (blendMode === 'mix') {
                blendLogic = `mix(diffuse, uCausticColor.rgb, clamp(caustic.r * uCausticIntensity * 5.0, 0.0, 1.0))`;
            }

            const diffuseReplacement = `
                vec3 caustic = getCausticColor(vWorldPosition_Seafloor, uTime, uCausticScale, uCausticIntensity, uCausticColor.rgb);
                vec3 mixedDiffuse = ${blendLogic};
                vec4 diffuseColor = vec4(mixedDiffuse, opacity);
            `;

            shader.fragmentShader = shader.fragmentShader.replace(
                /vec4 diffuseColor = vec4\( diffuse, opacity \);/,
                diffuseReplacement
            );
        };
    }
  }

  public createMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.segmentWidth, this.segmentLength, 20, 20);
    geometry.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.name = "SeafloorSegment_Styled";
    mesh.position.y = -1.0;
    mesh.receiveShadow = configSystem.get('lighting').directionalLight.castShadow || false;
    return mesh;
  }
  
  public dispose(): void {
    this.sandTexture?.dispose();
    this.sandBumpMap?.dispose();
    this.material?.dispose();
  }
} 
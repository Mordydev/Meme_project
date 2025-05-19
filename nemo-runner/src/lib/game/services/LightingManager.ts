// src/lib/game/services/LightingManager.ts
import * as THREE from 'three';
import { configSystem } from '../core/ConfigurationSystem';
import { ShaderManager } from './ShaderManager';
import CausticsGLSL from '../shaders/common/caustics.glsl';
import NoiseGLSL from '../shaders/common/noise.glsl';
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

  public globalCausticTimeUniform: THREE.IUniform<number>;
  
  // For animating caustics
  private elapsedTime: number = 0;
  
  constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
    this.scene = scene;
    this.shaderManager = shaderManager;
    const lighting = configSystem.getLightingConfig();
    this.useCaustics = lighting.enableCaustics;
    this.globalCausticTimeUniform = this.shaderManager.globalUniforms.uTime;
    
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
    const lighting = configSystem.getLightingConfig();
    const { color, intensity } = lighting.ambientLight;
    
    const light = new THREE.AmbientLight(
      color,
      intensity
    );
    
    this.scene.add(light);
    return light;
  }
  
  /**
   * Creates and adds the directional light to the scene based on config
   */
  private createDirectionalLight(): THREE.DirectionalLight {
    const lighting = configSystem.getLightingConfig();
    const {
      color,
      intensity,
      position,
      castShadow
    } = lighting.directionalLight;
    
    const light = new THREE.DirectionalLight(
      color,
      intensity
    );

    light.position.set(
      position.x,
      position.y,
      position.z
    );

    // Enable shadows if configured
    light.castShadow = castShadow ?? false;
    
    this.scene.add(light);
    return light;
  }
  
  /**
   * Sets up the scene fog using the configured parameters
   */
  private setupFog(): void {
    const lighting = configSystem.getLightingConfig();
    if (lighting.fogDensity !== undefined) {
      this.scene.fog = new THREE.FogExp2(lighting.fogColor, lighting.fogDensity);
    } else {
      const fogNear = lighting.fogNear ?? 20;
      const fogFar = lighting.fogFar ?? 40;
      this.scene.fog = new THREE.Fog(lighting.fogColor, fogNear, fogFar);
    }

    this.scene.background = new THREE.Color(lighting.fogColor);
  }
  
  /**
   * Registers caustic shader chunks for use in shaders
   */
  private registerCausticChunks(): void {
    // Ensure noise dependencies are registered
    this.shaderManager.registerChunk('random2D', NoiseGLSL.random2D);
    this.shaderManager.registerChunk('noise2D', NoiseGLSL.noise2D);

    // Register caustic pattern chunk - use causticEffect instead of non-existent causticPattern
    this.shaderManager.registerChunk('causticPattern', CausticsGLSL.causticEffect);

    // Mirror in THREE.ShaderChunk for compatibility
    THREE.ShaderChunk['random2D'] = NoiseGLSL.random2D;
    THREE.ShaderChunk['noise2D'] = NoiseGLSL.noise2D;
    THREE.ShaderChunk['causticPattern'] = CausticsGLSL.causticEffect;

    console.log('LightingManager: Registered caustic and noise shader chunks.');
  }
  
  /**
   * Registers the seafloor shader with caustic effects
   */
  private registerSeafloorShader(): void {
    const lighting = configSystem.getLightingConfig();
    
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
        uCausticColor: { value: new THREE.Color(lighting.causticColor) },
        uCausticIntensity: { value: lighting.causticIntensity },
        uCausticScale: { value: lighting.causticScale },
        uCausticSpeed: { value: lighting.causticSpeed }
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
      const lighting = configSystem.getLightingConfig();
      
      // Create a MeshPhongMaterial with underwater-like appearance
      const material = new THREE.MeshPhongMaterial({
        color: 0x99bbcc,                     // Base seafloor color
        specular: 0x6688ff,                  // Slight blue specular highlights
        shininess: 30,                       // Moderate shininess
        emissive: new THREE.Color(lighting.causticColor).multiplyScalar(0.2), // Subtle caustic-like glow
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

    // We're no longer updating complex caustic targets since we're using simpler materials
    // This helps prevent the WebGL context loss issues
  }

  /**
   * Update caustic uniforms on tracked meshes
   */
  private updateCausticUniforms(lighting: ReturnType<typeof configSystem.getLightingConfig>): void {
    for (const mesh of this.causticTargets) {
      const mat: any = mesh.material;
      const uniforms = mat?.uniforms;
      if (!uniforms) continue;
      if (uniforms.uCausticColor) {
        uniforms.uCausticColor.value.set(lighting.causticColor);
      }
      if (uniforms.uCausticIntensity) {
        uniforms.uCausticIntensity.value = lighting.causticIntensity;
      }
      if (uniforms.uCausticScale) {
        uniforms.uCausticScale.value = lighting.causticScale;
      }
    }
  }
  
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
    
    // Update ambient light
    this.ambientLight.color.set(lighting.ambientLight.color);
    this.ambientLight.intensity = lighting.ambientLight.intensity;
    
    // Update directional light
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
    if (this.useCaustics) {
      this.updateCausticUniforms(lighting);
    }
  }
  
  /**
   * Returns the current fog color from config
   */
  public getFogColor(): number {
    return configSystem.getLightingConfig().fogColor;
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
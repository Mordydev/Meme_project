// src/lib/game/services/LightingManager.ts
import * as THREE from 'three';
import { configSystem } from '../core/ConfigurationSystem';
import { ShaderManager } from './ShaderManager';
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
    const visuals = configSystem.get('visuals');
    this.useCaustics = visuals.enableCaustics;
    
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
      ambientLightColor,
      ambientLightIntensity
    );
    
    this.scene.add(light);
    return light;
  }
  
  /**
   * Creates and adds the directional light to the scene based on config
   */
  private createDirectionalLight(): THREE.DirectionalLight {
    const visuals = configSystem.get('visuals');
    const { 
      directionalLightColor, 
      directionalLightIntensity,
      directionalLightPosition
    } = visuals;
    
    const light = new THREE.DirectionalLight(
      directionalLightColor,
      directionalLightIntensity
    );
    
    light.position.set(
      directionalLightPosition.x,
      directionalLightPosition.y,
      directionalLightPosition.z
    );
    
    // Enable shadows for directional light (optional, can be configured)
    light.castShadow = false; // Default off for performance, can be enabled later
    
    this.scene.add(light);
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
    const visuals = configSystem.get('visuals');
    
    // Register the seafloor shader with the shader manager
    this.shaderManager.registerShader({
      name: 'seafloorShader',
      vertexShaderSource: seafloorVertexShader,
      fragmentShaderSource: seafloorFragmentShader,
      defaultUniforms: () => ({
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

      // Create a material with the seafloor shader if caustics are enabled
      let material: THREE.Material | null = null;

      if (this.useCaustics) {
        // Try to create the shader material
        try {
          material = this.shaderManager.createShaderMaterial('seafloorShader');
        } catch (error) {
          console.warn("LightingManager: Error creating seafloor shader material, falling back to standard material", error);
        }
      }

      // If shader material creation failed or caustics disabled, use fallback
      if (!material) {
        console.log("LightingManager: Using fallback material for seafloor");
        material = new THREE.MeshStandardMaterial({
          color: 0x99bbcc,
          roughness: 0.8,
          metalness: 0.2
        });
      }

      // Create and return the mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = "SeafloorSegment";

      // Only track in causticTargets if it's actually using the caustic shader
      if (material instanceof THREE.ShaderMaterial) {
        this.causticTargets.push(mesh);
      }

      return mesh;
    } catch (error) {
      console.error("LightingManager: Failed to create seafloor mesh", error);

      // Ultimate fallback - simple plane with basic material
      const geometry = new THREE.PlaneGeometry(width, length, 4, 4);
      geometry.rotateX(-Math.PI / 2);
      const material = new THREE.MeshBasicMaterial({ color: 0x6688aa });
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
    
    // Update caustic targets if they exist (animations, etc.)
    // Most of this is handled by the ShaderManager's global uniforms (uTime)
    
    // Any specific per-target updates can go here
    // for example, if we want to change parameters based on depth, etc.
    
    // Future expansion: dynamic time-of-day changes to lighting
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
    
    // If we have caustic targets with materials that need updates
    // We can update their uniform values here
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
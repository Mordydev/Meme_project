// src/lib/game/services/LightingManager.ts
import * as THREE from 'three';
import { configSystem } from '../core/ConfigurationSystem';
import { ShaderManager } from './ShaderManager';
import { LightingConfig } from '../config/gameConfig'; // Import the new LightingConfig
import NoiseGLSL from '../shaders/common/noise.glsl'; // Assumed to exist and export .random2D, .noise2D
import CausticsGLSL from '../shaders/common/caustics.glsl'; // Provides GLSL for getCausticColor
// import UtilsGLSL from '../shaders/common/utils.glsl'; // Placeholder if used for PI, saturate

/**
 * Manages the scene's lighting, fog, and provides mechanisms for caustics and god rays.
 */
export class LightingManager {
  private scene: THREE.Scene;
  private shaderManager: ShaderManager;
  private lightingConfig: Readonly<LightingConfig>; // Use the new dedicated LightingConfig

  // Lights
  public ambientLight!: THREE.AmbientLight; // Made public for potential external access
  public directionalLight!: THREE.DirectionalLight; // Made public

  // Caustics time uniform, linked to global time
  public globalCausticTimeUniform: THREE.IUniform<number>;

  constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
    this.scene = scene;
    this.shaderManager = shaderManager;
    this.lightingConfig = configSystem.get('lighting'); // Get dedicated lighting config

    // Link to ShaderManager's global uTime for caustics
    this.globalCausticTimeUniform = this.shaderManager.globalUniforms.uTime;

    this.initializeLights();
    this.initializeFog();
    this.registerShaderChunks(); // Consolidated registration

    console.log("LightingManager: Initialized. Config for caustics/god rays ready.");
  }

  /**
   * Creates and adds the ambient light to the scene based on config
   */
  private initializeLights(): void {
    // Ambient Light
    const ambientCfg = this.lightingConfig.ambientLight;
    this.ambientLight = new THREE.AmbientLight(
      new THREE.Color(ambientCfg.color),
      ambientCfg.intensity
    );
    this.scene.add(this.ambientLight);

    // Directional Light
    const directionalCfg = this.lightingConfig.directionalLight;
    this.directionalLight = new THREE.DirectionalLight(
      new THREE.Color(directionalCfg.color),
      directionalCfg.intensity
    );
    this.directionalLight.position.set(
      directionalCfg.position.x,
      directionalCfg.position.y,
      directionalCfg.position.z
    );
    this.directionalLight.castShadow = directionalCfg.castShadow || false;
    if (directionalCfg.castShadow && directionalCfg.shadowMapSize) {
      this.directionalLight.shadow.mapSize.width = directionalCfg.shadowMapSize;
      this.directionalLight.shadow.mapSize.height = directionalCfg.shadowMapSize;
      // Other shadow properties can be set here if needed
    }
    this.scene.add(this.directionalLight);
    
    // If a light helper is desired for debugging:
    // const helper = new THREE.DirectionalLightHelper(this.directionalLight, 5);
    // this.scene.add(helper);
  }

  /**
   * Sets up the scene fog using the configured parameters from LightingConfig
   */
  private initializeFog(): void {
    const fogColor = new THREE.Color(this.lightingConfig.fogColor);
    if (this.lightingConfig.fogDensity !== undefined) {
      this.scene.fog = new THREE.FogExp2(fogColor, this.lightingConfig.fogDensity);
    } else if (this.lightingConfig.fogNear !== undefined && this.lightingConfig.fogFar !== undefined) {
      this.scene.fog = new THREE.Fog(fogColor, this.lightingConfig.fogNear, this.lightingConfig.fogFar);
    }
    
    // Set the scene background to match the fog color for seamless blending
    // This might be handled by RenderManager or elsewhere, ensure consistency
    if (this.scene.fog) { // Only set background if fog is active
        this.scene.background = fogColor;
    }
  }

  /**
   * Registers common shader chunks required for environmental effects.
   */
  private registerShaderChunks(): void {
    // Ensure common noise functions are available for caustics (and potentially other effects)
    // if (NoiseGLSL && (NoiseGLSL as any).random2D) {
    //     this.shaderManager.registerChunk("random2D", (NoiseGLSL as any).random2D);
    // } else {
    //     console.warn("LightingManager: NoiseGLSL.random2D not found or NoiseGLSL not imported correctly.");
    // }
    // if (NoiseGLSL && (NoiseGLSL as any).noise2D) {
    //     this.shaderManager.registerChunk("noise2D", (NoiseGLSL as any).noise2D);
    // } else {
    //     console.warn("LightingManager: NoiseGLSL.noise2D not found or NoiseGLSL not imported correctly.");
    // }

    // Register caustic pattern shader chunk
    if (CausticsGLSL && (CausticsGLSL as any).getCausticColor) {
        this.shaderManager.registerChunk("getCausticColor", (CausticsGLSL as any).getCausticColor);
    } else {
        console.warn("LightingManager: CausticsGLSL.getCausticColor not found or CausticsGLSL not imported correctly.");
    }

    // Example: Registering utility chunks if UtilsGLSL was imported and structured similarly
    // if (UtilsGLSL && (UtilsGLSL as any).PI) {
    //   this.shaderManager.registerChunk("PI", (UtilsGLSL as any).PI);
    //   (THREE.ShaderChunk as any)['PI'] = (UtilsGLSL as any).PI;
    // }
    // if (UtilsGLSL && (UtilsGLSL as any).saturate) {
    //   this.shaderManager.registerChunk("saturate", (UtilsGLSL as any).saturate);
    //   (THREE.ShaderChunk as any)['saturate'] = (UtilsGLSL as any).saturate;
    // }
    console.log("LightingManager: Registered common shader chunks (caustics only).");
  }

  /**
   * Provides the GLSL code chunk for caustics, including dependencies.
   * This is intended for use with material.onBeforeCompile.
   */
  public getCausticGLSLChunk(): string {
    let glsl = "";
    if (NoiseGLSL && (NoiseGLSL as unknown as { random2D?: string }).random2D) glsl += (NoiseGLSL as unknown as { random2D: string }).random2D + '\n';
    else console.warn("getCausticGLSLChunk: NoiseGLSL.random2D is missing.");
    
    if (NoiseGLSL && (NoiseGLSL as unknown as { noise2D?: string }).noise2D) glsl += (NoiseGLSL as unknown as { noise2D: string }).noise2D + '\n';
    else console.warn("getCausticGLSLChunk: NoiseGLSL.noise2D is missing.");

    if (CausticsGLSL && (CausticsGLSL as unknown as { getCausticColor?: string }).getCausticColor) glsl += (CausticsGLSL as unknown as { getCausticColor: string }).getCausticColor + '\n';
    else console.warn("getCausticGLSLChunk: CausticsGLSL.getCausticColor is missing.");
    
    if (!glsl.trim()) console.error("LightingManager: Caustic GLSL chunk is empty! Ensure shaders (.glsl files) are imported correctly and contain the expected named exports (e.g., random2D, noise2D, getCausticColor).");
    return glsl;
  }
  
  /**
   * Returns the main directional light source.
   * Useful for effects like god rays that need light position.
   */
  public getDirectionalLight(): THREE.DirectionalLight {
    return this.directionalLight;
  }

  /**
   * Updates lighting, primarily for dynamic effects or config changes.
   * uTime for caustics is handled globally via ShaderManager.
   * @param deltaTime Time since last frame in seconds
   * @param elapsedTime Total game time in seconds
   */
  public update(/* deltaTime: number, elapsedTime: number */): void {
    // ShaderManager.update() handles global uniforms like uTime.
    // Specific updates for lighting effects could go here if needed,
    // e.g., animating light properties or god ray parameters dynamically.
    // For now, most lighting is static or driven by onBeforeCompile using global uTime.
  }

  /**
   * Updates the lighting and fog configuration based on current game settings.
   * Call this if lighting/fog parameters in gameConfig are changed dynamically during gameplay.
   */
  public updateConfig(): void {
    this.lightingConfig = configSystem.get('lighting'); // Re-fetch the latest config

    // Update ambient light
    this.ambientLight.color.set(this.lightingConfig.ambientLight.color);
    this.ambientLight.intensity = this.lightingConfig.ambientLight.intensity;

    // Update directional light
    this.directionalLight.color.set(this.lightingConfig.directionalLight.color);
    this.directionalLight.intensity = this.lightingConfig.directionalLight.intensity;
    this.directionalLight.position.set(
      this.lightingConfig.directionalLight.position.x,
      this.lightingConfig.directionalLight.position.y,
      this.lightingConfig.directionalLight.position.z
    );
    this.directionalLight.castShadow = this.lightingConfig.directionalLight.castShadow || false;
    if (this.directionalLight.castShadow && this.lightingConfig.directionalLight.shadowMapSize) {
        this.directionalLight.shadow.mapSize.width = this.lightingConfig.directionalLight.shadowMapSize;
        this.directionalLight.shadow.mapSize.height = this.lightingConfig.directionalLight.shadowMapSize;
    }


    // Update fog
    const fogColor = new THREE.Color(this.lightingConfig.fogColor);
    if (this.scene.fog) {
        if (this.scene.fog instanceof THREE.FogExp2) {
            this.scene.fog.color.set(fogColor); // Use .set() for color update
            if (this.lightingConfig.fogDensity !== undefined) {
                this.scene.fog.density = this.lightingConfig.fogDensity;
            }
        } else if (this.scene.fog instanceof THREE.Fog) {
            this.scene.fog.color.set(fogColor); // Use .set() for color update
            if (this.lightingConfig.fogNear !== undefined) {
                this.scene.fog.near = this.lightingConfig.fogNear;
            }
            if (this.lightingConfig.fogFar !== undefined) {
                this.scene.fog.far = this.lightingConfig.fogFar;
            }
        }
        if (this.scene.background instanceof THREE.Color) {
             this.scene.background.set(fogColor); // Use .set() for color update
        } else {
             this.scene.background = fogColor;
        }
    } else { // If fog was disabled and now enabled, or type changed
        this.initializeFog();
    }

    console.log("LightingManager: Configuration updated.");
  }

  /**
   * Disposes of lighting resources.
   */
  public dispose(): void {
    // Lights are typically managed by the scene and don't need explicit disposal
    // unless they have complex resources like shadow maps that might need cleanup,
    // but Three.js usually handles this when the scene is disposed.
    if (this.scene.fog) {
      // this.scene.fog = null; // Or dispose if it has a dispose method
    }
    console.log("LightingManager: Disposed.");
  }
}
import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CameraManager } from '../core/CameraManager';
import { configSystem } from '../core/ConfigurationSystem';
import { ShaderManager } from './ShaderManager';
import { RenderManager } from '../core/RenderManager';
import { BubbleParticleSystem } from '../vfx/particleSystems/BubbleParticleSystem';
import { DustParticleSystem } from '../vfx/particleSystems/DustParticleSystem';
import { underwaterPPFragmentShader } from '../shaders/postprocessing/underwaterPP.frag';
import { godRaysFragmentShader } from '../shaders/postprocessing/godRaysPP.frag';
import { LightingManager } from './LightingManager';

/**
 * Enhanced service for managing all visual effects including particles, post-processing,
 * screen shake, flashes, etc.
 */
export class VisualEffectsService {
  private scene?: THREE.Scene;
  private cameraManager?: CameraManager;
  private shaderManager?: ShaderManager;
  private renderManager?: RenderManager;
  private gameEngine?: unknown; // Reference to game engine if needed
  
  // For screen flash effect (callback to GameCanvas)
  private onScreenFlash?: (color: string, duration: number) => void;
  
  // For camera shake
  private isShaking: boolean = false;
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  private originalCameraPosition: THREE.Vector3 = new THREE.Vector3();
  private cameraShakeOffset: THREE.Vector3 = new THREE.Vector3();

  // Particle Systems
  private bubbleSystem?: BubbleParticleSystem;
  private dustSystem?: DustParticleSystem;
  
  // Post-processing
  private postProcessingPass?: ShaderPass;
  private ppPassName = 'underwaterPostProcessing';
  private godRaysPass?: ShaderPass;
  private godRaysPassName = 'godRays';

  private lightingManager?: LightingManager;

  constructor() {
    console.log("VisualEffectsService: Initialized base service");
  }

  /**
   * Initialize particle systems and post-processing effects
   * @param scene The scene where particles will be added
   * @param shaderManager The shader manager for creating materials
   * @param renderManager The render manager for post-processing
   * @param lightingManager The lighting manager for god rays
   */
  public initializeParticlesAndPostProcessing(
    scene: THREE.Scene, 
    shaderManager: ShaderManager, 
    renderManager: RenderManager,
    lightingManager?: LightingManager
  ): void {
    this.scene = scene;
    this.shaderManager = shaderManager;
    this.renderManager = renderManager;
    this.lightingManager = lightingManager;
    
    const config = configSystem.get('visuals');

    // Initialize Particle Systems
    if (config.enableParticles) {
      if (config.bubblesEnabled) {
        this.bubbleSystem = new BubbleParticleSystem(scene, shaderManager, config.bubbleCount);
      }
      if (config.dustEnabled) {
        this.dustSystem = new DustParticleSystem(scene, shaderManager, config.dustCount);
      }
    }

    // Initialize Screen Effects (Post-Processing)
    if (config.enableScreenEffects) {
      this.setupPostProcessingPass();
    }
    
    const lightingCfg = configSystem.get('lighting');
    if (lightingCfg.enableGodRays) {
      this.setupGodRaysPass();
    }
    
    console.log('VisualEffectsService: Initialized particles and post-processing effects');
  }

  /**
   * Set up the post-processing shader pass
   */
  private setupPostProcessingPass(): void {
    if (!this.renderManager || !this.renderManager.getRenderer) return;
    
    const config = configSystem.get('visuals');

    // Create a single shader pass using the combined shader
    const ppShader = {
      uniforms: {
        'tDiffuse': { value: null }, // Provided by EffectComposer
        'uResolution': { value: new THREE.Vector2(
          this.renderManager.getRenderer().domElement.width,
          this.renderManager.getRenderer().domElement.height
        ) },
        'uTime': { value: 0.0 }, // Will be updated each frame

        // Vignette Uniforms
        'uVignetteEnabled': { value: config.vignetteEnabled },
        'uVignetteIntensity': { value: config.vignetteIntensity },
        'uVignetteSmoothness': { value: config.vignetteSmoothness },

        // Color Grading Uniforms
        'uColorGradingEnabled': { value: config.colorGradingEnabled },
        'uColorGradeIntensity': { value: config.colorGradeIntensity },
        'uColorGradeTargetColor': { value: new THREE.Color(config.colorGradeTargetColor) },

        // Distortion Uniforms
        'uDistortionEnabled': { value: config.distortionEnabled },
        'uDistortionIntensity': { value: config.distortionIntensity },
        'uDistortionSpeed': { value: config.distortionSpeed },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: underwaterPPFragmentShader,
    };

    this.postProcessingPass = new ShaderPass(ppShader);
    this.renderManager.addPostProcessingPass(this.ppPassName, this.postProcessingPass);
  }

  /**
   * Set up the god rays post-processing pass
   */
  private setupGodRaysPass(): void {
    if (!this.renderManager || !this.lightingManager) return;

    const lightingCfg = configSystem.get('lighting');

    const godRaysShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'lightPosition': { value: new THREE.Vector2(0.5, 0.5) },
        'godRayColor': { value: new THREE.Color(lightingCfg.godRayColor || 0xffffff) },
        'density': { value: lightingCfg.godRayDensity ?? 0.96 },
        'weight': { value: lightingCfg.godRayWeight ?? 0.4 },
        'decay': { value: lightingCfg.godRayDecay ?? 0.93 },
        'exposure': { value: lightingCfg.godRayExposure ?? 0.6 },
        'samples': { value: lightingCfg.godRaySamples ?? 60 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: godRaysFragmentShader,
    };

    this.godRaysPass = new ShaderPass(godRaysShader);
    this.renderManager.addPostProcessingPass(this.godRaysPassName, this.godRaysPass);
  }

  /**
   * Link the camera manager for camera effects
   * @param cameraManager The camera manager instance
   */
  public linkCameraManager(cameraManager: CameraManager): void {
    this.cameraManager = cameraManager;
  }
  
  /**
   * Link the game engine for any other dependencies
   * @param gameEngine The game engine instance
   */
  public linkGameEngine(gameEngine: unknown): void {
    this.gameEngine = gameEngine;
  }

  /**
   * Set the callback function for screen flash effect
   * @param callback Function that will handle the screen flash in the UI
   */
  public setFlashCallback(callback: (color: string, duration: number) => void): void {
    this.onScreenFlash = callback;
  }

  /**
   * Trigger hit effect with different intensities
   * @param intensity Intensity level of the hit effect ('minor' or 'major')
   */
  public triggerHitEffect(intensity: 'minor' | 'major' = 'minor'): void {
    console.log("VisualEffectsService: Triggering hit effect -", intensity);
    
    // Screen flash effect via callback to GameCanvas
    if (this.onScreenFlash) {
      // Minor: Light red, 150ms
      // Major: Stronger red, 300ms
      this.onScreenFlash(
        intensity === 'minor' ? 'rgba(255,0,0,0.3)' : 'rgba(255,0,0,0.5)', 
        intensity === 'minor' ? 150 : 300
      );
    }

    // Camera shake effect
    if (this.cameraManager) {
      // Store original camera position only if not already shaking
      if (!this.isShaking) {
        this.originalCameraPosition.copy(this.cameraManager.camera.position);
      }
      
      this.isShaking = true;
      this.shakeDuration = intensity === 'minor' ? 0.2 : 0.4; // seconds
      this.shakeIntensity = intensity === 'minor' ? 0.08 : 0.15; // units
    }
  }

  /**
   * Update all visual effects each frame
   * @param deltaTime Time in seconds since last frame
   * @param globalTime Global elapsed time for animations
   * @param playerPosition Optional player position for particle spawning
   */
  public update(deltaTime: number, globalTime: number = 0, playerPosition?: THREE.Vector3): void {
    const config = configSystem.get('visuals');
    
    // Update camera shake effect
    if (this.isShaking && this.cameraManager) {
      this.shakeDuration -= deltaTime;
      
      if (this.shakeDuration <= 0) {
        // End shake
        this.isShaking = false;
        this.cameraShakeOffset.set(0, 0, 0);
        
        // Tell camera manager to clear the shake offset
        if (this.cameraManager.clearShakeOffset) {
          this.cameraManager.clearShakeOffset();
        } else {
          // Fallback if clearShakeOffset isn't implemented: restore original position
          this.cameraManager.camera.position.copy(this.originalCameraPosition);
        }
      } else {
        // Apply random shake offset
        const shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
        const shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
        
        this.cameraShakeOffset.set(shakeOffsetX, shakeOffsetY, 0);
        
        // Apply shake offset through camera manager if it supports it
        if (this.cameraManager.applyShakeOffset) {
          this.cameraManager.applyShakeOffset(this.cameraShakeOffset);
        } else {
          // Fallback if not implemented: directly modify camera position
          this.cameraManager.camera.position.x = this.originalCameraPosition.x + shakeOffsetX;
          this.cameraManager.camera.position.y = this.originalCameraPosition.y + shakeOffsetY;
        }
      }
    }

    // Update Particle Systems
    if (config.enableParticles) {
      if (this.bubbleSystem) {
        this.bubbleSystem.update(deltaTime, playerPosition);
      }
      if (this.dustSystem) {
        this.dustSystem.update(deltaTime, playerPosition);
      }
    } else {
      // Hide particles if disabled globally
      if (this.bubbleSystem?.points.visible) this.bubbleSystem.points.visible = false;
      if (this.dustSystem?.points.visible) this.dustSystem.points.visible = false;
    }

    // Update Post-Processing Uniforms based on config
    if (this.postProcessingPass && this.renderManager) {
      const passEnabled = config.enableScreenEffects && 
        (config.vignetteEnabled || config.colorGradingEnabled || config.distortionEnabled);
      this.postProcessingPass.enabled = passEnabled;

      if (passEnabled) {
        // Update time for animations
        this.postProcessingPass.uniforms['uTime'].value = globalTime;
        
        // Update resolution on resize
        this.postProcessingPass.uniforms['uResolution'].value.set(
          this.renderManager.getRenderer().domElement.width,
          this.renderManager.getRenderer().domElement.height
        );

        // Update individual effect uniforms
        this.postProcessingPass.uniforms['uVignetteEnabled'].value = config.vignetteEnabled;
        this.postProcessingPass.uniforms['uVignetteIntensity'].value = config.vignetteIntensity;
        this.postProcessingPass.uniforms['uVignetteSmoothness'].value = config.vignetteSmoothness;

        this.postProcessingPass.uniforms['uColorGradingEnabled'].value = config.colorGradingEnabled;
        this.postProcessingPass.uniforms['uColorGradeIntensity'].value = config.colorGradeIntensity;
        this.postProcessingPass.uniforms['uColorGradeTargetColor'].value.set(config.colorGradeTargetColor);

        this.postProcessingPass.uniforms['uDistortionEnabled'].value = config.distortionEnabled;
        this.postProcessingPass.uniforms['uDistortionIntensity'].value = config.distortionIntensity;
        this.postProcessingPass.uniforms['uDistortionSpeed'].value = config.distortionSpeed;
      }
    } else if (config.enableScreenEffects && this.renderManager) {
      // If pass wasn't created initially but is now enabled, create it
      this.setupPostProcessingPass();
    }

    // Update God Rays pass
    if (this.godRaysPass && this.renderManager && this.lightingManager && this.cameraManager) {
      const lConfig = configSystem.get('lighting');
      this.godRaysPass.enabled = lConfig.enableGodRays;
      if (lConfig.enableGodRays) {
        const light = this.lightingManager.getDirectionalLight();
        const screenPos = light.position.clone();
        screenPos.project(this.cameraManager.camera);
        this.godRaysPass.uniforms['lightPosition'].value.set(
          0.5 + screenPos.x * 0.5,
          0.5 + screenPos.y * 0.5
        );
        this.godRaysPass.uniforms['godRayColor'].value.set(lConfig.godRayColor || 0xffffff);
        this.godRaysPass.uniforms['density'].value = lConfig.godRayDensity ?? 0.96;
        this.godRaysPass.uniforms['weight'].value = lConfig.godRayWeight ?? 0.4;
        this.godRaysPass.uniforms['decay'].value = lConfig.godRayDecay ?? 0.93;
        this.godRaysPass.uniforms['exposure'].value = lConfig.godRayExposure ?? 0.6;
        this.godRaysPass.uniforms['samples'].value = lConfig.godRaySamples ?? 60;
      }
    } else if (configSystem.get('lighting').enableGodRays && this.renderManager && this.lightingManager) {
      this.setupGodRaysPass();
    }
  }
  
  /**
   * Reset visual effects state
   */
  public reset(): void {
    this.isShaking = false;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.cameraShakeOffset.set(0, 0, 0);
    
    // Clear camera shake
    if (this.cameraManager?.clearShakeOffset) {
      this.cameraManager.clearShakeOffset();
    }
    
    // Reset particle systems (optional - could recreate them instead)
    // If reset is called, just make sure particles are visible if enabled
    const config = configSystem.get('visuals');
    if (config.enableParticles) {
      if (this.bubbleSystem && !this.bubbleSystem.points.visible) {
        this.bubbleSystem.points.visible = true;
      }
      if (this.dustSystem && !this.dustSystem.points.visible) {
        this.dustSystem.points.visible = true;
      }
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Clean up screen flash callback
    this.onScreenFlash = undefined;
    
    // Clean up camera shake
    this.reset();
    
    // Dispose particle systems
    if (this.bubbleSystem) {
      this.bubbleSystem.dispose();
      this.bubbleSystem = undefined;
    }
    
    if (this.dustSystem) {
      this.dustSystem.dispose();
      this.dustSystem = undefined;
    }
    
    // Remove post-processing pass
    if (this.postProcessingPass && this.renderManager) {
      this.renderManager.removePostProcessingPass(this.ppPassName);
      this.postProcessingPass = undefined;
    }
    
    if (this.godRaysPass && this.renderManager) {
      this.renderManager.removePostProcessingPass(this.godRaysPassName);
      this.godRaysPass = undefined;
    }
    
    console.log("VisualEffectsService: Disposed all resources");
  }
}
import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CameraManager } from '../core/CameraManager';
import { configSystem } from '../core/ConfigurationSystem';
import { ShaderManager } from './ShaderManager';
import { RenderManager } from '../core/RenderManager';
import { BubbleParticleSystem } from '../vfx/particleSystems/BubbleParticleSystem';
import { DustParticleSystem } from '../vfx/particleSystems/DustParticleSystem';
import { CollectiblePickupParticleSystem } from '../vfx/particleSystems/CollectiblePickupParticleSystem';
import { ObstacleImpactParticleSystem } from '../vfx/particleSystems/ObstacleImpactParticleSystem';
import { underwaterPPFragmentShader } from '../shaders/postprocessing/underwaterPP.frag';

/**
 * Enhanced service for managing all visual effects including particles, post-processing,
 * screen shake, flashes, etc.
 */
export class VisualEffectsService {
  private scene?: THREE.Scene;
  private cameraManager?: CameraManager;
  private shaderManager?: ShaderManager;
  private renderManager?: RenderManager;
  private gameEngine?: any; // Reference to game engine if needed
  
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
  private collectiblePickupSystem?: CollectiblePickupParticleSystem;
  private obstacleImpactSystem?: ObstacleImpactParticleSystem;
  
  // Post-processing
  private postProcessingPass?: ShaderPass;
  private ppPassName = 'underwaterPostProcessing';

  constructor() {
    console.log("VisualEffectsService: Initialized base service");
  }

  /**
   * Initialize particle systems and post-processing effects
   * @param scene The scene where particles will be added
   * @param shaderManager The shader manager for creating materials
   * @param renderManager The render manager for post-processing
   */
  public initializeParticlesAndPostProcessing(
    scene: THREE.Scene, 
    shaderManager: ShaderManager, 
    renderManager: RenderManager
  ): void {
    this.scene = scene;
    this.shaderManager = shaderManager;
    this.renderManager = renderManager;
    
    const config = configSystem.get('visuals');

    // Initialize Particle Systems
    if (config.enableParticles) {
      if (config.playerTrailBubbles.enabled) {
        this.bubbleSystem = new BubbleParticleSystem(
          scene,
          shaderManager,
          config.playerTrailBubbles.poolSize
        );
      }
      if (config.ambientDust.enabled) {
        this.dustSystem = new DustParticleSystem(
          scene,
          shaderManager,
          config.ambientDust.poolSize
        );
      }
      this.collectiblePickupSystem = new CollectiblePickupParticleSystem(scene, shaderManager);
      this.obstacleImpactSystem = new ObstacleImpactParticleSystem(scene, shaderManager);
    }

    // Initialize Screen Effects (Post-Processing)
    if (config.enableScreenEffects) {
      this.setupPostProcessingPass();
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

    this.postProcessingPass = new ShaderPass(ppShader as any);
    this.renderManager.addPostProcessingPass(this.ppPassName, this.postProcessingPass);
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
  public linkGameEngine(gameEngine: any): void {
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
    
    const config = configSystem.get('visuals');

    // Screen flash effect via callback to GameCanvas
    if (this.onScreenFlash) {
      this.onScreenFlash(
        intensity === 'minor' ? config.screenFlash.flashColorMinor : config.screenFlash.flashColorMajor,
        intensity === 'minor' ? config.screenFlash.flashDurationMinor : config.screenFlash.flashDurationMajor
      );
    }

    // Camera shake effect
    if (this.cameraManager) {
      // Store original camera position only if not already shaking
      if (!this.isShaking) {
        this.originalCameraPosition.copy(this.cameraManager.camera.position);
      }

      this.isShaking = true;
      this.shakeDuration =
        intensity === 'minor'
          ? config.cameraShake.shakeDurationMinor
          : config.cameraShake.shakeDurationMajor;
      this.shakeIntensity =
        intensity === 'minor'
          ? config.cameraShake.shakeIntensityMinor
          : config.cameraShake.shakeIntensityMajor;
    }
  }

  /** Trigger a small bubble trail at the player's position */
  public triggerPlayerTrail(position: THREE.Vector3, velocity?: THREE.Vector3): void {
    this.bubbleSystem?.emit(position, 1, velocity);
  }

  /** Emit sparkles when a collectible or power-up is picked up */
  public triggerCollectiblePickup(position: THREE.Vector3, type?: string): void {
    const colors: Record<string, THREE.Color> = {
      bubble: new THREE.Color(0xb0e0e6),
      coin: new THREE.Color(0xffd700),
      shield: new THREE.Color(0x00aaff),
      magnet: new THREE.Color(0xff0066),
      doublescore: new THREE.Color(0xffd700)
    };
    const color = type && colors[type] ? colors[type] : new THREE.Color(0xffffff);
    this.collectiblePickupSystem?.emit(position, undefined, color);
  }

  /** Emit debris when the player hits an obstacle */
  public triggerObstacleImpact(position: THREE.Vector3, type?: string): void {
    const colors: Record<string, THREE.Color> = {
      rock: new THREE.Color(0x4a4a4a),
      kelp: new THREE.Color(0x1a5429),
      coral: new THREE.Color(0xff6b6b),
      clam: new THREE.Color(0x8b8680),
      pufferfish: new THREE.Color(0xffd93d),
      jellyfish: new THREE.Color(0xe8b4ff),
      shark: new THREE.Color(0x3a4a5c)
    };
    const color = type && colors[type] ? colors[type] : new THREE.Color(0x888888);
    this.obstacleImpactSystem?.emit(position, undefined, color);
  }

  /** Trigger a special effect when shield absorbs a hit */
  public triggerShieldHitEffect(position: THREE.Vector3): void {
    if (!configSystem.get('visuals').enableParticles) return;
    // Use default parameters for shield hit
    this.obstacleImpactSystem?.emit(position);
  }

  /** Trigger power-up collection effect */
  public triggerPowerUpCollect(position: THREE.Vector3, type: 'shield' | 'magnet' | 'doublescore'): void {
    if (!configSystem.get('visuals').enableParticles) return;
    // Different colors for different power-up types
    const colors = {
      shield: new THREE.Color(0x00aaff),
      magnet: new THREE.Color(0xff0066),
      doublescore: new THREE.Color(0xffd700)
    };
    const color = colors[type] || new THREE.Color(0xffffff);
    // Use type-specific color
    this.collectiblePickupSystem?.emit(position, undefined, color);
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
      this.bubbleSystem?.update(deltaTime, playerPosition);
      this.dustSystem?.update(deltaTime, playerPosition);
      this.collectiblePickupSystem?.update(deltaTime);
      this.obstacleImpactSystem?.update(deltaTime);
    } else {
      // Hide particles if disabled globally
      if (this.bubbleSystem?.points.visible) this.bubbleSystem.points.visible = false;
      if (this.dustSystem?.points.visible) this.dustSystem.points.visible = false;
      if (this.collectiblePickupSystem?.points.visible) this.collectiblePickupSystem.points.visible = false;
      if (this.obstacleImpactSystem?.points.visible) this.obstacleImpactSystem.points.visible = false;
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
      this.collectiblePickupSystem?.reset();
      this.obstacleImpactSystem?.reset();
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

    if (this.collectiblePickupSystem) {
      this.collectiblePickupSystem.dispose();
      this.collectiblePickupSystem = undefined;
    }

    if (this.obstacleImpactSystem) {
      this.obstacleImpactSystem.dispose();
      this.obstacleImpactSystem = undefined;
    }
    
    // Remove post-processing pass
    if (this.postProcessingPass && this.renderManager) {
      this.renderManager.removePostProcessingPass(this.ppPassName);
      this.postProcessingPass = undefined;
    }
    
    console.log("VisualEffectsService: Disposed all resources");
  }
}
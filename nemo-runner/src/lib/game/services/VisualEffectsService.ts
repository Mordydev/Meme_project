import * as THREE from 'three';
import { CameraManager } from '../core/CameraManager';

/**
 * Service for managing visual effects like screen shake, flashes, etc.
 */
export class VisualEffectsService {
  private cameraManager?: CameraManager;
  private gameEngine?: any; // Reference to game engine if needed
  
  // For screen flash effect (callback to GameCanvas)
  private onScreenFlash?: (color: string, duration: number) => void;
  
  // For camera shake
  private isShaking: boolean = false;
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  private originalCameraPosition: THREE.Vector3 = new THREE.Vector3();
  private cameraShakeOffset: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    console.log("VisualEffectsService: Initialized");
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
   * Update visual effects each frame
   * @param deltaTime Time in seconds since last frame
   */
  public update(deltaTime: number): void {
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
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.onScreenFlash = undefined;
    this.reset();
    console.log("VisualEffectsService: Disposed");
  }
}
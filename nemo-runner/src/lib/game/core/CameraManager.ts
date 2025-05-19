import * as THREE from 'three';
import { PlayerController } from '../managers/PlayerController';
import { configSystem } from './ConfigurationSystem';

export class CameraManager {
  public camera: THREE.PerspectiveCamera; // Public for easy access from engine/renderer
  private playerMesh?: THREE.Mesh;
  private offset: THREE.Vector3;
  private lookAtOffset: THREE.Vector3;

  // For camera shake effect
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, playerController?: PlayerController) {
    this.camera = camera;
    if (playerController) {
      this.playerMesh = playerController.mesh;
    }
    this.offset = new THREE.Vector3(
      configSystem.get('camera')?.offset?.x || 0,
      configSystem.get('camera')?.offset?.y || 2,
      configSystem.get('camera')?.offset?.z || 3.5
    );
    this.lookAtOffset = new THREE.Vector3(
      configSystem.get('camera')?.lookAtOffset?.x || 0,
      configSystem.get('camera')?.lookAtOffset?.y || 0,
      configSystem.get('camera')?.lookAtOffset?.z || -3
    );
    if (this.playerMesh) {
      this.camera.position.copy(this.playerMesh.position).add(this.offset);
      const lookAtPoint = this.playerMesh.position.clone().add(this.lookAtOffset);
      this.camera.lookAt(lookAtPoint);
    } else {
      this.camera.position.set(this.offset.x, this.offset.y, this.offset.z);
      this.camera.lookAt(this.lookAtOffset.x, this.lookAtOffset.y, this.lookAtOffset.z);
    }
  }

  public setTarget(playerController: PlayerController): void {
    // Update player mesh reference
    this.playerMesh = playerController.mesh;
    
    // Immediately update camera position to match player
    if (this.playerMesh) {
      // Set camera position directly to target position (no lerping)
      this.camera.position.copy(this.playerMesh.position).add(this.offset);
      
      // Set camera look-at
      const lookAtPoint = this.playerMesh.position.clone().add(this.lookAtOffset);
      this.camera.lookAt(lookAtPoint);
      
      console.log("CameraManager: Set target to new player mesh at position", 
                 this.playerMesh.position.x, this.playerMesh.position.y, this.playerMesh.position.z);
    }
  }

  /**
   * Apply a shake offset to the camera for visual effects
   * @param offset The shake offset vector
   */
  public applyShakeOffset(offset: THREE.Vector3): void {
    this.shakeOffset.copy(offset);
  }

  /**
   * Clear any camera shake effect
   */
  public clearShakeOffset(): void {
    this.shakeOffset.set(0, 0, 0);
  }

  public update(deltaTime: number): void {
    // Validate player mesh exists and is valid
    if (!this.playerMesh) {
      console.warn("CameraManager: No player mesh to follow, camera will remain stationary");
      return;
    }

    // Ensure mesh is actually in the scene by checking isObject3D & parent
    if (!this.playerMesh.isObject3D || !this.playerMesh.parent) {
      console.warn("CameraManager: Player mesh is either not Object3D or not added to scene");
      return;
    }

    // Get current player position
    const playerPos = this.playerMesh.position;

    // Log camera motion occasionally for debugging
    if (Math.random() < 0.01) { // Log approximately 1% of frames
      console.log("CameraManager: Following player at position", 
                 playerPos.x.toFixed(2), playerPos.y.toFixed(2), playerPos.z.toFixed(2));
    }

    // Camera X stays at offset.x (usually 0 for centered), follows player Y/Z
    const targetPosition = new THREE.Vector3(
      this.offset.x,
      playerPos.y + this.offset.y,
      playerPos.z + this.offset.z
    );

    // Apply shake offset to target position
    targetPosition.add(this.shakeOffset);

    // Smoothly interpolate to target position
    const lerpFactor = (configSystem.get('camera')?.lerpFactor || 0.05) * (deltaTime * 60);
    this.camera.position.lerp(targetPosition, Math.min(lerpFactor, 1));

    // LookAt can slightly follow player X, or be fixed at 0 for a stable view
    const targetLookAt = new THREE.Vector3(
      playerPos.x * 0.1 + this.lookAtOffset.x, // Slightly follow player X, or set to 0 for fixed
      playerPos.y + this.lookAtOffset.y,
      playerPos.z + this.lookAtOffset.z
    );

    // Note: We don't apply shake to lookAt to maintain a stable view direction
    this.camera.lookAt(targetLookAt);
  }

  /**
   * Explicitly reset the camera to follow the player
   * This ensures the camera is properly positioned during game resets
   */
  public reset(playerController: PlayerController): void {
    console.log("CameraManager: Explicit reset called");
    
    // Update the player mesh reference
    this.playerMesh = playerController.mesh;
    
    // Force camera to exact position without any lerping
    if (this.playerMesh) {
      // Calculate where camera should be relative to player
      const targetPosition = new THREE.Vector3(
        this.offset.x, // Usually 0 for centered
        this.playerMesh.position.y + this.offset.y,
        this.playerMesh.position.z + this.offset.z
      );
      
      // Force camera to this position immediately (no lerping)
      this.camera.position.copy(targetPosition);
      
      // Update look-at target
      const lookAtTarget = new THREE.Vector3(
        this.playerMesh.position.x * 0.1 + this.lookAtOffset.x,
        this.playerMesh.position.y + this.lookAtOffset.y,
        this.playerMesh.position.z + this.lookAtOffset.z
      );
      this.camera.lookAt(lookAtTarget);
      
      // Clear any shake effects
      this.clearShakeOffset();
      
      console.log("CameraManager: Camera reset to position", 
                  this.camera.position.x.toFixed(2), 
                  this.camera.position.y.toFixed(2), 
                  this.camera.position.z.toFixed(2));
    } else {
      console.warn("CameraManager: Reset called but player mesh is undefined");
    }
  }

  public handleResize(aspectRatio: number): void {
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
  }

  public dispose(): void {
    console.log("CameraManager: Disposed.");
  }
} 
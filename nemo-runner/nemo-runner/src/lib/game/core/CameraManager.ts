import * as THREE from 'three';
import { PlayerController } from '../managers/PlayerController';
import { configSystem } from './ConfigurationSystem';

export class CameraManager {
  public camera: THREE.PerspectiveCamera; // Public for easy access from engine/renderer
  private playerMesh?: THREE.Mesh;
  private offset: THREE.Vector3;
  private lookAtOffset: THREE.Vector3;

  constructor(camera: THREE.PerspectiveCamera, playerController?: PlayerController) {
    this.camera = camera;
    if (playerController) {
      this.playerMesh = playerController.mesh;
    }
    this.offset = new THREE.Vector3(
      configSystem.get('camera')?.offset?.x || 0,
      configSystem.get('camera')?.offset?.y || 2,
      configSystem.get('camera')?.offset?.z || 5
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
    this.playerMesh = playerController.mesh;
    if (this.playerMesh) {
      this.camera.position.copy(this.playerMesh.position).add(this.offset);
      const lookAtPoint = this.playerMesh.position.clone().add(this.lookAtOffset);
      this.camera.lookAt(lookAtPoint);
    }
  }

  public update(deltaTime: number): void {
    if (!this.playerMesh) return;
    const playerPos = this.playerMesh.position;
    // Camera X stays at offset.x (usually 0 for centered), follows player Y/Z
    const targetPosition = new THREE.Vector3(
      this.offset.x,
      playerPos.y + this.offset.y,
      playerPos.z + this.offset.z
    );
    const lerpFactor = (configSystem.get('camera')?.lerpFactor || 0.05) * (deltaTime * 60);
    this.camera.position.lerp(targetPosition, Math.min(lerpFactor, 1));
    // LookAt can slightly follow player X, or be fixed at 0 for a stable view
    const targetLookAt = new THREE.Vector3(
      playerPos.x * 0.1 + this.lookAtOffset.x, // Slightly follow player X, or set to 0 for fixed
      playerPos.y + this.lookAtOffset.y,
      playerPos.z + this.lookAtOffset.z
    );
    this.camera.lookAt(targetLookAt);
  }

  public handleResize(aspectRatio: number): void {
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
  }

  public dispose(): void {
    console.log("CameraManager: Disposed.");
  }
} 
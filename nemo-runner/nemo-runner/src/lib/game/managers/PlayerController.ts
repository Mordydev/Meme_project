import * as THREE from 'three';
import { configSystem } from '../core/ConfigurationSystem';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';

// Helper function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class PlayerController {
  public mesh!: THREE.Mesh; // The visual representation of the player
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;

  private currentLane: number = 0; // -1 (left), 0 (center), 1 (right)
  private targetLane: number = 0;
  private isTransitioningLane: boolean = false;
  private laneTransitionProgress: number = 0;
  private targetLaneX: number = 0;
  private previousLaneX: number = 0;

  public isInvincible: boolean = false;
  private invincibilityTimer: number = 0;
  private invincibilityDuration: number = 2; // seconds, from config later

  public lives: number = 1;
  private initialLives: number = 1;

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    this.initialLives = configSystem.get('player')?.initialLives || 1;
    this.lives = this.initialLives;
    this.initialize();
  }

  private initialize(): void {
    this.mesh = this.assetFactory.createPlayerMesh();
    this.mesh.position.y = -0.45; // Floor is at Y=-1, sphere radius 0.5, so -1 + 0.5 = -0.5. A bit higher for clearance.
    this.mesh.position.x = 0;
    this.mesh.position.z = 0;
    this.scene.add(this.mesh);
    console.log("PlayerController: Initialized with player mesh from factory.");
  }

  public update(deltaTime: number): void {
    // Forward movement
    const forwardSpeed = configSystem.getPlayerMoveSpeed();
    this.mesh.position.z -= forwardSpeed * deltaTime;

    // Lane transition logic
    if (this.isTransitioningLane) {
      this.laneTransitionProgress += deltaTime / configSystem.get('player').laneChangeDuration;
      this.mesh.position.x = this.previousLaneX + (this.targetLaneX - this.previousLaneX) * easeOutCubic(this.laneTransitionProgress);
      if (this.laneTransitionProgress >= 1) {
        this.isTransitioningLane = false;
        this.mesh.position.x = this.targetLaneX;
      }
    }

    // Invincibility timer
    if (this.isInvincible) {
      this.invincibilityTimer -= deltaTime;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        if (!Array.isArray(this.mesh.material)) {
          this.mesh.material.opacity = 1.0;
          (this.mesh.material as THREE.Material).needsUpdate = true;
        }
        console.log("PlayerController: Invincibility ended.");
      }
    }
  }

  public moveLeft(): void {
    this.changeLane(-1);
  }

  public moveRight(): void {
    this.changeLane(1);
  }

  public changeLane(direction: -1 | 1): void {
    if (this.isTransitioningLane) return;
    const laneCount = configSystem.getWorldLaneCount();
    const minLane = -Math.floor(laneCount / 2);
    const maxLane = Math.floor(laneCount / 2);
    const nextLane = Math.max(minLane, Math.min(maxLane, this.currentLane + direction));
    if (nextLane === this.currentLane) return;
    this.isTransitioningLane = true;
    this.previousLaneX = this.mesh.position.x;
    this.targetLaneX = nextLane * configSystem.getPlayerLaneWidth();
    this.laneTransitionProgress = 0;
    this.currentLane = nextLane;
  }

  public handleHit(): boolean {
    if (this.isInvincible) return false;
    console.log("PlayerController: Player hit!");
    this.lives--;
    if (this.lives <= 0) {
      if (!Array.isArray(this.mesh.material)) {
        (this.mesh.material as THREE.MeshPhongMaterial).color.setHex(0xff0000);
      }
      console.log("PlayerController: No lives left.");
      return true;
    } else {
      this.isInvincible = true;
      this.invincibilityTimer = this.invincibilityDuration;
      if (!Array.isArray(this.mesh.material)) {
        this.mesh.material.transparent = true;
        this.mesh.material.opacity = 0.5;
      }
      console.log(`PlayerController: Lives remaining: ${this.lives}. Invincible.`);
      return false;
    }
  }

  public reset(): void {
    this.mesh.position.set(0, -0.45, 0);
    this.currentLane = 0;
    this.targetLane = 0;
    this.isTransitioningLane = false;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.lives = this.initialLives;
    if (!Array.isArray(this.mesh.material)) {
      (this.mesh.material as THREE.MeshPhongMaterial).color.setHex(0xffa500);
      this.mesh.material.opacity = 1.0;
      this.mesh.material.transparent = false;
    }
    console.log("PlayerController: Reset.");
  }

  public dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(m => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
      this.scene.remove(this.mesh);
    }
    console.log("PlayerController: Disposed.");
  }
} 
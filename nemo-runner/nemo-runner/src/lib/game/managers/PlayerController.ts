import * as THREE from 'three';
import { configSystem } from '../core/ConfigurationSystem';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';

// Helper function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Player state enum
export enum PlayerState {
  IDLE,        // Or RUNNING since always moving forward
  LANE_CHANGING,
  JUMPING,
  DIVING,
  HIT,        // When hit and invincible
  DEFEATED     // Game over for player
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

  // Player state and vertical movement
  public state: PlayerState = PlayerState.IDLE;
  private normalYPosition: number = -0.45; // Store the player's base Y position

  private isJumping: boolean = false;
  private jumpTime: number = 0;

  private isDiving: boolean = false;
  private diveTime: number = 0;

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    this.initialLives = configSystem.get('player')?.initialLives || 1;
    this.lives = this.initialLives;
    this.initialize();
  }

  private initialize(): void {
    this.mesh = this.assetFactory.createPlayerMesh();
    this.mesh.position.y = this.normalYPosition; // Floor is at Y=-1, sphere radius 0.5, so -1 + 0.5 = -0.5. A bit higher for clearance.
    this.mesh.position.x = 0;
    this.mesh.position.z = 0;
    this.scene.add(this.mesh);
    console.log("PlayerController: Initialized with player mesh from factory.");
  }

  // Jump method
  public jump(): void {
    // Can only jump if on the ground (not already jumping/diving) and not hit/defeated
    if ((this.state === PlayerState.IDLE || this.state === PlayerState.LANE_CHANGING) &&
        this.state !== PlayerState.HIT && this.state !== PlayerState.DEFEATED) {
      this.state = PlayerState.JUMPING;
      this.isJumping = true;
      this.jumpTime = 0;
      console.log("PlayerController: Jump started.");
      // Later: Trigger jump animation
    }
  }

  // Dive method
  public dive(): void {
    // Can only dive if on the ground (not already jumping/diving) and not hit/defeated
    if ((this.state === PlayerState.IDLE || this.state === PlayerState.LANE_CHANGING) &&
        this.state !== PlayerState.HIT && this.state !== PlayerState.DEFEATED) {
      this.state = PlayerState.DIVING;
      this.isDiving = true;
      this.diveTime = 0;
      console.log("PlayerController: Dive started.");
      // Later: Trigger dive animation
    }
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

        // Update state if not jumping or diving
        if (!this.isJumping && !this.isDiving) {
          this.state = PlayerState.IDLE;
        }
      } else {
        this.state = PlayerState.LANE_CHANGING;
      }
    }

    // Vertical Movement Logic
    if (this.isJumping) {
      this.jumpTime += deltaTime;
      const jumpConfig = configSystem.get('player');
      const jumpProgress = this.jumpTime / jumpConfig.jumpDuration;

      // Simple parabolic arc: y = 4 * h * x * (1-x)
      // where h is max height, x is progress (0 to 1)
      if (jumpProgress < 1) {
        this.mesh.position.y = this.normalYPosition + (4 * jumpConfig.jumpHeight * jumpProgress * (1 - jumpProgress));
      } else {
        this.mesh.position.y = this.normalYPosition; // Snap back to ground
        this.isJumping = false;
        this.state = this.isTransitioningLane ? PlayerState.LANE_CHANGING : PlayerState.IDLE;
        console.log("PlayerController: Jump ended.");
      }
    } else if (this.isDiving) {
      this.diveTime += deltaTime;
      const diveConfig = configSystem.get('player');
      const diveProgress = this.diveTime / diveConfig.diveDuration;

      // Similar parabolic arc, but downwards
      if (diveProgress < 1) {
        this.mesh.position.y = this.normalYPosition - (4 * diveConfig.diveDepth * diveProgress * (1 - diveProgress));
      } else {
        this.mesh.position.y = this.normalYPosition; // Snap back to ground
        this.isDiving = false;
        this.state = this.isTransitioningLane ? PlayerState.LANE_CHANGING : PlayerState.IDLE;
        console.log("PlayerController: Dive ended.");
      }
    }
    // Ensure state is reset if not actively jumping/diving/lane changing
    else if (!this.isTransitioningLane && this.state !== PlayerState.HIT && this.state !== PlayerState.DEFEATED) {
       this.state = PlayerState.IDLE;
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
        this.state = PlayerState.IDLE;
        console.log("PlayerController: Invincibility ended.");
      } else {
        this.state = PlayerState.HIT;
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

    // Reset any active jump/dive on hit
    this.isJumping = false;
    this.jumpTime = 0;
    this.isDiving = false;
    this.diveTime = 0;
    this.mesh.position.y = this.normalYPosition; // Force back to ground on hit

    if (this.lives <= 0) {
      if (!Array.isArray(this.mesh.material)) {
        (this.mesh.material as THREE.MeshPhongMaterial).color.setHex(0xff0000);
      }
      this.state = PlayerState.DEFEATED;
      console.log("PlayerController: No lives left.");
      return true;
    } else {
      this.isInvincible = true;
      this.invincibilityTimer = this.invincibilityDuration;
      this.state = PlayerState.HIT;
      if (!Array.isArray(this.mesh.material)) {
        this.mesh.material.transparent = true;
        this.mesh.material.opacity = 0.5;
      }
      console.log(`PlayerController: Lives remaining: ${this.lives}. Invincible.`);
      return false;
    }
  }

  public reset(): void {
    this.mesh.position.set(0, this.normalYPosition, 0);
    this.currentLane = 0;
    this.targetLane = 0;
    this.isTransitioningLane = false;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.lives = this.initialLives;

    // Reset jump/dive state
    this.isJumping = false;
    this.jumpTime = 0;
    this.isDiving = false;
    this.diveTime = 0;
    this.state = PlayerState.IDLE;

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

  // Get forward speed for distance-based scoring
  public getForwardSpeed(): number {
    return configSystem.getPlayerMoveSpeed();
  }
} 
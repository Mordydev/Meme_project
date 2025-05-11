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
    // Can only jump if in a "grounded" or neutral state
    if ((this.state === PlayerState.IDLE || this.state === PlayerState.LANE_CHANGING) &&
        this.state !== PlayerState.HIT && this.state !== PlayerState.DEFEATED) {
      this.state = PlayerState.JUMPING;
      this.isJumping = true; // Redundant if using state, but can keep for clarity
      this.isDiving = false; // Ensure not diving
      this.jumpTime = 0;
      this.diveTime = 0; // Reset dive time
      console.log("PlayerController: Jump started.");
      // Later: Trigger jump animation
    } else {
      console.log(`PlayerController: Cannot jump from state: ${PlayerState[this.state]}`);
    }
  }

  // Dive method
  public dive(): void {
    // Can dive if idle, lane changing, OR to cancel a jump
    if ((this.state === PlayerState.IDLE || this.state === PlayerState.LANE_CHANGING || this.state === PlayerState.JUMPING) &&
        this.state !== PlayerState.HIT && this.state !== PlayerState.DEFEATED) {

      if (this.state === PlayerState.JUMPING) {
        console.log("PlayerController: Jump cancelled by dive.");
        // Optionally, you could factor in current jump height/velocity to make the dive start smoother
        // For now, it will just switch to the dive arc from current Y.
      }

      this.state = PlayerState.DIVING;
      this.isDiving = true; // Redundant if using state
      this.isJumping = false; // Ensure not jumping
      this.diveTime = 0;
      this.jumpTime = 0; // Reset jump time
      console.log("PlayerController: Dive started.");
      // Later: Trigger dive animation
    } else {
      console.log(`PlayerController: Cannot dive from state: ${PlayerState[this.state]}`);
    }
  }

  public update(deltaTime: number): void {
    const playerConfig = configSystem.get('player'); // Get config once

    // Forward movement
    if (this.state !== PlayerState.DEFEATED) { // Don't move if defeated
      this.mesh.position.z -= playerConfig.moveSpeed * deltaTime;
    }

    // Lane transition logic (only if not defeated)
    if (this.isTransitioningLane && this.state !== PlayerState.DEFEATED) {
      this.laneTransitionProgress += deltaTime / playerConfig.laneChangeDuration;
      this.mesh.position.x = this.previousLaneX + (this.targetLaneX - this.previousLaneX) * easeOutCubic(this.laneTransitionProgress);
      if (this.laneTransitionProgress >= 1) {
        this.isTransitioningLane = false;
        this.mesh.position.x = this.targetLaneX;
        if (this.state === PlayerState.LANE_CHANGING) { // If only lane changing, return to IDLE/RUNNING
          this.state = PlayerState.IDLE;
        }
      }
    }

    // Vertical Movement Logic
    if (this.state === PlayerState.JUMPING) {
      this.jumpTime += deltaTime;
      const jumpProgress = this.jumpTime / playerConfig.jumpDuration;
      if (jumpProgress < 1) {
        this.mesh.position.y = this.normalYPosition + (4 * playerConfig.jumpHeight * jumpProgress * (1 - jumpProgress));
      } else {
        this.mesh.position.y = this.normalYPosition;
        this.isJumping = false; // Keep for direct checks if needed
        this.state = PlayerState.IDLE;
        console.log("PlayerController: Jump ended.");
      }
    } else if (this.state === PlayerState.DIVING) {
      this.diveTime += deltaTime;
      const diveProgress = this.diveTime / playerConfig.diveDuration;
      if (diveProgress < 1) {
        this.mesh.position.y = this.normalYPosition - (4 * playerConfig.diveDepth * diveProgress * (1 - diveProgress));
      } else {
        this.mesh.position.y = this.normalYPosition;
        this.isDiving = false; // Keep for direct checks
        this.state = PlayerState.IDLE;
        console.log("PlayerController: Dive ended.");
      }
    }
    // If not in a specific action state (jump, dive, lane_change) and not hit/defeated, ensure it's IDLE
    else if (this.state !== PlayerState.HIT && this.state !== PlayerState.DEFEATED && !this.isTransitioningLane) {
       this.state = PlayerState.IDLE;
    }

    // Invincibility logic (only if in HIT state)
    if (this.state === PlayerState.HIT) { // Check state for invincibility
      this.invincibilityTimer -= deltaTime;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false; // Redundant if state drives this
        this.state = PlayerState.IDLE; // Return to normal state after invincibility
        if (!Array.isArray(this.mesh.material)) {
          this.mesh.material.opacity = 1.0;
          (this.mesh.material as THREE.Material).needsUpdate = true;
        }
        console.log("PlayerController: Invincibility ended. State set to IDLE.");
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

  public handleHit(): boolean { // Returns true if game should be over (player is defeated)
    if (this.state === PlayerState.HIT || this.state === PlayerState.DEFEATED) return false; // Already hit or defeated

    console.log("PlayerController: Player hit! Processing hit...");
    this.lives--;

    // Reset any active jump/dive on hit
    this.isJumping = false; this.jumpTime = 0;
    this.isDiving = false; this.diveTime = 0;
    this.mesh.position.y = this.normalYPosition; // Force back to ground

    if (this.lives <= 0) {
      this.state = PlayerState.DEFEATED;
      if (!Array.isArray(this.mesh.material)) {
        (this.mesh.material as THREE.MeshPhongMaterial).color.setHex(0xff0000); // Red
      }
      console.log("PlayerController: No lives left. State: DEFEATED.");
      return true; // Signal game over
    } else {
      this.state = PlayerState.HIT; // Transition to HIT state for invincibility
      this.isInvincible = true; // Still useful for quick checks in CollisionDetection
      this.invincibilityTimer = configSystem.get('player').invincibilityDuration || 2;
      if (!Array.isArray(this.mesh.material)) {
        this.mesh.material.transparent = true;
        this.mesh.material.opacity = 0.5;
        (this.mesh.material as THREE.Material).needsUpdate = true;
      }
      console.log(`PlayerController: Lives remaining: ${this.lives}. State: HIT (Invincible).`);
      return false;
    }
  }

  public reset(): void {
    this.mesh.position.set(0, this.normalYPosition, 0);
    this.currentLane = 0;
    this.targetLane = 0;
    this.isTransitioningLane = false;

    this.isJumping = false; this.jumpTime = 0;
    this.isDiving = false; this.diveTime = 0;

    this.lives = this.initialLives;
    this.state = PlayerState.IDLE; // Set to IDLE (or RUNNING)
    this.isInvincible = false; // Ensure invincibility is off
    this.invincibilityTimer = 0;

    if (!Array.isArray(this.mesh.material)) {
      (this.mesh.material as THREE.MeshPhongMaterial).color.setHex(0xffa500);
      this.mesh.material.opacity = 1.0;
      this.mesh.material.transparent = false;
      (this.mesh.material as THREE.Material).needsUpdate = true;
    }
    console.log("PlayerController: Reset. State: IDLE.");
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
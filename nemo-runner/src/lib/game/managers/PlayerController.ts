import * as THREE from 'three';
import { configSystem } from '../core/ConfigurationSystem';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { PowerUpType } from './PowerUpManager';
import { ClownfishAsset } from '../assets/character/ClownfishAsset';

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
  public mesh!: THREE.Group; // The visual representation of the player (now a Group)
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;
  private gameEngine?: any; // Reference to game engine for accessing VFX
  private clownfishAsset!: ClownfishAsset; // Store the asset instance

  private currentLane: number = 0; // -1 (left), 0 (center), 1 (right)
  private targetLane: number = 0;
  private isTransitioningLane: boolean = false;
  private laneTransitionProgress: number = 0;
  private targetLaneX: number = 0;
  private previousLaneX: number = 0;

  // For post-hit invincibility
  public isInvincible: boolean = false;
  private invincibilityTimer: number = 0;
  private invincibilityDuration: number = 1.5; // seconds, from config

  // For shield power-up invincibility (separate from post-hit)
  public isPowerUpShieldActive: boolean = false;
  private originalPlayerMaterials?: Map<string, THREE.Material>;
  private shieldVisualMaterial?: THREE.Material;
  private hitVisualMaterial?: THREE.Material; // For post-hit visual feedback

  public lives: number = 2; // 2-lives system
  private initialLives: number = 2;

  // Player state and vertical movement
  public state: PlayerState = PlayerState.IDLE;
  private normalYPosition: number = -0.45; // Store the player's base Y position

  private isJumping: boolean = false;
  private jumpTime: number = 0;

  private isDiving: boolean = false;
  private diveTime: number = 0;

  // Speed control for difficulty system
  private baseForwardSpeed: number;
  private forwardSpeedMultiplier: number = 1.0;
  private currentForwardSpeed: number;

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory, gameEngine?: any) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    this.gameEngine = gameEngine; // Store reference to game engine

    const playerConfig = configSystem.get('player');
    this.initialLives = playerConfig?.initialLives || 2; // Default to 2 lives
    this.lives = this.initialLives;
    this.invincibilityDuration = playerConfig?.invincibilityDuration || 1.5;
    this.normalYPosition = playerConfig?.normalYPosition || -0.45;

    // Initialize speed values
    this.baseForwardSpeed = configSystem.getPlayerBaseSpeed();
    this.currentForwardSpeed = this.baseForwardSpeed;

    this.initialize();
    this.initializeVisualMaterials();
  }

  private initializeVisualMaterials(): void {
    // Create shield visual material with properties from config
    const shieldConfig = configSystem.getPowerUpsConfig().shield.visual || {};

    this.shieldVisualMaterial = new THREE.MeshPhongMaterial({
      color: shieldConfig.color || 0x00ccff, // Use config value or default to cyan
      emissive: shieldConfig.emissive || 0x00ffff,
      emissiveIntensity: shieldConfig.emissiveIntensity || 1.5,
      transparent: true,
      opacity: shieldConfig.opacity || 0.7,
      wireframe: false, // Keep it solid for shield effect
      shininess: 100 // Add shininess for better visibility
    });

    // Create hit visual material for post-hit state
    this.hitVisualMaterial = new THREE.MeshPhongMaterial({
      color: 0xff3333, // Red
      emissive: 0xcc0000,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7,
      shininess: 50
    });
  }

  private initialize(): void {
    // Get the clownfish asset and its mesh
    this.clownfishAsset = this.assetFactory.createClownfishAsset();
    this.mesh = this.clownfishAsset.getMesh();
    this.mesh.position.y = this.normalYPosition;
    this.mesh.position.x = 0;
    this.mesh.position.z = 0;
    this.scene.add(this.mesh);
    console.log("PlayerController: Initialized with clownfish player mesh.");
  }

  /**
   * Set power-up state for the player
   * @param type The type of power-up to set
   * @param isActive Whether the power-up is active
   */
  public setPowerUpState(type: PowerUpType, isActive: boolean): void {
    if (type === 'shield') {
      this.isPowerUpShieldActive = isActive;

      if (isActive) {
        console.log("PlayerController: Shield ACTIVE");
        
        // Store original materials and apply shield to all meshes in the group
        if (this.mesh && this.shieldVisualMaterial) {
          if (!this.originalPlayerMaterials) {
            this.originalPlayerMaterials = new Map();
            
            // Store original materials for all child meshes
            this.mesh.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material) {
                this.originalPlayerMaterials!.set(child.name, child.material);
                
                // Apply shield material to each mesh
                child.material = this.shieldVisualMaterial!.clone();
                child.material.needsUpdate = true;
              }
            });
          }
        }
      } else {
        console.log("PlayerController: Shield DEACTIVE");
        
        // Restore original materials if not in hit state
        if (this.mesh && this.originalPlayerMaterials && this.state !== PlayerState.HIT) {
          // Traverse the group and restore materials
          this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.name) {
              const originalMaterial = this.originalPlayerMaterials!.get(child.name);
              if (originalMaterial) {
                child.material = originalMaterial;
                child.material.needsUpdate = true;
              }
            }
          });
          
          this.originalPlayerMaterials = undefined;
        } else if (this.state !== PlayerState.HIT) {
          // If no original materials and not in hit state, could restore defaults
          // For now, let's just log this
          console.log("PlayerController: No original materials to restore after shield");
        }
      }
    }
    // Can add more power-up types here in the future
  }

  /**
   * Sets the forward speed multiplier (used by DifficultyManager)
   * @param multiplier The multiplier to apply to base speed
   */
  public setForwardSpeedMultiplier(multiplier: number): void {
    this.forwardSpeedMultiplier = multiplier;
    this.currentForwardSpeed = this.baseForwardSpeed * this.forwardSpeedMultiplier;
    // console.log(`PlayerController: Forward speed multiplier set to ${multiplier.toFixed(2)}, current speed: ${this.currentForwardSpeed.toFixed(2)}`);
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

    // Forward movement - now uses the dynamic current speed
    if (this.state !== PlayerState.DEFEATED) { // Don't move if defeated
      this.mesh.position.z -= this.currentForwardSpeed * deltaTime;
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
    
    // Update clownfish animation with current speed and turning state
    if (this.clownfishAsset) {
      const currentSpeedNormalized = this.currentForwardSpeed / this.baseForwardSpeed; // Normalize speed
      let isTurning = this.isTransitioningLane;
      let turnDirection = this.isTransitioningLane ? Math.sign(this.targetLaneX - this.previousLaneX) : 0;
      this.clownfishAsset.updateAnimation(deltaTime, currentSpeedNormalized, isTurning, turnDirection);
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

    // Post-hit invincibility logic
    if (this.isInvincible && this.state === PlayerState.HIT) {
      this.invincibilityTimer -= deltaTime;

      // Add flashing effect for post-hit invincibility
      const isVisible = Math.floor(this.invincibilityTimer * 10) % 2 === 0;
      this.mesh.visible = isVisible;

      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.mesh.visible = true; // Ensure player is visible when invincibility ends

        // Only reset to IDLE if still in HIT state
        if (this.state === PlayerState.HIT) {
          this.state = PlayerState.IDLE;
        }

        // Restore original appearance if not shielded by power-up
        if (!this.isPowerUpShieldActive && this.originalPlayerMaterials) {
          // Restore all original materials
          this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.name) {
              const originalMaterial = this.originalPlayerMaterials!.get(child.name);
              if (originalMaterial) {
                child.material = originalMaterial;
                child.material.needsUpdate = true;
              }
            }
          });
          
          // Clear the stored materials
          this.originalPlayerMaterials = undefined;
        }

        console.log("PlayerController: Post-hit invincibility ended.");
      }
    } else if (!this.isInvincible && this.state === PlayerState.HIT) {
      // If invincibility is turned off but still in HIT state, transition to IDLE
      this.state = PlayerState.IDLE;
      // Make sure player is visible
      this.mesh.visible = true;
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
    // Check if shield power-up is active - if so, absorb hit without damage
    if (this.isPowerUpShieldActive) {
      console.log("PlayerController: Hit absorbed by Power-Up Shield!");
      // Notify PowerUpManager to deactivate shield power-up
      if (this.gameEngine?.getPowerUpManager) {
        this.gameEngine.getPowerUpManager().forceDeactivateEffect('shield');
      }
      this.setPowerUpState('shield', false); // Turn off shield visual
      return false; // Player is not defeated, shield absorbed it
    }

    if (this.state === PlayerState.HIT || this.state === PlayerState.DEFEATED || this.isInvincible) {
      // Already hit, defeated, or invincible from previous hit
      return this.state === PlayerState.DEFEATED; // Return true if already defeated
    }

    console.log("PlayerController: Player hit! Processing hit...");
    this.lives--;

    // Reset any active jump/dive on hit
    this.isJumping = false; this.jumpTime = 0;
    this.isDiving = false; this.diveTime = 0;
    this.mesh.position.y = this.normalYPosition; // Force back to ground

    // Get VisualEffectsService if available
    const vfxService = this.gameEngine?.getVisualEffectsService?.();

    if (this.lives <= 0) {
      // Final hit - player is defeated
      this.state = PlayerState.DEFEATED;
      this.isInvincible = false; // No invincibility when defeated

      // Trigger major hit effect for game over
      if (vfxService) {
        vfxService.triggerHitEffect('major');
      }

      // Apply red material to all meshes in the group to indicate defeat (unless shielded)
      if (this.mesh && this.hitVisualMaterial) {
        this.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = this.hitVisualMaterial!.clone();
            child.material.opacity = 1.0; // Fully visible red for defeat
            child.material.transparent = true;
            child.material.needsUpdate = true;
          }
        });
      }

      // Update UI for lives if there's a callback
      if (this.gameEngine?.getCallbacks?.().onLivesUpdate) {
        this.gameEngine.getCallbacks().onLivesUpdate(this.lives);
      }

      console.log("PlayerController: No lives left. State: DEFEATED.");
      return true; // Signal game over
    } else {
      // First hit - player enters invincibility state
      this.state = PlayerState.HIT; // Transition to HIT state for invincibility
      this.isInvincible = true; // Still useful for quick checks in CollisionDetection
      this.invincibilityTimer = this.invincibilityDuration;

      // Trigger minor hit effect for first hit
      if (vfxService) {
        vfxService.triggerHitEffect('minor');
      }

      // Apply visual cue for post-hit invincibility to all meshes
      if (this.mesh) {
        if (!this.originalPlayerMaterials) {
          this.originalPlayerMaterials = new Map();
          
          // Store original materials for all child meshes
          this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              this.originalPlayerMaterials!.set(child.name, child.material);
              
              // Apply hit material to each mesh
              if (this.hitVisualMaterial) {
                child.material = this.hitVisualMaterial.clone();
              } else {
                // Fallback - just make the existing material semi-transparent
                if (!child.material.transparent) {
                  child.material.transparent = true;
                  child.material.opacity = 0.5;
                }
              }
              child.material.needsUpdate = true;
            }
          });
        }
      }

      // Update UI for lives if there's a callback
      if (this.gameEngine?.getCallbacks?.().onLivesUpdate) {
        this.gameEngine.getCallbacks().onLivesUpdate(this.lives);
      }

      console.log(`PlayerController: Lives remaining: ${this.lives}. State: HIT (Invincible).`);
      return false; // Not game over yet
    }
  }

  public reset(): void {
    // Reset position and lane state
    this.mesh.position.set(0, this.normalYPosition, 0);
    this.currentLane = 0;
    this.targetLane = 0;
    this.isTransitioningLane = false;

    // Reset vertical movement
    this.isJumping = false; this.jumpTime = 0;
    this.isDiving = false; this.diveTime = 0;

    // Reset shield power-up state
    this.isPowerUpShieldActive = false;
    this.originalPlayerMaterial = undefined;

    // Reset lives and state
    this.lives = this.initialLives;
    this.state = PlayerState.IDLE;
    this.isInvincible = false;
    this.invincibilityTimer = 0;

    // Reset speed
    this.forwardSpeedMultiplier = 1.0;
    this.currentForwardSpeed = this.baseForwardSpeed;

    // Reset visibility and appearance
    this.mesh.visible = true;

    // Create a new clownfish with original materials
    if (this.clownfishAsset) {
      // First remove the old mesh from the scene
      this.scene.remove(this.mesh);
      
      // Dispose current asset
      this.clownfishAsset.dispose();
      
      // Create a new clownfish
      this.clownfishAsset = this.assetFactory.createClownfishAsset();
      this.mesh = this.clownfishAsset.getMesh();
      this.mesh.position.set(0, this.normalYPosition, 0);
      this.scene.add(this.mesh);
    }
    
    // Clear stored materials
    this.originalPlayerMaterials = undefined;

    // Update UI for lives if there's a callback
    if (this.gameEngine?.getCallbacks?.().onLivesUpdate) {
      this.gameEngine.getCallbacks().onLivesUpdate(this.lives);
    }

    console.log("PlayerController: Reset. Lives:", this.lives, "State: IDLE. Shield deactivated.");
  }

  public dispose(): void {
    // Dispose shield material if it exists
    if (this.shieldVisualMaterial) {
      this.shieldVisualMaterial.dispose();
    }

    // Dispose the clownfish asset properly
    if (this.clownfishAsset) {
      this.clownfishAsset.dispose();
    }

    // Remove the mesh from the scene
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }

    console.log("PlayerController: Disposed.");
  }

  // Get forward speed for distance-based scoring
  public getForwardSpeed(): number {
    return this.currentForwardSpeed;
  }

  /**
   * Returns the mesh to use for collision detection
   */
  public getCollisionObject(): THREE.Mesh {
    // Since the player is now a Group containing multiple meshes,
    // return the body mesh which is most appropriate for collisions
    const bodyMesh = this.mesh.getObjectByName("ClownfishBody") as THREE.Mesh;
    if (bodyMesh) {
      return bodyMesh;
    }
    
    // Fallback: create a simple collision sphere if body mesh not found
    if (!this.mesh.userData.collisionMesh) {
      const collisionGeometry = new THREE.SphereGeometry(0.4); // Approximately the size of the fish body
      const collisionMaterial = new THREE.MeshBasicMaterial({ 
        visible: false // Invisible collision mesh
      });
      const collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
      collisionMesh.name = "PlayerCollider";
      this.mesh.add(collisionMesh);
      this.mesh.userData.collisionMesh = collisionMesh;
    }
    
    return this.mesh.userData.collisionMesh;
  }
} 
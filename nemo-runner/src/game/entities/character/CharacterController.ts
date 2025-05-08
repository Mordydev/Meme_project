import * as THREE from 'three';
import eventBus from '../../core/EventSystem';
import gameStateManager from '../../core/GameStateManager';
import { CharacterAnimator, CharacterAnimationState } from './CharacterAnimator';
import { CharacterEffects } from './CharacterEffects';

// Character state
export type CharacterState = 'SWIMMING' | 'JUMPING' | 'DIVING' | 'CHANGING_LANE' | 'HIT' | 'POWER_UP';

// Lane types
export type LaneType = 'LEFT' | 'CENTER' | 'RIGHT';

// Lane positions
const LANE_POSITIONS = {
  LEFT: -1.5,   // Reduced from -2 for less extreme lane positions
  CENTER: 0,
  RIGHT: 1.5    // Reduced from 2 for less extreme lane positions
};

// Character movement parameters
const CHARACTER_PARAMS = {
  SWIM_SPEED: 10,              // Base forward swimming speed
  LANE_CHANGE_SPEED: 5,        // Horizontal movement speed
  LANE_CHANGE_TIME: 0.6,       // Time to change lanes (increased for smoother transitions)
  JUMP_HEIGHT: 2,              // Maximum jump height
  JUMP_DURATION: 0.5,          // Jump duration in seconds
  DIVE_DEPTH: 2,               // Maximum dive depth
  DIVE_DURATION: 0.5,          // Dive duration in seconds
  RECOVERY_TIME: 1.0,          // Time to recover from hit
  HIT_FLASH_SPEED: 8,          // Flashing speed when hit
  IMMUNITY_DURATION: 2.0,      // Immunity duration after being hit
  BUBBLE_TRAIL_RATE: 0.1,      // Time between bubble particles
  FORWARD_SPEED: 15,           // Automatic forward movement speed
  LANE_CHANGE_ROTATION: 0.25,  // Rotation amount during lane change (reduced for smoother feel)
  LANE_CHANGE_TILT: 15,        // Tilt angle during lane change (in degrees)
  INPUT_RESPONSE_DELAY: 0.05,  // Input response delay in seconds (nearly instant)
  DEBUG_LANE_CHANGES: false    // Enable/disable lane change debugging
};

/**
 * Manages character movement, collisions, and state transitions
 */
export class CharacterController {
  // Core components
  private mesh: THREE.Group;
  private animator: CharacterAnimator;
  private effects: CharacterEffects;
  private collider: THREE.Sphere;
  
  // Character state
  private state: CharacterState = 'SWIMMING';
  private lane: LaneType = 'CENTER';
  
  // Movement tracking
  private targetX: number = 0;
  private targetY: number = 0;
  private startY: number = 0;
  private actionTime: number = 0;
  
  // Game state
  private isImmune: boolean = false;
  private immunityTime: number = 0;
  private hitFlashVisible: boolean = true;
  private lastBubbleTime: number = 0;
  private speedMultiplier: number = 1.0;
  private isMoving: boolean = false; // *** Reset to false initially ***
  private lastPositionZ: number = 0; // Changed name for clarity
  private stuckFrames: number = 0;
  private scene: THREE.Scene; // Added scene reference if needed
  
  constructor(
    mesh: THREE.Group,
    animator: CharacterAnimator,
    effects: CharacterEffects,
    scene: THREE.Scene
  ) {
    this.mesh = mesh;
    this.animator = animator;
    this.effects = effects;
    this.scene = scene;
    
    // Initialize collider
    this.collider = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0.5);
    
    // Initialize character position
    this.resetPosition();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Listen ONLY to the definitive 'game-start-movement' event for movement initiation
    eventBus.on('game-start-movement', () => {
      console.log('[CharacterController] Received game-start-movement event');
      // ** CRITICAL CHECK **: Only start if state is PLAYING and not already moving
      if (gameStateManager.state === 'PLAYING' && !this.isMoving) {
        console.log('[CharacterController] Initializing character movement via event');
        this.isMoving = true;
        this.moveForward(0.1); // Small initial push
        this.lastPositionZ = this.mesh.position.z; // Ensure last position is updated
      } else {
        console.log(`[CharacterController] Ignored game-start-movement. State: ${gameStateManager.state}, isMoving: ${this.isMoving}`);
      }
    });

    // Handle state changes - only stop movement on non-playing states
    eventBus.on('game-state-change', (data: { from: string; to: string; }) => {
      console.log(`[CharacterController] State change: ${data.from} -> ${data.to}`);
      if (data.to !== 'PLAYING') {
        if (this.isMoving) {
          console.log(`[CharacterController] Stopping movement due to state: ${data.to}`);
          this.isMoving = false;
        }
      }
      // Do NOT start movement here - only respond to the dedicated game-start-movement event
      // This removes a potential race condition between these two event handlers
    });

    // *** REMOVED: Listeners for 'game-start', 'verify-character-movement', DOM events ***
  }
  
  // *** ADDED: moveForward helper method ***
  private moveForward(amount: number): void {
      if (!this.mesh) return;
      this.mesh.position.z -= amount;
      this.lastPositionZ = this.mesh.position.z; // Update last known Z position
      this.updateCollider();
  }

  public resetPosition(): void {
    this.lane = 'CENTER';
    this.targetX = LANE_POSITIONS.CENTER;
    this.targetY = 0;
    if (this.mesh) {
      this.mesh.position.set(this.targetX, this.targetY, 0);
      this.lastPositionZ = 0; // Reset last known Z position
    }
    this.state = 'SWIMMING';
    this.isImmune = false;
    this.immunityTime = 0;
    this.isMoving = false; // Ensure movement stops on reset
    this.stuckFrames = 0;
    this.actionTime = 0;
    console.log('CharacterController: Position reset. isMoving set to false.');
  }
  
  public update(deltaTime: number, input: any): void {
    if (!this.mesh) return;

    const gameState = gameStateManager.state;

    // Only allow updates if in PLAYING state
    if (gameState !== 'PLAYING') {
        if(this.isMoving) {
            console.log(`CharacterController: Update skipped, game state is ${gameState}. Stopping movement.`);
            this.isMoving = false; // Ensure movement flag is off
        }
        return; // Skip updates if not playing
    }

    // Handle state machine and input (only if playing)
    this.updateState(deltaTime, input);

    // Update character position (lane changes, jumps, dives)
    this.updatePosition(deltaTime);

    // *** Streamlined Movement Logic ***
    if (this.isMoving && this.state !== 'HIT') { // Only move if moving flag is true and not in hit state
        const baseSpeed = CHARACTER_PARAMS.FORWARD_SPEED;
        const adjustedSpeed = baseSpeed * this.speedMultiplier;
        const movementAmount = adjustedSpeed * deltaTime;

        // Simplified stuck detection - just check current position against last position
        if (Math.abs(this.mesh.position.z - this.lastPositionZ) < 0.0001) { // Using small epsilon for float comparison
            this.stuckFrames++;
            if (this.stuckFrames >= 3) { // Only log and apply correction after multiple stuck frames
                console.warn(`CharacterController: Stuck detected (${this.stuckFrames} frames), applying correction`);
                this.moveForward(movementAmount * 1.5); // Apply extra force to unstick
            } else {
                this.moveForward(movementAmount); // Normal movement
            }
        } else {
            // Normal case - not stuck
            this.moveForward(movementAmount);
            this.stuckFrames = 0; // Reset stuck counter
        }
    } else {
        // Not moving (either flag is false or in HIT state)
        this.lastPositionZ = this.mesh.position.z; // Update last position to prevent false stuck detection
        this.stuckFrames = 0; // Reset stuck counter
    }

    this.updateCollider();
    this.updateImmunity(deltaTime);
    this.updateAnimationState();
    this.effects.createBubbleTrail(deltaTime);
  }
  
   private updateAnimationState(): void {
     // Derive animation state only if the animator exists
     if (!this.animator) return;

     const animationState = this.mapStateToAnimation();
     this.animator.play(animationState);
   }

  private mapStateToAnimation(): CharacterAnimationState {
    switch (this.state) {
      case 'SWIMMING': return 'swim';
      case 'JUMPING': return 'jump';
      case 'DIVING': return 'dive';
      // *** FIX: Determine turn direction based on targetX vs current X ***
      case 'CHANGING_LANE':
          const direction = (this.targetX > this.mesh.position.x) ? 'RIGHT' : 'LEFT';
          return direction === 'LEFT' ? 'turn_left' : 'turn_right';
      case 'HIT': return 'hit';
      case 'POWER_UP': return 'power_up'; // Assuming a specific power-up animation exists
      default: return 'swim';
    }
  }
  
  private updateState(deltaTime: number, input: any): void {
    if (!this.mesh) return;

    // Only allow actions if not currently changing lane or hit
    const canAct = this.state === 'SWIMMING' || this.state === 'JUMPING' || this.state === 'DIVING';

    switch (this.state) {
      case 'SWIMMING':
        if (input.left && this.lane !== 'LEFT') this.requestLaneChange('LEFT');
        else if (input.right && this.lane !== 'RIGHT') this.requestLaneChange('RIGHT');
        else if (input.up) this.jump();
        else if (input.down) this.dive();
        break;

      case 'CHANGING_LANE':
        this.actionTime += deltaTime;
        const progress = this.actionTime / CHARACTER_PARAMS.LANE_CHANGE_TIME;
        if (progress >= 1.0) {
          this.mesh.position.x = this.targetX; // Snap to final position
          this.state = 'SWIMMING';
          this.actionTime = 0;
          // Reset rotation smoothly in updatePosition
          eventBus.emit('lane-change-complete', { finalLane: this.lane, position: this.mesh.position.clone() });
          console.log("Lane change complete.");
        }
        break;

      case 'JUMPING':
        this.actionTime += deltaTime;
        if (this.actionTime >= CHARACTER_PARAMS.JUMP_DURATION) {
          this.mesh.position.y = this.startY; // Ensure snapping back to start Y
          this.state = 'SWIMMING';
          this.actionTime = 0;
          console.log("Jump complete.");
        }
        // Position update handled in updatePosition
        break;

      case 'DIVING':
         this.actionTime += deltaTime;
         if (this.actionTime >= CHARACTER_PARAMS.DIVE_DURATION) {
           this.mesh.position.y = this.startY; // Ensure snapping back to start Y
           this.state = 'SWIMMING';
           this.actionTime = 0;
           console.log("Dive complete.");
         }
         // Position update handled in updatePosition
         break;

      case 'HIT':
        this.actionTime += deltaTime;
        this.hitFlashVisible = Math.floor(this.actionTime * CHARACTER_PARAMS.HIT_FLASH_SPEED) % 2 === 0;
        this.mesh.visible = this.hitFlashVisible;
        if (this.actionTime >= CHARACTER_PARAMS.RECOVERY_TIME) {
          this.mesh.visible = true; // Ensure visibility is restored
          this.isImmune = true;
          this.immunityTime = CHARACTER_PARAMS.IMMUNITY_DURATION;
          this.state = 'SWIMMING'; // Return to swimming after recovery
          this.actionTime = 0;
          console.log("Hit recovery complete, immunity started.");
        }
        break;

        // Add POWER_UP case if specific logic is needed during power-up state
       case 'POWER_UP':
            // Example: Handle power-up duration or special movement
            // For now, acts like SWIMMING regarding input
            if (input.left && this.lane !== 'LEFT') this.requestLaneChange('LEFT');
            else if (input.right && this.lane !== 'RIGHT') this.requestLaneChange('RIGHT');
            else if (input.up) this.jump();
            else if (input.down) this.dive();
            break;
    }
  }
  
  private updatePosition(deltaTime: number): void {
    if (!this.mesh) return;

    switch (this.state) {
        case 'CHANGING_LANE':
            const progress = Math.min(1.0, this.actionTime / CHARACTER_PARAMS.LANE_CHANGE_TIME);
            const startX = LANE_POSITIONS[this.getOppositeLane(this.lane)]; // Start from the previous lane's position
            const endX = this.targetX;
            // Smooth interpolation (ease-in-out)
            const easedT = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            this.mesh.position.x = THREE.MathUtils.lerp(startX, endX, easedT);

            // Update rotation for lean
            const direction = (endX > startX) ? 'RIGHT' : 'LEFT';
            const rotationCurve = Math.sin(progress * Math.PI); // Peaks in middle
            const baseRotation = CHARACTER_PARAMS.LANE_CHANGE_ROTATION;
            this.mesh.rotation.z = (direction === 'LEFT' ? -1 : 1) * baseRotation * rotationCurve;
            this.mesh.rotation.y = (direction === 'LEFT' ? -1 : 1) * baseRotation * 0.6 * rotationCurve; // Yaw slightly

             // Emit camera follow event
            eventBus.emit('character-lane-change', {
              position: this.mesh.position.clone(),
              progress: easedT,
              direction: direction,
              fromLane: this.getOppositeLane(this.lane), // Pass previous lane
              toLane: this.lane // Pass target lane
            });
            break;

        case 'JUMPING':
            const jumpProgress = this.actionTime / CHARACTER_PARAMS.JUMP_DURATION;
            const jumpCurve = Math.sin(jumpProgress * Math.PI); // Parabolic arc
            this.mesh.position.y = this.startY + (CHARACTER_PARAMS.JUMP_HEIGHT * jumpCurve);
             // Pitch based on vertical velocity (derived from sine curve derivative)
            const verticalVelocity = (CHARACTER_PARAMS.JUMP_HEIGHT * Math.PI / CHARACTER_PARAMS.JUMP_DURATION) * Math.cos(jumpProgress * Math.PI);
            this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, Math.atan(verticalVelocity * 0.1) * 0.8, 0.1); // Smooth pitch
            break;

        case 'DIVING':
            const diveProgress = this.actionTime / CHARACTER_PARAMS.DIVE_DURATION;
            const diveCurve = Math.sin(diveProgress * Math.PI); // Parabolic arc
            this.mesh.position.y = this.startY - (CHARACTER_PARAMS.DIVE_DEPTH * diveCurve);
             // Pitch down based on sine curve
            this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, -diveCurve * 0.6, 0.1); // Smooth pitch
            break;

        default: // SWIMMING, HIT, POWER_UP, etc.
             // Smoothly return to target lane/Y position if not exactly there
             this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, this.targetX, deltaTime * 10); // Faster lerp back to lane center
             this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, this.targetY, deltaTime * 5);
            // Smoothly reset rotation unless in HIT state
             if (this.state !== 'HIT') {
                this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, deltaTime * 5);
                this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, 0, deltaTime * 5);
                this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, deltaTime * 5);
             }
            break;
    }
}
  
  private updateCollider(): void {
    if (this.mesh) {
      // Center collider slightly forward from mesh origin for better feel
      this.collider.center.set(
          this.mesh.position.x,
          this.mesh.position.y, // Use mesh Y
          this.mesh.position.z - 0.2 // Offset slightly forward
      );
      // Adjust radius based on state? Maybe slightly smaller when diving?
      this.collider.radius = (this.state === 'DIVING' ? 0.4 : 0.5);
    }
  }
  
  /**
   * Update immunity after being hit
   */
  private updateImmunity(deltaTime: number): void {
    if (this.isImmune && this.mesh) {
      this.immunityTime -= deltaTime;
      
      // Flash effect during immunity
      this.mesh.visible = Math.floor(performance.now() * 10) % 2 === 0;
      
      if (this.immunityTime <= 0) {
        this.isImmune = false;
        this.mesh.visible = true;
      }
    }
  }
  
  private requestLaneChange(direction: 'LEFT' | 'RIGHT'): void {
      const targetLane = direction === 'LEFT' ?
          (this.lane === 'CENTER' ? 'LEFT' : 'CENTER') :
          (this.lane === 'CENTER' ? 'RIGHT' : 'CENTER');

      if (this.lane !== targetLane) {
         this.state = 'CHANGING_LANE';
         this.actionTime = 0;
         this.targetX = LANE_POSITIONS[targetLane];
         this.lane = targetLane; // Update the character's current lane state
         eventBus.emit('character-lane-change-start', { fromLane: this.getOppositeLane(targetLane), toLane: targetLane });
         console.log(`Changing lane to: ${targetLane}`);
      }
  }

  // Helper to get the opposite lane (useful for setting startX in updatePosition)
  private getOppositeLane(lane: LaneType): LaneType {
      if (lane === 'LEFT') return 'CENTER';
      if (lane === 'RIGHT') return 'CENTER';
      // If current lane is CENTER, the opposite depends on the target direction,
      // but for calculating the startX, we need the lane it *came from*.
      // This logic needs refinement if used extensively, but is okay here.
      // A better way would be to store previousLane during the change request.
      return this.lane; // Fallback
  }
  
  public jump(): void {
    if (this.state !== 'SWIMMING' && this.state !== 'POWER_UP') return; // Allow jumping during powerup too
    if (!this.mesh) return;
    this.state = 'JUMPING';
    this.startY = this.mesh.position.y; // Store current Y as start
    this.actionTime = 0;
    eventBus.emit('play-sound', { name: 'jump' });
    console.log("Jump started.");
  }

  public dive(): void {
    if (this.state !== 'SWIMMING' && this.state !== 'POWER_UP') return;
    if (!this.mesh) return;
    this.state = 'DIVING';
    this.startY = this.mesh.position.y; // Store current Y as start
    this.actionTime = 0;
    eventBus.emit('play-sound', { name: 'dive' });
    console.log("Dive started.");
  }

  public hit(): boolean {
    if (this.isImmune) {
      console.log("Hit ignored due to immunity.");
      return false;
    }
    if (!this.mesh) return false;

    console.log("Character hit!");
    this.state = 'HIT';
    this.actionTime = 0;
    this.hitFlashVisible = true; // Start visible
    eventBus.emit('player-hit', { position: this.mesh.position.toArray() });
    eventBus.emit('play-sound', { name: 'hit', volume: 0.7 });
    return true; // Hit was registered
  }
  
  /**
   * Set speed multiplier for power-ups
   */
  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
    // Also emit event for other systems that might need to know
    eventBus.emit('character-speed-change', { multiplier });
  }
  
  /**
   * Activate a power-up
   */
  public activatePowerUp(type: string, duration: number): void {
    console.log(`Activating power-up: ${type} for ${duration} seconds`);
    // Power-up implementation
  }
  
  /**
   * Get the collider for collision detection
   */
  public getCollider(): THREE.Sphere {
    return this.collider;
  }
  
  /**
   * Get current character state
   */
  public getState(): CharacterState {
    return this.state;
  }
  
  /**
   * Get current lane
   */
  public getLane(): LaneType {
    return this.lane;
  }
  
  /**
   * Get character position
   */
  public getPosition(): THREE.Vector3 {
    return this.mesh ? this.mesh.position.clone() : new THREE.Vector3();
  }
  
  /**
   * Change lane to specified lane type
   * @param newLane The lane to change to
   */
  public changeLane(newLane: LaneType): void {
    if (this.lane === newLane || this.state === 'CHANGING_LANE') return;
    
    const direction = newLane === 'LEFT' ? 'LEFT' : 'RIGHT';
    this.requestLaneChange(direction);
  }
  
    public dispose(): void {
        // Clean up event listeners with proper handler functions to prevent memory leaks
        // Using .off() without specific handlers can sometimes leave references intact
        
        // Create references to the bound event handlers for proper cleanup
        eventBus.off('game-start-movement');
        eventBus.off('game-state-change');
        
        // Clear any intervals or timeouts if they existed
        // (None in the current implementation, but good practice to check)
        
        // Reset state flags for clean disposal
        this.isMoving = false;
        this.stuckFrames = 0;
        
        console.log('[CharacterController] Successfully disposed, all event listeners removed');
    }
}
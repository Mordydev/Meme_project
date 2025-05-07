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
  private laneChangeDirection: 'LEFT' | 'RIGHT' | null = null;
  
  // Game state
  private isImmune: boolean = false;
  private immunityTime: number = 0;
  private hitFlashVisible: boolean = true;
  private lastBubbleTime: number = 0;
  private speedMultiplier: number = 1.0;
  private isMoving: boolean = false;
  private lastPosition: number = 0;  // Track last position for stuck detection
  private stuckFrameCount: number = 0;
  
  private scene: THREE.Scene;
  
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
  
  /**
   * Set up event listeners for character control
   */
  private setupEventListeners(): void {
    // Enhanced event listeners with multiple redundant checks for movement initialization
    
    // 1. Listen for game-start-movement event - this is the primary trigger
    eventBus.on('game-start-movement', (data: any) => {
      console.log('Character movement started from game-start-movement event!', data);
      
      // Set flag and force movement
      this.isMoving = true;
      this.moveForward(0.1); // More significant initial movement
      
      // Set up staggered movement verification
      this.setupMovementVerification();
    });
    
    // 2. Listen for direct game-start events as a backup
    eventBus.on('game-start', (data: any) => {
      console.log('Character movement started from game-start event!', data);
      
      // Set flag and force movement
      this.isMoving = true;
      this.moveForward(0.1);
      
      // Set up staggered movement verification
      this.setupMovementVerification();
      
      // Emit game-start-movement as well for redundancy
      eventBus.emit('game-start-movement', { 
        startTime: Date.now(),
        source: 'game-start-event-relay'
      });
    });
    
    // 3. Listen for game state changes - most reliable approach
    eventBus.on('game-state-change', (data: { from: string; to: string; }) => {
      console.log('Character received game state change:', data.from, '->', data.to);
      
      if (data.to === 'PLAYING') {
        console.log('Character movement started from state change to PLAYING!');
        
        // Set flag and force movement
        this.isMoving = true;
        this.moveForward(0.1); // More significant initial movement
        
        // Set up staggered movement verification
        this.setupMovementVerification();
        
        // Also emit the movement event for other systems
        eventBus.emit('game-start-movement', { 
          startTime: Date.now(),
          source: 'state-change-to-playing'
        });
      } 
      // Handle other state transitions
      else if (data.to === 'READY') {
        // Prepare for movement but don't start yet
        console.log('Character preparing for movement in READY state');
        this.isMoving = false;
      }
      else if (data.to === 'MENU' || data.to === 'GAME_OVER' || data.to === 'PAUSED') {
        // Stop movement for these states
        this.isMoving = false;
        console.log('Character movement stopped due to state change to', data.to);
      }
    });
    
    // Additional emergency failsafe - check for movement every second for the first few seconds
    // This helps catch cases where all events somehow fail
    for (let delay of [1000, 2000, 3000, 5000]) {
      setTimeout(() => {
        // Only run if in PLAYING state but not moving
        if (gameStateManager.state === 'PLAYING' && !this.isMoving) {
          console.log(`EMERGENCY FAILSAFE (${delay}ms): Force-enabling character movement!`);
          this.isMoving = true;
          this.moveForward(0.5); // Significant movement to "kick-start"
        }
      }, delay);
    }
  }
  
  /**
   * Set up comprehensive staggered verifications of movement with escalating responses
   */
  private setupMovementVerification(): void {
    // Enhanced set of verification delays with more frequent early checks and longer-term tracking
    const verificationDelays = [20, 50, 100, 200, 300, 500, 750, 1000, 2000, 3000];
    
    // Also listen for DOM events as a last-resort backup channel
    try {
      document.addEventListener('nemo-game-start-movement', (event: any) => {
        // Force movement from the DOM event as well
        console.log('Character received DOM event for movement start!', event.detail);
        this.isMoving = true;
        
        // Get force value if available
        const force = event.detail?.force || 5;
        this.moveForward(0.1 * force);
      });
    } catch (e) {
      // Ignore errors in DOM event handling
    }
    
    // Listen for direct verification events
    eventBus.on('verify-character-movement', (data: any) => {
      console.log('Character received explicit movement verification request!', data);
      
      // Force movement with the provided force value or a default
      const force = data.force || 5;
      
      if (!this.isMoving) {
        console.error('CRITICAL: Character found not moving during verification!');
        this.isMoving = true;
      }
      
      // Apply a significant movement to ensure progress
      this.moveForward(0.1 * force);
      
      // Store this position for verification on next frame
      const lastVerifiedPosition = this.mesh ? this.mesh.position.z : 0;
      
      // Schedule a follow-up check to verify the movement took effect
      setTimeout(() => {
        if (this.mesh && lastVerifiedPosition === this.mesh.position.z) {
          console.error('CRITICAL: Character failed movement verification check!');
          this.moveForward(0.5); // Very significant movement as last resort
        }
      }, 50);
    });
    
    // Staggered verification with escalating responses
    for (let i = 0; i < verificationDelays.length; i++) {
      const delay = verificationDelays[i];
      const isLateVerification = i >= 5; // Consider later checks as more critical
      
      setTimeout(() => {
        // Skip verification if component is disposed
        if (!this.mesh) return;
        
        // Get current game state with safety check
        const currentGameState = gameStateManager ? gameStateManager.state : 'UNKNOWN';
        
        // First verification: check if movement flag is false but should be true
        if (!this.isMoving && currentGameState === 'PLAYING') {
          console.warn(`VERIFICATION FAILSAFE (${delay}ms): Movement flag is FALSE in PLAYING state!`);
          
          // Calculate force based on delay and criticality
          const baseForce = 0.05 * (delay / 100);
          const criticalityMultiplier = isLateVerification ? 5 : 1;
          const forceAmount = baseForce * criticalityMultiplier;
          
          // Enable movement flag and apply force
          this.isMoving = true;
          this.moveForward(forceAmount);
          
          // For very late verifications, log critical error
          if (isLateVerification) {
            console.error(`CRITICAL: Character still not moving after ${delay}ms in PLAYING state!`);
          }
        }
        
        // Second verification: check if character is stuck in place
        if (this.isMoving && this.mesh && this.lastPosition === this.mesh.position.z) {
          console.warn(`STUCK FAILSAFE (${delay}ms): Character position unchanged despite isMoving=true!`);
          
          // Calculate larger force for stuck situation
          const baseForce = 0.1 * (delay / 100);
          const criticalityMultiplier = isLateVerification ? 10 : 2;
          const forceAmount = Math.min(baseForce * criticalityMultiplier, 2.0); // Cap at reasonable maximum
          
          // Apply the force
          this.moveForward(forceAmount);
          
          // For late verifications, take more dramatic action
          if (isLateVerification) {
            console.error(`CRITICAL: Character stuck detection after ${delay}ms! Taking emergency action...`);
            
            // Reset character position slightly ahead as last resort
            if (this.mesh) {
              // Teleport character forward as a last resort for very late checks
              this.mesh.position.z -= 2.0;
              this.lastPosition = this.mesh.position.z;
              
              // Make sure collider is updated
              this.updateCollider();
              
              console.log(`Emergency teleport: new position z=${this.mesh.position.z}`);
            }
          }
        }
        
        // For early checks, log verification attempt for debugging
        if (!isLateVerification) {
          console.log(`Movement verification at ${delay}ms: isMoving=${this.isMoving}, position=${this.mesh?.position.z.toFixed(2)}, gameState=${currentGameState}`);
        }
      }, delay);
    }
  }
  
  /**
   * Helper method to move character forward by specified amount
   */
  private moveForward(amount: number): void {
    if (this.mesh) {
      console.log(`Moving character forward by ${amount}`);
      this.mesh.position.z -= amount;
      
      // Store last position for stuck detection
      this.lastPosition = this.mesh.position.z;
      
      // Update collider
      this.updateCollider();
    }
  }
  
  /**
   * Reset character position
   */
  public resetPosition(): void {
    this.lane = 'CENTER';
    this.targetX = LANE_POSITIONS.CENTER;
    this.targetY = 0;
    if (this.mesh) {
      this.mesh.position.set(this.targetX, this.targetY, 0);
    }
    this.state = 'SWIMMING';
    this.isImmune = false;
    this.immunityTime = 0;
    this.isMoving = false; // Reset movement flag
    
    console.log('Character position reset. isMoving set to false.');
  }
  
  /**
   * Update character state and position
   */
  public update(deltaTime: number, input: any): void {
    // Skip update if mesh doesn't exist
    if (!this.mesh) return;
    
    // Handle state machine
    this.updateState(deltaTime, input);
    
    // Update character position
    this.updatePosition(deltaTime);
    
    // Get current game state with extra safety check
    const gameState = gameStateManager ? gameStateManager.state : 'UNKNOWN';
    
    // CRUCIAL FIX: Force movement in PLAYING state, even if isMoving flag is false
    if (gameState === 'PLAYING' && !this.isMoving) {
      console.warn(`Character movement flag was FALSE despite PLAYING state! Force-enabling movement.`);
      this.isMoving = true;
      // Make a significant initial movement to ensure we're actually moving
      this.moveForward(0.2); 
    }
    
    // Only stop movement if we're in a non-playing state
    if (gameState !== 'PLAYING' && gameState !== 'UNKNOWN' && this.isMoving) {
      console.log(`Character stopping movement due to game state ${gameState}`);
      this.isMoving = false;
    }
    
    // Comprehensive debug logging to diagnose issues
    const shouldLogDetailed = Math.random() < 0.02; // Reduce frequency to avoid log spam
    if (shouldLogDetailed) {
      console.log(`Character update: isMoving=${this.isMoving}, state=${this.state}, gameState=${gameState}, position=${this.mesh.position.z.toFixed(2)}`);
    }
    
    // ENHANCED STUCK DETECTION with multi-frame detection
    const isExactlySamePosition = this.lastPosition === this.mesh.position.z;
    
    if (this.isMoving && isExactlySamePosition) {
      // We're supposed to be moving but position hasn't changed at all
      this.stuckFrameCount += 1;
      
      // Only consider truly stuck after 2 consecutive stuck frames
      if (this.stuckFrameCount >= 2) {
        console.warn(`Character appears DEFINITELY stuck for ${this.stuckFrameCount} frames! Forcing significant movement. Last Z:`, this.lastPosition);
        
        // Scale force based on how long we've been stuck
        const forceAmount = Math.min(0.2 * this.stuckFrameCount, 1.0);
        
        // Force a larger movement proportional to stuck time to kick-start
        this.moveForward(forceAmount);
        
        // Emit a debug event for stuck detection
        eventBus.emit('character-stuck-detection', {
          position: this.mesh.position.clone(),
          state: this.state,
          gameState: gameState,
          stuckFrames: this.stuckFrameCount
        });
        
        // Reset the stuck frame counter after we've taken action
        // but only if we've actually moved after the force
        if (this.mesh.position.z !== this.lastPosition) {
          this.stuckFrameCount = 0;
        }
      }
    } else {
      // We've moved, reset stuck counter
      this.stuckFrameCount = 0;
    }
    
    // Move character forward automatically if allowed to move
    if (this.isMoving) {
      // Only restrict movement if in HIT state
      if (this.state === 'HIT') {
        // Skip movement during hit recovery
      }
      else {
        // Calculate base forward speed
        const baseSpeed = CHARACTER_PARAMS.FORWARD_SPEED;
        const speedMultiplier = this.speedMultiplier;
        const adjustedSpeed = baseSpeed * speedMultiplier;
        
        // Add a small constant minimum movement to prevent getting completely stuck
        const minimumMovement = 0.01; // Guarantee at least some movement every frame
        const calculatedMovement = (adjustedSpeed * deltaTime) + minimumMovement;
        
        // Apply the movement with comprehensive logging
        this.moveForward(calculatedMovement);
        
        // Detailed movement logging for debugging
        if (shouldLogDetailed) {
          console.log(`Character moving: pos=${this.mesh.position.z.toFixed(3)}, speed=${adjustedSpeed.toFixed(2)}, delta=${deltaTime.toFixed(4)}, move=${calculatedMovement.toFixed(4)}`);
        }
      }
    } else if (gameState === 'PLAYING') {
      // FAILSAFE: We're not moving but should be - force movement
      console.warn(`NOT MOVING despite PLAYING state! Emergency override... (state=${this.state})`);
      this.isMoving = true;
      this.moveForward(0.2); // Significant immediate movement to kick-start
      
      // Log a critical error since this shouldn't happen
      console.error('CRITICAL: Character movement flag was false in PLAYING state after all checks');
    }
    
    // Always store current position for next frame's stuck detection
    this.lastPosition = this.mesh.position.z;
    
    // Update collider position
    this.updateCollider();
    
    // Update immunity
    this.updateImmunity(deltaTime);
    
    // Update animations based on current state
    this.updateAnimationState();
    
    // Create bubble trail
    this.effects.createBubbleTrail(deltaTime);
  }
  
  /**
   * Update animation state based on character state
   */
  private updateAnimationState(): void {
    const animationState = this.mapStateToAnimation();
    this.animator.play(animationState);
  }
  
  /**
   * Map character state to animation state
   */
  private mapStateToAnimation(): CharacterAnimationState {
    switch (this.state) {
      case 'SWIMMING':
        return 'swim';
      case 'JUMPING':
        return 'jump';
      case 'DIVING':
        return 'dive';
      case 'CHANGING_LANE':
        return this.laneChangeDirection === 'LEFT' ? 'turn_left' : 'turn_right';
      case 'HIT':
        return 'hit';
      case 'POWER_UP':
        return 'power_up';
      default:
        return 'swim';
    }
  }
  
  /**
   * Update character state based on input and current state
   */
  private updateState(deltaTime: number, input: any): void {
    if (!this.mesh) return;
    
    // Process input and state transitions
    switch (this.state) {
      case 'SWIMMING':
        // Handle lane changes
        if (input.left && this.lane !== 'LEFT') {
          this.changeLane('LEFT');
        } else if (input.right && this.lane !== 'RIGHT') {
          this.changeLane('RIGHT');
        }
        
        // Handle jump
        if (input.up) {
          this.jump();
        }
        
        // Handle dive
        if (input.down) {
          this.dive();
        }
        break;
        
      case 'CHANGING_LANE':
        // Update lane change progress
        this.actionTime += deltaTime;
        if (this.actionTime >= CHARACTER_PARAMS.LANE_CHANGE_TIME) {
          // Lane change complete
          this.mesh.position.x = this.targetX;
          this.laneChangeDirection = null;
          
          // Reset rotations gradually to normal position
          this.mesh.rotation.z = 0;
          this.mesh.rotation.y = 0;
          
          // Create a final "finish" effect for the lane change
          this.effects.createLaneChangeFinishEffect(this.lane);
          
          // Extract the saved previous state from the emit event data
          eventBus.emit('lane-change-complete', {
            finalLane: this.lane,
            position: this.mesh.position.clone()
          });
          
          // Return to SWIMMING state always for simplicity and consistency
          this.state = 'SWIMMING';
        }
        break;
        
      case 'JUMPING':
        // Update jump progress
        this.actionTime += deltaTime;
        if (this.actionTime >= CHARACTER_PARAMS.JUMP_DURATION) {
          // Jump complete
          this.state = 'SWIMMING';
          this.mesh.position.y = this.targetY;
        } else {
          // Calculate jump height using sine curve for smooth motion
          const jumpProgress = this.actionTime / CHARACTER_PARAMS.JUMP_DURATION;
          const jumpCurve = Math.sin(jumpProgress * Math.PI);
          this.mesh.position.y = this.startY + (CHARACTER_PARAMS.JUMP_HEIGHT * jumpCurve);
        }
        break;
        
      case 'DIVING':
        // Update dive progress
        this.actionTime += deltaTime;
        if (this.actionTime >= CHARACTER_PARAMS.DIVE_DURATION) {
          // Dive complete
          this.state = 'SWIMMING';
          this.mesh.position.y = this.targetY;
        } else {
          // Calculate dive depth using sine curve for smooth motion
          const diveProgress = this.actionTime / CHARACTER_PARAMS.DIVE_DURATION;
          const diveCurve = Math.sin(diveProgress * Math.PI);
          this.mesh.position.y = this.startY - (CHARACTER_PARAMS.DIVE_DEPTH * diveCurve);
        }
        break;
        
      case 'HIT':
        // Update hit recovery
        this.actionTime += deltaTime;
        
        // Flash effect
        this.hitFlashVisible = Math.floor(this.actionTime * CHARACTER_PARAMS.HIT_FLASH_SPEED) % 2 === 0;
        this.mesh.visible = this.hitFlashVisible;
        
        if (this.actionTime >= CHARACTER_PARAMS.RECOVERY_TIME) {
          // Hit recovery complete
          this.state = 'SWIMMING';
          this.mesh.visible = true;
          this.isImmune = true;
          this.immunityTime = CHARACTER_PARAMS.IMMUNITY_DURATION;
        }
        break;
        
      case 'POWER_UP':
        // Power-up state handling
        break;
    }
  }
  
  /**
   * Update character position based on movement parameters
   */
  private updatePosition(deltaTime: number): void {
    if (!this.mesh) return;
    
    // Handle lane change movement
    if (this.state === 'CHANGING_LANE' && this.laneChangeDirection) {
      // Calculate progress through the lane change (0 to 1)
      const progress = this.actionTime / CHARACTER_PARAMS.LANE_CHANGE_TIME;
      const t = Math.min(progress, 1.0); // Clamp to 1.0
      
      // Determine if we're changing to the center lane
      const toCenter = this.lane === 'CENTER' ? false : true;
      
      // Debug logging
      if (CHARACTER_PARAMS.DEBUG_LANE_CHANGES && Math.random() < 0.05) {
        console.log(`Lane change progress: ${t.toFixed(2)}, to center: ${toCenter}`);
      }
      
      // Universal smooth easing function for all lane changes
      // This creates a natural motion curve with gentle acceleration and deceleration
      const universalEasing = (t: number): number => {
        // A blend of sine and cubic easing for maximum smoothness
        
        // Slow at start, fast in middle, slow at end
        if (t < 0.4) {
          // Gentle acceleration phase
          return 0.81 * Math.pow(t / 0.4, 2); // Quadratic ease-in
        } else if (t < 0.6) {
          // Linear middle section for consistent speed
          return 0.81 + (t - 0.4) * 0.38 / 0.2; // Linear section
        } else {
          // Gentle deceleration phase
          // Use cubic ease-out for final approach
          const x = (t - 0.6) / 0.4;
          return 0.81 + 0.38 + 0.38 * (1 - Math.pow(1 - x, 3));
        }
      };
      
      // Apply easing
      const easedT = universalEasing(t);
      
      // Determine start and end X positions
      const startX = this.mesh.position.x; // Current position as start
      const endX = LANE_POSITIONS[this.lane]; // Target position
      
      // Calculate current position
      this.mesh.position.x = startX + (endX - startX) * easedT;
      
      // Calculate rotation based on direction and progress
      // For a natural feel, the fish should "lean" into its turn
      let rotationZ = 0;
      let rotationY = 0;
      
      // Base rotation reduced for smoother feel
      const baseRotation = CHARACTER_PARAMS.LANE_CHANGE_ROTATION;
      
      // Smooth rotation curve with natural feel
      // Peaks in the middle, gradual start and end
      let rotationCurve = Math.sin(t * Math.PI);
      
      // Apply rotation based on direction
      if (this.laneChangeDirection === 'LEFT') {
        // Negative Z rotation to lean left
        rotationZ = -baseRotation * rotationCurve;
        // Small Y rotation for turning into the direction
        rotationY = -baseRotation * 0.6 * rotationCurve;
      } else { // RIGHT
        // Positive Z rotation to lean right
        rotationZ = baseRotation * rotationCurve;
        // Small Y rotation for turning into the direction
        rotationY = baseRotation * 0.6 * rotationCurve;
      }
      
      // Apply rotations for natural movement feel
      this.mesh.rotation.z = rotationZ;
      this.mesh.rotation.y = rotationY;
      
      // Create visual trail effect with increased frequency when turning sharply
      const trailFrequency = toCenter ? 10 : 8; // More bubbles for sharper turns
      if (Math.random() < deltaTime * trailFrequency) {
        this.effects.createLaneChangeTrailEffect(this.laneChangeDirection, toCenter);
      }
      
      // Emit event for camera to follow with position and progress info
      eventBus.emit('character-lane-change', {
        position: this.mesh.position.clone(),
        progress: easedT,
        direction: this.laneChangeDirection,
        toCenter: toCenter
      });
    } else if (this.state === 'SWIMMING' || this.state === 'JUMPING' || this.state === 'DIVING') {
      // Gradually reset rotations to normal swimming position for all movement states
      this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, deltaTime * 5);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, 0, deltaTime * 5);
    }
  }
  
  /**
   * Update the collider position to match mesh
   */
  private updateCollider(): void {
    if (this.mesh) {
      this.collider.center.set(
        this.mesh.position.x,
        this.mesh.position.y,
        this.mesh.position.z
      );
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
  
  /**
   * Change to a different lane with improved feel and visual feedback
   */
  public changeLane(newLane: LaneType): void {
    // Allow lane changes during swimming, jumping, or diving
    // Only prevent during HIT, POWER_UP or already CHANGING_LANE
    if (this.state === 'HIT' || this.state === 'POWER_UP' || this.state === 'CHANGING_LANE') return;
    
    // Save the current state for restoration after lane change if needed
    const previousState = this.state;
    
    // Calculate lane change direction
    const currentLane = this.lane;
    
    // Debug log the lane change request
    if (CHARACTER_PARAMS.DEBUG_LANE_CHANGES) {
      console.log(`Lane change requested: ${currentLane} → ${newLane}`);
    }
    
    // Prevent invalid lane changes (must go through center)
    if (
      (currentLane === 'LEFT' && newLane === 'RIGHT') ||
      (currentLane === 'RIGHT' && newLane === 'LEFT')
    ) {
      // Must go through center first
      newLane = 'CENTER';
      if (CHARACTER_PARAMS.DEBUG_LANE_CHANGES) {
        console.log(`Redirected to CENTER lane first`);
      }
    }
    
    // Skip if already in target lane
    if (currentLane === newLane) return;
    
    // Set direction
    this.laneChangeDirection = 
      newLane === 'LEFT' ? 'LEFT' : 
      newLane === 'RIGHT' ? 'RIGHT' : null;
    
    // Check if this is a to-center lane change
    const isToCenter = newLane === 'CENTER';
    
    if (CHARACTER_PARAMS.DEBUG_LANE_CHANGES) {
      console.log(`Lane change direction: ${this.laneChangeDirection}, isToCenter: ${isToCenter}`);
    }
    
    // Update lane and target position
    this.lane = newLane;
    this.targetX = LANE_POSITIONS[newLane];
    
    // Create initial "start" effect for lane change (burst of bubbles)
    this.effects.createLaneChangeStartEffect(this.laneChangeDirection);
    
    // Store previous state and change to lane changing state
    this.state = 'CHANGING_LANE';
    this.actionTime = 0;
    
    // Emit an event for starting lane change animation
    eventBus.emit('character-lane-change-start', {
      fromLane: currentLane,
      toLane: newLane,
      previousState: previousState,
      isToCenter: isToCenter
    });
    
    // Emit an event to play the lane change start sound
    eventBus.emit('play-sound', { name: 'lane-change', volume: 0.2 });
  }
  
  /**
   * Jump upward
   */
  public jump(): void {
    // Only jump if currently swimming and mesh exists
    if (this.state !== 'SWIMMING' || !this.mesh) return;
    
    this.state = 'JUMPING';
    this.startY = this.mesh.position.y;
    this.actionTime = 0;
  }
  
  /**
   * Dive downward
   */
  public dive(): void {
    // Only dive if currently swimming and mesh exists
    if (this.state !== 'SWIMMING' || !this.mesh) return;
    
    this.state = 'DIVING';
    this.startY = this.mesh.position.y;
    this.actionTime = 0;
  }
  
  /**
   * Handle character being hit by an obstacle
   */
  public hit(): boolean {
    // If already immune, ignore the hit
    if (this.isImmune) {
      return false;
    }
    
    // Set character to hit state
    this.state = 'HIT';
    this.isImmune = true;
    this.immunityTime = 0;
    this.hitFlashVisible = true;
    this.actionTime = 0;
    
    // Emit event for game logic and sound effects
    if (this.mesh) {
      eventBus.emit('player-hit', { position: this.mesh.position.toArray() });
    }
    
    return true;
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
   * Clean up resources
   */
  public dispose(): void {
    // Clean up event listeners
    eventBus.off('game-update', () => {});
    eventBus.off('game-start-movement', () => {});
    eventBus.off('game-state-change', () => {});
    
    // Log cleanup
    console.log('Character controller resources disposed');
  }
}
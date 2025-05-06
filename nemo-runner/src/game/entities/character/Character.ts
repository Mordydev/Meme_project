import * as THREE from 'three';
import eventBus from '../../core/EventSystem';
import { AssetManager } from '../../core/AssetManager';

// Character state
type CharacterState = 'SWIMMING' | 'JUMPING' | 'DIVING' | 'CHANGING_LANE' | 'HIT' | 'POWER_UP';

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

export class Character {
  // Three.js objects
  mesh: THREE.Group;
  collider: THREE.Sphere;
  
  // State
  state: CharacterState = 'SWIMMING';
  lane: 'LEFT' | 'CENTER' | 'RIGHT' = 'CENTER';
  
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
  
  /**
   * Handle character being hit by an obstacle
   * @returns true if the hit was registered, false if character is immune
   */
  hit(): boolean {
    // If already immune, ignore the hit
    if (this.isImmune) {
      return false;
    }
    
    // Set character to hit state
    this.state = 'HIT';
    this.isImmune = true;
    this.immunityTime = 0;
    this.hitFlashVisible = true;
    
    // Emit event for game logic and sound effects
    eventBus.emit('player-hit', { position: this.mesh.position.toArray() });
    
    return true;
  }
  
  /**
   * Set speed multiplier for power-ups
   */
  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
    // Also emit event for other systems that might need to know
    eventBus.emit('character-speed-change', { multiplier });
  }
  
  // References
  private scene: THREE.Scene;
  private assetManager: AssetManager;
  
  constructor(scene: THREE.Scene, assetManager: AssetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
    
    // Create character mesh (temporary simple version)
    this.mesh = this.createCharacterMesh();
    this.mesh.position.set(0, 0, 0);
    scene.add(this.mesh);
    
    // Initialize collider
    this.collider = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0.5);
    
    // Initialize character position
    this.resetPosition();
    
    // Listen for game start movement event
    eventBus.on('game-start-movement', () => {
      this.isMoving = true;
      console.log('Character movement started!');
    });
    
    // Listen for game state changes
    eventBus.on('game-state-change', (data: { from: string; to: string; }) => {
      console.log('Character received game state change:', data.from, '->', data.to);
      if (data.to === 'PLAYING') {
        this.isMoving = true;
        console.log('Character movement started from state change!');
      } else if (data.to === 'MENU' || data.to === 'GAME_OVER' || data.to === 'PAUSED') {
        this.isMoving = false;
        console.log('Character movement stopped due to state change to', data.to);
      }
    });
  }
  
  // Simple placeholder for character mesh (will be replaced with proper model)
  private createCharacterMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Fish body (slightly elongated sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 12);
    bodyGeometry.scale(1, 0.7, 1.3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7e00, // Clownfish orange
      roughness: 0.6,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Stripe pattern (simplified as white bands)
    const stripeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1
    });
    
    // Middle stripe
    const stripeGeometry1 = new THREE.CylinderGeometry(0.52, 0.52, 0.2, 16);
    stripeGeometry1.rotateX(Math.PI / 2);
    const stripe1 = new THREE.Mesh(stripeGeometry1, stripeMaterial);
    stripe1.position.z = 0;
    
    // Tail stripe
    const stripeGeometry2 = new THREE.CylinderGeometry(0.52, 0.52, 0.15, 16);
    stripeGeometry2.rotateX(Math.PI / 2);
    const stripe2 = new THREE.Mesh(stripeGeometry2, stripeMaterial);
    stripe2.position.z = 0.5;
    
    // Tail fin
    const tailGeometry = new THREE.ConeGeometry(0.4, 0.8, 16);
    tailGeometry.rotateX(Math.PI / 2);
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5a00,
      roughness: 0.7,
      metalness: 0.1
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.z = 1;
    
    // Side fins
    const finGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    finGeometry.rotateZ(Math.PI / 2);
    const leftFin = new THREE.Mesh(finGeometry, tailMaterial);
    leftFin.position.set(0.5, 0, 0);
    
    const rightFin = new THREE.Mesh(finGeometry, tailMaterial);
    rightFin.rotation.z = Math.PI;
    rightFin.position.set(-0.5, 0, 0);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.25, 0.2, -0.5);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.25, 0.2, -0.5);
    
    // Assemble the fish
    group.add(body);
    group.add(stripe1);
    group.add(stripe2);
    group.add(tail);
    group.add(leftFin);
    group.add(rightFin);
    group.add(leftEye);
    group.add(rightEye);
    
    return group;
  }
  
  // Reset character position
  resetPosition() {
    this.lane = 'CENTER';
    this.targetX = LANE_POSITIONS.CENTER;
    this.targetY = 0;
    this.mesh.position.set(this.targetX, this.targetY, 0);
    this.state = 'SWIMMING';
    this.isImmune = false;
    this.immunityTime = 0;
    this.isMoving = false; // Reset movement flag
    
    console.log('Character position reset. isMoving set to false.');
  }
  
  // Update character state and position
  update(deltaTime: number, input: any) {
    // Handle state machine
    this.updateState(deltaTime, input);
    
    // Update character position
    this.updatePosition(deltaTime);
    
    // Move character forward automatically if allowed to move
    // IMPORTANT: We include 'CHANGING_LANE' state to ensure forward movement during lane changes
    if (this.isMoving && (
      this.state === 'SWIMMING' || 
      this.state === 'JUMPING' || 
      this.state === 'DIVING' ||
      this.state === 'CHANGING_LANE' // Allow forward movement during lane changes
    )) {
      // Move forward based on speed and delta time
      const forwardSpeed = CHARACTER_PARAMS.FORWARD_SPEED * this.speedMultiplier;
      this.mesh.position.z -= forwardSpeed * deltaTime;
      
      // Log position occasionally to debug
      if (Math.random() < 0.01) {
        console.log('Character position:', this.mesh.position.z);
      }
    }
    
    // Update collider position
    this.updateCollider();
    
    // Update immunity
    this.updateImmunity(deltaTime);
    
    // Swim animation (simple oscillation)
    this.updateSwimAnimation(deltaTime);
    
    // Create bubble trail
    this.createBubbleTrail(deltaTime);
  }
  
  // Update character state based on input and current state
  private updateState(deltaTime: number, input: any) {
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
          this.createLaneChangeFinishEffect();
          
          // Extract the saved previous state from the emit event data
          eventBus.emit('lane-change-complete', {
            finalLane: this.lane,
            position: this.mesh.position.clone()
          });
          
          // Return to SWIMMING state always for simplicity and consistency
          // This ensures we don't try to resume complex states like mid-jump or mid-dive
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
        // Power-up state handling will be implemented later
        break;
    }
  }
  
  // Update character position based on movement parameters
  private updatePosition(deltaTime: number) {
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
      // Instead of using startX directly, we'll interpolate from current to target
      // This handles all lane change cases smoothly
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
        this.createLaneChangeTrailEffect();
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
  
  // Create a visual trail effect during lane changes
  private createLaneChangeTrailEffect(): void {
    // Determine if we're changing to the center lane
    const toCenter = this.lane === 'CENTER' ? false : true;
    
    // Enhanced trail effect with cleaner design
    const bubbleSize = 0.03 + Math.random() * 0.06; // Consistent size
    const bubbleGeometry = new THREE.SphereGeometry(bubbleSize, 6, 6);
    
    // Set opacity for clean look
    const bubbleOpacity = 0.5 + Math.random() * 0.2;
    
    // Color based on direction
    let hue: number;
    if (this.laneChangeDirection === 'LEFT') {
      // Blue range for LEFT
      hue = 0.6 + Math.random() * 0.05; 
    } else {
      // Cyan/teal range for RIGHT
      hue = 0.49 + Math.random() * 0.05;
    }
    
    // Clean vibrant colors
    const saturation = 0.8 + Math.random() * 0.2;
    const lightness = 0.65 + Math.random() * 0.15;
    
    const bubbleColor = new THREE.Color().setHSL(hue, saturation, lightness);
    
    const bubbleMaterial = new THREE.MeshBasicMaterial({
      color: bubbleColor,
      transparent: true,
      opacity: bubbleOpacity,
      depthWrite: false
    });
    
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    
    // Position bubble with direction-specific placement
    // Create a nice wake-like pattern behind character
    const offsetX = this.laneChangeDirection === 'LEFT' ? 0.1 : -0.1;
    const tailSpread = 0.15;
    
    bubble.position.set(
      this.mesh.position.x - offsetX + (Math.random() - 0.5) * tailSpread,
      this.mesh.position.y + (Math.random() - 0.5) * 0.12,
      this.mesh.position.z + 0.2 + Math.random() * 0.3
    );
    
    this.scene.add(bubble);
    
    // Animation speed - consistent
    const bubbleLifetime = 0.3 + Math.random() * 0.15;
    let bubbleTime = 0;
    
    const animateBubble = (delta: number) => {
      bubbleTime += delta;
      
      // Smooth curved path with consistent look
      const progress = bubbleTime / bubbleLifetime;
      
      // Direction-based curve
      const curveStrength = this.laneChangeDirection === 'LEFT' ? 1.0 : -1.0;
      
      // Beautiful sine curve for bubble movement
      const curveFactor = Math.sin(progress * Math.PI) * (1 - progress * 0.7);
      const curvePath = Math.sin(bubbleTime * 6) * 0.02 * curveStrength * curveFactor;
      
      // Apply movement
      bubble.position.x += curvePath;
      bubble.position.y += delta * 0.4; // Consistent upward drift
      bubble.position.z += delta * 0.15; // Slight backward drift
      
      // Scale effect
      const baseScale = 1 - (progress * 0.5); // Slower shrinking
      bubble.scale.set(baseScale, baseScale, baseScale);
      
      // Simple color brightening for underwater effect
      bubbleMaterial.color.offsetHSL(0, 0, delta * 0.1);
      
      // Smooth fade out
      bubbleMaterial.opacity = bubbleOpacity * (1 - progress);
      
      // Remove bubble when lifetime ends
      if (bubbleTime >= bubbleLifetime) {
        this.scene.remove(bubble);
        bubbleGeometry.dispose();
        bubbleMaterial.dispose();
        eventBus.off('game-update', animateBubble);
      }
    };
    
    // Subscribe to game updates for bubble animation
    eventBus.on('game-update', animateBubble);
  }
  
  // Create a special effect when lane change finishes
  private createLaneChangeFinishEffect(): void {
    // Determine if we just arrived at the center lane
    const arrivedAtCenter = this.lane === 'CENTER';
    
    // Create a burst of bubbles to show completion
    const numBubbles = arrivedAtCenter ? 12 : 8; // More bubbles for center lane arrival
    
    for (let i = 0; i < numBubbles; i++) {
      // Small bubbles for a refined, professional effect
      const bubbleSize = 0.025 + Math.random() * 0.03;
      const bubbleGeometry = new THREE.SphereGeometry(bubbleSize, 6, 6);
      
      // Color based on lane position - more vibrant for center
      let hue: number;
      if (arrivedAtCenter) {
        // Brighter, happier colors for center lane arrival
        hue = 0.52 + Math.random() * 0.15; // Wider range with more teal/green tones
      } else {
        // Standard colors for other positions
        hue = 0.58 + Math.random() * 0.07; // Narrower blue range
      }
      
      // Bright, clean colors
      const saturation = 0.85;
      const lightness = 0.65 + Math.random() * 0.15;
      
      const bubbleColor = new THREE.Color().setHSL(hue, saturation, lightness);
      
      const bubbleMaterial = new THREE.MeshBasicMaterial({
        color: bubbleColor,
        transparent: true,
        opacity: 0.7, // Higher opacity for better visibility
        depthWrite: false
      });
      
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      
      // Position in a circular pattern around the character
      // Use smaller radius for cleaner effect
      const angle = (i / numBubbles) * Math.PI * 2;
      const radius = 0.15;
      
      bubble.position.set(
        this.mesh.position.x + Math.cos(angle) * radius,
        this.mesh.position.y + Math.sin(angle) * radius,
        this.mesh.position.z + (Math.random() - 0.5) * 0.1 // Less z-variation for cleaner look
      );
      
      this.scene.add(bubble);
      
      // Shorter, more intense animation
      const bubbleLifetime = 0.25 + Math.random() * 0.1;
      let bubbleTime = 0;
      
      const animateBubble = (delta: number) => {
        bubbleTime += delta;
        
        // Progress through animation
        const progress = bubbleTime / bubbleLifetime;
        
        // More dynamic expansion function with faster initial movement
        const expansion = Math.pow(progress, 0.7) * (1 - progress);
        const expansionSpeed = arrivedAtCenter ? 3.0 : 2.0; // Faster for center lane
        
        // Move outward in the circular pattern with smoother curves
        bubble.position.x += Math.cos(angle) * delta * expansionSpeed * expansion;
        bubble.position.y += Math.sin(angle) * delta * expansionSpeed * expansion;
        bubble.position.y += delta * 0.2; // Consistent upward drift
        
        // Scale with subtle pulse for professional feel
        const pulsePhase = progress * Math.PI * 2; // Two complete pulses
        const pulseAmount = 0.15; // Subtle amount
        const scaleEffect = 1 + Math.sin(pulsePhase) * pulseAmount * (1 - progress);
        bubble.scale.set(scaleEffect, scaleEffect, scaleEffect);
        
        // Color shift toward white for underwater "sparkle" effect
        bubbleMaterial.color.offsetHSL(0, -delta * 0.5, delta * 0.3);
        
        // Smooth fade out curve
        bubbleMaterial.opacity = 0.7 * Math.cos(progress * Math.PI/2);
        
        // Remove when lifetime ends
        if (bubbleTime >= bubbleLifetime) {
          this.scene.remove(bubble);
          bubbleGeometry.dispose();
          bubbleMaterial.dispose();
          eventBus.off('game-update', animateBubble);
        }
      };
      
      // Subscribe to game updates for animation
      eventBus.on('game-update', animateBubble);
    }
    
    // Play a sound effect for lane change completion
    // Slightly louder for center lane for better feedback
    const volume = arrivedAtCenter ? 0.5 : 0.4;
    eventBus.emit('play-sound', { name: 'lane-change', volume: volume });
  }
  
  // Update collider position to match mesh
  private updateCollider() {
    this.collider.center.set(
      this.mesh.position.x,
      this.mesh.position.y,
      this.mesh.position.z
    );
  }
  
  // Update immunity after being hit
  private updateImmunity(deltaTime: number) {
    if (this.isImmune) {
      this.immunityTime -= deltaTime;
      
      // Flash effect during immunity
      this.mesh.visible = Math.floor(performance.now() * 10) % 2 === 0;
      
      if (this.immunityTime <= 0) {
        this.isImmune = false;
        this.mesh.visible = true;
      }
    }
  }
  
  // Simple swim animation
  private updateSwimAnimation(deltaTime: number) {
    const time = performance.now() * 0.003;
    
    // Body wobble
    this.mesh.rotation.y = Math.sin(time * 3) * 0.1;
    
    // Tail movement
    if (this.mesh.children[3] instanceof THREE.Mesh) {
      this.mesh.children[3].rotation.y = Math.sin(time * 8) * 0.3;
    }
    
    // Fin movement
    if (this.mesh.children[4] instanceof THREE.Mesh && this.mesh.children[5] instanceof THREE.Mesh) {
      this.mesh.children[4].rotation.x = Math.sin(time * 6) * 0.2;
      this.mesh.children[5].rotation.x = Math.sin(time * 6) * 0.2;
    }
  }
  
  // Create bubble trail effect
  private createBubbleTrail(deltaTime: number) {
    this.lastBubbleTime += deltaTime;
    
    if (this.lastBubbleTime >= CHARACTER_PARAMS.BUBBLE_TRAIL_RATE) {
      this.lastBubbleTime = 0;
      
      // Create a bubble
      const bubbleGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 8, 8);
      const bubbleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      });
      
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      
      // Position bubble slightly behind character
      bubble.position.set(
        this.mesh.position.x + (Math.random() - 0.5) * 0.2,
        this.mesh.position.y + (Math.random() - 0.5) * 0.2,
        this.mesh.position.z + 0.6
      );
      
      this.scene.add(bubble);
      
      // Animate bubble and remove it after 2 seconds
      const bubbleLifetime = 2.0;
      let bubbleTime = 0;
      
      const animateBubble = (delta: number) => {
        bubbleTime += delta;
        
        // Move bubble upward and slightly back
        bubble.position.y += delta * 0.5;
        bubble.position.z += delta * 0.2;
        
        // Fade out near end of lifetime
        if (bubbleTime > bubbleLifetime * 0.7) {
          const fadeProgress = (bubbleTime - (bubbleLifetime * 0.7)) / (bubbleLifetime * 0.3);
          bubbleMaterial.opacity = 0.5 * (1 - fadeProgress);
        }
        
        // Remove bubble when lifetime ends
        if (bubbleTime >= bubbleLifetime) {
          this.scene.remove(bubble);
          bubbleGeometry.dispose();
          bubbleMaterial.dispose();
          eventBus.off('game-update', animateBubble);
        }
      };
      
      // Subscribe to game updates for bubble animation
      eventBus.on('game-update', animateBubble);
    }
  }
  
  // Movement methods
  
  // Change to a different lane with improved feel and visual feedback
  changeLane(newLane: 'LEFT' | 'CENTER' | 'RIGHT') {
    // Allow lane changes during swimming, jumping, or diving
    // Only prevent during HIT, POWER_UP or already CHANGING_LANE
    if (this.state === 'HIT' || this.state === 'POWER_UP' || this.state === 'CHANGING_LANE') return;
    
    // Save the current state for restoration after lane change if needed
    const previousState = this.state;
    const previousActionTime = this.actionTime;
    
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
    this.createLaneChangeStartEffect();
    
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
  
  // Create a special effect when starting a lane change
  private createLaneChangeStartEffect(): void {
    // Create a small burst of bubbles to show the start of movement
    for (let i = 0; i < 4; i++) {
      const bubbleSize = 0.02 + Math.random() * 0.04;
      const bubbleGeometry = new THREE.SphereGeometry(bubbleSize, 6, 6);
      
      // Color based on direction
      const hue = this.laneChangeDirection === 'LEFT' ? 0.6 : 0.5; // Blue vs Cyan
      const bubbleColor = new THREE.Color().setHSL(hue, 0.8, 0.7);
      
      const bubbleMaterial = new THREE.MeshBasicMaterial({
        color: bubbleColor,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      });
      
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      
      // Position on the opposite side of the direction (to show pushing off)
      const offsetDirection = this.laneChangeDirection === 'LEFT' ? 1 : -1;
      const angle = ((i / 4) * Math.PI * 0.5) - Math.PI * 0.25; // 90° spread
      const radius = 0.15;
      
      bubble.position.set(
        this.mesh.position.x + (offsetDirection * 0.1) + Math.cos(angle) * radius * offsetDirection,
        this.mesh.position.y + Math.sin(angle) * radius,
        this.mesh.position.z + (Math.random() * 0.2)
      );
      
      this.scene.add(bubble);
      
      // Animate with quick outward expansion
      const bubbleLifetime = 0.2 + Math.random() * 0.1;
      let bubbleTime = 0;
      
      const animateBubble = (delta: number) => {
        bubbleTime += delta;
        
        // Fast outward expansion
        const progress = bubbleTime / bubbleLifetime;
        
        // Move outward in direction opposite to lane change
        bubble.position.x += offsetDirection * delta * 1.5 * (1 - progress);
        bubble.position.y += Math.sin(angle) * delta * 1.5 * (1 - progress);
        
        // Shrink and fade
        const scale = 1 - progress * 0.7;
        bubble.scale.set(scale, scale, scale);
        bubbleMaterial.opacity = 0.5 * (1 - progress);
        
        // Remove when lifetime ends
        if (bubbleTime >= bubbleLifetime) {
          this.scene.remove(bubble);
          bubbleGeometry.dispose();
          bubbleMaterial.dispose();
          eventBus.off('game-update', animateBubble);
        }
      };
      
      // Subscribe to game updates for animation
      eventBus.on('game-update', animateBubble);
    }
  }
  
  // Jump upward
  jump() {
    // Only jump if currently swimming
    if (this.state !== 'SWIMMING') return;
    
    this.state = 'JUMPING';
    this.startY = this.mesh.position.y;
    this.actionTime = 0;
  }
  
  // Dive downward
  dive() {
    // Only dive if currently swimming
    if (this.state !== 'SWIMMING') return;
    
    this.state = 'DIVING';
    this.startY = this.mesh.position.y;
    this.actionTime = 0;
  }
  
  // Collision handling
  handleCollision(obstacle: any) {
    // Ignore collision if immune
    if (this.isImmune) return;
    
    // Enter hit state
    this.state = 'HIT';
    this.actionTime = 0;
    
    // Emit collision event
    eventBus.emit('player-hit', { position: this.mesh.position.toArray() });
  }
  
  // Activate a power-up
  activatePowerUp(type: string, duration: number) {
    // PowerUp implementation will be added later
    console.log(`Activating power-up: ${type} for ${duration} seconds`);
  }
  
  // Clean up resources
  dispose() {
    // Clean up bubble trail event listeners
    
    // Clean up event listeners
    eventBus.off('game-start-movement');
    eventBus.off('game-state-change');
    
    // Clean up mesh resources
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
    });
    
    // Remove from scene
    this.scene.remove(this.mesh);
  }
}
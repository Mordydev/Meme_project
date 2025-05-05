import * as THREE from 'three';
import eventBus from '../../core/EventSystem';
import { AssetManager } from '../../core/AssetManager';

// Character state
type CharacterState = 'SWIMMING' | 'JUMPING' | 'DIVING' | 'CHANGING_LANE' | 'HIT' | 'POWER_UP';

// Lane positions
const LANE_POSITIONS = {
  LEFT: -2,
  CENTER: 0,
  RIGHT: 2
};

// Character movement parameters
const CHARACTER_PARAMS = {
  SWIM_SPEED: 10,              // Base forward swimming speed
  LANE_CHANGE_SPEED: 5,        // Horizontal movement speed
  LANE_CHANGE_TIME: 0.2,       // Time to change lanes
  JUMP_HEIGHT: 2,              // Maximum jump height
  JUMP_DURATION: 0.5,          // Jump duration in seconds
  DIVE_DEPTH: 2,               // Maximum dive depth
  DIVE_DURATION: 0.5,          // Dive duration in seconds
  RECOVERY_TIME: 1.0,          // Time to recover from hit
  HIT_FLASH_SPEED: 8,          // Flashing speed when hit
  IMMUNITY_DURATION: 2.0,      // Immunity duration after being hit
  BUBBLE_TRAIL_RATE: 0.1       // Time between bubble particles
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
  }
  
  // Update character state and position
  update(deltaTime: number, input: any) {
    // Handle state machine
    this.updateState(deltaTime, input);
    
    // Update character position
    this.updatePosition(deltaTime);
    
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
          this.state = 'SWIMMING';
          this.mesh.position.x = this.targetX;
          this.laneChangeDirection = null;
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
      const progress = this.actionTime / CHARACTER_PARAMS.LANE_CHANGE_TIME;
      const t = Math.min(progress, 1.0); // Clamp to 1.0
      
      // Use smooth easing function (ease-in-out)
      const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      // Calculate current position
      if (this.laneChangeDirection === 'LEFT') {
        const startX = this.lane === 'RIGHT' ? LANE_POSITIONS.RIGHT : LANE_POSITIONS.CENTER;
        const endX = this.lane === 'RIGHT' ? LANE_POSITIONS.CENTER : LANE_POSITIONS.LEFT;
        this.mesh.position.x = startX + (endX - startX) * easedT;
      } else {
        const startX = this.lane === 'LEFT' ? LANE_POSITIONS.LEFT : LANE_POSITIONS.CENTER;
        const endX = this.lane === 'LEFT' ? LANE_POSITIONS.CENTER : LANE_POSITIONS.RIGHT;
        this.mesh.position.x = startX + (endX - startX) * easedT;
      }
    }
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
  
  // Change to a different lane
  changeLane(newLane: 'LEFT' | 'CENTER' | 'RIGHT') {
    // Only change lanes if currently swimming
    if (this.state !== 'SWIMMING') return;
    
    // Calculate lane change direction
    const currentLane = this.lane;
    
    // Prevent invalid lane changes
    if (
      (currentLane === 'LEFT' && newLane === 'RIGHT') ||
      (currentLane === 'RIGHT' && newLane === 'LEFT')
    ) {
      // Must go through center first
      newLane = 'CENTER';
    }
    
    // Set direction
    this.laneChangeDirection = 
      newLane === 'LEFT' ? 'LEFT' : 
      newLane === 'RIGHT' ? 'RIGHT' : null;
    
    // Update lane and target position
    this.lane = newLane;
    this.targetX = LANE_POSITIONS[newLane];
    
    // Start lane change
    this.state = 'CHANGING_LANE';
    this.actionTime = 0;
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
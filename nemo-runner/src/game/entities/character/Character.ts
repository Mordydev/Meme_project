import * as THREE from 'three';
import eventBus from '../../core/EventSystem';
import { AssetManager } from '../../core/AssetManager';
import { detectDeviceCapabilities, optimizeModelAsset } from '../../utils/DeviceUtils';

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
  mesh: THREE.Group | null;
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
  
  // Animation system
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private currentAnimation: THREE.AnimationAction | null = null;
  private deviceCapabilities = detectDeviceCapabilities();
  
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
    if (this.mesh) {
      eventBus.emit('player-hit', { position: this.mesh.position.toArray() });
    }
    
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
  
  // Enhanced character mesh with LOD support and advanced materials
  private createCharacterMesh(): THREE.Group {
    // Check if we have a pre-loaded model
    const modelAsset = this.assetManager.getAsset('character_nemo');
    
    if (modelAsset) {
      console.log('Using loaded character model');
      // Use the pre-loaded model
      return this.setupLoadedModel(modelAsset);
    } else {
      console.log('Creating placeholder character model');
      // Create an improved placeholder
      return this.createPlaceholderModel();
    }
  }
  
  // Set up a loaded character model with proper materials and animations
  private setupLoadedModel(modelAsset: any): THREE.Group {
    const model = modelAsset.scene.clone();
    
    // Get actual device capabilities
    const deviceCapabilities = this.deviceCapabilities;
    
    // Apply optimization based on device capabilities
    // This uses our new utility function to automatically handle
    // material and geometry optimizations
    optimizeModelAsset(model, deviceCapabilities);
    
    // Add specific character material enhancements
    model.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        // For high-end devices, add fish-specific material properties
        if (deviceCapabilities.highEnd && object.material instanceof THREE.MeshPhysicalMaterial) {
          // Add character-specific textures from asset manager
          object.material.normalMap = this.assetManager.getAsset('nemo_normal') || object.material.normalMap;
          object.material.roughnessMap = this.assetManager.getAsset('nemo_roughness') || object.material.roughnessMap;
          object.material.metalnessMap = this.assetManager.getAsset('nemo_metalness') || object.material.metalnessMap;
          
          // Add subsurface scattering for fish skin
          object.material.transmission = 0.1;
          object.material.thickness = 0.5;
          object.material.clearcoat = 0.3;
          object.material.clearcoatRoughness = 0.4;
        } 
        // For mid-range devices, ensure we have normal maps at least
        else if (deviceCapabilities.midRange && object.material instanceof THREE.MeshStandardMaterial) {
          object.material.normalMap = this.assetManager.getAsset('nemo_normal_medium') || object.material.normalMap;
        }
      }
    });
    
    // Set up animation mixer if the model has animations
    if (modelAsset.animations && modelAsset.animations.length > 0) {
      this.setupAnimations(model, modelAsset.animations);
    }
    
    return model;
  }
  
  // Set up animations for the character
  private setupAnimations(model: THREE.Group, animationClips: THREE.AnimationClip[]): void {
    // Create animation mixer
    this.mixer = new THREE.AnimationMixer(model);
    
    // Process all animation clips
    for (const clip of animationClips) {
      // Create animation action
      const action = this.mixer.clipAction(clip);
      
      // Store animation by name
      this.animations.set(clip.name, action);
      
      // Configure action
      action.setEffectiveWeight(1);
      action.setEffectiveTimeScale(1);
      action.setLoop(THREE.LoopRepeat, Infinity);
      
      console.log(`Added animation: ${clip.name}`);
    }
    
    // Start the default swimming animation
    const swimAction = this.animations.get('swim') || this.animations.get('idle');
    if (swimAction) {
      swimAction.play();
      this.currentAnimation = swimAction;
      console.log('Started default swim animation');
    } else {
      console.warn('No default animation found for character');
    }
    
    // Create fallback animations if needed
    this.createFallbackAnimations(model);
  }
  
  // Create fallback animations if the model doesn't have all required animations
  private createFallbackAnimations(model: THREE.Group): void {
    // Required animation types
    const requiredAnimations = [
      'swim', 'idle', 'jump', 'dive', 'hit', 'turn_left', 'turn_right', 'power_up'
    ];
    
    // Check which animations are missing and create fallbacks
    for (const animName of requiredAnimations) {
      if (!this.animations.has(animName)) {
        // Create a procedural animation clip
        const clip = this.createProceduralAnimation(animName, model);
        
        if (clip) {
          // Add the procedural animation
          const action = this.mixer?.clipAction(clip);
          if (action) {
            this.animations.set(animName, action);
            console.log(`Created procedural animation: ${animName}`);
          }
        }
      }
    }
  }
  
  // Create a procedural animation clip for the given type
  private createProceduralAnimation(animationType: string, model: THREE.Group): THREE.AnimationClip | null {
    // Find the key components we want to animate
    let body: THREE.Object3D | undefined;
    let tail: THREE.Object3D | undefined;
    let leftFin: THREE.Object3D | undefined;
    let rightFin: THREE.Object3D | undefined;
    
    // Try to find the key parts in the model
    model.traverse((object: THREE.Object3D) => {
      if (object.name.toLowerCase().includes('body')) body = object;
      else if (object.name.toLowerCase().includes('tail')) tail = object;
      else if (object.name.toLowerCase().includes('fin_l')) leftFin = object;
      else if (object.name.toLowerCase().includes('fin_r')) rightFin = object;
    });
    
    // Fall back to child indices if named parts aren't found
    if (!body && model.children.length > 0) body = model.children[0];
    if (!tail && model.children.length > 3) tail = model.children[3];
    if (!leftFin && model.children.length > 4) leftFin = model.children[4];
    if (!rightFin && model.children.length > 5) rightFin = model.children[5];
    
    // Create tracks based on the animation type
    const tracks: THREE.KeyframeTrack[] = [];
    const duration = 1; // 1 second loop duration
    
    switch (animationType) {
      case 'swim':
      case 'idle':
        // Body gentle wobble
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Initial rotation (identity quaternion)
                0, 0.05, 0, 0.9987, // Slight right turn
                0, 0, 0, 1, // Back to center
                0, -0.05, 0, 0.9987, // Slight left turn
                0, 0, 0, 1, // Back to center
              ]
            )
          );
        }
        
        // Tail swishing
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, 0.1, 0.995, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.1, 0.995, // Left
                0, 0, 0, 1, // Center
                0, 0, 0.1, 0.995, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.1, 0.995, // Left
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        
        // Fin movements
        if (leftFin) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${leftFin.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                0.05, 0, 0, 0.9987, // Up
                0, 0, 0, 1, // Neutral
                -0.05, 0, 0, 0.9987, // Down
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        
        if (rightFin) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${rightFin.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                -0.05, 0, 0, 0.9987, // Down
                0, 0, 0, 1, // Neutral
                0.05, 0, 0, 0.9987, // Up
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        break;
        
      case 'turn_left':
        // Body leans left
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.5, 1],
              [
                0, 0, 0, 1, // Start neutral
                0, 0, -0.2, 0.9798, // Lean left
                0, 0, 0, 1, // End neutral
              ]
            )
          );
        }
        
        // Tail swishes right
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, 0.2, 0.9798, // Swish right
                0, 0, 0.15, 0.9887, // Hold
                0, 0, 0.05, 0.9987, // Return
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        break;
        
      case 'turn_right':
        // Body leans right
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.5, 1],
              [
                0, 0, 0, 1, // Start neutral
                0, 0, 0.2, 0.9798, // Lean right
                0, 0, 0, 1, // End neutral
              ]
            )
          );
        }
        
        // Tail swishes left
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, -0.2, 0.9798, // Swish left
                0, 0, -0.15, 0.9887, // Hold
                0, 0, -0.05, 0.9987, // Return
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        break;
        
      case 'jump':
        // Excited body motion
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                -0.1, 0, 0, 0.995, // Tilt up
                0, 0, 0, 1, // Neutral
                0.05, 0, 0, 0.9987, // Slight down
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        
        // More vigorous tail motion
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, 0.15, 0.9887, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.15, 0.9887, // Left
                0, 0, 0, 1, // Center
                0, 0, 0.15, 0.9887, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.15, 0.9887, // Left
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        break;
        
      case 'dive':
        // Downward-facing body
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                0.1, 0, 0, 0.995, // Tilt down
                0.15, 0, 0, 0.9887, // More down
                0.1, 0, 0, 0.995, // Less down
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        
        // Strong tail motion
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, 0.2, 0.9798, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.2, 0.9798, // Left
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        break;
        
      case 'hit':
        // Recoil and shake animation
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
              [
                0, 0, 0, 1, // Neutral
                0.1, 0.05, 0, 0.9937, // Recoil
                0.05, -0.05, 0, 0.9975, // Shake 1
                0.05, 0.05, 0, 0.9975, // Shake 2
                0.05, -0.03, 0, 0.9983, // Shake 3
                0.05, 0.03, 0, 0.9983, // Shake 4
                0.03, -0.02, 0, 0.9992, // Small shake 1
                0.03, 0.02, 0, 0.9992, // Small shake 2
                0.02, -0.01, 0, 0.9998, // Tiny shake
                0.01, 0, 0, 0.9999, // Almost normal
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        
        // Tail reaction
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1],
              [
                0, 0, 0, 1, // Neutral
                0, 0, 0.2, 0.9798, // Quick right
                0, 0, -0.25, 0.9682, // Quick left
                0, 0, 0.15, 0.9887, // Smaller right
                0, 0, -0.1, 0.995, // Smaller left
                0, 0, 0.05, 0.9987, // Tiny right
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        break;
        
      case 'power_up':
        // Excited, energetic swimming
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.2, 0.4, 0.6, 0.8, 1],
              [
                0, 0, 0, 1, // Neutral
                0.03, 0.03, 0, 0.9991, // Slight tilt 1
                0, 0.04, 0, 0.9992, // Slight tilt 2
                -0.03, 0.03, 0, 0.9991, // Slight tilt 3
                0, -0.04, 0, 0.9992, // Slight tilt 4
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        
        // Very fast tail movement
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, 0.15, 0.9887, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.15, 0.9887, // Left
                0, 0, 0, 1, // Center
                0, 0, 0.15, 0.9887, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.15, 0.9887, // Left
                0, 0, 0, 1, // Center
                0, 0, 0.15, 0.9887, // Right
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        
        // Vigorous fin movements
        if (leftFin && rightFin) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${leftFin.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                0.1, 0, 0, 0.995, // Up
                0, 0, 0, 1, // Neutral
                -0.1, 0, 0, 0.995, // Down
                0, 0, 0, 1, // Neutral
              ]
            )
          );
          
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${rightFin.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                -0.1, 0, 0, 0.995, // Down
                0, 0, 0, 1, // Neutral
                0.1, 0, 0, 0.995, // Up
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        break;
        
      default:
        return null;
    }
    
    // Create and return the animation clip if we have tracks
    if (tracks.length > 0) {
      return new THREE.AnimationClip(animationType, duration, tracks);
    }
    
    return null;
  }
  
  // Create an improved placeholder model for the character
  private createPlaceholderModel(): THREE.Group {
    // Create main group for the character
    const group = new THREE.Group();
    group.name = 'nemo_character';
    
    // Create a sub-group for animation purposes
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';
    group.add(bodyGroup);
    
    // Create fish body using a more organic shape
    const bodyGeometry = this.createBodyGeometry();
    
    // Create high-quality fish material with subsurface scattering effect
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff7e00, // Clownfish orange
      roughness: 0.6,
      metalness: 0.2,
      flatShading: false,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      transmission: 0.1, // Subtle translucency for fish skin
      thickness: 0.5,
      emissive: 0x331900,
      emissiveIntensity: 0.05
    });
    
    // For lower-end devices, fallback to standard material
    if (!this.deviceCapabilities.highEnd) {
      bodyMaterial.transmission = 0;
      bodyMaterial.clearcoat = 0;
    }
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'body_mesh';
    bodyGroup.add(body);
    
    // Create white stripes using custom shader material for better visual effect
    const stripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1,
      clearcoat: 0.2,
      clearcoatRoughness: 0.3,
      flatShading: false
    });
    
    // Create three stripes for more accurate clownfish appearance
    // First stripe (head)
    const stripeGeometry1 = this.createStripeGeometry(0.53, 0.2);
    const stripe1 = new THREE.Mesh(stripeGeometry1, stripeMaterial);
    stripe1.name = 'head_stripe';
    stripe1.position.z = -0.25;
    bodyGroup.add(stripe1);
    
    // Middle stripe
    const stripeGeometry2 = this.createStripeGeometry(0.53, 0.25);
    const stripe2 = new THREE.Mesh(stripeGeometry2, stripeMaterial);
    stripe2.name = 'middle_stripe';
    stripe2.position.z = 0.15;
    bodyGroup.add(stripe2);
    
    // Tail stripe
    const stripeGeometry3 = this.createStripeGeometry(0.48, 0.2);
    const stripe3 = new THREE.Mesh(stripeGeometry3, stripeMaterial);
    stripe3.name = 'tail_stripe';
    stripe3.position.z = 0.5;
    bodyGroup.add(stripe3);
    
    // Create fish tail with more realistic shape
    const tailGroup = new THREE.Group();
    tailGroup.name = 'tail';
    bodyGroup.add(tailGroup);
    
    const tailGeometry = this.createTailGeometry();
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7e00, // Match body
      roughness: 0.7,
      metalness: 0.1,
      flatShading: false
    });
    
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.z = 0.95;
    tailGroup.add(tail);
    
    // Create fins with more organic shapes
    // Create fin groups for animation
    const leftFinGroup = new THREE.Group();
    leftFinGroup.name = 'left_fin';
    const rightFinGroup = new THREE.Group();
    rightFinGroup.name = 'right_fin';
    bodyGroup.add(leftFinGroup);
    bodyGroup.add(rightFinGroup);
    
    // Side fins with more realistic shape
    const leftFinGeometry = this.createFinGeometry('side');
    const leftFin = new THREE.Mesh(leftFinGeometry, tailMaterial);
    leftFin.position.set(0.5, 0, 0);
    leftFinGroup.add(leftFin);
    
    const rightFinGeometry = this.createFinGeometry('side');
    const rightFin = new THREE.Mesh(rightFinGeometry, tailMaterial);
    rightFin.rotation.z = Math.PI;
    rightFin.position.set(-0.5, 0, 0);
    rightFinGroup.add(rightFin);
    
    // Create life-like eyes
    const eyesGroup = new THREE.Group();
    eyesGroup.name = 'eyes';
    bodyGroup.add(eyesGroup);
    
    // Eye whites
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 12);
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xefefef,
      roughness: 0.1,
      metalness: 0.0
    });
    
    // Eye iris
    const irisMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000033,
      roughness: 0.1,
      metalness: 0.0
    });
    
    // Pupil with highlight for more life-like appearance
    const pupilGeometry = new THREE.SphereGeometry(0.06, 12, 12);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const pupilHighlightGeometry = new THREE.SphereGeometry(0.025, 8, 8);
    const pupilHighlightMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    });
    
    // Left eye assembly
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.name = 'left_eye';
    eyesGroup.add(leftEyeGroup);
    
    const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    leftEyeGroup.add(leftEyeWhite);
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.z = 0.04;
    leftEyeGroup.add(leftPupil);
    
    const leftPupilHighlight = new THREE.Mesh(pupilHighlightGeometry, pupilHighlightMaterial);
    leftPupilHighlight.position.set(0.03, 0.03, 0.07);
    leftEyeGroup.add(leftPupilHighlight);
    
    leftEyeGroup.position.set(0.25, 0.2, -0.5);
    
    // Right eye assembly
    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.name = 'right_eye';
    eyesGroup.add(rightEyeGroup);
    
    const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    rightEyeGroup.add(rightEyeWhite);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.z = 0.04;
    rightEyeGroup.add(rightPupil);
    
    const rightPupilHighlight = new THREE.Mesh(pupilHighlightGeometry, pupilHighlightMaterial);
    rightPupilHighlight.position.set(-0.03, 0.03, 0.07);
    rightEyeGroup.add(rightPupilHighlight);
    
    rightEyeGroup.position.set(-0.25, 0.2, -0.5);
    
    // Additional fins with proper naming for animation
    
    // Dorsal fin 
    const dorsalFinGroup = new THREE.Group();
    dorsalFinGroup.name = 'dorsal_fin';
    bodyGroup.add(dorsalFinGroup);
    
    const dorsalFinGeometry = this.createFinGeometry('dorsal');
    const dorsalFin = new THREE.Mesh(dorsalFinGeometry, tailMaterial);
    dorsalFin.position.set(0, 0.4, -0.1);
    dorsalFinGroup.add(dorsalFin);
    
    // Pelvic fin
    const pelvicFinGroup = new THREE.Group();
    pelvicFinGroup.name = 'pelvic_fin';
    bodyGroup.add(pelvicFinGroup);
    
    const pelvicFinGeometry = this.createFinGeometry('pelvic');
    const pelvicFin = new THREE.Mesh(pelvicFinGeometry, tailMaterial);
    pelvicFin.position.set(0, -0.25, 0.2);
    pelvicFinGroup.add(pelvicFin);
    
    // Add bubble effect for underwater feel
    if (this.deviceCapabilities.highEnd || this.deviceCapabilities.midRange) {
      const bubblesGroup = this.createBubbleEffect();
      bubblesGroup.position.z = 1.2; // Position behind the fish
      group.add(bubblesGroup);
    }
    
    return group;
  }
  
  /**
   * Creates an organic fish body geometry
   */
  private createBodyGeometry(): THREE.BufferGeometry {
    // Start with a sphere for smooth base
    const geometry = new THREE.SphereGeometry(0.5, 32, 24);
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    // Apply deformations for clownfish body shape
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Normalize to -1 to 1 range for consistent transformations
      const normZ = vertex.z / 0.5; // Normalize based on sphere radius
      
      // Taper tail: gradually reduce x/y radius towards back
      const tailTaper = this.smoothStep(-0.2, 1.0, normZ);
      const tailFactor = 1.0 - tailTaper * 0.5; // Reduce radius by up to 50% at tail
      
      // Bulge mid-section for more organic fish shape
      const midBulge = 1.0 - Math.abs(normZ * 0.5);
      const bulgeFactor = 1.0 + Math.pow(midBulge, 2.0) * 0.15; // Add slight bulge
      
      // Flatten sides slightly
      const flattenAmount = 1.0 - Math.pow(Math.abs(vertex.x / 0.5), 2.0) * 0.15;
      
      // Apply factors
      vertex.x *= bulgeFactor * tailFactor * flattenAmount;
      vertex.y *= bulgeFactor * tailFactor * 0.7; // Overall height compression
      vertex.z *= 1.3; // Elongate in z direction
      
      // Add subtle noise for organic shape
      const noiseVal = 0.02 * (Math.sin(vertex.x * 20) * Math.sin(vertex.y * 20) * Math.sin(vertex.z * 20));
      vertex.addScaledVector(vertex.clone().normalize(), noiseVal);
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    return geometry;
  }
  
  /**
   * Creates a geometry for clownfish stripes
   */
  private createStripeGeometry(radius: number, width: number): THREE.BufferGeometry {
    // Use cylinder for basic shape
    const geometry = new THREE.CylinderGeometry(radius, radius, width, 24, 1, true);
    geometry.rotateX(Math.PI / 2); // Orient properly
    
    // Add some noise to stripe edges for more natural look
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Only apply noise to the edges (top and bottom of cylinder)
      if (Math.abs(vertex.y) > width/2 - 0.05) {
        const noiseScale = 10;
        const noiseVal = 0.01 * (Math.sin(vertex.x * noiseScale) * Math.cos(vertex.z * noiseScale));
        vertex.y += noiseVal;
      }
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    return geometry;
  }
  
  /**
   * Creates a geometry for the fish tail
   */
  private createTailGeometry(): THREE.BufferGeometry {
    // Create tail shape using custom shape
    const tailShape = new THREE.Shape();
    
    // Define the tail outline
    tailShape.moveTo(0, 0); // Center point
    tailShape.quadraticCurveTo(0.1, 0.15, 0.3, 0.4); // Top curve out
    tailShape.quadraticCurveTo(0.5, 0.7, 0.4, 0.8); // Top curve tip
    tailShape.quadraticCurveTo(0.3, 0.9, 0.1, 0.7); // Top curve back
    tailShape.lineTo(0, 0.5); // Center of split
    tailShape.lineTo(-0.1, 0.7); // Bottom curve start
    tailShape.quadraticCurveTo(-0.3, 0.9, -0.4, 0.8); // Bottom curve back
    tailShape.quadraticCurveTo(-0.5, 0.7, -0.3, 0.4); // Bottom curve tip
    tailShape.quadraticCurveTo(-0.1, 0.15, 0, 0); // Bottom curve to center
    
    // Extrude the shape for 3D form
    const extrudeSettings = {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 3
    };
    
    const geometry = new THREE.ExtrudeGeometry(tailShape, extrudeSettings);
    geometry.rotateX(Math.PI / 2); // Orient properly
    
    return geometry;
  }
  
  /**
   * Creates geometry for different fin types
   */
  private createFinGeometry(type: 'side' | 'dorsal' | 'pelvic'): THREE.BufferGeometry {
    // Different shapes for different fin types
    const finShape = new THREE.Shape();
    
    if (type === 'side') {
      // Side fins (pectoral)
      finShape.moveTo(0, 0);
      finShape.quadraticCurveTo(0.05, 0.05, 0.1, 0.15);
      finShape.quadraticCurveTo(0.15, 0.25, 0.2, 0.3);
      finShape.quadraticCurveTo(0.15, 0.2, 0.05, 0.1);
      finShape.quadraticCurveTo(0, 0.05, 0, 0);
    } else if (type === 'dorsal') {
      // Dorsal fin (top)
      finShape.moveTo(-0.1, 0);
      finShape.quadraticCurveTo(0, 0.1, 0.05, 0.2);
      finShape.quadraticCurveTo(0.1, 0.3, 0.2, 0.25);
      finShape.quadraticCurveTo(0.1, 0.15, 0.1, 0);
      finShape.lineTo(-0.1, 0);
    } else {
      // Pelvic fin (bottom)
      finShape.moveTo(-0.05, 0);
      finShape.quadraticCurveTo(0, 0.05, 0.05, 0.1);
      finShape.quadraticCurveTo(0.1, 0.15, 0.15, 0.1);
      finShape.quadraticCurveTo(0.1, 0.05, 0.05, 0);
      finShape.lineTo(-0.05, 0);
    }
    
    // Extrude settings based on fin type
    const thickness = type === 'side' ? 0.02 : 0.03;
    const extrudeSettings = {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2
    };
    
    const geometry = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
    
    // Rotate based on fin type
    if (type === 'side') {
      geometry.rotateZ(Math.PI / 2);
      geometry.scale(1, 0.6, 1); // Flatter side fins
    } else if (type === 'dorsal') {
      geometry.rotateZ(-Math.PI / 2);
      geometry.scale(0.8, 1, 1);
    } else {
      geometry.rotateX(-Math.PI / 4);
      geometry.scale(1, 0.5, 1);
    }
    
    return geometry;
  }
  
  /**
   * Creates bubble effect for trailing the character
   */
  private createBubbleEffect(): THREE.Group {
    const bubblesGroup = new THREE.Group();
    bubblesGroup.name = 'bubbles';
    
    // Create several bubbles of different sizes
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.6,
      transmission: 0.5, // Glass-like for bubbles
      clearcoat: 0.5,
      clearcoatRoughness: 0.1
    });
    
    // For lower-end devices, use simpler material
    if (!this.deviceCapabilities.highEnd) {
      bubbleMaterial.transmission = 0;
      bubbleMaterial.clearcoat = 0;
    }
    
    // Create 5 bubbles of varying sizes
    const bubbleSizes = [0.05, 0.08, 0.06, 0.04, 0.07];
    const bubblePositions = [
      new THREE.Vector3(0.1, 0.1, 0),
      new THREE.Vector3(-0.1, 0.15, 0.05),
      new THREE.Vector3(0.08, -0.1, -0.05),
      new THREE.Vector3(-0.15, -0.05, 0.08),
      new THREE.Vector3(0, 0.1, 0.1)
    ];
    
    for (let i = 0; i < bubbleSizes.length; i++) {
      const bubbleGeometry = new THREE.SphereGeometry(bubbleSizes[i], 16, 12);
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial.clone());
      bubble.position.copy(bubblePositions[i]);
      bubble.userData.originalPosition = bubblePositions[i].clone();
      bubble.userData.speed = 0.2 + Math.random() * 0.3; // Random speed for animation
      bubble.userData.wobble = Math.random() * Math.PI * 2; // Random phase for wobble
      bubblesGroup.add(bubble);
    }
    
    return bubblesGroup;
  }
  
  /**
   * Helper function for smoother transitions
   */
  private smoothStep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
  
  // Reset character position
  resetPosition() {
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
  
  // Update character state and position
  update(deltaTime: number, input: any) {
    // Skip update if mesh doesn't exist
    if (!this.mesh) return;
    
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
    
    // Update animations based on current state
    this.updateAnimationState(deltaTime);
    
    // Create bubble trail
    this.createBubbleTrail(deltaTime);
  }
  
  // Update animation state based on character state
  private updateAnimationState(deltaTime: number) {
    // If we have an animation mixer, handle animation transitions
    if (this.mixer) {
      // Update the animation mixer
      this.mixer.update(deltaTime);
      
      // Transition to appropriate animation based on state
      switch (this.state) {
        case 'SWIMMING':
          this.transitionToAnimation('swim', 0.3);
          break;
        case 'JUMPING':
          this.transitionToAnimation('jump', 0.2);
          break;
        case 'DIVING':
          this.transitionToAnimation('dive', 0.2);
          break;
        case 'CHANGING_LANE':
          if (this.laneChangeDirection === 'LEFT') {
            this.transitionToAnimation('turn_left', 0.15);
          } else {
            this.transitionToAnimation('turn_right', 0.15);
          }
          break;
        case 'HIT':
          this.transitionToAnimation('hit', 0.1);
          break;
        case 'POWER_UP':
          this.transitionToAnimation('power_up', 0.3);
          break;
      }
    } else {
      // Fall back to legacy animation system
      this.updateSwimAnimation(deltaTime);
    }
  }
  
  // Transition to a new animation with crossfade
  private transitionToAnimation(name: string, duration: number = 0.3): void {
    // Get the target animation
    const targetAction = this.animations.get(name);
    
    // If the animation doesn't exist or it's already the current animation, do nothing
    if (!targetAction || targetAction === this.currentAnimation) return;
    
    // Fade out the current animation if there is one
    if (this.currentAnimation) {
      this.currentAnimation.fadeOut(duration);
    }
    
    // Play the new animation with fade in
    targetAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();
    
    // Update the current animation reference
    this.currentAnimation = targetAction;
  }
  
  // Update character state based on input and current state
  private updateState(deltaTime: number, input: any) {
    // Skip update if mesh doesn't exist
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
    if (!this.mesh) return;
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
    if (!this.mesh) return;
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
    if (this.mesh) {
      this.collider.center.set(
        this.mesh.position.x,
        this.mesh.position.y,
        this.mesh.position.z
      );
    }
  }
  
  // Update immunity after being hit
  private updateImmunity(deltaTime: number) {
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
  
  // Enhanced animation system
  private updateSwimAnimation(deltaTime: number) {
    // Skip if mesh doesn't exist
    if (!this.mesh) return;
    
    // Update the animation mixer if it exists
    if (this.mixer) {
      this.mixer.update(deltaTime);
      return; // Let the mixer handle all animations
    }
    
    // Legacy animation for placeholder model if no mixer is present
    const time = performance.now() * 0.003;
    
    // Body wobble
    this.mesh.rotation.y = Math.sin(time * 3) * 0.1;
    
    // Identify the tail (typically the 4th child, but let's be more robust)
    let tail: THREE.Object3D | undefined;
    let leftFin: THREE.Object3D | undefined;
    let rightFin: THREE.Object3D | undefined;
    
    // Try to find by name first
    this.mesh.traverse((object: THREE.Object3D) => {
      const name = object.name.toLowerCase();
      if (name.includes('tail')) tail = object;
      else if (name.includes('fin_l') || name.includes('fin.l')) leftFin = object;
      else if (name.includes('fin_r') || name.includes('fin.r')) rightFin = object;
    });
    
    // Fall back to child indices if named parts aren't found
    if (!tail && this.mesh.children.length > 3) tail = this.mesh.children[3];
    if (!leftFin && this.mesh.children.length > 4) leftFin = this.mesh.children[4];
    if (!rightFin && this.mesh.children.length > 5) rightFin = this.mesh.children[5];
    
    // Animate tail with slower, more natural movement
    if (tail && tail instanceof THREE.Object3D) {
      tail.rotation.y = Math.sin(time * 3) * 0.25; // Reduced frequency (8 -> 3) and slightly reduced amplitude
    }
    
    // Animate fins with more gentle movement
    if (leftFin && leftFin instanceof THREE.Object3D) {
      leftFin.rotation.x = Math.sin(time * 4) * 0.18; // Reduced frequency and amplitude
    }
    
    if (rightFin && rightFin instanceof THREE.Object3D) {
      rightFin.rotation.x = Math.sin(time * 4 + Math.PI) * 0.18; // Offset for asymmetric movement
    }
    
    // Animate dorsal fin if present - slower for more natural look
    const dorsalFin = this.findObjectByName(this.mesh, 'dorsal');
    if (dorsalFin) {
      dorsalFin.rotation.z = Math.sin(time * 2.5) * 0.08; // Reduced frequency and amplitude
    }
    
    // Animate pectoral fin if present - also slower
    const pectoralFin = this.findObjectByName(this.mesh, 'pectoral');
    if (pectoralFin) {
      pectoralFin.rotation.x = Math.sin(time * 3) * 0.12; // Reduced frequency and amplitude
    }
  }
  
  // Helper to find objects by name
  private findObjectByName(parent: THREE.Object3D, nameFragment: string): THREE.Object3D | undefined {
    let result: THREE.Object3D | undefined;
    
    parent.traverse((object: THREE.Object3D) => {
      if (object.name.toLowerCase().includes(nameFragment.toLowerCase())) {
        result = object;
      }
    });
    
    return result;
  }
  
  // Create bubble trail effect
  private createBubbleTrail(deltaTime: number) {
    if (!this.mesh) return;

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
    if (!this.mesh) return;
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
    // Only jump if currently swimming and mesh exists
    if (this.state !== 'SWIMMING' || !this.mesh) return;
    
    this.state = 'JUMPING';
    this.startY = this.mesh.position.y;
    this.actionTime = 0;
  }
  
  // Dive downward
  dive() {
    // Only dive if currently swimming and mesh exists
    if (this.state !== 'SWIMMING' || !this.mesh) return;
    
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
    if (this.mesh) {
      eventBus.emit('player-hit', { position: this.mesh.position.toArray() });
    }
  }
  
  // Activate a power-up
  activatePowerUp(type: string, duration: number) {
    // PowerUp implementation will be added later
    console.log(`Activating power-up: ${type} for ${duration} seconds`);
  }
  
  // Clean up resources
  dispose() {
    // Stop all animations
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.animations.clear();
      this.currentAnimation = null;
    }
    
    // Clean up event listeners for ongoing animations
    eventBus.off('game-update', () => {});
    
    // Clean up core event listeners
    eventBus.off('game-start-movement', () => {});
    eventBus.off('game-state-change', () => {});
    
    // Clean up mesh resources
    if (this.mesh) {
      this.mesh.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material instanceof THREE.Material) {
          // Handle specific material types with their property maps
          if (object.material instanceof THREE.MeshStandardMaterial ||
              object.material instanceof THREE.MeshPhysicalMaterial) {
            // Dispose of any textures used by the material
            if (object.material.map) object.material.map.dispose();
            if (object.material.normalMap) object.material.normalMap.dispose();
            if (object.material.roughnessMap) object.material.roughnessMap.dispose();
            if (object.material.metalnessMap) object.material.metalnessMap.dispose();
            if (object.material.alphaMap) object.material.alphaMap.dispose();
            if (object.material.aoMap) object.material.aoMap.dispose();
            if (object.material.emissiveMap) object.material.emissiveMap.dispose();
          }
          
          // Dispose of the material itself
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          // Handle array of materials
          object.material.forEach(material => {
            // Handle specific material types with their property maps
            if (material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhysicalMaterial) {
              // Dispose of any textures used by the material
              if (material.map) material.map.dispose();
              if (material.normalMap) material.normalMap.dispose();
              if (material.roughnessMap) material.roughnessMap.dispose();
              if (material.metalnessMap) material.metalnessMap.dispose();
              if (material.alphaMap) material.alphaMap.dispose();
              if (material.aoMap) material.aoMap.dispose();
              if (material.emissiveMap) material.emissiveMap.dispose();
            }
            
            // Dispose of the material itself
            material.dispose();
          });
        }
        }
      });
      
      // Remove from scene
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
    
    // Log cleanup
    console.log('Character resources disposed');
  }
}
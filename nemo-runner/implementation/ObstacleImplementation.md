# Obstacle System Implementation Plan

## Overview

This document outlines the implementation strategy for creating the obstacle system in the Nemo Runner game. Based on the examples in the example/ directory, the game will feature several underwater obstacles including sharks, jellyfish, pufferfish, and clams, each with unique behaviors and animations.

## Procedural Geometry Implementation

This section expands the implementation strategy to replace the placeholder obstacle geometries with detailed procedural models based on the examples found in the example/ directory. The focus is on extracting the three.js procedural generation code and adapting it to our game architecture.

## Obstacle Types

### 1. Shark ✅

**Visual Design:** ✅
- Predatory shark with animated mouth and tail
- Realistic silhouette with detailed fins
- Textured for underwater environment with subtle normal mapping
- Animated eyes for enhanced expression

**Behavior:** ✅
- Patrol movement along predefined paths
- Occasional lunging when player is nearby
- Mouth animation when attacking
- Tail swishing during movement

**Implementation Strategy:** ✅
- Custom mesh with rigged skeleton for natural movement
- State machine with patrol, chase, and attack states
- Pathfinding system for intelligent movement
- Trigger zones for player detection

**Technical Specifications:** ✅
- High-detail model: ~2000 triangles
- Medium-detail model: ~1000 triangles
- Low-detail model: ~500 triangles
- Animation system with 4-5 core animations (swim, turn, attack, idle)

**Implementation Details:**
- Created procedural shark model with detailed fins and body shape
- Implemented shader-based body undulation for realistic swimming motion
- Added countershading effect (darker top, lighter belly) using custom fragment shader
- Integrated proper state machine for patrol and chase behaviors
- Created smooth tail and fin animation system that coordinates with shader animation

### 2. Jellyfish ✅

**Visual Design:** ✅
- Translucent bell with subtle emission
- Flowing tentacles with physics-based movement
- Pulsating animation for the bell
- Particle effects for bioluminescence (high quality only)

**Behavior:** ✅
- Slowly pulsating vertical movement
- Randomly drifting horizontally
- Tentacles that create danger zones for the player
- Gentle pulsing glow effect

**Implementation Strategy:** ✅
- Main bell mesh with shader-animated tentacles
- Physics-based simulation for tentacle movement
- Vertex displacement for bell pulsation
- Custom shader for translucency and emission

**Technical Specifications:** ✅
- Bell: 200-300 triangles with displacement mapping
- Tentacles: Shader-based procedural animation
- Custom translucent material with refraction
- Efficient collision detection for tentacle danger zones

**Implementation Details:**
- Created shader-based bell pulsation with organic movement pattern
- Implemented Fresnel effect for realistic translucency at edges
- Added dynamic tentacle animation using vertex displacement in shader
- Created pulsing glow effect synchronized with bell movement
- Optimized tentacle rendering with instanced geometry for performance

### 3. Pufferfish ✅

**Visual Design:** ✅
- Compact small fish when inactive
- Expanded spiky form when triggered
- Detailed texture with pattern
- Animation for inflation/deflation

**Behavior:** ✅
- Initially small and seemingly harmless
- Inflates rapidly when player approaches
- Creates a temporary barrier/obstacle
- Deflates after a set period

**Implementation Strategy:** ✅
- Morphing mesh for inflation animation
- Proximity-based trigger system
- Timed state transitions
- Custom material for spines

**Technical Specifications:** ✅
- Base model: 300-400 triangles
- Expanded model: 600-800 triangles
- Morph targets for smooth inflation animation
- Physics-based collision detection that adapts to current state

**Implementation Details:**
- Implemented shader-based inflation behavior using vertex displacement
- Created realistic spots pattern using procedural noise generation
- Added dynamic spine/spike behavior that scales with inflation state
- Implemented advanced state machine for inflation/deflation cycle
- Created dynamic collision system that scales with current inflation state

### 4. Clam ✅

**Visual Design:** ✅
- Detailed shell with realistic texture
- Inner pearl with subtle glow
- Animation for opening and closing
- Particle effects for bubbles when opening

**Behavior:** ✅
- Rhythmically opens and closes
- Can be passed when open
- Blocks path when closed
- Pattern-based timing for gameplay challenge

**Implementation Strategy:** ✅
- Animated mesh with hinge point for shell
- Timed state machine for opening/closing pattern
- Collision detection that changes with shell state
- Visual indicators for timing

**Technical Specifications:** ✅
- 300-500 triangles per clam
- Simple skeletal rig for shell animation
- State-based collision geometry
- Shader effects for pearl glow (high quality only)

**Implementation Details:**
- Created shell with iridescent material using advanced MeshPhysicalMaterial
- Implemented pearl with multi-layered glow effect that responds to open/closed state
- Added bubble emission system that triggers when clam opens
- Implemented timing-based state machine for predictable but challenging patterns
- Created adaptive collision system that updates based on shell opening angle

## Common Implementation Details

### Obstacle Manager Enhancement

```typescript
// Enhanced ObstacleManager with specific obstacle factories
export class ObstacleManager {
  private scene: THREE.Scene;
  private collisionSystem: CollisionSystem;
  
  // Pools for each obstacle type
  private sharkPool: ObjectPool<Shark>;
  private jellyfishPool: ObjectPool<Jellyfish>;
  private pufferfishPool: ObjectPool<Pufferfish>;
  private clamPool: ObjectPool<Clam>;
  
  // Pattern factories
  private patternFactories: Map<string, ObstaclePatternFactory>;
  
  // Quality settings
  private qualityLevel: 'high' | 'medium' | 'low';
  
  constructor(scene: THREE.Scene, collisionSystem: CollisionSystem, deviceCapabilities: DeviceCapabilities) {
    this.scene = scene;
    this.collisionSystem = collisionSystem;
    
    // Set quality based on device
    this.qualityLevel = deviceCapabilities.highEnd ? 'high' : 
                         deviceCapabilities.midRange ? 'medium' : 'low';
    
    // Initialize obstacle pools
    this.initializeObstaclePools();
    
    // Set up pattern factories
    this.initializePatternFactories();
  }
  
  private initializeObstaclePools(): void {
    // Create obstacle pools with proper factory methods
    this.sharkPool = new ObjectPool<Shark>(
      () => new Shark(this.scene, this.qualityLevel),
      (shark) => shark.reset(),
      5 // Initial pool size
    );
    
    this.jellyfishPool = new ObjectPool<Jellyfish>(
      () => new Jellyfish(this.scene, this.qualityLevel),
      (jellyfish) => jellyfish.reset(),
      10 // Initial pool size
    );
    
    // Similar for other obstacle types...
  }
  
  private initializePatternFactories(): void {
    this.patternFactories = new Map();
    
    // Register pattern factories
    this.patternFactories.set('shark_patrol', new SharkPatrolFactory());
    this.patternFactories.set('jellyfish_field', new JellyfishFieldFactory());
    this.patternFactories.set('pufferfish_trap', new PufferfishTrapFactory());
    this.patternFactories.set('clam_timing', new ClamTimingFactory());
    this.patternFactories.set('mixed_challenge', new MixedChallengeFactory());
  }
  
  // Get appropriate obstacle based on type
  private getObstacle(type: ObstacleType): Obstacle {
    switch (type) {
      case 'shark':
        return this.sharkPool.get();
      case 'jellyfish':
        return this.jellyfishPool.get();
      case 'pufferfish':
        return this.pufferfishPool.get();
      case 'clam':
        return this.clamPool.get();
      default:
        throw new Error(`Unknown obstacle type: ${type}`);
    }
  }
  
  // Generate pattern based on type and difficulty
  public generatePattern(patternType: string, basePosition: THREE.Vector3, difficulty: number): void {
    const factory = this.patternFactories.get(patternType);
    if (!factory) {
      console.error(`Unknown pattern type: ${patternType}`);
      return;
    }
    
    // Generate obstacle configuration
    const config = factory.createPattern(basePosition, difficulty);
    
    // Spawn obstacles according to configuration
    config.obstacles.forEach(obstacleConfig => {
      const obstacle = this.getObstacle(obstacleConfig.type);
      obstacle.initialize(obstacleConfig);
      
      // Add to active obstacles list and scene
      this.activeObstacles.push(obstacle);
      
      // Register with collision system
      this.collisionSystem.registerObstacle(obstacle);
    });
  }
  
  // Update all active obstacles
  public update(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Update all active obstacles with delta time
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obstacle = this.activeObstacles[i];
      
      // Update obstacle
      obstacle.update(deltaTime, playerPosition, gameSpeed);
      
      // Remove if too far behind player
      if (obstacle.position.z - playerPosition.z > 50) {
        this.recycleObstacle(obstacle);
        this.activeObstacles.splice(i, 1);
      }
    }
    
    // Generate new obstacles as needed
    this.generateObstacles(playerPosition.z);
  }
  
  // Recycle obstacle back to the appropriate pool
  private recycleObstacle(obstacle: Obstacle): void {
    // Remove from collision system
    this.collisionSystem.unregisterObstacle(obstacle);
    
    // Return to appropriate pool
    if (obstacle instanceof Shark) {
      this.sharkPool.release(obstacle);
    } else if (obstacle instanceof Jellyfish) {
      this.jellyfishPool.release(obstacle);
    } else if (obstacle instanceof Pufferfish) {
      this.pufferfishPool.release(obstacle);
    } else if (obstacle instanceof Clam) {
      this.clamPool.release(obstacle);
    }
  }
}
```

### Base Obstacle Class

```typescript
// Abstract base class for all obstacles
export abstract class Obstacle {
  protected mesh: THREE.Group;
  protected collider: THREE.Sphere | THREE.Box3;
  protected state: ObstacleState;
  protected animations: Map<string, THREE.AnimationAction>;
  protected mixer: THREE.AnimationMixer;
  
  constructor(scene: THREE.Scene, qualityLevel: 'high' | 'medium' | 'low') {
    this.mixer = new THREE.AnimationMixer(new THREE.Object3D());
    this.animations = new Map();
    this.state = 'idle';
  }
  
  // Initialize with configuration
  public abstract initialize(config: ObstacleConfig): void;
  
  // Reset for reuse from object pool
  public abstract reset(): void;
  
  // Update obstacle state
  public update(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Update animation mixer
    this.mixer.update(deltaTime);
    
    // Update based on current state
    switch (this.state) {
      case 'idle':
        this.updateIdle(deltaTime, playerPosition, gameSpeed);
        break;
      case 'active':
        this.updateActive(deltaTime, playerPosition, gameSpeed);
        break;
      case 'triggered':
        this.updateTriggered(deltaTime, playerPosition, gameSpeed);
        break;
      case 'cooldown':
        this.updateCooldown(deltaTime, playerPosition, gameSpeed);
        break;
    }
    
    // Update collider position
    this.updateCollider();
  }
  
  // State-specific updates
  protected abstract updateIdle(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void;
  protected abstract updateActive(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void;
  protected abstract updateTriggered(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void;
  protected abstract updateCooldown(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void;
  
  // Update collider position to match mesh
  protected updateCollider(): void {
    if (this.collider instanceof THREE.Sphere) {
      this.collider.center.copy(this.mesh.position);
    } else if (this.collider instanceof THREE.Box3) {
      this.collider.setFromObject(this.mesh);
    }
  }
  
  // Check collision with player
  public checkCollision(playerCollider: THREE.Sphere): boolean {
    if (this.collider instanceof THREE.Sphere) {
      return playerCollider.intersectsSphere(this.collider);
    } else if (this.collider instanceof THREE.Box3) {
      return playerCollider.intersectsBox(this.collider);
    }
    return false;
  }
  
  // Play animation by name
  protected playAnimation(name: string, loop: THREE.AnimationActionLoopStyles = THREE.LoopRepeat): void {
    const action = this.animations.get(name);
    if (!action) return;
    
    // Stop all current animations
    this.animations.forEach(a => {
      if (a !== action) a.fadeOut(0.2);
    });
    
    // Play requested animation
    action.reset()
      .setLoop(loop, Infinity)
      .fadeIn(0.2)
      .play();
  }
  
  // Dispose of resources
  public dispose(): void {
    // Clean up animations
    this.mixer.stopAllAction();
    
    // Dispose of geometries and materials
    this.mesh.traverse(object => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        }
      }
    });
  }
}
```

## Specific Obstacle Implementations

### Shark Implementation

```typescript
export class Shark extends Obstacle {
  private patrolPoints: THREE.Vector3[];
  private currentPatrolIndex: number = 0;
  private patrolSpeed: number;
  private detectionRadius: number;
  private chaseSpeed: number;
  private isChasing: boolean = false;
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  
  constructor(scene: THREE.Scene, qualityLevel: 'high' | 'medium' | 'low') {
    super(scene, qualityLevel);
    
    // Create shark mesh based on quality
    this.mesh = this.createSharkMesh(qualityLevel);
    scene.add(this.mesh);
    
    // Create collider
    this.collider = new THREE.Box3().setFromObject(this.mesh);
    
    // Set up animations
    this.setupAnimations();
  }
  
  private createSharkMesh(quality: string): THREE.Group {
    // Create shark group
    const sharkGroup = new THREE.Group();
    sharkGroup.name = 'shark';
    
    // Determine detail level based on quality
    const segmentDetail = quality === 'high' ? 24 : 
                          quality === 'medium' ? 16 : 8;
    
    // Create body
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';
    
    // Main body shape using deformed capsule geometry
    const bodyGeometry = new THREE.CapsuleGeometry(
      0.8, // radius
      4.0, // length
      segmentDetail, // radial segments
      segmentDetail  // height segments
    );
    
    // Create appropriate material based on quality
    let bodyMaterial: THREE.Material;
    if (quality === 'high') {
      bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x505a64, // Shark grey
        roughness: 0.8,
        metalness: 0.1,
        envMapIntensity: 0.4,
        flatShading: false
      });
    } else {
      bodyMaterial = new THREE.MeshLambertMaterial({
        color: 0x505a64,
        flatShading: quality === 'low'
      });
    }
    
    // Create body mesh
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2; // Align horizontally
    body.name = 'body_mesh';
    bodyGroup.add(body);
    
    // Add fins, eyes, and other details
    this.addSharkDetails(bodyGroup, bodyMaterial, segmentDetail, quality);
    
    // Add body to main group
    sharkGroup.add(bodyGroup);
    
    return sharkGroup;
  }
  
  private addSharkDetails(bodyGroup: THREE.Group, bodyMaterial: THREE.Material, segments: number, quality: string): void {
    // Add head with eyes
    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    
    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.5, 0.4, -1.6);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.5, 0.4, -1.6);
    
    // Add eye highlights for better visual quality
    if (quality !== 'low') {
      const highlightGeometry = new THREE.SphereGeometry(0.04, 6, 6);
      const highlightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
      });
      
      const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      leftHighlight.position.set(0.53, 0.43, -1.65);
      
      const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      rightHighlight.position.set(-0.47, 0.43, -1.65);
      
      headGroup.add(leftHighlight);
      headGroup.add(rightHighlight);
    }
    
    headGroup.add(leftEye);
    headGroup.add(rightEye);
    
    // Create jaw for animation
    const jawGroup = new THREE.Group();
    jawGroup.name = 'jaw';
    
    const jawGeometry = new THREE.BoxGeometry(0.9, 0.3, 1.0);
    const jaw = new THREE.Mesh(jawGeometry, bodyMaterial);
    jaw.position.set(0, -0.3, -1.8);
    
    // Add teeth for high and medium quality
    if (quality !== 'low') {
      const teethCount = quality === 'high' ? 8 : 6;
      const teethGeometry = new THREE.ConeGeometry(0.05, 0.1, 3);
      const teethMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
      
      for (let i = 0; i < teethCount; i++) {
        const tooth = new THREE.Mesh(teethGeometry, teethMaterial);
        const angle = (i / teethCount) * Math.PI * 0.6 - Math.PI * 0.3;
        
        tooth.position.set(
          Math.sin(angle) * 0.4,
          0.05,
          -1.9 + Math.cos(angle) * 0.2
        );
        tooth.rotation.x = Math.PI;
        
        jawGroup.add(tooth);
      }
    }
    
    jawGroup.add(jaw);
    headGroup.add(jawGroup);
    bodyGroup.add(headGroup);
    
    // Create tail
    const tailGroup = new THREE.Group();
    tailGroup.name = 'tail';
    
    const tailGeometry = new THREE.BoxGeometry(0.1, 1.2, 1.5);
    tailGeometry.translate(0, 0, 1.0); // Offset for better pivot point
    
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0, 2.0); // Position at back of shark
    
    // Create tail fins
    const tailFinGeometry = this.createFinGeometry(1.2, 0.8);
    const tailFin = new THREE.Mesh(tailFinGeometry, bodyMaterial);
    tailFin.position.set(0, 0, 2.5);
    tailFin.scale.set(1.8, 1.8, 1.8);
    
    tailGroup.add(tail);
    tailGroup.add(tailFin);
    bodyGroup.add(tailGroup);
    
    // Create fins
    // Dorsal fin
    const dorsalFinGroup = new THREE.Group();
    dorsalFinGroup.name = 'dorsal_fin';
    
    const dorsalFinGeometry = this.createFinGeometry(1.2, 0.8);
    const dorsalFin = new THREE.Mesh(dorsalFinGeometry, bodyMaterial);
    dorsalFin.rotation.x = Math.PI / 2;
    dorsalFin.position.set(0, 0.8, 0);
    
    dorsalFinGroup.add(dorsalFin);
    bodyGroup.add(dorsalFinGroup);
    
    // Side fins
    const leftFinGroup = new THREE.Group();
    leftFinGroup.name = 'left_fin';
    
    const sideFinGeometry = this.createFinGeometry(0.8, 0.4);
    
    const leftFin = new THREE.Mesh(sideFinGeometry, bodyMaterial);
    leftFin.rotation.order = 'YXZ';
    leftFin.rotation.y = Math.PI / 2;
    leftFin.rotation.x = Math.PI / 4;
    leftFin.position.set(0.8, -0.2, -0.5);
    
    leftFinGroup.add(leftFin);
    bodyGroup.add(leftFinGroup);
    
    const rightFinGroup = new THREE.Group();
    rightFinGroup.name = 'right_fin';
    
    const rightFin = new THREE.Mesh(sideFinGeometry, bodyMaterial);
    rightFin.rotation.order = 'YXZ';
    rightFin.rotation.y = -Math.PI / 2;
    rightFin.rotation.x = Math.PI / 4;
    rightFin.position.set(-0.8, -0.2, -0.5);
    
    rightFinGroup.add(rightFin);
    bodyGroup.add(rightFinGroup);
  }
  
  private createFinGeometry(height: number, width: number): THREE.BufferGeometry {
    // Create a triangular shape for a fin
    const finShape = new THREE.Shape();
    
    finShape.moveTo(0, 0);
    finShape.lineTo(width, 0);
    finShape.lineTo(0, height);
    finShape.lineTo(0, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: 0.1,
      bevelEnabled: false
    };
    
    return new THREE.ExtrudeGeometry(finShape, extrudeSettings);
  }
  
  private setupAnimations(): void {
    // Set up animation clips for shark
    // Swim, turn, attack, etc.
  }
  
  public initialize(config: SharkConfig): void {
    // Set initial position
    this.mesh.position.copy(config.position);
    
    // Set up patrol points
    this.patrolPoints = config.patrolPoints || [];
    this.currentPatrolIndex = 0;
    
    // Set behavior parameters
    this.patrolSpeed = config.patrolSpeed || 5;
    this.detectionRadius = config.detectionRadius || 10;
    this.chaseSpeed = config.chaseSpeed || 8;
    
    // Set initial state
    this.state = 'idle';
    this.isChasing = false;
    
    // Play idle animation
    this.playAnimation('swim');
  }
  
  public reset(): void {
    // Reset to default state for object pooling
    this.state = 'idle';
    this.isChasing = false;
    this.currentPatrolIndex = 0;
    
    // Reset mesh properties
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    
    // Reset animations
    this.mixer.stopAllAction();
  }
  
  protected updateIdle(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Transition to active when near player
    if (playerPosition.z - this.mesh.position.z < 50) {
      this.state = 'active';
    }
  }
  
  protected updateActive(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Check if player is in detection radius
    const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
    
    if (distanceToPlayer < this.detectionRadius) {
      // Start chasing player
      this.isChasing = true;
      this.playAnimation('chase');
      this.state = 'triggered';
    } else {
      // Continue patrol behavior
      this.updatePatrol(deltaTime, gameSpeed);
    }
  }
  
  protected updateTriggered(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    if (this.isChasing) {
      // Chase the player
      this.targetPosition.copy(playerPosition);
      const direction = new THREE.Vector3()
        .subVectors(this.targetPosition, this.mesh.position)
        .normalize();
      
      // Move toward player
      const moveDistance = this.chaseSpeed * deltaTime;
      this.mesh.position.add(direction.multiplyScalar(moveDistance));
      
      // Rotate to face direction of movement
      this.mesh.lookAt(this.targetPosition);
      
      // Check if chase should end
      const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
      if (distanceToPlayer > this.detectionRadius * 1.5) {
        this.isChasing = false;
        this.playAnimation('swim');
        this.state = 'cooldown';
      }
    }
  }
  
  protected updateCooldown(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Cool down period before resuming patrol
    // After a short delay, return to active state
    this.updatePatrol(deltaTime, gameSpeed);
    
    // Temporary cool down for a few seconds
    this.state = 'active';
  }
  
  private updatePatrol(deltaTime: number, gameSpeed: number): void {
    if (this.patrolPoints.length < 2) return;
    
    // Get current target patrol point
    const targetPoint = this.patrolPoints[this.currentPatrolIndex];
    
    // Calculate direction to target
    const direction = new THREE.Vector3()
      .subVectors(targetPoint, this.mesh.position)
      .normalize();
    
    // Calculate distance to move this frame
    const moveDistance = this.patrolSpeed * deltaTime;
    
    // Check if we'll reach the target point with this move
    const distanceToTarget = this.mesh.position.distanceTo(targetPoint);
    
    if (distanceToTarget <= moveDistance) {
      // We reached the point, move to next patrol point
      this.mesh.position.copy(targetPoint);
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    } else {
      // Move toward the target point
      this.mesh.position.add(direction.multiplyScalar(moveDistance));
    }
    
    // Rotate to face direction of movement with smooth interpolation
    const targetRotation = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(this.mesh.position, targetPoint, new THREE.Vector3(0, 1, 0))
    );
    this.mesh.quaternion.slerp(targetRotation, deltaTime * 5);
  }
}
```

## Pattern Generation System

The enhanced obstacle system will use a factory-based pattern generation system to create varied and interesting obstacle arrangements:

```typescript
// Pattern factory interface
interface ObstaclePatternFactory {
  createPattern(basePosition: THREE.Vector3, difficulty: number): ObstaclePatternConfig;
}

// Example jellyfish field pattern factory
class JellyfishFieldFactory implements ObstaclePatternFactory {
  createPattern(basePosition: THREE.Vector3, difficulty: number): ObstaclePatternConfig {
    const obstacles: ObstacleConfig[] = [];
    
    // Number of jellyfish based on difficulty
    const jellyfishCount = 3 + Math.floor(difficulty * 5); // 3-8 jellyfish
    
    // Grid arrangement with randomization
    const gridSize = Math.ceil(Math.sqrt(jellyfishCount));
    const spacing = 3 - difficulty * 0.5; // Spacing decreases with difficulty
    
    for (let i = 0; i < jellyfishCount; i++) {
      // Calculate grid position
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // Add randomness to position
      const randomX = (Math.random() - 0.5) * spacing * 0.5;
      const randomY = Math.random() * 2; // Height variation
      const randomZ = (Math.random() - 0.5) * spacing * 0.5;
      
      // Create position
      const position = new THREE.Vector3(
        basePosition.x + (col - gridSize/2 + 0.5) * spacing + randomX,
        basePosition.y + 1 + randomY,
        basePosition.z + (row - gridSize/2 + 0.5) * spacing + randomZ
      );
      
      // Add jellyfish configuration
      obstacles.push({
        type: 'jellyfish',
        position: position,
        // Other jellyfish-specific properties
        pulsateSpeed: 0.5 + Math.random() * 0.5,
        tentacleLength: 1 + difficulty * 0.5,
        driftSpeed: 0.2 + Math.random() * 0.3
      });
    }
    
    return {
      obstacles: obstacles,
      difficulty: difficulty,
      patternType: 'jellyfish_field'
    };
  }
}
```

## Advanced Shader-Based Animations and Effects

### Shark Animation System

The shark implementation will leverage a combination of mesh-based and shader-based animations:

```typescript
// Shark shader for body undulation
const sharkVertexShader = `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vCountershadeFactor; // Pass factor for countershading
    varying float vBodyZ; // Pass normalized Z position along body

    uniform float uTime;
    uniform float uBodyLength;
    uniform float uWaveFrequency;
    uniform float uWaveAmplitude;

    void main() {
        vec3 pos = position;
        
        // --- Body Undulation Animation ---
        // Normalize Z relative to body length (assuming centered origin)
        vBodyZ = (position.z + uBodyLength * 0.5) / uBodyLength; // Range 0 (tail) to 1 (nose)
        float wave = sin(vBodyZ * M_PI * 2.0 - uTime * uWaveFrequency) * uWaveAmplitude; // Sine wave along body
        // Apply more wave towards the tail
        float waveIntensity = pow(vBodyZ, 1.5); 
        pos.x += wave * waveIntensity; 

        // --- Calculate World Position & Normal ---
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        
        vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vNormal = normalize(normalMatrix * normal); // View space normal for lighting

        // --- Countershading Factor ---
        // Based on world normal's Y component (higher Y = top = darker)
        vCountershadeFactor = smoothstep(-0.1, 0.4, worldNormal.y); // Adjust range for desired blend

        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const sharkFragmentShader = `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vCountershadeFactor; // Receive countershade factor
    varying float vBodyZ; // Receive normalized Z pos

    uniform float uTime;
    uniform vec3 uColorDark;  // Darker top color
    uniform vec3 uColorLight; // Lighter belly color
    uniform sampler2D uCausticMap;

    // Simplified noise function for skin detail
    float noiseFS(vec2 p) { /* simplified noise implementation */ }
    float fbmFS(vec2 p, int octaves, float persistence) { /* simplified fbm implementation */ }

    void main() {
        vec3 normal = normalize(vNormal);

        // --- Determine Base Color with Countershading ---
        vec3 baseColor = mix(uColorLight, uColorDark, vCountershadeFactor);

        // Add subtle FBM noise for skin texture/variation
        float skinNoise = fbmFS(vWorldPosition.xz * 1.5, 3, 0.5); // Noise based on world pos
        baseColor += skinNoise * 0.04 * vec3(1.0); // Subtle brightness variation

        // --- Lighting (Blinn-Phong) ---
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 lightDir = normalize(vec3(0.4, 0.9, 0.6)); // Main light source direction
        
        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuseColor = baseColor * (diff * 0.7 + 0.3); // Diffuse + Ambient term
        
        // Specular
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float specAngle = max(dot(normal, halfwayDir), 0.0);
        float specularPower = 10.0; 
        float spec = pow(specAngle, specularPower);
        vec3 specularColor = vec3(spec * (0.15 + (1.0 - vCountershadeFactor) * 0.1)); 

        vec3 litColor = diffuseColor + specularColor;
        
        // Apply caustics
        vec2 causticUv = vWorldPosition.xz * 0.08 + vec2(uTime * 0.03, uTime * 0.02); 
        vec3 caustics = texture2D(uCausticMap, causticUv).rgb * 0.15 * (1.0 - vCountershadeFactor);

        gl_FragColor = vec4(litColor + caustics, 1.0);
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0/2.2)); // Gamma Correction
    }
`;

// The shark material creation would be implemented in the createSharkMaterial method
private createSharkMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: sharkVertexShader,
    fragmentShader: sharkFragmentShader,
    uniforms: {
      uTime: { value: 0.0 },
      uColorDark: { value: new THREE.Color(0x506070) }, // Dark bluish grey
      uColorLight: { value: new THREE.Color(0xD0D0D5) }, // Light grey/white belly
      uBodyLength: { value: 4.0 }, // Default, will be updated
      uWaveFrequency: { value: 3.0 + Math.random() * 1.5 }, // Randomize swim speed slightly
      uWaveAmplitude: { value: 0.08 + Math.random() * 0.04 }, // Randomize swim intensity
      uCausticMap: { value: causticTexture }
    },
    lights: false // Using custom lighting in shader
  });
}

// In the update method, we would update the time uniform
protected updateAnimation(deltaTime: number): void {
  if (this.shaderMaterial && this.shaderMaterial.uniforms.uTime) {
    this.shaderMaterial.uniforms.uTime.value += deltaTime;
  }
  
  // Update JavaScript-based animations as well
  this.updateTailAnimation(deltaTime);
  this.updateFinAnimation(deltaTime);
}

private updateTailAnimation(deltaTime: number): void {
  if (this.tailMesh) {
    const tailRotationY = -Math.cos(this.animationTime * this.waveFrequency) * 
                          this.waveAmplitude * 5.0;
    this.tailMesh.rotation.y = THREE.MathUtils.lerp(
      this.tailMesh.rotation.y, 
      tailRotationY, 
      deltaTime * 5.0
    );
  }
}
```

### Jellyfish Animation System

The jellyfish will use a combination of shader-based bell pulsation and tentacle animation:

```typescript
// Jellyfish vertex shader for pulsation and tentacle movement
const jellyfishVertexShader = `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vFresnelFactor;
    varying float vRelativeHeight;

    uniform float uTime;
    uniform float uPulseFrequency;
    uniform float uPulseAmplitude;
    uniform float uSwayFrequency;
    uniform float uSwayAmplitude;
    uniform float uIsTentacle;
    uniform float uLength;

    // Function to calculate Bell pulsation displacement
    vec3 getBellPulsation(vec3 pos, float relHeight) {
        float pulse = sin(uTime * uPulseFrequency) * 0.5 + 0.5; // 0 to 1 pulse value
        float pulseEffect = pow(relHeight, 0.5) * pulse * uPulseAmplitude; // More effect near rim
        // Expand radially, contract vertically slightly
        float radialScale = 1.0 + pulseEffect * 0.3;
        float verticalScale = 1.0 - pulseEffect * 0.1;
        return vec3(pos.x * radialScale, pos.y * verticalScale, pos.z * radialScale);
    }

    // Function to calculate Tentacle sway displacement
    vec3 getTentacleSway(vec3 pos, float relHeight) {
        // Sway based on height and time, use different frequencies for X/Z
        float swayFactor = pow(relHeight, 1.5) * uSwayAmplitude; // More sway at the tip
        float timeFactor = uTime * uSwayFrequency + pos.y * 0.3; // Add variation along length
        float swayX = sin(timeFactor + relHeight * 2.0) * swayFactor;
        float swayZ = cos(timeFactor * 0.7 + relHeight * 1.5) * swayFactor * 0.8; // Slightly different Z sway
        return vec3(pos.x + swayX, pos.y, pos.z + swayZ);
    }

    void main() {
        vec3 pos = position;
        vRelativeHeight = max(0.0, min(1.0, position.y / uLength)); // Normalized height/length

        // Apply pulsation OR sway
        if (uIsTentacle < 0.5) { // Bell
            pos = getBellPulsation(pos, vRelativeHeight);
        } else { // Tentacle
            pos = getTentacleSway(pos, vRelativeHeight);
        }

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vec3 transformedNormal = normalize(normalMatrix * normal);
        vNormal = transformedNormal;

        // Calculate Fresnel factor (for edge glow effect)
        vec3 viewVector = normalize(mvPosition.xyz);
        vFresnelFactor = pow(1.0 + dot(viewVector, transformedNormal), 2.5);

        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Jellyfish fragment shader
const jellyfishFragmentShader = `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vFresnelFactor; // Receive calculated fresnel factor
    varying float vRelativeHeight;

    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform float uOpacity;
    uniform float uGlowIntensity; // Controls emissive glow
    uniform float uPulseFrequency; // For syncing glow/opacity pulse

    // Basic noise function for subtle variation
    float noiseFS(vec2 p) { /* simplified implementation */ }

    void main() {
        // Pulsating opacity and glow
        float pulse = sin(uTime * uPulseFrequency) * 0.5 + 0.5; // 0 to 1 pulse
        float currentOpacity = uOpacity * (0.6 + pulse * 0.4); // Opacity pulses between 60% and 100% of base
        float currentGlow = uGlowIntensity * (0.5 + pulse * 0.5); // Glow pulses between 50% and 100% of base

        // Add subtle noise variation to color/glow
        float noiseVal = noiseFS(vWorldPosition.xz * 1.5 + uTime * 0.1) * 0.2 - 0.1; // Subtle noise value

        // Fresnel Effect
        float fresnel = smoothstep(0.0, 1.0, vFresnelFactor) * (0.5 + currentGlow * 0.5); // Stronger with glow

        // Color Calculation
        vec3 base = uBaseColor + vec3(noiseVal);
        // Combine base color with emissive glow, enhanced by fresnel
        vec3 emissiveColor = base * currentGlow * (1.0 + fresnel * 1.5); 
        vec3 finalColor = base * 0.1 + emissiveColor; // Base ambient + emissive glow

        // Final Output
        gl_FragColor = vec4(finalColor, currentOpacity * (0.5 + fresnel * 0.5)); // Boost alpha with fresnel too
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0/2.2)); // Gamma correction
    }
`;
```

### Pufferfish Inflation Animation

The pufferfish will implement a unique inflation behavior using custom shaders and mesh transformations:

```typescript
// Pufferfish inflation vertex shader
const pufferVertexShader = `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    uniform float uTime;
    uniform float uInflationFactor; // 0.0 = deflated, 1.0 = inflated
    uniform float uMaxInflationAmount; // How much the radius increases

    void main() {
        vUv = uv;
        vec3 pos = position;
        vec3 baseNormal = normal; // Store original normal

        // --- Inflation Deformation ---
        // Simple radial expansion based on inflation factor
        float inflation = uInflationFactor * uMaxInflationAmount;
        // Displace vertex along its normal
        pos += normal * inflation; 
        
        // Optional: Add subtle wobble/pulsation even when inflated/deflated
        float wobbleFreq = 3.0;
        float wobbleAmp = 0.02 * (1.0 + uInflationFactor); // Slightly more wobble when inflated
        float wobble = sin(uTime * wobbleFreq + position.y * 2.0) * wobbleAmp;
        pos += normal * wobble;

        // --- Final Position & Normal ---
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        
        // Recompute normal visually (doesn't affect lighting calc directly here)
        vNormal = normalize(normalMatrix * baseNormal); // Use base normal for lighting consistency

        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

// Pufferfish fragment shader with spots pattern
const pufferFragmentShader = `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    uniform float uTime;
    uniform float uInflationFactor;
    uniform vec3 uColorBody;
    uniform vec3 uColorSpots;

    // Noise functions 
    float hashFS(vec2 p) { /* simplified */ }
    float noiseFS(vec2 p) { /* simplified */ }
    float fbmFS(vec2 p, int o, float pe) { /* simplified */ }

    void main() {
        vec3 normal = normalize(vNormal);

        // --- Spot Pattern (Cellular/Voronoi-like noise) ---
        vec2 pos = vWorldPosition.xz * (1.5 + uInflationFactor * 0.5); // Pattern stretches slightly when inflated
        float spots = fbmFS(pos, 4, 0.5); // Use FBM for variation
        // Create sharper spots using smoothstep
        spots = smoothstep(0.4, 0.45, spots) - smoothstep(0.6, 0.65, spots); 
        
        // --- Base Color ---
        vec3 baseColor = mix(uColorBody, uColorSpots, spots * 0.8); // Mix body color with spot color

        // Add subtle color variation based on inflation (paler when stretched?)
        baseColor = mix(baseColor, baseColor * 1.1 + vec3(0.05), uInflationFactor * 0.3);

        // --- Lighting ---
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float specAngle = max(dot(normal, halfwayDir), 0.0);
        float spec = pow(specAngle, 12.0) * 0.3; // Relatively soft specular
        vec3 litColor = baseColor * (diff * 0.7 + 0.3) + vec3(spec);

        gl_FragColor = vec4(litColor, 1.0); // Opaque
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0/2.2)); // Gamma correction
    }
`;

// Spike shader for controlling spine visibility during inflation
const spikeVertexShader = `
    uniform float uInflationFactor; // Control spike scale/visibility
    uniform float uBaseScale; // Base size of the spike mesh

    void main() {
        // Scale spike based on inflation factor
        float scale = uBaseScale * uInflationFactor; // Linear scale
        
        // If scale is near zero, collapse vertex to hide it efficiently
        if (scale < 0.01) {
            gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }

        vec3 scaledPos = position * scale; // Apply scale
        
        // Position spike at its base location
        gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPos, 1.0);
    }
`;

// Pufferfish state machine implementation
private updatePufferfishState(deltaTime: number): void {
  switch(this.state) {
    case 'IDLE':
      this.updateInflationFactor(0, deltaTime);
      break;
    case 'INFLATING':
      this.updateInflationFactor(this.inflationFactor + deltaTime * this.inflationSpeed, deltaTime);
      if (this.inflationFactor >= 1.0) {
        this.inflationFactor = 1.0;
        this.state = 'INFLATED';
        this.inflationTimer = 0;
      }
      break;
    case 'INFLATED':
      this.updateInflationFactor(1.0, deltaTime);
      this.inflationTimer += deltaTime;
      if (this.inflationTimer >= this.inflationDuration) {
        this.state = 'DEFLATING';
      }
      break;
    case 'DEFLATING':
      this.updateInflationFactor(this.inflationFactor - deltaTime * this.deflationSpeed, deltaTime);
      if (this.inflationFactor <= 0) {
        this.inflationFactor = 0;
        this.state = 'IDLE';
      }
      break;
  }
  
  // Update shader uniforms
  if (this.bodyMaterial?.uniforms?.uInflationFactor) {
    this.bodyMaterial.uniforms.uInflationFactor.value = this.inflationFactor;
  }
  
  // Update spikes
  this.updateSpikes(this.inflationFactor);
  
  // Update collider size
  this.updateCollider();
}

// Update collider radius based on inflation
protected updateCollider(): void {
  if (this.collider instanceof THREE.Sphere) {
    // Base radius (deflated)
    const baseRadius = 0.5;
    
    // Scale radius based on inflation factor
    this.collider.radius = baseRadius * (1 + this.inflationFactor * this.maxInflation);
    this.collider.center.copy(this.position);
  }
}
```

### Clam Opening Animation

The clam obstacle will feature a hinge-based animation system for opening and closing shells:

```typescript
// Clam animation system
private updateClamAnimation(deltaTime: number): void {
  this.timer += deltaTime;
  const cycleDuration = this.openDuration + this.closedDuration + 2 * this.transitionDuration;
  const timeInCycle = this.timer % cycleDuration;
  
  let targetAngle = 0;
  let newState = this.state;
  
  // Determine state and target angle based on time in cycle
  if (timeInCycle < this.closedDuration) {
    newState = 'CLOSED';
    targetAngle = 0;
  } 
  else if (timeInCycle < this.closedDuration + this.transitionDuration) {
    newState = 'OPENING';
    const progress = (timeInCycle - this.closedDuration) / this.transitionDuration;
    targetAngle = THREE.MathUtils.lerp(0, this.maxOpenAngle, progress * progress); // Ease in opening
  } 
  else if (timeInCycle < this.closedDuration + this.transitionDuration + this.openDuration) {
    newState = 'OPEN';
    targetAngle = this.maxOpenAngle;
  } 
  else { // Closing
    newState = 'CLOSING';
    const progress = (timeInCycle - (this.closedDuration + this.transitionDuration + this.openDuration)) / this.transitionDuration;
    targetAngle = THREE.MathUtils.lerp(this.maxOpenAngle, 0, 1.0 - (1.0 - progress) * (1.0 - progress)); // Ease out closing
  }
  
  // Play sound on state change
  if (newState !== this.state) {
    if (newState === 'OPENING') {
      // Play opening sound
      eventBus.emit('play-sound', { name: 'clam-open', volume: 0.4 });
      
      // Emit bubbles when opening
      if (this.bubbleEmitter) {
        this.emitBubbles();
      }
    }
    if (newState === 'CLOSING') {
      // Play closing sound
      eventBus.emit('play-sound', { name: 'clam-close', volume: 0.5 });
    }
    this.state = newState;
  }
  
  // Smoothly rotate the top shell
  if (this.topShell) {
    this.topShell.rotation.x = THREE.MathUtils.lerp(
      this.topShell.rotation.x, 
      targetAngle, 
      deltaTime * 5.0
    );
    
    // Update collider based on shell rotation
    this.updateCollider();
  }
  
  // Update pearl glow if present
  if (this.pearl && this.quality === 'high') {
    // Make pearl glow stronger when open
    const glowOpacity = this.isOpen ? 0.4 : 0.2;
    
    // Apply to glow material if it exists
    if (this.pearl.children.length > 1) {
      const glowMesh = this.pearl.children[1];
      if (glowMesh instanceof THREE.Mesh && 
          glowMesh.material instanceof THREE.MeshBasicMaterial) {
        glowMesh.material.opacity = glowOpacity;
      }
    }
  }
}

// Update clam collider based on open/closed state
protected updateCollider(): void {
  if (this.collider instanceof THREE.Box3) {
    const width = 0.8;
    const depth = 0.8;
    
    // Height varies based on top shell rotation
    let height = 0.3;
    
    if (this.topShell) {
      // Use actual rotation to determine height
      const openRatio = this.topShell.rotation.x / this.maxOpenAngle;
      
      // Height increases as the clam opens
      height = 0.3 + openRatio * 0.5;
    }
    
    // Update box collider dimensions
    this.collider.min.set(
      this.position.x - width / 2,
      this.position.y - 0.15,
      this.position.z - depth / 2
    );
    
    this.collider.max.set(
      this.position.x + width / 2,
      this.position.y + height,
      this.position.z + depth / 2
    );
  }
}
```
```

## Implementation Steps

1. **Procedural Geometry Development**
   - Extract and adapt procedural geometry creation from example files
   - Implement shader-based animations and effects
   - Create proper LOD variants for performance optimization
   - Ensure proper collision geometry updates

2. **Obstacle Class Implementation**
   - Implement base Obstacle class
   - Create specialized classes for each obstacle type
   - Develop state machines for each obstacle
   - Implement collision systems

3. **Animation System**
   - Create animation clips for all obstacles
   - Implement animation mixing and transitions
   - Add event triggers for gameplay effects
   - Optimize animation performance

4. **Pattern Generation System**
   - Implement pattern factory architecture
   - Create varied pattern generators for each obstacle type
   - Design difficulty scaling for patterns
   - Implement pattern randomization

5. **Obstacle Manager Enhancement**
   - Extend ObstacleManager to support new obstacle types
   - Implement object pooling for all obstacles
   - Create optimized update cycle for active obstacles
   - Add lifecycle management and resource cleanup

6. **Integration and Testing**
   - Connect to core game systems
   - Test performance across device targets
   - Balance difficulty progression
   - Refine visual polish and animation quality

## Performance Targets

| Device Category | Obstacle Count | Animation Quality | Collision Detail | Special Effects |
|-----------------|---------------|------------------|------------------|-----------------|
| High-end Desktop | 20-30 | Full skeleton, 60fps | Precise per-mesh | Particle effects, dynamic lighting |
| Mid-range Desktop | 15-20 | Simplified bones, 60fps | Simplified meshes | Limited particles, basic lighting |
| Low-end Desktop | 10-15 | Basic animations, 30fps | Bounding box only | Minimal effects |
| High-end Mobile | 10-15 | Simplified bones, 60fps | Simplified meshes | Limited effects |
| Mid-range Mobile | 8-10 | Basic animations, 30fps | Bounding box only | No additional effects |
| Low-end Mobile | 5-8 | Limited keyframes, 30fps | Primitive colliders | No effects |

## Technical Considerations

1. **Memory Management**
   - Shared geometry for similar obstacles
   - Material instance reuse
   - Texture atlasing for obstacle types
   - Efficient object pooling

2. **Rendering Optimizations**
   - Frustum culling for off-screen obstacles
   - LOD system based on distance and device
   - Instance merging for similar obstacles
   - Shader simplification for low-end devices

3. **Collision Optimizations**
   - Broad-phase spatial partitioning
   - Simplified collision geometries for distant obstacles
   - Progressive collision detail based on proximity
   - Optimized collision response handling

This implementation plan provides a comprehensive approach to developing the obstacle system for Nemo Runner, focusing on both visual quality and performance optimization across a range of devices.

## Water and Bubble Effects ✅

To enhance the underwater environment and create a more immersive experience, the following water effects have been successfully implemented:

### Water Effects System Enhancement

1. **Caustics Effects** ✅
   - Implemented realistic light patterns on the ocean floor
   - Created shader with Fractal Brownian Motion (FBM) and Voronoi cellular noise
   - Applied animated displacement for realistic water light patterns

2. **Ambient Particles** ✅
   - Implemented floating dust/plankton particles with custom shader
   - Created quality-based particle system density adjustments
   - Added gentle swaying motion for organic underwater feel

3. **Light Rays** ✅
   - Created volumetric light shafts with gradient transparency
   - Implemented additive blending for realistic light scattering
   - Added dynamic positioning system that follows the player

4. **Surface Ripples** ✅
   - Created procedural wave animation using multiple noise patterns
   - Implemented Fresnel effect for realistic water surface reflection
   - Added quality-based detail levels for performance optimization

5. **Bubble System** ✅
   - Created performance-optimized instanced mesh bubble renderer
   - Implemented realistic Fresnel-based shader for bubble translucency
   - Added physics-based bubble rising behavior with wobble animation
   - Implemented bubble emission system for interactive gameplay events

### Integration with Game Systems

- All water effects integrated with the player movement system for proper positioning
- Bubble emission system connected to character and obstacle actions
- Adaptive quality system for performance optimization across device types
- Proper theme integration for water effects to match environment settings

### Technical Highlights

- Instanced rendering for bubble system provides significant performance improvements
- Shader-based animations reduce CPU load by moving animation to the GPU
- Quality-based LOD system ensures smooth performance on all device types
- Object pooling for bubbles and effects reduces memory allocation overhead
- Advanced material effects create realistic underwater atmosphere
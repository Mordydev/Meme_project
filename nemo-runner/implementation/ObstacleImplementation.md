# Obstacle System Implementation Plan

## Overview

This document outlines the implementation strategy for creating the obstacle system in the Nemo Runner game. Based on the examples in the example/ directory, the game will feature several underwater obstacles including sharks, jellyfish, pufferfish, and clams, each with unique behaviors and animations.

## Obstacle Types

### 1. Shark

**Visual Design:**
- Predatory shark with animated mouth and tail
- Realistic silhouette with detailed fins
- Textured for underwater environment with subtle normal mapping
- Animated eyes for enhanced expression

**Behavior:**
- Patrol movement along predefined paths
- Occasional lunging when player is nearby
- Mouth animation when attacking
- Tail swishing during movement

**Implementation Strategy:**
- Custom mesh with rigged skeleton for natural movement
- State machine with patrol, chase, and attack states
- Pathfinding system for intelligent movement
- Trigger zones for player detection

**Technical Specifications:**
- High-detail model: ~2000 triangles
- Medium-detail model: ~1000 triangles
- Low-detail model: ~500 triangles
- Animation system with 4-5 core animations (swim, turn, attack, idle)

### 2. Jellyfish

**Visual Design:**
- Translucent bell with subtle emission
- Flowing tentacles with physics-based movement
- Pulsating animation for the bell
- Particle effects for bioluminescence (high quality only)

**Behavior:**
- Slowly pulsating vertical movement
- Randomly drifting horizontally
- Tentacles that create danger zones for the player
- Gentle pulsing glow effect

**Implementation Strategy:**
- Main bell mesh with shader-animated tentacles
- Physics-based simulation for tentacle movement
- Vertex displacement for bell pulsation
- Custom shader for translucency and emission

**Technical Specifications:**
- Bell: 200-300 triangles with displacement mapping
- Tentacles: Shader-based procedural animation
- Custom translucent material with refraction
- Efficient collision detection for tentacle danger zones

### 3. Pufferfish

**Visual Design:**
- Compact small fish when inactive
- Expanded spiky form when triggered
- Detailed texture with pattern
- Animation for inflation/deflation

**Behavior:**
- Initially small and seemingly harmless
- Inflates rapidly when player approaches
- Creates a temporary barrier/obstacle
- Deflates after a set period

**Implementation Strategy:**
- Morphing mesh for inflation animation
- Proximity-based trigger system
- Timed state transitions
- Custom material for spines

**Technical Specifications:**
- Base model: 300-400 triangles
- Expanded model: 600-800 triangles
- Morph targets for smooth inflation animation
- Physics-based collision detection that adapts to current state

### 4. Clam

**Visual Design:**
- Detailed shell with realistic texture
- Inner pearl with subtle glow
- Animation for opening and closing
- Particle effects for bubbles when opening

**Behavior:**
- Rhythmically opens and closes
- Can be passed when open
- Blocks path when closed
- Pattern-based timing for gameplay challenge

**Implementation Strategy:**
- Animated mesh with hinge point for shell
- Timed state machine for opening/closing pattern
- Collision detection that changes with shell state
- Visual indicators for timing

**Technical Specifications:**
- 300-500 triangles per clam
- Simple skeletal rig for shell animation
- State-based collision geometry
- Shader effects for pearl glow (high quality only)

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
    // Placeholder for actual model loading logic
    const group = new THREE.Group();
    
    // Create appropriate detail level based on quality
    // This would be replaced with actual model loading
    
    return group;
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

## Implementation Steps

1. **Model Development**
   - Create detailed 3D models for each obstacle type
   - Set up animation rigs for each model
   - Create texture sets with appropriate maps
   - Develop LOD variants for performance

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
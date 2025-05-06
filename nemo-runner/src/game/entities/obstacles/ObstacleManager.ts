import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import { CollisionSystem, Collidable } from '../../core/CollisionSystem';
import { Character } from '../character/Character';
import eventBus from '../../core/EventSystem';
import { detectDeviceCapabilities, optimizeModelAsset, optimizeGeometry } from '../../utils/DeviceUtils';

// Obstacle types
export type ObstacleType = 'shark' | 'jellyfish' | 'pufferfish' | 'clam' | 'coral';

// Obstacle interface
interface Obstacle extends Collidable {
  type: 'obstacle';
  obstacleType: ObstacleType;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  speed: number;
  isLooping: boolean;
  removeDistance: number;
  update: (deltaTime: number) => void;
}

// Obstacle pattern type for structured layouts
interface ObstaclePattern {
  obstacles: {
    type: ObstacleType;
    position: [number, number, number]; // x, y, z
    rotation?: [number, number, number]; // x, y, z in radians
    scale?: [number, number, number]; // x, y, z
    speed?: number; // Movement speed modifier
  }[];
  difficulty: number; // Difficulty rating (1-10)
  gapLength: number; // Length of clear space before next pattern
}

/**
 * Manages creation, update, and removal of obstacles in the game
 */
export class ObstacleManager {
  // Three.js scene reference
  private scene: THREE.Scene;
  
  // Collision system reference
  private collisionSystem: CollisionSystem;
  
  // Asset manager reference
  private assetManager: AssetManager;
  
  // Active obstacles
  private obstacles: Map<string, Obstacle> = new Map();
  
  // Object pooling for better performance
  private obstaclePools: Map<ObstacleType, Obstacle[]> = new Map();
  
  // Obstacle patterns
  private patterns: ObstaclePattern[] = [];
  
  // Spawn distances (adjusted based on difficulty)
  private lastSpawnZ: number = 0;
  private spawnDistance: number = 15; // Initial distance between obstacles
  private minSpawnDistance: number = 5; // Minimum spawn distance at max difficulty
  private difficultyLevel: number = 1; // Current difficulty level (1-10)
  private maxDifficulty: number = 10;
  private difficultyIncreaseRate: number = 0.01; // How fast difficulty increases per unit of distance
  
  // Performance optimization
  private maxActiveObstacles: number = 50;
  private cullingDistance: number = -20; // Distance behind player to remove obstacles
  
  // Obstacle counter for unique IDs
  private obstacleCounter: number = 0;
  
  // Device capability tracking
  private deviceCapabilities = detectDeviceCapabilities();
  
  constructor(scene: THREE.Scene, assetManager: AssetManager, collisionSystem: CollisionSystem) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.collisionSystem = collisionSystem;
    
    // Initialize obstacle pools
    this.initializeObstaclePools();
    
    // Define patterns
    this.definePatterns();
    
    // Adjust active obstacles limit based on device capabilities
    if (this.deviceCapabilities.highEnd) {
      this.maxActiveObstacles = 80;
    } else if (this.deviceCapabilities.midRange) {
      this.maxActiveObstacles = 50;
    } else {
      this.maxActiveObstacles = 30;
    }
  }
  
  /**
   * Initialize pools for each obstacle type
   */
  private initializeObstaclePools(): void {
    // Create empty pools for each obstacle type
    const obstacleTypes: ObstacleType[] = ['shark', 'jellyfish', 'pufferfish', 'clam', 'coral'];
    
    for (const type of obstacleTypes) {
      this.obstaclePools.set(type, []);
    }
  }
  
  /**
   * Define obstacle patterns
   */
  private definePatterns(): void {
    // Basic patterns
    this.patterns = [
      // Pattern 1: Simple line of jellyfish
      {
        obstacles: [
          { type: 'jellyfish', position: [-2, 0, 0] },
          { type: 'jellyfish', position: [0, 0, 0] },
          { type: 'jellyfish', position: [2, 0, 0] }
        ],
        difficulty: 1,
        gapLength: 10
      },
      
      // Pattern 2: Alternating jellies
      {
        obstacles: [
          { type: 'jellyfish', position: [-2, 0, 0] },
          { type: 'jellyfish', position: [2, 0, 5] },
          { type: 'jellyfish', position: [-2, 0, 10] }
        ],
        difficulty: 2,
        gapLength: 5
      },
      
      // Pattern 3: Shark path
      {
        obstacles: [
          { type: 'shark', position: [0, 0, 0], rotation: [0, Math.PI / 2, 0] }
        ],
        difficulty: 3,
        gapLength: 15
      },
      
      // Pattern 4: Vertical challenge
      {
        obstacles: [
          { type: 'coral', position: [-2, -1, 0] },
          { type: 'coral', position: [0, -1, 0] },
          { type: 'coral', position: [2, -1, 0] },
          { type: 'jellyfish', position: [0, 1, 0] }
        ],
        difficulty: 4,
        gapLength: 12
      },
      
      // Pattern 5: Pufferfish wall with gap
      {
        obstacles: [
          { type: 'pufferfish', position: [-2, 0, 0] },
          { type: 'pufferfish', position: [-2, -1, 0] },
          { type: 'pufferfish', position: [2, 0, 0] },
          { type: 'pufferfish', position: [2, -1, 0] }
        ],
        difficulty: 5,
        gapLength: 8
      },
      
      // Pattern 6: Shark slalom
      {
        obstacles: [
          { type: 'shark', position: [-4, 0, 0], rotation: [0, Math.PI / 4, 0] },
          { type: 'shark', position: [4, 0, 8], rotation: [0, -Math.PI / 4, 0] },
          { type: 'shark', position: [-4, 0, 16], rotation: [0, Math.PI / 4, 0] }
        ],
        difficulty: 6,
        gapLength: 10
      },
      
      // Pattern 7: Coral reef
      {
        obstacles: [
          { type: 'coral', position: [-3, -1, 0] },
          { type: 'coral', position: [-2, -1, 2] },
          { type: 'coral', position: [-1, -1, 4] },
          { type: 'coral', position: [0, -1, 6] },
          { type: 'coral', position: [1, -1, 8] },
          { type: 'coral', position: [2, -1, 10] },
          { type: 'coral', position: [3, -1, 12] }
        ],
        difficulty: 7,
        gapLength: 5
      },
      
      // Pattern 8: Clam trap
      {
        obstacles: [
          { type: 'clam', position: [-1, -1, 0] },
          { type: 'clam', position: [1, -1, 0] },
          { type: 'clam', position: [-2, -1, 5] },
          { type: 'clam', position: [0, -1, 5] },
          { type: 'clam', position: [2, -1, 5] }
        ],
        difficulty: 8,
        gapLength: 7
      },
      
      // Pattern 9: Mixed hazards
      {
        obstacles: [
          { type: 'jellyfish', position: [0, 1, 0] },
          { type: 'pufferfish', position: [-2, 0, 5] },
          { type: 'pufferfish', position: [2, 0, 5] },
          { type: 'shark', position: [0, 0, 15], rotation: [0, Math.PI / 2, 0] }
        ],
        difficulty: 9,
        gapLength: 10
      },
      
      // Pattern 10: Hard challenge
      {
        obstacles: [
          { type: 'shark', position: [-3, 0, 0], rotation: [0, Math.PI / 2, 0] },
          { type: 'jellyfish', position: [-1, 1, 5] },
          { type: 'jellyfish', position: [1, -1, 5] },
          { type: 'pufferfish', position: [0, 0, 10] },
          { type: 'jellyfish', position: [-2, 0, 15] },
          { type: 'jellyfish', position: [2, 0, 15] },
          { type: 'shark', position: [3, 0, 20], rotation: [0, Math.PI / 2, 0] }
        ],
        difficulty: 10,
        gapLength: 5
      }
    ];
  }
  
  /**
   * Update all obstacles
   * @param deltaTime Time since last update
   * @param playerZ Player's Z position
   * @param playerSpeed Player's forward speed
   */
  public update(deltaTime: number, playerZ: number, playerSpeed: number): void {
    // Increase difficulty based on distance
    this.updateDifficulty(playerZ);
    
    // Check if we need to spawn more obstacles
    this.checkObstacleSpawning(playerZ);
    
    // Update all active obstacles
    for (const obstacle of this.obstacles.values()) {
      obstacle.update(deltaTime);
      
      // Update collision position
      this.collisionSystem.updateCollidablePosition(
        obstacle.id,
        'obstacle',
        obstacle.position
      );
      
      // Check if obstacle is too far behind the player and should be removed
      if (obstacle.position.z < playerZ + this.cullingDistance) {
        this.removeObstacle(obstacle.id);
      }
    }
    
    // Limit number of active obstacles for performance
    this.enforceLimits();
  }
  
  /**
   * Update difficulty level based on distance
   * @param playerZ Player's Z position
   */
  private updateDifficulty(playerZ: number): void {
    // Increase difficulty based on player progress
    const absoluteDistance = Math.abs(playerZ);
    this.difficultyLevel = Math.min(
      this.maxDifficulty,
      1 + absoluteDistance * this.difficultyIncreaseRate
    );
    
    // Update spawn distance based on difficulty
    const difficultyRatio = (this.difficultyLevel - 1) / (this.maxDifficulty - 1);
    this.spawnDistance = this.minSpawnDistance + (15 - this.minSpawnDistance) * (1 - difficultyRatio);
  }
  
  /**
   * Check if new obstacles should be spawned
   * @param playerZ Player's Z position
   */
  private checkObstacleSpawning(playerZ: number): void {
    const spawnAheadDistance = 100; // Spawn obstacles this far ahead of player
    
    // If we've moved far enough, spawn new obstacles
    if (playerZ - this.lastSpawnZ <= -this.spawnDistance) {
      this.spawnObstaclePattern(playerZ - spawnAheadDistance);
      this.lastSpawnZ = playerZ;
    }
  }
  
  /**
   * Spawn a pattern of obstacles
   * @param baseZ Base Z position for the pattern
   */
  private spawnObstaclePattern(baseZ: number): void {
    // Filter patterns based on current difficulty
    const availablePatterns = this.patterns.filter(
      pattern => pattern.difficulty <= this.difficultyLevel
    );
    
    if (availablePatterns.length === 0) return;
    
    // Random pattern selection
    const pattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    
    // Spawn all obstacles in the pattern
    for (const obstacleInfo of pattern.obstacles) {
      const position = new THREE.Vector3(
        obstacleInfo.position[0],
        obstacleInfo.position[1],
        obstacleInfo.position[2] + baseZ
      );
      
      // Optional rotation and scale
      const rotation = obstacleInfo.rotation
        ? new THREE.Euler(
            obstacleInfo.rotation[0],
            obstacleInfo.rotation[1],
            obstacleInfo.rotation[2]
          )
        : new THREE.Euler();
      
      const scale = obstacleInfo.scale
        ? new THREE.Vector3(
            obstacleInfo.scale[0],
            obstacleInfo.scale[1],
            obstacleInfo.scale[2]
          )
        : new THREE.Vector3(1, 1, 1);
      
      // Spawn the obstacle
      this.spawnObstacle(
        obstacleInfo.type,
        position,
        rotation,
        scale,
        obstacleInfo.speed || 1
      );
    }
    
    // Emit event for pattern spawn
    eventBus.emit('obstacle-pattern-spawned', {
      patternDifficulty: pattern.difficulty,
      baseZ
    });
  }
  
  /**
   * Spawn a single obstacle
   * @param type Type of obstacle
   * @param position Position in world space
   * @param rotation Rotation in radians
   * @param scale Scale of the obstacle
   * @param speedModifier Speed modifier for the obstacle
   * @returns The created obstacle
   */
  private spawnObstacle(
    type: ObstacleType,
    position: THREE.Vector3,
    rotation: THREE.Euler = new THREE.Euler(),
    scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1),
    speedModifier: number = 1
  ): Obstacle {
    // Try to get an obstacle from the pool
    const pool = this.obstaclePools.get(type) || [];
    let obstacle: Obstacle | undefined = pool.pop();
    
    if (!obstacle) {
      // Create a new obstacle if the pool is empty
      obstacle = this.createObstacle(type);
    }
    
    // Reset and configure the obstacle
    obstacle.position.copy(position);
    obstacle.rotation.copy(rotation);
    obstacle.scale.copy(scale);
    obstacle.speed = speedModifier;
    obstacle.isActive = true;
    
    // Add to scene if not already
    if (!this.scene.getObjectById(obstacle.mesh.id)) {
      this.scene.add(obstacle.mesh);
    }
    
    // Set mesh position/rotation/scale
    obstacle.mesh.position.copy(position);
    obstacle.mesh.rotation.copy(rotation);
    obstacle.mesh.scale.copy(scale);
    
    // Update collider
    if (obstacle.collider instanceof THREE.Sphere) {
      obstacle.collider.center.copy(position);
    } else if (obstacle.collider instanceof THREE.Box3) {
      // Assuming the box is centered at the origin of the mesh
      const size = new THREE.Vector3(1, 1, 1).multiply(scale);
      const halfSize = size.clone().multiplyScalar(0.5);
      
      obstacle.collider.min.copy(position).sub(halfSize);
      obstacle.collider.max.copy(position).add(halfSize);
    }
    
    // Register with collision system
    this.collisionSystem.registerCollidable(obstacle);
    
    // Add to active obstacles
    this.obstacles.set(obstacle.id, obstacle);
    
    return obstacle;
  }
  
  /**
   * Create a new obstacle
   * @param type Type of obstacle to create
   * @returns Created obstacle
   */
  private createObstacle(type: ObstacleType): Obstacle {
    const id = `obstacle_${type}_${this.obstacleCounter++}`;
    let mesh: THREE.Object3D;
    let collider: THREE.Sphere | THREE.Box3;
    
    // Load mesh from asset manager or create placeholder
    const modelAsset = this.assetManager.getAsset(`obstacle_${type}`);
    if (modelAsset && modelAsset.scene) {
      // Clone the mesh from loaded asset
      mesh = modelAsset.scene.clone();
      
      // Apply device-specific optimizations to model
      mesh = optimizeModelAsset(mesh, this.deviceCapabilities);
      
      // Add type-specific optimization tricks
      switch(type) {
        case 'jellyfish':
          // Jellyfish are translucent - ensure transparent materials
          mesh.traverse((object: THREE.Object3D) => {
            if (object instanceof THREE.Mesh && object.material) {
              if (object.material instanceof THREE.Material) {
                object.material.transparent = true;
                object.material.opacity = 0.8;
              }
            }
          });
          break;
          
        case 'shark':
          // For low-end devices, use even simpler shark geometry 
          if (this.deviceCapabilities.lowEnd) {
            mesh.traverse((object: THREE.Object3D) => {
              if (object instanceof THREE.Mesh && object.geometry.attributes.position.count > 500) {
                // Extra simplification for sharks on low-end devices
                // (In addition to the general optimization already done)
                optimizeGeometry(object.geometry, 0.5);
              }
            });
          }
          break;
      }
    } else {
      // Create placeholder mesh based on obstacle type
      mesh = this.createPlaceholderMesh(type);
    }
    
    // Create appropriate collider based on obstacle type
    switch (type) {
      case 'shark':
        // Elongated collider for sharks
        collider = new THREE.Box3(
          new THREE.Vector3(-1, -0.5, -3),
          new THREE.Vector3(1, 0.5, 3)
        );
        break;
      case 'jellyfish':
        // Sphere with tentacles extending below
        collider = new THREE.Box3(
          new THREE.Vector3(-0.5, -1.5, -0.5),
          new THREE.Vector3(0.5, 0.5, 0.5)
        );
        break;
      case 'pufferfish':
        // Sphere for pufferfish
        collider = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0.8);
        break;
      case 'clam':
        // Box for clams
        collider = new THREE.Box3(
          new THREE.Vector3(-0.8, -0.3, -0.8),
          new THREE.Vector3(0.8, 0.3, 0.8)
        );
        break;
      case 'coral':
        // Irregular box for coral
        collider = new THREE.Box3(
          new THREE.Vector3(-0.7, -0.1, -0.7),
          new THREE.Vector3(0.7, 1.5, 0.7)
        );
        break;
      default:
        // Default sphere collider
        collider = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
    }
    
    // Create obstacle object
    const obstacle: Obstacle = {
      id,
      type: 'obstacle',
      obstacleType: type,
      collider,
      mesh,
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1),
      speed: 1,
      isActive: true,
      isLooping: false,
      removeDistance: -20,
      
      // Default update function based on obstacle type
      update: (deltaTime: number) => {
        // Update based on obstacle type
        switch (type) {
          case 'jellyfish':
            // Jellyfish bob up and down
            mesh.position.y = obstacle.position.y + Math.sin(performance.now() * 0.001 * obstacle.speed) * 0.3;
            break;
          case 'pufferfish':
            // Pufferfish slowly rotate
            mesh.rotation.y += deltaTime * 0.5 * obstacle.speed;
            break;
          case 'shark':
            // Sharks might have side-to-side movement
            mesh.position.x = obstacle.position.x + Math.sin(performance.now() * 0.0005 * obstacle.speed) * 0.5;
            break;
          case 'clam':
            // Clams open and close
            const openAmount = (Math.sin(performance.now() * 0.001 * obstacle.speed) + 1) / 2;
            if (mesh.children.length >= 2) {
              // Assuming first child is bottom shell, second is top shell
              mesh.children[1].rotation.x = openAmount * Math.PI * 0.3;
            }
            break;
        }
        
        // Ensure mesh position/rotation stays synced with obstacle
        mesh.position.x = obstacle.position.x;
        mesh.position.z = obstacle.position.z;
        
        // Update collider
        if (collider instanceof THREE.Sphere) {
          collider.center.copy(mesh.position);
        } else if (collider instanceof THREE.Box3) {
          // Get the size of the box
          const size = new THREE.Vector3().subVectors(collider.max, collider.min);
          const halfSize = size.clone().multiplyScalar(0.5);
          
          // Update box position to match mesh
          collider.min.copy(mesh.position).sub(halfSize);
          collider.max.copy(mesh.position).add(halfSize);
        }
      },
      
      // Custom collision handler based on obstacle type
      onCollision: (character: Character) => {
        // Specific behavior on collision
        switch (type) {
          case 'pufferfish':
            // Pufferfish might inflate when hit
            mesh.scale.setScalar(1.5);
            break;
        }
      }
    };
    
    return obstacle;
  }
  
  /**
   * Create a placeholder mesh for an obstacle
   * @param type Obstacle type
   * @returns Placeholder mesh
   */
  private createPlaceholderMesh(type: ObstacleType): THREE.Object3D {
    let mesh: THREE.Object3D;
    
    switch (type) {
      case 'shark':
        // Elongated body for shark
        const sharkBody = new THREE.Group();
        
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.3, 4, 8),
          new THREE.MeshBasicMaterial({ color: 0x505050 })
        );
        body.rotation.z = Math.PI / 2;
        
        const fin = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 1, 4),
          new THREE.MeshBasicMaterial({ color: 0x505050 })
        );
        fin.position.set(0, 0.8, 0);
        
        sharkBody.add(body);
        sharkBody.add(fin);
        mesh = sharkBody;
        break;
        
      case 'jellyfish':
        // Dome with tentacles
        const jellyGroup = new THREE.Group();
        
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0xFFAAFF, transparent: true, opacity: 0.7 })
        );
        
        // Add tentacles
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const tentacle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.02, 1.2, 4),
            new THREE.MeshBasicMaterial({ color: 0xFFAAFF, transparent: true, opacity: 0.5 })
          );
          tentacle.position.set(Math.sin(angle) * 0.3, -0.7, Math.cos(angle) * 0.3);
          tentacle.rotation.x = Math.PI / 2;
          jellyGroup.add(tentacle);
        }
        
        jellyGroup.add(dome);
        mesh = jellyGroup;
        break;
        
      case 'pufferfish':
        // Spiky sphere for pufferfish
        const pufferGroup = new THREE.Group();
        
        const pufferBody = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xFFAA00 })
        );
        
        // Add spikes
        for (let i = 0; i < 15; i++) {
          const phi = Math.acos(-1 + (2 * i) / 15);
          const theta = Math.sqrt(15 * Math.PI) * phi;
          
          const spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.1, 0.3, 4),
            new THREE.MeshBasicMaterial({ color: 0xFFAA00 })
          );
          
          spike.position.setFromSphericalCoords(0.5, phi, theta);
          spike.lookAt(0, 0, 0);
          spike.rotateX(Math.PI / 2);
          
          pufferGroup.add(spike);
        }
        
        pufferGroup.add(pufferBody);
        mesh = pufferGroup;
        break;
        
      case 'clam':
        // Two half-shells
        const clamGroup = new THREE.Group();
        
        const bottomShell = new THREE.Mesh(
          new THREE.SphereGeometry(0.7, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0xDDDDDD })
        );
        bottomShell.rotation.x = Math.PI;
        bottomShell.position.y = -0.1;
        
        const topShell = new THREE.Mesh(
          new THREE.SphereGeometry(0.7, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0xCCCCCC })
        );
        topShell.position.y = 0.1;
        
        clamGroup.add(bottomShell);
        clamGroup.add(topShell);
        mesh = clamGroup;
        break;
        
      case 'coral':
        // Branching structure
        const coralGroup = new THREE.Group();
        
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.5, 0.5, 6),
          new THREE.MeshBasicMaterial({ color: 0xFF6666 })
        );
        base.position.y = 0.25;
        
        // Add branches
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.2, 0.8 + Math.random() * 0.5, 5),
            new THREE.MeshBasicMaterial({ color: 0xFF6666 })
          );
          branch.position.set(
            Math.sin(angle) * 0.2,
            0.7 + Math.random() * 0.3,
            Math.cos(angle) * 0.2
          );
          branch.rotation.x = Math.random() * 0.3;
          branch.rotation.z = Math.random() * 0.3;
          coralGroup.add(branch);
        }
        
        coralGroup.add(base);
        mesh = coralGroup;
        break;
        
      default:
        // Default cube placeholder
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial({ color: 0xFF0000, wireframe: true })
        );
    }
    
    return mesh;
  }
  
  /**
   * Remove an obstacle
   * @param id ID of the obstacle to remove
   */
  private removeObstacle(id: string): void {
    const obstacle = this.obstacles.get(id);
    if (!obstacle) return;
    
    // Remove from active obstacles
    this.obstacles.delete(id);
    
    // Unregister from collision system
    this.collisionSystem.unregisterCollidable(id, 'obstacle');
    
    // Remove from scene
    this.scene.remove(obstacle.mesh);
    
    // Deactivate
    obstacle.isActive = false;
    
    // Return to pool
    const pool = this.obstaclePools.get(obstacle.obstacleType);
    if (pool) pool.push(obstacle);
  }
  
  /**
   * Enforce limits on active obstacles
   */
  private enforceLimits(): void {
    // If we have too many active obstacles, remove the furthest ones
    if (this.obstacles.size > this.maxActiveObstacles) {
      const sortedObstacles = Array.from(this.obstacles.values()).sort(
        (a, b) => b.position.z - a.position.z
      );
      
      // Remove excess obstacles
      for (let i = this.maxActiveObstacles; i < sortedObstacles.length; i++) {
        this.removeObstacle(sortedObstacles[i].id);
      }
    }
  }
  
  /**
   * Clear all obstacles
   */
  public clear(): void {
    // Remove all obstacles
    for (const id of this.obstacles.keys()) {
      this.removeObstacle(id);
    }
    
    // Reset spawn position
    this.lastSpawnZ = 0;
  }
  
  /**
   * Set the time scale for obstacles (for slow-time power-up)
   * @param scale Time scale factor (0.5 = half speed, 1.0 = normal speed)
   */
  public setTimeScale(scale: number): void {
    // Modify all active obstacles' speed based on the time scale
    for (const obstacle of this.obstacles.values()) {
      // Adjust the obstacle speed based on the scale
      // For simplicity, we're directly modifying the speed
      // In a more sophisticated implementation, we might store baseSpeed and currentSpeed
      obstacle.speed = scale;
    }
    
    // Log for debugging
    console.log(`[ObstacleManager] Time scale set to ${scale}`);
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Clear all active obstacles
    this.clear();
    
    // Clean up pooled objects
    for (const pool of this.obstaclePools.values()) {
      for (const obstacle of pool) {
        if (obstacle.mesh) {
          obstacle.mesh.traverse((obj: any) => {
            if (obj instanceof THREE.Mesh) {
              if (obj.geometry) obj.geometry.dispose();
              if (obj.material) {
                if (Array.isArray(obj.material)) {
                  obj.material.forEach((mat: THREE.Material) => mat.dispose());
                } else {
                  obj.material.dispose();
                }
              }
            }
          });
        }
      }
    }
    
    // Clear pools
    this.obstaclePools.clear();
  }
}
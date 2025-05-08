import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import { CollisionSystem, Collidable } from '../../core/CollisionSystem';
import { Character } from '../character/Character';
import eventBus from '../../core/EventSystem';
import { DeviceCapabilities } from '../../utils/DeviceUtils';

// Import concrete obstacle classes
import { Obstacle, ObstacleConfig } from './Obstacle';
import { Shark, SharkConfig } from './Shark';
import { Jellyfish, JellyfishConfig } from './Jellyfish';
import { Pufferfish, PufferfishConfig } from './Pufferfish';
import { Clam, ClamConfig } from './Clam';
import { Coral } from './Coral';

// Obstacle types
export type ObstacleType = 'shark' | 'jellyfish' | 'pufferfish' | 'clam' | 'coral';

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
  
  // Pattern control
  private difficultyLevel: number = 1;
  private lastPatternIndex: number = -1;
  private lastSpawnZ: number = 0;
  private spawnAheadDistance: number = 100;
  private despawnDistance: number = 20;
  
  // Obstacle limits
  private maxActiveObstacles: number = 50;
  private maxObstacles: number = 50;
  
  // Performance settings
  private spawnRateMultiplier: number = 1.0;
  private useSimplifiedColliders: boolean = false;
  private detailLevel: number = 2; // 1=low, 2=medium, 3=high
  private qualityLevel: 'low' | 'medium' | 'high' = 'medium';
  
  // Device capabilities for optimization
  private deviceCapabilities: DeviceCapabilities;
  
  /**
   * Constructor
   * @param scene Three.js scene
   * @param collisionSystem Collision system
   * @param assetManager Asset manager
   * @param deviceCapabilities Device capabilities
   */
  // Safe zones to avoid placing obstacles on decorations
  private safeZones: Map<number, Array<{position: THREE.Vector3, radius: number}>> = new Map();
  
  constructor(
    scene: THREE.Scene,
    collisionSystem: CollisionSystem,
    assetManager: AssetManager,
    deviceCapabilities: DeviceCapabilities
  ) {
    this.scene = scene;
    this.collisionSystem = collisionSystem;
    this.assetManager = assetManager;
    this.deviceCapabilities = deviceCapabilities;
    
    // Initialize obstacle pools
    this.initializeObstaclePools();
    
    // Define patterns
    this.definePatterns();
    
    // Listen for environment safe zones updates
    this.setupEventListeners();
    
    console.log('[ObstacleManager] Initialized');
  }
  
  /**
   * Set up event listeners for environment integration
   */
  private setupEventListeners(): void {
    // Listen for safe zone updates from the environment system
    eventBus.on('environment-safe-zones-update', (data: {
      segmentZ: number;
      segmentLength: number;
      safeZones: Array<{position: THREE.Vector3, radius: number}>;
    }) => {
      // Store safe zones for this segment Z position (rounded to nearest 10 for easier lookup)
      const segmentZKey = Math.round(data.segmentZ / 10) * 10;
      this.safeZones.set(segmentZKey, data.safeZones);
      
      // Clean up old safe zones to prevent memory leaks
      // Keep only the last 20 segments worth of safe zones
      const allKeys = Array.from(this.safeZones.keys()).sort((a, b) => b - a);
      if (allKeys.length > 20) {
        const keysToRemove = allKeys.slice(20);
        for (const key of keysToRemove) {
          this.safeZones.delete(key);
        }
      }
    });
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
          // Position coral at ground level (y = -1.5) for proper alignment with the ground system
          { type: 'coral', position: [-2, -1.5, 0] },
          { type: 'coral', position: [0, -1.5, 0] },
          { type: 'coral', position: [2, -1.5, 0] },
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
          // Position coral at ground level (y = -1.5) for proper alignment with the ground system
          { type: 'coral', position: [-3, -1.5, 0] },
          { type: 'coral', position: [-2, -1.5, 2] },
          { type: 'coral', position: [-1, -1.5, 4] },
          { type: 'coral', position: [0, -1.5, 6] },
          { type: 'coral', position: [1, -1.5, 8] },
          { type: 'coral', position: [2, -1.5, 10] },
          { type: 'coral', position: [3, -1.5, 12] }
        ],
        difficulty: 7,
        gapLength: 5
      },
      
      // Pattern 8: Coral and clam combo
      {
        obstacles: [
          { type: 'coral', position: [-2, -1.5, 0] },
          { type: 'clam', position: [0, -1, 0] },
          { type: 'coral', position: [2, -1.5, 0] }
        ],
        difficulty: 3,
        gapLength: 7
      },
      
      // Pattern 9: Mixed threats
      {
        obstacles: [
          { type: 'jellyfish', position: [-2, 0, 0] },
          { type: 'pufferfish', position: [0, 0, 5] },
          { type: 'clam', position: [2, -1, 10] }
        ],
        difficulty: 5,
        gapLength: 5
      },
      
      // Pattern 10: Shark and coral
      {
        obstacles: [
          { type: 'shark', position: [0, 0, 0], rotation: [0, Math.PI / 2, 0] },
          { type: 'coral', position: [-3, -1.5, 3] },
          { type: 'coral', position: [3, -1.5, 3] },
          { type: 'coral', position: [-3, -1.5, 6] },
          { type: 'coral', position: [3, -1.5, 6] }
        ],
        difficulty: 7,
        gapLength: 10
      }
    ];
  }
  
  /**
   * Update obstacle manager
   * @param playerPosition Current player position
   * @param playerSpeed Current player speed
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3, playerSpeed: number = 1): void {
    // Update all obstacles
    for (const obstacle of this.obstacles.values()) {
      obstacle.update(deltaTime, playerPosition, playerSpeed);
      
      // Remove obstacles that are too far behind the player
      if (obstacle.position.z > playerPosition.z + this.despawnDistance) {
        this.removeObstacle(obstacle.id);
      }
    }
    
    // Spawn new obstacles if needed
    this.spawnObstacles(playerPosition);
    
    // Enforce maximum obstacle limit
    this.enforceLimits();
  }
  
  /**
   * Spawn obstacles ahead of player
   * @param playerPosition Current player position
   */
  private spawnObstacles(playerPosition: THREE.Vector3): void {
    // Only spawn if we need to fill the area ahead
    if (this.lastSpawnZ > playerPosition.z - this.spawnAheadDistance) {
      return;
    }
    
    // Determine if we should spawn a pattern or a random obstacle
    const usePattern = Math.random() < 0.8; // 80% chance to use a pattern
    
    if (usePattern) {
      // Find valid patterns for the current difficulty
      const validPatterns = this.patterns.filter(
        pattern => pattern.difficulty <= this.difficultyLevel + 2 && 
                 pattern.difficulty >= this.difficultyLevel - 2
      );
      
      if (validPatterns.length === 0) {
        // Fallback to random obstacle
        this.spawnRandomObstacle(playerPosition);
        return;
      }
      
      // Select a random pattern (avoiding the same one twice in a row)
      let patternIndex;
      do {
        patternIndex = Math.floor(Math.random() * validPatterns.length);
      } while (patternIndex === this.lastPatternIndex && validPatterns.length > 1);
      
      this.lastPatternIndex = patternIndex;
      const pattern = validPatterns[patternIndex];
      
      // Spawn the pattern
      this.spawnPattern(pattern, playerPosition);
      
      // Update last spawn position with pattern gap
      this.lastSpawnZ = this.lastSpawnZ - pattern.gapLength;
    } else {
      // Spawn a random obstacle
      this.spawnRandomObstacle(playerPosition);
      
      // Update last spawn position with random gap
      this.lastSpawnZ = this.lastSpawnZ - (5 + Math.random() * 5);
    }
  }
  
  /**
   * Spawn a pattern of obstacles, avoiding decoration safe zones
   * @param pattern Pattern to spawn
   * @param playerPosition Current player position
   */
  private spawnPattern(pattern: ObstaclePattern, playerPosition: THREE.Vector3): void {
    // Calculate base spawn position
    const baseZ = this.lastSpawnZ !== 0 ? this.lastSpawnZ : playerPosition.z - this.spawnAheadDistance;
    
    // Spawn each obstacle in the pattern
    for (const obstacleConfig of pattern.obstacles) {
      // Get position, with z relative to base spawn position
      const position = new THREE.Vector3(
        obstacleConfig.position[0],
        obstacleConfig.position[1],
        baseZ + obstacleConfig.position[2]
      );
      
      // Check if this position conflicts with any decoration safe zones
      if (this.checkSafeZoneConflict(position)) {
        // Adjust position to avoid conflict
        this.adjustPositionForSafeZones(position);
      }
      
      // Get optional rotation and scale
      const rotation = obstacleConfig.rotation ? 
        new THREE.Euler(
          obstacleConfig.rotation[0],
          obstacleConfig.rotation[1],
          obstacleConfig.rotation[2]
        ) : undefined;
      
      const scale = obstacleConfig.scale ?
        new THREE.Vector3(
          obstacleConfig.scale[0],
          obstacleConfig.scale[1],
          obstacleConfig.scale[2]
        ) : undefined;
      
      // Spawn the obstacle
      this.spawnObstacle(
        obstacleConfig.type,
        position,
        rotation,
        scale,
        obstacleConfig.speed
      );
      
      // Update last spawn position to the furthest obstacle
      this.lastSpawnZ = Math.min(this.lastSpawnZ, position.z);
    }
  }
  
  /**
   * Check if a position conflicts with any decoration safe zones
   * @param position Position to check
   * @returns Whether there is a conflict
   */
  private checkSafeZoneConflict(position: THREE.Vector3): boolean {
    // Get the Z segment key for lookup (rounded to nearest 10)
    const segmentZKey = Math.round(position.z / 10) * 10;
    
    // Find the closest segment that has safe zones
    // Check in nearby segments as well (current, previous, and next)
    const segmentKeys = [segmentZKey, segmentZKey - 10, segmentZKey + 10];
    
    for (const key of segmentKeys) {
      const zones = this.safeZones.get(key);
      if (!zones) continue;
      
      // Check each safe zone in this segment
      for (const zone of zones) {
        // Calculate distance (ignoring y for simplicity)
        const dx = position.x - zone.position.x;
        const dz = position.z - zone.position.z;
        const distanceSquared = dx * dx + dz * dz;
        
        // Check if within safe zone radius (plus a small buffer)
        const minDistanceSquared = Math.pow(zone.radius + 0.5, 2);
        
        if (distanceSquared < minDistanceSquared) {
          return true; // Conflict detected
        }
      }
    }
    
    return false; // No conflict
  }
  
  /**
   * Adjust a position to avoid decoration safe zones
   * @param position Position to adjust (modified in place)
   */
  private adjustPositionForSafeZones(position: THREE.Vector3): void {
    // Try adjusting the position in fixed lane positions
    const laneOptions = [-4, -2, 0, 2, 4];
    
    // Find the nearest lane that doesn't have a conflict
    let bestLane = position.x; // Current lane
    let minDistance = Infinity;
    
    for (const lane of laneOptions) {
      // Calculate how far we'd need to move
      const distance = Math.abs(lane - position.x);
      
      // Skip if this lane is farther away than the best found so far
      if (distance >= minDistance) continue;
      
      // Check if this lane position would have a conflict
      const tempPosition = new THREE.Vector3(lane, position.y, position.z);
      if (!this.checkSafeZoneConflict(tempPosition)) {
        // This lane works and is closer than any found before
        bestLane = lane;
        minDistance = distance;
      }
    }
    
    // If we found a better lane, use it
    if (minDistance < Infinity) {
      position.x = bestLane;
    } else {
      // If no lane works, try shifting forward or backward
      const zShift = 5; // Shift 5 units forward
      position.z -= zShift;
      
      // Check if the new position works
      if (this.checkSafeZoneConflict(position)) {
        // If still conflicts, try different lane as last resort
        position.x = position.x > 0 ? -2 : 2; // Move to opposite side
      }
    }
  }
  
  /**
   * Spawn a random obstacle with integration to environment
   * @param playerPosition Current player position
   */
  private spawnRandomObstacle(playerPosition: THREE.Vector3): void {
    // Calculate spawn position
    const z = this.lastSpawnZ !== 0 ? this.lastSpawnZ : playerPosition.z - this.spawnAheadDistance;
    
    // Randomize x position: one of three lanes (-2, 0, 2) with slight variation
    // Use all five lanes for more variation (-4, -2, 0, 2, 4)
    const laneOptions = [-4, -2, 0, 2, 4];
    
    // Select a random lane, but we'll verify it later
    let lane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
    let x = lane + (Math.random() - 0.5) * 0.5;
    
    // Determine y position based on obstacle type
    let y = 0;
    
    // Select a random obstacle type weighted by difficulty
    // More difficult obstacles appear more often as difficulty increases
    const randomValue = Math.random();
    let type: ObstacleType;
    
    if (randomValue < 0.3 - (this.difficultyLevel * 0.02)) {
      type = 'jellyfish';
    } else if (randomValue < 0.6 - (this.difficultyLevel * 0.02)) {
      type = 'pufferfish';
    } else if (randomValue < 0.8) {
      type = 'clam';
      y = -1; // Clams sit on the ground
    } else if (randomValue < 0.9) {
      type = 'coral';
      y = -1.5; // Coral grows from the ground
    } else {
      type = 'shark';
    }
    
    // Create position
    const position = new THREE.Vector3(x, y, z);
    
    // Check for decoration conflicts and adjust position if needed
    if (this.checkSafeZoneConflict(position)) {
      // Try each lane until we find one that works
      let validLaneFound = false;
      
      for (const testLane of laneOptions) {
        position.x = testLane + (Math.random() - 0.5) * 0.5;
        if (!this.checkSafeZoneConflict(position)) {
          validLaneFound = true;
          break;
        }
      }
      
      // If no lane works, try shifting backward slightly
      if (!validLaneFound) {
        // Shift backward by a small amount
        position.z -= 5;
        
        // Try the lanes again at the new z-position
        for (const testLane of laneOptions) {
          position.x = testLane + (Math.random() - 0.5) * 0.5;
          if (!this.checkSafeZoneConflict(position)) {
            validLaneFound = true;
            break;
          }
        }
        
        // If still no valid position found, just use the original
        // (this is rare, but ensure we always spawn something)
        if (!validLaneFound) {
          position.x = x;
          position.z = z;
        }
      }
    }
    
    // Create optional rotation (sharks need facing direction)
    let rotation: THREE.Euler | undefined;
    if (type === 'shark') {
      rotation = new THREE.Euler(0, Math.PI / 2, 0);
    }
    
    // Spawn the obstacle
    this.spawnObstacle(type, position, rotation);
    
    // Update last spawn position
    this.lastSpawnZ = position.z;
  }
  
  /**
   * Spawn an obstacle of the specified type at the given position
   * @param type Type of obstacle to spawn
   * @param position Position to spawn at
   * @param rotation Optional rotation
   * @param scale Optional scale
   * @param speedModifier Optional speed modifier
   */
  public spawnObstacle(
    type: ObstacleType,
    position: THREE.Vector3,
    rotation?: THREE.Euler,
    scale?: THREE.Vector3,
    speedModifier?: number
  ): Obstacle {
    // Get obstacle from pool or create new if none available
    const obstacle = this.getObstacleFromPool(type);
    
    // Configure the obstacle
    const config: ObstacleConfig = {
      position,
      rotation,
      scale,
      speed: speedModifier
    };
    
    // Initialize the obstacle with proper configuration
    obstacle.initialize(config);
    
    // Add to scene if not already
    if (!this.scene.getObjectById(obstacle.mesh.id)) {
      this.scene.add(obstacle.mesh);
    }
    
    // Register with collision system
    this.collisionSystem.registerCollidable(obstacle);
    
    // Add to active obstacles
    this.obstacles.set(obstacle.id, obstacle);
    
    return obstacle;
  }
  
  /**
   * Create a new obstacle based on type
   * @param type Type of obstacle to create
   * @returns Created obstacle
   */
  private createObstacle(type: ObstacleType): Obstacle {
    // Use quality setting based on device capability
    // Provide a default in case deviceCapabilities is undefined
    const qualityLevel = !this.deviceCapabilities ? 'medium' :
                     (this.deviceCapabilities.highEnd ? 'high' : 
                     (this.deviceCapabilities.midRange ? 'medium' : 'low'));
    
    // Create specific obstacle type
    switch (type) {
      case 'shark':
        return new Shark(
          this.scene,
          qualityLevel as 'high' | 'medium' | 'low'
        );
      
      case 'jellyfish':
        return new Jellyfish(
          this.scene,
          qualityLevel as 'high' | 'medium' | 'low'
        );
      
      case 'pufferfish':
        return new Pufferfish(
          this.scene,
          qualityLevel as 'high' | 'medium' | 'low'
        );
      
      case 'clam':
        return new Clam(
          this.scene,
          qualityLevel as 'high' | 'medium' | 'low'
        );
      
      case 'coral':
        // Use the dedicated Coral class
        return new Coral(
          new THREE.Vector3(),
          this.deviceCapabilities,
          { scene: this.scene }
        );
      
      default:
        throw new Error(`Unknown obstacle type: ${type}`);
    }
  }
  
  /**
   * Get an obstacle from the pool or create a new one
   * @param type Type of obstacle to get
   * @returns The obstacle, ready to initialize
   */
  private getObstacleFromPool(type: ObstacleType): Obstacle {
    // Get pool for this obstacle type
    const pool = this.obstaclePools.get(type) || [];
    
    // If pool has obstacles, use one
    if (pool.length > 0) {
      return pool.pop()!;
    }
    
    // Create a new obstacle
    return this.createObstacle(type);
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
    if (obstacle.mesh.parent) {
      obstacle.mesh.parent.remove(obstacle.mesh);
    }
    
    // Deactivate and reset
    obstacle.reset();
    
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
   * Set the difficulty level (affects obstacle patterns)
   * @param level Difficulty level (1-10)
   */
  public setDifficultyLevel(level: number): void {
    this.difficultyLevel = Math.max(1, Math.min(10, level));
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
    // Nothing to do for now, each obstacle handles time scale in its update method
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
        obstacle.dispose();
      }
    }
    
    // Clear pools
    this.obstaclePools.clear();
    
    // Remove event listeners
    eventBus.off('environment-safe-zones-update');
    
    // Clear safe zones map
    this.safeZones.clear();
  }
  
  /**
   * Set the maximum number of obstacles that can be active at once
   * @param maxObstacles Maximum number of obstacles
   */
  setMaxObstacles(maxObstacles: number): void {
    this.maxObstacles = Math.max(5, maxObstacles);
    console.log(`ObstacleManager: Set max obstacles to ${this.maxObstacles}`);
  }
  
  /**
   * Set the obstacle spawn rate multiplier
   * @param rate Spawn rate multiplier (higher = more obstacles)
   */
  setSpawnRate(rate: number): void {
    this.spawnRateMultiplier = Math.max(0.1, Math.min(2.0, rate));
    console.log(`ObstacleManager: Set spawn rate to ${this.spawnRateMultiplier}`);
  }
  
  /**
   * Set whether to use simplified colliders for performance
   * @param useSimplified Whether to use simplified colliders
   */
  setUseSimplifiedColliders(useSimplified: boolean): void {
    this.useSimplifiedColliders = useSimplified;
    console.log(`ObstacleManager: Set use simplified colliders to ${useSimplified}`);
  }
  
  /**
   * Set the detail level for obstacles
   * @param level Detail level (1-3, where 1 is low, 2 is medium, 3 is high)
   */
  setDetailLevel(level: number): void {
    this.detailLevel = Math.max(1, Math.min(3, level));
    
    // Convert numeric level to quality string for obstacles
    this.qualityLevel = this.detailLevel === 1 ? 'low' : 
                       this.detailLevel === 2 ? 'medium' : 'high';
                       
    console.log(`ObstacleManager: Set detail level to ${this.detailLevel} (${this.qualityLevel})`);
  }
}
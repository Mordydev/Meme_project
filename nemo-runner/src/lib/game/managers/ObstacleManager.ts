import * as THREE from 'three';
import { ProceduralAssetFactory, ObstacleAssetType, AnyObstacleTypeString } from '../assets/ProceduralAssetFactory';
import { configSystem } from '../core/ConfigurationSystem';
import { ClamAsset } from '../assets/obstacles/ClamAsset';
import { PufferfishAsset } from '../assets/obstacles/PufferfishAsset';
import { JellyfishAsset } from '../assets/obstacles/JellyfishAsset';
import { SharkAsset } from '../assets/obstacles/SharkAsset';
import { SeaTurtleAsset } from '../assets/obstacles/SeaTurtleAsset';
import { KelpWallAsset } from '../assets/obstacles/KelpWallAsset';
import { SchoolOfFishAsset } from '../assets/obstacles/SchoolOfFishAsset';
import { PlayerController } from './PlayerController';
// import { EnvironmentManager } from './EnvironmentManager'; // To know where to spawn

export type ObstacleType = AnyObstacleTypeString;
export type PatternType = 'random' | 'wall' | 'partial-wall' | 'zigzag' | 'center-heavy';

interface Obstacle {
  mesh: THREE.Mesh | THREE.Group;
  isActive: boolean;
  type: ObstacleType;
  assetInstance: ObstacleAssetType; // Reference to the asset instance using union type
  // Shark patrolling params
  patrolDirection?: number; // 1 for right, -1 for left
  patrolMinX?: number; // Leftmost patrol point
  patrolMaxX?: number; // Rightmost patrol point
  // Sea Turtle lane changing params
  turtleCurrentLane?: number; // Current lane index (-1, 0, 1)
  turtleTargetLane?: number; // Target lane index for lane change
  turtleState?: 'patrolling' | 'telegraphing' | 'changingLane'; // Current state in the lane change sequence
  turtleTimeInState?: number; // Time in current state
  turtleTimeToNextAction?: number; // Time until next lane change decision
  turtleHasChangedLane?: boolean; // Flag to track if turtle has already changed lanes once
  // School of Fish movement params
  schoolForwardSpeed?: number; // Forward speed relative to player
  // Kelp Wall params
  kelpAnimationPhase?: number; // Animation phase offset for sway
}

interface PatternConfig {
  laneIndices: number[]; // Which lanes to place obstacles in (-1, 0, 1)
  types?: ObstacleType[]; // Optional specific types for each lane
}

export class ObstacleManager {
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;
  // private environmentManager: EnvironmentManager;
  private gameEngine?: unknown; // Reference to GameEngine for player position
  private playerController?: PlayerController; // Reference to PlayerController for proximity effects

  public activeObstacles: Obstacle[] = []; // Public for collision detection access
  public obstaclePool: Obstacle[] = [];
  private poolSize = 30; // Increased to accommodate more complex obstacle patterns

  // Store references to obstacle configs for performance
  private sharkConfig = configSystem.getObstaclesConfig().shark;
  private seaTurtleConfig = configSystem.getObstaclesConfig().seaTurtle;
  private kelpWallConfig = configSystem.getObstaclesConfig().kelpWall;
  private schoolOfFishConfig = configSystem.getObstaclesConfig().schoolOfFish;

  // Spawn intervals (now controlled by difficulty system)
  private spawnIntervalMin: number;
  private spawnIntervalMax: number;
  private timeToNextSpawn = 0;

  // Complexity factor affects obstacle types and patterns (0-1 range)
  private complexityFactor: number = 0.2;

  private lastSpawnZ = 0; // Keep track of Z to avoid too close spawns
  private minZSpacing = 10; // Minimum Z distance between obstacles

  // Track pattern sequences for more interesting gameplay
  private patternSequence: PatternType[] = [];
  private currentPatternIndex: number = 0;

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory, gameEngine?: unknown /*, environmentManager: EnvironmentManager */) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    this.gameEngine = gameEngine;
    // this.environmentManager = environmentManager;

    // Initialize with base spawn intervals from config
    const baseIntervals = configSystem.getObstacleBaseSpawnIntervals();
    this.spawnIntervalMin = baseIntervals.min;
    this.spawnIntervalMax = baseIntervals.max;

    this.initializePool();
    this.resetTimeToNextSpawn();
    // Spawn initial set of obstacles immediately
    // Assuming player starts near Z=0, or manager handles initial placement appropriately.
    this.spawnObstaclePattern(0); 
    // console.log("ObstacleManager: Initialized with new obstacle types and initial spawn triggered.");
  }

  /**
   * Links the PlayerController to the ObstacleManager for proximity-based behaviors
   * @param playerController The player controller to link
   */
  public linkPlayerController(playerController: PlayerController): void {
    this.playerController = playerController;
    // console.log("ObstacleManager: PlayerController linked for proximity effects.");
  }

  /**
   * Set the spawn intervals for obstacles (used by DifficultyManager)
   * @param min Minimum time between spawns in seconds
   * @param max Maximum time between spawns in seconds
   */
  public setSpawnIntervals(min: number, max: number): void {
    this.spawnIntervalMin = min;
    this.spawnIntervalMax = max;
    // console.log(`ObstacleManager: Spawn intervals set to min: ${min.toFixed(2)}s, max: ${max.toFixed(2)}s`);
  }

  /**
   * Set complexity factor for obstacle generation (used by DifficultyManager)
   * @param factor Complexity factor (0-1) affecting obstacle types and patterns
   */
  public setComplexityFactor(factor: number): void {
    // Ensure factor is within 0-1 range
    this.complexityFactor = Math.max(0, Math.min(1, factor));
    
    // Update the pattern sequence based on complexity factor
    this.updatePatternSequence();
    
    // Adjust minimum spacing between obstacles based on complexity
    // Higher complexity = closer obstacles
    this.minZSpacing = Math.max(5, 12 - (this.complexityFactor * 7));
    
    // console.log(`ObstacleManager: Complexity factor set to ${this.complexityFactor.toFixed(2)}`);
  }

  /**
   * Update pattern sequence based on current complexity factor
   */
  private updatePatternSequence(): void {
    this.patternSequence = [];
    
    // At low complexity, mostly random patterns
    if (this.complexityFactor < 0.3) {
      for (let i = 0; i < 10; i++) {
        this.patternSequence.push('random');
      }
    } 
    // Medium complexity: introduce some simple patterns
    else if (this.complexityFactor < 0.6) {
      this.patternSequence = [
        'random', 'random', 'random', 'center-heavy', 
        'random', 'random', 'zigzag', 'random', 
        'partial-wall', 'random'
      ];
    } 
    // High complexity: more difficult patterns
    else if (this.complexityFactor < 0.8) {
      this.patternSequence = [
        'random', 'center-heavy', 'zigzag', 'random',
        'partial-wall', 'center-heavy', 'random', 'zigzag',
        'partial-wall', 'random'
      ];
    } 
    // Very high complexity: mostly patterns, including full walls
    else {
      this.patternSequence = [
        'center-heavy', 'zigzag', 'partial-wall', 'random',
        'wall', 'center-heavy', 'zigzag', 'partial-wall', 
        'center-heavy', 'wall'
      ];
    }
    
    // Reset the pattern index
    this.currentPatternIndex = 0;
  }

  private initializePool(): void {
    // console.log("ObstacleManager: Initializing obstacle pool with size", this.poolSize);

    // Create a weighted distribution of obstacle types in the pool
    // Distribute among all obstacle types with more emphasis on challenging types
    const obstacleTypes: ObstacleType[] = [];

    // Base distribution including new obstacle types
    const coralCount = Math.floor(this.poolSize * 0.15);
    const rockCount = Math.floor(this.poolSize * 0.15);
    const clamCount = Math.floor(this.poolSize * 0.15);
    const pufferfishCount = Math.floor(this.poolSize * 0.12);
    const jellyfishCount = Math.floor(this.poolSize * 0.12);
    const sharkCount = Math.floor(this.poolSize * 0.08);
    const seaTurtleCount = Math.floor(this.poolSize * 0.08);
    const kelpWallCount = Math.floor(this.poolSize * 0.08);
    // Adjusted to sum remaining counts
    const schoolOfFishCount = this.poolSize - coralCount - rockCount - clamCount - pufferfishCount - jellyfishCount - sharkCount - seaTurtleCount - kelpWallCount;

    for (let i = 0; i < coralCount; i++) obstacleTypes.push('coral');
    for (let i = 0; i < rockCount; i++) obstacleTypes.push('rock');
    for (let i = 0; i < clamCount; i++) obstacleTypes.push('clam');
    for (let i = 0; i < pufferfishCount; i++) obstacleTypes.push('pufferfish');
    for (let i = 0; i < jellyfishCount; i++) obstacleTypes.push('jellyfish');
    for (let i = 0; i < sharkCount; i++) obstacleTypes.push('shark');
    for (let i = 0; i < seaTurtleCount; i++) obstacleTypes.push('seaTurtle');
    for (let i = 0; i < kelpWallCount; i++) obstacleTypes.push('kelpWall');
    for (let i = 0; i < schoolOfFishCount; i++) obstacleTypes.push('schoolOfFish');

    // Shuffle the array to prevent patterns
    for (let i = obstacleTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [obstacleTypes[i], obstacleTypes[j]] = [obstacleTypes[j], obstacleTypes[i]];
    }

    for (let i = 0; i < this.poolSize; i++) {
      const type = obstacleTypes[i];

      // Use the new createObstacle method that returns both mesh and asset
      const { mesh, asset } = this.assetFactory.createObstacle(type);

      mesh.visible = false;
      this.scene.add(mesh);

      this.obstaclePool.push({
        mesh,
        isActive: false,
        type,
        assetInstance: asset
      });

      if (type === 'seaTurtle') {
        // console.log(`[ObstacleManager Pool DEBUG] Pooled 'seaTurtle'. Obstacle in pool has type: ${this.obstaclePool[this.obstaclePool.length-1].type}, Ctor: ${this.obstaclePool[this.obstaclePool.length-1].assetInstance?.constructor?.name}`);
      }

      // console.log(`ObstacleManager: Created ${type} obstacle ${i} with mesh:`, mesh);
    }
  }

  private getInactiveObstacle(preferredType?: ObstacleType): Obstacle | undefined {
    if (preferredType) {
      const typedObstacle = this.obstaclePool.find(obs => !obs.isActive && obs.type === preferredType);
      if (typedObstacle) {
        // console.log(`[ObstacleManager GetInactive DEBUG] Found preferred type: ${preferredType}, Returned obstacle type: ${typedObstacle.type}, Ctor: ${typedObstacle.assetInstance?.constructor?.name}`);
        return typedObstacle;
      }
    }

    // If no preferred type or none found, get any inactive obstacle
    const anyObstacle = this.obstaclePool.find(obs => !obs.isActive);
    // if (anyObstacle) {
    //     console.log(`[ObstacleManager GetInactive DEBUG] No preferred type or none found. Returned (any) obstacle type: ${anyObstacle.type}, Ctor: ${anyObstacle.assetInstance?.constructor?.name}`);
    // }
    return anyObstacle;
  }

  private resetTimeToNextSpawn(): void {
    // Adjust spawn intervals based on complexity factor to create more challenging patterns
    const minAdjustment = Math.max(0.3, 1 - (this.complexityFactor * 0.7)); // 1.0 to 0.3 as complexity increases
    
    const adjustedMin = this.spawnIntervalMin * minAdjustment;
    const adjustedMax = this.spawnIntervalMax * minAdjustment;
    
    this.timeToNextSpawn = Math.random() * (adjustedMax - adjustedMin) + adjustedMin;
  }

  /**
   * Get the next pattern to use based on the current sequence
   */
  private getNextPattern(): PatternType {
    const pattern = this.patternSequence[this.currentPatternIndex];
    this.currentPatternIndex = (this.currentPatternIndex + 1) % this.patternSequence.length;
    return pattern;
  }

  /**
   * Generate obstacle configuration based on the specified pattern
   */
  private getPatternConfig(pattern: PatternType): PatternConfig {
    const laneIndices: number[] = [];
    
    switch (pattern) {
      case 'wall':
        // All lanes occupied, forcing player to use a powerup or take a hit
        return {
          laneIndices: [-1, 0, 1],
          types: this.selectObstacleTypes(3, true)
        };
        
      case 'partial-wall':
        // Two lanes occupied, leaving one free path
        const freeLane = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const filteredLanes = [-1, 0, 1].filter(lane => lane !== freeLane);
        return {
          laneIndices: filteredLanes,
          types: this.selectObstacleTypes(2, true)
        };
        
      case 'zigzag':
        // Start with either left or right
        const startLeft = Math.random() > 0.5;
        if (startLeft) {
          return {
            laneIndices: [-1, 1],
            types: this.selectObstacleTypes(2, false)
          };
        } else {
          return {
            laneIndices: [1, -1],
            types: this.selectObstacleTypes(2, false)
          };
        }
        
      case 'center-heavy':
        // Emphasize center lane with 60% chance, plus maybe one side lane
        laneIndices.push(0); // Always include center
        
        // 50% chance to add a side lane
        if (Math.random() > 0.5) {
          laneIndices.push(Math.random() > 0.5 ? -1 : 1);
        }
        
        return {
          laneIndices,
          types: this.selectObstacleTypes(laneIndices.length, true)
        };
        
      case 'random':
      default:
        // Simple random pattern, 1-2 obstacles
        const obstacleCount = Math.random() > 0.7 ? 2 : 1;
        
        // Create list of possible lane positions
        const lanes = [-1, 0, 1];
        
        // When complexity is higher, prefer the center lane
        if (this.complexityFactor > 0.6 && Math.random() > 0.3) {
          laneIndices.push(0); // Center lane
          if (obstacleCount > 1) {
            const sideLane = Math.random() > 0.5 ? -1 : 1;
            laneIndices.push(sideLane);
          }
        } else {
          // Randomly select lanes
          for (let i = 0; i < obstacleCount; i++) {
            if (lanes.length > 0) {
              const index = Math.floor(Math.random() * lanes.length);
              laneIndices.push(lanes[index]);
              lanes.splice(index, 1); // Remove to avoid duplicates
            }
          }
        }
        
        return {
          laneIndices,
          types: this.selectObstacleTypes(laneIndices.length, false)
        };
    }
  }

  /**
   * Select obstacle types based on complexity and pattern needs
   * @param count Number of obstacles to create
   * @param isPatternImportant Whether the pattern is a more challenging one
   * @returns Array of obstacle types
   */
  private selectObstacleTypes(count: number, /* isPatternImportant: boolean */): ObstacleType[] {
    const obstacleTypes: ObstacleType[] = [];

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let type: ObstacleType;

      // Target base probabilities for each type when complexity allows them
      const targetProbabilities: { [key in ObstacleType]?: number } = {
        coral: 0.18,    
        rock: 0.16,     
        clam: 0.15,     
        pufferfish: 0.15,
        jellyfish: 0.15, 
        shark: 0.07,       
        seaTurtle: 0.07,   
        kelpWall: 0.07,   
        schoolOfFish: 0.00  // Will be adjusted to fill remaining (Restored from 0.01)
      };
      
      const activeTypes: ObstacleType[] = ['coral', 'rock', 'clam', 'pufferfish', 'jellyfish'];
      // let cumulativeProbability = 0;
      // const availableProbSpace = 1.0; // Total probability space

      // Adjust chances for advanced types based on complexity
      if (this.complexityFactor > 0.5) activeTypes.push('shark');
      if (this.complexityFactor > 0.3) activeTypes.push('seaTurtle');
      if (this.complexityFactor > 0.4) activeTypes.push('kelpWall');
      if (this.complexityFactor > 0.3) activeTypes.push('schoolOfFish');
      
      if (activeTypes.includes('seaTurtle')) {
        // console.log(`[ObstacleManager SelectTypes DEBUG] 'seaTurtle' IS in activeTypes for selection. Complexity: ${this.complexityFactor}`);
      } else {
        // console.log(`[ObstacleManager SelectTypes DEBUG] 'seaTurtle' IS NOT in activeTypes. Complexity: ${this.complexityFactor}`);
      }
      
      // Calculate total weight of active types
      let totalWeight = 0;
      activeTypes.forEach(t => totalWeight += (targetProbabilities[t] || 0));
      
      // Add a specific weight for schoolOfFish to ensure it gets some chance if active
      // and make it fill remaining if other weights are low.
      if (activeTypes.includes('schoolOfFish')) {
          const schoolFishBase = 0.07;
          totalWeight += schoolFishBase;
          targetProbabilities['schoolOfFish'] = schoolFishBase;
      }


      // Normalize probabilities for active types
      let currentCumulative = 0;
      const normalizedProbs: { type: ObstacleType, prob: number }[] = [];

      activeTypes.forEach(t => {
        const weight = targetProbabilities[t] || 0;
        if (totalWeight > 0) {
            normalizedProbs.push({type: t, prob: weight / totalWeight});
        } else if (activeTypes.length === 1 && t === activeTypes[0]) { // Only one type active
            normalizedProbs.push({type: t, prob: 1.0});
        }
      });
      
      // Sort by original target probability to keep some order, then by name for tie-breaking
      normalizedProbs.sort((a,b) => {
          const probDiff = (targetProbabilities[b.type] || 0) - (targetProbabilities[a.type] || 0);
          if (probDiff !== 0) return probDiff;
          return a.type.localeCompare(b.type);
      });


      let chosenType: ObstacleType = 'rock'; // Default fallback
      if (normalizedProbs.length > 0) {
        chosenType = normalizedProbs[normalizedProbs.length -1].type; // Fallback to last in sorted list if rand is high
      }


      for (const normP of normalizedProbs) {
        currentCumulative += normP.prob;
        if (rand < currentCumulative) {
          chosenType = normP.type;
          break;
        }
      }
      obstacleTypes.push(chosenType);
    }
    return obstacleTypes;
  }

  private spawnObstaclePattern(playerZ: number): void {
    // Select a pattern based on complexity
    const pattern = this.getNextPattern();
    const config = this.getPatternConfig(pattern);

    // Calculate base distance - higher complexity means closer obstacles
    const baseDistance = 60 - (this.complexityFactor * 25); // 60 to 35 units ahead
    const randomVariation = Math.random() * 10; // Less variation for more predictable patterns
    const targetZ = playerZ - (baseDistance + randomVariation);

    // Ensure minimum Z spacing from the last spawned obstacle
    if (this.activeObstacles.length > 0 && (this.lastSpawnZ - targetZ) < this.minZSpacing) {
      return; // Skip this spawn if it would be too close to the previous one
    }

    // Spawn obstacles according to pattern
    const laneWidth = configSystem.getPlayerLaneWidth();

    for (let i = 0; i < config.laneIndices.length; i++) {
      const laneIndex = config.laneIndices[i];
      const type = config.types ? config.types[i] : undefined;

      const obstacle = this.getInactiveObstacle(type);
      if (!obstacle) {
        // console.warn(`ObstacleManager: No inactive obstacles in pool to spawn! Attempted type: ${type || 'any'}`);
        continue;
      }

      // Reset the asset instance to its default state before activating
      if (obstacle.assetInstance && typeof obstacle.assetInstance.reset === 'function') {
        obstacle.assetInstance.reset();
      } else {
        // Log a warning if the asset instance or its reset method is missing, 
        // though this should not happen with current asset types.
        // console.warn(`ObstacleManager: Obstacle type ${obstacle.type} has no valid assetInstance or reset method.`);
      }

      obstacle.isActive = true;
      obstacle.mesh.visible = true;

      // Position the obstacle
      obstacle.mesh.position.x = laneIndex * laneWidth;
      obstacle.mesh.position.z = targetZ;

      // Log details for EVERY obstacle being configured here
      // console.log('[ObstacleManager Spawn DEBUG] Configuring obstacle. Type:', obstacle.type, 'Asset Ctor:', obstacle.assetInstance?.constructor?.name);
      // console.log(`[ObstacleManager Spawn Pre-Check] About to configure. Raw obstacle.type: "${obstacle.type}" (length: ${obstacle.type?.length}), Ctor: ${obstacle.assetInstance?.constructor?.name}`);

      // Adjust Y position based on obstacle type
      if (obstacle.type === 'rock') {
        obstacle.mesh.position.y = -0.85; // Rocks sit slightly higher on the floor
      } else if (obstacle.type === 'clam') {
        obstacle.mesh.position.y = -0.9; // Clams slightly above floor
      } else if (obstacle.type === 'pufferfish') {
        obstacle.mesh.position.y = -0.1; // Pufferfish float a bit higher
        // No specific patrol logic needed here, handled by asset
      } else if (obstacle.type === 'jellyfish') {
        obstacle.mesh.position.y = -0.3; // Jellyfish float highest in the water
      } else if (obstacle.type && obstacle.type.trim() === 'shark') {
        // console.log('[ObstacleManager CRITICAL DEBUG] ENTERED shark config block. Original Type: "' + obstacle.type + '", Trimmed Type: "' + obstacle.type.trim() + '"');
        obstacle.mesh.position.y = -0.2; // Sharks swim a bit higher
        // Rotation is handled by the shark asset itself during its patrol

        // Set up shark patrolling parameters
        obstacle.patrolDirection = Math.random() < 0.5 ? -1 : 1; // Randomly start moving left or right

        // Set patrol boundaries based on configuration
        const patrolRange = this.sharkConfig.patrolRangeX;
        obstacle.patrolMinX = obstacle.mesh.position.x - patrolRange;
        obstacle.patrolMaxX = obstacle.mesh.position.x + patrolRange;

        // Constrain to world boundaries
        const worldXBound = configSystem.getWorldXBoundary();
        obstacle.patrolMinX = Math.max(-worldXBound + 1, obstacle.patrolMinX);
        obstacle.patrolMaxX = Math.min(worldXBound - 1, obstacle.patrolMaxX);

        // Apply initial rotation based on patrol direction
        obstacle.mesh.rotation.y = obstacle.patrolDirection === 1 ? 0 : Math.PI;
      } else if (obstacle.type && obstacle.type.trim() === 'seaTurtle') {
        // console.log('[ObstacleManager DEBUG] Configuring Sea Turtle');
        obstacle.mesh.position.y = -0.35; // Sea turtles swim at mid-water level

        // Set up sea turtle lane changing parameters
        obstacle.turtleCurrentLane = laneIndex;
        obstacle.turtleState = 'patrolling';
        obstacle.turtleTimeInState = 0;
        obstacle.turtleTimeToNextAction = this.seaTurtleConfig.minTimeInLane +
                                          Math.random() * (this.seaTurtleConfig.maxTimeInLane - this.seaTurtleConfig.minTimeInLane);
        obstacle.turtleHasChangedLane = false;

        // Ensure the turtle starts facing forward
        if (obstacle.assetInstance instanceof SeaTurtleAsset) {
          // console.log('[ObstacleManager DEBUG] obstacle.assetInstance IS instanceof SeaTurtleAsset. Calling setTelegraphTurn("center").');
          obstacle.assetInstance.setTelegraphTurn('center');
        } 
        // else {
        //   console.warn('[ObstacleManager DEBUG] obstacle.assetInstance IS NOT instanceof SeaTurtleAsset. AssetInstance:', obstacle.assetInstance);
        // }
      } else if (obstacle.type === 'kelpWall') {
        // Position kelp so its base is on the seafloor
        // Mesh is already positioned based on its base being at Y=0 within the group
        obstacle.mesh.position.y = -0.95; // Base of kelp at seafloor

        // Set random animation phase for sway
        obstacle.kelpAnimationPhase = Math.random() * Math.PI * 2;
      } else if (obstacle.type === 'schoolOfFish') {
        // Position school of fish to prevent jumping over them
        obstacle.mesh.position.y = 0.2; // Position it so it's tall enough to block jumps

        // Set forward speed relative to player
        obstacle.schoolForwardSpeed = this.schoolOfFishConfig.baseSpeedFactor;
      } else {
        obstacle.mesh.position.y = -0.95; // Standard coral position
      }

      // Add to active obstacles list for collision detection
      this.activeObstacles.push(obstacle);

      // console.log(`ObstacleManager: Spawned ${obstacle.type} at x:${obstacle.mesh.position.x.toFixed(1)}, z:${obstacle.mesh.position.z.toFixed(1)} as part of ${pattern} pattern (complexity: ${this.complexityFactor.toFixed(2)})`);
    }

    this.lastSpawnZ = targetZ;
  }

  public update(deltaTime: number, playerZ: number): void {
    this.timeToNextSpawn -= deltaTime;
    if (this.timeToNextSpawn <= 0) {
      this.spawnObstaclePattern(playerZ);
      this.resetTimeToNextSpawn();
    }

    // Get player position to pass to animated obstacles like pufferfish
    const playerPosition = new THREE.Vector3(0, 0, playerZ);
    if (this.playerController && this.playerController.mesh) {
      // Get exact player position from the linked PlayerController
      playerPosition.copy(this.playerController.mesh.position);
    }

    // Update animations for active obstacles
    for (const obstacle of this.activeObstacles) {
      // Handle clam animations
      if (obstacle.type === 'clam' && obstacle.assetInstance instanceof ClamAsset) {
        const clamAsset = obstacle.assetInstance;
        clamAsset.updateAnimation(deltaTime, 0);

        // Store open state in userData for collision detection system
        if (obstacle.mesh.userData) {
          obstacle.mesh.userData.isOpen = clamAsset.isOpen;
          obstacle.mesh.userData.isDangerous = clamAsset.isOpen;
        }
      }

      // Handle pufferfish animations (inflation based on player proximity)
      else if (obstacle.type === 'pufferfish' && obstacle.assetInstance instanceof PufferfishAsset) {
        const pufferfishAsset = obstacle.assetInstance;
        pufferfishAsset.updateAnimation(deltaTime, playerPosition);

        // Store inflation state in userData for collision detection system
        if (obstacle.mesh.userData) {
          obstacle.mesh.userData.isDangerous = pufferfishAsset.isDangerous();
        }
      }

      // Handle jellyfish animations (drifting and tentacle movement)
      else if (obstacle.type === 'jellyfish' && obstacle.assetInstance instanceof JellyfishAsset) {
        const jellyfishAsset = obstacle.assetInstance;
        jellyfishAsset.updateAnimation(deltaTime);

        // Constrain jellyfish to stay within lanes and world bounds
        const xBoundary = configSystem.getWorldXBoundary();
        jellyfishAsset.constrainPosition(xBoundary);

        // Store danger state in userData for collision detection system
        if (obstacle.mesh.userData) {
          obstacle.mesh.userData.isDangerous = jellyfishAsset.isDangerous();
        }
      }

      // Handle shark animations and patrolling behavior
      else if (obstacle.type && obstacle.type.trim() === 'shark' && obstacle.assetInstance instanceof SharkAsset) {
        const sharkAsset = obstacle.assetInstance;

        // Update tail swing animation
        sharkAsset.updateAnimation(deltaTime);

        // Handle patrolling AI if patrol parameters are set
        if (obstacle.patrolDirection !== undefined &&
            obstacle.patrolMinX !== undefined &&
            obstacle.patrolMaxX !== undefined) {

          // Move horizontally based on patrol direction and speed
          const moveDistance = obstacle.patrolDirection * this.sharkConfig.patrolSpeed * deltaTime;
          obstacle.mesh.position.x += moveDistance;

          // Check if shark has reached patrol boundaries
          if (obstacle.mesh.position.x >= obstacle.patrolMaxX) {
            obstacle.mesh.position.x = obstacle.patrolMaxX;
            obstacle.patrolDirection = -1; // Change direction to left
            obstacle.mesh.rotation.y = Math.PI; // Rotate to face left
          }
          else if (obstacle.mesh.position.x <= obstacle.patrolMinX) {
            obstacle.mesh.position.x = obstacle.patrolMinX;
            obstacle.patrolDirection = 1; // Change direction to right
            obstacle.mesh.rotation.y = 0; // Rotate to face right
          }
        }

        // Store danger state in userData (sharks are always dangerous)
        if (obstacle.mesh.userData) {
          obstacle.mesh.userData.isDangerous = true;
        }
      }

      // Handle sea turtle animations and lane-changing behavior
      else if (obstacle.type && obstacle.type.trim() === 'seaTurtle' && obstacle.assetInstance instanceof SeaTurtleAsset) {
        const turtleAsset = obstacle.assetInstance;

        // Update flipper animations
        turtleAsset.updateAnimation(deltaTime);

        // Handle sea turtle's forward movement (slower than environment scroll)
        const playerBaseSpeed = configSystem.getDifficultyConfig().basePlayerSpeed;
        const turtleActualForwardSpeed = playerBaseSpeed * this.seaTurtleConfig.forwardSpeedFactor;

        // Calculate slow forward movement relative to world speed
        const worldScrollSpeed = this.playerController?.mesh.userData.currentActualSpeed || playerBaseSpeed;
        obstacle.mesh.position.z += (worldScrollSpeed - turtleActualForwardSpeed) * deltaTime;

        // Handle lane-changing AI if state parameters are set
        if (obstacle.turtleState &&
            obstacle.turtleCurrentLane !== undefined &&
            obstacle.turtleTimeInState !== undefined) {

          // Update time in current state
          obstacle.turtleTimeInState += deltaTime;

          // State machine for lane changing
          if (obstacle.turtleState === 'patrolling') {
            const distanceToPlayer = playerPosition.z - obstacle.mesh.position.z;
            const proximityTriggered = distanceToPlayer > 0 && distanceToPlayer <= this.seaTurtleConfig.proximityTriggerDistance;

            // Only consider changing lanes if the turtle hasn't already done so
            if (!obstacle.turtleHasChangedLane && 
                (obstacle.turtleTimeInState >= obstacle.turtleTimeToNextAction! || proximityTriggered)) {
              const laneCount = configSystem.getWorldLaneCount();
              const possibleLanes: number[] = [];

              // Only consider adjacent lanes (one step left or right)
              const minLane = -Math.floor(laneCount/2);
              const maxLane = Math.floor(laneCount/2);
              const leftLane = obstacle.turtleCurrentLane! - 1;
              const rightLane = obstacle.turtleCurrentLane! + 1;
              
              // Add left lane if valid
              if (leftLane >= minLane) {
                possibleLanes.push(leftLane);
              }
              
              // Add right lane if valid
              if (rightLane <= maxLane) {
                possibleLanes.push(rightLane);
              }

              if (possibleLanes.length > 0) {
                // Pick a random lane to move to
                const randomIndex = Math.floor(Math.random() * possibleLanes.length);
                obstacle.turtleTargetLane = possibleLanes[randomIndex];

                // Telegraph the chosen lane direction on the asset
                const direction = obstacle.turtleTargetLane < obstacle.turtleCurrentLane! ? 'left'
                                 : 'right';
                turtleAsset.setTelegraphTurn(direction);

                // Change to telegraphing state
                obstacle.turtleState = 'telegraphing';
                obstacle.turtleTimeInState = 0;
                
                // If proximity triggered, telegraph faster
                if (proximityTriggered) {
                  // Skip some of the telegraph time to react faster
                  obstacle.turtleTimeInState = this.seaTurtleConfig.laneChangeTelegraphTime * 0.5;
                }
              } else {
                // Should not happen with 3 lanes, but reset timer just in case
                obstacle.turtleTimeToNextAction = this.seaTurtleConfig.minTimeInLane;
              }
            }
          }
          else if (obstacle.turtleState === 'telegraphing') {
            if (obstacle.turtleTimeInState >= this.seaTurtleConfig.laneChangeTelegraphTime) {
              // Time to start moving to the new lane
              obstacle.turtleState = 'changingLane';
              obstacle.turtleTimeInState = 0;
            }
          }
          else if (obstacle.turtleState === 'changingLane') {
            const laneWidth = configSystem.getPlayerLaneWidth();
            const targetX = obstacle.turtleTargetLane! * laneWidth;
            const moveDirection = Math.sign(targetX - obstacle.mesh.position.x);
            const laneChangeSpeed = laneWidth / this.seaTurtleConfig.laneChangeDuration;

            // Move the turtle toward the target lane
            obstacle.mesh.position.x += moveDirection * laneChangeSpeed * deltaTime;

            // Check if reached target lane
            if ((moveDirection > 0 && obstacle.mesh.position.x >= targetX) ||
                (moveDirection < 0 && obstacle.mesh.position.x <= targetX)) {
              // Reached the target lane
              obstacle.mesh.position.x = targetX;
              obstacle.turtleCurrentLane = obstacle.turtleTargetLane;

              // Return to patrolling state
              obstacle.turtleState = 'patrolling';
              obstacle.turtleTimeInState = 0;

              // Set the flag to indicate this turtle has already changed lanes
              obstacle.turtleHasChangedLane = true;

              // Reset turtle orientation to face forward
              turtleAsset.setTelegraphTurn('center');
            }
          }
        }

        // Store danger state in userData (turtles are always dangerous)
        if (obstacle.mesh.userData) {
          obstacle.mesh.userData.isDangerous = true;
        }
      }
      // Handle kelp wall animations (swaying)
      else if (obstacle.type === 'kelpWall' && obstacle.assetInstance instanceof KelpWallAsset) {
        const kelpAsset = obstacle.assetInstance;

        // Update sway animation with delta time
        kelpAsset.updateAnimation(deltaTime);

        // Store danger state in userData (kelp is always dangerous)
        if (obstacle.mesh.userData) {
          obstacle.mesh.userData.isDangerous = true;
        }
      }
      // Handle school of fish animations and movement
      else if (obstacle.type === 'schoolOfFish' && obstacle.assetInstance instanceof SchoolOfFishAsset) {
        const schoolAsset = obstacle.assetInstance;
        schoolAsset.updateAnimation(deltaTime);

        // Handle school's forward movement (slower than environment scroll)
        const playerBaseSpeed = configSystem.getDifficultyConfig().basePlayerSpeed;
        const schoolActualForwardSpeed = playerBaseSpeed * (obstacle.schoolForwardSpeed ?? this.schoolOfFishConfig.baseSpeedFactor);
        const worldScrollSpeed = this.playerController?.mesh.userData.currentActualSpeed || playerBaseSpeed;
        obstacle.mesh.position.z += (worldScrollSpeed - schoolActualForwardSpeed) * deltaTime;

        // Store danger state in userData (school of fish is always dangerous)
        if (obstacle.mesh.userData) {
          obstacle.mesh.userData.isDangerous = true;
        }
      }
    }

    // Recycle obstacles that are far behind the player
    const recycleThreshold = playerZ + 10; // Recycle if 10 units behind player

    // Use a reverse loop since we're modifying the array while iterating
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obstacle = this.activeObstacles[i];
      if (obstacle.mesh.position.z > recycleThreshold) {
        // Reset the asset to its initial state
        if (obstacle.assetInstance && typeof obstacle.assetInstance.reset === 'function') {
          try {
            obstacle.assetInstance.reset();
          } catch (error) {
            // console.warn(`ObstacleManager: Error resetting ${obstacle.type} asset:`, error);
          }
        }

        obstacle.isActive = false;
        obstacle.mesh.visible = false;

        // Remove from activeObstacles array
        this.activeObstacles.splice(i, 1);

        // console.log(`ObstacleManager: Recycled ${obstacle.type} obstacle at z:${obstacle.mesh.position.z.toFixed(1)}`);
      }
    }
  }

  /**
   * Call this when player hits an obstacle
   * @param obstacleMesh The obstacle mesh that was hit
   * @returns true if the hit was dangerous and should damage the player, false otherwise
   */
  public handleObstacleHit(obstacleMesh: THREE.Mesh | THREE.Group): boolean {
    // First find the obstacle in the active obstacles list
    const activeIndex = this.activeObstacles.findIndex(obs => obs.mesh === obstacleMesh);
    if (activeIndex > -1) {
      const hitObstacle = this.activeObstacles[activeIndex];
      // console.log(`ObstacleManager: Player hit ${hitObstacle.type} obstacle: ${obstacleMesh.name}. Checking if dangerous...`);

      // Check if the obstacle is actually dangerous based on its current state
      let isDangerous = true; // Default to dangerous if we can't determine

      if (hitObstacle.type === 'clam' && hitObstacle.assetInstance instanceof ClamAsset) {
        const clamAsset = hitObstacle.assetInstance;
        isDangerous = clamAsset.isDangerous();
        // console.log(`ObstacleManager: Clam asset found. isOpen: ${clamAsset.isOpen}, isDangerous from asset: ${isDangerous}`);
        if (!clamAsset.isDangerous()) { 
          // console.log("ObstacleManager: Clam was not dangerous during collision!");
        }
      }
      else if (hitObstacle.type === 'pufferfish' && hitObstacle.assetInstance instanceof PufferfishAsset) {
        const pufferfishAsset = hitObstacle.assetInstance;
        isDangerous = pufferfishAsset.isDangerous();
        // console.log(`ObstacleManager: Pufferfish asset found. isDangerous from asset: ${isDangerous}`);
        if (!isDangerous) {
          // console.log("ObstacleManager: Pufferfish is not in a dangerous state, no damage!");
        }
      }
      else if (hitObstacle.type === 'jellyfish' && hitObstacle.assetInstance instanceof JellyfishAsset) {
        const jellyfishAsset = hitObstacle.assetInstance;
        isDangerous = jellyfishAsset.isDangerous();
        // console.log(`ObstacleManager: Jellyfish asset found. isDangerous from asset: ${isDangerous}`);
      }
      else if (hitObstacle.type && hitObstacle.type.trim() === 'shark' && hitObstacle.assetInstance instanceof SharkAsset) {
        const sharkAsset = hitObstacle.assetInstance;
        isDangerous = sharkAsset.isDangerous();
        // console.log(`ObstacleManager: Shark asset found. isDangerous from asset: ${isDangerous}`);
      }
      else if (hitObstacle.type && hitObstacle.type.trim() === 'seaTurtle' && hitObstacle.assetInstance instanceof SeaTurtleAsset) {
        const turtleAsset = hitObstacle.assetInstance;
        isDangerous = turtleAsset.isDangerous();
        // console.log(`ObstacleManager: SeaTurtle asset found. isDangerous from asset: ${isDangerous}`);
      }
      else if (hitObstacle.type === 'kelpWall' && hitObstacle.assetInstance instanceof KelpWallAsset) {
        const kelpAsset = hitObstacle.assetInstance;
        isDangerous = kelpAsset.isDangerous();
        // console.log(`ObstacleManager: KelpWall asset found. isDangerous from asset: ${isDangerous}`);
      }
      else if (hitObstacle.type === 'schoolOfFish' && hitObstacle.assetInstance instanceof SchoolOfFishAsset) {
        const schoolAsset = hitObstacle.assetInstance;
        isDangerous = schoolAsset.isDangerous();
        // console.log(`ObstacleManager: SchoolOfFish asset found. isDangerous from asset: ${isDangerous}`);
      }

      // If the obstacle is not dangerous in its current state, skip player damage
      if (!isDangerous) {
        // console.log(`ObstacleManager: ${hitObstacle.type} obstacle hit, but not dangerous - no damage to player`);
        return false; // Obstacle remains active, no damage to player
      }

      // Reset the asset to its initial state
      if (hitObstacle.assetInstance && typeof hitObstacle.assetInstance.reset === 'function') {
        try {
          hitObstacle.assetInstance.reset();
        } catch (error) {
          // console.warn(`ObstacleManager: Error resetting ${hitObstacle.type} asset:`, error);
        }
      }

      // Deactivate it
      hitObstacle.isActive = false;
      hitObstacle.mesh.visible = false;

      // Remove from activeObstacles array
      this.activeObstacles.splice(activeIndex, 1);

      // console.log(`ObstacleManager: ${hitObstacle.type} obstacle hit by player and caused damage`);
      return true; // This was a dangerous hit
    } else {
      // console.warn("ObstacleManager: Tried to hit an obstacle that isn't in the active list!");
      return false; // No obstacle found, so no damage
    }
  }

  public dispose(): void {
    this.obstaclePool.forEach(obstacle => {
      if (obstacle.mesh instanceof THREE.Mesh) {
        if (obstacle.mesh.geometry) obstacle.mesh.geometry.dispose();
        if (Array.isArray(obstacle.mesh.material)) {
          obstacle.mesh.material.forEach(m => m.dispose());
        } else if (obstacle.mesh.material) {
          obstacle.mesh.material.dispose();
        }
      } else if (obstacle.mesh instanceof THREE.Group) {
        // For Group objects like clams, dispose of all child meshes
        obstacle.mesh.traverse(child => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else if (child.material) {
              child.material.dispose();
            }
          }
        });
      }

      this.scene.remove(obstacle.mesh);
    });

    this.obstaclePool = [];
    this.activeObstacles = [];
    // console.log("ObstacleManager: Disposed.");
  }

  public reset(): void {
    this.obstaclePool.forEach(obstacle => {
      // Reset any asset instance state
      if (obstacle.assetInstance && typeof obstacle.assetInstance.reset === 'function') {
        try {
          obstacle.assetInstance.reset();
        } catch (error) {
          // console.warn(`ObstacleManager: Error resetting ${obstacle.type} asset:`, error);
        }
      }

      // Clear shark patrol data
      obstacle.patrolDirection = undefined;
      obstacle.patrolMinX = undefined;
      obstacle.patrolMaxX = undefined;

      // Clear sea turtle lane changing data
      obstacle.turtleCurrentLane = undefined;
      obstacle.turtleTargetLane = undefined;
      obstacle.turtleState = undefined;
      obstacle.turtleTimeInState = undefined;
      obstacle.turtleTimeToNextAction = undefined;
      obstacle.turtleHasChangedLane = undefined;

      // Clear kelp wall data
      obstacle.kelpAnimationPhase = undefined;

      // Clear school of fish data
      obstacle.schoolForwardSpeed = undefined;

      obstacle.isActive = false;
      obstacle.mesh.visible = false;
    });

    // Reset to base values
    const baseIntervals = configSystem.getObstacleBaseSpawnIntervals();
    this.spawnIntervalMin = baseIntervals.min;
    this.spawnIntervalMax = baseIntervals.max;
    this.complexityFactor = 0.2; // Reset to low complexity
    this.minZSpacing = 10; // Reset spacing

    this.timeToNextSpawn = 0;
    this.lastSpawnZ = 0;

    // Reset pattern sequence
    this.updatePatternSequence();

    // Recreate the pool with updated obstacle meshes that have collision spheres
    this.recreatePool();

    // console.log("ObstacleManager: Reset with new obstacle pool.");
  }

  public recreatePool(): void {
    // Remove all existing obstacles from the scene
    this.obstaclePool.forEach(obstacle => {
      if (obstacle.mesh) {
        this.scene.remove(obstacle.mesh);

        if (obstacle.mesh instanceof THREE.Mesh) {
          if (obstacle.mesh.geometry) obstacle.mesh.geometry.dispose();
          if (Array.isArray(obstacle.mesh.material)) {
            obstacle.mesh.material.forEach(m => m.dispose());
          } else if (obstacle.mesh.material) {
            obstacle.mesh.material.dispose();
          }
        } else if (obstacle.mesh instanceof THREE.Group) {
          // For Group objects like clams, dispose of all child meshes
          obstacle.mesh.traverse(child => {
            if (child instanceof THREE.Mesh) {
              if (child.geometry) child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else if (child.material) {
                child.material.dispose();
              }
            }
          });
        }
      }
    });

    // Clear the pools
    this.obstaclePool = [];
    this.activeObstacles = [];

    // Create new obstacles
    this.initializePool();
    // console.log("ObstacleManager: Recreated obstacle pool with updated meshes.");
  }
}
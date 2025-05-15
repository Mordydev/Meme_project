import * as THREE from 'three';
import { ProceduralAssetFactory, ObstacleAssetType, AnyObstacleTypeString } from '../assets/ProceduralAssetFactory';
import { configSystem } from '../core/ConfigurationSystem';
import { ClamAsset } from '../assets/obstacles/ClamAsset';
import { PufferfishAsset, PufferfishState } from '../assets/obstacles/PufferfishAsset';
import { JellyfishAsset } from '../assets/obstacles/JellyfishAsset';
import { SharkAsset } from '../assets/obstacles/SharkAsset';
import { SeaTurtleAsset } from '../assets/obstacles/SeaTurtleAsset';
import { KelpWallAsset } from '../assets/obstacles/KelpWallAsset';
import { SchoolOfFishAsset } from '../assets/obstacles/SchoolOfFishAsset';
import { PlayerController } from './PlayerController';
import { AssetHelpers } from '../assets/AssetHelpers';
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
  private gameEngine?: any; // Reference to GameEngine for player position
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

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory, gameEngine?: any /*, environmentManager: EnvironmentManager */) {
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
    console.log("ObstacleManager: Initialized with new obstacle types.");
  }

  /**
   * Links the PlayerController to the ObstacleManager for proximity-based behaviors
   * @param playerController The player controller to link
   */
  public linkPlayerController(playerController: PlayerController): void {
    this.playerController = playerController;
    console.log("ObstacleManager: PlayerController linked for proximity effects.");
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
    console.log("ObstacleManager: Initializing obstacle pool with size", this.poolSize);

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
    const schoolOfFishCount = this.poolSize - coralCount - rockCount - clamCount - pufferfishCount -
                             jellyfishCount - sharkCount - seaTurtleCount - kelpWallCount;

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

      // Special handling for shark obstacles to ensure they're created properly
      let mesh, asset;
      
      if (type === 'shark') {
        console.log(`ObstacleManager: Creating GUARANTEED shark obstacle ${i} with completely direct mesh creation`);
        try {
          // Get a directly created shark mesh that bypasses SharkAsset entirely
          // This is a completely manual mesh creation to address persistent visibility issues
          mesh = this.assetFactory.createDirectSharkMesh ? 
                 this.assetFactory.createDirectSharkMesh() : // Use method if available 
                 this.createDirectSharkMesh(); // Fall back to local implementation
          
          // Create asset instance for animation support
          const sharkAsset = new SharkAsset();
          asset = sharkAsset;
          
          // CRITICAL: Set the mesh on the asset to connect them properly
          if (typeof sharkAsset.setMesh === 'function') {
            sharkAsset.setMesh(mesh);
            console.log("ObstacleManager: Connected force-created mesh with SharkAsset instance");
          } else {
            console.warn("ObstacleManager: SharkAsset.setMesh not available - collision detection may fail");
          }
          
          // Explicitly set asset reference in userData
          mesh.userData = { 
            type: 'obstacle', 
            name: 'shark', 
            assetInstance: sharkAsset, 
            isDangerous: true,
            forceCreated: true
          };
          
          console.log(`ObstacleManager: Created GUARANTEED shark mesh with ${mesh.children.length} children`);
          
          // Double check visibility with our helper method
          this.ensureSharkVisibility(mesh);
        } catch (error) {
          console.error(`ObstacleManager: ERROR even in guaranteed shark creation:`, error);
          
          // Create an absolute last resort fallback
          console.log("ObstacleManager: Creating LAST RESORT emergency shark with StandardMaterial");
          
          // Create an emergency shark with StandardMaterial but bright colors
          mesh = new THREE.Group();
          mesh.name = "EMERGENCY_BACKUP_SHARK";
          
          // Create a bright blue body that should be unmissable
          const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.4, 1.4, 8, 4),
            new THREE.MeshStandardMaterial({ 
              color: 0x0088FF, // Bright blue
              emissive: 0x003366, // Light emissive for extra visibility
              emissiveIntensity: 0.2,
              roughness: 0.7,
              metalness: 0.2,
              wireframe: false
            })
          );
          body.rotation.x = Math.PI / 2;
          body.visible = true;
          body.castShadow = true;
          body.receiveShadow = true;
          mesh.add(body);
          
          // Add a bright red fin for recognition
          const fin = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 0.6, 4),
            new THREE.MeshStandardMaterial({ 
              color: 0xFF0000, // Bright red
              emissive: 0x660000, // Light emissive for extra visibility
              emissiveIntensity: 0.2,
              roughness: 0.7,
              metalness: 0.2,
              wireframe: false
            })
          );
          fin.position.set(0, 0.4, 0);
          fin.rotation.z = Math.PI;
          fin.visible = true;
          fin.castShadow = true;
          mesh.add(fin);
          
          // Create asset instance
          const sharkAsset = new SharkAsset();
          asset = sharkAsset;
          
          // Connect mesh with asset
          if (typeof sharkAsset.setMesh === 'function') {
            sharkAsset.setMesh(mesh);
            console.log("ObstacleManager: Connected emergency fallback mesh with SharkAsset instance");
          } else {
            // Create emergency collider in the asset directly
            sharkAsset.collisionMesh = new THREE.Mesh(
              new THREE.CapsuleGeometry(0.5, 1.5, 8, 4),
              new THREE.MeshBasicMaterial({ visible: false })
            );
            mesh.add(sharkAsset.collisionMesh);
          }
          
          // Set userData for identification
          mesh.userData = { 
            type: 'obstacle', 
            name: 'shark', 
            assetInstance: sharkAsset, 
            isDangerous: true,
            isEmergencyFallback: true
          };
          
          // CRITICAL: Ensure the mesh is visible
          mesh.visible = true;
        }
      } else {
        // Use standard creation for non-shark obstacles
        const result = this.assetFactory.createObstacle(type);
        mesh = result.mesh;
        asset = result.asset;
      }

      // All obstacles start invisible until spawned
      mesh.visible = false;
      this.scene.add(mesh);
      
      console.log(`ObstacleManager: Added ${type} obstacle ${i} to scene:`, {
        meshName: mesh.name,
        hasChildren: mesh instanceof THREE.Group ? mesh.children.length > 0 : false,
        childCount: mesh instanceof THREE.Group ? mesh.children.length : 0
      });

      this.obstaclePool.push({
        mesh,
        isActive: false,
        type,
        assetInstance: asset
      });

      console.log(`ObstacleManager: Created ${type} obstacle ${i} with mesh:`, mesh);
    }
  }

  private getInactiveObstacle(preferredType?: ObstacleType): Obstacle | undefined {
    // Debug logging for shark type
    if (preferredType === 'shark') {
      console.log("ObstacleManager: Looking for an inactive shark obstacle");
      
      // Log statistics about available obstacles
      const totalSharks = this.obstaclePool.filter(obs => obs.type === 'shark').length;
      const activeSharks = this.obstaclePool.filter(obs => obs.isActive && obs.type === 'shark').length;
      const inactiveSharks = this.obstaclePool.filter(obs => !obs.isActive && obs.type === 'shark').length;
      
      console.log(`ObstacleManager: Shark statistics - Total: ${totalSharks}, Active: ${activeSharks}, Inactive: ${inactiveSharks}`);
    }
    
    if (preferredType) {
      // First try to find an inactive obstacle of the preferred type
      const typedObstacle = this.obstaclePool.find(obs => !obs.isActive && obs.type === preferredType);
      
      if (typedObstacle) {
        // Debug logging for shark obstacles
        if (preferredType === 'shark') {
          console.log("ObstacleManager: Found inactive shark obstacle");
          console.log("Shark mesh details:", {
            name: typedObstacle.mesh.name,
            childCount: typedObstacle.mesh instanceof THREE.Group ? typedObstacle.mesh.children.length : 0,
            meshVisible: typedObstacle.mesh.visible,
            userData: typedObstacle.mesh.userData
          });
        }
        return typedObstacle;
      } else if (preferredType === 'shark') {
        console.log("ObstacleManager: No inactive shark found, will try any inactive obstacle");
      }
    }

    // If no preferred type or none found, get any inactive obstacle
    const anyObstacle = this.obstaclePool.find(obs => !obs.isActive);
    
    if (preferredType === 'shark' && anyObstacle) {
      console.log(`ObstacleManager: Using inactive ${anyObstacle.type} instead of shark (fallback)`);
    }
    
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
  private selectObstacleTypes(count: number, isPatternImportant: boolean): ObstacleType[] {
    const obstacleTypes: ObstacleType[] = [];

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let type: ObstacleType;

      // Higher complexity means more challenging obstacles
      // Adjust probabilities based on complexity
      // As complexity increases, dynamic obstacles (pufferfish, jellyfish, shark, seaTurtle) become more common

      // Modified complexity thresholds to ensure advanced obstacles appear earlier
      const sharkChance = this.complexityFactor > 0.2 ? 0.15 * this.complexityFactor : 0; // 0-15%
      const turtleChance = this.complexityFactor > 0.2 ? 0.15 * this.complexityFactor : 0; // 0-15%
      const kelpWallChance = this.complexityFactor > 0.2 ? 0.15 * this.complexityFactor : 0; // 0-15%
      const schoolFishChance = this.complexityFactor > 0.2 ? 0.15 * this.complexityFactor : 0; // 0-15%
      const advancedObstaclesChance = sharkChance + turtleChance + kelpWallChance + schoolFishChance;

      // Modified obstacle selection to increase chance of advanced obstacles
      if (rand < 0.20 - (this.complexityFactor * 0.15)) {
        type = 'coral';    // 20% to 5% chance for coral as complexity increases
      } else if (rand < 0.35 - (this.complexityFactor * 0.15)) {
        type = 'rock';     // 15% to 0% chance for rock as complexity increases
      } else if (rand < 0.5 - (this.complexityFactor * 0.1)) {
        type = 'clam';     // 15% to 5% chance for clam as complexity increases
      } else if (rand < 0.65 - (advancedObstaclesChance * 0.3)) {
        type = 'pufferfish'; // 15% to ~5% chance as complexity increases
      } else if (rand < 0.8 - (advancedObstaclesChance * 0.3)) {
        type = 'jellyfish';  // 15% to ~5% chance as complexity increases
      } else if (rand < 0.85 + (sharkChance * 0.5)) {
        type = 'shark';    // 5-20% chance depending on complexity
      } else if (rand < 0.9 + (turtleChance * 0.5)) {
        type = 'seaTurtle'; // 5-20% chance depending on complexity
      } else if (rand < 0.95 + (kelpWallChance * 0.5)) {
        type = 'kelpWall'; // 5-20% chance depending on complexity
      } else {
        type = 'schoolOfFish'; // 5-20% chance depending on complexity
      }

      obstacleTypes.push(type);
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
        console.warn(`ObstacleManager: No inactive obstacles in pool to spawn!`);
        continue;
      }

      obstacle.isActive = true;
      obstacle.mesh.visible = true;
      
      // Ensure meshes and their children are visible
      if (obstacle.type === 'shark' || obstacle.type === 'seaTurtle' || obstacle.type === 'kelpWall') {
        console.log(`ObstacleManager: Setting ${obstacle.type} and its children to visible`);
        
        // Apply consistent visibility enforcement to all obstacles
        // Each asset is now responsible for its own appearance
        AssetHelpers.ensureVisibility(obstacle.mesh);
        
        // Special handling only for render ordering if needed
        if (obstacle.type === 'shark') {
          obstacle.mesh.renderOrder = 1000; // Keep high render order for sharks
        } else if (obstacle.type === 'seaTurtle') {
          obstacle.mesh.renderOrder = 900;  // High render order for sea turtles
        }
      }

      // Position the obstacle
      obstacle.mesh.position.x = laneIndex * laneWidth;
      obstacle.mesh.position.z = targetZ;

      // Adjust Y position based on obstacle type
      if (obstacle.type === 'rock') {
        obstacle.mesh.position.y = -0.85; // Rocks sit slightly higher on the floor
      } else if (obstacle.type === 'clam') {
        obstacle.mesh.position.y = -0.9; // Clams slightly above floor
      } else if (obstacle.type === 'pufferfish') {
        obstacle.mesh.position.y = -0.5; // Pufferfish float higher in the water
      } else if (obstacle.type === 'jellyfish') {
        obstacle.mesh.position.y = -0.3; // Jellyfish float highest in the water
      } else if (obstacle.type === 'shark') {
        obstacle.mesh.position.y = -0.4; // Sharks swim at mid-water level
        
        // Enhanced visibility enforcement for shark
        console.log(`ObstacleManager: Forcefully applying special shark visibility for ${obstacle.mesh.name}`);
        this.ensureSharkVisibility(obstacle.mesh); // Apply forced materials & visibility
        
        // Print additional debug info about this shark mesh - avoid circular references
        console.log("SHARK MESH DEBUG INFO:", {
          name: obstacle.mesh.name,
          childCount: obstacle.mesh instanceof THREE.Group ? obstacle.mesh.children.length : 0,
          childNames: obstacle.mesh instanceof THREE.Group ? 
            obstacle.mesh.children.map(c => c.name || 'unnamed').join(', ') : 'not a group',
          // Extract only the relevant properties from userData to avoid circular references
          userDataProps: {
            type: obstacle.mesh.userData.type,
            name: obstacle.mesh.userData.name,
            isDangerous: obstacle.mesh.userData.isDangerous,
            isFallback: obstacle.mesh.userData.isFallback,
            isEmergency: obstacle.mesh.userData.isEmergency,
            isDirectlyCreated: obstacle.mesh.userData.isDirectlyCreated,
            forceCreated: obstacle.mesh.userData.forceCreated
          },
          isFallback: obstacle.mesh.name.includes("Fallback") || 
                     obstacle.mesh.name.includes("Emergency") || 
                     obstacle.mesh.userData.isFallback === true
        });
        
        // Check if this is a fallback shark and log it
        if (obstacle.mesh.name.includes("Fallback") || 
            obstacle.mesh.name.includes("Emergency")) {
          console.log("ObstacleManager: WARNING - Using fallback shark model - should be visible but simplified");
        } else {
          console.log("ObstacleManager: Using detailed shark model (good)");
        }

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
      } else if (obstacle.type === 'seaTurtle') {
        obstacle.mesh.position.y = -0.35; // Sea turtles swim at mid-water level

        // Set up sea turtle lane changing parameters
        obstacle.turtleCurrentLane = laneIndex;
        obstacle.turtleState = 'patrolling';
        obstacle.turtleTimeInState = 0;
        obstacle.turtleTimeToNextAction = this.seaTurtleConfig.minTimeInLane +
                                          Math.random() * (this.seaTurtleConfig.maxTimeInLane - this.seaTurtleConfig.minTimeInLane);

        // Ensure the turtle starts facing forward
        if (obstacle.assetInstance instanceof SeaTurtleAsset) {
          obstacle.assetInstance.setTelegraphTurn('center');
        }
      } else if (obstacle.type === 'kelpWall') {
        // Position kelp so its base is on the seafloor
        // Mesh is already positioned based on its base being at Y=0 within the group
        obstacle.mesh.position.y = -0.95; // Base of kelp at seafloor
        
        // Ensure kelp wall is properly centered on the lane
        // Lane index is rounded to ensure it's at exact lane positions (-1, 0, 1)
        // This prevents any slight misalignments that could cause adjacent lane collisions
        const laneIndex = Math.round(obstacle.laneIndex);
        const laneWidth = configSystem.get('player')?.laneWidth || 2.0;
        obstacle.mesh.position.x = laneIndex * laneWidth;
        
        console.log(`KelpWall positioned at lane ${laneIndex}, x=${obstacle.mesh.position.x.toFixed(2)}`);

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

      // Reset the asset if needed (e.g., pufferfish inflation state)
      if (typeof obstacle.assetInstance.reset === 'function') {
        try {
          obstacle.assetInstance.reset();
        } catch (error) {
          console.warn(`ObstacleManager: Error resetting ${obstacle.type} asset:`, error);
        }
      }

      // Add to active obstacles list for collision detection
      this.activeObstacles.push(obstacle);

      console.log(`ObstacleManager: Spawned ${obstacle.type} at x:${obstacle.mesh.position.x.toFixed(1)}, z:${obstacle.mesh.position.z.toFixed(1)} as part of ${pattern} pattern (complexity: ${this.complexityFactor.toFixed(2)})`);
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
    } else if (this.gameEngine) {
      // Fallback to gameEngine if available
      const playerMesh = this.gameEngine.getPlayerMesh();
      if (playerMesh) {
        playerPosition.copy(playerMesh.position);
      }
    }

    // Update animations for active obstacles
    for (const obstacle of this.activeObstacles) {
      // Handle clam animations
      if (obstacle.type === 'clam' && obstacle.assetInstance instanceof ClamAsset) {
        const clamAsset = obstacle.assetInstance;
        clamAsset.updateAnimation(deltaTime, obstacle.mesh as THREE.Group);

        // Store open state in userData for collision detection system
        if (obstacle.mesh.userData) {
          obstacle.mesh.userData.isOpen = clamAsset.isOpen;
          obstacle.mesh.userData.isDangerous = clamAsset.isOpen;
        }
      }

      // Handle pufferfish animations (inflation based on player proximity)
      else if (obstacle.type === 'pufferfish' && obstacle.assetInstance instanceof PufferfishAsset) {
        const pufferfishAsset = obstacle.assetInstance;

        // Pass player position for proximity-based inflation
        const inflationState = pufferfishAsset.updateAnimation(deltaTime, obstacle.mesh as THREE.Group, playerPosition);

        // Store inflation state in userData for collision detection system
        if (obstacle.mesh.userData) {
          obstacle.mesh.userData.inflationState = inflationState;
          obstacle.mesh.userData.isDangerous = pufferfishAsset.isDangerous();
        }
      }

      // Handle jellyfish animations (drifting and tentacle movement)
      else if (obstacle.type === 'jellyfish' && obstacle.assetInstance instanceof JellyfishAsset) {
        const jellyfishAsset = obstacle.assetInstance;
        jellyfishAsset.updateAnimation(deltaTime, obstacle.mesh as THREE.Group);

        // Constrain jellyfish to stay within lanes and world bounds
        const laneWidth = configSystem.getPlayerLaneWidth();
        const xBoundary = configSystem.getWorldXBoundary();
        jellyfishAsset.constrainPosition(obstacle.mesh as THREE.Group, laneWidth, xBoundary);

        // Store danger state in userData for collision detection system
        if (obstacle.mesh.userData) {
          obstacle.mesh.userData.isDangerous = jellyfishAsset.isDangerous();
        }
      }

      // Handle shark animations and patrolling behavior
      else if (obstacle.type === 'shark' && obstacle.assetInstance instanceof SharkAsset) {
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
      else if (obstacle.type === 'seaTurtle' && obstacle.assetInstance instanceof SeaTurtleAsset) {
        const turtleAsset = obstacle.assetInstance;

        // Update flipper animations
        turtleAsset.updateAnimation(deltaTime);

        // Handle sea turtle's forward movement (slower than environment scroll)
        const playerBaseSpeed = configSystem.getDifficultyConfig().basePlayerSpeed;
        const turtleActualForwardSpeed = playerBaseSpeed * this.seaTurtleConfig.forwardSpeedFactor;

        // Calculate slow forward movement relative to world speed
        const worldScrollSpeed = this.playerController?.currentActualSpeed || playerBaseSpeed;
        obstacle.mesh.position.z += (worldScrollSpeed - turtleActualForwardSpeed) * deltaTime;

        // Handle lane-changing AI if state parameters are set
        if (obstacle.turtleState &&
            obstacle.turtleCurrentLane !== undefined &&
            obstacle.turtleTimeInState !== undefined) {

          // Update time in current state
          obstacle.turtleTimeInState += deltaTime;

          // State machine for lane changing
          if (obstacle.turtleState === 'patrolling') {
            if (obstacle.turtleTimeInState >= obstacle.turtleTimeToNextAction!) {
              // Time to decide next lane change
              const laneCount = configSystem.getWorldLaneCount();
              const possibleLanes = [];

              // Get all possible lanes to change to
              for (let i = -Math.floor(laneCount/2); i <= Math.floor(laneCount/2); i++) {
                if (i !== obstacle.turtleCurrentLane) {
                  possibleLanes.push(i);
                }
              }

              if (possibleLanes.length > 0) {
                // Pick a random lane to move to
                const randomIndex = Math.floor(Math.random() * possibleLanes.length);
                obstacle.turtleTargetLane = possibleLanes[randomIndex];

                // Change to telegraphing state
                obstacle.turtleState = 'telegraphing';
                obstacle.turtleTimeInState = 0;

                // Signal the direction visually by turning the turtle
                const direction = obstacle.turtleTargetLane < obstacle.turtleCurrentLane ? 'left' : 'right';
                turtleAsset.setTelegraphTurn(direction);
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

              // Set next lane change time
              obstacle.turtleTimeToNextAction = this.seaTurtleConfig.minTimeInLane +
                Math.random() * (this.seaTurtleConfig.maxTimeInLane - this.seaTurtleConfig.minTimeInLane);

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

        // Update fish animations (swimming/schooling)
        schoolAsset.updateAnimation(deltaTime);

        // Handle school of fish's forward movement (can be slightly slower than environment)
        if (obstacle.schoolForwardSpeed !== undefined) {
          const playerBaseSpeed = configSystem.getDifficultyConfig().basePlayerSpeed;
          const schoolActualForwardSpeed = playerBaseSpeed * obstacle.schoolForwardSpeed;

          // Calculate slow forward movement relative to world speed
          const worldScrollSpeed = this.playerController?.currentActualSpeed || playerBaseSpeed;
          obstacle.mesh.position.z += (worldScrollSpeed - schoolActualForwardSpeed) * deltaTime;
        }

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
            console.warn(`ObstacleManager: Error resetting ${obstacle.type} asset:`, error);
          }
        }

        obstacle.isActive = false;
        obstacle.mesh.visible = false;

        // Remove from activeObstacles array
        this.activeObstacles.splice(i, 1);

        console.log(`ObstacleManager: Recycled ${obstacle.type} obstacle at z:${obstacle.mesh.position.z.toFixed(1)}`);
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
      console.log(`ObstacleManager: Player hit ${hitObstacle.type} obstacle`, obstacleMesh.name);

      // Check if the obstacle is actually dangerous based on its current state
      let isDangerous = true; // Default to dangerous if we can't determine

      if (hitObstacle.type === 'clam' && hitObstacle.assetInstance instanceof ClamAsset) {
        const clamAsset = hitObstacle.assetInstance;

        if (!clamAsset.isOpen) {
          console.log("ObstacleManager: Clam was closed during collision, no damage!");
          isDangerous = false;
        }
      }
      else if (hitObstacle.type === 'pufferfish' && hitObstacle.assetInstance instanceof PufferfishAsset) {
        const pufferfishAsset = hitObstacle.assetInstance;

        isDangerous = pufferfishAsset.isDangerous();
        if (!isDangerous) {
          console.log("ObstacleManager: Pufferfish is not in a dangerous state, no damage!");
        }
      }
      else if (hitObstacle.type === 'jellyfish' && hitObstacle.assetInstance instanceof JellyfishAsset) {
        const jellyfishAsset = hitObstacle.assetInstance;

        // Jellyfish are always dangerous, especially the tentacles
        isDangerous = jellyfishAsset.isDangerous();
      }
      else if (hitObstacle.type === 'shark' && hitObstacle.assetInstance instanceof SharkAsset) {
        const sharkAsset = hitObstacle.assetInstance;

        // Sharks are always dangerous
        isDangerous = sharkAsset.isDangerous();
      }
      else if (hitObstacle.type === 'seaTurtle' && hitObstacle.assetInstance instanceof SeaTurtleAsset) {
        const turtleAsset = hitObstacle.assetInstance;

        // Sea turtles are always dangerous
        isDangerous = turtleAsset.isDangerous();
      }
      else if (hitObstacle.type === 'kelpWall' && hitObstacle.assetInstance instanceof KelpWallAsset) {
        const kelpAsset = hitObstacle.assetInstance;

        // Kelp walls are always dangerous
        isDangerous = kelpAsset.isDangerous();
      }
      else if (hitObstacle.type === 'schoolOfFish' && hitObstacle.assetInstance instanceof SchoolOfFishAsset) {
        const schoolAsset = hitObstacle.assetInstance;

        // Schools of fish are always dangerous
        isDangerous = schoolAsset.isDangerous();
      }

      // If the obstacle is not dangerous in its current state, skip player damage
      if (!isDangerous) {
        console.log(`ObstacleManager: ${hitObstacle.type} obstacle hit, but not dangerous - no damage to player`);
        return false; // Obstacle remains active, no damage to player
      }

      // Reset the asset to its initial state
      if (hitObstacle.assetInstance && typeof hitObstacle.assetInstance.reset === 'function') {
        try {
          hitObstacle.assetInstance.reset();
        } catch (error) {
          console.warn(`ObstacleManager: Error resetting ${hitObstacle.type} asset:`, error);
        }
      }

      // Deactivate it
      hitObstacle.isActive = false;
      hitObstacle.mesh.visible = false;

      // Remove from activeObstacles array
      this.activeObstacles.splice(activeIndex, 1);

      console.log(`ObstacleManager: ${hitObstacle.type} obstacle hit by player and caused damage`);
      return true; // This was a dangerous hit
    } else {
      console.warn("ObstacleManager: Tried to hit an obstacle that isn't in the active list!");
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
    console.log("ObstacleManager: Disposed.");
  }

  public reset(): void {
    this.obstaclePool.forEach(obstacle => {
      // Reset any asset instance state
      if (obstacle.assetInstance && typeof obstacle.assetInstance.reset === 'function') {
        try {
          obstacle.assetInstance.reset();
        } catch (error) {
          console.warn(`ObstacleManager: Error resetting ${obstacle.type} asset:`, error);
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

    console.log("ObstacleManager: Reset with new obstacle pool.");
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
    console.log("ObstacleManager: Recreated obstacle pool with updated meshes.");
  }

  /**
   * Helper method to ensure shark visibility for all components
   * This now uses the AssetHelpers utility to set visibility consistently,
   * allowing the SharkAsset to manage its own materials.
   */
  private ensureSharkVisibility(mesh: THREE.Object3D): void {
    console.log("ObstacleManager: Applying standard visibility enforcement to shark");
    
    // Use the standard AssetHelpers for visibility enforcement
    // This delegates visibility handling to the helper without material overrides
    AssetHelpers.ensureVisibility(mesh);
    
    // Set render order for proper layering
    mesh.renderOrder = 1000; // High render order for consistent visibility
  }
  
  /**
   * Creates a guaranteed shark mesh directly without relying on SharkAsset
   * This is a completely direct method to bypass any potential ThreeJS issues
   * Now uses MeshStandardMaterial for consistent appearance with the rest of the assets
   */
  private createDirectSharkMesh(): THREE.Group {
    console.log("ObstacleManager: Creating MINIMAL shark mesh with MeshStandardMaterial");
    
    // Create the main group
    const sharkMesh = new THREE.Group();
    sharkMesh.name = "SIMPLIFIED_SHARK";
    
    // Use StandardMaterial for proper lighting and consistent appearance
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x5A6A7A, // Shark gray
      roughness: 0.7,  // Slightly rough skin texture
      metalness: 0.1,  // Low metalness for organic look
      side: THREE.DoubleSide // Ensure both sides render
    });
    
    const finMaterial = new THREE.MeshStandardMaterial({
      color: 0x4C6A8F, // Slightly different shade for fins
      roughness: 0.6,  // Slightly smoother than body
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    // Create very simple shark body
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.6, 12, 6); // More segments for smoother appearance
    bodyGeometry.rotateX(Math.PI / 2);
    bodyGeometry.computeVertexNormals(); // Important for proper lighting
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = "SharkBodySimple";
    body.visible = true;
    body.castShadow = true;
    body.receiveShadow = true;
    sharkMesh.add(body);
    
    // Add a basic dorsal fin with smoother geometry
    const dorsalFinGeometry = new THREE.ConeGeometry(0.3, 0.6, 8); // More segments
    dorsalFinGeometry.rotateZ(Math.PI); // Point upward
    dorsalFinGeometry.computeVertexNormals();
    
    const dorsalFin = new THREE.Mesh(dorsalFinGeometry, finMaterial);
    dorsalFin.name = "SharkDorsalFinSimple";
    dorsalFin.position.set(0, 0.4, 0);
    dorsalFin.visible = true;
    dorsalFin.castShadow = true;
    sharkMesh.add(dorsalFin);
    
    // Improved tail fin
    const tailGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.3, 2, 4, 2); // More segments
    tailGeometry.computeVertexNormals();
    const tailFin = new THREE.Mesh(tailGeometry, finMaterial);
    tailFin.name = "SharkTailFinSimple";
    tailFin.position.set(0, 0, 0.9);
    tailFin.visible = true;
    tailFin.castShadow = true;
    sharkMesh.add(tailFin);
    
    // Improved side fins
    // Left fin
    const sideFinGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    sideFinGeometry.rotateZ(Math.PI / 2); // Orient sideways
    sideFinGeometry.computeVertexNormals();
    
    const leftFin = new THREE.Mesh(sideFinGeometry, finMaterial);
    leftFin.name = "SharkLeftFinSimple";
    leftFin.position.set(-0.4, -0.1, -0.2);
    leftFin.visible = true;
    leftFin.castShadow = true;
    sharkMesh.add(leftFin);
    
    // Right fin (mirror of left)
    const rightFin = leftFin.clone();
    rightFin.name = "SharkRightFinSimple";
    rightFin.position.x = -leftFin.position.x;
    rightFin.visible = true;
    sharkMesh.add(rightFin);
    
    // Add eyes
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,   // Black
      roughness: 0.3,    // Glossy eyes
      metalness: 0.2,    // Slight sheen
    });
    
    const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 6);
    
    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.name = "SharkLeftEye";
    leftEye.position.set(-0.2, 0.1, -0.7);
    sharkMesh.add(leftEye);
    
    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry.clone(), eyeMaterial);
    rightEye.name = "SharkRightEye";
    rightEye.position.set(0.2, 0.1, -0.7);
    sharkMesh.add(rightEye);
    
    // Create simple collision mesh
    const collisionGeometry = new THREE.CapsuleGeometry(0.5, 1.6, 8, 4);
    collisionGeometry.rotateX(Math.PI / 2);
    
    const collisionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      visible: false
    });
    
    const collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    collisionMesh.name = "SharkCollisionShapeSimple";
    sharkMesh.add(collisionMesh);
    
    // MANUALLY FORCE visible flag on EVERYTHING
    sharkMesh.visible = true;
    sharkMesh.children.forEach(child => {
      if (child instanceof THREE.Mesh && !child.name.includes("Collision")) {
        child.visible = true;
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.visible = true;
              mat.needsUpdate = true;
            });
          } else {
            child.material.visible = true;
            child.material.needsUpdate = true;
          }
        }
      }
    });
    
    // Add debug information to easily identify this mesh
    sharkMesh.userData = {
      type: 'obstacle',
      name: 'shark',
      isDangerous: true,
      isSimplified: true,
      createdAt: new Date().toISOString()
    };
    
    console.log("SIMPLIFIED_SHARK created with StandardMaterial:", {
      childCount: sharkMesh.children.length,
      childNames: sharkMesh.children.map(c => c.name).join(', '),
      isVisible: sharkMesh.visible
    });
    
    return sharkMesh;
  }
}
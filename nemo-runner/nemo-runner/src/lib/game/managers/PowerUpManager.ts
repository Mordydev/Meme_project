import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { ShieldPowerUpAsset } from '../assets/powerups/ShieldPowerUpAsset';
import { MagnetPowerUpAsset } from '../assets/powerups/MagnetPowerUpAsset';
import { DoubleScorePowerUpAsset } from '../assets/powerups/DoubleScorePowerUpAsset';
import { ConfigurationSystem } from '../core/ConfigurationSystem';

// Type representing all possible power-up types
export type PowerUpType = 'shield' | 'magnet' | 'doublescore';

/**
 * Manages the spawning, pooling, and lifecycle of power-ups in the game
 */
export class PowerUpManager {
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;
  private config: ConfigurationSystem;
  
  // Active power-ups in the scene
  private activePowerUps: (ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset)[] = [];
  
  // Object pools for each type of power-up
  private powerUpPools: {
    [key in PowerUpType]: (ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset)[];
  } = {
    shield: [],
    magnet: [],
    doublescore: []
  };
  
  // Time since last spawn
  private timeSinceLastSpawn: number = 0;
  
  // Spawn settings
  private spawnIntervalMin: number = 15; // Minimum seconds between power-up spawns
  private spawnIntervalMax: number = 25; // Maximum seconds between power-up spawns
  private nextSpawnTime: number = 0;
  private spawnDistanceAhead: number = 30; // How far ahead to spawn power-ups
  private spawnProbabilities: { [key in PowerUpType]: number } = {
    shield: 0.35,      // 35% chance for shield
    magnet: 0.35,      // 35% chance for magnet
    doublescore: 0.3   // 30% chance for double score
  };
  
  // Maximum number of power-ups to pool (per type)
  private maxPoolSize: number = 5;
  
  // Current game speed (distance per second)
  private gameSpeed: number = 0;
  
  /**
   * Creates a new PowerUpManager
   * @param scene The THREE.js scene
   * @param assetFactory The asset factory for creating power-up meshes
   * @param config The game configuration system
   */
  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory, config: ConfigurationSystem) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    this.config = config;
    
    // Initialize power-up pools
    this.initializePools();
    
    // Set initial spawn time
    this.resetSpawnTimer();
    
    console.log("PowerUpManager: Initialized.");
  }
  
  /**
   * Initializes the object pools for all power-up types
   */
  private initializePools(): void {
    // Pre-create a few power-ups of each type
    const initialPoolSize = 2;
    const dummyPosition = new THREE.Vector3(0, 0, -100); // Off-screen position
    
    // For each power-up type, create initial pool objects
    Object.keys(this.powerUpPools).forEach((type) => {
      const powerUpType = type as PowerUpType;
      for (let i = 0; i < initialPoolSize; i++) {
        const powerUp = this.assetFactory.createPowerUpAsset(powerUpType, dummyPosition);
        powerUp.getMesh().visible = false; // Hide initially
        this.scene.add(powerUp.getMesh());
        this.powerUpPools[powerUpType].push(powerUp);
      }
    });
    
    console.log(`PowerUpManager: Object pools initialized with ${initialPoolSize} power-ups of each type.`);
  }
  
  /**
   * Gets a power-up from the pool, or creates a new one if the pool is empty
   * @param type The type of power-up to get
   * @param position The position to place the power-up
   * @returns The power-up asset
   */
  private getPowerUpFromPool(type: PowerUpType, position: THREE.Vector3): ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset {
    // Check if there's an available power-up in the pool
    if (this.powerUpPools[type].length > 0) {
      const powerUp = this.powerUpPools[type].pop()!;
      powerUp.getMesh().position.copy(position);
      powerUp.reset();
      powerUp.getMesh().visible = true;
      return powerUp;
    }
    
    // If pool is empty, create a new power-up
    console.log(`PowerUpManager: Creating new ${type} power-up, pool was empty.`);
    const powerUp = this.assetFactory.createPowerUpAsset(type, position);
    this.scene.add(powerUp.getMesh());
    return powerUp;
  }
  
  /**
   * Returns a power-up to its pool
   * @param powerUp The power-up to return
   */
  private returnPowerUpToPool(powerUp: ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset): void {
    // Get the power-up type from userData
    const type = powerUp.getMesh().userData.subtype as PowerUpType;
    
    // Hide the power-up
    powerUp.getMesh().visible = false;
    
    // Check if we have space in the pool
    if (this.powerUpPools[type].length < this.maxPoolSize) {
      // Reset the power-up and add to pool
      powerUp.reset();
      powerUp.getMesh().position.set(0, 0, -100); // Move off-screen
      this.powerUpPools[type].push(powerUp);
      
      // Remove from active list
      const index = this.activePowerUps.indexOf(powerUp);
      if (index !== -1) {
        this.activePowerUps.splice(index, 1);
      }
    } else {
      // Pool is full, dispose of the power-up
      console.log(`PowerUpManager: Pool for ${type} is full, disposing power-up.`);
      powerUp.dispose();
      
      // Remove from active list
      const index = this.activePowerUps.indexOf(powerUp);
      if (index !== -1) {
        this.activePowerUps.splice(index, 1);
      }
    }
  }
  
  /**
   * Spawns a new power-up at a random lane position ahead of the player
   */
  private spawnPowerUp(): void {
    // Available lanes for power-up placement
    const lanes = [-1, 0, 1];
    const laneWidth = 2; // Distance between lanes
    const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
    const randomHeight = 1 + Math.random() * 0.5; // Height between 1 and 1.5
    
    // Position of the power-up
    const position = new THREE.Vector3(
      randomLane * laneWidth,
      randomHeight,
      this.spawnDistanceAhead
    );
    
    // Random power-up type based on probabilities
    const rand = Math.random();
    let type: PowerUpType;
    let cumulativeProbability = 0;
    
    for (const [powerUpType, probability] of Object.entries(this.spawnProbabilities)) {
      cumulativeProbability += probability;
      if (rand <= cumulativeProbability) {
        type = powerUpType as PowerUpType;
        break;
      }
    }
    
    // Fallback if something went wrong with probability calculation
    if (!type) {
      type = 'shield';
    }
    
    // Get a power-up from the pool and add to active list
    const powerUp = this.getPowerUpFromPool(type, position);
    this.activePowerUps.push(powerUp);
    
    console.log(`PowerUpManager: Spawned ${type} power-up at lane ${randomLane}.`);
  }
  
  /**
   * Updates all active power-ups, moves them with game speed, and handles despawning
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Update time since last spawn
    this.timeSinceLastSpawn += deltaTime;
    
    // Check if it's time to spawn a new power-up
    if (this.timeSinceLastSpawn >= this.nextSpawnTime) {
      this.spawnPowerUp();
      this.resetSpawnTimer();
    }
    
    // Update all active power-ups
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const powerUp = this.activePowerUps[i];
      
      // Move power-up backward based on game speed
      powerUp.getMesh().position.z -= this.gameSpeed * deltaTime;
      
      // Update power-up animation
      powerUp.update(deltaTime);
      
      // Despawn if it's behind the player or not active
      if (powerUp.getMesh().position.z < -5 || !powerUp.isActive()) {
        this.returnPowerUpToPool(powerUp);
      }
    }
  }
  
  /**
   * Resets the spawn timer with a random interval
   */
  private resetSpawnTimer(): void {
    this.timeSinceLastSpawn = 0;
    this.nextSpawnTime = this.spawnIntervalMin + Math.random() * (this.spawnIntervalMax - this.spawnIntervalMin);
  }
  
  /**
   * Handles player collision with a power-up
   * @param powerUp The power-up that was collected
   * @returns The type of power-up that was collected
   */
  public onPowerUpCollected(powerUp: ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset): PowerUpType {
    // Get the power-up type from userData
    const type = powerUp.getMesh().userData.subtype as PowerUpType;
    
    // Mark as collected - this will be processed in the next update
    powerUp.collect();
    
    console.log(`PowerUpManager: Player collected ${type} power-up.`);
    
    return type;
  }
  
  /**
   * Sets the current game speed (distance per second)
   * @param speed The new game speed
   */
  public setGameSpeed(speed: number): void {
    this.gameSpeed = speed;
  }
  
  /**
   * Returns a list of all active power-up meshes for collision detection
   * @returns Array of THREE.Mesh objects representing active power-ups
   */
  public getActivePowerUpMeshes(): THREE.Mesh[] {
    return this.activePowerUps.map(powerUp => powerUp.getMesh());
  }

  /**
   * Gets all active power-up assets
   * @returns Array of all active power-up assets
   */
  public getActivePowerUps(): (ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset)[] {
    return this.activePowerUps;
  }
  
  /**
   * Disposes of all power-ups and clears the pools
   */
  public dispose(): void {
    // Dispose active power-ups
    this.activePowerUps.forEach(powerUp => powerUp.dispose());
    this.activePowerUps = [];
    
    // Dispose pooled power-ups
    Object.values(this.powerUpPools).forEach(pool => {
      pool.forEach(powerUp => powerUp.dispose());
    });
    
    // Reset pools
    this.powerUpPools = {
      shield: [],
      magnet: [],
      doublescore: []
    };
    
    console.log("PowerUpManager: Disposed.");
  }
}
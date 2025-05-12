import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { ShieldPowerUpAsset } from '../assets/powerups/ShieldPowerUpAsset';
import { MagnetPowerUpAsset } from '../assets/powerups/MagnetPowerUpAsset';
import { DoubleScorePowerUpAsset } from '../assets/powerups/DoubleScorePowerUpAsset';
import { configSystem } from '../core/ConfigurationSystem';
import { PlayerController } from './PlayerController';
import { ScoringSystem } from './ScoringSystem';
import { CollectibleManager } from './CollectibleManager';

// Type representing all possible power-up types
export type PowerUpType = 'shield' | 'magnet' | 'doublescore';
type PowerUpAsset = ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset;

// Interface for tracking active power-up effects and their durations
interface ActivePowerUpEffect {
  type: PowerUpType;
  remainingDuration: number;
}

// Interface for UI representation of active power-ups
export interface ActivePowerUpInfo {
  type: PowerUpType;
  remainingNormalizedTime: number; // 0.0 to 1.0
}

/**
 * Manages the spawning, pooling, lifecycle and effects of power-ups in the game
 */
export class PowerUpManager {
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;

  // References to other managers (set via linkManagers)
  private playerController!: PlayerController;
  private scoringSystem!: ScoringSystem;
  private collectibleManager!: CollectibleManager;

  // Active visual power-ups in the scene
  private activeVisualPowerUps: PowerUpAsset[] = [];

  // Active power-up effects (may not correspond 1:1 with visual power-ups)
  private activeEffects: ActivePowerUpEffect[] = [];

  // Object pools for each type of power-up
  private powerUpPools: {
    [key in PowerUpType]: PowerUpAsset[];
  } = {
    shield: [],
    magnet: [],
    doublescore: []
  };

  // Time since last spawn
  private timeSinceLastSpawn: number = 0;
  private nextSpawnTime: number = 0;

  // Spawn settings (loaded from config)
  private spawnDistanceAhead: number;
  private spawnProbabilities: { [key in PowerUpType]: number } = {
    shield: 0.35,      // 35% chance for shield
    magnet: 0.35,      // 35% chance for magnet
    doublescore: 0.3   // 30% chance for double score
  };

  // Maximum number of power-ups to pool (per type)
  private maxPoolSize: number = 5; // Increased for better availability

  // Current game speed (distance per second)
  private gameSpeed: number = 0;

  /**
   * Creates a new PowerUpManager
   * @param scene The THREE.js scene
   * @param assetFactory The asset factory for creating power-up meshes
   */
  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory) {
    this.scene = scene;
    this.assetFactory = assetFactory;

    // Get spawn settings from config
    const powerUpConfig = configSystem.getPowerUpsConfig();
    this.spawnDistanceAhead = configSystem.get('collectibles').spawnDistanceAhead;

    // Initialize power-up pools
    this.initializePools();

    // Set initial spawn time
    this.resetSpawnTimer();

    console.log("PowerUpManager: Initialized.");
  }

  /**
   * Links the power-up manager with other game managers (call after all managers are created)
   */
  public linkManagers(
    playerController: PlayerController,
    scoringSystem: ScoringSystem,
    collectibleManager: CollectibleManager
  ): void {
    this.playerController = playerController;
    this.scoringSystem = scoringSystem;
    this.collectibleManager = collectibleManager;
    console.log("PowerUpManager: Linked with other managers.");
  }

  /**
   * Initializes the object pools for all power-up types
   */
  private initializePools(): void {
    // Pre-create a few power-ups of each type
    const initialPoolSize = 2; // Increased for better availability
    const dummyPosition = new THREE.Vector3(0, 0, -2000); // Far off-screen position

    // For each power-up type, create initial pool objects
    (Object.keys(this.powerUpPools) as PowerUpType[]).forEach((powerUpType) => {
      for (let i = 0; i < initialPoolSize; i++) {
        const powerUp = this.assetFactory.createPowerUpAsset(powerUpType, dummyPosition.clone());
        powerUp.getMesh().visible = false; // Hide initially
        this.scene.add(powerUp.getMesh());
        this.powerUpPools[powerUpType].push(powerUp);
      }
    });

    console.log(`PowerUpManager: Object pools initialized with ${initialPoolSize} of each type. Max pool size: ${this.maxPoolSize}.`);
  }

  /**
   * Gets a power-up from the pool, or creates a new one if the pool is empty
   * @param type The type of power-up to get
   * @param position The position to place the power-up
   * @returns The power-up asset or null if creation failed
   */
  private getPowerUpFromPool(type: PowerUpType, position: THREE.Vector3): PowerUpAsset | null {
    // Check if there's an available power-up in the pool
    if (this.powerUpPools[type].length > 0) {
      const powerUp = this.powerUpPools[type].pop()!;
      powerUp.getMesh().position.copy(position);
      powerUp.reset(); // Ensure asset's internal state is reset (visibility, etc.)
      return powerUp;
    }

    // If pool is empty, log warning
    console.warn(`PowerUpManager: Pool for ${type} is empty. No power-up spawned.`);
    return null;
  }

  /**
   * Returns a power-up to its pool
   * @param powerUp The power-up to return
   */
  private returnPowerUpToPool(powerUp: PowerUpAsset): void {
    // Get the power-up type from userData
    const type = powerUp.getMesh().userData.subtype as PowerUpType;

    // Hide the power-up and move it off-screen
    powerUp.getMesh().visible = false;
    powerUp.getMesh().position.set(0, 0, -2000);

    // Remove from active list
    const indexInActive = this.activeVisualPowerUps.indexOf(powerUp);
    if (indexInActive > -1) {
      this.activeVisualPowerUps.splice(indexInActive, 1);
    }

    // Add to pool if there's room, otherwise dispose
    if (this.powerUpPools[type].length < this.maxPoolSize) {
      this.powerUpPools[type].push(powerUp);
    } else {
      powerUp.dispose();
    }
  }

  /**
   * Spawns a new power-up at a random lane position ahead of the player
   * @param playerZ The player's current Z position
   */
  private spawnPowerUp(playerZ: number): void {
    if (!this.playerController) {
        console.warn("PowerUpManager: PlayerController not linked, cannot spawn power-up.");
        return;
    }

    // Available lanes for power-up placement
    const lanes = [-1, 0, 1];
    const laneWidth = configSystem.get('player').laneWidth;
    const randomLaneIndex = Math.floor(Math.random() * lanes.length);
    const spawnX = lanes[randomLaneIndex] * laneWidth;

    // Spawn above player's normal height
    const spawnY = configSystem.get('player').normalYPosition + 0.7; // Slightly higher for visibility
    const spawnZ = playerZ - this.spawnDistanceAhead - (Math.random() * 5); // Reduced random Z variation

    // Random power-up type based on probabilities
    const rand = Math.random();
    let typeToSpawn: PowerUpType | null = null;
    let cumulativeProbability = 0;

    for (const [type, probability] of Object.entries(this.spawnProbabilities)) {
      cumulativeProbability += probability;
      if (rand <= cumulativeProbability) {
        typeToSpawn = type as PowerUpType;
        break;
      }
    }

    if (typeToSpawn) {
      const powerUpAsset = this.getPowerUpFromPool(typeToSpawn, new THREE.Vector3(spawnX, spawnY, spawnZ));
      if (powerUpAsset) {
        powerUpAsset.getMesh().visible = true; // Ensure visibility when taken from pool
        this.activeVisualPowerUps.push(powerUpAsset);
        // console.log(`PowerUpManager: Spawned ${typeToSpawn} at X:${spawnX.toFixed(1)}, Y:${spawnY.toFixed(1)}, Z:${spawnZ.toFixed(1)}`);
      }
    }

    // Reset spawn timer
    this.resetSpawnTimer();
  }

  /**
   * Resets the spawn timer with a random interval from config
   */
  private resetSpawnTimer(): void {
    const config = configSystem.getPowerUpsConfig();
    this.nextSpawnTime = config.spawnIntervalMin + Math.random() * (config.spawnIntervalMax - config.spawnIntervalMin);
    this.timeSinceLastSpawn = 0;
  }

  /**
   * Handles player collision with a power-up and activates its effect
   * @param collectedAsset The power-up asset that was collected
   */
  public onPowerUpCollected(collectedAsset: PowerUpAsset): void {
    // Check if managers are properly linked
    if (!this.playerController || !this.scoringSystem || !this.collectibleManager) {
      console.error("PowerUpManager: Essential managers not linked. Cannot apply power-up effect for", collectedAsset.getMesh().userData.subtype);
      // Still despawn the visual part
      collectedAsset.collect();
      this.returnPowerUpToPool(collectedAsset);
      return;
    }

    // Get the power-up type from userData
    const type = collectedAsset.getMesh().userData.subtype as PowerUpType;
    const config = configSystem.getPowerUpsConfig();

    // Deactivate and return the visual asset to pool
    collectedAsset.collect(); // Mark it as collected (hides it)
    this.returnPowerUpToPool(collectedAsset);

    // Remove any existing effect of the same type to reset duration
    this.activeEffects = this.activeEffects.filter(effect => {
      if (effect.type === type) {
        this.deactivateEffect(effect.type); // Deactivate previous effect if any
        return false;
      }
      return true;
    });

    // Add new effect with full duration
    const newEffect: ActivePowerUpEffect = {
      type,
      remainingDuration: config[type]?.duration || 10, // Fallback duration if missing
    };
    this.activeEffects.push(newEffect);

    // Activate effect immediately
    this.activateEffect(type);

    // Log with clear details about what each effect does
    const effectDescription = {
      'shield': 'SHIELD activated: Player is invincible!',
      'magnet': 'MAGNET activated: Attracting nearby collectibles!',
      'doublescore': 'DOUBLE SCORE activated: All points doubled!'
    }[type];

    console.log(`PowerUpManager: ${effectDescription} (Duration: ${newEffect.remainingDuration.toFixed(1)}s)`);
    console.log(`%c${type.toUpperCase()} POWER-UP ACTIVATED!`, 'background: #222; color: #bada55; font-size: 14px');
  }

  /**
   * Activates a power-up effect
   * @param type The type of power-up effect to activate
   */
  private activateEffect(type: PowerUpType): void {
    switch (type) {
      case 'shield':
        this.playerController.setPowerUpState('shield', true);
        break;
      case 'magnet':
        this.collectibleManager.setMagnetActive(true);
        break;
      case 'doublescore':
        this.scoringSystem.setScoreMultiplier(2);
        break;
    }
  }

  /**
   * Deactivates a power-up effect
   * @param type The type of power-up effect to deactivate
   */
  private deactivateEffect(type: PowerUpType): void {
    switch (type) {
      case 'shield':
        this.playerController.setPowerUpState('shield', false);
        break;
      case 'magnet':
        this.collectibleManager.setMagnetActive(false);
        break;
      case 'doublescore':
        this.scoringSystem.setScoreMultiplier(1);
        break;
    }
    console.log(`PowerUpManager: ${type.toUpperCase()} effect has expired.`);
    console.log(`%c${type.toUpperCase()} POWER-UP DEACTIVATED`, 'background: #222; color: #ff6347; font-size: 14px');
  }

  /**
   * Returns information about active effects for UI display
   * @returns Array of active power-up info for UI
   */
  public getActiveEffectsForUI(): ActivePowerUpInfo[] {
    const powerUpConfig = configSystem.getPowerUpsConfig();
    return this.activeEffects.map(effect => {
      const durationConfig = powerUpConfig[effect.type];
      const totalDuration = durationConfig?.duration || 10; // Fallback if config missing
      return {
        type: effect.type,
        remainingNormalizedTime: Math.max(0, effect.remainingDuration / totalDuration),
      };
    });
  }

  /**
   * Updates all power-ups, both visual assets and active effects
   * @param deltaTime Time since last frame in seconds
   * @param playerZ The player's current Z position
   */
  public update(deltaTime: number, playerZ: number): void {
    if (!this.playerController) return; // Managers not linked yet

    // Update time since last spawn
    this.timeSinceLastSpawn += deltaTime;
    if (this.timeSinceLastSpawn >= this.nextSpawnTime) {
      this.spawnPowerUp(playerZ);
    }

    // Update active visual power-ups (movement, animation)
    for (let i = this.activeVisualPowerUps.length - 1; i >= 0; i--) {
      const powerUpAsset = this.activeVisualPowerUps[i];

      // For Phase 1, power-ups don't need explicit movement
      // They're spawned ahead of the player and appear to move toward the player naturally
      // This line was causing power-ups to move away from the player, so we're removing it

      // Update power-up animation
      powerUpAsset.update(deltaTime);

      // Check if power-up is behind the player by sufficient distance to despawn it
      // As player moves in negative Z, power-ups will naturally appear to move in positive Z relative to player
      if (powerUpAsset.getMesh().position.z > playerZ + 15) { // Increased despawn distance
        // console.log(`PowerUpManager: Despawning ${powerUpAsset.getMesh().userData.subtype} at Z:${powerUpAsset.getMesh().position.z.toFixed(1)} (playerZ: ${playerZ.toFixed(1)})`);
        this.returnPowerUpToPool(powerUpAsset);
      }
    }

    // Update active effects timers
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];

      // Decrement duration
      effect.remainingDuration -= deltaTime;

      // Deactivate if duration is over
      if (effect.remainingDuration <= 0) {
        this.deactivateEffect(effect.type);
        this.activeEffects.splice(i, 1);
      }
    }
  }

  /**
   * Returns a list of all active power-up meshes for collision detection
   * @returns Array of THREE.Mesh objects representing active power-ups
   */
  public getActivePowerUpMeshes(): THREE.Mesh[] {
    return this.activeVisualPowerUps
      .map(p => p.getMesh())
      .filter(mesh => mesh.visible && mesh.userData.collider);
  }

  /**
   * Gets all active power-up assets
   * @returns Array of all active power-up assets
   */
  public getActivePowerUps(): PowerUpAsset[] {
    return this.activeVisualPowerUps;
  }

  /**
   * Checks if a specific power-up effect is active
   * @param type The type of power-up to check
   * @returns True if the effect is active
   */
  public isEffectActive(type: PowerUpType): boolean {
    return this.activeEffects.some(effect => effect.type === type && effect.remainingDuration > 0);
  }

  /**
   * Gets the power-up asset by its mesh (for collision system)
   * @param mesh The mesh to find the asset for
   * @returns The power-up asset or undefined if not found
   */
  public getVisualPowerUpAssetByMesh(mesh: THREE.Mesh): PowerUpAsset | undefined {
    return this.activeVisualPowerUps.find(p => p.getMesh() === mesh);
  }

  /**
   * Forces deactivation of a specific power-up effect (e.g., shield consumed by collision)
   * @param type The type of power-up effect to force deactivate
   */
  public forceDeactivateEffect(type: PowerUpType): void {
    this.activeEffects = this.activeEffects.filter(effect => {
      if (effect.type === type) {
        this.deactivateEffect(effect.type);
        return false;
      }
      return true;
    });
    console.log(`PowerUpManager: ${type} effect forcibly deactivated.`);
  }

  /**
   * Sets the current game speed (distance per second)
   * @param speed The new game speed
   */
  public setGameSpeed(speed: number): void {
    this.gameSpeed = speed;
  }

  /**
   * Resets the PowerUpManager to its initial state for game restart
   * This retains existing pooled objects but clears active ones
   */
  public reset(): void {
    // Return all active visual power-ups to their pools
    this.activeVisualPowerUps.forEach(p => this.returnPowerUpToPool(p));
    this.activeVisualPowerUps = [];

    // Deactivate all active effects
    this.activeEffects.forEach(effect => this.deactivateEffect(effect.type));
    this.activeEffects = [];

    // Reset spawn timer
    this.resetSpawnTimer();
    console.log("PowerUpManager: Reset.");
  }

  /**
   * Disposes of all power-ups and clears the pools
   * Use this when completely removing the PowerUpManager
   */
  public dispose(): void {
    // Dispose active power-ups
    this.activeVisualPowerUps.forEach(p => p.dispose());
    this.activeVisualPowerUps = [];

    // Dispose pooled power-ups
    Object.keys(this.powerUpPools).forEach(type => {
      this.powerUpPools[type as PowerUpType].forEach(p => p.dispose());
      this.powerUpPools[type as PowerUpType] = [];
    });

    // Deactivate all active effects
    this.activeEffects.forEach(effect => this.deactivateEffect(effect.type));
    this.activeEffects = [];

    console.log("PowerUpManager: Disposed.");
  }
}
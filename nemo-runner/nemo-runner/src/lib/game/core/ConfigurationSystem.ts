// src/lib/game/core/ConfigurationSystem.ts

interface GameConfig {
  player: {
    moveSpeed: number; // Units per second
    laneWidth: number; // Width of a single lane
    laneChangeDuration: number; // Duration of the lane change animation
    initialLives: number;
    jumpHeight: number; // Max height of the jump arc
    jumpDuration: number; // Time to complete one jump (up and down)
    diveDepth: number; // Max depth of the dive arc
    diveDuration: number; // Time to complete one dive (down and up)
    gravity?: number; // Optional: If using physics-based jump/dive
    normalYPosition: number; // Default Y position for the player
  };
  collisions: {
    obstacleRadiusFactor: number; // Factor to scale obstacle bounding sphere radius for collision detection
  };
  world: {
    // World-specific configs (gravity, segmentLength, etc.)
    xBoundary: number;
    laneCount: number; // Number of lanes
  };
  camera: {
    offset: { x: number; y: number; z: number };
    lookAtOffset: { x: number; y: number; z: number };
    lerpFactor: number;
  };
  collectibles: {
    spawnIntervalMin: number; // Min seconds between pattern spawns
    spawnIntervalMax: number; // Max seconds
    spawnDistanceAhead: number; // How far ahead to spawn collectibles
  }
  // Add more categories like 'difficulty', 'obstacles'
}

// Default configuration values
const defaultConfig: GameConfig = {
  player: {
    moveSpeed: 5,
    laneWidth: 2, // Example, adjust as needed
    laneChangeDuration: 0.2, // Seconds for lane change
    initialLives: 1,
    jumpHeight: 2.2, // 2.2 units above normal Y - increased for better clearance
    jumpDuration: 0.8, // 0.8 seconds for the full jump arc - increased for more hang time
    diveDepth: 1.2, // 1.2 units below normal Y - increased for better clearance
    diveDuration: 0.65, // 0.65 seconds for the full dive arc - increased for more time underwater
    normalYPosition: -0.5, // Default Y position when not jumping/diving
  },
  collisions: {
    obstacleRadiusFactor: 0.7, // Scale obstacle collision radius to 70% of visual radius
  },
  world: {
    xBoundary: 5,
    laneCount: 3,
  },
  camera: {
    offset: { x: 0, y: 2.5, z: 6 },
    lookAtOffset: { x: 0, y: 0.5, z: -10 },
    lerpFactor: 0.05,
  },
  collectibles: {
    spawnIntervalMin: 1.0, // Min seconds between pattern spawns
    spawnIntervalMax: 2.5, // Max seconds
    spawnDistanceAhead: 25, // Units ahead of player
  },
};

class ConfigurationSystem {
  private config: GameConfig;

  constructor(initialConfig?: Partial<GameConfig>) {
    // Deep merge initialConfig with defaultConfig if provided,
    // for now, just use defaultConfig.
    // A more robust system might load from JSON or allow overrides.
    this.config = { ...defaultConfig, ...initialConfig };
    console.log("ConfigurationSystem: Initialized with config:", this.config);
  }

  public get<K extends keyof GameConfig>(category: K): Readonly<GameConfig[K]> {
    return this.config[category];
  }

  // Example of getting a specific value
  public getPlayerMoveSpeed(): number {
    return this.config.player.moveSpeed;
  }

  public getPlayerLaneWidth(): number {
    return this.config.player.laneWidth;
  }

  public getWorldXBoundary(): number {
    return this.config.world.xBoundary;
  }

  public getWorldLaneCount(): number {
    return this.config.world.laneCount;
  }

  // Jump & dive getters
  public getPlayerJumpHeight(): number {
    return this.config.player.jumpHeight;
  }

  public getPlayerJumpDuration(): number {
    return this.config.player.jumpDuration;
  }

  public getPlayerDiveDepth(): number {
    return this.config.player.diveDepth;
  }

  public getPlayerDiveDuration(): number {
    return this.config.player.diveDuration;
  }

  // Collision getters
  public getObstacleRadiusFactor(): number {
    return this.config.collisions.obstacleRadiusFactor;
  }
}

// Export a singleton instance for easy access throughout the game
export const configSystem = new ConfigurationSystem(); 
// src/lib/game/core/ConfigurationSystem.ts

interface GameConfig {
  player: {
    moveSpeed: number; // Units per second
    laneWidth: number; // Width of a single lane
    laneChangeDuration: number; // Duration of the lane change animation
    initialLives: number;
    // Add more player-specific configs later (jumpHeight, diveDepth, etc.)
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
  // Add more categories like 'difficulty', 'obstacles', 'collectibles'
}

// Default configuration values
const defaultConfig: GameConfig = {
  player: {
    moveSpeed: 5,
    laneWidth: 2, // Example, adjust as needed
    laneChangeDuration: 0.2, // Seconds for lane change
    initialLives: 1,
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
}

// Export a singleton instance for easy access throughout the game
export const configSystem = new ConfigurationSystem(); 
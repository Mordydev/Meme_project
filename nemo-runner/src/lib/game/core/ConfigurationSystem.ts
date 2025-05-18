// src/lib/game/core/ConfigurationSystem.ts
import {
  GameConfig,
  defaultConfig,
  PowerUpsGameConfig,
  DifficultyGameConfig,
  LightingConfig,
  SeafloorVisualConfig,
  WaterSurfaceVisualConfig,
  VisualSettings,
  DecorationsConfig
} from '../config/gameConfig';

class ConfigurationSystem {
  private config: GameConfig;

  constructor(initialConfig?: Partial<GameConfig>) {
    this.config = {
      ...defaultConfig,
      ...initialConfig,
      // Deep merge powerUps if provided in initialConfig
      powerUps: initialConfig?.powerUps
        ? { ...defaultConfig.powerUps, ...initialConfig.powerUps }
        : { ...defaultConfig.powerUps },
      // Deep merge difficulty if provided in initialConfig
      difficulty: initialConfig?.difficulty
        ? {
            ...defaultConfig.difficulty,
            ...initialConfig.difficulty,
            tiers: initialConfig.difficulty.tiers
              ? [...initialConfig.difficulty.tiers]
              : [...defaultConfig.difficulty.tiers]
          }
        : {
            ...defaultConfig.difficulty,
            tiers: [...defaultConfig.difficulty.tiers]
          }
    };
    console.log("ConfigurationSystem: Initialized with config:", JSON.stringify(this.config));
  }

  public get<K extends keyof GameConfig>(category: K): Readonly<GameConfig[K]> {
    return this.config[category];
  }

  // Typed getter for powerUps config
  public getPowerUpsConfig(): Readonly<PowerUpsGameConfig> {
    return this.config.powerUps;
  }

  // Typed getter for difficulty config
  public getDifficultyConfig(): Readonly<DifficultyGameConfig> {
    return this.config.difficulty;
  }

  // Example of getting a specific value
  public getPlayerMoveSpeed(): number {
    return this.config.player.moveSpeed;
  }

  // Base speeds for difficulty system
  public getPlayerBaseSpeed(): number {
    return this.config.difficulty.basePlayerSpeed;
  }

  public getObstacleBaseSpawnIntervals(): { min: number, max: number } {
    return {
      min: this.config.difficulty.baseObstacleSpawnIntervalMin,
      max: this.config.difficulty.baseObstacleSpawnIntervalMax
    };
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

  public getPlayerInitialLives(): number {
    return this.config.player.initialLives;
  }

  // Collision getters
  public getObstacleRadiusFactor(): number {
    return this.config.collisions.obstacleRadiusFactor;
  }

  // Obstacles config getter
  public getObstaclesConfig(): Readonly<GameConfig['obstacles']> {
    return this.config.obstacles;
  }

  // Decorations config getter
  public getDecorationsConfig(): Readonly<GameConfig['decorations']> {
    return this.config.decorations;
  }

  // Typed getters for new config sections
  public getLightingConfig(): Readonly<LightingConfig> {
    return this.config.lighting;
  }

  public getVisualSettings(): Readonly<VisualSettings> {
    return this.config.visuals;
  }

  public getSeafloorConfig(): Readonly<SeafloorVisualConfig> {
    return this.config.visuals.seafloor;
  }

  public getWaterSurfaceConfig(): Readonly<WaterSurfaceVisualConfig> {
    return this.config.visuals.waterSurface;
  }
}

// Export a singleton instance for easy access throughout the game
export const configSystem = new ConfigurationSystem(); 
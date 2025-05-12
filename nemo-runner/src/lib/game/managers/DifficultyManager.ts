// src/lib/game/managers/DifficultyManager.ts
import * as THREE from 'three';
import { configSystem } from '../core/ConfigurationSystem';
import { DifficultyTierConfig } from '../config/gameConfig';
import { GameEngine } from '../GameEngine';

export class DifficultyManager {
  private gameEngine: GameEngine;
  private difficultyConfig = configSystem.getDifficultyConfig();
  private currentTierIndex: number = 0;
  private currentTier: DifficultyTierConfig;
  
  // For smooth transitions
  private targetPlayerSpeed: number;
  private currentPlayerSpeed: number;
  private targetObstacleSpawnIntervalMin: number;
  private currentObstacleSpawnIntervalMin: number;
  private targetObstacleSpawnIntervalMax: number;
  private currentObstacleSpawnIntervalMax: number;
  private targetComplexityFactor: number;
  private currentComplexityFactor: number;
  
  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
    
    // Initialize with tier 0 (first tier)
    this.currentTier = this.difficultyConfig.tiers[0];
    
    // Initialize current and target values
    this.currentPlayerSpeed = this.difficultyConfig.basePlayerSpeed;
    this.targetPlayerSpeed = this.currentPlayerSpeed;
    
    const baseIntervals = configSystem.getObstacleBaseSpawnIntervals();
    this.currentObstacleSpawnIntervalMin = baseIntervals.min;
    this.targetObstacleSpawnIntervalMin = baseIntervals.min;
    this.currentObstacleSpawnIntervalMax = baseIntervals.max;
    this.targetObstacleSpawnIntervalMax = baseIntervals.max;
    
    this.currentComplexityFactor = this.currentTier.obstacleComplexityFactor;
    this.targetComplexityFactor = this.currentTier.obstacleComplexityFactor;
    
    console.log("DifficultyManager: Initialized with tier 1 difficulty");
  }
  
  /**
   * Updates the difficulty based on player's distance traveled
   * @param deltaTime Time since last frame in seconds
   * @param currentDistance Current distance traveled by player
   */
  public update(deltaTime: number, currentDistance: number): void {
    // Check if we need to update the tier based on distance
    this.updateTierBasedOnDistance(currentDistance);
    
    // Smoothly transition between parameter values
    this.updateParameters(deltaTime);
    
    // Apply the current parameters to the game systems
    this.applyParameters();
  }
  
  /**
   * Checks if the player has reached a new difficulty tier
   */
  private updateTierBasedOnDistance(currentDistance: number): void {
    // Find the highest tier whose threshold the player has surpassed
    let newTierIndex = 0;
    for (let i = this.difficultyConfig.tiers.length - 1; i >= 0; i--) {
      if (currentDistance >= this.difficultyConfig.tiers[i].distanceThreshold) {
        newTierIndex = i;
        break;
      }
    }

    // If tier has changed, update the target parameters
    if (newTierIndex !== this.currentTierIndex) {
      // Store current tier index before changing
      this.currentTierIndex = newTierIndex;
      this.currentTier = this.difficultyConfig.tiers[this.currentTierIndex];

      // Create a clear visual indicator of tier change with emojis and boxed message
      const tierChangeMessage = [
        "╔═════════════════════════════════════════════════╗",
        "║                                                 ║",
        `║  🔥🔥🔥 DIFFICULTY INCREASED TO TIER ${this.currentTierIndex + 1} 🔥🔥🔥  ║`,
        "║                                                 ║",
        "╚═════════════════════════════════════════════════╝"
      ].join('\n');

      console.log(tierChangeMessage);
      console.log(`📊 STATS: Distance ${currentDistance.toFixed(1)}m`);
      console.log(`🏃 Speed: x${this.currentTier.playerSpeedMultiplier.toFixed(2)}, 🧨 Obstacle Rate: x${this.currentTier.obstacleSpawnRateMultiplier.toFixed(2)}, 🔄 Complexity: ${this.currentTier.obstacleComplexityFactor.toFixed(2)}`);
      console.log(`⚠️ Tier ${this.currentTierIndex + 1}/${this.difficultyConfig.tiers.length}: ${this.getDescriptionForTier(this.currentTierIndex)}`);

      // Update target parameters based on the new tier
      this.updateTargetParameters();
    }
  }

  /**
   * Returns a descriptive message for each tier level
   */
  private getDescriptionForTier(tierIndex: number): string {
    const descriptions = [
      "Fast from the start - increased starting speed!",
      "Picking up pace - 40% faster with more obstacles",
      "Getting challenging - 80% faster with complex patterns",
      "Serious challenge - 2.2x starting speed",
      "Hard - dense obstacle patterns at high speed",
      "Very hard - extremely complex patterns at 3.4x speed",
      "Expert - maximum difficulty, over 4x starting speed!"
    ];

    return descriptions[Math.min(tierIndex, descriptions.length - 1)];
  }
  
  /**
   * Updates target parameters based on current tier
   */
  private updateTargetParameters(): void {
    // Update player speed target
    this.targetPlayerSpeed = this.difficultyConfig.basePlayerSpeed * this.currentTier.playerSpeedMultiplier;
    
    // Update obstacle spawn rate targets
    // Higher spawn rate multiplier means shorter intervals (more frequent spawns)
    this.targetObstacleSpawnIntervalMin = this.difficultyConfig.baseObstacleSpawnIntervalMin / 
                                          this.currentTier.obstacleSpawnRateMultiplier;
    this.targetObstacleSpawnIntervalMax = this.difficultyConfig.baseObstacleSpawnIntervalMax / 
                                          this.currentTier.obstacleSpawnRateMultiplier;
    
    // Ensure min doesn't exceed max after adjustment
    if (this.targetObstacleSpawnIntervalMin > this.targetObstacleSpawnIntervalMax) {
      this.targetObstacleSpawnIntervalMin = this.targetObstacleSpawnIntervalMax * 0.8;
    }
    
    // Update complexity factor
    this.targetComplexityFactor = this.currentTier.obstacleComplexityFactor;
  }
  
  /**
   * Smoothly interpolates current parameters toward target values
   */
  private updateParameters(deltaTime: number): void {
    const transitionSpeed = this.difficultyConfig.transitionSpeed;
    const lerpAmount = Math.min(transitionSpeed * deltaTime, 1.0);
    
    // Lerp current values toward target values
    this.currentPlayerSpeed = THREE.MathUtils.lerp(
      this.currentPlayerSpeed, this.targetPlayerSpeed, lerpAmount
    );
    
    this.currentObstacleSpawnIntervalMin = THREE.MathUtils.lerp(
      this.currentObstacleSpawnIntervalMin, this.targetObstacleSpawnIntervalMin, lerpAmount
    );
    
    this.currentObstacleSpawnIntervalMax = THREE.MathUtils.lerp(
      this.currentObstacleSpawnIntervalMax, this.targetObstacleSpawnIntervalMax, lerpAmount
    );
    
    this.currentComplexityFactor = THREE.MathUtils.lerp(
      this.currentComplexityFactor, this.targetComplexityFactor, lerpAmount
    );
  }
  
  /**
   * Applies current parameters to game systems
   */
  private applyParameters(): void {
    const playerController = this.gameEngine.getPlayerController();
    const obstacleManager = this.gameEngine.getObstacleManager();
    
    if (playerController) {
      // Calculate and apply speed multiplier
      const speedMultiplier = this.currentPlayerSpeed / this.difficultyConfig.basePlayerSpeed;
      playerController.setForwardSpeedMultiplier(speedMultiplier);
    }
    
    if (obstacleManager) {
      // Apply spawn intervals
      obstacleManager.setSpawnIntervals(
        this.currentObstacleSpawnIntervalMin, 
        this.currentObstacleSpawnIntervalMax
      );
      
      // Apply complexity factor
      obstacleManager.setComplexityFactor(this.currentComplexityFactor);
    }
  }
  
  /**
   * Resets the difficulty manager to initial state
   */
  public reset(): void {
    this.currentTierIndex = 0;
    this.currentTier = this.difficultyConfig.tiers[0];
    
    // Reset to initial values
    this.currentPlayerSpeed = this.difficultyConfig.basePlayerSpeed;
    this.targetPlayerSpeed = this.currentPlayerSpeed;
    
    const baseIntervals = configSystem.getObstacleBaseSpawnIntervals();
    this.currentObstacleSpawnIntervalMin = baseIntervals.min;
    this.targetObstacleSpawnIntervalMin = baseIntervals.min;
    this.currentObstacleSpawnIntervalMax = baseIntervals.max;
    this.targetObstacleSpawnIntervalMax = baseIntervals.max;
    
    this.currentComplexityFactor = this.currentTier.obstacleComplexityFactor;
    this.targetComplexityFactor = this.currentTier.obstacleComplexityFactor;
    
    // Apply initial parameters
    this.applyParameters();
    
    console.log("DifficultyManager: Reset to tier 1 difficulty");
  }
  
  /**
   * Returns the current tier's configuration
   */
  public getCurrentTierConfig(): DifficultyTierConfig {
    return this.currentTier;
  }
  
  /**
   * Returns the current tier index (0-based)
   */
  public getCurrentTierIndex(): number {
    return this.currentTierIndex;
  }
  
  /**
   * Dispose of any resources
   */
  public dispose(): void {
    console.log("DifficultyManager: Disposed");
  }
}
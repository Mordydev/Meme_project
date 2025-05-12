// src/lib/game/managers/ScoringSystem.ts

export class ScoringSystem {
  public currentScore: number = 0;
  private onScoreUpdateCallbacks: Array<(score: number) => void> = [];

  // Distance tracking for consistent scoring
  public totalDistanceTraveled: number = 0; // Made public for difficulty scaling
  private lastDistanceMilestone: number = 0;
  private baseDistancePerPoint: number = 0.5; // Base value for distance required per point

  // Score multiplier for power-ups (Double Score)
  private scoreMultiplier: number = 1;

  constructor() {
    console.log("ScoringSystem: Initialized.");
  }

  /**
   * Sets the score multiplier for power-ups like Double Score
   * @param multiplier The multiplier to apply to score additions
   */
  public setScoreMultiplier(multiplier: number): void {
    this.scoreMultiplier = multiplier;
    console.log(`ScoringSystem: Score multiplier set to ${this.scoreMultiplier}`);
  }

  // For manual score additions (collectibles)
  public addScore(points: number): void {
    const multipliedPoints = points * this.scoreMultiplier;
    this.currentScore += multipliedPoints;

    if (this.scoreMultiplier > 1) {
      console.log(`ScoringSystem: Added ${multipliedPoints} (base: ${points}, mult: ${this.scoreMultiplier})`);
    }

    this.notifyScoreUpdate();
  }

  /**
   * Calculates distance required per point based on total distance traveled
   * Uses a smooth logarithmic scaling function that gradually increases with distance
   * This creates a more consistent progression than discrete thresholds
   */
  private calculateDistancePerPoint(distance: number): number {
    // For very early game use the base rate to give players quick early points
    if (distance < 100) {
      return this.baseDistancePerPoint;
    }

    // Logarithmic scaling provides a smooth curve that increases more slowly over time
    // 1. Start with base value
    // 2. Apply logarithmic scaling that increases as distance grows
    // 3. Cap the maximum difficulty to prevent extremely slow scoring

    // Parameters to tune the curve
    const baseValue = this.baseDistancePerPoint;
    const scaleStart = 100; // When scaling begins
    const logBase = 2.0; // Higher = gentler curve
    const scaleFactor = 0.5; // How quickly the curve grows
    const maxMultiplier = 5.0; // Cap at 5x the base rate

    // Normalize the distance (only apply scaling after scaleStart)
    const normalizedDistance = Math.max(0, distance - scaleStart);

    // Calculate the logarithmic multiplier (starts at 1.0 and grows slowly)
    const logComponent = normalizedDistance > 0
      ? Math.log(normalizedDistance / scaleStart + 1) / Math.log(logBase)
      : 0;

    // Apply scaling and ensure we don't exceed max multiplier
    const multiplier = Math.min(1 + (logComponent * scaleFactor), maxMultiplier);
    const result = baseValue * multiplier;

    return result;
  }

  /**
   * Distance-based scoring - ensures consistent 1-by-1 point increments
   * but with progressively increasing distance requirements based on player progress
   */
  public update(deltaTime: number, distanceIncrement: number): void {
    // Accumulate total distance
    this.totalDistanceTraveled += distanceIncrement;

    // Get the current distance required per point
    const currentDistancePerPoint = this.calculateDistancePerPoint(this.totalDistanceTraveled);

    // Calculate the next milestone we should be at
    const currentMilestone = Math.floor(this.totalDistanceTraveled / currentDistancePerPoint);

    // If we've reached a new milestone, add exactly one point
    if (currentMilestone > this.lastDistanceMilestone) {
      // Add points for any milestones we've passed (in case we skipped some due to large distance jumps)
      const pointsToAdd = currentMilestone - this.lastDistanceMilestone;

      // Distance points are typically not affected by score multipliers in runners
      // Add points directly, bypassing multiplier for distance
      this.currentScore += pointsToAdd;
      this.notifyScoreUpdate();

      // Enhanced debug information to track scoring progression
      const nextMilestone = (currentMilestone + 1) * currentDistancePerPoint;
      const distanceToNextPoint = nextMilestone - this.totalDistanceTraveled;

      console.log(
        `Score: +${pointsToAdd} (total: ${this.currentScore}) | ` +
        `Distance: ${this.totalDistanceTraveled.toFixed(1)} | ` +
        `Next point in: ${distanceToNextPoint.toFixed(1)} units | ` +
        `Difficulty factor: ${(currentDistancePerPoint / this.baseDistancePerPoint).toFixed(2)}x`
      );

      // Update the milestone
      this.lastDistanceMilestone = currentMilestone;
    }
  }
  
  private notifyScoreUpdate(): void {
    this.onScoreUpdateCallbacks.forEach(cb => cb(this.currentScore));
  }

  public registerScoreUpdateCallback(callback: (score: number) => void): void {
    this.onScoreUpdateCallbacks.push(callback);
    // Immediately notify with current score
    callback(this.currentScore);
  }
  
  public unregisterScoreUpdateCallback(callback: (score: number) => void): void {
    this.onScoreUpdateCallbacks = this.onScoreUpdateCallbacks.filter(cb => cb !== callback);
  }

  public reset(): void {
    this.currentScore = 0;
    this.totalDistanceTraveled = 0;
    this.lastDistanceMilestone = 0;
    this.scoreMultiplier = 1; // Reset multiplier to default
    this.notifyScoreUpdate();
    console.log("ScoringSystem: Reset.");
  }

  public dispose(): void {
    this.onScoreUpdateCallbacks = [];
    console.log("ScoringSystem: Disposed.");
  }
}
// src/lib/game/managers/ScoringSystem.ts

export class ScoringSystem {
  public currentScore: number = 0;
  private onScoreUpdateCallbacks: Array<(score: number) => void> = [];

  // Distance tracking for consistent scoring
  private totalDistanceTraveled: number = 0;
  private lastDistanceMilestone: number = 0;
  private distancePerPoint: number = 0.5; // Award 1 point per 0.5 units of distance (more frequent)

  constructor() {
    console.log("ScoringSystem: Initialized.");
  }

  // For manual score additions (collectibles)
  public addScore(points: number): void {
    this.currentScore += points;
    this.notifyScoreUpdate();
  }

  // Distance-based scoring - ensures consistent 1-by-1 point increments
  public update(deltaTime: number, distanceIncrement: number): void {
    // Accumulate total distance
    this.totalDistanceTraveled += distanceIncrement;

    // Calculate the next milestone we should be at
    const currentMilestone = Math.floor(this.totalDistanceTraveled / this.distancePerPoint);

    // If we've reached a new milestone, add exactly one point
    if (currentMilestone > this.lastDistanceMilestone) {
      // Only add 1 point per milestone crossing
      this.addScore(1);

      // Debug distance-based score increments
      console.log(`ScoringSystem: Distance milestone reached: +1 point (distance: ${this.totalDistanceTraveled.toFixed(2)})`);

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
    this.notifyScoreUpdate();
    console.log("ScoringSystem: Reset.");
  }

  public dispose(): void {
    this.onScoreUpdateCallbacks = [];
    console.log("ScoringSystem: Disposed.");
  }
}
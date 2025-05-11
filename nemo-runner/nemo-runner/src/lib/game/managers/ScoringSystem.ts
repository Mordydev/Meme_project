// src/lib/game/managers/ScoringSystem.ts

export class ScoringSystem {
  public currentScore: number = 0;
  private onScoreUpdateCallbacks: Array<(score: number) => void> = [];

  constructor() {
    console.log("ScoringSystem: Initialized.");
  }

  public addScore(points: number): void {
    this.currentScore += points;
    // console.log(`ScoringSystem: Score updated to ${this.currentScore}`);
    this.notifyScoreUpdate();
  }

  // For distance-based scoring later
  public update(deltaTime: number, distanceIncrement: number): void {
    // Example: 1 point per unit of distance
    // this.addScore(Math.floor(distanceIncrement)); 
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
    this.notifyScoreUpdate();
    console.log("ScoringSystem: Reset.");
  }

  public dispose(): void {
    this.onScoreUpdateCallbacks = [];
    console.log("ScoringSystem: Disposed.");
  }
}
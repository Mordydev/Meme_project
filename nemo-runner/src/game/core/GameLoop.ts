// Game loop manager with fixed timestep physics and variable rendering

export class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private fixedTimeStep: number;
  private running = false;
  private paused = false;
  private animationFrameId: number | null = null;
  
  private updateFn: (deltaTime: number) => void;
  private fixedUpdateFn: (timeStep: number) => void;
  private renderFn: (interpolation: number) => void;
  
  constructor(options: {
    updateFn: (deltaTime: number) => void;
    fixedUpdateFn: (timeStep: number) => void;
    renderFn: (interpolation: number) => void;
    fixedTimeStep?: number;
  }) {
    this.updateFn = options.updateFn;
    this.fixedUpdateFn = options.fixedUpdateFn;
    this.renderFn = options.renderFn;
    this.fixedTimeStep = options.fixedTimeStep || 1/60; // Default to 60fps physics
  }
  
  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now() / 1000; // Convert to seconds
    this.accumulator = 0;
    this.loop(this.lastTime);
  }
  
  pause() {
    if (!this.running || this.paused) return;
    this.paused = true;
  }
  
  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    // Reset lastTime to avoid large time delta after pause
    this.lastTime = performance.now() / 1000;
    console.log('Game loop resumed');
    
    // Force an initial update cycle to kick-start things again
    const initialDelta = 1/60; // Use a small fixed delta for the first update
    this.updateFn(initialDelta);
  }
  
  /**
   * Set the fixed time step for physics updates
   * @param timeStep New fixed time step in seconds
   */
  setFixedTimeStep(timeStep: number) {
    this.fixedTimeStep = timeStep;
  }
  
  setUpdateFn(fn: (deltaTime: number) => void) {
    this.updateFn = fn;
  }
  
  setFixedUpdateFn(fn: (timeStep: number) => void) {
    this.fixedUpdateFn = fn;
  }
  
  setRenderFn(fn: (interpolation: number) => void) {
    this.renderFn = fn;
  }
  
  stop() {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  private loop(currentTime: number) {
    if (!this.running) return;
    
    this.animationFrameId = requestAnimationFrame((time) => this.loop(time / 1000));
    
    // If paused, only continue with rendering but not game updates
    if (this.paused) {
      // Still render the scene in paused state
      this.renderFn(0);
      return;
    }
    
    // Calculate delta time in seconds
    const deltaTime = Math.min(currentTime - this.lastTime, 0.1); // Cap to 100ms to prevent huge jumps
    this.lastTime = currentTime;
    
    // Run game update (input handling, general game state)
    this.updateFn(deltaTime);
    
    // Fixed timestep physics updates
    this.accumulator += deltaTime;
    while (this.accumulator >= this.fixedTimeStep) {
      this.fixedUpdateFn(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }
    
    // Calculate interpolation factor for smooth rendering
    const interpolation = this.accumulator / this.fixedTimeStep;
    
    // Render with interpolation
    this.renderFn(interpolation);
  }
}
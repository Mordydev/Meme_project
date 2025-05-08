import eventBus from './EventSystem';

// Game state types
export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LOADING' | 'READY';

// Game state data - information stored for each state
interface GameStateData {
  score: number;
  distance: number;
  highScore: number;
  lives: number;
  powerups: {
    [key: string]: {
      active: boolean;
      remainingTime: number;
    };
  };
  environment: {
    current: string;
    transitionProgress?: number;
  };
  level: number;
  difficulty: number;
}

// Persistent data that will be saved between game sessions
interface SavedGameData {
  highScore: number;
  unlockedEnvironments: string[];
  unlockedCharacters: string[];
  settings: {
    sound: boolean;
    music: boolean;
    quality: 'low' | 'medium' | 'high';
    controls: 'touch' | 'tilt' | 'keyboard';
  };
}

/**
 * GameStateManager - Manages game state and transitions
 * 
 * This class handles:
 * - Game state transitions (menu, playing, paused, game over)
 * - Persistence of game data
 * - Loading and saving game state
 * - Game progression and difficulty scaling
 */
export class GameStateManager {
  private _state: GameState = 'MENU';
  private _previousState: GameState = 'MENU';
  private _stateData: GameStateData;
  private _savedData: SavedGameData;
  private _transitionCallbacks: Map<string, (() => void)[]> = new Map();

  constructor() {
    // Initialize game state data with defaults
    this._stateData = {
      score: 0,
      distance: 0,
      highScore: 0,
      lives: 3,
      powerups: {},
      environment: {
        current: 'reef',
      },
      level: 1,
      difficulty: 1,
    };

    // Initialize saved data with defaults
    this._savedData = {
      highScore: 0,
      unlockedEnvironments: ['reef'],
      unlockedCharacters: ['clownfish'],
      settings: {
        sound: true,
        music: true,
        quality: 'medium',
        controls: 'touch',
      },
    };

    // Load saved data if available
    this.loadSavedData();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Get current game state
   */
  get state(): GameState {
    return this._state;
  }

  /**
   * Get current game state data
   */
  get stateData(): Readonly<GameStateData> {
    return this._stateData;
  }

  /**
   * Get saved game data
   */
  get savedData(): Readonly<SavedGameData> {
    return this._savedData;
  }

  /**
   * Update game settings
   */
  updateSettings(settings: Partial<SavedGameData['settings']>) {
    this._savedData.settings = {
      ...this._savedData.settings,
      ...settings,
    };
    
    // Save settings immediately
    this.saveGameData();
    
    // Emit settings change event
    eventBus.emit('settings-changed', this._savedData.settings);
  }

  /**
   * Transition to a new game state
   */
  setState(newState: GameState): void {
    // Log the state transition attempt
    console.log(`GameStateManager: Attempting state change ${this._state} -> ${newState}`);

    if (newState === this._state) {
      console.log('GameStateManager: State already set to', newState);
      // ** FIX: Remove redundant event emissions here **
      // Re-emitting events on same-state transitions can cause issues
      return;
    }

    this._previousState = this._state;
    this.executeTransitionCallbacks(`${this._state}-exit`);
    this._state = newState;
    this.executeTransitionCallbacks(`${newState}-enter`);

    const eventData = {
      from: this._previousState,
      to: newState,
      data: this._stateData, // Send current game data with the event
      timestamp: Date.now(),
    };
    console.log('GameStateManager: Emitting game-state-change event', eventData);
    eventBus.emit('game-state-change', eventData);

    // Handle state-specific actions AFTER emitting the event
    this.handleStateSpecifics(newState);
  }

  /**
   * Register callback for state transitions
   */
  onTransition(transitionKey: string, callback: () => void): void {
    if (!this._transitionCallbacks.has(transitionKey)) {
      this._transitionCallbacks.set(transitionKey, []);
    }
    this._transitionCallbacks.get(transitionKey)?.push(callback);
  }

  /**
   * Start a new game
   * Now transitions to READY state, letting GameStartController manage the countdown.
   */
  startGame(): void {
    console.log('GameStateManager: startGame called, transitioning to READY. Current state:', this._state);
    // Only proceed if in MENU or GAME_OVER state
    if (this._state !== 'MENU' && this._state !== 'GAME_OVER') {
        console.warn(`GameStateManager: startGame called in invalid state: ${this._state}`);
        return;
    }

    // Reset game state data
    this._stateData.score = 0;
    this._stateData.distance = 0;
    this._stateData.lives = 3;
    this._stateData.powerups = {};
    this._stateData.level = 1;
    this._stateData.difficulty = 1;
    // Reset high score from saved data
    this._stateData.highScore = this._savedData.highScore;

    // *** CHANGE: Transition to READY, not PLAYING directly ***
    this.setState('READY');
  }

  /**
   * Pause the game
   */
  pauseGame(): void {
    if (this._state !== 'PLAYING') return;
    this.setState('PAUSED');
  }

  /**
   * Resume the game
   */
  resumeGame(): void {
    if (this._state !== 'PAUSED') return;
    this.setState('PLAYING');
  }

  /**
   * End the game
   */
  endGame(): void {
    this.setState('GAME_OVER');
    
    // Check for high score
    if (this._stateData.score > this._savedData.highScore) {
      this._savedData.highScore = this._stateData.score;
      this._stateData.highScore = this._stateData.score;
      this.saveGameData();
      eventBus.emit('new-high-score', this._stateData.score);
    }
  }

  /**
   * Update score
   */
  updateScore(points: number): void {
    this._stateData.score += points;
    
    // Log for debugging
    console.log('Updating score by', points, 'new score:', this._stateData.score);
    
    // Emit score change event
    eventBus.emit('score-change', this._stateData.score);
    
    // Update high score if needed
    if (this._stateData.score > this._stateData.highScore) {
      this._stateData.highScore = this._stateData.score;
    }
  }

  /**
   * Update distance and add distance-based points to score
   */
  updateDistance(delta: number): void {
    const prevDistance = this._stateData.distance;
    this._stateData.distance += delta;
    const distanceFloor = Math.floor(this._stateData.distance);
    
    // Log for debugging
    console.log('Distance updated:', delta, 'New distance:', this._stateData.distance);
    
    // Emit distance change event
    eventBus.emit('distance-change', distanceFloor);
    
    // Add points based on distance traveled (1 point per meter)
    // Only add points when we cross a full meter threshold
    const prevDistanceFloor = Math.floor(prevDistance);
    if (distanceFloor > prevDistanceFloor) {
      // Calculate points for new distance traveled (1 point per meter)
      const pointsToAdd = distanceFloor - prevDistanceFloor;
      console.log('Adding points from distance:', pointsToAdd);
      this.updateScore(pointsToAdd);
    }
    
    // Update difficulty based on distance
    this.updateDifficulty();
  }

  /**
   * Handle player hit obstacle
   */
  playerHit(): void {
    if (this._state !== 'PLAYING') return;
    
    // Check for active shield powerup
    if (this._stateData.powerups['shield']?.active) {
      // Shield absorbs hit
      eventBus.emit('shield-hit');
      delete this._stateData.powerups['shield'];
      return;
    }
    
    // Reduce lives
    this._stateData.lives--;
    eventBus.emit('life-lost', this._stateData.lives);
    
    // Check for game over
    if (this._stateData.lives <= 0) {
      this.endGame();
    }
  }

  /**
   * Activate powerup
   */
  activatePowerup(type: string, duration: number): void {
    this._stateData.powerups[type] = {
      active: true,
      remainingTime: duration,
    };
    
    eventBus.emit('powerup-activated', {
      type,
      duration,
    });
  }

  /**
   * Deactivate powerup
   */
  deactivatePowerup(type: string): void {
    if (this._stateData.powerups[type]) {
      this._stateData.powerups[type].active = false;
      eventBus.emit('powerup-deactivated', { type });
    }
  }

  /**
   * Update powerups
   */
  updatePowerups(deltaTime: number): void {
    Object.entries(this._stateData.powerups).forEach(([type, data]) => {
      if (data.active) {
        data.remainingTime -= deltaTime;
        
        if (data.remainingTime <= 0) {
          this.deactivatePowerup(type);
        }
      }
    });
  }

  /**
   * Update difficulty based on current distance
   */
  private updateDifficulty(): void {
    // Base difficulty on distance traveled
    const newDifficulty = 1 + Math.floor(this._stateData.distance / 500) * 0.25;
    
    if (newDifficulty !== this._stateData.difficulty) {
      this._stateData.difficulty = newDifficulty;
      eventBus.emit('difficulty-change', this._stateData.difficulty);
    }
    
    // Update level based on distance milestones
    const newLevel = 1 + Math.floor(this._stateData.distance / 1000);
    
    if (newLevel !== this._stateData.level) {
      this._stateData.level = newLevel;
      eventBus.emit('level-change', this._stateData.level);
    }
  }

  /**
   * Handle state-specific actions
   */
  private handleStateSpecifics(state: GameState): void {
    console.log(`GameStateManager: Handling specifics for state: ${state}`);
    switch (state) {
      case 'PLAYING':
        // *** FIX: Emit 'game-start-movement' event upon entering PLAYING state ***
        console.log('GameStateManager: Emitting game-start-movement from handleStateSpecifics for PLAYING state');
        eventBus.emit('game-start-movement', {
          startTime: Date.now(),
          source: 'GameStateManager.handleStateSpecifics',
          gameState: 'PLAYING'
        });
        break;
      // ... (other cases remain the same) ...
       case 'MENU':
        // Potentially load latest saved game or reset score display
        this._stateData.score = 0; // Reset score when returning to menu
        this._stateData.distance = 0;
        eventBus.emit('score-change', 0); // Notify UI
        eventBus.emit('distance-change', 0); // Notify UI
        break;

      case 'GAME_OVER':
        // Record stats, prepare end-of-game summary
         // Check for high score
        if (this._stateData.score > this._savedData.highScore) {
          this._savedData.highScore = this._stateData.score;
          this._stateData.highScore = this._stateData.score; // Update current state data too
          this.saveGameData();
          eventBus.emit('new-high-score', this._stateData.score);
          console.log(`GameStateManager: New high score set: ${this._stateData.score}`);
        }
        break;
      // ... other cases
    }
  }

  /**
   * Execute transition callbacks
   */
  private executeTransitionCallbacks(key: string): void {
    const callbacks = this._transitionCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }

   private setupEventListeners(): void {
    // Listen for powerup collection
    eventBus.on('powerup-collected', (data: { type: string; duration: number }) => {
      this.activatePowerup(data.type, data.duration);
    });

    // Listen for player hits
    eventBus.on('player-hit', () => {
      this.playerHit();
    });

    // Listen for collectible collection points
    eventBus.on('collect', (data: { type: string, points?: number }) => {
      // Check if points exist before adding
      if (data.points && typeof data.points === 'number') {
        this.updateScore(data.points);
      } else if (data.type === 'bubble') {
        // Default points for bubble if not specified
        this.updateScore(10);
      }
    });

    // Listen for game update to update powerups
    eventBus.on('game-update', (deltaTime: number) => {
      if (this._state === 'PLAYING') {
        this.updatePowerups(deltaTime);
      }
    });

    // Remove listeners for game-start, game-pause, game-resume, game-restart
    // These should now be handled by direct calls to GameStateManager methods
    // or through UI interactions triggering GameStartController
    eventBus.off('game-start');
    eventBus.off('game-pause');
    eventBus.off('game-resume');
    eventBus.off('game-restart');
  }

  /**
   * Load saved game data from localStorage
   */
  private loadSavedData(): void {
    try {
      // Check if localStorage is available (not in SSR/server environment)
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedData = localStorage.getItem('nemo-runner-save');
        if (savedData) {
          const parsedData = JSON.parse(savedData) as SavedGameData;
          this._savedData = {
            ...this._savedData,
            ...parsedData,
          };
          this._stateData.highScore = this._savedData.highScore;
        }
      }
    } catch (error) {
      console.error('Failed to load saved game data:', error);
    }
  }

  /**
   * Save game data to localStorage
   */
  private saveGameData(): void {
    try {
      // Check if localStorage is available (not in SSR/server environment)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('nemo-runner-save', JSON.stringify(this._savedData));
      }
    } catch (error) {
      console.error('Failed to save game data:', error);
    }
  }
}

// Create and export singleton instance
const gameStateManager = new GameStateManager();
export default gameStateManager;
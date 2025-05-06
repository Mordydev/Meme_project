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
    if (newState === this._state) return;

    // Store previous state for potential returns
    this._previousState = this._state;
    
    // Execute 'before exit' callbacks for current state
    this.executeTransitionCallbacks(`${this._state}-exit`);
    
    // Change state
    this._state = newState;
    
    // Execute 'on enter' callbacks for new state
    this.executeTransitionCallbacks(`${newState}-enter`);
    
    // Emit state change event
    eventBus.emit('game-state-change', {
      from: this._previousState,
      to: newState,
      data: this._stateData,
    });

    // Special state handling
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
   */
  startGame(): void {
    // Reset game state data
    this._stateData.score = 0;
    this._stateData.distance = 0;
    this._stateData.lives = 3;
    this._stateData.powerups = {};
    this._stateData.level = 1;
    this._stateData.difficulty = 1;
    
    // Transition to ready state
    this.setState('READY');
    
    // After brief countdown, transition to playing
    setTimeout(() => {
      this.setState('PLAYING');
    }, 3000);
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
    eventBus.emit('score-change', this._stateData.score);
    
    // Update high score if needed
    if (this._stateData.score > this._stateData.highScore) {
      this._stateData.highScore = this._stateData.score;
    }
  }

  /**
   * Update distance
   */
  updateDistance(delta: number): void {
    this._stateData.distance += delta;
    eventBus.emit('distance-change', Math.floor(this._stateData.distance));
    
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
    switch (state) {
      case 'MENU':
        // Potentially load latest saved game
        break;
        
      case 'PLAYING':
        // Maybe start game timer or gameplay music
        break;
        
      case 'PAUSED':
        // Maybe pause physics/animations
        break;
        
      case 'GAME_OVER':
        // Record stats, prepare end-of-game summary
        break;
        
      case 'LOADING':
        // Show loading indicator, preload assets
        break;
        
      case 'READY':
        // Show countdown or get-ready message
        break;
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

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for powerup collection
    eventBus.on('powerup-collected', (data: { type: string; duration: number }) => {
      this.activatePowerup(data.type, data.duration);
    });
    
    // Listen for player hits
    eventBus.on('player-hit', () => {
      this.playerHit();
    });
    
    // Listen for collectible collection
    eventBus.on('collect', (data: { type: string, points: number }) => {
      this.updateScore(data.points);
    });
    
    // Listen for game update to update powerups
    eventBus.on('game-update', (deltaTime: number) => {
      if (this._state === 'PLAYING') {
        this.updatePowerups(deltaTime);
      }
    });
    
    // Listen for explicit game control events
    eventBus.on('game-start', () => {
      this.startGame();
    });
    
    eventBus.on('game-pause', () => {
      this.pauseGame();
    });
    
    eventBus.on('game-resume', () => {
      this.resumeGame();
    });
    
    eventBus.on('game-restart', () => {
      this.startGame();
    });
  }

  /**
   * Load saved game data from localStorage
   */
  private loadSavedData(): void {
    try {
      const savedData = localStorage.getItem('nemo-runner-save');
      if (savedData) {
        const parsedData = JSON.parse(savedData) as SavedGameData;
        this._savedData = {
          ...this._savedData,
          ...parsedData,
        };
        this._stateData.highScore = this._savedData.highScore;
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
      localStorage.setItem('nemo-runner-save', JSON.stringify(this._savedData));
    } catch (error) {
      console.error('Failed to save game data:', error);
    }
  }
}

// Create and export singleton instance
const gameStateManager = new GameStateManager();
export default gameStateManager;
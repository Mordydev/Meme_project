# NEMO Runner System Patterns

## System Architecture

### Application Layers
1. **Presentation Layer**
   - Next.js App Router framework for client and server components
   - Three.js rendering engine for game visualization
   - React components for UI elements and menus
   - CSS modules for styling with Tailwind utility classes

2. **Game Engine Layer**
   - Core game loop with requestAnimationFrame
   - Physics and collision detection systems
   - Input handler for keyboard and touch controls
   - Object pooling for performance optimization
   - Animation system for character and environment

3. **State Management Layer**
   - Game state machine (menu, playing, paused, game over)
   - Player state tracking (position, power-ups, score)
   - Obstacle and collectible management
   - Progression and difficulty scaling

4. **Data Layer**
   - Clerk for authentication and user management
   - Supabase/Neon PostgreSQL for persistent data storage
   - Leaderboard services with caching strategies
   - Game usage limits and tracking

5. **Asset Management Layer**
   - Vercel Blob storage for media assets
   - Dynamic loading based on device capabilities
   - Asset optimization for performance

### Communication Flow
```
User Input → Input Handler → Game State → Physics/Collision → Rendering → Display
                                ↓                 ↑
                        Game Logic/Rules ←→ Object Management
                                ↓                 ↑
                       Score/Progress → Leaderboard Service → Database
```

## Design Patterns

### Component Architecture

#### Game Core Components
1. **GameManager**: Orchestrates overall game flow and state transitions
   ```typescript
   class GameManager {
     private currentState: GameState;
     private player: Player;
     private obstacleManager: ObstacleManager;
     private collectibleManager: CollectibleManager;
     private scoreManager: ScoreManager;
     
     public update(deltaTime: number): void;
     public changeState(newState: GameState): void;
     public handleInput(input: InputEvent): void;
     public reset(): void;
   }
   ```

2. **Player**: Manages player character state and movement
   ```typescript
   class Player {
     private position: Vector3;
     private velocity: Vector3;
     private activePowerUps: PowerUp[];
     
     public update(deltaTime: number): void;
     public move(direction: Direction): void;
     public applyPowerUp(powerUp: PowerUp): void;
     public checkCollision(obstacles: Obstacle[]): boolean;
   }
   ```

3. **ObstacleManager**: Handles obstacle generation and lifecycle
   ```typescript
   class ObstacleManager {
     private obstacles: Obstacle[];
     private obstaclePool: ObjectPool<Obstacle>;
     private difficultyLevel: number;
     
     public update(deltaTime: number, playerPosition: Vector3): void;
     public generateObstacles(difficultyLevel: number): void;
     public recycleOffscreenObstacles(): void;
     public getActiveObstacles(): Obstacle[];
   }
   ```

4. **CollectibleManager**: Manages collectibles and power-ups
   ```typescript
   class CollectibleManager {
     private collectibles: Collectible[];
     private collectiblePool: ObjectPool<Collectible>;
     
     public update(deltaTime: number, playerPosition: Vector3): void;
     public generateCollectibles(patternType: PatternType): void;
     public checkCollections(playerPosition: Vector3): Collectible[];
     public recycleOffscreenCollectibles(): void;
   }
   ```

5. **ScoreManager**: Handles scoring logic and multipliers
   ```typescript
   class ScoreManager {
     private currentScore: number;
     private multiplier: number;
     private distance: number;
     
     public update(deltaTime: number): void;
     public addPoints(points: number): void;
     public applyMultiplier(multiplier: number, duration: number): void;
     public recordNearMiss(): void;
     public getFinalScore(): ScoreData;
   }
   ```

#### UI Components
1. **GameUI**: Manages in-game HUD elements
   ```typescript
   class GameUI {
     private scoreDisplay: ScoreDisplay;
     private powerUpIndicators: PowerUpIndicator[];
     private distanceIndicator: DistanceIndicator;
     
     public update(gameState: GameState): void;
     public showMessage(message: string, duration: number): void;
     public updatePowerUpStatus(activePowerUps: PowerUp[]): void;
   }
   ```

2. **MenuSystem**: Handles game menus and transitions
   ```typescript
   class MenuSystem {
     private menuStack: Menu[];
     
     public pushMenu(menu: Menu): void;
     public popMenu(): Menu;
     public showMainMenu(): void;
     public showPauseMenu(): void;
     public showGameOverMenu(score: ScoreData): void;
   }
   ```

3. **LeaderboardDisplay**: Visualizes leaderboard data
   ```typescript
   class LeaderboardDisplay {
     private leaderboardData: LeaderboardEntry[];
     private timeFrame: TimeFrame;
     private userRank: number;
     
     public loadLeaderboard(timeFrame: TimeFrame): Promise<void>;
     public highlightUserScore(): void;
     public switchTimeFrame(newTimeFrame: TimeFrame): void;
   }
   ```

### Object Pooling Pattern
```typescript
class ObjectPool<T> {
  private pool: T[];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  
  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = Array(initialSize).fill(null).map(() => this.createFn());
  }
  
  public get(): T {
    if (this.pool.length === 0) {
      return this.createFn();
    }
    return this.pool.pop()!;
  }
  
  public release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}
```

### State Machine Pattern
```typescript
interface GameState {
  enter(game: GameManager): void;
  update(game: GameManager, deltaTime: number): void;
  exit(game: GameManager): void;
  handleInput(game: GameManager, input: InputEvent): void;
}

class PlayingState implements GameState {
  enter(game: GameManager): void {
    // Initialize gameplay elements
  }
  
  update(game: GameManager, deltaTime: number): void {
    // Update game entities
    // Check for collisions
    // Update score
  }
  
  exit(game: GameManager): void {
    // Clean up resources
  }
  
  handleInput(game: GameManager, input: InputEvent): void {
    // Process player input during gameplay
  }
}

// Similar implementations for MenuState, PausedState, GameOverState
```

### Observer Pattern (for Events)
```typescript
type EventCallback = (data: any) => void;

class EventSystem {
  private listeners: Map<string, EventCallback[]> = new Map();
  
  public subscribe(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  public unsubscribe(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
  
  public emit(event: string, data?: any): void {
    if (!this.listeners.has(event)) return;
    
    for (const callback of this.listeners.get(event)!) {
      callback(data);
    }
  }
}

// Usage example
const events = new EventSystem();
events.subscribe('collision', (data) => {
  // Handle collision
});
events.emit('collision', { object: 'obstacle', position: [10, 0, 5] });
```

## Code Organization

### Directory Structure
```
/nemo-runner
  /app                     # Next.js App Router structure
    /api                   # API routes
      /leaderboard
      /auth
      /score
    /game                  # Game page
    /leaderboard           # Leaderboard page
    /profile               # User profile page
    layout.tsx             # Root layout
    page.tsx               # Home page
  /components              # React components
    /game                  # Game-specific components
    /ui                    # Reusable UI components
    /leaderboard           # Leaderboard components
  /lib                     # Shared utilities and hooks
    /game-engine           # Core game engine
    /auth                  # Authentication utilities
    /db                    # Database utilities
  /public                  # Static assets
    /models                # 3D models
    /textures              # Texture assets
    /audio                 # Sound effects and music
  /styles                  # Global styles
  /types                   # TypeScript type definitions
```

### File Naming Conventions
- React components: PascalCase (e.g., `GameCanvas.tsx`)
- Utilities and hooks: camelCase (e.g., `useGameState.ts`)
- Types and interfaces: PascalCase with descriptive names (e.g., `ObstacleType.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `GAME_CONSTANTS.ts`)
- API routes: kebab-case (e.g., `/api/leaderboard/daily`)

## Refactoring History
This section will be populated as development progresses and refactoring occurs.

## Optimization Strategies

### Rendering Optimizations
1. Object pooling for frequently created/destroyed entities
2. Level-of-Detail (LOD) management for 3D models
3. Occlusion culling to avoid rendering off-screen objects
4. Instanced rendering for repeated objects
5. Frame rate limiting based on device capabilities
6. Texture atlasing to reduce draw calls

### Performance Monitoring
1. FPS counter to track rendering performance
2. Memory usage monitoring to detect leaks
3. Frame timing analysis to identify bottlenecks
4. Input latency measurement for control responsiveness

### Mobile Optimizations
1. Reduced particle effects on lower-end devices
2. Dynamic resolution scaling based on performance
3. Simplified shaders for mobile GPUs
4. Touch input optimization with configurable sensitivity
5. Battery usage considerations (reduced update frequency when appropriate)
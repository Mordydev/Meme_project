# $NEMO Runner System Patterns

## System Architecture

The NEMO Runner game follows a modern, component-based architecture optimized for web-based 3D gaming experiences:

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Application                     │
├────────────────┬─────────────────────┬─────────────────────┐│
│   Game Engine  │  UI/UX Components   │ Server Components   ││
│   (Three.js)   │  (React/Next.js)    │  (API Routes)       ││
├────────────────┴─────────────────────┴─────────────────────┤│
│                    Authentication (Clerk)                   ││
├─────────────────────────────────────────────────────────────┤│
│                 Database (Neon PostgreSQL)                  ││
└─────────────────────────────────────────────────────────────┘
```

### Core Components
1. **Game Engine Layer**
   - Rendering core (Three.js)
   - Physics and collision system
   - Input management
   - Audio system (adaptive sound effects and music)
   - Asset management

2. **Game Logic Layer**
   - Character controller
   - Obstacle management
   - Collectible & power-up system
   - Game state management
   - Scoring mechanism
   - Procedural environment generation

3. **UI Layer**
   - Game HUD
   - Menus and navigation
   - Leaderboards
   - Player profile

## Design Patterns

### State Management
The game uses a centralized state management system to handle game flow and data persistence:

```typescript
// Game state types
export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LOADING' | 'READY';

// GameStateManager class (singleton)
export class GameStateManager {
  private _state: GameState = 'MENU';
  private _previousState: GameState = 'MENU';
  private _stateData: GameStateData;
  private _savedData: SavedGameData;
  private _transitionCallbacks: Map<string, (() => void)[]> = new Map();

  // State transitions with event emission
  setState(newState: GameState): void {
    // Store previous state for potential returns
    this._previousState = this._state;
    
    // Execute transition callbacks
    this.executeTransitionCallbacks(`${this._state}-exit`);
    
    // Change state
    this._state = newState;
    
    // Execute new state callbacks
    this.executeTransitionCallbacks(`${newState}-enter`);
    
    // Emit event for UI components
    eventBus.emit('game-state-change', {
      from: this._previousState,
      to: newState,
      data: this._stateData,
    });
  }

  // Additional methods for game control, data tracking, etc.
}
```

Key features:
- State machine with defined states and transitions
- Event-based notification system for UI updates
- Persistent data storage for scores and settings
- Lifecycle hooks for state transitions (enter/exit)
- Integration with browser localStorage for persistence

### Component-Based Entity System

Core game entities are built using a component-based approach for flexibility:

```typescript
// Character component
export class Character {
  public mesh: THREE.Group;
  public collider: SphereCollider;
  private state: CharacterState;
  private animations: Map<string, AnimationClip>;
  
  update(deltaTime: number, input: InputState): void {
    // Update based on current state
    switch (this.state) {
      case 'swimming':
        this.updateSwimming(deltaTime, input);
        break;
      case 'jumping':
        this.updateJumping(deltaTime);
        break;
      // Other states...
    }
    
    // Update animations
    this.updateAnimations(deltaTime);
    
    // Update collider position
    this.updateCollider();
  }
  
  // State-specific update methods
  private updateSwimming(deltaTime: number, input: InputState): void {
    // Implementation...
  }
  
  // Other methods...
}
```

Advantages:
- Clear separation of concerns
- Simplified unit testing
- Easy extension with new behaviors
- Reusable components across entities

### Object Pooling

For performance optimization, especially critical on mobile devices:

```typescript
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFunc: () => T;
  private resetFunc: (obj: T) => void;
  
  constructor(
    createFunc: () => T,
    resetFunc: (obj: T) => void,
    initialSize: number = 0
  ) {
    this.createFunc = createFunc;
    this.resetFunc = resetFunc;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFunc());
    }
  }
  
  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    
    return this.createFunc();
  }
  
  release(obj: T): void {
    this.resetFunc(obj);
    this.pool.push(obj);
  }
}
```

Used for:
- Obstacles that appear and disappear frequently
- Collectibles like bubbles
- Particle effects
- Environment segments

### Event-Driven Communication

Using a pub/sub pattern for loose coupling between systems:

```typescript
// Global event bus
const eventBus = {
  listeners: {} as Record<string, Function[]>,
  
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  
  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },
  
  emit(event: string, data?: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
};
```

Benefits:
- Decoupled systems can communicate without direct dependencies
- Easy to add new listeners without modifying existing code
- Centralized event management
- Simplified debugging with event logging

### Pattern-Based Generation

For obstacles and collectibles, a pattern-based approach provides structure and variety:

```typescript
// Example pattern definition for collectibles
defineBubblePattern(basePosition: THREE.Vector3, difficulty: number): CollectibleSpawnData[] {
  const count = 5 + Math.floor(difficulty * 5); // 5-10 bubbles based on difficulty
  const spacing = 1.0;
  const result: CollectibleSpawnData[] = [];
  
  for (let i = 0; i < count; i++) {
    result.push({
      type: CollectibleType.BUBBLE,
      position: new THREE.Vector3(
        basePosition.x,
        basePosition.y,
        basePosition.z + i * spacing
      )
    });
  }
  
  return result;
}
```

### Audio System

The game uses a centralized audio management system with adaptive audio based on game state:

```typescript
export class AudioManager {
  private static instance: AudioManager;
  
  private eventSystem: EventSystem;
  private assetManager: AssetManager;
  
  // Three.js audio components
  private listener: THREE.AudioListener;
  private backgroundMusic: THREE.Audio;
  private soundEffects: Map<string, THREE.Audio>;
  
  // Audio settings with localStorage persistence
  private settings: AudioSettings = {
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true
  };
  
  // State tracking
  private initialized: boolean = false;
  
  // Singleton pattern
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  // Initialize with camera for spatial audio
  public async initialize(camera: THREE.Camera): Promise<void> {
    if (this.initialized) return;
    
    // Create audio listener and attach to camera
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    
    // Initialize background music
    this.backgroundMusic = new THREE.Audio(this.listener);
    
    // Load saved settings from localStorage
    this.loadSettings();
    
    // Set up event listeners for game events
    this.setupEventListeners();
    
    this.initialized = true;
  }
  
  // Event-based audio triggers
  private setupEventListeners(): void {
    // Game state changes trigger appropriate sounds
    this.eventSystem.on('game-state-change', (data) => {
      const { to } = data;
      
      if (to === 'MENU') {
        this.playBackgroundMusic();
      } else if (to === 'PLAYING') {
        this.playSoundEffect('game-start');
      } else if (to === 'GAME_OVER') {
        this.playSoundEffect('game-over');
      }
    });
    
    // Gameplay events trigger sound effects
    this.eventSystem.on('collectible-collected', () => {
      this.playSoundEffect('collect');
    });
    
    this.eventSystem.on('player-collision', () => {
      this.playSoundEffect('collision');
    });
    
    this.eventSystem.on('powerup-activated', (data) => {
      this.playSoundEffect(`${data.type}-activate`);
    });
  }
}
```

Pattern types include:
- Line (straight path)
- Curve (arc pattern)
- Zigzag (alternating direction)
- Circle (loop formation)
- Wave (sinusoidal path)
- Random (controlled randomness)

### Shader-Based Rendering
Custom shaders are used for high-quality visual effects:
- Bubble transparency and edge glow with fresnel effect
- Power-up pulsating glow and energy effects
- Water caustics (planned for environment)
- Fish skin/scales with realistic lighting

Example from bubble shader:
```glsl
// Bubble vertex shader
attribute float aVisible;
attribute float aOffset;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vFresnelFactor;
varying float vVisibility;

void main() {
  // Only proceed if bubble is visible
  vVisibility = aVisible;
  
  // Transform position
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Calculate view position for fresnel
  vViewPosition = -mvPosition.xyz;
  
  // Pass normal to fragment shader
  vNormal = normalize(normalMatrix * normal);
  
  // Calculate fresnel factor
  vec3 viewDir = normalize(vViewPosition);
  vFresnelFactor = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
}
```

### Procedural Environment Generation

Segment-based procedural generation for the underwater environment:

```typescript
export class ProceduralEnvironment {
  private segments: EnvironmentSegment[] = [];
  private activePool: ObjectPool<EnvironmentSegment>;
  private segmentLength: number = 50;
  private visibleSegments: number = 3;
  
  generateSegment(position: THREE.Vector3, type: EnvironmentType): EnvironmentSegment {
    const segment = this.activePool.get();
    
    // Configure segment based on type
    switch (type) {
      case 'reef':
        this.configureReefSegment(segment);
        break;
      case 'openOcean':
        this.configureOpenOceanSegment(segment);
        break;
      case 'deepSea':
        this.configureDeepSeaSegment(segment);
        break;
    }
    
    segment.position.copy(position);
    segment.visible = true;
    
    return segment;
  }
  
  update(playerPosition: THREE.Vector3): void {
    // Calculate which segments should be visible
    const currentSegmentIndex = Math.floor(playerPosition.z / this.segmentLength);
    
    // Generate new segments ahead
    while (this.segments.length <= currentSegmentIndex + this.visibleSegments) {
      const position = new THREE.Vector3(
        0,
        0,
        this.segments.length * this.segmentLength
      );
      
      // Determine environment type based on distance
      const type = this.determineEnvironmentType(position.z);
      
      // Generate and add segment
      const segment = this.generateSegment(position, type);
      this.segments.push(segment);
    }
    
    // Recycle segments behind player
    while (this.segments.length > 0 && 
           this.segments[0].position.z < playerPosition.z - this.segmentLength) {
      const segment = this.segments.shift();
      if (segment) {
        this.activePool.release(segment);
      }
    }
  }
  
  // Other methods...
}
```

Key aspects:
- Segment pooling for memory efficiency
- Distance-based environment type transitions
- Procedural decoration placement within segments
- Dynamic level of detail based on device capabilities

## Refactoring History

### Input Handling Refinement
- **Before**: Direct DOM event binding in game engine
- **After**: Abstracted InputHandler with device detection
- **Reason**: Improve cross-device compatibility and testing

### Collision System Optimization
- **Before**: Full O(n²) collision checks between all objects
- **After**: Spatial partitioning with grid-based optimization
- **Reason**: Performance improvements for scenes with many objects

### Render Pipeline Enhancements
- **Before**: Static render quality settings
- **After**: Dynamic quality based on device capabilities
- **Reason**: Support wider range of devices with appropriate visual quality

### Game State Management Evolution
- **Before**: Multiple boolean flags for game state
- **After**: Centralized state machine with transitions and persistence
- **Reason**: Improved code organization and more robust state handling

## Future Architecture Considerations

1. **ECS Integration**
   - Consider transitioning to a full Entity Component System for better performance with numerous entities
   - Evaluate Three.js compatible ECS libraries (e.g., Ecsy, Bit-ECS)

2. **WebGPU Preparation**
   - Research compatibility layer for WebGPU when browser support improves
   - Prepare shaders for potential cross-compilation

3. **Multi-threading**
   - Investigate Web Workers for physics and procedural generation
   - Separate rendering from computation for better performance

4. **Modular Game Modes**
   - Design architecture to support additional game modes beyond endless runner
   - Create abstraction layer for game rules and mechanics
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

Segment-based procedural generation for the underwater environment with advanced optimizations and visual effects:

```typescript
export class ProceduralEnvironment {
  private segments: EnvironmentSegment[] = [];
  private segmentLength: number = 100;
  private visibleSegments: number = 3;
  private maxSegments: number = 10; // Maximum number of segments to keep in memory
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraViewMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private currentTheme: EnvironmentTheme;
  private previousTheme: EnvironmentTheme | null = null;
  private themeTransitionProgress: number = 1.0; // 1.0 means fully transitioned
  private waterEffects: WaterEffects | null = null;
  
  // Device-specific quality settings
  private qualitySettings: {
    useInstancing: boolean;
    maxInstancesPerType: number;
    useLOD: boolean;
    maxPolygonsPerDecoration: number;
    cullingDistance: number;
  };
  
  // Decoration pooling and instancing system
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private instanceMatrices: Map<string, Float32Array> = new Map();
  private instanceCount: Map<string, number> = new Map();
  private decorationPool: Map<string, THREE.Object3D[]> = new Map();
  
  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    // Initialize quality settings based on device capabilities
    const deviceCapabilities = detectDeviceCapabilities();
    this.configureQualitySettings(deviceCapabilities);
    
    // Initialize instanced meshes for common decoration types
    this.initInstancedMeshes();
    
    // Create initial environment theme
    this.currentTheme = ENVIRONMENT_THEMES.reef;
    
    // Create skybox
    this.createSkybox();
    
    // Create water effects
    this.waterEffects = new WaterEffects(scene, 
      deviceCapabilities.highEnd ? 'high' : 
      deviceCapabilities.midRange ? 'medium' : 'low');
  }
  
  update(playerPosition: THREE.Vector3, camera: THREE.Camera, deltaTime: number): void {
    // Update camera frustum for culling
    this.cameraViewMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraViewMatrix);
    
    // Calculate which segment the player is in
    const currentSegmentIndex = Math.floor(playerPosition.z / this.segmentLength);
    
    // Generate new segments ahead
    while (this.segments.length < currentSegmentIndex + this.visibleSegments) {
      const position = new THREE.Vector3(
        0,
        0,
        this.segments.length * this.segmentLength
      );
      
      // Determine environment type based on distance
      const type = this.determineEnvironmentType(position.z);
      
      // Create new segment
      const segment = this.createSegment(position, type);
      this.segments.push(segment);
    }
    
    // Recycle segments behind player
    while (this.segments.length > this.maxSegments && 
           this.segments[0].mesh.position.z < playerPosition.z - this.segmentLength * 2) {
      const segment = this.segments.shift();
      if (segment) {
        // Recycle segment resources
        this.recycleSegment(segment);
      }
    }
    
    // Update theme transition
    if (this.themeTransitionProgress < 1.0 && this.previousTheme) {
      this.themeTransitionProgress += deltaTime / this.currentTheme.transitionDuration;
      this.themeTransitionProgress = Math.min(this.themeTransitionProgress, 1.0);
      
      // Create interpolated theme
      const lerpedTheme = lerpThemes(this.previousTheme, this.currentTheme, this.themeTransitionProgress);
      
      // Apply to scene
      applyEnvironmentTheme(this.scene, this.renderer, lerpedTheme);
    }
    
    // Update water effects
    if (this.waterEffects) {
      this.waterEffects.update(deltaTime, playerPosition);
    }
    
    // Update only visible segments
    for (const segment of this.segments) {
      if (this.isSegmentVisible(segment, camera, playerPosition)) {
        segment.update(deltaTime);
      }
    }
  }
  
  private isSegmentVisible(segment: EnvironmentSegment, camera: THREE.Camera, playerPosition: THREE.Vector3): boolean {
    // Distance culling
    const distance = playerPosition.distanceTo(segment.mesh.position);
    if (distance > this.qualitySettings.cullingDistance) {
      return false;
    }
    
    // Frustum culling
    return segment.isVisibleToCamera(camera);
  }
  
  // Other optimized methods...
}

/**
 * WaterEffects manages underwater visual effects
 * - Caustics (light patterns on ocean floor)
 * - Surface ripples
 * - Ambient particles
 * - Light rays
 */
export class WaterEffects {
  private scene: THREE.Scene;
  private causticsMesh: THREE.Mesh;
  private causticsMaterial: THREE.ShaderMaterial;
  private ambientParticles: THREE.Points;
  private lightRays: THREE.Group;
  private surfaceRipples: THREE.Mesh | null = null;
  private quality: 'low' | 'medium' | 'high';
  
  constructor(scene: THREE.Scene, quality: 'low' | 'medium' | 'high' = 'medium') {
    this.scene = scene;
    this.quality = quality;
    
    // Create underwater caustics with advanced shader
    const { mesh, material } = this.createCaustics();
    this.causticsMesh = mesh;
    this.causticsMaterial = material;
    
    // Create ambient particles for underwater atmosphere
    this.ambientParticles = this.createAmbientParticles();
    
    // Create light rays for medium/high quality
    this.lightRays = this.createLightRays();
    
    // Create surface ripples (medium and high quality only)
    if (this.quality !== 'low') {
      this.surfaceRipples = this.createSurfaceRipples();
    }
  }
  
  // Update method with adaptive effects based on quality settings
  update(deltaTime: number, playerPosition: THREE.Vector3) { /* Implementation */ }
}
```

Key optimizations and enhancements in the complete environment system:

1. **Modular Architecture**: Split into well-defined modules for better maintainability
   - `EnvironmentTypes.ts`: Environment theme definitions with transition capabilities
   - `DecorationDefinitions.ts`: 25+ decoration definitions with environment-specific filtering
   - `DecorationModels.ts`: Factory patterns for creating decoration meshes
   - `EnvironmentSegment.ts`: Segment class for terrain sections with visibility culling
   - `ProceduralEnvironment.ts`: Main orchestration and optimization
   - `WaterEffects.ts`: Advanced water effects with quality-based rendering

2. **Advanced Water Effects**:
   - **Caustics**: Realistic water light patterns with cellular noise and Fractal Brownian Motion
   - **Light Rays**: Volumetric-style light beams with dynamic positioning
   - **Surface Ripples**: Animated water surface with realistic wave patterns
   - **Ambient Particles**: Floating dust/plankton with natural drift movement

3. **Environment Theme System**:
   - Distinct environment types (reef, open ocean, deep sea, shipwreck, kelp forest)
   - Smooth transitions between themes with property interpolation
   - Theme-specific decoration sets and visual parameters
   - Event-based notification for UI/audio transitions

4. **Performance Optimizations**:
   - **Instanced Rendering**: Uses THREE.InstancedMesh for common decorations
   - **Object Pooling**: Reuses objects instead of creating/destroying
   - **Level of Detail (LOD)**: Varies mesh complexity based on distance
   - **Culling Strategies**: Frustum and distance-based culling
   - **Adaptive Quality**: Device-specific settings with mobile optimizations
   - **Shader Optimization**: Quality-scaled shader complexity

5. **Quality Adaptation**:
   - Three quality tiers (high, medium, low) based on device capabilities
   - Automatic feature reduction for lower-end devices:
     - Reduced particle counts
     - Simplified lighting effects
     - Fewer decorations with lower polygon counts
     - Shorter view distances for better performance
   - Manual quality control for user preference

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
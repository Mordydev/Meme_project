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
   - Audio system
   - Asset management

2. **Game Logic Layer**
   - Character controller
   - Obstacle management
   - Power-up system
   - Scoring mechanism
   - Level generation

3. **UI Layer**
   - Game HUD
   - Menus and navigation
   - Leaderboards
   - Player profile

4. **Server Layer**
   - Score verification
   - Leaderboard management
   - User data storage
   - Reward distribution

## Design Patterns

### Component Pattern
Game entities (player, obstacles, power-ups) are implemented as composable components with:
- Rendering capabilities
- Update logic
- State management
- Collision handling

Example from character implementation:
```javascript
// Simplified concept
class Character {
  constructor() {
    this.mesh = createCharacterMesh();
    this.state = 'SWIMMING'; // States: SWIMMING, JUMPING, DIVING, LANE_CHANGING
    this.animations = setupAnimations();
    this.collider = setupCollider();
  }
  
  update(deltaTime) {
    // Update based on state
    this.updateAnimation(deltaTime);
    this.updatePhysics(deltaTime);
    this.updateCollider();
  }
  
  changeState(newState) {
    // Handle state transitions
  }
  
  // State-specific methods
  swim() { /* ... */ }
  jump() { /* ... */ }
  dive() { /* ... */ }
  changeLane(direction) { /* ... */ }
}
```

### State Pattern
Game entities use state machines to manage behavior transitions:
- Character states: SWIMMING, JUMPING, DIVING, LANE_CHANGING
- Obstacle states: IDLE, ACTIVE, TRIGGERED (e.g., pufferfish inflation)
- Game states: MENU, TUTORIAL, PLAYING, PAUSED, GAME_OVER

Example state transition logic:
```javascript
// Character state management
updateState(input, deltaTime) {
  switch(this.state) {
    case 'SWIMMING':
      if (input.jump && this.canAct()) {
        this.state = 'JUMPING';
        this.jumpStartY = this.position.y;
        this.actionTime = 0;
      } else if (input.dive && this.canAct()) {
        this.state = 'DIVING';
        this.actionTime = 0;
      } // ...etc
      break;
    
    case 'JUMPING':
      this.actionTime += deltaTime;
      // Calculate jump trajectory
      if (this.actionTime > JUMP_DURATION || this.position.y <= this.jumpStartY) {
        this.state = 'SWIMMING';
      }
      break;
    // ...other states
  }
}
```

### Observer Pattern
Game systems communicate through events to maintain loose coupling:
- Score changes broadcast to UI
- Collision events trigger appropriate responses
- Power-up activation/deactivation notifies affected systems

Example event system:
```javascript
// Game event system
const eventBus = {
  listeners: {},
  
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },
  
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
};

// Usage
eventBus.on('collision', data => {
  if (data.withObstacle) handleObstacleCollision(data);
});

eventBus.on('powerup_collected', data => {
  activatePowerUp(data.type, data.duration);
});
```

### Factory Pattern
Game objects are created through factory functions to manage complexity and maintain consistency:
- Obstacle factories for different obstacle types
- Environment factories for different ocean themes
- Power-up factories for different effects

Example factory:
```javascript
// Obstacle factory
function createObstacle(type, position, options = {}) {
  switch(type) {
    case 'shark':
      return createShark({position, ...options});
    case 'jellyfish':
      return createJellyfish({position, ...options});
    case 'pufferfish':
      return createPufferfish({position, ...options});
    case 'clam':
      return createClam({position, ...options});
    // Additional obstacle types
  }
}
```

### Shader-Based Rendering
Custom shaders are used for high-quality visual effects:
- Water caustics
- Fish skin/scales with realistic lighting
- Bubble transparency and refraction
- Environment atmosphere

Example shader structure:
```glsl
// Simplified vertex shader example
varying vec3 vNormal;
varying vec3 vWorldPosition;
uniform float uTime;

void main() {
  // Apply vertex animation based on time
  vec3 pos = position;
  pos.y += sin(uTime * frequency + position.x) * amplitude;
  
  // Calculate world position for fragment shader
  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;
  vNormal = normalize(normalMatrix * normal);
  
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
```

## Code Organization

### Directory Structure
```
/nemo-runner
├── app                    # Next.js App Router pages/routes
│   ├── api                # API endpoints
│   ├── game               # Game page
│   ├── leaderboard        # Leaderboard page
│   └── profile            # User profile page
├── components             # React components
│   ├── game               # Game-specific components
│   ├── layout             # Layout components
│   └── ui                 # Reusable UI components  
├── game                   # Game engine code
│   ├── core               # Core game systems
│   ├── entities           # Game entities
│   │   ├── character      # Player character
│   │   ├── obstacles      # Game obstacles
│   │   ├── powerups       # Power-up items
│   │   └── environment    # Environment elements
│   ├── shaders            # GLSL shaders
│   ├── utils              # Game utility functions
│   └── index.js           # Main game initialization
├── lib                    # Shared utility code
├── db                     # Database models and queries
├── public                 # Static assets
└── styles                 # Global styles
```

### Coding Patterns

#### Asset Loading and Management
- Asynchronous asset loading with loading screen
- Asset preloading for critical game elements
- Dynamic loading for level-specific assets
- Memory management for efficient resource use

```javascript
// Asset management example
const assetLoader = {
  loaded: {},
  
  async load(assetType, assetPath) {
    if (this.loaded[assetPath]) return this.loaded[assetPath];
    
    let asset;
    switch(assetType) {
      case 'texture':
        asset = await new THREE.TextureLoader().loadAsync(assetPath);
        break;
      case 'model':
        asset = await new GLTFLoader().loadAsync(assetPath);
        break;
      // Other asset types
    }
    
    this.loaded[assetPath] = asset;
    return asset;
  },
  
  preload(assetList) {
    return Promise.all(assetList.map(({type, path}) => this.load(type, path)));
  }
};
```

#### Game Loop Management
- Fixed timestep for physics
- Variable rendering for visual smoothness
- Performance monitoring and adaptable quality settings

```javascript
// Game loop example
let lastTime = 0;
const fixedTimeStep = 1/60; // 60 fps physics
let accumulator = 0;

function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);
  
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  // Fixed timestep for physics
  accumulator += deltaTime;
  while (accumulator >= fixedTimeStep) {
    updatePhysics(fixedTimeStep);
    accumulator -= fixedTimeStep;
  }
  
  // Variable rendering with interpolation
  const alpha = accumulator / fixedTimeStep;
  render(alpha);
}

requestAnimationFrame(gameLoop);
```

#### Responsive Design for Cross-Device Support
- Dynamic quality settings based on device capability
- Input abstraction for keyboard/touch controls
- UI scaling for different screen sizes
- Performance optimization for mobile devices

```javascript
// Device capability detection
function detectDeviceCapabilities() {
  const capabilities = {
    highEnd: false,
    midRange: false,
    lowEnd: true, // Default to low-end
    mobile: false
  };
  
  // Check for mobile
  capabilities.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check GPU/system performance
  // This could use benchmarking or checking available features
  const gl = document.createElement('canvas').getContext('webgl');
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      // Logic to categorize GPU capability based on renderer string
      if (renderer.includes('high-end-gpu-identifier')) {
        capabilities.highEnd = true;
        capabilities.lowEnd = false;
      } else if (renderer.includes('mid-range-gpu-identifier')) {
        capabilities.midRange = true;
        capabilities.lowEnd = false;
      }
    }
  }
  
  return capabilities;
}

// Apply settings based on capabilities
function configureGameSettings(capabilities) {
  if (capabilities.lowEnd) {
    // Low quality settings
    return {
      particles: 'minimal',
      shadowQuality: 'off',
      drawDistance: 'short',
      waterQuality: 'simple'
    };
  } else if (capabilities.midRange) {
    // Medium quality settings
  } else {
    // High quality settings
  }
}
```

## Refactoring History

As this is a new project, there is no refactoring history yet. This section will be updated as the project evolves.
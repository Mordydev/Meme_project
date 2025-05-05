# NEMO Runner - Next Features Implementation Plan

Based on the current implementation progress and the project requirements, this document outlines the next features to implement and their priority order.

## Priority 1: Core Gameplay Enhancements

### 1. Collision System Implementation
**Goal**: Complete the collision detection and response between player and obstacles

**Tasks**:
- Connect `ObstacleManager.checkCollisions()` with player position and radius
- Implement damage system with invulnerability frames after collision
- Add visual feedback for collisions (flash effect, particle burst)
- Trigger life reduction when collision occurs
- Implement game over state when lives reach zero

**Implementation Approach**:
```typescript
// In UnderwaterScene.tsx or GameCanvas.tsx

// Add collision detection in useFrame
useFrame((_, delta) => {
  if (isPlaying && playerRef.current && obstacleManagerRef.current) {
    // Get player position and hitbox
    const playerPosition = playerRef.current.position.clone();
    const playerRadius = 0.5; // Adjust based on player model
    
    // Check for collisions with obstacles
    const collidedObstacle = obstacleManagerRef.current.checkCollisions(
      playerPosition, playerRadius
    );
    
    if (collidedObstacle && !isInvulnerable) {
      // Handle collision
      decreaseLives();
      setIsInvulnerable(true);
      
      // Trigger collision effects
      triggerCollisionEffect(playerPosition);
      
      // Set invulnerability timeout
      setTimeout(() => setIsInvulnerable(false), 1500);
    }
  }
});
```

### 2. Collectibles Integration
**Goal**: Integrate the CollectiblesSystem with the main game

**Tasks**:
- Add CollectiblesSystem to UnderwaterScene
- Connect collision detection between player and collectibles
- Implement score updates when collecting bubbles
- Add visual and audio feedback for collections
- Generate collectible patterns based on game progression

**Implementation Approach**:
```tsx
// In UnderwaterScene.tsx
<>
  {/* Existing environment elements */}
  
  {/* Add Collectibles System */}
  <CollectiblesSystem 
    playerPosition={playerPosition}
    playerRadius={playerRadius}
    isInvulnerable={isInvulnerable}
  />
</>
```

### 3. Power-Up System
**Goal**: Implement special power-ups that provide temporary abilities

**Tasks**:
- Create PowerUpManager class to handle active power-ups
- Implement different power-up types (shield, speed boost, score multiplier)
- Add visual effects for active power-ups
- Implement power-up duration and cooldown system
- Create power-up UI indicators

**Power-Up Types**:
1. **Bubble Shield**: Temporary protection from one collision
2. **Speed Boost**: Increased movement speed and score multiplier
3. **Bubble Magnet**: Automatically attracts nearby bubbles
4. **Time Slow**: Slows down obstacles for easier navigation

## Priority 2: Environment Enhancements

### 1. Multiple Underwater Zones
**Goal**: Create distinct environment zones with unique visuals and challenges

**Tasks**:
- Implement EnvironmentManager to handle zone transitions
- Create three initial environment types:
  - Coral Reef (starter zone)
  - Open Ocean (mid-game)
  - Deep Sea (late-game)
- Add visual indicators for zone transitions
- Adjust lighting and effects based on current zone
- Implement zone-specific obstacles and collectibles

**Implementation Approach**:
```typescript
export enum EnvironmentZone {
  CORAL_REEF,
  OPEN_OCEAN,
  DEEP_SEA
}

export class EnvironmentManager {
  private currentZone: EnvironmentZone = EnvironmentZone.CORAL_REEF;
  private transitionProgress: number = 0;
  private nextZone: EnvironmentZone | null = null;
  
  // Zone-specific settings
  private zoneSettings = {
    [EnvironmentZone.CORAL_REEF]: {
      fogColor: new THREE.Color('#75C2F6'),
      fogDensity: 0.02,
      lightColor: new THREE.Color('#FFFFFF'),
      lightIntensity: 0.8,
      ambientColor: new THREE.Color('#4a6a82'),
      ambientIntensity: 0.4
    },
    // Settings for other zones...
  };
  
  // Check for zone transitions based on distance
  public update(distance: number): void {
    // Determine zone based on distance
    if (distance > 5000 && this.currentZone === EnvironmentZone.CORAL_REEF) {
      this.beginTransition(EnvironmentZone.OPEN_OCEAN);
    } else if (distance > 10000 && this.currentZone === EnvironmentZone.OPEN_OCEAN) {
      this.beginTransition(EnvironmentZone.DEEP_SEA);
    }
    
    // Update transition if in progress
    if (this.nextZone !== null) {
      this.updateTransition();
    }
  }
  
  // Begin transition to new zone
  private beginTransition(nextZone: EnvironmentZone): void {
    this.nextZone = nextZone;
    this.transitionProgress = 0;
  }
  
  // Update transition progress
  private updateTransition(): void {
    // Increase transition progress
    this.transitionProgress += 0.01;
    
    if (this.transitionProgress >= 1) {
      // Complete transition
      this.currentZone = this.nextZone!;
      this.nextZone = null;
    }
  }
  
  // Get current environment settings
  public getCurrentSettings(): any {
    if (this.nextZone === null) {
      return this.zoneSettings[this.currentZone];
    }
    
    // Interpolate between current and next settings
    const currentSettings = this.zoneSettings[this.currentZone];
    const nextSettings = this.zoneSettings[this.nextZone];
    
    // Return interpolated settings
    return {
      // Interpolate each property...
    };
  }
}
```

### 2. Procedural Generation System
**Goal**: Create endless, varied gameplay with procedural content

**Tasks**:
- Implement chunk-based level generation
- Create template-based obstacle patterns
- Implement difficulty curve based on distance
- Generate diverse collectible formations
- Implement streaming system for efficient memory usage

**Implementation Approach**:
```typescript
export class ChunkGenerator {
  private chunkSize: number = 50; // Units
  private loadedChunks: Map<number, Chunk> = new Map();
  private seed: number;
  
  constructor(seed?: number) {
    this.seed = seed || Math.random() * 1000000;
  }
  
  // Generate a chunk at specified distance
  public generateChunk(chunkIndex: number): Chunk {
    // Check if chunk already exists
    if (this.loadedChunks.has(chunkIndex)) {
      return this.loadedChunks.get(chunkIndex)!;
    }
    
    // Create new chunk
    const chunk = new Chunk(chunkIndex, this.seed + chunkIndex);
    
    // Add obstacles and collectibles to chunk
    this.populateChunk(chunk);
    
    // Store chunk
    this.loadedChunks.set(chunkIndex, chunk);
    
    return chunk;
  }
  
  // Populate chunk with obstacles and collectibles
  private populateChunk(chunk: Chunk): void {
    // Determine difficulty based on chunk index
    const difficulty = Math.min(10, 1 + Math.floor(chunk.index / 3));
    
    // Add obstacles
    const obstacleCount = 3 + Math.floor(difficulty * 1.5);
    for (let i = 0; i < obstacleCount; i++) {
      // Add obstacle
    }
    
    // Add collectibles
    const collectibleCount = 5 + Math.floor(difficulty * 2);
    for (let i = 0; i < collectibleCount; i++) {
      // Add collectible
    }
  }
  
  // Update chunks based on player position
  public update(playerPosition: THREE.Vector3): void {
    const currentChunkIndex = Math.floor(playerPosition.z / this.chunkSize);
    
    // Generate chunks ahead
    for (let i = currentChunkIndex; i <= currentChunkIndex + 3; i++) {
      this.generateChunk(i);
    }
    
    // Remove chunks behind
    for (const [index, chunk] of this.loadedChunks.entries()) {
      if (index < currentChunkIndex - 1) {
        this.loadedChunks.delete(index);
      }
    }
  }
}
```

## Priority 3: UI and Visual Enhancements

### 1. Complete HUD
**Goal**: Finalize in-game HUD with all necessary information

**Tasks**:
- Add power-up indicator with timer
- Implement score milestone notifications
- Add distance marker with environment indicators
- Create combo counter for consecutive collections
- Implement warning indicators for upcoming obstacles

### 2. Tutorial and Onboarding
**Goal**: Create intuitive onboarding for new players

**Tasks**:
- Implement first-time tutorial with step-by-step guidance
- Create interactive demonstrations of core mechanics
- Add contextual help for new features as they're unlocked
- Implement tooltip system for UI elements
- Create "skip tutorial" option for experienced players

### 3. Game Over and Score Screens
**Goal**: Create engaging end-game experience

**Tasks**:
- Implement detailed score breakdown (distance, collectibles, etc.)
- Add "new high score" celebration
- Create leaderboard preview (placeholder for backend integration)
- Implement share score functionality
- Add "play again" with quick restart option

## Priority 4: Backend Integration

### 1. Clerk Authentication
**Goal**: Implement user authentication flow

**Tasks**:
- Set up Clerk SDK and API keys
- Create authentication UI with sign-up/login
- Implement social login options
- Create user profile storage in Supabase
- Add session persistence for returning users

### 2. Leaderboard System
**Goal**: Implement competitive leaderboards with timeframes

**Tasks**:
- Create Supabase tables for score storage
- Implement score submission API
- Create leaderboard UI with daily/weekly/monthly views
- Add player ranking and percentile indicators
- Implement anti-cheat verification for submitted scores

### 3. Usage Limits
**Goal**: Implement game limits based on user status

**Tasks**:
- Track play count for users (1 for anonymous, 10 for registered)
- Create limit reset logic at UTC midnight
- Implement "limit reached" UI with registration prompt
- Add premium features for registered users
- Create admin panel for limit management

## Timeline

| Feature Set | Estimated Time | Dependencies |
|-------------|----------------|--------------|
| Core Gameplay Enhancements | 2 weeks | None |
| Environment Enhancements | 2 weeks | Core Gameplay |
| UI and Visual Enhancements | 1.5 weeks | Core Gameplay |
| Backend Integration | 2.5 weeks | UI Enhancements |

## Next Immediate Steps

1. **Implement Collision System**:
   - Connect obstacle manager with player position
   - Add collision response and invulnerability frames
   - Link with lives system

2. **Complete Collectibles Integration**:
   - Add CollectiblesSystem to UnderwaterScene
   - Implement player-collectible collision detection
   - Add visual feedback for collections

3. **Create Power-Up Framework**:
   - Implement PowerUpManager class
   - Create base power-up effects
   - Add UI indicators for active power-ups

The focus should be on completing the core gameplay mechanics first to create a fully playable game loop, then expanding on environment variety and visual polish before adding backend integration.
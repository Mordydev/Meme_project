# NEMO Runner: Next Features Implementation Plan

## Current Progress Assessment

The NEMO Runner project has made significant progress with approximately 50% of the core functionality now implemented. Key features completed include:

- Core project setup with Next.js, TypeScript, and Three.js
- Basic game canvas and rendering system
- Player character with movement controls
- Simple underwater environment with basic elements
- Collision detection system with proper player-obstacle interaction
- Collectibles system with particle effects
- Power-up system with various effect types and durations
- HUD display with score, distance, lives, and power-up indicators
- Basic game state management (menu, playing, paused, game over)

## Implementation Priority Framework

The remaining development work will be organized into four major phases:

1. **Core Gameplay Enhancement** (3 weeks)
2. **Environment & Visual Expansion** (2 weeks)
3. **Backend Integration** (2 weeks)
4. **Polish & Release Preparation** (1 week)

This plan represents a total of 8 weeks of development work to complete the game.

## Phase 1: Core Gameplay Enhancement

### 1.1 Implement Progressive Difficulty System

**Goal:** Create a dynamic difficulty system that increases challenge based on distance traveled.

**Implementation Details:**
- Create a `DifficultyManager` class to track progression
- Implement increasing game speed tied to distance
- Increase obstacle spawn frequency and complexity over time
- Adjust collectible and power-up spawn rates based on difficulty
- Create difficulty checkpoints for player adaptation

```typescript
// src/lib/game-engine/DifficultyManager.ts
export class DifficultyManager {
  private baseSpeed = 1.0;
  private maxSpeed = 3.0;
  private currentLevel = 1;
  private distanceThresholds = [500, 1000, 2000, 3500, 5000, 7500, 10000];
  
  constructor() {
    // Initialize difficulty parameters
  }
  
  update(distance: number): void {
    // Update difficulty level based on distance
    const newLevel = this.calculateLevelFromDistance(distance);
    
    if (newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      // Trigger difficulty transition events
    }
  }
  
  calculateLevelFromDistance(distance: number): number {
    // Determine appropriate level from distance
    for (let i = 0; i < this.distanceThresholds.length; i++) {
      if (distance < this.distanceThresholds[i]) {
        return i + 1;
      }
    }
    return this.distanceThresholds.length + 1;
  }
  
  getCurrentSpeedMultiplier(): number {
    // Calculate speed multiplier from current level
    return Math.min(this.baseSpeed + (this.currentLevel - 1) * 0.2, this.maxSpeed);
  }
  
  getObstacleParameters(): ObstacleParameters {
    // Return difficulty-appropriate obstacle parameters
    return {
      density: this.baseObstacleDensity * (1 + (this.currentLevel - 1) * 0.15),
      speed: this.baseObstacleSpeed * this.getCurrentSpeedMultiplier(),
      complexityLevel: Math.min(this.currentLevel, 5)
    };
  }
}
```

**Testing Strategy:**
- Verify smooth difficulty progression through playthrough testing
- Validate obstacle generation patterns at each difficulty level
- Ensure game remains playable at maximum difficulty

### 1.2 Design Advanced Obstacle Patterns

**Goal:** Create a diverse library of obstacle patterns for gameplay variety.

**Implementation Details:**
- Develop an obstacle pattern system with templates
- Create at least 10 distinct pattern types
- Implement pattern selection based on difficulty level
- Add variation parameters to each pattern for replayability
- Design "signature" patterns for each environment zone

```typescript
// src/lib/game-engine/ObstaclePatterns.ts
type ObstaclePattern = {
  id: string;
  difficulty: number; // 1-5 scale
  generatePattern: (params: ObstaclePatternParams) => ObstacleDefinition[];
  minDistanceBetween: number; // Minimum units between pattern instances
};

export const obstaclePatterns: ObstaclePattern[] = [
  {
    id: 'basic_wall',
    difficulty: 1,
    minDistanceBetween: 50,
    generatePattern: (params) => {
      const obstacles: ObstacleDefinition[] = [];
      const gap = 2 + Math.random() * 2;
      const gapPosition = (Math.random() - 0.5) * 10;
      
      // Create wall with random gap
      for (let x = -8; x <= 8; x += 2) {
        if (x < gapPosition - gap/2 || x > gapPosition + gap/2) {
          obstacles.push({
            type: 'coral',
            position: new Vector3(x, params.height, params.zPosition),
            scale: 1 + Math.random() * 0.5
          });
        }
      }
      
      return obstacles;
    }
  },
  // Add more patterns here...
];
```

**Testing Strategy:**
- Verify each pattern is navigable by the player
- Test pattern combinations for fair difficulty
- Validate pattern generation performance

### 1.3 Enhance Game Physics System

**Goal:** Improve the physics system for more fluid, responsive movement.

**Implementation Details:**
- Refine water physics simulation for realistic movement
- Implement momentum and inertia for smoother control
- Add subtle character tilting based on movement direction
- Create obstacle interaction physics (bounce, push effects)
- Add current/flow zones that affect player movement

```typescript
// src/lib/game-engine/MovementPhysics.ts
export class MovementPhysics {
  // Physics parameters
  private drag = 0.92; // Water resistance
  private acceleration = new Vector3(40, 35, 0);
  private maxVelocity = new Vector3(8, 7, 12);
  private tiltFactor = 0.15;
  
  // Current state
  private velocity = new Vector3();
  private currents: CurrentZone[] = [];
  
  update(deltaTime: number, input: Vector2, position: Vector3): void {
    // Apply input forces with acceleration
    this.velocity.x += input.x * this.acceleration.x * deltaTime;
    this.velocity.y += input.y * this.acceleration.y * deltaTime;
    
    // Apply current effects
    this.applyCurrents(position, deltaTime);
    
    // Apply drag (water resistance)
    this.velocity.multiplyScalar(this.drag);
    
    // Clamp to max speed
    this.clampVelocity();
    
    // Calculate tilt based on lateral movement
    const tiltAngle = -this.velocity.x * this.tiltFactor;
    
    return {
      velocity: this.velocity.clone(),
      tiltAngle
    };
  }
  
  private applyCurrents(position: Vector3, deltaTime: number): void {
    // Apply any active current zones
    for (const current of this.currents) {
      if (current.isInZone(position)) {
        this.velocity.add(current.getForce().multiplyScalar(deltaTime));
      }
    }
  }
}
```

**Testing Strategy:**
- Test movement feel across different devices
- Verify physics behavior matches expectations
- Validate water current effects on gameplay

### 1.4 Implement Game Over System

**Goal:** Create a comprehensive game over flow with score reporting.

**Implementation Details:**
- Design game over screen with score display
- Implement leaderboard position preview
- Add restart and exit options
- Create score submission animation
- Save high score to local storage for anonymous users

```typescript
// src/components/game/GameOverScreen.tsx
export default function GameOverScreen({ 
  score, 
  distance, 
  onRestart, 
  onExit 
}: GameOverProps) {
  const [animationState, setAnimationState] = useState<'initial' | 'scoreReveal' | 'complete'>('initial');
  const [leaderboardPosition, setLeaderboardPosition] = useState<number | null>(null);
  
  useEffect(() => {
    // Animate score reveal
    const timer1 = setTimeout(() => setAnimationState('scoreReveal'), 500);
    const timer2 = setTimeout(() => setAnimationState('complete'), 2500);
    
    // Save high score
    saveHighScore(score);
    
    // Get leaderboard position (for authenticated users)
    checkLeaderboardPosition(score).then(position => {
      setLeaderboardPosition(position);
    });
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [score]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <motion.div 
        className="bg-blue-900/90 p-8 rounded-xl max-w-md w-full"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl text-center text-white font-bold mb-2">Game Over</h2>
        
        <motion.div 
          className="text-center mb-6"
          animate={animationState !== 'initial' ? { scale: [1, 1.2, 1] } : {}}
        >
          <div className="text-5xl font-bold text-yellow-300 mb-1">
            {score.toLocaleString()}
          </div>
          <div className="text-blue-200">
            Distance: {Math.floor(distance).toLocaleString()}m
          </div>
          
          {leaderboardPosition && (
            <div className="mt-4 text-green-300">
              Leaderboard Position: #{leaderboardPosition}
            </div>
          )}
        </motion.div>
        
        <div className="flex flex-col gap-3 mt-6">
          <button 
            onClick={onRestart}
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-full"
          >
            Play Again
          </button>
          <button 
            onClick={onExit}
            className="bg-transparent border border-blue-500 text-blue-300 py-2 px-6 rounded-full"
          >
            Exit to Menu
          </button>
        </div>
      </motion.div>
    </div>
  );
}
```

**Testing Strategy:**
- Test score submission functionality
- Verify restart flow works correctly
- Test across various device sizes

## Phase 2: Environment & Visual Expansion

### 2.1 Create Multiple Underwater Zones

**Goal:** Develop distinct underwater environment zones with unique visual styles.

**Implementation Details:**
- Create three main environment themes:
  - Coral Reef: Colorful, vibrant starting zone
  - Open Ocean: Sparse, blue expanses with schools of fish
  - Deep Sea: Dark, mysterious with bioluminescent elements
- Implement smooth transitions between zones
- Add zone-specific obstacles and collectibles
- Create distinct lighting models for each zone

```typescript
// src/components/game/environments/CoralReefZone.tsx
export function CoralReefZone({ active }: { active: boolean }) {
  // Zone-specific refs and state
  const coralRefs = useRef<THREE.Group[]>([]);
  const fishSchoolsRef = useRef<THREE.Group[]>([]);
  
  // Lighting setup for this zone
  useEffect(() => {
    if (!active) return;
    
    // Configure zone-specific lighting
    // ...
    
    return () => {
      // Clean up when zone is no longer active
    };
  }, [active]);
  
  // Spawn zone-specific background elements
  useFrame((state, delta) => {
    if (!active) return;
    
    // Animate coral swaying
    coralRefs.current.forEach((coral, i) => {
      const time = state.clock.getElapsedTime();
      coral.rotation.z = Math.sin(time * 0.5 + i * 0.2) * 0.05;
    });
    
    // Animate fish schools
    // ...
  });
  
  return (
    <group visible={active}>
      {/* Zone-specific background elements */}
      <SeaFloor type="coral" />
      <CoralFormations ref={coralRefs} />
      <FishSchools ref={fishSchoolsRef} />
      <SeaweedPatches />
      <AmbientParticles count={1000} color="#88CCFF" />
    </group>
  );
}

// Similar components for OpenOceanZone and DeepSeaZone
```

**Testing Strategy:**
- Test smooth transitions between zones
- Verify performance with complex environment assets
- Validate distinct visual feel for each zone

### 2.2 Enhance Visual Effects System

**Goal:** Create immersive underwater effects to enhance atmosphere.

**Implementation Details:**
- Implement caustic light patterns on surfaces
- Add bubble particle systems
- Create dust/plankton floating particles
- Implement water refraction and god rays effects
- Add collision and collection particle effects

```typescript
// src/components/game/effects/CausticEffect.tsx
export function CausticEffect({ intensity = 1 }) {
  const causticTexture = useLoader(
    TextureLoader, 
    '/textures/caustics.jpg'
  );
  const materials = useRef<THREE.MeshBasicMaterial[]>([]);
  
  useEffect(() => {
    // Create caustic textures
    causticTexture.wrapS = causticTexture.wrapT = THREE.RepeatWrapping;
    
    // Create materials for different caustic patterns
    for (let i = 0; i < 32; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: causticTexture,
        transparent: true,
        opacity: 0.2 * intensity,
        blending: THREE.AdditiveBlending
      });
      materials.current.push(material);
    }
    
    return () => {
      materials.current.forEach(m => m.dispose());
    };
  }, [causticTexture, intensity]);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime() * 0.5;
    const index = Math.floor(time % 32);
    
    // Cycle through caustic patterns
    if (materials.current[index]) {
      mesh.current.material = materials.current[index];
      mesh.current.material.opacity = 0.2 * intensity * (0.8 + Math.sin(time * 2) * 0.2);
    }
  });
  
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position-y={-5}>
      <planeGeometry args={[200, 200]} />
    </mesh>
  );
}
```

**Testing Strategy:**
- Verify visual effects on various device capabilities
- Test performance impact of combined effects
- Validate visual cohesion across different zones

### 2.3 Create Environmental Obstacles

**Goal:** Implement environment-specific obstacles for gameplay variety.

**Implementation Details:**
- Design at least 5 unique obstacles per environment
- Implement obstacle behavior patterns (static, moving, triggered)
- Create visual variations within obstacle types
- Add special obstacle combinations for each difficulty level
- Implement obstacle animation and feedback effects

```typescript
// src/lib/game-engine/obstacles/JellyfishObstacle.ts
export class JellyfishObstacle extends BaseObstacle {
  private pulsePhase: number;
  private movePattern: 'vertical' | 'horizontal' | 'circular';
  private tentacleGroup: THREE.Group;
  
  constructor(params: JellyfishParams) {
    super(params);
    
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.movePattern = params.movePattern || this.getRandomPattern();
    
    // Create jellyfish mesh
    this.setupMesh();
    
    // Create tentacles with physics
    this.tentacleGroup = this.createTentacles(params.size, params.tentacleCount);
    this.mesh.add(this.tentacleGroup);
  }
  
  update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Update pulsing animation
    const time = performance.now() * 0.001;
    const pulseFactor = 0.2 * Math.sin(time * 1.5 + this.pulsePhase) + 1;
    
    this.mesh.scale.set(pulseFactor, pulseFactor * 0.8, pulseFactor);
    
    // Update movement pattern
    switch (this.movePattern) {
      case 'vertical':
        this.updateVerticalMovement(time);
        break;
      case 'horizontal':
        this.updateHorizontalMovement(time);
        break;
      case 'circular':
        this.updateCircularMovement(time);
        break;
    }
    
    // Update tentacle physics
    this.updateTentacles(deltaTime, playerPosition);
    
    // Update collision detection
    this.updateColliders();
  }
  
  private updateTentacles(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Simulate tentacle movement with simple physics
    // ...
  }
}
```

**Testing Strategy:**
- Verify each obstacle's visual and functional implementation
- Test obstacle combinations for proper difficulty balance
- Validate collision detection with various obstacle types

### 2.4 Implement Parallax Background System

**Goal:** Create a multi-layered background for depth perception.

**Implementation Details:**
- Implement multiple background layers with different movement speeds
- Create distant sea floor and rock formations
- Add parallax fish schools in background
- Implement depth-based fog effects
- Create subtle camera motion for immersion

```typescript
// src/components/game/backgrounds/ParallaxBackground.tsx
export function ParallaxBackground({ 
  currentZone = 'coralReef',
  playerPosition
}: ParallaxProps) {
  // Background layer references
  const farLayer = useRef<THREE.Group>(null);
  const midLayer = useRef<THREE.Group>(null);
  const nearLayer = useRef<THREE.Group>(null);
  
  // Movement factors for each layer
  const layerFactors = {
    far: 0.1,
    mid: 0.3,
    near: 0.7
  };
  
  useFrame((state, delta) => {
    // Calculate parallax offset based on player position
    const parallaxX = playerPosition.x * -0.1;
    
    // Update layer positions with respective movement factors
    if (farLayer.current) {
      farLayer.current.position.x = parallaxX * layerFactors.far;
      // Add subtle autonomous movement for distant elements
      const time = state.clock.getElapsedTime();
      farLayer.current.position.y = Math.sin(time * 0.1) * 0.5;
    }
    
    if (midLayer.current) {
      midLayer.current.position.x = parallaxX * layerFactors.mid;
    }
    
    if (nearLayer.current) {
      nearLayer.current.position.x = parallaxX * layerFactors.near;
    }
  });
  
  return (
    <>
      <group ref={farLayer} position-z={-100}>
        <FarBackgroundElements zone={currentZone} />
      </group>
      
      <group ref={midLayer} position-z={-50}>
        <MidBackgroundElements zone={currentZone} />
      </group>
      
      <group ref={nearLayer} position-z={-20}>
        <NearBackgroundElements zone={currentZone} />
      </group>
      
      {/* Fog and atmosphere effects */}
      {currentZone === 'deepSea' ? (
        <DepthFog color="#001428" near={10} far={50} />
      ) : (
        <DepthFog color="#0a4d7a" near={20} far={80} />
      )}
    </>
  );
}
```

**Testing Strategy:**
- Verify smooth parallax effect across different movement patterns
- Test performance with multiple background layers
- Validate visual cohesion with game environment

## Phase 3: Backend Integration

### 3.1 Implement Clerk Authentication

**Goal:** Set up user authentication system for personalized experience.

**Implementation Details:**
- Integrate Clerk authentication with Next.js
- Create signup/login flows
- Implement user profile storage and retrieval
- Set up authenticated session management
- Create user profile synchronization with database

```typescript
// src/lib/auth/auth-utils.ts
import { clerkClient } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

export async function syncUserWithDatabase(userId: string) {
  try {
    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);
    
    // Check if user exists in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user:', error);
      return;
    }
    
    // Create user if doesn't exist
    if (!data) {
      await supabase.from('profiles').insert({
        id: userId,
        username: user.username || `player_${userId.slice(0, 8)}`,
        games_played: 0,
        games_remaining: 10,
        last_reset: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error syncing user:', error);
  }
}
```

**Testing Strategy:**
- Test authentication flow across devices
- Verify login persistence across page refreshes
- Validate user profile synchronization with database

### 3.2 Create Supabase Database Integration

**Goal:** Implement database structure for game data persistence.

**Implementation Details:**
- Set up Supabase project and database
- Create tables for:
  - User profiles
  - Leaderboard scores
  - Game sessions
  - Usage tracking
- Implement Row Level Security policies
- Create database functions for common operations

```sql
-- Database schema
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  games_played INTEGER DEFAULT 0,
  games_remaining INTEGER DEFAULT 10,
  last_reset TIMESTAMPTZ DEFAULT NOW(),
  high_score INTEGER DEFAULT 0,
  total_distance INTEGER DEFAULT 0
);

CREATE TABLE scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  score INTEGER NOT NULL,
  distance INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Implement leaderboard view
CREATE VIEW daily_leaderboard AS
SELECT 
  s.id, s.score, s.distance, s.created_at,
  p.username, p.id as user_id,
  ROW_NUMBER() OVER (ORDER BY s.score DESC) as rank
FROM scores s
JOIN profiles p ON s.user_id = p.id
WHERE s.created_at >= DATE_TRUNC('day', NOW())
ORDER BY s.score DESC;
```

**Testing Strategy:**
- Test database queries for performance
- Verify RLS policies for security
- Validate data consistency across operations

### 3.3 Implement Leaderboard System

**Goal:** Create competitive leaderboards with different timeframes.

**Implementation Details:**
- Create leaderboard data retrieval functions
- Implement daily, weekly, and monthly leaderboards
- Design leaderboard UI with player highlighting
- Add pagination for large leaderboards
- Create player rank calculation

```typescript
// src/lib/leaderboard/getLeaderboard.ts
export async function getLeaderboard(
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time',
  page = 0,
  limit = 10
) {
  const now = new Date();
  let startDate: Date;
  
  // Calculate date range based on timeframe
  switch (timeframe) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      const day = now.getDay();
      startDate = new Date(now.setDate(now.getDate() - day));
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'all-time':
    default:
      startDate = new Date(0); // Beginning of time
  }
  
  // Query leaderboard data
  const { data, error } = await supabase
    .from('scores')
    .select(`
      id,
      score,
      distance,
      created_at,
      profiles:user_id (username, id)
    `)
    .gte('created_at', startDate.toISOString())
    .order('score', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
  
  if (error) throw error;
  return data;
}
```

**Testing Strategy:**
- Test leaderboard queries with large data sets
- Verify correct timeframe calculations
- Validate pagination functionality

### 3.4 Implement Usage Limit System

**Goal:** Create system to track and enforce daily game limits.

**Implementation Details:**
- Implement 10 games per day for authenticated users
- Set up 1 game limit for anonymous users
- Create daily reset mechanism at UTC midnight
- Design clear usage limit visualization
- Implement limit bypass for testing

```typescript
// src/lib/limits/usageLimits.ts
export async function getRemainingGames(userId?: string) {
  if (!userId) {
    // Anonymous user (1 game limit)
    const playCount = Number(localStorage.getItem('anon_plays') || '0');
    return Math.max(0, 1 - playCount);
  }
  
  // Get today's date in UTC
  const today = new Date().toISOString().split('T')[0];
  
  // Query remaining games
  const { data, error } = await supabase
    .from('profiles')
    .select('games_remaining, last_reset')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching remaining games:', error);
    return 0;
  }
  
  // Check if we need to reset (new day)
  const lastReset = new Date(data.last_reset);
  const resetDate = new Date(today);
  
  if (lastReset < resetDate) {
    // Reset limit for new day
    await supabase
      .from('profiles')
      .update({ 
        games_remaining: 10,
        last_reset: new Date().toISOString()
      })
      .eq('id', userId);
    
    return 10;
  }
  
  return data.games_remaining;
}
```

**Testing Strategy:**
- Test limit enforcement across sessions
- Verify daily reset functionality
- Validate user experience when limit is reached

## Phase 4: Polish & Release Preparation

### 4.1 Implement Accessibility Features

**Goal:** Make the game accessible to a wide range of players.

**Implementation Details:**
- Add colorblind support modes
- Implement control sensitivity settings
- Add text size options for UI elements
- Create reduced motion mode
- Implement alternative control schemes
- Add high contrast mode for visual elements

```typescript
// src/lib/accessibility/accessibilityStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccessibilityState {
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  controlSensitivity: number; // 0.5 to 2.0
  alternativeControls: boolean;
  
  setColorBlindMode: (mode: AccessibilityState['colorBlindMode']) => void;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setLargeText: (enabled: boolean) => void;
  setControlSensitivity: (value: number) => void;
  setAlternativeControls: (enabled: boolean) => void;
  resetSettings: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      colorBlindMode: 'none',
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      controlSensitivity: 1.0,
      alternativeControls: false,
      
      setColorBlindMode: (mode) => set({ colorBlindMode: mode }),
      setHighContrast: (enabled) => set({ highContrast: enabled }),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setLargeText: (enabled) => set({ largeText: enabled }),
      setControlSensitivity: (value) => set({ 
        controlSensitivity: Math.max(0.5, Math.min(2.0, value)) 
      }),
      setAlternativeControls: (enabled) => set({ alternativeControls: enabled }),
      resetSettings: () => set({
        colorBlindMode: 'none',
        highContrast: false,
        reducedMotion: false,
        largeText: false,
        controlSensitivity: 1.0,
        alternativeControls: false
      })
    }),
    {
      name: 'nemo-accessibility-settings'
    }
  )
);
```

**Testing Strategy:**
- Test with various accessibility settings enabled
- Verify settings persistence across sessions
- Validate accessibility with diverse user testing

### 4.2 Implement Performance Optimization

**Goal:** Ensure smooth gameplay across all target devices.

**Implementation Details:**
- Add adaptive quality settings based on device capability
- Implement frame rate monitoring and adjustment
- Create asset optimization for mobile devices
- Implement efficient memory management
- Add loading screen with progress indicators

```typescript
// src/lib/performance/qualitySettings.ts
export class QualityManager {
  private qualityLevel: 'low' | 'medium' | 'high' = 'medium';
  private fpsHistory: number[] = [];
  private lastFrameTime = 0;
  private settings = {
    low: {
      maxParticles: 50,
      shadowsEnabled: false,
      drawDistance: 100,
      postProcessing: false,
      maxObstacles: 15
    },
    medium: {
      maxParticles: 200,
      shadowsEnabled: true,
      drawDistance: 200,
      postProcessing: true,
      maxObstacles: 25
    },
    high: {
      maxParticles: 500,
      shadowsEnabled: true,
      drawDistance: 300,
      postProcessing: true,
      maxObstacles: 40
    }
  };
  
  constructor() {
    this.detectCapabilities();
    this.applyQualitySettings();
  }
  
  update(): void {
    // Calculate current FPS
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    const fps = 1000 / delta;
    this.fpsHistory.push(fps);
    
    // Keep last 60 frames
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }
    
    // Check if we need to adjust quality
    if (this.fpsHistory.length >= 60) {
      const avgFps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / 
                    this.fpsHistory.length;
      
      if (avgFps < 30 && this.qualityLevel !== 'low') {
        this.qualityLevel = 'low';
        this.applyQualitySettings();
      } else if (avgFps > 45 && avgFps < 55 && this.qualityLevel === 'high') {
        this.qualityLevel = 'medium';
        this.applyQualitySettings();
      } else if (avgFps > 58 && this.qualityLevel === 'low') {
        this.qualityLevel = 'medium';
        this.applyQualitySettings();
      }
    }
  }
}
```

**Testing Strategy:**
- Test on various device capabilities
- Measure performance improvements with optimization
- Verify smooth quality transitions

### 4.3 Implement Audio System

**Goal:** Create immersive audio experience with underwater sounds.

**Implementation Details:**
- Add background music with underwater ambience
- Implement sound effects for game actions
- Create adaptive music based on gameplay state
- Add audio settings with volume controls
- Implement sound effects for different environments

```typescript
// src/lib/audio/audioManager.ts
export class AudioManager {
  private sounds = new Map<string, HTMLAudioElement>();
  private music: HTMLAudioElement | null = null;
  private effectsVolume = 0.7;
  private musicVolume = 0.5;
  private muted = false;
  private currentEnvironment = 'coralReef';
  
  constructor() {
    this.loadSounds();
    this.setupMusic();
  }
  
  setEnvironment(environment: string): void {
    if (this.currentEnvironment === environment) return;
    
    this.currentEnvironment = environment;
    
    // Fade out current music
    if (this.music) {
      this.fadeOut(this.music, 2000).then(() => {
        // Start environment-specific music
        this.playMusic(`${environment}_theme`);
      });
    } else {
      this.playMusic(`${environment}_theme`);
    }
  }
  
  playSound(id: string, volume = 1.0): void {
    if (this.muted) return;
    
    const sound = this.sounds.get(id);
    if (sound) {
      // Clone for overlapping sounds
      const soundInstance = sound.cloneNode() as HTMLAudioElement;
      soundInstance.volume = volume * this.effectsVolume;
      soundInstance.play();
    }
  }
  
  private fadeOut(audio: HTMLAudioElement, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startVolume = audio.volume;
      const interval = 50;
      const steps = duration / interval;
      const volumeStep = startVolume / steps;
      
      const fadeInterval = setInterval(() => {
        if (audio.volume <= volumeStep) {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = startVolume;
          clearInterval(fadeInterval);
          resolve();
        } else {
          audio.volume -= volumeStep;
        }
      }, interval);
    });
  }
}
```

**Testing Strategy:**
- Test audio on various devices
- Verify volume control functionality
- Validate audio transitions between environments

### 4.4 Final Game Balancing

**Goal:** Ensure the game provides appropriate challenge and enjoyment.

**Implementation Details:**
- Fine-tune difficulty progression
- Balance power-up effects and durations
- Adjust obstacle patterns for fair challenge
- Calibrate scoring system for balanced rewards
- Implement final tuning based on playtesting feedback

```typescript
// Difficulty balancing parameters
export const gameBalanceConfig = {
  // Initial game parameters
  initialSpeed: 1.0,
  initialObstacleDensity: 0.3,
  
  // Progression parameters
  maxSpeed: 3.0,
  speedIncreasePerDistance: 0.0001, // Units per distance unit
  maxObstacleDensity: 0.8,
  obstacleRampUpDistance: 5000, // Distance over which to reach max density
  
  // Power-up balancing
  powerUpDurations: {
    SHIELD: 15,
    SPEED_BOOST: 8,
    BUBBLE_MAGNET: 12,
    TIME_SLOW: 5,
    SCORE_MULTIPLIER: 10
  },
  
  powerUpProbabilities: {
    SHIELD: 0.3,
    SPEED_BOOST: 0.2,
    BUBBLE_MAGNET: 0.15,
    TIME_SLOW: 0.1,
    SCORE_MULTIPLIER: 0.25
  },
  
  // Collectible balancing
  collectibleValues: {
    SMALL_BUBBLE: 10,
    MEDIUM_BUBBLE: 25,
    LARGE_BUBBLE: 50,
    GOLDEN_BUBBLE: 100
  },
  
  collectibleProbabilities: {
    SMALL_BUBBLE: 0.7,
    MEDIUM_BUBBLE: 0.2,
    LARGE_BUBBLE: 0.08,
    GOLDEN_BUBBLE: 0.02
  },
  
  // Score balancing
  distanceScoreMultiplier: 1, // Points per distance unit
  closeCallBonusPercentage: 10, // % bonus for near misses
  flowStateRampUp: 5, // % increase per second of obstacle-free swimming
  flowStateMaxMultiplier: 3 // Maximum multiplier from flow state
};
```

**Testing Strategy:**
- Extensive playtesting across skill levels
- Collect feedback on difficulty progression
- Verify scoring balance for different play styles

## Implementation Timeline

### Week 1-3: Core Gameplay Enhancement
- Week 1: Progressive difficulty system and advanced obstacle patterns
- Week 2: Enhanced physics system and power-up improvements
- Week 3: Game over system and scoring refinement

### Week 4-5: Environment & Visual Expansion
- Week 4: Multiple underwater zones and environmental obstacles
- Week 5: Visual effects system and parallax backgrounds

### Week 6-7: Backend Integration
- Week 6: Clerk authentication and Supabase database setup
- Week 7: Leaderboard system and usage limit implementation

### Week 8: Polish & Release Preparation
- Week 8: Accessibility, performance optimization, audio system, and final balance

## Conclusion

This implementation plan provides a structured approach to completing the NEMO Runner game based on the current progress and core requirements. The plan focuses on enhancing the core gameplay, expanding the visual environment, implementing backend features, and polishing the game for release.

By following this plan, the development team will be able to deliver a high-quality underwater endless runner with engaging gameplay, vibrant visuals, and competitive features that align with the original vision outlined in the project documentation.
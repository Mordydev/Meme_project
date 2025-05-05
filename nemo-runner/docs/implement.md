# Finding Nemo Underwater Runner: Comprehensive Implementation Plan

## Project Overview

The Finding Nemo Underwater Runner is a 2.5D endless runner game with Pixar-inspired aesthetics where players control "Bubbles" the clownfish through vibrant underwater environments, collecting power-ups, avoiding obstacles, and competing for high scores.

### Key Features
- Pixar-inspired underwater visuals with multiple environment zones
- Progressive difficulty with diverse obstacles and challenges
- Daily/weekly/monthly leaderboards with SOL rewards
- Daily play limits (10 games for registered users, 1 for anonymous)
- Mobile and desktop compatibility with responsive design

### Technology Stack
- **Frontend**: Next.js 14+ with App Router
- **3D Rendering**: Three.js with React Three Fiber
- **Backend**: Supabase for database, authentication, and storage
- **Authentication**: Clerk with Supabase integration
- **Deployment**: Vercel for hosting and CI/CD

## Implementation Tasks

## Task 1: Project Setup & Core Architecture

### Sub-Task 1.1: Initialize Next.js Project
**Goal:** Create project foundation with Next.js and TypeScript

**Essential Requirements:**
- Next.js 14+ with App Router setup
- TypeScript configuration with strict type checking
- ESLint and Prettier for code quality
- Folder structure optimized for game development

```bash
# Initialize project
npx create-next-app@latest nemo-runner --typescript
cd nemo-runner
npm install three @types/three @react-three/fiber @react-three/drei
npm install @supabase/supabase-js @clerk/nextjs framer-motion
```

**Folder Structure:**
```
src/
├── app/             # Next.js App Router pages
├── components/      # React components (UI, game elements)
├── game/            # Game-specific code
│   ├── core/        # Game engine, loop, state management
│   ├── entities/    # Game objects (player, obstacles, collectibles)
│   ├── environment/ # Environment, effects, visuals
│   ├── physics/     # Collision, movement physics
│   └── audio/       # Sound effects and music
├── lib/             # Shared utilities
├── hooks/           # Custom React hooks
├── services/        # External APIs (Supabase, Clerk)
└── types/           # TypeScript definitions
```

**Potential Challenges:**
- Server vs. client components: Create clear boundaries with proper "use client" directives
- Asset loading strategy: Implement dynamic imports with suspense boundaries
- Type safety across game systems: Create comprehensive type definitions

### Sub-Task 1.2: Set Up Three.js Integration
**Goal:** Establish 3D rendering foundation with Three.js and React Three Fiber

**Essential Requirements:**
- Canvas setup with proper rendering configuration
- Camera system optimized for underwater view
- Base lighting for underwater atmosphere
- Responsive canvas that adapts to all device sizes

```tsx
// src/components/GameCanvas.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { AdaptiveDpr, PerspectiveCamera } from '@react-three/drei'

export default function GameCanvas({ children }) {
  return (
    <div className="w-full h-screen">
      <Canvas shadows>
        <AdaptiveDpr pixelated />
        <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={75} />
        <ambientLight intensity={0.4} color="#4a6a82" />
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  )
}
```

**Potential Challenges:**
- Performance across devices: Implement adaptive quality settings
- Memory management: Create proper disposal for Three.js resources
- Asset loading performance: Implement progressive and prioritized loading

### Sub-Task 1.3: Implement Asset Loading System
**Goal:** Create efficient asset management system for models, textures, and audio

**Essential Requirements:**
- Progressive asset loading with priority system
- Caching mechanism for loaded assets
- Loading progress tracking and visualization
- Error handling for failed asset loads

```tsx
// src/game/core/AssetManager.ts
export class AssetManager {
  private assets = new Map()
  private loadingPromises = new Map()
  
  async loadModel(key: string, url: string, priority = 1): Promise<THREE.Group> {
    if (this.assets.has(key)) return this.assets.get(key)
    
    if (!this.loadingPromises.has(key)) {
      const promise = new Promise((resolve, reject) => {
        const loader = new GLTFLoader()
        loader.load(url, 
          (gltf) => {
            this.assets.set(key, gltf.scene)
            resolve(gltf.scene)
          },
          (xhr) => console.log(`${key}: ${xhr.loaded / xhr.total * 100}% loaded`),
          (error) => reject(error)
        )
      })
      this.loadingPromises.set(key, promise)
    }
    
    return this.loadingPromises.get(key)
  }
}
```

**Potential Challenges:**
- Large asset files: Implement chunking and compression
- Initial load time: Create a progressive loading strategy
- Asset versioning: Implement cache-busting for updates

### Sub-Task 1.4: Create Game Loop & State Management
**Goal:** Implement core game cycle with state management

**Essential Requirements:**
- Frame-independent game loop
- State machine for game states (menu, playing, paused, game over)
- Event system for game communication
- Performance monitoring for frame rate

```tsx
// src/game/core/GameState.ts
export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER
}

export class GameStateManager {
  private currentState: GameState = GameState.MENU
  private listeners = new Map<GameState, Function[]>()
  
  setState(newState: GameState): void {
    const oldState = this.currentState
    this.currentState = newState
    
    // Notify listeners of state change
    const callbacks = this.listeners.get(newState) || []
    callbacks.forEach(callback => callback(oldState))
  }
  
  onEnterState(state: GameState, callback: Function): void {
    if (!this.listeners.has(state)) {
      this.listeners.set(state, [])
    }
    this.listeners.get(state)!.push(callback)
  }
}
```

**Potential Challenges:**
- React integration with game loop: Implement proper React state synchronization
- Maintaining performance: Use fixed timestep for physics, variable for rendering
- Game pause handling: Properly suspend physics while maintaining visuals

## Task 2: Player Character & Movement System

### Sub-Task 2.1: Create Player Character
**Goal:** Implement "Bubbles" character with Pixar-inspired visual style

**Essential Requirements:**
- Low-poly fish model with Pixar aesthetic (expressive, rounded forms)
- Animation system with swimming cycles
- Character orientation based on movement
- Hitbox configuration for collision detection

```tsx
// src/game/entities/Player.tsx
export class Player {
  model: THREE.Group
  animator: AnimationController
  hitbox: THREE.Box3
  
  constructor(model: THREE.Group, animations: THREE.AnimationClip[]) {
    this.model = model
    this.animator = new AnimationController(model, animations)
    this.hitbox = new THREE.Box3().setFromObject(model)
    
    // Set up initial state
    this.animator.playAnimation('idle', 0.5)
  }
  
  updateAnimation(velocity: THREE.Vector3): void {
    const speed = velocity.length()
    
    if (speed < 0.1) {
      this.animator.playAnimation('idle', 0.5)
    } else if (speed < 5) {
      this.animator.playAnimation('swim', 0.5)
    } else {
      this.animator.playAnimation('fastSwim', 0.5)
    }
  }
}
```

**Potential Challenges:**
- Achieving Pixar-like aesthetic: Focus on key characteristics (eyes, proportions)
- Animation transitions: Create blend system for smooth changes
- Secondary motion: Implement procedural fin and tail animation for natural movement

### Sub-Task 2.2: Implement Animation State Machine
**Goal:** Create fluid character animations with state transitions

**Essential Requirements:**
- Animation state machine with blending
- Animation states for different movement types
- Secondary motion for fins and tail
- Expression system for character reactions

```tsx
// src/game/entities/AnimationController.ts
export class AnimationController {
  private mixer: THREE.AnimationMixer
  private actions: Map<string, THREE.AnimationAction> = new Map()
  private currentAction: string | null = null
  
  constructor(model: THREE.Group, animations: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(model)
    
    // Setup animation actions
    animations.forEach(clip => {
      const action = this.mixer.clipAction(clip)
      this.actions.set(clip.name, action)
    })
  }
  
  playAnimation(name: string, transitionTime: number = 0.3): void {
    if (this.currentAction === name) return
    
    const newAction = this.actions.get(name)
    const oldAction = this.currentAction ? this.actions.get(this.currentAction) : null
    
    if (newAction) {
      newAction.reset()
      newAction.play()
      
      if (oldAction) {
        oldAction.crossFadeTo(newAction, transitionTime, true)
      }
      
      this.currentAction = name
    }
  }
}
```

**Potential Challenges:**
- Complex animation blending: Implement proper weighting system
- Procedural animation: Create secondary motion system for fins
- Maintaining fluid motion: Implement high-quality transitions

### Sub-Task 2.3: Implement Physics & Movement System
**Goal:** Create fluid, responsive underwater movement

**Essential Requirements:**
- Physics-based movement with water resistance
- 4-way directional control (up, down, left, right)
- Auto-forward movement with increasing speed
- Movement boundaries to keep player in view

```tsx
// src/game/physics/MovementSystem.ts
export class MovementSystem {
  readonly acceleration = new THREE.Vector3(40, 35, 2)
  readonly maxSpeed = new THREE.Vector3(8, 7, 12)
  readonly drag = 0.92 // Water resistance
  
  velocity = new THREE.Vector3()
  position = new THREE.Vector3()
  
  update(deltaTime: number, input: Vector2): void {
    // Apply input forces with acceleration
    this.velocity.x += input.x * this.acceleration.x * deltaTime
    this.velocity.y += input.y * this.acceleration.y * deltaTime
    this.velocity.z += this.acceleration.z * deltaTime // Constant forward
    
    // Apply drag (water resistance)
    this.velocity.multiplyScalar(this.drag)
    
    // Clamp to max speed
    this.velocity.x = THREE.MathUtils.clamp(this.velocity.x, 
                                          -this.maxSpeed.x, this.maxSpeed.x)
    this.velocity.y = THREE.MathUtils.clamp(this.velocity.y, 
                                          -this.maxSpeed.y, this.maxSpeed.y)
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime))
  }
}
```

**Potential Challenges:**
- Balancing responsive controls vs. realistic physics: Extensive playtesting required
- Cross-platform movement feel: Normalize input across devices
- Camera tracking: Implement smooth following without disconnection

### Sub-Task 2.4: Create Input System
**Goal:** Implement responsive, cross-platform controls

**Essential Requirements:**
- Keyboard controls for desktop (arrow keys/WASD)
- Touch/swipe controls for mobile
- Gamepad support (optional)
- Input sensitivity settings

```tsx
// src/game/core/InputSystem.ts
export class InputSystem {
  keyState = {
    up: false,
    down: false,
    left: false,
    right: false,
  }
  touchStart = { x: 0, y: 0 }
  output = new THREE.Vector2()
  sensitivity = 1.0
  
  constructor() {
    this.setupKeyboardListeners()
    this.setupTouchListeners()
  }
  
  setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') this.keyState.up = true
      // Handle other keys similarly...
      
      this.updateOutputVector()
    })
    
    window.addEventListener('keyup', (e) => {
      // Handle key up events...
    })
  }
  
  updateOutputVector(): void {
    this.output.set(
      (this.keyState.right ? 1 : 0) - (this.keyState.left ? 1 : 0),
      (this.keyState.up ? 1 : 0) - (this.keyState.down ? 1 : 0)
    )
    
    // Apply sensitivity
    this.output.multiplyScalar(this.sensitivity)
  }
}
```

**Potential Challenges:**
- Touch precision on various devices: Implement adaptive sensitivity
- Input latency: Create input prediction and buffering
- Cross-device consistency: Build device-specific optimizations

## Task 3: Environment & Obstacle System

### Sub-Task 3.1: Create Environment Zones
**Goal:** Implement diverse underwater environments with zone transitions

**Essential Requirements:**
- Multiple environment themes (coral reef, open ocean, deep sea)
- Unique visual style for each environment
- Smooth transitions between zones
- Background parallax layers for depth

```tsx
// src/game/environment/EnvironmentManager.ts
export class EnvironmentManager {
  private zones = new Map<string, EnvironmentZone>()
  private activeZone: string
  private transitionProgress = 0
  private nextZone: string | null = null
  
  constructor() {
    // Initialize environment zones
    this.zones.set('coralReef', new CoralReefZone())
    this.zones.set('openOcean', new OpenOceanZone())
    this.zones.set('deepSea', new DeepSeaZone())
    
    this.activeZone = 'coralReef'
  }
  
  update(deltaTime: number, playerDistance: number): void {
    // Update current environment
    this.zones.get(this.activeZone)?.update(deltaTime)
    
    // Check for zone transitions
    this.checkZoneTransition(playerDistance)
    
    // Update transition if in progress
    if (this.nextZone) this.updateTransition(deltaTime)
  }
}
```

**Potential Challenges:**
- Visual cohesion across environments: Create consistent artistic direction
- Performance with complex environments: Implement LOD system
- Memory management: Create streaming system for environment assets

### Sub-Task 3.2: Implement Procedural Generation
**Goal:** Create endless, varied environments

**Essential Requirements:**
- Procedural generation system for endless gameplay
- Template-based generation with randomization
- Chunk-based loading and unloading
- Seed support for reproducible generation

```tsx
// src/game/environment/ProceduralGenerator.ts
export class ProceduralGenerator {
  private chunks: EnvironmentChunk[] = []
  private seed: number
  private chunkSize = 50 // Units
  private visibleDistance = 300
  private loadedChunks = new Map<number, EnvironmentChunk>()
  
  constructor(seed?: number) {
    this.seed = seed || Math.random() * 1000000
  }
  
  update(playerPosition: THREE.Vector3): void {
    const currentChunkIndex = Math.floor(playerPosition.z / this.chunkSize)
    
    // Generate chunks ahead
    for (let i = currentChunkIndex; i <= currentChunkIndex + 
         Math.ceil(this.visibleDistance / this.chunkSize); i++) {
      if (!this.loadedChunks.has(i)) {
        this.generateChunk(i)
      }
    }
    
    // Unload chunks behind
    for (const [index, chunk] of this.loadedChunks.entries()) {
      if (index < currentChunkIndex - 2) {
        this.unloadChunk(index)
      }
    }
  }
}
```

**Potential Challenges:**
- Balancing variety vs. performance: Create efficient generation algorithms
- Maintaining gameplay flow: Ensure generated content is always passable
- Memory management: Implement efficient chunk recycling

### Sub-Task 3.3: Create Obstacle System
**Goal:** Implement diverse obstacles with unique behaviors

**Essential Requirements:**
- Multiple obstacle types (static, moving, pattern-based)
- Distinct visual styles for different obstacle categories
- Object pooling for performance optimization
- Increasing difficulty progression

```tsx
// src/game/obstacles/ObstacleManager.ts
export class ObstacleManager {
  private obstacles: Obstacle[] = []
  private objectPools = new Map<ObstacleType, Obstacle[]>()
  private difficultyLevel = 1
  private spawnDistance = 100 // Units ahead of player
  
  update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Update active obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i]
      obstacle.update(deltaTime)
      
      // Remove and recycle obstacles behind player
      if (obstacle.position.z > playerPosition.z + 10) {
        this.recycleObstacle(this.obstacles.splice(i, 1)[0])
      }
    }
    
    // Spawn new obstacles
    this.spawnObstaclesIfNeeded(playerPosition)
    
    // Gradually increase difficulty
    this.difficultyLevel += deltaTime * 0.01
  }
}
```

**Potential Challenges:**
- Varied but balanced difficulty: Create extensive pattern library
- Performance with many active obstacles: Implement efficient updates
- Creating fair but challenging patterns: Extensive playtesting required

### Sub-Task 3.4: Implement Collectible & Power-up System
**Goal:** Create engaging collectibles and power-ups

**Essential Requirements:**
- Different collectible types with varying values
- Diverse power-ups with unique effects
- Collection detection and feedback
- Power-up duration and stacking rules

```tsx
// src/game/powerups/PowerUpManager.ts
export class PowerUpManager {
  private activePowerUps = new Map<string, PowerUp>()
  
  update(deltaTime: number): void {
    // Update all active power-ups
    for (const [id, powerUp] of this.activePowerUps.entries()) {
      powerUp.update(deltaTime)
      
      // Remove expired power-ups
      if (powerUp.isExpired()) {
        powerUp.deactivate()
        this.activePowerUps.delete(id)
      }
    }
  }
  
  activatePowerUp(type: PowerUpType, duration: number): void {
    const id = `${type}_${Date.now()}`
    const powerUp = new PowerUp(type, duration)
    
    powerUp.activate()
    this.activePowerUps.set(id, powerUp)
  }
}
```

**Potential Challenges:**
- Power-up balance: Create satisfying but not overpowered effects
- Visual clarity: Design distinctive visuals for different types
- Collection satisfaction: Implement juice effects for feedback

## Task 4: Game UI & HUD

### Sub-Task 4.1: Implement Game HUD
**Goal:** Create responsive heads-up display

**Essential Requirements:**
- Score display with animation for changes
- Distance meter with environment indicators
- Power-up status indicators with timers
- Health/shield display

```tsx
// src/components/hud/ScoreDisplay.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, animate } from 'framer-motion'

export default function ScoreDisplay({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(score)
  
  useEffect(() => {
    if (score !== displayScore) {
      const animation = animate(displayScore, score, {
        duration: 0.5,
        onUpdate: (value) => setDisplayScore(Math.floor(value))
      })
      
      return () => animation.stop()
    }
  }, [score, displayScore])
  
  return (
    <motion.div 
      className="text-4xl font-bold text-white"
      initial={{ scale: 1 }}
      animate={{ scale: score > displayScore ? [1, 1.2, 1] : 1 }}
    >
      {displayScore.toLocaleString()}
    </motion.div>
  )
}
```

**Potential Challenges:**
- HUD readability across environments: Implement dynamic contrast
- Mobile vs. desktop layouts: Create responsive layouts
- Performance impact: Optimize UI animations and updates

### Sub-Task 4.2: Create Menu System
**Goal:** Implement intuitive game navigation interfaces

**Essential Requirements:**
- Main menu with underwater theming
- Pause menu with game state management
- Game over screen with score display
- Settings menu with audio, graphics, controls options

```tsx
// src/components/menus/MainMenu.tsx
'use client'

import { motion } from 'framer-motion'
import BubbleEffect from '../effects/BubbleEffect'

export default function MainMenu({ 
  onPlay, 
  onSettings, 
  onLeaderboard 
}: MainMenuProps) {
  return (
    <motion.div 
      className="w-full h-full flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BubbleEffect />
      
      <h1 className="text-5xl font-bold text-blue-400 mb-10">
        Finding Nemo Runner
      </h1>
      
      <div className="flex flex-col gap-4 w-64">
        <button 
          onClick={onPlay}
          className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-full"
        >
          Play Game
        </button>
        {/* Other menu buttons */}
      </div>
    </motion.div>
  )
}
```

**Potential Challenges:**
- Menu transitions: Create smooth state changes
- Mobile usability: Design touch-friendly interfaces
- Menu performance: Optimize background effects

### Sub-Task 4.3: Implement Tutorial System
**Goal:** Create intuitive onboarding experience

**Essential Requirements:**
- First-time tutorial with step-by-step guidance
- Contextual help for new mechanics
- Interactive demonstrations of core gameplay
- Skip option for experienced players

```tsx
// src/components/tutorial/TutorialStep.tsx
'use client'

import { motion } from 'framer-motion'

export default function TutorialStep({
  title,
  description,
  position,
  onComplete,
  onSkip
}: TutorialStepProps) {
  return (
    <motion.div 
      className="absolute bg-blue-900 bg-opacity-80 p-4 rounded-lg shadow-lg"
      style={{ ...getPositionStyles(position) }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-blue-100 mb-4">{description}</p>
      
      <div className="flex justify-between">
        <button 
          onClick={onSkip}
          className="text-blue-300 hover:text-white"
        >
          Skip Tutorial
        </button>
        <button 
          onClick={onComplete}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
        >
          Got it!
        </button>
      </div>
    </motion.div>
  )
}
```

**Potential Challenges:**
- Tutorial pacing: Create progressive difficulty introduction
- Mobile vs. desktop instructions: Adapt to input method
- Maintaining player engagement: Balance instruction with gameplay

### Sub-Task 4.4: Create Responsive Design System
**Goal:** Ensure optimal experience across all devices

**Essential Requirements:**
- Responsive layouts for all screen sizes
- Adaptive controls for touch vs. keyboard
- UI scaling based on device capabilities
- Layout adjustments for different aspect ratios

```tsx
// src/hooks/useResponsiveLayout.ts
export function useResponsiveLayout() {
  const [layout, setLayout] = useState({
    isMobile: false,
    scale: 1,
    orientation: 'landscape'
  })
  
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setLayout({
        isMobile: width < 768 || 
                 (navigator.maxTouchPoints > 0 && width < 1024),
        scale: Math.min(width / 1920, height / 1080),
        orientation: width > height ? 'landscape' : 'portrait'
      })
    }
    
    window.addEventListener('resize', updateLayout)
    updateLayout()
    
    return () => window.removeEventListener('resize', updateLayout)
  }, [])
  
  return layout
}
```

**Potential Challenges:**
- Wide variety of screen sizes: Create flexible UI components
- Touch accuracy on small screens: Implement large hit areas
- Performance variance: Create adaptive quality settings

## Task 5: Backend Integration

### Sub-Task 5.1: Set Up Supabase Backend
**Goal:** Implement database schema and API services

**Essential Requirements:**
- User profiles and authentication
- Leaderboard data structure
- Game session tracking
- Daily limit management

```sql
-- Key tables schema
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  games_played INTEGER DEFAULT 0,
  games_remaining INTEGER DEFAULT 10,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  score INTEGER NOT NULL,
  distance INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);
```

**Potential Challenges:**
- Schema optimization: Create proper indexes for queries
- Security implementation: Design thorough RLS policies
- Data validation: Create robust validation rules

### Sub-Task 5.2: Integrate Clerk Authentication
**Goal:** Set up user authentication and management

**Essential Requirements:**
- Authentication flow with Clerk
- User registration and login process
- Connection between Clerk and Supabase
- JWT token management

```tsx
// src/lib/auth/clerkClient.ts
import { clerkClient } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

export async function syncUserWithDatabase(userId: string) {
  try {
    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId)
    
    // Check if user exists in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user:', error)
      return
    }
    
    // Create user if doesn't exist
    if (!data) {
      await supabase.from('profiles').insert({
        id: userId,
        username: user.username || `player_${userId.slice(0, 8)}`,
        email: user.emailAddresses[0]?.emailAddress
      })
    }
  } catch (error) {
    console.error('Error syncing user:', error)
  }
}
```

**Potential Challenges:**
- Auth synchronization between systems: Create robust sync mechanism
- Session management across page refreshes: Implement secure storage
- User experience flow: Create seamless auth transitions

### Sub-Task 5.3: Implement Leaderboard System
**Goal:** Create competitive leaderboards with timeframes

**Essential Requirements:**
- Daily, weekly, and monthly leaderboards
- Score submission and verification
- Player ranking visualization
- Pagination for large leaderboards

```tsx
// src/lib/leaderboard/getLeaderboard.ts
export async function getLeaderboard(
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time',
  page = 0,
  limit = 10
) {
  const now = new Date()
  let startDate: Date
  
  // Calculate date range based on timeframe
  switch (timeframe) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0))
      break
    case 'weekly':
      const day = now.getDay()
      startDate = new Date(now.setDate(now.getDate() - day))
      startDate.setHours(0, 0, 0, 0)
      break
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'all-time':
    default:
      startDate = new Date(0) // Beginning of time
  }
  
  // Query leaderboard data
  const { data, error } = await supabase
    .from('scores')
    .select(`
      id,
      score,
      created_at,
      profiles:user_id (username, id)
    `)
    .gte('created_at', startDate.toISOString())
    .order('score', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)
  
  if (error) throw error
  return data
}
```

**Potential Challenges:**
- Performance with large leaderboards: Implement efficient pagination
- Real-time updates: Use Supabase Realtime or polling
- Anti-cheat measures: Implement basic score verification

### Sub-Task 5.4: Create Score Verification System
**Goal:** Implement basic anti-cheat mechanisms

**Essential Requirements:**
- Server-side score validation
- Game session verification
- Anomaly detection for suspicious scores
- Admin tools for score management

```tsx
// src/lib/scores/verifyScore.ts
export function verifyScore(score: GameScore) {
  // Verify based on game parameters
  const maxPossibleScore = score.duration * 100 + score.distance * 10
  
  // Check if score is within possible range
  if (score.value > maxPossibleScore * 1.2) {
    console.warn('Score exceeds possible maximum', 
                 {score: score.value, max: maxPossibleScore})
    return false
  }
  
  // Check collection rate
  const maxPossibleCollectibles = score.duration * 5
  if (score.collectibles > maxPossibleCollectibles * 1.2) {
    console.warn('Collectible count suspiciously high')
    return false
  }
  
  return true
}
```

**Potential Challenges:**
- Balance between security and false positives: Implement confidence levels
- Sophisticated cheating methods: Create layered verification
- Server-client synchronization: Implement secure verification mechanism

### Sub-Task 5.5: Implement Usage Limit System
**Goal:** Create daily game limit tracking and management

**Essential Requirements:**
- 10 games per day for authenticated users
- 1 game for anonymous users
- Daily reset at UTC midnight
- Clear visualization of remaining plays

```tsx
// src/lib/limits/usageLimits.ts
export async function getRemainingGames(userId?: string) {
  if (!userId) {
    // Anonymous user (1 game limit)
    const playCount = Number(localStorage.getItem('anon_plays') || '0')
    return Math.max(0, 1 - playCount)
  }
  
  // Get today's date in UTC
  const today = new Date().toISOString().split('T')[0]
  
  // Query remaining games
  const { data, error } = await supabase
    .from('profiles')
    .select('games_remaining, last_reset')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching remaining games:', error)
    return 0
  }
  
  // Check if we need to reset (new day)
  const lastReset = new Date(data.last_reset)
  const resetDate = new Date(today)
  
  if (lastReset < resetDate) {
    // Reset limit for new day
    await supabase
      .from('profiles')
      .update({ 
        games_remaining: 10,
        last_reset: new Date().toISOString()
      })
      .eq('id', userId)
    
    return 10
  }
  
  return data.games_remaining
}
```

**Potential Challenges:**
- Time zone handling: Use UTC consistently for limits
- Synchronization issues: Implement retry mechanisms
- UX for limit notifications: Create engaging messaging

## Task 6: Polish & Enhancement

### Sub-Task 6.1: Implement Audio System
**Goal:** Create immersive audio experience

**Essential Requirements:**
- Background music with underwater ambience
- Sound effects for game actions
- Adaptive music based on gameplay state
- Audio settings with volume controls

```tsx
// src/game/audio/AudioManager.ts
export class AudioManager {
  private sounds = new Map<string, HTMLAudioElement>()
  private music: HTMLAudioElement | null = null
  private effectsVolume = 0.7
  private musicVolume = 0.5
  private muted = false
  
  constructor() {
    this.loadSounds()
    this.setupMusic()
  }
  
  playSound(id: string, volume = 1.0): void {
    if (this.muted) return
    
    const sound = this.sounds.get(id)
    if (sound) {
      // Clone for overlapping sounds
      const soundInstance = sound.cloneNode() as HTMLAudioElement
      soundInstance.volume = volume * this.effectsVolume
      soundInstance.play()
    }
  }
}
```

**Potential Challenges:**
- Mobile audio limitations: Implement user gesture activation
- Audio balance: Create proper mixing for different sounds
- Performance impact: Optimize audio handling

### Sub-Task 6.2: Implement Visual Effects
**Goal:** Add polish with particles and shader effects

**Essential Requirements:**
- Bubble particle systems
- Water caustic lighting effects
- Collection and power-up visual feedback
- Underwater post-processing effects

```tsx
// src/game/effects/BubbleSystem.ts
export class BubbleSystem {
  private particles: THREE.InstancedMesh
  private dummy = new THREE.Object3D()
  private count: number
  private positions: Float32Array
  private velocities: Float32Array
  private scales: Float32Array
  
  constructor(scene: THREE.Scene, count = 100) {
    this.count = count
    
    // Create instanced bubble particles
    const geometry = new THREE.SphereGeometry(1, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5
    })
    
    this.particles = new THREE.InstancedMesh(geometry, material, count)
    this.positions = new Float32Array(count * 3)
    this.velocities = new Float32Array(count * 3)
    this.scales = new Float32Array(count)
    
    scene.add(this.particles)
    this.initParticles()
  }
}
```

**Potential Challenges:**
- Performance impact: Implement quality settings for effects
- Mobile compatibility: Create simplified effects for low-end devices
- Visual clarity: Ensure effects don't obscure gameplay

### Sub-Task 6.3: Implement Performance Optimization
**Goal:** Ensure smooth gameplay across all target devices

**Essential Requirements:**
- Device capability detection
- Adaptive quality settings
- Asset streaming and memory management
- Performance monitoring and analytics

```tsx
// src/lib/performance/QualityManager.ts
export class QualityManager {
  private qualityLevel: 'low' | 'medium' | 'high' = 'medium'
  private settings = {
    low: {
      maxParticles: 50,
      shadowsEnabled: false,
      drawDistance: 100,
      postProcessing: false
    },
    medium: {
      maxParticles: 200,
      shadowsEnabled: true,
      drawDistance: 200,
      postProcessing: true
    },
    high: {
      maxParticles: 500,
      shadowsEnabled: true,
      drawDistance: 300,
      postProcessing: true
    }
  }
  
  constructor() {
    this.detectCapabilities()
    this.applyQualitySettings()
  }
  
  private detectCapabilities(): void {
    // Check for mobile device
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i.test(
      navigator.userAgent
    )
    
    // Check GPU capabilities
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl')
    
    // Basic GPU capability check
    if (!gl || isMobile) {
      this.qualityLevel = 'low'
    } else {
      // More detailed capability checks...
    }
  }
}
```

**Potential Challenges:**
- Diverse device capabilities: Create fine-grained quality settings
- Memory management: Implement efficient asset streaming
- Performance bottlenecks: Use profiling to identify issues

### Sub-Task 6.4: Implement Accessibility Features
**Goal:** Ensure the game is accessible to all players

**Essential Requirements:**
- Color blindness support
- Adjustable difficulty options
- Alternative control schemes
- Text size and contrast adjustments

```tsx
// src/lib/accessibility/AccessibilitySettings.ts
export const accessibilitySettings = {
  colorBlindMode: false,
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  alternativeControls: false,
  textToSpeech: false,
  
  // Load settings from localStorage
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('accessibility_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        Object.assign(this, parsed)
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error)
    }
  },
  
  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('accessibility_settings', 
                            JSON.stringify(this))
    } catch (error) {
      console.error('Error saving accessibility settings:', error)
    }
  }
}
```

**Potential Challenges:**
- Balancing accessibility with visual style: Create flexible theming
- Testing across different needs: Implement comprehensive accessibility testing
- Performance impact: Optimize accessibility features

## Task 7: Testing & Deployment

### Sub-Task 7.1: Implement Comprehensive Testing
**Goal:** Ensure game quality and performance across platforms

**Essential Requirements:**
- Unit tests for core game systems
- Integration tests for backend services
- Performance benchmarking suite
- Playtesting framework

```tsx
// src/tests/game/physics.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MovementSystem } from '@/game/physics/MovementSystem'
import { Vector2 } from 'three'

describe('MovementSystem', () => {
  let movementSystem: MovementSystem
  
  beforeEach(() => {
    movementSystem = new MovementSystem()
  })
  
  it('applies input to velocity correctly', () => {
    const input = new Vector2(1, 0) // Moving right
    const deltaTime = 1/60 // 60fps
    
    movementSystem.update(deltaTime, input)
    
    expect(movementSystem.velocity.x).toBeGreaterThan(0)
    expect(movementSystem.velocity.y).toBeCloseTo(0)
  })
  
  it('respects maximum velocity limits', () => {
    const input = new Vector2(1, 1) // Moving up-right
    
    // Apply large delta time to exceed max speed
    movementSystem.update(1.0, input)
    
    expect(movementSystem.velocity.x).toBeLessThanOrEqual(
      movementSystem.maxSpeed.x
    )
    expect(movementSystem.velocity.y).toBeLessThanOrEqual(
      movementSystem.maxSpeed.y
    )
  })
})
```

**Potential Challenges:**
- Testing 3D visuals: Create specialized visual regression tools
- Device testing matrix: Implement device simulation
- Game state complexity: Create isolated test environments

### Sub-Task 7.2: Configure Next.js Deployment
**Goal:** Set up efficient deployment pipeline on Vercel

**Essential Requirements:**
- Optimized Next.js build configuration
- Environment variable management
- Asset optimization for deployment
- CI/CD pipeline with GitHub Actions

```tsx
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
    formats: ['image/webp'],
  },
  experimental: {
    optimizeCss: true,
    serverActions: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'],
    } : false,
  },
  webpack(config) {
    // Optimize asset loading
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/images',
          outputPath: 'static/images',
          name: '[name].[hash].[ext]',
        },
      },
    })
    
    return config
  },
}

module.exports = nextConfig
```

**Potential Challenges:**
- Build size optimization: Implement code splitting
- Asset delivery optimization: Configure CDN and caching
- Environment configuration: Create secure environment variable management

### Sub-Task 7.3: Implement Analytics & Monitoring
**Goal:** Set up systems to track game performance and usage

**Essential Requirements:**
- Game usage analytics
- Performance monitoring
- Error tracking and reporting
- User behavior insights

```tsx
// src/lib/analytics/GameAnalytics.ts
export class GameAnalytics {
  trackSessionStart(userId?: string) {
    this.trackEvent('session_start', {
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous',
      deviceInfo: this.getDeviceInfo()
    })
  }
  
  trackGameOver(score: number, distance: number, playTime: number) {
    this.trackEvent('game_over', {
      score,
      distance,
      playTime,
      timestamp: new Date().toISOString()
    })
  }
  
  trackError(error: Error, context = {}) {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  }
}
```

**Potential Challenges:**
- Privacy compliance: Implement user consent mechanisms
- Data volume management: Create efficient data sampling
- Actionable insights: Design useful metrics and dashboards

### Sub-Task 7.4: Prepare Launch Plan
**Goal:** Create comprehensive strategy for release

**Essential Requirements:**
- Launch checklist with verification steps
- Rollout strategy with staged deployment
- Post-launch monitoring plan
- Initial marketing and community activities

**Launch Checklist:**
1. Verify all core game functionality
2. Test on all target devices and browsers
3. Validate backend services and leaderboards
4. Confirm authentication flows
5. Test reward distribution system
6. Verify analytics implementation
7. Prepare social media announcements
8. Set up community support channels
9. Configure monitoring alerts
10. Prepare post-launch update schedule

**Potential Challenges:**
- Initial server load: Implement scaling strategy
- User feedback management: Create community channels
- Launch timing coordination: Create detailed timeline

## Development Timeline

- **Task 1 & 2**: 2 weeks (Project setup, core mechanics)
- **Task 3**: 2 weeks (Environment, obstacles, collectibles)
- **Task 4**: 1.5 weeks (UI/HUD, menus, tutorial)
- **Task 5**: 1.5 weeks (Backend, authentication, leaderboards)
- **Task 6**: 1.5 weeks (Audio, effects, optimization)
- **Task 7**: 1.5 weeks (Testing, deployment, launch)

**Total Development Time**: 10 weeks

## Critical Success Factors

1. **Performance Optimization**: Must maintain stable 60fps on mid-range devices, 30fps on low-end
2. **Visual Quality**: Must capture Pixar-inspired underwater aesthetic
3. **Responsive Controls**: Must have fluid, intuitive movement on both desktop and mobile
4. **Game Balance**: Must present fair but engaging challenge progression
5. **Backend Reliability**: Must support leaderboards and authentication consistently
6. **Accessibility**: Must be enjoyable for players with different capabilities

## Conclusion

This implementation plan provides a comprehensive roadmap for developing the Finding Nemo Underwater Runner game using Next.js. It covers all critical aspects of game development, from core mechanics to visual polish, backend integration, and deployment strategies. By following this structured approach, the development team can create a high-quality game that delivers an engaging underwater experience while maintaining the Pixar-inspired aesthetic central to the Pixarfication ecosystem.

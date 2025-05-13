// src/lib/game/config/gameConfig.ts

// Interface for PowerUp specific configurations
export interface PowerUpVisualConfig {
  color?: number;
  emissive?: number;
  emissiveIntensity?: number;
  opacity?: number;
}

export interface PowerUpConfig {
  duration: number; // Default duration in seconds
  visual?: PowerUpVisualConfig; // Optional visual configuration
}

export interface PowerUpsGameConfig {
  shield: PowerUpConfig & { visual?: PowerUpVisualConfig }; // Shield with visual override
  magnet: PowerUpConfig & { attractionRadius: number; attractionSpeed?: number }; // Magnet specific
  doublescore: PowerUpConfig;
  spawnIntervalMin: number;
  spawnIntervalMax: number;
}

// Interface for difficulty tier configuration
export interface DifficultyTierConfig {
  distanceThreshold: number; // Distance at which this tier becomes active
  playerSpeedMultiplier: number; // Multiplier for base player forward speed
  obstacleSpawnRateMultiplier: number; // Multiplier for obstacle spawn rate (e.g., 1.2 means 20% faster spawns)
  obstacleComplexityFactor: number; // 0-1, influencing pattern complexity or type selection
}

// Interface for overall difficulty configuration
export interface DifficultyGameConfig {
  tiers: DifficultyTierConfig[];
  basePlayerSpeed: number; // The player's speed at tier 0 / multiplier 1.0
  baseObstacleSpawnIntervalMin: number;
  baseObstacleSpawnIntervalMax: number;
  transitionSpeed: number; // How quickly to transition between difficulty tiers (0-1)
}

// Interface for Pufferfish obstacle configuration
export interface PufferfishConfig {
  baseRadius: number; // Normal radius before inflation
  inflatedRadius: number; // Maximum radius when fully inflated
  inflationDuration: number; // Time to fully inflate in seconds
  deflationDuration: number; // Time to fully deflate in seconds
  detectionRadius: number; // Distance at which pufferfish detects player and starts inflating
  inflationCooldown: number; // Time before pufferfish can inflate again after deflating
}

// Interface for Jellyfish obstacle configuration
export interface JellyfishConfig {
  bodyRadius: number; // Size of the main jellyfish body
  tentacleCount: number; // Number of tentacles
  tentacleLength: number; // Length of the tentacles
  tentacleSway: number; // How much the tentacles sway (0-1)
  driftSpeed: number; // Speed at which jellyfish drifts side to side
  driftAmplitude: number; // How far jellyfish drifts from center position
  verticalBobAmplitude: number; // How much jellyfish bobs up and down
  verticalBobSpeed: number; // Speed of vertical bobbing movement
}

// Interface for Shark obstacle configuration
export interface SharkConfig {
  patrolSpeed: number;        // Units per second horizontally
  patrolRangeX: number;       // Max distance from spawn lane it can patrol
  baseScale: number;          // Overall size of the shark
}

// Interface for Sea Turtle obstacle configuration
export interface SeaTurtleConfig {
  baseScale: number;          // Overall size of the turtle
  forwardSpeedFactor: number; // Multiplier of player's base forward speed
  laneChangeTelegraphTime: number; // Seconds it signals before changing lane
  laneChangeDuration: number; // Seconds to complete the lane change
  minTimeInLane: number;      // Minimum time turtle stays in a lane
  maxTimeInLane: number;      // Maximum time turtle stays in a lane
  turnAngleDegrees: number;   // How much it visually turns to indicate lane change
}

// Interface for Kelp Wall obstacle configuration
export interface KelpWallObstacleConfig {
  baseScaleY: number;         // Defines the height of the kelp strands
  strandCountMin: number;     // Min number of kelp strands in a "wall" segment
  strandCountMax: number;     // Max number of kelp strands
  segmentWidthCoverage: number; // How much of a lane or multiple lanes it covers (e.g., 1.0 for one lane, 2.0 for two)
  swayAmplitude: number;      // How much the kelp sways
  swaySpeed: number;          // Speed of the swaying animation
}

// Interface for School of Fish obstacle configuration
export interface SchoolOfFishObstacleConfig {
  fishCountMin: number;       // Min number of fish in a school
  fishCountMax: number;       // Max number of fish
  schoolRadius: number;       // Radius defining the general spread of the school
  individualFishScale: number; // Size of each fish
  depthCoverage: number;      // How much vertical space the school occupies (making it hard to jump)
  formation: 'swarm' | 'wall'; // Swarm is more spread out, wall is a dense vertical curtain
  baseSpeedFactor: number;    // Speed relative to player's base speed
}

export interface ObstaclesConfig {
  pufferfish: PufferfishConfig;
  jellyfish: JellyfishConfig;
  shark: SharkConfig;
  seaTurtle: SeaTurtleConfig;
  kelpWall: KelpWallObstacleConfig;
  schoolOfFish: SchoolOfFishObstacleConfig;
}

export interface VisualSettings {
  skyColor: number | string;
  ambientLightColor: number | string;
  ambientLightIntensity: number;
  directionalLightColor: number | string;
  directionalLightIntensity: number;
  directionalLightPosition: { x: number; y: number; z: number };

  // Fog configuration
  fogColor: number | string;
  fogNearFactor: number; // e.g., 2.0 (fog starts at 2x cameraFar/some_base_distance)
  fogFarFactor: number;  // e.g., 5.0 (fog is dense at 5x cameraFar/some_base_distance)

  // Caustics configuration
  enableCaustics: boolean;
  causticIntensity: number; // Modulates the brightness of caustics
  causticScale: number;     // Controls the size of the caustic patterns
  causticSpeed: number;     // Controls the animation speed of caustics
  causticColor: number | string; // Color tint for caustics

  // Groundwork for God Rays (parameters for future implementation)
  enableGodRays: boolean;
  godRayLightSourceOffsetY: number; // Offset Y from directional light for god ray source visual

  // Particle Effects
  enableParticles: boolean;
  bubblesEnabled: boolean;
  bubbleCount: number;
  bubbleBaseSpeed: number;
  bubbleSize: number;
  bubbleSpawnAreaX: number; // Width over which bubbles spawn
  bubbleSpawnDepth: number; // Depth below seafloor bubbles spawn from

  dustEnabled: boolean;
  dustCount: number;
  dustSize: number;
  dustWanderSpeed: number;

  // Screen Effects (Post-Processing)
  enableScreenEffects: boolean;
  vignetteEnabled: boolean;
  vignetteIntensity: number; // 0 to 1 typically
  vignetteSmoothness: number; // Controls the falloff sharpness

  colorGradingEnabled: boolean;
  colorGradeIntensity: number; // How much to apply grading
  colorGradeTargetColor: number | string; // e.g., shift towards a deeper blue

  distortionEnabled: boolean;
  distortionIntensity: number; // Subtle water ripple effect
  distortionSpeed: number;
}

export interface PlayerSettings {
  moveSpeed: number; // Units per second
  laneWidth: number; // Width of a single lane
  laneChangeDuration: number; // Duration of the lane change animation
  initialLives: number;
  jumpHeight: number; // Max height of the jump arc
  jumpDuration: number; // Time to complete one jump (up and down)
  diveDepth: number; // Max depth of the dive arc
  diveDuration: number; // Time to complete one dive (down and up)
  invincibilityDuration: number; // Duration of invincibility after taking damage
  gravity?: number; // Optional: If using physics-based jump/dive
  normalYPosition: number; // Default Y position for the player
  
  // Clownfish visual properties
  clownFishBaseColor: number; // Main orange color
  clownFishStripeColor: number; // White stripe color
  clownFishStripeEdgeColor: number; // Dark edge around stripes
  clownFishFinAccentColor: number; // Color for fin edges/tips
  
  // Eye properties
  eyePupilColor: number; // Dark center of eye
  eyeIrisColor: number; // Colored part around pupil
  eyeHighlightColor: number; // Specular highlight on eye
  
  // Animation parameters
  tailFinFrequency: number; // Frequency of tail fin movement
  tailFinAmplitude: number; // Amplitude of tail fin movement
  pectoralFinFrequency: number; // Frequency of pectoral fin movement
  pectoralFinAmplitude: number; // Amplitude of pectoral fin movement
}

export interface GameConfig {
  player: PlayerSettings;
  collisions: {
    obstacleRadiusFactor: number; // Factor to scale obstacle bounding sphere radius for collision detection
  };
  world: {
    xBoundary: number;
    laneCount: number; // Number of lanes
  };
  camera: {
    offset: { x: number; y: number; z: number };
    lookAtOffset: { x: number; y: number; z: number };
    lerpFactor: number;
  };
  collectibles: {
    spawnIntervalMin: number; // Min seconds between pattern spawns
    spawnIntervalMax: number; // Max seconds
    spawnDistanceAhead: number; // How far ahead to spawn collectibles
  };
  powerUps: PowerUpsGameConfig; // Power-up configuration
  difficulty: DifficultyGameConfig; // Difficulty configuration
  obstacles: ObstaclesConfig; // Obstacle configuration
  visuals: VisualSettings; // Visual settings including lighting, fog, and caustics
}

// Default configuration values
export const defaultConfig: GameConfig = {
  player: {
    moveSpeed: 5,
    laneWidth: 2,
    laneChangeDuration: 0.2,
    initialLives: 2, // Player has two lives with the 2-lives system
    jumpHeight: 1.8, // Slightly reduced jump height for better obstacle interactions
    jumpDuration: 0.8,
    diveDepth: 0.5, // Adjusted dive depth to ensure player stays above seafloor (-0.45 - 0.5 = -0.95, seafloor at -1.0)
    diveDuration: 0.6, // Slightly quicker dive
    invincibilityDuration: 1.5, // Duration of invincibility after taking damage
    normalYPosition: -0.45, // Player's default Y position
    
    // Clownfish visual properties
    clownFishBaseColor: 0xFF9E30, // Bright orange
    clownFishStripeColor: 0xFFFFFF, // White
    clownFishStripeEdgeColor: 0x333333, // Dark grey
    clownFishFinAccentColor: 0x66BBFF, // Light blue
    
    // Eye properties
    eyePupilColor: 0x000000, // Black
    eyeIrisColor: 0x3366CC, // Blue
    eyeHighlightColor: 0xFFFFFF, // White
    
    // Animation parameters
    tailFinFrequency: 5.0, // Frequency of tail fin movement
    tailFinAmplitude: 0.3, // Amplitude of tail fin movement
    pectoralFinFrequency: 3.0, // Frequency of pectoral fin movement
    pectoralFinAmplitude: 0.15, // Amplitude of pectoral fin movement
  },
  collisions: {
    obstacleRadiusFactor: 0.7,
  },
  world: {
    xBoundary: 5,
    laneCount: 3,
  },
  camera: {
    offset: { x: 0, y: 2.5, z: 6 },
    lookAtOffset: { x: 0, y: 0.5, z: -10 },
    lerpFactor: 0.05,
  },
  visuals: {
    skyColor: 0x1a2b3c, // Darker blue for underwater
    ambientLightColor: 0x406080, // Bluish ambient
    ambientLightIntensity: 0.4,
    directionalLightColor: 0xa0c0ff, // Lighter blue/white sunlight from above
    directionalLightIntensity: 0.8,
    directionalLightPosition: { x: 0.5, y: 1, z: 0.3 }, // More overhead

    // Fog parameters
    fogColor: 0x1a2b3c, // Match sky/background for seamless blend
    fogNearFactor: 1.5,  // Start fog relatively close to player camera's Z offset
    fogFarFactor: 6.0,   // Fog becomes dense further out

    enableCaustics: true,
    causticIntensity: 0.25,
    causticScale: 8.0, // Larger scale for broader patterns
    causticSpeed: 0.05,
    causticColor: 0x90c0ff, // Light blue caustics

    enableGodRays: false, // Disabled for Phase 1 initial, focus on caustics
    godRayLightSourceOffsetY: 10,

    // Particle Effects
    enableParticles: true,
    bubblesEnabled: true,
    bubbleCount: 150,
    bubbleBaseSpeed: 0.2, // Units per second
    bubbleSize: 0.05,
    bubbleSpawnAreaX: 10, // Spawn across a 10 unit width
    bubbleSpawnDepth: 0.1, // Spawn slightly below surface

    dustEnabled: true,
    dustCount: 300,
    dustSize: 0.03,
    dustWanderSpeed: 0.02,

    // Screen Effects
    enableScreenEffects: true,
    vignetteEnabled: true,
    vignetteIntensity: 0.4,
    vignetteSmoothness: 0.5,

    colorGradingEnabled: true,
    colorGradeIntensity: 0.15,
    colorGradeTargetColor: 0x305080, // Shift towards a slightly deeper blue

    distortionEnabled: true, // Very subtle
    distortionIntensity: 0.005,
    distortionSpeed: 0.1,
  },
  collectibles: {
    spawnIntervalMin: 2.0,
    spawnIntervalMax: 3.5,
    spawnDistanceAhead: 20,
  },
  // Power-up configurations
  powerUps: {
    shield: {
      duration: 8, // 8 seconds of shield
      visual: {
        color: 0x00ccff, // Bright cyan
        emissive: 0x00ffff,
        emissiveIntensity: 1.5,
        opacity: 0.7
      }
    },
    magnet: {
      duration: 10,
      attractionRadius: 6.0, // 6.0 units radius (attracts from all lanes)
      attractionSpeed: 20 // Units per second for attraction speed
    },
    doublescore: { duration: 12 }, // 12 seconds of double score
    spawnIntervalMin: 8,  // Power-ups are rarer
    spawnIntervalMax: 15,
  },
  // Enhanced difficulty configuration with 7 tiers for extreme challenge progression
  difficulty: {
    basePlayerSpeed: 6.5, // Increased base speed for a faster starting pace (was 5)
    baseObstacleSpawnIntervalMin: 2.8, // Slightly faster obstacle spawning (was 3.0)
    baseObstacleSpawnIntervalMax: 4.5, // Slightly faster maximum interval (was 5.0)
    transitionSpeed: 0.8, // Faster transitions between difficulty tiers (was 0.7)
    tiers: [
      // Tier 1 - Starting phase (now faster)
      {
        distanceThreshold: 0,
        playerSpeedMultiplier: 1.0,
        obstacleSpawnRateMultiplier: 1.0,
        obstacleComplexityFactor: 0.2  // Slightly increased complexity at start (was 0.1)
      },
      // Tier 2 - First challenge (starts earlier)
      {
        distanceThreshold: 100,   // Earlier first tier change (was 150)
        playerSpeedMultiplier: 1.4,  // 40% speed increase (was 1.3)
        obstacleSpawnRateMultiplier: 1.5, // Higher spawn rate (was 1.4)
        obstacleComplexityFactor: 0.35 // More complex patterns (was 0.3)
      },
      // Tier 3 - Intermediate difficulty (starts earlier)
      {
        distanceThreshold: 250,   // Earlier third tier (was 350)
        playerSpeedMultiplier: 1.8,  // 80% speed increase (was 1.6)
        obstacleSpawnRateMultiplier: 2.0, // Double spawn rate (was 1.8)
        obstacleComplexityFactor: 0.55 // More complex (was 0.5)
      },
      // Tier 4 - Challenging
      {
        distanceThreshold: 500,   // Earlier threshold (was 600)
        playerSpeedMultiplier: 2.2,  // 2.2x speed (was 2.0)
        obstacleSpawnRateMultiplier: 2.4, // Higher spawn rate (was 2.2)
        obstacleComplexityFactor: 0.7  // More complex (was 0.65)
      },
      // Tier 5 - Hard
      {
        distanceThreshold: 800,   // Earlier threshold (was 900)
        playerSpeedMultiplier: 2.8,  // 2.8x speed (was 2.5)
        obstacleSpawnRateMultiplier: 2.8, // Higher spawn rate (was 2.6)
        obstacleComplexityFactor: 0.85 // More complex (was 0.8)
      },
      // Tier 6 - Very Hard
      {
        distanceThreshold: 1100,  // Earlier threshold (was 1300)
        playerSpeedMultiplier: 3.4,  // 3.4x speed (was 3.2)
        obstacleSpawnRateMultiplier: 3.2, // Higher spawn rate (was 3.0)
        obstacleComplexityFactor: 0.95 // Nearly maximum complexity (was 0.9)
      },
      // Tier 7 - Expert (4x+ starting speed)
      {
        distanceThreshold: 1500,  // Earlier final tier (was 1800)
        playerSpeedMultiplier: 4.2,  // 4.2x starting speed (was 4.0)
        obstacleSpawnRateMultiplier: 3.8,  // 3.8x faster obstacle spawning (was 3.5)
        obstacleComplexityFactor: 1.0   // Maximum complexity
      }
    ],
  },
  // New obstacle configurations
  obstacles: {
    pufferfish: {
      baseRadius: 0.35, // Normal size before inflation
      inflatedRadius: 0.85, // Size when fully inflated
      inflationDuration: 0.5, // Time to inflate in seconds
      deflationDuration: 0.8, // Time to deflate in seconds
      detectionRadius: 5.0, // Distance at which pufferfish detects player
      inflationCooldown: 1.0, // Time before pufferfish can inflate again
    },
    jellyfish: {
      bodyRadius: 0.4, // Size of the main jellyfish body
      tentacleCount: 8, // Number of tentacles
      tentacleLength: 1.2, // Length of the tentacles
      tentacleSway: 0.7, // How much the tentacles sway (0-1)
      driftSpeed: 0.8, // Speed of side-to-side movement
      driftAmplitude: 0.5, // How far jellyfish moves from center
      verticalBobAmplitude: 0.2, // How much jellyfish bobs up and down
      verticalBobSpeed: 0.6, // Speed of vertical bobbing movement
    },
    shark: {
      patrolSpeed: 1.5,     // Units per second horizontally
      patrolRangeX: 2.4,    // Patrols roughly one lane width to each side
      baseScale: 1.0,       // Default size
    },
    seaTurtle: {
      baseScale: 1.3,               // Turtles are fairly large obstacles
      forwardSpeedFactor: 0.75,     // Moves slower than the player, creating an overtaking challenge
      laneChangeTelegraphTime: 0.8, // Time it "signals" by turning
      laneChangeDuration: 0.5,      // Quick lane change after signal
      minTimeInLane: 3.0,           // Minimum time turtle stays in a lane
      maxTimeInLane: 6.0,           // Maximum time turtle stays in a lane
      turnAngleDegrees: 25,         // Visually turns 25 degrees to signal
    },
    kelpWall: {
      baseScaleY: 3.5,             // Quite tall, player can't jump over
      strandCountMin: 5,           // Minimum number of kelp strands
      strandCountMax: 8,           // Maximum number of kelp strands
      segmentWidthCoverage: 0.9,   // Covers most of one lane
      swayAmplitude: 0.1,          // Subtle sway
      swaySpeed: 0.5,              // Moderate sway speed
    },
    schoolOfFish: {
      fishCountMin: 15,            // Minimum fish in school
      fishCountMax: 25,            // Maximum fish in school
      schoolRadius: 1.2,           // General area they occupy
      individualFishScale: 0.15,   // Small individual fish
      depthCoverage: 2.5,          // Vertical spread, making it hard to jump
      formation: 'wall',           // Dense wall formation
      baseSpeedFactor: 0.9,        // Slightly slower than player
    }
  },
};
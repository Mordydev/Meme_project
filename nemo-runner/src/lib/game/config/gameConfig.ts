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

// Interface for Rock obstacle configuration
export interface RockConfig {
  baseScale: number;          // Overall size of the rock
  visuals: ObstacleStandardMaterialVisuals;
}

// Interface for Coral obstacle configuration
export interface CoralConfig {
  baseScale: number;          // Overall size of the coral
  branchCount: number;        // Number of coral branches
  branchLengthMin: number;    // Minimum length of branches
  branchLengthMax: number;    // Maximum length of branches
  visuals: ObstacleStandardMaterialVisuals;
}

// Interface for Clam obstacle configuration
export interface ClamConfig {
  baseScale: number;          // Overall size of the clam
  openAngle: number;          // Maximum angle when open (in radians)
  openCloseDuration: number;  // Time to complete one open/close cycle
  waitOpenDuration?: number;   // Optional: Time clam stays fully open
  waitClosedDuration?: number; // Optional: Time clam stays fully closed
  visuals: ObstacleStandardMaterialVisuals;
  interior?: {
    mainColor: number | string;
    roughness?: number;
    metalness?: number;
    emissiveColor?: number | string;
    emissiveIntensity?: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
  };
}

// Interface for visual configuration using MeshStandardMaterial
export interface ObstacleStandardMaterialVisuals {
  mainColor: number | string;
  detailColor?: number | string; // For secondary colors, patterns
  emissiveColor?: number | string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transmission?: number; // For jellyfish, etc.
  clearcoat?: number;
  clearcoatRoughness?: number;
  textureMapUrl?: string; // Optional: URL for a simple pattern/detail texture
  normalMapUrl?: string; // Optional: URL for a simple normal map
  animationSpeed?: number; // Animation speed multiplier (renamed from animationFrequency for consistency)
  animationAmplitude?: number; // Animation amplitude multiplier
  texturePatternScale?: number; // For turtle shell, shark skin, etc.
  interior?: {
    mainColor: number | string;
    roughness?: number;
    metalness?: number;
    emissiveColor?: number | string;
    emissiveIntensity?: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
  };
}

// Interface for Pufferfish obstacle configuration (RE-ADD MINIMAL)
export interface PufferfishConfig {
  baseRadius: number; 
  inflatedRadius: number;     // Maximum radius when fully inflated
  inflationDuration: number;  // Time to fully inflate in seconds
  deflationDuration: number;  // Time to fully deflate in seconds
  detectionRadius: number;    // Distance at which pufferfish detects player and starts inflating
  inflationCooldown: number;  // Time before pufferfish can inflate again after deflating
  spikeCount?: number;         // Optional: Number of spikes
  spikeLengthFactor?: number;  // Optional: Factor of baseRadius for spike length
  spikeRadiusFactor?: number;  // Optional: Factor of baseRadius for spike base radius
  visuals: ObstacleStandardMaterialVisuals; 
}

// Interface for Jellyfish obstacle configuration
export interface JellyfishConfig {
  bodyRadius: number; // Size of the main jellyfish body
  tentacleCount: number; // Number of tentacles
  tentacleLength: number; // Length of the tentacles
  tentacleRadius: number; // Base radius of tentacles (for tapering)
  tentacleSway: number; // How much the tentacles sway (0-1)
  driftSpeed: number; // Speed at which jellyfish drifts side to side
  driftAmplitude: number; // How far jellyfish drifts from center position
  verticalBobAmplitude: number; // How much jellyfish bobs up and down
  verticalBobSpeed: number; // Speed of vertical bobbing movement
  pulseSpeed: number; // Speed of the bell pulsing animation
  pulseIntensityMin: number; // Min scale factor for bell pulsing
  pulseIntensityMax: number; // Max scale factor for bell pulsing
  visuals: ObstacleStandardMaterialVisuals;
}

// Interface for Shark obstacle configuration
export interface SharkVisualsConfig extends ObstacleStandardMaterialVisuals {
  underbellyColor?: number | string;
  teethColor?: number | string;
  teethRoughness?: number;
  teethMetalness?: number;
  teethCountUpper?: number;
  teethCountLower?: number;
  jawAnimationSpeed?: number; // Speed of jaw opening/closing
  jawMaxAngleDeg?: number;  // Max angle jaw opens in degrees
  gillAnimationSpeed?: number; // Speed of gill pulsing
  gillAnimationAmplitude?: number; // Amplitude of gill pulsing (scale factor)
}

export interface SharkConfig {
  patrolSpeed: number;        // Units per second horizontally
  patrolRangeX: number;       // Max distance from spawn lane it can patrol
  baseScale: number;          // Overall size of the shark
  visuals: SharkVisualsConfig;
}

// Interface for Sea Turtle obstacle configuration
export interface SeaTurtleConfig {
  baseScale: number;          // Overall size of the turtle
  forwardSpeedFactor: number; // Multiplier of player's base forward speed
  laneChangeTelegraphTime: number; // Seconds it signals before changing lane
  laneChangeDuration: number; // Seconds to complete the lane change
  minTimeInLane: number;      // Minimum time turtle stays in a lane
  maxTimeInLane: number;      // Maximum time turtle stays in a lane
  proximityTriggerDistance: number; // Distance from player that forces a lane change
  turnAngleDegrees: number;   // How much it visually turns to indicate lane change
  visuals: ObstacleStandardMaterialVisuals & {
    shellPatternColor?: number | string, 
    skinColor?: number | string,
    shellBumpScale?: number; 
    bankFactor?: number; // Added for turn banking intensity
  };
}

// Interface for Kelp Wall obstacle configuration
export interface KelpWallObstacleConfig {
  baseScaleY: number;         // Defines the height of the kelp strands
  strandCountMin: number;     // Min number of kelp strands in a "wall" segment
  strandCountMax: number;     // Max number of kelp strands
  segmentWidthCoverage: number; // How much of a lane or multiple lanes it covers (e.g., 1.0 for one lane, 2.0 for two)
  swayAmplitude: number;      // How much the kelp sways
  swaySpeed: number;          // Speed of the swaying animation
  /** Optional radius for stalk geometry. */
  stalkRadius?: number;
  /** Optional number of fronds per stalk. */
  frondCount?: number;
  visuals: ObstacleStandardMaterialVisuals;
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
  visuals: ObstacleStandardMaterialVisuals;
}

export interface ObstaclesConfig {
  /** Distance behind the player where obstacles are recycled */
  recycleDistance: number;
  pufferfish: PufferfishConfig; // RE-ADD
  jellyfish: JellyfishConfig;
  shark: SharkConfig;
  seaTurtle: SeaTurtleConfig;
  kelpWall: KelpWallObstacleConfig;
  schoolOfFish: SchoolOfFishObstacleConfig;
  rock: RockConfig;
  coral: CoralConfig;
  clam: ClamConfig;
}

export interface DecorationSpawnConfig {
  spawnCount: number;
  scaleMin: number;
  scaleMax: number;
}

export interface DecorationItemConfig {
  colors: Array<number | string>;
  scaleMin: number;
  scaleMax: number;
}

export interface DecorationsConfig {
  pebble: DecorationItemConfig;
  smallRock: DecorationItemConfig;
  clam: DecorationItemConfig;
  kelp: DecorationItemConfig;
  starfish: DecorationItemConfig;
}

export interface SeafloorVisualConfig {
  baseColor: number | string;
  sandPatternColor1: number | string;
  sandPatternColor2: number | string;
  textureScale: number;
  /**
   * Resolution of the procedurally generated sand texture.
   * Higher values yield finer detail at the cost of generation time.
   */
  textureResolution?: number;
  bumpScale?: number;
  roughness?: number;
  metalness?: number;
  pebbleColors?: Array<number | string>;
  pebbleDensity?: number;
  pebbleSizeRange?: [number, number];
  /**
   * Width of the center area to keep clear of decorations.
   * Typically set to approximately one player lane width.
   */
  decorationSideMargin?: number;
  decorations?: {
    pebbles: DecorationSpawnConfig;
    smallRocks: DecorationSpawnConfig;
    clams: DecorationSpawnConfig;
    kelp: DecorationSpawnConfig;
    starfish: DecorationSpawnConfig;
  };
}

export interface WaterSurfaceVisualConfig {
  baseColor: number | string;
  rippleColor: number | string;
  rippleSpeed: number;
  rippleScale: number;
  rippleIntensity: number;
  opacity: number;
  fresnelPower?: number;
  specularColor?: number | string;
  shininess?: number;
}

export interface LightingConfig {
  ambientLight: { color: number; intensity: number };
  directionalLight: {
    color: number;
    intensity: number;
    position: { x: number; y: number; z: number };
    castShadow?: boolean;
    shadowMapSize?: number;
  };
  fogColor: number | string;
  fogDensity?: number;
  fogNear?: number;
  fogFar?: number;
  enableCaustics: boolean;
  causticColor: number | string;
  causticIntensity: number;
  causticScale: number;
  causticSpeed: number;
  causticBlendMode: 'additive' | 'multiply' | 'mix';
  causticReceiverObjects?: string[];
  enableGodRays: boolean;
  godRayColor?: number | string;
  godRayIntensity?: number;
  godRayDensity?: number;
  godRayWeight?: number;
  godRayDecay?: number;
  godRayExposure?: number;
  godRaySamples?: number;
}

export interface VisualSettings {
  skyColor: number | string;

  // Particle Effects
  enableParticles: boolean;
  bubblesEnabled: boolean;
  bubbleCount: number;
  bubbleBaseSpeed: number;
  bubbleSize: number;
  bubbleSpawnAreaX: number;
  bubbleSpawnDepth: number;

  dustEnabled: boolean;
  dustCount: number;
  dustSize: number;
  dustWanderSpeed: number;

  // Screen Effects (Post-Processing)
  enableScreenEffects: boolean;
  vignetteEnabled: boolean;
  vignetteIntensity: number;
  vignetteSmoothness: number;

  colorGradingEnabled: boolean;
  colorGradeIntensity: number;
  colorGradeTargetColor: number | string;

  distortionEnabled: boolean;
  distortionIntensity: number;
  distortionSpeed: number;

  // Screen Flash & Camera Shake
  screenFlash: {
    flashColorMinor: string;
    flashDurationMinor: number;
    flashColorMajor: string;
    flashDurationMajor: number;
  };
  cameraShake: {
    shakeIntensityMinor: number;
    shakeDurationMinor: number;
    shakeIntensityMajor: number;
    shakeDurationMajor: number;
  };

  seafloor: SeafloorVisualConfig;
  waterSurface: WaterSurfaceVisualConfig;
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
  decorations: DecorationsConfig; // Decoration assets configuration
  visuals: VisualSettings;
  lighting: LightingConfig;
}

// Default configuration values
export const defaultConfig: GameConfig = {
  player: {
    moveSpeed: 5,
    laneWidth: 2,
    laneChangeDuration: 0.2,
    initialLives: 3,
    jumpHeight: 1.5,
    jumpDuration: 0.6,
    diveDepth: 1.0,
    diveDuration: 0.5,
    invincibilityDuration: 1.5,
    normalYPosition: 0, // Default Y, can be adjusted based on player model size

    // Clownfish Visuals
    clownFishBaseColor: 0xff6600, // Vibrant orange
    clownFishStripeColor: 0xffffff, // Bright white
    clownFishStripeEdgeColor: 0x111111, // Dark, thin edge for definition
    clownFishFinAccentColor: 0xffaa00, // Lighter orange/yellow for fin tips

    // Eye Properties
    eyePupilColor: 0x000000,
    eyeIrisColor: 0x333333, // Dark iris, could be orange/brown too
    eyeHighlightColor: 0xffffff,

    // Animation Parameters
    tailFinFrequency: 5,
    tailFinAmplitude: 0.25,
    pectoralFinFrequency: 7,
    pectoralFinAmplitude: 0.15,
  },
  collisions: {
    obstacleRadiusFactor: 0.8,
  },
  world: {
    xBoundary: 5, // Example: 3 lanes of width 2 = 6 units, so boundary is 3. Player starts at center.
    laneCount: 3,
  },
  camera: {
    offset: { x: 0, y: 2, z: 3.5 }, // z is distance behind player
    lookAtOffset: { x: 0, y: 1, z: 0 }, // Looks slightly above player's root
    lerpFactor: 0.05, // Smoothness of camera follow
  },
  collectibles: {
    spawnIntervalMin: 3, // Min seconds between pattern spawns
    spawnIntervalMax: 6, // Max seconds
    spawnDistanceAhead: 50, // How far ahead to spawn collectibles
  },
  powerUps: {
    shield: { duration: 10, visual: { color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5, opacity: 0.5 } },
    magnet: { duration: 15, attractionRadius: 5, attractionSpeed: 15 },
    doublescore: { duration: 20 },
    spawnIntervalMin: 15, // Min seconds between power-up spawns
    spawnIntervalMax: 30, // Max seconds
  },
  difficulty: {
    tiers: [
      { distanceThreshold: 0, playerSpeedMultiplier: 1.0, obstacleSpawnRateMultiplier: 1.0, obstacleComplexityFactor: 0.2 },
      { distanceThreshold: 100, playerSpeedMultiplier: 1.5, obstacleSpawnRateMultiplier: 1.3, obstacleComplexityFactor: 0.5 },
      { distanceThreshold: 400, playerSpeedMultiplier: 2.0, obstacleSpawnRateMultiplier: 1.6, obstacleComplexityFactor: 0.8 },
      { distanceThreshold: 800, playerSpeedMultiplier: 2.6, obstacleSpawnRateMultiplier: 1.9, obstacleComplexityFactor: 1.0 },
      { distanceThreshold: 1250, playerSpeedMultiplier: 3.2, obstacleSpawnRateMultiplier: 2.2, obstacleComplexityFactor: 1.0 },
      { distanceThreshold: 2000, playerSpeedMultiplier: 3.8, obstacleSpawnRateMultiplier: 2.5, obstacleComplexityFactor: 1.0 },
      { distanceThreshold: 3000, playerSpeedMultiplier: 4.4, obstacleSpawnRateMultiplier: 2.8, obstacleComplexityFactor: 1.0 },
      { distanceThreshold: 4000, playerSpeedMultiplier: 5.0, obstacleSpawnRateMultiplier: 3.2, obstacleComplexityFactor: 1.0 },
    ],
    basePlayerSpeed: 8, // Initial speed for tier 0, units per second
    baseObstacleSpawnIntervalMin: 2.5,
    baseObstacleSpawnIntervalMax: 4.5,
    transitionSpeed: 0.1, // Smoothness factor for tier transitions
  },
  obstacles: {
    recycleDistance: 15,
    rock: {
      baseScale: 1,
      visuals: {
        mainColor: 0x888888, // Medium grey
        detailColor: 0x666666, // Darker grey for crevices/details
        roughness: 0.8,
        metalness: 0.1,
      },
    },
    coral: {
      baseScale: 0.9,
      branchCount: 5,
      branchLengthMin: 0.5,
      branchLengthMax: 1.0,
      visuals: {
        mainColor: 0xff7f50, // Coral color
        detailColor: 0xff6347, // Slightly darker coral
        roughness: 0.6,
        metalness: 0.0,
        emissiveColor: 0xff7f50,
        emissiveIntensity: 0.1,
      },
    },
    clam: {
      baseScale: 0.8,
      openAngle: Math.PI / 3,
      openCloseDuration: 2,
      waitOpenDuration: 3,
      waitClosedDuration: 5,
      visuals: {
        mainColor: 0xD8C0A8, // Sandy beige for shell exterior
        roughness: 0.7,
        metalness: 0.1,
        emissiveColor: 0xD8C0A8,
        emissiveIntensity: 0.02,
      },
      interior: { // Pearl-like interior
        mainColor: 0xF0E8D8, // Off-white, pearly
        roughness: 0.2,
        metalness: 0.0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
        emissiveColor: 0xF0E8D8,
        emissiveIntensity: 0.1,
      },
    },
    pufferfish: {
      baseRadius: 0.5,
      inflatedRadius: 0.8,
      inflationDuration: 0.5,
      deflationDuration: 1.0,
      detectionRadius: 5.0,
      inflationCooldown: 2.0,
      spikeCount: 50,
      spikeLengthFactor: 0.4,
      spikeRadiusFactor: 0.04,
      visuals: {
        mainColor: 0xFF7700, // Orange-Yellow
        detailColor: 0x442200, // Dark brown for spikes/eyes/mouth details
        roughness: 0.6,
        metalness: 0.1,
        emissiveColor: 0xFF7700,
        emissiveIntensity: 0.1,
      },
    },
    jellyfish: {
      bodyRadius: 0.7,
      tentacleCount: 8,
      tentacleLength: 2.5,
      tentacleRadius: 0.05,
      tentacleSway: 0.5,
      driftSpeed: 0.5,
      driftAmplitude: 2,
      verticalBobAmplitude: 0.3,
      verticalBobSpeed: 1,
      pulseSpeed: 1,
      pulseIntensityMin: 0.9,
      pulseIntensityMax: 1.1,
      visuals: {
        mainColor: 0xADD8E6, // Light blue
        opacity: 0.7,
        transmission: 0.9, // High transmission for jelly-like look
        roughness: 0.1,
        metalness: 0.05,
        emissiveColor: 0xADD8E6,
        emissiveIntensity: 0.2,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
        animationSpeed: 1, // For bell pulsing
        animationAmplitude: 0.1, // Amplitude of bell pulsing
      },
    },
    shark: {
      patrolSpeed: 1.5,
      patrolRangeX: 3,
      baseScale: 1.2,
      visuals: {
        mainColor: 0x607D8B, // Bluish grey
        underbellyColor: 0xB0BEC5, // Lighter grey
        detailColor: 0x455A64, // Darker grey for potential markings or fin edges
        emissiveColor: 0x37474F,
        emissiveIntensity: 0.1,
        roughness: 0.4,
        metalness: 0.1,
        animationSpeed: 2.5, // Tail sway speed
        animationAmplitude: 0.25, // Tail sway amplitude
        // New properties for jaw and teeth
        teethColor: 0xFFFFFF, 
        teethRoughness: 0.7,
        teethMetalness: 0.05,
        teethCountUpper: 10,
        teethCountLower: 8,
        jawAnimationSpeed: 1.5, // Speed of jaw animation cycle
        jawMaxAngleDeg: 35,   // Max jaw open angle in degrees
        // New properties for gill animation
        gillAnimationSpeed: 2.0,
        gillAnimationAmplitude: 0.1, // e.g., scales Y by +/- 10%
      },
    },
    seaTurtle: {
      baseScale: 1.4, forwardSpeedFactor: 0.75,
      laneChangeTelegraphTime: 0.6,
      laneChangeDuration: 1.0,
      minTimeInLane: 4.0,
      maxTimeInLane: 8.0,
      proximityTriggerDistance: 25,
      turnAngleDegrees: 20,
      visuals: {
        mainColor: 0x7E8A5F, // Shell - Olive Green/Brown
        shellPatternColor: 0x556B2F, // Darker Olive for pattern
        skinColor: 0xB2A27D, // Skin - Light Sandy Brown/Green
        shellBumpScale: 0.03,
        bankFactor: 0.2, // Default bank factor (e.g., 0.2 radians per radian of turn diff)
        emissiveColor: 0x445533, 
        emissiveIntensity: 0.05,
        roughness: 0.6, 
        metalness: 0.05, 
        clearcoat: 0.1, 
        clearcoatRoughness: 0.4,
        texturePatternScale: 8.0, 
        animationSpeed: 1.5, // Renamed from animationFrequency
        animationAmplitude: 0.5,
      },
    },
    kelpWall: {
      baseScaleY: 3.0,             // Increased from 2.2 for taller kelp walls
      strandCountMin: 5,           // Minimum number of kelp strands
      strandCountMax: 7,           // Maximum number of kelp strands, reduced from 8
      segmentWidthCoverage: 0.7,   // Covers less width, reduced from 0.9
      swayAmplitude: 0.1,          // Subtle sway
      swaySpeed: 0.5,              // Moderate sway speed
      visuals: { 
        mainColor: 0x3A5F0B, 
        detailColor: 0x2A4F0A, 
        emissiveColor: 0x1A3F0A, 
        emissiveIntensity: 0.1, 
        roughness: 0.7, 
        metalness: 0.0, 
        opacity: 0.8, 
        transmission: 0.2,
        animationSpeed: 0.5,
        animationAmplitude: 1.0
      }
    },
    schoolOfFish: {
      fishCountMin: 30,            // Increased from 15
      fishCountMax: 50,            // Increased from 25
      schoolRadius: 1.2,           // General area they occupy
      individualFishScale: 0.25,     // Changed from 0.3 back to 0.25
      depthCoverage: 2.5,          // Vertical spread, making it hard to jump
      formation: 'wall',           // Dense wall formation
      baseSpeedFactor: 0.9,        // Slightly slower than player
      visuals: { 
        mainColor: 0xFF8C00,    // DarkOrange (changed from 0xA0B0C0)
        detailColor: 0xFFA500,  // Orange (changed from 0xB0C0D0)
        emissiveColor: 0xFF7000, // Adjusted emissive to match orange theme
        emissiveIntensity: 0.15, 
        roughness: 0.4,          // Values from SchoolOfFishAsset's defaults
        metalness: 0.4,          // Values from SchoolOfFishAsset's defaults
        animationSpeed: 3.0,
        animationAmplitude: 0.5
      }
    }
  },
  decorations: {
    pebble: {
      colors: [0x888888, 0x777777, 0x999999, 0x666666],
      scaleMin: 0.06,
      scaleMax: 0.18
    },
    smallRock: {
      colors: [0x666666, 0x555555, 0x444444, 0x777777],
      scaleMin: 0.12,
      scaleMax: 0.3
    },
    clam: {
      colors: [0xD8C0A8, 0xE0D0B0, 0xC8B090, 0xF0E0C8],
      scaleMin: 0.2,
      scaleMax: 0.45
    },
    kelp: {
      colors: [0x2e8b57, 0x3a5f0b, 0x20603d],
      scaleMin: 0.6,
      scaleMax: 1.0
    },
    starfish: {
      colors: [0xffa07a, 0xff6347, 0xffc1a1, 0xffd1b3],
      scaleMin: 0.3,
      scaleMax: 0.6
    }
  },
  visuals: {
    skyColor: 0x144c55, // Turquoise-tinted background

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

    screenFlash: {
      flashColorMinor: 'rgba(255, 80, 80, 0.25)',
      flashDurationMinor: 120,
      flashColorMajor: 'rgba(255, 50, 50, 0.45)',
      flashDurationMajor: 250,
    },
    cameraShake: {
      shakeIntensityMinor: 0.06,
      shakeDurationMinor: 0.18,
      shakeIntensityMajor: 0.12,
      shakeDurationMajor: 0.35,
    },

    seafloor: {
      baseColor: 0xAD8E6E,
      sandPatternColor1: 0xC4A484,
      sandPatternColor2: 0x9A7B5A,
      textureScale: 5.0,
      textureResolution: 512,
      bumpScale: 0.04,
      roughness: 0.85,
      metalness: 0.0,
      pebbleColors: [0x8e7b65, 0x9c8b76, 0x7b6a55],
      pebbleDensity: 100,
      pebbleSizeRange: [2, 5],
      decorationSideMargin: 2,
        decorations: {
          pebbles: { spawnCount: 10, scaleMin: 0.06, scaleMax: 0.18 },
          smallRocks: { spawnCount: 5, scaleMin: 0.12, scaleMax: 0.3 },
          clams: { spawnCount: 2, scaleMin: 0.2, scaleMax: 0.45 },
          kelp: { spawnCount: 2, scaleMin: 0.6, scaleMax: 1.0 },
          starfish: { spawnCount: 2, scaleMin: 0.3, scaleMax: 0.6 }
        }
    },
    waterSurface: {
      baseColor: 0x87CEEB,
      rippleColor: 0xFFFFFF,
      rippleSpeed: 0.2,
      rippleScale: 10.0,
      rippleIntensity: 0.01,
      opacity: 0.3,
      fresnelPower: 2.0,
      specularColor: 0x77ccff,
      shininess: 80
    }
  },
  lighting: {
    // Ambient light provides overall illumination for the scene. A slightly
    // brighter turquoise tone enhances underwater visibility.
    ambientLight: { color: 0x80d0d0, intensity: 0.6 },
    // Directional light acts as the main light source. A cool light colour and
    // slightly reduced intensity keeps the scene moody while still readable.
    directionalLight: {
      color: 0xc8ffff,
      intensity: 0.8,
      position: { x: 1, y: 10, z: 1 },
      castShadow: false
    },
    // Fog parameters tuned to create a subtle turquoise atmosphere without
    // overwhelming the player.
    fogColor: 0x0d5660,
    fogNear: 10,
    fogFar: 60,
    enableCaustics: true,
    causticColor: 0x9cdfff,
    causticIntensity: 0.12,
    causticScale: 7.0,
    causticSpeed: 0.1,
    causticBlendMode: 'additive',
    enableGodRays: true,
    godRayColor: 0x9cdfff,
    godRayIntensity: 0.1,
    godRayDensity: 0.97,
    godRayWeight: 0.07,
    godRayDecay: 0.94,
    godRayExposure: 0.12,
    godRaySamples: 30
  },
};
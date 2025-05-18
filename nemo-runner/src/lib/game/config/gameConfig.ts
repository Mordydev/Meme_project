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
  stalkRadius?: number;       // Base radius for each kelp stalk
  frondCount?: number;        // Number of fronds per stalk
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

export interface SeafloorVisualConfig {
  baseColor: number | string;
  sandPatternColor1: number | string;
  sandPatternColor2: number | string;
  textureScale: number; // For procedural sand pattern
  bumpScale?: number;
  roughness?: number;
  metalness?: number;
}

export interface PebbleVisualConfig {
  countMin: number;
  countMax: number;
  sizeMin: number;
  sizeMax: number;
  color: number | string;
  enabled?: boolean;
}

export interface ShellsVisualConfig {
  enabled?: boolean;
  countPerSegment: number; // Number of shells to attempt to spawn per seafloor segment
  size: number; // Base size of the shells
  sizeVariation?: number; // e.g., 0.2 means size can vary by +/- 20%
}

export interface WaterSurfaceVisualConfig {
  baseColor: number | string; // Likely a sky blue or slightly darker
  rippleColor: number | string; // For highlights on ripples
  rippleSpeed: number;
  rippleScale: number;
  rippleIntensity: number;
  opacity: number; // Controls overall visibility from below
  fresnelPower?: number; // For edge highlighting/reflectivity
  specularColor?: number | string;
  shininess?: number;
  enabled?: boolean; // Added to enable/disable water surface
}

export interface LightingConfig { // Existing, ensure caustics and godrays are detailed
    ambientLight: { color: number; intensity: number; };
    directionalLight: { color: number; intensity: number; position: { x: number; y: number; z: number }; castShadow?: boolean; shadowMapSize?: number; };
    fogColor: number | string;
    fogDensity?: number; // If using FogExp2
    fogNear?: number;    // If using Fog
    fogFar?: number;     // If using Fog

    enableCaustics: boolean;
    causticColor: number | string;
    causticIntensity: number;
    causticScale: number;
    causticSpeed: number;
    causticBlendMode: 'additive' | 'multiply' | 'mix'; // How caustics affect base seafloor
    causticReceiverObjects?: string[]; // e.g., ['seafloor', 'rocks'] if specific

    enableGodRays: boolean;
    godRayColor?: number | string;
    godRayIntensity?: number;
    godRayDensity?: number;     // For screen-space effect
    godRayWeight?: number;
    godRayDecay?: number;
    godRayExposure?: number;
    godRaySamples?: number;
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

  seafloor: SeafloorVisualConfig;
  pebbles: PebbleVisualConfig;
  waterSurface: WaterSurfaceVisualConfig;
  shells: ShellsVisualConfig;
  testCubeColor?: number | string; // Assuming this was part of general visuals
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
  visuals: VisualSettings; // General visual settings like particles, screen effects
  lighting: LightingConfig;  // Dedicated lighting config
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
    offset: { x: 0, y: 2, z: 5 }, // z is distance behind player
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
      stalkRadius: 0.05,           // Base radius for stalks
      frondCount: 5,               // Default number of fronds per stalk
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

    seafloor: {
      baseColor: 0xAD8E6E, // Sandy brown
      sandPatternColor1: 0xC4A484, // Lighter sand
      sandPatternColor2: 0x9A7B5A, // Darker sand spots
      textureScale: 15.0,
      bumpScale: 0.02,
      roughness: 0.85,
      metalness: 0.0,
    },
    pebbles: {
      countMin: 2,
      countMax: 5,
      sizeMin: 0.05,
      sizeMax: 0.15,
      color: 0x555555, // Dark grey
      enabled: true,
    },
    shells: {
      enabled: true,
      countPerSegment: 3, // Try to spawn a few shells per segment
      size: 0.3,          // Base size of shells
      sizeVariation: 0.2, // Allow some size differences
    },
    waterSurface: {
      baseColor: 0x87CEEB, // Sky blue, but will be viewed from below
      rippleColor: 0xFFFFFF, // White highlights for ripples
      rippleSpeed: 0.2,
      rippleScale: 10.0,
      rippleIntensity: 0.01, // Subtle ripples
      opacity: 0.3, // Semi-transparent from below
      fresnelPower: 2.0,
      specularColor: 0x77ccff,
      shininess: 80,
      enabled: true,
    },
    testCubeColor: 0xff00ff, // Assuming this was part of general visuals
  },
  lighting: {
    ambientLight: { color: 0x406080, intensity: 0.5 }, // Softer ambient
    directionalLight: { 
      color: 0xE0F0FF, intensity: 0.7, // Softer sun
      position: { x: 1, y: 10, z: 1 }, 
      castShadow: false 
    },
    fogColor: 0x102a43, // Deeper blue fog
    fogDensity: 0.03,   // Adjusted fog density
    enableCaustics: true,
    causticColor: 0xA0D0FF, // Lighter blue for caustics
    causticIntensity: 0.15, // More subtle
    causticScale: 6.0,
    causticSpeed: 0.08,
    causticBlendMode: 'additive',
    enableGodRays: true, // Let's try enabling a basic version
    godRayColor: 0xA0D0FF,
    godRayIntensity: 0.08,
    godRayDensity: 0.96,
    godRayWeight: 0.05, // Very subtle weight
    godRayDecay: 0.96,
    godRayExposure: 0.1,
    godRaySamples: 20, // Fewer samples for P1
  },
};
'use client';

import * as THREE from 'three';
import { Vector3 } from 'three';
import { ObstacleType } from './ObstacleManager';
import { EnvironmentZone } from './EnvironmentManager';

// Chunk represents a segment of procedurally generated level
export interface LevelChunk {
  id: number;
  startDistance: number;
  length: number;
  environmentZone: EnvironmentZone;
  obstaclePatterns: ObstaclePattern[];
  collectiblePatterns: CollectiblePattern[];
  powerUpPatterns: PowerUpPattern[];
}

// Pattern types
export interface ObstaclePattern {
  type: ObstaclePatternType;
  zOffset: number;
  obstacles: ObstacleDefinition[];
}

export interface CollectiblePattern {
  type: CollectiblePatternType;
  zOffset: number;
  collectibles: CollectibleDefinition[];
}

export interface PowerUpPattern {
  type: PowerUpType;
  position: Vector3;
  zOffset: number;
}

// Definitions for individual elements
export interface ObstacleDefinition {
  type: ObstacleType;
  position: Vector3;
  rotation?: THREE.Euler;
  scale?: Vector3;
}

export interface CollectibleDefinition {
  type: CollectibleType;
  position: Vector3;
  value: number;
}

// Enum types
export enum ObstaclePatternType {
  WALL,
  TUNNEL,
  SLALOM,
  MATRIX,
  WAVE,
  RANDOM,
  ZONE_SPECIFIC_CORAL_REEF,
  ZONE_SPECIFIC_OPEN_OCEAN,
  ZONE_SPECIFIC_DEEP_SEA
}

export enum CollectiblePatternType {
  LINE,
  CURVE,
  CIRCLE,
  ZIGZAG,
  RANDOM
}

export enum CollectibleType {
  SMALL_BUBBLE,
  MEDIUM_BUBBLE,
  LARGE_BUBBLE,
  GOLDEN_BUBBLE
}

export enum PowerUpType {
  SHIELD,
  SPEED_BOOST,
  BUBBLE_MAGNET,
  TIME_SLOW,
  SCORE_MULTIPLIER
}

export default class ProceduralGenerator {
  // Chunk properties
  private readonly chunkLength = 100; // Standard chunk length in units
  private readonly visibleChunks = 3; // Reduced from 5 to 3 for better performance
  private readonly powerUpInterval = 3; // Place a power-up every N chunks
  private readonly difficultyScalingFactor = 0.1; // How much difficulty increases per chunk

  // Current state
  private currentChunkId = 0;
  private activeChunks: LevelChunk[] = [];
  private nextChunkDistance = 0;
  private difficultyLevel = 1;
  private currentZone: EnvironmentZone = EnvironmentZone.CORAL_REEF;
  private seed = Math.floor(Math.random() * 1000000);
  
  // Optimization: Pre-allocated vectors for reuse
  private tempVector = new Vector3();
  
  // Optimization: Element cache to reduce object creation
  private cachedObstacles: Map<string, ObstacleDefinition[]> = new Map();
  private cachedCollectibles: Map<string, CollectibleDefinition[]> = new Map();
  
  // Optimization: Pattern factories for reuse
  private patternFactories = {
    [ObstaclePatternType.WALL]: this.createWallWithGap.bind(this),
    [ObstaclePatternType.TUNNEL]: this.createTunnel.bind(this),
    [ObstaclePatternType.SLALOM]: this.createSlalom.bind(this),
    [ObstaclePatternType.MATRIX]: this.createMatrix.bind(this),
    [ObstaclePatternType.WAVE]: this.createWave.bind(this),
    [ObstaclePatternType.ZONE_SPECIFIC_CORAL_REEF]: this.createCoralReefPattern.bind(this),
    [ObstaclePatternType.ZONE_SPECIFIC_OPEN_OCEAN]: this.createOpenOceanPattern.bind(this),
    [ObstaclePatternType.ZONE_SPECIFIC_DEEP_SEA]: this.createDeepSeaPattern.bind(this),
    [ObstaclePatternType.RANDOM]: this.createRandomPattern.bind(this)
  };
  
  private collectibleFactories = {
    [CollectiblePatternType.LINE]: this.createCollectibleLine.bind(this),
    [CollectiblePatternType.CURVE]: this.createCollectibleCurve.bind(this),
    [CollectiblePatternType.CIRCLE]: this.createCollectibleCircle.bind(this),
    [CollectiblePatternType.ZIGZAG]: this.createCollectibleZigzag.bind(this),
    [CollectiblePatternType.RANDOM]: this.createRandomCollectibles.bind(this)
  };

  // Optimization: Cached collectible values for reuse
  private collectibleValues = {
    [CollectibleType.SMALL_BUBBLE]: 10,
    [CollectibleType.MEDIUM_BUBBLE]: 25,
    [CollectibleType.LARGE_BUBBLE]: 50,
    [CollectibleType.GOLDEN_BUBBLE]: 100
  };
  
  // Optimization: Reusable element arrays for getElementsInRange
  private outputObstacles: { type: ObstacleType, position: Vector3 }[] = [];
  private outputCollectibles: { type: CollectibleType, position: Vector3, value: number }[] = [];
  private outputPowerUps: { type: PowerUpType, position: Vector3 }[] = [];
  
  // Caching: Pattern type probabilities by zone
  private readonly patternProbabilities = {
    common: [
      { type: ObstaclePatternType.WALL, prob: 0.2 },
      { type: ObstaclePatternType.TUNNEL, prob: 0.2 },
      { type: ObstaclePatternType.SLALOM, prob: 0.2 },
      { type: ObstaclePatternType.MATRIX, prob: 0.1 },
      { type: ObstaclePatternType.WAVE, prob: 0.1 }
    ],
    [EnvironmentZone.CORAL_REEF]: { type: ObstaclePatternType.ZONE_SPECIFIC_CORAL_REEF, prob: 0.2 },
    [EnvironmentZone.OPEN_OCEAN]: { type: ObstaclePatternType.ZONE_SPECIFIC_OPEN_OCEAN, prob: 0.2 },
    [EnvironmentZone.DEEP_SEA]: { type: ObstaclePatternType.ZONE_SPECIFIC_DEEP_SEA, prob: 0.2 }
  };
  
  // Optimization: Pattern generation flags
  private generateOnDemand = true; // Generate patterns only when needed

  constructor() {
    // Initialize with starting chunks
    this.generateInitialChunks();
  }

  // Set the current environment zone for generation
  setEnvironmentZone(zone: EnvironmentZone): void {
    this.currentZone = zone;
  }

  // Set the current difficulty level
  setDifficultyLevel(level: number): void {
    this.difficultyLevel = level;
  }
  
  // Set generation optimization flags
  setOptimizationSettings(generateOnDemand: boolean): void {
    this.generateOnDemand = generateOnDemand;
  }

  // Generate initial chunks at game start
  private generateInitialChunks(): void {
    // Clear any existing chunks
    this.activeChunks = [];
    this.currentChunkId = 0;
    this.nextChunkDistance = 0;

    // Generate initial set of chunks
    for (let i = 0; i < this.visibleChunks; i++) {
      this.generateNextChunk();
    }
  }

  // Generate a new chunk at the nextChunkDistance
  private generateNextChunk(): LevelChunk {
    const chunkId = this.currentChunkId++;
    const startDistance = this.nextChunkDistance;
    this.nextChunkDistance += this.chunkLength;

    // Create a new chunk
    const chunk: LevelChunk = {
      id: chunkId,
      startDistance,
      length: this.chunkLength,
      environmentZone: this.currentZone,
      obstaclePatterns: [],
      collectiblePatterns: [],
      powerUpPatterns: []
    };

    // Optimization: Generate patterns on demand if flag is set
    if (!this.generateOnDemand) {
      // Generate obstacle patterns for this chunk
      this.generateObstaclePatterns(chunk);

      // Generate collectible patterns for this chunk
      this.generateCollectiblePatterns(chunk);

      // Add a power-up occasionally
      if (chunkId % this.powerUpInterval === 0) {
        this.generatePowerUp(chunk);
      }
    }

    // Add to active chunks
    this.activeChunks.push(chunk);

    return chunk;
  }
  
  // Ensure a chunk has its patterns generated
  private ensureChunkPatterns(chunk: LevelChunk): void {
    // Skip if patterns are already generated
    if (!this.generateOnDemand || 
        (chunk.obstaclePatterns.length > 0 &&
         chunk.collectiblePatterns.length > 0)) {
      return;
    }
    
    // Generate obstacle patterns
    this.generateObstaclePatterns(chunk);
    
    // Generate collectible patterns
    this.generateCollectiblePatterns(chunk);
    
    // Add power-up if needed
    if (chunk.id % this.powerUpInterval === 0) {
      this.generatePowerUp(chunk);
    }
  }

  // Generate obstacle patterns for a chunk
  private generateObstaclePatterns(chunk: LevelChunk): void {
    // Determine number of patterns based on difficulty
    const patternCount = Math.min(
      1 + Math.floor(this.difficultyLevel * this.difficultyScalingFactor),
      5
    );

    // Space patterns evenly throughout the chunk
    const spacing = chunk.length / (patternCount + 1);
    
    // Check cache for existing pattern
    const cacheKey = `obs_${chunk.environmentZone}_${patternCount}_${Math.floor(this.difficultyLevel)}`;
    
    if (this.cachedObstacles.has(cacheKey)) {
      // Use cached patterns but with offset
      const basePatterns = this.cachedObstacles.get(cacheKey)!;
      
      for (let i = 0; i < patternCount; i++) {
        const zOffset = spacing * (i + 1);
        
        // Choose a pattern type based on difficulty and environment zone
        const patternType = this.selectObstaclePatternType(chunk.environmentZone);
        
        // Generate obstacles with placement at chunk-relative position
        const obstacles = this.createObstaclePattern(patternType, zOffset, chunk.environmentZone).obstacles;
        
        // Add pattern to chunk
        chunk.obstaclePatterns.push({
          type: patternType,
          zOffset,
          obstacles
        });
      }
    } else {
      // Create new patterns and cache them
      const patterns = [];
      
      for (let i = 0; i < patternCount; i++) {
        // Calculate z offset from start of chunk
        const zOffset = spacing * (i + 1);

        // Choose a pattern type based on difficulty and environment zone
        const patternType = this.selectObstaclePatternType(chunk.environmentZone);

        // Generate the pattern and add to chunk
        const pattern = this.createObstaclePattern(patternType, zOffset, chunk.environmentZone);
        chunk.obstaclePatterns.push(pattern);
        
        // Store base patterns for caching
        patterns.push(...pattern.obstacles);
      }
      
      // Cache the patterns
      this.cachedObstacles.set(cacheKey, patterns);
    }
  }

  // Generate collectible patterns for a chunk
  private generateCollectiblePatterns(chunk: LevelChunk): void {
    // Determine number of patterns based on difficulty
    const patternCount = Math.min(
      2 + Math.floor(this.difficultyLevel * this.difficultyScalingFactor * 0.5),
      4
    );

    // Space patterns evenly throughout the chunk
    const spacing = chunk.length / (patternCount + 1);
    
    // Check cache for existing patterns
    const cacheKey = `col_${chunk.environmentZone}_${patternCount}_${Math.floor(this.difficultyLevel)}`;
    
    if (this.cachedCollectibles.has(cacheKey)) {
      // Use cached patterns but with offset
      const basePatterns = this.cachedCollectibles.get(cacheKey)!;
      
      for (let i = 0; i < patternCount; i++) {
        const zOffset = spacing * (i + 1) + (spacing * 0.5); // Offset from obstacles
        
        // Choose a pattern type
        const patternType = this.selectCollectiblePatternType();
        
        // Generate collectibles with placement at chunk-relative position
        const collectibles = this.createCollectiblePattern(patternType, zOffset).collectibles;
        
        // Add pattern to chunk
        chunk.collectiblePatterns.push({
          type: patternType,
          zOffset,
          collectibles
        });
      }
    } else {
      // Create new patterns and cache them
      const patterns = [];
      
      for (let i = 0; i < patternCount; i++) {
        // Calculate z offset from start of chunk
        const zOffset = spacing * (i + 1) + (spacing * 0.5); // Offset from obstacles

        // Choose a pattern type
        const patternType = this.selectCollectiblePatternType();

        // Generate the pattern and add to chunk
        const pattern = this.createCollectiblePattern(patternType, zOffset);
        chunk.collectiblePatterns.push(pattern);
        
        // Store base patterns for caching
        patterns.push(...pattern.collectibles);
      }
      
      // Cache the patterns
      this.cachedCollectibles.set(cacheKey, patterns);
    }
  }

  // Generate a power-up for a chunk
  private generatePowerUp(chunk: LevelChunk): void {
    // Place power-up in second half of chunk to avoid early collision
    const zOffset = chunk.length * 0.7 + Math.random() * (chunk.length * 0.2);

    // Reuse the tempVector instead of creating a new Vector3
    this.tempVector.set(
      (Math.random() * 16) - 8, // X between -8 and 8
      (Math.random() * 6) - 2,  // Y between -2 and 4
      0                         // Z set by zOffset
    );

    // Select power-up type with weighted probabilities
    const powerUpType = this.selectPowerUpType();

    // Add to chunk
    chunk.powerUpPatterns.push({
      type: powerUpType,
      position: new Vector3().copy(this.tempVector), // Create a new vector for storage
      zOffset
    });
  }

  // Select obstacle pattern type based on environment zone - optimized
  private selectObstaclePatternType(zone: EnvironmentZone): ObstaclePatternType {
    const rand = Math.random();
    let cumulativeProb = 0;
    
    // Check common patterns first
    for (const pattern of this.patternProbabilities.common) {
      cumulativeProb += pattern.prob;
      if (rand < cumulativeProb) {
        return pattern.type;
      }
    }
    
    // Then zone-specific patterns
    return this.patternProbabilities[zone].type;
  }

  // Select collectible pattern type - optimized with direct returns
  private selectCollectiblePatternType(): CollectiblePatternType {
    const rand = Math.random();
    
    if (rand < 0.25) return CollectiblePatternType.LINE;
    if (rand < 0.5) return CollectiblePatternType.CURVE;
    if (rand < 0.7) return CollectiblePatternType.CIRCLE;
    if (rand < 0.9) return CollectiblePatternType.ZIGZAG;
    
    return CollectiblePatternType.RANDOM;
  }

  // Select power-up type with weighted probabilities - optimized with direct returns
  private selectPowerUpType(): PowerUpType {
    const rand = Math.random();
    
    if (rand < 0.3) return PowerUpType.SHIELD;
    if (rand < 0.5) return PowerUpType.SPEED_BOOST;
    if (rand < 0.7) return PowerUpType.BUBBLE_MAGNET;
    if (rand < 0.85) return PowerUpType.TIME_SLOW;
    
    return PowerUpType.SCORE_MULTIPLIER;
  }

  // Create obstacle pattern based on type - optimized for less object creation
  private createObstaclePattern(
    type: ObstaclePatternType, 
    zOffset: number,
    zone: EnvironmentZone
  ): ObstaclePattern {
    const obstacles: ObstacleDefinition[] = [];
    
    // Use pattern factory from cached map
    const factory = this.patternFactories[type];
    if (factory) {
      factory(obstacles, zOffset);
    }
    
    return {
      type,
      zOffset,
      obstacles
    };
  }

  // Create collectible pattern based on type - optimized for less object creation
  private createCollectiblePattern(
    type: CollectiblePatternType, 
    zOffset: number
  ): CollectiblePattern {
    const collectibles: CollectibleDefinition[] = [];
    
    // Use pattern factory from cached map
    const factory = this.collectibleFactories[type];
    if (factory) {
      factory(collectibles, zOffset);
    }
    
    return {
      type,
      zOffset,
      collectibles
    };
  }

  // Pattern generation helpers - optimized with shared Vector3
  private createWallWithGap(obstacles: ObstacleDefinition[], zOffset: number): void {
    // Create a wall with a random gap position
    const gapWidth = 3 + Math.random() * 2; // Gap width between 3-5 units
    const gapPosition = (Math.random() * 12) - 6; // Gap position between -6 and 6
    
    // Create wall segments
    for (let x = -10; x <= 10; x += 2) {
      // Skip positions where the gap should be
      if (x >= gapPosition - gapWidth/2 && x <= gapPosition + gapWidth/2) {
        continue;
      }
      
      // Add obstacle - reuse tempVector
      this.tempVector.set(x, Math.random() * 6 - 3, -zOffset);
      
      obstacles.push({
        type: ObstacleType.CORAL,
        position: new Vector3().copy(this.tempVector) // Create a new vector for storage
      });
    }
  }

  private createTunnel(obstacles: ObstacleDefinition[], zOffset: number): void {
    // Create a tunnel to swim through
    const tunnelRadius = 3 + Math.random() * 2; // Tunnel radius between 3-5 units
    const tunnelCenterX = (Math.random() * 10) - 5; // Center between -5 and 5
    const tunnelCenterY = (Math.random() * 4) - 2; // Center between -2 and 2
    
    // Create obstacles around a circle
    const segments = 12;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = tunnelCenterX + Math.cos(angle) * tunnelRadius;
      const y = tunnelCenterY + Math.sin(angle) * tunnelRadius;
      
      // Add obstacle - reuse tempVector
      this.tempVector.set(x, y, -zOffset);
      
      obstacles.push({
        type: i % 2 === 0 ? ObstacleType.CORAL : ObstacleType.ROCK,
        position: new Vector3().copy(this.tempVector) // Create a new vector for storage
      });
    }
  }

  private createSlalom(obstacles: ObstacleDefinition[], zOffset: number): void {
    // Create alternating obstacles to navigate through
    const obstacleCount = 5;
    const spacing = 3; // Spacing between obstacles

    for (let i = 0; i < obstacleCount; i++) {
      const x = i % 2 === 0 ? -5 : 5; // Alternate left and right
      const y = (Math.random() * 6) - 3;
      const z = -zOffset - (i * spacing); // Spread along z-axis
      
      // Add obstacle - reuse tempVector
      this.tempVector.set(x, y, z);
      
      obstacles.push({
        type: ObstacleType.JELLYFISH,
        position: new Vector3().copy(this.tempVector) // Create a new vector for storage
      });
    }
  }

  private createMatrix(obstacles: ObstacleDefinition[], zOffset: number): void {
    // Create a grid of obstacles with random gaps
    const rows = 3;
    const cols = 4;
    const size = 3; // Size of grid cells
    
    // Randomize which cells have obstacles (75% chance)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Skip some cells to create gaps
        if (Math.random() < 0.25) continue;
        
        const x = (col * size) - ((cols - 1) * size / 2);
        const y = (row * size) - ((rows - 1) * size / 2);
        
        // Add obstacle - reuse tempVector
        this.tempVector.set(x, y, -zOffset);
        
        obstacles.push({
          type: ObstacleType.CORAL,
          position: new Vector3().copy(this.tempVector) // Create a new vector for storage
        });
      }
    }
  }

  private createWave(obstacles: ObstacleDefinition[], zOffset: number): void {
    // Create a wave pattern
    const waveCount = 10;
    const amplitude = 4;
    const frequency = 0.5;
    
    for (let i = 0; i < waveCount; i++) {
      const zPos = -zOffset - (i * 2); // Space along z-axis
      const x = Math.sin(i * frequency) * amplitude;
      
      // Add obstacle - reuse tempVector
      this.tempVector.set(x, 0, zPos);
      
      obstacles.push({
        type: ObstacleType.PUFFERFISH,
        position: new Vector3().copy(this.tempVector) // Create a new vector for storage
      });
    }
  }

  private createCoralReefPattern(obstacles: ObstacleDefinition[], zOffset: number): void {
    // Optimization: Limit coral count based on difficulty
    const maxCoralCount = 10;
    const coralCount = Math.min(
      8 + Math.floor(Math.random() * 4),
      maxCoralCount
    );
    
    // Create coral clusters
    for (let i = 0; i < coralCount; i++) {
      const x = (Math.random() * 16) - 8;
      const y = (Math.random() * 6) - 4; // More likely to be lower
      
      // Main coral - reuse tempVector
      this.tempVector.set(x, y, -zOffset);
      
      obstacles.push({
        type: ObstacleType.CORAL,
        position: new Vector3().copy(this.tempVector) // Create a new vector for storage
      });
      
      // Add smaller surrounding coral (33% chance) - limited to 1 for performance
      if (Math.random() < 0.33) {
        this.tempVector.set(
          x + (Math.random() * 2) - 1,
          y + (Math.random() * 2) - 1,
          -zOffset - (Math.random() * 2)
        );
        
        obstacles.push({
          type: ObstacleType.CORAL,
          position: new Vector3().copy(this.tempVector), // Create a new vector for storage
          scale: new Vector3(0.7, 0.7, 0.7)
        });
      }
    }
  }

  private createOpenOceanPattern(obstacles: ObstacleDefinition[], zOffset: number): void {
    // Optimization: Limit jellyfish count based on difficulty
    const maxJellyfishCount = 7;
    const jellyfishCount = Math.min(
      5 + Math.floor(Math.random() * 3),
      maxJellyfishCount
    );
    
    // Create jellyfish school
    for (let i = 0; i < jellyfishCount; i++) {
      const x = (Math.random() * 20) - 10;
      const y = (Math.random() * 8) - 2; // More likely to be higher
      
      // Add jellyfish - reuse tempVector
      this.tempVector.set(
        x,
        y,
        -zOffset - (Math.random() * 8)
      );
      
      obstacles.push({
        type: ObstacleType.JELLYFISH,
        position: new Vector3().copy(this.tempVector) // Create a new vector for storage
      });
    }
    
    // Add a shark (30% chance)
    if (Math.random() < 0.3) {
      // Add shark - reuse tempVector
      this.tempVector.set(
        (Math.random() < 0.5 ? -12 : 12), // Start from edge
        (Math.random() * 6) - 2,
        -zOffset - 5
      );
      
      obstacles.push({
        type: ObstacleType.SHARK,
        position: new Vector3().copy(this.tempVector) // Create a new vector for storage
      });
    }
  }

  private createDeepSeaPattern(obstacles: ObstacleDefinition[], zOffset: number): void {
    // Optimization: Limit rock count based on difficulty
    const maxRockCount = 5;
    const rockCount = Math.min(
      3 + Math.floor(Math.random() * 3),
      maxRockCount
    );
    
    // Rock formations
    for (let i = 0; i < rockCount; i++) {
      const x = (Math.random() * 16) - 8;
      const y = (Math.random() * 6) - 4; // More likely to be lower
      
      // Add rock - reuse tempVector
      this.tempVector.set(x, y, -zOffset - (i * 3));
      
      obstacles.push({
        type: ObstacleType.ROCK,
        position: new Vector3().copy(this.tempVector), // Create a new vector for storage
        scale: new Vector3(
          1 + Math.random() * 0.5,
          1 + Math.random() * 0.5,
          1 + Math.random() * 0.5
        )
      });
    }
    
    // Add dangerous pufferfish (40% chance) - limited to 1 for performance
    if (Math.random() < 0.4) {
      // Add pufferfish - reuse tempVector
      this.tempVector.set(
        (Math.random() * 12) - 6,
        (Math.random() * 8) - 2,
        -zOffset - (Math.random() * 10)
      );
      
      obstacles.push({
        type: ObstacleType.PUFFERFISH,
        position: new Vector3().copy(this.tempVector) // Create a new vector for storage
      });
    }
  }

  private createRandomPattern(obstacles: ObstacleDefinition[], zOffset: number): void {
    // Optimization: Limit obstacle count based on difficulty
    const maxObstacleCount = 7;
    const obstacleCount = Math.min(
      3 + Math.floor(Math.random() * 5),
      maxObstacleCount
    );
    
    for (let i = 0; i < obstacleCount; i++) {
      const x = (Math.random() * 16) - 8;
      const y = (Math.random() * 8) - 4;
      const z = -zOffset - (Math.random() * 10);
      
      // Random obstacle type
      const types = [
        ObstacleType.CORAL,
        ObstacleType.ROCK,
        ObstacleType.JELLYFISH,
        ObstacleType.PUFFERFISH
      ];
      
      const type = types[Math.floor(Math.random() * types.length)];
      
      // Add obstacle - reuse tempVector
      this.tempVector.set(x, y, z);
      
      obstacles.push({
        type,
        position: new Vector3().copy(this.tempVector) // Create a new vector for storage
      });
    }
  }

  // Collectible pattern helpers - optimized with shared Vector3 and cached values
  private createCollectibleLine(collectibles: CollectibleDefinition[], zOffset: number): void {
    // Optimization: Limit collectible count based on performance
    const maxCollectibleCount = 10;
    const count = Math.min(
      8 + Math.floor(Math.random() * 5),
      maxCollectibleCount
    );
    
    const startX = (Math.random() * 12) - 6;
    const startY = (Math.random() * 6) - 2;
    const endX = (Math.random() * 12) - 6;
    const endY = (Math.random() * 6) - 2;
    
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      
      const type = this.selectCollectibleType();
      const value = this.collectibleValues[type];
      
      // Add collectible - reuse tempVector
      this.tempVector.set(x, y, -zOffset);
      
      collectibles.push({
        type,
        position: new Vector3().copy(this.tempVector), // Create a new vector for storage
        value
      });
    }
  }

  private createCollectibleCurve(collectibles: CollectibleDefinition[], zOffset: number): void {
    // Optimization: Limit collectible count based on performance
    const maxCollectibleCount = 12;
    const count = Math.min(
      10 + Math.floor(Math.random() * 6),
      maxCollectibleCount
    );
    
    const centerX = (Math.random() * 8) - 4;
    const centerY = (Math.random() * 4) - 2;
    const radius = 3 + Math.random() * 3;
    const startAngle = Math.random() * Math.PI * 2;
    const endAngle = startAngle + Math.PI; // Half circle
    
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const angle = startAngle + (endAngle - startAngle) * t;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const type = this.selectCollectibleType();
      const value = this.collectibleValues[type];
      
      // Add collectible - reuse tempVector
      this.tempVector.set(x, y, -zOffset);
      
      collectibles.push({
        type,
        position: new Vector3().copy(this.tempVector), // Create a new vector for storage
        value
      });
    }
  }

  private createCollectibleCircle(collectibles: CollectibleDefinition[], zOffset: number): void {
    // Optimization: Limit collectible count based on performance
    const maxCollectibleCount = 15;
    const count = Math.min(
      12 + Math.floor(Math.random() * 6),
      maxCollectibleCount
    );
    
    const centerX = (Math.random() * 8) - 4;
    const centerY = (Math.random() * 4) - 2;
    const radius = 3 + Math.random() * 2;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const type = this.selectCollectibleType();
      const value = this.collectibleValues[type];
      
      // Add collectible - reuse tempVector
      this.tempVector.set(x, y, -zOffset);
      
      collectibles.push({
        type,
        position: new Vector3().copy(this.tempVector), // Create a new vector for storage
        value
      });
    }
  }

  private createCollectibleZigzag(collectibles: CollectibleDefinition[], zOffset: number): void {
    // Optimization: Limit rows and collectibles per row
    const maxRows = 5;
    const maxPerRow = 7;
    
    const rows = Math.min(4 + Math.floor(Math.random() * 3), maxRows);
    const collectiblesPerRow = Math.min(5 + Math.floor(Math.random() * 3), maxPerRow);
    const width = 8;
    const rowSpacing = 2;
    
    for (let row = 0; row < rows; row++) {
      const direction = row % 2 === 0 ? 1 : -1;
      const startX = direction === 1 ? -width/2 : width/2;
      
      for (let i = 0; i < collectiblesPerRow; i++) {
        const t = i / (collectiblesPerRow - 1);
        const x = startX + (direction * width * t);
        const y = (Math.random() * 2) - 1; // Small y variation
        const z = -zOffset - (row * rowSpacing);
        
        const type = this.selectCollectibleType();
        const value = this.collectibleValues[type];
        
        // Add collectible - reuse tempVector
        this.tempVector.set(x, y, z);
        
        collectibles.push({
          type,
          position: new Vector3().copy(this.tempVector), // Create a new vector for storage
          value
        });
      }
    }
  }

  private createRandomCollectibles(collectibles: CollectibleDefinition[], zOffset: number): void {
    // Optimization: Limit collectible count based on performance
    const maxCollectibleCount = 12;
    const count = Math.min(
      8 + Math.floor(Math.random() * 8),
      maxCollectibleCount
    );
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * 16) - 8;
      const y = (Math.random() * 8) - 4;
      const z = -zOffset - (Math.random() * 10);
      
      const type = this.selectCollectibleType();
      const value = this.collectibleValues[type];
      
      // Add collectible - reuse tempVector
      this.tempVector.set(x, y, z);
      
      collectibles.push({
        type,
        position: new Vector3().copy(this.tempVector), // Create a new vector for storage
        value
      });
    }
  }

  // Select collectible type with weighted probabilities - optimized with direct returns
  private selectCollectibleType(): CollectibleType {
    const rand = Math.random();
    
    if (rand < 0.7) return CollectibleType.SMALL_BUBBLE;
    if (rand < 0.9) return CollectibleType.MEDIUM_BUBBLE;
    if (rand < 0.98) return CollectibleType.LARGE_BUBBLE;
    
    return CollectibleType.GOLDEN_BUBBLE;
  }

  // Get collectible value based on type - optimized with cached values
  private getCollectibleValue(type: CollectibleType): number {
    return this.collectibleValues[type] || 10;
  }

  // Update chunks based on player distance
  update(playerDistance: number): LevelChunk[] {
    // Optimization: Faster chunk filtering
    let i = this.activeChunks.length;
    while (i--) {
      const chunk = this.activeChunks[i];
      if (chunk.startDistance + chunk.length <= playerDistance - this.chunkLength) {
        this.activeChunks.splice(i, 1);
      }
    }
    
    // Generate new chunks ahead
    while (this.nextChunkDistance < playerDistance + (this.chunkLength * this.visibleChunks)) {
      this.generateNextChunk();
    }
    
    return this.activeChunks;
  }

  // Get chunks within the visible range
  getVisibleChunks(playerDistance: number): LevelChunk[] {
    const visibleDistance = this.chunkLength * this.visibleChunks;
    
    return this.activeChunks.filter(chunk => 
      chunk.startDistance < playerDistance + visibleDistance &&
      chunk.startDistance + chunk.length > playerDistance - this.chunkLength
    );
  }

  // Get active elements within a specific zone around the player - optimized with reused arrays
  getElementsInRange(
    playerDistance: number, 
    range: number
  ): {
    obstacles: { type: ObstacleType, position: Vector3 }[],
    collectibles: { type: CollectibleType, position: Vector3, value: number }[],
    powerUps: { type: PowerUpType, position: Vector3 }[]
  } {
    const minDistance = playerDistance - range;
    const maxDistance = playerDistance + range;
    
    // Clear the output arrays
    this.outputObstacles.length = 0;
    this.outputCollectibles.length = 0;
    this.outputPowerUps.length = 0;
    
    // Get chunks in range
    const chunksInRange = this.activeChunks.filter(chunk => 
      chunk.startDistance < maxDistance &&
      chunk.startDistance + chunk.length > minDistance
    );
    
    // Process each chunk
    for (const chunk of chunksInRange) {
      // Ensure chunk has patterns if using on-demand generation
      if (this.generateOnDemand) {
        this.ensureChunkPatterns(chunk);
      }
      
      // Process obstacles
      for (const pattern of chunk.obstaclePatterns) {
        const patternDistance = chunk.startDistance + pattern.zOffset;
        
        if (patternDistance >= minDistance && patternDistance <= maxDistance) {
          for (const obstacle of pattern.obstacles) {
            // Use pre-existing position to avoid cloning
            this.outputObstacles.push({
              type: obstacle.type,
              position: obstacle.position
            });
          }
        }
      }
      
      // Process collectibles
      for (const pattern of chunk.collectiblePatterns) {
        const patternDistance = chunk.startDistance + pattern.zOffset;
        
        if (patternDistance >= minDistance && patternDistance <= maxDistance) {
          for (const collectible of pattern.collectibles) {
            this.outputCollectibles.push({
              type: collectible.type,
              position: collectible.position,
              value: collectible.value
            });
          }
        }
      }
      
      // Process power-ups
      for (const pattern of chunk.powerUpPatterns) {
        const patternDistance = chunk.startDistance + pattern.zOffset;
        
        if (patternDistance >= minDistance && patternDistance <= maxDistance) {
          this.outputPowerUps.push({
            type: pattern.type,
            position: pattern.position
          });
        }
      }
    }
    
    // Return shared output arrays
    return { 
      obstacles: this.outputObstacles, 
      collectibles: this.outputCollectibles, 
      powerUps: this.outputPowerUps 
    };
  }

  // Reset the generator (for game restart)
  reset(): void {
    this.currentChunkId = 0;
    this.nextChunkDistance = 0;
    this.difficultyLevel = 1;
    this.seed = Math.floor(Math.random() * 1000000);
    
    // Clear the caches to reduce memory usage
    this.cachedObstacles.clear();
    this.cachedCollectibles.clear();
    
    // Generate new initial chunks
    this.generateInitialChunks();
  }
  
  // Clean up memory
  dispose(): void {
    // Clear caches and chunk data
    this.cachedObstacles.clear();
    this.cachedCollectibles.clear();
    this.activeChunks = [];
    
    // Clear output arrays
    this.outputObstacles.length = 0;
    this.outputCollectibles.length = 0;
    this.outputPowerUps.length = 0;
  }
}
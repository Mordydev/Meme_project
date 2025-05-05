'use client';

import * as THREE from 'three';
import { Vector3, Euler } from 'three';
import { ObstacleType } from './ObstacleManager';
import { EnvironmentZone } from './EnvironmentManager';

// Interface for obstacle definition
export interface ObstacleDefinition {
  type: ObstacleType;
  position: Vector3;
  rotation?: Euler;
  scale?: Vector3;
  movementAmplitude?: number;
  movementFrequency?: number;
  movementAxis?: 'x' | 'y';
}

// Interface for obstacle pattern
export interface ObstaclePattern {
  id: string;
  name: string;
  description: string;
  difficulty: number; // 1-5 scale
  environmentZones: EnvironmentZone[];
  generatePattern: (params: PatternParams) => ObstacleDefinition[];
}

// Parameters for pattern generation
export interface PatternParams {
  zPosition: number;
  width: number;
  height: number;
  difficulty: number;
  seed?: number;
}

/**
 * Collection of obstacle patterns for specific environment zones
 */
export class ZoneObstaclePatterns {
  // All available patterns
  private patterns: ObstaclePattern[] = [];
  
  constructor() {
    this.initializePatterns();
  }
  
  private initializePatterns(): void {
    // Common patterns for all zones
    this.patterns.push(...this.getCommonPatterns());
    
    // Coral Reef zone patterns
    this.patterns.push(...this.getCoralReefPatterns());
    
    // Open Ocean zone patterns
    this.patterns.push(...this.getOpenOceanPatterns());
    
    // Deep Sea zone patterns
    this.patterns.push(...this.getDeepSeaPatterns());
  }
  
  private getCommonPatterns(): ObstaclePattern[] {
    return [
      {
        id: 'wall_with_gap',
        name: 'Wall with Gap',
        description: 'A wall of obstacles with a random gap to swim through',
        difficulty: 2,
        environmentZones: [
          EnvironmentZone.CORAL_REEF,
          EnvironmentZone.OPEN_OCEAN,
          EnvironmentZone.DEEP_SEA
        ],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          const gapWidth = 3 + Math.random() * 2; // Gap width between 3-5 units
          const gapPosition = (Math.random() * 12) - 6; // Gap position between -6 and 6
          
          // Create wall segments
          for (let x = -10; x <= 10; x += 2) {
            // Skip positions where the gap should be
            if (x >= gapPosition - gapWidth/2 && x <= gapPosition + gapWidth/2) {
              continue;
            }
            
            // Add obstacle
            obstacles.push({
              type: ObstacleType.CORAL,
              position: new Vector3(x, Math.random() * 6 - 3, params.zPosition)
            });
          }
          
          return obstacles;
        }
      },
      {
        id: 'tunnel',
        name: 'Tunnel',
        description: 'A circular tunnel to swim through',
        difficulty: 3,
        environmentZones: [
          EnvironmentZone.CORAL_REEF,
          EnvironmentZone.OPEN_OCEAN,
          EnvironmentZone.DEEP_SEA
        ],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          const tunnelRadius = 3 + Math.random() * 2; // Tunnel radius between 3-5 units
          const tunnelCenterX = (Math.random() * 10) - 5; // Center between -5 and 5
          const tunnelCenterY = (Math.random() * 4) - 2; // Center between -2 and 2
          
          // Create obstacles around a circle
          const segments = 12;
          for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = tunnelCenterX + Math.cos(angle) * tunnelRadius;
            const y = tunnelCenterY + Math.sin(angle) * tunnelRadius;
            
            // Add obstacle
            obstacles.push({
              type: i % 2 === 0 ? ObstacleType.CORAL : ObstacleType.ROCK,
              position: new Vector3(x, y, params.zPosition)
            });
          }
          
          return obstacles;
        }
      },
      {
        id: 'diagonal_wall',
        name: 'Diagonal Wall',
        description: 'A diagonal wall that forces player to move up or down',
        difficulty: 2,
        environmentZones: [
          EnvironmentZone.CORAL_REEF,
          EnvironmentZone.OPEN_OCEAN,
          EnvironmentZone.DEEP_SEA
        ],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          const upwardDiagonal = Math.random() > 0.5;
          const obstacleCount = 10;
          
          for (let i = 0; i < obstacleCount; i++) {
            const t = i / (obstacleCount - 1);
            const x = -10 + t * 20; // Spans from -10 to 10
            const y = upwardDiagonal 
              ? -5 + t * 10 // From bottom-left to top-right
              : 5 - t * 10; // From top-left to bottom-right
            
            obstacles.push({
              type: ObstacleType.ROCK,
              position: new Vector3(x, y, params.zPosition)
            });
          }
          
          return obstacles;
        }
      },
      {
        id: 'grid',
        name: 'Grid',
        description: 'A grid of obstacles with random gaps',
        difficulty: 4,
        environmentZones: [
          EnvironmentZone.CORAL_REEF,
          EnvironmentZone.OPEN_OCEAN,
          EnvironmentZone.DEEP_SEA
        ],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          const rows = 3;
          const cols = 5;
          const cellSize = 3;
          
          // Use consistent seed for predictable gaps
          const seed = params.seed || Math.random() * 1000;
          const random = (i: number, j: number) => {
            const val = Math.sin(i * 12.9898 + j * 78.233 + seed) * 43758.5453;
            return val - Math.floor(val);
          };
          
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              // Use seeded random to determine if we place an obstacle (70% chance)
              if (random(row, col) < 0.7) {
                const x = (col * cellSize) - ((cols - 1) * cellSize / 2);
                const y = (row * cellSize) - ((rows - 1) * cellSize / 2);
                
                obstacles.push({
                  type: ObstacleType.CORAL,
                  position: new Vector3(x, y, params.zPosition)
                });
              }
            }
          }
          
          return obstacles;
        }
      },
      {
        id: 'zigzag',
        name: 'Zigzag',
        description: 'A zigzag pattern that forces player to weave through',
        difficulty: 3,
        environmentZones: [
          EnvironmentZone.CORAL_REEF,
          EnvironmentZone.OPEN_OCEAN,
          EnvironmentZone.DEEP_SEA
        ],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          const obstacleSpacing = 4;
          const obstacleCount = 5;
          
          for (let i = 0; i < obstacleCount; i++) {
            const z = params.zPosition - (i * obstacleSpacing);
            const x = i % 2 === 0 ? 5 : -5; // Alternate between left and right
            
            // Create a column of obstacles
            for (let y = -4; y <= 4; y += 2) {
              // Leave a gap in the middle of each column
              if (Math.abs(y) < 2) continue;
              
              obstacles.push({
                type: (i % 3 === 0) ? ObstacleType.JELLYFISH : ObstacleType.CORAL,
                position: new Vector3(x, y, z)
              });
            }
          }
          
          return obstacles;
        }
      }
    ];
  }
  
  private getCoralReefPatterns(): ObstaclePattern[] {
    return [
      {
        id: 'coral_garden',
        name: 'Coral Garden',
        description: 'Dense coral formations with narrow passages',
        difficulty: 3,
        environmentZones: [EnvironmentZone.CORAL_REEF],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create a complex coral garden with varying heights
          const coralCount = 12 + Math.floor(params.difficulty * 3);
          
          // Place corals in a semi-random pattern
          for (let i = 0; i < coralCount; i++) {
            const angle = (i / coralCount) * Math.PI * 2;
            const radius = 3 + Math.random() * 7;
            const x = Math.cos(angle) * radius;
            const y = (Math.random() * 6) - 3;
            
            obstacles.push({
              type: ObstacleType.CORAL,
              position: new Vector3(x, y, params.zPosition),
              scale: new Vector3(
                0.7 + Math.random() * 0.6,
                0.7 + Math.random() * 1.3,
                0.7 + Math.random() * 0.6
              )
            });
            
            // Add smaller, supplementary corals (50% chance)
            if (Math.random() < 0.5) {
              obstacles.push({
                type: ObstacleType.CORAL,
                position: new Vector3(
                  x + (Math.random() * 2 - 1),
                  y - 0.5 + (Math.random() * 1),
                  params.zPosition + (Math.random() * 2 - 1)
                ),
                scale: new Vector3(0.5, 0.5, 0.5)
              });
            }
          }
          
          return obstacles;
        }
      },
      {
        id: 'coral_columns',
        name: 'Coral Columns',
        description: 'Tall columns of coral forcing vertical navigation',
        difficulty: 3,
        environmentZones: [EnvironmentZone.CORAL_REEF],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create columns of coral stacked vertically
          const columnCount = 4 + Math.floor(Math.random() * 3);
          
          for (let i = 0; i < columnCount; i++) {
            const x = -8 + (i * 16 / (columnCount - 1));
            
            // Create a vertical column with multiple coral parts
            const columnHeight = 4 + Math.random() * 4;
            const segmentCount = Math.floor(columnHeight);
            
            for (let j = 0; j < segmentCount; j++) {
              const y = -5 + j * (columnHeight / segmentCount);
              
              obstacles.push({
                type: ObstacleType.CORAL,
                position: new Vector3(x, y, params.zPosition + (Math.random() - 0.5)),
                scale: new Vector3(1 + Math.random() * 0.5, 1, 1 + Math.random() * 0.5)
              });
            }
          }
          
          return obstacles;
        }
      },
      {
        id: 'coral_archway',
        name: 'Coral Archway',
        description: 'A large archway made of coral to swim through',
        difficulty: 2,
        environmentZones: [EnvironmentZone.CORAL_REEF],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create an archway
          const width = 8 + Math.random() * 4;
          const height = 4 + Math.random() * 2;
          const thickness = 2;
          
          // Bottom of the arch
          for (let x = -width/2; x <= width/2; x += 1.5) {
            if (Math.abs(x) > width/3) { // Leave center gap
              obstacles.push({
                type: ObstacleType.CORAL,
                position: new Vector3(x, -4, params.zPosition),
                scale: new Vector3(1 + Math.random() * 0.3, 1 + Math.random() * 0.3, 1)
              });
            }
          }
          
          // Left pillar
          for (let y = -4; y <= height - 4; y += 1.5) {
            obstacles.push({
              type: ObstacleType.CORAL,
              position: new Vector3(-width/2, y, params.zPosition),
              scale: new Vector3(1 + Math.random() * 0.3, 1 + Math.random() * 0.3, 1)
            });
          }
          
          // Right pillar
          for (let y = -4; y <= height - 4; y += 1.5) {
            obstacles.push({
              type: ObstacleType.CORAL,
              position: new Vector3(width/2, y, params.zPosition),
              scale: new Vector3(1 + Math.random() * 0.3, 1 + Math.random() * 0.3, 1)
            });
          }
          
          // Top of the arch
          for (let x = -width/2; x <= width/2; x += 1.5) {
            obstacles.push({
              type: ObstacleType.CORAL,
              position: new Vector3(x, height - 4, params.zPosition),
              scale: new Vector3(1 + Math.random() * 0.3, 1 + Math.random() * 0.3, 1)
            });
          }
          
          return obstacles;
        }
      },
      {
        id: 'pufferfish_minefield',
        name: 'Pufferfish Minefield',
        description: 'A scattered field of stationary pufferfish',
        difficulty: 4,
        environmentZones: [EnvironmentZone.CORAL_REEF],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create a field of pufferfish
          const pufferfishCount = 8 + Math.floor(params.difficulty * 2);
          
          for (let i = 0; i < pufferfishCount; i++) {
            // Place pufferfish in a semi-random grid
            const row = Math.floor(i / 4);
            const col = i % 4;
            
            const x = -7.5 + col * 5 + (Math.random() * 2 - 1);
            const y = -3 + row * 2 + (Math.random() * 2 - 1);
            
            obstacles.push({
              type: ObstacleType.PUFFERFISH,
              position: new Vector3(x, y, params.zPosition + (Math.random() * 4 - 2))
            });
          }
          
          return obstacles;
        }
      }
    ];
  }
  
  private getOpenOceanPatterns(): ObstaclePattern[] {
    return [
      {
        id: 'jellyfish_curtain',
        name: 'Jellyfish Curtain',
        description: 'A wall of jellyfish with coordinated movement',
        difficulty: 3,
        environmentZones: [EnvironmentZone.OPEN_OCEAN],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create a curtain of jellyfish moving up and down
          const jellyfishCount = 10 + Math.floor(params.difficulty * 2);
          
          for (let i = 0; i < jellyfishCount; i++) {
            const x = -10 + (i * 20 / (jellyfishCount - 1));
            const y = Math.sin(i * 0.5) * 3; // Wavy pattern
            
            obstacles.push({
              type: ObstacleType.JELLYFISH,
              position: new Vector3(x, y, params.zPosition),
              movementAmplitude: 2 + Math.random(),
              movementFrequency: 0.5 + Math.random() * 0.5,
              movementAxis: 'y'
            });
          }
          
          return obstacles;
        }
      },
      {
        id: 'shark_patrol',
        name: 'Shark Patrol',
        description: 'Sharks swimming in a patrol pattern',
        difficulty: 5,
        environmentZones: [EnvironmentZone.OPEN_OCEAN],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create a patrol of sharks
          const sharkCount = 1 + Math.floor(params.difficulty * 0.5);
          
          for (let i = 0; i < sharkCount; i++) {
            const z = params.zPosition - i * 10; // Sharks at different distances
            
            obstacles.push({
              type: ObstacleType.SHARK,
              position: new Vector3(-10, 0, z), // Start from the left
              movementAmplitude: 20, // Large lateral movement
              movementFrequency: 0.3,
              movementAxis: 'x'
            });
          }
          
          return obstacles;
        }
      },
      {
        id: 'jellyfish_school',
        name: 'Jellyfish School',
        description: 'A loosely grouped school of jellyfish with random movement',
        difficulty: 4,
        environmentZones: [EnvironmentZone.OPEN_OCEAN],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create a school of jellyfish with random movements
          const jellyfishCount = 12 + Math.floor(params.difficulty * 3);
          
          for (let i = 0; i < jellyfishCount; i++) {
            const x = (Math.random() * 16) - 8;
            const y = (Math.random() * 6) - 1; // More in upper area
            const z = params.zPosition + (Math.random() * 10 - 5);
            
            obstacles.push({
              type: ObstacleType.JELLYFISH,
              position: new Vector3(x, y, z),
              movementAmplitude: 1 + Math.random(),
              movementFrequency: 0.2 + Math.random() * 0.6,
              movementAxis: Math.random() > 0.5 ? 'x' : 'y'
            });
          }
          
          return obstacles;
        }
      },
      {
        id: 'open_ocean_crossing',
        name: 'Open Ocean Crossing',
        description: 'A complex pattern of obstacles moving horizontally',
        difficulty: 5,
        environmentZones: [EnvironmentZone.OPEN_OCEAN],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create multiple horizontal layers with different directions
          const layerCount = 3;
          const obstaclesPerLayer = 5;
          
          for (let layer = 0; layer < layerCount; layer++) {
            const y = -3 + layer * 3; // Evenly spaced layers
            const movingRight = layer % 2 === 0; // Alternate directions
            
            for (let i = 0; i < obstaclesPerLayer; i++) {
              const x = movingRight 
                ? -12 + i * 6 // Start from left
                : 12 - i * 6; // Start from right
                
              const frequency = 0.2 + (layer * 0.1);
              
              obstacles.push({
                type: i % 2 === 0 ? ObstacleType.JELLYFISH : ObstacleType.PUFFERFISH,
                position: new Vector3(x, y, params.zPosition),
                movementAmplitude: 8,
                movementFrequency: frequency,
                movementAxis: 'x'
              });
            }
          }
          
          return obstacles;
        }
      }
    ];
  }
  
  private getDeepSeaPatterns(): ObstaclePattern[] {
    return [
      {
        id: 'deep_sea_rocks',
        name: 'Deep Sea Rocks',
        description: 'Massive rock formations that form narrow passages',
        difficulty: 4,
        environmentZones: [EnvironmentZone.DEEP_SEA],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create large rock formations
          const rockCount = 6 + Math.floor(params.difficulty);
          
          for (let i = 0; i < rockCount; i++) {
            const angle = (i / rockCount) * Math.PI * 2;
            const radius = 4 + Math.random() * 4;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            // Main rock
            obstacles.push({
              type: ObstacleType.ROCK,
              position: new Vector3(x, y, params.zPosition + (Math.random() * 2 - 1)),
              scale: new Vector3(
                1.5 + Math.random() * 1,
                1.5 + Math.random() * 1,
                1.5 + Math.random() * 1
              ),
              rotation: new Euler(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
              )
            });
            
            // Add smaller, supplementary rocks (60% chance)
            if (Math.random() < 0.6) {
              obstacles.push({
                type: ObstacleType.ROCK,
                position: new Vector3(
                  x + (Math.random() * 3 - 1.5),
                  y + (Math.random() * 3 - 1.5),
                  params.zPosition + (Math.random() * 3 - 1.5)
                ),
                scale: new Vector3(
                  0.7 + Math.random() * 0.6,
                  0.7 + Math.random() * 0.6,
                  0.7 + Math.random() * 0.6
                ),
                rotation: new Euler(
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                  Math.random() * Math.PI
                )
              });
            }
          }
          
          return obstacles;
        }
      },
      {
        id: 'hydrothermal_vents',
        name: 'Hydrothermal Vents',
        description: 'Vents from the sea floor with dangerous thermal plumes',
        difficulty: 4,
        environmentZones: [EnvironmentZone.DEEP_SEA],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create hydrothermal vents (using rock type as placeholder)
          const ventCount = 5 + Math.floor(params.difficulty);
          
          for (let i = 0; i < ventCount; i++) {
            const x = -8 + i * (16 / (ventCount - 1));
            const y = -4; // Near the bottom
            
            // Main vent structure
            obstacles.push({
              type: ObstacleType.ROCK,
              position: new Vector3(x, y, params.zPosition),
              scale: new Vector3(0.8, 3, 0.8)
            });
            
            // Dangerous plume above (using jellyfish as placeholder)
            obstacles.push({
              type: ObstacleType.JELLYFISH,
              position: new Vector3(x, y + 4, params.zPosition),
              movementAmplitude: 0.5,
              movementFrequency: 1.5,
              movementAxis: 'y'
            });
          }
          
          return obstacles;
        }
      },
      {
        id: 'angler_fish_hunt',
        name: 'Angler Fish Hunt',
        description: 'Angler fish that suddenly dart toward the player',
        difficulty: 5,
        environmentZones: [EnvironmentZone.DEEP_SEA],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create angler fish (using pufferfish as placeholder)
          const fishCount = 3 + Math.floor(params.difficulty * 0.7);
          
          for (let i = 0; i < fishCount; i++) {
            const side = i % 2 === 0 ? -1 : 1; // Alternate sides
            const x = side * (10 + Math.random() * 2);
            const y = -3 + Math.random() * 6;
            
            obstacles.push({
              type: ObstacleType.PUFFERFISH,
              position: new Vector3(x, y, params.zPosition - i * 3),
              movementAmplitude: 10,
              movementFrequency: 0.1, // Slow movement, then sudden dart
              movementAxis: 'x'
            });
          }
          
          return obstacles;
        }
      },
      {
        id: 'deep_sea_labyrinth',
        name: 'Deep Sea Labyrinth',
        description: 'A complex maze of rock formations',
        difficulty: 5,
        environmentZones: [EnvironmentZone.DEEP_SEA],
        generatePattern: (params) => {
          const obstacles: ObstacleDefinition[] = [];
          
          // Create a labyrinth of rock walls
          const sectionCount = 4;
          const segmentLength = 15 / sectionCount;
          
          for (let i = 0; i < sectionCount; i++) {
            const z = params.zPosition - i * segmentLength;
            
            // Alternate between vertical and horizontal walls
            if (i % 2 === 0) {
              // Vertical wall with gap
              const gapPosition = (Math.random() * 10) - 5;
              const gapWidth = 3 + Math.random();
              
              for (let x = -10; x <= 10; x += 2) {
                if (x >= gapPosition - gapWidth/2 && x <= gapPosition + gapWidth/2) {
                  continue; // Skip the gap
                }
                
                obstacles.push({
                  type: ObstacleType.ROCK,
                  position: new Vector3(x, 0, z),
                  scale: new Vector3(1, 2, 1)
                });
              }
            } else {
              // Horizontal wall with gap
              const gapPosition = (Math.random() * 6) - 3;
              const gapWidth = 2 + Math.random();
              
              for (let y = -4; y <= 4; y += 2) {
                if (y >= gapPosition - gapWidth/2 && y <= gapPosition + gapWidth/2) {
                  continue; // Skip the gap
                }
                
                obstacles.push({
                  type: ObstacleType.ROCK,
                  position: new Vector3(0, y, z),
                  scale: new Vector3(2, 1, 1)
                });
              }
            }
          }
          
          return obstacles;
        }
      }
    ];
  }
  
  // Get patterns for a specific environment zone, filtered by difficulty
  getPatternsForZone(zone: EnvironmentZone, maxDifficulty: number = 5): ObstaclePattern[] {
    return this.patterns.filter(pattern => 
      pattern.environmentZones.includes(zone) && 
      pattern.difficulty <= maxDifficulty
    );
  }
  
  // Get a random pattern for a specific environment zone
  getRandomPatternForZone(zone: EnvironmentZone, difficulty: number): ObstaclePattern {
    // Filter patterns by zone and maximum difficulty
    const eligiblePatterns = this.getPatternsForZone(zone, difficulty);
    
    if (eligiblePatterns.length === 0) {
      // Fallback to any pattern for this zone if none match the difficulty
      const zonePatterns = this.getPatternsForZone(zone);
      return zonePatterns[Math.floor(Math.random() * zonePatterns.length)];
    }
    
    // Return a random eligible pattern
    return eligiblePatterns[Math.floor(Math.random() * eligiblePatterns.length)];
  }
  
  // Get a pattern by ID
  getPatternById(id: string): ObstaclePattern | undefined {
    return this.patterns.find(pattern => pattern.id === id);
  }
}

// Export an instance for singleton usage
export const zoneObstaclePatterns = new ZoneObstaclePatterns();
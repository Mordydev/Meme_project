'use client';

import * as THREE from 'three';
import { Object3D, Vector3 } from 'three';
import React, { JSX } from 'react';
import Coral from '@/components/game/models/Coral';
import Jellyfish from '@/components/game/models/Jellyfish';
import Pufferfish from '@/components/game/models/Pufferfish';
import SharkModel from '@/components/game/models/SharkModel';
import Rock from '@/components/game/models/Rock';

// Define an expanded obstacle type enum
export enum ObstacleType {
  CORAL,
  JELLYFISH,
  SHARK,
  PUFFERFISH,
  ROCK,
  ANEMONE,  // New: Sea anemone that opens/closes
  CLAM,     // New: Opening/closing clam
  DEBRIS,   // New: Floating debris
  ANCHOR,   // New: Sunken anchor
  EEL,      // New: Hiding eel that lunges
  BARRACUDA // New: Fast-moving barracuda
}

// Environment zone enum
export enum EnvironmentZone {
  CORAL_REEF = 'CORAL_REEF',
  OPEN_OCEAN = 'OPEN_OCEAN',
  DEEP_SEA = 'DEEP_SEA',
  SHIPWRECK = 'SHIPWRECK',
  EAST_AUSTRALIAN_CURRENT = 'EAST_AUSTRALIAN_CURRENT'
}

// Lane configuration (must match Player.tsx)
const LANES = {
  LEFT: -2.5,
  CENTER: 0,
  RIGHT: 2.5
};

// Movement patterns for dynamic obstacles
enum MovementPattern {
  STATIC,         // No movement
  VERTICAL,       // Up and down
  HORIZONTAL,     // Side to side
  FIGURE_EIGHT,   // Complex 8-shaped pattern
  PULSING,        // Grow and shrink
  LURKING,        // Hide and lunge
  PATROLLING,     // Move between specific points
  DARTING,        // Quick movements in a direction
  CIRCLING,       // Circular pattern
  SPIRAL          // Spiral movement pattern
}

// Obstacle patterns for more variety
interface ObstaclePattern {
  name: string;
  difficulty: number;
  lanes: string[][];
  types: ObstacleType[];
  verticalPositions: number[];
  zOffsets: number[];
  spacing: number;
  zone: EnvironmentZone;
}

interface ObstacleDefinition {
  type: ObstacleType;
  speed?: number;
  hitboxRadius: number;
  points: number; // Points lost on collision
  movementPattern?: (obstacle: Obstacle, time: number, playerPosition?: Vector3) => void;
  zone?: EnvironmentZone[];
  scale?: number;
  hasProximityEffect?: boolean;
  initialY?: number;
}

export class Obstacle {
  public object: Object3D;
  public definition: ObstacleDefinition;
  public active: boolean = true;
  public hitbox: THREE.Sphere;
  public specialState: any = {}; // For custom state like expansion, rotation, etc.
  public creationTime: number;
  
  constructor(object: Object3D, definition: ObstacleDefinition) {
    this.object = object;
    this.definition = definition;
    this.hitbox = new THREE.Sphere(
      new Vector3().copy(object.position),
      definition.hitboxRadius
    );
    this.creationTime = performance.now() * 0.001;
    
    // Initialize special state if needed
    if (definition.type === ObstacleType.PUFFERFISH || definition.type === ObstacleType.CLAM) {
      this.specialState.expanded = false;
      this.specialState.expansionAmount = 0;
      this.specialState.lastProximityCheck = 0;
    }
    
    // Set scale if provided
    if (definition.scale) {
      object.scale.set(definition.scale, definition.scale, definition.scale);
    }
  }
  
  update(deltaTime: number, currentTime: number, playerPosition?: Vector3): void {
    // Update hitbox position to match object
    this.hitbox.center.copy(this.object.position);
    
    // Apply movement pattern if available
    if (this.definition.movementPattern) {
      this.definition.movementPattern(this, currentTime, playerPosition);
    }
    
    // Update proximity-based effects
    if (this.definition.hasProximityEffect && playerPosition) {
      this.updateProximityEffects(playerPosition);
    }
  }
  
  // Handle proximity-based effects like pufferfish inflation
  updateProximityEffects(playerPosition: Vector3): void {
    // Limit checks to avoid performance issues (check every 100ms)
    const now = performance.now();
    if (now - this.specialState.lastProximityCheck < 100) return;
    this.specialState.lastProximityCheck = now;
    
    // Calculate distance to player
    const distance = this.object.position.distanceTo(playerPosition);
    const proximityThreshold = 5; // Units
    
    switch (this.definition.type) {
      case ObstacleType.PUFFERFISH:
        // Inflate when player is close
        if (distance < proximityThreshold && !this.specialState.expanded) {
          this.specialState.expanded = true;
          // Update hitbox size
          this.hitbox.radius = this.definition.hitboxRadius * 1.5;
          // Set visual expansion (handled in the model component)
          this.object.userData.expanded = true;
        } else if (distance >= proximityThreshold && this.specialState.expanded) {
          this.specialState.expanded = false;
          // Reset hitbox size
          this.hitbox.radius = this.definition.hitboxRadius;
          // Reset visual expansion
          this.object.userData.expanded = false;
        }
        break;
        
      case ObstacleType.CLAM:
        // Close quickly when player approaches
        if (distance < proximityThreshold && !this.specialState.expanded) {
          this.specialState.expanded = true;
          // Update hitbox (closed clam is more dangerous)
          this.hitbox.radius = this.definition.hitboxRadius * 1.2;
          // Set visual state
          this.object.userData.closed = true;
        } else if (distance >= proximityThreshold * 1.5 && this.specialState.expanded) {
          this.specialState.expanded = false;
          // Reset hitbox
          this.hitbox.radius = this.definition.hitboxRadius;
          // Reset visual state
          this.object.userData.closed = false;
        }
        break;
        
      case ObstacleType.EEL:
        // Lunge at player when close
        if (distance < proximityThreshold && !this.specialState.lunging) {
          this.specialState.lunging = true;
          // Begin lunging movement
          this.specialState.lungeStartPosition = this.object.position.clone();
          this.specialState.lungeTargetPosition = playerPosition.clone();
          this.specialState.lungeStartTime = performance.now() * 0.001;
          // Set visual state
          this.object.userData.lunging = true;
        }
        break;
    }
  }
}

export default class ObstacleManager {
  private obstacles: Obstacle[] = [];
  private objectPools: Map<ObstacleType, Object3D[]> = new Map();
  private definitions: Map<ObstacleType, ObstacleDefinition> = new Map();
  private scene: THREE.Object3D | null = null;
  private activeObstacleCount: number = 0;
  private pooledObstacleCount: number = 0;
  
  // Distance at which obstacles should be spawned ahead of player
  private spawnDistance: number = 30;
  // Distance at which obstacles should be removed behind player
  private cullDistance: number = 10;
  // Base obstacle speed (relative to player)
  private baseSpeed: number = 10;
  // Current difficulty level (affects spawn rate and patterns)
  private difficultyLevel: number = 1;
  // Current environment zone
  private currentZone: EnvironmentZone = EnvironmentZone.CORAL_REEF;
  // Pattern generation state
  private lastPatternDistance: number = 0;
  private patternCooldown: number = 0;
  // Time since last obstacle spawn
  private timeSinceLastObstacle: number = 0;
  // Track elapsed time for pattern timing
  private elapsedTime: number = 0;
  
  // Pre-defined obstacle patterns
  private obstaclePatterns: ObstaclePattern[] = [
    // Basic single lane obstacles
    {
      name: "Single Lane Basic",
      difficulty: 1,
      lanes: [['LEFT'], ['CENTER'], ['RIGHT']],
      types: [ObstacleType.CORAL, ObstacleType.ROCK],
      verticalPositions: [0],
      zOffsets: [0],
      spacing: 0,
      zone: EnvironmentZone.CORAL_REEF
    },
    // Double lane pattern
    {
      name: "Double Lane Gap",
      difficulty: 2,
      lanes: [['LEFT', 'RIGHT'], ['LEFT', 'CENTER'], ['CENTER', 'RIGHT']],
      types: [ObstacleType.CORAL, ObstacleType.ROCK, ObstacleType.JELLYFISH],
      verticalPositions: [0, 1.5],
      zOffsets: [0],
      spacing: 0,
      zone: EnvironmentZone.CORAL_REEF
    },
    // Vertical zig-zag pattern
    {
      name: "Vertical ZigZag",
      difficulty: 3,
      lanes: [['LEFT'], ['CENTER'], ['RIGHT'], ['CENTER'], ['LEFT']],
      types: [ObstacleType.JELLYFISH],
      verticalPositions: [1.5, 0, 1.5, 0, 1.5],
      zOffsets: [0, 5, 10, 15, 20],
      spacing: 5,
      zone: EnvironmentZone.CORAL_REEF
    },
    // Slalom pattern
    {
      name: "Slalom",
      difficulty: 4,
      lanes: [['LEFT'], ['RIGHT'], ['LEFT'], ['RIGHT']],
      types: [ObstacleType.CORAL, ObstacleType.ROCK],
      verticalPositions: [0],
      zOffsets: [0, 8, 16, 24],
      spacing: 8,
      zone: EnvironmentZone.OPEN_OCEAN
    },
    // Vertical ladder pattern
    {
      name: "Vertical Ladder",
      difficulty: 4,
      lanes: [['CENTER'], ['CENTER'], ['CENTER']],
      types: [ObstacleType.JELLYFISH],
      verticalPositions: [-1.5, 0, 1.5],
      zOffsets: [0, 5, 10],
      spacing: 5,
      zone: EnvironmentZone.OPEN_OCEAN
    },
    // Shark chase pattern
    {
      name: "Shark Chase",
      difficulty: 5,
      lanes: [['LEFT', 'CENTER'], ['RIGHT', 'CENTER'], ['LEFT', 'RIGHT']],
      types: [ObstacleType.SHARK],
      verticalPositions: [0],
      zOffsets: [0, 15, 30],
      spacing: 15,
      zone: EnvironmentZone.OPEN_OCEAN
    },
    // Deep sea patterns
    {
      name: "Bioluminescent Maze",
      difficulty: 6,
      lanes: [['LEFT', 'RIGHT'], ['LEFT', 'CENTER'], ['CENTER', 'RIGHT']],
      types: [ObstacleType.JELLYFISH, ObstacleType.EEL],
      verticalPositions: [0, 1.5, -1.5],
      zOffsets: [0, 10, 20],
      spacing: 10,
      zone: EnvironmentZone.DEEP_SEA
    },
    // Shipwreck pattern
    {
      name: "Shipwreck Debris",
      difficulty: 6,
      lanes: [['LEFT', 'CENTER'], ['CENTER', 'RIGHT'], ['LEFT', 'RIGHT']],
      types: [ObstacleType.DEBRIS, ObstacleType.ANCHOR],
      verticalPositions: [0, 1.0, -1.0],
      zOffsets: [0, 8, 16],
      spacing: 8,
      zone: EnvironmentZone.SHIPWRECK
    },
    // EAC pattern
    {
      name: "Current Stream",
      difficulty: 5,
      lanes: [['LEFT'], ['CENTER'], ['RIGHT'], ['CENTER'], ['LEFT']],
      types: [ObstacleType.JELLYFISH, ObstacleType.BARRACUDA],
      verticalPositions: [0, 1.0, 0, -1.0, 0],
      zOffsets: [0, 6, 12, 18, 24],
      spacing: 6,
      zone: EnvironmentZone.EAST_AUSTRALIAN_CURRENT
    }
  ];
  
  constructor() {
    this.initializeDefinitions();
  }
  
  setScene(scene: THREE.Object3D): void {
    this.scene = scene;
  }
  
  setZone(zone: EnvironmentZone): void {
    this.currentZone = zone;
  }
  
  private initializeDefinitions(): void {
    // Coral - static obstacle
    this.definitions.set(ObstacleType.CORAL, {
      type: ObstacleType.CORAL,
      hitboxRadius: 1.2,
      points: 10,
      zone: [EnvironmentZone.CORAL_REEF, EnvironmentZone.OPEN_OCEAN],
      scale: 1.2
    });
    
    // Jellyfish - moves up and down
    this.definitions.set(ObstacleType.JELLYFISH, {
      type: ObstacleType.JELLYFISH,
      hitboxRadius: 1.0,
      points: 15,
      zone: [EnvironmentZone.CORAL_REEF, EnvironmentZone.OPEN_OCEAN, EnvironmentZone.DEEP_SEA, EnvironmentZone.EAST_AUSTRALIAN_CURRENT],
      scale: 1.0,
      movementPattern: (obstacle, time) => {
        // Enhanced vertical movement with slight horizontal drift
        obstacle.object.position.y = Math.sin(time * 0.5) * 2 + obstacle.definition.initialY || 0;
        obstacle.object.position.x += Math.sin(time * 0.3) * 0.02;
        
        // Pulsing movement for the jellyfish
        const pulseFactor = 0.9 + Math.sin(time * 2) * 0.1;
        obstacle.object.scale.set(
          obstacle.definition.scale * pulseFactor,
          obstacle.definition.scale * (1 + (1-pulseFactor)*0.5), // Stretch vertically when contracting
          obstacle.definition.scale * pulseFactor
        );
      }
    });
    
    // Shark - moves in patterns
    this.definitions.set(ObstacleType.SHARK, {
      type: ObstacleType.SHARK,
      hitboxRadius: 1.5,
      points: 30,
      speed: 5,
      zone: [EnvironmentZone.OPEN_OCEAN, EnvironmentZone.EAST_AUSTRALIAN_CURRENT],
      scale: 1.5,
      movementPattern: (obstacle, time, playerPosition) => {
        // Enhanced shark movement with more realistic swimming
        const timeSinceCreation = time - obstacle.creationTime;
        
        // Figure-8 pattern with forward swimming motion
        obstacle.object.position.x = Math.sin(timeSinceCreation * 0.7) * 5;
        obstacle.object.position.y = Math.sin(timeSinceCreation * 1.4) * 3 + 
                                     obstacle.definition.initialY || 0;
        
        // Rotate to face movement direction
        const targetRotationZ = Math.atan2(
          Math.cos(timeSinceCreation * 1.4) * 3, 
          Math.cos(timeSinceCreation * 0.7) * 5
        );
        
        // Smooth rotation
        obstacle.object.rotation.z = THREE.MathUtils.lerp(
          obstacle.object.rotation.z,
          targetRotationZ,
          0.1
        );
        
        // Add swimming motion with tail movement
        if (obstacle.object.children[0]) {
          const tailObj = obstacle.object.children[0];
          tailObj.rotation.y = Math.sin(time * 3) * 0.2;
        }
        
        // Make shark face forward direction
        obstacle.object.rotation.y = Math.PI;
      }
    });
    
    // Pufferfish - expands when player gets close
    this.definitions.set(ObstacleType.PUFFERFISH, {
      type: ObstacleType.PUFFERFISH,
      hitboxRadius: 0.8,
      points: 20,
      zone: [EnvironmentZone.CORAL_REEF, EnvironmentZone.OPEN_OCEAN],
      scale: 1.2,
      hasProximityEffect: true,
      movementPattern: (obstacle, time) => {
        // Enhanced side-to-side movement with vertical component
        obstacle.object.position.x = Math.sin(time * 0.3) * 3;
        obstacle.object.position.y = Math.sin(time * 0.2) * 0.5 + 
                                    (obstacle.definition.initialY || 0);
        
        // Rotate to face movement direction
        const xVelocity = Math.cos(time * 0.3) * 3 * 0.3;
        if (Math.abs(xVelocity) > 0.1) {
          const targetRotation = xVelocity > 0 ? Math.PI/2 : -Math.PI/2;
          obstacle.object.rotation.y = THREE.MathUtils.lerp(
            obstacle.object.rotation.y,
            targetRotation,
            0.05
          );
        }
        
        // Apply expansion state from proximity effect
        if (obstacle.object.userData.expanded && obstacle.specialState) {
          // Handle visual inflation (this is a signal to the React component)
          obstacle.object.userData.inflated = true;
          
          // Increase hitbox size
          obstacle.hitbox.radius = obstacle.definition.hitboxRadius * 1.5;
        } else {
          obstacle.object.userData.inflated = false;
          obstacle.hitbox.radius = obstacle.definition.hitboxRadius;
        }
      }
    });
    
    // Rock - static but can be in different formations
    this.definitions.set(ObstacleType.ROCK, {
      type: ObstacleType.ROCK,
      hitboxRadius: 1.5,
      points: 10,
      zone: [EnvironmentZone.CORAL_REEF, EnvironmentZone.OPEN_OCEAN, EnvironmentZone.DEEP_SEA, EnvironmentZone.SHIPWRECK],
      scale: 1.2
    });
    
    // New: Sea anemone
    this.definitions.set(ObstacleType.ANEMONE, {
      type: ObstacleType.ANEMONE,
      hitboxRadius: 1.3,
      points: 15,
      zone: [EnvironmentZone.CORAL_REEF],
      scale: 1.3,
      movementPattern: (obstacle, time) => {
        // Gentle swaying motion for tentacles
        const swayAmount = 0.8 + Math.sin(time * 0.5) * 0.2;
        obstacle.object.scale.set(
          obstacle.definition.scale,
          obstacle.definition.scale * swayAmount,
          obstacle.definition.scale
        );
      }
    });
    
    // New: Opening/closing clam
    this.definitions.set(ObstacleType.CLAM, {
      type: ObstacleType.CLAM,
      hitboxRadius: 1.1,
      points: 15,
      zone: [EnvironmentZone.CORAL_REEF, EnvironmentZone.SHIPWRECK],
      scale: 1.1,
      hasProximityEffect: true,
      movementPattern: (obstacle, time) => {
        // Rhythmic opening and closing when not in proximity mode
        if (!obstacle.specialState.expanded) {
          // Slow rhythmic opening/closing
          const openAmount = Math.sin(time * 0.2) * 0.5 + 0.5; // 0-1 range
          obstacle.object.userData.openAmount = openAmount;
          
          // Hitbox varies based on how open the clam is
          // When fully open, hitbox is smaller (less dangerous)
          obstacle.hitbox.radius = obstacle.definition.hitboxRadius * (1 - openAmount * 0.3);
        } else {
          // When in proximity mode (player is close), clam snaps shut
          obstacle.object.userData.openAmount = 0; // Closed
          obstacle.hitbox.radius = obstacle.definition.hitboxRadius * 1.2; // More dangerous
        }
      }
    });
    
    // New: Floating debris
    this.definitions.set(ObstacleType.DEBRIS, {
      type: ObstacleType.DEBRIS,
      hitboxRadius: 1.4,
      points: 12,
      zone: [EnvironmentZone.SHIPWRECK, EnvironmentZone.EAST_AUSTRALIAN_CURRENT],
      scale: 1.2,
      movementPattern: (obstacle, time) => {
        // Gentle floating and rotating motion
        obstacle.object.position.y = Math.sin(time * 0.3) * 0.5 + 
                                    (obstacle.definition.initialY || 0);
        
        // Slow rotation on all axes
        obstacle.object.rotation.x = time * 0.1;
        obstacle.object.rotation.y = time * 0.15;
        obstacle.object.rotation.z = time * 0.05;
      }
    });
    
    // New: Sunken anchor
    this.definitions.set(ObstacleType.ANCHOR, {
      type: ObstacleType.ANCHOR,
      hitboxRadius: 1.6,
      points: 15,
      zone: [EnvironmentZone.SHIPWRECK],
      scale: 1.4,
      // Mostly static, maybe slight swaying
      movementPattern: (obstacle, time) => {
        // Subtle swaying
        obstacle.object.rotation.z = Math.sin(time * 0.1) * 0.05;
      }
    });
    
    // New: Hiding eel that lunges
    this.definitions.set(ObstacleType.EEL, {
      type: ObstacleType.EEL,
      hitboxRadius: 1.1,
      points: 25,
      zone: [EnvironmentZone.DEEP_SEA, EnvironmentZone.SHIPWRECK],
      scale: 1.1,
      hasProximityEffect: true,
      movementPattern: (obstacle, time, playerPosition) => {
        if (!obstacle.specialState.lunging) {
          // Hiding state - just slight movement of head
          obstacle.object.userData.hidingPercent = 0.8; // 80% hidden
          const headMovement = Math.sin(time * 0.5) * 0.1;
          obstacle.object.userData.headExtension = headMovement;
        } else {
          // Lunging state - move toward player
          const lungeProgress = Math.min(
            1, (time - obstacle.specialState.lungeStartTime) / 0.5
          ); // Complete lunge in 0.5 seconds
          
          // Ease-out function for natural movement
          const eased = 1 - Math.pow(1 - lungeProgress, 3);
          
          // Update hiding percent
          obstacle.object.userData.hidingPercent = Math.max(0, 0.8 - eased * 0.8);
          
          if (lungeProgress >= 1) {
            // Reset lunge after completion
            obstacle.specialState.lunging = false;
          }
        }
      }
    });
    
    // New: Fast-moving barracuda
    this.definitions.set(ObstacleType.BARRACUDA, {
      type: ObstacleType.BARRACUDA,
      hitboxRadius: 1.2,
      points: 20,
      zone: [EnvironmentZone.OPEN_OCEAN, EnvironmentZone.EAST_AUSTRALIAN_CURRENT],
      scale: 1.2,
      speed: 15, // Faster than other obstacles
      movementPattern: (obstacle, time) => {
        // Fast straight-line movement with occasional direction changes
        const timeSinceCreation = time - obstacle.creationTime;
        const directionChangeInterval = 1.5; // seconds
        const directionPhase = Math.floor(timeSinceCreation / directionChangeInterval);
        
        // Generate a pseudo-random direction based on the phase
        const directionSeed = Math.sin(directionPhase * 1234.5678);
        const targetX = (directionSeed * 2 - 1) * 5; // -5 to 5 range
        
        // Calculate delta time using the time difference
        const lerpFactor = 0.1; // Fixed lerp factor instead of delta-based
        
        // Interpolate toward the target position
        obstacle.object.position.x = THREE.MathUtils.lerp(
          obstacle.object.position.x,
          targetX,
          lerpFactor
        );
        
        // Calculate direction for rotation
        const xVelocity = targetX - obstacle.object.position.x;
        if (Math.abs(xVelocity) > 0.01) {
          // Rotate to face movement direction
          const targetRotationY = xVelocity > 0 ? Math.PI/2 : -Math.PI/2;
          obstacle.object.rotation.y = THREE.MathUtils.lerp(
            obstacle.object.rotation.y,
            targetRotationY,
            0.1
          );
        }
        
        // Slight vertical oscillation
        obstacle.object.position.y = Math.sin(time * 2) * 0.3 + 
                                     (obstacle.definition.initialY || 0);
      }
    });
  }
  
  // Import advanced models for obstacles
  private getAdvancedObstacleModel(type: ObstacleType): JSX.Element {
    switch (type) {
      case ObstacleType.CORAL:
        return <Coral scale={1.2} />;
        
      case ObstacleType.JELLYFISH:
        return <Jellyfish scale={1.0} />;
        
      case ObstacleType.PUFFERFISH:
        return <Pufferfish scale={1.2} inflated={false} proximityInflation={true} />;
        
      case ObstacleType.SHARK:
        return <SharkModel scale={1.5} />;
        
      case ObstacleType.ROCK:
      default:
        return <Rock scale={1.2} />;
        
      // TODO: Add models for new obstacle types
      // case ObstacleType.ANEMONE:
      // case ObstacleType.CLAM:
      // case ObstacleType.DEBRIS:
      // case ObstacleType.ANCHOR:
      // case ObstacleType.EEL:
      // case ObstacleType.BARRACUDA:
    }
  }
  
  // Create a simple obstacle mesh for the given type - fallback for compatibility
  private createObstacleMesh(type: ObstacleType): Object3D {
    // Create a placeholder object that will be populated by the proper React components
    // This maintains compatibility with the existing object pooling system
    const placeholder = new THREE.Group();
    
    switch (type) {
      case ObstacleType.CORAL:
        placeholder.userData = { type: 'coral' };
        break;
        
      case ObstacleType.JELLYFISH:
        placeholder.userData = { type: 'jellyfish' };
        break;
        
      case ObstacleType.SHARK:
        placeholder.userData = { type: 'shark' };
        break;
        
      case ObstacleType.PUFFERFISH:
        placeholder.userData = { type: 'pufferfish', inflated: false };
        break;
        
      case ObstacleType.ROCK:
        placeholder.userData = { type: 'rock' };
        break;
        
      case ObstacleType.ANEMONE:
        placeholder.userData = { type: 'anemone' };
        // Temporary visualization
        const anemoneGeometry = new THREE.ConeGeometry(1, 2, 16);
        const anemoneMaterial = new THREE.MeshBasicMaterial({ color: '#FF69B4' });
        const anemoneVisual = new THREE.Mesh(anemoneGeometry, anemoneMaterial);
        anemoneVisual.position.y = 0.5;
        placeholder.add(anemoneVisual);
        break;
        
      case ObstacleType.CLAM:
        placeholder.userData = { type: 'clam', openAmount: 0.5 };
        // Temporary visualization
        const clamGeometry = new THREE.BoxGeometry(2, 1, 1.5);
        const clamMaterial = new THREE.MeshBasicMaterial({ color: '#9370DB' });
        const clamVisual = new THREE.Mesh(clamGeometry, clamMaterial);
        placeholder.add(clamVisual);
        break;
        
      case ObstacleType.DEBRIS:
        placeholder.userData = { type: 'debris' };
        // Temporary visualization
        const debrisGeometry = new THREE.TetrahedronGeometry(1);
        const debrisMaterial = new THREE.MeshBasicMaterial({ color: '#8B4513' });
        const debrisVisual = new THREE.Mesh(debrisGeometry, debrisMaterial);
        placeholder.add(debrisVisual);
        break;
        
      case ObstacleType.ANCHOR:
        placeholder.userData = { type: 'anchor' };
        // Temporary visualization
        const anchorGeometry = new THREE.TorusGeometry(1, 0.3, 8, 16, Math.PI);
        const anchorMaterial = new THREE.MeshBasicMaterial({ color: '#708090' });
        const anchorVisual = new THREE.Mesh(anchorGeometry, anchorMaterial);
        const anchorPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 3),
          anchorMaterial
        );
        anchorPole.position.y = 1.5;
        placeholder.add(anchorVisual);
        placeholder.add(anchorPole);
        break;
        
      case ObstacleType.EEL:
        placeholder.userData = { type: 'eel', hidingPercent: 0.8, headExtension: 0 };
        // Temporary visualization
        const eelGeometry = new THREE.CylinderGeometry(0.3, 0.1, 2);
        const eelMaterial = new THREE.MeshBasicMaterial({ color: '#556B2F' });
        const eelVisual = new THREE.Mesh(eelGeometry, eelMaterial);
        eelVisual.rotation.x = Math.PI / 2;
        eelVisual.position.z = 1;
        placeholder.add(eelVisual);
        break;
        
      case ObstacleType.BARRACUDA:
        placeholder.userData = { type: 'barracuda' };
        // Temporary visualization
        const barracudaGeometry = new THREE.CylinderGeometry(0.2, 0.5, 2.5);
        const barracudaMaterial = new THREE.MeshBasicMaterial({ color: '#A9A9A9' });
        const barracudaVisual = new THREE.Mesh(barracudaGeometry, barracudaMaterial);
        barracudaVisual.rotation.z = Math.PI / 2;
        placeholder.add(barracudaVisual);
        break;
    }
    
    return placeholder;
  }
  
  private getObstacleFromPool(type: ObstacleType): Object3D {
    if (!this.objectPools.has(type)) {
      this.objectPools.set(type, []);
    }
    
    const pool = this.objectPools.get(type)!;
    
    if (pool.length > 0) {
      this.pooledObstacleCount--;
      return pool.pop()!;
    }
    
    // If pool is empty, create a batch of new objects to improve performance
    const batchSize = 5;
    for (let i = 0; i < batchSize - 1; i++) {
      pool.push(this.createObstacleMesh(type));
      this.pooledObstacleCount++;
    }
    
    return this.createObstacleMesh(type);
  }
  
  private returnObstacleToPool(obstacle: Obstacle): void {
    if (!this.scene) return;
    
    // Remove from scene
    this.scene.remove(obstacle.object);
    
    // Reset object state
    obstacle.object.visible = true;
    obstacle.object.position.set(0, 0, 0);
    obstacle.object.rotation.set(0, 0, 0);
    obstacle.object.scale.set(1, 1, 1);
    
    // Reset special state properties
    if (obstacle.definition.type === ObstacleType.PUFFERFISH) {
      obstacle.object.userData.inflated = false;
    } else if (obstacle.definition.type === ObstacleType.CLAM) {
      obstacle.object.userData.openAmount = 0.5;
    } else if (obstacle.definition.type === ObstacleType.EEL) {
      obstacle.object.userData.hidingPercent = 0.8;
      obstacle.object.userData.headExtension = 0;
    }
    
    // Add to pool
    if (!this.objectPools.has(obstacle.definition.type)) {
      this.objectPools.set(obstacle.definition.type, []);
    }
    
    const pool = this.objectPools.get(obstacle.definition.type)!;
    pool.push(obstacle.object);
    
    // Update counts
    this.activeObstacleCount--;
    this.pooledObstacleCount++;
  }
  
  spawnObstacle(type: ObstacleType, position: Vector3): Obstacle | null {
    if (!this.scene || !this.definitions.has(type)) return null;
    
    const definition = this.definitions.get(type)!;
    
    // Check if this obstacle type belongs in the current zone
    if (definition.zone && !definition.zone.includes(this.currentZone)) {
      // Fall back to a zone-appropriate obstacle
      return this.spawnZoneAppropriateObstacle(position);
    }
    
    const object = this.getObstacleFromPool(type);
    
    // Set initial position and store it in the definition
    // This is important for movement patterns that need a reference point
    const initialY = position.y;
    const updatedDefinition = {
      ...definition,
      initialY 
    };
    
    // Position the obstacle
    object.position.copy(position);
    
    // Add to scene
    this.scene.add(object);
    
    // Create obstacle instance
    const obstacle = new Obstacle(object, updatedDefinition);
    this.obstacles.push(obstacle);
    
    // Update count
    this.activeObstacleCount++;
    
    return obstacle;
  }
  
  // Fallback method to spawn a zone-appropriate obstacle
  private spawnZoneAppropriateObstacle(position: Vector3): Obstacle | null {
    let zoneAppropriateTypes: ObstacleType[] = [];
    
    // Find all obstacle types appropriate for the current zone
    this.definitions.forEach((definition, type) => {
      if (!definition.zone || definition.zone.includes(this.currentZone)) {
        zoneAppropriateTypes.push(type);
      }
    });
    
    if (zoneAppropriateTypes.length === 0) {
      // Default to coral if nothing else works
      zoneAppropriateTypes = [ObstacleType.CORAL];
    }
    
    // Randomly select a zone-appropriate obstacle type
    const randomType = zoneAppropriateTypes[
      Math.floor(Math.random() * zoneAppropriateTypes.length)
    ];
    
    return this.spawnObstacle(randomType, position);
  }
  
  // Generate predefined patterns based on difficulty
  generatePattern(distance: number, playerPosition: Vector3): void {
    // Calculate z position for new obstacles
    const zPosition = -this.spawnDistance;
    
    this.elapsedTime += 1/60; // Approximate frame time
    this.timeSinceLastObstacle += 1/60;
    
    // Wait for pattern cooldown to expire
    if (this.patternCooldown > 0) {
      this.patternCooldown -= 1/60;
      return;
    }
    
    // Determine if we should spawn a pattern based on distance and time
    const distanceSinceLastPattern = distance - this.lastPatternDistance;
    const minPatternDistance = 30; // Minimum distance between patterns
    
    // Create a breathing room between patterns
    if (distanceSinceLastPattern < minPatternDistance) {
      return;
    }
    
    // Calculate a base spawn chance that increases with difficulty
    const spawnChance = 0.01 + (this.difficultyLevel * 0.002);
    
    // Increase spawn chance the longer we've gone without spawning
    const timeBonus = Math.min(0.02, this.timeSinceLastObstacle * 0.001);
    const effectiveSpawnChance = spawnChance + timeBonus;
    
    // More complex pattern selection based on difficulty and zone
    if (Math.random() < effectiveSpawnChance || distanceSinceLastPattern > minPatternDistance * 3) {
      // Filter patterns by difficulty and zone
      const validPatterns = this.obstaclePatterns.filter(pattern => 
        pattern.difficulty <= this.difficultyLevel &&
        (pattern.zone === this.currentZone || pattern.zone === EnvironmentZone.CORAL_REEF) // Fallback to coral reef patterns
      );
      
      if (validPatterns.length > 0) {
        // Select a random pattern from valid ones
        const pattern = validPatterns[Math.floor(Math.random() * validPatterns.length)];
        
        // Special case for more difficult patterns - lower chance
        if (pattern.difficulty > this.difficultyLevel - 1 && Math.random() > 0.3) {
          // Try again next time
          return;
        }
        
        // Spawn the pattern
        this.spawnObstaclePattern(pattern, zPosition);
        
        // Update pattern state
        this.lastPatternDistance = distance;
        this.patternCooldown = pattern.spacing * 0.15; // Cooldown based on pattern spacing
        this.timeSinceLastObstacle = 0;
        return;
      }
    }
    
    // If no pattern is spawned, fall back to random obstacle generation
    this.generateRandomObstacles(zPosition);
  }
  
  // Spawn a specific obstacle pattern
  private spawnObstaclePattern(pattern: ObstaclePattern, baseZPosition: number): void {
    // Loop through the pattern definition
    for (let i = 0; i < pattern.lanes.length; i++) {
      // Get the lanes for this pattern element
      const lanes = pattern.lanes[i];
      
      // Get the vertical position for this element (default to 0 if not specified)
      const yPos = pattern.verticalPositions[i] || 0;
      
      // Get the z-offset for this element
      const zOffset = pattern.zOffsets[i] || 0;
      
      // Calculate the final z-position
      const zPos = baseZPosition - zOffset;
      
      // Randomly select an obstacle type from the pattern's types
      const obstacleType = pattern.types[
        Math.floor(Math.random() * pattern.types.length)
      ];
      
      // Spawn obstacles in each lane
      for (const lane of lanes) {
        let xPos = LANES.CENTER;
        
        switch (lane) {
          case 'LEFT':
            xPos = LANES.LEFT;
            break;
          case 'CENTER':
            xPos = LANES.CENTER;
            break;
          case 'RIGHT':
            xPos = LANES.RIGHT;
            break;
        }
        
        // Spawn the obstacle
        this.spawnObstacle(
          obstacleType, 
          new Vector3(xPos, yPos, zPos)
        );
      }
    }
  }
  
  // Generate random obstacles (fallback method)
  private generateRandomObstacles(zPosition: number): void {
    // Base spawn chance increases with difficulty
    const spawnChance = 0.2 + (this.difficultyLevel * 0.05);
    
    if (Math.random() < spawnChance) {
      // Determine obstacle type based on difficulty, randomness, and current zone
      let eligibleTypes: ObstacleType[] = [];
      
      // Find obstacles appropriate for current zone and difficulty
      this.definitions.forEach((definition, type) => {
        if ((!definition.zone || definition.zone.includes(this.currentZone)) && 
            this.isObstacleAllowedAtDifficulty(type, this.difficultyLevel)) {
          eligibleTypes.push(type);
        }
      });
      
      // Fallback if no eligible types are found
      if (eligibleTypes.length === 0) {
        eligibleTypes = [ObstacleType.CORAL, ObstacleType.ROCK];
      }
      
      // Select a random obstacle type from eligible ones
      const type = eligibleTypes[Math.floor(Math.random() * eligibleTypes.length)];
      
      // Select which lane(s) to place obstacles in
      const lanePattern = this.selectLanePattern();
      
      // Place obstacles in the selected lanes
      for (const lane of lanePattern) {
        let xPos = LANES.CENTER;
        
        switch (lane) {
          case 'LEFT':
            xPos = LANES.LEFT;
            break;
          case 'CENTER':
            xPos = LANES.CENTER;
            break;
          case 'RIGHT':
            xPos = LANES.RIGHT;
            break;
        }
        
        // Determine vertical position (for jumps and dives)
        let yPos = 0; // Default ground level
        
        // Some obstacles should be in the air (requiring jumps)
        if (type === ObstacleType.JELLYFISH && Math.random() < 0.7) {
          yPos = 1.5; // Above ground - player must jump
        } 
        // Some obstacles should be lower (requiring dives)
        else if (type === ObstacleType.PUFFERFISH && Math.random() < 0.4) {
          yPos = -1.0; // Below ground - player must dive
        }
        // Eels are usually at the bottom
        else if (type === ObstacleType.EEL) {
          yPos = -1.0;
        }
        
        this.spawnObstacle(
          type, 
          new Vector3(xPos, yPos, zPosition)
        );
      }
      
      // Reset the time since last obstacle
      this.timeSinceLastObstacle = 0;
    }
  }
  
  // Helper to determine if an obstacle type is allowed at current difficulty
  private isObstacleAllowedAtDifficulty(type: ObstacleType, difficulty: number): boolean {
    // Early game: mostly coral and rocks
    if (difficulty < 2) {
      return [ObstacleType.CORAL, ObstacleType.ROCK].includes(type);
    } 
    // Mid game: introduce jellyfish, pufferfish, anemones
    else if (difficulty < 4) {
      return [
        ObstacleType.CORAL, ObstacleType.ROCK, 
        ObstacleType.JELLYFISH, ObstacleType.PUFFERFISH,
        ObstacleType.ANEMONE, ObstacleType.CLAM
      ].includes(type);
    } 
    // Late game: introduce all obstacle types
    else {
      return true; // All obstacle types allowed
    }
  }
  
  // Helper method to select lane patterns based on difficulty
  private selectLanePattern(): string[] {
    const patterns = [
      ['LEFT'], 
      ['CENTER'], 
      ['RIGHT'],
      ['LEFT', 'CENTER'],
      ['CENTER', 'RIGHT'],
      ['LEFT', 'RIGHT'],
      ['LEFT', 'CENTER', 'RIGHT']
    ];
    
    // Early game has simpler patterns
    if (this.difficultyLevel < 3) {
      return patterns[Math.floor(Math.random() * 3)]; // Single lane obstacles
    } 
    // Mid game introduces double-lane obstacles
    else if (this.difficultyLevel < 6) {
      return patterns[Math.floor(Math.random() * 6)]; // Single or double lane
    } 
    // Late game introduces triple-lane obstacles that require timing
    else {
      return patterns[Math.floor(Math.random() * patterns.length)];
    }
  }
  
  update(deltaTime: number, playerPosition: Vector3, distance: number): void {
    const currentTime = performance.now() * 0.001;
    
    // Update difficulty based on distance
    this.difficultyLevel = 1 + Math.floor(distance / 500);
    
    // Generate new obstacles
    this.generatePattern(distance, playerPosition);
    
    // Update existing obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      
      if (!obstacle.active) continue;
      
      // Move obstacle forward (toward player)
      const speed = obstacle.definition.speed || this.baseSpeed;
      obstacle.object.position.z += speed * deltaTime;
      
      // Update obstacle logic with player position for proximity effects
      obstacle.update(deltaTime, currentTime, playerPosition);
      
      // Remove obstacles that have passed the player
      if (obstacle.object.position.z > this.cullDistance) {
        this.returnObstacleToPool(obstacle);
        this.obstacles.splice(i, 1);
      }
    }
  }
  
  checkCollisions(playerPosition: Vector3, playerRadius: number): Obstacle | null {
    // Create a sphere for the player
    const playerSphere = new THREE.Sphere(playerPosition, playerRadius);
    
    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;
      
      // Check for collision with obstacle
      if (playerSphere.intersectsSphere(obstacle.hitbox)) {
        return obstacle;
      }
    }
    
    return null;
  }
  
  // Method to check for near misses (for score multiplier)
  checkNearMiss(playerPosition: Vector3, playerRadius: number, threshold: number = 1.0): boolean {
    // Create a slightly larger sphere for near miss detection
    const nearMissRadius = playerRadius + threshold;
    const playerNearSphere = new THREE.Sphere(playerPosition, nearMissRadius);
    
    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;
      
      // Check for near miss with obstacle (close but not colliding)
      if (playerNearSphere.intersectsSphere(obstacle.hitbox) && 
          !obstacle.hitbox.intersectsSphere(new THREE.Sphere(playerPosition, playerRadius))) {
        return true;
      }
    }
    
    return false;
  }
  
  // Get memory usage statistics
  getMemoryStats(): { active: number, pooled: number } {
    return {
      active: this.activeObstacleCount,
      pooled: this.pooledObstacleCount
    };
  }

  reset(): void {
    // Return all obstacles to pool
    for (const obstacle of this.obstacles) {
      this.returnObstacleToPool(obstacle);
    }
    
    // Clear obstacles array
    this.obstacles = [];
    
    // Reset difficulty and pattern state
    this.difficultyLevel = 1;
    this.lastPatternDistance = 0;
    this.patternCooldown = 0;
    this.timeSinceLastObstacle = 0;
    this.elapsedTime = 0;
  }
  
  // Clean up resources
  dispose(): void {
    // Return all obstacles to pool first
    this.reset();
    
    // Clear all object pools to release memory
    this.objectPools.clear();
    
    // Reset counts
    this.activeObstacleCount = 0;
    this.pooledObstacleCount = 0;
  }
}
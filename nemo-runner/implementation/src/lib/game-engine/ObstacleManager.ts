'use client';

import * as THREE from 'three';
import { Object3D, Vector3 } from 'three';
import React from 'react';
import Coral from '@/components/game/models/Coral';
import Jellyfish from '@/components/game/models/Jellyfish';
import Pufferfish from '@/components/game/models/Pufferfish';
import SharkModel from '@/components/game/models/SharkModel';
import Rock from '@/components/game/models/Rock';

export enum ObstacleType {
  CORAL,
  JELLYFISH,
  SHARK,
  PUFFERFISH,
  ROCK
}

// Lane configuration (must match Player.tsx)
const LANES = {
  LEFT: -2.5,
  CENTER: 0,
  RIGHT: 2.5
};

interface ObstacleDefinition {
  type: ObstacleType;
  speed?: number;
  hitboxRadius: number;
  points: number; // Points lost on collision
  movementPattern?: (obstacle: Obstacle, time: number) => void;
}

export class Obstacle {
  public object: Object3D;
  public definition: ObstacleDefinition;
  public active: boolean = true;
  public hitbox: THREE.Sphere;
  
  constructor(object: Object3D, definition: ObstacleDefinition) {
    this.object = object;
    this.definition = definition;
    this.hitbox = new THREE.Sphere(
      new Vector3().copy(object.position),
      definition.hitboxRadius
    );
  }
  
  update(deltaTime: number, currentTime: number): void {
    // Update hitbox position to match object
    this.hitbox.center.copy(this.object.position);
    
    // Apply movement pattern if available
    if (this.definition.movementPattern) {
      this.definition.movementPattern(this, currentTime);
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
  
  constructor() {
    this.initializeDefinitions();
  }
  
  setScene(scene: THREE.Object3D): void {
    this.scene = scene;
  }
  
  private initializeDefinitions(): void {
    // Coral - static obstacle
    this.definitions.set(ObstacleType.CORAL, {
      type: ObstacleType.CORAL,
      hitboxRadius: 1.2,
      points: 10
    });
    
    // Jellyfish - moves up and down
    this.definitions.set(ObstacleType.JELLYFISH, {
      type: ObstacleType.JELLYFISH,
      hitboxRadius: 1.0,
      points: 15,
      movementPattern: (obstacle, time) => {
        obstacle.object.position.y = Math.sin(time * 0.5) * 2;
      }
    });
    
    // Shark - moves in patterns
    this.definitions.set(ObstacleType.SHARK, {
      type: ObstacleType.SHARK,
      hitboxRadius: 1.5,
      points: 30,
      speed: 5,
      movementPattern: (obstacle, time) => {
        // Shark moves in a figure-8 pattern
        obstacle.object.position.x = Math.sin(time * 0.7) * 5;
        obstacle.object.position.y = Math.sin(time * 1.4) * 3;
        // Rotate to face movement direction
        obstacle.object.rotation.z = Math.atan2(
          Math.cos(time * 1.4) * 3, 
          Math.cos(time * 0.7) * 5
        );
      }
    });
    
    // Pufferfish - expands when player gets close
    this.definitions.set(ObstacleType.PUFFERFISH, {
      type: ObstacleType.PUFFERFISH,
      hitboxRadius: 0.8,
      points: 20,
      movementPattern: (obstacle, time) => {
        // Simple side-to-side movement
        obstacle.object.position.x = Math.sin(time * 0.3) * 3;
      }
    });
    
    // Rock - static but can be in different formations
    this.definitions.set(ObstacleType.ROCK, {
      type: ObstacleType.ROCK,
      hitboxRadius: 1.5,
      points: 10
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
        // Shark model to be added - for now use a placeholder
        return <SharkModel scale={1.5} />;
        
      case ObstacleType.ROCK:
      default:
        return <Rock scale={1.2} />;
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
        placeholder.userData = { type: 'pufferfish' };
        break;
        
      case ObstacleType.ROCK:
      default:
        placeholder.userData = { type: 'rock' };
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
  
  spawnObstacle(type: ObstacleType, position: Vector3): Obstacle {
    if (!this.scene || !this.definitions.has(type)) return null!;
    
    const definition = this.definitions.get(type)!;
    const object = this.getObstacleFromPool(type);
    
    // Position the obstacle
    object.position.copy(position);
    
    // Add to scene
    this.scene.add(object);
    
    // Create obstacle instance
    const obstacle = new Obstacle(object, definition);
    this.obstacles.push(obstacle);
    
    // Update count
    this.activeObstacleCount++;
    
    return obstacle;
  }
  
  generatePattern(distance: number, playerPosition: Vector3): void {
    // Calculate z position for new obstacles
    const zPosition = -this.spawnDistance;
    
    // Base spawn chance increases with difficulty
    const spawnChance = 0.3 + (this.difficultyLevel * 0.1);
    
    if (Math.random() < spawnChance) {
      // Determine obstacle type based on difficulty and randomness
      let type: ObstacleType;
      const rand = Math.random();
      
      if (this.difficultyLevel < 2) {
        // Early game: mostly coral and rocks
        type = rand < 0.7 ? ObstacleType.CORAL : ObstacleType.ROCK;
      } else if (this.difficultyLevel < 4) {
        // Mid game: introduce jellyfish and pufferfish
        if (rand < 0.4) type = ObstacleType.CORAL;
        else if (rand < 0.7) type = ObstacleType.ROCK;
        else if (rand < 0.9) type = ObstacleType.JELLYFISH;
        else type = ObstacleType.PUFFERFISH;
      } else {
        // Late game: introduce sharks and more complex patterns
        if (rand < 0.3) type = ObstacleType.CORAL;
        else if (rand < 0.5) type = ObstacleType.ROCK;
        else if (rand < 0.7) type = ObstacleType.JELLYFISH;
        else if (rand < 0.9) type = ObstacleType.PUFFERFISH;
        else type = ObstacleType.SHARK;
      }
      
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
        
        this.spawnObstacle(
          type, 
          new Vector3(xPos, yPos, zPosition)
        );
      }
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
      
      // Update obstacle logic
      obstacle.update(deltaTime, currentTime);
      
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
    
    // Reset difficulty
    this.difficultyLevel = 1;
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
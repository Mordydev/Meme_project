'use client';

import * as THREE from 'three';
import { Object3D, Vector3 } from 'three';

export enum ObstacleType {
  CORAL,
  JELLYFISH,
  SHARK,
  PUFFERFISH,
  ROCK
}

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
  
  // Create a simple obstacle mesh for the given type
  private createObstacleMesh(type: ObstacleType): Object3D {
    switch (type) {
      case ObstacleType.CORAL:
        const coral = new THREE.Group();
        
        // Main body
        const coralBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 1, 2, 8),
          new THREE.MeshStandardMaterial({ color: '#FF5A5F' })
        );
        coralBase.position.y = 1;
        coral.add(coralBase);
        
        // Branches
        for (let i = 0; i < 5; i++) {
          const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.1, 1 + Math.random(), 6),
            new THREE.MeshStandardMaterial({ color: '#FF5A5F' })
          );
          
          const angle = (i / 5) * Math.PI * 2;
          const radius = 0.5;
          
          branch.position.set(
            Math.cos(angle) * radius,
            2 + Math.random() * 0.5,
            Math.sin(angle) * radius
          );
          
          branch.rotation.x = Math.random() * 0.5 - 0.25;
          branch.rotation.z = Math.random() * 0.5 - 0.25;
          
          coral.add(branch);
        }
        
        return coral;
        
      case ObstacleType.JELLYFISH:
        const jellyfish = new THREE.Group();
        
        // Bell (dome)
        const bell = new THREE.Mesh(
          new THREE.SphereGeometry(1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ 
            color: '#9C59B6', 
            transparent: true, 
            opacity: 0.8 
          })
        );
        bell.rotation.x = Math.PI;
        jellyfish.add(bell);
        
        // Tentacles
        for (let i = 0; i < 8; i++) {
          const tentacle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.02, 2, 4),
            new THREE.MeshStandardMaterial({ 
              color: '#9C59B6',
              transparent: true,
              opacity: 0.7
            })
          );
          
          const angle = (i / 8) * Math.PI * 2;
          const radius = 0.7;
          
          tentacle.position.set(
            Math.cos(angle) * radius,
            -1,
            Math.sin(angle) * radius
          );
          
          tentacle.rotation.x = Math.PI / 2;
          jellyfish.add(tentacle);
        }
        
        return jellyfish;
        
      case ObstacleType.SHARK:
        const shark = new THREE.Group();
        
        // Body
        const body = new THREE.Mesh(
          new THREE.CapsuleGeometry(1, 3, 8, 8),
          new THREE.MeshStandardMaterial({ color: '#7F8C8D' })
        );
        body.rotation.z = Math.PI / 2;
        shark.add(body);
        
        // Tail
        const tail = new THREE.Mesh(
          new THREE.ConeGeometry(1, 2, 4),
          new THREE.MeshStandardMaterial({ color: '#7F8C8D' })
        );
        tail.position.x = -2.5;
        tail.rotation.z = Math.PI / 2;
        shark.add(tail);
        
        // Dorsal fin
        const dorsalFin = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 1, 4),
          new THREE.MeshStandardMaterial({ color: '#7F8C8D' })
        );
        dorsalFin.position.set(0, 1.5, 0);
        dorsalFin.rotation.z = Math.PI;
        shark.add(dorsalFin);
        
        return shark;
        
      case ObstacleType.PUFFERFISH:
        const pufferfish = new THREE.Group();
        
        // Body
        const puffBody = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 16, 16),
          new THREE.MeshStandardMaterial({ color: '#F39C12' })
        );
        pufferfish.add(puffBody);
        
        // Spikes
        for (let i = 0; i < 20; i++) {
          const spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.1, 0.5, 4),
            new THREE.MeshStandardMaterial({ color: '#F39C12' })
          );
          
          // Random position on sphere
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const radius = 0.8;
          
          spike.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
          );
          
          // Point away from center
          spike.lookAt(spike.position.clone().multiplyScalar(2));
          
          pufferfish.add(spike);
        }
        
        return pufferfish;
        
      case ObstacleType.ROCK:
      default:
        const rock = new THREE.Group();
        
        // Main boulder
        const boulder = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.5, 0),
          new THREE.MeshStandardMaterial({ color: '#7F8C8D' })
        );
        rock.add(boulder);
        
        // Smaller rocks
        for (let i = 0; i < 3; i++) {
          const smallRock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0),
            new THREE.MeshStandardMaterial({ color: '#7F8C8D' })
          );
          
          smallRock.position.set(
            (Math.random() - 0.5) * 2,
            -0.5 + Math.random() * 0.5,
            (Math.random() - 0.5) * 2
          );
          
          smallRock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );
          
          rock.add(smallRock);
        }
        
        return rock;
    }
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
      
      // Determine position based on type and pattern
      let xPos, yPos;
      
      if (type === ObstacleType.SHARK) {
        // Sharks start from edges
        xPos = Math.random() < 0.5 ? -10 : 10;
        yPos = Math.random() * 6 - 3;
      } else if (type === ObstacleType.JELLYFISH) {
        // Jellyfish in upper areas
        xPos = Math.random() * 16 - 8;
        yPos = Math.random() * 3 + 2;
      } else {
        // Other obstacles can be anywhere
        xPos = Math.random() * 16 - 8;
        yPos = Math.random() * 8 - 4;
      }
      
      this.spawnObstacle(
        type, 
        new Vector3(xPos, yPos, zPosition)
      );
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
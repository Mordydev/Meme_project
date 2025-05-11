import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { configSystem } from '../core/ConfigurationSystem';
import { ClamAsset } from '../assets/obstacles/ClamAsset';
// import { EnvironmentManager } from './EnvironmentManager'; // To know where to spawn

type ObstacleType = 'coral' | 'rock' | 'clam';

interface Obstacle {
  mesh: THREE.Mesh | THREE.Group;
  isActive: boolean;
  type: ObstacleType;
  // Add other properties like speed (for moving obstacles) later
}

export class ObstacleManager {
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;
  // private environmentManager: EnvironmentManager;

  public activeObstacles: Obstacle[] = []; // Public for collision detection access
  public obstaclePool: Obstacle[] = [];
  private poolSize = 15; // Increased to accommodate more obstacle types

  private spawnIntervalMin = 2; // seconds
  private spawnIntervalMax = 4; // seconds
  private timeToNextSpawn = 0;

  private lastSpawnZ = 0; // Keep track of Z to avoid too close spawns
  private minZSpacing = 10; // Minimum Z distance between obstacles

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory /*, environmentManager: EnvironmentManager */) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    // this.environmentManager = environmentManager;
    this.initializePool();
    this.resetTimeToNextSpawn();
    console.log("ObstacleManager: Initialized.");
  }

  private initializePool(): void {
    console.log("ObstacleManager: Initializing obstacle pool with size", this.poolSize);

    // Create an even distribution of obstacle types in the pool
    const obstacleTypes: ObstacleType[] = ['coral', 'rock', 'clam'];

    for (let i = 0; i < this.poolSize; i++) {
      // Cycle through obstacle types
      const type = obstacleTypes[i % obstacleTypes.length];
      const mesh = this.assetFactory.createObstacleMesh(type);
      mesh.visible = false;
      this.scene.add(mesh);
      this.obstaclePool.push({ mesh, isActive: false, type });
      console.log(`ObstacleManager: Created ${type} obstacle ${i} with mesh:`, mesh);
    }
  }

  private getInactiveObstacle(preferredType?: ObstacleType): Obstacle | undefined {
    if (preferredType) {
      // First try to find an inactive obstacle of the preferred type
      const typedObstacle = this.obstaclePool.find(obs => !obs.isActive && obs.type === preferredType);
      if (typedObstacle) return typedObstacle;
    }

    // If no preferred type or none found, get any inactive obstacle
    return this.obstaclePool.find(obs => !obs.isActive);
  }

  private resetTimeToNextSpawn(): void {
    this.timeToNextSpawn = Math.random() * (this.spawnIntervalMax - this.spawnIntervalMin) + this.spawnIntervalMin;
  }

  private spawnObstacle(playerZ: number): void {
    // Randomly choose an obstacle type with different weights
    const rand = Math.random();
    let type: ObstacleType;

    if (rand < 0.4) {
      type = 'coral';    // 40% chance for coral
    } else if (rand < 0.7) {
      type = 'rock';     // 30% chance for rock
    } else {
      type = 'clam';     // 30% chance for clam
    }

    const obstacle = this.getInactiveObstacle(type);
    if (!obstacle) {
      console.warn(`ObstacleManager: No inactive ${type} obstacles in pool to spawn!`);
      return;
    }

    obstacle.isActive = true;
    obstacle.mesh.visible = true;

    // Determine spawn position
    const laneIndex = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    const laneWidth = configSystem.getPlayerLaneWidth();
    obstacle.mesh.position.x = laneIndex * laneWidth;

    // Spawn ahead of the player, further than the last spawn
    const spawnDistanceAhead = 30 + Math.random() * 20; // 30-50 units ahead
    let targetZ = playerZ - spawnDistanceAhead;

    // Ensure minimum Z spacing from the last spawned obstacle
    if (this.activeObstacles.length > 0 && (this.lastSpawnZ - targetZ) < this.minZSpacing) {
        targetZ = this.lastSpawnZ - this.minZSpacing - (Math.random() * 5); // Add a bit more random spacing
    }

    obstacle.mesh.position.z = targetZ;
    this.lastSpawnZ = targetZ; // Update Z of last spawn

    // Adjust Y position based on obstacle type
    if (obstacle.type === 'rock') {
      obstacle.mesh.position.y = -0.85; // Rocks sit slightly higher on the floor
    } else if (obstacle.type === 'clam') {
      obstacle.mesh.position.y = -0.9; // Clams slightly above floor
    } else {
      obstacle.mesh.position.y = -0.95; // Standard coral position
    }

    // Add to active obstacles list for collision detection
    this.activeObstacles.push(obstacle);

    console.log(`ObstacleManager: Spawned ${obstacle.type} at x:${obstacle.mesh.position.x.toFixed(1)}, z:${obstacle.mesh.position.z.toFixed(1)}`);
  }

  public update(deltaTime: number, playerZ: number): void {
    this.timeToNextSpawn -= deltaTime;
    if (this.timeToNextSpawn <= 0) {
      this.spawnObstacle(playerZ);
      this.resetTimeToNextSpawn();
    }

    // Update animations for active obstacles
    for (const obstacle of this.activeObstacles) {
      // Handle clam animations
      if (obstacle.type === 'clam' && obstacle.mesh instanceof THREE.Group) {
        const clamMesh = obstacle.mesh as THREE.Group;
        const clamAsset = clamMesh.userData.assetInstance as ClamAsset;
        if (clamAsset) {
          clamAsset.updateAnimation(deltaTime, clamMesh);
        }
      }
    }

    // Recycle obstacles that are far behind the player
    const recycleThreshold = playerZ + 10; // Recycle if 10 units behind player

    // Use a reverse loop since we're modifying the array while iterating
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obstacle = this.activeObstacles[i];
      if (obstacle.mesh.position.z > recycleThreshold) {
        obstacle.isActive = false;
        obstacle.mesh.visible = false;

        // Remove from activeObstacles array
        this.activeObstacles.splice(i, 1);

        console.log(`ObstacleManager: Recycled ${obstacle.type} obstacle at z:${obstacle.mesh.position.z.toFixed(1)}`);
      }
    }
  }
  
  // Call this when player hits an obstacle
  public handleObstacleHit(obstacleMesh: THREE.Mesh | THREE.Group): void {
    // First find the obstacle in the active obstacles list
    const activeIndex = this.activeObstacles.findIndex(obs => obs.mesh === obstacleMesh);
    if (activeIndex > -1) {
      const hitObstacle = this.activeObstacles[activeIndex];
      console.log(`ObstacleManager: Player hit ${hitObstacle.type} obstacle`, obstacleMesh.name);

      // Special handling for clams - if they're closed, player doesn't lose a life
      if (hitObstacle.type === 'clam' && obstacleMesh instanceof THREE.Group) {
        const clamMesh = obstacleMesh as THREE.Group;
        const clamAsset = clamMesh.userData.assetInstance as ClamAsset;

        if (clamAsset && !clamAsset.isOpen) {
          console.log("ObstacleManager: Clam was closed during collision, no damage!");
          return; // Skip deactivation if clam is closed
        }
      }

      // Deactivate it
      hitObstacle.isActive = false;
      hitObstacle.mesh.visible = false;

      // Remove from activeObstacles array
      this.activeObstacles.splice(activeIndex, 1);

      console.log(`ObstacleManager: ${hitObstacle.type} obstacle hit by player`);
    } else {
      console.warn("ObstacleManager: Tried to hit an obstacle that isn't in the active list!");
    }
  }

  public dispose(): void {
    this.obstaclePool.forEach(obstacle => {
      if (obstacle.mesh instanceof THREE.Mesh) {
        if (obstacle.mesh.geometry) obstacle.mesh.geometry.dispose();
        if (Array.isArray(obstacle.mesh.material)) {
          obstacle.mesh.material.forEach(m => m.dispose());
        } else if (obstacle.mesh.material) {
          obstacle.mesh.material.dispose();
        }
      } else if (obstacle.mesh instanceof THREE.Group) {
        // For Group objects like clams, dispose of all child meshes
        obstacle.mesh.traverse(child => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else if (child.material) {
              child.material.dispose();
            }
          }
        });
      }

      this.scene.remove(obstacle.mesh);
    });

    this.obstaclePool = [];
    this.activeObstacles = [];
    console.log("ObstacleManager: Disposed.");
  }

  public reset(): void {
    this.obstaclePool.forEach(obstacle => {
      obstacle.isActive = false;
      obstacle.mesh.visible = false;
    });
    this.timeToNextSpawn = 0;
    this.lastSpawnZ = 0;

    // Recreate the pool with updated obstacle meshes that have collision spheres
    this.recreatePool();

    console.log("ObstacleManager: Reset with new obstacle pool.");
  }

  public recreatePool(): void {
    // Remove all existing obstacles from the scene
    this.obstaclePool.forEach(obstacle => {
      if (obstacle.mesh) {
        this.scene.remove(obstacle.mesh);

        if (obstacle.mesh instanceof THREE.Mesh) {
          if (obstacle.mesh.geometry) obstacle.mesh.geometry.dispose();
          if (Array.isArray(obstacle.mesh.material)) {
            obstacle.mesh.material.forEach(m => m.dispose());
          } else if (obstacle.mesh.material) {
            obstacle.mesh.material.dispose();
          }
        } else if (obstacle.mesh instanceof THREE.Group) {
          // For Group objects like clams, dispose of all child meshes
          obstacle.mesh.traverse(child => {
            if (child instanceof THREE.Mesh) {
              if (child.geometry) child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else if (child.material) {
                child.material.dispose();
              }
            }
          });
        }
      }
    });

    // Clear the pools
    this.obstaclePool = [];
    this.activeObstacles = [];

    // Create new obstacles
    this.initializePool();
    console.log("ObstacleManager: Recreated obstacle pool with updated meshes.");
  }
} 
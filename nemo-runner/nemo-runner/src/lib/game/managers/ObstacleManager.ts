import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { configSystem } from '../core/ConfigurationSystem';
// import { EnvironmentManager } from './EnvironmentManager'; // To know where to spawn

interface Obstacle {
  mesh: THREE.Mesh; // Or THREE.Group
  isActive: boolean;
  // Add other properties like type, speed (for moving obstacles) later
}

export class ObstacleManager {
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;
  // private environmentManager: EnvironmentManager;

  public activeObstacles: Obstacle[] = []; // Public for collision detection access
  public obstaclePool: Obstacle[] = [];
  private poolSize = 10; // Max obstacles to keep in memory

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
    for (let i = 0; i < this.poolSize; i++) {
      // Create a placeholder or a default type for the pool initially
      const mesh = this.assetFactory.createObstacleMesh('coral');
      mesh.visible = false;
      this.scene.add(mesh);
      this.obstaclePool.push({ mesh, isActive: false });
    }
  }

  private getInactiveObstacle(): Obstacle | undefined {
    return this.obstaclePool.find(obs => !obs.isActive);
  }
  
  private resetTimeToNextSpawn(): void {
    this.timeToNextSpawn = Math.random() * (this.spawnIntervalMax - this.spawnIntervalMin) + this.spawnIntervalMin;
  }

  private spawnObstacle(playerZ: number): void {
    const obstacle = this.getInactiveObstacle();
    if (!obstacle) {
      console.warn("ObstacleManager: No inactive obstacles in pool to spawn!");
      return;
    }

    // For now, only 'coral' type
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

    obstacle.mesh.position.y = -0.95; // Let's try this to align with player's bottom edge on floor.

    // Add to active obstacles (if not already part of a single list that just toggles isActive)
    // If using a single list (this.obstaclePool), this step isn't needed.
    // If we had separate activeObstacles list: this.activeObstacles.push(obstacle);
    console.log(`ObstacleManager: Spawned coral at x:${obstacle.mesh.position.x.toFixed(1)}, z:${obstacle.mesh.position.z.toFixed(1)}`);
  }

  public update(deltaTime: number, playerZ: number): void {
    this.timeToNextSpawn -= deltaTime;
    if (this.timeToNextSpawn <= 0) {
      this.spawnObstacle(playerZ);
      this.resetTimeToNextSpawn();
    }

    // Recycle obstacles that are far behind the player
    const recycleThreshold = playerZ + 10; // Recycle if 10 units behind player
    this.obstaclePool.forEach(obstacle => {
      if (obstacle.isActive && obstacle.mesh.position.z > recycleThreshold) {
        obstacle.isActive = false;
        obstacle.mesh.visible = false;
        // If we had separate activeObstacles list:
        // const index = this.activeObstacles.indexOf(obstacle);
        // if (index > -1) this.activeObstacles.splice(index, 1);
        console.log(`ObstacleManager: Recycled obstacle at z:${obstacle.mesh.position.z.toFixed(1)}`);
      }
    });
  }
  
  // Call this when player hits an obstacle
  public handleObstacleHit(obstacleMesh: THREE.Mesh): void {
    const hitObstacle = this.obstaclePool.find(obs => obs.mesh === obstacleMesh);
    if (hitObstacle && hitObstacle.isActive) {
        console.log("ObstacleManager: Player hit obstacle", obstacleMesh.name);
        // For now, just deactivate it. Later, could play an effect, etc.
        hitObstacle.isActive = false;
        hitObstacle.mesh.visible = false;
    }
  }

  public dispose(): void {
    this.obstaclePool.forEach(obstacle => {
      obstacle.mesh.geometry.dispose();
      if (Array.isArray(obstacle.mesh.material)) {
        obstacle.mesh.material.forEach(m => m.dispose());
      } else {
        obstacle.mesh.material.dispose();
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
    console.log("ObstacleManager: Reset.");
  }
} 
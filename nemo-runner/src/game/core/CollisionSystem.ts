import * as THREE from 'three';
import { Character } from '../entities/character/Character';
import eventBus from './EventSystem';

// Collision types
export type Collidable = {
  collider: THREE.Sphere | THREE.Box3;
  type: string;
  isActive: boolean;
};

// Collision system for detecting and handling collisions
export class CollisionSystem {
  private player: Character;
  private obstacles: Collidable[] = [];
  private collectibles: Collidable[] = [];
  
  constructor(player: Character) {
    this.player = player;
  }
  
  // Add obstacle to collision system
  addObstacle(obstacle: Collidable) {
    this.obstacles.push(obstacle);
  }
  
  // Add collectible to collision system
  addCollectible(collectible: Collidable) {
    this.collectibles.push(collectible);
  }
  
  // Remove obstacle from collision system
  removeObstacle(obstacle: Collidable) {
    const index = this.obstacles.indexOf(obstacle);
    if (index !== -1) {
      this.obstacles.splice(index, 1);
    }
  }
  
  // Remove collectible from collision system
  removeCollectible(collectible: Collidable) {
    const index = this.collectibles.indexOf(collectible);
    if (index !== -1) {
      this.collectibles.splice(index, 1);
    }
  }
  
  // Clear all obstacles and collectibles
  clear() {
    this.obstacles = [];
    this.collectibles = [];
  }
  
  // Update collision detection
  update() {
    // Check collisions with obstacles
    this.obstacles.forEach(obstacle => {
      if (!obstacle.isActive) return;
      
      if (this.checkCollision(this.player.collider, obstacle.collider)) {
        // Trigger player collision handling
        this.player.handleCollision(obstacle);
        
        // Emit collision event
        eventBus.emit('collision', {
          type: obstacle.type,
          position: obstacle.collider instanceof THREE.Sphere ? 
            obstacle.collider.center.toArray() : 
            obstacle.collider.getCenter(new THREE.Vector3()).toArray()
        });
      }
    });
    
    // Check collisions with collectibles
    this.collectibles.forEach(collectible => {
      if (!collectible.isActive) return;
      
      if (this.checkCollision(this.player.collider, collectible.collider)) {
        // Mark collectible as inactive
        collectible.isActive = false;
        
        // Emit collect event
        eventBus.emit('collect', {
          type: collectible.type,
          position: collectible.collider instanceof THREE.Sphere ? 
            collectible.collider.center.toArray() : 
            collectible.collider.getCenter(new THREE.Vector3()).toArray()
        });
      }
    });
  }
  
  // Check collision between two colliders
  private checkCollision(a: THREE.Sphere, b: THREE.Sphere | THREE.Box3): boolean {
    if (b instanceof THREE.Sphere) {
      // Sphere-Sphere collision
      const distance = a.center.distanceTo(b.center);
      return distance < (a.radius + b.radius);
    } else {
      // Sphere-Box collision
      // Find the closest point on the box to the sphere
      const closestPoint = new THREE.Vector3();
      closestPoint.copy(a.center).clamp(b.min, b.max);
      
      // Calculate distance to closest point
      const distance = a.center.distanceTo(closestPoint);
      return distance < a.radius;
    }
  }
}
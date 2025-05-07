import * as THREE from 'three';
import { Character } from '../entities/character/Character';
import eventBus from './EventSystem';

// Collision types
export type CollisionType = 'obstacle' | 'collectible' | 'powerup';

// Collidable interface to be implemented by game entities
export interface Collidable {
  id: string;
  collider: THREE.Sphere | THREE.Box3;
  type: CollisionType;
  isActive: boolean;
  onCollision?: (character: Character) => void;
}

/**
 * Collision system to handle detection and resolution of collisions
 */
export class CollisionSystem {
  // Character reference
  private character: Character;
  
  // Collections of collidable objects
  private obstacles: Map<string, Collidable> = new Map();
  private collectibles: Map<string, Collidable> = new Map();
  
  // Performance optimization
  private tempVector = new THREE.Vector3();
  private tempBox = new THREE.Box3();
  
  // Debug visualization
  private debugMode: boolean = false;
  private debugObjects: THREE.Object3D[] = [];
  private scene: THREE.Scene | null = null;
  
  constructor(character: Character, debugMode: boolean = false, scene?: THREE.Scene) {
    this.character = character;
    this.debugMode = debugMode;
    this.scene = scene || null;
    
    // Set up debug visualization if needed
    if (this.debugMode && this.scene) {
      this.setupDebugVisualization();
    }
  }
  
  /**
   * Register a collidable object with the collision system
   * @param collidable The collidable object to register
   */
  public registerCollidable(collidable: Collidable): void {
    if (collidable.type === 'obstacle') {
      this.obstacles.set(collidable.id, collidable);
    } else {
      this.collectibles.set(collidable.id, collidable);
    }
    
    // Add debug visualization if in debug mode
    if (this.debugMode && this.scene) {
      this.addDebugVisualization(collidable);
    }
  }
  
  /**
   * Unregister a collidable object from the collision system
   * @param id The ID of the collidable object to unregister
   * @param type The type of the collidable object
   */
  public unregisterCollidable(id: string, type: CollisionType): void {
    if (type === 'obstacle') {
      this.obstacles.delete(id);
    } else {
      this.collectibles.delete(id);
    }
    
    // Remove debug visualization
    if (this.debugMode) {
      const debugObj = this.debugObjects.find(obj => obj.userData.id === id);
      if (debugObj && this.scene) {
        this.scene.remove(debugObj);
        this.debugObjects = this.debugObjects.filter(obj => obj.userData.id !== id);
      }
    }
  }
  
  /**
   * Update collidable position
   * @param id The ID of the collidable object
   * @param type The type of the collidable object
   * @param position The new position of the collidable object
   */
  public updateCollidablePosition(id: string, type: CollisionType, position: THREE.Vector3): void {
    const collection = type === 'obstacle' ? this.obstacles : this.collectibles;
    const collidable = collection.get(id);
    
    if (collidable) {
      if (collidable.collider instanceof THREE.Sphere) {
        collidable.collider.center.copy(position);
      } else if (collidable.collider instanceof THREE.Box3) {
        // Calculate the offset from center to min
        const size = this.tempVector.copy(collidable.collider.max).sub(collidable.collider.min);
        const halfSize = size.multiplyScalar(0.5);
        
        // Update the box position
        collidable.collider.min.copy(position).sub(halfSize);
        collidable.collider.max.copy(position).add(halfSize);
      }
      
      // Update debug visualization
      if (this.debugMode) {
        const debugObj = this.debugObjects.find(obj => obj.userData.id === id);
        if (debugObj) {
          debugObj.position.copy(position);
        }
      }
    }
  }
  
  /**
   * Update collision detection
   */
  public update(): void {
    if (!this.character) return;
    
    // Get character collider
    const characterCollider = this.character.getCollider();
    
    // Check collisions with obstacles
    for (const obstacle of this.obstacles.values()) {
      if (!obstacle.isActive) continue;
      
      if (this.checkCollision(characterCollider, obstacle.collider)) {
        // Handle collision with obstacle
        this.handleObstacleCollision(obstacle);
      }
    }
    
    // Check collisions with collectibles
    for (const collectible of this.collectibles.values()) {
      if (!collectible.isActive) continue;
      
      if (this.checkCollision(characterCollider, collectible.collider)) {
        // Handle collision with collectible
        this.handleCollectibleCollision(collectible);
      }
    }
    
    // Update debug visualization
    if (this.debugMode) {
      this.updateDebugVisualization();
    }
  }
  
  /**
   * Check collision between two colliders
   * @param a First collider (sphere or box)
   * @param b Second collider (sphere or box)
   * @returns True if the colliders are intersecting
   */
  private checkCollision(a: THREE.Sphere | THREE.Box3, b: THREE.Sphere | THREE.Box3): boolean {
    // Sphere vs Sphere
    if (a instanceof THREE.Sphere && b instanceof THREE.Sphere) {
      return a.distanceToPoint(b.center) <= b.radius;
    }
    
    // Box vs Box
    if (a instanceof THREE.Box3 && b instanceof THREE.Box3) {
      return a.intersectsBox(b);
    }
    
    // Sphere vs Box
    if (a instanceof THREE.Sphere && b instanceof THREE.Box3) {
      return b.intersectsSphere(a);
    }
    
    // Box vs Sphere
    if (a instanceof THREE.Box3 && b instanceof THREE.Sphere) {
      return a.intersectsSphere(b);
    }
    
    return false;
  }
  
  /**
   * Handle collision with an obstacle
   * @param obstacle The obstacle that was hit
   */
  private handleObstacleCollision(obstacle: Collidable): void {
    // Call the obstacle's collision handler if it exists
    if (obstacle.onCollision) {
      obstacle.onCollision(this.character);
    }
    
    // Notify the character of the collision
    const wasHit = this.character.hit();
    
    // Only emit collision event if the character was actually hit
    // (e.g., it might be immune due to power-up)
    if (wasHit) {
      eventBus.emit('collision', {
        type: 'obstacle',
        obstacle: obstacle.id,
        position: obstacle.collider instanceof THREE.Sphere 
          ? obstacle.collider.center.toArray()
          : new THREE.Vector3().copy(obstacle.collider.min).add(obstacle.collider.max).multiplyScalar(0.5).toArray()
      });
      
      // Emit specific player-hit event
      eventBus.emit('player-hit', {
        obstacle: obstacle.id
      });
    }
  }
  
  /**
   * Handle collision with a collectible
   * @param collectible The collectible that was collected
   */
  private handleCollectibleCollision(collectible: Collidable): void {
    // Call the collectible's collision handler if it exists
    if (collectible.onCollision) {
      collectible.onCollision(this.character);
    }
    
    // Emit collection event
    eventBus.emit('collect', {
      type: collectible.type === 'powerup' ? 'powerup' : 'collectible',
      id: collectible.id,
      position: collectible.collider instanceof THREE.Sphere 
        ? collectible.collider.center.toArray()
        : new THREE.Vector3().copy(collectible.collider.min).add(collectible.collider.max).multiplyScalar(0.5).toArray()
    });
    
    // Deactivate the collectible
    collectible.isActive = false;
  }
  
  /**
   * Clear all registered collidables
   */
  public clear(): void {
    this.obstacles.clear();
    this.collectibles.clear();
    
    // Clear debug visualizations
    if (this.debugMode && this.scene) {
      for (const obj of this.debugObjects) {
        this.scene.remove(obj);
      }
      this.debugObjects = [];
    }
  }
  
  /**
   * Set up debug visualization for collision shapes
   */
  private setupDebugVisualization(): void {
    if (!this.scene) return;
    
    // Add debug visualization for character collider
    const characterCollider = this.character.getCollider();
    const characterDebug = this.createDebugSphere(characterCollider.radius, 0x00ff00);
    characterDebug.position.copy(characterCollider.center);
    characterDebug.userData.id = 'player';
    characterDebug.userData.isPlayer = true;
    
    this.scene.add(characterDebug);
    this.debugObjects.push(characterDebug);
  }
  
  /**
   * Add debug visualization for a collidable object
   * @param collidable The collidable object to visualize
   */
  private addDebugVisualization(collidable: Collidable): void {
    if (!this.scene) return;
    
    let debugObj;
    
    if (collidable.collider instanceof THREE.Sphere) {
      // Create sphere visualization
      debugObj = this.createDebugSphere(
        collidable.collider.radius,
        collidable.type === 'obstacle' ? 0xff0000 : 0x0000ff
      );
      debugObj.position.copy(collidable.collider.center);
    } else if (collidable.collider instanceof THREE.Box3) {
      // Create box visualization
      const size = this.tempVector.copy(collidable.collider.max).sub(collidable.collider.min);
      debugObj = this.createDebugBox(
        size.x, size.y, size.z,
        collidable.type === 'obstacle' ? 0xff0000 : 0x0000ff
      );
      
      // Position at center of box
      const center = new THREE.Vector3().copy(collidable.collider.min).add(collidable.collider.max).multiplyScalar(0.5);
      debugObj.position.copy(center);
    }
    
    if (debugObj) {
      debugObj.userData.id = collidable.id;
      debugObj.userData.type = collidable.type;
      
      this.scene.add(debugObj);
      this.debugObjects.push(debugObj);
    }
  }
  
  /**
   * Update debug visualization positions
   */
  private updateDebugVisualization(): void {
    // Update player debug visualization
    const playerDebug = this.debugObjects.find(obj => obj.userData.isPlayer);
    if (playerDebug) {
      const characterCollider = this.character.getCollider();
      playerDebug.position.copy(characterCollider.center);
    }
  }
  
  /**
   * Create a debug sphere visualization
   * @param radius Radius of the sphere
   * @param color Color of the sphere
   * @returns Mesh representing the debug sphere
   */
  private createDebugSphere(radius: number, color: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  /**
   * Create a debug box visualization
   * @param width Width of the box
   * @param height Height of the box
   * @param depth Depth of the box
   * @param color Color of the box
   * @returns Mesh representing the debug box
   */
  private createDebugBox(width: number, height: number, depth: number, color: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  /**
   * Enable or disable debug visualization
   * @param enable Whether to enable debug visualization
   * @param scene Scene to add debug visualizations to (required if enabling)
   */
  public setDebugMode(enable: boolean, scene?: THREE.Scene): void {
    if (enable === this.debugMode) return;
    
    this.debugMode = enable;
    
    if (enable) {
      if (!scene) {
        console.warn('Scene is required to enable debug visualization');
        this.debugMode = false;
        return;
      }
      
      this.scene = scene;
      this.setupDebugVisualization();
      
      // Add visualizations for existing collidables
      this.obstacles.forEach(obstacle => this.addDebugVisualization(obstacle));
      this.collectibles.forEach(collectible => this.addDebugVisualization(collectible));
    } else {
      // Remove all debug visualizations
      if (this.scene) {
        for (const obj of this.debugObjects) {
          this.scene.remove(obj);
        }
      }
      
      this.debugObjects = [];
    }
  }
}
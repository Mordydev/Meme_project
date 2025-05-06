import * as THREE from 'three';
import { Collidable } from '../../core/CollisionSystem';
import eventBus from '../../core/EventSystem';

// Obstacle types
export type ObstacleType = 'shark' | 'jellyfish' | 'pufferfish' | 'clam' | 'coral';

// Obstacle state
export type ObstacleState = 'idle' | 'active' | 'triggered' | 'cooldown';

// Common obstacle configuration properties
export interface ObstacleConfig {
  // Basic properties
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
  speed?: number;
  
  // Behavioral settings
  isLooping?: boolean;
  removeDistance?: number;
  timeOffset?: number;  // For staggered animations and behaviors
  
  // Special effects
  specialEffects?: {
    glowIntensity?: number;
    trailEffect?: boolean;
    soundVolume?: number;
  };
  
  // Visual settings
  materialOverrides?: {
    color?: number | string;
    opacity?: number;
    emissiveIntensity?: number;
  };
}

/**
 * Abstract base class for all obstacles in the game
 */
export abstract class Obstacle implements Collidable {
  // Identification and type
  public id: string;
  public type: 'obstacle' = 'obstacle';
  public obstacleType: ObstacleType;
  
  // Three.js objects
  public mesh: THREE.Group;
  public collider: THREE.Sphere | THREE.Box3;
  
  // Transform properties
  public position: THREE.Vector3 = new THREE.Vector3();
  public rotation: THREE.Euler = new THREE.Euler();
  public scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
  
  // State and behavior
  public state: ObstacleState = 'idle';
  public isActive: boolean = false;
  public isLooping: boolean = false;
  public removeDistance: number = -20;
  public speed: number = 1;
  
  // Animation
  protected timeOffset: number = 0;
  protected timeScale: number = 1.0;
  protected creationTime: number;
  
  // References
  protected scene: THREE.Scene;
  protected quality: 'high' | 'medium' | 'low';
  
  /**
   * Create a new obstacle
   */
  constructor(scene: THREE.Scene, qualityLevel: 'high' | 'medium' | 'low') {
    this.scene = scene;
    this.quality = qualityLevel;
    this.obstacleType = 'coral'; // Default, to be overridden by child classes
    this.id = `obstacle_${this.obstacleType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.creationTime = performance.now() / 1000;
    
    // These properties will be set by child classes
    this.mesh = new THREE.Group();
    this.collider = new THREE.Sphere(new THREE.Vector3(), 1);
  }
  
  /**
   * Initialize with configuration
   */
  public initialize(config: ObstacleConfig): void {
    // Set transform properties
    this.position.copy(config.position);
    
    if (config.rotation) {
      this.rotation.copy(config.rotation);
    }
    
    if (config.scale) {
      this.scale.copy(config.scale);
    }
    
    // Apply transforms to mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    this.mesh.scale.copy(this.scale);
    
    // Set behavioral properties
    this.speed = config.speed !== undefined ? config.speed : 1;
    this.isLooping = config.isLooping !== undefined ? config.isLooping : false;
    this.removeDistance = config.removeDistance !== undefined ? config.removeDistance : -20;
    this.timeOffset = config.timeOffset !== undefined ? config.timeOffset : 0;
    
    // Apply material overrides if provided
    if (config.materialOverrides) {
      this.applyMaterialOverrides(config.materialOverrides);
    }
    
    // Apply special effects if provided
    if (config.specialEffects) {
      this.applySpecialEffects(config.specialEffects);
    }
    
    // Reset state
    this.state = 'idle';
    this.isActive = true;
    
    // Update collider to match position
    this.updateCollider();
  }
  
  /**
   * Apply material overrides to the obstacle
   */
  protected applyMaterialOverrides(overrides: {
    color?: number | string;
    opacity?: number;
    emissiveIntensity?: number;
  }): void {
    // Apply to all materials in the mesh
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        let material = object.material;
        
        // Handle both single materials and arrays
        if (Array.isArray(material)) {
          material.forEach(mat => this.overrideMaterial(mat, overrides));
        } else {
          this.overrideMaterial(material, overrides);
        }
      }
    });
  }
  
  /**
   * Override a specific material
   */
  private overrideMaterial(material: THREE.Material, overrides: {
    color?: number | string;
    opacity?: number;
    emissiveIntensity?: number;
  }): void {
    // Apply color if specified
    if (overrides.color !== undefined && 'color' in material) {
      (material as any).color.set(overrides.color);
    }
    
    // Apply opacity if specified
    if (overrides.opacity !== undefined) {
      material.transparent = overrides.opacity < 1.0;
      material.opacity = overrides.opacity;
    }
    
    // Apply emissive intensity if specified for MeshStandardMaterial
    if (overrides.emissiveIntensity !== undefined && material instanceof THREE.MeshStandardMaterial) {
      material.emissiveIntensity = overrides.emissiveIntensity;
    }
  }
  
  /**
   * Apply special visual effects
   */
  protected applySpecialEffects(effects: {
    glowIntensity?: number;
    trailEffect?: boolean;
    soundVolume?: number;
  }): void {
    // Base implementation - override in subclasses
    // This can be implemented based on specific effects needed
  }
  
  /**
   * Reset for reuse from object pool
   */
  public reset(): void {
    // Reset transform
    this.position.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
    this.scale.set(1, 1, 1);
    
    // Apply to mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    this.mesh.scale.copy(this.scale);
    
    // Reset state
    this.state = 'idle';
    this.isActive = false;
    
    // Reset timing
    this.timeOffset = 0;
    this.creationTime = performance.now() / 1000;
    
    // Update collider
    this.updateCollider();
  }
  
  /**
   * Update the obstacle
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Update time scale based on game speed
    this.timeScale = gameSpeed;
    
    // Basic update - derived classes should call super.update() first
    
    // Update mesh position and rotation from obstacle
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    
    // Update collider (implemented in derived classes)
    this.updateCollider();
  }
  
  /**
   * Update collider to match current position
   */
  protected abstract updateCollider(): void;
  
  /**
   * Update idle state behavior (passive state)
   */
  protected abstract updateIdle(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void;
  
  /**
   * Update active state behavior (player is nearby)
   */
  protected abstract updateActive(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void;
  
  /**
   * Update triggered state behavior (interacting with player)
   */
  protected abstract updateTriggered(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void;
  
  /**
   * Update cooldown state behavior (after interaction)
   */
  protected abstract updateCooldown(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void;
  
  /**
   * Handle collision with player
   */
  public onCollision(): void {
    // Default behavior - override in derived classes
    this.state = 'triggered';
    
    // Emit generic collision event
    eventBus.emit('obstacle-collision', {
      type: this.obstacleType,
      position: this.position.clone(),
      obstacleId: this.id
    });
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Clean up geometry and materials
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
    
    // Remove from scene if needed
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
}
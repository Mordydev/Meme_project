import * as THREE from 'three';
import { ShaderManager } from '../services/ShaderManager';

/**
 * Standard interface for all obstacle assets in the game
 * This ensures consistent method naming and functionality across all obstacle types
 */
export interface IObstacleAsset {
  /**
   * Creates a new mesh instance for this obstacle
   * Should handle all geometry creation, material setup, and child object organization
   * @returns A THREE.Group containing the complete mesh for this obstacle
   */
  createMesh(): THREE.Group;
  
  /**
   * Returns the existing mesh or creates a new one if it doesn't exist
   * This is the primary method that should be called by obstacle managers
   * @returns A THREE.Group containing the complete mesh for this obstacle
   */
  getMesh(): THREE.Group;
  
  /**
   * Returns the collision object used for collision detection
   * This is typically a simplified geometry that approximates the obstacle shape
   * @returns A THREE.Object3D (usually a Mesh) representing the collision volume
   */
  getCollisionObject(): THREE.Object3D;
  
  /**
   * Updates animation state based on elapsed time
   * @param deltaTime Time in seconds since the last update
   */
  updateAnimation(deltaTime: number): void;
  
  /**
   * Determines if this obstacle is currently dangerous to the player
   * Some obstacles may change their dangerous state (e.g., a clam opening/closing)
   * @returns True if the obstacle can damage the player, false otherwise
   */
  isDangerous(): boolean;
  
  /**
   * Resets the obstacle to its initial state
   * Called when recycling obstacle instances
   */
  reset(): void;
  
  /**
   * Disposes of resources used by this asset
   * Should clean up geometries, materials, and other resources
   */
  dispose(): void;
}

/**
 * Base configuration that should be available for all obstacles
 */
export interface BaseObstacleConfig {
  visuals?: {
    mainColor?: number;
    emissiveColor?: number;
    emissiveIntensity?: number;
    roughness?: number;
    metalness?: number;
    opacity?: number;
    transparent?: boolean;
    animationSpeed?: number;
    animationAmplitude?: number;
  }
}
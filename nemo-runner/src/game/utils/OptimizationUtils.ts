import * as THREE from 'three';
import { getPerformanceMonitor } from './PerformanceMonitor';
import { getQualityAdjuster } from './QualityAdjuster';

/**
 * Vector pool for reuse to avoid creating new vectors during updates
 */
const VECTOR_POOL = {
  vec3: Array.from({ length: 10 }, () => new THREE.Vector3()),
  vec2: Array.from({ length: 10 }, () => new THREE.Vector2()),
  poolIndex: 0,
  
  // Get a Vector3 from the pool
  getVec3(): THREE.Vector3 {
    const vec = this.vec3[this.poolIndex % this.vec3.length];
    this.poolIndex = (this.poolIndex + 1) % this.vec3.length;
    return vec.set(0, 0, 0);
  },
  
  // Get a Vector2 from the pool
  getVec2(): THREE.Vector2 {
    const vec = this.vec2[this.poolIndex % this.vec2.length];
    this.poolIndex = (this.poolIndex + 1) % this.vec2.length;
    return vec.set(0, 0);
  },
  
  // Reset pool index
  reset(): void {
    this.poolIndex = 0;
  }
};

/**
 * Distance thresholds for optimization
 */
export const DISTANCE_THRESHOLDS = {
  // Full detail updates (every frame)
  FULL_DETAIL: 15,
  
  // Medium detail updates (every 2-3 frames)
  MEDIUM_DETAIL: 30,
  
  // Low detail updates (every 5-10 frames)
  LOW_DETAIL: 50,
  
  // Minimal updates (basic position only, every 10-20 frames)
  MINIMAL_DETAIL: 80,
  
  // Visibility threshold (beyond this, entities are simplified or hidden)
  VISIBILITY: 120
};

/**
 * Optimization levels for update frequency
 */
export enum OptimizationLevel {
  NONE = 0,       // Always update
  LOW = 1,        // Skip some updates for distant objects
  MEDIUM = 2,     // Skip many updates for distant objects
  HIGH = 3,       // Only update nearby objects
  EMERGENCY = 4   // Only update critical objects
}

/**
 * Get current global optimization level
 */
export function getOptimizationLevel(): OptimizationLevel {
  const performanceMonitor = getPerformanceMonitor();
  const metrics = performanceMonitor.getMetrics();
  const qualityAdjuster = getQualityAdjuster();
  const quality = qualityAdjuster.getQuality();
  
  // Set optimization level based on performance and quality
  if (metrics.fps < 25 || metrics.longFrames > 5) {
    return OptimizationLevel.HIGH;
  } else if (metrics.fps < 40) {
    return OptimizationLevel.MEDIUM;
  } else if (quality === 'low') {
    return OptimizationLevel.LOW;
  }
  
  return OptimizationLevel.NONE;
}

/**
 * Determine if an entity should update this frame based on its distance from the player
 * @param entityPosition Entity position
 * @param playerPosition Player position
 * @param frameCount Current frame count
 * @returns Whether the entity should update this frame
 */
export function shouldUpdateEntityThisFrame(
  entityPosition: THREE.Vector3,
  playerPosition: THREE.Vector3,
  frameCount: number
): boolean {
  // Get temporary vector from pool
  const distanceVec = VECTOR_POOL.getVec3();
  
  // Calculate distance (squared for efficiency)
  distanceVec.subVectors(entityPosition, playerPosition);
  const distanceSq = distanceVec.lengthSq();
  
  // Get current optimization level
  const optimizationLevel = getOptimizationLevel();
  
  // Decide update frequency based on distance and optimization level
  if (distanceSq < DISTANCE_THRESHOLDS.FULL_DETAIL * DISTANCE_THRESHOLDS.FULL_DETAIL) {
    // Always update nearby entities
    return true;
  } else if (distanceSq < DISTANCE_THRESHOLDS.MEDIUM_DETAIL * DISTANCE_THRESHOLDS.MEDIUM_DETAIL) {
    // Medium distance - update frequency depends on optimization level
    switch (optimizationLevel) {
      case OptimizationLevel.NONE:
        return true;
      case OptimizationLevel.LOW:
        return frameCount % 2 === 0; // Every 2 frames
      default:
        return frameCount % 3 === 0; // Every 3 frames
    }
  } else if (distanceSq < DISTANCE_THRESHOLDS.LOW_DETAIL * DISTANCE_THRESHOLDS.LOW_DETAIL) {
    // Far distance - update less frequently
    switch (optimizationLevel) {
      case OptimizationLevel.NONE:
        return frameCount % 2 === 0; // Every 2 frames
      case OptimizationLevel.LOW:
        return frameCount % 5 === 0; // Every 5 frames
      case OptimizationLevel.MEDIUM:
        return frameCount % 8 === 0; // Every 8 frames
      default:
        return frameCount % 10 === 0; // Every 10 frames
    }
  } else if (distanceSq < DISTANCE_THRESHOLDS.MINIMAL_DETAIL * DISTANCE_THRESHOLDS.MINIMAL_DETAIL) {
    // Very far - minimal updates
    switch (optimizationLevel) {
      case OptimizationLevel.NONE:
        return frameCount % 5 === 0; // Every 5 frames
      case OptimizationLevel.LOW:
        return frameCount % 10 === 0; // Every 10 frames
      case OptimizationLevel.MEDIUM:
        return frameCount % 15 === 0; // Every 15 frames
      default:
        return frameCount % 20 === 0; // Every 20 frames
    }
  } else if (distanceSq < DISTANCE_THRESHOLDS.VISIBILITY * DISTANCE_THRESHOLDS.VISIBILITY) {
    // Barely visible - extremely infrequent updates
    switch (optimizationLevel) {
      case OptimizationLevel.NONE:
        return frameCount % 10 === 0; // Every 10 frames
      case OptimizationLevel.LOW:
        return frameCount % 20 === 0; // Every 20 frames
      case OptimizationLevel.MEDIUM:
      case OptimizationLevel.HIGH:
        return frameCount % 30 === 0; // Every 30 frames
      default:
        return false; // Don't update in emergency mode
    }
  }
  
  // Beyond visibility threshold - don't update
  return false;
}

/**
 * Get level of detail to use for an entity based on its distance from the player
 * @param entityPosition Entity position
 * @param playerPosition Player position
 * @returns Level of detail (1=lowest, 4=highest)
 */
export function getEntityLevelOfDetail(
  entityPosition: THREE.Vector3,
  playerPosition: THREE.Vector3
): number {
  // Get temporary vector from pool
  const distanceVec = VECTOR_POOL.getVec3();
  
  // Calculate distance (squared for efficiency)
  distanceVec.subVectors(entityPosition, playerPosition);
  const distanceSq = distanceVec.lengthSq();
  
  // Get current quality settings
  const qualityAdjuster = getQualityAdjuster();
  const qualityPreset = qualityAdjuster.getQualityPreset();
  const baseDetailLevel = qualityPreset.entityDetailLevel;
  
  // Adjust detail level based on distance
  if (distanceSq < DISTANCE_THRESHOLDS.FULL_DETAIL * DISTANCE_THRESHOLDS.FULL_DETAIL) {
    // Closest entities get full detail
    return baseDetailLevel;
  } else if (distanceSq < DISTANCE_THRESHOLDS.MEDIUM_DETAIL * DISTANCE_THRESHOLDS.MEDIUM_DETAIL) {
    // Medium distance - reduce detail by 1 level (minimum 1)
    return Math.max(1, baseDetailLevel - 1);
  } else if (distanceSq < DISTANCE_THRESHOLDS.LOW_DETAIL * DISTANCE_THRESHOLDS.LOW_DETAIL) {
    // Far distance - reduce detail by 2 levels (minimum 1)
    return Math.max(1, baseDetailLevel - 2);
  } else {
    // Very far - minimum detail
    return 1;
  }
}

/**
 * Optimize collision detection by using simpler shapes for distant entities
 * @param entityPosition Entity position
 * @param playerPosition Player position
 * @returns Whether to use simplified colliders
 */
export function shouldUseSimplifiedColliders(
  entityPosition: THREE.Vector3,
  playerPosition: THREE.Vector3
): boolean {
  // Get temporary vector from pool
  const distanceVec = VECTOR_POOL.getVec3();
  
  // Calculate distance (squared for efficiency)
  distanceVec.subVectors(entityPosition, playerPosition);
  const distanceSq = distanceVec.lengthSq();
  
  // Get current quality settings
  const qualityAdjuster = getQualityAdjuster();
  const qualityPreset = qualityAdjuster.getQualityPreset();
  
  // Always use simplified colliders if specified in quality settings
  if (qualityPreset.useSimplifiedColliders) {
    return true;
  }
  
  // Use distance-based decision
  return distanceSq > DISTANCE_THRESHOLDS.MEDIUM_DETAIL * DISTANCE_THRESHOLDS.MEDIUM_DETAIL;
}

/**
 * Stagger updates across frames to distribute computational load
 * @param uniqueEntityId Unique entity identifier (can be array index)
 * @param frameCount Current frame count
 * @param staggerFactor How many frames to stagger updates across (higher = more staggering)
 * @returns Whether this entity should update on this frame
 */
export function shouldStaggerUpdateThisFrame(
  uniqueEntityId: number,
  frameCount: number,
  staggerFactor: number = 4
): boolean {
  // Ensure positive values
  const positiveId = Math.abs(uniqueEntityId);
  
  // Spread updates across frames based on ID
  return (frameCount + positiveId) % staggerFactor === 0;
}

/**
 * Get a cached Vector3 for temporary calculations
 * Helps avoid garbage collection
 */
export function getTemporaryVector3(): THREE.Vector3 {
  return VECTOR_POOL.getVec3();
}

/**
 * Get a cached Vector2 for temporary calculations
 * Helps avoid garbage collection
 */
export function getTemporaryVector2(): THREE.Vector2 {
  return VECTOR_POOL.getVec2();
}

/**
 * Reset the vector pool - call at the start of a frame
 */
export function resetVectorPool(): void {
  VECTOR_POOL.reset();
}

/**
 * Shared materials cache to reduce duplicate materials
 */
const MATERIALS_CACHE: Map<string, THREE.Material> = new Map();

/**
 * Get a cached material or create a new one
 * @param key Unique identifier for the material
 * @param createFn Function to create the material if not cached
 */
export function getCachedMaterial<T extends THREE.Material>(
  key: string,
  createFn: () => T
): T {
  // Check if material exists in cache
  if (MATERIALS_CACHE.has(key)) {
    return MATERIALS_CACHE.get(key) as T;
  }
  
  // Create new material
  const material = createFn();
  
  // Store in cache
  MATERIALS_CACHE.set(key, material);
  
  return material;
}

/**
 * Clear the materials cache
 */
export function clearMaterialsCache(): void {
  // Dispose all cached materials
  MATERIALS_CACHE.forEach(material => {
    material.dispose();
  });
  
  // Clear the cache
  MATERIALS_CACHE.clear();
}

/**
 * Shared geometry cache to reduce duplicate geometries
 */
const GEOMETRY_CACHE: Map<string, THREE.BufferGeometry> = new Map();

/**
 * Get a cached geometry or create a new one
 * @param key Unique identifier for the geometry
 * @param createFn Function to create the geometry if not cached
 */
export function getCachedGeometry<T extends THREE.BufferGeometry>(
  key: string,
  createFn: () => T
): T {
  // Check if geometry exists in cache
  if (GEOMETRY_CACHE.has(key)) {
    return GEOMETRY_CACHE.get(key) as T;
  }
  
  // Create new geometry
  const geometry = createFn();
  
  // Store in cache
  GEOMETRY_CACHE.set(key, geometry);
  
  return geometry;
}

/**
 * Clear the geometry cache
 */
export function clearGeometryCache(): void {
  // Dispose all cached geometries
  GEOMETRY_CACHE.forEach(geometry => {
    geometry.dispose();
  });
  
  // Clear the cache
  GEOMETRY_CACHE.clear();
}

/**
 * Clear all optimization caches
 */
export function clearAllCaches(): void {
  clearMaterialsCache();
  clearGeometryCache();
  resetVectorPool();
}

/**
 * Create an optimized update wrapper that handles frame skipping based on distance
 * @param updateFn Original update function
 * @returns Optimized update function
 */
export function createOptimizedUpdateFunction<T>(
  updateFn: (entity: T, deltaTime: number, frameCount: number) => void
): (entity: T & { position: THREE.Vector3 }, playerPosition: THREE.Vector3, deltaTime: number, frameCount: number) => void {
  return (entity, playerPosition, deltaTime, frameCount) => {
    // Check if entity should update this frame
    if (shouldUpdateEntityThisFrame(entity.position, playerPosition, frameCount)) {
      // Call original update function with additional frameCount parameter
      updateFn(entity, deltaTime, frameCount);
    }
  };
}

/**
 * Create a detailed metrics object to track performance of a specific system
 */
export function createPerformanceMetrics(systemName: string) {
  return {
    systemName,
    updateCount: 0,
    skipCount: 0,
    totalUpdateTime: 0,
    lastUpdateTime: 0,
    
    // Track start of an update
    startUpdate() {
      this.lastUpdateTime = performance.now();
    },
    
    // Track end of an update
    endUpdate() {
      const now = performance.now();
      const updateTime = now - this.lastUpdateTime;
      this.totalUpdateTime += updateTime;
      this.updateCount++;
      
      // Report long tasks
      if (updateTime > 16.67) { // Longer than a frame
        getPerformanceMonitor().reportLongTask();
      }
    },
    
    // Track skipped updates
    skipUpdate() {
      this.skipCount++;
    },
    
    // Get metrics as string
    getMetricsString() {
      const avgUpdateTime = this.updateCount > 0 ? this.totalUpdateTime / this.updateCount : 0;
      const skipPercentage = (this.skipCount / (this.updateCount + this.skipCount)) * 100;
      
      return `${this.systemName}: Updates: ${this.updateCount}, Skipped: ${this.skipCount} (${skipPercentage.toFixed(1)}%), Avg Time: ${avgUpdateTime.toFixed(2)}ms`;
    },
    
    // Reset metrics
    reset() {
      this.updateCount = 0;
      this.skipCount = 0;
      this.totalUpdateTime = 0;
    }
  };
}
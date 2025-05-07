import * as THREE from 'three';
import { NoiseGenerator } from '../../utils/NoiseGenerator';
import { getDeviceCapabilities, optimizeGeometry } from '../../utils/DeviceUtils';
import { PlaceholderGenerator } from '../../utils/PlaceholderGenerator';

/**
 * Utility class for optimizing obstacle implementations
 * Provides common functionality for LOD selection, material reuse,
 * animation optimization, and collision detection
 */
export class ObstacleUtils {
  // Shared materials cache to reduce memory usage and improve performance
  private static materialsCache: Map<string, THREE.Material> = new Map();
  
  // Shared geometry cache to reduce memory usage
  private static geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  
  // Shared noise generator with consistent seed
  private static noiseGenerator: NoiseGenerator = new NoiseGenerator(Math.PI * 1031);
  
  // Cached vectors for reuse in calculations
  private static tempVec3A = new THREE.Vector3();
  private static tempVec3B = new THREE.Vector3();
  private static tempBox = new THREE.Box3();
  
  // Animation frame counters
  private static frameCounter = 0;
  
  // Performance tracking
  private static lastFrameTime = 0;
  private static frameTimes: number[] = [];
  private static averageFrameTime = 16.67; // Default to 60fps
  
  /**
   * Returns the appropriate LOD level based on quality level and distance
   * @param qualityLevel - The device quality level (1-5)
   * @param distance - Distance from camera/player (optional)
   * @returns The LOD level to use (0 = highest quality, higher numbers = lower quality)
   */
  static getLODLevel(qualityLevel: number, distance?: number): number {
    // Update frame counter
    this.frameCounter = (this.frameCounter + 1) % 1000;
    
    // Check if we should adapt based on performance
    this.updatePerformanceMetrics();
    
    // Dynamic LOD threshold adjustment based on current performance
    const performanceFactor = Math.min(1, this.averageFrameTime / 16.67);
    const distanceScale = 1 + performanceFactor;
    
    // If distance is provided, use it for more granular LOD selection
    if (distance !== undefined) {
      // Scale thresholds based on current performance
      const farThreshold = 200 / distanceScale;
      const mediumThreshold = 100 / distanceScale;
      
      if (distance > farThreshold) return 2; // Far - use lowest detail
      if (distance > mediumThreshold) return 1; // Medium - use medium detail
      return 0; // Close - use highest detail
    }
    
    // Otherwise base LOD purely on device capability
    switch (qualityLevel) {
      case 1: // Low-end devices
        return 2; // Use lowest detail
      case 2: // Low-mid devices
        return 1; // Use medium detail
      case 3: // Mid-range devices
        return distance && distance > 100 ? 1 : 0;
      case 4: // High-end devices
        return distance && distance > 150 ? 1 : 0;
      case 5: // Ultra high-end devices
        return 0; // Always use highest detail
      default:
        return 1; // Default to medium detail
    }
  }
  
  /**
   * Track performance metrics to dynamically adjust LOD levels
   */
  private static updatePerformanceMetrics(): void {
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      const frameDelta = now - this.lastFrameTime;
      
      // Keep a rolling window of recent frame times
      this.frameTimes.push(frameDelta);
      if (this.frameTimes.length > 30) {
        this.frameTimes.shift();
      }
      
      // Calculate average frame time
      const sum = this.frameTimes.reduce((a, b) => a + b, 0);
      this.averageFrameTime = sum / this.frameTimes.length;
    }
    this.lastFrameTime = now;
  }
  
  /**
   * Creates or retrieves cached material based on key and parameters
   * @param key - Unique identifier for the material
   * @param createFn - Function to create the material if not cached
   * @returns The cached or newly created material
   */
  static getMaterial(
    key: string, 
    createFn: () => THREE.Material
  ): THREE.Material {
    if (this.materialsCache.has(key)) {
      return this.materialsCache.get(key)!;
    }
    
    const material = createFn();
    this.materialsCache.set(key, material);
    return material;
  }
  
  /**
   * Gets or creates cached geometry
   * @param key - Cache key for the geometry
   * @param createFn - Function to create the geometry if not cached
   * @returns The cached or newly created geometry
   */
  static getGeometry(
    key: string,
    createFn: () => THREE.BufferGeometry
  ): THREE.BufferGeometry {
    if (this.geometryCache.has(key)) {
      return this.geometryCache.get(key)!;
    }
    
    const geometry = createFn();
    this.geometryCache.set(key, geometry);
    return geometry;
  }
  
  /**
   * Creates standard material with optimized parameters based on quality level
   * @param color - The base color for the material
   * @param options - Additional material properties
   * @param qualityLevel - Device quality level (1-5)
   * @returns Optimized THREE.MeshStandardMaterial
   */
  static createStandardMaterial(
    color: THREE.Color | string, 
    options: { 
      roughness?: number; 
      metalness?: number; 
      emissive?: THREE.Color | string;
      map?: THREE.Texture;
      normalMap?: THREE.Texture;
      transparent?: boolean;
      opacity?: number;
      side?: THREE.Side;
      flatShading?: boolean;
    } = {},
    qualityLevel: number = 3 // Default to medium quality
  ): THREE.MeshStandardMaterial {
    // Convert string colors to THREE.Color
    const baseColor = typeof color === 'string' ? new THREE.Color(color) : color;
    const emissiveColor = options.emissive ? 
      (typeof options.emissive === 'string' ? new THREE.Color(options.emissive) : options.emissive) : 
      new THREE.Color(0x000000);
    
    // Create material with appropriate complexity based on quality level
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: options.roughness ?? 0.5,
      metalness: options.metalness ?? 0.0,
      emissive: emissiveColor,
      flatShading: options.flatShading !== undefined ? options.flatShading : qualityLevel <= 2,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1.0,
      side: options.side ?? THREE.FrontSide,
    });
    
    // Only add textures on higher quality levels
    if (qualityLevel >= 3) {
      if (options.map) material.map = options.map;
      if (options.normalMap && qualityLevel >= 4) material.normalMap = options.normalMap;
    }
    
    return material;
  }
  
  /**
   * Creates a basic material with optimized parameters for low-end devices
   * @param color - Base color
   * @param options - Additional properties
   * @returns Optimized basic material
   */
  static createBasicMaterial(
    color: THREE.Color | string,
    options: {
      transparent?: boolean;
      opacity?: number;
      wireframe?: boolean;
    } = {}
  ): THREE.MeshBasicMaterial {
    // Convert string color to THREE.Color
    const baseColor = typeof color === 'string' ? new THREE.Color(color) : color;
    
    return new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1.0,
      wireframe: options.wireframe ?? false
    });
  }
  
  /**
   * Optimizes geometry based on quality level
   * @param geometry - The geometry to optimize
   * @param qualityLevel - Device quality level (1-5)
   * @returns Optimized geometry
   */
  static optimizeGeometry(geometry: THREE.BufferGeometry, qualityLevel: number): THREE.BufferGeometry {
    // For low-end devices, simplify geometry
    if (qualityLevel <= 2) {
      // Create simplified version with fewer vertices
      // This is a simplistic approach; in production you might use a proper decimation algorithm
      const simplifiedGeometry = new THREE.BufferGeometry();
      const positions = geometry.getAttribute('position');
      const normals = geometry.getAttribute('normal');
      const uvs = geometry.getAttribute('uv');
      
      if (positions) {
        // Take every other vertex for a simple 50% reduction
        const newPositions = [];
        const newNormals = [];
        const newUvs = [];
        
        const skipFactor = qualityLevel === 1 ? 3 : 2; // Even more aggressive for lowest quality
        
        for (let i = 0; i < positions.count; i += skipFactor) {
          if (i < positions.count) {
            newPositions.push(positions.getX(i), positions.getY(i), positions.getZ(i));
            
            if (normals) {
              newNormals.push(normals.getX(i), normals.getY(i), normals.getZ(i));
            }
            
            if (uvs) {
              newUvs.push(uvs.getX(i), uvs.getY(i));
            }
          }
        }
        
        simplifiedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
        if (normals && newNormals.length > 0) {
          simplifiedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
        } else {
          // Compute normals if we don't have them
          simplifiedGeometry.computeVertexNormals();
        }
        
        if (uvs && newUvs.length > 0) {
          simplifiedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2));
        }
        
        return simplifiedGeometry;
      }
    }
    
    // For higher quality levels, return original geometry
    return geometry;
  }
  
  /**
   * Optimizes animation mixer updates based on distance and quality
   * @param mixer - THREE.AnimationMixer to optimize
   * @param distance - Distance from camera/player
   * @param qualityLevel - Device quality level (1-5)
   * @returns Boolean indicating if this frame should update the animation
   */
  static shouldUpdateAnimation(mixer: THREE.AnimationMixer, distance: number, qualityLevel: number): boolean {
    // Handle performance-based frameskip for animations
    // Use the average frame time to determine if we should skip frames
    let skipFrames = 1;
    
    if (this.averageFrameTime > 33.3) { // Less than 30fps
      skipFrames = 4; // Skip 3 of 4 frames at < 30fps
    } else if (this.averageFrameTime > 20) { // Less than 50fps
      skipFrames = 2; // Skip every other frame at < 50fps
    }
    
    // Far objects update less frequently on low-end devices
    if (distance > 150 && qualityLevel <= 2) {
      // Even more aggressive skipping for distant objects on low-end devices
      return this.frameCounter % (skipFrames * 3) === 0;
    }
    
    // Medium distance objects on mid-range devices
    if (distance > 80 && qualityLevel <= 3) {
      return this.frameCounter % (skipFrames * 2) === 0;
    }
    
    // Close objects or high-end devices still use frameskip based on performance
    return this.frameCounter % skipFrames === 0;
  }
  
  /**
   * Creates optimized collision geometry based on mesh and quality level
   * @param mesh - The visible mesh
   * @param qualityLevel - Device quality level (1-5)
   * @returns Simplified collision geometry
   */
  static createCollisionGeometry(mesh: THREE.Mesh, qualityLevel: number): THREE.BufferGeometry {
    // For high-end devices, use detailed collision detection
    if (qualityLevel >= 4) {
      return mesh.geometry.clone();
    }
    
    // For mid-range devices, use a simplified version of the mesh geometry
    if (qualityLevel >= 3) {
      // Create a simplified version with 70% fewer vertices
      return this.optimizeGeometry(mesh.geometry, 2);
    }
    
    // For low-end devices, use primitive shapes like boxes or spheres for collision
    // Get bounding box without allocating new vectors
    this.tempBox.setFromObject(mesh);
    this.tempVec3A.set(0, 0, 0);
    this.tempBox.getSize(this.tempVec3A);
    
    // Use box geometry with size from bounding box
    return new THREE.BoxGeometry(
      this.tempVec3A.x, 
      this.tempVec3A.y, 
      this.tempVec3A.z
    );
  }
  
  /**
   * Updates a Box3 collider based on object position and rotation
   * @param collider - The Box3 collider to update
   * @param position - Object position
   * @param halfSize - Half-size of the box
   * @param rotation - Optional rotation value (Y-axis)
   */
  static updateBoxCollider(
    collider: THREE.Box3, 
    position: THREE.Vector3, 
    halfSize: THREE.Vector3,
    rotation?: number
  ): void {
    // Reuse temp vectors to avoid allocations
    const worldHalfSize = this.tempVec3A;
    
    // If rotation is significant, calculate adjusted bounds
    if (rotation && Math.abs(rotation) > 0.01) {
      const cosY = Math.abs(Math.cos(rotation));
      const sinY = Math.abs(Math.sin(rotation));
      
      worldHalfSize.set(
        halfSize.x * cosY + halfSize.z * sinY,
        halfSize.y,
        halfSize.z * cosY + halfSize.x * sinY
      );
    } else {
      // Otherwise just copy directly
      worldHalfSize.copy(halfSize);
    }
    
    // Update collider min/max - use the second temp vector for subtraction
    this.tempVec3B.copy(position).sub(worldHalfSize);
    collider.min.copy(this.tempVec3B);
    
    this.tempVec3B.copy(position).add(worldHalfSize);
    collider.max.copy(this.tempVec3B);
  }
  
  /**
   * Deform geometry with noise for organic looking objects
   * @param geometry - The geometry to deform
   * @param noiseScale - Scale of the noise 
   * @param noiseStrength - Strength of the deformation
   */
  static deformWithNoise(
    geometry: THREE.BufferGeometry,
    noiseScale: number = 1,
    noiseStrength: number = 0.1
  ): void {
    if (geometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        // Calculate noise based on position
        const noise = this.noiseGenerator.noise3D(
          x * noiseScale,
          y * noiseScale,
          z * noiseScale
        );
        
        // Apply noise displacement
        positions[i * 3] += noise * noiseStrength;
        positions[i * 3 + 1] += noise * noiseStrength;
        positions[i * 3 + 2] += noise * noiseStrength;
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }
  
  /**
   * Returns the shared noise generator instance
   */
  static getNoiseGenerator(): NoiseGenerator {
    return this.noiseGenerator;
  }
  
  /**
   * Creates a placeholder object for error cases
   * @param type - Type of obstacle that failed to create
   * @returns A simple placeholder mesh
   */
  static createErrorPlaceholder(type: string): THREE.Group {
    // Check if PlaceholderGenerator is available
    try {
      // Try to use the shared PlaceholderGenerator if available
      const placeholder = PlaceholderGenerator.createEntityPlaceholder('obstacle_' + type);
      
      // If it's already a Group, return it
      if (placeholder instanceof THREE.Group) {
        return placeholder;
      }
      
      // Otherwise, wrap it in a Group
      const group = new THREE.Group();
      group.add(placeholder);
      return group;
      
    } catch (error) {
      // Fallback to simple placeholder
      console.warn(`Created placeholder for obstacle: ${type}`);
      const group = new THREE.Group();
      
      // Create a simple color-coded error mesh
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = this.getMaterial(`error_material_${type}`, () => {
        return new THREE.MeshBasicMaterial({ 
          color: 0xff3333, 
          wireframe: true 
        });
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
      return group;
    }
  }
  
  /**
   * Clears the materials cache - useful when changing scenes or during cleanup
   */
  static clearMaterialsCache(): void {
    this.materialsCache.clear();
  }
  
  /**
   * Clears the geometry cache - useful when changing scenes or during cleanup
   */
  static clearGeometryCache(): void {
    this.geometryCache.clear();
  }
  
  /**
   * Clear all caches and reset performance metrics
   */
  static reset(): void {
    this.clearMaterialsCache();
    this.clearGeometryCache();
    this.frameTimes = [];
    this.averageFrameTime = 16.67;
    this.lastFrameTime = 0;
    this.frameCounter = 0;
  }
}
import * as THREE from 'three';
import { NoiseGenerator } from '../../utils/NoiseGenerator';
import { PlaceholderGenerator } from '../../utils/PlaceholderGenerator';
import { getDeviceCapabilities, optimizeGeometry } from '../../utils/DeviceUtils';
import { RockDecorations } from './decorations/RockDecorations';

/**
 * Utility class providing shared methods for decoration classes
 * Reduces code duplication and standardizes common operations
 */
export class DecorationUtils {
  // Shared noise generator instance with fixed seed for consistent results
  private static noiseGenerator: NoiseGenerator = new NoiseGenerator(Math.PI * 2023);
  
  // Cache for commonly used materials and geometries to improve memory usage
  private static materialsCache: Map<string, THREE.Material> = new Map();
  private static geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  
  // Reusable temporary vectors to reduce allocations
  private static tempVec3 = new THREE.Vector3();
  private static tempColor = new THREE.Color();
  
  // Quality level tracking for optimizations
  private static qualityLevel = 3; // Default to medium quality

  /**
   * Get the shared noise generator instance
   */
  static getNoiseGenerator(): NoiseGenerator {
    return this.noiseGenerator;
  }

  /**
   * Applies scale based on definition parameters
   * @param group The group to scale
   * @param definition The decoration definition containing scale info
   */
  static applyScale(group: THREE.Group, definition: any): void {
    let scale: number;
    
    if (typeof definition.scale === 'number') {
      scale = definition.scale;
    } else if (definition.scale && typeof definition.scale.x === 'number') {
      scale = definition.scale.x; // Use x component if scale is a vector
    } else {
      scale = 1.0; // Default scale if not defined
    }
    
    const scaleVariance = definition.scaleVariance || 0.2;
    const finalScale = scale * (1 + (Math.random() - 0.5) * scaleVariance);
    
    group.scale.set(finalScale, finalScale, finalScale);
  }

  /**
   * Applies random rotation around Y axis based on definition
   * @param group The group to rotate
   * @param definition The decoration definition
   */
  static applyRotation(group: THREE.Group, definition: any): void {
    const rotationVariance = definition.rotationVariance || Math.PI * 2;
    group.rotation.y = Math.random() * rotationVariance;
    
    // Apply slight tilt if specified
    if (definition.tiltVariance) {
      group.rotation.x = (Math.random() - 0.5) * definition.tiltVariance;
      group.rotation.z = (Math.random() - 0.5) * definition.tiltVariance;
    }
  }

  /**
   * Creates an error placeholder mesh
   * Delegates to PlaceholderGenerator for consistency
   */
  static createErrorPlaceholder(name: string): THREE.Group {
    return PlaceholderGenerator.createErrorPlaceholder(name) as THREE.Group;
  }

  /**
   * Applies noise to sphere-like geometry for natural variation
   * @param geometry The geometry to deform
   * @param noiseScale Scale of the noise (higher = more detailed)
   * @param noiseStrength Amount of displacement
   * @param noiseGen Optional custom noise generator
   */
  static deformSphereWithNoise(
    geometry: THREE.BufferGeometry, 
    noiseScale: number = 10, 
    noiseStrength: number = 0.1,
    noiseGen?: NoiseGenerator
  ): void {
    if (geometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = geometry.attributes.position.array;
      const ng = noiseGen || DecorationUtils.noiseGenerator;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        // Distance from center
        const length = Math.sqrt(x * x + y * y + z * z);
        
        // Direction
        const dx = x / length;
        const dy = y / length;
        const dz = z / length;
        
        // Calculate noise
        const noiseCoord = new THREE.Vector3(x * noiseScale, y * noiseScale, z * noiseScale);
        const noise = noiseStrength * ng.noise3D(
          noiseCoord.x, noiseCoord.y, noiseCoord.z
        );
        
        positions[i * 3] = dx * (length + noise);
        positions[i * 3 + 1] = dy * (length + noise);
        positions[i * 3 + 2] = dz * (length + noise);
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }

  /**
   * Applies curve to cylindrical objects like stalks and stems
   * @param geometry The geometry to curve
   * @param height Height of the cylinder
   * @param curveAmount How much to curve (0 = straight, higher = more curved)
   * @param direction Direction of the curve in radians
   */
  static applyCurveToStalk(
    geometry: THREE.BufferGeometry, 
    height: number, 
    curveAmount: number = 0.2, 
    direction: number = Math.random() * Math.PI * 2
  ): void {
    if (geometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const y = positions[i * 3 + 1];
        
        // Normalize height (0 at bottom, 1 at top)
        const normalizedHeight = (y + height/2) / height;
        
        // Apply increasing curve as we go up
        const curveFactor = Math.pow(normalizedHeight, 2) * curveAmount;
        
        // Apply curve in specified direction
        positions[i * 3] += Math.cos(direction) * curveFactor;
        positions[i * 3 + 2] += Math.sin(direction) * curveFactor;
        
        // Add some noise for natural look
        positions[i * 3] += Math.sin(normalizedHeight * 10) * 0.01;
        positions[i * 3 + 2] += Math.cos(normalizedHeight * 8) * 0.01;
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }

  /**
   * Get or create a cached material
   * @param key Cache key for the material
   * @param createFn Function to create the material if not in cache
   * @returns The material from cache or newly created
   */
  static getMaterial(key: string, createFn: () => THREE.Material): THREE.Material {
    if (this.materialsCache.has(key)) {
      return this.materialsCache.get(key)!;
    }
    
    const material = createFn();
    this.materialsCache.set(key, material);
    return material;
  }
  
  /**
   * Get or create a cached geometry
   * @param key Cache key for the geometry
   * @param createFn Function to create the geometry if not in cache
   * @returns The geometry from cache or newly created
   */
  static getGeometry(key: string, createFn: () => THREE.BufferGeometry): THREE.BufferGeometry {
    if (this.geometryCache.has(key)) {
      return this.geometryCache.get(key)!;
    }
    
    const geometry = createFn();
    this.geometryCache.set(key, geometry);
    return geometry;
  }
  
  /**
   * Creates a standard material with typical decoration properties
   * Uses caching for identical materials to reduce memory usage
   */
  static createStandardMaterial(
    color: THREE.Color | number, 
    options: {
      roughness?: number,
      metalness?: number,
      transparent?: boolean,
      opacity?: number,
      side?: THREE.Side,
      emissive?: THREE.Color | number,
      emissiveIntensity?: number,
      flatShading?: boolean,
      cacheKey?: string
    } = {}
  ): THREE.MeshStandardMaterial {
    // If a cache key is provided, try to use the cache
    if (options.cacheKey) {
      return this.getMaterial(options.cacheKey, () => this._createStandardMaterial(color, options)) as THREE.MeshStandardMaterial;
    }
    
    // Otherwise create a new material
    return this._createStandardMaterial(color, options);
  }
  
  /**
   * Internal method to create a standard material without caching
   */
  private static _createStandardMaterial(
    color: THREE.Color | number,
    options: {
      roughness?: number,
      metalness?: number,
      transparent?: boolean,
      opacity?: number,
      side?: THREE.Side,
      emissive?: THREE.Color | number,
      emissiveIntensity?: number,
      flatShading?: boolean
    } = {}
  ): THREE.MeshStandardMaterial {
    // Use appropriate quality settings based on device capability
    const useSimpleSettings = this.qualityLevel < 3;
    
    // Convert colors using temp color to reduce allocations
    const baseColor = color instanceof THREE.Color ? color : this.tempColor.set(color as number);
    
    // Set emissive color if specified
    let emissiveColor;
    if (options.emissive !== undefined) {
      emissiveColor = options.emissive instanceof THREE.Color ? 
        options.emissive : 
        this.tempColor.set(options.emissive as number);
    } else {
      emissiveColor = new THREE.Color(0x000000);
    }
    
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: options.roughness !== undefined ? options.roughness : 0.7,
      metalness: options.metalness !== undefined ? options.metalness : 0.2,
      transparent: options.transparent !== undefined ? options.transparent : false,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
      side: options.side !== undefined ? options.side : THREE.FrontSide,
      emissive: emissiveColor,
      emissiveIntensity: options.emissiveIntensity !== undefined ? options.emissiveIntensity : 1.0,
      flatShading: options.flatShading !== undefined ? options.flatShading : useSimpleSettings
    });
  }

  /**
   * Distributes objects radially around a center point
   * @param count Number of positions to generate
   * @param radius Base radius of the circle
   * @param centerY Y-coordinate for all positions
   * @param radiusVariation How much radius can vary (0-1)
   * @param angleVariation How much angle can vary in radians
   * @returns Array of Vector3 positions
   */
  static distributeRadially(
    count: number, 
    radius: number, 
    centerY: number = 0, 
    radiusVariation: number = 0.2, 
    angleVariation: number = 0.3
  ): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * angleVariation;
      const dist = radius * (1 + (Math.random() - 0.5) * radiusVariation);
      
      positions.push(new THREE.Vector3(
        Math.cos(angle) * dist,
        centerY,
        Math.sin(angle) * dist
      ));
    }
    
    return positions;
  }

  /**
   * Creates vegetation/plant coloring with typical ranges
   * @param type Type of plant for appropriate coloring
   * @returns Color object
   */
  static createPlantColor(type: 'seaweed' | 'coral' | 'kelp' | 'anemone' = 'seaweed'): THREE.Color {
    switch (type) {
      case 'seaweed':
        return new THREE.Color(
          0.1 + Math.random() * 0.2, // Low red
          0.6 + Math.random() * 0.3, // High green
          0.2 + Math.random() * 0.2  // Low blue
        );
      case 'coral':
        return new THREE.Color(
          0.8 + Math.random() * 0.2, // High red
          0.3 + Math.random() * 0.3, // Medium green
          0.4 + Math.random() * 0.3  // Medium-high blue
        );
      case 'kelp':
        return new THREE.Color(
          0.1 + Math.random() * 0.1, // Very low red
          0.5 + Math.random() * 0.4, // Medium-high green
          0.1 + Math.random() * 0.2  // Low blue
        );
      case 'anemone':
        const hue = Math.random();
        return new THREE.Color().setHSL(
          hue,
          0.7 + Math.random() * 0.3,
          0.5 + Math.random() * 0.3
        );
    }
  }

  /**
   * Helper for creating a rock color with appropriate ranges
   * @param darker Whether to create a darker rock color
   * @returns Color object
   */
  static createRockColor(darker: boolean = false): THREE.Color {
    const baseValue = darker ? 
      0.3 + Math.random() * 0.15 : 
      0.4 + Math.random() * 0.2;
    
    // Slight variation between color channels for more natural look
    return new THREE.Color(
      baseValue + (Math.random() - 0.5) * 0.05,
      baseValue + (Math.random() - 0.5) * 0.05,
      baseValue + (Math.random() - 0.5) * 0.05
    );
  }

  /**
   * Creates water bubbles with appropriate material settings
   * @param count Number of bubbles
   * @param maxRadius Maximum bubble radius
   * @param containerRadius Radius of container to place bubbles in
   * @returns Group containing bubbles
   */
  static createBubbles(
    count: number, 
    maxRadius: number = 0.05, 
    containerRadius: number = 0.5
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = "bubble_group";
    
    // Create a shared bubble material
    const bubbleMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.3,
      envMapIntensity: 1.5
    });
    
    for (let i = 0; i < count; i++) {
      const size = 0.01 + Math.random() * maxRadius;
      const bubbleGeometry = new THREE.SphereGeometry(size, 8, 8);
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      bubble.name = `bubble_${i}`;
      
      // Random position within container
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = containerRadius * Math.random();
      
      bubble.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
      
      group.add(bubble);
    }
    
    return group;
  }

  /**
   * Creates a cluster of small rocks to add detail to a rock formation
   * @param count Number of small rocks
   * @param baseSize Base size for the rocks
   * @param spread How far from center to spread rocks
   * @returns Group containing the rock cluster
   */
  static createRockCluster(
    count: number,
    baseSize: number = 0.2,
    spread: number = 0.5
  ): THREE.Group {
    // Delegate to the RockDecorations implementation to avoid duplication
    return RockDecorations.createRockCluster(count, baseSize, spread);
  }

  /**
   * Adds moss or growth to a rock surface
   * @param baseGeometry The geometry to add moss to 
   * @param coverage Percentage of vertices to cover (0-1)
   * @param height Height of the moss extrusion
   * @returns New geometry with moss
   */
  static addMossToRock(
    baseGeometry: THREE.BufferGeometry,
    coverage: number = 0.3,
    height: number = 0.05
  ): THREE.BufferGeometry {
    // Clone the geometry to avoid modifying the original
    const geometry = baseGeometry.clone();
    
    if (geometry.attributes.position instanceof THREE.BufferAttribute && 
        geometry.attributes.normal instanceof THREE.BufferAttribute) {
      
      const positions = geometry.attributes.position.array;
      const normals = geometry.attributes.normal.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        // Only add moss to some vertices
        if (Math.random() < coverage) {
          // Get normal direction
          const nx = normals[i * 3];
          const ny = normals[i * 3 + 1];
          const nz = normals[i * 3 + 2];
          
          // Extrude along normal
          const extrudeAmount = height * Math.random();
          positions[i * 3] += nx * extrudeAmount;
          positions[i * 3 + 1] += ny * extrudeAmount;
          positions[i * 3 + 2] += nz * extrudeAmount;
        }
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
    
    return geometry;
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
   * Reset all caches and static properties
   */
  static reset(): void {
    this.clearMaterialsCache();
    this.clearGeometryCache();
    this.qualityLevel = 3; // Default to medium quality
  }
  
  /**
   * Create a simple performance-optimized version of a decoration based on quality level
   * @param originalDecoration The original decoration to simplify
   * @param qualityLevel The device quality level (1-5)
   * @returns A simplified version for lower quality levels, or the original for high quality
   */
  static createLODVersion(originalDecoration: THREE.Group, qualityLevel: number = this.qualityLevel): THREE.Group {
    // For high quality, return the original
    if (qualityLevel >= 4) {
      return originalDecoration;
    }
    
    // For medium quality, reduce geometry complexity but keep most features
    if (qualityLevel >= 3) {
      const simplifiedGroup = new THREE.Group();
      simplifiedGroup.name = originalDecoration.name + "_medium";
      
      // Clone the decoration but simplify its geometry
      originalDecoration.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          // Create a simplified version of the mesh
          const mesh = object.clone();
          
          // If the mesh has geometry, simplify it
          if (mesh.geometry) {
            // Skip very small details for medium quality
            if (object.scale.x < 0.2 && object.scale.y < 0.2 && object.scale.z < 0.2) {
              return; // Skip this small detail
            }
            
            // Simplify geometry by skipping vertices
            const simplified = this.optimizeGeometry(mesh.geometry);
            mesh.geometry = simplified;
          }
          
          // Use the same position and rotation as the original
          mesh.position.copy(object.position);
          mesh.rotation.copy(object.rotation);
          
          // Add to the simplified group
          simplifiedGroup.add(mesh);
        }
      });
      
      return simplifiedGroup;
    }
    
    // For low quality, create a much simpler representation
    const lowQualityGroup = new THREE.Group();
    lowQualityGroup.name = originalDecoration.name + "_low";
    
    // Create a simplified bounding box representation
    const bbox = new THREE.Box3().setFromObject(originalDecoration);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    // Create a simple box or sphere based on the original's approximate shape
    let simpleMesh: THREE.Mesh;
    const isWide = size.x > size.y * 1.5 || size.z > size.y * 1.5;
    
    // Just use a box for wide objects, sphere for more compact ones
    if (isWide) {
      const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const boxMaterial = this.getMaterial('simple_decoration_material', () => 
        new THREE.MeshLambertMaterial({ color: 0x999999, flatShading: true })
      );
      simpleMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    } else {
      // Use average dimension for radius
      const radius = (size.x + size.y + size.z) / 6; // Divide by 6 to get half the average
      const sphereGeometry = new THREE.SphereGeometry(radius, 8, 6);
      const sphereMaterial = this.getMaterial('simple_decoration_material', () => 
        new THREE.MeshLambertMaterial({ color: 0x999999, flatShading: true })
      );
      simpleMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    }
    
    // Position at the center of the original
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    simpleMesh.position.copy(center);
    
    lowQualityGroup.add(simpleMesh);
    return lowQualityGroup;
  }
  
  /**
   * Optimize a geometry by reducing vertex count
   * @param geometry The geometry to optimize
   * @returns A simplified version with fewer vertices
   */
  static optimizeGeometry = (geometry: THREE.BufferGeometry): THREE.BufferGeometry => {
    const simplified = new THREE.BufferGeometry();
    const positions = geometry.getAttribute('position');
    const normals = geometry.getAttribute('normal');
    const uvs = geometry.getAttribute('uv');
    
    if (positions) {
      // Take every other vertex for a simple 50% reduction
      const skipFactor = 2; 
      const newPositions = [];
      const newNormals = [];
      const newUvs = [];
      
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
      
      simplified.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
      
      if (normals && newNormals.length > 0) {
        simplified.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
      } else {
        // Compute normals if we don't have them
        simplified.computeVertexNormals();
      }
      
      if (uvs && newUvs.length > 0) {
        simplified.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2));
      }
    }
    
    return simplified;
  }
}
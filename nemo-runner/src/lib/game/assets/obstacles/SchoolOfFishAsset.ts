import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { SchoolOfFishObstacleConfig } from '../../config/gameConfig';

/**
 * Data for individual fish instances
 */
interface FishInstanceData {
  matrix: THREE.Matrix4;            // Current transformation matrix
  baseOffset: THREE.Vector3;        // Original position relative to school center
  animationOffset: number;          // Individual timing offset for swimming animation
  fishType: number;                 // Type of fish (0-2) for visual variety
  swimSpeed: number;                // Individual swim speed multiplier
  color: THREE.Color;               // Individual fish color
  scale: number;                    // Individual fish scale factor
}

export class SchoolOfFishAsset {
  private shaderManager: ShaderManager;
  private mesh!: THREE.Group;              // Main group containing all fish instances
  private instancedMesh!: THREE.InstancedMesh; // InstancedMesh for efficient fish rendering
  private collisionMesh!: THREE.Mesh;      // Collision object for the entire school
  private fishData: FishInstanceData[] = []; // Data for each fish instance
  private animationTime: number = 0;
  private fishGeometry!: THREE.BufferGeometry; // Shared fish geometry
  
  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    this.createMesh();
  }

  /**
   * Returns configuration for the school of fish obstacle
   */
  public get config(): Readonly<SchoolOfFishObstacleConfig> {
    // Provide default values in case config is not available
    const defaultConfig: SchoolOfFishObstacleConfig = {
      fishCountMin: 15,
      fishCountMax: 25,
      schoolRadius: 1.2,
      individualFishScale: 0.15,
      depthCoverage: 2.5,
      formation: 'wall',
      baseSpeedFactor: 0.9,
      flutterSpeed: 4.0,
      visuals: {
        mainColor: 0xC0C0C0,        // Silver
        emissiveColor: 0xD0D0D0,    // Slightly brighter emissive
        emissiveIntensity: 0.2,     // Moderate glow
        roughness: 0.2,             // Smooth
        metalness: 0.7,             // High metallic for fish scales shimmer
        animationSpeed: 2.0,        // Fast animation
        animationAmplitude: 0.2     // Moderate amplitude
      }
    };

    try {
      return configSystem.getObstaclesConfig()?.schoolOfFish || defaultConfig;
    } catch (error) {
      console.warn("SchoolOfFishAsset: Could not get school of fish config, using defaults", error);
      return defaultConfig;
    }
  }

  private createMesh(): void {
    try {
      this.mesh = new THREE.Group();
      this.mesh.name = "SchoolOfFishObstacle";
      const config = this.config;
      
      // Get visual properties from config with fallbacks
      const visualConfig = config.visuals || {};
      
      // Create detailed fish geometry
      this.fishGeometry = this.createDetailedFishGeometry(config.individualFishScale);
      
      // Manually compute bounding sphere to fix NaN issue
      this.computeCorrectBoundingSphere(this.fishGeometry);
      
      // Create fish material with StandardMaterial for Pixar-style quality
      const fishMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(visualConfig.mainColor || 0xC0C0C0),
        roughness: visualConfig.roughness || 0.2,
        metalness: visualConfig.metalness || 0.7,
        emissive: new THREE.Color(visualConfig.emissiveColor || 0xD0D0D0),
        emissiveIntensity: visualConfig.emissiveIntensity || 0.2,
        side: THREE.DoubleSide, // For fins and tails
        vertexColors: true // For variety in fish coloration
      });
      
      // Determine fish count based on config
      const numFish = THREE.MathUtils.randInt(config.fishCountMin, config.fishCountMax);
      
      // Create instanced mesh for efficient rendering of many fish
      this.instancedMesh = new THREE.InstancedMesh(this.fishGeometry, fishMaterial, numFish);
      this.instancedMesh.name = "FishInstances";
      this.instancedMesh.frustumCulled = false; // Ensure instances are rendered even if parent is outside frustum
      
      // Add to main group
      this.mesh.add(this.instancedMesh);
      
      // Create fish instances with varied positions and properties
      this.createFishInstances(numFish, config);
      
      // Create collision mesh for the entire school
      this.createCollisionMesh(config);
      
      // Set userData for collision detection and identification
      this.mesh.userData = { 
        type: 'obstacle', 
        name: 'schoolOfFish', 
        assetInstance: this,
        isDangerous: true
      };
    } catch (error) {
      console.error("Error creating SchoolOfFishAsset:", error);
      this.createFallbackMesh();
    }
  }

  /**
   * Creates detailed fish geometry with fins and tails
   */
  private createDetailedFishGeometry(baseScale: number): THREE.BufferGeometry {
    // Base fish dimensions
    const length = 0.3 * baseScale;
    const height = 0.1 * baseScale;
    const width = 0.07 * baseScale;
    
    // Create a more detailed fish shape
    const points: THREE.Vector2[] = [];
    
    // Body shape with tapered tail
    points.push(new THREE.Vector2(-length * 0.5, 0)); // Tail point
    points.push(new THREE.Vector2(-length * 0.35, height * 0.35)); // Upper tail connection
    points.push(new THREE.Vector2(-length * 0.1, height * 0.5)); // Middle upper body
    points.push(new THREE.Vector2(length * 0.2, height * 0.4)); // Upper front body
    points.push(new THREE.Vector2(length * 0.5, 0)); // Nose tip
    points.push(new THREE.Vector2(length * 0.2, -height * 0.4)); // Lower front body
    points.push(new THREE.Vector2(-length * 0.1, -height * 0.5)); // Middle lower body
    points.push(new THREE.Vector2(-length * 0.35, -height * 0.35)); // Lower tail connection
    points.push(new THREE.Vector2(-length * 0.5, 0)); // Back to tail point
    
    // Create shape from points
    const fishShape = new THREE.Shape(points);
    
    // Create extrusion settings with slight bevel for smoother edges
    const extrudeSettings = {
      steps: 1,
      depth: width,
      bevelEnabled: true,
      bevelThickness: width * 0.1,
      bevelSize: width * 0.1,
      bevelSegments: 2
    };
    
    // Create geometry for main fish body
    const bodyGeometry = new THREE.ExtrudeGeometry(fishShape, extrudeSettings);
    
    // Create a merged geometry for all fish parts
    const fishGeometry = bodyGeometry.clone();
    
    // Create tail fin - use separate geometry for more detailed tail
    const tailGeometry = this.createTailFinGeometry(length, height, baseScale);
    
    // Create dorsal fin
    const dorsalGeometry = this.createDorsalFinGeometry(length, height, baseScale);
    
    // Create side fins
    const sideFinGeometry = this.createSideFinsGeometry(length, height, width, baseScale);
    
    // Merge all geometries
    fishGeometry.merge(tailGeometry);
    fishGeometry.merge(dorsalGeometry);
    fishGeometry.merge(sideFinGeometry);
    
    // Rotate to orient fish swimming along Z axis
    fishGeometry.rotateY(Math.PI / 2);
    
    // Center the geometry at origin
    fishGeometry.center();
    
    // Add vertex colors for fish variation
    this.addVertexColors(fishGeometry);
    
    return fishGeometry;
  }

  /**
   * Creates the tail fin with detailed geometry
   */
  private createTailFinGeometry(length: number, height: number, scale: number): THREE.BufferGeometry {
    // Tail shape (forked tail)
    const tailShape = new THREE.Shape();
    
    // Starting point at the base of the tail
    tailShape.moveTo(0, 0);
    
    // Upper tail fork
    tailShape.lineTo(-length * 0.25, height * 0.75);
    
    // Middle of fork
    tailShape.lineTo(-length * 0.1, 0);
    
    // Lower tail fork
    tailShape.lineTo(-length * 0.25, -height * 0.75);
    
    // Back to starting point
    tailShape.lineTo(0, 0);
    
    // Create geometry
    const tailGeometry = new THREE.ExtrudeGeometry(tailShape, {
      steps: 1,
      depth: 0.01 * scale,
      bevelEnabled: false
    });
    
    // Position at the tail of the fish
    tailGeometry.translate(-length * 0.5, 0, 0);
    
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(tailGeometry);
    
    return tailGeometry;
  }

  /**
   * Creates the dorsal fin on top of the fish
   */
  private createDorsalFinGeometry(length: number, height: number, scale: number): THREE.BufferGeometry {
    // Dorsal fin shape (triangular with slight curve)
    const dorsalShape = new THREE.Shape();
    
    // Starting at the base of the dorsal fin
    dorsalShape.moveTo(0, 0);
    
    // Curved up to peak
    dorsalShape.quadraticCurveTo(
      length * 0.1, height * 1.2, // Control point
      0, height * 1.5 // Peak point
    );
    
    // Back to base
    dorsalShape.lineTo(-length * 0.15, 0);
    dorsalShape.lineTo(0, 0);
    
    // Create thin extruded geometry
    const dorsalGeometry = new THREE.ExtrudeGeometry(dorsalShape, {
      steps: 1,
      depth: 0.01 * scale,
      bevelEnabled: false
    });
    
    // Position on top-middle of fish
    dorsalGeometry.translate(-length * 0.1, height * 0.5, 0);
    
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(dorsalGeometry);
    
    return dorsalGeometry;
  }

  /**
   * Creates the pectoral/side fins
   */
  private createSideFinsGeometry(length: number, height: number, width: number, scale: number): THREE.BufferGeometry {
    // Side fin shape (small, curved triangular)
    const sideFinShape = new THREE.Shape();
    
    // Starting at fin connection
    sideFinShape.moveTo(0, 0);
    
    // Curved downward
    sideFinShape.quadraticCurveTo(
      length * 0.1, -height * 0.5, // Control point
      length * 0.2, -height * 0.6 // Tip point
    );
    
    // Back to connection
    sideFinShape.lineTo(-length * 0.05, -height * 0.2);
    sideFinShape.lineTo(0, 0);
    
    // Create thin extruded geometry
    const sideFinGeometry = new THREE.ExtrudeGeometry(sideFinShape, {
      steps: 1,
      depth: 0.01 * scale,
      bevelEnabled: false
    });
    
    // Position on side of fish
    sideFinGeometry.translate(length * 0.1, 0, 0);
    
    // Create a merged geometry for both side fins
    const sideFinsGeometry = sideFinGeometry.clone();
    
    // Create a copy and position on other side
    const rightFinGeometry = sideFinGeometry.clone();
    rightFinGeometry.translate(0, 0, width);
    
    // Merge right fin to left fin
    sideFinsGeometry.merge(rightFinGeometry);
    
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(sideFinsGeometry);
    
    return sideFinsGeometry;
  }

  /**
   * Add vertex colors to create variety in fish appearance
   */
  private addVertexColors(geometry: THREE.BufferGeometry): void {
    const positions = geometry.getAttribute('position');
    const count = positions.count;
    
    // Create colors array for vertex coloring
    const colors = new Float32Array(count * 3);
    
    // Base colors with metallic sheen
    const silverColor = new THREE.Color(0xC0C0C0);
    const blueishColor = new THREE.Color(0xADD8E6);
    const goldishColor = new THREE.Color(0xFFD700);
    
    // Generate random base color for this fish (silver, blue-ish, or gold-ish)
    const colorChoice = Math.floor(Math.random() * 3);
    let baseColor: THREE.Color;
    
    switch (colorChoice) {
      case 0: baseColor = silverColor; break;
      case 1: baseColor = blueishColor; break;
      case 2: baseColor = goldishColor; break;
      default: baseColor = silverColor;
    }
    
    // Slight variations for top/bottom shading
    const topColor = baseColor.clone().multiplyScalar(1.1); // Lighter on top
    const bottomColor = baseColor.clone().multiplyScalar(0.9); // Darker on bottom
    
    // Apply vertex colors based on position
    for (let i = 0; i < count; i++) {
      const y = positions.getY(i);
      
      // Determine color based on vertical position (y)
      // Top of fish is lighter, bottom is darker
      let vertexColor: THREE.Color;
      
      if (y > 0) {
        // Top of fish - lighter
        vertexColor = topColor;
      } else {
        // Bottom of fish - darker
        vertexColor = bottomColor;
      }
      
      // Add random slight variation for more natural look
      const variation = 0.9 + Math.random() * 0.2; // 0.9-1.1 variation
      vertexColor.multiplyScalar(variation);
      
      // Set color for this vertex
      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }
    
    // Add color attribute to geometry
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  /**
   * Create fish instances with varied positions and properties
   */
  private createFishInstances(numFish: number, config: SchoolOfFishObstacleConfig): void {
    const schoolRadius = config.schoolRadius;
    const depthCoverage = config.depthCoverage;
    
    // Create base colors for fish variety
    const baseColors = [
      new THREE.Color(0xC0C0C0), // Silver
      new THREE.Color(0xE0E0E0), // Light silver
      new THREE.Color(0xADD8E6), // Light blue
      new THREE.Color(0xFFD700).multiplyScalar(0.8) // Gold (slightly dimmed)
    ];
    
    // Create fish instances
    for (let i = 0; i < numFish; i++) {
      // Create initial transformation matrix
      const matrix = new THREE.Matrix4();
      
      // Determine position based on formation type
      let x, y, z;
      
      if (config.formation === 'wall') {
        // Dense vertical wall, spread primarily in Y and slightly in X/Z
        x = (Math.random() - 0.5) * schoolRadius * 0.7; // Reduced X spread for a wall
        y = (Math.random() - 0.5) * depthCoverage;      // Full vertical spread
        z = (Math.random() - 0.5) * schoolRadius * 0.4; // Thin Z depth for the wall
      } else { // 'swarm' formation
        // More natural swarm/ball formation with 3D spread
        const theta = Math.random() * Math.PI * 2; // Random angle around circle
        const phi = Math.random() * Math.PI; // Random vertical angle
        const radius = Math.random() * schoolRadius; // Random distance from center
        
        // Convert spherical to cartesian coordinates for a ball-like formation
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.cos(phi) * 0.5; // Flatten vertically by half
        z = radius * Math.sin(phi) * Math.sin(theta);
      }
      
      // Store base offset from center
      const baseOffset = new THREE.Vector3(x, y, z);
      
      // Randomize fish properties for variety
      const fishType = Math.floor(Math.random() * 3); // 0, 1, or 2 for visual variety
      const swimSpeed = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 speed variation
      const colorIndex = Math.floor(Math.random() * baseColors.length);
      const color = baseColors[colorIndex].clone();
      const scale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 size variation
      
      // Add random rotation for natural look
      const randomRotation = new THREE.Euler(
        (Math.random() - 0.5) * 0.2, // Slight pitch
        Math.random() * Math.PI * 2,  // Any yaw orientation
        (Math.random() - 0.5) * 0.2   // Slight roll
      );
      
      // Apply rotation to matrix
      const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(randomRotation);
      
      // Apply scale
      const scaleMatrix = new THREE.Matrix4().makeScale(scale, scale, scale);
      
      // Compose transformation: scale, then rotate, then translate
      matrix.multiply(scaleMatrix);
      matrix.multiply(rotationMatrix);
      matrix.setPosition(baseOffset);
      
      // Set matrix for instanced mesh
      this.instancedMesh.setMatrixAt(i, matrix);
      
      // Track fish data for animation
      this.fishData.push({
        matrix,
        baseOffset,
        animationOffset: Math.random() * Math.PI * 2, // Random animation phase
        fishType,
        swimSpeed,
        color,
        scale
      });
    }
    
    // Update instance buffer
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Creates a collision mesh for the school of fish
   */
  private createCollisionMesh(config: SchoolOfFishObstacleConfig): void {
    const schoolRadius = config.schoolRadius;
    const depthCoverage = config.depthCoverage;
    
    // Determine dimensions based on formation
    const isWall = config.formation === 'wall';
    
    // Create collision geometry
    const collisionWidth = isWall ? schoolRadius * 0.7 : schoolRadius * 2;
    const collisionHeight = depthCoverage;
    const collisionDepth = isWall ? schoolRadius * 0.4 : schoolRadius * 2;
    
    // Create box geometry
    const collisionGeom = new THREE.BoxGeometry(
      collisionWidth,
      collisionHeight,
      collisionDepth
    );
    
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(collisionGeom);
    
    // Create invisible material for collision mesh
    const collisionMat = new THREE.MeshBasicMaterial({
      visible: false,
      wireframe: true,
      color: 0x00ffff
    });
    
    // Create collision mesh
    this.collisionMesh = new THREE.Mesh(collisionGeom, collisionMat);
    this.collisionMesh.name = "SchoolOfFishCollisionBox";
    
    // Add to main group
    this.mesh.add(this.collisionMesh);
  }

  /**
   * Manually compute a valid bounding sphere to fix NaN issues
   */
  private computeCorrectBoundingSphere(geometry: THREE.BufferGeometry): void {
    // Get position attribute
    const positionAttribute = geometry.getAttribute('position');
    
    if (!positionAttribute) {
      // If no position attribute, add a default bounding sphere
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
      return;
    }
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    const positions = positionAttribute.array;
    const itemSize = positionAttribute.itemSize;
    
    // Find min/max for each axis
    for (let i = 0; i < positions.length; i += itemSize) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Skip NaN values
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
      }
    }
    
    // Handle case where there are no valid vertices
    if (!isFinite(minX)) {
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
      return;
    }
    
    // Calculate center of bounding box
    const center = new THREE.Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    );
    
    // Calculate radius as distance from center to corner
    const corner = new THREE.Vector3(maxX, maxY, maxZ);
    const radius = center.distanceTo(corner);
    
    // Set bounding sphere directly
    geometry.boundingSphere = new THREE.Sphere(center, radius);
  }

  /**
   * Create fallback mesh in case of errors
   */
  private createFallbackMesh(): void {
    // Simple fallback in case the detailed mesh creation fails
    this.mesh = new THREE.Group();
    this.mesh.name = "SchoolOfFishObstacleFallback";
    
    // Get basic config values
    const config = this.config;
    const schoolRadius = config.schoolRadius;
    const depthCoverage = config.depthCoverage;
    const isWall = config.formation === 'wall';
    
    // Determine dimensions
    const width = isWall ? schoolRadius * 0.7 : schoolRadius * 2;
    const height = depthCoverage;
    const depth = isWall ? schoolRadius * 0.4 : schoolRadius * 2;
    
    // Create simple geometry for fallback
    const fallbackGeom = new THREE.BoxGeometry(width, height, depth);
    
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(fallbackGeom);
    
    // Create semi-transparent material for visual representation
    const fallbackMaterial = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0, // Silver
      transparent: true,
      opacity: 0.7,
      roughness: 0.2,
      metalness: 0.7
    });
    
    // Create mesh for visuals
    const fallbackMesh = new THREE.Mesh(fallbackGeom, fallbackMaterial);
    this.mesh.add(fallbackMesh);
    
    // Create collision mesh (use same geometry since it's already a box)
    this.collisionMesh = new THREE.Mesh(
      fallbackGeom.clone(),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.collisionMesh.name = "SchoolOfFishCollisionBoxFallback";
    this.mesh.add(this.collisionMesh);
    
    // Set userData for identification
    this.mesh.userData = {
      type: 'obstacle',
      name: 'schoolOfFish',
      assetInstance: this,
      isDangerous: true
    };
    
    console.warn("Using fallback mesh for SchoolOfFishAsset due to error in detailed mesh creation");
    
    // Create empty fishData array to avoid errors in updateAnimation
    this.fishData = [];
  }

  /**
   * Updates the school of fish animation
   * @param deltaTime Time in seconds since last update
   */
  public updateAnimation(deltaTime: number): void {
    try {
      this.animationTime += deltaTime;
      const config = this.config;
      
      // Skip animation if using fallback mesh or no fish data
      if (this.fishData.length === 0) return;
      
      // Get animation parameters from config with fallbacks
      const flutterSpeed = config.flutterSpeed || 4.0;
      const baseSpeedFactor = config.baseSpeedFactor || 0.9;
      const visualConfig = config.visuals || {};
      const animationSpeed = visualConfig.animationSpeed || 2.0;
      const animationAmplitude = visualConfig.animationAmplitude || 0.2;
      
      // Update each fish instance
      for (let i = 0; i < this.fishData.length; i++) {
        const fish = this.fishData[i];
        
        // Get fish-specific properties
        const swimSpeed = fish.swimSpeed * baseSpeedFactor;
        const phaseOffset = fish.animationOffset;
        
        // Decompose current matrix to access components
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        fish.matrix.decompose(position, quaternion, scale);
        
        // Create swimming motion - combination of:
        // 1. Oscillation around base position (fish "hovering")
        // 2. Forward-backward motion for schooling behavior
        // 3. Slight rotation for realistic fish movement
        
        // 1. Oscillation - different for each axis
        const oscillationX = Math.sin(this.animationTime * animationSpeed * 0.7 + phaseOffset) * 
                          animationAmplitude * 0.07 * fish.scale;
        
        const oscillationY = Math.sin(this.animationTime * animationSpeed * 0.5 + phaseOffset * 1.3) * 
                          animationAmplitude * 0.05 * fish.scale;
        
        const oscillationZ = Math.cos(this.animationTime * animationSpeed * 0.6 + phaseOffset * 0.7) * 
                          animationAmplitude * 0.07 * fish.scale;
        
        // 2. Schooling behavior - forward motion with occasional direction changes
        // Determine if this fish is in the process of changing direction
        const directionChangeFrequency = 0.2; // How often fish change direction (lower = less often)
        const isChangingDirection = Math.sin(this.animationTime * directionChangeFrequency + phaseOffset * 5) > 0.8;
        
        // Get forward direction from quaternion
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
        
        // If changing direction, apply slight rotation
        if (isChangingDirection) {
          // Create a new rotation to redirect the fish slightly
          const turnAmount = 0.04 * deltaTime * swimSpeed; // How much to turn
          const turnAxis = new THREE.Vector3(
            Math.sin(this.animationTime + phaseOffset * 7),
            Math.sin(this.animationTime * 0.7 + phaseOffset * 3),
            Math.sin(this.animationTime * 1.3 + phaseOffset * 5)
          ).normalize();
          
          // Create quaternion for turning
          const turnQuaternion = new THREE.Quaternion().setFromAxisAngle(
            turnAxis, 
            turnAmount
          );
          
          // Apply turn
          quaternion.premultiply(turnQuaternion);
        }
        
        // Calculate new position
        position.x = fish.baseOffset.x + oscillationX;
        position.y = fish.baseOffset.y + oscillationY;
        position.z = fish.baseOffset.z + oscillationZ;
        
        // Check formation type for additional behavior
        if (config.formation === 'swarm') {
          // For swarm, add slight drift toward center to maintain cohesion
          const toCenter = new THREE.Vector3().sub(position).normalize();
          position.add(toCenter.multiplyScalar(0.002 * deltaTime * swimSpeed));
          
          // Add slight alignment with neighbors (simplified)
          const alignmentFactor = 0.01 * deltaTime;
          const swimDirection = forward.clone().normalize();
          quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            swimDirection
          ), alignmentFactor);
        }
        
        // 3. Tail/body wiggle animation
        // This would be ideal with morph targets or bone animation,
        // but we'll simulate with slight rotation
        const wiggleSpeed = flutterSpeed * swimSpeed;
        const wiggleAmount = Math.sin(this.animationTime * wiggleSpeed + phaseOffset) * 0.1;
        
        // Create wiggle quaternion (rotate around Y axis slightly)
        const wiggleQuaternion = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          wiggleAmount
        );
        
        // Apply wiggle (in fish's local space)
        quaternion.multiply(wiggleQuaternion);
        
        // Compose new matrix
        fish.matrix.compose(position, quaternion, scale);
        
        // Update instanced mesh
        this.instancedMesh.setMatrixAt(i, fish.matrix);
      }
      
      // Update instance matrix buffer
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    } catch (error) {
      console.warn("Error in SchoolOfFishAsset updateAnimation:", error);
      // Animation errors are not critical, can continue
    }
  }

  /**
   * Returns the main mesh
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * Returns the collision object for this asset
   * Always returns a valid mesh, even in error cases
   */
  public getCollisionObject(): THREE.Mesh {
    if (!this.collisionMesh) {
      // Create an emergency fallback collision mesh if needed
      console.warn("SchoolOfFishAsset: Creating emergency collision mesh");
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ visible: false });
      this.collisionMesh = new THREE.Mesh(geometry, material);
      this.collisionMesh.name = "SchoolOfFishEmergencyCollisionBox";
      
      // Ensure it has a valid bounding sphere
      this.computeCorrectBoundingSphere(geometry);
      
      // Add to mesh if it exists
      if (this.mesh) {
        this.mesh.add(this.collisionMesh);
      }
    }
    return this.collisionMesh;
  }

  /**
   * Determines if the school of fish is dangerous (always true)
   */
  public isDangerous(): boolean {
    return true; // School of fish is always a solid obstacle
  }

  /**
   * Resets the school of fish to its initial state
   */
  public reset(): void {
    try {
      this.animationTime = 0;
      
      // Reset all fish back to their base positions
      for (let i = 0; i < this.fishData.length; i++) {
        const fish = this.fishData[i];
        
        // Create a new transformation matrix
        const matrix = new THREE.Matrix4();
        
        // Add random rotation for natural look
        const randomRotation = new THREE.Euler(
          (Math.random() - 0.5) * 0.2, // Slight pitch
          Math.random() * Math.PI * 2,  // Any yaw orientation
          (Math.random() - 0.5) * 0.2   // Slight roll
        );
        
        // Apply rotation to matrix
        const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(randomRotation);
        
        // Apply scale
        const scaleMatrix = new THREE.Matrix4().makeScale(fish.scale, fish.scale, fish.scale);
        
        // Compose transformation: scale, then rotate, then translate
        matrix.multiply(scaleMatrix);
        matrix.multiply(rotationMatrix);
        matrix.setPosition(fish.baseOffset);
        
        // Update matrix
        fish.matrix.copy(matrix);
        
        // Update instanced mesh
        this.instancedMesh.setMatrixAt(i, fish.matrix);
      }
      
      // Update instance matrix buffer
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    } catch (error) {
      console.warn("Error in SchoolOfFishAsset reset:", error);
    }
  }

  /**
   * Disposes of resources used by this asset
   */
  public dispose(): void {
    try {
      // Dispose of fish geometry
      if (this.fishGeometry) {
        this.fishGeometry.dispose();
      }
      
      // Dispose of instanced mesh material
      if (this.instancedMesh && this.instancedMesh.material) {
        if (Array.isArray(this.instancedMesh.material)) {
          this.instancedMesh.material.forEach(m => m.dispose());
        } else {
          (this.instancedMesh.material as THREE.Material).dispose();
        }
      }
      
      // Dispose of collision mesh geometry and material
      if (this.collisionMesh) {
        if (this.collisionMesh.geometry) {
          this.collisionMesh.geometry.dispose();
        }
        
        if (this.collisionMesh.material) {
          if (Array.isArray(this.collisionMesh.material)) {
            this.collisionMesh.material.forEach(m => m.dispose());
          } else {
            (this.collisionMesh.material as THREE.Material).dispose();
          }
        }
      }
    } catch (error) {
      console.warn("Error disposing SchoolOfFishAsset resources:", error);
    }
  }

  /**
   * Creates the procedural mesh for this asset
   */
  public createMesh(): void {
    // Implementation already handles mesh creation in constructor
    if (!this.mesh) {
      // Only recreate if not already created
      this.mesh = new THREE.Group();
      this.createMesh();
    }
    return;
  }
}
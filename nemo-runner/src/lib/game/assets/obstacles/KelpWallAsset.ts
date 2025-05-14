import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { KelpWallObstacleConfig } from '../../config/gameConfig';

export class KelpWallAsset {
  private shaderManager: ShaderManager;
  private mesh!: THREE.Group; // Group to hold multiple kelp strands
  private collisionMesh!: THREE.Mesh; // Main collision object for the entire wall
  private kelpStrands: THREE.Mesh[] = []; // Store references to individual kelp strands
  private animationTime: number = 0;
  
  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    // Don't create mesh in constructor - let factory call getMesh() explicitly
  }

  /**
   * Returns configuration for the kelp wall obstacle
   */
  public get config(): Readonly<KelpWallObstacleConfig> {
    // Provide default values in case config is not available
    const defaultConfig: KelpWallObstacleConfig = {
      baseScaleY: 3.5,
      strandCountMin: 5,
      strandCountMax: 8,
      segmentWidthCoverage: 0.9, // Cover 90% of a lane width
      swayAmplitude: 0.1,
      swaySpeed: 0.5,
      visuals: {
        mainColor: 0x3B7A57, // Sea green
        emissiveColor: 0x2A5A37, // Darker emissive
        emissiveIntensity: 0.05, // Very subtle glow
        roughness: 0.7, // Rough surface
        metalness: 0.0, // No metallic quality
        opacity: 0.9, // Slightly transparent at edges
        animationSpeed: 0.5, // Animation speed
        animationAmplitude: 0.1 // Animation amplitude
      }
    };

    try {
      return configSystem.getObstaclesConfig()?.kelpWall || defaultConfig;
    } catch (error) {
      console.warn("KelpWallAsset: Could not get kelp wall config, using defaults", error);
      return defaultConfig;
    }
  }

  private createMesh(): void {
    try {
      this.mesh = new THREE.Group();
      this.mesh.name = "KelpWallObstacle";
      const config = this.config;
      
      // Get visual properties from config with fallbacks
      const visualConfig = config.visuals || {};
      
      // Create kelp strands
      this.kelpStrands = this.createKelpStrands(config, visualConfig);
      
      // Add kelp strands to the main mesh
      this.kelpStrands.forEach(strand => {
        this.mesh.add(strand);
      });
      
      // Create collision mesh for the entire wall
      this.createCollisionMesh(config);
      
      // Set userData for collision detection and identification
      this.mesh.userData = { 
        type: 'obstacle', 
        name: 'kelpWall', 
        assetInstance: this,
        isDangerous: true
      };
    } catch (error) {
      console.error("Error creating KelpWallAsset:", error);
      this.createFallbackMesh();
    }
  }

  /**
   * Creates individual kelp strands with detailed geometry
   */
  private createKelpStrands(config: KelpWallObstacleConfig, visualConfig: any): THREE.Mesh[] {
    const strands: THREE.Mesh[] = [];
    
    // Calculate dimensions
    const strandHeight = config.baseScaleY;
    const numStrands = THREE.MathUtils.randInt(config.strandCountMin, config.strandCountMax);
    
    // Ensure kelp wall only takes up one lane width
    const playerConfig = configSystem.get('player');
    const laneWidth = playerConfig?.laneWidth || 2.0;
    
    // Use exactly 90% of a lane width for consistent obstacle sizing
    const segmentWidthCoverage = 0.9; // Strict 90% regardless of config value
    const totalWallWidth = laneWidth * segmentWidthCoverage;
    
    // Calculate strand spacing for even distribution
    const spacing = numStrands > 1 ? totalWallWidth / (numStrands - 1) : 0;
    
    // Create base kelp material - all strands will share this material
    const kelpMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConfig.mainColor || 0x3B7A57),
      roughness: visualConfig.roughness || 0.7,
      metalness: visualConfig.metalness || 0.0,
      emissive: new THREE.Color(visualConfig.emissiveColor || 0x2A5A37),
      emissiveIntensity: visualConfig.emissiveIntensity || 0.05,
      transparent: true,
      opacity: visualConfig.opacity || 0.9,
      side: THREE.DoubleSide // Render both sides for better visibility
    });
    
    // Create each kelp strand
    for (let i = 0; i < numStrands; i++) {
      // Create varied strand heights for more natural look
      const strandVariation = 0.8 + (Math.random() * 0.4); // 80% to 120% of base height
      const thisStrandHeight = strandHeight * strandVariation;
      
      // Create strand with curve-based geometry for organic shape
      const strand = this.createKelpStrand(thisStrandHeight, kelpMaterial);
      
      // Position the strand within the wall width
      strand.position.x = (i * spacing) - (totalWallWidth / 2) + (spacing / 2);
      
      // Center if only one strand
      if (numStrands === 1) {
        strand.position.x = 0;
      }
      
      // Add slight random rotation and z-offset for more natural, non-uniform look
      strand.rotation.y = (Math.random() - 0.5) * 0.4;
      strand.position.z = (Math.random() - 0.5) * 0.3;
      
      // Scale each strand slightly differently for variety
      const widthScale = 0.85 + (Math.random() * 0.3);
      strand.scale.x = widthScale;
      
      // Add unique identifier for animation
      strand.userData = {
        index: i,
        swayPhaseOffset: Math.random() * Math.PI * 2, // Random phase offset
        height: thisStrandHeight
      };
      
      strands.push(strand);
    }
    
    return strands;
  }

  /**
   * Creates a single kelp strand with realistic curve-based geometry
   */
  private createKelpStrand(height: number, material: THREE.Material): THREE.Mesh {
    // Create a mesh group for the strand with all its parts
    const strandGroup = new THREE.Group();
    strandGroup.name = "KelpStrand";
    
    // Create main kelp blade
    const points: THREE.Vector2[] = [];
    const segments = 12; // Segmentation for curve smoothness
    
    // Create a tapered shape for the kelp blade
    const baseWidth = 0.15; // Width at the base
    const tipWidth = 0.08; // Width at the tip
    
    // Create left and right side points with a curved shape
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = height * t; // Height progresses linearly
      
      // Width tapers from base to tip with slight curve
      const width = baseWidth * (1 - t * 0.8) + tipWidth * (t * 0.8);
      
      // Add waviness to the edges
      const xOffset = Math.sin(t * Math.PI * 3) * 0.03;
      
      // Create left and right side points
      points.push(new THREE.Vector2(-width/2 + xOffset, y));
    }
    
    // Add tip point
    points.push(new THREE.Vector2(0, height + 0.05));
    
    // Add right side points (in reverse to complete the shape)
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const y = height * t;
      
      const width = baseWidth * (1 - t * 0.8) + tipWidth * (t * 0.8);
      const xOffset = Math.sin(t * Math.PI * 3) * 0.03;
      
      points.push(new THREE.Vector2(width/2 + xOffset, y));
    }
    
    // Create shape from points
    const strandShape = new THREE.Shape(points);
    
    // Create extrusion settings
    const extrudeSettings = {
      steps: 1,
      depth: 0.02, // Very thin
      bevelEnabled: false
    };
    
    // Create geometry and mesh
    const strandGeometry = new THREE.ExtrudeGeometry(strandShape, extrudeSettings);
    
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(strandGeometry);
    
    const strandMesh = new THREE.Mesh(strandGeometry, material);
    strandMesh.name = "KelpBlade";
    
    // Add small details/veins to the kelp blade
    this.addKelpDetails(strandMesh, height, material);
    
    // Return the mesh
    return strandMesh;
  }

  /**
   * Add details like veins and small features to the kelp blade
   */
  private addKelpDetails(strandMesh: THREE.Mesh, height: number, material: THREE.Material): void {
    // Optional: Add a central vein or rib to the kelp blade
    const veinGeometry = new THREE.BoxGeometry(0.01, height * 0.95, 0.015);
    veinGeometry.translate(0, height * 0.45, 0.005); // Center vein on blade
    
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(veinGeometry);
    
    const veinMaterial = material.clone();
    // Cast to MeshStandardMaterial to set properties
    if (veinMaterial instanceof THREE.MeshStandardMaterial) {
      veinMaterial.color = new THREE.Color(veinMaterial.color).multiplyScalar(0.9); // Slightly darker
    }
    
    const vein = new THREE.Mesh(veinGeometry, veinMaterial);
    vein.name = "KelpVein";
    strandMesh.add(vein);
    
    // Add some small "holes" or perforations randomly distributed along the blade
    const numHoles = Math.floor(2 + Math.random() * 4); // 2-5 holes per blade
    
    for (let i = 0; i < numHoles; i++) {
      // Position holes in the upper 70% of the blade
      const holeY = height * (0.3 + Math.random() * 0.6);
      const holeX = (Math.random() - 0.5) * 0.08; // Offset from center
      
      const holeSize = 0.02 + Math.random() * 0.02;
      const holeGeometry = new THREE.CircleGeometry(holeSize, 8);
      
      // Ensure the holes go all the way through the blade
      holeGeometry.rotateX(-Math.PI / 2);
      holeGeometry.translate(holeX, holeY, 0.02); // Position on the kelp surface
      
      // Manually compute bounding sphere to fix NaN issue
      this.computeCorrectBoundingSphere(holeGeometry);
      
      const holeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      
      const hole = new THREE.Mesh(holeGeometry, holeMaterial);
      hole.name = "KelpHole";
      strandMesh.add(hole);
    }
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
   * Creates a collision mesh for the entire kelp wall
   */
  private createCollisionMesh(config: KelpWallObstacleConfig): void {
    // Calculate dimensions for collision box
    const strandHeight = config.baseScaleY;
    const playerConfig = configSystem.get('player');
    const laneWidth = playerConfig?.laneWidth || 2.0;
    
    // Make sure collision width matches the visual width of the wall
    const segmentWidthCoverage = Math.min(config.segmentWidthCoverage || 0.9, 0.95);
    const collisionWidth = laneWidth * segmentWidthCoverage;
    
    // Create collision geometry
    const collisionGeom = new THREE.BoxGeometry(
      collisionWidth,    // Width covers the kelp wall
      strandHeight,      // Height matches tallest kelp
      0.3                // Depth gives enough thickness for collision
    );
    
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(collisionGeom);
    
    // Create invisible material for collision mesh
    const collisionMat = new THREE.MeshBasicMaterial({
      visible: false,     // Keep invisible in production
      wireframe: true,    // For debugging if made visible
      color: 0x00ff00     // Green for debugging
    });
    
    // Create collision mesh
    this.collisionMesh = new THREE.Mesh(collisionGeom, collisionMat);
    this.collisionMesh.name = "KelpWallCollisionBox";
    
    // Position collision mesh at center of kelp wall
    this.collisionMesh.position.y = strandHeight / 2;
    
    // Add collision mesh to main group
    this.mesh.add(this.collisionMesh);
  }

  /**
   * Create fallback mesh in case of errors
   */
  private createFallbackMesh(): void {
    // Simple fallback geometry in case the detailed mesh creation fails
    this.mesh = new THREE.Group();
    this.mesh.name = "KelpWallObstacleFallback";
    
    const config = this.config;
    const strandHeight = config.baseScaleY;
    const playerConfig = configSystem.get('player');
    const laneWidth = playerConfig?.laneWidth || 2.0;
    const segmentWidthCoverage = 0.9; // Strict 90% of lane width
    const wallWidth = laneWidth * segmentWidthCoverage;
    
    // Simple box for the fallback kelp wall
    const wallGeom = new THREE.BoxGeometry(wallWidth, strandHeight, 0.2);
    
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(wallGeom);
    
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3B7A57,  // Sea green
      transparent: true,
      opacity: 0.9
    });
    
    const wall = new THREE.Mesh(wallGeom, wallMaterial);
    wall.position.y = strandHeight / 2;
    this.mesh.add(wall);
    
    // Create collision mesh (same as visual mesh for fallback)
    this.collisionMesh = new THREE.Mesh(
      wallGeom.clone(),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.collisionMesh.name = "KelpWallCollisionBoxFallback";
    this.collisionMesh.position.copy(wall.position);
    this.mesh.add(this.collisionMesh);
    
    // Set userData for identification
    this.mesh.userData = { 
      type: 'obstacle', 
      name: 'kelpWall', 
      assetInstance: this,
      isDangerous: true
    };
    
    console.warn("Using fallback mesh for KelpWallAsset due to error in detailed mesh creation");
  }
  
  /**
   * Updates the kelp animation
   * @param deltaTime Time in seconds since last update
   */
  public updateAnimation(deltaTime: number): void {
    try {
      this.animationTime += deltaTime;
      const config = this.config;
      
      // Get animation parameters from config with fallbacks
      const swaySpeed = config.swaySpeed || 0.5;
      const swayAmplitude = config.swayAmplitude || 0.1;
      
      // Animate each kelp strand
      this.kelpStrands.forEach(strand => {
        // Get strand-specific properties
        const strandData = strand.userData as any;
        const index = strandData.index || 0;
        const phaseOffset = strandData.swayPhaseOffset || index * 0.5;
        const height = strandData.height || config.baseScaleY;
        
        // Create more realistic sway animation with multiple components
        
        // Primary slow sway - simulates water current
        const primarySway = Math.sin(this.animationTime * swaySpeed + phaseOffset) * swayAmplitude;
        
        // Secondary faster sway - simulates smaller water movements
        const secondarySway = Math.sin(this.animationTime * swaySpeed * 2.5 + phaseOffset * 1.4) * swayAmplitude * 0.3;
        
        // Combine sways with more weight to primary
        const totalSway = primarySway * 0.8 + secondarySway * 0.2;
        
        // Apply rotation at the base - kelp bends from the bottom
        strand.rotation.z = totalSway;
        
        // Apply rotation based on height - taller kelp sways more
        const heightFactor = height / config.baseScaleY;
        strand.rotation.z *= heightFactor;
        
        // Slight sway on X axis too for more natural movement
        strand.rotation.x = Math.sin(this.animationTime * swaySpeed * 0.7 + phaseOffset * 0.8) * swayAmplitude * 0.15;
      });
    } catch (error) {
      console.warn("Error in KelpWallAsset updateAnimation:", error);
      // Animation errors are not critical, can continue
    }
  }

  /**
   * Returns the main kelp wall mesh
   * Creates it if it doesn't exist yet
   */
  public getMesh(): THREE.Group {
    if (!this.mesh) {
      this.createMesh();
    }
    
    // Make sure mesh and all children are visible
    if (this.mesh) {
      this.mesh.visible = true;
      
      // Ensure all children are visible (except collision mesh)
      this.mesh.traverse(child => {
        if (child instanceof THREE.Mesh && child.name !== "KelpWallCollisionBox") {
          child.visible = true;
        }
      });
      
      console.log("KelpWallAsset: Ensured visibility of kelp wall mesh and children");
    }
    
    return this.mesh;
  }

  /**
   * Returns the collision object for this asset
   * Always returns a valid mesh, even in error cases
   */
  public getCollisionObject(): THREE.Mesh {
    if (!this.collisionMesh) {
      // Create an emergency fallback collision mesh if needed
      console.warn("KelpWallAsset: Creating emergency collision mesh");
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ visible: false });
      this.collisionMesh = new THREE.Mesh(geometry, material);
      this.collisionMesh.name = "KelpWallEmergencyCollisionBox";
      
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
   * Determines if the kelp wall is dangerous (always true)
   */
  public isDangerous(): boolean {
    return true; // Kelp wall is always a solid obstacle
  }

  /**
   * Resets the kelp wall to its initial state
   */
  public reset(): void {
    try {
      this.animationTime = 0;
      
      // Reset strand rotations
      this.kelpStrands.forEach(strand => {
        strand.rotation.set(0, strand.rotation.y, 0);
      });
    } catch (error) {
      console.warn("Error in KelpWallAsset reset:", error);
    }
  }

  /**
   * Disposes of resources used by this asset
   */
  public dispose(): void {
    try {
      this.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    } catch (error) {
      console.warn("Error disposing KelpWallAsset resources:", error);
    }
  }

  /**
   * Creates the procedural mesh for this asset
   */
  public createMesh(): THREE.Group {
    try {
      // Only recreate if not already created
      if (!this.mesh) {
        this.mesh = new THREE.Group();
        this.mesh.name = "KelpWallObstacle";
        const config = this.config;
        
        // Get visual properties from config with fallbacks
        const visualConfig = config.visuals || {};
        
        // Create kelp strands
        this.kelpStrands = this.createKelpStrands(config, visualConfig);
        
        // Add kelp strands to the main mesh
        this.kelpStrands.forEach(strand => {
          this.mesh.add(strand);
        });
        
        // Create collision mesh for the entire wall
        this.createCollisionMesh(config);
        
        // Set userData for collision detection and identification
        this.mesh.userData = { 
          type: 'obstacle', 
          name: 'kelpWall', 
          assetInstance: this,
          isDangerous: true
        };
        
        // Ensure all parts are visible
        this.mesh.visible = true;
        this.mesh.traverse(child => {
          if (child instanceof THREE.Mesh && !child.name.includes("Collision")) {
            child.visible = true;
          }
        });
        
        console.log("KelpWallAsset: Created new mesh with visibility enforced");
      }
      return this.mesh;
    } catch (error) {
      console.error("Error in KelpWallAsset.createMesh():", error);
      this.createFallbackMesh();
      return this.mesh;
    }
  }
}
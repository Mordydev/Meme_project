import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { KelpWallObstacleConfig } from '../../config/gameConfig';
import { IObstacleAsset } from '../IObstacleAsset';
import { AssetHelpers } from '../AssetHelpers';

export class KelpWallAsset implements IObstacleAsset {
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
        mainColor: 0x3B7A57,          // Sea green
        emissiveColor: 0x2A5A37,      // Darker emissive
        emissiveIntensity: 0.07,      // Subtle glow (increased from 0.05)
        roughness: 0.6,               // Slightly smoother for Pixar style (reduced from 0.7)
        metalness: 0.05,              // Slight metalness for better highlights (increased from 0.0)
        clearcoat: 0.4,               // Medium clearcoat for wet appearance
        clearcoatRoughness: 0.3,      // Smoother clearcoat for slight shine
        opacity: 0.92,                // Slightly more opaque for Pixar look
        transmission: 0.1,            // Slight translucency for thin kelp edges
        animationSpeed: 0.5,          // Animation speed
        animationAmplitude: 0.1       // Animation amplitude
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
    console.log("KelpWallAsset: createMesh() called");
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
    
    // Use 70% of lane width to match collision dimensions
    // This ensures the kelp wall doesn't cause false collisions with adjacent lanes
    const segmentWidthCoverage = 0.7; // Using 70% of lane width as specified in design document
    const totalWallWidth = laneWidth * segmentWidthCoverage;
    
    console.log(`KelpWall visual width: ${totalWallWidth.toFixed(2)} units (${segmentWidthCoverage * 100}% of lane width)`);
    
    // Calculate strand spacing for even distribution
    const spacing = numStrands > 1 ? totalWallWidth / (numStrands - 1) : 0;
    
    // Create enhanced Pixar-style kelp material - all strands will share this material
    const kelpMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConfig.mainColor || 0x3B7A57),      // Sea green
      roughness: visualConfig.roughness || 0.6,                         // Slightly smoother for Pixar style
      metalness: visualConfig.metalness || 0.05,                        // Slight metalness for better specular highlights
      emissive: new THREE.Color(visualConfig.emissiveColor || 0x2A5A37),
      emissiveIntensity: visualConfig.emissiveIntensity || 0.07,        // Increased subtle glow
      clearcoat: visualConfig.clearcoat || 0.4,                         // Medium clearcoat for wet appearance
      clearcoatRoughness: visualConfig.clearcoatRoughness || 0.3,       // Smoother clearcoat for slight shine
      transparent: true,
      opacity: visualConfig.opacity || 0.92,                            // Slightly more opaque for Pixar look
      transmission: visualConfig.transmission || 0.1,                   // Slight translucency for thin kelp edges
      side: THREE.DoubleSide,                                           // Render both sides for better visibility
      visible: true                                                     // Explicitly ensure visibility
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
      
      // Ensure strand is visible
      strand.visible = true;
      
      strands.push(strand);
    }
    
    return strands;
  }

  /**
   * Creates a single kelp strand with realistic curve-based geometry
   * with improved NaN prevention
   */
  private createKelpStrand(height: number, material: THREE.Material): THREE.Mesh {
    try {
      // Validate input parameters
      if (isNaN(height) || height <= 0) {
        console.warn("Invalid height for kelp strand, using default");
        height = 3.5; // Use a reasonable default
      }
      
      // Create a mesh for the strand
      const strandMesh = new THREE.Mesh();
      strandMesh.name = "KelpBlade";
      
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
        
        // Create left side point with NaN check
        const leftX = -width/2 + xOffset;
        if (!isNaN(leftX) && !isNaN(y)) {
          points.push(new THREE.Vector2(leftX, y));
        } else {
          // Use safe values if NaN detected
          points.push(new THREE.Vector2(-width/2, y));
        }
      }
      
      // Add tip point with NaN check
      const tipY = height + 0.05;
      if (!isNaN(tipY)) {
        points.push(new THREE.Vector2(0, tipY));
      } else {
        points.push(new THREE.Vector2(0, height));
      }
      
      // Add right side points (in reverse to complete the shape)
      for (let i = segments; i >= 0; i--) {
        const t = i / segments;
        const y = height * t;
        
        const width = baseWidth * (1 - t * 0.8) + tipWidth * (t * 0.8);
        const xOffset = Math.sin(t * Math.PI * 3) * 0.03;
        
        // Create right side point with NaN check
        const rightX = width/2 + xOffset;
        if (!isNaN(rightX) && !isNaN(y)) {
          points.push(new THREE.Vector2(rightX, y));
        } else {
          // Use safe values if NaN detected
          points.push(new THREE.Vector2(width/2, y));
        }
      }
      
      // Verify we have enough points to create a valid shape
      if (points.length < 3) {
        throw new Error("Not enough valid points to create kelp strand shape");
      }
      
      // Create shape from points
      const strandShape = new THREE.Shape(points);
      
      // Create extrusion settings with low-poly fallback options
      const extrudeSettings = {
        steps: 1,
        depth: 0.02, // Very thin
        bevelEnabled: false
      };
      
      // Create geometry and mesh
      const strandGeometry = new THREE.ExtrudeGeometry(strandShape, extrudeSettings);
      
      // Compute correct bounding sphere to avoid NaN issues
      AssetHelpers.computeCorrectBoundingSphere(strandGeometry);
      
      // Verify geometry is valid
      if (!this.validateGeometry(strandGeometry)) {
        throw new Error("Invalid kelp strand geometry created");
      }
      
      // Set the geometry and material to the mesh
      strandMesh.geometry = strandGeometry;
      strandMesh.material = material;
      
      // Add small details/veins to the kelp blade
      this.addKelpDetails(strandMesh, height, material);
      
      // Ensure the mesh is visible
      strandMesh.visible = true;
      
      // Return the mesh
      return strandMesh;
    } catch (error) {
      console.error("Error creating kelp strand:", error);
      
      // Create a simple fallback geometry if the complex one fails
      const fallbackGeometry = new THREE.PlaneGeometry(0.15, height, 1, 4);
      fallbackGeometry.translate(0, height/2, 0);
      
      // Ensure the fallback has a valid bounding sphere
      AssetHelpers.computeCorrectBoundingSphere(fallbackGeometry);
      
      // Create a simple mesh with the fallback geometry
      const fallbackMesh = new THREE.Mesh(fallbackGeometry, material);
      fallbackMesh.name = "KelpBladeFallback";
      fallbackMesh.visible = true;
      
      return fallbackMesh;
    }
  }
  
  /**
   * Validates a geometry to ensure it doesn't contain NaN values
   * @param geometry The geometry to validate
   * @returns true if the geometry is valid, false otherwise
   */
  private validateGeometry(geometry: THREE.BufferGeometry): boolean {
    const position = geometry.getAttribute('position');
    
    if (!position || position.count === 0) {
      return false;
    }
    
    // Check position values for NaN
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Add details like veins and small features to the kelp blade
   * with improved NaN protection
   */
  private addKelpDetails(strandMesh: THREE.Mesh, height: number, material: THREE.Material): void {
    try {
      // Validate input parameter
      if (isNaN(height) || height <= 0) {
        console.warn("Invalid height for kelp details, using default");
        height = 3.5;
      }
      
      // Optional: Add a central vein or rib to the kelp blade
      const veinGeometry = new THREE.BoxGeometry(0.01, height * 0.95, 0.015);
      veinGeometry.translate(0, height * 0.45, 0.005); // Center vein on blade
      
      // Use AssetHelpers to fix NaN issue
      AssetHelpers.computeCorrectBoundingSphere(veinGeometry);
      
      // Create enhanced Pixar-style vein material
      let veinMaterial: THREE.Material;
      try {
        // Clone the original material as starting point
        veinMaterial = material.clone();
        
        // Cast to MeshStandardMaterial to set Pixar-style properties
        if (veinMaterial instanceof THREE.MeshStandardMaterial) {
          // Darker color for the vein
          veinMaterial.color = new THREE.Color(veinMaterial.color).multiplyScalar(0.85);
          
          // Reduce roughness for slightly smoother appearance than the main kelp
          veinMaterial.roughness = Math.max(0.1, (veinMaterial.roughness || 0.6) * 0.9);
          
          // Increase metalness for better definition
          veinMaterial.metalness = Math.min(0.2, (veinMaterial.metalness || 0.05) * 1.5);
          
          // Enhance clearcoat for better visibility/contrast
          if (veinMaterial.clearcoat !== undefined) {
            veinMaterial.clearcoat = Math.min(0.6, (veinMaterial.clearcoat * 1.2));
            veinMaterial.clearcoatRoughness = Math.max(0.1, (veinMaterial.clearcoatRoughness || 0.3) * 0.8);
          } else {
            veinMaterial.clearcoat = 0.5;
            veinMaterial.clearcoatRoughness = 0.2;
          }
          
          // Slight decrease in transmission for more defined appearance
          if (veinMaterial.transmission !== undefined) {
            veinMaterial.transmission = Math.max(0, (veinMaterial.transmission || 0.1) * 0.8);
          }
        }
      } catch (error) {
        // Fallback to Pixar-style standard material if clone fails
        console.warn("Error cloning material for kelp vein:", error);
        veinMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x2A5A37,              // Dark green
          roughness: 0.5,               // Medium roughness
          metalness: 0.1,               // Slight metalness
          clearcoat: 0.5,               // Medium clearcoat for definition
          clearcoatRoughness: 0.2       // Fairly smooth clearcoat
        });
      }
      
      const vein = new THREE.Mesh(veinGeometry, veinMaterial);
      vein.name = "KelpVein";
      strandMesh.add(vein);
      
      // Limit the number of holes based on height to avoid overcrowding small kelp
      const maxHoles = Math.min(Math.floor(height), 5); // Limit based on height
      const numHoles = Math.max(0, Math.floor(1 + Math.random() * maxHoles)); // At least 0, at most maxHoles
      
      for (let i = 0; i < numHoles; i++) {
        try {
          // Position holes in the upper 70% of the blade
          let holeY = height * (0.3 + Math.random() * 0.6);
          let holeX = (Math.random() - 0.5) * 0.08; // Offset from center
          
          // Safety check for NaN values
          if (isNaN(holeY) || isNaN(holeX)) {
            holeY = height * 0.5; // Default to middle if NaN
            holeX = 0;
          }
          
          // Ensure hole size is reasonable
          const holeSize = Math.max(0.01, Math.min(0.04, 0.02 + Math.random() * 0.02));
          
          // Use lower segment count for better performance
          const holeGeometry = new THREE.CircleGeometry(holeSize, 6);
          
          // Ensure the holes go all the way through the blade
          holeGeometry.rotateX(-Math.PI / 2);
          holeGeometry.translate(holeX, holeY, 0.02); // Position on the kelp surface
          
          // Use AssetHelpers to fix NaN issue
          AssetHelpers.computeCorrectBoundingSphere(holeGeometry);
          
          // Create a more sophisticated hole material for better Pixar-style appearance
          const holeMaterial = new THREE.MeshStandardMaterial({
            color: 0x102010,              // Very dark green, not pure black for better integration
            roughness: 0.9,               // Very rough interior
            metalness: 0.0,               // No metalness for interior
            emissive: 0x050505,           // Very slight emissive for depth
            emissiveIntensity: 0.2,       // Subtle intensity
            transparent: true,
            opacity: 0.8,                 // More opaque for better visibility
            side: THREE.DoubleSide,       // Render both sides
            depthTest: true,              // Ensure proper depth testing
            depthWrite: true              // Ensure the holes write to depth buffer
          });
          
          const hole = new THREE.Mesh(holeGeometry, holeMaterial);
          hole.name = "KelpHole_" + i;
          strandMesh.add(hole);
        } catch (holeError) {
          console.warn("Error creating kelp hole:", holeError);
          // Continue with next hole, not critical
        }
      }
    } catch (error) {
      console.error("Error in addKelpDetails:", error);
      // Not critical if details fail to add, main kelp blade still exists
    }
  }

  /**
   * Compute a valid bounding sphere to fix NaN issues
   * Uses the shared AssetHelpers implementation
   */
  private computeCorrectBoundingSphere(geometry: THREE.BufferGeometry): void {
    // Use the shared implementation from AssetHelpers
    AssetHelpers.computeCorrectBoundingSphere(geometry);
  }

  /**
   * Creates a collision mesh for the entire kelp wall
   */
  private createCollisionMesh(config: KelpWallObstacleConfig): void {
    // Calculate dimensions for collision box
    const strandHeight = config.baseScaleY;
    const playerConfig = configSystem.get('player');
    const laneWidth = playerConfig?.laneWidth || 2.0;
    
    // Use 70% of lane width (instead of 90%) for collision to avoid hits from adjacent lanes
    // This ensures proper lane clearance and matches the visual width used in createKelpStrands
    const segmentWidthCoverage = 0.7; // Override config to ensure consistent collision behavior
    const collisionWidth = laneWidth * segmentWidthCoverage;
    
    // Log collision dimensions for debugging
    console.log(`KelpWall collision width: ${collisionWidth.toFixed(2)} units (${segmentWidthCoverage * 100}% of lane width)`);
    
    // Create collision geometry - narrower and slightly thinner depth
    const collisionGeom = new THREE.BoxGeometry(
      collisionWidth,    // Narrower width to prevent adjacent lane hits
      strandHeight,      // Height matches tallest kelp
      0.25               // Reduced depth for tighter collision (was 0.3)
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
    
    // Add a debug collision mesh if needed
    if (window.location.href.includes('debug=true')) {
      // Create a visible debug version of the collision box
      const debugCollisionMat = new THREE.MeshBasicMaterial({
        visible: true,
        wireframe: true,
        color: 0xff0000,
        transparent: true,
        opacity: 0.5
      });
      
      const debugCollisionMesh = new THREE.Mesh(collisionGeom.clone(), debugCollisionMat);
      debugCollisionMesh.name = "KelpWallCollisionBoxDebug";
      debugCollisionMesh.position.copy(this.collisionMesh.position);
      
      // Add to mesh group
      this.mesh.add(debugCollisionMesh);
      console.log("Added visible debug collision box for KelpWall");
    }
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
    
    // Use the same narrower width as the regular collision mesh (70% instead of 90%)
    // This ensures consistency between fallback and regular implementation
    const segmentWidthCoverage = 0.7; // Consistent 70% width throughout the asset
    const wallWidth = laneWidth * segmentWidthCoverage;
    
    console.log(`KelpWall fallback width: ${wallWidth.toFixed(2)} units (${segmentWidthCoverage * 100}% of lane width)`);
    
    // Simple box for the fallback kelp wall (also made slightly thicker for better visibility)
    const wallGeom = new THREE.BoxGeometry(wallWidth, strandHeight, 0.25);
    
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(wallGeom);
    
    // Enhanced Pixar-style fallback material
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3B7A57,               // Sea green
      roughness: 0.6,                // Slightly smoother for Pixar style
      metalness: 0.05,               // Slight metalness for better highlights
      emissive: 0x2A5A37,            // Darker green emissive
      emissiveIntensity: 0.1,        // Slight glow to make it more visible
      clearcoat: 0.4,                // Medium clearcoat for wet appearance
      clearcoatRoughness: 0.3,       // Smoother clearcoat for slight shine
      transparent: true,
      opacity: 0.95,                 // More visible than regular
      transmission: 0.1,             // Slight translucency for edges
      side: THREE.DoubleSide         // Ensure both sides render
    });
    
    const wall = new THREE.Mesh(wallGeom, wallMaterial);
    wall.position.y = strandHeight / 2;
    wall.visible = true; // Ensure visibility
    this.mesh.add(wall);
    
    // Create collision mesh (narrower than visual mesh for better lane clearance)
    const collisionGeom = new THREE.BoxGeometry(wallWidth * 0.9, strandHeight, 0.2);
    this.computeCorrectBoundingSphere(collisionGeom);
    
    this.collisionMesh = new THREE.Mesh(
      collisionGeom,
      new THREE.MeshBasicMaterial({ 
        visible: false,
        wireframe: true,
        color: 0xff0000
      })
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
    
    // Ensure mesh and all its children are visible
    this.mesh.visible = true;
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh && !child.name.includes("Collision")) {
        child.visible = true;
      }
    });
    
    console.warn("Using fallback mesh for KelpWallAsset due to error in detailed mesh creation");
    
    // Add a debug collision mesh if needed
    if (window.location.href.includes('debug=true')) {
      // Create a visible debug version of the collision box
      const debugCollisionMat = new THREE.MeshBasicMaterial({
        visible: true,
        wireframe: true,
        color: 0xff0000,
        transparent: true,
        opacity: 0.5
      });
      
      const debugCollisionMesh = new THREE.Mesh(collisionGeom.clone(), debugCollisionMat);
      debugCollisionMesh.name = "KelpWallCollisionBoxFallbackDebug";
      debugCollisionMesh.position.copy(this.collisionMesh.position);
      
      // Add to mesh group
      this.mesh.add(debugCollisionMesh);
      console.log("Added visible debug collision box for KelpWall fallback");
    }
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
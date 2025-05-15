import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { SchoolOfFishObstacleConfig } from '../../config/gameConfig';
import { IObstacleAsset } from '../IObstacleAsset';
import { AssetHelpers } from '../AssetHelpers';

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

export class SchoolOfFishAsset implements IObstacleAsset {
  private shaderManager: ShaderManager;
  private mesh!: THREE.Group;              // Main group containing all fish instances
  private instancedMesh!: THREE.InstancedMesh; // InstancedMesh for efficient fish rendering
  private collisionMesh!: THREE.Mesh;      // Collision object for the entire school
  private fishData: FishInstanceData[] = []; // Data for each fish instance
  private animationTime: number = 0;
  private fishGroup!: THREE.Group;        // Shared fish model as a group of meshes
  
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
        // Body material properties
        mainColor: 0xC0C0C0,        // Silver base color
        emissiveColor: 0xD0D0D0,    // Slightly brighter emissive
        emissiveIntensity: 0.25,    // Enhanced subtle glow (increased from 0.2)
        roughness: 0.15,            // Lower roughness for shinier fish scales (reduced from 0.2)
        metalness: 0.8,             // Higher metalness for better specular highlights (increased from 0.7)
        clearcoat: 0.7,             // Strong clearcoat for wet appearance
        clearcoatRoughness: 0.1,    // Smooth clearcoat for shiny fish
        envMapIntensity: 1.3,       // Enhanced environment reflections
        
        // Fin material properties
        finColor: 0xDDDDDD,         // Lighter color for fins
        finRoughness: 0.25,         // Slightly rougher than body
        finMetalness: 0.6,          // Less metallic than body
        finEmissiveColor: 0xCCCCCC, // Subtle glow for fins
        finEmissiveIntensity: 0.1,  // Lower emissive for fins
        finClearcoat: 0.8,          // High clearcoat for translucent look
        finClearcoatRoughness: 0.2, // Smoother clearcoat
        finOpacity: 0.9,            // Slight transparency at fin edges
        
        // Animation properties
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
      
      // Create detailed fish geometry - now returns a Group instead of BufferGeometry
      this.fishGroup = this.createDetailedFishGeometry(config.individualFishScale);
      
      // Ensure no NaN bounding spheres in the fish group
      this.fishGroup.traverse(child => {
        if (child instanceof THREE.Mesh && child.geometry) {
          this.computeCorrectBoundingSphere(child.geometry);
        }
      });
      
      // Create enhanced Pixar-style fish material with sophisticated properties
      const fishMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(visualConfig.mainColor || 0xC0C0C0),        // Silver base color
        roughness: visualConfig.roughness !== undefined ? visualConfig.roughness : 0.15,      // Reduced roughness for shinier fish scales
        metalness: visualConfig.metalness !== undefined ? visualConfig.metalness : 0.8,       // Increased metalness for better specular highlights
        emissive: new THREE.Color(visualConfig.emissiveColor || 0xD0D0D0),  // Subtle self-illumination
        emissiveIntensity: visualConfig.emissiveIntensity !== undefined ? visualConfig.emissiveIntensity : 0.25, // Enhanced subtle glow
        clearcoat: visualConfig.clearcoat !== undefined ? visualConfig.clearcoat : 0.7,       // Strong clearcoat for wet appearance
        clearcoatRoughness: visualConfig.clearcoatRoughness !== undefined ? visualConfig.clearcoatRoughness : 0.1, // Smooth clearcoat for shiny fish
        envMapIntensity: visualConfig.envMapIntensity !== undefined ? visualConfig.envMapIntensity : 1.3, // Enhanced environment reflections
        side: THREE.DoubleSide, // For fins and tails
        vertexColors: true      // For variety in fish coloration
      });
      
      // Determine fish count based on config
      const numFish = THREE.MathUtils.randInt(config.fishCountMin, config.fishCountMax);
      
      // Convert the Group to a BufferGeometry for instanced rendering
      // First create a temporary mesh to combine all geometries
      const tempBufferGeometry = new THREE.BufferGeometry();
      const mergedGeometries: THREE.BufferGeometry[] = [];
      
      // Traverse the fish group and collect all geometries
      this.fishGroup.traverse(child => {
        if (child instanceof THREE.Mesh && child.geometry) {
          // Clone the geometry to avoid modifying the original
          const clonedGeometry = child.geometry.clone();
          // Apply the mesh's transform to the geometry
          clonedGeometry.applyMatrix4(child.matrixWorld);
          mergedGeometries.push(clonedGeometry);
        }
      });
      
      // Merge all geometries into one
      const positions: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      
      mergedGeometries.forEach(geometry => {
        const positionAttr = geometry.getAttribute('position');
        const normalAttr = geometry.getAttribute('normal');
        const uvAttr = geometry.getAttribute('uv');
        
        if (positionAttr) {
          for (let i = 0; i < positionAttr.count; i++) {
            positions.push(positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i));
          }
        }
        
        if (normalAttr) {
          for (let i = 0; i < normalAttr.count; i++) {
            normals.push(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i));
          }
        }
        
        if (uvAttr) {
          for (let i = 0; i < uvAttr.count; i++) {
            uvs.push(uvAttr.getX(i), uvAttr.getY(i));
          }
        }
      });
      
      // Set attributes for the merged geometry
      tempBufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      if (normals.length > 0) {
        tempBufferGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      }
      if (uvs.length > 0) {
        tempBufferGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      }
      
      // Compute correct bounding sphere
      this.computeCorrectBoundingSphere(tempBufferGeometry);
      
      // Create instanced mesh with the merged geometry
      this.instancedMesh = new THREE.InstancedMesh(tempBufferGeometry, fishMaterial, numFish);
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
   * Creates detailed fish group with body, fins, and tail
   * Return type is THREE.Group to fix geometry.merge issues
   * Improved with NaN protection and error handling
   */
  private createDetailedFishGeometry(baseScale: number): THREE.Group {
    // Get visual configuration from config
    const config = this.config;
    const visualConfig = config.visuals || {};
    
    // Create fish group first so we can return it even in error cases
    const fishGroup = new THREE.Group();
    fishGroup.name = "DetailedFish";
    
    try {
      // Validate input parameter
      if (isNaN(baseScale) || baseScale <= 0) {
        console.warn("Invalid baseScale for fish geometry, using default");
        baseScale = 0.15; // Use default value
      }
      
      // Base fish dimensions
      const length = 0.3 * baseScale;
      const height = 0.1 * baseScale;
      const width = 0.07 * baseScale;
      
      // Create a more detailed fish shape with NaN protection
      const points: THREE.Vector2[] = [];
      
      // Function to safely add points, avoiding NaN values
      const addPoint = (x: number, y: number) => {
        // Skip NaN values
        if (isNaN(x) || isNaN(y)) {
          console.warn(`Skipping NaN point: (${x}, ${y})`);
          return false;
        }
        points.push(new THREE.Vector2(x, y));
        return true;
      };
      
      // Body shape with tapered tail
      addPoint(-length * 0.5, 0); // Tail point
      addPoint(-length * 0.35, height * 0.35); // Upper tail connection
      addPoint(-length * 0.1, height * 0.5); // Middle upper body
      addPoint(length * 0.2, height * 0.4); // Upper front body
      addPoint(length * 0.5, 0); // Nose tip
      addPoint(length * 0.2, -height * 0.4); // Lower front body
      addPoint(-length * 0.1, -height * 0.5); // Middle lower body
      addPoint(-length * 0.35, -height * 0.35); // Lower tail connection
      addPoint(-length * 0.5, 0); // Back to tail point
      
      // Ensure we have enough points for a valid shape
      if (points.length < 3) {
        throw new Error("Not enough valid points for fish shape");
      }
      
      // Create shape from points
      const fishShape = new THREE.Shape(points);
      
      // Create extrusion settings with slight bevel for smoother edges
      // Use more conservative settings to avoid NaN issues
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
      
      // Fix any NaN issues in the body geometry
      AssetHelpers.computeCorrectBoundingSphere(bodyGeometry);
      
      // Rotate to orient fish swimming along Z axis
      bodyGeometry.rotateY(Math.PI / 2);
      
      // Center the geometry at origin
      bodyGeometry.center();
      
      // Add vertex colors for fish variation
      this.addVertexColors(bodyGeometry);
      
      // Validate the body geometry before creating the mesh
      if (!this.validateGeometry(bodyGeometry)) {
        throw new Error("Invalid fish body geometry");
      }
      
      // Create materials
      const bodyMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.2,
        metalness: 0.7,
        side: THREE.DoubleSide
      });
      
      // Create enhanced Pixar-style fin material with distinctive properties for better contrast
      const finMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(visualConfig.finColor || 0xDDDDDD),    // Lighter color for fins
        roughness: visualConfig.finRoughness !== undefined ? visualConfig.finRoughness : 0.25,   // Slightly rougher than body
        metalness: visualConfig.finMetalness !== undefined ? visualConfig.finMetalness : 0.6,    // Less metallic than body
        emissive: new THREE.Color(visualConfig.finEmissiveColor || 0xCCCCCC), // Subtle glow
        emissiveIntensity: visualConfig.finEmissiveIntensity !== undefined ? visualConfig.finEmissiveIntensity : 0.1,
        clearcoat: visualConfig.finClearcoat !== undefined ? visualConfig.finClearcoat : 0.8,    // High clearcoat for translucent look
        clearcoatRoughness: visualConfig.finClearcoatRoughness !== undefined ? visualConfig.finClearcoatRoughness : 0.2, // Smoother clearcoat
        transparent: true,              // Enable transparency for fin edges
        opacity: visualConfig.finOpacity !== undefined ? visualConfig.finOpacity : 0.9,          // Slight transparency at edges
        side: THREE.DoubleSide           // Render both sides
      });
      
      // Create body mesh
      const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bodyMesh.name = "FishBody";
      fishGroup.add(bodyMesh);
      
      // Try to create and add tail fin
      try {
        const tailGeometry = this.createTailFinGeometry(length, height, baseScale);
        const tailMesh = new THREE.Mesh(tailGeometry, finMaterial.clone());
        tailMesh.name = "FishTail";
        fishGroup.add(tailMesh);
      } catch (tailError) {
        console.warn("Error creating fish tail:", tailError);
        // Continue without tail - not critical
      }
      
      // Try to create and add dorsal fin
      try {
        const dorsalGeometry = this.createDorsalFinGeometry(length, height, baseScale);
        const dorsalMesh = new THREE.Mesh(dorsalGeometry, finMaterial.clone());
        dorsalMesh.name = "FishDorsalFin";
        fishGroup.add(dorsalMesh);
      } catch (dorsalError) {
        console.warn("Error creating fish dorsal fin:", dorsalError);
        // Continue without dorsal fin - not critical
      }
      
      // Try to create and add side fins
      try {
        const sideFins = this.createSideFinsGeometry(length, height, width, baseScale);
        sideFins.forEach(fin => fishGroup.add(fin));
      } catch (finError) {
        console.warn("Error creating fish side fins:", finError);
        // Continue without side fins - not critical
      }
      
      // Ensure all meshes in the group are visible
      fishGroup.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.visible = true;
        }
      });
      
    } catch (error) {
      console.error("Error in createDetailedFishGeometry:", error);
      
      // Create a simple fallback fish if detailed creation fails
      try {
        // Very simple fish shape as fallback
        const simpleFishGeometry = new THREE.BoxGeometry(
          baseScale * 0.3, 
          baseScale * 0.1, 
          baseScale * 0.07
        );
        
        // Ensure valid bounding sphere
        AssetHelpers.computeCorrectBoundingSphere(simpleFishGeometry);
        
        // Create enhanced Pixar-style material for fallback fish
        const simpleMaterial = new THREE.MeshStandardMaterial({
          color: 0xC0C0C0,          // Silver base color
          roughness: 0.15,          // Lower roughness for shinier fish scales
          metalness: 0.8,           // Higher metalness for better specular highlights
          emissive: 0xD0D0D0,       // Subtle self-illumination
          emissiveIntensity: 0.25,  // Enhanced subtle glow
          clearcoat: 0.7,           // Strong clearcoat for wet appearance
          clearcoatRoughness: 0.1   // Smooth clearcoat for shiny fish
        });
        
        // Create mesh
        const simpleFishMesh = new THREE.Mesh(simpleFishGeometry, simpleMaterial);
        simpleFishMesh.name = "FishBodyFallback";
        
        // Add to group
        fishGroup.add(simpleFishMesh);
        
        console.warn("Using fallback fish geometry");
      } catch (fallbackError) {
        console.error("Error creating fallback fish:", fallbackError);
        // Leave the group empty but still return it to avoid null reference
      }
    }
    
    // Return the fish group (may be empty in worst case)
    return fishGroup;
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
    
    // Check a sample of position values for NaN (checking every vertex would be too slow)
    const sampleSize = Math.min(position.count, 100); // Check up to 100 vertices
    const step = Math.max(1, Math.floor(position.count / sampleSize));
    
    for (let i = 0; i < position.count; i += step) {
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
   * Creates the tail fin with detailed geometry
   * with improved NaN prevention and error handling
   */
  private createTailFinGeometry(length: number, height: number, scale: number): THREE.BufferGeometry {
    try {
      // Validate input parameters
      if (isNaN(length) || isNaN(height) || isNaN(scale) || 
          length <= 0 || height <= 0 || scale <= 0) {
        console.warn("Invalid parameters for tail fin, using defaults");
        length = 0.045; // 0.3 * 0.15 (default baseScale)
        height = 0.015; // 0.1 * 0.15 (default baseScale)
        scale = 0.15;   // default baseScale
      }
      
      // Tail shape (forked tail)
      const tailShape = new THREE.Shape();
      
      // Function to safely add points, avoiding NaN values
      const addPointToPath = (x: number, y: number, isMoveTo: boolean = false) => {
        // Validate coordinates
        if (isNaN(x) || isNaN(y)) {
          console.warn(`Skipping NaN point in tail fin: (${x}, ${y})`);
          return false;
        }
        
        // Add point to path
        if (isMoveTo) {
          tailShape.moveTo(x, y);
        } else {
          tailShape.lineTo(x, y);
        }
        return true;
      };
      
      // Starting point at the base of the tail
      addPointToPath(0, 0, true);
      
      // Upper tail fork
      addPointToPath(-length * 0.25, height * 0.75);
      
      // Middle of fork
      addPointToPath(-length * 0.1, 0);
      
      // Lower tail fork
      addPointToPath(-length * 0.25, -height * 0.75);
      
      // Back to starting point
      addPointToPath(0, 0);
      
      // Create geometry with conservative settings
      const tailGeometry = new THREE.ExtrudeGeometry(tailShape, {
        steps: 1,
        depth: Math.max(0.005, 0.01 * scale), // Ensure minimum depth
        bevelEnabled: false
      });
      
      // Position at the tail of the fish
      tailGeometry.translate(-length * 0.5, 0, 0);
      
      // Use AssetHelpers to fix NaN issue
      AssetHelpers.computeCorrectBoundingSphere(tailGeometry);
      
      // Verify the geometry is valid
      if (!this.validateGeometry(tailGeometry)) {
        throw new Error("Invalid tail fin geometry");
      }
      
      return tailGeometry;
    } catch (error) {
      console.error("Error creating tail fin geometry:", error);
      
      // Create a simpler fallback geometry
      const fallbackGeometry = new THREE.PlaneGeometry(
        length * 0.3,  // Width
        height * 1.5,  // Height
        1,             // Width segments
        1              // Height segments
      );
      
      // Position at the tail
      fallbackGeometry.translate(-length * 0.5, 0, 0);
      fallbackGeometry.rotateY(Math.PI / 2); // Orient correctly
      
      // Ensure valid bounding sphere
      AssetHelpers.computeCorrectBoundingSphere(fallbackGeometry);
      
      return fallbackGeometry;
    }
  }

  /**
   * Creates the dorsal fin on top of the fish
   * with improved NaN prevention and error handling
   */
  private createDorsalFinGeometry(length: number, height: number, scale: number): THREE.BufferGeometry {
    try {
      // Validate input parameters
      if (isNaN(length) || isNaN(height) || isNaN(scale) || 
          length <= 0 || height <= 0 || scale <= 0) {
        console.warn("Invalid parameters for dorsal fin, using defaults");
        length = 0.045; // 0.3 * 0.15 (default baseScale)
        height = 0.015; // 0.1 * 0.15 (default baseScale)
        scale = 0.15;   // default baseScale
      }
      
      // Dorsal fin shape (triangular with slight curve)
      const dorsalShape = new THREE.Shape();
      
      // Function to safely add points, avoiding NaN values
      const addPointToPath = (x: number, y: number, isMoveTo: boolean = false) => {
        // Validate coordinates
        if (isNaN(x) || isNaN(y)) {
          console.warn(`Skipping NaN point in dorsal fin: (${x}, ${y})`);
          return false;
        }
        
        // Add point to path
        if (isMoveTo) {
          dorsalShape.moveTo(x, y);
        } else {
          dorsalShape.lineTo(x, y);
        }
        return true;
      };
      
      // Starting at the base of the dorsal fin
      addPointToPath(0, 0, true);
      
      // Check control point and peak point for NaN before using quadraticCurveTo
      const controlX = length * 0.1;
      const controlY = height * 1.2;
      const peakX = 0;
      const peakY = height * 1.5;
      
      if (!isNaN(controlX) && !isNaN(controlY) && !isNaN(peakX) && !isNaN(peakY)) {
        // Curved up to peak
        dorsalShape.quadraticCurveTo(
          controlX, controlY, // Control point
          peakX, peakY        // Peak point
        );
      } else {
        // Fallback to straight line if any values are NaN
        console.warn("Using straight line for dorsal fin due to NaN values");
        addPointToPath(0, height * 1.5); // Direct line to peak
      }
      
      // Back to base
      addPointToPath(-length * 0.15, 0);
      addPointToPath(0, 0);
      
      // Create thin extruded geometry with minimum depth
      const dorsalGeometry = new THREE.ExtrudeGeometry(dorsalShape, {
        steps: 1,
        depth: Math.max(0.005, 0.01 * scale), // Ensure minimum depth
        bevelEnabled: false
      });
      
      // Position on top-middle of fish
      dorsalGeometry.translate(-length * 0.1, height * 0.5, 0);
      
      // Use AssetHelpers to fix NaN issue
      AssetHelpers.computeCorrectBoundingSphere(dorsalGeometry);
      
      // Verify the geometry is valid
      if (!this.validateGeometry(dorsalGeometry)) {
        throw new Error("Invalid dorsal fin geometry");
      }
      
      return dorsalGeometry;
    } catch (error) {
      console.error("Error creating dorsal fin geometry:", error);
      
      // Create a simpler fallback geometry - just a simple triangle
      const fallbackGeometry = new THREE.PlaneGeometry(
        length * 0.2,  // Width
        height * 1.5,  // Height
        1,             // Width segments
        1              // Height segments
      );
      
      // Position appropriately
      fallbackGeometry.translate(-length * 0.1, height * 1.0, 0);
      fallbackGeometry.rotateZ(Math.PI / 4); // Angle the fin
      
      // Ensure valid bounding sphere
      AssetHelpers.computeCorrectBoundingSphere(fallbackGeometry);
      
      return fallbackGeometry;
    }
  }

  /**
   * Creates the pectoral/side fins
   * Returns an array of meshes for the left and right fins
   */
  private createSideFinsGeometry(length: number, height: number, width: number, scale: number): THREE.Mesh[] {
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
    
    // Create material for fins
    const finMaterial = new THREE.MeshStandardMaterial({
      color: 0xA9A9A9, // Light gray for fins
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide // Render both sides
    });
    
    // Create thin extruded geometry
    const sideFinGeometry = new THREE.ExtrudeGeometry(sideFinShape, {
      steps: 1,
      depth: 0.01 * scale,
      bevelEnabled: false
    });
    
    // Position on side of fish
    sideFinGeometry.translate(length * 0.1, 0, 0);
    
    // Create left fin mesh
    const leftFinGeometry = sideFinGeometry.clone();
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(leftFinGeometry);
    const leftFinMesh = new THREE.Mesh(leftFinGeometry, finMaterial.clone());
    leftFinMesh.name = "FishLeftFin";
    
    // Create a copy and position on other side for right fin
    const rightFinGeometry = sideFinGeometry.clone();
    rightFinGeometry.translate(0, 0, width);
    // Manually compute bounding sphere to fix NaN issue
    this.computeCorrectBoundingSphere(rightFinGeometry);
    const rightFinMesh = new THREE.Mesh(rightFinGeometry, finMaterial.clone());
    rightFinMesh.name = "FishRightFin";
    
    // Return array of both fin meshes
    return [leftFinMesh, rightFinMesh];
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
   * Compute a valid bounding sphere to fix NaN issues
   * Uses the shared AssetHelpers implementation
   */
  private computeCorrectBoundingSphere(geometry: THREE.BufferGeometry): void {
    // Use the shared implementation from AssetHelpers
    AssetHelpers.computeCorrectBoundingSphere(geometry);
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
    
    // Create enhanced Pixar-style semi-transparent material for fallback visual representation
    const fallbackMaterial = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0,                    // Silver base color
      transparent: true,
      opacity: 0.8,                       // More opaque for better visibility (was 0.7)
      roughness: 0.15,                    // Lower roughness for shinier fish scales
      metalness: 0.8,                     // Higher metalness for better specular highlights
      emissive: 0xD0D0D0,                 // Subtle self-illumination
      emissiveIntensity: 0.25,            // Enhanced subtle glow
      clearcoat: 0.7,                     // Strong clearcoat for wet appearance
      clearcoatRoughness: 0.1             // Smooth clearcoat for shiny fish
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
      
      // Skip reset if using fallback (no instancedMesh or fishData)
      if (!this.instancedMesh || !this.fishData || this.fishData.length === 0) {
        return;
      }
      
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
      if (this.instancedMesh.instanceMatrix) {
        this.instancedMesh.instanceMatrix.needsUpdate = true;
      }
    } catch (error) {
      console.warn("Error in SchoolOfFishAsset reset:", error);
    }
  }

  /**
   * Disposes of resources used by this asset
   */
  public dispose(): void {
    try {
      // Dispose of fish group geometries
      if (this.fishGroup) {
        this.fishGroup.traverse(child => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                (child.material as THREE.Material).dispose();
              }
            }
          }
        });
      }
      
      // Dispose of instanced mesh material
      if (this.instancedMesh && this.instancedMesh.material) {
        if (Array.isArray(this.instancedMesh.material)) {
          this.instancedMesh.material.forEach(m => m.dispose());
        } else {
          (this.instancedMesh.material as THREE.Material).dispose();
        }
      }
      
      // Dispose of instanced mesh geometry
      if (this.instancedMesh && this.instancedMesh.geometry) {
        this.instancedMesh.geometry.dispose();
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
   * Returns the created mesh for compatibility with other obstacle assets
   */
  public createMesh(): THREE.Group {
    // Implementation already handles mesh creation in constructor
    if (!this.mesh) {
      // Only recreate if not already created
      console.log("SchoolOfFishAsset: Recreating mesh that wasn't created in constructor");
      this.mesh = new THREE.Group();
      
      try {
        // Call internal creation method to set up fish instances
        this.createMesh = function() { return this.mesh; };  // Avoid infinite recursion
        const config = this.config;
        
        // Get visual properties from config with fallbacks
        const visualConfig = config.visuals || {};
        
        // Create detailed fish geometry - now returns a Group
        this.fishGroup = this.createDetailedFishGeometry(config.individualFishScale);
        
        // Ensure no NaN bounding spheres in the fish group
        this.fishGroup.traverse(child => {
          if (child instanceof THREE.Mesh && child.geometry) {
            this.computeCorrectBoundingSphere(child.geometry);
          }
        });
        
        // Create enhanced Pixar-style fish material with sophisticated properties
        const fishMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(visualConfig.mainColor || 0xC0C0C0),        // Silver base color
          roughness: visualConfig.roughness !== undefined ? visualConfig.roughness : 0.15,      // Reduced roughness for shinier fish scales
          metalness: visualConfig.metalness !== undefined ? visualConfig.metalness : 0.8,       // Increased metalness for better specular highlights
          emissive: new THREE.Color(visualConfig.emissiveColor || 0xD0D0D0),  // Subtle self-illumination
          emissiveIntensity: visualConfig.emissiveIntensity !== undefined ? visualConfig.emissiveIntensity : 0.25, // Enhanced subtle glow
          clearcoat: visualConfig.clearcoat !== undefined ? visualConfig.clearcoat : 0.7,       // Strong clearcoat for wet appearance
          clearcoatRoughness: visualConfig.clearcoatRoughness !== undefined ? visualConfig.clearcoatRoughness : 0.1, // Smooth clearcoat for shiny fish
          envMapIntensity: visualConfig.envMapIntensity !== undefined ? visualConfig.envMapIntensity : 1.3, // Enhanced environment reflections
          side: THREE.DoubleSide, // For fins and tails
          vertexColors: true      // For variety in fish coloration
        });
        
        // Determine fish count based on config
        const numFish = THREE.MathUtils.randInt(config.fishCountMin, config.fishCountMax);
        
        // Convert the Group to a BufferGeometry for instanced rendering
        // First create a temporary mesh to combine all geometries
        const tempBufferGeometry = new THREE.BufferGeometry();
        const mergedGeometries: THREE.BufferGeometry[] = [];
        
        // Traverse the fish group and collect all geometries
        this.fishGroup.traverse(child => {
          if (child instanceof THREE.Mesh && child.geometry) {
            // Clone the geometry to avoid modifying the original
            const clonedGeometry = child.geometry.clone();
            // Apply the mesh's transform to the geometry
            clonedGeometry.applyMatrix4(child.matrixWorld);
            mergedGeometries.push(clonedGeometry);
          }
        });
        
        // Merge all geometries into one
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        
        mergedGeometries.forEach(geometry => {
          const positionAttr = geometry.getAttribute('position');
          const normalAttr = geometry.getAttribute('normal');
          const uvAttr = geometry.getAttribute('uv');
          
          if (positionAttr) {
            for (let i = 0; i < positionAttr.count; i++) {
              positions.push(positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i));
            }
          }
          
          if (normalAttr) {
            for (let i = 0; i < normalAttr.count; i++) {
              normals.push(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i));
            }
          }
          
          if (uvAttr) {
            for (let i = 0; i < uvAttr.count; i++) {
              uvs.push(uvAttr.getX(i), uvAttr.getY(i));
            }
          }
        });
        
        // Set attributes for the merged geometry
        tempBufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        if (normals.length > 0) {
          tempBufferGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        }
        if (uvs.length > 0) {
          tempBufferGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        }
        
        // Compute correct bounding sphere
        this.computeCorrectBoundingSphere(tempBufferGeometry);
        
        // Create instanced mesh with the merged geometry
        this.instancedMesh = new THREE.InstancedMesh(tempBufferGeometry, fishMaterial, numFish);
        this.instancedMesh.name = "FishInstances";
        this.instancedMesh.frustumCulled = false; // Ensure instances are rendered even if parent is outside frustum
        
        // Add to main group
        this.mesh.add(this.instancedMesh);
        
        // Create fish instances with varied positions and properties
        this.createFishInstances(numFish, config);
        
        // Create collision mesh for the entire school
        this.createCollisionMesh(config);
      } catch (e) {
        console.error("Error in SchoolOfFishAsset.createMesh():", e);
        // Create a very simple fallback
        const fallbackMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({ 
            color: 0xC0C0C0,              // Silver base color
            roughness: 0.15,              // Lower roughness for shinier fish scales
            metalness: 0.8,               // Higher metalness for better specular highlights
            emissive: 0xD0D0D0,           // Subtle self-illumination
            emissiveIntensity: 0.25,      // Enhanced subtle glow
            clearcoat: 0.7,               // Strong clearcoat for wet appearance
            clearcoatRoughness: 0.1       // Smooth clearcoat for shiny fish
          })
        );
        fallbackMesh.name = "FallbackSchoolOfFish";
        this.mesh.add(fallbackMesh);
        
        // Add collision mesh
        const collisionMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.2, 1.2),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        collisionMesh.name = "FallbackSchoolOfFishCollision";
        this.mesh.add(collisionMesh);
        this.collisionMesh = collisionMesh;
      }
      
      // Set userData
      this.mesh.userData = { 
        type: 'obstacle', 
        name: 'schoolOfFish', 
        assetInstance: this,
        isDangerous: true
      };
    }
    
    return this.mesh;
  }
}
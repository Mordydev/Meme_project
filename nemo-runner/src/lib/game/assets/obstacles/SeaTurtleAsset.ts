import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { SeaTurtleConfig } from '../../config/gameConfig';
import { IObstacleAsset } from '../IObstacleAsset';
import { AssetHelpers } from '../AssetHelpers';

export class SeaTurtleAsset implements IObstacleAsset {
  private shaderManager: ShaderManager;
  private mesh!: THREE.Group; // Main group for all turtle parts
  private collisionMesh!: THREE.Mesh; // Simplified collision shape (primarily the shell)
  private shell!: THREE.Mesh; // Reference to shell for animation
  private head!: THREE.Mesh; // Reference to head for animation
  private flippers: THREE.Mesh[] = []; // Store references to flippers for animation
  
  private animationTime: number = 0;
  private targetTurnAngle: number = 0; // For telegraphing, in radians
  private turnTransitionSpeed: number = Math.PI / 2; // Radians per second for turn animation

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    // Don't create mesh in constructor - let factory call getMesh() explicitly
  }

  /**
   * Returns configuration for the sea turtle obstacle
   */
  public get config(): Readonly<SeaTurtleConfig> {
    // Provide default values in case config is not available
    const defaultConfig: SeaTurtleConfig = {
      baseScale: 1.3,
      forwardSpeedFactor: 0.75,
      laneChangeTelegraphTime: 0.8,
      laneChangeDuration: 0.5,
      minTimeInLane: 3.0,
      maxTimeInLane: 6.0,
      turnAngleDegrees: 25,
      flipperWaveSpeed: 1.2,
      headBobSpeed: 0.3,
      visuals: {
        mainColor: 0x556B2F, // Olive green body
        roughness: 0.6,      // Rough skin
        metalness: 0.05,     // Minimal sheen
        patternColor: 0x6B8E23 // Slightly lighter pattern
      },
      shellVisuals: {
        mainColor: 0x8FBC8F, // Sage green shell
        roughness: 0.5,      // Medium rough
        metalness: 0.1,      // Slight sheen
        patternColor: 0x698B69, // Darker pattern for shell plates
        clearcoat: 0.3,      // Slight wet look
        clearcoatRoughness: 0.3 // Medium rough clearcoat
      }
    };

    try {
      return configSystem.getObstaclesConfig()?.seaTurtle || defaultConfig;
    } catch (error) {
      console.warn("SeaTurtleAsset: Could not get sea turtle config, using defaults", error);
      return defaultConfig;
    }
  }

  /**
   * Internal method to create the mesh, used by both public getMesh() and createMesh() methods
   * This encapsulates the mesh creation logic for better code organization
   */
  private _createMesh(): void {
    console.log("SeaTurtleAsset: _createMesh() called");
    try {
      this.mesh = new THREE.Group();
      this.mesh.name = "SeaTurtleObstacle";
      const config = this.config;
      const scale = config.baseScale || 1.3;

      // Get visual properties from config with fallbacks
      const bodyVisuals = config.visuals || {};
      const shellVisuals = config.shellVisuals || bodyVisuals;

      // Create body parts
      this.shell = this.createShell(scale, shellVisuals);
      this.head = this.createHead(scale, bodyVisuals);
      this.flippers = this.createFlippers(scale, bodyVisuals);
      
      // Add parts to the main mesh
      this.mesh.add(this.shell);
      this.mesh.add(this.head);
      this.flippers.forEach(flipper => this.mesh.add(flipper));
      
      // Create collision mesh
      this.createCollisionMesh(scale);

      // Set userData for collision detection and identification
      this.mesh.userData = { 
        type: 'obstacle', 
        name: 'seaTurtle', 
        assetInstance: this,
        isDangerous: true
      };
    } catch (error) {
      console.error("Error creating SeaTurtleAsset:", error);
      this.createFallbackMesh();
    }
  }

  /**
   * Creates a detailed turtle shell with a hexagonal pattern
   * With improved error handling and NaN checks
   */
  private createShell(scale: number, visualConfig: any): THREE.Mesh {
    // Create material with default values if config is missing
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: visualConfig.mainColor || 0x8FBC8F,
      roughness: visualConfig.roughness || 0.5,
      metalness: visualConfig.metalness || 0.1,
      clearcoat: visualConfig.clearcoat || 0.3,
      clearcoatRoughness: visualConfig.clearcoatRoughness || 0.3
    });

    try {
      // Base shell shape - flattened ellipsoid with proper resolution
      const shellRadius = 0.7 * scale;
      const shellGeom = new THREE.SphereGeometry(
        shellRadius, 
        32, // Higher resolution for smoother surface
        24,
        0, 
        Math.PI * 2, 
        0, 
        Math.PI / 2 // Hemisphere
      );
      
      // Initial normal computation before scaling
      shellGeom.computeVertexNormals();
      
      // Scale to flatten and elongate
      shellGeom.scale(1.2, 0.5, 1.0);
      
      // Recompute normals after scaling
      shellGeom.computeVertexNormals();
      
      // Check for NaN values in the geometry before pattern application
      const positions = shellGeom.getAttribute('position');
      let hasNaN = false;
      
      for (let i = 0; i < positions.count; i++) {
        if (isNaN(positions.getX(i)) || isNaN(positions.getY(i)) || isNaN(positions.getZ(i))) {
          // Replace NaN with safe values
          positions.setXYZ(i, 
            isNaN(positions.getX(i)) ? 0 : positions.getX(i),
            isNaN(positions.getY(i)) ? 0 : positions.getY(i),
            isNaN(positions.getZ(i)) ? 0 : positions.getZ(i)
          );
          hasNaN = true;
        }
      }
      
      if (hasNaN) {
        console.warn("SeaTurtleAsset: Fixed NaN values in base shell geometry");
        positions.needsUpdate = true;
        shellGeom.computeVertexNormals(); // Recompute after fixing
      }
      
      // Create hexagonal pattern on shell
      this.addHexagonalPattern(shellGeom, visualConfig);
      
      // Explicitly compute vertex normals after pattern modifications
      // This is already called in addHexagonalPattern, but we call again to be safe
      shellGeom.computeVertexNormals();
      
      // Check bounding sphere validity
      if (!shellGeom.boundingSphere || 
          isNaN(shellGeom.boundingSphere.radius) || 
          isNaN(shellGeom.boundingSphere.center.x) ||
          isNaN(shellGeom.boundingSphere.center.y) ||
          isNaN(shellGeom.boundingSphere.center.z)) {
          
        // Create a valid bounding sphere
        const center = new THREE.Vector3(0, 0, 0);
        const radius = shellRadius * Math.max(1.2, 1.0); // Based on the scaled dimensions
        shellGeom.boundingSphere = new THREE.Sphere(center, radius);
        console.warn("SeaTurtleAsset: Fixed invalid bounding sphere in shell geometry");
      }
      
      // Create shell with modified geometry
      const shell = new THREE.Mesh(shellGeom, shellMaterial);
      shell.rotation.x = -Math.PI / 2; // Lay flat
      shell.position.y = 0.15 * scale; // Slightly above center
      shell.castShadow = true;
      shell.receiveShadow = true;
      shell.name = "TurtleShell";
      
      console.log("SeaTurtleAsset: Shell created successfully with pattern");
      return shell;
      
    } catch (error) {
      console.error("SeaTurtleAsset: Error creating shell:", error);
      
      // Create fallback shell with simple geometry
      const fallbackGeom = new THREE.SphereGeometry(0.7 * scale, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      fallbackGeom.scale(1.2, 0.5, 1.0);
      fallbackGeom.computeVertexNormals();
      
      const fallbackShell = new THREE.Mesh(fallbackGeom, 
        new THREE.MeshStandardMaterial({
          color: 0x8FBC8F,
          roughness: 0.6,
          metalness: 0.1
        })
      );
      
      fallbackShell.rotation.x = -Math.PI / 2;
      fallbackShell.position.y = 0.15 * scale;
      fallbackShell.name = "TurtleShellFallback";
      
      return fallbackShell;
    }
  }

  /**
   * Creates a detailed head with eyes and beak
   */
  private createHead(scale: number, visualConfig: any): THREE.Mesh {
    const headGroup = new THREE.Group();
    headGroup.name = "TurtleHead";
    
    // Main head material
    const headMaterial = new THREE.MeshStandardMaterial({
      color: visualConfig.mainColor || 0x556B2F,
      roughness: visualConfig.roughness || 0.6,
      metalness: visualConfig.metalness || 0.05
    });
    
    // Base head shape
    const headRadius = 0.25 * scale;
    const headGeom = new THREE.SphereGeometry(headRadius, 16, 12);
    headGeom.scale(0.8, 0.7, 1.2); // Elongate front-to-back
    const head = new THREE.Mesh(headGeom, headMaterial);
    head.position.set(0, 0, 0);
    headGroup.add(head);
    
    // Create beak/snout
    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xD2B48C, // Tan color for beak
      roughness: 0.5,
      metalness: 0.05
    });
    
    const beakGeom = new THREE.ConeGeometry(
      0.1 * scale, // Radius
      0.2 * scale, // Height
      4, // 4 sides for angular shape
      1, // Height segments
      false // Open ended
    );
    beakGeom.rotateX(-Math.PI / 2); // Point forward
    const beak = new THREE.Mesh(beakGeom, beakMaterial);
    beak.position.set(0, -0.05 * scale, -headRadius * 0.9);
    headGroup.add(beak);
    
    // Create eyes (left and right)
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000, // Black eyes
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x303030,
      emissiveIntensity: 0.4
    });
    
    // Eye highlight material
    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.0,
      metalness: 1.0,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.7
    });
    
    // Left eye
    const leftEyeGeom = new THREE.SphereGeometry(0.06 * scale, 12, 8);
    const leftEye = new THREE.Mesh(leftEyeGeom, eyeMaterial);
    leftEye.position.set(0.15 * scale, 0.05 * scale, -headRadius * 0.7);
    headGroup.add(leftEye);
    
    // Left eye highlight
    const leftHighlightGeom = new THREE.SphereGeometry(0.02 * scale, 8, 6);
    const leftHighlight = new THREE.Mesh(leftHighlightGeom, highlightMaterial);
    leftHighlight.position.set(0.17 * scale, 0.07 * scale, -headRadius * 0.65);
    headGroup.add(leftHighlight);
    
    // Right eye
    const rightEyeGeom = new THREE.SphereGeometry(0.06 * scale, 12, 8);
    const rightEye = new THREE.Mesh(rightEyeGeom, eyeMaterial);
    rightEye.position.set(-0.15 * scale, 0.05 * scale, -headRadius * 0.7);
    headGroup.add(rightEye);
    
    // Right eye highlight
    const rightHighlightGeom = new THREE.SphereGeometry(0.02 * scale, 8, 6);
    const rightHighlight = new THREE.Mesh(rightHighlightGeom, highlightMaterial);
    rightHighlight.position.set(-0.17 * scale, 0.07 * scale, -headRadius * 0.65);
    headGroup.add(rightHighlight);
    
    // Position the head group
    headGroup.position.set(0, 0.22 * scale, -0.6 * scale);
    return headGroup as unknown as THREE.Mesh; // Type cast for simplicity
  }

  /**
   * Creates realistic flippers using ExtrudeGeometry
   * With enhanced error handling and geometry validation
   */
  private createFlippers(scale: number, visualConfig: any): THREE.Mesh[] {
    const flippers: THREE.Mesh[] = [];
    
    try {
      // Flipper material
      const flipperMaterial = new THREE.MeshStandardMaterial({
        color: visualConfig.mainColor || 0x556B2F,
        roughness: visualConfig.roughness || 0.6,
        metalness: visualConfig.metalness || 0.05,
        side: THREE.DoubleSide // Render both sides
      });
      
      // ---- Front flippers (longer, for swimming) ----
      
      // Create front flipper shape using curves for a more organic look
      const frontFlipperShape = new THREE.Shape();
      const frontFlipperLength = 0.6 * scale;
      const frontFlipperWidth = 0.2 * scale;
      
      // Base point at attachment - start with a clean shape
      frontFlipperShape.moveTo(0, 0);
      
      // Create curved front flipper using bezier curves
      frontFlipperShape.bezierCurveTo(
        frontFlipperWidth * 0.5, frontFlipperLength * 0.3,  // Control point 1
        frontFlipperWidth * 0.8, frontFlipperLength * 0.6,  // Control point 2
        frontFlipperWidth * 0.6, frontFlipperLength         // End point
      );
      
      // Curve back to complete the shape
      frontFlipperShape.bezierCurveTo(
        frontFlipperWidth * 0.5, frontFlipperLength * 0.9,  // Control point 1
        frontFlipperWidth * 0.1, frontFlipperLength * 0.5,  // Control point 2
        0, 0                                                // End point (back to origin)
      );
      
      // Verify shape is closed and valid
      if (frontFlipperShape.curves.length === 0) {
        throw new Error("Failed to create valid front flipper shape");
      }
      
      // Extrude the shape to create a 3D flipper with safer parameters
      const frontFlipperExtrudeSettings = {
        steps: 1,
        depth: 0.05 * scale,
        bevelEnabled: true,
        bevelThickness: 0.02 * scale,
        bevelSize: 0.02 * scale,
        bevelSegments: 3
      };
      
      // Create extrude geometry with error handling
      let frontFlipperGeom: THREE.ExtrudeGeometry;
      try {
        frontFlipperGeom = new THREE.ExtrudeGeometry(
          frontFlipperShape, 
          frontFlipperExtrudeSettings
        );
        
        // IMPORTANT: Compute normals after creation
        frontFlipperGeom.computeVertexNormals();
        
        // Check for NaN values in geometry
        const positions = frontFlipperGeom.getAttribute('position');
        let hasNaN = false;
        
        for (let i = 0; i < positions.count; i++) {
          if (isNaN(positions.getX(i)) || isNaN(positions.getY(i)) || isNaN(positions.getZ(i))) {
            positions.setXYZ(i, 0, 0, 0); // Reset NaN to origin
            hasNaN = true;
          }
        }
        
        if (hasNaN) {
          console.warn("SeaTurtleAsset: Fixed NaN values in front flipper geometry");
          positions.needsUpdate = true;
          frontFlipperGeom.computeVertexNormals(); // Recompute after fixing
        }
      } catch (error) {
        console.error("Error creating front flipper geometry:", error);
        // Fallback to simple geometry if extrude fails
        frontFlipperGeom = new THREE.BoxGeometry(
          frontFlipperWidth, frontFlipperLength, 0.05 * scale
        );
        console.warn("SeaTurtleAsset: Using fallback BoxGeometry for front flippers");
      }
      
      // Front left flipper
      const frontLeftFlipper = new THREE.Mesh(frontFlipperGeom, flipperMaterial.clone());
      frontLeftFlipper.position.set(0.45 * scale, 0.1 * scale, -0.3 * scale);
      frontLeftFlipper.rotation.set(Math.PI / 2, 0, Math.PI / 4); // Angle outward
      frontLeftFlipper.name = "FrontLeftFlipper";
      frontLeftFlipper.castShadow = true;
      frontLeftFlipper.receiveShadow = true;
      flippers.push(frontLeftFlipper);
      
      // Front right flipper (mirrored)
      const frontRightFlipper = new THREE.Mesh(frontFlipperGeom, flipperMaterial.clone());
      frontRightFlipper.position.set(-0.45 * scale, 0.1 * scale, -0.3 * scale);
      frontRightFlipper.rotation.set(Math.PI / 2, 0, -Math.PI / 4); // Angle outward with mirroring
      frontRightFlipper.scale.set(-1, 1, 1); // Mirror by scaling X
      frontRightFlipper.name = "FrontRightFlipper";
      frontRightFlipper.castShadow = true;
      frontRightFlipper.receiveShadow = true;
      flippers.push(frontRightFlipper);
      
      // ---- Rear flippers (smaller, different shape) ----
      
      // Create rear flipper shape
      const rearFlipperShape = new THREE.Shape();
      const rearFlipperLength = 0.4 * scale;
      const rearFlipperWidth = 0.15 * scale;
      
      // Base point at attachment
      rearFlipperShape.moveTo(0, 0);
      
      // Create triangular rear flipper with slight curve
      rearFlipperShape.bezierCurveTo(
        rearFlipperWidth * 0.5, rearFlipperLength * 0.4,  // Control point 1
        rearFlipperWidth * 0.7, rearFlipperLength * 0.7,  // Control point 2
        rearFlipperWidth * 0.3, rearFlipperLength         // End point
      );
      
      // Curve back to complete the shape
      rearFlipperShape.bezierCurveTo(
        rearFlipperWidth * 0.2, rearFlipperLength * 0.9,  // Control point 1
        rearFlipperWidth * 0.1, rearFlipperLength * 0.3,  // Control point 2
        0, 0                                              // End point (back to origin)
      );
      
      // Verify shape is closed and valid
      if (rearFlipperShape.curves.length === 0) {
        throw new Error("Failed to create valid rear flipper shape");
      }
      
      // Extrude the rear flipper shape with safer settings
      const rearFlipperExtrudeSettings = {
        steps: 1,
        depth: 0.03 * scale,
        bevelEnabled: true,
        bevelThickness: 0.015 * scale,
        bevelSize: 0.015 * scale,
        bevelSegments: 2
      };
      
      // Create extrude geometry with error handling
      let rearFlipperGeom: THREE.ExtrudeGeometry;
      try {
        rearFlipperGeom = new THREE.ExtrudeGeometry(
          rearFlipperShape, 
          rearFlipperExtrudeSettings
        );
        
        // IMPORTANT: Compute normals after creation
        rearFlipperGeom.computeVertexNormals();
        
        // Check for NaN values in geometry
        const positions = rearFlipperGeom.getAttribute('position');
        let hasNaN = false;
        
        for (let i = 0; i < positions.count; i++) {
          if (isNaN(positions.getX(i)) || isNaN(positions.getY(i)) || isNaN(positions.getZ(i))) {
            positions.setXYZ(i, 0, 0, 0); // Reset NaN to origin
            hasNaN = true;
          }
        }
        
        if (hasNaN) {
          console.warn("SeaTurtleAsset: Fixed NaN values in rear flipper geometry");
          positions.needsUpdate = true;
          rearFlipperGeom.computeVertexNormals(); // Recompute after fixing
        }
      } catch (error) {
        console.error("Error creating rear flipper geometry:", error);
        // Fallback to simple geometry if extrude fails
        rearFlipperGeom = new THREE.BoxGeometry(
          rearFlipperWidth, rearFlipperLength, 0.03 * scale
        );
        console.warn("SeaTurtleAsset: Using fallback BoxGeometry for rear flippers");
      }
      
      // Rear left flipper
      const rearLeftFlipper = new THREE.Mesh(rearFlipperGeom, flipperMaterial.clone());
      rearLeftFlipper.position.set(0.35 * scale, 0, 0.5 * scale);
      rearLeftFlipper.rotation.set(Math.PI / 2, 0, -Math.PI / 6); // Angle slightly inward
      rearLeftFlipper.name = "RearLeftFlipper";
      rearLeftFlipper.castShadow = true;
      rearLeftFlipper.receiveShadow = true;
      flippers.push(rearLeftFlipper);
      
      // Rear right flipper (mirrored)
      const rearRightFlipper = new THREE.Mesh(rearFlipperGeom, flipperMaterial.clone());
      rearRightFlipper.position.set(-0.35 * scale, 0, 0.5 * scale);
      rearRightFlipper.rotation.set(Math.PI / 2, 0, Math.PI / 6); // Angle slightly inward
      rearRightFlipper.scale.set(-1, 1, 1); // Mirror by scaling X
      rearRightFlipper.name = "RearRightFlipper";
      rearRightFlipper.castShadow = true;
      rearRightFlipper.receiveShadow = true;
      flippers.push(rearRightFlipper);
      
    } catch (error) {
      console.error("SeaTurtleAsset: Error creating flippers:", error);
      
      // Create super simple fallback flippers in case of catastrophic error
      const fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0x556B2F,
        roughness: 0.7,
        metalness: 0.1
      });
      
      // Simple front flippers (just boxes)
      const frontLeftFlipper = new THREE.Mesh(
        new THREE.BoxGeometry(0.2 * scale, 0.5 * scale, 0.05 * scale),
        fallbackMaterial
      );
      frontLeftFlipper.position.set(0.45 * scale, 0.1 * scale, -0.3 * scale);
      frontLeftFlipper.rotation.set(Math.PI / 2, 0, Math.PI / 4);
      frontLeftFlipper.name = "FrontLeftFlipperFallback";
      flippers.push(frontLeftFlipper);
      
      const frontRightFlipper = frontLeftFlipper.clone();
      frontRightFlipper.position.set(-0.45 * scale, 0.1 * scale, -0.3 * scale);
      frontRightFlipper.rotation.set(Math.PI / 2, 0, -Math.PI / 4);
      frontRightFlipper.name = "FrontRightFlipperFallback";
      flippers.push(frontRightFlipper);
      
      // Simple rear flippers
      const rearLeftFlipper = new THREE.Mesh(
        new THREE.BoxGeometry(0.15 * scale, 0.3 * scale, 0.05 * scale),
        fallbackMaterial
      );
      rearLeftFlipper.position.set(0.35 * scale, 0, 0.5 * scale);
      rearLeftFlipper.rotation.set(Math.PI / 2, 0, -Math.PI / 6);
      rearLeftFlipper.name = "RearLeftFlipperFallback";
      flippers.push(rearLeftFlipper);
      
      const rearRightFlipper = rearLeftFlipper.clone();
      rearRightFlipper.position.set(-0.35 * scale, 0, 0.5 * scale);
      rearRightFlipper.rotation.set(Math.PI / 2, 0, Math.PI / 6);
      rearRightFlipper.name = "RearRightFlipperFallback";
      flippers.push(rearRightFlipper);
    }
    
    return flippers;
  }

  /**
   * Add hexagonal pattern to the shell for a realistic turtle shell look
   */
  private addHexagonalPattern(geometry: THREE.BufferGeometry, visualConfig: any): void {
    // Check if geometry is valid
    if (!geometry || !geometry.attributes.position) {
      console.error("SeaTurtleAsset: Invalid geometry in addHexagonalPattern");
      return;
    }

    // Get position attribute
    const positions = geometry.getAttribute('position');
    const count = positions.count;
    const patternColor = new THREE.Color(visualConfig.patternColor || 0x698B69);
    const mainColor = new THREE.Color(visualConfig.mainColor || 0x8FBC8F);
    
    // Check for any NaN values in the position attribute
    let hasNaN = false;
    for (let i = 0; i < positions.count; i++) {
      if (isNaN(positions.getX(i)) || isNaN(positions.getY(i)) || isNaN(positions.getZ(i))) {
        // Replace NaN with 0 to avoid propagation
        positions.setXYZ(i, 
          isNaN(positions.getX(i)) ? 0 : positions.getX(i),
          isNaN(positions.getY(i)) ? 0 : positions.getY(i),
          isNaN(positions.getZ(i)) ? 0 : positions.getZ(i)
        );
        hasNaN = true;
      }
    }
    
    if (hasNaN) {
      console.warn("SeaTurtleAsset: Fixed NaN values in shell geometry positions");
      positions.needsUpdate = true;
    }
    
    // Create colors array for vertex coloring
    const colors = new Float32Array(count * 3);
    
    // Generate noise-based hexagonal pattern using vector3 positions
    for (let i = 0; i < count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Create hexagonal pattern using multiple noise scales
      // Normalize position to use for pattern calculation
      const pos = new THREE.Vector3(x, y, z).normalize();
      
      // Apply pattern based on normalized position
      // Use a mathematical pattern to create hexagon-like shapes
      // This simulates the turtle shell scutes (plates)
      
      // Large scale pattern for main scutes
      const largePattern = Math.abs(Math.sin(pos.x * 5) * Math.sin(pos.z * 5) * Math.sin(pos.y * 5));
      
      // Medium scale pattern for sub-scutes
      const medPattern = Math.abs(Math.sin(pos.x * 15) * Math.sin(pos.z * 15) * Math.sin(pos.y * 15));
      
      // Small scale pattern for texture detail
      const smallPattern = Math.abs(Math.sin(pos.x * 40) * Math.sin(pos.z * 40) * Math.sin(pos.y * 40));
      
      // Combine patterns with different weights
      let pattern = largePattern * 0.7 + medPattern * 0.2 + smallPattern * 0.1;
      
      // Make center of shell lighter, edges darker (add "growth rings" effect)
      const distFromTop = 1.0 - Math.abs(pos.y); // Top of shell (y=1) is lighter
      pattern = Math.min(pattern + distFromTop * 0.3, 1.0);
      
      // Create seams between plates (darker lines)
      const seams = Math.pow(Math.abs(Math.sin(pos.x * 10) * Math.sin(pos.z * 10) * Math.sin(pos.y * 10)), 8);
      const seamFactor = Math.max(0, 1 - seams * 10);
      
      // Create bump mapping effect by adjusting the vertex positions slightly
      // based on pattern - this gives actual 3D texture to the shell
      if (pattern > 0.6) {
        // Only adjust vertices above a threshold to create plates
        // Use safer scaling factor
        const bumpFactor = 0.03 * (pattern - 0.6);
        // Prevent extreme displacements by clamping
        const safeBumpFactor = Math.min(bumpFactor, 0.05);
        
        positions.setX(i, x * (1 + safeBumpFactor)); 
        positions.setY(i, y * (1 + safeBumpFactor));
        positions.setZ(i, z * (1 + safeBumpFactor));
      }
      
      // Blend between main and pattern colors based on the pattern
      const color = new THREE.Color().copy(mainColor).lerp(patternColor, pattern * seamFactor * 0.7);
      
      // Set the color for this vertex
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    // Add color attribute to geometry
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // CRUCIAL: Update position attribute and recompute normals
    geometry.attributes.position.needsUpdate = true;
    
    // Explicitly recompute vertex normals after position changes
    // This is critical for proper lighting after vertex displacement
    geometry.computeVertexNormals();
    
    // Check for NaN values in the normal attribute after computation
    const normals = geometry.getAttribute('normal');
    if (normals) {
      hasNaN = false;
      for (let i = 0; i < normals.count; i++) {
        if (isNaN(normals.getX(i)) || isNaN(normals.getY(i)) || isNaN(normals.getZ(i))) {
          // Replace NaN normals with up vector
          normals.setXYZ(i, 0, 1, 0);
          hasNaN = true;
        }
      }
      
      if (hasNaN) {
        console.warn("SeaTurtleAsset: Fixed NaN values in shell normals");
        normals.needsUpdate = true;
      }
    }
    
    // Enable vertex colors on the material
    const material = (this.shell?.material as THREE.MeshStandardMaterial);
    if (material) {
      material.vertexColors = true;
      material.needsUpdate = true;
    }
    
    console.log("SeaTurtleAsset: Hexagonal pattern applied successfully with normal computation");
  }

  /**
   * Creates a simplified collision mesh for the turtle
   */
  private createCollisionMesh(scale: number): void {
    // Create slightly larger ellipsoid for better collision detection
    const shellRadius = 0.7 * scale;
    const collisionGeom = new THREE.SphereGeometry(
      shellRadius * 1.2, // 20% larger than visible shell
      12, // Lower resolution for collision
      8,
      0, 
      Math.PI * 2, 
      0, 
      Math.PI / 2 // Hemisphere
    );
    
    // Scale similar to the visible shell, but slightly larger
    collisionGeom.scale(1.3, 0.6, 1.1); // Slightly larger than visual shell
    
    const collisionMat = new THREE.MeshBasicMaterial({
      visible: false, // Keep invisible in production
      wireframe: true, // For debugging if made visible
      color: 0xff00ff  // Magenta for debugging
    });
    
    this.collisionMesh = new THREE.Mesh(collisionGeom, collisionMat);
    this.collisionMesh.name = "SeaTurtleCollisionShape";
    this.collisionMesh.rotation.x = -Math.PI / 2; // Lay flat like the shell
    this.collisionMesh.position.y = 0.15 * scale;
    this.mesh.add(this.collisionMesh);
  }

  /**
   * Create fallback mesh in case of errors
   */
  private createFallbackMesh(): THREE.Group {
    // Simple fallback geometry in case the detailed mesh creation fails
    this.mesh = new THREE.Group();
    this.mesh.name = "SeaTurtleObstacleFallback";
    
    const scale = this.config.baseScale || 1.3;
    
    // Use MeshStandardMaterial with appropriate properties
    const shellMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x556B2F, // Olive green
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x111111,
      emissiveIntensity: 0.1
    });
    
    // Simple shell using box geometry
    const shellGeom = new THREE.BoxGeometry(1.2 * scale, 0.4 * scale, 1.0 * scale);
    this.shell = new THREE.Mesh(shellGeom, shellMaterial);
    this.shell.name = "TurtleShellFallback";
    this.shell.visible = true;
    this.mesh.add(this.shell);
    
    // Add a simple head
    const headGeom = new THREE.SphereGeometry(0.2 * scale, 8, 6);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x556B2F, // Match the shell color
      roughness: 0.7, // Slightly rougher than shell
      metalness: 0.05
    });
    const head = new THREE.Mesh(headGeom, headMaterial);
    head.position.set(0, 0.1 * scale, -0.6 * scale);
    head.name = "TurtleHeadFallback";
    head.visible = true;
    this.mesh.add(head);
    this.head = head;
    
    // Add simple flippers
    this.flippers = [];
    for (let i = 0; i < 4; i++) {
      const flipperGeom = new THREE.ConeGeometry(0.15 * scale, 0.4 * scale, 4);
      const flipperMaterial = new THREE.MeshStandardMaterial({
        color: 0x6B8E23, // Slightly lighter than body
        roughness: 0.6,
        metalness: 0.05
      });
      const flipper = new THREE.Mesh(flipperGeom, flipperMaterial);
      
      // Position flippers based on index
      const angle = (i * Math.PI/2) + Math.PI/4;
      const xPos = Math.cos(angle) * 0.4 * scale;
      const zPos = Math.sin(angle) * 0.4 * scale;
      
      flipper.position.set(xPos, 0, zPos);
      flipper.rotation.x = Math.PI/2;
      flipper.rotation.z = -angle;
      flipper.name = `TurtleFlipper${i}Fallback`;
      flipper.visible = true;
      this.mesh.add(flipper);
      this.flippers.push(flipper);
    }
    
    // Simple collision mesh - slightly larger than visual mesh
    this.collisionMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.6 * scale, 8, 6),
      new THREE.MeshBasicMaterial({ visible: false, wireframe: true })
    );
    this.collisionMesh.name = "SeaTurtleCollisionShapeFallback";
    this.mesh.add(this.collisionMesh);
    
    // Use AssetHelpers to set standard userData
    AssetHelpers.setStandardUserData(
      this.mesh,
      'seaTurtle',
      true,  // Always dangerous
      this
    );

    // Add fallback flag
    this.mesh.userData.isFallback = true;
    
    // Ensure all meshes are explicitly visible
    this.mesh.visible = true;
    
    console.warn("Using fallback mesh for SeaTurtleAsset due to error in detailed mesh creation");
    return this.mesh;
  }

  /**
   * Sets the telegraph turn direction for the turtle
   * @param direction Direction to turn ('left', 'right', or 'center' for no turn)
   */
  public setTelegraphTurn(direction: 'left' | 'right' | 'center'): void {
    try {
      const turnAngleRad = THREE.MathUtils.degToRad(this.config.turnAngleDegrees || 25);
      if (direction === 'left') {
        this.targetTurnAngle = turnAngleRad;
      } else if (direction === 'right') {
        this.targetTurnAngle = -turnAngleRad;
      } else {
        this.targetTurnAngle = 0;
      }
    } catch (error) {
      console.warn("Error in setTelegraphTurn:", error);
      this.targetTurnAngle = 0; // Reset to neutral on error
    }
  }
  
  /**
   * Updates the turtle's animation
   * @param deltaTime Time in seconds since last update
   */
  public updateAnimation(deltaTime: number): void {
    try {
      this.animationTime += deltaTime;
      const config = this.config;
      
      // Smoothly interpolate turn angle for telegraphing
      if (Math.abs(this.mesh.rotation.y - this.targetTurnAngle) > 0.01) {
        const turnStep = this.turnTransitionSpeed * deltaTime;
        if (this.mesh.rotation.y < this.targetTurnAngle) {
          this.mesh.rotation.y = Math.min(this.mesh.rotation.y + turnStep, this.targetTurnAngle);
        } else {
          this.mesh.rotation.y = Math.max(this.mesh.rotation.y - turnStep, this.targetTurnAngle);
        }
      }

      // Animate flippers with a swimming motion
      const flipperWaveSpeed = config.flipperWaveSpeed || 1.2;
      
      this.flippers.forEach((flipper, index) => {
        // Different timing for each flipper for a more natural swimming motion
        const phaseOffset = index * Math.PI / 2;
        const flippingFrequency = flipperWaveSpeed * 2; // Flips per second
        const flippingAmplitude = 0.4; // Maximum rotation angle
        
        // Front flippers have more pronounced motion
        const isFront = flipper.name.includes("Front");
        const flipAmplitudeMultiplier = isFront ? 1.2 : 0.7;
        
        // Create a simple sinusoidal motion for the flippers
        const angle = Math.sin(this.animationTime * flippingFrequency + phaseOffset) 
          * flippingAmplitude * flipAmplitudeMultiplier;
        
        // Apply the rotation - improved with multiple axes of rotation
        if (isFront) {
          // Front flippers rotate on X axis (up/down)
          flipper.rotation.x = angle + Math.PI / 2; // Add offset since base rotation is PI/2
          
          // Add slight rotations on other axes for more natural movement
          flipper.rotation.z = Math.sin(this.animationTime * 1.5 + phaseOffset) * 0.1;
        } else {
          // Rear flippers rotate on X axis (up/down) with less motion
          flipper.rotation.x = angle * 0.7 + Math.PI / 2;
        }
      });
      
      // Add head bobbing animation
      if (this.head) {
        const headBobSpeed = config.headBobSpeed || 0.3;
        const headBobAmount = 0.05;
        
        // Subtle up/down head movement
        this.head.position.y = 0.22 * (config.baseScale || 1.3) + 
          Math.sin(this.animationTime * headBobSpeed) * headBobAmount;
        
        // Subtle side-to-side head movement based on turning
        this.head.rotation.z = Math.sin(this.animationTime * 0.7) * 0.03; 
      }
      
      // Subtle shell animation for breathing effect
      if (this.shell) {
        const breatheFrequency = 0.5; // Breaths per second
        const breatheAmplitude = 0.02; // Very subtle
        
        // Scale the shell slightly to simulate breathing
        const breatheFactor = 1 + Math.sin(this.animationTime * breatheFrequency) * breatheAmplitude;
        this.shell.scale.set(1, breatheFactor, 1);
      }
    } catch (error) {
      console.warn("Error in updateAnimation:", error);
      // Animation errors are not critical, can continue
    }
  }

  /**
   * Returns the main turtle mesh
   * Creates it if it doesn't exist yet
   * With improved visibility enforcement
   */
  public getMesh(): THREE.Group {
    if (!this.mesh) {
      this._createMesh();
    }
    
    // Enhanced visibility enforcement for Sea Turtle
    if (this.mesh) {
      // Use standard visibility enforcement
      AssetHelpers.ensureVisibility(this.mesh);
      
      // Additional explicit visibility checks for all critical parts
      // This is extra enforcement above the standard AssetHelpers
      this.mesh.visible = true;
      
      if (this.shell) {
        this.shell.visible = true;
        
        // Ensure shell material is visible
        if (this.shell.material instanceof THREE.Material) {
          this.shell.material.visible = true;
          this.shell.material.needsUpdate = true;
        } else if (Array.isArray(this.shell.material)) {
          this.shell.material.forEach(mat => {
            if (mat) {
              mat.visible = true;
              mat.needsUpdate = true;
            }
          });
        }
      }
      
      if (this.head) {
        this.head.visible = true;
        
        // Ensure head and its children are visible if it's a group
        if (this.head instanceof THREE.Group) {
          this.head.children.forEach(child => {
            if (child instanceof THREE.Mesh && !child.name.includes("Collision")) {
              child.visible = true;
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    if (mat) {
                      mat.visible = true;
                      mat.needsUpdate = true;
                    }
                  });
                } else {
                  child.material.visible = true;
                  child.material.needsUpdate = true;
                }
              }
            }
          });
        }
      }
      
      // Ensure all flippers are visible
      this.flippers.forEach(flipper => {
        flipper.visible = true;
        if (flipper.material) {
          if (Array.isArray(flipper.material)) {
            flipper.material.forEach(mat => {
              if (mat) {
                mat.visible = true;
                mat.needsUpdate = true;
              }
            });
          } else {
            flipper.material.visible = true;
            flipper.material.needsUpdate = true;
          }
        }
      });
      
      console.log("SeaTurtleAsset: Applied aggressive visibility enforcement to turtle mesh and all components");
    }
    
    return this.mesh;
  }
  
  /**
   * Creates and returns a new mesh
   * This matches the interface pattern used by other obstacle types
   */
  public createMesh(): THREE.Group {
    // Create a new mesh instance
    this._createMesh();
    
    // Use AssetHelpers to ensure visibility
    AssetHelpers.ensureVisibility(this.mesh);
    
    console.log("SeaTurtleAsset.createMesh(): Created new mesh with visibility enforced");
    return this.mesh;
  }

  /**
   * Returns the collision object for this asset
   * Always returns a valid mesh, even in error cases
   */
  public getCollisionObject(): THREE.Object3D {
    if (!this.collisionMesh) {
      // Create an emergency fallback collision mesh if needed
      console.warn("SeaTurtleAsset: Creating emergency collision mesh");
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ visible: false });
      this.collisionMesh = new THREE.Mesh(geometry, material);
      this.collisionMesh.name = "SeaTurtleEmergencyCollisionBox";
      
      // Ensure it has a valid bounding sphere
      if (!geometry.boundingSphere) {
        geometry.computeBoundingSphere();
      }
      
      // If still NaN, create a default sphere
      if (!geometry.boundingSphere || 
          isNaN(geometry.boundingSphere.radius) || 
          isNaN(geometry.boundingSphere.center.x) ||
          isNaN(geometry.boundingSphere.center.y) ||
          isNaN(geometry.boundingSphere.center.z)) {
        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
      }
      
      // Add to mesh if it exists
      if (this.mesh) {
        this.mesh.add(this.collisionMesh);
      }
    }
    return this.collisionMesh;
  }

  /**
   * Determines if the turtle is dangerous (always true)
   */
  public isDangerous(): boolean {
    return true; // Sea Turtle is always a solid obstacle
  }

  /**
   * Resets the turtle to its initial state
   */
  public reset(): void {
    try {
      this.animationTime = 0;
      this.targetTurnAngle = 0;
      
      if (this.mesh) {
        this.mesh.rotation.y = 0;
      }
      
      // Reset flipper animations
      this.flippers.forEach(flipper => {
        const isFront = flipper.name.includes("Front");
        flipper.rotation.z = 0;
        flipper.rotation.x = isFront ? Math.PI / 2 : Math.PI / 2; // Default rotation
      });
      
      // Reset head position
      if (this.head) {
        this.head.position.y = 0.22 * (this.config.baseScale || 1.3);
        this.head.rotation.z = 0;
      }
      
      // Reset shell scale
      if (this.shell) {
        this.shell.scale.set(1, 1, 1);
      }
    } catch (error) {
      console.warn("Error in reset:", error);
    }
  }

  /**
   * Disposes of resources used by this asset
   */
  public dispose(): void {
    try {
      if (this.mesh) {
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
      }
    } catch (error) {
      console.warn("Error disposing SeaTurtleAsset resources:", error);
    }
  }
}
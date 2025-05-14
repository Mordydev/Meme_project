import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { SeaTurtleConfig } from '../../config/gameConfig';

export class SeaTurtleAsset {
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

  private createMesh(): void {
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
   */
  private createShell(scale: number, visualConfig: any): THREE.Mesh {
    // Create material
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: visualConfig.mainColor || 0x8FBC8F,
      roughness: visualConfig.roughness || 0.5,
      metalness: visualConfig.metalness || 0.1,
      clearcoat: visualConfig.clearcoat || 0.3,
      clearcoatRoughness: visualConfig.clearcoatRoughness || 0.3
    });

    // Base shell shape - flattened ellipsoid
    const shellRadius = 0.7 * scale;
    const shellGeom = new THREE.SphereGeometry(
      shellRadius, 
      32, // Higher resolution
      24,
      0, 
      Math.PI * 2, 
      0, 
      Math.PI / 2 // Hemisphere
    );
    shellGeom.scale(1.2, 0.5, 1.0); // Flatten and elongate

    // Create hexagonal pattern on shell
    this.addHexagonalPattern(shellGeom, visualConfig);
    
    // Create shell with modified geometry
    const shell = new THREE.Mesh(shellGeom, shellMaterial);
    shell.rotation.x = -Math.PI / 2; // Lay flat
    shell.position.y = 0.15 * scale; // Slightly above center
    
    return shell;
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
   */
  private createFlippers(scale: number, visualConfig: any): THREE.Mesh[] {
    const flippers: THREE.Mesh[] = [];
    
    // Flipper material
    const flipperMaterial = new THREE.MeshStandardMaterial({
      color: visualConfig.mainColor || 0x556B2F,
      roughness: visualConfig.roughness || 0.6,
      metalness: visualConfig.metalness || 0.05,
      side: THREE.DoubleSide // Render both sides
    });
    
    // Front flippers (longer, for swimming)
    
    // Create front flipper shape using curves for a more organic look
    const frontFlipperShape = new THREE.Shape();
    const frontFlipperLength = 0.6 * scale;
    const frontFlipperWidth = 0.2 * scale;
    
    // Base point at attachment
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
      0, 0                                               // End point (back to origin)
    );
    
    // Extrude the shape to create a 3D flipper
    const frontFlipperExtrudeSettings = {
      steps: 1,
      depth: 0.05 * scale,
      bevelEnabled: true,
      bevelThickness: 0.02 * scale,
      bevelSize: 0.02 * scale,
      bevelSegments: 3
    };
    
    const frontFlipperGeom = new THREE.ExtrudeGeometry(
      frontFlipperShape, 
      frontFlipperExtrudeSettings
    );
    
    // Front left flipper
    const frontLeftFlipper = new THREE.Mesh(frontFlipperGeom, flipperMaterial);
    frontLeftFlipper.position.set(0.45 * scale, 0.1 * scale, -0.3 * scale);
    frontLeftFlipper.rotation.set(Math.PI / 2, 0, Math.PI / 4); // Angle outward
    frontLeftFlipper.name = "FrontLeftFlipper";
    flippers.push(frontLeftFlipper);
    
    // Front right flipper (mirrored)
    const frontRightFlipper = new THREE.Mesh(frontFlipperGeom, flipperMaterial);
    frontRightFlipper.position.set(-0.45 * scale, 0.1 * scale, -0.3 * scale);
    frontRightFlipper.rotation.set(Math.PI / 2, 0, -Math.PI / 4); // Angle outward with mirroring
    frontRightFlipper.scale.set(-1, 1, 1); // Mirror by scaling X
    frontRightFlipper.name = "FrontRightFlipper";
    flippers.push(frontRightFlipper);
    
    // Rear flippers (smaller, different shape)
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
      0, 0                                             // End point (back to origin)
    );
    
    // Extrude the rear flipper shape (thinner than front)
    const rearFlipperExtrudeSettings = {
      steps: 1,
      depth: 0.03 * scale,
      bevelEnabled: true,
      bevelThickness: 0.015 * scale,
      bevelSize: 0.015 * scale,
      bevelSegments: 2
    };
    
    const rearFlipperGeom = new THREE.ExtrudeGeometry(
      rearFlipperShape, 
      rearFlipperExtrudeSettings
    );
    
    // Rear left flipper
    const rearLeftFlipper = new THREE.Mesh(rearFlipperGeom, flipperMaterial);
    rearLeftFlipper.position.set(0.35 * scale, 0, 0.5 * scale);
    rearLeftFlipper.rotation.set(Math.PI / 2, 0, -Math.PI / 6); // Angle slightly inward
    rearLeftFlipper.name = "RearLeftFlipper";
    flippers.push(rearLeftFlipper);
    
    // Rear right flipper (mirrored)
    const rearRightFlipper = new THREE.Mesh(rearFlipperGeom, flipperMaterial);
    rearRightFlipper.position.set(-0.35 * scale, 0, 0.5 * scale);
    rearRightFlipper.rotation.set(Math.PI / 2, 0, Math.PI / 6); // Angle slightly inward
    rearRightFlipper.scale.set(-1, 1, 1); // Mirror by scaling X
    rearRightFlipper.name = "RearRightFlipper";
    flippers.push(rearRightFlipper);
    
    return flippers;
  }

  /**
   * Add hexagonal pattern to the shell for a realistic turtle shell look
   */
  private addHexagonalPattern(geometry: THREE.BufferGeometry, visualConfig: any): void {
    const positions = geometry.getAttribute('position');
    const count = positions.count;
    const patternColor = new THREE.Color(visualConfig.patternColor || 0x698B69);
    const mainColor = new THREE.Color(visualConfig.mainColor || 0x8FBC8F);
    
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
        positions.setX(i, x * (1 + 0.03 * (pattern - 0.6))); 
        positions.setY(i, y * (1 + 0.03 * (pattern - 0.6)));
        positions.setZ(i, z * (1 + 0.03 * (pattern - 0.6)));
      }
      
      // Blend between main and pattern colors based on the pattern
      const color = new THREE.Color().copy(mainColor).lerp(patternColor, pattern * seamFactor * 0.7);
      
      // Set the color for this vertex
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    // Update the geometry with new positions (for the 3D texture effect)
    geometry.setAttribute('position', positions);
    
    // Add color attribute to geometry
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Enable vertex colors on the material
    const material = (this.shell?.material as THREE.MeshStandardMaterial);
    if (material) {
      material.vertexColors = true;
    }
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
  private createFallbackMesh(): void {
    // Simple fallback geometry in case the detailed mesh creation fails
    this.mesh = new THREE.Group();
    this.mesh.name = "SeaTurtleObstacleFallback";
    
    const scale = this.config.baseScale || 1.3;
    
    // Simple shell using box geometry
    const shellGeom = new THREE.BoxGeometry(1.2 * scale, 0.4 * scale, 1.0 * scale);
    const shellMaterial = new THREE.MeshStandardMaterial({ color: 0x8FBC8F });
    this.shell = new THREE.Mesh(shellGeom, shellMaterial);
    this.mesh.add(this.shell);
    
    // Simple collision mesh
    this.collisionMesh = new THREE.Mesh(
      shellGeom.clone(),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.collisionMesh.name = "SeaTurtleCollisionShapeFallback";
    this.mesh.add(this.collisionMesh);
    
    // Set userData for identification
    this.mesh.userData = { 
      type: 'obstacle', 
      name: 'seaTurtle', 
      assetInstance: this,
      isDangerous: true
    };
    
    console.warn("Using fallback mesh for SeaTurtleAsset due to error in detailed mesh creation");
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
        if (child instanceof THREE.Mesh && child.name !== "SeaTurtleCollisionShape") {
          child.visible = true;
        }
      });
      
      console.log("SeaTurtleAsset: Ensured visibility of turtle mesh and children");
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
      this.mesh.rotation.y = 0;
      
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
      console.warn("Error disposing SeaTurtleAsset resources:", error);
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
        
        // Ensure all parts are visible
        this.mesh.visible = true;
        this.mesh.traverse(child => {
          if (child instanceof THREE.Mesh && !child.name.includes("Collision")) {
            child.visible = true;
          }
        });
        
        console.log("SeaTurtleAsset: Created new mesh with visibility enforced");
      }
      return this.mesh;
    } catch (error) {
      console.error("Error in SeaTurtleAsset.createMesh():", error);
      return this.createFallbackMesh();
    }
  }
}
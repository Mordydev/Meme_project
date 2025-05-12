import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { SeaTurtleConfig } from '../../config/gameConfig';

export class SeaTurtleAsset {
  private shaderManager: ShaderManager;
  private mesh!: THREE.Group; // Main group for all turtle parts
  private collisionMesh!: THREE.Mesh; // Simplified collision shape (primarily the shell)
  private flippers: THREE.Mesh[] = []; // Store references to flippers for animation
  
  private animationTime: number = 0;
  private targetTurnAngle: number = 0; // For telegraphing, in radians
  private turnTransitionSpeed: number = Math.PI / 2; // Radians per second for turn animation

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    this.createMesh();
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
      turnAngleDegrees: 25
    };

    try {
      return configSystem.getObstaclesConfig().seaTurtle || defaultConfig;
    } catch (error) {
      console.warn("SeaTurtleAsset: Could not get sea turtle config, using defaults", error);
      return defaultConfig;
    }
  }

  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "SeaTurtleObstacle";
    const scale = this.config.baseScale;

    const shellMaterial = this.shaderManager.getMaterial('obstacle_seaturtle_shell') ||
      new THREE.MeshPhongMaterial({ color: 0x8FBC8F }); // Dark sea green
    const skinMaterial = this.shaderManager.getMaterial('obstacle_seaturtle_skin') ||
      new THREE.MeshPhongMaterial({ color: 0x556B2F }); // Dark olive green

    // Shell (flattened sphere)
    const shellRadius = 0.7 * scale;
    const shellGeom = new THREE.SphereGeometry(shellRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2); // Hemisphere
    shellGeom.scale(1, 0.5, 0.8); // Flatten and elongate
    const shell = new THREE.Mesh(shellGeom, shellMaterial);
    shell.rotation.x = -Math.PI / 2; // Lay flat
    shell.position.y = 0.1 * scale; // Slightly above center
    this.mesh.add(shell);

    // Head
    const headRadius = 0.25 * scale;
    const headGeom = new THREE.SphereGeometry(headRadius, 12, 8);
    const head = new THREE.Mesh(headGeom, skinMaterial);
    head.position.set(0, 0.15 * scale, -shellRadius * 0.7); // Front of shell
    this.mesh.add(head);

    // Flippers - we'll store references to these for animation
    this.flippers = this.createFlippers(scale, skinMaterial);
    this.flippers.forEach(flipper => this.mesh.add(flipper));
    
    // Simplified Collision Mesh based on shell
    const collisionGeom = shellGeom.clone();
    // Slightly larger for better collision detection
    collisionGeom.scale(1.1, 1.1, 1.1);
    const collisionMat = new THREE.MeshBasicMaterial({
      visible: false,
      wireframe: true, 
      color: 0xff00ff
    });
    this.collisionMesh = new THREE.Mesh(collisionGeom, collisionMat);
    this.collisionMesh.name = "SeaTurtleCollisionShape";
    this.collisionMesh.rotation.x = -Math.PI / 2;
    this.collisionMesh.position.y = 0.1 * scale;
    this.mesh.add(this.collisionMesh);

    // Set userData
    this.mesh.userData = { 
      type: 'obstacle', 
      name: 'seaTurtle', 
      assetInstance: this,
      isDangerous: true
    };
  }

  /**
   * Creates the turtle's flippers
   */
  private createFlippers(scale: number, material: THREE.Material): THREE.Mesh[] {
    const flippers: THREE.Mesh[] = [];
    
    // Front flippers (longer, for swimming)
    const frontFlipperLength = 0.6 * scale;
    const frontFlipperWidth = 0.25 * scale;
    const frontFlipperThickness = 0.05 * scale;
    const frontFlipperGeom = new THREE.BoxGeometry(frontFlipperWidth, frontFlipperThickness, frontFlipperLength);
    
    // Front left flipper
    const frontLeftFlipper = new THREE.Mesh(frontFlipperGeom, material);
    frontLeftFlipper.position.set(0.4 * scale, 0.05 * scale, -0.3 * scale);
    frontLeftFlipper.rotation.y = Math.PI / 4; // Angled outward
    frontLeftFlipper.name = "FrontLeftFlipper";
    flippers.push(frontLeftFlipper);
    
    // Front right flipper
    const frontRightFlipper = new THREE.Mesh(frontFlipperGeom, material);
    frontRightFlipper.position.set(-0.4 * scale, 0.05 * scale, -0.3 * scale);
    frontRightFlipper.rotation.y = -Math.PI / 4; // Angled outward
    frontRightFlipper.name = "FrontRightFlipper";
    flippers.push(frontRightFlipper);
    
    // Rear flippers (smaller)
    const rearFlipperLength = 0.4 * scale;
    const rearFlipperWidth = 0.18 * scale;
    const rearFlipperGeom = new THREE.BoxGeometry(rearFlipperWidth, frontFlipperThickness, rearFlipperLength);
    
    // Rear left flipper
    const rearLeftFlipper = new THREE.Mesh(rearFlipperGeom, material);
    rearLeftFlipper.position.set(0.3 * scale, 0, 0.4 * scale);
    rearLeftFlipper.rotation.y = -Math.PI / 6; // Angled inward
    rearLeftFlipper.name = "RearLeftFlipper";
    flippers.push(rearLeftFlipper);
    
    // Rear right flipper
    const rearRightFlipper = new THREE.Mesh(rearFlipperGeom, material);
    rearRightFlipper.position.set(-0.3 * scale, 0, 0.4 * scale);
    rearRightFlipper.rotation.y = Math.PI / 6; // Angled inward
    rearRightFlipper.name = "RearRightFlipper";
    flippers.push(rearRightFlipper);
    
    return flippers;
  }

  /**
   * Sets the telegraph turn direction for the turtle
   * @param direction Direction to turn ('left', 'right', or 'center' for no turn)
   */
  public setTelegraphTurn(direction: 'left' | 'right' | 'center'): void {
    const turnAngleRad = THREE.MathUtils.degToRad(this.config.turnAngleDegrees);
    if (direction === 'left') {
      this.targetTurnAngle = turnAngleRad;
    } else if (direction === 'right') {
      this.targetTurnAngle = -turnAngleRad;
    } else {
      this.targetTurnAngle = 0;
    }
  }
  
  /**
   * Updates the turtle's animation
   * @param deltaTime Time in seconds since last update
   */
  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;

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
    this.flippers.forEach((flipper, index) => {
      // Different timing for each flipper for a more natural swimming motion
      const phaseOffset = index * Math.PI / 2;
      const flippingFrequency = 2; // Flips per second
      const flippingAmplitude = 0.4; // Maximum rotation angle
      
      // Front flippers have more pronounced motion
      const isFront = flipper.name.includes("Front");
      const flipAmplitudeMultiplier = isFront ? 1.0 : 0.6;
      
      // Create a simple sinusoidal motion for the flippers
      const angle = Math.sin(this.animationTime * flippingFrequency + phaseOffset) 
        * flippingAmplitude * flipAmplitudeMultiplier;
      
      // Apply the rotation
      flipper.rotation.z = angle;
    });
  }

  /**
   * Returns the main turtle mesh
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
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
    this.animationTime = 0;
    this.targetTurnAngle = 0;
    this.mesh.rotation.y = 0;
    
    // Reset flipper animations
    this.flippers.forEach(flipper => {
      flipper.rotation.z = 0;
    });
  }

  /**
   * Disposes of resources used by this asset
   */
  public dispose(): void {
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
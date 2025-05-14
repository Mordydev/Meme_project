import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { PufferfishConfig } from '../../config/gameConfig';

// More formal state machine for better code readability
export enum PufferfishState {
  DEFLATED,
  INFLATING,
  INFLATED,
  DEFLATING
}

export class PufferfishAsset {
  public mesh!: THREE.Group;
  private collisionSphere!: THREE.Mesh;
  
  // Track inflation state using the state enum
  private currentState: PufferfishState = PufferfishState.DEFLATED;
  private inflationState: number = 0; // 0 to 1 (fully inflated)
  private inflationCooldownTimer: number = 0;

  // Store references to parts that need animation
  private body!: THREE.Mesh;
  private spikes!: THREE.Group;
  private leftEye!: THREE.Group;
  private rightEye!: THREE.Group;
  private mouth!: THREE.Mesh;
  private fins: THREE.Mesh[] = [];
  private tail!: THREE.Mesh;

  constructor(shaderManager?: ShaderManager) {
    // We accept shaderManager parameter for backward compatibility
    // but we don't use it in our implementation
  }

  public createMesh(): THREE.Group {
    try {
      // Initialize the top-level group
      this.mesh = new THREE.Group();
      this.mesh.name = "PufferfishObstacle_StdMat";

      // Get pufferfish config
      const config = this.config;
      const visualConf = config?.visuals || {};
      const spineVisualConf = config?.spineVisuals || visualConf;
      
      // Create the body with enhanced geometry and StandardMaterial
      this.createBody(config.baseRadius, visualConf);
      
      // Create spikes with enhanced geometry
      this.createSpikes(config.baseRadius, spineVisualConf);
      this.mesh.add(this.spikes);
      
      // Create eyes with StandardMaterial
      const eyeSize = config.baseRadius * 0.2;
      const eyePositionFactor = config.baseRadius * 0.7;
      
      // Left eye
      this.leftEye = this.createEye(eyeSize);
      this.leftEye.position.set(
        -eyePositionFactor * 0.7, 
        eyePositionFactor * 0.5, 
        -eyePositionFactor * 0.9
      );
      this.mesh.add(this.leftEye);
      
      // Right eye
      this.rightEye = this.createEye(eyeSize);
      this.rightEye.position.set(
        eyePositionFactor * 0.7, 
        eyePositionFactor * 0.5, 
        -eyePositionFactor * 0.9
      );
      this.mesh.add(this.rightEye);
      
      // Create a small mouth with enhanced geometry
      this.mouth = this.createMouth(config.baseRadius * 0.3);
      this.mouth.position.set(0, -eyePositionFactor * 0.3, -eyePositionFactor * 0.9);
      this.mouth.rotation.x = Math.PI / 6; // Slight downward angle
      this.mesh.add(this.mouth);

      // Create fins with StandardMaterial
      this.fins = [];
      
      // Top fin
      const topFin = this.createFin(config.baseRadius * 0.5, visualConf);
      topFin.position.set(0, config.baseRadius * 0.7, 0);
      topFin.rotation.z = Math.PI / 2;
      this.fins.push(topFin);
      this.mesh.add(topFin);

      // Left fin
      const leftFin = this.createFin(config.baseRadius * 0.4, visualConf);
      leftFin.position.set(-config.baseRadius * 0.8, 0, config.baseRadius * 0.2);
      leftFin.rotation.y = Math.PI / 4;
      this.fins.push(leftFin);
      this.mesh.add(leftFin);

      // Right fin
      const rightFin = this.createFin(config.baseRadius * 0.4, visualConf);
      rightFin.position.set(config.baseRadius * 0.8, 0, config.baseRadius * 0.2);
      rightFin.rotation.y = -Math.PI / 4;
      this.fins.push(rightFin);
      this.mesh.add(rightFin);

      // Create tail with StandardMaterial
      this.tail = this.createTail(config.baseRadius * 0.5, visualConf);
      this.tail.position.set(0, 0, config.baseRadius * 0.9);
      this.mesh.add(this.tail);

      // Create collision sphere
      this.createCollisionSphere(config.baseRadius);
      
      // Set userData for the mesh
      this.mesh.userData = { 
        type: 'obstacle', 
        name: 'pufferfish',
        assetInstance: this,
        isDangerous: this.isDangerous(),
        // Store state info in userData for easier access in update loops
        inflationState: this.inflationState,
        isInflated: this.getIsInflated(),
        detectionRadius: config.detectionRadius
      };
      
      return this.mesh;
    } catch (error) {
      console.error("PufferfishAsset: Error creating mesh:", error);
      this.createMinimalFallback();
      return this.mesh;
    }
  }
  
  /**
   * Creates the body with enhanced geometry and StandardMaterial
   */
  private createBody(radius: number, visualConf: any): void {
    // Create more detailed sphere for the body
    const bodyGeometry = new THREE.SphereGeometry(
      radius,  // Base radius
      32,      // Width segments (increased for smoother appearance)
      24       // Height segments (increased for smoother appearance)
    );
    
    // Apply some noise to the geometry to make it less perfectly spherical
    this.applyNoiseToGeometry(bodyGeometry, radius * 0.05);
    
    // Create StandardMaterial with properties from config
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xFFA500),
      emissive: new THREE.Color(visualConf.emissiveColor || 0xCC8400),
      emissiveIntensity: visualConf.emissiveIntensity || 0.1,
      roughness: visualConf.roughness || 0.5,
      metalness: visualConf.metalness || 0.1
    });
    
    // Create and add the body mesh
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.name = "PufferfishBody";
    this.mesh.add(this.body);
  }
  
  /**
   * Creates a collision sphere for the pufferfish
   */
  private createCollisionSphere(radius: number): void {
    // Create slightly larger collision sphere than visual size
    const collisionRadius = radius * 1.2;
    const collisionGeometry = new THREE.SphereGeometry(collisionRadius, 8, 8);
    const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
    
    this.collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.collisionSphere.name = "PufferfishCollisionSphere";
    this.mesh.add(this.collisionSphere);
  }
  
  /**
   * Creates a minimal fallback pufferfish in case of errors
   */
  private createMinimalFallback(): void {
    console.warn("PufferfishAsset: Creating minimal fallback model");
    
    // Create a simple group
    this.mesh = new THREE.Group();
    this.mesh.name = "PufferfishFallback";
    
    // Create simple body
    const bodyGeometry = new THREE.SphereGeometry(0.35, 16, 8);
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFA500,
      wireframe: false
    });
    
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.add(this.body);
    
    // Create simple spikes group (empty for now)
    this.spikes = new THREE.Group();
    this.mesh.add(this.spikes);
    
    // Create collision sphere
    const collisionGeometry = new THREE.SphereGeometry(0.4, 8, 6);
    const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
    
    this.collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.mesh.add(this.collisionSphere);
    
    // Set userData for identification
    this.mesh.userData = { 
      type: 'obstacle', 
      name: 'pufferfish',
      assetInstance: this,
      isDangerous: false
    };
  }
  
  /**
   * Applies noise to a geometry to make it less perfect and more organic
   */
  private applyNoiseToGeometry(geometry: THREE.BufferGeometry, amount: number): void {
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Apply random displacement to each vertex
      positions[i] += (Math.random() - 0.5) * amount;
      positions[i + 1] += (Math.random() - 0.5) * amount;
      positions[i + 2] += (Math.random() - 0.5) * amount;
    }
    
    // Update geometry
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  private createEye(size: number): THREE.Group {
    const eyeGroup = new THREE.Group();
    eyeGroup.name = "PufferfishEye";
    
    // White part (sclera) with StandardMaterial
    const eyeWhiteGeometry = new THREE.SphereGeometry(size, 12, 10);
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      roughness: 0.2,
      metalness: 0.1
    });
    
    const eyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    eyeWhite.name = "EyeWhite";
    eyeGroup.add(eyeWhite);
    
    // Black part (pupil) with StandardMaterial
    const pupilGeometry = new THREE.SphereGeometry(size * 0.5, 12, 10);
    const pupilMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.3,
      metalness: 0.1
    });
    
    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil.name = "Pupil";
    pupil.position.z = -size * 0.6;
    eyeGroup.add(pupil);
    
    // Add highlight (small white dot)
    const highlightGeometry = new THREE.SphereGeometry(size * 0.15, 8, 6);
    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.5
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.name = "EyeHighlight";
    highlight.position.set(size * 0.15, size * 0.15, -size * 0.3);
    eyeGroup.add(highlight);
    
    return eyeGroup;
  }

  private createMouth(size: number): THREE.Mesh {
    // Create a more detailed curved mouth using TorusGeometry
    const mouthGeometry = new THREE.TorusGeometry(
      size,           // Radius
      size * 0.15,    // Tube radius (slightly thinner for more definition)
      8,              // Radial segments
      16,             // Tubular segments (increased for smoother curve)
      Math.PI         // Arc (half circle)
    );
    
    // Use StandardMaterial for the mouth
    const mouthMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.0
    });
    
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.name = "PufferfishMouth";
    
    return mouth;
  }

  private createFin(size: number, visualConf: any): THREE.Mesh {
    // Create a more detailed fin shape using ShapeGeometry
    const finShape = new THREE.Shape();
    
    // Draw a more organic fin shape with curves
    finShape.moveTo(0, 0);
    finShape.quadraticCurveTo(size * 0.3, size * 0.3, size, size * 0.3);
    finShape.quadraticCurveTo(size * 0.7, size * 0.7, size * 0.5, size);
    finShape.quadraticCurveTo(size * 0.3, size * 0.7, 0, 0);
    
    // Extrude slightly for some thickness
    const extrudeSettings = {
      depth: size * 0.05,
      bevelEnabled: true,
      bevelThickness: size * 0.02,
      bevelSize: size * 0.02,
      bevelSegments: 3
    };
    
    const finGeometry = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
    
    // Use StandardMaterial with the same properties as the body but slightly adjusted
    const finMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(visualConf.mainColor || 0xFFA500).multiplyScalar(1.1), // Slightly lighter
      emissive: new THREE.Color(visualConf.emissiveColor || 0xCC8400).multiplyScalar(0.9),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.1) * 0.8,
      roughness: (visualConf.roughness || 0.5) * 1.1, // Slightly rougher
      metalness: (visualConf.metalness || 0.1) * 0.8, // Slightly less metallic
      side: THREE.DoubleSide
    });
    
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.name = "PufferfishFin";
    
    return fin;
  }

  private createTail(size: number, visualConf: any): THREE.Mesh {
    // Create a more detailed tail shape
    const tailShape = new THREE.Shape();
    
    // Draw a more organic tail shape with curves
    tailShape.moveTo(0, 0);
    tailShape.bezierCurveTo(
      size * 0.3, size * 0.5,   // Control point 1
      size * 0.7, size * 0.7,   // Control point 2
      size, size * 0.2          // End point (top of tail)
    );
    tailShape.bezierCurveTo(
      size * 0.7, 0,           // Control point 1
      size * 0.7, -size * 0.7, // Control point 2
      size, -size * 0.2        // End point (bottom of tail)
    );
    tailShape.bezierCurveTo(
      size * 0.7, -size * 0.5, // Control point 1
      size * 0.3, -size * 0.5, // Control point 2
      0, 0                     // End point (back to start)
    );
    
    // Extrude slightly for some thickness
    const extrudeSettings = {
      depth: size * 0.05,
      bevelEnabled: true,
      bevelThickness: size * 0.02,
      bevelSize: size * 0.02,
      bevelSegments: 3
    };
    
    const tailGeometry = new THREE.ExtrudeGeometry(tailShape, extrudeSettings);
    
    // Use StandardMaterial with the same properties as the body but slightly adjusted
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xFFA500).multiplyScalar(1.1), // Slightly lighter
      emissive: new THREE.Color(visualConf.emissiveColor || 0xCC8400).multiplyScalar(0.9),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.1) * 0.8,
      roughness: (visualConf.roughness || 0.5) * 1.1, // Slightly rougher
      metalness: (visualConf.metalness || 0.1) * 0.8, // Slightly less metallic
      side: THREE.DoubleSide
    });
    
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.name = "PufferfishTail";
    
    return tail;
  }

  private createSpikes(radius: number, visualConf: any): void {
    // Create a group for spikes
    this.spikes = new THREE.Group();
    this.spikes.name = "PufferfishSpikes";
    
    // The number of spikes will depend on the size - increase for more detail
    const numSpikes = Math.floor(radius * 70); // More spikes for denser appearance
    
    // Create StandardMaterial for spikes
    const spikeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xD2691E),
      emissive: new THREE.Color(visualConf.emissiveColor || 0xD2691E).multiplyScalar(0.7),
      emissiveIntensity: visualConf.emissiveIntensity || 0.05,
      roughness: visualConf.roughness || 0.6,
      metalness: visualConf.metalness || 0.05
    });
    
    // Create spikes distributed evenly on the sphere using fibonacci distribution
    for (let i = 0; i < numSpikes; i++) {
      // Use fibonacci sphere distribution for even spacing
      const phi = Math.acos(1 - (2 * i) / numSpikes);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      
      // Convert to cartesian coordinates on the sphere
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // Create a spike with enhanced geometry
      const spikeHeight = radius * 0.35; // 35% of the radius
      
      // Use a cone with more segments for smoother appearance
      const spikeGeometry = new THREE.ConeGeometry(
        radius * 0.04,  // Base radius (slightly narrower)
        spikeHeight,    // Height
        6,              // Radial segments (increased for smoother appearance) 
        2               // Height segments
      );
      
      // Apply slight bend to spikes for more organic look
      this.applyNoiseToGeometry(spikeGeometry, radius * 0.01);
      
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial.clone()); // Clone material for potential individual tweaks
      spike.name = `Spike_${i}`;
      
      // Position at the calculated point
      spike.position.set(x, y, z);
      
      // Orient spike to point outward from center
      const direction = new THREE.Vector3(x, y, z).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(normal, direction);
      spike.setRotationFromQuaternion(quaternion);
      
      // Initial scale to make spikes smaller when not inflated
      spike.scale.set(0.3, 0.3, 0.3);
      
      this.spikes.add(spike);
    }
  }

  /**
   * Updates the pufferfish animation state based on player proximity
   * @param deltaTime Time in seconds since last update
   * @param playerPosition The player's current position (as THREE.Vector3)
   */
  public updateAnimation(deltaTime: number, playerPosition?: any): void {
    // Skip if mesh not initialized
    if (!this.mesh || !this.body || !this.spikes) return;

    const config = this.config;

    // Update cooldown timer if active
    if (this.inflationCooldownTimer > 0) {
      this.inflationCooldownTimer -= deltaTime;
    }

    // Check player proximity (if provided)
    let shouldInflate = false;
    
    if (playerPosition) {
      // Ensure playerPosition is a THREE.Vector3 for distanceTo to work
      let playerPos: THREE.Vector3;
      
      if (playerPosition instanceof THREE.Vector3) {
        playerPos = playerPosition;
      } else if (typeof playerPosition === 'object' && 
                playerPosition.x !== undefined && 
                playerPosition.y !== undefined && 
                playerPosition.z !== undefined) {
        // Create a Vector3 from a position-like object
        playerPos = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
      } else {
        // Default position as fallback if invalid
        playerPos = new THREE.Vector3(0, 0, 0);
        console.warn("PufferfishAsset: Invalid player position provided");
      }
      
      // Calculate distance
      const distanceToPlayer = playerPos.distanceTo(this.mesh.position);
      shouldInflate = distanceToPlayer < config.detectionRadius;
    }

    // Determine inflation state using state machine
    if (shouldInflate && this.currentState === PufferfishState.DEFLATED && this.inflationCooldownTimer <= 0) {
      // Start inflating if deflated and no cooldown
      this.currentState = PufferfishState.INFLATING;
    }
    else if (shouldInflate && this.currentState === PufferfishState.DEFLATING) {
      // If deflating but player returns to proximity, go back to inflating
      this.currentState = PufferfishState.INFLATING;
    }
    else if (!shouldInflate && this.currentState === PufferfishState.INFLATED) {
      // Start deflating if player moves away and we're inflated
      this.currentState = PufferfishState.DEFLATING;
    }
    else if (!shouldInflate && this.currentState === PufferfishState.INFLATING) {
      // If still inflating but player moves away, start deflating
      this.currentState = PufferfishState.DEFLATING;
    }

    // Update inflation state based on current state
    if (this.currentState === PufferfishState.INFLATING) {
      this.inflationState += deltaTime / config.inflationDuration;

      if (this.inflationState >= 1) {
        this.inflationState = 1;
        this.currentState = PufferfishState.INFLATED;
      }
    }
    else if (this.currentState === PufferfishState.DEFLATING) {
      this.inflationState -= deltaTime / config.deflationDuration;

      if (this.inflationState <= 0) {
        this.inflationState = 0;
        this.currentState = PufferfishState.DEFLATED;
        this.inflationCooldownTimer = config.inflationCooldown;
      }
    }

    // Apply inflation effect
    this.applyInflation();

    // Store current state in userData for easy access from collision system
    this.mesh.userData.inflationState = this.inflationState;
    this.mesh.userData.currentState = this.currentState;
    this.mesh.userData.isDangerous = this.isDangerous();
  }

  /**
   * Applies the current inflation state to the pufferfish mesh
   */
  private applyInflation(): void {
    if (!this.body || !this.spikes || !this.collisionSphere) return;
    
    const config = this.config;
    
    // Calculate current radius based on inflation state
    const currentRadius = THREE.MathUtils.lerp(
      config.baseRadius,
      config.inflatedRadius,
      this.inflationState
    );
    
    // Scale body
    const bodyScaleFactor = currentRadius / config.baseRadius;
    this.body.scale.set(bodyScaleFactor, bodyScaleFactor, bodyScaleFactor);
    
    // Scale and show spikes
    const spikeScaleFactor = THREE.MathUtils.lerp(0.3, 1.0, this.inflationState);
    this.spikes.children.forEach(spike => {
      if (spike instanceof THREE.Mesh) {
        spike.scale.set(spikeScaleFactor, spikeScaleFactor, spikeScaleFactor);
      }
    });
    
    // Update collision sphere size
    const collisionScaleFactor = currentRadius * 1.2 / (config.baseRadius * 1.2);
    this.collisionSphere.scale.set(collisionScaleFactor, collisionScaleFactor, collisionScaleFactor);
    
    // Add special effects when inflating/deflating
    if (this.body.material instanceof THREE.MeshStandardMaterial) {
      // Change emissive intensity based on inflation (more intense when inflated)
      const visualConfig = config.visuals || {};
      const baseEmissiveIntensity = visualConfig.emissiveIntensity || 0.1;
      const inflatedEmissiveIntensity = baseEmissiveIntensity * 2.0;
      
      this.body.material.emissiveIntensity = THREE.MathUtils.lerp(
        baseEmissiveIntensity,
        inflatedEmissiveIntensity,
        this.inflationState
      );
    }
    
    // Adjust fin and tail animation based on inflation state
    const finWiggleFactor = THREE.MathUtils.lerp(1.0, 0.3, this.inflationState); // Less wiggle when inflated
    this.fins.forEach(fin => {
      fin.rotation.x = Math.sin(Date.now() * 0.005) * 0.1 * finWiggleFactor;
    });
    
    // Tail moves less when inflated
    if (this.tail) {
      this.tail.rotation.y = Math.sin(Date.now() * 0.003) * 0.15 * finWiggleFactor;
    }
  }

  /**
   * Returns the current inflation state (0-1)
   */
  public getInflationState(): number {
    return this.inflationState;
  }

  /**
   * Returns whether the pufferfish is currently inflated
   */
  public getIsInflated(): boolean {
    return this.currentState === PufferfishState.INFLATED ||
           this.currentState === PufferfishState.INFLATING;
  }

  /**
   * Determines if the pufferfish is dangerous based on inflation state
   * More nuanced than simply checking if inflated - considers partial inflation
   */
  public isDangerous(): boolean {
    // Calculate danger based on inflation thresholds:
    // 1. Always dangerous when fully inflated
    // 2. Dangerous when inflating and past 50% inflated
    // 3. Dangerous when deflating and still more than 70% inflated
    // 4. Not dangerous when deflated or early inflation stages

    if (this.currentState === PufferfishState.INFLATED) {
      return true; // Always dangerous when fully inflated
    }
    else if (this.currentState === PufferfishState.INFLATING) {
      return this.inflationState > 0.5; // Dangerous when more than half inflated
    }
    else if (this.currentState === PufferfishState.DEFLATING) {
      return this.inflationState > 0.7; // Still dangerous during early deflation
    }
    else {
      return false; // DEFLATED state is not dangerous
    }
  }

  /**
   * Return the current state of the pufferfish
   */
  public getCurrentState(): PufferfishState {
    return this.currentState;
  }

  /**
   * Returns the pufferfish mesh group
   * Creates the mesh if it doesn't exist yet
   */
  public getMesh(): THREE.Group {
    if (!this.mesh) {
      this.createMesh();
    }
    return this.mesh;
  }

  /**
   * Return the pufferfish configuration with defaults as fallback
   */
  public get config(): PufferfishConfig {
    // Provide default values in case config is not available
    const defaultConfig: PufferfishConfig = {
      baseRadius: 0.35,
      inflatedRadius: 0.85,
      inflationDuration: 0.5,
      deflationDuration: 0.8,
      detectionRadius: 5.0,
      inflationCooldown: 1.0,
      visuals: {
        mainColor: 0xFFA500,
        emissiveColor: 0xCC8400,
        emissiveIntensity: 0.1,
        roughness: 0.5,
        metalness: 0.1,
        animationSpeed: 1.2
      },
      spineVisuals: {
        mainColor: 0xD2691E,
        roughness: 0.6,
        metalness: 0.05
      }
    };

    try {
      return configSystem.getObstaclesConfig()?.pufferfish || defaultConfig;
    } catch (error) {
      console.warn("PufferfishAsset: Could not get pufferfish config, using defaults", error);
      return defaultConfig;
    }
  }

  /**
   * Resets the pufferfish to its initial state (deflated)
   */
  public reset(): void {
    this.currentState = PufferfishState.DEFLATED;
    this.inflationState = 0;
    this.inflationCooldownTimer = 0;
    
    // Ensure visuals match this state
    if (this.mesh) {
      this.applyInflation();
    }
  }

  /**
   * Disposes of all resources used by this asset
   */
  public dispose(): void {
    // Clean up geometries and materials
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      
      // Clear references
      this.spikes = new THREE.Group();
      this.fins = [];
    }
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    return this.collisionSphere || this.body;
  }
}
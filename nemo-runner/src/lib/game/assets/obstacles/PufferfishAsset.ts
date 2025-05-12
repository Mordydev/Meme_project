import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';

// More formal state machine for better code readability
export enum PufferfishState {
  DEFLATED,
  INFLATING,
  INFLATED,
  DEFLATING
}

export class PufferfishAsset {
  private shaderManager: ShaderManager;

  // Track inflation state using the state enum
  private currentState: PufferfishState = PufferfishState.DEFLATED;
  private inflationState: number = 0; // 0 to 1 (fully inflated)
  private inflationCooldownTimer: number = 0;

  // Store references to parts that need animation
  private body: THREE.Mesh | null = null;
  private spikes: THREE.Group | null = null;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
  }

  public createMesh(): THREE.Group {
    const pufferfishGroup = new THREE.Group();
    pufferfishGroup.name = "PufferfishObstacle";

    // Get pufferfish config
    const config = configSystem.getObstaclesConfig().pufferfish;
    
    // Create the body - starts in base (non-inflated) state
    const bodyGeometry = new THREE.SphereGeometry(config.baseRadius, 16, 16);
    const bodyMaterial = this.shaderManager.getMaterial('obstacle_rock') || 
                       new THREE.MeshPhongMaterial({ 
                         color: 0xE57C04, // Orange
                         emissive: 0x441100,
                         emissiveIntensity: 0.2,
                         shininess: 30
                       });
    
    // Create body mesh and add to group
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    pufferfishGroup.add(this.body);
    
    // Create spikes (initially small)
    this.spikes = this.createSpikes(config.baseRadius);
    pufferfishGroup.add(this.spikes);
    
    // Create eyes (two small white spheres with black pupils)
    const eyeSize = config.baseRadius * 0.2;
    const eyePositionFactor = config.baseRadius * 0.7;
    
    // Left eye
    const leftEye = this.createEye(eyeSize);
    leftEye.position.set(
      -eyePositionFactor * 0.7, 
      eyePositionFactor * 0.5, 
      -eyePositionFactor * 0.9
    );
    pufferfishGroup.add(leftEye);
    
    // Right eye
    const rightEye = this.createEye(eyeSize);
    rightEye.position.set(
      eyePositionFactor * 0.7, 
      eyePositionFactor * 0.5, 
      -eyePositionFactor * 0.9
    );
    pufferfishGroup.add(rightEye);
    
    // Create a small mouth
    const mouth = this.createMouth(config.baseRadius * 0.3);
    mouth.position.set(0, -eyePositionFactor * 0.3, -eyePositionFactor * 0.9);
    mouth.rotation.x = Math.PI / 6; // Slight downward angle
    pufferfishGroup.add(mouth);

    // Create fins
    const topFin = this.createFin(config.baseRadius * 0.5);
    topFin.position.set(0, config.baseRadius * 0.7, 0);
    topFin.rotation.z = Math.PI / 2;
    pufferfishGroup.add(topFin);

    const leftFin = this.createFin(config.baseRadius * 0.4);
    leftFin.position.set(-config.baseRadius * 0.8, 0, config.baseRadius * 0.2);
    leftFin.rotation.y = Math.PI / 4;
    pufferfishGroup.add(leftFin);

    const rightFin = this.createFin(config.baseRadius * 0.4);
    rightFin.position.set(config.baseRadius * 0.8, 0, config.baseRadius * 0.2);
    rightFin.rotation.y = -Math.PI / 4;
    pufferfishGroup.add(rightFin);

    // Create tail
    const tail = this.createTail(config.baseRadius * 0.5);
    tail.position.set(0, 0, config.baseRadius * 0.9);
    pufferfishGroup.add(tail);

    // Add a collision sphere to make it easier to calculate collisions
    // This will be updated dynamically during inflation/deflation
    const collisionRadius = config.baseRadius * 1.2; // 20% larger than visual size
    const collisionSphere = new THREE.Mesh(
      new THREE.SphereGeometry(collisionRadius, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    collisionSphere.name = "PufferfishCollisionSphere";
    pufferfishGroup.add(collisionSphere);

    // Set userData for type identification, behavior params, and asset instance reference
    pufferfishGroup.userData = { 
      type: 'obstacle', 
      name: 'pufferfish',
      assetInstance: this,
      // Store state info in userData for easier access in update loops
      inflationState: 0,
      isInflated: false,
      detectionRadius: config.detectionRadius
    };

    return pufferfishGroup;
  }

  private createEye(size: number): THREE.Group {
    const eyeGroup = new THREE.Group();
    
    // White part (sclera)
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(size, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0xFFFFFF })
    );
    eyeGroup.add(eyeWhite);
    
    // Black part (pupil)
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(size * 0.5, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0x000000 })
    );
    pupil.position.z = -size * 0.6;
    eyeGroup.add(pupil);
    
    return eyeGroup;
  }

  private createMouth(size: number): THREE.Mesh {
    // Simple curved line for mouth
    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(size, size * 0.2, 8, 8, Math.PI),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    return mouth;
  }

  private createFin(size: number): THREE.Mesh {
    // Simple triangle for fins
    const finGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0,
      size, 0, 0,
      0, size, 0
    ]);
    
    finGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    finGeometry.setIndex([0, 1, 2]);
    finGeometry.computeVertexNormals();
    
    const finMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xE68A17, // Slightly lighter than body
      side: THREE.DoubleSide
    });
    
    return new THREE.Mesh(finGeometry, finMaterial);
  }

  private createTail(size: number): THREE.Mesh {
    // Create a simple tail shape
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.quadraticCurveTo(size * 0.5, size, size, 0);
    tailShape.quadraticCurveTo(size * 0.5, -size, 0, 0);
    
    const tailGeometry = new THREE.ShapeGeometry(tailShape);
    const tailMaterial = new THREE.MeshPhongMaterial({
      color: 0xE68A17, // Same as fins
      side: THREE.DoubleSide
    });
    
    return new THREE.Mesh(tailGeometry, tailMaterial);
  }

  private createSpikes(radius: number): THREE.Group {
    const spikesGroup = new THREE.Group();
    spikesGroup.name = "PufferfishSpikes";
    
    // The number of spikes will depend on the size
    const numSpikes = Math.floor(radius * 50); // More spikes for larger fish
    
    // Create spikes distributed evenly on the sphere
    for (let i = 0; i < numSpikes; i++) {
      // Use fibonacci sphere distribution for even spacing
      const phi = Math.acos(1 - (2 * i) / numSpikes);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      
      // Convert to cartesian coordinates on the sphere
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // Create a spike (cone)
      const spikeHeight = radius * 0.4; // 40% of the radius
      const spikeGeometry = new THREE.ConeGeometry(
        radius * 0.05, // Base radius
        spikeHeight,   // Height
        4             // 4 sides makes it look spiky
      );
      
      const spikeMaterial = new THREE.MeshPhongMaterial({
        color: 0xD36C00, // Slightly darker than body
        shininess: 30
      });
      
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      
      // Position at the calculated point
      spike.position.set(x, y, z);
      
      // Orient spike to point outward from center
      const direction = new THREE.Vector3(x, y, z).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(normal, direction);
      spike.setRotationFromQuaternion(quaternion);
      
      // Initial scale to make spikes smaller when not inflated
      spike.scale.set(0.3, 0.3, 0.3);
      
      spikesGroup.add(spike);
    }
    
    return spikesGroup;
  }

  /**
   * Updates the pufferfish animation state based on player proximity
   * @param deltaTime Time in seconds since last update
   * @param pufferfishMesh The pufferfish mesh to update
   * @param playerPosition The player's current position
   * @returns Current inflation state (0-1)
   */
  public updateAnimation(deltaTime: number, pufferfishMesh: THREE.Group, playerPosition: THREE.Vector3): number {
    if (!pufferfishMesh || !this.body || !this.spikes) return this.inflationState;

    const config = configSystem.getObstaclesConfig().pufferfish;

    // Update cooldown timer if active
    if (this.inflationCooldownTimer > 0) {
      this.inflationCooldownTimer -= deltaTime;
    }

    // Check player proximity
    const distanceToPlayer = playerPosition.distanceTo(pufferfishMesh.position);
    const shouldInflate = distanceToPlayer < config.detectionRadius;

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
    this.applyInflation(pufferfishMesh);

    // Store current state in userData for easy access from collision system
    pufferfishMesh.userData.inflationState = this.inflationState;
    pufferfishMesh.userData.currentState = this.currentState;

    return this.inflationState;
  }

  /**
   * Applies the current inflation state to the pufferfish mesh
   */
  private applyInflation(pufferfishMesh: THREE.Group): void {
    if (!this.body || !this.spikes) return;
    
    const config = configSystem.getObstaclesConfig().pufferfish;
    
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
    const collisionSphere = pufferfishMesh.getObjectByName("PufferfishCollisionSphere");
    if (collisionSphere instanceof THREE.Mesh) {
      const collisionScaleFactor = currentRadius * 1.2 / (config.baseRadius * 1.2);
      collisionSphere.scale.set(collisionScaleFactor, collisionScaleFactor, collisionScaleFactor);
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
   * Return the pufferfish configuration
   */
  public get config() {
    // Provide default values in case config is not available
    const defaultConfig = {
      baseRadius: 0.35,
      inflatedRadius: 0.85,
      inflationDuration: 0.5,
      deflationDuration: 0.8,
      detectionRadius: 5.0,
      inflationCooldown: 1.0
    };

    try {
      return configSystem.getObstaclesConfig().pufferfish || defaultConfig;
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
  }

  /**
   * Disposes of any resources used by this asset
   */
  public dispose(): void {
    // Nothing to dispose of currently, as geometries and materials
    // are managed by ObstacleManager and scene
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    if (this.body) {
      // If we have a specific collision sphere, return that
      const collisionSphere = this.body.parent?.getObjectByName("PufferfishCollisionSphere") as THREE.Mesh;
      if (collisionSphere) {
        return collisionSphere;
      }
    }
    // Fallback to the main body
    return this.body as THREE.Mesh;
  }
}
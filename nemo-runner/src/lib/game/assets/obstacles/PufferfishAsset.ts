import * as THREE from 'three';
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
  public config: Readonly<PufferfishConfig>;
  public mesh!: THREE.Group;
  private collisionShape!: THREE.Mesh; // The main collider, likely the body

  private bodyMesh!: THREE.Mesh;
  private spikesGroup!: THREE.Group; // Group to hold individual spikes
  private individualSpikes: THREE.Mesh[] = []; // For animation

  private currentState: PufferfishState = PufferfishState.DEFLATED;
  private inflationProgress: number = 0; // 0 (deflated) to 1 (inflated)
  private inflationCooldownTimer: number = 0;
  private animationTime: number = 0; // For subtle idle animations
  private finGroup!: THREE.Group; // Group for fins

  constructor() {
    this.config = configSystem.getObstaclesConfig().pufferfish;
    this.createMesh();
  }

  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "PufferfishObstacle_StdMat";
    const visualConf = this.config.visuals;

    // --- Body ---
    const bodyGeom = new THREE.SphereGeometry(this.config.baseRadius, 24, 18); // More segments for smoother look
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xFFA500),
      roughness: visualConf.roughness || 0.6,
      metalness: visualConf.metalness || 0.1,
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor).multiplyScalar(0.2),
      emissiveIntensity: visualConf.emissiveIntensity || 0.1,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    this.bodyMesh.name = "PufferfishBody";
    this.mesh.add(this.bodyMesh);

    // --- Spikes ---
    this.spikesGroup = new THREE.Group();
    this.spikesGroup.name = "PufferfishSpikes";
    this.individualSpikes = [];
    this.createSpikes();
    this.mesh.add(this.spikesGroup);

    // --- Eyes & Mouth (as separate meshes for detail) ---
    const eyeGroup = new THREE.Group();
    const eyeRadius = this.config.baseRadius * 0.25;
    const pupilRadius = eyeRadius * 0.4;
    const eyeGeom = new THREE.SphereGeometry(eyeRadius, 12, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.3 });

    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(pupilRadius, 8, 6), pupilMat);
    leftPupil.position.z = eyeRadius * 0.8;
    leftEye.add(leftPupil);
    leftEye.position.set(-this.config.baseRadius * 0.5, this.config.baseRadius * 0.3, this.config.baseRadius * 0.7);
    eyeGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat.clone()); // Clone material for safety
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(pupilRadius, 8, 6), pupilMat.clone());
    rightPupil.position.z = eyeRadius * 0.8;
    rightEye.add(rightPupil);
    rightEye.position.set(this.config.baseRadius * 0.5, this.config.baseRadius * 0.3, this.config.baseRadius * 0.7);
    eyeGroup.add(rightEye);
    this.mesh.add(eyeGroup);
    
    // Mouth
    const mouthGeom = new THREE.TorusGeometry(this.config.baseRadius * 0.15, 0.03, 8, 12, Math.PI);
    const mouthMat = new THREE.MeshStandardMaterial({color: 0x331a00, roughness: 0.7});
    const mouth = new THREE.Mesh(mouthGeom, mouthMat);
    mouth.position.set(0, -this.config.baseRadius * 0.1, this.config.baseRadius * 0.85);
    mouth.rotation.x = Math.PI / 1.5;
    this.mesh.add(mouth);

    // Fins
    this.createFins();

    // Collision Shape (simple sphere, will scale with body)
    const collisionGeom = new THREE.SphereGeometry(this.config.baseRadius, 12, 8);
    this.collisionShape = new THREE.Mesh(collisionGeom, new THREE.MeshBasicMaterial({visible: false, wireframe: true}));
    this.collisionShape.name = "PufferfishCollider";
    this.mesh.add(this.collisionShape); // Add to group so it inherits scale

    this.mesh.userData = { type: 'obstacle', name: 'pufferfish', assetInstance: this };
    this.applyInflation(0); // Apply initial deflated state
  }

  private createSpikes(): void {
    // Properties from PufferfishConfig directly
    const baseRadius = this.config.baseRadius;
    const numSpikes = this.config.spikeCount || 20; // Default if not in config
    const spikeLength = this.config.spikeLength || 0.3; // Default if not in config
    const spikeBaseRadius = this.config.spikeRadius || 0.03; // Default if not in config
    
    // Visual properties from visuals config (like color)
    const visualConf = this.config.visuals;

    if (numSpikes < 2) {
      console.warn("PufferfishAsset: numSpikes is less than 2, defaulting to 2.");
      // numSpikes = 2; // Already handled by effectiveNumSpikes below
    }
    if (baseRadius <= 0) {
        console.error("PufferfishAsset: baseRadius is zero or negative in createSpikes. Defaulting to 0.1.");
        // baseRadius = 0.1; // Handled by effectiveBaseRadius below
    }

    const effectiveNumSpikes = Math.max(2, numSpikes);
    const effectiveBaseRadius = baseRadius <= 0 ? 0.1 : baseRadius;

    const spikeGeometry = new THREE.CylinderGeometry(0, spikeBaseRadius, spikeLength, 8);
    spikeGeometry.translate(0, spikeLength / 2, 0); // Pivot at base
    const spikeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.detailColor || 0x8B4513), // Use detailColor for spikes
      roughness: 0.6,
      metalness: 0.1
    });

    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = Math.PI * 2 * goldenRatio;

    for (let i = 0; i < effectiveNumSpikes; i++) {
      const yFraction = 1 - (i / (effectiveNumSpikes - 1)) * 2; // yFraction goes from 1 to -1
      // Calculate y position on the sphere scaled by effectiveBaseRadius
      const yPos = yFraction * effectiveBaseRadius;

      // Calculate radius of the sphere slice at yPos
      let radiusAtY = Math.sqrt(Math.max(0.00001, effectiveBaseRadius * effectiveBaseRadius - yPos * yPos));
      
      if (isNaN(radiusAtY) || radiusAtY < 0) { // radiusAtY should not be < 0 due to Math.max, but check anyway
        console.warn(`PufferfishAsset: radiusAtY is NaN or invalid. yFraction: ${yFraction}, yPos: ${yPos}, effectiveBaseRadius: ${effectiveBaseRadius}, calculated radiusAtY: ${radiusAtY}. Using fallback.`);
        radiusAtY = effectiveBaseRadius * 0.05; // Fallback to a very small radius
        if (Math.abs(yFraction) === 1) radiusAtY = 0; // Explicitly 0 at exact poles
      }

      const phi = angleIncrement * i;
      const xPos = radiusAtY * Math.cos(phi);
      const zPos = radiusAtY * Math.sin(phi);

      const spike = new THREE.Mesh(spikeGeometry.clone(), spikeMaterial.clone());
      spike.position.set(xPos, yPos, zPos);

      const direction = spike.position.clone();
      if (direction.lengthSq() > 0.000001) {
        spike.userData.originalDirection = direction.normalize();
      } else {
        spike.userData.originalDirection = new THREE.Vector3(0, Math.sign(yPos) || (yFraction > 0 ? 1 : -1) , 0).normalize();
        console.warn("PufferfishAsset: Spike created at or near origin, using fallback for originalDirection based on yPos/yFraction.");
      }
      
      const lookAtPosition = new THREE.Vector3(0,0,0); 
      spike.lookAt(lookAtPosition);
      spike.rotateX(Math.PI / 2); 

      this.individualSpikes.push(spike); // Corrected from this.spikes to this.individualSpikes
      this.spikesGroup.add(spike);
    }
  }

  private createFins(): void {
    this.finGroup = new THREE.Group();
    this.finGroup.name = "PufferfishFins";
    const visualConf = this.config.visuals;
    const finMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(visualConf.detailColor || 0xD2691E), // Use detailColor for fins
      roughness: visualConf.roughness ? visualConf.roughness * 0.9 : 0.5, // Slightly different roughness
      metalness: visualConf.metalness || 0.1,
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.detailColor || 0xD2691E).multiplyScalar(0.1),
      emissiveIntensity: visualConf.emissiveIntensity ? visualConf.emissiveIntensity * 0.5 : 0.05,
      side: THREE.DoubleSide
    });

    // Top fin (dorsal)
    const topFinShape = new THREE.Shape();
    const finSize = this.config.baseRadius * 0.5;
    topFinShape.moveTo(0, 0);
    topFinShape.quadraticCurveTo(finSize * 0.5, finSize, finSize, 0);
    const topFinGeom = new THREE.ShapeGeometry(topFinShape);
    const topFin = new THREE.Mesh(topFinGeom, finMaterial);
    topFin.position.set(0, this.config.baseRadius * 0.7, -this.config.baseRadius * 0.1); // Adjusted Z for better placement
    topFin.rotation.x = Math.PI / 6; // Slight angle
    this.finGroup.add(topFin);

    // Side fins (pectoral)
    const sideFinShape = new THREE.Shape();
    const sideFinSize = this.config.baseRadius * 0.4;
    sideFinShape.moveTo(0, 0);
    sideFinShape.quadraticCurveTo(sideFinSize * 0.7, sideFinSize * 0.5, sideFinSize, 0);
    sideFinShape.quadraticCurveTo(sideFinSize * 0.7, -sideFinSize * 0.5, 0, 0);
    const sideFinGeom = new THREE.ShapeGeometry(sideFinShape);
    
    const leftFin = new THREE.Mesh(sideFinGeom, finMaterial.clone());
    leftFin.position.set(-this.config.baseRadius * 0.6, -this.config.baseRadius * 0.1, this.config.baseRadius * 0.3); // Adjusted position
    leftFin.rotation.y = Math.PI / 3; // Angle outwards
    leftFin.rotation.z = -Math.PI / 8; // Angle slightly downwards
    this.finGroup.add(leftFin);

    const rightFin = new THREE.Mesh(sideFinGeom, finMaterial.clone());
    rightFin.position.set(this.config.baseRadius * 0.6, -this.config.baseRadius * 0.1, this.config.baseRadius * 0.3); // Adjusted position
    rightFin.rotation.y = -Math.PI / 3; // Angle outwards
    rightFin.rotation.z = -Math.PI / 8; // Angle slightly downwards
    this.finGroup.add(rightFin);

    // Tail fin (caudal) - more fan-like
    const tailFinShape = new THREE.Shape();
    const tailBaseWidth = this.config.baseRadius * 0.1;
    const tailLength = this.config.baseRadius * 0.4;
    const tailEndWidth = this.config.baseRadius * 0.3;

    tailFinShape.moveTo(0, -tailBaseWidth / 2);
    tailFinShape.lineTo(tailLength * 0.7, -tailEndWidth / 2);
    tailFinShape.quadraticCurveTo(tailLength, 0, tailLength * 0.7, tailEndWidth / 2);
    tailFinShape.lineTo(0, tailBaseWidth / 2);
    tailFinShape.closePath();
    
    const tailFinGeom = new THREE.ShapeGeometry(tailFinShape);
    const tailFin = new THREE.Mesh(tailFinGeom, finMaterial.clone());
    tailFin.position.set(0, 0, -this.config.baseRadius * 0.9); // Positioned at the rear
    tailFin.rotation.y = Math.PI / 2; // Orient correctly
    this.finGroup.add(tailFin);

    this.mesh.add(this.finGroup);
  }

  public applyInflation(factor: number): void {
    if (isNaN(factor) || factor < 0 || factor > 1) {
        console.error("PufferfishAsset: Invalid factor in applyInflation:", factor, "Clamping to 0-1 range.");
        factor = Math.max(0, Math.min(1, factor)); // Clamp the factor
    }

    const baseRadiusConfig = this.config.baseRadius;
    const inflatedRadius = this.config.inflatedRadius;

    // Use a validated effectiveBaseRadius for calculations, similar to createSpikes
    const effectiveBaseRadius = baseRadiusConfig <= 0 ? 0.1 : baseRadiusConfig;

    if (effectiveBaseRadius <= 0) { // Should be caught by the line above, but as a safeguard.
      console.error("PufferfishAsset: effectiveBaseRadius is zero or negative in applyInflation. Cannot calculate scaleFactor.");
      return; 
    }
    if (inflatedRadius <= effectiveBaseRadius) {
        console.warn("PufferfishAsset: inflatedRadius is not greater than effectiveBaseRadius. Inflation might not be visible or may invert.");
    }

    const scaleFactor = 1 + (inflatedRadius / effectiveBaseRadius - 1) * factor;

    if (isNaN(scaleFactor) || scaleFactor < 0) {
      console.error("PufferfishAsset: Invalid scaleFactor in applyInflation:", scaleFactor, "Factor:", factor, "EffectiveBaseR:", effectiveBaseRadius, "InflatedR:", inflatedRadius);
      this.bodyMesh.scale.set(1, 1, 1); // Fallback to no scale
      return;
    }

    this.bodyMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    // Also scale the main collision shape with the body
    if (this.collisionShape) {
        this.collisionShape.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    const initialSpikeLength = this.config.spikeLength || 0.3;
    if (initialSpikeLength <= 0) {
        console.warn("PufferfishAsset: initialSpikeLength is zero or negative in applyInflation. Spikes will not change length.");
    }

    this.individualSpikes.forEach(spike => {
      if (initialSpikeLength > 0) {
        const newSpikeLength = initialSpikeLength * (1 + factor * 1.5); // Spikes get longer as it inflates
        // Ensure initialSpikeLength isn't zero for division, though covered by outer check
        spike.scale.y = newSpikeLength / initialSpikeLength; 
      }

      // Spikes are positioned relative to the body surface, which scales.
      // Their local position should be scaled by the current body radius.
      const currentActualBodyRadius = effectiveBaseRadius * scaleFactor;
      
      if (spike.userData.originalDirection instanceof THREE.Vector3 && spike.userData.originalDirection.lengthSq() > 0.000001) {
        spike.position.copy(spike.userData.originalDirection).multiplyScalar(currentActualBodyRadius);
      } else {
        console.warn("PufferfishAsset: Spike has invalid originalDirection in applyInflation. Attempting to re-orient.");
        const fallbackDir = spike.position.clone(); 
        if (fallbackDir.lengthSq() > 0.000001) {
          spike.position.copy(fallbackDir.normalize()).multiplyScalar(currentActualBodyRadius);
        } else {
          spike.position.set(0, currentActualBodyRadius, 0);
          console.error("PufferfishAsset: Spike at origin with no valid originalDirection during applyInflation.");
        }
      }
      if (isNaN(spike.position.x) || isNaN(spike.position.y) || isNaN(spike.position.z)) {
        console.error("PufferfishAsset: Spike position became NaN in applyInflation. OriginalDirection:", spike.userData.originalDirection, "CurrentActualBodyRadius:", currentActualBodyRadius);
        spike.position.set(0, currentActualBodyRadius, 0); 
      }
    });
  }

  public updateAnimation(deltaTime: number, playerPosition?: THREE.Vector3): void {
    this.animationTime += deltaTime;
    const prevInflationProgress = this.inflationProgress;

    if (this.inflationCooldownTimer > 0) {
      this.inflationCooldownTimer -= deltaTime;
    }

    // Check if playerPosition is a valid THREE.Vector3
    let distanceToPlayer = Infinity;
    if (playerPosition && typeof playerPosition.distanceTo === 'function') {
      distanceToPlayer = playerPosition.distanceTo(this.mesh.position);
    } else {
      console.warn('PufferfishAsset: playerPosition is not a valid THREE.Vector3. Inflation logic might be affected.');
      // Optionally, define a default behavior, e.g., assume player is far away
      // For now, distanceToPlayer remains Infinity, so it won't inflate based on proximity.
    }
    
    const shouldInflate = distanceToPlayer < this.config.detectionRadius;

    // State transitions based on player proximity
    if (shouldInflate && this.currentState === PufferfishState.DEFLATED && this.inflationCooldownTimer <= 0) {
      this.currentState = PufferfishState.INFLATING;
    } else if (shouldInflate && this.currentState === PufferfishState.DEFLATING) {
      this.currentState = PufferfishState.INFLATING; // Re-inflate if player comes back
    } else if (!shouldInflate && this.currentState === PufferfishState.INFLATED) {
      this.currentState = PufferfishState.DEFLATING;
    } else if (!shouldInflate && this.currentState === PufferfishState.INFLATING && this.inflationProgress < 0.3) {
      // If player moves away quickly during early inflation, start deflating
      this.currentState = PufferfishState.DEFLATING;
    }

    // Update inflation progress based on current state
    if (this.currentState === PufferfishState.INFLATING) {
      this.inflationProgress += deltaTime / this.config.inflationDuration;
      if (this.inflationProgress >= 1.0) {
        this.inflationProgress = 1.0;
        this.currentState = PufferfishState.INFLATED;
      }
    } else if (this.currentState === PufferfishState.DEFLATING) {
      this.inflationProgress -= deltaTime / this.config.deflationDuration;
      if (this.inflationProgress <= 0.0) {
        this.inflationProgress = 0.0;
        this.currentState = PufferfishState.DEFLATED;
        this.inflationCooldownTimer = this.config.inflationCooldown;
      }
    }
    
    // Only apply geometry changes if progress actually changed
    if (this.inflationProgress !== prevInflationProgress) {
      this.applyInflation(this.inflationProgress);
    }

    // Subtle bobbing animation
    const visualConf = this.config.visuals;
    const bobSpeed = (visualConf.animationSpeed || 1.5) * 1.5; // Use configured speed, or default 1.5, and scale it for bobbing
    const bobAmplitude = visualConf.animationAmplitude || 0.05; // Use configured amplitude, or default 0.05
    this.mesh.position.y += Math.sin(this.animationTime * bobSpeed + this.mesh.uuid.length) * bobAmplitude;

    // Subtle fin animation
    if (this.finGroup) {
        const finSwaySpeed = 2.5;
        const finSwayAmplitude = 0.2;
        // Top fin sway
        const topFinMesh = this.finGroup.children.find(f => f.name === "" && f instanceof THREE.Mesh && f.geometry instanceof THREE.ShapeGeometry && f.position.y > 0) as THREE.Mesh | undefined;
        if (topFinMesh) {
            topFinMesh.rotation.z = Math.PI / 6 + Math.sin(this.animationTime * finSwaySpeed * 0.8) * finSwayAmplitude * 0.5;
        }
        // Side fins sway
        const sideFinMeshes = this.finGroup.children.filter(f => f.position.x !== 0 && f instanceof THREE.Mesh && f.geometry instanceof THREE.ShapeGeometry) as THREE.Mesh[];
        sideFinMeshes.forEach((finMesh, index) => {
            finMesh.rotation.z = -Math.PI / 8 + Math.sin(this.animationTime * finSwaySpeed + (index * Math.PI /2)) * finSwayAmplitude;
        });
        // Tail fin sway
        const tailFinMesh = this.finGroup.children.find(f => f.position.z < -this.config.baseRadius * 0.5 && f instanceof THREE.Mesh && f.geometry instanceof THREE.ShapeGeometry) as THREE.Mesh | undefined;
         if (tailFinMesh) {
            tailFinMesh.rotation.x = Math.sin(this.animationTime * finSwaySpeed * 1.2) * finSwayAmplitude * 1.5;
        }
    }

    // Update userData for collision detection
    this.mesh.userData.isDangerous = this.isDangerous();
  }
  
  /**
   * Determines if the pufferfish is currently dangerous to the player
   * @returns true if the pufferfish is significantly inflated and dangerous
   */
  public isDangerous(): boolean {
    // Dangerous if significantly inflated (over 60%)
    return this.inflationProgress > 0.6;
  }

  /**
   * Returns the main mesh of this asset
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    return this.collisionShape;
  }

  /**
   * Resets the pufferfish to its initial state
   */
  public reset(): void {
    this.currentState = PufferfishState.DEFLATED;
    this.inflationProgress = 0;
    this.inflationCooldownTimer = 0;
    this.applyInflation(0); // Reset scale and spikes
  }
  
  /**
   * Disposes of all resources used by this asset
   */
  public dispose(): void { 
    // Body
    this.bodyMesh?.geometry?.dispose();
    if (this.bodyMesh?.material instanceof THREE.Material) {
        this.bodyMesh.material.dispose();
    }
    // Spikes
    this.individualSpikes.forEach(spike => {
        spike.geometry?.dispose();
        if (spike.material instanceof THREE.Material) {
            spike.material.dispose();
        }
    });
    this.spikesGroup?.clear(); // Removes all spike children
    this.individualSpikes = [];

    // Eyes & Mouth
    this.mesh.traverse(child => {
        if (child instanceof THREE.Mesh && (child.name.includes("Eye") || child.name.includes("Pupil") || child.name.includes("Mouth"))) {
            child.geometry?.dispose();
            if (child.material instanceof THREE.Material) {
                child.material.dispose();
            }
        }
    });
    
    // Fins
    this.finGroup?.traverse(child => {
        if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (child.material instanceof THREE.Material) {
                child.material.dispose();
            }
        }
    });
    this.finGroup?.clear();

    // Collision Shape
    this.collisionShape?.geometry?.dispose();
    if (this.collisionShape?.material instanceof THREE.Material) {
        this.collisionShape.material.dispose();
    }
    
    // Main mesh group
    this.mesh?.clear(); // Removes all children from the main group
  }
}
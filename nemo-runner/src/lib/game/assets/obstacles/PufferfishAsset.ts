import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { PufferfishConfig } from '../../config/gameConfig';

export class PufferfishAsset {
  public mesh!: THREE.Group;
  private bodyMesh!: THREE.Mesh;
  public config: Readonly<PufferfishConfig>;

  // Child Meshes
  private leftEyeMesh!: THREE.Mesh;
  private rightEyeMesh!: THREE.Mesh;
  private mouthMesh!: THREE.Mesh;
  private dorsalFin!: THREE.Mesh;
  private leftPectoralFin!: THREE.Mesh;
  private rightPectoralFin!: THREE.Mesh;
  private tailFin!: THREE.Mesh;
  private spikesGroup!: THREE.Group;
  private individualSpikes: THREE.Mesh[] = [];
  private collisionMesh!: THREE.Mesh;

  // Animation state
  private inflationProgress: number = 0;
  private inflationState: 'deflated' | 'inflating' | 'inflated' | 'deflating' = 'deflated';
  private animationTime: number = 0; // Generic timer, could be used for bobbing/fins
  private stateTime: number = 0; // Timer for current inflation/deflation state duration
  private inflationCooldownTimer: number = 0;

  // Store initial positions for features to scale them correctly
  private initialEyeLPos!: THREE.Vector3;
  private initialEyeRPos!: THREE.Vector3;
  private initialMouthPos!: THREE.Vector3;
  private initialDorsalFinPos!: THREE.Vector3;
  private initialPectoralLFinPos!: THREE.Vector3;
  private initialPectoralRFinPos!: THREE.Vector3;
  private initialTailFinPos!: THREE.Vector3;
  // Spikes are handled by scaling their parent group's children positions from origin

  constructor() {
    this.config = configSystem.getObstaclesConfig().pufferfish;
    this.createMesh();
    // Store initial positions after creation
    this.storeInitialPositions();
  }

  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "PufferfishObstacle_Animated"; // Updated name
    this.mesh.visible = true;
    const bodyRadius = this.config.baseRadius;

    const bodyGeom = new THREE.SphereGeometry(bodyRadius, 24, 18);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.config.visuals.mainColor || 0xFFFF00),
        emissive: new THREE.Color(this.config.visuals.emissiveColor || this.config.visuals.mainColor || 0xFFFF00).multiplyScalar(0.3),
        emissiveIntensity: this.config.visuals.emissiveIntensity || 0.3,
        roughness: this.config.visuals.roughness || 0.6,
        metalness: this.config.visuals.metalness || 0.1,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    this.bodyMesh.name = "PufferfishBody";
    this.mesh.add(this.bodyMesh);

    const collisionGeom = new THREE.SphereGeometry(bodyRadius, 8, 6);
    const collisionMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
    this.collisionMesh = new THREE.Mesh(collisionGeom, collisionMat);
    this.collisionMesh.name = "PufferfishCollider";
    this.mesh.add(this.collisionMesh);

    this.createEyes();
    this.createMouth();
    this.createFins();
    this.createSpikes();

    this.mesh.userData = { type: 'obstacle', name: 'pufferfish', assetInstance: this };
  }
  
  private storeInitialPositions(): void {
    if (this.leftEyeMesh) this.initialEyeLPos = this.leftEyeMesh.position.clone();
    if (this.rightEyeMesh) this.initialEyeRPos = this.rightEyeMesh.position.clone();
    if (this.mouthMesh) this.initialMouthPos = this.mouthMesh.position.clone();
    if (this.dorsalFin) this.initialDorsalFinPos = this.dorsalFin.position.clone();
    if (this.leftPectoralFin) this.initialPectoralLFinPos = this.leftPectoralFin.position.clone();
    if (this.rightPectoralFin) this.initialPectoralRFinPos = this.rightPectoralFin.position.clone();
    if (this.tailFin) this.initialTailFinPos = this.tailFin.position.clone();
    // Spikes positions are relative to bodyRadius during creation, will be scaled by spikesGroup transform
  }

  private createEyes(): void {
    const visualConf = this.config.visuals;
    const bodyRadius = this.config.baseRadius;
    const eyeRadius = bodyRadius * 0.15;
    const eyeColor = visualConf.detailColor || 0x000000;
    const eyeGeometry = new THREE.SphereGeometry(eyeRadius, 12, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.3, metalness: 0.05 });
    this.leftEyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEyeMesh.position.set(bodyRadius * 0.6, bodyRadius * 0.3, -bodyRadius * 0.5);
    this.leftEyeMesh.lookAt(0,0,0);
    this.mesh.add(this.leftEyeMesh);
    this.rightEyeMesh = new THREE.Mesh(eyeGeometry.clone(), eyeMaterial.clone());
    this.rightEyeMesh.position.set(-bodyRadius * 0.6, bodyRadius * 0.3, -bodyRadius * 0.5);
    this.rightEyeMesh.lookAt(0,0,0);
    this.mesh.add(this.rightEyeMesh);
  }

  private createMouth(): void {
    const visualConf = this.config.visuals;
    const bodyRadius = this.config.baseRadius;
    const mouthRadius = bodyRadius * 0.1;
    const mouthColor = visualConf.detailColor || new THREE.Color(visualConf.mainColor || 0xFFFF00).multiplyScalar(0.5);
    const mouthGeometry = new THREE.SphereGeometry(mouthRadius, 12, 8);
    mouthGeometry.scale(1.5, 0.7, 1.0);
    const mouthMaterial = new THREE.MeshStandardMaterial({ color: mouthColor, roughness: 0.8, metalness: 0.0 });
    this.mouthMesh = new THREE.Mesh(mouthGeometry, mouthMaterial);
    this.mouthMesh.position.set(0, bodyRadius * 0.1, -bodyRadius * 0.85);
    this.mouthMesh.rotation.x = Math.PI / 12;
    this.mesh.add(this.mouthMesh);
  }

  private createFins(): void {
    const visualConf = this.config.visuals;
    const bodyRadius = this.config.baseRadius;
    const finColor = visualConf.detailColor || new THREE.Color(visualConf.mainColor || 0xFFFF00).offsetHSL(0, 0.1, -0.1);
    const finMaterial = new THREE.MeshStandardMaterial({ color: finColor, roughness: 0.5, metalness: 0.0, side: THREE.DoubleSide });
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(0, 0); dorsalShape.lineTo(bodyRadius * -0.2, bodyRadius * 0.5); dorsalShape.lineTo(bodyRadius * 0.2, bodyRadius * 0.5); dorsalShape.closePath();
    const dorsalGeom = new THREE.ShapeGeometry(dorsalShape);
    this.dorsalFin = new THREE.Mesh(dorsalGeom, finMaterial);
    this.dorsalFin.position.set(0, bodyRadius * 0.8, bodyRadius * 0.1);
    this.dorsalFin.rotation.x = Math.PI / 10;
    this.mesh.add(this.dorsalFin);
    const pectoralShape = new THREE.Shape();
    const pFinW = bodyRadius * 0.4; const pFinH = bodyRadius * 0.25;
    pectoralShape.moveTo(-pFinW / 2, -pFinH / 2); pectoralShape.lineTo(pFinW / 2, -pFinH / 2); pectoralShape.absarc(pFinW / 2, 0, pFinH / 2, -Math.PI / 2, Math.PI / 2, false); pectoralShape.lineTo(-pFinW / 2, pFinH / 2); pectoralShape.absarc(-pFinW/2, 0, pFinH / 2, Math.PI/2, -Math.PI/2, false);
    const pectoralGeom = new THREE.ShapeGeometry(pectoralShape);
    this.leftPectoralFin = new THREE.Mesh(pectoralGeom, finMaterial.clone());
    this.leftPectoralFin.position.set(bodyRadius * 0.9, bodyRadius * 0.1, -bodyRadius * 0.1);
    this.leftPectoralFin.rotation.y = Math.PI / 2; this.leftPectoralFin.rotation.z = Math.PI / 6;
    this.mesh.add(this.leftPectoralFin);
    
    // Create mirrored right fin
    const rightPectoralGeom = pectoralGeom.clone();
    // Flip the vertices in the x direction to create a mirror
    const rightVertices = rightPectoralGeom.getAttribute('position');
    for (let i = 0; i < rightVertices.count; i++) {
      const x = rightVertices.getX(i);
      rightVertices.setX(i, -x);
    }
    rightPectoralGeom.computeVertexNormals(); // Recompute normals after modifying vertices
    
    this.rightPectoralFin = new THREE.Mesh(rightPectoralGeom, finMaterial.clone());
    this.rightPectoralFin.position.set(-bodyRadius * 0.9, bodyRadius * 0.1, -bodyRadius * 0.1);
    this.rightPectoralFin.rotation.y = -Math.PI / 2; this.rightPectoralFin.rotation.z = -Math.PI / 6;
    this.mesh.add(this.rightPectoralFin);
    const tailShape = new THREE.Shape();
    const tFinBase = bodyRadius * 0.2; const tFinTop = bodyRadius * 0.4; const tFinH = bodyRadius * 0.5;
    tailShape.moveTo(-tFinBase / 2, 0); tailShape.lineTo(tFinBase / 2, 0); tailShape.lineTo(tFinTop / 2, tFinH); tailShape.lineTo(-tFinTop / 2, tFinH); tailShape.closePath();
    const tailGeom = new THREE.ShapeGeometry(tailShape);
    this.tailFin = new THREE.Mesh(tailGeom, finMaterial.clone());
    this.tailFin.position.set(0, bodyRadius * 0.1, bodyRadius * 0.9);
    this.tailFin.rotation.x = -Math.PI / 8;
    this.mesh.add(this.tailFin);
  }

  private createSpikes(): void {
    this.spikesGroup = new THREE.Group(); this.spikesGroup.name = "PufferfishSpikes"; this.mesh.add(this.spikesGroup);
    const visualConf = this.config.visuals;
    const bodyRadius = this.config.baseRadius;
    const spikeCount = this.config.spikeCount || 20;
    const spikeLength = bodyRadius * (this.config.spikeLengthFactor || 0.3);
    const spikeRadius = bodyRadius * (this.config.spikeRadiusFactor || 0.03);
    const spikeColor = visualConf.detailColor || new THREE.Color(visualConf.mainColor || 0xFFFF00).offsetHSL(0, 0.05, -0.2);
    const spikeGeometry = new THREE.ConeGeometry(spikeRadius, spikeLength, 8); spikeGeometry.translate(0, spikeLength / 2, 0);
    const spikeMaterial = new THREE.MeshStandardMaterial({ color: spikeColor, roughness: 0.6, metalness: 0.0 });
    const phi = Math.PI * (3.0 - Math.sqrt(5.0));
    for (let i = 0; i < spikeCount; i++) {
      const y = 1 - (i / (spikeCount - 1)) * 2; const radiusAtY = Math.sqrt(1 - y * y); const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY; const z = Math.sin(theta) * radiusAtY;
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      // Initial position is on the unit sphere, scaled by bodyRadius later by spikesGroup or applyInflation
      spike.position.set(x, y, z); // Store unit vector position for easy scaling later
      spike.lookAt(0,0,0); spike.rotateX(Math.PI / 2);
      this.spikesGroup.add(spike); this.individualSpikes.push(spike);
    }
  }

  public applyInflation(factor: number): void {
    factor = Math.max(0, Math.min(1, factor));
    const currentRadius = this.config.baseRadius + (this.config.inflatedRadius - this.config.baseRadius) * factor;
    const scaleRelativeToBase = currentRadius / this.config.baseRadius;

    if (this.bodyMesh) this.bodyMesh.scale.set(scaleRelativeToBase, scaleRelativeToBase, scaleRelativeToBase);
    if (this.collisionMesh) this.collisionMesh.scale.set(scaleRelativeToBase, scaleRelativeToBase, scaleRelativeToBase);

    // Scale positions of features (eyes, mouth, fins)
    const featureScale = scaleRelativeToBase; // or simply currentRadius / this.config.baseRadius
    if (this.leftEyeMesh && this.initialEyeLPos) this.leftEyeMesh.position.copy(this.initialEyeLPos).multiplyScalar(featureScale);
    if (this.rightEyeMesh && this.initialEyeRPos) this.rightEyeMesh.position.copy(this.initialEyeRPos).multiplyScalar(featureScale);
    if (this.mouthMesh && this.initialMouthPos) this.mouthMesh.position.copy(this.initialMouthPos).multiplyScalar(featureScale);
    if (this.dorsalFin && this.initialDorsalFinPos) this.dorsalFin.position.copy(this.initialDorsalFinPos).multiplyScalar(featureScale);
    if (this.leftPectoralFin && this.initialPectoralLFinPos) this.leftPectoralFin.position.copy(this.initialPectoralLFinPos).multiplyScalar(featureScale);
    if (this.rightPectoralFin && this.initialPectoralRFinPos) this.rightPectoralFin.position.copy(this.initialPectoralRFinPos).multiplyScalar(featureScale);
    if (this.tailFin && this.initialTailFinPos) this.tailFin.position.copy(this.initialTailFinPos).multiplyScalar(featureScale);

    // Scale spikes: scale the group and then potentially individual spike lengths/protrusion
    if (this.spikesGroup) {
        this.spikesGroup.scale.set(scaleRelativeToBase, scaleRelativeToBase, scaleRelativeToBase);
        // Further refine individual spike scale/length if needed (e.g., make them longer when inflated)
        const spikeVisualScale = 1 + factor * 0.5; // Spikes get 50% longer at full inflation
        this.individualSpikes.forEach(spike => {
            spike.scale.set(1, spikeVisualScale, 1); // Scale length (local Y) of cone
        });
    }
  }

  public updateAnimation(deltaTime: number, playerPosition?: THREE.Vector3): void {
    this.animationTime += deltaTime;
    this.stateTime += deltaTime;

    if (this.inflationCooldownTimer > 0) {
      this.inflationCooldownTimer -= deltaTime;
    }

    const { 
      inflationDuration, 
      deflationDuration, 
      detectionRadius, 
      inflationCooldown 
    } = this.config;
    
    let distanceToPlayer = Infinity;
    if (playerPosition) {
        distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
    }

    // State transitions based on player proximity
    switch (this.inflationState) {
      case 'deflated':
        if (distanceToPlayer < detectionRadius && this.inflationCooldownTimer <= 0) {
          this.inflationState = 'inflating';
          this.stateTime = 0;
        }
        break;
      case 'inflating':
        this.inflationProgress = Math.min(1, this.stateTime / inflationDuration);
        if (this.inflationProgress >= 1) {
          this.inflationState = 'inflated';
          this.stateTime = 0;
        }
        // If player moves away while inflating, start deflating
        if (distanceToPlayer >= detectionRadius) {
            this.inflationState = 'deflating';
            // Optional: Adjust stateTime or progress if deflation should be from current progress
            // For now, full deflation cycle starts
            this.stateTime = (1.0 - this.inflationProgress) * deflationDuration; // Start deflating from current progress
        }
        break;
      case 'inflated':
        // If player moves away, or after a certain time (optional, not in current config)
        if (distanceToPlayer >= detectionRadius) { 
          this.inflationState = 'deflating';
          this.stateTime = 0;
        }
        break;
      case 'deflating':
        this.inflationProgress = 1.0 - Math.min(1, this.stateTime / deflationDuration);
        if (this.inflationProgress <= 0) {
          this.inflationState = 'deflated';
          this.stateTime = 0;
          this.inflationProgress = 0;
          this.inflationCooldownTimer = inflationCooldown;
        }
        // If player comes back nearby while deflating, restart inflation (optional aggressive behavior)
        // if (distanceToPlayer < detectionRadius && this.inflationCooldownTimer <= 0) {
        //   this.inflationState = 'inflating';
        //   this.stateTime = this.inflationProgress * inflationDuration; // Start inflating from current progress
        // }
        break;
    }
    this.applyInflation(this.inflationProgress);

    // --- Bobbing Animation ---
    const bobFrequency = this.config.visuals.animationSpeed || 0.5; // Use general animationSpeed from config or default
    const bobAmplitude = this.config.visuals.animationAmplitude || 0.05; // Use general animationAmplitude or default
    // Ensure a unique seed for each pufferfish instance for desynchronized animation
    // Taking a simple char code sum from UUID for a phase offset
    let uuidPhase = 0;
    if (this.mesh && this.mesh.uuid) {
        for (let i = 0; i < this.mesh.uuid.length; i++) {
            uuidPhase += this.mesh.uuid.charCodeAt(i);
        }
        uuidPhase = (uuidPhase % 100) / 100; // Normalize to 0-1
    }
    this.mesh.position.y = Math.sin(this.animationTime * bobFrequency + uuidPhase * Math.PI * 2) * bobAmplitude;

    // --- Fin Animations (subtle movements) ---
    const finSpeed = (this.config.visuals.animationSpeed || 0.5) * 1.5; // Fins move a bit faster
    const finAmplitude = (this.config.visuals.animationAmplitude || 0.1) * 0.5; // Smaller amplitude for fins

    if (this.dorsalFin) {
      this.dorsalFin.rotation.z = Math.sin(this.animationTime * finSpeed * 1.1 + uuidPhase * Math.PI) * finAmplitude * 0.5;
    }
    if (this.tailFin) {
      this.tailFin.rotation.y = Math.sin(this.animationTime * finSpeed * 1.2 + uuidPhase * Math.PI * 1.2) * finAmplitude;
    }
    if (this.leftPectoralFin) {
      this.leftPectoralFin.rotation.z = Math.PI / 6 + Math.sin(this.animationTime * finSpeed + uuidPhase * Math.PI * 1.1) * finAmplitude;
    }
    if (this.rightPectoralFin) {
      this.rightPectoralFin.rotation.z = -Math.PI / 6 - Math.sin(this.animationTime * finSpeed + uuidPhase * Math.PI * 1.1) * finAmplitude;
    }
  }

  public reset(): void {
    if (this.mesh) {
      this.mesh.visible = true;
      if (this.bodyMesh) {
          this.bodyMesh.visible = true;
          this.bodyMesh.scale.set(1, 1, 1);
          if(this.collisionMesh) this.collisionMesh.scale.set(1,1,1);
          // Reset feature positions based on initial stored values before first inflation
          if(this.initialEyeLPos && this.leftEyeMesh) this.leftEyeMesh.position.copy(this.initialEyeLPos);
          if(this.initialEyeRPos && this.rightEyeMesh) this.rightEyeMesh.position.copy(this.initialEyeRPos);
          if(this.initialMouthPos && this.mouthMesh) this.mouthMesh.position.copy(this.initialMouthPos);
          if(this.initialDorsalFinPos && this.dorsalFin) this.dorsalFin.position.copy(this.initialDorsalFinPos);
          if(this.initialPectoralLFinPos && this.leftPectoralFin) this.leftPectoralFin.position.copy(this.initialPectoralLFinPos);
          if(this.initialPectoralRFinPos && this.rightPectoralFin) this.rightPectoralFin.position.copy(this.initialPectoralRFinPos);
          if(this.initialTailFinPos && this.tailFin) this.tailFin.position.copy(this.initialTailFinPos);
          if(this.spikesGroup) {
            this.spikesGroup.scale.set(1,1,1);
            this.individualSpikes.forEach(spike => spike.scale.set(1,1,1));
          }
      }
    }
    this.inflationProgress = 0;
    this.inflationState = 'deflated';
    this.animationTime = 0;
    this.stateTime = 0;
    this.applyInflation(0); // Apply 0 inflation on reset to ensure correct initial state
  }

  public dispose(): void {
    if (this.bodyMesh) { this.bodyMesh.geometry?.dispose(); if (this.bodyMesh.material instanceof THREE.Material) this.bodyMesh.material.dispose(); }
    if (this.collisionMesh) { this.collisionMesh.geometry?.dispose(); if (this.collisionMesh.material instanceof THREE.Material) this.collisionMesh.material.dispose(); }
    if (this.leftEyeMesh) { this.leftEyeMesh.geometry?.dispose(); if (this.leftEyeMesh.material instanceof THREE.Material) this.leftEyeMesh.material.dispose(); }
    if (this.rightEyeMesh) { this.rightEyeMesh.geometry?.dispose(); if (this.rightEyeMesh.material instanceof THREE.Material) this.rightEyeMesh.material.dispose(); }
    if (this.mouthMesh) { this.mouthMesh.geometry?.dispose(); if (this.mouthMesh.material instanceof THREE.Material) this.mouthMesh.material.dispose(); }

    [this.dorsalFin, this.leftPectoralFin, this.rightPectoralFin, this.tailFin].forEach(fin => {
      if (fin) {
        fin.geometry?.dispose();
        if (fin.material instanceof THREE.Material) fin.material.dispose(); 
      }
    });

    if (this.spikesGroup) {
        if (this.individualSpikes.length > 0) {
            const firstSpike = this.individualSpikes[0];
            if (firstSpike.geometry) firstSpike.geometry.dispose(); 
            if (firstSpike.material instanceof THREE.Material) firstSpike.material.dispose(); 
        }
        this.spikesGroup.clear();
    }
    this.individualSpikes = [];
    this.mesh?.clear();
  }

  public getMesh(): THREE.Group { return this.mesh; }
  public getCollisionObject(): THREE.Mesh { return this.collisionMesh; }
  public isDangerous(): boolean {
    // Pufferfish is dangerous if more than half inflated, for example.
    return this.inflationProgress > 0.5;
  }
} 
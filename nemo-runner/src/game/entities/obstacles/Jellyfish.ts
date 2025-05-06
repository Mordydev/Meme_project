import * as THREE from 'three';
import { Obstacle, ObstacleConfig } from './Obstacle';
import { detectDeviceCapabilities } from '../../utils/DeviceUtils';
import eventBus from '../../core/EventSystem';

/**
 * Configuration for jellyfish obstacles
 */
export interface JellyfishConfig extends ObstacleConfig {
  // Bell pulsation speed
  pulsateSpeed?: number;
  // Tentacle length
  tentacleLength?: number;
  // Drift speed for random movement
  driftSpeed?: number;
  // Glow intensity for bioluminescence
  glowIntensity?: number;
  // Color variation (0-1 for main color hue)
  colorVariation?: number;
}

/**
 * Jellyfish obstacle with pulsating bell, translucent tentacles, and potential bioluminescence
 */
export class Jellyfish extends Obstacle {
  // Movement patterns
  private driftSpeed: number = 0.3;
  private pulsateSpeed: number = 0.5;
  private hoverHeight: number = 0;
  private initialY: number = 0;
  private driftDirection: THREE.Vector3 = new THREE.Vector3();
  private driftOffset: THREE.Vector3 = new THREE.Vector3();
  private tentacleLength: number = 1.0;
  
  // Visual effects
  private glowIntensity: number = 0.5;
  private colorHue: number = 0.85; // Default to purple-ish
  private bellMaterial: THREE.Material | null = null;
  private tentacleMaterials: THREE.Material[] = [];
  private glowMaterial: THREE.Material | null = null;
  
  // Shape definition
  private bellRadius: number = 0.8;
  private bellHeight: number = 0.6;
  
  // Animation state
  private pulsationPhase: number = 0;
  private tentaclePhase: number = 0;
  private glowPhase: number = 0;
  
  // Mesh components
  private bell: THREE.Mesh | null = null;
  private tentacles: THREE.Group | null = null;
  private innerGlow: THREE.Mesh | null = null;
  private particleSystem: THREE.Points | null = null;
  
  // Visual quality tracking
  private deviceCapabilities = detectDeviceCapabilities();
  // quality is declared in parent class as protected
  
  /**
   * Create a jellyfish obstacle
   */
  constructor(scene: THREE.Scene, qualityLevel: 'high' | 'medium' | 'low') {
    super(scene, qualityLevel);
    
    this.quality = qualityLevel;
    this.obstacleType = 'jellyfish';
    
    // Create the jellyfish mesh
    this.mesh = this.createJellyfishMesh();
    
    // Set up collider - elongated box for bell and tentacles
    this.collider = new THREE.Box3(
      new THREE.Vector3(-this.bellRadius, -this.tentacleLength, -this.bellRadius),
      new THREE.Vector3(this.bellRadius, this.bellHeight, this.bellRadius)
    );
    
    // Add shadow casting
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Jellyfish casts very subtle shadows
        object.castShadow = true;
        object.receiveShadow = false;
      }
    });
    
    // Set random initial pulsation phase
    this.pulsationPhase = Math.random() * Math.PI * 2;
    this.tentaclePhase = Math.random() * Math.PI * 2;
    this.glowPhase = Math.random() * Math.PI * 2;
    
    // Set random drift direction
    this.setRandomDriftDirection();
  }
  
  /**
   * Create jellyfish mesh with appropriate detail level
   */
  private createJellyfishMesh(): THREE.Group {
    // Create main group
    const jellyfishGroup = new THREE.Group();
    jellyfishGroup.name = 'jellyfish';
    
    // Determine detail levels based on quality
    const bellSegments = this.quality === 'high' ? 24 : 
                        this.quality === 'medium' ? 16 : 12;
    const tentacleCount = this.quality === 'high' ? 12 : 
                         this.quality === 'medium' ? 8 : 6;
    
    // Create bell (top dome)
    const bellGeometry = new THREE.SphereGeometry(
      this.bellRadius, 
      bellSegments, 
      bellSegments / 2, 
      0, Math.PI * 2, 
      0, Math.PI / 2
    );
    
    // Make the bell slightly elliptical
    const bellPositions = bellGeometry.attributes.position;
    const bellVertex = new THREE.Vector3();
    
    for (let i = 0; i < bellPositions.count; i++) {
      bellVertex.fromBufferAttribute(bellPositions, i);
      bellVertex.y *= 0.75; // Flatten the dome slightly
      bellPositions.setXYZ(i, bellVertex.x, bellVertex.y, bellVertex.z);
    }
    
    bellGeometry.computeVertexNormals();
    
    // Create bell material - translucent with subtle sheen
    let bellMaterial: THREE.Material;
    
    if (this.quality === 'high') {
      // High-quality translucent material with subsurface-like effect
      bellMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(this.colorHue, 0.8, 0.7),
        transparent: true,
        opacity: 0.8,
        transmission: 0.4, // Transmission effect for high-quality
        thickness: 0.3,    // Thickness for transmission calculation
        roughness: 0.3,
        metalness: 0.0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
        side: THREE.DoubleSide
      });
    } else {
      // Simpler material for medium/low quality
      bellMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(this.colorHue, 0.8, 0.7),
        transparent: true,
        opacity: 0.7,
        roughness: 0.3,
        metalness: 0.0,
        side: THREE.DoubleSide
      });
    }
    
    this.bellMaterial = bellMaterial;
    
    // Create the bell mesh
    this.bell = new THREE.Mesh(bellGeometry, bellMaterial);
    this.bell.name = 'bell';
    
    // Position the bell in the group
    this.bell.position.set(0, this.bellHeight, 0);
    jellyfishGroup.add(this.bell);
    
    // Create inner glow for high and medium quality
    if (this.quality !== 'low') {
      const glowGeometry = new THREE.SphereGeometry(
        this.bellRadius * 0.8,
        bellSegments / 2,
        bellSegments / 4,
        0, Math.PI * 2,
        0, Math.PI / 2
      );
      
      // Apply same flattening to glow
      const glowPositions = glowGeometry.attributes.position;
      const glowVertex = new THREE.Vector3();
      
      for (let i = 0; i < glowPositions.count; i++) {
        glowVertex.fromBufferAttribute(glowPositions, i);
        glowVertex.y *= 0.7; // Slightly more flattened
        glowPositions.setXYZ(i, glowVertex.x, glowVertex.y, glowVertex.z);
      }
      
      glowGeometry.computeVertexNormals();
      
      // Create glow material
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(this.colorHue, 0.6, 0.8),
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
      });
      
      this.glowMaterial = glowMaterial;
      
      // Create the glow mesh
      this.innerGlow = new THREE.Mesh(glowGeometry, glowMaterial);
      this.innerGlow.name = 'inner_glow';
      this.innerGlow.position.copy(this.bell.position);
      jellyfishGroup.add(this.innerGlow);
    }
    
    // Create tentacles
    this.tentacles = new THREE.Group();
    this.tentacles.name = 'tentacles';
    
    // Create tentacle material - more translucent than bell
    const tentacleMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(this.colorHue, 0.7, 0.6),
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    
    this.tentacleMaterials.push(tentacleMaterial);
    
    // Add tentacles
    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI * 2;
      const radius = this.bellRadius * (0.5 + 0.5 * Math.random());
      
      const tentacle = this.createTentacle(
        this.tentacleLength * (0.8 + 0.4 * Math.random()),
        tentacleMaterial,
        i
      );
      
      // Position around the bell edge with slight randomization
      tentacle.position.set(
        Math.sin(angle) * radius,
        0,
        Math.cos(angle) * radius
      );
      
      this.tentacles.add(tentacle);
    }
    
    // Position tentacles under the bell
    this.tentacles.position.set(0, this.bell.position.y - 0.05, 0);
    jellyfishGroup.add(this.tentacles);
    
    // Add particle system for high quality
    if (this.quality === 'high') {
      this.particleSystem = this.createParticleSystem();
      jellyfishGroup.add(this.particleSystem);
    }
    
    return jellyfishGroup;
  }
  
  /**
   * Create a tentacle mesh with segments
   */
  private createTentacle(length: number, material: THREE.Material, index: number): THREE.Group {
    const tentacleGroup = new THREE.Group();
    tentacleGroup.name = `tentacle_${index}`;
    
    // Determine segment count based on quality
    const segmentCount = this.quality === 'high' ? 8 : 
                        this.quality === 'medium' ? 6 : 4;
    
    // Create segments with diminishing size
    for (let i = 0; i < segmentCount; i++) {
      const segmentHeight = length / segmentCount;
      const topRadius = this.bellRadius * 0.15 * (1 - i / segmentCount);
      const bottomRadius = this.bellRadius * 0.1 * (1 - (i + 1) / segmentCount);
      
      // Create tapered cylinder for main tentacle
      const segmentGeometry = new THREE.CylinderGeometry(
        topRadius, bottomRadius, segmentHeight, 6, 1
      );
      
      const segment = new THREE.Mesh(segmentGeometry, material);
      segment.position.set(0, -segmentHeight * i - segmentHeight / 2, 0);
      tentacleGroup.add(segment);
      
      // Add small frills for high quality
      if (this.quality === 'high' && i < segmentCount - 1) {
        this.addTentacleFrills(segment, topRadius, index + i);
      }
    }
    
    return tentacleGroup;
  }
  
  /**
   * Add decorative frills to tentacle segments
   */
  private addTentacleFrills(parentSegment: THREE.Mesh, radius: number, seed: number): void {
    // Create 2-4 small frills
    const frillCount = 2 + Math.floor(Math.random() * 3);
    
    // Create a more translucent material for frills
    const frillMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(this.colorHue, 0.6, 0.7),
      transparent: true,
      opacity: 0.5,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    
    this.tentacleMaterials.push(frillMaterial);
    
    // Generate random offset based on seed
    const randomOffset = seed * 1.5;
    
    for (let i = 0; i < frillCount; i++) {
      const angle = ((i / frillCount) * Math.PI * 2) + randomOffset;
      
      // Create a small thin box for the frill
      const frillGeometry = new THREE.BoxGeometry(
        radius * 2, 0.01, radius * 0.5
      );
      
      const frill = new THREE.Mesh(frillGeometry, frillMaterial);
      
      // Position and rotate around tentacle
      frill.position.set(
        Math.sin(angle) * radius * 0.8,
        0,
        Math.cos(angle) * radius * 0.8
      );
      
      frill.rotation.y = angle;
      parentSegment.add(frill);
    }
  }
  
  /**
   * Create particle system for bioluminescent effect
   */
  private createParticleSystem(): THREE.Points {
    // Particles only for high quality
    const particleCount = 30;
    const particleGeometry = new THREE.BufferGeometry();
    
    // Create positions with random distribution inside bell
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      // Position within bell volume
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI / 2);
      const radius = Math.random() * this.bellRadius * 0.7;
      
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius + this.bellHeight;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
      
      // Color - based on jellyfish color but brighter
      const color = new THREE.Color().setHSL(
        this.colorHue + Math.random() * 0.05,
        0.6,
        0.8 + Math.random() * 0.2
      );
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Random sizes
      sizes[i] = 0.03 + Math.random() * 0.04;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material with custom shader to render points as glowing dots
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    return new THREE.Points(particleGeometry, particleMaterial);
  }
  
  /**
   * Initialize with configuration
   */
  public initialize(config: JellyfishConfig): void {
    super.initialize(config);
    
    // Store initial position for drift calculation
    this.initialY = this.position.y;
    
    // Initialize jellyfish-specific properties
    this.pulsateSpeed = config.pulsateSpeed || 0.5;
    this.tentacleLength = config.tentacleLength || 1.0;
    this.driftSpeed = config.driftSpeed || 0.3;
    
    // Set color variation if specified
    if (config.colorVariation !== undefined) {
      this.setColor(config.colorVariation);
    }
    
    // Set glow intensity if specified
    if (config.glowIntensity !== undefined) {
      this.setGlowIntensity(config.glowIntensity);
    }
    
    // Update collider based on tentacle length
    if (this.collider instanceof THREE.Box3) {
      this.collider.min.y = -this.tentacleLength;
    }
    
    // Start in idle state
    this.state = 'idle';
    
    // Set random drift direction
    this.setRandomDriftDirection();
  }
  
  /**
   * Set color variation for the jellyfish
   */
  private setColor(hue: number): void {
    // Update color hue (0-1 range)
    this.colorHue = Math.max(0, Math.min(1, hue));
    
    // Update bell material
    if (this.bellMaterial) {
      if ('color' in this.bellMaterial) {
        (this.bellMaterial as any).color.setHSL(this.colorHue, 0.8, 0.7);
      }
    }
    
    // Update tentacle materials
    this.tentacleMaterials.forEach(material => {
      if ('color' in material) {
        (material as any).color.setHSL(this.colorHue, 0.7, 0.6);
      }
    });
    
    // Update glow material
    if (this.glowMaterial && 'color' in this.glowMaterial) {
      (this.glowMaterial as any).color.setHSL(this.colorHue, 0.6, 0.8);
    }
    
    // Update particle colors
    if (this.particleSystem) {
      const colors = this.particleSystem.geometry.attributes.color;
      
      for (let i = 0; i < colors.count; i++) {
        const color = new THREE.Color().setHSL(
          this.colorHue + Math.random() * 0.05,
          0.6,
          0.8 + Math.random() * 0.2
        );
        
        colors.setXYZ(i, color.r, color.g, color.b);
      }
      
      colors.needsUpdate = true;
    }
  }
  
  /**
   * Set glow intensity for bioluminescence
   */
  private setGlowIntensity(intensity: number): void {
    // Clamp intensity between 0 and 1
    this.glowIntensity = Math.max(0, Math.min(1, intensity));
    
    // Update glow material opacity
    if (this.glowMaterial) {
      this.glowMaterial.opacity = 0.3 * this.glowIntensity;
    }
    
    // Update particle system opacity
    if (this.particleSystem && this.particleSystem.material instanceof THREE.PointsMaterial) {
      this.particleSystem.material.opacity = 0.7 * this.glowIntensity;
    }
  }
  
  /**
   * Set random drift direction
   */
  private setRandomDriftDirection(): void {
    // Random horizontal movement
    this.driftDirection.set(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2
    );
    this.driftDirection.normalize();
    
    // Reset drift offset
    this.driftOffset.set(0, 0, 0);
  }
  
  /**
   * Update collider position
   */
  protected updateCollider(): void {
    if (this.collider instanceof THREE.Box3) {
      // Calculate the box size based on the bell radius and tentacle length
      const boxSizeX = this.bellRadius * 2;
      const boxSizeY = this.bellHeight + this.tentacleLength;
      const boxSizeZ = this.bellRadius * 2;
      
      // Create a size vector
      const size = new THREE.Vector3(boxSizeX, boxSizeY, boxSizeZ);
      
      // Calculate offsets to match the jellyfish's shape
      const offsetY = (this.bellHeight - this.tentacleLength) / 2;
      
      // Set the box min and max points based on the jellyfish position and dimensions
      this.collider.min.set(
        this.position.x - this.bellRadius,
        this.position.y - this.tentacleLength + offsetY,
        this.position.z - this.bellRadius
      );
      
      this.collider.max.set(
        this.position.x + this.bellRadius,
        this.position.y + this.bellHeight + offsetY,
        this.position.z + this.bellRadius
      );
    }
  }
  
  /**
   * Update idle state behavior
   */
  protected updateIdle(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Transition to active when player is close
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    if (distanceToPlayer < 50) {
      this.state = 'active';
    }
  }
  
  /**
   * Update active state behavior
   */
  protected updateActive(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Update pulsation animation
    this.updatePulsation(deltaTime);
    
    // Update tentacle movement
    this.updateTentacles(deltaTime);
    
    // Update glow effect
    this.updateGlow(deltaTime);
    
    // Update drift movement
    this.updateDrift(deltaTime);
    
    // Check if player is very close
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    if (distanceToPlayer < 5) {
      // Slightly increase pulsation when player is nearby
      this.pulsationPhase += deltaTime * 0.5;
    }
    
    // Detect collision and transition to triggered state
    if (distanceToPlayer < 2) {
      this.state = 'triggered';
      
      // Emit warning sound
      eventBus.emit('play-sound', { name: 'jellyfish-warn', volume: 0.5 });
    }
  }
  
  /**
   * Update triggered state behavior
   */
  protected updateTriggered(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Increase pulsation when triggered
    this.pulsationPhase += deltaTime * 2;
    
    // Increase glow intensity
    this.setGlowIntensity(Math.min(1.0, this.glowIntensity + deltaTime));
    
    // Continue pulsating and tentacle movement
    this.updatePulsation(deltaTime);
    this.updateTentacles(deltaTime);
    this.updateGlow(deltaTime);
    
    // Transition to cooldown after a short time
    setTimeout(() => {
      if (this.state === 'triggered') {
        this.state = 'cooldown';
      }
    }, 1000);
  }
  
  /**
   * Update cooldown state behavior
   */
  protected updateCooldown(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Gradually return to normal behavior
    this.updatePulsation(deltaTime * 0.5);
    this.updateTentacles(deltaTime * 0.7);
    this.updateGlow(deltaTime);
    
    // Reduce glow intensity
    this.setGlowIntensity(Math.max(0.5, this.glowIntensity - deltaTime * 0.5));
    
    // Return to active state after a delay
    setTimeout(() => {
      if (this.state === 'cooldown') {
        this.state = 'active';
      }
    }, 2000);
  }
  
  /**
   * Update pulsation animation
   */
  private updatePulsation(deltaTime: number): void {
    // Update pulsation phase
    this.pulsationPhase += deltaTime * this.pulsateSpeed * this.timeScale;
    
    // Calculate pulsation value (0 to 1)
    const pulsation = 0.15 * Math.sin(this.pulsationPhase) + 0.85;
    
    // Apply scaling to bell for pulsation effect
    if (this.bell) {
      this.bell.scale.set(pulsation, pulsation, pulsation);
    }
    
    // Scale inner glow slightly larger for effect
    if (this.innerGlow) {
      const glowPulsation = 0.2 * Math.sin(this.pulsationPhase + 0.5) + 0.9;
      this.innerGlow.scale.set(glowPulsation, glowPulsation, glowPulsation);
    }
    
    // Move tentacles based on pulsation for swimming effect
    const yOffset = Math.sin(this.pulsationPhase) * 0.05;
    if (this.tentacles && this.bell) {
      this.tentacles.position.y = this.bell.position.y - 0.05 + yOffset;
    }
  }
  
  /**
   * Update tentacle movement
   */
  private updateTentacles(deltaTime: number): void {
    // Update tentacle phase
    this.tentaclePhase += deltaTime * 0.8 * this.timeScale;
    
    // Apply wave-like movement to tentacles
    if (this.tentacles) {
      this.tentacles.children.forEach((tentacle, index) => {
        // Each tentacle has a slightly different phase
        const tentacleOffset = index * 0.5;
        const rotationX = Math.sin(this.tentaclePhase + tentacleOffset) * 0.1;
        const rotationZ = Math.cos(this.tentaclePhase + tentacleOffset) * 0.1;
        
        tentacle.rotation.x = rotationX;
        tentacle.rotation.z = rotationZ;
        
        // Swing tentacles more when pulsating
        const pulsationStrength = Math.sin(this.pulsationPhase) * 0.03;
        tentacle.position.y -= pulsationStrength;
      });
    }
  }
  
  /**
   * Update glow effect
   */
  private updateGlow(deltaTime: number): void {
    // Update glow phase
    this.glowPhase += deltaTime * 0.5 * this.timeScale;
    
    // Adjust glow opacity based on phase
    const glowPulsation = 0.3 * Math.sin(this.glowPhase) + 0.7;
    
    // Apply to glow material
    if (this.glowMaterial) {
      this.glowMaterial.opacity = 0.3 * this.glowIntensity * glowPulsation;
    }
    
    // Update particle positions for high-quality
    if (this.particleSystem) {
      const positions = this.particleSystem.geometry.attributes.position;
      const sizes = this.particleSystem.geometry.attributes.size;
      
      for (let i = 0; i < positions.count; i++) {
        // Apply subtle movement to particles
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Each particle has a unique movement pattern
        const particlePhase = this.glowPhase + i * 0.1;
        
        // Apply very subtle circular motion
        const radius = 0.02;
        const cx = x + Math.sin(particlePhase) * radius;
        const cz = z + Math.cos(particlePhase) * radius;
        
        positions.setXYZ(i, cx, y, cz);
        
        // Pulse particle sizes
        const sizePulse = 0.3 * Math.sin(particlePhase * 2) + 0.7;
        const baseSize = 0.03 + (i % 3) * 0.01;
        sizes.setX(i, baseSize * sizePulse);
      }
      
      positions.needsUpdate = true;
      sizes.needsUpdate = true;
    }
  }
  
  /**
   * Update drift movement
   */
  private updateDrift(deltaTime: number): void {
    // Calculate smooth drift movement
    this.driftOffset.x += this.driftDirection.x * this.driftSpeed * deltaTime * this.timeScale;
    this.driftOffset.z += this.driftDirection.z * this.driftSpeed * deltaTime * this.timeScale;
    
    // Limit drift range
    const maxDrift = 1.0;
    if (this.driftOffset.length() > maxDrift) {
      this.driftOffset.normalize().multiplyScalar(maxDrift);
      
      // Randomly change drift direction
      if (Math.random() < 0.02) {
        this.setRandomDriftDirection();
      }
    }
    
    // Apply vertical bobbing
    this.hoverHeight = Math.sin(this.pulsationPhase * 0.5) * 0.1;
    
    // Apply drift to position
    this.position.y = this.initialY + this.hoverHeight;
    this.mesh.position.copy(this.position);
    this.mesh.position.add(this.driftOffset);
  }
  
  /**
   * Collision response
   */
  public onCollision(): void {
    super.onCollision();
    
    // Intensify glow on collision
    this.setGlowIntensity(1.0);
    
    // Play sting sound
    eventBus.emit('play-sound', { name: 'jellyfish-sting', volume: 0.6 });
    
    // Increase pulsation speed temporarily
    const originalSpeed = this.pulsateSpeed;
    this.pulsateSpeed *= 2;
    
    // Reset after a short time
    setTimeout(() => {
      this.pulsateSpeed = originalSpeed;
    }, 1000);
  }
  
  /**
   * Reset for reuse from pool
   */
  public reset(): void {
    super.reset();
    
    // Reset jellyfish-specific properties
    this.pulsationPhase = Math.random() * Math.PI * 2;
    this.tentaclePhase = Math.random() * Math.PI * 2;
    this.glowPhase = Math.random() * Math.PI * 2;
    
    // Reset glow intensity
    this.setGlowIntensity(0.5);
    
    // Reset drift
    this.driftOffset.set(0, 0, 0);
    this.setRandomDriftDirection();
  }
}
import * as THREE from 'three';
import { Obstacle, ObstacleConfig } from './Obstacle';
import { detectDeviceCapabilities } from '../../utils/DeviceUtils';
import eventBus from '../../core/EventSystem';

/**
 * Configuration for pufferfish obstacles
 */
export interface PufferfishConfig extends ObstacleConfig {
  // Inflation speed when triggered
  inflationSpeed?: number;
  // Deflation speed when returning to normal
  deflationSpeed?: number;
  // Trigger radius for inflation
  triggerRadius?: number;
  // Maximum inflation size multiplier
  maxInflation?: number;
  // Duration to stay inflated in seconds
  inflationDuration?: number;
  // Color variation (0-1 for main color hue)
  colorVariation?: number;
  // Rotation speed when idle
  rotationSpeed?: number;
}

/**
 * Pufferfish obstacle that inflates when the player gets close
 */
export class Pufferfish extends Obstacle {
  // Inflation properties
  private inflationSpeed: number = 2.0;
  private deflationSpeed: number = 1.0;
  private currentInflation: number = 0.0;
  private maxInflation: number = 2.5;
  private triggerRadius: number = 4.0;
  private inflationDuration: number = 3.0;
  private inflationTimer: number = 0;
  
  // Movement and animation
  private rotationSpeed: number = 0.5;
  private bobSpeed: number = 0.3;
  private bobHeight: number = 0.2;
  private bobPhase: number = 0;
  private spinPhase: number = 0;
  
  // Visual properties
  private colorHue: number = 0.12; // Orange-yellow default
  private bodyMaterial: THREE.Material | null = null;
  private spikeMaterials: THREE.Material[] = [];
  
  // Mesh components
  private body: THREE.Mesh | null = null;
  private spikes: THREE.Group | null = null;
  private eyes: THREE.Group | null = null;
  
  // State tracking
  private isInflating: boolean = false;
  private isDeflating: boolean = false;
  private fullyInflated: boolean = false;
  
  // Visual quality tracking
  private deviceCapabilities = detectDeviceCapabilities();
  // quality is declared in parent class as protected
  
  /**
   * Create a pufferfish obstacle
   */
  constructor(scene: THREE.Scene, qualityLevel: 'high' | 'medium' | 'low') {
    super(scene, qualityLevel);
    
    this.quality = qualityLevel;
    this.obstacleType = 'pufferfish';
    
    // Create pufferfish mesh
    this.mesh = this.createPufferfishMesh();
    
    // Create spherical collider
    this.collider = new THREE.Sphere(new THREE.Vector3(), 0.5);
    
    // Set random animation phase offsets
    this.bobPhase = Math.random() * Math.PI * 2;
    this.spinPhase = Math.random() * Math.PI * 2;
    
    // Add shadow casting
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = false;
      }
    });
  }
  
  /**
   * Create pufferfish mesh based on quality level
   */
  private createPufferfishMesh(): THREE.Group {
    // Create main group
    const pufferfishGroup = new THREE.Group();
    pufferfishGroup.name = 'pufferfish';
    
    // Determine detail level based on quality
    const segments = this.quality === 'high' ? 24 : 
                    this.quality === 'medium' ? 16 : 12;
    const spikeCount = this.quality === 'high' ? 24 : 
                      this.quality === 'medium' ? 16 : 10;
    
    // Create body
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';
    
    // Create body geometry
    const bodyGeometry = new THREE.SphereGeometry(0.5, segments, segments);
    
    // Create body material
    let bodyMaterial: THREE.Material;
    
    if (this.quality === 'high') {
      // High-quality material with detailed properties
      bodyMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(this.colorHue, 0.8, 0.7),
        roughness: 0.7,
        metalness: 0.1,
        flatShading: false
      });
    } else {
      // Simpler material for medium/low quality
      bodyMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(this.colorHue, 0.8, 0.7),
        flatShading: this.quality === 'low'
      });
    }
    
    this.bodyMaterial = bodyMaterial;
    
    // Create body mesh
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.name = 'body_mesh';
    bodyGroup.add(this.body);
    
    // Create spikes
    this.spikes = new THREE.Group();
    this.spikes.name = 'spikes';
    
    // Create spike material
    const spikeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(this.colorHue, 0.5, 0.5),
      roughness: 0.8,
      metalness: 0.1
    });
    
    this.spikeMaterials.push(spikeMaterial);
    
    // Generate spikes in a fibonacci pattern for even distribution
    for (let i = 0; i < spikeCount; i++) {
      // Use golden ratio for even distribution on sphere
      const phi = Math.acos(1 - 2 * (i + 0.5) / spikeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      
      // Calculate position on unit sphere
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      
      // Create spike
      const spike = this.createSpike(spikeMaterial);
      
      // Position on sphere
      spike.position.set(x * 0.5, y * 0.5, z * 0.5);
      
      // Orient spike to point outward from center
      spike.lookAt(x * 2, y * 2, z * 2);
      
      // Adjust rotation to align spike
      spike.rotateX(Math.PI / 2);
      
      // Add to spikes group
      this.spikes.add(spike);
    }
    
    bodyGroup.add(this.spikes);
    
    // Create eyes
    this.eyes = new THREE.Group();
    this.eyes.name = 'eyes';
    
    // Add two eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.3, 0.2, 0.35);
    
    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.3, 0.2, 0.35);
    
    // Add white highlights for high and medium quality
    if (this.quality !== 'low') {
      const highlightGeometry = new THREE.SphereGeometry(0.03, 6, 6);
      const highlightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
      });
      
      const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      leftHighlight.position.set(0.33, 0.23, 0.38);
      
      const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      rightHighlight.position.set(-0.27, 0.23, 0.38);
      
      this.eyes.add(leftHighlight);
      this.eyes.add(rightHighlight);
    }
    
    this.eyes.add(leftEye);
    this.eyes.add(rightEye);
    
    bodyGroup.add(this.eyes);
    
    // Add details for high quality
    if (this.quality === 'high') {
      // Add mouth
      const mouthGeometry = new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const mouthMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x411d00,
        side: THREE.BackSide
      });
      
      const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
      mouth.scale.set(0.5, 0.3, 0.5);
      mouth.position.set(0, -0.1, 0.45);
      mouth.rotation.x = Math.PI;
      
      bodyGroup.add(mouth);
      
      // Add fins
      const finMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(this.colorHue, 0.6, 0.6),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      
      // Top fin
      const topFinGeometry = this.createFinGeometry(0.25, 0.15);
      const topFin = new THREE.Mesh(topFinGeometry, finMaterial);
      topFin.position.set(0, 0.5, 0);
      topFin.rotation.x = Math.PI / 2;
      
      // Side fins
      const leftFinGeometry = this.createFinGeometry(0.2, 0.12);
      const leftFin = new THREE.Mesh(leftFinGeometry, finMaterial);
      leftFin.position.set(0.5, 0, 0);
      leftFin.rotation.z = Math.PI / 2;
      
      const rightFinGeometry = this.createFinGeometry(0.2, 0.12);
      const rightFin = new THREE.Mesh(rightFinGeometry, finMaterial);
      rightFin.position.set(-0.5, 0, 0);
      rightFin.rotation.z = -Math.PI / 2;
      
      // Tail fin
      const tailFinGeometry = this.createFinGeometry(0.2, 0.15);
      const tailFin = new THREE.Mesh(tailFinGeometry, finMaterial);
      tailFin.position.set(0, 0, -0.5);
      tailFin.rotation.y = Math.PI;
      
      bodyGroup.add(topFin);
      bodyGroup.add(leftFin);
      bodyGroup.add(rightFin);
      bodyGroup.add(tailFin);
    }
    
    // Add body to main group
    pufferfishGroup.add(bodyGroup);
    
    return pufferfishGroup;
  }
  
  /**
   * Create a fin geometry
   */
  private createFinGeometry(height: number, width: number): THREE.BufferGeometry {
    // Create a triangular shape for a fin
    const finShape = new THREE.Shape();
    
    finShape.moveTo(0, 0);
    finShape.lineTo(width, 0);
    finShape.lineTo(0, height);
    finShape.lineTo(0, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: 0.02,
      bevelEnabled: false
    };
    
    return new THREE.ExtrudeGeometry(finShape, extrudeSettings);
  }
  
  /**
   * Create a spike mesh
   */
  private createSpike(material: THREE.Material): THREE.Mesh {
    // Create spike geometry based on quality
    let spikeGeometry: THREE.BufferGeometry;
    
    if (this.quality === 'high') {
      // Detailed spike for high quality
      spikeGeometry = new THREE.ConeGeometry(0.04, 0.15, 8);
    } else if (this.quality === 'medium') {
      // Simpler spike for medium quality
      spikeGeometry = new THREE.ConeGeometry(0.04, 0.15, 6);
    } else {
      // Very simple spike for low quality
      spikeGeometry = new THREE.ConeGeometry(0.04, 0.15, 4);
    }
    
    return new THREE.Mesh(spikeGeometry, material);
  }
  
  /**
   * Initialize with configuration
   */
  public initialize(config: PufferfishConfig): void {
    super.initialize(config);
    
    // Set pufferfish-specific properties
    this.inflationSpeed = config.inflationSpeed || 2.0;
    this.deflationSpeed = config.deflationSpeed || 1.0;
    this.triggerRadius = config.triggerRadius || 4.0;
    this.maxInflation = config.maxInflation || 2.5;
    this.inflationDuration = config.inflationDuration || 3.0;
    this.rotationSpeed = config.rotationSpeed || 0.5;
    
    // Set color variation if specified
    if (config.colorVariation !== undefined) {
      this.setColor(config.colorVariation);
    }
    
    // Reset inflation state
    this.currentInflation = 0.0;
    this.isInflating = false;
    this.isDeflating = false;
    this.fullyInflated = false;
    this.inflationTimer = 0;
    
    // Start in idle state
    this.state = 'idle';
  }
  
  /**
   * Set color variation for the pufferfish
   */
  private setColor(hue: number): void {
    // Update color hue (0-1 range)
    this.colorHue = Math.max(0, Math.min(1, hue));
    
    // Update body material
    if (this.bodyMaterial && 'color' in this.bodyMaterial) {
      (this.bodyMaterial as any).color.setHSL(this.colorHue, 0.8, 0.7);
    }
    
    // Update spike materials
    this.spikeMaterials.forEach(material => {
      if ('color' in material) {
        (material as any).color.setHSL(this.colorHue, 0.5, 0.5);
      }
    });
  }
  
  /**
   * Update obstacle state
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    super.update(deltaTime, playerPosition, gameSpeed);
    
    // Update animation phases
    this.bobPhase += deltaTime * this.bobSpeed * this.timeScale;
    this.spinPhase += deltaTime * this.rotationSpeed * this.timeScale;
    
    // Apply bobbing motion
    const bobOffset = Math.sin(this.bobPhase) * this.bobHeight;
    this.mesh.position.y = this.position.y + bobOffset;
    
    // Apply spinning (if not fully inflated)
    if (!this.fullyInflated) {
      this.mesh.rotation.y = this.spinPhase;
    }
    
    // Update based on current state
    switch (this.state) {
      case 'idle':
        this.updateIdle(deltaTime, playerPosition, gameSpeed);
        break;
      case 'active':
        this.updateActive(deltaTime, playerPosition, gameSpeed);
        break;
      case 'triggered':
        this.updateTriggered(deltaTime, playerPosition, gameSpeed);
        break;
      case 'cooldown':
        this.updateCooldown(deltaTime, playerPosition, gameSpeed);
        break;
    }
    
    // Update inflation/deflation
    this.updateInflation(deltaTime);
    
    // Update collider based on current inflation
    this.updateCollider();
  }
  
  /**
   * Update collider to match current inflation
   */
  protected updateCollider(): void {
    if (this.collider instanceof THREE.Sphere) {
      // Update radius based on current inflation
      const baseRadius = 0.5;
      const inflatedRadius = baseRadius * (1 + this.currentInflation);
      
      this.collider.radius = inflatedRadius;
      this.collider.center.copy(this.mesh.position);
    }
  }
  
  /**
   * Update idle state behavior - minimal animation
   */
  protected updateIdle(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Transition to active when player is nearby
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    if (distanceToPlayer < 50) {
      this.state = 'active';
    }
  }
  
  /**
   * Update active state behavior - normal swimming and player detection
   */
  protected updateActive(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Check if player is close enough to trigger inflation
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    if (distanceToPlayer < this.triggerRadius && !this.isInflating && !this.fullyInflated) {
      // Player is close, start inflation
      this.startInflation();
      this.state = 'triggered';
      
      // Play inflation sound
      eventBus.emit('play-sound', { name: 'pufferfish-inflate', volume: 0.5 });
    }
  }
  
  /**
   * Update triggered state behavior - inflation and maintaining inflated state
   */
  protected updateTriggered(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Handle inflation timer when fully inflated
    if (this.fullyInflated) {
      this.inflationTimer -= deltaTime;
      
      // Begin deflation after timer expires
      if (this.inflationTimer <= 0) {
        this.startDeflation();
        this.state = 'cooldown';
      }
    }
  }
  
  /**
   * Update cooldown state behavior - deflation and return to active state
   */
  protected updateCooldown(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Return to active state when fully deflated
    if (this.currentInflation <= 0) {
      this.state = 'active';
    }
  }
  
  /**
   * Start inflation process
   */
  private startInflation(): void {
    this.isInflating = true;
    this.isDeflating = false;
    this.fullyInflated = false;
  }
  
  /**
   * Start deflation process
   */
  private startDeflation(): void {
    this.isInflating = false;
    this.isDeflating = true;
    this.fullyInflated = false;
    
    // Play deflation sound
    eventBus.emit('play-sound', { name: 'pufferfish-deflate', volume: 0.4 });
  }
  
  /**
   * Update inflation/deflation animation
   */
  private updateInflation(deltaTime: number): void {
    // Handle inflation
    if (this.isInflating) {
      // Increase inflation value
      this.currentInflation += this.inflationSpeed * deltaTime;
      
      // Check if fully inflated
      if (this.currentInflation >= this.maxInflation) {
        this.currentInflation = this.maxInflation;
        this.isInflating = false;
        this.fullyInflated = true;
        this.inflationTimer = this.inflationDuration;
        
        // Play fully inflated sound
        eventBus.emit('play-sound', { name: 'pufferfish-inflated', volume: 0.4 });
      }
    }
    // Handle deflation
    else if (this.isDeflating) {
      // Decrease inflation value
      this.currentInflation -= this.deflationSpeed * deltaTime;
      
      // Check if fully deflated
      if (this.currentInflation <= 0) {
        this.currentInflation = 0;
        this.isDeflating = false;
      }
    }
    
    // Apply inflation scale to mesh
    if (this.body) {
      const scale = 1 + this.currentInflation;
      this.body.scale.set(scale, scale, scale);
    }
    
    // Apply inflation effect to spikes - they extend outward
    if (this.spikes) {
      this.spikes.children.forEach((spike, i) => {
        // Get original position (normalized direction from center)
        const direction = new THREE.Vector3()
          .copy(spike.position)
          .normalize();
        
        // Calculate new position based on inflation
        const distance = 0.5 * (1 + this.currentInflation);
        spike.position.copy(direction.multiplyScalar(distance));
        
        // Point outward from center
        spike.lookAt(spike.position.clone().multiplyScalar(2));
        spike.rotateX(Math.PI / 2);
      });
    }
    
    // Adjust eyes position when inflated
    if (this.eyes) {
      const eyeScale = 1 + this.currentInflation * 0.5; // Eyes grow less than body
      this.eyes.scale.set(eyeScale, eyeScale, eyeScale);
      
      // Move eyes to stay on the surface
      this.eyes.children.forEach(eye => {
        const direction = new THREE.Vector3()
          .copy(eye.position)
          .normalize();
        
        const distance = 0.5 * (1 + this.currentInflation * 0.8);
        eye.position.copy(direction.multiplyScalar(distance));
      });
    }
  }
  
  /**
   * Collision response
   */
  public onCollision(): void {
    super.onCollision();
    
    // If not already inflating or inflated, trigger inflation
    if (!this.isInflating && !this.fullyInflated) {
      this.startInflation();
      this.state = 'triggered';
      
      // Play inflation sound
      eventBus.emit('play-sound', { name: 'pufferfish-inflate', volume: 0.6 });
    }
  }
  
  /**
   * Reset for object pooling reuse
   */
  public reset(): void {
    super.reset();
    
    // Reset inflation state
    this.currentInflation = 0;
    this.isInflating = false;
    this.isDeflating = false;
    this.fullyInflated = false;
    this.inflationTimer = 0;
    
    // Reset animation phases
    this.bobPhase = Math.random() * Math.PI * 2;
    this.spinPhase = Math.random() * Math.PI * 2;
    
    // Reset scale
    if (this.body) {
      this.body.scale.set(1, 1, 1);
    }
    
    // Reset spike positions
    if (this.spikes) {
      this.spikes.children.forEach((spike, i) => {
        // Get direction from center (unit vector)
        const phi = Math.acos(1 - 2 * (i + 0.5) / this.spikes!.children.length);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
        
        // Calculate position on unit sphere
        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.sin(phi) * Math.sin(theta);
        const z = Math.cos(phi);
        
        // Position on sphere surface
        spike.position.set(x * 0.5, y * 0.5, z * 0.5);
        
        // Orient spike to point outward
        spike.lookAt(x * 2, y * 2, z * 2);
        spike.rotateX(Math.PI / 2);
      });
    }
    
    // Reset eye positions
    if (this.eyes) {
      this.eyes.scale.set(1, 1, 1);
      
      // Only reset if there are at least two eyes
      if (this.eyes.children.length >= 2) {
        // Left eye
        this.eyes.children[0].position.set(0.3, 0.2, 0.35);
        
        // Right eye
        this.eyes.children[1].position.set(-0.3, 0.2, 0.35);
        
        // Reset highlights if they exist
        if (this.eyes.children.length >= 4) {
          this.eyes.children[2].position.set(0.33, 0.23, 0.38);
          this.eyes.children[3].position.set(-0.27, 0.23, 0.38);
        }
      }
    }
  }
}
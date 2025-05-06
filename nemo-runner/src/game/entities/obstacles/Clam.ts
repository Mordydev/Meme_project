import * as THREE from 'three';
import { Obstacle, ObstacleConfig } from './Obstacle';
import { detectDeviceCapabilities } from '../../utils/DeviceUtils';
import eventBus from '../../core/EventSystem';

/**
 * Configuration for clam obstacles
 */
export interface ClamConfig extends ObstacleConfig {
  // Opening/closing cycle time in seconds
  cycleTime?: number;
  // Opening duration as a fraction of cycle (0-1)
  openDuration?: number;
  // Initial phase offset (0-1)
  phaseOffset?: number;
  // Maximum opening angle in radians
  maxOpenAngle?: number;
  // Pearl generation chance (0-1)
  pearlChance?: number;
  // Pattern type for timing sequences
  pattern?: 'regular' | 'random' | 'alternating' | 'sequence';
  // Pattern sequence for sequence type
  sequence?: number[];
}

/**
 * Clam obstacle that rhythmically opens and closes, blocking or allowing passage
 */
export class Clam extends Obstacle {
  // Opening/closing properties
  private cycleTime: number = 3.0;
  private openDuration: number = 0.5;
  private phaseOffset: number = 0.0;
  private maxOpenAngle: number = Math.PI * 0.7;
  private pearlChance: number = 0.3;
  
  // Animation state
  private currentPhase: number = 0;
  private isOpen: boolean = false;
  private prevIsOpen: boolean = false;
  private openTimer: number = 0;
  
  // Pattern behavior
  private pattern: 'regular' | 'random' | 'alternating' | 'sequence' = 'regular';
  private sequence: number[] = [0, 1, 1, 0];
  private sequenceIndex: number = 0;
  private randomTimer: number = 0;
  private randomInterval: number = 0;
  
  // Bubble trail effect params
  private nextBubbleTime: number = 0;
  private bubbleFrequency: number = 0.2;
  
  // Visual properties
  private pearlMaterial: THREE.Material | null = null;
  private shellMaterial: THREE.Material | null = null;
  private innerMaterial: THREE.Material | null = null;
  
  // Mesh components
  private bottomShell: THREE.Object3D | null = null;
  private topShell: THREE.Object3D | null = null;
  private pearl: THREE.Object3D | null = null;
  private hinge: THREE.Object3D | null = null;
  private bubbleEmitter: THREE.Points | null = null;
  
  // Visual quality tracking
  private deviceCapabilities = detectDeviceCapabilities();
  // quality is declared in parent class as protected
  private hasPearl: boolean = false;
  
  /**
   * Create a clam obstacle
   */
  constructor(scene: THREE.Scene, qualityLevel: 'high' | 'medium' | 'low') {
    super(scene, qualityLevel);
    
    this.quality = qualityLevel;
    this.obstacleType = 'clam';
    
    // Create clam mesh
    this.mesh = this.createClamMesh();
    
    // Create box collider - will be updated based on open/closed state
    this.collider = new THREE.Box3(
      new THREE.Vector3(-0.8, -0.3, -0.8),
      new THREE.Vector3(0.8, 0.3, 0.8)
    );
    
    // Initial random phase
    this.currentPhase = Math.random() * Math.PI * 2;
    
    // Set random initial state
    this.randomInterval = 2 + Math.random() * 3;
    
    // Add shadow casting
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }
  
  /**
   * Create clam mesh based on quality level
   */
  private createClamMesh(): THREE.Group {
    // Create main group
    const clamGroup = new THREE.Group();
    clamGroup.name = 'clam';
    
    // Determine detail level based on quality
    const segments = this.quality === 'high' ? 32 : 
                    this.quality === 'medium' ? 24 : 16;
    
    // Create hinge point for mounting shells
    this.hinge = new THREE.Group();
    this.hinge.name = 'hinge';
    clamGroup.add(this.hinge);
    
    // Create shell material
    let shellMaterial: THREE.Material;
    
    if (this.quality === 'high') {
      // High-quality material with detailed properties
      shellMaterial = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.3,
        metalness: 0.2,
        flatShading: false
      });
    } else {
      // Simpler material for medium/low quality
      shellMaterial = new THREE.MeshLambertMaterial({
        color: 0xeeeeee,
        flatShading: this.quality === 'low'
      });
    }
    
    this.shellMaterial = shellMaterial;
    
    // Create inner material with slightly different color/properties
    let innerMaterial: THREE.Material;
    
    if (this.quality === 'high') {
      innerMaterial = new THREE.MeshStandardMaterial({
        color: 0xf8f8f8,
        roughness: 0.1,
        metalness: 0.1,
        flatShading: false,
        side: THREE.DoubleSide
      });
    } else {
      innerMaterial = new THREE.MeshLambertMaterial({
        color: 0xf8f8f8,
        flatShading: this.quality === 'low',
        side: THREE.DoubleSide
      });
    }
    
    this.innerMaterial = innerMaterial;
    
    // Create bottom shell
    const bottomShellGroup = new THREE.Group();
    bottomShellGroup.name = 'bottom_shell';
    
    // Create shell shape
    const bottomShellGeometry = this.createShellGeometry(segments, false);
    const bottomShell = new THREE.Mesh(bottomShellGeometry, shellMaterial);
    bottomShellGroup.add(bottomShell);
    
    // Add inner part of bottom shell
    const bottomInnerGeometry = this.createShellGeometry(segments, false, 0.9);
    const bottomInner = new THREE.Mesh(bottomInnerGeometry, innerMaterial);
    bottomInner.position.y = 0.05;
    bottomShellGroup.add(bottomInner);
    
    // Add ripples to bottom shell
    this.addShellRipples(bottomShellGroup, false);
    
    // Lower the bottom shell slightly
    bottomShellGroup.position.y = -0.1;
    this.hinge.add(bottomShellGroup);
    this.bottomShell = bottomShellGroup;
    
    // Create top shell
    const topShellGroup = new THREE.Group();
    topShellGroup.name = 'top_shell';
    
    // Create shell shape
    const topShellGeometry = this.createShellGeometry(segments, true);
    const topShell = new THREE.Mesh(topShellGeometry, shellMaterial);
    topShellGroup.add(topShell);
    
    // Add inner part of top shell
    const topInnerGeometry = this.createShellGeometry(segments, true, 0.9);
    const topInner = new THREE.Mesh(topInnerGeometry, innerMaterial);
    topInner.position.y = -0.05;
    topShellGroup.add(topInner);
    
    // Add ripples to top shell
    this.addShellRipples(topShellGroup, true);
    
    // Raise the top shell slightly
    topShellGroup.position.y = 0.1;
    this.hinge.add(topShellGroup);
    this.topShell = topShellGroup;
    
    // Random chance to add pearl
    this.hasPearl = Math.random() < this.pearlChance;
    
    if (this.hasPearl) {
      // Create pearl
      const pearlGroup = new THREE.Group();
      pearlGroup.name = 'pearl';
      
      // Pearl material with subtle iridescence
      let pearlMaterial: THREE.Material;
      
      if (this.quality === 'high') {
        pearlMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.1,
          metalness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.2,
          iridescence: 0.3,
          iridescenceIOR: 1.5,
          ior: 2.0
        });
      } else {
        pearlMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.1,
          metalness: 0.3
        });
      }
      
      this.pearlMaterial = pearlMaterial;
      
      // Create pearl geometry
      const pearlGeometry = new THREE.SphereGeometry(
        0.3, 
        this.quality === 'high' ? 24 : 
        this.quality === 'medium' ? 16 : 8
      );
      
      const pearl = new THREE.Mesh(pearlGeometry, pearlMaterial);
      pearlGroup.add(pearl);
      
      // Add subtle glow effect for high quality
      if (this.quality === 'high') {
        const glowGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.2,
          side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        pearlGroup.add(glow);
      }
      
      // Position pearl in the center of the clam
      pearlGroup.position.set(0, 0, 0);
      bottomShellGroup.add(pearlGroup);
      this.pearl = pearlGroup;
    }
    
    // Add bubble emitter for high quality
    if (this.quality === 'high') {
      this.bubbleEmitter = this.createBubbleEmitter();
      clamGroup.add(this.bubbleEmitter);
    }
    
    return clamGroup;
  }
  
  /**
   * Create a shell-shaped geometry
   */
  private createShellGeometry(segments: number, isTop: boolean, scale: number = 1.0): THREE.BufferGeometry {
    // Start with a half-sphere for the basic shell shape
    const shellGeometry = new THREE.SphereGeometry(
      0.8 * scale, // radius
      segments,    // width segments 
      segments / 2, // height segments
      0, Math.PI * 2,
      0, Math.PI / 2
    );
    
    // Flatten the sphere to make it more like a shell
    const positions = shellGeometry.attributes.position as THREE.BufferAttribute;
    const count = positions.count;
    const shellVertex = new THREE.Vector3();
    
    for (let i = 0; i < count; i++) {
      shellVertex.fromBufferAttribute(positions, i);
      
      // Scale differently based on whether it's top or bottom
      if (isTop) {
        shellVertex.y *= 0.5; // Flatter for top shell
      } else {
        shellVertex.y *= 0.3; // Even flatter for bottom shell
      }
      
      // Add some curvature
      const distanceFromCenter = Math.sqrt(shellVertex.x * shellVertex.x + shellVertex.z * shellVertex.z);
      const heightFactor = 1.0 - Math.min(distanceFromCenter / 0.8, 1.0);
      
      // Introduce asymmetry to the shells
      if (isTop) {
        // Top shell curves upward more
        shellVertex.y += 0.15 * heightFactor * scale;
      } else {
        // Bottom shell is flatter
        shellVertex.y += 0.05 * heightFactor * scale;
      }
      
      // Add a slight asymmetry
      shellVertex.z -= 0.1;
      
      // Update position
      positions.setXYZ(i, shellVertex.x, shellVertex.y, shellVertex.z);
    }
    
    // Flip the top shell to face downward
    if (isTop) {
      const matrix = new THREE.Matrix4().makeRotationX(Math.PI);
      shellGeometry.applyMatrix4(matrix);
    }
    
    // Recompute normals to ensure lighting works correctly
    shellGeometry.computeVertexNormals();
    
    return shellGeometry;
  }
  
  /**
   * Add ripple details to shell
   */
  private addShellRipples(shellGroup: THREE.Group, isTop: boolean): void {
    // Skip ripples for low quality
    if (this.quality === 'low') return;
    
    const rippleCount = this.quality === 'high' ? 8 : 5;
    
    // Create ripples using toroidal rings
    for (let i = 0; i < rippleCount; i++) {
      // Calculate ripple radius based on index
      const radius = 0.7 - (i * 0.5 / rippleCount);
      
      // Only add ripples within the shell radius
      if (radius < 0.2) continue;
      
      // Ripple thickness
      const thickness = 0.03 * (1.0 - i / rippleCount);
      
      // Create ripple geometry
      const rippleGeometry = new THREE.TorusGeometry(
        radius,
        thickness,
        this.quality === 'high' ? 16 : 8,
        this.quality === 'high' ? 32 : 16,
        Math.PI
      );
      
      // Use same material as shell or create a default if null
      const material = this.shellMaterial || new THREE.MeshStandardMaterial({ color: 0xe5e5e5 });
      const ripple = new THREE.Mesh(rippleGeometry, material);
      
      // Position and rotate ripple
      ripple.rotation.x = Math.PI / 2;
      ripple.rotation.z = Math.PI;
      ripple.position.z = -0.05 - i * 0.01;
      
      // Apply different Y position based on shell
      if (isTop) {
        ripple.position.y = -0.1;
      } else {
        ripple.position.y = 0.1;
      }
      
      shellGroup.add(ripple);
    }
  }
  
  /**
   * Create bubble emitter for opening/closing effects
   */
  private createBubbleEmitter(): THREE.Points {
    // Only for high quality
    const particleCount = 20;
    const particleGeometry = new THREE.BufferGeometry();
    
    // Create positions array
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Initialize all particles at the origin
    // (They will be updated dynamically)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      // Random sizes
      sizes[i] = 0.05 + Math.random() * 0.1;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material with size attenuation
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(particleGeometry, particleMaterial);
  }
  
  /**
   * Emit bubbles when clam opens
   */
  private emitBubbles(): void {
    if (!this.bubbleEmitter || this.quality !== 'high') return;
    
    const positions = this.bubbleEmitter.geometry.attributes.position;
    const sizes = this.bubbleEmitter.geometry.attributes.size;
    
    // Emit 5 new bubbles
    for (let i = 0; i < 5; i++) {
      // Find an available bubble slot
      let index = Math.floor(Math.random() * positions.count);
      
      // Initial position near the hinge
      const x = (Math.random() - 0.5) * 0.5;
      const y = 0.5 + Math.random() * 0.2;
      const z = (Math.random() - 0.5) * 0.5;
      
      positions.setXYZ(index, x, y, z);
      
      // Random size
      sizes.setX(index, 0.05 + Math.random() * 0.1);
    }
    
    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    
    // Play bubble sound
    eventBus.emit('play-sound', { name: 'bubble-small', volume: 0.2 });
  }
  
  /**
   * Update bubbles
   */
  private updateBubbles(deltaTime: number): void {
    if (!this.bubbleEmitter) return;
    
    const positions = this.bubbleEmitter.geometry.attributes.position;
    const sizes = this.bubbleEmitter.geometry.attributes.size;
    
    // Update bubble positions
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // If bubble is active (y > 0)
      if (y > 0) {
        // Move upward
        const newY = y + deltaTime * (0.5 + Math.random() * 0.5);
        
        // Add slight wobble
        const wobbleAmount = 0.2;
        const newX = x + deltaTime * wobbleAmount * (Math.random() - 0.5);
        const newZ = z + deltaTime * wobbleAmount * (Math.random() - 0.5);
        
        // Update position
        positions.setXYZ(i, newX, newY, newZ);
        
        // Reduce size as bubble rises (creates fading effect)
        const size = sizes.getX(i);
        if (size > 0.01) {
          sizes.setX(i, size - deltaTime * 0.05);
        }
        
        // Reset bubble if it goes too high
        if (newY > 3) {
          positions.setXYZ(i, 0, -1, 0); // Move below to deactivate
        }
      }
    }
    
    positions.needsUpdate = true;
    sizes.needsUpdate = true;
  }
  
  /**
   * Initialize with configuration
   */
  public initialize(config: ClamConfig): void {
    super.initialize(config);
    
    // Set clam-specific properties
    this.cycleTime = config.cycleTime || 3.0;
    this.openDuration = config.openDuration || 0.5;
    this.phaseOffset = config.phaseOffset || Math.random();
    this.maxOpenAngle = config.maxOpenAngle || (Math.PI * 0.7);
    
    // Set pattern properties
    this.pattern = config.pattern || 'regular';
    if (config.sequence) {
      this.sequence = config.sequence;
    }
    
    // Offset the phase
    this.currentPhase = this.phaseOffset * Math.PI * 2;
    
    // Reset timers
    this.openTimer = 0;
    this.randomTimer = Math.random() * this.randomInterval;
    this.isOpen = false;
    this.prevIsOpen = false;
    
    // Reset bubble timer
    this.nextBubbleTime = 0;
    
    // Start in idle state
    this.state = 'idle';
  }
  
  /**
   * Update obstacle state
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    super.update(deltaTime, playerPosition, gameSpeed);
    
    // Update opening/closing behavior
    switch (this.pattern) {
      case 'regular':
        this.updateRegularPattern(deltaTime);
        break;
      case 'random':
        this.updateRandomPattern(deltaTime);
        break;
      case 'alternating':
        this.updateAlternatingPattern(deltaTime);
        break;
      case 'sequence':
        this.updateSequencePattern(deltaTime);
        break;
    }
    
    // Apply opening/closing animation
    this.updateShellAnimation(deltaTime);
    
    // Update bubbles
    this.updateBubbles(deltaTime);
    
    // Check for transitions between open/closed states
    if (this.isOpen !== this.prevIsOpen) {
      // Emit bubbles when opening
      if (this.isOpen) {
        this.emitBubbles();
        
        // Play open sound
        eventBus.emit('play-sound', { name: 'clam-open', volume: 0.4 });
      } else {
        // Play close sound
        eventBus.emit('play-sound', { name: 'clam-close', volume: 0.5 });
      }
      
      // Update previous state
      this.prevIsOpen = this.isOpen;
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
    
    // Update collider based on open/closed state
    this.updateCollider();
  }
  
  /**
   * Update regular timed pattern
   */
  private updateRegularPattern(deltaTime: number): void {
    // Update phase
    this.currentPhase += deltaTime / this.cycleTime * Math.PI * 2 * this.timeScale;
    
    // Keep phase in 0-2π range
    while (this.currentPhase >= Math.PI * 2) {
      this.currentPhase -= Math.PI * 2;
    }
    
    // Determine if clam should be open or closed based on phase
    // Open for openDuration percentage of the cycle
    this.isOpen = this.currentPhase < (this.openDuration * Math.PI * 2);
  }
  
  /**
   * Update random pattern
   */
  private updateRandomPattern(deltaTime: number): void {
    // Update random timer
    this.randomTimer -= deltaTime * this.timeScale;
    
    // Change state when timer expires
    if (this.randomTimer <= 0) {
      // Switch between open and closed
      this.isOpen = !this.isOpen;
      
      // Set new timer duration - shorter for open state
      if (this.isOpen) {
        // Open for shorter time
        this.randomTimer = this.openDuration * this.cycleTime;
      } else {
        // Closed for longer time
        this.randomTimer = (1 - this.openDuration) * this.cycleTime;
      }
      
      // Add some randomness
      this.randomTimer *= 0.8 + Math.random() * 0.4;
    }
  }
  
  /**
   * Update alternating pattern
   */
  private updateAlternatingPattern(deltaTime: number): void {
    // Update phase
    this.currentPhase += deltaTime / this.cycleTime * Math.PI * 2 * this.timeScale;
    
    // Keep phase in 0-2π range
    while (this.currentPhase >= Math.PI * 2) {
      this.currentPhase -= Math.PI * 2;
    }
    
    // Alternate between open and closed more frequently
    this.isOpen = this.currentPhase < Math.PI;
  }
  
  /**
   * Update sequence pattern
   */
  private updateSequencePattern(deltaTime: number): void {
    // Update phase
    this.currentPhase += deltaTime / this.cycleTime * Math.PI * 2 * this.timeScale;
    
    // Check if we've completed a cycle
    if (this.currentPhase >= Math.PI * 2) {
      this.currentPhase -= Math.PI * 2;
      
      // Move to next sequence element
      this.sequenceIndex = (this.sequenceIndex + 1) % this.sequence.length;
    }
    
    // Look up current sequence value (0 = closed, 1 = open)
    this.isOpen = this.sequence[this.sequenceIndex] === 1;
  }
  
  /**
   * Update shell animation based on open/closed state
   */
  private updateShellAnimation(deltaTime: number): void {
    // Calculate target angle based on open/closed state
    const targetAngle = this.isOpen ? this.maxOpenAngle : 0;
    
    // Apply rotation to top shell (it rotates around the hinge)
    if (this.topShell) {
      // Smooth interpolation
      const rotationSpeed = deltaTime * 5 * this.timeScale;
      
      // Current rotation
      const currentRotation = this.topShell.rotation.x;
      
      // Smooth movement toward target angle
      this.topShell.rotation.x = THREE.MathUtils.lerp(
        currentRotation,
        targetAngle,
        rotationSpeed
      );
    }
    
    // Update pearl glow if present
    if (this.pearl && this.quality === 'high') {
      // Make pearl glow stronger when open
      const glowOpacity = this.isOpen ? 0.4 : 0.2;
      
      // Apply to glow material if it exists
      if (this.pearl.children.length > 1) {
        const glowMesh = this.pearl.children[1];
        if (glowMesh instanceof THREE.Mesh && 
            glowMesh.material instanceof THREE.MeshBasicMaterial) {
          glowMesh.material.opacity = glowOpacity;
        }
      }
    }
  }
  
  /**
   * Update collider to match current open/closed state
   */
  protected updateCollider(): void {
    if (this.collider instanceof THREE.Box3) {
      // Base dimensions
      const width = 0.8;
      const depth = 0.8;
      
      // Height varies based on open/closed state
      let height: number;
      
      if (this.topShell) {
        // Use actual top shell rotation to determine height
        const openRatio = this.topShell.rotation.x / this.maxOpenAngle;
        
        // Height increases as the clam opens
        height = 0.3 + openRatio * 0.5;
      } else {
        // Fallback if topShell not available
        height = this.isOpen ? 0.8 : 0.3;
      }
      
      // Update box collider dimensions
      this.collider.min.set(
        this.position.x - width / 2,
        this.position.y - 0.15,
        this.position.z - depth / 2
      );
      
      this.collider.max.set(
        this.position.x + width / 2,
        this.position.y + height,
        this.position.z + depth / 2
      );
    }
  }
  
  /**
   * Update idle state behavior
   */
  protected updateIdle(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Transition to active when player is nearby
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    if (distanceToPlayer < 50) {
      this.state = 'active';
    }
  }
  
  /**
   * Update active state behavior
   */
  protected updateActive(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Check if player is very close
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    // If player is very close and clam is closed, transition to triggered
    if (distanceToPlayer < 2 && !this.isOpen) {
      this.state = 'triggered';
    } else if (this.isOpen && this.hasPearl && this.pearl &&
               distanceToPlayer < 2) {
      // Player gets close to an open clam with pearl
      this.collectPearl();
    }
  }
  
  /**
   * Update triggered state behavior
   */
  protected updateTriggered(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Forced open state when triggered
    this.isOpen = true;
    
    // Reset after a short delay
    this.openTimer += deltaTime;
    
    if (this.openTimer > 1.0) {
      this.openTimer = 0;
      this.state = 'cooldown';
    }
  }
  
  /**
   * Update cooldown state behavior
   */
  protected updateCooldown(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Allow normal pattern to resume
    // Return to active state after a short delay
    this.openTimer += deltaTime;
    
    if (this.openTimer > 1.0) {
      this.openTimer = 0;
      this.state = 'active';
    }
  }
  
  /**
   * Collect pearl and emit event
   */
  private collectPearl(): void {
    // Only if pearl exists and hasn't been collected
    if (!this.hasPearl || !this.pearl) return;
    
    // Emit collection event
    eventBus.emit('collect', { 
      type: 'pearl', 
      points: 50,
      position: this.position.clone()
    });
    
    // Play collection sound
    eventBus.emit('play-sound', { name: 'pearl-collect', volume: 0.6 });
    
    // Remove pearl
    if (this.bottomShell && this.pearl.parent) {
      this.pearl.parent.remove(this.pearl);
    }
    
    // Mark as collected
    this.hasPearl = false;
  }
  
  /**
   * Collision response
   */
  public onCollision(): void {
    super.onCollision();
    
    // If closed, force open on collision
    if (!this.isOpen) {
      this.state = 'triggered';
      
      // Play forced open sound
      eventBus.emit('play-sound', { name: 'clam-force-open', volume: 0.6 });
    }
  }
  
  /**
   * Reset for object pooling reuse
   */
  public reset(): void {
    super.reset();
    
    // Reset timers and state
    this.currentPhase = Math.random() * Math.PI * 2;
    this.isOpen = false;
    this.prevIsOpen = false;
    this.openTimer = 0;
    this.randomTimer = Math.random() * this.randomInterval;
    this.sequenceIndex = 0;
    
    // Reset shell rotation
    if (this.topShell) {
      this.topShell.rotation.x = 0;
    }
    
    // Reset bubble emitter
    if (this.bubbleEmitter) {
      const positions = this.bubbleEmitter.geometry.attributes.position;
      
      // Move all bubbles below to deactivate them
      for (let i = 0; i < positions.count; i++) {
        positions.setXYZ(i, 0, -1, 0);
      }
      
      positions.needsUpdate = true;
    }
    
    // Randomly regenerate pearl
    this.hasPearl = Math.random() < this.pearlChance;
    
    // Create new pearl if needed
    if (this.hasPearl && !this.pearl && this.bottomShell) {
      const pearlGroup = new THREE.Group();
      pearlGroup.name = 'pearl';
      
      // Use existing pearl material or create new one
      let pearlMaterial = this.pearlMaterial;
      if (!pearlMaterial) {
        pearlMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.1,
          metalness: 0.3
        });
        this.pearlMaterial = pearlMaterial;
      }
      
      // Create pearl geometry
      const pearlGeometry = new THREE.SphereGeometry(
        0.3, 
        this.quality === 'high' ? 24 : 
        this.quality === 'medium' ? 16 : 8
      );
      
      const pearl = new THREE.Mesh(pearlGeometry, pearlMaterial);
      pearlGroup.add(pearl);
      
      // Add subtle glow effect for high quality
      if (this.quality === 'high') {
        const glowGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.2,
          side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        pearlGroup.add(glow);
      }
      
      // Position pearl in the center of the clam
      pearlGroup.position.set(0, 0, 0);
      this.bottomShell.add(pearlGroup);
      this.pearl = pearlGroup;
    } else if (!this.hasPearl && this.pearl && this.pearl.parent) {
      // Remove pearl if it shouldn't be there
      this.pearl.parent.remove(this.pearl);
      this.pearl = null;
    }
  }
}
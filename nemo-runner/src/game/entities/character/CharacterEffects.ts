import * as THREE from 'three';
import eventBus from '../../core/EventSystem';
import { DeviceCapabilities } from '../../utils/DeviceUtils';

/**
 * Manages visual effects for the character
 */
export class CharacterEffects {
  // Core components
  private mesh: THREE.Group;
  private scene: THREE.Scene;
  private deviceCapabilities: DeviceCapabilities;
  
  // Effect properties
  private bubbleParticles: THREE.InstancedMesh | null = null;
  private bubbleCount: number = 30;
  private bubblePositions: Float32Array;
  private bubbleVelocities: Float32Array;
  private bubbleScales: Float32Array;
  private bubbleLifetimes: Float32Array;
  private bubbleMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  // Trail effect properties
  private lastBubbleTime: number = 0;
  private bubbleTrailRate: number = 0.1;
  
  // Power-up effects
  private powerUpMesh: THREE.Object3D | null = null;
  private powerUpActive: boolean = false;
  private powerUpType: string = '';
  
  // Effect settings based on device capabilities
  private maxBubbles: number;
  private useComplexEffects: boolean;
  
  constructor(
    mesh: THREE.Group,
    scene: THREE.Scene,
    deviceCapabilities: DeviceCapabilities
  ) {
    this.mesh = mesh;
    this.scene = scene;
    this.deviceCapabilities = deviceCapabilities;
    
    // Scale effect complexity based on device capabilities
    this.maxBubbles = deviceCapabilities.highEnd ? 30 : (deviceCapabilities.midRange ? 20 : 10);
    this.useComplexEffects = deviceCapabilities.highEnd || deviceCapabilities.midRange;
    
    // Initialize bubble arrays
    this.bubblePositions = new Float32Array(this.maxBubbles * 3);
    this.bubbleVelocities = new Float32Array(this.maxBubbles * 3);
    this.bubbleScales = new Float32Array(this.maxBubbles);
    this.bubbleLifetimes = new Float32Array(this.maxBubbles);
    
    // Set up effect systems
    this.initBubbleSystem();
  }
  
  /**
   * Initialize bubble particle system
   */
  private initBubbleSystem(): void {
    // Create bubble geometry - simpler for low-end devices
    const bubbleGeometry = this.deviceCapabilities.lowEnd
      ? new THREE.IcosahedronGeometry(0.5, 1) // Low poly for low-end
      : new THREE.SphereGeometry(0.5, 8, 6);  // Higher poly for better devices
    
    // Create bubble material with proper transparency
    const bubbleMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaeeff,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.4,
      emissive: 0x3399ff,
      emissiveIntensity: 0.2
    });
    
    // For low-end devices, use a simpler material
    if (this.deviceCapabilities.lowEnd) {
      bubbleMaterial.emissive.set(0x000000);
      bubbleMaterial.emissiveIntensity = 0;
    }
    
    // Create instanced mesh for efficient rendering
    this.bubbleParticles = new THREE.InstancedMesh(
      bubbleGeometry,
      bubbleMaterial,
      this.maxBubbles
    );
    this.bubbleParticles.name = 'character_bubbles';
    this.bubbleParticles.frustumCulled = false; // Prevent culling of bubble particles
    this.bubbleParticles.castShadow = false;
    this.bubbleParticles.receiveShadow = false;
    
    // Initialize all bubbles as inactive
    for (let i = 0; i < this.maxBubbles; i++) {
      this.bubbleLifetimes[i] = 0;
      this.bubbleMatrix.makeScale(0, 0, 0); // Scale to 0 to hide
      this.bubbleParticles.setMatrixAt(i, this.bubbleMatrix);
    }
    
    // Add to scene
    this.scene.add(this.bubbleParticles);
    
    console.log(`Initialized bubble system with ${this.maxBubbles} bubbles`);
  }
  
  /**
   * Create bubble trail behind the character
   */
  public createBubbleTrail(deltaTime: number): void {
    if (!this.mesh || !this.bubbleParticles) return;
    
    this.lastBubbleTime += deltaTime;
    
    // Only create new bubbles periodically
    if (this.lastBubbleTime >= this.bubbleTrailRate) {
      this.lastBubbleTime = 0;
      
      // Find an inactive bubble
      for (let i = 0; i < this.maxBubbles; i++) {
        if (this.bubbleLifetimes[i] <= 0) {
          // Activate this bubble
          this.activateBubble(i, 'trail');
          break;
        }
      }
    }
    
    // Update all active bubbles
    this.updateBubbles(deltaTime);
  }
  
  /**
   * Create a lane change start effect (burst of bubbles)
   */
  public createLaneChangeStartEffect(direction: 'LEFT' | 'RIGHT' | null): void {
    if (!this.mesh || !this.bubbleParticles || !direction) return;
    
    const burstCount = Math.min(5, this.maxBubbles / 4);
    let activatedCount = 0;
    
    // Create a burst of bubbles
    for (let i = 0; i < this.maxBubbles && activatedCount < burstCount; i++) {
      if (this.bubbleLifetimes[i] <= 0) {
        // Activate this bubble with lane change parameters
        this.activateBubble(i, 'lane_change_start', direction);
        activatedCount++;
      }
    }
    
    // Play sound effect
    eventBus.emit('play-sound', { name: 'bubble-burst', volume: 0.3 });
  }
  
  /**
   * Create trailing effect during lane change
   */
  public createLaneChangeTrailEffect(direction: 'LEFT' | 'RIGHT' | null, toCenter: boolean): void {
    if (!this.mesh || !this.bubbleParticles || !direction) return;
    
    // Find an inactive bubble
    for (let i = 0; i < this.maxBubbles; i++) {
      if (this.bubbleLifetimes[i] <= 0) {
        // Activate this bubble with lane change trail parameters
        this.activateBubble(i, 'lane_change_trail', direction, toCenter);
        break;
      }
    }
  }
  
  /**
   * Create a lane change finish effect
   */
  public createLaneChangeFinishEffect(lane: string): void {
    if (!this.mesh || !this.bubbleParticles) return;
    
    const burstCount = Math.min(3, this.maxBubbles / 6);
    let activatedCount = 0;
    
    // Create a small burst of bubbles
    for (let i = 0; i < this.maxBubbles && activatedCount < burstCount; i++) {
      if (this.bubbleLifetimes[i] <= 0) {
        // Activate this bubble
        this.activateBubble(i, 'lane_change_finish');
        activatedCount++;
      }
    }
  }
  
  /**
   * Create hit effect when character is hit by obstacle
   */
  public createHitEffect(): void {
    if (!this.mesh || !this.bubbleParticles) return;
    
    // Bigger burst on hit
    const burstCount = Math.min(10, this.maxBubbles / 2);
    let activatedCount = 0;
    
    // Create a burst of bubbles in all directions
    for (let i = 0; i < this.maxBubbles && activatedCount < burstCount; i++) {
      if (this.bubbleLifetimes[i] <= 0) {
        // Activate this bubble with hit parameters
        this.activateBubble(i, 'hit');
        activatedCount++;
      }
    }
    
    // Flash effect on the character
    if (this.useComplexEffects) {
      this.createFlashEffect();
    }
    
    // Emit event for hit animation and sound
    eventBus.emit('play-sound', { name: 'character-hit', volume: 0.5 });
  }
  
  /**
   * Create temporary flash effect on character
   */
  private createFlashEffect(): void {
    // Traverse all meshes in character and flash them
    this.mesh.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh && object.material) {
        const originalEmissive = new THREE.Color();
        
        // Store original emissive value if it exists
        if (object.material instanceof THREE.MeshStandardMaterial ||
            object.material instanceof THREE.MeshPhysicalMaterial) {
          originalEmissive.copy(object.material.emissive);
          
          // Flash to white briefly
          object.material.emissive.set(0xffffff);
          
          // Restore original after delay
          setTimeout(() => {
            if (object.material instanceof THREE.MeshStandardMaterial ||
                object.material instanceof THREE.MeshPhysicalMaterial) {
              object.material.emissive.copy(originalEmissive);
            }
          }, 100);
        }
      }
    });
  }
  
  /**
   * Create power-up effect
   */
  public createPowerUpEffect(type: string, duration: number): void {
    if (!this.mesh) return;
    
    this.powerUpActive = true;
    this.powerUpType = type;
    
    // Different effects based on power-up type
    switch (type) {
      case 'speed':
        this.createSpeedPowerUpEffect();
        break;
      case 'shield':
        this.createShieldPowerUpEffect();
        break;
      case 'magnet':
        this.createMagnetPowerUpEffect();
        break;
      default:
        // Generic power-up effect
        this.createGenericPowerUpEffect();
    }
    
    // Emit sound event
    eventBus.emit('play-sound', { name: `powerup-${type}`, volume: 0.4 });
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removePowerUpEffect();
    }, duration * 1000);
  }
  
  /**
   * Create speed power-up effect - trailing particles
   */
  private createSpeedPowerUpEffect(): void {
    if (!this.useComplexEffects) {
      this.createGenericPowerUpEffect();
      return;
    }
    
    // Increase bubble trail rate
    this.bubbleTrailRate = 0.05;
    
    // Add speed lines if not low-end device
    if (!this.deviceCapabilities.lowEnd) {
      // Create speed line geometry
      const speedLineGeometry = new THREE.CylinderGeometry(0.01, 0.01, 3, 6, 1);
      speedLineGeometry.rotateX(Math.PI / 2);
      
      // Speed line material
      const speedLineMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.3
      });
      
      // Create speed line mesh
      this.powerUpMesh = new THREE.Mesh(speedLineGeometry, speedLineMaterial);
      this.powerUpMesh.position.set(0, 0, 2); // Behind character
      this.mesh.add(this.powerUpMesh);
    }
  }
  
  /**
   * Create shield power-up effect - protective bubble
   */
  private createShieldPowerUpEffect(): void {
    if (!this.useComplexEffects) {
      this.createGenericPowerUpEffect();
      return;
    }
    
    // Create shield geometry
    const shieldGeometry = new THREE.SphereGeometry(1.2, 16, 12);
    
    // Shield material with shimmer effect
    const shieldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      metalness: 0.1,
      roughness: 0.2,
      transparent: true,
      opacity: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });
    
    // Create shield mesh
    this.powerUpMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    this.mesh.add(this.powerUpMesh);
    
    // Add pulsing animation
    const pulseAnimation = () => {
      if (!this.powerUpMesh || !this.powerUpActive) return;
      
      // Pulse size
      const scale = 1 + 0.05 * Math.sin(Date.now() * 0.003);
      this.powerUpMesh.scale.set(scale, scale, scale);
      
      // Continue animation if still active
      if (this.powerUpActive) {
        requestAnimationFrame(pulseAnimation);
      }
    };
    
    // Start animation
    pulseAnimation();
  }
  
  /**
   * Create magnet power-up effect - orbiting particles
   */
  private createMagnetPowerUpEffect(): void {
    if (!this.useComplexEffects) {
      this.createGenericPowerUpEffect();
      return;
    }
    
    // Create container for magnet effect
    this.powerUpMesh = new THREE.Group();
    this.powerUpMesh.name = 'magnet_effect';
    this.mesh.add(this.powerUpMesh);
    
    // Number of orbiting particles
    const particleCount = this.deviceCapabilities.highEnd ? 5 : 3;
    
    // Create orbiting particles
    for (let i = 0; i < particleCount; i++) {
      // Particle geometry
      const particleGeometry = new THREE.SphereGeometry(0.1, 8, 6);
      
      // Particle material
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.7
      });
      
      // Create particle mesh
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Set initial position in orbit
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.5;
      particle.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
      
      // Store orbit data
      particle.userData = {
        orbitSpeed: 0.5 + Math.random() * 0.5,
        orbitRadius: radius,
        orbitPhase: angle,
        orbitY: (Math.random() - 0.5) * 0.5 // Y variation
      };
      
      this.powerUpMesh.add(particle);
    }
    
    // Add orbital animation
    const orbitAnimation = () => {
      if (!this.powerUpMesh || !this.powerUpActive) return;
      
      // Update each particle's position
      this.powerUpMesh.children.forEach((particle: THREE.Object3D) => {
        const data = particle.userData;
        data.orbitPhase += data.orbitSpeed * 0.05;
        
        particle.position.set(
          Math.cos(data.orbitPhase) * data.orbitRadius,
          Math.sin(data.orbitPhase) * data.orbitRadius + data.orbitY,
          Math.sin(data.orbitPhase * 2) * 0.5 // Add some z-axis movement
        );
      });
      
      // Continue animation if still active
      if (this.powerUpActive) {
        requestAnimationFrame(orbitAnimation);
      }
    };
    
    // Start animation
    orbitAnimation();
  }
  
  /**
   * Create a generic power-up effect for low-end devices or fallback
   */
  private createGenericPowerUpEffect(): void {
    // Create a simple glow effect
    this.mesh.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh && object.material) {
        if (object.material instanceof THREE.MeshStandardMaterial ||
            object.material instanceof THREE.MeshPhysicalMaterial) {
          // Increase emissive for glow
          object.material.emissive.set(0x0066ff);
          object.material.emissiveIntensity = 0.3;
        }
      }
    });
  }
  
  /**
   * Remove active power-up effect
   */
  public removePowerUpEffect(): void {
    if (!this.mesh) return;
    
    this.powerUpActive = false;
    this.powerUpType = '';
    
    // Reset bubble trail rate
    this.bubbleTrailRate = 0.1;
    
    // Remove any power-up mesh
    if (this.powerUpMesh) {
      if (this.powerUpMesh.parent) {
        this.powerUpMesh.parent.remove(this.powerUpMesh);
      }
      this.powerUpMesh = null;
    }
    
    // Reset any material changes
    this.mesh.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh && object.material) {
        if (object.material instanceof THREE.MeshStandardMaterial ||
            object.material instanceof THREE.MeshPhysicalMaterial) {
          // Reset emissive
          object.material.emissive.set(0x000000);
          object.material.emissiveIntensity = 0;
        }
      }
    });
  }
  
  /**
   * Activate a bubble with appropriate parameters
   */
  private activateBubble(
    index: number, 
    type: 'trail' | 'lane_change_start' | 'lane_change_trail' | 'lane_change_finish' | 'hit',
    direction: 'LEFT' | 'RIGHT' | null = null,
    toCenter: boolean = false
  ): void {
    if (!this.mesh || !this.bubbleParticles) return;
    
    // Base position behind character
    const positionOffset = new THREE.Vector3(0, 0, 0.6);
    
    // Base velocity upward and random 
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      Math.random() * 0.5 + 0.5,
      Math.random() * 0.2 - 0.1
    );
    
    // Base scale and lifetime
    let scale = Math.random() * 0.2 + 0.1;
    let lifetime = Math.random() * 2 + 1;
    
    // Adjust parameters based on effect type
    switch (type) {
      case 'trail':
        // Regular bubble trail - behind character
        positionOffset.set(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.2,
          0.8 + Math.random() * 0.4
        );
        scale = Math.random() * 0.15 + 0.05;
        lifetime = Math.random() * 1.5 + 0.5;
        break;
        
      case 'lane_change_start':
        // Direction-based burst
        const directionFactor = direction === 'LEFT' ? -1 : 1;
        positionOffset.set(
          directionFactor * (Math.random() * 0.2 + 0.1),
          (Math.random() - 0.5) * 0.3,
          Math.random() * 0.4
        );
        velocity.set(
          directionFactor * (Math.random() * 0.8 + 0.4),
          Math.random() * 0.5 + 0.2,
          (Math.random() - 0.5) * 0.3
        );
        scale = Math.random() * 0.2 + 0.1;
        lifetime = Math.random() * 0.8 + 0.4;
        break;
        
      case 'lane_change_trail':
        // Motion trail during lane change
        const trailDirFactor = direction === 'LEFT' ? -1 : 1;
        positionOffset.set(
          toCenter ? trailDirFactor * 0.3 : 0,
          (Math.random() - 0.5) * 0.2,
          Math.random() * 0.2
        );
        velocity.set(
          trailDirFactor * (Math.random() * 0.4 + 0.2),
          Math.random() * 0.3 + 0.1,
          (Math.random() - 0.5) * 0.2
        );
        scale = Math.random() * 0.15 + 0.05;
        lifetime = Math.random() * 0.6 + 0.3;
        break;
        
      case 'lane_change_finish':
        // Small celebration at lane change end
        positionOffset.set(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.3
        );
        velocity.set(
          (Math.random() - 0.5) * 0.3,
          Math.random() * 0.6 + 0.2,
          (Math.random() - 0.5) * 0.3
        );
        scale = Math.random() * 0.15 + 0.1;
        lifetime = Math.random() * 0.7 + 0.4;
        break;
        
      case 'hit':
        // Explosion in all directions
        positionOffset.set(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        );
        velocity.set(
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 2.0
        );
        scale = Math.random() * 0.25 + 0.15;
        lifetime = Math.random() * 0.8 + 0.6;
        break;
    }
    
    // Apply character position to offset
    const bubblePos = this.mesh.position.clone().add(positionOffset);
    
    // Store position
    const baseIndex = index * 3;
    this.bubblePositions[baseIndex] = bubblePos.x;
    this.bubblePositions[baseIndex + 1] = bubblePos.y;
    this.bubblePositions[baseIndex + 2] = bubblePos.z;
    
    // Store velocity
    this.bubbleVelocities[baseIndex] = velocity.x;
    this.bubbleVelocities[baseIndex + 1] = velocity.y;
    this.bubbleVelocities[baseIndex + 2] = velocity.z;
    
    // Store scale and lifetime
    this.bubbleScales[index] = scale;
    this.bubbleLifetimes[index] = lifetime;
    
    // Update the instance matrix
    this.bubbleMatrix.makeTranslation(bubblePos.x, bubblePos.y, bubblePos.z);
    this.bubbleMatrix.scale(new THREE.Vector3(scale, scale, scale));
    this.bubbleParticles.setMatrixAt(index, this.bubbleMatrix);
    
    // Mark instance matrix as needing update
    this.bubbleParticles.instanceMatrix.needsUpdate = true;
  }
  
  /**
   * Update all active bubble particles
   */
  private updateBubbles(deltaTime: number): void {
    if (!this.bubbleParticles) return;
    
    let needsUpdate = false;
    
    // Update each bubble
    for (let i = 0; i < this.maxBubbles; i++) {
      // Skip inactive bubbles
      if (this.bubbleLifetimes[i] <= 0) continue;
      
      // Update lifetime
      this.bubbleLifetimes[i] -= deltaTime;
      
      // If bubble expired, hide it
      if (this.bubbleLifetimes[i] <= 0) {
        this.bubbleMatrix.makeScale(0, 0, 0);
        this.bubbleParticles.setMatrixAt(i, this.bubbleMatrix);
        needsUpdate = true;
        continue;
      }
      
      // Get current position
      const baseIndex = i * 3;
      const posX = this.bubblePositions[baseIndex];
      const posY = this.bubblePositions[baseIndex + 1];
      const posZ = this.bubblePositions[baseIndex + 2];
      
      // Apply velocity
      const newPosX = posX + this.bubbleVelocities[baseIndex] * deltaTime;
      const newPosY = posY + this.bubbleVelocities[baseIndex + 1] * deltaTime;
      const newPosZ = posZ + this.bubbleVelocities[baseIndex + 2] * deltaTime;
      
      // Store new position
      this.bubblePositions[baseIndex] = newPosX;
      this.bubblePositions[baseIndex + 1] = newPosY;
      this.bubblePositions[baseIndex + 2] = newPosZ;
      
      // Apply slight upward acceleration over time (buoyancy)
      this.bubbleVelocities[baseIndex + 1] += deltaTime * 0.1;
      
      // Add some wobble
      this.bubbleVelocities[baseIndex] += (Math.random() - 0.5) * 0.05 * deltaTime;
      this.bubbleVelocities[baseIndex + 2] += (Math.random() - 0.5) * 0.05 * deltaTime;
      
      // Fade out as lifetime ends
      const fadeScale = Math.min(this.bubbleLifetimes[i], 0.3) / 0.3;
      const scale = this.bubbleScales[i] * fadeScale;
      
      // Update the instance matrix
      this.bubbleMatrix.makeTranslation(newPosX, newPosY, newPosZ);
      this.bubbleMatrix.scale(new THREE.Vector3(scale, scale, scale));
      this.bubbleParticles.setMatrixAt(i, this.bubbleMatrix);
      
      needsUpdate = true;
    }
    
    // Update all instances if needed
    if (needsUpdate) {
      this.bubbleParticles.instanceMatrix.needsUpdate = true;
    }
  }
  
  /**
   * Update power-up effects
   */
  public update(deltaTime: number): void {
    // Update bubble particles
    this.updateBubbles(deltaTime);
    
    // Update power-up specific effects
    if (this.powerUpActive && this.powerUpType === 'speed') {
      // Update speed effect - create more bubbles
      this.createBubbleTrail(deltaTime * 2);
    }
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.bubbleParticles) {
      // Dispose of geometry and material
      this.bubbleParticles.geometry.dispose();
      
      if (this.bubbleParticles.material instanceof THREE.Material) {
        this.bubbleParticles.material.dispose();
      } else if (Array.isArray(this.bubbleParticles.material)) {
        this.bubbleParticles.material.forEach(material => material.dispose());
      }
      
      // Remove from scene
      if (this.bubbleParticles.parent) {
        this.bubbleParticles.parent.remove(this.bubbleParticles);
      }
      
      this.bubbleParticles = null;
    }
    
    // Clean up power-up effects
    this.removePowerUpEffect();
  }
}
import * as THREE from 'three';
import eventBus from '../../core/EventSystem';
import { CollectibleType } from './CollectibleManager';
import { createShaderWithLibrary } from '../../utils/ShaderLibrary';

/**
 * Manages visual effects for active power-ups
 */
export class PowerUpEffects {
  private scene: THREE.Scene;
  private character: THREE.Object3D | null = null;
  
  // Effect meshes
  private shieldEffect: THREE.Mesh | null = null;
  private speedBoostEffect: THREE.Points | null = null;
  private magnetAuraEffect: THREE.Mesh | null = null;
  private timeSlowEffect: THREE.Group | null = null;
  private scoreMultiplierEffect: THREE.Mesh | null = null;
  
  // Shader time tracking
  private currentTime = 0;
  
  // Effect shaders and materials
  private shieldMaterial: THREE.ShaderMaterial | null = null;
  private speedBoostMaterial: THREE.ShaderMaterial | null = null;
  private magnetAuraMaterial: THREE.ShaderMaterial | null = null;
  private timeSlowMaterial: THREE.ShaderMaterial | null = null;
  private scoreMultiplierMaterial: THREE.ShaderMaterial | null = null;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initEventListeners();
  }
  
  /**
   * Set the character mesh to attach effects to
   */
  public setCharacter(character: THREE.Object3D): void {
    this.character = character;
  }
  
  /**
   * Initialize event listeners for power-up events
   */
  private initEventListeners(): void {
    eventBus.on('powerup-activated', (data: {type: string, duration: number}) => {
      this.activatePowerUpEffect(data.type as CollectibleType);
    });
    
    eventBus.on('powerup-deactivated', (data: {type: string}) => {
      this.deactivatePowerUpEffect(data.type as CollectibleType);
    });
  }
  
  /**
   * Update effects with animation
   */
  public update(deltaTime: number): void {
    // Update time for shader animations
    this.currentTime += deltaTime;
    
    // Update shader uniforms
    this.updateShaderUniforms();
    
    // Update speed boost particles if active
    if (this.speedBoostEffect) {
      this.updateSpeedBoostParticles(deltaTime);
    }
  }
  
  /**
   * Update shader uniforms for all active effect materials
   */
  private updateShaderUniforms(): void {
    // Shield effect
    if (this.shieldMaterial && this.shieldMaterial.uniforms) {
      this.shieldMaterial.uniforms.uTime.value = this.currentTime;
    }
    
    // Speed boost effect
    if (this.speedBoostMaterial && this.speedBoostMaterial.uniforms) {
      this.speedBoostMaterial.uniforms.uTime.value = this.currentTime;
    }
    
    // Magnet aura effect
    if (this.magnetAuraMaterial && this.magnetAuraMaterial.uniforms) {
      this.magnetAuraMaterial.uniforms.uTime.value = this.currentTime;
    }
    
    // Time slow effect
    if (this.timeSlowMaterial && this.timeSlowMaterial.uniforms) {
      this.timeSlowMaterial.uniforms.uTime.value = this.currentTime;
    }
    
    // Score multiplier effect
    if (this.scoreMultiplierMaterial && this.scoreMultiplierMaterial.uniforms) {
      this.scoreMultiplierMaterial.uniforms.uTime.value = this.currentTime;
    }
  }
  
  /**
   * Activate a power-up effect
   */
  public activatePowerUpEffect(type: CollectibleType): void {
    if (!this.character) return;
    
    switch (type) {
      case CollectibleType.POWERUP_SHIELD:
        this.activateShieldEffect();
        break;
      case CollectibleType.POWERUP_SPEED:
        this.activateSpeedBoostEffect();
        break;
      case CollectibleType.POWERUP_MAGNET:
        this.activateMagnetEffect();
        break;
      case CollectibleType.POWERUP_TIME:
        this.activateTimeSlowEffect();
        break;
      case CollectibleType.POWERUP_SCORE:
        this.activateScoreMultiplierEffect();
        break;
    }
  }
  
  /**
   * Deactivate a power-up effect
   */
  public deactivatePowerUpEffect(type: CollectibleType): void {
    if (!this.character) return;
    
    switch (type) {
      case CollectibleType.POWERUP_SHIELD:
        this.deactivateShieldEffect();
        break;
      case CollectibleType.POWERUP_SPEED:
        this.deactivateSpeedBoostEffect();
        break;
      case CollectibleType.POWERUP_MAGNET:
        this.deactivateMagnetEffect();
        break;
      case CollectibleType.POWERUP_TIME:
        this.deactivateTimeSlowEffect();
        break;
      case CollectibleType.POWERUP_SCORE:
        this.deactivateScoreMultiplierEffect();
        break;
    }
  }
  
  /**
   * Clean up all resources
   */
  public dispose(): void {
    // Remove all event listeners with empty callbacks
    eventBus.off('powerup-activated', () => {});
    eventBus.off('powerup-deactivated', () => {});
    
    // Remove and dispose shield effect
    this.deactivateShieldEffect();
    
    // Remove and dispose speed boost effect
    this.deactivateSpeedBoostEffect();
    
    // Remove and dispose magnet effect
    this.deactivateMagnetEffect();
    
    // Remove and dispose time slow effect
    this.deactivateTimeSlowEffect();
    
    // Remove and dispose score multiplier effect
    this.deactivateScoreMultiplierEffect();
  }
  
  // SHIELD EFFECT
  
  /**
   * Activate shield effect
   */
  private activateShieldEffect(): void {
    if (!this.character) return;
    
    if (!this.shieldEffect) {
      const shieldMesh = this.createShieldEffect();
      this.character.add(shieldMesh);
      this.shieldEffect = shieldMesh;
    }
  }
  
  /**
   * Create shield effect mesh
   */
  private createShieldEffect(): THREE.Mesh {
    // Shield vertex shader with library includes
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vFresnelFactor;
      uniform float uTime;
      uniform float uNoiseAmount; // How much noise deforms the shield

      // Include noise functions from shader library
      #include <noise>

      void main() {
          vec3 pos = position;
          
          // Apply noise-based deformation
          float noise = fbm(
              vec2(pos.x * 2.0 + uTime * 0.3,
                   pos.z * 2.0 + uTime * 0.2), 
              4, 0.5
          ) * uNoiseAmount;
          pos += normal * noise; // Displace along normal
          
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          vec4 mvPosition = viewMatrix * worldPos;
          
          vNormal = normalize(normalMatrix * normal);
          
          // Fresnel calculation using library function
          vec3 viewVector = normalize(mvPosition.xyz);
          vFresnelFactor = calculateFresnel(vNormal, viewVector, 4.0);
          
          gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    // Shield fragment shader with library includes
    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vFresnelFactor;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPulseIntensity;
      
      // Include utility functions
      #include <noise>
      #include <animation>

      void main() {
          // Fresnel edge glow
          float fresnel = smoothstep(0.0, 1.0, vFresnelFactor) * 0.8 + 0.2;
          
          // Pulsating effect using library function
          float pulse = pulsate(uTime, 4.0, 0.0, 1.0);
          float glow = 0.5 + pulse * uPulseIntensity;
          
          // Hexagonal grid pattern
          vec2 coord = vWorldPosition.xy * 2.5 + vec2(uTime * 0.1, -uTime * 0.05);
          float hexNoise = noise(coord) + 0.5 * noise(coord * 2.0) + 0.25 * noise(coord * 4.0);
          float hexPattern = smoothstep(0.45, 0.5, abs(fract(hexNoise * 6.0) * 2.0 - 1.0));
          
          // Combine colors and effects
          vec3 baseColor = uColor * glow * fresnel;
          float baseAlpha = uOpacity * glow * fresnel;
          
          // Apply hex pattern
          vec3 finalColor = mix(baseColor * 0.5, baseColor * 1.2, hexPattern);
          float finalAlpha = mix(baseAlpha * 0.3, baseAlpha, hexPattern);
          
          gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `;
    
    // Use shader library to process includes
    const processedShaders = createShaderWithLibrary(vertexShader, fragmentShader);
    
    // Create shield material
    this.shieldMaterial = new THREE.ShaderMaterial({
      vertexShader: processedShaders.vertexShader,
      fragmentShader: processedShaders.fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0x00BFFF) }, // DeepSkyBlue
        uOpacity: { value: 0.4 },
        uPulseIntensity: { value: 0.6 },
        uNoiseAmount: { value: 0.05 }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide // Render inner surface for bubble-like effect
    });
    
    // Create shield geometry
    const geometry = new THREE.IcosahedronGeometry(1.4, 3);
    
    // Create shield mesh
    return new THREE.Mesh(geometry, this.shieldMaterial);
  }
  
  /**
   * Deactivate shield effect
   */
  private deactivateShieldEffect(): void {
    if (this.shieldEffect && this.character) {
      this.character.remove(this.shieldEffect);
      this.shieldEffect.geometry.dispose();
      if (this.shieldMaterial) {
        this.shieldMaterial.dispose();
        this.shieldMaterial = null;
      }
      this.shieldEffect = null;
    }
  }
  
  // SPEED BOOST EFFECT
  
  /**
   * Activate speed boost effect
   */
  private activateSpeedBoostEffect(): void {
    if (!this.character) return;
    
    if (!this.speedBoostEffect) {
      const speedBoostParticles = this.createSpeedBoostParticles();
      // Position slightly behind the character
      speedBoostParticles.position.z = -1.0;
      this.character.add(speedBoostParticles);
      this.speedBoostEffect = speedBoostParticles;
    }
  }
  
  /**
   * Create speed boost particle effect
   */
  private createSpeedBoostParticles(count: number = 50): THREE.Points {
    // Particle vertex shader with library includes
    const vertexShader = `
      attribute float aLifetime;
      attribute vec3 aVelocity;
      varying float vLifetime;
      
      uniform float uTime;
      uniform float uTravelDistance;
      
      // Include utility functions
      #include <transition>
      
      void main() {
          vLifetime = aLifetime;
          
          // Position moves from origin along velocity direction based on lifetime
          vec3 pos = position + aVelocity * uTravelDistance * aLifetime;
          
          // Adjust size based on lifetime (start small, grow, then shrink)
          float sizeFactor = sin(aLifetime * 3.14159);
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          // Scale particle size based on distance from camera
          gl_PointSize = 3.0 * sizeFactor * (300.0 / -mvPosition.z);
          
          gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    // Particle fragment shader with library includes
    const fragmentShader = `
      varying float vLifetime;
      uniform vec3 uColor;
      
      // Include transition utilities
      #include <transition>
      
      void main() {
          // Create circular particles with smooth edges
          float dist = length(gl_PointCoord - vec2(0.5));
          float alpha = smootherstep(0.5, 0.4, dist, 0.8);
          
          // Adjust alpha based on lifetime with smoother transitions
          alpha *= smootherstep(0.0, 0.2, vLifetime, 0.8) * (1.0 - smootherstep(0.5, 1.0, vLifetime, 0.8));
          
          // Brighten center
          float strength = 1.0 - smootherstep(0.0, 0.5, dist, 0.8);
          
          gl_FragColor = vec4(uColor * strength * 1.5, alpha * 0.8);
      }
    `;
    
    // Use shader library to process includes
    const processedShaders = createShaderWithLibrary(vertexShader, fragmentShader);
    
    // Create particle material
    this.speedBoostMaterial = new THREE.ShaderMaterial({
      vertexShader: processedShaders.vertexShader,
      fragmentShader: processedShaders.fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0xFFD700) }, // Gold
        uTravelDistance: { value: 5.0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    
    // Create particle attributes
    const positions = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    
    // Initialize all particles
    for (let i = 0; i < count; i++) {
      // Start at origin
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      // Start with lifetime > 1 to hide initially
      lifetimes[i] = 1.1;
      
      // Default velocity backward
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = -1;
    }
    
    // Set geometry attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aLifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    
    // Create particles mesh
    const particles = new THREE.Points(geometry, this.speedBoostMaterial);
    
    // Store particle state for animation
    particles.userData = {
      particles: Array(count).fill(0).map(() => ({
        lifetime: 1.1,
        velocity: new THREE.Vector3(0, 0, -1)
      })),
      spawnTimer: 0,
      spawnRate: 0.02,  // Spawn rate in seconds
      isActive: true
    };
    
    return particles;
  }
  
  /**
   * Update speed boost particle animation
   */
  private updateSpeedBoostParticles(deltaTime: number): void {
    if (!this.speedBoostEffect) return;
    
    const particles = this.speedBoostEffect;
    const userData = particles.userData;
    
    // Update spawn timer
    userData.spawnTimer -= deltaTime;
    const canSpawn = userData.isActive && userData.spawnTimer <= 0;
    let spawnedThisFrame = false;
    
    // Get attributes
    const lifetimeAttr = particles.geometry.getAttribute('aLifetime') as THREE.BufferAttribute;
    const velocityAttr = particles.geometry.getAttribute('aVelocity') as THREE.BufferAttribute;
    const particleStates = userData.particles;
    
    // Base velocity - points backward from character
    const baseVelocity = new THREE.Vector3(0, 0, -1).multiplyScalar(5.0);
    
    for (let i = 0; i < particleStates.length; i++) {
      let p = particleStates[i];
      
      // Update lifetime
      p.lifetime += deltaTime * 0.8;
      
      if (p.lifetime < 1.0) {
        // Particle is active, update its lifetime
        lifetimeAttr.setX(i, p.lifetime);
      } else {
        // Particle is inactive, potentially spawn a new one
        if (canSpawn && !spawnedThisFrame) {
          // Reset lifetime
          p.lifetime = 0;
          
          // Set random velocity direction
          p.velocity.copy(baseVelocity)
            .add(new THREE.Vector3(
              (Math.random() - 0.5) * 2.0,
              (Math.random() - 0.5) * 2.0,
              (Math.random() - 0.5) * 0.5
            )).normalize();
          
          // Update attributes
          lifetimeAttr.setX(i, p.lifetime);
          velocityAttr.setXYZ(i, p.velocity.x, p.velocity.y, p.velocity.z);
          
          // Mark as spawned and reset timer
          spawnedThisFrame = true;
          userData.spawnTimer = userData.spawnRate;
        } else {
          // Keep hidden
          lifetimeAttr.setX(i, 1.1);
        }
      }
    }
    
    // Update geometry attributes
    lifetimeAttr.needsUpdate = true;
    if (spawnedThisFrame) {
      velocityAttr.needsUpdate = true;
    }
  }
  
  /**
   * Deactivate speed boost effect
   */
  private deactivateSpeedBoostEffect(): void {
    if (this.speedBoostEffect && this.character) {
      // Set as inactive to stop spawning new particles
      this.speedBoostEffect.userData.isActive = false;
      
      // Remove after all particles fade out
      setTimeout(() => {
        if (this.speedBoostEffect && this.character) {
          this.character.remove(this.speedBoostEffect);
          this.speedBoostEffect.geometry.dispose();
          if (this.speedBoostMaterial) {
            this.speedBoostMaterial.dispose();
            this.speedBoostMaterial = null;
          }
          this.speedBoostEffect = null;
        }
      }, 1000); // Wait 1 second for particles to fade out
    }
  }
  
  // MAGNET EFFECT
  
  /**
   * Activate magnet effect
   */
  private activateMagnetEffect(): void {
    if (!this.character) return;
    
    if (!this.magnetAuraEffect) {
      const magnetMesh = this.createMagnetEffect();
      this.character.add(magnetMesh);
      this.magnetAuraEffect = magnetMesh;
    }
  }
  
  /**
   * Create magnet effect
   */
  private createMagnetEffect(): THREE.Mesh {
    // Reuse shield shader but with different parameters
    if (!this.shieldMaterial) {
      // If shield material doesn't exist yet, create it first
      const shieldMesh = this.createShieldEffect();
      this.shieldMaterial = shieldMesh.material as THREE.ShaderMaterial;
      shieldMesh.geometry.dispose();
    }
    
    // Create magnet material by cloning shield material
    this.magnetAuraMaterial = this.shieldMaterial.clone() as THREE.ShaderMaterial;
    
    // Update uniforms for magnet effect
    this.magnetAuraMaterial.uniforms = THREE.UniformsUtils.clone(this.shieldMaterial.uniforms);
    this.magnetAuraMaterial.uniforms.uColor.value = new THREE.Color(0xFF4500); // OrangeRed
    this.magnetAuraMaterial.uniforms.uOpacity.value = 0.15; // Less opaque
    this.magnetAuraMaterial.uniforms.uPulseIntensity.value = 0.2; // Subtler pulse
    this.magnetAuraMaterial.uniforms.uNoiseAmount.value = 0.02; // Less deformation
    
    // Set material properties
    this.magnetAuraMaterial.side = THREE.FrontSide; // Render outer side
    
    // Create slightly smaller geometry
    const geometry = new THREE.IcosahedronGeometry(1.3, 2);
    
    // Create mesh
    return new THREE.Mesh(geometry, this.magnetAuraMaterial);
  }
  
  /**
   * Deactivate magnet effect
   */
  private deactivateMagnetEffect(): void {
    if (this.magnetAuraEffect && this.character) {
      this.character.remove(this.magnetAuraEffect);
      this.magnetAuraEffect.geometry.dispose();
      if (this.magnetAuraMaterial) {
        this.magnetAuraMaterial.dispose();
        this.magnetAuraMaterial = null;
      }
      this.magnetAuraEffect = null;
    }
  }
  
  // TIME SLOW EFFECT
  
  /**
   * Activate time slow effect
   */
  private activateTimeSlowEffect(): void {
    if (!this.character) return;
    
    if (!this.timeSlowEffect) {
      const timeSlowMesh = this.createTimeSlowEffect();
      this.character.add(timeSlowMesh);
      this.timeSlowEffect = timeSlowMesh;
    }
  }
  
  /**
   * Create time slow effect
   */
  private createTimeSlowEffect(): THREE.Group {
    // Create group to hold time effect parts
    const group = new THREE.Group();
    
    // Time slow vertex shader with library includes
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform float uTime;
      
      void main() {
          vUv = uv;
          vPosition = position;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    // Time slow fragment shader with library includes
    const fragmentShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uRippleSpeed;
      uniform float uRippleWidth;
      uniform float uRippleFrequency;
      
      // Include utilities
      #include <animation>
      #include <transition>
      #include <water>
      
      void main() {
          // Time ripple effect - concentric rings emanating outward
          float dist = length(vPosition.xz);
          float ripple = sin(dist * uRippleFrequency - uTime * uRippleSpeed);
          
          // Create ring pattern with smooth edges
          float ring = smootherstep(0.0, uRippleWidth, abs(ripple), 0.7);
          
          // Add slight wave to the entire plane using animation oscillate
          float wave = oscillate(uTime, 10.0, 0.1, 0.0) * 
                      oscillate(uTime, 8.0, 0.1, 3.14159);
          
          // Add caustics effect from water utility
          float causticEffect = caustics(vUv, uTime, 2.0) * 0.3;
          
          // Final color with ripple + wave effects
          vec3 finalColor = uColor * (0.4 + 0.6 * ring + wave + causticEffect);
          
          // Fade out at edges using transition utility
          float edgeFade = 1.0 - transitionMask(dist, 0.8, 1.0, 0.6);
          float alpha = uOpacity * ring * edgeFade;
          
          gl_FragColor = vec4(finalColor, alpha);
      }
    `;
    
    // Use shader library to process includes
    const processedShaders = createShaderWithLibrary(vertexShader, fragmentShader);
    
    // Create time slow material
    this.timeSlowMaterial = new THREE.ShaderMaterial({
      vertexShader: processedShaders.vertexShader,
      fragmentShader: processedShaders.fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0xAFEEEE) }, // PaleTurquoise
        uOpacity: { value: 0.4 },
        uRippleSpeed: { value: 1.0 },
        uRippleWidth: { value: 0.2 },
        uRippleFrequency: { value: 6.0 }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    // Create circular plane for ripple effect
    const planeGeometry = new THREE.CircleGeometry(5.0, 64);
    planeGeometry.rotateX(-Math.PI / 2); // Align with ground
    
    // Create mesh and add to group
    const planeMesh = new THREE.Mesh(planeGeometry, this.timeSlowMaterial);
    planeMesh.position.set(0, -0.9, 0); // Position slightly below character
    group.add(planeMesh);
    
    return group;
  }
  
  /**
   * Deactivate time slow effect
   */
  private deactivateTimeSlowEffect(): void {
    if (this.timeSlowEffect && this.character) {
      this.character.remove(this.timeSlowEffect);
      
      // Dispose of all children
      this.timeSlowEffect.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
      
      if (this.timeSlowMaterial) {
        this.timeSlowMaterial.dispose();
        this.timeSlowMaterial = null;
      }
      
      this.timeSlowEffect = null;
    }
  }
  
  // SCORE MULTIPLIER EFFECT
  
  /**
   * Activate score multiplier effect
   */
  private activateScoreMultiplierEffect(): void {
    if (!this.character) return;
    
    if (!this.scoreMultiplierEffect) {
      const scoreMultiplierMesh = this.createScoreMultiplierEffect();
      this.character.add(scoreMultiplierMesh);
      this.scoreMultiplierEffect = scoreMultiplierMesh;
    }
  }
  
  /**
   * Create score multiplier effect
   */
  private createScoreMultiplierEffect(): THREE.Mesh {
    // Score multiplier vertex shader with library includes
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      uniform float uTime;
      
      // Include animation utility
      #include <animation>
      
      void main() {
          vPosition = position;
          vNormal = normal;
          
          // Floating animation using oscillate function from animation library
          float floatY = oscillate(uTime, 2.0, 0.1, 0.0);
          
          // Rotation animation
          float angle = uTime * 0.5;
          mat3 rotationMatrix = mat3(
              cos(angle), 0.0, sin(angle),
              0.0, 1.0, 0.0,
              -sin(angle), 0.0, cos(angle)
          );
          
          vec3 pos = rotationMatrix * position;
          pos.y += floatY;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    // Score multiplier fragment shader with library includes
    const fragmentShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      uniform float uTime;
      uniform vec3 uColor;
      
      // Include utilities
      #include <animation>
      #include <lighting>
      #include <noise>
      
      void main() {
          // Calculate lighting using library function
          vec3 light = normalize(vec3(1.0, 1.0, 1.0));
          vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
          vec3 lightColor = vec3(1.0, 1.0, 1.0);
          float specularPower = 32.0;
          float specularIntensity = 0.5;
          
          vec3 litColor = calculateLighting(
            vNormal, 
            viewDir, 
            light, 
            lightColor,
            uColor,
            specularPower,
            specularIntensity
          );
          
          // Pulse effect using pulsate function
          float pulse = pulsate(uTime, 4.0, 0.8, 1.0);
          
          // Sparkle effect using noise
          float noiseVal = fbm(
              vec2(
                  vPosition.x * 10.0 + uTime * 5.0,
                  vPosition.y * 8.0 + vPosition.z * 15.0 + uTime * 3.0
              ),
              3, 0.7
          );
          
          float sparkle = step(0.95, noiseVal);
          
          // Final color
          vec3 finalColor = litColor * pulse + sparkle * vec3(1.0, 1.0, 1.0);
          
          gl_FragColor = vec4(finalColor, 0.8);
      }
    `;
    
    // Use shader library to process includes
    const processedShaders = createShaderWithLibrary(vertexShader, fragmentShader);
    
    // Create score multiplier material
    this.scoreMultiplierMaterial = new THREE.ShaderMaterial({
      vertexShader: processedShaders.vertexShader,
      fragmentShader: processedShaders.fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0xDA70D6) } // Orchid
      },
      transparent: true,
      depthWrite: true
    });
    
    // Create diamond geometry for score multiplier
    const geometry = new THREE.OctahedronGeometry(0.3, 1);
    
    // Position it above and slightly behind character
    const mesh = new THREE.Mesh(geometry, this.scoreMultiplierMaterial);
    mesh.position.set(0, 1.5, -0.5);
    
    return mesh;
  }
  
  /**
   * Deactivate score multiplier effect
   */
  private deactivateScoreMultiplierEffect(): void {
    if (this.scoreMultiplierEffect && this.character) {
      this.character.remove(this.scoreMultiplierEffect);
      this.scoreMultiplierEffect.geometry.dispose();
      if (this.scoreMultiplierMaterial) {
        this.scoreMultiplierMaterial.dispose();
        this.scoreMultiplierMaterial = null;
      }
      this.scoreMultiplierEffect = null;
    }
  }
}
import * as THREE from 'three';
import eventBus from '../../core/EventSystem';
import { CollectibleType } from './CollectibleManager';

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
    // Shield vertex shader
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vFresnelFactor;
      uniform float uTime;
      uniform float uNoiseAmount; // How much noise deforms the shield

      // Simplex noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        // First corner
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        // x0 = x0 - 0.0 + 0.0 * C.xxx;
        // x1 = x0 - i1 + 1.0 * C.xxx;
        // x2 = x0 - i2 + 2.0 * C.xxx;
        // x3 = x0 - 1.0 + 3.0 * C.xxx;
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
        vec3 x3 = x0 - D.yyy; // -1.0+3.0*C.x = -0.5 = -D.y
        
        // Permutations
        i = mod289(i);
        vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
        // Gradients: 7x7 points over a square, mapped onto an octahedron.
        // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
        float n_ = 0.142857142857; // 1.0/7.0
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z); // mod(p,7*7)
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_); // mod(j,N)
        
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        // Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      void main() {
          vec3 pos = position;
          
          // Apply noise-based deformation
          float noise = snoise(
              vec3(pos.x * 2.0 + uTime * 0.3,
                   pos.y * 2.0 + uTime * 0.4,
                   pos.z * 2.0 + uTime * 0.2)
          ) * uNoiseAmount;
          pos += normal * noise; // Displace along normal
          
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          vec4 mvPosition = viewMatrix * worldPos;
          
          vNormal = normalize(normalMatrix * normal);
          
          // Fresnel calculation (view-dependent edge glow)
          vec3 viewVector = normalize(mvPosition.xyz);
          vFresnelFactor = pow(1.0 + dot(viewVector, vNormal), 4.0); 
          
          gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    // Shield fragment shader
    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vFresnelFactor;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPulseIntensity;
      
      // Simple hash function for noise
      float hashFS(vec2 p) { 
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); 
      }
      
      // Simple noise function
      float noiseFS(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f*f*(3.0-2.0*f); 
          float a = hashFS(i+vec2(0.,0.));
          float b = hashFS(i+vec2(1.,0.));
          float c = hashFS(i+vec2(0.,1.));
          float d = hashFS(i+vec2(1.,1.));
          return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
      }

      void main() {
          // Fresnel edge glow
          float fresnel = smoothstep(0.0, 1.0, vFresnelFactor) * 0.8 + 0.2;
          
          // Pulsating effect
          float pulse = sin(uTime * 4.0) * 0.5 + 0.5;
          float glow = 0.5 + pulse * uPulseIntensity;
          
          // Hexagonal grid pattern
          vec2 coord = vWorldPosition.xy * 2.5 + vec2(uTime * 0.1, -uTime * 0.05);
          float hexNoise = noiseFS(coord) + 0.5 * noiseFS(coord * 2.0) + 0.25 * noiseFS(coord * 4.0);
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
    
    // Create shield material
    this.shieldMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
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
    // Particle vertex shader
    const vertexShader = `
      attribute float aLifetime;
      attribute vec3 aVelocity;
      varying float vLifetime;
      
      uniform float uTime;
      uniform float uTravelDistance;
      
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
    
    // Particle fragment shader
    const fragmentShader = `
      varying float vLifetime;
      uniform vec3 uColor;
      
      void main() {
          // Create circular particles with smooth edges
          float dist = length(gl_PointCoord - vec2(0.5));
          float alpha = smoothstep(0.5, 0.4, dist);
          
          // Adjust alpha based on lifetime
          alpha *= smoothstep(0.0, 0.2, vLifetime) * (1.0 - smoothstep(0.5, 1.0, vLifetime));
          
          // Brighten center
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          
          gl_FragColor = vec4(uColor * strength * 1.5, alpha * 0.8);
      }
    `;
    
    // Create particle material
    this.speedBoostMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
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
    
    // Time slow vertex shader
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
    
    // Time slow fragment shader
    const fragmentShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uRippleSpeed;
      uniform float uRippleWidth;
      uniform float uRippleFrequency;
      
      void main() {
          // Time ripple effect - concentric rings emanating outward
          float dist = length(vPosition.xz);
          float ripple = sin(dist * uRippleFrequency - uTime * uRippleSpeed);
          
          // Create ring pattern with smooth edges
          float ring = smoothstep(0.0, uRippleWidth, abs(ripple));
          
          // Add slight wave to the entire plane
          float wave = sin(vUv.x * 10.0 + uTime) * sin(vUv.y * 10.0 + uTime) * 0.1;
          
          // Final color with ripple + wave effects
          vec3 finalColor = uColor * (0.4 + 0.6 * ring + wave);
          
          // Fade out at edges
          float edgeFade = 1.0 - smoothstep(0.8, 1.0, dist);
          float alpha = uOpacity * ring * edgeFade;
          
          gl_FragColor = vec4(finalColor, alpha);
      }
    `;
    
    // Create time slow material
    this.timeSlowMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
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
    // Score multiplier vertex shader
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      uniform float uTime;
      
      void main() {
          vPosition = position;
          vNormal = normal;
          
          // Floating animation
          float floatY = sin(uTime * 2.0) * 0.1;
          
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
    
    // Score multiplier fragment shader
    const fragmentShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      uniform float uTime;
      uniform vec3 uColor;
      
      void main() {
          // Calculate lighting
          vec3 light = normalize(vec3(1.0, 1.0, 1.0));
          float diffuse = max(0.0, dot(vNormal, light));
          
          // Pulse effect
          float pulse = 0.8 + 0.2 * sin(uTime * 4.0);
          
          // Sparkle effect
          float sparkle = 0.0;
          if (sin(uTime * 20.0 + vPosition.x * 10.0 + vPosition.y * 8.0 + vPosition.z * 15.0) > 0.95) {
              sparkle = 1.0;
          }
          
          // Final color
          vec3 finalColor = uColor * diffuse * pulse + sparkle * vec3(1.0, 1.0, 1.0);
          
          gl_FragColor = vec4(finalColor, 0.8);
      }
    `;
    
    // Create score multiplier material
    this.scoreMultiplierMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
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
import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';

interface ImpactParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  scale: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  color: THREE.Color;
}

export class ObstacleImpactParticleSystem {
  private particles: ImpactParticle[] = [];
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.ShaderMaterial;
  public points!: THREE.Points;
  private poolSize: number;
  private shaderManager: ShaderManager;
  private scene: THREE.Scene;

  // Attribute buffers
  private positions!: Float32Array;
  private scales!: Float32Array;
  private alphas!: Float32Array;
  private colors!: Float32Array;
  private rotations!: Float32Array;

  constructor(scene: THREE.Scene, shaderManager: ShaderManager, poolSize: number) {
    this.scene = scene;
    this.shaderManager = shaderManager;
    this.poolSize = poolSize;
    this.initialize();
  }

  private initialize(): void {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.poolSize * 3);
    this.scales = new Float32Array(this.poolSize);
    this.alphas = new Float32Array(this.poolSize);
    this.colors = new Float32Array(this.poolSize * 3);
    this.rotations = new Float32Array(this.poolSize);

    // Initialize with all particles offscreen and inactive
    for (let i = 0; i < this.poolSize; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -9999;
      this.positions[i * 3 + 2] = 0;
      this.scales[i] = 0;
      this.alphas[i] = 0;
      this.colors[i * 3] = 0.7;
      this.colors[i * 3 + 1] = 0.7;
      this.colors[i * 3 + 2] = 0.7;
      this.rotations[i] = 0;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.scales, 1));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aRotation', new THREE.BufferAttribute(this.rotations, 1));

    // Create debris material using shader manager
    const config = configSystem.get('visuals').obstacleImpactDebris;
    this.material = this.shaderManager.createShaderMaterial('impactDebrisShader', {
      uBaseColor: { value: new THREE.Color(config.color1) },
      uBaseSize: { value: config.particleSizeMax },
      uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
      uTime: { value: 0.0 },
    });

    if (!this.material) {
      console.error("ObstacleImpactParticleSystem: Failed to create impactDebrisShader. Using fallback material.");
      this.material = new THREE.PointsMaterial({ 
        size: 0.1, 
        color: 0x888888, 
        transparent: true, 
        opacity: 0.8
      }) as any;
    }

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = "ObstacleImpactParticles";
    this.scene.add(this.points);
  }

  public emit(position: THREE.Vector3, normal?: THREE.Vector3, customColor?: THREE.Color): void {
    const config = configSystem.get('visuals').obstacleImpactDebris;
    if (!config.enabled) return;

    // Use normal for directional burst, or default to upward burst
    const burstDirection = normal || new THREE.Vector3(0, 1, 0);
    
    // Emit a burst of particles
    for (let i = 0; i < config.burstCount; i++) {
      const particleIndex = this.findInactiveParticle();
      if (particleIndex === -1) continue;

      // Create cone-shaped burst around the normal
      const angle = Math.random() * Math.PI * 2;
      const spread = THREE.MathUtils.randFloat(0, config.spreadAngle * Math.PI / 180);
      
      // Create a random direction within the cone
      const randomDir = new THREE.Vector3(
        Math.sin(spread) * Math.cos(angle),
        Math.sin(spread) * Math.sin(angle),
        Math.cos(spread)
      );
      
      // Rotate to align with burst direction
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), burstDirection);
      randomDir.applyQuaternion(quaternion);
      
      const speed = THREE.MathUtils.randFloat(config.speedMin, config.speedMax);
      
      const particle: ImpactParticle = {
        position: position.clone(),
        velocity: randomDir.multiplyScalar(speed),
        lifetime: THREE.MathUtils.randFloat(config.lifetimeMin, config.lifetimeMax),
        maxLifetime: THREE.MathUtils.randFloat(config.lifetimeMin, config.lifetimeMax),
        scale: THREE.MathUtils.randFloat(config.particleSizeMin, config.particleSizeMax),
        alpha: config.opacityStart || 1.0,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: THREE.MathUtils.randFloatSpread(5.0),
        color: customColor || new THREE.Color(
          i % 2 === 0 ? config.color1 : (config.color2 || config.color1)
        ),
      };

      this.particles[particleIndex] = particle;
    }
  }

  private findInactiveParticle(): number {
    // Find a dead particle to reuse
    let index = this.particles.findIndex(p => !p || p.lifetime <= 0);
    if (index === -1 && this.particles.length < this.poolSize) {
      index = this.particles.length;
      this.particles.push({} as ImpactParticle);
    }
    return index;
  }

  public update(deltaTime: number): void {
    const config = configSystem.get('visuals').obstacleImpactDebris;
    if (!config.enabled) {
      if (this.points.visible) this.points.visible = false;
      return;
    }
    if (!this.points.visible) this.points.visible = true;

    // Update each active particle
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle || particle.lifetime <= 0) continue;

      particle.lifetime -= deltaTime;

      if (particle.lifetime <= 0) {
        // Hide particle
        this.alphas[i] = 0;
        this.scales[i] = 0;
        this.positions[i * 3 + 1] = -9999;
        continue;
      }

      // Update position
      particle.position.addScaledVector(particle.velocity, deltaTime);
      
      // Apply gravity
      if (config.gravity) {
        particle.velocity.y += config.gravity * deltaTime;
      }

      // Update rotation
      particle.rotation += particle.rotationSpeed * deltaTime;

      // Update alpha (fade out)
      const lifetimeRatio = particle.lifetime / particle.maxLifetime;
      particle.alpha = THREE.MathUtils.lerp(
        config.opacityEnd || 0,
        config.opacityStart || 1,
        lifetimeRatio
      );

      // Update scale (can shrink over time)
      particle.scale *= 0.98; // Slight shrinkage

      // Update buffers
      this.positions[i * 3] = particle.position.x;
      this.positions[i * 3 + 1] = particle.position.y;
      this.positions[i * 3 + 2] = particle.position.z;
      this.scales[i] = particle.scale;
      this.alphas[i] = particle.alpha;
      this.colors[i * 3] = particle.color.r;
      this.colors[i * 3 + 1] = particle.color.g;
      this.colors[i * 3 + 2] = particle.color.b;
      this.rotations[i] = particle.rotation;
    }

    // Update geometry attributes
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aScale.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
    this.geometry.attributes.aRotation.needsUpdate = true;

    // Update material uniforms if needed
    if (this.material.type === 'ShaderMaterial' && this.material.uniforms) {
      const mat = this.material as THREE.ShaderMaterial;
      if (mat.uniforms.uBaseSize) {
        mat.uniforms.uBaseSize.value = config.particleSizeMax;
      }
      if (mat.uniforms.uTime) {
        mat.uniforms.uTime.value += deltaTime;
      }
    }
  }

  public dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    if (this.material instanceof THREE.Material) {
      this.material.dispose();
    }
  }
}
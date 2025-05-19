import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';

// Particle arrays for performance
interface ParticleArrays {
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  sizes: Float32Array;
  colors: Float32Array;
  alphas: Float32Array;
  rotations: Float32Array;
}

interface DebrisParticle {
  active: boolean;
  lifetime: number;
  maxLifetime: number;
  velocity: THREE.Vector3;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export class ObstacleImpactParticleSystem {
  private points?: THREE.Points;
  private particles: DebrisParticle[] = [];
  private poolSize: number = 0;
  private arrays: ParticleArrays;
  private geometry?: THREE.BufferGeometry;
  private material?: THREE.ShaderMaterial;
  private poolPointer: number = 0;

  constructor(private scene: THREE.Scene, private shaderManager: ShaderManager) {
    const cfg = (configSystem.get('visuals') as any).obstacleImpactDebris || {};
    this.poolSize = cfg.poolSize || 60;
    
    // Initialize arrays
    this.arrays = {
      positions: new Float32Array(this.poolSize * 3),
      velocities: new Float32Array(this.poolSize * 3),
      lifetimes: new Float32Array(this.poolSize),
      sizes: new Float32Array(this.poolSize),
      colors: new Float32Array(this.poolSize * 3),
      alphas: new Float32Array(this.poolSize),
      rotations: new Float32Array(this.poolSize)
    };
    
    if (cfg.enabled !== false) {
      this.initialize();
    }
  }

  private initialize(): void {
    this.geometry = new THREE.BufferGeometry();
    
    // Set attributes
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.arrays.positions, 3));
    this.geometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.arrays.velocities, 3));
    this.geometry.setAttribute('aLifetime', new THREE.BufferAttribute(this.arrays.lifetimes, 1));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.arrays.sizes, 1));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.arrays.colors, 3));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.arrays.alphas, 1));
    this.geometry.setAttribute('aRotation', new THREE.BufferAttribute(this.arrays.rotations, 1));
    
    // Create shader material with fallback
    try {
      if (this.shaderManager.createDebrisParticleMaterial) {
        this.material = this.shaderManager.createDebrisParticleMaterial();
      } else {
        // Fallback material
        this.material = new THREE.PointsMaterial({
          color: 0x888888,
          size: 0.08,
          transparent: true,
          blending: THREE.NormalBlending
        });
      }
    } catch (error) {
      console.warn("Failed to create debris shader material, using fallback", error);
      // Simple fallback
      this.material = new THREE.PointsMaterial({
        color: 0x888888,
        size: 0.08,
        transparent: true
      });
    }
    
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = 'ObstacleImpactDebris';
    this.scene.add(this.points);
    
    // Initialize particles
    for (let i = 0; i < this.poolSize; i++) {
      this.particles[i] = {
        active: false,
        lifetime: 0,
        maxLifetime: 0,
        velocity: new THREE.Vector3(),
        size: 0,
        rotation: 0,
        rotationSpeed: 0
      };
      this.resetParticle(i);
    }
  }

  private resetParticle(index: number): void {
    this.particles[index].active = false;
    this.arrays.positions[index * 3 + 1] = -9999;
    this.arrays.alphas[index] = 0;
    this.arrays.sizes[index] = 0;
  }

  public emit(origin: THREE.Vector3, count?: number, color?: THREE.Color): void {
    if (!this.points || !this.arrays.positions) return;
    
    const cfg = (configSystem.get('visuals') as any).obstacleImpactDebris || {};
    const burstCount = count ?? cfg.burstCount ?? 15;
    
    for (let i = 0; i < burstCount; i++) {
      const index = this.poolPointer;
      this.poolPointer = (this.poolPointer + 1) % this.poolSize;
      
      const particle = this.particles[index];
      particle.active = true;
      particle.lifetime = THREE.MathUtils.randFloat(cfg.lifetimeMin || 0.3, cfg.lifetimeMax || 0.8);
      particle.maxLifetime = particle.lifetime;
      
      // Position with small random offset
      this.arrays.positions[index * 3] = origin.x + THREE.MathUtils.randFloatSpread(0.1);
      this.arrays.positions[index * 3 + 1] = origin.y + THREE.MathUtils.randFloatSpread(0.1);
      this.arrays.positions[index * 3 + 2] = origin.z + THREE.MathUtils.randFloatSpread(0.1);
      
      // Velocity - explosive outward with upward bias
      const spreadAngle = (cfg.spreadAngle || 90) * Math.PI / 180;
      const theta = Math.random() * spreadAngle - spreadAngle / 2;
      const phi = Math.random() * Math.PI * 2;
      
      const speed = THREE.MathUtils.randFloat(cfg.speedMin || 1.5, cfg.speedMax || 3.5);
      particle.velocity.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(theta) * speed + 1, // Upward bias
        Math.cos(phi) * Math.cos(theta) * speed
      );
      
      // Size
      particle.size = THREE.MathUtils.randFloat(cfg.particleSizeMin || 0.02, cfg.particleSizeMax || 0.08);
      this.arrays.sizes[index] = particle.size;
      
      // Color - use provided color or default gray/brown debris
      if (color) {
        this.arrays.colors[index * 3] = color.r;
        this.arrays.colors[index * 3 + 1] = color.g;
        this.arrays.colors[index * 3 + 2] = color.b;
      } else {
        const shade = THREE.MathUtils.randFloat(0.3, 0.6);
        this.arrays.colors[index * 3] = shade;
        this.arrays.colors[index * 3 + 1] = shade * 0.9;
        this.arrays.colors[index * 3 + 2] = shade * 0.8;
      }
      
      // Rotation
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = THREE.MathUtils.randFloatSpread(cfg.rotationSpeed || 8);
      this.arrays.rotations[index] = particle.rotation;
      
      // Alpha
      this.arrays.alphas[index] = cfg.opacityStart || 0.8;
      
      // Set initial velocity in buffer
      this.arrays.velocities[index * 3] = particle.velocity.x;
      this.arrays.velocities[index * 3 + 1] = particle.velocity.y;
      this.arrays.velocities[index * 3 + 2] = particle.velocity.z;
      
      // Lifetime
      this.arrays.lifetimes[index] = particle.lifetime;
    }
    
    this.updateBuffers();
  }

  public update(deltaTime: number): void {
    if (!this.points || !this.arrays.positions) return;
    
    const cfg = (configSystem.get('visuals') as any).obstacleImpactDebris || {};
    let needsUpdate = false;
    
    for (let i = 0; i < this.poolSize; i++) {
      const particle = this.particles[i];
      if (!particle.active) continue;
      
      particle.lifetime -= deltaTime;
      
      if (particle.lifetime <= 0) {
        this.resetParticle(i);
        needsUpdate = true;
        continue;
      }
      
      // Update position
      this.arrays.positions[i * 3] += particle.velocity.x * deltaTime;
      this.arrays.positions[i * 3 + 1] += particle.velocity.y * deltaTime;
      this.arrays.positions[i * 3 + 2] += particle.velocity.z * deltaTime;
      
      // Apply gravity and damping
      particle.velocity.y += (cfg.gravity || -9.8) * deltaTime;
      particle.velocity.x *= (1 - (cfg.damping || 0.5) * deltaTime);
      particle.velocity.z *= (1 - (cfg.damping || 0.5) * deltaTime);
      
      // Update velocity buffer
      this.arrays.velocities[i * 3] = particle.velocity.x;
      this.arrays.velocities[i * 3 + 1] = particle.velocity.y;
      this.arrays.velocities[i * 3 + 2] = particle.velocity.z;
      
      // Update rotation
      particle.rotation += particle.rotationSpeed * deltaTime;
      this.arrays.rotations[i] = particle.rotation;
      
      // Update alpha (fade out)
      const lifetimeRatio = particle.lifetime / particle.maxLifetime;
      this.arrays.alphas[i] = lifetimeRatio * (cfg.opacityStart || 0.8);
      
      // Update size (shrink slightly)
      this.arrays.sizes[i] = particle.size * (0.5 + 0.5 * lifetimeRatio);
      
      // Update lifetime buffer
      this.arrays.lifetimes[i] = lifetimeRatio;
      
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      this.updateBuffers();
    }
  }

  private updateBuffers(): void {
    if (!this.geometry) return;
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aVelocity.needsUpdate = true;
    this.geometry.attributes.aLifetime.needsUpdate = true;
    this.geometry.attributes.aSize.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
    this.geometry.attributes.aRotation.needsUpdate = true;
  }

  public reset(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.resetParticle(i);
    }
    this.updateBuffers();
  }

  public dispose(): void {
    if (this.points) {
      this.scene.remove(this.points);
    }
    this.geometry?.dispose();
    this.material?.dispose();
  }
}
import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';

// Particle arrays for performance
interface ParticleArrays {
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  scales: Float32Array;
  colors: Float32Array;
  alphas: Float32Array;
  rotations: Float32Array;
}

interface SparkleParticle {
  active: boolean;
  lifetime: number;
  maxLifetime: number;
  velocity: THREE.Vector3;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export class CollectiblePickupParticleSystem {
  private points?: THREE.Points;
  private particles: SparkleParticle[] = [];
  private poolSize: number = 0;
  private arrays: ParticleArrays;
  private geometry?: THREE.BufferGeometry;
  private material?: THREE.ShaderMaterial;
  private poolPointer: number = 0;

  constructor(private scene: THREE.Scene, private shaderManager: ShaderManager) {
    const cfg = (configSystem.get('visuals') as any).collectibleSparks || {};
    this.poolSize = cfg.poolSize || 50;
    
    // Initialize arrays
    this.arrays = {
      positions: new Float32Array(this.poolSize * 3),
      velocities: new Float32Array(this.poolSize * 3),
      lifetimes: new Float32Array(this.poolSize),
      scales: new Float32Array(this.poolSize),
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
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.arrays.scales, 1));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.arrays.colors, 3));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.arrays.alphas, 1));
    this.geometry.setAttribute('aRotation', new THREE.BufferAttribute(this.arrays.rotations, 1));
    
    // Create shader material with fallback
    try {
      if (this.shaderManager.createSparkleParticleMaterial) {
        this.material = this.shaderManager.createSparkleParticleMaterial();
      } else {
        // Simple fallback if shader creation method is unavailable
        this.material = new THREE.PointsMaterial({
          color: 0xffff00,
          size: 0.1,
          transparent: true,
          blending: THREE.AdditiveBlending
        });
      }
    } catch (error) {
      console.warn("Failed to create sparkle shader material, using fallback", error);
      // Fallback to basic material
      this.material = new THREE.PointsMaterial({
        color: 0xffff00,
        size: 0.1,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
    }
    
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = 'CollectiblePickupSparks';
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
    this.arrays.scales[index] = 0;
  }

  public emit(origin: THREE.Vector3, count?: number, color?: THREE.Color): void {
    if (!this.points || !this.arrays.positions) return;
    
    const cfg = (configSystem.get('visuals') as any).collectibleSparks || {};
    const burstCount = count ?? cfg.burstCount ?? 10;
    
    for (let i = 0; i < burstCount; i++) {
      const index = this.poolPointer;
      this.poolPointer = (this.poolPointer + 1) % this.poolSize;
      
      const particle = this.particles[index];
      particle.active = true;
      particle.lifetime = THREE.MathUtils.randFloat(cfg.lifetimeMin || 0.2, cfg.lifetimeMax || 0.6);
      particle.maxLifetime = particle.lifetime;
      
      // Position
      this.arrays.positions[index * 3] = origin.x;
      this.arrays.positions[index * 3 + 1] = origin.y;
      this.arrays.positions[index * 3 + 2] = origin.z;
      
      // Velocity - upward spread
      const spreadAngle = (cfg.spreadAngle || 360) * Math.PI / 180;
      const theta = Math.random() * spreadAngle;
      const phi = Math.random() * Math.PI * 2;
      
      const speed = THREE.MathUtils.randFloat(cfg.speedMin || 0.8, cfg.speedMax || 2.2);
      particle.velocity.set(
        Math.sin(theta) * Math.cos(phi) * speed,
        Math.abs(Math.cos(theta)) * speed,
        Math.sin(theta) * Math.sin(phi) * speed
      );
      
      // Size
      particle.size = THREE.MathUtils.randFloat(cfg.particleSizeMin || 0.04, cfg.particleSizeMax || 0.12);
      this.arrays.scales[index] = particle.size;
      
      // Color
      let particleColor: THREE.Color;
      if (color) {
        particleColor = color.clone();
      } else {
        const useColor1 = Math.random() > 0.5;
        particleColor = new THREE.Color(useColor1 ? (cfg.color1 || 0xFFF0A0) : (cfg.color2 || 0xFFD700));
      }
      this.arrays.colors[index * 3] = particleColor.r;
      this.arrays.colors[index * 3 + 1] = particleColor.g;
      this.arrays.colors[index * 3 + 2] = particleColor.b;
      
      // Rotation
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = THREE.MathUtils.randFloatSpread(cfg.rotationSpeed || 5);
      this.arrays.rotations[index] = particle.rotation;
      
      // Alpha
      this.arrays.alphas[index] = cfg.opacityStart || 0.9;
      
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
    
    const cfg = (configSystem.get('visuals') as any).collectibleSparks || {};
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
      
      // Apply gravity
      particle.velocity.y += (cfg.gravity || -2) * deltaTime;
      
      // Update velocity buffer
      this.arrays.velocities[i * 3] = particle.velocity.x;
      this.arrays.velocities[i * 3 + 1] = particle.velocity.y;
      this.arrays.velocities[i * 3 + 2] = particle.velocity.z;
      
      // Update rotation
      particle.rotation += particle.rotationSpeed * deltaTime;
      this.arrays.rotations[i] = particle.rotation;
      
      // Update alpha (fade out)
      const lifetimeRatio = particle.lifetime / particle.maxLifetime;
      this.arrays.alphas[i] = lifetimeRatio * (cfg.opacityStart || 0.9);
      
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
    this.geometry.attributes.aScale.needsUpdate = true;
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